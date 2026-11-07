// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {CHAPTERS} from '../src/domain/canon';
const map=vi.hoisted(()=>({props:null as null|{stage:number;completedDays:number[];onPreviewStage:(day:number)=>void}}));
vi.mock('../src/components/DemoAtlasJourney',()=>({DemoAtlasJourney:(props:NonNullable<typeof map.props>)=>{map.props=props;return React.createElement('button',{onClick:()=>props.onPreviewStage(props.stage)},'Abrir etapa atual')}}));
vi.mock('../src/features/demo-bible',()=>({loadDemoChapter:vi.fn(async(id:string)=>{const ch=CHAPTERS.find(c=>c.id===id)!;return {book:ch.book,chapter:ch.chapter,verses:[{number:1,text:'Texto de teste.'}]}})}));
vi.mock('../src/components/DemoPanorama',()=>({DemoPanorama:()=>null}));
import {Demo} from '../src/basic-demo';
describe('Leitura sequencial da demonstração sem espera',()=>{
 it('conclui as três leituras e volta ao mapa com dia1lido e dia2liberado, sem rolagem ou prazo',async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  try{
   await act(async()=>root.render(React.createElement(Demo)));
   await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Abrir etapa atual')!.click());
   for(const book of ['Gênesis','Salmos','João']){
    expect(host.querySelector('.demo-reader h1')?.textContent).toBe(book);
    const confirm=[...host.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='Concluí a leitura')!;
    expect(confirm.disabled).toBe(false);await act(async()=>confirm.click());
   }
   expect(map.props?.stage).toBe(2);expect(map.props?.completedDays).toEqual([1]);
   expect(host.querySelector('[role="status"]')?.textContent).toContain('Dia 1 lido. Dia 2 liberado.');
   expect(host.querySelector('.demo-reader')).toBeNull();
  }finally{await act(async()=>root.unmount());host.remove()}
 });
});
