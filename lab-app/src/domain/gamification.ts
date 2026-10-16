export type Completion={chapterId:string;completedAt:string};
export type Achievement={id:string;label:string;earned:boolean};
export function uniqueCompletions(events:Completion[]):Completion[]{
 const map=new Map<string,Completion>();
 for(const e of events){if(!map.has(e.chapterId))map.set(e.chapterId,e)}
 return [...map.values()];
}
export function achievements(events:Completion[],total=1189):Achievement[]{
 const count=uniqueCompletions(events).length;
 return [{id:"first",label:"Primeiro capítulo",earned:count>=1},{id:"hundred",label:"100 capítulos",earned:count>=100},{id:"complete",label:"Bíblia completa",earned:count>=total}];
}
export function chapterPoints(events:Completion[]):number{return uniqueCompletions(events).length*10}
