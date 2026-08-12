# Go-to-Market & Pricing Deep Dive — "Reinstate"

**Subject:** Reinstate — paste an Amazon/Walmart suspension notice, get a submission-ready Plan of Action (POA) in minutes.
**Assignment:** fastest path to the first 10 paying customers (channels, hooks, offer); a pricing/packaging model; a 90-day revenue ramp with explicit assumptions.
**Method:** Alex Hormozi *$100M Offers* (value equation, Grand Slam Offer checklist) and *$100M Leads* (Core Four); Gabriel Weinberg & Justin Mares *Traction* (Bullseye, all 19 channels scored); Madhavan Ramanujam *Monetizing Innovation* (WTP-first, packaging/bundling rules); Kyle Poyar / OpenView SaaS pricing benchmarks; Geoffrey Moore *Crossing the Chasm* (beachhead); April Dunford *Obviously Awesome* (carried forward from report 02); Paul Graham "Do Things That Don't Scale"; Eric Ries *The Lean Startup* (concierge MVP).
**Date:** 2026-08-12
**Method note:** the session's WebSearch budget was exhausted before this assignment began. Research proceeded by direct WebFetch against named URLs (competitor pricing pages, Kyle Poyar's benchmark surveys) plus the two sibling deep-dives already committed to this repo (`01-demand-pmf.md`, `02-competition-positioning.md`), whose competitive pricing tables are reused rather than re-derived. Sources that could not be fetched (Reddit, several 404s) are named as gaps in §8.

---

## 0. Executive summary — the four decisions

**Verdict: GO_WITH_CHANGES.** The offer and channel design are sound and can produce revenue inside two weeks. The *pricing architecture named in the winning brief is wrong in two specific ways*, and one of them is arithmetically fatal to the proposed growth channel.

**Decision 1 — The offer.** Per Hormozi's value equation, Reinstate's naturally strongest terms are Time Delay (10 minutes vs. a consultant's 5 days) and Effort & Sacrifice (paste a notice; no Seller Central access, no intake call). Its weakest term by far is **Perceived Likelihood of Achievement** — an unknown AI tool against Riverbend's "10,000+ Sellers" and reinstate.io's "85% success rate on first appeal." Every dollar of offer-design effort should go into that one term: visible policy-clause citations (RAG grounding per Lewis et al. 2020), honest triage that refuses unwinnable cases, a layered guarantee, and a human-review tier. Competing on speed is competing where we already win; competing on credibility is competing where we currently lose.

**Decision 2 — Pricing.** Recommended ladder: **Free Decoder → Rescue $149 one-time → Rescue+Human $399 one-time → Shield $49/mo → Shield Pro $149/mo**. Two changes from the brief:
- The brief's **$39–79/mo monitoring tier is mispriced against the market**. SellerSonar sells monitoring-only at **$19.98–23.98/mo entry**, and Appeal Guru's "360 Suspension Prevention" runs **$179.95–309.95/yr (≈$15–26/mo)** ([sellersonar.com/pricing](https://sellersonar.com/pricing); [theappealguru.com](https://theappealguru.com) via report 02). Monitoring alone is a commoditized ~$20 product. $49/mo is only defensible when the appeal is *bundled into* it — Ramanujam's bundling rule (bundle to raise willingness-to-pay across a heterogeneous segment), and a model already validated by **Riverbend PRO** ("if your account gets suspended while enrolled, we handle the entire appeal," [riverbendconsulting.com](https://riverbendconsulting.com/)).
- The brief's **$299–499 rush tier is correctly priced but wrongly sequenced.** It should not be the entry offer.

**Decision 3 — Channels.** Bullseye scoring of all 19 *Traction* channels (§4) puts three in the inner ring: **Engineering as Marketing (22/25), Community Building (21/25), SEM (20/25)**. Community + Engineering-as-Marketing are effectively one motion — a free notice decoder posted as a genuine answer into live "just got suspended" threads — and they are the entire path to the first 10 customers at ~$0 cash cost.

**Decision 4 — the arithmetically fatal finding.** Modelled LTV at the recommended prices is **≈$394 gross / ≈$355 contribution**, giving a **maximum sustainable CAC of ~$118 at a 3:1 LTV:CAC ratio**. Modelled SEM CAC at a hypothesised $10 CPC is **~$375 — roughly 3.2× over budget** (§6.4). **Paid search cannot be the growth engine at a $149 entry price.** It is a *learning* test with a hard cap, promoted to the engine only if measured CPC comes in materially below hypothesis or blended AOV rises past ~$350 via human-tier mix and Shield attach. This single number should govern the whole 90-day plan.

**One framing correction the assignment should absorb:** the brief asks for a *subscription-first* model. Subscription-first is the right **destination** and the wrong **acquisition motion**. A seller in maximum-panic mode will not sign up for a recurring plan — that is pure Effort & Sacrifice in Hormozi's denominator. The honest 90-day model (§6) exits with **~$420 MRR against ~$14.2k/month of transactional revenue — subscription is under 3% of revenue at day 90.** Reinstate is a transactional business with a subscription seed in year one. Any plan presented as "subscription-first from day one" is a forecast that will miss.

---

## 1. Inputs carried forward (do not re-derive)

From `01-demand-pmf.md` and `02-competition-positioning.md`, the following are settled and used as given:

**The revealed price ladder** — this is *revealed* willingness-to-pay from live transactions, not survey-stated WTP, which per Ramanujam's *Monetizing Innovation* is the single most valuable pricing input a startup can have:

| Tier | Price | Player | Source |
|---|---|---|---|
| Free | $0 | Forums, template libraries, PlatformAppeal free classification, community GPTs | report 02 §1.3 |
| Template mill | $49 | planofactiontemplate.com | report 02 §1.1 |
| AI, one-shot | **$97 flat** | AppealDesk | [getappealdesk.com](https://getappealdesk.com) |
| AI + refund guarantee | **$149 flat** | AppealDraft ("Full refund if Amazon rejects") | [appealdraft.org](https://www.appealdraft.org) |
| AI + RAG, higher touch | $350/appeal | ReinstateIQ / "Appeal Wizard" | report 01 §2.3 |
| DIY templates | $495 | The Appeal Guru | report 02 §1.2 |
| Human consultant band | $500–2,500 | AppealDraft's own cited estimate; corroborated | report 01 §2.3 |
| Consultant (estimate) | $1,250 | AppealDesk's published comparison table | [getappealdesk.com](https://getappealdesk.com) |
| Turnaround-tiered service | $1,495 (72h) / $2,495 (24h) | The Appeal Guru | report 02 §1.2 |
| Monthly retainer | $997 / $1,197 / $1,500 / $2,500 per month | SellerCandy | report 02 §1.2 |
| Attorney (estimate) | $3,500 | AppealDesk's published comparison table | [getappealdesk.com](https://getappealdesk.com) |
| Monitoring-only SaaS | $19.98–89.98/mo | SellerSonar | [sellersonar.com/pricing](https://sellersonar.com/pricing) |
| Monitoring-only | $179.95–309.95/yr | Appeal Guru "360" | report 02 §1.2 |

**Market size & trigger frequency:** ~1.9–2.0M active Amazon 3P sellers; 22–35% experience at least one suspension; ~1.6 suspension events/year among affected sellers; on the order of 500k–800k suspension events annually (report 01 §3). **The 1.6 events/year figure matters enormously for pricing** — it means the transactional product has genuine repeat-purchase behaviour, which is what makes the LTV in §6.4 work at all.

**The urgency number:** an AppealDesk tester reported losing **"$800/day"** while suspended (report 01 §3). This is the single most important number in the entire offer, and §2.1 explains why.

**Positioning (from report 02, Dunford's canvas):** "suspension-defense copilot" — AI drafting *plus* human escalation *plus* monitoring — deliberately chosen to avoid a head-to-head price war with AppealDesk's $97.

**Naming blocker:** report 01 §6.5 found **reinstate.io** trading since 2019 with 500+ cases and 4.9★/500+ reviews. The GTM plan below is name-agnostic; the brand must be resolved in Phase 2b before any of these channels are switched on, because the community and SEM channels both depend on a searchable, uncollided name.

---

## 2. The Offer — Hormozi's value equation

### 2.1 The four terms, scored honestly

Hormozi's value equation (*$100M Offers*): **Value = (Dream Outcome × Perceived Likelihood of Achievement) ÷ (Time Delay × Effort & Sacrifice)**. Numerator terms should be maximised, denominator terms minimised. Scored for Reinstate as currently conceived, 1–10:

| Term | Score | Reasoning | Lever |
|---|---|---|---|
| **Dream Outcome** | 9 | Not "a good POA" — it is *"my account is live again and money is moving by the weekend."* At the cited $800/day, a 7-day-faster reinstatement is **$5,600 recovered**. This is a rare category where the dream outcome is directly monetary and the customer can compute it themselves. | Sell the recovered cash flow, not the document. Display a live "days suspended × your daily revenue = $X lost" counter on the free tool. |
| **Perceived Likelihood** | **3** | **The binding constraint.** An unknown AI tool competes against Riverbend's "10,000+ Sellers / 400+ Appeals Serviced Monthly," reinstate.io's "85% success rate on first appeal / 92% on escalation," and ReinstateIQ's claimed "87% reinstatement rate." Reinstate has zero track record on day one. Per Helmer's audit in report 02, it also has zero moat on day one. | Every offer-design dollar goes here. See §2.2. |
| **Time Delay** | 9 | <10 minutes vs. AppealDesk's "under 5 minutes," AppealDraft's "10 minutes" (but gated behind a 15-minute intake call), a consultant's 5 days, an attorney's 2 weeks. Free decode in ~60 seconds. | Already near-maximal; the marginal win is making the *free* result instant and unauthenticated. |
| **Effort & Sacrifice** | 8 | Paste one block of text. Critically: **no Seller Central access required** — AppealDraft markets "No automation or account access… You click submit yourself, in your own Seller Central," which tells us sellers are actively paranoid about granting access. AppealDraft nonetheless requires a **15-minute intake call**; that is an Effort cost we can undercut to zero. | Zero-call, zero-account-access, zero-credit-card free tier. Make "we never touch your account" an explicit headline claim. |

**The strategic read:** three of four terms are already strong and hard for competitors to beat *on the axis they compete on*. The whole game is Perceived Likelihood. A startup that spends its energy shaving the draft from 10 minutes to 4 is optimising a term already scored 9 while ignoring one scored 3.

### 2.2 Raising Perceived Likelihood — the six levers, ranked

1. **Show the retrieved policy clause verbatim, with its source.** Per Lewis et al. 2020 (RAG, NeurIPS), retrieval grounding is what separates a cited answer from a plausible completion. Commercially, the *visible citation* is the trust artefact: "Your notice cites Section 3 of the Business Solutions Agreement — here is the exact clause, and here is the specific corrective action Amazon's own policy text asks for." No competitor surfaces this today (report 02 §2, Step 3).
2. **Honest triage — refuse the unwinnable cases.** Counter-intuitively, this is the strongest trust lever available. AppealDesk publicly declines six categories (IP infringement, counterfeit, linked accounts, money laundering/fraud, Section 3 policy abuse, GPSR/regulatory) and markets "Honest triage" as a *checkmark in its comparison table against attorneys*. Telling a seller "this one needs a lawyer, here's who" costs one lost $149 sale and buys the referral network and the review. **Adopt it, and go one step further: refer those cases to a partner attorney for a referral fee** (turning a refusal into revenue and a business-development relationship — §4.3).
3. **Layered guarantees** (detailed in §2.4).
4. **The human-review tier's mere existence.** Even for buyers who choose the $149 tier, "a human can check this for $399 if you want" raises perceived likelihood of the cheaper tier — a decoy/anchoring effect (Ramanujam's behavioural pricing chapter).
5. **Publish win-rate honestly, including denominator.** Every competitor publishes an unaudited success rate; report 01 §6.2 flags all of them as "self-serving marketing claims." A published methodology ("n=, measured how, cases excluded") is differentiating precisely because the category is saturated with unfalsifiable numbers.
6. **Community-sourced proof.** Per Weinberg & Mares, the community channel produces social proof as a by-product: a public thread where a stranger was helped for free is stronger evidence than a testimonial on our own site.

### 2.3 Grand Slam Offer checklist — problems → solutions → trim & stack

Hormozi's construction sequence: (1) identify the dream outcome, (2) list every obstacle between the customer and it, (3) convert each obstacle into a solution, (4) pick delivery vehicles, (5) **trim and stack** (cut high-cost/low-value, keep low-cost/high-value), (6) enhance with scarcity, urgency, bonuses, guarantees and naming.

**Steps 2–4 — obstacle inventory for a just-suspended seller:**

| # | Obstacle (in the seller's words) | Solution | Delivery vehicle | Cost to us | Value to them | Trim/stack verdict |
|---|---|---|---|---|---|---|
| P1 | "I don't actually understand what I violated" | **Notice Decoder** — reason code + exact policy clause + plain-English diagnosis | Instant web tool, no login | ~$0.02 | Very high | **FREE TIER** (lead magnet) |
| P2 | "I don't know what Amazon wants in a POA" | Auto-structured Root Cause / Corrective Action / Preventive Action skeleton | Same tool, gated at first section | ~$0 | Very high | Free preview, paid completion |
| P3 | "My draft sounds defensive and will be auto-rejected" | **Rejection-Risk Scorer** — flags emotional/blaming/excuse language | In-product | ~$0 | High | Stack into Rescue |
| P4 | "I don't have the invoices / supplier letters they want" | **Evidence Kit** — per-reason-code document checklist + supplier letter templates | PDF + in-product checklist | ~$0 (build once) | High | Stack as bonus |
| P5 | "I get very few shots at this; if I burn them I'm dead" | Unlimited revisions + pre-submission review + an explicit "don't submit yet" warning | In-product | Low | Very high | Stack into Rescue |
| P6 | "I'm losing $800/day and can't wait five days" | <10 min draft, 24/7, no call | Product | ~$0 | Very high | Core |
| P7 | "I don't trust an AI with my livelihood" | Human review tier + visible citations + honest triage | Contractor reviewer | **High (~$60–90/case)** | Very high | **Do NOT bundle — this is the $399 tier** |
| P8 | "I'm not giving a stranger access to my Seller Central" | Zero account access, ever | Policy + headline claim | $0 | High | Stack everywhere, say it loudly |
| P9 | "What if this happens again?" | **Shield** monitoring + pre-drafted POAs for top risk vectors | Subscription | Medium | Medium (pre-event), Very high (post-event) | **Sequence it post-reinstatement** (§3.4) |
| P10 | "What if I pay and it doesn't work?" | Layered guarantee | Terms | Medium | Very high | §2.4 |
| P11 | "What do I do about cash flow while I wait?" | "While You Wait" checklist (inventory, ads, payroll, storage fees) | PDF | ~$0 | Medium | Stack as bonus |

**Explicitly trimmed (high cost, or value-destroying):**
- **Done-for-you submission on the seller's behalf** — trimmed. High operational cost, and AppealDraft's marketing claims compliance with an "Amazon March 2026 Agent Policy" (report 01 §2.3), implying constraints on third parties acting for sellers. *This is an unverified competitor marketing claim and is flagged in §8 as a mandatory legal-diligence item before launch.*
- **Mandatory intake call** — trimmed. AppealDraft requires one; it is pure Effort & Sacrifice and it caps throughput at human speed. Offer it, never require it.
- **Requiring Seller Central credentials** — trimmed permanently. In Ramanujam's packaging vocabulary this is a **"killer"**: a feature whose presence actively destroys willingness-to-pay for a paranoid segment.

**Step 6 — enhancers:**
- **Urgency: genuine, do not manufacture.** Hormozi warns against fabricated urgency; here the urgency is real and external (the appeal clock, the daily revenue bleed). Display it factually — days suspended, estimated cumulative loss — and never invent a countdown.
- **Scarcity: genuine.** Human-review capacity is physically limited. "N human-review slots remaining today" is honest scarcity because it is true.
- **Bonuses:** Evidence Kit (P4), Reason Code Playbook, "While You Wait" cash-flow checklist (P11), and **Rejection Rescue** (if the first submission is rejected, a second-round strategy at no extra charge).
- **Naming (Hormozi's MAGIC — Magnet, Avatar, Goal, Interval, Container):** e.g. *"The 72-Hour Reinstatement Sprint for Suspended FBA Sellers."* Avatar = suspended FBA seller; Goal = reinstatement; Interval = 72 hours; Container = sprint. **Blocked on the reinstate.io naming collision (§1).**

### 2.4 The guarantee — where the offer is currently *behind* the market

This is the second place where the winning brief underestimates the field. **AppealDraft already offers "Full refund if Amazon rejects,"** and **PlatformAppeal already offers "unlimited revision rounds if Amazon rejects."** Per Hormozi, the guarantee is typically the single largest conversion lever in an offer — and here we would be *entering behind*, not ahead.

Recommended **layered** guarantee (Hormozi's taxonomy: unconditional, conditional, anti-guarantee, implied):

1. **Time guarantee (unconditional, fully in our control):** *"Your draft is in your inbox in 10 minutes or it's free."* Cheap, differentiating, and the only guarantee whose outcome we fully control. No competitor offers a time guarantee.
2. **Service guarantee (conditional):** *"Unlimited revisions until you're reinstated or you tell us to stop."* Matches PlatformAppeal — table stakes, not differentiation.
3. **Outcome guarantee (conditional, A/B test):** *"First submission rejected? Your human review is free."* Note this deliberately gives *more service* rather than cash back — Hormozi's preference where feasible, because it retains the customer and the case data (which is the Process Power feedback loop identified in report 02 §3).
4. **Optional aggressive variant to test:** match AppealDraft's full cash refund on the $149 tier. **Risk: adverse selection** — sellers with unwinnable cases self-select in and refund out. This is Akerlof's lemons problem (Akerlof 1970, *QJE*) applied to a guarantee rather than a market. **Mitigation is already designed in: honest triage at intake (§2.2 lever 2) screens the unwinnable cases out *before* payment**, which is precisely why AppealDesk's triage-and-refuse model and a strong refund guarantee are complements rather than alternatives.

---

## 3. Pricing & packaging — Ramanujam + Poyar benchmarks

### 3.1 Ramanujam's discipline applied

*Monetizing Innovation* names four failure modes: **feature shocks** (over-built, over-priced), **minivations** (under-priced, under-scoped innovations that leave money on the table), **hidden gems** (valuable features buried in the wrong package), and **undead** (products nobody wanted). **Reinstate's live risk is the minivation** — cloning AppealDesk's mechanic and pricing at or below $97 to "win on price," which per Ramanujam is the classic undifferentiated discount that destroys the category's economics without buying defensibility. Report 02's Helmer audit reaches the same conclusion from the moat side: there is no power in being cheapest.

**Ramanujam's Rule 1 — have the WTP conversation before you build.** Already satisfied, and satisfied in the strongest possible form: §1's ladder is *revealed* WTP from competitors collecting real money, not survey intent. Per Fitzpatrick's *Mom Test*, this outranks any willingness-to-pay survey we could run.

**Ramanujam's Rule 2 — segment by need and WTP, never by demographics:**

| Segment | Definition | Need | Observed/inferred WTP | Priority |
|---|---|---|---|---|
| **S1 "Panicked Solo"** | First suspension, <$500k GMV | Speed + reassurance | **$97–199** (AppealDesk/AppealDraft transact here) | **Beachhead (Moore)** |
| **S2 "Bleeding Mid-Market"** | $1M–10M GMV, losing $1k–10k/day | Certainty + a human + a throat to choke | **$400–2,500** (consultant band) | Primary margin pool |
| **S3 "Chronic"** | Prior suspensions, recurring ODR/policy issues | Prevention | **$49–149/mo recurring** | Subscription core |
| **S4 "Managers"** | Agencies, aggregators, VAs, brand managers, prep centres | Multi-account workflow + volume | **$149–999/mo** | Expansion + channel (§4.3) |

Per Moore's *Crossing the Chasm*, the beachhead is **S1**, because the trigger event is public, timestamped and daily in the forums — which is what makes the first 10 customers reachable in two weeks. **S4 is not a beachhead but a channel**: one agency aggregates dozens of suspension events, which is why it appears in §4 as the highest-value reserve channel despite a slow sales cycle.

**Ramanujam's Rule 3 — choose the pricing model deliberately.** Poyar's 2026 monetization survey (n=230 B2B software and AI companies, April–May 2026) finds **flat-fee pricing used by 37% of early-stage companies under $5M ARR**, and **hybrid pricing up from 25% to 37% year-on-year** ([growthunhinged.com](https://www.growthunhinged.com/p/the-state-of-b2b-monetization-in-2026)). Recommendation: **flat-fee transactional + flat-rate subscription, with metered pricing only at the S4/agency tier (per monitored account)**. This is both the benchmark-modal choice for our stage and consistent with PLAN.md's explicit "the idea must stay simple" constraint. Poyar also reports AI-native companies targeting a **median 50% gross margin** vs. traditional SaaS at 70–80%+; Reinstate should land well above that (§6.4) because inference is the cheap input and human review is priced separately rather than absorbed.

**Ramanujam's Rule 4 — packaging: leaders, fillers, killers.**

- **Leaders** (drive the purchase; must never be free): the completed policy-cited POA; human review; unlimited revisions.
- **Fillers** (nice-to-have; pad the tiers): Reason Code Playbook, "While You Wait" checklist, multi-marketplace coverage.
- **Killers** (destroy WTP if included): mandatory Seller Central access; mandatory intake call; any implication that we submit on the seller's behalf.
- **The free tier gives away the *diagnosis*, never the *remedy*.** PlatformAppeal already gives free violation classification, so free classification is now table stakes; our free tier must go one step further — show the first section of the *actual draft* and paywall mid-document. This is the highest-converting configuration of a lead magnet in Hormozi's framing: solve a narrow, complete problem for free, in a way that makes the next problem obvious.

### 3.2 Recommended ladder

| Package | Price | Contents | Segment | Role |
|---|---|---|---|---|
| **Decoder** | **Free**, no card, no login | Reason-code identification, exact policy clause, plain-English diagnosis, POA outline, **first section of the real draft** | All | Lead magnet / Engineering as Marketing asset |
| **Rescue** | **$149 one-time** | Complete policy-cited POA in <10 min · Rejection-Risk Scorer · unlimited revisions · Evidence Kit · Reason Code Playbook · time guarantee · **30 days of Shield included** | S1 | Volume + entry |
| **Rescue + Human** | **$399 one-time** | Everything in Rescue · same-day review by an experienced appeal writer · 15-min strategy call · priority queue · Rejection Rescue second-round strategy | S2 | Margin |
| **Shield** | **$49/mo or $470/yr** | Daily account-health monitoring · risk alerts naming the specific policy at risk · warm pre-drafted POAs for your top 3 risk vectors · **one Rescue appeal included per year** · priority queue | S3 | Recurring |
| **Shield Pro** | **$149/mo** (+$25/mo per account beyond 10) | Shield across up to 10 seller accounts · unlimited Rescue drafts · human review at $199 · webhooks/API · shared case dashboard | S4 | Expansion + anchor |

**Price justifications, each traceable:**

- **$149 Rescue, deliberately above AppealDesk's $97 and at parity with AppealDraft's $149.** Per Ramanujam, do not discount into an undifferentiated position; per report 02's Dunford analysis, the whole positioning premise is a *different category* ("suspension-defense copilot"), which is void if we price as a cheaper AppealDesk. The $52 premium over AppealDesk is paid for by unlimited revisions, visible policy citations, the Evidence Kit, the time guarantee, and 30 days of Shield.
- **$399 Rescue+Human**, midpoint of the brief's $299–499, anchored directly against the **$1,250 consultant / $3,500 attorney** figures AppealDesk itself publishes — we get to use a competitor's own comparison table as our anchor. Also priced above ReinstateIQ's $350 to avoid a like-for-like comparison.
- **$49/mo Shield.** Monitoring-only is worth ~$20 (SellerSonar's entry). The included annual Rescue (a $149 leader) is what carries the price to $49. On the annual plan at $470, the monitoring component nets to roughly **$27/mo after the included appeal** — deliberately close to SellerSonar's $19.98–23.98 so the comparison is survivable, which is Ramanujam's bundling logic executed precisely.
- **$149/mo Shield Pro.** For an agency managing 10 accounts this is $14.90/account/month against a per-event alternative of $149–399. It also functions as the top-of-ladder anchor that makes $49 read as modest.

### 3.3 Free-tier design, against benchmark

Poyar's free-to-paid research (n=200 software products, respondents typically $1–10M ARR) reports: **median free-to-paid conversion of 8% across all products**; **free trials requiring a credit card convert at 30% — "more than 5x ones that don't require one"**; **57% of products use a free trial as the primary landing point vs. 26% freemium**; **14 days is the most common trial length (62%)** ([growthunhinged.com](https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion)).

**How this maps — and where it deliberately doesn't.** Reinstate's free tier is *not* a trial of a subscription; it is an instant diagnostic in front of a one-time emergency purchase, so the 8% median is used as the conservative anchor in §6 while acknowledging the buying context (a live emergency, not evaluation) should push conversion higher. Two benchmark-derived decisions:
- **Do not require a card for the Decoder.** The 30%-vs-6% card-gating finding is about *trials of a subscription*, where card capture front-loads commitment. Here, card-gating the diagnosis would gut top-of-funnel in the one channel (community) where trust is the entire currency. Card requirement belongs at the Rescue purchase, which is a paid transaction anyway.
- **Do require a card for Shield's 30 included days** — this is a genuine trial, the card is already on file from the Rescue purchase, and the 30% benchmark applies directly. This single design choice is why the Shield attach assumption in §6.2 is defensible.

### 3.4 The core monetization problem: WTP is event-shaped, revenue should be recurring

This is the central pricing tension and deserves naming explicitly. **Willingness-to-pay spikes at suspension and collapses immediately after reinstatement.** Three mechanisms exist to convert an event-driven purchase into recurring revenue:

- **M1 — Insurance bundling (subscribe now, covered later).** Riverbend PRO validates that this sells. **But it invites textbook adverse selection** (Akerlof 1970; Rothschild & Stiglitz 1976, *QJE*): sellers rationally subscribe *only* when already at risk, claim the included appeal, and cancel. Standard mitigations apply — a **30-day waiting period before appeal coverage activates**, and **not selling Shield to an already-suspended account except as a post-reinstatement offer**. Retained for S4 (agencies), where the risk pools across many accounts and selection is diluted.
- **M2 — Post-reinstatement conversion (RECOMMENDED PRIMARY).** Sell the transaction at the moment of panic; offer the subscription at the moment of relief. The rationale is the **peak-end rule** (Fredrickson & Kahneman 1993, *JPSP*; Kahneman, *Thinking, Fast and Slow*): retrospective evaluation of an affective episode is dominated by its peak and its ending, so a seller's memory of the ordeal — and their fear of recurrence — is most vivid immediately after resolution, not months later when the fear has decayed. Operationally this is Hormozi's tripwire-to-continuity structure: the 30 days of Shield are *included* with Rescue (zero incremental decision at the moment of purchase), the card is already on file, and the retention decision lands 30 days later when the seller has just lived through the alternative.
- **M3 — Cold-selling prevention to never-suspended sellers.** Hardest, and structurally disadvantaged: Amazon offers Account Health Assurance free to sellers above an Account Health Rating threshold, so the prevention pitch competes with a free first-party product for exactly the healthy sellers most able to pay. *(Program details could not be verified this session — see §8.)* **Deprioritise for 90 days.**

---

## 4. Channels — the Bullseye framework

### 4.1 All 19 *Traction* channels scored

Weinberg & Mares's Bullseye method: brainstorm all 19 channels (outer ring), pick 3–5 to test cheaply (middle ring), then focus on the one that works (inner ring). Scored 1–5 on five criteria fitted to this business; **"Uncrowdedness" is scored inversely** (5 = few competitors present).

| # | Channel | Reach at moment-of-need | Cost to test (5=cheap) | Time to 1st revenue (5=fast) | Uncrowdedness | Scale ceiling | **Total /25** | Ring |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| 10 | **Engineering as Marketing** | 5 | 4 | 4 | 4 | 5 | **22** | **INNER** |
| 19 | **Community Building** | 5 | 5 | 5 | 2 | 4 | **21** | **INNER** |
| 4 | **Search Engine Marketing** | 5 | 4 | 5 | 2 | 4 | **20** | **INNER** |
| 9 | Email Marketing | 3 | 5 | 2 | 4 | 4 | 18 | Middle |
| 11 | Targeting Blogs | 4 | 5 | 3 | 3 | 3 | 18 | Middle |
| 12 | Business Development | 4 | 3 | 2 | 4 | 5 | 18 | **Reserve #1** |
| 14 | Affiliate Programs | 4 | 4 | 3 | 3 | 4 | 18 | Middle |
| 5 | Social & Display Ads | 3 | 3 | 3 | 3 | 4 | 16 | Middle |
| 7 | Search Engine Optimization | 5 | 3 | 1 | 2 | 5 | 16 | Middle (build now, harvest later) |
| 8 | Content Marketing | 4 | 4 | 1 | 2 | 5 | 16 | Middle |
| 18 | Speaking Engagements | 3 | 4 | 2 | 4 | 3 | 16 | Middle |
| 3 | Unconventional PR | 2 | 4 | 2 | 4 | 3 | 15 | Outer |
| 15 | Existing Platforms | 3 | 2 | 2 | 4 | 4 | 15 | Outer |
| 1 | Viral Marketing | 2 | 4 | 2 | 3 | 3 | 14 | Outer |
| 13 | Sales | 3 | 2 | 3 | 4 | 2 | 14 | Outer |
| 16 | Trade Shows | 4 | 1 | 2 | 3 | 2 | 12 | Outer |
| 17 | Offline Events | 2 | 2 | 2 | 4 | 2 | 12 | Outer |
| 2 | Public Relations | 1 | 3 | 1 | 3 | 3 | 11 | Outer |
| 6 | Offline Ads | 1 | 1 | 1 | 4 | 2 | 9 | Outer |

**Notes on the notable scores:**
- **Community Building scores 5/5/5 on reach, cost and speed and only 2 on uncrowdedness** — every competitor in §1 is already fishing these waters (report 01 §7). It still ranks second overall because a "just got suspended" post is a *public, timestamped, individually addressable buying signal*, which almost no other business gets.
- **SEO scores 5 on reach and 1 on speed.** The reason-code corpus is a natural programmatic-SEO asset (one page per suspension reason code and per policy clause). Build it during the 90 days; expect harvest at month 6–9. reinstate.io's domain authority since 2019 makes this a long fight.
- **Sales scores 14 and is excluded on arithmetic:** human selling cannot be supported by a $149 transaction (§6.4's $118 max CAC). It becomes viable only for S4 at $149/mo+.
- **Existing Platforms (Amazon's Selling Partner Appstore, Chrome Web Store)** scores low on cost-to-test because of app-review latency, and carries **platform risk**: Amazon may be structurally unfriendly to appeal-related third-party apps. Flagged as a hypothesis in §8.

### 4.2 The inner three — test design, budget, kill criteria

Per *Traction*, each middle-ring test must be cheap, time-boxed and have a pre-committed decision criterion.

**Test A — Community Building (days 1–90, $0 cash)**
- *Surfaces:* Amazon Seller Central forums (Account Health category), r/AmazonSeller, r/FulfillmentByAmazon, r/AmazonSellerCentral, 5–8 Facebook seller groups, seller Discord/Slack communities.
- *Protocol:* answer 8–15 live "just got suspended" threads/day with a **genuinely complete free answer** — reason code identified, exact policy clause quoted, POA structure outlined. **No link in the reply.** Link lives in the profile/signature only.
- *Why no link:* **this is the single largest execution risk in the entire GTM plan.** Amazon's Seller Central forums prohibit solicitation; a ban removes the highest-scoring channel overnight. Mitigation: Seller Central is the *lowest*-priority surface and is used for reputation only; Reddit and Facebook groups (looser, moderator-dependent rules) carry the volume; every reply must stand alone as useful if the link is never clicked.
- *Kill criterion:* if 30 days of consistent posting yields <40 free-Decoder sessions attributable to community, demote to middle ring.

**Test B — Engineering as Marketing (days 1–90, ~$0 cash)**
- *Assets:* (i) the free **Notice Decoder**; (ii) a public **Suspension Reason Code Index** — one page per reason code with the policy clause, what Amazon actually asks for, and a "decode my notice" CTA. This is the canonical *Traction* pattern (HubSpot's Website Grader, Moz's free tools): the marketing asset *is* the product, at zero marginal cost, and it simultaneously seeds Test C's landing pages and the SEO build.
- *Kill criterion:* if free-Decoder → paid conversion sits below 4% after 100 completed sessions, the problem is the offer or the paywall placement, not the channel — fix the offer before touching spend.

**Test C — SEM (days 31–60, hard cap $1,500)**
- *Keywords:* "amazon account suspended what to do," "amazon plan of action template," "amazon appeal rejected," "walmart seller account deactivated," plus competitor-brand terms.
- **Run this test to learn CPC, not to buy customers.** §6.4 shows it is very likely unprofitable at launch AOV. Judge it on **blended revenue per click**, never on Rescue conversion alone.
- *Kill criterion:* kill at $1,500 spent unless blended revenue/click ≥ $0.60 (i.e. CAC ≤ ~$118 at measured funnel rates).

### 4.3 Reserve channel #1 — Business Development (seed day 1, revenue day 60+)

Excluded from the inner three only because partner cycles run 4–8 weeks, but it has the best long-run economics of any channel because **each partner aggregates many suspension events**:
- **Monitoring tools that don't draft appeals** — SellerSonar, Helium 10 Alerts. Report 02 §1.3 explicitly identifies these as partial substitutes that could be channel partners; they detect the problem and have no remedy to sell.
- **Agencies, VAs, prep centres, freight forwarders, aggregators** — they field the panicked call first and currently have nowhere good to send it.
- **The consultants and attorneys themselves** — two-way: they refer down-market cases they can't profitably serve; we refer up the six categories we honestly triage out (§2.2), earning referral fees on refusals.

### 4.4 Hormozi's Core Four ($100M Leads) mapped

Hormozi's Core Four: warm outreach (1-to-1, known), post free content (1-to-many, known), cold outreach (1-to-1, strangers), paid ads (1-to-many, strangers).

| Core Four engine | Reinstate implementation | Priority |
|---|---|---|
| **Post free content** | Community answers + Reason Code Index. **The primary engine.** | 1 |
| **Warm outreach** | Thin at t=0 (no list), but the free-Decoder non-buyers become a warm list within days — this is why email (§4.1, score 18) matters for monetization even though it scores low for acquisition. | 3 |
| **Cold outreach** | **The differentiated idea: a "suspension radar."** A suspended seller is *publicly observable* — the storefront goes dark and listings disappear. Detecting newly-unavailable storefronts yields a cold-outreach list with warm-level intent, reachable within hours of the event. It is also the technical seed of the Shield monitoring product, so the build serves two purposes. **Flagged as a hypothesis with material risk:** scraping feasibility, Amazon ToS, contact-data availability and CAN-SPAM/GDPR compliance are all unverified (§8). | 2 (validate before building) |
| **Paid ads** | SEM (Test C), capped. Facebook retargeting off the free Decoder is the cheaper second option. | 4 |

---

## 5. The first 10 paying customers — a 14-day playbook

**Governing principle:** per Paul Graham's "Do Things That Don't Scale" and Eric Ries's concierge MVP (*The Lean Startup*), **do not wait for the product.** Days 1–14 deliver drafts manually — founder plus an LLM plus the policy corpus — against a Stripe payment link. The product is built behind a motion that is already taking money, which is the fastest route to PLAN.md's "revenue in days" North Star and simultaneously produces the customer-development interviews Blank's *Four Steps to the Epiphany* requires and report 01 §8 flagged as missing.

**Days 1–3 — build the minimum sellable surface**
1. One landing page: headline, the AppealDesk-style anchor table ($3,500 attorney / $1,250 consultant / $149 us), the guarantee stack (§2.4), no signup.
2. A Stripe payment link at $149 and one at $399. Nothing else. No auth, no dashboard, no database.
3. A manual delivery runbook: intake form (paste notice + 4 questions) → retrieval over the policy corpus → draft → Rejection-Risk pass → deliver as PDF + editable doc within 60 minutes (**under-promise vs. the eventual 10-minute guarantee**).
4. The honest-triage refusal list (the six AppealDesk categories) written down before the first customer, so it is applied consistently rather than negotiated case-by-case under revenue pressure.

**Days 2–14 — the acquisition loop, run daily**
- **Morning (60–90 min):** sweep r/AmazonSeller, r/FulfillmentByAmazon, Facebook groups and Seller Central Account Health for new "suspended/deactivated" posts. Target 8–15 substantive replies/day.
- **The hook (reply template, no link):** identify the reason code from their pasted notice → quote the exact policy clause → state the *one* thing their POA must contain that most sellers get wrong for that specific code → offer: *"Happy to run your full notice through the reason-code index and send you back the POA structure — DM me, no charge."*
- **The conversion:** the free structure lands in DMs. The natural next line is *"want the complete submission-ready draft with the evidence checklist? $149, in your inbox within the hour, refund if it's late."* Per Hormozi, the free thing must solve a **complete narrow problem** (they now genuinely know what to write) while making the next problem obvious (they still have to write it, well, tonight, while losing $800/day).
- **The ask that matters more than the money:** every customer gets a 15-minute call. This is Blank-style customer discovery disguised as onboarding, and it is where the reason-code taxonomy, the Evidence Kit and the pricing get corrected by reality.

**Days 7–14 — instrument, then compound**
- Ship the free Notice Decoder (Test B) so the loop stops depending on founder DMs.
- Instrument the Sean Ellis PMF survey from the first customer, as report 01 §4 recommended — "how would you feel if you could no longer use this?", 40% "very disappointed" threshold.
- Post the first 3 anonymised outcomes back into the communities that produced them (with permission) — this is where Perceived Likelihood (§2.1, currently 3/10) starts climbing.

**Expected timing:** first sale in days 3–7; **10 paying customers by day 21–28** on the base case in §6. Target 10 by day 14 in the aggressive case, which requires either an unusually high-volume suspension week or one early partner.

---

## 6. The 90-day revenue ramp

### 6.1 Assumption register — every number, flagged

| # | Assumption | Value | Basis | Confidence |
|---|---|---|---|---|
| A1 | Free-Decoder → paid conversion | 8% M1 → 9% M2 → 10% M3 | Poyar 2026 median free-to-paid = **8%** (n=200). Held flat rather than raised despite emergency-purchase intent, as a conservatism buffer. | **Medium-low — the single largest swing factor** |
| A2 | Community output | 8–15 replies/day; 10–20% of helped sellers reach the Decoder | No published benchmark exists. Founder-capacity estimate. | **Low — hypothesis** |
| A3 | SEM CPC | $10 (range $6–15) | **Unverified.** Keyword data could not be pulled this session. Inferred from the competitive set: attorneys/consultants with $1,250–3,500 ACVs bid these terms. | **Low — must be measured in week 1 of Test C** |
| A4 | Price/mix | $149 / $399 / $49-mo; mix 80/20 M1–M2 → 75/25 M3 | §3.2; mix shifts to human tier as social proof accumulates | Medium |
| A5 | Shield attach | 35% accept the included 30 days; 40% retain past day 30 → **14% net** | Poyar: card-on-file trials convert at **30%**; Shield is post-value, post-relief, card already captured (§3.3), so 40% is aggressive-but-defensible against that 30% base | **Medium-low** |
| A6 | Shield monthly churn | 6% | Prosumer/SMB SaaS typical 3–7%/mo. **No source specific to this category.** | Low — hypothesis |
| A7 | Repeat transactional purchase | 1.4× over 24 months | Report 01 §3: **1.6 suspension events/year among affected sellers**, discounted for leakage to competitors and self-service | Medium |
| A8 | Guarantee/refund cost | 8% of Rescue revenue | Judgment. Honest triage (§2.2) is the control. | Low |
| A9 | COGS | ~$1–3/draft inference; ~$60–90 human review per $399 case | Contractor rate estimate | Medium |

### 6.2 Base case

| | **Month 1** (d1–30) | **Month 2** (d31–60) | **Month 3** (d61–90) |
|---|---|---|---|
| Channels live | Community, Eng-as-Marketing | + SEM test, BD seeding | + affiliate, 1–2 BD partners |
| Free Decoder sessions | 120 | 345 (300 community + 45 SEM) | 650 (450 community, 60 SEM, 90 partner/affiliate, 50 direct) |
| Conversion (A1) | 8% | 9% | 10% |
| **Paying customers** | **10** | **31** | **65** |
| Blended AOV (A4) | $199 | $199 | $211 |
| Transactional revenue | **$1,990** | **$6,169** | **$13,748** |
| Shield subscribers (net, A5/A6) | 0 (all in 30-day included period) | 1.4 | 5.5 + 1 Shield Pro |
| **Shield MRR** | **$0** | **$69** | **$419** |
| **Total revenue** | **$1,990** | **$6,238** | **$14,167** |
| Ad spend | $0 | $1,500 | $1,500 (conditional on Test C clearing its kill criterion) |

**90-day totals: ~106 paying customers, ~$22,400 cumulative revenue, exiting at ~$14.2k/month transactional + ~$420 MRR.**

**Milestone:** the 10th paying customer lands **day 21–28**.

### 6.3 Scenarios

| Scenario | Driver | 90-day revenue | Customers | Exit MRR |
|---|---|---|---|---|
| **Conservative (0.5×)** | Community reply→Decoder rate half of A2; conversion stalls at 6%; forum moderation friction | **~$11,200** | ~53 | ~$210 |
| **Base** | As modelled above | **~$22,400** | ~106 | ~$420 |
| **Aggressive (2×)** | Forum reputation compounds; one BD partner (a monitoring tool or agency) lands by day 45; human-tier mix reaches 30% | **~$44,800** | ~212 | ~$840 |

**In all three scenarios the business exits day 90 as a transactional business.** Subscription is 1.9–3.0% of month-3 revenue. This is the correct expectation to set, not a failure of the plan.

### 6.4 Unit economics — and why SEM cannot be the engine

**LTV build (base case):**
- Transactional: $199 AOV × 1.4 purchases over 24 months (A7) = **$279**
- Subscription: 14% net attach (A5) × $49/mo × ~16.7-month life at 6% churn (A6) = 0.14 × $818 = **$115**
- **Gross LTV ≈ $394.** At ~90% blended gross margin (A9 — ~95% on Rescue, ~78% on the human tier), **contribution LTV ≈ $355.**
- **Maximum sustainable CAC at 3:1 LTV:CAC ≈ $118.**

**Channel CAC against that ceiling:**

| Channel | Modelled CAC | vs. $118 ceiling | Verdict |
|---|---|---|---|
| Community Building | ~$0 cash (founder time) | ✅ | Engine |
| Engineering as Marketing | ~$0 marginal | ✅ | Engine |
| **SEM** | **~$375** ($10 CPC ÷ (30% click→Decoder × 8% Decoder→paid)) | ❌ **3.2× over** | **Capped learning test only** |
| BD / affiliate | ~$40–60 (rev-share) | ✅ | Reserve, best economics at scale |

**The three ways SEM could become viable, all of which must be *measured*, not assumed:**
1. Actual CPC lands at $4–5 rather than the $10 hypothesis (A3 is genuinely uncertain) → CAC ~$150–190, still over ceiling but within reach of the other two levers.
2. Blended AOV rises to ~$350 via a 40%+ human-tier mix → LTV ~$650, ceiling ~$215.
3. Shield attach reaches 25–30% net → adds ~$130 of LTV.

**All three together** would take the ceiling to roughly $300 and make SEM marginally viable. **None of them is true on day one**, which is why the plan spends the first 30 days on channels with no cash CAC at all. This is the plan's most important operating constraint and the reason the Bullseye inner ring is ordered as it is.

---

## 7. What would make this plan wrong

1. **Forum bans.** Community is the #2-scored channel and the entire path to the first 10 customers. Amazon Seller Central forums prohibit solicitation; Reddit and Facebook moderation is unpredictable. Mitigation in §4.2 (no links in replies, Reddit/FB carry volume, every reply standalone-useful) reduces but does not remove this risk. **Highest-severity execution risk in the plan.**
2. **A1 conversion is wrong by 2×.** Everything in §6 is a function of it. It is measurable within 100 Decoder sessions — measure it before spending anything.
3. **The guarantee attracts unwinnable cases.** Adverse selection (Akerlof 1970) is the standing risk of any refund-on-rejection offer. Honest triage is the control, and it must be enforced before payment, not after.
4. **AppealDesk or AppealDraft adds a human-review tier.** This collapses the core differentiation identified in report 02. The durable answer is not the tier itself but the outcome-feedback loop behind it (Helmer's Process Power, report 02 §3) — which argues for instrumenting appeal outcomes from customer #1.
5. **Amazon platform action.** The "March 2026 Agent Policy" referenced in AppealDraft's marketing (report 01 §2.3) is unverified and could restrict third-party appeal assistance. **Legal diligence required before launch.** Amazon could also expand Account Health Assurance and compress the prevention market from above.
6. **The name.** reinstate.io has held the name and its SEO since 2019 (report 01 §6.5). Both SEM and community channels are degraded until Phase 2b resolves this.

---

## 8. Research gaps (unverified — do not treat as findings)

- **SEM keyword CPCs** (A3) — no keyword-planner data obtained. The most consequential unmeasured number in the plan.
- **Community sizing** — Reddit is unfetchable from this environment; subreddit subscriber counts and Facebook group sizes are unquantified, so A2 rests on no external anchor.
- **Amazon Account Health Assurance** — official pages returned 404; eligibility, cost and coverage unconfirmed. Material to the §3.4-M3 conclusion.
- **"Amazon March 2026 Agent Policy"** — sourced only from a competitor's marketing copy.
- **Riverbend PRO / Guardian pricing** — phone-gated; the insurance-bundle price point that most directly validates Shield remains unknown.
- **Suspension-radar feasibility** (§4.4) — storefront-deactivation detectability, ToS position and contact-data availability all unverified.
- **A5, A6, A8** have no category-specific published basis and are explicitly hypotheses.

---

## 9. Recommendations

1. **Ship the manual concierge motion in 3 days, not the product.** Stripe link + landing page + runbook. Graham; Ries.
2. **Run the Bullseye inner three in the stated order:** Community + Engineering-as-Marketing from day 1 at $0; SEM as a capped $1,500 *measurement* from day 31 only.
3. **Price at $149 / $399 / $49-mo / $149-mo.** Reject the instinct to undercut AppealDesk's $97 — that is Ramanujam's minivation.
4. **Include 30 days of Shield with every Rescue, card on file.** This is the only mechanism that produces subscription revenue without adding friction at the moment of panic (peak-end rule; Poyar's 30% card-on-file benchmark).
5. **Out-guarantee the market on time, match it on revisions**, and A/B the full refund with honest triage as the control.
6. **Spend the offer budget on Perceived Likelihood** — visible policy citations, published methodology, honest refusals — not on shaving seconds off a draft time that already wins.
7. **Seed Business Development from day 1** even though it pays out after day 60; it is the only reserve channel with both headroom and CAC inside the $118 ceiling.
8. **Measure A1 and A3 before any scaling decision.** The entire model is a function of two numbers that can be known within 30 days for under $2,000.

---

## Sources

**Primary (fetched this session):**
- [riverbendconsulting.com](https://riverbendconsulting.com/) — service lines, Riverbend PRO / Guardian plan structure, "400+ Appeals Serviced Monthly," "10,000+ Sellers," 4.6★/336 Google reviews
- [getappealdesk.com](https://getappealdesk.com) — $97 flat one-time; "Under 5 minutes"; comparison table (Attorney $3,500 / Consultant $1,250 / AppealDesk $97); the six refused case categories; "Honest triage"
- [appealdraft.org](https://www.appealdraft.org) — "$149 flat"; "Full refund if Amazon rejects"; "Drafted in 10 minutes"; 15-minute intake call; "no automation or account access"; "Human consultants charge $500 to $2,500 per appeal"
- [platformappeal.com/help](https://www.platformappeal.com/help) — free violation classification; Pro tier with unlimited revision rounds; pricing not published
- [reinstate.io](https://reinstate.io/) — "500+ reinstatements with an 85% success rate on first appeal," 92% on escalation; 24–72h response; 11 platforms; "Money-back Guarantee… No outcome guarantees"
- [sellersonar.com/pricing](https://sellersonar.com/pricing) — Pro $19.98–23.98/mo, Premium $39.98–47.98/mo, Business $74.98–89.98/mo; $5 14-day paid trial
- [growthunhinged.com — The state of B2B monetization in 2026](https://www.growthunhinged.com/p/the-state-of-b2b-monetization-in-2026) — Kyle Poyar, n=230 B2B software/AI companies (Apr–May 2026): hybrid pricing 25%→37%; flat-fee 37% among <$5M ARR; AI gross-margin median target 50%; three-in-four companies changed pricing/packaging in the last year
- [growthunhinged.com — What's working to improve free-to-paid conversion](https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion) — Kyle Poyar, n=200 products: median free-to-paid 8%; card-required trials 30% ("more than 5x"); 57% free trial vs 26% freemium; 14-day trial most common (62%)

**Carried forward from sibling reports in this repo:**
- `phase-1-ideation/research/01-demand-pmf.md` — price ladder, ~2M active sellers, 22–35% suspension incidence, 1.6 events/year, $800/day loss datapoint, reinstate.io naming collision, "Amazon March 2026 Agent Policy" reference
- `phase-1-ideation/research/02-competition-positioning.md` — full competitive pricing tables (SellerCandy $997–2,500/mo; Appeal Guru $495/$1,495/$2,495 and $179.95–309.95/yr monitoring; Helium 10 tiers), Dunford positioning canvas, Helmer 7 Powers audit, Christensen disruption test

**Frameworks applied:**
- Alex Hormozi, *$100M Offers* — value equation (§2.1), Grand Slam Offer checklist and trim-and-stack (§2.3), guarantee taxonomy (§2.4), MAGIC naming; *$100M Leads* — Core Four (§4.4), lead magnet design (§3.1), tripwire-to-continuity (§3.4)
- Gabriel Weinberg & Justin Mares, *Traction* — Bullseye framework, all 19 channels scored (§4.1), cheap time-boxed middle-ring tests with kill criteria (§4.2)
- Madhavan Ramanujam, *Monetizing Innovation* — WTP-first (§3.1), four failure modes / minivation risk, need-based segmentation, leaders-fillers-killers packaging, bundling to raise WTP, behavioural anchoring and decoy pricing (§3.2)
- Kyle Poyar / OpenView SaaS pricing & PLG research — benchmarks throughout §3.3, §6.1
- Geoffrey Moore, *Crossing the Chasm* — beachhead selection, S1 over S4 (§3.1)
- April Dunford, *Obviously Awesome* — positioning inputs carried from report 02
- Paul Graham, "Do Things That Don't Scale"; Eric Ries, *The Lean Startup* — concierge MVP (§5)
- Steve Blank, *The Four Steps to the Epiphany* — customer discovery embedded in onboarding calls (§5)
- Rob Fitzpatrick, *The Mom Test* — revealed vs. stated WTP (§3.1); vendor self-reports discounted
- Sean Ellis PMF survey (40% rule) — instrumented from customer #1 (§5)
- Marc Andreessen, "The Only Thing That Matters" — market pull as the channel-selection premise (§4.1)
- Hamilton Helmer, *7 Powers* — Process Power as the reason to instrument outcomes from day one (§7)
- Clayton Christensen — JTBD framing of the dream outcome (§2.1)
- Lewis et al. 2020, "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS — retrieval grounding as the Perceived Likelihood lever (§2.2)
- George Akerlof 1970, "The Market for 'Lemons'," *Quarterly Journal of Economics*; Rothschild & Stiglitz 1976, *QJE* — adverse selection in the guarantee and insurance-bundle designs (§2.4, §3.4)
- Fredrickson & Kahneman 1993, "Duration neglect in retrospective evaluations of affective episodes," *Journal of Personality and Social Psychology*; Kahneman, *Thinking, Fast and Slow* — peak-end rule as the basis for post-reinstatement subscription sequencing (§3.4)
