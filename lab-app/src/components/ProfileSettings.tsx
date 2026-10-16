import {useEffect,useId,useRef,useState} from "react";
import {AlertTriangle,Bell,BookOpen,CheckCircle2,ChevronDown,KeyRound,
 LockKeyhole,Mail,MapPin,ShieldAlert,Trash2,UserCircle,Users,X} from "lucide-react";
import {
 DEFAULT_NOTICES,EMPTY_MEMBER_PROFILE,loadMemberSettings,
 saveMemberProfile,saveNoticePreferences,resetAllJourneyData,deleteMyAccount,
 type MemberProfile,type NoticePreferences
} from "../features/profile-settings";

type DangerousAction="reset"|"delete"|null;
type Props={accountEmail:string;onReset:()=>Promise<void>;onDeleted:()=>void};
const civilOptions=[
 ["","Prefiro não informar"],["solteiro","Solteiro(a)"],["casado","Casado(a)"],
 ["uniao_estavel","União estável"],["divorciado","Divorciado(a)"],
 ["viuvo","Viúvo(a)"],["outro","Outro"]
] as const;
const ROLE_OPTIONS=[
 "Membro / ovelha","Participante de GC","Líder de GC",
 "Auxiliar","Diácono(a)","Presbítero(a)","Pastor(a)","Missionário(a)","Outro"
];

export function ProfileSettings({accountEmail,onReset,onDeleted}:Props){
 const prefix=useId().replace(/:/g,"");
 const firstFocus=useRef<HTMLInputElement>(null);
 const [ready,setReady]=useState(false),[loading,setLoading]=useState(true);
 const [profile,setProfile]=useState<MemberProfile>({...EMPTY_MEMBER_PROFILE});
 const [prefs,setPrefs]=useState<NoticePreferences>({...DEFAULT_NOTICES});
 const [consent,setConsent]=useState(false);
 const [open,setOpen]=useState<DangerousAction>(null);
 const [phrase,setPhrase]=useState(""),[confirmEmail,setConfirmEmail]=useState("");
 const [password,setPassword]=useState(""),[ack,setAck]=useState(false);
 const [saving,setSaving]=useState(false),[message,setMessage]=useState("");
 const [preview,setPreview]=useState(false);
 useEffect(()=>{
  let active=true;
  setLoading(true);
  void loadMemberSettings().then(result=>{
   if(!active)return;
   setProfile(result.profile);setPrefs(result.notifications);
   setConsent(Boolean(result.profile.religious_data_consent_at));
   setReady(true);setMessage("");
  }).catch(e=>{if(active){setReady(false);setMessage(
   e instanceof Error?e.message:"Configurações ainda indisponíveis.")}})
  .finally(()=>{if(active)setLoading(false)});
  return()=>{active=false};
 },[accountEmail]);
 useEffect(()=>{
  if(open){firstFocus.current?.focus()}
 },[open]);
 const change=(key:keyof MemberProfile,value:string)=>{
  setProfile(prev=>({...prev,[key]:value}));
 };
 const changeNotice=(key:keyof NoticePreferences,value:boolean)=>
  setPrefs(prev=>({...prev,[key]:value}));
 const persistProfile=async()=>{
  setSaving(true);setMessage("");
  try{await saveMemberProfile(profile,consent);setMessage("Dados do perfil salvos somente para sua conta.");
  }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível salvar o cadastro.");
  }finally{setSaving(false)}
 };
 const persistPrefs=async()=>{
  setSaving(true);setMessage("");
  try{await saveNoticePreferences(prefs);setMessage("Preferências de notificações salvas. O envio automático por e-mail ainda está em implantação.");
  }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível salvar as preferências.");
  }finally{setSaving(false)}
 };
 const requestAction=(action:DangerousAction)=>{
  setOpen(action);setPhrase("");setConfirmEmail("");setPassword("");setAck(false);setMessage("");
 };
 const executeAction=async()=>{
  if(!open||!ack||!password)return;
  const action=open;
  setSaving(true);setMessage("");
  try{
   if(action==="reset"){
    await resetAllJourneyData(password,phrase);
    await onReset();
    setMessage("Jornada zerada. Seu cadastro e vínculos com GCs foram preservados.");
   }else{
    await deleteMyAccount(password,phrase,confirmEmail);
    onDeleted();
    return;
   }
   requestAction(null);
  }catch(e){setMessage(e instanceof Error?e.message:"A operação não foi concluída.");
  }finally{setSaving(false)}
 };
 const accountDeletionReady=import.meta.env.VITE_ACCOUNT_DELETION_READY==="true";
 const canConfirm=ready&&(open!=="delete"||accountDeletionReady)&&ack&&password.length>0&&
  (open==="reset"?phrase==="ZERAR JORNADA":
   open==="delete"?phrase==="EXCLUIR CONTA"&&confirmEmail.trim().toLowerCase()===accountEmail.toLowerCase():false);
 const field=(key:keyof MemberProfile,label:string,opts?:{type?:string;placeholder?:string;maxLength?:number})=>
  <label className="ps-field" key={key} htmlFor={prefix+key}>
   <span>{label}</span>
   <input id={prefix+key} type={opts?.type??"text"} value={(profile[key]??"") as string}
    maxLength={opts?.maxLength??160} placeholder={opts?.placeholder??"Opcional"}
    onChange={e=>change(key,e.target.value)}/>
  </label>;
 return <section className="profile-settings" aria-label="Configurações e privacidade da conta">
  <div className="ps-heading"><UserCircle size={24}/><div><span className="eyebrow">CONFIGURAÇÕES</span><h2>Seu perfil, suas escolhas</h2><p className="muted">Tudo aqui é opcional. Compartilhe apenas as informações que desejar.</p></div></div>
  {loading&&<p role="status" className="muted">Consultando configurações protegidas...</p>}
  {!ready&&!loading&&<p role="status" className="ps-unavailable"><LockKeyhole size={17}/> As novas configurações dependem da migração de segurança em homologação. Nenhum dado será enviado enquanto ela não estiver ativa.</p>}
  <details className="ps-section" open>
   <summary><span><UserCircle size={19}/> Dados pessoais e endereço</span><ChevronDown size={18}/></summary>
   <form onSubmit={e=>{e.preventDefault();void persistProfile()}}>
    <fieldset disabled={!ready||saving} className="ps-fieldset">
     <div className="ps-field-grid">
      {field("full_name","Nome completo",{maxLength:120})}
      {field("phone","Telefone",{type:"tel",maxLength:30})}
      {field("date_of_birth","Data de nascimento",{type:"date"})}
      <label className="ps-field" htmlFor={prefix+"marital_status"}><span>Estado civil</span>
       <select id={prefix+"marital_status"} value={profile.marital_status} onChange={e=>change("marital_status",e.target.value)}>
       {civilOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      </label>
      {field("profession","Profissão",{maxLength:100})}
      {field("postal_code","CEP",{maxLength:12,placeholder:"00000-000"})}
      {field("state_code","Estado / UF",{maxLength:2,placeholder:"PR"})}
      {field("city","Cidade",{maxLength:100})}
      {field("district","Bairro",{maxLength:100})}
      {field("street_address","Rua / avenida",{maxLength:160})}
      {field("address_number","Número",{maxLength:20})}
      {field("address_extra","Complemento",{maxLength:100})}
     </div>
     <p className="ps-private-note"><ShieldAlert size={15}/> Endereço e informações pessoais não são exibidos em rankings nem nos perfis dos GCs.</p>
     <div className="ps-document-note"><LockKeyhole size={18}/><div><strong>Documentos (CPF/RG)</strong><p>Coleta indisponível nesta etapa. Documentos exigem armazenamento protegido, finalidade específica e revisão de privacidade antes de serem solicitados.</p></div></div>
     <h3>Vida comunitária e ministerial</h3>
     <p className="small-caption">Informações religiosas são dados sensíveis. O preenchimento é opcional e não altera sua pontuação ou posição nos GCs.</p>
     <div className="ps-field-grid">
      {field("church_name","Igreja / comunidade",{maxLength:130})}
      {field("pastor_name","Pastor(a) de referência",{maxLength:120})}
      {field("gc_name","Nome do Grupo de Crescimento (GC)",{maxLength:130})}
      <label className="ps-field" htmlFor={prefix+"ministry_role"}><span>Cargo ministerial / participação</span>
       <select id={prefix+"ministry_role"} value={ROLE_OPTIONS.includes(profile.ministry_role)?profile.ministry_role:(profile.ministry_role?"Outro":"")}
       onChange={e=>change("ministry_role",e.target.value)}>
        <option value="">Prefiro não informar</option>
        {ROLE_OPTIONS.map(v=><option key={v} value={v}>{v}</option>)}
       </select>
      </label>
     </div>
     <label className="ps-check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>
      <span>Autorizo salvar privadamente os dados de igreja, pastor e ministério que informei. Posso retirar o consentimento e limpar esses campos ao salvar novamente.</span>
     </label>
     <p className="small-caption">O nome do GC digitado é informativo: para participar oficialmente de um grupo, utilize o convite na aba GCs.</p>
     <button type="submit" className="secondary-cta ps-save" disabled={!ready||saving}>SALVAR DADOS DO PERFIL</button>
    </fieldset>
   </form>
  </details>
  <details className="ps-section" open>
   <summary><span><Bell size={19}/> Notificações</span><ChevronDown size={18}/></summary>
   <div className="ps-settings-body">
    <p className="muted">Você escolhe quais lembretes deseja. Padrão: nenhum aviso. Mensagens essenciais de segurança da conta não são desativadas aqui.</p>
    <fieldset disabled={!ready||saving} className="ps-fieldset">
     <label className="ps-check ps-master"><input type="checkbox" checked={prefs.enabled} onChange={e=>changeNotice("enabled",e.target.checked)}/><span><strong>Quero receber notificações</strong><small>Desmarque para não receber lembretes opcionais.</small></span></label>
     <h3>Onde receber</h3>
     <label className="ps-check"><input type="checkbox" disabled={!prefs.enabled} checked={prefs.in_app_popup} onChange={e=>changeNotice("in_app_popup",e.target.checked)}/><span>Pop-ups dentro do aplicativo quando estiver aberto</span></label>
     <label className="ps-check"><input type="checkbox" disabled={!prefs.enabled} checked={prefs.email} onChange={e=>changeNotice("email",e.target.checked)}/><span>E-mail <small>Preferência registrada; envios automáticos ainda não estão ativados.</small></span></label>
     <h3>O que receber</h3>
     <label className="ps-check"><input type="checkbox" disabled={!prefs.enabled} checked={prefs.reading_reminders} onChange={e=>changeNotice("reading_reminders",e.target.checked)}/><span>Lembrete de leitura diária</span></label>
     <label className="ps-check"><input type="checkbox" disabled={!prefs.enabled} checked={prefs.gc_activity} onChange={e=>changeNotice("gc_activity",e.target.checked)}/><span>Atividades e avisos do GC</span></label>
     <label className="ps-check"><input type="checkbox" disabled={!prefs.enabled} checked={prefs.milestones} onChange={e=>changeNotice("milestones",e.target.checked)}/><span>Conquistas, Talentos e coroas da Jornada</span></label>
     <div className="ps-actions"><button className="secondary-cta" onClick={()=>void persistPrefs()} type="button" disabled={!ready||saving}>SALVAR NOTIFICAÇÕES</button><button type="button" className="subtle-button" disabled={!prefs.enabled||!prefs.in_app_popup} onClick={()=>setPreview(x=>!x)}>TESTAR POP-UP</button></div>
    </fieldset>
    {preview&&<div role="status" className="ps-popup-preview"><Bell size={20}/><div><strong>Lembrete LABGAME</strong><p>Seu próximo capítulo está esperando. Esta é uma demonstração local, não um envio agendado.</p></div><button type="button" aria-label="Fechar notificação de exemplo" onClick={()=>setPreview(false)}><X size={18}/></button></div>}
   </div>
  </details>
  <div className="ps-security">
   <div className="ps-section-title"><ShieldAlert size={20}/><div><h2>Segurança e controle dos dados</h2><p className="muted">Duas operações diferentes. Confira atentamente as consequências antes de continuar.</p></div></div>
   <div className="ps-danger-card">
    <div><BookOpen size={22}/><strong>Zerar toda a minha jornada</strong><p>Remove XP, sequências, leituras registradas, vídeos pontuados e medalhas de ciclos. Preserva seu login, dados do perfil e vínculos com os GCs.</p></div>
    <button type="button" disabled={saving} onClick={()=>requestAction("reset")}>ZERAR JORNADA</button>
   </div>
   <div className="ps-danger-card delete">
    <div><Trash2 size={22}/><strong>Excluir minha conta definitivamente</strong><p>Exclui seus dados do LABGAME e revoga o acesso. A operação não poderá ser desfeita. GCs com outros participantes precisam ter a liderança resolvida antes.</p></div>
    <button type="button" disabled={saving} onClick={()=>requestAction("delete")}>SOLICITAR EXCLUSÃO</button>
   </div>
  </div>
  {message&&<p role="status" className="feedback-message ps-feedback">{message}</p>}
  {open&&<div className="ps-modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!saving)requestAction(null)}}>
   <div role="alertdialog" aria-modal="true" aria-labelledby={prefix+"destructive-title"} aria-describedby={prefix+"destructive-description"} className="ps-modal"
    onKeyDown={e=>{if(e.key==="Escape"&&!saving)requestAction(null)}}>
    <div className="ps-modal-top"><span><AlertTriangle size={24}/>{open==="reset"?"Recomeçar do zero?":"Excluir a conta?"}</span><button type="button" aria-label="Cancelar e fechar" disabled={saving} onClick={()=>requestAction(null)}><X size={19}/></button></div>
    <h2 id={prefix+"destructive-title"}>{open==="reset"?"Você perderá todos os pontos da Jornada":"Esta ação é definitiva"}</h2>
    <p id={prefix+"destructive-description"}>{open==="reset"?
     "O histórico de capítulos, XP, sequências, Talentos, medalhas e coroas será apagado. Você começará a etapa 1 com zero XP. Seus dados pessoais e GC permanecerão.":
     "Seu perfil e histórico serão removidos. Caso seja responsável por um GC com outros participantes, a exclusão será bloqueada até resolver a liderança. Não será possível restaurar sua conta por este formulário."}</p>
    <label className="ps-field" htmlFor={prefix+"phrase"}><span>Digite <strong>{open==="reset"?"ZERAR JORNADA":"EXCLUIR CONTA"}</strong> para confirmar</span>
     <input ref={firstFocus} id={prefix+"phrase"} value={phrase} onChange={e=>setPhrase(e.target.value)} autoComplete="off" spellCheck={false}/></label>
    {open==="delete"&&<label className="ps-field" htmlFor={prefix+"confirmEmail"}><span>Digite seu e-mail da conta</span>
      <input id={prefix+"confirmEmail"} type="email" value={confirmEmail} onChange={e=>setConfirmEmail(e.target.value)} autoComplete="off"/></label>}
    <label className="ps-field" htmlFor={prefix+"password"}><span>Senha atual (confirmação de identidade)</span>
      <input id={prefix+"password"} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>
    <label className="ps-check"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/><span>Li e compreendi que esta operação remove informações permanentemente.</span></label>
    {message&&<p role="alert" className="feedback-message">{message}</p>}
    <div className="ps-modal-actions">
     <button type="button" className="secondary-cta" disabled={saving} onClick={()=>requestAction(null)}>CANCELAR</button>
     <button type="button" className="ps-confirm-danger" disabled={!canConfirm||saving} onClick={()=>void executeAction()}>
      {saving?"PROCESSANDO...":open==="reset"?"CONFIRMAR REINÍCIO":"EXCLUIR DEFINITIVAMENTE"}
     </button>
    </div>
    {!ready&&<p className="ps-unavailable">Operação não disponível até a homologação da migração de segurança.</p>}
    {open==="delete"&&!accountDeletionReady&&<p className="ps-unavailable">A exclusão ainda está bloqueada enquanto a função de exclusão não for implantada e homologada no Supabase. Não envie senha para outro canal.</p>}
   </div>
  </div>}
 </section>;
}
