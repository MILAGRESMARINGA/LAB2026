// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {BiblicalWorldMap} from '../src/components/BiblicalWorldMap';
import {createNextGamePlan} from '../src/domain/game-plan-next';
import {StudyReadingScreen} from '../src/components/StudyReadingScreen';
describe('Jornada explorável e tela de estudo',()=>{
 it('abre a leitura com um toque, mostra só sete etapas e bloqueia o futuro',async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),read=vi.fn();
  try{
   await act(async()=>root.render(React.createElement(BiblicalWorldMap,{stage:1,completedStages:0,chapters:[],plan:createNextGamePlan(365).stages,onRead:read})));
   expect(host.querySelectorAll('svg [role="button"]')).toHaveLength(7);
   expect(host.querySelector('.journey-map-detail')).toBeNull();
   const current=host.querySelector('svg [aria-label^="Etapa 1,"]')!;
   await act(async()=>current.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
   expect(read).toHaveBeenCalledOnce();
   await act(async()=>host.querySelector('svg [aria-label^="Etapa 2,"]')!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
   expect(read).toHaveBeenCalledOnce();expect(host.querySelector('[role="status"]')?.textContent).toContain('bloqueada');
   await act(async()=>{[...host.querySelectorAll('button')].find(b=>b.textContent==='Ver jornada inteira')!.click()});
   expect(host.querySelectorAll('svg [role="button"]')).toHaveLength(365);
   await act(async()=>host.querySelector('svg [aria-label^="Etapa 365,"]')!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
   expect(read).toHaveBeenCalledOnce();
   await act(async()=>{[...host.querySelectorAll('button')].find(b=>b.textContent==='Ver semana')!.click()});
   expect(host.querySelectorAll('svg [role="button"]')).toHaveLength(7);
  }finally{await act(async()=>root.unmount());host.remove()}
 });
 it('monta o conteúdo somente ao abrir e fecha pelo cancelamento nativo',async()=>{
  const show=vi.fn(function(this:HTMLDialogElement){this.setAttribute('open','')});
  const close=vi.fn(function(this:HTMLDialogElement){this.removeAttribute('open')});
  Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:show});Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:close});
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),cancel=vi.fn();
  try{
   const draw=(open:boolean)=>React.createElement(StudyReadingScreen,{title:'Estudo',open,onClose:cancel,children:'Conteúdo individual'});
   await act(async()=>root.render(draw(false)));expect(host.textContent).toBe('');
   await act(async()=>root.render(draw(true)));expect(show).toHaveBeenCalledOnce();expect(host.textContent).toContain('Conteúdo individual');
   await act(async()=>host.querySelector('dialog')!.dispatchEvent(new Event('cancel',{cancelable:true})));expect(cancel).toHaveBeenCalledOnce();
  }finally{await act(async()=>root.unmount());host.remove()}
 });
});
