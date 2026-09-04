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


## 6. Wave 3: sequences, playbook and support (Outbound Copywriter, 2026-09-04)

Hand-written. `python3 -m outbound.engine.cli stateready report` regenerates sections 1 to 5 and drops this one; the same facts live in `CLAUDE.md` and the file history.

### 6.1 Sequences written

| sequence | segments (substring key in `config.json`) | rows | delays | free deliverable in the ask |
|---|---|---:|---|---|
| `godfather-platform` | platform operating brand, PE-backed home-services platform, roofing / exterior platform, restoration platform, fire protection / life safety platform, commercial mechanical / electrical platform (`platform`) | 308 | 0, 4, 9, 16 | one state × one trade State Rulebook PDF (OFFER §7 free rung) |
| `godfather-multistate` | specialty multi-state contractor (`specialty multi-state`), fast-growing independent trade contractor (`fast-growing independent`) | 26 | 0, 4, 9, 16 | same, for the next state |
| `godfather-franchise` | franchise brand (licensed trade), franchise system (`franchise`) | 10 | 0, 4, 9, 16 | same, for the state with most franchisees |
| `partner-intro` | PE sponsor, national trade association, exam prep / CE school, surety bond / contractor insurance, field service software vendor | 62 | 0, 14, 28 (+42 never sent) | same, to hand on |
| `partner-expediter` | licence expediting / compliance firm (`licence expediting`) | 10 | 0, 14, 28 (+42 never sent) | coexistence: they file, we do not |
| `plain-intro` | fallback (`default_sequence`) | 0 | 0, 4, 9, 16 | same, generic |

Every regulatory statement in the six sequences is read from `phase-4-revenue/stateready/kb-data/` (records `tx.hvac`, `tx.electrical`, `tx.plumbing`, `nc.electrical`, `nc.hvac`, `nc.plumbing`, `fl.hvac`, `fl.plumbing`, `fl.electrical`). OFFER §11's Illinois and California facts are not in any record and were dropped.

### 6.2 Segment coverage

- `workbook.csv`: 344 rows, 344 routed by `sequence_map`, **0 to default**.
- `workbook-partners.csv`: 72 rows, 72 routed, **0 to default**.
- Facts available per row (from `personalise.phrases()`): `opening` 344/344; `location` 255; `state` 225; `brands` 8; `employees` 5; `locations` 5; `states_operated` 3. Partners: `opening` 72/72, `location` 60. No StateReady row carries `trades`, `federal_awards`, `certification`, `registration`, `payroll_filings` or `portfolio`.

### 6.3 Rendering results

Throwaway script (source in `CLAUDE.md` §5), loading each sequence with `outbound.engine.sequences.load_sequence` and building the context with `outbound.engine.compose.build_context`:

| workbook | rows | steps | renders | MissingVariable | other errors |
|---|---:|---:|---:|---:|---:|
| customers | 344 | 4 | 1,376 | **0** | 0 |
| partners | 72 | 4 | 288 | **0** | 0 |

Worst-case rendered body words per step (every conditional firing): initial 162 to 169 (limit under 170); follow-ups 71 to 107 (under 110); breakups 52 to 56 (under 70). Longest rendered subject 44 characters. No `{{` left in any output, no `BLANK_ARTEFACTS` hit, no em or en dash.

End to end, in a scratch copy under `OUTBOUND_ROOT` (nothing written to the real `plans/` or `drafts/`): `plan --date 2026-09-08` selected 20 customers and 20 partners; `compose` produced 40 drafts, **0 failed to render**, all 40 blocked only by the three unset env placeholders (`from_address_missing`, `postal_address_missing`, `unsubscribe_url_missing`), as designed. With dummy env values set, drafts render clean; 3 partner drafts carry the `form_url_is_a_homepage` warning. A dry-run `send --partners` on that date also logged the 20 customer drafts: `REQUESTS.md` item 1, and the reason the playbook keeps the two workbooks on different days.

### 6.4 Founder decisions

1. **OFFER §11 adapted to the knowledge base:** Illinois 30 April and the California fee figures are out of every email; Texas, Florida and North Carolina facts replace them. Extend the KB or accept.
2. **The ask is one state and one trade,** not "the two states your last acquisition added", and every initial email names the three covered states. Accept, or widen when more records ship.
3. **US spelling in everything a customer reads** (`license`), per `PERSONA.md` §7; `plain-intro` was rewritten from `licence`. The engine footer still says "organisation" (`REQUESTS.md` 8).
4. **Signature line** set in `config.json` to "StateReady, a TheVillage Company" (capital C, as briefed); `LANDING_SPEC.md` §7 prints "a TheVillage company". Pick one; it is one config line.
5. **`partner-expediter` states there is no referral fee in either direction.** OFFER has no referral scheme; this is a statement of absence, not a programme. Confirm.
6. **Customers Monday to Thursday, partners Friday only,** until the shared drafts folder is fixed.
7. **Watch numbers in `PLAYBOOK.md` §11** (reply under 2% at 200, unsubscribe over 2% at 100, rulebooks to trials under one in five) are the copywriter's hypotheses, not OFFER or THRESHOLDS figures. Adopt or replace before the first batch.
8. **Every body ends with `{{sender.name}}`,** so `OUTBOUND_FROM_NAME` decides whether a person's name or a role signs (`outbound/CLAUDE.md` §8 Q3). Unset, it prints a placeholder the engine does not block.
9. **One business day** to send the free rulebook is a service promise set here; OFFER attaches no SLA to the free rung. Keep it or change the scripts.
10. **The twelve over-15-state accounts** are handled by name in `PLAYBOOK.md` §2 because `state_count` does not exist yet.
11. **Support templates state product behaviours from the specs** (15-minute link expiry, 7-day past-due grace, 7-day deletion delay, three exports a day, 180-day re-verification rule). If the build diverges, the templates follow the build.

12. **Ohio is on disk, not live.** `kb-data/oh-electrical.json`, `oh-hvac.json` and `oh-plumbing.json` appeared (untracked, another agent) during this wave with `publishable: false` and no pass-B run. Every email still says Texas, Florida or North Carolina, which is correct today; `CLAUDE.md` §4 lists the files to change when Ohio is publishable.

### 6.5 Engine requests

Nine items in `REQUESTS.md`; item 1 (shared `drafts/<date>/` across workbooks) is the one that can double-send.
