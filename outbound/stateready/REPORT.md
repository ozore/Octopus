# StateReady outbound report

**Generated:** 2026-09-03 23:26 UTC - `python3 -m outbound.engine.cli stateready report`
**Status:** drafts-first. Nothing in this report was sent by an agent.

## 1. What the lists can support

| | rows |
|---|---:|
| end-customer rows in the phase-3 list(s) | 641 |
| with a generic business mailbox | 81 |
| with a contact page only | 263 |
| route dropped: not a recognisable generic mailbox | 0 |
| no contact route recorded at all | 297 |
| of the usable routes, found by the phase-4 enrichment pass | 279 |
| **usable in the workbook** | **344** |
| partner rows | 162 |
| partner rows with a usable route | 72 |
| excluded rows (seed the suppression list) | 13 |

> At 20 new organisations a day, the usable pool of 344 lasts about 17 sending days before it needs extending.

## 2. Workbook

- customers: **344** rows (81 mailbox, 263 contact page)
- partners: **72** rows (14 mailbox, 58 contact page)

| stage | rows |
|---|---:|
| new | 344 |

## 3. Sent

Nothing has been sent or dry-run yet.

## 4. Replies recorded

| kind | count |
|---|---:|
| (none yet) | 0 |

## 5. Reading this honestly

- Rates over a base under 30 are printed with their base; they are not evidence.
- `dryrun` rows are counted as emails because they consumed a step in the sequence; they were never delivered to anyone.
- No open tracking and no link tracking exist by design, so there is no open rate here and there never will be. Replies are the only signal.

