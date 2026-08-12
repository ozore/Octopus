# Octopus — Autonomous Company Factory

Master plan for a fully autonomous, multi-agent pipeline that ideates, validates,
designs, builds, and prepares go-to-market for a new company. Orchestrated by a
Fable main loop; work fanned out to ~100+ specialized subagents (Sonnet for
wide research/mechanical work, Opus for judgment, synthesis, architecture and
design). Every phase commits its deliverables to this repository.

North Star: a simple, high-PMF business that can generate revenue fast
(subscription or high-ticket), ideally built on a proprietary knowledge/
intelligence base with an AI engine on top. The idea must stay simple.

## Phase 1 — Ideation (fleet of ~43 agents)
- 24 persona agents (product managers, developers/architects, BI & market
  analysts, growth/sales, vertical domain experts, VC-style skeptics) research
  the web — forums, Reddit, HN, niche industry sites, pricing pages — for real,
  evidenced pain points and each propose 2 company ideas.
- 1 clustering agent dedupes and merges into a shortlist of 8.
- 12 judge agents vote (Borda count), each through a distinct lens: PMF
  evidence, speed-to-revenue, simplicity, AI-buildability, willingness-to-pay,
  moat, distribution, competition gap, churn, market size, monetization
  clarity, execution risk.
- 4 deep-dive agents validate the winner: demand/PMF evidence, competition &
  positioning, GTM & pricing, MVP scope & feasibility.
- Deliverables committed under `phase-1-ideation/`: raw ideas, shortlist,
  votes & tally, research reports, `IDEA_DOSSIER.md`, and a standalone
  `site/index.html` presenting the idea, why it wins, and how to build it.

## Phase 2 — Design & Build
- **2a Architecture**: stack choice, LLM usage (or not), data/knowledge-base
  design, mermaid architecture & user-journey diagrams, ADRs. Committed under
  `phase-2-build/architecture/`.
- **2b Visual identity**: naming, brand, liquid-glass design system, a
  beautiful non-text-heavy landing page that sells. Committed under
  `phase-2-build/identity/`.
- **2c Implementation**: knowledge-base construction (scraping, structuring,
  wiki organization) if the idea calls for it; backend; frontend; AI engine;
  test suites; app running end-to-end. As many dev/test agents as needed,
  in sub-waves (scaffold → modules → integration → tests → polish).
  Committed under `app/`.

## Phase 3 — Customer acquisition
- Prospect research agents build a qualified prospect list from the ICP.
- CRM structure (data + lightweight UI or structured files) seeded with
  prospects, segments, and pipeline stages.
- Outreach sequences drafted (email/LinkedIn) — drafts only, nothing is sent.
- Committed under `phase-3-acquisition/`.

## Operating rules
- Fully autonomous: no questions to the founder until the app is delivered.
- Commit at every phase boundary and significant sub-step; push regularly to
  `claude/company-ideas-template-cdjpj8`.
- Model routing: Sonnet = wide fan-out research & mechanical coding;
  Opus = judging, synthesis, architecture, brand & critical code; Fable = orchestration.
