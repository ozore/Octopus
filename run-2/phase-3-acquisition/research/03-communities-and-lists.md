# Communities and Lists — where D1 actually is, and what we can honestly do about it

**Subject:** the two channels people reach for when a product has no salesperson — *go where the buyer already talks* and *build a list of the buyers* — audited against A1–A6.
**Method:** every venue below was probed in-session on **2026-08-13**, HTTP status codes recorded including the failures; award-feed figures were re-queried live against the USASpending API rather than copied from `research/01`.
**A limit on every status code below:** a status is a property of *one network path on one day*, not of the venue. `capterra.com/vendors/` was recorded 403 in an earlier probe and returns **200** today, which is why no channel disposition may rest on a status code alone — the refusals here rest on published terms and on A1, and where a status is all we have, the row says the fact is unread rather than closed.
**Status:** internal memo, not copy. Every external figure carries its source and read date; none is printable on a customer surface (`CORRECTIONS.md` CL-2, F-1…F-4).
**Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D1, D8, D9, G1–G6 · `CORRECTIONS.md` · `BRAND.md`.

---

## 1. The result, stated before the evidence

**Communities are not a channel for this company, and the reason is not that they are small or hostile — it is that participation in every one of them is a person.** Weinberg & Mares list community building as traction channel 19; `research/01-channels.md` scored it dead on axis (a) without looking at a single venue. This document looked, and found something sharper than "a human would have to post": **the venues are also closed to machines, by their own terms and by live technical countermeasures.** Both halves of the door are shut, and the second half is quotable.

**Award feeds do not produce a list of D1.** D8's fourth channel assumes SAM/USASpending identify subs who have just won covered work. Re-verified today: the sub tier is under-reported by regulation, not by accident, and the rows that exist carry no contact channel. The channel does not need demoting further; it needs retiring.

---

## 2. The venue audit

Probed 2026-08-13 from this environment, browser user-agent, following redirects.

| Venue | What was actually observed | Promotion rules | What a no-human product could contribute |
|---|---|---|---|
| **Reddit** — r/Construction, r/Payroll, r/govcon and the trade subs | **Unreachable.** `www.reddit.com/r/Construction/about.json` → **403**; `old.reddit.com/r/Payroll/about.json` → **403**; `api.reddit.com/r/Construction/about` → **403**; a third-party front-end mirror → **403**. The HTML pages return **200** with an empty JS shell (8,425 bytes, body text: "Reddit"). Third consecutive attempt across three phases | **Not verifiable from here.** Subscriber counts and per-subreddit self-promotion rules are therefore **unmeasured, and no number for either appears in this document.** Site-wide, Reddit's developer terms require permission and a contract for commercial use of its data and forbid advertising against Reddit content | Nothing. A comment is a person (A1). Even *reading* to qualify the venue is blocked |
| **ContractorTalk** (XenForo, the largest open contractor forum in the US by reputation — reputation, not a measurement we hold) | Two independent machine barriers: `www.contractortalk.com` returns **202** with a proof-of-work challenge (`POW_CHALLENGE_DATA`, difficulty 3) to a normal client, and **307-redirects an identified agent to `tollbit.contractortalk.com`, which answers 402 Payment Required** | The site has priced machine access. Whatever its human self-promotion rules say, they are unreadable to us without either solving a PoW challenge or buying a bot licence | Nothing, and the 402 is the cleanest statement of why: our reading is a metered commercial act there, and our writing would be a person |
| **Facebook groups** for prevailing-wage / certified-payroll contractors | Group URLs return **400** to a plain client; content is behind login. Search surfaced **no** identifiable public group for this niche | Meta's terms, fetched today: *"You may not access or collect data from our Products using automated means … without our prior permission"* | Nothing compatible with A1 |
| **LinkedIn groups** | Group URL returns **200 — a login wall** ("Sign in … New to LinkedIn? Join now"). Membership counts not observable | User Agreement §8.2, fetched today, forbids *"software, devices, scripts, robots or any other means or processes (such as crawlers…) to scrape or copy the Services"* | Nothing |
| **ABC — Associated Builders and Contractors** | **Verified on abc.org:** *"a national construction industry trade association established in 1950 with **67 chapters** and **24,000 members**"*, *"founded on the merit shop philosophy"*. This is the one venue whose membership definition matches D1's exclusion of union shops exactly | The association slot is already occupied by *relationships*: the ABC Insurance Trust site lists a "Dedicated Payroll Partner", "Prevailing Wage Dollar Bank", and named growth partners including **Payroll4Construction** and **Arcoro**. A chapter meeting or an endorsed-vendor agreement is BD — traction channel 12, dead by A1 | The honest answer is uncomfortable: **the densest concentration of D1 in the country is reachable only through mechanisms we have forbidden ourselves.** `research/01-channels.md` recorded the same for trade shows; this is that cost, itemised |
| **IEC** — Independent Electrical Contractors (merit-shop electrical) | Published industry counters read **65,000** merit-shop electrical contracting companies, **356,000** electricians, **50,000** active apprentices — IEC's figures for the industry it represents, **not** a membership count, and not restated as one | Same shape as ABC: chapters, events, partner programmes | Same as ABC |
| **Payroll-clerk communities** — PayrollOrg (formerly APA) | `payroll.org` and `payroll.org/membership` → **403** to us. Membership size, dues and whether a member forum exists are **unverified**; no figure is asserted | Unknown | Unknown, and we will not guess |
| **Software review sites** | Capterra is reachable. Points North's **Certified Payroll Reporting** shows *"2 Reviews"*, 3.0/5. LCPtracker does not appear in Capterra's construction-management listing we sampled. G2, TrustRadius, SoftwareAdvice and GetApp all returned **403** here — **and see the correction below: a 403 is a property of one network path, not of a venue** | **Corrected 2026-08-13.** The earlier entry stated that Gartner Digital Markets accepts a *"free vendor-requested listing"*, sourced to a page that 404'd to us plus an SEO directory — which `CORRECTIONS.md` §0.1 calls repeated, not sourced, and which is the weakest evidence in this document sitting under its only "yes". Re-probed today: `capterra.com/vendors/` returns **200**, says *"Get Your Product Listed"*, and routes to `app.g2digitalmarkets.com/get-listed/start`; that page returns 200 as a client-rendered shell with nothing readable without executing JavaScript. **No price appears anywhere on either page, so "free" is unestablished and is struck from this row.** Reviews must come from real users, which we do not have | **Not established as a no-human contribution, which is the change.** The listing flow ends in a submission awaiting **vendor verification**, and nobody has established that verification is unattended. R-H7's question — *what happens when they reply asking for something?* — is unanswered here, and A1 is a gate rather than a weight, so this row cannot be counted as permitted until the flow is read end to end. Even if it clears, a category whose incumbent carries two reviews is a *placement*, not a channel: it will not generate demand, only catch someone already comparing |

**What the table is really showing.** Hormozi's Core Four collapses to free content and paid ads once warm and cold outreach are gone; `research/01-channels.md` established that. This audit adds that the *free content* box cannot be spent inside someone else's community either. What remains is content on a surface we own — Weinberg & Mares' channel 11 (engineering as marketing), not channel 19 (community building), which is exactly T1 and T2.

**The only community-shaped assets compatible with A1–A6**, all of which are things others can cite without us ever posting: the free WH-347 generator (**built**, `/wh347`) and the modification-diff pages (**specified, no route in the app today**); a machine-maintained public changelog / feed of newly published wage-determination revisions, which is a citable object rather than a message (**specified, not built**); and the per-artifact verification URL specified in `research/01-channels.md` §6 (**the footer prints it; no route serves it**). One of the four exists, which is worth stating in a section whose argument is that these are what we have instead of communities. A citation by a forum member is community reach we did not have to be awake for. We do not plan against it, we instrument it — no coefficient exists yet.

---

## 3. The list side: what SAM and USASpending can and cannot give us

**Re-verified live, 2026-08-13**, `api.usaspending.gov/api/v2/search/spending_by_award_count/`, NAICS 23, award types A/B/C/D, FY2025 (2024-10-01 → 2025-09-30):

- `subawards: false` → **52,820** prime contracts
- `subawards: true` → **4,186** subcontracts

`research/01-demand-pmf.md` reported the same two numbers; they reproduce exactly. **The sub tier is not a sampling problem — three regulations explain the gap, and each was read at source today:**

1. **FAR 4.1403(a)** (acquisition.gov, FAC 2026-01, effective 2026-03-13): the reporting clause 52.204-10 goes only into *"solicitations and contracts of $40,000 or more."*
2. **FAR 52.204-10(d)(2)**: the prime reports *first-tier* subcontracts at or above that threshold. A specialty sub sitting under another sub — common on the trades D1 names — generates **no row at any threshold**.
3. **FAR 52.204-10(g)**: *"If a subcontractor in the previous tax year had gross income from all sources under $300,000, the Contractor does not need to report awards for that subcontractor."* The exemption is written around firms of roughly D1's size.

Add `research/01-demand-pmf.md`'s finding that DBRA **Related Acts** work — grant-funded projects let by states and localities — produces no contractor rows in USASpending at all, and the picture is complete: the feed systematically omits the smaller, lower-tier, grant-funded end, which is where D1 lives.

**And the rows that do exist carry no way to reach anyone.** A live subaward row, fetched today, contains: `Sub-Awardee Name`, `Sub-Award Amount`, `Sub-Award Date`, `Sub-Award Description`, `Prime Recipient Name`, `Prime Award ID`. No email, no phone, no named person. `research/01-channels.md` already recorded that SAM's public entity data exposes point-of-contact **name and address only**, with email and phone marked FOUO/CUI.

**Consequence for D8 channel 4.** It fails on identification *and* on delivery, before volume is even considered: nothing in a subaward row tells us whether the firm is open shop, whether it has 5–75 field employees, or whether it signs its own WH-347 — the three tests D1 sets — and there is no lawful machine-readable address to send anything to. **Retire it as an acquisition channel.** It was never demand evidence; the demand evidence is the 122,936 respondents in DOL's clearance (89 FR 70670), which is a population count, not a list.

**The honest workaround, in three parts.**

1. **Turn the feed inward: award data as a build-order signal, not a contact list.** The 52,820 prime rows are real, complete and rich in place and NAICS. They cannot tell us *who* to contact; they can tell us *which counties and crafts get their T2 pages built first*. That converts a dead outreach channel into a prioritisation input for a channel we already own, at zero marginal cost, with no person and no message.
2. **Publish the prime→sub relation instead of mailing it.** A page per prime award showing its reported first-tier construction subawards is generable from the same feed and is a page the sub itself has a reason to look for. It inherits the coverage limits above, so it carries a plain statement of what the feed omits and **no completeness claim** (F-3 discipline).
3. **Where a per-firm register genuinely exists, use it to size and validate, not to prospect.** California — D3's launch demand market — maintains a public Public Works Contractor Registration search (linked from `dir.ca.gov/Public-Works/Contractors.html`, now a ServiceNow portal at `services.dir.ca.gov`). Every contractor bidding or working public works in CA must be registered, so the register is closer to a true D1 frame than any federal feed. Observed today: it renders client-side, exposes no bulk export we could find, and shows no contact email. It is therefore a **sizing and validation instrument** — the denominator for a market we already chose — and not a list. We will not scrape it, and we will not buy an email list assembled from it.

**Pre-registered, per Ries.** Two thresholds, written now: (i) if the Gartner Digital Markets listing is ever cleared under A1 (§2's correction: the verification step is unread) **and** then produces zero attributable sessions in its first 12 weeks live, it stays as a factual placement and gets no further engineering — a threshold on a channel whose admissibility is still open is written here so it cannot be written afterwards, not because admission is assumed; (ii) if the prime→sub pages of §3.2 do not reach the same indexation bar T2 sets for wage-determination pages by week 16, they are deleted rather than defended — a page set justified by a feed we have just documented as incomplete has no second argument.

---

## References

**Fetched or queried in-session, 2026-08-13**

- `https://api.usaspending.gov/api/v2/search/spending_by_award_count/` — POST, NAICS 23, FY2025, award types A/B/C/D: **52,820** contracts (`subawards:false`); **4,186** subcontracts (`subawards:true`)
- `https://api.usaspending.gov/api/v2/search/spending_by_award/` — subaward rows return Sub-Award ID, Sub-Awardee Name, amount, date, description, Prime Recipient Name, Prime Award ID; no contact fields
- `https://www.acquisition.gov/far/4.1403` — FAC 2026-01, effective 03/13/2026: clause 52.204-10 inserted in *"all solicitations and contracts of $40,000 or more"*
- `https://www.acquisition.gov/far/52.204-10` — first-tier subcontract reporting *"by the end of the month following the month of award … at or above the threshold specified in FAR 4.1403(a)"*; (g)(1)–(2) gross-income-under-$300,000 exemptions for contractor and subcontractor
- `https://www.abc.org/` — *"established in 1950 with 67 chapters and 24,000 members"*; *"more than 24,000 members"*; merit shop philosophy
- `https://www.abc.org/prevailing-wage` — ABC Insurance Trust: "Prevailing Wage Dollar Bank", "Dedicated Payroll Partner", growth partners incl. Payroll4Construction, Arcoro
- `https://www.ieci.org/` — published industry counters: 65,000 merit-shop electrical contracting companies, 356,000 electricians, 50,000 active apprentices
- `https://www.linkedin.com/legal/user-agreement` — §8.2 Don'ts, verbatim scraping/robots prohibition; effective 3 November 2025
- `https://www.linkedin.com/groups/1794051/` — HTTP 200, login wall
- `https://www.facebook.com/legal/terms` — *"You may not access or collect data from our Products using automated means … without our prior permission"*
- `https://www.contractortalk.com/` — HTTP 202 proof-of-work challenge; agent request 307 → `https://tollbit.contractortalk.com/` → **HTTP 402 Payment Required**
- `https://www.capterra.ca/software/88851/certified-payroll` — Points North "Certified Payroll Reporting", *"2 Reviews"*, 3.0/5
- ~~`https://www.capterra.com/faq/faqs-vendors/` (via search summary; page 404 to us) and `https://launchdirectories.com/directory/capterra`~~ — **withdrawn.** A 404 read through a search snippet plus an SEO directory is not a source (`CORRECTIONS.md` §0.1), and the "free listing" conclusion drawn from them is struck (§2)
- `https://www.capterra.com/vendors/` — **HTTP 200 on 2026-08-13**; "Get Your Product Listed" → `https://app.g2digitalmarkets.com/get-listed/start`; **no price or listing terms stated on the page**
- `https://app.g2digitalmarkets.com/get-listed/start` — HTTP 200, client-rendered shell; no fields, price, terms or verification language readable without executing JavaScript
- `https://support.reddithelp.com/hc/en-us/articles/14945211791892-Developer-Platform-Accessing-Reddit-Data` — commercial use of Reddit data requires permission and a contract; no advertising against Reddit content *(read via search result summary; direct fetch returned 403)*
- Reddit direct probes, all **403**: `www.reddit.com/r/Construction/about.json`, `old.reddit.com/r/Payroll/about.json`, `api.reddit.com/r/Construction/about`, third-party mirror; HTML pages 200 with empty JS shell
- `https://www.dir.ca.gov/Public-Works/Contractors.html` → "Public Works Contractor Registration Search" at `https://services.dir.ca.gov/gsp?id=dir_contractors…` — HTTP 200, client-rendered, no bulk export observed
- `https://www.federalregister.gov/documents/2024/08/30/2024-19482/…` — 89 FR 70670: 122,936 respondents (population, not a list)

**Literature**

- Gabriel Weinberg & Justin Mares, *Traction* — https://tractionbook.com/ — the nineteen channels; community building (19) vs engineering as marketing (11); viral claims require a measurable coefficient
- Alex Hormozi, *$100M Leads* — the Core Four; what remains once warm and cold outreach are structurally unavailable
- April Dunford, *Obviously Awesome* — https://www.aprildunford.com/obviously-awesome — choosing the frame rather than inheriting the category's
- Geoffrey Moore, *Crossing the Chasm* — beachhead as a segment you can actually take; ABC's 67 chapters are a segment we cannot
- Eric Ries, *The Lean Startup* — thresholds written before the data
- Rob Fitzpatrick, *The Mom Test* — why an unreachable forum is not evidence in either direction, and why we assert nothing about what contractors "say online"
- Kyle Poyar, *Growth Unhinged* — https://www.growthunhinged.com/p/your-guide-to-saas-metrics-20 — self-serve metering; cost per purchase over cost per click

**Internal, binding**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D1 buyer definition, D3, D8 channel 4, D9, G1–G6
- `run-2/phase-1-ideation/research/01-demand-pmf.md` — §4 subaward under-reporting and Related Acts; the uncounted D1 slice
- `run-2/phase-1-ideation/research/03-gtm-pricing.md` — affordable CAC and the rate-card contribution these thresholds are set against
- `run-2/phase-2-build/CORRECTIONS.md` — the struck-claims register; §4 F-1…F-4 and CL-2
- `run-2/phase-2-build/identity/BRAND.md` — §5.6 pre-paywall proof; §6.7 artifact footer
- `run-2/phase-3-acquisition/research/01-channels.md` — Bullseye ranking, the three tests, the parked and dead channels this document confirms
- `run-2/phase-3-acquisition/research/02-demand-seo.md` — the page surface these findings redirect effort toward
