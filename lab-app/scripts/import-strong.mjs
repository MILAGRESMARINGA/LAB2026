/**
 * Protected Strong lexicon importer.
 *
 * Usage (trusted job only):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-strong.mjs
 *
 * The source is fetched from the pinned STEPBible revision, hashed before
 * insertion, and remains in draft until all validation gates pass.
 */
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const sources = [
  {
    name: "STEPBible TBESH",
    language: "hebrew",
    sourceUrl: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew%20-%20STEPBible.org%20CC%20BY.txt",
    revision: "master @ a64990a674d13245ae1e9ed426bc69197c2fbad5",
    table: "strong_hebrew",
  },
  {
    name: "STEPBible TBESG",
    language: "greek",
    sourceUrl: "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt",
    revision: "master @ efe271a1dbb73fa01f8fa6e0f164c6687757a9ae",
    table: "strong_greek",
  },
];

function parseLines(text, language) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/\b([HG]\d{1,4})\b/);
    if (!match) continue;
    const number = match[1];
    if (language === "hebrew" && !number.startsWith("H")) continue;
    if (language === "greek" && !number.startsWith("G")) continue;
    const fields = line.split("\t").map((v) => v.trim());
    rows.push({ strong_number: number, lemma: fields[1] || null, transliteration: fields[2] || null, glosses: fields.slice(3).join(" | ") || null, definition: line });
  }
  const unique = new Map(rows.map((row) => [row.strong_number, row]));
  return [...unique.values()];
}

for (const source of sources) {
  const response = await fetch(source.sourceUrl);
  if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  const rows = parseLines(bytes.toString("utf8"), source.language);
  if (rows.length < 1000) throw new Error(`${source.name}: suspiciously low parsed count ${rows.length}`);

  const { data: release, error: releaseError } = await db
    .from("strong_lexicon_releases")
    .upsert({ source_name: source.name, source_url: source.sourceUrl, source_revision: source.revision, license_name: "CC BY 4.0", license_url: "https://creativecommons.org/licenses/by/4.0/", attribution: "STEPBible.org / Tyndale House", artifact_sha256: sha, rights_status: "approved", publication_status: "draft" }, { onConflict: "source_url,artifact_sha256" })
    .select("id")
    .single();
  if (releaseError) throw releaseError;

  const payload = rows.map((row) => ({ ...row, release_id: release.id, language: source.language }));
  for (let offset = 0; offset < payload.length; offset += 500) {
    const { error } = await db.from(source.table).upsert(payload.slice(offset, offset + 500), { onConflict: "release_id,strong_number" });
    if (error) throw error;
  }
  console.log(`${source.name}: ${rows.length} entries, sha256=${sha}, status=draft`);
}
