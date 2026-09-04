# StayLegal prospect research - steering file

App: `staylegal`. Product: done-for-you short-term-rental permit filing and renewal,
$149-249 one-time per property plus $19-29/mo monitoring.
Research date: 2026-09-03. Research only - nothing here has been sent to anyone.

## Rules confirmed (constraints I had to apply, and the case that triggered each)

1. **No private individuals.** The original ICP is the individual host (1-10 properties),
   who may never be listed. Every end-customer row is therefore an *organisation* that
   holds many STR permits. Concrete cases:
   - `strhub.com/compare-realtors/` is a directory of STR realtors, but most entries are
     named individual agents ("<First> <Last> / Savvy STR Agents"). I recorded only the
     firm-level entries (Savvy STR Agents, Duffy Homes Realty, Rise Realty Advisors,
     ABODE International Realty, ...) and dropped every personal-name entry.
   - BNBCalc's city guides list "Dan Tate Team" (a named realtor team) and One Fine BnB's
     pages end with an author byline ("Julian Reed"). Both were dropped, along with
     "Aisling Baile", "The Doll Team" and "RoomPicks by Antony".
   - **Interpretation I took:** a firm named after a person but carrying a commercial
     suffix ("Mike Dunfee Group", "Robert Massey Company", "Mark Brower Properties",
     "Peterson Bros Realty") is an *organisation*, so it is kept. A bare personal name,
     or a name whose only qualifier is "Team", is treated as an individual and dropped.
     This is the one judgement call in the file; a future agent may tighten it.
   - Podcasts are recorded by **show name only**. Where the published title contains a
     host's name I trimmed it ("No Vacancy The Podcast", "The Vacation Rental Manager's
     Podcast", "The Vacation Rental Show"). "Alex & Annie: The Real Women of Vacation
     Rentals" is kept verbatim because that string is the show's brand, not a contact.
2. **Business contact routes only.** `contact_route` is a /contact page, a partner page,
   or a generic mailbox (info@, hello@, sales@, support@, ...) read off the organisation's
   own site. The extractor's allow-list of local-parts is in `scripts/find_domains.py`
   (GEN) and `scripts/verify_sites.py` (GEN); free-mail domains are rejected outright.
3. **No source, no row / no fabrication.** `website` is only filled when a page was
   actually fetched and identified itself as that organisation (see "domain confirmation"
   below). 470 end-customer organisations still have no confirmed site and carry an explicit note.
4. **Never estimate a fee.** `cities.csv` carries `permit_fee` only where the source page
   states an amount for *that* jurisdiction. Guides routinely compare neighbours
   ("Dallas County ... Garland charges $500 a year"), so `scripts/build_cities.py`
   rejects an amount attributed to another named place, an amount that is a nightly tax,
   and an amount that is an insurance minimum. 123 of 328 rows have a fee; the rest are
   empty on purpose.
5. **Read only.** No sign-ups, no forms, no logins. Cloudflare 403s and Vercel 429s were
   logged, never worked around.

## What worked (with yields)

- **BNBCalc `/blog/property-management/` index -> 104 US city pages.** `curl` + parse
  `<h2>` headings. 665 unique management companies across 104 cities. robots.txt
  explicitly allows ClaudeBot. Highest-yield single source in this project.
- **BNBCalc `/blog/short-term-rental-regulation/` index -> 1,227 jurisdiction guides
  (846 US).** Each has a "Quick answer" paragraph, a permit fee, a renewal cadence and
  outbound links to the city's own ordinance/portal. 290 fetched -> 290 cities.csv rows.
- **Rent Responsibly's map plugin API**:
  `https://www.rentresponsibly.org/wp-json/wpgmza/v1/markers` returns all 110 STR host
  alliances with name, city/state and their own website. The HTML page renders this
  through JavaScript and yields nothing; the API yields everything. 110 rows.
- **Domain confirmation without a search engine** (`scripts/find_domains.py`): build
  candidate domains from the organisation's own name, fetch each, and keep it only when
  the returned page's `<title>`/`og:site_name` contains every distinctive token of the
  name. ~40% hit rate, zero guessed URLs, and it also harvests generic mailboxes,
  contact pages and self-stated size signals in the same fetch.
- **One Fine BnB sitemap** (`/sitemap.xml` -> 6 post sitemaps, 5,157 URLs, 392 market
  comparison pages) covered the resort markets BNBCalc lacks: Hilton Head, Door County,
  Joshua Tree, Blue Ridge, Zion, Lake Havasu, Vail, Maui, Galveston.
- **STR Profit Map sitemap** (`/sitemap-regulations.xml`, 5,456 jurisdiction pages)
  filled Gatlinburg, Destin, Myrtle Beach, Park City, Sedona, Breckenridge, Steamboat,
  Panama City Beach, Gulf Shores, Big Bear, South Lake Tahoe, Sturgeon Bay - 38 rows.
- **obxstuff.com** OBX agency guide: 24 Outer Banks rental agencies with home counts.
- **An industry-relevance gate on every confirmed website** (`scripts/check_industry.py`).
  A domain built from a name can land on an unrelated business with the same name -
  parkplace.com is a luxury car dealership, mynd.com a German video agency. Re-opening
  each confirmed site and requiring rental / property-management vocabulary removed 35
  wrong websites and flagged 15 more as thin. Run this whenever domains are guessed.
- **Conference / podcast round-ups** on stayfi.com, lodgify.com, avantio.com and
  proper.insure gave the whole event and media channel list in four fetches.

## What failed

- **Bing via curl is broken from this environment.** It returns results for the *first
  word only*, or a cached page for an unrelated query (a search for "Haustay Vacation
  Rentals San Diego" returned StackOverflow results about SaaS). Cookie jars, referers
  and `form=QBRE` made no difference. Do not build on it; it is worse than useless
  because it looks like it worked. Mojeek 403s, Ecosia 403s, Yahoo 500s.
  **The WebSearch tool is the only working search.**
- **vrma.org member directory: 403** on every path tried (`/directory`,
  `/page/member-directory`, `/search/custom.asp?id=4292`). Only the public homepage
  loads. With a member login this would be the single best end-customer source.
- Cloudflare 403: airdna.co, rabbu.com, turno.com, visiolending.com, lodgify.com,
  resortcleaning.com, robuilt.com, techvestor.com, rentalscaleup.com.
  Vercel 429: propertyzoned.com, clearing.co, getchalet.com.
  DNS/connect failures: rented.com, waivo.com, strhelper.com, strrequirements.com,
  bookdirect.show (522), shorttermrentalsecrets.com (522).
- itrip.net/locations, grandwelcome.com/locations, casago.com/locations,
  propertymanagementinc.com/locations, vtrips.com/destinations: all 404. Franchise
  location directories would have been a large end-customer source; the URLs have moved.
- Hostaway's marketplace lists only 20 integration partners, not customers.
  PriceLabs' partner page and Breezeway's partner page 404.
- hello.pricelabs.co events page: 504.

## Mistakes I made

- I first let the domain matcher accept a page when *most* name tokens appeared anywhere
  in its body. It mapped "Austin Vacay" to austintexas.org and "Guest Haus Rentals" to
  OpenTable. Rewrote it to require every distinctive token in the domain or the `<title>`,
  and threw away the first run's output.
- I filtered BNBCalc's US regulation index with capitalised state names; the newer slugs
  are lowercase, so Nashville, Austin, New Orleans, Chicago and Palm Springs silently
  dropped out of cities.csv. Fixed by lower-casing both sides.
- My first city-fee regex took the *first* dollar amount on the page, which produced
  Huntsville = "$2" (a per-room nightly tax) and Scottsdale = "$500,000" (an insurance
  minimum). Added the per-unit / insurance / other-city guards described above.
- I initially classified any company whose name began with a national brand
  ("SkyRun Colorado Springs") as a national operator. They are local franchises and are
  now their own segment.

## Assumptions taken without confirmation

- Local city/regional host alliances are recorded as `channel`, state-wide and national
  associations as `partner`. The brief asked for both roles; one row per organisation
  forced a single choice, so the distinction is by scope.
- Avalara MyLodgeTax is recorded as `excluded` (competitor) rather than partner, because
  its per-property registration service overlaps the core job; the partner reading is
  noted in the row.
- Companies appearing in a "best Airbnb management companies in <city>" article are
  treated as STR managers even when their own name suggests long-term property
  management (Renters Warehouse, Home365, Keyrenter). Confidence stays `secondary`.
- `decision_maker_role` is inferred from company type, never from a named person.

## Advice to the next agent

1. Get a VRMA member login. The member directory is the one high-value source that is
   closed here, and it is the exact population (professional managers, many permits).
2. Do not touch Bing. Use the WebSearch tool for discovery and `curl` + python only for
   pages whose URL you already have.
3. The highest-leverage unexploited asset is BNBCalc's regulation index: 846 US
   jurisdiction guides, of which only 290 were fetched. Running the rest through
   `scripts/city_rules_detail.py` triples cities.csv with no new source needed.
4. To lift `verified` further, re-run `scripts/find_domains_pass2.py` on the remaining
   misses with more suffix variants, and consider fetching each city guide's outbound
   links - some BNBCalc pages do link the companies they list.
5. Franchise networks (iTrip, Casago, Grand Welcome, PMI, SkyRun) are the best untapped
   end-customer seam: each location is a separate permit-filing business. Find their
   current location-directory URLs and parse them.

## Directory contents note

`raw/` holds the intermediate JSON and URL lists the two builders read
(`bnbcalc_all.json`, `bnbcalc_orgs.json`, `extra_orgs.json`, `obx_companies.json`,
`domains*.json`, `industry.json`, `sizes.json`, `known_verified.json`, `rr_markers.json`,
`city_detail.json`, `spm.json`, plus the URL lists). The ~85 MB of downloaded HTML those
extracts came from was deleted after extraction to keep the repo small; every fetcher in
`scripts/` re-downloads it from the URL lists that remain, so
`python3 scripts/build_cities.py` and `python3 scripts/build_prospects.py` regenerate both
CSVs from what is checked in, and the fetchers regenerate `raw/` from the network.
