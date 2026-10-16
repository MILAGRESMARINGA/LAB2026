import {describe,it,expect} from "vitest";
import {CANON} from "../src/domain/canon";
import {adjacentBibleReference,bibleChapterReference,bibleReferenceById,searchCanonicalBooks} from "../src/domain/bible-navigation";
describe("Navegação da Bíblia completa",()=>{
 it("identifica livros e capítulos no padrão do banco",()=>{
  expect(bibleChapterReference("Gênesis",1).chapterId).toBe("1:1");
  expect(bibleChapterReference("João",1).chapterId).toBe("43:1");
  expect(bibleReferenceById("66:22").book).toBe("Apocalipse");
 });
 it("passa de Gênesis a Êxodo e do último capítulo de Judas a Apocalipse",()=>{
  expect(adjacentBibleReference("Gênesis",50,1)?.chapterId).toBe("2:1");
  expect(adjacentBibleReference("Êxodo",1,-1)?.chapterId).toBe("1:50");
  expect(adjacentBibleReference("Judas",1,1)?.book).toBe("Apocalipse");
 });
 it("não permite ultrapassar os limites",()=>{
  expect(adjacentBibleReference("Gênesis",1,-1)).toBeNull();
  expect(adjacentBibleReference("Apocalipse",22,1)).toBeNull();
  expect(()=>bibleChapterReference("Gênesis",51)).toThrow();
  expect(()=>bibleReferenceById("66:23")).toThrow();
 });
 it("encontra os 66 livros e permite busca sem acentos",()=>{
  expect(searchCanonicalBooks("")).toHaveLength(66);
  expect(searchCanonicalBooks("genesis")).toContain("Gênesis");
  expect(searchCanonicalBooks("corintios")).toContain("1 Coríntios");
  expect(searchCanonicalBooks("APOCALIPSE")).toEqual(["Apocalipse"]);
  expect(CANON.map(([book])=>bibleChapterReference(book,1).chapterId)).toHaveLength(66);
 });
});
