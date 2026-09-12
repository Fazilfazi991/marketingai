# Phase 2 hosted QA gate

Target: Growth1000 Preview, `cwamjlqqacjfppnqquuw`, organization Growth1000.
Forbidden target: `yzxhckeyktgxpflnrtne` (AI Marketing / Production).

## Pre-migration audit, 2026-09-12

Chrome profile zorx confirmed the Preview project identity. Its database migrations page displays “Run your first migration”, with no migration history listed. Its public schema nevertheless contains 41 tables and existing data. The repository contains 26 canonical migration files. This is **not established as simply behind**; migration provenance must be reconciled before applying migrations.

Existing baseline tables include organizations, profiles, organization_members, clients, client_members, client_requests, notifications, audit_logs, business profiles/services/locations/FAQs, content operations, delivery operations, automation, analytics and social_monthly_strategies. Presence alone does not certify columns, policies, grants or function definitions against the canonical baseline.

`client_requests` exists with 8 columns and an estimated 0 rows. Phase 2 tables `agent_conversations`, `agent_messages`, `request_events`, and `agent_internal_notes` are absent from the 41-table public inventory.

Preview also contains `seo_reviews` and `website_inventory_runs`, neither referenced in this branch's canonical migration files. These are concrete drift/provenance findings, not authorization to remove them. Estimated existing counts include 2 clients, 1 organization, 15 content items, 3 leads and 29 audit records. The provenance of that data has not been established. No data was copied, changed or deleted.

Authentication UI displays no user rows, but also an estimated total of 10 users. Treat identity count as unresolved, not verified zero. Public profiles and membership tables show estimated zero rows. No QA identities have been created.

## Environment gate

Prior verified Vercel configuration: default Production/Preview points to Production; only `codex/goal-3b-seo-blog-factory` has the confirmed Preview override. `codex/growth-agent-v1` mapping has not been configured or certified in this pass. Do not deploy it. No local Supabase credentials or CLI linking were changed.

## Safety guard

`scripts/qa-project-guard.mjs` rejects every ref except the exact approved Preview ref. URL validation rejects Production, non-HTTPS, other hosts, credentials, paths, queries and fragments. Future hosted migration/seed/mutation runners must invoke it before network I/O. It does not intercept arbitrary manually executed CLI commands.

Verification: `node --test scripts/qa-project-guard.node-test.mjs` (2 passing tests covering valid and rejected refs/URLs). No remote mutation runner was executed.

## Stop condition

Stopped before migration, seeding, environment changes, commit, push or deployment because existing schema and recorded migration history do not align. Next step requires approval for read-only schema/provenance reconciliation and a reviewed non-destructive adoption plan. Do not blindly mark historical migrations applied or replay the entire chain over existing tables.

Hosted workflow/security/retry/populated UI QA remain pending. Prior local Phase 2 test results are not hosted certification. Physical Android/iOS keyboard checks remain pending. Production is untouched.
