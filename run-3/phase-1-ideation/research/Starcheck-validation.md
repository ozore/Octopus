# Run 3 — Deep validation: Starcheck (CMS PBJ XML + Five-Star simulation)

Pool survivor r2-22, validated 2026-08-20 alongside the cycle-2 mining wave.
**Overall verdict: REFUTED** — per-lens: mandate=REFUTED, corpus=REFUTED, competition=REFUTED, kill=REFUTED


---

## 01 Mandate & demand — verdict: REFUTED

# Starcheck (PBJ XML + Five-Star staffing math) — deep validation

**Verdict: REFUTED.** The premise is almost entirely true — and that is the problem. Every load-bearing fact checks out against primary sources, and each one turns out to be *already served*, free, by CMS itself or by a live incumbent at one-third the imagined price. This is kill patterns 1, 2 and 3 firing simultaneously, plus a fresh platform change that breaks the autonomy story.

## What survives contact with the primary text

The mandate is real. Current eCFR renders it at **42 CFR 483.70(p)** — *not* (q) as the pool entry and even CMS's own July 2026 memo state (CMS redesignated the paragraph; the memos are stale). Text: facilities "must electronically submit to CMS complete and accurate direct care staffing information, including information for agency and contract staff, based on payroll and other verifiable and auditable data in a uniform format," on a schedule "no less frequently than quarterly," rooted in §1128I(g) SSA / ACA §6106.

Deadlines confirmed on the CMS PBJ page: 45 calendar days after each federal fiscal quarter, 11:59 PM ET — Feb 14, May 15, **Aug 14**, Nov 14. The fileSpecVersion 4.10.0 cutover is real: files at other versions rejected on/after April 1, 2026.

Enforcement is confirmed and harsh, in the **July 2026 Five-Star Technical Users' Guide** ("Scoring Exceptions"): providers that fail to submit any staffing data by the deadline "will receive a one-star staffing rating for the quarter"; four or more days with zero RN hours while residents are present → one star; failing or flunking a CMS audit → one star for three months, extendable on repeat findings. Per QSO-25-01-NH, failure or erroneous data also forces the *lowest possible* turnover points (5/5/10), and the TUG confirms rescaling does not rescue those.

And the shortlist's stated objection is **wrong**: the cut points are fully public and exact. TUG Table 3 gives staffing star bands on a 380-point scale (1★ <155, 2★ 155–204, 3★ 205–254, 4★ 255–319, 5★ 320–380); Appendix Table A2 gives every decile boundary (adjusted RN HPRD 5★ decile ≥1.202, total nurse ≥5.070, weekend ≥4.464, RN turnover ≤20.000%, etc.); Table A1 gives the 25 PDPM nursing CMIs for case-mix adjustment. The simulation Starcheck proposes is pure published arithmetic. That is the one place the idea was underrated — and it does not save it.

## Why it dies

**1. CMS ships the generator.** `pbj-excel-xml-template-v-4-10-0.zip` (downloaded today, HTTP 200) unzips to an .xlsx whose `xl/xmlMaps.xml` embeds the full PBJ XSD (`nursingHomeData`/`header`/`employees`/`staffingHours`, state enumerations, length restrictions). The Instructions tab: paste your data into three tabs, "From the Developer toolbar, select 'Export' and specify the XML file name," and Excel validates against the schema on export and tells you if it doesn't conform. The agency publishes a free, working, validating artifact generator built around the customer's own data. Kill pattern 1, verbatim.

**2. XML is optional entirely.** PBJ Policy Manual v2.7: "The PBJ system has been designed to accept two primary submission methods – 1) Manual data entry, and 2) Uploaded data from an automated payroll or time and attendance system (XML format only)." A single building can key hours directly. The mandatory artifact the product generates is not mandatory in that form.

**3. CMS already tells you your star.** Free monthly **Five-Star Rating Preview Reports** land in iQIES before Care Compare publishes (July 2026 previews posted July 22 for a July 29 refresh), alongside free PBJ reports (1702S Staffing Summary, 1705D Staffing Data, Job Title) and the On-Demand Final File Validation Report — whose 60-day wait CMS *removed* in the iQIES migration.

**4. A live micro-SaaS is already shipping the exact product at 1/3 the price.** **PBJ360°** (PBJ Central) publishes pricing today: a free-forever **Triple Check** scrubber for up to 5 facilities ("PBJ audit risks, F-Tag & survey risks, **1 star & exclusion triggers**, CMS file rejection checks, data swings from prior quarters," no credit card, no expiration), and **PBJ360° Submit at $99/facility/month or $1,089/facility/year** including "CMS file submission & validation, **Five Star forecasting**, CSV & manual data entry, multi-facility management." That is Starcheck's entire feature list — including the forward-looking simulation held out as the differentiator — at 33% of the $299 hypothesis, with the validator given away. Their FAQ: "Submit will be available in late August, once CMS migrates PBJ submission to the iQIES system on August 17th. Early adopters get a free trial of Submit until September 30." They are launching *this week*, timed to the migration, with a content moat (PBJ Academy, vendor directory, community) already built.

**5. Bundled in software the buyer already pays for.** SmartLinx: staffing data "is automatically aggregated, formatted into a CMS-compliant XML file, and submitted directly to the CMS portal," with built-in CMS validation. PBJ Central maintains a whole vendor directory of payroll/timekeeping/agency vendors doing the same. Kill pattern 3.

**6. New: the autonomy story broke three days ago.** QSO-26-12-NH moved PBJ into iQIES on **August 17, 2026**. Submission now requires a HARP account plus an iQIES PBJ role, and — decisively for a card-signup product — "**Vendors must request access for each facility they represent and get approval from a PSO at each facility, using the facility's CCN**," with 60-day inactivity deprovisioning. A6's "zero human minutes per customer" cannot survive a per-facility human approval handshake. Starcheck could hand over an XML file, but not submit; the incumbent has already priced that same constraint at $99.

## Residual

The pain is genuine and the corpus is clean; the failure is purely competitive and substitutive. No reshaping rescues it: the free layer is occupied by CMS, the paid layer by a launching incumbent at a third the price, and the differentiating simulation is computable by anyone from a public PDF. Recommend dropping Starcheck from the ballot.

## References

1. https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-42?chapter=IV&subchapter=G&part=483&subpart=B&section=483.70 — 42 CFR 483.70(p) mandate text (fetched 2026-08-20)
2. https://www.cms.gov/medicare/quality/nursing-home-improvement/staffing-data-submission — deadlines, 4.10.0 cutover, downloads (fetched 2026-08-20)
3. https://www.cms.gov/files/zip/pbj-excel-xml-template-v-4-10-0.zip — free CMS Excel→XML generator with embedded XSD (fetched 2026-08-20)
4. https://www.cms.gov/medicare/quality-initiatives-patient-assessment-instruments/nursinghomequalityinits/downloads/pbj-policy-manual-final-v25-11-19-2018.pdf — PBJ Policy Manual v2.7, manual data entry (fetched 2026-08-20)
5. https://www.cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/downloads/usersguide.pdf — Five-Star TUG July 2026, Tables 3/A1/A2, scoring exceptions (fetched 2026-08-20)
6. https://www.cms.gov/files/document/qso-25-01-nh-revised-2024-10-04.pdf — penalty for failure to submit (fetched 2026-08-20)
7. https://www.cms.gov/files/document/qso-26-12-nh-original-release-2026-07-14.pdf — iQIES transition Aug 17 2026, per-facility PSO approval (fetched 2026-08-20)
8. https://www.pbjcentral.com/pricing/ — PBJ360° $99/facility/mo, $1,089/yr, free Triple Check tier (fetched 2026-08-20)
9. https://www.pbjcentral.com/cms-pbj-software/ — PBJ360° feature set (fetched 2026-08-20)
10. https://qtso.cms.gov/news-and-updates/notice-five-star-rating-preview-reports-july-2026 — free monthly Five-Star preview reports (fetched 2026-08-20)
11. https://www.smartlinx.com/solutions/payroll-based-journal/ — bundled XML generation + submission (fetched 2026-08-20)

### Proven

- Mandate is real: current eCFR places it at 42 CFR 483.70(p) (not (q)); facilities 'must electronically submit to CMS complete and accurate direct care staffing information, including information for agency and contract staff, based on payroll and other verifiable and auditable data in a uniform format', 'no less frequently than quarterly', per SSA 1128I(g) / ACA 6106.
- Deadlines confirmed: 45 calendar days after each federal fiscal quarter, 11:59 PM ET — Feb 14, May 15, Aug 14, Nov 14 (CMS PBJ page).
- fileSpecVersion 4.10.0 is mandatory: XML at other versions rejected on/after April 1, 2026 (CMS PBJ page).
- Enforcement confirmed in the July 2026 Five-Star Technical Users' Guide 'Scoring Exceptions': no submission by deadline = one-star staffing rating for the quarter; 4+ days with zero RN hours while residents present = one star; failing/flunking a CMS audit = one star for three months, extendable.
- QSO-25-01-NH (Oct 4, 2024) confirms providers who fail to submit or submit erroneous data receive the lowest possible score on the corresponding turnover measures (5 pts nurse/RN turnover, 10 pts administrator).
- Five-Star staffing cut points are fully public and exact — contradicting the shortlist's stated objection: TUG Table 3 (1★ <155, 2★ 155-204, 3★ 205-254, 4★ 255-319, 5★ 320-380 of 380 points) and Appendix Table A2 (every decile boundary for RN HPRD, total nurse HPRD, weekend HPRD, RN turnover, total nurse turnover, administrator departures); Table A1 gives the 25 PDPM nursing case-mix indexes.
- CMS publishes a FREE working XML generator: pbj-excel-xml-template-v-4-10-0.zip, an .xlsx whose xl/xmlMaps.xml embeds the full PBJ XSD; Header/Employees/Staffing Hours tabs plus Developer->Export produce and schema-validate the nursingHomeData XML.
- XML is not even required: PBJ Policy Manual v2.7 — 'The PBJ system has been designed to accept two primary submission methods – 1) Manual data entry, and 2) Uploaded data from an automated payroll or time and attendance system (XML format only).'
- CMS gives every facility free monthly Five-Star Rating Preview Reports in iQIES before Care Compare publishes (July 2026 previews posted July 22 for the July 29 refresh), plus free PBJ 1702S/1705D/Job Title reports and an On-Demand Final File Validation Report whose 60-day wait was removed in the iQIES migration.
- Live incumbent at 1/3 the price with identical features: PBJ360° (PBJ Central) publishes a free-forever 'Triple Check' scrubber (up to 5 facilities; '1 star & exclusion triggers', CMS file rejection checks, data-swing checks) and 'PBJ360° Submit' at $99/facility/month or $1,089/facility/year including CMS file submission & validation, Five Star forecasting, CSV & manual data entry, multi-facility management.
- PBJ360° Submit launches 'late August' 2026 timed to the Aug 17 iQIES migration, with a free trial through Sept 30 — i.e. the incumbent is first to market on exactly the event Starcheck would launch against.
- Bundling confirmed: SmartLinx states staffing data 'is automatically aggregated, formatted into a CMS-compliant XML file, and submitted directly to the CMS portal' with built-in CMS validation; PBJ Central maintains a full directory of payroll/timekeeping/agency vendors offering PBJ support.
- QSO-26-12-NH: PBJ moved into iQIES on August 17, 2026 (three days before validation). Submission requires HARP + an iQIES PBJ role, and 'Vendors must request access for each facility they represent and get approval from a PSO at each facility, using the facility's CCN', with 60-day inactivity deprovisioning.

### Unproven

- The claim that 801 facilities dropped to a one-star staffing rating in January 2025 and that >5% of US nursing homes were penalised in a single quarter — sourced only to a vendor blog (Empeon) in the pool entry; no primary CMS source found today.
- Consultant/service pricing for PBJ outsourcing: no vendor other than PBJ Central publishes a price. SmartLinx, Inovalon, Netsmart/SimplePBJ, Empeon are all quote-gated, so the 'SNFs pay $X today' demand figure could not be established from primary sources.
- The ~14,800-facility TAM was not verified against a primary CMS provider count today.
- The pool entry's claim that CMS 'audits demand supporting documentation within five days' — the TUG confirms audits and a response deadline exists but no five-day figure was located in the primary text fetched.
- Whether iQIES retains the manual-data-entry path post-migration (the policy manual predates the migration; QSO-26-12 role descriptions say roles can 'view, upload, edit PBJ data', which implies editing persists, but no explicit confirmation).

### Fatal risks

- KILL PATTERN 1 (free first-party substitute), triple hit: CMS publishes a free, schema-validating Excel-to-XML generator built around the customer's own data; CMS accepts manual data entry so no XML is needed at all; and CMS gives every facility a free monthly Five-Star Rating Preview Report plus free validation reports.
- KILL PATTERN 2 (live micro-SaaS at a fraction of the imagined price): PBJ360° sells the identical bundle — submission, validation AND 'Five Star forecasting' — at $99/facility/month vs the $299 hypothesis, and gives the validation layer away free for up to 5 facilities. The differentiator Starcheck was banking on is already a line item on a published price list.
- KILL PATTERN 3 (bundled in software the buyer already pays for): SmartLinx and the broader payroll/timekeeping/HCM field auto-generate and submit the CMS-compliant XML as part of the suite; PBJ Central maintains a directory of them.
- Autonomy break from the Aug 17, 2026 iQIES migration: a vendor must obtain per-facility iQIES access approved by each facility's Provider Security Official using its CCN. A card-signup, zero-human-minutes product cannot submit on the customer's behalf; it can only hand back a file the free CMS template also produces.
- Premise citation error: the pool entry (and CMS's own memos) cite 42 CFR 483.70(q); current eCFR has it at (p). Minor, but the product's fail-closed spec-watching story is built on tracking exactly this kind of text.
- Competitive timing: the incumbent launches its submission tier the same week as the migration with a free trial through Sept 30, capturing the one moment when SNFs re-evaluate their PBJ workflow.

### References

- https://www.ecfr.gov/api/renderer/v1/content/enhanced/current/title-42?chapter=IV&subchapter=G&part=483&subpart=B&section=483.70 (fetched 2026-08-20) — Current eCFR text of 42 CFR 483.70(p) 'Mandatory submission of staffing information based on payroll data in a uniform format' — confirms mandate, agency/contract staff inclusion, uniform CMS format, quarterly minimum. Note paragraph is (p), not (q).
- https://www.cms.gov/medicare/quality/nursing-home-improvement/staffing-data-submission (fetched 2026-08-20) — CMS PBJ landing page: 45-day/11:59 PM ET deadlines (Feb 14, May 15, Aug 14, Nov 14), fileSpecVersion 4.10.0 rejection rule from April 1 2026, and the full downloads list including the free Excel-to-XML template, XSD zip, data specs and policy manual.
- https://www.cms.gov/files/zip/pbj-excel-xml-template-v-4-10-0.zip (fetched 2026-08-20) — CMS's free PBJ Excel-to-XML template (18.5 KB zip, HTTP 200). Unzipped: xl/xmlMaps.xml embeds the complete PBJ XSD; Instructions tab directs the user to Developer > Export to produce and schema-validate the XML. The agency's own artifact generator.
- https://www.cms.gov/medicare/quality-initiatives-patient-assessment-instruments/nursinghomequalityinits/downloads/pbj-policy-manual-final-v25-11-19-2018.pdf (fetched 2026-08-20) — PBJ Policy Manual v2.7 (06.30.2025): 'Methods of Submission' — the PBJ system accepts manual data entry as well as XML upload; ACA Section 6106 basis; Final File Validation Report guidance.
- https://www.cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/downloads/usersguide.pdf (fetched 2026-08-20) — Five-Star Quality Rating System Technical Users' Guide, July 2026: Table 3 staffing star point bands, Appendix Table A2 exact decile cut points for all six staffing measures, Table A1 PDPM nursing CMIs, and the Scoring Exceptions (one-star for non-submission, 4+ RN-zero days, failed audits).
- https://www.cms.gov/files/document/qso-25-01-nh-revised-2024-10-04.pdf (fetched 2026-08-20) — QSO-25-01-NH (rev. Oct 4, 2024): 'Penalty for Providers that Fail to Submit Staffing Data' — lowest possible score on corresponding turnover measures for failure or erroneous data; PDPM case-mix adjustment change.
- https://www.cms.gov/files/document/qso-26-12-nh-original-release-2026-07-14.pdf (fetched 2026-08-20) — QSO-26-12-NH (July 14, 2026): PBJ transition to iQIES effective August 17, 2026; HARP + iQIES role requirements; 'Vendors must request access for each facility they represent and get approval from a PSO at each facility, using the facility's CCN'; QIES cutoff Aug 14, 2026; report mapping and removal of the 60-day on-demand validation wait.
- https://www.pbjcentral.com/pricing/ (fetched 2026-08-20) — PBJ360° published pricing: free 'Triple Check' scrubber up to 5 facilities (1-star & exclusion triggers, CMS file rejection checks); 'PBJ360° Submit' $99/facility/month or $1,089/facility/year with CMS submission & validation, Five Star forecasting, CSV & manual data entry; FAQ confirms Submit launches late August 2026 alongside the iQIES migration with a free trial to Sept 30.
- https://www.pbjcentral.com/cms-pbj-software/ (fetched 2026-08-20) — PBJ360° product page describing automated PBJ preparation and submission, compliance scrubbing, audit-risk tracking and multi-building management.
- https://www.pbjcentral.com/pbj-vendors/ (fetched 2026-08-20) — PBJ Vendor Directory — evidence of a dense established vendor field (payroll processors, timekeeping/scheduling software, staffing agencies, PBJ consultants) already serving this job.
- https://qtso.cms.gov/news-and-updates/notice-five-star-rating-preview-reports-july-2026 (fetched 2026-08-20) — CMS/QTSO notice that Five-Star rating preview reports are released to providers monthly in iQIES ahead of the Care Compare refresh — the free first-party substitute for Starcheck's star simulation.
- https://www.smartlinx.com/solutions/payroll-based-journal/ (fetched 2026-08-20) — SmartLinx PBJ page: staffing data 'automatically aggregated, formatted into a CMS-compliant XML file, and submitted directly to the CMS portal', with built-in CMS validation — the job bundled into software the buyer already pays for. No public pricing.
- https://qtso.cms.gov/vendors/payroll-based-journal-pbj-vendors (fetched 2026-08-20) — CMS QTSO PBJ vendor portal — confirms a formal CMS-facing vendor registration channel exists for PBJ software providers (no CMS endorsement, no named vendors).

---

## 02 Corpus & moat — verdict: REFUTED

## Verdict: REFUTED — the data infrastructure is excellent, the market is already served at one-third the price

Starcheck's *technical* premise survives every test I put to it. Its *commercial* premise does not survive ten minutes of fetching competitor pricing pages. Three live vendors ship the exact feature list — including the forward-looking Five-Star simulation that was supposed to be the differentiator — at $99–$119/facility/month, each behind a **free self-serve tier**, against Starcheck's proposed $299.

### What checked out (all green, all verified today)

**The XSD is public, current, and small.** `nhpbj_4_10_0.xsd` downloads unauthenticated from cms.gov (507 lines, 8.8 KB). The full V4.10.0 data-spec bundle (1.6 MB, dated 01-16-2026) contains machine-readable `itm_mstr.csv` / `itm_val.csv` (the complete 40-entry `jobTitleCode` table: 5=RN DON, 7=RN, 9=LPN, 10=CNA…), plus PDF edit-change and unduplicated-edit reports. No login, no license. `fileSpecVersion` 4.10.0 is mandatory for files submitted on/after April 1, 2026 — premise confirmed against primary text, not a blog.

**The submission channel accepts third-party XML.** QSO-26-12-NH (July 14, 2026) confirms PBJ moved into iQIES on **August 17, 2026 — three days ago**. Deadlines unchanged (Feb 14 / May 15 / Aug 14 / Nov 14). iQIES defines a **"PBJ Submitter (Provider or Vendor)"** role that can "view, upload, edit PBJ data." So a customer-generated XML uploads fine. Human steps are real but one-time and fall on the *customer*: HARP account → request iQIES access → PSO approval → 60-day inactivity expiry. A vendor submitting on the facility's behalf must be approved per-CCN by each facility's PSO — a genuine A1 hazard if Starcheck ever wanted to submit directly, avoidable if it only hands back a file.

**The PUFs are alive.** `data.cms.gov/data.json` lists three PBJ datasets, all `modified: 2026-07-29`. The newest slice is **CY2026Q1**, and I pulled live rows from the API: full daily panel with `MDScensus` and hours split by job category and employee/contract. Not dead data — but note a real ~2-quarter lag: on Aug 20, 2026 the newest public panel ends March 31, 2026, so "you're 0.07 HPRD from the 4-star cut in your state" is a benchmark against a six-month-old distribution.

**Five-Star math is fully specified and deterministic.** The Technical Users' Guide (July 2026 edition, 34 pp) gives Table 3 staffing point ranges (1★ <155, 5★ 320–380 of 380), Appendix Table A2 decile cut-points for all six measures (Adjusted RN HPRD 100 pts at ≥1.202; Adjusted Total ≥5.070; weekend, RN turnover, total turnover, administrator departures), Table A1's 25 PDPM nursing CMIs (ES3 3.84 … PA1 0.62), and the exact formula: `Hours Adjusted = (Hours Reported / Hours Case-Mix) × Hours National Average Case-Mix`. Cut-points are **fixed national values re-derived only on methodology change** (last July 2024), not per-refresh — so the "hash the guide weekly and fail closed" cron is cheap and correct. It also confirms the one-star triggers Starcheck cites: no submission by deadline, or ≥4 days with zero RN hours.

### Where it gets fuzzy — and the answer is better than expected

Case-mix hours require the daily distribution of residents across 25 PDPM nursing CMGs, derived from MDS assessments Starcheck cannot see. But CMS publishes the facility-level output: Provider Information (`4pq5-n9py`, modified 2026-07-29, 14,693 rows) carries `nursing_casemix_index`, `casemix_rn/total/weekend_staffing_hours_per_resident_per_day`, the `adjusted_*` counterparts, and `staffing_rating` — and the national denominators live in State US Averages (`xcdc-v8bm`). So the simulator can run on **last-published case-mix as a proxy**, with error bounded by intra-year acuity drift. Everything needed is public and machine-readable. This is not the weak link the risks section feared.

### What actually kills it

The differentiator is already shipped, cheaper, by name:

- **SimplePBJ Pro (Simple / Netsmart, formerly ezPBJ)** — pricing page today: **"From $119 /month/facility."** Its four bullet groups are Starcheck's product spec verbatim: *ASSEMBLE* ("Import PBJ files from any source", "Map payroll exports to PBJ") → *VALIDATE* ("Scrub for errors", "Identify PBJ audit risks", "See Five-Star hours/resident day") → *PREDICT* ("See your staffing rating in real time", "'What If' staffing levels testing", "Forecast cost impact of staffing changes") → *SUBMIT* ("Submit PBJ report directly to CMS"). The product page adds "Predict your Staffing Five-Star 3-5 months early." Their own explainer even pre-solves the case-mix gap the same way Starcheck would: *"For customers who don't use SimpleLTC, ezPBJ projects your Five-Star rating using CMS provided Census reports and prior quarter's Case Mix."* And **SimplePBJ Essentials is "Free / for all facilities"** with an open self-serve registration form at app.simplepbj.com — which is exactly Starcheck's proposed "free public projected-star calculator" acquisition wedge, already live.
- **PBJ360° (PBJ Central)** — **"Triple Check FREE, up to 5 facilities per account"**; **"PBJ360° Submit — $99 per facility / month"** ($1,089/yr). Marketing copy is Starcheck's problem statement word-for-word: *"You can't see the risk in an XML"*, *"Payroll, timekeeping, spreadsheet logs & agency invoices"*, flagging automatic one-star rating, Care Compare exclusion, audit risk, turnover impact.
- **Votive** — syncs payroll/timekeeping nightly, *"Converts agency invoices or CSV files into PBJ-ready shift data"*, *"Real-time HRD and PPD forecasting"*, submission wizard.
- Plus Inovalon, SHP (PBJ Manager + Star Ratings with cost-to-reach-star what-ifs), SmartLinx/Netchex/Empeon bundles.

CMS also erodes the floor: a free **PBJ Excel-to-XML Template** (fill the Header/Employees/Staffing Hours tabs, Developer → Export), free manual entry in iQIES, free On-Demand and Final File Validation Reports, and free Five-Star Preview Reports.

### Kill-pattern scorecard

| # | Pattern | Fires? |
|---|---|---|
| 1 | Free first-party substitute | **Partial** — CMS ships Excel→XML template, manual entry, free validation + preview reports (but not payroll aggregation) |
| 2 | Live micro-SaaS at a fraction of the price | **FATAL** — $99 and $119/fac/mo, plus two free tiers |
| 3 | Bundled in software the buyer pays for | **Yes** — $319 MDS+PBJ suite; HCM/payroll modules |
| 4 | Premise misstated | No — mandate, versions, deadlines, one-star triggers all confirmed in primary text |
| 5 | A4 scraper-fleet conflict | No — single federal corpus, ~5 stable URLs |
| 6 | Dead data | No — PUFs modified 2026-07-29, CY2026Q1 rows served live |
| 7 | Engine-never-arbiter | **Yes** — "never a one-star surprise" is an outcome claim on a case-mix proxy the product cannot observe |

Pattern 2 alone is terminal: pricing at $299 into a market with $99 incumbents and free tiers means the wedge is *cheaper and worse*. Nothing in the Starcheck brief is unavailable to those vendors — they hold MDS data Starcheck does not.

### References

1. CMS, *Staffing Data Submission (PBJ)* — spec links, versions, deadlines. https://www.cms.gov/medicare/quality/nursing-home-improvement/staffing-data-submission
2. CMS, `nhpbj-4-10-0.zip` (XSD 4.10.0) — https://cms.gov/files/zip/nhpbj-4-10-0.zip
3. CMS, `pbj-data-specs-v4-10-0-01-16-2026.zip` — item master, item values, edit reports. https://cms.gov/files/zip/pbj-data-specs-v4-10-0-01-16-2026.zip
4. CMS, `pbj-excel-xml-template-v-4-10-0.zip` — free first-party XML generator. https://cms.gov/files/zip/pbj-excel-xml-template-v-4-10-0.zip
5. CMS, QSO-26-12-NH (Jul 14, 2026) — iQIES cutover, roles, PSO approval. https://www.cms.gov/files/document/qso-26-12-nh-original-release-2026-07-14.pdf
6. QTSO, *What to Expect: PBJ in iQIES* — https://qtso.cms.gov/news-and-updates/what-expect-pbj-data-submission-and-reporting-iqies
7. CMS, *Five-Star Technical Users' Guide, July 2026* — Tables 3, A1, A2, case-mix formula. https://www.cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/downloads/usersguide.pdf
8. data.cms.gov catalog + PBJ Daily Nurse Staffing API (CY2026Q1) — https://data.cms.gov/data.json · https://data.cms.gov/data-api/v1/dataset/7e0d53ba-8f02-4c66-98a5-14a1c997c50d/data
9. Provider Data Catalog, Provider Information `4pq5-n9py` (case-mix + adjusted HPRD) — https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0
10. Simple/Netsmart pricing — https://simple.health/pricing/
11. SimplePBJ product page — https://simple.health/solutions/skilled-nursing/simplepbj/
12. ezPBJ Five-Star predictor explainer — https://simple.health/instantly-predict-your-staffing-five-star/
13. SimplePBJ Essentials free signup — https://app.simplepbj.com/Account/Register
14. PBJ360° pricing/features — https://www.pbjcentral.com/cms-pbj-software-resources-directory/
15. Votive — https://www.getvotive.com/

### Proven

- PBJ XSD is public and unauthenticated: nhpbj_4_10_0.xsd (507 lines / 8.8KB) downloads from cms.gov; fileSpecVersion 4.10.0 is current and mandatory for files submitted on/after April 1, 2026
- Full V4.10.0 data specs are machine-readable: itm_mstr.csv + itm_val.csv include the complete 40-value jobTitleCode table (5=RN DON, 7=RN, 9=LPN, 10=CNA, etc.), plus edit-change and unduplicated-edit reports
- Deadlines confirmed against primary CMS text: Feb 14 / May 15 / Aug 14 / Nov 14, 11:59pm ET, 45 days after each federal fiscal quarter
- PBJ moved into iQIES on August 17, 2026 (QSO-26-12-NH, July 14, 2026); reporting requirements and deadlines unchanged; QIES stopped accepting PBJ after Aug 14, 2026 11:59pm ET
- iQIES supports XML file upload and defines a 'PBJ Submitter (Provider or Vendor)' role that can view, upload and edit PBJ data — third-party generated XML is an accepted channel
- iQIES onboarding requires human steps: HARP account, iQIES access request, correct PBJ role, and approval by the facility's Provider Security Official; vendors need PSO approval per CCN; 60-day inactivity revokes access
- PBJ Public Use Files are live, not stale: data.cms.gov/data.json lists three PBJ datasets all modified 2026-07-29; newest slice CY2026Q1; API returns full daily rows with MDScensus and hours by job category and employee/contract split
- Five-Star staffing math is fully public and deterministic: Technical Users' Guide (July 2026) Table 3 point ranges (1-star <155 ... 5-star 320-380 of 380), Appendix Table A2 decile cut-points for all six measures, Table A1's 25 PDPM nursing CMIs
- Case-mix formula is published verbatim: Hours Adjusted = (Hours Reported / Hours Case-Mix) x Hours National Average Case-Mix; national averages published in the State US Averages table (xcdc-v8bm, modified 2026-07-29)
- Facility-level case-mix is public despite being MDS-derived: Provider Information (4pq5-n9py, 14,693 rows, modified 2026-07-29) carries nursing_casemix_index, casemix_rn/total/weekend HPRD, adjusted_* HPRD and staffing_rating
- One-star triggers confirmed in primary text: failure to submit by deadline, four or more days in the quarter with zero RN hours when residents present, and failed/adverse audit response
- Staffing cut-points are fixed national values re-derived only on methodology change (originally 2022Q1 deciles, changed July 2024), not recomputed each monthly refresh
- CMS ships a free first-party XML generator: the PBJ Excel-to-XML Template v4.10.0 (Header / Employees / Staffing Hours tabs + Excel XML map, Developer > Export), plus free manual data entry and free validation reports
- Simple/Netsmart SimplePBJ Pro is live at 'From $119 /month/facility' and ships assemble (import from any source, map payroll exports), validate (scrub, audit risk, Five-Star HPRD), predict ('See your staffing rating in real time', "'What If' staffing levels testing", cost forecast) and submit directly to CMS
- SimplePBJ Essentials is free for all facilities with open self-serve registration at app.simplepbj.com/Account/Register — Five-Star staffing benchmarking, which is exactly Starcheck's proposed free-calculator acquisition wedge
- ezPBJ/Simple already solves the case-mix gap the same way Starcheck would: 'For customers who don't use SimpleLTC, ezPBJ projects your Five-Star rating using CMS provided Census reports and prior quarter's Case Mix'
- PBJ360 (PBJ Central) offers Triple Check FREE up to 5 facilities and PBJ360 Submit at $99/facility/month ($1,089/year), marketed against the identical failure modes (one-star rating, Care Compare exclusion, audit risk, turnover impact)
- Votive is a live competitor syncing payroll/timekeeping nightly, converting agency invoices/CSV to PBJ-ready shift data, with real-time HRD/PPD forecasting and a submission wizard
- Market size claim is approximately right: 14,693 certified facilities in the current Provider Information file (vs the claimed ~14,800)

### Unproven

- Exact enterprise pricing for SHP for Skilled Nursing, Inovalon and Votive (contact-sales only; no public price page fetched)
- Whether iQIES exposes any machine API for PBJ upload (no API documentation found; QSO memo and QTSO pages describe browser upload only)
- Whether the SimplePBJ Pro '$119' floor is per-facility at low volume or requires a multi-building commitment
- How much intra-year acuity drift degrades a simulation built on the prior quarter's published case-mix index — no error bound was measured
- The claim that 801 facilities dropped to one-star staffing in January 2025 and that >5% of nursing homes were penalised in a single quarter (sourced only to a vendor blog in the original entry; not verified against a CMS primary document)
- Whether the CY2026Q2 PBJ PUF will publish on schedule now that submissions have migrated to iQIES (first post-migration quarter is FQ4 2026)

### Fatal risks

- Kill pattern 2 (FATAL): SimplePBJ Pro at $119/facility/month and PBJ360 Submit at $99/facility/month are live today with self-serve free tiers, at one-third of Starcheck's proposed $299 — the wedge would be more expensive and strictly less capable
- The claimed differentiator does not exist: the forward-looking mid-quarter Five-Star staffing simulation with 'what if' hours testing has been shipped by ezPBJ/SimplePBJ since at least 2019 and is currently advertised as 'Predict your Staffing Five-Star 3-5 months early. Run "what if" scenarios to see what it would take to move up a star.'
- The proposed acquisition wedge — a free public projected-staffing-star calculator seeded from CMS data — is already the incumbent's free tier (SimplePBJ Essentials, free for all facilities; PBJ360 Triple Check, free up to 5 facilities)
- Kill pattern 3: the job is bundled into paid suites — Simple's $319/facility/month MDS+PBJ bundle includes 'iQIES submission and workflow', and SmartLinx/Netchex/Empeon/Inovalon ship PBJ modules inside payroll and HCM the buyer already pays for
- Kill pattern 7: 'never a one-star surprise' is an unattended outcome claim resting on a case-mix proxy the product cannot observe; incumbents that hold the customer's live MDS submissions can compute the real case-mix index, so Starcheck's projection is structurally less accurate than the competition's
- Kill pattern 1 (partial): CMS itself distributes a free Excel-to-XML template at v4.10.0, free manual entry in iQIES, free On-Demand and Final File Validation reports, and free Five-Star Preview Reports — collapsing the price ceiling for pure validate-and-generate value
- Competitors hold structural data Starcheck cannot obtain: MDS-derived daily census and PDPM CMG distribution. Starcheck must use lagged public case-mix, guaranteeing a wider confidence band than an MDS-connected vendor at a lower price

### References

- https://www.cms.gov/medicare/quality/nursing-home-improvement/staffing-data-submission (fetched 2026-08-20) — CMS PBJ landing page — fileSpecVersion 4.10.0 current (effective April 1, 2026), 4.00.0/2.00.x still accepted, quarterly deadlines Feb 14/May 15/Aug 14/Nov 14, and direct download URLs for the XSD, data specs, Excel-to-XML template and Policy Manual V2.7
- https://cms.gov/files/zip/nhpbj-4-10-0.zip (fetched 2026-08-20) — Downloaded (HTTP 200, 1,680 bytes) — contains nhpbj_4_10_0.xsd, 507 lines / 8,833 bytes, defining nursingHomeData with header/employees/staffingHours; public and unauthenticated
- https://cms.gov/files/zip/pbj-data-specs-v4-10-0-01-16-2026.zip (fetched 2026-08-20) — Downloaded (1.6 MB) — machine-readable itm_mstr.csv (21 rows) and itm_val.csv (127 rows) with the complete 40-value jobTitleCode table, plus edit-change, item-change and unduplicated-edit PDF reports dated 01-16-2026
- https://cms.gov/files/zip/pbj-excel-xml-template-v-4-10-0.zip (fetched 2026-08-20) — Downloaded and inspected — CMS's free first-party Excel workbook with xmlMaps.xml; instructions direct the user to Developer > Export to produce spec-valid XML, then 'Zip one or more XML files and upload via the PBJ web application'
- https://www.cms.gov/files/document/qso-26-12-nh-original-release-2026-07-14.pdf (fetched 2026-08-20) — QSO-26-12-NH, July 14, 2026 — PBJ transition to iQIES on August 17, 2026; HARP account + iQIES access request + PBJ role + PSO approval; PBJ Submitter (Provider or Vendor) role; vendors need PSO approval per CCN; QIES stopped accepting PBJ after Aug 14 2026 11:59pm ET; deadlines unchanged
- https://qtso.cms.gov/news-and-updates/what-expect-pbj-data-submission-and-reporting-iqies (fetched 2026-08-20) — QTSO notice — seven PBJ reports available in iQIES (Employee, Individual Daily Staffing, Staffing Summary, Job Title, Staffing Data, On Demand Final File Validation, Submitter Final File Validation); file upload 'very similar to QIES'
- https://www.cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/downloads/usersguide.pdf (fetched 2026-08-20) — Design for Care Compare Nursing Home Five-Star Quality Rating System: Technical Users' Guide, July 2026, 34 pp — Table 3 staffing point ranges, Appendix Table A2 decile cut-points for all six staffing measures, Table A1's 25 PDPM nursing CMIs, the case-mix adjustment formula, and the one-star scoring exceptions
- https://data.cms.gov/data.json (fetched 2026-08-20) — CMS open data catalog — three PBJ datasets (Daily Nurse Staffing, Daily Non-Nurse Staffing, Employee Detail), all modified 2026-07-29, newest distribution CY2026Q1
- https://data.cms.gov/data-api/v1/dataset/7e0d53ba-8f02-4c66-98a5-14a1c997c50d/data (fetched 2026-08-20) — Live PBJ Daily Nurse Staffing CY2026Q1 API rows — PROVNUM, MDScensus, Hrs_RN/LPN/CNA split by _emp and _ctr; confirms the panel is alive and machine-readable, not dead data
- https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0 (fetched 2026-08-20) — Provider Information dataset (modified 2026-07-29, count 14,693) — per-facility nursing_casemix_index, casemix_rn/lpn/aide/total/weekend HPRD, adjusted_* HPRD, staffing_rating and turnover; proves case-mix expected hours are publicly available per facility despite being MDS-derived
- https://data.cms.gov/provider-data/api/1/metastore/schemas/dataset/items (fetched 2026-08-20) — Provider Data Catalog index — confirms 'State US Averages' (xcdc-v8bm, modified 2026-07-29) exists and carries national casemix HPRD denominators required by the case-mix formula
- https://simple.health/pricing/ (fetched 2026-08-20) — Live pricing: SimplePBJ Pro 'From $119 /month/facility' with ASSEMBLE/VALIDATE/PREDICT/SUBMIT bullets including "'What If' staffing levels testing" and 'Submit PBJ report directly to CMS'; SimplePBJ Essentials 'Free / for all facilities'; MDS+PBJ bundle $319/month/facility including 'iQIES submission and workflow'
- https://simple.health/solutions/skilled-nursing/simplepbj/ (fetched 2026-08-20) — Current SimplePBJ product page — 'Predict your Staffing Five-Star 3-5 months early. Run "what if" scenarios to see what it would take to move up a star.'
- https://simple.health/instantly-predict-your-staffing-five-star/ (fetched 2026-08-20) — ezPBJ Five-Star predictor explainer — projections 4-6 months before CMS publishes; and the case-mix fallback 'For customers who don't use SimpleLTC, ezPBJ projects your Five-Star rating using CMS provided Census reports and prior quarter's Case Mix'
- https://app.simplepbj.com/Account/Register (fetched 2026-08-20) — Live self-serve signup for 'Free PBJ Analysis & Benchmarking Software' (SimplePBJ Essentials) — three-step form, add-facility flow, no sales contact required
- https://www.pbjcentral.com/cms-pbj-software-resources-directory/ (fetched 2026-08-20) — PBJ360 pricing and positioning — 'Triple Check FREE, up to 5 facilities per account'; 'PBJ360 Submit $99 per facility / month' / '$1,089 per facility / year'; copy targets automatic one-star rating, Care Compare exclusion, PBJ audit risk, turnover impact, and payroll/timekeeping/spreadsheet/agency-invoice reconciliation
- https://www.getvotive.com/ (fetched 2026-08-20) — Votive — live competitor: nightly payroll/timekeeping sync, 'Converts agency invoices or CSV files into PBJ-ready shift data', 'Real-time HRD and PPD forecasting', CMS submission wizard

---

## 03 Competition & pricing — verdict: REFUTED

## Starcheck (r2-22) — deep validation, pricing/bundling lens

**Verdict: REFUTED.** Every layer of the price stack Starcheck needs is already occupied, and it is occupied *downward*: CMS gives away the artifact generator, a live micro-SaaS gives away the exception report and sells the submission-plus-forecast bundle at **one third** of the $299/facility/month hypothesis, and the workforce suites the SNF already pays for ship both the XML and a Five-Star predictor. Kill patterns 1, 2 and 3 all fire, and 3 fires hardest.

### 1. CMS ships a free XML generator (kill pattern 1, on the artifact itself)

The core claim — "the agency publishes the spec but NOT a generator" — is false for PBJ. `https://www.cms.gov/files/zip/pbj-excel-xml-template-v-4-10-0.zip` returned **HTTP 200, 18,503 bytes, Last-Modified Fri 13 Feb 2026** when fetched today. I downloaded and opened it: `PBJ-Excel-to-XML-Template-v-4-10-0.xlsx`, four tabs (Instructions / Header / Employees / Staffing Hours), containing a real `xl/xmlMaps.xml` schema map. Step 3 of its Instructions sheet reads: *"From the Developer toolbar, select 'Export' and spec[ify]…"* — Excel emits the spec-valid 4.10.0 XML directly. The pre-filled Header row literally sets `softwareVendorName = CMS`, `softwareProductName = PBJ Excel Template`. CMS also ships the XSD (`nhpbj-4-10-0.zip`), the data specs (`pbj-data-specs-v4-10-0-01-16-2026.zip`), and an Admin/employee-linking template — all linked from the same page. The artifact is free to produce, from a spreadsheet, using the customer's own data. That is exactly the shape the two prior factory winners exploited, and here the agency already occupies it.

Worse for the "45-day panic" framing: **QSO-26-12-NH (July 14, 2026)** confirms PBJ moved into iQIES on **August 17, 2026** — three days ago — and that PBJ roles (PSO, PBJ Submitter, Provider Administrator, PBJ Viewer) can *"view, upload, **edit** PBJ data and run PBJ reports."* CMS then hands every facility seven free reports in iQIES: PBJ Employee Report (1700D), Individual Daily Staffing (1702D), Staffing Summary (1702S), Job Title (1703D), **PBJ Staffing Data Report (1705D)**, On Demand Final File Validation (with the 60-day wait *removed*), and Submitter Final File Validation. Free validation, free error reports, free staffing data, free upload/edit.

### 2. A live incumbent at $99/facility/month already sells the exact differentiator

PBJ Central's **PBJ360°**, pricing page fetched live today:

| Tier | Price | Contents |
|---|---|---|
| PBJ360° Triple Check | **FREE, up to 5 facilities per account**, "no credit card and no expiration date" | PBJ audit risks, F-Tag & survey risks, **1-star & exclusion triggers**, CMS file rejection checks, data integrity checks, data swings from prior quarters |
| PBJ360° Submit | **$99 / facility / month** or **$1,089 / facility / year** | Everything above, plus editor/approver roles, **CMS file submission & validation**, **Five Star forecasting**, **CSV & manual data entry**, multi-facility management |
| Enterprise | quoted | 10+ facilities |

Read that against Starcheck's spec. The "forward-looking simulation that a submission tool does not give" — the stated moat, the thing risk (1) said the product must win on — is a **bullet point in a $99 plan**. The "free public projected-star calculator" acquisition wedge is Triple Check, free, and free for *up to five buildings*, which is the entire single-building/small-chain target segment. And the timing is brutal: the page says *"Submit will be available in late August, once CMS migrates PBJ submission to the iQIES system on August 17th. Early adopters get a free trial of Submit until September 30."* A competitor is launching into the identical iQIES-transition window Starcheck identified, with a free trial covering the Nov 14 deadline Starcheck planned to launch against. Their premium tier (360Pro) already connects directly to workforce systems. They also publish the Five-Star Users Guide, PBJ Policy Manuals, QSO memos and a **PBJ Vendor Directory** free as content marketing — the "knowledge base" asset, given away.

### 3. Bundled inside software the SNF already pays for (kill pattern 3)

Smartlinx's SNF workforce suite lists **"Payroll Based Journal Reporting"** *and* a separate **"CMS Five-Star Predictor"** in its solutions nav; the Predictor page states it *"uses the exact formula and case-mix adjustments used by CMS to calculate your rating"* and lets users *"instantly visualize how making changes to key workforce metrics like adding staff or adjusting hours affects your star rating."* That is Starcheck's simulator, verbatim, inside a product bought for scheduling. OnShift's PBJ solution *"gathers information from different sources and systems, such as time and attendance, HRIS, and clinical"* including contractor and agency hours; UKG Workforce Ready *"produces a file formatted to the specific CMS data specs."* Inovalon sells PBJ reporting with "unlimited uploads, early validation, and direct QIES connectivity" inside Provider Cloud. Netchex, Fingercheck, APS, WebClock and ProCern (PBJSNAP) all carry PBJ modules. The premise that "existing answers are full HCM suites that require replacing payroll" is right about the suites but wrong about the conclusion — the standalone lane is already served, cheaply.

### 4. The resulting price band

**$0** (CMS iQIES + Excel-to-XML template + 7 reports) → **$0** (PBJ360 Triple Check, ≤5 facilities) → **$99/mo or $1,089/yr** (PBJ360 Submit, incl. Five Star forecasting) → **~$119–$249/mo** (SimplePBJ / SimpleLTC-Netsmart tiers, secondary-sourced only — their site sits behind a SiteGround captcha returning HTTP 202 to every first-party fetch I attempted) → bundled-at-no-marginal-cost inside Smartlinx/OnShift/UKG/Inovalon. Starcheck's **$299/mo, $2,990/yr** sits 3x above the standalone incumbent that ships the same feature list, in a market whose total ceiling is ~14,800 buildings — and whose free tier covers the target buyer's entire building count.

### 5. What would have to be true for a reshape — and isn't

A reshape would need a defensible slice PBJ360 and the suites don't hold. Candidates and why each fails: (a) *full-census peer benchmarking from the PBJ PUF* — real data, but it is a report, not the mandatory artifact, and PBJ Central already publishes research/analysis off the same public files; (b) *fuzzy job-code mapping and employee-ID reconciliation* — genuinely the hard part, but it is a feature of "CSV & manual data entry" at $99, and getting it wrong is precisely the AI-arbiter liability the shortlist note flagged; (c) *the forward simulation* — refuted twice over (PBJ360 $99, Smartlinx bundled with CMS's exact formula). Note also the shortlist's own reservation stands independently: asserting a projected Five-Star outcome that CMS computes and previews itself is engine-never-arbiter territory (pattern 7).

The one durable observation worth carrying forward: the *shape* Starcheck was chosen for is sound — mandatory recurring spec-defined artifact from the customer's own data. It just happens that in PBJ, CMS publishes the generator and a competitor commoditized the rest to $99 in the same month. The next candidate must be screened with an explicit first-party check for **an agency-published converter/template**, not merely an agency-published spec.

## References

- CMS, Staffing Data Submission Payroll Based Journal (PBJ) — https://www.cms.gov/medicare/quality/nursing-home-improvement/staffing-data-submission (fetched 2026-08-20)
- CMS, PBJ Excel to XML Template v4.10.0 (ZIP) — https://www.cms.gov/files/zip/pbj-excel-xml-template-v-4-10-0.zip (HTTP 200, 18,503 bytes, Last-Modified 2026-02-13; downloaded and inspected 2026-08-20)
- CMS, QSO-26-12-NH "Payroll Based Journal (PBJ) Transition to iQIES," July 14, 2026 — https://www.cms.gov/files/document/qso-26-12-nh-original-release-2026-07-14.pdf (fetched 2026-08-20)
- QTSO, "What to Expect: PBJ Data Submission and Reporting in iQIES" — https://qtso.cms.gov/news-and-updates/what-expect-pbj-data-submission-and-reporting-iqies (fetched 2026-08-20)
- PBJ Central, PBJ360° Pricing — https://www.pbjcentral.com/pricing/ (fetched 2026-08-20)
- PBJ Central, home — https://www.pbjcentral.com/ (fetched 2026-08-20)
- Smartlinx, Payroll Based Journal Reporting Software — https://www.smartlinx.com/solutions/payroll-based-journal/ (fetched 2026-08-20)
- Smartlinx, CMS Five-Star Predictor — https://www.smartlinx.com/solutions/cms-five-star-predictor/ (fetched 2026-08-20)
- Inovalon, PBJ Reporting Software — https://www.inovalon.com/products/provider-cloud/care-management/payroll-based-journal-reporting/ (fetched 2026-08-20)
- Simple/Netsmart SimplePBJ (blocked: HTTP 202 captcha wall on all first-party fetches) — https://simple.health/pricing/ (attempted 2026-08-20)
- CMS, Design for Care Compare Nursing Home Five-Star Quality Rating System Technical Users' Guide — https://www.cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/downloads/usersguide.pdf (fetched 2026-08-20)


### Proven

- CMS publishes a free, working PBJ Excel-to-XML Template v4.10.0 — https://www.cms.gov/files/zip/pbj-excel-xml-template-v-4-10-0.zip returned HTTP 200, 18,503 bytes, Last-Modified 2026-02-13; downloaded and opened: PBJ-Excel-to-XML-Template-v-4-10-0.xlsx with tabs Instructions/Header/Employees/Staffing Hours and a real xl/xmlMaps.xml schema map, Instruction step 3 = 'From the Developer toolbar, select Export'; the Header row is pre-filled softwareVendorName=CMS, softwareProductName=PBJ Excel Template.
- CMS also ships free the XSD (nhpbj-4-10-0.zip), the data specs (pbj-data-specs-v4-10-0-01-16-2026.zip) and a PBJ Admin Excel-to-XML template, all linked from the CMS staffing-data-submission page.
- PBJ moved from QIES to iQIES on 2026-08-17 (QSO-26-12-NH, July 14 2026). PBJ roles can 'view, upload, edit PBJ data and run PBJ reports' — i.e. free direct data entry/editing inside CMS's own system.
- CMS provides seven free PBJ reports in iQIES: Employee (1700D), Individual Daily Staffing (1702D), Staffing Summary (1702S), Job Title (1703D), PBJ Staffing Data Report (1705D), On Demand Final File Validation (60-day wait removed), Submitter Final File Validation.
- PBJ Central's PBJ360° sells submission at $99/facility/month or $1,089/facility/year, and that tier explicitly includes 'CMS file submission & validation', 'Five Star forecasting', 'CSV & manual data entry' and multi-facility management — the exact feature set Starcheck priced at $299/mo / $2,990/yr.
- PBJ360° Triple Check is FREE for up to 5 facilities per account, 'no credit card and no expiration date', and delivers PBJ audit risks, F-Tag & survey risks, 1-star & exclusion triggers, CMS file rejection checks, data integrity checks and quarter-over-quarter data swings — Starcheck's exception report and free-calculator wedge, given away, across the entire single-building/small-chain target segment.
- PBJ360° Submit launches into the identical window Starcheck identified: 'Submit will be available in late August, once CMS migrates PBJ submission to the iQIES system on August 17th. Early adopters get a free trial of Submit until September 30.'
- Smartlinx's SNF suite lists both 'Payroll Based Journal Reporting' and a separate 'CMS Five-Star Predictor' that 'uses the exact formula and case-mix adjustments used by CMS to calculate your rating' and lets users 'instantly visualize how making changes to key workforce metrics like adding staff or adjusting hours affects your star rating' — Starcheck's simulator, bundled inside software bought for scheduling.
- PBJ generation is bundled in multiple suites SNFs already pay for: OnShift (aggregates time & attendance, HRIS, clinical incl. contractor/agency hours), UKG Workforce Ready ('produces a file formatted to the specific CMS data specs'), Inovalon Provider Cloud (unlimited uploads, early validation, direct QIES connectivity), plus Netchex, Fingercheck, APS, WebClock, ProCern PBJSNAP.
- PBJ Central gives away the corpus Starcheck listed as its knowledge-base moat: Five-Star Users Guide, PBJ Policy Manuals, QSO memos, PBJ research studies, and a PBJ Vendor Directory — all free content marketing.
- Quarterly deadlines and the 4.10.0 mandate are real and correctly stated: Feb 14 / May 15 / Aug 14 / Nov 14, 11:59 PM ET, 45 days after quarter end; XML at versions other than 4.10.0 will be rejected on or after April 1, 2026.

### Unproven

- SimpleLTC/Netsmart SimplePBJ first-party pricing could not be verified: simple.health, www.simple.health and www.simpleltc.com all return HTTP 202 with a SiteGround captcha redirect (/.well-known/sgcaptcha/) to every fetch method tried today. The figures circulating ($119/mo/facility SimplePBJ Pro entry, $249/mo MDS+PBJ suite, $259/mo SimpleAnalyzer, $319/mo MDS+PBJ Professional) are secondary-source only and are NOT counted as evidence.
- ProCern PBJSNAP pricing — site returned HTTP 202 (bot wall); no first-party price obtained.
- Whether Smartlinx's CMS Five-Star Predictor is bundled at no marginal cost or sold as a paid add-on — no pricing is published; only the capability is confirmed.
- Consultant $/quarter rates for outsourced PBJ submission — no first-party consultant pricing page was located; the human-consultant lane's price band remains unquantified (though it is moot given the $0-$99 software band).
- Whether CMS still issues a free monthly Five-Star provider preview report post-iQIES — only secondary/state-agency sources mention it; the Five-Star Technical Users' Guide fetched today contains no 'preview' language, and QSO-26-12-NH does not address it.
- Actual paying-customer counts or retention for PBJ360° Submit — the product is days old, so its commercial traction is unknown (this does not rescue Starcheck, since the free Triple Check tier and CMS's free template are the binding constraints).

### Fatal risks

- Kill pattern 1 — free first-party substitute, aimed at the artifact itself: CMS publishes a working Excel-to-XML converter for spec 4.10.0 (verified HTTP 200, 18.5KB, Feb 2026), plus the XSD, the data specs, free upload AND edit of PBJ data in iQIES, and seven free validation/staffing reports. The premise 'the agency publishes the spec but not a generator' is factually false for PBJ.
- Kill pattern 2 — live micro-SaaS at a fraction of the imagined price: PBJ360° Submit is $99/facility/month or $1,089/facility/year against Starcheck's $299/mo and $2,990/yr, and its feature bullets include the Five Star forecasting that was Starcheck's declared moat. Its free tier (up to 5 facilities, no card, no expiry) covers Starcheck's entire target segment and delivers the exception report and the free-projected-star acquisition wedge for $0.
- Kill pattern 3 — bundled in software the buyer already pays for: Smartlinx ships PBJ reporting AND a CMS Five-Star Predictor using CMS's exact case-mix formula; OnShift, UKG Workforce Ready, Inovalon, Netchex, Fingercheck, APS, WebClock and ProCern all ship PBJ modules inside timekeeping/HR/payroll the SNF already buys.
- Competitive timing collapse: the one standalone incumbent is launching Submit in late August 2026 with a free trial through September 30 — i.e., it will have converted the iQIES-transition and Nov 14 deadline cohort before Starcheck could ship a first quarter.
- Kill pattern 7 residue (shortlist's own note, still standing): the headline promise is a projected Five-Star staffing outcome that CMS itself computes with unpublished cut-point timing; an unattended product signing that projection carries arbiter liability, and a wrong projection is worse than none.
- Market ceiling with no price headroom: ~14,800 certified facilities, a $0 free tier covering ≤5 buildings, and a $99 paid tier — the $2,990/yr ACV assumption has no defensible basis, collapsing the 5%-penetration / $2.2M ARR arithmetic by roughly 3x even before churn to free.

### References

- https://www.cms.gov/medicare/quality/nursing-home-improvement/staffing-data-submission (fetched 2026-08-20) — CMS PBJ landing page: lists free downloads (PBJ Excel-to-XML Template v4.10.0, nhpbj-4-10-0 XSD, pbj-data-specs-v4-10-0-01-16-2026, PBJ Admin template, policy manual), the four quarterly deadlines (Feb 14/May 15/Aug 14/Nov 14, 11:59pm ET, 45 days after quarter end), and the rule that files not at 4.10.0 are rejected on/after April 1, 2026.
- https://www.cms.gov/files/zip/pbj-excel-xml-template-v-4-10-0.zip (fetched 2026-08-20) — The free CMS Excel-to-XML generator itself. HTTP 200, content-type application/zip, content-length 18503, Last-Modified Fri 13 Feb 2026 19:05:28 GMT. Downloaded and unzipped: PBJ-Excel-to-XML-Template-v-4-10-0.xlsx, tabs Instructions/Header/Employees/Staffing Hours, contains xl/xmlMaps.xml; Instructions step 3 'From the Developer toolbar, select Export'; Header pre-filled fileSpecVersion 4.10.0, softwareVendorName CMS, softwareProductName 'PBJ Excel Template'.
- https://www.cms.gov/files/document/qso-26-12-nh-original-release-2026-07-14.pdf (fetched 2026-08-20) — QSO-26-12-NH (July 14, 2026), 'Payroll Based Journal (PBJ) Transition to iQIES': PBJ moved to iQIES Aug 17 2026; QIES stopped accepting PBJ after Aug 14 2026 11:59pm ET; roles PSO/PBJ Submitter/Provider Administrator/PBJ Viewer 'can view, upload, edit PBJ data and run PBJ reports'; full list of the seven free PBJ reports in iQIES (1700D, 1702D, 1702S, 1703D, 1705D, On Demand Final File Validation with the 60-day wait removed, Submitter Final File Validation).
- https://qtso.cms.gov/news-and-updates/what-expect-pbj-data-submission-and-reporting-iqies (fetched 2026-08-20) — QTSO transition notice: Q3 in QIES through Aug 14 2026, Q4 in iQIES from Aug 17 2026, no submissions Jul 1-Aug 16; 'You can upload PBJ files in a way that's very similar to QIES'; free iQIES report names.
- https://www.pbjcentral.com/pricing/ (fetched 2026-08-20) — PBJ360° pricing, live: Triple Check FREE up to 5 facilities per account, no credit card, no expiration (PBJ audit risks, F-Tag & survey risks, 1-star & exclusion triggers, CMS file rejection checks, data integrity checks, data swings from prior quarters); PBJ360° Submit $99 per facility/month or $1,089 per facility/year including editor/approver roles, CMS file submission & validation, Five Star forecasting, CSV & manual data entry, multi-facility management; enterprise pricing 10+ facilities; 'Submit will be available in late August, once CMS migrates PBJ submission to the iQIES system on August 17th. Early adopters get a free trial of Submit until September 30.'; 360Pro connects directly to workforce systems; billing is per facility with unlimited users.
- https://www.pbjcentral.com/ (fetched 2026-08-20) — PBJ360° product framing ('show the impact of your staffing data, before CMS does'; 'your current and projected Five Star staffing rating') plus the free corpus they publish as marketing: Five-Star Users Guide, PBJ Policy Manuals, QSO memos, PBJ research studies, and a PBJ Vendor Directory.
- https://www.smartlinx.com/solutions/payroll-based-journal/ (fetched 2026-08-20) — Smartlinx SNF suite navigation confirming both 'Payroll Based Journal Reporting' and a distinct 'CMS Five-Star Predictor' inside the same workforce/scheduling/payroll product line.
- https://www.smartlinx.com/solutions/cms-five-star-predictor/ (fetched 2026-08-20) — Five-Star Predictor: 'uses the exact formula and case-mix adjustments used by CMS to calculate your rating'; 'instantly visualize how making changes to key workforce metrics like adding staff or adjusting hours affects your star rating' — Starcheck's stated differentiator, bundled; no price published.
- https://www.inovalon.com/products/provider-cloud/care-management/payroll-based-journal-reporting/ (fetched 2026-08-20) — Inovalon PBJ Reporting inside Provider Cloud (unlimited uploads, early validation, direct QIES connectivity); no public price.
- https://simple.health/pricing/ (fetched 2026-08-20) — ATTEMPTED AND BLOCKED: HTTP 202 with SiteGround captcha redirect (meta refresh to /.well-known/sgcaptcha/) on every user-agent, cookie-jar and HTTP-version combination; also blocked at www.simple.health and www.simpleltc.com. SimplePBJ/SimpleLTC pricing therefore remains secondary-source only and is excluded from the proven set. Note ezpbj.com/ezpbj-pricing 301-redirects to simple.health/solutions/skilled-nursing/simplepbj/, confirming the indie ezPBJ tool was absorbed into Netsmart.
- https://www.cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/downloads/usersguide.pdf (fetched 2026-08-20) — Five-Star Technical Users' Guide (1,031,550 bytes): confirms the case-mix-adjusted RN and total nurse HPRD measures and PDPM/CMG-based case-mix adjustment are fully published by CMS; contains no 'preview report' language.

---

## 04 Kill-thesis — verdict: REFUTED

## Starcheck — REFUTED

Starcheck proposes $299/facility/month to turn a SNF's payroll CSV into a spec-valid PBJ XML at fileSpecVersion 4.10.0 plus a Five-Star staffing simulation. It is the right *shape* (mandatory, recurring, spec-defined artifact from the customer's own data) and dies anyway, on four independent kills, three of which are the canonical patterns.

### Kill 1 — CMS ships the generator itself, free (pattern 1)

The premise "the agency publishes the spec but NOT a generator" is false. On the CMS Staffing Data Submission page, under Downloads, sits `PBJ-Excel-to-XML-Template-v-4-10-0 (ZIP)`. I downloaded it today: HTTP 200, 18,503 bytes, containing `PBJ-Excel-to-XML-Template-v-4-10-0.xlsx` (file date 2026-02-02) — the current, non-rejectable version. CMS's own General User FAQ routes facilities to it verbatim: *"If you would like to develop your own XML file from a spreadsheet, a PBJ Excel to XML Template has been developed for converting a spreadsheet to an XML file."* The same FAQ states the two submission options are **"Manual Data Entry"** and XML file upload — both free, both updating the same database. CMS also publishes the XSD (`nhpbj_4_10_0`) and the full data specs. A free third-party converter exists too: Nursa's browser-local CSV/XLSX→PBJ-XML tool, no signup, no price, processing entirely client-side. Starcheck's core artifact is a commodity given away by the regulator and by a staffing marketplace as lead-gen.

### Kill 2 — an exact-shape incumbent at 1/3 the price, launching this week (pattern 2)

**PBJ360°** (PBJ Central, LLC) is Starcheck, already built, by people who describe themselves as PBJ veterans:

- **PBJ360° Submit — $99 per facility/month, or $1,089/facility/year.** "Build, review, approve, & submit PBJ files for your whole facility network." Billed per facility, unlimited users. Enterprise pricing at 10+.
- **PBJ360° Triple Check — FREE, up to 5 facilities per account, "no credit card and no expiration date."** It ingests your PBJ XML and reports exactly Starcheck's differentiator: *"Automatic one star rating," "Care Compare exclusion," "PBJ audit risk," "F-Tag & survey risk," "Turnover impact," "Significant nursing HPRD changes."*

Their launch timing is the tell: *"Submit will be available in late August, once CMS migrates PBJ submission to the iQIES system on August 17th. Early adopters get a free trial of Submit until September 30."* The regulatory event Starcheck would ride (QSO-26-12-NH, PBJ→iQIES on 2026-08-17) is being ridden right now by an incumbent charging one third of the hypothesis — and giving away the Five-Star risk analysis for free as the funnel. PBJ Central additionally runs free PBJ Academy courses including "Understanding Five Star Staffing Ratings," a free vendor directory, and a practitioner community. Netsmart's SimplePBJ Pro sits nearby (widely cited at ~$119/facility/month, with a free "Essentials" benchmarking tier); I could not fetch simple.health today — Sucuri captcha, HTTP 202 — so treat that price as unverified.

### Kill 3 — bundling and the shrunken independent base (pattern 3 + market)

CMS Provider Information (dataset 4pq5-n9py, modified 2026-07-29, pulled today): **14,693 certified facilities.** Chain affiliation is published in the file itself. Only **4,202 (28.6%) carry no chain name**; 599 are in chains of 2–5, 2,959 in 6–15, and 6,933 (47.2%) sit in chains of 16+ that buy corporate workforce suites. The genuinely unaffiliated single building is 4,202 — and even they mostly buy timekeeping. Workforce vendors ship the file: SBV Workforce Management's PBJ module "creates the XML file as required by CMS," allocates hours to job type codes, and classifies staff as contract vs. exempt/non-exempt. APS Payroll doesn't build it in-house but pipes payroll to Prime Care Technologies to produce the file. Realistic serviceable base is a few thousand buildings at a $99 clearing price — roughly a $5M ceiling with an incumbent already in it.

### Kill 4 — the input the product needs is the input the customer cannot export (input friction)

PBJ requires **agency and contract staff** hours, each with a unique employee ID, auditable to vendor invoices. Those hours live in accounts payable and agency portals, not payroll — which is precisely why misreporting happens. A two-CSV upload does not solve this; it is a data-collection process problem that consultants and full suites win because they touch the process. Starcheck's easiest input (payroll) is the part already easy; the hard part is out of reach.

### What actually survives: the mechanism claim, not the outcome

The Five-Star simulation is *partly* signable. The July 2026 Technical Users' Guide publishes **fixed** cut-points (Table A2: 100 points at Adjusted RN HPRD ≥ 1.202; Adjusted Total Nurse ≥ 5.070; ten decile bands each), set from 2022Q1 deciles and last revised July 2024 — not percentile-recomputed like health inspection. But the adjusted number is `Hours Adjusted = (Hours Reported / Hours Case-Mix) × Hours National Average Case-Mix`, where case-mix comes from the facility's daily PDPM nursing CMG distribution (MDS-derived) and the national average is recomputed each quarter across all submitters and published only afterward. So mid-quarter you can honestly say: *"your reported hours, divided by your last-known case-mix index, against the published 4-star band."* You cannot say "you will be a 3-star." And CMS already hands the facility the answer for free — Provider Information publishes each facility's Reported, Case-Mix, and Adjusted HPRD for every staff type, plus turnover and Staffing Rating, quarterly, for all 14,693 buildings. The "full-census public panel nobody's customer base can match" is a free CSV any competitor downloads in one curl; 790 facilities (5.4%) currently carry a staffing-rating footnote.

### Verdict

REFUTED. The agency ships the generator; a $99 incumbent ships the differentiator for free and launches into the same iQIES event this month; the buyer base is 4,202 unaffiliated buildings most of which already get the XML from timekeeping; and the one genuinely hard input (agency hours) is the one Starcheck cannot import.

## References

1. https://www.cms.gov/medicare/quality/nursing-home-improvement/staffing-data-submission — fetched 2026-08-20
2. https://www.cms.gov/files/zip/pbj-excel-xml-template-v-4-10-0.zip — fetched 2026-08-20
3. https://www.cms.gov/files/document/general-user-registration-and-submission-faq.pdf — fetched 2026-08-20
4. https://nursa.com/pbj-csv-xml-converter — fetched 2026-08-20
5. https://pbjcentral.com/cms-pbj-software-resources-directory — fetched 2026-08-20
6. https://www.cms.gov/files/document/qso-26-12-nh-original-release-2026-07-14.pdf — fetched 2026-08-20
7. https://www.cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/downloads/usersguide.pdf — fetched 2026-08-20
8. https://data.cms.gov/provider-data/sites/default/files/resources/ee0749ceb45c9c5d2c141343d1c87e2c_1785341745/NH_ProviderInfo_Jul2026.csv — fetched 2026-08-20
9. https://www.sbvwm.com/software/payroll-based-journal/ — fetched 2026-08-20
10. https://apspayroll.com/blog/pbj-reporting-requirements/ — fetched 2026-08-20
11. https://www.getvotive.com/ — fetched 2026-08-20
12. https://qtso.cms.gov/news-and-updates/what-expect-pbj-data-submission-and-reporting-iqies — fetched 2026-08-20

### Proven

- CMS itself ships a free PBJ XML generator: PBJ-Excel-to-XML-Template-v-4-10-0.zip downloaded today from cms.gov, HTTP 200, 18,503 bytes, containing PBJ-Excel-to-XML-Template-v-4-10-0.xlsx dated 2026-02-02 — the current mandatory version.
- CMS's General User, Registration and Submission FAQ states the two PBJ submission options are 'Manual Data Entry' and XML File Upload, both free and both updating the same database, and explicitly directs facilities to the Excel-to-XML template for spreadsheet conversion.
- Nursa operates a free, no-signup, browser-local CSV/XLSX-to-PBJ-XML converter at nursa.com/pbj-csv-xml-converter.
- PBJ360 (PBJ Central, LLC) sells 'PBJ360 Submit' at $99 per facility per month / $1,089 per facility per year — build, review, approve and submit PBJ files — one third of Starcheck's $299 hypothesis.
- PBJ360 gives away 'Triple Check' FREE for up to 5 facilities, 'no credit card and no expiration date', and it reports exactly Starcheck's differentiator: automatic one-star rating risk, Care Compare exclusion, PBJ audit risk, F-Tag & survey risk, turnover impact, significant nursing HPRD changes.
- PBJ360 Submit launches 'late August' 2026 timed to the CMS PBJ-to-iQIES migration on 2026-08-17, with a free Submit trial through September 30 — the incumbent is riding the exact regulatory event Starcheck would ride.
- CMS QSO-26-12-NH (2026-07-14) confirms PBJ moves to iQIES 2026-08-17, reporting requirements and quarterly deadlines unchanged, and that facilities get free PBJ reports in iQIES (Employee, Individual Daily Staffing, Staffing Summary, Job Title, Staffing Data, plus validation reports).
- CMS Provider Information (4pq5-n9py, modified 2026-07-29): 14,693 certified nursing facilities; 4,202 (28.6%) have no chain name; 599 in chains of 2-5; 2,959 in 6-15; 6,933 (47.2%) in chains of 16+.
- CMS publishes every facility's own Reported, Case-Mix and Adjusted HPRD by staff type, weekend HPRD, RN/total turnover, Nursing Case-Mix Index and Staffing Rating quarterly in the free Provider Information CSV — the 'full-census panel' knowledge-base asset is a free download for any competitor.
- Five-Star staffing cut-points are FIXED and published (July 2026 Technical Users' Guide, Table A2): Adjusted RN HPRD 100 points at >=1.202, Adjusted Total Nurse Staffing 100 points at >=5.070, ten decile bands each; set from 2022Q1 deciles, revised July 2024. The mechanism claim is therefore computable.
- Case-mix adjustment formula is Hours Adjusted = (Hours Reported / Hours Case-Mix) * Hours National Average Case-Mix, where the National Average is recomputed every quarter across all submitting facilities and published only after the fact — so an in-quarter adjusted-HPRD figure is an estimate with two unknowns.
- Workforce/payroll systems already generate the artifact: SBV Workforce Management's PBJ module 'creates the XML file as required by CMS' and classifies contract vs exempt/non-exempt staff; APS Payroll pipes payroll data to Prime Care Technologies to produce the file.
- 790 of 14,693 facilities (5.4%) carry a Staffing Rating footnote in the July 2026 Provider Information file, consistent with the scale of the '801 facilities' claim in the pool entry.
- PBJ requires agency/contract staff hours with unique employee IDs, auditable to vendor invoices — data that sits in accounts payable and agency portals, not in the payroll export Starcheck ingests.

### Unproven

- SimplePBJ Pro's exact price (~$119/facility/month) and SimplePBJ Essentials being free — simple.health and simpleltc.com returned HTTP 202 Sucuri captcha to both WebFetch and curl today; only secondary aggregators carry the figure, so it is not sourced.
- The precise definitions of CMS Staffing Rating footnote codes 23/24/25 (I counted footnoted facilities but did not fetch the footnote crosswalk).
- The full PBJ vendor directory contents — members.pbjcentral.com/c/pbj-vendor-directory/ is gated and returned only a page title.
- Inovalon's PBJ product features and pricing — inovalon.com returned HTTP 403.
- Whether iQIES retains the manual-data-entry option post-2026-08-17 (the FAQ documenting it predates the migration; QSO-26-12-NH says roles allow 'view, upload, edit PBJ data', implying edit/entry persists, but I did not find an explicit iQIES manual-entry statement).
- How many of the 4,202 unaffiliated facilities already receive a PBJ XML from an existing timekeeping/payroll vendor (no census of vendor penetration exists publicly).
- Whether facilities receive a Five-Star provider preview report for staffing before public posting — the word 'preview' does not appear in the July 2026 Technical Users' Guide and I did not verify a CASPER/iQIES preview product for the staffing domain.

### Fatal risks

- Free first-party substitute (pattern 1): CMS publishes AND ships the generator — PBJ-Excel-to-XML-Template-v-4-10-0.xlsx, downloaded today — plus free manual data entry and free XSD/specs. The premise 'agency publishes the spec but not a generator' is factually wrong for PBJ.
- Live micro-SaaS incumbent at a fraction of price (pattern 2): PBJ360 Submit at $99/facility/month vs the $299 hypothesis, launching into the same August 2026 iQIES migration, from operators with deep PBJ domain credibility and an existing audience (PBJ Academy, PBJ Circle, vendor directory).
- The differentiator is already free: PBJ360 Triple Check gives away one-star-risk detection, HPRD swing analysis, audit risk and turnover impact for up to 5 facilities with no expiry — Starcheck's entire Five-Star simulation is a competitor's free lead magnet.
- Bundling (pattern 3): timekeeping/workforce vendors (SBV et al.) and payroll partners (APS -> Prime Care Technologies) already emit the CMS XML for facilities that buy those systems; the standalone buyer is the residual.
- Knowledge-base asset is not proprietary: the 'full-census public panel' is a free quarterly CSV from data.cms.gov that already contains each facility's Reported, Case-Mix and Adjusted HPRD and Staffing Rating — zero moat.
- Engine-never-arbiter (pattern 7): the in-quarter Five-Star outcome cannot be signed because Hours National Average Case-Mix for the current quarter is unpublished and the facility's own case-mix distribution is MDS-lagged. Only a mechanism claim ('your reported hours vs the published band') is defensible, and that claim is worth far less than $299/month.
- Input friction: the genuinely hard input — agency/contract hours with unique employee IDs auditable to invoices — lives in AP, not payroll, and cannot be solved by a CSV upload; this is why the surviving vendors are process-touching suites and human consultants.
- Market ceiling: only 4,202 truly unaffiliated buildings of 14,693; at the market-clearing $99 that is roughly a $5M ceiling before churn, already contested.

### References

- https://www.cms.gov/medicare/quality/nursing-home-improvement/staffing-data-submission (fetched 2026-08-20) — CMS PBJ landing page — Downloads list including PBJ Data Specs V4.10.0, PBJ-Excel-to-XML-Template-v-4-10-0 (ZIP), nhpbj_4_10_0 XSD, PBJ Policy Manual V2.7; quarterly deadlines Feb 14 / May 15 / Aug 14 / Nov 14; 4.10.0 mandatory on/after 2026-04-01.
- https://www.cms.gov/files/zip/pbj-excel-xml-template-v-4-10-0.zip (fetched 2026-08-20) — The free CMS Excel-to-XML generator itself. HTTP 200, 18,503 bytes, contains PBJ-Excel-to-XML-Template-v-4-10-0.xlsx (23,291 bytes, dated 2026-02-02). Kills the 'no free generator' premise.
- https://www.cms.gov/files/document/general-user-registration-and-submission-faq.pdf (fetched 2026-08-20) — CMS FAQ: two submission options are 'Manual Data Entry' and XML File Upload, both free and both updating the same PBJ database; explicitly points facilities to the free Excel-to-XML template.
- https://nursa.com/pbj-csv-xml-converter (fetched 2026-08-20) — Free third-party CSV/XLSX to CMS-compliant PBJ XML converter, no signup, no price, runs locally in the browser.
- https://pbjcentral.com/cms-pbj-software-resources-directory (fetched 2026-08-20) — PBJ360 pricing and features: Submit $99/facility/month and $1,089/facility/year; Triple Check FREE up to 5 facilities with no credit card and no expiration; Triple Check flags automatic one-star rating, Care Compare exclusion, audit risk, F-Tag/survey risk, turnover impact, HPRD swings; Submit launches late August 2026 tied to the Aug 17 iQIES migration with free trial to Sept 30; free PBJ Academy course on Five Star staffing ratings.
- https://www.cms.gov/files/document/qso-26-12-nh-original-release-2026-07-14.pdf (fetched 2026-08-20) — QSO-26-12-NH (July 14, 2026): PBJ transitions to iQIES 2026-08-17; requirements and deadlines unchanged; free iQIES PBJ reports enumerated (Employee/1700D, Individual Daily Staffing/1702D, Staffing Summary/1702S, Job Title/1703D, Staffing Data/1705D, on-demand and system-generated validation reports); statutory basis 1128I(g) SSA and 42 CFR 483.70(q).
- https://www.cms.gov/medicare/provider-enrollment-and-certification/certificationandcomplianc/downloads/usersguide.pdf (fetched 2026-08-20) — Five-Star Technical Users' Guide, July 2026. Table A2 fixed staffing cut-points (Adjusted RN HPRD 100 pts >=1.202; Adjusted Total Nurse 100 pts >=5.070; weekend and turnover bands); case-mix formula Hours Adjusted = (Hours Reported / Hours Case-Mix) * Hours National Average Case-Mix with the national average recomputed and published quarterly after the fact; PDPM nursing CMI table (Table A1).
- https://data.cms.gov/provider-data/sites/default/files/resources/ee0749ceb45c9c5d2c141343d1c87e2c_1785341745/NH_ProviderInfo_Jul2026.csv (fetched 2026-08-20) — CMS Provider Information, July 2026 (dataset 4pq5-n9py, modified 2026-07-29). 14,693 facilities; 4,202 with no chain name (28.6%); 599 in chains of 2-5; 2,959 in 6-15; 3,702 in 16-50; 3,231 in 51+. Contains Reported/Case-Mix/Adjusted HPRD by staff type, weekend HPRD, RN and total nurse turnover, Nursing Case-Mix Index, Staffing Rating, and footnotes (790 facilities footnoted on staffing rating).
- https://www.sbvwm.com/software/payroll-based-journal/ (fetched 2026-08-20) — Bundling evidence: workforce management PBJ module 'creates the XML file as required by CMS', allocates hours to job type codes, classifies contract vs exempt/non-exempt staff.
- https://apspayroll.com/blog/pbj-reporting-requirements/ (fetched 2026-08-20) — Bundling evidence: APS Payroll pipes payroll data to Prime Care Technologies, which combines it with facility data to produce the complete PBJ reporting file.
- https://www.getvotive.com/ (fetched 2026-08-20) — Votive: additional live PBJ+NHSN reporting SaaS for post-acute providers — syncs payroll, tracks realtime HPRD, flags errors, submission wizard to CMS. Pricing not disclosed.
- https://qtso.cms.gov/news-and-updates/what-expect-pbj-data-submission-and-reporting-iqies (fetched 2026-08-20) — QTSO: iQIES PBJ report inventory and free validation reports (On Demand and System Generated Final File Validation), all downloadable as PDF/CSV.