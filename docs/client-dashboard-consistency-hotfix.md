# Client dashboard consistency hotfix

Base: Production deployment `dpl_GEyUEmU96qjLmGvBTPXuzikes1me`, verified READY at
`1fe81d2c28799ecce9b6d51b27b4a636bfb53d7f`. Dedicated branch:
`codex/client-dashboard-consistency-hotfix`. The separate performance-reliability
branch is preserved, not merged into this hotfix. Goal 3B remains paused.

## Causes and corrections

- Demo range handling scaled KPI aggregates but retained June–September traffic
  and search arrays. It also manufactured a selected-period lead point (or reused
  monthly lead points). Demo fixtures have no dated daily observations: all those
  trend arrays are now empty, with an explicit insufficient-history state.
  Demo aggregate totals remain illustrative demo fixtures, not live observations.
  Comparisons without period-specific baselines are now unavailable.
- Live traffic, search and lead charts use selected-period daily observations.
  Leads no longer create empty multi-day buckets and call them measured history.
  Traffic aggregates duplicate daily rows before rendering. ISO day labels retain
  the date/year in tooltip and accessible point controls. One point is compact;
  zero points never generate a curve. Chart keys include resolved start/end dates.
- Demo keyword summary hard-coded 18 while exposing three rows. Counts now agree
  with those three rows. Shared movement classification rejects absent/invalid
  comparisons. Missing previous positions display an em dash, not a fabricated
  position zero. The assistant receives only comparable keyword movements; its
  provider, authorization, grounding rules and intent behavior are unchanged.
- The existing client-safe keyword RPC returns a latest snapshot (up to ten
  records), not date-filterable query metrics. Detail copy states this limitation.
  No clicks, impressions, CTR or missing ranking history are invented.
- Top Pages omitted the second row's name in its JSX. Every displayed row now
  names its page, using a shared nonblank title/path fallback with the detail view.
  Page lead attribution compares normalized exact paths rather than substring
  matches (which previously made `/` match every URL).
- Summary links now carry resolved dates. Source links also carry the canonical
  source key; the destination actually filters current and comparison lead data.
  Work Completed displays the selected month's published report items, explicitly
  labels that month, and counts report lines rather than claiming category-counts
  were a count of completed tasks. Opportunities use the same available dataset
  on both surfaces.

## Mobile and interaction evidence

Local browser at exactly 390×844:
- Hero height approximately 266px. Next Focus content offset approximately 596px
  (reported previous offset 669px: approximately 73px earlier). Scroll offset is
  included in this measurement; it is not an auto-scrolled viewport coordinate.
- Range buttons 44×44; Performance tabs approximately 73×44; source actions 44px
  high; launcher 48×48. No horizontal document overflow.
- Supporting focus text is 12px/1.5 and subordinate items 11px/1.45.
- 90D → 7D → 30D → 7D returns 663 demo visitors, 160 organic clicks and 11 leads
  with no stale monthly curve. All four Performance tabs show correct empty
  history copy, including AI.
- 7D WhatsApp action shows five in Overview and five in the filtered Leads view,
  retaining September 24–30 in the destination URL.
- Open assistant: zero launchers, exactly one header close control, focused input,
  input/send bottom approximately 812px inside the 844px viewport. Repeated
  open/close works. A reserved scrolling-content rail prevents launcher/card overlap.
- This is browser viewport testing, not a physical iOS/Android keyboard test.
- Desktop 1280×720: no horizontal overflow; content bottom 648px, launcher top
  660px (12px clear gap). Keywords shows three rows/three improved, Pages shows
  the same three identities/counts as Overview, Opportunities shows the same two
  fixture entries, and the September report contains the same four work items.
  No browser warning/error logs in these checks.

## Regression coverage

Selected-period filters, repeat switching, KPI/series reconciliation, 0/1/2-point
rendering, keyword classification/counts, page fallback/path identity, source link
encoding/filtering, membership-scoped table queries, unauthenticated/missing
membership rejection, and cross-client fixture isolation. Existing migration/RLS
and access-control regression tests remain part of the full suite.

Mocked tenant tests verify application query construction, not a live two-account
RLS exercise. Real authenticated Preview verification must be distinguished from
demo visual QA. No schema, ingestion, RLS, tenant-model or Production changes.

Production deployed by this task: **NO**. Preview is for approval, not promotion.
