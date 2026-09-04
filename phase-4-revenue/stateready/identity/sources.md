# StateReady — source log (Buyer & Identity agent, wave 1)

Every URL this agent tried, in the order tried, with the fetch route, the HTTP result and what
came out of it. Per `PIPELINE.md` stage 2, a claim without a row in this table does not ship. **52 rows.**
All fetches performed **2026-09-03** from this session. Nothing was purchased, signed up for or sent.

**Grades.** `PRIMARY` = a government body, licensing board or the organisation's own price/product page.
`VENDOR` = a company's marketing or SEO content about its own market (useful for vocabulary and
list prices, unreliable for market size). `FORUM` = practitioners writing to each other.
`PRESS/ADVISORY` = trade press, law firm or M&A advisory content.

| # | URL | route | HTTP | grade | what it gave |
|--:|---|---|---:|---|---|
| 1 | https://licensedtrades.com/ | WebFetch | 200 | PRIMARY (own site) | Headline "Your trade licenses. Every state. Never expired."; RAG dashboard; 90/60/30/7 alerts; bid-ready PDF; vendor lapse-cost figures |
| 2 | https://licensedtrades.com/pricing | WebFetch | 200 | PRIMARY (own price page) | $199 / $349 / $599 / $1,199 per month; 5 / 15 / 50 / unlimited employees; 1 / 3 / unlimited / unlimited states; 3-day trial, no card; $15/mo extra seats; 90-day data retention |
| 3 | https://licensedtrades.com/ (headers) | curl -sI | 200 | PRIMARY | CSP names `checkout.stripe.com`, `*.supabase.co`, `*.sentry.io` — self-serve checkout, small modern stack |
| 4 | https://licenseroadmap.com/blog/best-contractor-license-tracking-software | WebFetch | 200 | VENDOR | Dated 30 May 2026. "scales poorly past roughly ten technicians"; "shared Google Sheet, an Excel workbook, a whiteboard, or — at smallest scale — the owner's memory"; **restates LicensedTrades' four prices with different seat/tech caps** |
| 5 | https://staterequirement.com/license-alert/ | WebFetch 403 → curl -A desktop | 200 | PRIMARY (own price page) | $99 / $299 / $499 **per year** for 1 / 5 / 10 licences; "reminders at 90, 60, 30, 14, and 7 days"; 7-day trial; "Our representative will reach out for a quick call"; "4.8/5 from 1,500+ professionals"; "50,000+ Licenses Monitored" |
| 6 | https://www.harborcompliance.com/compliance-solutions-construction-firms | WebFetch | 200 | PRIMARY (own site) | "Compliance Core™: The #1 Nationwide Licensing Database"; "qualifier licenses"; no published prices — "Filing fees depend on your individual situation" |
| 7 | https://www.trustpilot.com/review/harborcompliance.com | WebFetch | 200 | PRIMARY (review platform) | TrustScore **2.9/5 from 52 reviews**; 57% five-star, **31% one-star**; verbatim complaints on responsiveness, price and cancellation |
| 8 | https://apiprocessing.com/nationwide-contractor-licensing/ | WebFetch | 200 | PRIMARY (own site) | "On average, the process takes **4 to 8 weeks**"; "Call for quote"; reciprocity / NASCLA / qualifier / business-law-exam vocabulary |
| 9 | https://www.gettradelicense.com/blog/contractor-license-cost | WebFetch | 200 | VENDOR | Named per-state fee figures (CA $450 + $200 + $49; AZ $127 exam + $580 issuance; NC $75; renewals $75–$600; CE $100–$300 per cycle, 4–17 h/yr; bond premium 1–5%) |
| 10 | https://permitplace.com/permit-expediter-cost-guide/ | WebFetch | 200 | VENDOR | Expediting $500–$2,500 residential, $1,500–$5,000 commercial, $1,000–$3,500 per location on multi-site rollouts |
| 11 | https://www.nascla.org/ | WebFetch | 200 | PRIMARY (association) | "Simplify your licensing with one trade exam for multiple states"; CSLID = "one searchable digital resource covering all 50 states, Guam and the Virgin Islands"; "28 different versions of the Contractors Guide to Business, Law and Project Management" |
| 12 | https://www.nascla.org/nascla-commercial-exam-participating-state-agencies | WebFetch | 200 | PRIMARY | **20 participating agencies**, all for *Commercial General Building* — none for HVAC, plumbing or electrical trade licences |
| 13 | https://www.nascla.org/page/participatingstateagencies | WebFetch | 404 | — | dead URL; superseded by #12 |
| 14 | https://www.nascla.org/nascla-electrical-exam-participating-state-agencies | WebFetch | 404 | — | could not confirm an electrical participating-agency list; **open question for the Product Owner** |
| 15 | https://forums.mikeholt.com/threads/multi-state-licensing-help.2557395/ | WebFetch 403 → curl -A desktop | 200 | FORUM | Thread opened 18 Nov 2020. The richest single vocabulary source in this file (see PERSONA.md §7) |
| 16 | https://forums.mikeholt.com/threads/california-contractors-state-license-board-reciprocity.2586884/ | curl -A desktop | 200 | FORUM | 25 Apr 2025: CSLB approved the NASCLA commercial exam for reciprocity at its March 2025 board meeting |
| 17 | https://forums.mikeholt.com/threads/nj-ceu%E2%80%99s.2573033/ | curl -A desktop | 200 | FORUM | NJ: 34 CE hours per 3-year cycle by 31 March, of which the 10-hour code/rules update **must be taken in a live class** |
| 18 | https://www.hvac-talk.com/threads/without-contractors-license.2270747/ | WebFetch → 307 tollbit; curl -A desktop | 202 (JS wall) | — | **BLOCKED.** VerticalScope bot wall. 2 attempts. Do not retry |
| 19 | https://www.plumbingzone.com/threads/master-plumbing-license-reciprocity-for-georgia.88703/ | curl -A desktop | 202 (JS wall) | — | **BLOCKED.** Same wall. 2 attempts |
| 20 | https://www.contractortalk.com/ | curl -A desktop | 202 (JS wall) | — | **BLOCKED.** Same wall |
| 21 | https://oxmaint.com/industries/hvac/hvac-technician-certification-license-tracking | WebFetch 403 → curl -A desktop | 200 | VENDOR | Dated 9 Feb 2026. "each technician carries 4-12 active certifications and licenses"; "400-2,000+ credential records"; "the operations manager who 'keeps it all in their head' is one resignation away from a compliance catastrophe"; the full HVAC credential taxonomy |
| 22 | https://www.epa.gov/enforcement/civil-monetary-penalty-inflation-adjustment-rule | WebFetch | 404 | — | Could not verify the $44,539/day EPA figure at a .gov source. **Treated as unverified throughout** |
| 23 | https://www2.cslb.ca.gov/Contractors/Applicants/Reciprocity/Reciprocity_Requirements.aspx | WebFetch | 200 | PRIMARY (state board) | CA reciprocity with AZ, LA, MS, NV, NC; "active license in good standing … for the previous five years"; NASCLA waiver by written request |
| 24 | https://www2.cslb.ca.gov/Resources/FormsAndApplications/DisassociationNotice.pdf | WebFetch → pypdf | 200 | PRIMARY (state board form) | "This notice must be received at CSLB Headquarters within 90 days"; "**Failure to replace the qualifier within 90 days results in the automatic suspension of the license or removal of the classification**" (B&P §§ 7076, 7068.2, 7083) |
| 25 | https://www.cslb.ca.gov/Contractors/Maintain_License/Personnel_Changes.aspx | WebFetch | 404 | — | dead URL; superseded by #24 |
| 26 | https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=7031 | WebFetch | 200 | PRIMARY (statute) | 7031(a) no action for compensation unless "duly licensed … at all times"; 7031(b) customer may "recover all compensation paid to the unlicensed contractor" |
| 27 | https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=202520260SB779 | WebFetch | 200 | PRIMARY (statute) | Unlicensed: "not less than fifteen hundred dollars ($1,500) nor more than fifteen thousand dollars ($15,000)"; §§7110/7114/7118/7125.4: $1,500–$30,000; **effective 1 July 2026**; inflation adjustment every 5 years |
| 28 | https://www.tdlr.texas.gov/acr/contractor-renew.htm | WebFetch | 200 | PRIMARY (state agency) | "8 hours of approved continuing education coursework each year"; expired <90 d = 1.5× fee; 90 d–18 mo = 2×; 18 mo–3 yr = executive-director approval + 2× |
| 29 | https://www.tdlr.texas.gov/aircond/aircondfaq.htm | WebFetch | 404 | — | dead URL; superseded by #28 |
| 30 | https://dph.illinois.gov/topics-services/environmental-health-protection/plumbing.html | WebFetch | 200 | PRIMARY (state agency) | "Plumber licenses must be renewed by April 30th following the date of issuance"; annual CE obligation stated but hours not given on this page |
| 31 | https://contractorlicenserequirements.com/blog/contractor-license-reciprocity-how-to-transfer-to-another-state/ | WebFetch (301 from contractorlicenses.org) | 200 | VENDOR | "NASCLA only covers the business-and-law portion of licensing. Trade exams, experience requirements, bonding, insurance, and background checks are all still state-specific"; reciprocity is per home-state × destination × classification × years |
| 32 | https://www.fieldpulse.com/resources/blog/electrical-license-reciprocity-by-state | WebFetch | 200 | VENDOR (FSM competitor) | "Electrical license reciprocity doesn't mean you can automatically work in other states"; "decided at the city, county, or state level" |
| 33 | https://acquisitionstars.com/blog/contractor-license-transfer-state-construction-ma | WebFetch | 200 | PRESS/ADVISORY | "contractor licenses are tied to specific individuals and cannot be assigned"; asset deal = new entity, "cannot legally perform licensed contracting work"; RMO/RME "can qualify only one license at a time" |
| 34 | https://ctacquisitions.com/guides/commercial-hvac-business-valuation/ | WebFetch | 200 | PRESS/ADVISORY | "State mechanical licensing (CSLB C-20 in California, TDLR in Texas, Florida CMC) is a transferable asset that buyers actively diligence"; "A muddy plan (owner is the sole qualifier with no successor) compresses the multiple"; 0.5×–1.5× EBITDA |
| 35 | https://ctacquisitions.com/plumbing-pe-rollup-tracker-2026/ | WebFetch | 200 | PRESS/ADVISORY | 13 active plumbing roll-up platforms with disclosed 2024–2026 deals; ARS "more than 70 service centers across 23 states" |
| 36 | https://www.wolterskluwer.com/en/expert-insights/business-licensing-due-diligence-for-corporate-and-m-and-a-transactions | WebFetch 403 → curl -A desktop | 403 (Cloudflare) | — | **BLOCKED.** 2 attempts. Substituted by #33, #34 |
| 37 | https://www.bbb.org/us/ny/white-plains/profile/license-services/licenselogix-llc-0121-139578 | WebFetch | 200 | PRIMARY (review platform) | A+ rating, not accredited, **no complaint text visible**. See §Contradictions |
| 38 | .../licenselogix-llc-0121-139578/complaints | curl -A desktop | 403 (Cloudflare) | — | **BLOCKED.** 2 attempts |
| 39 | https://www.servicetitan.com/pricing | WebFetch | 200 | PRIMARY (own site) | Starter / Essentials / The Works, all "Request Pricing"; "per-technician pricing"; "over 100,000 contractors" |
| 40 | https://www.servicetitan.com/styles.c1efe6299c55a6791f25.css | curl | 200 | PRIMARY (shipped CSS) | `--titan-blue-3:#0265dc`, blue ramp 1–6, `--green:#18a761`; Sofia Pro headings, Nunito Sans body |
| 41 | https://www.servicetitan.com/blog/plumbing-license-reciprocity-by-state | WebFetch | 200 | VENDOR (FSM incumbent) | 18 May 2026. Dispatch Board assigns "based on technician availability, skill sets, license level, and legal service territory"; **no claim of licence-expiry tracking** |
| 42 | https://www.housecallpro.com/licensing/hvac/ | WebFetch | 200 | VENDOR (FSM incumbent) | "built-in tools to store documents, track expiration dates, and set automatic renewal reminders" — the sharpest competitive objection in the file |
| 43 | https://www.housecallpro.com/wp-content/themes/housecallpro/hcp-build/app.css | curl | 200 | PRIMARY (shipped CSS) | `#002942` navy, `#ffb706` amber, `#0f77cc` blue; Open Sans |
| 44 | https://fieldedge.com/ | curl | 200 | PRIMARY (shipped markup) | `#09527e` navy, `#ea6211` orange, `#efd517` yellow |
| 45 | https://www.getjobber.com/pricing/ | WebFetch | 200 | PRIMARY (own price page) | $49 / $139 / $199 / $499 monthly, $29 / $99 / $149 / $399 annual; $29 per extra user; 14-day trial, no card |
| 46 | https://www.getjobber.com/ , /pricing/ , atlantis.getjobber.com | curl -A desktop ×2 | 403 | — | **BLOCKED to curl.** Jobber brand hex values not obtained; WebFetch renders markdown only. Recorded as unverified in IDENTITY.md §5 |
| 47 | https://www.withorbital.com/blog/top-10-us-plumbing-conferences-2026 | WebFetch | 200 | VENDOR | "Most plumbing contractors pick their next software, supplier, or fleet provider after a 10-minute conversation at a plumbing trade show"; attendance bands per event |
| 48 | https://tmsearch.uspto.gov/api-v1-0-0/tmsearch , https://assignment-api.uspto.gov/trademark/basicSearch | curl ×2 | 405 / empty | — | **BLOCKED.** No usable public trademark JSON endpoint from this container. Naming pass records trademark clearance as **not performed** |
| 49 | `identity/check-domains.sh` (python3 socket + curl -sIL over 30 domains) | script | — | PRIMARY (DNS/HTTP) | See IDENTITY.md §1. `stateready.com` = Namecheap parking lander ("Namecheap Market"); `.io/.app/.co` all NXDOMAIN |
| 50 | https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Talent_Profile_Certifications_API_Guide_for_ADP_Workforce_Now | curl → pypdf | 200 | PRIMARY (product docs) | ADP Talent Profile — Certifications API guide, published Mar 2020 / modified Aug 2022. Tracks *"Certifications IDs · Certification effective and expiration dates · Certification renewal requirements"*; custom fields at `Setup > Tools > Custom Fields`; **Known Issue 2: the Add and Change APIs "are not throwing any errors when an invalid date format is sent through the request payload"** |
| 51 | https://help.servicetitan.com/docs/use-custom-fields | WebFetch | 200 | PRIMARY (product docs) | Custom fields exist on "employee settings, and technician settings" and "show up in Search and can be included in reports" — but there are **exactly three field types: Text, Dropdown, Numeric. No date type.** |
| 52 | https://expiryedge.com/blogs/preventing-regulatory-fines-centralized-license-tracking/ | WebFetch | 200 | VENDOR (adjacent tracker) | *"Renewal deadlines slip when reminders are sent too late, sent to the wrong person, or buried in an inbox"*; "Operations, compliance, or HR teams usually own the system" |

## Contradictions found and how they were resolved

1. **LicensedTrades tier caps.** Its own `/pricing` page says Business = up to 50 licensed employees /
   10 seats. `licenseroadmap.com` says Business = up to 40 technicians / 5 seats, while quoting the
   same four prices and the same "two months free" annual line. **Resolution:** the vendor's own price
   page wins; `licenseroadmap.com` is treated as the same operator's content marketing, not as an
   independent review. Consequence: the $199–$1,199 band is **one vendor's list price**, not evidence
   that anyone pays it. Recorded as such everywhere it appears.
2. **LicenseLogix BBB complaints.** Phase-1 `raw-ideas.json` (StateSwitch) cites a BBB profile as
   evidence of "a 10-month turnaround and outdated forms". Re-checked at the source: the profile now
   shows an **A+ rating and no visible complaint text**, and the complaints sub-page is behind
   Cloudflare. **Resolution: the phase-1 claim is withdrawn.** It does not appear in PERSONA.md. The
   substitute evidence for "the paid manual alternative disappoints" is Harbor Compliance's own
   Trustpilot page (row 7), which was opened.
3. **The $44,539/day EPA 608 penalty.** Appears in vendor content (row 21) and in search summaries,
   but epa.gov's penalty-adjustment page 404s from here. **Resolution: never stated as fact in any
   customer-facing copy.** PERSONA.md marks it `UNVERIFIED — do not print`.
4. **Illinois plumber CE hours.** Search results say 4 hours; the IDPH page confirms an annual CE
   obligation but does not state the number. **Resolution:** the 30 April date is used (primary), the
   hour count is not.
