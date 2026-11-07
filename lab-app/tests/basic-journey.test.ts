// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {BasicJourney} from '../src/components/BasicJourney';
import {createNextGamePlan} from '../src/domain/game-plan-next';
import readings from '../src/domain/demo-reading.json';
describe('Trilha básica pública',()=>{
 it('indica um único começo e mantém dias futuros bloqueados',async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),read=vi.fn();
  try{await act(async()=>root.render(React.createElement(BasicJourney,{stage:1,completedStages:0,chapters:[],plan:createNextGamePlan(365).stages,onRead:read})));
   expect(host.querySelectorAll('[data-week-day]')).toHaveLength(7);expect(host.querySelectorAll('.basic-node.current')).toHaveLength(1);expect(host.textContent).toContain('Toque aqui');expect(host.querySelector('canvas')).toBeNull();
   await act(async()=>host.querySelector<HTMLButtonElement>('[data-week-day="2"]')!.click());expect(read).not.toHaveBeenCalled();
   await act(async()=>host.querySelector<HTMLButtonElement>('[data-week-day="1"]')!.click());expect(read).toHaveBeenCalledTimes(1);
  }finally{await act(async()=>root.unmount());host.remove()}
 });
 it('libera a última etapa somente com callback explícito de demonstração',async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),preview=vi.fn();
  try{await act(async()=>root.render(React.createElement(BasicJourney,{stage:365,completedStages:0,chapters:[],plan:createNextGamePlan(365).stages,onPreviewStage:preview})));
   const button=host.querySelector<HTMLButtonElement>('[data-week-day="365"]')!;expect(button.getAttribute('aria-disabled')).toBe('false');
   await act(async()=>button.click());expect(preview).toHaveBeenCalledWith(365);
  }finally{await act(async()=>root.unmount());host.remove()}
 });
 it('inclui os três capítulos completos da primeira leitura, sem credenciais',()=>{
  expect(readings['1:1'].verses).toHaveLength(31);expect(readings['19:1'].verses).toHaveLength(6);expect(readings['43:1'].verses).toHaveLength(51);
  for(const chapter of Object.values(readings))expect(chapter.verses.every((v,i)=>v.number===i+1&&v.text.trim())).toBe(true);
 });
});
