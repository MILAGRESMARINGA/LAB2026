import {createRoot} from "react-dom/client";
import {useState} from "react";
import {BiblicalWorldMap} from "./components/BiblicalWorldMap";
import {JourneyRules} from "./components/JourneyRules";
import {BibleReader} from "./components/BibleReader";
import {createNextGamePlan} from "./domain/game-plan-next";
import "./style.css";
const plans={365:createNextGamePlan(365).stages,366:createNextGamePlan(366).stages};
function Preview(){
 const [length,setLength]=useState<365|366>(365),[reading,setReading]=useState(false),[chapter,setChapter]=useState(0);
 const plan=plans[length],today=plan[0];
 return <main className="journey-clean" style={{maxWidth:800,margin:"auto",padding:16,color:"#f2ecda"}}>
 {!reading?<><header className="journey-clean-hud"><h1>Minha Jornada</h1><p>{today.chapters.map(c=>`${c.book} ${c.chapter}`).join(' · ')}</p><div><span>{today.chapters.length} capítulos hoje</span><span>Exemplo: 24:00:00</span><span>♥ 3 vidas</span></div></header>
 <BiblicalWorldMap key={length} stage={1} completedStages={0} chapters={[]} plan={plan} onRead={()=>{setChapter(0);setReading(true)}}/>
 <details className="journey-clean-help"><summary>Como jogar</summary><JourneyRules mode="demo"/><label>Plano <select aria-label="Plano de demonstração" value={length} onChange={e=>setLength(Number(e.target.value) as 365|366)}><option value="365">365 etapas</option><option value="366">366 etapas · bissexto</option></select></label><p>Demonstração: leitura livre, sem registrar progresso, XP ou consumo de vidas.</p><a href="/">Entrar no aplicativo</a></details>
 </>:<><button className="secondary-cta" onClick={()=>setReading(false)}>← Voltar ao mapa</button><h1>Leitura de hoje</h1><nav aria-label="Capítulos de hoje" className="v2-chapters">{today.chapters.map((c,i)=><button key={c.id} onClick={()=>setChapter(i)} aria-pressed={chapter===i}>{c.book} {c.chapter}</button>)}</nav><BibleReader chapterId={today.chapters[chapter].id}/><p className="muted">Prévia de leitura. Nenhum XP é registrado aqui.</p></>}
 </main>;
}
createRoot(document.getElementById("root")!).render(<Preview/>);
