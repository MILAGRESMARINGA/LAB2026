-- LABGame: STEPBible provenance is NOT human exegesis.
-- Stage only after reproducible dump + isolated restore succeeds.
-- Checks metadata and source locators; raw upstream artifact checksums
-- must separately be confirmed against the pinned files before publication.
begin;
alter table public.verse_strong_links
 drop constraint if exists verse_strong_links_review_status_check;
alter table public.verse_strong_links
 add constraint verse_strong_links_review_status_check
 check (review_status in
 ('pending','approved','rejected','source_verified_stepbible','editorial_reviewed'));

-- Preserve historical column, explicitly distinguish source verification
-- from chapter-specific, documented human exegesis.
alter table public.verse_strong_links
 add column if not exists editorial_review_reference text;

alter table public.strong_lexicon_translations
 add column if not exists auto_qa_passed boolean not null default false;

alter table public.strong_lexicon_translations
 add column if not exists gloss_status text generated always as
 (case when translation_status='reviewed'
        and translation_method='human-reviewed'
        and reviewed_at is not null
  then 'editorial_reviewed_pt'
  else 'stepbible_auto_translated_pt' end) stored;

-- Publication guard for Portuguese; machine glosses only if separately QA'd.
drop policy if exists strong_lexicon_translations_public_read
 on public.strong_lexicon_translations;
create policy strong_lexicon_translations_public_read
 on public.strong_lexicon_translations for select to authenticated
 using (
  (
    (gloss_status='editorial_reviewed_pt')
    or (gloss_status='stepbible_auto_translated_pt'
        and translation_status='machine' and auto_qa_passed=true)
  )
  and exists(select 1 from public.strong_lexicon_releases lr
    where lr.id=strong_lexicon_translations.release_id
      and lr.rights_status='approved'
      and lr.publication_status='published')
 );

drop policy if exists verse_strong_links_public_read on public.verse_strong_links;
create policy verse_strong_links_public_read
 on public.verse_strong_links for select to authenticated
 using (
  review_status in ('source_verified_stepbible','editorial_reviewed')
  and exists(select 1 from public.strong_lexicon_releases lr
    where lr.id=verse_strong_links.lexicon_release_id
      and lr.rights_status='approved' and lr.publication_status='published')
  and exists(select 1 from public.strong_tagging_releases tr
    where tr.id=verse_strong_links.tagging_release_id
      and tr.rights_status='approved' and tr.publication_status='published')
  and exists(select 1 from public.lab_bible_edition_availability a
    where a.code=verse_strong_links.edition and a.available
      and a.rights_status in ('public_domain','open_license','licensed'))
);

-- The 446,231-row promotion remains an explicit, separate, guarded,
-- backup-verified data operation, never a side-effect of creating schema.
commit;
