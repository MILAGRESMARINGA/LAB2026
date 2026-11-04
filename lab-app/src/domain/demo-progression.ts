import {CHAPTERS} from './canon';
import {createNextGamePlan} from './game-plan-next';
import type {DemoGame} from './demo-game';
const stages=createNextGamePlan(365).stages;
export type JourneyRewards={days:number[];weeks:number[];months:number[];books:string[]};
export function journeyRewards(chapters:readonly string[]):JourneyRewards{
 const read=new Set(chapters),days=stages.filter(s=>s.chapters.every(c=>read.has(c.id))).map(s=>s.day),done=new Set(days);
 const books=[...new Set(CHAPTERS.map(c=>c.book))].filter(book=>CHAPTERS.filter(c=>c.book===book).every(c=>read.has(c.id)));
 const weeks=Array.from({length:52},(_,i)=>i+1).filter(w=>Array.from({length:7},(_,i)=>(w-1)*7+i+1).every(d=>done.has(d)));
 const months=Array.from({length:12},(_,i)=>i+1).filter(m=>{const start=Math.floor((m-1)*365/12)+1,end=Math.floor(m*365/12);return Array.from({length:end-start+1},(_,i)=>start+i).every(d=>done.has(d))});
 return {days,weeks,months,books};
}
export const studyCards=[
 {id:'how',title:'Como ler a Bíblia',unlock:'Livre desde o início',paragraphs:['Comece com uma oração e leia o trecho inteiro. Observe quem fala, para quem e o que acontece antes e depois.','Pergunte o que o texto ensina em seu contexto. Uma narrativa, um poema e uma carta usam formas diferentes de comunicar.','Escolha uma aplicação coerente com o trecho: uma atitude para praticar, uma oração ou algo para corrigir. Textos difíceis pedem consulta e acompanhamento.'],refs:'Lucas 24:27; 2 Timóteo 3:16–17; Tiago 1:22'},
 {id:'pentateuch',title:'Pentateuco',unlock:'Ao concluir os cinco livros',paragraphs:['Gênesis, Êxodo, Levítico, Números e Deuteronômio apresentam criação, promessa, libertação, aliança e formação de Israel.','Leia as leis dentro da aliança e da história em que foram dadas. Observe como os próprios textos distinguem promessas, mandamentos e acontecimentos.','Acompanhe a fidelidade de Deus e a resposta humana. Leia também como Jesus e os apóstolos retomam esses livros, preservando o contexto de cada passagem.'],refs:'Gênesis 12:1–3; Êxodo 19:4–6; Deuteronômio 6:4–9; Lucas 24:44'},
 ...Array.from({length:12},(_,i)=>({id:`month-${i+1}`,title:`Roteiro devocional · mês ${i+1}`,unlock:`Baú do mês ${i+1}`,paragraphs:['Relembre uma passagem lida neste ciclo. Leia o contexto mais uma vez antes de aplicá-la.','Anote o que aprendeu sobre Deus e uma resposta prática para esta semana. Converse sobre isso com alguém do seu grupo.'],refs:'Salmos 119:105; Tiago 1:22'}))
];
export function studyUnlocked(id:string,r:JourneyRewards){return id==='how'||id==='pentateuch'&&['Gênesis','Êxodo','Levítico','Números','Deuteronômio'].every(b=>r.books.includes(b))||id.startsWith('month-')&&r.months.includes(Number(id.slice(6)))}
export function settleJourney(game:DemoGame):DemoGame{
 const r=journeyRewards(game.chapters),entries=[...r.days.map(d=>[`day:${d}`,10] as const),...r.weeks.map(w=>[`week:${w}`,50] as const),...r.books.map(b=>[`book:${b}`,30] as const),...r.months.map(m=>[`month:${m}`,100] as const)];
 const fresh=entries.filter(([id])=>!game.bonuses.includes(id));return fresh.length?{...game,bonuses:[...game.bonuses,...fresh.map(([id])=>id)],xp:game.xp+fresh.reduce((n,[,xp])=>n+xp,0)}:game;
}
export function rewardStudy(game:DemoGame,id:string):DemoGame{if(game.studies.includes(id)||!studyUnlocked(id,journeyRewards(game.chapters)))return game;return {...game,studies:[...game.studies,id],xp:game.xp+20}}
