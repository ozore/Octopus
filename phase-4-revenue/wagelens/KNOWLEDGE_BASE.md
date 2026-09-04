# {{PRODUCT}} — Knowledge Base

**The wage-determination data: where it comes from, what shape it has, how it stays true.**

Author: Product Owner agent ({{PRODUCT}}), wave 1. Date: **2026-09-03**.
Revised: **2026-09-03** (wave-1b iteration — findings B4, B5, M12, m2; changelog in
`REVIEW_RESPONSE.md`). **Every user-visible string is the token `{{PRODUCT}}` and every URL the
token `{{PRODUCT_URL}}`** — the name is a pending founder decision (PREREQUISITES P11) and the
host is env-resolved (PLAN D3). The slug stays `wagelens`.
Every source in §2 was **opened from this environment on 2026-09-03**, not remembered.
Every command shown was actually run; every number is the number it returned.
Samples are committed under [`kb-samples/`](kb-samples/).

Binding on this document: [`../PLAN.md`](../PLAN.md) (A10 regulatory quality, A11 launch
coverage, A12 cron, A13 Neon+PGlite), [`../PIPELINE.md`](../PIPELINE.md) (sources opened,
two agents verify), and the patterns — not the content — of
[`../../phase-2-build/architecture/CORPUS_DESIGN.md`](../../phase-2-build/architecture/CORPUS_DESIGN.md).

---

## 0. The three findings that change the plan

Read these before anything else. Each one invalidates something a reasonable person
would have assumed.

### F1 — There is no SAM.gov Wage Determination API. There is a SAM.gov *website* API, and it is better.

`https://open.gsa.gov/api/wage-determination-api/` — the URL in the brief — **returns HTTP 404**.
The open.gsa.gov API catalogue lists **32 APIs** (fetched 2026-09-03) and **none of them is a
wage-determination API**. `api.sam.gov`, the documented host that requires an api.data.gov key,
**404s on every wage-determination path tried**.

What does work is the API that sam.gov's own single-page app calls. It is unauthenticated,
it needs **no key**, and it returns the complete national corpus. The one non-obvious
requirement: **`Accept: application/hal+json`**. Verified precisely on 2026-09-03:
`Accept: application/json` → **406 Not Acceptable**; `Accept: text/html` → **406**;
`Accept: */*` or no `Accept` header → **200**; `Accept: application/hal+json` → **200**.
This is a trap rather than a wall: most HTTP client wrappers set `Accept: application/json` by
default and will get a 406 that looks like an outage. **Always set it explicitly.** It is the
same header trick phase 3 discovered for SAM.gov opportunity search
([`../../phase-3-acquisition/prospects/wagelens/sources.md`](../../phase-3-acquisition/prospects/wagelens/sources.md) §3).

**Consequence:** no key to obtain, no rate-limit tier to buy, no vendor dependency — but also
**no contract**. GSA can rename these paths without notice. §6.4 says what to do about that.

### F2 — The official WH-347 PDF has no form fields. Nothing can be filled.

`https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf` downloads cleanly
(HTTP 200, 304,738 bytes, Rev. January 2025, OMB 1235-0008, expires 2028-01-31). Its
`/AcroForm` dictionary exists but **`/Fields` is an empty array**, and the only annotation on
either page is a `/Link` pointing at the instructions. `pypdf.get_fields()` returns **0**.

**Consequence:** the entire "fill the official PDF" approach is dead. {{PRODUCT}} must
**generate** the WH-347 and the Statement of Compliance as its own PDFs, reproducing the
official layout, the official column numbering (1A–9) and — this part is a legal requirement,
not an aesthetic one — the Statement of Compliance **wording verbatim**. DOL's own footer
permits this: a certified payroll must be accompanied by a signed Statement of Compliance
"(e.g., page 2 of the WH-347 **or another document with identical wording**)". See §5 and
[`kb-samples/wh347-page2-statement-of-compliance.txt`](kb-samples/wh347-page2-statement-of-compliance.txt).

### F3 — "State + county + construction type" does not identify one determination. One time in eight it identifies several.

Computed over the entire active index on 2026-09-03: **12,185** distinct
(state, county, construction type) combinations exist, and **1,483 of them — 12.17% —
map to more than one active determination.** Harris County, Texas, "Heavy" maps to three
(TX20260031, TX20260033, TX20260034).

**Consequence:** the product's own one-liner is wrong for one project in eight. The lookup
must return **candidates**, show what distinguishes them, and ask the user which WD number
their contract names — because the contract, not the geography, is the authority
(29 CFR 5.5(a)(1)(i): the wage determination is the one *incorporated into the contract*).
This is the single most important UX decision in the MVP, and it is spec
[`specs/WL-02-project-and-wd-lookup.md`](specs/WL-02-project-and-wd-lookup.md).

---

## 1. Scope

**In, at launch (A11):** federal **Davis-Bacon Act** general wage determinations for all
50 states plus DC and the territories; the four construction types (Building, Residential,
Highway, Heavy); every classification, base rate and fringe on each; the modification
history of each; the WH-347 and its Statement of Compliance.

**Out, at launch, documented as extension:** state prevailing-wage schedules (§8), the
Service Contract Act (SCA/SF-98) and CBA determinations — the same index carries them
(`index=wd` returns `wdCBA` and SCA records) but nothing in the MVP reads them, project
wage determinations (non-standard, agency-issued, not published on SAM.gov at all),
and DBA determinations for Puerto Rico/Guam special schedules beyond what the index returns.

**Never in the corpus:** worker names, full Social Security numbers, home addresses, pay
detail. Those are customer data in the customer's own account, governed by §7 gate G7, and
they never enter the knowledge base.

---

## 2. Sources — verified live, 2026-09-03

| # | Source | Route | Key? | Status |
|---|---|---|---|---|
| KB-1 | SAM.gov DBA determination **index** | `sam.gov/api/prod/sgs/v1/search/?index=dbra` | **no** | **works** — 4,235 active records in 3 requests |
| KB-2 | SAM.gov determination **full text** | `sam.gov/api/prod/wdol/v1/wd/{ref}/{rev}` | **no** | **works** — every classification, rate, fringe |
| KB-3 | SAM.gov **modification history** | `sam.gov/api/prod/wdol/v1/wd/{ref}/history` | **no** | **works** |
| KB-4 | SAM.gov **county dictionary** | `sam.gov/api/prod/wdol/v1/dictionaries/wdCounties?state=XX` | **no** | **works** — 254 TX counties |
| KB-5 | SAM.gov **bulk extract** | `fileextractservices/v1/api/listfiles?domain=Wage Determination` | n/a | **empty — no bulk download exists** |
| KB-6 | DOL **WH-347** PDF | `dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf` | n/a | **works**, but **flat — 0 form fields** |
| KB-7 | DOL **Statement of Compliance** wording | WH-347 page 2, text layer | n/a | **works** — extracted verbatim |
| KB-8 | DOL **conformance FAQ** | `dol.gov/agencies/whd/government-contracts/construction/faq/conformance` | n/a | **works** — 3 criteria, DBAConformance@dol.gov |
| KB-9 | **29 CFR 5.5** (the obligations) | `ecfr.gov/api/renderer/v1/content/enhanced/{date}/title-29?part=5&section=5.5` | no | **works** (verified by the Buyer & Identity agent, §2.9) |
| KB-10 | **SF-1444** PDF | `gsa.gov/system/files/2025-05/SF1444-23a.pdf` | n/a | **blocked — HTTP 403 to this environment, two attempts** |
| KB-11 | `open.gsa.gov` wage determination API | `open.gsa.gov/api/wage-determination-api/` | — | **does not exist — 404** |
| KB-12 | Legacy WDOL archive | `wdol.gov` | — | **dead** (proxy 502) |

### KB-1 — the index

```bash
curl -sS -H 'Accept: application/hal+json' \
  'https://sam.gov/api/prod/sgs/v1/search/?index=dbra&page=0&size=2000&mode=search&is_active=true'
```

| parameter | effect | verified |
|---|---|---|
| `Accept: application/hal+json` | **required in practice** | yes — `application/json` and `text/html` both return **406**; `*/*` and no header return 200 |
| `index=dbra` | Davis-Bacon Act determinations only | yes — `index=wd` returns DBA + SCA + CBA mixed; `index=wagedetermination` is a 400 |
| `is_active=true` | current determinations only | yes — 4,235 active; without it the index includes every superseded revision back to at least 2003 |
| `state=TX` | two-letter state code | yes — 290 |
| `county=14885` | **SAM's own numeric county code, not the name** | yes — 6. `county=Harris` returns **zero**, silently |
| `size` | page size | yes — **2000 accepted**; `maxAllowedRecords` is 10,000 |
| `sort=-modifiedDate` | newest modification first | yes — this is the change-detection mechanism (§6.3) |
| `constructionType=Building` | **ignored** — returns everything | yes — filter client-side on the `constructionTypes` array |
| `modifiedDate.from=…`, `publishDate.from=…` | **ignored** — no date filtering exists | yes — all three forms tried, all returned 4,235 |

**The whole national index, fetched in 3 requests and 3 seconds:**

| measure | value |
|---|---|
| active DBA determinations | **4,235** |
| states and territories | **54** |
| distinct (state, county) pairs | **3,088** |
| Building / Residential / Heavy / Highway | 1,615 / 984 / 926 / 833 |
| revision (modification) number 1 / 2 / 3 / 4 / 5 / 6 | 3,377 / 748 / 67 / 21 / 13 / 9 |
| (state, county, type) combinations | 12,185 |
| …of which **ambiguous** (>1 determination) | **1,483 (12.17%)** ← F3 |

Sample: [`kb-samples/sam-active-dbra-index-summary.json`](kb-samples/sam-active-dbra-index-summary.json),
[`kb-samples/sam-search-dbra-TX-Harris.json`](kb-samples/sam-search-dbra-TX-Harris.json).

One index record carries: `fullReferenceNumber` (the WD number), `revisionNumber` (the
**modification number** — SAM calls it a revision, the form calls it a modification, they are
the same integer), `publishDate`, `modifiedDate`, `constructionTypes[]`, `isActive`,
`isStandard`, and `location.state.{code,name,counties[{code,value}]}`.

### KB-2 — the determination text (this is the corpus)

```bash
curl -sS -H 'Accept: application/hal+json' \
  'https://sam.gov/api/prod/wdol/v1/wd/TX20260253/1'
```

Returns a JSON object whose `document` field is the **complete determination as plain text** —
about **17 KB and 32 classification lines on average**, containing the header, the modification
table, every rate group with its effective date, every classification with its base rate and
fringe, the welders rule, the Executive Order notes, the conformance sentence, the rate-identifier
legend and the appeals process. Nothing is behind a PDF.

```
General Decision Number: TX20260253 05/18/2026
State: Texas
Construction Types: Building
Counties: Texas Counties of
Harris

Modification Number     Publication Date
          0                01/02/2026
          1                05/18/2026

 ELEC0716-005 09/01/2025
                                                     Rates                  Fringes
ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING AND
INSTALLATION OF ALARMS).............................$ 38.50                  10.71
```

Sample: [`kb-samples/sam-wd-detail-TX20260253-rev1.json`](kb-samples/sam-wd-detail-TX20260253-rev1.json)
(57 classifications, 15 rate groups) and
[`kb-samples/sam-wd-detail-TX20260031-rev1.json`](kb-samples/sam-wd-detail-TX20260031-rev1.json)
(Heavy, 19 classifications, 2 counties).

**Full national pull, measured:** 25 details fetched serially in 8.3 s = **0.33 s each** →
**~24 minutes serial**, ~4 minutes at 6-way concurrency, **~73 MB** of determination text,
**~135,000 classification rows**. This fits comfortably inside a nightly job and inside a
Neon free-tier database.

### KB-3 — modification history

```bash
curl -sS -H 'Accept: application/hal+json' 'https://sam.gov/api/prod/wdol/v1/wd/TX20260253/history'
```

Returns every revision of that WD number with `revisionNumber`, `publishDate` and `active`.
TX20260253 → rev 1 (2026-05-18, active) and rev 0 (2026-05-17, inactive). **Superseded
revisions remain fetchable at `/wd/{ref}/{rev}` forever**, which is what makes a rate we
showed a customer in March still explainable in December (the CORPUS_DESIGN §2.3 property).
Sample: [`kb-samples/sam-wd-history-TX20260253.json`](kb-samples/sam-wd-history-TX20260253.json).
Re-verified by the wave-1b reviewer on 2026-09-03: `/history` returns rev 1 `active:true` and rev 0
`active:false`, and **`/wdol/v1/wd/TX20260253/0` returns HTTP 200 with a 16,319-byte `document`.**

> **⚠ "Retrievable forever" is a property of SAM.gov, not of our database — and until the wave-1b
> iteration it was not a property of ours at all (finding B4).** §4.1 read the index at
> `is_active=true` and fetched only new **active** pairs; `/history` was called nowhere except as a
> secondary change-detection idea in §6.3. Meanwhile **every user-facing promise reads from our
> database** — `WL-02`'s `searchDeterminations` says "**never the network**", `WL-03` V1 scopes to
> the pinned modification, and `LANDING_SPEC.md` §5.2 says the public page never depends on a third
> party at request time. So modification pinning (`OFFER.md` O2b/O7), the landing page's
> Determination Timeline (V2) and the "still provable in year three" clause the Provenance
> Guarantee refunds on **could not render at launch.**
>
> **[`specs/WL-13`](specs/WL-13-kb-ingestion-and-refresh.md) now ingests both**, on demand and
> under the same gates as an active determination: a `kb.fetch_history` job whenever anything
> touches a WD number (a pin, a public `/wd/:wdNumber` view, a watch, a WL-08 diff), an on-demand
> `kb.fetch_determination` for a **named** superseded revision, and a **launch backfill** over the
> landing page's demo determinations plus every determination above modification 1 in the index
> (858 of them). **History is fetched eagerly** — one small request, so a timeline can always be
> drawn. **Text is fetched lazily** — 17 KB per revision, only when someone asks for that revision.
> Crawling every historical revision of 4,235 determinations is neither needed nor polite.

### KB-4 — the county dictionary

```bash
curl -sS -H 'Accept: application/hal+json' 'https://sam.gov/api/prod/wdol/v1/dictionaries/wdCounties?state=TX'
```

254 Texas counties as `{elementId, value}` — SAM's numeric code and the county name. This is
the lookup that turns "Harris" into `14885`, without which `county=` silently returns nothing.
Sample: [`kb-samples/sam-dictionary-wdCounties-TX.json`](kb-samples/sam-dictionary-wdCounties-TX.json).

**Caveat found in the data:** SAM's county codes are not FIPS and are not unique — in Alaska,
`17987` appears twice, for "Aleutians East" and "Aleutians West". Key our `counties` table on
`(state_code, sam_county_code, county_name)`, not on the code alone.

### KB-5 — there is no bulk download

```bash
curl -sS -H 'Accept: application/hal+json' \
  'https://sam.gov/api/prod/fileextractservices/v1/api/listfiles?random=1&domain=Wage%20Determination'
# → {"_embedded":{"customS3ObjectSummaryList":[]}, …}
```

Empty. The same endpoint with `domain=Contract Opportunities` returns a real file list, so the
service works and the wage-determination domain simply has no extracts. `wdol.gov`, the legacy
archive, no longer resolves. **KB-1 at `size=2000` is the substitute for a bulk download**, and
it is a good one: 3 requests for the entire national index.

### KB-6 — the WH-347

```bash
curl -sSL -o wh347.pdf 'https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf'
python3 -c "from pypdf import PdfReader; print(len(PdfReader('wh347.pdf').get_fields() or {}))"   # → 0
```

| property | value |
|---|---|
| revision | **Rev. January 2025** |
| OMB control number | **1235-0008**, expires **2028-01-31** |
| bytes / sha256 | 304,738 / `fa28f033a8250dc3c209fe9c8e7f5cfcde70f8f0cb11a6ab2486eaebdd5db557` |
| pages | 2 (page 1 payroll grid, page 2 Statement of Compliance) |
| `/AcroForm` present | yes |
| **form fields** | **0** |
| widget annotations | 0 (one `/Link` to the instructions) |
| printed worker rows per page | 8 |
| DOL public burden estimate | **55 minutes per form** ← the number the offer should be built on |
| **distinct named fields (printed)** | **50** |

The 50 fields are enumerated in
[`kb-samples/wh347-field-list.json`](kb-samples/wh347-field-list.json): 11 page-1 header
fields, 19 page-1 worker-row columns (1A, 1B, 1C, 1D, 1E, 2, 3, 4, 5, 6A, 6B, 6C, 7A, 7B,
8a–8d, 9), 7 page-2 header fields, 3 apprenticeship columns, 5 fringe-plan fields, 5 closing
fields. Column 4 is a 7×2 grid, so **one worker-week populates 34 cells on page 1** and up to
11 more on page 2 when a fringe credit is claimed.

The DOL's own 55-minute estimate is per form. A sub with 12 workers files ~45 forms a year.
**That is 41 hours a year of a person's time**, and it is the number the pricing argument rests on.

**The `wh347` HTML page (`dol.gov/agencies/whd/forms/wh347`) returns HTTP 403 to this
environment; the PDF itself returns 200.** Do not build a link-checker that fetches the page.

### KB-7 — the Statement of Compliance

Extracted verbatim from page 2 into
[`kb-samples/wh347-page2-statement-of-compliance.txt`](kb-samples/wh347-page2-statement-of-compliance.txt).
The three certifications, quoted from the form:

1. "The payroll information submitted with this statement is correct and complete for the above
   project during the above period, and the wage and fringe benefit rates paid to the workers,
   including credit taken for the reasonably anticipated costs of a bona fide fringe benefit
   plan, fund or program, are not less than the applicable wage and fringe benefits rates for
   the classification(s) of work actually performed, as specified in the wage determination(s)
   incorporated into the contract."
2. "All regular payrolls and all other basic records that the contractor is required to maintain
   for this payroll period are complete and accurate and will be made available upon request
   from the agency or the Department of Labor."
3. "The classifications reported for each laborer or mechanic are the classification(s) of work
   that each worker actually performed."

Plus the apprenticeship attestation, the fringe-benefit attestation, the no-rebates
attestation ("no rebates or deductions have been or will be made either directly or
indirectly, other than permissible deductions as defined in 29 CFR part 3"), and the
falsification warning citing **18 U.S.C. § 1001** and **31 U.S.C. § 3729**.

**This wording is a fixed string in the codebase, gated by a test (§7 G5).** It is not
template copy and no one gets to improve it.

### KB-8 — conformance (SF-1444) and the "no matching classification" path

`https://www.dol.gov/agencies/whd/government-contracts/construction/faq/conformance`, fetched
2026-09-03. A conformance is granted only when all three are true:

1. the work is **not** performed by a classification already listed on the applicable
   wage determination;
2. the requested classification is **one actually used in the area by the construction industry**;
3. the proposed wage rate bears a **reasonable relationship** to the rates already on the
   determination.

Submitted **by the contracting agency**, developed with the contractor and the affected
workers, to **DBAConformance@dol.gov**. Per 29 CFR 5.5(a)(1)(iii) (verified at eCFR by the
Buyer & Identity agent), WHD has **30 days** to approve or advise that more time is needed,
and **"the conformance process may not be used to split, subdivide, or otherwise avoid
application of classifications listed in the wage determination."**

That last sentence is the whole product lesson: **most "no matching classification" moments
are not conformances — they are the user looking for a cheaper label.** The MVP's job is to
make the listed classification easy to find first, and only then explain conformance.

### KB-10 — SF-1444 · `UNVERIFIED`

`gsa.gov/system/files/2025-05/SF1444-23a.pdf` and `.../2023-10/SF1444-23.pdf` both return
**HTTP 403** to this environment, with a plain UA and with a browser UA. Two attempts, logged,
moved on. What is asserted about SF-1444 below is from the GSA forms catalogue entry and the
DOL Prevailing Wage Resource Book, not from the PDF:

> **`UNVERIFIED`** — SF-1444 "Request for Authorization of Additional Classification and Rate",
> Standard Form 1444, revised 10/2023. Collects: contract number and agency, the wage
> determination number, the proposed classification title, a description of the duties, the
> proposed basic hourly rate and fringe rate, the classifications on the determination the
> proposal relates to, and signatures of the contractor, the employee representative (or a
> statement that the workers were notified) and the contracting officer.
> **Before shipping the conformance guide, someone with a browser must open the real form and
> confirm this list.** The MVP does not generate SF-1444; it produces a duties-and-rate
> worksheet the contractor hands to the contracting officer (§ spec WL-04).

---

## 3. Data schema

Two schemas, one database. **`kb_*` is the corpus — machine-owned, rebuilt from source,
no customer data ever. Everything else is customer data.** Drizzle-ready; types are Postgres.

### 3.1 The corpus (`kb_*`)

```
kb_counties
  state_code            char(2)      NOT NULL
  sam_county_code       integer      NOT NULL
  county_name           text         NOT NULL
  fips_county_code      char(5)                  -- best-effort join, nullable, see §3.3
  source_url            text         NOT NULL
  last_verified         timestamptz  NOT NULL
  PRIMARY KEY (state_code, sam_county_code, county_name)     -- NOT (state, code): Alaska reuses 17987

kb_wage_determinations                            -- IMMUTABLE per (wd_number, modification_number)
  id                    uuid         PK
  wd_number             text         NOT NULL     -- 'TX20260253'
  modification_number   integer      NOT NULL     -- SAM's revisionNumber
  state_code            char(2)      NOT NULL
  construction_types    text[]       NOT NULL     -- {'Building'} | {'Heavy'} | ...
  publication_date      date         NOT NULL
  is_active             boolean      NOT NULL
  is_standard           boolean      NOT NULL
  document_text         text         NOT NULL     -- the verbatim `document` string. The evidence.
  document_sha256       char(64)     NOT NULL
  parser_version        text         NOT NULL     -- which parser produced the rows below
  source_url            text         NOT NULL     -- .../wdol/v1/wd/TX20260253/1
  public_url            text         NOT NULL     -- https://sam.gov/wage-determination/TX20260253/1
  fetched_at            timestamptz  NOT NULL
  last_verified         timestamptz  NOT NULL
  superseded_by         uuid         REFERENCES kb_wage_determinations(id)
  UNIQUE (wd_number, modification_number)

kb_wd_counties
  wd_id                 uuid         REFERENCES kb_wage_determinations(id) ON DELETE CASCADE
  state_code            char(2)      NOT NULL
  sam_county_code       integer      NOT NULL
  county_name           text         NOT NULL
  PRIMARY KEY (wd_id, sam_county_code, county_name)
  INDEX (state_code, sam_county_code)              -- the lookup index. This is the hot path.

kb_wd_modifications                               -- every revision of a WD number, from /history
                                                  -- (and from the modification table in the header)
  wd_number             text         NOT NULL
  modification_number   integer      NOT NULL
  publication_date      date         NOT NULL
  active                boolean      NOT NULL     -- as /history reports it            (added: B4)
  text_held             boolean      NOT NULL DEFAULT false  -- do we hold this revision's document?
  history_source_url    text                      -- .../wdol/v1/wd/{ref}/history      (added: B4)
  history_fetched_at    timestamptz               --                                   (added: B4)
  PRIMARY KEY (wd_number, modification_number)
  INDEX (wd_number)

kb_rate_groups
  id                    uuid         PK
  wd_id                 uuid         REFERENCES kb_wage_determinations(id) ON DELETE CASCADE
  identifier            text         NOT NULL     -- 'ELEC0716-005', 'SUTX2014-029', 'UAVG-OH-0010', 'SAME2023-007'
  kind                  text         NOT NULL     -- union | survey | union_average | state_adopted | supplemental
  effective_date        date         NOT NULL
  UNIQUE (wd_id, identifier, effective_date)       -- NOT (wd_id, identifier): a WD can list the same local twice

kb_classifications                                -- ~135,000 rows nationally
  id                    uuid         PK
  wd_id                 uuid         REFERENCES kb_wage_determinations(id) ON DELETE CASCADE
  rate_group_id         uuid         REFERENCES kb_rate_groups(id)
  line_no               integer      NOT NULL     -- position in document_text; part of identity (§3.3)
  classification_label  text         NOT NULL     -- verbatim, uppercase, as printed
  search_label          text         NOT NULL     -- normalised: collapsed whitespace, lowercase, no punctuation
  trade_family          text                      -- derived bucket: electrician|plumber|carpenter|laborer|operator|…
  base_rate             numeric(8,2) NOT NULL
  fringe_rate           numeric(8,2) NOT NULL      -- 0.00 when the determination prints no fringe
  qualifier             text                       -- '+$760,000', 'HVAC DUCT INSTALLATION ONLY', …
  footnote_text         text
  -- provenance, on every single row (A10):
  wd_number             text         NOT NULL
  modification_number   integer      NOT NULL
  publication_date      date         NOT NULL
  source_url            text         NOT NULL
  last_verified         timestamptz  NOT NULL
  UNIQUE (wd_id, line_no)
  INDEX (wd_id, search_label)

kb_ingest_runs
  id                    uuid         PK
  started_at            timestamptz  NOT NULL
  finished_at           timestamptz
  kind                  text         NOT NULL     -- full | delta
  index_records_seen    integer
  determinations_new    integer
  determinations_changed integer
  classifications_written integer
  parse_coverage        numeric(6,4)              -- parsed rate lines / naive rate lines; gate G3
  status                text         NOT NULL     -- running | ok | failed | aborted_on_gate
  failure_reason        text
```

### 3.2 Customer data (summary — each spec owns its own tables)

`organisations`, `users`, `sessions`, `magic_link_tokens`, `projects`,
`project_wd_pin_history`, `workers`, `worker_classifications`, `payrolls`, `payroll_lines`,
`fringe_plans`, `payroll_line_fringe_credits`, `apprenticeship_programs`, `documents`,
`document_share_links`, `conformance_worksheets`, `wd_change_alerts`, **`wd_watches`**,
**`email_suppressions`**, `subscriptions`, **`subscription_terms_acceptances`**,
`disclaimer_acknowledgements`, `payroll_exports`, `events`, `jobs`, `stripe_events`.
Full definitions in `specs/`, **and every one of them now has an owning spec** — which was not true
before the wave-1b iteration: **`wd_watches` was listed here and defined nowhere** (finding B5). It
is now [`specs/WL-14`](specs/WL-14-wd-watch.md), together with `email_suppressions`.
`subscription_terms_acceptances` is new in [`specs/WL-09`](specs/WL-09-billing.md) (finding B9).

> **The rule that stops this recurring: a table named in this section must name its spec.** A table
> with no owner is a feature with no consent design, no retention rule and no test — which is
> exactly what `wd_watches` was, for an email address collected on a public page.

**Hard rule, from 29 CFR 5.5(a)(3)(ii)(B):** `workers` stores `identifying_no_last4 char(4)`.
There is **no column anywhere in this schema that can hold a full SSN or a home address**, and
§7 gate G7 is a test that asserts it. This is a structural guarantee (CORPUS_DESIGN P5), not a
policy note.

### 3.3 Three schema decisions that came out of the data

1. **A determination is identified by `(wd_number, modification_number)`, never by geography.**
   F3 is why. A project pins one such pair; the pin is what appears on every WH-347 it produces.
2. **`kb_classifications` is keyed on `(wd_id, line_no)`, not on the label.** Minnesota's
   MN20260080 lists the same surveyor classification twice, distinguished only by a project-value
   qualifier (`+$760,000` at $20.02 and `-$760,000` at $17.02). **Classification labels are not
   unique within a determination.** A schema that assumed they were would silently drop a rate.
3. **`document_text` is stored verbatim alongside the parsed rows.** The parsed rows are what
   the product queries; the verbatim text is what we show a customer who disputes a rate, and
   what a re-parse runs against when the parser improves. Losing it would make every historical
   row unre-derivable. This mirrors CORPUS_DESIGN's rule that a wrong record must be findable
   and fixable in minutes.

---

## 4. Ingestion — design

A reference parser that proves the schema is mechanically extractable is committed at
[`kb-samples/parse-wd-document.py`](kb-samples/parse-wd-document.py). Measured on a random
40-determination national sample: **1,129 of 1,130 rate lines parsed — 99.91% coverage.**
The one miss is edge case 2 above.

### 4.1 Shape

```
                     ┌──────────────────────────────────────────────┐
  Vercel Cron        │ 0 · PRE-FLIGHT (blocking)                    │
  02:00 UTC daily ──▶│   GET index size=1 · assert 200 + hal+json   │
                     │   assert totalElements within ±20% of last   │
                     │   run · else ABORT, alert, change nothing    │
                     └───────────────────┬──────────────────────────┘
                                         ▼
                     ┌──────────────────────────────────────────────┐
                     │ 1 · INDEX   3 × GET size=2000 is_active=true  │
                     │   → 4,235 rows: (wd_number, mod, dates, …)   │
                     └───────────────────┬──────────────────────────┘
                                         ▼
                     ┌──────────────────────────────────────────────┐
                     │ 2 · DIFF against kb_wage_determinations      │
                     │   new pair        → fetch                    │
                     │   known pair      → skip, bump last_verified │
                     │   gone from index → is_active = false        │
                     └───────────────────┬──────────────────────────┘
                                         │
   ON DEMAND (a pin · a public /wd view · a watch · a WL-08 diff · the launch backfill)  ── B4
                     ┌──────────────────────────────────────────────┐
                     │ 2b · HISTORY  GET /wdol/v1/wd/{ref}/history  │
                     │   UPSERT kb_wd_modifications, one row per    │
                     │   revision (number, date, active). Eager —   │
                     │   one small request, so a timeline can       │
                     │   always be drawn.                           │
                     │ 2c · A NAMED SUPERSEDED REVISION             │
                     │   GET /wdol/v1/wd/{ref}/{rev} → step 3, with │
                     │   THE SAME GATES. is_active = false. Lazy —  │
                     │   17 KB each, fetched only when asked for.   │
                     └───────────────────┬──────────────────────────┘
                                         ▼
                     ┌──────────────────────────────────────────────┐
                     │ 3 · FETCH  /wdol/v1/wd/{ref}/{rev}           │
                     │   ≤4 req/s · retry 3× exponential · sha256   │
                     │   INSERT new immutable row (never UPDATE)    │
                     └───────────────────┬──────────────────────────┘
                                         ▼
                     ┌──────────────────────────────────────────────┐
                     │ 4 · PARSE → rate groups + classifications    │
                     │   inside one transaction per determination   │
                     └───────────────────┬──────────────────────────┘
                                         ▼
                     ┌──────────────────────────────────────────────┐
                     │ 5 · GATES (§7)  G1–G6 · any failure rolls    │
                     │   back that determination and fails the run  │
                     └───────────────────┬──────────────────────────┘
                                         ▼
                     ┌──────────────────────────────────────────────┐
                     │ 6 · SUPERSEDE + NOTIFY                       │
                     │   old.superseded_by = new.id                 │
                     │   enqueue wd.modified for every project      │
                     │   pinned to the old pair  → spec WL-08       │
                     └──────────────────────────────────────────────┘
```

### 4.2 The five properties, each a code path and not a rule

1. **Idempotent.** The unit of work is `(wd_number, modification_number)`. Re-running the job
   on the same day writes nothing. Re-running after a partial failure resumes; the only
   observable effect of a duplicate run is `last_verified` moving forward.
2. **Versioned and append-only, and superseded revisions are first-class rows.** A modification is
   a **new row**, never an update. The old row keeps its `document_text` and gets `superseded_by`.
   Nothing that was ever shown to a customer is ever mutated. (CORPUS_DESIGN §2.3, applied.)
   **A superseded revision fetched on demand goes through the identical path** — same parser, same
   transaction, same gates G1–G4, same provenance on every row. There is no "lite" ingest: a rate
   we may have to defend in year three is not a second-class row. And `is_active` is derived from
   the index and `/history`, **never** from "is this the newest row we hold" — fetching mod 0 after
   mod 1 must not flip mod 1 to inactive. *(Added 2026-09-03, finding B4.)*
3. **Change detection never silently changes a customer's project.** A project pins
   `(wd_number, modification_number)`. Ingesting modification 2 does **not** move a project off
   modification 1. It raises an alert and offers the change; a human accepts it. Silently
   re-rating a certified payroll would be a false certification under 18 U.S.C. § 1001.
4. **Pre-flight aborts, it does not degrade.** If the index returns 0 records, or 20% fewer than
   last run, or a non-`hal+json` content type, the run aborts and alerts. GSA renaming a path
   must look like an outage, not like "every determination was withdrawn".
5. **Gates fail the run.** Not warn. A determination that violates §7 is not written.

### 4.3 Cold start

The first run is a **full pull**: 4,235 determinations, ~24 minutes serial, ~4 minutes at
6-way concurrency, ~73 MB of text, ~135,000 classification rows. Vercel's function timeout
makes that a **queue-drained job, not one request** (A12): the index pass enqueues one
`kb.fetch_determination` job per new pair into `jobs`, and the cron route drains a bounded
batch per invocation with `FOR UPDATE SKIP LOCKED`, exactly as Clausewright does. Steady state
is 0–30 jobs a day.

### 4.4 Idempotency key and re-parse

`parser_version` on every determination row means a parser improvement can re-derive
`kb_classifications` from stored `document_text` **with no network calls at all** — a `reparse`
job that reads the corpus we already hold. This is the reason §3.3 decision 3 exists.

---

## 5. WH-347 and Statement of Compliance generation

Because of F2 there is no fillable PDF. The generator is ours.

| requirement | rule |
|---|---|
| layout | Reproduce the official grid: page 1 header block, 8 worker rows, columns labelled exactly `(1A) (1B) (1C) (1D) (1E) (2) (3) (4) (5) (6A) (6B) (6C) (7A) (7B) (8) (9)`; page 2 Statement of Compliance. |
| wording | The Statement of Compliance text is **verbatim** from `kb-samples/wh347-page2-statement-of-compliance.txt`. Gated by test G5. |
| worker id | Column (1E) prints **the last four digits only**. There is no code path that can print more, because no column stores more. |
| overflow | More than 8 workers → continuation pages, `Page n of m`, the header block repeated. The official form has no continuation convention; ours states one and the help page explains it. |
| stamp | Every generated PDF carries, in the footer: the WD number, the modification number, the determination's publication date, the generation timestamp, and **`{{PRODUCT_URL}}`, resolved from env to the live host** — so an auditor can re-derive the rates from the same source we used. *(Changed 2026-09-03, finding m2: this said `wagelens.app`, a domain nobody owns and which the naming pass may never produce — `PLAN.md` D3 puts us on `*.vercel.app` at launch and `IDENTITY.md` §1 records that `wagelens.com` is a live unrelated product. **A wrong URL on a federal filing that must survive three years is a small mistake with a long life.**)* |
| identity | `documents.sha256` over the PDF bytes. Regenerating an unchanged payroll must produce the same hash (deterministic: no timestamps in the PDF body, fonts embedded, `CreationDate` pinned to `certified_at`). |
| authority | The footer says the form is our reproduction of DOL form WH-347, Rev. January 2025, OMB 1235-0008, and links to the official PDF. |

`Certified Payroll No.` (page 1) and `Payroll No.` (page 2) are the **same sequential integer**,
scoped to `(project_id, filer_organisation_id)`, starting at 1, with no gaps. The app owns that
counter; the user never types it. A week with no covered work still consumes a number and is
filed as a **"No Work Performed"** payroll — the single most common thing small subs get wrong
and the reason a GC withholds payment.

---

## 6. Refresh cadence and freshness

| what | when | mechanism | why |
|---|---|---|---|
| index diff + new determinations | **daily, 02:00 UTC** | Vercel Cron → `/api/cron/kb-refresh` → enqueue → drain | DOL publishes modifications continuously; the observed cadence is roughly weekly per state but bursty. Daily is cheap (3 requests when nothing changed) and bounds a customer's exposure to one day. |
| `last_verified` bump on unchanged rows | same run | one `UPDATE … WHERE wd_number IN (…)` | A rate whose `last_verified` is 40 days old is a defect (gate G6), so the bump is what keeps the corpus green. |
| full re-fetch of everything | **weekly, Sunday 03:00 UTC** | same queue, `kind='full'` | Catches a determination edited in place without a modification bump. Costs 24 minutes of queue time once a week. |
| county dictionary | **monthly** | 54 requests | Counties change (Connecticut's 2024 planning regions; Alaska boroughs). |
| WH-347 form revision | **quarterly + on OMB expiry** | fetch the PDF, compare sha256 against `fa28f033a825…` | A new revision changes the form we generate. The current one expires **2028-01-31**. |
| Statement of Compliance wording | same check | the sha256 covers it | |

### 6.3 Detecting a modification

Two mechanisms, deliberately redundant, because this is the alert customers pay for:

- **Primary** — the index diff in §4.1 step 2. `(wd_number, modification_number)` not present
  in `kb_wage_determinations` is new by definition.
- **Secondary** — for every `(wd_number)` that some project pins, call
  `/wdol/v1/wd/{ref}/history` directly. 4,235 determinations exist but a real customer base
  pins a few hundred. This catches the case where the search index lags the WDOL service.

`sort=-modifiedDate` makes a third, cheaper mechanism available if the daily full index ever
becomes expensive: page the index newest-first and stop at the previous run's watermark.

### 6.4 If SAM.gov changes the paths

Named as a live risk because these endpoints are undocumented (F1). The recovery procedure,
written down because the person who needs it will not have discovered it:

1. Fetch `https://sam.gov/wage-determination/<any WD number>/1` and read the `<script src>`
   tags for the current `main.<hash>.js`.
2. Download that bundle and grep for `getWageDeterminationByReferenceNumberAndRevisionNumber`,
   `getWageDeterminationHistoryByReferenceNumber`, `getWageDeterminationFilterCountyData`.
   The suffixes are string literals in the method bodies; the base is in the
   `wageDetermination:"/wdol/v1"` service map.
3. Update `lib/kb/sam-endpoints.ts` — one module, which is why it is one module.

This is exactly how the current endpoints were found on 2026-09-03.

---

## 7. Quality gates — structural, not procedural

Every rule that can be a test is one. G1–G6 run inside the ingestion job and **fail the run**;
G5, G7 and G8 run in CI and **fail the build**.

| # | Gate | Enforces | Where |
|---|---|---|---|
| **G1** | Every `kb_classifications` row has non-null `source_url`, `wd_number`, `modification_number`, `publication_date`, `last_verified` | A10 | NOT NULL + ingest assertion |
| **G2** | `(wd_number, modification_number)` is unique and rows are never UPDATEd — only inserted or marked `superseded_by` | §4.2(2) | unique index + a repository with no update path for these columns |
| **G3** | Parse coverage ≥ **99.5%** of naive rate lines (`\.{2,}\$\s*[0-9]`) for every determination in the run | the parser silently dropping rates | ingest gate, run-level; measured 99.91% on a 40-WD sample |
| **G4** | Every `kb_classifications.base_rate` > 0 and `fringe_rate` ≥ 0; every `wd_id` resolves; every `rate_group_id` resolves | referential integrity | FK + check constraints |
| **G5** | The Statement of Compliance string in the codebase is byte-identical to `kb-samples/wh347-page2-statement-of-compliance.txt`, and the WH-347 sha256 matches `fa28f033a825…` | KB-6/KB-7; the form changing under us | CI test |
| **G6** | No active determination has `last_verified` older than **35 days** | a stale corpus that still looks green | daily assertion; alerts, does not abort |
| **G7** | **No column in any schema can hold a full SSN or a home address**, and no `kb_*` table has a column referencing a natural person | 29 CFR 5.5(a)(3)(ii)(B); §1 | CI test that walks the Drizzle schema |
| **G8** | Every screen and every generated document that displays a rate also displays WD number, modification number and the disclaimer | §9 | CI test over the render tree; the disclaimer component is the only path to a rate |
| **G9** | A project pinned to modification *n* never reads a rate from modification *n+1* | §4.2(3) | integration test |
| **G10** | Pre-flight: index reachable, `hal+json`, `totalElements` within ±20% of the previous run | GSA renaming a path looking like data loss | ingest pre-flight; aborts |

**G8 is the one that matters most.** It is the difference between "every rate carries its
source" being an enforceable property and being a sentence in a marketing page. It is the same
role G12 plays in Clausewright.

---

## 8. State prevailing wage — the extension plan (not in MVP)

Twenty-six states plus DC have a "little Davis-Bacon" act. A sub on a state-funded job files
the state's form, not the WH-347. This is the largest single expansion and it is deliberately
**not** in the MVP: each state is a separate corpus, a separate schedule format and often a
separate form, and shipping ten badly is worse than shipping federal well.

**The ten, in order, and why.** Ranked on (a) contractor count in our own prospect list
(`../../phase-3-acquisition/prospects/wagelens/README.md`), (b) whether the state's schedule is
machine-readable, (c) whether the state mandates a state-specific certified-payroll form.

| # | State | Why it is here | How the schedule is published | Route status, 2026-09-03 |
|---:|---|---|---|---|
| 1 | **California** | Largest prevailing-wage market in the US; DIR registration + eCPR filing is mandatory | DIR "Director's General Prevailing Wage Determinations", **semi-annual issues** (2026-1, 2026-2), journeyman and apprentice menus, plus separate residential and superseded sets | `dir.ca.gov/OPRL/DPreWageDetermination.htm` **200, HTML index → per-craft pages**. The *contractor registry* is a ServiceNow wall (phase 3 §13) but the **determinations are open**. |
| 2 | **Washington** | 651 prospect rows; intents + affidavits are filed per job, so the pain is weekly | L&I wage lookup app; **Socrata datasets carry the trade name and the rate** | `secure.lni.wa.gov/wagelookup/` **200**; `data.wa.gov/resource/pcn2-jime.json` **200 (JSON)** — the single most machine-readable state in the country |
| 3 | **New York** | 692 + 542 prospect rows; Article 8 weekly certified payroll is its own regime | NYSDOL Article 8 schedules, published per county per trade, updated annually 1 July with amendments | `data.ny.gov/resource/w2zp-sf2x.json` **200** for the *filings*; the *schedules* themselves are PDF — `UNVERIFIED` route |
| 4 | **Illinois** | 547 prospect rows; IDOL certified transcript of payroll is monthly and mandatory | IDOL rates by county and trade, revised monthly | `labor.illinois.gov/laws-rules/conmed/rates.html` **200** |
| 5 | **New Jersey** | Dense public construction; NJDOL determinations by craft and county | NJDOL prevailing wage determinations, per craft | route `UNVERIFIED` — the guessed URL 404s; discover via `data.nj.gov` catalogue |
| 6 | **Massachusetts** | Awarding-authority-issued schedules, per project — a different model worth learning early | DLS issues a schedule **per project on request**, not a standing table | route `UNVERIFIED` — model confirmed, URL not |
| 7 | **Ohio** | Large market; per-county, per-trade schedules | Ohio Commerce/DIC prevailing wage schedules | route `UNVERIFIED` |
| 8 | **Minnesota** | DLI certifications by county and job class; already appears in the federal data with project-value splits | DLI prevailing wage certifications | route `UNVERIFIED` |
| 9 | **Oregon** | BOLI publishes PWR rate books twice yearly as PDFs | BOLI PWR rates, January and July editions | `oregon.gov/boli/employers/pages/prevailing-wage.aspx` **200** |
| 10 | **Hawaii** | Small but 100% covered and high rates; simple single-schedule state — a cheap tenth | DLIR wage rate schedule | route `UNVERIFIED` |

**The sequencing rule:** ship a state only when its schedule can be ingested by a script that
passes the same gates G1–G6 as the federal corpus. California and Washington first because
their data is open and their markets are the largest. **A state whose schedule can only be
read by a human is not a state we ship** — we say so on the pricing page instead of shipping
a corpus we cannot keep true.

**What "shipping a state" means beyond rates:** most of these states have their own certified
payroll form (CA's eCPR/A-1-131, WA's intent and affidavit, NY's PW-8, IL's CTP). The rate
corpus is half the work; the form is the other half. Budget both.

---

## 9. Disclaimers

Three surfaces, three texts. All three are **components, not copy** — the rate display
component *is* the disclaimer component (gate G8), so a rate cannot be rendered without it.

### 9.1 Inline, wherever a rate appears

> Rate from wage determination **{wd_number}**, modification **{modification_number}**,
> published **{publication_date}**. [View the official determination on SAM.gov ↗]({public_url})
> · verified {last_verified}

### 9.2 Footer of every generated WH-347 and Statement of Compliance

> Generated by {{PRODUCT}} ({{PRODUCT_URL}}) on {timestamp} from **{wd_number} mod {modification_number}**
> (published {publication_date}), retrieved from SAM.gov. This is a reproduction of U.S.
> Department of Labor form WH-347 (Rev. January 2025, OMB 1235-0008); it is not an official
> DOL document. **The contractor signing this form is solely responsible for the accuracy of
> every entry on it, including the labor classifications.**

### 9.3 Standing disclaimer — help page, onboarding, and Terms

> **{{PRODUCT}} is an information tool, not legal or accounting advice, and not a substitute for
> the wage determination incorporated into your contract.**
>
> The rates shown are our reproduction of published U.S. Department of Labor Davis-Bacon
> general wage determinations, retrieved from SAM.gov. **The determination that governs your
> project is the one incorporated into your contract by the contracting agency** — which may
> be an earlier modification, a project wage determination, or a determination we do not
> carry. Confirm the wage determination number with your contracting officer or prime
> contractor before your first payroll.
>
> **Choosing the labor classification for each worker is your decision and your legal
> responsibility.** Classification follows the work actually performed, not the job title, and
> not what a worker is called on your other jobs. {{PRODUCT}} shows you the classifications the
> determination lists; it does not decide which one applies. Where no listed classification
> covers the work, a conformance must be requested through your contracting agency under
> 29 CFR 5.5(a)(1)(iii) — {{PRODUCT}} helps you prepare that request; it does not file it and
> cannot approve it.
>
> You remain responsible for paying not less than the required rates and fringes, for the
> accuracy of the certified payrolls you sign, and for meeting your submission deadlines.
> **Signing a certified payroll you know to be inaccurate carries criminal exposure under
> 18 U.S.C. § 1001 and civil exposure under 31 U.S.C. § 3729**, as the form itself states.
>
> Every rate in {{PRODUCT}} carries the wage determination number, the modification number, the
> publication date and a link to the official determination on SAM.gov. **When in doubt, open
> the link and read the determination.**

**What these texts deliberately do not say:** they do not promise compliance, they do not
promise a rate is current, and they do not name a penalty amount. The "$13,508 per violation"
figure that appears in `phase-1-ideation/shortlist.json` **is not supportable at DOL's own
penalty table** (verified by the Buyer & Identity agent, `identity/CLAUDE.md` V1) and must not
appear in any {{PRODUCT}} surface.

---

## 10. Risk register

| # | Risk | Severity | Mitigation | Status |
|---|---|---|---|---|
| K1 | GSA renames or authenticates the undocumented endpoints | **High — this is the whole corpus** | §6.4 recovery procedure; G10 pre-flight makes it an alert not a corruption; `document_text` already held means an outage degrades to a stale corpus, not an empty one | Designed |
| K2 | A user files against the wrong determination because the geography lookup gave several (F3) | **High — this is the product's core promise** | Candidates never auto-resolve; the contract's WD number is a required field before the first payroll; spec WL-02 | Designed |
| K3 | Parser silently drops a classification and a worker is underpaid | High | G3 coverage gate at 99.5%; `document_text` retained so a re-parse is free; the classification picker shows a "not finding it?" link to the verbatim determination text | Designed |
| K4 | A modification lands mid-week and the customer files at the old rate | High | Alerts on the pinned pair (WL-08); the payroll header shows the pinned modification and a banner when a newer one exists; **we never auto-migrate** | Designed |
| K5 | We are read as giving classification advice | **High — legal** | §9 disclaimers as components, gate G8; no LLM ever proposes a classification (see BACKLOG "Never") | Designed |
| K6 | Corpus goes stale unnoticed | Medium | G6 (35-day `last_verified`), admin metrics page shows corpus age | Designed |
| K7 | WH-347 revised by DOL; we generate an obsolete form | Medium | G5 sha256 check quarterly; OMB expiry **2028-01-31** is a calendar item | Designed |
| K8 | SF-1444 field list is wrong because we never opened the PDF | Low-medium | Marked `UNVERIFIED` (KB-10); MVP produces a worksheet, not the form | **Open** |
| K9 | Rate limiting / IP blocking by SAM.gov during the cold-start pull | Medium | ≤4 req/s, identified User-Agent, exponential retry, resumable queue | Designed, unmeasured |
| K10 | A customer disputes a rate we showed | Medium | Every rate row carries `source_url` + verbatim `document_text` of the exact modification; the answer is a link, not an argument | Designed |

---

## 11. Open questions

1. **Is there a published rate limit on `sam.gov/api/prod/*`?** Nothing was found. `UNVERIFIED`.
   The cold-start pull at 4 req/s is a guess. Measure on the first real run.
2. **SF-1444's actual fields** (KB-10). Needs one person with a browser.
3. **Does any state accept a WH-347 in place of its own form?** Several are said to; none was
   verified. Affects whether state expansion needs 10 form generators or 3.
4. **Do GCs' compliance portals (LCPtracker, eCPR, B2Gnow) accept an uploaded PDF, or only
   keyed entry?** This decides whether "download a PDF" is the finish line or a way-station.
   It is the highest-value unknown in the whole product.
5. **How often does a project's determination actually change mid-job?** The index shows 3,377
   of 4,235 determinations at modification 1 and only 110 above modification 2, which suggests
   mid-project changes are **rarer than the pitch implies**. If alerts fire for 5% of projects
   a year, WL-08 is a nice-to-have, not the retention hook. Instrument it from customer #1.
