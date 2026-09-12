# Phase 3 provider decision + implementation gate

2026-09-12 · `codex/growth-agent-v1` · local, uncommitted, unpushed.

## Important decision: V4 Flash is not the currently served Flash model

Official DeepSeek documentation now states that the old `deepseek-v4-flash` alias
serves **DeepSeek V4.1 Flash**, with the V4 model retired. The current canonical
Flash identifier is `deepseek-flash`. Neither is silently approved by this change.
The requested V4 Flash routing slot exists, but its network configuration is blocked.
No new model was substituted and no default route was silently changed to Pro.

Verified native API contracts:

| Requested slot | Verified API identifier | Endpoint | Implementation state |
| --- | --- | --- | --- |
| DeepSeek V4 Flash | No currently served V4 identity verified; legacy alias redirects to V4.1 | `https://api.deepseek.com/chat/completions` | Blocked pending model-version approval |
| DeepSeek V4 Pro | `deepseek-v4-pro` | `https://api.deepseek.com/chat/completions` | Adapter implemented; credentials/calls disabled |
| GLM 5.3 Flash | `glm-5.3-flash` | `https://api.z.ai/api/paas/v4/chat/completions` | Adapter implemented; credentials/calls disabled |

Sources: [DeepSeek models](https://api-docs.deepseek.com/quick_start/pricing/),
[DeepSeek chat contract](https://api-docs.deepseek.com/api/create-chat-completion/),
[GLM model](https://docs.z.ai/guides/vlm/glm-5.3-flash),
[GLM chat contract](https://docs.z.ai/api-reference/llm/chat-completion).
Public docs verify API names, not account entitlement or actual service latency.
Documentation extracts are local research cache files under ignored `.firecrawl/`.

## A. Interfaces

Extended the existing `AgentProvider` with an optional `generateGroundedAnswer`
capability, preserving the existing pending-team provider and transactional workflow.
`DeepSeekProvider` and `GLMProvider` implement the common grounded contract. Their
legacy `answer` method still returns pending-team; it does not invent a response.
The routed provider adds an internal `call` method returning normalized output and
token usage. Domain code contains no vendor SDK calls.

## B–C. Adapters

Both use a bounded, non-streaming, server-only JSON chat transport, bearer auth,
4,096 output-token limit, strict endpoint/model allowlists, and redirects disabled.
Response bodies are capped at 64 KiB. Empty/malformed JSON, non-stop termination,
tool calls, refusals and unapproved configuration fail safely. No tools are sent.

DeepSeek Pro uses enabled thinking/high reasoning. GLM Flash uses enabled thinking/
low reasoning; official GLM docs say thinking cannot be disabled. These are initial
parameters for benchmarking, not measured latency claims. No response reasoning
content is retained, displayed or forwarded. JSON mode is not assumed to be strict
schema enforcement: the same application validator runs after either provider.

## D. Deterministic router

The initial configurable policy is:

- Routine question/follow-up: DeepSeek Flash slot.
- Conflicting change signs, multiple evidence periods, 12+ facts, or deep reasoning
  with at least two evidence domains: DeepSeek Pro slot.
- The question capability gate runs before routing; missing relevant evidence does
  not become an expensive model call.
- Availability, requests and unsupported intents do not use an LLM.

The router consumes intent, evidence domains/size, period complexity, conflict,
reasoning need, conversation type, configured availability and prior failed slots.
It returns a selected slot/reason; the registry resolves provider/model. No model
is called to choose another model. Clients still see one Growth Agent.

With today's verified registry, the retired Flash slot is unavailable. If calls
are approved later and GLM credentials are configured, the explicit configured
fallback may select GLM; metadata records that fallback. At present NO calls occur.

## E. Fallback

- Flash → GLM.
- Pro → Flash → GLM, skipping unavailable/previously failed slots.
- Default maximum: two attempted calls, each 20 seconds. Policy can select one to
  three attempts and 100–30,000 ms per attempt; no unbounded retry/route loop.
- Timeout, unavailable/auth failure or invalid output can proceed to the configured
  alternative. Invalid-request errors stop rather than repeat bad input elsewhere.
- Each attempt receives a fresh clone of the same server evidence snapshot.
- All-failed results are truthful and do NOT claim that a message was saved.
  This pass is detached from persistence; the later UI integration can mention a
  saved message only after the existing transaction returns its real receipt.
- No adapter/router imports a database mutation function. Fallback cannot create
  duplicate messages or requests because it never creates either.

## F. Normalized response

`answer`, `whyItMatters`, `facts`, `recommendations`, `evidence_refs`, `confidence`,
`missing_data`, `suggested_action`, `provider_metadata`.

Facts and recommendations are selected from the original deterministic snapshot,
not generated by the provider. The provider returns prose, existing evidence IDs,
one existing recommendation ID (or null), and a quality label. Extra metrics/facts
fields are rejected. Suggested actions only identify a supervised request proposal.
The context capability can downgrade confidence regardless of the provider's label.

## G. Prompt/evidence safeguards

- One provider-neutral system message; distinct JSON sections for business, current
  question, structured evidence, bounded conversation, and untrusted website content.
- Raw website content is currently excluded. Business/page strings and conversation
  text remain untrusted data and never become system instructions.
- Runtime field projection drops unexpected context properties. Tenant identifiers,
  credentials, leads, staff notes and arbitrary operational rows are not sent.
- Six recent messages, 600 characters each; a 24,000-character prompt data budget.
- Same numerical/reference/shape checks after every attempt, including fallback.
- Clone isolation prevents an adapter from modifying evidence for itself or the next
  provider. Output facts are copied from the original snapshot.
- Demo client records are now rejected even when application demo mode is disabled.
- These mechanical checks are NOT proof of semantic correctness or complete prompt-
  injection resistance. Human factual review/adversarial live evaluation is required
  before client activation. The model has no execution tools regardless of prose.

## H. Server-only credential/configuration contract

No environment files or settings were changed and no keys were added.

| Variable | Meaning / default |
| --- | --- |
| `GROWTH_AGENT_ALLOW_PROVIDER_CALLS` | Defaults false; must explicitly be true after separate approval |
| `GROWTH_AGENT_DEEPSEEK_API_KEY` | Native DeepSeek API key, server-only |
| `GROWTH_AGENT_GLM_API_KEY` | Native Z.ai Model API key, server-only; not a Coding Plan endpoint |
| `GROWTH_AGENT_DEEPSEEK_FLASH_MODEL` | Leave unset: currently blocked; both retired alias and unapproved replacement rejected |
| `GROWTH_AGENT_DEEPSEEK_PRO_MODEL` | Optional exact `deepseek-v4-pro`; registry default matches |
| `GROWTH_AGENT_GLM_FLASH_MODEL` | Optional exact `glm-5.3-flash`; registry default matches |
| `GROWTH_AGENT_ROUTING_POLICY` | Optional strictly validated JSON policy; defaults described above |

No `NEXT_PUBLIC_*` provider variables. No generic `AI_API_KEY`, OpenAI or implicit
Vercel OIDC fallback is used by this layer. No arbitrary endpoint override is
accepted; a reseller/other region would require a separate verified adapter review.
No key should be pasted into chat or committed.

## I. Benchmark harness and observability

`benchmarkGrowthProviders` is internal server code with a separate approval argument,
default false, plus the configuration/credential gate. No UI or automatic CLI trigger.
Up to ten evidence/question cases, same normalized prompt digest across every slot,
one call per configured candidate and no fallback during comparisons. Unavailable
slots are explicitly `not_run` rather than assigned fabricated scores.

Output supports mechanical contract/evidence checks, response length, response review,
latency and token counts. Human factual fidelity, usefulness, conciseness, unsupported-
claim and instruction-following grades start null. A passing shape check does not
award a semantic quality score. Use marked synthetic fixtures for offline tests;
approved controlled-property evidence for meaningful hosted evaluation.

Per-attempt logs: authenticated org/client scope, requested provider/model, routing
reason, intent, evidence domains, elapsed time, outcome/failure category, fallback
flag, input/output token counts when returned. Cost is null, not zero: cache/peak
pricing and account billing have not been benchmarked. No secrets, full prompts,
provider error bodies or reasoning traces are logged. No live benchmark was run.

## J. Actual Preview website/SEO data

Read-only CLI queries targeted only `cwamjlqqacjfppnqquuw`.

| Preview business type | Pages | Inspected pages | Keywords | SEO reviews | GA4 / GSC / published reports |
| --- | ---: | ---: | ---: | ---: | --- |
| Demo client | 3 | 0 | 4 | 0 | All 0 |
| Non-demo QA client | 0 | 0 | 0 | 0 | All 0 |

Thus NO legitimate hosted website/SEO analytical capability can yet be claimed for
the non-demo QA client. Demo records can support labelled fixture demonstrations,
not real business conclusions. Both non-demo Google integrations have nonempty
property references and `connected` labels but null last-sync timestamps/statuses.
Their ownership/access is unverified; a simple placeholder-pattern check found no
obvious placeholder, which does not prove access or legitimate data.

## K. GA4 ingestion

Admin `saveGoogleIntegrations` stores numeric property ID/configuration. An approved
service account needs read access to that QA property, configured by server-only
`GOOGLE_SERVICE_ACCOUNT_JSON`. `getGoogleAccessToken` requests read-only analytics
and Search Console scopes. `syncGoogleClient` calls GA4 runReport with date/pagePath,
activeUsers/newUsers/sessions/screenPageViews, stores `analytics_page_daily`, then
page-summed `analytics_daily` and import/sync metadata.

The scoped `syncGoogleNow(clientId)` admin action checks organization, active
non-demo client and deletion state, and requests the preceding 90 days through
yesterday. This is a viable population path AFTER QA property ownership and read
permissions are verified. It was not run.

## L. Search Console ingestion

Same admin configuration and service-account flow, with a verified `sc-domain:` or
URL property. Search Analytics fetch uses date/query/page, final data, row limit
25,000, then upserts `search_console_daily` with clicks/impressions/CTR/position and
sync/import metadata. No verified access or sync has been performed in this pass.

Ingestion limitations to address before strong analytical claims: no complete
pagination at provider limits, query anonymization, incomplete-day coverage and
page-summed GA users/sessions. Missing rows must not automatically become zeros.
The generic `/api/automations/google-sync` authenticates an admin but uses a broad
service-role path for selected/all clients; unlike the scoped admin action it does
not constrain target clients to that admin's organization. Review/harden before
multi-organization use. It was neither invoked nor changed here.

## M. Published report history

`admin/reports/actions.ts::regenerateReport` deterministically aggregates a selected
month and saves `needs_review`; `publishReport` is the explicit admin publication
step. The separate monthly-report automation uses the pre-existing generic AI
provider, also saving `needs_review`; do NOT run it merely to populate this gate.
`report-store.ts` is a demo-only client store, not hosted history ingestion.

Important: existing report preparation uses zero-coercing metric helpers, so generating
a report with no observations can create misleading zero-valued history. Fix or
explicitly preserve availability before using that pathway for grounded QA. Do not
publish generated empty reports as evidence. No reports were generated/published.

## N. Minimum meaningful real QA dataset / safe connection

Use a controlled, non-customer test website owned/authorized by the user, with its
own GA4 and verified Search Console properties; do not copy Production analytics.
Verify the existing refs correspond to those properties before approving any sync.

- One non-demo QA business profile, verified services/claims and public website.
- A completed, recent inventory of at least a homepage and two meaningful pages;
  one independently verifiable technical/SEO observation for an improvement case.
- For a current snapshot: real GA4/GSC observations with known source coverage.
- For the current 28-day comparison path: two contiguous 28-day periods (56 completed
  days) of genuine observations. If a newer property lacks them, test missing-history
  behavior instead; collecting visits now cannot create past Search Console history.
- Query/page relationships with real impressions/clicks/positions; no invented demand.
- For report comparisons: two genuinely measured, reviewed, published months and
  explicit requested-period handling (still a separate implementation gate).

Admin actions exist for Google configuration/sync, inventory refresh, SEO review and
report generation/publication. Website inventory requires enabled SEO service scope
and the profile website. All population is pending explicit target/data approval.

## O. Runtime capability matrix

| Question | Required evidence | Non-demo Preview now |
| --- | --- | --- |
| How is my website? | Inspected page facts and/or measured analytics | Insufficient data |
| Which pages exist? | Verified inventory/page records | Insufficient data |
| How are we doing on Google? | Actual GSC evidence, not unrelated keyword rows | Insufficient data |
| How did organic traffic change? | Relevant current/prior comparable analytics/search evidence | Insufficient data |
| Which page has an SEO opportunity? | A real recommendation linked to relevant page/query facts | Insufficient data |
| What should I improve? | Relevant evidence-backed recommendation | Insufficient data |
| What data do you not have yet? | Source availability state | Supported, deterministic, no model |
| Please fix my page | Existing supervised workflow | Request routing; AI does not execute/save work |
| How are my ads/WhatsApp doing? | Out-of-scope sources | Unsupported |

`growthCapability` runs before the model router, with source relevance, comparison,
recommendation and period checks. Existing 28-day context refuses unresolved
week/month/year questions rather than quietly answering for a different period.

## P. Verification

- Vitest: **274/274 tests passed**, 40 files (54 tests added in this pass).
- TypeScript: PASS. ESLint: PASS. Optimized production build: PASS.
- `git diff --check`: PASS (line-ending notices only).
- Built `.next/static` scan: neither provider API-key configuration name found.
- All provider transport/evaluation tests use explicit synthetic fixtures and mocked
  HTTP, never live provider credentials.
- No browser/hosted AI QA is claimed: no UI/routes were connected or deployed.

## Q. Files

Changed tracked files: `.gitignore` (local research cache), `src/lib/agent-service.ts`
(optional interface capability only). Existing local foundation changed:
`context.ts`, `context.test.ts`; historical report marked superseded.

New in `src/lib/growth-agent/`: `model-config.ts`, `model-router.ts`, `prompt.ts`,
`providers.ts`, `capability.ts`, `routed-analysis.ts`, `benchmark.ts`,
`provider-routing.test.ts`. This report is `docs/phase-3-provider-decision.md`.
All earlier Phase 3 foundation files remain local and uncommitted too.

## R. Recommended next approval

1. Decide whether to approve V4.1 Flash in place of retired V4 Flash, or select another
   explicitly verified serving endpoint/version. Do not set the retired alias meanwhile.
2. Approve the exact controlled QA business/site, GA4 property and Search Console
   property; verify permissions, then approve scoped ingestion/inventory population.
3. Review missing-data report semantics and ingestion boundaries before building history.
4. Separately approve server-only credentials and a small bounded benchmark budget.
5. Review benchmark/data results BEFORE approving any Ask Agent AI/UI connection.

Production modified: NO. Production deployed: NO. Main merged: NO.
Paid AI calls made: NO. Ask Agent AI enabled: NO. Commit/push: NO.
