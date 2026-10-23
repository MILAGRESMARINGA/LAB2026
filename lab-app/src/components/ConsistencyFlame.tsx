import "./help-center.css";
import {Flame} from "lucide-react";
import {flamePresentation,type FlameStatus,type FlameTiming} from "../domain/flame-presentation";

export function ConsistencyFlame({completedDays,status="active",timing,compact=false}:{completedDays:number;status?:FlameStatus;timing?:FlameTiming;compact?:boolean}){
 const view=flamePresentation(completedDays,status,timing);
 const dayLabel=view.completedDays===1?"dia confirmado":"dias confirmados";
 if(compact)return <aside className={"chama-companion tone-"+view.tone} aria-label={"Chama Viva: "+view.completedDays+" "+dayLabel} title={view.title}>
  <svg viewBox="0 0 80 96" role="img" aria-label="Mascote Chama Viva"><ellipse cx="40" cy="88" rx="25" ry="5" fill="#09232c" opacity=".4"/><path d="M43 3C49 24 68 24 72 47C79 78 59 88 40 88C14 88 4 70 9 51C12 39 23 33 24 20C34 25 34 36 36 39C44 28 32 15 43 3Z" fill="var(--chama-body)" stroke="#f8d474" strokeWidth="2"/><path d="M40 43C48 54 61 57 59 71C57 84 25 87 22 72C20 61 31 54 40 43Z" fill="var(--chama-inner)"/><g className="chama-eyes" fill="#284033"><ellipse cx="30" cy="61" rx="4" ry="6"/><ellipse cx="51" cy="61" rx="4" ry="6"/><circle cx="31" cy="59" r="1.4" fill="#fff"/><circle cx="52" cy="59" r="1.4" fill="#fff"/></g><path d={view.tone==='ember'?"M34 76Q40 71 47 76":"M33 73Q40 80 48 72"} fill="none" stroke="#284033" strokeWidth="3" strokeLinecap="round"/><ellipse cx="23" cy="70" rx="4" ry="2" fill="#ee8f67" opacity=".6"/><ellipse cx="58" cy="70" rx="4" ry="2" fill="#ee8f67" opacity=".6"/></svg>
  <span>Chama Viva<strong>{view.completedDays} {view.completedDays===1?'dia':'dias'}</strong></span>
 </aside>;
 return <section className={"consistency-flame tone-"+view.tone} aria-label={"Chama Viva: "+view.completedDays+" "+dayLabel}>
  <span className="consistency-flame-icon" aria-hidden="true"><Flame size={view.iconSize} strokeWidth={1.8}/></span>
  <div className="consistency-flame-copy">
   <span className="eyebrow">CHAMA VIVA · CONSTÂNCIA REGISTRADA</span>
   <strong>{view.title}</strong>
   <p>{view.description}</p>
  </div>
  <div className="consistency-flame-count" aria-label={view.completedDays+" "+dayLabel}>
   <strong>{view.completedDays}</strong><span>{view.completedDays===1?"DIA":"DIAS"}</span>
  </div>
  <small className="consistency-flame-note">Indicador visual baseado nas etapas confirmadas. Não concede XP nem representa mérito espiritual.</small>
 </section>;
}
