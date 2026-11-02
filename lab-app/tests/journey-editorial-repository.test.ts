import {describe, expect, it, vi} from 'vitest';
import {createJourneyEditorialRepository, type JourneyEditorialEnvelope} from '../src/features/journey-editorial-repository';
const query = {book: 'Gênesis', chapter: 2};
const payload = (): JourneyEditorialEnvelope => ({
 release: {id:'r1',publication_status:'published',reviewed_by:'editorial-review',reviewed_at:'2026-11-02T00:00:00Z',published_at:'2026-11-02T00:00:00Z'},
 sources: [{release_id:'r1',id:'s1',title:'Texto bíblico',publisher:'Fonte curada',url:'https://example.org/genesis',retrieved_at:'2026-11-02'}],
 evidence: [{release_id:'r1',id:'e1',source_id:'s1',book:'Gênesis',from_chapter:1,to_chapter:3,title:'Éden',kind:'editorial-inference',references:['Gênesis 2:8-14'],claim:'Localização incerta.',confidence:'disputed',scope:'Localização do marco',caution:'Não são coordenadas comprovadas.'}],
});
describe('editorial evidence repository', () => {
 it('uses bundled evidence without a network dependency and rejects invalid chapters',async()=>{
  const transport=vi.fn(async()=>payload());const repo=createJourneyEditorialRepository({transport});
  expect((await createJourneyEditorialRepository().getEvidence(query)).origin).toBe('bundled');
  expect((await repo.getEvidence({book:'Gênesis',chapter:51})).availability).toBe('invalid-query');expect(transport).not.toHaveBeenCalled();
 });
 it('accepts reviewed published evidence and preserves cautions and provenance',async()=>{
  const result=await createJourneyEditorialRepository({transport:async()=>payload()}).getEvidence(query);
  expect(result.origin).toBe('published');expect(result.releaseId).toBe('r1');expect(result.evidence[0].caution).toContain('comprovadas');
  expect(result.evidence[0].source.publisher).toBe('Fonte curada');
 });
 it.each(['draft','cross-release','cross-chapter','unsafe-url','missing-source','unreviewed'])('falls back for %s payload',async(reason)=>{
  const data=payload();const release=data.release as Record<string,unknown>;const evidence=data.evidence as Record<string,unknown>[];const sources=data.sources as Record<string,unknown>[];
  if(reason==='draft')release.publication_status='draft';if(reason==='cross-release')evidence[0].release_id='other';if(reason==='cross-chapter')evidence[0].from_chapter=3;
  if(reason==='unsafe-url')sources[0].url='javascript:alert(1)';if(reason==='missing-source')data.sources=[];if(reason==='unreviewed')release.reviewed_by=null;
  const result=await createJourneyEditorialRepository({transport:async()=>data}).getEvidence(query);expect(result.origin).toBe('bundled');expect(result.availability).toBe('unavailable');
 });
 it('deduplicates concurrent reads, bounds expiry and returns defensive copies',async()=>{
  let time=0;const transport=vi.fn(async()=>payload());const repo=createJourneyEditorialRepository({transport,now:()=>time,ttlMs:10});
  const [a,b]=await Promise.all([repo.getEvidence(query),repo.getEvidence(query)]);expect(transport).toHaveBeenCalledTimes(1);
  (a.evidence[0].references as string[])[0]='mutated';expect(b.evidence[0].references[0]).toBe('Gênesis 2:8-14');
  await repo.getEvidence(query);expect(transport).toHaveBeenCalledTimes(1);time=11;await repo.getEvidence(query);expect(transport).toHaveBeenCalledTimes(2);
 });
 it('timeouts an unavailable source and aborts the transport without blocking local reading',async()=>{
  vi.useFakeTimers();let signal:AbortSignal|undefined;
  const repo=createJourneyEditorialRepository({timeoutMs:20,transport:async(_,s)=>{signal=s;return new Promise(()=>{});}});
  const pending=repo.getEvidence(query);await vi.advanceTimersByTimeAsync(21);expect((await pending).availability).toBe('unavailable');expect(signal?.aborted).toBe(true);vi.useRealTimers();
 });
 it('briefly caches unavailable requests, then retries after the negative TTL',async()=>{
  let time=0;const transport=vi.fn(async()=>{throw Error('offline');});
  const repo=createJourneyEditorialRepository({transport,now:()=>time});
  await repo.getEvidence(query);time=29999;await repo.getEvidence(query);expect(transport).toHaveBeenCalledTimes(1);
  time=30001;await repo.getEvidence(query);expect(transport).toHaveBeenCalledTimes(2);
 });
 it('respects empty published evidence, avoiding accidental merge of release content',async()=>{
  const data=payload();data.evidence=[];data.sources=[];const result=await createJourneyEditorialRepository({transport:async()=>data}).getEvidence(query);
  expect(result.evidence).toEqual([]);expect(result.origin).toBe('published');
 });
});
