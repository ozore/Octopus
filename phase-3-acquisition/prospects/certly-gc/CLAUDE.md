# certly-gc — steering notes (general contractors sub-scope)

Scope: Certly (AI COI / ACORD-25 compliance clerk), **general contractors only**.
Property managers are the sibling agent's scope (`../certly-pm/`) — never list them here.
Final state: `prospects.csv` = 780 rows (601 end-customer / 134 partner / 24 channel / 21 excluded).

## Rules confirmed (with the case that triggered each)

- **No private individuals.** Florida DBPR's licensee extract lists most certified GC licences
  under the *qualifying individual's* name (`ERGLE, GERALD K`), with the firm in a separate DBA
  column. Those rows are dropped and only the business column is kept. The same applies to Oregon
  CCB `rmi_name`, Washington L&I `primaryprincipalname` and the NCLBGC qualifier records — none of
  those columns reach `prospects.csv`. NASBP's locator publishes named producers and their
  mailboxes next to each agency; only the agency name, address and site were taken.
- **The person-vs-company test used everywhere** (`is_company()` in `scripts/build_candidates.py`):
  a name survives only if it carries a corporate or trade token (INC, LLC, CORP, CONSTRUCTION,
  BUILDERS, CONTRACTORS, GROUP, ENTERPRISES …) **and** every comma in it is followed by a corporate
  suffix. `SMITH, JOHN` is dropped; `BUILDING CONCEPTS OF TAMPA BAY, LLC` is kept. CSLB
  "Sole Owner" licences are dropped wholesale — they are individuals and are below the ICP anyway.
  A company *named after* a person (`Turner Construction`, `Roger Hickel Contracting`) is fine.
- **Business contact routes only.** `verify_sites.py` rejects `mailto:` at gmail/yahoo/hotmail/
  outlook/icloud/proton/aol and only accepts an on-domain contact page or a generic
  info@/sales@/estimating@/bids@/contact@ mailbox published on the firm's own site.
- **Read only, no paid data.** CSLB sells its full Licence Master File for $235; it was **not**
  ordered. LinkedIn group pages return a login wall, so no LinkedIn or Facebook group rows were
  written at all rather than writing URLs that were never read.

## Rule I had to interpret

The app brief says register rows should carry "the licence lookup URL as `source_url`". The common
brief (§2.3) says `source_url` must be a page you actually opened or an API query you actually ran,
and says the app brief never overrides those constraints. **The common brief wins:** `source_url`
is the bulk file / API query / search endpoint actually run, and the per-licence lookup URL and
licence number go in `notes` so any row can still be re-verified one click away.

## What worked (row yields)

| source | how | raw yield | rows in prospects.csv |
|---|---|---|---|
| FL DBPR `CONSTRUCTIONLICENSE_1.csv` | plain GET, 45 MB, 256k rows | 20,061 company CGC/CBC in 8 metros | 150 GC + 24 mechanical primes |
| CA CSLB `ListByCounty` | ASP.NET POST (viewstate) → .xlsx | 66,304 class-B / 35,167 company | 150 |
| OR CCB Socrata `g77e-6bhs` | SODA `$where` | 6,999 commercial GC nonexempt | 42 |
| WA L&I Socrata `m8qx-ubtq` | SODA `$where` | 16,521 active GENERAL companies | 52 |
| NC NCLBGC `/Public/_Search/` | POST per city, classification 27 | 4,272 rows / 1,287 active | 56 |
| AGC chapter GrowthZone directories | `gz-directory-card` HTML | 156 firms, 133 with websites | 140 GC + 16 partners |
| NASBP Surety Pro Locator | paged HTML | 221 agencies over 16 states | 84 |
| Curated partner/channel/competitor list | each site opened by curl | 88 opened, 79 at HTTP 200 | 88 |

Parsing tricks worth reusing:
- GrowthZone/MicroNet association directories all render the same `gz-directory-card` block with
  name, `itemprop="addressLocality"`, phone **and website**. One parser covers every chapter.
- Socrata (`data.<state>.gov/resource/<id>.json`) accepts `$where`/`$select`/`$group`; run a
  `$group` count first to learn the vocabulary of a column before pulling rows.
- .xlsx from a POST parses with stdlib `zipfile` + `xml.etree`; the sheet may be
  `xl/worksheets/sheet.xml`, not `sheet1.xml`.

## What failed

- `myfloridalicense.com/DBPR/os/documents/...` and several guessed DBPR paths → soft 404 (a 198 KB
  WordPress page with HTTP 200). The real index is
  `www2.myfloridalicense.com/construction-industry/public-records/`.
- CSLB `ListByCounty.aspx` (with the extension) is rejected by the site WAF ("Request Rejected");
  the extensionless `/ListByCounty` works.
- Bing scraping to resolve a licensee to a website: results are wrapped in
  `r.bing.com/ck/a?...u=a1<base64url>` and quoted small-company names are ignored. Abandoned.
- AGC national directory (`directory.agc.org`) — Salesforce Experience Cloud iframe, no HTML data.
- AZ ROC: `roc.az.gov` 403, `azroc.my.site.com` is a Salesforce Aura app. Not usable read-only.
- `members.agcmass.org`, `web.agcsd.org`, `web.agc-ca.org`, `members.agcga.org` have directories but
  expose no category links in the HTML, so no "general contractors" page to pull.
- LinkedIn groups: login wall. facebook.com: environment-blocked.

## Mistakes I made

- Downloaded `cilb_certified.csv` (739 MB) and `cilb_registered.csv` first, assuming they were
  licensee files. They are *continuing-education* completion records with only individuals' names.
  Deleted; the licensee file is `extracts//CONSTRUCTIONLICENSE_1.csv`.
- Passed the 40 KB CSLB POST body on argv; curl aborted mid-transfer (exit 18) and left truncated
  .xlsx files that failed as "not a zip file". Fixed with `--data @file` plus a zip-validity check
  and retry loop.
- Used wrong NASBP state codes on the first pass (guessed alphabetical); Florida returned 1 row.
  Re-read the locator's own `<select>` options and re-pulled — 221 rows instead of 106.
- Trusted domain guesses for four curated rows and the page titles caught them:
  `jones.com` is a private-equity firm (the COI platform is `getjones.com`), `marcumllp.com`
  now redirects to CBIZ, `mossadams.com` to Baker Tilly (so Moss Adams was a duplicate and was
  dropped), `corecon.com` to Sage. Always read the `<title>` back, not just the HTTP code.
- First pass let sub-trade firms into the GC segment (`Tacoma Plbg/htg INC`,
  `Banner Furnace & Fuel INC`) and suppliers into the association GC rows
  (`Alaska Aggregate Products`). Added a trade/supplier stop-list; re-run.
- First contact-route extraction grabbed `wp-content/plugins/contact-form-7/...` URLs. The regex
  now rejects asset paths.

## Assumptions taken without confirmation

- Florida county codes were derived from the data itself (23 Miami-Dade, 16 Broward, 60 Palm Beach,
  39 Hillsborough, 46 Lee, 62 Pinellas, 58 Orange, 26 Duval) by taking the most common city per
  code; DBPR publishes no code table I could reach.
- "$5M–$150M revenue / 20–150 subs" appears in no register, so licence class, entity type,
  workers'-comp status and licence age are used as proxies and are stated as such in `notes`.
- 28 nationally ranked contractors (Gilbane, JE Dunn, McCarthy, Skanska …) came through the AGC
  chapter directories. Rather than delete them I flagged them in `notes` as above the ICP band —
  they are true GC-member records, just the wrong size.
- A "202 Accepted" or "403" from a bot wall is treated as *not opened*: those rows are `secondary`
  and say so, even though the domain clearly exists.

## Advice to the next agent

1. Re-run, don't re-derive: `scripts/pull_cslb.py`, `pull_nc_nclbgc.py`, `pull_assoc_directories.py`,
   `pull_nasbp.py`, then `build_candidates.py` → `make_prospects.py` → `assemble.py`. Only
   `raw/fl_construction_license.csv`, `or_ccb_commercial_gc.json` and `wa_lni_general.json` are
   fetched by hand (the exact curl lines are in `sources.md` §1, §5, §6).
2. The biggest remaining lever by far is the other ~84 AGC and ~68 ABC chapters: find each
   chapter's `.../Search/general-contractors-<id>` page and append it to `SOURCES`. Those rows come
   with website + city + contact page, which register rows never do.
3. Volume without new sources: widen the quota dicts in `make_prospects.py`. FL was sampled from
   20k company licences, CA from 35k, WA from 16.5k — the pulls are already on disk.
4. Never try to resolve a register licensee to a website through a search engine; go the other way
   (directory → website → licence).
5. Keep property managers out. When a register row is a property-management company
   (`... MANAGEMENT`, `... REALTY`), it belongs to `certly-pm/`, not here.
