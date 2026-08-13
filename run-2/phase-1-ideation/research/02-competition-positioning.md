# Competition and Positioning — Wage Line

**Subject:** Wage Line — certified-payroll rate-of-record engine for open-shop specialty subs on Davis-Bacon work.
**Method:** April Dunford's *Obviously Awesome* positioning process; Hamilton Helmer's *7 Powers*; Christensen's disruption test; Moore's beachhead logic. All pricing below was pulled live and is dated.
**Date:** 2026-08-13. **Binding decisions respected:** D1–D10. Challenges are marked.

---

## 0. Three findings that change the pitch

**Finding 1 — the incumbent already publishes self-serve prices, and they are lower than ours.** LCPtracker's contractor-side product **LCPcertified** publishes a full price list on its own product page (verified live, 2026-08-13): **$12 per report**, or **Up to 5 Active Projects: $145/Month**, 10 projects $1,300/yr, 25 $2,500/yr, 50 $3,700/yr, unlimited $7,400/yr on the *Plus* package; the *Professional* package runs $1,900/yr (10 projects) to $18,200/yr (450). Plus already includes **CA DIR XML Export, WA State L&I XML Export, MD DLLR XML Export**, "the updated WH-347 form with expanded fringe reporting, apprentice details, and worker classification fields," and payroll import compatible with HH2. The shortlist's "incumbents are demo-and-quote at $175–$1,200/mo with $995–$4,995 setup fees" is true of the *agency* products (LCPtracker Pro, eBacon, Points North, eMars, Elation) and **false of the contractor product built by the same vendor**. D4's Crew tier ($249/mo, 5 projects, CA eCPR) is **72% more expensive than LCPcertified Plus at the same project count with three states of XML instead of one.**

**Finding 2 — the wage-determination archive is not a cornered resource.** The dossier's moat rests on "SAM overwrites, and a superseded revision is gone." It does not. `GET https://sam.gov/api/prod/wdol/v1/wd/WA20200002/0/download` returns HTTP 303 to a signed S3 object `WDOL_FILES_PROD/DBA/ARCHIVE/FY2020/wa2.r0.txt` — 26,809 bytes of plain text opening *"General Decision Number: WA20200002 01/03/2020 / Superseded General Decision Number: WA20190002."* Same for `CA20250001/5`. The bucket is not listable (403) and the unsigned path 403s, so you must know `(wdNumber, revision)` — but that is a bounded crawl, not an impossibility. Worse, **someone already sells it**: govconapi.com offers a SAM.gov wage-determination API at **$19/mo Developer, $39/mo Pro**, self-serve with a free 14-day key, covering 90,033 determinations (68,737 DBA), ~495,000 per-classification rate lines, **every superseded revision retained**, with `active_only` and `date_from`/`date_to` filters. Per Helmer, a resource you can rent for $19/month is not cornered.

**Finding 3 — the exact product exists, self-serve, today.** **PrevailComply** sells certified payroll to "small subcontractors on government-funded public works," generates WH-347 *and* one-click California DIR XML, validates prevailing wage, fringe and **apprentice ratios**, works alongside QuickBooks/Gusto/ADP, explicitly does not run payroll or e-file — and leads with a **free WH-347 generator** and "start free." That is D3's wedge and D8's channel-1 funnel, already shipped by a competitor.

---

## 1. The landscape, in four tiers

### 1.1 Agency-mandated portals (the sub does not choose these, and often does not pay)

| Vendor | Buyer | Price | Gating | Weakness |
|---|---|---|---|---|
| **LCPtracker Pro** | Agencies, primes | Not published; third-party reviews report ~$300–$1,200/mo, volume-quoted | Demo | Built for the reviewer, not the preparer; subs get an account they didn't buy |
| **Elation Systems** | Agencies (CA) | **Free to contractors on County contracts** — the agency pays | Agency deployment | Not usable standalone; sub is a guest |
| **eMars Compliant Client** | Primes, owners | Not published ("once a price is established… never a rate increase") | Sales | Audits *submitted* payroll against the WD and 30 DBRA factors — it grades, it does not compute |
| **eComply** | Agencies | Not published | Agency | Multnomah County ends LCPtracker access 8 July 2026, launches eComply 9 Sept 2026 — the sub's portal churns without warning |

**Read:** this tier is not a pricing competitor. It is a *rejection surface* and a switching-cost generator, and R2 in the dossier is correct that the sub can end up paying twice. It also means "cheaper than LCPtracker" is a meaningless claim to a sub whose LCPtracker seat is free.

### 1.2 Contractor-first self-serve — the real fight

| Vendor | Price (verified 2026-08-13) | Setup | Formats | Weakness |
|---|---|---|---|---|
| **LCPcertified** | $12/report; $145/mo (5 proj); $1,300–$7,400/yr | Not stated | WH-347, **CA + WA + MD XML** | Demo CTA on page; 2018's free single-project tier is no longer on the pricing panel |
| **CertifiedPayrollPro** | $49 / $99 / $249 per mo + **$5 / $3 / $1 per report**; 14-day trial, 3 free reports | **$0** | WH-347, "DIR-compliant XML files" | Rate sheets are **loaded by the user**; no revision tracking claimed; direct payroll APIs "still in development" |
| **PrevailComply** | Not published; "start free" | None | WH-347, one-click CA DIR XML, apprentice ratios | New, unproven, no revision-of-record claim |
| **CertiWage** | **$29/mo** Starter, unlimited weekly reports, first export free | None | WH-347 only | **No XML**; preparer-side only |

### 1.3 Payroll suites and bolt-ons

Foundation Software (quote-only; third-party reviews report ~$500/mo entry, $700–$2,500/mo with payroll) and its **Payroll4Construction** service; **eBacon** — demo-gated, no published price, and claiming **"187,000+ pre-loaded wage determinations auto-assign for worker classifications and pay rates"** plus "1-click WH-347"; **Points North Certified Payroll Reporting** — demo-gated, integrating ADP, Workday, Paycor, Paychex, UKG, Rippling and QuickBooks, and selling a **managed service that generates and submits for you**; **Sage 100 Contractor + Aatrix**; **Sunburst Certified Payroll Solution** for QuickBooks (CA DIR eCPR, PRISM and LCPtracker upload files). **Gusto** has no native certified payroll and is not on Points North's integration list.

The generic weakness of this tier is brittleness at the seams, and it is documentable: Sage's Aatrix WH-347 "looks for records that have a 7-day pay period, and records with 14-day or more periods do not get captured." A biweekly-payroll sub silently gets an incomplete form.

### 1.4 Free and data layers

DOL's fillable WH-347 (OMB 1235-0008, expires 01/31/2028) is free. California's DIR eCPR accepts **manual iForm entry or XML upload** — no vendor required; the cost is the $400/yr PW contractor registration, not software. **davisbaconrates.com** — cited in our own dossier — is an **affiliate-supported content site** already running a free county × craft SAM.gov rate lookup *and* a free WH-347 fringe calculator, monetised by demo referrals. **That is D8 channel 2, occupied.**

---

## 2. Where Wage Line is NOT differentiated — stated plainly

1. **WH-347 generation.** Commodity. Free from DOL, free from PrevailComply, $12/report from LCPtracker, $29/mo unlimited from CertiWage.
2. **CA eCPR XML.** LCPcertified ships CA **plus WA and MD**; CertifiedPayrollPro and PrevailComply ship CA. Per D3/G2 we ship ours labelled *generated, not acceptance-tested*. **On day one we are behind on this feature, not ahead.**
3. **Zero setup fee and self-serve signup.** Correctly retired in D3. Three competitors are self-serve at $0 setup.
4. **Price.** We are the premium option. $99 Solo vs. CertifiedPayrollPro $49+$5/report; $249 Crew vs. LCPcertified $145 for the same project count and more states.
5. **The WD corpus.** Archived revisions are publicly retrievable per `(wdNumber, revision)`; a competitor rents the whole series for $19/mo. Assembly and latency are ours; scarcity is not.
6. **County × craft SEO.** davisbaconrates.com is there, with affiliate economics we cannot match on a free page.
7. **Classification help.** eBacon claims auto-assignment across 187,000+ pre-loaded determinations. The premise that "incumbents make the contractor pick the class by hand" is not universally true. *(The 187,000 figure is unaudited and inconsistent with SAM's 4,236 active DBA determinations; it likely counts classification rows or historical revisions.)*

**What genuinely survives, and only this:** (a) **revision-level provenance printed on the artifact** — WD number, revision, publication date, corpus snapshot hash, plus per-classification diff since award; no competitor publishes this on the emitted form; (b) **refusal semantics** — DRAFT — NOT CERTIFIABLE with the signature block withheld, and an explicit declination to conclude FAR 22.404-6 effectiveness (D7), where every competitor either guesses or routes to a human; (c) **per-account classification memory** keyed `(account, WD, payroll title)`, which compounds from corrections rather than crawling (D6) — the one asset in section 1 nobody else accumulates; (d) **counter-positioning** (Helmer): Points North's managed service and every demo-gated vendor cannot go pure self-serve without cannibalising the labour they bill for.

---

## 3. Dunford positioning

**Competitive alternatives.** (1) Excel + the free DOL PDF + a free rate lookup; (2) the mandated portal the agency already paid for; (3) contractor-first self-serve CPR tools; (4) the payroll suite or bolt-on that already runs payroll; (5) outsourcing the judgement to a managed service or bookkeeper.

**Unique attributes.** Rate-of-record pinning with revision-level provenance on the artifact; generation off a pinned local mirror so no upstream outage can block a filing (D7); refusal instead of estimation; classification memory; zero human contact at any tier.

**Value.** Not time saved — that is contested and, under G4, unmeasured. The value is **defensibility**: when the GC or WHD asks "where did this rate come from," the answer is on the form, dated, with the diff since award, retrievable eighteen months later from stored data. Every alternative in section 1 can produce *a* form; none can prove *which revision* it was computed against.

**Best-fit customer (D1, narrowed).** Open-shop specialty subs, 5–75 field employees, **multi-project and multi-county**, whose WD has been modified mid-job or who have already had a payroll rejected on a rate mismatch. Single-project subs are LCPcertified's and CertiWage's customer, not ours — we lose that comparison on price.

**Market frame.** Not "certified payroll software" — inside that category the default comparison is $29–$145/mo and we lose. Frame: **the wage-determination system of record that feeds whatever portal the GC mandates.** Per Dunford, when the obvious category forces an unfavourable comparison set, move the frame.

> **For open-shop specialty subcontractors running federally funded work across several projects and counties, Wage Line is the rate-of-record engine that pins every certified payroll to a named wage-determination number, revision and publication date and prints that provenance on the artifact itself — unlike form-fillers such as LCPcertified, CertifiedPayrollPro and PrevailComply, which produce a correct-looking WH-347 without proving which revision it was computed against, and unlike agency portals such as LCPtracker Pro, Elation and eMars, which grade your submission after the fact. Wage Line does not replace your payroll system or your GC's portal; it produces the defensible input both of them consume.**

---

## 4. Implications and challenges

**Challenge to D4 (implemented as specified, flagged).** Crew at $249/mo for 5 projects is priced above LCPcertified Plus at $145/mo for 5 projects with three states of XML. Per Ramanujam, price to value, not to cost — but the value story must be *defensibility*, and any tier that reads as "a WH-347 generator with a subscription" will lose this comparison in the buyer's browser tab.

**Challenge to the cornered-resource claim underlying D5.** Restate the moat as *assembly, latency and crosswalk* — not "unreconstructable." Section 0, Finding 2 is reproducible in one curl.

**Challenge to the shortlist's burden math.** DOL's own WH-347 burden statement reads *"we estimate that it will take an average of 55 minutes to complete this collection of information"* — **per response, not per employee.** The "over an hour per employee," "15+ hours a week," and "$19,500/yr" figures are a per-employee reading of a per-response estimate. G4 already forbids publishing them; this is the evidence for why.

**Non-negotiable for downstream agents:** the free WH-347 generator (D3/D8) is now a **defensive** move against PrevailComply and davisbaconrates.com, not a novel wedge — build it, but never call it differentiation.

---

## References

- https://lcptracker.com/solutions/lcpcertified/ — LCPcertified pricing table, verified live 2026-08-13
- https://lcptracker.com/solutions/subcontractor — subcontractor positioning
- https://lcptracker.com/press-release/lcptracker-introduces-free-subscription-tier-for-single-contractor-certified-payroll-solution/ — 2018 free tier announcement
- https://www.prnewswire.com/news-releases/lcptracker-introduces-free-subscription-tier-for-single-contractor-certified-payroll-solution-300748819.html
- https://lcptracker.com/ — product line and buyer segments
- https://www.elationsys.com/solutions/contractors/
- https://gsa.acgov.org/do-business-with-us/vendor-support/compliance-reporting-elation-systems/ — free to contractors on County contracts
- https://multco.us/info/important-update-multnomah-county-certified-payroll-system-transitioning-ecomply — portal churn, July/Sept 2026
- https://ebacon.com/products/certified-payroll — "187,000+ pre-loaded wage determinations auto-assign", verified 2026-08-13
- https://www.points-north.com/certified-payroll-reporting — managed service, demo gate
- https://www.points-north.com/certified-payroll-reporting/partners — integration list
- https://emarsinc.com/certified-payroll — Compliant Client audit model
- https://www.certifiedpayrollpro.com/pricing — $49/$99/$249 + per-report fees, $0 setup
- https://www.certifiedpayrollpro.com/california-certified-payroll — CA DIR XML, user-loaded rate sheets
- https://www.certifiedpayrollpro.com/blog/best-lcptracker-alternatives-2026 — competitor weaknesses
- https://certiwage.com/emars-alternative — $29/mo Starter, preparer-side positioning
- https://prevailcomply.com/ — self-serve, free WH-347 generator, CA DIR XML
- https://davisbaconrates.com/certified-payroll-software — affiliate-supported free rate lookup and fringe calculator
- https://www.payroll4construction.com/payroll-quote/ — quote-gated
- https://www.capterra.com/p/2032/FOUNDATION/ — Foundation pricing reports
- https://help-sage100contractor.na.sage.com/Sage100Contractor/US/24_3/Content/Modules/5-Payroll/About_certified_payroll_reports.htm
- https://communityhub.sage.com/us/sage_construction_and_real_estate/f/sage-100-contractor-general-discussion/269205/can-t-run-wh-347-payroll-report/646313 — 7-day pay-period limitation
- https://partner.aatrix.com/sage-100-contractor/
- https://sunburstsoftwaresolutions.com/california-dir-ecpr-prism-lcptracker-upload-feature-for-quickbooks.htm
- https://gusto.com/product/integrations — no native certified payroll
- https://govconapi.com/sam-gov-wage-determination-api — 90,033 WDs, all revisions retained
- https://govconapi.com/pricing — $19/mo Developer, $39/mo Pro, self-serve
- https://sam.gov/api/prod/wdol/v1/wd/WA20200002/0/download — archived revision r0, verified 303 → signed S3 text, 2026-08-13
- https://sam.gov/api/prod/wdol/v1/wd/CA20250001/5/download — archived revision r5, verified 2026-08-13
- https://sam.gov/wage-determinations
- https://www.acquisition.gov/content/wdol.gov-wage-determinations-now-beta.sam.gov — WDOL retirement, archived search
- https://www.dol.gov/agencies/whd/forms/wh347 — OMB 1235-0008, expires 01/31/2028, 55-minute burden estimate
- https://www.dir.ca.gov/Public-Works/Certified-Payroll-Reporting.html
- https://www.dir.ca.gov/Public-Works/ecprfaq.html — iForm and XML submission routes
- https://dir.ca.gov/Public-Works/Guides/eCPR-XML-guidelines.pdf — XML guidelines
- https://www.aprildunford.com/obviously-awesome — positioning process
- https://7powers.com/ — Helmer, cornered resource and counter-positioning
- https://hbr.org/2016/09/know-your-customers-jobs-to-be-done — Christensen JTBD
- https://www.momtestbook.com/ — Fitzpatrick, stated vs. revealed preference
- https://tractionbook.com/ — Weinberg & Mares, Bullseye
- https://a16z.com/the-only-thing-that-matters/ — Andreessen, market pull
