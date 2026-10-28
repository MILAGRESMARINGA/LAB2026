import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../../supabase/migrations/202610270003_strong_portuguese_translation_layer.sql", import.meta.url),
  "utf8",
);
const translator = await readFile(new URL("../translate-strong-ptbr.py", import.meta.url), "utf8");
const builder = await readFile(new URL("../build-strong-ptbr-sql.mjs", import.meta.url), "utf8");

test("Portuguese Strong translations are a separate, reviewable layer", () => {
  assert.match(migration, /create table if not exists public\.strong_lexicon_translations/i);
  assert.match(migration, /locale text not null default 'pt-BR'/);
  assert.match(migration, /translation_status text not null default 'machine'/);
  assert.match(migration, /translation_method text not null default 'automatic-neural'/);
  assert.match(migration, /check \(locale in \('pt-BR'\)\)/);
  assert.match(migration, /enable row level security/i);
});

test("only published, approved parent releases can expose translations", () => {
  assert.match(migration, /r\.rights_status = 'approved'/);
  assert.match(migration, /r\.publication_status = 'published'/);
});

test("the generator preserves source data and uses a local neural model", () => {
  assert.match(translator, /translated_definition": None/);
  assert.match(translator, /translation_status": "machine"/);
  assert.match(translator, /Argos Translate en→pt; local neural model/);
  assert.match(translator, /ctranslate2\.Translator/);
  assert.match(translator, /EDITORIAL_OVERRIDES/);
});

test("reloads do not overwrite future human-reviewed translations", () => {
  assert.match(builder, /jsonb_to_recordset/);
  assert.match(builder, /on conflict \(release_id, strong_number, locale\) do update/i);
  assert.match(builder, /where public\.strong_lexicon_translations\.translation_status = 'machine'/);
});
