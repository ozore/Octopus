# Phase 4: three apps to revenue (WageLens, Certly, StateReady)

**Date:** 2026-09-03. **Owner:** founder (TheVillage). **Operator:** orchestrator agent + fleets.
**Goal:** three fully working, deployed, self-serve apps that take money, plus everything needed to bring paying customers to them. No human loop inside the products; humans stay at support, sales replies and Stripe activation.

The chain the founder wrote, completed with what was missing:

```
define app → build app → build knowledge base + refresh pipeline → offer → landing page
→ conversion strategy + outbound engine → capture prospects → convert → collect money (Stripe)
→ activate + retain (onboarding, lifecycle emails) → track usage → track subscriptions
→ measure against pre-committed thresholds → iterate or stop
```

## 1. Decisions already taken (founder, 2026-09-03)

| # | Decision | Consequence |
|---|---|---|
| D1 | Legal entity: **TheVillage**; the three apps are sub-brands ("WageLens, a TheVillage company") | One Stripe account, one sending domain, one set of legal pages with per-app branding |
| D2 | One Stripe account for all three; revenue split later | Products and prices are created by the founder from a list we hand over; apps read price ids from env; test mode first, live after founder QA |
| D3 | Hosting on **Vercel**, repo `ozore/Octopus` already linked; no custom domains yet | One Vercel project per app with a distinct Root Directory; `*.vercel.app` URLs now, sub-domains of the TheVillage domain later. Vercel Hobby forbids commercial use: Pro before charging |
| D4 | No external cold-email tool; **our own sequencing** (one workbook per app, routines run by Claude Code) | We build `outbound/` in the repo: workbook, sequences, personalisation, daily batch, drafts-first sending through the founder's mailbox, suppression list, CAN-SPAM footer |
| D5 | **No nominative contact provider** | CRM stays organisation-level with the best public route (generic mailbox, contact page); no LinkedIn scraping; personalisation is company-level facts we already hold |

## 2. Defaults applied where the founder did not answer (to confirm or override)

| # | Default | Why |
|---|---|---|
| A1 | The three apps are built **in parallel**; WageLens is the one we push to deployable first | Fleets are parallel by nature; WageLens has the sharpest target list (10,295 contractors already on federal jobs) |
| A2 | Market: **US**; language: **English** for apps, landing pages and outbound | All three products are US-regulatory |
| A3 | Working names kept as slugs (`wagelens`, `certly`, `stateready`); a naming and availability pass runs in wave 1 and recommends final names; the founder decides | "Certly" is already used elsewhere; renaming later is a branding change, not a code change |
| A4 | Outbound runs **drafts-first**: routines write personalised drafts, the founder approves, then sending is enabled batch by batch | Sending is outward-facing; the repo's own gate says draft-only until founder review |
| A5 | Offers: proposed by the offer fleet with guarantees flagged; founder validates before Stripe goes live | Guarantees create liabilities the founder must own |
| A6 | Support: a first-level auto-responder plus a help page per app, escalation to the founder's mailbox | No human loop in product, one human at the edge |
| A7 | Auth: **email magic link**; no OAuth at launch | Zero external identity dependency; OAuth later if signups demand it |
| A8 | Monorepo in this repo: `apps/<app>`, `packages/platform`, `outbound/`; `app/` (Clausewright) untouched | Reuse the proven patterns (adapters mock/live, Drizzle, PGlite tests, CI) without touching the delivered product |
| A9 | Work stays on branch `claude/mature-ideas-list-rqx2gf` (the only branch authorised) and PR #2 | New branches require founder permission |
| A10 | Regulatory data quality: every rule carries a source URL, a `last_verified` date and is verified by two independent agents; a change-detection cron flags source drift; disclaimers on every screen and document | Wrong wage rate or licence rule is a legal event for the customer |
| A11 | Launch coverage: WageLens = federal Davis-Bacon for all 50 states + WH-347; Certly = ACORD 25 only; StateReady = HVAC, plumbing, electrical × the 15 states with most contractor activity | Ship what can be verified; widen after first revenue |
| A12 | Jobs: Vercel Cron hitting a queue-drain route backed by a jobs table (`FOR UPDATE SKIP LOCKED`, same as Clausewright) | No worker process on Vercel |
| A13 | Database: Neon Postgres (one branch per app) via Vercel Marketplace; PGlite for tests | Free tier to start, Vercel-native |
| A14 | Analytics: our own `events` table plus an optional PostHog key | Usage tracking must not depend on a third party |

## 3. Architecture

```
Octopus/
├── app/                      # Clausewright, delivered, untouched
├── apps/
│   ├── wagelens/             # Next.js 15 App Router, own identity, own schema
│   ├── certly/
│   └── stateready/
├── packages/
│   └── platform/             # shared, headless: auth (magic link, sessions), billing (Stripe
│                             # Checkout + Portal + webhook → subscription state), email (Resend),
│                             # events (usage tracking), jobs (queue + cron drain), db helpers,
│                             # legal pages content, admin metrics
├── outbound/
│   ├── engine/               # sequence runner, personaliser, batcher, suppression, CAN-SPAM footer
│   └── <app>/                # workbook.csv, sequences/, drafts/, log.csv
├── phase-3-acquisition/prospects/   # the lists (delivered)
└── phase-4-revenue/          # this plan, research, specs, reviews, prerequisites
```

Per app: `apps/<app>/src/app/(marketing)` landing + legal + pricing; `(app)` product; `api/` Stripe webhook, cron routes, inbound; `src/lib/domain` product logic; `src/lib/kb` knowledge base loaders + refresh pipeline; `tests/` unit + integration on PGlite; `e2e/` Playwright journey.

Vercel: projects `octopus-wagelens`, `octopus-certly`, `octopus-stateready` on the same repo, Root Directory `apps/<app>`, "Include source files outside of the Root Directory" on, ignored build step so a push touching only another app does not rebuild.

## 4. Deliverables per app (definition of done)

| Deliverable | Done when |
|---|---|
| Persona and identity | `PERSONA.md` (who buys, how they buy, what they use, what they need), `IDENTITY.md` + `design-system.css` (colours, type, layout, components, tone) distinct from the other two apps, `UX.md` (workflow, screens, states) |
| Product backlog | `BACKLOG.md` ruthlessly prioritised (MVP = what makes a stranger pay and keep paying), one spec per feature under `specs/` with acceptance criteria |
| Knowledge base | `KNOWLEDGE_BASE.md`: sources verified live, schema, ingestion script, refresh cron, quality gates, disclaimers; data committed or generated by script |
| App | signup/login, onboarding, core features, billing, settings, help, legal, admin metrics; tests green in CI; e2e journey recorded; deployed on Vercel in test-mode Stripe |
| Offer | `OFFER.md`: grand-slam / godfather structure (dream outcome, likelihood, time, effort; guarantee, bonuses, scarcity honest), price ladder, Stripe product list |
| Landing page | Short, felt not read: one problem, one promise, visual proof (infographics, SVG diagrams in the app's palette), one call to action; conversion research cited; live at `/` |
| CRM | `outbound/<app>/workbook.csv` seeded from the prospects lists: organisation, segment, route, personalisation facts, stage, next action |
| Conversion strategy | `outbound/<app>/PLAYBOOK.md`: sequences (initial, 2 follow-ups, breakup), reply handling, objections, demo-less close, triggers; routines to run daily |
| Tracking | events table + admin page: signups, activation, conversion, MRR, churn; Stripe subscription state mirrored in db |
| Thresholds | `THRESHOLDS.md`: pre-committed numbers for persevere / iterate / stop, evaluated at n ≥ 100 |

## 5. Waves

**Wave 0 (orchestrator):** this plan, `PIPELINE.md`, `PREREQUISITES.md`, task tracking.

**Wave 1 (definition, 9 agents in parallel + 1 platform engineer):**
- per app, agent *Buyer & Identity*: persona research → identity → design system → UX
- per app, agent *Product Owner*: backlog + specs + knowledge base design with live-verified sources
- per app, agent *Offer & Landing*: conversion research (Hormozi, Suby, Wiebe, Ogilvy-era direct response, CXL) → offer → landing spec with infographic briefs
- *Platform engineer*: `packages/platform` + `apps/_template` (auth, billing, email, events, jobs, legal, admin), tests, CI matrix, Vercel config docs

**Wave 1b (review):** one reviewer per app reads all wave-1 documents adversarially against the persona and the constraints, writes `REVIEW.md`, and the authors iterate until the reviewer signs.

**Wave 2 (build, per app):** scaffold from template + identity → knowledge base ingestion → core modules → billing → landing → tests → e2e → review agent → fixes → deploy config. Each app: 3 to 5 dev agents in sub-waves plus a reviewer.

**Wave 3 (go-to-market, per app):** outbound engine (shared) + workbook + sequences + playbook + thresholds + support auto-responder; drafts generated for the first 50 organisations per app for founder approval.

**Wave 4 (launch):** Stripe product list handed to founder → ids in env → test purchase end to end → founder flips live → first batches sent → weekly review file.

## 6. Risks that can sink revenue, and the mitigation built in

- Wrong regulatory data (WageLens rate, StateReady rule): double verification, source and date on every value, disclaimers, refund policy.
- Cold email burning the TheVillage domain: separate sending mailbox, warm-up schedule, 20/day/mailbox cap at start, suppression list, monitoring bounces.
- Vercel Hobby commercial restriction: flagged in prerequisites; Pro required before live.
- Certly extraction accuracy on non-standard COI layouts: confidence score per field, "needs review" state, sample corpus of public ACORD 25 PDFs for tests.
- Nobody answers a prospect in time: auto-responder + founder escalation with SLA in the playbook.

## 7. Where things live

- Plans and research: `phase-4-revenue/<app>/`
- Code: `apps/<app>/`, `packages/platform/`
- Outbound: `outbound/`
- Founder to-dos: `phase-4-revenue/PREREQUISITES.md`
