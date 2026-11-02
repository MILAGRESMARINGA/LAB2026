import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(new URL('../../../.github/workflows/lab-ci.yml',import.meta.url),'utf8');

test('ephemeral Supabase commands use the reviewed CLI instead of floating major upgrades',()=>{
 assert.doesNotMatch(workflow,/supabase@latest/);
 const calls=[...workflow.matchAll(/npx --yes supabase@([^\s]+)/g)].map(match=>match[1]);
 assert.ok(calls.length>=8);
 assert.ok(calls.every(version=>version==='2.121.0'));
 assert.match(workflow,/Failed to boot ephemeral Supabase; never fall back to production/);
});

test('journey editorial migration and smoke run against a separate PG16 and PG17 database',()=>{
 const postgresJob=workflow.slice(workflow.indexOf('  v2-postgres:'),workflow.indexOf('  supabase-local-auth:'));
 assert.match(postgresJob,/postgres: \['16', '17'\]/);
 assert.match(postgresJob,/createdb[^\n]+labgame_journey_ci/);
 assert.match(postgresJob,/-d labgame_journey_ci -v ON_ERROR_STOP=1 -f supabase\/migrations\/20261102151833_journey_editorial_atlas\.sql/);
 assert.match(postgresJob,/-d labgame_journey_ci -v ON_ERROR_STOP=1 -f scripts\/tests\/journey-editorial-smoke\.sql/);
 assert.doesNotMatch(postgresJob,/secrets\.|--linked|supabase db push/);
});
