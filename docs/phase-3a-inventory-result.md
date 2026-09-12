# Phase 3A — real Preview inventory result

> Superseded by [the Phase 3A checkpoint and benchmark specification](phase-3a-checkpoint-benchmark.md)
> after controlled Google ingestion. This file preserves the earlier website-only gate.

2026-09-12. Supersedes the inventory/login HOLD in `phase-3a-data-security-gate.md`.

## A. Security regression

18 actual Google API/action boundary tests passed. No remote Google ingestion was run. Existing tenant guards and fail-closed webhook scope remain in place.

## B–C. Inventory and findings

User explicitly approved enabling only SEO for Growth1000 QA Business in Preview. A single `seo` scope row was added for client `40000000-0000-4000-8000-000000000001`, organization `10000000-0000-4000-8000-000000000001`. Other clients/scopes were not modified.

The authenticated disposable QA admin triggered **Refresh website inventory** in the local admin SEO screen after selecting that client. This was manual, unscheduled and non-publishing.

- Preview project: `cwamjlqqacjfppnqquuw`.
- Run: `ebbccb68-53cb-487d-9971-42073e372f21`.
- Stored starting URL: `https://kaamcareer.com`.
- Final canonical host: `https://www.kaamcareer.com` (within the approved host family).
- Started: 2026-09-12 09:55:03.041756 UTC.
- Finished: 2026-09-12 09:55:10.920 UTC; status completed, run error null.
- Discovered: 15 URL candidates; inspected: 9 results; persisted: **8 unique pages**. The homepage was encountered under the non-www and www variants and upserted to one final URL. Do not call these nine unique pages.
- Unique paths: `/`, `/candidates`, `/employers`, `/how-it-works`, `/about`, `/contact`, `/privacy`, `/terms`.
- All eight returned HTTP 200 and were marked indexable by the limited HTML check. All had a title, meta description and H1. This is not a robots/GSC indexation guarantee or a live uptime guarantee.
- Homepage, about and contact share the same title and meta description: an observed metadata-reuse finding, not evidence of poor rankings or traffic loss.
- Encoded apostrophes remain in two stored descriptions (`&#x27;`): parser normalization limitation, not a website defect.
- Skip/failure URL lists are returned by the crawler internally but not persisted by the existing workflow. Exact skipped/failed page counts cannot be independently reconstructed from this run; a null run error must not be described as proof that every discovered URL succeeded.
- Every stored row in the run has the expected QA client ID. No demo rows were used for evidence.

The SEO workspace initially failed because its loader ordered inventory runs by nonexistent `created_at`. Both the canonical migration and Preview use `started_at`; the local loader now uses that column. No schema migration was needed or executed.

## D–I. Google properties

GA4 stored property: `545982719`. Search Console stored domain property: `sc-domain:kaamcareer.com`.
Both remain unsynced. Existing Preview environment verification found `GOOGLE_SERVICE_ACCOUNT_JSON` absent. Access, GA4 stream identity, production/test classification, earliest/latest dates and query/page coverage remain unverified. The public KAAM site is not automatically an approved analytics-copy source. No Google permission changes or credential additions were made.

## J. Ingestion decision

**Not approved / not ready.** Provision the separately approved read-only service account securely, verify property ownership and access, and determine whether these are real Production KAAM properties. Any production-analytics copy requires explicit approval before ingestion.

## K–L. Real evidence and capabilities

`node scripts/phase3a-inventory-evidence.mjs` read the persisted Preview rows and executed the actual `addWebsiteEvidence`, `routeGrowthIntent`, and `growthCapability` functions in memory. It asserts non-demo client identity, approved hostname, row ownership, emitted fact provenance, recommendation references and zero GA4/GSC rows. This verifies the pure evidence/capability layer on real rows; it does not impersonate a client or claim an end-to-end client-auth context-loader test.

Eight website facts were emitted, each referencing an inspected row ID and timestamp. No Google metrics, period changes, demo data, or recommendations were fabricated. The current deterministic checks found no missing-title/description/H1 or HTTP-error priority, so no linked recommendation was emitted. Prioritization wording now fails safely rather than treating HTTP 200 alone as enough to recommend a page.

| Question | Actual capability |
| --- | --- |
| How is my website? | Limited: inspected HTTP-status snapshot only |
| Which pages exist? | Inventory paths available; bounded, not exhaustive |
| Which pages need attention? | Insufficient linked recommendation evidence |
| What should we inspect first? | Insufficient evidence to prioritize |
| What information are you missing? | Supported deterministic availability explanation |
| How are we doing on Google? | Insufficient data |
| Why did traffic change? | Insufficient data; no comparable observations |

## M–N. Final checks

308/308 Vitest tests PASS (42 files). TypeScript, ESLint, production build and `git diff --check` PASS. No provider test uses paid calls. Existing model configuration remains gated; Flash served-version ambiguity remains blocked rather than silently substituted. Domain-wide Preview ownership check: eight KAAM rows, zero attached to another client.

## O. Files changed in this completion pass

- `src/lib/admin-growth-data.ts`: correct inventory timestamp ordering.
- `src/lib/growth-agent/capability.ts`: require linked recommendations for attention/inspection-priority questions.
- `src/lib/growth-agent/website-evidence.test.ts`: two priority-without-findings regressions.
- `scripts/phase3a-inventory-evidence.mjs`: fixed-target read-only real-evidence replay.
- This report. Earlier uncommitted Phase 3 changes are preserved.

## P. Checkpoint decision

**READY TO COMMIT as a local website-only Phase 3A checkpoint.** Real bounded inventory exists, row isolation is verified, evidence remains honest, Google access is explicitly unavailable, and final checks pass. This is not approval to enable AI or ingest Google data. No commit, push, merge or deployment was performed.

Production modified: NO
Production deployment: NO
Main merged: NO
Google data ingested: NO
Provider credentials added: NO
Paid AI calls made: NO
Ask Agent AI enabled: NO
