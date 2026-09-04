# `outbound/` — memory

**Agent:** Outbound Engineer, phase-4 fleet. **Date:** 2026-09-03.
**Read this before touching anything in `outbound/`.** `README.md` is for the founder;
this file is for the next agent.

---

## 1. Rules confirmed (and the case that forced each one)

- **D4 — our own sequencing, no external tool.** Everything is files in the repo:
  workbook CSV, sequence folders, plan/draft/approval/queue JSON, one `log.csv`.
- **D5 — organisation-level only.** `classify_route()` drops any mailbox whose local part
  is not on an explicit allowlist of role addresses, and any free-mail domain. It is an
  **allowlist**, not a blocklist: an address we cannot *prove* is a role account is
  dropped. On the current lists this drops nothing (every recorded mailbox is
  `info@`/`sales@`/`bids@`-shaped), so the strict rule costs us no coverage today.
- **A4 — drafts first.** `send` refuses without an approval file. `approve` refuses any
  draft with a blocking check. The default adapter is `dryrun`.
- **CRM.md §6.3 (four CAN-SPAM checks) are enforced in code**, not in a checklist:
  sender legal name, non-deceptive subject, physical address, working opt-out. Missing
  env values become **visible placeholder tokens**, exactly as phase 3 decided, and the
  placeholder is itself a blocking check.
- **CRM.md §4.3 (partner cadence)** applies to the partner workbook only: `min_gap_days`
  14 and a ceiling of three touches (`partner_max_step: 3`). End customers use a faster
  cadence — see Assumptions.
- **`phase-3-acquisition/` and `app/` are read-only.** A test asserts the prospect CSVs
  are byte-identical after a seed. The seed also reads an *optional*
  `<dir>/routes-enrichment.csv` produced by the phase-4 route-enrichment pass; it fills
  gaps and never overrides phase 3 (see §6 and `README.md` §1), and every route in it goes
  through the same `classify_route()` allowlist, so a personal-looking address in that
  file is dropped rather than trusted.
- **Nothing is sent.** The `resend` adapter raises unless the founder has set
  `OUTBOUND_SEND_ENABLED=true` in their own shell. No agent sets it.

## 2. What worked

- **`seed` as an idempotent upsert.** Stage, `last_action_at`, `next_action_at` and
  `thread_ref` survive a re-seed; everything else is refreshed from phase 3. This is what
  makes "seed every morning" safe, and it is the first thing to preserve in any rewrite.
- **A guaranteed `{{fact.opening}}`.** Every optional fact is behind
  `{{#if fact.x}}…{{/if}}`, and `personalise.opening_sentence()` always returns something
  — the strongest fact we hold, falling back to segment + location. That is why 60/60
  drafts rendered with zero missing variables on the first run across three apps.
- **Failing loudly on a missing variable.** `render()` raises `MissingVariable`; `compose`
  catches it per organisation, counts it as a *failure*, and never writes a draft with a
  hole in it. A template typo shows up as "0 drafts, 20 failed", which is unmissable.
- **Facts as typed JSON, phrases as a separate step.** `extract_facts()` gives
  `{"count": 3, "since": "2024"}`; `phrases()` turns it into
  "your three federal jobs in Texas since 2024". Testing the two separately made the
  rule-based personalisation trustworthy without an LLM anywhere in the hot path.
- **Wrapping the rendered body at 72 columns.** Without it, a rendered variable produced
  one 300-character line beside hand-wrapped copy, which looks exactly like mail-merge.
- **A sandbox root for tests** (`OUTBOUND_ROOT` / `OUTBOUND_PROSPECTS_ROOT`). Every test
  builds a fake repository in `/tmp`. No test can touch a real workbook.

## 3. What failed, and what I changed

- **First renderer used a non-greedy `.*?` for `{{#if}}` blocks** and mis-paired nested
  blocks (`{{#if a}}x{{#if b}}y{{/if}}z{{/if}}` closed on the inner `{{/if}}`). Fixed with
  a pattern that matches only *innermost* blocks, applied in a loop until stable.
- **The contact-form footer had the unsubscribe URL on the same line as the sentence**,
  producing an 84-character line. Split onto its own line; the wrap test skips lines that
  contain a URL, because a wrapped URL is worse than a long one.
- **The warm-up ceiling first capped only new organisations.** Wrong: a warm-up limit is
  about total volume out of one mailbox, so it now caps follow-ups too. Caught by planning
  day 2, where wagelens produced 20 new + 20 follow-ups = 40 sends from a mailbox that
  might be a week old.
- **The CLI printed tracebacks** for deliberate refusals (`resend` without the flag).
  Now every engine exception becomes one line on stderr and exit code 1.
- **`unittest discover -s outbound/engine` puts `outbound/engine` on `sys.path`, not the
  repo root.** Each test file therefore inserts the repo root itself. Do not remove those
  three lines at the top of each `test_*.py`; the mandated discovery command breaks
  without them.

## 4. Mistakes worth not repeating

- I nearly derived contact pages as `<website>/contact` for the 10,215 WageLens rows that
  have a website but no recorded route. **That would have been fabrication** — the same
  rule that phase 3 applied when it left the field empty. The honest answer is the
  coverage table in `REPORT.md`, which said out loud that 80 of 10,295 rows were usable.
  *(The right way to close that gap was to go and open the pages. The phase-4 route
  enrichment pass did exactly that and turned 80 into 1,769 — every one of them a URL
  that was actually fetched. `<website>/contact` was still never guessed: a contact page
  is recorded only when it answered.)*
- I considered treating any mailbox that is not obviously personal as generic. Inverted it
  to an allowlist after re-reading `CRM.md` §6.2: the cost of a false positive here is
  emailing a private individual.

## 5. Assumptions taken without confirmation

| # | Assumption | Why, and how to overturn it |
|---|---|---|
| B1 | **End-customer cadence is 0 / 5 / 12 / 21 days, four touches**, with `min_gap_days` 4 | `CRM.md` §4.3's 14-day rule is written for the *partner* pipeline of a different product, and is applied unchanged to `workbook-partners.csv` (14 days, three touches). A cold end-customer sequence at 14-day gaps takes ten weeks to finish. Change `delay_days` in the sequence front matter and `min_gap_days` in `config.json`. |
| B2 | **Contact-form organisations are planned in the same daily batch as mailboxes**, mailbox-first | Certly would otherwise have produced 7 drafts a day, not 20: only 7 of its 521 usable end-customer rows had a mailbox before the enrichment pass (290 of 824 now, so this assumption is worth revisiting). Form drafts are written to `queue/<date>/forms/` as manual tasks, never emailed. |
| B3 | **US-only, English, Eastern time as the fallback zone** (plan default A2) | All three lists are US. A row with no state at all is treated as Eastern. |
| B4 | **`positive` and `converted` are accepted reply kinds** beyond the specified replied/stop/bounce | The brief asks the report for a *positive rate*, which is not derivable from "replied" alone. `positive` is a subset of `replied` that the founder (or the evening routine) marks. |
| B5 | **One sequence per app, `plain-intro`, segment map empty** | The Offer agents own the copy. `sequence_map` in `config.json` routes by segment substring the moment a second sequence exists. |
| B6 | **The workbook keeps a row whose phase-3 entry has disappeared, if it has any history.** | Losing the stage of an organisation we already emailed would break the opt-out record. Rows still at `new` are dropped on re-seed. |
| B7 | **Suppression from an opt-out is by domain, not by address** | A person who says stop for `info@acme.com` has opted the organisation out; contacting `sales@acme.com` next week would be the same conversation. Bounces suppress the single address, because a bounce is about that mailbox. |

## 6. Findings about the lists (not about the engine)

Regenerate with `… report`; the table is section 1 of each `REPORT.md`.

### After the phase-4 route-enrichment pass (2026-09-03, evening)

| app | end-customer rows | usable route | mailbox | contact page | days of batches at 20/day |
|---|---:|---:|---:|---:|---:|
| wagelens | 10,295 | **1,769** | 836 | 933 | 88 |
| certly (pm + gc) | 1,578 | **824** | 290 | 534 | 41 |
| stateready | 641 | **344** | 81 | 263 | 17 |

**2,937 usable end-customer rows, up from 666.** 2,271 of them come from
`<dir>/routes-enrichment.csv`, written by
`phase-3-acquisition/prospects/scripts/enrich/` — it opened 7,624 organisations' own
sites, confirmed 3,107 websites, and found 1,105 generic mailboxes and 1,306 contact
pages. Read that directory's `CLAUDE.md` before extending it; it carries the yields per
method and the false positives to avoid.

### What that changes

- **The route pool is no longer the binding constraint.** The three apps together now
  support about **146 sending days** at 20 a day, against 33 before. The binding
  constraint is back where it should be: the founder's warm-up ceiling and the reply rate.
- **WageLens now has a real mailbox pool** (836), so its batches no longer depend on
  contact-form paste work. 8,526 of its rows still have no route — that is a research
  ceiling, not a bug: 3,500-odd of them have a name that is not their domain, and only a
  search engine reaches those.
- **Certly's form-heavy shape is fixed at the margin**: 146 of the 514 rows that had a
  contact page and no mailbox were upgraded to a generic mailbox on the same domain.
  See the merge rules in `README.md` §1.
- **StateReady's 263 contact-page rows are unlikely to improve.** Consumer-facing trade
  brands publish a phone number and a form on purpose; the enrichment agent tested
  privacy-policy and terms pages on a sample and found zero mailboxes.

### Unchanged

- **WageLens still has 391 partner rows and none with a route**, so
  `workbook-partners.csv` is header-only for that app. Certly has 115 usable partners,
  StateReady 72.
- Some `form` routes are homepages rather than contact pages
  (`form_url_is_a_homepage`). They are flagged as warnings, not blocked; the founder
  finds the form on the site.

### Before the enrichment pass, for comparison

| app | end-customer rows | usable route | mailbox | contact page |
|---|---:|---:|---:|---:|
| wagelens | 10,295 | 80 | 80 | 0 |
| certly (pm + gc) | 1,578 | 521 | 7 | 514 |
| stateready | 641 | 65 | 12 | 53 |

## 7. Advice to the next agent

1. **Do not touch the copy in `sequences/*/0*.md` without reading the Offer agent's
   `OFFER.md` first.** The current copy is a deliberate placeholder: plain, honest, no
   claims, and it says out loud that the product is new and has no results. Whatever
   replaces it must still pass `check_draft()` and must not add a statistic we have not
   measured (`BRAND.md` §4.1, and gates G1–G6).
2. **Add facts before you add adjectives.** The lever with the most room left is
   `personalise.extract_facts()`: `notes` still holds award titles, awarding agencies,
   NAICS codes, PE sponsors and state lists that no template uses yet. Every new fact
   needs a template in `phrases()` *and* a test, or it will render as a blank.
3. **The route pool was the bottleneck and is no longer.** If you are asked for more
   volume, the answer is another route-finding pass over `phase-3-acquisition/prospects/`
   (which you may not edit — write a new file), not a bigger `daily_cap_new`. The pass
   already exists and is resumable:
   `phase-3-acquisition/prospects/scripts/enrich/` — read its `CLAUDE.md` for the resume
   command, the yields per method and the false positives it learned to reject. Its output
   merges at seed time under two narrow rules (`workbook.apply_enrichment`, `README.md`
   §1); do not widen them to make a batch bigger.
4. **Never widen `GENERIC_TOKENS` to make a batch bigger.** That list is the boundary
   between an organisation and a person.
5. **Run the tests before and after.** `python3 -m unittest discover -s outbound/engine -p 'test_*.py'`.
   149 tests, under a second, no network.

## 8. Open questions for the founder

1. **Postal address** for the CAN-SPAM footer (`OUTBOUND_POSTAL_ADDRESS`). Until it is
   set, every draft is blocked. A registered-agent or mailbox address is acceptable; a
   fabricated one is not.
2. **Which mailbox sends**, and its start date. A dedicated sending mailbox on a separate
   domain from the main TheVillage address is what `PLAN.md` §6 assumes; set
   `mailbox_started_on` in each `config.json` so the warm-up ceiling engages.
3. **From-name.** Founder's own name, or a role address? A person's name reads better and
   answers better; a role address is easier to hand over later.
4. **Unsubscribe URL** (`OUTBOUND_UNSUBSCRIBE_URL`) — one page for all three apps, or one
   per app? The footer needs a link that actually works on the day of the first send.
5. **Contact-form outreach: yes or no?** 1,730 of the 2,937 usable rows are contact pages,
   and each is a manual paste. If the answer is no, the reachable pool is the 1,207
   organisations with a generic mailbox — still 60 sending days at 20 a day, so this is no
   longer the existential question it was before the route-enrichment pass (when "no"
   meant 99 organisations in total).
