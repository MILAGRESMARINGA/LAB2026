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
