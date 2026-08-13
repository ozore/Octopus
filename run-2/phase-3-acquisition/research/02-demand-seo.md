# Demand and the Programmatic Surface — Ratepin

**Subject:** D8 channel 2. What contractors search, who holds those results today, whether a county × craft page set is defensible, how large it honestly is, and the templates, linking and refresh cadence that keep it out of Google's doorway and scaled-content categories.
**Method:** SERP inspection and primary-source fetching, all in-session **2026-08-13**; corpus sizing from our own measured figures in `phase-2-build/architecture/CORPUS_DESIGN.md` §2.7 (measured 2026-08-13). Bound by `PLAN.md` A1–A6, `CORRECTIONS.md`, `BRAND.md` §5. Every forward-looking number here is a hypothesis; none asserts a traffic, ranking or conversion outcome.

---

## 1. What could not be measured, stated first

**No search-volume data was bought or used**, so this document contains no monthly-volume figures — inventing them is what `CORRECTIONS.md` §0.1 exists to prevent. What *is* measurable is **supply**: which pages Google returns, what they contain, how fresh they are. Supply is the harder constraint and the one that decides defensibility.

The one demand denominator we can source is the population, not the query. DOL's clearance for the WH-347 records **122,936 respondents** filing **11,310,112 annual responses** (89 FR 70670, published 2024-08-30, fetched 2026-08-13) — about **92 filings per filer per year**. Roughly a hundred thousand US businesses doing a task ninety times a year: sourced, recurring, and small enough that a page set built for volume is the wrong instrument.

---

## 2. The four query families, and who holds them

| Family | Query tested | Returned, 2026-08-13 | Read |
|---|---|---|---|
| **County rate lookup** | `"prevailing wage rate" county davis bacon lookup` · `"Harris County" Texas davis bacon prevailing wage rate carpenter` | wagefinder.org, davisbaconwages.com, prevailingwagelookup.com, davisbaconrates.com, constructionbids.ai, dol.gov | **Occupied four ways.** Not a gap; a crowd |
| **Craft rate in a named county** | `"Los Angeles County" prevailing wage rate electrician 2026` | **dir.ca.gov** determination pages, abcsocal.org, workyard.com | **Intent collision** — §4 |
| **Form help** | `how to fill out certified payroll WH-347` | **lcptracker.com twice**, emarsinc.com, hammr.com, certifiedpayrollpro.com, dol.gov | Owned by incumbent content marketing |
| **Format / filing mechanics** | `DIR eCPR XML format upload` · `WH-347 fillable form free` | help.trimble.com, sunburstsoftwaresolutions.com, dir.ca.gov PDFs · dol.gov, dochub, pdffiller | Narrow, technical, thinly held — the only slack |
| **Determination by number** | `"CA20260022" wage determination` | **sam.gov/wage-determination/CA20260022/2 at position 1** | SAM ranks its own per-revision URLs. Do not compete |

---

## 3. The surface is occupied, and more heavily than `research/02` recorded

That document named one occupant and called D8 channel 2 "occupied". Four now contest it, and two already ship what D8 proposes (all fetched 2026-08-13).

- **davisbaconwages.com** publishes our exact proposed hierarchy — `/state/wa/`, `/state/wa/[county]`, `/state/wa/trade/[trade]` — with trade, rate, fringe, total, determination number and revision ("CA20260022 rev 5"), a 39-county directory, roughly **3,220 trade rates across 97 determinations** on the Washington page alone, a "Recent Updates" feed, an email-alert signup, and a stamp reading **"Data updated: August 12, 2026"**. Affiliate-monetised, self-described: *"This site reformats data from SAM.gov for easier access."*
- **davisbaconrates.com** claims **51 states/territories and 3,138 counties** and already prints provenance: *"WD# TX20210253, Mod 12, effective 3 January 2025 — synced 8 July 2026"*, with a source link and a stated weekly re-sync.
- **wagefinder.org** advertises **"492,044 Wages And Growing"**, weekly automatic SAM.gov updates, and sells an API. That figure sits within 3% of our projected **~479,000** county × class rows — independent confirmation that the raw index is not scarce.
- **PrevailComply** holds the adjacent set: state guides for WA, CA, NY and IL plus a free WH-347 generator and step-by-step guide.

**Binding consequence: printing the WD number, modification and date on a public rate page is no longer differentiating.** It remains U1 on the *artifact* — no competitor puts it on the emitted WH-347 — but davisbaconrates.com reached the rate page first. `BRAND.md` §5.6 item 2 is a proof obligation to the visitor, not a ranking advantage.

---

## 4. The highest-intent county × craft query is often not ours

`"Los Angeles County" prevailing wage rate electrician 2026` returned **California DIR determination pages** (`dir.ca.gov/OPRL/2026-1/…`) above everything else — correctly, because a California contractor asking that usually wants the **state** prevailing wage: different regime, different publisher, twice-yearly cycle. D9 puts state wage regimes out of v1; we mirror federal DBA determinations and emit California eCPR *output* only.

A large share of literal `[county] [craft] prevailing wage` demand is therefore demand we cannot serve and must not pretend to. The disambiguating tokens are *federal*, *Davis-Bacon*, *WH-347* and a WD number. **Target the federally-qualified query, not the bare county × craft phrase**, name the regime in the page's first line, and link out to the state regulator rather than answer for it.

---

## 5. Sizing the page universe from the corpus we hold

All figures from `CORPUS_DESIGN.md` §2.7, measured 2026-08-13.

| Quantity | Value | Meaning for pages |
|---|---|---|
| Active DBRA determinations | **4,236** | The real entity count |
| County rows across active WDs | **14,195** | (WD × county) pairs — **not** distinct counties |
| Distinct state/territory codes | **56** | State hub ceiling |
| Mean classifications per WD | **33.8** (7–161) | Craft rows per determination |
| Projected active county × class index | **~479,000** | The theoretical ceiling |
| Revision documents, active corpus | **9,424** | Σ(revision+1) over 4,236 |

Two derivations, shown so they can be checked:

1. **Supersession events held: 9,424 − 4,236 = 5,188** — every time an active determination has been modified, across the whole active corpus. That is the entire supply of the one story nobody else can tell (§6.1), and it is **1.1% of 479,000**.
2. **Counties per determination: 14,195 ÷ 4,236 = 3.35**, so county-level change events run to roughly **17,400** before asking how many classifications each modification actually moved — unmeasured, and to be computed during backfill.

**Publishing anything near 479,000 pages is indefensible and we should not attempt it.** The ceiling is not the plan; it is what the plan exists to avoid.

---

## 6. The thin-content problem, as Google states it

From Google's spam policies, fetched 2026-08-13:

> **Scaled content abuse** — *"when many pages are generated for the primary purpose of manipulating search rankings and not helping users"*, including *"scraping feeds… to generate many pages (including through automated transformations…), where little value is provided to users."*

> **Doorway abuse** — includes *"creating substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy"* and *"generating pages to funnel visitors into the actual usable or relevant portion of a site."*

The helpful-content guidance asks *"Does the content provide original information, reporting, research, or analysis?"* and *"Are you using extensive automation to produce content on many different topics?"*

A page per county × craft that reformats a SAM table is the second doorway example verbatim and the first scaled-content example — a scraped feed, automatically transformed. Reformatting is precisely what the leading incumbent says it does. The differentiator cannot be that ours is prettier.

### 6.1 What only the mirror can produce

1. **The per-classification revision diff** — what this craft's base and fringe were at each revision of the determination covering this county, and the date each changed. Verified absent from every occupant: davisbaconwages.com's "Recent Updates" indexes which determinations moved, **not what changed inside them**; davisbaconrates.com prints the current mod but no history; SAM serves each revision as a separate document with no comparison view. This is R-HIGH7's **assembly** claim rendered as a page, and the unit that satisfies *"original… analysis"*.
2. **The supersession chain across years** — CA20260022 supersedes CA20250022 — turning annual documents into one continuous rate history per county × craft.
3. **Effectivity dates with the rule stated and the conclusion declined.** DOL: *"Any changes in wage rates on the GWDs are made in weekly updates, generally on Friday"*, and a revision issued *"less than 10 calendar days before the opening of bids"* is effective unless the agency finds otherwise (Prevailing Wage Resource Book, fetched 2026-08-13). A page showing *"Mod 4 published six days before your bid opening; here is the rule; whether it is effective turns on a contracting-officer finding Ratepin cannot observe"* is D7 on a public surface. Declining a conclusion is only credible if you also show the dates, and nobody else shows them.
4. **The payroll-title crosswalk entry** — *"what does this determination call a sprinkler fitter?"* — seeded by O*NET's **1,595 alternate titles under SOC major group 47-2** (database 29.1, verified 2026-08-13, `CORPUS_DESIGN.md` §7.1).

**Publication gate, binding: a page ships only if it carries item 1 or item 4.** A county × craft page whose determination was never modified and whose craft has no crosswalk entry is a reformatted table and should not exist. Both inputs are columns, so the gate is enforceable in the build.

---

## 7. Recommended templates

The key structural decision: **counties covered by the same determination share one page, not one page each.** Their rates are byte-identical, so a page per county generates true duplicates — the doorway example. County remains a *query token*, so county URLs exist, but as hubs that route rather than tables that repeat.

| # | Template | URL | What justifies it | Count |
|---|---|---|---|---|
| **T1** | State hub | `/rates/[state]` | Determinations in force, counties covered, latest modification dates, construction-type split | **56** |
| **T2** | County hub | `/rates/[state]/[county]` | *Which determinations cover you*, each with mod, publish date, last-changed date, and the §4 state-regime disambiguation | ≤ distinct counties (**to be measured**) |
| **T3** | Determination × construction type × craft family — the canonical rate page | `/rates/[state]/[county]/[craft]`, county variants canonicalised to one | Rate, **full revision history for that craft with dates**, covered-county list, verbatim scope text, crosswalk titles resolving to it | Gated by §6.1; bounded by **5,188**, not 479,000 |
| **T4** | Determination change log | `/wd/[number]/changes` | Per-classification diff for one determination, revision by revision. **Links to sam.gov for the text; never reproduces it** | ≤ 4,236, revision ≥ 1 only |

T4 is deliberately not `/wd/[number]`: SAM ranks its own per-revision URLs first for number queries (verified 2026-08-13), and duplicating a government document is the worst page we could publish. Link to the authority; hold what the authority does not compute.

**Launch cohort (Moore, Ries):** ship roughly **500 pages**, not the ceiling — beachhead states first, all four templates represented, one experiment with one decision at the end.

### 7.1 Internal linking

Link on **relations the corpus knows**, never on a generated grid.

- **T1 → T2 → T3**, a strict browseable hierarchy — Google's doorway text names the absence of one as the defect.
- **T3 → sibling crafts in that determination's own classification list** (a containment relation). An alphabetical "related crafts" block is not.
- **T3 → the same craft in superseding and superseded determinations** — the time axis, our asset and nobody's grid.
- **T3 ↔ T4** both ways; **T4 → sam.gov** as canonical.
- **T2 → the state regulator** where the county sits under its own regime (§4). Linking away from a query we cannot serve is the cheapest credibility available.
- **Every template → the free WH-347 generator**: one link, below the data, no interstitial and no email wall (`BRAND.md` C-B3 resolved this in favour of proof).
- **No cross-links to unrelated counties.** That is the grid, and the grid is the doorway.

---

## 8. Refresh cadence, tied to corpus promotion

The mechanism exists: nightly crawl at 02:00 ET, promotion transaction, then `pages.rebuild` — *"skipped entirely if the snapshot did not promote"* (`ARCHITECTURE.md` job table). Four rules make it safe publicly.

1. **Rebuild on the promotion diff, not on a schedule.** Only pages whose `county_class_rate` rows changed regenerate. Refreshing tens of thousands of unchanged pages nightly with a new date is churn, and churn is what *"automated transformations… where little value is provided"* looks like from outside.
2. **Two dates, two different facts.** `last verified` moves on every successful promotion; `last changed` moves only on a real rate change. **Sitemap `lastmod` carries `last changed`.** A sitemap claiming thousands of pages changed last night when they did not is a false machine-readable claim, and CL-2 exists to catch exactly that.
3. **Friday is the high-yield window.** DOL publishes GWD changes *"in weekly updates, generally on Friday"*, so Friday-night and Saturday-morning promotions are when T4 earns its keep — a weekly publication with a real weekly event behind it, which is rare in programmatic SEO.
4. **Staleness degrades the sentence, never the page.** Per `CORPUS_DESIGN.md` §6.4: at L1 the "as of" line narrows (P-C); at L2 the page renders from the last promoted snapshot with a dated narrowing and no currency framing — never blank, never silently stale.

---

## 9. Placement, and the criterion for killing this

Under Weinberg & Mares' Bullseye this is a **middle-ring** channel, not the inner ring: the surface is contested by four incumbents (§3), the highest-intent phrasing is partly another regime's (§4), and the defensible supply is ~1% of the naive ceiling (§5). Under Hormozi's Core Four, A1–A6 delete both human-outreach quadrants, leaving free content and paid ads — which is why this channel keeps being reached for, and why it must be tested rather than assumed.

**Decision rule, set before the data exists:** at 90 days, compare the T3/T4 diff-bearing cohort against the free-generator pages as a control arm on (a) share of published pages indexed, (b) impressions per published page, (c) generator starts attributable to a `/rates/` entry. **Any template whose indexed share trails the control arm is deleted, not iterated** — a template Google declined to index is a template that failed, and keeping it is how a site acquires a scaled-content problem. No target values are asserted; asserting one would repeat the volume error.

### 9.1 What this channel may never do

These pages are Scope A under `CORRECTIONS.md` §3.1: no figure without its source and as-of date in the same sentence, no rate rendered without its determination (`BRAND.md` §6.5), no coverage or currency claim before G3, and the public-surface rules of `CORPUS_DESIGN.md` §6.4 unchanged. Nothing here sells against a consequence. The reason to read these pages is that the general contractor does not release the draw until the payroll is right — true every week, regardless of anything happening at an agency.

---

## 10. Hypotheses, flagged

- **That the per-classification diff is a query anyone types. Unmeasured, and load-bearing for this channel.** It may be something people want only once they already have the problem — in which case T4 is a retention asset that happens to be public, not an acquisition channel.
- That diff density per modification is high enough to fill T3 pages. Compute during backfill.
- Distinct-county count across the active corpus. Not computed; 14,195 is (WD × county) pairs.
- That four incumbents with affiliate and API economics leave room for pages selling a $99–$599 subscription. `research/02` §6 flagged that we cannot match affiliate economics on a free page.
- Competitor page sets in §3 were fetched 2026-08-13 and will drift; `BRAND.md` §8.3's weekly re-fetch job should cover these four domains alongside the price pages.

---

## References

**SERPs and competing supply, observed in-session 2026-08-13**

- https://davisbaconwages.com/ · https://davisbaconwages.com/state/wa/ · https://davisbaconwages.com/updates — state/county/trade hierarchy, determination number + revision, ~3,220 trade rates across 97 determinations on the WA page, "Data updated: August 12, 2026", affiliate monetisation, "reformats data from SAM.gov"
- https://davisbaconrates.com/prevailing-wage-rates — 51 states/territories, 3,138 counties, "WD# TX20210253, Mod 12, effective 3 January 2025 — synced 8 July 2026", weekly re-sync
- https://wagefinder.org/ — "492,044 Wages And Growing", weekly automatic updates, API sold, operated by HCM TradeSeal
- https://prevailingwagelookup.com/ · https://constructionbids.ai/tools/sub/wh-347-payroll-generator · https://constructionbids.ai/blog/davis-bacon-prevailing-wage-rates-2026-lookup
- https://prevailcomply.com/blog/california-dir-ecpr-guide-small-contractors.html · https://prevailcomply.com/blog/washington-prevailing-wage-certified-payroll
- https://lcptracker.com/blog-post/faq-how-to-complete-the-revised-wh-347-form/ · https://lcptracker.com/blog-post/a-walkthrough-for-completing-the-wh-347-certified-payroll-report/
- https://www.certifiedpayrollpro.com/wh-347-instructions · https://emarsinc.com/blog/how-to-fill-out-form-wh-347-for-certified-payroll-reporting
- https://sam.gov/wage-determination/CA20260022/2 — SAM's own per-revision URL, position 1 for the WD-number query
- https://www.dir.ca.gov/OPRL/2026-1/PWD/Determinations/Subtrades/LOS.html — the California state-regime pages holding the county × craft query
- https://help.trimble.com/en/spectrum/spectrum/accounting/payroll/payroll-reports/certified-payroll-report/other-information-for-ecpr-file/ecpr-xml-format · https://sunburstsoftwaresolutions.com/california-dir-ecpr-prism-lcptracker-upload-feature-for-quickbooks.htm

**Primary sources, fetched 2026-08-13**

- https://developers.google.com/search/docs/essentials/spam-policies — scaled content abuse and doorway abuse definitions, quoted in §6
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content — originality and extensive-automation self-assessment questions
- https://www.dol.gov/agencies/whd/government-contracts/prevailing-wage-resource-book/db-wage-determinations — "weekly updates, generally on Friday"; modification records; pre-bid-opening effectivity
- https://www.dol.gov/agencies/whd/government-contracts/construction/faq — revised determination effective before award; sealed-bidding exception
- https://www.dol.gov/agencies/whd/forms/wh347 — WH-347, OMB 1235-0008
- https://www.federalregister.gov/documents/full_text/text/2024/08/30/2024-19482.txt — 89 FR 70670: 122,936 respondents, 11,310,112 annual responses
- https://sam.gov/wage-determinations — the publisher of record

**Internal**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D1, D3, D5, D7, D8, D9, G3
- `run-2/phase-1-ideation/research/02-competition-positioning.md` §1.4, §2 item 6 — the surface already recorded as occupied
- `run-2/phase-2-build/CORRECTIONS.md` — §0.1 sourcing rule, §3.1 Scope A, R-HIGH7 assembly/latency/crosswalk
- `run-2/phase-2-build/architecture/CORPUS_DESIGN.md` §2.7, §6.2–§6.4, §7.1
- `run-2/phase-2-build/architecture/ARCHITECTURE.md` — the `/rates/[state]/[county]/[craft]` route and the `pages.rebuild` job
- `run-2/phase-2-build/identity/BRAND.md` §5.5, §5.6, §6.5, §8.3, C-B3

**Literature**

- Weinberg & Mares, *Traction* — Bullseye ring placement and cheap parallel tests — https://tractionbook.com/
- Hormozi, *$100M Offers* / Core Four — free content and paid ads are the two of four surviving A1–A6 — https://www.supersummary.com/100m-offers/summary/
- Dunford, *Obviously Awesome* — the page must sort the reader into the rate-of-record frame, not the form-filler frame — https://www.aprildunford.com/obviously-awesome
- Moore, *Crossing the Chasm* — beachhead before breadth; the 500-page cohort — https://www.geoffreyamoore.com/
- Ries, *The Lean Startup* — the cohort as one experiment with a pre-registered decision rule — http://theleanstartup.com/
- Poyar, *Growth Unhinged* — the free tool is the conversion surface; the metric is product-qualified starts, not sessions — https://www.growthunhinged.com/
