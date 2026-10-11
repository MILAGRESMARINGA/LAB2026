import {supabase} from "../lib/supabase";
export type ReadingGroup={id:string;name:string;owner_id:string;created_at:string;competition_opt_in:boolean};
export async function listReadingGroups():Promise<ReadingGroup[]>{
 if(!supabase)throw Error("Supabase não configurado");
 const {data,error}=await supabase.from("reading_groups").select("id,name,owner_id,created_at,competition_opt_in").order("created_at",{ascending:false});
 if(error)throw error;
 return data??[];
}
export async function createReadingGroup(name:string):Promise<void>{
 if(!supabase)throw Error("Supabase não configurado");
 const clean=name.trim();
 if(clean.length<2||clean.length>100)throw Error("O nome deve ter entre 2 e 100 caracteres");
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user)throw Error("Entre na sua conta para criar um grupo");
 const {error}=await supabase.from("reading_groups").insert({name:clean,owner_id:user.id});
 if(error)throw error;
}
export async function joinReadingGroup(token:string):Promise<void>{
 if(!supabase)throw Error("Supabase não configurado");
 const trimmed=token.trim();
 if(!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed))throw Error("Código de convite inválido");
 const {error}=await supabase.rpc("join_reading_group",{p_invite_token:trimmed});
 if(error)throw error;
}
export async function getGroupInvite(groupId:string):Promise<string>{
 if(!supabase)throw Error("Supabase não configurado");
 const {data,error}=await supabase.from("reading_group_invites").select("invite_token").eq("group_id",groupId).single();
 if(error)throw error;
 return data.invite_token;
}
