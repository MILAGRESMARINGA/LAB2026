import {beforeEach,describe,expect,it,vi} from "vitest";
const {invoke,from,order,eq}=vi.hoisted(()=>({invoke:vi.fn(),from:vi.fn(),order:vi.fn(),eq:vi.fn()}));
vi.mock("../src/lib/supabase",()=>({supabase:{from,functions:{invoke}}}));
import {loadDayStudies} from "../src/features/study-generate";
const content={title:"Estudo",summary:"Resumo",context:"Contexto",exegesis:"Exegese",theological_connection:null,pentecostal_arminian_lens:"Lente",application:"Prática",reflection_questions:["Pergunta"],prayer:"Oração"};
const row=(key:string,refs:string[])=>({study_key:key,title:key,content,chapter_refs:refs,layer:1,journey_day:1});
const input={journeyDay:1,layer:1 as const,chapterRefs:["1:1","43:1","19:1"]};
describe("unidades curadas do dia",()=>{
 beforeEach(()=>{vi.clearAllMocks();const query={select:vi.fn().mockReturnThis(),eq,order};eq.mockReturnValue(query);from.mockReturnValue(query)});
 it("preserva Gn1+Jo1 conectados e Sl1 separado sem invocar o provedor",async()=>{
  order.mockResolvedValue({data:[row("salmo",["19:1"]),row("criacao",["1:1","43:1"])],error:null});
  const units=await loadDayStudies(input);
  expect(units.map(u=>u.study_key)).toEqual(["criacao","salmo"]);
  expect(units.every(u=>u.cache)).toBe(true);
  expect(eq).toHaveBeenCalledWith("publication_status","published");
  expect(eq).toHaveBeenCalledWith("source_kind","curated");
  expect(invoke).not.toHaveBeenCalled();
 });
 it("ignora refs fora do plano e usa somente a revisão mais recente da unidade",async()=>{
  order.mockResolvedValue({data:[row("novo",["1:1","43:1"]),row("antigo",["1:1","43:1"]),row("outro-plano",["19:3"]),row("salmo",["19:1"])],error:null});
  expect((await loadDayStudies(input)).map(u=>u.study_key)).toEqual(["novo","salmo"]);
  expect(invoke).not.toHaveBeenCalled();
 });
 it("cache incompleto ou sobreposto bloqueia sem desperdício de geração",async()=>{
  for(const data of [[row("parte",["1:1"])],[row("a",input.chapterRefs),row("b",["19:1"])]]){
   order.mockResolvedValue({data,error:null});
   await expect(loadDayStudies(input)).rejects.toThrow("Nenhuma nova geração");
  }
  expect(invoke).not.toHaveBeenCalled();
 });
 it("falha de consulta não vira uma chamada paga",async()=>{
  order.mockResolvedValue({data:null,error:{message:"offline"}});
  await expect(loadDayStudies(input)).rejects.toThrow("consultar");
  expect(invoke).not.toHaveBeenCalled();
 });
 it("sem unidades curadas mantém geração existente validada pelo servidor",async()=>{
  order.mockResolvedValue({data:[],error:null});
  invoke.mockResolvedValue({data:{...row("gerado",input.chapterRefs),cache:false},error:null});
  expect((await loadDayStudies(input))[0].study_key).toBe("gerado");
  expect(invoke).toHaveBeenCalledTimes(1);
 });
});
