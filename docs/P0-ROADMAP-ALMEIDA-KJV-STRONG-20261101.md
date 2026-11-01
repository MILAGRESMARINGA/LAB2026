# LABGame 3.0 — P0: Almeida 1911 + KJV + Strong

Date: 2026-11-01. Canonical project: MILAGRESMARINGA/LAB2026 main / lab-app.

## Public corpus
- **ALM1911** (Portuguese) is the primary reader. Source: https://www.gutenberg.org/ebooks/62383.
- **KJV** (English) is a secondary comparison and verse-coordinate reference. It is **not** a Portuguese King James translation.
- **STEPBible TAHOT/TAGNT/TBESH/TBESG**, original Hebrew/Aramaic/Greek, licensed under **CC BY 4.0** with visible credit, modified by LABGame for canonical Strong normalization and Portuguese QA glosses. Source: https://github.com/STEPBible/STEPBible-Data.
- NVI, NAA, ARA and NTLH are excluded from the public product. Their data was preserved internally but made unavailable through production Supabase RLS metadata on 2026-11-01: available=false, rights_status=pending, rights_evidence_url=null. Do not re-enable without a separate explicit rights decision.

## Release boundaries
1. Apply staged Strong migrations only after a recent **restored backup** of live public+Auth state. The existing GitHub backup workflow previously failed and does not establish this gate.
2. Confirm pinned source artifact SHA-256 independently against original immutable STEPBible commits. The metadata hashes in database alone are not a fresh comparison.
3. Apply source-provenance backfill (446,231 records) separately. The label source_verified_stepbible denotes verified source, NOT exegesis by a human.
4. Apply the lexical machine-QA sample without pretending human_reviewed or editorial_reviewed status.
5. Promote exact canonical STEPBible releases using the guarded manual SQL file. No publication in migration itself.
6. Verify RLS via authenticated test account and ALM1911 Genesis 1/John 1 on mobile; turn on VITE_LAB_STRONG_READY only when actual data is visible with proper credit.
7. No new paid service or account required.

## P0 — Authentication and launch roadmap

| Priority | Requirement | Engineering | Operational acceptance |
| --- | --- | --- | --- |
| P0.1 | Verified backup and isolated restore, retention, rollback plan | Workflow and scripts exist | Run successfully against current production and securely retain full backup |
| P0.2 | Signup and e-mail verification/OTP | Local Supabase Auth tests passed | Real inbox delivery, exact callback allowlist and correct templates |
| P0.3 | Login/logout + session persistence | Code and local CI | Two accounts on desktop and Android, cross-login RLS |
| P0.4 | Reset-password/expired token | Code and local CI | Real provider, link returns to same approved app domain |
| P0.5 | Profile, privacy, notification preferences | Schema deployed in database | Verify preferences and opt-outs on genuine test profiles |
| P0.6 | Export, journey reset and password-confirmed deletion | Code and local tests | Deploy account-delete after backup; test GC safeguards without deleting real users |
| P0.7 | 365-day journey, XP, rankings and reader | V2 features and test cases | Real mobile UI and production readiness test |
| P0.8 | Strong with Portuguese assistant gloss | UI and guarded SQL prepared | Provenance promotion, RLS, live test and feature-flag enabling |
| P0.9 | Vercel app deployment/monitoring | Vercel project exists | Preview acceptance, public release, rollback + monitoring |

**Important:** program/code CI success is not a production release. Account-delete and live e-mail verification need explicit real-world tests. Protected Bible translations must remain unavailable. Do not claim full release until all operational gates are satisfied.
