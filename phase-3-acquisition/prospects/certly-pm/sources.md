# Sources tried — certly-pm (Certly, property-manager side)

Date: 2026-09-03. Every URL below was actually requested from this environment. `curl` shorthand used
throughout is:

```
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
curl -sL -A "$UA" --compressed -m 40 -o out.html "<url>"
```

Every listing page in this file ships its whole list on **one HTML line**, so `grep -c` under-reports;
use `grep -o '<pattern>' file | wc -l`.

---

## 1. expertise.com — "Best Property Management Companies in <city>"

* URL pattern: `https://www.expertise.com/business/property-management/<state-slug>/<city-slug>`
  (e.g. `.../texas/austin`). The older `/tx/austin/property-management` form 308-redirects here.
* What it is: an editorial "best local providers" directory. Each card carries the firm's **name,
  street address and its own website**, which is what makes it usable.
* Status: **worked** — 64 city pages requested, 61 returned providers.
* Rows yielded: 784 raw cards → 723 unique firms → **299 rows in prospects.csv** (capped at 5 per metro).
* Reproduce: `python3 phase-3-acquisition/prospects/certly-pm/scripts/fetch_expertise.py`
  (writes `raw/expertise/*.html` and `raw/expertise_providers.tsv`). Parser splits on `<h2 ` and reads
  `<span class="inline-block text-balance break-normal">` for the name,
  `data-track="provider_address"` for the address and `data-track="provider_website"` for the site.
* Empty for: `new-york/new-york`, `iowa/des-moines`, `arkansas/little-rock` (404 — no such city page).
  `hoa-management`, `commercial-property-management` and `real-estate-agents` categories all 404;
  only `property-management` exists.
* How to extend: the CITIES list in the script has 64 entries; expertise.com covers several hundred US
  cities, and only 299 of the 723 firms already captured were used. Raising the per-metro cap or adding
  cities is the cheapest way to add several hundred more end-customers.

## 2. Company websites (verification pass)

* What: every expertise.com firm's own site was fetched to confirm it exists, capture the page title,
  find a real `/contact` page and look for a published portfolio size.
* Status: **worked** — 301 fetched, 255 answered, 225 yielded a contact page, 29 a portfolio figure.
* Rows: upgrades 255 residential rows to `confidence=verified`; also produced the `contact_route` for
  most of them.
* Reproduce: `python3 phase-3-acquisition/prospects/certly-pm/scripts/probe_sites.py <in.tsv> <out.tsv>`
  with a `name<TAB>website` TSV. Cached HTML lands in `raw/sites/`.
* Note: a branch or franchise site often prints the **brand's** national figure (HomeRiver's
  "40,000+ properties"), so every size_signal from this pass carries a caveat in `notes`.

## 3. communitypay.us — HOA management companies by state

* URL: `https://www.communitypay.us/management-companies/` and
  `https://www.communitypay.us/management-companies/state/<state>/`
* What it is: a compliance/payments vendor publishing, per state, every community-association
  management company it has records for **with the number of HOAs in its portfolio**.
* Status: **worked**. 8 states published: Florida (486 companies), Nevada (196), Colorado (163),
  Oregon (140), Virginia (128), Washington (96), Hawaii (80), Maryland (11). 1,248 companies parsed.
* Rows yielded: **149** — filtered to portfolio 5-60 (the Certly HOA ICP band), capped 22/state and
  4/city so one state does not dominate.
* Reproduce: parse `<tr><td>city</td><td class="col-name">name</td><td class="num">portfolio</td>`.
  Raw pages in `raw/hoa/cp_<state>.html`; parsed to `raw/communitypay.json` by `scripts/build_csv.py`.
* Limitation: **no website and no contact route is published**, so those two fields are empty and the
  rows are `confidence=secondary`.
* How to extend: only 8 states are published today; re-check for new states. The site also has a
  "top management companies nationally" table.

## 4. hoamanagement.com — state directories of association management companies

* URLs: `https://www.hoamanagement.com/state/<state>/` (listing) then
  `https://www.hoamanagement.com/association-management-company/<slug>/` (detail, carries the firm's
  own website).
* Status: **worked**. 33 states requested; ~21 listings on the biggest state pages, far fewer on
  small states (Nevada 0, Arizona 2, Hawaii 0). 139 unique companies with websites.
* Rows yielded: **108** after dedupe against the other HOA sources.
* Reproduce: `python3 phase-3-acquisition/prospects/certly-pm/scripts/fetch_hoamanagement.py`
  (writes `raw/hoamgmt/` and `raw/hoamanagement_companies.tsv`).
* Limitation: this is a paid-placement directory, so coverage is promotional rather than complete.

## 5. CAI chapter directories

| chapter | URL | status | rows |
|---|---|---|---|
| CAI North Carolina | `https://members.cai-nc.org/member-company-directory/Search/community-management-570565` | **worked** (GrowthZone; parse `card gz-directory-card` blocks, `itemprop="name"`, `gz-card-website`) | 42 |
| CAI San Diego | `https://cai-sd.org/management-company-directory/` | **worked** (Glue Up; parse `glue-up-partner-card` anchors) | 15 |
| CAI Greater Houston | `https://caihouston.org/management_company.php` | **partial** — company names only, no websites published | 34 |
| CAI Michigan / CAI Minnesota | `https://www.cai-michigan.org/membership-directory/corporate`, `https://www.cai-mn.com/membership-directory/corporate` | **partial** — 236 / 295 corporate members render server-side, but the list mixes vendors (pest control, paving) with management companies and publishes no service type, so it was not used | 0 |
| CAI DC | `https://www.caidc.org/membership-directory/corporate` | **empty** — listings load by AJAX | 0 |
| CAI Greater Los Angeles | `https://www.cai-glac.org/member-directory/` | **empty** — GrowthZone shell, listings load client-side | 0 |
| CAI Southeast Florida | `https://cai-seflorida.org/business-directory/` | **empty** — category counts render but only 2 "Management Company" listings | 0 |
| CAI Orange County | `https://www.caioc.org/membership-directory/association-management-companies` | **blocked** — connection refused (curl exit 000), twice | 0 |
| CAI national | `https://www.caionline.org/find-a-chapter/`, `https://directory.caionline.org/` | **blocked** — 403 to curl and to WebFetch | 0 |

Every one of these chapters publishes a **named individual and that person's work mailbox** for each
member company. None of that was recorded (fleet brief §2.1/§2.2); only the company name and, where
published, the company website.

How to extend: CAI has ~65 chapters. Each runs a different CMS, so the practical route is to check each
chapter for a dedicated *management company* page (as opposed to a mixed corporate-member list).

## 6. bbb.org — "Commercial Property Management" search

* URL: `https://www.bbb.org/search?find_country=USA&find_loc=<City%2C%20ST>&find_text=Commercial%20Property%20Management&page=<n>`
* What it is: the BBB business index. The search HTML embeds JSON with `"businessName"`,
  `"reportUrl"` (which contains the BBB category slug) and `"addressLocality"`/`"addressRegion"`.
* Status: **worked** for search — 25 metros x 2 pages, 15 results/page, 503 unique businesses.
* Rows yielded: **178**, filtered to BBB categories `property-management`, `real-estate-services`,
  `commercial-real-estate`, `real-estate-management`, capped 6/metro.
* Reproduce: `python3 phase-3-acquisition/prospects/certly-pm/scripts/fetch_bbb.py`
* Limitation: BBB **company profile pages return 403** to this environment, so the firm's own website
  could not be read; `website` and `contact_route` are empty for the whole segment and confidence is
  `secondary`. Some rows are mixed residential/commercial rather than pure commercial.
* How to extend: more metros and more pages; or resolve each firm's website from another source.

## 7. sitelink.com — self-storage management companies

* URLs: `https://www.sitelink.com/marketplace/management-companies` and
  `https://www.sitelink.com/marketplace/management-companies/<slug>`
* What it is: SiteLink's marketplace list of third-party self-storage management firms, with
  **headquarters address and service-area states** for each.
* Status: **worked** — 55 firms.
* Rows yielded: **55**.
* Reproduce: parse `<a href=".../management-companies/<slug>"><h2>name</h2></a><p>Headquarters: ...<br>
  Service Area: ...`. The firm's own site is behind a redirect,
  `curl -sIL -w '%{url_effective}' https://www.sitelink.com/marketplace/click/<id>`.
  Output: `raw/sitelink_storage.tsv`.
* How to extend: SiteLink also exposes `/marketplace/management-companies/area/<state>` pages.

## 8. mobilehomeuniversity.com — MHU Top 100 community owners

* URL: `https://www.mobilehomeuniversity.com/mhu-top-100-community-owners.php`
* What it is: a public ranking of the 100 largest US manufactured-home community owners with
  **lots owned** per company.
* Status: **worked**. Rows yielded: **72** (ranks 25-100 — the smaller half, closer to the ICP).
* Reproduce: parse `<tr><td>rank</td><td>name</td><td>lots</td>`.
* Notes: some lot counts are marked "est." on the source page; those rows keep the word `est.` inside
  `size_signal` and repeat the caveat in `notes`. Rows whose "company" field is a person's name plus a
  firm were skipped. No website or city is published, so those fields are empty.
* Cross-check used: `https://mhinsider.com/50-top-mh-community-owners-operators/` (MHI/NCC Top 50,
  worked, gives homesites + HQ city but is dated April 2021 — used for corroboration only).

## 9. jturnerresearch.com — Student Housing Business Top 25 Managers

* URL: `https://www.jturnerresearch.com/ora/online-reputation-rankings/student-housing-2025`
* What it is: J Turner's ORA ranking, built on the Student Housing Business Top 25 Managers list
  (Nov/Dec 2025 issue), so it carries each firm's SHB rank.
* Status: **worked**. Rows yielded: **25**.
* Caveat recorded on every row: these operators are far above the 50-500-unit ICP.

## 10. Partner / channel / competitor verification

* Method: a hand-built candidate list of 100+ organisations (COI competitors, PM software, maintenance
  and vendor platforms, landlord/HOA/self-storage insurance specialists, PM consultants, trade
  associations, conferences, trade press) was run through `scripts/probe_sites.py`, which fetches the
  homepage, records the `<title>` and finds a contact page.
* Status: **worked** — 123 rows in prospects.csv came out of this pass (`source_type=company-site`).
* Sites that never answered two fetches (so `website` is empty and `notes` says so): Jones,
  SmartCompliance, Enumerate, Deans & Homer, Bader Company, ProfitCoach, Property Management
  Mastermind, North Carolina Apartment Association, Georgia Apartment Association.
* Sites that answered with a bot-challenge instead of content (recorded `unverified`/`secondary`):
  caionline.org (Cloudflare), Rental Housing Journal ("Access denied"), Storable (403).
* **`uaahq.org` is no longer the Utah Apartment Association** — it now serves online-casino content.
  The row was dropped rather than recorded with a wrong URL.
* Competitor sourcing where the vendor's own site was unreachable:
  `https://www.getbcs.com/blog/top-certificate-of-insurance-tracking-companies`,
  `https://www.certificial.com/blog-post/best-mycoi-alternatives-2026`,
  `https://billyforinsurance.com/resources/resources-best-coi-tracking-software-2026/` — all fetched,
  all name the same competitor set.
* RealPage was classified `excluded` because its own homepage markets "Vendor Credentialing" /
  "vendor compliance"; Yardi likewise because of VendorCafe/VendorShield. No COI or vendor-credentialing
  wording was found on the fetched homepages of AppFolio, Buildium, DoorLoop, Rent Manager,
  Propertyware, Vantaca, CINC Systems, FRONTSTEPS, Condo Control, Entrata or MRI, so those stay
  `partner` with that stated in `notes`.

## 11. narpm.org — reachable, contrary to the fleet brief

* The fleet brief lists narpm.org as blocked. With `curl -sL -A "<Chrome UA>" --compressed` it returns
  **200** and full HTML (`raw/sites/www_narpm_org.html`, `raw/narpm/`).
* `https://www.narpm.org/chapters/` returns 200 but the chapter list is rendered client-side
  ("depth=0" placeholder) with no JSON endpoint in the page — **partial**.
* `https://www.narpm.org/find/crmc/` returns a PNG, not the CRMC company list — **empty**.
* `https://www.narpmconvention.com` returns 200 with the real convention title — used for the
  conference row.
* Rows yielded: NARPM itself as a partner plus its convention, Broker/Owner conference and member
  magazine as channels. **The NARPM chapter list and the CRMC certified-company list remain unmined and
  are the highest-value target for the next agent.**

## 12. Sources tried and rejected

| source | URL | status | why |
|---|---|---|---|
| IREM chapter AMO directories | `iremsf.org/AMO_Directory`, `iremmn.org/...`, `iremga.org/...`, `iremsanantonio.org/...` | **blocked** | 403 to curl *and* to WebFetch. ~500 AMO firms sit behind this. |
| IREM national | `https://www.irem.org/find-a-professional`, `/events` | **partial** | pages load, but the professional/AMO search itself is client-side |
| BOMA local chapters | `bomagla.org/member-directory/`, `bomasf.org`, `bomadet.org`, `bomaseattle.org` | **blocked / empty** | GLA requires a member login; SF and Detroit directory paths 404; Seattle 403 |
| Inside Self-Storage Top Operators | `/iss-top-operators-facility-owners`, `/iss-top-operators-facility-management-companies`, `buyersguide.insideselfstorage.com/guides/top-ops/` | **empty** | the ranking is a paid download; the free pages are navigation only |
| propertymanagement.com city pages | `/property-management/<state>/<city>` | **blocked** | 404 (pattern changed). `sitemap.xml` does expose `/api/sitemap/property-managers` — unmined |
| allpropertymanagement.com | `/property-managers/<st>/<city>/` | **blocked** | every path tried 404s to `/404.html` |
| BBB company profiles | `bbb.org/us/.../profile/...` | **blocked** | 403 (search endpoint is fine) |
| Bing via curl | `https://www.bing.com/search?q=...` | **empty** | returns degraded results — it ignored quoted phrases and returned unrelated national brands. Not usable to resolve a company name to a website. Use the WebSearch tool instead. |
| reddit.com, yelp.com, facebook.com | — | **blocked** | per fleet brief; recorded by name only, with no URL and no member or post data |

---

## Note on `raw/`

`raw/` holds the fetched pages and the parsed intermediates so every row can be traced back to a file.
Before finishing, the bulky HTML caches (`raw/sites`, `raw/expertise`, `raw/hoamgmt`, `raw/bbb`,
`raw/storage/co`, `raw/comm` — about 147 MB) were deleted; the `fetch_*.py` scripts re-download them.
What remains is exactly what `scripts/build_csv.py` reads: the TSV/JSON intermediates plus
`raw/cai/`, `raw/hoa/cp_<state>.html`, `raw/mh/`, `raw/students/` and `raw/narpm/`.
`python3 phase-3-acquisition/prospects/certly-pm/scripts/build_csv.py` regenerates `prospects.csv`
in full from what is committed.

## 13. secondnature.com — property-management forums round-up

* URL: `https://www.secondnature.com/blog/best-property-management-forums`
* Why: reddit.com and facebook.com are blocked from this environment, so the communities that matter
  most to this ICP cannot be opened. This round-up names each one and gives the publisher's own member
  count, which lets the rows carry a real `source_url` instead of being written from memory.
* Status: **worked**. Rows yielded: **8** (r/propertymanagement, Property Management Mastermind,
  NARPM Discussion Group, AppFolio User Group, Rent Manager User Forum, Buildium Users Unite,
  Triple Win Property Managers, PM Health).
* No community URL, member list or post content is recorded — only the group's name and the member
  figure the round-up itself publishes.
