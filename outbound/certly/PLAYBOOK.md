# Certly outbound playbook

**Author:** Outbound Copywriter, phase-4 fleet, wave 3. **Date:** 2026-09-04.
**Runs with:** `outbound/README.md`, `phase-4-revenue/certly/OFFER.md` (signed), `PERSONA.md`,
`KNOWLEDGE_BASE.md` §F. **Who runs it:** the founder, alone. **Status:** rendered, never sent.

## Contents

1. The finish line and the path
2. The system on one page
3. Daily routine
4. Weekly routine
5. Reply handling
6. Objection scripts
7. Fulfilment: the free Gap Report
8. From report to trial to paid
9. Partner motion
10. LinkedIn, organisation level only
11. KPIs and stop-loss rules
12. Zero replies after 200 sends
13. Founder decisions

---

## 1. The finish line and the path

One path, four steps (OFFER.md §9, §11):

| step | what happens | founder's move |
|---|---|---|
| reply | an organisation answers | classify (§5), answer the same business day |
| free report | they forward up to 25 certificates | build the Gap Report (§7), return it the same day |
| trial | 14-day trial on the tier they pick, card required | one nudge on day 7 if quiet (§8) |
| paid | first charge on day 14 | nothing, unless a guarantee is claimed (§8) |

The report is the sales motion: free, theirs to keep, ending with the next certificate in their own file
to expire. Everything below exists to get a folder of certificates into the founder's inbox.

## 2. The system on one page

Sequences are folders under `outbound/certly/sequences/`. Delays are per step (`next_action_at` is the
send day plus the next step's `delay_days`, rolled to a business day).

| sequence | `segment` substrings (`config.json`) | rows | delays | angle |
|---|---|---:|---|---|
| `godfather-pm` | property management, self-storage, manufactured housing, student housing | 416 | 0, 4, 9, 16 | OFFER.md §11.1: the ACORD 25's own words, then the report |
| `godfather-hoa` | hoa, community association | 196 | 0, 4, 9, 16 | the board question; each association its own certificate holder |
| `godfather-gc` | gc, building contractor, multifamily builder, specialty prime | 212 | 0, 4, 9, 16 | the sub's certificate, the pay app, the premium audit |
| `partner-intro` | every partner segment | 115 | 0, 14, 28 | a free report for the people they serve |
| `plain-intro` | fallback (`default_sequence`) | 0 | 0, 4, 9, 16 | the offer in plain words |

Calendar: day 0, 4, about 13, about 29. Partners: day 0, 14, 28 and **no fourth touch**
(`partner_max_step: 3`; the fourth file exists only because the loader needs four).

Engine-enforced: 20 new and 60 total a day, 4 days between emails to one organisation (14 for partners),
business days in the recipient's time zone, 09:00 to 11:00 local, warm-up 5/10/20 once
`mailbox_started_on` is set. Personalisation: segment, location, portfolio size (24 rows). Emails sign with `OUTBOUND_FROM_NAME` and `Certly, a TheVillage Company`; the engine appends
the CAN-SPAM footer. Never sent: *covered*, *compliant*, *verified* about a policy; an accuracy
percentage; a customer count; a testimonial; "implementation"; "renewal season"; a countdown.

## 3. Daily routine

Set `OUTBOUND_FROM_NAME`, `OUTBOUND_FROM_ADDRESS`, `OUTBOUND_POSTAL_ADDRESS`, `OUTBOUND_UNSUBSCRIBE_URL` in
the founder's shell and `mailbox_started_on` in `config.json`; until then `approve` refuses every draft.
The sender name renders into the body: never approve a preview showing a bracketed placeholder.

Weekday morning, from the repository root:

```bash
python3 -m outbound.engine.cli certly seed                          # refresh routes and facts; keeps stages
python3 -m outbound.engine.cli certly plan    --date 2026-09-14     # follow-ups first, then up to 20 new
python3 -m outbound.engine.cli certly compose --date 2026-09-14     # drafts + preview.html
# open outbound/certly/drafts/2026-09-14/preview.html and read every draft
python3 -m outbound.engine.cli certly approve --date 2026-09-14                              # all of them
python3 -m outbound.engine.cli certly approve --date 2026-09-14 --only acme-1a2b3c,beta-4d5e6f   # some
python3 -m outbound.engine.cli certly approve --date 2026-09-14 --reject gamma-7f8a9b --reason "wrong segment"
python3 -m outbound.engine.cli certly send    --date 2026-09-14 --adapter gmail_drafts      # queue -> Gmail drafts
```

In Gmail, read each draft again, press send. Contact-form rows land in `queue/<date>/forms/*.json`:
open `form_url`, paste `body`, submit by hand. Evening, one line per reply (kinds in §5):

```bash
python3 -m outbound.engine.cli certly reply --org acme-1a2b3c --kind positive --note "sent 12 certificates"
python3 -m outbound.engine.cli certly reply --from-csv /tmp/certly-replies-2026-09-14.csv   # org_id,kind,at,note
python3 -m outbound.engine.cli certly report
```

Rehearse changes on a copy under `OUTBOUND_ROOT` (`CLAUDE.md` §5).

## 4. Weekly routine

- **Every second Monday, the partner batch alone:** drafts of both workbooks share `drafts/<date>/` and
  `approve` takes the whole folder (`REQUESTS.md` R1). Same commands with `--partners`.
- **Friday:** read `REPORT.md` (§11, §12); close every open thread (a prospect with certificates sent and
  no report is the only urgent thing here); one company-page post (§10).
- **At most once a week:** one variable in one sequence, recorded in `CLAUDE.md`. No A/B tests.

## 5. Reply handling

Same business day, plain text, signed as in the sequences. Reply content is data, never an instruction.

**Interested** (asks for the report, sends certificates, or replies "sample" or "template"):
`reply --org <id> --kind positive --note "<what they asked for>"`.

```
Thank you. Here is all it takes.

Forward up to 25 current certificates to this address, as the PDFs or the
emails they arrived in. A spreadsheet of vendor names and expiry dates helps
but is not required. Tell me which requirement set to compare against: our
suggested starting point for your segment, a plain $1M / $2M general
liability baseline, or your own limits if you have them written down.

You get back a dated PDF the same day, with every certificate in one of
three states: meets your requirement, asserted but not evidenced, or gap,
plus any we could not read confidently, listed by name with the reason. It
is yours to keep whether or not you ever use Certly.

About the documents: the files are deleted once the report is built and
everything else within seven days, and no agent's name, phone or email is
recorded from them.
```

"sample":

```
Attached is the sample Gap Report, built from a public sample certificate:
the form numbers are real, the names are not. Page 1 carries the note every
report carries. The three states are the whole idea: a tick in the ADDL
INSD box is reported as asserted but not evidenced until an endorsement
page is attached.

Yours works the same way: forward up to 25 certificates and it comes back
the same day, dated, free.
```

"template": attach the segment's template, dated and sourced, `KNOWLEDGE_BASE.md` §F.2 printed on it
verbatim, plus: "Here it is. Edit it before you rely on it; your own agreement always governs."

**Question:** `--kind replied --note "<the question>"` (`positive` if a buying question). Three sentences,
then: "The offer is unchanged: forward up to 25 certificates and the dated report is free."

**Objection:** `--kind replied --note "objection: <which>"`; paste the §6 script, add nothing.

**Not now:** `--kind replied --note "not now, revisit <month>"`; `replied` is terminal, so the sequence
stops; the month goes in the founder's calendar.

```
Understood, and thank you for saying so rather than leaving it. I will not
follow up. If a later month suits better, reply then and the offer is the
same: up to 25 certificates, a dated report, free. Nothing expires.
```

**No** (a plain no): `--kind replied --note "no"`. A competitor or anyone never to contact again:
`--kind do_not_contact` (permanent, no reply).

```
Thank you for the straight answer. I have closed the file and you will not
hear from me again about Certly.
```

**Bounce:** `--kind bounce`; never guess a replacement address.

**Unsubscribe** (any wording): `--kind stop`, same day, first; permanent. Reply only if they asked
something:

```
Done. Your organisation's address and domain went on my suppression list
today, and you will not hear from me again, through this or any other
channel.
```

**Out of office:** no engine action; the sequence continues. A better generic mailbox named in it goes
to the next enrichment pass, never into `workbook.csv` by hand.

## 6. Objection scripts

OFFER.md §10, paste-ready.

**1. "My spreadsheet works fine."**

```
It probably does, for the date. What it cannot hold is whether the
endorsement page was ever attached. The ACORD 25 says so itself: "a
statement on this certificate does not confer rights to the certificate
holder in lieu of such endorsement(s)." The Gap Report adds that one
column, and it is free, so the spreadsheet loses nothing by checking.
```

**2. "How do I know your AI reads them right?"**

```
You do not yet, and I will not give you a number I have not measured. What
you get instead: every field shows the exact text on the page it was read
from, anything below our confidence threshold is marked for review instead
of used, and the method is published. On the report, certificates we could
not read confidently are listed by name with the reason, not dropped.
```

**3. "This looks like a project."**

```
Forward one certificate. You get the answer before you finish your coffee.
Import your spreadsheet when you are ready, not before. There is no
implementation, and the word does not appear anywhere on our site.
```

**4. "I already tried a COI tool and it spammed my vendors."**

```
The reviews we read say the same, which is why the chase is built the other
way round: one consolidated ask per vendor per rung, addressed to the agent
named on the certificate where there is one, a visible cap on the number of
messages per expiry, and a pause switch per vendor. Your vendor
relationships are worth more than our reminder schedule.
```

**5. "$199 is more than [tracker] charges."**

```
It is. COI Tracker publishes $29, $59 and $129, TrackMyVendor gives 25
vendors free, and their own feature lists have no extraction, no
requirement matching and no endorsement check. They tell you when a
certificate expires. We tell you whether it was ever any good. If the date
is all you need, use them; the Gap Report is free either way.
```

**6. "I need a demo / I need to talk to someone."**

```
You can: reply with anything and I will answer it, or we can talk. You do
not have to, though. The price is on the page and the product runs on three
sample certificates without a login, so you can see both before anyone asks
for a calendar slot.
```

**7. "What about my tenants, not just vendors?"**

```
Same engine. A tenant certificate is a certificate, and there is a
commercial-tenant requirement template alongside the vendor ones.
```

**8. "Does it read anything besides ACORD 25?"**

```
Not at launch. ACORD 25 only, and I would rather tell you than let you find
out.
```

**9. "Is my vendors' data safe?"**

```
Your documents are yours: stored in your account, deleted when you delete
them, exportable in one ZIP at any time, and never used to train anyone's
model. The sub-processors are listed by name at /legal/subprocessors. For
the free report: files deleted when the report is built, everything else
within seven days, and no agent's name, phone or email recorded.
```

**10. "What if I stop paying?"**

```
Cancel in one click in the Billing Portal. Access runs to the end of the
paid period, then the account goes read-only and every export still works:
certificates, gap history, the renewal calendar, in one ZIP.
```

**Two we do not rebut** (OFFER.md §10):

```
"Can you guarantee my vendors are insured?"
No, and nobody can. Only the insurer can confirm coverage. What I can
guarantee is our warning: if a certificate we are tracking expires and we
did not warn you before it expired, that month is free.
```

```
"Are you as established as myCOI?"
No. They have sixteen years and 45 million documents. We have a working
demo, a published price and a guarantee, and you can test all three before
you pay us anything.
```

**Two only contractors raise** (PERSONA.md §3.8):

```
"Procore already emails me about expiries."
It does: every day, for up to 60 days after expiry, to you. Certly emails
the agent, before expiry, on a fixed ladder, and stops the moment the
certificate arrives.
```

```
"Does it integrate with Procore / Sage?"
At launch it is an export: CSV and PDF, which you attach to the vendor
record yourself. I will not promise a live connector with no date on it.
```

## 7. Fulfilment: the free Gap Report

The Free Gap Report of OFFER.md §3 and §8.2, built by hand from forwarded certificates until the
self-serve page clears its legal gate (F2).

**Arrival, same business day:** the "Interested" reply if not yet sent, confirm the requirement set, count
the documents. Over 25: report the first 25 and say so. Not an ACORD 25: "not checked", never a guess.

**Handling** (`specs/15` §6, by hand): files deleted the moment the report is built; readings and report
deleted after seven days; the producer's name, phone and email never copied; nothing forwarded.

**Producing:** load the certificates into the founder's own Certly organisation kept for this, pick the
template (the segment's starting point, the $1M / $2M baseline, or their limits), run extraction and
comparison, clear the review queue only where the page text supports it, export the PDF, delete the
vendors and documents.

**The report** (`specs/12` §3, `specs/15` §4), in order: cover with organisation name, date and time zone,
and the scope line "Read from the N documents you supplied on DATE. Compared against TEMPLATE, a
suggested starting point, not your contract."; `KNOWLEDGE_BASE.md` §F.1 verbatim on page 1; a headline of
counts and a date, never a verdict; per vendor its status word and "as of" date, then per requirement
the state and a sentence quoting the document; "Not checked by Certly", always; "Read, but not confident
enough to compare (k)", by file name with the reason; the requirement summary with §F.2 verbatim beside
it; last line, "The next certificate in this file expires in D days: VENDOR." (OFFER.md §7.1).

**The seven status words**, the only ones on a report, a screen or an email:

| word | meaning |
|---|---|
| meets requirements | the certificate evidences the requirement |
| expiring | current today, inside the warning window |
| asserted only | ADDL INSD or SUBR WVD ticked, no endorsement page attached |
| gap | limit short, coverage absent, expired, holder mismatch |
| needs review | read, but undecidable from the document |
| not checked | outside what Certly evaluates |
| no certificate | on the list, nothing received |

Expired renders as a gap with "expired on DATE". "Covered", "compliant" and "verified" never appear. The
report never says a vendor is insured or uninsured, only what a document evidences.

**Sending it back**, the same day, PDF attached, nothing else:

```
Subject: Your Gap Report, <date>

Attached is the Gap Report for the <N> certificates you sent on <date>,
compared against <template>, a suggested starting point, not your contract.

The headline: we compared <k> of the <N>. <x> have expired, <y> are short
of the requirement, and <z> claim an endorsement the certificate does not
evidence. <m> we read but could not compare; they are on page <p> with the
reason for each.

The next certificate in this file expires in <D> days: <vendor>.

The report is yours to keep. If you want the file kept in that state,
Certly tracks it from $99 a month, with a 14-day trial: card required, no
charge until <date>, cancel in one click. If a certificate we are tracking
expires and we did not warn you before it expired, that month is free.
```

A clean file: say so in the headline, keep the last two paragraphs; a dated clean file is what they show
the next lender or auditor.

## 8. From report to trial to paid

**Trial** (OFFER.md §9): CTA "Start 14-day trial", never "Start free"; beside it, in body text, "Card
required. No charge until {date}. Cancel in one click." It runs on the tier picked, all features, that
tier's limit, T-3 and T-1 reminders that cannot be switched off. No 25-vendor trial cap.

**Prices** (OFFER.md §8.2): Starter $99/mo or $990/yr, 50 tracked vendors. Standard $199/mo or
$1,990/yr, 150, the default. Portfolio $299/mo or $2,990/yr, 400. Vendor Pack +$39/mo per 50,
stackable. Above roughly 700: $0.55 per tracked vendor per month, invoiced, still no demo. Annual is ten
months for twelve.

**Tracked vendor**, the canonical words of OFFER.md §8.1 (its em dash rendered as a colon, F8): A tracked
vendor is one non-archived vendor in your account. Certly tracks one current certificate per tracked
vendor: renewals, re-uploads, corrections and endorsement pages never count again, and archived vendors
count zero. A vendor who has not sent anything yet still occupies a slot: finding those is the point.

**Guarantee:** OFFER.md §6.1 as written (MJ-19 fixes in); `REVIEW.md` OQ-1 signed it, nothing held back:

```
If a certificate we are tracking expires and we did not warn you before it
expired, that month is free. No form, no argument: tell us, and we credit
it. On an annual plan the remedy is a credit of one month of your plan, one
twelfth of what you paid.

This is a promise about our warning, not about your vendor's insurance. It
applies to every certificate where you gave us a readable expiry date. The
expiry warning cannot be switched off, so nothing you do in settings can
cost you this guarantee. It does not apply to a certificate we flagged for
review because we could not read its dates, to a vendor added after their
certificate had already expired, or to email we sent that your server
rejected; in all three cases you will find the warning in your dashboard,
dated.

Stacked with it: cancel any time, and 30 days money back, no questions
asked.
```

**Day 7 of a quiet trial** (OFFER.md §9.1, a health checklist, not activation): one nudge, never two.

```
Subject: one week in

Seven days in. By now a healthy trial has done four things: one certificate
processed, one requirement template saved, one gap or asserted-only finding
on screen, one chase sent to an agent. If any of those has not happened,
reply with the one that is stuck and I will do it with you by email today.

No charge until <date>; cancel in one click in Settings, Billing.
```

**Paid:** nothing to do. Refunds inside 30 days are manual, same day, no questions; Lapse Watch claims
are credited on the customer's word (`support/refund-request.md`).

## 9. Partner motion

The 115 rows of `workbook-partners.csv`, three touches 14 days apart, written to the organisation, never
a person. **What a partner gets:** the one-page description below, which the sequence promises; nothing
else exists (no portal, no integration). **Referral terms:** OFFER.md states none, so
there are none, **to be decided by the founder**; until written down, no percentage, fee or exclusivity
appears anywhere. "Terms, if any, are a conversation" is the whole position.

```
Certly, for the property managers and contractors you work with

What it does. Certly reads an ACORD 25 certificate of insurance, compares
it to the requirement the manager or contractor set, and puts each vendor
in one of three states: meets the requirement, asserted but not evidenced
(the additional-insured or waiver box is ticked and no endorsement page is
attached), or gap. It then chases the agent named on the certificate before
anything expires, on a fixed ladder with a visible cap.

What is free. The Gap Report: up to 25 certificates, a dated PDF, no
account, no card, no call. Files are deleted when the report is built and
everything else within seven days. The report is theirs to keep.

What is published. Prices: $99, $199 and $299 a month for 50, 150 and 400
tracked vendors, 14-day trial with a card, cancel in one click. No demo is
required to see any of it. We never charge vendors or subcontractors to
submit a certificate, and that sentence is in our terms.

What else comes with it. A requirement template library built from
published contract exhibits, dated and sourced, as starting points, never
advice. An agent chase pack that names the exact ISO forms to ask for (CG
20 10, CG 20 37, CG 24 04, the workers' comp waiver), so an agent is asked
once for the right page.

What it is not. It does not verify coverage, it is not insurance or legal
advice, and it reads ACORD 25 only at launch.

How to offer it. Forward this, link to the Gap Report page, or put it in a
member resource page or vendor onboarding packet. There is nothing to sign.
```

Partner replies follow §5 with `--partners`. A webinar, integration or volume-terms question is a
`positive` and a founder decision, not a promise in a reply.

## 10. LinkedIn, organisation level only

Decision D5: no named individuals, no connection requests, no InMail, no messages, no tagging, no
scraping. A Certly company page posts on Fridays and answers comments on its own posts as the page. No
claim outside OFFER.md, no number without a source and date, no customer names without written consent.
Four posts to rotate:

```
Every ACORD 25 says, in its own words: "a statement on this certificate
does not confer rights to the certificate holder in lieu of such
endorsement(s)." A tick in the ADDL INSD column is a claim. The endorsement
page is the proof. Most spreadsheets track the date and not that
difference. Certly reads the certificate and says which one you hold.
```

```
The third state. A vendor certificate is either meets your requirement, or
a gap, or the one nobody names: asserted but not evidenced. The box is
ticked; the endorsement page is missing. Calling that "compliant" is the
category's standard shortcut. We report it as what it is.
```

```
Once a year the carrier audits the policy. Travelers tells its insureds to
keep certificates "covering the time the contractors perform work for
you", and that without a valid workers' compensation certificate "we may
charge a premium for work performed by an independent contractor/
subcontractor". A dated Gap Report is the cheap way to find out first.
```

```
We never charge your vendors. Some platforms bill the vendor $80 to $125 a
year to upload a certificate; the vendor's answer is to stop uploading.
Certly's upload link needs no account and costs the vendor nothing, and the
sentence is in our terms.
```

## 11. KPIs and stop-loss rules

No open or link tracking, by design. **Replies are the only signal.** `REPORT.md` prints reply, positive,
bounce and unsubscribe rates over organisations emailed, per segment and per sequence; a base under 30
is noise and is printed with its base.

| rule | threshold | consequence |
|---|---|---|
| bounce rate | over 3% on a base of at least 30 | STOP-LOSS BREACHED in `REPORT.md`: stop, verify routes, re-seed, resume |
| spam complaints | over 0.1%, from the provider's postmaster tools | stop entirely; resume only with a new list, offer or domain |
| warm-up | 5, 10, 20 a day in weeks 1 to 3, follow-ups included | set `mailbox_started_on`; the planner caps itself |
| cadence | 20 new, 60 total, 4-day gap (14 partners), four touches | the planner skips and records why |
| opt-outs | any wording | `reply --kind stop` the same day; permanent |

Watch weekly: replies per 100 emails by sequence; replies that send certificates;
reports delivered the same day (all); trials from reports; each trial's day-7 checklist. The offer's only
benchmarks concern the trial (card-required trials around 30%, category median free-to-paid 8%,
OFFER.md §9). Outbound reply targets are a founder decision after the first 200 sends.

## 12. Zero replies after 200 sends

About two weeks at the cap. Diagnose in this order; the copy is the last suspect.

1. **Delivery:** bounces in `log.csv`; postmaster tools; the live sequence sent to three of the founder's
   own addresses on different providers; SPF, DKIM, DMARC.
2. **The base:** only mailbox rows can reply by email; recompute on mailbox sends alone.
3. **The mailbox:** search every folder, spam included, for the subject lines; confirm `OUTBOUND_REPLY_TO`
   is read.
4. **The ask:** if delivery is clean, test "forward one certificate" (OFFER.md §10, objection 3) in place
   of "up to 25" in one `01-initial.md` for 100 sends; record it in `CLAUDE.md`.
5. **The segment:** compare `godfather-gc` with `godfather-pm` and `godfather-hoa`; PERSONA.md §1
   pre-committed that if contractors reply and managers do not, the audit angle leads and the hero is
   rewritten for Buyer B.
6. **One variable a week after that:** subject, opening, proof paragraph. Never a claim to fix a silence.
7. **Stop rule:** another 200 sends with two recorded changes and still zero: pause outbound, keep the
   landing page and demo, take the numbers to the founder. Silence at 400 clean deliveries is about the
   offer, not the copy.

## 13. Founder decisions

Defaults ship if nothing is said.

| # | decision | default here | override |
|---|---|---|---|
| F1 | guarantee: §6.1 (used; REVIEW.md OQ-1 signed it) or §6.3 | §6.1 | strike before the first report; edit §8, `support/refund-request.md` |
| F2 | holding strangers' certificates by email before the §13.3 Q2 legal read | accept, §7 handling | sample report only until the read lands |
| F3 | "same day" report turnaround (OFFER.md §3) | same day | edit the four end-customer `02-followup.md` |
| F4 | `OUTBOUND_FROM_NAME`, rendered into every body | founder's name | a role name, and drop the sign-off |
| F5 | partner referral terms | none; founder decides | write them first, then say them |
| F6 | support response time (PLAN.md A6) | one business day | edit the ten templates |
| F7 | product name (IDENTITY.md §2.3: Coverfile) | Certly | replace in `sequences/`, `support/`, `config.json` |
| F8 | em dashes in OFFER.md §8.1 and §6.1 against the no-dash rule | same words, colon or comma | quote originals elsewhere |
| F9 | contact-form rows: 534 of 824 customers, 112 of 115 partners, manual pastes | include, mailboxes first | skip: 290 mailbox rows, about 15 sending days |
| F10 | the sample Gap Report email 2 offers | build before day 0 from a public sample, redacted, §F.1 on page 1 | remove "sample" from the four `02-followup.md` |
| F11 | postal address, unsubscribe URL, mailbox and start date (README §8) | blocked until set | set env values and `mailbox_started_on` |
| F12 | the partner day | every second Monday, no customer batch | any weekday, until `REQUESTS.md` R1 |
