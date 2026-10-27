/** Build protected, idempotent SQL batches from the local pt-BR translation export. */
import fs from "node:fs/promises";
import path from "node:path";

const workspace = path.resolve(new URL("..", import.meta.url).pathname, "../..");
const input = path.join(workspace, "stepdata", "translations", "pt-BR-strong-translations.json");
const outputDir = path.join(workspace, "stepdata", "translations", "sql");
const batchSize = Number(process.argv.find((arg) => arg.startsWith("--batch-size="))?.split("=")[1] ?? 500);
const rows = JSON.parse(await fs.readFile(input, "utf8"));
await fs.mkdir(outputDir, { recursive: true });

for (let offset = 0; offset < rows.length; offset += batchSize) {
  const batch = rows.slice(offset, offset + batchSize);
  const payload = JSON.stringify(batch).replaceAll("'", "''");
  const sql = `with payload as (
  select *
  from jsonb_to_recordset('${payload}'::jsonb) as p(
    release_id uuid, strong_number text, locale text, translated_gloss text,
    translated_definition text, translation_status text, translation_method text,
    source_language text, source_gloss_sha256 text, provider text
  )
)
insert into public.strong_lexicon_translations (
  release_id, strong_number, locale, translated_gloss, translated_definition,
  translation_status, translation_method, source_language, source_gloss_sha256, provider
)
select release_id, strong_number, locale, translated_gloss, translated_definition,
  translation_status, translation_method, source_language, source_gloss_sha256, provider
from payload
on conflict (release_id, strong_number, locale) do update
set translated_gloss = excluded.translated_gloss,
    translated_definition = excluded.translated_definition,
    translation_status = excluded.translation_status,
    translation_method = excluded.translation_method,
    source_language = excluded.source_language,
    source_gloss_sha256 = excluded.source_gloss_sha256,
    provider = excluded.provider
where public.strong_lexicon_translations.translation_status = 'machine';
`;
  const number = String(offset / batchSize).padStart(3, "0");
  await fs.writeFile(path.join(outputDir, `strong-ptbr-${number}.sql`), sql);
}
console.log(`wrote ${Math.ceil(rows.length / batchSize)} SQL batches for ${rows.length} translations`);
