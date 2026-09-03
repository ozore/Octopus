# StayLegal - prospect research

**ICP.** The buyer is an organisation that holds and must renew many short-term-rental
permits: co-hosting and STR management companies, vacation-rental management firms in
regulated cities, and small owner-operator STR businesses with a public business site.
The original end user - the individual host with 1-10 properties - is a private
individual and is reached only through the partner and channel rows, never listed here.

Files: `prospects.csv` (1,037 organisations), `cities.csv` (328 US jurisdictions),
`sources.md` (every source tried, with reproduction commands), `CLAUDE.md` (steering
notes for the next agent), `scripts/` (10 scripts that regenerate everything).
Collected 2026-09-03. Research only - nothing here has been sent to anyone.

## Headline numbers

| | |
|---|---|
| rows in `prospects.csv` | **1,037** |
| end-customer organisations | **769** |
| distinct US markets named across end-customer rows | **145** |
| organisations whose own website was opened and confirmed | 496 |
| organisations with a business contact route (contact page or generic mailbox) | 496 |
| organisations with a sourced size signal (units/homes managed) | 65 |
| rows in `cities.csv` | **328** jurisdictions in **49** states |
| jurisdictions with a fee stated by the source | 123 |
| jurisdictions with a named enforcement/compliance vendor | 118 |

## rows per prospect_type x segment

| prospect_type | segment | rows | verified | secondary |
|---|---|---|---|---|
| end-customer | str management company | 724 | 277 | 447 |
| end-customer | national str operator | 30 | 21 | 9 |
| end-customer | str management company (franchise/branch) | 15 | 0 | 15 |
| partner | str pms software | 22 | 21 | 1 |
| partner | host association (state/regional) | 20 | 14 | 6 |
| partner | str furnishing & design | 12 | 1 | 11 |
| partner | str realtor & brokerage | 11 | 2 | 9 |
| partner | str operations software | 10 | 10 | 0 |
| partner | str pricing & data | 8 | 7 | 1 |
| partner | str education & community | 8 | 5 | 3 |
| partner | str cleaning | 5 | 1 | 4 |
| partner | str accounting & tax | 5 | 4 | 1 |
| partner | str guest experience software | 4 | 4 | 0 |
| partner | guest screening & damage | 4 | 3 | 1 |
| partner | str insurance | 4 | 4 | 0 |
| partner | str lending | 4 | 4 | 0 |
| partner | str association | 1 | 1 | 0 |
| channel | host alliance (local) | 89 | 60 | 29 |
| channel | industry conference | 18 | 11 | 7 |
| channel | podcast & newsletter | 14 | 3 | 11 |
| channel | online community | 5 | 1 | 4 |
| channel | industry publication | 2 | 2 | 0 |
| excluded | str compliance competitor | 9 | 7 | 2 |
| excluded | str data & regulation tool | 7 | 3 | 4 |
| excluded | permit expediter | 3 | 3 | 0 |
| excluded | str management competitor | 3 | 3 | 0 |

## rows per confidence

| confidence | rows |
|---|---|
| secondary | 565 |
| verified | 472 |
| **total** | **1037** |


`verified` = the organisation's own website (or a government record) was fetched and read
in this session. `secondary` = it appears in a third-party directory or list article that
was opened, but the organisation's own site was not reachable or could not be confirmed.
No row is `unverified`.

## Twenty highest-fit end-customer rows

| # | organisation | why it fits |
|---|---|---|
| 1 | [HostGenius](https://www.hostgenius.com) | States 3,000+ properties managed across a network of member operators, and appears in eight separate city guides (Atlanta, Fort Lauderdale, Jersey City, New York, San Francisco...) - one relationship covering permits in many regimes at once. |
| 2 | [Home Team Luxury Rentals](https://www.hometeamluxuryrentals.com) | Operates across Destin, Galveston, Myrtle Beach and New Orleans - four different beach permit regimes, each with its own renewal calendar. |
| 3 | [BeenStay](https://www.beenstay.com) | Named in the Galveston, Panama City Beach, Rehoboth Beach and Breckenridge market guides: four coastal/mountain regimes, all with annual registration. |
| 4 | [Air Concierge](https://www.airconcierge.com) | Appears in ten city guides including Jersey City, San Diego, Seattle and Asheville - among the strictest registration regimes in the file. |
| 5 | [Guestable](https://www.guestable.com) | Co-hosting company listed in Austin, Chicago, Fort Lauderdale, Huntington Beach and San Diego guides; every one of those cities caps or licenses STRs. |
| 6 | [McNiece Management](https://www.mcniecemanagement.com) | Multi-city manager (Atlanta, Boston, Dallas, Houston) - Boston's registration and Dallas's litigated ordinance are exactly the moving-target problem StayLegal monitors. |
| 7 | [Twiddy & Company](https://www.twiddy.com) | States 1,000+ homes on the Outer Banks; a single account representing a four-figure permit portfolio in Dare County. |
| 8 | [Carolina Designs](https://www.carolinadesigns.com) | States 350+ Outer Banks vacation rentals under management. |
| 9 | [Shoreline OBX](https://www.shorelineobx.com) | States over 230 Outer Banks vacation rentals under management. |
| 10 | [Global Florida Realty](https://www.globalfloridarealty.com) | States 500+ properties in the Orlando market, where city, county and Florida DBPR licences stack on every unit. |
| 11 | [Seabreeze Vacation Rentals](https://www.seabreezevacation.com) | States approximately 100 properties in San Diego, whose STRO licence is capped and lottery-allocated - renewal failure is unrecoverable. |
| 12 | [Open Air Homes](https://www.openairhomes.com) | States 100+ homes in Palm Springs, a city with a capped permit programme and active enforcement. |
| 13 | [Descansa PDX](https://www.descansapdx.com) | States more than 100 properties in Portland, a city with a per-unit accessory-rental permit and inspections. |
| 14 | [Surge Property Management](https://www.surgepropertymanagement.com) | Four Texas markets (Austin, Fort Worth, Garland, San Antonio); Austin's licence regime and Fort Worth's new ordinance both changed recently. |
| 15 | [Vector Stays](https://www.vectorstays.com) | Gatlinburg, Myrtle Beach and Sedona - three resort regimes, each requiring a different permit and inspection. |
| 16 | [Beach Front Property Management](https://www.beachfrontpropertymanagement.com) | Four Southern California cities including Santa Monica and Huntington Beach, both with home-sharing ordinances and enforcement units. |
| 17 | [Park Place Properties](https://www.park-place-properties.com) | States more than 100 homes in Los Angeles, whose Home-Sharing Ordinance requires an annual registration plus a primary-residence attestation. |
| 18 | [HomeQwik](https://www.homeqwik.com) | States 2,000 homes under management across Phoenix and Glendale, both $250-a-year Arizona STR licence cities. |
| 19 | [Host Haven](https://www.hosthavenstays.com) | Co-hosting company spanning Asheville, Atlanta and Honolulu - Honolulu alone is one of the hardest registration regimes in the country. |
| 20 | [TruStay](https://www.trustayrentals.com) | Galveston, Panama City Beach and Zionsville: a small multi-state operator, exactly the 1-10-property-per-market profile the offer is priced for. |

Runners-up worth the same call: Goldnest Property Management (200+ properties, Houston),
Green Residential (2,000+ doors, Houston/Pasadena), ZipRent (4,546 units), Blue Crown
Properties (542 properties, McKinney TX), Venture BnB (240+ properties, Louisville),
Birdy Vacation Rentals (200+ properties, San Antonio), Marmot Properties (300+ units,
Reno), Stratton Vantage (1,600+ properties, Phoenix).

## Gaps

Every segment below 30 rows, and why.

| segment | rows | why it is small |
|---|---|---|
| `partner / str pms software` (22) | 22 | This is close to the true size of the category - there are roughly two dozen PMSs serving US STR operators, and all of them are here. Not a gap. |
| `partner / host association (state/regional)` (20) | 20 | The complete set of state-level associations in the only public directory that exists (Rent Responsibly). More would need state-by-state searching. |
| `channel / industry conference` (18) | 18 | Four independent 2026 event round-ups were merged; the US-relevant list really is about this size. Not a gap. |
| `channel / podcast & newsletter` (14) | 14 | Recorded show names only, and only shows that appear in a published round-up. Many STR podcasts are one person's channel, which the no-individuals rule keeps out. |
| `end-customer / str management company (franchise/branch)` (15) | 15 | **Real gap.** iTrip, Casago, Grand Welcome, PMI, SkyRun and Vacasa all run franchise or branch networks of separately owned local businesses - hundreds of ideal buyers - but every location-directory URL tried returned 404 (see `sources.md` §13). These 15 were picked up incidentally from city guides. |
| `partner / str furnishing & design` (12) | 12 | Sourced from four round-up articles; the category is fragmented and most players are single-market studios with no directory. |
| `partner / str realtor & brokerage` (11) | 11 | **Constrained by the privacy rule.** The one real directory (`strhub.com/compare-realtors/`) lists individual agents by name; only the nine firm-level entries could be recorded. |
| `partner / str operations software` (10) | 10 | Close to the true category size. Not a gap. |
| `excluded / str compliance competitor` (9), `str data & regulation tool` (7), `str management competitor` (3) | 19 total | These are exhaustive for what is publicly findable; the category is genuinely small. |
| `partner / str pricing & data` (8), `str education & community` (8) | 8 each | Category size, not a sourcing failure. |
| `partner / str accounting & tax` (5), `str cleaning` (5) | 5 each | **Partial gap.** STR-specialist accountants and cleaning firms are overwhelmingly local single-market businesses with no directory; only the national names could be sourced. |
| `channel / online community` (5) | 5 | **Blocked.** reddit.com and facebook.com are unreachable from this environment, so the four subreddits are recorded as names only and Facebook host groups were not recorded at all. |
| `partner / guest screening & damage` (4), `str insurance` (4), `str lending` (4), `str guest experience software` (4) | 4 each | Genuinely small categories; all the named players are present. |
| `excluded / permit expediter` (3) | 3 | **Real gap.** There is no STR-specific permit-expediter category to enumerate; the three recorded are general building-permit firms. City-by-city searching would add more but each is a single-city business. |
| `channel / industry publication` (2), `partner / str association` (1) | 3 | VRMA and VRM Intel are the category. |

Two further honest caveats:

- **470 of 769 end-customer organisations have no confirmed website.** With no working
  search engine (see `sources.md` §3) the only way to find a company's site was to build
  candidate domains from its name and check what came back, which confirms roughly 40%.
  Those rows carry the company name, its market(s), the city guide that lists it and an
  explicit note; they are leads, not finished records.
- **`cities.csv` fees are sparse by design.** 123 of 328 rows carry a fee because the fee
  is only recorded where the source states it for that exact jurisdiction. Amounts that
  belonged to a neighbouring city, to a nightly tax or to an insurance minimum were
  dropped rather than guessed.

## Next steps - the three sources that would add the most

1. **A VRMA member login.** `vrma.org`'s member directory 403s from here. It is the exact
   population - professional vacation-rental managers, each holding dozens to hundreds of
   permits - and it is the only closed source in this project that is purely an access
   problem.
2. **The remaining 556 BNBCalc jurisdiction guides.** `raw/reg_us_all.txt` already lists
   846 US guides; 290 were fetched. Running the rest through
   `scripts/city_rules_detail.py` would take `cities.csv` past 800 jurisdictions with no
   new source and no new technique, turning it into the product's actual ordinance index.
3. **Current franchise location directories** for iTrip, Casago, Grand Welcome, PMI,
   SkyRun and Vtrips. Each network is 40-100 separately owned local businesses that each
   file their own city permits; six parseable directory pages would plausibly add 300+
   qualified end-customer rows, the single largest untapped seam.

A fourth, cheaper win: re-run `scripts/find_domains_pass2.py` with city-prefixed
subdomains and more suffix variants over the 470 unconfirmed companies, then re-run
`scripts/check_industry.py` - that lifts `verified` without any new source.
