# offer/ — memory file (WageLens Offer & Landing agent, wave 1)

**Started:** 2026-09-03. **Agent:** Offer & Landing (WageLens). **Status:** deliverables complete (RESEARCH.md, OFFER.md, LANDING_SPEC.md); awaiting wave-1b review.

## Scope
Writes only under `phase-4-revenue/wagelens/`: `OFFER.md`, `LANDING_SPEC.md`,
`offer/RESEARCH.md`, and this file. No code. No commits. No sign-ups.

## Rules confirmed (PLAN.md / PIPELINE.md)
- Six stages: ideation → research → verification → writing → review → iteration.
  This agent runs 1–4 and self-reviews; wave 1b reviewer runs stage 5.
- Sources are opened, not remembered. Every load-bearing claim carries a fetched URL + date.
- Two attempts per source, then log the failure and move on.
- Never invent testimonials, numbers, logos or success rates.
- Guarantees create founder liabilities (A5) — flag every one, propose a safer alternative.
- Prices/guarantees are proposals; founder validates before Stripe (P12).
- Blocked domains: reddit.com, facebook.com, yelp.com.

## Log
- Read PLAN.md, PIPELINE.md, PREREQUISITES.md, shortlist.json (WageLens entry),
  phase-3 prospects README (ICP + 21 excluded incumbents = competitor list),
  phase-1 research/03-gtm-pricing.md (rigour template), phase-2 landing page (voice template).
- PERSONA.md / IDENTITY.md not present at start (Buyer & Identity agent still running).
  Re-check before writing LANDING_SPEC.md palette tokens.

## Research log — sources fetched (2026-09-03)

**Incumbents (first party):** lcptracker.com/ · lcptracker.com/solutions/lcpcertified/ (PUBLISHED prices) ·
lcptracker.uservoice.com/forums/923176-lcpcertified (real contractor complaints) ·
points-north.com/certified-payroll-reporting · points-north.com/trends-and-insights/the-real-cost-of-davis-bacon-violations ·
emarsinc.com/ · elationsys.com/ · ebacon.com/ · myconstructionpayroll.com/ ·
foundationsoft.com/payroll-processing-for-construction/ · certifiedpayrollpro.com/ + /pricing +
/blog/best-lcptracker-alternatives-2026 · davisbaconrates.com/certified-payroll-software

**Regulatory (first party):** dol.gov/agencies/whd/forms/wh347 (55-minute burden statement!) ·
.../construction/faq/conformance · .../government-contracts/construction ·
.../prevailing-wage-resource-book/dbra-investigative-procedures-remedies (3-yr debarment, withholding,
prime liability) · dol.gov/agencies/whd/data ($259M FY2025) · eCFR API 29 CFR 5.5 · eCFR API 29 CFR 1.6
(revision/10-day/90-day/anniversary rules) · sam.gov/content/wage-determinations

**Conversion / pricing:** nngroup how-users-read-on-the-web (79% scan, 124% combined) ·
nngroup f-shaped-pattern (n=232) · unbounce.com/conversion-benchmark-report/ (grade-level 11.1% vs 5.3%;
word-count −18.6%) · copyhackers.com/2020/09/saas-websites-is-shorter-copy-really-better/ ·
cxl.com/blog/how-to-build-a-high-converting-landing-page/ ·
growthunhinged.com/p/how-to-improve-free-to-paid-conversion (8% median, 30% card-on-file, 14-day 62%) ·
solutions.trustradius.com/vendor-blog/2023-b2b-disconnect/ (54% / 72% / 38%, n=1,604) ·
creatoreconomy.so value equation · aestudio.au + jessenyokabi.substack Suby 8 phases ·
getmonetizely decoy-effect (secondary, flagged)

## Failed sources (2 attempts each, logged and moved on)
- `apps.adp.com/en-us/apps/253943` → "Login to see prices"; `/pricing` path 404. Points North's
  $175/mo + $7.50/report + $995–4,995 setup is therefore **second-hand** (identity agent + a competitor
  blog). Flagged in RESEARCH.md, must not be stated as fact in customer-facing copy.
- `g2.com/products/lcptracker/reviews` → 403. `capterra.com/p/145936/LCPtracker/reviews/` → served an
  unrelated product (DealerBuilt). `trustradius.com/products/lcptracker/reviews` → 403.
  `softwareadvice.com/construction/lcptracker-profile/` → 404. **Review aggregators are closed to this
  environment.** Substitute: LCPtracker's own uservoice forum (better — first-party user words).
- `federalregister.gov/documents/2023/08/23/2023-17221/...` → 302 to unblock.federalregister.gov.
  Substitute: DOL prevailing-wage resource book (first party) for prime liability + debarment.
- `acquisition.com/books/offers` 404; `/training/offers4` renders no equation text. Substitute:
  creatoreconomy.so (secondary, states the equation verbatim).
- `sabrisuby.com/the-godfather-strategy/` → 503. `medium.com/@acgoff/...` → 403.
- `open.gsa.gov/api/wage-determination-api/` (cited in PREREQUISITES P8) → **404 today**.
  **RESOLVED later the same day by the Product Owner agent:** `KNOWLEDGE_BASE.md` §F1 documents the
  unauthenticated endpoints sam.gov's own front end calls (index, full text, `/history`, county
  dictionary), all verified working, with superseded revisions permanently retrievable. That last
  property is what makes both the revision differentiator and the Provenance Guarantee possible.
  **PREREQUISITES P8 should be amended** — the api.data.gov key it asks for is not needed for this.
- `priceintelligently.com/blog/pricing-page-design` → 404 (ProfitWell/Paddle sunset the blog).
- `openviewpartners.com/blog/pricing-transparency-study` → firm wound down, article gone.
- `contractortalk.com` search → 307 to a tollbit paywall gateway. Reddit blocked by constraint.
  **Consequence: no unmediated contractor voice-of-customer.** The uservoice forum is the only
  genuine buyer language obtained; everything else is vendor-mediated. Flagged as the #1 research gap.

## Key findings that changed the offer
1. **DOL's own burden statement on WH-347: "an average of 55 minutes to complete this collection of
   information."** This is the time number the whole offer hangs on — first-party, unarguable.
2. **CertifiedPayrollPro ($49/$99/$249 + per-report, 14-day no-card trial) is a direct, transparent,
   cheaper competitor that did not exist in the phase-1 shortlist's competitive picture.**
   ~~Its feature list does not include wage-determination lookup or WD-change alerts; that gap is the
   wedge.~~ **← SUPERSEDED. See the STAGE-3 VERIFICATION section below: they have both.** What is true
   and survives: "we are the transparent one" is not a differentiator either, because they publish too.
3. **LCPcertified publishes prices** ($145/mo up to 5 projects; $7,400/yr unlimited; $12/report).
   The "quote-gated $175–2,000/mo" framing in shortlist.json is only half true and must be restated.
4. **29 CFR 1.6 gives honest, dated urgency** (revisions, the 10-day rule, the 90-day rule, the
   anniversary-date update) with no invention required.
5. **$13,508 is dead** (identity agent V1, independently consistent with what Points North publishes:
   "up to $10,000+ per violation", no authority cited). Never use it.

## STAGE-3 VERIFICATION — the finding that changed the answer (2026-09-03, after first draft)

Re-opening the two most load-bearing competitor pages (as PIPELINE stage 3 requires) overturned the
wedge the first draft was built on.

**The first draft claimed:** CertifiedPayrollPro's feature list contains no wage-determination lookup
and no change alerts, so "the rate" is our differentiator.

**What is actually true, verified at first party 2026-09-03:**
- `certifiedpayrollpro.com/wage-lookup` is a **free public Davis-Bacon lookup by state / county /
  construction type**, "Search Davis-Bacon prevailing wage determinations from SAM.gov instantly",
  "50 States covered", "10,000+ Wage determinations", "Results are pulled directly from SAM.gov",
  and explicitly **"100% Free, No Account Required" / "No account, no trial, no catch."**
  It also offers **"Get prevailing wage rate change alerts—We'll email you when wage rates change in
  your state."**
- `certifiedpayrollpro.com/prevailing-wage-calculator` is computation-only ("Replace them with the
  base and fringe rates from your project's wage determination") and points users at that Wage Lookup.
- `lcptracker.com/solutions/lcpcertified/` includes **"CA Wage Verification"**: "The system maintains
  California wage determinations and provides ability for users to manually upload wage determinations
  for other states."
- `prevailingwagelookup.com` is a **second** free public lookup — "30,623 Wage Determinations",
  "56 States Covered", "1935 Counties", "not affiliated with the U.S. government".

**→ A free county-level rate lookup is a COMMODITY, not a wedge.** Any document in this repo that
says otherwise is wrong. The first drafts of RESEARCH.md §0-D2, OFFER.md §2.2/§3.2 and
LANDING_SPEC.md §1 all said otherwise and were corrected.

**What survives verification as genuinely unheld ground** (searched for on every incumbent page
fetched; found on none):
1. **The revision, carried through to the filed form and still reproducible three years later.**
   29 CFR 1.6 fixes the applicable determination at solicitation/award, so today's rate is often not
   his rate. KB-3 shows superseded revisions stay fetchable forever, so we can pin a project to the
   revision its contract locked and reproduce it during the 3-year retention window
   (5.5(a)(3)(ii)(G)). **No competitor page describes revision history or contract-revision pinning.**
2. **Per-determination, per-classification alerts** — theirs is "when wage rates change in your state".
3. **A flat price with no per-report meter** — every competitor with a published price meters reports.

**The wedge moved from "the rate" to "the rate you can still prove in three years."** That is a
better wedge: harder to copy, maps to the buyer's actual fear (the audit, not the lookup), and is the
only claim that gets stronger the longer a customer stays. The free lookup still ships — it is the
trust mechanism and the funnel — but it is **parity, not advantage**, and must never be headlined
as though it were new.

**Lesson for the next agent:** a feature-list absence is not a feature absence. Read the free-tools
pages and the footer nav, not just the pricing page.

## Advice to the next agent (wave 1b reviewer, and whoever builds this)

1. **Attack the revision claim first.** Everything differentiating in OFFER.md and LANDING_SPEC.md now
   rests on one idea: the buyer cares which modification his contract locked. It is well-grounded in
   29 CFR 1.6 and it is unheld ground, but it is **untested with a buyer** and it is subtle. If it does
   not survive review, the offer degrades to a price argument against a cheaper competitor.
2. **The three deliverables are internally consistent as of this writing.** RESEARCH.md §3.6,
   OFFER.md §1/§2.2/§3.2/§6.3/§11, LANDING_SPEC.md §1/§4-H6/§5.5/§13 all carry the same corrected
   position. If you change one, change all four places.
3. **Do not re-add `$13,508`, a per-violation penalty, a Davis-Bacon-specific back-wage total, or any
   accuracy/hours-saved/customer-count claim.** LANDING_SPEC.md §5 lists what is forbidden and why.
4. **The Points North price ($175/mo + $7.50/report + $995–4,995 setup) is second-hand.** ADP
   Marketplace answers "Login to see prices". Comparison tables must print "price not published".
5. **Word budgets are load-bearing, not decoration.** LANDING_SPEC.md §2 carries budget-vs-actual per
   section (436/450). Every copy change must be re-counted; the build checklist puts it in CI.
6. **What I could not get:** unmediated contractor voice-of-customer (reddit blocked; G2/Capterra/
   TrustRadius/SoftwareAdvice all 403/404; contractortalk behind a paywall gateway). The only genuine
   buyer language in this fleet is ~7 lines from LCPtracker's uservoice forum. **The first 50 outbound
   replies in wave 3 are worth more than all of the vendor pages put together — mine them.**
7. **CertifiedPayrollPro's lookup was never driven end-to-end** (interactive, cannot be operated from
   here). Whether it shows determination and modification numbers is unverified. Check with a browser
   before freezing any comparative provenance claim.

## Final pass (2026-09-03, after PERSONA.md / IDENTITY.md / design-system.css landed)
- **Read them and bound to them.** Two corrections absorbed: (a) the buyer's word is **modification**,
  not "revision" (PERSONA.md vocabulary; the determination itself prints "Modification Number") —
  all customer-facing copy in OFFER.md and LANDING_SPEC.md now says modification; (b) the palette
  binds to the semantic `--wl-*` custom properties in `design-system.css`, with a mapping table at the
  top of LANDING_SPEC.md. Never hard-code a hex from the spec.
- **Independent convergence, worth telling the reviewer:** IDENTITY.md §UA2 ("the determination
  archive is versioned, and it tells you when your job's rate moves… nobody in Tier A–D sells
  mid-project change alerting to the *sub*") and §UA3 ("published price… against B it is parity, not
  advantage") were reached by the Buyer & Identity agent from different evidence and match
  RESEARCH.md §3.6 and D5 exactly. Two agents, two evidence bases, one answer.
- **G2 partly closed:** PERSONA.md §4.3 reached Capterra and Software Advice, which this agent could
  not. Use it as the voice-of-customer source; RESEARCH.md §3.4 is the thin supplement, not the main.
- Final word budget: **436 / 450** above the pricing block, per-section table in LANDING_SPEC.md §2.
- Sources cited in RESEARCH.md §8: **36 entries across 25 distinct hosts** (minimum was 15).
