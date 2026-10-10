# LAB Architecture v0.1
## Boundaries
- `lab-app/src/domain`: deterministic biblical canon and annual plan, no external dependencies.
- `lab-app/src/App.tsx`: temporary UI prototype; checkbox state is in-memory only.
- Future persistence: Supabase PostgreSQL with per-user RLS, immutable completion events and idempotency keys.
- Gamification derived from verified completions, never used as a spiritual merit measure.
## Migration safety
- Legacy CRMIMOBI remains under `project/` and `supabase/` on the reconstruction branch until all files and external resources are inventoried.
- Do not run legacy Supabase migrations against LAB.
- Never delete hosted databases, storage or credentials as part of Git repository cleanup.
## Acceptance gates
- 66 books, 1189 chapters, no missing or duplicate chapter IDs.
- 365/366 days and correct year boundaries.
- Unit tests, build, RLS tests and accessibility before deployment.
## Open decisions
- Daily distribution: current implementation is sequential and balanced; AT/NT/Psalms parallel streams from the original LAB are not yet implemented.
- Bible translation and licensing, group privacy, authentication and notification providers.
