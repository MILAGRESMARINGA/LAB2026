import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const workflow=readFileSync(new URL("../../../.github/workflows/p0-backup-restore-gate.yml",import.meta.url),"utf8");

test("P0 release requires an explicit marker and verified PG17 restore before migrations",()=>{
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/paths:[\s\S]*\.github\/p0-release\.trigger/);
 assert.match(workflow,/head_commit\.message == 'release: p0 backup-restore-deploy'/);
 assert.match(workflow,/refs\/heads\/main/);
 assert.match(workflow,/azejfxvaamgkmfmwdzjn/g);
 assert.match(workflow,/secrets\.SUPABASE_DB_URL/);
 assert.match(workflow,/vars\.SUPABASE_PROJECT_REF/);
 assert.match(workflow,/pg_dump/);
 assert.match(workflow,/pg_restore/);
 assert.match(workflow,/postgres:17/);
 assert.match(workflow,/RESTORE_DRILL_VERIFIED/);
 assert.match(workflow,/restore_verified/);
 assert.match(workflow,/needs: backup-and-restore/);
 assert.match(workflow,/db push --linked --dry-run/);
 assert.match(workflow,/db push --linked --yes/);
 assert.match(workflow,/SUPABASE_ACCESS_TOKEN/);
 assert.match(workflow,/SUPABASE_DB_PASSWORD/);
 assert.match(workflow,/if: always\(\)/);
 assert.doesNotMatch(workflow,/upload-artifact/i);
 assert.doesNotMatch(workflow,/supabase\s+functions\s+deploy/i);
 assert.ok(workflow.indexOf("Confirm explicit trigger") < workflow.indexOf("pg_dump --schema=public"));
 assert.ok(workflow.indexOf("Fail closed before any Supabase CLI access") < workflow.indexOf("npx --yes supabase@latest link"));
 assert.equal(workflow.includes('--password "$SUPABASE_DB_PASSWORD"'),false);

});
