---
name: Gro Public Website
description: A warm editorial public site for an attentive, supervised Growth Agent.
colors:
  paper: "#f4f0e9"
  paper-bright: "#fbf9f5"
  ink: "#17131f"
  muted: "#645f69"
  violet: "#7554e8"
  violet-hover: "#6542df"
  violet-bright: "#9a76ff"
  lavender: "#e5dcfb"
  green: "#79b899"
  agent-panel: "#1b1625"
  human-panel: "#241b2e"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(3rem, 6vw, 5.8rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  hero:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "clamp(4rem, 6.25vw, 6rem)"
    fontWeight: 500
    lineHeight: 0.91
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "16px"
    lineHeight: 1.65
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 750
    letterSpacing: "0.1em"
rounded:
  artifact: "8px"
  tooltip: "10px"
  action: "12px"
  feature: "14px"
  panel: "16px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "28px"
  xl: "48px"
  section: "120px"
components:
  button-primary:
    backgroundColor: "{colors.violet}"
    textColor: "#ffffff"
    rounded: "{rounded.action}"
    padding: "14px 20px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.violet-hover}"
  agent-core:
    backgroundColor: "{colors.agent-panel}"
    textColor: "#f8f5ff"
    rounded: "{rounded.panel}"
    padding: "28px"
  recommendation:
    backgroundColor: "{colors.lavender}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "32px"
  industry-tab-active:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "10px 15px"
---

# Design System: Gro Public Website

## Overview

**Creative North Star: “The Attentive Editorial Desk”**

The Gro public website presents one steady operating presence around a business. Warm paper, expressive editorial headings, fine rules, and measured pacing create a premium service narrative; compact signal rows, timelines, statuses, and connected nodes make the agent’s work concrete. Violet marks intelligence and action, while muted green marks readiness and active attention.

This specification is scoped to the public routes `/`, `/how-it-works`, `/what-gro-does`, `/about`, `/for-businesses`, `/contact`, `/privacy`, `/terms`, and `/login`, plus their shared public chrome. The implementation lives in `src/app`, `src/components/public-site/sections.tsx`, `src/components/public-site/detail-sections.tsx`, `src/components/public-site/business-experience.tsx`, and the public-site CSS modules. The exact wordmark asset is `public/gro-logo.png`. The root `DESIGN.md` and `.impeccable/design.json` continue to govern the authenticated client workspace; this document does not alter or extend their authority.

The homepage is the concise six-chapter entry point: agentic hero, compact signal convergence, one Observe → Understand → Act example, four capability previews, AI-powered/human-backed philosophy, and the closing invitation. Detailed process, capabilities, brand philosophy, industry examples, and conversion content live on focused routes. All business signals and outcomes are illustrative. Copy and state treatments must continue to distinguish prepared work from completed action and human review from autonomous execution.

**Key Characteristics:**

- Warm off-white editorial canvas with decisive ink, violet, and deep-plum contrast.
- Newsreader display typography paired with compact Geist operational text.
- Agent activity shown as a legible sequence of signals, interpretation, preparation, and review.
- Alternating light, ink, plum, lavender, and violet fields that distinguish concise chapters and routes.
- Motion that carries meaning and collapses cleanly for reduced-motion users.
- Exact supplied Gro logo displayed as an image within a dark, clipped tile.

## Colors

The palette feels warm, literary, and capable. Large surfaces stay quiet; saturated violet appears where Gro is thinking, connecting, or inviting action.

### Primary

- **Gro Violet** (`violet`): Hero emphasis, primary actions, Gro cores, signal markers, icons, and selected connective lines.
- **Action Violet** (`violet-hover`): Hover feedback for the principal homepage action.
- **Bright Violet** (`violet-bright`): Progress rails and active reasoning details on ink panels.

### Secondary

- **Review Lavender** (`lavender`): The next-best-action panel, where a recommendation is ready for human review.
- **Attentive Green** (`green`): Live, active, ready, and supervised status cues. It is a supporting signal, not a competing CTA color.

### Neutral

- **Warm Paper** (`paper`): Default page canvas.
- **Bright Paper** (`paper-bright`): Alternating sections, signal strips, examples, and light cards.
- **Editorial Ink** (`ink`): Primary text and the command-centre field.
- **Quiet Plum** (`muted`): Long-form explanatory text and secondary labels.
- **Agent Panel** (`agent-panel`): Hero agent core and mobile story cards.
- **Human Panel** (`human-panel`): Human-backed section, distinct from the slightly darker command centre.

### Named Rules

**The Violet Thread Rule.** Use violet to trace Gro’s role through the experience: emphasis, processing, connection, and action. Do not turn every surface or paragraph into an accent.

**The Evidence State Rule.** Green means attentive, ready, or active. It does not prove that a recommendation was executed or an outcome was achieved.

**The Contrast Chapter Rule.** Preserve the strong light/dark sequence. Dark sections are narrative chapters with their own internal surface hierarchy, not isolated dark cards scattered across the paper canvas.

## Typography

**Display Font:** Newsreader, supplied through `--font-gro-display`, with Georgia and serif fallbacks.
**Body Font:** Geist, supplied through `--font-geist-sans`, with sans-serif fallback.

**Character:** Newsreader gives every public page an editorial, human voice. Geist keeps evidence, states, controls, and operational examples crisp. The same pairing also applies to Privacy, Terms, and Login so the public experience remains one coherent Gro site.

### Hierarchy

- **Hero display** (500, `clamp(4rem, 6.25vw, 6rem)`, 0.91): The single proposition. Keep it balanced and narrow, with the decisive second line in violet.
- **Section display** (500, `clamp(3rem, 6vw, 5.8rem)`, 0.98): Major narrative transitions, generally constrained to 9–12 characters per line through `ch` widths.
- **Story headline** (500, `clamp(2.4rem, 4vw, 4rem)`, 1): Observe, Understand, and Act statements.
- **Body** (400, 1rem–1.24rem, 1.65–1.7): Explanations capped near 46–60ch.
- **Operational copy** (600–750, about 0.58rem–0.88rem): Signals, timeline entries, labels, and state text.
- **Label** (750, about 0.62rem–0.74rem, 0.08em–0.12em): Uppercase only for short state and category markers.

### Named Rules

**The Editorial-to-Operational Rule.** Use Newsreader for propositions, interpretations, and major example statements. Use Geist for facts, statuses, navigation, descriptions, and controls.

## Layout

The primary shell is `min(1320px, calc(100% - 96px))`. Desktop sections commonly use two asymmetrical columns with 65–110px gaps, and focused sections generally use about 95–120px vertical padding. Fine horizontal rules and controlled intervals create rhythm without a card grid dominating the page.

The homepage hero fills approximately one viewport beneath the 90px sticky header, pairing its proposition with the agent stage. The remaining five homepage chapters are deliberately compact. Dedicated pages use distinct hero compositions: process flow on How It Works, connected channels on What Gro Does, consolidation on About, orbiting business context on For Businesses, and one restrained readiness panel on Contact. The command centre belongs to How It Works; the constellation and operational capability rows belong to What Gro Does; the interactive chooser belongs to For Businesses.

At 1050px, the shell inset becomes 32px per side and complex columns tighten. At 780px, the shell inset becomes 20px, paired columns stack, sections use 95px vertical padding, the sticky story becomes three inline mobile cards, and the constellation becomes a readable vertical list with its explanations always visible. At 430px, the shell inset becomes 16px, principal actions stack full width, and industry tabs scroll horizontally. Shared public chrome uses a 78px header and a 112×52 logo tile at 600px and below.

## Elevation & Depth

Depth is selective and atmospheric. Most editorial sections remain flat, separated by tonal fields, borders, and spacing. Shadows concentrate around the hero agent core, sticky story panel, central constellation node, tooltips, and CTAs. Soft violet halos around the listener and core communicate attention; they must stay diffuse and restrained rather than becoming neon or sci-fi glow.

### Shadow Vocabulary

- **Primary action** (`0 14px 32px rgba(72,48,150,.22)`): Violet homepage CTA.
- **Agent core** (`0 34px 80px rgba(36,25,66,.25)`): Hero operational demonstration.
- **Story panel** (`0 36px 90px rgba(28,20,46,.18)`): Sticky desktop narrative panel.
- **Listener halo** (`0 24px 60px rgba(79,52,168,.25), 0 0 0 24px rgba(117,84,232,.07), 0 0 0 50px rgba(117,84,232,.035)`): One listening hub only.
- **Header action** (`0 10px 24px rgba(23,19,31,.12)`): Compact sticky-header CTA.

### Named Rules

**The One Focal Lift Rule.** Lift the current agent or action focal point. Keep surrounding editorial material flat so hierarchy remains clear.

## Shapes

Panels use 14–16px corners, actions use 11–12px corners, artifacts use 8px corners, and state chips use full pills. Circular geometry belongs to signal nodes, the listening hub, and small status dots. One-pixel borders in translucent ink or white define most internal surfaces. The visual language combines precise editorial rectangles with circles that describe connection and ongoing attention.

The Gro wordmark always uses the exact supplied raster asset. It appears inside a clipped dark tile at 148×64 on larger screens and 112×52 on small screens, with 10px and 8px corner radii respectively. Do not redraw, retype, recolor, or crop it differently.

## Components

### Public header and footer

The header is a 90px sticky, blurred paper bar with the logo, four compact exploration links, client login, and an ink CTA to `/contact` that rises 2px and turns violet on hover. Below 850px, navigation moves into a native `details` menu containing the four exploration links, Contact, Client Login, and the primary action. The grouped footer exposes Explore, Contact, and Legal destinations only. Keyboard focus throughout the public shell uses a 3px violet outline with a 5px offset. A skip link becomes visible on focus.

### Hero agent core

A 16px dark panel pairs incoming signals with actions taking shape. Its rows cycle in coordinated 12-second phases; the Gro mark reacts, the centre arrow pulses, and the working verb changes every three seconds. Copy names the experience as illustrative and states that signals depend on connected channels. On mobile the two columns become a vertical signal → flow → action sequence.

### Primary and secondary actions

The main action is a violet, white-text link with a 50px minimum height, 12px radius, 14×20px padding, and a small arrow. Hover raises it 2px and deepens the violet. The secondary action is an ink text link with a fine underline; its downward arrow moves slightly on hover. In the final violet section the primary action reverses to white with ink text and the secondary becomes white.

### Observe → Understand → Act

The shortened homepage tells one complete customer-question story in three coordinated panels: Observe, Understand, and Act. Each stage remains legible without scroll-controlled state and the Act panel clearly presents prepared work rather than executed work.

### Command centre

On `/how-it-works`, the ink chapter pairs a sequential activity timeline with a lavender next-best-action panel. The timeline distinguishes signal, evidence, opportunity, and prepared work. The recommendation ends with a green readiness dot and explicitly says human review is still required.

### Channel constellation

On `/what-gro-does`, six circular channel nodes surround a violet Gro core. Hover and keyboard focus enlarge one node, reveal its explanatory tooltip, and strengthen the corresponding line. On mobile the core and nodes become stacked rectangular rows, connector lines disappear, and all explanations remain visible.

### Capability rows

The homepage previews four capabilities in a compact editorial treatment. `/what-gro-does` expands the system into focused operational chapters for Website, Google and SEO, WhatsApp, Website Chat, Social Media, and Analytics, followed by connected Growth Intelligence. Dividers and whitespace carry the hierarchy; avoid a generic feature-card grid.

### Dedicated page flow

Every detail page ends with a conversion action and a subtle next-page link so exploration never reaches a dead end. `/contact` stays intentionally short, leading with WhatsApp and email and closing with the three-step onboarding expectation.

### Industry chooser

On `/for-businesses`, seven business types use 44px-minimum pill tabs with roving keyboard focus and proper tab semantics. Selection updates what Gro watches, what customers may ask, what opportunity may appear, and what Gro may prepare. Mobile stacks the relationship vertically and every example remains explicitly illustrative.

### Motion

Motion is explanatory and route-specific: signal processing on Home, progressive flow on How It Works, channel activity on What Gro Does, a subtle AI-to-human handoff on About, chooser state on For Businesses, and restrained feedback on Contact. Under `prefers-reduced-motion: reduce`, animation and transition durations collapse to 0.001ms, duplicate marquee content is removed, the first working verb remains visible, and agent actions settle at full opacity.

## Do's and Don'ts

### Do:

- **Do** preserve the public-only scope of this document and the authenticated-only scope of root `DESIGN.md`.
- **Do** use the exact `public/gro-logo.png` asset in the established dark tile.
- **Do** keep the homepage to six concise chapters and move detailed explanation to its focused public route.
- **Do** label examples and simulated operational states as illustrative near the relevant visual.
- **Do** keep “ready for human review” distinct from executed or completed work.
- **Do** preserve keyboard behavior, minimum control sizes, focus rings, and reduced-motion behavior.

### Don't:

- **Don't** apply this warm editorial system to the authenticated client workspace without a separate design decision.
- **Don't** replace the supplied logo with a text recreation or generic `gro↗` wordmark in public chrome.
- **Don't** use glowing AI effects, neon gradients, futuristic interface motifs, or chart-first dashboard layouts.
- **Don't** present illustrative signals, social content preparation, or recommendations as live evidence, autonomous publishing, or guaranteed outcomes.
- **Don't** recreate the full website as one long homepage or repeat the same hero/card composition on every route.
