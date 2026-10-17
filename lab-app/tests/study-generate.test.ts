import {beforeEach,describe,expect,it,vi} from "vitest";
const {invoke}=vi.hoisted(()=>({invoke:vi.fn()}));
vi.mock("../src/lib/supabase",()=>({supabase:{functions:{invoke}}}));
import {generateStudy} from "../src/features/study-generate";

const content={title:"Estudo",summary:"Resumo",context:"Contexto",exegesis:"Exegese",theological_connection:null,pentecostal_arminian_lens:"Lente",application:"Prática",reflection_questions:["Pergunta"],prayer:"Oração"};
describe("cliente do gerador de estudos",()=>{
 beforeEach(()=>invoke.mockReset());
 it("envia referências e idempotência ao Edge Function e aceita cache",async()=>{
  invoke.mockResolvedValue({data:{study_key:"d1",title:"Estudo",content,chapter_refs:["1:1"],layer:1,cache:true},error:null});
  await expect(generateStudy({journeyDay:1,layer:1,chapterRefs:["1:1"]})).resolves.toMatchObject({cache:true,layer:1});
  expect(invoke).toHaveBeenCalledWith("study-generate",expect.objectContaining({body:{journey_day:1,layer:1,chapter_refs:["1:1"]},headers:expect.objectContaining({"Idempotency-Key":expect.any(String)})}));
 });
 it("não aceita conteúdo que não tenha o schema editorial",async()=>{
  invoke.mockResolvedValue({data:{study_key:"d1",content:{},chapter_refs:["1:1"],layer:1},error:null});
  await expect(generateStudy({journeyDay:1,layer:1,chapterRefs:["1:1"]})).rejects.toThrow("inválido");
 });
});
