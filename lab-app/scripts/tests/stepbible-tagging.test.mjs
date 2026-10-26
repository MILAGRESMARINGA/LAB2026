import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// The importer uses JS-compatible TypeScript; exercise it on CI's Node 20 too.
const source=await readFile(new URL('../import-stepbible-tagging.ts',import.meta.url),'utf8');
const { normalizeStrong,codeMap,parseReference,parseFiles,bundle,batchSQL,releaseMetadata,greekReading }=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

const context={edition:'KJV',chapters:[['1:1',31,1,31],['43:1',51,1,51],['40:17',27,1,27]],hebrew:['H0430','H7225'],greek:['G0746','G3056'],lexiconReleases:[{id:'hebrew-release',hebrew:2,greek:0,artifact_sha256:'hash'},{id:'greek-release',hebrew:0,greek:2,artifact_sha256:'hash'}]};
const file=(group,lines)=>[{group,path:'fixture',bytes:Buffer.from(lines.join('\n'))}];
test('normalize suffixes and zeros, reject invalid or zero Strong numbers',()=>{
  assert.equal(normalizeStrong('H1254a'),'H1254'); assert.equal(normalizeStrong('G0746A'),'G746');
  for(const s of ['G0','G99999','H12!x','punctuation']) assert.equal(normalizeStrong(s),null);
  assert.equal(codeMap(['H0430']).get('H430'),'H0430');
  assert.throws(()=>codeMap(['H0430','H430']),/Ambiguous/);
});
test('KJV overrides are used instead of Hebrew or NA references',()=>{
  const r=parseReference('Mat.17.15[17.14]#01=NKO'); assert.equal(r.verse,14);assert.equal(r.book,40);
  assert.equal(parseReference('Gen.1.1(1.2)#01=L').verse,1);
  assert.equal(parseReference('#_Translation'),null);
});
test('Hebrew emits root codes only, preserves real keys, discards absent codes and verse zero',()=>{
  const result=parseFiles(file('TAHOT',[
    'Gen.1.1#01=L\tבְּרֵאשִׁית\tbereshit\tin beginning\tH9003/{H7225G}\tHR/Ncfsa',
    'Gen.1.1#02=L\tבָּרָא\tbara\tcreated\t{H1254A}\tHVqp3ms',
    'Gen.1.1#03=L\tאֱלֹהִים\telohim\tGod\t{H0430G}\tHNcmpa',
    'Gen.1.0#01=L\ttitle\t\t\t{H7225G}\tHN',
  ]),context,'TAHOT');
  assert.deepEqual(result.rows.map(r=>r.strong_number),['H7225','H0430']);
  assert.deepEqual(result.rows.map(r=>r.token_ordinal),[1,3]); // Never renumber after dropping a root.
  assert.deepEqual(result.unknown,[['H1254',1]]);assert.equal(result.stats.skippedTitles,1);
});
test('Greek selects the KJV primary reading, strips transliteration and retains pending review',()=>{
  const r=parseFiles(file('TAGNT',[
    'Jhn.1.1#01=NKO\tἀρχῇ (arche)\tbeginning\tG0746=N-DSF\t\tTR',
    'Jhn.1.1#02=N(K)O\tvariant (x)\t\tG3056=N\t\tSBL',
    'Jhn.1.1#03=K(O)\tλόγος (logos)\tword\tG3056=N\t\tTR',
  ]),context,'TAGNT');
  assert.equal(r.rows.length,2);assert.equal(r.rows[0].token_text,'ἀρχῇ');
  assert.ok(r.rows.every(x=>x.language==='greek' && x.review_status==='pending'));
});
test('traditional variants use their own surface and Strong instead of dropping the position',()=>{
  const fields=['Mat.15.6#15=N(K)O','λόγον (logon)','word','G3056=N-ASM','','','ἐντολὴν (T=entolēn) commandment - G1785=N-ASF in: TR+Byz'];
  assert.deepEqual(greekReading(fields,parseReference(fields[0])),{text:'ἐντολὴν',tag:'G1785=N-ASF'});
  assert.equal(greekReading(['Rev.12.18[13.1]#02=N(K)O','','','','','','ἐστάθην (T=estathēn) I stood - G2476=V-API-1S in: TR+Byz'],parseReference('Rev.12.18[13.1]#02=N(K)O')).tag,'G2476=V-API-1S');
  assert.deepEqual(greekReading(['Act.10.2#21=N(K)O','διὰ (dia)','','G1223=PREP','','TR»1+Byz',''],parseReference('Act.10.2#21=N(K)O')),{absorbed:true,target:22});
});
test('compound tokens retain all Strong codes and absorbed components are not duplicated',()=>{
  const c={...context,greek:['G1473','G2532','G1223','G1275']};
  const r=parseFiles(file('TAGNT',[
    'Jhn.1.1#01=NKO\tκἀγώ (kago)\t\tG1473=P-1NS + G2532=CONJ\t\tTR',
    'Jhn.1.1#02=N(K)O\tδιὰ (dia)\t\tG1223=PREP\t\tTR»1\t',
    'Jhn.1.1#03=N(K)O\tπαντός (pantos)\t\tG3956=A\t\tNA\tδιαπαντός (T=diapantos) always - G1275=ADV in: TR',
  ]),c,'TAGNT');
  assert.deepEqual(r.rows.map(x=>x.strong_number),['G1473','G2532','G1275']);
  assert.deepEqual(r.rows.map(x=>x.token_ordinal),[1,1,3]);
  assert.equal(r.stats.absorbedTraditional,1);
});
test('difficult KJV versification examples resolve without changing the original source locator',()=>{
  for(const [ref,chapter,verse] of [['Php.1.16[1.17]#01=NKO',1,17],['2Co.13.13[13.14]#01=NKO',13,14],['3Jn.1.15[1.14]#01=NKO',1,14],['Rev.12.18[13.1]#02=N(K)O',13,1]]) {
    const r=parseReference(ref);assert.equal(r.chapter,chapter);assert.equal(r.verse,verse);assert.equal(r.source,ref);
  }
});
test('Aramaic morphology selects aramaic while resolving the Hebrew lexicon',()=>{
  const r=parseFiles(file('TAHOT',['Gen.1.1#01=L\tword\t\t\t{H0430}\tANcmpa']),context,'TAHOT');
  assert.equal(r.rows[0].language,'aramaic');assert.equal(r.rows[0].lexicon_release_id,'hebrew-release');
});
test('unresolved canonical coordinates are recorded, never attached to another verse',()=>{
  const r=parseFiles(file('TAHOT',['Gen.1.32#01=L\tword\t\t\t{H0430}\tHN']),context,'TAHOT');
  assert.equal(r.rows.length,0);assert.deepEqual(r.unresolved,['1:1:32']);
});
test('bundle hash depends on raw bytes and deterministic file order',()=>{
  const a={group:'TAHOT',bytes:Buffer.from('a')},b={group:'TAHOT',bytes:Buffer.from('b')};
  assert.notEqual(bundle([a,b],'TAHOT'),bundle([b,a],'TAHOT'));
});
test('SQL guards draft and exact lexicon membership, preserves editorial state on reruns',()=>{
  const r=parseFiles(file('TAHOT',['Gen.1.1#01=L\tא\t\t\t{H0430}\tHN']),context,'TAHOT');
  const sql=batchSQL(r.rows,releaseMetadata('TAHOT','a'.repeat(64)));
  assert.ok(sql.includes("publication_status='draft'"));assert.ok(sql.includes('on conflict (edition,'));
  assert.ok(sql.includes('do nothing'));assert.ok(sql.includes('l.strong_number=p.strong_number'));
  assert.ok(!sql.includes('do update'));assert.ok(sql.includes('public.lab_bible_verses'));
});
