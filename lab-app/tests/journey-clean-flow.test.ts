// @vitest-environment jsdom
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe,it,expect,vi} from 'vitest';
import {JourneyV2Panel} from '../src/components/JourneyV2Panel';
const fixtures=vi.hoisted(()=>({game:{run_id:'test-run',status:'active',stage:1,plan_length:365,completed_at:null,normal_deadline_at:'2026-10-24T12:00:00Z',grace_deadline_at:'2026-10-24T18:00:00Z',server_at:'2026-10-23T12:00:00Z',completed_stages:0,remaining_lives_this_month:3,run_xp:0},chapters:[{chapter_id:'1:1'},{chapter_id:'19:1'},{chapter_id:'43:1'}]}));
vi.mock('../src/features/journey-v2',()=>({loadLatestJourneyV2:vi.fn(async()=>fixtures.game),getJourneyV2Chapters:vi.fn(async()=>fixtures.chapters),getJourneyV2Checks:vi.fn(async()=>[]),activateJourneyV2:vi.fn(),startJourneyV2:vi.fn(),beginJourneyV2Chapter:vi.fn(),confirmJourneyV2Chapter:vi.fn()}));
vi.mock('../src/components/BibleReader',()=>({BibleReader:({chapterId}:{chapterId:string})=>React.createElement('article',{'data-testid':'reader'},chapterId)}));
describe('Fluxo direto da Jornada',()=>{
 it('não monta o leitor antes do toque e abre Gênesis 1 sem página intermediária',async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  try{
   await act(async()=>root.render(React.createElement(JourneyV2Panel,{userId:'test-user'})));
   expect(host.querySelector('[data-testid="reader"]')).toBeNull();
   expect(host.querySelectorAll('svg [role="button"]')).toHaveLength(7);
   await act(async()=>host.querySelector('svg [aria-label^="Etapa 2,"]')!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
   expect(host.querySelector('[data-testid="reader"]')).toBeNull();
   await act(async()=>host.querySelector('svg [aria-label^="Etapa 1,"]')!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
   expect(host.querySelector('[data-testid="reader"]')?.textContent).toBe('1:1');
   expect(host.querySelector('.journey-world')).toBeNull();
   expect(host.querySelector('.journey-clean-hud')?.textContent).toContain('3 vidas');
   const back=[...host.querySelectorAll('button')].find(b=>b.textContent?.includes('Voltar ao mapa'))!;
   await act(async()=>back.click());expect(host.querySelector('[data-testid="reader"]')).toBeNull();expect(host.querySelector('.journey-world')).not.toBeNull();
  }finally{await act(async()=>root.unmount());host.remove()}
 });
});
