# Growth1000

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Business owners who want someone looking after growth, not another analytics tool to learn. Internal administrators configure each client; staff handle assigned work.

## Product Purpose

A dedicated AI-powered Growth Agent, backed by the internal team, explains what happened, why it matters, and what should happen next across the client's website, Google presence, analytics, and customer enquiries.

## Positioning

Get a Growth Agent for your business. The workspace is where clients receive briefings, ask questions, submit requests, review recommendations, approve work, and see results.

## Operating Context

Staff-led onboarding, not self-service SaaS. Configuration remains admin-only; existing staff handle assigned work. Clients never configure credentials or integrations. Risky changes require review and approval. Approval is not execution.

## Capabilities and Constraints

V1 scope: website health/performance/conversion, organic SEO and Google visibility, GA4/Search Console, website chatbot and WhatsApp enquiries/conversations, recommendations, requests, results, and real agent activity.

Exclude paid advertising and social management/scheduling from the V1 offering. Preserve historical records and working legacy functionality during migration; hiding a capability must not delete its data.

Client navigation: Today, Ask Agent, Website, SEO & Google, Conversations, Results. Mobile: Today, Agent, Website, SEO, More. Minimum mobile QA: 390 x 844.

The public CTA opens a new enquiry form. No pricing, response-time promises, or contact details are supplied.

## Brand Commitments

Growth1000. Calm, premium, trustworthy, human, concise, intelligent, action-oriented. No glowing AI effects, futuristic styling, chart-first dashboards, or dense repetitive statistic rows. Agent names come from configuration, never a hardcoded persona.

## Evidence on Hand

Existing repository: authenticated client results, GA4/Search Console imports, lead ingestion, business knowledge, published reports, SEO workflows, and audit events. Detailed gaps and migration risks are in docs/growth-agent-v1-audit.md.

No verified full conversation corpus, website health score, or persistent agent memory was identified in the repository audit. Do not portray these as live. Examples in the product brief are illustrative, not production evidence.

## Product Principles

- Insights before charts; evidence before claims.
- Distinguish observations, recommendations, approvals, and completed actions.
- Missing or stale data is explicit, never replaced by fabricated values.
- Preserve tenant isolation, internal-note privacy, and server-only credentials.
- Fast feedback and usable mobile controls are part of product correctness.

## Release Constraints

Evolve the existing Next.js/Supabase application through controlled phases. No destructive rewrite, production deployment, or database migration to another region. Use additive schema changes and isolated verification before rollout.

## Open Decisions

Conversation connector details, data-retention policy, website monitoring sources, and the commercial-enquiry routing/notification owner require confirmation before enabling their external effects.
