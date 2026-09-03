# WageLens — Product Backlog

Author: Product Owner agent (WageLens), wave 1. Date: **2026-09-03**.
Companion documents: [`KNOWLEDGE_BASE.md`](KNOWLEDGE_BASE.md) (the data),
[`THRESHOLDS.md`](THRESHOLDS.md) (when to persevere / iterate / stop), `specs/` (one file per
Must item), `PERSONA.md` / `UX.md` (Buyer & Identity agent, in progress at time of writing —
where this document says "see UX.md" and the file does not yet exist, the screen is described
inline and UX.md wins on any conflict).

---

## 0. The test every Must item had to pass

> **Rosa** runs the office at a 12-person electrical sub in Waco. It is Friday, 4pm. Payroll
> ran Thursday. Certified payroll #7 for the Fort Cavazos job is due to the GC's compliance
> person by Monday morning or the December progress payment is held. She has a stack of paper
> time cards, last week's spreadsheet, and a wage determination PDF someone emailed her in
> January. She is not sure whether the guy who spent Tuesday pulling wire in a crawlspace and
> Wednesday running conduit is an Electrician or a Low Voltage Technician, and the difference
> is $20.50 an hour.

Every Must item below answers the question **"would Rosa pay $99 a month without it?"** with
*no*. Everything that answers *yes* is in Should, Later or Never — including things that are
obviously good ideas. DOL's own burden estimate for one WH-347 is **55 minutes**
(KNOWLEDGE_BASE KB-6). A sub filing 45 forms a year spends **41 hours** on this. That is the
budget the MVP is competing for, and nothing that does not reduce it belongs in the MVP.

**Activation is one event: `wh347_generated` for the first time.** Every Must item exists to
get a stranger from signup to that event inside one sitting, and back there every Friday after.

---

## 1. Must — the MVP

14 items. Effort: **5 L, 4 M, 5 S**. Each has a spec under `specs/`.

| id | item | effort | depends on |
|---|---|---|---|
| [WL-13](specs/WL-13-kb-ingestion-and-refresh.md) | Wage-determination corpus: ingestion and daily refresh | L | — |
| [WL-00](specs/WL-00-public-rate-lookup.md) | **Public rate lookup (unauthenticated)** | S | WL-13 |
| [WL-01](specs/WL-01-auth-and-organisation.md) | Magic-link auth and organisation | M | — |
| [WL-02](specs/WL-02-project-and-wd-lookup.md) | Project setup with wage-determination lookup | L | WL-01, WL-13 |
| [WL-03](specs/WL-03-classification-catalogue.md) | Classification catalogue per determination | M | WL-13, WL-02 |
| [WL-04](specs/WL-04-workers-and-classification-mapping.md) | Worker roster and classification mapping (+ conformance path) | L | WL-02, WL-03 |
| [WL-05](specs/WL-05-weekly-hours-entry.md) | Weekly hours entry grid | L | WL-04 |
| [WL-06](specs/WL-06-wh347-and-statement-of-compliance.md) | WH-347 and Statement of Compliance generation | L | WL-05 |
| [WL-07](specs/WL-07-payroll-history-and-export.md) | Payroll history and export | S | WL-06 |
| [WL-08](specs/WL-08-determination-change-alerts.md) | Determination-change alerts | M | WL-13, WL-02 |
| [WL-09](specs/WL-09-billing.md) | Billing: trial, subscription, portal | M | WL-01 |
| [WL-10](specs/WL-10-settings.md) | Settings | S | WL-01 |
| [WL-11](specs/WL-11-help-and-legal.md) | Help, disclaimers and legal pages | S | — |
| [WL-12](specs/WL-12-admin-metrics.md) | Admin metrics | S | all |

---

### WL-00 · Public rate lookup (unauthenticated) — **S**

**Added during wave-1 reconciliation**, after [`OFFER.md`](OFFER.md) §7 made it non-negotiable
("the Rate Lookup is free forever with no card and no login; the trial gates the *form*, never
the *rate*") and [`LANDING_SPEC.md`](LANDING_SPEC.md) §5 made it the landing page's element #2.

**Story.** As a stranger, I pick my state, county and construction type on the home page and see
the real classifications and rates for my job — with the WD number, the modification number and a
link to SAM.gov — without a login, a card or an email address.

**Value to Rosa.** Her binding constraint is not price, it is **believing the rates are right**.
Every claim we make about the corpus is falsifiable against SAM.gov in ten seconds, from the
front page, before she gives us anything. That is the trust argument executed rather than asserted.

**Would a stranger pay without it?** She would never get far enough to be asked. This is the
front door: the landing page's demo, the outbound emails' link target, and 3,088 county pages of
the only organic acquisition this product has.

**It is not a free tier.** The rates are public federal data we made queryable. The paid product
is the *form* — roster, hours, WH-347, Statement of Compliance, history, alerts.

**Dependencies.** WL-13 only. No auth, no writes, no new tables — a read-only view over `kb_*`.

**Analytics.** `lookup_performed {state_code, county_name, construction_type, result_count}` ·
`lookup_ambiguous {candidate_count}` · `lookup_zero_results` · `lookup_official_link_clicked` ·
`lookup_cta_clicked` (the top of the funnel) · `public_lookup_rate_limited`.

---

### WL-01 · Magic-link auth and organisation — **M**

**Story.** As a new visitor, I enter my work email, click the link in the message, and I am
inside my company's WageLens with no password to invent or remember.

**Value to Rosa.** She is the only person who will ever use this. A password is a support
ticket waiting to happen and a reason to abandon signup on a Friday afternoon. Auth exists so
that the WH-347 she made last week is still there this week — nothing more. It is a Must
because there is no product without an account, not because anyone wants it.

**Dependencies.** None. First thing built.

**Analytics.** `signup_started`, `magic_link_sent`, `magic_link_consumed`, `signup_completed`,
`login_completed`, `organisation_created`.

---

### WL-13 · Wage-determination corpus: ingestion and daily refresh — **L**

**Story.** As the product, I hold every active federal Davis-Bacon determination — 4,235 of
them, 54 states and territories, ~135,000 classification rows — with the WD number,
modification number, publication date and source URL on every single rate, refreshed daily.

**Value to Rosa.** This is the thing she is actually buying and the only part of the product
she can never build herself. Everything else is a form. Without it WageLens is a $99
spreadsheet template.

**Dependencies.** None — it is the other root of the tree. Built in parallel with WL-01.

**Analytics.** (Server-side, no user) `kb_ingest_started`, `kb_ingest_completed`,
`kb_determination_added`, `kb_modification_detected`, `kb_ingest_gate_failed`,
`kb_preflight_aborted`.

**Note.** KNOWLEDGE_BASE §2 is the verified source design. The whole national index is 3
requests and 3 seconds; the full text pull is ~24 minutes serial for ~73 MB. There is **no
bulk download** and **no API key**.

---

### WL-02 · Project setup with wage-determination lookup — **L**

**Story.** As Rosa, I add the Fort Cavazos job: state Texas, county Bell, construction type
Building. WageLens shows me the determinations that cover it, I pick the one my contract
names, and from then on every payroll for that project is tied to that determination and that
modification number.

**Value to Rosa.** Today this step is a 20-minute expedition through sam.gov's search UI,
performed once and then never re-checked. It is also where the expensive mistakes are made:
the wrong construction type, or last year's modification. Getting it right once, and having
the app remember it, is the difference between 45 correct payrolls and 45 wrong ones.

**Dependencies.** WL-01, WL-13.

**Analytics.** `project_created`, `wd_search_performed` (props: state, county, construction_type,
`result_count`), `wd_search_ambiguous` (props: `candidate_count`), `wd_pinned`
(props: wd_number, modification_number, `chosen_from_n`), `wd_search_zero_results`,
`wd_entered_by_number` (they typed the WD number from the contract instead of searching).

**The hard part, and why this is L not M.** KNOWLEDGE_BASE **F3**: 12.17% of
(state, county, construction type) combinations map to more than one active determination.
Harris County "Heavy" has three. The screen cannot promise one answer. It presents candidates,
shows what distinguishes them (county set, publication date, classification count), and makes
"enter the WD number from your contract" a first-class path — because the contract, not the
geography, is the authority (29 CFR 5.5(a)(1)(i)).

---

### WL-03 · Classification catalogue per determination — **M**

**Story.** As Rosa, I can see every labor classification on my project's determination with its
base rate and fringe, search it in plain words ("electrician", "backhoe", "helper"), and open
the verbatim determination text when the list does not answer my question.

**Value to Rosa.** She currently reads a 17,000-character text file in a browser tab, using
Ctrl-F, at 4pm on a Friday. A searchable, sorted list of 57 rows with rate and fringe in
columns is a real, felt improvement over that, and it is what makes the mapping in WL-04
possible at all.

**Dependencies.** WL-13, WL-02.

**Analytics.** `classification_catalogue_viewed`, `classification_searched` (props: `query`,
`result_count`), `classification_zero_results` (props: `query` — **this is the conformance
demand signal and the single most valuable event in the product**), `determination_text_opened`.

---

### WL-04 · Worker roster and classification mapping — **L**

**Story.** As Rosa, I add my crew once — first name, last name, middle initial, last four of
the SSN — and map each of them to a classification on this project's determination. When a
worker's actual duties match nothing on the determination, WageLens tells me plainly what that
means and walks me through preparing a conformance request.

**Value to Rosa.** Misclassification is the most common Davis-Bacon violation and the reason
back wages get assessed. Mapping the crew once and reusing it every week is where the 55
minutes per form actually goes. And the "nothing matches" moment is the one where a small sub
either guesses (and gets caught) or gives up (and files late).

**Dependencies.** WL-02, WL-03.

**Analytics.** `worker_added`, `worker_archived`, `classification_mapped`
(props: worker_id, wd_classification_id, base_rate, fringe_rate),
`classification_unmatched_declared`, `conformance_guide_opened`,
`conformance_worksheet_started`, `conformance_worksheet_completed`,
`conformance_worksheet_downloaded`.

**Two rules that are law, not preference.**
- **Last four digits of the SSN only.** 29 CFR 5.5(a)(3)(ii)(B) forbids the full SSN and the
  home address on the weekly transmittal. There is no column in the schema that can hold more.
- **The conformance path never proposes a classification and never proposes a rate.**
  29 CFR 5.5(a)(1)(iii)(B): *"The conformance process may not be used to split, subdivide, or
  otherwise avoid application of classifications listed in the wage determination."* Nine times
  in ten the right answer is a classification that is already on the determination and the user
  has not found it. So the flow is: search harder → show the verbatim text → *then*
  explain conformance, its three criteria, its 30-day window, and that it is filed **by the
  contracting agency** to **DBAConformance@dol.gov**, not by us and not by them.

---

### WL-05 · Weekly hours entry grid — **L**

**Story.** As Rosa, I open the week ending 6 December, click "copy last week", correct the
three people whose hours changed, and tab through the grid without touching the mouse.

**Value to Rosa.** This is the 41 hours a year. Seven day-columns × straight time and overtime
× twelve workers is 168 numbers a week, currently retyped from paper into a spreadsheet whose
formulas someone's nephew wrote. Copy-last-week plus keyboard navigation is the single largest
time saving in the product and the reason week 2 is faster than week 1 — which is the reason
the subscription survives to month 2.

**Dependencies.** WL-04.

**Analytics.** `payroll_created`, `payroll_copied_from_last_week` (props: `lines_copied`),
`hours_grid_opened`, `hours_saved` (props: `worker_count`, `total_st_hours`, `total_ot_hours`),
`no_work_performed_filed`, `payroll_validation_failed` (props: `rule_id`),
`payroll_certified` (props: payroll_number, worker_count).

**The two things that must be right.**
- **"No work performed" weeks.** A covered week with no hours still consumes a payroll number
  and still gets filed. Missing weeks are the most common reason a GC withholds a payment, and
  a numbered gap is what an auditor looks for first.
- **Overtime is CWHSSA, and it is separate from the base rate.** The grid keeps ST and OT
  rows separately because column (5), (6A) and the whole compliance question depend on it.

---

### WL-06 · WH-347 and Statement of Compliance generation — **L**

**Story.** As Rosa, I click "Generate", check the preview, type my name and title, sign, and
download two PDFs that look like the DOL form and say exactly what the DOL form says.

**Value to Rosa.** This is the deliverable. Everything upstream is scaffolding. She emails these
two PDFs to the GC's compliance person and gets paid.

**Dependencies.** WL-05.

**Analytics.** `wh347_generated` (**the activation event** — props: payroll_id, worker_count,
page_count, wd_number, modification_number), `soc_generated`, `wh347_downloaded`,
`wh347_regenerated`, `wh347_generation_failed` (props: `reason`).

**Why this is L and not M.** KNOWLEDGE_BASE **F2**: the official WH-347 (Rev. January 2025,
OMB 1235-0008) is a **flat PDF with zero form fields**. There is nothing to fill. The form is
generated from scratch — 50 named fields, an 8-row grid, a 7×2 hours sub-grid per worker,
continuation pages, and the Statement of Compliance wording reproduced **verbatim** because
29 CFR 5.5(a)(3)(ii) accepts page 2 of the WH-347 "or another document with identical wording"
and nothing else. That wording is a constant in the codebase behind a byte-equality test
(gate G5), not template copy.

---

### WL-07 · Payroll history and export — **S**

**Story.** As Rosa, I can see every payroll I have filed on this project, in order, with its
number, its week, its status and its two PDFs — and download the lot as a CSV when the auditor
asks.

**Value to Rosa.** Three reasons it is Must and not Should, despite being unglamorous:
(1) `Certified Payroll No.` is a **sequential integer with no gaps** — the app cannot produce
payroll #8 without knowing #7 exists; (2) 29 CFR 5.5(a)(3)(i)(A) and (a)(3)(ii)(G) require
**three years of retention** after the prime contract completes, and a tool that loses last
month's payroll is worse than the spreadsheet it replaced; (3) an audit request is the moment
the subscription proves itself, and it arrives without warning.

**Dependencies.** WL-06.

**Analytics.** `payroll_history_viewed`, `payroll_reopened`, `payroll_export_downloaded`
(props: `format`, `payroll_count`).

---

### WL-08 · Determination-change alerts — **M**

**Story.** As Rosa, when DOL publishes modification 2 to the determination my project is pinned
to, I get an email that tells me what changed, which of my workers it affects and by how much,
and I decide whether to move the project onto it.

**Value to Rosa.** Mid-project modifications are the trap that creates real liability, because
nobody re-reads the determination once the job has started. It is also the reason to keep
paying between jobs — the one feature whose value accrues when she is *not* using the product.

**Dependencies.** WL-13, WL-02.

**Analytics.** `wd_modification_detected` (server), `wd_modification_alert_sent`
(props: project_id, from_mod, to_mod, `affected_worker_count`),
`wd_modification_alert_opened`, `wd_modification_accepted`, `wd_modification_dismissed`.

**Scoped ruthlessly.** Email only — no SMS, no in-app inbox, no digest, no Slack. One email
per project per modification, with a diff of the classifications this project actually uses.
**The app never re-rates a certified payroll and never moves a project's pin by itself.** A
certified payroll is a signed federal statement; silently changing the rates behind one is a
false certification under 18 U.S.C. § 1001.

**An honest flag.** The index shows 3,377 of 4,235 determinations sitting at modification 1
and only **110 above modification 2**. Mid-project changes may be **rarer than the pitch
implies**. WL-08 ships in the MVP because it is cheap once WL-13 is versioned, but
`wd_modification_alert_sent` per project per year is on the THRESHOLDS watch list, and if it
comes in under 0.2 the marketing claim moves before the feature does.

---

### WL-09 · Billing: trial, subscription, portal — **M**

**Story.** As Rosa, I start a 14-day trial with a card on file, and if I do nothing I am
charged $99 on day 15 and can cancel myself from a settings link at any time.

**Value to Rosa.** She needs to try it against a real deadline before she trusts it — one
payroll cycle is 7 days, so a 14-day trial covers two. **Card up front**, because Poyar /
ProductLed / ChartMogul (n≈200 B2B products, Jan 2026) put credit-card trials at 25–35%
free-to-paid against 4–6% without, and because a compliance tool bought on a Friday deadline is
not an impulse that needs protecting from itself.

**Dependencies.** WL-01. Stripe Checkout + Portal + webhook-as-truth, per PLAN D2 and
Clausewright's ADR-007 pattern: **the webhook, not the redirect, is what activates a subscription**.

**Analytics.** `pricing_viewed`, `trial_started` (props: plan), `checkout_started`,
`checkout_completed`, `subscription_activated` (props: plan, mrr_cents),
`subscription_payment_failed`, `subscription_cancelled` (props: `reason`, `days_active`,
`payrolls_generated`), `portal_opened`.

**Prices at launch — owned by [`OFFER.md`](OFFER.md) §6 and §10, reconciled here 2026-09-03**
(founder confirms before Stripe goes live, per PLAN A5/D2): **Crew $79/mo · $790/yr** (≤3
projects, ≤15 workers), **Shop $99/mo · $990/yr** (the ICP, recommended, unlimited projects,
≤100 workers), **GC Roll-up $299/mo · $2,990/yr** (created and priced publicly at launch;
**sellable only when WL-24 ships**). 14-day trial, **card required**, on every price. No metered
component, no setup fee, no free tier — the free thing is WL-00, and it is outside billing
entirely.

---

### WL-10 · Settings — **S**

**Story.** As Rosa, I can fix the company name and address that print on every form, set the
default certifying official, manage fringe benefit plans and apprenticeship programs, and see
my subscription.

**Value to Rosa.** The business name and address print on **every page of every form**. Getting
them wrong once means reissuing months of payrolls. Fringe plans and apprenticeship programs
are here rather than in the payroll flow because they are stable facts about the company that
page 2 of the WH-347 demands per worker — entering them weekly would be the fastest way to make
week 2 slower than week 1.

**Dependencies.** WL-01.

**Analytics.** `settings_viewed`, `organisation_updated`, `certifying_official_set`,
`fringe_plan_created`, `apprenticeship_program_created`.

---

### WL-11 · Help, disclaimers and legal pages — **S**

**Story.** As Rosa, when I am stuck at 4pm on a Friday I find a plain-English answer in the
product, and I can see exactly where every number came from.

**Value to Rosa.** She is signing a federal statement with criminal exposure attached
(18 U.S.C. § 1001, printed on the form itself). She will not sign what she does not understand,
and there is no human to ask. Six pages carry the MVP: what a certified payroll is; how to find
your wage determination number; how to choose a classification; what to do when nothing matches;
what "no work performed" weeks are; what WageLens does not do.

**Value to us.** KNOWLEDGE_BASE §9 is a legal requirement (PLAN A10), and gate **G8** makes it
structural: the component that renders a rate *is* the component that renders its provenance,
so a rate cannot appear on any screen or document without its WD number, modification number
and source link.

**Dependencies.** None. Written alongside everything else.

**Analytics.** `help_article_viewed` (props: slug), `disclaimer_expanded`,
`official_determination_link_clicked` (props: wd_number).

---

### WL-12 · Admin metrics — **S**

**Story.** As the founder, one page tells me signups, activations, trial conversions, MRR,
churn and corpus health, from our own `events` table.

**Value.** [`THRESHOLDS.md`](THRESHOLDS.md) commits to numbers evaluated at n ≥ 100 signups.
Without this page those commitments are unevaluable and the stop/iterate decision gets made on
feeling. PLAN A14 also forbids depending on a third party for it.

**Dependencies.** All. Ships last, before launch, not after.

**Analytics.** Reads them; emits `admin_metrics_viewed`.

**Contents.** The four funnel steps (signup → project created → payroll certified →
**wh347_generated**), trial→paid, MRR, logo churn, median days signup→activation, active
projects, payrolls per active org per week, **corpus age** (oldest `last_verified`), last
ingest run status, and the `classification_zero_results` query log.

---

## 2. Should — first month after launch

Ordered by expected effect on retention, which is the only thing that matters in month one.

| id | item | effort | why it is not Must | trigger to build it |
|---|---|---|---|---|
| **WL-24** | **GC roll-up tier ($299/mo · $2,990/yr)**: invite subcontractors, see every sub's payroll status per project, chase missing weeks, export the pack | **L** | see the argument below | 3 paying subs on one GC's project, or 5 inbound GC requests |
| WL-15 | Import hours from a CSV / payroll-provider export (QuickBooks, ADP, Paychex time exports) | M | Rosa's hours come off **paper time cards**; a CSV importer solves a problem the 12-person sub does not have. It is the 40-person sub's problem. | 20% of orgs have >25 workers, or `hours_saved.worker_count` p90 > 25 |
| WL-16 | Pre-submission validation report: rate below determination, missing day, OT under 40 hours, deduction exceeding gross, worker on two projects same day | M | The MVP blocks the errors that make the *form* invalid. This catches the errors that make the *payroll* wrong — higher value, but needs real payrolls to know which checks fire | 200 certified payrolls in the corpus of real use |
| WL-17 | Weekly reminder email: "payroll #8 for Fort Cavazos is due" | S | A reminder for a product they have not yet made a habit of is noise. After activation it is the cheapest retention lever there is | first 25 activated orgs |
| WL-18 | Email the WH-347 straight to the GC / awarding agency from the app, with a delivery record | S | Downloading and attaching works. The delivery *record* is what she actually wants — proof she filed on time | 3 support conversations about "they say they never got it" |
| WL-19 | Apprentice handling: registered ratio, percentage-of-journeyman rate schedule, automatic page-2 apprenticeship block | M | MVP takes the apprentice rate as typed and prints the program details from settings. Correct, just manual | 15% of payroll lines marked `RA` |
| WL-20 | Fringe annualisation calculator (the 29 CFR 5.28 hourly-credit computation) | M | MVP takes the hourly credit as typed. Computing it is genuinely hard and genuinely valuable — and getting it wrong is worse than not offering it | 5 requests, or the first support ticket that turns out to be an annualisation error |
| WL-21 | Multi-project worker allocation: one worker on two projects in one week, splitting 7A from 7B automatically | M | MVP has both columns and Rosa types both. Automating it needs cross-project hours, which needs projects to overlap | 10% of workers appear on >1 active project |
| WL-22 | Deduction templates per worker (garnishments, union dues, advances that repeat weekly) | S | Copy-last-week already carries deductions forward. Templates are the tidier version of a solved problem | 5 requests |
| WL-23 | Onboarding checklist and lifecycle emails (day 1 / 3 / 10) | S | Wave 3 owns lifecycle (PLAN §5). Listed here so it is not lost | wave 3 |

### Why the GC tier (WL-24) is Should, not Must — and the one MVP concession it gets

**The argument for Must is real.** 29 CFR 5.5(a)(3)(ii)(A), verified verbatim at eCFR:
*"The prime contractor is responsible for the submission of all certified payrolls by all
subcontractors."* The 2023 DBA rule pushed that liability down the chain. The GC has more
money, more pain and more urgency than the sub. Our own prospect list's largest single segment
is **1,856 commercial and institutional building general contractors**. $299 is 3× the ARPU.

**The argument against Must is stronger, and it is a cold-start argument.** The GC tier's
value is *other people's payrolls*. On day one there are none. A GC invited to a roll-up
dashboard with zero subs on it sees an empty table and churns — and we will have spent the
MVP's largest L on an org-to-org invitation model, a permissions matrix, a review-and-reject
workflow and a nagging engine, none of which the sub tier needs, all of which delay the day a
stranger can pay us. The sub tier has **no cold start**: Rosa gets value from her own first
payroll, alone, in one sitting.

**The concession.** The MVP data model is built so that WL-24 is *additive*, not a migration:
`payrolls` carries `filer_organisation_id` distinct from `project.organisation_id`, projects
carry `prime_contractor_name` and `our_role ∈ {prime, sub}` (both are WH-347 header fields
anyway), and `documents` are addressable by a signed, expiring URL from day one. Building the
GC tier later then costs an invitation flow and a dashboard — not a rewrite. **This concession
is in the MVP; the tier is not.** The $299 price is published from launch so the ladder is
legible and so a GC who asks can be waitlisted rather than lost.

---

## 3. Later

| id | item | why later |
|---|---|---|
| WL-30 | **State prevailing wage**, California and Washington first, then the ten in KNOWLEDGE_BASE §8 | The largest expansion and the largest risk. Each state is a separate corpus *and* a separate form. Only after the federal corpus has survived 90 days of gates |
| WL-31 | Generate a completed **SF-1444** | Its field list is `UNVERIFIED` (KNOWLEDGE_BASE KB-10 — gsa.gov 403s this environment). And the form is submitted *by the contracting agency*, so a filled PDF saves less than the worksheet WL-04 already produces |
| WL-32 | **Conformance precedent library**: approved conformances by trade and region | The moat the ideation documents claimed. It needs a source; WHD does not publish conformance decisions in bulk. Revisit after 50 customers have run conformances through us |
| WL-33 | **Historical determination archive**: "what did TX20260253 say on 12 March?" | We already store it (every modification is retained immutably). This is a screen, not a data problem. Sells to an auditor, not to Rosa |
| WL-34 | Accounting integrations: QuickBooks Desktop/Online, Sage 100 Contractor, Foundation | The right integration is unknowable before we see what customers use. Ask, then build one |
| WL-35 | **Service Contract Act** determinations (SF-98/SCA) | The same SAM.gov index carries them (`index=wd` returns SCA and CBA records). Different buyer, different form (WH-1735), different sales motion |
| WL-36 | Bid mode: labour burden by classification for estimating a job before winning it | A genuinely different job-to-be-done, and a plausible second product. Not the weekly habit |
| WL-37 | Multiple users, roles and permissions | Rosa is the only user at a 12-person sub. Needed the moment WL-24 ships, and not before |

---

## 4. Never — and why

| item | why never |
|---|---|
| **Running payroll — calculating taxes, moving money, filing 941s** | It is a different company. It needs money transmission, tax-filing registrations in 50 states, and an errors-and-omissions posture we will not have. WageLens takes payroll **as an input** and always will. It is also the honest answer to "why are you cheaper than eBacon": we do less. |
| **Time tracking, GPS clock-in, a field app** | A crowded, well-funded category, a daily habit we would have to win from a phone, and a completely different buyer inside the same company. Rosa already has time cards. |
| **Storing a full Social Security number or a home address** | 29 CFR 5.5(a)(3)(ii)(B) says the weekly transmittal carries the **last four digits** and no address. There is no schema column that can hold more, and gate G7 is a test that asserts it. Holding data we are forbidden to transmit is pure liability with no product upside. |
| **Submitting to LCPtracker / eCPR / B2Gnow on the customer's behalf using their credentials** | Taking a customer's login to a system that holds their compliance record makes us the weakest link in their audit trail, and every portal's terms forbid it. We produce the document; they submit it. (Same principle as Clausewright's I4.) |
| **An AI that chooses the labor classification** | This is the single decision the customer is legally responsible for and the one that generates back-wage liability. A model that is right 95% of the time is wrong on one worker in twenty, on a signed federal statement, with our name on the screen when it happens. We show the determination's own classifications and its own words, and the human chooses. **The absence of this feature is a selling point**, and it is the honest version of what the ideation documents called an "AI classification assistant". |
| **A free tier** | The buyer is a business with a legal deadline and a held progress payment, not a hobbyist. A free tier attracts people who will never pay, adds a support burden, and — per the benchmark in WL-09 — trades a 25–35% conversion for a 3–5% one. A 14-day card-on-file trial is the free tier. |
| **Native mobile apps** | Certified payroll is done at a desk with a keyboard, from paper time cards, in a spreadsheet-shaped grid. A responsive web app that works on a laptop is the correct and complete answer. |
| **Union fringe benefit fund remittance and reporting** | A real, painful, adjacent job — and a different regulatory surface, different counterparties (the funds), and money movement again. Refer out. |
| **Publishing a "compliance guarantee" or a penalty-avoidance promise** | We cannot control what the customer types into column (3). A guarantee here creates the exact liability the disclaimers exist to avoid. (PLAN A5: guarantees are the founder's to own; this one should not exist at all.) |
| **Quoting "$13,508 per violation"** | It is in `phase-1-ideation/shortlist.json` and it does not survive verification: DOL's own civil money penalty table contains no Davis-Bacon civil money penalty (Buyer & Identity agent, `identity/CLAUDE.md` V1). Use withheld contract funds, back wages plus interest, CWHSSA liquidated damages of $33 per worker per day, and **three-year debarment** (29 CFR 5.12(a)(1)) — all of which are real and all of which are worse. |

---

## 5. Self-review — "would a stranger pay without it?"

Run against every Must item after writing the specs. Three survived a challenge; the rest were
never in doubt.

| item | challenge | verdict |
|---|---|---|
| WL-07 history | "Isn't a list of PDFs a Should?" | **Must.** The sequential payroll number is *state* the app must own — it cannot print #8 without knowing #7 exists — and 29 CFR 5.5(a)(3) requires three-year retention. It is Must for a mechanical reason, not a nice-to-have reason. |
| WL-08 alerts | "3,377 of 4,235 determinations have never been modified past mod 1. Is anyone alerted, ever?" | **Must, but flagged.** It is nearly free once WL-13 is versioned (one query per pinned pair), it is the only feature that earns money in a month with no payrolls, and it is the differentiator against the $49 form-fillers. But `alerts per project per year` goes on the THRESHOLDS watch list, and the marketing claim moves before the feature does if it comes in under 0.2. |
| WL-12 admin metrics | "Nobody pays for the founder's dashboard." | **Must.** Not for the stranger — for THRESHOLDS. A pre-committed stop/iterate decision that cannot be evaluated is not a commitment, it is a wish. Kept at S: one page, our own `events` table, no charting library. |
| WL-24 GC tier | "$299 versus $99, and 1,856 GCs in the prospect list. Argue it into MVP." | **Should.** Cold start. Argued in full in §2. The MVP pays the small structural price that makes it additive later. |

**What was cut from the Must list during this review:** a saved-classification-mapping
"library" across projects (Should — mapping is per determination, and reuse across projects is
only safe when the determinations match); an in-app determination diff viewer (the alert email
carries the diff; the viewer is Later); CSV import (Should, WL-15); and a "compliance score"
dashboard, which was cut permanently for being a number we would have to defend.
