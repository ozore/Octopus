# WageLens — sources tried, in the order tried

All work was read-only. Nothing was submitted, no account was created, no login
was used. Row counts below are rows **contributed to `prospects.csv` after
deduplication**, which is lower than the raw yield of each source.

Reproduce everything with, from the repository root:

```
python3 phase-3-acquisition/prospects/wagelens/scripts/usaspending_pull.py
python3 phase-3-acquisition/prospects/wagelens/scripts/secondary_pull.py
python3 phase-3-acquisition/prospects/wagelens/scripts/partners_channels.py
python3 phase-3-acquisition/prospects/wagelens/scripts/build_prospects.py
```

---

## 1. USAspending — prime contract awards

- **URL:** `https://api.usaspending.gov/api/v2/search/spending_by_award/` (POST)
- **What it is:** the federal government's award database. Every prime contract
  with a construction NAICS in the window is a Davis-Bacon covered job.
- **Status:** `worked`
- **Raw yield:** 32,840 prime awards → 10,939 distinct in-ICP recipients.
- **Query** (one per NAICS code, paginated to `hasNext == false` or 150 pages):

```json
{"filters": {"time_period": [{"start_date": "2024-01-01", "end_date": "2026-09-03"}],
             "award_type_codes": ["A","B","C","D"],
             "naics_codes": ["238210"],
             "award_amounts": [{"lower_bound": 50000, "upper_bound": 10000000}]},
 "fields": ["Award ID","Recipient Name","Award Amount","Start Date","Awarding Agency",
            "Place of Performance State Code","NAICS","recipient_id","Recipient Location"],
 "limit": 100, "page": 1, "sort": "Award Amount", "order": "desc", "subawards": false}
```

NAICS used: 238110, 238120, 238130, 238140, 238150, 238160, 238170, 238190,
238210, 238220, 238290, 238310, 238320, 238330, 238340, 238350, 238390, 238910,
238990, 236220, 237310.

- **Per-NAICS award counts:** 236220 **10,000 (capped by the API)**, 238220 5,592,
  237310 4,367, 238210 3,615, 238990 2,848, 238160 1,780, 238290 1,409, 238910 747,
  238320 624, 238390 545, 238330 424, 238110 214, 238190 208, 238140 104, 238150 95,
  238310 73, 238350 71, 238120 59, 238170 40, 238340 14, 238130 11.
- **How to extend:** `spending_by_award` returns at most 10,000 rows per filter
  set, and NAICS 236220 hit that ceiling exactly. Split 236220 (and 238220, which
  is close) by `place_of_performance_locations` state or into award-amount bands
  to go deeper. Widening `time_period` back to 2022 roughly doubles the pool.

## 2. USAspending — subawards (the sharpest ICP)

- **URL:** the same endpoint with `"subawards": true`, and
  `https://api.usaspending.gov/api/v2/subawards/` (POST) for a per-prime pass.
- **What it is:** subcontracts reported against federal construction primes. A
  firm here is *already working a Davis-Bacon job for someone else* — the single
  best signal in this file.
- **Status:** `worked`
- **Raw yield:** 8,213 subawards from the bulk pass (7,125 of them under prime
  NAICS 236220), plus 302 from the per-prime pass.
- **Query (bulk):**

```json
{"subawards": true,
 "filters": {"time_period": [{"start_date": "2024-01-01", "end_date": "2026-09-03"}],
             "award_type_codes": ["A","B","C","D"], "naics_codes": ["236220"]},
 "fields": ["Sub-Award ID","Sub-Awardee Name","Sub-Award Amount","Sub-Award Date",
            "Awarding Agency","Prime Recipient Name","Sub-Award Description",
            "Sub-Recipient Location","NAICS"],
 "limit": 100, "page": 1, "sort": "Sub-Award Amount", "order": "desc"}
```

- **Query (per prime):** `{"award_id": "<generated_internal_id>", "sort": "amount",
  "order": "desc", "limit": 100, "page": 1}` against `/api/v2/subawards/`.
- **Note:** only 19 of the 250 largest construction primes had any subaward
  record, so the per-prime pass is a poor use of requests; the bulk pass is
  ~27× more productive for the same effort.
- **How to extend:** the `naics_codes` filter here applies to the **prime**
  award, so widening it to all of NAICS 23 (or dropping it and filtering on the
  sub-award description) surfaces construction subs under non-construction
  primes — e.g. facility-support and IDIQ vehicles.

## 3. SAM.gov opportunity search — award notices

- **URL:** `https://sam.gov/api/prod/sgs/v1/search/?index=opp&notice_type=a&naics=<code>&page=<n>&size=100&mode=search&sort=-modifiedDate`
- **Status:** `worked`, but **only with `Accept: application/hal+json`** — a
  plain request returns `406 Not Acceptable`.
- **Raw yield:** 2,355 distinct awardees across 18 construction NAICS (2 pages
  each); 6,200 award notices exist for NAICS 238210 alone.
- **Caveat recorded on every row:** the notice carries the awardee's name and
  UEI but not its address, so `location` is the **awarding office**, not the
  firm. `source_url` is `https://sam.gov/entity/<UEI>`.
- **How to extend:** the API reports `maxAllowedRecords: 10000` per query;
  paginate further per NAICS, and add `notice_type=k` (combined synopsis/
  solicitation) to reach firms bidding rather than winning.

## 4. Washington L&I — prevailing-wage intents and affidavits

- **URLs:** `https://data.wa.gov/d/t9je-9qwa` (Intent Project Details, 1,314,773
  rows) and `https://data.wa.gov/d/9ncw-tqjn` (Affidavit Project Details)
- **What it is:** every statement of intent to pay prevailing wage and every
  affidavit of wages paid filed on a Washington public works project.
- **Status:** `worked`
- **Query:**

```
https://data.wa.gov/resource/t9je-9qwa.json
  ?$select=companyname,companycity,companystate,count(*) as n,max(application_received_date) as latest
  &$where=application_received_date > '2024-01-01'
  &$group=companyname,companycity,companystate&$order=n DESC&$limit=700
```

(URL-encode with `urllib.parse.urlencode`; a hand-built query string breaks on
the spaces and the `%` wildcards.)

- **How to extend:** raise `$limit` (the long tail runs to tens of thousands of
  firms), and join `h95x-vpyj` / `pcn2-jime` on `intent_id` to attach the actual
  **trade name and hourly rate** to each contractor, which would let every WA row
  carry a real trade segment instead of a generic one.

## 5. New York — certified payroll registration and contractor registry

- **URLs:** `https://data.ny.gov/d/w2zp-sf2x` (Certified Payroll Registration,
  seven-year window, 1,361,442 rows), `https://data.ny.gov/d/i4jv-zkey`
  (Contractor Registry Certificate, 14,583 rows, all currently Active),
  `https://data.ny.gov/d/pfeu-dsx6` (NYS UCP certified DBEs, 2,262 rows of which
  1,043 carry a construction commodity code)
- **Status:** `worked`
- **Queries:** group `w2zp-sf2x` by `account` with `week_ending_date > '2024-01-01'`;
  filter `i4jv-zkey` on `status='Active'`; filter `pfeu-dsx6` on
  `commodity_codes like '%23%'` then keep rows matching `\b23\d{4}\b`.
- **How to extend:** `i4jv-zkey` has 14,583 active registrations and only ~540
  are in this file — raise the limit and page it. `w2zp-sf2x` also carries the
  project city and department of jurisdiction, so it can be sliced by awarding
  agency for a targeted campaign.

## 6. Illinois DOL — certified transcript of payroll

- **URL:** `https://illinois-edp.data.socrata.com/d/gd6a-xm49` (Report 1 — Number
  of Employees, 211,151 rows)
- **What it is:** contractors filing certified transcripts of payroll with the
  Illinois DOL on state prevailing-wage projects.
- **Status:** `worked`
- **Query:** `$select=company_name,count(*) as n,max(year) as latest,max(project_county) as county&$group=company_name&$order=n DESC&$limit=600`
- **How to extend:** twelve sibling datasets (Reports 2–13) break the same
  filings down by gender, race, ethnicity and journey/apprentice status; they
  share `company_name`, so union them for a fuller contractor list.

## 7. New Jersey — NJSAVI vendor registry

- **URL:** `https://data.nj.gov/d/tfhb-8beb` (9,713 rows, 4,925 with a
  construction commodity type)
- **Status:** `worked`
- **Query:** `$where=commodity_type like '%Construction%'`
- **Note:** this dataset carries contact emails. Almost all are personal
  (`firstinitial.lastname@…`) or free providers and were discarded under
  BRIEF §2.2; only generic mailboxes survive into `contact_route`.
- **How to extend:** raise the limit past 600 to take all 4,925.

## 8. Texas — TxDOT bid tabulations

- **URL:** `https://data.texas.gov/d/de7b-7dna` (1,042,368 bid line items)
- **Status:** `worked`
- **Query:** `$select=vendor_name,count(*) as n,max(project_actual_let_date) as latest,max(county) as county&$where=project_actual_let_date > '2024-01-01' and federal_project_number is not null&$group=vendor_name&$order=n DESC&$limit=500`
- **Why the federal filter matters:** a TxDOT letting with a
  `federal_project_number` is federal-aid highway work, which is Davis-Bacon
  covered; state-only lettings are not.
- **How to extend:** the same table has `dbe_goal_percent`, so lettings with a
  DBE goal identify primes that must subcontract to small firms.

## 9. New York City — SBS certified business list

- **URL:** `https://data.cityofnewyork.us/d/ci93-uc8s` (11,571 rows, 2,672 with
  `naics_sector = Construction`)
- **Status:** `worked` — the richest secondary source, because it carries a
  **6-digit NAICS code and the firm's own website** for each certified M/WBE.
- **Query:** `$where=naics_sector like '%Construction%'`
- **Caveat:** website values are as published in the register and were not
  independently opened; said so in each row's `notes`.
- **How to extend:** take all 2,672; also use `id6_digit_naics_code` to assign a
  real trade segment to each row instead of the generic M/WBE label.

## 10. Other city and state certification registers

| register | URL | status | note |
|---|---|---|---|
| New Orleans DBE/SLDBE directory | `https://data.nola.gov/d/q42h-ptn2` | `worked` | 251 construction firms; carries websites; owner names present and deliberately not used |
| Delaware public works prequalified contractors | `https://data.delaware.gov/d/g7vn-fpb4` | `partial` | only 29 rows exist in the dataset |
| Cincinnati MBE/WBE certified vendors | `https://data.cincinnati-oh.gov/d/2iq3-bugw` | `partial` | 455 rows, no NAICS column, so construction fit is inferred from the business name → `confidence=secondary` |
| Norfolk SWaM certified businesses | `https://data.norfolk.gov/d/393b-ph9i` | `partial` | 476 rows, filtered on NIGP code/name → `confidence=secondary` |
| Austin SBE certification list | `https://datahub.austintexas.gov/d/uxwx-55kj` | `empty` | 128 rows, mostly listed under personal names with free-provider emails; dropped under BRIEF §2.1/§2.2 |

**How the datasets were found:** `https://api.us.socrata.com/api/catalog/v1?q=<terms>&limit=15&only=dataset`
with terms like `prevailing+wage+contractor`, `certified+payroll`,
`public+works+contractor+registration`, `disadvantaged+business+enterprise`.
This is the single highest-leverage discovery trick in this whole file.

## 11. National APEX Accelerator Alliance — APEX Accelerator locator

- **URL:** `https://www.napex.us/locations/`, backed by
  `POST https://www.napex.us/wp-admin/admin-ajax.php?action=SearchAccelerator`
  with body `formState=<state name>&formZipCode=`
- **What it is:** the public directory of the ~300 federally funded APEX
  Accelerators (formerly PTACs) that counsel small firms entering government
  contracting — the people whose clients meet Davis-Bacon for the first time.
- **Status:** `worked` (queried once per state and territory)
- **Note:** `https://www.apexaccelerators.us/` is a JavaScript shell and returns
  nothing to curl; `napex.us` is the working route. Its WordPress REST API
  (`/wp-json/wp/v2/location?per_page=100`) also works but does **not** carry the
  accelerator's own website, only staff names, which are not used.
- **How to extend:** each `napex.us/location/<slug>` page could be opened to
  pull the host institution and a business contact page.

## 12. Trade associations, CPAs, vendors, media, conferences, incumbents

- **Method:** a candidate list of organisation + URL is fetched by
  `scripts/partners_channels.py`; a candidate becomes a row **only** if the URL
  answers HTTP < 400 **and** the page body contains a required token. Failures
  are written to `scripts/unverified_candidates.csv`.
- **Status:** `partial`
- **What this caught:** `asacolorado.org` is the *Automotive* Service
  Association, not the American Subcontractors Association; `mossadams.com` now
  redirects to Baker Tilly; `marcumllp.com` and `somersetcpas.com` now redirect
  to CBIZ; several guessed chapter domains (`agctxbuild.com`, `abcesc.org`,
  `abcohiovalley.org`, `iectexasgulfcoast.org`, `psneca.org`) do not resolve.
- **Cloudflare-challenged sites** (necanet.org, constructiondive.com, sage.com,
  adp.com, gusto.com, ecmag.com, concreteconstruction.net, crowe.com,
  bakertilly.com, weaver.com, armanino.com, score.org, mbda.gov and others)
  return `403 / "Just a moment…"` to both curl and WebFetch. These are
  unmistakably real organisations, so they are kept with
  `confidence=unverified`, `website` empty and the exact HTTP status recorded in
  `notes`, rather than dropped or asserted.

## 13. Blocked sources (logged, not worked around)

| source | URL | status | what happened |
|---|---|---|---|
| California DIR public works contractor registration | `https://services.dir.ca.gov/pw?id=dir_contractors&table=x_cdoi2_csm_portal_customer_account_lookup&view=public` | `blocked` | ServiceNow portal. `GET /api/now/sp/page?id=dir_contractors` works with the page's `g_ck` token and lists the widget `dir_data_table_from_url_definition`, but `POST /api/now/sp/widget/<id>` returns `invalid_table`, `POST /api/now/sp/widget/widget-data-table` returns `invalid_table`, and `/api/now/table/x_cdoi2_csm_portal_customer_account_lookup` returns `"User is not authenticated"`. Three attempts, then stopped. **Biggest single gap in this file.** |
| California DIR eCPR public search | `https://services.dir.ca.gov/pw?id=ecpr_public_search` | `blocked` | same portal, same authentication wall |
| B2Gnow / dbesystem.com UCP DBE directories | `https://paucp.dbesystem.com/FrontEnd/VendorSearchPublic.asp?TN=paucp&XID=<n>` and equivalents for txdot, idot, odot, gucp, calucp | `blocked` | `VendorSearchPublic.asp` returns 404 on every tenant, with and without a session cookie carrying a freshly minted `XID`; `calucp`, `odot` and `gucp` redirect to `b2gnow.gob2g.com`. Note B2Gnow is itself an `excluded` competitor. |
| Florida DOT DBE directory | `https://fdotewp1.dot.state.fl.us/EqualOpportunityOfficeBusinessDirectory/` | `blocked` | HTTP 500 from the application itself |
| NCDOT vendor directory | `https://partner.ncdot.gov/VendorDirectory/default.html` | `blocked` | connection failed (HTTP 000) |
| ABC chapter locator | `https://www.abc.org/chapter-locator` | `empty` | DNN site; chapter list is rendered client-side, no JSON endpoint found in the page or its scripts |
| AGC chapter directory | `https://www.agc.org/find-chapter` | `empty` | client-side rendered; the only external links in the HTML are AGC's own affiliates |
| IEC chapter locator | `https://ieci.org/membership/chapters/` | `empty` | client-side rendered |
| NECA / PHCC / MCAA chapter pages | `necanet.org/about-us/find-a-chapter`, `phccweb.org/chapters/`, `mcaa.org/about-mcaa/local-affiliates/` | `blocked` | HTTP 403 |
| ASA chapter directory | `https://www.asaonline.com/eweb/DynamicPage.aspx?Site=asa&WebCode=chapters` | `blocked` | HTTP 404 |
| America's SBDC lead-centre directory | `https://americassbdc.org/find-your-sbdc/` | `empty` | client-side rendered, no external links in the HTML |
| `apexaccelerators.us` | `https://www.apexaccelerators.us/` | `empty` | 2.6 KB SPA shell; superseded by `napex.us` (source 11) |
| Bing via curl | `https://www.bing.com/search?q=…` | `partial` | returns results but drops quoted phrases and wraps every URL in a `bing.com/ck/a?` redirect; the `WebSearch` tool is strictly better and was used instead |
| LinkedIn groups, Facebook groups | — | `blocked` | facebook.com is on the environment's blocked list (BRIEF §2.7) and LinkedIn group membership cannot be read without a login (BRIEF §2.5). No group rows were collected; see README **Gaps**. |
| NYC "Directory Of Awarded Construction Contracts" | `https://data.cityofnewyork.us/d/j7gw-gcxi` | `empty` | dataset contains only 9 rows |
