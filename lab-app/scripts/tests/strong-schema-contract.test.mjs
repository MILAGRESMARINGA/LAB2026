import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const migrationPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../supabase/migrations/20261024020616_lab_strong_canonical_study_foundation.sql',
);
const sql = await readFile(migrationPath, 'utf8');
const normalized = sql.toLowerCase();

test('Strong foundation is reproducible and protected by RLS', () => {
  for (const table of [
    'strong_lexicon_releases',
    'strong_hebrew',
    'strong_greek',
    'strong_tagging_releases',
    'verse_strong_links',
  ]) {
    assert.ok(normalized.includes(`create table if not exists public.${table}`));
    assert.ok(normalized.includes(`alter table public.${table} enable row level security`));
  }
  assert.ok(normalized.includes('references public.lab_bible_verses'));
  assert.ok(normalized.includes("review_status = 'approved'"));
  assert.ok(normalized.includes("publication_status = 'published'"));
  assert.ok(normalized.includes("rights_status in ('approved', 'public_domain')"));
});

test('Strong data is readable only by authenticated users after publication gates', () => {
  assert.match(normalized, /revoke all on table[\s\S]+from public, anon, authenticated/);
  assert.match(normalized, /grant select on table[\s\S]+to authenticated/);
  assert.doesNotMatch(normalized, /grant[\s\S]+to anon/);
  assert.match(normalized, /for select to authenticated/);
});

test('trusted ingestion permissions are explicit and do not touch secrets', () => {
  assert.match(normalized, /grant select, insert, update on table[\s\S]+to service_role/);
  assert.doesNotMatch(normalized, /alter role|create secret|vault\./);
  assert.doesNotMatch(normalized, /grant[\s\S]+delete[\s\S]+to service_role/);
});
