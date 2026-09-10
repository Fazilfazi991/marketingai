# Performance and reliability stabilization

Branch: `codex/performance-reliability`. Preview only. No Production deployment or database migration is authorized by this batch.

## Baseline evidence (11 September 2026)

- Starting client dashboard: `1fe81d2c28799ecce9b6d51b27b4a636bfb53d7f`.
- Instrumentation baseline: `4cc9384b5e0348de1fd3b3ca2398d278eee39be0`, Preview `marketingai-g6xqnoabh-faziils-projects.vercel.app`.
- Preview demo cold sample: TTFB 537 ms, document 1,751 ms, hydration observer 2,490 ms, first contentful paint 2,236 ms, 253,898 encoded script bytes, 27 resource requests, zero API requests.
- Preview demo warm sample: TTFB 73 ms, document 737 ms, hydration observer 870 ms, 253,898 encoded script bytes, 12 resource requests, zero API requests. These are browser samples, not population percentiles or authenticated query timings.
- Signed-in Production account was inspected read-only. Traffic → Keywords was observed ready in 3,199 ms (browser automation wall clock, including tool overhead). A preceding Traffic route transition was still unresolved at the 3-second check. No retrospective exact login timing is available for the user's completed Production sign-in.
- Supabase project region: `ap-northeast-1` (Tokyo). Measured baseline Vercel execution: `iad1` (Virginia). Preview-to-Supabase Auth health samples: 258, 728, 977 ms. These are upstream HTTP round trips, **not SQL execution times**.

## Evidence-based causes and changes

The original nine dashboard data queries were already parallel after authentication; there was no nine-query waterfall to remove. The delays came from blocking the whole route on the slowest result, serial organization/client membership lookup, repeated full dashboard reads on detail routes and view-only query changes, and the inter-region round trip.

- Login and proxy membership reads are parallel. Authentication and RLS remain mandatory and fail closed.
- Request-scoped React memoization shares the server client, verified workspace and query promises between streamed sections. No cross-user global result cache, service-role query bypass, or persistent auth cache was added. Supabase fetches explicitly use `no-store` and bounded cancellation.
- Overview still needs nine distinct result sources overall. Primary needs only leads, published keywords and published reports. Metrics and lower insights have independent Suspense boundaries. Shared sources are memoized within the RSC request.
- Leads detail reads one result source instead of nine; Reports reads one instead of nine; Traffic reads seven. These counts exclude authentication/membership. Source-selection tests verify this; Preview runtime logs must confirm actual request deduplication.
- Traffic view-only changes use the Next-integrated native History API and disable redundant link prefetch. They reuse loaded data and support Back/Forward. Other route links have pending feedback and route skeletons.
- Notification items come only from authorized loaded workspace data. Read IDs are stored per user/client scope in this browser; content is not persisted. This is not a cross-device notification service.
- Sparse charts do not invent missing history. A single point has a compact verified-period state; zero points has an explicit empty state.
- The assistant code is loaded only on opening. Its launcher has a reserved viewport rail, rather than overlapping scrolling content. The rail is below the mobile menu/scrim. Open chat unmounts the launcher, has a single header close button, independent scrolling, cancellation, timeout/retry feedback, safe-area padding, and visual-viewport sizing.
- Missing query data produces section Retry UI and cannot be used to generate an assistant answer. Client panels no longer show nonfunctional decorative More buttons.
- `vercel.json` proposes Tokyo `hnd1` compute on this branch. Project-level Production settings have not been changed. Rollback is removal/reversion of this branch config followed by another Preview deployment.
- `NEXT_PUBLIC_DEMO_MODE=false` is scoped only to this branch's Preview for authenticated QA. Existing shared environments are untouched.

## Verification so far

- TypeScript, ESLint and 91 tests passed after implementation. The final production build after the presentation fixes also passed.
- Local 390×844: no document horizontal overflow; one 48px launcher when closed; no launcher and one 44px close control when open. Repeated open/close restores launcher keyboard focus.
- Assistant test question returned a grounded answer. Generating feedback appeared immediately. At a 390×480 keyboard-sized viewport, the input and send control remained within the viewport. This is not proof of a physical Android/iOS keyboard test.
- Local delayed-analytics fixture: primary and insights observed at 624 ms; Performance at 5,198 ms with an intentional 5,000 ms delay. Local development timings are not comparable to production bundle performance.
- Local failed-analytics fixture: section-level Retry, no fake zero KPI, other sections and assistant retained. Retry terminates back in the error state while the simulated fault remains.
- Local view-only navigation instrumentation: 29–30 ms to updated DOM, next-paint samples 36–37 ms; no additional traffic route request in the dev server log for Keywords/Pages/Back.
- Network-shaped production build (300 ms initial latency, 64 KiB/s per response): TTFB 688 ms, document 1,209 ms, FCP 2,592 ms, hydration observer 4,826 ms. The page rendered progressively and notifications/assistant responded once hydrated. There were zero initial API requests. The proxy disables compression, so its 512,165 script-byte total is not comparable to the compressed Preview baseline. The 1–2 second primary-interactivity target is not met under this deliberately slow cold load.

## Reproducible local QA

`GROWTH_QA_SCENARIO=slow-analytics|failed-analytics|single-point` only operates when `NODE_ENV=development`, no `VERCEL_ENV` is present, and results are already demo data. It cannot alter Preview, Production, or live account data. Tests enforce these guards.

For network shaping, run the built demo app on port 3000, then `node scripts/qa-network-proxy.mjs` and open `http://127.0.0.1:3001/client?perf=1`. The loopback-only proxy applies 300 ms initial latency and 64 KiB/s per response. It is a repeatable mobile-like test, not a physical cellular-network benchmark.

`?perf=1` enables a hidden `#growth-performance` output with local-only browser timings and generic interaction categories; it transmits no telemetry or typed values. Server `growth_timing` logs contain operation names, durations, and region only. The diagnostic health endpoint is Preview-only and returns no credentials or records.

## Remaining completion gates

Authenticated Preview login → dashboard timing; actual Tokyo deployment and upstream comparison; runtime query counts; desktop and 390×844 Preview interactions; network-shaped production-build verification; final clean commit/Preview URL and full A–U report. No completion claim until those checks are recorded.
