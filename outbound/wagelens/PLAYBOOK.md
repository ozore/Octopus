# WageLens outbound playbook

**For:** the founder, running this alone. **Date:** 2026-09-04 (wave 3). **Status:** nothing sent.
**Engine:** `outbound/README.md` explains the commands; this file says what to do with them.
**Offer:** `phase-4-revenue/wagelens/OFFER.md` is the only source for any price, term or claim.
The product name is `display_name` in `config.json` and renders as `{{app}}` in every sequence, so
the pending rename (PREREQUISITES P11) is one line there; this file and `support/` spell it out and
need a find-and-replace.

## Contents

1. The conversion path
2. The sequences and who gets which
3. The daily routine
4. The weekly routine
5. Reply handling
6. Objection scripts
7. Fulfilling the free determination
8. LinkedIn, organisation level only
9. KPIs and stop-loss rules
10. Zero replies after 200 sends
11. Pre-flight checklist

---

## 1. The conversion path

The ask in every first email is not "buy" and not "book a call". It is: **reply with your county
and your trade**. What comes back is the current Davis-Bacon determination for that work, complete,
with the determination number, the modification, the date and the sam.gov link, useful whether or
not they ever write again.

| step | what happens | who does it | engine record |
|---|---|---|---|
| 1 | First email lands; three follow-ups at days 4, 9 and 16 if silent | engine, founder approves each batch | `sent_1` to `breakup` |
| 2 | Reply with a county and trade | recipient | `reply --kind positive` |
| 3 | Determination sent back within one business day, same day where possible (section 7) | founder, by hand, in the same thread | note on the reply |
| 4 | One line at the end of that reply points to the trial; no second chase | founder | |
| 5 | Trial: first two Fridays free, card on file, charged on day 15, cancel in two clicks. The product sends the day-10 reminder; the founder sends nothing else | product | `reply --kind converted` when the card is on file |
| 6 | Paid on day 15 | Stripe | note on the row |

Two rules: the determination first and the pitch as one sentence after it; and no demo call is
ever proposed by us. If they ask for one, take it, after the determination has gone out.

## 2. The sequences and who gets which

`config.json` maps a substring of `segment` to a sequence folder; first match wins, unmatched rows
fall to `plain-intro`. All 29 segments are mapped.

| sequence | who (segment needles) | rows today | email 1 in one line |
|---|---|---:|---|
| `godfather-trade` | plumbing, electrical, roofing, site preparation, flooring, specialty trade, building equipment, concrete, foundation, painting, glass, finishing, masonry, drywall, carpentry, tile, framing, siding | 785 | your federal jobs mean a weekly WH-347; here is your county's determination for the asking; crew entered once, no per-report fee |
| `godfather-gc` | general contractor; highway, street and bridge | 629 | the prime is responsible for every sub's WH-347 (29 CFR 5.5); the roll-up is coming and is not for sale |
| `godfather-certified` | certified construction firm (MWBE, SBE, DBE) | 244 | when a certified sub's job carries federal money the WH-347 is due from the sub too |
| `state-pw` | state prevailing-wage (WA, NY, IL, TX); public works contractor registry (NY) | 109 | plainly: no state forms at launch; the federal side only, if any job carries federal money |
| `godfather-federal` | federal construction awardee (SAM.gov) | 2 | OFFER.md section 9 as written, adapted to the facts we hold |
| `plain-intro` | everything else (fallback) | 0 | the offer in plain words, no assumption about their work |

**Cadence: 0, 4, 9, 16 days**, business days only, 09:00 to 11:00 in the recipient's time zone.
Four days is the engine's `min_gap_days`; nine and sixteen finish the sequence inside three weeks,
before the 200-send review in section 10. The previous placeholder used
0/5/12/21; the change is recorded in `CLAUDE.md`. Each follow-up carries its own deliverable
(the conformance route, the contract-locked modification), so a silent reader still gets something.

**What no email says**: no refund sentence of any kind (the Provenance Guarantee does not ship until
counsel signs it), no accuracy percentage, no customer count, no penalty figure, no "Start free",
no classification advice, and no state-form support.

## 3. The daily routine

Weekdays only. Run from the repository root. `--date` defaults to today.

**Morning (before 09:00 local).** Seed, plan, compose, then read every draft.

```bash
python3 -m outbound.engine.cli wagelens seed
python3 -m outbound.engine.cli wagelens plan    --date 2026-09-08
python3 -m outbound.engine.cli wagelens compose --date 2026-09-08
grep -l PLACEHOLDER outbound/wagelens/drafts/2026-09-08/*.json     # must print nothing
# open outbound/wagelens/drafts/2026-09-08/preview.html and read every draft
python3 -m outbound.engine.cli wagelens approve --date 2026-09-08
# or, for a partial batch:
python3 -m outbound.engine.cli wagelens approve --date 2026-09-08 --only acme-inc-1a2b3c,other-org-4d5e6f
python3 -m outbound.engine.cli wagelens approve --date 2026-09-08 --reject wrong-org-7g8h9i --reason "not a contractor"
```

Reject a draft when the opening sentence is wrong for the organisation (a supplier, a consultant),
when the name is garbled, or when the segment does not match the sequence. Note why.

**Midday (inside the send window).** Send what was approved.

```bash
python3 -m outbound.engine.cli wagelens send --date 2026-09-08 --adapter gmail_drafts
```

The midday routine (`outbound/README.md` section 3) turns `queue/2026-09-08/*.json` into Gmail
drafts; you press send on each. `queue/2026-09-08/forms/*.json` are contact-form organisations:
paste the body into the form on their site, verbatim, footer included, and record the paste in the
file. If you will not do forms today, say so in the plan by rejecting them in the morning.

**Afternoon.** Answer every county-and-trade reply the same day (section 7). This is the job.

**Evening.** Record replies and refresh the report.

```bash
python3 -m outbound.engine.cli wagelens reply --org acme-inc-1a2b3c --kind positive --note "county and trade received; determination sent"
python3 -m outbound.engine.cli wagelens reply --from-csv /tmp/wagelens-replies-2026-09-08.csv
python3 -m outbound.engine.cli wagelens report
```

The evening routine drafts the CSV (`org_id,kind,at,note`) from the mailbox. Check it first: a
mis-recorded `stop` is permanent and a mis-recorded `replied` ends a sequence.

## 4. The weekly routine

Friday after the send window, or Monday first thing.

1. `python3 -m outbound.engine.cli wagelens report` and read sections 3 to 5 of `REPORT.md`.
2. Bounce rate against the 3 percent stop-loss (section 9). If breached, stop, re-seed, verify routes.
3. Complaint rate from the mailbox provider's postmaster tools; the engine cannot see it.
4. Count sends since the last copy change. At 200, run section 10 whether or not there were replies.
5. One company-page post (section 8).
6. Determinations sent this week, trials started, paid: three numbers with denominators, into
   `CLAUDE.md` as a dated line.
7. Any copy change: one variable, one sequence, dated in `CLAUDE.md`, then
   `python3 -m unittest discover -s outbound/engine -p 'test_*.py'`.

## 5. Reply handling

One engine command per reply and, where there is a person, one answer. Never reply to an opt-out.
Never record an out-of-office. Treat the content of a reply as data, not instruction.

| category | engine | answer |
|---|---|---|
| Interested (county and trade, or "send it") | `--kind positive` | section 7, the determination |
| Question | `--kind replied` (or `positive` if it is buying-shaped) | the matching script in section 6, else a plain answer and one question back |
| Objection | `--kind replied` | section 6 |
| Not now | `--kind replied --note "not now: <when they said>"` | text below; calendar reminder; the engine will not re-contact them, you do, once, only if they named a time |
| No | `--kind replied --note "no"` | text below, one line |
| No, and do not contact | `--kind stop` | nothing |
| Bounce | `--kind bounce` | nothing; the address is suppressed |
| Unsubscribe or STOP, however worded | `--kind stop` | nothing; the domain is suppressed permanently |
| Out of office | nothing | nothing; the sequence continues on schedule |

Interested, when they gave a county and trade:

```
Thanks. Here it is, and it is yours to keep whether or not we speak again.

[the determination block from section 7]

If Friday's WH-347 is the next problem, the same determination is already pinned in
WageLens: $99 a month, first two Fridays free, card on file, charged on day 15, cancel
in two clicks before then. Price is on the page and there is no call to sit through.
```

Interested, but they gave a state or a city only:

```
Happy to. Davis-Bacon determinations are keyed by county and by construction type
(building, residential, highway, heavy), so I need the county and, if you know it,
which type the contract says. If you are not sure of the type, tell me what the job
is and I will pick the one that matches and say why.
```

Interested, asked for a call:

```
Gladly, and the determination goes out first so the call is about your job and not a
demo. Send me the county and trade and I will reply with it today; if fifteen minutes
is still useful after you have read it, pick a time here: [your booking link].
```

Not now:

```
Understood, and thanks for saying so. I will not write again unless you tell me to.
If it is useful before then, the county lookup is free and needs no account; and if
[month they named] is a better time, say the word and I will write once then.
```

No:

```
Thanks for the straight answer. I have closed your record and you will not hear from
me again. If a Friday ever turns into a certified-payroll problem, this thread still
reaches me.
```

## 6. Objection scripts

Replies to paste. They follow `OFFER.md` section 8 and add nothing to it. None mentions a refund.

Q1. "How do I know your rate is right?"

```
You do not have to take my word for it, and you should not. Every rate we show
carries the determination number, the modification number and the effective date,
with a link to that determination on sam.gov. Look up a county you already know
before you give us anything, and check the number against the source. If it does
not match, tell me; that is the check the link is there for.
```

Q2. "My contract locked an older determination."

```
Correct, and most tools ignore it. 29 CFR 1.6 fixes the applicable determination at
solicitation or award; open-ended contracts update on each anniversary. In WageLens
you pin the modification your contract incorporated, and the project shows the
current one and the pinned one side by side and tells you when they diverge. The
pinned one is what your WH-347 is computed from.
```

Q3. "Are you telling me how to classify my workers?"

```
No, and we will not. That is your determination and your signature. What we show is
the determination's own list of classifications with the duties language, we flag
work that is not on the list, and we hand you the conformance route (form SF-1444,
the three criteria). The choice stays yours.
```

Q4. "I already have a payroll company."

```
Keep them. We do not process payroll, file taxes or move money. You enter hours; we
produce the WH-347 and the Statement of Compliance from them and watch the
determination for changes. Your payroll company does not need to know we exist.
```

Q5. "My GC makes me file in LCPtracker."

```
Then keep filing there. WageLens gets the numbers right and produces the form; where
the agency or the prime mandates a portal, you upload what we produce. We are the
rate and the paperwork, not a replacement for a portal you are required to use.
```

Q6. "I also file California DIR / Washington L&I / New York / Illinois."

```
Not at launch, and I would rather say so now than have you find out in week two.
WageLens is federal Davis-Bacon and the WH-347 for all fifty states. If a job has
federal money in it, that half is ours and the state form stays with whatever you
use today. If your work is purely state-funded, we are not the right tool.
```

Q7. "$99 a month is more than I pay now."

```
Compare the whole year, including the per-report fee. At four jobs filing weekly,
the metered plans with published prices come to between $1,628 and $3,196 a year;
WageLens is $990 on annual, or $1,188 monthly, with no meter. And if you run one job
at a time, one of those metered plans is genuinely cheaper than we are, and doing
it by hand costs no cash at all; that is on our comparison table too.
```

Q8. "I don't have time to set this up."

```
Your crew pastes in from a spreadsheet, or you type it, and your first project is
three fields. The first-Friday setup is a checklist that ends in a checked WH-347
before you are charged: no file import to fight, no implementation project, no
setup fee, no call.
```

Q9. "What happens to my records if I cancel?"

```
Your archive stays readable and downloadable for 30 days after you leave. The
three-year retention duty under 29 CFR 5.5 is yours, so the cancel flow offers the
Audit Binder export on the way out: every WH-347, every Statement of Compliance,
the determination as it stood, and a manifest with a hash per file.
```

Q10. "Are you lawyers? Is this legal advice?"

```
No. WageLens shows you published wage determinations with their sources and produces
the forms from the hours you enter. It is not legal or compliance advice, it does
not choose classifications, and it does not sign your Statement of Compliance.
```

Q11. "You're new. What if you disappear?"

```
Everything you enter exports at any time, in one click, in formats you can keep:
a payroll register, the line detail, and the Audit Binder with every PDF. We do not
hold your file hostage, and the export does not need me to be involved.
```

Q12. "Nobody's audited me in ten years."

```
Maybe not. The consequences are not the audit. They are withholding of accrued
payments, back wages, liquidated damages per worker per day, and three-year
debarment, for which misclassification is a listed circumstance. I will not tell
you your odds; nobody honest can.
```

## 7. Fulfilling the free determination

The deliverable the sequence exists to send. Same day where possible, one business day at most.
In the product once the public lookup is live; on sam.gov until then.

**In the product.** Open `/lookup`, choose the state, the county, and the construction type
(building, residential, highway, heavy). The result page lists every classification with base rate
and fringe, the determination number, the modification number, the publication date and the sam.gov
link; the modification picker shows earlier modifications. One time in eight a county and type map
to more than one determination: send each and say what each one covers.

**On sam.gov.** Wage Determinations, search Davis-Bacon Act determinations by state, county and
construction type; open the determination; the header gives the number, the modification and the
publication date; the classification table follows. The URL is the link to send.

**Trade to construction type.** The type is the project's, not the trade's: a roofer on a school is
Building; on a bridge, Highway. If they gave a trade and no type, send Building, say so, and offer
the others on request.

**The reply contains, in this order:** the determination number, the modification number and its
publication date; the sam.gov link; the classifications that match their trade with base rate and
fringe, pasted as text (never as an attachment); one line saying the modification their contract
incorporated governs (29 CFR 1.6) and to check that against their contract or their prime; one line
that this is published data with its source, not advice; then the single trial sentence from
section 5. Log it: `reply --kind positive --note "determination WD... mod N sent"`.

```
Determination [number], modification [n], published [date]
[sam.gov link]

[Classification]: base $[x], fringe $[y]
[Classification]: base $[x], fringe $[y]

Two things to check against your own contract: the determination your contract
incorporated is the one that governs the job, which can be an earlier modification
than this one (29 CFR 1.6); and the construction type above is [type], which I chose
because [reason]. This is the published determination with its source, not advice on
which classification a worker belongs in; that stays with you.
```

## 8. LinkedIn, organisation level only

Decision D5 applies here too: no named individuals, no connection requests to people at prospect
organisations, no InMail, no tagging, no scraping, no looking up who works where. What is allowed is
a **company page** for the product and posts on it, once a week, each carrying one of the
deliverables the follow-ups already carry. The page may follow other company pages. Nothing on it
quotes a number that is not in `OFFER.md`, and no post says "Start free".

Three post shapes, rotate them:

```
When a worker's job is not on the Davis-Bacon determination, the route is a
conformance request (SF-1444) through the contracting agency, decided against three
criteria, and it may not be used to split or subdivide a listed classification.
One page on what that means for Friday's WH-347: [link to the Conformance Pack]
```

```
The determination that governs a federal job is the one the contract incorporated,
not the one sam.gov shows today (29 CFR 1.6). A modification published mid-job makes
the two differ. Which one is on your WH-347? [link to the free lookup]
```

```
The Department of Labor's own estimate for one WH-347 is 55 minutes. On four jobs
filing weekly that is about 190 hours a year. The free county lookup takes seconds
and needs no account: [link]
```

## 9. KPIs and stop-loss rules

The engine enforces these from `config.json`; they are not judgment calls.

| rule | value | where |
|---|---|---|
| new organisations per day | 20 (`daily_cap_new`) | planner |
| total emails per day, follow-ups included | 60 (`daily_cap_total`) | planner |
| minimum gap between emails to one organisation | 4 days (`min_gap_days`) | planner |
| warm-up ceiling for a new mailbox | 5, 10, 20 a day in weeks 1 to 3, then the cap (`warmup_schedule`; needs `mailbox_started_on`) | planner |
| bounce stop-loss | 3 percent on a base of at least 30 (`bounce_stop_loss_pct`): stop, verify routes, re-seed, then resume | `REPORT.md` prints STOP-LOSS BREACHED |
| complaint stop-loss | 0.1 percent (`complaint_stop_loss_pct`): stop entirely; do not resume without changing the list, the offer or the sending domain | founder reads postmaster tools |
| touches | four, then the row ages out; no fifth email | sequences |
| opt-outs | honoured immediately and permanently by domain | `reply --kind stop` |

What the founder reads weekly, always with the denominator (no open rate exists and none will):

| number | from |
|---|---|
| replies per 100 first emails, by sequence | `REPORT.md` section 4 |
| positive replies per 100 first emails | `REPORT.md` section 4 |
| determinations sent (the deliverable) | notes on `positive` rows |
| trials started (`converted`) and paid on day 15 | `REPORT.md` and Stripe |
| bounce rate | `REPORT.md` section 3 |

No reply-rate band is pre-committed, because no published benchmark for this list exists. The
product funnel bands are in `phase-4-revenue/wagelens/THRESHOLDS.md`; the outbound rule is section 10.

## 10. Zero replies after 200 sends

Pre-committed, in order. Do not skip a step because the next one feels more likely.

1. **Deliverability first.** Send a draft to your own address on another domain and to a free-mail
   address and see where it lands; check SPF, DKIM, DMARC and the postmaster dashboard. If any of
   that is wrong the copy has not been tested yet; fix it and count the next 200 from zero.
2. **The list.** How many of the 200 were mailboxes and how many were contact forms, and were the
   forms actually pasted? A form nobody pasted is not a send. Mailbox-only sends are the number to
   judge on.
3. **The mix.** Which sequences got the 200? If one family had fewer than 50, it has not been tested.
4. **Change one variable: the subject line.** Switch every family's email 1 subject to the
   outbound variant `OFFER.md` section 3.1 keeps for this purpose, "The Friday filing system for
   federal subcontractors", record the date in `CLAUDE.md`, and send the next 100. Nothing else moves.
5. **Change the ask.** At 300 mailbox sends with no reply, the county determination is not a
   magnet for this list. Make the Conformance Pack (bonus B2) the email 1 deliverable instead: "reply
   and I will send the one-page conformance route". Next 100.
6. **Stop at 400 mailbox sends with no reply.** That is a finding, not a copy problem: the list, the
   channel or the offer is wrong for cold email. Take it to the founder decision list in `REPORT.md`
   and to `THRESHOLDS.md` section 7 (S3) before spending anything more on this channel.

Replies that are all "no" are not zero replies; they are data for section 6.

## 11. Pre-flight checklist

Before the first `approve`:

- [ ] `OUTBOUND_FROM_NAME`, `OUTBOUND_FROM_ADDRESS`, `OUTBOUND_POSTAL_ADDRESS`, `OUTBOUND_UNSUBSCRIBE_URL`
      set in your own shell. The sign-off uses the from-name and the engine does not block on it
      (`REQUESTS.md` R1), so `grep -l PLACEHOLDER outbound/wagelens/drafts/<date>/*.json` must print nothing.
- [ ] The unsubscribe URL works today, not on launch day.
- [ ] `mailbox_started_on` set in `config.json` on the day the sending mailbox is created.
- [ ] `display_name` in `config.json` is the name the product will ship under (P11).
- [ ] The pricing page shows $99 Shop and $79 Crew and the trial terms exactly as the emails state them.
- [ ] The public lookup is live, or you have the sam.gov route in section 7 ready, because the first
      reply can arrive within the hour.
- [ ] `support/` templates read once, the response time in `auto-reply.md` matches the help page.
- [ ] `grep -ri "refund\|guarantee\|start free" outbound/wagelens/sequences/` prints nothing.
- [ ] `python3 -m unittest discover -s outbound/engine -p 'test_*.py'` passes.
- [ ] The rendering check in `CLAUDE.md` reports 0 missing variables for every sequence.
