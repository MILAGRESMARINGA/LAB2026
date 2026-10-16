# LABGAME — backup lógico antes de migrações P0 (PowerShell 7 / Windows)
# Requer PostgreSQL 17 client tools: pg_dump e pg_restore.
# Conecta SOMENTE ao Supabase LABGAME. Não envia senha ao GitHub ou ChatGPT.
# NÃO restaura, altera, apaga, atualiza ou executa migrações no banco.
# Uso: pwsh -File ./scripts/backup-labgame.ps1
# Para conexão por session pooler: -DbHost ... -DbUser postgres.azejfxvaamgkmfmwdzjn.
[CmdletBinding()]
param(
 [string]$DbHost = "db.azejfxvaamgkmfmwdzjn.supabase.co",
 [ValidateRange(1,65535)][int]$DbPort = 5432,
 [string]$DbUser = "postgres",
 [string]$OutputDirectory = (Join-Path $HOME "LABGAME-backups")
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$projectRef = "azejfxvaamgkmfmwdzjn"
# Host of direct connection OR Supabase session pooler. Ref in pooler username.
if (
 ($DbHost -ne "db.$projectRef.supabase.co" -and $DbHost -notmatch "^[a-z0-9.-]+\.pooler\.supabase\.com$") -or
 ($DbUser -ne "postgres" -and $DbUser -ne "postgres.$projectRef") -or
 ($DbHost -like "*.pooler.supabase.com" -and $DbUser -ne "postgres.$projectRef")
) {
 throw "Destino não reconhecido como LABGAME. Revise host e usuário; CRMIMOBI é proibido."
}
foreach($tool in @("pg_dump","pg_restore")) {
 if(-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
  throw "Instale o cliente PostgreSQL 17 e disponibilize $tool no PATH do terminal."
 }
}
$versionText = (& pg_dump --version) -join ""
if($LASTEXITCODE -ne 0 -or $versionText -notmatch "PostgreSQL\) 17\.") {
 throw "O cliente pg_dump precisa ser versão 17 para o servidor PostgreSQL 17. Encontrado: $versionText"
}
if($env:PGPASSWORD) {
 throw "PGPASSWORD já definido neste terminal. Feche o terminal e execute novamente sem credenciais persistentes."
}
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")
$archive = Join-Path $OutputDirectory "LABGAME-full-$stamp.dump"
$manifest = Join-Path $OutputDirectory "LABGAME-full-$stamp.manifest.json"
$secret = Read-Host "Digite a senha POSTGRES do Supabase LABGAME (não compartilhe)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
$oldSslMode = $env:PGSSLMODE
try {
 $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
 $env:PGSSLMODE = "require"
 Write-Host "Iniciando backup de TODOS os schemas acessíveis do banco LABGAME..."
 $arguments=@("--host=$DbHost","--port=$DbPort","--username=$DbUser","--dbname=postgres","--format=custom","--no-password","--file=$archive")
 & pg_dump @arguments
 if($LASTEXITCODE -ne 0) { throw "pg_dump falhou: NÃO aplique a migração." }
 if(-not (Test-Path -LiteralPath $archive -PathType Leaf)) { throw "Arquivo de backup não encontrado." }
 $size = (Get-Item -LiteralPath $archive).Length
 if($size -lt 100000) { throw "Backup suspeito: arquivo menor que 100 KB. NÃO aplique a migração." }
 $inventory = @(& pg_restore --list $archive)
 if($LASTEXITCODE -ne 0) { throw "pg_restore não consegue listar o backup. NÃO aplique a migração." }
 $objects = ($inventory -join [Environment]::NewLine)
 foreach($required in @(
  "TABLE DATA auth users",
  "TABLE DATA public lab_game_plan_chapters",
  "TABLE DATA public lab_bible_chapters",
  "TABLE DATA public lab_bible_verses",
  "TABLE DATA public reading_groups",
  "TABLE DATA public lab_game_stats"
 )) {
  if(-not $objects.Contains($required)) {
   throw "Backup incompleto: objeto '$required' ausente. NÃO aplique a migração."
  }
 }
 $hash=(Get-FileHash -Algorithm SHA256 -LiteralPath $archive).Hash
 $meta=[ordered]@{
  project="LABGAME"
  project_ref=$projectRef
  generated_at_utc=(Get-Date).ToUniversalTime().ToString("o")
  hostname=$DbHost
  filename=(Split-Path -Leaf $archive)
  bytes=$size
  sha256=$hash
  inventory_verified=$true
  restore_drill_verified=$false
  status="BACKUP_CREATED_NOT_RESTORED"
 }
 $meta | ConvertTo-Json | Set-Content -LiteralPath $manifest -Encoding UTF8
 Write-Host "Backup criado e inventário verificado."
 Write-Host "Arquivo: $archive"
 Write-Host "Manifesto: $manifest"
 Write-Host "SHA-256: $hash"
 Write-Warning "Inventário e checksum NÃO substituem um teste de restauração em banco isolado."
 Write-Warning "Não envie o arquivo .dump nem as credenciais pelo ChatGPT, e não faça commit desses arquivos."
}
finally {
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
 Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
 if($null -eq $oldSslMode) { Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue }
 else { $env:PGSSLMODE = $oldSslMode }
}
