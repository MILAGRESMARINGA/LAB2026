import {beforeEach,describe,expect,it,vi} from "vitest";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
const {getUser,upsert,from,rpc}=vi.hoisted(()=>({
 getUser:vi.fn(),upsert:vi.fn(),from:vi.fn(),rpc:vi.fn()
}));
vi.mock("../src/lib/supabase",()=>({supabase:{auth:{getUser},from,rpc}}));
vi.mock("../src/features/auth",()=>({signIn:vi.fn(),signOut:vi.fn()}));
import {
 saveNoticePreferences,saveMemberProfile,resetAllJourneyData,
 EMPTY_MEMBER_PROFILE,DEFAULT_NOTICES
} from "../src/features/profile-settings";
import {ProfileSettings} from "../src/components/ProfileSettings";

describe("Configurações privadas LABGAME",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  getUser.mockResolvedValue({data:{user:{id:"member-one",email:"a@example.org"}},error:null});
  upsert.mockResolvedValue({error:null});
  from.mockImplementation(()=>({upsert}));
  rpc.mockResolvedValue({data:{day:1,total_xp:0},error:null});
 });
 it("inicia notificações desligadas e não promete envios de e-mail ativos",()=>{
  expect(DEFAULT_NOTICES.enabled).toBe(false);
  expect(DEFAULT_NOTICES.email).toBe(false);
  expect(DEFAULT_NOTICES.in_app_popup).toBe(false);
  const html=renderToStaticMarkup(createElement(ProfileSettings,{
   accountEmail:"a@example.org",onReset:async()=>{},onDeleted:()=>{}
  }));
  expect(html).toContain("Notificações");
  expect(html).toContain("Pop-ups dentro do aplicativo");
  expect(html).toContain("envios automáticos ainda não estão ativados");
  expect(html).toContain("Zerar toda a minha jornada");
  expect(html).toContain("Excluir minha conta definitivamente");
  expect(html).toContain("Documentos (CPF/RG)");
 });
 it("notificações desligadas anulam todos os canais e categorias no banco",async()=>{
  await saveNoticePreferences({
   enabled:false,in_app_popup:true,email:true,
   reading_reminders:true,gc_activity:true,milestones:true
  });
  expect(upsert).toHaveBeenCalledWith({
   user_id:"member-one",enabled:false,in_app_popup:false,email:false,
   reading_reminders:false,gc_activity:false,milestones:false
  },{onConflict:"user_id"});
 });
 it("grava dados ministeriais apenas com consentimento explícito",async()=>{
  await saveMemberProfile({...EMPTY_MEMBER_PROFILE,church_name:"Igreja Exemplo"},true);
  expect(upsert.mock.calls[0][0].church_name).toBe("Igreja Exemplo");
  expect(upsert.mock.calls[0][0].religious_data_consent_at).toBeTruthy();
 });
 it("não envia dados religiosos quando o consentimento for retirado",async()=>{
  await saveMemberProfile({
   ...EMPTY_MEMBER_PROFILE,full_name:"Ana da Silva",
   church_name:"Igreja Exemplo",pastor_name:"Pastor",
   ministry_role:"Membro / ovelha",gc_name:"GC Esperança"
  },false);
  expect(upsert.mock.calls[0][0].religious_data_consent_at).toBeNull();
  expect(upsert.mock.calls[0][0].church_name).toBeNull();
  expect(upsert.mock.calls[0][0].pastor_name).toBeNull();
  expect(upsert.mock.calls[0][0].ministry_role).toBeNull();
 });
 it("recusa apagar jornada se a frase for incorreta, sem acessar o banco",async()=>{
  await expect(resetAllJourneyData("senha-ficticia","ZERAR"))
   .rejects.toThrow("ZERAR JORNADA");
  expect(rpc).not.toHaveBeenCalled();
 });
});
