# Phase 3 — source audit and provider connection gate

> Historical first-gate report. The subsequent [provider decision and data gate](phase-3-provider-decision.md)
> supersedes the OpenAI recommendation below. The deeper Preview audit also established
> that its existing pages/keywords belong to the demo client, not legitimate live QA evidence.

Date: 2026-09-12. Branch: `codex/growth-agent-v1`.
Baseline: `13ed1f37e3a47aefe344ad2c77325c0e21af76aa`.
Scope: local foundation work and read-only Preview audit. No deployment or migration.

## A–F. Existing sources

| Area | Existing tables / implementation | Important limits |
| --- | --- | --- |
| A. Business | `clients`, `business_profiles`, `business_services`, `business_locations`, `business_faqs`; `business-knowledge.ts` | Profile includes offers, value proposition, target customers, tone, important/prohibited claims. Only verified FAQs. Operational tables are staff-only. |
| B. Website | `seo_pages`, `website_inventory_runs`, `website-inventory.ts` | Page metadata, canonical URL, H1, indexability, HTTP status, excerpt and inspection timestamp exist. Excerpts and internal notes must not be sent to the model. Stored status is not live monitoring. |
| C. GA4 | `analytics_daily`, `analytics_page_daily`, `google/analytics.ts`, `google/sync.ts` | Daily/page users are not deduplicated monthly users. Daily ingestion derives from page-level reports; do not promise deduplicated sessions across page rows either. Acquisition-channel and conversion attribution are not established by these schemas. |
| D. Search | `search_console_daily` | Date/query/page, clicks, impressions, CTR and position. Stored query rows are not a complete property total. Recompute CTR from clicks/impressions and weight positions by impressions. Provider limits/anonymized queries remain limitations. |
| E. SEO | `seo_keywords`, `seo_pages`, `seo_tasks`, `seo_reviews`, `seo-intelligence-service.ts` | Existing opportunity generation is reusable conceptually, but its zero coercion, incomplete-period assumptions and internal payload must not be reused blindly. A ranking record's update timestamp does not certify a measurement date. |
| F. History | Published `reports`; `client-results.ts`, report metric helpers | Explicit publication filter; actual recorded months/values only. No interpolated history or default-zero missing metrics. |

Exact read-only Preview counts: GA4 daily 0, GA4 page daily 0, Search Console 0,
published reports 0, inventory runs 0, SEO reviews 0, SEO pages 3, keywords 4.
The MCP connector denied SQL access; authenticated CLI SELECT queries succeeded.
No customer records or secrets were printed.

## G–H. Provider audit and recommendation

`agent-service.ts` has a pending-team provider interface, not connected intelligence.
`ai/provider.ts` contains a separate OpenAI-compatible provider used by generation
services, with a direct-key route and automatic Vercel OIDC/Gateway fallback.
That automatic fallback is deliberately NOT reused by the Phase 3 foundation.

Recommend **OpenAI `gpt-5-mini`** for one bounded structured interpretation call.
It supports structured outputs and function calling; tools remain disabled here.
The published rates are $0.25/million input tokens and $2/million output tokens.
Example: 4,000 input + 1,000 output tokens is approximately $0.003 before additional
reasoning output. Model latency and real output quality have not been measured.
This is a cost-conscious initial recommendation, not a comparative benchmark win.

Source: https://developers.openai.com/api/docs/models/gpt-5-mini

Expected pattern: deterministic classification and calculations; zero model calls
for requests, unsupported questions, missing evidence, or availability questions;
at most one bounded call for a supported analytical question, no automatic retry.

Effective branch Preview `AI_API_KEY` is empty; `.env.local` has no nonempty direct
AI key. Preview Supabase URL and both public/server keys were matched in memory to
`cwamjlqqacjfppnqquuw`; demo remains disabled. No environment values were changed.
Automatic deployment OIDC is not treated as explicit permission to activate a paid
gateway route. No model call or credential addition was performed.

## I–K. Foundation implemented

- `contracts.ts`: client/org scope, minimized business context, evidence facts,
  source states, separate recommendations, provider contract and structured answer.
- `context.ts`: server-only loader. Verified session, exactly one client membership,
  client lookup and conversation authorization precede any privileged source read.
  Every operational read has an explicit server-derived client filter and selected
  columns. RLS remains unchanged. Six messages maximum, bounded text/rows, no leads,
  secrets, internal staff notes or arbitrary crawl text. No API route exposes it.
- `intent.ts`: website, analytics, search, SEO, performance, work request,
  unsupported, and data availability. Classification never executes a request.
- `evidence.ts`: finite numbers, true zero versus absence, adjacent periods,
  withheld incomplete comparisons, impression-weighted query/page opportunities,
  stable packet-local evidence references, source/coverage limitations.
- `answer.ts`: abstract provider orchestration, missing-provider gate, timeout,
  context-size guard, reference/shape/numerical output checks, metadata-only logging,
  and a request DRAFT referencing server-built evidence. It does not save requests.

The source loader uses the latest 28 completed UTC days. Explicit week/month/year
questions are refused by the answer foundation until period resolution is added.
Reads that hit the row bound are withheld, not silently reported as complete totals.
This is a tested foundation, NOT completed end-user Phase 3 intelligence.

## L–M. Database and existing workflow

No new source models or database changes were made. Keep current staff-only policies.
The server-only projection is a deliberate data-minimization boundary, not a grant
of raw operational table access to clients. Before exposing it in an API, execute
real role/isolation probes against Preview, including membership revocation.

Later integration must extend existing conversation storage with durable structured
answers/evidence, uniqueness tied to the original message, and verified request
links. A reviewed migration is still required; do not store arbitrary model commands.
Reuse `agent_send`, `agent_manage`, receipts, idempotency, assignment, supervised
statuses, notifications and the approved Phase 2 UI. A generated draft is NOT a
saved request receipt.

## N. Controlled remaining sequence

1. Provider gate: configure an approved server-only credential in isolated Preview
   (never paste it into chat), or explicitly approve a verified gateway route.
2. Implement one live adapter using strict structured outputs and the grounding
   instructions. Verify model access without unrelated business data; benchmark
   quality, tokens, timeout, latency and cost. No default/fallback model routing.
3. Complete context slices for page analytics, inspected-page metadata, safely
   selected review/task findings and explicit requested-period resolution. Do not
   infer service/page relationships that are not stored.
4. Review durable answer/evidence persistence and request conversion migration;
   replay locally and test RLS before applying to Preview.
5. Integrate analytical answers/evidence/actions with Ask Agent; preserve request
   receipts and existing loading/error/retry behavior. No fake streaming.
6. Update Today only when real evidence-backed intelligence is available.
7. Hosted QA with retained identities, all seven questions, cross-client/security
   probes, real data gaps, adversarial prompts, desktop/mobile and measured latency.

## O. Release risks and limitations

- Preview has no real analytical history. Mock fixtures test mathematics, not actual
  business performance. Do not seed invented results and present them as real.
- Missing sync manifests mean observed-day coverage is not proof of complete ingestion.
- No measured conversion attribution or verified service-to-page mapping.
- Output shape/reference/numeric checks are conservative checks, NOT a proof against
  all semantic hallucination or prompt injection. Live adversarial evaluation remains
  mandatory. Retrieved text never grants execution authority.
- No provider adapter, API/UI hookup, answer persistence, rate-limit persistence,
  token accounting, durable request conversion, Today integration or hosted Phase 3
  QA is claimed complete. Request drafts cannot be mistaken for saved work.
- No cross-request shared cache is introduced; any later cache must include tenant,
  authorization context, source versions and period, with revocation considerations.

## Verification and handoff

- Full Vitest suite: 220/220 passing (58 new foundation tests).
- TypeScript, ESLint and optimized production build: PASS.
- Existing UI/routes were not modified; no new route exposes the foundation.
- Phase 3 hosted browser/provider QA: NOT RUN (provider gate).
- New local files remain uncommitted and unpushed on `codex/growth-agent-v1`.
- Supabase skill guidance informed the retained RLS boundary and explicit ownership
  checks. Official OpenAI documentation informed the provider recommendation.

Production modified: NO. Production deployed: NO. Main merged: NO.
