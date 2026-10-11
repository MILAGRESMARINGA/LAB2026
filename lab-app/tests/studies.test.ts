import {describe,it,expect} from "vitest";
import {CANON,OLD_TESTAMENT,NEW_TESTAMENT} from "../src/domain/canon";
import {categoryOfBook,STUDY_BLOCKS} from "../src/domain/studies";
import {BIBLEPROJECT_VIDEO_LINKS,BIBLEPROJECT_PLAYLISTS,getBibleProjectVideos,getBibleProjectVideoForChapter,getBibleProjectPlaylist} from "../src/domain/bibleproject";

describe("conteúdo pedagógico sem alteração do cânon",()=>{
 it("classifica os 66 livros sem lacunas",()=>{for(const [book] of CANON)expect(()=>categoryOfBook(book)).not.toThrow()});
 it("não inclui livros desconhecidos",()=>expect(()=>categoryOfBook("Livro inventado")).toThrow());
 it("inclui Gênesis 1 e João 1 nas conexões",()=>{const creation=STUDY_BLOCKS.find(b=>b.id==="criacao");expect(creation?.references).toEqual(["Gênesis 1","João 1"])});
});

describe("Panoramas BibleProject pt-BR",()=>{
 it("cobre os 66 livros do cânon com pelo menos um recurso verificado",()=>{
  expect(Object.keys(BIBLEPROJECT_VIDEO_LINKS)).toHaveLength(66);
  for(const [book] of CANON)expect(getBibleProjectVideos(book).length,book).toBeGreaterThan(0);
 });
 it("não referencia livros fora do cânon",()=>{
  const canonical=new Set(CANON.map(([book])=>book));
  for(const book of Object.keys(BIBLEPROJECT_VIDEO_LINKS))expect(canonical.has(book),book).toBe(true);
 });
 it("usa apenas URLs de recursos oficiais em português",()=>{
  for(const resource of Object.values(BIBLEPROJECT_VIDEO_LINKS).flat()){
   const url=new URL(resource.url);
   expect(url.protocol).toBe("https:");
   expect(url.hostname).toBe("bibleproject.com");
   expect(url.pathname.startsWith("/pt-br/videos/")||url.pathname.startsWith("/pt-br/guides/")).toBe(true);
  }
 });
 it("usa vídeo da parte certa de Gênesis e João",()=>{
  expect(getBibleProjectVideoForChapter("Gênesis",1)?.url).toContain("/videos/genesis-1-11/");
  expect(getBibleProjectVideoForChapter("Gênesis",12)?.url).toContain("/videos/genesis-12-50/");
  expect(getBibleProjectVideoForChapter("João",12)?.url).toContain("/videos/joao-1-12/");
  expect(getBibleProjectVideoForChapter("João",13)?.url).toContain("/videos/joao-13-21/");
 });
 it("mantém panoramas compartilhados de livros agrupados",()=>{
  expect(getBibleProjectVideos("1 Reis")[0].url).toBe(getBibleProjectVideos("2 Reis")[0].url);
  expect(getBibleProjectVideos("1 João")[0].url).toBe(getBibleProjectVideos("3 João")[0].url);
  expect(getBibleProjectVideos("Esdras")[0].url).toBe(getBibleProjectVideos("Neemias")[0].url);
 });
 it("associa os dois conjuntos do YouTube por testamento",()=>{
  for(const [book] of OLD_TESTAMENT)expect(getBibleProjectPlaylist(book)).toBe(BIBLEPROJECT_PLAYLISTS.AT);
  for(const [book] of NEW_TESTAMENT)expect(getBibleProjectPlaylist(book)).toBe(BIBLEPROJECT_PLAYLISTS.NT);
 });
 it("não permite associação de vídeo a livro inexistente",()=>{
  expect(getBibleProjectVideoForChapter("Livro inventado",1)).toBeUndefined();
  expect(getBibleProjectPlaylist("Livro inventado")).toBeUndefined();
 });
 it("inclui guias oficiais quando o vídeo individual não foi confirmado separadamente",()=>{
  for(const book of ["Cânticos","Sofonias","Judas"])
   expect(getBibleProjectVideos(book)[0].kind).toBe("guide");
 });
});