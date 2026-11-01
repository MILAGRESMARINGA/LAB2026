import {lazy,Suspense,useCallback,useEffect,useId,useMemo,useRef,useState,type CSSProperties} from 'react';
import {CHAPTERS} from '../domain/canon';
import type {GameDay} from '../domain/game-plan';
import {atlasChapter,atlasPlace,weekWindow} from '../domain/journey-atlas';
import {chapterJourneyContext} from '../domain/journey-geography';
import {literaryBlockFor} from '../domain/literary-blocks';
import {getBookIntroduction} from '../domain/book-introductions';
import {getBibleProjectVideoForChapter,type BibleProjectResource} from '../domain/bibleproject';
const JourneyScene3D=lazy(()=>import('./JourneyScene3D').then(module=>({default:module.JourneyScene3D})));
import './biblical-world-map.css';

type Props={stage:number|null;completedStages:number;chapters:readonly {chapter_id:string}[];plan?:ReadonlyArray<GameDay>;onRead?:()=>void;readingAvailable?:boolean;readLabel?:string;completedMessage?:string;onVideo?:(resource:BibleProjectResource,book:string)=>void;focusBook?:string};
type Projection={day:number;x:number;y:number};
type AtlasStyle=CSSProperties & {'--block-color'?:string;'--journey-color'?:string};
const statusName={current:'Atual',completed:'Concluída',locked:'Bloqueada'} as const;
const fallbackPosition=(index:number,count:number)=>({left:`${50+Math.sin(index*1.18)*23}%`,top:`${14+(count===1?30:index/(count-1)*65)}%`});

export function BiblicalWorldMap({stage,completedStages,chapters,plan,onRead,readingAvailable=true,readLabel,completedMessage,onVideo,focusBook}:Props){
 const id=useId().replace(/:/g,''),dialog=useRef<HTMLDialogElement>(null),guide=useRef<HTMLDetailsElement>(null);
 const [notice,setNotice]=useState(''),[gate,setGate]=useState(false),[moving,setMoving]=useState(false);
 const [focusedChapterId,setFocusedChapterId]=useState(''),[projected,setProjected]=useState<ReadonlyArray<Projection>>([]),[unavailable,setUnavailable]=useState(false);
 const [reducedMotion,setReducedMotion]=useState(()=>typeof window!=='undefined'&&Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
 const days=useMemo<ReadonlyArray<GameDay>>(()=>plan??[{day:1,old:[],psalms:[],newTestament:[],chapters:chapters.flatMap(item=>{const chapter=CHAPTERS.find(candidate=>candidate.id===item.chapter_id);return chapter?[chapter]:[]})}],[plan,chapters]);
 const current=Math.max(1,Math.min(days.length,stage??1)),day=days[current-1];
 const week=useMemo(()=>weekWindow(days,current),[days,current]);
 const chapter=day?.chapters.find(item=>item.id===focusedChapterId)??day?.chapters.find(item=>item.book===focusBook)??day?.old[0]??day?.chapters[0];
 const active=chapter?atlasChapter(chapter):null;
 const context=chapter?chapterJourneyContext(chapter):null;
 const focus=useMemo(()=>({lon:active?.place.lon??35.2,lat:active?.place.lat??31.8}),[active?.place.lon,active?.place.lat]);
 const focusTestament=chapter?.testament;
 const nodes=useMemo(()=>week.days.flatMap(item=>{
  const reading=item.day===current?chapter:item.chapters.find(candidate=>candidate.testament===focusTestament)??item.old[0]??item.chapters[0];
  if(!reading)return [];
  const place=atlasPlace(reading),block=literaryBlockFor(reading.book);
  return [{day:item.day,lon:place.lon,lat:place.lat,color:block?.color??'#0072B2',name:place.name,status:item.day<=completedStages?'completed' as const:item.day===current?'current' as const:'locked' as const}];
 }),[week,chapter,current,focusTestament,completedStages]);
 const block=chapter?literaryBlockFor(chapter.book):undefined;
 const openings=day?.chapters.filter(item=>item.chapter===1)??[];
 const canRead=readingAvailable&&current>completedStages;
 useEffect(()=>{setGate(false);setNotice('');setFocusedChapterId('')},[current,focusBook]);
 useEffect(()=>{
  const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!media)return;
  const update=()=>setReducedMotion(media.matches);update();media.addEventListener?.('change',update);return()=>media.removeEventListener?.('change',update);
 },[]);
 useEffect(()=>{
  if(!gate)return;
  const element=dialog.current,previous=document.activeElement as HTMLElement|null;if(!element)return;
  element.showModal();const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=previousOverflow;if(previous?.isConnected)previous.focus()};
 },[gate]);
 const handleProject=useCallback((points:ReadonlyArray<Projection>)=>setProjected(previous=>previous.length===points.length&&previous.every((point,index)=>point.day===points[index].day&&Math.abs(point.x-points[index].x)<.5&&Math.abs(point.y-points[index].y)<.5)?previous:points),[]);
 const handleTransition=useCallback((value:boolean)=>setMoving(value),[]);
 const handleUnavailable=useCallback(()=>{setUnavailable(true);setMoving(false);setProjected([])},[]);
 const choose=useCallback((number:number)=>{
  if(moving)return;
  if(number!==current||!canRead){setNotice(number<=completedStages?'Etapa já concluída.':number===current?(completedMessage??'Aguarde a próxima liberação.'):'Esta etapa ainda está bloqueada.');return}
  setNotice('');if(openings.length)setGate(true);else onRead?.();
 },[moving,current,canRead,completedStages,completedMessage,openings.length,onRead]);
 if(!day||!chapter||!active||!context)return <section className="journey-world"><p role="status">O plano de leitura ainda não está disponível.</p></section>;
 const currentLabel=`${chapter.book} ${chapter.chapter}`;
 return <section className="journey-world isometric-journey" aria-label="Mapa das etapas da Jornada" aria-busy={moving} style={{'--journey-color':block?.color??'#0072B2'} as AtlasStyle}>
  <header className="journey-world-heading">
   <div className="atlas-heading-copy"><span className="atlas-eyebrow">MUNDO DA BÍBLIA · SEMANA {Math.floor(week.start/7)+1}</span><h2>{active.place.name}</h2><p>{block?.symbol} {block?.name} <span>· Etapa {current} de {days.length}</span></p></div>
   <button type="button" className="atlas-guide-link" aria-controls={`${id}-context`} onClick={()=>{const element=guide.current;if(element){element.open=true;element.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'})}}}><span aria-hidden="true">▤</span> Guia</button>
  </header>
  <div className="atlas-focus-control"><label htmlFor={`${id}-reading`}>Região da leitura</label><select id={`${id}-reading`} aria-label="Região da leitura" value={chapter.id} onChange={event=>{setFocusedChapterId(event.target.value);setNotice('')}}>{day.chapters.map(item=><option value={item.id} key={item.id}>{item.book} {item.chapter} · {atlasPlace(item).name}</option>)}</select></div>
  <div className={`atlas-stage atlas-stage-3d${unavailable?' is-fallback':''}`} data-biome={active.place.biome} role="group" aria-label={`Semana atual: etapas ${week.start+1} a ${week.start+week.days.length}`}>
   {!unavailable&&<Suspense fallback={<div className="atlas-scene-loading" role="status">Preparando o mundo bíblico…</div>}><JourneyScene3D nodes={nodes} focus={focus} onSelect={choose} onProject={handleProject} onTransition={handleTransition} reducedMotion={reducedMotion} onUnavailable={handleUnavailable}/></Suspense>}
   {unavailable&&<div className="atlas-accessible-terrain" aria-hidden="true"><div className="atlas-fallback-river"/><span className="atlas-fallback-label">{active.place.name}</span></div>}
   <div className="atlas-week-controls" aria-label="Etapas desta semana">
    {nodes.map((node,index)=>{const projection=projected.find(point=>point.day===node.day),style={...(projection&&!unavailable?{left:projection.x,top:projection.y}:fallbackPosition(index,nodes.length)),'--block-color':node.color} as AtlasStyle;const reading=week.days.find(item=>item.day===node.day)!;return <button type="button" key={node.day} data-journey-day={node.day} className={`atlas-day-button is-${node.status}`} style={style} aria-current={node.status==='current'?'step':undefined} aria-disabled={moving||node.day!==current||!canRead} aria-label={`Etapa ${node.day}, ${statusName[node.status]}, ${reading.chapters.map(item=>`${item.book} ${item.chapter}`).join(' · ')}`} onClick={()=>choose(node.day)} title={`${node.name} · ${statusName[node.status]}`}><span className="atlas-day-number">{node.day}</span><span className="atlas-day-status" aria-hidden="true">{node.status==='completed'?'✓':node.status==='current'?'LER':'🔒'}</span>{node.status==='current'&&<span className="atlas-current-tag" aria-hidden="true">VOCÊ ESTÁ AQUI</span>}</button>})}
   </div>
   {week.start>0&&<div className="atlas-past-thread" aria-hidden="true"><span>✓</span> {week.start} etapas anteriores</div>}
   <div className="atlas-future-fog" aria-hidden="true"><span>{current===days.length?'Uma jornada inteira na Palavra':'A próxima semana se revela no caminho'}</span></div>
   <div className="atlas-location"><span>{active.kind==='symbolic'?'MARCO SIMBÓLICO':active.kind==='recipient'?'COMUNIDADE DESTINATÁRIA':active.kind==='literary'?'CONTEXTO LITERÁRIO':active.kind==='vision'?'CENÁRIO DA VISÃO':'LOCAL DA NARRATIVA'}</span><strong>{currentLabel}</strong><small>{active.confidence==='uncertain'?'Localização incerta · referência regional':active.confidence==='approximate'?'Localização aproximada':'Referência regional'}</small></div>
   {moving&&<div className="atlas-travel" role="status"><span aria-hidden="true">✦</span> Viajando para {active.place.name}…</div>}
  </div>
  {unavailable&&<p className="atlas-render-notice" role="status">Visualização 3D indisponível neste dispositivo. A jornada continua acessível no modo simplificado.</p>}
  {notice&&<p className="journey-map-notice" role="status">{notice}</p>}
  <details ref={guide} className="journey-map-help" id={`${id}-context`}><summary>Guia geográfico desta leitura</summary><p><strong>{currentLabel} · {active.place.name}</strong></p><p>{active.note}</p><p className="atlas-reference">{active.reference}</p><p>O relevo e os percursos são estilizados. Os marcos preservam a região histórica; as bandeiras próximas ao mesmo local são afastadas para facilitar o toque. O plano intercalado pode reunir várias regiões no mesmo dia.</p><ul className="atlas-reading-places">{day.chapters.map(item=>{const location=atlasChapter(item);return <li key={item.id}><strong>{item.book} {item.chapter}</strong><span>{location.place.name}</span><small>{location.note}</small></li>})}</ul></details>
  {gate&&<dialog ref={dialog} className="atlas-book-gate" aria-label="Portão de abertura do livro" onCancel={event=>{event.preventDefault();setGate(false)}}><button type="button" className="atlas-close" autoFocus onClick={()=>setGate(false)} aria-label="Fechar portão">✕</button><span className="atlas-eyebrow">NOVO LIVRO · NOVA DESCOBERTA</span>{openings.map(item=>{const introduction=getBookIntroduction(item.book),location=atlasChapter(item),video=getBibleProjectVideoForChapter(item.book,1);return <article key={item.id}><span className="atlas-gate-icon" aria-hidden="true">▥</span><h2>Portão de {item.book}</h2><p><strong>{location.place.name}</strong></p><p>{location.note}</p><p className="atlas-reference">{location.reference}</p>{introduction&&<><h3>{introduction.theme}</h3><p>{introduction.context}</p></>}<div className="atlas-video-chest"><span className="atlas-chest-icon" aria-hidden="true">✦</span><h3>Baú do Vídeo · BibleProject</h3><p>Conheça o panorama do livro em português. Assistir é opcional; os bônus seguem a validação do aplicativo.</p>{video&&(onVideo?<button type="button" className="secondary-cta" onClick={()=>{setGate(false);onVideo(video,item.book)}}>Assistir ao panorama</button>:<a href={video.url} target="_blank" rel="noopener noreferrer">Abrir panorama oficial ↗</a>)}</div></article>})}<button type="button" className="primary-cta" disabled={!canRead} onClick={()=>{setGate(false);if(canRead)onRead?.()}}>{readLabel??'Começar a leitura'}</button></dialog>}
 </section>;
}
