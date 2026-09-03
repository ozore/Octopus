# certly-gc — steering notes (general contractors sub-scope)

Scope: Certly (AI COI/ACORD-25 compliance clerk), **general contractors only**.
Property managers are the sibling agent's scope (`../certly-pm/`) — do not list them here.

## Rules confirmed
- **No private individuals.** Florida DBPR's CILB extract lists most certified GC
  licences under the *qualifying individual's* name (`ERGLE, GERALD K`). Those rows
  are dropped; only the business/DBA column is kept. Same for Oregon CCB
  (`rmi_name`), Washington L&I (`primaryprincipalname`) and NCLBGC qualifier rows —
  those columns are never written to `prospects.csv`.
- Rule used to decide "person vs company": a name survives only if it carries a
  corporate/trade token (INC, LLC, CORP, CONSTRUCTION, BUILDERS, CONTRACTORS,
  GROUP, ENTERPRISES …) **and** every comma in it is followed by a corporate
  suffix. That drops `SMITH, JOHN` and keeps `BUILDING CONCEPTS OF TAMPA BAY, LLC`.
  CSLB "Sole Owner" licences are dropped wholesale (they are individuals and
  are also too small for the ICP).
- Read-only: no logins, no forms submitted beyond public search endpoints, no paid
  data. CSLB sells its full licence file for $235 — **not** bought; the free public
  data-portal county lists were used instead.

## What worked (row yields)
| source | how | yield |
|---|---|---|
| FL DBPR `CONSTRUCTIONLICENSE_1.csv` | plain GET, 45 MB, 256k rows | 20,061 company CGC/CBC licences in the 8 target metros |
| CA CSLB data portal `ListByCounty` | ASP.NET POST (viewstate) → .xlsx | 66,304 class-B licences / 35,167 company rows, 11 counties |
| OR CCB Socrata `data.oregon.gov/resource/g77e-6bhs.json` | SODA `$where` | 6,999 commercial-GC nonexempt |
| WA L&I Socrata `data.wa.gov/resource/m8qx-ubtq.json` | SODA `$where` | 16,521 active GENERAL company licences in metros |
| NC NCLBGC `portal.nclbgc.org/Public/_Search/` | POST per city, classification 27 | 4,272 rows, 1,287 active |
| GrowthZone association directories | `gz-directory-card` HTML | 163 member firms, 133 with websites |

## What failed
- `myfloridalicense.com/DBPR/os/documents/...` and several guessed DBPR paths → soft 404;
  the real index is `www2.myfloridalicense.com/construction-industry/public-records/`.
- CSLB `ListByCounty.aspx` (with the `.aspx` suffix) is rejected by the site WAF
  ("Request Rejected"); the extensionless path `/ListByCounty` works.
- Bing scraping for company websites: results are wrapped in `r.bing.com/ck/a?...u=a1<base64>`
  and the engine ignores quoted names, so it is a poor way to resolve a licensee to a domain.
- AGC national directory (`directory.agc.org`) is a Salesforce community iframe — not fetchable.
- AZ ROC (`roc.az.gov` 403; `azroc.my.site.com` Salesforce Aura) — not usable read-only.

## Mistakes I made
- First downloaded `cilb_certified.csv` / `cilb_registered.csv` (739 MB + 29 MB) assuming
  they were licensee files; they are *continuing-education* records. The licensee file is
  `extracts//CONSTRUCTIONLICENSE_1.csv`. Deleted the CE files.
- First CSLB run passed the 40 KB POST body on argv and curl aborted mid-transfer (exit 18),
  leaving truncated .xlsx files. Fixed by writing the body to a file (`--data @file`) and
  validating the zip before parsing.

## Assumptions taken without confirmation
- Florida county codes were derived from the data (23 = Miami-Dade, 16 = Broward,
  60 = Palm Beach, 39 = Hillsborough, 46 = Lee, 62 = Pinellas, 58 = Orange, 26 = Duval)
  by taking the most common city per code; DBPR publishes no code table I could reach.
- "Roughly $5M–$150M revenue / 20–150 subs" is not in any register, so licence class,
  entity type, workers'-comp status and licence age are used as proxies.

## Advice to the next agent
1. The five bulk sources above regenerate with `scripts/*.py` from the repo root; re-run
   them rather than re-deriving the endpoints.
2. Best unexploited lever: GrowthZone association directories — find the chapter's
   "General Contractors" category page, then `scripts/pull_assoc_directories.py` handles it.
3. Do not spend time trying to resolve register licensees to websites via a search engine;
   go the other way (directory → website → licence).
