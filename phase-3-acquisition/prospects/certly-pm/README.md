# Certly — property managers (`certly-pm`)

**ICP.** Small and mid property-management firms — roughly 50-500 residential units, or 5-60 community
associations for HOA managers — plus small commercial, self-storage and manufactured-housing operators.
They must hold a current ACORD 25 from every landscaper, cleaner, roofer, plumber and electrician (and
from every commercial tenant), and today they do it in a spreadsheet, which is why lapses only surface
at claim time.

**1,101 rows, 977 of them end-customers, across 40 states + DC and 61 metros.** Sibling agent
`certly-gc/` covers the general-contractor side; nothing here overlaps it.

---

## Rows by prospect_type x segment

| prospect_type | segment | rows |
|---|---|---:|
| end-customer | HOA / community association management | 348 |
| end-customer | residential property management | 299 |
| end-customer | commercial property management | 178 |
| end-customer | manufactured housing community operator | 72 |
| end-customer | self-storage operator | 55 |
| end-customer | student housing operator | 25 |
| partner | PM software vendor | 24 |
| partner | industry association | 18 |
| partner | maintenance & vendor platform | 14 |
| partner | insurance agency / MGA | 10 |
| partner | PM consultant / coach | 5 |
| channel | media / newsletter / podcast | 15 |
| channel | conference | 12 |
| channel | online community | 10 |
| excluded | COI compliance competitor | 16 |
| **total** | | **1,101** |

## Rows by confidence

| confidence | rows | what it means here |
|---|---:|---|
| verified | 364 | the organisation's own site (or the association record for it) was fetched and read |
| secondary | 737 | found in a third-party directory or round-up that was fetched and parsed, but the organisation's own site was not opened — this includes the handful whose site answered with a bot challenge (caionline.org, Rental Housing Journal, Storable) and the Reddit/Facebook communities on blocked hosts |
| unverified | 0 | nothing was left in this state: every row either had its own site read or has a fetched third-party source behind it |

**Metros covered** (residential segment, from expertise.com city pages — 61): Albuquerque, Atlanta,
Austin, Baltimore, Birmingham, Boise, Boston, Charleston, Charlotte, Chicago, Cincinnati, Cleveland,
Colorado Springs, Columbus, Dallas, Denver, Detroit, El Paso, Fort Worth, Fresno, Grand Rapids,
Hartford, Honolulu, Houston, Indianapolis, Jacksonville, Jersey City, Kansas City, Las Vegas,
Los Angeles, Louisville, Memphis, Miami, Milwaukee, Minneapolis, Nashville, New Orleans,
Oklahoma City, Omaha, Orlando, Philadelphia, Phoenix, Pittsburgh, Portland, Raleigh, Richmond,
Sacramento, Salt Lake City, San Antonio, San Diego, San Francisco, San Jose, Seattle, Spokane,
St Louis, Tampa, Tucson, Tulsa, Virginia Beach, Washington DC, Wichita. The HOA, self-storage,
commercial and manufactured-housing segments add further metros in FL, NV, CO, OR, VA, WA, HI, MD,
NC, TX and beyond.

---

## Twenty highest-fit end-customers

Ranked on how tightly the published size sits inside the ICP band, and whether the row is actionable
today (a real website and a real contact page).

| # | organisation | where | why it is top of the list |
|---:|---|---|---|
| 1 | Marc Gottesdiener & Co., Inc. | Hartford, CT | 140+ units on its own site — the smallest end of the band, where a $99 tier is an easy yes and no incumbent will quote |
| 2 | Charleston Property Company | Charleston, SC | 400+ properties, verified site with a live contact page; single-market operator with no risk department |
| 3 | CREC Property Management | Charleston, SC | 494 properties published on its own site — mid-band, 50 years old, almost certainly a spreadsheet today |
| 4 | Astoria Charm Property Management | Baltimore, MD | "500+ doors managed" stated on the homepage; scattered-site portfolio means a long, messy vendor list |
| 5 | Copper Vine Property Management | Westminster, CO | 500+ properties and explicitly sells against self-management — the audit pitch lands |
| 6 | Best Property Management | Livermore, CA | 600+ homes across 30+ Tri-Valley/East Bay cities; multi-jurisdiction vendor mix |
| 7 | Dean & DeWitt | St. Petersburg, FL | 650+ properties in a hurricane-exposed market where roofing and restoration vendors churn constantly |
| 8 | Kefalos & Associates Real Estate | Pittsburgh, PA | 800+ units, single office — top of the band, still too small for myCOI's quote |
| 9 | Advent Properties, Inc. | Sacramento, CA | 850+ rentals; California additional-insured and waiver language is exactly what the extraction engine is for |
| 10 | Home Suite Home | Lakewood, OH | 55 properties — the floor of the ICP and the cleanest test of whether the self-serve tier converts |
| 11 | Excel Management Group, LLC | Colorado Springs, CO | 45 community associations (CommunityPay) — top of the HOA band, so the certificate count is a few hundred (my arithmetic, not a sourced figure) |
| 12 | Vantage Community Management | Lacey, WA | 43 associations; Washington HOA boards are fee-sensitive, so a $99-299 tool beats a headcount |
| 13 | Crystal Lake Community Management, Inc. | Bend, OR | 43 associations in a resort market with heavy seasonal contractor turnover |
| 14 | Gaston Wilkerson Association Services, Inc. | Reno, NV | 21 associations — mid-band, single-market firm with no risk staff of its own |
| 15 | Swiss Time Property Management, LLC | Incline Village, NV | 10 associations — small enough that the owner is the compliance function |
| 16 | Allenorth Properties LLC | Ashland, OR | 7 associations — the smallest HOA firm in the file that still has a real vendor roster |
| 17 | 180 Self-Storage | AZ | Third-party storage manager across 7 states; every site has gate, door, pest and landscaping vendors under separate contracts |
| 18 | Atomic Storage Group LLC | LA (nationwide) | Nationwide third-party storage management — one COI failure spans many owners' assets, so the liability argument is sharp |
| 19 | The Requity Group | — | 2,382 manufactured-home lots; MH parks run almost entirely on outside contractors and have no in-house risk staff |
| 20 | Ravinia Communities | — | 4,055 lots across multiple states; multi-state vendor rosters are where manual tracking breaks first |

Rows 11-16 and 19-20 come from directories that publish a portfolio size but **no website**; the first
step on each is a 30-second website lookup, which is the single cheapest enrichment left in this file.

---

## Gaps

Every segment below 30 rows, and the honest reason:

- **student housing operator (25).** There is no public register of ICP-sized student-housing
  operators. The only public rankings — Student Housing Business Top 25, NMHC — start at tens of
  thousands of beds, an order of magnitude above the ICP. All 25 rows carry that caveat in `notes`.
  This segment is small because the public data does not exist, not because it was not looked for.
- **PM software vendor (24).** This is close to the complete population of PM/HOA platforms that a
  small manager would actually run. Padding it would mean listing enterprise systems the ICP never buys.
- **industry association (18).** NARPM, CAI, IREM, NAA, BOMA, SSA, MHI, NMHC plus ten state/metro
  apartment associations. The long tail is *chapters*, and both NARPM's chapter list (client-side
  rendered) and CAI's chapter finder (403) were unreachable — that is where the next 100 rows are.
- **maintenance & vendor platform (14)** and **insurance agency / MGA (10).** Genuinely small
  categories; these are the firms that specifically serve property managers and landlords. Adding
  generalist brokers would dilute the partner thesis without adding a real co-sell route.
- **COI compliance competitor (16).** This is the whole category as three independent 2026 comparison
  articles describe it, plus the two PM-software incumbents (RealPage, Yardi) that ship their own
  vendor-credentialing product.
- **conference (12)**, **online community (10)**, **PM consultant / coach (5)**. Small by nature.
  The community rows are deliberately thin: reddit.com and facebook.com are blocked from this
  environment, so the eight Reddit/Facebook rows are sourced to a third-party round-up that was
  fetched and parsed, and carry a name (and the round-up's own member figure) and nothing else — no
  community URL, no member list, no post content.
- **Not a gap but a weakness: the commercial property management segment (178 rows) has no websites.**
  BBB's search index is readable but its company profile pages return 403, so every row in that segment
  is name + city + BBB category only. It is the least actionable segment in the file.
- **Coverage holes by geography:** New York City, Des Moines and Little Rock have no expertise.com
  page, so those metros are absent from the residential segment. CommunityPay publishes only 8 states,
  so the HOA segment is heavily FL/NV/CO/OR/VA/WA/HI-weighted.

---

## Next steps — the three sources that would add the most

1. **NARPM's chapter directory and its CRMC certified-company list.** narpm.org is *not* blocked from
   this environment (contrary to the fleet brief — see `sources.md` §11); `curl --compressed` with a
   Chrome UA returns full HTML. But `/chapters/` renders its list client-side and `/find/crmc/` returns
   an image. A browser session, or finding the JSON endpoint the chapters page calls, would add ~100
   chapters as partners plus the CRMC list, which is a pre-qualified roster of exactly the ICP.
2. **IREM's AMO directory (~500 accredited management firms) and CAI's national professional-services
   directory.** Both are 403 to curl *and* to WebFetch here. These are the two sources that would most
   improve the weakest segments — commercial property management and HOA outside the eight
   CommunityPay states. Worth asking the founder to pull them from a normal browser.
3. **propertymanagement.com's `/api/sitemap/property-managers` sitemap.** Discovered but unmined: the
   root sitemap enumerates a per-company sitemap for a directory that claims 1,000+ firms with profile
   pages. Combined with raising the expertise.com per-metro cap (723 firms already captured, only 299
   used) this is the cheapest path to another 500+ residential end-customers.

---

## Files

- `prospects.csv` — 1,101 rows, schema per the fleet brief.
- `sources.md` — every source tried, in order, with the exact command and how to extend it.
- `CLAUDE.md` — steering notes for the next agent on this target.
- `scripts/` — `fetch_expertise.py`, `fetch_hoamanagement.py`, `fetch_bbb.py`, `probe_sites.py`,
  `build_csv.py`. Run from the repo root with no arguments; `build_csv.py` regenerates `prospects.csv`
  from the captures in `raw/`.
- `raw/` — the fetched HTML and the intermediate TSV/JSON, so every row can be traced back.
