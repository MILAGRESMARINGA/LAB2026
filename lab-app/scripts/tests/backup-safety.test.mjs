import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const get=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
const backup=get("../backup-labgame.ps1");
const ignore=get("../../.gitignore");
const runbook=get("../../../docs/P0-DATABASE-BACKUP-AND-HARDENING.md");

test("backup is explicitly bound to LABGAME and rejects unrecognized DB target",()=>{
 assert.match(backup,/azejfxvaamgkmfmwdzjn/);
 assert.match(backup,/Destino não reconhecido como LABGAME/);
 assert.match(backup,/\$DbHost -ne "db\.\$projectRef\.supabase\.co"/);
 assert.match(backup,/\$DbUser -ne "postgres\.\$projectRef"/);
});
test("database copy is read-only and requires no plaintext credentials on argv",()=>{
 assert.match(backup,/pg_dump/);
 assert.match(backup,/pg_restore --list/);
 assert.match(backup,/Get-FileHash -Algorithm SHA256/);
 assert.match(backup,/Read-Host .* -AsSecureString/);
 assert.match(backup,/ZeroFreeBSTR/);
 assert.doesNotMatch(backup,/\b(?:psql|pg_restore\s+--clean|DROP DATABASE|CREATE DATABASE|apply_migration)\b/i);
});
test("backup artifacts are ignored by git and cannot be misrepresented as restore proof",()=>{
 for(const pattern of ["*.dump","*.backup","*.pgpass","LABGAME-backups/"]){
  assert.ok(ignore.includes(pattern),pattern+" must be ignored");
 }
 assert.match(runbook,/restauração em banco ISOLADO/i);
 // This runbook is intentionally updated after the verified P0 ACL migration.
 // Keep proof of the execution and never misrepresent the annual XP migration as applied.
 assert.match(runbook,/HARDENING ACL APLICADO E VERIFICADO EM PRODUÇÃO/);
 assert.match(runbook,/NÃO executada.*migração de bônus anual/i);
 assert.match(backup,/restore_drill_verified=\$false/);
});
