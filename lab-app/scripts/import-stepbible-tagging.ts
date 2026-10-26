/**
 * Trusted STEPBible tagging ingestion. Node >=22.18 (no dependencies).
 * IMPORT_DRY_RUN=1 node scripts/import-stepbible-tagging.ts
 * Real import: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in private environment.
 * Offline preparation: STEP_SOURCE_DIR, STEP_CONTEXT_FILE, STEP_OUTPUT_DIR.
 * All six source hashes and both bundles are checked before database writes.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const REVISION = 'be4191f0082aeedddb0eff0c02c966292b2bd641';
const ROOT = 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/';
export const SOURCES = [
  ['TAHOT', 'Gen-Deu', 'e9b8546ee48fe0bfc57c3b70f5f40e98d96580e803526d19026224e31753368b'],
  ['TAHOT', 'Jos-Est', '195fee1dc3653bab33701f170734eb894ed647c10cd08cc61749375fe8b73775'],
  ['TAHOT', 'Job-Sng', 'bb508af3af07822fca84cc43a0eba79eb70eecf672aabc0245b8d8cecf329d96'],
  ['TAHOT', 'Isa-Mal', 'f3ded203d2a74d6368932c97ae550d1d0754b271af491dc0dedf36fe3ba0bcc5'],
  ['TAGNT', 'Mat-Jhn', 'ab8eaaeb68e17a1dcfa34e1e9350358f22f03bc2a97244d848750ad81044bc8e'],
  ['TAGNT', 'Act-Rev', '524e32375361e6d3fa2f7ef00b87605fdc4317a762f395651a05fdc31ad031b7'],
].map(([group, range, sha256]) => ({group, sha256, path: `Translators Amalgamated OT+NT/${group} ${range} - Translators Amalgamated ${group === 'TAHOT' ? 'Hebrew OT - STEPBible.org CC BY' : 'Greek NT - STEPBible.org CC-BY'}.txt`}));
const BOOKS = 'Gen Exo Lev Num Deu Jos Jdg Rut 1Sa 2Sa 1Ki 2Ki 1Ch 2Ch Ezr Neh Est Job Psa Pro Ecc Sng Isa Jer Lam Ezk Dan Hos Jol Amo Oba Jon Mic Nam Hab Zep Hag Zec Mal Mat Mrk Luk Jhn Act Rom 1Co 2Co Gal Eph Php Col 1Th 2Th 1Ti 2Ti Tit Phm Heb Jas 1Pe 2Pe 1Jn 2Jn 3Jn Jud Rev'.split(' ');
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function normalizeStrong(raw) {
  const m = /^([HG])(\d{1,4})(?:[a-zA-Z]+)?$/.exec(raw);
  return m && Number(m[2]) > 0 ? m[1] + Number(m[2]) : null;
}
export function codeMap(codes) {
  const map = new Map();
  for (const code of codes) {
    const key = normalizeStrong(code);
    if (!key || map.has(key)) throw Error(`Ambiguous lexicon key: ${code}`);
    map.set(key, code); // Resolve to the real stored key (e.g. H0430).
  }
  return map;
}
export function parseReference(ref) {
  const m = /^([1-3]?[A-Za-z]{2,3})\.(\d+)\.(\d+)([^#]*)#(\d+)=(.+)$/.exec(ref);
  if (!m) return null;
  const book = BOOKS.indexOf(m[1]) + 1;
  if (!book) throw Error(`Unknown book: ${ref}`);
  let chapter = Number(m[2]), verse = Number(m[3]);
  const kjv = /\[(?:(?:[1-3]?[A-Za-z]{2,3})\.)?(\d+)\.(\d+)\]/.exec(m[4]);
  if (kjv) { chapter = Number(kjv[1]); verse = Number(kjv[2]); }
  return {book, chapter, verse, position:Number(m[5]), type:m[6], source:ref};
}
export function greekReading(fields, ref) {
  if (/[Kk]/.test(ref.type.split('(')[0])) return {text:fields[1],tag:fields[3]};
  if (!/[Kk]/.test(ref.type)) return null;
  const variants = (fields[6] || '').split(/;\s+/);
  const tradition = variants.filter(v => /\([Tt]=/.test(v));
  // These components are absorbed into a traditional compound at the target.
  const displaced = /(?:^|\+)TR»(\d+)(?=\+|$)/.exec(fields[5]||'');
  if (!tradition.length && displaced) return {absorbed:true,target:ref.position+Number(displaced[1])};
  if (tradition.length !== 1) return null; // Record as unresolved, never guess a replacement.
  const text = tradition[0].match(/^\s*(.+?)\s*\([Tt]=[^)]*\)/)?.[1];
  const tag = tradition[0].match(/ - (.+?) in:/)?.[1];
  return text && tag ? {text,tag} : null;
}
export function parseFiles(files, context, group) {
  const codes = codeMap(group === 'TAHOT' ? context.hebrew : context.greek);
  const chapters = new Map(context.chapters.map(([id,n,min,max]) => {
    if (n !== max || min !== 1) throw Error(`Noncontiguous canonical chapter: ${id}`);
    return [id,max];
  }));
  const lex = context.lexiconReleases.filter(r => group === 'TAHOT' ? Number(r.hebrew)>0 : Number(r.greek)>0);
  if (lex.length !== 1 || !lex[0].artifact_sha256) throw Error(`Expected one hashed lexicon: ${group}`);
  const rows = [], unknown = new Map(), seen = new Set(), ordinals = new Map();
  const stats = {selectedTokens:0, skippedTitles:0, skippedVariants:0, absorbedTraditional:0, unresolvedTraditional:0, unresolvedCoordinates:0, noCode:0, missingCodeTokens:0};
  const unresolved = new Set(), unresolvedTraditionalRefs = [];
  for (const file of files) {
    if (file.group !== group) continue;
    const lines=file.bytes.toString('utf8').split(/\r?\n/);
    const positionRows=new Map();
    if(group==='TAGNT') for(const line of lines) {
      const m=/^([1-3]?[A-Za-z]{2,3}\.\d+\.\d+[^#]*)#(\d+)=/.exec(line);
      if(m) positionRows.set(`${m[1]}#${Number(m[2])}`,line.split('\t'));
    }
    for (const line of lines) {
      const f = line.split('\t'), ref = parseReference(f[0]);
      if (!ref) continue;
      // TAGNT is amalgamated. Use the KJV/TR primary reading, never all variants.
      const primary = ref.type.split('(')[0];
      const greek = group === 'TAGNT' ? greekReading(f,ref) : null;
      if (group === 'TAGNT' ? !greek : !/^[LQR]/.test(primary)) {
        if(group==='TAGNT' && /[Kk]/.test(ref.type)) {stats.unresolvedTraditional++;unresolvedTraditionalRefs.push(ref.source);}
        else stats.skippedVariants++;
        continue;
      }
      if (ref.verse === 0) { stats.skippedTitles++; continue; }
      const chapter_id = `${ref.book}:${ref.chapter}`;
      if (!chapters.has(chapter_id) || ref.verse > chapters.get(chapter_id)) { stats.unresolvedCoordinates++; unresolved.add(`${chapter_id}:${ref.verse}`); continue; }
      const identity = `${file.path}#${ref.source}`;
      if (seen.has(identity)) throw Error(`Duplicate source token: ${identity}`);
      seen.add(identity);
      const key = `${chapter_id}:${ref.verse}`;
      const token_ordinal = (ordinals.get(key) || 0) + 1;
      ordinals.set(key,token_ordinal);
      if(greek?.absorbed) {
        const target=positionRows.get(`${f[0].split('#')[0]}#${greek.target}`);
        const reading=target && greekReading(target,parseReference(target[0]));
        if(!reading?.tag || !/\([Tt]=/.test(target[6]||'')) throw Error(`Unverified compound absorption: ${ref.source}`);
        stats.absorbedTraditional++;
        continue; // Ordinal still records this position in the source stream.
      }
      stats.selectedTokens++;
      const tag = group === 'TAHOT' ? [...(f[4]||'').matchAll(/\{([^}]+)\}/g)].map(m=>m[1]).join('+') : greek.tag;
      const rawCodes = [...new Set([...tag.matchAll(/[HG]\d{1,4}[a-zA-Z]*/g)].map(m=>m[0]))];
      if (!rawCodes.length) { stats.noCode++; continue; }
      const resolved = [...new Set(rawCodes.map(normalizeStrong).filter(Boolean))];
      const language = group === 'TAGNT' ? 'greek' : (f[5]||'').startsWith('A') ? 'aramaic' : 'hebrew';
      let emitted = false;
      for (const base of resolved) {
        const strong_number = codes.get(base);
        if (!strong_number) { unknown.set(base,(unknown.get(base)||0)+1); continue; }
        emitted = true;
        rows.push({edition:context.edition,chapter_id,verse_number:ref.verse,lexicon_release_id:lex[0].id,token_ordinal,
          token_text:(group === 'TAGNT' ? greek.text.replace(/\s*\([^)]*\)\s*$/,'') : f[1]).normalize('NFC'),
          strong_number,language,source_locator:`${file.path}#${ref.source}`,review_status:'pending'});
      }
      if (!emitted) stats.missingCodeTokens++;
    }
  }
  return {rows,stats,unknown:[...unknown].sort((a,b)=>b[1]-a[1]),unresolved:[...unresolved],unresolvedTraditionalRefs};
}
export function bundle(files, group) {
  // Exact raw byte concatenation in SOURCES order; order is part of the contract.
  return sha256(Buffer.concat(files.filter(f=>f.group===group).map(f=>f.bytes)));
}
const quote = s => "'" + String(s).replaceAll("'","''") + "'";
export function releaseMetadata(group, hash) {
  return {source_name:`STEPBible ${group} (KJV coordinate reference)`,source_url:`https://github.com/STEPBible/STEPBible-Data/tree/${REVISION}/Translators%20Amalgamated%20OT%2BNT`,source_revision:`${REVISION}; ${group}; raw-concat-v1`,
    license_name:'CC BY 4.0',license_url:'https://creativecommons.org/licenses/by/4.0/',
    attribution:'STEPBible.org / Tyndale House CC BY 4.0; normalized base Strong keys; KJV coordinates; original-language tokens, not Portuguese word alignment',
    artifact_sha256:hash,rights_status:'approved',publication_status:'draft'};
}
export function releaseSQL(metadata) {
  const cols=Object.keys(metadata);
  return `insert into public.strong_tagging_releases (${cols.join(',')}) values (${cols.map(c=>quote(metadata[c])).join(',')}) on conflict (source_url,artifact_sha256) do nothing returning id,source_name,artifact_sha256,publication_status;`;
}
export function batchSQL(rows, metadata) {
  const data=rows.map(r=>[r.chapter_id,r.verse_number,r.token_ordinal,r.token_text,r.strong_number,r.language,r.source_locator]);
  const lex=rows[0].lexicon_release_id;
  const literals=quote(JSON.stringify(data));
  return `with r as (select id from public.strong_tagging_releases where source_url=${quote(metadata.source_url)} and artifact_sha256=${quote(metadata.artifact_sha256)} and publication_status='draft' and rights_status='approved'), payload as (select e->>0 chapter_id,(e->>1)::smallint verse_number,(e->>2)::int token_ordinal,e->>3 token_text,e->>4 strong_number,e->>5 language,e->>6 source_locator from jsonb_array_elements(${literals}::jsonb) e), ins as (insert into public.verse_strong_links (edition,chapter_id,verse_number,tagging_release_id,lexicon_release_id,token_ordinal,token_text,strong_number,language,source_locator,review_status) select ${quote(rows[0].edition)},p.chapter_id,p.verse_number,r.id,${quote(lex)}::uuid,p.token_ordinal,p.token_text,p.strong_number,p.language,p.source_locator,'pending' from payload p cross join r join public.lab_bible_verses v on v.edition=${quote(rows[0].edition)} and v.chapter_id=p.chapter_id and v.verse_number=p.verse_number where exists (select 1 from public.${metadata.source_name.includes('TAHOT')?'strong_hebrew':'strong_greek'} l where l.release_id=${quote(lex)}::uuid and l.strong_number=p.strong_number) on conflict (edition,chapter_id,verse_number,tagging_release_id,token_ordinal,language,strong_number) do nothing returning id) select count(*) inserted from ins;`;
}
async function api(table, query='', options={}) {
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !url.startsWith('https://')) throw Error('Private SUPABASE_URL (https) and service key required');
  const r=await fetch(`${url}/rest/v1/${table}?${query}`,{...options,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(120000)});
  if(!r.ok) throw Error(`Supabase ${table}: HTTP ${r.status} ${(await r.text()).slice(0,500)}`);
  return r.status===204 ? [] : r.json();
}
async function paged(table,select,filter='',order='') {
  const out=[];
  for(let offset=0;;offset+=1000) {
    const part=await api(table,`select=${select}&${filter}&order=${order}&offset=${offset}&limit=1000`);
    out.push(...part); if(part.length<1000) return out;
  }
}
async function databaseContext() {
  const [chapters,releases,hebrew,greek]=await Promise.all([
    paged('lab_bible_chapters','chapter_id,verses','edition=eq.KJV','chapter_id'),
    paged('strong_lexicon_releases','id,source_name,artifact_sha256,publication_status','','id'),
    paged('strong_hebrew','release_id,strong_number','','release_id,strong_number'),
    paged('strong_greek','release_id,strong_number','','release_id,strong_number'),
  ]);
  return {edition:'KJV',chapters:chapters.map(r=>{const n=Object.keys(r.verses).length;return [r.chapter_id,n,1,n];}),hebrew:hebrew.map(r=>r.strong_number),greek:greek.map(r=>r.strong_number),
    lexiconReleases:releases.map(r=>({...r,hebrew:hebrew.filter(x=>x.release_id===r.id).length,greek:greek.filter(x=>x.release_id===r.id).length}))};
}
export async function main() {
  const files=[];
  for(const s of SOURCES) {
    let bytes;
    if(process.env.STEP_SOURCE_DIR) bytes=await readFile(path.join(process.env.STEP_SOURCE_DIR,path.basename(s.path)));
    else {
      const r=await fetch(`${ROOT}${REVISION}/${s.path.split('/').map(encodeURIComponent).join('/')}`,{signal:AbortSignal.timeout(120000)});
      if(!r.ok) throw Error(`Source HTTP ${r.status}: ${s.path}`);
      bytes=Buffer.from(await r.arrayBuffer());
    }
    if(sha256(bytes)!==s.sha256) throw Error(`Source checksum mismatch: ${s.path}`);
    if(!bytes.toString('utf8',0,8000).includes('CC BY 4.0')) throw Error(`License header missing: ${s.path}`);
    files.push({...s,bytes});
  }
  const hashes={TAHOT:bundle(files,'TAHOT'),TAGNT:bundle(files,'TAGNT')};
  const context=process.env.STEP_CONTEXT_FILE ? JSON.parse(await readFile(process.env.STEP_CONTEXT_FILE,'utf8')) : await databaseContext();
  if(context.edition!=='KJV'||context.chapters.length!==1189||context.chapters.reduce((n,c)=>n+c[1],0)!==31102) throw Error('Expected KJV 1189 chapters / 31102 verses');
  const prepared=['TAHOT','TAGNT'].map(group=>({group,metadata:releaseMetadata(group,hashes[group]),...parseFiles(files,context,group)}));
  if(prepared.some(p=>!p.rows.length)) throw Error('Empty source parse');
  const report={revision:REVISION,hashAlgorithm:'sha256(raw bytes concatenated in SOURCES order)',sources:SOURCES,groups:prepared.map(({rows,...p})=>({...p,links:rows.length,chapters:new Set(rows.map(r=>r.chapter_id)).size,verses:new Set(rows.map(r=>`${r.chapter_id}:${r.verse_number}`)).size}))};
  const output=process.env.STEP_OUTPUT_DIR;
  if(output) {
    await mkdir(output,{recursive:true});
    await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
    for(const p of prepared) {
      await writeFile(path.join(output,`${p.group}-release.sql`),releaseSQL(p.metadata));
      for(let i=0;i<p.rows.length;i+=5000) await writeFile(path.join(output,`${p.group}-${String(i/5000).padStart(3,'0')}.sql`),batchSQL(p.rows.slice(i,i+5000),p.metadata));
    }
  }
  console.log(JSON.stringify(report,null,2));
  if(process.env.IMPORT_DRY_RUN==='1') return report;
  // A snapshot is for preparation only; re-read live keys before any API writes.
  if(process.env.STEP_CONTEXT_FILE) throw Error('Offline context cannot authorize live REST writes; execute reviewed SQL via trusted database integration');
  for(const p of prepared) {
    const filter=`source_url=eq.${encodeURIComponent(p.metadata.source_url)}&artifact_sha256=eq.${p.metadata.artifact_sha256}`;
    let [release]=await api('strong_tagging_releases',`select=id,publication_status,rights_status&${filter}`);
    if(!release) {
      await api('strong_tagging_releases','on_conflict=source_url,artifact_sha256',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(p.metadata)});
      [release]=await api('strong_tagging_releases',`select=id,publication_status,rights_status&${filter}`);
    }
    if(!release||release.publication_status!=='draft'||release.rights_status!=='approved') throw Error('Only approved draft releases may be ingested');
    for(let i=0;i<p.rows.length;i+=5000) {
      await api('verse_strong_links','on_conflict=edition,chapter_id,verse_number,tagging_release_id,token_ordinal,language,strong_number',{
        method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(p.rows.slice(i,i+5000).map(r=>({...r,tagging_release_id:release.id}))) });
      console.log(`${p.group}: ${Math.min(i+5000,p.rows.length)}/${p.rows.length} prepared links`);
    }
  }
  return report;
}
if(process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(e=>{console.error(e.message);process.exitCode=1;});
