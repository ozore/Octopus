# ScopeIQ — sources tried, in the order tried

App: **scopeiq**. Collected **2026-09-03**. Everything below was run from this environment with
`curl -s -A "Mozilla/5.0 …"` (via `scripts/fetch.py` / `scripts/fetch_sites.py`) or the WebSearch tool.
Nothing was submitted, logged into or paid for.

Row counts are rows that survived into `prospects.csv` after dedupe.

---

## 1. `phase-1-ideation/shortlist.json` and `raw-ideas.json` (ScopeIQ entries)
Local repo files, read first to fix the ICP and the price points.
**Status:** worked. **Rows:** 0 directly; supplied the excluded-competitor seeds (AmSpa, ByrdAdatto,
medspastandards.com, Holland & Knight, Brewster Law) and the pricing frame.

## 2. yellowpages.com — `/<city-state>/medical-spas`
The single highest-yield source in this file.
**Status:** worked. **Rows: 554** (single-location med spas).
```
python3 phase-3-acquisition/prospects/scopeiq/scripts/yp_harvest.py
```
91 metros x 2 pages = 5,147 listings, 5,002 after dedupe, 3,142+ with a real own-domain website.
Each `<div class="result">` block yields name, street, `locality` (city + state + ZIP — the *actual*
city, not the search metro), own website, category and a "From Business" snippet.
Two passes: 67 metros chosen for CPOM-relevant states, then 24 more metros chosen purely to widen
state coverage (AK, AR, DE, HI, IA, ID, KS, KY, ME, MS, MT, ND, NE, NH, NM, RI, SC, SD, VT, WV, WY, AL).
**How to extend:** pages 3–5 exist for every metro and the same parser handles them
(`PAGES = 2` in `yp_harvest.py`). Adjacent unmined categories: `weight-control-services`,
`physicians-surgeons-cosmetic-surgery`, `skin-care`, `day-spas`.

## 3. Each med spa's own homepage (verification pass)
**Status:** worked. This is what turns a directory listing into a `verified` row.
```
python3 phase-3-acquisition/prospects/scopeiq/scripts/fetch_sites.py <urls.tsv> <outdir>   # 14 threads, 20s timeout
python3 phase-3-acquisition/prospects/scopeiq/scripts/verify_spas.py <selected.json> <sites_dir> <out.json>
```
Pass 1: 525 homepages fetched, 401 HTTP 200, **378 confirmed** by at least one aesthetic-medicine
keyword (botox / dysport / filler / laser hair removal / semaglutide / IV therapy / med spa / …).
Pass 2: 262 homepages fetched, 210 HTTP 200, **193 confirmed**.
Rejects: 84 "no aesthetic keyword" (mis-categorised nail/hair/gym listings), 69 pages too small to
parse, 59 connection failures, a handful of 403/404. The same pass harvests the procedure list into
`notes` (ScopeIQ's literal input) and a same-host contact page.
**How to extend:** the selector caps each metro at 9 (pass 1) or 12 (pass 2) candidates; raising the
cap and re-running would roughly triple the med spa rows.

## 4. americanmedspa.org — vendor directory
`https://www.americanmedspa.org/vendor-directory/`
**Status:** worked. **Rows: ~50 partner rows** (some already present from company sites).
55 vetted vendor affiliates parsed out of `<div class="amspa-vg-card">` blocks: name, tier
(platinum/gold/silver), external website, AmSpa category list and member benefit. Highest-quality
partner source found — every entry is an organisation AmSpa itself has vetted as selling into med spas.
**How to extend:** the page also carries 30 category filters; each vendor has a `data-vendor-id`
that drives a "Learn More" modal not fetched here.

## 5. americanmedspa.org — state chapters
`https://www.americanmedspa.org/state-chapters/`
**Status:** worked. **Rows: 9** (channel). Nine active chapters (AZ, CA, CO, FL, GA, NJ, TN, TX, UT),
each organised around state scope-of-practice legislation. Chapter leadership is listed by personal
name on the page and was deliberately **not** recorded (BRIEF §2.1).

## 6. americanmedspa.org — news articles
`/news/med-spa-ma-and-private-sales-a-look-back-at-2025-and-what-lies-ahead/`,
`/news/private-equity-and-growth-capital-medical-aesthetics-new-reality/`,
`/news/orangetwist-accelerates-growth-with-acquisition-of-two-skin-body-soul-locations/`,
`/news/community-over-competition/`
**Status:** worked. **Rows: ~5** plus corroboration for platform rows and the AmSpa Facebook community row.

## 7. Platform / franchisor / chain company sites and `/locations` pages
**Status:** worked. **Rows: ~60** (platforms, franchisors, IV and GLP-1 chains, portfolio med spas).
Fetched in five batches (URL lists preserved as `data/orgs*_urls.tsv`, `data/retry_urls.tsv`,
`data/lists*_urls.tsv`; the 382 MB HTML cache was deleted after collection) via
`scripts/fetch_sites.py`; state counts computed with `scripts/loc_stats.py`, which counts state names
and `, XX 12345` patterns in the stripped text of a locations page.
Confirmed size signals came straight off the companies' own pages, e.g.
LaserAway 240 location URLs / 37 states, Sono Bello "over 100 locations" / 42 states,
Milan Laser "over 400+ locations in 38 states", Prime IV 39 states, Medi-Weightloss 33 states,
AMP "20+ brands, 77 locations, 21 states", Empower Aesthetics "12 Partners, 20 Locations",
Skin Clique "763 providers, 40 states", Restore "210+ studios", FACE FOUNDRIÉ "80+ locations".
**How to extend:** several locations pages are JS-rendered (Milan, Skin Laundry, Ideal Image,
4Ever Young detail pages) and would need a headless browser.

## 8. withorbital.com — `data/largest-aesthetic-clinic-chains-in-the-us/` and `blog/top-10-us-medspa-conferences-2026`
**Status:** worked. **Rows: 17.** A June 2026 snapshot of the US aesthetic-clinic universe (11,400
clinics; top-10 chain table with owner/model and US site counts) and a 2026 conference calendar with
dates, cities and attendee counts. Used as a secondary source where a company's own page was
unreachable (Ideal Image, Skin Laundry, SEV Laser counts) and as the source for 10 event rows.
Orbital itself is recorded as a partner (data vendor).

## 9. beautymatter.com — "From Injectables to Drip Therapy: Top Medspa Franchises" (Mar 2026)
**Status:** worked. **Rows: 5–9.** Franchise-by-franchise unit counts, franchise fees and service
menus for VIO, GLO30, dermani, Serotonin Centers, Alexis Lauren, 4Ever Young, Facial Mania,
Liquivida, C3 Wellness Spa, Face to Face Spa.

## 10. 1851franchise.com, fransmart.com, topfranchise.com, vettedbiz.com, portraitcare.com, workee.ai
Franchise trade lists.
**Status:** worked (vetmyfranchise.com 403). **Rows: ~6.** Used for IV therapy franchise names
(Onus, Prime IV, Vida-Flo, Liquivida, The DRIPBaR, Hydrate IV Bar) and beauty/spa franchise brands
(Skinovatio, LIVE Hydration Spa, Pause, Face Foundrié, Heights Wellness Retreat).
topfranchise.com's ranking is stale (2021 data, "updated 2026") and mixes day spas in — used sparingly.

## 11. ctacquisitions.com — "Med Spa and Medical Aesthetic M&A Multiples Report 2026"
`https://ctacquisitions.com/guides/med-spa-ma-multiples-2026/`
**Status:** worked. **Rows: 0 directly**, but the highest-value *context* source found: names every
active PE sponsor and platform pairing, and states the two CPOM changes that drive ScopeIQ's pitch
(California SB 351 signed 6 Oct 2025, effective 1 Jan 2026; Oregon SB 951 effective 9 Jun 2025 with
a private right of action). Also the AmSpa 2024 census figure of 10,488 US med spas.

## 12. joinblvd.com "Top 8 medspa shows of 2026" and getweave.com conference list
**Status:** worked. **Rows: 4** (SCALE, Aesthetic Extender Symposium, ISPAN Annual Meeting,
AmSpa Medical Spa Boot Camps, plus 2026 dates for others).

## 13. podcast.feedspot.com/aesthetics_podcasts/ and podcasts.apple.com
**Status:** worked. **Rows: 16** (podcast channel rows). Show names only — every host is a private
individual and none is recorded; feedspot also exposes host mailboxes, which were not used.

## 14. socialmediamedspa.com and theaestheticvault.com
**Status:** worked. **Rows: 2** (paid private communities of med spa owners and injectors;
"1,400+ Medspas and Aesthetic Professionals" and a $64/month content club). Member areas are behind
a login and were not entered.

## 15. WebSearch (discovery only)
**Status:** worked throughout. Used to find platform names, sponsor pairings, correct company URLs
(empower.spa, weramp.com, partnerwithalpha.com, onusiv.com) and franchise counts. Never used as a
row's only source unless the row says so in `notes`.

---

# Blocked, empty or wrong-shaped sources

| Source | URL tried | Status | Note |
|---|---|---|---|
| RealSelf provider directory | `realself.com/find/Texas/Dallas` | **blocked (403)** | Bot wall. Was the app brief's suggested directory. |
| Zocdoc | `zocdoc.com/search?address=Dallas,%20TX` | **blocked (403)** | |
| Healthgrades med spa directory | `healthgrades.com/medical-spa-directory` | **empty (410)** | Directory retired. |
| ThreeBestRated | `threebestrated.com/med-spas-in-dallas-tx` (+ `-us` variant) | **empty (410)** | Every city URL returns 410 with a full error page. |
| Expertise.com | `/tx/dallas/med-spa`, `/…/medical-spa`, `/…/medical-spas`, `/us/dallas-tx/med-spa` | **empty (404)** | No med spa vertical exists; domain-restricted WebSearch shows only legal/home/insurance verticals. |
| AmSpa "find a medical spa" | `americanmedspa.org/page/find-a-medical-spa` | **empty (404)** | AmSpa publishes no public med spa directory; its member directory is behind a login and was not attempted (read-only rule). |
| Galderma ASPIRE locator | `aspirerewards.com/find-a-provider` | **empty (404)** | JS locator, as the app brief warned. |
| Merz "find a provider" | `merzaesthetics.com/find-a-provider/` | **empty (404)** | JS locator. |
| Allergan "find a provider" | not attempted | skipped | App brief said skip if JS-heavy. |
| yelp.com, reddit.com, facebook.com | — | **blocked (BRIEF §2.7)** | Facebook med spa owner groups and r/medspa could therefore not be confirmed; see README Gaps. |
| Ideal Image | `idealimage.com`, `idealimage.com/locations` | **failed (no response, 2 attempts)** | Row kept with `website` empty and a secondary source. |
| Moxie | `moxie.md`, `www.moxie.md`, `moxie.md/about` | **failed (no response, 3 attempts)** | Row kept from the AmSpa vendor directory with `website` empty. |
| Lengea Law | `lengea.com`, `www.lengea.com`, `/med-spa-law` | **failed (no response)** | Excluded-competitor row kept with `website` empty. |
| Skin Pharm, Peachy, NakedMD, Alexis Lauren, Alastin, Lineage Biomedical, Environ Dermaconcepts, Designed by Stax, IVX Health, OVME, Mint + Needle | various | **blocked (403)** | Cloudflare/bot walls. Rows kept only where a second source names them; `website` left empty. |
| The DRIPBaR, Hydrate IV Bar, Nelson Hardiman, Chelle Law, Facial Mania, ValueCap, AMP homepage (first attempt) | various | **HTTP 202 interstitial** | Bot-check page, no content. |
| vida-flo.com, blushmed.com, curatemedaesthetics.com, inbloomhealth.com, alluradermmedspa.com, prevamedspa.com, lexrx.com, nourishingskinandwellness.com, zealthy.com, medvi.com, resetiv.com | various | **failed / parked** | `inbloomhealth.com` now resolves to HugeDomains (parked). |
| bbb.org search | `bbb.org/search?find_text=med+spa&find_loc=Dallas,TX` | fetched, unused | Returns accredited-business listings; not mined this pass — a real extension option. |
| bizquest.com | seen via WebSearch | not mined | Med spa businesses *for sale*, incl. "5-location med spa in NJ and CT" — a route to multi-location groups a future agent could mine. |
