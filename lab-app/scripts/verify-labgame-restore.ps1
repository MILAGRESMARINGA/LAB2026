# LABGAME P0 — isolated restore drill of a locally captured pg_dump archive.
# No live Supabase SQL, no billing, no upload, no modification to an existing DB.
# Run on your own PC, with PostgreSQL 17 local installed and compatible extensions/roles.
# Example:
# pwsh -File ./scripts/verify-labgame-restore.ps1 -ArchivePath "$HOME/LABGAME-backups/LABGAME-full-....dump"
[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][string]$ArchivePath,
 [ValidateRange(1,65535)][int]$LocalPort=5432,
 [string]$LocalUser="postgres",
 [string]$DatabaseName=("labgame_restore_verify_"+(Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss"))
)
Set-StrictMode -Version Latest
$ErrorActionPreference="Stop"
$localHost="127.0.0.1"
if($DatabaseName -notmatch '^labgame_restore_verify_[a-z0-9_]{4,40}$') {
 throw "Nome do banco de ensaio inválido; só é permitido labgame_restore_verify_..."
}
if($LocalUser -ne "postgres") { throw "Somente usuário postgres LOCAL é aceito." }
foreach($command in @("createdb","pg_restore","psql")) {
 if(-not(Get-Command $command -ErrorAction SilentlyContinue)) {
  throw "Ferramenta PostgreSQL ausente: $command"
 }
}
$archive=(Resolve-Path -LiteralPath $ArchivePath -ErrorAction Stop).Path
if($archive -notmatch '\.dump$') { throw "Arquivo deve ser pg_dump .dump." }
$manifest=$archive -replace '\.dump$','.manifest.json'
if(-not(Test-Path -LiteralPath $manifest -PathType Leaf)){
 throw "Manifesto correspondente ausente: $manifest"
}
$meta=Get-Content -LiteralPath $manifest -Raw | ConvertFrom-Json
if($meta.project_ref -ne "azejfxvaamgkmfmwdzjn" -or $meta.project -ne "LABGAME"){
 throw "Manifesto não pertence ao LABGAME; abortado."
}
$hash=(Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash
if($meta.sha256 -ne $hash){ throw "SHA256 não confere. Archive não confiável." }
$localPassword=Read-Host "Senha do PostgreSQL LOCAL (nunca a senha Supabase)" -AsSecureString
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($localPassword)
$prior=$env:PGPASSWORD
$verified=$false
try{
 $env:PGPASSWORD=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
 $connect=@("--host=$localHost","--port=$LocalPort","--username=$LocalUser","--no-password")
 $check=@(& psql @connect "--dbname=postgres" "--tuples-only" "--no-align" "-v" "ON_ERROR_STOP=1" "-c" "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname='$DatabaseName');")
 if($LASTEXITCODE -ne 0){ throw "Não foi possível verificar o PostgreSQL LOCAL." }
 if(($check -join "").Trim() -ne "f"){ throw "O banco de teste já existe. Nenhum banco existente será sobrescrito." }
 & createdb @connect "--encoding=UTF8" "--template=template0" $DatabaseName
 if($LASTEXITCODE -ne 0){throw "Não foi possível criar o banco LOCAL temporário."}
 Write-Host "Restaurando SOMENTE no banco local $DatabaseName. Nenhum DROP será executado."
 & pg_restore @connect "--dbname=$DatabaseName" "--exit-on-error" "--no-owner" "--no-privileges" $archive
 if($LASTEXITCODE -ne 0){
  throw "Falha no restore: banco local permanece para diagnóstico; manifesto NÃO será aprovado."
 }
 $sql="SELECT (SELECT COUNT(*) FROM auth.users)," +
      "(SELECT COUNT(*) FROM public.lab_bible_chapters)," +
      "(SELECT COUNT(*) FROM public.lab_bible_verses)," +
      "(SELECT COUNT(DISTINCT day_number) FROM public.lab_game_plan_chapters)," +
      "(SELECT COUNT(*) FROM public.reading_groups)," +
      "(SELECT COUNT(*) FROM public.lab_game_runs);"
 $raw=@(& psql @connect "--dbname=$DatabaseName" "--tuples-only" "--no-align" "--field-separator=|" "-v" "ON_ERROR_STOP=1" "-c" $sql)
 if($LASTEXITCODE -ne 0){ throw "Consulta de integridade do banco restaurado falhou." }
 $line=($raw -join "").Trim()
 $values=$line.Split("|")
 if($values.Count -ne 6){throw "Totais de tabelas inesperados no ensaio de restore."}
 $nums=@($values | ForEach-Object {[long]::Parse($_.Trim())})
 if($nums[0] -lt 1 -or $nums[1] -ne 1189 -or $nums[2] -ne 31101 -or
    $nums[3] -ne 365 -or $nums[4] -lt 1 -or $nums[5] -lt 1){
  throw "Contagens inconsistentes. Não autorize as migrações P0."
 }
 # Only SUCCESS after a full restore and critical queries, never after a list-only test.
 $meta.restore_drill_verified=$true
 $meta.status="RESTORE_DRILL_VERIFIED"
 $meta | Add-Member -NotePropertyName "restored_at_utc" -NotePropertyValue ((Get-Date).ToUniversalTime().ToString("o")) -Force
 $meta | Add-Member -NotePropertyName "local_database" -NotePropertyValue $DatabaseName -Force
 $meta | Add-Member -NotePropertyName "verified_counts" -NotePropertyValue ([ordered]@{
  auth_users=$nums[0];bible_chapters=$nums[1];bible_verses=$nums[2];
  reading_days=$nums[3];groups=$nums[4];journeys=$nums[5]
 }) -Force
 $meta | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifest -Encoding UTF8
 $verified=$true
 Write-Host "RESTORE VALIDADO: 1189 capítulos, 31101 versículos, 365 dias e contas/jornadas/GCs presentes."
 Write-Host "Manifesto atualizado: $manifest"
 Write-Host "Banco local de ensaio preservado: $DatabaseName"
 Write-Warning "O banco RESTAURADO contém dados pessoais; proteja-o com acesso restrito."
}
finally{
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
 if($null -eq $prior){Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue}
 else{$env:PGPASSWORD=$prior}
 if(-not $verified){Write-Warning "Nenhuma restauração foi homologada. Não execute migrações P0 de produção."}
}
