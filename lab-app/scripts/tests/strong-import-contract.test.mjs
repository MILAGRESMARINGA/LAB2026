import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const importerPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../import-strong.mjs',
);
const source = await readFile(importerPath, 'utf8');

test('Strong importer uses immutable source revisions and supports secret-free dry runs', () => {
  assert.match(source, /raw\.githubusercontent\.com\/STEPBible\/STEPBible-Data\/[a-f0-9]{40}\//g);
  assert.match(source, /IMPORT_DRY_RUN === "1"/);
  assert.match(source, /if \(!dryRun && \(!url \|\| !key\)\)/);
  assert.match(source, /canonical-fields-v2/);
});

test('Strong importer reads canonical lexical columns and validates required lemmas before database writes', () => {
  assert.match(source, /const lemma = fields\[3\] \|\| ""/);
  assert.match(source, /if \(!lemma\) continue/);
  assert.match(source, /validateRows\(rows, source\.language, source\.name\)/);
});

test('reprocessing an existing artifact preserves its publication status', () => {
  assert.match(source, /select\("id, rights_status, publication_status"\)/);
  assert.match(source, /maybeSingle\(\)/);
  assert.doesNotMatch(
    source,
    /\.upsert\(\{[^}]*publication_status:\s*"draft"/s,
  );
});
