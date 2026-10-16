import {beforeEach,describe,expect,it,vi} from "vitest";
const {getUser,from,calls}=vi.hoisted(()=>({
 getUser:vi.fn(),from:vi.fn(),
 calls:[] as Array<{table:string;filter:string;value:unknown;start:number;end:number}>
}));
vi.mock("../src/lib/supabase",()=>({
 supabase:{auth:{getUser},from}
}));
import {buildAccountExport} from "../src/features/account-export";

const uid="11111111-1111-4111-8111-111111111111";
const v2id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const v1id="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const fixtures:Record<string,Record<string,unknown>[]> = {
 lab_v2_runs:[{id:v2id,user_id:uid,status:"completed"}],
 lab_game_runs:[{id:v1id,user_id:uid,status:"failed"}],
 lab_v2_video_rewards:[{run_id:v2id,video_key:"videos:genesis-1-11",awarded_xp:5}],
 lab_v2_video_sessions:[{run_id:v2id,video_key:"videos:genesis-1-11",active_seconds:90}],
 lab_v2_study_rewards:[{run_id:v2id,study_key:"criacao",awarded_xp:15}],
 lab_v2_chapter_checks:[{run_id:v2id,day_number:1,chapter_id:"1:1"}]
};
describe("Exportação integral e privada de dados do LABGAME",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  calls.length=0;
  getUser.mockResolvedValue({data:{user:{id:uid,email:"leitor@example.org"}},error:null});
  from.mockImplementation((table:string)=>{
   let filter="",value:unknown;
   const query={
    select:vi.fn().mockReturnThis(),
    eq:vi.fn((field:string,v:unknown)=>{filter=field;value=v;return query}),
    in:vi.fn((field:string,v:unknown)=>{filter=field;value=v;return query}),
    range:vi.fn(async(start:number,end:number)=>{
     calls.push({table,filter,value,start,end});
     return {data:(fixtures[table]??[]).filter(record=>{
      if(filter==="user_id")return record.user_id===value;
      if(filter==="run_id")return (value as string[]).includes(String(record.run_id));
      return true;
     }).slice(start,end+1),error:null};
    })
   };
   return query;
  });
 });
 it("inclui as recompensas de estudos e vídeos da V2 sem misturar contas",async()=>{
  const result=await buildAccountExport();
  expect(result.format).toBe("labgame-user-export-v2");
  expect(result.account).toEqual({id:uid,email:"leitor@example.org"});
  expect(result.tables.lab_v2_video_sessions).toHaveLength(1);
  expect(result.tables.lab_v2_video_rewards).toHaveLength(1);
  expect(result.tables.lab_v2_study_rewards).toHaveLength(1);
  expect(result.tables.lab_v2_chapter_checks).toHaveLength(1);
  for(const table of ["lab_v2_video_sessions","lab_v2_video_rewards","lab_v2_study_rewards"]){
   expect(calls.some(c=>c.table===table&&c.filter==="run_id"&&
    Array.isArray(c.value)&&c.value.length===1&&c.value[0]===v2id)).toBe(true);
  }
  expect(calls.filter(c=>c.filter==="user_id").every(c=>c.value===uid)).toBe(true);
 });
 it("sem runs próprias não consulta recompensas do grupo nem de estranhos",async()=>{
  const source=fixtures.lab_v2_runs;
  fixtures.lab_v2_runs=[];
  try{
   const exportData=await buildAccountExport();
   expect(exportData.tables.lab_v2_video_rewards).toEqual([]);
   expect(exportData.tables.lab_v2_study_rewards).toEqual([]);
   expect(calls.some(c=>c.table==="lab_v2_video_rewards")).toBe(false);
  }finally{fixtures.lab_v2_runs=source;}
 });
 it("não permite exportação sem autenticação",async()=>{
  getUser.mockResolvedValue({data:{user:null},error:null});
  await expect(buildAccountExport()).rejects.toThrow("Entre na sua conta");
  expect(from).not.toHaveBeenCalled();
 });
});
