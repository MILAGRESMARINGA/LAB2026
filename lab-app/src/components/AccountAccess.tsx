import {useId,useState} from "react";
import {ArrowLeft,CheckCircle2,Eye,EyeOff,KeyRound,LogIn,Mail,UserRound,Users,UserPlus} from "lucide-react";
import {
 authErrorMessage,requestPasswordReset,resendSignUpConfirmation,
 signIn,signUp,verifyEmailCode,validateRegistration,type RegistrationMode
} from "../features/auth";
import {supabase} from "../lib/supabase";
import {recoveryAfterOtpPath} from "../lib/auth-urls";

type Mode="login"|"signup"|"reset";
type Props={
 initialMode?:Mode;
 preferredMode?:RegistrationMode;
 title?:string;
 onLogin?:()=>void;
};
export function AccountAccess({initialMode="login",preferredMode="individual",title="Sua conta LABGAME",onLogin}:Props){
 const [mode,setMode]=useState<Mode>(initialMode);
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [confirmation,setConfirmation]=useState("");
 const [showPassword,setShowPassword]=useState(false);
 const [participation,setParticipation]=useState<RegistrationMode>(preferredMode);
 const [waitingEmail,setWaitingEmail]=useState(false);
 const [otpCode,setOtpCode]=useState("");
 const [needsConfirmation,setNeedsConfirmation]=useState(false);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const prefix=useId().replace(/:/g,"");
 const changeMode=(next:Mode)=>{
  setMode(next);setError("");setMessage("");setWaitingEmail(false);setNeedsConfirmation(false);setOtpCode("");
 };
 const submit=async()=>{
  if(busy)return;
  setBusy(true);setError("");setMessage("");setNeedsConfirmation(false);
  try{
   if(mode==="signup"){
    const problem=validateRegistration(name,email,password,confirmation);
    if(problem)throw new Error(problem);
    const result=await signUp(email,password,name,participation);
    if(result.emailConfirmationRequired){
     setWaitingEmail(true);
     setMessage("Cadastro recebido! Para ativar sua conta, abra o e-mail de confirmação. Confira também Spam e Promoções.");
    }else{
     setMessage("Conta criada. Você já está conectado ao LABGAME.");
     onLogin?.();
    }
   }else if(mode==="login"){
    await signIn(email,password);
    setMessage("Acesso autorizado.");
    onLogin?.();
   }else{
    await requestPasswordReset(email);
    setWaitingEmail(true);
    setMessage("Se sua conta existir, enviaremos um link e um código de recuperação. Confira seu e-mail e a pasta de spam.");
   }
  }catch(e){setError(authErrorMessage(e));if(e instanceof Error&&/Email not confirmed/i.test(e.message))setNeedsConfirmation(true)}
  finally{setBusy(false)}
 };
 const confirmCode=async()=>{
  if(busy||!/^\d{6}$/.test(otpCode.trim()))return;
  setBusy(true);setError("");setMessage("");
  try{
   await verifyEmailCode(email,otpCode,mode==="reset"?"recovery":"email");
   setOtpCode("");
   if(mode==="reset"){
    window.location.assign(recoveryAfterOtpPath());
   }else{
    setWaitingEmail(false);
    setMessage("E-mail confirmado! Sua conta foi ativada.");
    onLogin?.();
   }
  }catch(e){setError(authErrorMessage(e))}
  finally{setBusy(false)}
 };
 const resend=async()=>{
  if(busy)return;
  setBusy(true);setError("");setMessage("");
  try{if(mode==="reset")await requestPasswordReset(email);else await resendSignUpConfirmation(email);setMessage("Novo e-mail solicitado. Aguarde alguns minutos e confira a caixa de spam.")}
  catch(e){setError(authErrorMessage(e))}
  finally{setBusy(false)}
 };
 return <div className="account-access" aria-label="Cadastro e acesso ao LABGAME">
  <div className="account-heading">
   <div className="lab-emblem small"><UserRound size={30}/></div>
   <span className="eyebrow">CONTA E PERFIL LABGAME</span>
   <h2>{title}</h2>
   <p className="muted">{waitingEmail?(mode==="reset"?"Verifique seu e-mail para recuperar a conta.":"Sua conta precisa ser confirmada antes de entrar."):mode==="signup"?"Crie uma conta para salvar sua leitura, ganhar XP e entrar em GCs.":mode==="reset"?"Recupere o acesso usando o e-mail de sua conta.":"Entre para acessar seu perfil, conquistas e grupos."}</p>
  </div>
  {!supabase&&<p className="feedback-message" role="alert">A conexão de contas está indisponível nesta publicação. Tente mais tarde.</p>}
  {waitingEmail?<div className="signup-confirmation">
   <CheckCircle2 size={45}/>
   <h3>{mode==="reset"?"Recupere sua senha":"Confirme seu e-mail"}</h3>
   <p>{mode==="reset"?"Se o endereço estiver cadastrado, enviamos instruções para":"Se o cadastro foi aceito, enviamos a confirmação para"} <strong>{email.trim().toLowerCase()}</strong>. Confira a caixa de entrada e a pasta de spam.</p>
   <p>O e-mail pode incluir um código de seis dígitos. Digite-o aqui para continuar sem sair do aplicativo.</p>
   <form className="account-code-form" onSubmit={e=>{e.preventDefault();void confirmCode()}}>
    <label htmlFor={prefix+"otp"}>Código recebido por e-mail</label>
    <input id={prefix+"otp"} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={otpCode} onChange={e=>setOtpCode(e.target.value.replace(/\D/g,"").slice(0,6))}/>
    <button className="primary-cta" type="submit" disabled={busy||otpCode.length!==6}>{mode==="reset"?"VALIDAR CÓDIGO E TROCAR SENHA":"VALIDAR CÓDIGO DE CONFIRMAÇÃO"}</button>
   </form>
   <button type="button" className="secondary-cta" disabled={busy} onClick={()=>void resend()}><Mail size={17}/> REENVIAR E-MAIL</button>
   <button type="button" className="subtle-button" onClick={()=>changeMode("login")}>VOLTAR AO LOGIN <LogIn size={17}/></button>
  </div>:<>
   {mode!=="reset"&&<div className="account-mode-tabs" role="group" aria-label="Escolher cadastro ou login">
    <button type="button" className={mode==="login"?"active":""} aria-pressed={mode==="login"} onClick={()=>changeMode("login")}><LogIn size={16}/> ENTRAR</button>
    <button type="button" className={mode==="signup"?"active":""} aria-pressed={mode==="signup"} onClick={()=>changeMode("signup")}><UserPlus size={16}/> CRIAR CONTA</button>
   </div>}
   <form className="auth-card" onSubmit={e=>{e.preventDefault();void submit()}}>
    {mode==="signup"&&<>
     <label htmlFor={prefix+"name"}>Nome que aparecerá no perfil</label>
     <input id={prefix+"name"} type="text" autoComplete="name" value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={60} required placeholder="Seu nome"/>
    </>}
    <label htmlFor={prefix+"email"}>E-mail</label>
    <input id={prefix+"email"} type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="voce@exemplo.com"/>
    {mode!=="reset"&&<>
     <label htmlFor={prefix+"password"}>Senha</label>
     <div className="account-password-field">
      <input id={prefix+"password"} type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signup"?"new-password":"current-password"} minLength={mode==="signup"?8:6} required placeholder={mode==="signup"?"Mín. 8 caracteres, letras e números":"Sua senha"}/>
      <button type="button" aria-label={showPassword?"Ocultar senha":"Mostrar senha"} onClick={()=>setShowPassword(x=>!x)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button>
     </div>
    </>}
    {mode==="signup"&&<>
     <label htmlFor={prefix+"confirmation"}>Confirme a senha</label>
     <input id={prefix+"confirmation"} type={showPassword?"text":"password"} autoComplete="new-password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} required minLength={8} placeholder="Digite a mesma senha"/>
     <label htmlFor={prefix+"participation"}>Quero começar</label>
     <select id={prefix+"participation"} value={participation} onChange={e=>setParticipation(e.target.value as RegistrationMode)}>
      <option value="individual">Leitura individual</option>
      <option value="grupo">Com um grupo de crescimento (GC)</option>
     </select>
     <p className="small-caption"><Users size={14}/> Depois de confirmar a conta, você poderá criar um GC ou entrar usando o convite do líder.</p>
    </>}
    <button type="submit" className="primary-cta" disabled={busy||!supabase}>
     {busy?"AGUARDE...":mode==="signup"?"CRIAR MINHA CONTA":mode==="reset"?"ENVIAR RECUPERAÇÃO":"ENTRAR NO LABGAME"}
     {mode==="reset"?<Mail size={18}/>:mode==="signup"?<UserPlus size={18}/>:<LogIn size={18}/>}
    </button>
   </form>
   {mode==="login"&&<button type="button" className="subtle-button" onClick={()=>changeMode("reset")}><KeyRound size={16}/> Esqueci minha senha</button>}
   {mode==="reset"&&<button type="button" className="subtle-button" onClick={()=>changeMode("login")}><ArrowLeft size={16}/> Voltar ao login</button>}
  </>}
  {error&&<p role="alert" className="feedback-message">{error}</p>}
  {needsConfirmation&&mode==="login"&&<button type="button" className="secondary-cta" disabled={busy} onClick={()=>void resend()}><Mail size={17}/> REENVIAR CONFIRMAÇÃO</button>}
  {message&&<p role="status" className="account-success-message">{message}</p>}
 </div>;
}
