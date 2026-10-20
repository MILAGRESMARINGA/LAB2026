/** Curated offsets are UTF-16, matching String.slice; end is exclusive. */
export type JesusSpeechSpan={start:number;end:number;sourceText?:string};
export type BibleSpeechPart={text:string;isWordsOfJesus:boolean};
export function splitVerseSpeech(text:string,spans:readonly JesusSpeechSpan[]=[]):BibleSpeechPart[]{
 const plain=[{text,isWordsOfJesus:false}];
 if(!spans.length)return plain;
 const ordered=[...spans].sort((a,b)=>a.start-b.start);
 let cursor=0;
 const parts:BibleSpeechPart[]=[];
 const splitsSurrogate=(offset:number)=>offset>0&&offset<text.length&&/[\uD800-\uDBFF]/.test(text[offset-1])&&/[\uDC00-\uDFFF]/.test(text[offset]);
 for(const span of ordered){
  if(!Number.isInteger(span.start)||!Number.isInteger(span.end)||span.start<cursor||span.end<=span.start||span.end>text.length||splitsSurrogate(span.start)||splitsSurrogate(span.end)||(span.sourceText!==undefined&&span.sourceText!==text))return plain;
  if(span.start>cursor)parts.push({text:text.slice(cursor,span.start),isWordsOfJesus:false});
  parts.push({text:text.slice(span.start,span.end),isWordsOfJesus:true});
  cursor=span.end;
 }
 if(cursor<text.length)parts.push({text:text.slice(cursor),isWordsOfJesus:false});
 return parts;
}
