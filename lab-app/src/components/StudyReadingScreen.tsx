import {useEffect,useRef,type ReactNode} from 'react';
export function StudyReadingScreen({title,open,onClose,children,id}:{title:string;open:boolean;onClose:()=>void;children:ReactNode;id?:string}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=dialog.current;if(!open||!element)return;const previous=document.activeElement as HTMLElement|null;element.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{element.close();document.body.style.overflow=overflow;previous?.focus()}},[open]);
 if(!open)return null;
 return <dialog id={id} ref={dialog} className="study-reading-dialog" aria-label={title} onCancel={e=>{e.preventDefault();onClose()}}><header><div><span className="eyebrow">BIBLIOTECA DE ESTUDOS</span><h2>{title}</h2></div><button type="button" autoFocus onClick={onClose} aria-label="Fechar estudo">Voltar aos estudos</button></header><div className="study-reading-body">{children}</div></dialog>;
}
