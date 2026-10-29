-- MANUAL DATA RELEASE — execute ONLY after tested backup AND independent
-- SHA-256 provenance verification of immutable TAHOT/TAGNT artifacts.
-- Does not claim that 446,231 lexical decisions were reviewed by a scholar.
-- ROLLBACK: UPDATE ... SET review_status='pending'
-- WHERE review_status='source_verified_stepbible';
begin;
do $verify$
declare
 v_total bigint;
 v_verified bigint;
 v_wrong bigint;
begin
 select count(*) into v_total from public.verse_strong_links;
 if v_total<>446231 then raise exception 'Abort: expected 446231 Strong links; found %',v_total; end if;
 select count(*) into v_verified
 from public.verse_strong_links v
 join public.strong_tagging_releases tag on tag.id=v.tagging_release_id
 join public.strong_lexicon_releases lex on lex.id=v.lexicon_release_id
 where v.review_status='pending'
   and v.edition='KJV' and v.token_ordinal>0
   and v.token_text is not null and btrim(v.token_text)<>''
   and v.source_locator like 'Translators Amalgamated OT+NT/%'
   and tag.rights_status='approved' and lex.rights_status='approved'
   and tag.license_name='CC BY 4.0' and lex.license_name='CC BY 4.0'
   and (
    (tag.source_name like 'STEPBible TAHOT%' and v.language in('hebrew','aramaic')
     and v.strong_number like 'H%'
     and tag.artifact_sha256='1ac5d58521521f62ada6528b953c42fb35875e5952af8d5dc494c6141b1f0620'
     and lex.artifact_sha256='464dccadd95fd8620dd05fa0d7a4caba58ec3c4d5db3ebf38e43d046ca25b591')
    or (tag.source_name like 'STEPBible TAGNT%' and v.language='greek'
     and v.strong_number like 'G%'
     and tag.artifact_sha256='ebf7d752faf67dc62883e54b8e82038eef5b48f54453849f872be2450c90005f'
     and lex.artifact_sha256='312f723d7b8ef263bbdfb0451c9b8057125804dfff390b6f8544cff2a84b57f4')
   );
 if v_verified<>v_total then
  raise exception 'Abort: source metadata incomplete, % of % verified',v_verified,v_total;
 end if;
 if (select count(distinct (chapter_id,verse_number)) from public.verse_strong_links)<>31102 then
  raise exception 'Abort: verse coordinate count changed';
 end if;
end
$verify$;

update public.verse_strong_links v
set review_status='source_verified_stepbible'
where v.review_status='pending';

do $check$
begin
 if (select count(*) from public.verse_strong_links
     where review_status='source_verified_stepbible')<>446231
 then raise exception 'Abort: final source-verified row count wrong';end if;
 if exists(select 1 from public.verse_strong_links
   where review_status='editorial_reviewed' and editorial_review_reference is null)
 then raise exception 'Abort: human review reference missing';end if;
end
$check$;
commit;
