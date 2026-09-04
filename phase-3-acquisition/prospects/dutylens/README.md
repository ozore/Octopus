# DutyLens — prospect research

**ICP.** US-based small and mid-size physical-goods importers and DTC/e-commerce brands
($2M–$50M revenue, plus sub-$5M Amazon private-label sellers and dropshippers) that import
directly from Asia, have no in-house customs-compliance staff, and lost the $800 de minimis
exemption in August 2025.
**They buy** a $1,500 Tariff Exposure Audit — every SKU's correct 10-digit HTS code with cited
CBP CROSS precedent and its true landed cost across the stacked MFN / 301 / 122 / AD-CVD
regimes — then $99–$499/mo to be told the moment a rate moves.

Collected 2026-09-03. Research only. Nothing here has been sent to anyone.

---

## Rows by prospect_type × segment

| type | segment | rows | verified | secondary | unverified |
|---|---|---:|---:|---:|---:|
| end-customer | US importer (CPSC recall record) | 575 | 575 | 0 | 0 |
| end-customer | consumer-goods brand (ASD Market Week) | 505 | 265 | 240 | 0 |
| end-customer | home & gift brand (NY NOW) | 395 | 122 | 273 | 0 |
| end-customer | outdoor brand (Outdoor Retailer) | 228 | 76 | 152 | 0 |
| end-customer | Amazon private-label brand (aggregator-owned) | 126 | 24 | 102 | 0 |
| partner | customs broker | 227 | 227 | 0 | 0 |
| partner | 3PL / fulfillment | 113 | 13 | 100 | 0 |
| partner | freight forwarder | 70 | 68 | 0 | 2 |
| partner | sourcing agent | 14 | 11 | 0 | 3 |
| partner | ecommerce agency | 7 | 7 | 0 | 0 |
| partner | customs attorney / trade counsel | 5 | 4 | 0 | 1 |
| partner | seller software platform | 2 | 2 | 0 | 0 |
| channel | trade association | 10 | 9 | 0 | 1 |
| channel | trade show | 7 | 6 | 0 | 1 |
| channel | subreddit | 6 | 0 | 0 | 6 |
| channel | community / newsletter | 5 | 4 | 0 | 1 |
| channel | facebook group | 2 | 0 | 0 | 2 |
| excluded | competitor — HTS / landed cost software | 18 | 13 | 5 | 0 |
| excluded | competitor — classification service | 6 | 5 | 0 | 1 |
| **total** | | **2,321** | **1,431** | **872** | **18** |

## Rows by confidence

| confidence | rows | what it means here |
|---|---:|---|
| verified | 1,431 | a US federal record names the org (CPSC recall), **or** its own site returned HTTP 200 and identified itself when I opened it once |
| secondary | 872 | found in a show's own exhibitor directory or a third-party list; the org's own site was not opened (mostly because it returned HTTP 403 behind Shopify/Cloudflare) |
| unverified | 18 | reddit / Facebook rows (platform blocked by policy) and six sites that answered 202/403/500 |

Field coverage: 1,754 rows carry a website, 1,990 a location, 2,233 a sourced `size_signal`,
490 a business contact route. Empty fields are empty on purpose — nothing was estimated or
guessed into a structured column (BRIEF §2.3–2.4).

---

## Twenty highest-fit end-customers

All twenty are named by a **US federal record (CPSC)** as the importer of record for goods
**manufactured in China**, are US-headquartered, and are in the size band where nobody has a
full-time customs person. The unit counts are the recall's own figures.

| # | organisation | where | why it is the best possible first call |
|---:|---|---|---|
| 1 | AstroAI Corp. | Garden Grove, CA | 249,100 units of one Chinese-made minifridge SKU. Consumer-electronics catalogues run dozens of near-identical SKUs, which is where classification drift and duty leakage live. |
| 2 | Shims Bargain, Inc. (dba JC Sales) | Los Angeles, CA | 51,160 units of a Chinese-made pet toy. A variety-goods wholesaler's catalogue is thousands of low-unit-value Chinese SKUs — precisely what de minimis repeal repriced. |
| 3 | Taleco Gear | La Verne, CA | 41,100 units of Chinese-made baby jumpers and swings. Juvenile products stack MFN + Section 301 on top of CPSIA testing, so a wrong code costs twice. |
| 4 | Calico Brands | Ontario, CA | 175,000 units of Chinese-made torch lighters. Lighters sit in a chapter with active AD/CVD neighbours; the stacked-rate answer is not obvious. |
| 5 | HD Premier Inc. | Wilmington, DE | 119,620 units of Chinese-made magnetic toys. Toys carry one of the widest Section 301 spreads in the schedule. |
| 6 | Golden Link | Middletown, NY | 55,350 units of Chinese-made licensed drinkware and novelty containers. Licensed novelty housewares classify badly and change SKU constantly. |
| 7 | Costway | Fontana, CA | Chinese-made convertible high chairs. A direct-import e-tailer running a broad furniture and juvenile catalogue out of one California DC. |
| 8 | AMX Global Inc. | Rochester Hills, MI | 22,500 units of Chinese-made folding stadium seating. Sporting-goods classification is genuinely ambiguous between furniture and sports equipment. |
| 9 | ABL Group, Inc. (Upperluxe / Modera) | Brick, NJ | 15,000 units of a Chinese-made juvenile mattress pad. Small multi-brand NJ importer — the exact revenue band in the ICP. |
| 10 | Surf 9 LLC | Bonita Springs, FL | 13,300 units of Chinese-made inflatable paddleboards. Watersports goods are a long-standing HTS grey zone. |
| 11 | OdorStop LLC | Hamburg, NY | 13,000 units of Chinese-made boot dryers. Single-category brand where one $1,500 audit answers the whole catalogue. |
| 12 | Prestige Import Group | Deerfield, FL | 4,300 units of Chinese-made lighters. The company name states the business model: it is an importer, nothing else. |
| 13 | MWA LLC (LUXE+WILLOW) | New York, NY | 4,200 units of Chinese-made heated blankets. Textile plus electronics in one SKU is among the hardest classification calls there is. |
| 14 | Home Easy Ltd. | Fairfield, NJ | 3,000 units of Chinese-made personal electric heaters. Small NJ importer with no visible compliance function. |
| 15 | Tainoki Fine Furniture | Brea, CA | 2,200 units of Chinese-made swivel office chairs. Furniture carries the largest antidumping exposure of any category in this file. |
| 16 | Case-Mate | Atlanta, GA | 1,400 units of Chinese-made MagSafe battery chargers. Phone-accessory brands churn hundreds of low-value SKUs a year — continuous monitoring, not a one-off lookup. |
| 17 | Green Pastures Wholesale | Baltimore, MD | 1,250 units of Chinese-made LED lanterns. A wholesale importer of decorative goods, the archetypal ASD-style buyer. |
| 18 | Thy Trading Company | Phoenixville, PA | 720 units of Chinese-made roll-up window blinds. A small Pennsylvania trading company — the smallest end of the ICP, where the audit is the whole compliance budget. |
| 19 | Transpro US Inc. | Paterson, NJ | 700 units of Chinese-made electric scooters. Micromobility stacks Section 301 with a separate lithium-battery regime. |
| 20 | Legend Brands LLC | New York, NY | 500 units of Chinese-made hair dryers sold under a licensed name. Licensed personal-care appliances mix trade and IP exposure. |

Unit figures and origin countries are the CPSC recall notice's own; the reason column is my
judgement about classification difficulty and is labelled as such, not sourced.

Two more worth naming for a different reason: **Aterian, Inc.** (Summit, NJ) and
**Wyze Labs** (Kirkland, WA) are bigger, but both are pure China-import consumer-brand
operators whose whole P&L moves with the tariff stack — good design partners, wrong price point.

---

## Gaps

Segments under 30 rows, and why:

* **sourcing agent (14).** There is no register of sourcing agents. The population is real but
  is only ever enumerated in blog listicles; I used the one vetted list I could open and then
  opened each firm's own site. Three of the fourteen sites answered a bot challenge or a 500.
* **ecommerce agency (7), seller software platform (2), customs attorney / trade counsel (5).**
  Deliberately small. These are curated referral partners, not a population to enumerate; each
  was opened individually. More can be added cheaply from any "best Amazon agency 2026" listicle
  but the marginal partner is low value.
* **channel rows (30 total: trade association 10, trade show 7, subreddit 6, community/newsletter 5,
  facebook group 2).** Channels are inherently few, and the two largest channel
  families are policy-blocked: reddit.com and facebook.com are on the BRIEF §2.7 do-not-retry
  list, so those eight rows are name + public URL only and are marked `unverified` with the
  rules explicitly flagged as unchecked. Association member *directories* are almost all
  login-gated (see sources.md §F), so the associations appear as channels rather than as
  hundreds of member rows.
* **excluded (24).** That is close to the real size of the competitive set; it comes from a
  competitor's own 2026 ten-vendor comparison plus the tools named in the DutyLens idea record.

The one segment the brief asked for that I could **not** build:

* **US importers from free bill-of-lading / importer directories — 0 rows.** importyeti is on
  the blocked list; portexaminer's DNS does not resolve; usimportdata and importinfo put every
  record behind a registration form or a captcha; tradeatlas, seair, volza, zauba, exportgenius
  and datamyne all return HTTP 403; panjiva needs an S&P login. Signing up would breach BRIEF
  §2.5. I substituted the **CPSC recall API**, which is a genuine federal record naming a US
  importer of record together with the country of manufacture — 575 rows, all `verified` — and
  the a2z trade-show directories, which give US-only exhibitors with city, state and website.

---

## Next steps — the three sources that would add the most

1. **ASD Market Week August 2026** — `https://asd.a2zinc.net/August2026/Public/Exhibitors.aspx`
   is live now and is 1.76 MB versus March's 1.47 MB. Running `scripts/a2z.py` against it
   would add several hundred more US importers of exactly the right size, for one command.
   The same pattern extends to every past NY NOW season (`Summer2026`, `Winter2025`, …).
2. **The remaining 920 NCBFAA member detail pages.** `raw/ncbfaa_companies.json` already holds
   all 1,241 member companies with their detail URLs; only 320 were opened. Finishing the crawl
   would take the customs-broker partner segment past 900 rows with websites and service codes —
   and brokers are the highest-leverage channel for a white-labelled classification product.
3. **Earlier CPSC recall years (2015–2021), plus a browser capture of the Algolia index name
   behind the National Hardware Show exhibitor list.** The CPSC pull triples the government-db
   segment with the same script; the hardware show is the one big US-importer directory that
   defeated me and needs only one piece of information (the index name) that a human with
   dev-tools open could read in ten seconds.

A fourth, if someone has a paid seat: **ImportYeti / Panjiva bill-of-lading search**. That is
the only way to get importer rows keyed to *actual container volume*, which is the single best
qualifier for the $1,500 audit offer.
