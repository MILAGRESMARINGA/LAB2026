import {supabase} from "../lib/supabase";
import {signIn,signOut} from "./auth";

export type NoticePreferences={
 enabled:boolean;in_app_popup:boolean;email:boolean;
 reading_reminders:boolean;gc_activity:boolean;milestones:boolean;
 reading_popup:boolean;reading_email:boolean;
 stage_popup:boolean;stage_email:boolean;
 gc_popup:boolean;gc_email:boolean;
 achievement_popup:boolean;achievement_email:boolean;
 study_popup:boolean;study_email:boolean;
};
export const DEFAULT_NOTICES:NoticePreferences={
 enabled:false,in_app_popup:false,email:false,
 reading_reminders:false,gc_activity:false,milestones:false,
 reading_popup:false,reading_email:false,
 stage_popup:false,stage_email:false,
 gc_popup:false,gc_email:false,
 achievement_popup:false,achievement_email:false,
 study_popup:false,study_email:false
};
export type MemberProfile={
 full_name:string;phone:string;date_of_birth:string;marital_status:string;
 profession:string;postal_code:string;state_code:string;city:string;district:string;
 street_address:string;address_number:string;address_extra:string;
 church_name:string;pastor_name:string;ministry_role:string;gc_name:string;
 religious_data_consent_at:string|null;
};
export const EMPTY_MEMBER_PROFILE:MemberProfile={
 full_name:"",phone:"",date_of_birth:"",marital_status:"",profession:"",
 postal_code:"",state_code:"",city:"",district:"",street_address:"",
 address_number:"",address_extra:"",church_name:"",pastor_name:"",
 ministry_role:"",gc_name:"",religious_data_consent_at:null
};
export const PERSONAL_FIELDS=[
 "full_name","phone","date_of_birth","marital_status","profession",
 "postal_code","state_code","city","district","street_address",
 "address_number","address_extra"
] as const;
export const RELIGIOUS_FIELDS=["church_name","pastor_name","ministry_role","gc_name"] as const;
/** Mirror the confirmed server-side consent withdrawal in the visible form. */
export function clearReligiousDetails(profile:MemberProfile):MemberProfile{
 return {...profile,church_name:"",pastor_name:"",ministry_role:"",gc_name:"",religious_data_consent_at:null};
}

const clean=(x:string,max=160)=>x.trim().slice(0,max);
const getAuthenticatedUser=async()=>{
 if(!supabase)throw Error("A conexão com a conta está indisponível.");
 const {data,error}=await supabase.auth.getUser();
 if(error||!data.user)throw Error("Entre na sua conta antes de alterar as configurações.");
 return data.user;
};
function failOnError(error:{message:string;code?:string}|null){
 if(error)throw Error(error.code==="42P01"||error.code==="PGRST205"?
   "Estas configurações ainda estão em homologação no servidor. Seus dados não foram alterados.":
   error.message);
}
export async function loadMemberSettings():Promise<{profile:MemberProfile;notifications:NoticePreferences}>{
 const user=await getAuthenticatedUser();
 const [p,n]=await Promise.all([
  supabase!.from("lab_member_profiles").select("*").eq("user_id",user.id).maybeSingle(),
  supabase!.from("lab_notification_preferences").select("*").eq("user_id",user.id).maybeSingle()
 ]);
 failOnError(p.error);failOnError(n.error);
 return {
  profile:{...EMPTY_MEMBER_PROFILE,...Object.fromEntries(
   [...PERSONAL_FIELDS,...RELIGIOUS_FIELDS].map(k=>[k,p.data?.[k]??""])
  ),religious_data_consent_at:p.data?.religious_data_consent_at??null},
  notifications:{...DEFAULT_NOTICES,...Object.fromEntries(
   (Object.keys(DEFAULT_NOTICES) as (keyof NoticePreferences)[]).map(k=>[k,Boolean(n.data?.[k])])
  )}
 };
}
/** Read only notice preferences; used on the Journey without loading sensitive profile fields. */
export async function loadNoticePreferencesOnly():Promise<NoticePreferences>{
 const u=await getAuthenticatedUser();
 const {data,error}=await supabase!.from("lab_notification_preferences")
  .select("enabled,in_app_popup,email,reading_reminders,gc_activity,milestones,reading_popup,reading_email,stage_popup,stage_email,gc_popup,gc_email,achievement_popup,achievement_email,study_popup,study_email")
  .eq("user_id",u.id).maybeSingle();
 failOnError(error);
 return {...DEFAULT_NOTICES,...Object.fromEntries(
  (Object.keys(DEFAULT_NOTICES) as (keyof NoticePreferences)[])
    .map(k=>[k,Boolean(data?.[k])])
 )};
}
export async function saveMemberProfile(input:MemberProfile,agreedReligiousData:boolean):Promise<void>{
 const u=await getAuthenticatedUser();
 const religion=RELIGIOUS_FIELDS.some(k=>Boolean(input[k].trim()));
 // Withdrawing consent ALWAYS clears stored religious fields, even when
 // stale text is still visible in the form at save time.
 const body:Record<string,string|null>={
  user_id:u.id,full_name:clean(input.full_name,120)||null,
  phone:clean(input.phone,30)||null,date_of_birth:input.date_of_birth||null,
  marital_status:input.marital_status||null,profession:clean(input.profession,100)||null,
  postal_code:clean(input.postal_code,12)||null,
  state_code:clean(input.state_code,2).toUpperCase()||null,
  city:clean(input.city,100)||null,district:clean(input.district,100)||null,
  street_address:clean(input.street_address,160)||null,
  address_number:clean(input.address_number,20)||null,
  address_extra:clean(input.address_extra,100)||null
 };
 for(const f of RELIGIOUS_FIELDS)body[f]=agreedReligiousData?clean(input[f],130)||null:null;
 body.religious_data_consent_at=agreedReligiousData&&religion?
  (input.religious_data_consent_at??new Date().toISOString()):null;
 const {error}=await supabase!.from("lab_member_profiles").upsert(body,{onConflict:"user_id"});
 failOnError(error);
}
export async function saveNoticePreferences(input:NoticePreferences):Promise<void>{
 const u=await getAuthenticatedUser();
 const active=input.enabled;
 const matrix={
  reading_popup:active&&input.reading_popup,
  reading_email:active&&input.reading_email,
  stage_popup:active&&input.stage_popup,
  stage_email:active&&input.stage_email,
  gc_popup:active&&input.gc_popup,
  gc_email:active&&input.gc_email,
  achievement_popup:active&&input.achievement_popup,
  achievement_email:active&&input.achievement_email,
  study_popup:active&&input.study_popup,
  study_email:active&&input.study_email
 };
 const anyPopup=Object.entries(matrix).some(([k,v])=>k.endsWith("_popup")&&v);
 const anyEmail=Object.entries(matrix).some(([k,v])=>k.endsWith("_email")&&v);
 const {error}=await supabase!.from("lab_notification_preferences").upsert({
  user_id:u.id,enabled:active,...matrix,
  // Legacy compatibility columns are derived ONLY from explicit matrix opt-ins.
  in_app_popup:anyPopup,email:anyEmail,
  reading_reminders:matrix.reading_popup||matrix.reading_email,
  gc_activity:matrix.gc_popup||matrix.gc_email,
  milestones:matrix.achievement_popup||matrix.achievement_email
 },{onConflict:"user_id"});
 failOnError(error);
}
/** Password confirmation required even if a UI dialog was bypassed. */
export async function reauthenticate(password:string):Promise<{email:string}>{
 if(!password)throw Error("Informe sua senha atual para confirmar.");
 const user=await getAuthenticatedUser();
 if(!user.email)throw Error("Esta conta não tem e-mail associado.");
 await signIn(user.email,password);
 return {email:user.email};
}
/** Does not preserve XP, annual medals or previous completed days. */
export async function resetAllJourneyData(password:string,confirmation:string):Promise<void>{
 if(confirmation!=="ZERAR JORNADA")throw Error("Digite ZERAR JORNADA para confirmar.");
 await reauthenticate(password);
 const {error}=await supabase!.rpc("lab_game_full_reset",{p_confirmation:confirmation});
 failOnError(error);
}
/** Only calls a server-side Edge Function with an authenticated JWT.
 * Never use service_role in the client or delete auth.users from browser SQL.
 */
export async function deleteMyAccount(password:string,confirmation:string,emailTyped:string):Promise<void>{
 if(confirmation!=="EXCLUIR CONTA")throw Error("Digite EXCLUIR CONTA para confirmar.");
 const u=await reauthenticate(password);
 if(emailTyped.trim().toLowerCase()!==u.email.toLowerCase())
  throw Error("Confirme o e-mail exato da sua conta.");
 const {data,error}=await supabase!.functions.invoke("account-delete",{
  method:"POST",body:{confirmation,email_confirmation:emailTyped.trim().toLowerCase(),password}
 });
 if(error)throw Error("Exclusão não concluída. Verifique a disponibilidade e as políticas de exclusão do servidor.");
 if(!data||data.deleted!==true)throw Error(data?.message||"Exclusão não concluída.");
 await signOut().catch(()=>undefined);
}
