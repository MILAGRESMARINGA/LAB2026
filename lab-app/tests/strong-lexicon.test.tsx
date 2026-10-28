import {describe,it,expect} from "vitest";
import {normalizeStrongTerms,validateStrongReference,STRONG_READER_READY} from "../src/features/strong-lexicon";
import {renderToStaticMarkup} from "react-dom/server";
import {StrongVerseTool} from "../src/components/StrongVerseTool";
describe("Strong lexical UX",()=>{
 it("stays locked until editorial publication and migration is explicitly enabled",()=>{
  expect(STRONG_READER_READY).toBe(false);
 });
 it("accepts canonical chapter IDs and verse limits",()=>{
  expect(()=>validateStrongReference("1:1",1)).not.toThrow();
  expect(()=>validateStrongReference("43:1",14)).not.toThrow();
  expect(()=>validateStrongReference("66:22",21)).not.toThrow();
  expect(()=>validateStrongReference("67:1",1)).toThrow();
  expect(()=>validateStrongReference("1:1",0)).toThrow();
  expect(()=>validateStrongReference("1:1",177)).toThrow();
  expect(()=>validateStrongReference("1:1",1.5)).toThrow();
 });
 it("rejects malformed lexical rows without generating definitions",()=>{
  expect(normalizeStrongTerms("wrong")).toEqual([]);
  expect(normalizeStrongTerms([{}, {strong_number:"G1",lemma:"ἀ",token_ordinal:-1,language:"greek",translation_status:"reviewed"}])).toEqual([]);
  expect(normalizeStrongTerms([{
   strong_number:"G3056",token_ordinal:1,token_text:"Word",language:"greek",
   lemma:"λόγος",transliteration:"logos",translated_gloss:"palavra",
   translated_definition:null,translation_status:"machine",source_name:"TBESG"
  }])).toHaveLength(1);
 });
 it("hides study Strong selector for non-canonical references",()=>{
  expect(renderToStaticMarkup(<StrongVerseTool chapterRefs={["XX:1"]}/>)).toBe("");
 });
 it("lists canonical references and a selectable verse without claiming PT-BR word mapping",()=>{
  const html=renderToStaticMarkup(<StrongVerseTool chapterRefs={["1:1","43:1"]}/>);
  expect(html).toContain("Gênesis 1");
  expect(html).toContain("João 1");
  expect(html).toContain("não é marcação palavra por palavra");
 });
});
