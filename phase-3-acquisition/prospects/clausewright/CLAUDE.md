# CLAUDE.md — clausewright prospect research

**App:** clausewright — suspension-defense copilot for Amazon & Walmart 3P sellers.
**Run:** 2026-09-03. **Output:** 1,260 rows in `prospects.csv` (915 partner / 321 channel / 24 excluded, 0 end-customer).
**Rebuild:** `python3 phase-3-acquisition/prospects/clausewright/scripts/build_curated.py` then
`python3 phase-3-acquisition/prospects/clausewright/scripts/build_prospects.py`, both from the repo root.

---

## Rules confirmed (each with the case that forced it)

1. **No private individuals — this bit hardest on the channel side.**
   - Feedspot's podcast directory publishes a `Host` field and a masked `****@gmail.com` for most
     shows. Both were dropped. A trailing `with <Firstname> <Lastname>` credit is stripped from the
     show name (*Your Selling Podcast with …* → *Your Selling Podcast*), but a corporate credit is
     kept (*Better Advertising with BTR Media*). See `HOST_CREDIT` / `CORPORATE` in the build script.
   - Feedspot's *YouTube* list was **abandoned entirely**: 75 of its ~75 entries are individual
     creators with `Youtuber Name` and `Gender` fields. There is no organisation to list, so the
     YouTube channel segment is deliberately empty rather than padded with people.
   - Facebook group rows whose name is a person's (`^<Firstname>'s …`, `… by <Firstname> <Lastname>`)
     are skipped or have the credit stripped.
   - `prepcentersearch.com`'s JSON payload contains `email`, `phone` and a `claimed_by` user id per
     prep centre. None of the three were written; a prep centre's mailbox is very often personal.
   - A `scrub()` pass runs over **every** note before it is written, replacing
     "founded/owned/run by <Name>" credits that survive in third-party blurbs. It caught two
     (Mabang ERP, Amazon SEO Consultant). It has an org allowlist so "by Hive Index" survives.
2. **Business contact routes only.** `contact_route` is a `/contact`, `/partners`, `/affiliates`,
   `/quote` or `/get-started` page on the org's own domain, or a published generic mailbox
   (`info@`, `sales@`, `support@`, `hello@`, `partners@`, `team@`, `orders@`). 769/1,260 rows have one.
   Where none was found the field is **empty** — never a phone number, never a personal mailbox.
3. **Competitor exclusion is mechanical, then read in context.** A keyword scan over every
   downloaded homepage (`raw/vend/`, `raw/prep/`, `raw/agg/`, `raw/cand/`) surfaced 16 candidates;
   each was read in context before classifying. Nine became `excluded` (Merka Global, Sellcord,
   CedCommerce, Five Star Commerce, SPCTEK, ZonHack, Cohen IP Law Group, Goat Consulting, AMZ
   Advisers). Six were false positives and stayed partners — see `sources.md` §12 for both lists.
   **Run this scan on anything you add.** It is cheap and it is the rule most easily broken by
   accident, because agencies bury "account reinstatement" three levels into a services menu.
4. **No source, no row; no fabricated URL.** A `curl` that returns `000` means the domain could not
   be confirmed, so `website` is left empty and the note says so — that is how Kaspien, Marketplace
   Ops, BetterAMS, Palmetto, Cabilly & Co., IP-Alerts and Refully are recorded. A 403/202 means the
   domain exists behind a bot filter, so the URL is kept and confidence drops to `secondary`.
5. **Read only.** No login, no form, no signup, no paid API. Blocked sources were logged, not
   worked around. TLS verification and the proxy were never touched.

## What worked (with yields)

| source | yield | the trick |
|---|---:|---|
| `marketplace.walmart.com/page-sitemap.xml` | **369** | The Solution Provider Hub renders client-side; the Yoast sitemap exposes 379 per-provider pages under `/solution-providers-old/`. Best single source in the project |
| `prepcentersearch.com` | **312** | Whole directory sits in the Next.js RSC payload: join every `self.__next_f.push([1,"…"])` chunk, `unicode_escape`-decode, brace-match objects starting `{"id":"<uuid>","name":"` |
| `bloggers.feedspot.com` / `podcast.feedspot.com` | 86 / 52 | Split on `class="trow trow-wrap"`; names come from the `feed_heading` `<h3>` for blogs and the `img alt` for podcasts |
| `revenuegeeks.com/research/amazon-seller-facebook-groups` | 78 | A 340-row `lexical-table` with member snapshots and a "best for" label |
| `amzsummits.com/api/search?search=&page=N` | 75 | Undocumented JSON API, 6 events/page, 559 events. Collapse to series by stripping the year |
| `marketplacepulse.com/aggregators` | 70 | Two structures on one page — a funded-only `<table>` and a full `stats-col` grid; merge on name |
| hand-assembled candidate list + a 122-URL verification sweep | ~120 | The only way to build the segments no directory covers |

The pattern that generalises: **when a directory landing page parses to zero rows, go to its sitemap
or its own JSON endpoint.** That worked for Walmart, prepcentersearch and amzsummits — three of the
four biggest sources.

## What failed

- **clutch.co, designrush.com** — 403 to curl on both UAs. Worth retrying only with a browser.
- **advertising.amazon.com/partners/directory** — React SPA, no server-rendered listing, no JSON
  endpoint at the two obvious paths, and **zero** `partners/directory` entries across all ten
  sitemaps (29,457 URLs checked). Needs a browser.
- **cpsc.gov accepted-laboratory search** — 403 (Akamai); `saferproducts.gov/RestWebServices/labsearch`
  → 404. This is why `product compliance lab` has 14 rows instead of several hundred. Worth a retry
  with human access — it is a government register, so it would be the highest-confidence segment in
  the file.
- **Bing via curl** (BRIEF §2.8 suggests it) — returns a results page with a single `b_algo` block and
  no result links. Unusable here. The WebSearch tool is the working substitute; use it, don't fight Bing.
- **shiphype.com** (HTTP 468 bot challenge), **cleartheshelf.com** (altcha captcha),
  **letstalkshop.com** (429), **amplisell.com** (404).
- **Amazon Service Provider Network** — behind Seller Central auth; BRIEF §2.5 forbids logging in.
- `webretailer.com/amazon/` parsed cleanly (186 tools) but **only 42 entries publish an outbound
  link**, and the review pages carry no vendor URL. 144 names were left out rather than written as
  URL-less rows. That is the largest deliberate omission.

## Mistakes I made

1. Parsed the Walmart hub page first and got zero providers, because the listing is client-side.
   Cost ~15 minutes. **Check the sitemap before writing a parser for any directory landing page.**
2. First `wm_segment()` mapped a provider to the *first* Walmart category alphabetically. Walmart
   lists multi-function providers alphabetically, so every provider tagged "Accounting and Taxes,
   Inventory Management, …" landed in accounting — Fishbowl (inventory software) came out as an
   accounting firm. Fixed: single-category providers use the category; multi-category providers are
   classified from their own description + service list.
3. Put the Facebook group URL in `contact_route` and left `website` empty. Wrong way round — the
   group URL is the public landing URL, and there is no business contact route for a group.
4. Let redirects overwrite `website`: `infinitecommerce.com` resolves to `razor-group.com` and
   `berlin-brands-group.com` to `klarstein.com`, so two aggregator rows briefly carried another
   company's domain. Fixed with a `same_host()` guard that keeps the listed domain and records the
   redirect as a finding (it usually means an acquisition).
5. Over-trimmed *Better Advertising with BTR Media* to *Better Advertising* with a too-greedy
   host-credit regex. Fixed with a corporate-word guard.

## Assumptions taken without confirmation

- Walmart's approved-solution-provider listing is treated as evidence the vendor currently serves
  marketplace sellers, but `confidence=verified` is set **only** where the vendor's own domain
  returned HTTP 200 — Walmart's word alone is `secondary`.
- An aggregator is "still operating" only on a live 200 from its own domain in Sept 2026. Twelve did
  not respond; their notes say status unconfirmed rather than asserting either way.
- `blog / publication` rows carry the publication URL (often a `/blog/` path) in `website` rather than
  the organisation root, because the publication is the prospect.
- Every Walmart-approved provider is assumed to serve Amazon too unless its own copy says otherwise.
  This is well supported (44.3% of Amazon sellers also sell on Walmart, `IDEA_DOSSIER` §4.3) but it
  is an assumption, not a checked fact, per row.
- Segment names are mine and are not in any register; they are consistent within the file only.

## Advice to the next agent

1. **Start with sitemaps and embedded JSON payloads, not landing pages.** Three of the four biggest
   sources here only yielded once I stopped parsing rendered HTML.
2. **Run the appeal-service conflict scan (`sources.md` §12) over every new partner homepage before
   you write the row.** Nine of the 26 exclusions were found that way and none of them would have
   been caught from a directory blurb.
3. **The three unlocks are all access, not effort:** Clutch/DesignRush need a browser, the Amazon Ads
   partner directory and the Service Provider Network need a browser or a Seller Central login, and
   the CPSC lab register needs a non-403 route. Any one of them adds hundreds of rows.
4. **Do not post into any community row.** Every Facebook/Discord/LinkedIn/Slack/Reddit row in this
   file has unread rules, because facebook.com and reddit.com are blocked here. `crm/CRM.md` §3.2
   calls posting before reading the rules the single largest execution risk in the GTM plan.
5. **Do not chase end-customer rows for this app.** They are individuals by construction, and BRIEF
   §2.1 forbids listing them. The partner and channel map *is* the deliverable; say so plainly rather
   than filling the segment.

## Orchestrator post-delivery edits (2026-09-03)
- Merged two rows for the same prep centre (mckenzieservices.com) that differed only by capitalisation of the name and came from two directories. Lesson: dedupe on normalised website first, then on name; a case-insensitive name match is not enough when directories spell names differently.
