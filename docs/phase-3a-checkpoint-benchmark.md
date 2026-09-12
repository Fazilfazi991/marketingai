# Phase 3A checkpoint and controlled provider benchmark specification

Date: 2026-09-12. Branch: `codex/growth-agent-v1`.

This report supersedes the earlier Phase 3A HOLD states. It records the verified
Preview data foundation and the next benchmark contract. It contains aggregate
facts and stable evidence identifiers only; the real KAAM evidence artifact and
raw analytics rows remain outside Git.

## Checkpoint data boundary

- Preview project: `cwamjlqqacjfppnqquuw`; Production was not used.
- Website inventory: eight unique inspected pages from the approved KAAM host
  family. The inventory is bounded and is not proof of exhaustive crawl coverage.
- GA4 requested 2026-07-18 through 2026-09-11. Sixteen dates contain observations,
  from 2026-08-26 through 2026-09-11; 40 requested dates are unavailable.
- The date-only GA4 property report records 136 active users, 180 sessions, and
  1,154 page views. Page-level users and sessions are non-additive and must never
  be summed to claim site totals.
- Search Console requested 2026-07-17 through 2026-09-10. Fourteen dates contain
  final observations, from 2026-08-28 through 2026-09-10: 34 query/page rows,
  122 impressions, and **0 measured clicks**. The zero is an observation, not a
  missing value.
- Search Analytics coverage remains incomplete even though request pagination was
  exhausted. Provider row selection, anonymized queries, and source behavior mean
  the stored rows cannot be presented as an exhaustive export.
- A complete previous 28-day period does not exist. Comparison questions must fail
  closed; missing dates must not become zeroes and no trend may be fabricated.
- No empty report may be published. No conversion, lead, paid-advertising,
  WhatsApp, or causal performance claim is supported by this snapshot.

The deterministic snapshot digest is
`9ca1bf11711c5177b03b0045dce2d3a3ac3258d3f099d2388c81378a9c6040b6`.
The corresponding JSON remains at an explicitly selected path outside the
repository and is not a Git input.

## Enforced capability matrix

| Capability | State | Boundary |
| --- | --- | --- |
| Website health | Partially supported | Bounded inspected-page snapshot only |
| Website performance | Partially supported | Current incomplete GA4 snapshot; no trend |
| Google visibility | Partially supported | Stored final GSC rows; not exhaustive |
| Page opportunity | Partially supported | Only an evidence-linked recommendation |
| Query opportunity | Partially supported | Impression-weighted stored-row opportunity |
| Missing-data question | Supported | Deterministic source-state explanation |
| Current vs previous period | Insufficient data | No complete comparable previous period |
| Weekly recommendations | Insufficient data | `week` is unresolved by the current period resolver |
| Ads | Out of scope | No advertising evidence |
| WhatsApp | Out of scope | No WhatsApp evidence |

The model layer may not override these states. A provider response is rejected if
it cites unavailable evidence or bypasses an insufficient-data result.

## Shared benchmark input

All eight cases use the same normalized business context, deterministic evidence
snapshot, capability state, empty or identically bounded conversation context, and
question-specific prompt. No model receives raw database access. The benchmark
harness disables fallbacks and makes at most one attempt per case/model.

Common evidence references are:

- GA4: `analytics.activeUsers`, `analytics.sessions`,
  `analytics.screenPageViews`.
- Search totals: `search.clicks`, `search.impressions`.
- Search opportunities: the available `search.opportunity.*` facts.
- Website inventory: the available `website.*` inspected-row facts.
- Recommendations: only `recommendation.0`, and only when all of its evidence
  references are included in the case.

Common prohibited claims: historical improvement or decline without comparable
periods; fabricated zeroes; conversions or leads; ads or WhatsApp performance;
causality; guaranteed gains; additive page-level GA4 totals; exhaustive Search
Console coverage; work having been executed.

## Eight benchmark cases

### 1. Website performance

- **Question:** How is my website performing?
- **Evidence references:** GA4 facts and bounded `website.*` facts.
- **Mandatory facts:** 136 active users, 180 sessions, 1,154 page views; 16 observed
  GA4 dates; page metrics are non-additive.
- **Optional interpretations:** A concise current snapshot and inspected-site health
  description, explicitly framed as limited coverage.
- **Allowed recommendation IDs:** none unless the case evidence contains every
  reference required by the recommendation.
- **Missing-data disclosures:** 40 requested GA4 dates unavailable; no previous
  period, conversion, attribution, or causal evidence.
- **Prohibited claims:** the common prohibited claims above.

### 2. Google performance

- **Question:** How are we doing on Google?
- **Evidence references:** `search.clicks`, `search.impressions`, and
  `search.opportunity.*`.
- **Mandatory facts:** 0 measured clicks, 122 measured impressions, 14 observed
  final dates, and 34 stored query/page rows.
- **Optional interpretations:** Limited visibility and evidence-linked opportunity.
- **Allowed recommendation IDs:** `recommendation.0` only when cited with its fact.
- **Missing-data disclosures:** Search Analytics is not exhaustive and no complete
  previous period exists.
- **Prohibited claims:** treating zero clicks as missing or the rows as all searches,
  plus the common prohibited claims.

### 3. Page priority

- **Question:** Which page should I improve first?
- **Evidence references:** `website.*`, search totals, and search opportunities.
- **Mandatory facts:** State the exact evidence IDs behind any selected page.
- **Optional interpretations:** Select only the page attached to an allowed,
  evidence-linked recommendation.
- **Allowed recommendation IDs:** `recommendation.0` when all references validate.
- **Missing-data disclosures:** No conversion attribution or complete trend history.
- **Prohibited claims:** inventing service-to-page attribution, traffic loss, or a
  page recommendation absent from the supplied evidence.

### 4. Query opportunity

- **Question:** Which search query has the strongest opportunity?
- **Evidence references:** search totals and `search.opportunity.*`.
- **Mandatory facts:** Preserve the selected opportunity fact's position and its
  evidence ID; disclose 0 measured clicks and incomplete coverage.
- **Optional interpretations:** Explain why the highest-ranked supplied opportunity
  is worth review without promising an outcome.
- **Allowed recommendation IDs:** `recommendation.0` when its reference is cited.
- **Missing-data disclosures:** The stored query set is not exhaustive.
- **Prohibited claims:** unsupported query volume, conversions, causality, or rank
  improvement forecasts.

### 5. Current focus

- **Question:** What should I focus on right now?
- **Evidence references:** website, GA4, and Search Console facts.
- **Mandatory facts:** Any priority must cite available evidence and preserve its
  coverage limitation.
- **Optional interpretations:** One concise, evidence-linked current priority.
- **Allowed recommendation IDs:** `recommendation.0` when references validate.
- **Missing-data disclosures:** No implied weekly or previous-period comparison.
- **Prohibited claims:** presenting an unsupported broader plan or completed work.

### 6. Current-data summary

- **Question:** What can you tell me from the data we currently have?
- **Evidence references:** the available business, website, GA4, and GSC snapshot.
- **Mandatory facts:** Distinguish measured values, measured zero, unavailable dates,
  and incomplete Search Analytics coverage.
- **Optional interpretations:** A short executive snapshot of supported observations.
- **Allowed recommendation IDs:** `recommendation.0` when references validate.
- **Missing-data disclosures:** Previous period, conversions, attribution, ads, and
  WhatsApp are unavailable or out of scope.
- **Prohibited claims:** the common prohibited claims above.

### 7. Missing information

- **Question:** What information are you missing?
- **Evidence references:** source availability plus existing website, GA4, and GSC
  facts so measured zero is not mislabeled.
- **Mandatory facts:** Previous-period history is insufficient; GA4 has 40 missing
  requested dates; GSC has incomplete coverage; zero GSC clicks is measured.
- **Optional interpretations:** Explain which additional evidence would unlock trend,
  conversion, attribution, ads, or WhatsApp analysis.
- **Allowed recommendation IDs:** none required.
- **Missing-data disclosures:** This case is itself the disclosure response.
- **Prohibited claims:** calling any available measured fact missing.

### 8. Previous-period improvement

- **Question:** Has my traffic improved compared with the previous period?
- **Evidence references:** current GA4/GSC facts and source coverage states only.
- **Mandatory facts:** A complete comparable previous 28-day period is unavailable,
  so improvement or decline cannot be determined.
- **Optional interpretations:** Offer the available current snapshot without a trend.
- **Allowed recommendation IDs:** none.
- **Missing-data disclosures:** Explicitly disclose insufficient comparable history.
- **Prohibited claims:** any positive, negative, or percentage trend.

## Grading and budget

Score each response for factual fidelity, missing-data honesty, unsupported claims,
recommendation quality, conciseness, and instruction following. Record end-to-end
latency, returned token usage, and actual cost where determinable. Unknown token or
cost values remain `unknown`/`null`, never zero.

The intended pool is DeepSeek V4 Flash, DeepSeek V4 Pro, and GLM 5.3 Flash, subject
to the verified runtime registry. The initial routing hypothesis is Flash for
routine, Pro for complex/multi-source, and GLM as runtime fallback; the benchmark
must test rather than assume this policy. During benchmarking fallback is disabled.

Maximum first pass: 8 cases × 3 models = **24 provider calls**. This document does
not authorize those calls. No provider credential is configured, no paid call has
been made, and Ask Agent remains disabled.
