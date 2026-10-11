import {describe,expect,it} from "vitest";
import {getBibleProjectVideoForChapter} from "../src/domain/bibleproject";
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
 it("usa playlist YouTube incorporada quando não há ID validado",()=>{
  const player=embeddedPlayer(joel,"Joel");
  expect(player.exact).toBe(false);
  expect(player.src).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/videoseries\?list=/);
 });
 it("não aceita referências bíblicas fora do cânon",async()=>{
  await expect(readBibleChapter("67:1")).rejects.toThrow("Referência inválida");
  await expect(readBibleChapter("../secret")).rejects.toThrow("Referência inválida");
 });
});
