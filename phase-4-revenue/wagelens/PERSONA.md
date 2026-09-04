# WageLens — BUYER PERSONA (v1)

**Product:** prevailing-wage lookup + weekly certified payroll (WH-347) for small specialty
subcontractors on federally funded and state prevailing-wage construction.
**Market:** US, English (PLAN.md A2). **Launch coverage:** federal Davis-Bacon, 50 states,
WH-347 (PLAN.md A11).
**Status:** binding for wave 1. Governs `IDENTITY.md`, `UX.md`, `BACKLOG.md`, `OFFER.md`,
`LANDING_SPEC.md` and every word of outbound copy.
**Author:** Buyer & Identity agent, wave 1. **Date:** 2026-09-03.
**Reviewer:** wave 1b (PIPELINE.md stage 5). Authors do not review their own work.

---

## 0. The evidence rule this document is written under

`PIPELINE.md` standing rule: *"Sources are opened, not remembered. A rate, a rule, a fee or a
claim without a fetched URL and a date does not ship."*

Every factual claim below carries a bracketed source key resolved in **§13**. Every source was
fetched on **2026-09-03** from this environment. Three grades are used and they are never
mixed:

| grade | meaning | how it may be used |
|---|---|---|
| **[R]** | Regulation or government form. The law, or DOL's own words. | Quotable as fact, in product and in copy. |
| **[V]** | Vendor-published (a competitor's price page, a vendor blog). | Quotable **as that vendor's claim**, attributed. Never as fact. |
| **[U]** | User-published (a public review, a public forum thread). | Quotable as *what a buyer said*, never as a market fact. Roles and company sizes only — **no names** (PIPELINE.md: no private individuals). |

Where a claim could not be sourced, it is written down as an **assumption** in **§12** with the
reasoning, per PIPELINE.md stage 4 failure rule. Nothing in this file is remembered.

**One inherited claim is corrected here, not repeated.** `phase-1-ideation/shortlist.json` says
misclassification carries "$13,508 per violation." **That figure is not supportable.** DOL's
civil money penalty table contains **no Davis-Bacon civil money penalty at all** [R7]. The
numbers that survive the source check are in §7.3. This matters commercially: the whole product
is sold on being right about the law, so the marketing must not be the first thing that is wrong.

---

## 1. The buying unit

This is a **five-role buying unit inside a company of 5–50 people**, not a persona. In a firm
this size the roles are jobs, not headcount: one person often holds three of them. Design for
the *roles*; sell to the *owner*; make the *office manager* the hero.

### 1.1 P1 — The owner (economic buyer, signs the Statement of Compliance)

Runs a specialty sub with 5–50 field employees. Bids the work, prices the job, and is the person
whose name is on the certification. The Statement of Compliance is not paperwork to him — it is a
sworn statement: DOL's own instructions say it "is subject to the penalties provided by 18 U.S.C.
§ 1001, namely, a fine, possible imprisonment of not more than 5 years, or both. Accordingly, the
party signing this statement should have knowledge of the facts represented as true." [R8]

He is buying **the end of being personally exposed to something he does not understand**. He
approves anything under a few hundred dollars a month on his own card without a meeting, and he
will not sit through a demo to find out what it costs. In his words, from the market he already
shops in: *"You're on the jobsite, bidding jobs, running crews. You can't burn 2-3 hours every
Friday on spreadsheets."* [V11]

**What he actually decides:** whether to buy at all, and whether the price is insulting. He does
not evaluate features.

### 1.2 P2 — The office manager (the user, and the champion)

The single most important human in this product. She does AP, AR, answers the phone, chases lien
waivers, and does payroll. The certified payroll lands on her desk. An industry description of
exactly this role: the work "is often the same person handling accounts payable, accounts
receivable, and answering the phone," and *"the person responsible has five other jobs that feel
more urgent on any given Friday afternoon."* [V21]

Public reviews of the incumbents are written by this role, in this vocabulary:

> *"Overall it is clunky and not intuitive."* — HRM, Construction, 2/5, on Points North Certified
> Payroll Reporting [U14]
> *"I often get errors uploading a file into their system."* — same reviewer [U14]
> *"It is not bringing all wages over when uploading"* — Office Manager, Construction, 4/5 [U14]

She is buying **Friday back**. She is also the person who will *not* champion a tool that makes
her look like she chose badly, which is why the product must be right on the first report, in
front of her boss.

### 1.3 P3 — The estimator (the upstream cause of every downstream problem)

Prices the bid. The wage determination is a **cost input** before it is ever a compliance
artefact: the wage determination lists a basic hourly rate (BHR) and a fringe benefit rate (FBR),
and the bid has to carry both [V23]. He is the first person in the company to touch the WD number,
which the contracting agency embeds in the solicitation before the bid [V23].

He is buying **a defensible number to bid with, and the knowledge that the number won't move**.
Wage determinations are modified mid-project, and DOL's own rule makes the correct determination
apply **"by operation of law, whether or not they are included or incorporated by reference into
such contract"** [R5 §5.5(e)] — i.e. the rate binds you even if nobody ever sent it to you.

**Product consequence:** the lookup has to be useful *before* there is a project, a roster or a
payroll. Estimators are the cheapest possible top of funnel and the reason the free tier is a
lookup, not a trial of the whole app (see `OFFER.md`).

### 1.4 P4 — The payroll clerk / outside bookkeeper (the operator)

May be in-house, may be the CPA's office, may be a fractional bookkeeper. Lives in QuickBooks or
Foundation or Sage and thinks in payroll runs, not projects. Their pain is structural, not
cosmetic — they hit it the first week:

> *"I need help setting up prevailing wages and creating certified payroll reports when we pay
> monthly"* … *"So a company has to change their pay cycle because of government project?"* [U17]
>
> *"The employees working on that job also work on other jobs that are not prevailing wage, so
> they will be making two different wages in one pay period (their regular wage and the prevailing
> wage)."* … *"if there's overtime, it's figured on the base salary and not the fringes that are
> added in. So how do I set that up?"* … *"I'm confused by the 'Fringe Benefits Health & Welfare'.
> Do I set this up as an hourly rate as well?"* … *"I end up just lumping prevailing wage and
> fringe together as one rate"* [U18]

That last sentence is a compliance failure being reported cheerfully in public by the person doing
it. **This is the product's core moment: the buyer does not know they are wrong.**

They are buying **a system that will not let them lump the fringe in**.

### 1.5 P5 — The GC compliance manager (secondary segment, $299 tier)

Works for the prime. Collects and audits every sub's certified payroll before the pay
application goes out. Public job descriptions for this role describe "collecting and reviewing
Certified Payroll Reports (CPR) and supporting labor compliance forms submitted by
subcontractors" and issuing "requests for missing and revised documentation" [S-JD].

The regulation is what creates this job, and it is quotable verbatim:

> *"The prime contractor is responsible for the submission of all certified payrolls by all
> subcontractors."* — 29 CFR 5.5(a)(3)(ii)(A) [R5]
>
> *"The prime contractor is responsible for the compliance by any subcontractor or lower tier
> subcontractor with all the contract clauses in this section. In the event of any violations of
> these clauses, the prime contractor and any subcontractor(s) responsible will be liable for any
> unpaid wages and monetary relief, including interest from the date of the underpayment or loss,
> due to any workers of lower-tier subcontractors, and may be subject to debarment, as
> appropriate."* — 29 CFR 5.5(a)(6) [R5]

**Copy rule inherited from this:** a vendor blog calls this "strict liability" [V32]. That phrase
is **the vendor's characterisation, not the regulation's words**, and it is banned from our copy.
We quote 5.5(a)(6). We are selling accuracy; we cannot round the law up for drama.

She is buying **a way to stop chasing PDFs by email**. She is also the most dangerous customer to
mis-serve, because she is the one who will notice if a rate is wrong.

### 1.6 Who is *not* the buyer

| Not our buyer | Why |
|---|---|
| The union signatory shop with a full-time payroll department | They already run Foundation or Vista, and their fringes go to funds on a schedule the software already knows. |
| The 200+ employee GC | Owner-mandated to use LCPtracker or Elation by the awarding agency; the tool is chosen above them. |
| The awarding agency / public owner | That is the incumbents' actual customer. We would be competing on procurement, which is a two-year sale. |
| The residential remodeller | Never touches a wage determination. |
| The worker | We hold their pay data; we do not sell to them. |

---

## 2. Company profile

### 2.1 Size

- **90.2% of Specialty Trade Contractor (NAICS 238) establishments have fewer than 20
  employees** (2023) [R25]. Across all construction, **91.0% of payroll establishments had fewer
  than 20 employees from 2014 to 2023**, and **81.7% employed 1 to 9** [R25].
- The underlying firm-size distribution is published by the Census Bureau in SUSB's employment-size-by-NAICS tables [S38]; CPWR's bulletin is the version that reports it for construction directly.
- Our band — 5 to 50 field employees — therefore sits inside the modal firm, not a niche. It is
  also exactly the band the incumbents price *above*: Points North's own tiering starts a new
  price at 26 employees and again at 50 [V10].

### 2.2 Federal exposure, from our own target list

The phase-3 prospect file is not a guess; it is 10,295 end-customer organisations pulled from
USAspending, SAM.gov and four state prevailing-wage registers [S37]. What it tells us about the
buyer:

| observed pattern | what it means for the product |
|---|---|
| Firms with **dozens of small federal awards per year** (e.g. 46 awards / $12.2M; 52 awards / $15.4M) | Many *concurrent* wage determinations per year on one crew. The pain is per-project setup, not per-report volume. |
| Firms filing **hundreds of statements of intent per year** in Washington | The unit of work is the *job*, and jobs arrive weekly. Onboarding a project must cost minutes, not an implementation. |
| Firms filing **~2,790 weekly certified payrolls since 2024** on NY public work | A minority live in this weekly ritual permanently. They are the retention core. |
| Firms recorded as **subcontractors on federal primes** | They enter the compliance chain through somebody else's contract — often without ever seeing the wage determination (see §7.2). |
| Firms exposed to **two regimes at once** (Davis-Bacon + WA intents/affidavits; + NY Article 8; + CA DIR/eCPR) | Multi-jurisdiction is not an upsell, it is table stakes for a large slice of the list. |

### 2.3 Geography

Concentrated where federal construction is: the DC/VA corridor, Washington State, New York,
Illinois, Texas, and base towns (Warner Robins GA, Leesville LA, Anchorage AK) [S37]. California
is the largest prevailing-wage market in the country and is **absent from our list** because the
CA DIR registration portal could not be read [S37] — but California contractors must still submit
"certified payroll records (CPRs) to the Labor Commissioner using DIR's Public Works Website
Services" [R30], so they are in the market even though they are not in the file.

### 2.4 Money

- Federal award values in the sharpest-fit slice run **$1–20M over ~2.5 years** [S37] — a firm
  doing perhaps $3–8M a year.
- At that size, **$99/month is a rounding error and $4,995 of setup is a board decision.** This
  single asymmetry is the whole commercial thesis, and it is the reason the price must be on the
  page (see §5.4).

---

## 3. The week: the ritual we are buying our way into

Sourced hour by hour. This is the sequence the product has to fit inside without asking anyone to
change anything else.

| when | what happens | source |
|---|---|---|
| **Before the bid** | Estimator pulls the wage determination for the state/county/construction type from SAM.gov. The WD number is embedded in the solicitation. He prices BHR + FBR into the labour rate. | [R29][V23] |
| **Award → pre-construction** | Prime pushes the DBA clauses and the wage determination down the chain — and is *required* to: "The contractor or subcontractor must insert in any subcontracts the clauses contained in paragraphs (a)(1) through (11)…" Often, in practice, this does not reach the sub cleanly. | [R5 §5.5(a)(6)] |
| **Mon–Thu** | Field time is captured. Cost codes, job numbers, and — the failure point — *which job*. A contractor, quoted publicly: *"They just pick their own job. If it's a certified job, we have to go back and do all the legwork."* | [V23] |
| **Thu/Fri: payroll run** | The clerk runs payroll in QuickBooks / Foundation / Sage. Prevailing wage and non-prevailing hours for the same person in the same period must be separated. | [U18][V34] |
| **Friday afternoon: the WH-347** | Nine columns per worker per week, plus the Statement of Compliance. DOL's own burden estimate: **"an average of 55 minutes to complete this collection of information."** | [R8] |
| **Friday/Monday: submission** | Weekly, "for each week in which any DBA- or Related Acts-covered work is performed," to the agency — or, if the agency is not a party, to the applicant/sponsor/owner, for transmission. Prime is responsible for all subs' submissions. | [R5 §5.5(a)(3)(ii)(A)] |
| **Then: the rejection** | The prime's compliance manager or the agency's portal bounces it. Public review vocabulary for this loop: *"you're gonna be stuck in revision hell."* | [V13] |
| **Forever** | Retain everything for **3 years after all work on the prime contract is completed**. | [R5 §5.5(a)(3)(ii)(G)] |

**The three product truths that fall out of the table**

1. **Weekly is not a setting.** It is the law, for every week covered work happens [R5]. A monthly
   payroll company is out of compliance before it starts — and does not know it [U17].
2. **The report is downstream of a decision made on Monday.** Fix classification at time entry,
   not at report time, or you are just a prettier form.
3. **The deliverable is a rejection-free submission, not a PDF.** "Generated a WH-347" is not the
   job done. "The prime accepted it" is.

---

## 4. The stack they already have, and the incumbents

### 4.1 What is already installed

| layer | what is actually there | note |
|---|---|---|
| Accounting / payroll | **QuickBooks** (Desktop and Online) for the small end — its own Davis-Bacon guide tells contractors that "the contractor or administrator responsible for the completion of the project is ultimately responsible for Davis-Bacon Act compliance and all the paperwork that comes with it" [V20]; **Foundation**, **Sage 100 Contractor**, **Sage Intacct Construction**, **Viewpoint** as firms grow; **ADP RUN** where payroll is outsourced | QuickBooks is where the certified-payroll questions get asked in public [U17][U18][V19]; Foundation markets itself as "America's #1 construction accounting software" and sells prevailing wage/certified payroll as a *feature of payroll* [V34] |
| Certified payroll | Often **nothing** — a spreadsheet — or a portal the GC/agency mandated | The incumbents' own marketing concedes small shops are outside their design centre [V11][V13] |
| Time | Paper tickets, texts and photos, a time-tracking app, or the PM tool | See §10 |
| Project management | Procore or Buildertrend if the GC uses it; otherwise email | Procore's presence sets the aesthetic expectation (see IDENTITY.md §13) |
| Mandated portals | **LCPtracker**, **Elation Systems**, **eMars**, **B2Gnow**, state systems (CA eCPR, WA PWIA) | The sub does not choose these; the agency or prime does |

**The integration that matters is not an API.** It is a **payroll export** — a CSV or a report the
clerk already knows how to produce. The public complaint about the incumbents is precisely at this
seam: *"I had to get on the phone with my payroll provider and explain exactly what LCPtracker
wanted. It took multiple tries."* [V13]

### 4.2 The incumbents, priced at the source

Every figure below was read on the vendor's own page or its marketplace listing on 2026-09-03.

| product | published price | what it is priced for |
|---|---|---|
| **LCPtracker Pro** | no public price; demo/quote | Agencies and primes overseeing many contractors [V13] |
| **LCPcertified** (their contractor product) | **$12 per report**; **5 active projects $145/mo**; 10 projects $1,300/yr; 25 $2,500/yr; 50 $3,700/yr; unlimited $7,400/yr. Professional plan: 10 projects $1,900/yr → 450 projects $18,200/yr | The only incumbent with a real published contractor price [V9] |
| **Points North Certified Payroll Reporting** (ADP Marketplace listing) | **$175.00/month + $7.50/report/month**, setup **$995 (1–25 employees) / $1,495 (26–49) / $4,995 (50+)** | Priced *by employee count*, so it gets more expensive exactly as our buyer grows [V10] |
| same product, Capterra listing | **"$125 per user, per month"**, Basic | The **same product carries two different public prices**. Pricing opacity is not an accusation here; it is observable. [U14] |
| **eBacon** | quote-gated; Software Advice shows "Starting Price: $1,000 per feature" | [V13][U16] |
| **Elation Systems** | quote-gated; a competitor's comparison alleges "$2,000+" setup, "$300+" monthly | Vendor claim, not verified at Elation [V12] |
| **eMars Compliant Client** | quote-gated | [V13] |
| **CertifiedPayrollPro** | **$49/mo + $5/report; $99/mo + $3/report; $249/mo + $1/report**, 14-day trial, 3 free reports, no setup fee, month-to-month | The transparent low-end incumbent, and our real price competitor [V11] |

**The pattern, stated as a competitive fact:** the category's default is *quote-gated, annual, and
front-loaded with setup*. One vendor's own comparison summarises the terms as month-to-month for
itself and "Annual" for Points North, LCPtracker, eBacon and Elation [V12] — that is a competitor's
claim, but it is consistent with everything we could verify independently.

### 4.3 What the incumbents' users actually say

Public reviews, quoted verbatim. Role and company size only; no names.

**Points North Certified Payroll Reporting** — Capterra, 3.0/5 from 2 reviews [U14]

| | |
|---|---|
| ✚ | *"The implementation specialist was great- very helpful."* (HRM, Construction) |
| ✚ | *"Works well with LCP Tracker."* (HRM, Construction) |
| ✚ | *"The most liked feature is that our employee information is uploaded."* (Office Manager, Construction) |
| ✖ | *"Overall it is clunky and not intuitive."* (HRM, Construction) |
| ✖ | *"I often get errors uploading a file into their system."* (HRM, Construction) |
| ✖ | *"It is not bringing all wages over when uploading"* (Office Manager, Construction) |

**eBacon** — Capterra 4.5/5 from 21 reviews; Software Advice 4.5/5 from 21, Value for Money 4.2/5
[U15][U16]

| | |
|---|---|
| ✚ | *"The certified payroll functionality is great! It has taken a long arduous project that could take hours and reduced it to 20 minutes."* (Construction, 11–50 employees) |
| ✚ | *"The amount of time we save processing certified payroll is incredible"* (VP People, Facilities Services, 51–200) |
| ✚ | *"The ebacon team have taken so much of the anxiety away from prevailing wage projects"* (COO, Construction) |
| ✚ | *"Easy to use when you figure it out"* (HR Specialist, Construction) |
| ✖ | *"The system feels very dated. I have to manually enter a lot of parts from a paystub"* (HR Specialist, Construction) |
| ✖ | *"Many of my employees don't have access to a computer other than their phone"* (Project Manager, Construction) |
| ✖ | *"There is no customization, they do not administer benefits in California"* (VP People, Facilities Services, 51–200) |

**LCPtracker / general** [V13]

> *"I had to get on the phone with my payroll provider and explain exactly what LCPtracker wanted.
> It took multiple tries."*
> *"check your payroll subscription…Otherwise you're gonna be stuck in revision hell."*
> *"Pricing in this category is deliberately opaque"* — the reviewer's own summary.

**Elation Systems** — a compliance consultancy that sells help using it [V33]

> *"Elation Systems has a lot of features, and learning how to use them effectively can be
> overwhelming"*

**Read the reviews together and a design brief falls out:**

1. The word that recurs about the *good* incumbent is **anxiety**, and it is about the projects,
   not the software. We are selling anxiety relief, not efficiency.
2. The word that recurs about the *bad* incumbent is **clunky**, and its concrete referents are
   **upload errors** and **data not carrying across**. Every one of those is an import problem.
3. *"Easy to use when you figure it out"* is the whole category's epitaph. **Our onboarding budget
   is 10 minutes** (`UX.md` §4), and that number comes from here.
4. *"Many of my employees don't have access to a computer other than their phone"* is a mobile
   requirement stated by a customer, not by us.

**Blocked sources, logged:** G2, GetApp, TrustRadius and Software Advice's LCPtracker profile all
returned HTTP 403 or 404 from this environment on two attempts each. Capterra product pages and
the Software Advice eBacon profile did resolve, and are used above. There is **no public review
corpus for eMars or Elation** that we could open; their weaknesses are therefore reported as
competitor claims [V12] or consultancy claims [V33] and are labelled as such.

---

## 5. How they discover and buy

### 5.1 Discovery

| route | evidence |
|---|---|
| **The job forces it.** A new federal or state award, or a prime demanding CPRs, creates the need in a week. | Weekly filing begins with the first covered week [R5]; our target list is built entirely from *current award records* [S37] |
| **Search, on the words in §6.** "certified payroll," "WH-347," "prevailing wage [county]," "Davis-Bacon software" | The vocabulary in §6 is drawn from the pages that already rank on those terms |
| **Peers and reviews.** 77% of buyers examined user reviews during purchasing; 54% speak with users before purchasing (vendors estimate only 38%) | [S27] |
| **APEX Accelerators, associations, CPAs.** 266 APEX Accelerators, 36 national associations and 31 construction CPAs are already in our partner list | [S37] |
| **The prime.** The compliance manager tells the sub what to use | The GC tier is a channel into the sub tier, not just a bigger price |

### 5.2 The decision

- **Shortlists are tiny and pre-decided.** Average shortlist: **2.6 products**; **82% had the top
  product in mind when creating the shortlist and 70% purchased that product**; **79% knew about
  the final purchase before starting research** [S27].
  → *Being on the shortlist is nearly the whole battle. Being findable at the moment of panic beats
  being better.*
- **Regret is the norm, not the exception.** Roughly **60%** of SMBs made a regretful software
  purchase in the past 18 months, and **SMBs are more likely than enterprises to blame poor
  implementation** [S26]. → The objection we will meet is *"the last one didn't work either."*
- **Who decides:** owner signs; office manager vetoes. There is no procurement, no security
  questionnaire, no legal review at this size.

### 5.3 Trial expectations

- **Free trials rank in the top five resources for SMB purchases** [S27]. In this category the
  transparent incumbent already offers **14 days and 3 free reports with no setup fee** [V11].
- Therefore the trial floor is: **self-serve, no card to look, no call, and a real WH-347 out the
  other end.** Anything less is worse than the cheapest competitor.
- The buying deadline is not ours: it is **Friday**. A trial that cannot produce a filable report
  inside one payroll week does not convert.

### 5.4 Price anchors, and what they mean for us

The buyer's head holds four numbers, all public:

| anchor | number | source |
|---|---|---|
| "the cheap one" | $49/mo + $5/report | [V11] |
| "the one on my ADP marketplace" | $175/mo + $7.50/report + $995–4,995 setup | [V10] |
| "the one the GC uses" | $145/mo for 5 projects, or $12/report | [V9] |
| "call for a quote" | unknown, therefore assumed large | [V9][V13] |

- **Published pricing is the single most requested change buyers want from vendors: 49% named
  lack of transparent pricing as the top change needed, and deals close 33% faster when sellers
  lead with transparent pricing** [S27].
- **Conclusion, binding on `OFFER.md` and `LANDING_SPEC.md`:** the price goes on the page, with
  no "contact us" tier below $299. The proposed $79–99 sub tier sits *above* the $49 form-filler
  and *far below* the $175+setup incumbent — and the reason we can charge more than $49 must be
  visible before payment (the determination lookup and the citation), or we are a $99 version of a
  $49 thing.

### 5.5 Card vs invoice

| segment | mechanism | reasoning |
|---|---|---|
| P1–P4, the sub tier | **Card, self-serve, monthly, cancel anytime** | Under the owner's own approval threshold; matches the incumbent that already does this [V11]; matches PLAN.md D2 (Stripe Checkout + Portal) |
| P5, the GC tier at $299 | Card by default; **an invoice/receipt that survives an expense report** is the real requirement | At $299 it is still a card, but it has to be *documentable*: PO number field on the invoice, W-9 on the help page |
| Any request for annual invoicing, net-30, or a signed MSA | **Out of scope for launch.** Answer honestly: monthly card only. | PLAN.md has no AR process, and inventing one for a $299 deal loses money |

**Assumption A3 (§12):** annual prepay at a discount will be asked for by a minority of GC-tier
buyers. Not built at launch; revisit at n ≥ 100.

---

## 6. Vocabulary — the words, and where each one was found

Use column 1. Never use column 3. Sources are the page the phrase was read on.

| say this | why | never say this | source |
|---|---|---|---|
| **certified payroll** | The universal name for the artefact, used by DOL, every vendor and every user | "compliance documentation" | [R1][R8][V19] |
| **the WH-347** | The form's own name; contractors say the number | "the report" | [R1][R8] |
| **wage determination** (and **WD number**) | DOL's term; it is a document with a number and a modification | "wage table," "rate card" | [R29][R5][V23] |
| **classification** / **work classification** | Column 3's own heading: "List classification descriptive of work actually performed" | "job title," "role" | [R8] |
| **county and craft** | How the buyer describes the lookup | "geo and skill" | [V23] |
| **basic hourly rate** / **fringe** (BHR / FBR) | The two halves of the rate; the form prints them as `$12.25/.40` | "total comp" | [R8][V23] |
| **cash in lieu of fringe benefits** | DOL's exact phrase; determines whether 4(a) or 4(b) is checked | "fringe cash-out" | [R8] |
| **Statement of Compliance** | The certification on page 2 | "sign-off," "attestation" | [R5][R8] |
| **prevailing wage** | The umbrella term; the state regimes use it more than "Davis-Bacon". DOL's own phrasing: contractors "must pay their laborers and mechanics employed under the contract no less than the locally prevailing wages and fringe benefits for corresponding work on similar projects in the area" | "minimum wage" | [R3][R4][R30] |
| **Davis-Bacon** / **DBRA** | Federal only | using it for a state job | [R3] |
| **conformance** / **SF-1444** | For a classification not on the determination | "custom rate," "exception" | [R2][R5] |
| **apprentice** / **journey level** / **ratio** | The three words that decide whether a reduced rate is legal | "junior," "trainee" | [R3][R40] |
| **payroll number** and **week ending** | The two fields that make a submission identifiable | "report ID," "period" | [R8] |
| **filed** / **accepted** / **rejected** / **needs revision** | The states the submission is actually in | "processed," "complete" | [U14][V13] |
| **the prime** | Who they submit to and who is liable | "the client," "the GC" (only if it *is* a GC) | [R5] |
| **debarment** | The consequence they fear by name — 3 years | "penalties" | [R5][R6] |

### 6.1 Phrases the buyer uses that we should echo back, verbatim

Each of these came out of a public review, forum thread, or trade page. They are the emotional
register the copy has to hit.

| phrase | where it was said |
|---|---|
| *"You can't burn 2-3 hours every Friday on spreadsheets."* | vendor page describing its buyer [V11] |
| *"the person responsible has five other jobs that feel more urgent on any given Friday afternoon"* | trade blog [V21] |
| *"Overall it is clunky and not intuitive."* | Capterra review, HRM, Construction [U14] |
| *"you're gonna be stuck in revision hell"* | independent comparison [V13] |
| *"Easy to use when you figure it out"* | Capterra review, HR Specialist, Construction [U15] |
| *"taken so much of the anxiety away from prevailing wage projects"* | Capterra review, COO, Construction [U15] |
| *"They just pick their own job. If it's a certified job, we have to go back and do all the legwork"* | contractor quoted in a trade guide [V23] |
| *"I end up just lumping prevailing wage and fringe together as one rate"* | QuickBooks community thread [U18] |
| *"So a company has to change their pay cycle because of government project?"* | QuickBooks community thread [U17] |
| *"Many of my employees don't have access to a computer other than their phone"* | Capterra review, Project Manager, Construction [U15] |

### 6.2 Words that are ours, and words that are banned

**Ours (coin and keep):** *the county-and-craft lookup*; *rate provenance*; *the Friday file*;
*determination-backed*; *submission-ready*.

**Banned, with the reason:**

| banned | reason |
|---|---|
| "strict liability" | Vendor characterisation, not the regulation's words [V32] vs [R5 §5.5(a)(6)] |
| "$13,508 per violation" | Not in DOL's civil money penalty table [R7]; see §7.3 |
| "guaranteed compliant," "audit-proof," "100% accurate" | We can guarantee the *rate we show and its source*; we cannot guarantee the customer's own hours and classifications |
| "AI-powered compliance" | The buyer's trust problem is provenance, not intelligence; and 94% of B2B buyers fact-check AI research before trusting it [S27a] |
| "revolutionise," "seamless," "effortless" | Not this buyer's register; see IDENTITY.md §4 |
| "easy" as a promise | The category's epitaph is *"easy to use when you figure it out"* [U15]. Show the 10-minute setup instead. |

---

## 7. Jobs to be done, and the four moments of pain

### 7.1 JTBD, in the buyer's own framing

| # | Job | Success looks like |
|---|---|---|
| J1 | *"Tell me what I have to pay this guy on this job."* | A rate, with the county, the craft, the WD number, the modification and the date it was read. |
| J2 | *"Turn my week into a WH-347 the prime will accept."* | A submission that comes back **accepted**, first time. |
| J3 | *"Don't let me file something wrong."* | The system blocks the four failures in §7.4 before the signature, not after. |
| J4 | *"Prove it, three years from now."* | A retained, unalterable copy of every report, every rate and every source — the retention period is 3 years after the prime contract completes [R5]. |
| J5 | *"Stop me being surprised."* | Notice when the determination that priced the job is modified. |
| J6 (P5) | *"Get the subs' payrolls in without emailing PDFs."* | A roll-up with a per-sub status the compliance manager can chase from. |

### 7.2 The four moments

**M1 — The Friday WH-347.** The recurring one; the one that pays the subscription. Nine columns
per worker per week, a signed Statement of Compliance, DOL's own burden estimate 55 minutes per
form [R8], and the person doing it has five other jobs that feel more urgent [V21]. *Product
answer:* the week's grid is already filled from the last payroll; Friday is a review and a
signature.

**M2 — The DOL audit letter (and the withholding that comes first).** The agency "may, upon its
own action, or must, upon written request of an authorized representative of the Department of
Labor, withhold or cause to be withheld from the contractor so much of the accrued payments or
advances as may be considered necessary" [R5 §5.5(a)(2)]. *Cash stops before any penalty is
assessed* — for the sub, the audit is a liquidity event first and a legal event second. *Product
answer:* one export containing every report, every rate and every source URL with the date it
was read.

**M3 — The SF-1444 conformance.** A classification the work needs is not on the determination.
Three criteria must all be met — the work "is not performed by a classification in the wage
determination"; the classification "is used in the area by the construction industry"; the
proposed rate "bears a reasonable relationship to the wage rates contained in the wage
determination" — the request goes through the **contracting officer**, by email to
`DBAconformance@dol.gov`, and WHD "will approve, modify, or disapprove every additional
classification action within 30 days of receipt" or say it needs longer [R5 §5.5(a)(1)(iii); R2].
And the trap, verbatim: *"The conformance process may not be used to split, subdivide, or
otherwise avoid application of classifications listed in the wage determination."* [R5]
*Product answer:* first tell them whether they actually need one (usually they do not); then
prepare the package for the contracting officer; then track the 30 days. **We never file it for
them — the contracting officer does.** Getting that wrong would be selling a service we are not a
party to.

**M3a — The new recordkeeping the 2023 rule created.** Counsel writing in the trade press
summarised seven ways the rule costs contractors, including that when a worker performs work in
more than one job classification — DBRA-covered and not — contractors "are now required to monitor
and maintain records accurately classifying each hour worked," that flaggers, truck drivers and
material suppliers can now be swept in when their work relates directly to covered work and is not
de minimis, that fringe contributions must be annualised and non-DBRA hours cannot be credited, and
that debarment is a "three year debarment period with no early removal option" [V24]. Each of those
is a data-model requirement for us, not just a talking point.

**M4 — The classification you did not know was wrong.** The most common failure, and it is silent.
Real cases: workers "improperly classified" as general labourers while performing "carpentry and
pipefitting duties" — $85,284 in back wages; apprentices "improperly classified as laborers while
performing specialized pipefitting work" — $44,816 for 12 employees; falsified records — $77,206
plus a three-year debarment [V22]. DOL's own rule is duties-based: forepersons "who devote more
than 20 percent of their time during a workweek to mechanic or laborer duties … are laborers and
mechanics for the time so spent" [R3]. *Product answer:* classification is a decision the product
asks about at roster time and re-asks when duties change, with the determination's own text beside
it.

**M0 — the one before all of them: the sub who never got the wage determination.** A common entry
into this market is discovering the obligation after the work started. The regulation removes the
excuse: the clauses and correct determinations "will be considered to be a part of every prime
contract … and will be effective by operation of law, whether or not they are included or
incorporated by reference into such contract" [R5 §5.5(e)]. *Product answer, and probably our best
single piece of landing copy:* **"It applies even if nobody sent it to you."**

### 7.3 What is actually at stake — the corrected numbers

| consequence | authority |
|---|---|
| **Withholding** of accrued contract payments | 29 CFR 5.5(a)(2) [R5] |
| **Back wages plus interest** from the date of the underpayment | 29 CFR 5.5(a)(1)(vi), (a)(6) [R5] |
| **CWHSSA liquidated damages of $33 per worker per calendar day** of uncompensated overtime | 29 CFR 5.5(b)(2) [R5]; DOL CMP table, 40 U.S.C. 3702(c), amounts effective 2026-01-15/16 [R7] |
| **Debarment: ineligible for 3 years** for any federal or federally assisted contract, extending to responsible officers and to firms in which they have an interest; names published on SAM | 29 CFR 5.12(a)(1) [R6] |
| **Contract termination** for breach of the 5.5 clauses | 29 CFR 5.5(a)(7) [R5] |
| **Criminal / False Claims exposure** for a false certification — 18 U.S.C. 1001 and 31 U.S.C. 3729; DOL's own instructions spell out "a fine, possible imprisonment of not more than 5 years, or both" | 29 CFR 5.5(a)(3)(ii)(F) [R5]; WH-347 instructions [R8] |
| **Prime liable for the sub's violations** | 29 CFR 5.5(a)(6) [R5] |
| ~~$13,508 civil money penalty per violation~~ | **Not supportable.** DOL's civil money penalty table has no Davis-Bacon entry; the only CWHSSA figure is $33 [R7]. The vendor page that is usually cited says only "civil monetary penalties up to $10,000+ per violation" with no authority [V31]. **Do not use.** |

Scale, for context: DOL reports **$259 million in back wages for nearly 177,000 employees in FY
2025** — a vendor's summary of DOL enforcement data, cited as a vendor claim [V31].

### 7.4 The four errors the product must make structurally impossible

Derived from §4.3, §6.1 and [V22][V33][V23]:

1. **Fringe lumped into the base rate.** (*"I end up just lumping prevailing wage and fringe
   together as one rate"* [U18].) The rate field is two fields, always, and the form prints them
   the way DOL prints them: `$12.25/.40` [R8].
2. **One classification for a split day.** A worker in two classifications needs separate entries
   with an accurate breakdown of hours in each [R8]; the grid must make the second row easier than
   the wrong single row.
3. **Overtime premium applied to the fringe.** The premium is on the basic rate; cash in lieu of
   fringe is not time-and-a-half [R8][V23].
4. **Hours on the wrong job.** (*"They just pick their own job"* [V23].) Project assignment is
   confirmed at entry, and covered projects are visually distinct from non-covered ones.

---

## 8. Objections, and the honest answer

| # | Objection, in their words | Answer (and what it demands of the product) |
|---|---|---|
| O1 | *"My GC makes me use LCPtracker anyway."* | True, and we do not replace it. We prepare the data and export it in the format that portal accepts; LCPcertified itself advertises CA DIR / WA L&I / MD DLLR XML export as the valuable part [V9]. **Demands:** export formats are an MVP feature, not a roadmap item. |
| O2 | *"How do I know your rate is right?"* | Every rate shows its WD number, modification, county, construction type and the date we read it, with a link to the source. **Demands:** provenance is a first-class UI object (IDENTITY.md §11.7). |
| O3 | *"My bookkeeper already does this in Excel."* | Then keep the spreadsheet: import it. The complaint about incumbents is upload failure [U14], so import quality *is* the product. |
| O4 | *"The last one didn't work either."* | Acknowledged — 60% of SMBs regret a software purchase in 18 months [S26]. Month-to-month, no setup fee, cancel in the portal, export your data. |
| O5 | *"$99 a month for one form?"* | Compare against the $995–4,995 setup and $175/mo + $7.50/report on the marketplace they already use [V10]. Do not compare against $0. |
| O6 | *"I only do one public job a year."* | Then the annual cost is the honest question. Answer it with a per-project or pausing tier; do not pretend the subscription is always right. **Demands:** `OFFER.md` needs a low-frequency answer. |
| O7 | *"Is my employee data safe?"* | It contains wages and partial SSNs. The regulation itself says full SSNs and addresses **must not** be on weekly transmittals — "the certified payrolls need only include an individually identifying number for each worker (e.g., the last four digits of the worker's Social Security number)" [R5]. **Demands:** we store the last four only. Being *unable* to leak the full number is the answer. |
| O8 | *"Can you just do it for me?"* | No. We are software; the managed-service answer belongs to Points North [V10] and we should say so plainly rather than half-doing it. |

---

## 9. Trust signals this buyer needs, in priority order

Ordered by what the evidence says moves an SMB buyer, not by what is easy.

1. **The price, on the page, with no gate.** 49% of buyers name lack of transparent pricing as
   the top change vendors should make; deals close 33% faster with transparent pricing [S27].
   This is also the category's most conspicuous absence [V9][V13].
2. **The rate's source, visible before payment.** Provenance is the differentiator; it must be
   demonstrable in the free lookup or the differentiation is invisible at the moment of decision.
3. **A real WH-347 you can look at.** Not a screenshot of a dashboard — the form they know.
4. **Third-party voice.** 77% examine user reviews; 54% speak to users before purchasing [S27].
   At n=0 customers we have none, so we substitute what we *can* show: the regulation, the
   sources, and a public changelog of determination updates. **Never a fabricated testimonial.**
5. **Cancel-and-export, said plainly.** Directly answers O4 and the 60% regret rate [S26].
6. **A named human at the end of an email**, with the response time we will actually hit
   (PLAN.md A6: first-level auto-responder + escalation).
7. **Data handling stated in one paragraph**: last four digits only, US hosting, retention that
   matches the 3-year rule [R5].
8. **A dated disclaimer on every rate and document.** PLAN.md A10 requires it; it is also a trust
   signal, because it is what an honest source looks like.

**What we must *not* fake:** SOC 2, "trusted by N contractors," success rates, or logos. The
product is sold on accuracy; one invented proof point contaminates the only asset we have.

---

## 10. Mobile vs desktop, honestly

**The split is by task, not by person.**

| task | device | evidence |
|---|---|---|
| Weekly hours entry, review, the WH-347, submission | **Desktop, keyboard, often two windows** (payroll on one side) | The job is grid work against a form with 9 columns [R8]; incumbents' complaints are about *upload* and *transcription* [U14], both desktop tasks |
| Field time and daily job confirmation | **Phone** | *"Many of my employees don't have access to a computer other than their phone"* [U15]; ~48% of contractors use mobile apps for on-site work [S28] |
| The rate lookup | **Phone, in a truck, mid-argument** | It is the one thing an estimator or foreman needs *now*; it is also our free tier |
| Approving and signing | **Phone is acceptable, desktop is normal** | The owner is not at a desk; the signature is one action |

**Rules this sets (binding on `UX.md`):**

- The **payroll grid is a desktop-first, keyboard-first interface** and we will say so. Making a
  9-column weekly grid "mobile-first" would make it worse for the person who actually does it.
- The **lookup and the approve/sign flows are mobile-first** and must work one-handed.
- Nothing is desktop-*only*: every screen is reachable and legible on a phone, even where entry
  is deliberately optimised for a keyboard. Read-only on mobile is a legitimate state; broken is
  not.
- **Barriers to adoption are cost, satisfaction with the status quo, "lack of time to implement
  and learn new products," and limited technical expertise** [S28]. Every one of those argues for
  the 10-minute onboarding budget rather than for more features.

---

## 11. Anti-requirements — what this buyer does not want us to build

Recorded so wave 2 does not rediscover them:

- **Not a payroll engine.** They have QuickBooks/Foundation/Sage/ADP and are not switching [V34].
- **Not project management.** Procore and Buildertrend exist and the GC picked one.
- **Not a benefits administrator.** eBacon's fringe trust accounts draw complaints [U15] and the
  liability is enormous.
- **Not a filing agent.** We do not submit on their behalf at launch: the agency relationship and
  the electronic-signature requirement (29 CFR 5.5(a)(3)(ii)(A), (E) [R5]) are theirs.
- **Not a conformance filer.** The contracting officer files SF-1444, not the contractor and not
  us [R2][R5].
- **No mandatory onboarding call.** It is the incumbents' model and this buyer's stated objection.

---

## 12. Assumptions, and what we do not know

Per PIPELINE.md stage 4: where a source could not be opened, the best defensible guess is written
down as an assumption rather than dressed as a fact.

| # | Assumption | Basis | How to kill it |
|---|---|---|---|
| A1 | The office manager (P2) is the champion and the owner (P1) is the signer. | Review authorship in [U14][U15] is dominated by office/HR/controller roles; the certification is legally the owner's [R8]. | First 10 signups: record who signed up and who signed the first report. |
| A2 | These firms will put $79–99/mo on a card without a call. | The transparent incumbent already sells at $49–249 self-serve [V11]; the amount is under any plausible approval threshold at $3–8M revenue [S37]. | Checkout completion rate vs. "contact us" clicks. |
| A3 | A minority of GC-tier buyers will ask for annual invoicing. | Incumbent terms in this tier are annual [V12]. | Count the requests; do not build until it is >20% of GC-tier. |
| A4 | Payroll **export/import**, not API integration, is the required interoperability at launch. | The complaints are file-shaped: *"errors uploading a file"*, *"not bringing all wages over"* [U14]; QuickBooks users describe CSV workflows [U18]. | Ask the first 10 what they exported and from what. |
| A5 | Trials are decided inside one payroll week. | The obligation is weekly [R5] and the competitor's trial is 14 days [V11]. | Time-to-first-WH-347 in the funnel. |
| A6 | Washington's weekly-CPR-to-L&I regime as described is correct. | **Secondary only.** lni.wa.gov's certified payroll page 404'd here and the prevailing-wage-rates page does not cover filing; the weekly/PWIA description comes from search summaries and an AGC of Washington page we could not open. | Re-verify at lni.wa.gov before any WA-specific claim ships. |
| A7 | ADP and Buildertrend brand colours quoted in IDENTITY.md are secondary. | adp.com, buildertrend.com and sage.com returned 403 to both curl and WebFetch on two attempts each. | Re-check from a browser before any comparative visual claim is published. |

**Open questions for the founder** (repeated in IDENTITY.md §15 and reported at hand-over):

1. **Do we sell the GC tier at launch, or only the sub tier?** The GC tier is a *channel* into the
   sub tier — a compliance manager who likes it invites her subs — but it is also a different
   product surface (roll-up, chasing, per-sub status) and a different support load.
2. **What is the answer to O6 (one public job a year)?** A pausing subscription, a per-project
   price, or "you are not our customer." This changes `OFFER.md` materially.
3. **Do we promise state e-filing formats (CA eCPR XML, WA, IL, NY) at launch, or federal WH-347
   only?** PLAN.md A11 says federal + WH-347; §8 O1 says export formats are how we survive
   objection 1. These are in tension and the founder should break the tie.
4. **How much of the conformance workflow do we build**, given we can never be the filer?

---

## 13. Source ledger

All fetched **2026-09-03** from this environment.

**[R] Regulation and government**

| key | source |
|---|---|
| R1 | DOL, *Form WH-347* — https://www.dol.gov/agencies/whd/forms/wh347 |
| R2 | DOL WHD, *Davis-Bacon Wage Determination Conformance Requests* — https://www.dol.gov/agencies/whd/government-contracts/construction/faq/conformance |
| R3 | DOL WHD, *Davis-Bacon and Related Acts FAQ* — https://www.dol.gov/agencies/whd/government-contracts/construction/faq |
| R4 | DOL WHD, *Davis-Bacon and Related Acts* — https://www.dol.gov/agencies/whd/government-contracts/construction |
| R5 | **29 CFR 5.5**, current text — https://www.ecfr.gov/api/renderer/v1/content/enhanced/2026-09-01/title-29?part=5&section=5.5 (the ordinary ecfr.gov page URL 302s to unblock.federalregister.gov; the API renderer path works) |
| R6 | **29 CFR 5.12**, Debarment proceedings — https://www.govinfo.gov/content/pkg/CFR-2024-title29-vol1/xml/CFR-2024-title29-vol1-sec5-12.xml |
| R7 | DOL WHD, *Civil Money Penalty Inflation Adjustments* — https://www.dol.gov/agencies/whd/resources/penalties (2026 amounts, effective 2026-01-15/16; unchanged from 2025 per OMB guidance) |
| R8 | DOL, *Instructions For Completing Payroll Form, WH-347*, **OMB 1235-0008** — the burden statement ("an average of 55 minutes"), the column definitions and the 18 U.S.C. 1001 line, read from a **third-party mirror** of the DOL page at https://www.modot.org/sites/default/files/documents/Instructions%20For%20Completing%20Payroll%20Form%20WH-347%20_%20U.S.%20Department%20of%20Labor.pdf (dol.gov's `/forms/wh347instr` 404s and dol.gov's HTML pages 403 to curl from here; the **PDF** at `dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf` returns 200 and is the authority for the form itself). **⚠ Correction, 2026-09-03 (wave-1b finding m1): the mirrored instructions carry an OMB expiry of 09/30/2026, which this ledger previously quoted. That stamp is stale.** The live form — fetched, hashed and re-verified by two agents (`KNOWLEDGE_BASE.md` KB-6, sha256 `fa28f033a825…`, and the wave-1b reviewer independently) — prints **`Expires: 01/31/2028`**. **KB-6's 2028-01-31 is the correct date and is the calendar item** (`KNOWLEDGE_BASE.md` §6, K7). Cite dol.gov's own WH-347 PDF for the burden statement and the falsification warning wherever the date matters; the mirror is a convenience for the instruction text, not an authority for the stamp. |
| R25 | CPWR, *Data Bulletin*, April 2026, *Small Establishments in Construction* (US Census County Business Patterns 2014–2023) — https://www.cpwr.com/wp-content/uploads/DataBulletin-April2026.pdf |
| R29 | SAM.gov, *Wage Determinations* — https://sam.gov/wage-determinations |
| R30 | California DIR, *Certified Payroll Reporting* — https://www.dir.ca.gov/Public-Works/Certified-Payroll-Reporting.html |
| R40 | DOL WHD FAQ Q13 (apprentices) — within R3 |
| S38 | US Census, 2022 SUSB annual data, employment size by NAICS — https://www.census.gov/data/tables/2022/econ/susb/2022-susb-annual.html |
| S-JD | Public labour-compliance job descriptions (state and municipal classifications) surfaced 2026-09-03; used only for the *duties* of P5, no individuals |

**[V] Vendor-published**

| key | source |
|---|---|
| V9 | LCPtracker, *LCPcertified* pricing — https://lcptracker.com/solutions/lcpcertified/ |
| V10 | ADP Marketplace, *Points North Certified Payroll Reporting for RUN Powered by ADP* — https://apps.adp.com/en-us/apps/253943/points-north-certified-payroll-reporting-for-run-powered-by-adp/configure |
| V11 | CertifiedPayrollPro, *Certified Payroll for Small Contractors* — https://www.certifiedpayrollpro.com/certified-payroll-for-small-contractors |
| V12 | CertifiedPayrollPro, *Alternatives* comparison — https://www.certifiedpayrollpro.com/alternatives (**a competitor's claims about competitors**) |
| V13 | davisbaconrates.com, *Certified Payroll Software: An Honest, Independent Davis-Bacon Review* — https://davisbaconrates.com/certified-payroll-software |
| V19 | Intuit, *What is certified payroll? How to report and file* — https://quickbooks.intuit.com/r/payroll/what-is-certified-payroll/ |
| V20 | Intuit, *Davis-Bacon Act tips* — https://quickbooks.intuit.com/time-tracking/davis-bacon-act-tips/ |
| V21 | imagetotable.ai, *The manual certified payroll compliance problem* — https://imagetotable.ai/blog/certified-payroll-compliance-manual-problem (**its "one hour per employee per report" misreads DOL's 55-minutes-per-form burden statement [R8]; use R8**) |
| V22 | eBacon, *3 real scenarios where a payroll error cost contractors thousands* — https://ebacon.com/institute-of-ebaconology/3-real-scenarios-where-a-payroll-error-cost-contractors-thousands |
| V23 | Workyard, *Prevailing Wage (Davis-Bacon) Explained: Contractor's Guide* — https://www.workyard.com/us-labor-laws/prevailing-wage |
| V31 | Points North, *The True Cost of Davis Bacon Violations* — https://www.points-north.com/trends-and-insights/the-real-cost-of-davis-bacon-violations (penalty figures **without cited authority**) |
| V32 | myconstructionpayroll.com, *Are you liable for your subcontractor's certified payroll mistakes?* — https://www.myconstructionpayroll.com/post/are-you-liable-for-your-subcontractor-s-certified-payroll-mistakes-new-davis-bacon-rules-say-yes (source of the banned phrase "strict liability") |
| V33 | Wilson Bird & Associates, *Get Elation Systems Right the First Time* — https://wb-wagehour.com/get-elation-systems-right-the-first-time-with-this-ultimate-guide/ |
| V34 | Foundation Software, *Construction Payroll Software* — https://www.foundationsoft.com/software/payroll/ |
| V24 | Construction Dive, *7 ways that Davis-Bacon changes could cost contractors* (Balch & Bingham) — https://www.constructiondive.com/news/davis-bacon-update-costs-considerations-legal/705511/ |

**[U] User-published** (roles and company sizes only; no names)

| key | source |
|---|---|
| U14 | Capterra, *Certified Payroll Reporting* (Points North), 3.0/5, 2 reviews — https://www.capterra.com/p/88851/Certified-Payroll/ |
| U15 | Capterra, *eBacon* reviews, 4.5/5, 21 reviews — https://www.capterra.com/p/180666/eBacon/reviews/ |
| U16 | Software Advice, *eBacon* profile, 4.5/5, 21 reviews — https://www.softwareadvice.com/hr/ebacon-profile/ |
| U17 | Intuit QuickBooks Community thread, prevailing wages with monthly pay cycle — https://quickbooks.intuit.com/learn-support/en-us/employees-and-payroll/i-need-help-setting-up-prevailing-wages-and-creating-certified/00/1508636 |
| U18 | Intuit QuickBooks Community thread, setting up prevailing wage payroll — https://quickbooks.intuit.com/learn-support/en-us/employees-and-payroll/how-do-i-set-up-and-enter-prevailing-wage-payroll-not-just-the/00/479557 |

**[S] Market research and internal**

| key | source |
|---|---|
| S26 | Capterra, *2025 Tech Trends: SMBs vs. Enterprises* — https://www.capterra.com/resources/tech-trends-smb-enterprise-software-purchase-tips/ (n=3,500, 9 countries, online, August 2024; SMB = 5–999 employees) |
| S27 | TrustRadius, *Bridging the Trust Gap: B2B Tech Buying in the Age of AI* — https://solutions.trustradius.com/vendor-blog/bridging-the-trust-gap-b2b-tech-buying-in-the-age-of-ai/ (n=2,058 buyers and 490 vendors, January 2025) |
| S27a | TrustRadius, *94% of B2B buyers fact-check AI research before trusting it* — https://www.marketscale.com/industries/software-and-technology/94-of-b2b-buyers-fact-check-ai-research-before-trusting-it-trustradius-finds |
| S28 | HIRI, *Contractor Technology Adoption Trends* — https://www.hiri.org/blog/contractor-tech-adoption-trends (**no sample size or date published; treat every number as indicative**) |
| S37 | `phase-3-acquisition/prospects/wagelens/README.md` — 10,749 organisations, 10,295 end-customers, collected 2026-09-03 from public government APIs and registers |

**Sources attempted and blocked (two attempts each, then abandoned per PIPELINE.md stage 4):**
G2 (403), GetApp (403), TrustRadius product pages (403), Software Advice LCPtracker profile (404),
Capterra LCPtracker product page (no such listing found), Gartner Digital Markets 2025 Software
Buying Trends (403 — the Capterra summary [S26] is used instead), adp.com (403), buildertrend.com
(403), sage.com (403), design.sage.com (refused by the egress proxy), lni.wa.gov certified-payroll
page (404), dol.gov `/faq/debarment` and `/faq/enforcement` (404), USPTO trademark APIs (404/301).
reddit.com and facebook.com are on the environment's blocked list and were not attempted.

---

## 14. The persona in one paragraph, for anyone writing copy

> She runs the office at a 22-person mechanical sub outside Norfolk. She does AP, AR, the phones
> and payroll. On Thursday she runs payroll in QuickBooks; on Friday afternoon she has to turn
> the same week into a WH-347 — nine columns per worker, a rate split into base and fringe, a
> signed statement that carries a five-year criminal exposure — and send it to a prime who will
> bounce it if a classification is wrong. She has never seen the wage determination for this job.
> Her owner signed the certification anyway. The tool the last GC made them use was, in her
> words, clunky and not intuitive, and it took three phone calls with the payroll company to get
> a file to upload. She is not looking for software. She is looking to have Friday back, and to
> stop being the person who finds out in year three that the rate was wrong.
