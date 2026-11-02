import {lazy,Suspense,useCallback,useEffect,useId,useMemo,useRef,useState,type CSSProperties} from 'react';
import {ConsistencyFlame} from './ConsistencyFlame';
import {CHAPTERS} from '../domain/canon';
import type {GameDay} from '../domain/game-plan';
import {storyForChapter,STORY_CONTEXT_NOTICES} from '../domain/journey-stories';
import {useJourneyEditorialContext} from '../features/useJourneyEditorialContext';
import {atlasChapter,atlasPlace,weekWindow} from '../domain/journey-atlas';
import {chapterJourneyContext} from '../domain/journey-geography';
import {literaryBlockFor} from '../domain/literary-blocks';
import {getBookIntroduction} from '../domain/book-introductions';
import {getBibleProjectVideoForChapter,type BibleProjectResource} from '../domain/bibleproject';
const JourneyScene3D=lazy(()=>import('./JourneyScene3D').then(module=>({default:module.JourneyScene3D})));
import './biblical-world-map.css';

type Props={stage:number|null;completedStages:number;chapters:readonly {chapter_id:string}[];plan?:ReadonlyArray<GameDay>;onRead?:()=>void;readingAvailable?:boolean;readLabel?:string;completedMessage?:string;onVideo?:(resource:BibleProjectResource,book:string)=>void;focusBook?:string;focusChapter?:number;initialView?:'world'|'region'|'episode'};
type Projection={day:number;x:number;y:number};
type AtlasStyle=CSSProperties & {'--block-color'?:string;'--journey-color'?:string};
const statusName={current:'Atual',completed:'Concluída',locked:'Bloqueada'} as const;
const fallbackPosition=(index:number,count:number)=>({left:`${50+Math.sin(index*1.18)*23}%`,top:`${14+(count===1?30:index/(count-1)*65)}%`});

export function BiblicalWorldMap({stage,completedStages,chapters,plan,onRead,readingAvailable=true,readLabel,completedMessage,onVideo,focusBook,focusChapter,initialView='world'}:Props){
 const id=useId().replace(/:/g,''),dialog=useRef<HTMLDialogElement>(null),guide=useRef<HTMLDetailsElement>(null);
 const [viewMode,setViewMode]=useState<'world'|'region'|'episode'>(initialView),[zoom,setZoom]=useState(1),[resetViewKey,setResetViewKey]=useState(0);
 const [mapLabels,setMapLabels]=useState<ReadonlyArray<{id:string;label:string;x:number;y:number}>>([]);
 const [notice,setNotice]=useState(''),[gate,setGate]=useState(false),[moving,setMoving]=useState(false),[gateChapterId,setGateChapterId]=useState('');
 const [focusedChapterId,setFocusedChapterId]=useState(''),[projected,setProjected]=useState<ReadonlyArray<Projection>>([]),[unavailable,setUnavailable]=useState(false),[renderMode,setRenderMode]=useState<'webgl'|'software'>('webgl');
 const [reducedMotion,setReducedMotion]=useState(()=>typeof window!=='undefined'&&Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
 const days=useMemo<ReadonlyArray<GameDay>>(()=>plan??[{day:1,old:[],psalms:[],newTestament:[],chapters:chapters.flatMap(item=>{const chapter=CHAPTERS.find(candidate=>candidate.id===item.chapter_id);return chapter?[chapter]:[]})}],[plan,chapters]);
 const current=Math.max(1,Math.min(days.length,stage??1)),day=days[current-1];
 const week=useMemo(()=>weekWindow(days,current),[days,current]);
 const chapter=day?.chapters.find(item=>item.id===focusedChapterId)??day?.chapters.find(item=>item.book===focusBook&&(!focusChapter||item.chapter===focusChapter))??day?.old[0]??day?.chapters[0];
 const active=chapter?atlasChapter(chapter):null;
 const story=chapter?storyForChapter(chapter.book,chapter.chapter):null;
 const {evidence}=useJourneyEditorialContext(chapter);
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
 const openings=useMemo(()=>day?.chapters.filter(item=>item.chapter===1)??[],[day]);
 const gateChapter=openings.find(item=>item.id===gateChapterId)??openings[0];
 const canRead=readingAvailable&&current>completedStages;
 useEffect(()=>{setGate(false);setNotice('');setFocusedChapterId('')},[current,focusBook,focusChapter]);
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
 const handleLabels=useCallback((labels:ReadonlyArray<{id:string;label:string;x:number;y:number}>)=>setMapLabels(previous=>previous.length===labels.length&&previous.every((label,i)=>label.id===labels[i].id&&Math.abs(label.x-labels[i].x)<1&&Math.abs(label.y-labels[i].y)<1)?previous:labels),[]);
 const changeView=(next:'world'|'region'|'episode')=>{setViewMode(next);setZoom(1);setProjected([]);setMapLabels([]);setResetViewKey(v=>v+1)};
 const handleProject=useCallback((points:ReadonlyArray<Projection>)=>setProjected(previous=>previous.length===points.length&&previous.every((point,index)=>point.day===points[index].day&&Math.abs(point.x-points[index].x)<.5&&Math.abs(point.y-points[index].y)<.5)?previous:points),[]);
 const handleTransition=useCallback((value:boolean)=>setMoving(value),[]);
 const handleRenderMode=useCallback((mode:'webgl'|'software')=>setRenderMode(mode),[]);
 const handleUnavailable=useCallback(()=>{setUnavailable(true);setMoving(false);setProjected([])},[]);
 const choose=useCallback((number:number)=>{
  if(moving)return;
  if(number!==current||!canRead){setNotice(number<=completedStages?'Etapa já concluída.':number===current?(completedMessage??'Aguarde a próxima liberação.'):'Esta etapa ainda está bloqueada.');return}
  setNotice('');if(openings.length){setGateChapterId(chapter?.chapter===1?chapter.id:openings[0].id);setGate(true)}else onRead?.();
 },[moving,current,canRead,completedStages,completedMessage,openings,chapter,onRead]);
 if(!day||!chapter||!active||!context)return <section className="journey-world"><p role="status">O plano de leitura ainda não está disponível.</p></section>;
 const currentLabel=`${chapter.book} ${chapter.chapter}`;
 return <section className="journey-world isometric-journey" aria-label="Mapa das etapas da Jornada" aria-busy={moving} data-view-mode={viewMode} style={{'--journey-color':block?.color??'#0072B2'} as AtlasStyle}>
  <header className="journey-world-heading">
   <div className="atlas-heading-copy"><span className="atlas-eyebrow">MUNDO DA BÍBLIA · SEMANA {Math.floor(week.start/7)+1}</span><h2>{viewMode==='world'?'Sua viagem pelo mundo da Bíblia':viewMode==='region'?active.place.name:story?.title??currentLabel}</h2><p>{block?.symbol} {block?.name} <span>· Etapa {current} de {days.length}</span></p></div>
   <button type="button" className="atlas-guide-link" aria-controls={`${id}-context`} onClick={()=>{const element=guide.current;if(element){element.open=true;element.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'})}}}><span aria-hidden="true">▤</span> Guia</button>
  </header>
  <nav className="journey-map-breadcrumb" aria-label="Localização na jornada"><button type="button" aria-current={viewMode==='world'?'location':undefined} onClick={()=>changeView('world')}>Mundo bíblico</button><span aria-hidden="true">›</span><button type="button" aria-current={viewMode==='region'?'location':undefined} onClick={()=>changeView('region')}>{active.place.name}</button><span aria-hidden="true">›</span><span>{story?.title??currentLabel}</span></nav>
  <div className="journey-story-intro"><strong>{story?.person??chapter.book}</strong><span>{story?.period??'Contexto da leitura'} · {currentLabel}</span><p>{story?.summary??active.note}</p></div>
  <div className="atlas-focus-control"><label htmlFor={`${id}-reading`}>Leitura em foco</label><select id={`${id}-reading`} aria-label="Região da leitura" value={chapter.id} onChange={event=>{setFocusedChapterId(event.target.value);setProjected([]);setMapLabels([]);setNotice('')}}>{day.chapters.map(item=><option value={item.id} key={item.id}>{item.book} {item.chapter} · {atlasPlace(item).name}</option>)}</select></div>
  <p className="journey-map-gesture-hint" id={`${id}-map-hint`}>Explore arrastando o mapa. Use + e − para aproximar; no celular, use dois dedos. Minha etapa retorna à leitura atual.</p>
  <div className="atlas-playfield">
  <div className={`atlas-stage atlas-stage-3d${unavailable?' is-fallback':''}`} data-biome={active.place.biome} role="group" aria-label={`Semana atual: etapas ${week.start+1} a ${week.start+week.days.length}`} aria-describedby={`${id}-map-hint`}>
   <div className="journey-camera-tools" role="group" aria-label="Explorar mapa"><button type="button" onClick={()=>setZoom(v=>Math.max(.75,Math.round((v-.25)*100)/100))} disabled={zoom<=.75} aria-label="Diminuir zoom">−</button><output aria-label="Ampliação do mapa">{Math.round(zoom*100)}%</output><button type="button" onClick={()=>setZoom(v=>Math.min(3,Math.round((v+.25)*100)/100))} disabled={zoom>=3} aria-label="Aumentar zoom">+</button><button type="button" onClick={()=>changeView('world')}>Ver o mundo</button><button type="button" onClick={()=>changeView('episode')}>Minha etapa</button></div>
   {!unavailable&&<Suspense fallback={<div className="atlas-scene-loading" role="status">Preparando o mundo bíblico…</div>}><JourneyScene3D viewMode={viewMode} zoom={zoom} resetViewKey={resetViewKey} onZoomChange={setZoom} focusLabel={active.place.name} onLabelsProject={handleLabels} nodes={nodes} focus={focus} onSelect={choose} onProject={handleProject} onTransition={handleTransition} reducedMotion={reducedMotion} onUnavailable={handleUnavailable} onRenderMode={handleRenderMode}/></Suspense>}
   {unavailable&&<div className="atlas-accessible-terrain" aria-hidden="true"><div className="atlas-fallback-river"/><span className="atlas-fallback-label">{active.place.name}</span></div>}
   <div className="journey-map-labels" aria-hidden="true">{mapLabels.map(label=><span key={label.id} style={{left:label.x,top:label.y}}>{label.label}</span>)}</div>
   {viewMode==='episode'&&<div className="atlas-week-controls" aria-label="Bandeiras no mapa">
    {nodes.map((node,index)=>{const projection=projected.find(point=>point.day===node.day);if(!projection&&!unavailable)return null;const style={...(projection&&!unavailable?{left:projection.x,top:projection.y}:fallbackPosition(index,nodes.length)),'--block-color':node.color} as AtlasStyle;const reading=week.days.find(item=>item.day===node.day)!;return <button type="button" key={node.day} data-journey-day={node.day} className={`atlas-day-button is-${node.status}`} style={style} aria-current={node.status==='current'?'step':undefined} aria-disabled={moving||node.day!==current||!canRead} aria-label={`Etapa ${node.day}, ${statusName[node.status]}, ${reading.chapters.map(item=>`${item.book} ${item.chapter}`).join(' · ')}`} onClick={()=>choose(node.day)} title={`${node.name} · ${statusName[node.status]}`}><span className="atlas-day-number">{node.day}</span><span className="atlas-day-status" aria-hidden="true">{node.status==='completed'?'✓':node.status==='current'?'LER':'🔒'}</span>{node.status==='current'&&<span className="atlas-current-tag" aria-hidden="true">VOCÊ ESTÁ AQUI</span>}</button>})}
   </div>}
   {viewMode!=='episode'&&<div className="journey-map-invitation"><span>{viewMode==='world'?'1 · ENTENDA ONDE VOCÊ ESTÁ':'2 · CONHEÇA O CENÁRIO'}</span><h3>{viewMode==='world'?'Uma caminhada pela história bíblica':story?.title}</h3><p>{viewMode==='world'?`Vamos acompanhar ${story?.person??'a leitura'} na região de ${active.place.name}.`:active.note}</p><button type="button" className="primary-cta" disabled={moving} onClick={()=>changeView(viewMode==='world'?'region':'episode')}>{viewMode==='world'?'Continuar caminhada':'Entrar na história'}</button></div>}
   {week.start>0&&<div className="atlas-past-thread" aria-hidden="true"><span>✓</span> {week.start} etapas anteriores</div>}
   <div className="atlas-future-fog" aria-hidden="true"><span>{current===days.length?'Uma jornada inteira na Palavra':'A próxima semana se revela no caminho'}</span></div>
   <div className="atlas-location"><span>{active.kind==='symbolic'?'MARCO SIMBÓLICO':active.kind==='recipient'?'COMUNIDADE DESTINATÁRIA':active.kind==='literary'?'CONTEXTO LITERÁRIO':active.kind==='vision'?'CENÁRIO DA VISÃO':'LOCAL DA NARRATIVA'}</span><strong>{currentLabel}</strong><small>{active.confidence==='uncertain'?'Localização incerta · referência regional':active.confidence==='approximate'?'Localização aproximada':'Referência regional'}</small></div>
   {moving&&<div className="atlas-travel" role="status"><span aria-hidden="true">✦</span> Viajando para {active.place.name}…</div>}
  </div>
  <aside className="atlas-companion-rail" aria-label="Companheiro da jornada"><ConsistencyFlame compact completedDays={completedStages} status={current===days.length&&completedStages>=days.length?'completed':'active'}/><p>Um dia de cada vez.</p><small>Leia a etapa atual e avance na sua jornada pela Palavra.</small></aside>
  </div>
  {viewMode==='episode'&&<p className="journey-week-caption"><strong>Sua semana · etapas {week.start+1}–{week.start+week.days.length}</strong><span>A bandeira indica onde a história acontece. Os números abaixo acompanham os dias do plano.</span></p>}
  {viewMode==='episode'&&<div className="journey-week-strip" role="group" aria-label="Sete etapas da semana">{week.days.map(item=><button type="button" key={item.day} data-week-day={item.day} aria-current={item.day===current?'step':undefined} aria-disabled={moving||item.day!==current||!canRead} className={item.day<=completedStages?'is-completed':item.day===current?'is-current':'is-locked'} aria-label={`Etapa ${item.day}, ${item.day<=completedStages?'Concluída':item.day===current?'Atual':'Bloqueada'}, ${item.chapters.map(c=>`${c.book} ${c.chapter}`).join(' · ')}`} onClick={()=>choose(item.day)}><strong>{item.day}</strong><span>{item.day<=completedStages?'✓':item.day===current?'Ler':'🔒'}</span></button>)}</div>}
  {!unavailable&&renderMode==='software'&&<p className="atlas-render-compatibility">Cena 3D em modo de compatibilidade.</p>}
  {unavailable&&<p className="atlas-render-notice" role="status">Visualização 3D indisponível neste dispositivo. A jornada continua acessível no modo simplificado.</p>}
  {notice&&<p className="journey-map-notice" role="status">{notice}</p>}
  <details ref={guide} className="journey-map-help" id={`${id}-context`}><summary>Guia geográfico desta leitura</summary><p><strong>{currentLabel} · {active.place.name}</strong></p><p>{active.note}</p><p className="atlas-reference">{active.reference}</p><div className="journey-evidence"><h3>Fontes e contexto</h3>{!evidence.length&&<p>Este capítulo tem referência bíblica e contexto regional no atlas. Ainda não há uma ficha adicional de fontes históricas revisadas para ele.</p>}{evidence.map(source=><article key={source.id}><strong>{source.title}</strong><p>{source.claim}</p><small>{source.source.publisher} · </small><small>{source.references.join(' · ')} · {{textual:'Referência textual',corroborated:'Corroboração histórica',approximate:'Aproximado',disputed:'Em debate'}[source.confidence]}</small>{source.caution&&<p className="evidence-caution">{source.caution}</p>}{source.url&&<a href={source.url} target="_blank" rel="noopener noreferrer">Consultar fonte ↗</a>}</article>)}</div><p>{STORY_CONTEXT_NOTICES.intercalated}</p><p>{story?.kind==='prophetic'?STORY_CONTEXT_NOTICES.prophets:STORY_CONTEXT_NOTICES.parallel}</p><p>O relevo e os percursos são estilizados. Os marcos preservam a região histórica; as bandeiras próximas ao mesmo local são afastadas para facilitar o toque. O plano intercalado pode reunir várias regiões no mesmo dia.</p><ul className="atlas-reading-places">{day.chapters.map(item=>{const location=atlasChapter(item);return <li key={item.id}><strong>{item.book} {item.chapter}</strong><span>{location.place.name}</span><small>{location.note}</small></li>})}</ul></details>
  {gate&&<dialog ref={dialog} className="atlas-book-gate" aria-label="Portão de abertura do livro" onCancel={event=>{event.preventDefault();setGate(false)}}><button type="button" className="atlas-close" autoFocus onClick={()=>setGate(false)} aria-label="Fechar portão">✕</button><span className="atlas-eyebrow">NOVO LIVRO · NOVA DESCOBERTA</span>{openings.length>1&&<div className="atlas-gate-books" role="group" aria-label="Livros iniciados nesta etapa">{openings.map(item=><button type="button" key={item.id} aria-pressed={gateChapter?.id===item.id} onClick={()=>setGateChapterId(item.id)}>{item.book}</button>)}</div>}{openings.filter(item=>item.id===gateChapter?.id).map(item=>{const introduction=getBookIntroduction(item.book),location=atlasChapter(item),video=getBibleProjectVideoForChapter(item.book,1);return <article key={item.id}><span className="atlas-gate-icon" aria-hidden="true">▥</span><h2>Portão de {item.book}</h2><p><strong>{location.place.name}</strong></p><p>{location.note}</p><p className="atlas-reference">{location.reference}</p>{introduction&&<><h3>{introduction.theme}</h3><p>{introduction.context}</p></>}<div className="atlas-video-chest"><span className="atlas-chest-icon" aria-hidden="true">✦</span><h3>Baú do Vídeo · BibleProject</h3><p>Conheça o panorama do livro em português. Assistir é opcional; os bônus seguem a validação do aplicativo.</p>{video&&(onVideo?<button type="button" className="secondary-cta" onClick={()=>{setGate(false);onVideo(video,item.book)}}>Assistir ao panorama</button>:<a href={video.url} target="_blank" rel="noopener noreferrer">Abrir panorama oficial ↗</a>)}</div></article>})}<button type="button" className="primary-cta" disabled={!canRead} onClick={()=>{setGate(false);if(canRead)onRead?.()}}>{readLabel??'Começar a leitura'}</button></dialog>}
 </section>;
}
