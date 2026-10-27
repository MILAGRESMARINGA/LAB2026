-- Supporting indexes for high-volume Strong linkage lookups and FK maintenance.
create index if not exists verse_strong_links_lexicon_release_id_idx
  on public.verse_strong_links (lexicon_release_id);

create index if not exists verse_strong_links_tagging_release_id_idx
  on public.verse_strong_links (tagging_release_id);
