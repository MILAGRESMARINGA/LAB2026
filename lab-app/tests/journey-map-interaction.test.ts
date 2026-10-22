// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {BiblicalWorldMap} from '../src/components/BiblicalWorldMap';
import {createNextGamePlan} from '../src/domain/game-plan-next';
import {StudyReadingScreen} from '../src/components/StudyReadingScreen';
describe('Jornada explorável e tela de estudo',()=>{
 it('explora o futuro sem disparar leitura e retorna à etapa atual',async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),read=vi.fn();
  try{
   await act(async()=>root.render(React.createElement(BiblicalWorldMap,{stage:1,completedStages:0,chapters:[],plan:createNextGamePlan(365).stages,onRead:read})));
   const range=host.querySelector('input')!;
   await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(range,'365');range.dispatchEvent(new Event('change',{bubbles:true}));range.dispatchEvent(new Event('input',{bubbles:true}))});
   expect(host.textContent).toContain('Explorar etapa 365');expect(read).not.toHaveBeenCalled();
   const zoom=[...host.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Ampliar mapa')!;
   await act(async()=>zoom.click());expect(host.querySelector('output')?.textContent).toBe('125%');
   const city=host.querySelector('[aria-label="Explorar Éfeso"]')!;
   await act(async()=>city.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
   expect(host.querySelector('.atlas-context')?.textContent).toContain('Ásia Menor');expect(read).not.toHaveBeenCalled();
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
