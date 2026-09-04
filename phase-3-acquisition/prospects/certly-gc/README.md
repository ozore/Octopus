# Certly — general contractors (`certly-gc`)

**ICP.** Small and mid general contractors, construction managers, design-build firms and
specialty primes with roughly 20–150 active subcontractors and roughly $5M–$150M revenue —
commercial GCs, multifamily and TI builders, regional homebuilders that subcontract everything.
They collect subcontractor ACORD 25 certificates by email and track limits, additional-insured
status, waiver of subrogation and expiry in a spreadsheet; Certly reads the certificate, checks it
against the subcontract's requirements and chases the renewal before it lapses, self-serve at
$99–$299/mo. Property managers are the sibling agent's scope (`../certly-pm/`) and are not listed here.

**780 rows, collected 2026-09-03.** Six public licence registers and search portals, three AGC
chapter directories, the NASBP surety producer directory, and 195 organisation websites opened
by hand (`scripts/verify_sites.py`) — 116 of them small and mid GC company sites.

---

## Rows by prospect_type × segment

| prospect_type | segment | rows |
|---|---|---|
| end-customer | commercial GC | 507 |
| end-customer | building contractor (FL certified building contractor) | 51 |
| end-customer | specialty prime (mechanical) | 24 |
| end-customer | residential / multifamily builder | 16 |
| end-customer | design-build GC | 3 |
| **end-customer total** | | **601** |
| partner | construction insurance broker / surety agency | 84 |
| partner | trade association (national + chapters) | 16 |
| partner | construction ERP / PM software | 11 |
| partner | builders exchange / plan room | 8 |
| partner | construction law firm | 8 |
| partner | construction CPA firm | 7 |
| **partner total** | | **134** |
| channel | conference | 9 |
| channel | podcast | 7 |
| channel | trade publication / newsletter | 7 |
| channel | online community | 1 |
| **channel total** | | **24** |
| excluded | COI tracking platform | 10 |
| excluded | subcontractor prequalification platform | 6 |
| excluded | construction platform with bundled COI tracking | 5 |
| **excluded total** | | **21** |

## Rows by confidence

| confidence | rows | what it means here |
|---|---|---|
| verified | 657 | a government licence record for the organisation, or its own site opened at HTTP 200 |
| secondary | 123 | listed in a third-party or association directory whose own site was not opened, or answered 202/403 behind a bot wall |
| unverified | 0 | — |

227 rows carry a website; 159 carry a business contact route (contact page or generic mailbox).
Register rows deliberately carry neither: the app brief says a licensee row keeps `contact_route`
empty unless the company site was actually opened.

**States covered:** FL 180, CA 165, AK 83, WA 58, NC 56, TX 48, OR 47, NH 22, plus NY, GA, MA, OH,
IL, TN, DC, MN, VA, CO, WI, AZ, NJ, LA, PA, MD, NV, UT, ME, MI, NE, IN and 4 non-US partner HQs.

---

## Twenty highest-fit end-customer rows

Mid-size commercial primes, each with a chapter membership confirming they are a general
contractor, a live website opened at HTTP 200, and a business contact page. Nationally ranked
contractors (Gilbane, JE Dunn, McCarthy, Austin, Skanska, Balfour Beatty and 22 others) are in the
file but flagged in `notes` as above the ICP band and are deliberately not listed here.

| # | organisation | location | why it is the best fit |
|---|---|---|---|
| 1 | Axis Builders, LLC | Houston, TX | AGC Houston general-contractor member in the one big state with no GC licence register; site live, contact form published |
| 2 | Brookstone Construction | Houston, TX | AGC Houston GC member, independent commercial builder ("Building Solutions. Infinite Possibilities.") with a public contact page |
| 3 | Comex Corporation | La Porte, TX | AGC Houston GC member on the ship channel; industrial prime work is let almost entirely through subcontracts |
| 4 | Durotech, Inc. | Houston, TX | AGC Houston GC member trading as `durotechgc.com`; a named GC brand small enough to still run compliance by hand |
| 5 | Humphries Construction Corporation | Houston, TX | Site describes itself as "Houston General Contractor"; single-office firm, so one person owns subcontract administration |
| 6 | Mission Constructors, Inc. | Houston, TX | Site sells "Construction Management – Value Engineering – Construction Service" — a CM-at-risk model that maximises sub count |
| 7 | O'Donnell/Snider Construction | Houston, TX | AGC Houston GC member with a live contact page; mid-market Houston commercial prime |
| 8 | Paradigm Construction | Tomball, TX | Site title is literally "Commercial General Contractor"; publishes `info@pcc-tx.com`, so self-serve sign-up needs no intro |
| 9 | Prime Contractors, Inc. | Houston, TX | Publishes `estimating@primecontractorsinc.com` — the bid desk is exactly where subcontractor COIs first arrive |
| 10 | Sterling Structures, Inc. | Houston, TX | AGC Houston GC member, live site and contact page, suburban commercial prime |
| 11 | Westfall Constructors, Ltd. | Houston, TX | Site title "Westfall Constructors Houston TX / Construction Services"; regional GC, AGC member |
| 12 | Texas Gulf Construction Co., Inc. | TX | AGC Houston GC member; Gulf-coast commercial prime with a live contact page |
| 13 | Cornerstone General Contractors, Inc. | Anchorage, AK | AGC of Alaska GC-member category; Alaska primes subcontract nearly everything into a short build season |
| 14 | Criterion General, Inc. | Anchorage, AK | AGC of Alaska GC member, live site and contact page, mid-market commercial builder |
| 15 | Alborn Construction, Inc. | Anchorage, AK | Site title "Alaska General Contractor"; AGC Alaska GC member with a published contact page |
| 16 | Roger Hickel Contracting, Inc. | Anchorage, AK | Site markets "DESIGN and CONSTRUCTION projects throughout Alaska" — design plus trade subs, so twice the certificates |
| 17 | Swalling General Contractors LLC | Anchorage, AK | Publishes `contact@sgcak.com`, a generic business mailbox — the lowest-friction first touch in the whole file |
| 18 | Neeser Construction, Inc. | Anchorage, AK | AGC of Alaska GC member operating beyond Alaska, so it juggles more than one state's insurance requirements |
| 19 | Carrigg Commercial Builders, LLC | Manchester, NH | AGC New Hampshire building-contractor member; site title "Commercial Construction & General Contracting" |
| 20 | Hutter Construction Corporation | New Ipswich, NH | AGC New Hampshire building-contractor member, live site and contact page, small New England commercial prime |

---

## Gaps

Segments under 30 rows, and why:

- **design-build GC (3)** — "design-build" is a delivery method, not a licence class or a
  directory category in five of the six registers used. Only AGC New Hampshire exposes a
  design-build category. Real volume needs DBIA's member directory (not public) or classifying
  each firm by reading its own site, which does not scale from a register.
- **residential / multifamily builder (16)** — detected only from the company's name
  (`HOMES`, `RESIDENTIAL`, `MULTIFAMILY`), because no register carries a project-type field.
  Oregon CCB's 30,423 *Residential* General Contractor rows and NCLBGC classification 28 are the
  obvious fix and were left unpulled to keep the file weighted to commercial primes.
- **specialty prime (mechanical) (24)** — deliberately capped. Florida CMC licences alone hold
  2,466 rows; electrical primes sit under a different Florida board and were not pulled, and the
  CSLB pull was restricted to class B, so C-10/C-20 primes are absent.
- **channel: podcast 7, trade publication / newsletter 7, conference 9, online community 1 (24 total)** —
  this is close to the real size of the category rather than a collection failure: there are not
  hundreds of construction podcasts with a GC-owner audience. The genuine loss is **LinkedIn and
  Facebook groups: zero rows**, because LinkedIn group pages return a login wall and facebook.com
  is blocked in this environment. Reading either would mean scraping behind a login, which the
  brief forbids, so nothing was written rather than writing URLs never actually opened.
- **partner: construction CPA firm 7, construction law firm 8, builders exchange / plan room 8,
  construction ERP / PM software 11** — all four are curated lists where every row was verified by
  opening the firm's site, so they are small but clean. CFMA's chapter list and the BXNet member
  list are public and would each add 30–50 rows; ABC's 68 chapters would add the same again.
- **excluded (21)** — this is the full named competitor set from the brief plus two vendors caught
  by the automated COI-feature check (Knowify, Jonas Construction). It is meant to be small.
- **Geography.** Alaska is over-weighted (83 rows) relative to its market size purely because
  AGC of Alaska publishes a clean, complete GC member category and most chapters do not. Georgia,
  Arizona, Nevada, Virginia, Colorado and the whole Midwest have no end-customer rows.

## Next steps — the three sources that would add the most

1. **The other 84 AGC chapters and 68 ABC chapters.** Three chapters produced 140 GC firms
   *with websites, cities and contact pages* — the highest-quality rows in this file, and the only
   way to cover Texas, which has no state GC licence. `scripts/pull_assoc_directories.py` already
   parses the GrowthZone card markup; the work is finding each chapter's
   `.../Search/general-contractors-<id>` URL. Estimated 2,000–4,000 rows.
2. **Widening the register pulls that already work.** Florida was sampled from 20,061 company
   licences in 8 of 67 counties; California from 35,167 company rows in 11 of 58 counties;
   Washington from 16,521; Oregon from 6,999; North Carolina from 1,287 active. Changing the quota
   dictionaries in `scripts/make_prospects.py` yields tens of thousands of additional
   government-verified rows with no new source work. Adding Nevada NSCB, Virginia DPOR and Georgia
   would close the geographic holes.
3. **Sources that need a human or a budget.** The CSLB Licence Master File ($235, includes the
   business-principal and workers'-comp files — a real size signal); Arizona ROC, whose Salesforce
   search needs a browser; the AGC national member directory behind `agc-community.agc.org`; and
   ENR's regional Top Contractor lists, whose lower halves are exactly this ICP but sit behind a
   paywall. Each was logged as blocked in `sources.md` rather than worked around.
