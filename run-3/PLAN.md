# Run 3 — Autonomous Company Factory, third company

Third independent pass of the Octopus factory (`../PLAN.md`). Run 1 produced
**Clausewright** (marketplace suspension-appeal drafting, `../app/`). Run 2
produced **Ratepin** (Davis-Bacon certified payroll,
branch `claude/autonomous-app-construction-neqoyx`, `run-2/app/`). This run
builds a *third*, independent company. Both previous winners — and near
variants of them — are excluded by construction.

## Unchanged: the product must live on its own

Run 2's autonomy gates A1–A6 apply again, and they are a **hard pre-ballot
filter**, not a weighted criterion. An idea that fails any single gate never
reaches the vote; the failed gate and the reason are logged in
`phase-1-ideation/autonomy-rejections.json`.

- **A1 — Self-serve end to end.** Signup, payment, delivery of value and
  renewal happen with no human on the seller side. No demos, no onboarding
  calls, no manual provisioning, no sales-assisted close.
- **A2 — Automated fulfilment.** The thing the customer pays for is produced
  by code. No review queue, no expert-in-the-loop, no "3–5 business days".
- **A3 — No escalation path to a human.** When the engine is unsure it
  degrades *inside the product*: says so, shows sources, narrows the claim,
  refunds. No support address anywhere in the compliance-critical flow.
- **A4 — Self-maintaining data.** The corpus refreshes on cron from public,
  machine-readable sources and detects its own staleness.
- **A5 — Unattended operations.** Ingestion, deploys, dunning, monitoring:
  all scheduled, all fail-closed.
- **A6 — Zero human minutes per customer served**; support load bounded by
  design.

**The AI is the engine, never the arbiter.** The model may order, rank, and
draft into a template. It never produces a number, a price, a rate, or a
decision a customer signs. Its return type must contain no field where a
decision could be written.

## Changed: exactly ONE human breakpoint

Phase 1 runs fully autonomously: fresh web mining, re-screen of the two
already-mined pools (48 ideas from run 1, 32 from run 2), clustering, a
shortlist of 8, a 12-lens Borda vote, and deep validation of the **top 3**
(not just the winner).

Then the run STOPS and presents the founder a single readable page:

- the 8 candidates with a one-sentence promise each;
- the Borda table and what each lens saw;
- for the top 3: proof that money already changes hands for a worse
  solution, the corpus that carries the moat and its refresh cadence, the
  defensible price, and what is NOT yet proven;
- the ideas rejected by the autonomy gate and which gate they failed;
- a recommendation, including the reason NOT to choose the runner-up.

The run waits for the founder's choice. This is the only question of the
entire run. After the answer: design, build, tests, adversarial review,
go-to-market — fully autonomous to delivery, no further questions.

## Exclusions

Neither Clausewright (marketplace suspension appeals, run 1) nor Ratepin
(Davis-Bacon certified payroll, run 2), nor any near variant (certified
payroll in any form, prevailing-wage rate lookup, marketplace/account appeal
drafting). The mined pools contain other leads: use them, but also mine new
ground on angles the pools do not cover.

## Binding rules learned from runs 1 and 2

1. **Verify live, never from memory.** Every endpoint, competitor price,
   regulatory figure and search volume is re-fetched and dated. An invented
   URL invalidates the document. A secondary source repeating a number is
   not a source.
2. **No unmeasured claim in any rendered string.** Define gates G1..Gn
   before building; until a gate is passed the product states the
   MECHANISM, not the outcome. No environment variable or copy edit can
   unlock a claim.
3. **No probe blocks until its trigger rate is measured against the real
   corpus.** Run 2 shipped a probe testing a constant field: it would have
   quarantined 100% of the data on first ingest.
4. **No present tense for code that does not exist.** A document describing
   an unbuilt job, lint, or registry writes it in the future tense with a
   marker saying where it is specified. A false "build status" block is
   worse than no block.
5. **Adversarial review drives the application, it does not read it.** It
   exercises the unhappy paths, not the happy path. A review that finds
   nothing has failed. Tests must read what the customer reads: an
   invariant verified on a value passes green above a dead-end on screen.
6. **Corrections are logged, not smoothed over.** One single register of
   refuted claims (`phase-2-build/CORRECTIONS.md`), with what was verified,
   the defensible replacement wording, and a grepable string so CI catches
   a reprint.
7. **Nothing is sent.** All go-to-market stays as drafts on disk.

## Phases

Same four-phase pipeline, executed by workflow fleets:

1. **Ideation** — fresh mining wave under A1–A6 + re-screen of the 80 mined
   ideas; cluster to a shortlist of 8; 12-lens Borda vote where autonomy was
   already enforced as a hard pre-filter; deep validation of the top 3;
   **founder breakpoint**. → `phase-1-ideation/`
2. **Design** — architecture, self-refreshing corpus design, engine
   (AI-as-engine-never-arbiter), naming/brand/design system, adversarial
   review. → `phase-2-build/`
3. **Build** — working application, offline test suite, e2e verified.
   → `app/`
4. **Acquisition** — channels that compound without a salesperson, CRM,
   draft sequences (drafts only). → `phase-3-acquisition/`

## Operating rules

- Autonomous everywhere except the single Phase-1 breakpoint.
- Literature grounding is mandatory and unchanged from `../PLAN.md`
  (Graham, Ries, Blank, Fitzpatrick, Ellis, Vohra, Andreessen; Hormozi,
  Ramanujam, Poyar; Dunford, Weinberg & Mares, Moore; Helmer, Thiel,
  Christensen; Lewis et al. 2020 RAG, Karpathy, 12-Factor, Nielsen).
  Every deliverable ends with a References section of actually-fetched
  URLs; anything not traceable to a source is labelled a hypothesis.
- Commit at every phase boundary; push to
  `claude/run-3-autonomous-business-xdnmfi`.
