import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const backup=readFileSync(new URL("../../scripts/backup-labgame.ps1",import.meta.url),"utf8");
const restore=readFileSync(new URL("../../scripts/verify-labgame-restore.ps1",import.meta.url),"utf8");

test("full backup is only sourced from LABGAME and never writes server data",()=>{
 assert.match(backup,/azejfxvaamgkmfmwdzjn/);
 assert.match(backup,/pg_dump @arguments/);
 assert.match(backup,/restore_drill_verified=\$false/);
 assert.match(backup,/BACKUP_CREATED_NOT_RESTORED/);
});

test("restore drill never targets the remote host or an existing database",()=>{
 assert.match(restore,/\$localHost="127\.0\.0\.1"/);
 assert.match(restore,/labgame_restore_verify_/);
 assert.match(restore,/pg_database WHERE datname/);
 assert.match(restore,/O banco de teste já existe/);
 assert.doesNotMatch(restore,/dropdb\b/i);
 assert.doesNotMatch(restore,/pg_restore[^;\n]*db\.azejfxvaamgkmfmwdzjn/i);
});

test("only full restore plus canonical data checks marks release backup gate verified",()=>{
 assert.match(restore,/--exit-on-error/);
 assert.match(restore,/Get-FileHash -Algorithm SHA256/);
 assert.match(restore,/1189/);
 assert.match(restore,/31101/);
 assert.match(restore,/365/);
 assert.match(restore,/restore_drill_verified=\$true/);
 assert.match(restore,/RESTORE_DRILL_VERIFIED/);
 assert.match(restore,/ZeroFreeBSTR/);
});
