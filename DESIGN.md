---
name: Growth1000 Client Dossier
description: A calm client workspace for briefings and evidence.
colors:
  accent: "#345c93"
  accent-hover: "#284b7b"
  ink: "#202b39"
  muted: "#536173"
  canvas: "#f4f6f8"
  paper: "#ffffff"
  border: "#dce3ec"
  shell-border: "#e0e5ec"
  active: "#edf2f9"
  monogram: "#e8eef7"
  selection: "#dbe7f6"
  today-purple: "#62549a"
  today-purple-hover: "#4e427c"
  today-purple-surface: "#f0edf8"
typography:
  headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "32px"
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  briefing-title:
    fontFamily: "Geist, sans-serif"
    fontSize: "27px"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, sans-serif"
    fontSize: "20px"
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "15px"
  briefing-body:
    fontFamily: "Geist, sans-serif"
    fontSize: "17px"
    lineHeight: 1.7
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "12px"
  today-headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "30px"
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  today-section:
    fontFamily: "Geist, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.02em"
rounded:
  action: "9px"
  navigation: "10px"
  finding: "12px"
  popover: "14px"
  briefing: "16px"
spacing:
  compact: "8px"
  inline: "12px"
  mobile: "18px"
  group: "28px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.action}"
    padding: "12px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  navigation-active:
    backgroundColor: "{colors.active}"
    textColor: "{colors.accent}"
    rounded: "{rounded.navigation}"
    padding: "12px"
  briefing:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.briefing}"
    padding: "30px"
  finding:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.finding}"
    padding: "22px"
  today-card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.popover}"
    padding: "22px"
  today-agent:
    backgroundColor: "{colors.today-purple-surface}"
    rounded: "{rounded.popover}"
    padding: "22px"
  today-agent-action:
    backgroundColor: "{colors.today-purple}"
    textColor: "{colors.paper}"
    rounded: "{rounded.action}"
    padding: "10px 14px"
---

# Design System: Growth1000 Client Dossier

## Overview

**Creative North Star: "Client Dossier"**

Matte white panels, slate text, restrained blue actions, and generous grouping make the client workspace calm and readable in everyday daylight. The voice is human, concise, and trustworthy; evidence and availability labels carry meaning without decorative AI effects.

This documents the implemented client shell and Today screen, sourced from `src/app/agent-workspace.css`, `src/app/today-dashboard.css`, `src/components/agent-shell.tsx`, `src/components/agent-today.tsx`, and `src/components/today-dashboard-controls.tsx`. Today now uses a compact operating dashboard with restrained purple agent emphasis within the accepted Client Dossier identity. It is not a replacement specification for the entire application. Legacy Results and the embedded assistant retain their older visual systems; admin, staff, and public surfaces are outside this document's authority. Shared brand and notification components are retained integrations, not newly standardized primitives.

**Key Characteristics:**

- Matte surfaces and subtle borders.
- Restrained blue for actions and navigation state.
- Readable briefings with evidence links.
- Compact Today metrics and sections with restrained purple agent emphasis.
- Phone navigation with explicit active and expanded states.

## Colors

### Primary

The restrained blue accent identifies the main conversational action, evidence links, active navigation, and focus outlines. Its darker hover companion gives the main action immediate feedback. Pale active and monogram surfaces provide supporting emphasis; selection has its own pale blue treatment.

### Secondary

Today adds muted purple for its agent monogram and conversational action, with a pale purple briefing surface and darker hover. Blue continues to identify evidence, chart selection, and navigation. This is a Today-specific extension of the existing identity.

### Neutral

Slate ink carries primary text; muted slate carries descriptions, dates, and limitations. White paper sits on a cool canvas. Panel and shell borders separate content without shadows. Today findings have a small amber For review label; measured changes use green or rust alongside directional icons and text.

## Typography

Geist is supplied through the application's `--font-geist-sans` variable, with sans-serif fallback. The shell establishes body size; headings use the hierarchy above and retain inherited heading weights rather than introducing a new weight scale.

The older shell briefing typography remains available in the stylesheet, but Today uses the scoped headline and section roles above. Its KPI values are 30px, briefing headline 22px, finding titles 16px, and body 14px with 1.6 line height; numeric values use tabular figures. At 760px and below, Today heading and KPI values become 27px, section titles 17px, briefing headline 21px, and briefing body 13px. Evidence and availability notes remain subordinate but readable.

## Layout

Desktop uses a fixed 232px left sidebar and matching main offset. The top bar is 72px high with 40px horizontal padding. Content is centered within a 1120px maximum width, padded 36px 40px 96px. Today opens with a compact header and four KPI cards separated by 12px. Above 1100px, its main grid uses 1.2:1 columns and 20px gaps: Growth Overview beside agent briefing, full-width attention, results beside prepared actions, then conversations beside activity. Attention cards auto-fit at a 250px minimum, capped by available width, with 16px gaps.

At 1100px and below, Today uses 2×2 KPIs and a single ordered stack: agent briefing, attention, Growth Overview, results, actions, conversations, activity. At 760px and below, grid gaps become 18px, KPI gaps 10px, and cards use 18px padding (KPIs 14px). The sidebar disappears and the main offset becomes zero. The top bar becomes 60px high with 20px horizontal padding. Content uses 24px 18px padding with bottom clearance of `calc(100px + env(safe-area-inset-bottom))`. A fixed five-column bottom navigation provides Today, Agent, Website, SEO, and More. Its bottom padding includes the safe-area inset.

The More surface is anchored 16px from the right and 84px from the bottom, with width `min(360px, calc(100vw - 32px))`. Its existing implementation is a navigation section, not a modal dialog.

## Elevation & Depth

The documented shell and Today surfaces have no shadows. White paper, cool canvas, thin borders, and spacing establish depth. Mobile navigation uses stacking level 50, More uses 60, and the focused skip link uses 100. No decorative entrance animation is specified or implemented by the Dossier stylesheet.

## Shapes

Corners are gently rounded. Today cards and findings use the popover radius, KPI cards use the finding radius, and actions retain the action radius. Borders are one pixel. Today's purple monogram is 40px square with 12px corners and weight 650; the older shell monogram remains 44px. These are functional document surfaces rather than ornamental containers.

## Components

### Primary action

A filled blue link with white text, a 17px inline icon, a 10px gap, and a minimum height of 46px. Hover darkens the fill. Keyboard focus throughout the shell uses a 2px accent outline offset by 4px. The primary action opens the existing Agent experience; it does not imply a persisted request.

### Briefing

A pale purple Today card with the agent monogram and byline, a heading, summary, opportunity count, conversational action, and findings anchor. Padding is 22px on desktop and 18px on mobile. Its purple primary action retains the shell focus outline and 46px minimum height. The generic Growth Agent label is the current implementation, not a configured persona or a finalized identity system. The older white briefing token describes retained shell CSS, not the current Today composition.

### Findings and evidence links

Today shows up to three keyword finding cards with title, latest recorded position, interpretation, For review label, and evidence link. Evidence links use blue, a 6px icon gap, and minimum 44px height; they preserve the selected reporting period without implying rankings belong to that period. Missing findings use an explicit empty card.

### Navigation

Desktop links have a 48px minimum height, 12px icon gap, and pale-blue active/hover fill. Mobile controls have a 48px minimum height and 11px labels. Current links use `aria-current`; More exposes `aria-expanded`. More closes after navigation, via its close button, or on Escape; close and Escape return focus to its trigger. A keyboard skip link becomes visible on focus.

### Secondary content

Today uses bordered cards for results, prepared actions, conversations, and activity. Results show selected-period totals and enquiry comparison only when a baseline exists. Prepared actions explicitly say recommendations are unavailable; there are no approval controls. Conversation numbers are attributed enquiries, with unavailable threads and insights stated nearby. Agent activity states that the feed is unavailable; any published work is separately labeled team-reported. Ask Agent embeds the existing assistant styling with placement adjustments; Results retains its existing presentation.

### Performance and period controls

The four KPIs are visitors, organic clicks, enquiries, and qualified enquiries. Missing visitor/search observations use an em dash and availability label. The native date selector and custom date inputs have 44px minimum height; a status label immediately announces updating results, controls disable while pending, and the KPI/grid area dims to 0.65 opacity under `aria-busy`.

Growth Overview has local Traffic, Google, and Enquiries buttons with `aria-pressed`, pale-blue selection, and 44px minimum height. Its chart area reserves 210px. Traffic and Google show actual published monthly history through the selected end month with metric units and endpoint month labels; missing months are not filled. Enquiries shows the period total with an explicit missing-history state. About these results discloses source and aggregation boundaries. No unavailable history is synthesized.

## Do's and Don'ts

- Do preserve the scoped client shell and Today authority of this document.
- Do use the blue accent for actionable links, navigation state, and visible keyboard focus.
- Do keep limitations and missing records readable beside the relevant content.
- Do preserve mobile bottom clearance and usable control heights.
- Don't imply scans, persisted requests, approvals, or configured identity that Phase 1 does not implement.
- Don't spread this specification into legacy Results, the embedded assistant, admin, staff, or public surfaces without a separate migration decision.
- Don't add glowing AI effects or decorative entrance animations to the chosen Client Dossier world.
