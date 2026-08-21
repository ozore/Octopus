# Run 3 — Deep validation: D9 Classfile (cycle 3, AI-native thesis)

Validated 2026-08-20/21 by four independent lenses under the two-class standard
(Class A = disqualifying fact; Class B = constraint to price and flank).
**Overall verdict: SURVIVES_RESHAPED — zero Class A findings.** Per-lens: mandate=SURVIVES_RESHAPED, corpus=SURVIVES_RESHAPED, competition=SURVIVES_RESHAPED, kill=SURVIVES_RESHAPED


---

## 01 Mandate & demand — verdict: SURVIVES_RESHAPED

## D9 Classfile — deep validation (demand lens), 2026-08-21

**Verdict: SURVIVES_RESHAPED. No Class A finding.**

### 1. The forcing function is real, named, and dated

The card leaned on ETIM-NA's soft line that Sonepar/Rexel/WESCO "increasingly expect" ETIM. That is marketing copy. The hard version exists and I fetched it: **Sonepar's own Product Data Guidelines, updated April 2026** (55-page PDF), section **7.1.2 "ETIM class and features are mandatory"**: *"When supplying product data to Sonepar, we expect each product to have an ETIM class and all ETIM features within the class to be completed."* Section 7.1.1: *"Sonepar always applies the latest version of ETIM, and aims to update to a new ETIM model within 6 months of its release"* — the ETIM 9→10 migration trigger the card hypothesised is written policy at the largest electrical distributor in the world. Section 4.5 says Sonepar will enable **ETIM xChange** intake; section 7.1.4 defines the exact way a supplier may leave a feature unfilled (see §5 below).

Germany: **Open Datacheck Elektro is owned by the VEG** (federal association of electrical wholesalers), operated by ITEK; manufacturers upload BMEcat/xChange/CSV/Excel, data is checked against the industry quality guideline before distribution, and every supplier carries a public 0–100 Scorecard. *"Die Nutzung der Plattform ist kostenpflichtig."* Netherlands: 2BA's manufacturer programme is six steps where **Step 4 = ETIM product classes, Step 5 = ETIM feature values**, and 2026 rates are €2,150–€5,070/yr + €250 one-off (re-verified today, identical to the card).

Forced budget exists; a named buyer-side mandate with completeness semantics exists. The "nobody can be made to pay" kill does not apply.

### 2. Buyer count — a live census, not an estimate

2BA's participant list is served by a public API (`api.2ba.nl/1/json/Participant/List?limit=9999&type=Datasupplier`). Pulled today: **1,384 data suppliers — 1,103 Fabrikant, 70 Importeur, 14 Agent, 195 Groothandel.** Of 1,173 manufacturers/importers/agents, 1,091 publish >0 products; median catalogue 387 SKUs; **485 sit in the card's 500–50,000 SKU target band.**

The same payload carries per-supplier `Step4` and `Step5` percentages, which map to the 2BA steps above. **Median Step4 (class assigned) = 100%. Median Step5 (feature values filled) = 74.5%, and 613 of 1,091 suppliers are below 80%.** That is the product's market, measured: classification is largely done, *feature completeness is not*, on a named, public, contactable list. This is the strongest demand evidence in the dossier and the miner did not have it.

Scale caveat: Netherlands ≈1,170 manufacturers; Germany's Open Datacheck reportedly ~350 manufacturers / 70+ wholesalers (secondary only — the ITEK participant-list URL 404s today). EU-wide addressable population is plausibly low thousands, not tens of thousands. Viable niche, not a large market. **Class B.**

### 3. Who pays today

Three shapes of paid supply, all confirmed live:

1. **Done-for-you agencies.** ITEK Consulting sells *"KI-basiert ETIM Klassifizierungen"* plus *"Erstellung von BMEcat Exporten wie z. B. BMEcat ETIM 2005 3.1 oder 4.0"* as data services, and a 2026-03-03 article pitches AI-assisted ETIM classification to industry with human QA (*"Die Ergebnisse werden anschließend fachlich geprüft und qualitätsgesichert"*). D&TS sells ETIM/ECLASS/UNSPSC classification and enrichment. Both are **quote-only, no public rate**.
2. **Authoring tools, self-serve-priced.** ETIM-Mapper's price endpoint, re-queried today by POST, returns exactly the card's numbers: e-start €1,228, standard €1,890 at 1,000 products; €6,652 at 20,000. It is an editor — a human still picks the class and types values.
3. **AI catalog-ops.** Rastro's pricing page today: manufacturers *"Starting at $1,000/month"*, up to 1,000 SKUs, first month a *"working trial with a dedicated implementation team"*, book-a-demo only. Card claim re-verified verbatim.

I could not find a single published per-article price for done-for-you ETIM classification in DE/NL/FR/EN. **Unproven, and it cuts both ways:** the absence of a self-serve price is the gap Classfile attacks, but it also means the €99/€399/€999 ladder has no external anchor.

### 4. Substrate: obtainable, today, no login

I downloaded and parsed the ETIM 10.0 all-sectors CSV release: **5,641 classes, 76,626 class↔feature mappings, 201,285 allowed class-feature-value combinations, 37,059 class synonyms** — the exact constrained-generation substrate, ODC-BY, no account. I also downloaded the **ETIM BMEcat Guideline V5.0.2 zip (contains `bmecat_etim_501.xsd`, 99 KB, plus ETIM7/8/9/10 sample files)** and the **ETIM xChange V2.0 package (JSON Schema, sample file, and a 113-page Country Specific Guidelines PDF dated 2026-04-30 that defines how each national organisation makes optional fields mandatory)**. That last document directly refutes the card's own open risk *"whether recipient-specific mandatory-field profiles can be maintained from public documentation alone"* — for xChange they are published. Only the *official certificate* is member-gated. AP6 drops from a structural risk to a nuisance.

### 5. What the miner missed (all Class B, one is a design correction)

- **B1 — the pool operator is the competitor and the channel.** ITEK simultaneously runs the VEG's platform, sets the Scorecard that defines "good data", and sells AI classification plus BMEcat generation. Same for 2BA's ecosystem. Not a kill (consulting-shaped, quote-only, single-country), but it prices the ceiling and makes "listed in data-pool software registries" a channel that a competitor controls.
- **B2 — abstain must be encoded, not blank.** Sonepar 7.1.4: an unfillable feature must be sent as `-` with `FVALUE_DETAILS` = **NA / MV / UN**. A design that "leaves the field empty" fails a mandatory-completeness profile and would break the refund-on-rejection guarantee. Classfile's honest-degradation path must emit ETIM's own not-applicable/missing-value markers with the abstain reason. This is a fix, and it makes the guarantee stronger.
- **B3 — France is a different artefact.** Sonepar states variant relations "cannot be exchanged via BMEcat but only via the Sonepar Product Relation Template Excel and in France via FABDIS"; FAB-DIS 3.0 is a standardised Excel, not BMEcat. A French recipient profile is a separate generator, not a config row.
- **B4 — national language versions are membership-gated** (ETIM licence page). Codes travel fine in BMEcat/xChange, so files are unaffected; localized captions/marketing text are not free.
- **B5 — citation rot.** The card's ITEK URL (`/services/ki-basierte-etim-services/`) 404s today; the live equivalents are `/beratung-und-services/datendienstleistungen` and `/aktuelles/ki-basierte-etim-klassifizierung-industrie`. Claim holds, source moved.

### 6. Reshape

Sell **feature-value completion on already-classified catalogues** (the measured pain: median 74.5%) ahead of first-time classification; price against the Scorecard/2BA data-label delta the customer can already see; ship abstain as NA/MV/UN; treat Sonepar's 6-month version policy as the recurring trigger. Class A untriggered: premises true against primary sources, corpus downloaded, no per-customer legal work, budget forced.

### References

1. https://www.sonepar.com/resource/blob/85322/fe30e0d95f507118ed1f2d344cc5b588/sonepar-product-data-guidelines-data.pdf — 2026-08-21 — Product Data Guidelines, updated April 2026; §7.1.2 "ETIM class and features are mandatory"; §7.1.1 latest-ETIM-within-6-months; §7.1.4 NA/MV/UN markers; §4.5 xChange intake.
2. https://api.2ba.nl/1/json/Participant/List?limit=9999&orderby=GLNName+asc,CompanyName+asc&type=Datasupplier — 2026-08-21 — live census: 1,384 data suppliers (1,103 manufacturers), 485 in 500–50k SKU band, median Step5 74.5%.
3. https://www.2ba.nl/nl/over-2ba/wat-biedt-2ba/voor-de-fabrikant/stappenplan-fabrikant/stappenplan-fabrikant-intro — 2026-08-21 — Step 4 = ETIM productklassen, Step 5 = ETIM kenmerkwaarden.
4. https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-the-manufacturers/rates-manufacturer/2ba-etim-combi/ — 2026-08-21 — 2026 rates €2,150–€5,070/yr, €250 one-off, indexed 4%.
5. https://itek.de/plattformen/open-datacheck-elektro — 2026-08-21 — VEG owns Open Datacheck Elektro, ITEK operates; BMEcat/CSV/Excel intake, quality check, Scorecard; paid participation.
6. https://itek.de/beratung-und-services/datendienstleistungen — 2026-08-21 — ITEK sells AI-based ETIM classification and BMEcat ETIM export as a service (no price).
7. https://itek.de/aktuelles/ki-basierte-etim-klassifizierung-industrie — 2026-08-21 — 2026-03-03: AI proposes classes/features, results human-QA'd; contact-us only.
8. https://www.rastro.ai/pricing — 2026-08-21 — manufacturers "Starting at $1,000/month", ≤1,000 SKUs, demo-only, dedicated implementation team.
9. https://etim-mapper.com/pricing (POST accountType/productsLimit) — 2026-08-21 — e-start €1,228 / standard €1,890 at 1,000 products; €6,652 at 20,000.
10. https://www.etim-international.com/wp-content/uploads/2024/12/ETIM-10.0-ALL-SECTORS-CSV-METRIC-EI-2024-12-05.zip — 2026-08-21 — downloaded and parsed: 5,641 classes, 76,626 feature maps, 201,285 value maps, 37,059 synonyms.
11. https://www.etim-international.com/wp-content/uploads/2021/09/ETIM-BMEcat-Guideline-V5-0-2-2024-12-12.zip — 2026-08-21 — contains bmecat_etim_501.xsd + ETIM 7/8/9/10 sample files, free.
12. https://www.etim-international.com/wp-content/uploads/2025/11/ETIM-xChange_V2.0-2026-04-30.zip — 2026-08-21 — JSON Schema + 113-page Country Specific Guidelines (national mandatory-field rules), free.
13. https://www.etim-international.com/classification/license-info/ — 2026-08-21 — ODC-BY, commercial use permitted with attribution; national translations membership-gated.
14. https://dundts.com/en/dataservices/classification/ — 2026-08-21 — ETIM/ECLASS/UNSPSC classification service, quote-only, no prices.
15. https://platform.claude.com/docs/en/about-claude/pricing — 2026-08-21 — Haiku 4.5 $1/$5 per MTok, Batch $0.50/$2.50, cache read 0.1x.

### Proven (primary source)

- Forcing function is documented, not inferred: Sonepar Product Data Guidelines (updated April 2026, fetched today) section 7.1.2 is titled 'ETIM class and features are mandatory' and requires each product to have an ETIM class with all class features completed.
- Sonepar commits in writing to adopting each new ETIM model within 6 months of release (§7.1.1) — the ETIM 9→10-style migration trigger is a standing, datable event, not a hypothesis.
- Sonepar §4.5 states it will enable ETIM xChange intake into its onboarding portal, validating xChange as a live output format and not a future standard.
- German channel: Open Datacheck Elektro is owned by the VEG (electrical wholesalers' federation) and operated by ITEK; manufacturers upload BMEcat/xChange/CSV/Excel, data is quality-checked before distribution, participation is paid, and each supplier carries a public 0-100 data-quality Scorecard.
- Dutch channel: 2BA's manufacturer programme defines Step 4 = ETIM product classes and Step 5 = ETIM feature values; 2026 manufacturer rates re-verified unchanged at €2,150–€5,070/yr plus €250 one-off.
- Buyer population is enumerable and was enumerated live: 2BA's public participant API returns 1,384 data suppliers, of which 1,103 Fabrikant + 70 Importeur + 14 Agent; 1,091 publish products; 485 fall in the card's 500–50,000 SKU band.
- The pain is measurable on that population: median Step4 (class assigned) is 100% but median Step5 (feature values filled) is 74.5%, and 613 of 1,091 suppliers are below 80% — i.e. the unmet need is feature completion, not first-time classification.
- Rastro's $1,000/month manufacturer price, ≤1,000 SKUs, demo-only with a dedicated implementation team, re-verified verbatim on its live pricing page today.
- ETIM-Mapper's price endpoint reproduced the card's figures exactly by direct POST today: €1,228 e-start / €1,890 standard at 1,000 products, €6,652 standard at 20,000.
- Corpus and schemas are obtainable with no login: downloaded ETIM 10.0 all-sectors CSV (5,641 classes, 76,626 class-feature mappings, 201,285 allowed value combinations, 37,059 synonyms), the ETIM BMEcat Guideline V5.0.2 zip containing bmecat_etim_501.xsd and ETIM 7/8/9/10 sample files, and the ETIM xChange V2.0 package containing the JSON Schema and a 113-page Country Specific Guidelines PDF dated 2026-04-30.
- Recipient mandatory-field profiles are publicly documented for xChange (the Country Specific Guidelines define how each national organisation makes optional fields mandatory), refuting the card's own open risk that these profiles might be unmaintainable from public sources.
- Agencies sell this work today: ITEK Consulting offers AI-based ETIM classification plus BMEcat ETIM export as a data service, and D&TS sells ETIM/ECLASS/UNSPSC classification and enrichment.
- Claude Haiku 4.5 pricing re-verified today at $1/$5 per MTok, Batch $0.50/$2.50, cache reads at 0.1x — the card's per-SKU inference economics stand.

### Unproven

- No published per-article or per-SKU price for done-for-you ETIM classification could be found anywhere in DE/NL/FR/EN — ITEK, D&TS, nexoma, nextPIM, Sales Layer and Rastro are all quote-or-demo-only. The €99/€399/€999 self-serve ladder therefore has no external price anchor, and willingness to buy without a call remains untested.
- Total EU buyer population: only the Dutch pool could be counted exactly (≈1,173 manufacturers/importers/agents). The frequently repeated '350+ manufacturers, 70+ wholesalers, 5.5m products' figures for Open Datacheck come from secondary sources; the ITEK participant-list page 404s today, so the German count is unverified.
- ETIM International publishes no count of manufacturers supplying ETIM-classified data (about-us and users pages carry member-organisation and language counts only, no company statistics).
- Whether 2BA's Step4/Step5 API percentages are precisely 'class assigned' and 'feature values filled' completeness scores is a high-confidence inference from the 2BA six-step manufacturer programme, not a documented field definition.
- FAB-DIS: no primary confirmation of a mandatory 2026 switch date to version 3.0 or of ETIM fields being required inside FAB-DIS; the fabdis.fr 2026 page lists feature changes only.
- Per-class accuracy achievable on messy scanned datasheets, and the true rate at which an abstain-heavy file still passes a recipient's mandatory-completeness profile, remain untested.
- Search volume and commercial intent for the proposed SEO wedge queries were not measured.

### Findings (with class)

- **[B]** Pool operator is both channel and competitor: ITEK runs the VEG-owned Open Datacheck platform, defines the Scorecard that grades supplier data quality, and sells AI-based ETIM classification plus BMEcat export as a consulting service (article dated 2026-03-03, services page live today). It can bundle at zero marginal distribution cost inside the very platform Classfile's customers must upload to. Constrains price and makes 'get listed in data-pool software registries' a channel a competitor controls. Not a kill: quote-only, consulting-shaped, human-QA'd, single-market.
- **[B]** Honest degradation as designed would break the delivery guarantee. Sonepar §7.1.4 requires an unfillable feature to be sent as '-' with FVALUE_DETAILS set to NA (not applicable), MV (missing value) or UN (unknown); a silently blank field fails a mandatory-completeness profile. Classfile's abstain path must emit ETIM's own markers with the abstain reason rather than leaving fields empty, otherwise 'we only ship files that pass validation' and the refund-on-rejection promise are unachievable. Design correction, not a kill.
- **[B]** Addressable population is finite and countable: ~1,173 manufacturer-side data suppliers in the Dutch pool, 485 in the target SKU band; EU-wide plausibly low thousands. Supports a niche business at the proposed price points, not a large one. Constrains ambition and argues for multi-country recipient coverage early.
- **[B]** France needs a second artefact: FAB-DIS is a standardised Excel, not BMEcat, and Sonepar states some data (variant relations) can only be exchanged via FABDIS in France. A French recipient profile is a separate generator rather than a configuration row, expanding scope beyond the card's estimate.
- **[B]** National language versions of the ETIM model are membership-gated (licence page). Codes travel fine in BMEcat/xChange so generated files are unaffected, but any promise of localized feature captions or multilingual marketing text requires national membership or a separate source.
- **[B]** The market prices this work by quote only — no competitor publishes a per-article rate. The self-serve wedge is genuinely open, but it also means no evidence exists that this buyer will transact without a conversation; the card itself lists this as unproven and my research did not close it.

### References

- https://www.sonepar.com/resource/blob/85322/fe30e0d95f507118ed1f2d344cc5b588/sonepar-product-data-guidelines-data.pdf (fetched 2026-08-21) — Sonepar Product Data Guidelines, updated April 2026: §7.1.2 'ETIM class and features are mandatory'; §7.1.1 adopts each new ETIM model within 6 months; §7.1.4 NA/MV/UN markers for unfillable features; §4.5 ETIM xChange intake planned.
- https://api.2ba.nl/1/json/Participant/List?limit=9999&orderby=GLNName+asc,CompanyName+asc&type=Datasupplier (fetched 2026-08-21) — Live 2BA participant census: 1,384 data suppliers (1,103 Fabrikant, 70 Importeur, 14 Agent, 195 Groothandel); 485 manufacturers in the 500-50,000 SKU band; median Step4 100%, median Step5 74.5%, 613/1,091 below 80%.
- https://www.2ba.nl/nl/over-2ba/wat-biedt-2ba/voor-de-fabrikant/stappenplan-fabrikant/stappenplan-fabrikant-intro (fetched 2026-08-21) — 2BA six-step manufacturer programme: Step 4 = ETIM productklassen, Step 5 = ETIM kenmerkwaarden (basis for interpreting the API's Step4/Step5 scores).
- https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-the-manufacturers/rates-manufacturer/2ba-etim-combi/ (fetched 2026-08-21) — 2026 manufacturer rates re-verified: Logo-Deeplink €2,150/€2,529; 2BA & ETIM Combi €2,756-€5,070 by headcount; €250 one-off; UOB €5,508/yr + €5,000 startup; 4% indexation.
- https://itek.de/plattformen/open-datacheck-elektro (fetched 2026-08-21) — Open Datacheck Elektro owned by the VEG (electrical wholesalers' federation), operated by ITEK; manufacturers deliver BMEcat/CSV/Excel; quality check, Scorecard 0-100; platform use is paid.
- https://itek.de/plattformen/open-datacheck-elektro/open-datacheck-elektro-fuer-hersteller (fetched 2026-08-21) — Manufacturer view: upload in BMEcat, xChange, CSV or Excel; checked against defined quality guideline with a Prüfprotokoll before forwarding; flat participation fee regardless of product count.
- https://itek.de/beratung-und-services/datendienstleistungen (fetched 2026-08-21) — ITEK Consulting sells 'KI-basiert ETIM Klassifizierungen' and 'Erstellung von BMEcat Exporten (BMEcat ETIM 2005 3.1 / 4.0)' as data services; no public pricing.
- https://itek.de/aktuelles/ki-basierte-etim-klassifizierung-industrie (fetched 2026-08-21) — ITEK article dated 2026-03-03: AI proposes ETIM classes and feature values from existing product information, results then human-checked and quality-assured; contact-only, no price.
- https://www.rastro.ai/pricing (fetched 2026-08-21) — Manufacturer PIM 'Starting at $1,000/month', up to 1,000 SKUs, first month a working trial with a dedicated implementation team; distributors $1,000/mo platform fee plus per-SKU enrichment; demo-only.
- https://etim-mapper.com/pricing (fetched 2026-08-21) — Live price endpoint (POST accountType/productsLimit) returned EUR 1,228 (e-start, 1,000 products), 1,890 (standard, 1,000), 6,652 (standard, 20,000) — card figures reproduced exactly.
- https://www.etim-international.com/wp-content/uploads/2024/12/ETIM-10.0-ALL-SECTORS-CSV-METRIC-EI-2024-12-05.zip (fetched 2026-08-21) — Downloaded and parsed without login: 5,641 ETIM classes, 76,626 class-feature mappings, 201,285 allowed class-feature-value combinations, 37,059 class synonyms.
- https://www.etim-international.com/wp-content/uploads/2021/09/ETIM-BMEcat-Guideline-V5-0-2-2024-12-12.zip (fetched 2026-08-21) — Free download containing bmecat_etim_501.xsd (99 KB), the V5.0 guideline PDF, element overview xlsx, and ETIM 7/8/9/10 sample catalogue XML files.
- https://www.etim-international.com/wp-content/uploads/2025/11/ETIM-xChange_V2.0-2026-04-30.zip (fetched 2026-08-21) — Free download containing ETIM xChange V2.0 JSON Schema, sample file, code lists, and a 113-page Country Specific Guidelines PDF (2026-04-30) defining how each national organisation makes optional fields mandatory.
- https://www.etim-international.com/classification/license-info/ (fetched 2026-08-21) — ETIM Classification Model under Open Data Commons Attribution Licence: commercial use, adaptation and redistribution permitted with attribution; national language versions require national membership.
- https://www.etim-international.com/downloads/?_sft_downloadcategory=standardisation-guidelines (fetched 2026-08-21) — Standardisation guidelines download index listing the free BMEcat V5.0.2, xChange V2.0/V1.1, IXF 3.1 and dynamic-release documents.
- https://dundts.com/en/dataservices/classification/ (fetched 2026-08-21) — D&TS sells classification and mapping services for ECLASS BASIC/ADVANCED, ETIM and UNSPSC plus data cleansing and ongoing maintenance; no pricing disclosed, free-consultation CTA.
- https://www.etim-international.com/about-us/ (fetched 2026-08-21) — 20 member organisations, 21 countries, 17 languages; no company or manufacturer counts published.
- https://fabdis.fr/fr/nouveautes-2026/ (fetched 2026-08-21) — FAB-DIS 2026 feature changes for FAB-DIS 3.0 file exchange; no mandatory migration date and no ETIM requirement stated on the page.
- https://platform.claude.com/docs/en/about-claude/pricing (fetched 2026-08-21) — Claude Haiku 4.5 $1/MTok input, $5/MTok output; Batch API 50% discount ($0.50/$2.50); cache reads at 0.1x base input.

---

## 02 Corpus & technical premise — verdict: SURVIVES_RESHAPED

## D9 — Classfile: deep validation (technical/data premise)

**Verdict: SURVIVES_RESHAPED.** No Class A finding. Every load-bearing data claim on the card was independently re-verified today, several by downloading and executing against the artifacts rather than reading marketing copy. The reshaping comes from three things the miner got wrong or missed: the format versions are newer than the card says, the "recipient profile library" moat is a public spreadsheet, and the card's proposed free-validator funnel is **already built and sold by someone else**.

### 1. ETIM model access — PROVEN, stronger than claimed

`etim-international.com/classification/license-info/` states verbatim: the ETIM Classification Model and ETIM MC extension "are made available under the Open Data Commons Attribution Licence… The ETIM model is free to use for everyone," free to share, create and adapt with attribution. No login. I did not take this on faith: I fetched `ETIM-10.0-ALL-SECTORS-CSV-METRIC-EI-2024-12-05.zip` (HTTP 200, 2,895,379 bytes, no auth) and parsed it. It contains **5,640 classes, 17,377 features, 16,163 values, 76,625 class→feature mappings with feature type (A/L/N/R) and unit, 201,284 class-feature→allowed-value rows, 37,058 class synonyms, 188 units**. That is exactly the constrained-generation substrate the AI core assumes — the "shortlist candidate classes by synonym embedding, then emit only values from the class's allowed list" design is executable from this file alone. Card said "5,500+ classes"; actual 5,640.

The ETIM REST API is a red herring either way: `GET etimapi.etim-international.com/api/v2/Misc/Releases` returns **401** (card correct), but the API is a convenience over a dataset you can download in full.

### 2. Spec availability — the card understated what is public

The card's risk note ("we must implement our own validator from the published XSD") is right about the gate but wrong about the difficulty. From the *public* downloads page, no login:

- `ETIM-BMEcat-Guideline-V5-0-2-2024-12-12.zip` → contains **`bmecat_etim_501.xsd` (99 KB)**, the V5.0 guideline PDF, an element-overview xlsx, and sample files for ETIM 7/8/9/10. I compiled the XSD with lxml and validated the official ETIM-10 sample: **VALID**.
- `ETIM-xChange_V2.0-2026-04-30.zip` → contains **`ETIM xChange_Schema_V2.0.json` (62 KB, JSON Schema draft 2020-12), Apache-2.0 licensed**, plus a sample file, 32 code-list workbooks, and a 113-page country-specific-regulations PDF. I ran `jsonschema.Draft202012Validator` over the official sample: **0 errors**.
- `bmecat_etim_40.xsd` is served directly at the schemaLocation URL (HTTP 200, 86 KB).

**Card errors:** the current guideline is **V5.0.2** (XSD `bmecat_etim_501`), not "BMEcat 4.0" — 4.0 is the legacy profile still in live use. And xChange is at **V2.0**, not 1.1 as the card's incumbent framing implies. Neither is fatal; both mean the "recipient profile" surface is bigger than budgeted.

### 3. Acceptance test — machine-verifiable, but with a commercial caveat

Conformance *is* fully machine-checkable from public artifacts. Proof: I downloaded a real, in-production manufacturer catalogue — IDE Electric's `BMECat_4.0_v8.0_IDE_010226_EXP_WOP.xml`, 27.5 MB, generated 2026-01-23, no login — and validated it against ETIM's own public XSD. Result: **invalid UTF-8 bytes at line 23, illegal control characters at line 595,214, and 3,943 schema errors** (misplaced `DAILY_PRICE`). A file a manufacturer publishes to wholesalers today fails the standard's own schema in four thousand places. That is the wedge, demonstrated, not asserted.

The `ETIM xChange_OverviewElements_V2.0.xlsx` is a machine-readable **366-element × 19-country mandatory/optional matrix** (AT, AU/NZ, BE, CH, DE, DK, ES, FI, FR, HU, IT, NA, NL, NO, PL, PT, SE, SI, UK). The card listed "whether recipient mandatory-field profiles can be maintained from public documentation" as unproven — for *country* profiles it is now proven. Per-*wholesaler* quirks remain unproven.

**Class B caveat:** the authoritative acceptance is not the XSD but the recipient pool's ingest. 2BA validates automatically on each delivery and returns a processing report, Deep Scan and a Data Label score — but inside the manufacturer's own 2BA account. So the refund-on-rejection guarantee is written against a validator Classfile cannot fully replicate. Scope the guarantee to "the published ETIM guideline + the country matrix," state that in checkout, and it stays honest.

**A1/A6 friction — real but fixed-cost, not per-customer.** The language table (fetched today) shows only EI, nl-BE, fr-BE, fi-FI, it-IT and nb-NO are "Open to all." **nl-NL, de-DE, fr-FR, es-ES, sv-SE, pl-PL, en-GB, en-US and six others require national membership.** This does *not* break the product: BMEcat/xChange carry ETIM *codes* (I confirmed on the IDE file — `EF000010 = EV002727`), which are language-neutral and in the free master. Translations affect the reviewer-facing UI, not file correctness. And 2BA's own "2BA & ETIM Combi" contract explicitly includes Dutch ETIM translation access — the customer already has it. Membership is a one-time vendor cost amortised across all customers; A6 holds.

**New platform risk the miner missed (Class B).** ETIM Deutschland's front page announces "Das deutsche ETIM-Sprachmodell wird zur Mitgliederleistung" — German model use is being bound to membership. And a dated notice (2026-04-15) states verbatim for *Fördermitglieder* (the IT-service-provider class Classfile would join): "Die deutsche ETIM-API kann in diesem Kontext **ausschließlich zum Training von KI-Modellen** genutzt werden. Die Nutzung erfolgt **kostenpflichtig**." A national ETIM body has explicitly carved out — and priced — AI training on its model. Validating for the thesis; a cost and a dependency for DE.

### 4. Fine-tune / eval corpus — premise holds, scale unproven

Zero-human-label corpus assembly is real. The IDE file yields **3,827 (description → EC class) pairs and 70,470 (class, feature-code, value-code) triples**, already coded. PC Electric publishes a 77 MB ETIM-10.0 / Guideline-5.0 BMEcat with **9,622 articles**, dated 2026-04-01. Two manufacturers, found in minutes, no login: ~13,400 labelled articles. Reaching 200k–1M needs roughly 50–150 such publishers; plausible, not demonstrated. 2BA is *not* an open-data source — its pool is contract-gated.

### 5. AP5 gap — the funnel is occupied (Class B, sharpest finding)

The card's distribution plan is "free BMEcat/xChange validator + ETIM class browser as link bait." Both already exist:

- **bmecat-validator.com** ("ETIM BMEcat Validator 1.7"): validates against XSD *and* the ETIM BMEcat International Guidelines, versions 2.2/3.0/3.1/4.0/5.0 across **22 country variants**, with auto-detection; free up to 16 KB; a REST API at **€99 one-time activation, €49 per extra API user**, plus purchased validation packages.
- **Rastro** — a named incumbent — already ships a **free, no-login ETIM Classification Checker** with a country-profile selector covering 15 countries, CSV and BMEcat XML upload, checking completeness, feature validity, values and units.

So the validator and the country-profile library are not moat; they are table stakes already on the board. The defensible remainder is narrower and still real: *generation* from datasheet PDFs with per-value provenance, the per-class accuracy eval harness, and the self-serve price point. Rastro at "$1,000/month for 1,000 SKUs" and ETIM-Mapper's live API (re-queried today: `POST /pricing accountType=standard&productsLimit=1000` → `{"EUR":1890}`) leave a wide gap under them.

Commercial premise re-verified live: 2BA 2026 rates unchanged (€2,150/€2,529 Logo-Deeplink; €2,756–€5,070 Combi; €250 one-off; "2026 rates indexed at 4%"). Haiku 4.5 confirmed $1/$5, Batch $0.50/$2.50, cache read 0.1× — the card's ~$0.005/SKU stands.

**A3 honest degradation:** the design is sound — provenance pointer + confidence per value, abstain below threshold, runner-up classes shown, download gated on validator pass. Two fixes: scope the refund guarantee to published rules (above), and surface the *guideline* version and country profile used, since 4.0/5.0/xChange-1.1/2.0 coexist in production.


### Proven (primary source)

- ETIM Classification Model is ODC-BY 1.0, 'free to use for everyone', no membership — license page fetched 2026-08-21.
- ETIM 10.0 model is downloadable with no login: ETIM-10.0-ALL-SECTORS-CSV-METRIC-EI-2024-12-05.zip, HTTP 200, 2,895,379 bytes, fetched and unpacked 2026-08-21.
- The downloaded model contains 5,640 classes, 17,377 features, 16,163 values, 76,625 class-feature mappings (with feature type and unit) and 201,284 class-feature allowed-value rows plus 37,058 synonyms — the exact constrained-generation substrate the card's AI core assumes.
- The ETIM BMEcat XSD is PUBLIC, not member-gated: bmecat_etim_501.xsd (99 KB) ships inside the no-login ETIM-BMEcat-Guideline-V5-0-2 zip; bmecat_etim_40.xsd is served directly at its schemaLocation URL (HTTP 200).
- I compiled bmecat_etim_501.xsd with lxml and validated ETIM's own ETIM-10 sample file: VALID. Machine verification of BMEcat conformance from public artifacts works.
- The ETIM xChange V2.0 JSON Schema is PUBLIC and Apache-2.0 licensed; I validated ETIM's official sample against it with jsonschema Draft202012Validator: 0 errors.
- Country-specific mandatory-field profiles ARE maintainable from public documentation: ETIM xChange_OverviewElements_V2.0.xlsx is a 366-element x 19-country mandatory/optional matrix, plus a 113-page public country-regulations PDF. (Card listed this as 'not yet proven'.)
- Real manufacturer catalogues fail the standard's own public schema: IDE Electric's live 27.5 MB BMEcat (generated 2026-01-23, no login) has invalid UTF-8 bytes, illegal control characters, and 3,943 XSD errors. The pain is demonstrable, not asserted.
- Zero-human-label corpus is real: the IDE file alone yields 3,827 (description -> EC class) pairs and 70,470 coded (class, feature, value) triples; PC Electric publishes a 77 MB ETIM-10.0/Guideline-5.0 BMEcat with 9,622 articles dated 2026-04-01.
- ETIM feature values travel as language-neutral codes (EF000010 = EV002727 observed in the IDE file), so national-language gating does not block correct file generation.
- Official ETIM xChange validation and BMEcat certification tools ARE member-gated (card correct, verbatim from tools page).
- ETIM API requires credentials: /api/v2/Misc/Releases returns HTTP 401 (card correct); irrelevant since the full model is a free download.
- 2BA 2026 manufacturer rates re-verified today, unchanged from the card: Logo-Deeplink EUR 2,150/2,529; 2BA & ETIM Combi EUR 2,756-5,070 by headcount; EUR 250 one-off; UOB EUR 5,508/yr + EUR 5,000 setup; '2026 rates indexed at 4%'. Forced budget exists.
- 2BA & ETIM Combi includes Dutch ETIM translation access for the manufacturer — the NL customer already holds the gated language version.
- ETIM-Mapper's live price API re-queried today (POST /pricing, accountType=standard&productsLimit=1000) returns {"EUR":1890,"PLN":7560,"USD":2268}. Self-serve substitute budget confirmed.
- Claude Haiku 4.5 pricing confirmed live: $1/MTok in, $5/MTok out; Batch API 50% off ($0.50/$2.50); cache read 0.1x. The card's ~$0.005/SKU inference math stands.
- 2BA validation on delivery is automated and reported (processing report, Deep Scan, Data Label score) — inside the manufacturer's own account, not the seller's.

### Unproven

- Corpus scale: 200k-1M labelled article records. Two publishers found in minutes give ~13,400 articles; reaching target needs ~50-150 freely-publishing manufacturers. Plausible, not demonstrated.
- Legal basis for training on manufacturers' published BMEcat files: those files carry no explicit licence (unlike the ODC-BY model). The card flags this; I could not find a licence statement on either publisher's download.
- ETIM national membership fees. A search snippet quotes EUR 3,300/yr for ETIM Deutschland but no primary page publishes it (itek.de membership pages return 404; etim.de/mitwirken lists benefits, not fees). Cost of the DE/NL language unlock is unquantified.
- Price of ETIM Deutschland's new paid AI-training channel for Foerdermitglieder — the notice says 'Weitere Details ... werden separat kommuniziert'.
- Per-wholesaler (as opposed to per-country) mandatory-field quirks — the public matrix is national-level only.
- Whether a recipient data pool's ingest can reject a file that passes the published guideline + country matrix, which is exactly the exposure of the refund-on-rejection guarantee.
- True per-class accuracy on messy scanned datasheets (card's own open item; unchanged).
- Whether EU product-data managers will buy at EUR 99-999/mo with no call (card's own open item; unchanged).

### Findings (with class)

- **[B]** Language gating on the two biggest target markets. Only EI, nl-BE, fr-BE, fi-FI, it-IT and nb-NO are 'Open to all'; nl-NL, de-DE, fr-FR, es-ES, sv-SE, pl-PL, en-GB, en-US and six more require national membership. NOT a kill: BMEcat/xChange carry language-neutral ETIM codes (verified in a live file), so file correctness is unaffected; translations only affect reviewer-facing UI, and the NL customer already gets Dutch access inside their 2BA Combi contract. Membership is a fixed vendor cost amortised over all customers, so A6 (no per-customer human work) holds.
- **[B]** ETIM Deutschland is tightening and monetising AI use of its model. Front-page notice: 'Das deutsche ETIM-Sprachmodell wird zur Mitgliederleistung'; and a dated 2026-04-15 notice states for Foerdermitglieder (the IT-service-provider class Classfile would join) verbatim: 'Die deutsche ETIM-API kann in diesem Kontext ausschliesslich zum Training von KI-Modellen genutzt werden. Die Nutzung erfolgt kostenpflichtig.' A national ETIM body has explicitly carved out and priced AI training. Validating for the thesis, but an unpriced dependency for the German market and a signal other national orgs may follow.
- **[B]** AP5 miss: the card's proposed free-validator funnel already exists commercially. bmecat-validator.com ('ETIM BMEcat Validator 1.7') validates against XSD plus the ETIM BMEcat International Guidelines across 22 country variants and guideline versions 2.2-5.0 with auto-detection, free to 16 KB, REST API at EUR 99 one-time activation + EUR 49 per extra API user plus paid validation packages. The validator is table stakes, not moat.
- **[B]** AP5 miss: Rastro — a competitor the card already names — ships a free, no-login 'ETIM Classification Checker' with a 15-country profile selector, CSV and BMEcat XML upload, checking completeness, feature validity, values and units. The incumbent has already deployed the exact lead magnet and has already publicly encoded the card's moat leg (b).
- **[B]** Moat leg (b) 'recipient profile library' is a published spreadsheet: ETIM xChange_OverviewElements_V2.0.xlsx gives a 366-element x 19-country mandatory/optional matrix free of charge. Good for feasibility, bad for defensibility — anyone can rebuild it in an afternoon. The defensible remainder is generation-with-provenance plus the per-class eval harness, not the profile library.
- **[B]** Guarantee exposure: schema conformance is machine-verifiable from public artifacts (proved), but commercial acceptance is the recipient pool's ingest (2BA processing report / Deep Scan / Data Label), which runs inside the customer's account against rules not fully public. The refund-on-rejection promise is written against a validator Classfile cannot fully replicate. Fix by scoping the guarantee explicitly to the published guideline plus country matrix.
- **[B]** Version errors on the card. 'ETIM BMEcat 4.0' is the legacy profile; the current guideline is V5.0.2 with XSD bmecat_etim_501.xsd. ETIM xChange is at V2.0 (country guidelines dated 2026-04-30), not 1.1. Class count is 5,640, not '5,500+'. Both 4.0 and 5.0 are in live production use, so the recipient-profile surface is larger than the card budgets.

### References

- https://www.etim-international.com/classification/license-info/ (fetched 2026-08-21) — ODC-BY 1.0 for the ETIM model, 'free to use for everyone'; plus the full language-version access table — only EI, nl-BE, fr-BE, fi-FI, it-IT, nb-NO are 'Open to all', 14 versions require national membership; xChange licensed Apache-2.0.
- https://www.etim-international.com/downloads/?_sft_downloadcategory=model-releases (fetched 2026-08-21) — Model-release download index; direct .zip hrefs with no login (curl HTTP 200, 389 KB page).
- https://www.etim-international.com/wp-content/uploads/2024/12/ETIM-10.0-ALL-SECTORS-CSV-METRIC-EI-2024-12-05.zip (fetched 2026-08-21) — Downloaded (HTTP 200, 2,895,379 bytes) and parsed: 5,640 classes, 17,377 features, 16,163 values, 76,625 class-feature maps, 201,284 allowed-value rows, 37,058 synonyms, 188 units.
- https://www.etim-international.com/wp-content/uploads/2021/09/ETIM-BMEcat-Guideline-V5-0-2-2024-12-12.zip (fetched 2026-08-21) — Public, no login: contains bmecat_etim_501.xsd (99 KB), V5.0 guideline PDF, element-overview xlsx and ETIM 7/8/9/10 sample files. XSD compiled and ETIM-10 sample validated VALID.
- https://www.etim-international.com/wp-content/uploads/2025/11/ETIM-xChange_V2.0-2026-04-30.zip (fetched 2026-08-21) — Public, no login: ETIM xChange Schema V2.0 (JSON Schema 2020-12, Apache-2.0), official sample (validated 0 errors), 32 code-list workbooks, 113-page country-specific regulations PDF, and the 366-element x 19-country mandatory/optional overview xlsx.
- https://www.etim-international.com/bmecat_etim_40.xsd (fetched 2026-08-21) — Legacy BMEcat 4.0 XSD served directly at its schemaLocation URL (HTTP 200, 86,030 bytes); compiled successfully with lxml.
- https://www.etim-international.com/tools/ (fetched 2026-08-21) — Confirms card: 'The online ETIM xChange validation tool is free of charge but exclusively available to ETIM members'; BMEcat Certification Tool likewise member-only. CMT and ETIM Viewer open to all.
- https://etimapi.etim-international.com/api/v2/Misc/Releases (fetched 2026-08-21) — HTTP 401 — ETIM API requires credentials (card correct); swagger/v2/swagger.json is public (HTTP 200, 26 endpoints).
- https://ide.es/download.php?file=BMECat_4.0_v8.0_IDE_010226_EXP_WOP.xml (fetched 2026-08-21) — Live manufacturer BMEcat, 27,517,086 bytes, generated 2026-01-23, ETIM 8.0, no login. 3,827 products, 90 EC classes, 532 EF features, 70,470 coded feature values. Fails the public XSD with 3,943 errors plus invalid UTF-8 and control characters.
- https://www.pcelectric.at/en/info/bmecat.html (fetched 2026-08-21) — Second free corpus source: PC Electric main catalogue 2026/27 BMEcat, Guideline 5.0 basis, ETIM 10.0, English, 9,622 articles, file dated 2026-04-01, ~77 MB.
- https://etim.de/information-zur-etim-api-ab-dem-15-04-2026/ (fetched 2026-08-21) — Verbatim: 'Fuer Foerdermitglieder aendern sich ab dem 15.04.2026 die Rahmenbedingungen ... Die deutsche ETIM-API kann in diesem Kontext ausschliesslich zum Training von KI-Modellen genutzt werden. Die Nutzung erfolgt kostenpflichtig.'
- https://etim.de/daten/etim-bmecat/ (fetched 2026-08-21) — ETIM Deutschland front-page news 'Das deutsche ETIM-Sprachmodell wird zur Mitgliederleistung' — German model use being bound to membership; BMEcat validation/certification offered only to members ('loggen Sie sich als Mitglied ein').
- https://etim.de/mitwirken/ (fetched 2026-08-21) — Membership types: IT-Dienstleister can join as Foerdermitglied; benefits include 'Zugang zu weiteren Fremdsprachversionen' and version-comparison tables. No fee published.
- https://bmecat-validator.com/ (fetched 2026-08-21) — Live competing validator v1.7: XSD + ETIM BMEcat International Guidelines, versions 2.2/3.0/3.1/4.0/5.0 across 22 country variants with auto-detect; free up to 16 KB unzipped.
- https://bmecat-validator.com/home/api (fetched 2026-08-21) — Its REST API: POST /api/validate with country/version selection, progress polling, previous-validations; HTTP basic auth; EUR 99 one-time activation, EUR 49 per additional API user, paid validation packages, no free tier.
- https://blog.rastro.ai/tools/etim-classification-checker (fetched 2026-08-21) — Named incumbent already ships a free, no-login ETIM 10 classification checker with a 15-country profile selector ('Adds country-specific mandatory fields to the check'), CSV and BMEcat XML input — the card's proposed lead magnet, already live.
- https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-the-manufacturers/rates-manufacturer/2ba-etim-combi/ (fetched 2026-08-21) — 2026 rates re-verified: Logo-Deeplink EUR 2,150/2,529; Combi EUR 2,756-5,070 by headcount; EUR 250 one-off; UOB EUR 5,508 + EUR 5,000; '2026 rates indexed at 4%'; Combi includes ETIM membership via Ketenstandaard and Dutch ETIM translation access.
- https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-the-manufacturers/data-quality-manufacturer/ (fetched 2026-08-21) — 2BA validates automatically on each delivery and returns processing reports, Data Statistics, Deep Scan and a Data Label score; approval decision rests with the manufacturer.
- https://etim-mapper.com/pricing (fetched 2026-08-21) — Live price API re-queried: POST /pricing accountType=standard&productsLimit=1000 returns {"EUR":1890,"PLN":7560,"USD":2268} — card's figure confirmed today.
- https://platform.claude.com/docs/en/about-claude/pricing (fetched 2026-08-21) — Claude Haiku 4.5 $1/MTok input, $5/MTok output; Batch API 50% discount ($0.50/$2.50); cache read 0.1x base input. Card's inference economics confirmed.

---

## 03 Competition & pricing — verdict: SURVIVES_RESHAPED

# D9 — Classfile: deep validation (re-verified live 2026-08-21)

## Verdict: SURVIVES_RESHAPED

Every load-bearing number on the card reproduced against a primary source today, several to the euro. The card is not over-claiming. What it *is* doing is under-reporting the field: AP5 named five incumbents and missed at least six AI-native ETIM classifiers, and missed the one vendor publishing a price list *below* Classfile's while already generating BMEcat. Neither is a kill.

## What I re-proved (primary, today)

**The corpus is real and I hold it.** I downloaded `ETIM-10.0-ALL-SECTORS-CSV-METRIC-EI-2024-12-05.zip` (2.9 MB, HTTP 200, no login) and unpacked it: **5,641 classes, 17,379 features, 16,164 values, 76,626 class-to-feature mappings carrying featuretype and unit, 37,059 class synonyms, 189 units.** That is exactly the constrained-generation substrate the card describes — the shortlist-then-fill architecture has its schema in hand. Licence re-fetched: Open Data Commons Attribution, commercial use permitted. Class A "data unobtainable" is dead on arrival. (Note: 76,626/5,641 = 13.6 features per class average, so the card's "30-feature schema" token estimate is conservative.)

**The output formats are public and permissive.** The BMEcat Guideline V5-0 zip unpacks `bmecat_etim_501.xsd` (99 KB) plus four sample catalogue XMLs for ETIM 7/8/9/10. `ETIM-xChange_V2.0-2026-04-30.zip` contains a full JSON Schema draft-2020-12 (62 KB) explicitly `"$license": Apache-2.0`, a sample file, code lists, and an 8.5 MB *CountrySpecificGuidelines V2.01 (2026-04-30)*. The card's AP6 reading — official validators are member-gated, so build your own from the published schema — is correct, and the build is a library call. The country-guidelines PDF is the public source for the "recipient profile library," and its 2026-04-30 date is a *fresher* forced-migration trigger than the ETIM 9→10 event the card leans on.

**Prices re-derived, not re-read.** ETIM-Mapper's calculator is a POST to `/pricing`; I hit it directly: `{"EUR":1228}` e-start/1,000, `{"EUR":1890}` standard/1,000, `{"EUR":6652}` standard/20,000 — identical to the card. nextPIM: €600/€1,200/€1,800 per month, every CTA "Jetzt anfragen." 2BA 2026: €2,150–€5,070/yr plus €250 one-off, indexed 4%. Rastro: "Starting at $1,000/month," up to 1,000 SKUs, "quote the exact price on the demo call," demo-only. ETIM API `/api/v2/Misc/Releases` → HTTP 401. Haiku 4.5 batch $0.50/$2.50 with 0.1x cache reads. The miner did not fabricate anything.

## What the miner missed

**Six AI ETIM classifiers absent from AP5.** The closest is **getName.ai**: automatic attribute completion against ETIM/ECLASS/GPC/UNSPSC from product text, URLs *and PDF datasheets* (50 MB, first 5 pages), batch CSV/JSON/XML, REST API, **free tier of 50 queries/month with no credit card**. Also live: uNaice **DataNaicer** (auto ETIM classification, free 100-record PoC, claims 9/10 correct), ITEK "KI-basierte ETIM Services," Sepia's KI-Agenten, Squadra/PowerClass.ai, SyncRefine. None of them exports BMEcat or xChange, and none publishes a paid price — every one is quote-gated. Classfile's differentiator survives, but it is now *"the only one that ships the validated file,"* not *"the only one using AI."*

**A published price floor: Uppershare.** Upper Solutions (Belgium) posts a public annual table — **€590/yr under 1,000 products, €2,490 under 5,000, €3,490 under 50,000, €5,490 above** — while advertising "Met 1 klik genereert u een perfect geldige BMEcat" and "99,9% Geldige BMEcats," with free model migration on an annual licence. Classfile's Scale (€999/mo = €11,988/yr at 50k) is 3.4x Uppershare Pro. Crucially, the same page shows *why* it is cheap: it is an editor whose customer assigns the classes, at a stated human throughput of 25–100 products/hour after training. Classfile sells the 100–400 hours Uppershare's price excludes. The reshape required is in messaging and tiering — price against labour displaced, and drop the card's line that €99/€399 undercuts the field. It does not undercut Uppershare; it replaces the headcount behind it.

**No self-serve checkout exists anywhere in the band.** Not Rastro, nextPIM, Uppershare, Daiteo, getName.ai's paid tiers, uNaice, ITEK, Sales Layer — nor inside the Akeneo App Store, where the Induxx ETIM app is "Quote Based, contact apps@induxx.be." This is the wedge and the warning in one fact. It stays Class B because forced budget is independently proven (2BA charges €2,150–€5,070/yr merely to *distribute* this data, before anyone authors it) and the dollar value is arithmetic from the incumbent's own throughput figures.

## On honest degradation (A3)

The card's design is genuinely sound and I am not demanding perfection of it: per-value provenance pointers with page thumbnails, confidence scores, an explicit abstain option in the structured output, runner-up classes shown on the assignment, sub-threshold fields emitted **empty** onto a "needs one decision" list rather than guessed, and a hard gate where download unlocks only on deterministic validator pass. The failure mode is "fewer fields filled," never "a wrong spec in a wholesaler's catalogue." Because the XSD and the xChange JSON Schema are public and mechanical, the pass/fail gate is real rather than rhetorical. The refund-on-recipient-rejection promise is checkable. No Class A legal finding: nothing here requires bespoke human work per customer.

## Bottom line

No Class A finding stands. The premise is true, the corpus is downloaded, the schemas are Apache-licensed, the economics hold at roughly $0.005/SKU, and the forced budget is documented. Classfile survives reshaped: reprice against displaced labour rather than against tool list prices, re-anchor the migration wedge on xChange V2.0 (2026-04-30) rather than ETIM 9→10, treat the validator as table stakes and the per-class eval harness as the only real moat, and instrument the free tier to answer the one open question — whether this buyer will swipe a card without a call.

## References

1. https://www.etim-international.com/classification/license-info/ — 2026-08-21 — ODC-BY licence; commercial use permitted; English master open to all, some national languages need national membership.
2. https://www.etim-international.com/wp-content/uploads/2024/12/ETIM-10.0-ALL-SECTORS-CSV-METRIC-EI-2024-12-05.zip — 2026-08-21 — downloaded and unpacked: 5,641 classes / 17,379 features / 76,626 mappings.
3. https://www.etim-international.com/wp-content/uploads/2021/09/ETIM-BMEcat-Guideline-V5-0-2-2024-12-12.zip — 2026-08-21 — contains bmecat_etim_501.xsd (99 KB) and four sample catalogue XMLs.
4. https://www.etim-international.com/wp-content/uploads/2025/11/ETIM-xChange_V2.0-2026-04-30.zip — 2026-08-21 — Apache-2.0 JSON Schema V2.0 plus CountrySpecificGuidelines V2.01 dated 2026-04-30.
5. https://etim-mapper.com/pricing — 2026-08-21 — POST reproduced EUR 1,228 / 1,890 / 6,652 exactly.
6. https://uppershare.com/ — 2026-08-21 — published EUR 590/2,490/3,490/5,490 per year; editor at 25–100 products/hour; demo-only CTA.
7. https://getname.ai/ and https://getname.ai/faq — 2026-08-21 — AI ETIM/ECLASS attribute filling from PDFs; free 50 queries/month, no card; paid = quote.
8. https://www.unaice.com/en/blog/etim-standard-klassifizierung — 2026-08-21 — DataNaicer auto ETIM classification, free 100-record PoC, no published price.
9. https://www.rastro.ai/pricing — 2026-08-21 — "Starting at $1,000/month," 1,000 SKUs, demo-only, dedicated implementation team.
10. https://www.nextpim.de/preise/ — 2026-08-21 — EUR 600/1,200/1,800 per month, all CTAs "Jetzt anfragen."
11. https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-the-manufacturers/rates-manufacturer/2ba-etim-combi/ — 2026-08-21 — 2026 rates EUR 2,150–5,070/yr plus EUR 250 one-off, indexed 4%.
12. https://etimapi.etim-international.com/api/v2/Misc/Releases — 2026-08-21 — HTTP 401, credentials required.
13. https://platform.claude.com/docs/en/about-claude/pricing — 2026-08-21 — Haiku 4.5 $1/$5, Batch $0.50/$2.50, cache read 0.1x.
14. https://apps.akeneo.com/apps/etim-app-by-induxx — 2026-08-21 — "Quote Based," vendor contact, no self-serve install.
15. https://daiteo.io/en/generate-your-bmecat-file-easily/ — 2026-08-21 — manual ETIM class selection, no auto-classification, demo-only.
16. https://aitim.de/en/ — 2026-08-21 — checked and ruled out as adjacent (quote-grounding, not classification).
17. https://www.etim-international.com/downloads/?_sft_downloadcategory=model-releases — 2026-08-21 — direct download hrefs for ETIM 6.0–10.0, no login.

### Proven (primary source)

- ETIM 10.0 model is downloadable with no login and I unpacked it today: 5,641 classes, 17,379 features, 16,164 values, 76,626 class-feature mappings with featuretype and unit, 37,059 synonyms, 189 units — the exact constrained-generation substrate the card assumes.
- ETIM Classification Model is licensed Open Data Commons Attribution: commercial use, adaptation and redistribution permitted with attribution (licence page re-fetched).
- BMEcat validation is mechanically buildable without membership: the ETIM BMEcat Guideline V5-0 zip contains bmecat_etim_501.xsd (99,041 bytes) plus four sample T_NEW_CATALOG XMLs for ETIM 7/8/9/10.
- ETIM xChange V2.0 ships a full JSON Schema draft-2020-12 (62,128 bytes) explicitly licensed Apache-2.0, with a sample file and code lists — the pass/fail download gate at the heart of the product is a library call, not research.
- A public, non-member recipient-profile source exists: ETIM xChange CountrySpecificGuidelines V2.01 dated 2026-04-30 (8.5 MB PDF) inside the same free zip.
- ETIM-Mapper pricing re-derived live by POST to /pricing, matching the card to the euro: e-start/1,000 = EUR1,228; standard/1,000 = EUR1,890; standard/20,000 = EUR6,652.
- nextPIM re-verified: Vendor START EUR600/mo (1,000 products), PLUS EUR1,200/mo, UNLIMITED EUR1,800/mo with KI-Funktionen; every CTA is 'Jetzt anfragen' — no self-serve purchase.
- Rastro AI re-verified: Manufacturer PIM 'Starting at $1,000/month', up to 1,000 SKUs included, larger catalogues quoted 'on the demo call', one-month trial with a dedicated implementation team, 'Book a demo' the only CTA.
- 2BA 2026 manufacturer rates re-verified: Logo-Deeplink EUR2,150 (FEDET) / EUR2,529; 2BA & ETIM Combi EUR2,756-EUR5,070 by FTE band; EUR250 one-off; UOB EUR5,508/yr + EUR5,000 startup; rates indexed at 4%. Forced budget for merely distributing this data is proven.
- ETIM API v2 requires credentials — curl to /api/v2/Misc/Releases returns HTTP 401 while the swagger doc returns 200; bulk model releases make the API optional.
- Inference economics hold: Claude Haiku 4.5 is $1/$5 per MTok, Batch API $0.50/$2.50, cache reads at 0.1x base input — the card's ~$0.0053/SKU figure is correct and its 30-feature schema assumption is conservative against the model's true 13.6 features/class average.
- No self-serve credit-card checkout exists anywhere in this band today — verified across Rastro, nextPIM, Uppershare, Daiteo, getName.ai paid tiers, uNaice, Sales Layer and the Akeneo App Store (Induxx ETIM app is 'Quote Based').

### Unproven

- getName.ai's actual paid price. A '49 EUR net per month' figure appears only in a search-engine summary; the primary site and FAQ both say production deployment is 'quoted individually'. Treated as unverified, not as a price point.
- uNaice DataNaicer, ITEK KI-basierte ETIM Services, Sepia and Squadra/PowerClass.ai prices — all quote-gated; unaice.com/en/pricing returns a 404 page and powersuite.ai/data-classification returned HTTP 403 to my fetch.
- The phase-2 zero-labelling corpus. I found the guidelines and sample files but did NOT verify that a harvestable population of manufacturer-published, ETIM-classified BMEcat/xChange files exists at the 200k-1M article scale the card targets. This is the single biggest untested pillar of the moat.
- Per-class accuracy ceiling on messy or scanned datasheets — untestable without building the eval harness. uNaice's public claim of 9/10 correct assignments is a competitor's marketing number, not evidence.
- Whether recipient-specific mandatory-field profiles (2BA, ITEK, individual wholesalers) can be fully maintained from public documentation. The public CountrySpecificGuidelines PDF is supportive but not proof for per-wholesaler profiles.
- Whether the buyer will transact without a call. Nobody in the band offers self-serve, so there is no market evidence either way; the card honestly flags this and the free tier is the right instrument to settle it.
- The Calago ETIM App for Akeneo — its app-store page returned HTTP 404 today, so I could not assess it.

### Findings (with class)

- **[B]** A published price floor the card did not see. Uppershare (Upper Solutions, Belgium) posts a public annual price table — Starter under 1,000 products EUR590/yr, Business under 5,000 EUR2,490, Pro under 50,000 EUR3,490, Enterprise above 50,000 EUR5,490, plus EUR150-250 setup — while advertising 'Met 1 klik genereert u een perfect geldige BMEcat (XML)' and '99,9% Geldige BMEcats'. Classfile's Scale tier (EUR999/mo = EUR11,988/yr at 50k SKUs) is 3.4x Uppershare Pro and Starter (EUR1,188/yr at 1k) is 2x Uppershare Starter. NOT a kill, because the same page shows Uppershare is an editor the customer's own trained team operates: 'Ken ETIM-klassen toe en vul de bijhorende kenmerken in', stated throughput 25-100 products/hour by product type, 'Uw team is na de opleiding meteen operationeel'. Classfile sells the 100-400 hours of labour that price excludes. Required reshape: price and message against labour displaced, and delete the card's claim that EUR99/EUR399 undercuts the field.
- **[B]** AP5 was materially under-filled: at least six AI-native ETIM classifiers were missed. Closest is getName.ai — automatic attribute completion for ETIM/ECLASS/GPC/UNSPSC from product text, URLs and PDF datasheets (50 MB, first 5 pages), batch CSV/JSON/XML, REST API, free tier of 50 queries/month with no credit card. Also live: uNaice DataNaicer, ITEK 'KI-basierte ETIM Services', Sepia KI-Agenten, Squadra/PowerClass.ai, SyncRefine. Constraint not kill: none of them exports BMEcat or ETIM xChange, none ships a pass/fail validation gate, and every one is quote-gated for paid use. The differentiator narrows from 'the only one using AI' to 'the only one that ships the validated file self-serve'.
- **[B]** The ETIM 9-to-10 migration wedge is already priced by incumbents. Uppershare charges EUR250/500/800 for 'Data-migratie in Uppershare' (free at Enterprise, and free on any annual licence per its FAQ); ETIM-Mapper ships an 'ETIM v10 migration assistant' as a standard included feature at every tier. Classfile's EUR0.03/SKU migration packs compete with a free-or-EUR250 alternative. Offsetting and unused by the card: ETIM xChange V2.0 country-specific guidelines are dated 2026-04-30 — a fresher, better-datable forced-migration trigger.
- **[B]** The validation guarantee is a feature, not a moat. The ETIM xChange V2.0 schema is a standard JSON Schema draft-2020-12 explicitly licensed Apache-2.0, and the BMEcat guideline ships a 99 KB XSD publicly — any competitor can ship pass/fail validation in days. This confirms the card's own position that the moat is the assembled corpus plus per-class eval harness, but it means the commercial promise (only ship files that pass, refund on recipient rejection) is copyable and must be defended by measured per-class accuracy rather than by the validator.
- **[B]** Multilingual reach is partly gated. The ETIM licence page confirms the English master model is 'Open to all' under ODC-BY, but national language translations carry varying access requirements, some requiring national ETIM membership. The card's 'seventeen languages' buyer framing overstates what is free; national memberships must be budgeted per market and launch scope should assume the English master plus whichever national versions are genuinely open.
- **[B]** Zero self-serve credit-card checkout was found anywhere in this band today — not Rastro, nextPIM, Uppershare, Daiteo, getName.ai paid tiers, uNaice, ITEK, Sales Layer, nor inside the Akeneo App Store (ETIM App by Induxx is 'Quote Based', contact apps@induxx.be). This is simultaneously the strongest evidence for Classfile's A1 wedge and the strongest warning against it: either nobody has tried, or this buyer will not transact without a human. Class B rather than Class A because forced budget is independently proven (2BA charges EUR2,150-5,070/yr merely to distribute this data) and the dollar value is arithmetic from the incumbent's own stated throughput (25-100 products/hour implies 100-400 human hours per 10,000 SKUs). The card already lists this as 'NOT yet proven'; it should be the first thing the free tier is instrumented to measure.

### References

- https://www.etim-international.com/classification/license-info/ (fetched 2026-08-21) — ETIM Classification Model under Open Data Commons Attribution Licence; commercial use, adaptation and redistribution permitted with attribution. English master 'Open to all'; some national language versions require national membership.
- https://www.etim-international.com/wp-content/uploads/2024/12/ETIM-10.0-ALL-SECTORS-CSV-METRIC-EI-2024-12-05.zip (fetched 2026-08-21) — Downloaded (HTTP 200, 2.9 MB, no login) and unpacked: 5,641 classes, 17,379 features, 16,164 values, 76,626 class-feature mappings with featuretype and unit, 37,059 synonyms, 189 units.
- https://www.etim-international.com/wp-content/uploads/2021/09/ETIM-BMEcat-Guideline-V5-0-2-2024-12-12.zip (fetched 2026-08-21) — HTTP 200, 3.2 MB, no login: contains bmecat_etim_501.xsd (99,041 bytes), the V5-0 guideline PDF, element overview XLSX, and four sample T_NEW_CATALOG XMLs for ETIM 7/8/9/10.
- https://www.etim-international.com/wp-content/uploads/2025/11/ETIM-xChange_V2.0-2026-04-30.zip (fetched 2026-08-21) — HTTP 200, 10.5 MB, no login: ETIM xChange Schema V2.0 JSON Schema draft-2020-12 (62,128 bytes) carrying $license Apache-2.0, plus sample file, code lists, and CountrySpecificGuidelines V2.01 dated 2026-04-30 (8.5 MB) — the public recipient-profile source and a fresh forced-migration trigger.
- https://etim-mapper.com/pricing (fetched 2026-08-21) — Live price API re-derived by POST to /pricing: e-start/1,000 = EUR1228 (PLN4914, USD1474); standard/1,000 = EUR1890; standard/20,000 = EUR6652. Matches the card exactly. Feature list confirms an editor with an 'ETIM v10 migration assistant'. Vendor MediaLab s.c., Lodz, Poland.
- https://uppershare.com/ (fetched 2026-08-21) — MISSED BY MINER — published annual price table confirmed by raw curl: Starter under 1.000 producten EUR590/jaar, Business under 5.000 EUR2.490, Pro under 50.000 EUR3.490, Enterprise above 50.000 EUR5.490; setup EUR150-250; ETIM model migration EUR250/500/800/free. Claims '99,9% Geldige BMEcats' and one-click valid BMEcat, but is an editor: human assigns classes at 25-100 products/hour. CTA is 'Plan gratis demo' only.
- https://getname.ai/ (fetched 2026-08-21) — MISSED BY MINER — closest AI-native competitor: automatic attribute completion for ETIM, ECLASS, GPC, UNSPSC from product text, URLs and PDFs; batch CSV/JSON/XML; REST API; free tier 50 queries/month with no credit card; paid plans 'custom pricing / quote required'.
- https://getname.ai/faq (fetched 2026-08-21) — 'free test account with 50 queries per month'; 'Production deployment is quoted individually based on volume, required classifications, and integration needs.' PDF catalogue cards supported up to 50 MB, first 5 pages analysed. No BMEcat/xChange export mentioned; REST/JSON only.
- https://www.unaice.com/en/blog/etim-standard-klassifizierung (fetched 2026-08-21) — MISSED BY MINER — uNaice DataNaicer performs automatic AI ETIM classification from product texts, outputs for Open Datacheck / Open Masterdata / CatalogExpress; free 100-record configured PoC; claims 9/10 correct assignments; no published price (unaice.com/en/pricing returns a 404 page).
- https://www.rastro.ai/pricing (fetched 2026-08-21) — Re-verified: Manufacturer PIM 'Starting at $1,000/month', 'Up to 1,000 SKUs included', larger catalogues 'we quote the exact price on the demo call'; distributor $1,000/mo platform fee plus per-SKU web enrichment; 'One-month trial with a dedicated implementation team'; 'Book a demo' is the only CTA.
- https://www.nextpim.de/preise/ (fetched 2026-08-21) — Re-verified: Vendor START EUR600/mo (1,000 products), PLUS EUR1,200/mo (5,000), UNLIMITED EUR1,800/mo (KI-Funktionen included); Dealer tiers same prices for 50k/250k/unlimited. Every CTA 'Jetzt anfragen' — no self-serve purchase.
- https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-the-manufacturers/rates-manufacturer/2ba-etim-combi/ (fetched 2026-08-21) — Re-verified 2026 rates: Logo-Deeplink EUR2,150 FEDET / EUR2,529; 2BA & ETIM Combi EUR2,756/3,243 (under 30 FTE), EUR3,380/3,977 (30-50), EUR4,310/5,070 (over 50); EUR250 one-off; UOB EUR5,508/yr + EUR5,000 startup; 'The 2026 rates are indexed at 4%'; FEDET membership gives 15% discount. Proves forced budget.
- https://etimapi.etim-international.com/api/v2/Misc/Releases (fetched 2026-08-21) — curl returns HTTP 401 — ETIM API v2 requires credentials, as the card stated. The swagger doc at /swagger/v2/swagger.json returns HTTP 200. Bulk model releases make the API optional for the product.
- https://platform.claude.com/docs/en/about-claude/pricing (fetched 2026-08-21) — Claude Haiku 4.5 $1/MTok input, $5/MTok output; Batch API 50% discount = $0.50/$2.50; cache hit multiplier 0.1x base input. Confirms the card's ~$0.0053/SKU figure. Sonnet 5 batch $1/$5 is a cheap fallback tier.
- https://apps.akeneo.com/apps/etim-app-by-induxx (fetched 2026-08-21) — Akeneo App Store ETIM app: maps attributes to ETIM standards, no AI auto-classification from datasheets; pricing model is 'Quote Based'; purchase is vendor-contact via apps@induxx.be, not self-serve install. Companion Calago ETIM app page returned HTTP 404 today.
- https://daiteo.io/en/generate-your-bmecat-file-easily/ (fetched 2026-08-21) — French BMEcat/FAB-DIS/ETIM tool: user manually selects the ETIM class and fills pre-recorded options; no datasheet auto-classification; no published price; 'Reserver une demo' only.
- https://aitim.de/en/ (fetched 2026-08-21) — Checked as a possible ETIM-AI competitor and ruled OUT as adjacent: AITIM/Calcutron (Hermann Hundt Ing. GmbH with Fraunhofer IIS and University of Bamberg, spin-off Calcutron Digital Solutions GmbH founded 2026) grounds AI queries against existing ETIM catalogue data for quoting, not datasheet classification or BMEcat generation. No pricing, demo-only.
- https://www.etim-international.com/downloads/?_sft_downloadcategory=model-releases (fetched 2026-08-21) — HTTP 200; direct wp-content download hrefs for ETIM 6.0 through 10.0 in IXF/Excel/CSV/Access, metric and metric+imperial, all-sectors and per-sector, plus national-language variants — all reachable without login.

---

## 04 Kill-thesis — verdict: SURVIVES_RESHAPED

# D9 — Classfile: deep validation (live, 2026-08-21)

## Verdict: SURVIVES_RESHAPED. No Class A finding stands.

### The kill I was sent to make (a): the acceptance gate is on the manufacturer, not the vendor

I fetched the whole chain today. 2BA's file-exchange page lists the accepted formats: **DICO (SALES005) "*** preferred ***", BMEcat 2005 ETIM V5.0, BMEcat 2005 ETIM V4.0, INSBOU004, ETIM xChange V1.0/1.1/2.0**. The xChange V2.0 page states 2BA "now supports version 2.0 for both import and export," and — decisively — recommends manufacturers "use a specialized software party with sufficient JSON knowledge… various PIM software parties affiliated with 2BA that export a valid dataset." The data pool is *asking* for this vendor category.

Who must be a member: the **manufacturer** holds the paid contract (2026: Logo-Deeplink €2,150/€2,529; Combi €2,756–€5,070; €250 one-off). A software supplier pays **€1,264/yr (2026, indexed 4%)** for a partnership agreement — and that buys co-development, a test environment and a partner-directory listing, *not* the right to have a customer's file accepted. Nothing gates the artifact on vendor membership. **Not a kill; Class B cost line.**

I also broke the card's own stated risk. It says the official validators are member-gated — true, verbatim: "The online ETIM xChange validation tool is free of charge but exclusively available to ETIM members," and the BMEcat Certification Tool "requires a separate login." But I downloaded `ETIM-xChange_V2.0-2026-04-30.zip` (10.5 MB, no login): it contains the **JSON Schema (62 KB)**, a sample file, the code lists, the guideline, and a **113-page country-specific-regulations PDF**. The vendor can build a conformant validator from public artefacts. I also pulled a full **ETIM 10.0 IXF release** (3.66 MB zip → 71 MB XML): **5,733 classes, 17,653 features, 16,399 values, 230,822 synonyms**, multilingual (EN/fr-BE/nl-BE), with per-class and per-feature `changeCode` attributes. The corpus-obtainability test — the usual Class A killer — passes hard.

One real hit: the NL section of that public PDF says NL extension definitions are at "Ketenstandaard – ETIMxChange NL (**login required, only accessible for local members**)." The card listed "recipient profiles maintainable from public documentation" as unproven; the honest answer is *mostly yes, not for the Dutch extension fields*. **Class B**, cost unknown.

### (c) ETIM churn is a two-year cadence and a machine-readable delta

ETIM 11.0: change-request deadline 30 June 2026, **final release 1 December 2026**, with ETIM MC moving to the same biannual cycle "to accommodate for more stability and to enable clear contract clauses." That is not drift burden — it is a dated, recurring re-classification event, and the IXF "with change codes" files hand you the diff. The card's "ETIM 9→10 migration pack" wedge is real but expiring; **retarget it at 10→11, live from Dec 2026.** Note ETIM-Mapper already shipped a v10 migration assistant for its own users.

### (d) The demand-side threat is genuine but does not remove the supplier's obligation

Evidence found: Upshift (NL) markets to wholesalers that "een AI-systeem kan leveranciersdata automatisch omzetten naar jouw eigen datamodel of een industriestandaard zoals ETIM"; SKULaunch sells distributors a supplier portal where "AI pre-fills from the supplier's own website — suppliers confirm, don't type," 80,000 SKUs "enriched overnight… reviewed by exception only." So yes, the demand side is arming itself.

It still isn't a kill, because the scoring lands on the manufacturer. In Germany, **Open Datacheck** — the hub >80% of German electrical wholesalers pull from — enforces **DQR 10.0, binding since 1 October 2025**, accepts only **ETIM 8/9/10**, demands **ETIM BMEcat Guideline 4.0.3 or 5.0** plus VEG rules (valid GLN/GTIN check digits), and runs a **0–100 Scorecard used in the purchasing conversation**, deducting points for failure to refresh annually. A wholesaler enriching its own internal copy does not raise the supplier's scorecard, does not populate 2BA under the supplier's GLN, and does not stop the supplier paying 2BA €2–5k/yr to publish. **Forced budget: documented, recurring, externally visible. Class B pressure on TAM (markets without a pool — UK, parts of FR — are where the demand side wins).**

### (e) Rastro, and two incumbents the miner missed

Rastro re-verified: demo-only, "starting at $1,000/month," "your first month is a working trial. Our implementation team loads your catalog." Homepage still quotes **$500/mo ≤1k SKUs, $2,000/mo ≤10k**. So the card's "one-tenth of Rastro" is **overstated — it's ~1/5**, and the honest comparator isn't Rastro at all. ETIM-Mapper's live calculator (re-queried today, exact match to the card: **€1,228 / €1,890 @1,000; €6,652 / €8,647 @20,000**) is **~€102/mo effective at 1,000 products** — dead level with the proposed €99 Starter, self-serve, shipping every two weeks. The gap is *not* price. It is that ETIM-Mapper's only AI is description generation and translation (added 2025-12-10); nothing reads a datasheet and picks a class. That is the whole wedge and it must be stated that way.

Missed incumbents: **PowerSuite.ai** (NL; PowerClass classifies to GS1/ETIM, PowerImprove does PDF extraction with an enrichment-review step; EN/NL; demo-only, no pricing page — 404 on /pricing) and **ITEK's "KI-basierte ETIM Services"** — AI-based ETIM classification sold as a quoted service to manufacturers *and* wholesalers. ITEK also operates Open Datacheck. **The party running the German scorecard sells the remedy for failing it.** That is the sharpest competitive fact in this dossier and belongs in the card. All quote-led, none self-serve. Class B.

### (b) Language — unresolved, and the weakest link

No live evidence either way that a DE/NL/FR product-data manager buys at €99–€999/mo without a call. Four of six competitors (nextPIM, Rastro, PowerSuite, ITEK) chose sales-led; only ETIM-Mapper is self-serve. Mitigating: the *output* localises for free — the ETIM release ships class names, features, values and 230k synonyms per language, so multilingual delivery adds no translation surface, and support scope is bounded to file/validator questions. **Unproven, not refuted.**

### Corrections the card needs

1. "BMEcat 4.0" is wrong nomenclature — the real targets are **BMEcat 2005 with ETIM Guideline 4.0.3 / 5.0**, plus **DICO SALES005** (2BA's *preferred* format) and xChange 2.0. An xChange-only product misses both countries' preferred paths.
2. Lead with Germany/DQR, not NL/2BA — the scorecard is the forced budget with a date on it.
3. Price and position against ETIM-Mapper, not Rastro.
4. The refund-on-rejection guarantee is exposed to 2BA's published "Known Issues" (commodity code at product level, missing alternative product key, attachment hi/lo-res mapping) — operational quirks outside any schema. Scope the guarantee to schema+profile validity.

## References
- https://www.2ba.nl/en/documentation/file-exchange/ (2026-08-21) — 2BA accepted formats; DICO SALES005 preferred, BMEcat 2005 ETIM V4.0/V5.0.
- https://www.2ba.nl/en/geen-onderdeel-van-een-categorie/etim-xchange-v2-0/ (2026-08-21) — xChange 2.0 import+export live; "use a specialized software party"; validation via member-login tool.
- https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-software-suppliers/rates-software-supplier/ (2026-08-21) — software supplier rate €1,264/yr 2026.
- https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-the-manufacturers/rates-manufacturer/2ba-etim-combi/ (2026-08-21) — 2026 manufacturer rates €2,150–€5,070 + €250.
- https://www.etim-international.com/tools/ (2026-08-21) — xChange validation + BMEcat certification tools members-only.
- https://www.etim-international.com/wp-content/uploads/2025/11/ETIM-xChange_V2.0-2026-04-30.zip (2026-08-21) — public, 10.5 MB: JSON Schema, code lists, 113-page country regulations.
- https://www.etim-international.com/wp-content/uploads/2025/08/ETIM-10.0-ALL-SECTORS-IXF-WITH-CHANGE-CODES-METRIC-BE.zip (2026-08-21) — full model, no login: 5,733 classes / 17,653 features / 230,822 synonyms / change codes.
- https://www.etim-international.com/release-planning-etim-11-0/ (2026-08-21) — ETIM 11.0 final 1 Dec 2026; CR deadline 30 Jun 2026.
- https://www.nexoma.de/wissen/open-datacheck/ (2026-08-21) — Open Datacheck; DQR 10.0 binding 1 Oct 2025; ETIM 8/9/10 only; BMEcat 4.0.3/5.0; VEG rules; 0–100 Scorecard.
- https://etim-mapper.com/pricing (2026-08-21) — live POST: e-start €1,228, standard €1,890 @1k; comfort €8,647 @20k.
- https://etim-mapper.com/changelog (2026-08-21) — AI limited to description generation/translation (10.12, 2025-12-10); v10 migration assistant.
- https://www.rastro.ai/pricing and https://www.rastro.ai/ (2026-08-21) — demo-only, implementation team; $500/mo ≤1k, $2,000/mo ≤10k.
- https://www.nextpim.de/preise/ (2026-08-21) — €600/€1,200/€1,800 per month, all CTAs "Jetzt anfragen".
- https://powersuite.ai/data-classification (2026-08-21) — AI classification to GS1/ETIM + PDF extraction; demo-only, /pricing 404.
- https://upshift.today/blog/ai-groothandel-use-cases/ (2026-08-21) — wholesalers converting supplier data to ETIM with AI.
- https://skulaunch.com/solutions/distributors (2026-08-21) — distributor-paid supplier portal, AI pre-fill, 80k SKUs overnight.

### Proven (primary source)

- Corpus/reference model is obtainable free and without login: downloaded ETIM 10.0 ALL-SECTORS IXF (3.66 MB zip -> 71 MB XML) containing 5,733 classes, 17,653 features, 16,399 values, 230,822 synonyms, multilingual translations, and per-element changeCode migration deltas (2026-08-21).
- ETIM xChange V2.0 package is public with no login: JSON Schema (62 KB), sample file, code lists, guideline, and a 113-page country-specific-regulations PDF (V2.01, 2026-04-30) — a vendor can build a conformant validator without ETIM membership.
- The acceptance gate sits on the MANUFACTURER, not the vendor: 2BA manufacturer contracts are €2,150–€5,070/yr + €250 one-off (2026 rates); a software supplier pays an optional €1,264/yr partnership rate that buys co-development, a test environment and a partner listing, not file acceptance.
- 2BA explicitly recommends manufacturers use 'a specialized software party with sufficient JSON knowledge' to produce valid ETIM xChange, and supports xChange 2.0 for both import and export today.
- ETIM's own xChange validation tool and BMEcat Certification Tool are members-only (verbatim confirmed) — but are not required to produce an accepted file.
- Germany has a documented forced budget with a date: Open Datacheck (used by >80% of German electrical wholesalers), DQR 10.0 binding since 1 Oct 2025, only ETIM 8/9/10 accepted, ETIM BMEcat Guideline 4.0.3 or 5.0 required plus VEG rules, and a 0–100 Scorecard used in purchasing conversations that deducts points for failure to refresh annually.
- ETIM release churn is a two-year cadence, not drift: ETIM 11.0 final release 1 December 2026, CR deadline 30 June 2026, ETIM MC moving to the same biannual cycle explicitly 'to enable clear contract clauses'.
- ETIM-Mapper pricing re-verified live via its own POST endpoint, matching the card exactly: e-start €1,228 / standard €1,890 at 1,000 products; standard €6,652 / comfort €8,647 at 20,000.
- ETIM-Mapper's AI is limited to product-description generation and translation (release 10.12, 2025-12-10); no datasheet-to-class classification anywhere in its changelog — the card's 'editor, not generator' gap holds.
- Rastro is still demo-only with a dedicated implementation team and white-glove first month; nextPIM is quote-only ('Jetzt anfragen') at €600/€1,200/€1,800 per month.
- Demand-side AI enrichment is real and marketed: Upshift (NL) sells wholesalers automatic conversion of supplier data to ETIM; SKULaunch sells distributors a supplier portal that AI-prefills from the supplier's own website, 80,000 SKUs enriched overnight, reviewed by exception.

### Unproven

- That EU (DE/NL/FR) product-data managers will buy at €99–€999/mo self-serve with no call. No live evidence either way; four of six competitors (nextPIM, Rastro, PowerSuite.ai, ITEK) are quote-led, only ETIM-Mapper is self-serve — weak counter-evidence.
- Per-class classification and per-feature fill accuracy on messy scanned datasheets. Entirely unmeasured; the refund-on-rejection guarantee is priced on an unknown.
- Cost and terms of Ketenstandaard / national ETIM-organisation membership needed to obtain the Dutch xChange extension-field definitions, which the public country-guidelines PDF states are login-gated to local members.
- Whether the recipient-profile library can be maintained end-to-end from public documentation. Germany yes (DQR 10.0 contents public since 7 Jan 2025); Netherlands only partly — NL extension definitions are member-gated.
- Whether 2BA or Open Datacheck reject files for reasons outside a published schema. 2BA's own 'Known Issues' list (commodity code at product level, missing alternative product key, attachment hi/lo-res mapping) suggests operational quirks the vendor cannot validate against in advance.
- Whether the phase-2 fine-tuning corpus can be assembled lawfully at 200k–1M records from published manufacturer BMEcat files and wholesaler catalogues — no source policy was tested.
- Support-load boundedness across DE/NL/FR under A6. Mitigated in principle because ETIM ships class/feature/value names and 230k synonyms per language, so output localisation adds no translation surface, but not demonstrated.

### Findings (with class)

- **[B]** Demand-side substitution: wholesalers and their agencies (Upshift NL, SKULaunch) now run AI enrichment on raw supplier data, so a supplier may never need to author standards-clean data itself. Caps TAM to markets with a data pool that scores the supplier — strong in DE/NL, weak in UK and parts of FR.
- **[B]** ITEK GmbH sells 'KI-basierte ETIM Services' (AI-based ETIM classification, quote-based) to manufacturers and wholesalers AND operates Open Datacheck — the party running the German scorecard also sells the remedy for failing it. The card missed this entirely; it is the structural competitor, not Rastro.
- **[B]** PowerSuite.ai (NL, EN+NL) ships PowerClass (classify to GS1/ETIM) and PowerImprove (PDF extraction with enrichment review) — a sixth incumbent the card missed, demo-led with no public pricing.
- **[B]** Price gap to the real comparator is roughly zero, not 10x. ETIM-Mapper is ~€102/mo effective at 1,000 products vs the proposed €99 Starter, is self-serve, and ships every two weeks. The card's 'one-tenth of Rastro' also overstates: Rastro's homepage quotes $500/mo at ≤1k SKUs, making it ~1/5. The wedge must be 'generates from a datasheet', never 'cheaper'.
- **[B]** Format landscape is broader and differently named than the card assumes: 2BA's preferred format is DICO SALES005 (a Dutch national XML standard), Germany demands BMEcat 2005 with ETIM Guideline 4.0.3/5.0 plus VEG rules; 'BMEcat 4.0' as written is wrong nomenclature. An xChange-only product misses both countries' preferred paths — engineering scope, and it is also the moat.
- **[B]** Dutch country-specific xChange extension definitions are member-gated at Ketenstandaard, partially refuting the card's hope that recipient profiles are maintainable from public docs alone. Fidelity in the flagship NL market may require a paid local membership of unknown cost.
- **[B]** The ETIM 9->10 migration pack is a decaying wedge — incumbents already shipped v10 migration assistants and DQR 10.0 has been binding since Oct 2025. Retarget at ETIM 10->11, which lands 1 December 2026.
- **[B]** Getting listed as a 2BA software partner requires registering and taking a scheduled call with a 2BA employee — a human-in-the-loop distribution channel that mildly strains A1/A6. Product function is unaffected.

### References

- https://www.2ba.nl/en/documentation/file-exchange/ (fetched 2026-08-21) — 2BA accepted exchange formats: DICO (SALES005) marked '*** preferred ***', BMEcat 2005 ETIM V5.0, BMEcat 2005 ETIM V4.0, INSBOU004, PAB 2, Attachment Index.
- https://www.2ba.nl/en/geen-onderdeel-van-een-categorie/etim-xchange-v2-0/ (fetched 2026-08-21) — 2BA supports ETIM xChange 2.0 for import and export; remaining import components July 2026, total export Aug 2026; recommends 'a specialized software party with sufficient JSON knowledge'; validation via ETIM's login-required tool; lists Known Issues.
- https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-software-suppliers/rates-software-supplier/ (fetched 2026-08-21) — 2026 software supplier rate €1,264/yr excl. VAT per agreement, indexed 4% — optional partnership, not a condition of file acceptance.
- https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-software-suppliers/information-software-supplier/ (fetched 2026-08-21) — Software partner registration triggers a scheduled call with a 2BA employee; partner directory listing; other software suppliers 'invited to link'.
- https://www.2ba.nl/en/about-2ba/what-does-2ba-offer/for-the-manufacturers/rates-manufacturer/2ba-etim-combi/ (fetched 2026-08-21) — 2026 manufacturer rates: Logo-Deeplink €2,150 (FEDET) / €2,529; Combi €2,756–€5,070 by headcount; UOB €5,508; €250 one-off starting rate.
- https://www.2ba.nl/nl/over-2ba/wat-biedt-2ba/voor-de-fabrikant/stappenplan-fabrikant/stap-3-productinformatie (fetched 2026-08-21) — Publishing/maintenance rights may be delegated to a designated organisation (importer, agent, distributor, wholesaler), data supplied under the manufacturer's GLN, temporary and only in consultation with 2BA.
- https://www.etim-international.com/tools/ (fetched 2026-08-21) — 'The online ETIM xChange validation tool is free of charge but exclusively available to ETIM members'; BMEcat Certification Tool also members-only with separate login; CMT mostly public; ETIM API public; ETIM Viewer public.
- https://www.etim-international.com/downloads/?_sft_downloadcategory=standardisation-guidelines (fetched 2026-08-21) — Public download index listing ETIM xChange V2.0 zip, ETIM BMEcat Guideline V5.0.2, IXF 3.1 format, xChange->BMEcat mapping — no login gate.
- https://www.etim-international.com/wp-content/uploads/2025/11/ETIM-xChange_V2.0-2026-04-30.zip (fetched 2026-08-21) — Downloaded 10.5 MB with no login: JSON Schema V2.0 (62 KB), sample file, code lists, guideline PDF, and 113-page CountrySpecificGuidelines V2.01 — NL extension definitions therein noted as Ketenstandaard login-required for local members.
- https://www.etim-international.com/wp-content/uploads/2025/08/ETIM-10.0-ALL-SECTORS-IXF-WITH-CHANGE-CODES-METRIC-BE.zip (fetched 2026-08-21) — Downloaded 3.66 MB zip -> 71 MB IXF XML with no login: 5,733 classes, 17,653 features, 16,399 values, 230,822 synonyms, EN/fr-BE/nl-BE translations, per-element changeCode deltas.
- https://www.etim-international.com/release-planning-etim-11-0/ (fetched 2026-08-21) — ETIM 11.0 change-request deadline 30 June 2026, beta month, final release 1 December 2026; ETIM MC moves to the same biannual cycle for contract-clause stability.
- https://www.nexoma.de/wissen/open-datacheck/ (fetched 2026-08-21) — Independent German explainer (5 May 2026): Open Datacheck data hub; DQR 10.0 binding from 1 Oct 2025; only ETIM 8/9/10 transmissible; ETIM BMEcat Guideline 4.0.3 or 5.0 for Elektro; VEG criteria incl. valid GLN/GTIN check digits; 0–100 Scorecard deducting points for missing annual updates.
- https://etim-mapper.com/pricing (fetched 2026-08-21) — Live POST to /pricing re-queried today: e-start €1,228 / standard €1,890 / comfort €2,457 at 1,000 products; €4,323 / €6,652 / €8,647 at 20,000 — self-serve calculator, card's figures exact.
- https://etim-mapper.com/changelog (fetched 2026-08-21) — Latest release 10.30 (2026-08-11); AI limited to product-description generation and translation (10.12, 2025-12-10); ETIM v10 migration assistant present; no datasheet-to-class AI.
- https://www.rastro.ai/pricing (fetched 2026-08-21) — Manufacturers 'starting at $1,000/month' up to 1,000 SKUs; distributors $1,000/mo platform fee + per-SKU; demo-only, first month a working trial with a dedicated implementation team.
- https://www.rastro.ai/ (fetched 2026-08-21) — Homepage quotes $500/month up to 1,000 SKUs and $2,000/month up to 10,000; mentions ETIM mapping and BMEcat export; Book-demo only, no self-serve signup.
- https://www.nextpim.de/preise/ (fetched 2026-08-21) — Vendor/Dealer START €600, PLUS €1,200, UNLIMITED €1,800 per month; 1,000/5,000/unlimited products for vendors; every CTA 'Jetzt anfragen'; KI-Funktionen paid on START, included on UNLIMITED.
- https://powersuite.ai/data-classification (fetched 2026-08-21) — Missed incumbent (NL, EN+NL): PowerClass classifies to GS1 and ETIM, PowerImprove does PDF extraction with enrichment review, connects to existing PIM/ERP/DAM; demo-only, /pricing returns 404.
- https://www.itek.de/services/ki-basierte-etim-services/ (fetched 2026-08-21) — ITEK 'KI-basierte ETIM Services' — AI-based ETIM classification sold as a quoted service to manufacturers and wholesalers (page 404s on direct fetch; content confirmed via live search index today). ITEK also operates Open Datacheck.
- https://upshift.today/blog/ai-groothandel-use-cases/ (fetched 2026-08-21) — Demand-side evidence: 'Een AI-systeem kan leveranciersdata automatisch omzetten naar jouw eigen datamodel of een industriestandaard zoals ETIM' — sold to wholesalers.
- https://skulaunch.com/solutions/distributors (fetched 2026-08-21) — Distributor-paid supplier portal: 'AI pre-fills from the supplier's own website — suppliers confirm, don't type'; '80,000 SKUs. Confidence-scored. Reviewed by exception only'; maps to ETIM/BMEcat/GS1.