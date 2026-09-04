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


## 6. Wave 3: sequences, playbook and support (2026-09-04)

**Author:** Outbound Copywriter, wave 3. **Status:** written and rendered; nothing sent. This section
is a snapshot: `report` regenerates this file from the log, and the durable record is
`outbound/wagelens/CLAUDE.md` section 6.

### What was written

| path | what |
|---|---|
| `sequences/godfather-federal/` | `OFFER.md` section 9, adapted to the facts the workbook holds (no county fact exists; the county is the ask) |
| `sequences/godfather-trade/` | specialty subs: crew entered once, no per-report fee |
| `sequences/godfather-gc/` | building GCs and highway contractors: the prime's responsibility for every sub's WH-347; the roll-up is coming and not for sale |
| `sequences/godfather-certified/` | MWBE, SBE and DBE firms: when certified work carries federal money the sub files too |
| `sequences/state-pw/` | WA, NY, IL, TX prevailing-wage rows and the NY public-work registry: says plainly that no state forms ship at launch; offers the federal side only |
| `sequences/plain-intro/` | rewritten to the offer; the fallback for any segment the map does not reach |
| `config.json` | `sequence_map` with 24 segment needles, `default_sequence: plain-intro`; caps and stop-losses unchanged |
| `PLAYBOOK.md` | conversion path, daily and weekly routine with commands, reply handling, twelve objection scripts, the determination fulfilment script, LinkedIn at company level, KPIs and stop-losses, the 200-send rule, pre-flight checklist |
| `support/` | nine reply templates: auto-reply, login-help, billing-question, cancel, refund-request, data-export-deletion, wrong-rate-report, feature-request, not-supported-state-forms |
| `REQUESTS.md` | ten requests to the engine owner, each with the workaround in place |
| `CLAUDE.md` | per-app memory |

Every step: front matter `subject`, `delay_days`, `send_window`, body; delays 0, 4, 9, 16; body signed
`{{sender.name}}, {{app}}, a {{company}} company`; the engine appends the CAN-SPAM footer. No refund
sentence, no accuracy figure, no customer count, no penalty figure, no "Start free", no dashes.

### Segment coverage (rows per sequence, today's workbook of 1,769)

| sequence | rows | segments |
|---|---:|---|
| godfather-trade | 785 | 19 specialty-trade segments (plumbing 127, electrical 125, other specialty 113, building equipment 100, roofing 77, site preparation 63, and 13 smaller) |
| godfather-gc | 629 | commercial and institutional building GC 526; highway, street and bridge 103 |
| godfather-certified | 244 | MWBE/SBE certified 206; DBE certified 38 |
| state-pw | 109 | WA 62, NY 17, IL 11, TX 6; public works contractor registry (NY) 13 |
| godfather-federal | 2 | federal construction awardee (SAM.gov) |
| plain-intro (default) | 0 | no segment falls to the default today |

`sequence_for()` matches segment substrings only; the brief's definition of `godfather-federal` by
fact (`fact.federal_awards`) cannot be expressed in the map (`REQUESTS.md` R2). The 1,414 rows with
federal awards reach the Godfather copy through the trade and GC families, whose first email is the
same offer with one sentence of framing.

### Rendering results

| check | result |
|---|---|
| sequences x rows x steps | 6 x 1,769 x 4 = **42,456 renders** |
| `MissingVariable` | **0** |
| unrendered braces, blank artefacts, dashes | 0, 0, 0 |
| longest body, two-word from-name (limit 170/110/110/70) | 165 / 100 / 100 / 62 |
| longest body, from-name placeholder | still under every limit |
| longest subject (limit under 60) | 59 characters ("...in Washington, D.C., free") |
| end to end (`plan` then `compose`, copy of the tree under `OUTBOUND_ROOT`, 2026-09-08) | 20 drafts, 0 blocking, 0 warnings, 0 failures |
| engine tests | 149 pass |

### What the founder must decide

1. **The product name (P11).** `display_name` in `config.json` renders as `{{app}}` in every
   sequence; `support/` hard-codes "WageLens" and needs a find-and-replace.
2. **`OUTBOUND_FROM_NAME`.** It now appears inside the body, and the engine does not block on its
   placeholder (`REQUESTS.md` R1). Set it, and run the pre-flight grep in `PLAYBOOK.md` section 11.
3. **The Texas rows.** "state prevailing-wage contractor (TX)" is evidenced by TxDOT federal-aid
   lettings, which are Davis-Bacon work; they are mapped to `state-pw` today. To send them the Godfather
   email instead, add `"(tx)": "godfather-federal"` above `"state prevailing-wage"` in `sequence_map`.
4. **The fallback.** `plain-intro` stays the default as instructed; `godfather-federal` could be the
   default instead, since every row has an opening sentence.
5. **Cadence.** 0, 4, 9, 16 days replaces the placeholder's 0, 5, 12, 21 (reason in `PLAYBOOK.md`
   section 2). `min_gap_days` 4 is unchanged.
6. **Contact-form rows (933).** Each is a manual paste; reject them in the morning if they will not
   be pasted that day.
7. **Refund policy for a forgotten cancellation** (`support/refund-request.md` case 3) and the
   **support response time** (`support/auto-reply.md`, one business day, must match the help page).
8. **Backup retention after account deletion** (`support/data-export-deletion.md` states none).
9. **The Friday guarantee (G1).** `support/refund-request.md` case 1 assumes it shipped as written in
   `OFFER.md` section 5.2; the founder validates guarantees before any Stripe product exists.
10. **Calls.** The playbook takes a call when asked, after the determination has gone out. Say no
    if that is not the stance.
11. **The LinkedIn company page** and under which name (follows P11).
12. **The 200-send rule** (`PLAYBOOK.md` section 10) is pre-committed as written; change it now or
    not at all.
