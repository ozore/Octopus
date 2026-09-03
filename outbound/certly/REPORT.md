# Certly outbound report

**Generated:** 2026-09-03 23:26 UTC - `python3 -m outbound.engine.cli certly report`
**Status:** drafts-first. Nothing in this report was sent by an agent.

## 1. What the lists can support

| | rows |
|---|---:|
| end-customer rows in the phase-3 list(s) | 1,578 |
| with a generic business mailbox | 290 |
| with a contact page only | 534 |
| route dropped: not a recognisable generic mailbox | 0 |
| no contact route recorded at all | 754 |
| of the usable routes, found by the phase-4 enrichment pass | 303 |
| **usable in the workbook** | **824** |
| partner rows | 204 |
| partner rows with a usable route | 115 |
| excluded rows (seed the suppression list) | 37 |

Per source list:

| list | end-customer | mailbox | contact page | no route |
|---|---:|---:|---:|---:|
| certly-gc | 601 | 90 | 122 | 389 |
| certly-pm | 977 | 200 | 412 | 365 |

> At 20 new organisations a day, the usable pool of 824 lasts about 41 sending days before it needs extending.

## 2. Workbook

- customers: **824** rows (290 mailbox, 534 contact page)
- partners: **115** rows (3 mailbox, 112 contact page)

| stage | rows |
|---|---:|
| new | 824 |

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

