-- Canonical Strong lexicon and verse-tagging foundation.
-- Additive, reproducible, and safe for fresh databases.
-- Publication is gated by rights_status/publication_status/review_status.
-- No client role receives write access; service_role is trusted ingestion only.

create table if not exists public.strong_lexicon_releases (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null,
  source_revision text,
  license_name text not null,
  license_url text,
  attribution text,
  artifact_sha256 text,
  rights_status text not null default 'pending',
  publication_status text not null default 'draft',
  created_at timestamptz not null default now(),
  constraint strong_lexicon_releases_rights_status_check
    check (rights_status in ('pending', 'approved', 'rejected')),
  constraint strong_lexicon_releases_publication_status_check
    check (publication_status in ('draft', 'published', 'retired')),
  constraint strong_lexicon_releases_artifact_sha256_check
    check (artifact_sha256 is null or artifact_sha256 ~ '^[0-9a-f]{64}$'),
  constraint strong_lexicon_releases_source_url_artifact_sha256_key
    unique (source_url, artifact_sha256)
);

create table if not exists public.strong_hebrew (
  release_id uuid not null references public.strong_lexicon_releases(id) on delete restrict,
  strong_number text not null,
  lemma text not null,
  transliteration text,
  glosses text,
  definition text,
  language text not null default 'hebrew',
  primary key (release_id, strong_number),
  constraint strong_hebrew_strong_number_check
    check (strong_number ~ '^H[0-9]{1,4}$'),
  constraint strong_hebrew_language_check
    check (language = 'hebrew')
);

create table if not exists public.strong_greek (
  release_id uuid not null references public.strong_lexicon_releases(id) on delete restrict,
  strong_number text not null,
  lemma text not null,
  transliteration text,
  glosses text,
  definition text,
  language text not null default 'greek',
  primary key (release_id, strong_number),
  constraint strong_greek_strong_number_check
    check (strong_number ~ '^G[0-9]{1,4}$'),
  constraint strong_greek_language_check
    check (language = 'greek')
);

create table if not exists public.strong_tagging_releases (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null,
  source_revision text,
  license_name text not null,
  license_url text,
  attribution text,
  artifact_sha256 text,
  rights_status text not null default 'pending',
  publication_status text not null default 'draft',
  created_at timestamptz not null default now(),
  constraint strong_tagging_releases_rights_status_check
    check (rights_status in ('pending', 'approved', 'rejected')),
  constraint strong_tagging_releases_publication_status_check
    check (publication_status in ('draft', 'published', 'retired')),
  constraint strong_tagging_releases_artifact_sha256_check
    check (artifact_sha256 is null or artifact_sha256 ~ '^[0-9a-f]{64}$'),
  constraint strong_tagging_releases_source_url_artifact_sha256_key
    unique (source_url, artifact_sha256)
);

create table if not exists public.verse_strong_links (
  id uuid primary key default gen_random_uuid(),
  edition text not null,
  chapter_id text not null,
  verse_number smallint not null,
  tagging_release_id uuid not null references public.strong_tagging_releases(id) on delete restrict,
  lexicon_release_id uuid not null references public.strong_lexicon_releases(id) on delete restrict,
  token_ordinal integer not null,
  token_text text,
  strong_number text not null,
  language text not null,
  confidence numeric,
  source_locator text,
  review_status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint verse_strong_links_edition_chapter_id_verse_number_fkey
    foreign key (edition, chapter_id, verse_number)
    references public.lab_bible_verses(edition, chapter_id, verse_number)
    on delete restrict,
  constraint verse_strong_links_token_ordinal_check check (token_ordinal > 0),
  constraint verse_strong_links_verse_number_check check (verse_number > 0),
  constraint verse_strong_links_confidence_check
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  constraint verse_strong_links_language_check
    check (language in ('hebrew', 'greek', 'aramaic')),
  constraint verse_strong_links_review_status_check
    check (review_status in ('pending', 'approved', 'rejected')),
  constraint verse_strong_links_edition_chapter_id_verse_number_tagging__key
    unique (
      edition, chapter_id, verse_number, tagging_release_id,
      token_ordinal, language, strong_number
    )
);

create index if not exists strong_hebrew_strong_number_idx
  on public.strong_hebrew (strong_number);
create index if not exists strong_greek_strong_number_idx
  on public.strong_greek (strong_number);
create index if not exists verse_strong_links_reference_idx
  on public.verse_strong_links (edition, chapter_id, verse_number);
create index if not exists verse_strong_links_strong_number_idx
  on public.verse_strong_links (strong_number, language);

alter table public.strong_lexicon_releases enable row level security;
alter table public.strong_hebrew enable row level security;
alter table public.strong_greek enable row level security;
alter table public.strong_tagging_releases enable row level security;
alter table public.verse_strong_links enable row level security;

revoke all on table
  public.strong_lexicon_releases,
  public.strong_hebrew,
  public.strong_greek,
  public.strong_tagging_releases,
  public.verse_strong_links
from public, anon, authenticated;

grant select on table
  public.strong_lexicon_releases,
  public.strong_hebrew,
  public.strong_greek,
  public.strong_tagging_releases,
  public.verse_strong_links
to authenticated;

grant select, insert, update on table
  public.strong_lexicon_releases,
  public.strong_hebrew,
  public.strong_greek,
  public.strong_tagging_releases,
  public.verse_strong_links,
  public.lab_bible_chapters,
  public.lab_bible_verses
to service_role;

drop policy if exists strong_lexicon_public_read on public.strong_lexicon_releases;
create policy strong_lexicon_public_read
on public.strong_lexicon_releases
for select to authenticated
using (rights_status = 'approved' and publication_status = 'published');

drop policy if exists strong_hebrew_public_read on public.strong_hebrew;
create policy strong_hebrew_public_read
on public.strong_hebrew
for select to authenticated
using (
  exists (
    select 1 from public.strong_lexicon_releases r
    where r.id = strong_hebrew.release_id
      and r.rights_status = 'approved'
      and r.publication_status = 'published'
  )
);

drop policy if exists strong_greek_public_read on public.strong_greek;
create policy strong_greek_public_read
on public.strong_greek
for select to authenticated
using (
  exists (
    select 1 from public.strong_lexicon_releases r
    where r.id = strong_greek.release_id
      and r.rights_status = 'approved'
      and r.publication_status = 'published'
  )
);

drop policy if exists strong_tagging_public_read on public.strong_tagging_releases;
create policy strong_tagging_public_read
on public.strong_tagging_releases
for select to authenticated
using (rights_status = 'approved' and publication_status = 'published');

drop policy if exists verse_strong_links_public_read on public.verse_strong_links;
create policy verse_strong_links_public_read
on public.verse_strong_links
for select to authenticated
using (
  review_status = 'approved'
  and exists (
    select 1 from public.strong_tagging_releases t
    where t.id = verse_strong_links.tagging_release_id
      and t.rights_status = 'approved'
      and t.publication_status = 'published'
  )
  and exists (
    select 1 from public.strong_lexicon_releases l
    where l.id = verse_strong_links.lexicon_release_id
      and l.rights_status = 'approved'
      and l.publication_status = 'published'
  )
  and exists (
    select 1 from public.lab_bible_edition_availability a
    where a.code = verse_strong_links.edition
      and a.available = true
      and a.rights_status in ('approved', 'public_domain')
  )
);
