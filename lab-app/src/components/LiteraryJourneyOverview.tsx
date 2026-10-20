import {useMemo,useState} from "react";
import type {GameDay} from "../domain/game-plan";
import {literaryOverview} from "../domain/literary-blocks";

type Props={plan:ReadonlyArray<GameDay>;activeDay:number;completedDays:number;checked:readonly string[]};
export function LiteraryJourneyOverview({plan,activeDay,completedDays,checked}:Props){
 const [showWorld,setShowWorld]=useState(false);
 const [exploredDay,setExploredDay]=useState(1);
 const blocks=useMemo(()=>showWorld?literaryOverview(plan,completedDays,checked):[],[showWorld,plan,completedDays,checked]);
 const inspected=plan[Math.min(exploredDay,plan.length)-1];
 return <>
  <p className="lab-quest-footnote">Como em O Peregrino, de John Bunyan, cada passo convida à perseverança rumo à Cidade Celestial. Aqui, as conquistas representam apenas a caminhada no aplicativo.</p>
  {completedDays>=7&&<p role="status"><strong>Vestes do Peregrino · {completedDays>=plan.length?"Jornada concluída":completedDays>=30?"Caminhada perseverante":"Primeiros passos"}</strong><br/>Insígnia simbólica por leitura confirmada. Não concede XP adicional nem representa condição espiritual.</p>}
  <button type="button" className="secondary-cta" aria-expanded={showWorld} aria-controls="lab-journey-world" onClick={()=>{setShowWorld(value=>!value);setExploredDay(Math.max(1,Math.min(activeDay,plan.length)))}}>{showWorld?"VOLTAR À ETAPA ATUAL":`VER MAPA COMPLETO · ${plan.length} ETAPAS`}</button>
  {showWorld&&<section id="lab-journey-world" aria-label="Visão completa da jornada bíblica" style={{marginBlock:"1rem"}}>
   <h3>Do primeiro passo ao Galardão</h3>
   <p>O plano entrelaça Antigo Testamento, Salmos e Novo Testamento. Os blocos abaixo representam os livros, sem mudar a ordem das leituras.</p>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,220px),1fr))",gap:".75rem"}}>
    {blocks.map(block=><div key={block.id} style={{border:"1px solid currentColor",borderRadius:12,padding:".75rem"}}>
     <strong><span aria-hidden="true" style={{display:"inline-block",borderBottom:`5px solid ${block.color}`,marginRight:".5rem"}}>{block.symbol}</span>{block.name}</strong>
     <p>{block.testament} · {block.completed}/{block.total} capítulos confirmados</p>
    </div>)}
   </div>
   <div aria-hidden="true" style={{display:"grid",gridTemplateColumns:"repeat(25,minmax(0,1fr))",gap:3,marginBlock:"1rem"}}>{plan.map(day=><span key={day.day} style={{aspectRatio:"1",border:day.day===activeDay?"2px solid currentColor":"1px solid currentColor",borderRadius:2,background:day.day<=completedDays?"currentColor":"transparent",opacity:day.day<=completedDays?1:.45}}/>)}</div>
   <label htmlFor="lab-journey-stage">Explorar etapa {exploredDay} de {plan.length}</label>
   <input id="lab-journey-stage" type="range" min={1} max={plan.length} value={Math.min(exploredDay,plan.length)} onChange={event=>setExploredDay(Number(event.target.value))} style={{display:"block",width:"100%",minHeight:44}}/>
   <p aria-live="polite"><strong>Etapa {exploredDay} · {exploredDay<=completedDays?"concluída":exploredDay===activeDay?"atual":"futura"}</strong><br/>{inspected?.chapters.map(ch=>ch.book+" "+ch.chapter).join(" · ")}</p>
   <p>Explorar o mapa não libera etapas. As recompensas futuras permanecem uma descoberta. Vídeos e estudos são bônus opcionais: declinar não retira XP nem impede a leitura.</p>
  </section>}
 </>;
}
