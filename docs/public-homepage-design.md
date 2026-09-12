---
name: Gro Public Homepage
description: A warm editorial introduction to an attentive, supervised Growth Agent.
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
  section: "150px"
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

# Design System: Gro Public Homepage

## Overview

**Creative North Star: “The Attentive Editorial Desk”**

The public homepage presents Gro as a steady operating presence around a business. Warm paper, expressive editorial headings, fine rules, and generous pacing create a premium service narrative; compact signal rows, timelines, statuses, and connected nodes make the agent’s work concrete. Violet marks intelligence and action, while muted green marks readiness and active attention.

This specification is scoped to the public homepage and shared public chrome implemented in `src/app/page.tsx`, `src/app/layout.tsx`, `src/components/public-site/sections.tsx`, `src/components/public-site/homepage-experience.tsx`, `src/components/public-site/homepage.module.css`, `src/components/public-site/chrome.tsx`, and the public-facing rules in `src/components/public-site/public-site.module.css`. The exact wordmark asset is `public/gro-logo.png`. The root `DESIGN.md` and `.impeccable/design.json` continue to govern the authenticated client workspace; this document does not alter or extend their authority.

The story runs from live-looking signals to Gro’s reactions, then Observe → Understand → Act, a dark command centre, a connected channel constellation, editorial capability rows, human oversight, setup, industry examples, and a violet closing invitation. All business signals and outcomes shown on this page are illustrative. Copy and state treatments must continue to distinguish prepared work from completed action and human review from autonomous execution.

**Key Characteristics:**

- Warm off-white editorial canvas with decisive ink, violet, and deep-plum contrast.
- Newsreader display typography paired with compact Geist operational text.
- Agent activity shown as a legible sequence of signals, interpretation, preparation, and review.
- Alternating light, ink, plum, lavender, and violet fields that shape the long-form narrative.
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

**Character:** Newsreader gives the homepage an editorial, human voice. Geist keeps evidence, states, controls, and operational examples crisp. The contrast between them mirrors the product promise: considered guidance backed by concrete work.

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

The primary shell is `min(1320px, calc(100% - 96px))`. Desktop sections commonly use two asymmetrical columns with 65–110px gaps, and major sections use 140–150px vertical padding. Fine horizontal rules and large intervals create rhythm without a card grid dominating the page.

The hero fills approximately one viewport beneath the 90px sticky header. Its text column sits beside a minimum 560px agent stage. The signal strip closes the hero as a compact transition into the longer explanation. The Observe → Understand → Act chapter pairs scroll-driven copy with a sticky 560px demonstration panel. The command centre uses a 1.25fr timeline beside a 0.8fr lavender recommendation. The constellation occupies a 900×560 field with the agent at its centre, and capabilities read as full-width editorial rows rather than a grid of equal cards.

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

The header is a 90px sticky, blurred paper bar with the logo, compact navigation, client login, and an ink CTA that rises 2px and turns violet on hover. Below 850px, navigation moves into a native `details` menu and the login link leaves the action row. The footer returns to a flat paper field with understated links; hover reveals the underline. Keyboard focus throughout the public shell uses a 3px violet outline with a 5px offset. A skip link becomes visible on focus.

### Hero agent core

A 16px dark panel pairs incoming signals with actions taking shape. Its rows cycle in coordinated 12-second phases; the Gro mark reacts, the centre arrow pulses, and the working verb changes every three seconds. Copy names the experience as illustrative and states that signals depend on connected channels. On mobile the two columns become a vertical signal → flow → action sequence.

### Primary and secondary actions

The main action is a violet, white-text link with a 50px minimum height, 12px radius, 14×20px padding, and a small arrow. Hover raises it 2px and deepens the violet. The secondary action is an ink text link with a fine underline; its downward arrow moves slightly on hover. In the final violet section the primary action reverses to white with ink text and the secondary becomes white.

### Observe → Understand → Act

On desktop, three tall text steps control one sticky dark panel via intersection observation. Its rail, source statement, Gro thinking state, and outcome update together. The Act state ends with a muted-green “Ready for human review” surface. On mobile, each step carries its own complete dark card so meaning does not depend on sticky behavior.

### Command centre

The ink chapter pairs a sequential activity timeline with a lavender next-best-action panel. The timeline distinguishes signal, evidence, opportunity, and prepared work. The recommendation ends with a green readiness dot and explicitly says human review is still required.

### Channel constellation

Six circular channel nodes surround a violet Gro core. Hover and keyboard focus enlarge one node, reveal its explanatory tooltip, and strengthen the corresponding line. On mobile the core and nodes become stacked rectangular rows, connector lines disappear, and all explanations remain visible.

### Capability rows

Each capability is one editorial row: lavender icon tile, Newsreader title, concise explanation, and bright-paper “Example in motion.” Dividers and whitespace carry the structure. Preserve this narrative hierarchy rather than converting the section into generic equal cards.

### Setup journey

Four steps sit on a fine connecting rule with violet markers and small lavender artifact labels. Mobile changes the horizontal sequence into a vertical rail. A green pill closes the sequence with “GRO IS ACTIVE.”

### Industry chooser

Business types are 44px-minimum pill tabs with roving keyboard focus and proper tab semantics. Hover and selection invert from transparent to ink. The panel pairs “Signal noticed” with “Gro’s next move,” linked by a violet arrow; mobile stacks the relationship vertically and rotates the arrow.

### Motion

Motion is explanatory: signal and action cycles, the listening stream, the Observe → Understand → Act progression, constellation focus, and small CTA feedback. Under `prefers-reduced-motion: reduce`, animation and transition durations collapse to 0.001ms, duplicate marquee content is removed, the first working verb remains visible, and agent actions settle at full opacity.

## Do's and Don'ts

### Do:

- **Do** preserve the public-only scope of this document and the authenticated-only scope of root `DESIGN.md`.
- **Do** use the exact `public/gro-logo.png` asset in the established dark tile.
- **Do** keep the public narrative in this order: signals, interpretation, action, connected channels, capabilities, human support, setup, industry relevance, invitation.
- **Do** label examples and simulated operational states as illustrative near the relevant visual.
- **Do** keep “ready for human review” distinct from executed or completed work.
- **Do** preserve keyboard behavior, minimum control sizes, focus rings, and reduced-motion behavior.

### Don't:

- **Don't** apply this warm editorial system to the authenticated client workspace without a separate design decision.
- **Don't** replace the supplied logo with a text recreation or generic `gro↗` wordmark in public chrome.
- **Don't** use glowing AI effects, neon gradients, futuristic interface motifs, or chart-first dashboard layouts.
- **Don't** present illustrative signals, social content preparation, or recommendations as live evidence, autonomous publishing, or guaranteed outcomes.
- **Don't** flatten the long-form light/dark chapter rhythm into a repetitive grid of cards.
