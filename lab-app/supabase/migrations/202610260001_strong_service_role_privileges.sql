-- Restore the explicit ingestion privileges for the trusted service_role.
-- No client role receives access; publication remains gated by release status.

grant usage on schema public to service_role;

grant select, insert, update on table
  public.strong_lexicon_releases,
  public.strong_hebrew,
  public.strong_greek,
  public.strong_tagging_releases,
  public.verse_strong_links
to service_role;
