import bundled from '../domain/demo-reading.json';
import {CANON} from '../domain/canon';
export type DemoChapter={book:string;chapter:number;verses:{number:number;text:string}[]};
const codes=['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'];
const cache=new Map<number,Promise<any>>();
export async function loadDemoChapter(id:string):Promise<DemoChapter>{
 const [book,chapter]=id.split(':').map(Number),record=CANON[book-1];
 if(!record||!Number.isInteger(chapter)||chapter<1||chapter>record[1])throw Error('Referência inválida');
 const local=(bundled as Record<string,DemoChapter>)[id];if(local)return local;
 if(!cache.has(book))cache.set(book,fetch(`https://raw.githubusercontent.com/damarals/biblias/main/data/canonical/ALM1911/${codes[book-1]}.json`).then(r=>{if(!r.ok)throw Error('Fonte indisponível');return r.json()}).catch(e=>{cache.delete(book);throw e}));
 const source=await cache.get(book),data=source?.chapters?.find((c:any)=>c.number===chapter);
 if(source.id!==book||!data||!Array.isArray(data.verses)||!data.verses.length||!data.verses.every((v:any,i:number)=>v.number===i+1&&typeof v.text==='string'&&v.text.trim()))throw Error('Texto indisponível');
 return {book:record[0],chapter,verses:data.verses};
}
