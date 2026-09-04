# DutyLens — sources tried, in order

Collected 2026-09-03. Every "rows yielded" number is the number of **organisations**
that reached `prospects.csv` from that source after de-duplication. Commands are
reproducible from the repo root; the scripts referenced live in `scripts/`.

Standard fetch used everywhere (WebFetch was never used for list pages, per BRIEF §2.8):

```
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36" \
     -m 40 -L --compressed "<url>"
```

---

## A. Amazon aggregator brand portfolios (end-customer)

### 1. https://www.thrasio.com/brands/ — company site
Aggregator's own brand page. **worked** — 24 brands.
`python3 scripts/fetch.py https://www.thrasio.com/brands/`
Extend: the page is a tab widget; all names are in the static HTML, no pagination.

### 2. https://www.thrasio.com/virtual-patent-marking/ — company site
Legal patent-marking page. **worked** — 25 further brands not on the brands page.
This is the trick worth reusing: US aggregators publish a *fuller* brand list on their
virtual-patent-marking page than on their marketing page, because 35 U.S.C. §287(a)
requires it.

### 3. https://www.perchhq.com/our-brands — company site
**partial** — 11 brands, recovered from `alt="… Logo"` attributes because the brand
tiles are images, not text.

### 4. https://boostedcommerce.com/brands — company site. **partial** — 4 brands (from the site footer; the /brands path 404s).
### 5. https://societybrands.com/brands — company site. **worked** — 5 brands, each with its own domain in the copy.
### 6. https://www.aterian.io/brands — company site. **partial** — page is JS-driven, only 2 logos in HTML; the 8 brand names used come from Aterian's own press releases (globenewswire, cited per row).
### 7. Dead / empty aggregator sites (all attempted once, **blocked** or **empty**)
`razor-group.com/brands` 404 · `sellerx.com/brands` "coming soon" · `unybrands.com/brands` 404 ·
`forumbrands.com/brands` 404 · `elevatebrands.co/brands` empty 114-byte body · `unabrands.com/brands` empty ·
`joinbranded.com` 403 · `moonshotbrands.com/brands` 404 · `winbrandsco.com`, `benitago.com`,
`wholesum.com`, `nebula-brands.com`, `hey-day.co` DNS failure · `sumabrands.com` now a
HugeDomains for-sale page · `theambrgroup.com` domain now serves an unrelated Thai gambling site ·
`growve.com/brands` bot challenge · `acquco.com`, `olsam.com`, `opontia.com` stub pages.
**Finding, not a gap:** the FBA-aggregator sector consolidated in 2024–2026 and most portfolio
pages no longer exist.

### 8. https://www.ecomcrew.com/amazon-fba-rollups/ — list article
"Full List of +50 Amazon FBA Acquirers/Aggregators in 2026". **worked** — 58 aggregators and
121 named example brands, of which 55 belong to US-headquartered aggregators and became rows.
Parsed from the first `<table>`; note the cell contents are `<br>`-separated, so split on the
tag *before* collapsing whitespace (I got this wrong on the first pass and got mashed names).
First attempt returned 403; a second attempt with the full desktop UA string succeeded.

---

## B. Trade-show exhibitor directories (end-customer) — highest-yield source family

All three shows below run on the **a2z Inc (`*.a2zinc.net`)** platform, which serves a fully
static exhibitor table plus a per-exhibitor `eBooth.aspx` page carrying **city, state, country
and the exhibitor's own website**. `scripts/a2z.py` generalises the miner.

### 9. https://asd.a2zinc.net/March2026/Public/Exhibitors.aspx — directory
ASD Market Week (general merchandise wholesale). **worked** — 811 exhibitors, 617 US-based,
**504 rows** after requiring a website.
`SHOW="https://asd.a2zinc.net/March2026/Public" TAG=asd python3 scripts/a2z.py`
Extend: `https://asd.a2zinc.net/August2026/Public/Exhibitors.aspx` is also live (1.76 MB, not
yet mined) and would roughly double this segment; `SourceDirect` is a separate sub-expo of
Asian factories and should stay excluded.

### 10. https://nynow.a2zinc.net/Winter2026/Public/Exhibitors.aspx — directory
NY NOW (home, gift, lifestyle). **worked** — 499 exhibitors, 436 US-based, **395 rows**.
Extend: `Summer2026`, `Summer2025`, `Winter2025` … the path pattern is `<Season><Year>`.

### 11. https://or.a2zinc.net/OR2026/Public/Exhibitors.aspx — directory
Outdoor Retailer. **worked** — 278 exhibitors, 243 US-based, **228 rows**.

### 12. Show sites whose public "exhibitor list" URL 404s — **blocked**
`asdmarketweek.com/exhibitor-list/`, `nynow.com/exhibitor-directory/`,
`toyfairny.com/exhibitor-list`, `globalpetexpo.org/exhibitor-list`,
`outdoorretailer.com/exhibitor-list/`. In every case the real directory is on the a2z or
MapYourShow subdomain, which is how §9–11 were found.

### 13. https://www.hardlinessupplierevent.com/en-us/exhibit-hall/exhibitor-list.html — **partial**
National Hardware Show. The list is client-side Algolia. The public search key
(`appId XD0U5M6Y4R`) is in the page, but the index name is not, `1/indexes` returns
`Method not allowed with this API key`, and five guessed index names all 404. Two attempts,
then stopped per BRIEF §4. Worth retrying with a browser dev-tools capture of the index name.

### 14. https://globalpetexpo27.mapyourshow.com/… — **partial**
`exhibitor-list.cfm` is a Vue shell; `ajax/remote-proxy.cfm?action=search&…` returns
`totalhits: 0` for every query shape tried (two attempts). **But**
`exhibitor-list.cfm?export=pdf` returns a real 10-page PDF listing ~400 exhibitors
(`gpe27.txt` in `raw/`). Not used for rows because the PDF carries only name + booth, no
country, and the list mixes US brands with Cambodian/Vietnamese/Chinese factories.
Reusable trick: **MapYourShow shows almost always expose `?export=pdf` even when the HTML is JS-only.**
`globalpetexpo26` and `tfny2026` (Toy Fair) redirect to their show homepages — **blocked**.

---

## C. US government records (end-customer) — the substitute for bill-of-lading data

### 15. https://www.saferproducts.gov/RestWebServices/Recall?format=json — public API — **worked, 575 rows**
CPSC's public recall API returns, per recall, an `Importers[]` array whose entries read
`"<Company>, of <City>, <State>"`, plus `ManufacturerCountries[]` and unit counts.
That is a *federal record naming a US company as importer of record, with the country of
manufacture attached* — exactly the ICP, and it is free where every commercial bill-of-lading
directory is paywalled.

```
for y in 2022 2023 2024; do
  curl -s "https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=$y-01-01&RecallDateEnd=$((y+1))-01-01" -o raw/cpsc_$y.json
done
curl -s "https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=2025-01-01" -o raw/cpsc.json
```
Yield: 1,739 recall records covering 2022-01-01 → 2026-09-03, 575 unique US importer companies,
**399 of them sourcing from China**. Each row's `source_url` is the individual cpsc.gov
recall page. 236 rows carry a website (192 printed on the notice itself in `ConsumerContact`,
the rest confirmed by `scripts/verify_site.py`).
Extend: pull 2015–2021 for roughly 3× the rows; `Manufacturers[]` and `Distributors[]` are
separate arrays that were deliberately **not** used (they are mostly foreign factories and
big-box retailers).

---

## D. Bill-of-lading / importer directories — almost entirely closed

| URL | status | note |
|---|---|---|
| importyeti.com | **blocked** | on the BRIEF §2.7 do-not-retry list; never fetched |
| portexaminer.com | **blocked** | DNS failure from this environment |
| usimportdata.com | **blocked** | `/us-importers-list` 404s; `/search-live-data` is a lead-capture form only |
| importinfo.com | **blocked** | `/companies` and `/company` return HTTP 401; the anti-bot page then demands a captcha |
| tradeatlas.com, seair.co.in, volza.com, zauba.com, exportgenius.in, datamyne.com | **blocked** | HTTP 403 |
| panjiva.com | **blocked** | homepage loads, all records behind a S&P login |
| tradeimex.in | **empty** | 1.6 MB marketing page, no records |

Two attempts each, then stopped. **This is the honest gap in the brief's first end-customer
segment** — see README Gaps. CPSC (§15) and the trade-show directories (§9–11) were used as
substitutes.

---

## E. Partner directories

### 16. https://www.ncbfaa.org/search-our-membership → https://members.ncbfaa.org/… — association-directory — **worked, 297 rows**
The NCBFAA public membership directory is a 4D application. The search page issues a session
ID into the form action; POSTing that form (no login, nothing written — treated as an API query,
see CLAUDE.md) returns a full HTML table of member companies per state.

```
python3 scripts/ncbfaa.py           # 51 state searches -> raw/ncbfaa_companies.json (1,241 unique companies)
N=320 python3 scripts/ncbfaa_detail.py   # detail pages -> website, phone, service codes
```
Yield: **1,241 unique member companies found**, 320 detail pages fetched (round-robin across
states so no state dominates), 287 with a website; 227 classify as customs brokers and 70 as
freight forwarders / NVOCCs in the CSV. One further member company was dropped because the
licence is listed under a person's name with no company name (BRIEF s2.1).
**Personal names removed:** every row on this directory carries "Primary Contact" and
"Secondary Contact" personal names. `scripts/ncbfaa.py` never stores them.
Extend: fetch the remaining ~920 detail pages; also `associate-member-search` covers
non-US brokers (out of ICP).

### 17. https://www.fulfill.com/top-3pl-companies — list article — **worked, 100 rows**
"Top 100 3PL Companies in the United States (2026)", each with founding year, warehouse count,
square footage and city list — good `size_signal` material. Parsed from the rendered text
(numbered blocks ending in "View Profile").
Extend: `fulfill.com/3pl/specialty/direct-to-consumer-dtc` is a narrower DTC-only cut.

### 18. https://mywifequitherjob.com/china-sourcing-agent/ — list article — **worked, 14 rows**
"Top 17 China Sourcing Agents And Service Companies – A Vetted List". Each named firm was then
opened once (`scripts/check_urls.py`); 11 resolved, 3 did not (202 challenge / HTTP 500) and are
recorded `unverified`.

### 19. https://www.ecomcrew.com/digital-freight-forwarding-companies/ — list article — **worked** (context only)
Used to frame the forwarder segment; the actual forwarder rows come from their own sites (§21).

### 20. 3PL directories that refused this agent — **blocked**
`warehousingandfulfillment.com/warehouse-directory/` 403 · `fulfillmentcompanies.net` 403 ·
`werc.org` 403 · `iwla.com/members/directory` 404. `3plfinder.com` loads (632 KB) and is the
best untried lead.

### 21. Named partner and competitor sites, opened once each — company-site
`scripts/check_urls.py raw/partner_urls.txt raw/partner_check.json` — 54 URLs, one request each,
recording HTTP status, `<title>`, the first contact/partner link and any generic mailbox.
50 returned 200. Failures logged on the row itself: `forceget.com`, `ship4wd.com`,
`foshansourcing.com`, `lincsourcing.com` HTTP 202 bot challenge; `meenogroup.com` HTTP 500;
`customs-co.com` HTTP 403.

### 22. https://gingercontrol.com/blog/trade-compliance-software-buyers-guide-2026 — list article — **worked, 10 competitor rows**
A competitor's own 2026 vendor comparison table — the cheapest complete map of the `excluded` set.

### 23. https://findcustomsbroker.com/brokers/service/hts-classification — **reachable, not mined**
150 KB, states it lists 46 brokers offering HTS classification. Best untried partner source.

### 24. https://www.cbp.gov/trade/programs-administration/customs-brokers/list-customs-brokers-port — **blocked**
HTTP 403 to this agent. NCBFAA (§16) covered the same population.

---

## F. Association member directories (channel) — public directories mostly do not exist

| URL | status | note |
|---|---|---|
| aafaglobal.org `/AAFA/AAFA_Members/Member_List.aspx` | **blocked** | renders an error page unless signed in |
| toyassociation.org member directory | **blocked** | every documented path 404s |
| outdoorindustry.org/members/ | **empty** | 589 KB, but it is a membership *sales* page — no member list |
| aaei.org/members | **empty** | a rotating "member of the week" spotlight, no directory |
| usfashionindustry.com/membership/member-directory | **blocked** | 404 |
| jpma.org/members | **blocked** | HTTP 403 Cloudflare |
| fjata.org/members | **blocked** | 404; member centre is login-gated |
| travel-goods.org / travelgoods.org | **blocked** | the TGA path 404s and `travelgoods.org` now serves an unrelated Shopify travel store |
| halloween-association.org, homefurnishings.org | **blocked** | DNS failure |

The associations themselves are recorded as `channel` rows (verified by opening the org site once).

---

## G. Channels that are blocked by policy

`reddit.com` and `facebook.com` are on the BRIEF §2.7 do-not-retry list and were **never
fetched**. The six subreddit and two Facebook-group rows carry name + public URL only, are
marked `unverified`, and each note says explicitly that the group's existence, size and
self-promotion rules were **not** verified.
`leanluxe.com` was opened once and now resolves to an unrelated parked/hijacked site — the row
records that and carries no website. `magicfashionevents.com` returns HTTP 403.

---

## H. Own-site verification pass (quality upgrade, not a new source)

`scripts/check_urls.py raw/site_urls.txt raw/site_check.json` — 1,403 distinct company domains
harvested from §9–11 and §15, each opened exactly once.

* 639 returned HTTP 200 with a real `<title>` → those rows are `confidence=verified` and 429 of
  them gained a real contact/partner page URL.
* **633 returned HTTP 403** — overwhelmingly Shopify / Cloudflare bot protection on DTC brand
  sites. Those rows stay `secondary` with the website as printed in the show directory.
* 62 DNS failures, 16 bot challenges, the rest assorted 4xx/5xx.

`scripts/verify_site.py` is the companion that *finds* a website from a company name: it tries
up to four obvious domain spellings and accepts one **only if the fetched page's title or body
actually contains the company name**, so no URL is ever guessed into the CSV. On the 126
aggregator brand names it confirmed 24; on the CPSC importers it confirmed 129 beyond the 192
already printed on the recall notices.
