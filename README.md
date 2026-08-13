# Clausewright

**Suspension Defense Copilot for Amazon & Walmart sellers.**
*Every day dark costs you a day's sales. Get back to selling — with the exact
policy clause on your side.*

Paste your deactivation notice; get a submission-ready, policy-cited Plan of
Action in minutes — with a human appeal writer one click away when the case
needs judgment. $149 Rescue / $399 rush human-reviewed / Shield monitoring
$49-mo (30 days included with every appeal).

This company was ideated, validated, designed, built and go-to-market-planned
end-to-end by an autonomous multi-agent pipeline (73 agents across 4
workflows), with every decision anchored in published literature. `PLAN.md`
describes the factory; the phases below are its output.

## Repository map

| Phase | Directory | Contents |
|---|---|---|
| 0 — Plan | `PLAN.md` | The factory's operating plan + canonical literature corpus |
| 1 — Ideation | `phase-1-ideation/` | 48 raw ideas, shortlist of 8, 12-judge Borda vote (`VOTE_RESULTS.md`), 4 deep-dive validation reports, **`IDEA_DOSSIER.md`** (the 10 binding decisions D1–D10), pitch site (`site/index.html`) |
| 2 — Design | `phase-2-build/` | `architecture/` (system, corpus, LLM engine, user journeys — 8 ADRs, 13 mermaid diagrams), `identity/` (naming, brand book, liquid-glass design system, landing), adversarial `DESIGN_REVIEW.md` + `BUILD_REVIEW.md`, `screenshots/` of the verified journey |
| 2c — Product | `app/` | The working application: Next.js + Postgres + Anthropic. 347 offline tests, e2e journey verified. See `app/README.md` |
| 3 — Acquisition | `phase-3-acquisition/` | Channel research, 60-row partner CRM + 15-channel map, outreach **drafts** (nothing auto-sent), `GTM_PLAYBOOK.md` day 1–90, `ACQUISITION_REVIEW.md` |

## The product in one flow

notice → **classify** (33 reason codes; low confidence escalates to a human,
never guesses) → **retrieve** (code-keyed slice of the verbatim policy corpus,
prompt-cached — no vector DB) → **draft** (every claim carries an enforced
citation to the exact policy clause) → **critique** (bounded evaluator loop)
→ cited preview → payment → POA + submission checklist (the seller submits;
we never touch their account) → 30 days of monitoring → consented outcome
capture (the compounding moat).

## Launch gates (do not skip)

- Trademark knockout search by counsel (Classes 9/42) before filing — `phase-2-build/identity/NAMING.md` §7.
- No public success-rate or turnaround-time claims until measured (gates G1–G6, `ARCHITECTURE.md` §9).
- All outreach in `phase-3-acquisition/outreach/` is draft-only pending founder review.
