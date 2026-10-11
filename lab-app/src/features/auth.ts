import {supabase} from "../lib/supabase";
export type RegistrationResult={emailConfirmationRequired:boolean};
export type RegistrationMode="individual"|"grupo";
const normalizedEmail=(value:string)=>value.trim().toLowerCase();
const validEmail=(value:string)=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
export function validateRegistration(name:string,email:string,password:string,confirmation:string):string|null{
 const clean=name.trim();
 if(clean.length<2||clean.length>60)return "Informe seu nome com 2 a 60 caracteres.";
 if(!validEmail(normalizedEmail(email)))return "Informe um e-mail válido.";
 if(password.length<8)return "A senha precisa ter pelo menos 8 caracteres.";
 if(!/[A-Za-zÀ-ÿ]/.test(password)||!/[0-9]/.test(password))return "Use pelo menos uma letra e um número na senha.";
 if(password!==confirmation)return "A confirmação da senha não corresponde.";
 return null;
}
export function authErrorMessage(error:unknown):string{
 const raw=error instanceof Error?error.message:String(error);
 if(/Invalid login credentials/i.test(raw))return "E-mail ou senha incorretos. Confira seus dados ou recupere sua senha.";
 if(/Email not confirmed/i.test(raw))return "Confirme seu e-mail antes de entrar. Verifique também a pasta de spam.";
 if(/already registered|already exists/i.test(raw))return "Este e-mail já possui cadastro. Entre na conta ou recupere sua senha.";
 if(/rate limit|too many requests|over_email_send_rate_limit/i.test(raw))return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
 if(/signup.*disabled|signups not allowed/i.test(raw))return "O cadastro está desabilitado nas configurações de autenticação do LABGAME.";
 if(/network|fetch|failed to fetch/i.test(raw))return "Não foi possível conectar ao servidor. Confira sua internet e tente novamente.";
 return raw||"Não foi possível autenticar. Tente novamente.";
}
export async function signIn(email:string,password:string){
 if(!supabase)throw Error("Supabase não configurado");
 if(!validEmail(normalizedEmail(email))||!password)throw Error("Informe seu e-mail e sua senha.");
 const {data,error}=await supabase.auth.signInWithPassword({email:normalizedEmail(email),password});
 if(error)throw error;
 if(!data.session)throw Error("Não foi possível iniciar uma sessão. Tente novamente.");
}
export async function signUp(email:string,password:string,displayName:string,mode:RegistrationMode="individual"):Promise<RegistrationResult>{
 if(!supabase)throw Error("Supabase não configurado");
 const clean=displayName.trim();
 if(clean.length<2||clean.length>60)throw Error("Informe um nome com 2 a 60 caracteres.");
 const validated=validateRegistration(clean,email,password,password);
 if(validated)throw Error(validated);
 const {data,error}=await supabase.auth.signUp({
  email:normalizedEmail(email),
  password,
  options:{
   emailRedirectTo:window.location.origin,
   data:{display_name:clean,preferred_mode:mode}
  }
 });
 if(error)throw error;
 if(!data.user)throw Error("O cadastro não foi concluído. Tente novamente.");
 return {emailConfirmationRequired:!data.session};
}
export async function resendSignUpConfirmation(email:string):Promise<void>{
 if(!supabase)throw Error("Supabase não configurado");
 const normalized=normalizedEmail(email);
 if(!validEmail(normalized))throw Error("Informe um e-mail válido.");
 const {error}=await supabase.auth.resend({type:"signup",email:normalized,options:{emailRedirectTo:window.location.origin}});
 if(error)throw error;
}
export async function signOut(){
 if(!supabase)throw Error("Supabase não configurado");
 const {error}=await supabase.auth.signOut();
 if(error)throw error;
}
export async function requestPasswordReset(email:string):Promise<void>{
 if(!supabase)throw Error("Supabase não configurado");
 const normalized=normalizedEmail(email);
 if(!validEmail(normalized))throw Error("Informe um endereço de e-mail válido");
 const {error}=await supabase.auth.resetPasswordForEmail(normalized,{redirectTo:window.location.origin});
 if(error)throw error;
}
export async function updateAccountPassword(password:string):Promise<void>{
 if(!supabase)throw Error("Supabase não configurado");
 if(password.length<8)throw Error("A nova senha deve ter pelo menos 8 caracteres");
 const {error}=await supabase.auth.updateUser({password});
 if(error)throw error;
}
