# WageLens — prospect list

**10,749 organisations**, collected 2026-09-03, entirely from public government
APIs and registers. Research only: nothing here has been contacted, and nothing
here authorises contacting anyone.

**ICP.** Small and mid-size specialty subcontractors (electrical, plumbing/HVAC,
concrete, masonry, painting, roofing, drywall, flooring, steel, site work) working
federally funded or state prevailing-wage construction — especially non-union firms
new to government work with no compliance department.
Secondarily, small general contractors that must collect and audit their subs'
certified payrolls, and the associations, accelerators, CPAs and vendors that already
serve both.

---

## Rows per `prospect_type` × `segment`

### end-customer — 10,295

| segment | rows | where the rows come from |
|---|---:|---|
| commercial and institutional building general contractor | 1,856 | USAspending prime awards + subawards, NAICS 236220 |
| MWBE/SBE certified construction firm | 1,508 | NYC SBS, NJSAVI, Cincinnati, Norfolk |
| federal construction awardee (SAM.gov) | 1,206 | SAM.gov award notices |
| state prevailing-wage contractor (NY) | 692 | NYSDOL certified payroll registration |
| state prevailing-wage contractor (WA) | 651 | WA L&I intents and affidavits |
| state prevailing-wage contractor (IL) | 547 | Illinois DOL certified transcript of payroll |
| public works contractor registry (NY) | 542 | NYSDOL contractor registry, active only |
| DBE certified construction firm | 477 | NYS UCP, New Orleans |
| highway, street and bridge construction contractor | 398 | USAspending, NAICS 237310 |
| all other specialty trade contractor | 395 | USAspending, NAICS 238990 |
| electrical contractor | 391 | USAspending, NAICS 238210 |
| plumbing, heating and air-conditioning contractor | 390 | USAspending, NAICS 238220 |
| state prevailing-wage contractor (TX) | 369 | TxDOT bid tabs, federal-aid lettings only |
| other building equipment contractor | 329 | USAspending, NAICS 238290 |
| roofing contractor | 306 | USAspending, NAICS 238160 |
| site preparation contractor | 258 | USAspending, NAICS 238910 |
| painting and wall covering contractor | 115 | USAspending, NAICS 238320 |
| flooring contractor | 106 | USAspending, NAICS 238330 |
| other foundation, structure and building exterior contractor | 79 | USAspending, NAICS 238190 |
| other building finishing contractor | 78 | USAspending, NAICS 238390 |
| poured concrete foundation and structure contractor | 70 | USAspending, NAICS 238110 |
| glass and glazing contractor | 43 | USAspending, NAICS 238150 |
| structural steel and precast concrete contractor | 34 | USAspending, NAICS 238120 |
| masonry contractor | 28 | USAspending, NAICS 238140 |
| public works prequalified contractor (DE) | 22 | Delaware OMB prequalification list |
| drywall and insulation contractor | 20 | USAspending, NAICS 238310 |
| finish carpentry contractor | 15 | USAspending, NAICS 238350 |
| siding contractor | 14 | USAspending, NAICS 238170 |
| tile and terrazzo contractor | 6 | USAspending, NAICS 238340 |
| framing contractor | 1 | USAspending, NAICS 238130 |

### partner — 391

| segment | rows |
|---|---:|
| APEX Accelerator | 266 |
| trade association (national) | 36 |
| construction CPA / accounting firm | 31 |
| construction payroll & back-office provider | 24 |
| trade association chapter | 23 |
| govcon training & advisory | 11 |

### channel — 42

| segment | rows |
|---|---:|
| industry media & newsletter | 25 |
| conference | 11 |
| podcast | 6 |

### excluded — 21

| segment | rows |
|---|---:|
| certified-payroll incumbent | 21 |

## Rows per `confidence`

| confidence | rows | what it means here |
|---|---:|---|
| `verified` | 10,539 | a government record for the organisation was read via an official API, or the organisation's own site was fetched and its title recorded |
| `secondary` | 189 | in a register with no NAICS/industry column, so the construction fit is inferred from the business name or NIGP code (Cincinnati MBE/WBE, Norfolk SWaM) |
| `unverified` | 21 | a real, well-known organisation whose own site answers a plain request from this environment with a Cloudflare challenge or HTTP 403; `website` is left empty and the exact status is recorded in `notes` |

---

## Twenty highest-fit end-customer rows

Chosen for the intersection the product is built for: a **specialty trade**, a
size in the **$1–20M federal band** (big enough to owe WH-347 weekly, small
enough to have no compliance department), and evidence the firm is **on a
covered job right now**.

| # | organisation | where | signal | why it is the sharpest fit |
|---:|---|---|---|---|
| 1 | Barry Williams Electric Inc | Waco, TX | 46 federal awards, $12.2M since 2024 | High award count at a small average value: dozens of separate Davis-Bacon wage determinations to track in one year, on an electrical crew. |
| 2 | Chappelle Mechanical Services LLC | Lorton, VA | 43 federal awards, $7.9M since 2024 | Mechanical sub in the densest federal construction market in the country; every job carries a county/craft determination. |
| 3 | Maloof Weathertight Solutions, LLC | Warner Robins, GA | 52 federal awards, $15.4M since 2024 | Roofing contractor working an Air Force base town — near-continuous federal reroof work, all WH-347. |
| 4 | Caldaia Controls LLC | Cape Coral, FL | 36 federal awards, $8.3M since 2024 | HVAC controls specialist; controls technicians are the classic conformance/SF-1444 problem because their duties rarely match a listed classification. |
| 5 | S3 Contracting LLC | Manassas, VA | 34 federal awards, $11.3M since 2024 | Roofing sub in the federal corridor at exactly the sub-tier price point. |
| 6 | Avalon Contracting Inc | Tacoma, WA | 33 federal awards, $13.1M since 2024 | Plumbing/HVAC firm exposed to **both** Davis-Bacon and Washington's own intent/affidavit regime — two filing systems, one payroll. |
| 7 | Lupini Construction, LLC | Utica, NY | 32 federal awards, $17.9M since 2024 | Masonry contractor in New York, so Davis-Bacon **plus** NYS Article 8 weekly certified payroll. |
| 8 | Paradigm Mechanical Corp. | Lemon Grove, CA | 32 federal awards, $19.4M since 2024 | Mechanical sub in California: Davis-Bacon plus DIR registration plus eCPR filing. |
| 9 | Brand Construction LLC | West, TX | 27 federal awards, $15.6M since 2024 | Roofing contractor with a heavy, repeating federal award cadence. |
| 10 | Eleven Bravo Group, LLC | Plantation, FL | 27 federal awards, $3.4M since 2024 | Glazing sub at the small end of the band — the $79–99/mo tier, with no back office. |
| 11 | A&E Elevator II LLC | Shrewsbury, PA | 28 federal awards, $16.3M since 2024 | Elevator work has non-obvious classifications and is a frequent conformance case. |
| 12 | Miles Resources LLC | Puyallup, WA | 28 federal subawards, $14.4M since 2024 | Recorded as a **subcontractor** on federal primes — already inside somebody else's Davis-Bacon compliance chain. |
| 13 | Western Construction & Equipment, LLC | Anchorage, AK | 33 federal subawards, $1.6M since 2024 | Small sub with many tiny subawards: the worst possible ratio of paperwork to revenue, which is the buying trigger. |
| 14 | Highmark Concrete Contractors LLC | Sumner, WA | 15 federal subawards, $2.0M since 2024 | Concrete sub, small, on federal jobs and in a state prevailing-wage regime. |
| 15 | Tanner Heavy Equipment Co., L.L.C. | Leesville, LA | 18 federal subawards, $8.9M since 2024 | Site-work sub next to Fort Johnson; operators and truck drivers are the hardest classification calls. |
| 16 | Lynden Sheet Metal Inc | Lynden, WA | 374 statements of intent since 2024 | Filed a prevailing-wage intent roughly every other working day — pure repeat-filing pain. |
| 17 | G & W Commercial Flooring Inc | Kent, WA | 369 statements of intent since 2024 | Flooring sub with a very high job count and small crews; per-job rate lookup dominates the admin. |
| 18 | Travers Electric Inc | Chehalis, WA | 364 statements of intent since 2024 | Electrical sub, high filing frequency, non-metro so unlikely to have in-house compliance staff. |
| 19 | John Mills Electric, Inc. | NY | 2,790 weekly certified payrolls since 2024 | Files a certified payroll almost every week of the year on NY public work. |
| 20 | Otto Baum Company Inc. | IL | 1,165 certified transcripts of payroll to IDOL | Masonry contractor filing continuously under Illinois' own certified-payroll regime; same county/craft problem, second jurisdiction. |

---

## Gaps

Segments under 30 rows, and why. **None of these are padded.**

| segment | rows | why it is small |
|---|---:|---|
| masonry contractor | 28 | Only 104 federal prime awards exist under NAICS 238140 in the whole 2024–2026 window at $50k–$10M. Masonry is nearly always a *sub*, and subaward reporting for it is almost empty (0 subawards under 238140). The masonry ICP is real but invisible to federal award data — reach it through the state registers and the Mason Contractors Association instead. |
| public works prequalified contractor (DE) | 22 | The Delaware dataset contains 29 records total. Nothing more exists to extract. |
| drywall and insulation contractor | 20 | 73 federal awards exist under 238310. Same structural reason as masonry: drywall is subcontracted, and the sub tier is not reported. |
| finish carpentry contractor | 15 | 71 federal awards under 238350. |
| siding contractor | 14 | 40 federal awards under 238170. |
| tile and terrazzo contractor | 6 | 14 federal awards under 238340 in two and a half years. |
| framing contractor | 1 | 11 federal awards under 238130, and only one recipient survived the person-name and size filters. Federal construction is overwhelmingly steel and concrete, not stick framing. |
| channel — podcast (6), conference (11) | 17 | Podcasts are largely fronted by named individuals, and BRIEF §2.1 forbids recording people; only shows with a real organisational site are listed. Several conference microsites are seasonal and 404 out of season. |
| channel — **LinkedIn and Facebook groups: 0 rows** | 0 | facebook.com is on the environment's blocked list (BRIEF §2.7) and LinkedIn group membership cannot be read without a login (BRIEF §2.5). This is a genuine hole in the channel coverage, not an oversight. |
| partner — **association chapters: 23, not ~400** | 23 | ABC, AGC, NECA, IEC, SMACNA, MCAA, ASA and NAWIC all render their chapter directories client-side or answer curl with 403. Only the national bodies plus chapters whose own site could be fetched and title-matched are listed. See `sources.md` §13. |
| **California: no state register rows at all** | 0 | The CA DIR public works contractor registration portal is a ServiceNow application that refuses every public data path tried (three attempts, all logged). California is the largest prevailing-wage market in the country and is represented here only through federal award data. |

Two more honest caveats that are not row-count gaps:

- **`contact_route` is filled on only 80 of 10,749 rows (0.7%).** None of these government
  registers publish a generic business mailbox, and BRIEF §2.2 forbids the
  personal addresses several of them do publish. Filling this column means
  opening each firm's own website — a separate, much slower pass.
- **`website` is filled on only 679 rows (6%)**, for the same reason:
  USAspending, WA L&I, NYSDOL and IDOL do not carry a URL, and BRIEF §2.4
  forbids guessing one. Where a website is present (NYC SBS, New Orleans,
  Cincinnati) it is the value the register publishes, and each such row says so
  in `notes`.

---

## Next steps — the three sources that would add the most

1. **California DIR public works contractor registration**
   (`https://www.dir.ca.gov/Public-Works/Contractors.html` →
   `services.dir.ca.gov/pw?id=dir_contractors`). Roughly 150,000 contractors
   registered to work California public works, every one of them legally
   obliged to file certified payroll. This single source would likely double
   the file and would add the state with the largest prevailing-wage market. It
   needs a real browser session or a data request; curl cannot get past the
   ServiceNow authentication wall.
2. **The remaining state prevailing-wage filing systems on Socrata.** Washington,
   New York, Illinois and Texas were mined here and yielded 2,259 rows between
   them; Oregon (BOLI), Colorado, Minnesota, Massachusetts, New Jersey's own
   public works registration and Ohio's prevailing-wage filings were not tried.
   The discovery query is one line:
   `https://api.us.socrata.com/api/catalog/v1?q=prevailing+wage+contractor&only=dataset`.
   Also: joining WA `t9je-9qwa` to `h95x-vpyj` on `intent_id` attaches the real
   **trade name** to every Washington row, turning a generic segment into 30
   precise trade segments.
3. **Trade association chapter directories, opened in a browser.** ABC (~68
   chapters), AGC (~89), NECA (117), IEC (~50), PHCC, SMACNA, MCAA, ASA and
   NAWIC together list well over 400 local chapters, each one an organisation
   that runs compliance education for exactly this ICP and sells member
   benefits. All of them are client-side rendered and unreachable from here;
   an hour with a browser converts them into ~400 partner rows.

---

## Files

| file | what it is |
|---|---|
| `prospects.csv` | the deliverable, 10,749 rows, schema per BRIEF §3.1 |
| `large_primes_excluded.csv` | 213 recipients with more than $50M of federal awards in the window — too large for the ICP, recorded so they are not rediscovered |
| `sources.md` | every source tried, in order, with the exact query and how to extend it |
| `CLAUDE.md` | memory file for the next agent |
| `scripts/usaspending_pull.py` | USAspending prime awards + subawards → `scripts/api_rows.csv` |
| `scripts/secondary_pull.py` | state/city registers + SAM.gov → `scripts/secondary_rows.csv` |
| `scripts/partners_channels.py` | APEX locator + URL-verified partner/channel/excluded candidates → `scripts/partner_rows.csv`, `scripts/unverified_candidates.csv` |
| `scripts/build_prospects.py` | merges the three, dedupes, re-applies the privacy filters, writes `prospects.csv` |

All four scripts run from the repository root with no arguments and regenerate
their rows. HTTP responses are cached outside the repository
(`/tmp/wagelens_*`), so a re-run after the first is fast and makes no new
requests.
