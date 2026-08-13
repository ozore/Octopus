# Channel Research — Ratepin

**Subject:** Bullseye applied honestly under the A1–A6 autonomy gate. Rank every plausible channel; specify three tests; state what is dead and why it stays dead.
**Method:** Weinberg & Mares' Bullseye (brainstorm 19 → rank → three concurrent cheap tests → one inner-ring channel), with Hormozi's Core Four as a completeness cross-check; Dunford on frame, Moore on beachhead, Ries on pre-registered thresholds, Poyar on what a self-serve funnel affords.
**Status:** internal strategy memo. Nothing here is copy. Every figure carries its source and read date.
**Date:** 2026-08-13. **Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D1–D10, G1–G6 · `phase-2-build/CORRECTIONS.md` · `identity/BRAND.md`.

---

## 1. The filter that runs before Bullseye

Bullseye ranks on impact, confidence and cost. A1–A6 add a prior test that disqualifies before ranking begins:

> **If the channel's yield is a function of someone being awake, it is not a channel we have.**

Hormozi's Core Four is the cross-check, because it collapses all nineteen channels into four mechanisms: warm outreach, cold outreach, free content, paid ads. Warm outreach is a person, structurally — there is no automated form of "message everyone you know." That removes one box of four and with it the fastest path to the first five customers in the literature. **Ratepin forgoes the cheapest lead source there is, as the price of A1.**

Three axes: **(a)** compounds with zero human minutes; **(b)** evidenced reachability of D1 — open-shop specialty subs, 5–75 field employees, the person who signs the compliance statement; **(c)** cost to test.

One constraint on (b) governs everything below. The D1 slice is **uncounted**: no source splits the 122,936 DBRA certified-payroll respondents (89 FR 70670, 30 Aug 2024) by open shop, prime/sub or headcount (`research/01` §8.6). And `old.reddit.com` was unreachable from this environment again today, as in phase 1. **No channel below is justified by anything a contractor is said to have posted somewhere.**

---

## 2. The brainstorm, scored

Scores 0–3. Ring: inner = test now, middle = probable, dead = disqualified.

| # | Channel | (a) Compounds, no human | (b) D1 reachability | (c) Cost to test | Ring |
|---|---|---|---|---|---|
| 1 | Targeting blogs | 0 — outreach is a person | 1 | med | **Dead** |
| 2 | Publicity / PR | 0 — pitching is a person | 1 | med | **Dead** |
| 3 | Unconventional PR | 0 | 0 | med | **Dead** |
| 4 | **SEM (paid search)** | 1 — rents, never compounds | **3** | cash, bounded | **Inner — T3** |
| 5 | Social & display ads | 1 | 1 — title targeting plausible, intent low | cash | Middle |
| 6 | Offline advertising | 0 | 1 | high | **Dead** |
| 7 | **SEO, programmatic, corpus-fed** | **3** | **3** | engineering only | **Inner — T2** |
| 8 | Content marketing | 2 — only if machine-generated | 2 | engineering only | Folded into T2 |
| 9 | Email marketing | 2 | 1 — no independent source of addresses | low | Middle, §4 |
| 10 | Viral — the artifact loop | 3 *if* real | 1 | instrumentation | Middle — §6 |
| 11 | **Engineering as marketing** | **3** | **3** | engineering only | **Inner — T1** |
| 12 | BD / partner co-selling | 0 | 2 | high | **Dead** |
| 13 | Sales | 0 | 3 | n/a | **Dead by A1** |
| 14 | Affiliate programs | 1 | 2 | low | Middle, §4 |
| 15 | Existing platforms (marketplaces) | 2 | 2 | blocked, §4 | Parked |
| 16 | Trade shows | 0 | **3** — best on the board | high | **Dead** |
| 17 | Offline events | 0 | 2 | high | **Dead** |
| 18 | Speaking engagements | 0 | 2 | med | **Dead** |
| 19 | Community building | 0 | unverifiable | med | **Dead** |

Row 16 is left visible on purpose. The place where D1 is densest and most identifiable is a trade-association floor, and it is unreachable because a booth is a person standing in a room. That is a real cost of the constraint, not a scoring artefact.

---

## 3. Dead, and the three disguises it returns in

Dead: **sales, BD and partner co-selling, trade shows, offline events, speaking, community building, PR of every kind, targeting blogs, offline advertising.** Each scores 0 on (a), and (a) is a gate, not a weight.

They do not come back as "light touch." Three disguises, refused by name:

1. **"Just a short onboarding call on annual plans."** A1's prohibited onboarding call with a revenue qualifier attached. It manufactures the expectation A3 must then refuse, which is worse than never offering it.
2. **"A webinar / office hours / a design-partner conversation."** A scheduled human is a salesperson with a different noun.
3. **"A shared channel with the GC's compliance lead."** Partner co-selling, aimed at a non-buyer: D1 excludes GCs and `BRAND.md` §1 Step 5 puts them in "cares little."

Catch-all test: **does the channel's output stop if nobody logs in on Monday?**

---

## 4. Parked, with the condition that revives each

- **Existing platforms (QuickBooks App Store, Procore, ADP).** Distribution where the payroll CSV already lives, blocked by a human gate on the *platform's* side: Intuit's technical review team schedules a call with developers for a first-time listing, review averages ~20 days, and listings are re-reviewed annually (Intuit Developer blog, 27 Mar 2025). We have nobody to attend a call. Revives on a fully asynchronous submission path.
- **Email / free WD-change alerts** (D8 channel 3). Cheap and compounding, but **not an acquisition channel**: no independent source of subscribers, so it is a conversion layer on whatever fills it. Partly substituted at source — SAM.gov exposes a "follow" function that re-subscribes users to determinations and alerts them when changes occur (DOE PF 2019-24, 31 May 2019). Ours differentiates only *after* an account has filings, because the differentiating sentence is "four of your filings used the superseded modification." Build it behind T2; do not test it as a channel.
- **Affiliate.** Self-serve affiliate signup is zero-human; *recruiting* affiliates is BD. `davisbaconrates.com` is affiliate-supported and monetises by referring demos (`research/02`). We have no demo to refer, so we are structurally the worse payer.
- **Cold outreach from award feeds** (D8 channel 4). **Demoted below programmatic SEO, and the mechanism fails, not merely the volume.** `research/01` found FY2025 reporting of 52,820 prime construction awards against 4,186 construction subcontracts, with DBRA Related Acts work producing no contractor rows at all. Added today: SAM's public entity extract **excludes point-of-contact email, phone and fax as CUI**. There is no lawful, machine-readable, self-serve email list of D1 in the federal data we depend on.

---

## 5. The three tests

Thresholds written before the data, per Ries. T1 and T2 are coupled — T1 makes the asset, T2 makes it findable — but their kill criteria are independent, which is what Bullseye's "three concurrent" requires.

### T1 — Engineering as marketing: the free modification-diff checker

**Asset.** Two free, no-account tools on one renderer. (i) The unlimited WH-347 generator D3 requires — table stakes, and `BRAND.md` C-B2 forbids calling it differentiation. (ii) The tool nobody else ships: **enter a WD number and an award date, get every modification published since, with the per-classification rate diff**, each row carrying WD number, modification, publication date and mirrored source URL. Both artifacts carry the §6.7 footer. No email wall (C-B3).

**Why this asset.** The free-generator category treats the determination as an input that never reaches the output: `constructionbids.ai`'s generator tells the user to enter "the wage determination number from your contract documents" and does not render it on the form; PrevailComply offers "one federal WH-347 for free" with one-click CA DIR XML and publishes no revision history (both read 2026-08-13). The diff view is U1 made free and falsifiable in ten seconds — the pre-paywall proof `BRAND.md` §5.6 requires.

**Signal.** Completed diff runs per week; diff runs as a ratio of plain-generator runs; free-tool session → account creation.

**Kill.** Kill the differentiation hypothesis if diff runs do not exceed plain-generator runs by week 8 — a direct test of whether provenance is the draw, which is the load-bearing assumption of the whole brand (`BRAND.md` §10). Hard kill if zero paid conversions originate in tool sessions by week 12.

**Cost.** Engineering only. The corpus is crawled nightly already under D5 and hosting sits inside the ≈$175/month fixed platform cost in `research/03` §5. Cash ≈ $0 incremental; the cost is calendar.

### T2 — Programmatic SEO, on the revision history rather than the rate

**Asset.** Generated from the mirror: one page per wage determination showing its modification history with dated per-classification diffs; county × craft rate pages as a secondary surface.

**The honest re-ranking.** D8 put county × craft first. That surface is now held by three maintained competitors, all read 2026-08-13: `wagefinder.org` ("492,044 Wages And Growing," weekly updates, paid API upsell), `davisbaconwages.com` (50 states plus DC/GU/PR/VI, "Updated weekly," latest 12 Aug 2026, free, no login, already offering free wage alerts), and `davisbaconrates.com`. Per Dunford, entering a frame whose comparison turns on an attribute we do not lead on is a positioning error; per Moore, the beachhead must be a surface we can take. **None of the three publishes modification history or diffs.** That is where the pages go.

**Signal.** Indexed pages as a share of published; impressions month over month; clicks into the T1 tools; assisted account creation. Instrumented with Search Console — free, self-serve, no human. Secondary read on answer-engine visibility: AI referral traffic is roughly 1% of web traffic in 2026, and ChatGPT-referred visits to B2B sites reached 2.6M/month in June 2026 against ~645,000 a year earlier (Labs by Demandbase, via Demand Gen Report). Small, growing, cheap to observe rather than chase.

**Kill.** Kill if by week 12 indexed pages are under 20% of published, or impressions fail to grow month over month for three consecutive months. Kill the county × craft sub-surface independently if it reaches page one for no head term by week 16 — losing that fight is the expected outcome and must not drag the WD pages down with it.

**Cost.** Engineering only, cash ≈ $0. The cost is time-to-signal, in months.

### T3 — SEM, framed as an instrument rather than a channel

**Asset.** A narrow high-intent keyword set (wage-determination modification, WH-347 with the determination on it, eCPR XML) pointed at the $49 bid rate card — the pre-account SKU `research/03` §6 calls an acquisition instrument rather than a revenue line.

**Why it is inner-ring despite scoring 1 on compounding.** It is the only channel here that returns a *money* answer in weeks. T1 and T2 say nothing for months, and both sit downstream of one unmeasured belief: that this buyer pays for the pin. Poyar's caution that CAC payback misleads for self-serve is respected by metering cost per purchase, never cost per click.

**Signal.** Measured cost per $49 purchase. CPC is an output of this test, not an input.

**Kill.** Stop at $2,000 cumulative spend with zero purchases — bounded, and under two Solo CACs against the $1,038 affordable-CAC ceiling in `research/03` §6. Stop when cost per $49 purchase exceeds $47 for two consecutive weeks: the rate card's contribution is $46.98 (`research/03` §5), so above that line the instrument stops self-funding and becomes a subsidy.

**Cost.** $2,000, capped, with a daily budget cap that fails closed.

---

## 6. The artifact loop is a hypothesis, not a mechanism

D8 names it first: every WH-347 travels weekly to a GC and often several other parties carrying its provenance footer. It is the most attractive idea in the plan and the least supported; `BRAND.md` §10 already lists it as "plausible, cheap, unmeasured." Six reasons not to plan against it:

1. **It cannot supply its own prerequisite.** Zero reach until paying customers generate filings. Calling it the *first* channel is a sequencing error; it is at best the third.
2. **The recipient is the wrong person.** The footer lands in front of the GC's compliance reviewer, and D1 excludes GCs. Conversion needs a second hop — that reviewer's *other* subs — which we neither control nor observe.
3. **Nothing reports back.** A footer on a PDF that is printed, scanned or faxed has no click. Left as designed it yields a number indistinguishable from zero while feeling obviously true, which is the worst available combination.
4. **There is no coefficient.** Weinberg & Mares' bar for viral is a measurable k with a cycle time. Nothing currently specified would let us compute one.
5. **The footer was optimised for a different job.** `BRAND.md` §6.7 makes it 7.5pt monospace, non-configurable, with no marketing language — correct for provenance, deliberately handicapped for persuasion.
6. **Adverse selection and path loss.** A sub may prefer the GC not know the vendor, and where the GC mandates a portal the file the GC sees may be an upload payload rather than our PDF.

**What makes it measurable, at near-zero cost, and should be built now:** a per-artifact short URL in the footer resolving to a public read-only verification page for that artifact's provenance tuple. Useful to the recipient — the only reason anyone clicks — and countable by us. Report **third-party verification loads per 100 artifacts generated**, separating first-party re-checks by referrer and session, and **accounts whose first session began at a verification URL**. Until that counter has a real denominator the loop falls under the same discipline as G1–G6: no plan assumes yield from it, and no surface describes it as a channel.

---

## 7. Sequencing, and what this rests on

Build T1 and T2 together, run T3 alongside, instrument the loop from the first generated artifact. Bullseye's inner ring is one channel; the honest expectation is that T2 becomes it while T3 says within six weeks whether to keep building.

Flagged as hypotheses: that search demand for the diff surface exists at all — revealed by three competitors maintaining free corpus-fed sites weekly, never measured by us; that provenance outdraws price in a browser tab; that the diff page survives being copied, which it can be, since the corpus rents for $19/month (`CORRECTIONS.md` X-1); that a free tool with no email wall converts; and that the artifact loop has any yield at all.

---

## References

**Fetched or searched in-session, 2026-08-13**

- https://growthmethod.com/traction-channels/ — the 19 traction channels and the three Bullseye rings, as enumerated
- https://tractionbook.com/ — Weinberg & Mares, *Traction*; the Bullseye method
- https://www.shortform.com/blog/100m-leads-alex-hormozi/ — Hormozi, *$100M Leads*; the Core Four
- https://wagefinder.org/ — "492,044 Wages And Growing"; weekly automatic updates; free lookup with paid API upsell
- https://davisbaconwages.com/ — 50 states plus DC/GU/PR/VI; "Updated weekly," latest 12 Aug 2026; "Free, no login required"; SAM.gov-sourced; free wage alerts offered
- https://davisbaconrates.com/prevailing-wage-rates — free state → county → trade rate lookup
- https://prevailcomply.com/ — "generate one federal WH-347 for free"; CA DIR XML "in one click"; no price on the page
- https://constructionbids.ai/tools/sub/wh-347-payroll-generator — free WH-347 generator; instructs the user to enter "the wage determination number from your contract documents"; does not render it on the output
- https://www.energy.gov/node/4241465 — DOE PF 2019-24, 31 May 2019: "a 'follow' function is available to re-subscribe to wage determinations and receive alerts when changes occur"
- https://open.gsa.gov/api/sam-entity-extracts-api/v1/public_extract_layout.pdf — SAM entity public extract layout; POC email, phone and fax are CUI and excluded
- https://open.gsa.gov/api/entity-api/ — SAM Entity Management API, public data fields
- https://blogs.intuit.com/2025/03/27/speed-through-the-review-process-to-list-on-the-quickbooks-app-store/ — three-part review; the technical review team schedules a call for a first-time listing
- https://developer.intuit.com/app/developer/qbo/docs/go-live/publish-app/technical-requirements — 14 technical requirements; annual re-review
- https://satvasolutions.com/blog/intuit-app-store-approval-timeline-developer-guide — technical review averaging ~20 days
- https://marketplace.procore.com/ — Procore App Marketplace; listing runs through a partner program
- https://www.demandgenreport.com/industry-news/news-brief/demandbase-chatgpt-referrals-to-b2b-websites-nearly-quadrupled-in-a-year/54113/ — Labs by Demandbase: ChatGPT-referred visits to B2B sites 2.6M/month in June 2026 from ~645,000 in June 2025
- https://www.similarweb.com/blog/marketing/geo/gen-ai-stats/ — AI referral traffic ≈1% of total web traffic in 2026
- https://sam.gov/wage-determinations — wage determination source of record
- https://www.federalregister.gov/documents/2024/08/30/2024-19482/agency-information-collection-activities-comment-request-information-collections-davis-bacon — 89 FR 70670: 122,936 respondents; 11,310,112 annual responses
- `old.reddit.com` — unreachable from this environment on 2026-08-13, as in phase 1; no forum-voice evidence is used above

**Literature**

- Gabriel Weinberg & Justin Mares, *Traction* — Bullseye; the nineteen channels; viral claims require a measurable coefficient
- Alex Hormozi, *$100M Leads* — the Core Four; warm outreach as the cheapest first source, and the one we structurally forgo
- April Dunford, *Obviously Awesome* — https://www.aprildunford.com/obviously-awesome — move the frame when the obvious category forces a comparison you lose
- Geoffrey Moore, *Crossing the Chasm* — beachhead selection applied to the page surface, not only the segment
- Eric Ries, *The Lean Startup* — pre-registered thresholds; a kill criterion written after the data is not one
- Kyle Poyar, *Growth Unhinged* — https://www.growthunhinged.com/p/your-guide-to-saas-metrics-20 — why CAC payback misleads for self-serve, hence cost-per-purchase as T3's meter

**Internal, binding**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D1, D3, D4, D8, D9, G1–G6
- `run-2/phase-1-ideation/research/01-demand-pmf.md` — §4 subaward reporting; §8 the uncounted D1 slice; the unreachable forums
- `run-2/phase-1-ideation/research/02-competition-positioning.md` — §1.4 the occupied free-tool and rate-lookup layer
- `run-2/phase-1-ideation/research/03-gtm-pricing.md` — §5 unit economics and the $46.98 rate-card contribution; §6 affordable CAC
- `run-2/phase-2-build/CORRECTIONS.md` — the struck-claims register; X-1 on the rentable corpus
- `run-2/phase-2-build/identity/BRAND.md` — §5.6 pre-paywall proof; §6.5 surface map; §6.7 the footer; C-B2, C-B3; §10 hypotheses
