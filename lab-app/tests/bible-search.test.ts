import {beforeEach,describe,it,expect,vi} from "vitest";
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock("../src/lib/supabase",()=>({supabase:{rpc}}));
import {searchBibleVerses} from "../src/features/bible";
describe("Busca pública de versículos",()=>{
 beforeEach(()=>rpc.mockReset());
 it("consulta a função correta e mantém o número do versículo",async()=>{
  const sample=[{book_name:"João",chapter_id:"43:1",chapter_number:1,verse_number:1,verse_text:"No principio era o Verbo"}];
  rpc.mockResolvedValue({data:sample,error:null});
  const matches=await searchBibleVerses("  principio  ");
  expect(rpc).toHaveBeenCalledWith("lab_bible_search",{p_query:"principio",p_limit:40});
  expect(matches).toEqual(sample);
 });
 it("não consulta textos excessivamente curtos ou longos",async()=>{
  await expect(searchBibleVerses("a")).rejects.toThrow("2 a 100");
  await expect(searchBibleVerses("x".repeat(101))).rejects.toThrow("2 a 100");
  expect(rpc).not.toHaveBeenCalled();
 });
 it("limita a quantidade de resultados para evitar consultas ilimitadas",async()=>{
  rpc.mockResolvedValue({data:[],error:null});
  await searchBibleVerses("Jesus",999);
  expect(rpc).toHaveBeenCalledWith("lab_bible_search",{p_query:"Jesus",p_limit:50});
 });
 it("retorna erro legível sem alterar a pontuação do jogo",async()=>{
  rpc.mockResolvedValue({data:null,error:{message:"Banco temporariamente indisponível"}});
  await expect(searchBibleVerses("amor")).rejects.toThrow("Não foi possível pesquisar");
  expect(rpc).toHaveBeenCalledTimes(1);
 });
});
