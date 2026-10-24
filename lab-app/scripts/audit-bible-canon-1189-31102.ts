/**
 * LABGame 3.0 canonical coverage gate. Run with SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY in a private CI environment. Never log credentials.
 * Distinguishes chapter/row counts from verified verse coordinates.
 */
const endpoint = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!endpoint || !key) throw new Error("Missing private Supabase runtime configuration");
type Verse = { chapter_id: string; verse_number: number; edition: string };
async function page<T>(table: string, from: number, to: number, select: string): Promise<T[]> {
 const u = new URL(`${endpoint}/rest/v1/${table}`);
 u.searchParams.set("select",select);
 u.searchParams.set("offset",String(from));
 u.searchParams.set("limit",String(to-from+1));
 const r=await fetch(u,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
 if(!r.ok) throw new Error(`Read ${table}: HTTP ${r.status}`);
 return await r.json() as T[];
}
async function all<T>(table:string,select:string):Promise<T[]>{
 const out:T[]=[]; for(let offset=0;;offset+=1000){const batch=await page<T>(table,offset,offset+999,select);out.push(...batch);if(batch.length<1000)break;}return out;
}
const chapters=await all<{chapter_id:string}>("lab_bible_chapters","chapter_id");
const verses=await all<Verse>("lab_bible_verses","chapter_id,verse_number,edition");
const source = verses.filter(v=>v.edition==="ALM1911");
const perChapter=new Map<string,Set<number>>();
for(const v of source){if(!perChapter.has(v.chapter_id))perChapter.set(v.chapter_id,new Set());perChapter.get(v.chapter_id)!.add(v.verse_number);}
const missingChapters=chapters.map(c=>c.chapter_id).filter(id=>!perChapter.has(id));
const gaps=[...perChapter].flatMap(([id,numbers])=>{
 const max=Math.max(...numbers);return Array.from({length:max},(_,i)=>i+1).filter(n=>!numbers.has(n)).map(n=>`${id}:${n}`);
});
const result={chapters:chapters.length,sourceRows:source.length,uniqueCoordinates:[...perChapter.values()].reduce((n,s)=>n+s.size,0),missingChapters,gaps,checks:{chapters1189:chapters.length===1189,verseCoordinates31102:source.length===31102,chaptersWithoutHoles:missingChapters.length===0,gapFree:gaps.length===0}};
process.stdout.write(JSON.stringify(result,null,2)+"\n");
if(Object.values(result.checks).some(v=>!v))process.exitCode=1;
