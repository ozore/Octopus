# StateReady — the offer

**Status:** proposed by the Offer & Landing agent, wave 1; **revised 2026-09-03 against the wave-1b
review** (`REVIEW.md`, and the decision log in `REVIEW_RESPONSE.md`). **Not live.** Per PLAN.md A5 the
founder validates the offer, and in particular the guarantees, before anything is created in Stripe.

> **The four things the review changed, so nobody reads a superseded paragraph by accident:**
> **(1) D1** — launch is a **14-day free trial, no card, first 100 signups**. The $149 First State
> Audit and the done-for-you roster build are **deferred to iteration 2** behind a register-ingestion
> feasibility spike (§8). **(2)** The **Rollout Guarantee is withdrawn** and the **Alert Guarantee is
> re-drafted with carve-outs and a cap and does not ship until counsel has read it** (§5).
> **(3)** The **State Entry Pack promises only what the boards publish**, and names what they do not
> (§6.1). **(4)** The Stripe list lives in **`specs/09`** and this document points at it (§12).
> Entry Pack prices are unchanged.
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

**The answer is not a discount, it is doing the work — and the honest question is how much of that work
we can actually do today.** Licence records are public, and the eventual answer is to pull the roster
from the state registers and hand it back verified, taking the denominator from "two weeks of data
entry" to "confirm this list is right". **That is deferred (D1), because nobody in the fleet has
established that those fifteen registers can be read without a human**, and an offer whose strongest
term is an unbuilt capability is an offer that owes a deliverable.

**What reduces the denominator at launch**, in descending order of what we can prove:

1. **Import that survives a real spreadsheet** — merged headers, blank rows, prose in a Notes column,
   dates in four formats, and a date-format radio rather than a silent guess (`specs/03`). The file
   already exists on the buyer's screen; the job is not to make her build one.
2. **Derivation, so she enters less.** She types an issue date; we produce the renewal date, the CE
   obligation, its mandated topics and its separate cycle window. Every field the rules engine derives
   is a field she does not type — that is Effort reduction that costs her nothing and costs us nothing.
3. **The register build, when it is proven** (§8's spike). Then, and only then, Effort goes to 8.

Scored honestly at **6/10 after the offer** rather than 8. Hormozi's rule still applies literally —
reduce the denominator rather than inflate the numerator — but the reduction has to be one we can
perform on the first Tuesday, not one we can describe.

---

## 3. The core offer

**Offer name (Hormozi MAGIC — Magnet, Avatar, Goal, Interval, Container):**

> ### The 30-Day Lapse-Proof Rollout for Multi-State Trade Contractors

*Avatar:* multi-state trade contractor. *Goal:* lapse-proof. *Interval:* 30 days. *Container:* rollout.
Internally the two products are **the State Entry Pack** (one-off) and **StateReady** (subscription).

**What the buyer gets, stated in one sentence** (Suby's *Clarity* element):

> Every licence and CE obligation your company holds, on one calendar that knows each state's own
> rule — not the date you typed, the rule behind it — checked against the issuing board's own
> published page, with the page and the date we read it shown beside every value, and an alert at 90,
> 60, 30 and 7 days. When you enter a new state, we hand you the cited, step-by-step playbook for
> getting licensed there — every requirement the board publishes, and a first page naming every one it
> does not.

**The stack:**

| # | Component | The obstacle it removes | Cost to us | Value to them |
|---|---|---|---|---|
| 1 | ~~**Done-for-you roster build**~~ — **DEFERRED to iteration 2 (D1).** It has no spec, no Must and no feasibility evidence anywhere in the fleet's output, and it is the one element that reintroduces a human loop. What ships instead: **a CSV import built for a real, messy spreadsheet** (`specs/03` — merged headers, blank rows, four date formats, a date-format radio rather than a silent guess) plus a 14-day trial to do it in. Honest, and it is the buyer's own file rather than a register we have never read. **Nothing may say "we build your roster" until the spike in §8 passes.** | *"I will never find time to enter 60 technicians"* | Low (import) vs High (register build) | High — but it is the buyer's effort, not zero, and the offer must stop pretending otherwise |
| 2 | **The cited requirement library** — per state × trade: licence classes, who must hold them, renewal cycle, CE hours and topics, fees, bond and insurance **wherever the board publishes them, and an explicit "the board does not publish this" wherever it does not** — each with its `source_url` and `last_verified` | *"How do I know your dates are right?"* | High (it is the moat) | Very high |
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

## 5. The guarantee — what ships, what is drafted, and what we will never say

**Two guarantees ship at launch. One is drafted and held back. One is on the never list.** The design
principle behind the whole section, and the test every candidate has to pass:

> **Guarantee only what our own logs or a published page can adjudicate; cap every one; and never let
> a guarantee trigger on behaviour the product itself designs.**

### 5.1 Shipping at launch — exactly two, in exactly these words

Both are quoted verbatim in `specs/08`, `specs/12` `/legal/refunds`, the purchase screen and
`LANDING_SPEC.md` §8. **A paraphrase is a different guarantee**; a content test asserts byte equality
across every surface (`specs/12` AC8).

**1. The Accuracy Guarantee** *(subscription; conditional; adjudicated against a page)*

> Every date, hour and fee in your account shows the state board page it came from and the day we last
> checked it. Find one that disagrees with that source on the day you check it, tell us, and we correct
> it within **five business days** and credit you one month. One credit per customer per month.

*Changed from wave 1:* the correction SLA was **one** business day, which is a single-founder promise
with nobody behind it on a Friday (**m13**). Five, everywhere. The monthly cap is new and it is what
keeps a customer running a script against our whole knowledge base from generating twelve credits in
an afternoon. It still pays for itself: it turns customers into a correction pipeline for the KB.

**2. The Entry Pack Guarantee** *(one-off; conditional; bounded in time and money)*

> If a page published by the state's own licensing board **contradicts a value your State Entry Pack
> shows as verified**, tell us within **90 days** of your purchase and we rewrite the pack and refund
> what you paid for it. We adjudicate against the board's published page, not against a conversation.
> Our liability is limited to the fee you paid for that pack.

*Changed from wave 1:* three wordings existed — this document's, `specs/08`'s and `specs/12`'s — and
the two in the specs were the dangerous ones: *"full refund if a licensing board **tells you**
something in this document is wrong"*, an **oral, unverifiable** standard over the **whole document**
(**B5**). The standard is now a published page contradicting a value **we asserted as verified**; the
window is 90 days; the liability is the fee. It is affordable precisely because §6.1 now promises only
what the boards publish and names the gaps on page one: **a disclosed gap is not a contradiction.**

### 5.2 Withdrawn: the Rollout Guarantee

> ~~Your roster — every licence, every state, every expiry — is loaded and verified within 30 days of
> kickoff, or you do not pay until it is.~~

**Withdrawn, because the thing it guarantees is deferred.** It promised the done-for-you roster build,
which D1 defers to iteration 2 pending the register-ingestion spike (§8). A guarantee on a deliverable
we have not built and cannot yet automate is not risk reversal — it is an unpriced human obligation
with a refund attached. It returns, unchanged, on the day the spike passes and the roster build ships.

### 5.3 Drafted and held back: the Alert Guarantee

Wave 1 proposed this as "the safer alternative", on the grounds that it is adjudicated from our own
send log. The instinct was right and the wording was not: **as written it paid out on at least five
behaviours we design or the customer causes** (**B4**), capped at twelve months of fees —
**$1,788–$7,188 per claim**. Re-drafted:

> **The Alert Guarantee.** If a licence in your account lapses and **our send log shows we did not
> send the 90-, 60-, 30- and 7-day alerts for it**, we refund the subscription fees you paid us for
> the twelve months before the lapse, up to a maximum of the lesser of twelve months' fees and the
> fees you have actually paid us. Claims within **30 days** of the lapse, adjudicated from our send
> log.
>
> **It does not apply where:** (a) the licence was added to your account **fewer than 100 days before
> its expiry**, so the earlier alerts were never due; (b) alerts for that state were **muted** in your
> notification settings; (c) notifications were **paused** for the recipient or the organisation;
> (d) every recipient address had **bounced or complained** and was therefore suppressed; (e) alerts
> were paused because the **trial had ended or the subscription was past due**.

Each carve-out is a designed behaviour with a row in the database behind it: `specs/06` records every
one as an `alerts` row with `status = suppressed` and a reason (`added_after_offset`, `muted_state`,
`recipient_paused`, `address_suppressed`, `subscription_paused`), so adjudication is a query, not an
argument. 100 days rather than 90 gives the alert schedule a margin either side of the first gate.

**It does not ship at launch.** It goes on no page, in no app screen and in no email until counsel has
read it (`REVIEW.md` Q15), because the word "guarantee" on a public page is a UDAP hook if it is not
honoured exactly as printed, and this is the one of the three whose failure mode is a five-figure
cheque. Drafting it now means the founder has something a lawyer can price in one reading rather than
a blank page. **`specs/12` AC8 fails the build if this text appears on any rendered surface.**

### 5.4 Never: "if we miss a renewal, we pay the reinstatement fee"

**Not a wording problem. Do not offer it, in any form, ever** — it is on the NEVER list in
`BACKLOG.md` and the six reasons stand exactly as wave 1 wrote them:

| # | Liability | Detail |
|---|---|---|
| L1 | **Uncapped relative to price** | One delinquent CSLB renewal for a non-sole-owner entity is **$1,050** — 1.75 months of the $599 tier, for one licence in one state. A 50-technician customer across a dozen states can generate several in a quarter. Fat-tailed claims against flat revenue. |
| L2 | **Concedes the larger claim** | The reinstatement fee is not the loss. The loss is the stopped job (§2). A vendor who pays the small consequential loss has accepted the causal chain; the next demand is for the large one. |
| L3 | **Causation is unprovable** | We alert; the licence holder files. If they ignored four alerts, did we "miss" it? Every claim is a dispute with the person whose renewal we need. |
| L4 | **Adverse selection** | The customer with the worst compliance debt has both the highest expected payout and the highest propensity to buy. Akerlof's lemons problem applied to a guarantee. |
| L5 | **It is insurance in substance** | Fixed periodic premium against a variable contingent third-party loss. A compliance product cannot afford to be non-compliant by accident. |
| L6 | **It implies an agency we do not have** | We are not the licence holder, cannot file, and have no human in the loop. Indemnifying a regulatory outcome we cannot execute is unhonourable operationally, whatever the terms say. |

## 6. The expansion report as a productised one-off

### 6.1 What it is

**The State Entry Pack** — one state × one trade, delivered as a cited document plus the same data loaded
into the app:

**The promise, narrowed to what the data supports (wave-1b B2):**

> **Every requirement the state's board publishes, each with the page it came from and the day we
> checked it — and, on the first page, every requirement it does not publish.**

That is the whole promise and it is deliberately narrower than wave 1's. Wave 1 listed *"bond amounts,
insurance minimums and the acceptable forms"*, *"fees, line by line"* and *"the filing sequence with
realistic elapsed times"* as contents. Across the nine committed records **`bond.amount` is unknown 23
times out of 23**, `bond.required` 21 of 23, `typical_timeline` 7 of 9 and `application_fee` 7 of 23 —
every one honestly recorded as a gap with the pages we read. Selling a $750–1,500 document on four
sections it cannot contain is the Entry Pack Guarantee firing on our own data. The alternative — block
the sale until every field is verified — would make **zero of the nine records purchasable** and would
only be liftable by human research, which is the loop `PLAN.md` forbids. So the promise narrows, the
gaps go on page one, and the gap count is shown **before the card is entered** (`specs/08`).

1. Which licence classes the work actually requires, and who must hold them.
2. The qualifier question: who in your company can hold it, what experience must be evidenced, and what
   happens if they leave.
3. Reciprocity and exam waivers that genuinely apply to **your** licences — including, explicitly, what is
   *not* waived. Passing NASCLA's exam does not license anyone anywhere by itself.
4. Renewal cycle, renewal date rule and CE obligation — hours, mandated topics, delivery constraints —
   which is the part we can state completely for every state we sell.
5. Fees, bond and insurance **as published**: each figure where the board publishes one, and an
   explicit *"the board does not publish this — here are the pages we read"* where it does not.
6. The filing sequence, assembled only from durations boards actually publish. Where none is
   published, the document says so and names the office to ring. **We never write "6–8 weeks".**
7. What to hand an expediter if you use one, so their engagement is short.
8. Every one of the above with its source URL and the date we checked it — and a medium-confidence
   value printed **with its reasoning, not just its number**.
9. **A gaps block, first, before anything we do know.**

**What this costs and what it buys.** It costs the two most quotable lines in the old contents list.
It buys a document whose every sentence survives a buyer opening the board's own page next to it —
which is the only durable version of this product, and the reason the guarantee in §5.1 is affordable.

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
| **14-day free trial** | **Free. No card** | full product, 1 state | Everything on Single State, for 14 days, with alerts live. **First 100 signups** (D1) | The way in. It ends read-only, never deleted |
| ~~First State Audit~~ | ~~$149 one-time~~ | – | **DEFERRED to iteration 2 (D1)** — it owes a roster build only a human can currently produce. Returns if the spike in §8 passes | not offered at launch |
| **Single State** | **$149/mo** · $1,490/yr | 1 state, up to 25 technicians. **Stated lower bound: ~10 licensed people.** Below that we say a spreadsheet works | Calendar, 90/60/30/7 alerts, bid-and-audit export, requirement library, CE-provider directory, qualifier map, renewal-week brief | The shop that has one state and one problem |
| **Multi-State** | **$349/mo** · $3,490/yr | up to 5 states, up to 75 technicians | + rule-change watch, bond & insurance certificate tracking, per-state filtering, **first State Entry Pack included on annual** | **The core buyer.** Dana |
| **Platform** | **$599/mo** · $5,990/yr | up to 15 states, up to 250 technicians | + multi-entity / per-brand separation, subcontractor credential tracking, audit log, webhooks, acquisition intake checklist, **two State Entry Packs included on annual** | Roll-ups and franchise operators. Marcus |
| **Enterprise** | **Contact us** — *"a quote within two business days, or we tell you we cannot help"* | over 15 states, or unlimited | + API, SSO/SAML, per-brand branding, named contact | Apex / Sila / Service Logic scale. **No Stripe price at launch** — we have no basis for one and a made-up number rots the whole card. But it is a **published row with a route behind it**, not a silence: the 16th state hits `POST /enterprise-enquiry` (`specs/09`), which writes the enquiry, emails the founder with the state and technician counts pre-filled, and confirms the two-day promise to the customer |

Annual = ten months' price, i.e. two months free. This matches the convention already published in the
category and is simple to explain.

**Who this ladder is for, decided (D4).** The launch ICP is `PERSONA.md` buyer 1: **15–100
technicians, 2–6 states**. Twelve of the twenty highest-fit accounts in the phase-3 file operate in
more than 15 states on day one and land in Enterprise immediately, which is honest and is also a
statement that they cannot self-serve. They are a **wave-3 Entry-Pack motion**, not a subscription
motion, and `outbound/stateready/workbook.csv` must carry a `state_count` column, sort on it, and lead
the first batches with the accounts **inside** 15 states (Sila 13, Any Hour 10, Heartland 9,
Wrench ~15). Pitching a $599 plan to a 46-state roll-up burns the only first impression we get.

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

## 8. Trial design — **D1: a 14-day free trial, no card, first 100 signups**

**This section is a reversal.** Wave 1 proposed *"no free trial; a $149 First State Audit instead"*,
reasoning from Poyar's benchmark that card-gated trials convert at ~30% against ~6% without a card,
and from the observation that our time-to-value is gated by data entry rather than by attention. The
reasoning about data entry is correct and it survives. **The mechanism does not**, and the wave-1b
review resolved it against four documents that each carried a different answer (`REVIEW.md` §1).

**The decision:**

> **14-day free trial, no credit card, for the first 100 signups. The $149 First State Audit and the
> "we build the roster from the public registers" promise are deferred to iteration 2 and gated on a
> register-ingestion feasibility spike. The State Entry Packs ship unchanged from day one.
> `THRESHOLDS.md` H2 stands; H2b is registered and out of force.**

**Why the tripwire lost, in the order that decided it:**

1. **It owes a deliverable only a human can currently produce.** The audit's promise is a built,
   verified roster in 5–10 days, pulled from fifteen states' public registers. There is **no spec, no
   Must and no research** anywhere in the fleet's output showing that can be automated; the nearest
   artefact is a SHOULD triggered by a support ticket. `PLAN.md`'s Goal sentence forbids a human loop
   inside the product and `UX.md` C2 restates it as a build constraint. Taking money against an
   obligation we discharge by hand is precisely what that constraint exists to prevent — and §13
   weakness 3 of this document said so before the review did.
2. **It collapses the measurement.** Under the audit, payment precedes activation, so `THRESHOLDS.md`
   T2 → 1 by construction and the replacement band (H2b, ≥ 40%) is a judgment with no comparator and a
   watch metric — *"audit → delivered calendar in ≤ 5 business days"* — that is the SLA we cannot meet
   without the automation in (1). The trial keeps T1 and T2 meaning what `specs/13` computes.
3. **It does not touch the fast revenue.** The Entry Pack is the front door for buyer 3 and for
   Marcus, and it is independent of this decision. $750 for a document assembled from the knowledge
   base is positive revenue on day one; $149 against an unautomated deliverable plus a "30 days or you
   don't pay" promise is negative revenue.

**The design that ships:**

| Step | What happens | Why |
|---|---|---|
| 0 | **State Rulebook demo** — no card, no login, no email. Pick a state and a trade, see the cited requirements, and see what the board does not publish | The *diagnosis*, never the *remedy*. It lets the buyer audit our data before trusting us, and it is **the single free entry point** (D2) |
| 1 | **Start the trial** — magic link, no card. 14 days of the full product, alerts live, one state's worth of limits | The buyer's own stack has taught them this shape: Jobber publishes 14 days, no card (`PERSONA.md` §9). We are not going to be the compliance vendor with the most friction on the way in |
| 2 | **Their own roster, imported** — CSV or paste, built for a messy file, with a date-format radio rather than a silent guess (`specs/03`) | This is the honest version of "effort ≈ zero". It is their file, and it is minutes, not weeks |
| 3 | **Day 7 and day 12 emails; day 14 read-only** — data intact, exports open, alerts paused **and said so in words** | Silently continuing to send makes the product free; silently stopping lets a licence lapse on our watch |

**What we give up, stated plainly:** the card on file, and roughly a 5× conversion mechanism at the
signup step. What we get: no owed deliverable, no human loop, a clean read on T1 and T2 at n = 100,
and the ability to say "no card" on a page whose entire argument is that we do not hide things.

**The register-ingestion spike — the gate on iteration 2** (`BACKLOG.md` **S10**, wave-1b **B3**):
two dev-days, a written per-state verdict for all fifteen launch states — is the register searchable
without a licence number? machine-readable? rate-limited? bot-walled? does it return entity licences
or only individuals? — then a spec, then a Must. **Until that verdict exists, no surface says "we
build the roster"**, and the microcopy that said so has been removed from `LANDING_SPEC.md`. If the
spike comes back positive for a majority of states, the $149 audit becomes a good offer and D1 should
be reversed at the next review, with the band change recorded in `THRESHOLDS.md` §7 **before** any
data is read.

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

**Honest scarcity: we say nothing about capacity, and that is now settled rather than pending.** The
only capacity-limited thing in the offer was the done-for-you roster build, and D1 defers it. With
nothing scarce, a scarcity claim would be a manufactured one, which is the single lie a compliance
brand cannot survive (`REVIEW.md` Q11). The **"first 100 signups"** framing on the trial is not
scarcity marketing and must never be dressed as it: it is the size of the cohort `THRESHOLDS.md`
evaluates, it appears in no headline and on no counter, and signup 101 gets the same trial by default.

---

## 10. Objection map

| # | What they say | What it means | The answer, and where it lives |
|---|---|---|---|
| 1 | *"We already have a spreadsheet."* | The spreadsheet has never failed **yet** | The divergence exhibit: Texas HVAC 8 CE hours, Texas electrician 4, both cited. Their spreadsheet has one column called "CE hours". Landing page, above the fold |
| 2 | *"How do I know your dates are right?"* | **The real objection.** Everything else is politeness | Every value carries its source URL and last-checked date; the demo is public and unauthenticated; the Accuracy Guarantee pays if we are wrong. Demo + guarantee block |
| 3 | *"$349 a month is more than the state fee."* | Wrong frame — comparing us to a fee, not to the alternative | We are priced against the expediter ($399 per application, or a quote) and against not being able to pull a permit. And the fee comparison is genuinely favourable: one delinquent CSLB renewal is $1,050 |
| 4 | *"We use ServiceTitan / Housecall Pro — doesn't it do this?"* | **The strongest objection we face, and it is partly right.** `PERSONA.md` O1 | **Never say "it doesn't."** Housecall Pro's own page offers *"built-in tools to store documents, track expiration dates, and set automatic renewal reminders"*, and a ServiceTitan custom field holds a date. **They store the date you type; we hold the rule behind it.** They cannot tell you one of Texas's eight ACR hours must be Texas law, that New Jersey's ten-hour update must be taken live, or that a Texas licence expired past 90 days renews at twice the fee. Demonstrate rather than argue: run their exported list through the audit and hand back rules they did not have |
| 5 | *"I don't have time to set it up."* | The true blocker, and usually terminal | **The honest answer, now that the roster build is deferred:** paste or drop the spreadsheet you already keep. Import is built for a messy file — merged headers, blank rows, four date formats — and it asks you which date format you meant rather than guessing (`specs/03`). Minutes, not weeks, and it is your file. **Do not say "we build the roster"** until the spike in §8 passes |
| 6 | *"Can you just file the renewals for us?"* | They want the expediter, not the software | No, and we will not pretend. We tell you exactly what to file and what to hand an expediter. Honest triage; it buys more than it costs |
| 7 | *"What if you get it wrong and we get shut down?"* | Liability anxiety, entirely legitimate | **Accuracy Guarantee** (§5.1) + every value carrying its board page and the day we read it + the gaps named rather than hidden; disclaimers on every screen (PLAN.md A10). We do **not** indemnify a regulatory outcome and we say so plainly. **Do not cite the Alert Guarantee** — it is drafted and not in force (§5.3) |
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
> We built the cited version of that: every licence class, renewal cycle and CE requirement for HVAC,
> plumbing and electrical, each one showing the state board page it came from and the date we last
> checked it — and, where a board publishes no bond amount or no processing time, it says so instead of
> guessing.
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

## 12. Stripe product list — **the list lives in `specs/09`**

**There is one hand-over table and it is at the end of `specs/09-billing-and-plans.md`.** This section
used to restate it and the two drifted in three places, all of them in the part the founder actually
types into Stripe (wave-1b **M6**):

| what diverged | wave 1 here | wave 1 in `specs/09` | settled |
|---|---|---|---|
| Multi-State env vars | `STRIPE_PRICE_MULTI_MONTHLY` / `_ANNUAL` | `STRIPE_PRICE_MULTISTATE_MONTHLY` / `_ANNUAL` | **`MULTISTATE`**. The boot check reads exactly the names in `specs/09` |
| The **$1,000 "Additional State — Entry Pack"** add-on | present (line 11) | **absent** | **kept**, and it is now line 10 of the canonical list |
| The credit mechanism | *"needs a decision from the founder … customer balance credit is the simplest"* | *"implemented as a Stripe coupon applied at Checkout"*, stated as settled | **It is an open founder question (Q8)**, stated as open in both places. Default if unanswered: a **customer balance credit applied by the app**, `once_per_customer` enforced in the app, and **one credit per customer, whichever is larger** — never two (**M7**) |

**Two further changes from D1 and D4:**

- **No `STRIPE_PRICE_FIRST_STATE_AUDIT`.** The $149 audit is deferred; the price object is not created
  and the app has no code path that can charge it (`specs/09` AC9).
- **No Enterprise price object**, and that is now a *published row that routes* rather than a silence:
  "Contact us — a quote within two business days", backed by `POST /enterprise-enquiry` (§7).

Everything else — three tiers monthly and annual, the four Entry Pack SKUs, `trial_period_days = 0`
everywhere because the trial is app-managed and no-card — is exactly as `specs/09` prints it. **Prices
are hypotheses (H5, H6) and are not live until the founder validates them** (PLAN.md A5).

## 13. Self-review

### The "stupid to say no" test

For Marcus, at the front door: **$750 for a cited, state-by-state answer to a question his last
acquisition created, delivered in days rather than the four-to-eight weeks an expediter quotes, refunded
if it misses a requirement the board publishes, and the whole $750 credited against the annual plan if he
takes one.** The alternative is a phone call with a firm that will not publish a price. That passes.

For Dana, **as the offer now stands**: **fourteen days of the whole product, no card, with her own
spreadsheet imported in minutes and the state's actual rule — not the date she typed — behind every
line, and an alert at 90 days when a CE course can still be booked.** That is a weaker "stupid to say
no" than the wave-1 version, and it is honest: the strong version was buying her effort with labour we
cannot yet perform. The strong version comes back the day the register spike passes (§8).

Where it does **not** pass: a single-state shop with twelve technicians and no expansion plans. For them
$149/mo against a $99/yr tracker is a bad deal and we should say so rather than sell it. That is a real
limit on the market, not a copy problem.

### Value equation, after the offer is applied

| Term | Before | After | What moved it |
|---|---|---|---|
| Dream outcome | 9 | 9 | Already strong; the work was making it *sayable* with regulator citations |
| Perceived likelihood | **3** | **7** | Visible citations, public demo, Accuracy Guarantee, honest triage. Not 9 — nothing replaces a track record, and pretending otherwise would be the exact failure the guarantee exists to prevent |
| Time delay | 5 / 9 | **8** | The one-off leads and is delivered in minutes; the subscription's first value is a derived deadline in the first session, not the next renewal |
| Effort & sacrifice | **4** | **6** | **Downgraded from 8 by D1.** Wave 1 scored this on the done-for-you roster build, which is deferred; what actually ships is a CSV/paste import designed for a messy real file with an explicit date-format choice (`specs/03`). That is a genuine improvement on retyping sixty rows and it is not "effort ≈ zero". **8 returns with the roster build**, and the honest reading is that Effort is the term with the most upside left in this offer |

### Honest weaknesses

1. **No customers, therefore no social proof, therefore no voice-of-customer copy.** Wiebe's data says the
   customer-swiped headline beat the professional's by 103% versus a 64% drop. We are structurally on the
   losing side of that experiment and we substitute regulator language for it. It is the best available
   move, not an equal one.
2. **The knowledge base is the product and it does not exist yet.** Every promise here is a promise about
   `KNOWLEDGE_BASE.md` being right. If coverage at launch is 15 states × 3 trades (PLAN.md A11), the offer
   must say *which* states, and refuse the rest. An offer that outruns the data would destroy the one term
   we spent everything on.
3. **The done-for-you roster build was unpriced labour, and it is now deferred rather than promised.**
   It remains the strongest lever available to this offer and the one thing that does not scale without
   automated register lookups. **It is gated on the two-day spike in §8** and until that verdict exists
   no surface says "we build the roster". This is the weakness wave 1 named and did not act on; acting
   on it costs the offer its best line and removes its largest liability.
4. **State-count pricing still meets resistance from the largest accounts**, who are in 40+ states and
   land in Enterprise immediately. D4 accepts that rather than papering over it: they are an Entry-Pack
   motion, the ladder says "contact us" with a two-business-day promise attached, and the outbound
   workbook sorts by state count so the first batches go to accounts that can actually buy.
5. **Effort is now the weakest term in the value equation** (6/10), by our own arithmetic. Every
   iteration-2 candidate should be scored against it first — the register spike, board licence-number
   verification (`BACKLOG.md` S2), and an integration that reads a roster out of the FSM platform the
   buyer already pays for.
