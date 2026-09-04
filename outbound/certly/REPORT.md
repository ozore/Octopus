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


## 6. Wave 3: sequences, playbook and support (2026-09-04)

**Author:** Outbound Copywriter, phase-4 fleet, wave 3. Hand-written; `report` regenerates the sections
above and will drop this one (`REQUESTS.md` R8), so the same text is kept in `outbound/certly/CLAUDE.md` §6.

### 6.1 Sequences written

| sequence | segments (substring match in `config.json` `sequence_map`) | rows | delays (per step) |
|---|---|---:|---|
| `godfather-pm` | residential property management (265), commercial property management (64), self-storage operator (55), manufactured housing community operator (23), student housing operator (9) | 416 | 0, 4, 9, 16 |
| `godfather-hoa` | HOA / community association management | 196 | 0, 4, 9, 16 |
| `godfather-gc` | commercial GC (188), building contractor (11), residential / multifamily builder (6), specialty prime (mechanical) (5), design-build GC (2) | 212 | 0, 4, 9, 16 |
| `partner-intro` | all eleven partner segments of `workbook-partners.csv` | 115 | 0, 14, 28; the fourth file exists and is never sent (`partner_max_step: 3`) |
| `plain-intro` | `default_sequence`; rewritten to the offer | 0 | 0, 4, 9, 16 |

Email 1 of the three godfather sequences is OFFER.md §11.1 adapted to the facts that exist (`segment`,
`location`, `portfolio`); the vendor-band estimate has no fact and was not invented. Follow-ups follow
§11.2: the sample report (sent by hand on a one-word reply, since the engine sends no attachments), the
premium-audit trigger with the Travelers wording OFFER.md cites, and a breakup that offers the segment's
requirement template. Every email signs with `{{sender.name}}` and the engine footer carries
`Certly, a TheVillage Company`.

### 6.2 Segment coverage

Both workbooks, every row reaches a mapped sequence; **0 rows fall to `default_sequence`**.
Customers: 824 rows = 416 pm + 196 hoa + 212 gc. Partners: 115 rows = 115 partner-intro.

### 6.3 Rendering results

- 939 rows x 5 sequences x 4 steps = **18,780 step renders, 0 `MissingVariable`**, 0 unresolved syntax,
  0 blank artefacts (`compose.BLANK_ARTEFACTS`), 0 em or en dashes, 0 banned status words in copy.
- Longest rendered body per step (with a two-word sender name): initial 167 of 170, follow-up 2: 102 of
  110, follow-up 3: 109 of 110, breakup 69 of 70. Longest subject: 55 characters.
- End to end on a scratch copy under `OUTBOUND_ROOT` with test env values: customers 2026-09-14, 20
  drafts, 0 blocked, 0 failed, 0 warnings; partners 2026-09-15, 20 drafts (3 email, 17 contact form), 0
  blocked, 0 failed. Without env values the only blocks are `from_address_missing`,
  `postal_address_missing`, `unsubscribe_url_missing`, as designed.
- Cadence by dryrun: customer step 2 planned at +4, step 3 at +9 (Sunday rolled to Monday), step 4 at
  +16, then `sequence_finished`; partner step 2 at +14, step 3 at +28, then `sequence_finished`.
- Engine tests: 149 OK, unchanged.

### 6.4 Also written

`PLAYBOOK.md` (conversion path, routines, reply handling, objection scripts, fulfilment, partner motion,
LinkedIn at organisation level, KPIs, the zero-reply procedure, founder decisions); `support/` with ten
templates; `REQUESTS.md` with ten engine requests; `CLAUDE.md` for this folder.

### 6.5 Founder decisions (PLAYBOOK.md §13, defaults ship if silent)

F1 guarantee (§6.1 as written, used); F2 holding strangers' certificates by email before the legal read;
F3 the "same day" report turnaround; F4 sender name; F5 partner referral terms (none stated, to be
decided by the founder); F6 support response time (one business day); F7 product name; F8 em dashes in
two canonical OFFER.md sentences rendered as a colon or comma; F9 contact-form rows; F10 the sample Gap
Report must exist before day 0; F11 env values and mailbox start date; F12 the partner day.
