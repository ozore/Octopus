# Certly — the offer

**Author:** Offer & Landing agent (wave 1). **Date:** 2026-09-03.
**Evidence:** every number and quotation below is sourced in `offer/RESEARCH.md`. Nothing here is
remembered; nothing here is invented.
**Primary buyer:** property and association managers (`certly-pm`), per the brief's default.
`PERSONA.md` had not been written to disk when this was drafted; it landed shortly afterwards and was
then read in full. **It independently reaches the same answer** — its §1 and §7.1 rank the PM/HOA
operations & compliance coordinator first, its §2.7 confirms the self-serve card purchase is this
buyer's normal buying shape, and its §2.7 price anchors put $99–$299 between the buyer's own PMS bill
($62–$400/mo) and the incumbents' $10,000 annual minimum. Nothing below needed reversing. Two of its
instructions **did** change this document and are marked in place: §7.4 (the competitor free tier must
be answered on the page, not avoided → §8.3 and `LANDING_SPEC.md` §6) and §2.8 O-A5 (say "we never
charge your vendors" in those words → §4 P11 and the hero trust line). **One contradiction between
`PERSONA.md` §2.5 and `KNOWLEDGE_BASE.md` §F is unresolved and referred to the wave-1b reviewer** —
see `LANDING_SPEC.md` §14.
**Binding on this document:** the copy invariants in `KNOWLEDGE_BASE.md` §F.5 — Certly never says
*verified*, *compliant* or *covered* as a bare assertion about a policy; it says *meets your
requirement*, *asserted, not evidenced*, or *gap*; and it publishes no accuracy percentage, and no
share of any population, without its denominator and measurement date.

> **NAME PENDING — `IDENTITY.md` §2.3 (REVIEW.md MJ-13).** `IDENTITY.md` recommends renaming to
> **Coverfile**: two live companies already trade as Certly, `certly.app` is somebody else's parked
> placeholder, and the `.co` is running gambling spam. **The code slug stays `certly`** (`PLAN.md` A3,
> the phase-3 prospect lists, the Vercel project names). **Every customer-facing occurrence below —
> hero copy, the outbound email signature, the Stripe product names and price nicknames, agent-facing
> footers — renders `{PRODUCT_NAME}` from one constant.** §12.1's Stripe product names are the one
> place this must be settled **before** the founder creates the objects: renaming after Stripe objects
> exist is cheap, renaming after invoices exist is not. Trademark clearance stays a founder task
> (`PREREQUISITES.md` P11).

> **Revised 2026-09-03 after the wave-1b review.** The status vocabulary (B-02), the tier metric's name
> (B-10), the trial CTA and its disclosure (B-06), the activation definition (B-05), the Lapse Watch's
> two holes (MJ-19), an unsourced 60% (MJ-07), the hardcoded forwarding domain (B-11) and the
> inference-cost figure (OQ-8) all changed. Each edit is marked in place; the record is
> `REVIEW_RESPONSE.md`.

**The status vocabulary this document uses, settled (REVIEW.md §2.1, B-02).** The green state is
**"Meets requirements"** (pill `MEETS`, engine value `meets`). The five requirement states are
**Meets requirements · Gap · Claimed, not evidenced · Not checked · Needs review**; the six vendor
states are `expired` · `gap` · `expiring` · `asserted_only` · `meets` · `no_certificate`
(`specs/05` §2, `specs/06` §3). **"Covered" is not a status word.** The buyer's own word **"current"**
survives, about a *document*: *"this certificate is current as of 3 September 2026."*

---

## 1. The one-sentence offer

> **Send us your vendor list and your certificates. Inside 30 days you will have a file where every
> vendor is in one of three states you can defend to a lender, a board, an auditor or a carrier —
> *meets your requirement*, *asserted but not evidenced*, or *gap* — and Certly keeps it that way by
> chasing the agent before anything expires. $99 to $299 a month. No demo, no sales call, no
> implementation.**

---

## 2. The value equation

Hormozi's four terms, verbatim from the primary checklist
([Acquisition.com](https://www.acquisition.com/hubfs/Offer%20Checklists%20-%20PDF%20Downloads/Pricing-Value-Checklist.pdf?hsLang=en)):
maximise **dream outcome** and **perceived likelihood of success**, minimise **time to success** and
**effort & sacrifice**. Scored honestly for Certly, 1–10.

### 2.1 Dream outcome — 8

Not "a tidy spreadsheet". Two moments, and the second is the one that gets a credit card out this
month:

1. **You never discover a lapsed certificate at claim time.** The mechanism is documented: "An
   additional insured endorsement on a cancelled policy provides no coverage. If the certificate
   holder doesn't know the policy was cancelled, they may not discover it until they file a claim and
   the carrier denies it" ([bcs](https://www.getbcs.com/blog/what-happens-when-a-vendors-insurance-expires-a-risk-managers-guide)).
   The *cost* of that moment is undocumented, so we describe the mechanism and never attach a number.
2. **The request lands and you answer it the same hour.** A lender asks for evidence on a refinance.
   A board asks before the annual meeting. The carrier's premium auditor asks for "Certificates of
   Workers Compensation and General Liability Insurance covering the time the contractors perform
   work for you" and warns that "Without valid Certificate of Workers Compensation Insurance we may
   charge a premium for work performed by an independent contractor/subcontractor"
   ([Travelers](https://www.travelers.com/business-insurance/services/premium-audit/general-liability-premium-audit)).
   Today that is a day of digging through email. With Certly it is one dated export.

**The lever:** sell moment 2 loudly and moment 1 quietly. Moment 1 is bigger but it is a fear about a
counterfactual; moment 2 is a scheduled, dated, dollar-denominated event the buyer has already lived
through. Hormozi's rule is to solve a problem *worth solving*; Bain's 2,300-decision-maker study says
what actually drives B2B loyalty is expertise and responsiveness, not price — cost ranked #27
([CXL](https://cxl.com/blog/b2b-value-proposition/)).

### 2.2 Perceived likelihood of success — 3. **This is the binding constraint.**

Hormozi's prescribed lever for this term is "testimonials & proven case studies". We are **forbidden
from inventing either**, and we have none. Meanwhile Jones publishes "99.73% accuracy (monitored
weekly)" ([getjones.com](https://getjones.com/property-management/)), illumend publishes "45M+
insurance documents" and "87% faster reviews vs manual" ([illumend.ai](https://www.illumend.ai/)),
and TrustLayer publishes "517,000+ companies" ([trustlayer.io](https://www.trustlayer.io/)).

Six substitutes, ranked by how much likelihood they buy per unit of cost:

| # | Substitute | Why it works where a testimonial would |
|---|---|---|
| 1 | **A working demo on the page, no login.** Three sample certificates; pick one; watch the fields lift off the PDF and land against a requirement set; see one real gap. | Nothing persuades like the machine doing the thing. It also converts our weakest term into our strongest, because the visitor supplies the scepticism and the product answers it. |
| 2 | **The ACORD form's own words.** "A statement on this certificate does not confer rights to the certificate holder in lieu of such endorsement(s)." | We are not asserting the problem exists; ACORD is. Unfalsifiable claims are the category's disease and this is the antidote. |
| 3 | **The third state, named and defended.** `asserted_only` — the certificate claims additional-insured status but no endorsement page is attached. Per `KNOWLEDGE_BASE.md` §B.4, collapsing it into "met" is "the industry's standard lie". | A product that says **"claimed, not evidenced"** where the evidence is genuinely missing is far more credible than one that says "compliant ✓" about everything. *(An earlier draft said "about **60%** of real certificates". **No source supports that number** and `BACKLOG.md` N10 bans exactly this shape of claim, so it is removed — REVIEW.md MJ-07. The share will be published from the golden set with its denominator and date once labelling is done (`specs/03` §15.1), and measured live thereafter as `asserted_only_detected`. Until then no share is stated anywhere.)* |
| 4 | **Published method instead of published accuracy.** Confidence score per field, an explicit `needs_review` state, the golden set and its size, and a public methodology page. The accuracy number ships the day it is measured, with its denominator. | Every rival publishes an unaudited percentage. Publishing the *measurement design* is the only differentiating move left. |
| 5 | **A real, redacted artefact.** One downloadable gap report generated from a public sample certificate, with the real form numbers on it. | The buyer can inspect the deliverable before paying — which no demo-gated incumbent permits. |
| 6 | **The guarantee** (§6). | Hormozi's risk reversal, scoped to the only promise we control. |

### 2.3 Time delay — 8

- **First finding: under 10 minutes.** Forward one certificate to a Certly address, or drop a PDF;
  the extraction and the three-state comparison return immediately.
- **Whole file clean: 30 days.** That is the guarantee interval and it is honest, because it depends
  on agents replying, which we do not control.
- Against the alternative: Certificial publishes that manual COI work runs "3 to 4 hours per person
  per day" ([certificial.com](https://www.certificial.com/)); bcs says 200+ vendor clients report
  saving "15–20 hours per week" ([getbcs.com](https://www.getbcs.com/)). Both are vendor marketing
  and are attributed as such wherever used.
- Against the incumbents: every one of the six named competitors requires a sales call before you
  can see a price (`offer/RESEARCH.md` §2.1). Our time-to-first-value is measured in minutes; theirs
  starts with a calendar invitation.

### 2.4 Effort & sacrifice — 7, and improvable

The three things the buyer must actually do, and what each costs:

| Step | Effort today | Effort with Certly | How we cut it further |
|---|---|---|---|
| Get the certificates into one place | They are in email | Forward them, or drop a folder, or CSV-import a spreadsheet | A per-account forwarding address (`yourfirm@{INBOUND_DOMAIN}`) so the vendor's agent can be told to send there directly, forever — `SH-1`, after launch |
| Say what you require | Nobody has written it down | Pick a template, edit three numbers | The requirement-template library (bonus B1) with per-property and per-vendor-class overrides |
| Chase the agent | The part they hate and skip | Automatic, on a ladder | T−60/−30/−14/−7/−1 then weekly, capped and consolidated per vendor (`KNOWLEDGE_BASE.md` §B.5) |

**The killer to avoid** (Ramanujam's term for a feature whose presence destroys willingness to pay):
anything that reads as a *project*. myCOI's own reviewers name it — "It takes a while for a new user
to become acclimated"; "The biggest challenge with myCOI was getting all vendors, agents and some of
our long-time employees on board"
([Capterra](https://www.capterra.com/p/234580/myCOI/reviews/)). Certly's onboarding must be an
import, never an implementation, and the word "implementation" never appears on the site.

**The second killer:** an unthrottled chase. "Too many e-mail requests sent to vendors that they get
overwhelmed or upset" (same source). The chase burns the customer's own vendor relationships, which
are worth more to them than we are. One consolidated ask per vendor per rung, with a visible cap and
a pause switch, is a *feature* and should be said out loud.

---

## 3. The offer name

Hormozi's MAGIC frame — Magnet, Avatar, Goal, Interval, Container.

| Layer | Name | M-A-G-I-C |
|---|---|---|
| Front end (HVCO) | **The Free Gap Report** | Magnet: gap · Avatar: property and association managers · Goal: find what's wrong · Interval: same day · Container: report |
| Core offer | **The 30-Day Clean File** | Goal: a defensible file · Interval: 30 days · Container: file |
| Guarantee | **The Lapse Watch** | Goal: no silent expiry · Container: watch |

Use in copy: *"Start with the Free Gap Report. If you like what it finds, The 30-Day Clean File is
$99 a month and comes with the Lapse Watch."* Suby's HVCO rule is that the front end "solves a
burning problem… without asking for a sale" — so the Gap Report must return a *finding*, not a signup
form.

---

## 4. The core offer, stacked

Hormozi's construction: list every obstacle between the buyer and the dream outcome, convert each to
a solution, then trim and stack.

| # | Obstacle, in the buyer's words | Solution | Cost to us | Value to them | Verdict |
|---|---|---|---|---|---|
| P1 | "I don't even know how bad it is" | **Free Gap Report** — up to 25 certificates, dated, no card, no login | **$0.10–0.20 per document** → **$2.50–5.00 per full report** (`THRESHOLDS.md` §5; the earlier ~$0.02 was a 5–10× underestimate with no arithmetic behind it — REVIEW.md OQ-8), plus one import. The **daily spend cap in `specs/15` §11 is a launch requirement, not a nice-to-have** | Very high | **Front end, behind a founder legal gate** (`specs/15`) |
| P2 | "My certificates are in six years of email" | Per-account forwarding address (`yourfirm@{INBOUND_DOMAIN}`, an **env value** — we do not own `certly.app`, REVIEW.md B-11) + drop-folder + CSV import. *Forward-by-email is `SH-1`, not MVP; at launch this is drop-folder + CSV* | Low, build once | High | **Core** |
| P3 | "I don't know what limits I should be requiring" | **Requirement-template library** (`KNOWLEDGE_BASE.md` §B), each template dated and sourced, editable, with the §F.2 disclaimer | One-time writing, already largely done | Very high | **Bonus B1** |
| P4 | "The certificate says additional insured — is that enough?" | The three-state engine and the endorsement-page check (§B.4, §C) | Core engineering | Very high | **Core — this is the product** |
| P5 | "Chasing agents is the job I keep not doing" | Reminder ladder to the vendor **and the producer on the certificate**, consolidated, capped, pausable | Low | Very high | **Core** |
| P6 | "Twice a year someone asks me to prove all this" | **Audit-Ready Binder** — dated PDF + CSV per property or per portfolio, with the §F.1 disclaimer printed on it | Low | Very high | **Core, and the thing to demo** |
| P7 | "I'd have to rebuild my spreadsheet" | **Migration**: CSV import that maps their columns, plus the first 50 records set up | Support time, front-loaded | High | **Bonus B4** |
| P8 | "What do I actually write to the agent?" | **Agent Chase Pack** — four emails that name the exact ISO form numbers to request (CG 20 10, CG 20 37, CG 24 04, and the WC waiver) | Writing only | High | **Bonus B3** |
| P9 | "I need to see the year ahead, not a dashboard" | **Renewal Calendar** — 12-month .ics + CSV export of every expiry | Trivial | Medium-high | **Bonus B2** |
| P10 | "What if your robot is wrong?" | Confidence per field, `needs_review` state, quote gate (every extracted value shows the text it came from), published method | Core engineering | Very high | **Core, and a proof asset** |
| P11 | "I don't want to be sold to" | No demo, no call, published price, self-serve card, cancel in the portal | Negative cost — it removes work | High | **Core, and say it in the headline** |

**Explicitly trimmed:**

- **Any human review service.** bcs's full-service tier carries a **$10,000 annual minimum**
  ([getbcs.com/pricing](https://www.getbcs.com/pricing)); Jones sells "Jones Operator" concierge
  ([getjones.com/pricing](https://getjones.com/pricing/)). That is a headcount business, it breaks
  PLAN.md's "no human loop inside the products", and it is where every incumbent already lives.
- **Vendor-paid fees.** Some incumbents charge the *vendor* to submit. Jones states plainly that it
  "does not charge vendors or subcontractors to submit insurance documents"; matching that is free
  and removes the single biggest reason a vendor ignores a compliance email.
- **Phone support at $99.** Email only, with an SLA, at every tier.
- **Anything beyond ACORD 25 at launch** (PLAN.md A11). Say the scope on the page rather than let a
  buyer discover it.

---

## 5. Bonuses — cost to us against value to them

Priced at the value the buyer would otherwise have to pay or do. The stated values are **our estimate
of the buyer's alternative cost, not a market price**, and the page must present them that way or not
at all.

| # | Bonus | What it is | Cost to us | Value to them | Which tier |
|---|---|---|---|---|---|
| **B1** | **Requirement Template Library** | Dated, sourced, editable requirement sets for residential PM, HOA/COA, commercial tenant, self-storage, manufactured housing, student housing, plus vendor-class overlays (landscaping, roofing, snow, elevator, janitorial, restoration) and GC subcontract sets. Built from real published contract exhibits (`kb-samples/requirements/`). Carries the §F.2 "starting points, not advice" disclaimer. | Writing, already substantially done by the Product Owner | The alternative is an hour of a broker's time per class, or copying a neighbour's numbers and hoping | All, including Free |
| **B2** | **Renewal Calendar** | 12-month .ics + CSV of every expiry in the portfolio, refreshed on every change | Half a day, once | It is the artefact the buyer forwards to their boss; it makes the subscription visible to the person who approves it | All paid |
| **B3** | **Agent Chase Pack** | Four email templates that get an endorsement page out of a producer, naming the exact ISO forms — CG 20 10 (ongoing operations), **CG 20 37 04 13** (completed operations, [full form](https://www.iiat.org/uploads/files/general/InfoCentral/Commercial-GL/cg2037.pdf)), CG 24 04 (waiver), WC waiver — plus the escalation and the "we are holding your invoice" version | Writing only | High. This is the exact task they avoid, and asking for the wrong thing is why they get sent another certificate instead of an endorsement | All paid; first two free with the Gap Report |
| **B4** | **Migration** | We map their spreadsheet columns and stand up the first 50 vendor records | Support time, front-loaded and falling | Removes the switching cost, which is the #1 reason a spreadsheet user does not move | Standard and Portfolio |
| **B5** | **The Free Gap Report itself** | Up to 25 certificates, dated, delivered as a PDF they can keep whether or not they buy | **$2.50–5.00 of inference per full report** at `THRESHOLDS.md` §5's measured-from-list-pricing figure of $0.10–0.20 per document — **not the ~$0.50 an earlier draft assumed** (REVIEW.md OQ-8). Halved again by the Batch API. Bounded by the rate limits and the **daily spend cap** in `specs/15` §11, which is a launch requirement | Very high — it is the only way to learn the answer without hiring someone | Front end |

**Trim-and-stack check.** Every bonus above is low-cost and high-value *and* pulls in the same
direction as the core promise. Nothing here is a filler bundled to pad a tier. Two ideas were cut for
failing that test: a "COI 101" course (high effort, low pull) and a broker-referral directory (drags
us toward advice we are not licensed to give).

---

## 6. The guarantee, and every liability it creates

### 6.1 What we recommend saying

> ## The Lapse Watch
> **If a certificate we are tracking expires and we did not warn you before it expired, that month is
> free.** No form, no argument — tell us, and we credit it. **On an annual plan the remedy is a credit
> of one month of your plan — one twelfth of what you paid.**
>
> This is a promise about *our* warning, not about your vendor's insurance. It applies to every
> certificate where you gave us a readable expiry date. **The expiry warning cannot be switched off**,
> so nothing you do in settings can cost you this guarantee. It does not apply to a certificate we
> flagged for review because we could not read its dates, to a vendor added after their certificate
> had already expired, or to email we sent that your server rejected — in all three cases you will
> find the warning in your dashboard, dated.
>
> Stacked with it: **cancel any time, and 30 days money back, no questions asked.**

**Two holes closed 2026-09-03 (REVIEW.md MJ-19).** (a) *"that month is free"* was undefined for an
**annual** subscriber, and six of the eight Stripe prices are annual — the remedy is now stated as a
one-month credit, i.e. 1/12 of the annual price, capped exactly as the monthly remedy is.
(b) "Warned" is defined in §6.2 L3 as *"surfaced in the dashboard, dated, **and sent to the account
email**"*, but the customer-facing expiry email (`UX.md` §4.1 C4) was opt-out — so a customer who
turned off notifications could still satisfy the carve-out's only stated condition, and we would owe a
credit for a warning they had disabled. **The expiry warning is now non-optional** (`specs/13` §2,
`UX.md` §4.1 C4): everything else stays opt-out, the guarantee stays simple, and it is defensible
product behaviour rather than a lawyerly exclusion. The old clause *"did not turn reminders off"* —
which referred to **vendor** reminders — is deleted from the promise.

Hormozi's checklist demands two things and this meets both: conditional guarantees should be "better
than money back" and you should "always match the guarantee terms with the activation points in your
program — what does someone actually have to do to be successful, make those the terms"
([Unbeatable Guarantee Checklist](https://www.acquisition.com/files/unbeatable-guarantee-checklist.pdf)).
The activation point for Certly is *a certificate the customer gave us with a date we could read*.
That is exactly what the guarantee is conditioned on. The stack is Hormozi's "Option A: pick a
conditional and unconditional guarantee and put them together".

### 6.2 Every liability, flagged

| # | Liability | Severity | Mitigation built in |
|---|---|---|---|
| **L1** | **Scope creep from "warn" to "coverage".** A customer reads "Lapse Watch" as "Certly guarantees my vendors are insured", is denied at tender, and comes back angry. | **High — the one that matters** | The guarantee text names itself as a promise about the warning in its second sentence. The §F.1 disclaimer sits on every result, export and email. The words *verified*, *compliant* and *covered* are banned outright (`KNOWLEDGE_BASE.md` §F). |
| **L2** | **Adverse selection on unreadable certificates.** A customer uploads 200 scanned faxes we cannot parse, then claims the guarantee on every one. | Medium | The carve-out: certificates flagged `needs_review` because the expiry date could not be read are excluded, and the flag is visible at upload time, not discovered later. This is Akerlof's lemons problem applied to a guarantee; the fix is screening *before* the promise attaches, not arguing after. |
| **L3** | **Email deliverability we do not control.** Their mail server quarantines our warning. | Medium | "Warned" is defined as *surfaced in the dashboard, dated, **and** sent to the account email* — and the expiry email is **non-optional**, so the condition cannot be silently removed by a settings change (MJ-19). The dashboard is the record of truth. Bounces are shown in-app. |
| **L4** | **Unbounded refund exposure.** | Low, but must be capped | The remedy is capped at **one month's subscription fee**, stated in the text ("that month is free"), never a multiple, never consequential loss. |
| **L5** | **The Free Gap Report reads as an opinion.** A prospect treats "3 gaps found" as advice and cancels a vendor's contract on it. | Medium | The report carries §F.1 verbatim on page 1, states its own scope ("read from the documents you supplied"), and uses the three states rather than pass/fail. It never says a vendor "is not insured". |
| **L6** | **Requirement templates read as legal advice.** | Medium | §F.2 on the picker and on every template. Every template dated and sourced to a real published exhibit. Never presented as "what you should require". |
| **L7** | **Unlicensed insurance advising.** Telling a customer their requirements are wrong, or that a policy responds, edges toward a regulated activity. | High if crossed, easily avoided | Certly compares documents to rules *the customer set*. It never proposes a limit as correct, never opines on whether coverage would respond, and routes "should I require more?" to "ask your broker or counsel". |
| **L8** | **The 30-day money-back invites a free extraction run.** Import 400 certificates, export the binder, refund. | Low | Accepted deliberately. The exposure is one month of inference, and the alternative — a conditional refund with hoops — costs more conversion than it saves. Monitor; if abuse appears, move to "refund minus the certificates processed", not to no guarantee. |

### 6.3 The safer alternative, if the founder will not carry even this

Drop the free month and run **unconditional only**: *"Cancel any time. 30 days, money back, no
questions asked."* That matches SmartCompliance's published "30-day guarantee… refund"
([smartcompliance.co](https://smartcompliance.co/)) and is table stakes rather than differentiation.

If the founder wants risk reversal without a cash remedy, the Hormozi-preferred substitution is a
**service guarantee**: *"If a certificate we track expires without a warning from us, we will collect
the replacement ourselves — we will contact the vendor and the producer until it is in your file, at
no charge."* It gives more service instead of money back, retains the customer, and keeps the case
data. It is weaker as a headline and safer on the balance sheet.

**Founder decision required.** Recommended: 6.1 as written. Fallback: the service guarantee. Floor:
unconditional 30-day only.

---

## 7. Honest urgency

Hormozi's rule is that urgency must be real and external. Three levers qualify; two commonly used in
this category do not.

**Qualifies:**

1. **The buyer's own earliest expiry date.** The Gap Report ends with: *"The next certificate in this
   file expires in 11 days: [vendor]."* Specific, dated, theirs, and true. This is the single
   strongest close available and it costs nothing.
2. **The premium-audit letter.** Carriers audit annually and ask for subcontractor certificates
   "covering the time the contractors perform work for you"; missing them, Travelers says, means "we
   may charge a premium for work performed by an independent contractor/subcontractor"
   ([Travelers](https://www.travelers.com/business-insurance/services/premium-audit/general-liability-premium-audit)).
   Outbound timing hook: the month after the customer's own policy anniversary.
3. **A named request with a date on it** — a lender's condition, a board packet deadline, an
   insurer's renewal questionnaire. Used in outbound as a trigger, never fabricated.

**Does not qualify, and must never appear:**

- **Renewal "season".** No fetched source establishes when commercial GL renewals concentrate. Do not
  claim one (`offer/RESEARCH.md` §8.1).
- **Any countdown timer, seat limit, "founding customer" cap or price-rise threat** that is not
  operationally real. Self-serve SaaS has no scarce resource, and PLAN.md's standing rules forbid
  manufacturing one. If the founder genuinely caps early accounts to protect support quality, that
  cap may be stated — and only then.

---

## 8. The price ladder

### 8.1 The metric — **tracked vendors** (renamed 2026-09-03, REVIEW.md B-10)

> **A tracked vendor is one non-archived vendor in your account. Certly tracks one current
> certificate per tracked vendor: renewals, re-uploads, corrections and endorsement pages never count
> again, and archived vendors count zero. A vendor who has not sent anything yet still occupies a
> slot — finding those is the point.**

That sentence is canonical, lives in `specs/10` §2.1, and is reproduced **verbatim** here, in
`LANDING_SPEC.md` §6, in `specs/13`'s help article 12 and on `/settings/billing`. It is never
paraphrased.

**Why the name changed.** This section used to call the unit *"active certificates tracked — one
current certificate per vendor"* while `specs/10` metered *"one non-archived vendor"*. Those are two
different meters: under the spec's, a vendor who has **never sent a certificate** consumes a paid
slot. That is not a bug — `specs/06` §3 calls exactly those vendors *"the most valuable finding for a
new customer"*, and a manager who imports 80 vendors to find out which are uncovered is buying that
finding — but calling it a *certificate* count made the bill unpredictable and made us look as though
we were charging for a document that does not exist. **The meter stands; the word changes**, and it
changes now, before the founder creates any Stripe object: `cert_limit` → `vendor_limit`,
**Certificate Pack → Vendor Pack**, "active certificates" → "tracked vendors".

Why a per-vendor meter and not a raw document count: the product exists to *cause renewals*, and a
per-document meter charges the customer every time it succeeds — a misaligned value metric, which
Price Intelligently models as the direct cause of high churn and low expansion
([*The Anatomy of SaaS Pricing Strategy*, ch. 5](https://hub.paddle.com/hubfs/Price-Intelligently-SaaS-Pricing-Strategy.pdf)).
It is also the only definition legible to a buyer who has already shopped the category: Jones meters
"records per year" with "unlimited COIs and lease extractions for that record"
([getjones.com/pricing](https://getjones.com/pricing/)); bcs and COI Tracker meter per vendor.

### 8.2 The ladder

| Tier | Price | Tracked vendors | Card? | Who it is for |
|---|---|---|---|---|
| **Free Gap Report** | $0, one-off | up to **25 documents**, report only | No | Anyone. The HVCO. No account, no login; source files deleted at render, everything else purged at 7 days, and no producer contact details stored at all (`specs/15` §6). |
| **Starter** | **$99/mo** or **$990/yr** | **50** | **Yes — card required** | 50–200 units, or 5–15 associations. ~25–45 recurring vendors plus a few tenants. |
| **Standard** ← default | **$199/mo** or **$1,990/yr** | **150** | **Yes — card required** | The modal `certly-pm` firm: 200–500 units or 15–45 associations. Adds migration and per-property requirement sets. |
| **Portfolio** | **$299/mo** or **$2,990/yr** | **400** | **Yes — card required** | Multi-market managers, self-storage and MH operators, small GCs with 60–150 subs. |
| **Vendor Pack** | **+$39/mo** per 50 | add-on, stackable | Yes | Published overage, so nobody has to call us to grow. |
| Above ~700 | published: "email us, it is $0.55 per tracked vendor per month" | — | — | **Still not a demo.** The one promise we never break. |

**Every CTA on these tiers reads "Start 14-day trial", never "Start free"**, with
*"Card required. No charge until {date}. Cancel in one click."* rendered **next to the button in body
text** (REVIEW.md B-06; `specs/10` §3.1). The only genuinely free thing we offer is the Free Gap
Report, and it keeps the word "free" because it is true.

Annual = ten months for twelve (**17% off**), matching the category convention
([COI Tracker](https://coitracker.co/pricing) advertises "~17% discount").

### 8.3 Why these numbers, against each alternative

**Against the spreadsheet** (the real competitor — 977 of the 1,101 `certly-pm` end-customers use
one). The comparison the page must show is hours, not features, and it must use *the buyer's own*
hours as the input. The two published anchors — Certificial's "3 to 4 hours per person per day" for
manual COI work and bcs's "15–20 hours per week" saved at 200+ vendors — are vendor marketing and are
attributed by name. Even at a conservative fraction of either, $199/month is not a close call. This
is Hormozi's "charge what it's worth", and it is the argument the pricing block is built around.

**Against the $29–$129 self-serve trackers.** COI Tracker sells at $29/25, $59/100, $129/unlimited
with a free 10-vendor tier. Its own published feature list is expiry reminders, update requests, a
status dashboard, PDF storage and CSV export — **no extraction, no requirement matching, no
endorsement checking, no agent contact** ([coitracker.co/pricing](https://coitracker.co/pricing)).
TrackMyVendor gives 25 vendors free ([trackmyvendor.com](https://trackmyvendor.com/property-manager-compliance)).
We are 1.7× to 3.4× their price and we must never argue on price. The argument is the job:
**they tell you *when* the certificate expires; we tell you *whether it was ever any good*.**
Paddle's caution applies precisely — "if the market is oversaturated already, you won't be able to
charge much higher than competitors of a near equal value"
([paddle.com](https://www.paddle.com/resources/willingness-to-pay)) — and our entire defence is that
a date tracker is *not* near-equal value. If the landing page fails to make that visible in one
picture, the price fails. That is why the hero is the diff (§`LANDING_SPEC.md` §5, V1).

**Against bcs, the closest thing to a rate card.** Free ≤25; Self-Service **$0.95/vendor/month**;
Full-Service **$17.80/vendor/year with a $10,000 annual minimum**
([getbcs.com/pricing](https://www.getbcs.com/pricing)). Normalised:

| Portfolio | bcs Self-Service | Certly | Verdict |
|---|---|---|---|
| 50 vendors | $47.50/mo | $99/mo | We are **2.1× more expensive**. Deliberate. Do not discount; sell the third state. |
| 150 vendors | $142.50/mo | $199/mo | 1.4× more expensive. |
| 400 vendors | $380/mo | $299/mo | **We are cheaper**, and by enough to say so. |
| Managed service | $833/mo floor (the $10k minimum) | n/a | The floor that makes the whole self-serve wedge exist. |

Note also that bcs's *paid* CTAs are still "custom quote" despite the published rate. Our
self-serve checkout is a real difference, not a claimed one.

**Against the demo-gated six.** No public price exists for TrustLayer, illumend, Evident,
Certificial, SmartCompliance; Jones publishes the metric but no dollars. Capterra lists TrustLayer as
"Starting Price: Contact vendor" with **no free trial**
([capterra.com](https://www.capterra.com/p/198486/TrustLayer/)). We cannot price against a number
that does not exist — so we price against the *process*, and the page says: *you can be running in
ten minutes; with them you can be booked in for Thursday.*

### 8.4 The tier the founder should consider, and why it is not in the launch ladder

A **Solo tier at $49/mo for 20 tracked vendors** would blunt COI Tracker directly and open the bottom
of the `certly-pm` file (Home Suite Home at 55 properties; Allenorth at 7 associations). Against it:
Hormozi ("be more expensive than everyone else… by enough that it causes consumer to pause") and
Ramanujam's minivation warning; Poyar's finding that early-stage companies concentrate on flat fees
and that discounting is the classic undifferentiated move. **Recommendation: launch without it.**
Revisit only if measured signup-to-paid on Starter is below the 8% category median
([Poyar, n=200](https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion))
*and* exit surveys name price rather than switching cost. Pre-committing this to `THRESHOLDS.md`
prevents a panic discount in month two.

---

## 9. Trial design

**Dual CTA, per Poyar's measured result** — offering both a freemium path and a card-required trial
produced a "26% improvement at creating premium trials"
([growthunhinged.com](https://www.growthunhinged.com/p/how-to-improve-free-to-paid-conversion)).

| Path | What it is | Card | Length | Why |
|---|---|---|---|---|
| **Primary — Free Gap Report** | Up to 25 certificates, dated PDF, no login, no account | No | One-off | The HVCO. It produces the finding that closes the sale, and it is not a crippled account — so it does not compete with the free tiers at COI Tracker, TrackMyVendor and bcs on a dimension where we would lose. **Ships behind a founder legal gate** (`specs/15`); until that lands, the samples-only demo carries the hero. |
| **Secondary — 14-day trial** | Full Starter, Standard or Portfolio, all features, that tier's tracked-vendor limit, cancel in the portal | **Yes — and we say so before we ask for it** | **14 days** | Card-required trials convert at **30%, "more than 5x ones that don't require one"**; **14 days is the most common length (62%)**; category median free-to-paid is **8%**. Same source. |

**Trial mechanics.** Stripe Checkout with `trial_period_days = 14`, card collected, cancel-anytime in
the Billing Portal, reminder emails at T−3 and T−1 (Stripe's own trial-ending webhook), and
**no charge without a warning**. The trial is on the *tier the customer picked*, not a special trial
plan — fewer moving parts, and the customer experiences the product they will pay for. There is **no
25-vendor trial cap**; 25 is the Free Gap Report's document cap (REVIEW.md MJ-09).

**Disclosure is part of the offer, not part of the legal page (REVIEW.md B-06).** A card-required
trial that renews automatically is a negative-option subscription. Every CTA reads
**"Start 14-day trial"**; *"Card required. No charge until {date}. Cancel in one click."* renders
adjacent to it in body text with a real date; the disclosure string shown is **recorded** against the
Checkout session; and the T−3 and T−1 warnings are **transactional and cannot be switched off**.
Full implementation in `specs/10` §3.1. Calling this "Start free" would have been the exact pattern
the FTC's negative-option rule and ROSCA are aimed at, for no conversion gain we can point to.

### 9.1 The trial health checklist — *not* the activation metric

**What a healthy trial looks like by day 7** (the instrument for the nudge below): certificate #1
processed within 24 hours; a requirement template saved; at least one `gap` or `asserted_only`
surfaced; at least one chase email sent. An account that has not hit all four by day 7 gets a single
human-written nudge from the founder's mailbox — the only human in the loop, and at the edge, per
`PLAN.md` A6.

> **These four conditions used to be called "activation" here, and they are not** (REVIEW.md B-05,
> §2.3). **Activation is `specs/11` §2 and nothing else**: one `comparisons` row against a certificate
> the org uploaded, out of `needs_review`, emitted once per org by the comparison job. One of the four
> conditions above — *a gap must exist* — **is not under our control**, and it is precisely what
> `THRESHOLDS.md` §6 sets out to measure (`activated.gaps_found`). Defining activation to require a
> gap would make a customer with a **clean portfolio** count as a failed activation: a self-inflicted
> STOP on the one metric that can stop the business. They are a good day-7 checklist; they are not the
> number.

---

## 10. Objection map

Ten objections, the answer, where it is answered, and what proves it. Nothing here may be answered
with a claim we cannot show.

| # | Objection | Answer | Where | Proof |
|---|---|---|---|---|
| 1 | "My spreadsheet works fine." | Your spreadsheet holds the date. It does not hold whether the endorsement page was ever attached. | Hero + V1 | The ACORD 25's own notice, quoted |
| 2 | "How do I know your AI reads them right?" | You don't yet, and we won't tell you a number we haven't measured. Every field shows the text it was read from, low-confidence fields are marked for review, and here is the method. | Proof block | Quote gate; `needs_review`; published methodology page |
| 3 | "This looks like a project." | Forward one certificate. You get the answer before you finish your coffee. Import your spreadsheet when you're ready. | Hero demo + step 1 | The no-login demo |
| 4 | "I already tried a COI tool and it spammed my vendors." | One consolidated ask per vendor per rung, a visible cap, and a pause switch. Your vendor relationships are worth more than our reminder schedule. | FAQ | The reminder ladder, published |
| 5 | "$199 is more than [tracker] charges." | It is. They tell you when a certificate expires. We tell you whether it was ever any good. Here are both, side by side. | Pricing block | The feature comparison, sourced |
| 6 | "I need a demo / I need to talk to someone." | You can. But you don't have to, and you can see the price and the product first. | Hero + pricing | Published prices; working demo |
| 7 | "What about my tenants, not just vendors?" | Same engine — a tenant certificate is a certificate, and there is a commercial-tenant requirement template. | FAQ | Template library |
| 8 | "Does it read anything besides ACORD 25?" | Not at launch. ACORD 25 only, and we say so rather than let you find out. | FAQ | PLAN.md A11 |
| 9 | "Is my vendors' data safe?" | Your documents are yours, stored in your account, deleted when you delete them, and never used to train anyone's model. | Footer + FAQ | Written policy, not a claim — `/legal/privacy` and `/legal/subprocessors` (`specs/13` §4), plus the Free Gap Report's own 7-day purge |
| 10 | "What if I stop paying?" | Export everything — certificates, gap history, the calendar — in one click, any time, including after you cancel. | FAQ | The export exists |

Two objections we deliberately do **not** rebut, because rebutting them costs credibility:
*"Can you guarantee my vendors are insured?"* — answer: **no, and nobody can**; only the insurer can
confirm coverage. And *"Are you as established as myCOI?"* — answer: **no. They have sixteen years
and 45 million documents. We have a working demo, a published price and a guarantee, and you can
test all three before you pay us anything.**

---

## 11. The godfather version, for outbound

Constraints it must respect: D5 (organisation-level only — no named individuals, no LinkedIn),
D4/A4 (drafts first, founder approves, 20/day/mailbox at start), CAN-SPAM footer, and the copy
invariants. Personalisation uses only company-level public facts already in
`phase-3-acquisition/prospects/certly-pm/prospects.csv` — published portfolio size, metro, segment.

### 11.1 Email 1 — the Godfather

> **Subject:** the certificate on file for your landscaper
>
> Hello —
>
> Your site says {{PUBLISHED_PORTFOLIO_FACT}} in {{METRO}}. That is somewhere around
> {{ESTIMATED_VENDOR_BAND}} vendor certificates to keep current, which is normally a spreadsheet and
> a folder in someone's inbox.
>
> Here is the thing most spreadsheets miss. Every ACORD 25 says, in its own words: *"a statement on
> this certificate does not confer rights to the certificate holder in lieu of such endorsement(s)."*
> A tick in the ADDL INSD column is a claim. The endorsement page is the proof. Most files have far
> more of the first than the second, and nobody finds out until a claim or a premium audit.
>
> **The offer:** send us up to 25 of your current certificates — forward the emails, or drop the
> folder — and we will send back a dated Gap Report that puts every one into one of three states:
> meets your requirement, asserted but not evidenced, or a gap. No charge, no call, no account. You
> keep the report whether or not you ever use us.
>
> If it finds nothing, you have a dated document saying so, which is worth having the next time a
> lender or your carrier's auditor asks.
>
> — {{FOUNDER}}, Certly (a TheVillage company)
> Certly reads documents and compares them to the rules you set. It does not verify coverage.
> {{POSTAL_ADDRESS}} · {{UNSUBSCRIBE}}

**Why this shape.** Suby's Godfather requires a big promise, risk reversal and a reason to act; two
of the three are here and the third (scarcity) is deliberately absent because it would be invented.
The proof is a quotation from a document *they already have on their desk*, which is the only form of
proof available to a brand with no customers. The ask is a file, not a meeting — Hormozi's "minimise
effort & sacrifice" applied to the first touch.

### 11.2 The two follow-ups and the breakup, in one line each

(Full sequences belong to the wave-3 playbook; these are the offer-side anchors.)

- **F1, +4 days — the artefact.** Attach the **redacted sample Gap Report** built from a public
  sample certificate. "This is what one looks like. Yours takes about ten minutes."
- **F2, +9 days — the dated trigger.** The premium-audit angle, timed to the month after their own
  policy anniversary where that is public: the auditor asks for subcontractor certificates
  "covering the time the contractors perform work for you", and missing ones can be charged as
  premium ([Travelers](https://www.travelers.com/business-insurance/services/premium-audit/general-liability-premium-audit)).
- **Breakup, +16 days — the give.** No ask. Send the requirement template for their segment, dated
  and sourced, with the §F.2 disclaimer, and close the file.

---

## 12. Draft Stripe product list

For the founder to create, per D2 — **test mode first, live after founder QA**. One Stripe account
for all three apps, so every object is namespaced. Apps read price IDs from env; no IDs are invented
here.

### 12.1 Products

> **Settle the product name before creating these** (MJ-13). The names below are written with
> `{PRODUCT_NAME}` = the launch name; `IDENTITY.md` §2.3 recommends **Coverfile**. Renaming after these
> objects exist is cheap; after invoices exist it is not.

| Product name | Statement descriptor | Description | Metadata |
|---|---|---|---|
| `{PRODUCT_NAME} Starter` | `CERTLY` | COI tracking and gap detection for up to 50 tracked vendors | `app=certly`, `tier=starter`, `vendor_limit=50`, `seats=3` |
| `{PRODUCT_NAME} Standard` | `CERTLY` | Up to 150 tracked vendors, per-property requirement sets, migration | `app=certly`, `tier=standard`, `vendor_limit=150`, `seats=10` |
| `{PRODUCT_NAME} Portfolio` | `CERTLY` | Up to 400 tracked vendors, unlimited properties, priority support | `app=certly`, `tier=portfolio`, `vendor_limit=400`, `seats=25` |
| `{PRODUCT_NAME} Vendor Pack` | `CERTLY` | +50 tracked vendors, stackable add-on | `app=certly`, `tier=addon`, `vendor_increment=50` |

*(`app=certly` and the statement descriptor `CERTLY` stay: the slug is internal and the descriptor is
capped at 22 characters and set once. Only the customer-visible product **names** carry
`{PRODUCT_NAME}`.)*

### 12.2 Prices

| # | Product | Nickname | Price | Currency | Interval | Trial days | Billing scheme | Metadata | Env var |
|---|---|---|---|---|---|---|---|---|---|
| 1 | {PRODUCT_NAME} Starter | `starter-monthly` | **$99.00** | usd | month | **14** | licensed, qty 1 | `app=certly, tier=starter, vendor_limit=50, seats=3, plan_rank=1` | `STRIPE_PRICE_CERTLY_STARTER_MONTHLY` |
| 2 | {PRODUCT_NAME} Starter | `starter-annual` | **$990.00** | usd | year | **14** | licensed, qty 1 | `app=certly, tier=starter, vendor_limit=50, seats=3, plan_rank=1, discount=17pct` | `STRIPE_PRICE_CERTLY_STARTER_ANNUAL` |
| 3 | {PRODUCT_NAME} Standard | `standard-monthly` | **$199.00** | usd | month | **14** | licensed, qty 1 | `app=certly, tier=standard, vendor_limit=150, seats=10, plan_rank=2, default=true` | `STRIPE_PRICE_CERTLY_STANDARD_MONTHLY` |
| 4 | {PRODUCT_NAME} Standard | `standard-annual` | **$1,990.00** | usd | year | **14** | licensed, qty 1 | `app=certly, tier=standard, vendor_limit=150, seats=10, plan_rank=2, discount=17pct` | `STRIPE_PRICE_CERTLY_STANDARD_ANNUAL` |
| 5 | {PRODUCT_NAME} Portfolio | `portfolio-monthly` | **$299.00** | usd | month | **14** | licensed, qty 1 | `app=certly, tier=portfolio, vendor_limit=400, seats=25, plan_rank=3` | `STRIPE_PRICE_CERTLY_PORTFOLIO_MONTHLY` |
| 6 | {PRODUCT_NAME} Portfolio | `portfolio-annual` | **$2,990.00** | usd | year | **14** | licensed, qty 1 | `app=certly, tier=portfolio, vendor_limit=400, seats=25, plan_rank=3, discount=17pct` | `STRIPE_PRICE_CERTLY_PORTFOLIO_ANNUAL` |
| 7 | {PRODUCT_NAME} Vendor Pack | `pack50-monthly` | **$39.00** | usd | month | 0 | licensed, **quantity adjustable 1–10** | `app=certly, tier=addon, vendor_increment=50` | `STRIPE_PRICE_CERTLY_PACK50_MONTHLY` |
| 8 | {PRODUCT_NAME} Vendor Pack | `pack50-annual` | **$390.00** | usd | year | 0 | licensed, quantity adjustable 1–10 | `app=certly, tier=addon, vendor_increment=50, discount=17pct` | `STRIPE_PRICE_CERTLY_PACK50_ANNUAL` |

### 12.3 Settings that go with them

| Setting | Value | Why |
|---|---|---|
| Checkout mode | `subscription`, card required, `trial_period_days=14` on prices 1–6 | Poyar: card-required trials convert ~5× better. **The disclosure in `specs/10` §3.1 goes in the Checkout line-item description as well as next to the CTA** |
| Billing Portal | On: cancel, switch plan, update card, adjust Pack quantity, download invoices | "Cancel any time" must be true in one click, not an email |
| Proration | On, for tier switches and Pack quantity | Upgrades must be frictionless; the meter is the growth path |
| Tax | Stripe Tax on, US only at launch | A2 |
| Trial-end reminders | Stripe's `customer.subscription.trial_will_end` → our email at T−3 and T−1 | "No charge without a warning" |
| Refunds | Manual, 30-day, no questions (§6) | Guarantee |
| Free Gap Report | **No Stripe object at all** | It is not a plan. No card, no account, nothing to cancel, nothing kept past 7 days. |
| Above ~700 tracked vendors | Published rate $0.55/tracked vendor/mo, invoiced | Keeps the "never a demo" promise without building metered billing at launch |

**Not created at launch, deliberately:** any Solo/$49 price (§8.4), any usage-metered price, any
coupon. Coupons before the first 100 customers destroy the price anchor and teach the market to wait.

---

## 13. Self-review

### 13.1 The "stupid to say no" test

Reading the offer as a 400-unit property manager with a spreadsheet:

- *"I get a dated report on my actual certificates for free, with no call and no account."* — Yes,
  and the report is mine either way. **Passes.**
- *"If it finds something, the fix is $199 a month, which is less than one afternoon of my time."* —
  The arithmetic is shown with my hours, not theirs. **Passes.**
- *"If they let one expire without telling me, that month is free."* — A promise about something they
  actually control. **Passes.**
- *"I can cancel in a click and take my data."* — **Passes.**
- *"But is it any good?"* — **This is where it is still weak.** The honest answer today is "try the
  demo, read the method, and we'll publish the number when we have measured it." That is the best
  available answer for a brand with no customers, and it is why §2.2's six substitutes carry the
  whole page.

**Verdict: strong but not yet "stupid to say no", and it cannot be until the first measured accuracy
number and the first real testimonial exist.** The honest thing is to say so here rather than
manufacture the missing proof. The single highest-leverage improvement available before launch is
the no-login demo (§`LANDING_SPEC.md` §8) — it is the only asset that converts scepticism into
evidence without a customer.

### 13.2 Value equation, scored after the offer is built

| Term | Before | After | What moved it |
|---|---|---|---|
| Dream outcome | 8 | 8 | Unchanged; it was already the right dream |
| Perceived likelihood | **3** | **6** | Demo + ACORD's own words + the third state + published method + redacted artefact + guarantee. Capped at 6 until measurement and customers exist. |
| Time delay (inverted) | 8 | 9 | Free report with no account; 10 minutes to first finding; forwarding address |
| Effort & sacrifice (inverted) | 7 | 8 | CSV import, migration bonus, template library, capped chase |

The offer is now limited by exactly one term, and that term is limited by exactly one thing we cannot
buy: elapsed time with real customers.

### 13.3 Open questions for the founder — **each with the default that ships if nothing is said**

Consolidated after the wave-1b review (REVIEW.md §5). **The default is what ships**, so silence
produces something defensible rather than a stall. The full de-duplicated list of fifteen founder
questions, across every document, is in `REVIEW_RESPONSE.md` §"Founder can override"; the orchestrator
copies it into `PREREQUISITES.md`.

| # | question | default that ships | founder overrides by |
|---|---|---|---|
| **Q1** | **The guarantee** — §6.1 as written, or §6.3's safer fallback? | **§6.1 as written**, with MJ-19's two fixes applied (annual remedy defined; the expiry warning made non-optional). Exposure is capped at one month, the carve-outs are screened *before* the promise attaches, and it is the only risk reversal we control | striking it before launch |
| **Q2** | **The Free Gap Report** — is the founder willing to hold strangers' third-party documents at all? | **Yes, under `offer/RESEARCH.md` §7's conditions as reconciled in `specs/15` §6.1** — no producer personal data ever stored, source files deleted at render, everything purged at 7 days, terms next to the drop zone — **and only after a legal read. This is a launch gate, not a preference** (REVIEW.md B-07). Until it lands the page runs the samples-only demo as its single hero CTA and the Gap Report sits behind a waitlist line | the legal read; or by taking the strict one-file/5 MB/24-hour fallback in `specs/15` §6.1 |
| **Q3** | **Solo $49 tier** (§8.4) | **No at launch.** The test is pre-committed: `THRESHOLDS.md` §3 Round 1 puts $49 against $99 on a fresh cohort of ≥ 100 **if and only if** activation and retention are strong and only conversion fails. Do not discount before the data | running the test early |
| **Q4** | **The name.** Two live companies trade as Certly; `certly.app` is somebody else's | **Decide before the Stripe products are created** (§12.1). Recommendation: rename the customer-facing name to **Coverfile**, keep the slug `certly`. Run a real USPTO class 9/42 search first — no agent could (Justia 403, no public USPTO JSON endpoint) — and spend nothing on a mark or a domain until it is done | naming it |
| **Q5** | **Which beachhead gets the landing page** — PM or GC? | **PM/HOA**, which `PERSONA.md` §1/§7.1 and this document reached independently. GC is the **outbound** programme (the premium audit is dated and dollar-denominated) with a `/for-general-contractors` variant per `PERSONA.md` §7.2 | asking for the GC hero |
| **Q6** | **"We never charge your vendors" as a permanent commitment** | **Yes, permanently, and it goes in `/legal/terms`** (REVIEW.md §2.9, `specs/13` §A11). It is promised in the hero, in FAQ 4 and in every vendor email; leaving it out of the terms is how a promise quietly becomes a marketing line | striking the clause before launch |
| **Q7** | **Inference cost** — $0.02 or $0.10–0.20 per document? | **Plan on $0.10–0.20** (`THRESHOLDS.md` §5 shows its arithmetic from list pricing; the $0.02 showed none). Consequence accepted now: a 25-document free report costs **$2.50–5.00**, so `specs/15` §11's daily spend cap is a launch requirement. Even at $0.20 a document, gross margin at $99 stays above 95% | nothing — `extraction_succeeded.cost_cents` settles it in week one |
