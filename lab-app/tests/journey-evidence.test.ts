import {describe, expect, it} from 'vitest';
import {getJourneyEvidence, JOURNEY_EVIDENCE_POLICY} from '../src/domain/journey-evidence';

describe('curated journey evidence retrieval', () => {
  it('keeps uncertain geography and chronology explicitly uncertain', () => {
    for (const book of ['Joel','Obadias']) {
      expect(getJourneyEvidence({book,chapter:1}).some(item => item.confidence === 'disputed')).toBe(true);
    }
    expect(getJourneyEvidence({book:'Gênesis',chapter:2})[0].confidence).toBe('disputed');
  });
  it('retrieves the textual reconstruction link without relocating it to Nehemiah', () => {
    expect(getJourneyEvidence({book:'Esdras',chapter:5}).some(item => item.id === 'haggai-zechariah-ezra')).toBe(true);
    expect(getJourneyEvidence({book:'Neemias',chapter:5}).some(item => item.id === 'haggai-zechariah-ezra')).toBe(false);
  });
  it('does not fabricate evidence for missing or invalid chapters', () => {
    expect(getJourneyEvidence({book:'Joel',chapter:4})).toEqual([]);
    expect(getJourneyEvidence({book:'Gênesis',chapter:1.5})).toEqual([]);
    expect(getJourneyEvidence({book:'Livro inexistente',chapter:1})).toEqual([]);
    expect(JOURNEY_EVIDENCE_POLICY.fineTuning).toBe('not-performed');
  });
  it('returns independent records so callers cannot corrupt the curated source', () => {
    const first = getJourneyEvidence({book:'Joel',chapter:1});
    first[0].source.title = 'changed';
    expect(getJourneyEvidence({book:'Joel',chapter:1})[0].source.title).not.toBe('changed');
  });
});
