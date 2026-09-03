# StateReady — Offer & Landing conversion research

**Agent:** Offer & Landing (StateReady), phase-4 wave 1. **Date of all fetches:** 2026-09-03.
**Method:** PIPELINE.md stages 1–3 (ideation → research → verification). Every load-bearing claim below
carries a URL that was fetched in this session. Where a claim could only be reached through a secondary
page it is labelled `secondary`. Where two attempts failed it is labelled `BLOCKED` and left as a gap.
**Frameworks applied:** Hormozi *$100M Offers* (value equation, Grand Slam construction, guarantee
taxonomy, MAGIC naming); Suby *Sell Like Crazy* (Godfather offer); Wiebe / Copyhackers (Rule of One,
awareness-dictates-length, MMUSP, voice-of-customer); CXL (B2B landing page infrastructure); Unbounce
Conversion Benchmark Report; Nielsen Norman Group (scanning behaviour); Poyar / OpenView (monetization
and free-to-paid benchmarks); Ramanujam *Monetizing Innovation* (WTP-first, leaders/fillers/killers);
Dunford (competitive alternative); Akerlof 1970 (adverse selection, applied to guarantees).

**Headline finding, stated first because it invalidates a phase-1 premise:**
the phase-1 shortlist says StateReady's willingness to pay is *observed*, because
"LicensedTrades.com already sells $199–1,199/mo." **It does not sell anything.** LicensedTrades.com and
LicenseRoadmap.com are both pre-launch waitlists published by the same company, Rovaryn Digital Inc.
(§3.1). The $199–$1,199 band is a **published rate card, not revealed willingness to pay**, and the two
"independent" phase-1 evidence URLs collapse to a single operator. Everything downstream of that premise
— including the price ladder in `OFFER.md` — has been rebuilt on prices that are actually transacted
(§3.3, §3.4).

---

## 1. Stage 1 — Ideation: three offer angles and three page angles

Per PIPELINE.md the gate is "at least three options, each with the buyer's point of view". These were
generated before the research below and are scored against it in §6.

### 1.1 Three offer angles

| | **A — The Compliance Calendar** | **B — The State Entry Pack** | **C — Permit Continuity** |
|---|---|---|---|
| **What is sold** | A subscription that tracks every credential and alerts before it lapses. Expansion report is an upsell. | A productised one-off: a cited, step-by-step playbook for entering one state × one trade, delivered in days. Tracking is included for 12 months. | A per-state annual "you will not lose the right to work here" service, framed as insurance. |
| **Buyer's point of view** | *"I have a spreadsheet and it is a liability. Give me a better spreadsheet."* | *"We just closed on a company in Tennessee and nobody here knows Tennessee."* | *"I do not care about software. I care that we never get stopped."* |
| **Value-equation shape** | Dream outcome moderate; **time delay bad** — the first real proof arrives at the next renewal, which may be months away. | Dream outcome high, **time delay excellent** (days vs the expediter's weeks), perceived likelihood high because the artefact is inspectable before it is trusted. | Dream outcome highest; perceived likelihood low (we are unknown); invites a guarantee we cannot underwrite. |
| **Priced against** | Trackers, which transact at **$39.99–$499 per year** (§3.4). Fatal: this angle drags us into a category priced ~10× below target. | Expediters, which transact at **$399 per application and up**, quote-gated, 4–8 weeks (§3.3). | Nothing comparable; the anchor would have to be the customer's own downtime, which we cannot verify for them. |
| **Verdict** | **Continuity, not entry.** | **Chosen as the front door.** | **Chosen as the *message*, rejected as the *mechanism*.** |

**Resolution carried into `OFFER.md`:** the core recurring product stays the subscription (the brief's
default), but it is *entered* through the productised one-off and it is *sold* in C's language. Angle A
alone cannot support $149–$599/mo, because tracking is a commodity at a tenth of that price (§3.4); Angle
B alone caps volume at expansion events; Angle C alone is an uninsured insurance contract (§5.4).

### 1.2 Three page angles

| | **P1 — The Map** | **P2 — The Divergence** | **P3 — The Ledger** |
|---|---|---|---|
| **Organising idea** | A US map of the buyer's own footprint, lit green/amber/red. "Here is your exposure." | Two states, one trade, side by side, with the state board pages cited. "Here is why your spreadsheet is wrong." | A running cost-of-a-lapse counter. "Here is what one missed date costs." |
| **Buyer's point of view** | *"That is my company."* Instant recognition, low education cost. | *"I did not know Texas HVAC was 8 hours and Texas electrical was 4."* Teaches something true in five seconds. | *"You are guessing at my numbers."* |
| **Evidence fit** | Strong: the map needs no claims we cannot source. | Strongest: every cell is a fetched regulator URL (§4). It is simultaneously the proof block, the demo and the moat. | **Weak and disallowed** — every incumbent loss figure we found is a vendor's own unsourced estimate (§3.2). Under PLAN.md A10 and the "never invent numbers" constraint we may not publish them. |
| **Verdict** | **Hero.** | **The spine of the page and the demo.** | **Rejected.** Replaced by regulator-sourced consequences (§4.3), which are stronger *because* they are citable. |

---

## 2. What converts for a B2B buyer like this — the conversion literature

### 2.1 Reading behaviour sets the word budget

Nielsen Norman Group's foundational study of web reading found that **"79 percent of our test users always
scanned any new page they came across; only 16 percent read word-by-word."** The measured usability gains
from rewriting were: concise text **58% better**, scannable layout **47% better**, objective (non-
promotional) language **27% better**, and all three combined **124% better usability**. NN/g's specific
prescriptions are highlighted keywords, meaningful sub-headings, bulleted lists, **one idea per
paragraph**, the inverted pyramid, and **"half the word count (or less) than conventional writing."**
They also note that **"promotional language imposes a cognitive burden"** because the reader has to filter
exaggeration out before extracting fact.
[nngroup.com/articles/how-users-read-on-the-web](https://www.nngroup.com/articles/how-users-read-on-the-web/)

**Consequence for StateReady:** the 27%-from-objective-language finding is unusually load-bearing here.
Our buyer is a compliance professional whose entire job is filtering vendor exaggeration. Promotional
tone does not merely under-perform on this page — it actively signals that our regulatory data is also
marketing. The page must read like a state board notice, not like an ad.

### 2.2 Word count and reading level, measured

Unbounce's Conversion Benchmark Report gives the SaaS category a **median landing-page conversion rate of
3.8%**, against a **6.6% all-industry baseline**. On copy: pages of **250–725 words** convert best, using
**50–140 "difficult" words** (three or more syllables). The report states **"simple copy converts 514%
better than overly difficult copy"**, with 5th–7th grade reading level pages at **12.9%** versus
**2.1%** for professional-level copy. Mobile converts at 6.4% vs desktop 6.2% and **drives 79% of landing
page visits**. Email traffic converts at **16.9%**, "over 4x better than other channels".
[unbounce.com/conversion-benchmark-report/saas-conversion-rate](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)

**Consequence:** the brief's "under 450 words above pricing" sits comfortably inside the 250–725 band once
the pricing block and FAQ are counted. It also means the page cannot carry the education load in prose —
it must carry it in the visuals and the demo. The 16.9% email figure matters because our primary channel
is our own outbound (PLAN.md D4), so the page's job is to convert *warm, already-primed* readers, which
argues for shorter and more concrete, not longer.
The 79%-mobile figure is a benchmark across all Unbounce traffic, not B2B specifically; treated as a
reason to build mobile-first, not as a prediction of our own split.

### 2.3 Wiebe / Copyhackers — the copy method, and the one rule we cannot follow

From Joanna Wiebe's *The Conversion Marketer's Guide to Landing Page Copywriting* (fetched as PDF and
text-extracted to `offer/raw/wiebe-landing-copy.txt`):

- **One goal per page.** *"Every landing page should have one goal. Only one goal. Not one primary goal
  with three supporting goals and a few bonus calls to action sprinkled in here and there."*
- **One CTA.** *"You should have a maximum of one CTA per landing page… That one CTA can be repeated on
  the page — such as at the mid-point and the very bottom — as long as both CTAs are supporting the one
  goal."* Passive CTAs (social icons, site navigation) count as CTAs and *"shouldn't be on the page unless
  there is only one of them and it is the primary CTA."*
- **Awareness dictates page length.** Five stages, after Gene Schwartz: Most Aware, Product Aware,
  Solution Aware, Pain Aware, Unaware. *"Those who are Most Aware need a smidgen of copy… but those who
  are only Pain Aware will require a lot of education."* Wiebe recommends writing the Pain Aware page
  first and cutting down.
- **MMUSP** — a message-matched unique selling proposition belonging in the hero headline and subhead:
  the hero must *"match the message of the call to action that drove visitors"* **and** *"describe what's
  uniquely desirable about your offering."*
- **Stop trying to write.** The guide's single hardest data point: in a three-way headline test, the
  headline **swiped verbatim from a customer testimonial** produced a *"statistically confident 103% lift
  in clicks"*, while the professionally written challenger produced *"an abysmal (and not confident) 64%
  drop."* Wiebe's conclusion: *"the headlines that were written by non-customers tanked in comparison to
  the headline swiped from real customer language."*
- **Great testimonials replace copy** — *"it's far more powerful than regular marketing copy because
  you're not the one saying it."*
[unbounce.com/photos/The-Conversion-Marketers-Guide-To-LandingPage-Copywriting.pdf](https://unbounce.com/photos/The-Conversion-Marketers-Guide-To-LandingPage-Copywriting.pdf)

**The problem this creates, and the resolution.** The highest-leverage technique in the literature —
swipe the headline from customer language — is **unavailable to us**. StateReady has no customers, and
PLAN.md forbids inventing testimonials. Wiebe's finding is that copy written by a marketer loses to copy
written by someone with authority over the problem.

**Resolution: swipe from the regulator instead of from the customer.** The state boards write about this
problem with more authority than any customer, in public, in language we may quote verbatim and cite.
California's board writes: **"You cannot actively contract with an expired, inactive, or suspended
license."** (§4.3). That sentence is voice-of-authority copy with a `.gov` citation behind it, it is
exactly what our buyer fears, and it is free. This is the single most important tactical decision in
`LANDING_SPEC.md`.

**Awareness level.** Our traffic arrives from our own cold outbound (PLAN.md D4) to organisations selected
because they are visibly multi-state. They are **Pain Aware to Solution Aware**: they know renewals hurt,
many do not know dedicated software exists. Wiebe says that audience needs a lot of education. The brief
caps us at 450 words above pricing. These are only reconcilable one way — **the education is delivered by
the interactive demo and the diagrams, not by prose.** That is the evidence base for "felt, not read".

### 2.4 CXL — B2B page structure and instrumentation

CXL's B2B landing-page playbook: six pillars — messaging/positioning, social proof, personalisation,
CTAs, design/usability, analytics/experimentation. On message match it warns against the *"hard
disconnect"* between the ad promise and the headline, and prescribes a hierarchy of **headline (prove
relevance) → subheading (acknowledge pain + hint at approach) → CTA (reflect buyer readiness)**. It
advises **one primary CTA** to avoid decision paralysis, citing *"Custom CTAs convert 42% more visitors
than generic buttons"*, and that button text should match commitment level. Notably it argues *against*
dogmatic above-the-fold CTA placement, recommending placement *"where it feels natural"* because visitors
scan before deciding. Social proof belongs *"where doubt peaks most": after main value proposition, before
pricing, and especially near CTAs*. Measurement should track impression-to-visit, visit-to-lead and
lead-to-qualified.
[cxl.com/blog/landing-page-infrastructure](https://cxl.com/blog/landing-page-infrastructure/)

**Consequence:** CXL's "social proof where doubt peaks" rule is what determines placement of our
substitute for social proof. We have no logos and no testimonials, so what sits immediately before the
pricing block is the **redacted sample State Entry Pack page and the cited-source chips** — the artefacts
that answer "can I trust the data" at exactly the moment that doubt peaks.

### 2.5 Hormozi and Suby — offer construction

Acquisition.com's *Offers* curriculum is organised into the modules that define the framework this offer
is built on: *Picking Markets, Charge Its Worth, The Value Equation, Offer Creation, Bonuses, Guarantees,
Scarcity & Urgency, Naming Products*.
[acquisition.com/training/offers](https://www.acquisition.com/training/offers)
The value equation itself: **Value = (Dream Outcome × Perceived Likelihood of Achievement) ÷ (Time Delay ×
Effort and Sacrifice)** — maximise the numerator, minimise the denominator; if the denominator approaches
zero, value approaches infinite. `secondary`, corroborated against Hormozi's own account:
[tiktok.com/@ahormozi/video/7336007528070958382](https://www.tiktok.com/@ahormozi/video/7336007528070958382)

Suby's Godfather Offer, as documented in a nine-element breakdown: **Value, Specificity, Novelty, Risk
Reversal, Scarcity, Rationale, Clarity, Pricing, Bonuses** — with *Rationale* ("explain why you've crafted
such a compelling offer, to overcome skepticism") and *Clarity* ("the offer can be understood in one or
two sentences") as the two elements most often missing.
[futureproofmarketers.com/post/godfather-offer-framework](https://futureproofmarketers.com/post/godfather-offer-framework) `secondary`

**Consequence:** Suby's *Rationale* element is the one that does real work for us. A godfather-priced
first state ($750 against a $1,500 list) reads as desperation unless there is a stated reason. Ours is
true and stateable: **the first state a customer buys is the state whose rulebook we then maintain for
every subsequent customer.** We are buying knowledge-base coverage, and we should say so.

### 2.6 Poyar / OpenView — pricing and trial benchmarks

*The 2026 State of B2B SaaS and AI Monetization Report*, **n = 230 software companies, surveyed April–May
2026**: **"Three-in-four software companies changed either pricing or packaging within the last year."**
Hybrid pricing is now the most common approach at **37%**, up from **25%** twelve months earlier.
**Early-stage companies under $5M ARR favour flat fees at 37% adoption**; companies over $150M ARR retain
per-seat at 29%. On margins: **"The median target AI margin is about 50%. Only 12% aim for SaaS-like gross
margins of 80%+ for their AI products."**
[growthunhinged.com/p/the-state-of-b2b-monetization-in-2026](https://www.growthunhinged.com/p/the-state-of-b2b-monetization-in-2026)

Free-to-paid research, **n = 200 B2B software products, January 2026**, respondents typically $1–10M ARR
with ARPU $50–249/mo: **median free-to-paid conversion 8%**; **"Free trials that require a credit card see
30% free-to-paid conversion – more than 5x ones that don't require one"**, though only **20% require a
card**; **57% of products use a free trial as the primary landing point vs 26% freemium**; **the most
common trial length is 14 days (62%)**.
[growthunhinged.com/p/how-to-improve-free-to-paid-conversion](https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion)

**Consequence, and the reason we deviate from the 14-day benchmark:** a 14-day free trial of StateReady
would be 14 days spent on data entry the buyer will not do. Time-to-value is gated by roster loading, not
by the clock. The card-on-file finding is what we keep; the free-trial format is what we discard. See
§6.3 and `OFFER.md` §7.

---

## 3. The competitive alternatives — re-verified

Per Dunford, price and position against the **competitive alternative** — what the buyer does today if we
do not exist. For this buyer there are four, and they sit at wildly different prices.

### 3.1 VERIFICATION FINDING — LicensedTrades.com and LicenseRoadmap.com are one pre-launch operator

The brief asked me to re-open LicensedTrades' pricing. The rate card verified exactly, from the raw HTML
of the pricing page (cached at `offer/raw/licensedtrades-pricing.html`):

| Tier | Monthly | Annual | Licensed employees | Operating states | Notable |
|---|---|---|---|---|---|
| Essentials | **$199/mo** | $1,990/yr | up to 5 | 1 | 3 seats, 90/60/30/7-day alerts, bid-ready PDF, 48hr support |
| Professional | **$349/mo** | $3,490/yr | up to 15 | 3 | + bond & insurance certificate tracking, CE hours, 24hr support |
| Business | **$599/mo** | $5,990/yr | up to 50 | unlimited | + subcontractor module, audit log, webhooks, 12hr support |
| Enterprise | **$1,199/mo** | $11,990/yr | unlimited | unlimited | + public API, SSO/SAML, custom branding, 4hr support |

Also verified verbatim: extra seats **"$15/month each"**; **"A 3-day free trial is available for all
tiers, no credit card required"**; **"Is there a free tier? No."**; data retained 90 days after
cancellation. [licensedtrades.com/pricing](https://licensedtrades.com/pricing)

**Contradiction resolved.** A search-result summary asserted a *14-day* free trial. The primary page says
**3 days**. Primary source wins; the 14-day figure is discarded.

**The finding that matters.** Three things line up:

1. Both **licensedtrades.com** and **licenseroadmap.com** carry the identical footer:
   *"© 2026 Rovaryn Digital Inc. · LicensedTrades.com Built by Rovaryn Digital Inc."* and
   *"© 2026 Rovaryn Digital Inc. · LicenseRoadmap.com Built by Rovaryn Digital Inc."*
2. LicenseRoadmap's article *"Best Contractor License Tracking Software for Trade Firms (2026)"* is
   bylined **"By Rovaryn Digital · May 30, 2026"** and its top-rated product, *"License Renewal Dashboard
   (by LicenseRoadmap)"*, carries **exactly the same ladder** — $199 / $349 / $599 / $1,199, annual
   $1,990 / $3,490 / $5,990 / $11,990. It is a self-review.
3. The primary call to action on **both** home pages is **"Join the Waitlist"**. Neither product is
   selling. LicensedTrades' hero reads *"Join the Waitlist · 3-day free trial · No credit card required"*.

[licensedtrades.com](https://licensedtrades.com/) ·
[licenseroadmap.com](https://licenseroadmap.com/) ·
[licenseroadmap.com/blog/best-contractor-license-tracking-software](https://licenseroadmap.com/blog/best-contractor-license-tracking-software)

**Therefore:** the phase-1 shortlist's claim that *"Willingness to pay is observed, not asserted…
LicensedTrades.com already sells $199–1,199/mo"* is **not supported**. Two of the six phase-1 evidence
URLs are one company, and that company has not been observed taking a dollar. The $199–$1,199 band is a
**competitor's guess at the market's price**, which is useful as a positioning anchor and worthless as
proof of demand.

**What this does not mean.** It does not mean the band is wrong. It means we may not *rely* on it, we must
find the price from alternatives that transact (§3.3, §3.4), and — commercially — it means the incumbent
we were most worried about has not shipped. LicenseRoadmap already advertises a *"50-State Requirement
Library… Human-curated, quarterly-refreshed"*, so the intended moat is contested on paper but not in
market.

### 3.2 A related trap: every published loss figure in this category is a vendor's own estimate

LicensedTrades publishes a detailed cost-of-lapse model — *"$15,000–$25,000 in lost and delayed revenue"*
for a two-week lapse at a 10-person shop, *"$500–$5,000 for a first offense"*, *"$10,000–$50,000 in
bidding opportunity per year"*, *"Total annual exposure … $29,700–$84,800/year"*. LicenseRoadmap
publishes a parallel set — *"A stop-work order … costs $5,000–$25,000 per incident"*, *"License
reinstatement fees run $200–$8,000 per license"*.

**None of these carry a source.** They are marketing estimates by a company with no customers. Under
PLAN.md A10 and the fleet's "never invent numbers" constraint, **StateReady may not reuse any of them,
paraphrase them, or publish a comparable figure of its own.** This is why page angle P3 (§1.2) was
rejected. §4.3 supplies the replacement: consequences we can cite to the regulator.

### 3.3 The expediters — what the transition actually costs today

This is the category that genuinely transacts, and it is the correct anchor for the State Entry Pack.

| Firm | What is sold | Published price | Source |
|---|---|---|---|
| **Florida Contractor Licensing LLC** | Application preparation, submission, deficiency correction, bond/insurance referrals | **"a one-time fee of $399"** per application; the same **$399** to qualify an additional business entity, and **$399** to grandfather an existing licence. Explicitly excludes state fees, credit check, fingerprinting. | [floridacontractorlicense.org/florida-contractor-license-cost](https://floridacontractorlicense.org/florida-contractor-license-cost/) |
| **Harbor Compliance** | Managed licensing, Entity/License/Tax Manager software, and **Compliance Core™**, described as a nationwide licensing database of **"800+ licenses and 1,500+ filings"** with forms, filing fees, renewal dates and agency links | **Quote-only.** *"Filing fees depend on your individual situation."* No price published. | [harborcompliance.com/compliance-solutions-construction-firms](https://www.harborcompliance.com/compliance-solutions-construction-firms) |
| Harbor Compliance (listing) | — | Listed at **"$99 per feature, per month"** starting price, on **0 user reviews** | [capterra.com/p/196555/Harbor-Compliance](https://www.capterra.com/p/196555/Harbor-Compliance/) `secondary` |
| **API Processing** | Out-of-state / nationwide contractor licensing, qualifier placement, CE, bonds. **"over 30 years in the licensing industry"** | **No price published anywhere on the page.** The page's only conversion path is a phone number and a quote form. | [apiprocessing.com/nationwide-contractor-licensing](https://apiprocessing.com/nationwide-contractor-licensing/) |
| **Contractor's License Guru** | California exam prep kits and licensing guidance | Sells study kits; the licensing content is educational. Publishes CSLB fee detail (§4.2) rather than its own service fee. | [contractorslicenseguru.com/california-contractors-license-costs-fees-renewals-hidden-expenses](https://contractorslicenseguru.com/california-contractors-license-costs-fees-renewals-hidden-expenses/) |
| **CSC** | "Business license solutions" appears in CSC's own solutions navigation; enterprise, quote-gated | **BLOCKED** — both candidate URLs returned 404 after two attempts; only the nav label is confirmed. | `offer/raw/csc-bls.html` |
| **"RCI"** | named in the brief as an expediter | **BLOCKED** — two searches returned no firm of that name in contractor-licence expediting. Not used. | — |

**Reading of this table.** The transacting price for *"get me licensed in one more state"* starts at
**$399 of service fee plus state fees**, and rises into quote-gated territory as soon as the engagement is
multi-state. Three of the five firms will not publish a number at all, which is itself the most useful
competitive fact we have: **the alternative to StateReady's expansion product is a phone call and a
proposal.** A published, fixed price is a differentiator before the product is even described.

### 3.4 The trackers — what "tracking" is actually worth

| Product | Buyer | Published price | Source |
|---|---|---|---|
| **Propelus CE Broker — Professional** | individual licensed professional | **"Starting at $39.99 /yr"** — CE compliance transcript, expiration tracking for licences/credentials/certifications, multiple licences, stored certificates, agency alerts | [cebroker.com/professional](https://cebroker.com/professional) |
| Propelus CE Broker — Basic / Concierge | individual | Basic free; **Concierge $124.99/yr** | [cebroker.com/plans](https://cebroker.com/plans) `secondary` on the Concierge figure |
| Propelus CE Broker — organisations | employers **"with more than 150 employees"** | Quote-only, *"Contact sales"* | [cebroker.com](https://cebroker.com/) |
| **StateRequirement License Alert** | professionals across insurance, real estate, contracting, healthcare | **Basic $99/year** (1 licence) · **Professional $299/year** (up to 5) · **Enterprise $499/year** (up to 10). Claims *"50,000+ Licenses Monitored"* and *"4.8/5 from 1,500+ professionals"* | [staterequirement.com/license-alert](https://staterequirement.com/license-alert/) |

**The finding that sets our floor and our positioning.** Renewal tracking, sold as renewal tracking,
transacts at **$40 to $499 per year** — roughly **$3 to $42 per month**. CE Broker is the closest thing to
a proof case for the whole "structured regulatory data as a moat" thesis: it is the incumbent of exactly
this pattern in healthcare, it is trusted by state boards, and it charges an individual **$39.99 a year**.
Its real money is in the board and employer contracts, which are quote-gated.

**Therefore StateReady cannot be sold as a tracker at $149–$599/mo.** At that price the buyer is not
purchasing reminders; they are purchasing (a) the per-state, per-trade requirement intelligence that makes
the reminders correct, and (b) the ability to enter a new state. If a prospect only wants reminders for a
handful of licences, the honest answer is to point them at CE Broker or StateRequirement — and saying so
out loud is a credibility asset, not a lost sale (Hormozi's honest-triage lever, carried over from
`phase-1-ideation/research/03-gtm-pricing.md` §2.2).

### 3.5 The field-service platforms — is there already a licence-tracking app?

**Corrected after reconciliation with `PERSONA.md` (§10, O1). The honest answer has two halves, and the
first draft of this section got the second half wrong.**

**(a) In the marketplaces: no.** Neither ServiceTitan's nor Housecall Pro's app marketplace contains a
compliance, credential or licensing app or category.

**(b) In the platforms themselves: partly, and this is the strongest objection we face.** Housecall Pro
ships native credential tooling and says so on its own page: it helps HVAC professionals *"stay on top of
license and certification requirements with built-in tools to store documents, track expiration dates, and
set automatic renewal reminders"*, including uploading *"supporting documentation like CEU completions or
test results"*. What it explicitly does **not** claim is any state-by-state requirement data, CE hour
rules, or reciprocity — it *"positions itself as a storage and reminder system for existing documentation,
not as a source of regulatory information."*
[housecallpro.com/licensing/hvac](https://www.housecallpro.com/licensing/hvac/)
ServiceTitan users can likewise add a custom field to hold a date (`PERSONA.md` O3).

**This sharpens rather than weakens the thesis, and it changes what we are allowed to say.** The commodity
is not just *tracking*, it is *the reminder itself* — already free inside a platform the buyer pays for.
**The product is the rulebook behind the date, not the date.** Housecall Pro stores the number a
coordinator types; it cannot tell her that one of Texas's eight ACR hours must be Texas law, that a Texas
ACR licence expired past 90 days renews at twice the fee, or that a California qualifier disassociation
starts a clock on the company's licence.

Any copy claiming "your FSM platform doesn't do this" is **false and easily falsified by the prospect**.
The correct claim is narrower and stronger: *they store the date; they do not hold the rule.*

**The marketplace evidence, unchanged:**

- **ServiceTitan App Marketplace.** The marketplace organises partners into 20+ categories: *Marketing,
  Catalogs & Pricebooks, Suppliers, Leads & Bookings, On-The-Job, Live Services, Accounting & Tax,
  Procurement, Associations, Payments & Financing, HR & Payroll, Measurements & Estimations, Business
  Intelligence & Analytics, Fleet & GPS, Property & Facilities Management, Sales and Leads, E-Commerce,
  Telecom, Dispatch, Inventory, **Permitting**, Admin & Operation, Payment Processing*. **There is no
  compliance, credential, licensing or certification category.**
  [marketplace.servicetitan.com](https://marketplace.servicetitan.com/)
- ServiceTitan's published integrations documentation lists integrations under Job Tools Reporting,
  Reputation Management, Lead Management, Call Centers/Booking, Estimate Building, Sales Tools, Call
  Booking/Scheduling, Marketing Services and GPS — **none relating to licensing, credentials or
  regulatory compliance.**
  [help.servicetitan.com/docs/available-servicetitan-integrations](https://help.servicetitan.com/docs/available-servicetitan-integrations)
- ServiceTitan is tightening the marketplace: all new apps must pass certification before launch, apps
  must re-certify annually, and the stated goal is to certify every app by 2026.
  [servicetitan.com/blog/app-marketplace-relaunch](https://www.servicetitan.com/blog/app-marketplace-relaunch) `secondary`
- **Housecall Pro.** Its app store lists roughly twenty integrations — *Alexa, Beeline Routes, Broadly,
  CallRail, Chiirp, CompanyCam, Dispatch.Me, Emitrr, Fundbox, Gusto, Mailchimp, measureQuick, NiceJob,
  OnCall Air, Ply Inventory Management, Podium, ResponsiBid, Swell, Zapier, APIs/Webhooks* — **none for
  licensing or compliance.** Housecall Pro does publish a *"Licensing — Know what you need"* content
  resource, i.e. it treats licensing as an article, not a product.
  [housecallpro.com/integrations](https://www.housecallpro.com/integrations/) ·
  [help.housecallpro.com/en/collections/75094-app-store](https://help.housecallpro.com/en/collections/75094-app-store) `secondary`

**Two consequences, one of them uncomfortable.** The whitespace is real and can be stated on the page
without exaggeration. But whitespace in a marketplace cuts both ways: **there is no marketplace
distribution to acquire, and there is a category-defining incumbent (ServiceTitan) that could add
credential tracking as a feature.** The defence is the same thing that makes the product hard: the cited,
maintained, per-state × per-trade requirement library. ServiceTitan can build a date field in a sprint; it
will not maintain fifty boards' rulebooks for a feature.

### 3.6 The industry's own admission that the data is fragmented

NASCLA — the National Association of State Contractors Licensing Agencies — exists to run a shared
commercial contractor exam accepted by multiple states, and publishes a **Contractor State License
Information Directory (CSLID)**, State Business and Law exam material, a CE Program, and per-state
licensing information as reference material. Its navigation confirms the structure: *Examinations ·
Participating State Agencies · Electrical Exams · State Licensing Information · CE Program · CSLID*.
[nascla.org](https://www.nascla.org/)

**Reading:** a trade association had to build a directory because the underlying data is scattered — and
what it built is a *directory*, i.e. static reference, not a live per-company calendar. That is the gap.
It is also a warning: the reciprocity story is more complicated than "NASCLA solves it", because passing
the NASCLA exam does not by itself license anyone anywhere.

---

## 4. The regulatory facts we are allowed to put on the page

Under PLAN.md A10 every regulatory value needs `source_url` and `last_verified`. These were fetched
2026-09-03 and are the raw material for the headline, the demo and the urgency section. The Product
Owner's `KNOWLEDGE_BASE.md` owns the canonical store; these are the ones the offer and page depend on.

### 4.1 Divergence within a single state — the demo's best five seconds

| Jurisdiction | Trade | Requirement, verbatim | Source |
|---|---|---|---|
| Texas (TDLR) | Air conditioning & refrigeration contractor | **"you must complete 8 hours of continuing education"**, *"including one hour of instruction in Texas state law and rules that regulate the conduct of licensees"*. Timing: **"Continuing education courses must be completed before your license expires."** For late renewal, CE must have been completed *"within the one year period immediately prior to the date of renewal."* | [tdlr.texas.gov/acr/acrce.htm](https://www.tdlr.texas.gov/acr/acrce.htm) |
| Texas (TDLR) | Electrician | **"4 hours of continuing education prior to each license renewal"**, covering the National Electrical Code, Texas Electrician Law (Title 8, Occupations Code ch. 1305), Texas Electrician Administrative Rules (16 TAC ch. 73) and **NFPA 70E** electrical safety. Certificates must be retained one year. | [tdlr.texas.gov/electricians/elecce.htm](https://www.tdlr.texas.gov/electricians/elecce.htm) |

**One state. One regulator. Two trades. Eight hours versus four, with different mandated topics.** This
verifies the claim carried in the phase-1 `TradeCred` raw idea, which had asserted it without a regulator
citation. It is the most efficient possible demonstration that a single spreadsheet column called
"CE hours" is wrong, and it is the exact pair the no-login demo should default to.

### 4.2 Renewal cycles and the price of being late

| Jurisdiction | Fact, verbatim | Source |
|---|---|---|
| California (CSLB) | **"Active licenses expire every two years."** Timely active renewal **$450** sole owner / **$700** non-sole owner. **Delinquent** active renewal **$675** / **$1,050**. | [cslb.ca.gov … general_renewal_information](https://www.cslb.ca.gov/contractors/maintain_license/renew_license/general_renewal_information.aspx) |
| California (CSLB) | **"You may renew an expired license any time within five years after its expiration. If your license has been expired for more than five years, you will be required to reapply by completing an Application for Original Contractor's License."** | same |
| California (CSLB) | Original licence application fee **$450**; initial licence issuance **$200** sole owner / **$350** non-sole owner. | [contractorslicenseguru.com](https://contractorslicenseguru.com/california-contractors-license-costs-fees-renewals-hidden-expenses/) `secondary`, consistent with CSLB |
| Illinois (IDPH) | **"Plumber licenses must be renewed by April 30th following the date of issuance via the online renewal page."** Licensed plumbers must complete continuing education **annually**. | [dph.illinois.gov … plumbing](https://dph.illinois.gov/topics-services/environmental-health-protection/plumbing.html) |
| 50-state fees | Cheapest statewide general contractor licence **Wisconsin $45**; most expensive **Nevada $1,040**; **median statewide government fee $380**; **29 states licence GCs statewide, 22 do not** (local or none). Component ranges: application $75–$450, exam $50–$295 per section, initial licence $25–$600, fingerprinting $40–$70. | [gettradelicense.com/blog/contractor-license-cost](https://www.gettradelicense.com/blog/contractor-license-cost) `secondary` |

**Note on the Illinois CE hours.** Multiple secondary sources state four hours annually; the IDPH page
fetched confirms the **April 30** deadline and the annual obligation but **does not state the hour count**.
The hour count is therefore **not** cleared for publication until the Product Owner's KB verifies it at an
IDPH rule citation. Recorded as an open item in §7.

### 4.3 The consequence — sourced, and therefore publishable

The whole offer rests on one claim: a lapsed credential does not cost you a fee, it costs you the right to
work. Three regulator or ordinance sources establish it.

- **California Contractors State License Board:** **"You cannot actively contract with an expired,
  inactive, or suspended license."**
  [cslb.ca.gov](https://www.cslb.ca.gov/contractors/maintain_license/renew_license/general_renewal_information.aspx)
- **New York City Department of Buildings**, on contractor permit requirements: **"Licensee's license and
  insurance information must be active and current."** and *"When a licensee submits a permit application,
  the insurance status information is automatically checked to display their current record."*
  [nyc.gov/site/buildings/dob/project-requirements-contractor-permit-and-insurance.page](https://www.nyc.gov/site/buildings/dob/project-requirements-contractor-permit-and-insurance.page)
- **Municipal ordinance, §4-402(d)** (Osawatomie, Kansas — cited as a representative example of the
  standard municipal clause): **"No building permit shall be issued to any contractor who has not first
  obtained a license or who is delinquent in payment of his/her annual license fee or whose certificate of
  insurance has expired or whose license has been suspended or revoked."**
  [osawatomieks.citycode.net/articleContractorLicensing.htm](https://osawatomieks.citycode.net/articleContractorLicensing.htm)

**These three replace every invented loss figure in the category.** They are stronger than a dollar
estimate because they are not estimates. The CSLB sentence in particular is the voice-of-authority
headline source identified in §2.3, and the five-year rule is the sharpest fact in the whole file: let a
licence sit expired long enough and you do not renew it, **you start over.**

---

## 5. Guarantee design — and the liability the obvious guarantee creates

Hormozi's taxonomy is unconditional / conditional / anti-guarantee / implied. Suby's framework lists Risk
Reversal fourth in importance. The temptation in this category is obvious and specific, and the brief
names it: *"if we miss a renewal we pay the reinstatement fee."*

**It should not ship.** Six reasons, four of which are arithmetic:

1. **It is uncapped relative to our price.** One delinquent CSLB renewal for a non-sole-owner entity is
   **$1,050** (§4.2) — 1.75 months of the $599 tier, for **one licence in one state**. A customer with 50
   technicians across a dozen states can generate several in a quarter. The claim distribution has a fat
   tail and our revenue does not.
2. **The reinstatement fee is not the loss, so paying it concedes the argument.** The actual loss is the
   stopped job (§4.3). A vendor who pays the small consequential loss has accepted responsibility for the
   causal chain, and the next demand is for the large one. The guarantee's cost is not the fee; it is the
   negotiating position it surrenders.
3. **Causation is unprovable and adversarial.** We alert; the licence holder files. If they ignored four
   alerts, did we "miss" it? Every claim becomes a dispute with the person whose renewal we need to win.
4. **Adverse selection.** The buyer with the worst compliance debt has both the highest expected payout
   and the highest propensity to buy — Akerlof's lemons problem applied to a guarantee rather than a
   market, exactly the mechanism flagged in `phase-1-ideation/research/03-gtm-pricing.md` §2.4.
5. **It is an insurance contract in substance** — a fixed periodic premium against a variable, contingent,
   third-party loss. State insurance regulation is not somewhere to arrive by accident, and this is a
   compliance product whose credibility would not survive being non-compliant.
6. **It may read as holding out as a licensing agent.** We are not the licence holder, cannot file, and
   under PLAN.md there is no human in the loop. Indemnifying a regulatory outcome we cannot execute is a
   claim we cannot honour operationally.

**The design principle that follows: guarantee what we control, not what the customer controls.** We
control (a) whether the data matches the state's page, (b) whether the alerts were sent, and (c) whether
the roster was loaded on time. Those are the three guarantees in `OFFER.md` §5, and each is verifiable
from our own logs rather than from a dispute about the customer's behaviour.

---

## 6. Stage 3 — the ideation options scored against the evidence

| Option | Survives? | Deciding evidence |
|---|---|---|
| Offer A — subscription-first | **As continuity only** | Trackers transact at $40–$499/yr (§3.4). A subscription sold as tracking cannot hold $149–$599/mo, and its time-to-value is deferred to the next renewal. |
| Offer B — productised one-off first | **Yes — the front door** | Expediters transact from $399/application and 3 of 5 will not publish a price at all (§3.3). Fast time-to-value; a published fixed price is itself the differentiator. |
| Offer C — permit-continuity insurance | **As message only** | §4.3 gives us the language with a `.gov` citation; §5 shows the mechanism is an uninsured insurance contract. |
| Page P1 — the map | **Yes, hero** | Recognition without unsourceable claims. |
| Page P2 — the divergence | **Yes, spine + demo** | §4.1: 8 hours vs 4 hours in one state, both cited. Teaches in five seconds; also proves the KB. |
| Page P3 — the loss counter | **No** | §3.2: every published figure in the category is an unsourced vendor estimate; A10 forbids ours. |

### 6.1 Value-equation scoring for the chosen configuration

| Term | Score /10 | Why | Lever |
|---|---|---|---|
| **Dream outcome** | 9 | Not "a tidy dashboard". *"No job stops, no permit is refused, and we can say yes to work in a state we are not in yet."* For the platform integration lead: *"the acquisition's licences are on our calendar before day one."* | Sell permit continuity and the right to bid, never "tracking". |
| **Perceived likelihood** | **3 — binding constraint** | We are unknown, and the product's entire value rests on regulatory data being right. A wrong date is worse than no product. The alternative is a firm with *"over 30 years in the licensing industry"* (§3.3). | Make the citation visible on every value (§4), publish the no-login demo, ship the accuracy guarantee, and refuse business we should not take. |
| **Time delay** | 5 subscription / **9 one-off** | The calendar's proof arrives at the next renewal, possibly months out. The Entry Pack lands in days against the expediter's weeks. | Lead with the one-off; make the subscription's first week deliver a finished, verified roster. |
| **Effort & sacrifice** | **4 — second constraint** | Someone must enter every technician, licence, number and date. This is the reason tools like this die in trial. | **Done-for-you roster build from the public state registers.** Eliminate the denominator rather than discount the numerator. |

**Strategic read.** Two terms are weak and both are addressable without touching price. Every dollar of
offer design goes to **visible citation** (likelihood) and **done-for-you onboarding** (effort). Discounting
addresses neither and would put us in the commodity band with the $99/yr trackers.

### 6.2 Pricing metric — states, with technicians as a guardrail

| Metric | For | Against | Verdict |
|---|---|---|---|
| **Technicians** | Intuitive; the incumbent rate card uses it (§3.1) | Prices the wrong thing: a 60-technician single-state shop has **one** rulebook and is trivial for us to serve | Guardrail only |
| **States** | Matches our cost driver (each state × trade is a rulebook we maintain) **and** the buyer's own mental model (*"we're in seven states"*) | Appears to penalise the expansion we want to cause | **Primary — with the penalty designed out (below)** |
| **Licences tracked** | Closest to marginal cost | Fluctuates monthly, hard to quote, invites gaming | No |

**The objection to state-based pricing, answered.** Charging by state looks like taxing growth. It is
not, because **a new state is not bought by upgrading the plan — it is bought as a State Entry Pack, which
includes that state's tracking for twelve months.** The expansion event, which the buyer already budgets
for and already pays an expediter for, funds the tier increase. This is Ramanujam's bundling logic used to
convert the pricing model's weakest point into its acquisition engine.

### 6.3 Trial design — where we deliberately break the benchmark

Poyar: 14 days is the modal trial (62%), card-gated trials convert at 30% vs ~6%, median free-to-paid 8%
(§2.6). We keep the card-on-file finding and discard the format, because **the binding constraint is not
attention, it is data entry** (§6.1). A free 14-day trial of an empty dashboard tests whether the buyer
will spend two weeks typing; the answer is no, and we would have measured our own onboarding rather than
our value.

**Instead:** a paid tripwire — the **$149 First State Audit** — in which we build the roster for one state
from the public licence registers and hand back a verified calendar. Card captured at $149 (Poyar's
mechanism preserved), value delivered in days, and the $149 credits against the annual plan. The free
thing is the **no-login demo**, which gives the *diagnosis* (what this state requires of this trade) and
never the *remedy* (your roster, your dates, your alerts).

---

## 7. Gaps, contradictions and open items

| # | Item | Status |
|---|---|---|
| G1 | Phase-1's "observed willingness to pay" premise | **Refuted** (§3.1). Both cited competitors are pre-launch waitlists from Rovaryn Digital Inc. Flagged to the orchestrator; `OFFER.md` is built on transacted prices instead. |
| G2 | LicensedTrades free-trial length: 14 days (search summary) vs 3 days (site) | **Resolved** to **3 days** at the primary page. |
| G3 | Illinois plumber CE hour count | **Open.** April 30 deadline and the annual obligation are verified at IDPH; the hour count is secondary only. Must not be published until the KB verifies it at a rule citation. |
| G4 | "RCI" as a licence expediter | **BLOCKED** after two searches; no firm of that name found in this category. Not used anywhere. |
| G5 | CSC business-licence pricing | **BLOCKED**; two candidate URLs 404. Only the solutions-nav label is confirmed. Treated as quote-gated enterprise, consistent with Harbor Compliance and API Processing. |
| G6 | Reviews of the alternatives | **Thin.** Capterra shows Harbor Compliance with **0 reviews**; LicensedTrades/LicenseRoadmap have no customers to review them. reddit.com and facebook.com are on the fleet blocklist, which removes where contractors actually discuss this. **Consequence: there is no review corpus to mine for voice-of-customer copy** — which is precisely why §2.3 substitutes regulator language. |
| G7 | ServiceTitan full partner list | Partial. The category list and the published integrations doc were fetched; the paginated partner directory is a JS app that did not render to text. The negative finding (no compliance category, no compliance integration) rests on those two sources. |
| G8 | Hormozi and Suby primary text | Neither book is fetchable. The frameworks are cited from Acquisition.com's own module structure plus a documented breakdown, and cross-checked against `phase-1-ideation/research/03-gtm-pricing.md`, which applied the same frameworks. |
| G9 | PERSONA.md / IDENTITY.md | **Did not exist** when this document and `OFFER.md`/`LANDING_SPEC.md` were written. Buyer definitions here derive from the phase-3 prospects README and the phase-1 entries. Both documents must be reconciled against the persona and design system in wave 1b. |

## 7b. Reconciliation with `PERSONA.md`

`PERSONA.md` landed while this document was being written. It was read in full and reconciled. The two
documents were produced independently and agree on the primary buyer, on the refusal to reuse competitor
loss figures, and — reaching it by a different route — on the finding that the $199–$1,199 band is a list
price rather than a demand signal. Four differences were resolved:

| # | Difference | Resolution |
|---|---|---|
| R1 | **Housecall Pro ships native licence storage, expiry tracking and renewal reminders.** My first draft concluded flatly that the FSM platforms "do not do this" | **PERSONA is right and I was wrong.** Verified independently at [housecallpro.com/licensing/hvac](https://www.housecallpro.com/licensing/hvac/). §3.5 rewritten; `OFFER.md` objection 4 and `LANDING_SPEC.md` FAQ Q4 corrected. The claim is now *"they store the date; they do not hold the rule."* |
| R2 | Buyer band: PERSONA says **15–100 technicians, 2–6 states**; I had written 5–100 / 2–12 | PERSONA's band adopted in `OFFER.md` §1 — it is derived from a stated break point (~10 licensed people) rather than from the phase-1 range |
| R3 | PERSONA identifies a **third buyer — the owner planning the next state**, who buys the one-off and may never subscribe | Adopted. It independently corroborates §1.1's conclusion that the productised one-off must lead, and it supplies the demand-generation surface for it |
| R4 | PERSONA supplies **stronger consequence facts than I found**: Cal. B&P §7031, SB 779's $1,500–$15,000 penalty from 1 July 2026, TDLR's ×1.5 / ×2 late-renewal multipliers, and CSLB's 90-day qualifier suspension | Adopted. §7031 was **re-verified independently at leginfo** for the two-agent rule and now replaces the municipal-ordinance quote on the landing page (`LANDING_SPEC.md` §4), because it is the strongest consequence in the file |

**`PERSONA.md` §3 is henceforth the canonical numbers table** for anything StateReady publishes. Where this
document and PERSONA both carry a figure, PERSONA wins.

**One PERSONA finding this document should have caught and did not:** LicenseRoadmap's review *contradicts
its own sibling's published tier caps* (40 technicians / 5 seats versus the vendor page's 50 employees / 10
seats). That is a second, independent proof of the same-operator finding in §3.1.

---

## 8. Source list (all fetched 2026-09-03)

**Conversion, copy and pricing craft**
1. https://www.nngroup.com/articles/how-users-read-on-the-web/
2. https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/
3. https://unbounce.com/photos/The-Conversion-Marketers-Guide-To-LandingPage-Copywriting.pdf (Wiebe / Copyhackers)
4. https://cxl.com/blog/landing-page-infrastructure/
5. https://www.growthunhinged.com/p/the-state-of-b2b-monetization-in-2026 (Poyar)
6. https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion (Poyar)
7. https://www.acquisition.com/training/offers (Hormozi)
8. https://futureproofmarketers.com/post/godfather-offer-framework (Suby, secondary)

**Competitive alternatives**
9. https://licensedtrades.com/
10. https://licensedtrades.com/pricing
11. https://licenseroadmap.com/
12. https://licenseroadmap.com/blog/best-contractor-license-tracking-software
13. https://staterequirement.com/license-alert/
14. https://www.harborcompliance.com/compliance-solutions-construction-firms
15. https://www.capterra.com/p/196555/Harbor-Compliance/
16. https://apiprocessing.com/nationwide-contractor-licensing/
17. https://floridacontractorlicense.org/florida-contractor-license-cost/
18. https://contractorslicenseguru.com/california-contractors-license-costs-fees-renewals-hidden-expenses/
19. https://cebroker.com/ and https://cebroker.com/professional (Propelus)
20. https://www.nascla.org/

**Field-service marketplaces**
21. https://marketplace.servicetitan.com/
22. https://help.servicetitan.com/docs/available-servicetitan-integrations
23. https://www.housecallpro.com/integrations/

**Regulators, ordinances and fee data**
24. https://www.cslb.ca.gov/contractors/maintain_license/renew_license/general_renewal_information.aspx
25. https://www.tdlr.texas.gov/acr/acrce.htm
26. https://www.tdlr.texas.gov/electricians/elecce.htm
27. https://dph.illinois.gov/topics-services/environmental-health-protection/plumbing.html
28. https://www.nyc.gov/site/buildings/dob/project-requirements-contractor-permit-and-insurance.page
29. https://osawatomieks.citycode.net/articleContractorLicensing.htm
30. https://www.gettradelicense.com/blog/contractor-license-cost
31. https://contractorlicenserequirements.com/blog/contractor-license-costs-ranked-cheapest-to-most-expensive-states/
32. https://www.housecallpro.com/licensing/hvac/ (added on reconciliation with PERSONA.md — §3.5)
33. https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7031 (Cal. B&P §7031 — independently re-verified; `verified_by` = Buyer & Identity agent + this agent, satisfying PLAN.md A10's two-agent rule)

Cached HTML and the extracted Wiebe text are in `offer/raw/`.
