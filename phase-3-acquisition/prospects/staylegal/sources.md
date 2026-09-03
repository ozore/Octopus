# StayLegal - sources tried, in the order tried

Date: 2026-09-03. Environment note: `curl -s -A "Mozilla/5.0 ..."` plus python3 parsing
for every list page; the WebSearch tool for discovery. **Bing via curl is unusable here**
(see §3), so no source below depends on it.

---

## 1. BNBCalc - per-city property-management guides
- URL: `https://www.bnbcalc.com/blog/property-management` (index) ->
  `https://www.bnbcalc.com/blog/property-management/pmc-<city>-<state>`
- What it is: SEO article farm, one "Best Airbnb Property Management Companies in <city>"
  page per US city, each naming 8-11 local management companies as `<h2>` headings.
- Status: **worked** (robots.txt explicitly allows ClaudeBot).
- Rows yielded: 665 unique organisations across 104 US cities -> 725 end-customer rows
  after merging the other management sources.
- Reproduce:
  ```
  curl -s -A "Mozilla/5.0" "https://www.bnbcalc.com/blog/property-management" \
    | grep -o 'href="/blog/property-management/[^"]*"' | sort -u
  # then, per page, take the <h2> headings and drop the boilerplate ones
  python3 scripts/build_prospects.py     # consumes raw/bnbcalc_all.json
  ```
- Extend: the index also links non-US cities; a future agent can add Canadian/EU pages.
  Company websites are **not** linked on these pages, which is why §7 exists.

## 2. BNBCalc - per-jurisdiction STR regulation guides
- URL: `https://www.bnbcalc.com/blog/short-term-rental-regulation` (index, 1,227 links;
  846 of them US) -> `.../short-term-rental-regulation/<City>-<State>-guide`
- What it is: one guide per jurisdiction with a "Quick answer" paragraph (legality, permit
  type, fee, caps), a meta description repeating the headline numbers, and outbound links
  to the city's own ordinance or permit portal.
- Status: **worked**. 290 guides fetched.
- Rows yielded: 290 rows of `cities.csv`, every one carrying an ordinance or program URL, 118 with a
  named enforcement vendor and 111 with a fee the guide states for that jurisdiction.
- Reproduce: `python3 scripts/fetch_city_rules.py raw/reg_fetch.txt raw/city_rules.json`
  then `python3 scripts/city_rules_detail.py raw/city_sel.txt raw/city_detail.json`.
- Extend: 556 further US guides are listed in the index and were not fetched. Feed
  `raw/reg_us_all.txt` to `city_rules_detail.py` to triple cities.csv.

## 3. Bing web search via curl
- URL: `https://www.bing.com/search?q=...`
- Status: **blocked / unreliable - do not use.** It honours only the first word of a
  multi-word query, and repeatedly returned a cached result set for an entirely different
  query (a search for `Haustay Vacation Rentals San Diego` returned StackOverflow results
  about SaaS). Tried with cookie jar, `Referer`, `setmkt=en-US`, `form=QBRE`, `+` and
  `%20` encodings. Two attempts per variant, then abandoned.
- Consequence: all website discovery moved to the name-derived-domain method in §7.

## 4. Other search engines
- `https://www.mojeek.com/search?q=` - **blocked** (403).
- `https://www.ecosia.org/search?q=` - **blocked** (403, "Ecosia Firewall").
- `https://search.yahoo.com/search?p=` - **blocked** (500).
- The WebSearch tool - **worked**, used for discovery of every source below.

## 5. VRMA (Vacation Rental Management Association) member directory
- URLs tried: `https://www.vrma.org/directory`, `/page/member-directory`,
  `/mpage/directory`, `/search/custom.asp?id=4292`.
- Status: **blocked** - 403 on every path; only the public homepage renders.
- Rows yielded: 1 (the association itself, as a partner).
- Extend: this is the single highest-value closed source. A member login would expose
  several hundred professional managers, each a multi-permit organisation.

## 6. Rent Responsibly - STR host association directory
- Page URL: `https://www.rentresponsibly.org/alliances/` (renders via JavaScript, the
  HTML table is empty).
- **Working endpoint: `https://www.rentresponsibly.org/wp-json/wpgmza/v1/markers`**
- What it is: the WP Google Maps plugin's marker API behind the association map. Returns
  110 markers with `title` (association name), `address` (city, state) and `link` (its own
  website).
- Status: **worked**.
- Rows yielded: 110 (89 local alliances as `channel`, 21 state/regional and national bodies as
  `partner`).
- Reproduce:
  ```
  curl -s -A "Mozilla/5.0" https://www.rentresponsibly.org/wp-json/wpgmza/v1/markers \
    | python3 -c "import json,sys; [print(m['title'],'|',m['address'],'|',m['link']) for m in json.load(sys.stdin)]"
  ```
- Extend: `.../wp-json/wpgmza/v1/maps` lists the maps; the same site also runs an STR
  regulations map that may have its own marker set.
- Note: the first fetch with a short User-Agent was rejected by ModSecurity; the full
  Chrome UA string works.

## 7. Name-derived domain confirmation (`scripts/find_domains.py`)
- What it is: the substitute for a search engine. For each organisation name, build a
  handful of candidate domains from the name itself, fetch each, and accept it **only**
  when the page's `<title>` or `og:site_name` contains every distinctive token of the
  name. Also harvests a generic mailbox, a contact page and any self-stated size signal
  from the same fetch.
- Status: **worked**. ~2,000 candidate URLs opened.
- Rows yielded: 496 confirmed websites across the whole file, 299 of them management
  companies, after a wider-variant third pass and an industry-relevance gate.
- Reproduce: `python3 scripts/find_domains.py raw/names_all.json raw/domains.json 14`
- Extend: add more suffix variants, and try the company's city as a subdomain
  (`sandiego.<brand>.com`) for franchise brands.

## 7b. Industry-relevance gate (`scripts/check_industry.py`)
- What it is: a quality control step over §7's output. Every confirmed site is re-opened
  and kept only if the page reads as a rental or property-management business.
- Status: **worked**. 342 sites re-opened; 35 websites removed (parkplace.com is a luxury
  car dealership, mynd.com a German video agency, and several were domain-parking pages),
  15 kept with a "limited category signals" note.
- Reproduce: `python3 scripts/check_industry.py raw/sites_for_ind.json raw/industry.json 16`

## 7c. Self-stated size signals (`scripts/find_size.py`)
- What it is: homepage + `/about` + `/about-us` of every confirmed end-customer site,
  scanned for a printed unit count ("1,000+ homes", "over 5,000 properties").
- Status: **worked**. 65 organisations carry a sourced `size_signal`; only the quantity
  phrase is kept, never the surrounding sentence, because those sentences sometimes name
  the owner ("Mike, alongside his wife Vanessa, managed 200 properties").
- Reproduce: `python3 scripts/find_size.py raw/sites_for_size.json raw/sizes.json 16`

## 8. One Fine BnB - per-market comparison pages
- URL: `https://onefinebnb.com/sitemap.xml` -> 6 post sitemaps -> 5,157 URLs, of which
  392 are per-market "N companies compared" pages.
- Status: **worked**.
- Rows yielded: 124 organisations, concentrated in the resort markets BNBCalc omits
  (Hilton Head, Door County, Joshua Tree, Blue Ridge, Zion, Lake Havasu, Vail, Maui,
  Galveston, Destin, Panama City Beach, Myrtle Beach, Breckenridge, Sedona).
- Reproduce: fetch each page, take `<h3>` headings, drop the author byline.
- Extend: 368 further market pages were not fetched.

## 9. STR Profit Map - per-jurisdiction regulation pages
- URL: `https://www.strprofitmap.com/sitemap-regulations.xml` -> 5,456 URLs of the form
  `https://strprofitmap.com/regulations/<ST>/<city>`.
- Status: **worked**.
- Rows yielded: 38 `cities.csv` rows for the resort/beach/mountain markets BNBCalc lacks.
- Reproduce: `python3 scripts/fetch_spm.py raw/spm_sel.txt raw/spm.json 8`
- Extend: 5,400 further jurisdictions. These pages carry no outbound `.gov` links, so
  `ordinance_or_program_url` stays empty for rows from this source.

## 10. Outer Banks agency guide
- URL: `https://obxstuff.com/blogs/guides/comprehensive-list-of-outer-banks-vacation-rental-companies`
- Status: **worked** (`<h3>` per agency; the first few also carry "Number Homes:").
- Rows yielded: 24 Outer Banks rental agencies.
- Also tried `https://obxguides.com/vacation-rentals?...` - **empty**, the company list is
  loaded by JavaScript.

## 11. Known-organisation verification sweep (`scripts/verify_sites.py`)
- What it is: a curated list of 137 URLs (every PMS, pricing, ops, screening, insurance,
  lending, accounting, compliance and media organisation named in the brief plus the ones
  discovered along the way), each fetched for title, contact page, partner page, generic
  mailbox and self-stated size.
- Status: **worked** for 114 of 137. Size signals harvested this way include Hospitable
  "Trusted by 24,000+ hosts", PriceLabs "Trusted by 60,000+ hosts", Tokeet "powers over
  60,000 properties", Minut "Over 50,000 property managers", Operto "Trusted by 20,000+
  Property Managers", Deckard "Trusted by more than 400 jurisdictions".
- Blocked in this sweep: Cloudflare 403 - airdna.co, rabbu.com, turno.com,
  visiolending.com, lodgify.com, resortcleaning.com, robuilt.com, techvestor.com,
  rentalscaleup.com. Vercel 429 - propertyzoned.com, clearing.co. HTTP 522 -
  bookdirect.show, shorttermrentalsecrets.com. DNS/connect failure - rented.com,
  waivo.com, strhelper.com, strrequirements.com. Each is recorded on its row.
- Reproduce: `python3 scripts/verify_sites.py raw/known_urls.txt raw/known_verified.json`

## 12. Hostaway integration marketplace
- URL: `https://www.hostaway.com/marketplace`
- Status: **partial** - it lists 20 integration partners (Breezeway, Turno, PriceLabs,
  Beyond, Wheelhouse, Operto, RemoteLock, Safely, Lynx, ICND, ChargeAutomation, Ximplifi,
  Stripe, Braintree and the OTAs), not customers.
- Rows yielded: confirms 12 partner rows; supplied the only route to Turno and Rented.com,
  whose own sites are unreachable.
- `https://www.hostaway.com/partners/` and `/partners/marketplace` both redirect to the
  homepage.

## 13. Franchise / national-operator location directories
- URLs tried: `itrip.net/locations`, `grandwelcome.com/locations`, `casago.com/locations/`,
  `propertymanagementinc.com/locations`, `vtrips.com/destinations`,
  `vacasa.com/vacation-rental-management`.
- Status: **empty / 404** on all six. `evolve.com/vacation-rental-management` and
  `naturalretreats.com/destinations` return 200 but are marketing pages, not directories.
- Extend: these networks are the largest untapped end-customer seam - every franchise is a
  separate permit-filing business. Their current directory URLs need rediscovering.

## 14. Conference and podcast round-ups
- `https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-conferences/` - **worked**
- `https://stayfi.com/vrm-insider/2026/04/17/best-vacation-rental-podcasts/` - **worked**
- `https://www.lodgify.com/blog/vacation-rental-industry-events/` - **worked**
- `https://www.avantio.com/blog/short-term-rental-conference/` - **worked**
- `https://www.proper.insure/blog/best-short-term-rental-conferences/` - **worked**
- `https://hello.pricelabs.co/vacation-rental-industry-events/` - **blocked** (504)
- `https://www.rentalscaleup.com/short-term-rental-conferences-2026/` - **blocked** (403)
- Rows yielded: 18 conferences, 14 podcasts/newsletters, 2 publications.

## 15. Furnishing / design / cleaning round-ups
- `https://www.redawning.com/pm/post/10-best-airbnb-furnishing-companies-services` - worked
- `https://www.techvestor.com/blog/best-airbnb-companies-design-renovation-construction` - worked
- `https://www.gowithsurge.com/blog/best-airbnb-home-designers` - worked
- `https://fulhaus.com/best-airbnb-furnishing-companies` - worked
- `https://rapideyeinspections.com/blog/largest-vacation-rental-cleaning-companies/` -
  reached through WebSearch summary only; rows carry `secondary` confidence.
- Rows yielded: 12 furnishing/design, 5 cleaning.

## 16. STR realtor directory
- URL: `https://strhub.com/compare-realtors/`
- Status: **partial** - the directory is mostly *individual agents*, who must not be
  listed. Only the 9 firm-level entries were taken.

## 17. RedAwning per-city management articles
- URL pattern: `https://www.redawning.com/pm/post/best-airbnb-management-in-<city>-<state>`
- Status: **partial** - 9 of 18 city slugs exist, but the articles rank RedAwning, Awning,
  Vacasa and Evolve rather than local firms. Useful for the anchor rows and for per-city
  permit statements, not for local company discovery.

## 18. Blocked or empty, per the common brief (not retried)
- reddit.com - the four subreddits in `prospects.csv` are recorded as names only, with the
  block noted on each row.
- yelp.com, facebook.com - appear in search results; never fetched.
- `https://www.getchalet.com/rental-regulations/<city>` - 429 rate-limited.
- `https://strcityregs.com/sitemap.xml`, `https://strlaws.com/sitemap.xml` - 404.
- `https://www.buildyourbnb.com/sitemap.xml` - 200 but contains no `<loc>` entries.
- `https://hospitable.com/airbnb-restrictions` - 200, but it is a single article, not a
  per-city index; no rows taken.
