// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {BiblicalWorldMap} from '../src/components/BiblicalWorldMap';
import {createNextGamePlan} from '../src/domain/game-plan-next';
import type {GameDay} from '../src/domain/game-plan';
import {CHAPTERS} from '../src/domain/canon';

const scene=vi.hoisted(()=>({props:null as null|Record<string,any>}));
vi.mock('../src/components/JourneyScene3D',()=>({JourneyScene3D:(props:Record<string,any>)=>{scene.props=props;return React.createElement('div',{'data-testid':'modeled-scene'})}}));
const plan=createNextGamePlan(365).stages;
const dayFor=(book:string,chapter:number,day=1):GameDay=>{const ch=CHAPTERS.find(c=>c.book===book&&c.chapter===chapter)!;return {day,old:ch.testament==='AT'?[ch]:[],psalms:[],newTestament:ch.testament==='NT'?[ch]:[],chapters:[ch]}};
async function mount(props:Partial<React.ComponentProps<typeof BiblicalWorldMap>>={}){
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host),read=vi.fn();
 const draw=(changes:Partial<React.ComponentProps<typeof BiblicalWorldMap>>={})=>act(async()=>{root.render(React.createElement(BiblicalWorldMap,{stage:1,completedStages:0,chapters:[],plan,onRead:read,initialView:'episode',...props,...changes}))});
 await draw();
 return {host,root,read,draw,dispose:async()=>{await act(async()=>root.unmount());host.remove()}};
}
beforeEach(()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 scene.props=null;
 Object.defineProperty(HTMLDialogElement.prototype,'showModal',{configurable:true,value:function(){this.setAttribute('open','')}});
 Object.defineProperty(HTMLDialogElement.prototype,'close',{configurable:true,value:function(){this.removeAttribute('open')}});
});
describe('Contrato de interação do mapa modelado',()=>{
 it('orienta mundo, região e história sem iniciar leitura nem alterar o plano',async()=>{
  const snapshot=JSON.stringify(plan),instance=await mount({initialView:'world'});
  const button=(label:string)=>[...instance.host.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent===label)!;
  try{
   expect(scene.props?.viewMode).toBe('world');
   expect(instance.host.querySelectorAll('[data-journey-day],[data-week-day]')).toHaveLength(0);
   await act(async()=>button('Continuar caminhada').click());
   expect(scene.props?.viewMode).toBe('region');
   expect(instance.host.querySelectorAll('[data-journey-day],[data-week-day]')).toHaveLength(0);
   await act(async()=>button('Entrar na história').click());
   expect(scene.props?.viewMode).toBe('episode');
   expect(instance.host.querySelectorAll('[data-week-day]')).toHaveLength(7);
   expect(instance.read).not.toHaveBeenCalled();expect(JSON.stringify(plan)).toBe(snapshot);
   await act(async()=>button('Ver o mundo').click());
   expect(scene.props?.viewMode).toBe('world');expect(instance.host.querySelectorAll('[data-week-day]')).toHaveLength(0);
  }finally{await instance.dispose()}
 });
 it('limita a ampliação e recentraliza a etapa sem conceder progresso',async()=>{
  const instance=await mount({initialView:'world'});
  const control=(label:string)=>instance.host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  try{
   for(let i=0;i<12;i++)await act(async()=>control('Aumentar zoom').click());
   expect(scene.props?.zoom).toBe(3);expect(control('Aumentar zoom').disabled).toBe(true);
   expect(instance.host.querySelector('[aria-label="Ampliação do mapa"]')?.textContent).toBe('300%');
   for(let i=0;i<12;i++)await act(async()=>control('Diminuir zoom').click());
   expect(scene.props?.zoom).toBe(.75);expect(control('Diminuir zoom').disabled).toBe(true);
   const before=scene.props?.resetViewKey;
   await act(async()=>[...instance.host.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Minha etapa')!.click());
   expect(scene.props?.zoom).toBe(1);expect(scene.props?.viewMode).toBe('episode');expect(scene.props?.resetViewKey).toBeGreaterThan(before);
   expect(instance.read).not.toHaveBeenCalled();expect(instance.host.querySelector('dialog')).toBeNull();
  }finally{await instance.dispose()}
 });
 it.each([365,366] as const)('renderiza somente os dias restantes no fim do plano de %i etapas',async length=>{
  const instance=await mount({stage:length,completedStages:length-1,plan:createNextGamePlan(length).stages});
  try{
   const buttons=[...instance.host.querySelectorAll<HTMLButtonElement>('button[data-week-day]')];
   expect(buttons.length).toBe(length%7||7);
   expect(buttons.map(b=>Number(b.dataset.weekDay))).toContain(length);
   expect(buttons.every(b=>Number(b.dataset.weekDay)<=length)).toBe(true);
   expect(scene.props?.nodes).toHaveLength(length%7||7);
  }finally{await instance.dispose()}
 });
 it('nunca monta o portão nem inicia leitura para uma etapa concluída ou futura',async()=>{
  const instance=await mount({stage:3,completedStages:2});
  try{
   for(const day of [1,2,4,5,6,7]){
    const button=instance.host.querySelector<HTMLButtonElement>(`button[data-week-day="${day}"]`)!;
    expect(button.getAttribute('aria-disabled')==='true'||button.disabled).toBe(true);
    await act(async()=>button.click());
   }
   expect(instance.read).not.toHaveBeenCalled();expect(instance.host.querySelector('dialog[open]')).toBeNull();
  }finally{await instance.dispose()}
 });
 it('mantém leitura bloqueada quando servidor não libera a etapa atual',async()=>{
  const instance=await mount({readingAvailable:false,completedMessage:'Liberação pendente.'});
  try{
   await act(async()=>instance.host.querySelector<HTMLButtonElement>('button[data-week-day="1"]')!.click());
   expect(instance.read).not.toHaveBeenCalled();expect(instance.host.querySelector('dialog[open]')).toBeNull();
  }finally{await instance.dispose()}
 });
 it('fecha o portão pelo cancelamento sem iniciar leitura',async()=>{
  const instance=await mount();
  try{
   const current=instance.host.querySelector<HTMLButtonElement>('button[data-week-day="1"]')!;
   expect(current.tagName).toBe('BUTTON');expect(current.tabIndex).toBeGreaterThanOrEqual(0);
   await act(async()=>current.click());
   const dialog=instance.host.querySelector('dialog[open]')!;
   expect(dialog.textContent).toContain('Gênesis');expect(dialog.textContent).toContain('João');
   await act(async()=>dialog.dispatchEvent(new Event('cancel',{cancelable:true})));
   expect(instance.host.querySelector('dialog[open]')).toBeNull();expect(instance.read).not.toHaveBeenCalled();
  }finally{await instance.dispose()}
 });
 it('permite leitura direta em capítulo que não inicia um livro',async()=>{
  const instance=await mount({plan:[dayFor('Gênesis',2)]});
  try{
   await act(async()=>instance.host.querySelector<HTMLButtonElement>('button[data-week-day="1"]')!.click());
   expect(instance.read).toHaveBeenCalledOnce();expect(instance.host.querySelector('dialog')).toBeNull();
  }finally{await instance.dispose()}
 });
 it('exibe estado vazio para plano sem etapas',async()=>{
  const instance=await mount({plan:[]});
  try{
   expect(instance.host.querySelectorAll('[data-week-day]')).toHaveLength(0);
   expect(instance.host.querySelector('[role="status"]')?.textContent).toMatch(/plano|leitura/i);
   expect(instance.read).not.toHaveBeenCalled();
  }finally{await instance.dispose()}
 });
 it('bloqueia interação durante o deslocamento e libera após a câmera parar',async()=>{
  const instance=await mount({plan:[dayFor('Êxodo',20)]});
  try{
   expect(scene.props?.onTransition).toBeTypeOf('function');
   await act(async()=>scene.props!.onTransition(true));
   await act(async()=>instance.host.querySelector<HTMLButtonElement>('button[data-week-day="1"]')!.click());
   expect(instance.read).not.toHaveBeenCalled();
   await act(async()=>scene.props!.onTransition(false));
   await act(async()=>instance.host.querySelector<HTMLButtonElement>('button[data-week-day="1"]')!.click());
   expect(instance.read).toHaveBeenCalledOnce();
  }finally{await instance.dispose()}
 });
 it('preserva a jornada acessível quando o dispositivo não oferece WebGL',async()=>{
  const instance=await mount();
  try{
   expect(scene.props?.onUnavailable).toBeTypeOf('function');
   await act(async()=>scene.props!.onUnavailable());
   expect(instance.host.textContent).toContain('Visualização 3D indisponível');
   expect(instance.host.querySelectorAll('button[data-week-day]')).toHaveLength(7);
   await act(async()=>instance.host.querySelector<HTMLButtonElement>('button[data-week-day="1"]')!.click());
   expect(instance.host.querySelector('dialog[open]')).not.toBeNull();
  }finally{await instance.dispose()}
 });
 it('abre vídeo opcional e fecha o portão sem confirmar leitura',async()=>{
  const video=vi.fn(),instance=await mount({onVideo:video});
  try{
   await act(async()=>instance.host.querySelector<HTMLButtonElement>('button[data-week-day="1"]')!.click());
   const button=[...instance.host.querySelectorAll<HTMLButtonElement>('dialog button')].find(item=>item.textContent==='Assistir ao panorama')!;
   await act(async()=>button.click());
   expect(video).toHaveBeenCalledOnce();expect(video.mock.calls[0][1]).toBe('Gênesis');
   expect(instance.read).not.toHaveBeenCalled();expect(instance.host.querySelector('dialog[open]')).toBeNull();
  }finally{await instance.dispose()}
 });
 it('permite selecionar outra região de uma leitura intercalada sem avançar a jornada',async()=>{
  const instance=await mount();
  try{
   const before=scene.props?.focus;
   const select=instance.host.querySelector<HTMLSelectElement>('[aria-label="Região da leitura"]')!;
   await act(async()=>{select.value='43:1';select.dispatchEvent(new Event('change',{bubbles:true}))});
   expect(scene.props?.focus).not.toEqual(before);expect(instance.read).not.toHaveBeenCalled();
   expect(instance.host.querySelectorAll('button[data-week-day]')).toHaveLength(7);
   expect(instance.host.textContent).toContain('João 1');
  }finally{await instance.dispose()}
 });
 it('encaminha a preferência de movimento reduzido ao renderizador',async()=>{
  const previous=window.matchMedia;
  Object.defineProperty(window,'matchMedia',{configurable:true,writable:true,value:vi.fn(()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}))});
  const instance=await mount();
  try{expect(scene.props?.reducedMotion).toBe(true)}finally{await instance.dispose();Object.defineProperty(window,'matchMedia',{configurable:true,writable:true,value:previous})}
 });

});
