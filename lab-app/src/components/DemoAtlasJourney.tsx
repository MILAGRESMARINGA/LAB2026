import {Component,Suspense,lazy,useCallback,useEffect,useMemo,useState,type CSSProperties,type ReactNode} from 'react';
import {BookOpen,Check,Compass,Flag,Gift,Globe2,Minus,Plus,RotateCcw} from 'lucide-react';
import type {GameDay} from '../domain/game-plan';
import {atlasChapter,atlasPlace,weekWindow} from '../domain/journey-atlas';
import {literaryBlockFor} from '../domain/literary-blocks';
import './demo-atlas.css';
const JourneyScene3D=lazy(()=>import('./JourneyScene3D').then(module=>({default:module.JourneyScene3D})));
type MapPoint={day:number;x:number;y:number};
type MapLabel={id:string;label:string;x:number;y:number};
type Props={stage:number;plan:ReadonlyArray<GameDay>;completedDays:readonly number[];onPreviewStage:(day:number)=>void;onOpenRewards:()=>void};
class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?this.props.fallback:this.props.children}}
/** Regional geographic anchors remain fixed. Same-site readings share one marker. */
export function DemoAtlasJourney({stage,plan,completedDays,onPreviewStage,onOpenRewards}:Props){
 const [projected,setProjected]=useState<ReadonlyArray<MapPoint>>([]);
 const onProject=useCallback((next:ReadonlyArray<MapPoint>)=>setProjected(previous=>previous.length===next.length&&previous.every((p,i)=>p.day===next[i].day&&Math.abs(p.x-next[i].x)<.5&&Math.abs(p.y-next[i].y)<.5)?previous:next),[]);
 const [labels,setLabels]=useState<ReadonlyArray<MapLabel>>([]);
 const onLabels=useCallback((next:ReadonlyArray<MapLabel>)=>setLabels(previous=>previous.length===next.length&&previous.every((p,i)=>p.id===next[i].id&&Math.abs(p.x-next[i].x)<1&&Math.abs(p.y-next[i].y)<1)?previous:next),[]);
 const [view,setView]=useState<'episode'|'world'>('episode'),[zoom,setZoom]=useState(1),[reset,setReset]=useState(0),[unavailable,setUnavailable]=useState(false),[reduced,setReduced]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(media.matches);change();media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 const current=Math.max(1,Math.min(plan.length,stage)),week=weekWindow(plan,current),day=plan[current-1],chapter=day?.old[0]??day?.chapters[0];
 const groups=useMemo(()=>{
  const points=new Map<string,{day:number;days:number[];lon:number;lat:number;name:string;color:string;status:'current'|'completed'|'locked'}>();
  for(const item of week.days){const reading=item.old[0]??item.chapters[0];if(!reading)continue;const anchor=atlasPlace(reading),key=`${anchor.lon}:${anchor.lat}`,existing=points.get(key);
   if(existing){existing.days.push(item.day);if(item.day===current){existing.day=current;existing.status='current'}}
   else points.set(key,{day:item.day,days:[item.day],lon:anchor.lon,lat:anchor.lat,name:anchor.name,color:literaryBlockFor(reading.book)?.color??'#0072B2',status:item.day===current?'current':completedDays.includes(item.day)?'completed':'locked'});
  }return [...points.values()];
 },[plan,week.start,current,completedDays]);
 const nodes=useMemo(()=>groups.map(({day,lon,lat,color,status,name})=>({day,lon,lat,color,status,name})),[groups]);
 if(!chapter)return <section className="demo-atlas-empty" role="status">A jornada está sendo preparada.</section>;
 const location=atlasChapter(chapter),place=atlasPlace(chapter),block=literaryBlockFor(chapter.book),weekNumber=Math.floor(week.start/7)+1;
 const colors={'--atlas-color':block?.color??'#0072B2','--atlas-ink':['poetry','revelation','history','minor-prophets','major-prophets'].includes(block?.id??'')?'#193640':'#fff'} as CSSProperties;
 const fallback=<div className="demo-atlas-fallback" role="status"><Compass size={36}/><strong>{place.name}</strong><span>O mapa 3D está indisponível. Os dias continuam disponíveis abaixo.</span></div>;
 return <section className="demo-atlas" style={colors} aria-label="Jornada no mundo bíblico">
  <header className="demo-atlas-heading"><div><small>SEMANA {weekNumber} · DIA {current}</small><h2>{chapter.book}</h2></div><button type="button" className="demo-atlas-chest" onClick={onOpenRewards}><Gift size={23}/><span>Baús</span></button></header>
  <div className="demo-atlas-map"><div className="demo-atlas-scene">{unavailable?fallback:<SceneBoundary fallback={fallback}><Suspense fallback={<div className="demo-atlas-loading" role="status">Preparando mapa 3D…</div>}><JourneyScene3D nodes={nodes} anchorOnly onProject={onProject} onLabelsProject={onLabels} focus={{lon:place.lon,lat:place.lat}} focusLabel={place.name} viewMode={view} zoom={zoom} resetViewKey={reset} onZoomChange={setZoom} onSelect={()=>{}} reducedMotion={reduced} onUnavailable={()=>setUnavailable(true)}/></Suspense></SceneBoundary>}</div>
   <div className="demo-atlas-tools" aria-label="Controles do mapa"><button type="button" aria-label="Diminuir zoom" disabled={zoom<=.75} onClick={()=>setZoom(z=>Math.max(.75,z-.25))}><Minus size={19}/></button><output aria-label="Zoom do mapa">{Math.round(zoom*100)}%</output><button type="button" aria-label="Aumentar zoom" disabled={zoom>=3} onClick={()=>setZoom(z=>Math.min(3,z+.25))}><Plus size={19}/></button><button type="button" aria-label="Centralizar mapa" onClick={()=>{setZoom(1);setReset(n=>n+1)}}><RotateCcw size={18}/></button><button type="button" aria-pressed={view==='world'} aria-label={view==='world'?'Voltar à etapa':'Ver mundo'} onClick={()=>{setView(v=>v==='world'?'episode':'world');setZoom(1)}}>{view==='world'?<Compass size={21}/>:<Globe2 size={21}/>}<span>{view==='world'?'Etapa':'Mundo'}</span></button></div>
   {view==='world'&&<div className="demo-atlas-labels" aria-hidden="true">{labels.map(label=><span key={label.id} style={{left:label.x,top:label.y}}>{label.label}</span>)}</div>}
   <div className="demo-atlas-anchors" role="group" aria-label="Locais das leituras">{projected.map(point=>{const group=groups.find(item=>item.day===point.day);if(!group)return null;const active=group.days.includes(current),read=group.days.filter(day=>completedDays.includes(day)),target=active?current:read[0],available=target!==undefined;if(!available)return null;return <div className={`demo-atlas-anchor ${active?'is-current':''}`} key={group.day} style={{left:point.x,top:point.y}}><button type="button" className="demo-atlas-pin" disabled={!available} data-geographic-day={group.day} aria-current={active?'location':undefined} aria-label={`${group.name} · dias ${group.days.join(', ')}${active?` · dia ${current}, atual`:''} · ${read.length} leituras concluídas`} onClick={()=>{if(target!==undefined)onPreviewStage(target)}}><Flag size={21} fill="currentColor"/><span>{active?current:group.days[0]}</span></button>{read.length>0&&<small>{read.length} {read.length===1?'lida':'lidas'}</small>}</div>})}</div>
   <div className="demo-atlas-place"><Compass size={17}/><span>{place.name}</span>{location.confidence==='uncertain'&&!place.name.toLowerCase().includes('incerta')&&<small>Localização incerta</small>}</div>
  </div><footer className="demo-atlas-footer"><div className="demo-atlas-days" role="group" aria-label={`Semana ${weekNumber}: dias ${week.start+1} a ${week.start+week.days.length}`}>{week.days.map(item=>{const done=completedDays.includes(item.day),active=item.day===current,available=active||done;return <button type="button" key={item.day} data-week-day={item.day} aria-current={active?'step':undefined} aria-disabled={!available} aria-label={`Dia ${item.day}, ${done?'concluído':active?'atual':'aguarde sua vez'}`} onClick={()=>{if(available)onPreviewStage(item.day)}}>{done?<Check size={14}/>:<BookOpen size={14}/>}<span>{item.day}</span></button>})}</div><div className="demo-atlas-reading"><div><span>{block?.name??'Leitura bíblica'}</span><small>Pontos regionais · sem rota reconstruída</small></div><button type="button" className="demo-primary" onClick={()=>onPreviewStage(current)}><BookOpen size={22}/>Ler agora</button></div></footer>
 </section>;
}
