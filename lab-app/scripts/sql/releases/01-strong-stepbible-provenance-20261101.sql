-- MANUAL DATA OPERATION: never run before fresh pg_dump+test restore and
-- independent pinned STEPBible artifact SHA256 comparisons.
-- This is not a human review of the 446,231 lexical associations.
begin;
do $pre$
begin
 if (select count(*) from public.verse_strong_links)<>446231 then
  raise exception 'Link total changed: abort provenance promotion'; end if;
 if exists(select 1 from public.verse_strong_links v
  join public.strong_tagging_releases tag on tag.id=v.tagging_release_id
  join public.strong_lexicon_releases lex on lex.id=v.lexicon_release_id
  where v.review_status<>'pending' or v.edition<>'KJV'
    or v.source_locator is null or btrim(v.source_locator)=''
    or v.token_text is null or btrim(v.token_text)=''
    or tag.license_name<>'CC BY 4.0' or lex.license_name<>'CC BY 4.0'
    or not(
      (tag.artifact_sha256='1ac5d58521521f62ada6528b953c42fb35875e5952af8d5dc494c6141b1f0620'
       and lex.artifact_sha256='464dccadd95fd8620dd05fa0d7a4caba58ec3c4d5db3ebf38e43d046ca25b591'
       and v.language in('hebrew','aramaic') and v.strong_number like 'H%')
      or
      (tag.artifact_sha256='ebf7d752faf67dc62883e54b8e82038eef5b48f54453849f872be2450c90005f'
       and lex.artifact_sha256='312f723d7b8ef263bbdfb0451c9b8057125804dfff390b6f8544cff2a84b57f4'
       and v.language='greek' and v.strong_number like 'G%')
    )) then
   raise exception 'Tagging source hash/line integrity mismatch'; end if;
end $pre$;
update public.verse_strong_links
 set review_status='source_verified_stepbible'
 where review_status='pending';
do $post$
begin
 if (select count(*) from public.verse_strong_links
   where review_status='source_verified_stepbible')<>446231 then
  raise exception 'Provenance count mismatch';end if;
end $post$;
commit;
