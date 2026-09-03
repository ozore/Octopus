# WageLens outbound report

**Generated:** 2026-09-03 20:21 UTC - `python3 -m outbound.engine.cli wagelens report`
**Status:** drafts-first. Nothing in this report was sent by an agent.

## 1. What the lists can support

| | rows |
|---|---:|
| end-customer rows in the phase-3 list(s) | 10,295 |
| with a generic business mailbox | 80 |
| with a contact page only | 0 |
| route dropped: not a recognisable generic mailbox | 0 |
| no contact route recorded at all | 10,215 |
| **usable in the workbook** | **80** |
| partner rows | 391 |
| partner rows with a usable route | 0 |
| excluded rows (seed the suppression list) | 21 |

> At 20 new organisations a day, the usable pool of 80 lasts about 4 sending days before it needs extending.

## 2. Workbook

- customers: **80** rows (80 mailbox, 0 contact page)
- partners: **0** rows (0 mailbox, 0 contact page)

| stage | rows |
|---|---:|
| new | 80 |

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

