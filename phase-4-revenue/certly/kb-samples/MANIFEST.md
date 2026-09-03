# `kb-samples/` — corpus manifest

**Collected 2026-09-03 by the Certly Product Owner agent.** Every file below was fetched live from the
URL in its row on that date (`curl -L`, Chrome UA). Nothing here was generated, edited or reconstructed.

**What this corpus is for.** Three jobs, and they are deliberately separate directories:

| dir | job | consumed by |
|---|---|---|
| `certificates/` | real-layout ACORD 25 documents → the **golden set** for extraction evals (`specs/03-coi-extraction.md` §9) | `apps/certly/src/lib/extract/evals/` |
| `endorsements/` | real endorsement pages → the endorsement-form glossary and the "endorsement attached" test cases | `KNOWLEDGE_BASE.md` §C |
| `requirements/` | real published insurance-requirement exhibits → the **requirement-template library** | `KNOWLEDGE_BASE.md` §B |

---

## Licence and personal-data policy (read before adding a file)

1. **Public documents only.** Every file is published on a `.gov`, `.edu` or company website with no
   login, no paywall and no click-through agreement. None was scraped from behind an authentication wall.
2. **ACORD's marks.** The ACORD 25 form layout and the ACORD name and logo are ACORD's property; the
   forms below carry `© 1988–2015 ACORD CORPORATION. All rights reserved.` We store these third-party
   publications **as fetched, unmodified, as test fixtures**, and we do not redistribute them, publish
   them, or reproduce the blank form in Certly's own UI. **We never render an ACORD-branded form.**
   Certly's outputs are our own tables and PDFs. Any future need to *produce* an ACORD form is a
   licensing question for the founder, not an engineering one — logged as OQ-5.
3. **No private individuals.** Every filled certificate below names organisations only, with three
   documented exceptions, all of which are fine and are named here rather than hidden:
   - `certificates/wisdot-...pdf` — signed `Joseph A. Sample`, a WisDOT-authored placeholder.
   - `certificates/nyc-dycd-...package.pdf` — `Jane Doe`, an NYC-authored placeholder.
   - `certificates/certificates_how_to_read...pdf` — `© Elizabeth Carmichael 2017`, the training
     document's **author byline**, not a policyholder. Retained as attribution.
   No producer contact name, no signatory, and no insured principal in this corpus is a real
   private individual. **A real person's name must never be reproduced in Certly prose, prompts, UI
   copy, marketing or eval output** — a fixture may only *reference* the file and page.
4. **Adding a file.** Add the row here first (URL, fetch date, why it is here, personal-data note), then
   the file. A file without a manifest row fails `kb:check`.

---

## `certificates/` — 15 files, 99 pages, 11 distinct ACORD 25 layouts

`rev` is the ACORD 25 revision stamped in the form footer. `layer` is what an extractor gets from the
PDF text layer: **form** = a real AcroForm/vector PDF whose text extracts but in *visual-block order,
not reading order*; **scan** = raster pages with an OCR text layer; **embedded** = the certificate is a
page inside a larger guidance document.

| # | file | source URL (fetched 2026-09-03) | rev | pages | layer | why it is in the corpus |
|---|---|---|---|---|---|---|
| C1 | `wisdot-insurance-cert-example-acord25-2016-03.pdf` | https://wisconsindot.gov/Documents/doing-bus/real-estate/permits/insurance-cert-example.pdf | 2016/03 | 1 | form | **The canonical current-edition fixture.** Fully filled, single carrier (The Hartford) across GL/auto/umbrella/WC, blanket AI wording in Description of Operations. Text layer extracts *bottom-up* — the single best demonstration of why reading-order parsing fails. |
| C2 | `story-county-ia-coi.pdf` | https://www.storycountyiowa.gov/AgendaCenter/ViewFile/Item/29756?fileID=23897 | 2016/03 | 5 | form | **A genuine issued certificate**, not a sample: three insurers, a non-ISO carrier AI form (`RSCG0303`), and `CG2001`/`CG2404` named **only in Description of Operations** while the `ADDL INSD`/`SUBR WVD` columns carry `Y`. The hardest and most realistic endorsement case in the set. |
| C3 | `temecula-ca-sample-insurance-certificate.pdf` | https://temeculaca.gov/DocumentCenter/View/14593/Sample-Insurance-Certificate | 2016/03 | 3 | form | City-published annotated sample; `CG 20 37 04 13` cited, plus a WC waiver form (`WC 99 04 10`, a state/carrier variant rather than `WC 00 03 13`). Tests "equivalent form" matching. |
| C4 | `certificates_how_to_read_and_review_with_acord_forms.pdf` | https://www1.wellesley.edu/sites/default/files/assets/certificates_how_to_read_and_review_with_acord_forms.pdf | 2016/03 | 10 | embedded | The best *human* explanation of the form found anywhere public: box-by-box review procedure for administrators. Source for the field inventory in `KNOWLEDGE_BASE.md` §A and for the review-UI copy. |
| C5 | `OSFL-coi-sample.pdf` | https://scl.cornell.edu/sites/scl/files/documents/OSFL-coi-%20sample.pdf | 2014/01 | 1 | form | 2014/01 layout with a **$100,000 SIR** in the GL row and an `Excluded` value where a limit is expected. Tests numeric-field discipline (a limit box is not always a number). |
| C6 | `Sample-COI-Vendors-08-03-2020.pdf` | https://www.risk.cornell.edu/files/2022/08/Sample-COI-Vendors-08-03-2020.pdf | 2010/05 | 1 | **scan** | Scanned on a Fujitsu fi-7260 and OCR'd by Acrobat Paper Capture. The OCR layer is visibly corrupt (`INSUARNCE`, `~`, `IOJ~-`) while the *image* is perfectly legible. The reason Certly sends page images, not extracted text. Also carries 6 coverage rows incl. Professional and Cyber in `OTHER:`. |
| C7 | `durham-county-sample-coi-consultant-contractor.pdf` | https://dconc.gov/Files/Sample_COI_for_Consultant_and_Contractor_Templates1.pdf | 2010/05 | 1 | form | County "TIPS" overlay sample: shows a reviewer's own annotations printed onto the certificate. Tests that annotation text is not mistaken for certificate data. |
| C8 | `nyc-dycd-insurance-sample-package25.pdf` | https://www.nyc.gov/assets/dycd/downloads/pdf/Insurance-Sample-Package25.pdf | 2014/01 | 17 | embedded | A full **proof-of-insurance package**: ACORD 25 + `CG 20 10 04 13` + `CG 20 26 11 85` + NY disability/WC state forms. The multi-document upload case. |
| C9 | `nyc-dycd-fy2023-proof-of-insurance-sample-package.pdf` | https://www.nyc.gov/assets/dycd/downloads/pdf/FY2023_Proof-of-Insurance_Sample_Package.pdf | 2014/01 | 16 | embedded | Second NYC package, different fiscal year — near-duplicate content, useful as a *duplicate-detection* fixture. |
| C10 | `los-alamitos-ca-coi-sample.pdf` | https://cityoflosalamitos.org/DocumentCenter/View/497/Certificate-of-Insurance-Sample-PDF | 2016/03 | 12 | embedded | Certificate **plus five real endorsement pages** (`CG 20 10 04 13`, `CA 20 48 10 13`, `CA 04 44 10 13`, `WC 04 03 06`, `CG 29 88 10 13`). The richest single "cert + endorsements" bundle in the corpus. |
| C11 | `riverside-ca-risk-management-sample-coi.pdf` | https://www.riversideca.gov/finance/PDF/Risk%20Management/RISK%20MANAGEMENT-%20SAMPLE%20COI.pdf | (unstamped) | 7 | embedded | Certificate + `CG 20 01 04 13`, `CG 20 26 04 13`, `CG 24 04 05 09`, `CA 04 44 10 13`, `WC 00 03 13`. The primary-and-non-contributory + waiver bundle. |
| C12 | `essex-county-ny-fairgrounds-sample-cert.pdf` | https://essexcountyny.gov/downloads/Fairgrounds/7-Sample_Insurance_Cert.pdf | (unstamped) | 3 | form | Event/venue-flavoured requirements with `CG 20 10 04 13` blanket AI wording; the closest analogue to a **commercial-tenant** certificate in the corpus. |
| C13 | `tn-suppliers-certificate-of-insurance.pdf` | https://www.tn.gov/content/dam/tn/generalservices/documents/cpo/job-aids/suppliers/Suppliers_Certificate_of_Insurance.pdf | (unstamped) | 9 | embedded | A state procurement **job aid** with a box-by-box acceptance checklist ("header / coverages / footer"). Second independent source for the field inventory; names `CG 00 01` as the required GL form. |
| C14 | `idaho-iceworld-coi-sample.pdf` | https://www.idahoiceworld.com/media/1070/certificate_of_insurance_sample.pdf | (unstamped) | 5 | embedded | Municipal facility "Quick Tips — Understanding the ACORD Certificate of Insurance". Short, plain-English gloss on each box; source for review-UI tooltips. |
| C15 | `mcgough-subcontractor-sample-coi-exhibit-b.pdf` | https://www.mcgough.com/wp-content/uploads/2024/05/Subcontractor_Sample_COIExhibit-B_4.12.24.pdf | 2010/05 | 8 | embedded | A GC's own **sample-COI-as-instruction**: the certificate a subcontractor must return, with the required values pre-typed. This is exactly the artefact Certly's "required certificate" feature would replace. |

**Layout coverage achieved:** ACORD 25 revisions **2010/05, 2014/01, 2016/03** (2016/03 is the current
edition — see `KNOWLEDGE_BASE.md` §A.2); vector form PDFs, an OCR'd scan, and certificates embedded in
larger packages; single-insurer and four-insurer certificates; checkbox-driven and
Description-of-Operations-driven endorsement evidence; `$`-value, `Excluded`, `SIR` and blank limit boxes.

**Known gap, stated rather than hidden.** None of these files can be attributed to a *named* agency
management system (Applied Epic, Vertafore AMS360, HawkSoft, EZLynx). AMS vendors do not publish
specimen output, and issued certificates do not name the system that produced them. The
producer/creator strings above (`Silverlake Software LLC - Forms Designer`, `Aspose Ltd.`,
`EVPD PDF Output Filter`, `Bluebeam`) are the only forensic signal available, and they identify the
*rendering* library, not the AMS. `KNOWLEDGE_BASE.md` §A.4 therefore treats AMS-variant handling as a
**hypothesis to be retired with customer documents**, not as knowledge we already have. Marked
`UNVERIFIED` there.

---

## `endorsements/` — 3 files

| # | file | source URL (fetched 2026-09-03) | why |
|---|---|---|---|
| E1 | `nevada-risk-cert-and-endorsement-samples.pdf` | https://risk.nv.gov/uploadedfiles/risknvgov/content/Contracts/CertOfInsAndEndorsementSamples.pdf | State risk-management specimen pack including `CG 20 26 11 85`; shows what an acceptable endorsement page looks like next to the certificate. |
| E2 | `sierra-madre-ca-acceptable-waiver-of-subrogation-endorsements.pdf` | https://www.sierramadreca.gov/media/fg4hgcis/acceptable-waiver-of-subrogation-endorsements.pdf | A city's list of **acceptable** waiver forms — `CG 24 04`, `CG 24 04 05 09`, `WC 00 03 13`, `WC 04 03 06`. Primary evidence that "equivalent form" is a real requirement-matching problem, not an edge case. |
| E3 | `ncrb-wc-00-03-13-instructions.pdf` | https://www.ncrb.org/Portals/0/ncrb/workers%20comp%20services/WC%20Endorsements/WC_00_03_13%20Instructions.pdf | The North Carolina Rate Bureau's own instruction sheet for `WC 00 03 13`. A **bureau** source (not a broker blog) for the WC waiver form's meaning. |

---

## `requirements/` — 5 files, all primary

These are real, published insurance-requirement exhibits from operating general contractors. They are
the evidential base for the GC-side templates in `KNOWLEDGE_BASE.md` §B.2 — *what GCs actually demand*,
not what a blog says they should.

| # | file | source URL (fetched 2026-09-03) | what it gives us |
|---|---|---|---|
| R1 | `wl-butler-subcontractor-insurance-requirements.pdf` | https://www.wlbutler.com/wp-content/uploads/2018/08/SUBCONTRACTOR-INSURANCE-REQUIREMENTS.pdf | **The single best template source.** Baseline $1M/$1M/$2M/$2M for all trades, then a named **high-hazard trade list** (grading, concrete, shoring, de-watering, underground utilities, EIFS, fire protection, HVAC, plumbing, roofing, siding/stucco, flashing, skylights/windows/storefronts, waterproofing, exterior sheet metal, rough carpentry, scaffold, crane) at **$5M** across four limits, plus SIR > $25,000 disclosure, `CG 20 10 11 85` *or* `CG 2010 1001 + CG 2037 1001`, `WC 00 03 13` by name, pollution liability triggers, and a no-claims-made rule. |
| R2 | `acco-exhibit-d-subcontractor-insurance.pdf` | https://www.accoes.com/wp-content/uploads/2019/08/Exhibit-D-Subcontractor-Insurance-ACCO.pdf | GL $1M occ / $1M P&A / $2M agg / $2M products-completed, auto $1M CSL (owned+hired+non-owned), WC statutory + $1M EL, **excess $4M**, monopolistic-state stop-gap (WA/OH/WY/ND), MCS-90 + CA 99 48 for hazmat hauling, and a 30-day cancellation-notice demand. |
| R3 | `robins-morton-sample-subcontractor-insurance-requirements.pdf` | https://www.robinsmorton.com/wp-content/uploads/Sample-Subcontractor-Insurance-Requirements.pdf | EL split $1M each accident / $1M each disease / $1M each employee; GL $2M gen agg, $2M products-completed, $1M occ, $1M personal injury, $50k fire damage, $5k medical; **per-project aggregate**; AI + waiver naming Contractor, Owner, Architect and other indemnitees. |
| R4 | `flintco-exhibit-b-sample-insurance.pdf` | https://flintco.com/wp-content/uploads/2026/01/Exhibit-B_Sample_Flintco_1.20.2022_FINAL-002.pdf | Names **A.M. Best A-, VIII** as the carrier-rating floor, requires ACORD 25 specifically, project reference in Description of Operations, renewal certificate **10 days before expiry**, 30-day advance notice of reduction — and states outright that the GC runs myCOI Central. Direct competitive evidence at the GC end of the ICP. |
| R5 | `hbw-construction-subcontractor-insurance-requirements.pdf` | https://hbwconstruction.com/wp-content/uploads/2024/07/1_Subcontractor-Insurance-Requirements-1.pdf | A short, small-GC version: $1M CSL / $2M agg, occurrence not claims-made, per-project basis, primary and non-contributory, AI + waiver, A.M. Best **A**. Representative of the *bottom* of the ICP band, where Certly actually sells. |

**PM/HOA/tenant side.** Those templates are sourced from live web pages rather than PDFs (a
property manager publishes requirements as a web page, not a downloadable exhibit); their URLs and
fetch dates are in `KNOWLEDGE_BASE.md` §B.1 and §B.3.

---

## Sources attempted and not obtained (two attempts each, then logged)

| source | outcome |
|---|---|
| `larimer.gov` COI example PDF | HTTP 403 to curl on both attempts (bot wall). Dropped; Colorado is covered by other rows. |
| `ogs.ny.gov` sample COI + `CA 20 48 10 13` | HTTP 403 to curl and to WebFetch. The `CA 20 48` **content** is covered by C10 and by the insurancexdate/Jones glossary entries. |
| `hartfordct.gov` COI requirements | HTTP 403. Covered by C12/C13. |
| `docutrax.com/drc/coi/25-fig.pdf` (annotated 2016/03 figure) | Returned an HTML error page, not a PDF. Field inventory taken from C1/C4/C13 instead. |
| `davis-stirling.com` contractor-insurance page (California HOA law) | Cloudflare 403 to both WebFetch and curl. **This is a real gap** for the California HOA template: `KNOWLEDGE_BASE.md` §B.1 marks the CA-specific HOA row `UNVERIFIED` rather than guessing. |
| ACORD's own blank ACORD 25 | Not obtained. ACORD distributes forms to licensees; the public copies that exist are re-hosts of uncertain provenance. C1 (a state DOT's own 2016/03 example) is used as the layout reference instead, which is a *better* fixture anyway because it is filled. |
