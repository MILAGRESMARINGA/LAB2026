import type {SupabaseClient} from '@supabase/supabase-js';
import {CANON} from '../domain/canon';
import {getJourneyEvidence, type JourneyEvidence} from '../domain/journey-evidence';

export type JourneyEvidenceQuery = {book: string; chapter: number};
/** Untrusted Data API response, validated before it can replace the bundled content. */
export type JourneyEditorialEnvelope = {release: unknown; evidence: unknown; sources: unknown};
export type JourneyEditorialTransport = (query: JourneyEvidenceQuery, signal: AbortSignal) => Promise<JourneyEditorialEnvelope | null>;
export type JourneyEditorialResult = {
  evidence: JourneyEvidence[];
  origin: 'bundled' | 'published';
  releaseId: string | null;
  availability: 'local' | 'available' | 'unavailable' | 'invalid-query';
};
const record = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 20000;
const https = (value: unknown): value is string => {
  if (!text(value)) return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
};
const confidence = new Set(['textual', 'corroborated', 'approximate', 'disputed']);
const kinds = new Set(['scriptural-narrative', 'historical-corroboration', 'editorial-inference']);
const validQuery = ({book, chapter}: JourneyEvidenceQuery) => {
  const bookRecord = CANON.find(([name]) => name === book);
  return Boolean(bookRecord && Number.isInteger(chapter) && chapter >= 1 && chapter <= bookRecord[1]);
};
function parseEnvelope(payload: JourneyEditorialEnvelope, query: JourneyEvidenceQuery): JourneyEditorialResult | null {
  const {release, evidence, sources} = payload;
  if (!record(release) || !text(release.id) || release.publication_status !== 'published' ||
      !text(release.reviewed_by) || !text(release.reviewed_at) || !text(release.published_at) ||
      !Array.isArray(evidence) || evidence.length > 100 || !Array.isArray(sources) || sources.length > 100) return null;
  const found: JourneyEvidence[] = [];
  const seen = new Set<string>();
  for (const item of evidence) {
    if (!record(item) || item.release_id !== release.id || item.book !== query.book ||
        !Number.isInteger(item.from_chapter) || !Number.isInteger(item.to_chapter) ||
        (item.from_chapter as number) > query.chapter || (item.to_chapter as number) < query.chapter ||
        !text(item.id) || seen.has(item.id) || !text(item.title) || !text(item.claim) || !text(item.scope) ||
        !text(item.kind) || !kinds.has(item.kind) || !text(item.confidence) || !confidence.has(item.confidence) ||
        !Array.isArray(item.references) || item.references.length < 1 || !item.references.every(text) ||
        (item.caution != null && !text(item.caution))) return null;
    const source = sources.find(row => record(row) && row.id === item.source_id && row.release_id === release.id);
    if (!record(source) || !text(source.title) || !text(source.publisher) || !https(source.url) ||
        !text(source.retrieved_at) || !/^\d{4}-\d{2}-\d{2}$/.test(source.retrieved_at)) return null;
    seen.add(item.id);
    found.push({id: item.id, title: item.title, claim: item.claim, scope: item.scope,
      kind: item.kind as JourneyEvidence['kind'], confidence: item.confidence as JourneyEvidence['confidence'],
      references: [...item.references] as string[], url: source.url,
      source: {title: source.title, publisher: source.publisher, url: source.url, retrievedAt: source.retrieved_at},
      ...(item.caution == null ? {} : {caution: item.caution as string})});
  }
  return {evidence: found, origin: 'published', releaseId: release.id, availability: 'available'};
}

/**
 * Read-only, bounded, session-memory cache. No user IDs, tokens, persistent storage or inference.
 * Remote loading is opt-in through transport injection; missing schema/network falls back locally.
 * An empty published result is respected instead of inventing evidence or merging different releases.
 */
export function createJourneyEditorialRepository(options: {
  transport?: JourneyEditorialTransport;
  now?: () => number;
  ttlMs?: number;
  timeoutMs?: number;
} = {}) {
  const now = options.now ?? Date.now;
  const ttl = Math.max(0, Math.min(options.ttlMs ?? 300000, 300000));
  const timeout = Math.max(1, Math.min(options.timeoutMs ?? 3500, 10000));
  const cache = new Map<string, {expires: number; result: JourneyEditorialResult}>();
  const pending = new Map<string, Promise<JourneyEditorialResult>>();
  const remember = (key: string, result: JourneyEditorialResult, lifetime: number) => {
    if (cache.size >= 64) cache.delete(cache.keys().next().value!);
    cache.set(key, {expires: now() + lifetime, result});
    return result;
  };
  const local = (query: JourneyEvidenceQuery, availability: JourneyEditorialResult['availability']): JourneyEditorialResult =>
    ({evidence: getJourneyEvidence(query), origin: 'bundled', releaseId: null, availability});
  const load = async (query: JourneyEvidenceQuery): Promise<JourneyEditorialResult> => {
    if (!validQuery(query)) return local(query, 'invalid-query');
    if (!options.transport) return local(query, 'local');
    const key = `${query.book}:${query.chapter}`;
    const hit = cache.get(key);
    if (hit && hit.expires > now()) return hit.result;
    if (pending.has(key)) return pending.get(key)!;
    const request = (async () => {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const expired = new Promise<never>((_, reject) => { timer = setTimeout(() => {controller.abort(); reject(new Error('Editorial timeout'));}, timeout); });
        const payload = await Promise.race([options.transport!(query, controller.signal), expired]);
        const result = payload && parseEnvelope(payload, query);
        if (!result) return remember(key, local(query, 'unavailable'), Math.min(ttl, 30000));
        return remember(key, result, ttl);
      } catch { return remember(key, local(query, 'unavailable'), Math.min(ttl, 30000)); }
      finally { if (timer) clearTimeout(timer); pending.delete(key); }
    })();
    pending.set(key, request);
    return request;
  };
  return {
    async getEvidence(query: JourneyEvidenceQuery) { return structuredClone(await load({...query})); },
    clearCache() { cache.clear(); },
  };
}

/** Uses the caller's regular publishable/anon Supabase client; never constructs a privileged client. */
export function createSupabaseJourneyEditorialTransport(client: Pick<SupabaseClient, 'from'>): JourneyEditorialTransport {
  return async ({book, chapter}, signal) => {
    const release = await client.from('lab_journey_releases')
      .select('id,publication_status,reviewed_by,reviewed_at,published_at')
      .eq('publication_status', 'published').order('published_at', {ascending: false}).order('id', {ascending: false})
      .limit(1).abortSignal(signal).maybeSingle();
    if (release.error) throw release.error;
    if (!release.data) return null;
    const evidence = await client.from('lab_journey_evidence')
      .select('release_id,id,source_id,book,from_chapter,to_chapter,title,kind,references,claim,confidence,scope,caution')
      .eq('release_id', release.data.id).eq('book', book).lte('from_chapter', chapter).gte('to_chapter', chapter)
      .order('id').limit(100).abortSignal(signal);
    if (evidence.error) throw evidence.error;
    if (!evidence.data?.length) return {release: release.data, evidence: [], sources: []};
    const sourceIds = [...new Set(evidence.data.map(item => item.source_id))];
    const sources = await client.from('lab_journey_sources').select('release_id,id,title,publisher,url,retrieved_at')
      .eq('release_id', release.data.id).in('id', sourceIds).limit(100).abortSignal(signal);
    if (sources.error) throw sources.error;
    return {release: release.data, evidence: evidence.data, sources: sources.data};
  };
}
