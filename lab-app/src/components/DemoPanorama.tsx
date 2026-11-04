import {useEffect,useRef} from 'react';
import type {BibleProjectResource} from '../domain/bibleproject';
import {embeddedPlayer} from '../domain/bibleproject-embeds';
export function DemoPanorama({resource,book,rewarded,onClose,onReward}:{resource:BibleProjectResource;book:string;rewarded:boolean;onClose:()=>void;onReward:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);const source=embeddedPlayer(resource,book);
 useEffect(()=>{const el=dialog.current,previous=document.activeElement as HTMLElement|null;el?.showModal();return()=>{el?.close();previous?.focus()}},[]);
 return <dialog ref={dialog} className="demo-panorama-modal" aria-label={`Panorama de ${book}`} onCancel={e=>{e.preventDefault();onClose()}}><header><div><small>SIMULAÇÃO · PANORAMA</small><h2>{resource.title}</h2></div><button type="button" autoFocus aria-label="Fechar panorama" onClick={onClose}>✕</button></header>{source.exact?<iframe title={`Vídeo panorama de ${book}`} src={source.src} allow="fullscreen; picture-in-picture" allowFullScreen/>:<p role="status">Este panorama está indisponível. Você pode continuar a leitura.</p>}<footer><button type="button" onClick={onClose}>Continuar sem bônus</button><button type="button" className="demo-primary" disabled={rewarded} onClick={onReward}>{rewarded?'✓ Bônus simulado registrado':'Simular conclusão · +5 XP'}</button></footer><small>XP de demonstração. No jogo real, assistir e validar são necessários.</small></dialog>;
}
