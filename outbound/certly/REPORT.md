# Certly outbound report

**Generated:** 2026-09-03 20:21 UTC - `python3 -m outbound.engine.cli certly report`
**Status:** drafts-first. Nothing in this report was sent by an agent.

## 1. What the lists can support

| | rows |
|---|---:|
| end-customer rows in the phase-3 list(s) | 1,578 |
| with a generic business mailbox | 7 |
| with a contact page only | 514 |
| route dropped: not a recognisable generic mailbox | 0 |
| no contact route recorded at all | 1,057 |
| **usable in the workbook** | **521** |
| partner rows | 204 |
| partner rows with a usable route | 115 |
| excluded rows (seed the suppression list) | 37 |

Per source list:

| list | end-customer | mailbox | contact page | no route |
|---|---:|---:|---:|---:|
| certly-gc | 601 | 4 | 76 | 521 |
| certly-pm | 977 | 3 | 438 | 536 |

> At 20 new organisations a day, the usable pool of 521 lasts about 26 sending days before it needs extending.

## 2. Workbook

- customers: **521** rows (7 mailbox, 514 contact page)
- partners: **115** rows (3 mailbox, 112 contact page)

| stage | rows |
|---|---:|
| new | 521 |

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

