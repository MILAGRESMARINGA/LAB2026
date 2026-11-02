// @vitest-environment jsdom
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {describe, expect, it, vi} from 'vitest';
import {useJourneyEditorialContext} from '../src/features/useJourneyEditorialContext';
import type {JourneyEditorialResult, JourneyEvidenceQuery} from '../src/features/journey-editorial-repository';
vi.mock('../src/lib/supabase', () => ({supabase:null}));
const remote:JourneyEditorialResult={evidence:[],origin:'published',releaseId:'remote-release',availability:'available'};
describe('editorial hook',()=>{
 it('immediately changes bundled context and discards late results from the prior chapter',async()=>{
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
  const requests=new Map<string,(result:JourneyEditorialResult)=>void>();
  const source={getEvidence:vi.fn(({book}:JourneyEvidenceQuery)=>new Promise<JourneyEditorialResult>(resolve=>requests.set(book,resolve)))};
  function View({book}:{book:string}){const result=useJourneyEditorialContext({book,chapter:1},source);return React.createElement('div',null,`${result.origin}:${result.releaseId}:${result.evidence.map(item=>item.id).join(',')}`);}
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
  try{
   await act(async()=>root.render(React.createElement(View,{book:'Gênesis'})));expect(host.textContent).toContain('eden-region');
   await act(async()=>root.render(React.createElement(View,{book:'Joel'})));expect(host.textContent).toContain('joel-date');expect(host.textContent).not.toContain('eden-region');
   await act(async()=>requests.get('Gênesis')!(remote));expect(host.textContent).toContain('joel-date');expect(host.textContent).not.toContain('remote-release');
   await act(async()=>requests.get('Joel')!(remote));expect(host.textContent).toBe('published:remote-release:');
  }finally{await act(async()=>root.unmount());host.remove();}
 });
 it('keeps bundled content when an injected repository rejects',async()=>{
  const source={getEvidence:vi.fn(async()=>{throw Error('offline');})};
  function View(){const result=useJourneyEditorialContext({book:'Joel',chapter:1},source);return React.createElement('div',null,`${result.availability}:${result.evidence[0]?.id}`);}
  const host=document.createElement('div');const root=createRoot(host);
  try{await act(async()=>root.render(React.createElement(View)));expect(host.textContent).toBe('unavailable:joel-date');}finally{await act(async()=>root.unmount());}
 });
});
