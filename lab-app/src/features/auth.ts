import {supabase} from "../lib/supabase";
export async function signIn(email:string,password:string){
 if(!supabase)throw Error("Supabase não configurado");
 const {error}=await supabase.auth.signInWithPassword({email,password});
 if(error)throw error;
}
export async function signUp(email:string,password:string){
 if(!supabase)throw Error("Supabase não configurado");
 const {error}=await supabase.auth.signUp({email,password});
 if(error)throw error;
}
export async function signOut(){if(!supabase)throw Error("Supabase não configurado");const {error}=await supabase.auth.signOut();if(error)throw error}

/** Recovery links need the app's origin in Supabase Auth redirect allowlist. */
export async function requestPasswordReset(email:string):Promise<void>{
 if(!supabase)throw Error("Supabase não configurado");
 const trimmed=email.trim().toLowerCase();
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed))throw Error("Informe um endereço de e-mail válido");
 const {error}=await supabase.auth.resetPasswordForEmail(trimmed,{redirectTo:window.location.origin});
 if(error)throw error;
}
export async function updateAccountPassword(password:string):Promise<void>{
 if(!supabase)throw Error("Supabase não configurado");
 if(password.length<8)throw Error("A nova senha deve ter pelo menos 8 caracteres");
 const {error}=await supabase.auth.updateUser({password});
 if(error)throw error;
}
