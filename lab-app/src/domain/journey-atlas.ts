import type {Chapter} from './canon';
import type {GameDay} from './game-plan';
import {chapterJourneyContext} from './journey-geography';
/** Approximate regional anchors, not archaeological claims or modern borders. */
export const ATLAS_PLACES={
 mesopotamia:{name:'Mesopotâmia',lon:45,lat:33,biome:'river'},
 egypt:{name:'Egito · Nilo',lon:31,lat:29,biome:'desert'},
 sinai:{name:'Sinai',lon:34,lat:29,biome:'mountain'},
 canaan:{name:'Canaã',lon:35.2,lat:31.8,biome:'green'},
 moab:{name:'Moabe',lon:36,lat:31,biome:'desert'},
 haran:{name:'Harã',lon:39,lat:37,biome:'green'},
 persia:{name:'Susã',lon:48.3,lat:32.2,biome:'desert'},
 nineveh:{name:'Nínive',lon:43.2,lat:36.4,biome:'river'},
 anatolia:{name:'Ásia Menor',lon:32,lat:38,biome:'mountain'},
 ephesus:{name:'Éfeso',lon:27.3,lat:37.9,biome:'green'},
 greece:{name:'Grécia',lon:23,lat:38,biome:'green'},
 rome:{name:'Roma',lon:12.5,lat:41.9,biome:'green'},
 patmos:{name:'Patmos',lon:26.5,lat:37.3,biome:'green'},
 crete:{name:'Creta',lon:25,lat:35.2,biome:'green'},
} as const;
export type AtlasPlace=typeof ATLAS_PLACES[keyof typeof ATLAS_PLACES];
export function atlasPlace(ch:Pick<Chapter,'book'|'chapter'>):AtlasPlace{
 const {book:b,chapter:c}=ch,p=ATLAS_PLACES;
 if(b==='Gênesis')return c<=11?p.mesopotamia:c>=39?p.egypt:c>=28&&c<=31?p.haran:p.canaan;
 if(b==='Êxodo')return c<=12?p.egypt:p.sinai;
 if(b==='Levítico')return p.sinai;
 if(b==='Números')return c<=10?p.sinai:p.moab;
 if(b==='Deuteronômio')return p.moab;
 if(b==='Ester')return p.persia;
 if(['Daniel','Ezequiel'].includes(b))return p.mesopotamia;
 if(['Jonas','Naum'].includes(b))return p.nineveh;
 if(b==='Atos')return c<=12?p.canaan:c<=14?p.anatolia:c===15?p.canaan:c<=18?p.greece:c===19?p.ephesus:c===20?p.greece:c<=26?p.canaan:c===27?p.crete:p.rome;
 if(b==='Romanos')return p.rome;
 if(['1 Coríntios','2 Coríntios','Filipenses','1 Tessalonicenses','2 Tessalonicenses'].includes(b))return p.greece;
 if(['Efésios','Colossenses'].includes(b))return p.ephesus;
 if(b==='Gálatas')return p.anatolia;
 if(b==='Tito')return p.crete;
 if(b==='Apocalipse')return p.patmos;
 return p.canaan;
}
export function atlasProject(lon:number,lat:number){return {x:90+(lon-5)*14+(lat-25)*8,y:550-(lat-25)*12+(lon-5)*6}}
export function atlasStage(day:GameDay){const chapter=day.old[0]??day.chapters[0];return {chapter,place:atlasPlace(chapter),context:chapterJourneyContext(chapter)}}
export function weekWindow<T>(days:readonly T[],current:number){const start=Math.floor((Math.max(1,Math.min(days.length,current))-1)/7)*7;return {start,days:days.slice(start,start+7)}}
