# Today dashboard refinement

## Contract

Preserve Client Dossier identity and routes; replace the sparse document composition with a compact operating dashboard. Mode: Operate. The user explicitly requests four KPI cards, performance + agent intelligence + attention + results + actions + conversations + activity together. This supersedes the previous first-viewport no-chart contract for Today only.

Desktop: header, four KPIs, two-column chart/briefing, attention grid, results/actions, conversations/activity. Mobile: header, 2×2 KPIs, briefing, attention, chart, results, actions, conversations, activity. Existing bottom navigation remains. Keep muted blue/purple, Geist, no decorative AI imagery, no invented claims. Immediate period-change feedback; chart switching is local.

## Source map before implementation

| Component | Existing source | Boundary |
| --- | --- | --- |
| Visitors | analytics_daily via existing results loader | Imported daily user aggregate; not period-deduplicated unique people. Missing observations are unavailable, not zero. |
| Organic clicks / impressions | search_console_daily | Selected-period aggregate; previous-period comparison not fetched. |
| Enquiries / qualified | leads | Existing quality/status definition; comparisons only with a supplied baseline. |
| Growth Overview | published reports analytics_summary | Traffic/Google monthly report history through selected end month; no missing months or synthetic daily interpolation. Enquiry report history is not exposed. |
| Attention | client_keyword_results | Latest recorded rank, not period-specific rank. No per-query impressions or impact score. |
| Results | selected totals, lead previousTotal, published report work_completed | Do not invent resolved issue counts or claim attribution. |
| Prepared actions | unavailable | Approval workflow later; do not say nothing needs approval when the queue is unavailable. |
| Customer conversations | leads sources only | Enquiry attribution is not a conversation count. Full threads/unanswered/topics unavailable. |
| Agent activity | unavailable | Published reports are separate team updates, never recast as automated scans. |

## Performance and scope

Reuse existing authenticated, tenant-scoped loader with a Today source subset: leads, analytics, search, keywords, reports, health. Existing queries run in parallel after workspace resolution. No model calls, new database queries, RLS changes, or external writes. Small client islands for dates and chart switching; no whole-page chat payload. Chart space reserved, no entrance animation. No production deploy or merge.

## Verification

- TypeScript, ESLint and production build passed. Final test suite: 129 tests across 30 files.
- Layout detector returned no findings before and after the structural changes.
- Desktop 1366×768 and 1440×900, mobile 390×844: no document horizontal overflow. Mobile order confirmed from DOM geometry and screenshots; lower sections checked separately. No visible major layout jumps in the exercised states; formal CLS not measured.
- Traffic/Google/Enquiries controls switch locally; empty enquiry history is explicit. Date selection immediately shows Updating results and disables conflicting changes, then replaces totals. August selection restricts report history through August; links carry resolved dates. A July-only history uses One recorded month, with no fabricated trend.
- Local demo sample via existing opt-in diagnostics: TTFB 27 ms, first contentful paint 204 ms, hydration 214 ms, zero API requests. One period switch completed in approximately 148 ms including automation overhead. These are local demo samples, not authenticated-production benchmarks. Existing route prefetching still occurs.
- Added tests cover missing report months, unavailable metrics versus measured zero, source attribution, zero-enquiry qualification, and monthly single-point wording.
- Full-page capture was unavailable; final valid viewport captures under `.impeccable/review/today-*.png` include desktop, mobile and lower-page sections. They remain Git-ignored QA artifacts.
- Independent review requested endpoint-label and monthly-unit fixes; final disposition **ship**, both listed fixes scored resolved. No whole-production or real-device certification is implied.
- No credentials, permissions, database migrations, Production deploy, main merge, commit or push performed.
