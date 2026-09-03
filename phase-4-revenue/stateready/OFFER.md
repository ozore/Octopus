# StateReady — the offer

**Status:** proposed by the Offer & Landing agent, wave 1. **Not live.** Per PLAN.md A5 the founder
validates the offer, and in particular the guarantees, before anything is created in Stripe.
**Evidence:** every price, fee and regulatory fact below traces to `offer/RESEARCH.md`, where each carries
a URL fetched on 2026-09-03. **`PERSONA.md` landed mid-draft and has been read and reconciled** (`offer/RESEARCH.md` §7b); its §3 is the
canonical numbers table and it wins over this document wherever both carry a figure. `IDENTITY.md` did not
exist and is still to be reconciled in wave 1b.

> **The correction this offer is built on.** Phase 1 claimed willingness to pay was *observed*, because
> LicensedTrades.com sells at $199–$1,199/mo. It does not sell anything: LicensedTrades.com and
> LicenseRoadmap.com are both **pre-launch waitlists published by the same company, Rovaryn Digital Inc.**
> (`RESEARCH.md` §3.1). The prices that are actually transacted in this market are **$399 and up per
> licence application** at the expediters, and **$39.99–$499 per year** at the trackers. Those two numbers,
> not the incumbent's rate card, determine everything below.

---

## 1. The buyer

Per `PERSONA.md` §1 there are three, and the offer needs all three because they buy different things.

**Primary — the licensing coordinator ("Dana").** Office manager, operations manager or HR generalist at
an HVAC / plumbing / electrical contractor with **15–100 technicians across 2–6 states**. She inherited the
licence calendar because she was organised and someone had to. She is not a compliance professional. She
is measured on nothing until something lapses, at which point she is measured on exactly that. **She is
the champion, not the signer** — the owner or GM approves, so every artefact she touches must be
forwardable. She buys the **subscription**.

**High-ticket — the integration / operations lead ("Marcus").** At a PE-backed home-services platform or
franchise system. Every close hands him a new state's rulebook, qualifier licences in someone else's name,
and a 90-day clock. His constraint is not cost but **time to a defensible answer before the close**. He
buys the **top tier plus a report per deal**. `PERSONA.md` §1 warns he must not be allowed to define the
launch product — he will ask for SSO, API and a security review on the first call.

**Third — the owner planning the next state.** Single-state today, bidding across a line tomorrow. The
sharpest, most time-boxed need in the market, and it is a **project, not a subscription**. He buys the
**one-off State Entry Pack** and may never subscribe. He churns by design, and that is fine: he is revenue
and he is the demand-generation surface, because *"get me licensed in another state"* is what people
actually type into a search box.

All three are reachable at the organisational level only (PLAN.md D5): generic mailbox or contact page,
personalised with facts the company publishes about itself.

**Why this ordering matters to the offer.** Buyer 1 is the only one whose pain recurs on a schedule, so
she is the only one a subscription fits. Buyer 3 is the cheapest demand we will ever get and needs no new
surface area. That is the structural argument for the configuration in §3: **the one-off is the front
door, the subscription is what it opens onto.**

---

## 2. The value equation

Hormozi: **Value = (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort & Sacrifice)**.

### Dream outcome — 9/10

Not "a tidy dashboard". For Dana: **no job stops, no permit application is refused, and she is never again
the person who found out too late.** For Marcus: **the acquired company's licences are on the calendar
before day one, and entering a new state takes weeks with no surprises.**

This is stateable without exaggeration because the regulators state the downside for us:

- California's board: **"You cannot actively contract with an expired, inactive, or suspended license."**
- NYC Buildings, on permit applications: **"Licensee's license and insurance information must be active
  and current."**
- The standard municipal clause: **"No building permit shall be issued to any contractor … whose
  certificate of insurance has expired or whose license has been suspended or revoked."**

And then the consequence chain that makes a lapse categorically different from an administrative slip.
California's Business & Professions Code **§7031(a)**: a contractor **"may [not] bring or maintain any
action … for the collection of compensation for the performance of any act or contract where a license is
required … without alleging that they were a duly licensed contractor at all times during the performance
of that act or contract."** And **§7031(b)**: **"a person who utilizes the services of an unlicensed
contractor may bring an action … to recover all compensation paid."** Work done in a lapse is work you
cannot sue to be paid for, and may have to hand back.

Two more, from `PERSONA.md` §3: California **SB 779** raises the civil penalty for unlicensed contracting
to **$1,500–$15,000 from 1 July 2026**; and a Texas ACR licence expired past 90 days renews at **twice the
fee**, past 18 months at twice the fee **plus the executive director's written approval**.

And the sharpest structural fact — CSLB again: an expired licence may be renewed **within five years**;
past five years **"you will be required to reapply by completing an Application for Original Contractor's
License."** Let it sit long enough and you do not renew it, you start over.

*(These are the offer's justification, not legal advice. Every one carries a source and a date, and every
surface carries the disclaimer required by PLAN.md A10.)*

### Perceived likelihood — 3/10. **The binding constraint.**

We are unknown, and the product's entire value rests on regulatory data being correct. A wrong renewal
date is worse than no product at all: it converts our customer's diligence into false confidence. Our
alternative is a firm advertising **"over 30 years in the licensing industry"**.

**Every dollar of offer design goes here.** Four levers, in order of force:

1. **The citation is the product.** Every date, hour, fee and bond amount in the app shows the state board
   page it came from and the date we last checked it. This is already mandated by PLAN.md A10 — the offer's
   job is to make it *visible*, because it is the trust artefact. No competitor does this; two of them
   cannot, because they have not shipped.
2. **The no-login demo.** Pick a state and a trade, see the licence types, renewal cycle and CE
   requirement, sourced. The buyer audits our data before we ask for anything. Nobody in this category
   lets you inspect the goods before the call.
3. **Honest triage — refuse business we should not take.** If a prospect tracks four licences for one
   person, the correct answer is CE Broker at $39.99/yr or StateRequirement at $99/yr, and we should say
   so by name. If a state × trade is not in our verified coverage, we say it is not covered rather than
   guessing. Turning down a sale is the cheapest credibility available to a company with no track record.
4. **The accuracy guarantee** (§5), which converts our biggest liability into our loudest promise.

### Time delay — 5 for the subscription, 9 for the one-off

The subscription's proof arrives at the next renewal, which may be five months away. **The expansion
report's proof arrives in days, against an expediter's four-to-eight weeks.** This asymmetry is the reason
the one-off is the front door and the subscription is what it opens onto.

### Effort & sacrifice — 4/10. **The second constraint.**

Someone must enter every technician, every licence number, every expiry date, in every state. This is
where products in this category die: not at the price objection, at the empty dashboard.

**The answer is not a discount, it is doing the work.** Licence records are public. We build the roster
**for** the customer from the state registers, and hand it back verified. Effort at the denominator goes
from "two weeks of data entry" to "confirm this list is right". Hormozi's rule applies literally: reduce
the denominator rather than inflate the numerator.

---

## 3. The core offer

**Offer name (Hormozi MAGIC — Magnet, Avatar, Goal, Interval, Container):**

> ### The 30-Day Lapse-Proof Rollout for Multi-State Trade Contractors

*Avatar:* multi-state trade contractor. *Goal:* lapse-proof. *Interval:* 30 days. *Container:* rollout.
Internally the two products are **the State Entry Pack** (one-off) and **StateReady** (subscription).

**What the buyer gets, stated in one sentence** (Suby's *Clarity* element):

> In 30 days, every licence, CE hour, bond and insurance certificate your company holds is loaded,
> verified against the issuing board's own published page, and on one calendar that warns you at 90, 60,
> 30 and 7 days — and when you enter a new state, we hand you the cited, step-by-step playbook for getting
> licensed there.

**The stack:**

| # | Component | The obstacle it removes | Cost to us | Value to them |
|---|---|---|---|---|
| 1 | **Done-for-you roster build** — we pull your company's and your qualifiers' licence records from the public state registers, load them and verify each against the board's own page | *"I will never find time to enter 60 technicians"* | High (the real cost) | Very high — it is the entire onboarding |
| 2 | **The cited requirement library** — per state × trade: licence classes, renewal cycle, CE hours and topics, bond and insurance minimums, each with its `source_url` and `last_verified` | *"How do I know your dates are right?"* | High (it is the moat) | Very high |
| 3 | **The deadline calendar and alert ladder** — 90 / 60 / 30 / 7 days, routed per licence holder and per category | *"I find out when the renewal is rejected"* | Low | High |
| 4 | **Bid-and-audit export** — one PDF proving current credential status for a GC, a municipality or a vendor portal | *"Prequal wants a compliance packet and I rebuild it by hand"* | Low | High |
| 5 | **Rule-change watch** — when a board changes a cycle, an hour count or a fee, the affected customers are told, with the diff and the source | *"CE requirements change and the spreadsheet doesn't know"* | Medium | High |
| 6 | **State Entry Pack** — the expansion playbook (§6) | *"We just bought a company in a state nobody here knows"* | Medium | Very high |

**Deliberately trimmed** (Ramanujam's *killers* — features whose presence destroys willingness to pay or
that we cannot honour):

- **Filing on the customer's behalf.** We are not an expediter and there is no human in the loop
  (PLAN.md). We tell you exactly what to file and, where useful, exactly what to hand an expediter — which
  shortens their bill. Saying this plainly is worth more than pretending otherwise.
- **Any guarantee of a regulatory outcome.** See §5.
- **Per-seat pricing.** The buyer is one person doing a company-wide job; charging her per colleague she
  wants to show the dashboard to is a tax on the internal champion.
- **A mandatory demo call.** Offer it; never require it. The no-login demo exists so the call is optional.

---

## 4. Bonuses

Stacked, low marginal cost, each solving a real obstacle (Hormozi's trim-and-stack; Suby's *Bonuses*):

| Bonus | Attached to | Why it is worth having |
|---|---|---|
| **Your first State Entry Pack included** | Annual plans only | The single largest lever on annual conversion: it converts an annual commitment into a purchase the buyer already budgets for. Worth $1,500 at list. |
| **The CE-provider directory for your states and trades** | All paid plans | Knowing 8 hours are due is half an answer; knowing which board-approved providers deliver them, in the mandated topics, is the other half. Built once from board-approved-provider lists. |
| **The qualifier map** | All paid plans | Which licence in which state is held in which individual's name, and what breaks if that person resigns. Every multi-state contractor has this exposure and almost none of them have it written down. |
| **Renewal-week brief** | All paid plans | The Monday email: what is due in the next 30 days, in which state, by whom, with the form and the fee. The artefact Dana forwards to her boss — which is how the product sells itself internally. |
| **Acquisition intake checklist** | Platform tier | For Marcus: what to ask for in diligence so the licence position is known before the close, not after. |

---

## 5. The guarantee — and the one we are not going to make

### 5.1 Recommended: three guarantees, all on things we control

1. **The Accuracy Guarantee** *(conditional, and the one that does the work)*
   > Every date, hour and fee in your account shows the state board page it came from and the day we last
   > checked it. Find one that disagrees with that source on the day you check it, tell us, and we correct
   > it within one business day and credit you a month.

   Cheap, entirely in our control, aimed squarely at the binding constraint, and it pays for itself: it
   turns customers into a correction pipeline for the knowledge base.

2. **The Rollout Guarantee** *(unconditional, fully in our control)*
   > Your roster — every licence, every state, every expiry — is loaded and verified within 30 days of
   > kickoff, or you do not pay until it is.

   Attacks the Effort term directly, and the outcome depends only on us.

3. **The Entry Pack Guarantee** *(conditional, bounded, verifiable)*
   > If your State Entry Pack omits a requirement that the state's own board publishes on the day we
   > deliver it, we rewrite it and refund the fee.

   Bounded by a fixed price, adjudicated against a public page rather than an opinion.

### 5.2 Flagged liability: "if we miss a renewal, we pay the reinstatement fee"

**Recommendation: do not offer this. Founder decision required.** It is the obvious guarantee in this
category and it is the one that can end the company.

| # | Liability | Detail |
|---|---|---|
| L1 | **Uncapped relative to price** | One delinquent CSLB renewal for a non-sole-owner entity is **$1,050** — 1.75 months of the $599 tier, for one licence in one state. A 50-technician customer across a dozen states can generate several in a quarter. Fat-tailed claims against flat revenue. |
| L2 | **Concedes the larger claim** | The reinstatement fee is not the loss. The loss is the stopped job (§2). A vendor who pays the small consequential loss has accepted the causal chain; the next demand is for the large one. |
| L3 | **Causation is unprovable** | We alert; the licence holder files. If they ignored four alerts, did we "miss" it? Every claim is a dispute with the person whose renewal we need. |
| L4 | **Adverse selection** | The customer with the worst compliance debt has both the highest expected payout and the highest propensity to buy. Akerlof's lemons problem applied to a guarantee. |
| L5 | **It is insurance in substance** | Fixed periodic premium against a variable contingent third-party loss. A compliance product cannot afford to be non-compliant by accident. |
| L6 | **It implies an agency we do not have** | We are not the licence holder, cannot file, and have no human in the loop. Indemnifying a regulatory outcome we cannot execute is unhonourable operationally, whatever the terms say. |

### 5.3 The safer alternative, if a risk-reversal on lapses is wanted

> **The Alert Guarantee.** If a licence tracked in your account lapses and we did not send you the 90-,
> 60-, 30- and 7-day alerts, we refund every month you have paid us, up to twelve.

Capped and knowable in advance. Adjudicated from **our own send log**, not from the customer's behaviour.
It promises our performance, not their outcome — which is the whole design principle. It should still go
past a lawyer before it goes on a page.

---

## 6. The expansion report as a productised one-off

### 6.1 What it is

**The State Entry Pack** — one state × one trade, delivered as a cited document plus the same data loaded
into the app:

1. Which licence classes the work actually requires, at state **and** local level, and who must hold them.
2. The qualifier question: who in your company can hold it, what experience must be evidenced, and what
   happens if they leave.
3. Reciprocity and exam waivers that genuinely apply to **your** licences — including, explicitly, what is
   *not* waived. Passing NASCLA's exam does not license anyone anywhere by itself.
4. Bond amounts, insurance minimums and the acceptable forms.
5. Fees, line by line, at current published amounts.
6. The filing sequence with realistic elapsed times, and what can run in parallel.
7. What to hand an expediter if you use one, so their engagement is short.
8. Every one of the above with its source URL and the date we checked it.

### 6.2 What it is priced against

| Alternative | What it costs today |
|---|---|
| Florida Contractor Licensing LLC | **$399 one-time** per application, state fees excluded — published |
| Harbor Compliance | **Quote-only.** *"Filing fees depend on your individual situation."* |
| API Processing | **No price published.** The only conversion path on the page is a phone number |
| State fees themselves | Wisconsin **$45** to Nevada **$1,040**; **median statewide fee $380** |
| Doing it internally | Dana's weeks, spent reading PDFs, with no artefact at the end |

**Three of the five alternatives will not tell you the price.** A published, fixed number is a
differentiator before the product is described.

### 6.3 Price, and the godfather version

| | Price | Rationale |
|---|---|---|
| **List** | **$1,500** per state × trade | Above one expediter application ($399, which is filing help, not the decision) and below a multi-state engagement. It is the price of a decision document, not paperwork. |
| **Bundled** | **$3,750** for up to 3 states (acquisition readiness), **+$1,000** per additional state | The Marcus purchase: one acquisition, all its states, before the close |
| **Godfather** | **$750 for your first state — and the full $750 credits against an annual plan taken within 90 days** | See below |

**The godfather offer, and its stated reason why.** Suby's *Rationale* element: a half-price offer without
a reason reads as desperation or as a price that was always fake. Ours is true and should be printed:

> **Why the first one is $750.** The first state you buy is a state whose rulebook we then maintain for
> every customer after you. You are paying for the research; we are keeping the asset. That is worth half
> the fee to us, and we would rather say so than pretend it is a launch discount.

At $750, with the full amount credited against an annual plan, the buyer's arithmetic on a $3,490 annual
Multi-State plan is: pay $750 now for a document worth more than that on its own, and the plan costs
$2,740 for the first year. Hormozi's "stupid to say no" test is met not by discounting the subscription
but by making the first purchase risk-free and independently valuable.

---

## 7. Price ladder

**Tier metric: states, with technicians as a guardrail.** Reasoning in `RESEARCH.md` §6.2. In short:
states is our real cost driver (each state × trade is a rulebook we maintain) and the buyer's own mental
model (*"we're in seven states"*), whereas technicians prices the wrong thing — a 60-technician
single-state shop has one rulebook. Technicians appear only as a fair-use band so a 300-technician
platform is not on a 12-technician plan.

**The objection to state-based pricing, designed out.** Charging by state looks like taxing growth. It is
not, because **a new state is not bought by upgrading the plan — it is bought as a State Entry Pack, which
includes that state's tracking for twelve months.** The expansion event, which the buyer already budgets
for and already pays an expediter for, funds the tier increase.

| Rung | Price | Limits | Contains | Role |
|---|---|---|---|---|
| **State Rulebook** | **Free.** No card, no login | 1 state × 1 trade per lookup | Licence classes, renewal cycle, CE hours and topics, bond/insurance minimums — each with its source and last-checked date | Lead magnet, demo, and the proof that our data is real |
| **First State Audit** | **$149 one-time** | 1 state | We build your roster for that state from the public registers and hand back a verified calendar. Credits in full against any annual plan within 90 days | Paid tripwire — replaces the free trial (§8) |
| **Single State** | **$149/mo** · $1,490/yr | 1 state, up to 25 technicians. **Stated lower bound: ~10 licensed people.** Below that we say a spreadsheet works | Calendar, 90/60/30/7 alerts, bid-and-audit export, requirement library, CE-provider directory, qualifier map, renewal-week brief | The shop that has one state and one problem |
| **Multi-State** | **$349/mo** · $3,490/yr | up to 5 states, up to 75 technicians | + rule-change watch, bond & insurance certificate tracking, per-state filtering, **first State Entry Pack included on annual** | **The core buyer.** Dana |
| **Platform** | **$599/mo** · $5,990/yr | up to 15 states, up to 250 technicians | + multi-entity / per-brand separation, subcontractor credential tracking, audit log, webhooks, acquisition intake checklist, **two State Entry Packs included on annual** | Roll-ups and franchise operators. Marcus |
| **Enterprise** | **Quote** | unlimited states and technicians | + API, SSO/SAML, per-brand branding, named contact | Apex / Sila / Service Logic scale. **No Stripe price at launch** — we have no basis for one yet |

Annual = ten months' price, i.e. two months free. This matches the convention already published in the
category and is simple to explain.

**Reasoning against the alternatives, tier by tier:**

- **Against the FSM platform the buyer already pays for.** Housecall Pro ships document storage, expiry
  tracking and renewal reminders natively. **That is the real price of "tracking": zero, bundled.** We are
  not priced against it because we are not selling the same thing — they store the date the coordinator
  types, we hold the state's rule behind it. Any pricing argument that ignores this is arguing with a
  prospect who has the feature open in another tab.
- **Against the trackers ($39.99/yr CE Broker Professional; $99–$499/yr StateRequirement).** We are not
  selling per-licence reminders to an individual. We are selling an organisation's permit continuity
  across states whose rules differ, with every value sourced. If the buyer wants reminders for four
  licences, **we should tell them to buy CE Broker.** Refusing that sale is worth more than winning it.
- **Against the expediters ($399+ per application, quote-gated above that).** We do not compete; we
  precede them. The Entry Pack is the decision and the shopping list. Where a filing is genuinely
  hard, it makes their engagement shorter and cheaper.
- **Against LicensedTrades' published rate card ($199/$349/$599/$1,199).** Deliberately the same band,
  deliberately not cheaper. Ramanujam's *minivation* is the failure mode of undercutting into an
  undifferentiated position, and there is nothing to undercut: **they have no customers.** We enter at
  $149 rather than $199 only because our entry tier is genuinely narrower (one state), and we win on two
  things they do not have — a public, inspectable demo of the data, and an expansion product.
- **Against the spreadsheet.** The true incumbent. It is free, it works until it does not, and it fails
  silently. This is why the demo and the divergence exhibit (Texas HVAC 8 CE hours vs Texas electrician 4)
  matter more than any feature list: they show the spreadsheet is *already* wrong.

---

## 8. Trial design

**No free trial of the subscription. A $149 paid audit instead.**

Poyar's benchmarks: 14 days is the modal trial (62% of products), card-gated trials convert to paid at
**30% versus roughly 6% without a card**, median free-to-paid is **8%**. We keep the card-on-file
mechanism and discard the format, for one reason: **our time-to-value is gated by data entry, not by
attention.** Fourteen free days of an empty dashboard measures whether Dana will spend two weeks typing.
She will not. We would have tested our onboarding and called it a verdict on our value.

**The design:**

| Step | What happens | Why |
|---|---|---|
| 0 | **State Rulebook** — no card, no login, no email. Pick a state and a trade, see the cited requirements | Gives the *diagnosis*, never the *remedy*. Lets the buyer audit our data before trusting us |
| 1 | **$149 First State Audit.** Card captured. We pull the company's licence records for one state from the public registers, verify each against the board page, and return a calendar | Card on file (Poyar's 30% mechanism preserved). Value in days, not months. Effort ≈ zero for the buyer |
| 2 | **Day 7–10 — the handover.** The verified calendar plus what we found: which credentials are within 90 days, which are unmatched, which qualifier is a single point of failure | This is the sales conversation, and it is made of their own data |
| 3 | **Annual plan, $149 credited.** Or the State Entry Pack if they are entering a state | The decision is now about the eleven other states, not about whether the tool works |

**The 3-day free trial the category currently offers is not a benchmark to match.** Three days is too
short for a compliance tool to prove anything, and it exists to fill a waitlist rather than to convert.

**Escape hatch:** if the $149 audit proves to be friction rather than filter after ~50 outbound
conversations, the fallback is a **14-day card-required trial with the roster build performed by us during
it** — same mechanism, no cash up front. Decide on data, not on preference.

---

## 9. Honest urgency

Hormozi is explicit that manufactured urgency is corrosive. Every one of these is external, real, dated
and citable. **No countdown timers, ever.**

| Trigger | The fact | Who feels it |
|---|---|---|
| **A statewide expiry wall** | Illinois: **"Plumber licenses must be renewed by April 30th following the date of issuance."** Every plumber licence in the state, one date | Anyone with Illinois plumbers. A calendar bought in February is worth more than one bought in May |
| **The delinquency step** | California: timely active renewal **$450 / $700**; **delinquent $675 / $1,050**. The penalty is dated and public | Any CA licence holder inside 60 days of expiry |
| **The five-year cliff** | California: renewable within five years; past five years, **reapply from scratch** | Anyone holding a dormant licence in a state they left |
| **CE before expiry, not after** | Texas: **"Continuing education courses must be completed before your license expires."** 8 hours ACR, 4 hours electrician | Anyone whose techs book CE in the last fortnight |
| **The late-renewal multiplier** | Texas ACR: expired under 90 days renews at **1.5×** the fee; 90 days to 18 months at **2×**; 18 months to 3 years at **2× plus the executive director's written approval** (`PERSONA.md` §3) | Any Texas licence holder. The penalty steps, so the date is not soft |
| **A dated statutory change** | California **SB 779**: civil penalty for unlicensed contracting rises to **$1,500–$15,000 from 1 July 2026** | Everyone working in California — and it is a real, dated calendar event, not a manufactured one |
| **The qualifier clock** | California: a qualifying individual who disassociates and is not replaced triggers **automatic suspension of the licence after 90 days** (`PERSONA.md` §3) | Any company whose licence sits in one person's name. This is the exposure nobody has written down |
| **The acquisition close** | Every close hands over a state's rulebook and a set of qualifier licences in someone else's name. The window to know what you bought is *before* the close | Marcus. This is his entire calendar |
| **Storm season** | Restoration and roofing crews cross state lines within 48 hours of a CAT event, when there is no time to research registration | The restoration platforms in the prospect list |

**Honest scarcity.** The done-for-you roster build consumes real capacity. If we can start four rollouts a
week, saying *"four rollout slots a week"* is true and therefore usable. If we can start forty, we say
nothing. Scarcity claims must be reconciled against actual capacity before launch — that is a founder
item, not a copy decision.

---

## 10. Objection map

| # | What they say | What it means | The answer, and where it lives |
|---|---|---|---|
| 1 | *"We already have a spreadsheet."* | The spreadsheet has never failed **yet** | The divergence exhibit: Texas HVAC 8 CE hours, Texas electrician 4, both cited. Their spreadsheet has one column called "CE hours". Landing page, above the fold |
| 2 | *"How do I know your dates are right?"* | **The real objection.** Everything else is politeness | Every value carries its source URL and last-checked date; the demo is public and unauthenticated; the Accuracy Guarantee pays if we are wrong. Demo + guarantee block |
| 3 | *"$349 a month is more than the state fee."* | Wrong frame — comparing us to a fee, not to the alternative | We are priced against the expediter ($399 per application, or a quote) and against not being able to pull a permit. And the fee comparison is genuinely favourable: one delinquent CSLB renewal is $1,050 |
| 4 | *"We use ServiceTitan / Housecall Pro — doesn't it do this?"* | **The strongest objection we face, and it is partly right.** `PERSONA.md` O1 | **Never say "it doesn't."** Housecall Pro's own page offers *"built-in tools to store documents, track expiration dates, and set automatic renewal reminders"*, and a ServiceTitan custom field holds a date. **They store the date you type; we hold the rule behind it.** They cannot tell you one of Texas's eight ACR hours must be Texas law, that New Jersey's ten-hour update must be taken live, or that a Texas licence expired past 90 days renews at twice the fee. Demonstrate rather than argue: run their exported list through the audit and hand back rules they did not have |
| 5 | *"I don't have time to set it up."* | The true blocker, and usually terminal | We build the roster from the public registers. You confirm a list. Rollout Guarantee: 30 days or you do not pay |
| 6 | *"Can you just file the renewals for us?"* | They want the expediter, not the software | No, and we will not pretend. We tell you exactly what to file and what to hand an expediter. Honest triage; it buys more than it costs |
| 7 | *"What if you get it wrong and we get shut down?"* | Liability anxiety, entirely legitimate | Accuracy Guarantee + Alert Guarantee; disclaimers on every screen (PLAN.md A10); we do not indemnify a regulatory outcome and we say so plainly. Never oversell here |
| 8 | *"We only work in one state."* | Often persona 3, not persona 1 | **Selling them the subscription is how we earn a refund request** (`PERSONA.md` O6). The product for a single-state shop planning a move is the **State Entry Pack**, one-time. Below roughly ten licensed people a spreadsheet genuinely works, and we should say so. If it is four licences for one person, name CE Broker at $39.99/yr and let them go |
| 9 | *"Send me a proposal."* (Marcus) | Procurement reflex; also a stall | There is no proposal — there is a published price and a $750 first state. The absence of a quote process is a feature against three quote-gated alternatives |
| 10 | *"We'll look at this after the acquisition closes."* | The most expensive sentence in the file | After the close you inherit the licence position rather than assess it. The Entry Pack exists to run *before*. Do not manufacture urgency; state the sequence |
| 11 | *"Who else uses this?"* | Social proof, which we do not have | Say so. *"You would be early. Here is what you can check instead: the demo, the sample pack, and the sources behind every date."* Never invent a customer |
| 12 | *"Is my technician data safe?"* | Real, and heightened for personnel records | Public register data plus what they upload; magic-link auth (A7); no LinkedIn or personal-data enrichment (D5). Answer briefly in the FAQ |

---

## 11. The first outbound email

**Angle: not "do you need licence tracking" — count their states back to them.**

Every organisation in the prospect list publishes its own brands, locations or states. That is
company-level, public, and the only personalisation permitted (PLAN.md D5). The email's job is not to sell
the subscription; it is to make the reader curious about a number they have never counted.

**Segment: platform integration lead (Marcus). Drafts-first (PLAN.md A4) — nothing sends without founder
approval.**

> **Subject:** 19 states on your brands page
>
> Your brands page lists 22 companies across 19 states.
>
> That is 19 separate renewal calendars, and the rules are not close to each other. In Texas an HVAC
> contractor licence needs 8 hours of continuing education before it expires; a Texas electrician needs 4,
> and on different topics. In Illinois every plumber licence in the state expires on 30 April. California
> licences run two years, and renewing late costs $1,050 instead of $700 for a corporate licensee.
>
> We built the cited version of that: every licence class, renewal cycle, CE hour and bond amount for
> HVAC, plumbing and electrical, each one showing the state board page it came from and the date we last
> checked it.
>
> No pitch in this email. If it is useful, reply with the two states your last acquisition added and I
> will send you those two rulebooks as a PDF — free, no call.
>
> — [founder], TheVillage
> [CAN-SPAM footer, physical address, one-click unsubscribe]

**Why this shape:** the specific number is the hook and it is theirs, not ours. The three regulatory facts
prove we have the data rather than claiming it. The ask is a reply, not a meeting. And the free thing is a
*complete narrow answer* (two states' rulebooks) that makes the next problem obvious — they have
seventeen more.

**Variant for Dana (specialty multi-state contractor):** same structure, one state swapped for the state
where she has the nearest hard deadline, subject line *"April 30, every Illinois plumber licence"*.

---

## 12. Draft Stripe product list

**Hand-over table for the founder (PLAN.md D2: the founder creates these; the app reads price ids from
env). Test mode first. Nothing here is created by an agent.**

Currency USD. Annual = 10 × monthly. `trial_period_days` is 0 everywhere by design (§8) — the tripwire
replaces the trial.

| # | Product name | Price nickname | Amount | Interval | Trial days | Env var for the price id | Metadata |
|---|---|---|---|---|---|---|---|
| 1 | StateReady — Single State | Monthly | $149.00 | month | 0 | `STRIPE_PRICE_SINGLE_MONTHLY` | `app=stateready` · `tier=single` · `kind=subscription` · `states_limit=1` · `techs_limit=25` · `entry_packs_included=0` |
| 2 | StateReady — Single State | Annual | $1,490.00 | year | 0 | `STRIPE_PRICE_SINGLE_ANNUAL` | as above + `billing=annual` · `months_free=2` |
| 3 | StateReady — Multi-State | Monthly | $349.00 | month | 0 | `STRIPE_PRICE_MULTI_MONTHLY` | `app=stateready` · `tier=multi` · `kind=subscription` · `states_limit=5` · `techs_limit=75` · `entry_packs_included=0` |
| 4 | StateReady — Multi-State | Annual | $3,490.00 | year | 0 | `STRIPE_PRICE_MULTI_ANNUAL` | as above + `billing=annual` · `months_free=2` · `entry_packs_included=1` |
| 5 | StateReady — Platform | Monthly | $599.00 | month | 0 | `STRIPE_PRICE_PLATFORM_MONTHLY` | `app=stateready` · `tier=platform` · `kind=subscription` · `states_limit=15` · `techs_limit=250` · `entry_packs_included=0` |
| 6 | StateReady — Platform | Annual | $5,990.00 | year | 0 | `STRIPE_PRICE_PLATFORM_ANNUAL` | as above + `billing=annual` · `months_free=2` · `entry_packs_included=2` |
| 7 | **First State Audit** | One-time | $149.00 | one_time | — | `STRIPE_PRICE_FIRST_STATE_AUDIT` | `app=stateready` · `kind=one_time` · `sku=first_state_audit` · `credits_against=annual` · `credit_window_days=90` · `states=1` |
| 8 | **State Entry Pack** | One-time, list | $1,500.00 | one_time | — | `STRIPE_PRICE_ENTRY_PACK` | `app=stateready` · `kind=one_time` · `sku=state_entry_pack` · `states=1` · `includes_tracking_months=12` |
| 9 | **State Entry Pack — First State** | One-time, godfather | $750.00 | one_time | — | `STRIPE_PRICE_ENTRY_PACK_FIRST` | `app=stateready` · `kind=one_time` · `sku=state_entry_pack_first` · `states=1` · `credits_against=annual` · `credit_window_days=90` · `once_per_customer=true` |
| 10 | **Acquisition Readiness Pack** | One-time, up to 3 states | $3,750.00 | one_time | — | `STRIPE_PRICE_ACQ_PACK_3` | `app=stateready` · `kind=one_time` · `sku=acquisition_pack` · `states=3` · `includes_tracking_months=12` |
| 11 | **Additional State — Entry Pack** | One-time add-on | $1,000.00 | one_time | — | `STRIPE_PRICE_ENTRY_PACK_ADDL` | `app=stateready` · `kind=one_time` · `sku=entry_pack_additional` · `states=1` · `quantity_allowed=true` |
| 12 | StateReady — Enterprise | — | **No price object at launch** | — | — | — | Quote-only; invoice manually until there is a basis for a list price |

**Notes for whoever wires this up.**

- `once_per_customer=true` on line 9 must be enforced in the app, not in Stripe. The godfather price is the
  one a customer could otherwise buy repeatedly.
- The `credits_against=annual` metadata on lines 7 and 9 drives a Stripe **coupon or invoice credit**
  applied at the annual checkout; it is not automatic. Needs a decision from the founder on mechanism
  (customer balance credit is the simplest and leaves the clearest audit trail).
- `states_limit` and `techs_limit` are enforced by the app, with a warning at 80% of the band and a
  prompt to upgrade. They are metadata for the app's benefit, not Stripe features.
- No tier has a trial. If §8's escape hatch is taken, add `trial_period_days=14` to the **annual** prices
  only, and require a card.
- Prices are USD, US market (PLAN.md A2). No tax behaviour is specified here; Stripe Tax is a founder
  decision.

---

## 13. Self-review

### The "stupid to say no" test

For Marcus, at the front door: **$750 for a cited, state-by-state answer to a question his last
acquisition created, delivered in days rather than the four-to-eight weeks an expediter quotes, refunded
if it misses a requirement the board publishes, and the whole $750 credited against the annual plan if he
takes one.** The alternative is a phone call with a firm that will not publish a price. That passes.

For Dana: **$149 to have someone else build the thing she has been meaning to build for a year, from
public records, with a written guarantee that it lands in 30 days or she does not pay.** That passes.

Where it does **not** pass: a single-state shop with twelve technicians and no expansion plans. For them
$149/mo against a $99/yr tracker is a bad deal and we should say so rather than sell it. That is a real
limit on the market, not a copy problem.

### Value equation, after the offer is applied

| Term | Before | After | What moved it |
|---|---|---|---|
| Dream outcome | 9 | 9 | Already strong; the work was making it *sayable* with regulator citations |
| Perceived likelihood | **3** | **7** | Visible citations, public demo, Accuracy Guarantee, honest triage. Not 9 — nothing replaces a track record, and pretending otherwise would be the exact failure the guarantee exists to prevent |
| Time delay | 5 / 9 | **8** | The one-off leads; the subscription's first value is the verified roster in week one, not the next renewal |
| Effort & sacrifice | **4** | **8** | Done-for-you roster build. The single highest-leverage change in this document |

### Honest weaknesses

1. **No customers, therefore no social proof, therefore no voice-of-customer copy.** Wiebe's data says the
   customer-swiped headline beat the professional's by 103% versus a 64% drop. We are structurally on the
   losing side of that experiment and we substitute regulator language for it. It is the best available
   move, not an equal one.
2. **The knowledge base is the product and it does not exist yet.** Every promise here is a promise about
   `KNOWLEDGE_BASE.md` being right. If coverage at launch is 15 states × 3 trades (PLAN.md A11), the offer
   must say *which* states, and refuse the rest. An offer that outruns the data would destroy the one term
   we spent everything on.
3. **The done-for-you roster build is unpriced labour.** It is the strongest lever in the offer and it is
   the one thing here that does not scale without automation of register lookups. If it cannot be largely
   automated, the $149 audit is loss-making and the Rollout Guarantee is dangerous. **Founder must see the
   register-scraping feasibility before this ships.**
4. **State-count pricing will meet resistance from the largest accounts**, who are in 40+ states and will
   land in Enterprise immediately — where we have no price. That is honest but it means the biggest names
   in the prospect list cannot self-serve.
