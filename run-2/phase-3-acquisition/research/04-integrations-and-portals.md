# Integrations and Portals — Ratepin

**Owner:** phase-3 acquisition · **Written:** 2026-08-13 · **Scope A** (`CORRECTIONS.md` §3.1)
Every URL below was fetched in-session on 2026-08-13. Where the answer required a customer
account we do not have, §1 says so instead of guessing.

Two questions. **Downstream:** what the GC's mandated portal actually accepts, and what "we
feed whatever portal your GC mandates" can honestly mean in v1 — R2 in `IDEA_DOSSIER.md` makes
that sentence our churn defence. **Upstream:** which payroll systems emit a CSV a sub can hand
us, and which have a marketplace we can list in without a call. Weinberg & Mares file both
under *existing platforms*, the channel `research/01` §4 parked as "blocked by a human gate on
the platform's side." This document measures that gate.

---

## 1. What could not be established without a customer account

Stated first, because it is the load-bearing limit on everything after it.

1. **The LCPtracker upload template's columns, order, types and version.** LCPtracker's own
   Contractor Quick Start Guide (v2, 3 Aug 2022, hosted publicly by SANDAG under LCPtracker
   copyright) places it inside the application: *"There is an Excel spreadsheet template
   available for you to download in the same 'Upload Records' section… There is a legend as
   well as instructions available on the Excel template."* That section is behind a login, and
   — decisively — **the sub cannot create that login**: *"Every Contractor account is created
   by the Agency or their Prime Contractor."*
2. **The same, for eBacon, eMars, Points North and eComply.** None publishes an import spec on
   a public URL. eMars describes onboarding as a human mapping exercise: it *"can import from
   an Excel spreadsheet and will prepare the mapping to import the payrolls for both the Prime
   and the subs."*
3. **Whether a Ratepin-generated eCPR XML is accepted by CA DIR in production.** The schema
   validates syntax; acceptance is a different assertion and **G2** owns it. Until G2 clears,
   the artifact carries *generated, not acceptance-tested* (D3).
4. **Upload size and record limits for the DIR eCPR portal.** The March 2026 guideline states
   a naming rule — *"your file must end with the extension 'xml'"* — and nothing about limits.

---

## 2. The portal reality

### 2.1 Only the government regimes publish a machine-readable spec

| Receiver | Published spec? | Format | Where |
|---|---|---|---|
| **CA DIR eCPR** | **Yes** | XML against `CPR.xsd` | Sample + guideline linked from DIR; schema served at its namespace URL |
| **NY DOL** | **Yes** | XML against `NYDOL_CertPayroll.xsd` | `dol.ny.gov/nydolcertpayrollxsd` + a public Bulk Upload Formatting Guide |
| **WA L&I, MD DLLR, IL DOL** | Not fetched here | XML (WA, MD), CSV export (IL) | Named as LCPtracker outputs, not as specs we read |
| **LCPtracker Pro / LCPcertified** | **No** | Excel/CSV template, or a partner export file | Inside the logged-in app |
| **eBacon, eMars, Points North, eComply, Elation** | **No** | Vendor-mapped Excel/CSV | Obtained by relationship, not by download |

The asymmetry is the finding. **Statutes produce schemas; private portals produce onboarding.**
An agency mandating a filing format has to publish it. A GC-side portal has no such
obligation and a commercial interest running the other way: the mapping *is* the onboarding,
and LCPtracker sells it as a service — its Direct Payroll Interface *"allows you to choose to
have LCPtracker map your existing payroll so that you may use it (as a PDF or .CSV file) as
an upload file."* Counter-positioning in Helmer's sense, cutting both ways: they cannot go
zero-touch without cannibalising that work, and we cannot reach their format without becoming
the thing we refuse to be.

### 2.2 What we actually verified about CA eCPR

The corpus we can build against, today, unattended:

- **Guideline:** *eCPR XML Guidelines, Department of Industrial Relations, Version 2.0,
  March 2026*. **Sample:** `CPRSample.xml`, 9,738 bytes, HTTP 200.
- **Schema:** the DIR page links guideline and sample but **not** the schema, and the sibling
  path `…/Public-Works/CPR/CPR.xsd` returns **404**. The file the guideline tells you to open
  is served at its own namespace URI, `http://www.dir.ca.gov/dlse/CPR-Prod-Test/CPR.xsd` —
  **HTTP 200, 49,325 bytes**, header comment *"XML SCHEMA for electronic California Payroll
  Records Version 1.3"*.

Two structural facts from reading it: **83 element declarations and zero `xs:enumeration`
values**, and `workClass` is documented only as *"this worker's classification"* — an
unconstrained string. **The eCPR carries no wage-determination number, revision or
publication date anywhere in its 83 elements.**

This is the most consequential line in the document. Our differentiator — the rate-of-record
printed on the artifact (`research/02` §2, "what genuinely survives") — **has no field to live
in inside the XML**. It can only live on the WH-347 PDF, in the app, and in our own
provenance record. Copy that implies our pin travels inside the eCPR would be false. The
honest sentence is that the XML is the filing and the pin is the receipt.

Field-level rules cheap to get wrong: `<CPR:name>` needs an `id` of `SSN::Name` with the name
**all upper-case**; `payrollNum` and `amendmentNum` must be **empty** because the eCPR system
assigns them; `day` ids start at 1 and increment; fringes are **hourly** while deductions are
**lump sums**; `forWeekEnding` is `yyyy-mm-dd`; the only mandatory project field is Project ID.

### 2.3 What "we feed whatever portal your GC mandates" can honestly mean in v1

It cannot mean what R2's sentence implies. Rewritten to what is true and buildable:

> **v1 emits the CA DIR eCPR XML against the published schema, and a generic
> one-row-per-worker-per-day CSV built from the WH-347 field set. If your GC's portal takes a
> spreadsheet upload, that CSV is what you map into it. We do not hold your portal
> credentials and we do not submit for you (D9).**

Three reasons this is the correct claim rather than a weaker one:

1. **It is verifiable before purchase.** Per `BRAND.md` §5.6 the buyer must be able to check
   the claim without paying. A downloadable CSV and an XSD-validating XML are checkable in a
   text editor. "Portal-compatible" is not.
2. **Portal-export *coverage* is a measured number, not a promise** — R2 already says so, and
   F-3 forbids completeness language. The publishable form is a dated list of formats we emit,
   each one linkable to the spec it was built against. Formats whose spec we have never read
   do not go on the list, at any confidence.
3. **The mapping is where a human would re-enter the company.** Every vendor-specific template
   is a bilateral relationship with a support address at the end of it. N portal formats means
   N relationships — Bullseye's "existing platforms" channel returning in the disguise
   `research/01` §3 refuses by name.

One honest note in our favour, and it is downstream-shaped: a sub mandated onto LCPtracker
still owes CA DIR a separate submission, and LCPtracker's own guide walks them through
downloading its DIR XML and uploading it to the state by hand. The portal does not remove
that step.

---

## 3. The upstream surface

### 3.1 Which systems emit a payroll CSV a sub can hand us

| System | Self-serve CSV export? | Evidence | Reach |
|---|---|---|---|
| **QuickBooks Online Payroll** | **Yes** | Reports → Payroll Detail → Download → Excel/CSV/PDF | High |
| **Gusto** | **Yes** | Reports → Payroll Journal → Generate → Download CSV or PDF; General Ledger Mapper also emits CSV | High |
| **ADP (RUN / Workforce Now)** | **Yes**, via report download | Points North's ADP Marketplace listings exist precisely because ADP payroll data is extractable | High |
| **Foundation Software** | Partly moot | Reviewed as handling prevailing-wage payroll natively *"without exporting to a separate system"* — a substitute, not a feeder | Low |
| **Sage 100 Contractor** | **No, for certified payroll** | Sage's own Community Hub: *"Sage does not offer a csv or xml version of any of the certified payroll reports."* A custom report can be written and uploaded to LCPtracker | Low without a report writer |

The shape: **the general-purpose payroll systems export cleanly and the construction ERPs do
not** — the ERPs either solve certified payroll themselves (Foundation) or hand it to a portal
(Sage → LCPtracker). D1's buyer, an open-shop specialty sub with 5–75 field employees, is
likelier to be on QuickBooks or Gusto than on a construction ERP, which is why the CSV
importer should be shaped around those two exports first.

Note who is already on the other side: LCPtracker's provider list names Paychex as premier and
ADP, Auris, BBSI, BiznusSoft, California Payroll, Foundation Software, hh2, Hourly, JobPower,
Jonas, Miter, Paycom, Paylocity, Paynet, Quantum, Sunburst and Viewpoint as alliance providers
— *"known to have an export file compatible with LCPtracker products."* Sunburst has been
emitting an LCPtracker Excel upload since October 2005. The path to a portal format exists; it
runs through a partner relationship, which is the gate.

### 3.2 Marketplaces, ranked by reachability at zero human minutes

| Rank | Marketplace | Human gate | Verdict |
|---|---|---|---|
| **1** | **Zapier Developer Platform** | Free, *"self-serve from creation to deployment"*; async review; 90-day public beta requiring 10 Zap templates and 50 active users | **Reachable now**, async end to end — but the 50-user threshold makes it an amplifier after traction, not a source of first customers |
| **2** | **Intuit QuickBooks App Store** | Three-part async review — technical, security, marketing; targets 3 / 7 / 5 business days | **Reachable, slowly.** No call documented; `research/01` §4's revival condition is met on paper. The cost is calendar |
| **3** | **Procore Marketplace** | Developer signup, a Certification Assessment, and *"a standard agreement is signed"* | Borderline — a signature is not a demo, but the journey is relationship-shaped |
| **4** | **Gusto App Directory** | Production Pre-Approval + Security Review by the Partnerships team; asks for SOC 2 Type 2, ISO 27001 or PCI | **Blocked in v1** — not by the review but by audit artefacts a new company does not have |
| **5** | **ADP Marketplace** | Reviewed by Sales, Security and Legal; *"your Developer's Participation Agreement (DPA) can be executed with your ADP Marketplace Business Development resource"* | **Dead by A1.** A named BD counterparty is the salesperson we do not have |

**Recommendation.** Build the CSV importer against the QuickBooks Online and Gusto payroll
exports — files the customer already has, which we need nobody's permission to accept. Treat
the Intuit listing as the only marketplace worth attempting in v1: the largest surface where
D1 plausibly is, with an asynchronous gate. Hold Zapier until there are users to satisfy its
beta threshold. Do not open ADP or Gusto — per Dunford, entering a frame whose entry ritual is
a partnership call mis-positions us in exactly the direction the product argues against.

---

## 4. Hypotheses, flagged

- **H-I1.** That a generic WH-347-shaped CSV is mappable into most GC portals' spreadsheet
  importers. Unverified — §1.1. Falsifiable only with a customer account.
- **H-I2.** That QuickBooks Online and Gusto exports dominate D1's installed base. Inferred
  from firm size, not measured. First 25 accounts settle it.
- **H-I3.** That an Intuit listing converts at all for a compliance tool. Untested; the kill
  criterion should be authored before submission, per Ries.

---

## References

**Primary, all fetched 2026-08-13**

- `https://www.dir.ca.gov/public-works/certified-payroll-reporting.html` — links `CPRSample.xml` and `eCPRXMLGuideline.pdf`; no schema link
- `https://dir.ca.gov/Public-Works/Guides/eCPR-XML-guidelines.pdf` — *eCPR XML Guidelines*, Version 2.0, March 2026; `SSN::Name` id rule; empty `payrollNum`/`amendmentNum`; hourly fringes / lump-sum deductions; `.xml` naming rule
- `https://www.dir.ca.gov/Public-Works/CPR/CPRSample.xml` — HTTP 200, 9,738 bytes
- `http://www.dir.ca.gov/dlse/CPR-Prod-Test/CPR.xsd` — HTTP 200, 49,325 bytes; *"Version 1.3"*; 83 element declarations; 0 enumerations; `workClass` unconstrained; no WD field
- `https://www.dir.ca.gov/Public-Works/CPR/CPR.xsd` — HTTP 404 (the sibling path the guideline implies)
- `https://dol.ny.gov/certified-payroll-bulk-upload-formatting-guide` and `https://dol.ny.gov/nydolcertpayrollxsd` — public XSD, *"Version 2.0"*, `maxOccurs="500"` per upload
- `https://www.sandag.org/-/media/SANDAG/Documents/PDF/about/work-with-us/labor-compliance-monitoring-program/contractor-quick-start-guide-v2-2022-08-03.pdf` — LCPtracker Contractor Quick Start Guide v2; five entry methods; template inside "Upload Records"; DPI mapping; *"Every Contractor account is created by the Agency or their Prime Contractor"*; CA DIR / WA L&I / IL DOL export steps
- `https://lcptracker.com/preferred-providers/` — Paychex premier; 17 named alliance providers; *"known to have an export file compatible with LCPtracker products"*
- `https://sunburstsoftwaresolutions.com/california-dir-ecpr-prism-lcptracker-upload-feature-for-quickbooks.htm` — LCPtracker Excel since Oct 2005, PRISM since Sept 2015, CA DIR XML since June 2015
- `https://emarsinc.com/solutions/emars-assisting-with-certified-payroll` — *"will prepare the mapping to import the payrolls"*
- `https://www.points-north.com/quickbooks` and `https://apps.adp.com/en-US/apps/253943/points-north-certified-payroll-reporting-for-run-powered-by-adp` — QBO API import; ADP Marketplace listings
- `https://support.gusto.com/article/101334493100000/view-download-and-customize-reports-in-gusto-for-admins` — Payroll Journal → Download CSV
- `https://quickbooks.intuit.com/learn-support/en-us/help-article/export-reports/export-reports-excel-workbooks-quickbooks-desktop/L4cLJEeXt_US_en_US` — payroll report export to Excel/CSV
- `https://communityhub.sage.com/us/sage_construction_and_real_estate/f/sage-100-contractor-general-discussion/206738/` — *"Sage does not offer a csv or xml version of any of the certified payroll reports"*
- `https://developer.intuit.com/app/developer/qbo/docs/go-live/list-on-the-app-store/what-to-expect-during-the-review` — three-part review; 3 / 7 / 5 business-day targets
- `https://docs.zapier.com/platform/publish/public-integration` — *"self-serve from creation to deployment"*; 90-day beta; 10 Zap templates; 50 active users
- `https://docs.gusto.com/app-integrations/docs/introduction` — Production Pre-Approval + Security Review; SOC 2 Type 2 / ISO 27001 / PCI
- `https://developers.adp.com/guides/adp-marketplace-integration-guides` — DPA executed with an ADP Marketplace Business Development resource
- `https://developers.procore.com/documentation/listing-your-app` — Certification Assessment; standard agreement signed

**Internal**

- `run-2/PLAN.md` — A1, A3, A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — R2, D1, D3, D9, G2, G3
- `run-2/phase-1-ideation/research/02-competition-positioning.md` §1.1, §2 — the portal tier as a rejection surface
- `run-2/phase-3-acquisition/research/01-channels.md` §3, §4 — existing platforms parked; the three disguises
- `run-2/phase-2-build/CORRECTIONS.md` §4 — F-3 coverage, F-4 outcome
- `run-2/phase-2-build/identity/BRAND.md` §5.6 — what the buyer verifies free

**Literature**

- Weinberg & Mares, *Traction* — Bullseye; the existing-platforms channel and its gatekeeper cost
- Dunford, *Obviously Awesome* — do not enter a frame whose comparison you lose
- Moore, *Crossing the Chasm* — CA eCPR as the beachhead whole product
- Hormozi, *$100M Offers* — perceived likelihood of achievement; the emitted file as the proof
- Helmer, *7 Powers* — counter-positioning: the incumbent cannot drop the mapping service
- Ries, *The Lean Startup* — kill criteria authored before the test
- Poyar, *Growth Unhinged* / OpenView PLG — self-serve distribution economics
