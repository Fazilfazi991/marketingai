# Preview reconciliation audit — 2026-09-12

Target: Growth1000 Preview, cwamjlqqacjfppnqquuw. Branch: codex/growth-agent-v1.
No remote writes, Production access, Vercel changes, deployments, commits, or pushes.

## A. Recovered source
Recovered supabase/migrations/20260909152843_goal_3b_seo_blog_factory.sql from e5141ed, originally created in d8c73d7.
Git blob identity verified: 0a0ef6f3fb8aabcbead8b59dfb3b4cfbb0ebd210.
No unrelated feature code copied.

Goal 3B runtime files requiring separate recovery/review:
src/lib/website-inventory.ts, src/lib/seo-intelligence-service.ts, src/lib/blog-factory-service.ts,
src/lib/ai/monthly-blog.ts, src/lib/admin-growth-data.ts, src/app/admin/growth-actions.ts,
src/app/admin/seo/page.tsx, src/components/admin-growth-workspaces.tsx.
Related tests: website-inventory, seo-intelligence-service, blog-factory-service and migration-security.
These are not required to compile the database migration, but are required to provide its inventory/review/blog workflows. Do not enable those workflows merely because tables exist.

## B. Combined chronological chain
27 total; Phase 2 included exactly once:
1. 202609080001_growth1000_foundation.sql
2. 20260908101856_milestone_one_operations.sql
3. 20260908102640_milestone_two_social_operations.sql
4. 20260908103608_milestone_three_client_portal.sql
5. 20260908104408_milestone_four_blogs_seo.sql
6. 20260908105724_milestone_five_automation_foundation.sql
7. 20260908110557_milestone_six_ai_social_generation.sql
8. 20260908111330_milestone_seven_google_data.sql
9. 20260908112128_role_security_hardening.sql
10. 20260908113311_storage_delete_policies.sql
11. 20260908161500_results_first_scope.sql
12. 20260908163942_results_only_client_permissions.sql
13. 20260908182319_admin_audit_history.sql
14. 20260908185430_lead_ingestion_idempotency.sql
15. 20260908190045_transactional_social_completion.sql
16. 20260908190657_versioned_image_regeneration.sql
17. 20260908194429_generated_content_asset_policies.sql
18. 20260908211500_restrict_internal_generation_metadata.sql
19. 20260908214207_fix_polymorphic_audit_trigger.sql
20. 20260909020000_real_client_live_data.sql
21. 20260909053448_add_analytics_page_new_users.sql
22. 20260909065350_goal_3a_social_workflow.sql
23. 20260909104500_grant_monthly_social_completion.sql
24. 20260909141500_repair_staff_poster_storage_policies.sql
25. 20260909144500_allow_staff_social_production_transitions.sql
26. 20260909152843_goal_3b_seo_blog_factory.sql
27. 20260911204412_growth_agent_conversations.sql

## C. Disposable replay
Fresh PostgreSQL 17 cluster, loopback 127.0.0.1:55439:
C:/Users/User/AppData/Local/Temp/growth1000-canonical-5c4b061ebf2349a5929ecff065fad331
All 26 pre-Phase-2 migrations succeeded. Cloned pre-Phase-2 locally into legacy database.
Phase 2 succeeded on both empty requests and synthetic legacy requests.
Existing agent_workflow_test.sql passed, including reconnection persistence, tenancy, assignment, RPC authorization, events, retries and private notes.
This is PostgreSQL with Auth/Storage stubs, NOT hosted Auth/PostgREST/browser QA.
Hosted postgres/supabase_admin public defaults reproduced by hosted_defaults_stub.sql.
No remote data copied into local fixtures.

## D. Canonical counts
| Catalog | Pre-Phase-2 / Preview | After Phase 2 |
|---|---:|---:|
| Application tables | 41 | 45 |
| Columns | 464 | 496 |
| Constraints | 175 | 199 |
| Indexes (including constraint indexes) | 90 | 103 |
| Application functions | 13 | 24 |
| Policies including 6 Storage policies | 89 | 93 |
| Application triggers | 7 | 7 |
| Enum types / labels | 2 / 6 | 2 / 6 |
| Public/private sequences | 0 | 0 |

Standalone local pgcrypto contributes 36 additional extension functions (49/60 total local functions); excluded from APPLICATION function counts, not silently treated as missing application definitions.

## E. Four difference groups
1. Matching: all pre-Phase-2 application tables/columns/types/defaults/nullability, 175 constraints, 90 indexes, enums, 7 triggers, all 89 policies, table ACLs, schema ACLs and six default ACL entries match. All 13 application function definitions match exactly after CRLF normalization; arguments, security-definer, volatility, search_path, strictness, parallel/leakproof attributes and EXECUTE ACLs match.
2. Missing: Phase 2's four tables, 32 columns total (29 new-table columns plus 3 client_requests columns), 24 constraints, 13 indexes (5 explicit), 11 functions, and policy transition. Additionally Preview lacks REFRESH_WEBSITE_INVENTORY and BLOG_FACTORY automation jobs for its organization.
3. Preserve: all Goal 3B schema, all existing data/jobs/configuration, and pgcrypto in extensions (Preview 1.3). Local vanilla CREATE EXTENSION placed pgcrypto in public; do not relocate Preview's extension or copy its 36 functions into public.
4. Review: absent Goal 3B runtime; missing job intent/provenance; overbroad TRUNCATE defaults; historical data transformations cannot be proven executed from current schema; platform Auth/Storage internals and HTTP exposure are not certified by stub replay.

Normalization: ACL element order, public qualification in deparsed catalog expressions, CRLF. Function bodies were separately compared without stripping schema qualification. No policy, grant, status, default or function-attribute difference suppressed.
Query retained at supabase/tests/catalog_audit.sql. Public/private catalogs plus application Storage policies are the comparison boundary, not Supabase's internal schemas.

## F. Grants/security
Hosted public-table defaults grant ALL to anon/authenticated/service_role for both postgres and supabase_admin creators. This is explicit hosted default privilege configuration, not vanilla PostgreSQL's default public-table access. Matching current defaults does not make them least-privilege.
Phase 2 revokes ALL on its four new tables from anon/authenticated, then grants authenticated SELECT. Existing client_requests revokes authenticated INSERT/UPDATE/DELETE only: TRUNCATE (and other preexisting non-DML privileges) remains.
No public/private sequences exist. Schema USAGE and function ACLs match baseline. Application functions have explicit restricted EXECUTE ACLs; no application function retains PUBLIC EXECUTE. Pure Phase 2 private classifiers are not anonymous APIs.
Minimal proposed change revokes TRUNCATE only from PUBLIC, anon and authenticated on all 41 existing application tables and the two observed owners' future public tables. New Phase 2 tables already revoke it. service_role privileges are deliberately unchanged.
Local hardening test: zero public application tables remain truncatable by anon/authenticated.

## G. TRUNCATE assessment
RLS does not govern TRUNCATE: https://www.postgresql.org/docs/17/ddl-rowsecurity.html
PostgREST table API documents GET/POST/PATCH/DELETE operations, not arbitrary SQL/TRUNCATE: https://docs.postgrest.org/en/stable/references/api/tables_views.html
An anon API key alone is not a direct PostgreSQL login. No generic SQL or TRUNCATE RPC was found in the inspected application functions/call sites. Thus this is not evidence of an immediately exploitable anonymous HTTP truncate endpoint.
Nevertheless a future RPC, SQL injection or role-capable direct connection could expose the privilege; current RPC checks do not erase it. Revoke as defense in depth. No destructive remote probe was attempted.
Do not claim the broader HTTP/backend architecture has been penetration-tested.

## H. Legacy compatibility
Two synthetic preexisting requests: standard and arbitrary legacy type/status, old created_at.
After Phase 2: all original fields identical; conversation_id and latest_update NULL; updated_at populated; no fabricated events or conversations. New foreign keys and unique index compiled. New workflow tests demonstrated actual linked request/history creation.
Legacy requests become admin-readable only under the new policy, not client/ordinary staff readable; this deliberate behavior needs product acceptance. Legacy requests are not retroactively exposed as Ask Agent conversations.
Fixture/replay: supabase/tests/legacy_request_replay.sql.

## I. Exact proposed SQL
Drafts OUTSIDE migrations so db push cannot accidentally discover them:
- supabase/reconciliation/preview_truncate_hardening.sql
- supabase/reconciliation/preview_missing_goal3b_jobs.sql
Phase 2 remains the exact existing 20260911204412_growth_agent_conversations.sql; do not duplicate it inside reconciliation.
No pre-Phase-2 DDL reconstruction is needed. Missing jobs use ON CONFLICT DO NOTHING, never overwrite configuration/status. Locally first run inserted two; second inserted zero.
Job SQL proposes canonical active/manual-only jobs. DO NOT approve activation without runtime review. A paused alternative would be a consciously different product decision.
Hardening is proposed, not yet approved for Preview. No DROP CASCADE, reset, deletes, or remote execution.

## J. Honest migration-history adoption
The final surviving SCHEMA effects of all 26 historical files are materially represented; that proves equivalence, not execution chronology.
Storage client-assets bucket settings also match the historical insert (private, 50 MiB, exact MIME list).
20260909020000 data transforms: analytics/search-console tables currently empty, so no backfill needed; historical client_access transformation execution is unprovable. Preserve current valid statuses instead of rerunning.
Goal 3B's two job inserts are NOT represented. Do not mark it fully adopted until missing-job decision is resolved.
Adopt history only through a reviewed per-file manifest distinguishing schema equivalence, superseded definitions, current data acceptance and exceptions. Never describe adopted entries as proof that original SQL ran.
After backup/rehearsal and approval, CLI migration repair can initialize the tracking ledger and record individually accepted historical versions as applied. Test ledger creation in a disposable clone first. No direct invented tracking-table DDL.
Goal 3B keeps original timestamp; reconciliation gets a new CLI-generated timestamp and logs actual forward-only changes; Phase 2 keeps its own original version and is recorded only when actually applied.
Because Phase 2 sorts before a newly generated reconciliation, either approve an atomic ordered script (hardening/jobs then Phase 2, with accurate ledger recording) or explicitly approve Phase 2 then reconciliation in a maintenance window. Do not blindly db push an empty ledger.

## K. Backup and rollback gate
Before writes: verified QA-only connection; freeze application writes and automation; encrypted, access-controlled schema+data+roles/default ACL export including Auth/Storage metadata and migration ledger if present. Export Storage object bytes separately; a database dump does not contain those bytes. Do not commit exports or credentials.
Restore to a second disposable compatible cluster; compare catalogs, row counts, constraints, grants and application invariants; verify Storage restoration separately. Prove recovery time and obtain approval.
Use a single explicit transaction for reviewed SQL with ON_ERROR_STOP, lock_timeout and statement_timeout; precommit verification can abort the transaction. No external jobs should run during it.
After commit prefer forward fixes. Grant changes are reversible from captured ACLs; removing added jobs requires checking references and is not automatically authorized. Dropping Phase 2 after users write would lose data and is forbidden. Full restore after new writes requires a data-loss/replay decision.
No remote backup or restore performed in this pass.

## L. Future commands — NOT EXECUTED remotely
CLI inspected locally: Supabase 2.117.0. No linked/default project routing.
Only after all gates above and scoped authentication:
```powershell
npx --no-install supabase migration new preview_reconciliation
# Populate the generated file with APPROVED drafts; inspect chronological order.
# Adopt ONE reviewed historical version at a time; this example is NOT blanket authorization:
npx --no-install supabase migration repair 202609080001 --status applied --project-ref cwamjlqqacjfppnqquuw
# Repeat only exact versions accepted by the signed manifest, not an automatic file glob.
npx --no-install supabase db push --dry-run --skip-vault --project-ref cwamjlqqacjfppnqquuw
# STOP unless only the reviewed pending files and intended order are shown.
# Future execution command, gated and NOT run:
npx --no-install supabase db push --skip-vault --project-ref cwamjlqqacjfppnqquuw
```
The dry-run must use --skip-vault: this CLI says db push otherwise updates Vault before migrations.
Do not pass passwords on the command line, use --include-all, --include-seed, link another project, or treat these templates as ready-to-run approval.
Exact backup connection commands cannot be finalized without an approved authenticated QA-only export path; no credentials requested or printed.

## M. Safe to reconcile?
Schema is understood and Phase 2 is locally compatible. NOT yet cleared for remote execution.
Required decisions: Goal 3B jobs/runtime, legacy-request visibility, TRUNCATE hardening, adoption manifest and successful backup restoration rehearsal. No hosted QA users yet.
Wait for approval. Production deployed: NO.
