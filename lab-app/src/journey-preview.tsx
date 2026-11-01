import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {BiblicalWorldMap} from './components/BiblicalWorldMap';
import {MainNavigation} from './components/MainNavigation';
import {ConsistencyFlame} from './components/ConsistencyFlame';
import {BibleReader} from './components/BibleReader';
import {createNextGamePlan} from './domain/game-plan-next';
import './style.css';
const plans={365:createNextGamePlan(365).stages,366:createNextGamePlan(366).stages};
const examples=[['Origens','Gênesis',1],['José no Egito','Gênesis',39],['Sinai','Êxodo',19],['Tribos de Israel','Josué',13],['Reino de Davi','2 Samuel',5],['Viagens de Paulo','Atos',16],['Roma','Atos',28]] as const;
function Preview(){
 const query=new URLSearchParams(window.location.search);
 const [length,setLength]=useState<365|366>(query.get('length')==='366'?366:365),[stage,setStage]=useState(()=>Math.max(1,Math.min(365,Number(query.get('stage'))||1))),[focusBook,setFocusBook]=useState<string|undefined>(query.get('book')??undefined),[reading,setReading]=useState(false),[chapter,setChapter]=useState(0);
 const plan=plans[length],today=plan[Math.min(stage,plan.length)-1];
 const changeStage=(next:number)=>{setStage(Math.min(length,next));setReading(false)};
 return <main className="journey-clean journey-demo-content" style={{maxWidth:query.get('mobile')==='1'?390:960,margin:'auto',padding:16,color:'#f2ecda'}}>
 <aside aria-label="Controles da demonstração" style={{padding:'12px 16px',border:'1px solid #45636b',borderRadius:16,marginBottom:16,background:'#15333e'}}><strong>Prévia interativa · LABGame 3D</strong><p style={{fontSize:13}}>Ambiente de demonstração. A navegação abaixo não altera sua conta, XP ou progresso.</p><div style={{display:'flex',gap:12,flexWrap:'wrap'}}><label>Cenário <select aria-label="Cenário de demonstração" onChange={e=>{const next=Number(e.target.value),example=examples.find(([,book,c])=>plan.find(d=>d.chapters.some(ch=>ch.book===book&&ch.chapter===c))?.day===next);setFocusBook(example?.[1]);changeStage(next)}} value={examples.map(([,book,chapter])=>plan.find(d=>d.chapters.some(ch=>ch.book===book&&ch.chapter===chapter))?.day).includes(stage)?stage:''}><option value="" disabled>Etapa personalizada</option>{examples.map(([label,book,c])=>{const d=plan.find(d=>d.chapters.some(ch=>ch.book===book&&ch.chapter===c));return d?<option key={label} value={d.day}>{label}</option>:null})}</select></label><label>Etapa <input aria-label="Etapa de demonstração" type="number" min={1} max={length} value={stage} onChange={e=>changeStage(Math.max(1,Number(e.target.value)||1))} style={{width:68}}/></label><label>Ciclo <select aria-label="Duração da demonstração" value={length} onChange={e=>{const n=Number(e.target.value) as 365|366;setLength(n);setStage(s=>Math.min(n,s))}}><option value={365}>365 dias</option><option value={366}>366 dias</option></select></label></div></aside>
 {!reading?<><header className="journey-clean-hud"><div className="journey-clean-title"><h1>Minha Jornada</h1><ConsistencyFlame compact completedDays={stage-1} status="active"/></div><p>{today.chapters.map(c=>`${c.book} ${c.chapter}`).join(' · ')}</p><div><span>{today.chapters.length} capítulos nesta etapa</span><span>Etapa {stage} de {length}</span></div></header><BiblicalWorldMap focusBook={focusBook} stage={stage} completedStages={stage-1} chapters={[]} plan={plan} onRead={()=>{setChapter(0);setReading(true)}}/></>:<><button className="secondary-cta" onClick={()=>setReading(false)}>← Voltar ao mapa</button><h1>Leitura da etapa</h1><nav aria-label="Capítulos da etapa" className="v2-chapters">{today.chapters.map((c,i)=><button key={c.id} onClick={()=>setChapter(i)} aria-pressed={chapter===i}>{c.book} {c.chapter}</button>)}</nav><BibleReader chapterId={today.chapters[chapter].id}/><p className="muted">A prévia não registra XP.</p></>}
 <MainNavigation activeTab="journey"/>
 </main>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
