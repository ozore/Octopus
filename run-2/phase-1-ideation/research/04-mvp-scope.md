# MVP Scope and Feasibility — Wage Line

**Assignment:** verify the buildable surface, set the v1 cut list against **D9**, name the riskiest unknowns and how each is de-risked with zero human minutes, and state the legal boundary.
**Date:** 2026-08-13. Every endpoint, schema and regulation below was fetched live today; responses are quoted, not remembered.

**Verdict: BUILDABLE, with one sequencing change.** Nothing in the WH-347 path is speculative. Three findings move scope: the federal form was **revised** and we would have shipped the wrong one; the CA eCPR schema **requires data the federal rule forbids on the same filing**; and the SAM index contains **no rates at all** — a second, undocumented endpoint does, and it is live.

---

## 1. The buildable surface, verified

### 1.1 The WH-347 changed under us

OMB control number **1235-0008** shows *"Revision of a currently approved collection," approved 01/06/2025*; the form on the WHD page is **Rev. January 2025, expires 01/31/2028**. The layout differs materially from the one every vendor blog still illustrates: **1A–1E** (Worker Entry No.; last/first/MI; Worker Identifying No.), **2** *(J) Journeyworker / (RA) Registered Apprentice* with level of progression, **3** classification, **4** daily hours split ST/OT, **5** total hours, **6A** rate ST and OT, **6B Total Fringe Benefit Credit**, **6C Payment in Lieu of Fringe Benefits**, **7A/7B** gross this project / all work, **8** deductions (tax withholdings, FICA, other, total), **9** net. The header now carries a **Wage Determination No.** field — the form itself asks for the thing D3 makes the paid boundary — and **"No. of Withholding Exemptions" is gone** federally while CA's XML still mandates it (§1.6).

The widely repeated **1 October 2026 cutover** is **vendor-asserted only** (Points North, SkillSmart, LCPtracker); I could not find it on a DOL page, and the asserting article cites no DOL source. Ries's rule is to build the smallest thing that *tests* the riskiest assumption, not the smallest thing that assumes it: v1 defaults to the revised form and keeps the legacy layout behind a per-project flag. Cost, one template; cost of guessing wrong, every filing in the transition window.

### 1.2 The statement of compliance is regulatory, not cosmetic

**29 CFR 5.5(a)(3)(ii)(C)** requires three certifications: records correct and complete; full weekly wages paid with *"no deductions … other than permissible deductions as set forth in 29 CFR part 3"*; and payment of *"not less than the applicable wage rates and fringe benefits or cash equivalents for the classification(s) of work actually performed, as specified in the applicable wage determination."* (D) confirms the WH-347 reverse satisfies it; **(E)** allows *"an original handwritten signature or a legally valid electronic signature"* — so a self-serve product can close this loop; **(F)** attaches **18 U.S.C. 1001 and 31 U.S.C. 3729**; **(G)** requires 3-year retention. On the revised form this is six checkboxes: 1–3 and 6 always, 4 for apprentices, 5 when claiming a fringe credit. Withholding the signature block on any unresolved line (D7) is not UX politeness — it is the only way to avoid emitting a certifiable-looking artifact whose third certification we cannot support.

### 1.3 CWHSSA arithmetic

**5.5(b)(1)**: above **forty hours in a workweek**, *"not less than one and one-half times the basic rate of pay."* **5.5(b)(2)**: liquidated damages of **$33 per calendar day** per affected worker — inflation-adjusted, so it is a **corpus value with an effective date, never a constant in code**. **5.32** supplies the arithmetic vendors get wrong: employer fringe contributions and true cash-in-lieu are *excluded* from the regular rate *"so long as the exclusions do not reduce the regular or basic rate below the basic hourly rate contained in the wage determination"*, while **employee** contributions are **not** excluded. So the premium is `0.5 × max(BHR_WD, cash_wage_excl_fringe)` on hours over 40 — computed on the cash rate, never on rate-plus-fringe. State daily overtime (CA Labor Code §1815, over 8/day) is a *different* obligation on the same hours; v1 computes CWHSSA and treats state daily/double-time as pass-through from the CSV.

### 1.4 Fringe credit and cash in lieu

**5.31(b)** gives exactly three discharge methods — contributions, all-cash, or a combination — with a worked example ($21.93 BHR + $6.27 fringe = $28.60 all-cash). That is the whole deterministic core. What is *not* buildable is the credit **rate**: **5.25(c)** requires contractors to **annualize** contributions over *"total hours worked on both private (non-DBRA) work and … DBRA-covered work"*, and **5.28** makes unfunded plans non-bona-fide absent WHD approval. Annualization needs total private hours and plan costs, which a certified-payroll CSV does not contain. **v1 accepts a stated hourly credit per plan as a customer-asserted input, prints it in 6B, and states on the artifact that we neither computed nor verified annualization.** Unfunded-plan credits are refused, not approximated.

### 1.5 Deductions

**29 CFR 3.5** lists the eight categories permissible without WHD approval: statutory withholding, bona fide prepayment, court process, benefit-fund contributions meeting four tests, credit union, government, §501(c)(3) charities, union dues. Anything else needs approval under 3.6. v1 maps CSV columns into WH-347 column 8 buckets; **an unmapped deduction blocks the line and is never swept into "Other"** — "Other" on a signed form is an implicit assertion of permissibility.

### 1.6 CA eCPR — schema obtained, and it conflicts with the federal rule

The XSD is public at its own namespace URI, `http://www.dir.ca.gov/dlse/CPR-Prod-Test/CPR.xsd` (49,325 bytes, 83 element declarations, `version="1.0"` **despite DIR publishing it as "V1.3"** — pin by content hash, never by version attribute). Verified: `day` **minOccurs=7 maxOccurs=7**; `employee` **maxOccurs=500**; `contractorPWCR` = `[0-9]{10}|NA`; `licenseType` = `CSLB|PL|OTHER`; `contractorFEIN` = `[0-9]{9}`; `name` carries `id="SSN::NAME"` uppercased and matching `ssn`; `payrollNum` and `amendmentNum` are declared **`fixed=""`** and must be emitted **empty** because DIR auto-increments them.

Two hard facts. **`ssn` is `[0-9]{9}` and required**, while **5.5(a)(3)(ii)(B)** says federal weekly transmittals *"must not"* include full SSNs and requires only an individually identifying number. Same worker, same week, two artifacts with opposite PII rules: store the SSN encrypted, emit last-four federally, emit nine digits only into CA XML. Second, `numWithholdingExemp` is required by CA and deleted from the revised federal form. There is no fringe-credit element anywhere; CA uses `deductionsContribPay` (fedTax, FICA, stateTax, SDI, vacationHoliday, healthWelfare, pension, training, fundAdmin, dues, travelSubs, savings, other, total, notes) and demands ST/OT/**DT** hours per day.

Access is the blocker D3 anticipated: upload runs through the Public Works Online System and needs a current **PWCR** plus a **DIR Project ID** created when the awarding body files a PWC-100. We can generate a schema-valid file offline; we cannot observe acceptance without a customer's account, so **G2 stands and the *generated, not acceptance-tested* label holds until in-product confirmation clears it.**

### 1.7 SAM — two endpoints, and the index has no rates in it

The index returns **HTTP 406 unless `Accept: application/hal+json`** — the likeliest cause of a silent nightly-crawl failure. Verified today: `totalElements` **4,236** active, **85,426** total, `maxAllowedRecords: 10000`. That cap is real — `page=120&size=100` returns **HTTP 400, "page and size creates a result window that is too large."** The active crawl (43 pages at size 100) fits; **the full historical crawl does not** and must be sliced by state/year/construction type into sub-10,000 buckets. The index carries `revisionNumber`, `publishDate` (epoch-ms), `modifiedDate` (ISO, `-04:00`), `isActive`, `constructionTypes`, county rows — **and no classifications and no rates**.

Rates come from a second endpoint recovered from SAM's own front-end bundle: **`/api/prod/wdol/v1/wd/{fullReferenceNumber}/{revisionNumber}`**, returning the determination text plus `publishDate`, `active`, `standard`. Three consequences. (a) The document **embeds its own Modification Number / Publication Date table**, a third independent revision check for free. (b) On the first record pulled, `VA20260195` rev 2, **the index says `isStandard: true` and the document says `standard: false`** — D5's dual-ingest disagreement rule earned its place on day one. (c) The body is fixed-width text whose classification names **wrap across lines**, grouped under union identifiers (`ELEC0080-011`), survey identifiers (`SUVA2016-080`) and `UAVG` averages — union-prefixed groups are exactly the CBA rates D9 refuses. It also embeds a live **EO 13658 floor of $13.65/hour from 11 May to 31 December 2026**, applicable only to certain award dates and never to Related-Acts-only contracts.

This is Hyrum's Law territory: we depend on observable behaviour, not a contract. The mitigation is not avoidance — there is no alternative source — but making the failure boring (§3).

---

## 2. The v1 cut list

**In:** payroll CSV ingest with a mapping step; deterministic gross / fringe-credit / cash-in-lieu / CWHSSA-overtime / deduction / net arithmetic; revised WH-347 PDF with legacy layout behind a flag; six-box statement of compliance with signature withheld on any unresolved line; WD pinning from the index plus rate extraction from the `wdol` document endpoint; per-classification diff since award; classification ranking constrained to that WD's parsed class list; account-scoped classification memory; XSD-validated CA eCPR XML labelled *generated, not acceptance-tested*; provenance footer; Stripe self-serve; the free WH-347 generator.

**Out, per D9 and confirmed above:** union CBA fringe schedules (the WD text carries only the aggregate fringe number); annualization; unfunded-plan credits; apprenticeship-ratio opinions; SCA determinations; states beyond CA; running payroll or taxes; filing, submitting or e-signing for the customer; holding portal credentials; SF-1444 conformance; any legal conclusion; any human review at any tier.

**Newly cut on evidence:** deriving state daily-overtime and double-time obligations (CA's determination-specific overtime schedules are a second corpus; DT hours pass through from the CSV), and **PDF form-field filling** — the WH-347 PDF has an AcroForm but its field names were not extractable by direct parse, so we render our own geometry rather than depend on undocumented names DOL can rename at the next revision.

---

## 3. Riskiest unknowns, de-risked without a human

| # | Unknown | Mechanism |
|---|---|---|
| **U1** | `wdol/v1/wd/…` is undocumented; it can 404 or change shape | Every document stored verbatim, forever, with its response hash. A parse failure never overwrites a good record: the snapshot fails promotion and generation keeps reading the last-good mirror (D7). Parse rate below threshold freezes new rate assertions behind a dated banner. |
| **U2** | The 406 / 10,000-window / rename class of failures fails **silently** | Three probes, any of which halts promotion: `totalElements` vs last good run (G3's 0.5% delta); the `_index` alias string changing; per-WD content hash. HTTP 200 with zero results is a failure, not "no changes". |
| **U3** | Index/document disagreement (observed on `VA20260195`) | Disagreement on any pinned field blocks promotion of **both** paths for that WD and narrows its rate assertions to the last agreed snapshot. Never publish either side. |
| **U4** | Fixed-width parsing with wrapped classification names | Golden-corpus parser tests across ≥25 WDs and ≥8 states (G1's spine). A WD whose parsed class count or rate checksum moves without a revision bump is quarantined. Unparsed classes surface as unavailable — a silently dropped class is how a wrong rate reaches a signed form. |
| **U5** | Whether the revised WH-347 becomes mandatory 1 Oct 2026 | Both layouts ship. WHD form page and PDF hash-diffed weekly (D5); a change flips the default and regenerates nothing already filed. |
| **U6** | CA acceptance is unobservable without a customer account | XSD hash-pinned, fail-closed; every file validated before download; in-product confirmation accumulates G2's evidence; the *generated, not acceptance-tested* label is code-enforced until the counter clears. |

---

## 4. Legal exposure

**Never assert.** That a filing is accepted, compliant or approved. That a wage determination is *effective* for a contract — FAR 22.404-6 turns on a contracting-officer finding we cannot observe, so state the rule and the observable dates and decline the conclusion. That EO 13658's $13.65 floor applies, since it depends on award date and DBA-versus-Related-Acts coverage we do not hold. That a fringe credit is annualized, bona fide or WHD-approved. That a deduction is permissible under 29 CFR 3.5. That a classification is *correct* — we rank candidates from that WD's own list with verbatim scope text; the contractor chooses. That a cash payment is genuinely "in lieu of" a fringe rather than part of the straight-time wage: **5.32(c) makes that a question of fact**, and it moves the overtime base. That an apprenticeship ratio is met. And no measured-performance claim before G1–G6 clear.

**Standing disclaimers.** In the flow: *"Wage Line computes and formats certified payroll from data you supply. You certify it. We do not file, submit or sign on your behalf, and this is not legal advice."* On every artifact: *"Rates from wage determination {WD} revision {N}, published {date}, corpus snapshot {hash}, generated {timestamp}. Newer-revision check last completed {timestamp}."* On any blocked line: **DRAFT — NOT CERTIFIABLE**, signature withheld. On CA XML: *generated against schema hash {h}; not acceptance-tested.*

**Name the exposure accurately.** The per-claim **False Claims Act** penalty is **$14,308–$28,619** plus treble damages; DBRA's own remedies are back wages with interest, withholding, and **three-year debarment under 29 CFR 5.12**. The shortlist's "DBA civil penalties run to $28,619 per violation" mislabels the FCA figure and must not appear in copy.

**Challenge — D9 (annualization).** D9 excludes union CBA fringe but is silent on annualization, which is the more common *open-shop* trap (5.25(c)). Implemented as specified; recording that annualization must be explicitly out of scope and explicitly disclaimed, or the number in 6B carries an assertion we never made.

**Challenge — D3 (California as launch demand market).** eCPR needs a PWCR, a DIR Project ID from a PWC-100, and a portal account — none self-servable by us. Implemented as specified (CA the demand market, federal WH-347 the launch deliverable), but the honest read is that CA revenue arrives a gate later than the pitch implies, and acquisition copy should sell the federal artifact.

---

## References

- https://www.dol.gov/agencies/whd/forms/wh347 — WH-347 and instructions; revised columns; OMB 1235-0008, expires 01/31/2028
- https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf — form PDF, "Rev. January 2025"
- https://www.reginfo.gov/public/do/PRAOMBHistory?ombControlNumber=1235-0008 — ICR history; revision approved 01/06/2025
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5 — certified payroll, statement of compliance, CWHSSA overtime, $33/day liquidated damages
- https://www.ecfr.gov/api/versioner/v1/full/2026-08-11/title-29.xml?part=5&section=5.5 — machine-readable source of the quotations above
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-B/section-5.25 — annualization
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-B/section-5.28 — unfunded plans
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-B/section-5.31 — discharging the wage obligation
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-B/section-5.32 — overtime and fringe exclusion
- https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.12 — debarment
- https://www.ecfr.gov/current/title-29/subtitle-A/part-3/section-3.5 — permissible deductions
- http://www.dir.ca.gov/dlse/CPR-Prod-Test/CPR.xsd — CA eCPR XSD (fetched 2026-08-13)
- https://www.dir.ca.gov/Public-Works/CPR/CPRSample.xml — sample eCPR instance
- https://www.dir.ca.gov/public-works/certified-payroll-reporting.html
- https://www.dir.ca.gov/Public-Works/ecprfaq.html
- https://www.dir.ca.gov/public-works/ecpruserguide.pdf
- https://www.dir.ca.gov/Public-Works/Guides/Upload-eCPR.pdf
- https://codes.findlaw.com/ca/labor-code/lab-sect-1815.html — CA daily overtime on public works
- https://sam.gov/api/prod/sgs/v1/search/?index=dbra&page=0&size=2&is_active=true&sort=-modifiedDate — DBRA index; requires `Accept: application/hal+json`; 4,236 active / 85,426 total; `maxAllowedRecords: 10000`
- https://sam.gov/api/prod/wdol/v1/wd/VA20260195/2 — per-WD document endpoint returning full determination text
- https://sam.gov/wage-determination/VA20260195/2
- https://www.acquisition.gov/far/22.404-6 — wage determination effectiveness
- https://www.ecfr.gov/current/title-28/chapter-I/part-85/section-85.5 — FCA civil penalty inflation adjustment
- https://fcablog.sidley.com/2025/07/07/department-of-justice-announces-2025-inflationary-adjustments-to-fca-penalties/ — $14,308–$28,619 per claim
- https://www.points-north.com/trends-and-insights/still-using-the-old-wh-347-deadline-is-september-2026 — vendor-asserted 1 Oct 2026 cutover, no DOL source cited
- https://www.skillsmart.us/the-new-wh-347-requires-more-than-a-new-form/ — same claim, independent vendor
- https://lcptracker.com/blog-post/faq-how-to-complete-the-revised-wh-347-form/ — revised-form change list
- https://www.hyrumslaw.com/ — implicit dependency on the observable behaviour of an undocumented interface
- https://theleanstartup.com/principles — Ries: the MVP as the smallest test of the riskiest assumption
