import {describe,expect,it} from "vitest";
import {getBibleProjectVideoForChapter,getNewTestamentVideoCatalog,getBibleProjectVideos} from "../src/domain/bibleproject";
import {OLD_TESTAMENT,NEW_TESTAMENT} from "../src/domain/canon";
import {embeddedPlayer,videoKeyFromUrl} from "../src/components/BibleProjectPlayer";
import {readBibleChapter} from "../src/features/bible";

describe("Vídeos BibleProject integrados",()=>{
 const genesis=getBibleProjectVideoForChapter("Gênesis",1)!;
 const exodus=getBibleProjectVideoForChapter("Êxodo",1)!;
 const joel=getBibleProjectVideoForChapter("Joel",1)!;
 it("normaliza apenas links oficiais para recompensas únicas",()=>{
  expect(videoKeyFromUrl(genesis.url)).toBe("videos:genesis-1-11");
  expect(()=>videoKeyFromUrl("https://example.net/pt-br/videos/genesis-1-11/")).toThrow();
  expect(()=>videoKeyFromUrl("https://bibleproject.com/pt-br/not-video/xxx/")).toThrow();
 });
 it("usa reprodução específica oficial para o panorama conhecido",()=>{
  const player=embeddedPlayer(genesis,"Gênesis");
  expect(player.exact).toBe(true);
  expect(player.src).toMatch(/^https:\/\/player\.mux\.com\/[A-Za-z0-9]+$/);
 });
 it("abre diretamente os panoramas confirmados de Êxodo e livros históricos",()=>{
  expect(embeddedPlayer(exodus,"Êxodo").exact).toBe(true);
  const kings=getBibleProjectVideoForChapter("1 Reis",1)!;
  expect(embeddedPlayer(kings,"1 Reis").src).toMatch(/^https:\/\/player\.mux\.com\//);
 });
 it("reproduz no player integrado todos os panoramas verificados do catálogo oficial do NT",()=>{
  const catalog=getNewTestamentVideoCatalog();
  expect(catalog.length).toBeGreaterThanOrEqual(30);
  for(const {book,resource} of catalog){
   const player=embeddedPlayer(resource,book);
   expect(player.exact,book+" · "+resource.title).toBe(true);
   expect(player.src).toMatch(/^https:\/\/player\.mux\.com\/[A-Za-z0-9]+$/);
  }
 });
 it("mantém o fallback externo quando o recurso não pertence ao livro solicitado",()=>{
  const matthew=getBibleProjectVideoForChapter("Mateus",1)!;
  expect(embeddedPlayer(matthew,"Lucas")).toEqual({src:null,exact:false});
 });
 it("reproduz Joel no player integrado com o panorama correto",()=>{
  const player=embeddedPlayer(joel,"Joel");
  expect(player.exact).toBe(true);
  expect(player.src).toContain("TRxY1it9PYtn4029XOvmawOB3YtlH9cQl7e5AowkPUEo");
  const marcos=getBibleProjectVideoForChapter("Marcos",1)!;
  expect(embeddedPlayer(marcos,"Marcos").exact).toBe(true);
  expect(embeddedPlayer(marcos,"Marcos").src).toMatch(/^https:\/\/player\.mux\.com\//);
 });
 it("cobre os 66 livros e todas as partes no mesmo player de Gênesis",()=>{
  const canon=[...OLD_TESTAMENT,...NEW_TESTAMENT];
  expect(canon).toHaveLength(66);
  for(const [book] of canon){
   const resources=getBibleProjectVideos(book);
   expect(resources.length,book).toBeGreaterThan(0);
   for(const resource of resources){
    expect(embeddedPlayer(resource,book).exact,book+": "+resource.title).toBe(true);
    expect(embeddedPlayer(resource,book).src).toMatch(/^https:\/\/player\.mux\.com\/[A-Za-z0-9]+$/);
   }
  }
 });
 it("não aceita referências bíblicas fora do cânon",async()=>{
  await expect(readBibleChapter("67:1")).rejects.toThrow("Referência inválida");
  await expect(readBibleChapter("../secret")).rejects.toThrow("Referência inválida");
 });
});
