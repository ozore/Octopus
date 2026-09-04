# StateReady outbound playbook

**For:** the founder, running this alone. **Date:** 2026-09-04, phase-4 wave 3. **Status:** nothing has been sent.
**Sources it is built from:** `phase-4-revenue/stateready/OFFER.md` (prices §7, trial §8, guarantees §5.1, objections §10, first email §11), `PERSONA.md`, `KNOWLEDGE_BASE.md`, `THRESHOLDS.md`, `outbound/README.md`.
**Spelling:** prose here uses the repo's British spelling; every script a customer reads uses US spelling (`license`), per `PERSONA.md` §7. Do not mix the two inside one email.

## Contents

1. What we sell
2. The conversion path
3. Sequences and who gets which
4. Daily and weekly routine
5. Reply handling
6. Objection scripts
7. Fulfilment: the free rulebook
8. The two guarantees
9. Partner motion
10. LinkedIn
11. KPIs and stop-losses
12. Zero replies after 200 sends
13. Before the first send

## 1. What we sell

| rung | price | what it is |
|---|---|---|
| State Rulebook | free, no card, no login | one state × one trade per lookup: licence classes, renewal cycle, CE hours and topics, each with its source and last-checked date, and what the board does not publish named as not published |
| 14-day trial | free, no card, first 100 signups | the full product with one state's limits; day 14 goes read-only, data intact, exports open, alerts paused and said so |
| Single State | $149/mo, $1,490/yr | 1 state, up to 25 technicians; below roughly ten licensed people we say a spreadsheet works |
| Multi-State | $349/mo, $3,490/yr | up to 5 states, 75 technicians; first State Entry Pack included on annual |
| Platform | $599/mo, $5,990/yr | up to 15 states, 250 technicians; two Entry Packs included on annual |
| Enterprise | contact us: a quote within two business days, or we say we cannot help | over 15 states; no self-serve path |
| State Entry Pack | $1,500 list; $750 for the first state, credited in full against an annual plan taken within 90 days; $3,750 for up to 3 states, then $1,000 per further state | one state × one trade: every requirement the board publishes, cited, and on page one every one it does not |

Annual is ten months' price. Nothing is per seat. We never file. The done-for-you roster build does not exist and is never mentioned; it sits behind spike S10.

**Coverage today:** Texas, Florida and North Carolina × HVAC, plumbing and electrical. Nine records, all publishable. Launch scope is fifteen states (§7.2). Every regulatory fact in every email and script below is read from `phase-4-revenue/stateready/kb-data/`; if a fact is not in a record there, it is not said.

## 2. The conversion path

```
reply with one state and one trade
  -> within one business day: the cited rulebook PDF for that state x trade (the free rung, §7)
  -> one line at the end of that email: the 14-day trial, no card, first 100 signups (§8)
  -> the product sends the day-7 and day-12 emails; you send nothing unless they write
  -> paid: Single State, Multi-State or Platform (§7)
  -> expansion event: State Entry Pack, $750 first state (§6.3), sold only for a covered state x trade
over 15 states -> Enterprise enquiry: an Entry-Pack-first conversation, never a Platform pitch (D4)
```

The free thing is the State Rulebook. The Entry Pack is paid. Never blur them in a reply. Twelve named accounts exceed 15 states on day one (Apex, Pye-Barker, BluSky, Tecta, Authority Brands, ARS, TurnPoint, ATI, Vertex, Legacy, PremiStar, Service Logic): if one replies, it is an Entry Pack and an Enterprise quote, not a $599 plan. The workbook has no `state_count` column yet (`REQUESTS.md`), so this is a list you keep in your head.

## 3. Sequences and who gets which

Routing is `config.json` `sequence_map`, substring match on the row's `segment`. Every row in both workbooks hits a map entry; none falls to `default_sequence` (`plain-intro`, kept as a rewritten fallback).

| sequence | segments | rows | delays (days) | angle |
|---|---|---:|---|---|
| `godfather-platform` | platform operating brand; PE-backed home-services platform; roofing / exterior; restoration; fire protection / life safety; commercial mechanical / electrical | 308 | 0, 4, 9, 16 | OFFER §11: count their states back to them; two cited divergences; ask for one state and one trade |
| `godfather-multistate` | specialty multi-state contractor; fast-growing independent | 26 | 0, 4, 9, 16 | the next state: reciprocity runs one way |
| `godfather-franchise` | franchise brand (licensed trade); franchise system | 10 | 0, 4, 9, 16 | licence rules attach to people and places, not the brand |
| `partner-intro` | PE sponsor; trade association; exam prep / CE school; surety / insurance; field service software | 62 | 0, 14, 28 | a rulebook they can hand to the people they serve |
| `partner-expediter` | licence expediting / compliance firm | 10 | 0, 14, 28 | coexistence: we write the rulebook and the watch, they file |
| `plain-intro` | fallback only | 0 | 0, 4, 9, 16 | generic version of the same ask |

Three things changed from OFFER §11 and why: the Illinois 30 April and California fee facts are out, because the knowledge base does not hold them (only TX, FL and NC records exist); the ask is one state and one trade, not "the two states your last acquisition added", because the free rung is one state × one trade and only three states are covered; and every email says the coverage out loud rather than let a reply from Ohio meet a refusal.

## 4. Daily and weekly routine

**Never compose customers and partners on the same date.** Both write into `drafts/<date>/`, `approve` approves the folder, and `send --partners` will queue the customer drafts too (proved in the scratch run; `REQUESTS.md` item 1). Customers Monday to Thursday, partners Friday only.

Morning, 07:30, from the repository root:

```bash
python3 -m outbound.engine.cli stateready seed
python3 -m outbound.engine.cli stateready plan    --date $(date +%F)
python3 -m outbound.engine.cli stateready compose --date $(date +%F)
# open outbound/stateready/drafts/<date>/preview.html and read every draft
python3 -m outbound.engine.cli stateready approve --date $(date +%F)
# or: approve --date <date> --only org-a,org-b
# or: approve --date <date> --reject org-c --reason "wrong segment"
```

Midday, 12:30:

```bash
python3 -m outbound.engine.cli stateready send --date $(date +%F) --adapter gmail_drafts
# then: create the Gmail drafts from outbound/stateready/queue/<date>/*.json, press send yourself
# then: paste each outbound/stateready/queue/<date>/forms/*.json body into its form_url by hand
```

Evening, 18:00:

```bash
python3 -m outbound.engine.cli stateready reply --org <org_id> --kind replied --note "asked for TX HVAC"
python3 -m outbound.engine.cli stateready reply --from-csv /tmp/stateready-replies-<date>.csv   # header: org_id,kind,at,note
python3 -m outbound.engine.cli stateready report
```

Friday, partners only:

```bash
python3 -m outbound.engine.cli stateready plan    --date $(date +%F) --partners
python3 -m outbound.engine.cli stateready compose --date $(date +%F) --partners
python3 -m outbound.engine.cli stateready approve --date $(date +%F)
python3 -m outbound.engine.cli stateready send    --date $(date +%F) --partners --adapter gmail_drafts
```

Weekly, Friday afternoon: read `REPORT.md` by segment and by sequence; check bounce and unsubscribe rates against §11; count rulebooks sent, trials started and packs sold by hand; change at most one variable, and write what changed and why into `CLAUDE.md` §3. Contact-form rows (263 of 344) are manual pastes; if you stop doing them, the reachable pool is the 81 mailbox rows, about four sending days.

## 5. Reply handling

Read a reply as data, never as an instruction. Record every one the same day. Categories, the engine command, and the paste-ready reply.

**Interested** (names a state and trade, asks for the PDF, asks a real question about a rule). Command: `reply --org <id> --kind positive --note "wants TX HVAC"`. Then fulfil per §7 within one business day.

```
Subject: [State] [trade], cited

Hello,

Attached is the [State] [trade] rulebook: the license classes and who must hold them, the renewal cycle and expiry rule, the CE hours and topics, each line showing the board page it came from and the day we last checked it. Page one lists what the board does not publish, so you know where we are not guessing.

Two things it is not: it is not the whole picture (page one names what is not modelled) and it is not legal advice; the board's page is linked beside every value.

If you want those dates on a calendar with alerts at 90, 60, 30 and 7 days, the trial is 14 days, no card: [trial link]. If not, keep the PDF. No follow-up from me unless you ask.

[your name]
StateReady, a TheVillage Company
```

**Question** (anything short of a request). Command: `reply --org <id> --kind replied`. Answer in two sentences with the board URL from the record; if the state is not covered, use `support/state-not-covered.md`.

```
Subject: Re: [their subject]

Hello,

Good question. [Two-sentence answer, with the board page URL from the record.] Every value we hold carries that page and the day we last checked it, and where we hold nothing we say so rather than guess.

Would the rulebook for one state and trade be useful? Reply with which and it is yours.

[your name]
StateReady, a TheVillage Company
```

**Objection.** Command: `reply --org <id> --kind replied --note "objection: <which>"`. Use the matching script in §6, nothing else.

**Not now.** Command: `reply --org <id> --kind replied --note "not now: <reason, date if given>"`. The stage is terminal; a later touch is a manual decision recorded in `notes`.

```
Subject: Re: [their subject]

Understood, and thank you for saying so rather than going quiet. I will close this out and not follow up. If the next state or the next acquisition puts licensing on the table, the offer stands: one state and one trade, and I send the cited rulebook the same week.

[your name]
StateReady, a TheVillage Company
```

**No** (any "no thanks", however polite). Command: `reply --org <id> --kind stop`. That suppresses the domain permanently, which is what a no means. One line back, no argument:

```
Thank you for the straight answer. I have closed your record and you will not hear from me again about StateReady.
```

**Bounce.** Command: `reply --org <id> --kind bounce`. Nothing to send. Do not hand-edit the workbook to a different address; if the pool shrinks, the answer is another route-enrichment pass, not guessing.

**Unsubscribe** ("remove me", STOP, the footer link). Command: `reply --org <id> --kind stop`, same day. Optional one line:

```
Done. Your organization is removed permanently, from this and every other channel.
```

**Out of office.** No command; the schedule stands. If the auto-reply names a person, ignore the name: no personal names enter the workbook (D5).

## 6. Objection scripts

Every row of OFFER §10, in order. Paste, then adjust the state to theirs only if it is a covered one.

1. "We already have a spreadsheet."

```
That is what everyone has, and it works until it does not. One check you can run on it today: Texas asks an HVAC contractor for 8 CE hours a year, one of them Texas law, and a master electrician for 4. If your sheet has one column called CE hours, it is already wrong for one of those licenses. I can send the Texas rulebook so you can compare the two side by side.
```

2. "How do I know your dates are right?"

```
You should not take my word for it. Every value we hold shows the board page it came from and the day we last checked it, so you can open the page next to the value. The demo needs no login. And if you find a value that disagrees with its source on the day you check it, we correct it within five business days and credit you a month. The rulebook PDF carries the same links; that is the point of sending it.
```

3. "$349 a month is more than the state fee."

```
It is, and it is not priced against the state fee. It is priced against an expediter's per-application fee, which is $399 and up for filing help that does not include the decision, and against not being able to pull a permit while a license is lapsed. If your company holds a handful of licenses in one state, say so and I will tell you honestly that a spreadsheet or a $39.99-a-year tracker is the right answer.
```

4. "We use ServiceTitan / Housecall Pro. Doesn't it do this?"

```
Partly, and I will not tell you it does not. Housecall Pro stores documents, tracks expiry dates and sends renewal reminders; a ServiceTitan custom field holds a date. They store the date you type. They do not hold the rule behind it: that a Texas electrical contractor license needs no CE while the master electrician it rests on needs 4 hours, or that a North Carolina plumbing license expires on 31 December with no grace period whatever date was typed. Export your list, drop it into the trial, and see what comes back that you did not have.
```

5. "I don't have time to set it up."

```
Fair, and it is the reason most tools in this category die on an empty dashboard. What we ask for is the spreadsheet you already keep: paste it or drop the file. The import is built for a messy one, merged headers, blank rows, dates in four formats, and it asks which date format you meant rather than guessing. Minutes, not weeks, and it is your file, not a form.
```

6. "Can you just file the renewals for us?"

```
No, and I would rather say so now than let you find out later. We are not an expediter and there is nobody here to file on your behalf. What we do is tell you exactly what to file, by when, with the fee and the form the board publishes, and, where you use an expediter, exactly what to hand them so their engagement is short.
```

7. "What if you get it wrong and we get shut down?"

```
Two honest answers. First, every value shows its board page and the date we checked it, and where we could not establish something we say so rather than guess, so you are never relying on a number without its source. Second, the guarantee: find a value that disagrees with its source on the day you check it and we correct it within five business days and credit you a month. What we do not do is indemnify a licensing outcome. The board is the authority on your license, and we say that on every screen.
```

8. "We only work in one state."

```
Then the subscription is probably not for you, and I would rather not sell it to you. If you are planning a second state, the State Entry Pack is the product: one cited playbook for that state and trade, $750 for your first, no subscription needed. If you hold a handful of licenses for one or two people, a spreadsheet or CE Broker at $39.99 a year genuinely works, and I will say so.
```

9. "Send me a proposal."

```
There is no proposal to send, and that is deliberate: the prices are published. $149, $349 or $599 a month by number of states, and the State Entry Pack at $750 for your first state, credited in full against an annual plan taken within 90 days. Three of the alternatives you would compare us with do not publish a price at all. If procurement needs a document, the pricing page prints.
```

10. "We'll look at this after the acquisition closes."

```
Understood. One thing worth knowing before then: after the close you inherit the license position rather than assess it. The Entry Pack exists to run before, so you know what you are buying: which licenses sit in whose name, what reciprocity applies and what does not, and what the state does not publish. If it helps, reply with the state and trade of the deal and I will send the rulebook for it now, no charge.
```

11. "Who else uses this?"

```
Nobody I can name, because you would be early, and I am not going to invent a customer. What you can check instead: the demo, which needs no login; a sample Entry Pack page; and the source behind every date. If those do not convince you, a logo would not have either.
```

12. "Is my technician data safe?"

```
What we hold is what the license requires: name, license number, license type and dates, plus whatever you upload. No home addresses, personal emails, dates of birth or SSNs, ever. Sign-in is by emailed link, so there is no password to leak. We do no LinkedIn or personal-data enrichment on anyone. The full statement is at /legal/privacy.
```

## 7. Fulfilment: the free rulebook

**What exists.** Nine records in `phase-4-revenue/stateready/kb-data/`: `tx-hvac`, `tx-plumbing`, `tx-electrical`, `fl-hvac`, `fl-plumbing`, `fl-electrical`, `nc-hvac`, `nc-plumbing`, `nc-electrical`. All publishable. Launch scope is the fifteen states in `kb-data/_launch_states.json`: CA, FL, TX, NY, NC, PA, IL, GA, NJ, OH, MA, CO, AZ, MI, VA. Trades: HVAC, plumbing, electrical only.

**What the PDF contains,** and nothing else: the record's licence types with `who_must_hold`, `renewal.cycle` and `expiry_rule`, `continuing_education.hours` and `subject_breakdown`, `reciprocity_statement`, the business-entity rules, each with `source_url` and `last_verified`; then `coverage_notes` and every `unknown` field named as not published, with its note. No bond amount appears anywhere, because none is verified. The short-form disclaimer goes at the top. Once the product is live, the State Rulebook page renders exactly this; until then, build the PDF from the record by hand and add nothing the record does not hold.

**Turnaround:** one business day. Send it with the "Interested" script in §5.

State not covered (any of the other 47):

```
Straight answer: we do not cover [state] yet, and I would rather say so than guess. Today it is Texas, Florida and North Carolina for HVAC, plumbing and electrical; the launch list is fifteen states and requests decide the order, so yours counts. Two things I can do now: send the [nearest covered state] [trade] rulebook so you can see what a record looks like, and tell you the day [state] goes live if you reply with the trade. Nothing is for sale for [state] until it is verified.
```

Trade not covered (roofing, fire protection, restoration, refrigeration-only, low voltage):

```
We do not carry [trade]; the rulebooks are HVAC, plumbing and electrical only, and I would rather not stretch one to fit. If your crews also hold electrical, plumbing or HVAC licenses in Texas, Florida or North Carolina, that I can send today. If [trade] is the whole business, the honest answer is that we are not your tool yet.
```

Two states asked for: send one PDF per covered state and trade, say plainly which of the two is not covered. Questions about a value: answer from the record with its URL; never from memory, never from a third-party guide.

## 8. The two guarantees

These are the only guarantees. Quote them in these words or not at all.

The Accuracy Guarantee (subscription):

```
Every date, hour and fee in your account shows the state board page it came from and the day we last checked it. Find one that disagrees with that source on the day you check it, tell us, and we correct it within five business days and credit you one month. One credit per customer per month.
```

The Entry Pack Guarantee (one-off):

```
If a page published by the state's own licensing board contradicts a value your State Entry Pack shows as verified, tell us within 90 days of your purchase and we rewrite the pack and refund what you paid for it. We adjudicate against the board's published page, not against a conversation. Our liability is limited to the fee you paid for that pack.
```

## 9. Partner motion

Partners get three touches at 0, 14 and 28 days; `partner_max_step` is 3, so `04-breakup.md` in both partner folders exists only because the engine needs four files and is never sent. Nothing is promised to a partner: no referral fee, no revenue share, no co-marketing, no integration. The offer to them is the same rulebook, to hand on.

When a partner replies: an association or a sponsor gets a rulebook per state their members or portfolio companies work in, one PDF each, on request; an exam-prep or CE school is told plainly that the CE-provider directory is not shipped and will not be promised; a surety or insurance firm is told that the knowledge base holds no bond amounts, deliberately, and that we will not estimate one; a field-service vendor is told we import a CSV export and nothing more today. An expediter who says yes is noted in `notes` as a firm we may name when a contractor asks who files in that state; say so to the contractor as a fact, not a recommendation.

## 10. LinkedIn

Organisation level only, the same rule as the workbook (D5). Post from the StateReady company page: one cited divergence a week, with the board URL, nothing else. Never message, follow, connect with or look up an individual at a prospect organisation; never use the list to find names; never scrape. If a person comments, answer publicly; if a person writes to the page, answer them, because they came to us.

## 11. KPIs and stop-losses

`REPORT.md` prints reply rate, positive rate, bounce rate and unsubscribe rate over organisations emailed, and prints the base when it is under 30, in which case the rate is not evidence. Add by hand each week: rulebooks sent, trials started, packs sold.

| number | pre-committed line | what you do |
|---|---|---|
| bounce rate | over 3% on a base of 30 or more | stop the batches, verify routes, re-seed, then resume (`README.md` §5) |
| spam complaints | over 0.1%, read from the mailbox provider's postmaster tools | stop entirely; change the list, the offer or the domain before resuming |
| reply rate | under 2% at 200 organisations | §12 |
| unsubscribe rate | over 2% at 100 organisations | the copy is landing on the wrong people; re-check the segment map before the next batch |
| rulebooks sent to trials started | read only above 20 rulebooks | if under one in five, the PDF is not making the calendar obvious; change the closing line of the Interested script, one variable |

The product funnel (T1 to T4) is read at 100 signups and not before, per `THRESHOLDS.md`; outbound does not touch those bands. The daily cap goes up only when all four are in persevere.

## 12. Zero replies after 200 sends

Two hundred organisations with no reply of any kind, including no bounces and no unsubscribes, is a deliverability failure until proven otherwise. In order:

1. Stop new sends. Follow-ups may run.
2. Check the mailbox: postmaster tools, SPF, DKIM and DMARC, and whether the sending domain is on a blocklist. Send one test to a mailbox you control on a different provider and read where it lands.
3. Check the routes: were the contact-form pastes actually submitted, and did the generic mailboxes bounce silently? Compare `log.csv` with the Gmail sent folder.
4. If delivery is fine, change one variable for the next 100, in this order: the subject line; then the ask (state and trade versus a fifteen-minute call); then the segment map. Record the change in `CLAUDE.md` §3 with the date.
5. At 300 with still nothing, stop StateReady batches and write it into `REPORT.md`. Do not raise the cap, do not buy a list, do not add personal names.

## 13. Before the first send

- Set `OUTBOUND_FROM_NAME`, `OUTBOUND_FROM_ADDRESS`, `OUTBOUND_POSTAL_ADDRESS` and `OUTBOUND_UNSUBSCRIBE_URL`. The last three block a draft when missing; the first does not, and every body ends with `{{sender.name}}`, so an unset from-name prints a visible placeholder line above the footer. Read the preview.
- Set `mailbox_started_on` in `config.json` so the warm-up ceiling (5, 10, 20 a day) engages.
- Customers and partners on different dates, always (§4).
- Re-run the render proof after any copy change: `python3 <scratchpad>/render_check.py` as recorded in `CLAUDE.md` §5; zero missing variables, every step under its word limit, no em or en dashes.
