# Recoup prospect research — steering file

App: **recoup** — contingency-fee audit of bills counterparties send you. Beachhead: CAM
reconciliation audit for multi-unit tenants (20+ leased locations, no in-house lease auditor).
Secondary: insurance-carrier commission statements for independent agencies; PBM remittances;
ocean detention/demurrage (that last one belongs to the `dutylens` sibling — do not duplicate).

## Rules confirmed (constraints that actually bit)

- **No private individuals.** Franchisee rankings (Franchise Times Restaurant 200, Mega 99,
  Multi-Unit Franchisee profiles) are written around named owners and CEOs. Every row here is the
  *operating company* only. Where a source gave only a person's name and no operating entity
  (several "franchisee spotlight" pages, the Franchise Times fitness captions), the row was skipped.
- **Business contact routes only.** `contact_route` is a /contact page discovered by parsing the
  organisation's own homepage, or a generic role mailbox (info@, sales@, partners@) published on
  that site. The strict validator refuses any mailbox at gmail/yahoo/hotmail/outlook/icloud/proton/aol.
- **No source, no row.** Every row's `source_url` is a page actually fetched in this session
  (see `sources.md`) or the organisation's own verified homepage.
- **No invented URLs.** `website` is only filled after a two-pass check: candidate domains are
  generated from the name, fetched, and accepted only when the page body actually names the
  organisation and is not a parked/for-sale/unrelated site. ~45% of names resolve; the rest keep
  an empty `website` and `confidence=secondary`. That is the honest outcome, not a gap to pad.
- **Read only.** No forms, no logins, no signups. 403s and Cloudflare interstitials were logged
  and abandoned after the second attempt (fitnessnav.com, carwash.com, exchangepress.com,
  beckersdental.com).

## What worked (with yields)

| Source | Method | Rows |
|---|---|---|
| Franchise Times Restaurant 200 2025 PDF (`/app/2025-Franchise-Times-Restaurant-200.pdf`) | curl + `pypdf` text extract + structural parse anchored on `City, ST` lines | 200 operators with HQ + unit counts by brand |
| franchising.com 2026 Mega 99 | curl + tag-strip + 4-line record walk | 99 operators with unit counts and brands |
| franchising.com 2026 Multi-Brand 50 | same | 50 (heavy overlap with the two above) |
| carwashadvisory.com/top-car-wash-companies | curl + `Sites`/`Headquarters` anchor walk | 100 car-wash chains with site counts |
| insurancejournal.com/top-100-insurance-agencies/ | curl + `P\C Revenue` anchor walk | 100 independent P&C agencies with revenue + HQ |
| gotu.com/dso-directory/ | curl + `practices`/`states` anchor walk | 29 DSOs with practice counts |
| vetintegrations.com consolidator table + transitionselite.com 2026 directory headings | curl + `<table>` cell parse / `<h2>` numbered headings | ~55 veterinary groups |
| jucm.com 2024 Urgent Care Top 100 | curl + `<table>` cell parse (only the free first table renders) | 29 urgent-care operators |
| en.wikipedia.org/wiki/List_of_convenience_stores | curl + per-state `<h5>` section split | 79 US c-store chains with HQ city/state |
| visuallease.com/vl-marketplace/partners/page/N/ (10 pages) | curl loop + anchor extract | 40 lease-admin / tenant-rep / accounting partners |

Two reusable scripts live in `scripts/`:
- `verify_sites.py` — name → candidate domains → fetch → accept only if the body names the org.
- `strict_check.py` — second pass; rejects parked/placeholder/mismatched domains and pulls a
  contact page or a generic role mailbox.

Parsing trick worth keeping: for the Restaurant 200 PDF the rank numbers collide with brand unit
counts (`33 Dunkin'` immediately before `33 Alvarado`). Building a **brand vocabulary from
remainder-strings that occur 3+ times** in the document, then anchoring records on the
`City, ST` location line and walking *backwards* for the name, parsed 199/200 cleanly.

## What failed

- `cspdailynews.com` Top 202 — page loads but the ranking itself is subscriber-gated. Worth a retry
  with a human subscription; it is the single best c-store list.
- `fitnessnav.com` Top 25 Fitness Franchisees, `carwash.com` Top 50 Conveyor Chains,
  `hub.exchangepress.com` Top 50 child care, `beckersdental.com` "52 DSOs to know" — 403 /
  Cloudflare. All four are exactly the right shape; a human browser would get them.
- Bing via curl returned an unrelated cached result set through this proxy — unusable for
  discovery here. The WebSearch tool worked fine.
- reddit.com, facebook.com are blocked from this environment, so no subreddit or Facebook-group
  channel rows were recorded (naming them without opening them would break the "no source, no row"
  rule). LinkedIn group pages were not attempted for the same reason.
- Franchise Times article bodies (fitness ranking, Restaurant 200 commentary) are paywalled;
  only the PDFs under `/app/` are open.

## Mistakes I made

- First pass of the Restaurant 200 parser assumed ranks appear in ascending document order. They do
  not (two-column page layout interleaves them), so it stopped at rank 46. Switched to structural
  detection anchored on location lines — 199/200.
- First website verifier accepted `doherty.com` (a staffing firm) for "Doherty Enterprises" because
  a single core token matched. Tightened to require the full normalised name, or two core tokens
  plus an industry keyword.
- The strict validator's "placeholder" rule (title == domain) wrongly rejected 16 good sites whose
  title legitimately *is* the company name (Ambrosia QSR, Sizzling Platter). Fixed by requiring the
  title to also differ from the company name and the page to be near-empty.

## Assumptions taken without confirmation

- DSOs, vet groups and urgent-care operators above the stated 20–300 site band were kept anyway
  (Heartland Dental at 1,800 practices, Mars Veterinary Health): they are still multi-site tenants,
  and a note records that they likely have in-house real-estate staff, which lowers fit.
- Convenience-store chains and car washes often own their pads rather than lease them. Kept because
  the app brief names both segments explicitly, but every such row carries a `notes` caveat.
- Insurance Journal Top 100 ranks 1–20 are national brokers far above the "15+ carrier appointments,
  2–20 producers" ICP. Kept with a note; the lower half is the real target.
- `decision_maker_role` is inferred from segment convention (`director of real estate` for
  multi-unit operators, `CFO` for smaller operators, `agency principal` for insurance). No names.

## Advice to the next agent

1. The three highest-value sources still closed are CSP Top 202, the Franchise Times Fitness 25 and
   Exchange's Top 50 child care. All three are one human login away and each is worth 25–200 rows.
2. Re-run `scripts/verify_sites.py` then `scripts/strict_check.py` on the ~300 rows that still have
   an empty `website`; a search-API key (rather than domain guessing) would lift the ~45% hit rate
   to near 100% and upgrade most `secondary` rows to `verified`.
3. Brand-specific franchisee association member directories (NFA/BK, DDIFO, NAASF) are the best
   untapped route to *mid-size* operators — the 20–60 unit companies that never make a Top-200 list
   and that most need a contingency CAM audit.
4. Do not chase the mega-operators at the top of every list. Flynn, Dhanani and KBP all have
   in-house real-estate departments. The best-fit rows are ranks 80–200 of the Restaurant 200 and
   the 20–80 site car-wash and DSO groups.

## Final shape (2026-09-03)

820 rows: 700 end-customer, 78 partner, 22 channel, 20 excluded. 497 verified (own site fetched and
confirmed), 323 secondary, 0 unverified. 401 rows carry a business contact URL or generic mailbox.
Highest-yield sources, in order: Franchise Times Restaurant 200 PDF (199), Car Wash Advisory (100),
Insurance Journal Top 100 (100), Wikipedia US convenience stores (76), Mega 99 (50),
VetIntegrations consolidator table (49).

Two late fixes worth remembering:
- The Multi-Brand 50 table nests brand rows inside company rows, so a naive rank/company/units walk
  emitted "Papa John's" and "Pizza Hut" as if they were franchisee companies. `build_csv.py` now
  drops any Multi-Brand 50 row whose unit count collapses to under half the previous rank's, because
  the ranking is strictly descending by units.
- `scripts/domain_sanity.py` is a third verification pass added after noticing the strict check had
  accepted `leavenworthfamilydental.com` for Heartland Dental and `gibbstrucktransmissions.com.au`
  for Road Ranger. It requires the host to carry the organisation's leading word or its initials.
  Run it after `strict_check.py`, always.
- `raw/` was trimmed to the parsed intermediates that `build_csv.py` reads (268 KB). The fetched
  HTML and the Restaurant 200 PDF were deleted; `sources.md` carries the exact curl commands to
  re-fetch them.
