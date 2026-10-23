import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {CHAPTERS} from '../domain/canon';
import type {GameDay} from '../domain/game-plan';
import {journeyPoint,stageJourneyContexts} from '../domain/journey-geography';
import './biblical-world-map.css';

type Props={stage:number|null;completedStages:number;chapters:readonly {chapter_id:string}[];plan?:ReadonlyArray<GameDay>;onRead?:()=>void;readingAvailable?:boolean;readLabel?:string;completedMessage?:string};
export function BiblicalWorldMap({stage,completedStages,chapters,plan,onRead,readingAvailable=true,readLabel,completedMessage}:Props){
 const id=useId().replace(/:/g,''),viewport=useRef<HTMLDivElement>(null),nodes=useRef(new Map<number,SVGGElement>());
 const [selected,setSelected]=useState(stage??1),[overview,setOverview]=useState(false),[zoom,setZoom]=useState(1);
 const days=useMemo(()=>plan??[{day:1,old:[],psalms:[],newTestament:[],chapters:chapters.flatMap(item=>{const ch=CHAPTERS.find(c=>c.id===item.chapter_id);return ch?[ch]:[]})}],[plan,chapters]);
 const current=Math.max(1,Math.min(days.length,stage??1));
 const viewed=days[Math.max(0,Math.min(days.length-1,selected-1))];
 const contexts=stageJourneyContexts(viewed);
 const [notice,setNotice]=useState('');
 const weekStart=Math.floor((current-1)/7)*7;
 const visibleDays=overview?days:days.slice(weekStart,weekStart+7);
 const height=overview?Math.ceil(days.length/16)*54+160:visibleDays.length*145+230;
 const points=useMemo(()=>visibleDays.map((day,i)=>journeyPoint(day,i,overview)),[visibleDays,overview]);
 const path=points.map((p,i)=>i===0?`M${p.x} ${p.y}`:overview?`L${p.x} ${p.y}`:`C${points[i-1].x} ${points[i-1].y+65} ${p.x} ${p.y-65} ${p.x} ${p.y}`).join(' ');
 const panTo=(day:number)=>{const container=viewport.current,node=nodes.current.get(day);if(container&&node){const box=node.getBoundingClientRect(),parent=container.getBoundingClientRect();container.scrollTop+=box.top-parent.top-container.clientHeight*.38;container.scrollLeft+=box.left-parent.left-container.clientWidth*.5}};
 useEffect(()=>{setSelected(current)},[current]);
 useEffect(()=>{if(overview){if(viewport.current){viewport.current.scrollTop=0;viewport.current.scrollLeft=0}}else panTo(current)},[current,overview]);
 const choose=(day:number)=>{setSelected(day);if(day===current&&readingAvailable){setNotice('');onRead?.()}else setNotice(day<=completedStages?'Etapa já concluída.':day===current?(completedMessage??'Aguarde a próxima liberação.'):'Esta etapa ainda está bloqueada.')};
 const status=(day:number)=>day<=completedStages?'Concluída':day===current?'Atual':'Bloqueada';
 return <section className="journey-world" aria-label="Mapa das etapas da Jornada">
  <header className="journey-world-heading"><h2>{overview?"Toda a Jornada":`Semana ${Math.floor((current-1)/7)+1}`}</h2></header>
  <div className="journey-map-tools" aria-label="Controles do mapa">
   <button onClick={()=>setZoom(z=>Math.max(.5,z-.25))} disabled={zoom<=.5} aria-label="Diminuir mapa">−</button><output aria-label="Zoom do mapa">{Math.round(zoom*100)}%</output><button onClick={()=>setZoom(z=>Math.min(2,z+.25))} disabled={zoom>=2} aria-label="Ampliar mapa">+</button>
   <button aria-pressed={overview} onClick={()=>{setOverview(v=>!v);setZoom(1)}}>{overview?'Ver semana':'Ver jornada inteira'}</button>
   
  </div>
  <div ref={viewport} className={'journey-map-viewport '+(overview?'is-overview':'')} tabIndex={0} aria-label="Mapa vertical com todas as etapas; arraste para explorar">
   <svg viewBox={`0 0 720 ${height}`} style={overview?{height:`${zoom*100}%`,width:"auto"}:{width:`${zoom*100}%`}} className="journey-map-scene" role="group" aria-label={`Percurso interativo de 1 a ${days.length}`}>
    <defs>
     <linearGradient id={`${id}-sea`} x2="1" y2="1"><stop stopColor="#164955"/><stop offset="1" stopColor="#0c2c3c"/></linearGradient>
     <linearGradient id={`${id}-land`} x2="1" y2="0"><stop stopColor="#a58c5b"/><stop offset=".4" stopColor="#d5c38b"/><stop offset="1" stopColor="#7f966b"/></linearGradient>
     <pattern id={`${id}-terrain`} width="720" height="960" patternUnits="userSpaceOnUse">
      <rect width="720" height="960" fill={`url(#${id}-sea)`}/>
      <g stroke="#8cbdc0" strokeWidth="2" opacity=".15" fill="none">{Array.from({length:18},(_,i)=><path key={i} d={`M0 ${i*55}q40 -15 80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0t80 0`}/>)}</g>
      <path d="M80 -30L680 -30 700 960 180 990 150 850 210 760 130 650 170 570 80 470 110 360 50 250 120 140Z" fill="#082431" transform="translate(0 14)" opacity=".65"/>
      <path d="M80 -30L680 -30 700 960 180 990 150 850 210 760 130 650 170 570 80 470 110 360 50 250 120 140Z" fill={`url(#${id}-land)`} stroke="#e1ce98" strokeWidth="3"/>
      <path d="M625 -10Q530 150 620 300T565 580 630 980" fill="none" stroke="#77b9b4" strokeWidth="9"/>
      {[[80,280],[615,190],[650,235],[620,680],[660,720],[130,550]].map(([x,y])=><g key={`${x}-${y}`} transform={`translate(${x} ${y})`}><ellipse cy="18" rx="30" ry="9" fill="#424e3c" opacity=".25"/><path d="M-26 15L0 -38 28 15Z" fill="#788069"/><path d="M0 -38L28 15H3Z" fill="#4e6054"/><path d="M-9 -20L0 -38 10 -19 1 -23 -3 -16Z" fill="#f0e5c9"/></g>)}
      {[[92,170],[120,190],[160,395],[140,420],[640,400],[620,430],[135,900]].map(([x,y])=><g key={`tree-${x}-${y}`} transform={`translate(${x} ${y})`}><path d="M0 12V-12" stroke="#6e5739" strokeWidth="5"/><path d="M-13 2L0 -30 13 2Z" fill="#3e684d"/></g>)}
      <g transform="translate(35 740)"><path d="M-20 12Q0 30 23 12Z" fill="#bfa16a"/><path d="M0 -28V12" stroke="#f2dfb2" strokeWidth="3"/><path d="M-3 -25L-23 8H-3Z" fill="#e9d7a7"/></g>
     </pattern>
    </defs>
    <rect width="720" height={height} fill={`url(#${id}-terrain)`}/>
    <g fill="#273e33" fontSize="18" fontWeight="700" aria-hidden="true">{!overview&&visibleDays.filter((_,i)=>i%12===0).map(day=>{const p=points[visibleDays.indexOf(day)];return <text key={day.day} x="230" y={p.y-85}>{stageJourneyContexts(day)[0].region}</text>})}</g>
    <g fill="none" strokeLinecap="round" aria-hidden="true"><path d={path} stroke="#394b39" strokeWidth={overview?14:36} transform="translate(0 8)" opacity=".45"/><path d={path} stroke="#8d7047" strokeWidth={overview?12:34}/><path d={path} stroke="#ecd39b" strokeWidth={overview?8:25}/>{!overview&&<path d={path} stroke="#af925e" strokeWidth="2" strokeDasharray="2 12"/>}</g>
    {visibleDays.map((day,i)=>{const p=points[i],state=status(day.day),isCurrent=day.day===current,isSelected=day.day===selected,context=stageJourneyContexts(day)[0];return <g key={day.day} ref={el=>{if(el)nodes.current.set(day.day,el);else nodes.current.delete(day.day)}} role="button" tabIndex={0} aria-pressed={isSelected} aria-label={`Etapa ${day.day}, ${state}, ${context.name}`} transform={`translate(${p.x} ${p.y})`} className="journey-map-node" onClick={()=>choose(day.day)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(day.day)}}}>
     <title>{`Etapa ${day.day} · ${state} · ${day.chapters.map(c=>`${c.book} ${c.chapter}`).join(' · ')}`}</title>
     <circle r={overview?21:44} fill="transparent"/>
     <ellipse cy={overview?5:13} rx={overview?17:32} ry={overview?7:14} fill="#243a31" opacity=".7"/>
     {isCurrent&&<circle r={overview?20:39} fill="none" stroke="#c2ed68" strokeWidth="3"/>}
     <circle r={overview?15:29} fill={day.day<=completedStages?'#88b46a':isCurrent?'#b4e44d':'#344d4e'} stroke={isSelected?'#fff2c8':'#9da788'} strokeWidth={isSelected?4:2}/>
     <text textAnchor="middle" y={overview?4:6} fontSize={overview?11:19} fontWeight="800" fill={day.day<=completedStages||isCurrent?'#203c30':'#e1e8d8'}>{day.day}</text>
     {day.day<=completedStages&&<text x={overview?11:23} y={overview?-10:-20} fontSize={overview?10:16} fill="#f3edc9">✓</text>}
     {!overview&&<><path d="M-10 -46V-65H-3V-58H4V-69H10V-46" stroke="#6e613e" strokeWidth="2" fill="#e4ce97"/><rect x="-112" y="43" width="224" height="43" rx="10" fill="#132f36"/><text y="61" textAnchor="middle" fill="#eef2dc" fontSize="14" fontWeight="700">{context.name}</text><text y="78" textAnchor="middle" fill="#c3d7bc" fontSize="12">{state} · {day.chapters.length} capítulos</text></>}
    </g>})}
    <text x="360" y={height-40} textAnchor="middle" fill="#f4e6ba" fontSize="20" fontWeight="700">{overview?'✧ O Galardão':`Etapas ${weekStart+1} a ${Math.min(weekStart+7,days.length)}`}</text>
   </svg>
  </div>
  {notice&&<p className="journey-map-notice" role="status">{notice}</p>}
  <details className="journey-map-help"><summary>Ajuda e contexto</summary><p>Toque no número aceso para ler. As etapas com ✓ já foram concluídas; as demais aguardam liberação. Use + e − para ajustar o mapa.</p><p>{viewed.chapters.map(c=>`${c.book} ${c.chapter}`).join(' · ')}</p>{contexts.map(context=><p key={context.name}><strong>{context.name}</strong> · {context.region}<br/>{context.detail}<br/><small>{context.reference}</small></p>)}<p>O caminho é uma representação de jogo, sem escala geográfica.</p></details>
 </section>;
}
