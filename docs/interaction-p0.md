# Client interaction P0 — verification record

Production is not deployed or promoted by this task. Branch: codex/client-interaction-p0.

## Real authenticated baseline

Baseline Preview: marketingai-f84gv42ic-faziils-projects.vercel.app, commit 931117d.
Measured September 11, 2026, using the user's signed-in QA session.

- Login submit to hero DOM: 10,718 ms (one sample).
- Three warm reloads, hydration/primary DOM observation: 3,780 / 3,704 / 3,734 ms.
- Document completion: 3,579 / 3,612 / 3,621 ms.
- Date changes, automation-observed completion (includes tool overhead): 30D 5,462 ms; 90D 4,737 ms; 7D 4,788 ms.
- Navigation DOM completion: Leads 4,078 ms; Traffic 3,913 ms; Reports 3,356 ms. Overview automation-observed 4,030 ms.
- Script encoded bytes: 256,741 on the warm reload samples.
- These small samples are not sufficient for a meaningful p95 claim.

## Causes and bounded changes

- Login and proxy membership checks were sequential. They now run in parallel, retaining verified authentication and fail-closed authorization.
- The earlier performance branch had not been integrated into the current dashboard UI branch. Relevant changes were selectively ported, not merged wholesale.
- All routes previously requested all nine result sources. Leads now requests only leads; Reports only published reports; Traffic seven sources.
- Overview streams primary, performance, and insights separately. React request-scoped memoization shares identity and source promises. No private cross-request result cache or authenticated ISR was introduced.
- Real result transformations, published-report selection, date/source filters, and zero-baseline domains are preserved. Missing data is not manufactured. Requested-source failures produce retry UI, not zero metrics.
- Shared date transition state provides immediate feedback and retains previously rendered data.
- Traffic view-only tabs use Next-supported native history integration and loaded data.
- Navigation shell persists, with route fallbacks and pending link feedback.
- The bell now opens a panel with verified workspace updates and browser-local, user/client-scoped read state.
- Assistant code is lazy-loaded; its initial shell and close button render immediately. There is no floating launcher while open.
- Fetch/code-load/message deadlines bound waiting. Mobile panel height follows visualViewport and dynamic viewport units with safe-area composer padding.
- The mobile lead plot had only 12 px of drawable height (56 px stage minus axis/margins). The stage is now 92 px with an 18 px date axis. Curved area, gradient, and data dots remain; values and zero baseline are unchanged.
- Dates use human-readable labels. Mobile source filters use two columns with no horizontal scrolling, including Other at zero when appropriate.

## Geography

- Supabase remains Tokyo (ap-northeast-1). No database migration.
- Baseline Vercel compute: iad1 (Virginia).
- Baseline server-to-Supabase public Auth health requests: 888 / 750 / 752 ms, HTTP 200. This is network/service latency, not SQL execution time.
- This feature branch requests hnd1 compute for the next Preview. Actual after timings and region must be verified on the resulting deployment.
- The repository region setting would also affect a future deployment if explicitly merged; existing Production is unchanged.

## Local QA

- Production build, TypeScript, ESLint, and 124 tests pass.
- Desktop and 390 x 844 checks: meaningful content; no framework error overlay; no page horizontal overflow.
- Assistant: send a question and receive a grounded demo response; three repeated open/close cycles; one header close and zero launchers while open; input is the topmost hit-test target.
- Source filter width equals scroll width (311 px).
- Local-only network shaper: 300 ms initial latency, 64 KiB/s per response, uncompressed. This is not a real cellular network or live Supabase latency simulation.
- Under shaping: old total 47 remains visible while pending; completes to the selected demo total 11.
- Traffic Keywords/Pages/Opportunities: server-component request count stays 9 to 9; next-paint samples 27 / 23 / 21 ms (not a formal INP measurement).
- Physical Android/iOS keyboard QA is unavailable. Focus and composer visibility in desktop mobile viewport are verified; actual software keyboard behavior remains a device check.

## Remaining release gate

Sign in on the new Preview host, repeat the authenticated timing and chart checks, and measure hnd1-to-Supabase latency before claiming the real-user improvement. Do not label demo QA as authenticated after evidence.
