-- EXPLICIT RELEASE ONLY: execute after source hash re-check, source backfill,
-- rights resolution, full CI, backup+restore drill and editorial publication gate.
-- This file is intentionally NOT a Supabase auto-applied migration.
begin;
do $guard$
declare v_count bigint;
begin
 select count(*) into v_count from public.verse_strong_links;
 if v_count<>446231 or exists (
   select 1 from public.verse_strong_links
   where review_status not in('source_verified_stepbible','editorial_reviewed')
 ) then raise exception 'Abort: data provenance gate failed';end if;
 if (select count(*) from public.strong_lexicon_translations)<>18085
 then raise exception 'Abort: glossary total does not match audited lexicon';end if;
 if exists(select 1 from public.strong_lexicon_releases
   where source_name not like 'STEPBible%' or rights_status<>'approved'
     or license_name<>'CC BY 4.0' or artifact_sha256 is null)
 then raise exception 'Abort: lexicon release unexpected';end if;
 if exists(select 1 from public.strong_tagging_releases
   where source_name not like 'STEPBible%' or rights_status<>'approved'
     or license_name<>'CC BY 4.0' or artifact_sha256 is null)
 then raise exception 'Abort: tagging release unexpected';end if;
end $guard$;
-- Only explicitly pinned canonical releases, not old history releases.
update public.strong_lexicon_releases set publication_status='published'
 where source_name like '%(canonical fields v2)'
   and artifact_sha256 in (
     '464dccadd95fd8620dd05fa0d7a4caba58ec3c4d5db3ebf38e43d046ca25b591',
     '312f723d7b8ef263bbdfb0451c9b8057125804dfff390b6f8544cff2a84b57f4'
   ) and rights_status='approved' and publication_status='draft';
update public.strong_tagging_releases set publication_status='published'
 where artifact_sha256 in (
   '1ac5d58521521f62ada6528b953c42fb35875e5952af8d5dc494c6141b1f0620',
   'ebf7d752faf67dc62883e54b8e82038eef5b48f54453849f872be2450c90005f'
 ) and rights_status='approved' and publication_status='draft';
commit;
