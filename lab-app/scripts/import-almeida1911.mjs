/**
 * Rebuild LABGAME's ALM1911 text dataset from a public-domain source.
 *
 * Requirements:
 *   SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-almeida1911.mjs
 *
 * Never ship service_role in the frontend or in Vercel's VITE_ variables.
 * Run from a trusted developer machine, CI secret or protected one-off job.
 * No textual alteration or modernized spelling is applied.
 */
import {createClient} from "@supabase/supabase-js";
const CODES=["GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA","1KI","2KI","1CH","2CH","EZR","NEH","EST","JOB","PSA","PRO","ECC","SNG","ISA","JER","LAM","EZK","DAN","HOS","JOL","AMO","OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL","MAT","MRK","LUK","JHN","ACT","ROM","1CO","2CO","GAL","EPH","PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS","1PE","2PE","1JN","2JN","3JN","JUD","REV"];
if(CODES.length!==66)throw Error("Expected 66 canonical books");
const url=process.env.SUPABASE_URL;
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY securely");
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const base="https://raw.githubusercontent.com/damarals/biblias/main/data/canonical/ALM1911/";
let chapters=0,verses=0;
for(let i=0;i<CODES.length;i++){
 const code=CODES[i];
 const response=await fetch(base+code+".json");
 if(!response.ok)throw Error("Cannot load "+code+": "+response.status);
 const book=await response.json();
 if(book.id!==i+1||book.code!==code)throw Error("Unexpected canonical book id/code: "+code);
 if(!Array.isArray(book.chapters)||book.chapters.length<1)throw Error("Missing chapters: "+code);
 const records=book.chapters.map((chapter,n)=>{
  if(chapter.number!==n+1||!Array.isArray(chapter.verses)||chapter.verses.length===0)throw Error("Invalid "+code+" chapter "+(n+1));
  if(chapter.verses.some(v=>!Number.isInteger(v.number)||v.number<1||typeof v.text!=="string"||!v.text.trim()))throw Error("Verse missing: "+code+" "+chapter.number);
  verses+=chapter.verses.length;
  return {edition:"ALM1911",chapter_id:book.id+":"+chapter.number,book_name:book.name,chapter_number:chapter.number,verses:chapter.verses};
 });
 for(let offset=0;offset<records.length;offset+=8){
  const batch=records.slice(offset,offset+8);
  const {error}=await db.from("lab_bible_chapters").upsert(batch,{onConflict:"edition,chapter_id"});
  if(error)throw new Error(code+" "+(offset+1)+": "+error.message);
 }
 chapters+=records.length;
 process.stdout.write(code+" "+records.length+" chapters\\n");
}
if(chapters!==1189)throw Error("Expected 1189 chapters; got "+chapters);
const {count,error}=await db.from("lab_bible_chapters").select("*",{count:"exact",head:true}).eq("edition","ALM1911");
if(error||count!==1189)throw Error("Database chapter verification failed: "+String(error?.message||count));
process.stdout.write("VERIFIED "+CODES.length+" books; "+chapters+" chapters; "+verses+" verses\\n");
