-- Source-provenance labels are not human/editorial approvals.
-- This is schema-only: NO mass change and NO publication on migration.
alter table public.verse_strong_links
 drop constraint if exists verse_strong_links_review_status_check;
alter table public.verse_strong_links
 add constraint verse_strong_links_review_status_check
 check (review_status in('pending','approved','rejected',
                         'source_verified_stepbible','editorial_reviewed'));
alter table public.verse_strong_links
 add column if not exists editorial_review_reference text;
alter table public.strong_lexicon_translations
 add column if not exists auto_qa_passed boolean not null default false;

-- Clients can only retrieve independently source-verified, published links.
drop policy if exists verse_strong_links_public_read
 on public.verse_strong_links;
create policy verse_strong_links_public_read
 on public.verse_strong_links for select to authenticated
 using(
  review_status in('source_verified_stepbible','editorial_reviewed')
  and exists(select 1 from public.strong_tagging_releases r
     where r.id=verse_strong_links.tagging_release_id
       and r.rights_status='approved' and r.publication_status='published')
  and exists(select 1 from public.strong_lexicon_releases r
     where r.id=verse_strong_links.lexicon_release_id
       and r.rights_status='approved' and r.publication_status='published')
  and edition='KJV'
  and exists(select 1 from public.lab_bible_edition_availability e
     where e.code='KJV' and e.available
       and e.rights_status='public_domain')
 );

-- Two clearly separated Portuguese layers.
-- machine+QA still does NOT mean human editorial review.
drop policy if exists strong_lexicon_translations_public_read
 on public.strong_lexicon_translations;
create policy strong_lexicon_translations_public_read
 on public.strong_lexicon_translations for select to authenticated
 using (
  locale='pt-BR' and
  ((translation_status='reviewed' and translation_method='human-reviewed'
     and reviewed_at is not null)
    or (translation_status='machine' and translation_method='automatic-neural'
        and auto_qa_passed=true))
  and exists(select 1 from public.strong_lexicon_releases r
    where r.id=strong_lexicon_translations.release_id
      and r.rights_status='approved' and r.publication_status='published')
 );
