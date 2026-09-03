# sources.md — clausewright prospect research

Every source tried, in the order tried, on **2026-09-03**. Commands are reproducible from the
repository root. `$UA` throughout is
`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36`.
`raw/` holds the **parsed** artifacts (JSON/TSV) that the two scripts in `scripts/` turn into
`prospects.csv`. The ~390 MB of downloaded HTML those parsers ran over was deleted after extraction
rather than committed; every command needed to re-fetch it is below, so the chain is reproducible.

Nothing here was accessed behind a login, no form was submitted, and no paid API was called.

---

## 1. `phase-3-acquisition/crm/partners.csv` and `channels.csv` — **worked** (0 new rows, by design)

Read first. 60 partner rows (44 partners + 16 competitor exclusions) and 15 channel rows. Every
organisation in them is suppressed from `prospects.csv` by the `CRM_PARTNERS` / `CRM_CHANNELS` /
`CRM_EXCLUDED` name lists in `scripts/build_prospects.py`, matched on a punctuation- and
suffix-stripped normalisation of the name. The 16 exclusions are treated as permanent: any
organisation matching them is dropped rather than re-listed.

*Extend by:* re-running the build after the CRM changes; the suppression lists are the only place
that needs editing.

---

## 2. `https://marketplace.walmart.com/solution-providers/` — **blocked (client-side)**, then
## `https://marketplace.walmart.com/page-sitemap.xml` — **worked, 369 rows** (highest yield)

The public Solution Provider Hub renders its listing in the browser; `curl` returns the shell with
zero provider links (`grep -c 'solution-provider' walmart_sp.html` → 0 useful matches). The Yoast
sitemap exposes every per-provider page instead.

```
curl -s -A "$UA" -m 30 https://marketplace.walmart.com/sitemap_index.xml
curl -s -A "$UA" -m 40 https://marketplace.walmart.com/page-sitemap.xml -o raw/wm_page_sitemap.xml
# 565 URLs, 381 of them under /solution-providers-old/ ; 379 unique slugs
cat raw/wm_urls.txt | xargs -P 10 -I{} sh -c 'slug=...; curl -s -A "$UA" -L -m 30 -o "raw/wmsp/$slug.html" "{}"'
```

Parsed with `raw/`-local python (regex over `<title>`, the `Category` / `Services*` label blocks and
the first outbound link) into `raw/wm_providers.json`: name, Walmart category, Walmart's own service
list, Walmart's directory blurb, and the provider's own Walmart-seller landing URL.

Each provider's own domain was then fetched to (a) confirm it is live and (b) find a business
contact route:

```
cat raw/vend_urls.txt | xargs -P 12 -I{} sh -c 'curl -s -A "$UA" -L -m 25 --max-filesize 3000000 \
  -o "raw/vend/$slug.html" -w "$slug\t%{http_code}\t%{url_effective}\n" "$url"'   # -> raw/vend_status.tsv
```

330/374 returned HTTP 200 → `confidence=verified`. 280 yielded a contact/partner page or a generic
mailbox. Six providers were re-classified to `excluded` because their own homepage sells
reinstatement work (see §12).

*Extend by:* re-pulling `page-sitemap.xml` (Walmart adds providers continuously); the same script
handles new slugs with no change. Walmart also publishes a `post-sitemap.xml` that was not mined.

---

## 3. `https://prepcentersearch.com/` — **worked, 312 rows**

Next.js app; the whole directory ships inside the RSC payload.

```
curl -s -A "$UA" -L -m 40 https://prepcentersearch.com/ -o raw/pcs.html
# join every self.__next_f.push([1,"..."]) chunk, unicode_escape-decode, then brace-match every
# object that starts {"id":"<uuid>","name":" -> 317 records
```

Each record carries `name`, `website_url`, `location`, `state`, `country`, `services_offered`,
`channels_supported`, `warehouse_size_sqft`, `monthly_capacity_units`, `description`, `verified`.
The payload also contains `email`, `phone` and a `claimed_by` user id: **none of those three fields
were written into `prospects.csv`** (BRIEF §2.1/§2.2 — a prep centre's mailbox is frequently a
personal one and `claimed_by` is a person).

306 unique domains were then fetched for verification and contact-route extraction (255 × HTTP 200).

*Extend by:* the same payload holds pricing tiers and per-service rates that were not used; the
directory also has country filters for Canada/UK if the product ever covers Amazon.ca/.co.uk.

---

## 4. `https://www.marketplacepulse.com/aggregators` — **worked, 70 rows**

```
curl -s -A "$UA" -L -m 40 https://www.marketplacepulse.com/aggregators -o raw/mp_aggregators.html
```

Two structures on one page: a `<table>` of 46 funded aggregators (company, HQ, capital raised) and a
grid of `<div class="stats-col">` blocks covering all 72 active aggregators (company, HQ, own URL).
Merged on name → 73 organisations; 3 (Thrasio, SellerX, Razor Group) are already in `crm/`.

Each aggregator's own domain was fetched (60/73 × HTTP 200). **A non-200 is recorded in `notes` as
"operating status unconfirmed"** rather than silently dropped — several 2021-vintage aggregators have
wound down, and that is itself a finding for this segment.

*Extend by:* Marketplace Pulse also publishes an acquisitions feed and a Seller Index; neither was
mined here.

---

## 5. `https://selleressentials.com/amazon-fba-prep-services/` — **worked, 23 new rows**

30 prep centres parsed out of the `post-card` grid (`alt=` for the name, the `Location:` paragraph,
the popover `data-content` for the blurb). 23 survived de-duplication against §3.

*Extend by:* the page has a "load more" control that was not exercised; `?load=all` returned the same
30 cards.

---

## 6. `https://fbaprepfinder.com/best-fba-prep-centers/` — **partial, 33 new rows**

The "At a glance" `<table>` gives 93 editorially verified prep centres with rank, name, metro and a
verification date, backed by a published ledger of 2,918 checks since 2026-05-13. **The directory
deliberately publishes no outbound links** (it runs a matching model), so these rows carry
`website=""` and a note saying so, per BRIEF §2.4. First fetch with a Chrome UA returned `000`; a
Safari UA succeeded — worth remembering.

*Extend by:* the same site has a UK ranking and a tax-free-states page.

---

## 7. `https://revenuegeeks.com/research/amazon-seller-facebook-groups` — **worked, 80 rows**

A 340-row `lexical-table` of Facebook groups with a member snapshot, a "best for" label and the group
URL. Filtered to (a) every group labelled *Suspensions and account health* regardless of size and
(b) English-language groups at ≥10,000 members. Non-English group names were dropped (a
German/Italian/Arabic/Urdu marker list), and any trailing "by <person>" credit is stripped from the
name before it is written (BRIEF §2.1).

**facebook.com is blocked from this environment (BRIEF §2.7), so no group page was opened and no
group's self-promotion rules were read.** Every row says so and is `confidence=secondary`; per
`crm/CRM.md` §3.2 the default posture for an unverified channel is *reply-only, no link*.

*Extend by:* the remaining ~260 rows (sub-10k and non-English) are in `raw/fb_groups.json` if the
product ever goes multi-locale.

---

## 8. `https://podcast.feedspot.com/amazon_seller_podcasts/` — **worked, 51 rows**

53 shows in `class="trow trow-wrap"` blocks: show name (`img alt`), show website (`id="swb-…"`),
Apple listing, Apple rating and review count, estimated monthly listeners, producer/network.

**Two fields were deliberately discarded: `Host` and the masked `****@…` mailbox** the directory
offers behind a signup (BRIEF §2.1/§2.2). Where the "producer/network" value was itself a person's
name it was blanked; a trailing `with <Firstname> <Lastname>` host credit is stripped from the show
name (so *Your Selling Podcast with …* is stored as *Your Selling Podcast*), while a corporate credit
(*Better Advertising with BTR Media*) is kept.

One show, *Seller Performance Solutions*, is produced by a consultancy already excluded in `crm/` and
is therefore recorded as `excluded`, not as a channel.

*Extend by:* Feedspot has parallel lists for Walmart-seller and ecommerce podcasts.

---

## 9. `https://bloggers.feedspot.com/amazon_seller_blogs/` — **worked, 81 rows**

100 blogs with website and Domain Authority. Names come from the `feed_heading` `<h3>`s (the `img
alt` is empty on all but the first card). One entry published under a private individual's own name
was dropped. Feedspot's typo "Jump Scout" was corrected to Jungle Scout's resources hub and noted.

*Note on the `website` column for this segment:* it holds the publication URL (often a `/blog/` path)
rather than the organisation root, because the publication is the prospect.

---

## 10. `https://amzsummits.com/api/search?search=&page=N` — **worked, 75 rows** (JSON API)

The events page is a Vue app; its own search endpoint returns clean JSON, 6 events per page,
`events.total = 581`.

```
seq 1 100 | xargs -P 8 -I{} curl -s -A "$UA" -m 30 \
  "https://amzsummits.com/api/search?search=&page={}" -o "raw/amzsum_{}.json"
```

559 unique events. Collapsed to event *series* by stripping the year from the name and keeping the
most recent edition, then filtered to editions from 2025 onward → 75 recurring conference brands with
organiser website, city, country and dates.

*Extend by:* the API also returns `speakers` and `sessions` collections (not used — speakers are
private individuals), and pages beyond 100 were not needed but exist.

---

## 11. `https://thehiveindex.com/topics/amazon-fba-seller/`, `/topics/ecommerce/`,
## `/topics/ecommerce/platform/discord/` — **worked, 19 rows**

Source for the LinkedIn / Slack / Discord / Skool / X communities the other directories miss, with
member counts. `thehiveindex.com/communities/<slug>/` is recorded as the public landing URL, because
it is a page that can actually be opened from here — the underlying Discord invites and LinkedIn
group pages could not be, so their rules are unverified.
`/topics/amazon-seller/` and `/topics/online-selling/` both 404.

---

## 12. Conflict scan over every downloaded homepage — **worked, 26 exclusions**

Not a source but a control. Every homepage captured in `raw/vend/`, `raw/prep/`, `raw/agg/` and
`raw/cand/` was stripped of markup and searched for
`account (suspension|reinstatement) | suspension appeal | reinstatement service | plan of action |
appeal (service|writing|letter) | get reinstated | account deactivat | suspended account`.

Positives were read in context before classifying. Confirmed conflicts moved to
`prospect_type=excluded`:

| Organisation | Evidence on its own site |
|---|---|
| Merka Global | "Suspension Appeal & Reinstatement" service |
| Sellcord | "Account Reinstatement … our expert team can navigate Walmart's appeal process on your behalf" |
| CedCommerce | "Account reinstatement" under Remove growth blockers |
| Five Star Commerce | "Fixing … account suspensions" |
| SPCTEK | "Amazon Account Reinstatement … drafts a compliant Plan of Action (POA), and handles appeals" |
| ZonHack | Testimonial: "formulated a Plan of Action and had us reinstated" |
| Cohen IP Law Group | "Amazon Suspension" listed as a practice area |
| Goat Consulting | "manages the appeals process when listings are suspended" |
| AMZ Advisers | Homepage testimonial: "They handle PPC, suspensions, case resolution" |

False positives that were **kept as partners**: Express Prep and Ship (marketing copy about
*reducing* the risk of suspension), eStore Factory (a customer testimonial), Emplicit (sells
suspension *prevention*), Seller Investigators (appeals of reimbursement claims, not account
appeals), Trademark Lawyer Law Firm and L.A. Tech and Media Law (TTAB appeals, a different tribunal).

---

## 13. Hand-assembled candidate list + verification sweep — **worked, ~120 rows**

For the segments no single directory covers (accounting, lending, IP, compliance labs, insurance,
cross-border, brand protection, reimbursement, agencies, VA firms) the organisations were named by
the WebSearch tool and by the list articles in §14, then each candidate URL was **opened once** to
confirm it exists and to capture a contact route:

```
awk -F'\t' '{print $1"\t"$4}' raw/cand.tsv | xargs -P 12 -I{} sh -c \
 'curl -s -A "$UA" -L -m 25 --max-filesize 3000000 -o "raw/cand/$slug.html" \
  -w "$slug\t%{http_code}\t%{url_effective}\n" "$url"'
```

103/122 returned HTTP 200 → `verified`. A `000` (no response at all) means the URL could not be
confirmed, so `website` is left empty and the note says so — this is how **Kaspien**, **Marketplace
Ops**, **BetterAMS**, **Palmetto**, **Cabilly & Co.**, **IP-Alerts** and **Refully** are recorded.
403/202/402 responses mean the domain exists but a bot filter blocked the page; those keep the URL
and are `secondary`.

---

## 14. List articles used to name candidates — **worked**, feeding §13

| URL | What it is | Status | Rows |
|---|---|---|---|
| `https://coolnerdsmarketing.com/top-amazon-marketing-agencies-us/` | 15 US Amazon agencies with domains | worked | 35 (with §13) |
| `https://www.aihello.com/resources/blog/what-is-amazon-agency-and-why-you-need-one-even-if-you-think-you-dont/` | 39 agencies with HQ + employee band | partial — only 11 outbound URLs published, so HQ/size were used and URLs came from §13 | size signals for 39 |
| `https://www.compliancegate.com/cpsc-approved-product-testing-labs/` | 9 CPSC-accepted TIC groups | worked | 14 (with §13) |
| `https://www.compliancegate.com/amazon-seller-product-liability-insurance-providers/` | 12 insurers/brokers for the Amazon $1M requirement | worked | 13 |
| `https://www.onrampfunds.com/guides/top-providers-of-ecommerce-funding-for-inventory-ads-and-growth` | ecommerce lenders | worked | 13 |
| `https://ecombalance.com/amazon-accounting-services/` | Amazon accounting firms | worked | 8 |
| `https://jarvio.io/best-amazon-reimbursement-tools` | FBA reimbursement services | worked | 6 |
| `https://www.redpoints.com/blog/remove-counterfeit-amazon/` | brand-protection vendors | worked | 8 |
| `https://www.supplyia.com/product-inspection-companies/` | cross-border inspection/logistics | worked | 7 |
| `https://vamasters.com/outsource-amazon-store-operations-philippines/` | Amazon VA agencies | worked | 5 |
| `https://www.amazonsellers.attorney/amazon-trademark-lawyers.html` | Amazon IP firms (the publisher itself is a competitor) | worked | 10 |
| `https://gotrellis.com/resources/blog/best-amazon-forums`, `https://www.growreddit.com/best-subreddits-for-ecommerce`, `https://www.repricerexpress.com/amazon-fba-reddit/` | subreddit and forum names | partial — names only | 8 |
| `https://stackinfluence.com/...`, `https://www.modernretail.co/...`, `https://marketplace.walmart.com/mp0226`, `https://www.geekseller.com/blog/walmart-marketplace-opens-official-seller-forum...` | newsletters and news desks | worked | 10 |

---

## 15. `https://www.webretailer.com/amazon/` — **partial, 5 rows**

A 186-item directory of Amazon seller tools and services was parsed cleanly
(`data-mz-post-name` on each `<article>`), and it is how five appeal services were found
(Get Unsuspended, Got Suspended, Ecom Seller Tools, eComAttorneys – Rafelson Schick, and the
Amazon Sellers Attorney entry). **But only 42 of the 186 entries publish an outbound link**, and
those go through `go.webretailer.com` redirects; the individual review pages carry no vendor URL at
all. The 42 redirects were resolved:

```
cat raw/go_links.tsv | xargs -P 10 -I{} sh -c 'curl -s -A "$UA" -L -m 20 -o /dev/null \
  -w "$slug\t%{http_code}\t%{url_effective}\n" "$url"'
```

The remaining 144 names were **not** written as rows, because a row with no URL and no location adds
nothing over the Walmart and prep directories that already cover the same vendors. This is the
biggest deliberate omission in the file.

*Extend by:* resolving those 144 names to domains (one search each) would add roughly 100 partner
rows in the seller-software segments.

---

## Blocked / empty sources (do not retry without a browser or credentials)

| URL | What it is | Status |
|---|---|---|
| `https://clutch.co/agencies/amazon` | Clutch Amazon-agency category | **403** to curl, both UAs |
| `https://www.designrush.com/agency/amazon` | DesignRush Amazon agencies | **403** |
| `https://advertising.amazon.com/partners/directory` | Amazon Ads verified partner directory | **200 but empty** — React SPA; `/partners/api/...` and `/partners/directory/api/...` both return the HTML shell; `sitemap1..10.xml` (29,457 URLs) contain **zero** `partners/directory` entries |
| `https://www.cpsc.gov/cgi-bin/labsearch/` and `/Business--Manufacturing/.../Search-for-a-CPSC-Accepted-Testing-Laboratory` | the authoritative list of CPSC-accepted labs | **403** (Akamai). `saferproducts.gov/RestWebServices/labsearch` → 404. Compliance Gate's secondary list was used instead |
| `https://www.bing.com/search?q=...` | Bing via curl, suggested by BRIEF §2.8 | **200 but unusable** — one `b_algo` block, no result links. The WebSearch tool was used instead throughout |
| `https://shiphype.com/fba-prep-center-list/` | "200+ FBA prep services" | **HTTP 468** (bot challenge), both UAs |
| `https://cleartheshelf.com/amazon-fba-prep-center-services/` | state-by-state prep directory | **200 but a captcha page** ("Bot Verification" / altcha) |
| `https://www.letstalkshop.com/blog/...` | Discord/Slack community lists | **429** rate-limited |
| `https://www.amplisell.com/blog-post/best-amazon-reimbursement-services-for-fba-brands` | reimbursement list | **404** |
| `reddit.com`, `facebook.com`, `yelp.com`, `narpm.org`, `importyeti.com`, `duckduckgo.com` | — | **never attempted**, blocked per BRIEF §2.7 |
| Amazon Service Provider Network (`sellercentral.amazon.com/.../service-provider-network`) | Amazon's own vetted-provider directory | **not reachable** — behind Seller Central authentication, and BRIEF §2.5 forbids logging in |
