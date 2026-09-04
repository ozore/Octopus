# Certly — Offer & Landing research

**Assignment:** what converts for a small property or association manager buying COI compliance
self-serve, and what the incumbents actually promise, gate and get complained about.
**Author:** Offer & Landing agent (wave 1). **Date:** 2026-09-03.
**Method:** stage 1 ideation → stage 2 evidence (every load-bearing claim behind a fetched URL) →
stage 3 verification (incumbent pages re-opened, competitor-sourced claims tested against primary
sources) → stage 4 writing. Frameworks: Hormozi *$100M Offers* (value equation, guarantee taxonomy,
trim-and-stack), Suby *Sell Like Crazy* (Godfather Offer, HVCO), Wiebe/Copyhackers (value-proposition
formula, landing-page elements), CXL (clarity over cleverness, above-the-fold), Nielsen Norman Group
(scanning, F-pattern), Unbounce Conversion Benchmark (word count, reading level), Poyar/OpenView
(trial design, monetization mix), Price Intelligently (value metric).
**Sibling dependency:** `PERSONA.md` did not exist while this research and `OFFER.md` were written;
it landed mid-way through and is **fully reconciled in `LANDING_SPEC.md`** and re-checked against
`OFFER.md` (it independently reaches the same primary buyer, the same anti-demo thesis and the same
price-anchor conclusion, which is a useful cross-check rather than a shared assumption). `IDENTITY.md`
and `design-system.css` had still not been written, so no colour, type or component is specified here.
**One blocking contradiction between `PERSONA.md` §2.5 and `KNOWLEDGE_BASE.md` §F is referred to the
wave-1b reviewer** — see `LANDING_SPEC.md` §14.

---

## 0. The four findings that decide the offer

**F1 — The premise the product was funded on is out of date, and in a way that helps.**
Phase-1 ideation described the category as "demo-gated enterprise" with an empty self-serve floor
(`phase-1-ideation/shortlist.json` #7). That is **false as of today**. A self-serve floor exists:
COI Tracker sells at **$29 / $59 / $129 per month** with a free 10-vendor tier
([coitracker.co/pricing](https://coitracker.co/pricing)); TrackMyVendor gives away 25 vendors and
markets straight at property managers
([trackmyvendor.com](https://trackmyvendor.com/property-manager-compliance)); bcs gives away 25
vendors permanently and lists self-service at **$0.95 per vendor per month**
([getbcs.com/pricing](https://www.getbcs.com/pricing)).
But read COI Tracker's own feature list: "Automated expiry reminders (30 / 14 / 7 days)",
"One-click vendor update requests", "Color-coded status dashboard", "Secure private PDF storage",
"CSV export". **No extraction. No requirement matching. No additional-insured or waiver checking.
No agent chasing.** The cheap band tracks *dates*. Nobody under an enterprise contract *verifies
coverage*. That is the wedge, and it is a job wedge, not a price wedge.

**F2 — The strongest true sentence in this category is printed on the form itself.**
Every ACORD 25 carries, in its own words:
> "THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE
> CERTIFICATE HOLDER… IMPORTANT: If the certificate holder is an ADDITIONAL INSURED, the policy(ies)
> must be endorsed. If SUBROGATION IS WAIVED… certain policies may require an endorsement. **A
> statement on this certificate does not confer rights to the certificate holder in lieu of such
> endorsement(s).**"
(verbatim from `phase-4-revenue/certly/kb-samples/certificates/Sample-COI-Vendors-08-03-2020.pdf`,
the ACORD 25 2014/01 revision; corroborated by
[Carmichael, *How to Read and Review Certificates of Insurance*, 2017](https://www.irmi.com/term/insurance-definitions/certificate-of-insurance)
mirror in `kb-samples/certificates/certificates_how_to_read_and_review_with_acord_forms.pdf`, §3–4:
"the Certificate does not convey Additional Insured status. This may be conveyed only by endorsement…
without the endorsement, the University may have no legal rights or access to the stated coverages.")
This is a proof asset no competitor uses on its homepage and it costs us nothing to be right about.

**F3 — Nobody in the category will tell a stranger a price.** Six of six named incumbents demo-gate
(§2). That is the single behaviour we can beat without a single accuracy claim, and it is the one
thing our buyer — a 3-to-30-person firm with no risk department — hates most.

**F4 — Our buyer's page has to be felt in about 450 words at a 6th-grade reading level.**
Unbounce's 2025 benchmark across "over 57 million landing page conversions" finds SaaS pages written
at a "5th to 7th-grade level converts at 12.9%" against "professional-level copy… just 2.1%" —
"simple copy converts 514% better" — with an optimal body of "250–725 words"
([unbounce.com](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)). Insurance
vocabulary is professional-level by construction. Every term we cannot avoid (additional insured,
waiver of subrogation, endorsement) has to be *shown in a picture*, not explained in a paragraph.

---

## 1. Stage 1 — ideation, before the evidence

Three offer angles and three page angles were written first, so the research could kill them rather
than confirm them.

### Offer angles

| # | Angle | Buyer's point of view | Verdict after research |
|---|---|---|---|
| **O-A** | **The Free COI Audit.** Hand us your spreadsheet or your folder of PDFs; we return a dated gap report. The finding is the close. | "I don't want to buy software, but I would like to know if I have a problem." | **Adopted as the front end.** This is exactly Suby's HVCO — an offer that "solves a burning problem… without asking for a sale". It also survives the no-testimonials constraint: the proof is *their* data, not our claims. |
| **O-B** | **The Lapse Guarantee.** "A certificate we track will never expire without you knowing, or you don't pay." | "Prove you'll actually do the chasing, because that's the part I keep failing at." | **Adopted, but scoped hard.** As written it is uninsurable (§6). Rewritten as a *notification* guarantee — something entirely inside our control — with five carve-outs. |
| **O-C** | **Audit-Ready.** "One button, one dated binder, per property. Send it to the lender, the auditor, the board or the carrier." | "The reason I'd pay is that twice a year somebody asks me for this and I lose a day." | **Adopted as the dream outcome.** It converts an invisible background chore into a deliverable with a deadline, which is what makes a manager buy this month rather than next year. |

The three are not alternatives: **O-A is the lead magnet, O-C is the promise, O-B is the risk
reversal.** Hormozi's trim-and-stack sequence puts them in exactly that order.

### Page angles

| # | Angle | Buyer's point of view | Verdict |
|---|---|---|---|
| **P-1** | **The wall of red.** Hero is a coverage timeline that turns from green to red as certificates expire. Fear first. | "That's my portfolio and I don't know which bar is red today." | **Second section.** Powerful, but fear without a mechanism reads as another vendor shouting. CXL: visitors "have a problem, think you might solve it, and want to know if they're right fast" ([cxl.com](https://cxl.com/blog/b2b-value-proposition/)). |
| **P-2** | **The diff.** Your requirement and their certificate, side by side, with the mismatch lit. Mechanism first. | "Oh — that's what it does. It reads the PDF and compares it to my rules." | **Hero.** One picture carries the whole product and needs no insurance vocabulary in prose. |
| **P-3** | **Drop a COI, see what we see.** Interactive demo as the hero. Proof first. | "Show me, don't tell me." | **Immediately under the hero.** With sample certificates only (§7) — a stranger's real COI is somebody else's data. |

Chosen page architecture: **P-2 hero → P-3 interaction → P-1 stakes.** Rationale in
`../LANDING_SPEC.md` §2.

---

## 2. The incumbents, opened

All six named in the brief were fetched today, plus four adjacent players that matter more to the
price ladder than the named six do.

### 2.1 What they promise, and what they will tell a stranger

| Vendor | Headline (verbatim) | Price published? | Evidence |
|---|---|---|---|
| **illumend** (formerly myCOI) | "COI tracking software, reimagined." / "The easiest and smartest way to handle third-party insurance compliance." | **No.** CTAs are "Schedule Demo", "Calculate Your ROI", "Take the COI Reality Scorecard" | [illumend.ai](https://www.illumend.ai/) |
| **TrustLayer** | "Third-party risk management powered by AI" / "TrustLayer's network of 517,000+ companies makes AI work for modern risk managers." | **No.** FAQ: "Pricing varies depending on platform usage… Please schedule a demo to learn more." | [trustlayer.io](https://www.trustlayer.io/); [/pricing 404](https://www.trustlayer.io/pricing) |
| **Jones** | "Fast, Accurate Insurance Verification for Every Tenant and Vendor" | **Metric only.** "Pricing is based on records per year" with "unlimited COIs and lease extractions for that record"; "typically per tenant or vendor record per property, billed annually". No dollars. CTA "Talk to an Expert". | [getjones.com/pricing](https://getjones.com/pricing/); [/property-management](https://getjones.com/property-management/) |
| **Evident** | "AI-Powered Supplier Risk Management" / "Stop reacting to risk. Start getting ahead of it." | **No.** "Book a Demo". | [evidentid.com](https://www.evidentid.com/) |
| **Certificial** | "The all-in-one Smart COI Platform" | **No.** "Get a Demo". | [certificial.com](https://www.certificial.com/) |
| **bcs** | "Automate Compliance & Insurance Tracking" / "be compliant. be protected. bcs." | **Partly — the most transparent of the six.** Free ≤25 vendors, Self-Service **$0.95/vendor/month** ("*Price dependent on vendor volume"), Full-Service **$17.80/vendor/year** with a **$10,000 annual minimum**. Both paid CTAs are still "custom quote". | [getbcs.com](https://www.getbcs.com/); [getbcs.com/pricing](https://www.getbcs.com/pricing) |
| SmartCompliance | "Take control and automate your Insurance Compliance Management" | **No.** "REQUEST A DEMO"; `/pricing/` 404s. Offers a "30-day guarantee… refund". | [smartcompliance.co](https://smartcompliance.co/) |
| **COI Tracker** | "Certificate of Insurance tracking without the *spreadsheet chase*." | **Yes, fully.** Free/10, $29/25, $59/100, $129/unlimited. "Track your first 10 vendors free", magic-link sign-in, "setup in 2 minutes". | [coitracker.co](https://coitracker.co/); [/pricing](https://coitracker.co/pricing) |
| **TrackMyVendor** | "Vendor Insurance Tracking Software for Property Managers" | **Partly.** "Start free — track your first 25 vendors, no credit card needed"; paid "Pro plan" unpriced. | [trackmyvendor.com](https://trackmyvendor.com/property-manager-compliance) |
| NetVendor | (PM-focused vendor management) | **No.** | [netvendor.com](https://www.netvendor.com/blog/best-coi-tracking-software-for-property-managers-a-platform-comparison) |

**Verification note.** `mycoi.com` is *not* myCOI — it resolves to My Corporate Office, Inc., an
unrelated business-services firm ("Just landed that big job? How do you scale up in a hurry?").
myCOI now trades as illumend; `mycoitracking.com` 301-redirects to
`illumend.ai/evaluation-buying/best-certificate-of-insurance-tracking-coi-software-2026`. Any
outbound copy naming "mycoi.com" would be wrong.

### 2.2 The numbers they use as proof

Useful because they mark the ceiling of what an unproven product may claim, and because two of them
are honest admissions of how bad the manual state is.

- illumend: "45M+ insurance documents", "16 years of compliance expertise from myCOI",
  "4x faster COI management", "87% faster reviews vs manual", "50% fewer delays from missing docs"
  ([illumend.ai](https://www.illumend.ai/)).
- TrustLayer: "517,000+ companies", "400,000+ COIs a month"
  ([trustlayer.io](https://www.trustlayer.io/)).
- Jones: "50M+ insurance documents", "300+ industry leaders", "**99.73% accuracy** (monitored
  weekly)", "90%+ collection rate on average", "<24 hours to full audit", "130,000+ vendor insurance
  profiles" ([getjones.com/property-management](https://getjones.com/property-management/)).
- Certificial: "100,000+ companies and 25,000+ Agencies"; and the admission that matters —
  manual processes run "3 to 4 hours per person per day" against "under 30 minutes daily" with the
  tool ([certificial.com](https://www.certificial.com/)).
- Evident: "85% reduction in administrative burden", "96% on-time"
  ([evidentid.com](https://www.evidentid.com/)).
- bcs: clients "managing 200+ vendors report saving 15–20 hours per week"; "95% client retention"
  ([getbcs.com](https://www.getbcs.com/)).
- SmartCompliance: customers "increase their vendor compliance percentage by as much as 65%"
  ([smartcompliance.co](https://smartcompliance.co/)).

**Rule this sets for us.** Jones publishes a *measured, monitored* accuracy number (99.73%, weekly).
Until Certly has an equivalent measurement over a real corpus, **we publish no accuracy number at
all** — not "99%", not "highly accurate", not "AI-powered precision". We publish the *method*
instead (confidence score per field, "needs review" state, the sample corpus), and we publish the
number the day it is measured. This is the same discipline `phase-1-ideation/research/03-gtm-pricing.md`
§2.2 lever 5 reached for a different product, and it is the only credible move for an unknown brand
in a category saturated with unfalsifiable percentages.

### 2.3 What users actually complain about

Capterra is the only review host that answered (G2 and TrustRadius both 403).

**myCOI — 4.7/5, 47 reviews** ([capterra.com](https://www.capterra.com/p/234580/myCOI/reviews/)).
Verbatim cons, clustered:

| Cluster | Verbatim | What it tells us to build or say |
|---|---|---|
| Onboarding cliff | "It takes a while for a new user to become acclimated to the software." · "it is not super intuitive and, some functionality takes a ramp up period" · "The biggest challenge with myCOI was getting all vendors, agents and some of our long-time employees on board" | The buyer's fear is not price, it is **a project**. Sell time-to-first-gap in minutes, and make onboarding an import, not an implementation. |
| Rigid requirements | "The customization of insurance requirements is a bit lacking and could use an update." | Requirement templates that the customer can actually **edit per property, per vendor class** are a differentiator, not a nice-to-have. |
| Vendor-facing spam | "Too many e-mail requests sent to vendors that they get overwhelmed or upset." | The chase is the product, but an unthrottled chase **burns the customer's vendor relationships**. Cadence caps and a single consolidated ask per vendor are a feature. |
| Clerical gaps | "There is no standard COI naming protocol." · "Bulk downloading documents in the cert Management is not usable." · "It would be nice if we could save report settings." · "The lack of ability to filter" | The export/binder path (offer O-C) is where incumbents are weakest and where our cheapest wins are. |

**TrustLayer — 5.0/5, but only 2 reviews; "Starting Price: Contact vendor"; free trial: not
available** ([capterra.com](https://www.capterra.com/p/198486/TrustLayer/)). Cons are trivial
("I wish I could turn it off. This is very minor!"). The finding here is the *thinness* — a
category leader with two public reviews is a category where nobody can check anything before a
sales call.

**Jones** — a competitor's comparison notes "only 6 reviews on G2" and "none on Capterra"
([getbcs.com blog](https://www.getbcs.com/blog/top-certificate-of-insurance-tracking-companies)).
Competitor-sourced, so carried as secondary; consistent with the Capterra pattern above.

### 2.4 Competitor-sourced claims that did not survive verification

Logged rather than used, per the pipeline's stage-3 rule.

| Claim | Source | Test | Outcome |
|---|---|---|---|
| "SmartCompliance… Pricing is transparent… starts at $1,000 per year" | bcs blog | Opened smartcompliance.co and /pricing/ | Homepage shows **no price**, CTA "REQUEST A DEMO", /pricing/ 404. **Not used as a fact**; carried as secondary. |
| "TrustLayer… Free tier available but limited" | bcs blog | Opened trustlayer.io, /free-coi-tracker (404), Capterra profile | Capterra records **no free trial, no free version**. The only free artefact is a "TrustScore". **Not used.** |
| "CertFocus: $6–$8 per vendor per year self-service; $13–$29 full-service" | bcs blog | certfocus.com/pricing/ | **503, twice.** Carried as secondary only. |

---

## 3. The price landscape, in one picture

Every fetched figure, normalised to dollars per month for a 100-certificate portfolio (the modal
`certly-pm` firm: 50–500 units, 40–120 recurring vendors, plus commercial tenants).

| Band | Player | Published rate | ≈ $/month at 100 certificates | Does it read the certificate? | Does it check endorsements? | Does it chase the agent? |
|---|---|---|---|---|---|---|
| **Free floor** | COI Tracker | free ≤10 | $0 | No | No | No |
| | TrackMyVendor | free ≤25 | $0 | No (not stated) | No (not stated) | No (not stated) |
| | bcs | free ≤25 | $0 | Not at this tier | Not at this tier | Not at this tier |
| **Date trackers** | COI Tracker | $29/25 · $59/100 · $129/unlimited | **$59** | **No** | **No** | **No** |
| **Per-vendor rate card** | bcs Self-Service | $0.95/vendor/mo | **$95** | Partly ("BCS AI") | Not published | "Automated Notices" |
| **Managed** | bcs Full-Service | $17.80/vendor/yr, **$10,000/yr minimum** | $148 — but the floor is **$833/mo** | Yes (licensed professionals) | Yes | Yes |
| | CertFocus *(secondary)* | $6–8/vendor/yr self-serve; $13–29 full-service | $50–$242 | — | — | — |
| **Enterprise, quote only** | Jones | "records per year", "billed annually" | undisclosed | Yes | Yes | Yes (Jones Operator) |
| | TrustLayer, illumend, Evident, Certificial, SmartCompliance | undisclosed | undisclosed | Yes | Yes | Yes |

**What this table says.** There is a **$59-to-$833 hole** in the market with nothing in it that both
(a) reads the certificate and checks the endorsements, and (b) can be bought without a phone call.
Certly's $99–$299 sits in that hole. It is *not* the cheapest thing that stores a PDF and sends a
reminder — and pretending otherwise would lose to COI Tracker on price and to nobody on value.

**Two disciplines this imposes.**

1. **Never claim to be the cheapest.** Ramanujam's "minivation" failure mode — cloning a cheaper
   competitor's mechanic and discounting — destroys the category economics without buying
   defensibility. Hormozi's pricing checklist is blunter: "Be more expensive than everyone else (by
   enough that it causes consumer to pause)… High Price = Higher Value"
   ([Acquisition.com, *Pick Your Pricing & Maximize Value*](https://www.acquisition.com/hubfs/Offer%20Checklists%20-%20PDF%20Downloads/Pricing-Value-Checklist.pdf?hsLang=en)).
2. **The comparison on the page must be against the spreadsheet, not against COI Tracker.** Certificial
   publishes the number that makes this argument for us: manual COI work runs "3 to 4 hours per person
   per day" ([certificial.com](https://www.certificial.com/)); bcs says 200+ vendor clients save
   "15–20 hours per week" ([getbcs.com](https://www.getbcs.com/)). At even a modest loaded property-manager
   rate, five hours a week is an order of magnitude above $199/month. That arithmetic must be shown, with
   the customer's own hours as the input, and with both figures attributed to the vendors who published
   them — they are vendor marketing, not measurements, and we say so.

### 3.1 The value metric — and why the brief's metric needs one sentence of definition

The brief specifies **certificates tracked**. Every fetched competitor meters per **vendor or
record**, not per document: Jones — "Pricing is based on records per year" with "unlimited COIs and
lease extractions for that record. No per-review or per-upload charges"
([getjones.com/pricing](https://getjones.com/pricing/)); bcs — per vendor
([getbcs.com/pricing](https://www.getbcs.com/pricing)); COI Tracker — per vendor
([coitracker.co/pricing](https://coitracker.co/pricing)).

Price Intelligently's rule is that the value metric must align with the value the customer receives
and grow as they grow, because a misaligned metric is the direct cause of high churn and low
expansion — their worked model contrasts a misaligned metric (10% churn, 1% expansion, growth
plateaus inside two years) with an aligned one (1% churn, 10% upgrades)
([*The Anatomy of SaaS Pricing Strategy*, Price Intelligently, ch. 5](https://hub.paddle.com/hubfs/Price-Intelligently-SaaS-Pricing-Strategy.pdf)).

A raw per-document meter is misaligned here in a specific and damaging way: **the product's whole
purpose is to cause renewals**, and a per-document meter charges the customer every time it succeeds.
Resolution, adopted in `OFFER.md`: the metric stays "certificates tracked" but is defined as **active
certificates — one current certificate per vendor, tenant or subcontractor. Renewals, re-uploads,
corrected certificates and endorsement pages of an existing vendor never count again.** That is
legible to a buyer who has shopped bcs or Jones, honest, and expands only when the portfolio expands.

### 3.2 Trial design

Poyar's January-2026 survey of 200 B2B software products
([growthunhinged.com](https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion)):
median free-to-paid is **8%**; **57%** lead with a free trial against **26%** freemium; **14 days is
the most common length (62%)**; only **20%** require a card up front but those that do reach **"30%
free-to-paid conversion – more than 5x ones that don't require one"**; and a **dual CTA** offering
both freemium and a card-required trial produced a "26% improvement at creating premium trials".

For Certly the free artefact should not be a crippled account — it should be the **audit**, because
the audit is the thing that produces the finding that closes the sale, and because a free 10- or
25-vendor account is already commoditised by COI Tracker, TrackMyVendor and bcs (§3). Design adopted:
**free no-login audit (no card) as the lead magnet + 14-day card-required trial as the paid path,
offered as a dual CTA.**

On monetization shape, Poyar's April–May 2026 survey of 230 companies finds early-stage (<$5M ARR)
businesses "gravitated most strongly to flat fees (37% adoption)", hybrid pricing rising 25%→37% in a
year, and a median target AI gross margin of about 50%
([growthunhinged.com](https://www.growthunhinged.com/p/the-state-of-b2b-monetization-in-2026)).
Flat monthly tiers with a certificate allowance are the benchmark-modal, simplest choice and the one
PLAN.md's "keep it simple" constraint asks for.

---

## 4. What the buyer is actually afraid of (and the honest version of the fear)

The category sells fear. Most of the fear sold is unfalsifiable. Here is the part that is documented.

**4.1 The certificate is not the coverage.** F2 above. The ACORD 25's own notice says a statement on
the certificate "does not confer rights… in lieu of such endorsement(s)". So a vendor whose
certificate shows an X in the `ADDL INSD` column may still have no endorsement naming the manager,
and the manager will discover this at tender.

**4.2 Additional-insured status has two halves and contracts routinely require only one.**
ISO **CG 20 10** adds an additional insured for *ongoing operations*; ISO **CG 20 37 04 13**,
"ADDITIONAL INSURED – OWNERS, LESSEES OR CONTRACTORS – COMPLETED OPERATIONS", extends it to work
"included in the 'products-completed operations hazard'"
([ISO CG 20 37 04 13, full form text](https://www.iiat.org/uploads/files/general/InfoCentral/Commercial-GL/cg2037.pdf)).
Contracts that name only CG 20 10 leave the gap open for the whole warranty period, and — the line
that matters for our product — "A COI that says 'Additional Insured' does not confirm which ISO forms
are attached" ([billyforinsurance.com](https://billyforinsurance.com/resources/cg-20-37-completed-operations/)).
This is precisely a machine-checkable fact, and precisely the thing a spreadsheet cannot hold.

**4.3 An endorsement on a cancelled policy is worth nothing, and the discovery is late.**
"An additional insured endorsement on a cancelled policy provides no coverage. If the certificate
holder doesn't know the policy was cancelled, they may not discover it until they file a claim and
the carrier denies it… By then, the exposure has been accumulating undetected"
([getbcs.com](https://www.getbcs.com/blog/what-happens-when-a-vendors-insurance-expires-a-risk-managers-guide)).
Competitor-sourced, so it is used as *framing* on our page, never as a statistic, and never with a
dollar figure attached — that source carries none.

**4.4 There is a second, non-catastrophic, annual and very concrete cost: the premium audit.**
Travelers, on its own general-liability premium-audit page, requires "Certificates of Workers
Compensation and General Liability Insurance covering the time the contractors perform work for you",
requires the auditor to confirm "the… subcontractor's policy is in effect during the time the work
was performed for you", and states: **"Without valid Certificate of Workers Compensation Insurance we
may charge a premium for work performed by an independent contractor/subcontractor"**
([travelers.com](https://www.travelers.com/business-insurance/services/premium-audit/general-liability-premium-audit)).
This is the better urgency lever than the claim-time story: it is annual, it is scheduled, it arrives
as a letter, and it is denominated in dollars the buyer will actually see. It is also the only
urgency in this category that is **external, real and dated** — which is Hormozi's condition for
using urgency at all.

**4.5 Forgery and staleness are real and checkable.** The standard review procedure tells reviewers
to "Check the date the certificate was issued. It should be current. Missing or old dates may be a
sign of a forged certificate", and to confirm the sender matches the producer because that "greatly
reduces the likelihood of getting a forged certificate"
(`kb-samples/certificates/certificates_how_to_read_and_review_with_acord_forms.pdf`, §2 and §5).
Two cheap, honest checks a spreadsheet never performs.

---

## 5. Conversion research — what the page must obey

### 5.1 Reading behaviour

- "79 percent of our test users always scanned any new page they came across; only 16 percent read
  word-by-word." Concise + scannable + objective writing measured **124% better usability** than
  promotional writing; concise alone 58%, scannable alone 47%. And: "promotional language imposes a
  cognitive burden" ([Nielsen, NN/g, 1997](https://www.nngroup.com/articles/how-users-read-on-the-web/)).
- The F-pattern "is alive and well in today's world — both on desktop and on mobile". Put "the most
  important points in the first two paragraphs"; start headings with information-bearing words so
  "if users see only the first 2 words, they should still get the gist"
  ([Pernice, NN/g, 2017, reviewed 2026](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)).
- SaaS median landing-page conversion **3.8%**; optimal copy **250–725 words**; 5th–7th grade reading
  level **12.9%** vs professional **2.1%**; best pages use only **50–140 words of three syllables or
  more**; **79% of landing-page visits are mobile**
  ([Unbounce Conversion Benchmark](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)).

Consequence: a **hard budget of under 450 words above the pricing block**, a mobile-first hero, and
a standing rule that any three-syllable insurance term must appear inside a diagram before it appears
in a sentence.

### 5.2 Above the fold, and where the CTA goes

CXL's synthesis: NN/g found an **84% difference** in how users treat information above versus below
the fold, yet Chartbeat found **66% of attention on media pages is below the fold**, Huge found
"almost everyone (91-100%) scrolled beyond the fold", and MOVR found 90% of mobile users scroll within
14 seconds. NN/g's rule: "Users do scroll, but only if what's above the fold is promising enough."
CXL's CTA rule is segmented — a *simple* value proposition puts the CTA above the fold; a *complex*
one earns the click after the education, and Michael Aagaard's below-fold placement test reported a
**304% conversion increase** (with the caveat that multiple variables moved)
([cxl.com/blog/above-the-fold](https://cxl.com/blog/above-the-fold/)).

Certly's value proposition is *complex* (the buyer must first accept that a certificate can look
right and be wrong). Consequence: **two CTAs — a low-commitment one above the fold ("See it read a
certificate") and the commercial one after the mechanism is shown.**

### 5.3 Clarity, not cleverness

CXL: for B2B, "start with clarity, not cleverness" — visitors "have a problem, think you might solve
it, and want to know if they're right fast"; in a Wynter study **18% of B2B SaaS marketing leaders
named buzzwords and terminology customers didn't understand** as their source of messaging confusion.
Their template — "For [specific buyer] who [has high-value problem], [product] is the [category] that
[uniquely solves it]. Unlike [alternatives], it [unique mechanism]" — plus Bain's 2,300-decision-maker
study, where vendors excelling in six or more value elements saw repeat-purchase intent of **43% vs
21%** and cost ranked **#27** as an actual loyalty driver despite ranking #1 in stated importance
([cxl.com/blog/b2b-value-proposition](https://cxl.com/blog/b2b-value-proposition/)).

That last number is the licence to price at $199 against a $59 tracker.

### 5.4 Copyhackers

- Value-proposition formula: **"My product is the one that ____."** Strong ones are specific and
  quantifiable ("saving you up to 40% of your workweek"), name the audience, and fit in one statement;
  weak ones are vague, audience-less and long
  ([copyhackers.com](https://copyhackers.com/2022/07/value-proposition-formula/)).
- Five elements of a high-converting landing page: **no navigation** ("Navigation links are a
  distraction"); **a single call to action** — all CTAs point at the same action, per Hick's Law;
  a headline carrying the value proposition; benefits in plain language answering "what's in it for
  me?"; and social proof with "names, photos, and (for B2B) job titles"
  ([copyhackers.com](https://copyhackers.com/2022/09/high-converting-landing-pages-examples/)).

The fifth is the one we **cannot** satisfy: we have no customers and are forbidden from inventing any.
`LANDING_SPEC.md` §7 substitutes *artefact proof* for social proof, and states plainly that the
testimonial slot stays empty until a real customer fills it.

### 5.5 Hormozi — the value equation and the guarantee taxonomy

From the primary checklists:

> "Maximize Dream Outcome (solve problem worth solving) · Maximize Perceived Likelihood of Success
> (testimonials & proven case studies) · Minimize Time to Success (How can we make this faster? How
> can we show progress?) · Minimize Effort & Sacrifice (How can we make this easier? More Seamless?
> Convenient?)"
> — [*Pick Your Pricing & Maximize Value*](https://www.acquisition.com/hubfs/Offer%20Checklists%20-%20PDF%20Downloads/Pricing-Value-Checklist.pdf?hsLang=en)

> "Conditional Guarantees: should always be 'better than money back' · Always match the guarantee
> terms with the activation points in your program — what does someone actually have to do to be
> successful, make those the terms · Examples: Outsized refund (2-3x cost) · Service Guarantee (keep
> working w them for free) · Modified Service Guarantee · Credit Based Guarantee · Personal Service
> guarantee · Release of Commitment… Stacking Guarantees: Option A: Pick a conditional and
> unconditional guarantee and put them together"
> — [*Unbeatable Guarantee Checklist*](https://www.acquisition.com/files/unbeatable-guarantee-checklist.pdf)

Two things follow. First, "Perceived Likelihood of Success" is Certly's weakest term and its
prescribed lever — testimonials and case studies — is **unavailable to us by constraint**. Every
gram of effort therefore goes into the substitutes: a working demo, a real redacted artefact, the
ACORD form's own words, published method instead of published accuracy, and a guarantee. Second,
"match the guarantee terms with the activation points": the activation point for Certly is
*the customer uploading or forwarding a certificate*, so that is what the guarantee must be
conditioned on.

### 5.6 Suby — the Godfather Offer and the HVCO

Suby's HVCO is "a killer Lead Magnet designed to educate, engage, and build trust… an irresistible
headline that solves a burning problem and attracts cold traffic without asking for a sale"; the
Godfather Strategy is an offer "so hot that it melts down objections", built from "risk-reversing
guarantees, flexible payments, and scarcity"
([summary, jessenyokabi.substack.com](https://jessenyokabi.substack.com/p/sell-like-crazy-how-to-get-as-many)).
**Source-grade warning:** the primary text was not fetchable and `alex-goff.medium.com`, the obvious
second summary, returned **403 twice**. This is the weakest citation in the document — a summary of a
book, not the book. The two Suby concepts used here (HVCO, Godfather Offer) are load-bearing for §1's
offer architecture, so they are corroborated structurally rather than textually: the HVCO's role is the
same as Hormozi's lead-magnet rule, cited from a primary checklist above.
Two of the three Godfather components are available to us honestly. **Scarcity is not** — there is no
scarce resource in a self-serve SaaS, and manufacturing one would violate the standing rules. It is
replaced by the buyer's own dated deadlines (§4.4) in `OFFER.md` §7.

The HVCO is the **free COI audit**, and Suby's headline rule ("solves a burning problem… without
asking for a sale") is the reason the audit must return a *finding* — not a signup form.

---

## 6. The guarantee — what can and cannot be promised

Drafted against Hormozi's taxonomy, then stress-tested for liability. Detail and final wording in
`../OFFER.md` §6; the research position is:

- **Promising "you will never have a lapse"** is a promise about the vendor's behaviour and the
  carrier's behaviour. Not ours to make.
- **Promising "your coverage is compliant"** is a legal conclusion about an insurance contract.
  Making it is arguably the unlicensed practice of insurance advising and is squarely E&O exposure;
  PLAN.md §6 already flags extraction accuracy on non-standard layouts as a launch risk, and A10
  requires a disclaimer on every screen.
- **Promising "we will tell you before it expires"** is a promise about *our* notification behaviour,
  is fully inside our control, matches the activation point (a certificate the customer gave us,
  with an expiry date we successfully read), and is the only one of the three that is both
  differentiating and honest.

The three carve-outs that make it survivable — unreadable expiry dates flagged "needs review",
certificates added after expiry, and delivery beyond our control — are in `OFFER.md` §6, along with a
safer fallback if the founder declines even this.

---

## 7. The no-login demo — can it be done safely?

Yes, with one restriction. A stranger's real certificate of insurance contains a third party's
business details, policy numbers and producer contact information. Accepting arbitrary uploads with
no account means storing other people's data with no contract and no deletion path, against a
standing rule that no private individuals' data goes anywhere near this repo.

**Safe design (recommended for launch):** three pre-supplied sample certificates the visitor picks
from — one clean, one expired, one missing the waiver of subrogation — drawn from the public sample
corpus already committed at `phase-4-revenue/certly/kb-samples/certificates/` (15 public-sector and
contractor sample ACORD 25s). The extraction runs for real on the server, against a real requirement
template, and shows a real gap. Nothing of the visitor's is stored. This demonstrates the mechanism,
which is what the visitor came for.

**Upload variant (phase 2, founder decision):** accept one file, ≤5 MB, PDF only, processed in memory,
deleted within 24 hours, never used for training, no account created, rate-limited by IP, with the
terms stated *next to the drop zone rather than in a link*. Flagged in `OFFER.md` §11 as an open
question because it needs a legal read, not an engineering one.

---

## 8. Gaps — what this research could not establish

Named so nobody downstream mistakes silence for evidence.

1. **No renewal-seasonality source.** The brief suggests "renewal seasons" as honest urgency. No
   fetched source establishes when commercial GL policies concentrate their renewals. The urgency in
   `OFFER.md` uses the customer's own earliest expiry date and the premium-audit letter instead.
2. **No dollar figure for a denied vendor-liability tender.** The mechanism is documented (§4.3);
   the cost is not. No number is used anywhere.
3. **No independent verification of Jones's 99.73%, illumend's 87%, Evident's 85%, Certificial's
   "3 to 4 hours per person per day" or bcs's "15–20 hours per week".** All are vendor marketing.
   Where they are used on the page they are attributed to the vendor by name, and the page never
   presents them as measurements.
4. **No willingness-to-pay study.** The $99/$199/$299 ladder is anchored on *revealed* competitor
   pricing (§3), which per Fitzpatrick's *Mom Test* outranks stated WTP, but it is not the same as a
   Van Westendorp run. Paddle's definition — WTP "is usually represented as a price range, rather
   than a single dollar figure", and "if the market is oversaturated already, you won't be able to
   charge much higher than competitors of a near equal value"
   ([paddle.com](https://www.paddle.com/resources/willingness-to-pay)) — is the caution: our defence
   is that COI Tracker is *not* "near equal value", and that defence has to be visible on the page or
   the price fails.
5. **G2 and TrustRadius unreadable (403).** Complaint evidence rests on Capterra's 47 myCOI reviews
   and 2 TrustLayer reviews.
6. **`PERSONA.md` arrived only after this research and `OFFER.md` were drafted.** Buyer segment, tone
   and the PM-vs-GC beachhead choice were taken from the brief's default and from
   `phase-3-acquisition/prospects/certly-pm/README.md`; `PERSONA.md` §1 and §7.1 independently reach
   the same conclusion, so nothing needed reversing — but this was convergence, not coordination, and
   the reviewer should treat it as such. `IDENTITY.md` still did not exist, so nothing visual is fixed.
7. **Suby is cited from a secondary summary.** The primary text was not fetchable and the obvious
   second summary (`alex-goff.medium.com`) returned 403 twice. The two concepts used (HVCO, Godfather
   Offer) are structurally corroborated by Hormozi's primary checklists, not textually by Suby.

---

## Sources

**Incumbents and adjacent players (all fetched 2026-09-03):**
- [illumend.ai](https://www.illumend.ai/) — headline, CTAs, "45M+ insurance documents", "16 years… from myCOI", "87% faster reviews vs manual", "50% fewer delays", Lumie, demo-gated
- [illumend.ai — best COI software 2026](https://www.illumend.ai/evaluation-buying/best-certificate-of-insurance-tracking-coi-software-2026) — destination of the `mycoitracking.com` 301; no prices; competitor framing of Billy and Jones
- [trustlayer.io](https://www.trustlayer.io/) — "517,000+ companies", "400,000+ COIs a month", "Certified Risk Transfer™", named testimonials, FAQ "schedule a demo to learn more"
- [trustlayer.io/pricing](https://www.trustlayer.io/pricing) — **404** (verification of no published pricing)
- [trustlayer.io/resources/how-much-will-this-cost-me](https://www.trustlayer.io/resources/how-much-will-this-cost-me) — a page titled "How Much Will this Cost Me?" that contains no dollar figures
- [getjones.com/property-management](https://getjones.com/property-management/) — "50M+ insurance documents", "300+ industry leaders", "99.73% accuracy (monitored weekly)", "<24 hours to full audit", Gaedeke testimonial, "typically per tenant or vendor record per property, billed annually"
- [getjones.com/pricing](https://getjones.com/pricing/) — "Pricing is based on records per year", "unlimited COIs and lease extractions for that record", Platform vs Operator, "Talk to an Expert", no dollars
- [getjones.com — vendor COI guide](https://getjones.com/blog/vendor-certificate-of-insurance-guide/) — manual-workflow description, **no statistics** (checked)
- [evidentid.com](https://www.evidentid.com/) — "AI-Powered Supplier Risk Management", "85% reduction in administrative burden", "96% on-time", named enterprise logos, "Book a Demo"
- [certificial.com](https://www.certificial.com/) — "Smart COI™", "100,000+ companies and 25,000+ Agencies", "3 to 4 hours per person per day" manual vs "under 30 minutes daily", "Get a Demo"
- [getbcs.com](https://www.getbcs.com/) — "start for free", free ≤25 vendors, "15-20 hours per week", "95% client retention", 198,914 vendors tracked
- [getbcs.com/pricing](https://www.getbcs.com/pricing) — Free ≤25 · Self-Service **$0.95/vendor/month** · Full-Service **$17.80/vendor/year, $10,000 annual minimum**; paid CTAs still "custom quote"
- [getbcs.com — top COI tracking companies](https://www.getbcs.com/blog/top-certificate-of-insurance-tracking-companies) — competitor-sourced pricing and weakness claims for myCOI, TrustLayer, Jones, SmartCompliance, Evident, CertFocus (three of them failed verification, §2.4)
- [getbcs.com — what happens when a vendor's insurance expires](https://www.getbcs.com/blog/what-happens-when-a-vendors-insurance-expires-a-risk-managers-guide) — "An additional insured endorsement on a cancelled policy provides no coverage"; no dollar figures
- [smartcompliance.co](https://smartcompliance.co/) — "REQUEST A DEMO", 30-day refund guarantee, "as much as 65%", no published price
- [coitracker.co](https://coitracker.co/) and [coitracker.co/pricing](https://coitracker.co/pricing) — **the self-serve floor**: free/10, $29/25, $59/100, $129/unlimited; full feature list with no extraction, no requirement matching, no endorsement checking, no agent contact
- [trackmyvendor.com/property-manager-compliance](https://trackmyvendor.com/property-manager-compliance) — "Start free — track your first 25 vendors, no credit card needed"; "50–200 vendors across multiple properties"
- [netvendor.com — COI software for property managers](https://www.netvendor.com/blog/best-coi-tracking-software-for-property-managers-a-platform-comparison) — Jones "No multifamily PMS integration"; Yardi VendorShield and RealPage "bounded by the PMS ecosystem"; no prices
- [capterra.com — myCOI reviews](https://www.capterra.com/p/234580/myCOI/reviews/) — 4.7/5, 47 reviews, verbatim cons
- [capterra.com — TrustLayer](https://www.capterra.com/p/198486/TrustLayer/) — "Starting Price: Contact vendor", free trial **not available**, 5.0/5 on 2 reviews
- [mycoi.com](https://mycoi.com/) — **not myCOI**; My Corporate Office, Inc. (verification of the domain trap)

**Insurance substance:**
- ACORD 25 (2014/01) certificate, verbatim notice text — `phase-4-revenue/certly/kb-samples/certificates/Sample-COI-Vendors-08-03-2020.pdf` and `OSFL-coi-sample.pdf` (public sample corpus committed by the Product Owner agent)
- Elizabeth Carmichael, *How to Read and Review Certificates of Insurance* (2017) — `kb-samples/certificates/certificates_how_to_read_and_review_with_acord_forms.pdf`: the certificate "does not convey Additional Insured status"; forgery checks on date and producer
- [ISO **CG 20 37 04 13**, full form text (IIAT)](https://www.iiat.org/uploads/files/general/InfoCentral/Commercial-GL/cg2037.pdf) — "ADDITIONAL INSURED – OWNERS, LESSEES OR CONTRACTORS – COMPLETED OPERATIONS"
- [billyforinsurance.com — CG 20 37](https://billyforinsurance.com/resources/cg-20-37-completed-operations/) — "A COI that says 'Additional Insured' does not confirm which ISO forms are attached"
- [irmi.com — certificate of insurance](https://www.irmi.com/term/insurance-definitions/certificate-of-insurance) — definition: "a document providing evidence that certain general types of insurance coverages and limits have been purchased"
- [travelers.com — general liability premium audit](https://www.travelers.com/business-insurance/services/premium-audit/general-liability-premium-audit) — "Without valid Certificate of Workers Compensation Insurance we may charge a premium for work performed by an independent contractor/subcontractor"
- [blog.buildersmutual.com — workers' comp audit](https://blog.buildersmutual.com/questions-about-your-workers-comp-audit-we-have-answers) — uninsured subcontractor claims land on your policy (checked; carries no premium-charge statement, so not used for that claim)

**Conversion, copy and pricing research:**
- [nngroup.com — How Users Read on the Web](https://www.nngroup.com/articles/how-users-read-on-the-web/) (Nielsen, 1997) — 79% scan / 16% read word-by-word; 124% usability gain; "promotional language imposes a cognitive burden"
- [nngroup.com — F-Shaped Pattern](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) (Pernice, 2017, reviewed 2026) — first two paragraphs; first 2 words of headings
- [unbounce.com — SaaS conversion benchmark](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/) — 3.8% median; 250–725 words; 12.9% vs 2.1% by reading level; 50–140 difficult words; 79% mobile; 57M+ conversions
- [cxl.com — Mastering above the fold](https://cxl.com/blog/above-the-fold/) — NN/g 84%; Chartbeat 66%; Huge 91–100% scroll; Aagaard +304%
- [cxl.com — Sharpen your B2B value proposition](https://cxl.com/blog/b2b-value-proposition/) — clarity over cleverness; Wynter 18% buzzwords; Bain 2,300 decision-makers, 43% vs 21%, cost ranks #27
- [copyhackers.com — value proposition formula](https://copyhackers.com/2022/07/value-proposition-formula/) — "My product is the one that ____"
- [copyhackers.com — 5 key elements of high converting landing pages](https://copyhackers.com/2022/09/high-converting-landing-pages-examples/) — no navigation; single CTA (Hick's Law); social proof with names and titles
- [acquisition.com — Pick Your Pricing & Maximize Value (PDF)](https://www.acquisition.com/hubfs/Offer%20Checklists%20-%20PDF%20Downloads/Pricing-Value-Checklist.pdf?hsLang=en) — the value equation, verbatim; "Be more expensive than everyone else"
- [acquisition.com — Unbeatable Guarantee Checklist (PDF)](https://www.acquisition.com/files/unbeatable-guarantee-checklist.pdf) — guarantee taxonomy, "better than money back", "match the guarantee terms with the activation points", stacking options
- [growthunhinged.com — free-to-paid conversion](https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion) (Poyar, n=200, Jan 2026) — 8% median; 57%/26%; 14 days (62%); card-required 30%, ">5x"; dual CTA +26%
- [growthunhinged.com — state of B2B monetization 2026](https://www.growthunhinged.com/p/the-state-of-b2b-monetization-in-2026) (Poyar, n=230, Apr–May 2026) — flat fee 37% under $5M ARR; hybrid 25%→37%; median AI margin target ~50%
- [Price Intelligently — *The Anatomy of SaaS Pricing Strategy* (PDF, 139pp)](https://hub.paddle.com/hubfs/Price-Intelligently-SaaS-Pricing-Strategy.pdf) — 70/20/10 blog-attention split vs the inverse effectiveness ranking; value-metric alignment model (10%/1% vs 1%/10%)
- [paddle.com — willingness to pay](https://www.paddle.com/resources/willingness-to-pay) — WTP as a range; competitive saturation caps price
- [jessenyokabi.substack.com — *Sell Like Crazy* summary](https://jessenyokabi.substack.com/p/sell-like-crazy-how-to-get-as-many) — Godfather Offer and HVCO definitions (a secondary summary; the primary text was not fetchable, and `alex-goff.medium.com` returned 403 twice — logged, not cited)

**Carried forward from this repo:**
- `phase-1-ideation/research/03-gtm-pricing.md` — value-equation method, guarantee layering, adverse-selection caution, revealed-vs-stated WTP
- `phase-3-acquisition/prospects/certly-pm/README.md` — ICP, 1,101 rows, segment mix, the 20 highest-fit firms
- `phase-3-acquisition/prospects/certly-gc/README.md` — the GC beachhead, 780 rows
- `phase-4-revenue/certly/kb-samples/` — 15 public ACORD 25 samples, 5 subcontractor insurance-requirement exhibits, 3 endorsement samples
