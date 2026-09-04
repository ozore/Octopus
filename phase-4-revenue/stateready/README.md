# stateready: phase 4 workspace

Deliverables of this directory (filled by the wave-1 fleet, reviewed in wave 1b):

| file | author | status |
|---|---|---|
| PERSONA.md | Buyer & Identity agent | pending |
| IDENTITY.md + design-system.css | Buyer & Identity agent | pending |
| UX.md | Buyer & Identity agent | pending |
| BACKLOG.md + specs/ | Product Owner agent | **done** — 14 Must items, 14 specs |
| KNOWLEDGE_BASE.md | Product Owner agent | **done** — plus `ontology/`, `kb-data/` (9 records), `kb-scripts/` |
| OFFER.md | Offer & Landing agent | pending |
| LANDING_SPEC.md | Offer & Landing agent | pending |
| REVIEW.md | Reviewer agent (wave 1b) | pending |
| THRESHOLDS.md | Product Owner agent | **done** — 4 metrics, bands committed, H1–H8 registered |

Each agent keeps its own memory in `CLAUDE.md` inside its sub-directory (`identity/`, `product/`, `offer/`, `review/`).
See `../PLAN.md` and `../PIPELINE.md`.

## Product Owner deliverables (wave 1, 2026-09-03)

| what | where | state |
|---|---|---|
| Backlog, Must / Should / Later / Never | `BACKLOG.md` | 14 Must items, ~34 dev-days |
| One spec per Must item | `specs/01…14` | all 14 present, ~17,800 words |
| Knowledge-base design | `KNOWLEDGE_BASE.md` | scope, verification protocol, cadence, gates, disclaimer, remaining-36 plan |
| Schemas | `ontology/` | `sourced_value`, `state_trade_record`, `official-hosts`, `id-grammar` |
| Data | `kb-data/` | **9 records** (TX/FL/NC × HVAC/plumbing/electrical), 603 values, 459 verified, 144 honestly unknown, 35 sources hashed |
| Scripts | `kb-scripts/` | `validate.py` (13 gates, exits 0), `verify_pass_b.py` (459/459), `refresh_sources.py` (drift, 35/35 clean), **`accept_drift.py`** (resolves a drift in one action — baseline + citing records + `_history/`), **`test_accept_drift.py`** (17 assertions, all passing), `rank_states.py`, `build_records*.py`, `lib_kb.py` |
| Pre-committed thresholds | `THRESHOLDS.md` | T1–T4 with stop/iterate/persevere bands, evaluated at n ≥ 100 |
| Memory | `product/CLAUDE.md` | rules, research log, build log, assumptions, advice to wave 2 |

**That disagreement is resolved.** The free 14-day no-card trial (first 100 signups) is the launch
model — **D1** in `REVIEW.md` §1, applied across eight files and logged in `REVIEW_RESPONSE.md`. The
`$149` First State Audit and the done-for-you roster build are deferred to iteration 2 behind the
register-ingestion feasibility spike (`BACKLOG.md` **S10**). `THRESHOLDS.md` H2 is in force and H2b is
registered and out of force.

**Read `REVIEW.md` and then `REVIEW_RESPONSE.md` before any of the documents below** — the response
carries one row per finding with what changed, what was declined and why, and the four decisions the
founder may want to overturn.
