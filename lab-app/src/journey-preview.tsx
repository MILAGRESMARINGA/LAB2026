import {createRoot} from "react-dom/client";
import {useState} from "react";
import {BiblicalWorldMap} from "./components/BiblicalWorldMap";
import {MainNavigation} from "./components/MainNavigation";
import {ConsistencyFlame} from "./components/ConsistencyFlame";
import {BibleReader} from "./components/BibleReader";
import {createNextGamePlan} from "./domain/game-plan-next";
import "./style.css";
const plans={365:createNextGamePlan(365).stages,366:createNextGamePlan(366).stages};
function Preview(){
 const [length,setLength]=useState<365|366>(365),[reading,setReading]=useState(false),[chapter,setChapter]=useState(0);
 const plan=plans[length],today=plan[0];
 return <main className="journey-clean journey-demo-content" style={{maxWidth:800,margin:"auto",padding:16,color:"#f2ecda"}}>
 {!reading?<><header className="journey-clean-hud"><div className="journey-clean-title"><h1>Minha Jornada</h1><ConsistencyFlame compact completedDays={0} status="inactive"/></div><p>{today.chapters.map(c=>`${c.book} ${c.chapter}`).join(' · ')}</p><div><span>{today.chapters.length} capítulos hoje</span><span>Exemplo: 24:00:00</span><span>♥ 3 vidas</span></div></header>
 <BiblicalWorldMap key={length} stage={1} completedStages={0} chapters={[]} plan={plan} onRead={()=>{setChapter(0);setReading(true)}}/>
 <p className="muted" style={{fontSize:12}}>Demonstração · sem registro de XP ou progresso.</p>
 </>:<><button className="secondary-cta" onClick={()=>setReading(false)}>← Voltar ao mapa</button><h1>Leitura de hoje</h1><nav aria-label="Capítulos de hoje" className="v2-chapters">{today.chapters.map((c,i)=><button key={c.id} onClick={()=>setChapter(i)} aria-pressed={chapter===i}>{c.book} {c.chapter}</button>)}</nav><BibleReader chapterId={today.chapters[chapter].id}/><p className="muted">Prévia de leitura. Nenhum XP é registrado aqui.</p></>}
 <MainNavigation activeTab="journey"/>
 </main>;
}
createRoot(document.getElementById("root")!).render(<Preview/>);
