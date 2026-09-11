# Phase 1 — Client Dossier

Selected by the user; code-first. Seed ea852146.

THESIS: A client receives a briefing and reviews decisions, not a wall of charts.
OWN-WORLD: Matte white panels, slate text, restrained blue actions, generous grouping, and clear evidence labels. Business owners use this on phones in everyday daylight.
STORY: Read what is recorded, understand the next review, open the evidence or discuss it.
FIRST VIEWPORT: Compact workspace header; Today and business/period; agent identity and short briefing; one conversational action. Fixed five-item mobile navigation. No lead hero or chart.
FORM: Client Dossier, grounded direction 6. Signature interaction: move from finding to its evidence with immediate navigation feedback. No decorative entrance animation.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Scope

New client shell and Today. Existing results and deep links remain accessible. Website and Conversations show availability boundaries; SEO reuses current evidence views. Ask Agent exposes the existing grounded conversation UI and explicitly states that messages are not yet persisted requests.

## Not complete in this phase

Configured identity, persisted requests/threads, approvals, conversation ingestion, website monitoring, new Results presentation, public acquisition form, and admin configuration remain later phases. No schema changes or Production deployment.

## Verification

- TypeScript, ESLint, 124 tests across 29 files, and production build passed after the review correction.
- Static design detector returned no findings on the new UI targets.
- Browser demo checks: 1280×720 desktop and 390×844 mobile showed no horizontal document overflow; mobile More opened/closed, Ask Agent accepted a message and returned a demo answer, header close returned to Today, and no floating launcher overlapped the composer.
- Website, SEO, Conversations, and Results destinations loaded; Results retained historical charts and no longer mounts a redundant floating assistant.
- Independent review identified a date-context mismatch. The Agent route now forwards search parameters to the results loader. Verified custom August 1–31 Today briefing opens an Agent conversation explicitly covering August 1–31.
- Final reviewer disposition: **ship for the reviewed Phase 1 scope**. Date-context mismatch and redundant Opportunity labels scored resolved. This is not a certification of later phases or real-device behavior.
- Valid viewport screenshots are local QA artifacts under `.impeccable/review/`; full-page stitching was malformed and is not evidence.
- Real-device keyboard behavior and authenticated performance have not been verified in this phase. Demo checks do not establish either.
- Branch: `codex/growth-agent-v1`. No push or Production deployment in this phase.
