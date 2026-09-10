# Client mobile UI system refinement

Goal 3B remains paused. This batch refines the client presentation only; no production deployment is authorized.

## Reusable presentation

- `ClientPageHeader`: one title, client/month context, integrated range/report control, back navigation and expandable freshness. Removes the client workspace eyebrow.
- `ClientMetricGrid`: grouped metrics, two mobile columns for sources/traffic and three report columns.
- `ClientLeadHero`: prominent enquiry count with label below, compact qualification counts, contextual comparison, 56px trend (previously 80px), and source chips.
- `client-ui.css`: client-scoped 16px mobile / 28px desktop gutters, readable hierarchy, visible focus rings, and 44px primary controls.
- Leads uses a 2x2 source grid, interactive donut and Latest Leads. Traffic preserves all four tabs and replaces the connection warning with expandable native details. Reports separates the PDF action from the title and groups its KPIs.

## Data guardrails

No changes to queries, analytics calculations, GA4/GSC ingestion, lead architecture, tenant/RLS policies, AI grounding, routes or Goal 3A. The existing previous-period lead count is exposed as optional presentation context; percentages are not capped. A known baseline below 10 and a change of at least 100% uses the exact absolute difference and baseline. Unknown baselines are never inferred from rounded percentages.

Existing history behavior is retained: no invented daily history or missing historical values. Demo mode is explicitly labelled. The source grid displays the unclassified residual as Other when the supplied unfiltered demo source list omits it; current demo residual is zero.

## Measurement and visual review

Comparison at exactly 390x844, same September 2026 demo data. Before: parent commit `be5db63598b37665aad29e82e791ceb95b228cbf` Preview. After: local optimized production build (not a production deployment).

Measured `.page` content height, rounded to pixels; this is not the document height or device chrome. Overview has a separate scroll rail to protect content from the AI launcher.

| Page | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Overview | 2104 | 1969 | 6% |
| Leads | 1417 | 992 | 30% |
| Traffic & SEO | 1120 | 739 | 34% |
| Reports | 1155 | 820 | 29% |

The source KPI group shrank from 396px to 178px; traffic KPIs from 667px to 267px; report KPIs from 348px to 69px. Overview's first card begins at y=179 instead of y=318. The green hero is about 253px versus 266px in the empty-history demo state. Actual populated-chart height depends on available data; the chart's configured height is reduced by 30%.

Before/after viewport PNGs for all four pages are saved outside the repository in the task's `client-mobile-system` visualization directory. They are not committed.

## Verification

- All four pages: 390x844 and 1280x800; no horizontal document overflow, one H1, no CLIENT WORKSPACE eyebrow, aligned content edges.
- 7D/30D/90D buttons update range and totals; shared selector updates consistently.
- Source donut selection updates its center; source drilldown preserves period and displays the filtered count.
- Traffic Keywords/Pages/Opportunities navigation and overflow checks pass.
- Report month selection updates label and metrics; PDF action is separated and has a 44px target.
- Assistant opens with zero launchers and one header close button, then returns the launcher on close. Launcher lies outside the Overview scroll rail; composer remains visible.
- TypeScript, ESLint, 117 tests across 27 files, optimized Next.js build and git whitespace checks passed. UI pattern detector returned no findings.

Limitations: demo data, not a fresh authenticated-client QA session. Physical Android/iOS and software-keyboard behavior were not tested. Native PDF dialog was not invoked. The connection-status details branch was reviewed in source, not exercised against a disconnected live account. No claims of new ingestion/security validation beyond the existing regression suite.

Production remains untouched. Feature-branch Preview is the only release target.
