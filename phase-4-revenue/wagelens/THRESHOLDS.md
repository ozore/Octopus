# WageLens — Thresholds

**Pre-committed numbers. Written 2026-09-03, before a single signup, so that the decision is
made by evidence and not by attachment.**

Author: Product Owner agent (WageLens), wave 1. Evaluated from
[`specs/WL-12-admin-metrics.md`](specs/WL-12-admin-metrics.md), which is a Must item precisely
so that this document is evaluable.

---

## 0. The rules of this document

1. **Evaluation point: n ≥ 100 `signup_completed`**, or **120 days after the first cold email**,
   whichever comes first. If 120 days pass with n < 100, that is itself the answer to a
   different question — see §7 (S3).
2. **Cohorted by signup week, and segmented by `source`** (`outbound`, `landing`, `referral`).
   Cold-outbound and inbound cohorts convert differently and a blended number will hide both.
3. **Pricing is the three-tier ladder in [`OFFER.md`](OFFER.md) §6** — Crew $79/$790, Shop
   $99/$990 (the ICP), GC Roll-up $299/$2,990 — with a 14-day card-required trial on every
   price. Where this document says a price, it means that ladder, and **ARPU is a blend, not
   $99**.
4. **Every rate is reported with its denominator.** WL-12 V2 and V3 enforce it: under n = 20 the
   page prints `3/14`, not `21.4%`.
5. **Iterate means one variable at a time, with a changelog** (PIPELINE §6). Changing the
   onboarding *and* the price *and* the sequence in one week means learning nothing from any of
   them.
6. **A number marked `HYPOTHESIS` has no published benchmark behind it.** It is a defensible
   guess and it is labelled as one. A number marked with a citation is anchored to a source that
   was opened.
7. **Nothing here is renegotiated after the data arrives.** That is the entire point of writing
   it now.

### The benchmarks these numbers are anchored to

| source | n | what it says |
|---|---|---|
| Poyar / Rachitsky / Pendo, *What is a good free-to-paid conversion rate* | >1,000 products, six-month cohorts | **free trial: good 8–12%, great 15–25%**; freemium self-serve: good 3–5%, great 6–8% |
| Poyar / ProductLed / ChartMogul, January 2026 | ~200 B2B products | median free-to-paid **8%**; **free trial with credit card: good 25–35%, great 50–60%**; without a card: good 4–6%, great 10–15%; 10× spread between the top and bottom quintile |
| SMB SaaS churn benchmarks, 2026 aggregations | mixed | SMB / self-serve monthly **logo churn 3–7% common**, healthy **2–4%**; under $15K ACV, **1.5–3.0%** |

**A caution that matters for reading the first table:** the published card-required trial
benchmarks measure *trial start → paid*. Our **signup is upstream of the card** — a
`signup_completed` is a verified magic link, before Checkout (see
[`specs/WL-09-billing.md`](specs/WL-09-billing.md)). So our signup→paid number is **not directly
comparable** to the 25–35% band and should be read against the more conservative 8–12% / 15–25%
free-trial band, with the card requirement as upside.

---

## 1. Lookup → signup (the public funnel step)

**Added during wave-1 reconciliation**, because [`specs/WL-00-public-rate-lookup.md`](specs/WL-00-public-rate-lookup.md)
put an unauthenticated rate lookup in front of signup. The funnel now begins one step earlier and
that step must carry its own number.

**Definition.** `lookup_performed` (unique IP hash, 30-day window) → `lookup_cta_clicked` →
`signup_completed`.

**Status: `HYPOTHESIS`.** No benchmark exists for a factual public utility converting into a
vertical SaaS trial.

| metric | band | verdict | action |
|---|---|---|---|
| `lookup_cta_clicked` ÷ `lookup_performed` | **≥ 8%** | on plan | The lookup is doing its job as a demo. |
| | 3–7% | weak | The call-to-action is below the table by design (WL-00 V3). Test the copy, not the placement — moving it above the table would break the trust argument the whole offer rests on. |
| | **< 3%** | failing | People want the rate and not the form. That is a real finding: either the free utility is the whole product people want (a different, ad-supported business we are not building), or the outbound is bringing the wrong traffic. Segment by `source` before concluding. |
| `signup_completed` ÷ `lookup_cta_clicked` | **≥ 35%** | on plan | They clicked through with intent; signup is a magic link. |
| | < 20% | weak | The signup page is losing people who already wanted it. One variable at a time. |

**A caution.** Lookup volume is **not** a success metric and must never be reported as one.
3,088 indexable county pages will attract students, journalists, competitors and idle curiosity.
The number that matters is the ratio, always with its denominator, always segmented by `source`.

---

## 2. Signup → activation

**Definition.** `signup_completed` → first `wh347_generated` for that organisation, within
**14 days** (one trial). Activation is a generated WH-347 and nothing else — not a login, not a
project, not a "wow moment". The product's promise is a certified payroll; until one exists
nothing has happened.

**Status: `HYPOTHESIS`.** No published benchmark exists for "signup → produced the core
regulatory artifact" in vertical compliance SaaS. The bands below are anchored to the work the
path actually demands — enter a card, create a project, pin a determination (12% of lookups are
ambiguous, KNOWLEDGE_BASE F3), add and map at least one worker, key a week of hours, certify —
which is roughly 20–30 minutes of real work the first time.

| band | rate | verdict | action |
|---|---|---|---|
| **≥ 40%** | strong | **persevere and spend** | The path works. Shift effort from product to acquisition: raise the outbound batch size, and treat the funnel as solved until it regresses below 30%. |
| **25–39%** | on plan | **persevere, fix the largest step drop** | This is the planned band. Take the single largest step-to-step drop in the WL-12 funnel and fix only that, then re-measure at +50 signups. |
| **15–24%** | weak | **iterate — onboarding, not market** | Two named experiments, run one at a time: (a) a seeded demo project with a real determination and three fake workers, so activation is reachable in under 3 minutes; (b) collapse project setup and crew into a single guided flow. |
| **< 15%** | failing | **stop and diagnose before spending another dollar on acquisition** | See the diagnostic below. Do **not** interpret this as "the market doesn't want it" until the diagnostic has run — at this rate the funnel is far more likely broken than the market. |

### The diagnostic that makes the number actionable

The bands above are useless without knowing *where* people stop. Committed sub-thresholds,
measured on the same cohort:

| step | metric | on plan | if below |
|---|---|---|---|
| signup → trial started | `signup_completed` → `checkout_completed` | **≥ 60%** | The card is the barrier. Test a no-card trial for one cohort — accepting the 4–6% band as the cost — or move the card to after the first WH-347. |
| trial → determination pinned | `checkout_completed` → `wd_pinned` | **≥ 75%** | The lookup is the barrier. Check `wd_search_zero_results` and `wd_search_ambiguous` rates. **If `wd_search_ambiguous` exceeds 20% of searches, F3 is a product problem we shipped rather than solved**, and WL-02's candidate screen is the fix. |
| pinned → crew mapped | `wd_pinned` → first `classification_mapped` | **≥ 80%** | The classification picker is the barrier. `classification_zero_results` rate above **15% of searches** triggers the WL-03 P4 escalation (better matching), not more copy. |
| mapped → activated | first `classification_mapped` → `wh347_generated` | **≥ 70%** | The hours grid or the certify step is the barrier. Check `payroll_validation_failed` by `rule_id`. |

### Time to activation

| metric | on plan | if worse |
|---|---|---|
| median hours, `signup_completed` → `wh347_generated` | **≤ 24 hours** | A median beyond **7 days** means the weekly deadline that justifies this product is not felt by the people we are reaching. That is a **targeting** finding, not a product one: re-cut the outbound list toward firms with a *current* award (the USAspending subaward segment), not a historical one. |

---

## 3. Activation → paid

**Definition.** first `wh347_generated` → `subscription_activated` (first successful invoice)
within **30 days**.

**Status: partially anchored.** Because the trial requires a card
([`specs/WL-09-billing.md`](specs/WL-09-billing.md) V1), this ratio is mostly a
*non-cancellation* measure: the organisation has already given us a card and has already
received the thing it came for. The published card-required trial band (**good 25–35%, great
50–60%**, Poyar / ProductLed / ChartMogul) measures a longer span than this one, so it is a
**floor**, not a target.

| band | rate | verdict | action |
|---|---|---|---|
| **≥ 70%** | strong | **persevere; test a price rise** | They made the artifact, kept the card, and paid. Test **Shop at $129** on a new cohort while grandfathering existing accounts at $99. |
| **50–69%** | on plan | **persevere** | The planned band. Attention goes to §2 and §4, not here. |
| **35–49%** | weak | **iterate on the second week, not the price** | The likely cause is that week 2 was not faster than week 1. Instrument `payroll_copied_from_last_week` usage and `minutes_in_grid` (§5 P1); if copy-last-week is used by fewer than 60% of second payrolls, the feature is not discoverable and that is the fix. |
| **< 35%** | failing | **iterate on price and packaging, once, then decide** | They built the thing and still left. Two possibilities, and the cancellation reasons distinguish them: *(a)* the price is wrong for a firm that files 6 weeks a year — note the ladder already has **Crew at $79** for exactly this shape, so check the **tier mix first**: if fewer than 25% of paying accounts are on Crew, the ladder is not being presented as a real choice. If Crew is well subscribed and churn is still here, test a **$49/mo pause-when-idle** or **$59 per active project** plan, which is where WageBridge's original hypothesis pointed; *(b)* the artifact was not accepted by their GC → that is a **product defect** and it is fatal until fixed. Check `document_redownloaded` and support tickets before touching the price. |

**Composite: signup → paid.** Reported alongside, because it is the number comparable to the
literature.

| band | verdict |
|---|---|
| **≥ 20%** | above the free-trial "great" band (15–25%). Spend. |
| **12–19%** | inside "good"→"great". On plan. |
| **6–11%** | at or below the 8% all-products median. Iterate. |
| **< 6%** | below the median with a card requirement in place. This is the strongest single stop signal in the document. |

---

## 4. Month-2 retention

**Two numbers, because for a weekly product they diverge and the divergence is the finding.**

**4a · Logo retention.** Paid in month 1 and still `status ∈ {active, trialing}` on day 60.

**4b · Usage retention.** Paid in month 1 and generated **≥ 1 `wh347_generated` between day 31
and day 60**.

Usage retention leads logo retention by one to two months. A subscriber who stops filing is
already churned; the card has simply not noticed yet.

| metric | band | verdict | action |
|---|---|---|---|
| **4a Logo** | **≥ 90%** | strong | Steady-state monthly logo churn for SMB self-serve is cited at 3–7% (healthy 2–4%). ≥90% at the **first renewal** — always the spike — is materially better than that. Persevere and push annual plans hard. |
| | **80–89%** | on plan | 11–20% first-renewal churn is inside the normal SMB shape. Persevere; add the WL-17 weekly reminder. |
| | **65–79%** | weak | Iterate. Read cancellation reasons from `subscription_cancelled {reason, days_active, payrolls_generated}`. **If the modal reason is "no active job", the pricing model is wrong, not the product** — go to the pause-when-idle plan in §3. |
| | **< 65%** | failing | Stop adding accounts. A leaking bucket refilled by outbound is the most expensive mistake available. Fix retention or stop. |
| **4b Usage** | **≥ 65%** | on plan | A third of subscribers having no covered work in a given month is expected and honest for this buyer. |
| **Tier mix** | Crew **20–40%** of paid accounts | on plan | Crew exists partly as a decoy that makes Shop obvious (OFFER §6.1) and partly for the genuine one-job sub. **Under 10% on Crew** means it is pure decoy and should be re-priced or retired. **Over 50% on Crew** means we mis-sized the ICP and the $99 anchor is wrong. |
| | **45–64%** | weak | The seasonality is real and $99 flat is being paid for nothing. **Ship pause-when-idle within 30 days.** This is a pre-committed build decision, not a discussion. |
| | **< 45%** | failing | The flat monthly subscription is the wrong shape for this market. Switch to per-active-project pricing, or accept that this is a seasonal tool with an inherently short life and reprice for it. |

**The gap between 4a and 4b is itself a committed signal.** If 4a − 4b > **25 points**, a
quarter of subscribers are paying while getting nothing, and that is churn that has not happened
yet. Treat next month's logo churn as if it will be 4a − 4b, and act on §4b's action now.

---

## 5. Product-promise thresholds

These are not funnel metrics. They are the claims WageLens makes, converted into numbers that
can falsify them.

| # | claim | metric | on plan | if it fails |
|---|---|---|---|---|
| P1 | "Certified payroll in minutes, not an hour" | median `payroll_certified.minutes_in_grid` for an organisation's **4th** payroll | **≤ 15 minutes** | DOL's own burden estimate is **55 minutes** per form (KNOWLEDGE_BASE KB-6) and it is the number the whole pricing argument rests on. Above **25 minutes** the promise is not being kept: prioritise the WL-05 keyboard model and copy-last-week discoverability over every Should item. |
| P2 | "We tell you when the determination changes" | `wd_alert_email_sent` ÷ active-project-years | **≥ 0.5/yr** | **This is the flag raised in [`BACKLOG.md`](BACKLOG.md) WL-08.** 3,377 of 4,235 determinations sit at modification 1; only 110 are above modification 2. **Below 0.2/yr the marketing claim moves before the feature does** — WL-08 stops being a headline and becomes a footnote, and the retention argument for it is withdrawn. |
| P3 | "The exact determination for your project" | `wd_search_ambiguous` ÷ `wd_search_performed` | ≤ **20%** | Measured 12.17% of *combinations* in the corpus; the user-weighted rate may differ, since ambiguity concentrates in Heavy and in dense metros. Above 20%, F3 is the dominant experience and WL-02's candidate screen is the product, not a fallback — invest there. |
| P4 | "Every rate carries its source" | `official_determination_link_clicked` per activated organisation in its first 30 days | **≥ 1** | If nobody ever opens the source, the provenance is decoration. Either the trust it buys is invisible (fine) or the link is invisible (fix it). Distinguish with the WL-12 voice-of-the-user panel before acting. |
| P5 | "We don't hold data we're forbidden to transmit" | `ssn_full_entry_blocked` count | **0 is not the target** | Non-zero means people are *trying* to enter a full SSN, and the field label and help copy need work. Zero over 100 signups probably means the field is clear. Either way, gate G7 makes the outcome safe; this metric is about the copy. |

---

## 6. What "iterate" costs, and when it stops

Iteration is bounded, because unbounded iteration is how a project dies without ever deciding.

- **Two iteration cycles per failing metric**, each one variable, each re-measured at **+50
  signups** or **30 days**, whichever comes first.
- **After two failed cycles on the same metric, it escalates to a stop/pivot decision** — it does
  not get a third cycle. (PIPELINE §6: three failed rounds escalate to the orchestrator with the
  disagreement written down.)
- **A changelog entry per cycle**: the variable, the hypothesis, the before number, the after
  number, the verdict. Written before the change ships, not after.

---

## 7. The stop conditions

Any one of these, at the evaluation point, is a stop-or-pivot decision that goes to the founder
with the numbers attached. None of them is a judgement call.

| # | condition | what it means |
|---|---|---|
| **S1** | signup → paid **< 6%** | Below the all-products median *with a card requirement in place*. The offer is not converting and two iteration cycles have not moved it. |
| **S2** | Month-2 **logo** retention **< 65%** after one pricing iteration | The bucket leaks faster than outbound can fill it. Every additional dollar of acquisition is destroyed. |
| **S3** | Fewer than **100 signups in 120 days** with the outbound engine running at its planned batch size | Not a conversion problem — a **reach** problem. Either the list is not reachable (only 0.7% of the 10,749 prospect rows carry a contact route; see `phase-3-acquisition/prospects/wagelens/README.md`), or the message does not earn a reply. Fix acquisition or stop; do not keep polishing the product. |
| **S4** | A **wrong rate reaches a certified payroll** and is traced to our corpus, not to user entry | Different in kind from every other line here. Halt new signups, fix the gate that should have caught it, notify every affected organisation. Trust in a compliance tool is not a metric you recover by iterating. |
| **S5** | Median activation time **> 14 days** *and* activation **< 15%** | Nobody is feeling the deadline. The buyer we designed for is not the buyer we reached. |
| **S6** | Fewer than **3 of the first 25 paying customers** are on their **second** month | Not enough data for §4, but enough for a gut check with a number attached. Stop the outbound batches and talk to all 25 before spending more. |

**And the condition that is not a stop:** a low absolute number of signups in the first 30 days.
Cold outbound in construction has a long, seasonal reply cycle, the weekly payroll deadline is
the trigger, and the trigger arrives when a job is awarded — not when we email. §S3's clock is
120 days for that reason.

---

## 8. Founder inputs still missing

These make the unit economics evaluable and are **not** things this agent can assume.

| # | needed | why |
|---|---|---|
| F1 | Cost per signup from the outbound engine (founder hours × an hourly value, plus Resend and Vercel Pro) | Without it, CAC payback cannot be computed and §2's "spend" verdicts have no budget attached. At a blended ARPU near $99/mo with 60% month-2 retention, a payback beyond 4 months is not survivable at this price. |
| F2 | The founder's floor: the MRR below which this is not worth continuing regardless of trend | §7 is about ratios. This is about absolutes, and only the founder can set it. |
| F3 | Whether a **pause-when-idle** plan is acceptable | §3 and §4b both name it as the committed remedy. If it is off the table, both remedies change and this document needs a revision **before** the numbers arrive, not after. |
