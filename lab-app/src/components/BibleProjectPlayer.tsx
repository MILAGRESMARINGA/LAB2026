import {lazy,Suspense,useEffect,useRef,useState} from "react";
import type MuxPlayerElement from "@mux/mux-player";
import {formatVideoTime,type VideoWatchState} from "../domain/video-watch";
const MuxPlayer=lazy(()=>import("@mux/mux-player-react"));
// A stale initialization must finish before a new one can rotate the server token.
let beginQueue:Promise<unknown>=Promise.resolve();
import {CheckCircle2,ExternalLink,Expand,Video,X} from "lucide-react";
import {getBibleProjectVideos,type BibleProjectResource} from "../domain/bibleproject";
import {supabase} from "../lib/supabase";

import {embeddedPlayer,videoKeyFromUrl} from "../domain/bibleproject-embeds";
export {embeddedPlayer,videoKeyFromUrl} from "../domain/bibleproject-embeds";
const v2Enabled=import.meta.env.VITE_LAB_V2_READY==="true";
export function BibleProjectPlayer({resource,book,signedIn,onClose,onBonus,runId=null}:{resource:BibleProjectResource;book:string;signedIn:boolean;onClose:()=>void;onBonus:(total:number)=>void;runId?:string|null}){
 const containerRef=useRef<HTMLDivElement>(null);
 const frameRef=useRef<HTMLDivElement>(null);
 const playerRef=useRef<MuxPlayerElement>(null);
 const [session,setSession]=useState<VideoWatchState|null>(null);
 const sessionRef=useRef<VideoWatchState|null>(null);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [answers,setAnswers]=useState<Record<string,number>>({});
 const [feedback,setFeedback]=useState<string[]>([]);
 const sequence=useRef(0);
 const visible=useRef(true);
 const alive=useRef(false);
 const generation=useRef(0);
 const tickPending=useRef(false);
 const seeking=useRef(false);
 const queue=useRef(Promise.resolve());
 const key=videoKeyFromUrl(resource.url);
 const source=embeddedPlayer(resource,book);
 const playbackId=source.exact?source.src.split("/").pop():undefined;
 const publish=(state:VideoWatchState)=>{sessionRef.current=state;setSession(state)};
 const eligibleContext=signedIn&&(!v2Enabled||Boolean(runId));
 // Serialize progress and pause messages: a delayed heartbeat must never arrive after a pause.
 const send=(action:"tick"|"pause"|"ended"|"quiz",position=playerRef.current?.currentTime??0)=>{
  const token=sessionRef.current?.session_id;
  if(!supabase||!eligibleContext||!token||!sessionRef.current?.ready)return Promise.resolve();
  const version=generation.current;
  if((action==="tick"||action==="ended")&&tickPending.current)return queue.current;
  if(action==="tick"||action==="ended")tickPending.current=true;
  const seq=++sequence.current;
  const submittedAnswers=action==="quiz"?{...answers}:null;
  queue.current=queue.current.then(async()=>{
   if(!alive.current||version!==generation.current||token!==sessionRef.current?.session_id)return;
   const {data,error}=await supabase!.rpc("lab_video_watch",{p_video_key:key,p_run:v2Enabled?runId:null,p_action:action,p_position:position,p_sequence:seq,p_answers:submittedAnswers,p_session:token});
   if(!alive.current||version!==generation.current||token!==sessionRef.current?.session_id)return;
   if(error){playerRef.current?.pause();setMessage("Não foi possível validar o progresso. Reabra o panorama para retomar do último trecho salvo.");return}
   const state=data as VideoWatchState;publish(state);
   if(action==="quiz"){
    setFeedback(state.feedback??[]);
    if(state.already_awarded){onBonus(Number(state.total_xp??0));setMessage(state.awarded?"Panorama concluído: +5 XP!":"Este panorama já recebeu XP.")}
   }
  }).catch(()=>{if(alive.current&&version===generation.current)setMessage("Conexão interrompida. Reabra o panorama para retomar.")}).finally(()=>{if((action==="tick"||action==="ended")&&version===generation.current)tickPending.current=false});
  return queue.current;
 };
 useEffect(()=>{
  const version=++generation.current;
  alive.current=true;queue.current=Promise.resolve();tickPending.current=false;playerRef.current?.pause();sessionRef.current=null;setSession(null);sequence.current=0;setAnswers({});setFeedback([]);setMessage("");
  if(eligibleContext&&supabase){
   beginQueue=beginQueue.catch(()=>undefined).then(async()=>{
    if(!alive.current||version!==generation.current)return;
    const {data,error}=await supabase!.rpc("lab_video_watch",{p_video_key:key,p_run:v2Enabled?runId:null,p_action:"state"});
    if(!alive.current||version!==generation.current)return;
    if(error){setMessage("A validação deste panorama está indisponível. Você pode assistir; o XP permanece bloqueado até a validação voltar.");return}
    publish(data as VideoWatchState);
    const player=playerRef.current;
    if(player&&!player.paused)player.currentTime=Math.max(0,Number(data?.next_position??0)-0.1);
   }).catch(()=>{if(alive.current&&version===generation.current)setMessage("Não foi possível iniciar a validação. Reabra o panorama.")});
  }
  return()=>{alive.current=false;generation.current++;sessionRef.current=null};
 },[key,signedIn,runId]);
 useEffect(()=>{
  const stop=()=>{playerRef.current?.pause();void send("pause")};
  const visibility=()=>{if(document.visibilityState!=="visible")stop()};
  const observer=new IntersectionObserver(entries=>{
   visible.current=entries[0]?.isIntersecting===true&&entries[0].intersectionRatio>=0.5;
   if(!visible.current)stop();
  },{threshold:[0,0.5,1]});
  if(frameRef.current)observer.observe(frameRef.current);
  document.addEventListener("visibilitychange",visibility);
  const interval=window.setInterval(()=>{
   const player=playerRef.current;
   if(player?.ended&&visible.current&&document.visibilityState==="visible"&&sessionRef.current?.ready&&!sessionRef.current.playback_complete){void send("ended");return}
   if(!player||player.paused||seeking.current||player.readyState<3||!visible.current||document.visibilityState!=="visible")return;
   if(Math.abs(player.playbackRate-1)>0.001){player.pause();setMessage("Para conquistar XP, retorne à velocidade normal (1×).");void send("pause");return}
   if(sessionRef.current?.duration_seconds&&Math.abs(player.duration-sessionRef.current.duration_seconds)>1){
    player.pause();setMessage("A duração do vídeo mudou. A confirmação de XP aguarda atualização do catálogo.");void send("pause");return;
   }
   void send("tick");
  },2000);
  return()=>{observer.disconnect();document.removeEventListener("visibilitychange",visibility);window.clearInterval(interval)};
 },[key,runId,signedIn]);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const closeButton=containerRef.current?.querySelector<HTMLButtonElement>("button");closeButton?.focus();
  const onKey=(e:KeyboardEvent)=>{
   if(e.key==="Escape")onClose();
   if(e.key==="Tab"){
    const elements=Array.from(containerRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),mux-player,[tabindex="0"]')??[]);
    const first=elements[0],last=elements.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
   }
  };
  document.addEventListener("keydown",onKey);document.body.classList.add("video-modal-open");
  return()=>{document.removeEventListener("keydown",onKey);document.body.classList.remove("video-modal-open");previous?.focus()};
 },[onClose]);
 const finish=async()=>{if(busy)return;setBusy(true);try{await send("quiz")}finally{setBusy(false)}};
 const restore=()=>{const player=playerRef.current;if(player&&session){player.currentTime=Math.max(0,session.next_position-0.5);setMessage("Retome do primeiro trecho pendente. O progresso anterior está preservado.")}};
 return <div className="video-modal-backdrop" role="presentation" onClick={onClose}>
  <section className="video-modal" role="dialog" aria-modal="true" aria-label={"Panorama "+resource.title} ref={containerRef} onClick={e=>e.stopPropagation()}>
   <header className="video-modal-header"><div><span className="eyebrow">PANORAMA DO LIVRO · +5 XP EXTRA</span><h2>{resource.title}</h2></div><button type="button" aria-label="Fechar vídeo" onClick={onClose}><X size={24}/></button></header>
   <div className="video-frame" ref={frameRef}>{source.exact?<Suspense fallback={<p role="status">Carregando panorama…</p>}><MuxPlayer ref={playerRef} playbackId={playbackId} streamType="on-demand" playsInline disableTracking disableCookies noVolumePref noMutedPref playbackRates={[1]} metadata={{video_title:resource.title}} aria-label={"BibleProject: "+resource.title}
    onPlaying={()=>{if(document.visibilityState!=="visible"||!visible.current){playerRef.current?.pause();return}const player=playerRef.current;const frontier=sessionRef.current?.next_position;
     if(player&&frontier!==undefined&&player.currentTime>frontier+0.15)player.currentTime=Math.max(0,frontier-0.1);
     void send("tick")}}
    onPause={()=>{if(!playerRef.current?.ended)void send("pause")}} onWaiting={()=>{void send("pause")}} onSeeking={()=>{seeking.current=true;void send("pause")}} onSeeked={()=>{seeking.current=false;void send("tick")}}
    onRateChange={()=>{if(playerRef.current&&playerRef.current.playbackRate!==1){playerRef.current.pause();void send("pause");setMessage("Para conquistar XP, retorne à velocidade normal (1×).")}}}
    onEnded={()=>{void send("ended")}} onError={()=>setMessage("Não foi possível reproduzir o panorama. Tente novamente; nenhum XP foi concedido.")}/></Suspense>:<div role="alert"><Video size={25}/><p>Vídeo indisponível neste momento.</p></div>}</div>
   <div className="video-controls">{source.exact&&<button type="button" className="secondary-cta" onClick={()=>{void containerRef.current?.requestFullscreen?.().catch(()=>setMessage("Utilize a opção de tela cheia do player."))}}><Expand size={17}/> TELA CHEIA</button>}<a href={resource.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Fonte original</a></div>
   <p className="video-credit"><strong>BibleProject</strong> é o autor e proprietário deste conteúdo. Mais recursos em <a href="https://bibleproject.com" target="_blank" rel="noopener noreferrer">bibleproject.com</a>. O vídeo não substitui os capítulos da leitura anual.</p>
   {!signedIn?<p className="video-status">Entre na sua conta para conquistar XP extra pelos vídeos.</p>:v2Enabled&&!runId?<p className="video-status">Ative sua Jornada V2 para conquistar XP pelos vídeos.</p>:session?.already_awarded?<p className="video-success"><CheckCircle2 size={20}/> +5 XP já registrado para este panorama.</p>:<div className="video-reward">
    {session?.ready?<><p>Duração: <strong>{formatVideoTime(session.duration_seconds)}</strong> · Tempo validado: <strong>{formatVideoTime(session.covered_seconds)}</strong> · Restante: <strong>{formatVideoTime(Math.max(0,session.duration_seconds-session.covered_seconds))}</strong></p>
    <progress aria-label="Progresso validado do panorama" max={session.duration_seconds} value={session.covered_seconds}/>
    <p>Assista em velocidade normal (1×). Pausas e saídas da tela preservam seu progresso. Avançar não conclui os trechos pulados. Depois, responda duas perguntas para conquistar +5 XP.</p>
    {!session.playback_complete&&<button type="button" className="secondary-cta" onClick={restore}>RETOMAR TRECHO PENDENTE</button>}
    {session.playback_complete&&session.questions?.length===2&&<form onSubmit={e=>{e.preventDefault();void finish()}} aria-label="Compreensão do panorama"><h3>Vamos recordar o panorama?</h3>{session.questions.map(question=><fieldset key={question.id} disabled={busy}><legend>{question.prompt}</legend>{question.options.map((option,index)=><label className="video-quiz-option" key={index}><input type="radio" name={String(question.id)} value={index} required checked={answers[question.id]===index} onChange={()=>setAnswers(prev=>({...prev,[question.id]:index}))}/>{option}</label>)}</fieldset>)}<button type="submit" className="primary-cta" disabled={busy||session.questions.some(q=>answers[q.id]===undefined)}>{busy?"CONFERINDO…":"CONFIRMAR COMPREENSÃO · +5 XP"}</button></form>}
    {feedback.length>0&&<div role="status">{feedback.map((item,index)=><p key={index}>{item}</p>)}</div>}</>:<p>{session?"A preparação da avaliação deste panorama ainda não foi concluída.":"Carregando validação do panorama."} Você pode assistir normalmente; o bônus aguarda a validação do conteúdo.</p>}
   </div>}
   {message&&<p role="status" className="feedback-message">{message}</p>}
  </section>
 </div>;
}
