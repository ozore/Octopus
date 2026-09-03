# StateReady — pre-committed thresholds

**Owner:** Product Owner agent, phase-4 wave 1. **Date:** 2026-09-03.
**Evaluated at:** n ≥ 100 signups, per PLAN.md §4. Measured by `specs/13-admin-metrics.md`.
**Status of every number below: hypothesis.** They are written down *before* the data exists, which
is the only moment at which they can be honest.

---

## 0. Why this file exists and how it must be used

A threshold decided after the data arrives is not a threshold, it is a rationalisation. The four
numbers below are committed now, with their bands, so that at n = 100 the decision is a lookup rather
than an argument. The admin page renders the verdict directly (`specs/13-admin-metrics.md`), and it
**refuses to render a verdict below n = 100** — a green light on twelve signups is how a dead product
gets funded for another quarter.

Three rules bind whoever reads this at n = 100:

1. **Read all four metrics before deciding.** Any one of them can be gamed by the other three.
2. **Widen the confidence interval before celebrating.** Every rate is shown with a Wilson interval.
   47% on n = 100 is 37–57%; if the band boundary is inside the interval, the honest verdict is
   "not yet decidable — get to n = 200 on this metric".
3. **One change per iteration.** If the verdict is *iterate*, change one variable, and record it in
   the changelog at the bottom of this file with the date and the metric it was aimed at.

---

## 1. The four metrics

### Exact definitions, so they cannot drift

| # | metric | numerator | denominator | window |
|---|---|---|---|---|
| **T1** | **Activation** | organisations with ≥ 1 `licence_deadline_derived` | organisations with `organisation_created` | within 7 days of signup |
| **T2** | **Activation → paid** | activated organisations with `checkout_completed` | activated organisations | within 30 days of activation |
| **T3** | **Month-2 retention** | organisations with an active subscription at day 60 after first charge | organisations that reached day 60 | – |
| **T4** | **Playbook attach rate** | organisations with ≥ 1 `playbook_purchased` | paying organisations | within 90 days of first charge |

**T1 is defined on a *derived* deadline, not on a created licence, deliberately.** Typing an expiry
date into a form is something a spreadsheet does. Seeing a date the product worked out — from the
Texas anniversary rule, or North Carolina's 31 December, or Florida's even-year August — is the first
moment the customer sees what they are paying for. If that moment does not happen, nothing else will.

---

## 2. The bands

| # | metric | **stop** | **iterate** | **persevere** |
|---|---|---|---|---|
| **T1** | Activation (signup → derived deadline, 7 days) | **< 25%** | 25 – 44% | **≥ 45%** |
| **T2** | Activation → paid (30 days) | **< 8%** | 8 – 17% | **≥ 18%** |
| **T3** | Month-2 retention | **< 70%** | 70 – 84% | **≥ 85%** |
| **T4** | Playbook attach rate (90 days) | **< 5%** | 5 – 14% | **≥ 15%** |

### Composite rule

- **Any single metric in the stop band → stop that motion and fix it, before scaling spend.** Not
  "shut the company", but "stop sending outbound into a funnel with this hole in it".
- **Two or more in stop → stop the product.** Move the knowledge-base assets to whichever of the
  three phase-4 apps is working.
- **All four in persevere → scale outbound.** That is the only condition under which the daily send
  cap in `outbound/` goes up.
- **Anything else → iterate**, one variable at a time, and re-evaluate at the next n = 100.

---

## 3. Where each number comes from

Every band is derived, not chosen. The derivations are the argument; if a derivation is wrong the
band should move, and moving it *for a stated reason before the data arrives* is legitimate.

### T1 — Activation ≥ 45% (H1)

**Derivation.** Activation requires four things in one session: finish onboarding (M2), add a
technician or import a roster (M3), add one licence (M4), and be in a covered state (9 of 45 records
at launch). The last is the killer: **at launch we can derive deadlines for TX, FL and NC only.**

The outbound list is not uniformly distributed across states, but the phase-3 file's twenty
highest-fit accounts operate in 9 to 47 states each, so the probability that a given prospect has at
least one licence in TX, FL or NC is high — those three are ranked 3rd, 2nd and 5th by establishment
count and together hold 20.5% of US building-equipment contractors. The realistic failure is not "no
covered state", it is "the office manager started with the state they were worried about, and it was
Ohio".

**45% is therefore a bet on two things:** that a first-session import succeeds often enough
(spec 03's whole design), and that we steer the customer to a covered state early. If T1 lands in the
iterate band, the first variable to change is **not** the onboarding copy — it is the number of
covered states.

**Falsified if:** activation is high but T2 is in stop. That would mean deriving a deadline is easy
and worthless, and the activation definition is measuring the wrong moment.

### T2 — Activation → paid ≥ 18% (H2)

**Derivation from unit economics, not from a benchmark.** Starter is $149/mo. Assume, as a working
figure, a 14-month average subscription life at the T3 band's implied churn — that is roughly $2,090
of gross subscription revenue per paying customer, before any playbook.

Outbound (PLAN.md D4) is our own sequencing through the founder's mailbox, so the marginal cost per
prospect is agent time, not licence fees. The binding constraint is the **20 sends/day/mailbox cap**
and the founder's reply time. At 20/day and a 3% reply-to-signup rate, 100 signups is roughly
5,000 sends — about 50 sending days. For that quarter of a year of the founder's attention to be
worth spending again, it has to produce enough MRR to matter: 100 signups × 45% activation × 18%
conversion = **8 paying customers ≈ $1,200–2,000 MRR** from one outbound cycle. That is the
threshold of "worth repeating".

Below 8% conversion, the same cycle produces 3 customers and roughly $500 MRR, which does not pay for
the attention. Hence the stop band.

**The 14-day no-card trial (spec 09) sets the shape of this number.** No-card trials convert worse
than card-required ones and produce more signups; the band is set for the no-card design.

**Live disagreement, recorded before the data exists.** `OFFER.md` §8 proposes replacing the free
trial with a **$149 First State Audit** — a paid tripwire that captures a card up front. If the
founder takes that route, **T2 as defined breaks**: payment precedes activation, so activation → paid
approaches 1 by construction and the number stops meaning anything. Under the tripwire model the
metric must be redefined and re-banded *before* launch, not after:

| | free-trial model (this file's bands) | $149 audit model (if adopted) |
|---|---|---|
| T2 becomes | activation → paid, 30 days | **audit purchase → annual or monthly subscription, 90 days** |
| stop / iterate / persevere | < 8% / 8–17% / ≥ 18% | **< 20% / 20–39% / ≥ 40%** — the buyer has already paid us once and been handed a built calendar; if fewer than two in five subscribe after that, the subscription is not the product |
| watch alongside | signup → activation (T1) | **audit → delivered calendar, in days.** A tripwire that owes a deliverable is a promise; if delivery slips past 5 business days the model is broken regardless of conversion |

Whichever is chosen, the band is committed **before** the first signup. Reading the data first and
picking the band second is the failure this whole file exists to prevent.

**Falsified if:** conversion is fine but the customers who convert are all one segment (say, only
PE-backed platforms). Then the metric is right and the ICP in `BACKLOG.md` is wrong. `/admin/cohorts`
must be segmented by technician-count band before this call is made.

### T3 — Month-2 retention ≥ 85% (H3)

**Derivation.** This is a compliance calendar. The customer's own renewal cycle is annual in Texas
and North Carolina and biennial in Florida, so **most customers will not experience a renewal in
their first two months.** Month-2 retention therefore measures whether the product feels
indispensable *before* it has proved itself on a real deadline. That is a demanding test, and 85% is
demanding on purpose: a licence tracker that a customer is willing to cancel in month two was never
going to survive to month twelve.

The leading indicators to read alongside it, all instrumented:

- `notifications_paused` — the single best predictor of churn in an alerting product, and it happens
  before the cancellation, not after.
- `marked_renewed` — a customer who has used us to close a renewal has changed their process.
- `deadline_explained` ("why this date?") — a trust signal; customers who check our reasoning and stay
  are the ones who will refer.

**Falsified if:** retention is high but usage is zero — i.e. nobody logs in, nobody marks anything
renewed, and the subscription is simply not noticed. That is not retention, that is a slow churn, and
`/admin/cohorts` must show logins alongside retention to catch it.

### T4 — Playbook attach rate ≥ 15% (H4)

**Derivation.** The playbook sells to a company that is *entering a new state*. The addressable share
of our own customer base is therefore the share expanding in any 90-day window. The phase-3 file
gives a direct read on this for the top of the ICP: Apex closed ~60 add-ons in 2025, Legacy 33+ since
2021, Vertex operates in 22 states, PremiStar closed its 40th acquisition in June 2026. **For a
PE-backed platform, entering a new state is a quarterly event, not a rare one.** For an independent
30-technician contractor it might happen once in three years.

15% assumes the customer mix lands between those poles, and the product asks the question directly:
`operating_states.status` has an `expanding` value captured in onboarding (spec 02), so we know who
is a candidate **before** they buy. The honest version of this metric at n = 100 is therefore two
numbers: attach rate over all payers, and attach rate over payers who declared an expansion. If the
second is high and the first is low, the product is fine and the ICP needs narrowing.

**Falsified if:** attach rate is healthy but refund rate on playbooks exceeds 10%. That would mean we
are selling a document whose data does not survive contact with a licensing board, and the correct
response is to stop selling it and fix the knowledge base — not to iterate on the price.

---

## 4. Supporting metrics with their own tripwires

These do not decide persevere/stop, but any one of them in the red means a specific thing is broken
and must be fixed before the four headline metrics are read at all — otherwise they are measuring a
bug, not a business.

| metric | green | red | what red means |
|---|---|---|---|
| CSV import success (rows imported ÷ rows submitted) | ≥ 90% | < 75% | spec 03's mapping is failing on real files; activation is being measured against a broken door |
| Time to activation, median | ≤ 20 min | > 60 min | onboarding is too long; the customer is leaving and coming back |
| Alert delivery rate | ≥ 98% | < 95% | the product's heartbeat is not arriving; retention data is meaningless |
| `notifications_paused` rate | ≤ 5% | > 15% | we have become noise; the 90/60/30/7 schedule needs re-cutting before anything else |
| KB drift items open > 7 days | 0 | ≥ 3 | the knowledge base is rotting and the subscription's justification with it |
| Playbook refund rate | ≤ 3% | > 10% | data quality failure — stop selling playbooks that day |
| Uncovered-state requests (`state_coverage_requested`) | – | – | not a tripwire, a **roadmap input**: the top 3 requested uncovered states are the next three built |

---

## 5. What we will not conclude from this data

- **Not** that the price is right or wrong. Price sensitivity cannot be read off a single price point;
  testing it needs a second price on a comparable cohort, and that is a separate, later experiment.
- **Not** that outbound works. T2 mixes signup quality and product quality. Segmenting inbound
  (landing page) from outbound signups is required before any claim about either.
- **Not** that the knowledge base is good enough. Its quality metric is the pass-B agreement rate and
  the playbook refund rate, not conversion.
- **Not** anything at all from fewer than 100 signups, no matter how good the first ten look.

---

## 6. Evaluation protocol at n = 100

1. Freeze the cohort: the first 100 organisations with `organisation_created`, excluding
   `is_internal` (spec 13).
2. Wait for the windows to close: T1 needs 7 days per organisation, T2 needs 30 after activation, T3
   needs 60 after first charge, T4 needs 90. **The full read is therefore ~90 days after the 100th
   signup.** T1 and T2 can be read earlier and should be, because they gate the outbound spend.
3. Read each metric with its Wilson interval. Record the verdict per metric.
4. Apply the composite rule in §2.
5. Write the decision, the date, the numbers and the one variable being changed into §7.

---

## 7. Changelog of threshold changes and iterations

Empty by design. Every future entry must record: the date, which band moved or which variable
changed, the number that prompted it, and who decided.

| date | change | prompted by | decided by |
|---|---|---|---|
| 2026-09-03 | Initial bands committed (H1–H4) | none — pre-committed before any data | Product Owner agent, wave 1 |
| 2026-09-03 | T2 alternative band (H2b) added for the `$149 First State Audit` model | `OFFER.md` §8 proposes a paid tripwire in place of the free trial; recorded before launch so neither band can be chosen after the fact | Product Owner agent, wave 1 |

---

## 8. Hypothesis register

| id | hypothesis | basis | status |
|---|---|---|---|
| **H1** | ≥ 45% of signups will derive a deadline within 7 days | design of spec 03/04 + 3 covered states covering 20.5% of US building-equipment establishments | **unmeasured** |
| **H2** | ≥ 18% of activated organisations convert within 30 days on a 14-day no-card trial | unit economics of the 20/day outbound cap and $149 entry price | **unmeasured** |
| **H2b** | *If the $149 First State Audit replaces the trial:* ≥ 40% of audit buyers subscribe within 90 days | a buyer who has paid once and received a built calendar is qualified; below 2 in 5 the subscription is not the product | **unmeasured, and contingent on a founder decision** |
| **H3** | ≥ 85% survive to month 2, before experiencing a real renewal | annual/biennial renewal cycles in the launch states mean month 2 tests belief, not proof | **unmeasured** |
| **H4** | ≥ 15% of payers buy a playbook within 90 days | phase-3 evidence that state entry is a quarterly event for PE-backed platforms | **unmeasured** |
| **H5** | The $149 / $349 / $599 ladder, tiered on **states** with technicians as a guardrail, is inside the buyer's willingness to pay | anchored on LicensedTrades.com's public $199–1,199; **the "independent review" repeating those prices is the same operator's content marketing**, so this is one vendor's list price, not validated demand. `OFFER.md` adds the transacted comparators that are firmer: expediters at $399+ per application, trackers at $39.99–$499/yr | **weakly supported, contested** |
| **H6** | $1,500 list / $750 first state is inside willingness to pay for the State Entry Pack | anchored on concierge firms' published per-state fees ($399+ per application, quote-gated above); not directly observed | **unmeasured** |
| **H8** | Tiering on states rather than technicians matches the buyer's mental model | `OFFER.md` §7.2: a state × trade is a rulebook we maintain, and "we're in seven states" is the buyer's own sentence. Adopted over this spec's original technician-first proposal | **unmeasured — watch `plan_limit_hit` to see which limit actually binds** |
| **H7** | Covered-state count is the binding constraint on activation, not onboarding UX | inference from the 9-of-45 launch state of the knowledge base | **unmeasured — this is the first thing to test if T1 lands in iterate** |
