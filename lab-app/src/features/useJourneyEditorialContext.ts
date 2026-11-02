import {useEffect, useMemo, useState} from 'react';
import {getJourneyEvidence} from '../domain/journey-evidence';
import {supabase} from '../lib/supabase';
import {createJourneyEditorialRepository, createSupabaseJourneyEditorialTransport, type JourneyEditorialResult, type JourneyEvidenceQuery} from './journey-editorial-repository';

const repository = createJourneyEditorialRepository({
  ...(supabase && import.meta.env.VITE_JOURNEY_EDITORIAL_REMOTE === 'true' ? {transport: createSupabaseJourneyEditorialTransport(supabase)} : {}),
});
type Repository = Pick<typeof repository, 'getEvidence'>;

/** Local context appears immediately; a published remote release can replace it after validation. */
export function useJourneyEditorialContext(query?: JourneyEvidenceQuery | null, source: Repository = repository): JourneyEditorialResult {
  const book = query?.book ?? '', chapter = query?.chapter ?? 0;
  const key = `${book}:${chapter}`;
  const bundled = useMemo<JourneyEditorialResult>(() => ({
    evidence: getJourneyEvidence({book, chapter}), origin: 'bundled', releaseId: null, availability: 'local',
  }), [book, chapter]);
  const [loaded, setLoaded] = useState<{key: string; result: JourneyEditorialResult} | null>(null);
  useEffect(() => {
    let active = true;
    if (book && chapter > 0) source.getEvidence({book, chapter}).then(result => {
      if (active) setLoaded({key, result});
    }).catch(() => { if (active) setLoaded({key, result: {...bundled, availability: 'unavailable'}}); });
    return () => { active = false; };
  }, [book, chapter, key, source, bundled]);
  // A chapter change never displays context from the previous chapter while fetching.
  return loaded?.key === key ? loaded.result : bundled;
}
