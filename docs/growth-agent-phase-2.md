# Ask Agent and request workflow

Mode: Operate. Extend the approved client workspace, code-first. Today is unchanged.

THESIS: a business conversation becomes visible, supervised work—not an autonomous chatbot.
OWN-WORLD: inherit Geist, white/slate surfaces, muted blue controls and quiet purple request states.
STORY: write a question or request, see its saved receipt, return for a team reply and progress.
FIRST VIEWPORT: compact identity header, Conversation/Requests switch, readable message ledger and an anchored composer. Suggestions fill an empty ledger without fabricated history.
FORM: precisely scoped extension; no new visual-world selection. The signature interaction is the saved request receipt linking directly to its status history. Motion only conveys sending and selection.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Phase 1 checkpoint: `ff6e4f9043d1acbba5838ee654112fade2f1724a`.

## Security and ownership

Admin triages and assigns incoming conversations. Active staff can access only assigned conversations; configuration remains admin-only. Each topic is a conversation, and the client sees these together in a chronological ledger. This keeps assignment from leaking unrelated discussions. A conversation can be reclassified as a request without losing its messages.

Existing `client_requests` is extended, not replaced. Writes use narrowly scoped transactional database functions; raw authenticated writes are revoked. Actor and client ownership are resolved from authenticated memberships, never supplied organization IDs. Internal notes use a separate table with staff-only policies.

## Release gate

No Production migration, deployment or main merge. Live signed-in persistence QA requires an isolated Supabase development target. Local PostgreSQL tests validate database authorization separately from hosted Auth/PostgREST integration.

## Implementation

- `/client/agent`: persistent message ledger, deterministic request receipts, Conversation / Requests views, contextual shortcuts, visible save/retry states, in-memory draft retained on failure, stable submission key retained for retry. Receipt success is separate from reload success, so a failed read does not duplicate a saved message.
- `/staff/requests`: questions and requests, client/title search, status filter, assignment (admin only), status/category updates, question/request reclassification, client replies and separately stored internal notes. Only unstarted requests can be reclassified back to questions; the cancelled request and its history remain auditable.
- One conversation per topic. Client follow-ups select a topic explicitly, avoiding silent attachment to the wrong request. Staff assignment is conversation-scoped so unrelated topics do not leak.
- `client_requests` is reused with `conversation_id`, `updated_at`, `latest_update`; owner comes from the linked conversation. New `agent_conversations`, `agent_messages`, `request_events`, `agent_internal_notes` tables have RLS. Existing legacy requests remain admin-readable; legacy values are not rewritten.
- `agent_send` atomically writes the client message, safe system receipt and optional request/history. It derives a single active client membership from `auth.uid()`. Ambiguous multi-client accounts fail closed. Advisory transaction locks plus unique actor/submission keys protect concurrent retries.
- `agent_manage` permits only active same-organization admins or assigned staff. Raw authenticated mutations are revoked; public invoker wrappers call narrow, authenticated private transactions. Private functions use a fixed empty search path, qualified objects and revoked PUBLIC/anon execution.
- Notifications reuse the existing `notifications` table and client feed. Only real reply, status and reclassification events create notices; private notes never create client notices. Read/dismiss behavior remains the existing client feed behavior, not a new cross-device unread system.
- Queries follow PostgREST row ranges rather than silently truncating at the default row cap. Very large histories still need UI pagination/virtualization in a later scale pass.

## AI and business context audit

The existing AI provider supports internal generation tasks. Phase 2 deliberately does not turn it into an autonomous client agent. `AgentService` is the server-side persistence boundary; `AgentProvider` accepts a vetted business context and returns either pending-team or a draft-for-review with evidence. No browser provider keys, direct model calls, fabricated analytics answers or automated execution were added.

Existing context: `clients.name`; `business_profiles.description`, target customers, value proposition, website, tone, offers, important/prohibited claims; `business_services`; `business_locations`; verified `business_faqs`. These remain staff/admin operational data and are not exposed wholesale to clients. Phase 7 gaps: structured business goals, agent display name/configuration, versioned knowledge provenance, model routing and context retrieval. The optional typed context slots prepare an adapter without creating speculative tables or a setup wizard.

Rule-assisted classification currently targets common English work-request phrasing. Unrecognized or ambiguous messages remain team questions; staff can correct classification. A title is a bounded excerpt of the original request, not a fabricated model-generated summary.

## Verification evidence

- Phase 1 checkpoint reviewed and committed with no unrelated files, secrets, `.env`, screenshots or temporary artifacts.
- Full historical migration chain plus Phase 2 migration applied to three fresh, isolated PostgreSQL 17 databases during iteration, including a final clean replay. Auth identity was simulated through the PostgreSQL request claim setting; Storage/Auth platform schemas were stubbed for migration compatibility. This is not a hosted Supabase Auth/PostgREST test.
- `supabase/tests/agent_workflow_test.sql`: 63 assertions passed, including message/request creation, classification both directions, persisted reload on a new DB connection, sender forgery, direct writes, same-organization cross-client and cross-organization reads/writes, assigned/unassigned/inactive staff, assignment revocation, private notes, actual notifications, whitespace validation and duplicate retries.
- Two genuinely concurrent database connections using the same submission key returned the same conversation, with one submitted message and one request.
- Supabase CLI security/performance advisors executed against local PostgreSQL. No new workflow warnings; existing schema warnings include public `pgcrypto` and overlapping permissive policies on unrelated operational tables. No remote project was modified.
- Vitest: 146 tests across 33 files passed (including API and rendered UI states). TypeScript and ESLint passed. Optimized production build passed; final verification is rerun after any review correction.
- Read-only browser QA: client 390×844, 1366×768, 1440×900 have no horizontal overflow. At 390px, composer bottom is 752px and navigation top is 779px. Input receives its center-point hit and focus. No floating launcher exists. Suggestions populate the input; Requests empty-state switching works. Staff client search and status filtering work in the empty demo inbox. Browser console showed no errors in the checked client state.

## Evidence and limitations

Local read-only preview: `http://localhost:3001/client/agent`; staff: `http://localhost:3001/staff/requests`.

Screenshots (ignored QA artifacts): `.impeccable/review/phase2/mobile.png`, `desktop-1366.png`, `desktop.png`, `staff-desktop.png`, `staff-mobile.png`.

Outstanding gate: an isolated Supabase development project and signed-in QA clients/staff. Browser send → reload → staff reply → client reply persistence, populated mobile states, slow/offline network behavior and hosted RLS/RPC integration remain unverified. Real Android/iOS keyboards and safe-area/browser chrome require physical-device QA; desktop viewport emulation is not a substitute. No Preview deployment, Production deployment or main merge has occurred. Phase 2 remains uncommitted pending this gate/review; the Phase 1 checkpoint is safe.

Final scoped finish review: **ship for the development/demo milestone**. The independent reviewer scored all three listed findings resolved after the copy fixes, 12px mobile helper text, documentation merge and rebuilt screenshots. This is not approval of the live workflow or Production. Final TypeScript, ESLint, 146 tests and production build passed after source corrections. Chrome recorded two asynchronous message-channel errors on the staff tab; their source was not established, so a clean-profile console check remains part of live QA. The checked client state had no console errors. The isolated PostgreSQL test server was stopped after testing; no test database or other project data was deleted.

Deferred by scope: ads/social, WhatsApp inbox, chatbot implementation, autonomous SEO/site edits, model connection, RAG/vector memory, full CRM, full onboarding/configuration and Today redesign. Today can consume this request system later; no duplicate task architecture was introduced.
