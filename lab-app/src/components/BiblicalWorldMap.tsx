import {lazy,Suspense,useCallback,useEffect,useId,useMemo,useRef,useState,type CSSProperties} from 'react';
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

export function BiblicalWorldMap({stage,completedStages,chapters,plan,onRead,readingAvailable=true,readLabel,completedMessage,onVideo,focusBook,focusChapter,initialView='episode'}:Props){
 const id=useId().replace(/:/g,''),dialog=useRef<HTMLDialogElement>(null),guide=useRef<HTMLDialogElement>(null);
 const [viewMode,setViewMode]=useState<'world'|'region'|'episode'>(initialView),[zoom,setZoom]=useState(1),[resetViewKey,setResetViewKey]=useState(0);
 const [mapLabels,setMapLabels]=useState<ReadonlyArray<{id:string;label:string;x:number;y:number}>>([]);
 const [guideOpened,setGuideOpened]=useState(false),[tutorial,setTutorial]=useState(()=>{try{return sessionStorage.getItem('lab-journey-map-tip')!=='done'}catch{return true}});
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
 useEffect(()=>{
  if(!guideOpened)return;
  const element=guide.current,previous=document.activeElement as HTMLElement|null;if(!element)return;
  element.showModal();const previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{element.close();document.body.style.overflow=previousOverflow;if(previous?.isConnected)previous.focus()};
 },[guideOpened]);
 const dismissTutorial=()=>{setTutorial(false);try{sessionStorage.setItem('lab-journey-map-tip','done')}catch{/* Optional hint only. */}};
 const handleLabels=useCallback((labels:ReadonlyArray<{id:string;label:string;x:number;y:number}>)=>setMapLabels(previous=>previous.length===labels.length&&previous.every((label,i)=>label.id===labels[i].id&&Math.abs(label.x-labels[i].x)<1&&Math.abs(label.y-labels[i].y)<1)?previous:labels),[]);
 const changeView=(next:'world'|'region'|'episode')=>{setViewMode(next);setZoom(1);setProjected([]);setMapLabels([]);setResetViewKey(v=>v+1)};
 const handleProject=useCallback((points:ReadonlyArray<Projection>)=>setProjected(previous=>previous.length===points.length&&previous.every((point,index)=>point.day===points[index].day&&Math.abs(point.x-points[index].x)<.5&&Math.abs(point.y-points[index].y)<.5)?previous:points),[]);
 const handleTransition=useCallback((value:boolean)=>setMoving(value),[]);
 const handleRenderMode=useCallback((mode:'webgl'|'software')=>setRenderMode(mode),[]);
 const handleUnavailable=useCallback(()=>{setUnavailable(true);setMoving(false);setProjected([])},[]);
 const choose=useCallback((number:number)=>{
  if(moving)return;
  if(number!==current||!canRead){setNotice(number<=completedStages?'Etapa já concluída.':number===current?(completedMessage??'Aguarde a próxima liberação.'):'Esta etapa ainda está bloqueada.');return}
  setNotice('');setTutorial(false);try{sessionStorage.setItem('lab-journey-map-tip','done')}catch{/* Optional hint only. */}onRead?.();
 },[moving,current,canRead,completedStages,completedMessage,openings,chapter,onRead]);
 if(!day||!chapter||!active||!context)return <section className="journey-world"><p role="status">O plano de leitura ainda não está disponível.</p></section>;
 const currentLabel=`${chapter.book} ${chapter.chapter}`;
 return <section className="journey-world isometric-journey visual-journey" aria-label="Mapa das etapas da Jornada" aria-busy={moving} data-view-mode={viewMode} style={{'--journey-color':block?.color??'#0072B2'} as AtlasStyle}>
  <header className="journey-world-heading">
   <div className="atlas-heading-copy"><span className="atlas-eyebrow">ETAPA {current} / {days.length}</span><h2>{viewMode==='world'?'Mundo bíblico':viewMode==='region'?active.place.name:currentLabel}</h2></div>
   <button type="button" className="atlas-guide-link" aria-label="Abrir guia da leitura" aria-haspopup="dialog" onClick={()=>setGuideOpened(true)}><span aria-hidden="true">ⓘ</span></button>
  </header>
  <div className="atlas-playfield">
  <div className={`atlas-stage atlas-stage-3d${unavailable?' is-fallback':''}`} data-biome={active.place.biome} role="group" aria-label={`Semana atual: etapas ${week.start+1} a ${week.start+week.days.length}`}>
   <div className="journey-camera-tools" role="group" aria-label="Explorar mapa"><button type="button" onClick={()=>setZoom(v=>Math.max(.75,Math.round((v-.25)*100)/100))} disabled={zoom<=.75} aria-label="Diminuir zoom">−</button><output aria-label="Ampliação do mapa">{Math.round(zoom*100)}%</output><button type="button" onClick={()=>setZoom(v=>Math.min(3,Math.round((v+.25)*100)/100))} disabled={zoom>=3} aria-label="Aumentar zoom">+</button><button type="button" onClick={()=>changeView('world')} aria-label="Ver o mundo" title="Ver o mundo"><span aria-hidden="true">◎</span></button><button type="button" onClick={()=>changeView('episode')} aria-label="Minha etapa" title="Minha etapa"><span aria-hidden="true">⚑</span></button></div>
   {!unavailable&&<Suspense fallback={<div className="atlas-scene-loading" role="status">Preparando o mundo bíblico…</div>}><JourneyScene3D viewMode={viewMode} zoom={zoom} resetViewKey={resetViewKey} onZoomChange={setZoom} focusLabel={active.place.name} onLabelsProject={handleLabels} nodes={nodes} focus={focus} onSelect={choose} onProject={handleProject} onTransition={handleTransition} reducedMotion={reducedMotion} onUnavailable={handleUnavailable} onRenderMode={handleRenderMode}/></Suspense>}
   {unavailable&&<div className="atlas-accessible-terrain" aria-hidden="true"><div className="atlas-fallback-river"/><span className="atlas-fallback-label">{active.place.name}</span></div>}
   <div className="journey-map-labels" aria-hidden="true">{mapLabels.map(label=><span key={label.id} style={{left:label.x,top:label.y}}>{label.label}</span>)}</div>
   {viewMode==='episode'&&<div className="atlas-week-controls" aria-label="Bandeiras no mapa">
    {nodes.map((node,index)=>{const projection=projected.find(point=>point.day===node.day);if(!projection&&!unavailable)return null;const style={...(projection&&!unavailable?{left:projection.x,top:projection.y}:fallbackPosition(index,nodes.length)),'--block-color':node.color} as AtlasStyle;const reading=week.days.find(item=>item.day===node.day)!;return <button type="button" key={node.day} data-journey-day={node.day} className={`atlas-day-button is-${node.status}`} style={style} aria-current={node.status==='current'?'step':undefined} aria-disabled={moving||node.day!==current||!canRead} aria-label={`Etapa ${node.day}, ${statusName[node.status]}, ${reading.chapters.map(item=>`${item.book} ${item.chapter}`).join(' · ')}`} onClick={()=>choose(node.day)} title={`${node.name} · ${statusName[node.status]}`}><span className="atlas-day-number">{node.day}</span><span className="atlas-day-status" aria-hidden="true">{node.status==='completed'?'✓':node.status==='current'?'LER':'🔒'}</span>{node.status==='current'&&<span className="atlas-current-tag" aria-hidden="true">VOCÊ ESTÁ AQUI</span>}</button>})}
   </div>}
   {viewMode!=='episode'&&<div className="journey-map-invitation"><h3>{active.place.name}</h3><button type="button" className="primary-cta" disabled={moving} onClick={()=>changeView('episode')}>Minha etapa →</button></div>}
   {viewMode==='episode'&&tutorial&&<div className="journey-first-tip" role="status"><span aria-hidden="true">☝</span><span>Toque na bandeira para ler</span><button type="button" aria-label="Dispensar dica" onClick={dismissTutorial}>✕</button></div>}
  {viewMode==='episode'&&<div className="journey-week-strip" role="group" aria-label="Sete etapas da semana">{week.days.map(item=><button type="button" key={item.day} data-week-day={item.day} aria-current={item.day===current?'step':undefined} aria-disabled={moving||item.day!==current||!canRead} className={item.day<=completedStages?'is-completed':item.day===current?'is-current':'is-locked'} aria-label={`Etapa ${item.day}, ${item.day<=completedStages?'Concluída':item.day===current?'Atual':'Bloqueada'}, ${item.chapters.map(c=>`${c.book} ${c.chapter}`).join(' · ')}`} onClick={()=>choose(item.day)}><strong>{item.day}</strong><span>{item.day<=completedStages?'✓':item.day===current?'Ler':'🔒'}</span></button>)}</div>}
   {moving&&<div className="atlas-travel" role="status"><span aria-hidden="true">✦</span> Viajando para {active.place.name}…</div>}
  </div>
  </div>
  {!unavailable&&renderMode==='software'&&<span className="journey-render-icon" title="Modo de compatibilidade" aria-label="Cena 3D em modo de compatibilidade">◈</span>}
  {unavailable&&<span className="journey-render-icon" title="Mapa simplificado" aria-label="Visualização 3D indisponível. Modo simplificado ativo.">◈</span>}
  {notice&&<p className="journey-map-notice" role="status">{notice}</p>}
  {guideOpened&&<dialog ref={guide} className="atlas-book-gate journey-guide-dialog" aria-label="Guia da leitura" onCancel={event=>{event.preventDefault();setGuideOpened(false)}}><button type="button" className="atlas-close" autoFocus aria-label="Fechar guia" onClick={()=>setGuideOpened(false)}>✕</button><h2>Guia da leitura</h2><div className="journey-story-intro"><strong>{story?.title??currentLabel}</strong><p>{story?.summary??active.note}</p></div><div className="atlas-focus-control"><label htmlFor={`${id}-reading`}>Leitura em foco</label><select id={`${id}-reading`} aria-label="Região da leitura" value={chapter.id} onChange={event=>{setFocusedChapterId(event.target.value);setProjected([]);setMapLabels([]);setNotice('')}}>{day.chapters.map(item=><option value={item.id} key={item.id}>{item.book} {item.chapter} · {atlasPlace(item).name}</option>)}</select></div><p>Arraste para explorar. Use + e − para aproximar ou dois dedos no celular.</p>{openings.length>0&&<button type="button" className="secondary-cta" onClick={()=>{setGuideOpened(false);setGateChapterId(chapter.chapter===1?chapter.id:openings[0].id);setGate(true)}}>Conhecer o livro</button>}<p><strong>{currentLabel} · {active.place.name}</strong></p><p>{active.note}</p><p className="atlas-reference">{active.reference}</p><div className="journey-evidence"><h3>Fontes e contexto</h3>{!evidence.length&&<p>Este capítulo tem referência bíblica e contexto regional no atlas. Ainda não há uma ficha adicional de fontes históricas revisadas para ele.</p>}{evidence.map(source=><article key={source.id}><strong>{source.title}</strong><p>{source.claim}</p><small>{source.source.publisher} · </small><small>{source.references.join(' · ')} · {{textual:'Referência textual',corroborated:'Corroboração histórica',approximate:'Aproximado',disputed:'Em debate'}[source.confidence]}</small>{source.caution&&<p className="evidence-caution">{source.caution}</p>}{source.url&&<a href={source.url} target="_blank" rel="noopener noreferrer">Consultar fonte ↗</a>}</article>)}</div><p>{STORY_CONTEXT_NOTICES.intercalated}</p><p>{story?.kind==='prophetic'?STORY_CONTEXT_NOTICES.prophets:STORY_CONTEXT_NOTICES.parallel}</p><p>O relevo e os percursos são estilizados. Os marcos preservam a região histórica; as bandeiras próximas ao mesmo local são afastadas para facilitar o toque. O plano intercalado pode reunir várias regiões no mesmo dia.</p><ul className="atlas-reading-places">{day.chapters.map(item=>{const location=atlasChapter(item);return <li key={item.id}><strong>{item.book} {item.chapter}</strong><span>{location.place.name}</span><small>{location.note}</small></li>})}</ul></dialog>}
  {gate&&<dialog ref={dialog} className="atlas-book-gate" aria-label="Portão de abertura do livro" onCancel={event=>{event.preventDefault();setGate(false)}}><button type="button" className="atlas-close" autoFocus onClick={()=>setGate(false)} aria-label="Fechar portão">✕</button><span className="atlas-eyebrow">NOVO LIVRO · NOVA DESCOBERTA</span>{openings.length>1&&<div className="atlas-gate-books" role="group" aria-label="Livros iniciados nesta etapa">{openings.map(item=><button type="button" key={item.id} aria-pressed={gateChapter?.id===item.id} onClick={()=>setGateChapterId(item.id)}>{item.book}</button>)}</div>}{openings.filter(item=>item.id===gateChapter?.id).map(item=>{const introduction=getBookIntroduction(item.book),location=atlasChapter(item),video=getBibleProjectVideoForChapter(item.book,1);return <article key={item.id}><span className="atlas-gate-icon" aria-hidden="true">▥</span><h2>Portão de {item.book}</h2><p><strong>{location.place.name}</strong></p><p>{location.note}</p><p className="atlas-reference">{location.reference}</p>{introduction&&<><h3>{introduction.theme}</h3><p>{introduction.context}</p></>}<div className="atlas-video-chest"><span className="atlas-chest-icon" aria-hidden="true">✦</span><h3>Baú do Vídeo · BibleProject</h3><p>Conheça o panorama do livro em português. Assistir é opcional; os bônus seguem a validação do aplicativo.</p>{video&&(onVideo?<button type="button" className="secondary-cta" onClick={()=>{setGate(false);onVideo(video,item.book)}}>Assistir ao panorama</button>:<a href={video.url} target="_blank" rel="noopener noreferrer">Abrir panorama oficial ↗</a>)}</div></article>})}<button type="button" className="primary-cta" disabled={!canRead} onClick={()=>{setGate(false);if(canRead)onRead?.()}}>{readLabel??'Começar a leitura'}</button></dialog>}
 </section>;
}
