# RATEPIN — BRAND BOOK (v1)

**Scope:** positioning, promise, voice, claims policy, messaging hierarchy and visual direction for **Ratepin** (name decided in `NAMING.md`, 2026-08-13).
**Binding on:** `DESIGN_SYSTEM.md`, the landing page, the free WH-347 generator, the programmatic county × craft pages, every generated artifact's footer, every transactional email, every in-product refusal state, and all of phase 3.
**Inputs it must not contradict:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D1–D10 and G1–G6 · the four phase-1 validation deep dives · `architecture/ARCHITECTURE.md`, `CORPUS_DESIGN.md`, `ENGINE.md`, `USER_JOURNEY.md`.
**Verification date:** all live market facts below were fetched in-session on 2026-08-13.

---

## 0. The one strategic idea

**We do not sell the form. We sell the sentence underneath it.**

The form is commodity. Four vendors already emit a correct WH-347 for less than we charge — LCPcertified at **$12 per report**, PrevailComply at **$29.99/month**, CertiWage at $29/month, CertifiedPayrollPro's $49 tier carrying five projects — and at least two of them, plus DOL itself, give a WH-347 generator away free. If Ratepin is read as a form-filler, it is a form-filler priced 8× above the market, and it dies.

What none of them emits is the sentence that makes the number defensible:

> *This rate is the one in wage determination **CA20260012**, modification **4**, published **2026-03-14**. Here is the copy we mirrored, and here is its hash.*

Every incumbent makes the contractor supply that number by hand from a PDF, then prints it as an unsourced figure. Ratepin's entire reason to exist is that the provenance travels *with* the number, onto the artifact, into the archive, and out the door to the general contractor every Friday.

Three consequences run through the whole of this document:

1. **The brand attaches to the pin, never to the form and never to the price.** (D3 retired "zero setup fee" as positioning; `research/02` refuted the "$995–$4,995 setup fee" framing for the sub-facing SKUs entirely.)
2. **The brand attaches to what we hold, never to what we promise.** Until G1–G6 clear we describe mechanisms and refuse outcomes. This is a claims policy (§5), not a tone preference.
3. **The artifact is the primary brand surface.** More people will read the Ratepin footer on a PDF a subcontractor emailed them than will ever visit the landing page. Surface zero is a 9-point line of monospace at the bottom of a government form (§6.7).

---

## 1. Positioning — April Dunford's ten steps, run explicitly

### Step 1 — Understand the customers who love the product

**Honest status: we have none.** `research/01-demand-pmf.md` records plainly that nobody has been asked to pay for this, that no primary contractor voice was obtained in phase 1, and that the "revision hell" quote in the shortlist is unverified. Every statement in this step is therefore a **hypothesis for falsification**, not a finding, and it is written to be falsifiable.

The hypothesised lover: a payroll administrator or office manager at an **open-shop specialty subcontractor with 5–75 field employees**, running **three or more concurrent DBA-covered projects in two or more counties**, who personally signs the statement of compliance. The multi-project, multi-county qualifier is doing real work: `research/02` found that a single-project sub is LCPcertified's customer, not ours, because at one project the provenance problem is small enough to hold in your head and $12 a report is unbeatable.

What they would love, if the hypothesis holds: that the question *"where did this rate come from?"* stops being a memory exercise and becomes a lookup.

### Step 2 — The competitive alternatives list, stated honestly

Dunford's rule is that the alternative is whatever the customer would do if you did not exist — including nothing. Overstating incumbent pain is the single most common failure of this step, and phase 1 committed it; `research/01` and `research/02` corrected it. This list is the corrected one.

| # | Alternative | What it actually costs | Where it beats us | Where it does not |
|---|---|---|---|---|
| 1 | **Excel + the WD PDF + DOL's fillable WH-347** (incl. DOL's own web tool) | $0 | Free, familiar, no vendor, no account | The rate is retyped from a PDF and its revision is remembered, not recorded |
| 2 | **The bookkeeper, or an outsourced payroll service** | Already being paid | Zero new decision; a human absorbs the exceptions | Costs a human's Friday; the provenance still lives in that human's head |
| 3 | **LCPcertified** (LCPtracker's sub-facing product) | **$12/report**; **$145/mo up to 5 active projects**; $1,300/yr (10) → $7,400/yr (unlimited); Professional to **$18,200/yr** (450 projects) | Cheapest credible paid option; already exports **CA DIR, WA L&I and MD DLLR XML** — broader than our v1; the incumbent brand a GC has heard of | Contractor still picks the classification and supplies the rate; no revision-of-record on the artifact |
| 4 | **CertifiedPayrollPro** | **$49 (5 projects) / $99 (25) / $249**, plus $5/$3/$1 per report; **$0 setup**, no-credit-card trial | Self-serve, cheap, more projects per dollar than D4's ladder inside its own caps | Same gap: the rate is an input, not a record |
| 5 | **PrevailComply** | **$29.99/mo or $199.99/yr**, cancel anytime | WH-347 **and** CA eCPR XML **and** apprentice ratios **and a free WH-347 generator** — D3's wedge and D8's funnel, already shipped, at a third of Solo | No pinned revision history; no per-classification diff since award |
| 6 | **PrevailForms** | not published | WH-347, eCPR and OSHA forms in one place | Same |
| 7 | **WagePath** | demo-gated, no public price | Sits between time-tracking (ServiceTitan, Procore) and payroll (UKG, Gusto); emits WH-347 **plus CA eCPR, NJ MW-562, OH CPR and NY State XML** — wider than D9's v1 scope | Demo-gated: you cannot buy it at 4:40pm on a Friday |
| 8 | **Construction payroll bureaus** — Payroll4Construction, Foundation, eBacon, Points North | Points North ~$175+/mo with ~$1,500+ setup, per davisbaconrates.com; the rest demo-quoted | They run payroll; we explicitly do not (D9) | Setup, sales cycle, and you are buying a payroll system to get a form |
| 9 | **The GC-mandated portal** (LCPtracker Pro, agency side) | Often **$0 to the sub** — DOE states LCPtracker is free to IIJA recipients and subrecipients | Free, and mandatory when mandated | It is a submission portal, not a rate engine; it accepts whatever rate you type |
| 10 | **Do nothing / file late** | Withheld progress payments | No cost today | The draw does not release |

**We are not the cheapest and we must never pretend to be.** Solo at $99/mo is more than PrevailComply's $29.99, more than LCPcertified's $145-for-five on a per-project basis, and more than CertifiedPayrollPro's $49-for-five. Every dollar of that delta has to be carried by one attribute.

### Step 3 — Isolate the genuinely unique attributes

`research/02` tested the phase-1 attribute list and found that exactly four survive contact with the market. No fifth is added here.

| | Attribute | Why no listed alternative has it |
|---|---|---|
| **U1** | **Revision-level provenance printed on the artifact** — WD number, modification number, WD publication date, corpus snapshot hash and generation timestamp, on every PDF and in every XML we emit, and retained immutably | Every alternative treats the rate as user input. None stores the revision that was in force, so none can print it. |
| **U2** | **Refusal semantics** — an unresolved line is not guessed. The document still renders, watermarked **DRAFT — NOT CERTIFIABLE**, with the signature block structurally withheld | The alternatives are form-fillers: an empty cell is an empty cell, and a wrong cell prints as confidently as a right one |
| **U3** | **Classification memory** — payroll title → WD classification, chosen once from candidates constrained to that WD's own classification list, then remembered per (account, WD, title) forever | Incumbents make the contractor pick the class by hand every time, so they accumulate nothing |
| **U4** | **No demo, no quote, no call, no human — structurally** | WagePath, LCPtracker Pro, eBacon, Foundation and eMars are demo-gated. This is a business-model attribute, not a feature, so it cannot be copied without abandoning a sales team |

**Attributes deliberately NOT claimed**, because the evidence does not support them: an exclusive or unreconstructable wage-determination archive (refuted — `sam.gov/api/prod/wdol/v1/wd/{ref}/{rev}` serves archived revisions as plain text and govconapi.com resells 90,033 WDs at $19/mo); broadest state coverage (WagePath and LCPcertified both exceed our v1); lowest price (we are not); and the largest corpus (unmeasured until G3).

### Step 4 — Map attributes to value ("so what?")

| Attribute | So what? | The buyer's own sentence |
|---|---|---|
| U1 provenance | An audit, a GC challenge or a DOL conformance question **eighteen months later is answered from stored data instead of reconstruction** — and reconstruction is exactly what is impossible, because SAM overwrites the live document | *"I can show them where the number came from without going and finding it again."* |
| U2 refusal | You **never sign a document the software was not sure about.** The signature carries 18 U.S.C. § 1001 exposure — DOL's own WH-347 instructions warn of *"a fine, possible imprisonment of not more than 5 years, or both"* — and it is the contractor's signature, not ours | *"It won't let me certify something it couldn't work out."* |
| U3 memory | *"Which class is this guy?"* — the one genuinely human-shaped question in the whole job — is **asked once, ever, per trade per determination** | *"I told it once."* |
| U4 no humans | You can **decide, pay and file inside one session at 4:40pm on a Friday**, which is when this work actually happens | *"I didn't have to book anything."* |

### Step 5 — Determine who cares a lot

**Cares a lot:** multi-project, multi-county open-shop specialty subs, 5–75 field employees; the individual who signs the compliance statement; contractors whose GC has already bounced a report; anyone who has been asked *"which mod was in force at bid opening?"* and could not answer from a file.

**Cares little (and we should let them go):** single-project single-county subs — LCPcertified at $12/report is genuinely the right answer for them and we should say so; union shops — D9 refuses CBA fringe schedules outright and we must refuse them at signup, not approximate; GCs and awarding agencies — a different product; payroll bureaus; anyone whose GC mandates a portal *and* whose provenance need is nil, for whom the mandated portal is free.

### Step 6 — Find or build the market category

**Category: certified-payroll rate-of-record engine.**

Not "certified payroll software." That category exists, has an incumbent with a five-class trademark filing dated 2026-07-06, and is priced at $12–$49. Entering it means being compared on price against products that already do the form.

The category we want the buyer to hold is the one `research/02` named: **the wage-determination system of record**, with the certified payroll as its output. The frame is closer to a title company or a records office than to payroll software: the value is that somebody kept the dated copy.

Category line, used verbatim on first mention everywhere:

> **Ratepin** — certified-payroll rate-of-record engine for federally funded construction.

### Step 7 — Check the positioning against each alternative

For each, the honest answer we may give. No denigration; every sentence below must remain true after a competitor's next release.

| Alternative | What its advocate says | Our answer, in full |
|---|---|---|
| Excel + the WD PDF | *"It's free and I've done it for years."* | It is free, and for one project in one county it is fine. Ratepin is for when the answer to *"which revision was that?"* stopped being something you can hold in your head. |
| LCPcertified | *"$12 a report, and it already does CA, WA and MD XML."* | True, and cheaper than us, and broader than our v1. It fills the form correctly from the rate you give it. It does not keep the revision you gave it from, which is the part you cannot rebuild later. |
| CertifiedPayrollPro | *"$49 gets five projects."* | True — more projects per dollar than our $99 tier inside that cap. Buy on price and buy theirs. Buy Ratepin when the rate has to be a record. |
| PrevailComply | *"$29.99 and it already generates CA eCPR."* | Also true, and its free WH-347 generator is good. Same boundary: it produces the file; it does not pin and retain the determination revision behind it. |
| WagePath | *"It integrates with ServiceTitan and Procore, and does more states."* | It does. It is also demo-gated, which means you cannot buy it on the Friday you need it. Different companies for different problems. |
| A payroll bureau (eBacon, Points North, Foundation) | *"One vendor for payroll and compliance."* | If you want someone to run payroll, use them — we explicitly do not run payroll, compute taxes or print cheques. Ratepin consumes the CSV your payroll already produces. |
| The GC-mandated portal | *"The GC makes me use LCPtracker and it's free."* | Then keep using it. Ratepin's job is to produce the file you upload to it, with a rate that traces to a determination. We feed the portal; we do not replace it. |
| Doing nothing | *"Enforcement is way down anyway."* | It is: DBRA concluded actions fell from 1,711 in FY2013 to 641 in FY2025, and California paused registration and eCPR enforcement for the year to 22 June 2025. **We will not sell on penalty fear.** The reason to buy is that the general contractor's payment release is gated on the report being right, every week, forever. |

That last row is a positioning decision, not a throwaway. Fear is the incumbent tone in this category and the enforcement curve is falling under it. A brand built on a shrinking threat is fragile; a brand built on a weekly payment gate is not.

### Step 8 — Layer on a trend

The trend is **the move from asserted compliance output to sourced compliance output.**

Three legs, all external to us:

1. **Machine-checked filings are replacing eyeballed ones.** California's eCPR is a schema-validated XML upload; New York's MPWR e-CPR became mandatory on 31 December 2025. A file either validates or it does not, and "we're pretty sure the rate is right" is not a field in any XSD.
2. **The WH-347 itself moved in this direction.** The Rev. Jan 2025 form (OMB 1235-0008, expires 01/31/2028) added a **Wage Determination No.** field to the header, along with columns 1A–1E, `(J)/(RA)` apprentice indicators, 6B fringe credit and 6C cash-in-lieu. The government put the determination number on the face of the form. Our whole product is the answer to that field being taken seriously.
3. **Unsourced machine output is being treated as a liability.** The FTC's Operation AI Comply sweep (25 September 2024) brought enforcement actions against businesses making unsubstantiated claims about AI capabilities, with Chair Khan stating that *"there is no AI exemption from the laws on the books."* The retrieval literature makes the same point technically: Lewis et al. (NeurIPS 2020) found retrieval-augmented generation produces "more specific, diverse and factual language" than a parametric-only baseline. **D6** is that finding compiled into an architecture: the model may only rank classifications drawn from the WD's own list, never generate one, and it touches no arithmetic at all.

Layered onto positioning: *the number on a compliance document should carry its source. Ratepin is what that looks like for certified payroll.*

### Step 9 — Capture the positioning

**The positioning statement** (canonical; any surface may compress it but none may contradict it):

> For **open-shop specialty subcontractors on federally funded construction** who file a weekly WH-347 and have to be able to say where each rate came from, **Ratepin** is a **certified-payroll rate-of-record engine** that turns a payroll CSV into the WH-347 PDF and California eCPR XML with **every rate pinned to a named wage-determination number, modification number and publication date** — unlike LCPcertified, CertifiedPayrollPro, PrevailComply and WagePath, which produce the form correctly but leave the rate an unsourced number the contractor typed, and unlike the agency portal the GC mandates, which Ratepin feeds rather than replaces.

**The one-sentence promise** (the compressed form, for headlines and the artifact):

> **Friday's certified payroll, with every rate traced to the wage-determination number, modification and publication date it came from.**

**The tagline:**

> **The rate of record, printed on the form.**

The tagline is deliberately a claim about *printed output*, not about accuracy, acceptance, completeness or time. It is falsifiable in ten seconds, for free, before an account exists — which is precisely what Hormozi's perceived-likelihood term responds to, and precisely what G1–G6 permit us to say today.

**The boundary statement** (must appear, in full, on every surface that renders or previews an artifact):

> **Ratepin computes and formats. You certify and file. This is not legal advice.**

### Step 10 — Evangelise the positioning

Ranked by leverage, and all three run without a person:

1. **The artifact footer** (§6.7) — a weekly, dated, provenance-stamped line travelling to a GC and typically two to five other parties.
2. **The free WH-347 generator, with the footer on it.** Note the honest framing forced by `NAMING.md` C-N1: the generator is table stakes (PrevailComply, constructionbids.ai and DOL all ship one). The *footer* is the differentiator, so the free tier must lead with provenance, not with "free."
3. **The corpus status page** — a public, live page showing active determinations mirrored, last successful crawl, reconciliation delta and current gate status. It is the only marketing asset in the plan that gets *more* persuasive the more sceptical the reader is.

---

## 2. Voice and tone

### 2.1 The register: the records-office counter clerk

Not run 1's ER doctor. That register was right for a panicking seller whose account went dark this morning. Ours is a recurring Friday, forever, and the buyer is a competent professional who has done this hundreds of times and does not need to be alarmed or rescued.

**The voice is a good counter clerk at a records office.** Unhurried. Precise about dates and numbers. Tells you exactly what the file says. Tells you, without being asked, what the file does *not* say. Will not guess, will not speculate about what an inspector might think, and does not get excited. When something is missing, says so flatly and tells you what would resolve it.

This register is not decorative. It is the only voice compatible with **A3** (no escalation to a human) and **D7** (state the rule, show the observable dates, decline to conclude). A brand that sounds eager will be asked questions it has structurally refused to answer.

### 2.2 Five traits, each with a behavioural test

A trait that cannot fail a test is decoration. Each of these can.

| Trait | What it means | Test (fails review if violated) | Enforced by |
|---|---|---|---|
| **1. Dated** | Every factual assertion carries its as-of | A sentence stating a rate without WD number + modification + publication date fails. In-product this is structural: the rate object cannot render without its provenance tuple | **Code** (renderer refuses), plus copy review |
| **2. Bounded** | Says what it does not do, unprompted, in the same size type | The "What Ratepin does not do" list appears above the fold on the pricing page and inside the signup flow, not in a footer or an FAQ | Copy review |
| **3. Unhurried** | No countdowns, no scarcity, no penalty theatre | Zero `!` in any surface. Zero instances of *before it's too late, don't risk, avoid penalties, protect yourself, one mistake could*. Zero fabricated deadlines | **Lint rule** in CI over copy files |
| **4. Arithmetically plain** | Shows the maths; never sells the machinery | *AI, AI-powered, smart, intelligent, magic, effortless, seamless, revolutionary* appear zero times in product or marketing copy. Every money figure on screen can be expanded to its arithmetic | **Lint rule** + copy review |
| **5. Refuses out loud** | When unsure, says so on the artifact, in ink | **DRAFT — NOT CERTIFIABLE** is emitted by the PDF writer and the signature block is structurally withheld — never a copy decision, never a toggle | **Code** (invariant + test) |

Trait 4 deserves a note. **D6** confines the model to two jobs — ranking candidate classifications constrained to a WD's own list, and drafting exception narrative into a fixed template with facts injected — and keeps it out of all arithmetic. Marketing "AI" would therefore describe the least important 2% of the system while implying it decides the money. That is the exact implied-performance claim the FTC warns about.

### 2.3 Voice dimensions

| Axis | Setting | Meaning here |
|---|---|---|
| Funny ↔ **Serious** | Serious | Never grim, never jokey. A misfiled certified payroll is a real problem and a light touch reads as not understanding it |
| Formal ↔ **Plain** | Trade-plain | The language of a jobsite trailer and a payroll desk. Not corporate ("leverage", "solution", "empower"), not chummy ("hey there", "let's get you sorted") |
| **Respectful** ↔ Irreverent | Respectful | The buyer knows this domain better than we do. Never explain Davis-Bacon to a Davis-Bacon contractor |
| Enthusiastic ↔ **Matter-of-fact** | Hard matter-of-fact | The product's credibility is the whole product. Enthusiasm reads as sales, and sales is what this buyer is avoiding by buying self-serve |

### 2.4 Register by moment

| Moment | Register | Example line |
|---|---|---|
| First contact (landing) | Plain statement of what it does | "Upload the payroll CSV. Get the WH-347 with the determination printed on it." |
| Free generator | Useful, unbranded, no upsell above the fold | "This produces a complete WH-347. No account, no limit." |
| Signup | Short, with the refusal boundary visible | "Union CBA fringe schedules are not supported. If your fringes come from a CBA, Ratepin is the wrong tool." |
| Normal generation | Almost silent; the artifact speaks | "12 workers · 3 classifications · WD CA20260012 Mod 4 (published 2026-03-14)" |
| Unmapped classification | Neutral, three options, verbatim scope text, no nudge | "This title isn't mapped for this determination. Three classifications in WD CA20260012 could apply. Their scope text is below." |
| Stale corpus | Dated, narrowed, unapologetic | "Verified against Mod 4, published 2026-03-14. Newer-revision check unavailable since 2026-08-13 02:14 ET." |
| Refusal | Flat and specific, never sorry | "Line 7 has no resolved classification, so this report is not certifiable. The signature block is withheld." |
| Dunning | Factual, no pressure, exit visible | "The card was declined on 3 March. Filings continue until 10 March. You can export everything at any time." |
| Cancellation | Helpful to the end | "Your full rate-of-record archive downloads here, as PDFs and CSV. It stays available for 30 days." |
| WD revision alert | Dated fact plus one action | "WD CA20260012 moved to Mod 5 on 2026-08-11. Four of your filings used Mod 4. Regenerate?" |

Note what is absent from every row: an apology, an exclamation mark, a reassurance, and a contact link.

---

## 3. Copy do / don't

Rows marked ⛔ are compliance or gate controls, not style. Violating one is a defect, not a preference.

### 3.1 Outcome and proof

| Don't | Do | Why |
|---|---|---|
| ⛔ "Accurate certified payroll, guaranteed" | "The arithmetic is deterministic code under property tests. The golden-payroll suite status is here." | G1: no accuracy claim before 30 consecutive green days |
| ⛔ "DIR-approved" / "DOL-approved" / "agency-accepted" | "Generated to the published eCPR schema (XSD hash `…`). **Generated, not acceptance-tested.**" | G2; D3 |
| ⛔ "Every wage determination, always current" | "4,236 active determinations mirrored as of 2026-08-13 02:00 ET. Reconciliation delta: 0.0%." | G3 |
| ⛔ "Saves you 15 hours a week" | "Median time from CSV upload to artifact download, measured in-product: *(not yet published — G4)*" | G4, and the underlying 15-hour figure is a misread (§5.4) |
| ⛔ "Zero human minutes" | "There is no support queue. Refunds are a button." | G5: describe the mechanism, not the measured result |
| "Trusted by contractors nationwide" | *(say nothing)* | Unsubstantiated and, at launch, false |

### 3.2 Urgency and pressure

| Don't | Do | Why |
|---|---|---|
| ⛔ "Avoid $28,619 penalties" | *(never)* | $14,308–$28,619 is the **False Claims Act civil penalty range per claim**, not a Davis-Bacon penalty. There is no DBA civil money penalty. §5.4 |
| ⛔ "Don't risk debarment" | "A wrong rate on a signed certified payroll is the contractor's signature, not ours. Ratepin withholds the signature block when it cannot resolve a line." | Fear-selling; also `research/01`: enforcement is falling, not rising |
| "Only 3 spots left" / countdown timers | *(never)* | No manufactured scarcity. The real deadline is the customer's, and it is on their calendar already |
| "Limited-time launch pricing" | "Prices are on the pricing page and they are the prices." | Trait 3 |

### 3.3 Register and tone

| Don't | Do |
|---|---|
| "We're so sorry — something went wrong!" | "The corpus snapshot could not be verified. New rate assertions are suspended. Existing pinned projects are unaffected." |
| "Let's get you compliant! 🎉" | "Upload the payroll CSV." |
| "Our powerful AI engine determines the right classification" | "Ratepin ranks the classifications in this determination and shows you their scope text. You choose; it remembers." |
| "Effortless certified payroll" | "One upload per crew per week." |
| Explaining Davis-Bacon to the buyer | Linking to 29 CFR Part 5 and getting out of the way |

### 3.4 Legal and professional register ⛔ *(all rows are controls)*

| Never say | Say instead | Basis |
|---|---|---|
| "We certify your payroll" | "You certify. Ratepin computes and formats." | The statement of compliance is signed by the contractor under 18 U.S.C. § 1001 |
| "We file for you" / "We submit to DIR" | "Ratepin produces the file you upload." | D9: we do not file, submit, e-sign or hold portal credentials |
| "Compliant" / "audit-proof" / "penalty-proof" | "Traceable to a named determination revision." | We cannot warrant a legal conclusion |
| "Legal advice" / "our compliance experts" / "our team reviews" | "This is not legal advice." + no team exists | A2/A3: there is no reviewer, and implying one is a lie about the product |
| Any conclusion on FAR 22.404-6 effectiveness | "Mod 14 was published 6 days before bid opening. Whether it is effective turns on a contracting-officer finding Ratepin cannot observe." | D7 |
| Any promise about SF-1444 | "Here is the conformance path. Ratepin will not file it." | D9 |

### 3.5 Autonomy and access ⛔ *(all rows are controls)*

| Never | Instead | Basis |
|---|---|---|
| "Contact support" anywhere in the compliance flow | The in-product explanation, the sources, and the refund button | A3, D7 |
| "Talk to sales" / "Book a demo" / "Request a quote" | The price, and a Checkout button | A1, D4, U4 |
| "Our onboarding team will…" | "Five fields: county, construction type, WD number or find-it-for-me, funding source, week ending." | A1 |
| Implying a human reviewed anything | "No human reviews any output, at any tier." | D9 — and this is a *selling point*, stated plainly |

### 3.6 Category and competitive language

| Don't | Do | Why |
|---|---|---|
| "Certified payroll software" (as self-description) | "Certified-payroll rate-of-record engine" | Step 6 — that category is priced at $12 |
| "The LCPtracker alternative" | "Ratepin produces the file you upload to LCPtracker." | We feed portals; and that search term belongs to CertifiedPayrollPro's content already |
| "Unlike our competitors, who…" | Name them, state what they genuinely do well, then state the boundary | Step 7; a false competitive claim is the fastest way to lose this buyer |
| "The only tool that…" | "Ratepin prints the determination revision on the artifact." | Superlatives are objective claims requiring substantiation |
| ⛔ "Nobody else has this data" / "SAM publishes no bulk download" | "Ratepin keeps a dated copy of every revision it has seen, so a superseded revision is still readable here after SAM overwrites it." | Refuted: archived revisions are fetchable and resold. §5.4 |

### 3.7 Product and UI microcopy

| Don't | Do |
|---|---|
| "Processing…" | "Reading 47 payroll rows." → "Matching 3 classifications." → "Writing WH-347." |
| "Error: validation failed" | "Line 7: hours (44.0) exceed the CWHSSA threshold but no premium is present. Ratepin will not compute this line for you." |
| "Success!" | "WH-347 ready. 12 workers. WD CA20260012 Mod 4, published 2026-03-14." |
| "Are you sure?" | "This regenerates 4 filings against Mod 5. The Mod 4 versions stay in the archive." |
| Greyed-out disabled buttons | A visible reason: "Signature block withheld — 1 unresolved line." |

---

## 4. Naming invariants inherited

The seven invariants in `NAMING.md` §8 are binding on all copy and are not restated in full here. In summary: never claim to certify, file, submit or approve · never imply a person is reachable · never name anything after an unmeasured outcome · never enter the closed lexical fields (`Wage*`, `Prevail*`, `Cert*`, `LCP*`, `*Bacon*`, `*Tracker`, `*Watch`, `-wright`) · never use superlatives or "AI-powered" as identity · never code union (`Book`, `Scale`, `Local`, `Hall`) · brand the pin, not the form.

---

## 5. Claims policy

This is the section that outranks the rest. If a piece of copy is beautiful and violates §5, it does not ship.

### 5.1 The rule

Two sources, one rule.

**External:** the FTC's *Policy Statement Regarding Advertising Substantiation* requires that "advertisers and ad agencies have a reasonable basis for advertising claims before they are disseminated," for **express and implied** objective claims alike; where an ad implies a level of support, the advertiser must hold the support consumers would reasonably infer. The Operation AI Comply enforcement sweep applies the same standard to AI-enabled products: there is no AI exemption.

**Internal:** `PLAN.md` — *"No claim of a measured outcome (success rate, accuracy, turnaround) ships before it is actually measured"* — implemented by **G1–G6**.

The operating rule, in one line:

> **Until a gate clears, we may describe the mechanism and we must refuse the outcome.**

Describing a mechanism is not a claim about results, so it needs no measurement — but it must be *true of the shipped system*, which is why five of the six mechanism statements below are enforced by tests rather than by review.

### 5.2 The gate table

| Gate | Banned until it clears | Permitted **today** (mechanism only) | The exact sentence permitted **after** |
|---|---|---|---|
| **G1** Rate correctness — ≥500-line golden suite, ≥25 WDs, ≥8 states, 100% exact match, 30 consecutive green days | *accurate · error-free · correct rates · guaranteed right · no mistakes · 99.x%* | "All money arithmetic — gross, fringe credit, cash-in-lieu, CWHSSA overtime, deductions, net — is deterministic code under property tests. No model touches it. A divergence in the golden-payroll suite blocks both the corpus promotion and the build." | "*N* golden payrolls across *M* determinations in *K* states matched exactly on every deploy for 30 consecutive days, ending *(date)*. Suite and results: *(link)*." |
| **G2** Form acceptance — ≥50 WH-347 and ≥25 CA eCPR confirmed accepted, XSD hash green throughout | *accepted · approved · DIR-approved · DOL-approved · guaranteed to pass · compliant* | "The WH-347 is emitted to the DOL form geometry (Rev. Jan 2025, OMB 1235-0008). The eCPR XML validates against the published schema, pinned by hash. **Generated, not acceptance-tested.**" | "*N* WH-347s and *M* CA eCPR files generated by Ratepin were confirmed accepted by the receiving GC or agency between *(date)* and *(date)*." |
| **G3** Corpus completeness — nightly reconciliation, delta ≤0.5%, 60 days with zero unexplained delta | *every wage determination · all determinations · complete · always current · nationwide coverage* | "*N* active determinations mirrored as of *(timestamp)*. Reconciliation delta against the index: *x*%. Last successful crawl: *(timestamp)*." (live on the status page) | "Zero unexplained reconciliation delta for 60 consecutive days, ending *(date)*." |
| **G4** Time saved — measured in-product median, ≥100 real filings | *saves N hours · cuts your Friday in half · faster than Excel* — **and every DOL-derived extrapolation** | "Ratepin reads a payroll CSV and writes the WH-347 and the eCPR XML. There is no queue and no turnaround window." | "Median *N* minutes from payroll-CSV upload to artifact download, across *M* filings, *(date range)*." |
| **G5** Autonomy — instrumented human-minutes counter, 90 days below 2 min/customer/month at ≥50 paying accounts | *zero human minutes · fully autonomous · no humans involved · runs itself* | "There is no support queue. No human reviews any output, at any tier. Refunds are a button. When Ratepin cannot resolve something it says so in the product." | "Measured human minutes per customer per month: *N*, across *M* paying accounts, over 90 days ending *(date)*." |
| **G6** Risk reversal — staleness auto-credit must fire in a chaos test with upstream killed in staging | *guaranteed fresh · we'll credit you automatically · service-level guarantee* — **the credit may not be advertised at all** | *(silence — the mechanism may be built and may fire; it may not be marketed)* | "If the corpus goes unverified beyond *(SLA)*, Ratepin credits the month automatically. Verified in chaos test *(date)*." |

**How a gate clears, with no human.** Each gate is a boolean computed by the same job that runs its measurement, written to a signed `claims.json` served by the app. Gate-locked copy is rendered from that file: the marketing site reads it and renders the mechanism sentence when the flag is false and the measured sentence, with its numbers and dates injected, when it is true. **A human cannot promote a claim by editing copy, and a regression automatically demotes a live claim back to the mechanism sentence.** This is `PLAN.md`'s literature-grounding standard implemented the way `12factor.net` recommends guarantees be implemented — structurally, in the codebase, not procedurally in a review checklist.

### 5.3 Permanently banned — no gate ever unlocks these

| Never | Why |
|---|---|
| "We certify / we file / we submit / we sign" | Not true, and D9 forbids it becoming true |
| "Compliant" / "audit-proof" / "penalty-proof" / "protects you from debarment" | A legal conclusion we cannot warrant, about a document we do not sign |
| "Legal advice" / "our compliance experts" / "our team" | There is no team. A2/A3 |
| "Contact us" / "talk to sales" / "book a demo" | A1/A3 |
| Any success rate, pass rate or approval rate without its denominator and method | `PLAN.md`; run 1's N10/R11 discipline carried forward |
| "The only" / "the best" / "the leading" / "#1" | Objective superlatives requiring substantiation we will never have |
| Union CBA fringe support, in any tense | D9 refuses it at signup rather than approximating it |

### 5.4 Claims retired by evidence — and what replaces them

These four appear in `shortlist.json` and in the phase-1 narrative. All four were falsified in validation. **They must never be printed, in any surface, ever.** Each has a replacement that is true.

| Retired claim | What the evidence actually says | Print this instead |
|---|---|---|
| "Over an hour per employee per report · 15+ hours a week for a 15-person crew · ~$19,500/yr on one project" | The DOL burden estimate is **per form, not per employee**: 122,936 respondents, 11,310,112 annual responses, 10,556,105 burden hours — **55 minutes per form plus 1 minute recordkeeping**, ≈ 85.9 hours per filer per year (≈1.65 hr/week). G4 already bans DOL-derived extrapolation; this is why | Nothing about time, until G4 clears |
| "DBA civil penalties run to $28,619 per violation" | **$14,308–$28,619 is the False Claims Act civil penalty range per claim.** There is no Davis-Bacon civil money penalty. CWHSSA liquidated damages are a per-worker-per-day figure (a dated corpus value, not a constant) | Nothing about penalties. We do not sell on fear |
| "Incumbents are demo-and-quote with $995–$4,995 setup fees, so zero setup fee is the wedge" | Refuted for the sub-facing SKUs: LCPcertified publishes $12/report and $145/mo; CertifiedPayrollPro publishes $49/$99/$249 with $0 setup and a no-credit-card trial; PrevailComply publishes $29.99/mo. **D3 already retired "zero setup fee" as positioning** | "No demo, no quote, no call" as a *mechanism* (U4), never as a price claim |
| "SAM publishes no bulk download, so the revision archive is unreconstructable" | Archived revisions are fetchable at `sam.gov/api/prod/wdol/v1/wd/{ref}/{rev}` as plain text, and govconapi.com resells 90,033 WDs with all revisions at $19/mo | "Ratepin keeps a dated copy of every revision it has seen, so a superseded revision is still readable here after SAM overwrites the live document." (An assembly-and-latency claim, which is true) |

Also never printed because unverified: "~168 data points per worker"; the "revision hell" quote; any count or characterisation of the open-shop 5–75-employee segment, which `research/01` found is not counted anywhere.

### 5.5 Numbers we may print today, with their sources

Every number on a public surface must resolve to one of these, and must carry its as-of date:

- Active DBA wage determinations mirrored, with the crawl timestamp and reconciliation delta — **our own live corpus status page** (G3 mechanism sentence).
- WH-347 form identity: **Rev. Jan 2025, OMB 1235-0008, expires 01/31/2028** — dol.gov.
- Competitor prices, when quoted for comparison: quoted verbatim with the page and the date fetched, never paraphrased into a range.
- Our own prices: $0 · $49 · $99 · $249 · $599, per **D4**.
- Statutory citations: 29 CFR Part 5, 18 U.S.C. § 1001, FAR 22.404-6 — cited, never characterised.

### 5.6 What the customer is allowed to verify, free, before paying

Because U1 is the entire position, the proof must be pre-paywall and falsifiable:

1. The free WH-347 generator emits a complete form **with the provenance footer on it**.
2. The county × craft rate pages show the WD number, modification, publication date and the mirrored source URL for every rate.
3. The corpus status page is public, live and dated.
4. The refusal behaviour is demonstrable in the free tier: feed it an unmappable title and watch it decline to guess.

---

## 6. Messaging hierarchy for the landing page

### 6.1 The hierarchy

| Level | Job | Draft copy |
|---|---|---|
| **L0** Category | Sort us correctly in four seconds | "Certified-payroll rate-of-record engine for federally funded construction." |
| **L1** Promise | The one sentence | "Friday's certified payroll, with every rate traced to the wage-determination number, modification and publication date it came from." |
| **L2** Proof, before signup | Show, don't assert | A real WH-347, rendered, with the footer legible and one rate highlighted back to WD CA20260012 Mod 4 published 2026-03-14. Beside it: "Make one yourself. No account." |
| **L3** The four differentiators | U1–U4, in that order, each as a fact | "The revision is on the artifact." · "It withholds the signature block rather than guess." · "It asks which classification once." · "No demo, no quote, no call, ever." |
| **L4** The boundary | Trust is bought with subtraction | "What Ratepin does not do" — 8 lines from D9, above the fold on pricing |
| **L5** Price | Plainly, with no gate | $0 / $49 / $99 / $249 / $599. "These are the prices." |
| **L6** The refusal, demonstrated | The credibility spike | The DRAFT — NOT CERTIFIABLE artifact, shown, with the reason line |
| **L7** Sources and freshness | The sceptic's landing spot | Live corpus status: determinations mirrored, last crawl, delta, gate status |

### 6.2 Why L1 leads with the trace and not with time or money

`research/01` established that the time-saved case cannot carry any tier above Solo — eliminating 100% of the DOL burden only pays for $99/mo above a ~$13.83/hr clerical rate, and Crew needs ~$34.80/hr *and* total elimination. **The economic case for the price ladder is D3's rate-of-record wedge and nothing else.** A headline about time would therefore be both unmeasurable (G4) and strategically self-defeating.

### 6.3 Why L4 exists at all, and sits so high

A buyer who has been sold to by this category before is defended against enthusiasm and undefended against subtraction. Stating loudly that we do not run payroll, do not file, do not support union CBA fringe, do not cover states beyond CA in v1, and have no humans, does four jobs at once: it disqualifies the wrong buyer before they pay (which protects the refund rate and therefore A6), it makes every remaining claim more credible, it prevents the support load that A6 forbids, and it is simply true.

### 6.4 The eight lines of L4 (verbatim, from D9)

> Ratepin does not run payroll, compute taxes or print cheques — it reads the CSV yours produces.
> Ratepin does not file, submit or e-sign anything, and never holds your portal credentials.
> Ratepin does not support union CBA fringe schedules. They are not in public wage determinations.
> Ratepin does not cover Service Contract Act determinations.
> Beyond the federal WH-347, Ratepin covers California eCPR only. NY, WA, NJ and IL are not in v1.
> Ratepin does not file SF-1444 conformance requests, or opine on apprenticeship ratios.
> Ratepin does not conclude whether a wage determination is effective. It shows the dates and the rule.
> No human reviews any Ratepin output, at any tier. There is no support queue.

### 6.5 Surface map

| Surface | Leads with | Must carry | Must never carry |
|---|---|---|---|
| Landing | L0 + L1 | Boundary statement | Any gate-locked claim; any contact link |
| Pricing | L5 + L4 above the fold | All five prices, the overage rule, the export-on-cancel promise | "Contact us for enterprise" |
| Free WH-347 generator | The tool itself | The provenance footer; one line on what the paid tier adds | An interstitial, an email wall, or an upsell above the fold |
| County × craft rate pages | The rate table | WD number, modification, publication date, mirrored source URL, as-of timestamp | Any rate without its determination |
| **The artifact** | The form | The footer block (§6.7) | Marketing language of any kind |
| WD-change alert email | The dated fact | Which of the recipient's filings used the superseded modification | Urgency framing |
| In-product refusal | The specific unresolved thing | What would resolve it | An apology or a support link |
| Dunning | The declined date and the cut-off date | The export link | Pressure |
| Cancellation | The export | 30-day availability | A retention offer or a "are you sure" guilt screen |
| Corpus status page | The numbers | Last crawl, delta, gate booleans | Prose |

### 6.6 Adaptations by segment

- **Multi-project, multi-county sub (the target):** lead L1 with *"across every project and county you're running."*
- **First-time DBA sub:** lead with the free generator and the boundary list; do not sell a subscription to someone with one project — say LCPcertified is cheaper for them, because it is, and because saying so is the single most credible sentence on the site.
- **A sub whose GC mandates a portal:** lead with "Ratepin produces the file you upload." Never position against the portal.

### 6.7 Surface zero — the artifact footer specification

This is the most-read Ratepin surface and is therefore specified here, not left to the design system.

Every generated WH-347 page and every eCPR XML carries, in the same order and the same words:

```
Rates of record: WD CA20260012, Modification 4, published 2026-03-14.
Corpus snapshot 8f3a91c2 · generated 2026-08-14 16:41 ET · ratepin.com
Ratepin computes and formats. The contractor certifies and files.
```

Rules, binding on `DESIGN_SYSTEM.md`:

- **Monospace, tabular figures, minimum 7.5pt**, black on white, no colour, no logo lockup, no icon. It must photocopy, fax and scan.
- The identifiers (`CA20260012`, `4`, `8f3a91c2`) are **never** abbreviated, wrapped mid-token, or rendered in a proportional face.
- The footer is written by the PDF/XML writer, is covered by a golden-file test, and is **not** configurable, removable, or subject to a white-label option at any tier. It is the distribution mechanism (D8) and the provenance record (U1) simultaneously.
- On a `DRAFT — NOT CERTIFIABLE` artifact, a fourth line states the count and reason of unresolved lines, and the signature block is absent — not greyed, absent.

---

## 7. Visual direction brief for the design system

`DESIGN_SYSTEM.md` implements this. The brief is a set of constraints and their reasons, not a mood board.

### 7.1 The governing idea

**The product should look like the record it produces.**

The reference set is the buyer's own document world: the WH-347 itself, a SAM wage determination PDF, a DIR eCPR upload screen, a plan-room drawing set, a submittal transmittal. Not fintech, not developer tools, not "modern SaaS." The design goal is that a printed Ratepin screen would not look out of place stapled to a project file — because it often will be.

Where an external system is the right precedent, it is the **U.S. Web Design System**: it is what "official" looks like to this buyer, it is what dol.gov and sam.gov have trained them on, and it is accessible by construction. We borrow its *register and legibility discipline*, not its federal identity — we must never look like a government site, which would be an implied endorsement claim.

### 7.2 Typography

- **One workhorse sans for the interface.** Public Sans (the USWDS face, open source, "strong, neutral, principles-driven… based on a traditional American form") or a system stack. No display face. No second personality face.
- **One monospace, load-bearing.** Every identifier — WD number, modification number, corpus hash, serial, timestamp, file name — renders in it, everywhere, without exception. The monospace *is* the visual signature of provenance in this product; if the reader learns one thing from the type system it should be "mono means it came from the record."
- **Tabular lining numerals are mandatory** anywhere money, hours or rates appear, in the UI and in the PDF. Columns of hours that do not align are a legibility failure in a product whose whole subject is columns of hours.
- **Body text at 16px minimum**, measure held to **45–90 characters** (66 the target). Uppercase is barred from running text.
- Type scale: at most six sizes. Weight range: at most three. Hierarchy is carried by size, rules and space — never by colour.

### 7.3 Colour

- **Near-monochrome. Ink on paper.** A near-black text colour, three or four greys, a paper-white ground.
- **Exactly one accent hue**, used only for interactive affordance (links, focus, the primary action). Never for decoration, never for a hero gradient, never as a brand flourish on a chart.
- **Three semantic states, and only three**, each with a mandatory text label so colour is never the sole carrier:
  - **Pinned / verified** — neutral-strong (near-black rule + `PINNED` label). Deliberately *not* green: a pinned rate is not a promise that it is correct, and green would make a G1 claim the design system is not allowed to make.
  - **Stale / narrowed** — amber, always with a date: `NEWER-REVISION CHECK UNAVAILABLE SINCE …`
  - **Refused / not certifiable** — red, always with the reason: `DRAFT — NOT CERTIFIABLE · 1 UNRESOLVED LINE`
- No gradients, no glass, no glow, no shadow beyond a 1px hairline rule, no rounded-corner card stacks. The visual grammar is **ruled tables**, not floating cards.

### 7.4 Layout and density

- The primary object is **a row of numbers**. Layout optimises for scanning many rows, not for whitespace: dense ruled tables, left-aligned text, right-aligned figures, sticky headers, zebra-free (rules instead of fills — they photocopy).
- Two-column maximum. No dashboards of tiles. No sparklines on things that are not time series.
- A **provenance rail** is a first-class layout element: on any screen showing a rate, its WD number, modification, publication date and source link are visible without a click. If they do not fit, the rate does not fit.
- **Print stylesheet is a requirement, not a nicety.** This buyer prints. Every data view must produce a clean A4/Letter page with the footer block from §6.7.

### 7.5 Motion

Essentially none. No skeleton shimmer, no spring easing, no page transitions. Progress during generation is a **determinate, counted, factual** line ("Reading 47 payroll rows"), because a truthful progress indicator is a small instance of the same discipline as the claims policy. Maximum permitted duration for any transition: 150ms, opacity or position only.

### 7.6 Iconography and imagery

- **No decorative icons.** Icons exist only for the three semantic states and for file types.
- **No stock photography.** No hard hats, no smiling crews at golden hour, no drone shots. The product's imagery is the artifact: render a real WH-347.
- **No illustration system.** No mascot. No abstract blobs.

### 7.7 The logo

A **wordmark, not a symbol**: `Ratepin` set in the interface sans, one capital, tight tracking, no ligature tricks.

If a mark is required for a favicon or an app icon, it is a **registration mark**: a short vertical tick meeting a horizontal rule — the surveyor's convention for a point fixed to a line, and a literal picture of the product's name. Monochrome, no container shape, legible at 16px. No pin-drop map marker (that reads as location, and half the SaaS market uses it).

### 7.8 Accessibility, as a hard floor

- **WCAG 2.2 AA**, which is a W3C Recommendation. Text contrast **≥ 4.5:1** (SC 1.4.3); UI components and meaningful graphics **≥ 3:1** (SC 1.4.11).
- **Colour is never the sole carrier of state.** Every state has a word. This is both an accessibility rule and a brand rule: the refusal must survive being printed in greyscale on a jobsite printer.
- Full keyboard operation of the entire generate-and-download path. Visible focus at ≥3:1.
- Dark mode exists and is honest — but light is primary and is what the print and PDF paths use, because the artifact is a white document.

### 7.9 Ten things the design system may not do

1. A hero gradient, or any gradient.
2. A colour that means "good" on a rate we have not measured (G1).
3. A green checkmark next to anything gate-locked.
4. A trust badge, a logo wall, or a testimonial we do not have.
5. An illustration of a person, implying staff.
6. A chat bubble, anywhere (A3).
7. A countdown, a pulse, or an attention-seeking animation.
8. A rate rendered without its determination beside it.
9. A federal seal, flag, agency logo, or anything that reads as government endorsement.
10. A configurable or removable artifact footer.

---

## 8. Governance — how this stays true with nobody watching

### 8.1 Pre-publish checklist (runs in CI over copy files, not in someone's head)

1. Zero `!` characters in copy strings.
2. Banned-term lint passes: the union of §3, §4, §5.3 and §5.4 word lists.
3. Every gate-locked string is rendered from `claims.json`, not hard-coded — a literal match against a measured-claim template outside the renderer fails the build.
4. Every public number has an as-of date in the same sentence.
5. The boundary statement is present on every artifact-rendering surface.
6. No `mailto:`, no chat widget, no "contact" string in any compliance-flow route.
7. Every competitor price quoted carries its source URL and fetch date.
8. The artifact golden-file test passes, footer byte-for-byte.

### 8.2 Enforced in code rather than in review

| Invariant | Mechanism |
|---|---|
| A rate cannot render without its provenance tuple | Type-level: the render function takes a `PinnedRate`, which cannot be constructed without `(wd_number, modification, published_date, snapshot_hash)` |
| DRAFT — NOT CERTIFIABLE and signature withholding | PDF writer branch + golden-file test; no feature flag, no tier override |
| Gate-locked claims | `claims.json` is written only by the measurement jobs; the marketing renderer has read access only |
| Footer immutability | Golden-file test on every emitted artifact |
| No human escalation path | Route-level test: no compliance-flow route may link to a `mailto:`, a chat script, or a `/contact` path |

### 8.3 Review cadence

Weekly, unattended, on the same schedule as the eCFR diff (D5): re-fetch every competitor price and product page cited in §1 Step 2 and §5.4, hash-diff them, and open a flagged item when one moves. A brand book whose competitive facts rot is a brand book that starts lying — and in this market they moved twice during phase 1 alone.

---

## 9. Challenge notes

Binding decisions implemented as specified; disagreements recorded, not acted on unilaterally.

**Challenge C-B1 — D4's price ladder is not defensible against LCPcertified on the metric D4 chose.** D4 prices Solo at $99 for 1 project and Crew at $249 for 5. LCPcertified publishes **$145/mo for 5 active projects** and **$12/report**. On D4's own metric, Crew is 72% more expensive for the same project count with narrower state coverage. `research/03` proposes replacing caps with included-filing allowances plus $2.50/filing overage at the same price points, which resolves it. Implemented as D4 specifies; the brand consequence is recorded here: **price is never a message on any Ratepin surface**, and the pricing page must not invite a per-project comparison it loses.

**Challenge C-B2 — D3's free tier is a funnel, not a wedge, and the brand must not imply otherwise.** PrevailComply ships a free WH-347 generator; constructionbids.ai ships one; DOL publishes both a fillable form and a web tool; LCPtracker announced a free single-project LCPcertified tier in 2018. The generator is table stakes. Only the *provenance footer on the free artifact* is differentiating, which is why §6.5 requires the free tier to lead with the footer rather than with the word "free."

**Challenge C-B3 — D8 channel 1 collides with the tool we most need to be trusted.** The free generator is simultaneously our funnel and the proof of U1, and those pull in opposite directions: funnels want email walls, proof wants no friction. Resolved in favour of proof — no email wall, no interstitial, no upsell above the fold — and recorded because it costs measurable list growth on the channel `research/01` already flagged as the weakest.

**Challenge C-B4 — "no support escalation" and "credibility-first brand" are in genuine tension for this buyer.** A construction payroll administrator's default trust signal is a phone number. We are removing the single strongest credibility affordance the category has, and the compensating assets — the public corpus status page, the pre-paywall falsifiable artifact, the refusal semantics, the self-serve refund — are untested substitutes. This is the largest brand risk in the plan. It is A3, so it is implemented; it is also the first thing to instrument.

**Challenge C-B5 — the target segment is uncounted.** `research/01` found no source that sizes open-shop DBA subcontractors with 5–75 field employees. Every segment statement in §1 is therefore a hypothesis, and the brand should not print segment claims ("built for the 40,000 subs who…") that no source supports.

---

## 10. Hypotheses, flagged per the literature-grounding standard

- That the buyer values revision-level provenance enough to pay 3× PrevailComply for it. **Unmeasured.** This is the load-bearing assumption of the entire brand.
- That the artifact footer functions as an acquisition channel (D8). Plausible, cheap, unmeasured.
- That the records-clerk register outperforms the category's incumbent fear-based register with this buyer. A reasoned choice from `research/01`'s falling-enforcement finding; no test exists.
- That "no phone number" is survivable for a construction buyer (C-B4).
- That naming provenance rather than protection is the higher-converting frame. Untested.
- Competitor prices and features in §1 Step 2 were fetched on 2026-08-13 and will drift; the §8.3 job exists because of this.
- Figures drawn from the phase-1 validation files rather than re-derived here: the 89 FR / OMB 1235-0008 burden arithmetic, the FCA penalty range, the DBRA concluded-actions trend, the CA DIR enforcement pause, the eCPR schema constraints, and the $0.06/filing unit cost. Each is sourced in those files; none was independently re-computed in this document.

---

## 11. Frameworks applied

- **April Dunford**, *Obviously Awesome* (2019) — the ten-step process run explicitly in §1; Step 2's rule that alternatives include "do nothing"; Step 6's insistence that the category is a choice, not a description; Step 8 trend layering.
- **Clayton Christensen**, Jobs-to-be-Done — D2's circumstance supplies the promise sentence and the L1 headline.
- **Geoffrey Moore**, *Crossing the Chasm* — the beachhead is narrowed to multi-project multi-county open-shop subs, and §6.6 sends the single-project buyer to a competitor on purpose.
- **Alex Hormozi**, *$100M Offers* (2021) — perceived likelihood of achievement moves on demonstration, not assertion, hence §5.6's pre-paywall falsifiable proof; and the rule that urgency must be real and externally imposed, hence §3.2.
- **Madhavan Ramanujam & Georg Tacke**, *Monetizing Innovation* (2016) — minivation; a brand that reads as a cheaper form-filler makes the position above LCPcertified indefensible (C-B1).
- **Hamilton Helmer**, *7 Powers* (2016) — Branding power requires durable exclusive association; here it is built on the recurring dated artifact rather than on a wordmark with a diluted root.
- **Rob Fitzpatrick**, *The Mom Test* — §1 Step 1 is written as falsifiable hypotheses because no buyer has been asked to pay.
- **Jakob Nielsen**, 10 Usability Heuristics — #1 visibility of system status (the dated staleness banner), #2 match with the real world (the buyer's vocabulary), #9 help users recognise and recover from errors (the refusal microcopy in §3.7).
- **Patrick Lewis et al.**, "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS 2020 — retrieval yields "more specific, diverse and factual language"; the technical warrant for D6's constrained retrieve-and-rank design and for §1 Step 8.
- **Twelve-Factor App** — guarantees implemented structurally in the codebase rather than procedurally in a runbook; applied to the claims renderer in §5.2 and the invariants in §8.2.
- **U.S. Web Design System** — typography, measure and legibility discipline (§7.2); the register of "official" for this buyer.
- **W3C WCAG 2.2** — the accessibility floor in §7.8.
- **FTC**, *Policy Statement Regarding Advertising Substantiation*, and Operation AI Comply (25 Sep 2024) — the external basis for §5.

---

## 12. References

**Verified in-session, 2026-08-13**

- LCPcertified pricing and state XML exports — https://lcptracker.com/solutions/lcpcertified/ ($12/report; $145/mo up to 5 active projects; $1,300–$7,400/yr Plus; to $18,200/yr Professional; CA DIR, WA L&I, MD DLLR)
- LCPtracker free single-project tier announcement — https://lcptracker.com/press-release/lcptracker-introduces-free-subscription-tier-for-single-contractor-certified-payroll-solution/
- CertifiedPayrollPro, California certified payroll — https://www.certifiedpayrollpro.com/california-certified-payroll
- CertifiedPayrollPro, LCPtracker alternatives — https://www.certifiedpayrollpro.com/blog/best-lcptracker-alternatives-2026
- PrevailComply, California DIR eCPR guide — https://prevailcomply.com/blog/california-dir-ecpr-guide-small-contractors.html
- PrevailForms — https://prevailforms.com/
- WagePath, certified payroll reporting — https://wagepath.com/certified-payroll-reporting
- davisbaconrates.com vendor comparison — https://davisbaconrates.com/certified-payroll-software
- Free WH-347 generator, constructionbids.ai — https://constructionbids.ai/tools/sub/wh-347-payroll-generator
- WageLens — https://www.wagelens.com/
- USPTO TSDR, LCPTRACKER serial 99924010 (filed 2026-07-06, classes 009/035/041/042/045) — https://tsdr.uspto.gov/statusview/sn99924010
- FTC, Policy Statement Regarding Advertising Substantiation — https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation
- U.S. Web Design System, Typography — https://designsystem.digital.gov/components/typography/
- W3C, Web Content Accessibility Guidelines 2.2 — https://www.w3.org/TR/WCAG22/
- DOL WHD, Instructions for Completing Form WH-347 — https://www.dol.gov/agencies/whd/forms/wh347
- DOL WHD, Simplify Your Davis-Bacon Certified Payroll Reporting — https://www.dol.gov/agencies/whd/forms/wh347-web
- DOL WHD, data and enforcement statistics hub — https://www.dol.gov/agencies/whd/data

**Regulatory basis**

- Federal Register, Agency Information Collection Activities; Davis-Bacon Certified Payroll (30 Aug 2024) — https://www.federalregister.gov/documents/2024/08/30/2024-19482/agency-information-collection-activities-comment-request-information-collections-davis-bacon
- Federal Register, Submission for OMB Review; Davis-Bacon Certified Payroll (27 Nov 2024) — https://www.federalregister.gov/documents/2024/11/27/2024-27720/agency-information-collection-activities-submission-for-omb-review-comment-request-davis-bacon
- Supporting Statement, OMB 1235-0008 — https://omb.report/icr/202410-1235-006/doc/149781200
- 29 CFR Part 5 — https://www.ecfr.gov/current/title-29/subtitle-A/part-5
- FAR 22.404-6 — https://www.acquisition.gov/far/22.404-6
- DOL WHD Fact Sheet 66, DBRA — https://www.dol.gov/agencies/whd/fact-sheets/66-dbra
- California DIR, Certified Payroll Reporting — https://www.dir.ca.gov/Public-Works/Certified-Payroll-Reporting.html
- SAM.gov wage determinations — https://sam.gov/wage-determinations
- FTC, "FTC Announces Crackdown on Deceptive AI Claims and Schemes" (Operation AI Comply, 25 Sep 2024) — https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes
- FTC, Artificial Intelligence topic hub — https://www.ftc.gov/industry/technology/artificial-intelligence

**Literature**

- Lewis et al., "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks," NeurIPS 2020 — https://arxiv.org/abs/2005.11401
- Nielsen Norman Group, 10 Usability Heuristics — https://www.nngroup.com/articles/ten-usability-heuristics/
- The Twelve-Factor App — https://12factor.net/
- Anthropic, Building Effective Agents (workflow vs. agent; simplest sufficient design) — https://www.anthropic.com/engineering/building-effective-agents

**Internal, binding**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D1–D10, G1–G6
- `run-2/phase-1-ideation/research/01-demand-pmf.md` · `02-competition-positioning.md` · `03-gtm-pricing.md` · `04-mvp-scope.md`
- `run-2/phase-2-build/identity/NAMING.md`

---

**Document status:** binding for phase 2 and phase 3. Amendments require a named source, a fetch date, and a note of what they supersede.
