import {Flame} from "lucide-react";
import {flamePresentation,type FlameStatus} from "../domain/flame-presentation";

export function ConsistencyFlame({completedDays,status="active"}:{completedDays:number;status?:FlameStatus}){
 const view=flamePresentation(completedDays,status);
 const dayLabel=view.completedDays===1?"dia confirmado":"dias confirmados";
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
