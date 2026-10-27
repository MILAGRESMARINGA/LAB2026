/**
 * Protected Strong lexicon importer.
 *
 * Usage (trusted job only):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-strong.mjs
 *   IMPORT_DRY_RUN=1 node scripts/import-strong.mjs
 *
 * The sources are fetched from immutable STEPBible commits, hashed before
 * insertion, and remain in draft until publication gates pass.
 */
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.env.IMPORT_DRY_RUN === "1";

if (!dryRun && (!url || !key)) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const db = dryRun
  ? null
  : createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

const sources = [
  {
    name: "STEPBible TBESH",
    language: "hebrew",
    sourceUrl:
      "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/48b7cfbda441adb6445ea565b4ed23dd98dfdf2e/Lexicons/TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew%20-%20STEPBible.org%20CC%20BY.txt",
    revision: "48b7cfbda441adb6445ea565b4ed23dd98dfdf2e; canonical-fields-v2",
    table: "strong_hebrew",
  },
  {
    name: "STEPBible TBESG",
    language: "greek",
    sourceUrl:
      "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/805360e477f2668119806241fb2eea07544b765e/Lexicons/TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt",
    revision: "805360e477f2668119806241fb2eea07544b765e; canonical-fields-v2",
    table: "strong_greek",
  },
];

export function parseLines(text, language) {
  const candidates = new Map();
  for (const line of text.split(/\r?\n/)) {
    const fields = line.split("\t").map((value) => value.trim());
    const match = fields[0]?.match(/^([HG])(\d{1,4})([a-zA-Z]*)$/);
    if (!match) continue;

    const number = `${match[1]}${Number(match[2])}`;
    if (language === "hebrew" && !number.startsWith("H")) continue;
    if (language === "greek" && !number.startsWith("G")) continue;

    const lemma = fields[3] || "";
    if (!lemma) continue;

    const suffix = match[3].toLowerCase();
    const candidate = {
      strong_number: number,
      lemma,
      transliteration: fields[4] || null,
      glosses: fields.slice(6).join(" | ") || null,
      definition: line,
      _priority: suffix === "" ? 0 : suffix === "a" ? 1 : 2,
    };
    const existing = candidates.get(number);
    if (!existing || candidate._priority < existing._priority) {
      candidates.set(number, candidate);
    }
  }

  return [...candidates.values()].map(({ _priority, ...row }) => row);
}

function validateRows(rows, language, sourceName) {
  if (rows.length < 1000) {
    throw new Error(`${sourceName}: suspiciously low parsed count ${rows.length}`);
  }
  for (const row of rows) {
    if (!row.lemma) throw new Error(`${sourceName}: empty lemma for ${row.strong_number}`);
    if (language === "hebrew" && !/^H\d{1,4}$/.test(row.strong_number)) {
      throw new Error(`${sourceName}: invalid Hebrew number ${row.strong_number}`);
    }
    if (language === "greek" && !/^G\d{1,4}$/.test(row.strong_number)) {
      throw new Error(`${sourceName}: invalid Greek number ${row.strong_number}`);
    }
  }
}

async function getOrCreateRelease(source, sha) {
  const existing = await db
    .from("strong_lexicon_releases")
    .select("id, rights_status, publication_status")
    .eq("source_url", source.sourceUrl)
    .eq("source_revision", source.revision)
    .eq("artifact_sha256", sha)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const created = await db
    .from("strong_lexicon_releases")
    .insert({
      source_name: source.name,
      source_url: source.sourceUrl,
      source_revision: source.revision,
      license_name: "CC BY 4.0",
      license_url: "https://creativecommons.org/licenses/by/4.0/",
      attribution: "STEPBible.org / Tyndale House",
      artifact_sha256: sha,
      rights_status: "approved",
      publication_status: "draft",
    })
    .select("id, rights_status, publication_status")
    .single();

  if (created.error) throw created.error;
  return created.data;
}

for (const source of sources) {
  const response = await fetch(source.sourceUrl);
  if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  const sha = crypto.createHash("sha256").update(bytes).digest("hex");
  const rows = parseLines(bytes.toString("utf8"), source.language);
  validateRows(rows, source.language, source.name);

  if (dryRun) {
    console.log(`${source.name}: ${rows.length} entries, sha256=${sha}, dry-run`);
    continue;
  }

  const release = await getOrCreateRelease(source, sha);
  const payload = rows.map((row) => ({
    ...row,
    release_id: release.id,
    language: source.language,
  }));

  for (let offset = 0; offset < payload.length; offset += 500) {
    const { error } = await db
      .from(source.table)
      .upsert(payload.slice(offset, offset + 500), {
        onConflict: "release_id,strong_number",
      });
    if (error) throw error;
  }

  console.log(
    `${source.name}: ${rows.length} entries, sha256=${sha}, publication=${release.publication_status}`,
  );
}
