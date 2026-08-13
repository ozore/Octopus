# Demand and the Programmatic Surface — Ratepin

**Subject:** D8 channel 2 — what contractors search, who holds those results, whether a county × craft page set is defensible, how large it honestly is, and the templates, linking and refresh cadence that keep it out of Google's doorway and scaled-content categories.
**Method:** SERP inspection and primary-source fetching, in-session **2026-08-13**; sizing from `CORPUS_DESIGN.md` §2.7. Bound by `PLAN.md` A1–A6, `CORRECTIONS.md`, `BRAND.md` §5. Every forward-looking number is a hypothesis; nothing here asserts a traffic, ranking or conversion outcome.

---

## 1. What could not be measured, stated first

**No search-volume data was bought or used**, so this document carries no monthly-volume figures — inventing them is what `CORRECTIONS.md` §0.1 exists to prevent. What *is* measurable is **supply**: which pages Google returns and what they contain — the harder constraint, and the one that decides defensibility.

The only demand denominator we can source is the population, not the query: DOL's WH-347 clearance records **122,936 respondents** filing **11,310,112 annual responses** (89 FR 70670) — about **92 filings per filer per year**. Recurring and sourced, but small: a page set built for volume is the wrong instrument.

---

## 2. The five query families and who holds them

| Family | Query run | Returned, 2026-08-13 | Read |
|---|---|---|---|
| County rate lookup | `"Harris County" Texas davis bacon prevailing wage rate carpenter` | davisbaconwages.com (×2), davisbaconrates.com, dol.gov | Occupied by sites already doing what D8 proposes |
| Craft rate, named county | `"Los Angeles County" prevailing wage rate electrician 2026` | **dir.ca.gov** `OPRL/2026-1`, abcsocal.org, workyard.com | Intent collision — §4 |
| Form help | `how to fill out certified payroll WH-347` | **lcptracker.com ×2**, emarsinc.com, hammr.com | Incumbent content marketing |
| Fillable form | `WH-347 fillable form free download` | dochub, pdffiller (×3), pdfguru, formspal | **PDF-utility farms, not compliance vendors.** Volume without qualification |
| Filing mechanics | `DIR eCPR XML format upload certified payroll` | help.trimble.com, dir.ca.gov guideline PDFs, sunburstsoftwaresolutions.com | Vendor docs, not marketing — the only slack |

---

## 3. The surface is occupied, more heavily than `research/02` recorded

`research/02` named one occupant. Four contest it; two already ship what D8 proposes.

- **davisbaconwages.com** publishes our exact proposed hierarchy — `/state/wa`, `/state/wa/[county]`, `/state/wa/trade/[trade]` — with number and revision, **97 determinations, 39 counties, 3,220 trade rates** on Washington alone, CSV export, and *"Get an email when wage determinations covering Washington are modified"*: D8 channel 3, already shipping. It also links out to Washington L&I, so §4's disambiguation is table stakes.
- **davisbaconrates.com** claims **51 states/territories, 3,138 counties**, prints five provenance fields per rate — *"WD# TX20210253, Mod 12, effective 3 January 2025 — synced 8 July 2026"* — and re-syncs weekly. No revision history.
- **wagefinder.org** advertises **"492,044 Wages And Growing"**, weekly automatic updates, and an API for sale — within 3% of our projected ~479,000 county × class rows, so the raw index is demonstrably not scarce. **PrevailComply** holds the adjacent set: WA/CA/NY/IL guides plus a free WH-347 generator.

**Binding consequence: printing the WD number, mod and date on a public rate page is no longer differentiating.** It stays U1 on the *artifact* — no competitor prints it on the emitted WH-347 — but davisbaconrates.com reached the rate page first. `BRAND.md` §5.6 is a proof obligation, not a ranking advantage.

---

## 4. The highest-intent phrasing is often another regime's

`"Los Angeles County" prevailing wage rate electrician 2026` returns **California DIR** pages above everything else — correctly, because a California contractor asking that usually wants the *state* rate. D9 puts state regimes out of v1, so much of the literal `[county] [craft] prevailing wage` demand is demand we cannot serve and must not pretend to. The disambiguating tokens are *federal*, *Davis-Bacon*, *WH-347* and a WD number. **Target the federally-qualified query**, name the regime in the first line, and link out to the state regulator rather than answer for it.

---

## 5. Sizing the page universe honestly

From `CORPUS_DESIGN.md` §2.7, measured 2026-08-13: **4,236** active determinations; **14,195** county rows across them — (WD × county) pairs, **not** distinct counties; **56** state/territory codes, the state-hub ceiling; **33.8** mean classifications per WD (7–161); **9,424** revision documents, Σ(revision+1); and a projected county × class index of **~479,000** rows — the theoretical page ceiling.

Two derivations, checkable. **Supersession events: 9,424 − 4,236 = 5,188** — every modification across the active corpus, and the whole supply of the one story nobody else tells (§6.1). That is **1.1% of 479,000**. And **14,195 ÷ 4,236 = 3.35 counties per determination**, so county-level change events run to roughly 17,400 before asking how many classifications each modification actually moved.

**Publishing anything near 479,000 pages is indefensible.** The ceiling is not the plan; it is what the plan exists to avoid.

---

## 6. The thin-content problem, as Google states it

Fetched 2026-08-13. **Scaled content abuse** covers *"scraping feeds, search results, or other content to generate many pages (including through automated transformations…)"*. **Doorway abuse** covers *"creating substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy"*.

A page per county × craft that reformats a SAM table is both, verbatim — and reformatting is what the leading occupant says it does. Ours cannot differ by being prettier.

### 6.1 What only the mirror can produce

1. **The per-classification revision diff** — this craft's base and fringe at each revision of the determination covering this county, and when each changed. Absent from all four occupants: davisbaconwages.com's alert indexes *which* determinations moved, not what moved inside them; davisbaconrates.com prints the current mod only; SAM serves each revision as a separate document with no comparison view. R-HIGH7's **assembly** claim, rendered as a page.
2. **The supersession chain** — CA20260022 supersedes CA20250022 — one continuous rate history per county × craft instead of annual documents.
3. **Effectivity dates, rule stated and conclusion declined.** A revision issued *"less than 10 calendar days before the opening of bids… is effective… unless the agency finds that there is not a reasonable time still available"* (DOL). Showing *"Mod 4 published six days before your bid opening — whether it binds turns on a contracting-officer finding Ratepin cannot observe"* is D7 on a public surface, and is credible only because the dates are shown.
4. **The payroll-title crosswalk entry** — *"what does this determination call a sprinkler fitter?"* — seeded from O*NET's 1,595 alternate titles under SOC 47-2 (`CORPUS_DESIGN.md` §7.1).

**Publication gate, binding: a page ships only if it carries item 1 or item 4.** A page whose determination was never modified and whose craft has no crosswalk entry is a reformatted table and should not exist. Both inputs are columns, which is what makes the gate mechanisable rather than editorial — **but the build does not enforce it today**: the builder is `pages.rebuild`, specified in `ARCHITECTURE.md` §7.1 and absent from the app's job registry (`app/src/worker/jobs.ts`). Until that job exists and the gate is a condition inside it, this paragraph is a specification for a builder, not a description of one. The distinction matters here more than anywhere else in the document, because a gate nobody implements is precisely how ~500 reformatted tables get published.

---

## 7. Templates

**Counties covered by the same determination share one page, not one page each.** Their rates are byte-identical, so a page per county produces true duplicates. County stays a query token — county URLs exist, but as hubs that route rather than tables that repeat.

| # | Template | URL | Carries | Count |
|---|---|---|---|---|
| **T1** | State hub | `/rates/[state]` | Determinations in force, counties covered, latest mod dates, construction-type split | **56** |
| **T2** | County hub | `/rates/[state]/[county]` | *Which determinations cover you* — mod, publish date, last-changed date — plus §4 disambiguation | ≤ distinct counties (**to be measured**) |
| **T3** | Determination × construction type × craft family — the canonical rate page | `/rates/[state]/[county]/[craft]`, county variants canonicalised | Rate, **full revision history for that craft with dates**, covered counties, scope text, crosswalk titles | Gated by §6.1; bounded by **5,188** |
| **T4** | Determination change log | `/wd/[number]/changes` | Per-classification diff, revision by revision. **Links to sam.gov for the text; never reproduces it** | ≤ 4,236, revision ≥ 1 |

T4 is deliberately not `/wd/[number]`: SAM ranks its own per-revision URLs first. Link to the authority; hold what the authority does not compute. **Launch cohort (Moore, Ries): ~500 pages**, beachhead states, all four templates — one experiment with one decision at the end.

### 7.1 Internal linking

Link on **relations the corpus knows**, never on a generated grid. **T1 → T2 → T3** as a strict browseable hierarchy, whose absence is the defect Google's doorway text names. **T3 → sibling crafts inside that determination's own classification list** (containment, not alphabetics), and **→ the same craft in superseding and superseded determinations** — the time axis: our asset, nobody's grid. **T3 ↔ T4** both ways, **T4 → sam.gov** as canonical, **T2 → the state regulator** where the county sits under its own regime. **Every template → the free WH-347 generator**: one link, below the data, no interstitial, no email wall (`BRAND.md` C-B3). **No cross-links to unrelated counties** — that is the grid, and the grid is the doorway.

---

## 8. Refresh cadence, tied to corpus promotion

**Half the mechanism exists and the publishing half does not.** The nightly crawl and promotion are built and running — `ingest.corpus.nightly`, daily 02:00 ET, one staged transaction, in the app's job registry. The step that turns a promotion into pages, `pages.rebuild`, is specified in `ARCHITECTURE.md` §7.1 (*"skipped entirely if the snapshot did not promote"*) and **is not in the registry**. So the four rules below are the specification that job must be built to, written in the imperative on purpose: none of them is running.

1. **Rebuild on the promotion diff, not on a schedule.** Only pages whose rate rows changed regenerate. Re-stamping unchanged pages nightly is churn — which is what *"automated transformations… where little value is provided"* looks like from outside.
2. **Two dates, two facts.** `last verified` moves on every promotion; `last changed` only on a real rate change, and **sitemap `lastmod` carries `last changed`**. A sitemap claiming thousands of pages changed last night when they did not is a false machine-readable claim — the kind CL-2 is specified to catch, once CL-2 exists (`CORRECTIONS.md` §3.4; no linter is built today).
3. **Friday is the high-yield window.** DOL publishes changes *"generally on Friday"*, so Friday-night and Saturday promotions are when T4 earns its keep: a weekly publication with a real weekly event behind it.
4. **Staleness degrades the sentence, never the page.** Per `CORPUS_DESIGN.md` §6.4: at L1 the "as of" line narrows (P-C); at L2 the page renders from the last promoted snapshot with a dated narrowing — never blank, never silently stale.

---

## 9. Placement, and the criterion for killing this

Under Weinberg & Mares' Bullseye this is a **middle-ring** channel: four incumbents hold the surface, the highest-intent phrasing is partly another regime's, and defensible supply is ~1% of the naive ceiling. Under Hormozi's Core Four, A1–A6 delete both human-outreach quadrants, leaving free content and paid ads — which is why this channel keeps being reached for, and why it must be tested rather than assumed. Per Dunford, each page sorts the reader into the rate-of-record frame, not the form-filler frame, which is already occupied.

**Decision rule, pre-registered:** at 90 days, compare the T3/T4 diff-bearing cohort against the free-generator pages as a control arm on (a) share of published pages indexed, (b) impressions per page, (c) generator starts attributable to a `/rates/` entry. **Any template whose indexed share trails the control arm is deleted, not iterated.** No target values are asserted; asserting one would repeat the volume error.

**Constraints.** These pages are Scope A (`CORRECTIONS.md` §3.1): no figure without its source and as-of date in the same sentence, no rate without its determination (`BRAND.md` §6.5), no coverage claim before G3, nothing sold against a consequence.

---

## 10. Hypotheses, flagged

- **That the per-classification diff is something anyone searches for. Unmeasured, and load-bearing.** It may be wanted only by someone who already has the problem — in which case T4 is a retention asset that happens to be public, not an acquisition channel.
- That diff density per modification is high enough to fill T3 pages; and the distinct-county count (14,195 is pairs). Both computed at backfill.
- That incumbents on affiliate and API economics leave room for pages selling a $99–$599 subscription (`research/02` §6).

---

## References

**SERPs and competing supply, observed in-session 2026-08-13**

- https://davisbaconwages.com/state/wa/ — state/county/trade hierarchy, 97 determinations, 39 counties, 3,220 trade rates, per-WD revisions, CSV export, modification email alerts, links out to WA L&I
- https://davisbaconwages.com/state/tx/ · https://davisbaconwages.com/ — returned for the Harris County craft query
- https://davisbaconrates.com/prevailing-wage-rates — 51 states/territories, 3,138 counties, "WD# TX20210253, Mod 12, effective 3 January 2025 — synced 8 July 2026", weekly re-sync, no revision history
- https://wagefinder.org/ — "492,044 Wages And Growing", weekly automatic updates, API sold, operated by HCM TradeSeal
- https://prevailcomply.com/blog/washington-prevailing-wage-certified-payroll — adjacent guides plus a free WH-347 generator
- https://lcptracker.com/blog-post/faq-how-to-complete-the-revised-wh-347-form/ · https://lcptracker.com/blog-post/a-walkthrough-for-completing-the-wh-347-certified-payroll-report/ · https://emarsinc.com/blog/how-to-fill-out-form-wh-347-for-certified-payroll-reporting · https://www.hammr.com/blog/how-to-fill-out-a-wh-347-form-for-federal-projects · https://www.certifiedpayrollpro.com/wh-347-instructions — the form-help SERP
- https://www.dochub.com/fillable-form/15908-347-form · https://wh-347-form.pdffiller.com/ · https://pdfguru.com/plus/forms/wh-347-form · https://formspal.com/pdf-forms/us-dol-wh-347/ — the fillable-form SERP, held by PDF-utility farms
- https://www.dir.ca.gov/OPRL/2026-1/PWD/Determinations/Subtrades/LOS.html — the California state-regime page holding the county × craft query
- https://help.trimble.com/en/spectrum/spectrum/accounting/payroll/payroll-reports/certified-payroll-report/other-information-for-ecpr-file/ecpr-xml-format · https://www.dir.ca.gov/public-works/eCPRXMLGuideline1.9.pdf · https://sunburstsoftwaresolutions.com/california-dir-ecpr-prism-lcptracker-upload-feature-for-quickbooks.htm — the eCPR mechanics SERP
- https://sam.gov/wage-determination/CA20260022/2 — SAM's own per-revision URL, first for a WD-number query

**Primary sources, fetched 2026-08-13**

- https://developers.google.com/search/docs/essentials/spam-policies — scaled content abuse and doorway abuse, quoted in §6
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content — originality and extensive-automation self-assessment
- https://www.dol.gov/agencies/whd/government-contracts/prevailing-wage-resource-book/db-wage-determinations — "weekly updates, generally on Friday"; the 10-day pre-bid effectivity rule
- https://www.dol.gov/agencies/whd/forms/wh347 — OMB 1235-0008, expires 01/31/2028
- https://www.federalregister.gov/documents/full_text/text/2024/08/30/2024-19482.txt — 89 FR 70670: 122,936 respondents, 11,310,112 annual responses
- https://sam.gov/wage-determinations — the publisher of record

**Internal**

- `run-2/PLAN.md` A1–A6 · `phase-1-ideation/IDEA_DOSSIER.md` D1, D3, D5, D7, D8, D9, G3
- `phase-1-ideation/research/02-competition-positioning.md` §1.4, §6 — the surface already recorded as occupied
- `phase-2-build/CORRECTIONS.md` §0.1, §3.1 Scope A, CL-2, R-HIGH7
- `phase-2-build/architecture/CORPUS_DESIGN.md` §2.7, §6.4, §7.1 · `ARCHITECTURE.md` §7.1 `pages.rebuild`
- `phase-2-build/identity/BRAND.md` §5.5, §5.6, §6.5, §8.3, C-B3

**Literature**

- Weinberg & Mares, *Traction* — Bullseye ring placement, cheap parallel tests — https://tractionbook.com/
- Hormozi, *$100M Offers* / Core Four — free content and paid ads are the two of four surviving A1–A6 — https://www.acquisition.com/training/offers
- Dunford, *Obviously Awesome* — the page sorts the reader into a frame — https://www.aprildunford.com/obviously-awesome
- Moore, *Crossing the Chasm* — beachhead before breadth — https://www.geoffreyamoore.com/
- Ries, *The Lean Startup* — the cohort as one experiment with a pre-registered decision rule — http://theleanstartup.com/
- Poyar, *Growth Unhinged* — the free tool is the conversion surface; the metric is product-qualified starts, not sessions — https://www.growthunhinged.com/
