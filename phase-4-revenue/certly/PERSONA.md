# CERTLY — PERSONA (v1)

**Product (working name):** Certly — *an AI compliance clerk that reads every vendor's certificate of
insurance, checks it against your contract's requirements, and chases the renewal before it lapses.*
**Author:** Buyer & Identity agent, wave 1. **Date:** 2026-09-03.
**Status:** input to `IDENTITY.md`, `UX.md`, `BACKLOG.md`, `OFFER.md` and `LANDING_SPEC.md`. Binding on
copy and on scope until the wave-1b reviewer or the founder overrides it in writing.
**Evidence:** every claim marked with a bracketed id resolves in `identity/research/sources.md`, where the
URL, the class of source and the date it was fetched are recorded. Nothing here is remembered.

---

## 0. How to read this, and the rule I held myself to

Per `PIPELINE.md`, a claim that matters carries a URL that was actually opened. This document therefore
separates three grades of statement and never lets them blur:

| grade | marker | what it means |
|---|---|---|
| **Sourced** | `[A1]`, `[E2]`… | a page was fetched; the quote is verbatim; the id resolves in `identity/research/sources.md` |
| **Inferred** | *(inferred)* | a conclusion I drew from two or more sourced facts; the reasoning is written out so it can be attacked |
| **Assumption** | *(assumption A#)* | not sourced and not derivable; recorded in `identity/CLAUDE.md §Assumptions` with what would falsify it |

Fitzpatrick's hierarchy in *The Mom Test* — money spent beats behaviour observed beats stated intent —
applies with force here, because **we have no customers and cannot talk to anyone** (the brief forbids
asking a human). So the strongest evidence available is **what these buyers already pay for and what the
people selling to them are forced to publish.** That is where the weight of this file sits: incumbent
price pages, a carrier's audit instructions, a property manager's own vendor packet, review-site cons.

One methodological warning I want on the record: five of the six comparison articles in the category are
written *by* a competitor about its rivals. I have used them, and every time I do, the source table marks
them `rival`. Where only a rival asserts something, this document says "X claims" and not "X is".

---

## 1. The ranking, up front

> **The landing page speaks to Buyer A — the property and association management operations/compliance
> coordinator — first, and to Buyer B, the GC office manager, second.**

Reasons, in the order of how much they should weigh:

1. **A's category expectations already match our sales model; B's do not.** Buildium — the platform a
   large share of this ICP runs on — sells at **"starting at $62/month"** with a **"14-day trial"**,
   **"No credit card required"**, and **"It takes just 30 seconds"** to start `[D3]`. A $99-$299/mo
   self-serve card purchase is *the normal shape of a purchase* for buyer A. Buyer B's reference tool,
   Procore, publishes no price at all and charges *"an upfront annual fee by product and based upon your
   Annual Construction Volume (ACV)"* `[D4]`, and Buildertrend does not offer a free trial. Selling
   self-serve to B means fighting the buying habit as well as the incumbent. *(inferred from D3, D4)*
2. **A's pain is continuous; B's is periodic.** A property manager's vendor roster and tenant roster
   churn all year and every certificate has its own expiry. The GC's sharpest pain — the premium audit —
   is a **once-a-year event** `[E2]`. A once-a-year pain buys a once-a-year scramble, not a subscription.
   The audit is a superb *outbound trigger* (wave 3 should use it); it is a weaker *landing-page promise*.
3. **A has no incumbent aimed at their size.** Jones is aimed at property management but is priced
   *"per record, per year"* with the number withheld until you *"Talk to Us"* `[A5]`; myCOI, TrustLayer,
   Certificial, SmartCompliance and CertFocus all gate their price behind a demo `[A2][A3][A4][A8][A9]`;
   CertFocus's full service carries a **$10,000 annual minimum** `[A7]` and bcs's carries the same
   **"$10,000 annual minimum"** `[A1]`. Evident does publish a ladder — **"$15 per vendor, billed
   annually"** — but its entry tier starts at **200 third parties** `[A10]`, i.e. above the top of our
   ICP band, so its real floor is about **$3,000/year**. A 40-association HOA manager cannot buy any of
   them.
4. **A already pays a version of this bill — and so do their vendors.** Two first-party documents from
   property managers show the *vendor* being charged **$110/year** for Yardi VendorShield `[C1]` and
   **"$99 for onsite vendors or $80 for offsite vendors"** for RealPage Compliance Depot `[C2]`. The
   money in this workflow is real, named and annual; it is simply pointed at the wrong party.
5. **The one publicly-priced competitor is strongest exactly where A is weakest for us.** bcs gives away
   **25 vendors free, self-serve, no card** `[A1]`. A small PM firm may fit inside that free tier. This
   is the most serious threat in the file and it is dealt with in §7.4, not hidden.

**What would flip the ranking.** If wave-3 outbound finds GC reply rates materially above PM reply rates
on the audit trigger, or if the free-tier collision with bcs proves fatal at the PM end, the hero should
be rewritten for B. The landing page must therefore be built so the **hero, the proof block and the three
screenshots are swappable per audience**, with the same product underneath. `LANDING_SPEC.md` should
carry that as a requirement, not as a nice-to-have.

---

## 2. Buyer A — the operations / compliance coordinator at a property or association management firm

### 2.1 Who they are

A person who runs **the vendor and tenant paperwork for a portfolio**, at a firm of roughly 50-500
residential units, or 5-60 community associations, or a comparable book of commercial, self-storage or
manufactured-housing sites (the phase-3 ICP, `phase-3-acquisition/prospects/certly-pm/README.md`).
Titles vary — operations manager, compliance coordinator, portfolio administrator, association manager,
"the office" — and at the small end of the band the owner or broker *is* this person.
*(assumption A3: seniority and title are inferred from firm size and job-ad language, not interviews.)*

The defining structural fact: **there is no risk department.** That is not a detail, it is the reason
this ICP exists. Every incumbent in §5 sells to a risk manager. Our buyer is the person who would be the
risk manager if the firm were ten times bigger, and who currently is also doing renewals, work orders,
owner statements and the phone.

**Scale, modelled not sourced.** 25-120 live vendor certificates plus tenant certificates for a PM firm
in the band; an HOA manager with 40 associations multiplies a smaller vendor list across many named
insureds, because *each association is a separate entity that must appear as certificate holder and
additional insured*. *(assumption A1.)*

### 2.2 The rituals

**Daily.** Open email. Somewhere between zero and six certificates have arrived overnight, most of them
from **the vendor's insurance agent, not the vendor** — the agent is the one who can actually issue an
ACORD 25. Each arrives as a PDF attachment, often a scan, occasionally a photograph of a printout.
Open it, read six to twelve fields, compare them against what this property requires, then either file it
or write back asking for the thing that is missing. Approve work orders; the question *"is this vendor
current?"* is asked in passing, out loud, several times a day, and answered from memory. *(inferred from
D1's field list, E1's field-by-field reading, and C2's document packet.)*

**Weekly.** Sort the spreadsheet by expiry date. Buildium — the market leader — tells its own customers
that the method is: *"Keep a digital copy of these documents on file and set reminders to check for
renewals"* `[D2]`. That is the state of the art from the vendor of record. Send the week's chase emails,
usually forwarded to the agent, usually with the old certificate attached so the agent can "just update
the dates".

**Monthly.** Owner and board reporting. For an HOA manager this is the hard boundary: the board meets, and
somebody may ask whether the landscaper's insurance is current, or whether the new roofer is approved to
start. Answering *"let me check"* twice in the same meeting is a professional cost. New-vendor onboarding
packets go out: W-9, insurance certificate and endorsements, signed vendor agreement — that exact triple
is what a real property manager's packet asks for `[C2]`.

**Annually.** Renewal of the *firm's own* policies, which is when the firm's broker or carrier asks for
the vendor file; and lease renewals, which is when tenant certificates come due in a batch.

### 2.3 The moment a lapse is discovered

Three, in ascending order of how badly they end.

1. **The request with a clock on it.** An owner, a lender, a buyer's diligence team or the firm's own
   carrier asks for every vendor's current COI. Jones describes the shape exactly: a manager responsible
   for 20 commercial properties given 48 hours, and *"If COIs are buried in inboxes or on individual
   desktops, meeting that deadline could be impossible"* `[E4]`. Nobody is hurt. The coordinator loses
   two days and some standing.
2. **The claim.** Something happens on a property, and only then does anyone read the certificate
   properly. The failure is rarely "no insurance"; it is **the wrong kind of proof**. The distinction
   that decides it is the one the incumbents themselves teach: *"being listed as the certificate holder
   does not give you any coverage rights. If you need protection under the vendor's policy, you'd need to
   be added as an additional insured, which requires a separate endorsement on the policy"* `[E1]`.
   A firm can hold a beautiful, current, correctly-addressed certificate and still have no standing.
3. **The expired certificate nobody looked at.** *"If the vendor's COI expired six months prior and a
   leak from their equipment causes significant damage, the property owner could be stuck with the repair
   bill"* `[E4]`. And the certificate is only ever a snapshot: it *"is a starting point, not a
   guarantee"*, reflecting coverage *"at the moment it was issued"* `[E1]` — a policy can be cancelled the
   day after the PDF was generated and nothing about the PDF will change.

**The design consequence, and it is the whole product:** the buyer's dread is not "I don't have the
document". It is **"I have a document and I don't know whether it is the right one any more."** Certly's
job is to convert a folder of PDFs into a *current, dated statement of standing*. That is why the
identity in `IDENTITY.md` makes *meets requirements / expiring / gap* the loudest thing on every screen and puts
**"as of"** on every status.

### 2.4 The stack, and precisely where it fails them

| tool | who runs it | what it does about COIs | where it stops |
|---|---|---|---|
| **AppFolio** | residential/mixed PM in the band | vendor record with insurance expiry fields (liability, workers' comp, auto, umbrella) | a *date* field, typed by hand from a PDF; no reading of limits, no additional-insured check, no chase *(inferred; the pattern is stated by a rival `[D5]` and corroborated by Procore's identical field list `[D1]`)* |
| **Buildium** | small residential PM, growing firms | vendor records, documents, reminders | its own guidance to customers is *"set reminders to check for renewals"* `[D2]` — a reminder, not a verification |
| **Yardi (Voyager) + VendorShield / VENDORCafé** | larger PM, commercial | full credentialing: W-9s, COIs, contracts, continuous monitoring `[C3]` | the **vendor pays $110/year** to be in it `[C1]`; it is a Voyager-scale purchase, not a 60-unit purchase |
| **RealPage / Compliance Depot** | multifamily | credentialing plus a vendor marketplace | the vendor pays **$99 onsite / $80 offsite per year** `[C2]` |
| **Rent Manager, CINC Systems, Vantaca** | HOA and mixed portfolios | vendor records and document storage | **Two attempts were made and produced nothing either way.** Vantaca's features page loads but names only a "Vantaca Vendor" menu item with no feature text; a targeted search on CINC Systems returned no COI or vendor-insurance feature description. So this row is honestly blank rather than guessed. Working assumption for design purposes: "document storage plus a date", the same as every other row above — flagged as open question §9.2 |

**The pattern across the whole row:** every one of these systems can hold *a date*. None of them reads
*the certificate*. The gap is not storage. It is **interpretation** — limits against a requirement,
additional-insured against an endorsement, a policy period against today.

### 2.5 Their vocabulary (verbatim, with the source)

Copy that does not use these words exactly will read as written by someone who has never done the job.
Copy that over-uses them will read as an enterprise risk product. The rule for `LANDING_SPEC.md`: **use
the buyer's nouns and the plain-English verbs.**

| they say | verbatim source | how we must use it |
|---|---|---|
| **certificate of insurance / COI** | *"Insurance Certificate and Endorsements"* `[C2]`; *"certificate of insurance"* `[D2]` | Use **COI** in the product, spell it out once on the landing page. |
| **ACORD 25** | the form's own name `[E1]` | Say it once, early, as a competence signal. Launch scope is ACORD 25 only (`PLAN.md` A11) and the page must not imply otherwise. |
| **certificate holder** | *"the company that requested proof of insurance. In most cases, that's you"* `[E1]` | This is the buyer's *seat* on the form. Powerful, because the next sentence is the trap. |
| **additional insured** / **ADDL INSD** | The form itself, from the blank ACORD 25 (2025/12) published by New York's Department of Financial Services: *"IMPORTANT: If the certificate holder is an ADDITIONAL INSURED, the policy(ies) must have ADDITIONAL INSURED provisions or be endorsed."* `[E7]` | The single highest-value check we perform. **`ADDL INSD` is a checkbox column on the coverage grid** `[E7]` — a tick, not a number, which makes it one of the harder extraction targets and one that must show its confidence. |
| **waiver of subrogation** / **SUBR WVD** | Same form: *"If SUBROGATION IS WAIVED, subject to the terms and conditions of the policy, certain policies may require an endorsement."* `[E7]` | Also a checkbox column `[E7]`. Same extraction problem, same confidence requirement. |
| **endorsement** | The form again: *"A statement on this certificate does not confer rights to the certificate holder in lieu of such endorsement(s)."* `[E7]`; and *"Insurance Certificate and Endorsements"* is what a real vendor packet asks for `[C2]` | Names the thing the certificate is *not*. **This one sentence, printed on every certificate our buyer has ever handled, is the strongest honesty argument the product has.** |
| **"confers no rights"** | Printed at the top of every ACORD 25: *"THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER. THIS CERTIFICATE DOES NOT AFFIRMATIVELY OR NEGATIVELY AMEND, EXTEND OR ALTER THE COVERAGE AFFORDED BY THE POLICIES BELOW."* `[E7]` | The buyer has read this a thousand times and mostly stopped seeing it. Quoting it back to them is the fastest competence signal available, and it is the reason the product must never say it has "verified coverage". |
| **limits may have been reduced** | The form's own footnote: *"*LIMITS SHOWN MAY HAVE BEEN REDUCED BY PAID CLAIMS."* `[E7]` | A $2,000,000 aggregate on paper may be $400,000 in fact. Certly cannot see this and must say so. |
| **cancellation** | *"SHOULD ANY OF THE ABOVE DESCRIBED POLICIES BE CANCELLED BEFORE THE EXPIRATION DATE THEREOF, NOTICE WILL BE DELIVERED IN ACCORDANCE WITH THE POLICY PROVISIONS."* `[E7]` | There is no promised notice period any more. The expiry date is the only date anyone can rely on — which is precisely why the expiry timeline is the product's signature screen. |
| **primary and non-contributory**, **per-project aggregate** | myCOI's own feature copy: reads *"additional insureds, waivers of subrogation, primary and non-contributory clauses, per-project aggregates"* `[A4]` | The category's table stakes, in the incumbent's own words. Our requirement template must cover them. |
| **limits / each occurrence / general aggregate** | *"insurance coverage limits, which means the maximum the insurer will pay per occurrence or in aggregate"* `[E1]` | The numbers the buyer compares. Set them in tabular figures (`IDENTITY.md §5`). |
| **compliant / non-compliant** | *"They contact the vendors when there are non compliance issues"* (myCOI reviewer, Construction 51-200) `[B2]` | The buyer's own status word, and **Certly uses neither it nor "Covered"**. **Corrected 2026-09-03 (REVIEW.md B-02, §2.1):** this row originally said *"Certly uses **Covered**, not 'compliant', deliberately"*. The green state is **"Meets requirements"** (pill `MEETS`), and the engine value is `meets`. "Covered" is retired as a status word because the comparison engine has no state that means it, and because **O-A6 in this same file** says *"a wrong 'covered' is the failure that ends the company"* — where a document argues against itself, the lower-liability reading wins. The finding underneath survives: see the **current** row below. |
| **current** | *"required to keep your compliance and registration current"* `[C1]` | The best single word in the file. "Current" is what they want; "compliant" is what a vendor sells. **This is the word that replaces "Covered" in prose**, and only about a *document*: *"this certificate is current as of 3 Sep 2026"* is a statement about a date on a piece of paper — always true or always false, never a claim about coverage (`KNOWLEDGE_BASE.md` §F.5). |
| **deficiency / deficiency notice** | bcs's own feature list: *"Automated Deficiency Notices"* `[A1]` | The industry word for "what's wrong with this cert". Certly's gap report is its plain-English twin. |
| **onsite vendor / offsite vendor** | `[C2]` | A real segmentation in the buyer's head: who sets foot on the property. |
| **approved vendor** | *"All contractors will be required to maintain an 'Approved Vendor' status"* `[C1]` | The state the buyer is trying to maintain. Our green status is exactly this. |

### 2.6 Jobs to be done

Framed as Christensen-style progress, not features.

- **JTBD-A1 — "When someone asks whether a vendor is covered, I want to answer in one sentence, now,
  without opening anything."** This is the job. Everything else is in service of it.
- **JTBD-A2 — "When I take on a new vendor, I want to know what they're missing before they start work,
  not after."** The gate, not the audit.
- **JTBD-A3 — "When a certificate is about to expire, I want the chase to have already happened."**
  Note the tense. The buyer does not want a reminder; a reminder is a task. They want the email to the
  agent to have gone, and to be told only if it did not work.
- **JTBD-A4 — "When the owner, the board or the carrier asks for the file, I want to hand over something
  dated and complete in five minutes."** `[E4]`
- **JTBD-A5 — "When I put in the requirement once, I want it to apply to every vendor of that type
  forever."** This is where the incumbents visibly fail: *"The customization of insurance requirements is
  a bit lacking"* — myCOI reviewer, Real Estate, 51-200 employees `[B2]`.

### 2.7 How they discover and buy

- **Discovery.** Search ("vendor insurance tracking", "COI tracking software", "certificate of insurance
  spreadsheet"); the comparison-article layer, which in this category is dense and almost entirely
  written by vendors `[A6][A7][A8][A9]`; peers in association and metro-chapter settings; and their PMS's
  own marketplace. *(inferred from the shape of the search results collected in `sources.md`.)*
- **The purchase.** **Card, self-serve, monthly**, because that is what their software already costs and
  how it is already bought: Buildium at **$62-$400/month**, **14-day trial, no credit card, 30 seconds to
  start** `[D3]`. An invoice and a PO appear at the top of the band and for HOA firms spending
  association money, where a board may need to see a line item — so the product must be able to produce
  a proper invoice even though the default path is a card. *(inferred.)*
- **Decision maker.** The coordinator chooses; the owner/broker approves anything that looks like a new
  recurring line. Below roughly $150/month the coordinator can very often just do it. *(assumption A3.)*
- **Trial expectation.** A trial they start themselves, that shows them *their own* data. Buildium ships
  **sample data** so the trial is not empty `[D3]`; bcs's free tier is **25 vendors, self-serve, no card,
  no commitment** `[A1]`. Anything that asks "when can we schedule 30 minutes?" reads as the enterprise
  product they already decided they were too small for.
- **Price anchors they carry in their head.** Their PMS: **$62 / $192 / $400 per month** `[D3]`.
  What their *vendors* are charged by the incumbent credentialing platforms: **$80-$125 per vendor per
  year** `[C1][C2]`, and up to **$85-$150** in CertFocus's vendor-pay model `[A7]`. The one published
  COI-software ladder: **free to 25 vendors, then $0.95/vendor/month, then $17.80/vendor/year with a
  $10,000 minimum** `[A1]`. Category guides put entry platforms at **$800-$2,000/year** `[A7]`.
  **Implication for `OFFER.md`:** $99-$299/mo lands *between* their PMS bill and the incumbents' minimum,
  which is a defensible place to be — but it is above bcs's free tier, so the free tier must be answered
  on the page, not ignored.

### 2.8 Objections, in the order they will actually arise

| # | objection, in their words | the honest answer |
|---|---|---|
| O-A1 | "My PMS already has an insurance expiry field." | It has a date you typed. Certly reads the certificate: limits, additional insured, waiver, dates — and tells you what is missing. `[D1][D2]` |
| O-A2 | "bcs will do 25 vendors for free." | True, and said plainly `[A1]`. Our answer must be a real difference — the requirement template, the per-field confidence, the agent-facing chase — not a pretence that the free tier does not exist. |
| O-A3 | "Can I trust a machine to read an insurance document?" | The only defensible answer is **show the confidence and show the source**. Every extracted field carries a confidence and links to the exact place on the PDF; low confidence is a designed state, not an error. This is a `PLAN.md §6` risk and it is answered in the interface, not in copy. |
| O-A4 | "My vendors will not use another portal." | They do not have to. Forward the email, or the agent uses a no-login link. Note that this is a live differentiator: a rival reports that TrustLayer's no-login upload is a **paid-tier** feature `[A9]`. |
| O-A5 | "Are you going to charge my vendors?" | **No, and say it in those words** — the practice is real and documented at $80-$125/vendor/year `[C1][C2]`, and Jones markets against it explicitly: *"Jones never charges your vendors/subcontractors/tenants to submit insurance documents"* `[A5]`. |
| O-A6 | "What happens when it gets it wrong?" | A wrong "covered" is the failure that ends the company. The product must never assert coverage it did not verify; "needs review" must be a first-class, unembarrassing state. |
| O-A7 | "I don't have time to set this up." | The onboarding target is a requirement template from a lease or subcontract clause in under five minutes (`UX.md §3`). *(assumption A2 — a design target, not a measured benchmark.)* |
| O-A8 | "Is this legal advice / does it decide my coverage?" | No. Certly reports what the certificate says against what you asked for. Disclaimer on every gap report and every export (`PLAN.md` A10 discipline, applied here by analogy). |

### 2.9 Trust signals that work on them

In descending order of power, and each one is a *design* instruction:

1. **A price on the page.** In a category where six of seven publish nothing `[A2]-[A9]`, a number is the
   loudest trust signal available and it costs nothing to give.
2. **The document, on screen, with the extraction laid over it.** They have read a thousand ACORD 25s.
   Showing the form with our reading pinned to it is worth more than any adjective. *(inferred from E1.)*
3. **"We never charge your vendors."** `[A5][C1][C2]`
4. **A dated statement.** *"As of 3 September 2026, 41 of 47 vendors meet your requirements."* Dates are
   the currency of the job. **Corrected 2026-09-03 (REVIEW.md B-02):** this line originally read
   "41 of 47 vendors covered"; the portfolio summary line uses the canonical green word.
5. **Naming the hard cases correctly** — additional insured vs certificate holder, endorsement vs
   certificate `[E1]`. Two sentences of correct vocabulary establish more competence than a customer logo.
6. **A real export.** A PDF they can forward to an owner, a board or a carrier without editing it.
7. **Named integration destinations.** "Works alongside AppFolio, Buildium, Yardi" — even as export
   targets — because *"myCOI symcs with Procore"* was a *pro* in a real review `[B2]`.

### 2.10 Mobile vs desktop

*(assumption A4 — no source gives a split for this task; the split below is derived from the artefact.)*

- **Desktop is where the work is done.** An ACORD 25 is a dense landscape form; reviewing extraction
  against it needs two panes. The extraction review panel is a desktop-first screen and should say so.
- **Mobile is where the question is asked.** "Is the roofer good to start?" is asked standing in a
  hallway or a parking lot. The mobile job is: search a vendor, see one status word and one date, and
  tap **Chase**. Nothing else needs to work well on a phone.
- **Email is the third surface, and for the vendor's agent it is the only surface.** The agent will never
  log in to anything. Every vendor-facing interaction must be complete inside an email plus a no-login
  upload link `[A9]`.

---

## 3. Buyer B — the office manager / project coordinator at a general contractor

### 3.1 Who they are

At a commercial GC, design-build firm or specialty prime with **20-150 active subcontractors** and roughly
$5M-$150M revenue (phase-3 ICP, `certly-gc/README.md`), one person owns subcontract administration:
office manager, project coordinator, contract administrator, or the owner's spouse. They issue the
subcontract, collect the certificate, and hold the pay application until the paperwork is right.
The lever they have that Buyer A does not: **they control the cheque.** "No cert, no pay app" is enforceable.

### 3.2 The rituals

**Daily.** Certificates arrive from agents as subcontracts are executed. Each is checked against **that
subcontract's** requirements — which differ by trade and by project, because the owner's requirements flow
down. Pay applications come in and each one is a decision: release or hold.

**Weekly.** The project meeting asks who is cleared to be on site. A sub whose GL renewed mid-project may
have come back with a *lower* limit — the failure mode a rival names precisely: *"Spreadsheets don't send
alerts when a subcontractor's general liability drops from $2 million to $500,000 mid-project"* `[E6]`.

**Monthly.** Billing cycle; compliance holds are reconciled against pay apps.

**Annually — and this is the one that matters.** The **general liability and workers' compensation
premium audit**. Records required: *"payroll reports, check registers, cash disbursements journal
(including subcontractors, casual labor and material costs) and Certificates of Insurance"* `[E2]`.

### 3.3 The moment a lapse is discovered

**The audit, and it has a price.** Travelers — a carrier, not a software vendor — instructs contractors to
*"Obtain and maintain valid Certificates of Insurance (COI) showing workers compensation coverage for all
independent/subcontracted work during the policy term"*, and states the consequence flatly: *"Without
valid Certificate of Workers Compensation Insurance we may charge a premium for work performed by an
independent contractor/subcontractor"* `[E2]`. A construction broker puts a number on it: *"five- or
six-figure premium adjustments"*, *"shocking additional premium — tens of thousands of dollars you didn't
budget for"*, and notes carriers charge *"a higher rate per $1,000 of subcontractor costs than gross
receipts"* `[E3]`.

**And a second, worse one.** *"Many general liability policies include subcontractor warranty clauses"*;
without the documentation *"your insurer may deny coverage, leaving your business to absorb the financial
fallout"* `[E3]`.

This is the sharpest, most quantified pain in the entire file. It is also **annual**, which is why it
makes buyer B a better outbound target than a better landing-page hero (§1.2).

### 3.4 The stack

| tool | what it does about COIs | where it stops |
|---|---|---|
| **Procore** | Stores per-vendor **Insurance Type, Effective Date, Expiration Date, Limit, Name, Policy Number**, plus attachment and notes. *"Procore automatically emails your Insurance Manager when a vendor's policy is set to expire"*, with *"daily reminders starting two weeks before the expiration date and continu[ing] for up to 60 days after, or until the policy date is updated"* `[D1]` | It emails **you**, not the sub or the agent, and it does it **every day for up to 74 days**. It stores what a human typed; it does not read the PDF and does not check additional insured or waiver. And with a **Sage 300 CRE** ERP integration the insurance fields are **locked in Procore** and must be edited in the ERP `[D1]` |
| **Buildertrend** | project management for residential/remodel GCs; documents and vendor records | **"Custom quote required (no standard pricing published)"** on an independent panel, 4.5/5 across **2,486** reviews, with recurring cost cons — *"quite an expensive software for a small company"*, *"way too expensive"* — and setup cons — *"a huge learning curve for all teams"* `[D6]`. COI handling is storage, not interpretation |
| **Sage 300 CRE / Sage Intacct** | the accounting system of record; holds vendor insurance for AP holds | it is the ERP's field that wins `[D1]`, so anything Certly does must be exportable *to* it, never assume it owns it |
| **QuickBooks** | at the small end of the band, the whole back office | a vendor list and a folder; no insurance concept at all |

**The design consequence:** Procore's daily-email-for-74-days behaviour `[D1]` is the perfect foil.
Certly's reminder policy must be visibly the opposite — **few, scheduled, addressed to the person who can
act (the agent), and stopping the moment the document arrives.**

### 3.5 Their vocabulary (verbatim, with the source)

Everything in §2.5 applies, plus:

| they say | verbatim source | note |
|---|---|---|
| **sub / subcontractor** | *"A single project can involve 40 or more active subcontractors"* `[E6]` | never "vendor" to a GC |
| **subcontract** | `[E3]`'s *"subcontractor warranty clauses"* | the requirement source is the subcontract, not a lease |
| **flow-down** | owner requirements passed to subs; standard practice *(inferred from E2/E3)* | the reason requirements differ per project |
| **pay app / pay application** | Procore's compliance tab on subcontractor invoices `[D1]` | the enforcement point |
| **premium audit / audit** | *"General Liability Premium Audit"* `[E2]` | the annual event; the word to use in outbound subject lines |
| **workers' comp / WC** | *"Certificate of Workers Compensation Insurance"* `[E2]` | for a GC, WC is the certificate that costs money to be missing |
| **certificate holder / additional insured / waiver of subrogation** | `[E1]`, `[A4]` | identical to Buyer A |

### 3.6 Jobs to be done

- **JTBD-B1 — "Do not let me pay a sub whose insurance is not right."** A hold, not a report.
- **JTBD-B2 — "When the auditor asks, hand them a complete, dated file per subcontractor for the policy
  period."** `[E2]` This is a *product feature*: an audit pack export scoped to a policy year.
- **JTBD-B3 — "Tell me when a renewal comes back worse than the last one."** `[E6]`
- **JTBD-B4 — "Stop me chasing the sub; chase the agent."** The agent issues the certificate.
- **JTBD-B5 — "Do it without making my subs pay or make an account."** `[A5][A9][C1][C2]`

### 3.7 How they buy

- **Anchors are much higher and much less transparent.** Procore is quoted on **Annual Construction
  Volume** with no published price `[D4]`; Buildertrend has no free trial. A GC office manager is
  therefore *habituated to a sales call* — which cuts both ways: our no-demo price is more surprising and
  more differentiating, but the buying reflex ("get me a quote") is not the one we want.
- **The decision maker is the owner or the CFO/controller**, not the coordinator, and the trigger is
  usually a bad audit or a broker's instruction. Invoicing matters more here than for Buyer A.
- **The broker is a channel, not an obstacle.** The most credible statements in this file about the GC's
  pain come from a carrier `[E2]` and a broker `[E3]`. Wave 3 should treat brokers as partners; the
  phase-3 GC file already carries **84 construction insurance broker / surety agency rows**.

### 3.8 Objections specific to B

| # | objection | answer |
|---|---|---|
| O-B1 | "Procore already emails me about expiries." | Every day, for up to 60 days after expiry, to *you* `[D1]`. Certly emails the agent, once, before. |
| O-B2 | "My subs will not sign up for another system." | No account, no fee, forward-or-link `[A9]`. |
| O-B3 | "We have a spreadsheet and it is fine." | Until a renewal comes back at $500,000 instead of $2M mid-project `[E6]`, or an auditor prices the gap `[E2][E3]`. |
| O-B4 | "Does it integrate with Procore / Sage?" | Be honest about launch scope. Note Sage 300 CRE **locks** Procore's insurance fields `[D1]`, so an export/CSV path is the truthful v1 answer. |
| O-B5 | "$99-$299 a month for paperwork?" | Against a five- or six-figure audit adjustment `[E3]`, this is the cheapest line on the page — but only say it with the source attached. |

### 3.9 Mobile vs desktop

Same split as §2.10 with one addition: the GC coordinator is more likely to be asked the question **by
someone standing on a site**, so the mobile "is this sub cleared?" lookup carries more weight, and the
answer needs to be shareable as a text message.

---

## 4. What public reviews and public pages actually say about the incumbents

Every row is a fetched page. Rival-authored claims are labelled.

| incumbent | price on the public site? | what users or first-party pages say |
|---|---|---|
| **myCOI / illumend** | **No.** No price; a demo is required `[A4]`. Claims 45M+ documents, 16 years, *"87% faster reviews vs manual"* `[A4]` | 4.7/5 on 47 reviews, both panels `[B1][B2]`. Cons, verbatim: *"System was a mess"*; *"They were hard to work with, system was a mess"* (Construction, 11-50); *"Getting myCOI up and running with all the little nuances of our company was definitely difficult"*; *"The customization of insurance requirements is a bit lacking"* (Real Estate, 51-200); *"Bulk downloading documents in the cert Management is not usable...it takes us days"* (Construction, 501-1000); *"Sometimes it takes longer for a COI to be reviewed once a revision has been uploaded"*; *"Not super intuitive and some functionality takes a ramp up period"*. Pros: *"They contact the vendors when there are non compliance issues"*; *"myCOI symcs with Procore"* |
| **TrustLayer** | **No — the pricing URL is a 404** `[A2]`. FAQ: *"Pricing varies depending on platform usage… schedule a demo"* `[A3]` | Only **2 reviews**, both vendor-referred with incentives `[B3]`. The useful one is a pro: *"Before TrustLayer, I had about 5 clients I was doing certificate tracking for and I could never take a day off without falling behind. Now, I have 25 clients"*. Con: *"it would be helpful to be able to make changes at the master level and not at the organization level"*. A rival reports its no-login vendor upload is **paid-tier only** `[A9]` |
| **Jones** | **No.** Per record per year; *"Talk to Us"* for the number `[A5]` | Markets hard on two promises we should copy the substance of: *"No per-review or per-upload charges"* and *"Jones never charges your vendors/subcontractors/tenants to submit insurance documents"* `[A5]`. Attacks rivals for *"charg[ing] tenants, vendors, or subcontractors to upload their COIs"* `[A6]` |
| **Evident** | **Yes, but not for us.** Essential **"$15 per vendor, billed annually"** (200-1,000 third parties); Pro **"$25 per vendor"** (500-10,000); Enterprise custom `[A10]` | Headline: *"Stop reacting to risk. Start getting ahead of it."* Sells to enterprise risk teams — 7-Eleven, Coca-Cola, Amazon, United Rentals, Lowe's `[A11]`. The **200-third-party floor** is the clearest statement in the file that the small end of the market is unserved on purpose |
| **Certificial** | **No.** Free plan **up to 5 vendors**, then custom `[A8]` | A 5-vendor free plan is a lead magnet, not a tier a real portfolio fits in |
| **bcs (getbcs.com)** | **Yes — the only one.** Free **$0/mo up to 25 vendors, self-serve, no credit card, no commitment, no setup fee**; Self-Service **"$0.95 Per vendor, monthly"**; Full-Service **"$17.80 Per vendor, annually"**, **"$10,000 annual minimum"**, **"6-8 weeks"** implementation `[A1]` | The most dangerous competitor for our exact wedge, and the one that proves the wedge is real |
| **SmartCompliance** | **No.** Custom by module and user count `[A8]` | A rival prices it at $2,000-$4,000/yr, $40-$80/vendor `[A7]` — rival-sourced, treat as indicative only |
| **CertFocus (Vertikal RMS)** | Published only inside its own guide: self-service **$6-$8/vendor/yr, $7,500 minimum**; full-service **$13-$29/vendor/yr, $10,000 minimum**; **vendor-pay $85-$150/vendor/yr**; implementation **$3,500-$4,800** `[A7]` | A rival says non-compliant COIs there *"don't trigger automated remediation, or outreach. They go to a human for review"* `[A9]` |
| **Ebix** | *"annual costs typically starting in the mid-five figures"*; *"filed for bankruptcy in December 2023"* — both rival-asserted `[A8]` | recorded as rival claims |

### 4.1 The three complaints that repeat, and what each one tells us to build

1. **Demo-gating.** Five of the seven named platforms publish no price at all
   `[A2][A3][A4][A5][A8][A9]`. Of the two that do, **Evident's cheapest tier begins at 200 third
   parties** `[A10]` — above the entire ICP band — leaving **bcs as the only priced option a 25-to-150
   certificate buyer can actually reach** `[A1]`.
   → **Publish the price. It is the cheapest differentiator in the category, and at our size there is
   exactly one competitor doing it.**
2. **Setup and requirement rigidity.** *"Getting myCOI up and running with all the little nuances of our
   company was definitely difficult"* and *"The customization of insurance requirements is a bit
   lacking"* `[B1][B2]`; bcs's own full-service implementation is **"6-8 weeks"** `[A1]`.
   → **The requirement template editor is the product's real centre of gravity, and onboarding is measured
   in minutes.** This is why `UX.md` spends its longest section there.
3. **Latency and the human queue.** *"Sometimes it takes longer for a COI to be reviewed once a revision
   has been uploaded"* `[B2]`; a rival says CertFocus routes non-compliant certificates to a human `[A9]`;
   Jones advertises review *"in under 24 hours"* as a feature.
   → **Our answer is seconds with a visible confidence, not hours with a hidden analyst.** The honest
   trade is that we are faster and we show our uncertainty; they are slower and hide theirs behind a person.

---

## 5. Price anchors, assembled

| anchor | value | source |
|---|---|---|
| Buyer A's property management software | $62 / $192 / $400 per month; 14-day trial, no card | `[D3]` |
| Buyer B's project software | Procore: ACV-based, unpublished `[D4]`; Buildertrend: **"Custom quote required (no standard pricing published)"**, 4.5/5 on 2,486 reviews, with cost cons *"quite an expensive software for a small company"* and *"way too expensive"* | `[D4]`, `[D6]` |
| What incumbents charge the **vendor** | $110/yr (VendorShield); $99 onsite / $80 offsite (Compliance Depot); $85-$150/yr (CertFocus vendor-pay) | `[C1][C2][A7]` |
| The only published COI ladder our ICP can reach | bcs: free ≤25 vendors → $0.95/vendor/mo → $17.80/vendor/yr with a $10,000 minimum | `[A1]` |
| The other published ladder, and why it does not reach us | Evident: $15/vendor/yr **from 200 third parties** (≈$3,000/yr floor); $25/vendor/yr Pro | `[A10]` |
| Category guide bands | entry $800-$2,000/yr; professional $2,500-$10,000/yr; enterprise $10,000-$50,000+/yr | `[A7]`, rival |
| The cost of the pain (GC) | "five- or six-figure premium adjustments"; "tens of thousands of dollars you didn't budget for" | `[E3]` |

**Read:** the $99-$299/mo hypothesis sits above bcs's free tier, roughly at or below the *entry* band of
the category guides, and an order of magnitude below every full-service minimum. It is defensible. The
work in `OFFER.md` is not to justify the number against the enterprise tier — that is easy — but against
**free for 25 vendors**.

---

## 6. Who we are *not* selling to

Naming the anti-persona keeps the landing page honest.

- **Enterprise risk managers** with a compliance analyst. They are the incumbents' buyer, they want
  managed service, and they will ask for SOC 2 and an MSA on day one.
- **Insurance brokers and agencies** who want to track certificates *for* their clients. A real adjacent
  market — the TrustLayer review that mattered was from exactly this seat `[B3]` — but a different
  product shape (multi-client, master-level settings) and explicitly out of scope for v1. Note the
  request already exists in that review: *"make changes at the master level and not at the organization
  level"* `[B3]`.
- **Self-managing single landlords** with three vendors. Too small; the spreadsheet genuinely works.
- **Subcontractors and vendors themselves.** They are the *other side* of every interaction and they must
  never be charged or made to create an account `[A5][A9]` — but they are not the customer.

---

## 7. The recommendation, stated so it can be argued with

### 7.1 The landing page speaks to Buyer A first

The hero addresses the property and association management operations/compliance coordinator. The reasons
are in §1 and rest on: their software-buying habit already matches self-serve `[D3]` versus B's
quote-based habit `[D4]`; a continuous pain versus an annual one `[E2]`; and no incumbent priced for
their size `[A1][A5][A7]`.

### 7.2 Buyer B is not dropped — B is the outbound programme

The GC's audit is dated, dollar-denominated and carrier-documented `[E2][E3]`. That is a better *email*
than it is a *headline*. Recommendation to wave 3: an audit-season sequence, brokers as partners, and a
`/for-general-contractors` page carrying B's vocabulary (sub, subcontract, pay app, premium audit).

### 7.3 One product, two dialects

The domain model is identical — party, requirement, document, extraction, status, reminder. Only three
things change between audiences: the noun (**vendor** vs **sub**), the requirement source (**lease /
management agreement** vs **subcontract**), and the enforcement point (**work order** vs **pay app**).
`UX.md` treats this as a single setting chosen during onboarding, not as two products.

### 7.4 The bcs free tier must be answered on the page, not avoided

A competitor gives away 25 vendors, self-serve, with no card `[A1]`. Pretending otherwise loses the
buyer's trust the moment they find it. The defensible answers, in order: the requirement template built
from *their* clause; per-field confidence with the document shown; the agent-facing chase; and a real
price above the free tier that buys support and no upgrade cliff. `OFFER.md` should test a free tier of
its own, and if it does, it must be *smaller* and honest rather than a fake match.

---

## 8. What would falsify this persona

Written now, so the wave-1b reviewer and the wave-3 data can hold me to it.

1. If self-serve signups from GC domains exceed PM domains in the first 100, §1 is wrong.
2. If more than a third of trials ask "can we get on a call?", the no-demo thesis is wrong for this ICP.
3. If the requirement template takes users more than 15 minutes, assumption A2 is wrong and onboarding
   needs a library of pre-built templates instead of a clause parser.
4. If the most-used feature is document storage rather than the gap report, we built a filing cabinet and
   the positioning in `IDENTITY.md` must change.
5. If buyers ask us to charge their vendors, §2.9/O-A5 is wrong — but the founder should decline anyway.

---

## 9. Open questions for the founder

1. ~~**Was Evident reached?**~~ **CLOSED 2026-09-03 (REVIEW.md MN-08).** It was reached, by the Offer &
   Landing agent — `offer/CLAUDE.md` and `offer/RESEARCH.md` §2.1–2.2 record the 2026-09-03 fetch:
   headline "AI-Powered Supplier Risk Management", "85% reduction in administrative burden",
   "96% on-time", CTA "Book a Demo", **no published pricing**. The conclusion is unchanged: Evident's
   floor of 200 third parties puts it out of the ICP's reach, so "bcs is the only priced option at our
   size" still holds. Nothing here needs the founder.
2. **Rent Manager, CINC Systems and Vantaca**: no evidence was found either way about ACORD-25 extraction
   or requirement matching. If the founder has access to any of the three, five minutes inside one
   settles whether HOA firms already have a partial answer.
3. **Trademark clearance for the final name is not done and cannot be done here** — Justia is 403 and
   USPTO has no usable public JSON endpoint at the paths tried `[F15][F16]`. This needs a real search
   before money is spent on the mark.
4. ~~**Does the founder want the free tier at all?**~~ **RESOLVED 2026-09-03 (REVIEW.md MJ-12, OQ-3),
   and the answer is no.** `BACKLOG.md` N12 and `OFFER.md` §9 decided it after this file was written:
   **no permanent free tier**, and a one-off **Free Gap Report** (M15) instead. The reasoning, kept
   here so it is not re-litigated: every document costs a real model call, free users upload the
   messiest documents, and a free tier that fixes conversion by removing revenue has not fixed
   anything. If activation→paid fails at $99, the pre-committed fix is **price** (`THRESHOLDS.md` §3's
   $49 test), not a free tier that guarantees the unit economics never work.
5. **Are we willing to say "we will never charge your vendors" as a permanent commitment?** It is a strong
   trust signal `[A5]` and it closes off a revenue model the incumbents use `[C1][C2][A7]`.
   **Recommended default, applied while the founder decides (REVIEW.md §2.9, OQ-9): yes, permanently,
   and it goes in `/legal/terms`** (`specs/13` §4/§A11). It is already promised in the hero, in FAQ 4
   and in every vendor-facing email footer; a promise made in three customer-facing places and absent
   from the terms is how a commitment quietly becomes a marketing line. A commitment that can be
   withdrawn is not a commitment — which is exactly why it is the strongest trust signal we own. The
   founder can override by striking the clause **before** launch, not after.
