import {supabase} from "../lib/supabase";

export type GeneratedStudyContent={
 title:string;
 summary:string;
 context:string;
 exegesis:string;
 theological_connection:string|null;
 pentecostal_arminian_lens:string;
 application:string;
 reflection_questions:string[];
 prayer:string;
};
export type GeneratedStudy={
 study_key:string;
 title:string;
 content:GeneratedStudyContent;
 chapter_refs:string[];
 layer:1|2|3;
 cache:boolean;
};

function idempotencyKey():string{
 if(typeof crypto!="undefined"&&typeof crypto.randomUUID==="function")return crypto.randomUUID();
 return "lab-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,12);
}

function isContent(value:unknown):value is GeneratedStudyContent{
 if(!value||typeof value!=="object")return false;
 const item=value as Record<string,unknown>;
 return ["title","summary","context","exegesis","pentecostal_arminian_lens","application","prayer"].every(key=>typeof item[key]==="string")
  && (item.theological_connection===null||typeof item.theological_connection==="string")
  && Array.isArray(item.reflection_questions)
  && item.reflection_questions.every(question=>typeof question==="string");
}

export async function generateStudy(input:{journeyDay:number;layer:1|2|3;chapterRefs:string[]}):Promise<GeneratedStudy>{
 if(!supabase)throw Error("Serviço de estudos indisponível.");
 const {data,error}=await supabase.functions.invoke("study-generate",{
  body:{journey_day:input.journeyDay,layer:input.layer,chapter_refs:input.chapterRefs},
  headers:{"Idempotency-Key":idempotencyKey()},
 });
 if(error)throw error;
 if(!data||typeof data.study_key!=="string"||!Array.isArray(data.chapter_refs)||!isContent(data.content))
  throw Error("O servidor retornou um estudo inválido.");
 return data as GeneratedStudy;
}

/** Read published curated units under the caller's RLS before any paid generation. */
export async function loadDayStudies(input:{journeyDay:number;layer:1|2|3;chapterRefs:string[]}):Promise<GeneratedStudy[]>{
 if(!supabase)throw Error("Serviço de estudos indisponível.");
 const {data,error}=await supabase.from("lab_v2_study_content")
  .select("study_key,title,content,chapter_refs,layer,journey_day,cached_at")
  .eq("journey_key","bible-annual").eq("journey_day",input.journeyDay).eq("layer",input.layer)
  .eq("publication_status","published").eq("source_kind","curated")
  .order("cached_at",{ascending:false});
 if(error)throw Error("Não foi possível consultar os estudos publicados. Tente novamente.");
 const units=new Map<string,GeneratedStudy>();
 for(const row of data??[]){
  if(row.journey_day!==input.journeyDay||row.layer!==input.layer||typeof row.study_key!=="string"||typeof row.title!=="string"||!isContent(row.content)||!Array.isArray(row.chapter_refs))continue;
  const refs=row.chapter_refs as unknown[];
  if(!refs.length||!refs.every((ref):ref is string=>typeof ref==="string"&&input.chapterRefs.includes(ref)))continue;
  if(new Set(refs).size!==refs.length||refs.some((ref,i)=>i>0&&input.chapterRefs.indexOf(ref)<=input.chapterRefs.indexOf(refs[i-1])))continue;
  const key=refs.join(",");
  if(!units.has(key))units.set(key,{study_key:row.study_key,title:row.title,content:row.content,chapter_refs:refs,layer:input.layer,cache:true});
 }
 if(!units.size)return [await generateStudy(input)];
 const ordered=[...units.values()].sort((a,b)=>input.chapterRefs.indexOf(a.chapter_refs[0])-input.chapterRefs.indexOf(b.chapter_refs[0]));
 const covered=ordered.flatMap(unit=>unit.chapter_refs);
 if(new Set(covered).size!==covered.length||covered.length!==input.chapterRefs.length||!input.chapterRefs.every(ref=>covered.includes(ref)))
  throw Error("Os estudos publicados desta etapa ainda estão em revisão. Nenhuma nova geração foi solicitada.");
 return ordered;
}
