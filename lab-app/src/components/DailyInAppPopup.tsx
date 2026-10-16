import {useEffect,useState} from "react";
import {Bell,BookOpen,Clock3,Flame,X} from "lucide-react";
import {selectJourneyNotice,type JourneyNoticeKind} from "../domain/journey-notice";
import {DEFAULT_NOTICES,loadNoticePreferencesOnly,type NoticePreferences} from "../features/profile-settings";

type Props={
 userId:string|null;day:number|null;today:string|null;readingComplete:boolean;visibleOnJourney:boolean;
 normalDeadlineAt?:string|null;graceDeadlineAt?:string|null;serverAt?:string|null;onRead:()=>void;
};
const COPY:Record<JourneyNoticeKind,{title:string;message:string;button:string;icon:"bell"|"clock"|"flame"}>={
 reading:{title:"Um dia de cada vez",message:"Sua etapa de leitura está disponível. Continue quando for um bom momento para você.",button:"ABRIR LEITURA",icon:"bell"},
 closing:{title:"Sua janela diária está perto do fim",message:"O prazo normal se encerra em até duas horas. Se puder, retome a leitura pela Jornada.",button:"CONTINUAR LEITURA",icon:"clock"},
 grace:{title:"Sua chama precisa de cuidado",message:"O prazo normal passou e a janela de carência está aberta. Confira a etapa e continue sua leitura.",button:"RETOMAR LEITURA",icon:"flame"},
 late:{title:"Sua etapa está atrasada",message:"A janela e a carência passaram. Abra a Jornada para consultar as opções de recuperação e retomar seu ritmo.",button:"VER JORNADA",icon:"flame"}
};
function seen(key:string):boolean{
 try{if(window.localStorage.getItem(key))return true}catch{/* private browsing */}
 try{return window.sessionStorage.getItem(key)==="dismissed"}catch{return false}
}
function markSeen(key:string):void{
 try{window.localStorage.setItem(key,"shown")}catch{/* private browsing */}
 try{window.sessionStorage.setItem(key,"dismissed")}catch{/* private browsing */}
}
/** Free, foreground-only notices. No push, background job, or email is used. */
export function DailyInAppPopup({
 userId,day,today,readingComplete,visibleOnJourney,
 normalDeadlineAt=null,graceDeadlineAt=null,serverAt=null,onRead
}:Props){
 const [open,setOpen]=useState<JourneyNoticeKind|null>(null);
 const [preferences,setPreferences]=useState<NoticePreferences>({...DEFAULT_NOTICES});
 const [clock,setClock]=useState(()=>Date.now()),[serverOffset,setServerOffset]=useState(0);
 useEffect(()=>{
  const timer=window.setInterval(()=>setClock(Date.now()),30_000);
  return()=>window.clearInterval(timer);
 },[]);
 useEffect(()=>{
  const parsed=serverAt?Date.parse(serverAt):NaN;
  setServerOffset(Number.isFinite(parsed)?parsed-Date.now():0);
 },[serverAt]);
 useEffect(()=>{
  let active=true;
  setPreferences({...DEFAULT_NOTICES});
  if(!userId)return()=>{active=false};
  void loadNoticePreferencesOnly().then(value=>{if(active)setPreferences(value)})
   .catch(()=>{if(active)setPreferences({...DEFAULT_NOTICES})});
  return()=>{active=false};
 },[userId]);
 const now=clock+serverOffset;
 const kind=selectJourneyNotice({
  visibleOnJourney:Boolean(userId&&day&&today&&visibleOnJourney),readingComplete,now,
  normalDeadlineAt,graceDeadlineAt,
  readingPopup:preferences.enabled&&preferences.reading_popup,
  stagePopup:preferences.enabled&&preferences.stage_popup
 });
 useEffect(()=>{
  if(!userId||!day||!today||!kind||!visibleOnJourney){setOpen(null);return}
  const key="labgame-notice:"+userId+":"+today;
  if(seen(key)){setOpen(null);return}
  // Mark on display so route changes/reloads cannot repeat a daily notice.
  markSeen(key);setOpen(kind);
 },[userId,day,today,kind,visibleOnJourney]);
 if(!open)return null;
 const copy=COPY[open],Icon=copy.icon==="clock"?Clock3:copy.icon==="flame"?Flame:Bell;
 return <aside className="lab-inapp-popup" aria-label="Lembrete opcional da jornada" role="status">
  <Icon size={23} aria-hidden="true"/>
  <div><strong>{copy.title}</strong><p>{copy.message}</p>
   <button type="button" onClick={()=>{setOpen(null);onRead()}}><BookOpen size={16}/>{copy.button}</button>
  </div>
  <button type="button" className="lab-inapp-popup-close" aria-label="Dispensar aviso de hoje" onClick={()=>setOpen(null)}><X size={18}/></button>
 </aside>;
}
