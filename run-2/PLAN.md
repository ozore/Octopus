# Run 2 — Autonomous Company Factory, second company

Second independent pass of the Octopus factory (`../PLAN.md`). Run 1 produced
**Clausewright** (`../app/`). This run builds a *different* company from the
idea pool that was already mined (`../phase-1-ideation/raw-ideas.json`, 48
ideas) plus a fresh mining wave, under one additional binding constraint.

## The binding constraint of this run — the product must live on its own

Run 1's winner relied on a human in the loop (a human appeal writer for
low-confidence cases, founder review gates before outreach). This run forbids
it. A candidate is disqualified unless **every** point below holds:

- **A1 — Self-serve end to end.** Signup, payment, delivery of value and
  renewal happen with no human on the seller side. No demos, no onboarding
  calls, no manual account provisioning, no sales-assisted close required to
  collect the first dollar.
- **A2 — Automated fulfilment.** The thing the customer pays for is produced
  by code. No human review step, no expert-in-the-loop queue, no "we'll get
  back to you in 3–5 days".
- **A3 — No escalation path to a human.** When the system is unsure it must
  degrade safely and legibly inside the product (say so, show sources, narrow
  the claim, refund) — never route to a person.
- **A4 — Self-maintaining data.** The knowledge base refreshes itself on a
  schedule from public, machine-readable sources, and detects its own
  staleness. No manual curation to stay correct.
- **A5 — Unattended operations.** Deploys, backups, ingestion, dunning,
  monitoring and alerting run on schedules; an outage or a bad ingest fails
  closed rather than requiring a person to notice.
- **A6 — Honest economics without labour.** Gross margin holds with zero
  human minutes per customer served; support load is bounded by design
  (self-serve docs, in-product explanations, automatic refunds).

Ideas whose core value is a human judgement call, a filing performed by hand,
a negotiation, or a contingency recovery are out by construction.

## Phases

Same four-phase pipeline as run 1, executed by workflow fleets:

1. **Ideation** — fresh mining wave under A1–A6 + re-screen of the 48 mined
   ideas; cluster to a shortlist; multi-lens Borda vote where autonomy is a
   hard gate, not a tiebreaker; deep validation of the winner.
   → `phase-1-ideation/`
2. **Design** — architecture, self-refreshing corpus design, LLM engine,
   naming/brand/design system, adversarial review. → `phase-2-build/`
3. **Build** — working application, offline test suite, e2e verified.
   → `app/`
4. **Acquisition** — channels that compound without a salesperson (SEO,
   programmatic pages, app stores, communities), CRM, draft sequences.
   → `phase-3-acquisition/`

## Operating rules

- Fully autonomous: no questions to the founder, at any phase, ever.
- Literature grounding is mandatory and unchanged from `../PLAN.md`
  (Graham, Ries, Blank, Fitzpatrick, Ellis, Vohra, Andreessen; Hormozi,
  Ramanujam, Poyar; Dunford, Weinberg & Mares, Moore; Helmer, Thiel,
  Christensen; Lewis et al. 2020 RAG, Karpathy, 12-Factor, Nielsen).
  Every deliverable ends with a References section; anything not traceable to
  a source is flagged as a hypothesis.
- No claim of a measured outcome (success rate, accuracy, turnaround) ships
  before it is actually measured.
- Nothing is sent to a real prospect: outreach is drafts on disk.
- Commit at every phase boundary; push to
  `claude/autonomous-app-construction-neqoyx`.
