// @vitest-environment jsdom
import React,{act,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {DemoAtlasJourney} from '../src/components/DemoAtlasJourney';
import {createNextGamePlan} from '../src/domain/game-plan-next';
import {atlasPlace} from '../src/domain/journey-atlas';
const scene=vi.hoisted(()=>({props:null as any}));
vi.mock('../src/components/JourneyScene3D',()=>({JourneyScene3D:(props:any)=>{scene.props=props;useEffect(()=>{props.onProject(props.nodes.map((node:any,i:number)=>({day:node.day,x:100+i*80,y:150})))},[props.nodes,props.onProject]);return React.createElement('div',{'data-scene-mode':props.viewMode})}}));
const plan=createNextGamePlan(365).stages;
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;Object.defineProperty(window,'matchMedia',{writable:true,value:()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})})});
describe('Atlas público com pontos regionais fixos',()=>{
 it('agrupa leituras no mesmo ponto sem inventar rota e preserva coordenadas do atlas',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),read=vi.fn();
  try{await act(async()=>root.render(React.createElement(DemoAtlasJourney,{stage:2,plan,completedDays:[1],onPreviewStage:read,onOpenRewards:vi.fn()})));
   expect(scene.props.anchorOnly).toBe(true);expect(scene.props.viewMode).toBe('episode');expect(host.querySelector('polyline')).toBeNull();
   const expected=new Map(plan.slice(0,7).map(item=>{const p=atlasPlace(item.old[0]??item.chapters[0]);return [`${p.lon}:${p.lat}`,p]}));
   expect(scene.props.nodes).toHaveLength(expected.size);for(const node of scene.props.nodes)expect(expected.has(`${node.lon}:${node.lat}`)).toBe(true);
   const currentPlace=atlasPlace(plan[1].old[0]),same=scene.props.nodes.filter((node:any)=>node.lon===currentPlace.lon&&node.lat===currentPlace.lat);expect(same).toHaveLength(1);expect(same[0].day).toBe(2);
   expect(host.querySelector('[data-geographic-day="2"]')?.parentElement?.textContent).toContain('1 lida');
   expect(host.querySelectorAll('[data-week-day]')).toHaveLength(7);
   const future=host.querySelector<HTMLButtonElement>('[data-week-day="3"]')!;expect(future.getAttribute('aria-disabled')).toBe('true');await act(async()=>future.click());expect(read).not.toHaveBeenCalled();
   await act(async()=>host.querySelector<HTMLButtonElement>('[data-week-day="1"]')!.click());expect(read).toHaveBeenCalledWith(1);
   await act(async()=>host.querySelector<HTMLButtonElement>('[data-geographic-day="2"]')!.click());expect(read).toHaveBeenCalledWith(2);
  }finally{await act(async()=>root.unmount());host.remove()}
 });
 it('permite testar o dia365 como atual e explorar o mundo sem iniciar leitura',async()=>{
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host),read=vi.fn();
  try{await act(async()=>root.render(React.createElement(DemoAtlasJourney,{stage:365,plan,completedDays:[],onPreviewStage:read,onOpenRewards:vi.fn()})));
   expect(host.querySelectorAll('[data-week-day]')).toHaveLength(1);await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="Ver mundo"]')!.click());expect(read).not.toHaveBeenCalled();expect(scene.props.viewMode).toBe('world');
   await act(async()=>host.querySelector<HTMLButtonElement>('.demo-atlas-reading button')!.click());expect(read).toHaveBeenCalledWith(365);
  }finally{await act(async()=>root.unmount());host.remove()}
 });
});
