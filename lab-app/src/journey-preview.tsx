import {createRoot} from "react-dom/client";
import {useState} from "react";
import {BiblicalWorldMap} from "./components/BiblicalWorldMap";
import {FormationLibrary} from "./components/FormationLibrary";
import {createNextGamePlan} from "./domain/game-plan-next";
import "./style.css";
const plan=createNextGamePlan(365).stages;
function Preview(){
 const [tab,setTab]=useState("journey"),[stage,setStage]=useState(1);
 return <main style={{maxWidth:1100,margin:"auto",padding:20,color:"#f2ecda"}}>
  <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}><div><span className="eyebrow">LABGAME · EXPERIÊNCIA DA JORNADA</span><h1>A Palavra pelo caminho.</h1><p>Conheça o mapa e explore os estudos.</p></div><a className="secondary-cta" href="/">Abrir aplicativo</a></header>
  <nav aria-label="Prévia da experiência" style={{display:"flex",gap:12,margin:"20px 0"}}><button className="secondary-cta" aria-pressed={tab==="journey"} onClick={()=>setTab("journey")}>Jornada</button><button className="secondary-cta" aria-pressed={tab==="studies"} onClick={()=>setTab("studies")}>Estudos</button></nav>
  {tab==="journey"?<><label>Visitar um contexto <select value={stage} onChange={e=>setStage(Number(e.target.value))} style={{padding:12,marginLeft:12}}>{[{id:"1:1",name:"Início da Jornada"},{id:"1:40",name:"José no Egito"},{id:"2:20",name:"Êxodo · Sinai"},{id:"49:1",name:"Carta aos Efésios"}].map(item=>{const day=plan.findIndex(s=>s.chapters.some(c=>c.id===item.id))+1;return <option key={item.id} value={day}>{item.name}</option>})}</select></label><BiblicalWorldMap key={stage} stage={stage} completedStages={0} chapters={[]} plan={plan}/></>:<FormationLibrary/>}
  <section id="journey-current-reading" className="atlas-context"><h2>Sua próxima leitura</h2><p>{plan[stage-1].chapters.map(c=>`${c.book} ${c.chapter}`).join(" · ")}</p><a className="secondary-cta" href="/">Entrar e continuar minha Jornada</a></section><p className="muted">Demonstração pública. Explore livremente; esta página não registra leitura, progresso ou XP.</p>
 </main>;
}
createRoot(document.getElementById("root")!).render(<Preview/>);
