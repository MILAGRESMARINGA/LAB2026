import {useEffect,useRef,useState} from "react";
import {CheckCircle2,ExternalLink,Expand,Video,X} from "lucide-react";
import type {BibleProjectResource} from "../domain/bibleproject";
import {supabase} from "../lib/supabase";

const OFFICIAL_MUX_PLAYBACK_IDS:Readonly<Record<string,string>>={
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
export function embeddedPlayer(resource:BibleProjectResource,_book:string):{src:string;exact:true}|{src:null;exact:false}{
 const key=videoKeyFromUrl(resource.url);
 const playback=OFFICIAL_MUX_PLAYBACK_IDS[key];
 if(playback)return {src:"https://player.mux.com/"+playback,exact:true};
 // Never display the first New Testament playlist item (often Matthew)
 // as if it were a verified video for the requested book.
 return {src:null,exact:false};
}
type VideoState={eligible_at:string;already_awarded:boolean};
export function BibleProjectPlayer({resource,book,signedIn,onClose,onBonus}:{resource:BibleProjectResource;book:string;signedIn:boolean;onClose:()=>void;onBonus:(total:number)=>void}){
 const containerRef=useRef<HTMLDivElement>(null);
 const [timer,setTimer]=useState(0);
 const [session,setSession]=useState<VideoState|null>(null);
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const [claimed,setClaimed]=useState(false);
 const [officialSourceOpened,setOfficialSourceOpened]=useState(false);
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
  if(!supabase||busy||!session||seconds>0||claimed||(!source.exact&&!officialSourceOpened))return;
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
   {source.exact?<div className="video-frame"><iframe title={"BibleProject: "+resource.title} src={source.src} allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope" allowFullScreen loading="eager" referrerPolicy="strict-origin-when-cross-origin"/></div>:<div className="video-player-external" role="note"><Video size={25}/><h3>Panorama disponível na fonte oficial</h3><p>O player individual deste livro ainda não foi verificado. Para evitar apresentar o panorama de outro livro, abra o recurso correspondente no BibleProject.</p><a href={resource.url} target="_blank" rel="noopener noreferrer" onClick={()=>setOfficialSourceOpened(true)}><ExternalLink size={17}/> ASSISTIR {resource.title.toLocaleUpperCase("pt-BR")}</a></div>}
   <div className="video-controls">{source.exact&&<button type="button" className="secondary-cta" onClick={()=>{void containerRef.current?.requestFullscreen?.().catch(()=>setMessage("Utilize a opção de tela cheia do player."))}}><Expand size={17}/> TELA CHEIA</button>}<a href={resource.url} target="_blank" rel="noopener noreferrer" onClick={()=>setOfficialSourceOpened(true)}><ExternalLink size={16}/> Fonte original</a></div>
   <p className="video-credit"><strong>BibleProject</strong> é o autor e proprietário deste conteúdo. Mais recursos em <a href="https://bibleproject.com" target="_blank" rel="noopener noreferrer">bibleproject.com</a>. O vídeo não substitui os capítulos da leitura anual.</p>
   {!signedIn?<p className="video-status">Entre na sua conta para conquistar XP extra pelos vídeos.</p>:claimed?<p className="video-success"><CheckCircle2 size={20}/> +5 XP já registrado para este panorama.</p>:<div className="video-reward"><p>Assista ao panorama e confirme depois. A confirmação ficará disponível após {seconds>0?seconds+" segundos":"o período mínimo de exibição"}. O registro é uma declaração pessoal de que você assistiu ao vídeo. {source.exact?"":"Abra primeiro o panorama correto na fonte oficial para habilitar esta confirmação."}</p><button type="button" className="primary-cta" disabled={!session||seconds>0||busy||(!source.exact&&!officialSourceOpened)} onClick={()=>void claim()}>{busy?"REGISTRANDO...":"ASSISTI AO PANORAMA · +5 XP"}</button></div>}
   {message&&<p role="status" className="feedback-message">{message}</p>}
  </section>
 </div>;
}
