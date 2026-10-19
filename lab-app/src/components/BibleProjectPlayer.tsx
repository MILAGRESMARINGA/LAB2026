import {lazy,Suspense,useEffect,useRef,useState} from "react";
import type MuxPlayerElement from "@mux/mux-player";
import {formatVideoTime,type VideoWatchState} from "../domain/video-watch";
const MuxPlayer=lazy(()=>import("@mux/mux-player-react"));
// A stale initialization must finish before a new one can rotate the server token.
let beginQueue:Promise<unknown>=Promise.resolve();
import {CheckCircle2,ExternalLink,Expand,Video,X} from "lucide-react";
import {getBibleProjectVideos,type BibleProjectResource} from "../domain/bibleproject";
import {supabase} from "../lib/supabase";

const OFFICIAL_MUX_PLAYBACK_IDS:Readonly<Record<string,string>>={
 "guides:cantico-dos-canticos":"ZvNchtwxRkdAMxwsp01h4eRy6fizLZdvmiXMiHgCXZ4o",
 "videos:isaias-40-66":"QfhSLvjSJLTSkNnrj3yenAZnPfoe4siN01FeOH8WRIPU",
 "videos:lamentacoes":"iZCyGZtkfR02cclLSc6V2dXwu5CynVp3GwVEZ02AlhrsY",
 "videos:ezequiel-1-33":"KOH1M0201CKgxQ28nUnJpHzzLJFswch202WNFyu02Cbh6wk",
 "videos:ezequiel-34-48":"QUUGI29UVzj008MGe3uE3Fr33bHVeyqD5BEg01s1KsNw8",
 "videos:daniel":"Oq2auxf5WGMhkVAF01L5cKsgQkBS1v00PK01ptrP3X02uw00",
 "videos:oseias":"LMHIbw01XYDidh401AVLD2005Ylt5ocp6xcUJKFlv7W7UY",
 "videos:joel":"TRxY1it9PYtn4029XOvmawOB3YtlH9cQl7e5AowkPUEo",
 "videos:amos":"m4bchG7jxDHZL00W7TA8Tp2e8xmB02ZPJ3t6vwLt36FKE",
 "videos:obadias":"vhlg6S39CNGRArQMIkAnSSwk02uVy6WbuIDrluqpUWc8",
 "videos:jonas":"9EGLfN9wzz5mY4ISDJtAlD01hFp1mzSGf3hHj022wSF8k",
 "videos:miqueias":"3ZpEpFW0201HumzM5pBLohbTSwTWJBYTyDQUCrGj7fk8g",
 "videos:naum":"AIK83mmhV5g5MmpqfF1Q01iIiE9kYVYK6015uHK00scYX8",
 "videos:habacuque":"500wsTwg6p002HnLQOpRW01whp2rfEmJapnYibDsgeNwFY",
 "guides:sofonias":"BbWQ2GIv5bJe6z2oiQHCtUptrjMjD00P402EaDDfq028m8",
 "videos:ageu":"T17kctYKTrOG3RUFLgTuuV7b00hoLeSASMGqqpFvGN01U",
 "videos:zacarias":"a201ZAEmq5goV5NsA4IH5X6gvpYuTj6Ryq8WtgYzZ6N4",
 "videos:malaquias":"PWmo45IwxvOgTtFjsuPphFrbh1S77OvyFei9QaTUGbA",
 "videos:genesis-1-11":"dL4xWvlgZunv3bVvblYdj1002DbGMTM14eCvGpxL5NXA",
 "videos:genesis-12-50":"3nR8ZhegiUvhpCQiRPg4jOuSu6QmzmEyCC1tOmoIjgw",
 "videos:exodo-1-18":"2msblVtBK6Q1xphHFhowuvjF01WG1UxugU302xPfHjmOc",
 "videos:exodo-19-40":"k401xqmLtzT1g3IM00nFXdPc8Gq0100G7bPK1gksfmotcoc",
 "videos:levitico":"LaqEdztMuaTR00bLK00WKNi02kBNWrDsH00gcYjg028vvJ7M",
 "videos:numeros":"H9KDY6rN2KJzvfeqTY3qoiYaGHTxKIyn2b5EjKE1ZPI",
 "videos:deuteronomio":"I1hQqAYcwFrPLMoACPVNpAqHUlgJIL9mXsoUC01wtD400",
 "videos:josue":"FvZ3Tu9y8qcjeI8pAu3T2dVcCrT7A4MdoB9K4p92dLs",
 "videos:juizes":"g01EeMoXS8M19UAtL7xN1GmhRmfuQdO01SZ958C5bGDzA",
 "videos:rute":"Sd5ZhNVYjVwaCl2UgGm01q01jyYHg02BTvVkqDjrTDl87Q",
 "videos:1samuel":"yLxjge9GMTFb01wnqz201ZmnYHPbUcLCVySqVyVr6E00pY",
 "videos:2samuel":"F601qBB24M015oPSYyXy102Wcv1pAnGQgsu74eXV6UPSBs",
 "videos:1-e-2reis":"JcWMfno5T8lapSdSQq99Z78qp6biZruWkqeDfVezQOc",
 "videos:1-e-2cronicas":"jKLHX1Zkqn02Cgb3o021tpxkoe802FcQX7Fe00ILMOlUxag",
 "videos:esdras-neemias":"011sp3lLzofncBOluQaFl8eUh1jeZtklGeGMx004A2Psk",
 "videos:ester":"bIWsLSQ7jAid3PrygN8JsjtjZq99SaT501C23eDoOWw8",
 "videos:jo-2":"R5gSw1KtDmRGBE00AQYe3l3e4BKjHr00xYH3V7wisnn02I",
 "videos:proverbios-2":"HA1juUpRw01JlYHgmBBzWcjrS00Eyo4xyU41TMhf02ka7I",
 "videos:eclesiastes-2":"PC0201KNmudzahgtw01hGdE7a3rdSPLdN3S3sI7ud102CwA",
 "videos:isaias-1-39":"x302thP5LdGKGZUXeMaintnKnNztjjVxT9idjsotH3uc",
 "videos:jeremias":"3ceqGaBTq7r5DNblE01019mQOV3Rj7ypc3JN5uJj59Zus",
 "videos:joao-1-12":"6Jv9irM02dGz7GMMZNNcqjfmzmXZBiH78BmASX3pzhqs",
 "videos:joao-13-21":"UEnjYRzfjKhaFvkq948Ckssn01buvkwk1mLKXBYdyUaE",
 "videos:mateus-1-13":"nfYNd800BhBFWohsDw00LfoAz4f021EjnzmU5E02Y7VMoEU",
 "videos:mateus-14-28":"bK7g4dG1WnZcl02pEPcb02br3H8S1xiSstDdLRrqgZ02KE",
 "videos:marcos-2":"CRMK021k00QXKBKV4s1ExWhLJKN8uaLBu24FgP2vzY5CE",
 "videos:lucas-1-9":"PWk9pxAM2NhklJKJomFac52fgNJuRMONul01KxM5RXcI",
 "videos:lucas-10-24":"ipWkLjl5oGmG19xEcVbrupDMvgIlz43d2ORlxwsf6Xc",
 "videos:atos-1-12":"rWSJyUjSiv5s00MavFUlRqqEZulMq802L2hLSVkI7SchU",
 "videos:atos-13-28":"Utitpuot2bNP02dXpd6N7c2InESXk01NARvOEKQQyn7aY",
 "videos:romanos-1-4":"2hGAOu44gIuAOe2z8kqXZhYTK1YUqx82IiYuyMq4KBM",
 "videos:romanos-5-16":"qZ5Mg1DuchbtbAcPep1A602uvYPlbM1v2F01ZlQ7Ai55g",
 "videos:1corintios":"AtYnAO01XUFOFrAaqkORbxv3OCAxW6vdLAaLSaqgewNA",
 "videos:2corintios":"nIdmJHKx6f8IVFHpKnQop02E7kyPA9tEZ4hdwrMi7w8c",
 "videos:galatas":"oLjxjLIkZpSbJJ9WJcdhs39clc02nEOpwNtiffe8p0038",
 "videos:efesios":"EuMR02UspOSJHfbOY43OfJI8qk4wjlJhmt1KIHztJDcU",
 "videos:filipenses":"6hlPcqnFt7E02QWG6TAiJ2M9IvV6vzv2VZW6gb1AfopQ",
 "videos:colossenses":"hMz3Wx97IovrTutPF3OqLqzIZfwplS5DlIhoGi9eadA",
 "videos:1tessalonicenses":"o02ToAoND02VLhYwCvG1O02MpCKN502CLJcpD22tGz2pR7Y",
 "videos:2tessalonicenses":"Q65fnMLb1Uyz7PWk01VQVlyEds5IFWKmCYvAMpMNAcVg",
 "videos:1timoteo":"u800xuNT7mqErGQdH3gU26DJBcHgOmF8OLP00uDcu01HIw",
 "videos:2timoteo":"YPntXEQqKujGMS02pFmfN6Q18r29iow5jwpLB2PrUpCs",
 "videos:tito":"VwkCMdh6DlZl02vmv02wtbzYBQkS4UQuqABHoRgjZv2ug",
 "guides:1-3-joao":"AqUl2T01yD2bH2I9P8yuQZ4EC14SRMmMe01LzA24y5bhE",
 "videos:filemom":"a3lwrpVU01GSECxh9rhATXLe5m8rTVAk011Js01vdW4T9M",
 "videos:hebreus":"cspbnTdGU7A9Y1oY1KphzyZtndjKtpIu2022FPQVq7GI",
 "videos:tiago":"mz025eqzhDIv63JVb7HKkEpa3BYCR8gIp1018FkcEg8WQ",
 "videos:1pedro":"1za5vooWRn17hqXiBeownSito1ecWb01LvhFfoPGIZqY",
 "videos:2pedro":"l9xZsV2eK5nkD8vkAhuvDT4sPIPTNtnwmU02O8wNeNyA",
 "guides:judas":"nlXju3pDdAwSxzcCKF2Mew007Z2qXCvdn02xqSjTk4oKY",
 "videos:apocalipse-12-22":"WaVo01zoFRLZr005yk001qCOjbM9juOtJjk2BeKyaNG016s",
  "videos:salmos":"FlTguobiqO4NInc005m6CA4H3cDTkdm7uyqB2ZT4fc3Q",
 "videos:apocalipse-1-11":"bUN4JzBxt601knsms5I0201NA46LUH8DxAdHUyaxwdBbxc"
};
export function videoKeyFromUrl(url:string):string{
 const u=new URL(url);
 if(u.protocol!=="https:"||u.hostname!=="bibleproject.com")throw Error("Fonte de vídeo inválida");
 const parts=u.pathname.split("/").filter(Boolean);
 if(parts.length!==3||parts[0]!=="pt-br"||!["videos","guides"].includes(parts[1]))throw Error("Caminho de vídeo inválido");
 return parts.slice(-2).join(":");
}
export function embeddedPlayer(resource:BibleProjectResource,book:string):{src:string;exact:true}|{src:null;exact:false}{
 const matchesBook=getBibleProjectVideos(book).some(item=>item.url===resource.url);
 if(!matchesBook)return {src:null,exact:false};
 const key=videoKeyFromUrl(resource.url);
 const playback=OFFICIAL_MUX_PLAYBACK_IDS[key];
 if(playback)return {src:"https://player.mux.com/"+playback,exact:true};
 // Never display the first New Testament playlist item (often Matthew)
 // as if it were a verified video for the requested book.
 return {src:null,exact:false};
}
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
