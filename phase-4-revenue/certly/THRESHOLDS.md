# Certly — pre-committed thresholds

**Owner:** Product Owner agent. **Date committed:** 2026-09-03, **before any traffic**, which is the
only time a threshold means anything.
**Evaluation trigger:** the first cohort window in which **n ≥ 100 signups** has completed month 2.
**Instrument:** `/admin` (spec M14). Every rate below is reported with its denominator or not at all.
**Event names:** every event named in this file is registered in
[`specs/00-event-vocabulary.md`](specs/00-event-vocabulary.md), which is the single source; the
`events:check` CI rule fails the build on a name that does not resolve there (REVIEW.md B-14).

Three bands, and the middle one has a rule attached so it cannot become a permanent home:

| band | what it means | what we do |
|---|---|---|
| **PERSEVERE** | the loop works | keep building; the Should list opens |
| **ITERATE** | one identified thing is broken | **one variable per round, max three rounds**, each round a new cohort of ≥ 100. Three rounds without reaching PERSEVERE on that metric = STOP |
| **STOP** | the thesis is wrong at this price, for this buyer | write the post-mortem, hand the corpus and the KB to the next idea, do not "give it one more month" |

Only the **primary metrics (§1–§4)** can trigger STOP on their own. §5–§7 inform the decision; they
never override it.

---

## §1 Activation — signup → first certificate extracted and compared

**Definition** — `specs/11` §2 is canonical and is the **only** definition of activation in the folder
(REVIEW.md B-05, §2.3): an org where at least one `comparisons` row exists against a certificate
**the org uploaded**, with the extraction out of `needs_review`. Emitted once per org, by the
comparison job, never by the UI. The event is **`activated`**.

Two rival definitions are retired: `OFFER.md` §9's four conditions (renamed the **trial health
checklist**, because one of them required a gap to *exist*, which would make a clean portfolio a
failed activation and a self-inflicted STOP) and `UX.md`'s `first_status_rendered` (a UI event).

| band | rate | median time to activate |
|---|---|---|
| **PERSEVERE** | **≥ 40%** | ≤ 30 minutes |
| **ITERATE** | 25–39% | ≤ 24 hours |
| **STOP** | **< 25%** | — |

**Why 40%.** Activation here demands more than a click: the customer must have a real certificate to
hand and be willing to put a supplier's document into a tool they met ten minutes ago. That is a
higher bar than a typical self-serve product's "created a project". But it is also a *low* bar for
someone with the actual problem — a manager with a folder of COIs has one open in another tab. Below
25%, the honest reading is not that onboarding is clumsy; it is that the people signing up do not have
the pain badly enough to spend three minutes on it, and that is a targeting failure no UI fixes.

**If ITERATE, the diagnostic is already built:** `onboarding_step_abandoned{step}` names the step. One
round changes one step. Expected culprits, in order: step 5 (no certificate to hand — the
"email yourself a link" escape must be measured, M11 §9), step 4 (vendor entry), step 3 (requirement
templates too heavy for a first session).

**Onboarding is not gated on a card.** An org with no subscription may reach activation on the free
allowance (25 vendors, 3 documents — `specs/10` §8.1); Checkout is offered at the finding screen,
after the customer has seen a real gap. A card gate before activation would put the trial in front of
the value and make this threshold measure the paywall rather than the product (REVIEW.md MJ-10).

---

## §2 Month-2 retention

**Definition:** of orgs that **paid** in month 1, the share whose dashboard was opened in **≥ 2 distinct
weeks** of month 2 (M6 §10) **and** whose subscription is still `active` at the end of month 2. Both
conditions, because a subscription nobody opens is a refund waiting to happen.

| band | rate |
|---|---|
| **PERSEVERE** | **≥ 85%** |
| **ITERATE** | 70–84% |
| **STOP** | **< 70%** |

**Why 85%.** Certly is a compliance system of record. Once vendors, requirements and certificates are
in it, leaving costs the customer their data and their reminder schedule; retention should look like
infrastructure, not like a content subscription. **85% monthly logo retention is 1/0.15 ≈ 6.7 months
of expected life — at $99 that is ≈ $660 of gross revenue per customer**, which only supports
acquisition if CAC stays low, which is exactly what the outbound-only plan assumes. *(An earlier
draft said "~7.5 months … roughly $740"; 7.5 months is 1/0.133, i.e. 86.7% retention, not 85%. The
arithmetic is corrected rather than the rounding excused — REVIEW.md MN-06.)*

**Below 70% the diagnosis is unambiguous and it is not "churn":** the product is a *one-time audit*
that people run once and abandon. If that is what the data says, the honest response is not more
retention features — it is to reprice as a one-off audit, or to stop. The feature that must be working
before we blame anything else is **M7 reminders**: `renewal_received_after_reminder` is the only
recurring reason to keep paying. If reminders are firing and renewals are arriving and people still
leave, the product is not the problem — the price is.

---

## §3 Activation → paid

**Definition:** of activated orgs, the share that reach **`trial_converted`** — the first `invoice.paid`
— within 45 days of activation.

**Read the definition twice.** `OFFER.md` §9 commits to a **card-required** 14-day trial, so
`checkout_started` and `checkout_completed` mean *a card is on file*, not *money changed hands*. This
threshold is measured on `trial_converted`. A card-required trial that everybody cancels on day 13 is
not a conversion, and measuring the card would flatter us into shipping a broken business.

| band | rate | implied signup → paid |
|---|---|---|
| **PERSEVERE** | **≥ 25%** | ≥ 10% |
| **ITERATE** | 12–24% | 5–9% |
| **STOP** | **< 12%** | < 5% |

**Why 25%, and why this is the threshold most likely to fail.** An activated org has seen a real gap in
a real document — the dossier's whole close — and has already given us a card to start the trial.
`OFFER.md` §9 cites card-required trials converting at **~30%** against a category free-to-paid median
of **8%**; 25% of *activated* orgs is therefore a deliberately conservative reading of that evidence,
not an optimistic one.

**But this is where the competitive finding bites** (`BACKLOG.md` §0): TrackMyVendor sells a
feature-comparable product at **$39/mo** with a free tier at 25 vendors, and bcs at **$0.95/vendor/mo**
with a free tier. If activation is strong (§1 PERSEVERE) and retention is strong (§2 PERSEVERE) and
**only this metric fails**, the conclusion is a **price** conclusion, not a product one, and the
iteration is explicit and pre-committed:

- **Round 1:** hold the product, test **$49 Starter** against $99 on a new cohort of ≥ 100. If
  activation→paid clears 25% at $49, the market is priced and we know the ceiling.
- **Round 2:** if $49 also fails, test the **annual-first** presentation ($490/yr) — a different
  commitment shape, not a different price.
- **Round 3:** if both fail, STOP. A product nobody pays $49 for after seeing their own expired policy
  is not a pricing problem.

**We do not add a free tier as a response.** `BACKLOG.md` N12 explains why: every document costs a real
model call, free users upload the messiest documents, and a free tier that fixes conversion by removing
revenue has not fixed anything.

---

## §4 Extraction field accuracy — the ship gate

Two different measurements, both required, and they are not interchangeable.

### 4.1 Golden set — the CI gate, blocking, pre-launch and on every commit

Measured on the **17 real fixtures G1–G17** listed in `specs/03` §15 — sixteen in
`kb-samples/certificates/` plus **E1** in `kb-samples/endorsements/`, which this file previously
counted without saying so. Reported as a per-field table; **never averaged into one number**.

| measure | ship | block |
|---|---|---|
| **Critical fields exact** — `policy_exp`, `each_occurrence`, `general_aggregate`, `insured.name`, `addl_insd`, `subr_wvd` | **at most `N_ship` wrong out of `D`** (≥ 97%) | more than `N_block` wrong (< 95%) |
| **All fields** | **≥ 92%**, per field, each with its own denominator | < 88% |
| Regression on any previously-correct critical field | **zero tolerance** | any |
| Rejection tests (ACORD 27, empty, oversized) | 3/3 | any failure |
| Injection test | pass | any failure |
| No fixture's `producer.contact_name` appears in any output (`specs/03` §15.3) | pass | any failure |

> **`D`, `N_ship` and `N_block` do not exist yet, and neither does the golden set** (REVIEW.md MJ-01,
> MJ-02). **No expected-value JSON has been written for any fixture, so this gate is currently
> unrunnable**, and hand-labelling 17 documents × ~40 fields is a **two-day wave-2 task with a named
> owner** that gates everything else in M4. It is the single longest serial dependency in the build.

**Why a count and not a percentage.** The earlier version of this section said *"16 fixtures × 6
critical fields ≈ 96 critical values; 97% is roughly 'at most three wrong'"* — an estimate presented
as arithmetic. It is wrong in both directions: four corpus documents are guidance PDFs with one
embedded certificate, several fixtures have no `ADDL INSD` or `SUBR WVD` tick at all, G17 is a blank
form, and the former G3/G8 were the same document counted twice. **A critical value is in the
denominator only if it is printed on the document.** `D` is therefore computed from the
expected-value files, published in `specs/03` §15.1 with its date, and the gate is stated as
**"at most N wrong out of D"** — the same discipline `BACKLOG.md` N10 applies outwards, applied
inwards.

**Why ~97% and not 99%.** Demanding 99% on a set this size is demanding zero errors, which is not a
threshold — it is overfitting to seventeen documents. Below 95% the product's central claim is
unreliable. The set grows with every customer document that exposes a new layout (KB §E), and the
gate rises with it.

**`policy_exp` is the field the entire product turns on.** A wrong expiry means a reminder ladder
scheduled against a date that does not exist, and a vendor shown as meeting requirements while lapsed. It is the field
most worth a separate eye in every review.

### 4.2 Live — real documents, real corrections

| measure | source | PERSEVERE | ITERATE | STOP |
|---|---|---|---|---|
| **Confident-wrong rate** — promoted without review, later corrected on a critical field | M14 §3.2 | **≤ 2%** | 2–5% | **> 5%** |
| Review rate — `needs_review` ÷ extracted | M14 §3.2 | ≤ 30% | 30–50% | > 50% |
| Correction rate on `policy_exp` | M14 §3.2 | ≤ 3% | 3–8% | > 8% |

**Why confident-wrong is the one that can stop the product.** A document that goes to review and is
corrected is the system working. A document promoted with high confidence whose expiry was wrong is the
system lying, and a compliance tool that lies confidently is worse than a spreadsheet — the customer
had a spreadsheet and knew not to trust it. Above 5%, τ is wrong or the model is wrong, and shipping
past that is a decision to sell false comfort, which is the exact thing `BACKLOG.md` §0 D1 says we exist
to correct.

**Review rate above 50% is a different failure:** the product has become a data-entry job with extra
steps, and nobody renews.

---

## §5 Unit economics — informative, not a stop condition

| measure | modelled 2026-09-03 | measured by |
|---|---|---|
| Model cost per document | **$0.10–$0.20** | `extraction_succeeded.cost_cents`, real `usage` |
| Documents per paying org per month | ~12 (50 vendors × ~2 certs/yr ÷ 12, plus re-uploads) | `coi_uploaded` |
| Model cost per paying org per month | **$1.20–$2.40** | derived |
| Gross margin at $99 Starter | **> 95%** before fixed costs | derived |

**The arithmetic behind the modelled figure, so it can be checked and falsified:** a two-page
certificate is roughly 4,000 text tokens plus per-page image tokens plus a ~1,500-token cached system
prefix — call it ~8,500 input tokens; the structured record with a `source_text` span per field is
~2,500 output tokens including adaptive thinking. On `claude-opus-5` at **$5/MTok input, $25/MTok
output** (verified 2026-09-03) that is ≈ $0.04 + $0.06 ≈ **$0.10**, doubling for a dense or multi-page
document.

**`H-EC-1`: this is modelled from list pricing, not measured.** It is retired by the first 100 real
`extraction_succeeded.cost_cents` values. Cost is not a stop condition at these magnitudes — a 3×
overrun still leaves >90% gross margin — but a **10×** overrun (a $1+ document) means the prompt or the
page handling is wrong, and that is a build bug, not an economics finding.

**Batch API (50% off) is available for backfills and bulk imports** and is specified for exactly that
in spec 03 §5. Interactive uploads never batch.

**The one place cost *can* stop something: the Free Gap Report (M15).** It spends inference on
anonymous traffic. §5's own per-document figure implies **$2.50–5.00 for a full 25-document report**,
not the ~$0.50 an earlier draft of `OFFER.md` §4 assumed; `OFFER.md` now carries the higher figure so
the founder is not surprised (REVIEW.md OQ-8). M15 §11 holds the downside with rate limits, the Batch
API and a **daily spend cap that disables new sessions** rather than overspending silently — a
**launch requirement, not a nice-to-have**. `gap_report_ready.cost_cents` (one name, everywhere —
REVIEW.md MN-01) retires the disagreement in week one, and the founder then decides whether 25
documents is the right free cap. Even at $0.20 per document, gross margin at $99 stays above 95%.

---

## §6 Leading indicators — watched weekly from day one, no bands

These do not decide anything on their own. They are what makes an ITERATE round choose the right
variable instead of guessing.

| indicator | event | what it tells us |
|---|---|---|
| **Free Gap Report findings** | `gap_report_ready.expired_found` (M15) | **the earliest and cleanest test of `H-GTM-1`** — strangers' real documents, in week one. If the median free report finds zero expired policies, the dossier's close is false and outbound must be rewritten before the first batch is sent |
| Free-report → signup | `gap_report_cta_clicked` → `gap_report_converted` | the offer's front-end-to-core conversion; the landing page's whole job |
| Gaps found in the first audit | `activated.gaps_found` | **tests the entire go-to-market claim.** The dossier says a free audit "reliably surfaces an already-expired policy". If the median new org finds **zero** gaps, outbound's core promise is false and the sequences must be rewritten in week one, not month three |
| `asserted_only_detected` rate | M5 | whether differentiator **D1** exists in real documents or only in our reading of the form |
| `template_source_opened` | M2 | whether **D3** (sourced templates) is product or marketing. If nobody clicks a source, we stop paying for the sourcing discipline in the UI — though not in the KB |
| `report_share_opened` by non-users | M12 | the closest thing to a viral coefficient this product has, and the leading indicator for **D2** |
| **Gap-report documents we could not compare** | `gap_report_ready.needs_review ÷ .documents` (M15) | the honesty tax on the free report, and the earliest real read on `needs_review` rate outside our own corpus. Above ~30% the free report is telling strangers more about our uncertainty than about their portfolio, and τ or the prompt is the variable to change (`specs/15` §4.1) |
| `upload_link_opened → vendor_upload_completed` | M8 | the chase conversion rate. If low, M7 is theatre |
| `renewal_received_after_reminder` | M7 | the retention argument, in facts |
| `csv_columns_mapped.auto_accepted` | M3 | below ~70%, the column mapper is the activation bottleneck |
| Accuracy grouped by `documents.pdfProducer` | M14 | resolves `H-KB-1` — whether AMS/renderer layout variants are real |

---

## §7 Hypotheses, labelled

Written down so that absence of evidence is not later mistaken for evidence, and so a wave-2 engineer
knows which numbers are load-bearing and which are placeholders.

| # | hypothesis | status | retired by |
|---|---|---|---|
| **H-1** | Small PMs and GCs will put a supplier's insurance document into a tool they met ten minutes ago | **untested; the riskiest assumption in the product** | §1 activation |
| **H-2** | The three-state truth (`asserted_only`) is a differentiator customers *value*, not merely one that is *correct* | untested | §6 `asserted_only_detected` + qualitative replies |
| **H-3** | $99 clears against a $39 self-serve incumbent because the buyer is not price-shopping a category they do not know exists | **untested and directly challenged by the 2026-09-03 pricing scan** | §3, with the pre-committed $49 test |
| **H-4** | Reminders convert into renewals often enough to justify a monthly subscription | untested | §6 `renewal_received_after_reminder`, §2 |
| **H-EX-1** | `claude-opus-5` clears the §4.1 gate on ACORD 25 extraction | untested until the golden set runs | CI, pre-launch |
| **H-EX-2** | τ = 0.85 bounds confident-wrong at ≤ 2% | **a chosen opening value, not a measured one** | §4.2, re-derived from the first 200 labelled documents |
| **H-KB-1** | Agency-management-system layout variants are real and material | **`UNVERIFIED` — no public specimen output exists** (KB §A.4) | accuracy grouped by `pdfProducer` over the first 1,000 documents |
| **H-KB-2** | The PM/HOA templates (`confidence: medium`, one source each) are close enough to real practice that customers edit rather than replace them | untested | `requirement_edited` rate on template-derived rows; > 60% edited means the templates are decoration |
| **H-EC-1** | $0.10–0.20 per document | modelled from list pricing; **`OFFER.md` §4 independently assumes ~$0.02, a 5–10× disagreement** | §5, first 100 measured documents — and the M15 spend cap holds the downside until then |
| **H-OF-1** | A card-required 14-day trial converts better here than a no-card one, as `OFFER.md` §9's sources say it does generally | untested for this buyer | §3, and the **`checkout_completed` → `trial_converted` gap** (trial cancellation) as the counter-signal, rendered next to the threshold in `specs/14` §3.1 |
| **H-GTM-1** | The free COI audit reliably finds an already-expired policy | **the dossier asserts it; nothing verifies it** | §6 `activated.gaps_found` |

---

## §8 How this is evaluated, so it cannot be evaluated conveniently

1. **The cohort is fixed before it is read.** The window is the first calendar week in which cumulative
   signups reach 100, plus its month-2 tail. No re-slicing after seeing the numbers.
2. **Every rate is reported with n.** Any denominator under 30 is reported as "n too small" and cannot
   trigger any band (M14 §6).
3. **One variable per ITERATE round**, a new cohort each round, at most three rounds per metric
   (PIPELINE stage 6).
4. **Internal orgs are excluded by a visible flag**, so the exclusion itself is auditable.
5. **A STOP is written up** — what was believed, what was measured, what the corpus and knowledge base
   are worth to the next idea — and it is not reopened by a good week.
6. **A metric with no instrument does not exist.** Every threshold above names the event or table it
   reads. If M14 cannot render it, it is not a threshold, it is an opinion.
