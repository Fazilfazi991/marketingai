# Phase 3A data and security gate — historical HOLD

> Superseded by [the Phase 3A checkpoint and benchmark specification](phase-3a-checkpoint-benchmark.md).
> This file preserves the earlier gate evidence and must not be read as current data state.

Audit date: 2026-09-12. Branch: `codex/growth-agent-v1`. Local, uncommitted, unpushed.
This report supersedes earlier Phase 3 verification counts, not their historical results.

## A. Google-sync security regression

18 tests pass against the actual POST handler, real sync implementation with mocked Google transports, and scoped admin Server Action. The test database deliberately has no simulated RLS: query predicates must enforce the boundary themselves.

Covered: eligible own client; cross-organization denial; malformed and nonexistent IDs; missing membership; inactive admin; active/inactive staff; inactive/deleted/demo clients; missing/invalid integrations; organization-scoped batch mode; webhook fail-closed behavior; service-role webhook isolation; scoped admin action.

Session-admin paths now retain the session database client, rather than escalating ingestion to service role. Webhook use requires a valid secret AND server-configured `GOOGLE_SYNC_ORGANIZATION_ID`; absent scope fails closed. No environment variable was added. Existing unscoped webhook integrations will require reviewed configuration before future deployment. Client eligibility and expected organization are rechecked inside the sync implementation. Integration references are validated before credential exchange or sync-state writes.

These are local regression tests, not certification of hosted RLS or a remote ingestion run. Reference: [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security). Current changelog reviewed; no relevant API migration required for this patch.

## B–C. Website inventory and inspected findings

Approved target: `https://www.kaamcareer.com`. Stored QA business website: `https://kaamcareer.com` (same approved host family).
Preview client: `40000000-0000-4000-8000-000000000001`, Growth1000 QA Business.
Preview organization: `10000000-0000-4000-8000-000000000001`.
Preview Supabase: `cwamjlqqacjfppnqquuw`. Production is forbidden.

Inventory NOT RUN: the manual admin workflow awaits authenticated QA admin sign-in at `http://127.0.0.1:3000`. No bypass or service-role inventory runner was used. The local server validates the exact Preview URL before startup, injects existing branch-specific Preview variables into process memory, and forces provider calls off; no env file was rewritten.

Fresh Preview SELECT: pages 0, inspected pages 0, GA4 rows 0, GSC rows 0, SEO reviews 0. Thus discovered/inspected/skipped/failure counts for a new run, titles, descriptions, findings, redirects and inspection timestamps remain unavailable. No new stored rows exist whose ownership can be certified. Do not present synthetic test fixtures as KAAM evidence.

Crawler changes required before execution: homepage always queued first; robots permission respected (failure to retrieve it fails closed); private/account/auth/API/action/query URLs excluded, including redirect targets; same-site host boundary retained; attempt count bounded to 40, sitemap reads bounded to 4, queue bounded; response streaming capped at 1 MB with timeout covering the body. 18 crawler tests pass. Manual-only workflow remains unscheduled and non-publishing.

## D–F. GA4

Stored property: `545982719` in both configuration and external reference; never synced.
Access verification: UNAVAILABLE. On 2026-09-12 at 09:31:22 UTC the isolated branch-specific Preview environment lacked `GOOGLE_SERVICE_ACCOUNT_JSON`. No Google token exchange or report request was made.
Production/test classification: UNVERIFIED. Property name, web stream association, earliest date and latest completed observation cannot be determined without authorized read access. Do not infer these from a connected label or stored numeric ID.

## G–I. Search Console

Stored property: `sc-domain:kaamcareer.com` in both configuration and external reference; domain-property form; never synced.
Access verification: UNAVAILABLE for the same missing service-account configuration.
Production/test classification: UNVERIFIED; the reference names the approved public domain but does not establish that the underlying analytics are a test dataset. No earliest/latest dates or query/page coverage verified.

## J. Google ingestion decision

NOT SAFE TO APPROVE YET. First configure the intended read-only Google service account in isolated Preview through a secure channel, separately approved; never paste credentials into chat. Then verify exact GA4 stream/domain and Search Console access. If the properties correspond to live KAAM production analytics, report `REAL PRODUCTION PROPERTY DETECTED` and request explicit data-copy approval. No ingestion is authorized by the present gate.

`scripts/phase3a-google-readonly.mjs` is an explicit fixed-target read-only verification runner. It asserts Preview identity before I/O; uses only readonly OAuth scopes; prints no credentials; reads metadata/dates only when approved domain matching succeeds; never writes to Supabase. It was run and exited at the missing-credential gate.

## K. Actual capability matrix

| Question | Current real-data capability |
| --- | --- |
| How is my website? | Insufficient inspected evidence |
| Which pages exist? | Insufficient inventory |
| Which pages have technical issues / need attention? | Insufficient inspected evidence |
| What should we inspect first? | No evidence-backed prioritization yet |
| How are we doing on Google? | Insufficient GSC observations |
| Why did traffic change? | No observations or comparable periods |
| What information/data are you missing? | Deterministic availability explanation supported |

## L. Deterministic evidence verification

Real KAAM evidence-builder run remains pending inventory. Unit tests verify that only dated inspected rows become website facts; missing database fields do not become missing-tag findings; recommendations reference emitted row facts; no Google metrics or changes are invented. The context loader projects only scoped inspection metadata, never full crawl content. Missing-information and inspection questions now route correctly. Recommendations are inspection priorities, not search-demand or traffic-loss claims.

Model architecture preserved. Exact accepted `deepseek-v4-flash` remains recorded but blocked pending served-version clarification/approval; no replacement model is silently selected. Pro and GLM identifiers are unchanged. No provider calls or credentials.

## M–N. Verification

- Full Vitest: 306/306 PASS, 42 files.
- TypeScript: PASS.
- ESLint: PASS.
- Production build: PASS (local build only).
- `git diff --check`: PASS; only Windows line-ending advisories.
- Browser: guarded local sign-in page loads; meaningful content and sign-in controls present; no Next error overlay.
- 33 built browser JavaScript chunks inspected: no provider secret-variable or private-key markers.
- No env files, screenshot files, temporary files or crawl/research caches among change candidates. Nothing staged; no commit or push.

## O. Files changed

This gate: `src/app/admin/automations/actions.ts`, `src/lib/google/sync.ts`, `src/lib/google/sync-security.test.ts`, `src/lib/website-inventory.ts`, `src/lib/website-inventory.test.ts`, `src/lib/growth-agent/context.ts`, `src/lib/growth-agent/evidence.ts`, `src/lib/growth-agent/intent.ts`, `src/lib/growth-agent/website-evidence.test.ts`, `scripts/phase3a-google-readonly.mjs`, `scripts/phase3a-qa-dev.mjs`, and this report.

Prior local Phase 3 changes remain preserved: provider/router/benchmark foundation in `src/lib/growth-agent/`, `src/lib/agent-service.ts`, Google API route hardening, report generation/publication and metric changes, `.gitignore`, and previous Phase 3 reports. No unrelated changes were reverted.

## P. Checkpoint decision

**HOLD**. Local tests pass, but successful real website inventory and real-row evidence isolation have not yet been demonstrated. Sign in to the local QA admin tab, run the bounded manual workflow, verify persisted row ownership, and run the deterministic evidence builder on that snapshot. Google access may remain honestly unavailable without blocking website-only QA, but ingestion must stay off.

Production modified: NO
Production deployment: NO
Main merged: NO
Google data ingested: NO
Provider credentials added: NO
Paid AI calls made: NO
Ask Agent AI enabled: NO
