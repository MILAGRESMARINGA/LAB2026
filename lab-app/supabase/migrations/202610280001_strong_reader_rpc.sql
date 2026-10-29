-- LABGame Strong read-only layer: KJV coordinates, PT-BR glosses.
-- This migration never publishes a release, reviews links or modifies scores.
-- The client cannot read draft or unapproved Strong data via this function.
-- Execute only after isolated database tests; production unchanged by this commit.

-- Explicit grants restore rights required by a SECURITY INVOKER function.
-- Every source table has RLS and publication/rights-gated SELECT policies.
grant select on table public.strong_lexicon_releases,
 public.strong_tagging_releases, public.strong_hebrew, public.strong_greek,
 public.verse_strong_links to authenticated;

create or replace function public.lab_strong_verse_lookup(
 p_chapter_id text,
 p_verse_number integer,
 p_limit integer default 48
)
returns table (
 strong_number text,
 token_ordinal integer,
 token_text text,
 language text,
 lemma text,
 transliteration text,
 translated_gloss text,
 translated_definition text,
 translation_status text,
 source_name text
)
language sql
stable
security invoker
set search_path = ''
as $$
 select v.strong_number, v.token_ordinal, v.token_text, v.language,
        coalesce(h.lemma,g.lemma) as lemma,
        coalesce(h.transliteration,g.transliteration) as transliteration,
        tr.translated_gloss,
        case when tr.translation_status = 'reviewed'
          then tr.translated_definition else null end as translated_definition,
        tr.translation_status,
        lr.source_name
 from public.verse_strong_links v
 join public.strong_lexicon_releases lr
   on lr.id=v.lexicon_release_id
   and lr.rights_status='approved' and lr.publication_status='published'
 join public.strong_tagging_releases tag
   on tag.id=v.tagging_release_id
   and tag.rights_status='approved' and tag.publication_status='published'
 join public.lab_bible_edition_availability bible
   on bible.code=v.edition and bible.available=true
   and bible.rights_status in ('approved','public_domain')
 left join public.strong_hebrew h on h.release_id=v.lexicon_release_id
   and h.strong_number=v.strong_number
 left join public.strong_greek g on g.release_id=v.lexicon_release_id
   and g.strong_number=v.strong_number
 left join public.strong_lexicon_translations tr
   on tr.release_id=v.lexicon_release_id
   and tr.strong_number=v.strong_number and tr.locale='pt-BR'
   and tr.translation_status in ('machine','reviewed')
 where (select auth.uid()) is not null
   and v.edition='KJV' -- alignment to original-language tagging, NOT Portuguese word mapping
   and v.review_status='approved'
   and p_chapter_id ~ '^([1-9]|[1-5][0-9]|6[0-6]):([1-9][0-9]{0,2})$'
   and v.chapter_id=p_chapter_id and v.verse_number=p_verse_number
   and p_verse_number between 1 and 176
   and (h.strong_number is not null or g.strong_number is not null)
 order by v.token_ordinal,v.strong_number
 limit least(greatest(coalesce(p_limit,48),1),48)
$$;

revoke all on function public.lab_strong_verse_lookup(text,integer,integer)
 from public,anon,authenticated;
grant execute on function public.lab_strong_verse_lookup(text,integer,integer)
 to authenticated;
