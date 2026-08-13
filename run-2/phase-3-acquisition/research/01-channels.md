# Channel Research — Ratepin

**Subject:** Bullseye under the A1–A6 autonomy gate. Rank every plausible channel, specify three tests, state what is dead and why it stays dead.
**Method:** Weinberg & Mares' Bullseye (brainstorm 19 → rank → three concurrent cheap tests → one inner-ring channel), cross-checked against Hormozi's Core Four; Dunford on frame, Moore on beachhead, Ries on pre-registered thresholds, Poyar on self-serve metering.
**Status:** internal memo, not copy. Every external figure carries its source and read date.
**Date:** 2026-08-13. **Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D1–D10, G1–G6 · `CORRECTIONS.md` · `BRAND.md`.

---

## 1. The gate that runs before Bullseye

Bullseye ranks on impact, confidence and cost. A1–A6 add a prior test that disqualifies before ranking begins:

> **If the channel's yield is a function of someone being awake, it is not a channel we have.**

Hormozi's Core Four collapses the nineteen channels into warm outreach, cold outreach, free content and paid ads. Warm outreach is a person structurally — there is no automated form of "message everyone you know" — so one box of four is gone, and with it the literature's fastest path to the first customers. **Ratepin forgoes the cheapest lead source there is, as the price of A1.**

Ranking axes: **(a)** compounds with zero human minutes; **(b)** evidenced reachability of D1 — open-shop specialty subs, 5–75 field employees, whoever signs the compliance statement; **(c)** cost to test.

One constraint on (b) governs everything below: the D1 slice is **uncounted** — no source splits the 122,936 DBRA certified-payroll respondents (89 FR 70670) by open shop, prime/sub or headcount — and `old.reddit.com` was unreachable from this environment again today, as in phase 1. **No channel below is justified by anything a contractor is said to have posted somewhere.**

---

## 2. The brainstorm, scored

Scores 0–3. Ring: inner = test now, middle = probable, dead = disqualified by (a).

| # | Channel | (a) No human | (b) D1 reach | (c) Cost | Ring |
|---|---|---|---|---|---|
| 1 | Targeting blogs | 0 — the pitch is a person | 1 | med | **Dead** |
| 2 | Publicity / PR | 0 — the pitch is a person | 1 | med | **Dead** |
| 3 | Unconventional PR | 0 | 0 | med | **Dead** |
| 4 | **SEM (paid search)** | 1 — rents, never compounds | **3** | bounded cash | **Inner — T3** |
| 5 | Social & display ads | 1 | 1 — low intent | cash | Middle |
| 6 | Offline advertising | 0 | 1 | high | **Dead** |
| 7 | **SEO, programmatic** | **3** | **3** | engineering | **Inner — T2** |
| 8 | Content marketing | 2 — if generated | 2 | engineering | Into T2 |
| 9 | Email marketing | 2 | 1 — no lawful list | low | Middle (§4) |
| 10 | Viral — artifact loop | 3 *if* real | 1 | instrumentation | Middle (§6) |
| 11 | **Engineering as marketing** | **3** | **3** | engineering | **Inner — T1** |
| 12 | BD / partner co-selling | 0 | 2 | high | **Dead** |
| 13 | Sales | 0 | 3 | n/a | **Dead by A1** |
| 14 | Affiliate programs | 1 | 2 | low | Middle (§4) |
| 15 | Existing platforms | 2 | 2 | blocked | Parked (§4) |
| 16 | Trade shows | 0 | **3 — best on board** | high | **Dead** |
| 17 | Offline events | 0 | 2 | high | **Dead** |
| 18 | Speaking engagements | 0 | 2 | med | **Dead** |
| 19 | Community building | 0 | unverifiable | med | **Dead** |

Row 16 is visible deliberately: where D1 is densest is a trade-association floor, unreachable because a booth is a person standing in a room. A real cost of the constraint, not a scoring artefact.

---

## 3. Dead, and the three disguises it returns in

Nine channels score 0 on (a) — **sales, BD and partner co-selling, trade shows, offline events, speaking, community building, PR, targeting blogs, offline advertising** — and (a) is a gate, not a weight, so no amount of (b) rescues them. They do not come back as "light touch." Three disguises, refused by name:

1. **"Just a short onboarding call on annual plans."** A1's prohibited onboarding call with a revenue qualifier attached. It manufactures precisely the expectation A3 must then refuse — worse than never offering it.
2. **"A webinar, office hours, or a design-partner conversation."** A scheduled human is a salesperson with a different noun on the calendar invite.
3. **"A shared Slack channel with the GC's compliance lead."** Partner co-selling aimed at a non-buyer: D1 excludes GCs, and `BRAND.md` §1 Step 5 files them under "cares little."

Catch-all test for any later proposal: **does the channel's output stop if nobody logs in on Monday?**

---

## 4. Parked, with the condition that revives each

- **Existing platforms (QuickBooks App Store, Procore, ADP).** Distribution where the payroll CSV already lives, blocked by a human gate on the *platform's* side. Two things were wrong with the earlier version of this row and both flattered the channel.

  **First, the timing.** Intuit's own documentation states staged technical / security / marketing review with targets of **3 / 7 / 5 business days** (`research/04` §3.2). A vendor blog reports real-world timelines of **six weeks to six months**. Both may be true — target versus observed — but a target read from the platform and an observation read from a blog are different classes of evidence, and `CORRECTIONS.md` §0.1 rules that the blog figure is *repeated, not sourced*. **Both are recorded here; neither is carried forward alone.**

  **Second, and decisively: a review is a correspondence, not a submission.** The revival condition as written — "a fully asynchronous submission path" — measured the wrong thing. Submitting is asynchronous; being *rejected* is not, because a review that returns required changes returns them to a person, and this company has no responder. Re-fetched 2026-08-13, Intuit's review page could not be read in full by our reader, so **what happens on a rejection remains unread**. Per R-H7 the row therefore leaves the parking bay: it is blocked by A1 until the rejection path is read and shown to require nothing but a resubmitted build. Procore (a signed agreement), Gusto (a Partnerships-team review) and ADP (a named BD counterparty) are not parked at all — they are dead by A1 and sit in `GTM_PLAYBOOK.md` §9.

  **The question this row failed for three drafts, now asked of every platform: *what happens when they reply asking for something?*** If the answer is "someone writes back", the channel is gone, and the honest place for it is the retired list rather than a softer verb.
- **Email / free WD-change alerts** (D8 channel 3). Compounding, but **not acquisition**: with no independent source of subscribers it is a conversion layer on whatever fills it — and partly substituted at source, since SAM.gov's follow function alerts on changes (DOE PF 2019-24) and `davisbaconwages.com` already offers free alerts. Ours differentiates only *after* an account has filings ("four of your filings used the superseded modification"). Build it behind T2.
- **Affiliate.** Self-serve *signup* is zero-human; *recruiting* affiliates is BD. `davisbaconrates.com` monetises by referring demos; we have none, so we are structurally the worse payer.
- **Cold outreach from award feeds** (D8 channel 4). **Demoted below programmatic SEO — the mechanism fails, not merely the volume.** FY2025 reporting shows 52,820 prime construction awards against 4,186 reported construction subcontracts, and DBRA Related Acts work produces no contractor rows at all. Confirmed today: SAM's public entity data exposes POC **name and address only**; "points of contact email address, phone, and fax numbers" are FOUO/CUI. There is no lawful, machine-readable, self-serve email list of D1 in the federal data we depend on.

---

## 5. The three tests

Thresholds written before the data, per Ries; a kill criterion authored afterwards is not one. T1 and T2 are coupled — T1 makes the asset, T2 makes it findable — but their kill criteria are independent, as Bullseye's "three concurrent" requires.

### T1 — Engineering as marketing: the free modification-diff checker

**Asset.** Two free, no-account tools on one renderer: (i) the unlimited WH-347 generator D3 requires — table stakes, and `BRAND.md` C-B2 forbids calling it differentiation; (ii) the tool nobody else ships — **enter a WD number and an award date, get every modification published since, with the per-classification rate diff**, each row carrying modification, publication date and mirrored source URL. Both outputs carry the §6.7 footer. No email wall (C-B3).

**Why this asset.** The free layer is occupied but shallow (all read 2026-08-13): PrevailComply gives "one federal certified payroll report" free without signup; `constructionbids.ai` makes the user type the determination number and never renders it on the output; `davisbaconwages.com` publishes weekly rates, "Free, no login required"; `wagefinder.org` advertises "492,044 Wages And Growing" and sells an API. **None publishes modification history or diffs.** The diff view is U1 made free and falsifiable in ten seconds — the pre-paywall proof `BRAND.md` §5.6 requires.

**Signal.** Completed diff runs per week; diff runs as a ratio of plain-generator runs, **descriptive, with no verdict attached**; free-tool session → account creation, **split by tool**.

**Kill.** *Corrected — the earlier line could not answer its own question.* It read: kill the differentiation hypothesis if diff runs do not exceed plain-generator runs by week 8. The two tools do not share a population. The generator needs nothing — type a crew or your own rates; the diff checker needs a determination number **and** an award date the visitor must already hold. Requiring the constrained tool to out-run the unconstrained one tests input availability, not draw, so a ratio below 1.0 is the expected outcome *even if provenance is exactly the draw* — which pre-registered the plan to kill its own load-bearing assumption on a measurement that cannot speak to it. Ries' requirement is that a threshold be written before the data **and** be capable of answering the question asked; only the first half was satisfied.

**The replacement, population-matched:** kill the differentiation hypothesis at week 8 if **diff-session → account creation does not exceed generator-session → account creation**, each computed inside its own denominator (`crm/dashboard.md` §2.1, `t1.tool_to_account` split by tool). That compares conversion within each tool's own traffic, which is what "is provenance the draw" actually asks. Hard kill unchanged: zero paid conversions originating in tool sessions by week 12.

**Cost.** Engineering only; the corpus is already crawled nightly under D5 and hosting sits inside the ≈$175/month fixed platform cost. Incremental cash ≈ $0.

### T2 — Programmatic SEO, on the revision history rather than the rate

**Asset.** Generated from the mirror: one page per wage determination showing its modification history with dated per-classification diffs; county × craft pages secondary. D8 put county × craft first, but the sites above already hold it, refreshing weekly. Per Dunford, entering a frame whose comparison turns on an attribute we do not lead on is a positioning error; per Moore, a beachhead must be a surface we can take. Revision history is the surface none of them publishes.

**Signal.** Indexed pages as a share of published; impressions month over month; clicks into the T1 tools; assisted account creation. Instrumented with Search Console — free, self-serve, no human.

**Kill.** Kill if by week 12 indexed pages are under 20% of published, or impressions fail to grow month over month for three consecutive months. Kill the county × craft sub-surface *independently* if it reaches page one for no head term by week 16 — losing that fight is expected and must not drag the WD pages with it.

**Cost.** Engineering only, cash ≈ $0. The real cost is time-to-signal, in months.

### T3 — SEM, framed as an instrument rather than a channel

**Asset.** A narrow high-intent keyword set (wage-determination modification, WH-347 showing the determination, eCPR XML) pointed at the $49 bid rate card — the pre-account SKU `phase-1/research/03` §6 calls an acquisition instrument rather than a revenue line.

**Why inner-ring despite scoring 1 on compounding.** It is the only channel that returns a *money* answer in weeks. T1 and T2 say nothing for months, and both sit downstream of one unmeasured belief: that this buyer pays for the pin. Poyar's caution that CAC payback misleads for self-serve is honoured by metering cost per purchase, never cost per click.

**Signal.** Measured cost per $49 purchase. CPC is an output of this test, not an input.

**Kill.** Stop at $2,000 cumulative spend with zero purchases — **42.6 rate cards at the $46.98 contribution line** ($2,000 ÷ $46.98), which is the unit this test buys. (The earlier framing, "under two Solo CACs against the $1,038 affordable-CAC ceiling", borrowed an eleven-month subscription LTV to make a cap on a one-time SKU look conservative; that ceiling also assumes eleven months of retention, which nothing measures — `GTM_PLAYBOOK.md` §6, ASSUMPTION F4.) Stop when cost per $49 purchase exceeds $47 for two consecutive weeks: the rate card's contribution is $46.98, so above that line the instrument stops self-funding and becomes a subsidy.

**Cost.** $2,000, capped — **by a job that does not exist yet.** The daily-budget-to-zero meter is `crm.sem.meter`, specified in `crm/CRM.md` §3 and absent from the app's job registry (`app/src/worker/jobs.ts`, sixteen jobs, no `crm.*`). Google publishes no lifetime cash cap to delegate to, so until that job runs and is observed writing a zero, **this test cannot be started at all**: an uncapped card in an unattended company is the A5 failure, not the A5 mechanism.

---

## 6. The artifact loop is a hypothesis, not a mechanism

D8 names it first: every WH-347 travels weekly to a GC and often several other parties, carrying its provenance footer. It is the most attractive idea in the plan and the least supported; `BRAND.md` §10 lists it as "plausible, cheap, unmeasured." Six reasons not to plan against it:

1. **It cannot supply its own prerequisite.** Zero reach until paying customers generate filings. Calling it the *first* channel is a sequencing error; it is at best the third.
2. **The recipient is the wrong person.** The footer lands in front of the GC's compliance reviewer, and D1 excludes GCs. Conversion needs a second hop — that reviewer's *other* subs — which we neither control nor observe.
3. **Nothing reports back.** A footer on a PDF that is printed, scanned or faxed has no click. As designed it yields a number indistinguishable from zero while feeling obviously true: unfalsifiable and flattering at once.
4. **There is no coefficient.** Weinberg & Mares' bar for viral is a measurable *k* with a cycle time. Nothing specified lets us compute one.
5. **The footer was optimised for a different job** — 7.5pt monospace, non-configurable, no marketing language (§6.7): correct for provenance, handicapped for persuasion.
6. **Adverse selection and path loss.** A sub may prefer the GC not know the vendor, and where the GC mandates a portal, what the GC sees may be an upload payload, not our PDF.

**What makes it measurable at near-zero cost, and is half-built today — in the wrong half:** a per-artifact short URL in the footer resolving to a public read-only verification page for that artifact's provenance tuple. **The footer already prints that URL and no route serves it** (`app/src/app/(app)/_lib/filings.ts` (the `verifyUrl` field); there is no `/v/` route in `src/app`), so the recipient who does exactly what this section hopes for reaches a 404 — the one shipped surface where the loop is currently worse than not instrumented. The short URL described here — useful to the recipient, which is the only reason anyone clicks, and countable by us. Report **third-party verification loads per 100 artifacts generated**, separating first-party re-checks by referrer and session, plus **accounts whose first session began at a verification URL**. Until that counter has a denominator, the loop falls under G1–G6's discipline: no plan assumes yield from it, and no surface calls it a channel.

---

## 7. Sequencing, and what this rests on

Build T1 and T2 together, run T3 alongside, instrument the loop from the first artifact. Bullseye's inner ring resolves to one channel; the honest expectation is that T2 becomes it, while T3 says within six weeks whether to keep building.

Flagged as hypotheses: that search demand for the diff surface exists at all — inferred from three competitors maintaining free corpus-fed sites weekly, never measured by us; that provenance outdraws price in a browser tab; that the diff pages survive being copied, which they can be, since the corpus is rentable at $19/month (`CORRECTIONS.md` X-1); that a free tool with no email wall converts; and that the artifact loop has any yield at all.

---

## References

**Fetched or searched in-session, 2026-08-13**

- **Bullseye and the nineteen channels are cited to the book itself** — Gabriel Weinberg & Justin Mares, *Traction* — and not to a summary of it. The governing framework of this phase was previously sourced to `growthmethod.com/traction-channels/`, and Hormozi's Core Four to `shortform.com/blog/100m-leads-alex-hormozi/`; both are the category `CORRECTIONS.md` §0.1 calls **repeated, not sourced**, and it is not defensible for the framework doing the most work in the document to rest on the weakest evidence in it. Both remain listed below as **convenience links, marked as such**, and nothing above turns on either
- https://growthmethod.com/traction-channels/ — *secondary summary, not a source.* Convenience link for the channel enumeration
- https://tractionbook.com/ — the publisher page for *Traction*. **HTTP 503 on 2026-08-13**; recorded with its status rather than presented as read
- https://www.acquisition.com/books — Hormozi's own listing for *$100M Offers* and *$100M Leads*, fetched 2026-08-13, cited in place of the summary site
- https://www.shortform.com/blog/100m-leads-alex-hormozi/ — *secondary summary, not a source.* Convenience link only
- https://prevailcomply.com/ — "Create one federal certified payroll report without starting from a blank form"; free generator without signup; no price on the page
- https://davisbaconwages.com/ — "Data updated: August 12, 2026"; "Data updates weekly"; "Free, no login required"; WD reference shown; free alerts offered; no modification history or diffs
- https://wagefinder.org/ — "492,044 Wages And Growing"; weekly automatic updates; API key and paid subscription; no revision history
- https://constructionbids.ai/tools/sub/wh-347-payroll-generator — free WH-347 generator; the user supplies the determination number and it is not rendered on the output
- https://open.gsa.gov/api/entity-api/ — SAM Entity Management API: public level exposes POC "name and address" only; "points of contact email address, phone, and fax numbers" are FOUO/CUI
- https://developer.intuit.com/app/developer/qbo/docs/go-live/publish-app/technical-requirements — apps are reviewed against technical requirements before listing on the QuickBooks App Store
- https://developer.intuit.com/app/developer/qbo/docs/go-live/list-on-the-app-store/what-to-expect-during-the-review — the platform's own review stages and 3 / 7 / 5 business-day targets (recorded in `research/04` §3.2). **Re-fetched 2026-08-13: our reader could not extract the page text, so the rejection path is unread** (§4)
- https://satvasolutions.com/blog/intuit-app-store-approval-timeline-developer-guide — *a vendor blog, i.e. repeated and not sourced (`CORRECTIONS.md` §0.1).* Developer-reported real-world timelines of six weeks to six months, recorded beside the platform's targets and not carried forward alone
- https://www.energy.gov/node/4241465 — DOE PF 2019-24: SAM.gov "follow" function alerts users when wage determinations change
- https://davisbaconrates.com/prevailing-wage-rates — free state → county → trade lookup, affiliate-supported
- https://www.federalregister.gov/documents/2024/08/30/2024-19482/agency-information-collection-activities-comment-request-information-collections-davis-bacon — 89 FR 70670: 122,936 respondents; 11,310,112 annual responses
- https://sam.gov/wage-determinations — wage determination source of record
- `old.reddit.com` — unreachable from this environment on 2026-08-13, as in phase 1; no forum-voice evidence is used above

**Literature**

- Gabriel Weinberg & Justin Mares, *Traction* — Bullseye; the nineteen channels; viral claims require a measurable coefficient
- Alex Hormozi, *$100M Leads* — the Core Four; warm outreach as the cheapest first source, and the one we structurally forgo
- April Dunford, *Obviously Awesome* — https://www.aprildunford.com/obviously-awesome — move the frame when the obvious category forces a comparison you lose
- Geoffrey Moore, *Crossing the Chasm* — beachhead selection, applied to the page surface as well as the segment
- Eric Ries, *The Lean Startup* — pre-registered thresholds; a kill criterion written after the data is not one
- Kyle Poyar, *Growth Unhinged* — https://www.growthunhinged.com/p/your-guide-to-saas-metrics-20 — why CAC payback misleads for self-serve, hence cost-per-purchase as T3's meter

**Internal, binding**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D1, D3, D4, D8, D9, G1–G6
- `run-2/phase-1-ideation/research/01-demand-pmf.md` — §4 subaward reporting; §8 the uncounted D1 slice; the unreachable forums
- `run-2/phase-1-ideation/research/02-competition-positioning.md` — the occupied free-tool and rate-lookup layer
- `run-2/phase-1-ideation/research/03-gtm-pricing.md` — §5 unit economics and the $46.98 rate-card contribution; §6 affordable CAC
- `run-2/phase-2-build/CORRECTIONS.md` — the struck-claims register; X-1 on the rentable corpus
- `run-2/phase-2-build/identity/BRAND.md` — §5.6 pre-paywall proof; §6.7 the footer; C-B2, C-B3; §10 hypotheses
- `run-2/phase-3-acquisition/research/02-demand-seo.md` — the SERP survey and page-universe sizing behind T2
