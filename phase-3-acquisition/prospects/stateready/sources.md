# StateReady — sources tried, in the order tried

Collected 2026-09-03. Every row in `prospects.csv` points at one of the URLs below.
Fetch pattern used throughout (WebFetch drops rows on list pages, so it was only used for prose):

```
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -L --max-time 40 -o <file>.html "<url>"
python3 -c "strip <script>/<style>, replace tags with newlines, html.unescape, keep non-empty lines"
```

Raw HTML for the sixteen pages the scripts actually parse is kept under `raw/sites/`; the five PE-tracker articles are kept gzipped in `raw/`. Every other page fetched during this run was discarded after extraction (the cache was 54 MB) — the scripts re-fetch anything missing, so extraction stays reproducible. Re-runnable extractors under `scripts/`.

---

## 1. https://dealseam.com/hvac-pe-rollup-tracker-2026
PE roll-up tracker listing named HVAC/home-services consolidator platforms with sponsor, HQ and scale.
**Status: worked. 22 platforms.** Parsed as flat text (the platform cards are `<div>`s, not a table).
Extend: the same site publishes trade-specific trackers; re-pull quarterly since ownership changes monthly.

## 2. https://homesteadsp.com/hvac-mergers-and-acquisitions/
Deal map article splitting buyers into residential-led vs commercial mechanical camps.
**Status: worked. 7 platform names not in source 1** (PremiStar/Reedy, Crete United, Best in Class Technology Services, AIR Control Concepts, Legence, EMCOR, Madison Air).
Extend: it names specific 2025-26 platform transactions with dates — useful for timing outreach right after a close.

## 3. https://profitabilitypartners.io/home-services-private-equity-acquirers/
Platform-by-trade table: HVAC/plumbing/electrical, roofing/exterior, pest, pool, landscaping, each with its PE sponsor.
**Status: worked. Highest single-source yield for sponsors and for roofing platforms** — 20 roofing/exterior platforms and ~46 rows overall.
Extend: pool and landscaping tables were deliberately skipped (licensing is thin in those trades); pest was kept as an adjacent vertical note only.

## 4. https://mainstreetwealth.ai/resources/hvac-strategic-buyer-landscape
**Status: empty.** HTTP 200 but only 4,455 bytes — a JS shell with no server-rendered content. Not retried.

## 5. https://ctacquisitions.com/guides/private-equity-hvac-2026/
18 profiled HVAC PE platforms with sponsor, entry year, footprint and named add-on acquisitions.
**Status: worked.** Best source for *named add-on acquisitions* (the brand-level rows). Extraction: locate the `<h2>Active Platforms` heading, slice to the next `<h2>`, strip tags.
Extend: the References section at the end of the article lists a primary URL per claim; a future agent could verify each add-on against its press release.

## 6. Platform "our brands / our partners / locations" pages — the bulk of the file
Re-runnable: `python3 phase-3-acquisition/prospects/stateready/scripts/parse_brand_pages.py` and `parse_brand_pages2.py`.

| page | status | rows | how it parses |
|---|---|---|---|
| https://www.turnpointservices.com/turnpoint-brands/ | worked | 54 | name / `City, ST` / URL on three consecutive text lines |
| https://silaservices.com/brands/ | worked | 50 | `data-name` + `data-location` attributes on each brand card |
| https://redwoodservices.com/partners/ | worked | 23 | `Headquarters:` → `Year of Redwood Investment:` → name; domain on a later line |
| https://www.wrenchgroup.com/wrench-group-brands/ | worked | 24 | brand blurbs grouped under state headings; names matched against the page text |
| https://www.infinityhomeservices.com/ | worked | 24 | `/brands/<slug>` links plus a "N Locations" count per card |
| https://www.heartlandhomeservices.com/brands | worked | 41 | name line followed by `Headquartered in <City, State>` |
| https://northwindsservices.com/our-brands/ | worked | 27 | `Visit` line followed by the brand name |
| https://anyhourgroup.com/partners/ | worked | 21 | modal marker `×` then name then location |
| https://astraservicepartners.com/our-companies/ | worked | 30 | `<Name> - HQ` / `<Name> - Branch` plus the street address line |
| https://premistar.com/our-companies/ | worked | 43 | company name followed by `City, ST`, grouped under state headings |
| https://www.bluecardinalhomeservices.com/partner/ | worked | 13 | name line followed by `N of 13` carousel counter |
| https://creteunited.com/ | worked | 36 | `/partner/<slug>` links (names reconstructed from slugs — flagged in `notes`) |
| https://www.servicelogic.com/locations | worked | 51 | company / street / `City, ST ZIP` triples; multi-state companies detected by counting distinct states |
| https://legacyservicepartners.com/partners/ | worked | 27 | Elementor logo gallery JSON: `premium_gallery_img.url` (logo filename → name) + `premium_gallery_img_link.url` (brand site) |

**Blocked / empty platform sites (tried once or twice, then logged):**
`apexservicepartners.com` 403 · `serviceexperts.com` 403 · `southernhomeservices.com` 403 · `goettl.com` 403 ·
`nearu-services.com` HTTP 202 with an empty body · `leappartners.com` and `strikepointgroup.com` returned a 114-byte shell ·
`comfortsystemsusa.com` HTTP 202 empty · `frontierservicepartners.com` no DNS.
Apex alone would add ~107 brands; it is the single biggest remaining gap.

## 7. https://www.nascla.org/membership-directory/corporate
NASCLA corporate member directory — the best public list of **state contractor licensing agencies**.
**Status: worked. 46 state boards + several vendors** (PSI Services, NNA Surety Bonds, National Contractor License Agency).
Parse: text lines immediately preceding each `More Info` link.
Extend: `https://www.nascla.org/nascla-commercial-exam-participating-state-agencies` and `/state-business-and-law-exams` are the other two directory pages and would fill the missing states.

## 8. https://www.achrnews.com/articles/166598-33-hvac-contractors-make-the-2026-inc-5000-list
33 HVAC contractors on the 2026 Inc. 5000 with rank, three-year growth and HQ.
**Status: worked (after one indirection).** The article body has no table; the data is an embedded Flourish visualisation.
```
curl -s -A "Mozilla/5.0" -L "https://flo.uri.sh/visualisation/30013448/embed" -o flo_embed.html
python3 -c "find '_Flourish_data =', json.JSONDecoder().raw_decode(...)"   # -> {'rows':[{'columns':[rank,name,growth,'City, State',times]}]}
```
Extend: ACHR publishes this every August; the same Flourish trick works on their other list articles.

## 9. Association sites
| url | status | note |
|---|---|---|
| https://www.acca.org/home | worked | national row; `/chapters` and `/about/state-associations` both return ACCA's 404 page |
| https://www.phccweb.org/ | worked | national row |
| https://ieci.org/ + /membership/chapters/ | worked (partial) | "54 chapters, 4,300+ member companies" is static; the chapter list itself is a JS map with no WP REST post type |
| https://www.nrca.net/ , https://www.mcaa.org/ , https://www.smacna.org/ , https://www.abc.org/ , https://www.restorationindustry.org/ , https://www.npmapestworld.org/ , https://www.pcapainted.org/ , https://www.nascla.org/ | worked | national rows only |
| https://www.necanet.org/ | **blocked** 403 (twice) |
| https://www.firesprinkler.org/ (AFSA) | **blocked** 403 |
| https://seia.org/ | **blocked** 403 — SEIA state chapters not harvested |
| https://www.phccweb.org/wp-admin/admin-ajax.php `action=phcc_chapter_connect&state=XX` | **blocked** | the AngularJS chapter finder's real endpoint; Cloudflare returns an "Attention Required" interstitial to curl. This is the single best route to ~100 state/local PHCC chapters and is worth retrying from a browser session. |
| https://member.mcaa.org/s/searchdirectory/... | **blocked** | Salesforce community, JS-only |
| https://www.abc.org/Membership/Chapter-Directory | 404 | ABC's 69 chapters were not harvested |

## 10. Licence expediting / qualifier placement firms
Discovery via WebSearch (`contractor license expediting service multi-state`, `qualifier placement services nationwide`), then each site opened once.
**Worked (opened):** apiprocessing.com · a1contractorservices.com · contractor-state-license.com · specialtradeservices.com · contractorslicenseguru.com · contractorlicensinginc.com · licensingconnection.com · contractorqualify.com · theexampros.com · contractortrainingcenter.com · cscglobal.com
**Blocked:** contractorlicensingpros.com 403 · contractorqualifierconnect.com 403 · rcilicense.com no DNS · nationalqualifiernetwork.com no DNS
Extend: search state by state ("<state> contractor license service") — this category is highly local and long-tail.

## 11. Exam prep / CE schools
contractorcampus.com **(warning: the bare apex domain now resolves to an unrelated gambling site — use `www.contractorcampus.com`)** · athomeprep.com · goldcoastschools.com · 1examprep.com · psiexams.com · interplaylearning.com · hvacknowitall.com — all worked.
prometric.com **blocked** 403.

## 12. Surety bond / contractor insurance
Discovery via WebSearch (`contractor license bond surety agency nationwide`), then each site opened.
**Worked:** lancesuretybonds.com · surety1.com · suretybonds.com · nnasuretybonds.com · everybond.com · csia.com · bondingsolutions.com · performancesuretybonds.com (Viking Bond Service)
**Blocked:** wwisinc.com 403 · jwsurety.com no DNS · vikingbond.com redirects to a mail host
Extend: NASCLA's corporate member list is a filtered source of bond agencies that already work with licensing boards.

## 13. Field service software vendors
servicetitan.com · housecallpro.com · fieldedge.com · successware.com · xoi.io · sera.tech · workiz.com — worked. getjobber.com **blocked** 403.
Overlap check (required by the app brief): searched `ServiceTitan technician license tracking certification expiration feature` — found only ServiceTitan's own *product* certification programs and technician profile management, **no state-licence/CE expiry module**. So these stay `partner`, not `excluded`. Re-verify before outreach.

## 14. PE sponsors
29 sponsor sites opened directly (alpineinvestors.com, leonardgreen.com, gryphon-inv.com, gridironcapital.com, knoxlane.com, percheron.com, truarcpartners.com, ridgemontep.com, skyknightcapital.com, freemanspogli.com, altas.com, tjclp.com, newmountaincapital.com, omersprivateequity.com, partnersgroup.com, apax.com, huroncapital.com, trivest.com, shorecp.com, garnettstation.com, boynecapital.com, sawmillcapital.com, soundcorecap.com, bessemerinvestors.com, o2investment.com, imperialcap.com, gaugecapital.com, ccmpgrowth.com, strandequity.com).
**Blocked/no DNS:** privatemarkets.gs.com · morganstanley.com (403) · cortecgroup.com (403) · concentricequity.com · osceolacapital.com (114-byte shell) · dunespoint.com · lightbaycapital.com.
32 further sponsors are recorded from source 3 with `website` **left empty** per the no-fabrication rule.

## 15. Franchise systems
neighborlybrands.com (+ /our-brands/) · authoritybrands.com · hfcompanies.com · aireserv.com · mrrooter.com · mrelectric.com · onehourheatandair.com · benjaminfranklinplumbing.com · mistersparky.com · rainbowrestores.com — worked.
**Blocked:** homeserve.com 403 · premiumservicebrands.com 403 · thresholdbrands.com 403.
Extend: multi-unit franchisee companies are named in franchisor press releases and in Franchise Times' Top 400 — not reached this run, and the biggest remaining gap on the franchise side.

## 16. Roofing / restoration / fire-protection operators
Opened: tectaamerica.com (+ /locations/, 37 states) · infinityhomeservices.com · vertexservicepartners.com · skylineroofingpartners.com · alloyroofing.com · valorexteriorpartners.com · legacyusa.com · goblusky.com · atirestoration.com (+ /locations/, 25 states) · firstonsite.com · pauldavis.com · 1800waterdamage.com · servpro.com · pyebarkerfs.com (+ /about-us/overview/, 47 states) · sciensusa.com · impactfireservices.com (50+ locations) · everonsolutions.com · guardianfire.com · performanceservices.com · bonedry.com (nine states) · eriehome.com (100+ locations) · freedomforever.com (30+ states) · leecompany.com (15 locations).
**Traps found and avoided:** `allstarservices.com` is a Michigan office-coffee vending company, **not** the Morgan Stanley-backed Allstar Services; `trusspoint.com` is a mortgage calculator, **not** Soundcore's TrussPoint; `northpointroofing.com` is a New Hampshire roofer, not the Halmos-backed Northpoint Roofing Systems. All three were left with an empty `website`.

## 17. Sources tried that did **not** produce rows
| url | status |
|---|---|
| https://www.pmmag.com/pm-top-100 | 404 — PM Top 100 not found at that path |
| https://www.contractingbusiness.com/.../2025-residential-hvac-contractor-top-40 | 404 |
| https://www.ecmag.com/magazine/articles/2025-top-50-electrical-contractors | 403 |
| https://www.enr.com/toplists/2025-Top-600-Specialty-Contractors-1 | redirects to a paywalled login (bnp.dragonforms.com) |
| https://api.usaspending.gov/api/v2/search/spending_by_category/recipient/ with `naics_codes: ["238220"]` | **worked technically** (100 recipients returned, top award $49.4M) but **not used**: federal award recipients under NAICS 238220 are mostly JVs and general contractors with no evidence of a multi-state *licence* footprint, so the fit could not be defended. Left as a documented lead for a future agent who wants award amounts as a size signal. |
| reddit.com, facebook.com | on the fleet blocked list — subreddit and group **names only** were recorded, sourced from trade list articles, with no member names or post content |
