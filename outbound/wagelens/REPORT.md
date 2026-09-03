# WageLens outbound report

**Generated:** 2026-09-03 23:26 UTC - `python3 -m outbound.engine.cli wagelens report`
**Status:** drafts-first. Nothing in this report was sent by an agent.

## 1. What the lists can support

| | rows |
|---|---:|
| end-customer rows in the phase-3 list(s) | 10,295 |
| with a generic business mailbox | 836 |
| with a contact page only | 933 |
| route dropped: not a recognisable generic mailbox | 0 |
| no contact route recorded at all | 8,526 |
| of the usable routes, found by the phase-4 enrichment pass | 1,689 |
| **usable in the workbook** | **1,769** |
| partner rows | 391 |
| partner rows with a usable route | 0 |
| excluded rows (seed the suppression list) | 21 |

> At 20 new organisations a day, the usable pool of 1,769 lasts about 88 sending days before it needs extending.

## 2. Workbook

- customers: **1,769** rows (836 mailbox, 933 contact page)
- partners: **0** rows (0 mailbox, 0 contact page)

| stage | rows |
|---|---:|
| new | 1,769 |

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

