# Goal 3B runtime recovery and Preview recovery gate

Date: 2026-09-12
Branch: codex/growth-agent-v1
Preview: Growth1000 Preview (cwamjlqqacjfppnqquuw)
Production was not accessed.

## A. Runtime recovered

Exact Git blobs from codex/goal-3b-seo-blog-factory:
- src/lib/website-inventory.ts
- src/lib/seo-intelligence-service.ts
- src/lib/blog-factory-service.ts
- src/lib/ai/monthly-blog.ts
- src/lib/admin-growth-data.ts
- src/app/admin/growth-actions.ts
- src/app/admin/seo/page.tsx
- src/components/admin-growth-workspaces.tsx
- src/lib/website-inventory.test.ts
- src/lib/seo-intelligence-service.test.ts
- src/lib/blog-factory-service.test.ts
- src/lib/migration-security.test.ts

All 12 local blob hashes equal the source branch. No unrelated Goal 3B files recovered.

## B–C. Missing job behavior and recommendation

REFRESH_WEBSITE_INVENTORY:
- Explicit admin UI/server action only; active admin membership and client ownership required.
- Requires enabled SEO service and configured public website.
- External reads: bounded HTTP/HTTPS website crawl, max 40 pages, 4 sitemaps, 8-second request timeout, 1 MB response, same-host redirects, DNS/private-address SSRF blocking.
- Database writes: website_inventory_runs and seo_pages only. Records completed/failed state.
- No AI dependency, scheduler, n8n trigger or website publication.

BLOG_FACTORY:
- Explicit admin UI/server action only; active admin membership and client ownership required.
- Reads verified business knowledge, services, locations, website inventory, Search Console-derived opportunities and existing blogs.
- Requires AI_API_KEY with optional AI_BASE_URL/AI_MODEL, or runtime/VERCEL_OIDC_TOKEN with optional AI_GATEWAY_MODEL.
- External write: AI provider POST only. Database writes automation_runs and content_items.
- Selects evidence-backed, non-duplicate topics; fails instead of inventing quota content.
- Generates status=needs_review with boundary=admin_review. No CMS, website, Storage or publication write.
- AI provider retries only 408/429/500/502/503/504, maximum three attempts with incremental delay. A failed automation run is recorded; rerunning is a deliberate admin action. There is no automatic job retry.

Job rows:
- Canonical configuration: active, manual_trigger=true, recurring_schedule=false, schedule/next_run_at/n8n_workflow_id NULL.
- Generic n8n runner rejects both workflow keys; due-job claimant requires non-NULL next_run_at.
- Recommendation: restore exactly as active/manual-only operational entries. Active does not schedule or execute them.
- Autonomous website/blog publishing remains absent and disabled.

## D–E. Verification

- Goal 3B direct tests: included in full suite and passed.
- TypeScript: PASS.
- ESLint: PASS.
- Vitest: 36 files, 161 tests PASS.
- migration/security: 7 tests PASS.
- Production build: PASS (Next.js 16.3.4).
- Phase 1 and Phase 2 compile; Growth Agent tests passed. No recovered file overlapped the uncommitted Growth Agent UI/workflow files.

## F. Preview backup/export

Authenticated project-scoped read-only connector; transaction_read_only=on.
CLI export was aborted because the CLI account resolves only unrelated project refs. It was not linked or reconfigured.
Logical export stored outside Git:
C:/Users/User/AppData/Local/Temp/growth1000-preview-backup-4727122e737a433eb70439c92835f726

Captured:
- exact 41-table application data (105 rows)
- full public/private application catalog, functions, policies, grants and default ACLs
- Auth recoverability counts
- Storage database metadata
- absence of supabase_migrations.schema_migrations
- restore SQL and source row hashes

Auth users/identities/sessions/refresh tokens: 0.
Storage buckets: 1; Storage objects: 0. Therefore no object bytes existed to export.
No credentials, tokens or passwords were captured.

## G–I. Disposable restore

Restored into a separate PostgreSQL 17.11 loopback-only disposable cluster using platform stubs, observed hosted defaults, the 26-file pre-Phase-2 chain, and exported Preview data.
- 41/41 application tables restored
- 105/105 rows restored
- semantic content comparison: zero mismatches (timestamps normalized to the same instant)
- catalogs match: 464 columns, 175 constraints, 90 indexes, 89 policies including Storage, 13 application functions, 7 triggers, 2 enums/6 labels, table/function/schema/default ACLs
- application functions match body, arguments, volatility, security-definer, search_path, strict/parallel/leakproof and EXECUTE ACL
- Storage bucket supported fields match; no Auth rows or Storage bytes to restore
- Preview pgcrypto remains correctly in extensions; local standalone pgcrypto placement is a platform-only difference

Measured schema plus data recovery: 3.120 seconds after a fresh local server became ready.
Observed fresh cluster initialization/start adds about 10 seconds; approximate end-to-end local recovery is 13 seconds.
This proves application recovery, not reconstruction of Supabase-managed infrastructure from scratch.

## J. Adoption manifest

See docs/preview-migration-adoption-manifest.md. It classifies every pre-Phase-2 file without asserting historical execution.

## K. Exact proposed remote execution order

Do not use db push for the empty-ledger transition.

1. Verify the hard target cwamjlqqacjfppnqquuw; abort on yzxhckeyktgxpflnrtne or any other ref.
2. Announce maintenance window; freeze application and automation writes.
3. Repeat encrypted read-only export; verify checksums and complete a restore smoke check.
4. Begin one explicit fail-fast transaction with lock_timeout and statement_timeout.
5. Execute 20260911230214_preview_reconciliation.sql manually. Verify two manual-only jobs and zero anon/authenticated TRUNCATE privileges.
6. Commit reconciliation. If any assertion fails, roll back and unfreeze without ledger changes.
7. Create/adopt the migration ledger through CLI repair, using the explicit manifest versions only; record pre-Phase-2 versions and 20260911230214. Goal 3B is adopted only now because its missing jobs are represented.
8. Execute 20260911204412_growth_agent_conversations.sql manually in its own fail-fast transaction. Verify legacy rows, new objects, RPCs, RLS and privileges before commit.
9. Record 20260911204412 applied only after its transaction commits.
10. Run migration list and full catalog/data/security verification; then unfreeze and begin hosted QA.

Why safe despite timestamp sorting: reconciliation is manually applied and recorded before Phase 2; Phase 2 is then manually applied and recorded. No db push sorting occurs during ledger bootstrap. The final ledger contains both exact versions, and later ordinary pushes have no pending out-of-order file.
This exact order was rehearsed in a disposable clone: 28 ledger rows, 45 application tables, six total jobs including two Goal 3B jobs, and zero public tables truncatable by anon/authenticated.

## L. Exact changeset

- supabase/migrations/20260909152843_goal_3b_seo_blog_factory.sql — recovered canonical history; never rerun against Preview.
- supabase/migrations/20260911230214_preview_reconciliation.sql — two missing Goal 3B jobs plus approved TRUNCATE hardening.
- supabase/migrations/20260911204412_growth_agent_conversations.sql — Phase 2.
- docs/preview-migration-adoption-manifest.md — exact adoption classifications and exceptions.

The 12 runtime/test files in section A ship with the application branch, but are not remote database commands.

## M. Recommendation

GO for the controlled Preview-only reconciliation after explicit final approval and a fresh backup/freeze at execution time.
No Preview writes occurred in this gate. No hosted users created. No Vercel changes or deployment. Production deployed: NO.
