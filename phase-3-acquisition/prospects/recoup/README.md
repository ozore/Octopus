# recoup — prospect list

**ICP.** Multi-unit tenants with roughly 20+ leased locations and no in-house lease auditor —
restaurant franchisees, car washes, DSOs, veterinary and urgent-care groups, regional retail and
c-store chains — who receive an annual CAM reconciliation from every landlord and have a 90-day to
12-month contractual window to dispute it.
**Secondary ICP:** independent insurance agencies with 15+ carrier appointments reconciling monthly
carrier commission statements. Both are sold on a 30–50% contingency, so there is no budget step.

**820 rows**, collected 2026-09-03, all sourced. Research only — nothing here has been contacted.

---

## Rows by prospect_type × segment

| prospect_type | segment | rows | of which `verified` |
|---|---|---:|---:|
| end-customer | multi-unit restaurant franchisee | 252 | 91 |
| end-customer | independent insurance agency | 100 | 55 |
| end-customer | car wash chain | 99 | 67 |
| end-customer | convenience store chain | 76 | 40 |
| end-customer | veterinary group | 53 | 31 |
| end-customer | dental service organisation | 29 | 21 |
| end-customer | urgent care operator | 29 | 22 |
| end-customer | fitness operator | 14 | 14 |
| end-customer | childcare chain | 12 | 12 |
| end-customer | cannabis dispensary chain | 9 | 9 |
| end-customer | regional retail chain | 8 | 8 |
| end-customer | auto service chain | 8 | 8 |
| end-customer | cellular authorized retailer | 6 | 6 |
| end-customer | salon and personal care group | 5 | 5 |
| **end-customer total** | | **700** | **389** |
| partner | lease administration software | 16 | 16 |
| partner | tenant-rep broker | 14 | 9 |
| partner | lease accounting and advisory firm | 14 | 11 |
| partner | lease administration service provider | 9 | 6 |
| partner | insurance agency network | 7 | 7 |
| partner | franchisee association | 5 | 5 |
| partner | industry association | 4 | 4 |
| partner | agency management system | 4 | 4 |
| partner | franchise data provider / M&A and ops advisors | 5 | 4 |
| **partner total** | | **78** | **66** |
| channel | trade publication | 18 | 18 |
| channel | conference | 4 | 4 |
| **channel total** | | **22** | **22** |
| excluded | lease audit competitor | 14 | 14 |
| excluded | commission reconciliation vendor | 5 | 5 |
| excluded | pharmacy audit vendor | 1 | 1 |
| **excluded total** | | **20** | **20** |

## Rows by confidence

| confidence | rows | meaning |
|---|---:|---|
| `verified` | 497 | the organisation's own site was fetched, returned 200 and names the organisation |
| `secondary` | 323 | found in a third-party ranking or directory; the organisation's own site could not be confirmed by domain guessing |
| `unverified` | 0 | — |

401 rows carry a business contact URL or a generic role mailbox. No personal names, no personal
mailboxes, no social handles anywhere in the file.

---

## The twenty highest-fit end-customers

Chosen for the sweet spot: 100–400 leased sites (big enough that CAM is material, small enough that
there is no in-house lease auditor), a confirmed website and a confirmed business contact route.

| # | Organisation | Size signal | HQ | Why |
|---:|---|---|---|---|
| 1 | Tacala | 386 Taco Bell / 7 Brew | Birmingham, AL | Single-brand QSR at scale in strip-centre pads; one landlord format repeated 386 times means one audit pattern repeated 386 times. |
| 2 | Meritage Hospitality Group | 383 Wendy's + Morning Belle | Grand Rapids, MI | Publicly reporting franchisee, so occupancy cost is already a board-level line; no lease-audit function disclosed. |
| 3 | Yadav Enterprises | 325 across 4 brands | Fremont, CA | Four brands means four lease templates and four landlord families — the highest error surface per unit in the file. |
| 4 | Quality Restaurant Group | 318 across 4 brands | Greensboro, NC | Pizza Hut and Sonic pads plus in-line Moe's; mixed formats are where gross-up and pro-rata-share errors concentrate. |
| 5 | Desert De Oro Foods | 308 Taco Bell / Pizza Hut | Kingman, AZ | Concentrated in secondary-market centres where landlords self-administer CAM with the least rigour. |
| 6 | VantEdge Partners | 287 Taco Bell / Dunkin' | Overland Park, KS | Roll-up built by acquisition, so its leases were inherited rather than negotiated — the classic audit-rights blind spot. |
| 7 | BAJCO Group | 271 Papa Johns | Boardman, OH | Delivery-model in-line units: small footprints, high CAM per square foot, rarely audited. |
| 8 | D.L. Rogers Corp. | 268 Sonic Drive-In | Grapevine, TX | Drive-in pads carry outsized parking-lot, lighting and snow-removal charges — the categories most often over-allocated. |
| 9 | Fourteen Foods | 247 Dairy Queen | Franklin, TN | Largest DQ franchisee; single-brand portfolio makes a three-statement free audit trivially comparable. |
| 10 | Manna | 245 Wendy's / Fazoli's / Golden Corral | Prospect, KY | Golden Corral boxes are junior-anchor leases where the pro-rata share calculation is worth the most money. |
| 11 | Delight Restaurant Group | 231 Wendy's / Taco Bell | Greenwich, CT | Recent debut on the Multi-Brand 50 after fast acquisition — lease diligence typically lags acquisition by two reconciliation cycles. |
| 12 | Fresh Dining Concepts | 229 Auntie Anne's / Jamba / Cinnabon | Coral Gables, FL | Mall and airport in-line space: the highest CAM-per-square-foot format that exists. |
| 13 | Carlisle Corp. | 219 Wendy's | Memphis, TN | Long-tenured operator with leases old enough that base years and caps have drifted out of alignment. |
| 14 | Ambrosia QSR | 206 Burger King / Arby's / Popeyes | Vancouver, WA | Three brands across the Pacific Northwest; snow-removal and stormwater charges are a regional audit theme. |
| 15 | AES Restaurants | 188 Arby's | Zionsville, IN | Second-largest Arby's franchisee, entirely leased pads, no disclosed real-estate department. |
| 16 | Cave Enterprises | 178 Burger King | Chicago, IL | Dense urban in-line and pad mix in a market with aggressive real-estate-tax pass-throughs. |
| 17 | Southern Rock Restaurants | 160 McAlister's Deli | Franklin, TN | Fast-casual in-line only — the single most CAM-exposed restaurant format. |
| 18 | WellNow Urgent Care | 198 urgent-care centres | — | Retail-strip clinics leased in bulk during rapid expansion; healthcare tenants rarely audit CAM at all. |
| 19 | ZIPS Car Wash | 197 wash sites | AR | Three banners across 24 states, much of it sale-leaseback — ground leases with reimbursable-expense clauses worth testing. |
| 20 | Imagen Dental Partners | 120 supported practices | Scottsdale, AZ | A DPO whose affiliated practices each sign their own retail lease; nobody in the group audits them centrally. |

Runners-up with the same profile: SSCP Management (111, Dallas), GO Car Wash (154), Thrive
Restaurant Group (139, Wichita), Fresh-market DSOs in the 40–150 practice band, and everything in
the Restaurant 200 between ranks 120 and 200.

---

## Gaps

Segments under 30 rows, and why. None of these were padded.

| segment | rows | why |
|---|---:|---|
| fitness operator | 14 | The two ranked lists of multi-club **franchisee** companies — Franchise Times' Top Fitness Franchisees and fitnessnav.com's Top 25 — are paywalled and Cloudflare-blocked respectively. The reachable lists (Athletech, Orbital) rank **brands**, and a brand is not the entity that signs the lease. The 14 rows here are operators whose own sites confirmed them; none carry a club count. |
| childcare chain | 12 | Exchange magazine's *Top 50 for-profit child care organisations* is the canonical list and both its PDF host and winnie.com returned 403. Rows have no centre counts for the same reason. |
| cannabis dispensary chain | 9 | Only one reachable list article, and it names ten chains. State licence registers would give hundreds of multi-store operators but each is a separate state system; that is a project, not a page. |
| regional retail chain | 8 | Chain Store Guide and ICSC's tenant databases are paid. Wikipedia covers c-stores well (76 rows) but has no equivalent list for mattress, pet, dollar or furniture chains. |
| auto service chain | 8 | Same problem as fitness: the reachable lists rank franchisors, and the large franchisee groups behind Take 5, Jiffy Lube and Christian Brothers are not published anywhere free. |
| cellular authorized retailer | 6 | There are only a handful of national authorised retailers; the segment is genuinely small at the top and completely unlisted below it. |
| salon and personal care group | 5 | Rows are brand entities. The multi-unit franchisee groups behind European Wax Center, Massage Envy and Sport Clips — the actual tenants — are not published outside paywalled franchisee rankings. |
| franchisee association | 5 | ddifo.org, dfaonline.org and ncasef.com would not answer curl. The Coalition of Franchisee Associations' member list names ~10 more brand associations that a browser could reach. |
| conference | 4 | Only events with a live, fetchable site were recorded. ICSC Las Vegas, the NACS Show, the ADSO Summit and the Car Wash Show all belong here and were not confirmable by curl. |
| **subreddits, LinkedIn and Facebook groups** | 0 | reddit.com and facebook.com are blocked from this environment and LinkedIn requires a login. Naming a community without opening it would violate the "no source, no row" rule, so none were recorded. This is a real gap in the channel list, not an absence of communities. |

Two further honest caveats that apply inside otherwise healthy segments:

- **Convenience stores and car washes often own their real estate.** Both segments are named in the
  app brief and both are included, but every row carries a `notes` caveat that only the leased subset
  of the portfolio is addressable.
- **Insurance Journal ranks 1–20 are national brokers** (Alliant, HUB, Lockton, Acrisure) far above the
  "2–20 producers" ICP. They are kept for completeness and flagged as low fit in `notes`; the real
  target is ranks 50–100.

---

## Next steps — the three sources that would add the most

1. **CSP Daily News *Top 202 Convenience Stores*** (subscriber-gated). ~202 chains with store counts;
   ranks 60–202 are precisely the 20–300 site regional operators in the ICP, and it would attach real
   `size_signal` values to the 76 c-store rows that currently have none. One subscription.
2. **The paywalled franchisee rankings for the non-restaurant verticals** — Franchise Times' Top
   Fitness Franchisees, fitnessnav.com's Top 25, and Exchange's Top 50 for-profit child care. Between
   them these would take the three thinnest end-customer segments from 35 rows to roughly 100, and
   they are the only published lists of the *operating companies* rather than the brands.
3. **A search API in place of domain guessing.** 323 rows sit at `confidence=secondary` purely because
   `scripts/verify_sites.py` could not guess the domain. Re-running the pipeline with a search API
   would confirm most of them, lifting `verified` from 60% to near 100% and roughly doubling the
   number of rows with a usable contact route.

Beyond those three: brand-specific franchisee association member directories (NFA for Burger King,
DDIFO, NAASF, the Domino's Franchisee Association) are the best untapped route to the **mid-size**
20–60 unit operators who never appear on a Top 200 list and who most need a contingency CAM audit.

---

## Files

- `prospects.csv` — the list, 820 rows, schema per the fleet brief.
- `sources.md` — every source tried in order, with the exact commands and how to extend each.
- `CLAUDE.md` — steering notes for the next agent: what worked, what failed, mistakes, assumptions.
- `scripts/verify_sites.py`, `scripts/strict_check.py`, `scripts/domain_sanity.py` — the website
  confirmation pipeline.
- `scripts/build_csv.py` — regenerates `prospects.csv` from `raw/`. Run from the repo root:
  `python3 phase-3-acquisition/prospects/recoup/scripts/build_csv.py`
- `raw/` — the fetched pages and the parsed intermediates the builder reads.
