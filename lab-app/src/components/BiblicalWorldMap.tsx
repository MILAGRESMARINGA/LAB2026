import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {CHAPTERS} from '../domain/canon';
import type {GameDay} from '../domain/game-plan';
import {atlasProject,atlasStage,weekWindow} from '../domain/journey-atlas';
import {literaryBlockFor} from '../domain/literary-blocks';
import {getBookIntroduction} from '../domain/book-introductions';
import {getBibleProjectVideoForChapter,type BibleProjectResource} from '../domain/bibleproject';
import {IsometricTerrain} from './IsometricTerrain';
import './biblical-world-map.css';

type Props={stage:number|null;completedStages:number;chapters:readonly {chapter_id:string}[];plan?:ReadonlyArray<GameDay>;onRead?:()=>void;readingAvailable?:boolean;readLabel?:string;completedMessage?:string;onVideo?:(resource:BibleProjectResource,book:string)=>void};
export function BiblicalWorldMap({stage,completedStages,chapters,plan,onRead,readingAvailable=true,readLabel,completedMessage,onVideo}:Props){
 const id=useId().replace(/:/g,''),dialog=useRef<HTMLDialogElement>(null);
 const [notice,setNotice]=useState(''),[gate,setGate]=useState(false),[moving,setMoving]=useState(false);
 const days=useMemo(()=>plan??[{day:1,old:[],psalms:[],newTestament:[],chapters:chapters.flatMap(item=>{const ch=CHAPTERS.find(c=>c.id===item.chapter_id);return ch?[ch]:[]})}],[plan,chapters]);
 const current=Math.max(1,Math.min(days.length,stage??1)),day=days[current-1];
 const {start,days:visible}=weekWindow(days,current);
 const active=day?.chapters.length?atlasStage(day):null;
 const center=active?atlasProject(active.place.lon,active.place.lat):{x:600,y:430};
 const region=active?.place.name??'Mundo bíblico';
 useEffect(()=>{setGate(false);setNotice('')},[current]);
 const previousRegion=useRef(region);
 useEffect(()=>{if(previousRegion.current===region)return;previousRegion.current=region;setGate(false);if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;setMoving(true);const timer=window.setTimeout(()=>setMoving(false),850);return()=>{window.clearTimeout(timer);setMoving(false)}},[region]);
 useEffect(()=>{if(!gate)return;const el=dialog.current,previous=document.activeElement as HTMLElement|null;if(!el)return;el.showModal();return()=>{el.close();previous?.focus()}},[gate]);
 const openings=day?.chapters.filter(ch=>ch.chapter===1)??[];
 const canRead=readingAvailable&&current>completedStages;
 const choose=(n:number)=>{if(moving)return;if(n!==current||!canRead){setNotice(n<=completedStages?'Etapa já concluída.':n===current?(completedMessage??'Aguarde a próxima liberação.'):'Esta etapa ainda está bloqueada.');return}setNotice('');if(openings.length)setGate(true);else onRead?.()};
 const points=visible.map((d,i)=>{const a=d.chapters.length?atlasStage(d):active,p=a?atlasProject(a.place.lon,a.place.lat):center;return {x:360+(p.x-center.x)*.25+Math.sin(i*1.2)*125,y:140+i*86,day:d}});
 const path=points.map((p,i)=>i?`C${points[i-1].x} ${points[i-1].y+43} ${p.x} ${p.y-43} ${p.x} ${p.y}`:`M${p.x} ${p.y}`).join(' ');
 const block=active?literaryBlockFor(active.chapter.book):undefined;
 if(!day||!active)return <section className="journey-world"><p role="status">O plano de leitura ainda não está disponível.</p></section>;
 return <section className="journey-world isometric-journey" aria-label="Mapa das etapas da Jornada" aria-busy={moving}>
  <header className="journey-world-heading"><span className="atlas-eyebrow">LAB · MUNDO DA BÍBLIA</span><h2>Semana {Math.floor(start/7)+1} · {region}</h2><p>{block?.symbol} {block?.name} · Etapa {current} de {days.length}</p></header>
  <div className="atlas-stage" data-biome={active.place.biome}>
   <svg viewBox="0 0 720 840" className="atlas-scene" role="group" aria-label={`Semana atual: etapas ${start+1} a ${start+visible.length}`}>
    <defs><linearGradient id={`${id}-fog`} x2="0" y2="1"><stop stopColor="#e6f7f5" stopOpacity=".95"/><stop offset="1" stopColor="#e6f7f5" stopOpacity="0"/></linearGradient></defs>
    <g className="atlas-camera" style={{transform:`translate(${360-center.x}px, ${430-center.y}px)`}}><IsometricTerrain id={id}/></g>
    <g aria-hidden="true" fill="none" strokeLinecap="round">
     {start>0&&<path d={`M${points[0].x} 85v45`} stroke="#e7e5bd" strokeWidth="4" strokeDasharray="3 9"/>}
     <path d={path} stroke="#203f40" strokeWidth="22" opacity=".35" transform="translate(0 9)"/><path d={path} stroke="#fff2c7" strokeWidth="15"/>
     {points.slice(1).map((p,i)=><path key={p.day.day} d={`M${points[i].x} ${points[i].y}C${points[i].x} ${points[i].y+43} ${p.x} ${p.y-43} ${p.x} ${p.y}`} stroke={literaryBlockFor((p.day.old[0]??p.day.chapters[0])?.book)?.color??'#0072B2'} strokeWidth="7"/>)}
    </g>
    {points.map(p=>{const n=p.day.day,b= literaryBlock(p.day),isCurrent=n===current,done=n<=completedStages,state=done?'Concluída':isCurrent?'Atual':'Bloqueada';return <g key={n} role="button" tabIndex={moving?-1:0} aria-disabled={moving||n!==current||!canRead} aria-label={`Etapa ${n}, ${state}, ${p.day.chapters.map(ch=>`${ch.book} ${ch.chapter}`).join(' · ')}`} className={`journey-map-node atlas-flag ${isCurrent?'is-current':''}`} transform={`translate(${p.x} ${p.y})`} onClick={()=>choose(n)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(n)}}}>
     <title>{`${b?.name} · ${state}`}</title><rect x="-48" y="-72" width="96" height="100" fill="transparent"/>
     <ellipse cy="12" rx="30" ry="13" fill="#173e42" opacity=".35"/><ellipse cy="6" rx="25" ry="12" fill={isCurrent?'#fff7c0':'#d2d7b2'} stroke="#3b6663" strokeWidth="3"/>
     {isCurrent&&<ellipse className="atlas-current-ring" cy="6" rx="34" ry="17" fill="none" stroke="#fff8b6" strokeWidth="4"/>}
     <path d="M-23 4V-68M23 4V-68M-30 -63H30" stroke="#70502d" strokeWidth="5"/><path d="M-20 -61H20V-17L0 -25 -20 -17Z" fill={b?.color??'#0072B2'} stroke="#fff5d2" strokeWidth="2"/>
     <rect x="-15" y="-54" width="30" height="25" rx="6" fill="#132f3c"/><text y="-36" textAnchor="middle" fill="white" fontSize="16" fontWeight="900">{n}</text>
     <text x="38" y="-27" fill="#102f39" stroke="#fff9dc" strokeWidth="4" paintOrder="stroke" fontSize="18" fontWeight="900">{done?'✓':isCurrent?'Você':'🔒'}</text>
     <text textAnchor="middle" y="31" fill="#112f38" stroke="#fff6d5" strokeWidth="4" paintOrder="stroke" fontWeight="800" fontSize="12">{b?.symbol} {state}</text>
    </g>})}
    <g aria-hidden="true" pointerEvents="none"><rect width="720" height="85" fill={`url(#${id}-fog)`}/><rect y="765" width="720" height="75" fill="#d7eeed" opacity=".88"/><text x="360" y="805" textAnchor="middle" fill="#254c59" fontSize="17">{current===days.length?'O fim de uma grande jornada':'O próximo trecho se revela a cada semana'}</text></g>
   </svg>
   {moving&&<p className="atlas-travel" role="status">Viajando para {region}…</p>}
   <div className="atlas-location"><span>{active.context.kind==='simbólico'?'Marco simbólico':active.context.kind==='destinatários'?'Região dos destinatários':'Panorama regional'}</span><strong>{active.context.name}</strong></div>
  </div>
  {notice&&<p className="journey-map-notice" role="status">{notice}</p>}
  <details className="journey-map-help"><summary>Localização e leitura da semana</summary><p>{active.context.detail} {active.context.reference}</p><p>Mapa isométrico ilustrativo, sem escala. As bandeiras organizam sete dias dentro da região; não indicam coordenadas exatas de cada capítulo. O plano intercalado pode reunir várias regiões no mesmo dia.</p>{day.chapters.map(ch=><p key={ch.id}><strong>{ch.book} {ch.chapter}</strong> · {atlasStage({...day,old:[ch],chapters:[ch]}).context.name}</p>)}</details>
  {gate&&<dialog ref={dialog} className="atlas-book-gate" aria-label="Portão de abertura do livro" onCancel={e=>{e.preventDefault();setGate(false)}}><button className="atlas-close" autoFocus onClick={()=>setGate(false)} aria-label="Fechar portão">✕</button><span className="atlas-eyebrow">NOVO LIVRO · NOVA DESCOBERTA</span>{openings.map(ch=>{const intro=getBookIntroduction(ch.book),context=atlasStage({...day,old:[ch],chapters:[ch]}).context,video=getBibleProjectVideoForChapter(ch.book,1);return <article key={ch.id}><h2>Portão de {ch.book}</h2><p><strong>{context.name}</strong> · {context.region}</p><p>{context.detail}</p>{intro&&<><h3>{intro.theme}</h3><p>{intro.context}</p></>}<div className="atlas-video-chest"><h3>✦ Baú do Vídeo · BibleProject</h3><p>Panorama em português. Assistir é opcional; as recompensas seguem a validação do aplicativo.</p>{video&&(onVideo?<button className="secondary-cta" onClick={()=>{setGate(false);onVideo(video,ch.book)}}>Assistir ao panorama</button>:<a href={video.url} target="_blank" rel="noopener noreferrer">Abrir panorama oficial</a>)}</div></article>})}<button className="primary-cta" disabled={!canRead} onClick={()=>{setGate(false);if(canRead)onRead?.()}}>{readLabel??'Começar a leitura'}</button></dialog>}
 </section>;
}
function literaryBlock(day:GameDay){return literaryBlockFor((day.old[0]??day.chapters[0])?.book)}
