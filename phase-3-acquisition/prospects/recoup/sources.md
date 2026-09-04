# Sources tried — recoup

Collected 2026-09-03. Every source is listed in the order it was tried, with the exact command or
query where the extraction was scripted. `rows` is the number of rows in `prospects.csv` that
trace back to that source after deduplication.

Two general notes:

- **Discovery** was done with the `WebSearch` tool. **Extraction** was always `curl -s -A "Mozilla/5.0 …"`
  followed by a python3 parse, never WebFetch — WebFetch summarises through a small model and drops
  rows from ranking tables.
- **Website confirmation** for every organisation ran through `scripts/verify_sites.py` →
  `scripts/strict_check.py` → `scripts/domain_sanity.py` (see the last section). A `website` is only
  filled in after a 200 response whose body actually names the organisation.

---

## 1. https://www.franchisetimes.com/franchise_top_400/
Guessed landing page for the Franchise Times rankings hub. **Status: blocked (404).**
Rows: 0. The rankings live under `/app/*.pdf` and under article URLs with hashed slugs; use WebSearch
to find the current slug rather than guessing paths.

## 2. https://www.multiunitfranchisee.com/
Multi-Unit Franchisee magazine home. **Status: empty.** Returns 200 with a 114-byte redirect shell.
Rows: 0. The magazine's editorial content is served from `franchising.com/multiunitfranchising/`.

## 3. https://www.franchisetimes.com/app/2025-Franchise-Times-Restaurant-200.pdf
Franchise Times *Restaurant 200*, August 2025 issue (FY2024 data): the 200 largest US restaurant
franchisees with HQ city/state, revenue and unit counts by brand. **Status: worked. Rows: ~200.**

```
curl -sL -m 60 -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
  -o raw/ft200-2025.pdf https://www.franchisetimes.com/app/2025-Franchise-Times-Restaurant-200.pdf
pip install pypdf cffi            # cffi is needed or pypdf's crypt provider panics
python3 -c "from pypdf import PdfReader; ..."   # dump per-page text to raw/ft200.txt
```

Parse (the working version is inlined in this session's history; the logic is): build a brand
vocabulary from every `^<number> <text>$` remainder that occurs 3+ times in the document, then
anchor each record on a `City, ST` line whose next line is a `$revenue` or `<n> <Brand>` line, walk
*backwards* for the company name until a line beginning with the rank number, and walk forwards for
the brand/unit pairs. 199/200 parsed; rank 42 (Redberry Restaurants, Mississauga, Ontario) has a
Canadian province instead of a two-letter state and was added by hand.

**How to extend:** the same `/app/` path holds `2024-Restaurant-200.pdf`, `2023 FT Restaurant 200-WEB.pdf`
and `2022 Franchise Times Restaurant 200-WEB.pdf` — three more years of operators, including
companies that have since dropped off the current list but still lease the same sites.

## 4. https://www.franchising.com/articles/20260228_2026_mega99rankings.html
Multi-Unit Franchisee *Mega 99* (2026): the 99 largest multi-unit franchisees by unit count, with
brands. **Status: worked. Rows: 99 (heavy overlap with source 3; merged).**

```
curl -sL -A "Mozilla/5.0 …" -o raw/mega99-2026.html <url>
# strip <script>/<style>, replace tags with newlines, then walk 4-line records:
#   rank / COMPANY / units / brand list
```
96 of 99 parsed on the first pass; ranks 45, 54 and 76 are formatted differently in the source table.

**How to extend:** `franchising.com/articles/` carries a Mega 99 for each prior year under a
`YYYYMMDD_` slug, plus `Multi-Unit 50` and `Multi-Brand 50`.

## 5. https://www.franchising.com/articles/20260606_2026_multibrand_50_scale_evolves_into_strategy.html
2026 *Multi-Brand 50* — the 50 largest multi-unit, multi-brand operators (FRANdata unit counts as of
late 2025). **Status: worked. Rows: 50, almost all merged into rows from sources 3 and 4.**
Parsed with the same rank/company/units walk.

## 6. https://www.cspdailynews.com/company-news/2025-top-202-convenience-stores  and
##    https://www.cspdailynews.com/top-202-convenience-stores-2025
CSP's *Top 202* US convenience-store chains by store count. **Status: blocked / partial.** The first
URL 404s; the second returns 200 but the ranking itself is subscriber-gated — only navigation
chrome renders. **Rows: 0.**
**How to extend:** this is the single highest-value unopened source for the c-store segment. A CSP
subscription would yield ~202 chains with store counts; ranks ~60–202 are exactly the 20–300 site
regional operators in the ICP.

## 7. https://gotu.com/dso-directory/
GoTu's directory of the largest US dental support organisations: name, HQ city/state, practice
count, state count, specialty mix. **Status: worked. Rows: 29.**

```
curl -sL -A "Mozilla/5.0 …" -o raw/gotu.html https://gotu.com/dso-directory/
# flatten to lines, then anchor on the literal line "practices":
#   name = L[k-4], location = L[k-3], blurb = L[k-2], count = L[k-1], states = L[k+1], specialty = L[k+3]
```
**How to extend:** the directory is a single page with no pagination; ADSO's own member list and
Group Dentistry Now's DSO lists would add the mid-size DSOs (20–100 practices) that GoTu omits.

## 8. https://www.beckersdental.com/dso-dpms/52-dsos-to-know-2026/
Becker's "52 DSOs to know: 2026". **Status: blocked (403).** Rows: 0. Worth retrying from a browser.

## 9. https://www.theadso.org/members/ , /membership/member-directory/ , /adso-members
Attempts at the ADSO member directory. **Status: blocked (301 to nothing / 404).** Rows: 0 from the
directory; ADSO itself is recorded as a partner row after `https://www.theadso.org` returned 200.
ADSO states it represents 80+ DSOs — that list would roughly triple the DSO segment.

## 10. https://www.jucm.com/2024-urgent-cares-top-100-by-number-of-locations/
*Journal of Urgent Care Medicine* 2024 Urgent Care Top 100 by number of locations (data from National
Urgent Care Realty and Experity), 105 operators. **Status: partial. Rows: 29.**

```
curl -sL -A "Mozilla/5.0 …" -o raw/jucm.html <url>
python3  # re.findall over <table>…</table>, then <tr>/<td> cells:
         # rank | corporate entity | total | health-system affiliated | leading brands
```
Only the first `<table>` (29 rows) renders for an unauthenticated request; the remaining ~76 sit
behind "Subscribe/Get Access". **How to extend:** a JUCM subscription; there is also a newer edition
each June.

## 11. https://urgentcareassociation.org/find-an-urgent-care/
UCA's clinic finder. **Status: blocked (404 on that path).** Rows: 0 (the association root returned
200 and is recorded as a partner row).

## 12. https://vetintegrations.com/insights/veterinary-consolidators/
VetIntegrations' table of North American veterinary consolidators: name, founded, hospital count.
December 2022 revision. **Status: worked. Rows: 48 (counts are dated — every row says so).**
```
python3  # single <table>; <tr>/<td> parse
```

## 13. https://transitionselite.com/veterinary-practice-consolidators/
Transitions Elite's 2026 veterinary consolidator directory. **Status: worked. Rows: 25**, merged with
source 12 for the current-name set.
```
python3  # re.findall(r'<h[23][^>]*>(.*?)</h[23]>') then keep headings matching ^\d+\.
```
**How to extend:** the same site publishes an "emerging consolidators 2026" page and an ownership map,
both of which name smaller groups (5–40 hospitals) that fit the ICP better than the mega-platforms.

## 14. https://www.carwashadvisory.com/top-car-wash-companies
Car Wash Advisory's continuously-updated ranking of US car-wash companies by site count, with HQ
state and founding year. **Status: worked. Rows: 99.**
```
python3  # flatten to lines; anchor on the literal "Sites":
         # name = L[k-1], sites = L[k+1], "Headquarters" = L[k+2], hq = L[k+3]
```
**How to extend:** the page tails off around 14 sites; it is refreshed continuously, so re-running it
quarterly picks up new roll-ups. Every row carries the caveat that many express washes own their
real estate.

## 15. https://www.carwash.com/the-2025-top-50-conveyor-carwash-chains/
Professional Carwash & Detailing Top 50. **Status: blocked (403).** Rows: 0.

## 16. https://www.insurancejournal.com/top-100-insurance-agencies/
Insurance Journal 2026 (22nd annual) Top 100 Independent Property/Casualty Agencies: rank, agency,
P&C revenue, other revenue, HQ office. **Status: worked. Rows: 100.**
```
python3  # flatten to lines; anchor on the literal "P\C Revenue":
         # rank = L[k-2], name = L[k-1], revenue = L[k+1], office = the line after "Office"
```
`.../top-100-insurance-agencies-2025/` returns the prior year in the same shape.
**How to extend:** Insurance Journal also publishes Top 50 Commercial Lines, Top 50 Personal Lines
and Top Agency Partnerships lists in the same format. Note ranks 1–20 are national brokers far above
the "2–20 producers, 15+ carrier appointments" ICP; the fit is in ranks 50–100.

## 17. https://en.wikipedia.org/wiki/List_of_convenience_stores
US section, organised by HQ state. **Status: worked. Rows: 76.**
```
python3  # slice between aria-labelledby="United_States" and aria-labelledby="Oceania",
         # split on <h5 id="STATE">, take the first /wiki/ anchor of each <li>
```
No store counts — the size_signal is empty for these rows, per the "never estimate a number into a
structured field" rule. **How to extend:** pair with CSP's Top 202 (source 6) to attach counts.

## 18. https://en.wikipedia.org/wiki/Lease_audit
Background on the lease-audit category and its contingency-fee norm. **Status: worked, 0 rows** —
the article names no firms.

## 19. https://visuallease.com/vl-marketplace/partners/ (pages 1–10)
Visual Lease's partner marketplace: lease-administration service providers, tenant-rep brokerages
and accounting firms that implement lease systems for multi-site tenants.
**Status: worked. Rows: 40 partner rows (some merged).**
```
for p in 1 2 3 4 5 6 7 8 9 10; do
  curl -sL -A "Mozilla/5.0 …" -o raw/vl_p$p.html \
    "https://visuallease.com/vl-marketplace/partners/page/$p/"
done
python3  # re.finditer(r'<a href="https://visuallease.com/vl-marketplace/partners/([^"#]+)/"[^>]*>(.*?)</a>')
```
**How to extend:** each partner has its own detail page under the same path with a description and a
category tag; Leasecake, Occupier and FinQuery all run comparable partner directories.

## 20. https://www.leasecake.com/partners
Leasecake partner page. **Status: empty.** 200, 1.3 MB, but the partner list is not in the HTML.
Rows: 0.

## 21. https://softwareconnect.com/roundups/best-lease-management-software/
Roundup of lease management platforms. **Status: worked, used for vendor names only.**
```
python3  # re.findall(r'<h[23][^>]*>(.*?)</h[23]>') -> "Visual Lease - Best for…", etc.
```
Every named vendor was then verified against its own site before becoming a row.

## 22. https://www.mediajel.com/blogs/top-10-cannabis-dispensary-chains
Names the largest US dispensary chains. **Status: worked, names only. Rows: 9** (only the chains
whose own website could be confirmed became rows).
```
python3  # re.findall(r'<h[23][^>]*>(.*?)</h[23]>')
```

## 23. https://winnie.com/resources/the-biggest-childcare-brands-in-the-united-states
## 24. https://hub.exchangepress.com/wp-content/uploads/2024/09/5020969.pdf
Child-care chain rankings (Exchange's *Top 50 for-profit child care organisations* is the canonical
list). **Status: both blocked (403).** Rows: 0 from these; the 12 childcare rows in the file come
from company-site verification instead and carry no centre counts.

## 25. https://www.fitnessnav.com/en/top-fitness-franchisees-ranking-strategy-analysis
2026 Top 25 Fitness Franchisees with club counts. **Status: blocked (403, Cloudflare interstitial).**
Rows: 0.

## 26. https://www.franchisetimes.com/fitness-finance/new-franchise-times-ranking-lists-the-largest-fitness-operators/…
Franchise Times' first Top Fitness Franchisees ranking (25 operators, 2,100+ gyms).
**Status: partial — article body paywalled;** only four operator names survive in image captions
(Excel Fitness, Aligned Fitness, Omega Fitness, CR Fitness Holdings). Rows: those names were
verified against their own sites and became fitness rows.

## 27. https://athletechnews.com/americas-biggest-gym-brands-by-location-count-wefranch/
## 28. https://www.withorbital.com/data/largest-fitness-chains-in-the-us/ (and the urgent-care and
##     dental equivalents)
Both fetched successfully but rank **brands**, not the franchisee companies that hold the leases.
**Status: worked, 0 rows** — brand-level rows would misrepresent who receives the CAM statement.

## 29. Bing via `curl "https://www.bing.com/search?q=…"`
Attempted as a bulk discovery channel. **Status: blocked/unusable.** Returns a JS shell whose only
`<cite>` elements are unrelated cached results. Rows: 0. Use the `WebSearch` tool instead.

## 30. reddit.com, facebook.com, linkedin.com
Named in the app brief as channel sources. **Status: not attempted / blocked per the fleet brief.**
Rows: 0. Naming a subreddit or a Facebook group without opening it would break "no source, no row",
so none were recorded. See the README **Gaps** section.

---

## 31. Website confirmation pipeline (the source behind every `company-site` row)

Three scripts in `scripts/`, run over ~880 organisation names in four batches:

```
python3 scripts/verify_sites.py --in raw/allnames.txt  --workers 14 > raw/sites_restaurant.tsv
awk -F'\t' '$2!=""' raw/sites_restaurant.tsv > raw/sites_r_cand.tsv
python3 scripts/strict_check.py  --in raw/sites_r_cand.tsv --workers 14 > raw/sites_r_final.tsv
python3 scripts/domain_sanity.py raw/sites_r_final.tsv          # writes raw/sites_r_clean.tsv
```

- `verify_sites.py` generates up to nine candidate domains per name (full name, name minus legal and
  generic words, first two core words, hyphenated, × .com/.net/.org), fetches each over HTTPS and
  keeps the first whose body contains the organisation name.
- `strict_check.py` re-fetches the survivor and rejects parked pages, "domain for sale" pages,
  near-empty placeholders and same-industry lookalikes; on success it extracts a `/contact` link or
  a generic role mailbox (info@, sales@, partners@ …), never a personal one.
- `domain_sanity.py` drops any survivor whose host does not carry the organisation's leading word or
  its initials — this is what caught *Heartland Dental → leavenworthfamilydental.com* and
  *Road Ranger → gibbstrucktransmissions.com.au*.

Yield: **497 of 820 organisations confirmed** (about 61%), 401 of them with a business contact URL
or generic mailbox. A search API instead of domain guessing would push this close to 100%.

Additionally `raw/known_cand.tsv` and `raw/known2_cand.tsv` hold hand-supplied candidate domains for
organisations whose domain the generator could not guess (associations, trade titles, competitor
firms); those were passed through `strict_check.py` on the same terms — a domain still had to answer
200 and name the organisation before it became a row.

Consistently unreachable by curl even though the sites are live in a browser: cbre.com, colliers.com,
nmrk.com, srsre.com, citrincooperman.com, qsrmagazine.com, clubindustry.com, csnews.com,
ddifo.org, dfaonline.org. Those organisations are still in the file where a list source vouches for
them, with an empty `website` and `confidence=secondary`.
