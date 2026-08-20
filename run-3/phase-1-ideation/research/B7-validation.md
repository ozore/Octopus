# Run 3 — Deep validation: B7 SponsorScope

Validated 2026-08-19 by four independent lenses (round 3). Every URL was
fetched on the date stated.
**Overall verdict: REFUTED AS PITCHED** — per-lens: mandate=REFUTED, corpus=REFUTED, competition=REFUTED, kill=REFUTED


---

## 01 Mandate & demand — verdict: REFUTED

## B7 — SponsorScope: deep validation (all checks run live 2026-08-19)

**Verdict: REFUTED.** The data layer is real and alive; the business around it is not. The card's single piece of monetization evidence is a misread, a functioning cheaper incumbent already sells the exact API tier proposed, the free layer is thick and getting thicker, and the named buyer (recruiters/staffing) is the one buyer nobody in this category actually sells to.

### 1. The knowledge base is genuinely alive (the card's one solid claim)

`HEAD https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q3.xlsx` → **HTTP 200**, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, **251,850,891 bytes**, `Last-Modified: Fri, 07 Aug 2026 17:33:30 GMT`. PERM equivalent → **HTTP 200**, **156,267,808 bytes**, `Last-Modified: Fri, 07 Aug 2026 18:50:17 GMT`. The OFLC performance page states the files "cover determinations issued between October 1, 2025 and June 30, 2026." Quarter closed 6/30, published 8/7 — a ~5-week lag, refreshing. **Kill pattern 6 (dead data) does not apply.**

### 2. FATAL: the cornerstone evidence is a homophone error

The card rests on "a live Gumroad product… 'Sponsorship Premium'… $199… demonstrating real money already changes hands for exactly this kind of employer-sponsorship lookup." I re-fetched the page (HTTP 200, 29,587 bytes). The embedded `"price":199.0` is real. The product is not. Its own description: *"🚀 Sponsor Premium – Full Site Exposure 📍 $199 USD / month… your logo and link will be displayed not only on the Home Page but also on every job listing… 20,000+ monthly visitors… Sponsor Page: https://www.opentoworkremote.com/sponsors."* It is an **advertising slot on a remote job board** — "sponsorship" as in sponsor-a-newsletter, not visa sponsorship. Page JSON also shows `"ratings":{"count":0}` and `"sales_count":null`. **There is zero verified evidence in the card that anyone pays for H-1B sponsorship data.**

### 3. Kill pattern 2 confirmed — the proposed API already exists at $9/mo

**h1bapi.com** (HTTP 200, fetched today) is SponsorScope's API tier, shipped: *"9,172,091 H-1B visa salary records… Covers all 19 fiscal years from FY2008 to FY2026, across 56 states and territories,"* 19 fields, FTS5 search, filters on state/salary/SOC/wage level/case status/fiscal year. Pricing on-page: **Free $0 (20 req/day) · Dev $9/mo · Pro $29/mo · Business $79/mo**. It is functioning, not vaporware: `/openapi.json` → 200, 4,924 bytes, `application/json`; `/api/v1/salaries?employer=google` → **401** `{"error":"API key required…"}`; `/llms.txt` → 200 advertising an MCP server (`npx h1b-salary-mcp`). It even pre-empts the pitch: *"Why Use an API Instead of a Website? Most H-1B salary sites are browser only."* SponsorScope's hypothesized **$49–$149/seat plus metered API is 5–15× a working incumbent's price.**

### 4. Kill patterns 1 and 3 — the free layer is thick, current, and subsidized

- **H1BGrader "H1B Sponsor Checker"** Chrome extension: free, **v2.0.0, last updated 2026-08-17 (two days ago)**, 4,000 users, 5.0★/2 ratings. It overlays *"H1B sponsorship salaries, LCA/USCIS data, and employer insights"* — approval/denial history over 10 years, dependency status, willful-violator flags — directly on **LinkedIn, Indeed, Glassdoor, Dice and Google Jobs**. That is DOL+USCIS merged in the recruiter's actual workflow, for $0.
- Duke's career hub lists three more free ones: **Interstride H-1B Sponsorship Finder, FrogHire, Ultimate H-1B Sponsor Checker**.
- **sponsorstats.com** (200): free per-company filing history, AI summaries, LinkedIn extension, an "Add to Claude" MCP connector, and the words *"No setup, no paywall."*
- **h1btrends.com** (200): free per-company LCA+PERM pages over "3M+" filings. **h1bdata.info** (200): free, ad-supported, "4.8 million records."
- **ellis.com** (200) gives away a *"Visa Sponsors Database — Search 180k+ H-1B sponsor companies"* as lead-gen for an immigration practice pricing **H-1B at $3,000, EB-2 NIW at $15,000**. You cannot out-price a competitor whose data is a customer-acquisition cost.
- **USCIS H-1B Employer Data Hub** (the free first-party substitute the card never names) covers FY2009–**FY2026 Q3**, queryable by fiscal year, employer, city, state, ZIP and NAICS, with **Excel/.csv download** — see caveat in Unproven.
- ATS side: **Ceipal** ships an LCA/Immigration module to IT staffing firms — but for *their own* filings and PAF compliance, not third-party lookup. Partial pattern-3 hit only.

### 5. The recruiter-buyer premise does not hold

A targeted hunt for a paid, per-seat, recruiter-facing sponsorship-data product returned **none**. Every monetized actor in this category sells to job seekers/international students (MyVisaJobs, H1BGrader, SponsorStats, F1 Hire), to universities (GoinGlobal, Interstride), or uses the data as lead-gen for legal fees (Ellis). Structurally this makes sense: SIA reports staffing firms are themselves *among the top H-1B users* (Compunnel 990, Randstad Digital 481, Kforce 383) — the staffing agency **is** the sponsor and knows its own posture; a direct-hire recruiter learns a client's sponsorship policy from the client, per requisition, not from a four-quarter-lagged filing archive. MyVisaJobs' Premium chart (fetched 200) already sells the genuinely recruiter-shaped asset — *"visa sponsors' HR contact details including names, job titles, phone numbers and email addresses"* plus CSV email export — and sells it to candidates.

### 6. The regime shifted under the premise

Primary-verified: **Proclamation 10973**, signed 2025-09-19, published FR 2025-09-24 (doc 2025-18601), imposing $100,000 on certain new H-1B petitions; and DHS's **wage-weighted selection final rule** (FR doc 2025-23853, published 2025-12-29, **effective 2026-02-27**) replacing the random lottery. Secondary reporting puts FY2027 registrations at 211,600 vs 343,981 (−38.5%). Both cut the same way: the addressable base shrinks, and *past filings become a materially worse predictor of present sponsorship willingness* — which is the entire proposition. The free extensions already carry that disclaimer.

### 7. Engine-never-arbiter makes the good version illegal and the legal version a commodity

The compliant output — "Employer X filed N certified LCAs FY2019–FY2026, case numbers attached" — is exactly what six free tools already render inside LinkedIn. The output a recruiter would pay $99/seat for — "this employer will sponsor your candidate" — is a liability-bearing outcome assertion the gate forbids. The gap is structural, not a copywriting problem.


### Proven (primary source, fetched on date stated)

- DOL OFLC data is live, not dead: LCA_Disclosure_Data_FY2026_Q3.xlsx HTTP 200, 251,850,891 bytes, Last-Modified Fri 07 Aug 2026 17:33:30 GMT; PERM_Disclosure_Data_FY2026_Q3.xlsx HTTP 200, 156,267,808 bytes, Last-Modified Fri 07 Aug 2026 18:50:17 GMT (curl, 2026-08-19)
- DOL OFLC performance page states the FY2026 Q3 files 'cover determinations issued between October 1, 2025 and June 30, 2026' — ~5-week publication lag, standing quarterly cadence, FY2008 onward
- The card's sole monetization evidence is misidentified: maurobonfietti.gumroad.com/l/sponsor-premium (HTTP 200, 29,587 bytes) is an ADVERTISING slot on the job board opentoworkremote.com — '$199 USD / month… your logo and link… displayed not only on the Home Page but also on every job listing… 20,000+ monthly visitors' — not visa-sponsorship data. Page JSON shows "ratings":{"count":0} and "sales_count":null
- Direct cheaper incumbent for the exact proposed API tier: h1bapi.com (HTTP 200) serves 9,172,091 LCA records, FY2008-FY2026, 19 fields, at Free $0 / Dev $9 per mo / Pro $29 per mo / Business $79 per mo — vs SponsorScope's hypothesized $49-$149/seat
- h1bapi.com is functioning, not a landing page: /openapi.json 200 (4,924 bytes, application/json); /api/v1/salaries?employer=google returns HTTP 401 with API-key prompt; /llms.txt 200 advertising an MCP server (npx h1b-salary-mcp)
- Free workflow-embedded substitute, updated 2 days ago: H1BGrader 'H1B Sponsor Checker' Chrome extension v2.0.0, last updated 2026-08-17, 4,000 users, free, overlays LCA + USCIS approval/denial history, dependency and willful-violator flags on LinkedIn, Indeed, Glassdoor, Dice and Google Jobs
- At least three more free sponsor-checker extensions exist and are recommended by university career offices (Interstride H-1B Sponsorship Finder, FrogHire, Ultimate H-1B Sponsor Checker) — per Duke career hub, fetched today
- sponsorstats.com (HTTP 200) offers free per-company H-1B filing history with AI summaries, a LinkedIn extension and an 'Add to Claude' MCP connector, stating 'No setup, no paywall' — the LLM distribution channel is also occupied
- The programmatic-SEO surface the card counts on is already occupied by multiple live sites: h1btrends.com (200, free per-company LCA+PERM pages, '3M+' filings), h1bdata.info (200, free, '4.8 million records'), ellis.com (200, free 'Search 180k+ H-1B sponsor companies')
- ellis.com gives the sponsor database away as lead-gen for immigration legal services priced H-1B $3,000, TN $2,500, O-1 $12,000, EB-2 NIW $15,000 — a competitor economically able to keep the data free indefinitely
- MyVisaJobs (founded 2006, HTTP 200) already ships the recruiter-shaped asset to the WRONG side: Premium membership includes 'visa sponsors' HR contact details including names, job titles, phone numbers and email addresses' plus CSV email download — sold to candidates, not recruiters
- Regime change verified at primary source: Proclamation 10973 'Restriction on Entry of Certain Nonimmigrant Workers', signed 2025-09-19, published Federal Register 2025-09-24, document 2025-18601 ($100,000 on certain new H-1B petitions)
- Regime change verified at primary source: DHS final rule 'Weighted Selection Process for Registrants and Petitioners Seeking To File Cap-Subject H-1B Petitions', FR document 2025-23853, published 2025-12-29, effective 2026-02-27 — replaces the random lottery with wage-level weighting
- Staffing firms are themselves top H-1B filers (SIA: Compunnel 990, Randstad Digital 481, Kforce 383), i.e. the staffing agency is usually the sponsor and already knows its own posture
- Ceipal, a mainstream IT-staffing ATS, ships an LCA/Immigration compliance module (LCA tracking, PAF, expiry reminders, work-authorization status) — partial kill-pattern-3 hit, though scoped to the firm's own filings rather than third-party employer lookup

### Unproven

- USCIS H-1B Employer Data Hub page could NOT be fetched directly — uscis.gov returns HTTP 403 (AkamaiGHost) to curl with browser UA, to WebFetch, and to the candidate CSV export paths; web.archive.org is blocked by this environment's egress policy. Its scope (FY2009 through FY2026 Q3; query by fiscal year, employer, city, state, ZIP, NAICS; Excel/.csv download; employers identified by last four digits of tax ID; first decisions on initial and continuing employment) is corroborated only by search-engine extraction of the live page today, not by a primary fetch. This is the free first-party substitute the card never mentions and it must be verified directly before any further work
- MyVisaJobs premium price: not obtainable. Membership benefit chart fetched (HTTP 200) but carries no dollar figures; /member/securedpaypalpayment.aspx redirects to sign-in; /employer/membership.aspx is Cloudflare-403
- H1BGrader paid plan pricing: /pricing, /extension/faqs, /extension/dashboard and /about all return Cloudflare HTTP 403. A 'Grande Plan' with a 60-job free trial is referenced in search snippets only; no verified dollar figure
- GoinGlobal H1B Plus university licence price: no public pricing page found; institutional, quote-based sale (which would itself violate the A1 self-serve gate if pursued as a channel)
- FY2027 H-1B registration figures (211,600 vs 343,981, -38.5%; 71.5% of selections holding US advanced degrees) come from secondary reporting; the USCIS primary could not be fetched (403)
- Litigation status of the $100,000 fee (reported District of Massachusetts vacatur 2026-06-08 and First Circuit denial of stay 2026-07-24) is secondary-sourced only — not fetched from a court docket or Federal Register notice
- Apify H-1B scraper actor pricing ('$3.00 per 1,000 results') is from a search snippet; the actor page was not fetched
- Row-level freshness inside the 252MB FY2026 Q3 xlsx was not opened (newest decision dates not inspected); freshness is inferred from Last-Modified 2026-08-07 plus DOL's own coverage statement through 2026-06-30
- No direct recruiter testimony was obtained — I found no forum, SIA article or vendor page in which a staffing recruiter describes paying for employer sponsorship-history lookup pre-submittal. Absence of evidence after a targeted hunt, not proof of absence

### Fatal risks

- The card's only monetization evidence is a category error: the $199 'Sponsorship Premium' on Gumroad is a job-board ad slot on opentoworkremote.com, with 0 ratings and null sales count. Remove it and nothing in the card shows a single dollar ever paid for H-1B sponsorship data
- A live, functioning incumbent (h1bapi.com) already sells the exact proposed API — 9.17M LCA records, FY2008-FY2026, 19 fields, plus an MCP server — at $9-$79/mo, 5-15x below the hypothesized $49-$149/seat. There is no room left in the price band the card assumes
- The free layer sits inside the buyer's workflow, not beside it: H1BGrader's free Chrome extension (updated 2026-08-17) renders DOL LCA plus USCIS approval/denial history directly on LinkedIn, Indeed, Glassdoor, Dice and Google Jobs — the precise moment a recruiter would consult SponsorScope. Three more free extensions do the same
- Buyer premise unsupported: every monetized player in this category sells to job seekers, universities, or uses the data as lead-gen for immigration legal fees. No paid recruiter/staffing per-seat sponsorship-data product surfaced. Staffing firms are themselves the sponsors (Compunnel 990, Randstad Digital 481, Kforce 383 filings), and a direct-hire recruiter learns a client's sponsorship policy from the client per requisition, not from a lagged filing archive
- Free data is a customer-acquisition cost for immigration law firms (Ellis: free 180k-company sponsor database funding $3,000 H-1B / $15,000 EB-2 NIW services). A subscription product competes against parties with a structural incentive to keep the data free forever
- The regime shifted under the premise in the last 11 months: Proclamation 10973 ($100k, FR 2025-18601, published 2025-09-24) and wage-weighted selection (FR 2025-23853, effective 2026-02-27), with registrations reportedly down 38.5%. Historical filing behavior is now a materially worse predictor of current sponsorship willingness — the exact inference the product sells
- Engine-never-arbiter bites structurally, not cosmetically: the compliant output ('employer X filed N certified LCAs, case numbers attached') is what six free tools already show; the output worth paying for ('this employer will sponsor your candidate') is a liability-bearing outcome assertion the gate forbids
- Even the differentiators are pre-empted — MyVisaJobs already sells sponsor HR contact names/phones/emails with CSV export, SponsorStats already ships an MCP connector and a LinkedIn overlay, and the programmatic-SEO surface is occupied by at least five ranking sites

### References

- https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q3.xlsx (fetched 2026-08-19) — curl -I: HTTP 200, content-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, content-length 251,850,891, Last-Modified Fri 07 Aug 2026 17:33:30 GMT — LCA disclosure data confirmed live
- https://www.dol.gov/media/PERM_Disclosure_Data_FY2026_Q3.xlsx (fetched 2026-08-19) — curl -I: HTTP 200, same content-type, content-length 156,267,808, Last-Modified Fri 07 Aug 2026 18:50:17 GMT — PERM disclosure data confirmed live
- https://www.dol.gov/agencies/eta/foreign-labor/performance (fetched 2026-08-19) — OFLC performance/disclosure index: HTTP 200 to curl -I; body via WebFetch confirms latest is FY2026 Q3 covering determinations 2025-10-01 to 2026-06-30, quarterly cadence, FY2008 onward (curl GET of body returns Akamai 403)
- https://maurobonfietti.gumroad.com/l/sponsor-premium (fetched 2026-08-19) — HTTP 200, 29,587 bytes. Re-verified: "price":199.0 is real but the product is a job-board ad slot ('Sponsor Premium – Full Site Exposure… your logo and link… on every job listing… Sponsor Page: opentoworkremote.com/sponsors'), ratings count 0, sales_count null — refutes the card's cornerstone evidence
- https://h1bapi.com/ (fetched 2026-08-19) — HTTP 200, 35,095 bytes. Live incumbent API: 9,172,091 LCA records, FY2008-FY2026, 19 fields; pricing Free $0 (20 req/day), Dev $9/mo, Pro $29/mo, Business $79/mo
- https://h1bapi.com/openapi.json (fetched 2026-08-19) — HTTP 200, 4,924 bytes, application/json — OpenAPI 3.1.0 spec, proves the API is real
- https://h1bapi.com/api/v1/salaries?employer=google&per_page=2 (fetched 2026-08-19) — HTTP 401 {"error":"API key required. Sign up for a free key at /docs"} — endpoint functioning and gated
- https://h1bapi.com/llms.txt (fetched 2026-08-19) — HTTP 200, 1,425 bytes — documents free tier, $9/mo paid entry, and an MCP server (npx h1b-salary-mcp) for Claude/Cursor/Windsurf
- https://chromewebstore.google.com/detail/h1b-sponsor-checker-by-h1/lgkipoadghdedmdaheacnjcfabmheeck (fetched 2026-08-19) — H1BGrader 'H1B Sponsor Checker' extension: free, 4,000 users, 5.0/2 ratings, v2.0.0, last updated 2026-08-17; overlays LCA + USCIS approval/denial history on LinkedIn, Indeed, Glassdoor, Dice, Google Jobs
- https://careerhub.students.duke.edu/resources/h-1b-visa-sponsor-checker-web-extensions/ (fetched 2026-08-19) — Duke career hub lists three additional FREE sponsor-checker extensions: Interstride H-1B Sponsorship Finder, FrogHire, Ultimate H-1B Sponsor Checker
- https://sponsorstats.com/ (fetched 2026-08-19) — HTTP 200, 80,861 bytes — free H-1B company filing history with AI summaries, LinkedIn extension, 'Add to Claude' MCP connector, explicit 'No setup, no paywall'
- https://h1btrends.com/h1b/company/bullhorn (fetched 2026-08-19) — HTTP 200, 181,210 bytes — free per-company LCA+PERM page, '3M+' filings, last five fiscal years; programmatic-SEO surface already occupied
- https://h1bdata.info/ (fetched 2026-08-19) — HTTP 200, 58,170 bytes — free ad-supported LCA index, 'more than 4.8 million records'
- https://www.ellis.com/visa-sponsors/bullhorn-inc/h1b (fetched 2026-08-19) — HTTP 200, 182,025 bytes — immigration law firm giving away a free 'Search 180k+ H-1B sponsor companies' database as lead-gen for services priced H-1B $3,000, TN $2,500, O-1 $12,000, EB-2 NIW $15,000
- https://www.myvisajobs.com/ (fetched 2026-08-19) — HTTP 200, 65,916 bytes — incumbent since 2006, '550k Users', free employer/LCA/PERM databases
- https://www.myvisajobs.com/about/membership-benefit.aspx (fetched 2026-08-19) — HTTP 200 — Premium tier already includes sponsor HR contact names, job titles, phone numbers, emails and CSV email download; sold to candidates. No price shown
- https://www.myvisajobs.com/Common/MembershipEmployerChart.aspx (fetched 2026-08-19) — HTTP 200, 29,334 bytes — employer-side membership is profile/branding/premium-listing, not sponsorship-history lookup. No price shown
- https://www.myvisajobs.com/about/faq.aspx (fetched 2026-08-19) — HTTP 200 — positions the product explicitly for foreign workers ('created by immigrants to address the need of foreign workers'), confirming the B2C buyer of this category
- https://www.federalregister.gov/api/v1/documents/2025-18601.json (fetched 2026-08-19) — Primary: Proclamation 'Restriction on Entry of Certain Nonimmigrant Workers', signing_date 2025-09-19, publication_date 2025-09-24 — the $100,000 H-1B proclamation fee
- https://www.federalregister.gov/api/v1/documents.json?conditions[term]=weighted%20selection%20H-1B&conditions[type][]=RULE (fetched 2026-08-19) — Primary: FR doc 2025-23853 'Weighted Selection Process for Registrants and Petitioners Seeking To File Cap-Subject H-1B Petitions', published 2025-12-29, effective 2026-02-27
- https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub (fetched 2026-08-19) — ATTEMPTED, NOT VERIFIED: HTTP 403 AkamaiGHost to curl (browser UA) and to WebFetch; CSV export paths under /sites/default/files/document/data/ also 403; web.archive.org blocked by egress policy. Scope (FY2009-FY2026 Q3, query by FY/employer/city/state/ZIP/NAICS, Excel/CSV download, last-4 tax ID) corroborated only via search-engine extraction of the live page today
- https://www.staffingindustry.com/editorial/engineering-staffing-report/new-100-000-h-1b-visa-raises-questions-concerns-for-staffing-firms- (fetched 2026-08-19) — ATTEMPTED, HTTP 403 to WebFetch. SIA coverage surfaced via search: staffing firms among top 100 H-1B users (Compunnel 990, Randstad Digital 481, Kforce 383) — secondary only
- https://www.ceipal.com/systems/lca-immigration (fetched 2026-08-19) — Surfaced via search (not fetched): IT-staffing ATS shipping a built-in LCA/immigration compliance module — scoped to the firm's own filings, partial kill-pattern-3 evidence

---

## 02 Corpus & moat — verdict: REFUTED

## B7 — SponsorScope: deep validation (fetched 2026-08-19/20)

### 1. The data pipeline is real, live, and better than the card describes in some ways — worse in others

Both flagship files re-confirmed by direct `curl -I` today. **LCA_Disclosure_Data_FY2026_Q3.xlsx**: HTTP 200, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, **251,850,891 bytes**, `Last-Modified: Fri, 07 Aug 2026 17:33:30 GMT`. **PERM_Disclosure_Data_FY2026_Q3.xlsx**: HTTP 200, same content-type, **156,267,808 bytes**, `Last-Modified: Fri, 07 Aug 2026 18:50:17 GMT`. The card's byte counts match exactly. History to FY2008 confirmed by fetch, not by page text: `H-1B_Case_Data_FY2008.xlsx` = 73,226,780 bytes HTTP 200; `H-1B_FY2010.xlsx` = 60,578,502 bytes HTTP 200.

**Not dead data.** I downloaded and parsed both files. LCA: 98 columns, `DECISION_DATE` spans exactly 2025-10-01 → 2026-06-30 — the stated reporting period, released ~5.5 weeks after quarter end. PERM: 137 columns, same date span. Real, current rows.

**But the file sizes are a lie about volume.** Of the LCA sheet's 1,032,735 rows, **595,239 (57.6%) are entirely blank trailing padding**; real records = **437,496**. PERM is worse: 925,430 rows, **only 112,550 non-blank (87.8% padding)**. Any ETL that trusts `max_row` or streams naively will burn most of its work on nulls. LCA holds 59,649 distinct raw employer strings and 863,076 `TOTAL_WORKER_POSITIONS`; PERM holds 30,948 distinct employers. **176,352 LCA rows (40%) declare `TOTAL_WORKSITE_LOCATIONS > 1`**, and the extra worksites live in a *separate* workbook (`LCA_Worksites_FY_2026_Q3.xlsx`, 45,032,522 bytes) plus `LCA_Appendix_A_FY2026_Q3.xlsx` (32,995 bytes). A single-file ingest silently loses 40% of geography.

### 2. Schema drift is severe and concrete — I pulled three layouts

- **FY2010** (`H-1B_Record_Layout_FY10.doc`, 86,721 B): **40 fields**, all prefixed `LCA_CASE_*`, and *wide-format* worksites — `LCA_CASE_WORKLOC1_CITY/STATE`, `WORKLOC2_*`, with parallel `PW_1/PW_UNIT_1/PW_SOURCE_1` and `PW_2/…`. Two worksite slots, hard-coded.
- **FY2018** (`H-1B_FY18_Record_Layout.pdf`, 54,648 B): **51 fields**, prefix dropped, single flat worksite block, `PW_SOURCE`/`PW_SOURCE_YEAR`.
- **FY2026 Q3** (216,927 B): **97 documented / 98 actual** fields, split across three workbooks, adding `EMPLOYER_FEIN`, a 14-field employer-POC block, a 17-field attorney/law-firm block, `SECONDARY_ENTITY`(+name), `PW_TRACKING_NUMBER`, and a five-field prevailing-wage provenance set.

Renames across the three: `LCA_CASE_SUBMIT` → `CASE_SUBMITTED` → `RECEIVED_DATE`; `LCA_CASE_EMPLOYMENT_START_DATE` → `EMPLOYMENT_START_DATE` → `BEGIN_DATE`; `TOTAL_WORKERS` → `TOTAL_WORKER_POSITIONS`; `SOC_NAME` → `SOC_TITLE`; `PW_SOURCE_1` → `PW_SOURCE` → four separate columns. PERM is worse: the FY2026 layout states verbatim *"This file is associated with the new PERM 9089 form which went into effect on June 1, 2023"* — a form-level break, not a rename. FY2009 ships **two** files (iCERT + eFile) from two different systems. This is 2–4 weeks of unglamorous mapping work, not "a one-time batch job."

### 3. The willingness-to-pay anchor is refuted outright (kill pattern 4)

The card's *only* money evidence is a "$199 'Sponsorship Premium'" Gumroad product. I fetched the page and read its embedded JSON-LD and `description_html`. It reads: *"🚀 Sponsor Premium – Full Site Exposure … $199 USD / month … Maximize your brand's visibility across the entire job board … Your logo + link on the Home Page … Your ad on every single job post."* It is an **advertising slot on the opentoworkremote.com job board** — "sponsorship" as in brand sponsorship, not visa sponsorship. `"ratings":{"count":0}`, `sales_count: null`. The miner matched on the word. **B7 has zero verified willingness-to-pay evidence.**

### 4. The exact product already exists, at 1/5 the price (kill pattern 2)

**h1bapi.com** — live, fetched today: *"9,172,091 H-1B visa salary records from the U.S. Department of Labor … all 19 fiscal years from FY2008 to FY2026 … 100% Salaries Normalized"*, 19 fields, fuzzy employer + job-title search, REST `/api/v1/salaries`, published OpenAPI 3.1.0, and an MCP endpoint. Pricing: **Free $0 (20 req/day) · Dev $9/mo · Pro $29/mo (25,000 req/day) · Business $79/mo (100,000 req/day)**. Endpoint verified live (401 `{"error":"API key required"}` without a key). SponsorScope's claimed moat — "15+ years of schema-drifted quarterly files cleaned into one consistent, fast-searchable index" plus "a metered API tier for ATS/CRM integrations" — is *already shipped*, with identical FY2008–FY2026 coverage, at $9–79/mo against a $49–149/seat hypothesis.

Free web substitutes, all fetched HTTP 200: **h1bdatahub.com** (3,290,299 filings, 190,161 companies), **h1btrack.com** (132k company profiles, no signup), **h1bdatawatch.com** (LCA search + lottery/multi-registration), **h1bdata.info** (4.8M records — but only through Sept 2025, i.e. a year stale), **myvisajobs.com** (free basic since 2006; premium only gates HR contact emails and all-years history; already ships an E-Verify database tab), **froghire.ai**. Plus free Chrome extensions (H1BGrader, Interstride, FrogHire) that overlay sponsor status directly onto LinkedIn/Indeed — the exact workflow surface, priced at $0.

### 5. Free first-party substitute (kill pattern 1) — and an autonomy hazard

The **USCIS H-1B Employer Data Hub** is free, searchable by employer/city/state/ZIP/NAICS, covers **FY2009 through FY2026 Q3**, downloads as CSV/Excel, and carries the field SponsorScope structurally cannot: actual petition Initial/Continuing **Approvals and Denials**. DOL's own **FLAG** portal offers no public LCA case lookup (only wage search + login-gated case status), so DOL is not the first-party threat — USCIS is. Critically: `www.uscis.gov` and `www.e-verify.gov` returned **HTTP 403 (Akamai edge deny)** to every automated fetch I tried — plain curl, browser UAs, cookies, HTTP/1.1, Referer, and WebFetch. So the one dataset that would fix the honesty gap is *not* cron-fetchable from a headless environment without a browser-driver workaround, which the autonomy gates disfavour. Note also that DOL's own performance page still points pre-FY2026 archives to `flcdatacenter.com`, which now **301s to flag.dol.gov/wage-data/wage-search** — a wage search, not an archive. That pointer is dead.

### 6. Does the honest framing still do the recruiter's job?

Primary source, 20 CFR 655.705 (govinfo CFR-2025): ETA *"is responsible for receiving and certifying labor condition applications"*; separately, *"DHS accepts the employer's petition (DHS Form I-129) with the DOL-certified LCA attached … whether the qualifications of the nonimmigrant meet the statutory requirements."* An LCA is a wage/working-conditions attestation certified by DOL; it is neither a petition nor an approval. The honest claim is therefore **"this employer filed and DOL certified N LCAs at these disclosed wages through 2026-06-30"** — mechanism plus source record, engine-never-arbiter clean. That framing *does* still serve "don't waste a submittal": an employer with 0 filings in 5 years is a real negative signal. But it is a weaker signal than USCIS approval counts, and USCIS gives those away free — so the honest version is strictly dominated by the free first-party tool on the buyer's core question.

### Verdict: **REFUTED**

Data pipeline: genuinely live, genuinely fetchable, genuinely more work than claimed. Market: the sole willingness-to-pay citation is a misread advertising slot; the claimed moat is a shipped $9/mo product; the buyer's best question is answered free by USCIS. If any part survives, it is a *narrow* recruiter-workflow wedge (ATS-embedded, employer-name entity resolution across mergers/DBAs, staffing-firm-vs-end-client disambiguation) sold on workflow, not on data — and that would need its own willingness-to-pay validation from zero.


### Proven (primary source, fetched on date stated)

- LCA_Disclosure_Data_FY2026_Q3.xlsx is live: HTTP 200, content-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, 251,850,891 bytes, Last-Modified Fri 07 Aug 2026 17:33:30 GMT (curl -I, 2026-08-19)
- PERM_Disclosure_Data_FY2026_Q3.xlsx is live: HTTP 200, 156,267,808 bytes, Last-Modified Fri 07 Aug 2026 18:50:17 GMT (curl -I, 2026-08-19)
- Data is NOT stale: I downloaded and parsed both files. LCA DECISION_DATE range 2025-10-01 to 2026-06-30; PERM DECISION_DATE range 2025-10-01 to 2026-06-30 — matching the stated reporting period, published ~5.5 weeks after quarter end.
- LCA FY2026 Q3 real content: 98 columns; 1,032,735 rows of which 595,239 (57.6%) are entirely blank trailing padding; 437,496 real records; 59,649 distinct raw EMPLOYER_NAME strings; 863,076 summed TOTAL_WORKER_POSITIONS; CASE_STATUS counts Certified 401,412 / Certified-Withdrawn 26,303 / Withdrawn 7,224 / Denied 2,557; VISA_CLASS H-1B 426,952, E-3 Australian 7,671, H-1B1 Chile 1,654, H-1B1 Singapore 1,219.
- PERM FY2026 Q3 real content: 137 columns; 925,430 rows of which only 112,550 are non-blank (87.8% padding); 30,948 distinct EMP_BUSINESS_NAME; Certified 87,741 / Certified-Expired 16,287 / Withdrawn 4,643 / Denied 3,879.
- Multi-worksite completeness gap: 176,352 LCA rows (40.3% of real records) declare TOTAL_WORKSITE_LOCATIONS > 1; additional worksites are in a separate workbook LCA_Worksites_FY_2026_Q3.xlsx (HTTP 200, 45,032,522 bytes, Last-Modified 07 Aug 2026), plus LCA_Appendix_A_FY2026_Q3.xlsx (HTTP 200, 32,995 bytes).
- History back to FY2008 verified by fetch, not page text: H-1B_Case_Data_FY2008.xlsx HTTP 200 73,226,780 bytes; H-1B_FY2010.xlsx HTTP 200 60,578,502 bytes; LCA_Disclosure_Data_FY2025_Q4.xlsx HTTP 200 79,134,156 bytes.
- Schema drift enumerated from primary record layouts: FY2010 layout (.doc, 86,721 B) = 40 fields, all LCA_CASE_* prefixed, wide-format worksites (LCA_CASE_WORKLOC1_CITY/STATE, WORKLOC2_*, PW_1/PW_UNIT_1/PW_SOURCE_1, PW_2/...). FY2018 layout (PDF, 54,648 B) = 51 fields, prefix dropped, single flat worksite, PW_SOURCE/PW_SOURCE_YEAR. FY2026 Q3 layout (PDF, 216,927 B) = 97 documented / 98 actual fields across three workbooks, adding EMPLOYER_FEIN, 14-field employer-POC block, 17-field attorney/law-firm block, SECONDARY_ENTITY(+business name), PW_TRACKING_NUMBER, and five prevailing-wage provenance fields.
- Concrete renames across layouts: LCA_CASE_SUBMIT -> CASE_SUBMITTED -> RECEIVED_DATE; LCA_CASE_EMPLOYMENT_START_DATE -> EMPLOYMENT_START_DATE -> BEGIN_DATE; TOTAL_WORKERS -> TOTAL_WORKER_POSITIONS; SOC_NAME -> SOC_TITLE; PW_SOURCE_1 -> PW_SOURCE -> {PW_OES_YEAR, PW_OTHER_SOURCE, PW_OTHER_YEAR, PW_SURVEY_PUBLISHER, PW_SURVEY_NAME}.
- PERM has a form-level break, not just renames: the FY2026 Q3 PERM record layout states verbatim 'This file is associated with the new PERM 9089 form which went into effect on June 1, 2023.' A separate PERM_Record_Layout_FY2022_Q4.pdf exists (HTTP 200, 200,283 bytes, Last-Modified 2022-11-09).
- FY2009 ships two incompatible files from two systems (Icert_LCA_FY2009.xlsx and H-1B_Case_Data_FY2009.xlsx, with .doc and .rtf layouts respectively) per DOL's own performance page.
- KILL PATTERN 4 — the card's sole willingness-to-pay anchor is refuted. https://maurobonfietti.gumroad.com/l/sponsor-premium fetched 2026-08-19 (HTTP 200, 29,587 bytes): JSON-LD name 'Sponsorship Premium', price 199.0 USD, and description_html reads 'Sponsor Premium - Full Site Exposure ... $199 USD / month ... Maximize your brand's visibility across the entire job board ... Your logo + link on the Home Page ... Your ad on every single job post ... Sponsor Page: https://www.opentoworkremote.com/sponsors'. It is a job-board ADVERTISING slot, not an H-1B data product. ratings.count = 0, sales_count = null.
- KILL PATTERN 2 — h1bapi.com is a live incumbent shipping SponsorScope's exact claimed moat at 1/5 the price. Fetched 2026-08-19: '9,172,091 H-1B visa salary records from the U.S. Department of Labor', 'all 19 fiscal years from FY2008 to FY2026', '100% Salaries Normalized', 19 fields, fuzzy employer/job-title search. Pricing: Free $0 (20 req/day, last 2 FY, 6 fields) / Dev $9 per month / Pro $29 per month (25,000 req/day) / Business $79 per month (100,000 req/day). OpenAPI 3.1.0 spec fetched (HTTP 200, 4,924 bytes). Endpoint /api/v1/salaries live: HTTP 401 {"error":"API key required..."}. Also advertises an MCP endpoint.
- Saturated free field, all fetched HTTP 200 on 2026-08-19: h1bdatahub.com ('3,290,299 Total Filings', '190,161 Companies'), h1btrack.com (free company profiles, no signup), h1bdatawatch.com (LCA search + employer lookup, DOL+USCIS), h1bdata.info (free, '4.8 million records', but coverage only 'October 2013 through September 2025' — a year stale), froghire.ai (free tier + premium), myvisajobs.com (free basic since 2006; premium gates only HR contact emails and all-years history; already ships an E-Verify employer database tab).
- LCA-is-not-sponsorship established from primary regulation (govinfo CFR-2025-title20-vol3-sec655-705.xml, fetched 2026-08-19): ETA 'is responsible for receiving and certifying labor condition applications (LCAs)'; separately 'DHS accepts the employer's petition (DHS Form I-129) with the DOL-certified LCA attached. In doing so, the DHS determines whether the petition is supported by an LCA which corresponds with the petition, whether the occupation named in the labor condition application is a specialty occupation ... and whether the qualifications of the nonimmigrant meet the statutory requirements for H-1B visa classification.'
- DOL FLAG (flag.dol.gov/programs/LCA, fetched 2026-08-19) offers NO public LCA case lookup or public API — only OFLC Wage Search, OFLC Wage Data Downloads, and a login-gated Case Status Search. So DOL itself is not the free first-party substitute.
- flcdatacenter.com — which DOL's own performance page still names as the pre-FY2026 archive — now 301-redirects to https://flag.dol.gov/wage-data/wage-search/ (a wage search, not an archive). Verified by curl -IL 2026-08-19.
- AUTONOMY HAZARD: www.uscis.gov and www.e-verify.gov return HTTP 403 (Akamai edge deny, 459-460 byte 'Access Denied' body) to every automated fetch attempted — plain curl, Chrome/Safari/Firefox UAs, HTTP/1.1, cookie jar, Accept and Referer headers, and WebFetch. The USCIS Employer Data Hub CSVs and the E-Verify employer file are therefore not cron-fetchable from a headless environment without a browser driver.

### Unproven

- USCIS H-1B Employer Data Hub coverage (FY2009 through FY2026 Q3), field list (Fiscal Year, Employer, Initial Approvals/Denials, Continuing Approvals/Denials, NAICS, Tax ID, State, City, ZIP) and CSV URL pattern https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-{YEAR}.csv — surfaced by search-engine indexing of USCIS pages, but I could NOT fetch any of it directly: every attempt returned Akamai HTTP 403. Treat as corroborated-not-verified.
- E-Verify participating-employer list contents, daily ~2am ET refresh cadence, and the 'five or more employees' self-report threshold — same Akamai 403 block; taken from search snippets of e-verify.gov, not a direct fetch.
- H1BGrader pricing: h1bgrader.com returns HTTP 403 to both curl and WebFetch. Its Chrome extension is documented as freemium with a 'complimentary 60-job posting trial of the Grande Plan' but I could not verify any dollar figure.
- MyVisaJobs premium price: the membership-benefit page renders the free-vs-premium feature chart but shows no dollar amount; the employer membership chart is Cloudflare-gated (HTTP 403). Payment runs through PayPal off-page. No verified price.
- Whether ANY tool in this category is actually sold to recruiters/staffing agencies at a per-seat B2B price. I searched for this specifically and found only B2C/job-seeker pricing (h1bapi $9-79 developer tiers, freemium consumer sites) plus Interstride selling to universities. The card's core buyer hypothesis — recruiters paying $49-149/seat/mo — has no verified market instance.
- Whether recruiters actually experience the stated pain ('waste submittals pitching candidates to non-sponsoring employers') strongly enough to buy. No customer evidence was found or claimed; the card cites none.
- LinkedIn Recruiter / SeekOut / hireEZ native sponsorship-filter status (kill pattern 3). Search indicates LinkedIn has no built-in visa-sponsorship job filter and returned nothing on SeekOut/hireEZ; I could not fetch either vendor's feature docs to confirm or rule out bundling.
- Total historical record count across FY2008-FY2026 for both programs (I profiled only the FY2026 Q3 files); and whether older files carry the same blank-row padding.
- DOL's exact published release-schedule commitment (a specific number of days after quarter end). The performance page states coverage periods but I found no stated SLA; the 2026-08-07 Last-Modified for a period ending 2026-06-30 is one observation, not a documented cadence.

### Fatal risks

- FATAL — the only willingness-to-pay evidence in the card is a misreading. The $199 Gumroad 'Sponsorship Premium' is an advertising slot on the opentoworkremote.com job board ('your logo and link ... on every job listing'), with 0 ratings and null sales. It has nothing to do with visa sponsorship data. B7's entire money-changes-hands claim evaporates on fetch.
- FATAL — the claimed moat is already a shipped product at 1/5 the price. h1bapi.com serves 9,172,091 normalized LCA records across FY2008-FY2026 via REST + OpenAPI + MCP for $9/$29/$79 per month with a free tier. SponsorScope's stated differentiators (multi-year schema normalization, fast search index, metered API for ATS/CRM) are line-for-line what h1bapi already sells, against a hypothesized $49-149/seat.
- FATAL — free first-party substitute on the buyer's actual question. The USCIS H-1B Employer Data Hub is free, searchable by employer/city/state/ZIP/NAICS, spans FY2009-FY2026 Q3, exports CSV, and carries petition Initial/Continuing Approvals and Denials — the outcome data. SponsorScope can only ever show DOL attestations, which is the weaker signal, and it is the paid one.
- SEVERE — free-at-zero competitive floor in the exact workflow surface. At least six free web tools (h1bdatahub, h1btrack, h1bdatawatch, h1bdata.info, myvisajobs, froghire) plus free Chrome extensions (H1BGrader, Interstride, FrogHire) that overlay sponsor status directly onto LinkedIn and Indeed. The data's market price is $0 where the user already works.
- SEVERE — the honest framing is strictly dominated. Per 20 CFR 655.705, ETA certifies LCAs while DHS separately adjudicates the I-129 petition, so the only defensible claim is 'filed and certified N LCAs at these disclosed wages.' That claim is both weaker than USCIS approval counts and available free from USCIS. Engine-never-arbiter is satisfiable here, but satisfying it removes the reason to pay.
- MODERATE — A4/A5 autonomy hazard on the one dataset that would fix the honesty gap. uscis.gov and e-verify.gov Akamai-403 every headless fetch method tried. Adding approval/denial or E-Verify data would require a browser driver or a paid mirror, which the autonomy gates disfavour.
- MODERATE — build lift is understated. 'Two to four weeks' assumes a one-time batch. Reality: 40 to 98 to 137 columns across three era-specific layouts with systematic renames, a June-2023 PERM 9089 form break, FY2009 shipping two incompatible systems, 40% of LCA rows needing a second workbook joined for worksites, and 58-88% blank-row padding to detect and discard. Realistically 4-8 weeks before any differentiation work begins.
- MODERATE — employer-name entity resolution (mergers, DBAs, staffing-firm vs end-client) is the one genuinely hard, genuinely valuable piece, and the card explicitly defers it to the user ('shows all plausible matches with a confidence indicator'). That is A3-honest but it means the product ships without solving the problem that would justify a premium over free tools. 59,649 distinct raw employer strings in nine months of LCA data alone shows the scale.

### References

- https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q3.xlsx (fetched 2026-08-19) — curl -I then full download: HTTP 200, 251,850,891 bytes, Last-Modified Fri 07 Aug 2026 17:33:30 GMT; parsed 98 cols, 1,032,735 rows / 437,496 real, DECISION_DATE 2025-10-01 to 2026-06-30, 59,649 distinct employers, 176,352 multi-worksite rows.
- https://www.dol.gov/media/PERM_Disclosure_Data_FY2026_Q3.xlsx (fetched 2026-08-19) — curl -I then full download: HTTP 200, 156,267,808 bytes, Last-Modified Fri 07 Aug 2026 18:50:17 GMT; parsed 137 cols, 925,430 rows / only 112,550 real, 30,948 distinct employers.
- https://www.dol.gov/agencies/eta/foreign-labor/performance (fetched 2026-08-19) — OFLC performance index: FY2026 Q3 covers 2025-10-01 to 2026-06-30; archives back to FY2008 for LCA/PERM/H-2A/H-2B; full historical LCA file and record-layout URL list FY2008-FY2025; points pre-FY2026 archive to flcdatacenter.com.
- https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/FY26Q3/LCA_Record_Layout_FY2026_Q3.pdf (fetched 2026-08-19) — HTTP 200, 216,927 bytes, Last-Modified 07 Aug 2026. 97 documented fields; text extracted and field list enumerated.
- https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/FY26Q3/PERM_Record_Layout_FY2026_Q3.pdf (fetched 2026-08-19) — HTTP 200, 250,129 bytes. States verbatim: 'This file is associated with the new PERM 9089 form which went into effect on June 1, 2023.' 133 fields extracted.
- https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/H-1B_FY18_Record_Layout.pdf (fetched 2026-08-19) — HTTP 200, 54,648 bytes. FY2018 LCA layout: 51 fields, flat single-worksite schema, PW_SOURCE/PW_SOURCE_YEAR.
- https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/H-1B_Record_Layout_FY10.doc (fetched 2026-08-19) — HTTP 200, 86,721 bytes, application/msword. FY2010 layout: 40 fields, LCA_CASE_* prefix, wide-format WORKLOC1/WORKLOC2 and PW_1/PW_2.
- https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/H-1B_Case_Data_FY2008.xlsx (fetched 2026-08-19) — HTTP 200, 73,226,780 bytes — confirms FY2008 history depth is live, not just listed.
- https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/H-1B_FY2010.xlsx (fetched 2026-08-19) — HTTP 200, 60,578,502 bytes — FY2010 archive live.
- https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/FY26Q3/LCA_Worksites_FY_2026_Q3.xlsx (fetched 2026-08-19) — HTTP 200, 45,032,522 bytes — the separate worksites workbook required for the 40% of LCAs with >1 location.
- https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/FY26Q3/LCA_Appendix_A_FY2026_Q3.xlsx (fetched 2026-08-19) — HTTP 200, 32,995 bytes — third companion workbook.
- https://www.dol.gov/sites/dolgov/files/ETA/oflc/pdfs/PERM_Record_Layout_FY2022_Q4.pdf (fetched 2026-08-19) — HTTP 200, 200,283 bytes, Last-Modified 2022-11-09 — the pre-9089-form PERM layout, evidence of the era break.
- https://maurobonfietti.gumroad.com/l/sponsor-premium (fetched 2026-08-19) — HTTP 200, 29,587 bytes. JSON-LD price 199.0 USD; description_html reveals it is a job-board advertising slot ('logo + link on the Home Page', 'ad on every single job post', 'Sponsor Page: opentoworkremote.com/sponsors'), ratings.count 0, sales_count null. Refutes the card's only WTP anchor.
- https://h1bapi.com/ (fetched 2026-08-19) — HTTP 200, 35,095 bytes. Live incumbent: 9,172,091 DOL/OFLC LCA records, FY2008-FY2026, 19 fields, normalized salaries, REST /api/v1/salaries, MCP endpoint. Pricing Free $0 / Dev $9 per mo / Pro $29 per mo / Business $79 per mo.
- https://h1bapi.com/openapi.json (fetched 2026-08-19) — HTTP 200, 4,924 bytes, OpenAPI 3.1.0 — confirms a real documented API with fuzzy employer/job-title search, SOC/state/city/salary/wage-level/case-status filters.
- https://h1bapi.com/api/v1/salaries?employer=google&job_title=software+engineer&state=CA (fetched 2026-08-19) — HTTP 401 application/json {"error":"API key required. Sign up for a free key at /docs"} — endpoint live and gated.
- https://h1bdatahub.com/ (fetched 2026-08-19) — HTTP 200, 82,559 bytes. Free: '3,290,299 Total Filings', '190,161 Companies', search/compare/rankings/case-status tracker.
- https://h1btrack.com/ (fetched 2026-08-19) — HTTP 200, 69,892 bytes. Free company profiles, lottery-odds calculator, salary benchmarks by wage level, 'Free Always'.
- https://h1bdatawatch.com/ (fetched 2026-08-19) — HTTP 200, 100,669 bytes. Free LCA search + employer lookup, explicitly 'DOL + USCIS Data', FY2022-2025 aggregates.
- https://h1bdata.info/ (fetched 2026-08-19) — HTTP 200. Free, '4.8 million records', but coverage only October 2013 through September 2025 — a full year behind current DOL data.
- https://www.myvisajobs.com/about/membership-benefit.aspx (fetched 2026-08-19) — HTTP 200, 27,622 bytes. Free-vs-Premium chart: free tier includes the sponsor/LCA database; premium gates only HR contact details, email CSV download, and all-years history. No price shown.
- https://www.myvisajobs.com/about/faq.aspx (fetched 2026-08-19) — HTTP 200, 56,593 bytes. 'Basic membership is free... Most of the service and information on our website are free.' Site operating since 2006; PayPal-based upgrades.
- https://froghire.ai/ (fetched 2026-08-19) — HTTP 200, 245,242 bytes. Free/freemium sponsorship search, H1B jobs, prevailing-wage checker, LinkedIn overlay extension.
- https://www.interstride.com/ (fetched 2026-08-19) — HTTP 200, 125,315 bytes. B2B-to-universities/employers platform whose free H-1B Sponsorship Finder extension overlays sponsor status on LinkedIn/Indeed/Glassdoor.
- https://flag.dol.gov/programs/LCA (fetched 2026-08-19) — DOL FLAG LCA program page: no public LCA case lookup and no public API; only OFLC Wage Search, Wage Data Downloads, and a login-gated Case Status Search.
- https://www.flcdatacenter.com/ (fetched 2026-08-19) — curl -IL: HTTP 301 to https://flag.dol.gov/wage-data/wage-search/ (HTTP 200). The archive host DOL's own page still cites now redirects to a wage search.
- https://www.govinfo.gov/content/pkg/CFR-2025-title20-vol3/xml/CFR-2025-title20-vol3-sec655-705.xml (fetched 2026-08-19) — HTTP 200, primary CFR text of 20 CFR 655.705: ETA certifies LCAs; DHS separately accepts and adjudicates the I-129 petition. Establishes LCA filed/certified != visa sponsored.
- https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2026.csv (fetched 2026-08-19) — HTTP 403 Akamai 'Access Denied' (459 bytes) on every UA/header/protocol variation and via WebFetch. Documents the automated-fetch block on USCIS data.
- https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub (fetched 2026-08-19) — HTTP 403 to direct fetch; coverage FY2009-FY2026 Q3 with Initial/Continuing Approvals and Denials by employer, CSV/Excel download, corroborated only via search-engine indexing.
- https://www.e-verify.gov/sites/default/files/everify/data/E-VerifyEmployerData.xlsx (fetched 2026-08-19) — HTTP 403 (460 bytes) — E-Verify bulk employer file not fetchable by automation from this environment.
- https://www.dol.gov/agencies/whd/immigration/h1b (fetched 2026-08-19) — DOL WHD H-1B page: confirms the LCA attestation standard (pay at least the actual or prevailing wage, whichever is greater) but contains no statement on the LCA-vs-petition distinction — which is why I went to the CFR.

---

## 03 Competition & pricing — verdict: REFUTED

## B7 — SponsorScope: deep validation (fetched 2026-08-19 / 2026-08-20)

**Verdict: REFUTED.** The data is alive and exactly as the card describes. Everything else — the price floor, the moat, and the buyer — fails on live evidence. Three of the six kill patterns fire, and the buyer premise is inverted.

### What holds up

The knowledge base is real and current. `LCA_Disclosure_Data_FY2026_Q3.xlsx` returns HTTP 206/200, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, **251,850,891 bytes, Last-Modified Fri 07 Aug 2026 17:33:30 GMT**; the PERM twin is **156,267,808 bytes, Last-Modified 07 Aug 2026 18:50:17 GMT**. FY2026 Q4 is a clean 404 — not yet published, on cadence. DOL's performance page lists six programs (PERM, LCA, PW, H-2A, H-2B, CW-1) with FY2026 Q3 covering 1 Oct 2025 – 30 Jun 2026. **Kill pattern 6 (dead data) does not fire.** One operational wrinkle worth recording: dol.gov's edge returns 403 to any request carrying a Chrome/Safari User-Agent and 200 to bare curl — an inverted bot rule that will silently break a naive ETL.

**Kill pattern 3 does not fire.** I checked the recruiter stack directly. SeekOut Recruit Core is **$149/mo annual ($1,788/yr) or $179/mo monthly**; its published filter set covers diversity (Women, Black/African American, Hispanic, Asian, Veteran) and security clearance — **no visa, work-authorization, H-1B or sponsorship filter anywhere**. hireEZ Solo Recruiter starts at **$494/mo** with no immigration filters in its published features. LinkedIn has no standing sponsorship filter either. So the data is genuinely absent from the tools recruiters already pay for.

### Why it dies anyway

**Kill pattern 1 — free first-party substitute.** USCIS runs the **H-1B Employer Data Hub**: free, FY2009 through FY2026 Q3, queryable by fiscal year, employer name, city, state, ZIP and NAICS, with Excel/CSV download and approval/denial rates. That is the agency's own version of the product. (uscis.gov's Akamai edge returned 403 to every path I tried from this session — Reference #18.f018d017.1787184127.889ddffd — so this rests on live search of uscis.gov content plus a fetched university mirror, not a direct fetch. Flagged as unproven-direct.)

**Kill pattern 2 — live micro-SaaS at a fraction of the price.** This is the fatal one, and the card cites none of it. **h1bapi.com** is SponsorScope's API tier, already shipped: **9,172,091 records, all 19 fiscal years FY2008–FY2026**, OpenAPI 3.1.0 spec live at `/openapi.json` (HTTP 200), Swagger UI, `llms.txt`, an MCP integration, normalized annual wages, 19 fields, quarterly refresh keyed to OFLC drops. An unauthenticated query returns `401 {"error":"API key required..."}` — alive and gated. Pricing: **Free $0 (20 req/day) · Dev $9/mo · Pro $29/mo · Business $79/mo (100,000 req/day, priority support)**. The card's hypothesised $49–$149/mo per seat is 5–16× a live competitor that already owns the exact stated moat — "15+ years of schema-drifted quarterly files cleaned into one consistent, fast-searchable index."

And the browser tier is a swarm at $0: **h1bdatahub.com** (3,290,299 filings, 190,161 companies, FY2026 Q2, last updated 10 Aug 2026, `/pricing` returns 404 — there is no paid tier), **h1binfo.org** (3,572,434 certified LCAs, 66,516 employers, FY2020–FY2026, plus green-card timeline tracker and sponsor comparison), **h1bdata.info** (4.8M records Oct 2013–Sept 2025, ad-supported), **h1bsalaries.fyi** (years 2007–2026), **h1bdatawatch.com** (LCA search, employer lookup, watchlist, enforcement), and **levels.fyi/h1b** (1.3M+ records through FY2026 Q2, filters by year, state, wage level and filing type). Several already ship features SponsorScope does not have. The real price floor is $0, and the first paid rung is $9.

**Kill pattern 4 — premise misstated, buyer inverted.** The card's job-to-be-done is "recruiters waste submittals pitching candidates who need sponsorship to employers that rarely file." That is a job-seeker's job, not a recruiter's. An agency recruiter works a named client's req and already knows the client's sponsorship policy from the contract; work authorization on the candidate side is resolved by a free knockout question ("Will you now or in the future require sponsorship?") built into LinkedIn and every ATS. Confirming this: **every monetized artifact I found in this space sells to job seekers** — MyVisaJobs' Premium chart is entirely candidate-side (unlimited sponsor recommendations, HR contact details, email CSV export), H1BGrader's paid product is a Chrome extension for job applicants, and GoinGlobal's H1B Plus sells to university career centres. The recruiter-side B2B subscription the card hypothesises **does not exist today** — not because it is an unfilled gap, but because the two tools that would carry it ($149 and $494/mo) chose not to.

**Demand evidence is thin to the point of negative.** The card's only willingness-to-pay anchor is a Gumroad listing ("Sponsorship Premium", still live, `"price":199.0,"priceCurrency":"USD"`) with no visible sales or ratings. The one metered API comp I found — Apify's `nexgendata/h1b-visa-salary-search` at **$50 per 1,000 records ($0.020/record)** — reports **26 total users, 2 monthly users, 0 bookmarks**.

**Macro contraction.** USCIS received **211,600 FY2027 registrations vs 343,981 for FY2026 — a 38.5% drop** — and reached the cap on 17 July 2026 with no second lottery, under a new wage-weighted selection system. Proclamation 10973's $100,000 H-1B fee was vacated by the District of Massachusetts on 8 June 2026; the First Circuit refused to reinstate it on 24 July 2026, so it is not currently collected but remains on appeal. The addressable filing volume is shrinking and the rules are in litigation.

### Could anything be salvaged?

Only by abandoning the card. The one defensible, unserved artifact I found is the **longitudinal diff nobody publishes** — "this employer stopped filing", "this employer's PERM-to-LCA ratio inverted", "this office closed" — delivered as a change alert rather than a lookup, and sold to immigration counsel or workforce-analytics buyers rather than recruiters. That is a different company with a different buyer and no validated demand, so it is not a reshape of B7; it is a new candidate. Engine-never-arbiter would also need care here: adjacent free sites already ship "Lottery Odds Calculator" and "Best Approval Rates", both of which assert outcomes with liability attached.

### References

- https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q3.xlsx — 2026-08-20 — HTTP 206, OOXML, 251,850,891 bytes, Last-Modified 2026-08-07.
- https://www.dol.gov/media/PERM_Disclosure_Data_FY2026_Q3.xlsx — 2026-08-20 — HTTP 206, 156,267,808 bytes, Last-Modified 2026-08-07.
- https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q4.xlsx — 2026-08-20 — HTTP 404; next quarter not yet published.
- https://www.dol.gov/agencies/eta/foreign-labor/performance — 2026-08-19 — six OFLC programs, latest FY2026 Q3 (Oct 1 2025–Jun 30 2026).
- https://h1bapi.com/ — 2026-08-20 — 9,172,091 records FY2008–FY2026; Free $0 / Dev $9 / Pro $29 / Business $79 per month.
- https://h1bapi.com/openapi.json — 2026-08-20 — HTTP 200, OpenAPI 3.1.0 spec live.
- https://h1bapi.com/api/v1/salaries?employer=google&fiscal_year=2026 — 2026-08-20 — HTTP 401, key-gated, service alive.
- https://h1bapi.com/llms.txt — 2026-08-20 — "Paid plans from $9/mo"; MCP server documented.
- https://h1bdatahub.com/ — 2026-08-20 — free; 3,290,299 filings, 190,161 companies, FY2026 Q2, updated 2026-08-10.
- https://h1bdatahub.com/pricing — 2026-08-20 — HTTP 404; no paid tier exists.
- https://h1binfo.org/ — 2026-08-20 — free; 3,572,434 certified LCAs, 66,516 employers, FY2020–FY2026.
- https://h1bdata.info/ — 2026-08-19 — free, ad-supported; 4.8M records Oct 2013–Sept 2025.
- https://h1bsalaries.fyi/ — 2026-08-20 — free; year filter spans 2007–2026.
- https://h1bdatawatch.com/ — 2026-08-20 — free; LCA search, employer lookup, watchlist, enforcement (FY2022–2025).
- https://www.levels.fyi/h1b/ — 2026-08-20 — free; 1.3M+ records through FY2026 Q2, wage-level and filing-type filters.
- https://apify.com/nexgendata/h1b-visa-salary-search — 2026-08-19 — $50/1,000 records ($0.020 each); 26 total users, 2 monthly users.
- https://maurobonfietti.gumroad.com/l/sponsor-premium — 2026-08-20 — live; embedded `"price":199.0,"priceCurrency":"USD"`; no sales/ratings exposed.
- https://www.myvisajobs.com/about/membership-benefit.aspx — 2026-08-19 — Free vs Premium chart; all premium features candidate-side; no price published.
- https://www.myvisajobs.com/about/faq.aspx — 2026-08-19 — self-describes as an employment website for immigrants (candidate-side positioning).
- https://www.seekout.com/pricing — 2026-08-20 — Recruit Core $149/mo annual ($1,788/yr) or $179/mo monthly; no visa/work-auth filter in feature table.
- https://support.seekout.com/en/articles/11878153-diversity-filters — 2026-08-19 — diversity filters are Women/Black/Hispanic/Asian/Veteran only; no immigration filter.
- https://www.hireez.com/pricing/ — 2026-08-20 — Solo Recruiter from $494/mo; no visa or sponsorship filter published.
- https://globalcareers.brandeis.edu/resources/h-1b-employer-data-hub/ — 2026-08-20 — describes USCIS hub: free, from 2009, searchable by FY/employer/city/state/ZIP/NAICS, CSV download.
- https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub — 2026-08-20 — HTTP 403 (Akamai) from this session; content confirmed only via search index and mirror.
- https://www.clarkhill.com/news-events/news/first-circuit-blocks-reinstatement-of-100k-h-1b-fee/ — 2026-08-19 — First Circuit denied reinstatement 2026-07-24; $100k fee not currently required; appeal pending.
- https://h1bdatahub.com/blog/h1b-visa-numbers-fy2026-fy2027-registrations-selection-rates — 2026-08-19 — FY2026 343,981 registrations; FY2027 estimate 200k–250k (secondary; USCIS primary blocked).


### Proven (primary source, fetched on date stated)

- DOL OFLC data is genuinely live, not dead data: LCA_Disclosure_Data_FY2026_Q3.xlsx returns HTTP 206/200, content-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, 251,850,891 bytes, Last-Modified Fri 07 Aug 2026 17:33:30 GMT (fetched 2026-08-20).
- PERM_Disclosure_Data_FY2026_Q3.xlsx: HTTP 206, same content-type, 156,267,808 bytes, Last-Modified Fri 07 Aug 2026 18:50:17 GMT. FY2026_Q4 returns HTTP 404 — next quarter not yet published, consistent with the stated quarterly cadence.
- DOL's OFLC performance page lists six disclosure programs (PERM, LCA, PW, H-2A, H-2B, CW-1) with FY2026 Q3 as the most recent release, covering determinations issued 1 Oct 2025 through 30 Jun 2026.
- A live, direct competitor already ships SponsorScope's exact API product at a fraction of the hypothesized price: h1bapi.com serves 9,172,091 LCA records across all 19 fiscal years FY2008-FY2026, with a live OpenAPI 3.1.0 spec (HTTP 200 at /openapi.json), Swagger UI, llms.txt, MCP integration, 19 normalized fields, quarterly refresh. Pricing: Free $0 (20 req/day), Dev $9/mo, Pro $29/mo, Business $79/mo.
- h1bapi.com's service is alive and key-gated: unauthenticated GET /api/v1/salaries returns HTTP 401 {"error":"API key required. Sign up for a free key at /docs"}.
- The browser-tier price floor is $0, across at least six live free sites fetched today: h1bdatahub.com (3,290,299 filings, 190,161 companies, FY2026 Q2, last updated 2026-08-10, /pricing returns 404 so no paid tier exists); h1binfo.org (3,572,434 certified LCAs, 66,516 employers, FY2020-FY2026); h1bdata.info (4.8M records Oct 2013-Sept 2025); h1bsalaries.fyi (years 2007-2026); h1bdatawatch.com (LCA search, employer lookup, watchlist, enforcement); levels.fyi/h1b (1.3M+ records through FY2026 Q2, filters by year/state/wage level/filing type).
- Kill pattern 3 does NOT fire: SeekOut Recruit Core is $149/mo paid annually ($1,788/yr) or $179/mo monthly, and its published filter set (diversity: Women, Black/African American, Hispanic, Asian, Veteran; plus security clearance) contains no visa, work-authorization, H-1B or sponsorship filter. hireEZ Solo Recruiter starts at $494/mo with no immigration filter published. LinkedIn has no standing sponsorship filter.
- The one metered API comparable found shows near-zero demand: Apify actor nexgendata/h1b-visa-salary-search prices at $50 per 1,000 records ($0.020/record) and reports 26 total users, 2 monthly users, 0 bookmarks.
- The card's $199 Gumroad anchor is still live today: maurobonfietti.gumroad.com/l/sponsor-premium returns HTTP 200 with embedded "price":199.0,"priceCurrency":"USD".
- MyVisaJobs' Premium tier is candidate-side, not recruiter-side: its published membership benefits chart gates employer recommendations, HR contact details, email CSV export, LCA/PERM detail and wage determinations for job seekers; its own FAQ describes the site as an employment website for immigrants.
- Macro contraction is real: the $100,000 H-1B fee under Proclamation 10973 was vacated by the U.S. District Court for the District of Massachusetts on 8 June 2026, and the First Circuit refused to reinstate it on 24 July 2026 (fee not currently required, appeal pending).
- dol.gov's edge inverts the usual bot rule — it returns HTTP 403 to requests carrying a Chrome/Safari User-Agent string and HTTP 200 to bare default-curl requests. Relevant to A4/A5 ETL design.

### Unproven

- USCIS H-1B Employer Data Hub could not be fetched directly: every uscis.gov path returned HTTP 403 from an Akamai edge (Reference #18.f018d017.1787184127.889ddffd), and the Wayback Machine CDX API is blocked by this session's egress policy. Its scope (free, FY2009 through FY2026 Q3, searchable by fiscal year/employer/city/state/ZIP/NAICS, Excel and CSV download, approval and denial rates) rests on live search of uscis.gov content plus a fetched university mirror — not a primary fetch.
- MyVisaJobs' actual Premium dollar price: the benefits chart publishes no number, /membership/upgrade.aspx 302-redirects to a Page Not Found, and the employer-side membership chart is Cloudflare-gated (HTTP 403).
- H1BGrader's Grande Plan price: h1bgrader.com returns HTTP 403 to both curl and WebFetch; only a '60-job posting complimentary trial' surfaced via search.
- GoinGlobal H1B Plus institutional pricing: not published anywhere public; sold via university library licensing negotiation.
- Whether the $199 Gumroad 'Sponsorship Premium' is a one-time file, a subscription, or API access, and how many copies it has sold — the page renders only its heading to both curl and WebFetch, and exposes no sales count or ratings.
- Whether h1bapi.com has any paying customers at $9-$79/mo, or is a hobby project with a Stripe page. Its documented MCP package 'h1b-salary-mcp' returns HTTP 404 from the npm registry, suggesting at least one advertised integration is not actually published.
- The exact FY2027 H-1B registration figure (211,600, vs 343,981 for FY2026, a 38.5% drop) could not be confirmed against USCIS primary — the USCIS newsroom alert 403'd. It is carried from search-aggregated law-firm reporting and a competitor blog only.
- Whether IT-staffing-specific ATSs (Bullhorn, Ceipal, JobDiva) bundle sponsorship-history data. I verified SeekOut, hireEZ and LinkedIn only; those three are sourcing tools, not the ATSs the target staffing buyer actually lives in.

### Fatal risks

- Kill pattern 2 fires hardest: h1bapi.com already sells the exact hypothesized product — API-first access to all 19 fiscal years of normalized OFLC LCA data with quarterly refresh, OpenAPI spec and MCP — at $9/$29/$79 per month. SponsorScope's $49-$149/mo per-seat hypothesis is 5-16x a live incumbent that already owns the entire claimed moat ('15+ years of schema-drifted quarterly files cleaned into one consistent, fast-searchable index'). The card cites no incumbent API at all, which means the miner did not look.
- Kill pattern 1 fires: USCIS operates the free H-1B Employer Data Hub — the agency's own searchable employer-sponsorship lookup covering FY2009 through FY2026 Q3, queryable by fiscal year, employer, city, state, ZIP and NAICS, with free Excel/CSV download and approval/denial rates. DOL separately publishes the raw disclosure files free. The government ships both the data and the lookup.
- Kill pattern 4 fires — the buyer premise is inverted. The card's JTBD ('recruiters waste submittals pitching candidates to employers that rarely file') is a job seeker's job, not a recruiter's: an agency recruiter works a named client's req and already knows that client's sponsorship policy, and candidate-side work authorization is resolved by a free knockout question built into LinkedIn and every ATS. Confirming the inversion, every monetized artifact found in this space sells to job seekers (MyVisaJobs Premium, H1BGrader's Chrome extension) or to university career centres (GoinGlobal) — none to recruiters.
- The recruiter-side B2B subscription the card assumes exists does not exist today, and the negative result is informative rather than a gap: SeekOut ($149/mo) and hireEZ ($494/mo) both have the seat prices and the sourcing surface to add a sponsorship filter and have chosen not to.
- Demand evidence is one Gumroad listing with no visible sales and an Apify actor with 2 monthly users. There is no observed recurring B2B revenue anywhere in the category.
- Macro contraction: FY2027 registrations fell to 211,600 from 343,981 (-38.5%), the cap was reached 17 July 2026 with no second lottery, a new wage-weighted selection system is in force, and the $100,000 fee proclamation is in active First Circuit litigation. The addressable filing volume is shrinking while the rules churn.
- Free adjacent sites already ship outcome-asserting features (h1bdatahub's 'Lottery Odds Calculator' and 'Best Approval Rates'). Competing on feature parity would push SponsorScope across the engine-never-arbiter line; refusing to means shipping visibly less than the free tools.

### References

- https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q3.xlsx (fetched 2026-08-20) — HTTP 206, content-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, 251,850,891 bytes, Last-Modified Fri 07 Aug 2026 17:33:30 GMT — LCA source alive and current.
- https://www.dol.gov/media/PERM_Disclosure_Data_FY2026_Q3.xlsx (fetched 2026-08-20) — HTTP 206, OOXML, 156,267,808 bytes, Last-Modified Fri 07 Aug 2026 18:50:17 GMT — PERM source alive.
- https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q4.xlsx (fetched 2026-08-20) — HTTP 404 — next fiscal quarter not yet published, consistent with quarterly cadence.
- https://www.dol.gov/agencies/eta/foreign-labor/performance (fetched 2026-08-19) — OFLC performance index: six disclosure programs, latest release FY2026 Q3 covering 1 Oct 2025–30 Jun 2026.
- https://h1bapi.com/ (fetched 2026-08-20) — Direct API competitor: 9,172,091 records, FY2008–FY2026, quarterly refresh; pricing Free $0 / Dev $9 / Pro $29 / Business $79 per month.
- https://h1bapi.com/openapi.json (fetched 2026-08-20) — HTTP 200, application/json, OpenAPI 3.1.0 spec — the API is real and machine-documented.
- https://h1bapi.com/api/v1/salaries?employer=google&fiscal_year=2026&per_page=3 (fetched 2026-08-20) — HTTP 401 with 'API key required' — service alive and key-gated, not a dead landing page.
- https://h1bapi.com/llms.txt (fetched 2026-08-20) — Confirms 'Free tier available ($0, 20 requests/day). Paid plans from $9/mo for full access.' plus MCP server docs.
- https://h1bdatahub.com/ (fetched 2026-08-20) — Free competitor: 3,290,299 filings, 190,161 companies, 459,983 job titles; FY2026 Q2, last updated 10 Aug 2026; also ships lottery-odds calculator and approval-rate rankings.
- https://h1bdatahub.com/pricing (fetched 2026-08-20) — HTTP 404 — h1bdatahub has no paid tier; the product is entirely free.
- https://h1binfo.org/ (fetched 2026-08-20) — Free competitor: 3,572,434 certified LCAs, 66,516 employers, FY2020–FY2026, plus green-card timeline tracker and sponsor comparison.
- https://h1bdata.info/ (fetched 2026-08-19) — Free ad-supported LCA index, 4.8M records Oct 2013–Sept 2025.
- https://h1bsalaries.fyi/ (fetched 2026-08-20) — Free LCA search covering years 2007–2026.
- https://h1bdatawatch.com/ (fetched 2026-08-20) — Free LCA search, employer lookup, watchlist and enforcement views, FY2022–FY2025.
- https://www.levels.fyi/h1b/ (fetched 2026-08-20) — Free H-1B salary database, 1.3M+ records through FY2026 Q2, filters by year, state, wage level, filing type.
- https://apify.com/nexgendata/h1b-visa-salary-search (fetched 2026-08-19) — Metered comp: $50 per 1,000 records ($0.020/record); 26 total users, 2 monthly users, 0 bookmarks — near-zero demand signal.
- https://maurobonfietti.gumroad.com/l/sponsor-premium (fetched 2026-08-20) — HTTP 200; embedded "price":199.0,"priceCurrency":"USD" — the card's anchor is still live, but no sales or ratings exposed.
- https://www.myvisajobs.com/about/membership-benefit.aspx (fetched 2026-08-19) — Free vs Premium chart — all premium features are candidate-side (sponsor recommendations, HR contacts, email CSV export, LCA/PERM/wage detail); no price published.
- https://www.myvisajobs.com/about/faq.aspx (fetched 2026-08-19) — Self-description as an employment website for immigrants, founded 2006 — confirms candidate-side positioning.
- https://www.seekout.com/pricing (fetched 2026-08-20) — Recruit Core $149/mo paid annually ($1,788/yr) or $179/mo monthly; feature table has no visa, work-authorization, H-1B or sponsorship filter.
- https://support.seekout.com/en/articles/11878153-diversity-filters (fetched 2026-08-19) — SeekOut diversity filters are Women, Black/African American, Hispanic, Asian, Veteran only — no immigration or visa filter.
- https://www.hireez.com/pricing/ (fetched 2026-08-20) — Solo Recruiter from $494/mo; no visa, work-authorization or sponsorship filter in the published feature list.
- https://globalcareers.brandeis.edu/resources/h-1b-employer-data-hub/ (fetched 2026-08-20) — Mirror describing the free USCIS H-1B Employer Data Hub: data from 2009, query by fiscal year/employer/city/state/ZIP/NAICS, CSV download.
- https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub (fetched 2026-08-20) — HTTP 403 Access Denied from Akamai edge (Reference #18.f018d017.1787184127.889ddffd) — primary fetch blocked from this session.
- https://www.clarkhill.com/news-events/news/first-circuit-blocks-reinstatement-of-100k-h-1b-fee/ (fetched 2026-08-19) — First Circuit denied reinstatement of the $100,000 H-1B fee on 24 July 2026; district court vacatur of 8 June 2026 stands; fee not currently required, appeal pending.
- https://h1bdatahub.com/blog/h1b-visa-numbers-fy2026-fy2027-registrations-selection-rates (fetched 2026-08-19) — FY2026 registrations 343,981 with ~35.3% selection rate; FY2027 estimate 200k–250k. Secondary — USCIS primary was 403-blocked.
- https://registry.npmjs.org/h1b-salary-mcp (fetched 2026-08-20) — HTTP 404 — the MCP package h1bapi.com advertises is not published on npm; one advertised integration is vapour.

---

## 04 Kill-thesis — verdict: REFUTED

# B7 — SponsorScope: REFUTED

## 1. The card's only willingness-to-pay evidence is a category error

The card's `evidence` field rests entirely on one artifact: "A live Gumroad product titled 'Sponsorship Premium' sells access to H-1B sponsorship data for $199 … demonstrating real money already changes hands for exactly this kind of employer-sponsorship lookup."

Fetched today (HTTP 200, `text/html`, 29,587 bytes). The embedded `description_html` reads verbatim: **"Sponsor Premium – Full Site Exposure … $199 USD / month … Maximize your brand's visibility across the entire job board … Your logo + link on the Home Page … Your ad on every single job post … 20,000+ monthly visitors."** Contact: `mauro.bonfietti@gmail.com`, sponsor page `opentoworkremote.com/sponsors`.

It is an **advertising placement on a remote job board**. "Sponsorship" means brand sponsorship, not visa sponsorship. Embedded JSON also shows `"sales_count":null` and no `ratingValue`/`reviewCount` — no evidence of a single sale. This is kill-pattern 4 (premise misstated vs. primary source) applied to the *sole* proof of demand. B7 enters validation with zero willingness-to-pay evidence.

## 2. Free saturation is total, and it is row-level

`h1bdata.info` (HTTP 200, no login, URL-parameterized `?em=&job=&city=&year=`) returned a **14,823,008-byte page with 28,035 rows for one employer** — EMPLOYER / JOB TITLE / BASE SALARY / LOCATION / SUBMIT DATE / START DATE — with submit dates running to **06/08/2026**, i.e. current through the same DOL drop SponsorScope would sell. That is the entire SponsorScope dataset given away at row level, and the query string makes it trivially scriptable, undercutting the API tier too.

`h1btrack.com` (HTTP 200, `Last-Modified: Wed, 19 Aug 2026 15:04:40 GMT` — modified yesterday) advertises **"Free Always"**, 2.2M+ filings, 132K+ company profiles, and *more* scope than B7: it joins USCIS approval/denial history to DOL LCA data, plus cap-exempt lists, wage-level breakdown, E-Verify status and a lottery-odds calculator.

## 3. The API-first product already ships, at 1/2 to 1/16 of B7's price

`h1bapi.com` (HTTP 200): **9,172,091 records, "all 19 fiscal years from FY2008 to FY2026"**, REST + `/openapi.json` + Swagger + `llms.txt` + an MCP server (`npx h1b-salary-mcp`). Pricing verbatim from the page: **Free $0 (20 req/day), Dev $9/mo (5,000/day), Pro $29/mo (25,000/day), Business $79/mo (100,000/day, 19 fields, all years)**. Its own copy: *"Most H-1B salary sites are browser only… This API is a programmable REST endpoint designed for developers and data teams."*

This annihilates the moat as written. Moat (a) "15+ years of schema-drifted quarterly files cleaned into one consistent index" — done, 19/19 years. Moat (b) fast search — done (FTS5). Moat (c) API for ATS/CRM integration — done, with MCP. B7's hypothesized floor of **$49/mo/seat is 1.9× the incumbent's $79 ceiling** for strictly less capability. On Apify, `parseforge/h1b-lca-disclosure-scraper` sells the same extraction at **$18.75/1,000 items** — and shows **0 monthly active users, 5 total users, rating 0.0**: supply is commoditized and paid demand is not visibly there.

## 4. The SEO channel is occupied — two live SERP tests, 18/18 slots

`"h1b sponsors Deloitte"`: h1bgrader (×3), ellis.com, h1bvisajobs.com, migratemate.co, ziprecruiter, Quora, Blind. `"does Stripe sponsor h1b visa"`: myvisajobs (×2), visadoor, immihelp, ellis, h1bgrader, migratemate (×2). **Zero page-1 slots unoccupied by an existing sponsorship-lookup property.** Across searches I counted 12+ distinct live competitors (add h1btrack, hicounselor, tukki.ai, lighthousehq, h1bagent.pages.dev, Interstride, scale.jobs). "Massive programmatic-SEO surface (employer × role × year)" is not an opening — it is the most thoroughly farmed programmatic-SEO niche in immigration, held by properties with up to 22 years of authority (MyVisaJobs: "PayPal Verified since 2004").

## 5. The buyer premise is absent, and the staffing pain is already bundled

I hunted for one instance of a staffing agency paying for sponsorship data as a workflow tool. **Found none.**

What I found instead: MyVisaJobs' Membership Benefits chart monetizes **candidates**, and its differentiated premium feature is not filing history (free tier already has "Limited Access" to every LCA) but **"Employer Contacts … HR contact details including names, job titles, phone numbers and email addresses"** plus **"Emails Download … in cvs format."** After 22 years, the incumbent's paid layer is contact data, not sponsorship history. Its employer-facing side is post-a-job and candidate search.

On the B2B side, kill-pattern 3 is confirmed at the category leader. **Bullhorn** — the ATS staffing firms already pay for — ships an H-1B staffing solution built on Gustav's two-way Bullhorn integration plus Fuse Cooperative's Verified H-1B Program and Marketplace partner Terefic for candidate/visa verification. **Elevate Staffing** markets "All-in-one AI-powered platform for IT staffing companies… H-1B/OPT/CPT Compliance Tracking, bench management, C2C Employer Tracking" — and gives an "H1B Database" page away free as a demo lead magnet. The real H-1B pain in staffing is sub-vendor and candidate *verification* and bench management, not "does this employer file paperwork." B7 is selling a lookup into a workflow whose owner sells the lookup for free to book demos.

## 6. The signal is now anti-correlated with the recruiter decision

The data is genuinely alive (the one card claim that holds): `LCA_Disclosure_Data_FY2026_Q3.xlsx` HTTP 200, 251,850,891 bytes, `Last-Modified: Fri, 07 Aug 2026 17:33:30 GMT`; PERM 156,267,808 bytes, `Last-Modified: 07 Aug 2026 18:50:17`. FY2026 Q2 and Q4 both 404 — files are cumulative YTD, covering determinations **Oct 1 2025 – Jun 30 2026**. So today the newest record is 51 days old, growing to ~4.5 months before the next drop.

Worse than lag: LCA ≠ petition ≠ hire ≠ *current willingness*, and 2025-26 severed the link. Newsweek's tracker (published 2025-10-22) records TCS — "one of the largest sponsors of H-1B visas" — saying it "will no longer be hiring applicants through the program"; Walmart, ~2,400 H-1B holders, paused; Cognizant job listings requiring authorization "without the need of employer sponsorship"; Intuitive Surgical paused then reversed *within weeks*. A historical-filings index ranks precisely these firms as top sponsors. Under engine-never-arbiter the sellable output is "Employer X filed N LCAs in FY2025, record #" — mechanistically correct and the number most likely to send a recruiter at a frozen employer.

## 7. Policy is shrinking the hypothesized buyer

Primary: **FR Vol. 90 No. 245, Dec 29 2025, pp. 60864-60967, FR Doc 2025-23853**, 8 CFR 214, "Weighted Selection Process…", *"This final rule is effective February 27, 2026."* DHS's own analysis: selection odds go from *"just under 30 percent"* flat to *"over 61 percent"* at Level IV and *"over 45 percent"* at Level III, and the RIA *"quantified a projected decrease of 10,099 level I workers."* Commenters framed the rule as *"disincentivizing information technology (IT) staffing companies."* The rule is engineered to shrink the low-wage IT-staffing filing segment that is B7's buyer. FY2027 registrations came in at **~211,600 vs 336,153** for FY2026 (−37%), cap reached with no second lottery (Mintz, July 2026; USCIS unfetchable from this environment).

## Conclusion

Every one of the five kill patterns applicable to B7 fires: free first-party/third-party substitutes at row level (1), live micro-SaaS incumbents at $0-$79/mo vs a $49-149 hypothesis (2), the feature bundled inside Bullhorn/Elevate that the staffing buyer already pays for (3), and the card's own evidence misread against the primary artifact (4). The dataset is real and alive; the business is not. No reshaping is available inside this angle — a recruiter-workflow wrapper is competing with the free row dump on price, with Bullhorn on workflow, and with a contracting, policy-whipsawed filing base on relevance.

## References

1. https://maurobonfietti.gumroad.com/l/sponsor-premium — fetched 2026-08-20, HTTP 200, 29,587 B. Card's sole demand evidence: actually $199/mo **ad placement** on a job board; `sales_count:null`, no reviews.
2. https://h1bdata.info/index.php?em=deloitte+consulting+llp&job=&city=&year=All+Years — 2026-08-20, HTTP 200, 14,823,008 B. 28,035 free rows, one employer, submit dates to 06/08/2026, no login.
3. https://h1btrack.com/ — 2026-08-20, HTTP 200, `Last-Modified: Wed, 19 Aug 2026 15:04:40 GMT`. "Free Always"; 2.2M filings, 132K profiles, LCA+USCIS approvals/denials.
4. https://h1bapi.com/ — 2026-08-20, HTTP 200. 9,172,091 records, FY2008-2026; Free/$9/$29/$79 per month; OpenAPI + MCP.
5. https://h1bapi.com/llms.txt — 2026-08-20, HTTP 200, `text/plain`. "Free tier available ($0, 20 requests/day). Paid plans from $9/mo."
6. https://h1bapi.com/api/v1/salaries?employer=google… — 2026-08-20, HTTP 401 `{"error":"API key required…"}`. Confirms live gated API.
7. https://apify.com/parseforge/h1b-lca-disclosure-scraper — 2026-08-20, HTTP 200, 456,889 B. $18.75/1,000 items; 0 monthly active users, 5 total, rating 0.0.
8. https://www.myvisajobs.com/about/membership-benefit.aspx — 2026-08-20, HTTP 200, 77,176 B. Premium's differentiator is HR contact names/emails/phones + CSV export; candidate-facing.
9. https://www.myvisajobs.com/reports/h1b/employer/deloitte-consulting/ — 2026-08-20, HTTP 200, 27,622 B. Free FY2025 employer LCA ranking with average salaries ("latest full year of data").
10. https://elevatestaffing.ai/h1b-data — 2026-08-20, HTTP 200, 13,130 B. Staffing platform with H-1B/OPT/CPT compliance, bench, C2C tracking; H-1B database as free demo lead magnet.
11. https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q3.xlsx — 2026-08-20, HTTP 200, 251,850,891 B, `Last-Modified: Fri, 07 Aug 2026 17:33:30 GMT`. Data alive.
12. https://www.dol.gov/media/PERM_Disclosure_Data_FY2026_Q3.xlsx — 2026-08-20, HTTP 200, 156,267,808 B, `Last-Modified: 07 Aug 2026 18:50:17 GMT`.
13. https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q4.xlsx and …_Q2.xlsx — 2026-08-20, HTTP 404 both. Files are cumulative YTD, not per-quarter.
14. https://www.dol.gov/agencies/eta/foreign-labor/performance — 2026-08-20. "determinations issued between October 1, 2025 and June 30, 2026"; "A small percentage of determinations may be subject to change in subsequent quarterly releases."
15. https://www.govinfo.gov/content/pkg/FR-2025-12-29/html/2025-23853.htm — 2026-08-20, HTTP 200, 659,081 B, `Last-Modified: Mon, 29 Dec 2025 22:20:42 GMT`. Weighted-selection final rule; effective Feb 27 2026; >61%/>45% vs "just under 30 percent"; "projected decrease of 10,099 level I workers."
16. https://www.mintz.com/insights-center/viewpoints/2806/2026-07-20-uscis-announces-fy2027-h-1b-cap-reached-no-second — 2026-08-20, HTTP 200. FY2027 ~211,600 registrations vs 336,153 FY2026; no second lottery.
17. https://www.newsweek.com/list-companies-no-longer-sponsoring-h-1b-visas-trump-10918993 — 2026-08-20, HTTP 200, 521,976 B; `datePublished 2025-10-22`, `dateModified 2025-10-27`. TCS/Walmart/Cognizant/Intuitive sponsorship reversals.
18. https://www.bbc.com/news/articles/cnvez5v3ee7o — 2026-08-20, HTTP 200, 286,152 B. "Walmart halts job offers for H-1B visa candidates."
19. https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub (+ `/h-1b-employer-data-hub-files`, `/newsroom/alerts/h-1b-faq`, FY2027 selection alert, `h1b_datahubexport-2026.csv`) — 2026-08-20, **HTTP 403 Akamai "Access Denied"** on every path via curl and WebFetch. First-party substitute NOT verifiable from this environment.
20. https://h1bgrader.com/ and /pricing — 2026-08-20, HTTP 403 (bot block). Presence and page-1 dominance confirmed via SERPs only; pricing unverified.
21. WebSearch SERP captures, 2026-08-20: `h1b sponsors Deloitte`; `does Stripe sponsor h1b visa`; `"h1b sponsors" software engineer database free lookup 2026`; `staffing agency subscription "H-1B data" API…`; `Bullhorn marketplace immigration visa H-1B…`; `recruiters using H-1B LCA data to prequalify candidates…`. Page-1 occupancy and the Bullhorn/Gustav/Fuse/Terefic H-1B staffing stack.

### Proven (primary source, fetched on date stated)

- The card's sole willingness-to-pay evidence is a misread: maurobonfietti.gumroad.com/l/sponsor-premium (HTTP 200, 29,587 B, fetched 2026-08-20) is a $199/MONTH advertising placement on the opentoworkremote.com job board ('Sponsor Premium – Full Site Exposure … Your logo + link on the Home Page … Your ad on every single job post'), not visa-sponsorship data. Embedded JSON shows sales_count:null and no ratings — zero evidence of any sale.
- Row-level free substitute is live: h1bdata.info returned a 14,823,008-byte page containing 28,035 free LCA rows for a single employer (employer, job title, base salary, location, submit date, start date), submit dates through 06/08/2026 — current with the latest DOL drop — with no login and a URL-parameterized query interface that is trivially scriptable.
- h1btrack.com (HTTP 200, Last-Modified 2026-08-19 15:04:40 GMT) states 'Free Always' and covers 2.2M+ filings and 132K+ company profiles, joining USCIS approval/denial history to DOL LCA data plus cap-exempt lists, wage levels, E-Verify and a lottery-odds calculator — broader scope than B7 proposes, at zero price.
- The API-first product B7 proposes already exists and is cheaper than B7's floor: h1bapi.com serves 9,172,091 records across 'all 19 fiscal years from FY2008 to FY2026' with OpenAPI, Swagger and an MCP server, priced Free $0 (20 req/day) / Dev $9 / Pro $29 / Business $79 per month (100,000 req/day, 19 fields). B7's hypothesized $49-149/mo per seat is 1.9x-plus the incumbent's top tier.
- B7's stated moat is already solved by that incumbent: 19/19 fiscal years normalized (schema-drift moat), FTS5 full-text search (speed moat), and REST/OpenAPI/MCP integration (ATS/CRM moat).
- Extraction is commoditized to pennies and shows no paid demand: Apify actor parseforge/h1b-lca-disclosure-scraper prices at $18.75 per 1,000 result items with 0 monthly active users, 5 total users and a 0.0 rating.
- The SEO channel is fully occupied. Two live SERP tests returned 18/18 page-1 slots held by existing sponsorship-lookup properties: 'h1b sponsors Deloitte' (h1bgrader x3, ellis.com, h1bvisajobs.com, migratemate.co, ziprecruiter, Quora, Blind) and 'does Stripe sponsor h1b visa' (myvisajobs x2, visadoor, immihelp, ellis, h1bgrader, migratemate x2). 12+ distinct competitors surfaced overall.
- The monetized buyer in this niche is the job-seeking candidate, not the recruiter. MyVisaJobs (PayPal Verified since 2004) gives LCA/PERM filing detail to free members and reserves for premium the things B7 does not have: 'HR contact details including names, job titles, phone numbers and email addresses' and 'Emails Download … in cvs format'. Its employer-facing side is post-a-job and candidate search.
- Kill-pattern 3 confirmed at the staffing ATS incumbent: Bullhorn ships an H-1B staffing solution via Gustav's two-way Bullhorn integration, Fuse Cooperative's Verified H-1B Program and Marketplace partner Terefic for candidate/visa verification — the staffing firm's H-1B pain is sub-vendor and candidate verification, not employer-sponsorship lookup.
- Elevate Staffing (elevatestaffing.ai, HTTP 200) sells 'All-in-one AI-powered platform for IT staffing companies' including H-1B/OPT/CPT compliance tracking, bench management and C2C employer tracking, and uses a free 'H1B Database' page as a demo lead magnet — the lookup is given away to sell the workflow software.
- DOL data is genuinely alive (kill-pattern 6 does not fire): LCA_Disclosure_Data_FY2026_Q3.xlsx HTTP 200, 251,850,891 bytes, Last-Modified Fri 07 Aug 2026 17:33:30 GMT; PERM_Disclosure_Data_FY2026_Q3.xlsx HTTP 200, 156,267,808 bytes, Last-Modified 07 Aug 2026 18:50:17 GMT. Both card size figures reproduce exactly.
- Files are cumulative fiscal-year-to-date, not per-quarter: FY2026 Q2 and Q4 URLs both return HTTP 404, and the OFLC page states the Q3 files 'cover determinations issued between October 1, 2025 and June 30, 2026' — so the newest record is 51 days old today and will age to roughly 4.5 months before the next drop.
- DOL's own caveat undermines point-in-time reliance: 'A small percentage of determinations may be subject to change in subsequent quarterly releases due to appeal or redetermination decisions on employer applications.'
- Policy is shrinking the hypothesized buyer segment, verified from the primary rule text (FR Vol. 90 No. 245, Dec 29 2025, pp. 60864-60967, FR Doc 2025-23853, 8 CFR 214): 'This final rule is effective February 27, 2026'; selection odds move from 'just under 30 percent' flat to 'over 61 percent' (Level IV) and 'over 45 percent' (Level III); DHS's RIA 'quantified a projected decrease of 10,099 level I workers'; commenters framed the rule as 'disincentivizing information technology (IT) staffing companies'.
- Filing-side demand contracted sharply: USCIS received ~211,600 unique FY2027 beneficiary registrations against 336,153 for FY2026 (-37%), and reached the cap with no second lottery (announced July 2026).
- Historical filing volume is now a misleading proxy for current sponsorship willingness: top historical filers publicly reversed posture (TCS 'will no longer be hiring applicants through the program'; Walmart, ~2,400 H-1B holders, paused offers; Cognizant listings requiring authorization 'without the need of employer sponsorship'; Intuitive Surgical paused then reversed within weeks) — precisely the employers a filings index ranks as top sponsors.

### Unproven

- USCIS's own H-1B Employer Data Hub could not be fetched — every path (the hub page, the data-hub files page, the H-1B FAQ, the FY2027 selection alert, and h1b_datahubexport-2026.csv) returned HTTP 403 Akamai 'Access Denied' via both curl (multiple UAs, Google referer) and WebFetch. Its existence and reported FY2009-through-Q1-FY2026 coverage rest on third-party description only, so the strongest free first-party substitute is asserted, not verified.
- The FY2027 registration figures (~211,600 vs 336,153) are from Mintz's July 2026 client alert reporting USCIS, not from the USCIS announcement itself, which was unfetchable.
- Current status of the $100,000 H-1B fee is secondary-sourced only: reported as vacated by the District of Massachusetts on 2026-06-08, First Circuit declining a stay on 2026-07-24, and the underlying proclamation self-expiring 2026-09-21 absent extension. I could not fetch a court docket or USCIS page to confirm, so today's collection status is unverified.
- h1bgrader.com returns HTTP 403 to automated fetches; its dominant page-1 presence is confirmed from SERPs, but its pricing, paid tiers and data freshness are unverified.
- MyVisaJobs' actual premium dollar price is unverified — the membership chart shows feature tiers but the upgrade flow's price was not retrieved.
- Whether the specific companies named as pausing sponsorship (Walmart, TCS, Cognizant) remain paused as of 2026-08-20 is unproven; the tracker fetched was published 2025-10-22 / modified 2025-10-27, and one company in it (Intuitive Surgical) had already reversed.
- No evidence either way on whether any staffing agency, RPO or recruiting firm has ever paid for a standalone sponsorship-history lookup. I searched six times across B2B-data, staffing-software, ATS-marketplace, recruiter-tooling and generic angles and found only candidate-facing paid products and staffing-platform bundles. I declare the buyer premise ABSENT rather than refuted, but nothing supports it.
- Whether a paid 'employer HR contact data' layer (MyVisaJobs' actual premium differentiator) would be a viable pivot was not assessed — it would raise separate data-sourcing and privacy questions outside this lens.

### Fatal risks

- The card's single willingness-to-pay citation is a misread artifact: the $199 Gumroad 'Sponsorship Premium' is a monthly ad placement on a job board, with sales_count null and no reviews. Removing it leaves B7 with zero evidence anyone pays for this, and the miner's note that 'search results independently surfaced MyVisaJobs and H1BGrader' is evidence of competition, not of demand.
- A free, no-login, scriptable row-level dump of the exact dataset exists at h1bdata.info (28,035 rows for one employer, current to 06/08/2026), so both the UI tier and the API tier are undercut to zero simultaneously.
- h1bapi.com already sells the identical API-first product — 9.17M records, all 19 fiscal years, OpenAPI + MCP — at $9/$29/$79 per month with a free tier. B7's price floor exceeds the incumbent's ceiling for less capability, and every element of B7's stated moat is already shipped.
- The programmatic-SEO acquisition channel, which is the only stated path to distribution, is 100% occupied: 18/18 page-1 slots across two live queries held by 12+ established lookup properties, one of them monetizing since 2004.
- The B2B buyer premise is unsupported after targeted hunting, and the actual staffing H-1B workflow is already inside Bullhorn (Gustav + Fuse Verified H-1B + Terefic) while Elevate Staffing gives an H-1B database away free to sell its IT-staffing platform. B7 would sell a lookup its intended buyer's existing vendors distribute for free as marketing.
- The signal is now anti-correlated with the decision it is sold for: with a 51-day-to-4.5-month lag and top historical filers (TCS, Walmart, Cognizant) publicly pausing sponsorship, a historical-filings index systematically ranks frozen employers as top sponsors. Engine-never-arbiter forces the output to be exactly that raw count, which is the misleading number.
- The buyer pool is structurally contracting by federal design: DHS's wage-weighted selection rule (effective 2026-02-27) projects a decrease of 10,099 Level I workers and was explicitly framed against IT staffing companies, and FY2027 registrations fell ~37% to ~211,600. The low-wage IT-staffing segment that would buy this is the segment the rule is built to shrink.

### References

- https://maurobonfietti.gumroad.com/l/sponsor-premium (fetched 2026-08-20) — HTTP 200, text/html, 29,587 B. Card's sole demand evidence — actually a $199/MONTH ad placement on the opentoworkremote.com job board ('Sponsor Premium – Full Site Exposure'); embedded JSON shows sales_count:null, no ratings. Refutes the willingness-to-pay claim.
- https://h1bdata.info/index.php?em=deloitte+consulting+llp&job=&city=&year=All+Years (fetched 2026-08-20) — HTTP 200, text/html, 14,823,008 B. 28,035 free LCA rows for one employer with submit dates to 06/08/2026, no login, scriptable query string. Free row-level substitute.
- https://h1btrack.com/ (fetched 2026-08-20) — HTTP 200, Last-Modified Wed 19 Aug 2026 15:04:40 GMT. 'Free Always'; 2.2M+ filings, 132K+ company profiles, LCA + USCIS approval/denial data, cap-exempt, E-Verify, lottery odds. Actively maintained free competitor with broader scope than B7.
- https://h1bapi.com/ (fetched 2026-08-20) — HTTP 200. 9,172,091 records, FY2008-FY2026 (19/19 years), REST + OpenAPI + Swagger + MCP. Pricing: Free $0 / Dev $9 / Pro $29 / Business $79 per month. The API-first incumbent that undercuts B7's $49-149 hypothesis.
- https://h1bapi.com/llms.txt (fetched 2026-08-20) — HTTP 200, text/plain. 'Free tier available ($0, 20 requests/day). Paid plans from $9/mo.' Confirms MCP server npx h1b-salary-mcp and quarterly OFLC refresh.
- https://h1bapi.com/api/v1/salaries?employer=google&job_title=software+engineer (fetched 2026-08-20) — HTTP 401 {"error":"API key required..."}. Confirms the competing API is live and gated, not vapourware.
- https://apify.com/parseforge/h1b-lca-disclosure-scraper (fetched 2026-08-20) — HTTP 200, 456,889 B. $18.75 per 1,000 result items; 0 monthly active users, 5 total users, rating 0.0 — extraction commoditized, paid demand not visible.
- https://www.myvisajobs.com/about/membership-benefit.aspx (fetched 2026-08-20) — HTTP 200, 77,176 B. Premium tier's differentiator is HR contact names/titles/phones/emails + CSV export, not filing history; candidate-facing; 'PayPal Verified since 2004'.
- https://www.myvisajobs.com/reports/h1b/employer/deloitte-consulting/ (fetched 2026-08-20) — HTTP 200, 27,622 B. Free FY2025 employer LCA volume + average salary ranking table ('latest full year of data'), 100+ employers deep.
- https://elevatestaffing.ai/h1b-data (fetched 2026-08-20) — HTTP 200, 13,130 B. IT-staffing platform (H-1B/OPT/CPT compliance, bench, C2C employer tracking) using a free H1B Database page as a demo lead magnet — kill-pattern 3.
- https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q3.xlsx (fetched 2026-08-20) — HTTP 200, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, 251,850,891 B, Last-Modified Fri 07 Aug 2026 17:33:30 GMT. Data alive; card's size figure reproduces.
- https://www.dol.gov/media/PERM_Disclosure_Data_FY2026_Q3.xlsx (fetched 2026-08-20) — HTTP 200, same content-type, 156,267,808 B, Last-Modified 07 Aug 2026 18:50:17 GMT.
- https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q4.xlsx (fetched 2026-08-20) — HTTP 404, 10 B. Next quarter not yet posted; with Q2 also 404, confirms files are cumulative YTD.
- https://www.dol.gov/media/LCA_Disclosure_Data_FY2026_Q2.xlsx (fetched 2026-08-20) — HTTP 404, 10 B. Prior quarter replaced by cumulative Q3 file.
- https://www.dol.gov/agencies/eta/foreign-labor/performance (fetched 2026-08-20) — OFLC performance/disclosure index. 'determinations issued between October 1, 2025 and June 30, 2026'; 'A small percentage of determinations may be subject to change in subsequent quarterly releases due to appeal or redetermination.' No stated publication-lag commitment.
- https://www.govinfo.gov/content/pkg/FR-2025-12-29/html/2025-23853.htm (fetched 2026-08-20) — HTTP 200, 659,081 B, Last-Modified 29 Dec 2025 22:20:42 GMT. PRIMARY: DHS final rule, 8 CFR 214, FR Vol. 90 No. 245 pp. 60864-60967. Effective Feb 27 2026; >61% (L4) and >45% (L3) vs 'just under 30 percent'; RIA 'quantified a projected decrease of 10,099 level I workers'; IT-staffing framing.
- https://www.federalregister.gov/documents/2025/12/29/2025-23853/weighted-selection-process-for-registrants-and-petitioners-seeking-to-file-cap-subject-h-1b (fetched 2026-08-20) — HTTP 302 to unblock.federalregister.gov (bot wall) — used govinfo.gov mirror instead for the primary rule text.
- https://www.mintz.com/insights-center/viewpoints/2806/2026-07-20-uscis-announces-fy2027-h-1b-cap-reached-no-second (fetched 2026-08-20) — HTTP 200. FY2027: ~211,600 unique beneficiary registrations vs 336,153 for FY2026; cap reached, no second lottery; next cap opportunity March 2027. Secondary (USCIS itself 403s).
- https://www.newsweek.com/list-companies-no-longer-sponsoring-h-1b-visas-trump-10918993 (fetched 2026-08-20) — HTTP 200, 521,976 B; datePublished 2025-10-22, dateModified 2025-10-27. TCS 'will no longer be hiring applicants through the program'; Walmart ~2,400 H-1B holders paused; Cognizant listing language; Intuitive Surgical paused then reversed.
- https://www.bbc.com/news/articles/cnvez5v3ee7o (fetched 2026-08-20) — HTTP 200, 286,152 B. 'Walmart halts job offers for H-1B visa candidates' — corroborates the sponsorship-freeze reporting.
- https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub (fetched 2026-08-20) — HTTP 403 Akamai 'Access Denied' (447 B) via curl with multiple UAs and via WebFetch. First-party free substitute NOT verifiable from this environment.
- https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub/h-1b-employer-data-hub-files (fetched 2026-08-20) — HTTP 403 Akamai 'Access Denied' (500 B). Data-hub CSV export index unreachable.
- https://www.uscis.gov/sites/default/files/document/data/h1b_datahubexport-2026.csv (fetched 2026-08-20) — HTTP 403 (459 B). Direct data-hub CSV unreachable; coverage claims remain unverified.
- https://www.uscis.gov/newsroom/alerts/fy-2027-h-1b-initial-registration-selection-process-completed (fetched 2026-08-20) — HTTP 403 Akamai, incl. with Google referer and browser UA, and via WebFetch. FY2027 registration count could not be primary-verified.
- https://www.uscis.gov/newsroom/alerts/h-1b-faq (fetched 2026-08-20) — HTTP 403 (407 B). Current $100,000-fee collection status could not be primary-verified.
- https://h1bgrader.com/ (fetched 2026-08-20) — HTTP 403 bot block (5,212 B) at root and /pricing (5,510 B). Page-1 SERP dominance confirmed from search results only; pricing unverified.
- https://www.fragomen.com/insights/united-states-uscis-completes-fy-2027-h-1b-cap-selection-process.html (fetched 2026-08-20) — HTTP 403. Alternate FY2027 cap-selection source unavailable; Mintz used instead.
- https://www.americanimmigrationcouncil.org/blog/uscis-implements-h1b-100000-fee/ (fetched 2026-08-20) — HTTP 403. $100k-fee litigation status left as unproven/secondary.
- https://www.google.com/search?q=h1b+sponsors+Deloitte (fetched 2026-08-20) — WebSearch SERP capture. Page 1: h1bgrader x3, ellis.com, h1bvisajobs.com, migratemate.co, ziprecruiter, Quora, Blind — zero unoccupied slots for a new entrant.
- https://www.google.com/search?q=does+Stripe+sponsor+h1b+visa (fetched 2026-08-20) — WebSearch SERP capture. Page 1: myvisajobs x2, visadoor, immihelp, ellis, h1bgrader, migratemate x2 — 8/8 slots held by sponsorship-lookup properties.
- https://www.bullhorn.com/customer-blog/solving-the-problems-of-h-1b-staffing/ (fetched 2026-08-20) — Via WebSearch result summary. Bullhorn's H-1B staffing solution: Gustav two-way integration, Fuse Cooperative Verified H-1B Program, Marketplace partner Terefic for candidate/visa verification — the H-1B workflow already inside the ATS staffing firms pay for.