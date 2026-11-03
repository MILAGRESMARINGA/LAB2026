import {useState} from 'react';
import {BookOpen,Check,Lock,Map,HelpCircle} from 'lucide-react';
import type {GameDay} from '../domain/game-plan';
import {CHAPTERS} from '../domain/canon';
import {weekWindow} from '../domain/journey-atlas';
import './basic-journey.css';
type Props={stage:number|null;completedStages:number;chapters:readonly {chapter_id:string}[];plan?:ReadonlyArray<GameDay>;onRead?:()=>void;readingAvailable?:boolean;completedMessage?:string;onExplore?:()=>void;onPreviewStage?:(stage:number)=>void};
export function BasicJourney({stage,completedStages,chapters,plan,onRead,readingAvailable=true,completedMessage,onExplore,onPreviewStage}:Props){
 const [help,setHelp]=useState(false),[notice,setNotice]=useState('');
 const days=plan??[{day:1,old:[],psalms:[],newTestament:[],chapters:chapters.flatMap(c=>{const found=CHAPTERS.find(x=>x.id===c.chapter_id);return found?[found]:[]})}];
 const current=Math.max(1,Math.min(days.length,stage??1)),week=weekWindow(days,current);
 const xs=[50,34,29,42,61,68,55],ys=week.days.map((_,i)=>15+i*11);
 const points=week.days.map((_,i)=>`${xs[i]},${ys[i]}`).join(' ');
 const canRead=readingAvailable&&current>completedStages;
 const choose=(day:number)=>{if(onPreviewStage){onPreviewStage(day);return}if(day===current&&canRead){setNotice('');onRead?.()}else setNotice(day<=completedStages?'✓ Concluído':day===current?(completedMessage??'A próxima leitura será liberada no horário certo.'):'Continue pela etapa iluminada.')};
 return <section className="journey-world basic-journey" data-view-mode="episode" aria-label="Mapa das etapas da Jornada">
  <header><span className="basic-brand">✦ LAB</span><h2>Sua caminhada</h2><button type="button" aria-label="Ajuda da jornada" aria-expanded={help} onClick={()=>setHelp(v=>!v)}><HelpCircle size={24}/></button></header>
  {help&&<aside className="basic-help"><p>Toque no livro iluminado. Leia e confirme. Um dia de cada vez.</p>{onExplore&&<button type="button" onClick={onExplore}><Map size={18}/> Explorar mapa</button>}<button type="button" onClick={()=>setHelp(false)}>Entendi</button></aside>}
  <div className="basic-trail" role="group" aria-label={`Semana atual: etapas ${week.start+1} a ${week.start+week.days.length}`}>
   <div className="basic-hill hill-one" aria-hidden="true"/><div className="basic-hill hill-two" aria-hidden="true"/><span className="basic-sun" aria-hidden="true">✦</span>
   <svg className="basic-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke="#b8c4b1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><polyline points={points} fill="none" stroke="#f1f4dc" strokeWidth=".8" strokeDasharray="1.3 2" strokeLinecap="round"/></svg>
   {week.days.map((item,i)=>{const done=item.day<=completedStages,active=item.day===current&&!done;return <div className="basic-stop" key={item.day} style={{left:`${xs[i]}%`,top:`${ys[i]}%`}}>
    {active&&<span className="basic-start-cue">Toque aqui <span aria-hidden="true">↓</span></span>}
    <button type="button" data-week-day={item.day} aria-label={`Etapa ${item.day}, ${done?'Concluída':active?'Atual':onPreviewStage?'Disponível':'Bloqueada'}, ${item.chapters.map(c=>`${c.book} ${c.chapter}`).join(' · ')}`} aria-current={item.day===current?'step':undefined} aria-disabled={onPreviewStage?false:!active||!canRead} className={`basic-node ${done?'done':active?'current':onPreviewStage?'available':'locked'}`} onClick={()=>choose(item.day)}>{done?<Check size={28}/>:active?<BookOpen size={30}/>:onPreviewStage?<BookOpen size={23}/>:<Lock size={21}/>}</button>
    {active&&<strong className="basic-read-label">{completedStages?'Continuar':'Começar'}</strong>}
   </div>})}
  </div>
  {notice&&<p className="basic-notice" role="status">{notice}<button type="button" onClick={()=>setNotice('')} aria-label="Fechar aviso">✕</button></p>}
  <footer aria-label="Caminhada de doze meses"><span>🌱</span><div className="basic-months">{Array.from({length:12},(_,i)=><i key={i} className={i<Math.floor(completedStages/days.length*12)?'complete':''} aria-label={`Mês ${i+1}`}/>)}</div><span>🏆</span></footer>
 </section>;
}
