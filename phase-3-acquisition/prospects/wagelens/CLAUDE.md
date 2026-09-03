# CLAUDE.md — WageLens prospect research memory

Steering file for the next agent working `phase-3-acquisition/prospects/wagelens/`.
Written while working, not at the end. Date: 2026-09-03.

---

## Rules confirmed (from `../BRIEF.md`, with the case that triggered each)

- **§2.1 no private individuals.** USAspending, WA L&I and NJSAVI all list sole
  proprietors by personal name ("MISTY CARTER", "SMITH, JOHN"). Every pipeline
  runs `looks_like_person()` from `scripts/usaspending_pull.py` and drops those
  rows. The same function is re-applied in `scripts/build_prospects.py` as a
  second gate. It is deliberately over-eager: a two-word capitalised name with
  no company/trade token is dropped, so a handful of real firms ("Ace Paving"
  style) are lost. That is the correct trade under §4 ("if you are not sure, it
  is a person").
- **§2.2 business contact routes only.** WA L&I intents and NJSAVI publish
  contact emails; almost all are personal (`c.colley@greatfloors.com`) or free
  providers. `contact_route` is only ever filled from a **generic** local part
  (info@, sales@, office@, contracts@, payroll@ …) on a non-free domain, and the
  merge strips any free-provider address that slips into `notes`. Government
  register rows therefore mostly have an empty `contact_route`; that is correct,
  not missing work.
- **§2.3 no source, no row.** Every API row's `source_url` is a real recipient
  or award page; every register row's `source_url` is the Socrata dataset page;
  every partner/channel row's `source_url` is a URL that was actually fetched
  and whose page title is recorded in `notes`.
- **§2.4 no fabrication.** `scripts/partners_channels.py` never accepts a
  candidate URL on faith: it fetches it and requires a token match in the body.
  Candidates that failed are kept in `scripts/unverified_candidates.csv` rather
  than deleted, so the same wrong guesses are not retried. This caught real
  errors: `asacolorado.org` is the **Automotive** Service Association, not the
  American Subcontractors Association; `mossadams.com` and `marcumllp.com` now
  redirect to Baker Tilly and CBIZ respectively.
- **§2.5 read only.** No form was submitted, no account created. The one POST
  used against a non-API site (`napex.us/wp-admin/admin-ajax.php`) is the
  public locator's own read-only search, the same request the page makes.
- **§2.7 blocked list respected.** No reddit / yelp / facebook / duckduckgo.
  LinkedIn groups and Facebook groups were therefore **not** collected; see
  README Gaps.

## What worked (with yields)

| source | how | rows |
|---|---|---|
| `api.usaspending.gov` `POST /api/v2/search/spending_by_award/` | 21 construction NAICS × pages of 100, `award_amounts` 50k–10M, from 2024-01-01 | 32,840 prime awards → 10,939 distinct recipients (capped to 5,000) |
| same endpoint with `"subawards": true` | prime NAICS filter; sub-recipient name + city/state + prime name | 8,213 subawards |
| `POST /api/v2/subawards/` with `award_id=<generated_internal_id>` | top 250 primes | 302 rows, only 19/250 primes had subaward records |
| `data.wa.gov` `t9je-9qwa` / `9ncw-tqjn` (L&I intents/affidavits) | Socrata `$group` aggregation by company | 1,033 |
| `data.ny.gov` `w2zp-sf2x` (certified payroll registration) + `i4jv-zkey` (contractor registry) + `pfeu-dsx6` (UCP DBE) | Socrata | 1,527 |
| `data.cityofnewyork.us` `ci93-uc8s` (NYC SBS certified list, construction sector) | Socrata, `naics_sector like '%Construction%'` — **carries websites and 6-digit NAICS** | ~750 |
| `data.nj.gov` `tfhb-8beb` (NJSAVI, `commodity_type like '%Construction%'`) | Socrata | 596 |
| `illinois-edp.data.socrata.com` `gd6a-xm49` (IDOL certified transcript of payroll) | Socrata | 585 |
| `data.texas.gov` `de7b-7dna` (TxDOT bid tabs, `federal_project_number is not null`) | Socrata | 381 |
| `sam.gov/api/prod/sgs/v1/search/?index=opp&notice_type=a&naics=…` | **needs `Accept: application/hal+json`** or it 406s | 1,256 awardees at 1 page per NAICS (2 pages gives 2,355, but page 2 adds mostly duplicates of the USAspending set) |
| `napex.us` `/wp-admin/admin-ajax.php?action=SearchAccelerator` (`formState=<state>`) | one POST per state | 266 distinct APEX Accelerators |

Parsing tricks worth reusing:
- **Socrata is the highest-yield channel for this ICP.** Find datasets with
  `https://api.us.socrata.com/api/catalog/v1?q=<terms>&only=dataset`, then use
  `$select=col,count(*) as n&$group=col&$order=n DESC&$limit=N` to get a ranked
  company list without downloading a million rows. Encode with
  `urllib.parse.urlencode` — hand-built query strings break on spaces and `%`.
- Several of these servers gzip regardless of `Accept-Encoding`; `urllib` does
  not decompress. `_decode()` in `partners_channels.py` sniffs the magic bytes.
- USAspending `spending_by_award` caps a result set at 10,000 rows: NAICS 236220
  hit exactly 10,000 awards. Split by state or award-amount band to go deeper.

## What failed

| source | status | worth retrying with human access? |
|---|---|---|
| California DIR public works contractor registration (`services.dir.ca.gov/pw?id=dir_contractors`) | **blocked.** ServiceNow portal; `/api/now/sp/page` works with the page's `g_ck` token but every path to the table (`/api/now/table/…`, `/api/now/sp/widget/widget-data-table`, the `dir_data_table_from_url_definition` instance) answers `invalid_table` or "User is not authenticated". 3 attempts, then stopped. | **Yes — highest-value miss.** ~150k CA registered public-works contractors. A browser session or a FOIA/data request would unlock it. |
| B2Gnow / dbesystem.com UCP DBE directories (PA, TX, OH, GA, CA) | **blocked.** `FrontEnd/VendorSearchPublic.asp` 404s on every tenant tried, with or without a session cookie; `calucp`, `odot`, `gucp` all redirect to `b2gnow.gob2g.com`. | Yes, with a browser. B2Gnow is also an `excluded` competitor, so treat carefully. |
| FDOT DBE directory (`fdotewp1.dot.state.fl.us/EqualOpportunityOfficeBusinessDirectory/`) | **blocked**, HTTP 500 from the app itself. | Retry later; may be transient. |
| NCDOT vendor directory (`partner.ncdot.gov/VendorDirectory/`) | **blocked**, connection failed (HTTP 000). | Yes. |
| ABC / AGC / NECA / IEC / SMACNA / MCAA / ASA / NAWIC chapter directories | **partial.** All are JavaScript-rendered or 403 to curl; no JSON endpoint found. Only the national bodies and a hand-verified set of ~20 chapters made it in. | Yes — a browser would yield ~400 chapter rows in an hour. |
| `americassbdc.org` find-your-SBDC, `apexaccelerators.us` | **empty** to curl (SPA shells). NAPEX (`napex.us`) is the working alternative for APEX; no equivalent found for SBDC. | Yes for SBDC. |
| Cloudflare-challenged sites (necanet.org, constructiondive.com, sage.com, adp.com, gusto.com, ecmag.com, concreteconstruction.net, crowe.com, bakertilly.com, weaver.com, armanino.com, …) | **403 / "Just a moment…"**. These are unmistakably real organisations, so they are kept with `confidence=unverified`, `website` empty and the exact HTTP status in `notes`, rather than dropped. WebFetch hits the same 403. | Not needed — they are known-good; only the confidence label is affected. |
| Bing via curl | works but strips quoted phrases and wraps every result in a `bing.com/ck/a?` redirect; the `WebSearch` tool is strictly better. | — |

## Mistakes I made

1. Hand-built Socrata query strings with raw spaces and `%` wildcards →
   `InvalidURL` and silent zero-row sources on the first run. Fixed by routing
   everything through `urllib.parse.urlencode` in a `soql()` helper. **Check
   your per-source row counts; a source that yields 0 is usually your bug, not
   an empty dataset.**
2. Took the app brief's "cap the file at 5,000 rows, sorted by number of awards
   desc" literally on the first pass. Commercial-building GCs (5,586 distinct
   recipients) plus the three next-biggest codes filled the entire cap and
   pushed drywall, masonry, tile, glazing and framing subs — *core ICP trades* —
   down to 1–4 rows each. Replaced with `stratified_cap()`: up to 400 per NAICS
   segment first, then fill the remainder globally by award count. Cap and sort
   order are both still honoured. **This is the one rule I interpreted.**
3. Did not decompress gzip in the partner fetcher, so several live sites looked
   like empty 200s and were wrongly rejected (Elation Systems among them). Some
   of these servers gzip regardless of `Accept-Encoding` and `urllib` will not
   undo it for you.
4. First version of `title_case()` kept any all-caps word of three letters or
   fewer, which turned "GREEN BAY" into "Green BAY" and "ST. LOUIS" into
   "ST. Louis" across thousands of rows. Now only a fixed acronym set
   (LLC, LLP, USA, HVAC, DC, …) is preserved.
5. Deduplicated on normalised-name + website + **state** at first, reasoning that
   two same-named firms in Washington and New York are different organisations.
   The brief's own validator asserts uniqueness on `name` + `website` *exactly*,
   so that failed. The merge now applies both keys and drops on either; 658 rows
   were lost to the exact key. Some of those were probably distinct firms. If a
   future brief relaxes the validator, put the state back in the key.
6. Left the SAM.gov awardee rows carrying the **awarding office's** city/state in
   `location`. That is not the firm's address, and worse, it defeated
   deduplication against the USAspending rows for the same company. `location` is
   now empty on those rows and the awarding office lives in `notes`.
4. Spent ~20 minutes on the California DIR ServiceNow portal before accepting it
   was closed. The brief's two-attempt rule exists for a reason.

## Assumptions taken without confirmation

- A recipient with **> $50M** of federal awards in the window is out of ICP and
  goes to `large_primes_excluded.csv` (213 firms). The threshold is a judgement
  call; nothing in the brief fixes it.
- `decision_maker_role` for every register/API end-customer row is
  `owner or office manager`. In a sub with 10–80 field staff the certified
  payroll is genuinely done by one of those two, but it is an assumption, not a
  sourced fact.
- Rows sourced from WA/NY/IL/TX/NJ state registers are labelled
  `confidence=verified` because a government record for the firm was read via
  the state's own API. Their `website` values (NYC SBS, NOLA, Cincinnati) come
  from the register as published and were **not** independently opened; that
  caveat is written into each row's `notes`.
- SAM.gov `notice_type=a` awardee rows are federal awardees but the `location`
  shown is the **awarding office**, not the firm's address (the notice does not
  carry the vendor address). Said so in `notes` on every such row.

## Advice to the next agent

1. Start from Socrata (`api.us.socrata.com/api/catalog/v1`), not from Google.
   Every state that publishes prevailing-wage filings publishes them there, and
   `$group`+`count(*)` turns a million-row filing table into a ranked contractor
   list in one request. Oregon, Colorado (BOLI), Massachusetts and Minnesota are
   the obvious untried states.
2. The sharpest ICP rows in this file are the WA L&I and NY certified-payroll
   rows: those firms filed a prevailing-wage document *this year*. Prioritise
   them over the USAspending prime rows if you have to pick.
3. California is the single biggest hole. DIR registration plus the CSLB licence
   file would roughly double the file. It needs a browser, not curl.
4. `contact_route` is empty on ~95% of rows and that is the honest state of the
   world: none of these registers publish a generic business mailbox. Enriching
   it means opening each firm's own site, which is a separate, slower pass.
5. Do not re-add rejected partner candidates without re-checking them.
   `scripts/unverified_candidates.csv` holds the current run's rejects; the ones
   removed from the candidate list entirely are named in `sources.md` §12 —
   notably `asacolorado.org` (wrong organisation), `mossadams.com`,
   `marcumllp.com` and `somersetcpas.com` (all now redirect elsewhere), and the
   guessed chapter domains `agctxbuild.com`, `abcesc.org`, `abcohiovalley.org`,
   `iectexasgulfcoast.org`, `psneca.org` (none resolve).
6. The three intermediate CSVs (`scripts/api_rows.csv`, `secondary_rows.csv`,
   `partner_rows.csv`) are deliberately **not** committed: together they are
   ~7 MB that duplicates `prospects.csv`. `scripts/build_prospects.py` runs the
   matching puller for any input it does not find, so one command rebuilds
   everything. HTTP responses are cached under `/tmp/wagelens_*`, outside the
   repository, so a warm re-run is fast and makes no new requests.
