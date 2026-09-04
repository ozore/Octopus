# Where phase 4 stopped, and how to restart it

**Date:** 2026-09-04, 03:50 UTC. **Branch:** `claude/mature-ideas-list-rqx2gf`.
**Last commit:** `2e20a7b`. Written when a session limit stopped thirteen build
agents and four wave-3 agents at once. Read this before starting anything.

## 1. State of the tree

| Area | State |
|---|---|
| `npm run typecheck` (all workspaces) | clean, 0 errors |
| `apps/*` test suites and next builds | **not run since the interruption** |
| `outbound/` (3 apps) | complete, verified, committed |
| `outbound/engine` | 149 tests pass |
| PR #2 | open, CI green on `f38dff8`, later commits not yet confirmed |

## 2. Do this first, in this order

```bash
npm run typecheck
for a in wagelens certly stateready; do
  npm test  --workspace apps/$a
  npm run build --workspace apps/$a
done
python3 -m unittest discover -s outbound/engine -p 'test_*.py'
```

Fix whatever the interrupted agents left broken before adding anything new.
Their per-module notes are in `apps/<app>/BUILD.md` and `apps/<app>/CLAUDE.md`.

## 3. Work that was in flight and is unfinished

- **Sub-wave B, thirteen feature agents.** WageLens B1 to B4, Certly B1 to B4,
  StateReady B1 to B5. Each was mid-module. The module maps and the deviations
  each agent recorded are in `apps/<app>/BUILD.md`; what is already implemented
  is on disk and typechecks.
- **StateReady knowledge base.** Nine records for Arizona, Ohio and Michigan are
  written but still `publishable: false`: they need the second verification pass
  described in `phase-4-revenue/stateready/KNOWLEDGE_BASE.md`.
- **Outbound reviews.** `outbound/wagelens/REVIEW.md`, `outbound/certly/REVIEW.md`
  and `outbound/stateready/REVIEW.md` were commissioned and never written. The
  briefs are in the session transcript; the standard is `phase-4-revenue/PIPELINE.md`.
- **Outbound engine fixes.** The requests are filed in
  `outbound/<app>/REQUESTS.md`. The blocking one, reported by all three writers:
  the partner workbook shares `drafts/<date>/` and `approvals/<date>.json` with
  the customer workbook, so `approve` takes the whole folder and a partner send
  re-logs customer drafts. Nothing is sendable until that is separated.
- **WageLens route enrichment.** Stopped again after one chunk. Resume with the
  single command in `phase-3-acquisition/prospects/scripts/enrich/CLAUDE.md` §2,
  then rebuild and validate the enrichment CSV before re-seeding. Do **not** run
  `outbound.engine.cli <app> report`: it overwrites hand-written sections of
  `REPORT.md`. Fixing that is one of the filed engine requests.

## 4. Still waiting on the founder

Names and trademark checks, the postal address and sending mailbox, the Stripe
products (the per-app lists are in each `OFFER.md` and `STRIPE_SETUP.md`), the
Vercel Pro upgrade before any charge, and counsel's read on the guarantees.
`phase-4-revenue/PREREQUISITES.md` is the live list.
