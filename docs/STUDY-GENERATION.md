# LABGAME study generation

The authenticated `study-generate` Supabase Edge Function is cache-first. It resolves the caller's bearer token through Supabase Auth, then uses a service-role-only RPC to read the active plan and Almeida 1911 verse data. It accepts only ordered chapter subsets from that verified day. PostgreSQL enforces the progressive thresholds: Layer 1 at 0 completed days, Layer 2 at 30, and Layer 3 at 90.

## Theological and exegesis rules

The editorial lens is evangelical Pentecostal Arminian: prevenient grace, a real human response that may accept or resist the call, progressive sanctification, the continuing gifts of the Spirit and premillennial hope only when Layer 3 and the text support it. The model first interprets each chapter in its own context. It connects readings only when a direct textual/canonical key is demonstrable, such as an explicit quotation, allusion or clear shared narrative link. If that connection is absent, it must keep the exegesis and applications separate by Bible reference and set `theological_connection` to `null`; it must not force one theme across unrelated readings.

The available RAG source in this runtime is the verified Bible text only. No human-author corpus has been ingested. Names such as Arminius, John Wesley, Adam Clarke, A.B. Simpson, R.A. Torrey, Andrew Murray, Finney, Bounds and Moody are research direction only; generated content may not invent or attribute quotations, page citations or positions to them. The prompt treats retrieved verse text as untrusted data and ignores instructions embedded in that text.

## Seeded content and layer readiness

The original migration seeds six curated studies, all in Layer 1 for days 1–3: Genesis 1 connected with John 1; Psalm 1 separate; Genesis 2–3 connected and John 2 separate; Genesis 4–5 connected and Psalm 2 separate. Layer 2 (leadership preparation) and Layer 3 (complete theology and eschatology) have no curated seeds at this time. They depend on authenticated generation after their respective 30/90-day unlock thresholds unless later curated seeds are added.

Do not describe these seeds as a full systematic theology course or as a complete public-domain-author library. Model-generated studies are not human-curated seeds.

## Cache, provider and quotas

Before any model call, the function searches published content for the exact day, layer and chapter set. A cache hit returns stored content without a generation reservation or provider call. Cache misses require `OPENAI_API_KEY`; when the secret is absent, the endpoint returns `study_generation_unavailable` and does not reserve quota.

Generated output uses a strict JSON schema, a 64,000-byte maximum retrieved prompt, a 1,200-token maximum output, a 25-second request timeout and `store:false`. The default provider model is `gpt-6-luna`. The database enforces at most 10 cache-miss generations globally per UTC day and 3 per user per UTC day. A key is idempotent; failed leases are released, and expired leases can be recovered after two minutes.

API calls may incur charges; no R$ 0 claim is made. The owner has authorized bounded API use. This cost policy does not create or upgrade a paid plan.

## Validation status

`npm run verify:engineering`, `npm test`, PostgreSQL 16/17 smoke tests and `deno check` use deterministic provider mocks and disposable databases. They do not prove live inference, production migration or Edge Function deployment. A CI green result is not production homologation.

## P1 editorial expansion prepared for review

Nine additional Layer 1 units for days 4–7 are prepared under
`lab-app/scripts/sql/seeds/p1-study-days-4-7.json`, with a generated additive SQL
seed that inserts drafts only. Psalm 3 has separate day-5 and day-6 identities to
match the 365/366-day plans. On 2026-10-18 the reviewed nine rows were inserted
and separately published in production: 15 published units now cover days 1–7.
The original six rows and V2 release flag were preserved. The seed is not an
automatic migration. See `P1-STUDIES-AND-GC-HOMOLOGATION.md` for review,
cache-hit verification and the concrete GC pilot acceptance cases.

The reader now loads published curated units under the caller's RLS before calling
`study-generate`. It preserves connected/separate units and checks complete,
nonoverlapping coverage against server-resolved chapter references. A cache query
error or partial editorial coverage never falls through to a paid generation.
No curated units retains the existing server-validated generation path.
