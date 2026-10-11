import {useEffect,useRef,useState} from "react";
import {CheckCircle2,ExternalLink,Expand,Video,X} from "lucide-react";
import type {BibleProjectResource} from "../domain/bibleproject";
import {getBibleProjectPlaylist} from "../domain/bibleproject";
import {supabase} from "../lib/supabase";

const OFFICIAL_MUX_PLAYBACK_IDS:Readonly<Record<string,string>>={
 "videos:genesis-1-11":"dL4xWvlgZunv3bVvblYdj1002DbGMTM14eCvGpxL5NXA",
 "videos:genesis-12-50":"3nR8ZhegiUvhpCQiRPg4jOuSu6QmzmEyCC1tOmoIjgw",
 "videos:joao-1-12":"6Jv9irM02dGz7GMMZNNcqjfmzmXZBiH78BmASX3pzhqs",
 "videos:joao-13-21":"UEnjYRzfjKhaFvkq948Ckssn01buvkwk1mLKXBYdyUaE",
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
export function embeddedPlayer(resource:BibleProjectResource,book:string):{src:string;exact:boolean}{
 const key=videoKeyFromUrl(resource.url);
 const playback=OFFICIAL_MUX_PLAYBACK_IDS[key];
 if(playback)return {src:"https://player.mux.com/"+playback,exact:true};
 const playlist=getBibleProjectPlaylist(book);
 if(!playlist)throw Error("Playlist não disponível");
 const listId=new URL(playlist).searchParams.get("list");
 if(!listId||!/^[a-zA-Z0-9_-]+$/.test(listId))throw Error("Playlist inválida");
 return {src:"https://www.youtube-nocookie.com/embed/videoseries?list="+listId,exact:false};
}
type VideoState={eligible_at:string;already_awarded:boolean};
export function BibleProjectPlayer({resource,book,signedIn,onClose,onBonus}:{resource:BibleProjectResource;book:string;signedIn:boolean;onClose:()=>void;onBonus:(total:number)=>void}){
 const containerRef=useRef<HTMLDivElement>(null);
 const [timer,setTimer]=useState(0);
 const [session,setSession]=useState<VideoState|null>(null);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [claimed,setClaimed]=useState(false);
 const key=videoKeyFromUrl(resource.url);
 const source=embeddedPlayer(resource,book);
 useEffect(()=>{
  const interval=setInterval(()=>setTimer(x=>x+1),1000);
  return()=>clearInterval(interval);
 },[]);
 useEffect(()=>{
  if(!signedIn||!supabase)return;
  let active=true;
  void supabase.rpc("lab_game_video_begin",{p_video_key:key}).then(({data,error})=>{
   if(!active)return;
   if(error)setMessage(error.message);
   else{setSession(data as VideoState);setClaimed(Boolean(data?.already_awarded))}
  });
  return()=>{active=false};
 },[key,signedIn]);
 useEffect(()=>{
  const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose()};
  document.addEventListener("keydown",onKey);document.body.classList.add("video-modal-open");
  return()=>{document.removeEventListener("keydown",onKey);document.body.classList.remove("video-modal-open")};
 },[onClose]);
 const seconds=session?Math.max(0,Math.ceil((new Date(session.eligible_at).getTime()-Date.now())/1000)):90;
 const claim=async()=>{
  if(!supabase||busy||!session||seconds>0||claimed)return;
  setBusy(true);setMessage("");
  try{const {data,error}=await supabase.rpc("lab_game_video_confirm",{p_video_key:key});
   if(error)throw error;
   setClaimed(true);onBonus(Number(data?.total_xp??0));setMessage(data?.awarded?"Panorama confirmado: +5 XP extra!":"Este panorama já recebeu XP.");
  }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível confirmar o vídeo")}
  finally{setBusy(false)}
 };
 return <div className="video-modal-backdrop" role="presentation" onClick={onClose}>
  <section className="video-modal" role="dialog" aria-modal="true" aria-label={"Panorama "+resource.title} ref={containerRef} onClick={e=>e.stopPropagation()}>
   <header className="video-modal-header"><div><span className="eyebrow">PANORAMA DO LIVRO · +5 XP EXTRA</span><h2>{resource.title}</h2></div><button type="button" aria-label="Fechar vídeo" onClick={onClose}><X size={24}/></button></header>
   <div className="video-frame"><iframe title={"BibleProject: "+resource.title} src={source.src} allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope" allowFullScreen loading="eager" referrerPolicy="strict-origin-when-cross-origin"/></div>
   {!source.exact&&<p className="video-player-hint"><Video size={17}/> Esta versão abre a playlist oficial dentro do LABGAME. Selecione nela o panorama “{resource.title}”.</p>}
   <div className="video-controls"><button type="button" className="secondary-cta" onClick={()=>{void containerRef.current?.requestFullscreen?.().catch(()=>setMessage("Utilize a opção de tela cheia do player."))}}><Expand size={17}/> TELA CHEIA</button><a href={resource.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Fonte original</a></div>
   <p className="video-credit"><strong>BibleProject</strong> é o autor e proprietário deste conteúdo. Mais recursos em <a href="https://bibleproject.com" target="_blank" rel="noopener noreferrer">bibleproject.com</a>. O vídeo não substitui os capítulos da leitura anual.</p>
   {!signedIn?<p className="video-status">Entre na sua conta para conquistar XP extra pelos vídeos.</p>:claimed?<p className="video-success"><CheckCircle2 size={20}/> +5 XP já registrado para este panorama.</p>:<div className="video-reward"><p>Assista ao panorama e confirme depois. A confirmação ficará disponível após {seconds>0?seconds+" segundos":"o período mínimo de exibição"}. O registro é uma declaração pessoal de que você assistiu ao vídeo.</p><button type="button" className="primary-cta" disabled={!session||seconds>0||busy} onClick={()=>void claim()}>{busy?"REGISTRANDO...":"ASSISTI AO PANORAMA · +5 XP"}</button></div>}
   {message&&<p role="status" className="feedback-message">{message}</p>}
  </section>
 </div>;
}
