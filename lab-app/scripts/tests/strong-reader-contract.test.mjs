import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const dir=new URL("../../",import.meta.url);
const sql=readFileSync(new URL("supabase/migrations/202610280001_strong_reader_rpc.sql",dir),"utf8");
const read=readFileSync(new URL("src/features/strong-lexicon.ts",dir),"utf8");
const drawer=readFileSync(new URL("src/components/StrongLexiconDrawer.tsx",dir),"utf8");
const reader=readFileSync(new URL("src/components/BibleReader.tsx",dir),"utf8");
test("RPC is a pure SECURITY INVOKER published-only reader",()=>{
 assert.match(sql,/security invoker/i);
 assert.match(sql,/v\.review_status='approved'/);
 assert.match(sql,/lr\.publication_status='published'/);
 assert.match(sql,/tag\.publication_status='published'/);
 assert.match(sql,/lr\.rights_status='approved'/);
 assert.match(sql,/bible\.rights_status in \('approved','public_domain'\)/);
 assert.match(sql,/v\.edition='KJV'/);
 assert.match(sql,/auth\.uid\(\)/);
 assert.match(sql,/revoke all on function .*lab_strong_verse_lookup/is);
 assert.match(sql,/grant execute on function .*lab_strong_verse_lookup[\s\S]+to authenticated;/i);
 assert.doesNotMatch(sql,/security definer|grant.+to anon|insert into|delete from|update public\./i);
});
test("Strong feature opt-in and no exposure of KJV definition in Portuguese",()=>{
 assert.match(read,/VITE_LAB_STRONG_READY==="true"/);
 assert.match(read,/supabase\.rpc\("lab_strong_verse_lookup"/);
 assert.match(drawer,/Tradução automática em revisão/);
 assert.match(drawer,/STEP Bible/);
 assert.match(drawer,/creativecommons\.org\/licenses\/by\/4\.0/);
 assert.match(drawer,/Forma no texto bíblico original/);
 assert.doesNotMatch(drawer,/Forma na referência KJV/);
 assert.match(sql,/translation_status=\x27reviewed\x27/);
 assert.match(sql,/translation_method=\x27human-reviewed\x27/);
 assert.match(sql,/reviewed_at is not null/);
 assert.match(drawer,/KJV/);
 assert.match(drawer,/O sentido de uma palavra é determinado pelo contexto/);
 assert.match(reader,/STRONG_READER_READY&&/);
});

test("source verification and editorial review remain distinct",()=>{
 const newMigration=readFileSync(new URL("supabase/migrations/202610280003_strong_two_tier_status.sql",dir),"utf8");
 const rpc=readFileSync(new URL("supabase/migrations/202610280004_strong_two_tier_read_rpc.sql",dir),"utf8");
 assert.match(newMigration,/source_verified_stepbible/);
 assert.match(newMigration,/editorial_reviewed/);
 assert.match(newMigration,/auto_qa_passed=true/);
 assert.match(rpc,/v\.review_status in \('source_verified_stepbible','editorial_reviewed'\)/);
 assert.match(rpc,/tr\.auto_qa_passed=true/);
 assert.match(rpc,/v\.review_status/);
 assert.match(rpc,/tr\.gloss_status/);
});
