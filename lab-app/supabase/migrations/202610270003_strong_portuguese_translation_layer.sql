-- Portuguese presentation layer for Strong lexicon data.
-- Original Hebrew/Greek and source-language fields remain untouched for auditability.
-- Automatic translations are explicitly marked and remain reviewable before publication.

create table if not exists public.strong_lexicon_translations (
  release_id uuid not null references public.strong_lexicon_releases(id) on delete restrict,
  strong_number text not null,
  locale text not null default 'pt-BR',
  translated_gloss text,
  translated_definition text,
  translation_status text not null default 'machine',
  translation_method text not null default 'automatic-neural',
  source_language text not null default 'en',
  source_gloss_sha256 text,
  provider text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (release_id, strong_number, locale),
  constraint strong_lexicon_translations_locale_check
    check (locale in ('pt-BR')),
  constraint strong_lexicon_translations_status_check
    check (translation_status in ('machine', 'reviewed', 'rejected')),
  constraint strong_lexicon_translations_method_check
    check (translation_method in ('automatic-neural', 'human-reviewed')),
  constraint strong_lexicon_translations_source_language_check
    check (source_language = 'en'),
  constraint strong_lexicon_translations_strong_number_check
    check (strong_number ~ '^[HG][0-9]{1,4}$'),
  constraint strong_lexicon_translations_source_hash_check
    check (source_gloss_sha256 is null or source_gloss_sha256 ~ '^[0-9a-f]{64}$'),
  constraint strong_lexicon_translations_review_consistency_check
    check (
      (translation_status = 'reviewed' and reviewed_at is not null and translation_method = 'human-reviewed')
      or (translation_status <> 'reviewed')
    )
);

create index if not exists strong_lexicon_translations_lookup_idx
  on public.strong_lexicon_translations (locale, strong_number);

alter table public.strong_lexicon_translations enable row level security;

revoke all on table public.strong_lexicon_translations from public, anon, authenticated;
grant select on table public.strong_lexicon_translations to authenticated;
grant select, insert, update on table public.strong_lexicon_translations to service_role;

drop policy if exists strong_lexicon_translations_public_read on public.strong_lexicon_translations;
create policy strong_lexicon_translations_public_read
on public.strong_lexicon_translations
for select to authenticated
using (
  exists (
    select 1
    from public.strong_lexicon_releases r
    where r.id = strong_lexicon_translations.release_id
      and r.rights_status = 'approved'
      and r.publication_status = 'published'
  )
);
