# Strong Lexicon Final Verification

Date: 2026-10-27
Scope: TBESH/TBESG lexicon releases and TAHOT/TAGNT Strong-link relinking.

## Source artifacts

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| TBESH | 3,288,045 | `464dccadd95fd8620dd05fa0d7a4caba58ec3c4d5db3ebf38e43d046ca25b591` |
| TBESG | 4,736,912 | `312f723d7b8ef263bbdfb0451c9b8057125804dfff390b6f8544cff2a84b57f4` |

The Strong parser correction is the canonical-fields-v2 implementation merged in PR #77.

## Loaded releases and relinking

| Dataset | Release rows | Relinked verse_strong_links |
| --- | ---: | ---: |
| TBESH v2 | 8,723 | — |
| TBESG v2 | 9,362 | — |
| TAHOT | — | 305,036 |
| TAGNT | — | 141,195 |
| Total | 18,085 lexicon rows | 446,231 links |

Legacy lexicon releases were retained for audit history. All active TAHOT and TAGNT links now point to the v2 releases, and no active link remains on a legacy lexicon release.

## Integrity gates

- 1,189 chapters present.
- 31,102 verses present.
- 1,189 chapters have Strong links.
- 31,102 verse coordinates have Strong links.
- 0 orphan links.
- 0 unresolved TAHOT coordinates.
- 0 unresolved traditional-code mappings.
- 0 invalid Strong-code links.
- 0 non-pending links; publication remains `draft` pending editorial approval.

## Editorial spot checks

The following 10/10 expected codes were found on their canonical coordinates:

- Genesis 1:1 — H7225, H1254, H430.
- Psalm 1:1 — H835.
- Psalm 1:2 — H1897.
- John 1:1 — G746 and G3056.
- John 1:14 — G4637.
- John 1:29 — G286.

Observed lemmas matched the expected entries, including בָּרָא for H1254, אֱלֹהִים for H430, ἀρχή for G746, λόγος for G3056, σκηνόω for G4637, and ἀμνός for G286.

## Reproducibility

Migration `lab-app/supabase/migrations/202610270001_strong_links_fk_indexes.sql` adds covering indexes for both Strong-link foreign keys. It was applied to the LABGAME Supabase project and the post-migration performance advisor no longer reports those two foreign keys as unindexed.

The remaining advisor findings are pre-existing items outside this lexicon release scope.
