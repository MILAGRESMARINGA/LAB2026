// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {DemoAtlasJourney} from '../src/components/DemoAtlasJourney';
import {createNextGamePlan} from '../src/domain/game-plan-next';
vi.mock('../src/components/JourneyScene3D',()=>({JourneyScene3D:(props:{viewMode:string;nodes:unknown[]})=>React.createElement('div',{'data-scene-mode':props.viewMode,'data-pin-count':props.nodes.length})}));
const plan=createNextGamePlan(365).stages;
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;Object.defineProperty(window,'matchMedia',{writable:true,value:()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})})});
describe('Jornada pública no atlas 3D',()=>{
 it('abre na etapa, oferece sete controles ordenados e separa explorar de iniciar leitura',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),read=vi.fn(),rewards=vi.fn();
  try{await act(async()=>root.render(React.createElement(DemoAtlasJourney,{stage:8,plan,completedDays:[8],onPreviewStage:read,onOpenRewards:rewards})));
   expect(host.querySelector('[data-scene-mode]')?.getAttribute('data-scene-mode')).toBe('episode');
   expect(host.querySelector('[data-pin-count]')?.getAttribute('data-pin-count')).toBe('0');
   expect([...host.querySelectorAll('[data-week-day]')].map(el=>Number(el.getAttribute('data-week-day')))).toEqual([8,9,10,11,12,13,14]);
   expect(host.querySelector('[data-week-day="8"]')?.getAttribute('aria-label')).toContain('concluído');
   await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Ver mundo"]')!.click());
   expect(read).not.toHaveBeenCalled();expect(host.querySelector('[data-scene-mode]')?.getAttribute('data-scene-mode')).toBe('world');expect(host.querySelectorAll('[data-week-day]')).toHaveLength(0);
   await act(async()=>host.querySelector<HTMLButtonElement>('.demo-atlas-footer button')!.click());expect(read).toHaveBeenCalledWith(8);
   await act(async()=>host.querySelector<HTMLButtonElement>('.demo-atlas-chest')!.click());expect(rewards).toHaveBeenCalledOnce();
  }finally{await act(async()=>root.unmount());host.remove()}
 });
 it('permite testar o último dia e mantém a última janela parcial sem criar etapas extras',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),read=vi.fn();
  try{await act(async()=>root.render(React.createElement(DemoAtlasJourney,{stage:365,plan,completedDays:[],onPreviewStage:read,onOpenRewards:vi.fn()})));
   expect(host.querySelectorAll('[data-week-day]')).toHaveLength(1);
   await act(async()=>host.querySelector<HTMLButtonElement>('[data-week-day="365"]')!.click());expect(read).toHaveBeenCalledWith(365);expect(host.textContent).toContain('SEMANA 53');
  }finally{await act(async()=>root.unmount());host.remove()}
 });
});
