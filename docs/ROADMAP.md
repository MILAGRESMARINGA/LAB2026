# LAB Roadmap

## Phase 0 — Safety and inventory
- [x] Create isolated reconstruction branch from main (main remains intact)
- [ ] Inventory all old files, deployments, secrets and database resources
- [ ] Remove old CRMIMOBI code from reconstruction branch only

## Phase 1 — Biblical engine
- [ ] Canon metadata: 66 books, 1189 chapters
- [ ] Verify coverage exactly once per annual cycle
- [ ] Leap year and timezone tests

## Phase 2 — Core app
- [ ] React + TypeScript + Vite clean scaffold
- [ ] Supabase schema with RLS
- [ ] Auth, daily reading, idempotent completion, progress

## Phase 3 — Gamification
- [ ] Streaks, achievements, opt-in leaderboards
- [ ] Missed-reading recovery without rewriting history

## Phase 4 — Community
- [ ] Groups, invitations, leader dashboards, privacy

## Phase 5 — Launch
- [ ] CI, E2E, security review, accessibility, backups, staging, production

No stage is complete until tests and acceptance criteria pass.
