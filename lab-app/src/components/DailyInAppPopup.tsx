import {useEffect,useState} from "react";
import {Bell,BookOpen,X} from "lucide-react";
import {loadNoticePreferencesOnly} from "../features/profile-settings";

type Props={
 userId:string|null;
 day:number|null;
 today:string|null;
 readingComplete:boolean;
 visibleOnJourney:boolean;
 onRead:()=>void;
};
/** In-app opt-in popup; no push permission, no background notifications, no e-mail.
 * One display per user/day/browser-session to avoid nagging.
 */
export function DailyInAppPopup({userId,day,today,readingComplete,visibleOnJourney,onRead}:Props){
 const [open,setOpen]=useState(false);
 const key=userId&&today? "labgame-notice:"+userId+":"+today:null;
 useEffect(()=>{
  let active=true;
  if(!userId||!today||!day||readingComplete||!visibleOnJourney||!key){
   setOpen(false);return;
  }
  try{if(sessionStorage.getItem(key)==="dismissed"){setOpen(false);return}}catch{/* ephemeral private mode */}
  void loadNoticePreferencesOnly().then(settings=>{
   if(!active)return;
   setOpen(settings.enabled&&settings.reading_popup);
  }).catch(()=>{if(active)setOpen(false)});
  return()=>{active=false};
 },[userId,today,day,readingComplete,visibleOnJourney,key]);
 const dismiss=()=>{
  setOpen(false);
  if(key){try{sessionStorage.setItem(key,"dismissed")}catch{/* ignore private mode */}}
 };
 if(!open)return null;
 return <aside className="lab-inapp-popup" aria-label="Lembrete de leitura opcional" role="status">
  <Bell size={23} aria-hidden="true"/>
  <div><strong>Um dia de cada vez</strong><p>Seu desafio de leitura está disponível. Você pode continuar quando quiser.</p>
   <button type="button" onClick={()=>{dismiss();onRead()}}><BookOpen size={16}/> ABRIR LEITURA</button>
  </div>
  <button type="button" className="lab-inapp-popup-close" aria-label="Dispensar lembrete de hoje" onClick={dismiss}><X size={18}/></button>
 </aside>;
}
