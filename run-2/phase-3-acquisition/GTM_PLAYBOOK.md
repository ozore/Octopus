# GTM Playbook — Ratepin, Day 1 to Day 90

**Subject:** the sequenced go-to-market for a company with no employees. Per phase: what ships, which scheduled jobs run it, the single metric that decides continue or kill, and the decision rule — written before the data (Ries).
**Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D1–D10, G1–G6 · `CORRECTIONS.md` · `BRAND.md` §5. This file is **Scope A**: every numeral resolves to a dated source or to arithmetic shown in place.
**Status:** draft on disk. Nothing here has been sent, posted or submitted anywhere. **Date:** 2026-08-13.

> ### BUILD STATE — read this before any sentence below
>
> This file names two kinds of machinery, and the difference is the difference between a description and a
> specification. Verified against `run-2/app` on **2026-08-13**.
>
> **Built and running.** The sixteen-job registry in `src/worker/jobs.ts` (`JOB_REGISTRY`) — including
> `ingest.corpus.nightly` daily 02:00 ET, `canary.golden` 03:00, `retention.sweep` 05:00 (which purges
> free-generator inputs at 24 hours), `gates.refresh` hourly at :50, `billing.overage`, `outbox.drain`. The
> G1–G6 gates as **database counters** in `src/platform/ops/gates.ts`, where `gateSentence` returns
> `outcome: null` while a gate is locked, so the renderer can only print the mechanism sentence. The routes
> `/wh347`, `/rates/[state][/county][/craft]`, `/rate-card` with Stripe Checkout on the pre-account SKU, and
> `/status`.
>
> **Specified and NOT built.** `claims-lint`; `corrections.probes.json`; `claims.json`, its signing key and
> its signature check; **CL-1** and **CL-2**; the pre-deploy CI job that would run any of them (there is no
> `.github/workflows` in the app); all eleven `crm.*` jobs; `pages.rebuild`; the routes
> `/wd/[number]/diff`, `/wd/[number]/changes`, `/changelog`, the machine-readable revision feed; and the
> per-artifact verification page — `src/app/(app)/_lib/filings.ts` (the `verifyUrl` field) already composes a `/v/{id}` URL onto
> the footer and **no route resolves it**.
>
> Every name in the second list is marked **[SPEC → where it is defined]** at each use below. **A name
> carrying [SPEC] does not run today.** No sentence in this file may be read as saying that it does, and any
> sentence that reads that way is a defect to be reported, not a fact to be relied on.

---

## 0. The constraint that sets the sequence

A1 deletes warm outreach structurally — there is no unattended form of "message everyone you know" — and `research/03` found no lawful machine-readable list of D1 to build cold outreach from. Two of Hormozi's four quadrants are gone before day 1, and nine of Weinberg & Mares' nineteen channels score zero on the autonomy axis, dying at the gate rather than in the ranking.

What remains: **two assets that compound unattended** (free tools, programmatic pages), **one instrument that rents a fast money answer** (capped paid search), and **one loop we instrument but never plan against** (the artifact footer). That is the order below, because it is the order in which each can produce a number. The intended advance mechanism is that a job writes a counter and `crm.review.close` **[SPEC → `crm/CRM.md` §3]** reads it on a Monday. Until that job exists, a phase cannot advance on a counter, because nothing writes one — which is why §1 is a gate on artefacts rather than on intentions.

---

## 1. Day 0 — the pre-flight gate

A precondition you cannot point at a file for is not a precondition — it is an assertion, and an assertion
is exactly what a gate exists to replace. So each of the six is stated as **an artefact whose existence and
exit status a script can check**, with the path or command that checks it and its state on 2026-08-13.
**Three are red, one is amber and two are green today.** That is the finding, and printing it is the point:
the earlier draft of this section listed six assertions, two of which named machinery that does not exist,
so the gate could only ever have been passed by declaration — the exact failure `CORRECTIONS.md` §0 was
opened to end.

| # | The artefact checked | How it is checked | State 2026-08-13 |
|---|---|---|---|
| **1** | `corrections.probes.json` exists at the repo root, parses, and its 35 regexes compile | `sed -n '/^\`\`\`json \[STRUCK:ALL\]/,/^\`\`\`$/p' phase-2-build/CORRECTIONS.md \| sed '1d;$d' > corrections.probes.json && jq . corrections.probes.json` | **RED** — the extractor is specified in `CORRECTIONS.md` §3.3; the file has never been extracted |
| **2** | A pre-deploy CI job runs `claims-lint` **[SPEC → `CORRECTIONS.md` §3.4]** over `phase-3-acquisition/**` and `app/**` and exits non-zero on a blocking match, with no override flag — evidenced by a job id and a recorded run | the workflow file, and one run whose log shows `0 blocking` | **RED** — `.github/workflows/ci.yml` **does exist** at the repo root (`working-directory: app`; steps: typecheck → unit → citation invariant → golden-set eval → `corpus:check` → `next build`), and it is the right place for this check, but **no step runs a claims lint and no lint binary exists**. The verdict is unchanged; the evidence that was printed here was false, and false about the one artefact this row points at |
| **3** | No outcome sentence can render while its gate is locked | `npm test -- tests/platform/g5.test.ts`, whose case *"withholds the outcome sentence while G5 is short of its thresholds"* asserts `sentence.outcome` is `null`; the function is `gateSentence` in `src/platform/ops/gates.ts` | **GREEN** — built as DB counters and a total function, not as `claims.json`. `claims.json`, its signature and CL-1/CL-2 remain **[SPEC → `CORRECTIONS.md` §5]** and are **not** what makes this green |
| **4** | The provenance footer is on every emitted document at every tier including free, non-configurable | `npm test -- tests/artifacts/pdf-structure.test.ts tests/web/free.test.ts` (the free path asserts the same three-state freshness algebra and the `DRAFT — NOT CERTIFIABLE` band) | **GREEN** |
| **5** | The per-artifact verification URL resolves to a public read-only provenance page — the loop's only denominator (§8) | an HTTP 200 from `/v/{id}` for a known artifact id | **RED** — `src/app/(app)/_lib/filings.ts` (the `verifyUrl` field) prints the URL onto the footer and no route serves it. The footer currently points at a 404 |
| **6** | Stripe Checkout completes a $49 purchase with no account (D4), and analytics set no cookie | `src/platform/billing/checkout.ts` `STRIPE_PRICE_RATE_CARD` session plus a green `e2e/shell.spec.ts` run against `/rate-card`; and a response-header check showing no `Set-Cookie` on a tool page | **AMBER** — the route and the session exist; no recorded end-to-end run and no header check |

**Metric:** artefacts green ÷ 6, each evidenced by the command above and its exit status. **Rule:** below
6/6, day 1 does not begin. A gate whose preconditions cannot be evaluated is not a stricter gate than none;
it is a looser one, because it passes by assertion.

---

## 2. Phase A — Days 1–14: the free tools

**Ships.** `/wh347`, the unlimited free WH-347 generator, no account, no email wall (D3; C-B3) — **built**; table stakes, already shipped by PrevailComply, constructionbids.ai and DOL, so it is the **control arm** and never a differentiator (C-B2). Beside it `/wd/[number]/diff` **[SPEC → `research/02` §7 T4; no route in `src/app`]**: a determination number plus an award date returns every modification published since with the per-classification rate diff, each row carrying its modification, publication date and mirrored source URL — which none of the four free rate sites publishes. Plus the public corpus status page (`/status`, built) and `/changelog`, the colophon and the machine-readable revision feed **[SPEC → `research/02` §8; not built]**. **Phase A is therefore not a deployment, it is a build:** one of the two tools and one of the four supporting surfaces exist today.

**Jobs.** `pages.rebuild` **[SPEC → `ARCHITECTURE.md` §7.1; not in `JOB_REGISTRY`]**; `crm.tool.funnel` 03:20 ET, `crm.verify.count` 04:30, `crm.dashboard.render` 05:00, `crm.review.close` Mondays 04:40 — all four **[SPEC → `crm/CRM.md` §3; none built]**; `retention.sweep`, **built**, daily 05:00 ET, purging free-generator inputs at 24 hours (`src/worker/jobs.ts`). Lifecycle: `magic_link` only — no other message exists because no account does.

**Metric.** `t1.pqs`, product-qualified starts: sessions that reached a **rendered artifact carrying the footer**. Not sessions, not pageviews (Poyar). The counter is specified in `crm/dashboard.md` §2.1 and is written by a job that does not exist, so **every T1 counter named below reads null today** — which is the whole content of the day-14 gate.

**Rule.** Day 14 is an instrumentation gate, not a kill: if `t1.gen_runs`, `t1.diff_runs`, `t1.pqs` or `loop.verify_3p` is still null, Phase B publication and Phase C spend both freeze. A missing day is recorded as missing, never interpolated. T1's two real kill lines fall later:

- **Hard kill if `t1.tool_to_paid` is zero at week 12.** Unchanged.
- **The differentiation hypothesis is killed on `t1.tool_to_account` split by tool, not on the run ratio.** The earlier rule — kill if `t1.diff_ratio` = diff runs ÷ generator runs < 1.0 at week 8 — cannot answer the question it was written for. The two tools do not share a population: the generator needs nothing ("type your own rates"), the diff checker needs a determination number **and** an award date the visitor must already hold. A ratio below 1.0 is the expected result even if provenance is exactly the draw, so the plan was pre-registered to kill its own central hypothesis on a measurement that cannot speak to it. Ries' point is that a threshold must be written first *and* be able to answer the question asked. `t1.diff_ratio` therefore stays as a **descriptive counter with no verdict attached**, and the kill moves to the population-matched comparison already defined in `crm/dashboard.md` §2.1: **diff-session → account creation versus generator-session → account creation, each within its own denominator, at week 8.**

---

## 3. Phase B — Days 8–30: programmatic rollout and the indexation ramp

**Ships.** ~500 pages across the beachhead states, all four templates: state hub, county hub, determination × craft rate page carrying that craft's full revision history, and `/wd/[number]/changes`, the per-classification change log. Counties covered by the same determination **share one page**; separate pages would be byte-identical duplicates. The publication gate is enforced by columns, not judgement: **a page ships only if it carries the per-classification revision diff or a crosswalk entry.** Anything else is a reformatted table and is not published. Ceiling discipline: the naive county × class index runs to ~479,000 rows, while the defensible supply is 9,424 revision documents minus 4,236 active determinations = **5,188 supersession events**, 1.1% of it.

**Indexation ramp, tied to promotion rather than to a calendar.** `pages.rebuild` **[SPEC → `ARCHITECTURE.md` §7.1; not in `JOB_REGISTRY`]** is specified to run off the 02:00 ET crawl — `ingest.corpus.nightly`, which **is** built — and to be *skipped entirely if the snapshot did not promote*, regenerating only pages whose rate rows changed. Sitemap `lastmod` is therefore specified to carry **last changed**, never last verified: Google says it uses `lastmod` "if it's consistently and verifiably… accurate" (fetched 2026-08-13), so re-stamping unchanged pages nightly would degrade the one machine-readable signal we control. IndexNow is specified to fire on the same diff. **On IndexNow's participant roster, corrected:** `indexnow.org/documentation` carries no roster at all, so the earlier citation could not support the conclusion hung on it. Nor does `indexnow.org/searchengines`: fetched twice on 2026-08-13, that page carries **no participant roster** either — Bing, Yandex, Seznam and the Internet Archive appear on it as the document's *authors*, and the page points at `indexnow.org/searchengines.json` for the list. That file, fetched, names **Bing, Yandex, Seznam, Naver, Yep, Internet Archive and Amazon Bot — Google is absent.** The operational conclusion never moved; it took three citations to source it, and the first two repairs each cited a page that could not carry it. Nothing in this plan depends on IndexNow. DOL publishes determination changes "generally on Friday", which is when the change log earns its keep.

**Jobs.** `pages.rebuild`; `crm.sc.pull` 04:00 (Search Console); `crm.index.sample` 04:10; `crm.awards.pull` monthly, supplying page **build order only**, never an address — **all four [SPEC → `crm/CRM.md` §3 and `ARCHITECTURE.md` §7.1; none built]**. The sampling constraint they are specified against is real and dated: the URL Inspection API allows **2,000 queries/day and 600/minute** per site (verified 2026-08-13), so indexed share is a sampled estimate that must be published **with its n**, never a census presented as one.

**Metric.** `t2.indexed_share`, with n.

**Rule.** Day 30: if the cohort trails the free-generator control arm, cohort 2 is not published. Week 12: kill below 20% indexed share, or on no month-over-month impression growth across three consecutive months. Week 16: kill the county × craft sub-surface independently if it reaches page one for no head term — losing that fight is expected and must not drag the determination pages with it. Day 90: **any template below the control arm is deleted, not iterated.**

---

## 4. Phase C — Days 15–56: the $49 Bid Rate Card, the first paid proof

The $49 one-time bid rate card — the sheet a sub prices a job from — is purchasable **before an account exists** (D4). Its job is not revenue: at $46.98 contribution and instantaneous payback, each unit funds ~$47 of acquisition at zero payback risk. It is the cheapest test of the belief everything else sits downstream of — **that this buyer pays for the pin** — and T1 and T2 say nothing for months.

**Ships.** Stripe Checkout on the pre-account SKU; the rate-of-record certificate as the delivered artifact; a narrow high-intent keyword set (wage-determination modification; WH-347 showing the determination; eCPR XML) pointed at it.

**The cap is ours, not the platform's.** Google states a campaign "might spend up to twice your average daily budget" on a given day and "no more than 30.4 times your average daily budget" in a month (fetched 2026-08-13) — there is no lifetime cash cap to delegate to. So `crm.sem.meter` **[SPEC → `crm/CRM.md` §3; not built]** is specified to read spend and purchases daily at 04:20 ET, compute cost per purchase, and **set the daily cap to zero when a kill line is crossed**, treating unreadable spend as at-cap so the failure direction is to stop spending. **That job is the precondition for spending anything at all:** it is the only thing that would make a capped cash test A5-compliant, and until it is built and observed setting a cap to zero, Phase C does not open. No spend without the meter is not a preference; it is what A5 means when the alternative is an unattended card.

**Metric.** `t3.cost_per_purchase`. CPC is an output of this test, never an input (Poyar: payback misleads for self-serve, so meter cost per purchase).

**Rule.** Stop at **$2,000 cumulative spend with zero purchases** — that is **42.6 rate cards at the $46.98 contribution line** ($2,000 ÷ $46.98), which is the unit this test actually buys. (An earlier draft framed the same cap as "under two Solo affordable-CAC budgets", which borrows a subscription's eleven-month LTV to make a cap on a one-time SKU look conservative; see F4 in §6.) Stop when cost per purchase **exceeds $47 for two consecutive weeks**: above the $46.98 contribution line the instrument stops self-funding and becomes a subsidy. `crm.review.close` **[SPEC]** is specified to execute both, so that the halt is a job's write and not a decision — today there is no job, and therefore no halt mechanism, which is the second reason Phase C does not open before §1's gate is green.

---

## 5. Phase D — Days 30–90: expansion with no salesperson

The ladder is $0 · $49 · $99 Solo · $249 Crew · $599 Multi, with **no project caps and no worker caps at any tier** — the single-variable value metric deep dive 03 §4 settled on, replacing D4's original caps with filing allowances. **Open against the code, and it is a decision rather than a typo (N-4):** `drizzle/0000_init.sql:1851-1852` still seeds `project_cap` 1/5/NULL and `worker_cap` 15/75/NULL, `catalog.ts` reads them into `PlanRow` and `(marketing)/_lib/plans.ts` carries them into the pricing view model. **No code path enforces either cap and no component renders them** — they are vestigial columns from D4's pre-research text. The decision of record is this sentence; the columns are to be dropped from the seed and the view model, and until they are, `lifecycle-emails.md` may not rest the upgrade message on them. What the Solo→Crew upgrade buys is the California eCPR XML export, WD-change alerts and the portal export bundle — not headroom, and not a lower bill. Expansion runs on the meter: included filings per tier (`catalog.ts`: Solo **8**, Crew **40**, Multi unlimited), then **$2.50 per certified filing overage, capped at the gap to the next tier's price, with automatic upgrade at the cap** (`pricing.ts`: `capCents = price(next) − price(current)`).

**What the cap is, stated so no message can turn it into a saving.** The cap is a ceiling on the overage, and the upgrade is what the ceiling buys — not a cheaper bill. Worked against the shipped catalogue, Solo → Crew: Solo's cap is $249 − $99 = **$150**, which is 60 overage filings, so the cap binds at **68 filings** and the account pays **$249**. The upgrade then moves it to Crew — also $249, but with 40 included filings and $2.50 metering above them. At 69 filings that is $249 + 29 × $2.50 = **$321.50** on Crew against **$249** capped on Solo. **The Solo → Crew step is not cheaper, and no surface may say it is.** The reasoning that *is* sound belongs one rung up: Crew → Multi ends in an unlimited tier, so there the upgrade is at worst neutral. The honest sentence everywhere is the mechanism — *the overage stops at the next tier's price, and at that point you are moved onto that tier* — with the comparison rendered from `assessUsage()` rather than asserted. `outreach/lifecycle-emails.md` owns the copy; this section owns the constraint it is written against.

Where the per-filing meter sits against published competitor pricing, quoted and not characterised: LCPtracker's LCPcertified page (read 2026-08-13) prints, inside its **Plus** package, the lines *"$12 Per Report"* and *"Up to 5 Active Projects: $145/Month"*; the page does not state whether the per-report line is purchasable without a project tier, and we draw no conclusion from it either way. CertifiedPayrollPro (read 2026-08-13) prints *"$49/mo + $5/report"*, *"$99/mo + $3/report"* and *"$249/mo + $1/report"*. In every one of those the per-report price sits **inside** a subscription, which is the same shape as ours; that is the whole of what the comparison establishes.

Why it expands unattended: the value metric is the certified filing — one per project per week, arithmetic the buyer already does before purchase (Poyar's predictability test), metered from generated artifacts. Ramanujam's configuration rule is honoured by differentiating tiers on **leaders** (revision-of-record pinning, diff since award, classification memory; then eCPR XML, change alerts, portal export bundles; then the dispute-grade archive) rather than on capacity. A cap is a wall, and a wall is a churn event — which is the argument for the cap and *not* an argument that crossing it is cheap.

**Jobs.** `allowance_warning`, `auto_upgrade_fired`, the dunning set, `staleness_credit_posted`, `archive_export_link` on cancel — outbound-only, idempotent, with the in-product notice normative and the message a convenience. The metering and dunning halves are **built** (`billing.overage` and `billing.dunning`, hourly, in `JOB_REGISTRY`); the message bodies are drafts in `outreach/lifecycle-emails.md` and no sending domain is configured (`src/platform/ops/outbox.ts`).

**Metric.** `mo.net_new_vs_burn` — net new ARR against cash burned.

**Rule.** If by day 90 **no account has crossed an allowance boundary**, the filing is not behaving as the value metric and the ladder is re-cut *before* any channel spend rises. Acquiring into a mis-cut ladder is the expensive version of this mistake.

---

## 6. Funnel arithmetic

Two dated cost inputs, **one labelled volume assumption inside the table**, and every figure reproducible
from what is printed here. (An earlier draft of this section was headed *"sourced, no assumption
required"* while resting on an unlabelled usage assumption and an undisclosed payment rate. Both are named
below; the heading was the defect, not the numbers.)

**The payment rate, which the earlier draft used and never showed.** `stripe.com/pricing`, fetched
2026-08-13: *"2.9% + 30¢ per successful transaction"*, and Stripe Billing pay-as-you-go at *"0.7% of
Billing volume"*. So a **one-time** Checkout clears at **2.9% + $0.30** and a **recurring** subscription at
**3.6% + $0.30**. Without the 0.7% none of the subscription rows below can be reproduced — $99 at 2.9%
gives $95.05, not $94.36 — which is exactly how a hidden input announces itself.

> **ASSUMPTION F0 — filings per tier per month: 13 / 52 / 130. Unmeasured.** No source splits filing
> frequency by tier; these are the volumes the contribution rows are computed at and they are an
> assumption, not a finding. They also do not match the shipped allowances (`catalog.ts`: Solo **8**, Crew
> **40**, Multi unlimited), which has a consequence worth surfacing rather than smoothing: **if F0 is
> right, the modal Solo account is five filings into overage every month** and bills $99 + 5 × $2.50 =
> **$111.50**, not $99. Either F0 is too high or Solo's allowance is cut too low; §5's day-90 rule is where
> that gets decided, and the contribution rows below deliberately exclude the overage revenue so that the
> figures stay conservative while the question is open.

| Quantity | Value | Working, in full |
|---|---|---|
| Variable cost per certified filing | **≈$0.06** | ≈$0.05 model + ≈$0.01 compute and retention (`ARCHITECTURE.md` §2.1); the free tier makes zero model calls |
| Contribution, $49 rate card | **$46.98** (95.9%) | $49 − (2.9% × $49 + $0.30 = **$1.72**) − **$0.30** variable |
| — the $0.30 in that row | **ASSUMPTION F5**, never derived | The document has never said where it comes from, and it has two possible readings: 5 × the $0.06 per-filing variable cost, or a **double subtraction** of Stripe's $0.30 fixed fee, which the $1.72 above already contains. At the per-filing $0.06 the contribution would be **$47.22**. The plan keeps the lower **$46.98** because an unresolved cost should be assumed against us — and §4's kill line is $47, i.e. two cents *above* $46.98 and below $47.22, so the halt fires marginally late under the pessimistic reading and comfortably early under the optimistic one. Resolve it before the line is ever used in anger |
| Contribution, Solo, at F0's 13 filings | **$94.36** | $99 − (3.6% × $99 + $0.30 = $3.86) − (13 × $0.06 = $0.78) |
| Contribution, Crew, at F0's 52 | **$236.62** | $249 − (3.6% × $249 + $0.30 = $9.26) − (52 × $0.06 = $3.12) |
| Contribution, Multi, at F0's 130 | **$569.34** | $599 − (3.6% × $599 + $0.30 = $21.86) − (130 × $0.06 = $7.80) |
| The same at each tier's **included allowance** | **$94.66 / $237.34 / —** | Solo at 8 filings: $99 − $3.86 − $0.48. Crew at 40: $249 − $9.26 − $2.40. Multi has no allowance to compute against |
| Fixed platform cost | **$66/mo verified floor, $175/mo ceiling** | Fly and Postgres list prices; the ceiling carries the page build, monitoring, storage growth |
| After the credit reserve | **≈91%** | 4% of MRR for self-serve refunds and staleness credits, neither with a human gate |

Three consequences needing no forecast: **one Solo account covers the verified fixed floor**
($66 ÷ $94.36 = 0.70) and two cover the ceiling ($175 ÷ $94.36 = 1.85); **paid search self-funds at 43
purchases** ($2,000 ÷ $46.98 = 42.6), which is what the $47 line encodes; **affordable CAC at an 11-month
payback ceiling** is Solo **$1,038**, Crew **$2,603**, Multi **$6,263** — computed from the unrounded
contributions ($94.356 × 11 = $1,037.92; $236.616 × 11 = $2,602.78; $569.336 × 11 = $6,262.70). An earlier
draft printed $2,607 and $6,259 for the last two, having multiplied contribution rounded to whole dollars
while Solo used the exact figure; this file forbids precisely that. The constraint is not affordability but
that no conversion rate has been measured. The assumed part is labelled and **inverted**: the model outputs
a required number, not a predicted one.

> **ASSUMPTION F1.** Let `c` = composite conversion from a `/rates/` or `/wd/` entry session through a tool run and an account to a paid subscription. `c` is unmeasured. Sessions needed to cover the $175 ceiling with two Solo accounts = 2 ÷ `c`: at `c` = 0.5%, 400 qualified sessions per month; at `c` = 0.1%, 2,000. **Neither is a forecast.** They bracket the answer, printed now so the first measured `c` meets something written beforehand.
>
> **ASSUMPTION F2.** Filing volume is seasonal; metered MRR contracts in winter. Annual billed at ten months is the hedge, and a January dip is not churn.
>
> **ASSUMPTION F3.** The D1 slice is uncounted — no source splits DOL's 122,936 WH-347 respondents by open shop, prime or sub, or by headcount. No addressable-market figure appears in this plan (C-B5).
>
> **ASSUMPTION F4 — retention, unmeasured.** An 11-month payback ceiling on a monthly subscription is a
> statement about survival, not about payback: the ceilings above are only affordable if the account lives
> eleven months. Nothing measures churn. If a Solo account leaves at month six, a $1,038 CAC is a loss of
> about $472. F1 covers conversion, F2 seasonality, F3 market size; this is the input the ceiling depends on
> most and it was the one with no label.

---

## 7. Community contributions and their disclosure

**We may publish objects; we may not participate in conversations.** 16 CFR §465.1(c)(4) states that in an interactive electronic medium "the disclosure must be unavoidable" and is not clear and conspicuous "if a consumer must take any action, such as clicking on a hyperlink or hovering over an icon, to see it." That eliminates the comfortable version — a small vendor link under a helpful answer — and forces the standing disclosure into the body of the post, where the pitch would otherwise go. That is the correct outcome, and most of the reason this section is short.

**Permitted in principle, none of them shipping today:** the machine-readable revision feed, the changelog, the colophon and the verification page — all four **[SPEC → §1 rows 1–5; not built]** — each carrying the standing disclosure in full or one-line form. **If a venue's field is too short for even the one-line form, we do not post there**; the shortness is the finding, not an obstacle to route around.

**The directory listing is not yet permitted, and the reason is A1 rather than the copy.** The listing was carried into this plan as *"free"* and *"no human"*. Re-probed 2026-08-13: `capterra.com/vendors/` returns **200** (the earlier record of 403 was a property of one network path, not of the venue), offers *"Get Your Product Listed"* and routes to `app.g2digitalmarkets.com/get-listed/start`, which returns 200 as a client-rendered shell with no field, price or terms readable without executing JavaScript. **The page states no price, so "free" is unestablished and is struck from every row until the flow itself says it**, and the flow ends in a submitted listing awaiting vendor verification. That raises the R-H7 question this plan asks of every remaining channel — *what happens when they reply asking for something?* — and it is unanswered. Until the get-listed flow has been read end to end and shown to complete with no correspondence, the listing sits with the platform rows in §9, not here.

**Refused by name:** answering questions in help forums; correcting errors about our own product in someone else's thread; any review of Ratepin by anyone with a material relationship to it (§465.2, §465.5); incentivised review solicitation (§465.4); engagement signals from a company account (§465.1(h)); an operated account carrying a person's name or face; the "why we built this" founder story, whose whole persuasive force is the implied person; paying anyone to post for us (§465.5(b)(1) returns the duty to us anyway); any "alternatives" property we own (§465.6). Show HN and Product Hunt disqualify us in their own published rules.

**Metric and rule.** None, deliberately. This is a placement, not a channel: no spend to stop, no yield to forecast. A kill line would dignify it as something it is not.

---

## 8. If the artifact loop shows nothing

D8 names the artifact loop first; it is third at best. It cannot supply its own prerequisite (no reach until paying customers file); the footer lands in front of the GC's compliance reviewer, and D1 excludes GCs; a document printed, scanned or faxed produces no click; there is no measurable coefficient with a cycle time, Weinberg & Mares' actual bar for calling anything viral; the footer is 7.5pt monospace optimised for provenance, not persuasion; and where a GC mandates a portal, what the GC sees may be an upload payload.

One cheap thing is specified, and half of it exists: a per-artifact short URL resolving to a public read-only provenance page — useful to the recipient, which is the only reason anyone clicks, and countable by us. **The footer already prints the URL and nothing serves it** (`src/app/(app)/_lib/filings.ts` (the `verifyUrl` field); no `/v/` route), which is a live defect on a shipped surface and is §1 row 5. `crm.verify.count` **[SPEC → `crm/CRM.md` §3; not built]** is specified to report `loop.verify_3p` (third-party loads per 100 artifacts, split by referrer and session class) and `loop.first_session_verify`. Both counters read null today, and a page that 404s would make them read null even after the job exists — the route is the prerequisite, not the counter.

**If it shows nothing, nothing is cut**, because no revenue line, channel budget or phase gate above depends on it. The failure this section forbids is the opposite one: computing a flattering coefficient after the fact from a number with no denominator. Until that denominator exists, no surface calls it a channel.

---

## 9. What we will not do

Not "not yet" — structurally cannot. The rows stay visible so the constraint's cost is itemised rather than hidden.

| Forbidden | Why |
|---|---|
| Sales calls, demos, quotes | A1. The mechanism is a person |
| Onboarding calls, including "only on annual plans" | A1 with a revenue qualifier; it manufactures exactly the expectation A3 must then refuse |
| Webinars, office hours, design-partner conversations | A scheduled human is a salesperson with a different noun on the invite |
| Warm outreach | The Core Four's cheapest quadrant, forfeited as the price of A1 |
| Cold outreach from award feeds | Retired on mechanism: 52,820 prime construction awards against 4,186 reported construction subcontracts (USASpending, 2026-08-13), first-tier-only reporting, and SAM exposes POC name and address only — emails are FOUO/CUI |
| BD and partner co-selling, incl. a shared channel with a GC's compliance lead | Co-selling aimed at a non-buyer |
| Trade shows | **Highest D1 reachability on the board.** A booth is a person standing in a room — this row is the itemised cost of the constraint |
| Offline events, speaking, PR and blog pitching, community participation | Zero on the autonomy axis, a gate and not a weight |
| ADP Marketplace; affiliate recruiting | ADP's agreement needs a named BD counterparty ("executed with your ADP Marketplace Business Development resource"); recruiting affiliates is BD |
| **Procore Marketplace** | Retired here, not parked. The listing journey ends in *"a standard agreement is signed"* (`developers.procore.com`, read 2026-08-13). A company with no humans cannot sign an agreement. A1 is a gate: this is a ruling, not a queue |
| **Gusto App Directory** | Production Pre-Approval and a Partnerships-team security review asking for SOC 2 Type 2 / ISO 27001 / PCI. The reviewer is a person and the artefacts do not exist |
| **Intuit QuickBooks App Store — moved from "parked" to "blocked pending one unread fact"** | An app-store review is a correspondence, not a submission: a review that returns required changes needs a responder, and this company has none. Re-fetched 2026-08-13, the review page's text could not be extracted by our reader, so **what happens on a rejection is unread** — and a channel kept alive on an unread fact is the failure mode §7 just closed. Revives only on a documented path where the sole response required is a resubmitted build, with no prose to a named reviewer |
| Any escalation path from the product to a person | A3 |

**Catch-all for every future proposal:** does the channel's output stop if nobody logs in on Monday? And its
R-H7 twin, which the marketplace rows above failed for three drafts: **what happens when they reply asking
for something?** If the answer is "someone writes back", the row is dead by A1 and belongs in this table
rather than in a parking bay.

---

## 10. What must be true before any performance claim

No argument unlocks a claim. Only a measurement job writing a counter does — §10.1 states which half of that path is built and which half is specification.

| Gate | Family it unlocks | Printable **today** instead / what unlocks it |
|---|---|---|
| **G1** | Correctness — accurate, exact, error-free | "All money arithmetic is deterministic code under property tests." · ≥500-line golden suite, ≥25 determinations, ≥8 states, 100% exact match, **30 consecutive green days** |
| **G2** | Acceptance by a GC, DIR or agency | "Generated to the DOL form geometry; the XML validates against the published schema. **Generated, not acceptance-tested.**" · ≥50 WH-347s and ≥25 CA eCPR files confirmed accepted |
| **G3** | Coverage — complete, nationwide, every determination | "N active determinations mirrored as of *(timestamp)*; reconciliation delta x%." · 60 days of zero unexplained delta above 0.5% |
| **G4** | Any time or money figure | "Ratepin reads a payroll CSV and writes the WH-347 and the eCPR XML. There is no queue and no turnaround window." · a measured in-product median across ≥100 real filings |
| **G5** | Any human-involvement figure | Silence. · 90 days below 2 min/customer/month at ≥50 paying accounts, the counter incrementing on **every** inbound message to the billing address — the party who benefits does not define the denominator |
| **G6** | The staleness guarantee as a promise | Silence. The mechanism may be built and may fire; it may not be marketed until the chaos test passes with upstream killed in staging |

### 10.1 What holds this today, and what does not

One of the three mechanisms exists. Saying which is the difference between a guarantee and a description of
one (12-Factor: the guarantee lives in the codebase; a guarantee living in a document *about* a codebase is
a checklist).

- **Built.** The gates are counters in the database, not statements in a document. `gates.refresh` runs
  hourly, `evaluateGate` is a pure function of those counters and the clock, and `gateSentence` returns
  `outcome: null` while a gate is `locked` or `regressed` — so a regression narrows the live sentence to the
  mechanism within one job interval, with nobody deciding (P-C).
- **Specified, not built.** `claims.json` **[SPEC → `CORRECTIONS.md` §5]**, its signing key and the
  renderer's signature check; **CL-1**, which is specified to fail the build if a measured-claim template
  appears outside the renderer; **CL-2**, specified to require every numeral on a Scope A surface to resolve
  to a dated source, and specified as the load-bearing check because it is a positive assertion with no
  false-positive rate to erode it; and `claims-lint` itself, which is specified to block the six struck
  families X-1…X-6 with no override flag.
- **Therefore, plainly:** *today a person with commit access can type a measured sentence into a page and
  ship it,* because no lint reads the page and no signature is checked. The sentence "a person with commit
  access still cannot promote a claim" is the specification's promise and it is not true of the repository
  as it stands. It becomes true when §1 rows 1 and 2 go green, and not before.

### 10.2 One outcome word that got through, and the probe that would have caught it

**F-1 forbids any assertion that our arithmetic, rates or classifications are accurate, correct, exact,
error-free or verified, until G1.** G1 has not been attempted. The phrase *"the geometry right"* shipped
anyway on `/wh347` — three words, read as tone, asserting correctness of our output, on the highest-traffic
surface with no account behind it, in a paragraph that also claims no accuracy claim appears on the page.

**Restated as mechanism, which was available in our own documents the whole time:** *"…and get the federal
form with the arithmetic computed by deterministic code and the form rendered to the DOL geometry."* That
is the G1 and G2 mechanism rows above, verbatim, and it needs no gate because the reader can check it.

**Added to the F-1 probe set, advisory rather than blocking** (per `CORRECTIONS.md` §3.2: a probe blocks
only after its red rate is measured, and these are outcome words with legitimate uses):
`geometry (is )?right` · `gets? it right` · `done right` · `(the |our )(arithmetic|math|geometry|rates?|classifications?|numbers?) (is|are) (right|correct)`. Deliberately **not** the bare word `correctly`: run over these four files it matches ordinary prose about someone else's behaviour ("returns DIR pages above everything else — correctly…"), and `CORRECTIONS.md` §3.2 rules that a probe whose red rate is all false positives is a specification bug rather than an incident. The register's own §3.5 lesson is that a string ban catches the copy-paste and only a
positive check catches the rewrite — **this was the rewrite**, it paraphrased rather than reprinted, and it
was found by reading. Both the copy in `outreach/free-tool-pages.md` §2.1 and the shipped string at
`app/src/app/(free)/wh347/page.tsx` (the lead paragraph) carry it; both owe the mechanism sentence.

---

## 11. Kill criteria for the whole GTM

Individual lines sit in §2–§5 and in `crm/channels.csv`. This is the criterion for the plan itself.

**The GTM is falsified if all three tests cross their pre-registered lines:** T1's diff-session → account conversion failing to exceed the generator's own at week 8 (§2's replacement for the invalid run-ratio line) *and* zero tool-originated paid conversions at week 12; T2 below 20% indexed share at week 12, or no month-over-month impression growth across three consecutive months; T3 at $2,000 cumulative spend with zero purchases, or cost per purchase above $47 for two consecutive weeks.

**A precondition on all three.** Each line above is read from a counter written by a `crm.*` job, and none of those jobs exists (BUILD STATE). A test cannot be falsified by a null, and a null must never be read as a pass. Until §1's gate is green, the correct report on all three tests is *not started* — which is also why nothing in this section may be reported as a result before the instrumentation lands.

What follows is enumerated now, because a menu written after a bad quarter is written under pressure:

1. **We do not add a salesperson.** Not permitted, not available. There is no fourth channel behind these three that A1 allows — the densest concentration of D1 in the country sits on a trade-association floor and stays unreachable.
2. **We do not iterate a losing template.** Delete. Iterating is how a dead channel keeps consuming engineering.
3. **Re-cut the offer** (Hormozi: the dream outcome is the GC releasing the draw, never time saved), **the frame** (Dunford: a comparison turning on an attribute we do not lead on is the wrong frame), or **the beachhead** (Moore: the surface must be one we can take).
4. **If all three have been re-cut once and the lines still fail, the verdict is not a channel verdict.** It is that D1 does not pay for the pin — a phase-1 finding, returned to phase 1 with the measurements attached.

Three failing tests are a result. Three failing tests plus an unwritten decision rule would have been a quarter of drift.

---

## References

**Fetched in-session, 2026-08-13**

- https://support.google.com/google-ads/answer/2375423 — "might spend up to twice your average daily budget"; "no more than 30.4 times your average daily budget" (§4)
- https://developers.google.com/webmaster-tools/limits — URL Inspection API per-site quota 2,000 QPD / 600 QPM (§3)
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap — `lastmod` used "if it's consistently and verifiably… accurate"; `priority` and `changefreq` ignored (§3)
- https://www.indexnow.org/documentation — batch submission, key file at domain root. **Correction:** this page carries no participant roster, so it cannot support any statement about who participates (§3)
- https://www.indexnow.org/searchengines.json — the participant roster, and the only artefact that carries one: **Bing, Yandex, Seznam, Naver, Yep, Internet Archive, Amazon Bot. Google is absent** (§3). The prose page at https://www.indexnow.org/searchengines lists document authors, not participants, and was twice mis-cited as the roster
- https://stripe.com/pricing — "2.9% + 30¢ per successful transaction"; Stripe Billing pay-as-you-go "0.7% of Billing volume" — the recurring rate used in §6
- https://lcptracker.com/solutions/lcpcertified/ — Plus package lines "$12 Per Report" and "Up to 5 Active Projects: $145/Month"; Professional package to $18,200/Year plus contact-for-unlimited. The page does not state whether the per-report line is purchasable without a project tier (§5)
- https://www.capterra.com/vendors/ — **HTTP 200** (an earlier draft recorded 403 from one network path); "Get Your Product Listed" → `https://app.g2digitalmarkets.com/get-listed/start`; **no price stated anywhere on the page** (§7)
- https://app.g2digitalmarkets.com/get-listed/start — HTTP 200, client-rendered shell; no fields, price or terms readable without executing JavaScript (§7)
- https://developer.intuit.com/app/developer/qbo/docs/go-live/list-on-the-app-store/what-to-expect-during-the-review — re-fetched; **our reader could not extract the page text**, so the review's failure path is recorded as unread, not as asynchronous (§9)
- https://www.acquisition.com/books — Hormozi's own book listing (*$100M Offers*, *$100M Leads*), cited in place of a summary site
- https://tractionbook.com/ — **HTTP 503 on 2026-08-13**; the book is cited by author and title, and the publisher URL is recorded with its status rather than presented as read

**Carried from the deep dives, each fetched on the date recorded there**

- https://www.federalregister.gov/documents/full_text/text/2024/08/30/2024-19482.txt — 89 FR 70670: 122,936 WH-347 respondents (§6)
- https://www.dol.gov/agencies/whd/government-contracts/prevailing-wage-resource-book/db-wage-determinations — "generally on Friday" (§3)
- https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-465 — §465.1(c)(4), §465.2, §465.4, §465.5, §465.6 (§7)
- https://developers.google.com/search/docs/essentials/spam-policies — scaled content and doorway abuse (§3)
- https://www.certifiedpayrollpro.com/ — "$49/mo + $5/report", "$99/mo + $3/report", "$249/mo + $1/report": every per-report price sits inside a subscription (§5) · https://fly.io/docs/about/pricing/ — the fixed-cost lines (§6) · https://www.usaspending.gov/ · https://open.gsa.gov/api/entity-api/ — award counts, FOUO/CUI fields (§9) · https://developers.procore.com/documentation/listing-your-app — "a standard agreement is signed" (§9) · https://docs.gusto.com/app-integrations/docs/introduction — Production Pre-Approval and security review (§9)

**Read in the codebase, 2026-08-13, for the BUILD STATE block and §1** — `app/src/worker/jobs.ts` (`JOB_REGISTRY`, sixteen jobs, no `crm.*`, no `pages.rebuild`) · `app/src/platform/ops/gates.ts` (`gateSentence`, `refreshClaimGates`) · `app/src/platform/billing/catalog.ts` (Solo 8 / Crew 40 / Multi unlimited; `RATE_CARD_PRICE_CENTS` 4900) · `app/src/platform/billing/pricing.ts` (`capCents = price(next) − price(current)`, `assessUsage`, `autoUpgradeNotice`) · `app/src/platform/billing/checkout.ts` · `app/src/app/(app)/_lib/filings.ts` (the `verifyUrl` field that composes the `/v/{id}` footer URL no route serves) · `app/src/app/(free)/wh347/page.tsx` (the lead paragraph) · `app/tests/`, `app/e2e/` · no `.github/workflows`, no `claims.json`, no `corrections.probes.json` anywhere in `run-2/`

**Internal, binding** — `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D1–D10, G1–G6 · `phase-1-ideation/research/03-gtm-pricing.md` §5–§7 · `CORRECTIONS.md` X-1…X-6, F-1…F-4, CL-1, CL-2, Scope A · `BRAND.md` §5, §5.5, §6.7, C-B2, C-B3, C-B5 · `ARCHITECTURE.md` §2.1, §7.1 · `phase-3-acquisition/research/01`–`04` · `crm/CRM.md`, `channels.csv`, `dashboard.md` · `outreach/launch-posts.md`, `community-playbook.md`, `free-tool-pages.md`, `lifecycle-emails.md`

**Literature**

- Weinberg & Mares, *Traction* — https://tractionbook.com/ — Bullseye; viral requires a measurable coefficient with a cycle time
- Hormozi, *$100M Leads* / *$100M Offers* — https://www.acquisition.com/training/offers — the Core Four; the value equation
- Ries, *The Lean Startup* — http://theleanstartup.com/ — a kill criterion written after the data is not one
- Dunford, *Obviously Awesome* — https://www.aprildunford.com/obviously-awesome — move the frame when the category forces a comparison you lose
- Moore, *Crossing the Chasm* — https://www.geoffreyamoore.com/ — beachhead before breadth
- Poyar, *Growth Unhinged* — https://www.growthunhinged.com/p/your-guide-to-saas-metrics-20 — value-metric predictability; net new ARR against burn
- Ramanujam & Tacke, *Monetizing Innovation* — https://www.monetizinginnovation.com/ — tiers differentiated by leaders, not capacity
- Helmer, *7 Powers* — https://7powers.com/ — the moat as assembly, latency and crosswalk memory (R-HIGH7)
