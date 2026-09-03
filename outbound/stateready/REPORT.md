# StateReady outbound report

**Generated:** 2026-09-03 20:21 UTC - `python3 -m outbound.engine.cli stateready report`
**Status:** drafts-first. Nothing in this report was sent by an agent.

## 1. What the lists can support

| | rows |
|---|---:|
| end-customer rows in the phase-3 list(s) | 641 |
| with a generic business mailbox | 12 |
| with a contact page only | 53 |
| route dropped: not a recognisable generic mailbox | 0 |
| no contact route recorded at all | 576 |
| **usable in the workbook** | **65** |
| partner rows | 162 |
| partner rows with a usable route | 72 |
| excluded rows (seed the suppression list) | 13 |

> At 20 new organisations a day, the usable pool of 65 lasts about 3 sending days before it needs extending.

## 2. Workbook

- customers: **65** rows (12 mailbox, 53 contact page)
- partners: **72** rows (14 mailbox, 58 contact page)

| stage | rows |
|---|---:|
| new | 65 |

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

