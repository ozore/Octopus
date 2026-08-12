# IDEA DOSSIER — "Reinstate" (working codename)

**Marketplace Suspension Defense Copilot — Amazon & Walmart 3P sellers**

**Status:** Phase 1 winner, selected by a 24-persona ideation fleet and 12 judging lenses (Borda tally in §11).
**Phase-1 verdict across all four deep dives:** **GO_WITH_CHANGES** (unanimous — 01, 02, 03, 04).
**Date:** 2026-08-12
**Owner:** Chief of Staff, autonomous company factory
**Drives:** Phase 2 build. This document is the single source of truth. Where it conflicts with the original one-line pitch, **this document wins** — three of the four research reports found specific errors in the pitch, and they are corrected here rather than carried forward.

**Source reports (read in full, treated as inputs, not re-derived):**
- `/home/user/Octopus/phase-1-ideation/research/01-demand-pmf.md` — demand & PMF
- `/home/user/Octopus/phase-1-ideation/research/02-competition-positioning.md` — competition & positioning
- `/home/user/Octopus/phase-1-ideation/research/03-gtm-pricing.md` — GTM, offer, pricing, 90-day ramp
- `/home/user/Octopus/phase-1-ideation/research/04-mvp-scope.md` — MVP scope, knowledge base, legal, build plan

---

## 0. Executive decision summary — the ten decisions that matter

Everything below is elaboration. These are the calls.

| # | Decision | Rationale (framework + source) |
|---|---|---|
| **D1** | **Build it.** Demand is validated by money already changing hands, not stated interest. | Fitzpatrick's *Mom Test* evidence standard: Riverbend Consulting services **400+ appeals/month** to **10,000+ sellers** ([riverbendconsulting.com](https://riverbendconsulting.com/)); five-plus AI-native competitors already transact at $97–$350 (report 01 §2.3). |
| **D2** | **Rename before writing a line of code.** "Reinstate" is unusable. | reinstate.io has traded since 2019 (500+ cases, 4.9★/500+ reviews) and "ReinstateIQ" is live (report 01 §2.3, §6.5). Dunford's *Obviously Awesome* Step 6 — you cannot own a category under a competitor's name. See §12 for the recommended name set. |
| **D3** | **Position as a *Suspension Defense Copilot*, not an "AI POA generator."** | Dunford Step 6: the default category comparison is unfavourable — AppealDesk already owns "cheap and fast AI POA" at **$97 flat** (report 02 §1.1). Reposition into a category defined by the bundle: cited drafting + human escalation + monitoring loop. |
| **D4** | **Price at $149 / $399 / $49-mo / $149-mo — deliberately ABOVE the $97 incumbent.** | Ramanujam's *Monetizing Innovation*: undercutting an undifferentiated incumbent is the classic **"minivation."** Also confounds the experiment — we would not know whether conversion came from the differentiator or the discount (report 04 §2.3). |
| **D5** | **Transactional first, subscription second.** Reject "subscription-first from day one." | Willingness-to-pay is **event-shaped**: it spikes at suspension and collapses at reinstatement. All three 90-day scenarios exit with subscription at **1.9–3.0% of month-3 revenue** (report 03 §6.3). A plan sold as subscription-first is a forecast that will miss. |
| **D6** | **Include 30 days of monitoring free with every appeal, card on file.** | The only mechanism that produces recurring revenue without adding friction at the moment of panic. Grounded in the **peak-end rule** (Fredrickson & Kahneman 1993, *JPSP*) and Poyar/OpenView's finding that card-on-file trials convert at **30%** vs. ~6% without. |
| **D7** | **Spend the entire offer budget on Perceived Likelihood of Achievement.** | Hormozi's value equation: three of four terms already score 8–9 (Dream Outcome, Time Delay, Effort & Sacrifice); Perceived Likelihood scores **3/10** and is the binding constraint (report 03 §2.1). Optimising draft speed from 10 minutes to 4 is optimising a term already at 9. |
| **D8** | **Community + Engineering-as-Marketing are the entire path to the first 10 customers, at ~$0 cash.** Paid search is a capped measurement test, never the engine. | Bullseye scoring of all 19 *Traction* channels (Weinberg & Mares): Engineering as Marketing 22/25, Community 21/25 (report 03 §4.1). **Arithmetic kill shot:** contribution LTV ≈ **$355** → max sustainable CAC ≈ **$118** at 3:1; modelled SEM CAC ≈ **$375**, 3.2× over ceiling (report 03 §6.4). |
| **D9** | **Build a workflow, not an agent. No vector DB, no fine-tuning, no SP-API in v1.** | Anthropic's *Building Effective Agents*: workflows use predefined code paths; "find the simplest solution possible." This is classify → retrieve → draft → critique — three named workflow patterns (routing, prompt chaining, evaluator-optimizer). SP-API's `ACCOUNT_STATUS_CHANGED` is the right primitive but requires a *public* app (Appstore listing, Solution Provider Agreement, Data Protection Policy review) — weeks of compliance for zero learning (report 04 §3 N1). |
| **D10** | **If the build slips, cut anything before cutting the consented outcome corpus.** | It is the **only** v1 component whose value compounds, and per Helmer's *7 Powers* it is the difference between a fifth me-too POA generator and real **Process Power** (report 02 §3, report 04 §8). |

---

## 1. The idea

### 1.1 One-liner (revised)

> **Paste your Amazon or Walmart deactivation notice. In under ten minutes you get a submission-ready Plan of Action that cites the exact policy clause you were charged under — with a human appeal writer one click away if your case needs judgment.**

The revision from the original pitch is deliberate. The original led with "drafted from the policies and appeal patterns that actually get sellers reinstated" — a claim about a proprietary corpus that **does not yet exist** and is smaller on day one than at least two competitors' datasets (report 02 §3). Per Fitzpatrick's *Mom Test* discipline applied inward, we do not market an asset we do not hold. We lead with what is verifiable in the product itself: the visible citation and the human backstop.

### 1.2 The job to be done

Per Christensen's Jobs-to-be-Done framing, the buyer is not hiring a document. The circumstance is: *my account went dark this morning, I am losing money every hour, I get very few shots at this appeal, and I have no idea what Amazon actually wants me to write.* The job hired for is **"get me back online without burning my one good attempt."**

This matters for scope. The judge panel's `simplicity` lens ranked this idea **#1 of 8** precisely because there is one buyer, one trigger and one job, with no bundling (see §11). Every feature proposal in Phase 2 must be tested against that single sentence.

### 1.3 The dream outcome is monetary and the customer computes it themselves

An AppealDesk tester reported losing **$800/day** while suspended (report 01 §3). This is the single most important number in the offer. Per Hormozi's *$100M Offers*, the Dream Outcome term scores 9/10 here because a seven-day-faster reinstatement is **$5,600 recovered** — arithmetic the buyer performs unprompted. **Sell the recovered cash flow, not the document.** The free tool should display a factual "days suspended × your daily revenue = $X lost so far" counter (Hormozi warns against *manufactured* urgency; this urgency is real and external, so display it and never invent a countdown).

---

## 2. Why now

Four forcing conditions, in descending order of confidence:

1. **The retrieval architecture is commercially proven in this exact niche, not merely theoretically sound.** Lewis et al. 2020 (NeurIPS) established that retrieval-augmented generation "generate[s] more specific, diverse and factual language than a state-of-the-art parametric-only seq2seq baseline." A live case study ("Appeal Wizard" / ReinstateIQ) reports **2,000+ appeals generated at a claimed 87% reinstatement rate** using RAG over a library of successful appeals (report 01 §2.3). The architecture risk is retired; only the execution and differentiation risk remain.

2. **Inference economics now permit a $149 product with ~95% gross margin.** With Anthropic prompt caching at **0.1× base input cost** (a 1-hour TTL available at 2× write), a corpus of a few hundred curated records sits in a cached prompt and marginal cost per draft is **cents** (report 04 §5.8, N5). Three years ago this product needed a vector database and an ML team; today it needs a prompt chain. This is also why no fine-tuning is warranted — per Karpathy's *Software 2.0*, the dataset is the artifact, but it does not follow that the dataset must be compiled into weights.

3. **Grounded, cited AI output is the current trust frontier.** Per Dunford's Step 8 (layer a trend onto positioning), the applicable trend is buyer preference for cited, verifiable AI over black-box completion. Anthropic's Citations API returns `cited_text` with source locations, making "cites the exact policy clause" an *enforceable code-level invariant* rather than a marketing adjective — and every competitor already claims "AI-powered," so that claim is worthless (report 02 §2 Step 8).

4. **The market is being productized right now by others.** This is a "why now" *and* a clock. Five-plus AI-native entrants exist (report 01 §2.3). Per Andreessen's "The Only Thing That Matters," visible daily market pull is the signal — but here the market is pulling product out of *several* startups simultaneously, which confirms pull and dilutes any one entrant's capture rate. **The window is measured in months, not years.**

---

## 3. PMF evidence

### 3.1 Mom Test standard: money already changing hands

Per Fitzpatrick's *The Mom Test*, the only admissible evidence is past behaviour and committed money — not stated intent. Applying that filter (report 01 §2):

| Player | Evidence of real, sustained revenue | Source |
|---|---|---|
| **Riverbend Consulting** | "Trusted by 10,000+ Sellers"; **400+ appeals serviced monthly** (≈4,800/yr); two paid subscription tiers (PRO — full appeal handling while enrolled; GUARDIAN — daily monitoring); 4.6★/336 Google reviews | [riverbendconsulting.com](https://riverbendconsulting.com/) |
| **reinstate.io** | Trading since 2019; 500+ cases across Amazon/eBay/Walmart/Etsy; 4.9★ from 500+ sellers; self-reported 85% first-appeal success | [reinstate.io](https://reinstate.io/) |
| **Amazon Sellers Lawyer** (Rosenbaum Famularo PC) | Law firm built specifically around suspension appeals and POA drafting; "thousands of successful reinstatements" | [amazonsellerslawyer.com](https://amazonsellerslawyer.com/) |
| **SellerCandy** | Published retainer tiers **$997 / $1,197 / $1,500 / $2,500 per month** | [sellercandy.com](https://sellercandy.com/amazon-suspension-appeal-service) |
| **The Appeal Guru** | **$1,495 (72-hr) / $2,495 (24-hr) / $495 DIY**, plus $179.95–309.95/yr monitoring | [theappealguru.com](https://theappealguru.com) |
| **AppealDesk** | **$97 flat**, AI-generated POA, published comparison table (Attorney $3,500 / Consultant $1,250 / AppealDesk $97) | [getappealdesk.com](https://getappealdesk.com) |
| **AppealDraft** | **$149 flat**, full refund if Amazon rejects; independently corroborates the human-consultant band at **"$500 to $2,500 per appeal"** | [appealdraft.org](https://www.appealdraft.org) |

**Reading:** this is the strongest form of Mom Test evidence — sustained repeat commercial transactions across at least seven independent vendors and three distinct price tiers. Competitors collecting real revenue for a near-identical product is *better* demand evidence than any survey we could run.

### 3.2 Steve Blank's customer-discovery gates — all five pass

Per *The Four Steps to the Epiphany*, the customer-discovery phase asks whether the problem exists, whether customers actively seek solutions, and whether they already spend against it (report 01 §5):

| Blank gate | Evidence | Verdict |
|---|---|---|
| Problem exists at scale? | 22–35% of ~2M active sellers suspended at least once; ~1.6 events/yr among affected sellers | **Pass** |
| Customers actively seek solutions? | Riverbend fields 400+/mo; reinstate.io 500+ cases; solo freelancers have built practices around it | **Pass** |
| Already paying, how much? | A real ladder: $49 → $97 → $149 → $350 → $495 → $1,000+ → $1,495–2,495 → $3,500 | **Pass — wide enough to segment** |
| Is the alternative visibly worse? | Suspension = total revenue stoppage; $800/day cited; official channels slow and low-context | **Pass** |
| Reachable through a known channel? | Seller Central forums, seller subreddits, Facebook groups — competitors already fish these waters | **Pass** |

### 3.3 Sean Ellis's 40% test — explicitly NOT yet run

Sean Ellis's PMF survey ("How would you feel if you could no longer use this product?", ≥40% "very disappointed") **cannot be run on a product that does not exist.** Report 01 §4 flags this as the single largest evidentiary gap and it is repeated here without softening.

**Proxy indicators only (leading, not proof):** Riverbend 4.6★/336 reviews; reinstate.io 4.9★/500+; and — most relevantly to our subscription thesis — Riverbend's GUARDIAN/PRO tiers prove *some* share of this ICP pays recurring rather than one-off.

**Committed action:** instrument the Ellis survey from customer #1 and run it formally once ≥40 paying customers exist (report 03 §5; report 04 §6). Also adopt Vohra's Superhuman PMF engine discipline — segment the "very disappointed" cohort and build for them specifically rather than averaging across all respondents. **Honest caveat:** the `churn-retention` judge lens ranked this idea **last of eight**, on the grounds that "get reinstated, then cancel" is the archetypal one-off JTBD. Ellis's test may well come in below 40% on the transactional product and above it on the monitoring product. That is a finding we should *want*, not fear — see §6.4.

### 3.4 What is NOT validated (adversarial pass)

Stated plainly, per report 01 §6:

1. **No primary customer discovery has been run.** Everything above is secondary/observational. This report validates *the category*, not *our differentiated pull*.
2. **Every published success rate (85–93%) is unaudited vendor marketing** — exactly what Fitzpatrick warns to discount. Amazon publishes no reinstatement data.
3. **Riverbend's "63.3% of sellers fear suspension most" is Riverbend's own content**, produced by a company selling the cure. Discount it; the external SmartScout/Entresource incidence figures stand independently.
4. **The 22–35% incidence range is wide** across differing methodologies. Treat as a directional band.
5. **Competitive intensity is the real surprise**, not weak demand. This is not a hidden pocket of pain; it is a market others have already begun productizing with the same architecture.

---

## 4. ICP and market

### 4.1 The beachhead (Moore)

Per Moore's *Crossing the Chasm* beachhead discipline, v1 serves **exactly one persona**:

> **First-time-suspended, sub-$2M-GMV Amazon 3P sellers with an account-level deactivation, who cannot justify a $1,000+ consultant or a $997/mo retainer but are too anxious to trust a $0 forum answer or a faceless $49 template mill.**

This segment is chosen because the trigger event is **public, timestamped and daily** in the forums — which is precisely what makes the first ten customers reachable in under a month (report 03 §3.1). Walmart follows in v1.1 because Walmart Marketplace Learn's appeal guides are short, fully public and already fetched (report 04 §4.2).

### 4.2 Segmentation by need and WTP (Ramanujam's Rule 2 — never by demographics)

| Segment | Definition | Need | Observed/inferred WTP | Role |
|---|---|---|---|---|
| **S1 "Panicked Solo"** | First suspension, <$500k GMV | Speed + reassurance | **$97–199** (AppealDesk/AppealDraft transact here) | **Beachhead** |
| **S2 "Bleeding Mid-Market"** | $1M–10M GMV, losing $1k–10k/day | Certainty, a human, a throat to choke | **$400–2,500** | Primary margin pool |
| **S3 "Chronic"** | Prior suspensions, recurring ODR/policy issues | Prevention | **$49–149/mo** | Subscription core |
| **S4 "Managers"** | Agencies, aggregators, VAs, prep centres | Multi-account workflow | **$149–999/mo** | **Channel, not beachhead** |

S4 is explicitly *not* a beachhead — but it is the highest-value reserve **channel**, because one agency aggregates dozens of suspension events (report 03 §3.1, §4.3).

### 4.3 Market sizing (Graham's "well," not a TAM slide)

- ~**1.9–2.0M active** Amazon 3P sellers globally (of 9.7M registered) — SellerApp.
- **22–35%** experience at least one suspension (SmartScout "Voice of the Amazon Seller 2025": 35%; Entresource: 22%).
- **~1.6 suspension events/year** among affected sellers (eCommerce Nurse, via aggregated analysis) — **this figure carries the entire LTV model**, because it means the transactional product has genuine repeat-purchase behaviour.
- **44.3%** of Amazon sellers also sell on Walmart (Riverbend survey) — the Amazon+Walmart framing captures one overlapping population, not two disjoint niches.
- Implied: **on the order of 500,000–800,000 suspension events per year.** Riverbend, the largest named incumbent, captures ~4,800 — **well under 1%**. This is a fragmented market, which is a positive signal for a new entrant, tempered by §5's finding that several AI entrants are chasing the same white space.

Per Graham's well metaphor (deep narrow demand beats shallow broad demand), this qualifies: the pain is acute, recurring, monetized, and the sufferers self-identify publicly.

---

## 5. Competition and positioning

### 5.1 The landscape (full table in report 02 §1)

**Direct AI-native competitors — the core mechanic is already shipped and priced below our tier:**

| Company | Offer | Price |
|---|---|---|
| **AppealDesk** | AI POA in Amazon's exact format, live quality scoring, branded PDF, **honest triage that refuses six unwinnable categories** (IP, counterfeit, linked accounts, fraud, Section 3 abuse, GPSR) | **$97 flat, one-time** |
| **AppealDraft** | AI POA, **full refund if Amazon rejects**, "no automation or account access," 15-min mandatory intake call | **$149 flat** |
| **AppealAI** | Fuller SaaS: ASIN Auditor, Violation Decoder, root-cause analysis, SOC 2 claims | Demo-gated |
| **PlatformAppeal** | **Free violation classification** + paid Pro with unlimited revision rounds | Undisclosed |
| **planofactiontemplate.com** | Custom POA generator | **$49** |
| **ReinstateIQ / "Appeal Wizard"** | RAG over 46 successful appeal templates; 2,000+ appeals claimed | **$350/appeal** |

**Human incumbents:** Riverbend (gated pricing), eCommerceChris, Amazon Sellers Lawyer, SellerCandy ($997–2,500/mo), The Appeal Guru ($495/$1,495/$2,495), Seller Interactive.

**Substitutes that matter more than they look:** doing nothing / a blank Google Doc at 2am ($0); free forum crowdsourcing ($0 — *simultaneously our lead-gen surface and our lowest-cost competitor*); free template libraries; Fiverr/Upwork freelancers (est. $50–300, unverified); monitoring-only SaaS (SellerSonar **$19.98–89.98/mo**, Helium 10 Alerts bundled at $99–1,499+/mo).

### 5.2 The three uncomfortable findings

1. **"Paste notice → AI draft" is not a blue ocean.** AppealDesk ships it at $97 — *below* our planned rush tier. Report 02 §1.1 calls this the single most important finding of the competitive research.
2. **Our guarantee currently enters BEHIND the market.** AppealDraft already offers a full refund on rejection; PlatformAppeal already offers unlimited revisions. Per Hormozi, the guarantee is typically the largest single conversion lever — and we would arrive second (report 03 §2.4).
3. **The claimed moat is not a moat.** Per Helmer's *7 Powers*, a **Cornered Resource** must be scarce *and* exclusively accessible. Our corpus does not exist yet and starts smaller than Riverbend's 10,000-seller history and AppealDesk's live-scored appeal database. **Downgrade "proprietary corpus" from moat to roadmap item.**

### 5.3 Positioning statement (Dunford's canvas)

> **For first-time-suspended Amazon and Walmart sellers who cannot justify a $1,000+ consultant retainer, [NAME] is a suspension-defense copilot that drafts a policy-cited, submission-ready Plan of Action in minutes and escalates to human review only when the case needs judgment — unlike AppealDesk's AI-only triage-and-refuse model or Riverbend/SellerCandy's slow, expensive, fully-human retainers, [NAME] pairs machine speed with human backup at a tenth of the incumbent price.**

Per Dunford's Step 6, we deliberately **exit** the "AI POA generator" category (where AppealDesk owns cheap-and-fast) and define **"Suspension Defense Copilot"** — a category constituted by four things no single competitor bundles today (Step 3):

1. Retrieval-grounded drafting that **cites the exact policy clause** (Lewis et al. 2020);
2. **Human rush escalation** for exactly the cases AppealDesk triages *away*;
3. A **monitoring subscription that feeds back into drafting** (no monitoring tool drafts; no drafting tool monitors);
4. **Community-embedded acquisition** at the moment of panic (Weinberg & Mares' Bullseye community channel).

### 5.4 The one-sentence pitch that wins against each alternative (Dunford Step 7)

| Alternative | Winning pitch |
|---|---|
| Blank document at 2am | "You have one shot and no idea what Amazon's investigators actually want — we read your exact notice and draft a policy-cited POA in minutes." |
| Free forum answers | "A stranger's reply was written for a different suspension reason than yours — we read your notice's exact language and reason code." |
| Free template libraries | "A static template doesn't know which appeal patterns were approved this month; we're grounded in a live corpus, not a PDF from 2023." |
| Fiverr/Upwork freelancers | "Skip the turnaround lottery — a draft in minutes, plus a $399 rush human review from someone who's seen this reason code before." |
| **AppealDesk ($97, refuses hard cases)** | "AppealDesk walks away the moment your case gets hard; we back every draft with human review, so the cases that need judgment still get it." |
| AppealAI (gated pricing) | "No demo calls, no gated pricing — paste your notice and see your draft before you pay anything." |
| Riverbend / eCommerceChris / attorneys | "Why wait days and pay four figures when you can have a submission-ready draft in minutes, with human review same-day for a fraction of the retainer?" |
| SellerCandy / Appeal Guru retainers | "You're not suspended every month — stop paying $1,500/mo for a problem that happens twice a year." |
| SellerSonar / Helium 10 Alerts | "Alerts tell you something broke; we're the only monitoring subscription that also drafts your way back in the moment it does." |

### 5.5 Moat — the honest 7 Powers audit

| Power (Helmer) | Status | Note |
|---|---|---|
| **Cornered Resource** | ❌ **Claimed but not held** | Corpus doesn't exist; two competitors hold larger datasets today. Roadmap item. |
| **Process Power** | 🟡 **The realistic 12–24mo path** | A tight outcome-feedback loop — every Amazon/Walmart decision back into the corpus within *days*, not quarters — beats Riverbend (a services firm, not a data pipeline) and AppealDesk (whose data skews to easy wins because it refuses hard cases). Must be *built and measured*, not assumed from "we use RAG." |
| **Counter-Positioning** | ✅ **Real and available now** | SellerCandy ($997–2,500/mo), Riverbend and eCommerceChris are billable-hours consultancies; adopting a $49–149 self-serve price cannibalizes their staffing model. This works against the *human* tier only — **not** against AppealDesk/AppealAI, who face no such conflict. |
| **Switching Costs** | 🟡 Weak but buildable | A one-off appeal has none. Accumulated account history inside the monitoring subscription creates mild lock-in. Speculative. |
| Branding / Scale / Network Economies | ❌ Not applicable at this stage | No player in the category has demonstrated any. |

**Bottom line, per Thiel's *Zero to One* proprietary-technology test:** on day one we are closer to a thin wrapper than we would like. The escape route is not the initial corpus — it is the **outcome-feedback loop**, which is why the consented outcome capture is non-negotiable in v1 (§7, B9).

### 5.6 Disruption thesis (Christensen)

- **Low-end disruption** of the $1,000+ consultant/attorney tier is real but **already occupied** by AppealDesk at $97. Competing there means disrupting a disruptor.
- **New-market disruption** of the DIY/free/forum non-consumption pool is the **stronger and more defensible thesis**: that segment is uncontested by any paid competitor's pricing, and it is the same segment Dunford's Step 5 identifies as caring most.

**Implication for Phase 2:** lead with the human-escalation + monitoring bundle. Do **not** lead with the drafting mechanic alone.

---

## 6. Business model, pricing and the 90-day revenue plan

### 6.1 The offer (Hormozi's value equation, scored honestly)

**Value = (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort & Sacrifice)**

| Term | Score | Why |
|---|---|---|
| Dream Outcome | **9** | "$800/day back online" — the buyer computes it themselves |
| **Perceived Likelihood** | **3** | **THE BINDING CONSTRAINT.** Zero track record against Riverbend's "10,000+ sellers" and reinstate.io's "85% first-appeal success" |
| Time Delay | **9** | <10 min vs. consultant's 5 days, attorney's 2 weeks |
| Effort & Sacrifice | **8** | Paste one block of text; **no Seller Central access ever**; no intake call (AppealDraft requires one — we undercut it to zero) |

**Six levers on Perceived Likelihood, in priority order (report 03 §2.2):**

1. **Show the retrieved policy clause verbatim with its source.** No competitor surfaces this today.
2. **Honest triage — refuse the unwinnable cases.** Counter-intuitively the strongest trust lever. AppealDesk markets refusal as a *checkmark*. Adopt it, then go further: **refer refused cases to partner attorneys for a referral fee**, converting a lost sale into revenue plus a BD relationship.
3. **Layered guarantees** (§6.3).
4. **The human tier's mere existence** raises perceived likelihood of the cheaper tier — Ramanujam's decoy/anchoring effect.
5. **Publish win-rate honestly, with the denominator and methodology.** Differentiating precisely because the category is saturated with unfalsifiable numbers.
6. **Community-sourced proof** — a public thread where a stranger was helped for free beats any on-site testimonial.

**Explicitly trimmed** (Hormozi's trim-and-stack; Ramanujam's "killers" — features whose presence destroys WTP): done-for-you submission on the seller's behalf; mandatory intake call; **any request for Seller Central credentials**.

### 6.2 The price ladder

| Package | Price | Contents | Segment | Role |
|---|---|---|---|---|
| **Decoder** | **Free**, no card, no login | Reason code, exact cited policy clause, plain-English diagnosis, POA outline, **first section of the real draft** | All | Lead magnet |
| **Rescue** | **$149 one-time** | Complete policy-cited POA in <10 min · Rejection-Risk Scorer · unlimited revisions · Evidence Kit · Reason Code Playbook · time guarantee · **30 days of Shield included** | S1 | Volume |
| **Rescue + Human** | **$399 one-time** | Everything above · same-day review by an experienced appeal writer · 15-min strategy call · priority queue · second-round Rejection Rescue | S2 | Margin |
| **Shield** | **$49/mo or $470/yr** | Daily account-health monitoring · alerts naming the specific policy at risk · pre-drafted POAs for top 3 risk vectors · **one Rescue appeal included per year** | S3 | Recurring |
| **Shield Pro** | **$149/mo** (+$25/mo per account beyond 10) | Up to 10 accounts · unlimited Rescue drafts · human review at $199 · webhooks/API · shared dashboard | S4 | Expansion + anchor |

**Two corrections to the original pitch, both load-bearing:**

- **The pitch's $39–79/mo monitoring tier is mispriced.** SellerSonar sells monitoring-only from **$19.98–23.98/mo** and Appeal Guru's equivalent runs ~$15–26/mo. **Monitoring alone is a ~$20 commodity.** $49 is defensible *only* by bundling the included annual appeal — Ramanujam's bundling rule, already validated in-market by Riverbend PRO ("if your account gets suspended while enrolled, we handle the entire appeal"). On the $470 annual plan the monitoring component nets to ~$27/mo after the included appeal, deliberately close to SellerSonar's entry so the comparison survives.
- **The pitch's $299–499 rush tier is correctly priced but wrongly sequenced.** It must not be the entry offer. $399 is the midpoint, anchored against **AppealDesk's own published comparison table** ($1,250 consultant / $3,500 attorney) — we get to use a competitor's anchor — and set above ReinstateIQ's $350 to avoid a like-for-like comparison.

**Why $149 and not $97:** per Ramanujam, discounting into an undifferentiated position is the classic **minivation**. The entire "suspension-defense copilot" positioning is void if we price as a cheaper AppealDesk. The $52 premium is paid for by unlimited revisions, visible citations, the Evidence Kit, the time guarantee and 30 days of Shield. Per report 04 §1, pricing below the incumbent would also **confound the primary experiment** — we could not distinguish differentiator-driven conversion from discount-driven conversion.

**Pricing model choice** (Ramanujam Rule 3, benchmarked against Poyar/OpenView's 2026 monetization survey, n=230): flat-fee transactional + flat-rate subscription, metered only at the S4/agency tier. Flat-fee is used by **37% of companies under $5M ARR**; hybrid pricing rose **25%→37%** year-on-year. Poyar also reports AI-native companies targeting a median **50% gross margin**; we should land far above that, because inference is cents and human review is priced separately rather than absorbed.

### 6.3 The guarantee stack (Hormozi's taxonomy)

1. **Time guarantee (unconditional, fully in our control):** *"Your draft is in your inbox in 10 minutes or it's free."* Cheap, differentiating, **and nobody else offers a time guarantee.** Lead with this.
2. **Service guarantee (conditional):** unlimited revisions until reinstated or you tell us to stop. Matches PlatformAppeal — table stakes.
3. **Outcome guarantee (conditional, A/B):** *"First submission rejected? Your human review is free."* Deliberately gives more *service* rather than cash back — Hormozi's preference, and it retains the customer **and the case data** that feeds the Process Power loop.
4. **Aggressive variant to test:** match AppealDraft's full cash refund on the $149 tier. **Risk: adverse selection** — sellers with unwinnable cases self-select in and refund out (Akerlof 1970, *QJE*). **The mitigation is already designed in:** honest triage screens unwinnable cases out *before* payment, which is exactly why triage-and-refuse and a strong refund guarantee are complements, not alternatives.

### 6.4 Solving the event-shaped-WTP problem

Willingness-to-pay spikes at suspension and collapses at reinstatement. Three mechanisms exist; we pick one:

- **M1 — Insurance bundling (subscribe now, covered later).** Riverbend PRO proves it sells, but invites textbook adverse selection (Akerlof 1970; Rothschild & Stiglitz 1976, *QJE*): sellers subscribe only when already at risk, claim, and cancel. **Retained only for S4/agencies**, where risk pools across many accounts. Standard mitigations if used: 30-day waiting period before appeal coverage activates; never sell Shield to an already-suspended account except post-reinstatement.
- **M2 — Post-reinstatement conversion. ✅ RECOMMENDED PRIMARY.** Sell the transaction at the moment of panic; offer the subscription at the moment of relief. Grounded in the **peak-end rule** (Fredrickson & Kahneman 1993, *JPSP*; Kahneman, *Thinking, Fast and Slow*): retrospective evaluation of an affective episode is dominated by its peak and its ending, so fear of recurrence is most vivid immediately after resolution. Operationally this is Hormozi's tripwire-to-continuity: 30 days of Shield *included* with Rescue (zero incremental decision under panic), card already on file, retention decision lands 30 days later. Poyar's **30% card-on-file trial conversion** benchmark applies directly and is why the attach assumption is defensible.
- **M3 — Cold-selling prevention to never-suspended sellers.** Structurally disadvantaged: Amazon offers Account Health Assurance free above an Account Health Rating threshold, so we would compete with a free first-party product for exactly the healthy sellers most able to pay. *(Program details unverified — pages 404'd.)* **Deprioritise for 90 days.**

### 6.5 Channels — Bullseye (Weinberg & Mares)

All 19 *Traction* channels were scored /25 in report 03 §4.1. Inner ring:

| Rank | Channel | Score | Role |
|---|---|---|---|
| 1 | **Engineering as Marketing** | **22/25** | The free Notice Decoder + a public Suspension Reason Code Index (one page per code). Canonical *Traction* pattern (HubSpot Website Grader, Moz free tools): the marketing asset *is* the product, at zero marginal cost, and it simultaneously seeds the SEO build. |
| 2 | **Community Building** | **21/25** | Scores 5/5/5 on reach, cost and speed; only 2 on uncrowdedness (every competitor is already here). Ranks second anyway because a "just got suspended" post is a **public, timestamped, individually addressable buying signal** — almost no other business gets that. |
| 3 | **Search Engine Marketing** | **20/25** | **Capped $1,500 measurement test only.** See §6.6. |

**Reserve #1 — Business Development** (18/25, seed day 1, revenue day 60+): monitoring tools that detect but cannot remedy (SellerSonar, Helium 10 Alerts — report 02 explicitly identifies them as partial substitutes that make natural partners); agencies, VAs, prep centres, freight forwarders; and the consultants/attorneys themselves in a two-way referral (they send down-market cases; we send the six categories we triage out, earning fees on refusals). Best long-run economics at **~$40–60 CAC** because each partner aggregates many suspension events.

**Hormozi's Core Four ($100M Leads) mapped:** post free content = the primary engine (community answers + Reason Code Index); cold outreach = the **"suspension radar"** hypothesis (a suspended storefront is *publicly observable* — it goes dark — yielding a cold list with warm-level intent within hours, and doubling as the technical seed of Shield; **flagged as a hypothesis: scraping feasibility, Amazon ToS, contact-data availability and CAN-SPAM/GDPR all unverified**); warm outreach = free-Decoder non-buyers become a warm list within days; paid ads = capped SEM.

### 6.6 Unit economics — the arithmetic that governs everything

**LTV build (base case):**
- Transactional: $199 AOV × 1.4 purchases over 24 months = **$279**
- Subscription: 14% net Shield attach × $49/mo × ~16.7-month life at 6% churn = **$115**
- **Gross LTV ≈ $394; contribution LTV ≈ $355** at ~90% blended margin.
- **Maximum sustainable CAC at 3:1 ≈ $118.**

| Channel | Modelled CAC | vs. $118 ceiling | Verdict |
|---|---|---|---|
| Community Building | ~$0 cash | ✅ | **Engine** |
| Engineering as Marketing | ~$0 marginal | ✅ | **Engine** |
| **SEM** | **~$375** ($10 CPC ÷ (30% click→Decoder × 8% Decoder→paid)) | ❌ **3.2× over** | **Capped learning test only** |
| BD / affiliate | ~$40–60 | ✅ | Reserve, best economics at scale |

**Paid search cannot be the growth engine at a $149 entry price.** Run it as a capped **$1,500** test judged on **blended revenue per click** (kill unless ≥$0.60/click), never on Rescue conversion alone. Three things would make it viable and **all must be measured, not assumed**: (1) actual CPC lands at $4–5 rather than the $10 hypothesis; (2) blended AOV rises to ~$350 via a 40%+ human-tier mix; (3) Shield net attach reaches 25–30%. All three together take the ceiling to ~$300. **None is true on day one** — which is why the first 30 days spend zero cash on acquisition.

### 6.7 The 90-day revenue plan

**Assumption register — every number flagged (report 03 §6.1):**

| # | Assumption | Value | Basis | Confidence |
|---|---|---|---|---|
| A1 | Free→paid conversion | 8% → 9% → 10% | Poyar 2026 median free-to-paid = 8% (n=200); held flat as conservatism buffer | **Medium-low — largest swing factor** |
| A2 | Community output | 8–15 replies/day; 10–20% reach Decoder | Founder-capacity estimate, no published benchmark | **Low — hypothesis** |
| A3 | SEM CPC | $10 ($6–15) | **Unverified** — no keyword data obtained | **Low — measure in week 1 of the test** |
| A4 | Price mix | 80/20 → 75/25 ($149/$399) | Mix shifts to human tier as proof accumulates | Medium |
| A5 | Shield attach | 35% accept included 30 days × 40% retain = **14% net** | Poyar: card-on-file trials convert 30% | Medium-low |
| A6 | Shield monthly churn | 6% | SMB SaaS typical 3–7%; no category-specific source | **Low — hypothesis** |
| A7 | Repeat purchase | 1.4× over 24 months | 1.6 events/yr, discounted for leakage | Medium |
| A8 | Refund cost | 8% of Rescue revenue | Judgment; honest triage is the control | **Low — hypothesis** |
| A9 | COGS | $1–3/draft inference; $60–90 human review per $399 case | Contractor rate estimate | Medium |

**Base case:**

| | Month 1 | Month 2 | Month 3 |
|---|---|---|---|
| Channels live | Community, Eng-as-Marketing | + SEM test, BD seeding | + affiliate, 1–2 BD partners |
| Free Decoder sessions | 120 | 345 | 650 |
| Conversion | 8% | 9% | 10% |
| **Paying customers** | **10** | **31** | **65** |
| Blended AOV | $199 | $199 | $211 |
| Transactional revenue | $1,990 | $6,169 | $13,748 |
| Shield MRR | $0 | $69 | **$419** |
| **Total revenue** | **$1,990** | **$6,238** | **$14,167** |

**90-day totals: ~106 paying customers, ~$22,400 cumulative, exiting at ~$14.2k/mo transactional + ~$420 MRR. The 10th paying customer lands day 21–28.**

| Scenario | Driver | 90-day revenue | Customers | Exit MRR |
|---|---|---|---|---|
| Conservative (0.5×) | Community→Decoder half of A2; conversion stalls at 6%; moderation friction | ~$11,200 | ~53 | ~$210 |
| **Base** | As modelled | **~$22,400** | **~106** | **~$420** |
| Aggressive (2×) | Forum reputation compounds; a BD partner lands by day 45; human-tier mix hits 30% | ~$44,800 | ~212 | ~$840 |

**In all three scenarios the business exits day 90 as a transactional business with a subscription seed. Set that expectation now.**

### 6.8 The first 10 customers — 14-day concierge playbook

Governing principle: per Graham's "Do Things That Don't Scale" and Ries's **concierge MVP**, **do not wait for the product.**

**Days 1–3 — the minimum sellable surface.** One landing page with the AppealDesk-style anchor table ($3,500 attorney / $1,250 consultant / $149 us) and the guarantee stack. Two Stripe payment links ($149, $399). A manual delivery runbook: intake form → retrieval over the corpus → draft → rejection-risk pass → PDF + editable doc **within 60 minutes** (under-promise against the eventual 10-minute guarantee). The honest-triage refusal list written down **before the first customer**, so it is applied consistently rather than negotiated under revenue pressure.

**Days 2–14 — the daily loop.** Morning sweep (60–90 min) of r/AmazonSeller, r/FulfillmentByAmazon, Facebook groups and Seller Central Account Health. 8–15 substantive replies/day. **The hook:** identify the reason code from their pasted notice → quote the exact policy clause → state the *one* thing their POA must contain that most sellers get wrong for that code → *"Happy to run your full notice through the reason-code index and send back the POA structure — DM me, no charge."* **The conversion:** the free structure lands in DMs; the natural next line is *"want the complete submission-ready draft with the evidence checklist? $149, in your inbox within the hour, refund if it's late."* Per Hormozi, the free thing must solve a **complete narrow problem** while making the next problem obvious.

**The ask that matters more than the money:** every customer gets a 15-minute call. This is Blank-style customer discovery disguised as onboarding, and it fills the gap report 01 flagged as the biggest evidentiary hole.

**Days 7–14:** ship the free Notice Decoder so the loop stops depending on founder DMs; instrument the Ellis survey; post the first three anonymised outcomes back into the communities that produced them (with permission) — this is where Perceived Likelihood starts climbing from 3/10.

---

## 7. MVP scope

### 7.1 The riskiest assumption (Ries)

The sibling reports have **retired** the assumptions that normally dominate an MVP: demand (A1), willingness to pay (A2), and "can an LLM draft a POA" (A3 — five shipped products prove it). Per Ries's instruction to attack the riskiest assumption first, what remains untested is **comparative**:

> **A4 (PRIMARY): A retrieval-grounded draft that names the exact policy clause and reason code from the seller's own notice, plus a visible readiness critique, converts a panicking seller to payment at a *premium* over a $97 incumbent — and does so at the forum moment.**

**The scoping consequence:** because A4 is comparative, **the differentiator must be visible BEFORE the paywall**, or the experiment is confounded — a draft delivered after payment tests the promise, not the product. The paywall therefore sits *after* the classified reason code, the cited clauses and the readiness critique, and *before* the full document. **This is experiment design, not a growth hack.**

Secondary assumptions tested in v1: A5 (community channel converts at acceptable cost); A6 (human rush review is wanted — priced, fulfilled by hand). **A7 (drafts actually improve outcomes) is instrumented only**, because Walmart states appeals are "handled and responded to in the order in which they're received" with no committed timeline — a 3–30 day self-reported loop is the worst possible primary metric for a 5-day MVP.

### 7.2 The one journey

```
Paste notice → Classify → Retrieve → Draft → Critique → PREVIEW (free) → Pay → Full POA (copy + PDF)
                                                  ↓
                                "This case needs a human" → rush tier → Stripe → human queue
```

### 7.3 BUILD list

| # | Component | Anchor |
|---|---|---|
| **B1** | **Single-page web app.** One textarea, one button. No signup, no dashboard, no navigation. Email captured only at payment. | YC "launch fast"; Ries MVP minimality — the buyer is mid-panic and single-session; every field is a conversion tax |
| **B2** | **Reason-code classifier (routing).** ~20–30 codes (Section 3, inauthentic, IP complaint, safety, restricted product, ODR, late shipment, linked account, dropship, review manipulation, verification, + Walmart performance-standard equivalents). Emits confidence and a first-class **`UNCLASSIFIED`** path. | Anthropic *Building Effective Agents* — **routing** pattern |
| **B3** | **Retrieval over the curated corpus** (§8). | Lewis et al. 2020 — retrieval yields "more specific, diverse and factual language"; factuality is the axis we sell |
| **B4** | **Grounded clause citation via the Citations API.** Documents passed with `citations: {enabled: true}`; model returns `cited_text` with source locations. **Hard rule: the UI renders a policy reference only if it originated in a citation object.** | Anthropic Citations; implements Dunford Step 8 |
| **B5** | **Draft generator** — three-part POA (root cause / immediate corrective actions / preventive measures), specialized per reason code. | Category standard; Walmart requires "a written business plan of action describing the violation and the steps you plan to take"; Anthropic **prompt chaining** |
| **B6** | **Readiness critique pass** — second model call scoring against a per-code rubric and naming concrete deficiencies ("no supplier invoices referenced," "no measurable preventive control," "apologetic tone / blames Amazon"). **Shown free, pre-paywall.** | Anthropic **evaluator-optimizer**. This is the visible proof of quality that makes A4 testable, and the part a generic ChatGPT prompt does not produce |
| **B7** | **Preview paywall + Stripe Checkout.** | Ries build–measure–learn; Ramanujam (price attached to the value moment) |
| **B8** | **Rush human-review tier** — priced option, form, Stripe, internal queue. Fulfilment = a human editing the same draft in the same tool. **No automation.** | Ries concierge/Wizard-of-Oz MVP; Graham. Also the differentiator vs. AppealDesk, which triages hard cases *away* |
| **B9** | **Consent-gated outcome capture** — checkbox at payment ("let us follow up in exchange for a credit"), day-3/10/21 emails, one-click outcome form. **Must ship day 1 or the data is lost forever.** | Helmer (Process Power); Karpathy *Software 2.0* — the dataset is the artifact |
| **B10** | **Eval harness + golden set** (~40 hand-labelled notices) in CI. | Anthropic *Writing Tools for Agents* — "run evaluations programmatically… iteratively improve." Without this every prompt change is a coin flip |
| **B11** | **Disclaimers + refusal path.** "Not legal advice." No reinstatement guarantee. IP/counterfeit/legal-threat routed to the human tier or outside counsel. | Category norm (PlatformAppeal explicitly does not guarantee reinstatement) + UPL control |

### 7.4 DO NOT BUILD list — the more valuable half

| # | Exclusion | Reason |
|---|---|---|
| **N1** | **SP-API integration / automated monitoring** | `ACCOUNT_STATUS_CHANGED` (NORMAL/AT_RISK/DEACTIVATED) is exactly the right primitive, but reaching it needs a **public app**: Appstore listing, Solution Provider Agreement, Acceptable Use + Data Protection Policy review, security-controls questionnaire, per-role approval. Weeks of compliance, **zero learning about A4**. Sell monitoring manually first. |
| **N2** | **Any handling of seller credentials, cookies or sessions** | Largest legal risk + largest trust risk, contributes nothing to A4, and a competitor already markets its absence ("We never log into your account"). Removing it removes a whole risk class for free. |
| **N3** | **Automated appeal submission** | No API exists; Amazon appeals go through the Account Health dashboard by hand, Walmart via a Seller Center Help ticket. Automating it would require N2. |
| **N4** | User accounts, auth, dashboards | Single-session panic purchase. A magic-link retrieval URL covers 100% of the real need. |
| **N5** | **A vector database** | v1 corpus is a few hundred records. Prompt caching reads cost **0.1×** base input ($0.50 vs $5/MTok on Opus 5) with a 1h TTL. Chunking is sidestepped entirely. Add hybrid retrieval when the corpus outgrows the context budget. |
| **N6** | **Fine-tuning / model training** | At this corpus size retrieval + prompting dominates on iteration speed, cost, auditability **and the ability to cite**. Revisit only at tens of thousands of labelled triples. |
| **N7** | **An autonomous agent loop** | Agentic systems "trade latency and cost for better task performance" — worth it "only when simpler approaches fail." Ours is a fixed four-stage pipeline. |
| **N8** | eBay, Etsy, TikTok Shop, KDP, Brand Registry | Moore's beachhead discipline. Amazon account-level deactivations only; Walmart in v1.1. |
| **N9** | ASIN/listing-level appeals | Different document, different taxonomy, lower urgency, lower WTP. Account-level is where the $800/day clock runs. |
| **N10** | **Any success-rate marketing claim** | Competitors publish unaudited 85–93% figures. Publishing an unmeasured rate is an advertising-substantiation exposure **and poisons the trust position we are selling**. Publish only what B9 measures, with the n. |
| **N11** | **Any automated access behind the Seller Central login** | Bright line, not a managed risk. See §8.3. |
| **N12** | **Ingesting competitors' generated drafts as corpus** | The Thomson Reuters v. Ross fact pattern. *(Recalled, not verified in-session — verify with counsel.)* |
| **N13** | Mobile app, i18n, SOC 2, multi-tenant admin | None test A4. |
| **N14** | Monitoring UI before monitoring is sold | Sell the plan as email-forwarding + manual review to the first 20 buyers. If nobody buys it by hand, the automated version was never worth N1's compliance cost. |

### 7.5 Instrumentation and pre-committed decision rules (Ries's innovation accounting)

Committing to the metric and the rule **before** the experiment is what prevents post-hoc rationalization.

- **Primary metric (tests A4):** `preview → paid` conversion, measured **only on sessions that reached a successful classification**.
- **Secondary:** `paste → successful classification` rate; classifier accuracy vs. golden set; rush-tier attach; CAC and reply-rate per community post; median paste→preview latency.
- **Lagging, instrumented only (A7):** self-reported submission and reinstatement rates at day 3/10/21, **n always reported**.
- **Designated vanity metrics — do not report:** drafts generated, page views, waitlist size. Ries's warning applies with unusual force: "free drafts generated" will look spectacular and mean nothing.

**Decision rules (thresholds are hypotheses, not drawn from a published benchmark — flagged as such):**
- **Persevere** if preview→paid **≥8%** over ≥100 classified sessions.
- **Iterate** (prompt / critique / pricing) if **3–8%**.
- **Pivot** if **<3%** — the differentiator is not perceived, and there is no cheaper price to retreat to that isn't already AppealDesk's ground.
- Run Sean Ellis's 40% survey once ≥40 paying customers exist.

### 7.6 Build plan — 5 working days after gates clear

| Day | Work |
|---|---|
| **Day 0** | **Pre-flight gates (§10.2). Blocking. Human decision required.** |
| **Day 1** | Parallel: (A) reason-code taxonomy, 20–30 structured records; (B) polite forum crawler with robots.txt pre-flight and abort-on-change; (C) policy + pattern layers with source pointers; (D) repo, typed corpus schema, app skeleton, CI. **Gate: corpus loads, validates, fits the cached context budget.** |
| **Day 2** | The four-stage pipeline — classify → retrieve → draft → critique — each built and tested independently. **Invariant enforced in code with a test: any policy reference lacking a backing citation object is stripped before render.** |
| **Day 3** | Parallel: (E) frontend paste→streaming preview→paywall; (F) Stripe both tiers + magic-link retrieval; (G) full document, inline editing, branded PDF; (H) **outcome loop B9** — consent, redaction, day-3/10/21 sequence. |
| **Day 4** | Evals: ~40 hand-labelled notices in CI with confusion matrix; LLM-as-judge draft quality against the per-code rubric + human review of 10; adversarial pass (prompt injection via the notice field, garbage/non-English input, 50k-char paste, unsupported platform); cache-hit and p50/p95 latency verification. |
| **Day 5** | Deploy; verify Stripe end-to-end with a **live transaction**; **only if the forum-rules gate cleared**, run the channel test — 20 genuinely helpful non-spammy replies, logging reply→visit→classify→pay per post; fulfil the first rush orders **by hand and write down every human edit** — those edits are the Day-6+ backlog. The concierge MVP working as intended: **the human's corrections are the product roadmap.** |

**Agent-suitable vs. human-required:** agents do crawling, extraction, corpus structuring, L1–L3 drafting from public sources, app scaffolding, Stripe/PDF/email, the eval harness, adversarial tests, copy. Humans must do: the name decision, counsel review, reading login-gated policy pages, labelling the golden set's ground truth, rush-tier fulfilment, and forum posting.

---

## 8. Knowledge base / data plan

Per Karpathy's *Software 2.0*, "the dataset that defines the desirable behavior" is the primary artifact. Here the corpus — not the prompt, not the model — is the product.

### 8.1 Four layers, not equally hard to acquire

| Layer | Content | v1 volume | Difficulty |
|---|---|---|---|
| **L1 — Reason-code taxonomy** | ~20–30 codes: canonical name, notice trigger phrases, required evidence, typical failure modes | 20–30 records | **Easy** — hand-authored from public sources |
| **L2 — Policy summaries** | **Our own** structured summary of each governing policy + clause id + source URL | 30–60 records | **Medium** — authoritative text is login-gated |
| **L3 — Structural appeal patterns** | Per code: what a strong root-cause / corrective / preventive section contains; anti-patterns | 20–30 records | **Medium** — synthesized from public guidance + expert review |
| **L4 — Outcome corpus** | Consented, redacted (notice → draft → reported outcome) triples | **0 at launch** | **Hard — and the only real moat** |

**L1–L3 are buildable in a day by agents. L4 is the asset.** Report 02's Helmer audit is correct that "cornered resource" is a hypothesis, and that Process Power via a fast outcome loop is the realistic path. **L4 is why B9 is non-negotiable.**

### 8.2 Source-by-source feasibility (verified by direct fetch)

| Source | Public? | Verdict |
|---|---|---|
| **Walmart Marketplace Learn** — appeal + suspension guides | Yes, no login | **USE.** Highest-quality/lowest-risk source in the plan; clean prose, small page count |
| **Amazon Seller Forums** (`/seller-forums/`) | Yes, no login | **USE, rate-limited.** Server-rendered HTML, stable thread URLs `/seller-forums/discussions/t/{uuid}`, dedicated **Account Health → "Suspended & Deactivated Accounts"** category. Best source for real notice phrasings and reason-code discovery |
| **Amazon SP-API developer docs** | Yes | **USE** — for Phase-2 monitoring design only |
| **Amazon Seller Central help/policy pages** | **No — login-gated** (fetch returned a marketing shell; amazon.com help returned 503 to automated clients) | **DO NOT AUTOMATE.** L2 is authored by a **human** with a legitimate Professional seller account reading the pages and writing our own summaries |
| **Consultant/law-firm explainers** | Yes | **Taxonomy discovery only** — read to learn *what codes exist*, author our own text |
| **Competitor product outputs** | Paid | **DO NOT INGEST** (N12) |

### 8.3 The robots.txt finding — verified, favourable, and decisive

`https://sellercentral.amazon.com/robots.txt` was fetched directly. Structure is a broad `Disallow: /` with a permissive allowlist that **explicitly includes `/forums/` and `/seller-forums`**, with narrow disallows on `/forums/search` and `/forums/search.jspa`.

**Operational rules, hard-coded not manual:**
- Crawl category and discussion pages under `/seller-forums/`. **Never** touch `/forums/search*` — an explicit machine-readable prohibition is exactly the kind of gate that matters under the Van Buren "gates-up-or-down" rule.
- Discover threads by paginating category listings, never by querying search.
- Identify the crawler honestly in the User-Agent with a contact URL; ≤1 req/sec; back off on 429/503.
- **Re-fetch robots.txt before each crawl run and abort on change** — a hard-coded pre-flight check.

**The most important corpus finding: the highest-authority text is the least legally acquirable.** Hence the L2 human-authored design.

### 8.4 Legality, applied

**(a) CFAA exposure on logged-out public crawling: low.** *Van Buren v. United States* (2021) held 6–3 that one "exceeds authorized access" only by obtaining information "specifically off-limits" on a system one may otherwise use — the gates-up-or-down rule; using access for an improper *purpose* is not a violation. *hiQ Labs v. LinkedIn* applied the same logic: the Ninth Circuit affirmed LinkedIn could not use the CFAA to block scraping of **publicly available** profile data, even after a cease-and-desist.

**(b) But contract exposure is real — that is the lesson of how hiQ ended.** In **November 2022** the N.D. Cal. held hiQ had **breached LinkedIn's User Agreement**, and the case settled. **hiQ won the CFAA question and still lost.** "Not a federal crime" ≠ "not actionable." Therefore:
- Public, robots-allowed, **logged-out** crawling of the Seller Forums — acceptable risk.
- **Anything behind the Seller Central login — unacceptable for automation** (N11), because the account holder has *affirmatively accepted* the Business Solutions Agreement, converting a scraping question into a breach-of-contract question with a named counterparty who can also terminate the account. **Bright line, not a managed risk.**
- *(Recalled, not verified in-session: Meta v. Bright Data (N.D. Cal., 2024) is generally read as holding that logged-out scraping of public data does not breach ToS accepted by a logged-in user — which, if accurate, maps precisely onto this line. **Verify before relying.**)*

**(c) Copyright — and why the mitigation improves the product.** Platform policy texts are copyrighted. The relevant caution is *Thomson Reuters v. Ross Intelligence* *(recalled, not verified in-session; D. Del., Feb 2025)*, where fair use was rejected for using a competitor's copyrighted legal-research material to build a **competing product**, with market effect weighing heavily against the defendant. Our exposure is worst exactly where our incentives point. Mitigations, all cheap:
- Store **our own structured summaries** keyed to a canonical clause id + source URL, never wholesale reproductions.
- Where verbatim text is necessary, keep excerpts short and quote them as excerpts.
- **Convenient consequence:** because the Citations API cites from *the documents we supply*, and our documents are our own prose, user-facing `cited_text` is our summary plus a pointer to the authoritative source — **lower legal risk AND better UX** than dumping platform boilerplate.
- Forum posts are authored by sellers, not Amazon. Use them to learn notice phrasings and taxonomy; do not republish post text.

**(d) PII in L4.** A pasted notice routinely contains merchant tokens, case IDs, legal names, addresses and ASINs. Before any notice enters L4: explicit opt-in consent at payment, separable from the purchase; automated redaction, then human spot-check on the first ~100; retention limits and deletion-on-request from day one (GDPR/CCPA baseline). This also keeps the door open to SP-API later — the Data Protection Policy review will ask these questions, and having answers already implemented converts a blocker into a form.

### 8.5 Retrieval architecture

- **v1: cached full corpus + code-keyed lookup. No vector DB, no chunking** (N5). Prompt caching at 0.1× reads makes the whole of L1–L3 cheap to hold in context.
- **When L4 growth makes full-context infeasible**, adopt Anthropic's Contextual Retrieval stack — contextual embeddings cut retrieval failure **35%** (5.7%→3.7%), + contextual BM25 **49%** (→2.9%), + reranking **67%** (→1.9%) — and note the finding that passing the top-20 chunks beats top-10 or top-5.
- **Cost:** with a corpus in the low tens of thousands of tokens, marginal cost per draft is **cents** against a $149 price. Use the 1-hour cache TTL during traffic bursts from a forum post.

---

## 9. Why it won the vote

### 9.1 The tally

| Rank | Idea | Borda score |
|---:|---|---:|
| **1** | **Reinstate** | **71** |
| 2 | DutyLens | 66 |
| 3 | WageLens | 65 |
| 4 | Certly | 64 |
| 5 | ScopeIQ | 48 |
| 6 | StayLegal | 42 |
| 7 | StateReady | 40 |
| 8 | Recoup | 36 |

Margin over #2: **5 points (7.6%)** — a win, not a landslide. The top four cluster within 7 points, which is itself informative: the fleet did not find one obviously dominant idea, it found four credible ones and ranked this first on the strength of evidence quality rather than category attractiveness.

### 9.2 Where it won — and by how much

| Judge lens | Rank | Verdict in one line |
|---|:---:|---|
| **pmf-evidence** | **#1 of 8** | "The clearest 'money changing hands for a worse (slow, expensive, manual) solution' evidence" — Riverbend's 400+/mo at $1,000+, 10,000 sellers, plus daily visible forum urgency |
| **speed-to-revenue** | **#1** | Live daily demand + a founder can hand-draft a POA from public policy text with zero build; "cash lands same-day" |
| **simplicity** | **#1** | One buyer, one trigger, one job, no bundling — the cleanest Christensen JTBD and Moore beachhead of the set |
| **willingness-to-pay** | **#1** | Riverbend's proven $1,000+/appeal spend plus zero-income urgency maximizes Hormozi's dream outcome and minimizes time delay |
| **distribution** | **#1** | Seller Central forums are a live, self-identifying "Dream 100" where free-content replies convert urgent buyers same-day |
| **moat** | **#1 (tied with Recoup)** | Judged to build a genuinely private, compounding dataset no public source contains — **note the deep dive disagrees; see §9.3** |
| **competition-gap** | #3 | Riverbend is expensive high-touch human consulting — classic simpler/cheaper disruption |
| **ai-buildability** | #4 | Policy RAG is solid, but the "winning appeal patterns" corpus is proprietary, not scrapeable |
| **market-size** | #4 | Strong proof-of-spend but transactional/crisis-driven rather than a large durable population |
| **execution-risk** | #3–4 band | Moderate: data-access fragility (Amazon ToS, platform dependency) but limited direct liability |
| **monetization-clarity** | **#7** | "Two price points with no clear value-metric differentiator between them" |
| **churn-retention** | **#8 (last)** | "The archetypal one-off JTBD — get reinstated, cancel — despite a monitoring add-on; worst retention fit" |

**The shape of the win:** six first-place lenses on **evidence, urgency, simplicity, price and reach** — the things that determine whether a company can exist at all and start earning quickly — against two last-place-band lenses on **retention and pricing architecture** — the things that determine what it becomes at scale. For a factory optimising for revenue in days, that is the correct trade. But it names the long-term risk precisely, and §6.4/§10 address it head-on rather than pretending the judges were wrong.

### 9.3 Where the deep dives overruled the judges

Intellectual honesty demands recording the disagreements:

1. **The `moat` lens ranked this #1 for a "genuinely private, compounding dataset." Report 02's Helmer audit says that dataset does not exist and starts smaller than two competitors'.** The deep dive is right; the judge was scoring the pitch's claim, not the world. **Corpus is downgraded from moat to roadmap item; Process Power + Counter-Positioning are the honest answer.**
2. **The `monetization-clarity` lens (#7) was right and the pitch was wrong.** The $39–79/mo tier is mispriced against a ~$20 commodity, and the fix (bundle the included annual appeal) came out of report 03's Ramanujam analysis.
3. **The `churn-retention` lens (#8) was right about the JTBD.** The response is not to deny it but to sequence around it: transactional-first with post-reinstatement subscription conversion via the peak-end rule (§6.4-M2), and to expect subscription at ~3% of month-3 revenue rather than forecasting otherwise.
4. **The `competition-gap` lens ranked it #3 assuming the incumbent was "expensive high-touch human consulting."** The real incumbent to beat is **AppealDesk at $97**, which the judges did not see. This is the largest single correction in the dossier and it drives D3, D4 and the entire A4 experiment design.

**Net:** the idea won on the axes that survived scrutiny and lost points on the axes the research subsequently confirmed as genuine weaknesses. That is a well-calibrated selection, and the weaknesses are now designed against rather than inherited.

---

## 10. Risks and mitigations

### 10.1 Ranked risk register

| # | Risk | Severity | Mitigation | Owner |
|---|---|:---:|---|---|
| **R1** | **Name collision.** reinstate.io has traded since 2019 with 500+ cases and 2019-era SEO; ReinstateIQ is also live. Degrades both SEM and community channels; baked into domain, Stripe, repo and copy. | **BLOCKING** | **Rename before any code** (§12). Building first means rebuilding. | Human, Day 0 |
| **R2** | **Forum solicitation ban.** Amazon Seller Central forums prohibit solicitation; the #2 channel is the entire path to first revenue; failure mode is account bans. | **HIGHEST execution risk** | Verify participation guidelines before the channel test. **No links in replies** — profile/signature only. Reddit and Facebook groups carry the volume; Seller Central is used for reputation only. **Every reply must stand alone as useful if the link is never clicked.** Diversify off a single channel by day 60. | Human, Day 0 gate + ongoing |
| **R3** | **Misclassification → confidently wrong document**, burning the seller's one appeal attempt. Worse than no product. | **Highest technical damage** | Routing with an explicit confidence threshold and a first-class `UNCLASSIFIED` outcome that **converts to the $399 human tier rather than guessing**. Note: this turns the worst failure mode into the differentiated revenue line — AppealDesk simply refuses these cases. | Build, Day 2 |
| **R4** | **Hallucinated policy citations** destroy the exact trust claim we sell. | High | **Code-level invariant with a test:** no policy reference reaches the UI unless it arrived inside a Citations `cited_text` object with a source location. Not a prompt instruction. | Build, Day 2 |
| **R5** | **A1 (free→paid conversion) is wrong by 2×.** The entire 90-day model is a function of it. | High | Measurable within 100 Decoder sessions for ~$0. **Measure before spending anything.** | GTM, Day 5–30 |
| **R6** | **Unverified "Amazon March 2026 Agent Policy"** (sourced only from AppealDraft's marketing) may govern exactly this product category. | High, unknown | **Locate the primary source before launch.** Treat the vendor assertion as marketing per the Mom Test discount. | Human, Day 0 gate |
| **R7** | **AppealDesk or AppealDraft adds a human-review tier**, collapsing the core differentiation. | High | The durable answer is not the tier but the **outcome-feedback loop behind it** (Process Power) — which argues for instrumenting outcomes from customer #1. | Build, Day 3 (B9) |
| **R8** | **The guarantee attracts unwinnable cases** (Akerlof 1970 adverse selection). | Medium-high | **Honest triage enforced before payment, not after.** Triage and guarantee are complements. | Offer design |
| **R9** | **UPL exposure** — drafting a document that argues a party's case sits near the line. *(Flagged as hypothesis; no authority fetched.)* | Medium | Category norm favours us (Riverbend, eCommerceChris are non-lawyers doing this at scale). Prominent "not legal advice"; no representation; the human tier edits documents rather than advising on law; IP/counterfeit/litigation-threat routed to counsel. **Counsel review of the disclaimer set before launch.** | Human, Day 0 gate |
| **R10** | **Prompt injection via the pasted notice** — untrusted stranger input, and it is the *entire* input surface. | Medium | Pass the notice as a `document` content block (data), **never concatenated into instructions**; keep the corpus non-secret by design (public-policy summaries, so extraction is embarrassing not fatal); output-side schema validation. | Build, Day 4 |
| **R11** | **Advertising substantiation** — publishing an unmeasured success rate. | Medium | **N10: publish nothing until B9 produces a rate with a stated n and methodology.** Unlike competitors' unaudited 85–93% claims — and this restraint is itself a differentiator in a category saturated with unfalsifiable numbers. | Marketing |
| **R12** | **Copyright** — bulk-reproducing platform policy text to sell a policy-interpretation product (the Ross fact pattern). | Medium | Own summaries keyed to clause id + source URL; short quoted excerpts only; never ingest competitor outputs. Verify Ross and Bright Data with counsel. | Build + counsel |
| **R13** | **Platform retaliation** — Amazon changes forum rules, blocks the crawler, or moves against third-party appeal tooling. | Medium | Keep zero credential dependency (N2) so **no product function breaks if forum access ends**; polite identified crawler; diversify channels early. | Ongoing |
| **R14** | **Amazon expands Account Health Assurance**, compressing the prevention market from above. | Medium | Deprioritise the prevention pitch to never-suspended sellers for 90 days (M3). Compete on the *appeal*, which Amazon will not do for the seller. | Strategy |
| **R15** | **PII leakage from the outcome corpus.** | Medium | Consent separable from purchase; automated redaction + human spot-check on the first 100; retention limits and deletion-on-request from day one. | Build, Day 3 |
| **R16** | **Zero Helmer powers on day one** — the strategic caveat under everything above. | Structural | Start the only clock that matters: L4 via B9. **If the build slips, cut anything before cutting B9.** | Strategy |

### 10.2 Pre-flight gates — Day 0, blocking, human decision required

| Gate | Action | Blocks |
|---|---|---|
| **G1 — Name** | Resolve the reinstate.io / ReinstateIQ collision. Pick and register a distinct name + domain; trademark clearance search. | **Everything downstream** |
| **G2 — Legal** | Counsel review of the disclaimer set, UPL posture, no-guarantee language, and L4 consent text. | Launch (not build) |
| **G3 — Agent Policy** | Locate the primary source behind AppealDraft's "Amazon March 2026 Agent Policy" claim. | Launch |
| **G4 — Forum rules** | Read Seller Forums participation guidelines; confirm whether the Bullseye community channel is permissible. | Day 5 channel test |
| **G5 — Accounts** | Stripe, domain, Anthropic API key, hosting, transactional email. | Day 3 |

**None takes more than a day. All are cheap now and expensive later.** These four gates are why every deep dive returned GO_**WITH_CHANGES** rather than GO.

### 10.3 Known research gaps — do not treat as findings

Recorded verbatim so Phase 2 does not mistake absence of evidence for evidence:

- **SEM keyword CPCs** — no keyword-planner data obtained. The most consequential unmeasured number in the plan.
- **Community sizing** — Reddit was unfetchable from the research environment; subreddit and Facebook group sizes are unquantified, so A2 rests on no external anchor.
- **Amazon Account Health Assurance** — official pages 404'd; eligibility, cost and coverage unconfirmed.
- **Riverbend PRO / Guardian pricing** — phone-gated; the insurance-bundle price point that most directly validates Shield remains unknown.
- **Suspension-radar feasibility** — storefront-deactivation detectability, ToS position and contact-data availability all unverified.
- **A5, A6, A8** and the §7.5 decision thresholds have no category-specific published basis and are **explicitly hypotheses**.
- **Thomson Reuters v. Ross** and **Meta v. Bright Data** — recalled, not verified in-session. Verify with counsel before relying.
- **Freelancer pricing ($50–300)** — estimate, not confirmed against transactions.

---

## 11. Vote tally and judge panel (reference)

### 11.1 Full Borda tally

| Rank | Idea | Score | Gap to leader |
|---:|---|---:|---:|
| 1 | **Reinstate** | **71** | — |
| 2 | DutyLens | 66 | −5 |
| 3 | WageLens | 65 | −6 |
| 4 | Certly | 64 | −7 |
| 5 | ScopeIQ | 48 | −23 |
| 6 | StayLegal | 42 | −29 |
| 7 | StateReady | 40 | −31 |
| 8 | Recoup | 36 | −35 |

### 11.2 The twelve judging lenses and their frameworks

| Lens | Frameworks the judge applied |
|---|---|
| pmf-evidence | Fitzpatrick *Mom Test*; Sean Ellis 40% benchmark; Andreessen market-pull |
| speed-to-revenue | Ries concierge/Wizard-of-Oz MVP; YC "make something people want" + "do things that don't scale" |
| simplicity | Christensen JTBD; Moore single-beachhead discipline |
| ai-buildability | Lewis et al. 2020 RAG; Karpathy *Software 2.0* / LLM OS |
| willingness-to-pay | Ramanujam WTP-first; Hormozi value equation + risk reversal |
| moat | Helmer *7 Powers*; Thiel *Zero to One* proprietary-technology test |
| distribution | Weinberg & Mares Bullseye; Hormozi Core Four |
| competition-gap | Christensen low-end disruption; Dunford competitive alternatives |
| churn-retention | Vohra's Superhuman PMF engine; Poyar/OpenView NRR research |
| market-size | Moore beachhead sizing + bowling-pin adjacency; Graham's "well" metaphor |
| monetization-clarity | *Monetizing Innovation* value-metric rule; OpenView PLG transparent tiering |
| execution-risk | Blank product-risk; Ries riskiest-assumption test |

---

## 12. Immediate next actions

| Priority | Action | Owner | By |
|---:|---|---|---|
| **1** | **Resolve the name (G1).** Kill "Reinstate." Candidate set for trademark + domain clearance: **Casewright**, **Standfast**, **Clearline**, **Appealwright**. *(Names are proposals, not cleared — availability and trademark status are **unverified hypotheses** and must be checked before registration.)* Keep "Reinstate" as an internal codename only. | Human | Day 0 |
| **2** | Clear G2–G5 (counsel, Agent Policy primary source, forum rules, accounts). | Human | Day 0 |
| **3** | Stand up the manual concierge motion — landing page + two Stripe links + delivery runbook + written triage-refusal list. **Take money before the product exists.** | Founder | Day 1–3 |
| **4** | Begin the daily community loop; 8–15 substantive replies/day; log every reply→visit→pay. | Founder | Day 2 onward |
| **5** | Execute the 5-day build (§7.6), with B9 (outcome capture) treated as un-cuttable. | Agents + human | Day 1–5 |
| **6** | Measure A1 (free→paid) within the first 100 classified sessions and A3 (SEM CPC) within the first week of the capped test — **the entire model is a function of these two numbers and both can be known within 30 days for under $2,000.** | Founder | Day 5–35 |
| **7** | Run 15–20 Blank-style discovery interviews with real suspended sellers (as onboarding calls), closing report 01's primary-research gap. | Founder | Day 1–30 |
| **8** | Instrument the Sean Ellis 40% survey from customer #1; run it formally at ≥40 paying customers. | Founder | Day 5 / Day 60 |

---

## References

Every framework applied in this dossier, with the source it comes from. Inline citations throughout the document point here.

### Idea selection, customer development and product-market fit
- **Paul Graham**, "How to Get Startup Ideas" (2012) — the "well" metaphor for deep narrow demand (§4.3); "Do Things That Don't Scale" (2013) — manual concierge fulfilment of the rush tier and the first-10-customers playbook (§6.8, §7.3 B8).
- **Eric Ries**, *The Lean Startup* (2011) — MVP definition as the minimum enabling a full build–measure–learn turn; value vs. growth hypotheses; riskiest-assumption-first ranking; concierge and Wizard-of-Oz MVPs; innovation accounting and pre-committed pivot-or-persevere rules; vanity metrics (§6.8, §7.1, §7.3, §7.5).
- **Steve Blank**, *The Four Steps to the Epiphany* (2005) — customer-discovery gates applied point-by-point (§3.2); discovery interviews embedded in onboarding calls (§6.8, §12); product-risk framing used by the execution-risk judge lens (§11.2).
- **Rob Fitzpatrick**, *The Mom Test* (2013) — evidence hierarchy (money spent > behaviour observed > stated intent); discounting self-serving vendor claims (§3.1, §3.4, §10.2 G3).
- **Sean Ellis**, product-market-fit survey — "How would you feel if you could no longer use this product?", ≥40% "very disappointed" threshold (§3.3, §7.5, §12).
- **Rahul Vohra**, "How Superhuman Built an Engine to Find Product/Market Fit," First Round Review (2018) — segmenting the "very disappointed" cohort rather than averaging; used by the churn-retention judge lens (§3.3, §11.2).
- **Marc Andreessen**, "The Only Thing That Matters" (2007) — market-pull test; the market pulling product out of the startup (§2, §5.1 context).
- **Y Combinator Startup School** / Michael Seibel, "How to Plan an MVP" — launch narrow and fast; make something people want (§7.3 B1, §11.2). *Note: the YC library page could not be fetched during research and is cited from the canonical framework, not a fetched quote.*

### Offers, sales and monetization
- **Alex Hormozi**, *$100M Offers* (2021) — the value equation (Dream Outcome × Perceived Likelihood ÷ Time Delay × Effort & Sacrifice), scored in §6.1; the Grand Slam Offer construction sequence and trim-and-stack; the guarantee taxonomy (unconditional / conditional / anti- / implied) in §6.3; genuine vs. manufactured urgency and scarcity; MAGIC offer naming; tripwire-to-continuity (§6.4-M2).
- **Alex Hormozi**, *$100M Leads* (2023) — the Core Four lead engines (warm outreach, post free content, cold outreach, paid ads), mapped in §6.5; lead-magnet design — solve a complete narrow problem free while making the next problem obvious (§6.2, §6.8).
- **Madhavan Ramanujam & Georg Tacke**, *Monetizing Innovation* (2016) — willingness-to-pay conversation before you build; the four failure modes (feature shock, **minivation**, hidden gem, undead) and why undercutting AppealDesk is a minivation (§6.2); segmentation by need and WTP never by demographics (§4.2); leaders / fillers / **killers** packaging (§6.1); bundling to raise WTP across a heterogeneous segment (§6.2); behavioural anchoring and decoy pricing (§6.1 lever 4).
- **Kyle Poyar / OpenView**, SaaS pricing, PLG and monetization research — "The state of B2B monetization in 2026" (n=230 B2B software/AI companies, Apr–May 2026): flat-fee used by 37% of companies under $5M ARR, hybrid pricing 25%→37% YoY, AI-native median 50% gross-margin target; "What's working to improve free-to-paid conversion" (n=200 products): median free-to-paid **8%**, card-required trials convert at **30%** ("more than 5×"), 57% free trial vs 26% freemium, 14-day trial most common (§6.2, §6.4, §6.7 A1/A5). Also the NRR/usage-frequency research used by the churn-retention judge lens (§11.2).

### Positioning and go-to-market
- **April Dunford**, *Obviously Awesome* (2019) — the 10-step positioning process walked explicitly in report 02; competitive-alternatives list (§5.1); unique attributes → value mapping (§5.3); "who cares a lot" beachhead identification (§4.1); market-category selection and the decision to define "Suspension Defense Copilot" rather than compete inside "AI POA generator" (§5.3); Step 7 win-against-each-alternative test (§5.4); Step 8 trend layering — cited, grounded AI (§2.3).
- **Gabriel Weinberg & Justin Mares**, *Traction* (2015) — the Bullseye framework (brainstorm all 19 channels → test 3–5 cheaply with pre-committed kill criteria → focus on the one that works); all 19 channels scored /25 in report 03 §4.1 (§6.5); Engineering as Marketing as a canonical pattern (HubSpot Website Grader, Moz free tools).
- **Geoffrey Moore**, *Crossing the Chasm* (1991) — single-beachhead discipline; S1 over S4; the exclusion of eBay/Etsy/TikTok Shop/KDP from v1 (§4.1, §4.2, §7.4 N8); beachhead sizing and bowling-pin adjacency used by the market-size judge lens (§11.2).

### Strategy and moats
- **Hamilton Helmer**, *7 Powers* (2016) — the moat audit in §5.5: Cornered Resource (claimed but not held), **Process Power** (the realistic 12–24 month path via a fast outcome-feedback loop), **Counter-Positioning** (against billable-hours consultancies structurally unable to chase a $49–149 self-serve price), Switching Costs (weak but buildable); the reason the outcome corpus is un-cuttable (§7.3 B9, §8.1, §10.1 R16).
- **Peter Thiel**, *Zero to One* (2014) — the proprietary-technology / "hard to replicate" test; the thin-wrapper warning applied honestly in §5.5.
- **Clayton Christensen**, *The Innovator's Dilemma* (1997) and the Jobs-to-be-Done framing — low-end vs. new-market disruption test (§5.6); the JTBD circumstance-and-job definition that keeps scope to one buyer, one trigger, one job (§1.2).
- **George Akerlof**, "The Market for 'Lemons': Quality Uncertainty and the Market Mechanism," *Quarterly Journal of Economics* 84(3), 1970 — adverse selection in the refund guarantee and the insurance-bundle design (§6.3, §6.4-M1, §10.1 R8).
- **Michael Rothschild & Joseph Stiglitz**, "Equilibrium in Competitive Insurance Markets," *Quarterly Journal of Economics* 90(4), 1976 — insurance-market selection, applied to the Shield bundle (§6.4-M1).
- **Barbara Fredrickson & Daniel Kahneman**, "Duration Neglect in Retrospective Evaluations of Affective Episodes," *Journal of Personality and Social Psychology* 65(1), 1993; **Daniel Kahneman**, *Thinking, Fast and Slow* (2011) — the **peak-end rule**, the basis for sequencing subscription conversion to the moment of relief rather than the moment of panic (§6.4-M2, §0 D6).

### Knowledge bases and AI engineering
- **Patrick Lewis et al.**, "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS 2020 — https://arxiv.org/abs/2005.11401 — retrieval-augmented models "generate more specific, diverse and factual language than a state-of-the-art parametric-only seq2seq baseline"; the architectural basis for cited, grounded drafting (§2.1, §5.3, §6.1 lever 1, §7.3 B3).
- **Andrej Karpathy**, "Software 2.0" (2017) — https://karpathy.medium.com/software-2-0-a64152b37c35 — the dataset that defines desirable behaviour is the primary artifact; and the corollary drawn in §7.4 N6, that it does not follow the dataset must be compiled into weights (§8, §7.3 B9). Karpathy's LLM OS talks inform the orchestration framing used by the ai-buildability judge lens (§11.2).
- **Anthropic**, "Building Effective Agents" — https://www.anthropic.com/engineering/building-effective-agents — the workflow/agent distinction ("predefined code paths" vs. "dynamically direct their own processes"), "find the simplest solution possible," and the named patterns used here: **prompt chaining**, **routing**, **evaluator-optimizer** (§0 D9, §7.3 B2/B5/B6, §7.4 N7).
- **Anthropic**, "Writing Tools for Agents" — https://www.anthropic.com/engineering/writing-tools-for-agents — run evaluations programmatically and iterate; the basis for B10 (§7.3).
- **Anthropic**, "Introducing Contextual Retrieval" — https://www.anthropic.com/news/contextual-retrieval — contextual embeddings cut retrieval failure 35%, +contextual BM25 49%, +reranking 67%; adopted only when the corpus outgrows the context budget (§8.5).
- **Anthropic**, Citations documentation — https://platform.claude.com/docs/en/build-with-claude/citations — `citations: {enabled: true}` returning `cited_text` with source locations; the mechanism that makes "no uncited policy reference reaches the UI" a code-level invariant (§7.3 B4, §8.4c).
- **Anthropic**, Prompt caching documentation — https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching — cache reads at 0.1× base input with a 1-hour TTL at 2× write; the economics that make a vector database unnecessary in v1 (§2.2, §7.4 N5, §8.5).

### Case law and regulatory sources
- **Van Buren v. United States**, 593 U.S. ___ (2021) — CFAA "exceeds authorized access," the gates-up-or-down rule; improper *purpose* is not a violation (§8.4a).
- **hiQ Labs v. LinkedIn** (9th Cir. 2019/2022; N.D. Cal. Nov 2022) — public data is outside the CFAA, **but** hiQ was held to have breached LinkedIn's User Agreement; "not a federal crime" is not "not actionable" (§8.4a–b).
- **Thomson Reuters v. Ross Intelligence** (D. Del., Feb 2025) — fair use rejected where a startup used a competitor's copyrighted material to build a competing product — **recalled, NOT verified in research session; verify with counsel before relying** (§7.4 N12, §8.4c).
- **Meta v. Bright Data** (N.D. Cal., 2024) — logged-out scraping of public data and ToS accepted by logged-in users — **recalled, NOT verified in research session; verify with counsel before relying** (§8.4b).

### Primary market and platform sources (fetched during research)
- Riverbend Consulting — https://riverbendconsulting.com/ (400+ appeals/month; 10,000+ sellers; PRO and GUARDIAN plans; 4.6★/336 reviews) and its seller survey — https://riverbendconsulting.com/blog/amazon-seller-survey/
- reinstate.io — https://reinstate.io/ (trading since 2019; 500+ cases; 85%/92% self-reported success; **the name collision**)
- AppealDesk — https://getappealdesk.com ($97 flat; comparison table $3,500 attorney / $1,250 consultant; the six refused categories; "honest triage")
- AppealDraft — https://www.appealdraft.org ($149 flat; full refund on rejection; "no automation or account access"; the unverified "Amazon March 2026 Agent Policy" claim; "$500 to $2,500" consultant band)
- AppealAI — https://appealai.pro ; PlatformAppeal — https://www.platformappeal.com/help ; planofactiontemplate.com ($49); Amazon Appeal Wizard / ReinstateIQ case study — https://amplence.com/case-studies/amazon-appeal-wizard
- SellerCandy — https://sellercandy.com/amazon-suspension-appeal-service ($997–$2,500/mo) ; The Appeal Guru — https://theappealguru.com ($495 / $1,495 / $2,495; $179.95–309.95/yr monitoring) ; eCommerceChris — https://www.ecommercechris.com/ ; Amazon Sellers Lawyer — https://amazonsellerslawyer.com/ ; Seller Interactive — https://www.sellerinteractive.com/
- SellerSonar pricing — https://sellersonar.com/pricing ($19.98–89.98/mo) ; Helium 10 Alerts — https://www.helium10.com/tools/alerts/ ($99–$1,499+/mo tiers)
- Amazon Seller Forums — https://sellercentral.amazon.com/seller-forums/ and robots.txt — https://sellercentral.amazon.com/robots.txt (allows `/seller-forums`, disallows `/forums/search*`)
- Amazon SP-API — Notification Type Values (`ACCOUNT_STATUS_CHANGED`), Registering as a developer, Roles in the Selling Partner API — https://developer-docs.amazon/sp-api/docs/
- Walmart Marketplace Learn — "Appeal an account suspension" — https://marketplacelearn.walmart.com/guides/Seller%20Account%20Management/Appeal-an-account-suspension
- SellerApp Amazon seller statistics — https://www.sellerapp.com/blog/amazon-seller-statistics/ ; SmartScout "Voice of the Amazon Seller 2025" via Businesswire — https://www.businesswire.com/news/home/20250312917598/ ; Entresource suspension statistic via USA Today syndication
- Kyle Poyar, Growth Unhinged — https://www.growthunhinged.com/p/the-state-of-b2b-monetization-in-2026 and https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion

---

**Document status:** definitive for Phase 2. Amendments require a named source and a note of what they supersede.
