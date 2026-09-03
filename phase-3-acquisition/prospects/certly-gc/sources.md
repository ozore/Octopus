# Sources tried — certly-gc (general contractors)

Collected 2026-09-03. Every command below was actually run from this repo; the scripts in
`scripts/` reproduce the parsed pulls with no arguments.

---

## 1. Florida DBPR — Construction Industry public records

- **URL:** https://www2.myfloridalicense.com/construction-industry/public-records/ →
  bulk file https://www2.myfloridalicense.com/sto/file_download/extracts//CONSTRUCTIONLICENSE_1.csv
- **What it is:** the state's weekly licensee extract for the Construction Industry Licensing
  Board — 256,036 rows, 45 MB, quote/comma delimited, no header.
- **Status:** `worked`
- **Rows yielded:** 20,061 distinct company licences (CGC + CBC) in the 8 target metros;
  **150 GC rows + 24 mechanical-prime rows** written to `prospects.csv`.
- **Command:**
  ```
  curl -s -A "Mozilla/5.0" -o raw/fl_construction_license.csv \
    "https://www2.myfloridalicense.com/sto/file_download/extracts//CONSTRUCTIONLICENSE_1.csv"
  python3 scripts/build_candidates.py     # -> raw/candidates_fl.csv
  python3 scripts/make_prospects.py
  ```
- **Column layout (derived, DBPR publishes no readable table):** 0 board, 1 licence-type prefix,
  2 licensee name, 3 DBA/business name, 5-7 address, 8 city, 9 state, 10 zip, 11 county code,
  12 licence number, 13 status (`C` current), 14 individual/business flag, 15 original licence date,
  17 expiry, 20 full licence number.
- **How to extend:** the same file carries CAC (air conditioning), CCC (roofing), CUC (underground
  utility), CPC (plumbing), CRC (residential) and 127,387 `QB` qualified-business rows. Widen
  `FL_COUNTY` in `scripts/build_candidates.py` to all 67 counties for roughly 5× the volume.

## 2. Florida DBPR — CILB continuing-education extracts

- **URL:** `.../extracts/cilb_certified.csv` (739 MB) and `.../extracts/cilb_registered.csv` (29 MB)
- **Status:** `empty` for this purpose. They are continuing-education completion records, one row
  per course per licensee, with only the *individual* licensee's name — no business name. Deleted.

## 3. California CSLB — public data portal, "List of contractors by classification and county"

- **URL:** https://www2.cslb.ca.gov/onlineservices/dataportal/ListByCounty
- **What it is:** an ASP.NET form; POSTing classification + county returns an .xlsx attachment
  with licence number, business type, business name, address, county, classifications, status,
  surety company and workers'-comp carrier.
- **Status:** `worked`
- **Rows yielded:** 66,304 class-B licences over 11 counties → 35,167 company rows → **150** in
  `prospects.csv`.
- **Command:** `python3 scripts/pull_cslb.py`
- **Gotchas:** the `.aspx` URL is rejected by the site WAF ("Request Rejected"); use the
  extensionless path. The POST body is ~40 KB of viewstate, so pass it with `--data @file` —
  on argv curl aborts mid-transfer and leaves a truncated .xlsx.
- **How to extend:** `COUNTIES` in the script holds 11 of 58 county codes; classification `A`
  (general engineering) and `B-2` (residential remodelling) are also in the select.

## 4. California CSLB — full licence file

- **URL:** https://www.cslb.ca.gov/Resources/FormsAndApplications/FULL_FILE_-_UPDATE_FILE_ORDER_FORM.pdf
- **Status:** `blocked` — CSLB sells the full Licence Master File for $235 per file through its
  Data Services Unit. BRIEF §2.5 forbids running a paid service, so it was not ordered. The free
  county lists in §3 above cover the same population for the metros we care about.

## 5. Oregon CCB — "CCB Active Licenses" open dataset (Socrata)

- **URL / query actually run:**
  ```
  curl -s "https://data.oregon.gov/resource/g77e-6bhs.json?\$where=endorsement_text%20like%20\
  'Commercial%20General%20Contractor%25'%20AND%20exempt_text='Nonexempt'&\$limit=8000"
  ```
- **Status:** `worked`. 6,999 rows (2,110 Commercial GC Level 1 + 4,889 Level 2, all nonexempt).
- **Rows yielded:** **42** in `prospects.csv` (30 Level 1, 12 Level 2, in-state, company names only).
- **Useful fields:** `bond_amount`, `ins_amount`, `ins_company`, `endorsement_text`, `exempt_text`.
  `rmi_name` is the responsible individual — a person — and is never recorded.
- **How to extend:** drop the `exempt_text` filter, or add `Residential General Contractor`
  (30,423 rows) for the homebuilder segment.

## 6. Washington L&I — "Contractor License Data - General" open dataset (Socrata)

- **URL / query actually run:**
  ```
  curl -s "https://data.wa.gov/resource/m8qx-ubtq.json?\$where=contractorlicensestatus='ACTIVE'\
  %20AND%20specialtycode1desc='GENERAL'%20AND%20state='WA'%20AND%20businesstypecodedesc%20in\
  ('Corporation','Limited Liability Company','Partnership')%20AND%20city%20in(...)&\$limit=30000"
  ```
- **Status:** `worked`. 16,521 active GENERAL company registrations across 25 metro cities.
- **Rows yielded:** **52**.
- **Notes:** `primaryprincipalname` is a person and is never recorded. Companion datasets
  `ciwg-agsx` (insurance) and the bond dataset can be joined on licence number.
- **How to extend:** widen the city list, or join the insurance dataset to get each contractor's
  own liability carrier — a genuine size/risk signal.

## 7. North Carolina Licensing Board for General Contractors

- **URL:** https://portal.nclbgc.org/Public/Search — the page posts to `/Public/_Search/`
  and returns an HTML fragment.
- **Status:** `partial` (works, but each city query appears to cap at roughly 200-290 results,
  and the result table carries licence number, type, status and company name but **not** the
  address, so location comes from the city that was queried).
- **Rows yielded:** 4,272 rows over 20 cities, 1,287 active → **56** in `prospects.csv`.
- **Command:** `python3 scripts/pull_nc_nclbgc.py`
- **How to extend:** classification 28 (Residential) and 31 (Grading & Excavating) use the same
  endpoint; `ClassificationDefinitionIdnt` values are listed in the search page's select.

## 8. Arizona ROC / Nevada NSCB / Virginia DPOR / Georgia

- `https://roc.az.gov/license-search` → **403**. `https://azroc.my.site.com/AZRoc/s/contractor-search`
  loads but is a Salesforce Aura app whose data only comes back through an authenticated
  `/aura` RPC. **blocked** — not retried.
- Nevada NSCB, Virginia DPOR and Georgia were not attempted after five registers were already
  producing; they are the obvious next states (see README → Next steps).

## 9. AGC chapter member directories (GrowthZone / MicroNet)

- **URLs actually opened:**
  - https://members.agchouston.org/directory/Search/general-contractors-386559 → 39 GC firms
  - https://members.agcak.org/memberdirectory/Search/general-contractor-member-296133 → 90 GC firms
  - https://members.agcnh.org/directory/Search/building-contractors-325083 → 7
  - https://members.agcnh.org/directory/Search/design-build-325056 → 4
  - https://members.agcnh.org/directory/Search/bonds-insurance-325080 → 9 (partners)
  - https://members.agcnh.org/directory/Search/attorneys-325073 → 4 (partners)
  - https://members.agcnh.org/directory/Search/accounting-325075 → 2 (partners)
  - https://members.agcnh.org/directory/Search/software-418026 → 1 (partner)
- **Status:** `worked`. These pages render the member's name, city/state, phone **and website**
  in a `gz-directory-card` block, so one parser covers every GrowthZone directory.
- **Rows yielded:** 156 member firms, 133 with a published website.
- **Command:** `python3 scripts/pull_assoc_directories.py`
- **How to extend:** AGC has 87 chapters. Probe `members.<chapter>.org/directory` or
  `web.<chapter>.org/directory`, look for a category link containing `general-contract` or
  `building-contractors`, and add it to `SOURCES`. This is the single best unexploited lever,
  and the only practical register substitute for Texas, which has no state GC licence.
- **Chapters probed with no usable category page:** members.agcmass.org (alphabetical only,
  no categories), web.agcsd.org, web.agc-ca.org, members.agcga.org (directory present but no
  category links in the HTML), members.agccolorado.org (404 on every probed path).

## 10. AGC national member directory

- **URL:** https://directory.agc.org → iframes `https://agc-community.agc.org/s/searchdirectory`
- **Status:** `blocked` — Salesforce Experience Cloud community; content is not in the HTML.

## 11. NASBP Surety Pro Locator

- **URL:** https://suretyprolocator.nasbp.org/SearchResults?categories=<state>&pg=<n>
- **What it is:** the National Association of Surety Bond Producers' public directory of bond
  producing agencies. Bond producers issue the certificates and bonds for exactly the GC tier
  Certly sells to.
- **Status:** `worked` (paged, 3 pages per state).
- **Rows yielded:** 221 agencies over 16 states → **84** in `prospects.csv` after brand
  de-duplication and a cap of 5 per state.
- **Command:** `python3 scripts/pull_nasbp.py`
- **Privacy note:** the listings also expose named individual producers and their work
  mailboxes. Only the agency name, address and published agency website were taken.
- **How to extend:** the state select carries 62 values including territories; `bondtypes=`
  narrows to Contract - Performance & Payment.

## 12. Company websites (verification pass)

- **Status:** `worked`. 116 of 132 association-listed company sites returned HTTP 200; 95 yielded
  an on-domain contact page or a generic business mailbox. 79 of 88 curated partner / channel /
  competitor sites returned 200.
- **Command:** `python3 scripts/verify_sites.py [in.csv] [out.csv]`
- **Failures are recorded honestly in `notes`:** HTTP 403/202 means a bot wall answered instead of
  the page, so those rows are `secondary`, not `verified`.
- **Redirects that changed the answer:** `corecon.com` → Sage; `marcumllp.com` → CBIZ;
  `mossadams.com` → Baker Tilly; `constructsecure.com` → Highwire; `mycoitracking.com` →
  `illumend.ai`; `jones.com` is an unrelated private-equity firm (the COI platform is
  `getjones.com`). Each of these was corrected rather than left wrong.

## 13. COI-feature check on candidate software partners

- **Status:** `worked`. For each construction ERP / PM vendor listed as a partner, the home page
  plus `/features`, `/product`, `/solutions`, `/subcontractor-management`, `/compliance` were
  fetched and grepped for certificate-of-insurance wording.
- **Result:** Knowify (`/subcontractor-management`) and Jonas Construction
  (`/subcontractor-management`) market insurance-certificate tracking and were moved from
  `partner` to `excluded`. Contractor Foreman, Buildertrend and Sage answered 403 to every
  probe, so their rows say the check was inconclusive.
- **Command:** `python3 scripts/check_coi_features.py`

## 14. LinkedIn and Facebook groups

- **Status:** `blocked`. `https://www.linkedin.com/groups/91976/` returns the LinkedIn login wall
  (HTTP 200, title "LinkedIn Login, Sign in"); reading group membership would require an account,
  which BRIEF §2.5 forbids. facebook.com is on the environment's known-blocked list. **No group
  rows were written** rather than writing URLs that were never actually read.

## 15. Bing / search-engine resolution of licensees to websites

- **Status:** `empty`. Bing wraps every result in `https://www.bing.com/ck/a?...&u=a1<base64url>`
  and ignores quoted company names for small firms, so the top results for e.g.
  `"Tahoe Construction" Clearwater Florida` were Chevrolet Tahoe and Lake Tahoe. Abandoned after
  two attempts; websites were obtained from directories instead (which list them directly).

## 16. Curated partner / channel / competitor list

- **Status:** `worked`. 88 organisations (trade associations and chapters, builders exchanges and
  plan rooms, construction ERP/PM vendors, construction CPA firms, construction law firms, trade
  publications, podcasts, conferences and the named COI / prequalification competitors) were each
  opened with `scripts/verify_sites.py`; 79 returned HTTP 200 and their live URL, page title and
  contact page were recorded. The nine that answered 202/403/no-response are `secondary` with the
  HTTP code in `notes`.
- **Source of the names:** the competitor list in the app brief, plus AGC/ABC/NAHB/DBIA/CFMA/ASA/
  CMAA/NAWIC/MCAA, the BXNet exchange list, and the podcast/publication names surfaced by
  WebSearch (`best construction podcasts for general contractors 2026`,
  `builders exchange member directory general contractors plan room`).
