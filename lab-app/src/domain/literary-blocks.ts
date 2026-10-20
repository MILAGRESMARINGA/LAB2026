import {CANON,type Chapter} from "./canon";
import type {GameDay} from "./game-plan";

/** Color is redundant with a printed symbol and name; it never carries status alone. */
export const LITERARY_BLOCKS=[
 {id:"pentateuch",name:"Pentateuco",color:"#0072B2",symbol:"Ⅰ",start:0,end:5,testament:"AT"},
 {id:"history",name:"Livros Históricos",color:"#E69F00",symbol:"Ⅱ",start:5,end:17,testament:"AT"},
 {id:"poetry",name:"Livros Poéticos",color:"#F0E442",symbol:"Ⅲ",start:17,end:22,testament:"AT"},
 {id:"major-prophets",name:"Profetas Maiores",color:"#CC79A7",symbol:"Ⅳ",start:22,end:27,testament:"AT"},
 {id:"minor-prophets",name:"Profetas Menores",color:"#56B4E9",symbol:"Ⅴ",start:27,end:39,testament:"AT"},
 {id:"gospels",name:"Evangelhos",color:"#D55E00",symbol:"Ⅵ",start:39,end:43,testament:"NT"},
 {id:"acts",name:"Atos",color:"#009E73",symbol:"Ⅶ",start:43,end:44,testament:"NT"},
 {id:"letters",name:"Cartas Paulinas e Gerais",color:"#332288",symbol:"Ⅷ",start:44,end:65,testament:"NT"},
 {id:"revelation",name:"Apocalipse",color:"#DDCC77",symbol:"Ⅸ",start:65,end:66,testament:"NT"}
] as const;
const BLOCK_BY_BOOK=new Map<string,(typeof LITERARY_BLOCKS)[number]|undefined>(CANON.map(([book],index)=>[book,LITERARY_BLOCKS.find(block=>index>=block.start&&index<block.end)]));
export function literaryBlockFor(book:string){return BLOCK_BY_BOOK.get(book)}
export function literaryOverview(plan:ReadonlyArray<GameDay>,completedDays:number,checked:readonly string[]){
 const completed=new Set(plan.slice(0,Math.max(0,completedDays)).flatMap(day=>day.chapters.map(ch=>ch.id)));
 checked.forEach(id=>completed.add(id));
 const allChapters=plan.flatMap(day=>day.chapters);
 return LITERARY_BLOCKS.map(block=>{
  const chapters=allChapters.filter((chapter:Chapter)=>literaryBlockFor(chapter.book)?.id===block.id);
  return {...block,total:chapters.length,completed:chapters.filter(ch=>completed.has(ch.id)).length};
 });
}
