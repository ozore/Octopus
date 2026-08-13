# GTM Playbook — Ratepin, Day 1 to Day 90

**Subject:** the sequenced go-to-market for a company with no employees. Per phase: what ships, which scheduled jobs run it, the single metric that decides continue or kill, and the decision rule — written before the data (Ries).
**Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D1–D10, G1–G6 · `CORRECTIONS.md` · `BRAND.md` §5. This file is **Scope A**: every numeral resolves to a dated source or to arithmetic shown in place.
**Status:** draft on disk. Nothing here has been sent, posted or submitted anywhere. **Date:** 2026-08-13.

---

## 0. The constraint that sets the sequence

A1 deletes warm outreach structurally — there is no unattended form of "message everyone you know" — and `research/03` found no lawful machine-readable list of D1 to build cold outreach from. Two of Hormozi's four quadrants are gone before day 1, and nine of Weinberg & Mares' nineteen channels score zero on the autonomy axis, dying at the gate rather than in the ranking.

What remains: **two assets that compound unattended** (free tools, programmatic pages), **one instrument that rents a fast money answer** (capped paid search), and **one loop we instrument but never plan against** (the artifact footer). That is the order below, because it is the order in which each can produce a number. Every phase advances because a job wrote a counter and `crm.review.close` read it on a Monday.

---

## 1. Day 0 — the pre-flight gate

Six build gates, not checklist items: `claims-lint` returns zero blocking matches over `phase-3-acquisition/**` and all rendered copy, no override flag; `claims.json` is signed and fresh, and the renderer verifies the signature before any measured sentence; the artifact footer ships on every emitted document at every tier including free, non-configurable; the per-artifact verification URL resolves to a public read-only provenance page — the loop's only denominator; analytics are cookieless, which is why nothing sits between a visitor and the tool; Stripe Checkout completes a $49 purchase with no account (D4).

**Metric:** preconditions green ÷ 6. **Rule:** below 6/6, day 1 does not begin. A kill criterion evaluated against a null counter is not a kill criterion.

---

## 2. Phase A — Days 1–14: the free tools

**Ships.** `/wh347`, the unlimited free WH-347 generator, no account, no email wall (D3; C-B3) — table stakes, already shipped by PrevailComply, constructionbids.ai and DOL, so it is the **control arm** and never a differentiator (C-B2). Beside it `/wd/[number]/diff`: a determination number plus an award date returns every modification published since with the per-classification rate diff, each row carrying its modification, publication date and mirrored source URL — which none of the four free rate sites publishes. Plus the public corpus status page, `/changelog`, the colophon, and the machine-readable revision feed.

**Jobs.** `pages.rebuild`; `crm.tool.funnel` 03:20 ET; `crm.verify.count` 04:30; `crm.dashboard.render` 05:00; `crm.review.close` Mondays 04:40; `retention.sweep` purging tool inputs at 24 hours. Lifecycle: `magic_link` only — no other message exists because no account does.

**Metric.** `t1.pqs`, product-qualified starts: sessions that reached a **rendered artifact carrying the footer**. Not sessions, not pageviews (Poyar).

**Rule.** Day 14 is an instrumentation gate, not a kill: if `t1.gen_runs`, `t1.diff_runs`, `t1.pqs` or `loop.verify_3p` is still null, Phase B publication and Phase C spend both freeze. A missing day is recorded as missing, never interpolated. T1's two real kill lines fall later and are already written: **kill the differentiation hypothesis if `t1.diff_ratio` < 1.0 at week 8** — diff runs failing to exceed plain-generator runs directly tests whether provenance outdraws the commodity tool, the load-bearing assumption of the brand — and **hard kill if `t1.tool_to_paid` is zero at week 12**.

---

## 3. Phase B — Days 8–30: programmatic rollout and the indexation ramp

**Ships.** ~500 pages across the beachhead states, all four templates: state hub, county hub, determination × craft rate page carrying that craft's full revision history, and `/wd/[number]/changes`, the per-classification change log. Counties covered by the same determination **share one page**; separate pages would be byte-identical duplicates. The publication gate is enforced by columns, not judgement: **a page ships only if it carries the per-classification revision diff or a crosswalk entry.** Anything else is a reformatted table and is not published. Ceiling discipline: the naive county × class index runs to ~479,000 rows, while the defensible supply is 9,424 revision documents minus 4,236 active determinations = **5,188 supersession events**, 1.1% of it.

**Indexation ramp, tied to promotion rather than to a calendar.** `pages.rebuild` runs off the 02:00 ET crawl and is *skipped entirely if the snapshot did not promote*; only pages whose rate rows changed regenerate. Sitemap `lastmod` therefore carries **last changed**, never last verified: Google says it uses `lastmod` "if it's consistently and verifiably… accurate" (fetched 2026-08-13), so re-stamping unchanged pages nightly degrades the one machine-readable signal we control. IndexNow fires on the same diff; its documentation does not list Google, so nothing depends on it. DOL publishes determination changes "generally on Friday", which is when the change log earns its keep.

**Jobs.** `pages.rebuild`; `crm.sc.pull` 04:00 (Search Console); `crm.index.sample` 04:10 — the URL Inspection API allows **2,000 queries/day and 600/minute** per site (verified 2026-08-13), so indexed share is a sampled estimate published **with its n**, never a census presented as one; `crm.awards.pull` monthly, supplying page **build order only**, never an address.

**Metric.** `t2.indexed_share`, with n.

**Rule.** Day 30: if the cohort trails the free-generator control arm, cohort 2 is not published. Week 12: kill below 20% indexed share, or on no month-over-month impression growth across three consecutive months. Week 16: kill the county × craft sub-surface independently if it reaches page one for no head term — losing that fight is expected and must not drag the determination pages with it. Day 90: **any template below the control arm is deleted, not iterated.**

---

## 4. Phase C — Days 15–56: the $49 Bid Rate Card, the first paid proof

The $49 one-time bid rate card — the sheet a sub prices a job from — is purchasable **before an account exists** (D4). Its job is not revenue: at $46.98 contribution and instantaneous payback, each unit funds ~$47 of acquisition at zero payback risk. It is the cheapest test of the belief everything else sits downstream of — **that this buyer pays for the pin** — and T1 and T2 say nothing for months.

**Ships.** Stripe Checkout on the pre-account SKU; the rate-of-record certificate as the delivered artifact; a narrow high-intent keyword set (wage-determination modification; WH-347 showing the determination; eCPR XML) pointed at it.

**The cap is ours, not the platform's.** Google states a campaign "might spend up to twice your average daily budget" on a given day and "no more than 30.4 times your average daily budget" in a month (fetched 2026-08-13) — there is no lifetime cash cap to delegate to. So `crm.sem.meter` reads spend and purchases daily at 04:20 ET, computes cost per purchase, and **sets the daily cap to zero when a kill line is crossed**; unreadable spend is treated as at-cap, so the failure direction is to stop spending. That job is the only reason a capped cash test is A5-compliant.

**Metric.** `t3.cost_per_purchase`. CPC is an output of this test, never an input (Poyar: payback misleads for self-serve, so meter cost per purchase).

**Rule.** Stop at **$2,000 cumulative spend with zero purchases** — under two Solo affordable-CAC budgets. Stop when cost per purchase **exceeds $47 for two consecutive weeks**: above the $46.98 contribution line the instrument stops self-funding and becomes a subsidy. `crm.review.close` executes both; the halt is a job's write.

---

## 5. Phase D — Days 30–90: expansion with no salesperson

The ladder is $0 · $49 · $99 Solo · $249 Crew · $599 Multi, with **no project caps and no worker caps at any tier**. Expansion runs on the meter: included filings per tier, then **$2.50 per certified filing overage, capped at the next tier's price with automatic upgrade at the cap** — inside the meter the market already validated ($1–$12 per report on published competitor pages, read 2026-08-13), at 97%+ contribution.

Why it expands unattended: the value metric is the certified filing — one per project per week, arithmetic the buyer already does before purchase (Poyar's predictability test), metered from generated artifacts. Ramanujam's configuration rule is honoured by differentiating tiers on **leaders** (revision-of-record pinning, diff since award, classification memory; then eCPR XML, change alerts, portal export bundles; then the dispute-grade archive) rather than on capacity. A cap is a wall, and a wall is a churn event.

**Jobs.** `allowance_warning`, `auto_upgrade_fired`, the dunning set, `staleness_credit_posted`, `archive_export_link` on cancel — outbound-only, idempotent, with the in-product notice normative and the message a convenience.

**Metric.** `mo.net_new_vs_burn` — net new ARR against cash burned.

**Rule.** If by day 90 **no account has crossed an allowance boundary**, the filing is not behaving as the value metric and the ladder is re-cut *before* any channel spend rises. Acquiring into a mis-cut ladder is the expensive version of this mistake.

---

## 6. Funnel arithmetic

Sourced, no assumption required (`phase-1/research/03` §5; `ARCHITECTURE.md` §2.1):

| Quantity | Value | Derivation |
|---|---|---|
| Variable cost per certified filing | **≈$0.06** | ≈$0.05 model + ≈$0.01 compute and retention; free tier makes zero model calls |
| Contribution, $49 rate card | **$46.98** (95.9%) | $49 − $1.72 Stripe − $0.30 variable |
| Contribution, Solo / Crew / Multi | **$94.36 / $236.62 / $569.34** (≈95%) | at 13 / 52 / 130 filings per month |
| Fixed platform cost | **$66/mo verified floor, $175/mo ceiling** | Fly and Postgres list prices; the ceiling carries the page build, monitoring, storage growth |
| After the credit reserve | **≈91%** | 4% of MRR for self-serve refunds and staleness credits, neither with a human gate |

Three consequences needing no forecast: **one Solo account covers the verified fixed floor** ($66 ÷ $94.36 = 0.70) and two cover the ceiling ($175 ÷ $94.36 = 1.85); **paid search self-funds at 43 purchases** ($2,000 ÷ $46.98 = 42.6), which is what the $47 line encodes; **affordable CAC at an 11-month payback ceiling** is Solo $1,038, Crew $2,607, Multi $6,259 — so the constraint is not affordability but that no conversion rate has been measured. The assumed part is labelled and **inverted**: the model outputs a required number, not a predicted one.

> **ASSUMPTION F1.** Let `c` = composite conversion from a `/rates/` or `/wd/` entry session through a tool run and an account to a paid subscription. `c` is unmeasured. Sessions needed to cover the $175 ceiling with two Solo accounts = 2 ÷ `c`: at `c` = 0.5%, 400 qualified sessions per month; at `c` = 0.1%, 2,000. **Neither is a forecast.** They bracket the answer, printed now so the first measured `c` meets something written beforehand.
>
> **ASSUMPTION F2.** Filing volume is seasonal; metered MRR contracts in winter. Annual billed at ten months is the hedge, and a January dip is not churn.
>
> **ASSUMPTION F3.** The D1 slice is uncounted — no source splits DOL's 122,936 WH-347 respondents by open shop, prime or sub, or by headcount. No addressable-market figure appears in this plan (C-B5).

---

## 7. Community contributions and their disclosure

**We may publish objects; we may not participate in conversations.** 16 CFR §465.1(c)(4) states that in an interactive electronic medium "the disclosure must be unavoidable" and is not clear and conspicuous "if a consumer must take any action, such as clicking on a hyperlink or hovering over an icon, to see it." That eliminates the comfortable version — a small vendor link under a helpful answer — and forces the standing disclosure into the body of the post, where the pitch would otherwise go. That is the correct outcome, and most of the reason this section is short.

**Permitted, shipping in Phase A:** the free directory listing (factual fields only), the machine-readable revision feed, the changelog, the colophon, the verification page — each carrying the standing disclosure in full or one-line form. **If a venue's field is too short for even the one-line form, we do not post there**; the shortness is the finding, not an obstacle to route around.

**Refused by name:** answering questions in help forums; correcting errors about our own product in someone else's thread; any review of Ratepin by anyone with a material relationship to it (§465.2, §465.5); incentivised review solicitation (§465.4); engagement signals from a company account (§465.1(h)); an operated account carrying a person's name or face; the "why we built this" founder story, whose whole persuasive force is the implied person; paying anyone to post for us (§465.5(b)(1) returns the duty to us anyway); any "alternatives" property we own (§465.6). Show HN and Product Hunt disqualify us in their own published rules.

**Metric and rule.** None, deliberately. This is a placement, not a channel: no spend to stop, no yield to forecast. A kill line would dignify it as something it is not.

---

## 8. If the artifact loop shows nothing

D8 names the artifact loop first; it is third at best. It cannot supply its own prerequisite (no reach until paying customers file); the footer lands in front of the GC's compliance reviewer, and D1 excludes GCs; a document printed, scanned or faxed produces no click; there is no measurable coefficient with a cycle time, Weinberg & Mares' actual bar for calling anything viral; the footer is 7.5pt monospace optimised for provenance, not persuasion; and where a GC mandates a portal, what the GC sees may be an upload payload.

One cheap thing is built: a per-artifact short URL resolving to a public read-only provenance page — useful to the recipient, which is the only reason anyone clicks, and countable by us. `crm.verify.count` reports `loop.verify_3p` (third-party loads per 100 artifacts, split by referrer and session class) and `loop.first_session_verify`.

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
| ADP Marketplace; affiliate recruiting | ADP's agreement needs a named BD counterparty; recruiting affiliates is BD |
| Any escalation path from the product to a person | A3 |

**Catch-all for every future proposal:** does the channel's output stop if nobody logs in on Monday?

---

## 10. What must be true before any performance claim

No argument unlocks a claim. Only a measurement job writing a signed flag does.

| Gate | Family it unlocks | Printable **today** instead / what unlocks it |
|---|---|---|
| **G1** | Correctness — accurate, exact, error-free | "All money arithmetic is deterministic code under property tests." · ≥500-line golden suite, ≥25 determinations, ≥8 states, 100% exact match, **30 consecutive green days** |
| **G2** | Acceptance by a GC, DIR or agency | "Generated to the DOL form geometry; the XML validates against the published schema. **Generated, not acceptance-tested.**" · ≥50 WH-347s and ≥25 CA eCPR files confirmed accepted |
| **G3** | Coverage — complete, nationwide, every determination | "N active determinations mirrored as of *(timestamp)*; reconciliation delta x%." · 60 days of zero unexplained delta above 0.5% |
| **G4** | Any time or money figure | "Ratepin reads a payroll CSV and writes the WH-347 and the eCPR XML. There is no queue and no turnaround window." · a measured in-product median across ≥100 real filings |
| **G5** | Any human-involvement figure | Silence. · 90 days below 2 min/customer/month at ≥50 paying accounts, the counter incrementing on **every** inbound message to the billing address — the party who benefits does not define the denominator |
| **G6** | The staleness guarantee as a promise | Silence. The mechanism may be built and may fire; it may not be marketed until the chaos test passes with upstream killed in staging |

Three things make this hold unattended. `claims.json` is written only by the measurement jobs, signed with a key living only in their environment. **CL-1** fails the build if a measured-claim template appears outside the renderer. **CL-2**, the load-bearing check, requires every numeral on a Scope A surface to resolve to a dated source — a positive assertion, so it has no false-positive rate to erode it, and it catches the fluent plausible number nobody fetched. A person with commit access to every file still cannot promote a claim. The six struck families in `CORRECTIONS.md` X-1…X-6 are not gated: they are false, and CI blocks them with no override flag.

---

## 11. Kill criteria for the whole GTM

Individual lines sit in §2–§5 and in `crm/channels.csv`. This is the criterion for the plan itself.

**The GTM is falsified if all three tests cross their pre-registered lines:** T1's diff ratio below 1.0 at week 8 *and* zero tool-originated paid conversions at week 12; T2 below 20% indexed share at week 12, or no month-over-month impression growth across three consecutive months; T3 at $2,000 cumulative spend with zero purchases, or cost per purchase above $47 for two consecutive weeks.

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
- https://www.indexnow.org/documentation — batch submission, key file at domain root, Google not listed among participants (§3)

**Carried from the deep dives, each fetched on the date recorded there**

- https://www.federalregister.gov/documents/full_text/text/2024/08/30/2024-19482.txt — 89 FR 70670: 122,936 WH-347 respondents (§6)
- https://www.dol.gov/agencies/whd/government-contracts/prevailing-wage-resource-book/db-wage-determinations — "generally on Friday" (§3)
- https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-465 — §465.1(c)(4), §465.2, §465.4, §465.5, §465.6 (§7)
- https://developers.google.com/search/docs/essentials/spam-policies — scaled content and doorway abuse (§3)
- https://lcptracker.com/solutions/lcpcertified/ · https://www.certifiedpayrollpro.com/ — the per-report meter (§5) · https://stripe.com/pricing · https://fly.io/docs/about/pricing/ — cost lines (§6) · https://www.usaspending.gov/ · https://open.gsa.gov/api/entity-api/ — award counts, FOUO/CUI fields (§9)

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
