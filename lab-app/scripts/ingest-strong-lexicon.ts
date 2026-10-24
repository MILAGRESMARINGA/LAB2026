/**
 * Fail-closed ingest contract for separately licensed/verified source datasets.
 * Inputs are JSONL; never synthesize translations or guess Strong alignments.
 * STRONG_LEXICON_JSONL rows: strong_code,language,original_word,transliteration,
 * short_definition_pt,contextual_usage_pt (+ optional fields).
 * STRONG_TOKENS_JSONL rows: book_id,chapter_number,verse_number,token_order,
 * surface_word_pt,strong_code,is_key_theological_term.
 * Execute only in trusted CI/worker with service role env.
 */
import {readFile} from "node:fs/promises";
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw Error("Missing private Supabase credentials");
async function upload(fileEnv:string,table:string,fields:string[]){
 const filename=process.env[fileEnv];
 if(!filename){console.log(`SKIPPED ${table}: no verified source file`);return;}
 const rows=(await readFile(filename,"utf8")).split(/\r?\n/).filter(Boolean).map(s=>JSON.parse(s) as Record<string,unknown>);
 for(const row of rows)for(const f of fields)if(row[f]===undefined||row[f]===null)throw Error(`Invalid ${table}: required field ${f}`);
 for(let i=0;i<rows.length;i+=250){
   const res=await fetch(`${url}/rest/v1/${table}`,{method:"POST",headers:{"apikey":key,Authorization:`Bearer ${key}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows.slice(i,i+250))});
   if(!res.ok)throw Error(`Ingest ${table} batch ${i}: HTTP ${res.status}`);
 }
 console.log(`INGESTED ${rows.length} verified records in ${table}`);
}
await upload("STRONG_LEXICON_JSONL","lab_strong_lexicon",["strong_code","language","original_word","transliteration","short_definition_pt","contextual_usage_pt"]);
await upload("STRONG_TOKENS_JSONL","lab_verse_strong_tokens",["book_id","chapter_number","verse_number","token_order","surface_word_pt","strong_code"]);
