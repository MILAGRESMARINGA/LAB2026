import {describe,expect,it} from "vitest";
import {splitVerseSpeech} from "../src/domain/bible-speech";
describe("curated Jesus speech spans",()=>{
 it("preserves the narrator and marks only the approved quoted range",()=>{
  expect(splitVerseSpeech("Disse: Paz!",[{start:7,end:11,sourceText:"Disse: Paz!"}])).toEqual([
   {text:"Disse: ",isWordsOfJesus:false},{text:"Paz!",isWordsOfJesus:true},
  ]);
 });
 it("never guesses speech from unannotated text",()=>{
  expect(splitVerseSpeech("Jesus respondeu.")).toEqual([{text:"Jesus respondeu.",isWordsOfJesus:false}]);
 });
 it("fails closed on drift, overlap and invalid offsets without losing text",()=>{
  for(const spans of [[{start:0,end:4,sourceText:"old"}],[{start:0,end:4},{start:3,end:5}],[{start:0,end:99}],[{start:0.5,end:2}]]){
   expect(splitVerseSpeech("narrador",spans)).toEqual([{text:"narrador",isWordsOfJesus:false}]);
  }
 });
 it("does not split Unicode surrogate pairs and preserves valid surrounding text",()=>{
  expect(splitVerseSpeech("😀 Paz",[{start:1,end:2}])).toEqual([{text:"😀 Paz",isWordsOfJesus:false}]);
  expect(splitVerseSpeech("😀 Paz",[{start:3,end:6}]).map(p=>p.text).join("")).toBe("😀 Paz");
 });
});
