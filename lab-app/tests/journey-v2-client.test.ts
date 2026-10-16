import {beforeEach,describe,expect,it,vi} from "vitest";
const {rpc,from}=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn()}));
vi.mock("../src/lib/supabase",()=>({supabase:{rpc,from}}));
import {
 startJourneyV2,syncJourneyV2,activateJourneyV2,beginJourneyV2Chapter,
 confirmJourneyV2Chapter,getJourneyV2Chapters
} from "../src/features/journey-v2";

const id="11111111-1111-4111-8111-111111111111";
const state={
 run_id:id,status:"active",plan_length:365,stage:1,
 activated_at:null,completed_at:null,next_eligible_at:null,
 normal_deadline_at:null,grace_deadline_at:null,
 run_xp:0,best_completed_stages:0,remaining_lives_this_month:3,
 server_at:"2026-10-16T12:00:00Z"
};
describe("Jornada V2 só funciona com duas travas explícitas",()=>{
 beforeEach(()=>{
  vi.unstubAllEnvs();
  vi.stubEnv("VITE_LAB_V2_READY","false");
  rpc.mockReset();from.mockReset();
  rpc.mockResolvedValue({data:state,error:null});
 });
 it("começa DESATIVADA e nem envia uma RPC por acidente",async()=>{
  await expect(startJourneyV2(365)).rejects.toThrow("homologação");
  await expect(syncJourneyV2(id)).rejects.toThrow("homologação");
  expect(rpc).not.toHaveBeenCalled();
  expect(from).not.toHaveBeenCalled();
 });
 it("ativação explícita chama apenas o servidor V2 e não as RPCs V1",async()=>{
  vi.stubEnv("VITE_LAB_V2_READY","true");
  await expect(startJourneyV2(365)).resolves.toMatchObject({run_xp:0});
  await activateJourneyV2(id,1);
  await beginJourneyV2Chapter(id,1,"1:1");
  await confirmJourneyV2Chapter(id,1,"1:1");
  await syncJourneyV2(id);
  expect(rpc).toHaveBeenNthCalledWith(1,"lab_v2_start",{p_plan_length:365});
  expect(rpc).toHaveBeenNthCalledWith(2,"lab_v2_activate",{p_run:id,p_stage:1});
  expect(rpc).toHaveBeenNthCalledWith(3,"lab_v2_begin_chapter",{p_run:id,p_stage:1,p_chapter:"1:1"});
  expect(rpc).toHaveBeenNthCalledWith(4,"lab_v2_confirm",{p_run:id,p_stage:1,p_chapter:"1:1"});
  expect(rpc).toHaveBeenNthCalledWith(5,"lab_v2_sync",{p_run:id});
 });
 it("não aceita identificadores, capítulos ou etapas inválidas",async()=>{
  vi.stubEnv("VITE_LAB_V2_READY","true");
  expect(()=>confirmJourneyV2Chapter(id,1,"<script>")).toThrow("Capítulo");
  expect(()=>activateJourneyV2(id,0)).toThrow("Etapa");
  expect(()=>syncJourneyV2("another-user")).toThrow("Identificador");
  expect(rpc).not.toHaveBeenCalled();
 });
 it("nega resposta desconhecida do servidor sem inventar XP",async()=>{
  vi.stubEnv("VITE_LAB_V2_READY","true");
  rpc.mockResolvedValue({data:{status:"active",run_xp:-20},error:null});
  await expect(syncJourneyV2(id)).rejects.toThrow("Resposta");
 });
 it("trata erros do PostgreSQL como falhas reais",async()=>{
  vi.stubEnv("VITE_LAB_V2_READY","true");
  rpc.mockResolvedValue({data:null,error:new Error("Não há vidas restantes")});
  await expect(syncJourneyV2(id)).rejects.toThrow("vidas");
 });
 it("consulta capítulos ordenados sem liberar etapas fora de 3/4",async()=>{
  vi.stubEnv("VITE_LAB_V2_READY","true");
  const chapters=["1:1","19:1","43:1"].map((chapter_id,i)=>({
   day_number:1,slot:i+1,chapter_id
  }));
  const chain={select:vi.fn(),eq:vi.fn(),order:vi.fn()};
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockResolvedValue({data:chapters,error:null});
  from.mockReturnValue(chain);
  await expect(getJourneyV2Chapters(365,1)).resolves.toEqual(chapters);
  expect(from).toHaveBeenCalledWith("lab_v2_plan_chapters");
  expect(chain.order).toHaveBeenCalledWith("slot",{ascending:true});
  chain.order.mockResolvedValue({data:chapters.slice(0,2),error:null});
  await expect(getJourneyV2Chapters(365,1)).rejects.toThrow("incompleto");
 });
});
