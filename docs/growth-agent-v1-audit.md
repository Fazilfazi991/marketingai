# Growth Agent V1 — repository audit and migration plan

Audit date: September 11, 2026. Base: 17861ca, branch codex/growth-agent-v1.
Scope: source code, committed SQL migrations, existing tests, and previously captured timing evidence. This is not a new live-database verification.

## A. Current-state findings

The app is an operational marketing workspace with a results-only client portal, not yet a dedicated Growth Agent product.

- Public root is a sign-in/demo-role page with operational marketing copy; there is no commercial acquisition form.
- Client routes are Overview, Leads, Traffic & SEO, Reports. Overview leads with metrics/charts; the agent is a floating assistant.
- Admin has client setup, business knowledge, connections, SEO/blog workflows, reports, assets, social operations, and task management. Staff landing is a posting queue.
- Real-data loaders already distinguish demo from live data and restrict published reports.
- Request infrastructure exists historically but is disabled: the results-only migration removed client request policies and the request-to-task trigger/function.
- The assistant answers from aggregate dashboard context and a short supplied message history. It does not yet have configured identity, structured memory, persisted client-agent threads, or a supervised action workflow.
- No full customer conversation/thread ingestion, unread/inbound reply state, question clustering, website crawler, Core Web Vitals collection, uptime monitoring, or measured website-health score was found.
- There is no durable PRODUCT.md/DESIGN.md in the starting repository; visual rules are spread across several cascading stylesheets.

Evidence: src/components/app-shell.tsx; src/app/page.tsx; src/components/client-executive-overview.tsx; src/components/client-workspace.tsx; src/app/staff/page.tsx; src/lib/client-results.ts; src/app/api/client/assistant/route.ts; supabase/migrations/20260908163942_results_only_client_permissions.sql.

## B. Features/components to keep

- Next.js App Router, Supabase Auth, existing tenant membership/RLS boundaries.
- Request-scoped result loading, streamed sections, pending controls, retry states, lazy assistant, safe-area work.
- Range/source consistency helpers and tests; truthful zero/one-point chart states.
- GA4/Search Console import infrastructure and provenance records, subject to aggregation corrections below.
- Leads, ingestion idempotency/site authentication, qualified/general attribution.
- Published reports and historical records, with scope-appropriate presentation.
- Business profiles, services, locations, verified FAQs, connections, existing admin setup.
- SEO pages/keywords/tasks, supervised drafts, tasks/audit events, provider interfaces.

Reuse behavior and domain logic; do not preserve the old chart-first composition or accumulated CSS overrides as the new design system.

## C. Hide/defer for V1

Remove paid ads and social management/scheduling from client and commercial navigation, examples, capability claims, and default V1 report summaries.

Preserve legacy social records, approvals, assets, and internal workflows behind an explicit legacy boundary. Do not delete records or silently cancel existing jobs. Disabling live social schedules needs an inventory and a separately visible operational decision.

Do not imply active continuous monitoring merely because a connection record exists. Unavailable conversation analysis, uptime, indexing counts, or health scores show honest availability states, not demonstration numbers.

## D. Proposed information architecture

| Client destination | Primary job | Route |
| --- | --- | --- |
| Today | Read the briefing; review attention items and prepared work | /client |
| Ask Agent | Ask a question; send a structured request | /client/agent |
| Website | Understand health, conversion, and page improvements | /client/website |
| SEO & Google | Understand visibility and evidence-backed opportunities | /client/seo |
| Conversations | Review customer enquiries and follow-up needs | /client/conversations |
| Results | Review verified changes, completed work, and reports | /client/results |

Mobile bottom navigation: Today, Agent, Website, SEO, More. More exposes Conversations, Results, account, and support. Preserve old deep links with parameter-aware redirects or compatible views.

Admin client workspace: Overview, Agent, Website, SEO, Analytics, Conversations, Requests, Activity, Settings. Configuration remains admin-only; staff receive assigned work, not configuration permissions.

Public homepage: Growth Agent positioning, clearly illustrative briefing preview, four V1 areas, supervised service explanation, enquiry form; sign-in is secondary.

## E. Component/system changes

Build a scoped Growth Agent shell rather than adding another global CSS override.

Shared components: AgentIdentity, Briefing, AttentionItem, RecommendationCard, ApprovalDecision, RequestProgress, EvidenceReference, SourceAvailability, ActivityFeed, supporting MetricSummary/Trend, MobileNavigation, and contextual Ask Agent links.

Today starts with identity and a concise briefing, then attention and prepared actions. Counts come from actual records. A finding is not an action; a connected source is not an active agent job. Secondary results load independently.

Use a consistent type/spacing/control system, keyboard focus, 44 px touch targets, restrained color, content-driven card heights, readable mobile labels, and reduced-motion support.

## F. Database/backend changes required

Extend existing models before adding duplicates:

- client_requests: safe client insert/read, controlled transitions, staff assignment, public replies versus internal notes, task links, updated/completed timestamps, idempotent submission.
- agent_profiles: configured name/instructions/style, allowed/restricted actions, approval rules, versioning; admin writes, client-safe projection.
- growth_objectives: targets, units, baseline, period, priority, owner.
- recommendations and decisions: evidence links, immutable revision, risk level, publication/approval state, reviewer, requested changes; approvals apply to a specific revision.
- agent_threads/messages: persisted client-agent conversations, separate from customer conversations; tenant/user access, retention.
- customer_conversations/messages/events: provider identity, webhook event idempotency, channel, timestamps, reply/handoff state, restricted contact details.
- website_observations/scans and conversation_insights: explicit source, observed period, counts/denominators, freshness, evidence references.
- agent_memory: typed facts/strategy/preferences/learnings with provenance, verification, supersession, retention; client-safe summaries, not raw staff notes.
- client activity projection over real imports/runs/tasks/decisions, excluding raw audit metadata and secrets.
- public commercial enquiries: bounded server endpoint, abuse controls, private storage and admin review; never anonymous access to client workspace records.

All additions need tenant-scoped SELECT/INSERT/UPDATE checks, transition validation, cross-client tests, and isolated migration verification. Do not restore the old broad client operational policies.

## G. AI/agent architecture changes required

Existing AIProvider and DashboardAnswerProvider already support OpenAI-compatible transports, but duplicate provider concerns and have different capabilities/fallbacks.

Evolve toward: task -> authorized, versioned context -> model router -> validated structured result -> reviewable recommendation -> persisted memory/activity.

Build typed task adapters (briefing, question, request triage, SEO recommendation, conversation insight), source references, deadlines, retries, durable rate limits, cost metadata, and provider capability checks. Keep provider keys and calls server-side.

Treat website/chat/customer text as untrusted content. No model output directly authorizes writes, changes approval rules, or publishes work. Return facts, recommendations, missing data, and limitations separately. Deterministic fallback must not masquerade as a completed AI investigation.

Important existing defect: prepareSeoReview maps generated strings to keywords by array index modulo keyword count. Replace with validated evidence IDs before exposing those recommendations as grounded.

## H. Performance and data risks discovered

Previously measured authenticated baseline: login 10.718 s; warm primary DOM approximately 3.7 s; date switches 4.7–5.5 s; navigation 3.4–4.1 s. See docs/interaction-p0.md for methodology and sample limitations.

17861ca has parallel membership reads, scoped loaders, streaming, pending feedback, and zero-request Traffic view switches. Authenticated after timings remain unverified; do not claim these baseline delays still represent the current branch.

Preview compute was verified hnd1; Supabase remains Tokyo. Health endpoint samples after relocation: 682/284/126 ms versus baseline 888/750/752 ms. These are service/network samples, not SQL timings or proof of end-user latency.

Additional code findings:

- Each assistant request authorizes then loads broad dashboard context; avoid repeated identity work in route handlers with an explicit request context.
- Google sync processes integrations sequentially; Google fetch and general AI generation lack explicit overall deadlines.
- GA4 requests date + pagePath activeUsers, then sums page-level users into daily totals. A visitor across pages can be counted more than once; obtain site-level aggregates separately. Period unique users also cannot be inferred by adding daily unique counts.
- Search Console import uses a fixed 25,000-row request without pagination and query/page dimensions; do not equate the returned subset with complete property totals.
- Existing health means integration status, not measured website health.
- Growing results histories need query bounds, pagination, appropriate indexes, and payload budgets.

These findings require targeted tests and upstream source validation before correcting stored historical data. No silent backfill or rewriting published reports.

## I. Controlled implementation plan

1. Foundation: establish product/design contract; new navigation, mobile shell, evidence-backed Today; retain old Results view and routes.
2. Ask Agent + requests: configured identity, persistent threads/requests, supervised decisions and public progress, tenant tests.
3. Website: real source availability, conversion/page summaries; add measured scan ingestion before health claims.
4. SEO & Google: evidence-linked opportunities; correct source aggregation/coverage; secondary charts.
5. Conversations: connector ingestion, reply/handoff states, consent/retention, real recurring-question insights and FAQ recommendations.
6. Results + Activity: source-backed comparisons, client-safe event feed, completed improvements distinct from recommendations.
7. Admin/staff: admin configuration and knowledge; assigned work/request management for staff; preserve legacy operations separately.
8. Agent context/model layer: consolidate transports, task schemas, structured memory and validation. Put minimal context contracts in place in phase 2 rather than waiting for phase 8.
9. Hardening: authenticated timing, slow-network, desktop and 390 x 844 QA, physical keyboard QA, isolation/security and migration tests.

Public positioning and enquiry form ship alongside the foundation/requests work, not as an untracked tenth phase. Each phase has tests, explicit availability states, and a Preview gate. No Production deployment.

## J. Risks / migration considerations

- Feature hiding is not deletion; published historical reports must not be silently edited to erase previous social work.
- Current client route allowlist must change with navigation; otherwise valid new routes redirect away.
- Broadening client access can expose internal notes/credentials; create explicit projections and narrow write paths.
- Existing staff are publishing staff, not administrators. Confirmed: keep configuration admin-only.
- Request retries and approval races must not create duplicate work or execute outdated recommendations.
- Conversation data adds privacy, retention, deletion, and provider-credential requirements.
- Do not imply continuous monitoring, completed actions, causal lift, or safe health from missing data.
- Preserve the pending authenticated performance release gate and roll back by feature route/flag, not destructive schema removal.

## Confirmed implementation preferences

Code-first. Admin-only configuration; staff assigned work. Public CTA opens a new enquiry form.

Selected direction: Client Dossier (first option), confirmed by the user. Code-first implementation.

Pending: commercial enquiry notification owner; conversation connector/retention details; isolated database environment for additive migration validation.
