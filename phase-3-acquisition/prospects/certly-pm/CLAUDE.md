# Certly — property managers (certly-pm): agent memory

Scope: Certly (AI COI-compliance clerk) prospect research, **property-manager side only**.
Sibling agent owns `certly-gc/` (general contractors) — never write there.

## Rules confirmed (constraint -> the case that triggered it)

- **No private individuals.** CAI chapter directories (cai-sd.org, caihouston.org, members.cai-nc.org)
  publish a named contact person and that person's work mailbox for every management company
  (`geremy@360hoa.com`, `stacy@athenamgmt.com`). Company name + company website were kept; the
  person's name, their mailbox and their direct phone were dropped from every row.
- **contact_route = generic business route only.** Because CAI/BBB rows only expose a named person's
  mailbox, `contact_route` for those rows is the company's own `/contact` page (found by fetching the
  company site) or is left empty. No `@gmail`-class mailboxes appear anywhere.
- **No estimate in a structured field.** communitypay.us publishes a portfolio count per HOA management
  company; that exact integer went into `size_signal` verbatim ("163 HOAs under management" style).
  mobilehomeuniversity.com marks some rows "5100 est." — those rows keep the word `est.` inside
  `size_signal` and repeat the caveat in `notes`, or the field is left empty.
- **No source, no row.** Every row carries the exact directory page / API URL that produced it.
- **Read only.** No form was submitted, no login attempted. Directories that require a member login
  (BOMA/GLA) were logged as blocked, not worked around.

## What worked (with yields)

| source | how | rows |
|---|---|---|
| expertise.com `/business/property-management/<state>/<city>` | `curl -sL` + regex on `provider_website` / `provider_address` | 784 raw, 723 unique firms, 61 metros — the single biggest source; only 299 used (cap 5/metro) |
| hoamanagement.com `/state/<state>/` + `/association-management-company/<slug>/` | state page for the listing, detail page for the firm's own website | 139 HOA firms w/ website |
| communitypay.us `/management-companies/state/<state>/` | one HTML table per state: city, company, **portfolio (# HOAs)** | 8 states, best `size_signal` source in the whole file |
| sitelink.com `/marketplace/management-companies` | list page + detail page; site link is behind `/marketplace/click/<id>`, resolve with `curl -sIL -w %{url_effective}` | 55 self-storage management firms w/ website |
| members.cai-nc.org GrowthZone directory | `?` category page, parse `gz-directory-card` blocks | 45 community-management firms |
| cai-sd.org (Glue Up) | parse `glue-up-partner-card` anchors | 17 firms w/ website |
| mobilehomeuniversity.com MHU Top 100 | `<tr><td>rank</td><td>name</td><td>lots</td>` | 100 MH community owners w/ lot counts |
| bbb.org `/search?find_text=...&find_loc=...` | JSON embedded in HTML: `"businessName"`, `"reportUrl"`, `"addressLocality"` | 15/page, 25 metros x 2 pages |
| jturnerresearch.com student-housing ORA ranking | plain table, mirrors the Student Housing Business Top 25 | 25 operators |

Parsing note: every one of these pages ships the whole list in **one HTML line**, so `grep -c` under-counts.
Use `grep -o <pattern> | wc -l`.

## Final shape (2026-09-03)

1,101 rows: 977 end-customer, 71 partner, 37 channel, 16 excluded. 364 verified / 737 secondary /
0 unverified. 40 states + DC, 61 residential metros. `scripts/build_csv.py` regenerates the whole
CSV from `raw/`.

**`raw/` was pruned before finishing.** The bulky HTML caches (`raw/sites`, `raw/expertise`,
`raw/hoamgmt`, `raw/bbb`, `raw/storage/co`, `raw/comm` — ~147 MB) were deleted to keep the repo small;
the `fetch_*.py` scripts re-download them on demand. What is retained is everything `build_csv.py`
actually reads: the parsed TSV/JSON intermediates plus `raw/cai/`, `raw/hoa/cp_<state>.html`,
`raw/mh/`, `raw/students/`, `raw/narpm/`.

## What failed

- `narpm.org` — **the fleet brief is wrong about this one.** With
  `curl -sL -A '<Chrome UA>' --compressed` it returns 200 and full HTML. What actually fails is
  narrower: `/chapters/` renders its chapter list client-side with no JSON endpoint in the page, and
  `/find/crmc/` returns a PNG rather than the CRMC company list. Tell the next agent: narpm.org is
  readable, its two best lists are not.
- `caionline.org` (chapter finder, professional-services directory) — **403** to curl.
- `irem.org` chapter AMO directories (`iremsf.org`, `iremmn.org`, `iremga.org`, `iremsanantonio.org`)
  — **403** to curl *and* to WebFetch. Human/browser access would unlock ~500 AMO firms.
- `caioc.org` — connection refused (curl exit 000) twice.
- `bomagla.org` member directory — behind a member login. `bomaseattle.org` 403.
- `insideselfstorage.com` Top-Operators pages — the ranking itself is a paid download; the free page is
  navigation only.
- `propertymanagement.com/property-management/<state>/<city>` — 404 (URL pattern changed); its
  `sitemap.xml` does expose `/api/sitemap/property-managers`, unmined.
- `allpropertymanagement.com/property-managers/<st>/<city>/` — 404 to every pattern tried.
- Bing via curl returned degraded results (it ignored quoted phrases and returned unrelated brands),
  so it is **not** usable for resolving a company name to its website. The WebSearch tool works.

## Mistakes I made

- First `nohup python3 <relative path>` inherited the `cd` from earlier in the same bash line and
  resolved the script path twice; use absolute paths for backgrounded scripts.
- First website extraction for sitelink.com grabbed the first non-self link on the page, which was a
  *different* management company in the "Other Management Companies" sidebar. Fixed by following the
  explicit `/marketplace/click/<id>` redirect instead.
- Assumed expertise.com had `hoa-management` and `commercial-property-management` categories; only
  `property-management` exists (everything else 404s).
- Took a homepage stat block at face value: branch sites of HomeRiver print the brand's national
  "40,000+ properties", which I first recorded as the local office's portfolio. Every size_signal
  taken from a company homepage now carries a caveat in `notes`.
- Set `location` for self-storage rows by regex on SiteLink's HQ string, which produced
  "W. Little Creek Road Norfolk, VA". SiteLink prints no comma between street and city, so `location`
  now holds the state only and the full published HQ line goes in `notes`.
- Nearly recorded `uaahq.org` as the Utah Apartment Association; that domain now serves online-casino
  content. Always read the `<title>` you fetched before trusting a remembered URL.

## Assumptions taken without confirmation

- Firms that appear in an expertise.com "best property management companies" city list are treated as
  small/mid third-party managers (the ICP) unless the row is a national platform brand
  (Ziprent, Hemlane, Doorstead, Belong, Darwin, Flat Fee Landlord) — those are excluded from the
  end-customer count and handled as partners/competitors instead.
- Software vendors that sell their own vendor-credentialing/COI product (RealPage's Compliance Depot,
  Yardi's VendorShield/VendorCafe, NetVendor) are `excluded`, not `partner`. Every other PM software
  vendor is `partner` with a note saying no COI module was found.
- Student-housing and NMHC-ranked operators sit far above the 50-500-unit ICP; they are included with
  the size caveat written into `notes` rather than silently dropped.

### The provenance rule bit me once

I first wrote the Reddit/Facebook community rows straight from memory with `source_url=narpm.org`,
which is fabricated provenance even though the communities are real. Fixed by fetching
`https://www.secondnature.com/blog/best-property-management-forums`, a round-up that names each group
and its member count, and sourcing the rows to that. **If a row's source_url is not the page the row
actually came from, the row is not sourced.**

## Advice to the next agent

1. Start from `raw/expertise_providers.tsv` (723 unique firms, only ~300 used) — the rest are already
   collected and just need probing. `scripts/probe_sites.py <in.tsv> <out.tsv>` does that.
2. The highest-value unmined source is `propertymanagement.com/api/sitemap/property-managers`; second
   is expertise.com for the ~150 US cities not in `scripts/fetch_expertise.py`'s CITIES list.
3. IREM AMO and CAI's national directory are the two sources that would most improve *commercial* and
   *HOA* coverage, and both need a real browser session — worth asking the founder to pull them.
   The commercial segment is the weak one: BBB's search index is readable but its profile pages are
   403, so all 178 commercial rows are name + city with no website.
4. Do not spend time on Bing-via-curl; use the WebSearch tool for discovery and curl only for pages
   whose URL you already know.

## Orchestrator post-delivery edits (2026-09-03)
- Merged two "Home365" rows found in two directories (same website). Lesson: run the final name+website dedupe after the last append, not before; the last source added re-introduced a row already present.
