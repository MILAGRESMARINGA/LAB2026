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
  expect(html).toContain("Próxima etapa disponível");
  expect(html).toContain("Pop-up");
  expect(html).toContain("E-mail");
  expect(html).toContain("E-mails automáticos ainda não estão disponíveis");
  expect(html).toContain("Zerar toda a minha jornada");
  expect(html).toContain("Excluir minha conta definitivamente");
  expect(html).toContain("Documentos (CPF/RG)");
 });
 it("notificações desligadas anulam todos os canais e categorias no banco",async()=>{
  await saveNoticePreferences({
   ...DEFAULT_NOTICES,enabled:false,in_app_popup:true,email:true,
   reading_reminders:true,gc_activity:true,milestones:true
  });
  expect(upsert).toHaveBeenCalledWith({
   user_id:"member-one",enabled:false,in_app_popup:false,email:false,
   reading_reminders:false,gc_activity:false,milestones:false,
   reading_popup:false,reading_email:false,stage_popup:false,stage_email:false,
   gc_popup:false,gc_email:false,achievement_popup:false,achievement_email:false,
   study_popup:false,study_email:false
  },{onConflict:"user_id"});
 });
 it("mantém opções de canal independentes sem habilitar outras categorias",async()=>{
  await saveNoticePreferences({...DEFAULT_NOTICES,enabled:true,
   reading_popup:true,gc_email:true,study_email:true});
  const saved=upsert.mock.calls[0][0];
  expect(saved.reading_popup).toBe(true);
  expect(saved.reading_email).toBe(false);
  expect(saved.gc_email).toBe(true);
  expect(saved.gc_popup).toBe(false);
  expect(saved.study_email).toBe(true);
  expect(saved.achievement_email).toBe(false);
  expect(saved.enabled).toBe(true);
  expect(saved.in_app_popup).toBe(true);
  expect(saved.email).toBe(true);
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
