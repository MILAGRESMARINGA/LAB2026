-- MANUAL RELEASE GATE: after restore drill, hash verification, legal review,
-- source status backfill, sample lexical QA, and RLS tests. NOT auto migration.
begin;
do $v$
begin
 if (select count(*) from public.verse_strong_links
     where review_status='source_verified_stepbible')<>446231 then
  raise exception 'Not all source tags verified';end if;
 if (select count(*) from public.strong_lexicon_translations)<>18085 then
  raise exception 'Unexpected glossary size';end if;
end $v$;
update public.strong_lexicon_releases
 set publication_status='published'
 where rights_status='approved'
   and artifact_sha256 in (
    '464dccadd95fd8620dd05fa0d7a4caba58ec3c4d5db3ebf38e43d046ca25b591',
    '312f723d7b8ef263bbdfb0451c9b8057125804dfff390b6f8544cff2a84b57f4')
   and publication_status='draft';
update public.strong_tagging_releases
 set publication_status='published'
 where rights_status='approved'
   and artifact_sha256 in (
    '1ac5d58521521f62ada6528b953c42fb35875e5952af8d5dc494c6141b1f0620',
    'ebf7d752faf67dc62883e54b8e82038eef5b48f54453849f872be2450c90005f')
   and publication_status='draft';
do $v$
begin
 if (select count(*) from public.strong_lexicon_releases
    where publication_status='published' and artifact_sha256 in (
    '464dccadd95fd8620dd05fa0d7a4caba58ec3c4d5db3ebf38e43d046ca25b591',
    '312f723d7b8ef263bbdfb0451c9b8057125804dfff390b6f8544cff2a84b57f4'))<>2
 then raise exception 'Lexicon publish count mismatch';end if;
 if (select count(*) from public.strong_tagging_releases
    where publication_status='published')<>2
 then raise exception 'Tag release publish count mismatch';end if;
end $v$;
commit;
