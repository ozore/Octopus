# Demand & PMF Validation — Wage Line

**Assignment:** adversarial demand and PMF validation for the Borda winner, under Fitzpatrick's *Mom Test* evidence hierarchy, Ellis's 40% threshold, Blank's customer-development gates and Andreessen's market-pull test.
**Date:** 2026-08-13. All figures re-verified live on this date unless a source date is given.
**Method note:** Reddit (`reddit.com`, `old.reddit.com`), ContractorTalk (Tollbit HTTP 402) and the Mike Holt forums (HTTP 403) were **not reachable** from this environment. The forum-voice evidence the brief asked for therefore does **not** appear below, and the shortlist's unattributed quote that contractors call LCPtracker exports "revision hell" is **unverified — do not reuse it.** In its place: LCPtracker's own public UserVoice board (dated, vote-counted, written by its users) and dated verbatim Capterra reviews.

---

## 1. Verdict

**GO_WITH_CHANGES.** Money demonstrably changes hands here, on a published self-serve price list, from the exact buyer D1 names. But three demand claims carried into the shortlist are wrong, two of them in the direction that flatters the idea: the DOL burden estimate is **per form, not per employee**; the sub-facing incumbent is **not** demo-and-quote and publishes prices *below* D4's mid tier; and on a material slice of covered work the portal is **free to the subcontractor because the awarding agency pays for it.** The job is real and recurring. The pain is roughly one-tenth the size the pitch implies.

---

## 2. Mom Test: money already changing hands

Fitzpatrick's rule is that only committed money and past behaviour count. This category clears that bar without a single interview.

**LCPtracker sells to our exact buyer at a published, self-serve price.** LCPcertified — LCPtracker's subcontractor SKU, "ideal for self-performing contractors who are not responsible for other subcontractors' compliance" — lists verbatim: `$12 Per Report`, `Up to 5 Active Projects: $145/Month`, `Up to 10 Active Projects: $1,300/Year`, `Up to 25: $2,500/Year`, `Up to 50: $3,700/Year`, `Unlimited: $7,400/Year`, plus a Professional tier from `$1,900/Year` (10 projects) to `$18,200/Year` (450). I parsed the raw HTML myself to confirm this is not a summariser artefact.

**CertifiedPayrollPro** publishes Starter $49/mo + $5/report (5 projects), Pro $99/mo + $3/report (25 projects), Enterprise $249/mo + $1/report, "No setup fees. No contracts," 14-day trial, no credit card. **eBacon**: Capterra 4.5/5, 21 reviews, from $1,000/month. **Points North**: $125/user/month, 3.0/5, 2 reviews.

**A non-software cash flow proves the budget exists.** California charges every public-works contractor "$400, $800 or $1,200" to register for one, two or three fiscal years — an unavoidable recurring line item this identical buyer already pays to participate in the market at all.

That is sustained, repeat, published-price transaction evidence with the ICP: materially stronger than run 1's winner had.

---

## 3. The pain, measured from the primary source (and a correction)

The shortlist claims a WH-347 "carries ~168 discrete data points per worker" and that DOL puts completion "above an hour per employee per report." Both fail verification against the primary document — the Paperwork Reduction Act clearance for OMB control number **1235-0008**, at 89 FR 70670 (30 August 2024), which states verbatim:

> Total Estimated Respondents: 122,936. Total Annual responses: 11,310,112. Estimated Total Burden Hours: 10,556,105. Estimated Time per Response: 55 minutes to complete the WH-347 form or its equivalent plus 1 minute for recordkeeping (total of 56 minutes per form). Frequency: Weekly… Total Burden Cost (operating/maintenance): $1,764,379.

The form repeats the 55 minutes in its own OMB burden statement (1235-0008, expiring 01/31/2028) as the time "to complete this collection of information" — i.e. **per form**, and the form's layout holds multiple worker rows. My arithmetic: **92.0 forms per filer per year**; **85.9 hours per filer per year**, or 1.65 hours a week; **$14.35** of non-labour cost per filer per year.

**This refutes the "15 hours a week / ~$19,500 a year on one project" framing outright** — the per-employee reading inflates the burden by roughly the crew size, ~15× for the pitch's 15-person crew. Vendor blogs repeat the misreading widely; one SEO comparison page asserts 18–22 hours a month for a $4M general contractor, 2.5–3× the DOL per-filer figure and unsourced. D10's **G4** already bans DOL-derived time-saving extrapolations; this is why G4 exists and it must stay non-negotiable.

The ROI consequence: eliminating **100%** of the DOL-estimated burden pays for D4's $99/mo Solo tier only if the filer's loaded clerical rate exceeds ~$13.83/hour; Crew at $249/mo needs ~$34.80/hour *and* total elimination. **Time saved cannot carry the ladder above Solo.** D3's choice to wedge on rate-of-record rather than price or speed is therefore not a preference — it is the only defensible basis for tiers above $99.

---

## 4. Market size, from official counts

**122,936** entities file DBRA certified payroll, producing **11,310,112** filings a year (89 FR 70670) — the tightest available count of who has this problem, and a count of *filers*, not construction firms. **4,236** active Davis-Bacon wage determinations, verified live today against the SAM DBRA index (`db-prod-samdotgovsearch-wdol-dba_idxref_08112026`, `totalElements: 4236`). **52,820** prime construction contract awards (NAICS 23) in FY2025 via the USASpending API, against only **4,186** reported construction subcontracts in the same window.

That last ratio is a finding against D8. Sub-tier awards are reported only above the FSRS threshold and are badly under-reported, and DBRA "Related Acts" work — grant-funded projects let by states and localities — produces **no** contractor rows in USASpending at all. **D8's fourth channel ("SAM/USASpending award feeds identify subs who just won DBA-covered work, so the cold list generates itself") is weakly evidenced and should be demoted below programmatic SEO.**

---

## 5. Complaint themes, with provenance

LCPtracker's public UserVoice board (LCPtracker Professional, 324 ideas) top-voted: System Time Outs (65) — "Re-logging in many times per day is seems unnecessary"; Allow multiple sessions (52); eDocument upload notification (43); Resolve Multiple Notices/Violations (38) — **"We have some projects with over 2,000 notices and the system currently is not user friendly"**; week-ending-date warning (36); "Main Data Base for Employees and Updating Wages/Fringes by Classification" (36) — "Ability to update Union wage and fringes by classification rather than employee by employee."

That board is written mostly by **approvers** — agency and prime administrators auditing other people's payrolls — not by the 5–75-person open-shop sub D1 targets. It corroborates Dunford-style positioning (LCPtracker Pro is the *approver's* system of record) while warning that its complaint themes are not our buyer's.

Dated buyer-side Capterra verbatims: Points North, LeighAnn G. (18 Apr 2023) — "Implementation fees are INSANE," "I often get errors uploading a file into their system," "Good luck getting support over the phone," "Overall it is clunky and not intuitive." eBacon, Yuri B., HR Specialist, Construction (26 Mar 2026) — "The system to me feels very dated. I have to manually enter a lot of parts from a paystub… you waste a lot of time because of all the manual entering."

---

## 6. The fear that funds the budget — and its honest weakening

WHD recovered **$259 million for 176,957 workers** across all acts in FY2025. Under DBRA: **FY2025 — 641 concluded compliance actions, $26,754,050 recovered, 5,812 employees** ($41,738 per case; $4,603 per worker). Representative case: V&V Construction and its owners were ordered to pay **$186,124 to 55 workers** plus 18 months of independent monitoring after misclassifying journey workers as laborers, splitting hours between rates and falsifying payroll records (WHD, 8 May 2024) — exactly the failure mode a pinned rate-of-record prevents.

Two corrections and one caution:

1. **There is no $28,619 Davis-Bacon civil money penalty.** DOL's penalty table carries no per-violation DBA CMP; the CWHSSA penalty is **$33** per worker per day (40 U.S.C. 3702(c)). The $14,308–$28,619 range is the **False Claims Act per-claim** penalty effective 3 July 2025. FCA exposure is real — each certification is a claim — but misattributing the number is a false claim of our own.
2. **DBRA enforcement frequency is falling, hard:** 1,711 concluded actions in FY2013 against 641 in FY2025, down 63%. Severity per case is up; probability of audit is down. Copy implying a high audit likelihood is unsupported.
3. **The California beachhead had a 12-month enforcement holiday.** DIR paused enforcement of contractor registration *and* eCPR submission from 22 June 2024 to 22 June 2025, resuming 23 June 2025. "Mandatory weekly XML" is legally true and was practically suspended inside the last 24 months.

---

## 7. Andreessen, Blank, Christensen, Ellis

**Andreessen's market-pull test passes on structure, not observed pull.** The filing is statutory, weekly and gates the payment application; 11.3 million are produced a year. But pull in Andreessen's sense is the market pulling product out of *this* startup, and nothing has been pulled out of Wage Line because it does not exist. What is evidenced is category pull, already being absorbed by funded incumbents.

**Blank's discovery gates:** problem exists at scale — yes (122,936 filers). Customers actively seek solutions — yes. Already paying — yes ($145–$7,400/yr sub-facing). Alternative visibly worse — **partially**: manual filing costs ~86 hours a year, not 780. Reachable channel — yes for programmatic SEO, **weak** for USASpending sub-feeds (§4).

**Christensen's JTBD** framing in D2 survives intact: the hire is "get Friday's certified payroll out with rates I can defend," and WH-347 Column 3 (Labor Classification) plus 6A/6B/6C (rate, fringe credit, cash in lieu) are where defensibility lives.

**Ellis's 40% test cannot be run and must not be simulated.** It requires ≥40% of *activated users* answering "very disappointed"; there are zero users. Correct instrumentation, built in from day one: survey accounts that have generated ≥2 filings, segmented by open-shop vs. mixed and single- vs. multi-project — segmenting before averaging is the whole point of Vohra's method.

---

## 8. What is NOT evidenced — read this before quoting anything above

1. **Nobody has been asked to pay for Wage Line.** No landing page, waitlist, pre-order or interview. Everything here validates the *category*, not this product's differentiated pull. Largest gap by far.
2. **No primary contractor voice was obtained** (method note). Treat every "contractors say…" claim in the shortlist as unverified.
3. **"168 data points per worker" is unverified** and inconsistent with the form's published field list; it may be a per-page count. Do not print it.
4. **"Incumbents are demo-and-quote with $995–$4,995 setup fees" is refuted for the sub-facing SKU.** LCPcertified publishes a full price list; CertifiedPayrollPro advertises no setup fee and a no-credit-card trial. The $995–$4,995 band traces only to a competitor's blog, and ADP Marketplace hides Points North pricing behind login; only the qualitative corroboration ("Implementation fees are INSANE") is independently sourced.
5. **Part of the ICP already gets a portal free.** DOE states plainly that "LCPtracker is free to Infrastructure Investment and Jobs Act project recipients and subrecipients," with no fees to contractors or subcontractors (LCPtracker also ran a free single-project tier from 2018, no longer listed). Willingness to pay must be tested against free-because-the-agency-bought-it, not against manual filing.
6. **The D1 slice is uncounted.** No source splits the 122,936 filers by open-shop vs. union, prime vs. sub, or headcount. Any "N thousand target customers" figure is a hypothesis.
7. **The price ceiling is published and below D4's mid tier.** LCPcertified: $145/mo for 5 active projects against D4's Crew at $249/mo for 5 — 1.7×. CertifiedPayrollPro's $99/mo tier carries 25 projects against Solo's 1. Neither refutes D3's wedge, but pricing and GTM must argue against *these numbers*, not a demo-and-quote strawman.
8. **State XML is not differentiating.** LCPcertified already emits XML for California DIR, Washington L&I and Maryland DOL, and New York's MPWR portal has required electronic certified payroll for all Article 8 contractors and subcontractors since 31 December 2025 — so D9's "California only" leaves v1 narrower than a live incumbent on the artifact axis.

**Challenge (D4, D8, D9 — implement as specified, but flagged):** Crew prices 1.7× a published competitor for the same project count; D9 ships fewer state artifacts than that competitor; D8's award-feed channel is unsupported by subaward data. These are the three places this idea is most likely to be wrong.

---

## References

- https://www.federalregister.gov/documents/2024/08/30/2024-19482/agency-information-collection-activities-comment-request-information-collections-davis-bacon — 89 FR 70670, 30 Aug 2024; respondents 122,936; responses 11,310,112; burden 10,556,105 hours; 56 minutes per form; operating cost burden $1,764,379
- https://www.dol.gov/agencies/whd/forms/wh347 — WH-347 instructions and OMB burden statement, control number 1235-0008, expires 01/31/2028; column/field list
- https://www.dol.gov/agencies/whd/data/charts/government-contracts — DBRA concluded compliance actions and back wages by fiscal year (FY2013–FY2025)
- https://www.dol.gov/agencies/whd/data — WHD FY2025: $259M for 176,957 workers, $1,465 average
- https://www.dol.gov/newsroom/releases/whd/whd20240508 — V&V Construction, $186,124 for 55 workers, misclassification and falsified payrolls, 8 May 2024
- https://www.dol.gov/agencies/whd/resources/penalties — CWHSSA civil money penalty $33 (40 U.S.C. 3702(c))
- https://fcablog.sidley.com/2025/07/07/department-of-justice-announces-2025-inflationary-adjustments-to-fca-penalties/ — FCA per-claim penalties $14,308–$28,619, effective 3 July 2025
- https://sam.gov/api/prod/sgs/v1/search/?index=dbra&page=0&size=1&is_active=true&sort=-modifiedDate — verified 2026-08-13, `totalElements: 4236`, index `db-prod-samdotgovsearch-wdol-dba_idxref_08112026`
- https://api.usaspending.gov/api/v2/search/spending_by_award_count/ — FY2025 NAICS 23: 52,820 prime contracts; 4,186 subcontracts (POST query, run 2026-08-13)
- https://lcptracker.com/solutions/lcpcertified/ — LCPcertified published price list (Plus and Professional tiers); CA DIR / WA L&I / MD DOL XML
- https://lcptracker.com/press-release/lcptracker-introduces-free-subscription-tier-for-single-contractor-certified-payroll-solution/ — free single-project tier, 13 Nov 2018
- https://lcptracker.uservoice.com/forums/922735-lcptracker-professional/filters/top — top-voted user requests and verbatim complaints
- https://www.energy.gov/infrastructure/weekly-dba-payroll-tracking-lcptracker — "LCPtracker is free to Infrastructure Investment and Jobs Act project recipients and subrecipients"
- https://www.certifiedpayrollpro.com/pricing — Starter $49 / Pro $99 / Enterprise $249 per month plus $1–$5 per report, no setup fee
- https://www.capterra.com/p/88851/Certified-Payroll/ — Points North, 3.0/5, 2 reviews, $125/user/month; verbatim reviewer complaints (18 Apr 2023, 20 Oct 2020)
- https://www.capterra.com/p/180666/eBacon/ — eBacon, 4.5/5, 21 reviews, from $1,000/month; verbatim reviewer complaints (26 Mar 2026, 10 Aug 2021)
- https://www.dir.ca.gov/Public-Works/Contractor-Registration.html — public works contractor registration fee $400 / $800 / $1,200
- https://www.dwkesq.com/department-of-industrial-relations-pauses-enforcement-of-contractor-registration-and-other-rules-through-june-22-2025/ — DIR enforcement pause of registration and eCPR through 22 June 2025
- https://dol.ny.gov/bureau-public-work-and-prevailing-wage-enforcement — NY MPWR electronic certified payroll required for Article 8 contractors and subcontractors from 31 Dec 2025
- https://www.momtestbook.com/ — Fitzpatrick, *The Mom Test* (evidence hierarchy: committed money over stated intent)
- https://www.startup-marketing.com/the-startup-pyramid/ — Ellis, the 40% "very disappointed" product-market-fit threshold
- https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit/ — Vohra, segmenting the Ellis survey before averaging
- https://pmarchive.com/guide_to_startups_part4.html — Andreessen, "The Only Thing That Matters" (market pull)
- https://steveblank.com/2010/01/25/whats-a-startup-first-principles/ — Blank, customer-development discovery gates
- https://hbr.org/2016/09/know-your-customers-jobs-to-be-done — Christensen et al., Jobs to Be Done
