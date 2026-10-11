import {beforeEach,describe,expect,it,vi} from "vitest";
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock("../src/lib/supabase",()=>({supabase:{rpc}}));
import {loadGameScorecard,loadGroupSummary,getGameRanking,getGCLeague} from "../src/features/lab-game";
describe("Matemática e consultas dos rankings LABGAME",()=>{
 beforeEach(()=>rpc.mockReset());
 it("recebe pontuação individual separada em leitura e vídeos",async()=>{
  const response={
   chapters_confirmed:3,panoramas_confirmed:2,
   reading_xp:30,video_xp:10,total_xp:40,recorded_xp:40,
   balanced:true,current_streak:1,best_streak:1,total_completed_days:1,
   chapter_rate:10,video_rate:5
  };
  rpc.mockResolvedValue({data:response,error:null});
  const score=await loadGameScorecard();
  expect(score.total_xp).toBe(score.reading_xp+score.video_xp);
  expect(score.total_xp).toBe(score.chapters_confirmed*score.chapter_rate+score.panoramas_confirmed*score.video_rate);
  expect(rpc).toHaveBeenCalledWith("lab_game_scorecard");
 });
 it("consulta perfil coletivo só pelo ID do GC",async()=>{
  const response={
   group_id:"00000000-0000-0000-0000-000000000001",
   name:"GC Teste",owner_id:"owner",
   members:4,consenting_members:3,completed_member_days_7:7,
   compliance_pct:33.3,window_start:"2026-10-05",window_end:"2026-10-11"
  };
  rpc.mockResolvedValue({data:response,error:null});
  const summary=await loadGroupSummary(response.group_id);
  expect(summary.compliance_pct).toBeCloseTo(summary.completed_member_days_7/(7*summary.consenting_members)*100,1);
  expect(rpc).toHaveBeenCalledWith("lab_game_group_summary",{p_group_id:response.group_id});
 });
 it("requer token de grupo e não confunde ranking semanal com ranking individual",async()=>{
  rpc.mockResolvedValueOnce({data:[{participant:"João",best_days:8,completed_days:8,total_xp:300}],error:null});
  rpc.mockResolvedValueOnce({data:[{rank_position:1,group_name:"GC",members:4,consenting_members:3,days_completed:7,compliance_pct:33.3}],error:null});
  const group=await getGameRanking("gc-id");
  const league=await getGCLeague();
  expect(group[0].best_days).toBe(8);
  expect(league[0].consenting_members).toBe(3);
  expect(rpc).toHaveBeenNthCalledWith(1,"lab_game_group_ranking",{p_group_id:"gc-id"});
  expect(rpc).toHaveBeenNthCalledWith(2,"lab_game_gc_league");
 });
 it("repassa falha do servidor sem mostrar pontos inventados",async()=>{
  rpc.mockResolvedValue({data:null,error:new Error("Acesso ao grupo não autorizado")});
  await expect(loadGroupSummary("gc-id")).rejects.toThrow("Acesso");
 });
});
