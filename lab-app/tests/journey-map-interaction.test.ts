// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {BiblicalWorldMap} from '../src/components/BiblicalWorldMap';
import {createNextGamePlan} from '../src/domain/game-plan-next';
import {StudyReadingScreen} from '../src/components/StudyReadingScreen';
describe('Jornada explorável e tela de estudo',()=>{
 it('mantém todas as etapas dentro do mapa e explora sem iniciar leitura',async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),read=vi.fn();
  const plan=createNextGamePlan(365).stages;
  try{
   await act(async()=>root.render(React.createElement(BiblicalWorldMap,{stage:1,completedStages:0,chapters:[],plan,onRead:read})));
   expect(host.querySelectorAll('svg [role="button"]')).toHaveLength(365);
   const last=host.querySelector('svg [aria-label^="Etapa 365,"]')!;
   await act(async()=>last.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
   expect(host.querySelector('.journey-map-detail h3')?.textContent).toContain('365 · Bloqueada');expect(read).not.toHaveBeenCalled();
   expect(host.querySelector('.journey-map-detail .primary-cta')).toBeNull();
   const efesios=plan.find(d=>d.chapters.some(c=>c.book==='Efésios'&&c.chapter===1))!;
   await act(async()=>host.querySelector(`svg [aria-label^="Etapa ${efesios.day},"]`)!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
   expect(host.querySelector('.journey-map-detail')?.textContent).toContain('Éfeso');expect(host.querySelector('.journey-map-detail')?.textContent).toContain('Ásia Menor');expect(read).not.toHaveBeenCalled();
   const zoom=host.querySelector('button[aria-label="Ampliar mapa"]') as HTMLButtonElement;
   await act(async()=>zoom.click());expect(host.querySelector('output')?.textContent).toBe('125%');
   await act(async()=>{[...host.querySelectorAll('button')].find(b=>b.textContent==='Ver jornada inteira')!.click()});
   expect(host.querySelector('.is-overview')).not.toBeNull();expect(host.querySelectorAll('svg [role="button"]')).toHaveLength(365);
   await act(async()=>{[...host.querySelectorAll('button')].find(b=>b.textContent==='Minha etapa')!.click()});
   await act(async()=>{(host.querySelector('.journey-map-detail .primary-cta') as HTMLButtonElement).click()});expect(read).toHaveBeenCalledOnce();
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
