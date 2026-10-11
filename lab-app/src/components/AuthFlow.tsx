import {useEffect,useState} from "react";
import {ArrowLeft,CheckCircle2,Eye,EyeOff,KeyRound,Mail,ShieldCheck} from "lucide-react";
import {supabase} from "../lib/supabase";
import {
 PUBLIC_APP_ORIGIN,authRedirectError,authRouteFromPath,
 type AuthRoute
} from "../lib/auth-urls";
import {authErrorMessage,updateAccountPassword} from "../features/auth";

type AuthResult="checking"|"confirmed"|"recovery"|"error";
type VerifyType="email"|"recovery";
const recoveryRequestUrl=PUBLIC_APP_ORIGIN+"/?auth=reset";
const loginUrl=PUBLIC_APP_ORIGIN+"/?auth=login";
const successUrl=PUBLIC_APP_ORIGIN+"/?auth=confirmed";

/**
 * Works with Supabase's default /verify -> redirect with URL-fragment tokens,
 * PKCE ?code=..., and custom templates using ?token_hash=...&type=....
 * No email link or raw access token is ever printed into the UI or logs.
 */
export function AuthFlow({route}:{route:Exclude<AuthRoute,"none">}){
 const [status,setStatus]=useState<AuthResult>("checking");
 const [error,setError]=useState("");
 const [password,setPassword]=useState("");
 const [confirmation,setConfirmation]=useState("");
 const [reveal,setReveal]=useState(false);
 const [working,setWorking]=useState(false);
 const [updated,setUpdated]=useState(false);
 const [userEmail,setUserEmail]=useState("");

 useEffect(()=>{
  let active=true;
  async function resolve(){
   if(!supabase){
    if(active){setStatus("error");setError("Conexão de autenticação indisponível.")}
    return;
   }
   const redirectError=authRedirectError(window.location.search,window.location.hash);
   if(redirectError){
    if(active){setError(redirectError);setStatus("error")}
    return;
   }
   try{
    const query=new URLSearchParams(window.location.search);
    const tokenHash=query.get("token_hash");
    if(tokenHash){
     const rawType=query.get("type");
     const expected:VerifyType=route==="reset"?"recovery":"email";
     if(rawType!==expected&&!(route==="callback"&&rawType==="signup"))
      throw new Error("O link não corresponde a esta operação. Solicite um novo link.");
     const {error:verifyError}=await supabase.auth.verifyOtp({
      token_hash:tokenHash,
      type:expected
     });
     if(verifyError)throw verifyError;
    }
    // supabase-js initialize() consumes implicit #access_token= or PKCE ?code=
    // before getSession() resolves, and caches the authenticated session.
    const {data,error:sessionError}=await supabase.auth.getSession();
    if(sessionError)throw sessionError;
    if(!data.session?.user)throw new Error("Seu link expirou ou não criou uma sessão válida.");
    const {data:userData,error:userError}=await supabase.auth.getUser();
    if(userError||!userData.user)throw userError||new Error("Sessão inválida.");
    if(!active)return;
    setUserEmail(userData.user.email||"");
    setStatus(route==="reset"?"recovery":"confirmed");
    // Strip one-time tokens only after Supabase consumes them.
    window.history.replaceState(null,"",window.location.pathname);
   }catch(e){
    if(!active)return;
    setError(authErrorMessage(e));
    setStatus("error");
    // Never leave a token_hash or access_token in the visible address bar.
    window.history.replaceState(null,"",window.location.pathname);
   }
  }
  void resolve();
  return()=>{active=false};
 },[route]);

 const savePassword=async()=>{
  if(working||updated)return;
  setError("");
  if(password.length<8||!/[A-Za-zÀ-ÿ]/.test(password)||!/[0-9]/.test(password)){
   setError("A senha deve ter pelo menos 8 caracteres, incluindo letras e números.");
   return;
  }
  if(password!==confirmation){setError("As duas senhas precisam ser iguais.");return}
  setWorking(true);
  try{
   await updateAccountPassword(password);
   setPassword("");setConfirmation("");setUpdated(true);
  }catch(e){setError(authErrorMessage(e))}
  finally{setWorking(false)}
 };

 return <main className="auth-flow-page" aria-label={route==="reset"?"Redefinição de senha":"Confirmação de e-mail"}>
  <section className="auth-flow-card">
   <div className="auth-flow-icon">{status==="confirmed"||updated?<CheckCircle2 size={34}/>:route==="reset"?<KeyRound size={34}/>:<Mail size={34}/>}</div>
   <span className="eyebrow">LABGAME · ACESSO SEGURO</span>
   {status==="checking"&&<>
    <h1>Validando seu link</h1>
    <p role="status">Aguarde enquanto confirmamos seu acesso com o Supabase.</p>
   </>}
   {status==="confirmed"&&<>
    <h1>E-mail confirmado</h1>
    <p>A confirmação foi reconhecida. Sua conta já pode utilizar os recursos do LABGAME.</p>
    <a className="primary-cta auth-flow-link" href={successUrl}><ShieldCheck size={18}/> IR PARA MEU PERFIL</a>
   </>}
   {status==="recovery"&&!updated&&<>
    <h1>Defina sua nova senha</h1>
    {userEmail&&<p>Conta: <strong>{userEmail}</strong></p>}
    <p>Seu link foi validado. Escolha uma senha que não tenha sido utilizada anteriormente.</p>
    <form className="auth-flow-form" onSubmit={e=>{e.preventDefault();void savePassword()}}>
     <label htmlFor="lab-reset-new-password">Nova senha</label>
     <div className="auth-flow-password">
      <input id="lab-reset-new-password" type={reveal?"text":"password"} autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Pelo menos 8 caracteres, letras e números"/>
      <button type="button" onClick={()=>setReveal(v=>!v)} aria-label={reveal?"Ocultar senha":"Mostrar senha"}>{reveal?<EyeOff size={19}/>:<Eye size={19}/>}</button>
     </div>
     <label htmlFor="lab-reset-confirm-password">Confirme a nova senha</label>
     <input id="lab-reset-confirm-password" type={reveal?"text":"password"} autoComplete="new-password" minLength={8} required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/>
     <button className="primary-cta" type="submit" disabled={working}>{working?"ATUALIZANDO...":"SALVAR NOVA SENHA"}</button>
    </form>
   </>}
   {updated&&<>
    <h1>Senha atualizada</h1>
    <p>Sua senha foi alterada com sucesso. Continue no aplicativo usando sua conta.</p>
    <a className="primary-cta auth-flow-link" href={successUrl}>ABRIR MEU PERFIL</a>
   </>}
   {status==="error"&&<>
    <h1>Não conseguimos validar o link</h1>
    <p role="alert">{error||"O link expirou ou não foi reconhecido."}</p>
    <a className="primary-cta auth-flow-link" href={route==="reset"?recoveryRequestUrl:loginUrl}><Mail size={18}/> {route==="reset"?"SOLICITAR NOVO LINK":"ENTRAR OU REENVIAR CONFIRMAÇÃO"}</a>
   </>}
   {status==="recovery"&&error&&<p className="feedback-message" role="alert">{error}</p>}
   <a className="auth-flow-back" href={loginUrl}><ArrowLeft size={17}/> Voltar ao LABGAME</a>
  </section>
 </main>;
}
export function isAuthPage(pathname:string):boolean{
 return authRouteFromPath(pathname)!=="none";
}
