# Sources — Certly Buyer & Identity, wave 1

Every URL below was **fetched** in this session on **2026-09-03** (WebFetch or `curl`), not recalled.
`first-party` = the organisation's own page about itself. `rival` = a competitor writing about another
competitor; used only where a second source agrees, and always labelled in the persona.
Blocked sources are listed with what was tried, so the next agent does not repeat the attempt.

## A. Incumbent pricing and gating

| # | URL | class | what it established |
|---|---|---|---|
| A1 | https://www.getbcs.com/pricing-and-plans | first-party | The only published price ladder in the category. Free tier **$0/mo, up to 25 vendors, self-serve, no credit card, no commitment, no setup fee**; Self-Service **"$0.95 Per vendor, monthly"**; Full-Service **"$17.80 Per vendor, annually"** with a **"$10,000 annual minimum"** and a **"6-8 weeks"** implementation. |
| A2 | https://www.trustlayer.io/pricing | first-party | **HTTP 404 — there is no pricing page.** |
| A3 | https://www.trustlayer.io/resources/frequently-asked-questions-faq | first-party | Verbatim: *"Pricing varies depending on platform usage. We offer plans that fit budgets and organizations of all sizes."* Buyer is directed to *"schedule a demo"*. No published number. |
| A4 | https://www.illumend.ai/ | first-party | myCOI's rebrand. Claims **45M+ insurance documents**, **16 years**, **"87% faster reviews vs manual"**, **"50% fewer delays from missing docs"**, **"4x faster"**. AI engine named **Lumie**, which reads *"additional insureds, waivers of subrogation, primary and non-contributory clauses, per-project aggregates."* **No price shown; a demo is required.** |
| A5 | https://getjones.com/pricing/ | first-party | Priced **per record, per year**. Verbatim: *"Pricing is based on records per year…"*, *"Your per-record pricing includes unlimited COIs and lease extractions for that record. No per-review or per-upload charges."*, *"Jones never charges your vendors/subcontractors/tenants to submit insurance documents."* **No dollar figure; "Talk to Us" to get one.** |
| A6 | https://getjones.com/blog/understanding-coi-management-solution-pricing/ | rival | Names the two models (per-document vs flat fee) and criticises competitors who *"charge tenants, vendors, or subcontractors to upload their COIs"* and who *"lock insurance expert review behind additional charges."* No dollar figures. |
| A7 | https://www.vertikalrms.com/article/how-much-does-coi-tracking-software-cost-2026-pricing-guide/ | rival (CertFocus) | Category price bands. CertFocus self-service **$6-$8/vendor/yr, $7,500 annual minimum**; full-service **$13-$29/vendor/yr, $10,000 minimum**; **vendor-pay option $85-$150 per vendor/year**; implementation **$3,500-$4,800**. Claims for others: myCOI **$1,500-$3,000/yr, $30-$60/vendor**; SmartCompliance **$2,000-$4,000/yr, $40-$80/vendor**; C2COI **$800-$2,000/yr**. Entry $800-$2,000/yr; professional $2,500-$10,000; enterprise $10,000-$50,000+. |
| A8 | https://www.certificial.com/blog-post/we-compared-7-best-coi-tracking-software-in-depth-feedback-and-review | rival (Certificial) | Certificial free plan **up to 5 vendors**; Ebix *"annual costs typically starting in the mid-five figures"* and *"filed for bankruptcy in December 2023"*; asserts myCOI is **$200-400/month** (contradicted by A4 and D1/D2 — see CLAUDE.md). |
| A10 | https://www.evidentid.com/pricing | first-party | **The second published ladder, and it excludes our ICP by design.** Essential **"$15 per vendor, billed annually"** for **200 to 1,000 third parties**; Pro **"$25 per vendor, billed annually"** for **500 to 10,000**; Enterprise **"Custom"** for 10k+. Note: *"Standard list rate is shown. Volume-based discounts are available."* The floor of 200 third parties is above the whole Certly ICP band, so the entry price is effectively **$3,000/year**. |
| A11 | https://www.evidentid.com/ | first-party | Evident's positioning, verbatim headline: *"Stop reacting to risk. Start getting ahead of it."* Sells to *risk managers in large enterprises* — named logos include 7-Eleven, Coca-Cola, Amazon, United Rentals, Lowe's. "Book a Demo" is the primary path. **This is the clearest picture in the file of the buyer we are deliberately not selling to.** |
| A9 | https://www.illumend.ai/evaluation-buying/the-7-best-software-options-for-contractor-insurance-compliance-in-2026 | rival (myCOI) | Vendor-side friction table across 7 platforms. Says TrustLayer's no-login vendor upload is a **paid-tier** feature; Billy is **"Demo only"** and *"only covers construction and routes complex endorsements to its human team"*; CertFocus: *"Non compliant COIs don't trigger automated remediation, or outreach. They go to a human for review."* No prices published for any of the seven. |

**Net of A1-A11, verified:** of the seven platforms named in the brief, **only two publish a price — bcs
and Evident** — and Evident's cheapest tier starts at **200 third parties**, i.e. above the entire Certly
ICP band, so for a buyer with 25-150 certificates **bcs is the only priced option that exists**. The other
five require a demo to learn what they cost. That is the single most load-bearing competitive fact
in this file and it was checked at each vendor's own site, not inferred from a comparison article.

## B. What the incumbents' users actually say

| # | URL | class | what it established |
|---|---|---|---|
| B1 | https://www.capterra.com/p/234580/myCOI/ | reviews | 4.7/5, 47 reviews, **"Contact vendor"**, no free trial. Verbatim cons: *"System was a mess"*; *"Getting myCOI up and running with all the little nuances of our company was definitely difficult."*; *"Every time you run a report there is no way to save your favorite setting."* |
| B2 | https://www.softwareadvice.com/insurance/mycoi-profile/ | reviews | Same product, independent panel. 4.7/5, 47 reviews, **"Pricing available upon request"**. Verbatim cons with the reviewer's industry: *"The customization of insurance requirements is a bit lacking"* (Real Estate, 51-200); *"Bulk downloading documents in the cert Management is not usable...it takes us days"* (Construction, 501-1000); *"Sometimes it takes longer for a COI to be reviewed once a revision has been uploaded"* (Construction, 201-500); *"They were hard to work with, system was a mess"* (Construction, 11-50); *"Not super intuitive and some functionality takes a ramp up period"*. Verbatim pro: *"They contact the vendors when there are non compliance issues"*; *"myCOI symcs with Procore"*. |
| B3 | https://www.capterra.com/p/198486/TrustLayer/ | reviews | 5.0/5 but **only 2 reviews**, both vendor-referred with incentives. Verbatim: *"Before TrustLayer, I had about 5 clients I was doing certificate tracking for and I could never take a day off without falling behind. Now, I have 25 clients…"*; con: *"Because we manage dozens of organizations, it would be helpful to be able to make changes at the master level and not at the organization level."* |
| B4 | https://www.softwareadvice.com/compliance/trustlayer-profile/ | reviews | Same 2 reviews. Lists **"Free version available"** — contradicts B3's "no free trial" and A3's demo-gating; recorded as a contradiction, resolved in CLAUDE.md. |
| B5 | https://www.g2.com/products/trustlayer/reviews | — | **HTTP 403. Blocked.** Replaced by B3/B4. |

## C. What the *vendor* pays — the fact the category does not advertise

| # | URL | class | what it established |
|---|---|---|---|
| C1 | https://www.solomonorg.com/gridmedia/img/pdf/solomon-vendorshield-flyer-121520.pdf | first-party (a PM firm) | Yardi **VendorShield** via **VENDORCafé**. Verbatim: *"contractors will be required to pay a fee for VendorShield compliance… This $110 fee is annual and required to keep your compliance and registration current."* |
| C2 | https://smho.co/wp-content/uploads/2021/02/South-Metro-New-Vendor-PacketRealPage.pdf | first-party (a housing authority) | RealPage **Compliance Depot**. Verbatim: *"The annual enrollment fee is only $99 for onsite vendors or $80 for offsite vendors."* Also lists the packet: *"W-9 / Insurance Certificate and Endorsements / Signed Vendor Agreement."* |
| C3 | https://www.yardi.com/product/vendorshield/ | first-party | VendorShield positioning: automated vendor credentialing, continuous monitoring, W-9s, COIs and contracts, integrated with Yardi Voyager. |
| C4 | https://www.contractortalk.com/threads/compliance-depot.140286/ | — | **307 → `tollbit.` → HTTP 402 Payment Required. Blocked.** The contractor-voice complaint about these fees is therefore sourced to C1/C2 (the fee, in the property manager's own words) rather than to a forum. |

## D. The buyer's own stack, and what it does and does not do about COIs

| # | URL | class | what it established |
|---|---|---|---|
| D1 | https://v2.support.procore.com/product-manuals/directory-company/tutorials/update-expiring-insurance-for-a-vendor-in-the-company-directory | first-party | Procore stores **Insurance Type, Effective Date, Expiration Date, Limit, Name, Policy Number** plus an attachment and notes. Verbatim: *"Procore automatically emails your Insurance Manager when a vendor's policy is set to expire"*, and *"The system sends daily reminders starting two weeks before the expiration date and continues for up to 60 days after, or until the policy date is updated."* Also: with a Sage 300 CRE ERP integration the insurance fields are **locked in Procore** and must be edited in the ERP. |
| D2 | https://www.buildium.com/blog/property-management-vendor-guide/ | first-party | Buildium's own advice to its property managers, verbatim: *"Always ask for and verify a vendor's license and certificate of insurance before hiring them"* and *"Keep a digital copy of these documents on file and set reminders to check for renewals."* This is the market leader telling its customers the state of the art is a reminder. |
| D3 | https://www.buildium.com/pricing/ | first-party | The PM buyer's price and purchase expectation: Essential **"starting at $62/month"**, Growth **$192**, Premium **$400**; **"14-day trial"**, **"No credit card required"**, **"It takes just 30 seconds"**, sample data provided. No demo required to start. |
| D4 | https://www.procore.com/pricing | first-party | The GC buyer's opposite expectation, verbatim: *"We charge an upfront annual fee by product and based upon your Annual Construction Volume (ACV) — the aggregate dollar value of the construction work across your projects."* No price published; a questionnaire or a phone number. Also *"We'll never charge you for adding more users."* |
| D6 | https://www.softwareadvice.com/construction/buildertrend-profile/ | reviews | Buyer B's project software, on an independent panel: **"Custom quote required (no standard pricing published)"**, a free trial exists, 4.5/5 on **2,486** reviews. Verbatim cost complaints: *"quite an expensive software for a small company"*; *"way too expensive"*; *"the costs do increase from time to time"*. Setup: *"a huge learning curve for all teams"*; *"like 10x more clicking that there needs to be"*; sales *"a bit pushy regarding add-ons"*. |
| D5 | https://www.expirationreminder.com/blog/track-vendor-insurance-certificates-without-excel | rival | Characterises the PMS gap: AppFolio/Buildium *"store vendor records and often have a single-date expiry field, but rarely extract limits from the PDF, check additional insured status, block booking of non-compliant vendors, or chase vendors."* Treated as a rival's claim, corroborated by D1 (Procore's field list is exactly a single expiry date + limit per line) and D2. |

## E. The domain vocabulary and the moment of discovery

| # | URL | class | what it established |
|---|---|---|---|
| E1 | https://www.illumend.ai/insurance-knowledge/what-is-an-acord-25-certificate-and-how-to-read-one | first-party (incumbent) | Field-by-field ACORD 25 vocabulary. Verbatim: *"being listed as the certificate holder does not give you any coverage rights. If you need protection under the vendor's policy, you'd need to be added as an additional insured, which requires a separate endorsement on the policy."* And: a certificate *"is a starting point, not a guarantee"* reflecting coverage *"at the moment it was issued."* |
| E2 | https://www.travelers.com/business-insurance/services/premium-audit/general-liability-premium-audit | first-party (carrier) | The GC's dated, dollar-denominated event. Records required at audit: *"payroll reports, check registers, cash disbursements journal (including subcontractors, casual labor and material costs) and Certificates of Insurance."* Instruction: *"Obtain and maintain valid Certificates of Insurance (COI) showing workers compensation coverage for all independent/subcontracted work during the policy term."* Consequence: *"Without valid Certificate of Workers Compensation Insurance we may charge a premium for work performed by an independent contractor/subcontractor."* |
| E3 | https://www.foagency.com/audit-nightmares-subcontractor-compliance-general-contractors | agency (broker) | The size of that consequence: *"five- or six-figure premium adjustments"*, *"shocking additional premium — tens of thousands of dollars you didn't budget for"*, carriers charge *"a higher rate per $1,000 of subcontractor costs than gross receipts"*, and *"many general liability policies include subcontractor warranty clauses"* under which *"your insurer may deny coverage."* |
| E4 | https://getjones.com/blog/vendor-certificates-of-insurance-what-property-managers-need-to-know/ | rival | The PM's discovery moment: a 48-hour deadline to produce every vendor COI, and *"If COIs are buried in inboxes or on individual desktops, meeting that deadline could be impossible."* And *"If the vendor's COI expired six months prior and a leak from their equipment causes significant damage, the property owner could be stuck with the repair bill."* |
| E5 | https://www.getbcs.com/blog/what-is-certificate-of-insurance-tracking-the-2026-complete-guide-for-risk-managers | rival | The manual baseline, verbatim: *"Risk management teams collected paper certificates, filed them alphabetically, and set calendar reminders for renewal dates."* Also *"Organizations discover coverage gaps only when filing claims after incidents"* and an unsourced *"15-20 hours weekly"* admin figure (recorded, **not used** as a persona fact because the vendor gives no method). |
| E7 | https://www.dfs.ny.gov/apps-and-licensing/insurance-companies/certificates-approved/acord-25-2025-12-liability | **first-party / government** | The blank **ACORD 25 (2025/12)** as published by the New York State Department of Financial Services. Fetched as a PDF and text-extracted; the full extraction is kept in `identity/research/acord25-form-text.txt`. This is the primary source for the whole product's field list and for the two sentences that justify the product's honesty rules, verbatim: **"THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE CERTIFICATE HOLDER. THIS CERTIFICATE DOES NOT AFFIRMATIVELY OR NEGATIVELY AMEND, EXTEND OR ALTER THE COVERAGE AFFORDED BY THE POLICIES BELOW."** and **"IMPORTANT: If the certificate holder is an ADDITIONAL INSURED, the policy(ies) must have ADDITIONAL INSURED provisions or be endorsed. If SUBROGATION IS WAIVED… certain policies may require an endorsement. A statement on this certificate does not confer rights to the certificate holder in lieu of such endorsement(s)."** Column headers on the coverage grid: **INSR LTR · TYPE OF INSURANCE · ADDL INSD · SUBR WVD · POLICY NUMBER · POLICY EFF (MM/DD/YYYY) · POLICY EXP (MM/DD/YYYY) · LIMITS**. Footnote: **"*LIMITS SHOWN MAY HAVE BEEN REDUCED BY PAID CLAIMS."** Cancellation block: **"SHOULD ANY OF THE ABOVE DESCRIBED POLICIES BE CANCELLED BEFORE THE EXPIRATION DATE THEREOF, NOTICE WILL BE DELIVERED IN ACCORDANCE WITH THE POLICY PROVISIONS."** |
| E6 | https://www.getbcs.com/blog/starters-guide-to-coi-tracking-software-for-general-contractors-managing-subcontractors | rival | GC-side framing: *"A single project can involve 40 or more active subcontractors"*; *"Spreadsheets don't send alerts when a subcontractor's general liability drops from $2 million to $500,000 mid-project."* |

## F. Naming and availability

All DNS resolved through `https://dns.google/resolve` (Google's DoH JSON) on 2026-09-03, because `dig` is
not installed here and the system resolver answers `127.0.0.1` for everything.
Read `Status`: `0` = registered, `3` = NXDOMAIN (free), `2` = SERVFAIL.

| # | check | result |
|---|---|---|
| F1 | `certly.com` A | `127.0.0.1`, NS `ns1/ns2.ns-serve.net` → **registered, not in service** (a loopback A record is a dormant/parked configuration). `curl -sI https://certly.com` → **HTTP/1.1 502 Bad Gateway**. |
| F2 | `certly.io` | resolves (Cloudflare), HTTP 200 |
| F3 | `certly.ai` | resolves (135.181.228.222), connection failed (`000`) |
| F4 | `certly.app` | HTTP 200, `<title>Create Next App` — a parked Next.js placeholder |
| F5 | `certly.co` | 301s to `haleyreedofficial.com`, a gambling page — an actively abused domain |
| F6 | `certly.net` | HTTP 200, "Parked Domain name on Hostinger DNS system" |
| F7 | WebSearch "Certly startup company name" | at least three live users of the name: **Certly** (Netherlands, ed-tech/professional certification SaaS, founded 2022 — eu-startups.com directory, Crunchbase, bouncewatch); **CERTLY LTD** (UK company **14873119**, incorporated 16 May 2023 — Companies House); and **certly.io** (Michigan, trust-and-safety, listed as permanently closed). |
| F8 | `coverfile.com` | registered, NS `nsg1/nsg2.namebrightdns.com` → held at a domain-sale registrar |
| F9 | `coverfile.io`, `coverfile.app`, `getcoverfile.com`, `usecoverfile.com`, `coverfileapp.com` | **all NXDOMAIN — free on 2026-09-03** |
| F10 | WebSearch `"Coverfile" OR "Cover File" company software` | **no company, product or trademark found** under that name |
| F11 | `certbinder.com` | SERVFAIL (registered but broken delegation); `certbinder.io`, `thecertbinder.com` **free** |
| F12 | WebSearch `"Certbinder" OR "Cert Binder" software company insurance` | **no company found**. Note the word *binder* is an insurance term of art: temporary proof of coverage issued before the policy — a live ambiguity for this buyer |
| F13 | `greenfile.com` | registered (GoDaddy DNS); `greenfile.io`, `greenfile.app` **free** |
| F14 | WebSearch `"Greenfile" software company trademark` | **greenfile.work** exists — a Japanese construction document-management SaaS (Tracxn profile). Adjacent category, same word |
| F15 | `trademarks.justia.com` | **HTTP 403. Blocked.** |
| F16 | `tmsearch.uspto.gov` API (2 shapes tried) | S3 `NoSuchKey` / `MethodNotAllowed` — **no usable public JSON endpoint at that path. Blocked.** Formal clearance flagged as a founder task. |
| F17 | ~40 other candidate `.com`s | checked and logged in `identity/research/domains.txt`; nearly every dictionary compound in this space is registered, most of them parked at a resale registrar (namebright, afternic, hugedomains, sedo, atom, squadhelp) |

## G. Category adjacency (what the buyer's other tools look like)

| # | URL | what it established |
|---|---|---|
| G1 | https://www.yardi.com/product/vendorshield/ | Yardi's vendor-credentialing surface (see C3) |
| G2 | https://www.buildium.com/pricing/ | Buildium's self-serve trial norms (see D3) |
| G3 | https://www.procore.com/pricing | Procore's ACV quote model (see D4) |
| G4 | https://getjones.com/ , https://getjones.com/property-management/ | Jones is the one incumbent aimed squarely at the PM buyer; "Insurance Compliance at Scale for the Built World" |
| G5 | https://www.procore.com/ (design tokens scraped from the served HTML; dump kept in `identity/research/procore-tokens.txt`) | **The only first-party *visual* evidence in this file.** Procore's `meta name="theme-color"` is **`#FF5200`**, a safety orange. Its neutral ramp is warm, not grey: `--pc-colors-gray-glass #F5F1ED`, `--pc-colors-torque-stone #ECE0D6`, `--pc-colors-gray-light #DCCDC1`, `--pc-colors-gray-aluminum #D4CAC1`. And the tokens are **named after the jobsite**: `gray-asphalt`, `gray-concrete`, `gray-rebar`, `gray-steel`, `gray-granite`, `gray-stone`, `gray-iron`, `blue-tarp #0033A1`, `blue-painters-tape #435CC8`, `yellow-crane #FF9F19`, `yellow-roadway #FFB648`, `yellow-flashlight #ED7800`. Command used: `curl -sL https://www.procore.com/ \| grep -oE '--pc-colors-[a-z0-9-]+:#[0-9a-fA-F]{3,8}' \| sort -u` |
| G7 | https://designsystem.digital.gov/design-tokens/typesetting/font-family/ | first-party (US government) | Public Sans is the U.S. Web Design System's **default sans-serif**, shipped as the token `$theme-font-type-sans: 'public-sans'` with the stack `"Public Sans Web", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif…`, and the sans role "defaults to serving body text and user interface typography". The page does not state who designed it, so `IDENTITY.md` claims only the USWDS role, not the authorship. |
| G6 | https://www.buildium.com/ , https://getjones.com/ (same method) | Both serve WordPress default palettes (`--wp--preset--color--*`) with no bespoke brand tokens exposed in the served HTML; Jones exposes only chrome tokens (`--border-color:#eaedf4`, white menu titles). `appfolio.com`, `yardi.com`, `trustlayer.io`, `getbcs.com`, `certificial.com`, `illumend.ai` and `buildertrend.com` expose **no** `theme-color` and no brand tokens in the served HTML — so no first-party visual claim is made about them anywhere in `IDENTITY.md`. |

## H. Blocked or unusable, with what was tried

- `g2.com` — 403 (1 attempt via WebFetch, 1 via search-result fetch). Replaced by Capterra + SoftwareAdvice.
- `contractortalk.com` — 307 to a `tollbit.` paywall, then 402. 2 attempts. Replaced by C1/C2.
- `trademarks.justia.com` — 403. 2 attempts.
- `tmsearch.uspto.gov` — no public JSON API at the tried paths. 2 attempts.
- `trustlayer.io/pricing` — 404 (this is itself the finding, recorded as A2).
- `fpimgt.com` vendor-requirements PDF — 503 twice.
- `vendorshield.app` — 503 / empty body. A "$490/yr" figure appeared in a search summary for it and is
  **deliberately not used** anywhere, because the page could not be opened.
- `windsorcommunities.com` vendor page — 404.
- `reddit.com`, `facebook.com`, `yelp.com` — blocked by the environment, per the brief. Not attempted.
- `vantaca.com/features` — fetched, HTTP 200, but the page names only a "Vantaca Vendor" menu item with no
  feature text. `CINC Systems` — a targeted search returned nothing about COI or vendor-insurance features.
  **Two attempts across the two products; no evidence either way.** `PERSONA.md §2.4` says exactly that
  rather than guessing, and `§9` carries it as an open question for the founder.
- `narpm.org` / `caionline.org` chapter pages — phase-3's own notes record them as client-rendered / 403.
  Not re-attempted; the association angle is not load-bearing for this deliverable.
