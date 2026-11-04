import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import type MuxPlayerElement from '@mux/mux-player';
import type {BibleProjectResource} from '../domain/bibleproject';
import {embeddedPlayer} from '../domain/bibleproject-embeds';
import {demoWatchComplete,newDemoWatch,sampleDemoWatch} from '../domain/demo-video-watch';
const MuxPlayer=lazy(()=>import('@mux/mux-player-react'));
const time=(seconds:number)=>`${Math.floor(Math.max(0,seconds)/60)}:${String(Math.floor(Math.max(0,seconds)%60)).padStart(2,'0')}`;
export function DemoPanorama({resource,book,rewarded,onClose,onReward}:{resource:BibleProjectResource;book:string;rewarded:boolean;onClose:()=>void;onReward:()=>void}){
 const frame=useRef<HTMLDivElement>(null),visible=useRef(true);
 const dialog=useRef<HTMLDialogElement>(null),player=useRef<MuxPlayerElement>(null),watch=useRef(newDemoWatch()),seeking=useRef(false),awarded=useRef(rewarded),reward=useRef(onReward);
 const [duration,setDuration]=useState(0),[covered,setCovered]=useState(0),[message,setMessage]=useState('Assista ao vídeo inteiro em 1× para ganhar +5 XP.');
 const source=embeddedPlayer(resource,book),playbackId=source.exact?source.src.split('/').at(-1):undefined;
 reward.current=onReward;
 useEffect(()=>{awarded.current=rewarded},[rewarded]);
 useEffect(()=>{const el=dialog.current,previous=document.activeElement as HTMLElement|null;el?.showModal();return()=>{el?.close();previous?.focus()}},[]);
 useEffect(()=>{
  const hidden=()=>{if(document.visibilityState!=='visible'){player.current?.pause();watch.current={...watch.current,previous:null}}};
  document.addEventListener('visibilitychange',hidden);
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{visible.current=entries[0]?.isIntersecting===true&&entries[0].intersectionRatio>=0.5;if(!visible.current){player.current?.pause();watch.current={...watch.current,previous:null}}},{threshold:[0,.5,1]});
  if(frame.current)observer?.observe(frame.current);
  const interval=window.setInterval(()=>{
   const el=player.current;if(!el)return;
   const eligible=visible.current&&!el.paused&&!seeking.current&&el.readyState>=3&&document.visibilityState==='visible'&&el.playbackRate===1;
   watch.current=sampleDemoWatch(watch.current,{position:el.currentTime,clock:performance.now()},eligible);
   setCovered(watch.current.frontier);if(Number.isFinite(el.duration))setDuration(el.duration);
  },250);
  return()=>{observer?.disconnect();clearInterval(interval);document.removeEventListener('visibilitychange',hidden)};
 },[]);
 const finished=()=>{
  const el=player.current;if(!el)return;
  watch.current=sampleDemoWatch(watch.current,{position:el.currentTime,clock:performance.now()},visible.current&&document.visibilityState==='visible'&&!seeking.current&&el.playbackRate===1);
  setCovered(watch.current.frontier);
  if(demoWatchComplete(watch.current,el.duration,el.ended)&&!awarded.current){awarded.current=true;setMessage('✓ Panorama completo · +5 XP de demonstração');reward.current()}
  else if(!awarded.current)setMessage('Há trechos pendentes. Retome para completar o vídeo.');
 };
 return <dialog ref={dialog} className="demo-panorama-modal" aria-label={`Panorama de ${book}`} onCancel={e=>{e.preventDefault();onClose()}}><header><div><small>BAÚ DO PANORAMA</small><h2>{resource.title}</h2></div><button type="button" autoFocus aria-label="Fechar panorama" onClick={onClose}>✕</button></header><div ref={frame}>{source.exact?<Suspense fallback={<p role="status">Carregando panorama…</p>}><MuxPlayer ref={player} playbackId={playbackId} streamType="on-demand" playsInline disableTracking disableCookies noVolumePref noMutedPref playbackRates={[1]} style={{width:'100%',aspectRatio:'16 / 9',maxHeight:'57dvh'}} aria-label={`Vídeo panorama de ${book}`} onPlaying={()=>{const el=player.current;if(!el)return;if(!visible.current||document.visibilityState!=='visible'){el.pause();return}watch.current=sampleDemoWatch(watch.current,{position:el.currentTime,clock:performance.now()},el.playbackRate===1)}} onSeeking={()=>{seeking.current=true;watch.current={...watch.current,previous:null}}} onSeeked={()=>{seeking.current=false}} onRateChange={()=>{const el=player.current;if(el&&el.playbackRate!==1){el.pause();setMessage('Volte à velocidade 1× para conquistar o bônus.')}}} onEnded={finished} onError={()=>setMessage('Não foi possível reproduzir. Nenhum bônus foi concedido.')}/></Suspense>:<p role="status">Este panorama está indisponível. Você pode continuar a leitura.</p>}</div><div aria-label="Cronômetro do panorama"><strong>⏱ {time(covered)} / {duration?time(duration):'—'}</strong><span> · Restam {duration?time(duration-covered):'—'}</span><progress aria-label="Tempo assistido do panorama" value={covered} max={duration||1} style={{display:'block',width:'100%'}}/></div><p role="status">{rewarded?'✓ Bônus já registrado nesta demonstração':message}</p><footer><button type="button" onClick={onClose}>Guardar e continuar</button>{!rewarded&&<button type="button" onClick={()=>{const el=player.current;if(el){el.currentTime=Math.max(0,watch.current.frontier-0.1);void el.play().catch(()=>setMessage('Toque no player para continuar.'))}}}>Retomar trecho pendente</button>}</footer><small>BibleProject · Progresso local de demonstração; XP real exige validação no servidor. Ao fechar, trechos incompletos precisam ser assistidos novamente.</small></dialog>;
}
