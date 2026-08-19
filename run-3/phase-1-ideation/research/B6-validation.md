# Run 3 — Deep validation: B6 QueueGuard

Validated 2026-08-19 by four independent lenses (round 2, with round-1 kill
patterns applied). Every URL was fetched on the date stated.
**Overall verdict: REFUTED AS PITCHED** — per-lens verdicts: mandate=REFUTED, corpus=REFUTED, competition=REFUTED, kill=REFUTED


---

## 01 Mandate & demand — verdict: REFUTED

## B6 — QueueGuard: deep validation (all fetches 2026-08-19)

### The load-bearing question, answered against the files themselves

The card's A2 claim is that the product "computes deadlines from the file's own milestone-schedule columns." I downloaded four ISO queue files today and enumerated every column. **No public ISO queue file carries a milestone due date. Not one.**

**CAISO `publicqueuereport.xlsx`** — HTTP 200, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, 385,108 bytes, `last-modified: Wed, 19 Aug 2026 08:00:40 GMT`, cell reads "Report Run Date: 08/19/2026". Three sheets. The active sheet ("Grid GenerationQueue") has 33 columns and **266 rows**, all status ACTIVE. The full header: Project Name, Queue Position, Interconnection Request Receive Date, Queue Date, Application Status, Study Process, Type-1/2/3, Fuel-1/2/3, MW-1/2/3, Net MWs to Grid, Full Capacity/Partial/Energy Only, TPD Allocation Percentage, Off-Peak Deliverability, TPD Allocation Group, County, State, Utility, PTO Study Region, Station or Transmission Line, Proposed On-line Date, Current On-line Date, Suspension Status, Feasibility Study, System Impact Study/Phase I, Facilities Study/Phase II, Optional Study, Interconnection Agreement Status. The four date columns are *request/queue/COD* dates. The five study columns are **status strings** — observed values `Complete`, `Waived`, `Re-Study`, `None` — not dates. There is no deposit due date, no cure date, no posting deadline, no COD milestone deadline.

**CAISO Cluster 15 file** (`cluster-15-interconnection-requests.xlsx`, HTTP 200, 59,452 bytes, `last-modified: Thu, 16 Jul 2026 21:57:50 GMT`) — 190 active projects, 20 columns: Queue Number, Project Number, Project Name, Generation/Fuel 1-3, NET MW 1-3, NET MW POI, County, State, Study Area, PTO, POI, Voltage kV, Requested COD, Queue Date, Application Date, Service Type. Withdrawn tab adds Withdrawal Date. Again zero due dates — **and a completely different schema from `publicqueuereport.xlsx`**, which refutes A6's "each ISO's file schema is standardized."

Worse for the premise: the main public queue report's newest active vintage is **Cluster 14 (queue dates 2021)**. C15 and C16 live in separate, differently-shaped files. The "one clean file per ISO" MVP does not exist even for CAISO.

**ERCOT GIS Report July 2026** (DocID 1258020955, 678,920 bytes, published 2026-08-03T15:39:49-05:00). "Project Details - Large Gen" does have a header block literally titled **"GIM Project Milestone Dates"** — this is the closest thing to the card's claim, and it fails on inspection. Every field is a *completion* date: Screening Study Started, Screening Study Complete, FIS Requested, FIS Approved, IA Signed, Meets Planning Guide 6.9(1), Construction Start, Construction End, Approved for Energization, Approved for Synchronization. "Financial Security and Notice to Proceed Provided" is a Yes/No. These record what already happened. None is a deadline. Sheet note row 10: "Due to Protocol confidentiality provisions, only those projects for which a Full Interconnection Study has been requested are included."

**SPP active queue CSV** — HTTP 200, `text/csv`, 243,464 bytes, header "Last Updated On, 8/19/2026", 1,028 projects, 27 columns. Dates: In-Service Date, Commercial Operation Date, Cessation Date, Request Received, Date Withdrawn. No due dates.

### Where the deadlines actually live: private letters, on a 5-day fuse

CAISO GIDAP (Tariff Appendix DD, June 25 2025 version, fetched today) §3.8 verbatim: *"the CAISO shall deem the Interconnection Request to be withdrawn and shall provide written notice to the Interconnection Customer within five (5) Business Days of the deemed withdrawal... Upon receipt of such written notice, the Interconnection Customer shall have five (5) Business Days in which to respond with information or action that either cures the deficiency."*

This is decisive. The cure clock (a) starts on a **private written notice**, (b) runs **five business days**, and (c) begins *after* CAISO has already deemed the request withdrawn. A monitor of public files cannot see the trigger, cannot see the clock, and by the time the public file flips to WITHDRAWN the window is gone. The ISO itself is tariff-obligated to send the notice — kill pattern #1, a first-party free substitute that is not merely equivalent but strictly better, because it is the legally operative document.

Every other GIDAP deadline is likewise anchored to a private per-customer event: §11.3.1.2 second postings "no later than one hundred eighty (180) calendar days after issuance of the final Phase II Interconnection Study report"; study agreements returned "within thirty (30) Business Days thereafter, or the Interconnection Request shall be deemed withdrawn"; Site Exclusivity "at least ten (10) Business Days prior to the initial Interconnection Financial Security posting." The public file shows `Phase II = Complete` — never the issuance date. The subtrahend is missing, so the deadline is not computable.

### How big is the pain, really

CAISO's own Withdrawn sheet gives the count. Of 1,761 historical withdrawals, "Reason for Withdrawal" = **"Failure to Cure Deficiency" 64 times, ever** (by withdrawal year: 2019=10, 2021=9, 2025=8, 2024=4, 2026 YTD=3). Against 617 voluntary "IC Request" withdrawals. Across the whole ISO, the headline event occurs to **single digits of projects per year**, spread over every developer in California. LBNL's queue work attributes mass withdrawal to economics and cost, not clerical deadline misses. The pain the card sells is real but rare, and its victims are individually unreachable.

### Incumbents already own the surviving job

- **interconnection.fyi / GridTracker** — **free**, 43,887 queue requests, "50+ ISOs and utilities across the United States and Canada," daily updates, email alerts. This is the diff-and-alert MVP, already shipped, at $0.
- **Basepoint** — "Track every project in every ISO interconnection queue in real time. See status changes, milestone dates, and study completions" across CAISO, PJM, MISO, ERCOT, SPP, NYISO, ISO-NE, with notifications. Verbatim the pitch.
- **Enverus acquired Pearl Street Technologies (2025-03-13)** — kill pattern #3: interconnection tooling folded into the data suite these developers already buy.
- **Zero-Emission Grid Queue Tracker** — free GridLens map plus weekly/monthly email queue-window alerts.

### A4 / autonomy

Verified today: MISO `misoenergy.org` **403** (Cloudflare interstitial, both the page and `/api/giqueue/*`), PJM **403**, gridstatus.io **403**. Four of seven ISOs are unverified or bot-gated; the two verified ones carry no deadline data. The competitive seven-ISO version needs exactly the scraper-fleet the autonomy gate forbids.

### Engine-never-arbiter

The promise — "so a missed deadline never costs you the queue position" — is an unattended outcome guarantee attached to postings that run to millions of dollars. Even a deterministic "your Phase II posting is due in 14 days" asserts a legal fact whose trigger date exists in no record the product can read. This is the round-1 "never miss a deadline" pattern verbatim.

### Verdict

REFUTED. The only honest product left is "here is today's public queue snapshot and what changed since yesterday, with the source file and its run date" — which is exactly interconnection.fyi, free, with wider coverage. There is no $99–$399/mo shape.


### Proven (primary source, fetched 2026-08-19)

- CAISO publicqueuereport.xlsx is live and fresh: HTTP 200, content-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, 385,108 bytes, Last-Modified Wed 19 Aug 2026 08:00:40 GMT, internal cell 'Report Run Date: 08/19/2026' (fetched 2026-08-19).
- CAISO publicqueuereport.xlsx active sheet 'Grid GenerationQueue' has exactly 33 columns and 266 rows, all Application Status = ACTIVE. Full header enumerated; its only date columns are Interconnection Request Receive Date, Queue Date, Proposed On-line Date (as filed), Current On-line Date. NO milestone due-date column exists.
- The five CAISO study columns (Feasibility, System Impact/Phase I, Facilities/Phase II, Optional Study, Interconnection Agreement Status) contain status STRINGS, not dates — observed values include 'Complete', 'Waived', 'Re-Study', 'None', 'Executed'.
- CAISO's main public queue report contains no project newer than Cluster 14 (latest active Queue Date year = 2021; Study Process values top out at C14 with 105 projects). Cluster 15 is published as a SEPARATE file with a different schema.
- CAISO cluster-15-interconnection-requests.xlsx is live (HTTP 200, 59,452 bytes, Last-Modified Thu 16 Jul 2026 21:57:50 GMT), holds 190 active projects in 20 columns and 99 withdrawn, and carries NO milestone deadline column — only Requested COD, Queue Date, Application Date, Withdrawal Date.
- Within CAISO alone there are two mutually incompatible public queue schemas (33-column publicqueuereport vs 20-column Cluster 15 file), refuting the card's A6 claim that 'each ISO's file schema is standardized across all its filers'.
- ERCOT GIS Report July 2026 is live and downloadable without login (DocID 1258020955, 678,920 bytes, xlsx, PublishDate 2026-08-03T15:39:49-05:00, via the public IceDocListJsonWS listing).
- ERCOT's 'Project Details - Large Gen' sheet does contain a header block titled 'GIM Project Milestone Dates', but every field under it is an ACHIEVEMENT date (Screening Study Started/Complete, FIS Requested/Approved, IA Signed, Construction Start/End, Approved for Energization/Synchronization) or a Yes/No flag (Financial Security and Notice to Proceed Provided). No due date, no deadline.
- ERCOT GIS report explicitly excludes early-stage projects: sheet note verbatim — 'Due to Protocol confidentiality provisions, only those projects for which a Full Interconnection Study has been requested are included.'
- SPP's public active-queue CSV is live today (HTTP 200, text/csv, 243,464 bytes, header 'Last Updated On, 8/19/2026'), 1,028 projects, 27 columns — no milestone due-date column; date fields are In-Service, COD, Cessation, Request Received, Date Withdrawn.
- CAISO GIDAP §3.8 verbatim: CAISO 'shall provide written notice to the Interconnection Customer within five (5) Business Days of the deemed withdrawal'; 'Upon receipt of such written notice, the Interconnection Customer shall have five (5) Business Days in which to respond with information or action that either cures the deficiency.' The cure trigger is a PRIVATE letter, the window is 5 business days, and it starts AFTER the request is already deemed withdrawn.
- CAISO GIDAP §11.3.1.2 verbatim: second postings due 'no later than one hundred eighty (180) calendar days after issuance of the final Phase II Interconnection Study report' — anchored to a per-customer issuance date that appears in no public file (the public file shows only 'Complete').
- Other GIDAP deadlines are likewise anchored to private events: executed study agreement due 'within thirty (30) Business Days thereafter, or the Interconnection Request shall be deemed withdrawn'; Site Exclusivity due 'at least ten (10) Business Days prior to the initial Interconnection Financial Security posting'.
- Frequency of the headline pain event, from CAISO's own Withdrawn sheet (1,761 rows): 'Failure to Cure Deficiency' appears 64 times in the entire history of the queue — by withdrawal year 2015=1, 2016=4, 2017=8, 2018=4, 2019=10, 2020=7, 2021=9, 2022=1, 2023=5, 2024=4, 2025=8, 2026 YTD=3. Versus 617 voluntary 'IC Request' withdrawals.
- A free first-party-grade substitute already exists: interconnection.fyi (GridTracker) covers 43,887 queue requests from '50+ ISOs and utilities across the United States and Canada', updated daily, with email alerts, at no cost.
- Basepoint sells the exact pitch today: 'Track every project in every ISO interconnection queue in real time. See status changes, milestone dates, and study completions' across CAISO, PJM, MISO, ERCOT, SPP, NYISO and ISO-NE, with notifications when 'study results post, timelines shift, costs update, or competing projects withdraw'.
- Enverus acquired Pearl Street Technologies on 2025-03-13, folding developer-side interconnection tooling (Interconnect) into the data suite these buyers already subscribe to.
- Zero-Emission Grid runs a free interconnection Queue Tracker (WECC, SERC, PJM, MISO, SPP, ISONE, NYISO) with free GridLens map and weekly/monthly email queue-window alerts.
- A4 blocker verified live today: MISO returns HTTP 403 Cloudflare interstitial on both www.misoenergy.org/planning/resource-utilization/GI_Queue/ and /api/giqueue/* ; PJM returns HTTP 403; gridstatus.io returns HTTP 403. The card only disclosed PJM.

### Unproven

- Paid pricing for every named incumbent. GridTracker, Basepoint, Pearl Street/Enverus and GridStatus all gate pricing behind sales contact or Cloudflare (gridstatus.io/pricing returned HTTP 403 to both WebFetch and a browser-UA curl on 2026-08-19). I could not establish the price point the card would be undercutting — but the free tiers I DID verify (interconnection.fyi at $0, ZEG GridLens at $0, gridstatus 500,000 rows/month free) are the binding constraint anyway.
- PJM and MISO column sets. Both 403'd today, so I could not enumerate their queue-file columns to confirm the no-due-date finding holds there too. Four of four ISOs I could read (CAISO x2, ERCOT, SPP) carry none; I did not prove it for PJM, MISO, NYISO or ISO-NE. NYISO and ISO-NE guessed URLs 404'd — I did not chase their live paths.
- Whether the ISO customer portals (CAISO's IRIS, ERCOT's RIOO) display a forward-looking deadline calendar to the logged-in interconnection customer. The tariff obligation to send written notice is proven; the portal UI is not, since those are authenticated.
- Primary first-person developer testimony of a specific missed-deadline loss. I searched developer-facing content and found only vendor/marketing blog assertions repeating the general consequence; no forum post, conference deck, or LinkedIn account of an actual forfeiture surfaced. The CAISO 'Failure to Cure Deficiency' counts are the hard substitute I used instead.
- Whether ERCOT has any queue-position-forfeiting deadline regime comparable to CAISO's deposit/posting ladder. ERCOT's public artifacts show developer-initiated cancellations and INA inactivations, not tariff-forced withdrawals; I did not fetch the ERCOT Planning Guide to settle this.
- The claim that consultants charge enough per portfolio that $99-$399/mo undercuts them. No consultant rate card was fetched.

### Fatal risks

- THE PREMISE IS FALSE AT THE FILE LEVEL. The card's A2 says the product 'computes deadlines from the file's own milestone-schedule columns.' I enumerated every column of four live public queue files today — CAISO publicqueuereport.xlsx (33 cols), CAISO cluster-15-interconnection-requests.xlsx (20 cols), ERCOT GIS Report July 2026 Large Gen (31 cols), SPP active CSV (27 cols) — and not one contains a milestone due date. ERCOT's block literally titled 'GIM Project Milestone Dates' holds only completion dates of things that already happened. There is nothing to count down from.
- THE DEADLINE ARRIVES BY PRIVATE LETTER ON A 5-BUSINESS-DAY FUSE, AND ONLY AFTER YOU HAVE ALREADY LOST. CAISO GIDAP 3.8: CAISO deems the request withdrawn, sends written notice within 5 business days, and the customer then has 5 business days to cure. A public-file monitor sees the trigger never, and sees the outcome only after the window has closed. The product structurally cannot deliver the promise on its cover.
- EVERY COMPUTABLE DEADLINE IS ANCHORED TO A PRIVATE PER-CUSTOMER EVENT DATE THAT IS NOT PUBLISHED. GIDAP 11.3.1.2 sets second postings at 180 calendar days after ISSUANCE of the final Phase II study report to that customer; the public file records only 'Phase II = Complete' with no date. Study agreements are due 30 business days after transmittal; site exclusivity 10 business days before the posting date. Without the anchor date the arithmetic is impossible, and guessing it would be exactly the fabricated legal fact the engine-never-arbiter rule forbids.
- THE PAIN EVENT IS SINGLE-DIGITS PER YEAR ACROSS AN ENTIRE ISO. CAISO's own Withdrawn tab: 'Failure to Cure Deficiency' 64 times in the queue's whole history, 8 in 2025, 3 in 2026 YTD, against 617 voluntary withdrawals. There is no recurring, budgetable pain to sell a subscription against — the buyer who needs this in a given year cannot be identified in advance.
- A FREE INCUMBENT ALREADY SHIPS THE ENTIRE SURVIVING MVP, WITH BROADER COVERAGE. interconnection.fyi (GridTracker) does daily diffs of 43,887 requests across 50+ ISOs and utilities in the US and Canada with email alerts, at $0. QueueGuard's honest form — snapshot, diff, alert on CAISO and ERCOT — is a strictly worse free product.
- KILL PATTERN 3 CONFIRMED: THE FEATURE IS INSIDE SUITES THE BUYER ALREADY PAYS FOR. Basepoint sells 'status changes, milestone dates, and study completions' with notifications across all seven ISOs today; Enverus acquired Pearl Street Technologies on 2025-03-13 and folded developer interconnection tooling into the incumbent energy data suite.
- THE ISO IS THE FREE FIRST-PARTY SUBSTITUTE AND IT IS LEGALLY SUPERIOR. CAISO is tariff-obligated to send the interconnection customer written notice of the deficiency. That letter is the operative document, arrives directly, and is free. A third-party alert derived from a lagging public file adds nothing and cannot be relied on.
- A4 / AUTONOMY VS COMPLETENESS. Verified today: MISO 403 (page and API), PJM 403, gridstatus.io 403. The seven-ISO product the market expects requires a bot-evading scraper fleet across the largest queues; the two ISOs that fetch cleanly are precisely the two with no deadline data.
- ENGINE-NEVER-ARBITER. 'A missed deadline never costs you the queue position' is an unattended outcome guarantee on obligations worth millions in financial security postings. It is the round-1 'never miss a deadline' pattern verbatim, and here it is worse: the asserted fact cannot even be derived from a source record the product can cite.

### References

- https://www.caiso.com/documents/publicqueuereport.xlsx (fetched 2026-08-19) — CAISO public queue report, downloaded via curl. HTTP 200, content-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, 385,108 bytes, Last-Modified Wed 19 Aug 2026 08:00:40 GMT. Parsed with openpyxl: 3 sheets; active sheet 33 columns / 266 ACTIVE rows; study columns are status strings not dates; no milestone due-date column. Withdrawn sheet 1,761 rows with 'Reason for Withdrawal' = 'Failure to Cure Deficiency' 64 times total.
- https://www.caiso.com/documents/cluster-15-interconnection-requests.xlsx (fetched 2026-08-19) — CAISO Cluster 15 queue report. HTTP 200, OOXML, 59,452 bytes, Last-Modified Thu 16 Jul 2026 21:57:50 GMT. 20 columns, 190 active + 99 withdrawn projects; no deadline columns; schema incompatible with publicqueuereport.xlsx.
- https://www.caiso.com/notices/cluster-15-queue-report-posted (fetched 2026-08-19) — CAISO notice dated 06/09/2025 confirming Cluster 15 is published as a separate xlsx; no milestone deadlines mentioned.
- https://www.caiso.com/documents/appendix-dd-generator-interconnection-deliverability-allocation-procedures-as-of-jun-25-2025.pdf (fetched 2026-08-19) — CAISO Tariff Appendix DD (GIDAP), June 25 2025. HTTP 200, application/pdf, 1,073,035 bytes, Last-Modified Fri 27 Jun 2025 17:21:33 GMT. Text extracted: Section 3.8 (deemed withdrawal, 5-business-day written notice, 5-business-day cure), Section 11.3.1.2 (180 calendar days after issuance of final Phase II study report), 30-business-day study agreement return, 10-business-day site exclusivity.
- https://www.ercot.com/misapp/servlets/IceDocListJsonWS?reportTypeId=15933 (fetched 2026-08-19) — ERCOT MIS document listing for the GIS Report (reportTypeId 15933). HTTP 200, JSON. Identified GIS_Report_July2026, DocID 1258020955, 678,920 bytes, xlsx, PublishDate 2026-08-03T15:39:49-05:00, SecurityStatus P (public).
- https://www.ercot.com/misdownload/servlets/mirDownload?doclookupId=1258020955 (fetched 2026-08-19) — ERCOT GIS Report July 2026 xlsx, HTTP 200, 678,920 bytes, no login. Parsed: 14 sheets; 'Project Details - Large Gen' header at row 31, 31 columns under a 'GIM Project Milestone Dates' block — all achievement dates or Yes/No flags, zero due dates. Sheet note: only projects that requested a Full Interconnection Study are included.
- https://opsportal.spp.org/Studies/GenerateActiveCSV (fetched 2026-08-19) — SPP active generator interconnection queue CSV. HTTP 200, text/csv, 243,464 bytes, header row 'Last Updated On, 8/19/2026'. 1,028 projects, 27 columns enumerated — no milestone due-date column.
- https://www.misoenergy.org/planning/resource-utilization/GI_Queue/ (fetched 2026-08-19) — MISO generator interconnection queue page — HTTP 403 Cloudflare interstitial to both WebFetch and browser-UA curl. Also probed https://www.misoenergy.org/api/giqueue/getvintagesnapshot and /getprojects, both HTTP 403.
- https://www.pjm.com/planning/service-requests/services-request-status (fetched 2026-08-19) — PJM service request status page — HTTP 403 to curl with browser UA, confirming the card's PJM bot-blocking risk is still live.
- https://www.interconnection.fyi/ (fetched 2026-08-19) — GridTracker's free interconnection.fyi: 43,887 queue requests from 50+ ISOs and utilities across US and Canada, daily updates, email alerts, free; developer names/contacts locked behind paid GridTracker. No milestone deadlines or deposit due dates anywhere on the page.
- https://www.getbasepoint.com/platform/interconnection (fetched 2026-08-19) — Basepoint interconnection tracking: 'Track every project in every ISO interconnection queue in real time. See status changes, milestone dates, and study completions' across CAISO, PJM, MISO, ERCOT, SPP, NYISO, ISO-NE, with notifications. No pricing published; no data-source disclosure.
- https://queue-tracker.zeroemissiongrid.com/ (fetched 2026-08-19) — Zero-Emission Grid Queue Tracker: WECC, SERC, PJM, MISO, SPP, ISONE, NYISO; free GridLens map; weekly or monthly email queue-window alerts; no pricing listed.
- https://www.enverus.com/newsroom/undo-the-queue-enverus-acquires-pearl-street-technologies-to-solve-for-a-more-reliable-resilient-grid/ (fetched 2026-08-19) — Enverus acquisition of Pearl Street Technologies, dated March 13 2025; Interconnect platform serves developers, M&A firms and financiers for interconnection risk — incumbent suite consolidation.
- https://raw.githubusercontent.com/gridstatus/gridstatusio/main/README.md (fetched 2026-08-19) — GridStatus.io API client README: 'The free plan allows 500,000 rows per month.' Used because gridstatus.io/pricing and docs.gridstatus.io both returned HTTP 403 Cloudflare blocks to WebFetch and browser-UA curl on this date.
- https://www.gridstatus.io/pricing (fetched 2026-08-19) — Attempted price verification — HTTP 403, Cloudflare 'Attention Required' page, 4,549 bytes. Pricing therefore recorded as unproven.
- https://www.caiso.com/generation-transmission/generation/generator-interconnection/queue-management (fetched 2026-08-19) — CAISO queue management page — lists only Modification Assessment Cost Reports 2017-2024; no per-project milestone or deadline report published here.

---

## 02 Corpus & moat — verdict: REFUTED

# B6 — QueueGuard: deep validation (fetched live 2026-08-19)

**Verdict: REFUTED.** The data layer is real and mostly clean. The *product* — "every tariff-defined milestone on a countdown" — cannot be built from it, is already built by two funded incumbents, and its claimed moat is owned by a third who gives it away free.

## (a) Machine-fetchability — 4 of 7, and not the important 4

| ISO | Endpoint fetched today | Result |
|---|---|---|
| CAISO | `caiso.com/documents/publicqueuereport.xlsx` | **200**, 385,108 B, OOXML, `Last-Modified: Wed, 19 Aug 2026 08:00:40 GMT`, in-sheet "Report Run Date: 08/19/2026". Clean, no auth. |
| SPP | `opsportal.spp.org/Studies/GenerateActiveCsv` | **200**, 243,464 B, `text/csv`, `content-disposition: GI_ActiveRequest.csv`, row 1 = "Last Updated On, 8/19/2026". Clean, no auth. |
| ERCOT | `GetReports.do?reportTypeId=15933` → `mirDownload?doclookupId=1258020955` | **200**, 678,920 B, `GIS_Report_July2026.xlsx`. Clean, no auth. |
| NYISO | `nyiso.com/documents/20142/1407078/NYISO-Interconnection-Queue.xlsx` | **200**, 470,856 B, `Last-Modified: Wed, 12 Aug 2026 19:41:33 GMT`. Clean, no auth. |
| MISO | `misoenergy.org/api/giqueue/getprojects` | **403**, Cloudflare interstitial ("Just a moment… Enable JavaScript and cookies to continue"). Domain-wide. |
| PJM | `api.pjm.com/api/v1/` | **401**; every feed name tried returns **404** unauthenticated. `pjm.com` planning pages are JS-gated/502. Requires an approved pjm.com account + subscription key. |
| ISO-NE | `iso-ne.com/system-planning/interconnection-service/interconnection-request-queue` | **200** but carries **no xlsx link** — it routes to IRTT (`irtt.iso-ne.com`), which 302-loops on `AspxAutoDetectCookieSupport`. Gated app. |

The card claimed CAISO+ERCOT as the MVP. True. But PJM and MISO are the two largest queues and both are inaccessible without registration or a headless-browser fleet — the second is exactly what the A4/A5 gate forbids.

## (b) Status + dates: sufficient for *change* alerts, not for *deadline* alerts

Columns are rich. CAISO carries `Application Status`, `Suspension Status`, `Interconnection Agreement Status`, per-phase study availability (Feasibility / SIS-Phase I / FAS-Phase II / Optional), `Current On-line Date`, and on the withdrawn tab `Withdrawn Date` + `Reason for Withdrawal`. SPP carries `Status` (10 distinct values today: `IA FULLY EXECUTED/ON SCHEDULE` 300, `DISIS STAGE` 154, `IA PENDING` 52, `IA FULLY EXECUTED/ON SUSPENSION` 31 …), `Cluster`, `Cause of Delay`. NYISO carries `Project Status #`, `Last Updated Date`, `Availability of Studies`, `IA Tender Date`, `CY/FS Complete Date`.

**And then the killer.** ERCOT's GIS report has a column group headed, literally, **"GIM Project Milestone Dates"**. Every field under it is a date a milestone was *achieved*: `Screening Study Started`, `Screening Study Complete`, `FIS Requested`, `FIS Approved`, `IA Signed`, `Approval Date for Submission of Proof of Site Control`, `Construction Start/End`, `Approved for Energization/Synchronization`. Sampled rows confirm it — 15INR0064b shows `IA Signed 2018-05-30`, `Approved for Synchronization 2020-05-12`. Not one deadline. Same everywhere: CAISO says a study is the word `Complete`; SPP says a status phrase; NYISO says the date a study finished.

**The public queue files record milestones already met. They never record deadlines still owed.** The deadlines are relative offsets fired by private notices — FERC Order 2023-A requires deposits, site-control evidence and milestone progress data "within 10 business days after the date of the filing of the unexecuted LGIA," and cure periods run in 10-business-day blocks off a deficiency notice. The trigger event arrives in the customer's ISO portal, never in the public file.

So the countdown needs (i) a hand-maintained per-ISO tariff rule table — the prose rulebook the gate forbids — *and* (ii) trigger data the product structurally cannot see. **A4 fails on both legs.** The card's own moat sentence ("each ISO runs its own distinct tariff-defined milestone rulebook — fiddly, unglamorous domain work") is an admission that the moat *is* the A4 violation.

## (c) Cadence

CAISO daily (today's file stamped today). SPP daily. NYISO ~weekly-to-monthly (last write 12 Aug). ERCOT **monthly** — the July report posted 2026-08-03. A monthly file cannot support a deadline countdown at all; a 10-business-day cure window can open and close entirely inside one refresh interval.

## Engine-never-arbiter

"So a missed deadline never costs you the queue position" is an unsignable outcome claim with catastrophic downside (loss of position = re-application at the back of a multi-year queue, broken ITC safe harbor). It is the round-1 "never miss a deadline" pattern verbatim. Worse, the countdown itself would assert a legal fact — *your milestone payment is due in 14 days* — derived from a hand-maintained tariff table against a file that does not contain the triggering event. Deterministic, and still an arbiter.

## Kill pattern 1 — free first-party substitute

Every ISO gives its own customers a free tracker for their own positions: CAISO **RIMS** ("provides market participants with the ability to track and manage Interconnection Requests and New Resource Implementation data," certificate-gated, free to participants), ISO-NE **IRTT**, PJM's signed-in Services Request Status. These are the only places the deadline-triggering notices land. The developer already has, free, the one thing QueueGuard cannot get.

## Kill pattern 2 — live incumbents, at $0 and at enterprise

**GridTracker / interconnection.fyi** (fetched today): free public site tracking **43,887 requests from 1995 to 2026**, "compiled daily," free full list view *with no signup*, free email-alert newsletter (2,000+ subs), free H1-2026 report. Paid tier adds developer names, contacts, documents, export; standalone reports **$995** each. Their main site is headed "**The System of Record for Interconnection**": **9,781 active queue projects, 1,860 GW, daily queue snapshots since April 2024**, a per-project **queue change log** (their own demo: "Found 6 revisions in the change log… proposed COD slid four times, from 2025-11-29 to 2027-06-14"), an MCP server for agents, and — decisively — "Data collection for LBNL's Queued Up is led by the GridTracker team."

**Basepoint** (`getbasepoint.com/platform/interconnection`, fetched today) is QueueGuard, shipped: "Track every project in every ISO interconnection queue in real time. See status changes, milestone dates, and study completions the moment they happen… Receive notifications when study results post, timelines shift, costs update, or competing projects withdraw from the queue ahead of you," across CAISO, PJM, MISO, ERCOT, SPP, NYISO, ISO-NE. Demo-gated, so enterprise-priced.

**`gridstatus`** is a BSD-3-Clause open-source library covering CAISO, ERCOT, PJM, MISO, SPP, NYISO, ISO-NE with interconnection queues as a documented dataset — the entire acquisition layer, free, *including the three ISOs that blocked me today*.

## Moat and TAM

The card's moat — "an accumulating historical snapshot archive new entrants can't replicate without years of collected history" — is already held by GridTracker (daily since April 2024, coverage to 1995) and published through LBNL's Queued Up. QueueGuard starts 28 months behind a free archive. On TAM: 274 active CAISO projects and 1,028 active SPP projects today, 9,781 active US-wide. A buyer with "10–100 active requests" is by construction a top-tier developer — a few dozen to low-hundreds of firms nationally, and exactly Basepoint/Enverus/Pearl Street's account list, not a $99–399/mo self-serve segment.

## The reshape I tested, and why it also fails

The only version that survives the autonomy lens is a strict file-visible change log: *"CAISO's 08/19/2026 public queue report changed Q1234's Facilities Study field from blank to Complete — here is the row and the snapshot date."* Mechanism stated, source record shown, no legal fact asserted, no tariff table. Clean on A2/A3/A4 and on engine-never-arbiter. But that is precisely GridTracker's queue change log, sitting on a free daily public record, reachable through a BSD-licensed library, alerted on free by Basepoint's paid product and by interconnection.fyi's free one. It survives the gate and dies in the market. No named reshape keeps a sellable product.

## References

(all fetched 2026-08-19)


### Proven (primary source, fetched 2026-08-19)

- CAISO publicqueuereport.xlsx is live and clean: HTTP 200, 385,108 bytes, content-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, Last-Modified: Wed, 19 Aug 2026 08:00:40 GMT, no auth. Three sheets (Grid GenerationQueue / Completed / Withdrawn), in-sheet 'Report Run Date: 08/19/2026' = daily refresh.
- CAISO active queue is small: 274 data rows on the active tab, of which 266 have Application Status = ACTIVE, 215 have Interconnection Agreement Status = Executed, and exactly 1 is Suspended.
- SPP is fully open with no auth: https://opsportal.spp.org/Studies/GenerateActiveCsv returns HTTP 200, 243,464 bytes, content-type text/csv, content-disposition filename=GI_ActiveRequest.csv, first row 'Last Updated On, 8/19/2026' = daily. 1,028 active projects with a Status column (IA FULLY EXECUTED/ON SCHEDULE 300, DISIS STAGE 154, IA PENDING 52, IA FULLY EXECUTED/ON SUSPENSION 31, etc.).
- ERCOT GIS report is fetchable without auth via GetReports.do?reportTypeId=15933 then mirDownload?doclookupId=1258020955: HTTP 200, 678,920 bytes, content-disposition filename RPT.00015933...20260803...GIS_Report_July2026.xlsx. Cadence is MONTHLY — the July report was published 2026-08-03.
- ERCOT's 'Project Details - Large Gen' sheet has a column group headed literally 'GIM Project Milestone Dates', and every field in it is an ACHIEVEMENT date, not a deadline: Screening Study Started, Screening Study Complete, FIS Requested, FIS Approved, IA Signed, Approval Date for Submission of Proof of Site Control, Construction Start, Construction End, Approved for Energization, Approved for Synchronization.
- ERCOT's file also contains a 'Changes from Last Report' column group (change indicators for Proj Name, Size, COD, SFS/NtP, FIS Request, status change INA-to-PLN) — the ISO itself already publishes the diff QueueGuard proposes to compute.
- NYISO queue xlsx is live and clean: HTTP 200, 470,856 bytes, OOXML, Last-Modified: Wed, 12 Aug 2026 19:41:33 GMT, no auth. 9 sheets; the Interconnection Queue tab has 339 rows with Project Status #, Last Updated Date, Availability of Studies, IA Tender Date, CY/FS Complete Date — again all achievement dates, plus a numeric status code requiring an external legend.
- MISO is domain-wide bot-blocked: both https://www.misoenergy.org/api/giqueue/getprojects and /planning/generator-interconnection/GI_Queue/ returned HTTP 403 with a Cloudflare interstitial body ('Just a moment...', 'Enable JavaScript and cookies to continue').
- PJM requires registered credentials: https://api.pjm.com/api/v1/ returns 401; every feed name tried (new_services_queue, serviced_requests, queue, planning_queue, interconnection_queue, new_service_requests) returns 404 unauthenticated. dataminer2.pjm.com returns a 1,467-byte SPA shell for any path. www.pjm.com queue xlsx paths return 502/404/302-to-/not-found.
- ISO-NE does not publish a direct queue file: its Interconnection Request Queue page (HTTP 200) contains no .xlsx/.csv link and routes to IRTT at irtt.iso-ne.com, which 302-loops on ?AspxAutoDetectCookieSupport=1.
- GridTracker's interconnection.fyi is a live FREE substitute: 'Tracking 43,887 interconnection queue requests from 1995 to 2026', 'compiled daily', 'Data last updated today', 'See the full list view — free, no signup', plus a free email-alert newsletter (newsletter.interconnection.fyi, 2,000+ subscribers) and a free 2026 H1 Queue Activity Report.
- GridTracker.io bills itself 'The System of Record for Interconnection' with 9,781 active queue projects, 1,860 GW active capacity, 'Daily queue snapshots since April 2024', a per-project queue change log (demo text: 'Found 6 revisions in the change log ... its proposed COD slid four times, from 2025-11-29 to 2027-06-14 (554 days)'), an MCP server, and states 'Data collection for LBNL's Queued Up is led by the GridTracker team.' Standalone reports are priced $995 each (2026 Half-Year Report, SPP DISIS-2024-001 Phase 1 Cost Report, 2025 Annual Report).
- Basepoint already ships QueueGuard's exact promise across all seven ISOs: 'Track every project in every ISO interconnection queue in real time. See status changes, milestone dates, and study completions the moment they happen' and 'Receive notifications when study results post, timelines shift, costs update, or competing projects withdraw from the queue ahead of you' (CAISO, PJM, MISO, ERCOT, SPP, NYISO, ISO-NE). Demo-gated, no public price.
- The gridstatus open-source library is BSD-3-Clause and supports CAISO, ERCOT, PJM, MISO, SPP, NYISO, ISO-NE, IESO, AESO, with 'interconnection queues' listed among its datasets — a free, permissively-licensed solution to the entire multi-ISO acquisition problem including the three ISOs that blocked direct fetch.
- CAISO RIMS is the free first-party tracker: CAISO's own page states it 'provides market participants with the ability to track and manage Interconnection Requests and New Resource Implementation (NRI) data', certificate-gated via the Market Participant Portal. ISO-NE's equivalent is IRTT.
- Milestone deadlines under FERC Order 2023/2023-A are relative offsets fired by private notices, not published values — e.g. interconnection customers must submit deposits, site-control evidence and milestone progress data 'within 10 business days after the date of the filing of the unexecuted LGIA', and application-deficiency cure periods run in 10-business-day blocks.

### Unproven

- GridTracker's and Basepoint's actual subscription prices — neither publishes a subscription price page. Only GridTracker's $995 one-off report price is confirmed; the recurring data-subscription price (monthly CSV / Snowflake share) is quoted in the card from interconnection.fyi copy I did not see verbatim on today's page.
- Whether interconnection.fyi's free email alerts can be scoped to a specific project or developer, or are broadcast-only. The 'Email Alerts' link resolves to a Substack newsletter (newsletter.interconnection.fyi); the WebFetch of that page did not disclose cadence, price tiers, or per-project alert capability.
- LBNL 'Queued Up' dataset itself — emp.lbl.gov/queues returned HTTP 403 to both curl and WebFetch today. Its existence and GridTracker's role in it are attested only by GridTracker's own site, which links to that URL.
- Whether PJM's Data Miner 2 API actually carries an interconnection-queue feed at all. No feed name I tried resolved, and unauthenticated 404s cannot distinguish 'wrong name' from 'auth rejected before routing'. PJM's own API guide PDF was not fetched.
- MISO's underlying GIQ JSON schema and refresh cadence — the Cloudflare wall prevented any inspection. Whether a registered/headless path exists is unknown.
- ERCOT's Extract Web Service (EWS) path claimed by the card — I confirmed the data-product metadata page (HTTP 200) and downloaded the file via the MIS report servlet, but did not exercise an EWS API endpoint.
- NYISO's numeric 'Project Status #' legend — the codes (0, 6, 11, 14) appear in the file but I did not locate the published legend mapping them to phases.
- Pearl Street Technologies' and Enverus's pricing and whether their products include per-project milestone alerting — neither pricing page was fetched.
- Actual willingness-to-pay at the $99-399/mo band. No developer-side price point in this category was confirmed today; every named competitor is either free or demo-gated.

### Fatal risks

- A4 FATAL — the promised artifact does not exist in the data. Every date in every public ISO queue file is an achievement date, not a deadline. ERCOT's column group is named 'GIM Project Milestone Dates' and contains only Screening Study Started/Complete, FIS Requested/Approved, IA Signed, Construction Start/End, Approved for Energization/Synchronization; CAISO renders study phases as the word 'Complete'; SPP as a status phrase; NYISO as a status integer plus completion dates. A milestone countdown therefore requires a hand-maintained per-ISO tariff rule table — the prose rulebook the autonomy gate forbids — and the card names that maintenance burden as its own moat, which is an admission of the violation.
- A4 FATAL, second leg — even with a perfect tariff table the trigger events are invisible. FERC Order 2023-A deadlines are relative offsets fired by private notices ('within 10 business days after the date of the filing of the unexecuted LGIA'; 10-business-day deficiency cure blocks). Those notices land in the customer's ISO portal, never in the public file. The product cannot start the clock it promises to run.
- ENGINE-NEVER-ARBITER FATAL — 'so a missed deadline never costs you the queue position' is the round-1 'never miss a deadline' pattern verbatim: an outcome claim an unattended product cannot sign, with catastrophic downside (loss of queue position = re-application at the back of a multi-year queue, broken ITC safe harbor). The countdown itself asserts a legal fact with liability attached, computed from a maintained rule table against a file lacking the trigger — deterministic and still an arbiter.
- KILL PATTERN 2 FATAL — Basepoint already ships the exact product across all seven ISOs, verbatim: 'Track every project in every ISO interconnection queue in real time. See status changes, milestone dates, and study completions the moment they happen' plus notifications 'when study results post, timelines shift, costs update, or competing projects withdraw from the queue ahead of you.' The card lists no incumbents in the alerting category, which per the round-1 lesson means the miner did not look.
- KILL PATTERN 2 FATAL, free tier — GridTracker's interconnection.fyi gives away the underlying record: 43,887 requests 1995-2026, compiled daily, full list view free with no signup, plus a free email-alert newsletter. The paid moat above it is developer names/contacts/documents, which QueueGuard does not have.
- MOAT FATAL — the card's stated moat ('accumulating historical snapshot archive new entrants can't replicate without years of collected history') is already held by GridTracker: daily queue snapshots since April 2024, a per-project change log with revision history, coverage back to 1995, and leadership of LBNL's Queued Up data collection. QueueGuard would launch 28 months behind an archive that is partly free.
- A1/A5 FATAL for the full-coverage version — the two largest queues are unreachable. MISO returns a domain-wide Cloudflare JS/cookie challenge (403); PJM requires an approved account and subscription key (401 at API root, 404 on every feed unauthenticated) with its public site JS/bot-gated; ISO-NE publishes no file at all and routes to the cookie-gated IRTT app. Covering them means a headless-browser scraper fleet, which the autonomy gate forbids. The competitive version needs exactly what the gate blocks.
- COMMODITIZATION FATAL — the gridstatus library (BSD-3-Clause) already provides get_interconnection_queue across CAISO, ERCOT, PJM, MISO, SPP, NYISO and ISO-NE, dissolving the acquisition work — including the three ISOs that blocked direct fetch — into a free import. There is no engineering scarcity left to price.
- TAM FATAL at the hypothesized price — 274 active CAISO projects, 1,028 active SPP projects, 9,781 active US-wide. A buyer holding 10-100 active requests is by construction a top-tier developer, a few dozen to low-hundreds of firms nationally, and those firms are Basepoint/Enverus/Pearl Street enterprise accounts, not a self-serve $99-399/mo segment.
- CADENCE FATAL for ERCOT — the GIS report is monthly (July report published 2026-08-03). A 10-business-day cure window can open and close entirely inside one refresh interval, so the alert cannot beat the deadline it claims to guard.
- KILL PATTERN 1 — every ISO already gives its own customers a free first-party tracker for their own positions (CAISO RIMS, ISO-NE IRTT, PJM's signed-in Services Request Status), and those portals are the only place the deadline-triggering notices arrive. ERCOT goes further and publishes its own 'Changes from Last Report' diff columns inside the file.

### References

- https://www.caiso.com/documents/publicqueuereport.xlsx (fetched 2026-08-19) — CAISO public queue report. curl: HTTP 200, 385,108 bytes, OOXML content-type, Last-Modified Wed 19 Aug 2026 08:00:40 GMT. Parsed: 3 sheets, 'Report Run Date: 08/19/2026', 274 active rows, columns incl. Application Status / study-phase availability / IA Status / Suspension Status.
- https://opsportal.spp.org/Studies/GenerateActiveCsv (fetched 2026-08-19) — SPP GI active-request CSV. curl: HTTP 200, 243,464 bytes, text/csv, filename GI_ActiveRequest.csv, 'Last Updated On 8/19/2026', 1,028 active projects with Status/Cluster/Cause of Delay columns. No auth.
- https://www.ercot.com/misapp/GetReports.do?reportTypeId=15933 (fetched 2026-08-19) — ERCOT GIS Report listing page, HTTP 200. Latest GIS_Report file dated 20260803; yields doclookupId for download. Confirms monthly cadence.
- https://www.ercot.com/misdownload/servlets/mirDownload?mimic_duns=000000000&doclookupId=1258020955 (fetched 2026-08-19) — ERCOT GIS_Report_July2026.xlsx. HTTP 200, 678,920 bytes, no auth. Parsed 'Project Details - Large Gen': 'GIM Project Milestone Dates' column group is entirely achievement dates; separate 'Changes from Last Report' diff columns.
- https://www.ercot.com/mp/data-products/data-product-details?id=PG7-200-ER (fetched 2026-08-19) — ERCOT GIS report data-product metadata page, HTTP 200 — confirms the product exists as claimed in the card.
- https://www.nyiso.com/documents/20142/1407078/NYISO-Interconnection-Queue.xlsx (fetched 2026-08-19) — NYISO queue workbook. HTTP 200, 470,856 bytes, Last-Modified Wed 12 Aug 2026 19:41:33 GMT, no auth. 9 sheets; 339 active rows; Project Status # (numeric), Last Updated Date, Availability of Studies, IA Tender Date, CY/FS Complete Date.
- https://www.misoenergy.org/api/giqueue/getprojects (fetched 2026-08-19) — MISO GI queue API. HTTP 403 with Cloudflare interstitial body ('Just a moment...', 'Enable JavaScript and cookies to continue'). Not machine-fetchable.
- https://www.misoenergy.org/planning/generator-interconnection/GI_Queue/ (fetched 2026-08-19) — MISO GI Queue page. HTTP 403, same Cloudflare challenge — the block is domain-wide, not endpoint-specific.
- https://api.pjm.com/api/v1/ (fetched 2026-08-19) — PJM Data Miner 2 API root. HTTP 401 Unauthorized — subscription key required.
- https://api.pjm.com/api/v1/new_services_queue?rowCount=1 (fetched 2026-08-19) — PJM feed probe. HTTP 404 unauthenticated; same for serviced_requests, queue, planning_queue, interconnection_queue, new_service_requests. No keyless path to PJM queue data.
- https://www.pjm.com/planning/service-requests/services-request-status (fetched 2026-08-19) — PJM Services Request Status page. HTTP 200 but JS-gated with no data links; only outbound link is the SSO sign-in. Confirms PJM queue access is credential-gated.
- https://www.iso-ne.com/system-planning/interconnection-service/interconnection-request-queue (fetched 2026-08-19) — ISO-NE Interconnection Request Queue page. HTTP 200 but contains NO .xlsx/.csv link; routes to IRTT and an IRTT user guide PDF.
- https://irtt.iso-ne.com/ (fetched 2026-08-19) — ISO-NE Interconnection Request Tracking Tool. 302 redirect loop on ?AspxAutoDetectCookieSupport=1 — cookie/session-gated app, not a fetchable file.
- https://www.interconnection.fyi/ (fetched 2026-08-19) — GridTracker's free public queue site. HTTP 200, 199,275 bytes. Verbatim: 'Tracking 43,887 interconnection queue requests from 1995 to 2026', 'compiled daily ... filterable, mapped, and free', 'Data last updated today', 'See the full list view — free, no signup', free email alerts, free 2026 H1 report; paid tier = developer names/contacts/documents/export.
- https://www.gridtracker.io/ (fetched 2026-08-19) — GridTracker main site. HTTP 200. 'The System of Record for Interconnection'; 9,781 active queue projects; 1,860 GW; 'Daily queue snapshots since April 2024'; per-project queue change log demo ('6 revisions', 'COD slid four times ... 554 days'); MCP server; 'Data collection for LBNL's Queued Up is led by the GridTracker team.'
- https://www.gridtracker.io/purchase-reports (fetched 2026-08-19) — GridTracker report pricing: 2026 Half-Year Report $995, SPP DISIS-2024-001 Phase 1 Cost Report $995, 2025 Annual Report $995. No subscription price disclosed.
- https://newsletter.interconnection.fyi/ (fetched 2026-08-19) — interconnection.fyi 'Email Alerts' destination — a Substack newsletter with 2,000+ subscribers. Cadence, price tier and per-project alert capability not disclosed on the page.
- https://www.getbasepoint.com/platform/interconnection (fetched 2026-08-19) — Basepoint interconnection tracking — direct incumbent. Verbatim: 'Track every project in every ISO interconnection queue in real time. See status changes, milestone dates, and study completions the moment they happen'; 'Receive notifications when study results post, timelines shift, costs update, or competing projects withdraw from the queue ahead of you.' Covers CAISO, PJM, MISO, ERCOT, SPP, NYISO, ISO-NE. Demo-gated, no public pricing.
- https://github.com/gridstatus/gridstatus (fetched 2026-08-19) — Open-source gridstatus library, BSD-3-Clause. Supports CAISO, ERCOT, PJM, MISO, SPP, NYISO, ISO-NE, IESO, AESO; 'interconnection queues' listed among datasets — free replacement for the entire acquisition layer.
- https://www.caiso.com/systems-applications/portals-applications/resource-interconnection-management-system-rims (fetched 2026-08-19) — CAISO RIMS page — free first-party substitute. CAISO states RIMS 'provides market participants with the ability to track and manage Interconnection Requests and New Resource Implementation (NRI) data'; certificate-gated via Market Participant Portal.
- https://interconnectionqueue.org/ (fetched 2026-08-19) — Grid Interconnection Tracker. HTTP 200. Self-described 'manually maintained view' of ISO/RTO queue pressure and reform status; carries the FERC 18 June 2026 Section 206 show-cause docket ladder (EL26-68 through EL26-72). Adjacent free analysis site, not a per-project alerter.
- https://emp.lbl.gov/queues (fetched 2026-08-19) — LBNL 'Queued Up' page — HTTP 403 to both curl and WebFetch today. Could not verify the dataset directly; noted as unproven.
- https://www.gridstatus.io/pricing (fetched 2026-08-19) — gridstatus.io pricing — HTTP 403 to both curl and WebFetch today. Commercial tier pricing not verified.

---

## 03 Competition & pricing — verdict: REFUTED

# B6 — QueueGuard: deep validation (2026-08-19)

## The premise fails on its own primary source

QueueGuard's autonomy case (A2) says the product "computes deadlines from the file's own milestone-schedule columns." I downloaded the exact file the card cites and read its header row. It does not have those columns.

`https://www.caiso.com/documents/publicqueuereport.xlsx` — HTTP 200, 385,108 bytes, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `Last-Modified: Wed, 19 Aug 2026 08:00:40 GMT`. Three sheets (Grid GenerationQueue 278 rows, Completed 261, Withdrawn 1,771), report run date 08/19/2026. Header row 4, columns A–AG, verbatim: Project Name, Queue Position, Interconnection Request Receive Date, Queue Date, Application Status, Study Process, Type/Fuel/MW 1-3, Net MWs to Grid, FC/P/EO, TPD Allocation Percentage/Group, County, State, Utility, PTO Study Region, Station or Transmission Line, **Proposed On-line Date (as filed with IR)**, **Current On-line Date**, Suspension Status, **Feasibility Study or Supplemental Review**, **System Impact Study or Phase I Cluster Study**, **Facilities Study (FAS) or Phase II Cluster Study**, Optional Study, **Interconnection Agreement Status**.

The five study/IA fields are *free-text state words* — sampled values are `Waived`, `Complete`, `In Progress`, `Executed`, `Re-Study`, `None`. There is no date attached to any of them, no financial-security posting date, no cure date, no deadline of any kind.

That matters because of how the deadlines are actually defined. From CAISO Appendix DD (GIDAP), fetched today (`Last-Modified: Fri, 27 Jun 2025`), 157 pages, verbatim: initial financial-security postings are due "no later than one hundred eighty (180) calendar days after issuance of the final Phase II Interconnection Study report"; Independent Study Process postings "no later than one hundred twenty (120) calendar days after the CAISO provides the results of the System Impact and Facilities Study"; GIA negotiation runs "not more than one hundred twenty (120) calendar days after the Participating TO provides the Interconnection Customer and the CAISO with the draft GIA"; and elsewhere, if the customer "does not make an election within fifteen (15) Business Days, the CAISO will deem the Interconnection Request withdrawn."

Every clock starts at a **private per-customer delivery event** — the day the ISO/PTO handed *that developer* a report or a draft GIA. None of those issuance dates is in the public file; the public file shows only that the study eventually became "Complete." So the product cannot compute the deadline it promises to count down. It can only observe, days-to-weeks late, that a status word changed — after the customer already received the triggering document by email.

## The free first-party substitute is the trigger document itself

The party that owes the money is the party the ISO writes to. CAISO's New Resource Implementation Guide (fetched today, 47pp, `Last-Modified: Thu, 09 Jul 2026`) states "Potential or existing participating generator owners **will be required to have user access to RIMS**," with "Authorized Point of Contact(s) Email Addresses" receiving project progress reports. RIMS is CAISO's Resource Interconnection Management System — per CAISO's own materials it tracks customer data, project tasks and milestones per queue position, with confidential fields, and Interconnection Customers get portal access to their own projects. The developer already has an authoritative, dated, per-project milestone view for free, plus statutory email notice. QueueGuard would be a lagging, less complete copy of a mandatory free portal — round-1 kill pattern #1, in its strongest form.

ERCOT goes further and ships the diff. The GIS Report (`GIS_Report_July2026.xlsx`, 678,920 bytes, downloaded today via the MIS servlet) has a column group at L literally titled "**Changes from Last Report** — Change indicators: Proj Name, MW Size, COD, SFS/NtP, FIS Request, Status Change INA-to-P". The milestone columns (Screening Study Started/Complete, FIS Requested/Approved, IA Signed, Financial Security and Notice to Proceed Provided, Construction Start/End, Approved for Energization/Synchronization) are **completion** dates, not deadlines. The file is monthly and the July edition was published 2026-08-03. NYISO's queue (470,856 bytes, `Last-Modified: 2026-08-12`) similarly carries Developer name, "Availability of Studies", "IA Tender Date", "CY/FS Complete Date" — events, not due dates.

## Incumbents: the card claims none; there are at least six, one of them exact

- **Basepoint** (`getbasepoint.com/platform/interconnection`, HTTP 200 today) sells QueueGuard verbatim: "Import your queue positions — Add your projects by queue ID or let Basepoint auto-detect them"; "See status changes as they happen across CAISO, PJM, MISO, ERCOT, SPP, NYISO, and ISO-NE"; "Get alerts when timelines shift or **action items are due**"; feature list includes "Milestone deadlines and compliance dates". No pricing page (`/pricing` → 404); "Book demo".
- **GridTracker / interconnection.fyi** — the card's own citation, read in full today: 43,887 queue requests from 50+ ISOs/utilities, "updated at least once a day", **free**, with a "Sign up for email alerts" control (Substack: newsletter.interconnection.fyi) and a **free MCP server** (gridtracker.io/mcp) whose marketing example is literally "Which projects changed status this week?" and a per-project "queue change log" with "Daily queue snapshots since April 2024." That last fact alone destroys the stated moat — the "accumulating snapshot archive later entrants cannot backfill" already exists, is 28 months deep, and belongs to the incumbent that also supplies LBNL's *Queued Up*.
- **Zero-Emission Grid Queue Tracker** (`queue-tracker.zeroemissiongrid.com`, HTTP 200, `Last-Modified: 2026-08-19`) — **free**, email-gated, "live queue windows across every major ISO & RTO — plus the option to get window-opening alerts", weekly or monthly, plus a free GridLens queue map.
- **Cleanview** — the only public price found: **$750/month** Explorer (5 users), with free public trackers and an API covering ERCOT, CAISO, PJM, MISO, SPP, NYISO, ISO-NE. Its own comparison table cites "legacy platforms" at "$40,000–80,000 annual contracts."
- **Nira Energy In-Queue** (MISO/PJM/SPP) — scenario modeling with "real-time updates as ISO study results evolve"; demo-priced.
- **Grid Status** — has a Monitor product with an interconnection-queue module; site is Cloudflare-blocked to automated fetch (403 on /pricing, /interconnection-queue, docs), so its price is unverified.

The market is barbelled: free at the alert layer, $750/mo–$80k/yr at the analytics layer. There is no visible $99–399 self-serve slot, and nothing supports "roughly in line with what GridTracker already charges" — GridTracker publishes no price at all.

## Engine-never-arbiter

The promise — "a missed deadline never costs you the queue position" — is an unattended outcome claim on an asset worth years of position. Worse, the deadline it would display is *derived* (status word + tariff rule + assumed issuance date), so the product would be asserting a legal fact it cannot source. Even the free ZEG tracker disclaims exactly this: "we make no representations or warranties of any kind regarding its completeness or accuracy… Verify all information with the relevant grid operator before making any decisions." The only sellable form here is "this status field changed on this snapshot date, here is the file" — which is what free tools already email.

## Verdict

Refuted. The deadline data does not exist in the sources; the authoritative clock lives in a mandatory free ISO portal that emails the buyer; ERCOT publishes its own change diff; a live competitor sells the identical feature list; and the moat asset is already 28 months into an incumbent's hands. No reshape survives: the A4-compatible thin version (diff public spreadsheets, alert on change) is precisely the free product, and the version that would justify $99–399/mo needs private per-project issuance dates that are unavailable without per-customer ISO portal credentials — which breaks A1/A6 anyway.

## References

1. https://www.caiso.com/documents/publicqueuereport.xlsx — fetched 2026-08-19, HTTP 200, 385,108 B, Last-Modified 2026-08-19 08:00:40 GMT; parsed all 33 columns: no milestone deadline field exists.
2. https://www.caiso.com/documents/appendix-dd-generator-interconnection-deliverability-allocation-procedures-as-of-jun-25-2025.pdf — fetched 2026-08-19, HTTP 200, 1,073,035 B, 157 pp; financial-security and GIA deadlines run from private issuance events.
3. https://www.caiso.com/documents/new-resource-implementation-guide.pdf — fetched 2026-08-19, HTTP 200, 1,176,409 B, 47 pp; RIMS access mandatory for generator owners, POC emails receive progress reports.
4. https://www.ercot.com/misapp/GetReports.do?reportTypeId=15933 — fetched 2026-08-19, HTTP 200; report index listing GIS_Report_July2026.xlsx (published 2026-08-03).
5. https://www.ercot.com/misdownload/servlets/mirDownload?mimic_duns=000000000&doclookupId=1258020955 — fetched 2026-08-19, HTTP 200, 678,920 B xlsx; contains "Changes from Last Report" change-indicator columns and milestone *completion* dates only.
6. https://www.ercot.com/mp/data-products/data-product-details?id=PG7-200-ER — fetched 2026-08-19, HTTP 200; ERCOT GIS data-product metadata page.
7. https://www.nyiso.com/documents/20142/1407078/NYISO-Interconnection-Queue.xlsx — fetched 2026-08-19, HTTP 200, 470,856 B, Last-Modified 2026-08-12; Developer name, IA Tender Date, no deadlines.
8. https://www.interconnection.fyi/ — fetched 2026-08-19, HTTP 200, 199,275 B; free daily queue data, 43,887 requests, "Sign up for email alerts".
9. https://gridtracker.io/ — fetched 2026-08-19, HTTP 200, 104,348 B; "Daily queue snapshots since April 2024", per-project queue change log, demo-only pricing.
10. https://gridtracker.io/mcp — fetched 2026-08-19, HTTP 200, 74,712 B; free MCP access, example query "Which projects changed status this week?".
11. https://gridtracker.io/pricing — fetched 2026-08-19, HTTP 404; no public price.
12. https://www.getbasepoint.com/platform/interconnection — fetched 2026-08-19, HTTP 200, 73,576 B; identical product incl. "alerts when timelines shift or action items are due".
13. https://www.getbasepoint.com/pricing — fetched 2026-08-19, HTTP 404, Last-Modified 2026-08-19; demo-only.
14. https://queue-tracker.zeroemissiongrid.com/ — fetched 2026-08-19, HTTP 200, 119,001 B, Last-Modified 2026-08-19 19:23:48 GMT; free queue-window alerts, weekly/monthly, plus accuracy disclaimer.
15. https://cleanview.co/pricing — fetched 2026-08-19, HTTP 200, 124,556 B; Explorer $750/month, legacy platforms "$40,000–80,000 annual contracts".
16. https://www.niraenergy.com/in-queue — fetched 2026-08-19, HTTP 200, Last-Modified 2026-08-17; MISO/PJM/SPP, demo-only pricing.
17. https://newsletter.interconnection.fyi/ — fetched 2026-08-19 (301 from interconnectionfyi.substack.com); alert newsletter, no price shown.
18. https://www.gridstatus.io/pricing — attempted 2026-08-19, HTTP 403 Cloudflare block (also /interconnection-queue, docs.gridstatus.io); price unverified.
19. https://www.pjm.com/planning/service-requests/services-request-status — probed 2026-08-19, HTTP 200 (site reachable today); https://api.pjm.com/api/v1/serviced_requests → HTTP 404 without key.
20. https://www.misoenergy.org/planning/resource-utilization/GI_Queue/ — probed 2026-08-19, HTTP 403 to automated fetch.

### Proven (primary source, fetched 2026-08-19)

- CAISO's public queue file (fetched 2026-08-19, HTTP 200, 385,108 B, Last-Modified 2026-08-19 08:00:40 GMT) contains NO milestone deadline columns. All 33 headers read: the only date fields are Interconnection Request Receive Date, Queue Date, Proposed On-line Date, Current On-line Date. Study and IA fields are undated free text ('Waived', 'Complete', 'In Progress', 'Executed').
- CAISO tariff Appendix DD (fetched 2026-08-19, 157pp) ties every milestone deadline to a PRIVATE per-customer event: '180 calendar days after issuance of the final Phase II Interconnection Study report', '120 calendar days after the CAISO provides the results of the System Impact and Facilities Study', '120 calendar days after the Participating TO provides the Interconnection Customer... with the draft GIA', and 'If the Interconnection Customer does not make an election within fifteen (15) Business Days, the CAISO will deem the Interconnection Request withdrawn.' None of those issuance dates appears in any public file.
- CAISO requires the developer to use its own milestone portal: New Resource Implementation Guide (fetched 2026-08-19, 47pp) states 'Potential or existing participating generator owners will be required to have user access to RIMS' and that 'Authorized Point of Contact(s) Email Addresses' receive project progress reports — a mandatory, free, authoritative first-party substitute with confidential per-project data the public file lacks.
- ERCOT publishes its own month-over-month diff: the GIS Report (GIS_Report_July2026.xlsx, 678,920 B, downloaded 2026-08-19) contains a column group titled 'Changes from Last Report' with 'Change indicators: Proj Name, MW Size, COD, SFS/NtP, FIS Request, Status Change INA-to-P'. Its milestone columns are completion dates (Screening Study Complete, FIS Approved, IA Signed, Financial Security and Notice to Proceed Provided), not deadlines.
- An exact live incumbent exists: Basepoint (getbasepoint.com/platform/interconnection, HTTP 200, 2026-08-19) — 'Import your queue positions... by queue ID', 'status changes... across CAISO, PJM, MISO, ERCOT, SPP, NYISO, and ISO-NE', 'Get alerts when timelines shift or action items are due', feature list includes 'Milestone deadlines and compliance dates'. /pricing returns 404 — demo-only.
- Free alerting substitutes are live: interconnection.fyi (GridTracker) offers free daily-updated queue data from 50+ ISOs/utilities with 'Sign up for email alerts'; Zero-Emission Grid's Queue Tracker (Last-Modified 2026-08-19) is free with weekly/monthly 'window-opening alerts' across every major ISO/RTO.
- The card's moat is already owned: GridTracker states 'Daily queue snapshots since April 2024' and sells a per-project 'queue change log' plus a free MCP server whose sample query is 'Which projects changed status this week?' — a 28-month snapshot archive an entrant cannot backfill, held by the firm that also compiles LBNL's Queued Up.
- Only public price point in the category is Cleanview at $750/month (Explorer, 5 users, all 7 ISOs + API), with its own comparison table citing legacy platforms at '$40,000-80,000 annual contracts' — no evidence of a $99-399/mo self-serve slot.
- NYISO's public queue (470,856 B, Last-Modified 2026-08-12) carries Developer name, 'Availability of Studies', 'IA Tender Date', 'CY/FS Complete Date' — event dates, again no deadlines.

### Unproven

- Grid Status (gridstatus.io) pricing and the exact capability of its Monitor > Interconnection Queue module — the site returned HTTP 403 (Cloudflare) on /pricing, /interconnection-queue, /api and docs.gridstatus.io, including with a browser User-Agent. Its free API tier of 500,000 rows/month appears only in secondary snippets, not fetched primary text.
- GridTracker's actual subscription price (monthly CSV delivery / daily Snowflake direct share) — gridtracker.io/pricing is HTTP 404 and the site is demo-gated. The card's claim that $99-399/mo is 'roughly in line with what GridTracker already charges' is therefore unsupported in either direction.
- Basepoint's and Nira's price levels and customer counts — both demo-gated.
- Whether PJM, MISO, SPP and ISO-NE public queue files contain deadline columns: MISO returned HTTP 403 and PJM's Data Miner API returned 404 without a key today, so only CAISO, ERCOT and NYISO file schemas were read directly. All three that were readable lack deadline fields; the other four are assumed similar but not verified.
- Whether every ISO (beyond CAISO's RIMS) provides an equivalent free customer portal with per-project milestone tracking. ERCOT RIOO and PJM's customer-facing systems were not fetched (ercot.com/services/rq/riooiams returned 404 at the guessed path).
- Actual willingness-to-pay of 5-150-employee developers for queue monitoring — no interview, forum thread or pricing-page evidence of that buyer paying anything at the $99-399 tier was found.
- The exact content and cadence of interconnection.fyi's free email alerts (per-project change alerts vs. general newsletter) — the signup routes to a Substack whose page did not expose frequency or alert-type text on fetch.

### Fatal risks

- PREMISE FALSIFIED AT THE PRIMARY SOURCE: the card's A2 mechanism ('computes deadlines from the file's own milestone-schedule columns') is false. I read every column of the exact CAISO file cited — there are no milestone deadline columns, only undated status words. The tariff (Appendix DD, fetched today) starts every clock at a private per-customer issuance event ('180 calendar days after issuance of the final Phase II Interconnection Study report'; '120 calendar days after the Participating TO provides... the draft GIA') that appears in no public file. The countdown the product sells cannot be computed from the data it plans to ingest.
- FREE FIRST-PARTY SUBSTITUTE, MANDATORY VERSION: CAISO requires the developer to hold RIMS access ('will be required to have user access to RIMS') and emails Authorized Points of Contact. The document whose issuance starts the deadline is delivered to the buyer directly, dated, weeks before any public file reflects it. QueueGuard is structurally a lagging copy of a free portal the buyer must already use.
- THE ISO ALREADY SHIPS THE DIFF: ERCOT's own free GIS Report contains a 'Changes from Last Report' change-indicator column group. The core engine (diff snapshots, alert on change) is a first-party free feature at one of the two MVP ISOs.
- EXACT INCUMBENT, LIVE TODAY: Basepoint sells the identical product feature-for-feature — import by queue ID, all 7 ISOs, 'alerts when timelines shift or action items are due', 'Milestone deadlines and compliance dates' — plus free alerting from interconnection.fyi/GridTracker and Zero-Emission Grid, and $750/mo full-data access from Cleanview. The card asserts no incumbents; six exist.
- MOAT ALREADY HELD BY THE INCUMBENT THE CARD CITES: GridTracker has 'Daily queue snapshots since April 2024' and a per-project change log, so the 'accumulating snapshot archive new entrants can't replicate' is 28 months in someone else's hands — and that someone compiles LBNL's Queued Up.
- ENGINE-NEVER-ARBITER VIOLATION: 'so a missed deadline never costs you the queue position' is an unattended outcome claim over an asset worth years of queue position, resting on a deadline the product would have to INFER (status word + tariff rule + unknown issuance date). Even the free ZEG tracker disclaims exactly this: 'Verify all information with the relevant grid operator before making any decisions.' The sellable form ('this field changed on this snapshot date, here is the file') is what free tools already email.
- PRICE FLOOR COLLAPSE: the alert layer is free (interconnection.fyi, ZEG) and the analytics layer starts at $750/mo (Cleanview) rising to $40-80k/yr legacy contracts. There is no observed $99-399/mo self-serve slot, and the card's pricing anchor to 'what GridTracker already charges' is unverifiable — GridTracker publishes no price.

### References

- https://www.caiso.com/documents/publicqueuereport.xlsx (fetched 2026-08-19) — HTTP 200, 385,108 B, Last-Modified 2026-08-19 08:00:40 GMT; parsed all 33 columns of 'Grid GenerationQueue' — no milestone deadline field, study/IA fields are undated text.
- https://www.caiso.com/documents/appendix-dd-generator-interconnection-deliverability-allocation-procedures-as-of-jun-25-2025.pdf (fetched 2026-08-19) — HTTP 200, 1,073,035 B, 157 pp; financial-security postings and GIA negotiation deadlines run from private per-customer report issuance events.
- https://www.caiso.com/documents/new-resource-implementation-guide.pdf (fetched 2026-08-19) — HTTP 200, 1,176,409 B, 47 pp, Last-Modified 2026-07-09; 'generator owners will be required to have user access to RIMS'; POC emails receive progress reports.
- https://www.ercot.com/misapp/GetReports.do?reportTypeId=15933 (fetched 2026-08-19) — HTTP 200, 100,187 B; report index listing GIS_Report_July2026.xlsx published 2026-08-03.
- https://www.ercot.com/misdownload/servlets/mirDownload?mimic_duns=000000000&doclookupId=1258020955 (fetched 2026-08-19) — HTTP 200, 678,920 B xlsx GIS Report; contains 'Changes from Last Report' change indicators and milestone completion dates (no deadlines).
- https://www.ercot.com/mp/data-products/data-product-details?id=PG7-200-ER (fetched 2026-08-19) — HTTP 200, 62,488 B; ERCOT GIS data-product metadata page (monthly public product).
- https://www.nyiso.com/documents/20142/1407078/NYISO-Interconnection-Queue.xlsx (fetched 2026-08-19) — HTTP 200, 470,856 B, Last-Modified 2026-08-12; Developer name, Availability of Studies, IA Tender Date — event dates, no deadlines.
- https://www.interconnection.fyi/ (fetched 2026-08-19) — HTTP 200, 199,275 B; free daily queue data across 50+ ISOs/utilities, 43,887 requests, 'Sign up for email alerts', paid tier only for developer names/documents.
- https://gridtracker.io/ (fetched 2026-08-19) — HTTP 200, 104,348 B; 'Daily queue snapshots since April 2024', per-project queue change log, 9,781 active projects, demo-only pricing.
- https://gridtracker.io/mcp (fetched 2026-08-19) — HTTP 200, 74,712 B; free MCP server for queue analytics, sample query 'Which projects changed status this week?'.
- https://gridtracker.io/pricing (fetched 2026-08-19) — HTTP 404, Last-Modified 2026-08-12; no public price for GridTracker.
- https://www.getbasepoint.com/platform/interconnection (fetched 2026-08-19) — HTTP 200, 73,576 B; live exact competitor — import by queue ID, 7 ISOs, 'alerts when timelines shift or action items are due', 'Milestone deadlines and compliance dates'.
- https://www.getbasepoint.com/pricing (fetched 2026-08-19) — HTTP 404, 45,816 B, Last-Modified 2026-08-19 12:09:45 GMT; Basepoint is demo-priced.
- https://queue-tracker.zeroemissiongrid.com/ (fetched 2026-08-19) — HTTP 200, 119,001 B, Last-Modified 2026-08-19 19:23:48 GMT; free queue-window tracker with weekly/monthly email alerts and an explicit no-warranty disclaimer.
- https://cleanview.co/pricing (fetched 2026-08-19) — HTTP 200, 124,556 B; Explorer $750/month up to 5 users, Pro/Custom demo-priced, comparison cites legacy platforms at $40,000-80,000 annual contracts.
- https://www.niraenergy.com/in-queue (fetched 2026-08-19) — HTTP 200, 1,031,921 B, Last-Modified 2026-08-17; In-Queue scenario modeling for MISO/PJM/SPP with real-time ISO study updates; no price, 'Book a Demo'.
- https://newsletter.interconnection.fyi/ (fetched 2026-08-19) — 301 from interconnectionfyi.substack.com; queue-request newsletter behind the site's 'email alerts' CTA; frequency and price not exposed.
- https://www.gridstatus.io/pricing (fetched 2026-08-19) — HTTP 403 Cloudflare block (also /interconnection-queue, /api, docs.gridstatus.io) even with browser User-Agent; pricing unverified.
- https://www.pjm.com/planning/service-requests/services-request-status (fetched 2026-08-19) — HTTP 200 today (site reachable); companion probe https://api.pjm.com/api/v1/serviced_requests returned HTTP 404 without an API key.
- https://www.misoenergy.org/planning/resource-utilization/GI_Queue/ (fetched 2026-08-19) — HTTP 403, 5,526 B; MISO queue page blocks automated fetch, so its file schema was not verified.

---

## 04 Kill-thesis — verdict: REFUTED

# B6 — QueueGuard: deep validation (kill lens), 2026-08-19

## Verdict: REFUTED

Four independent kills, each verified against a primary source fetched today. Any one is survivable; together they remove the product.

---

### 1. The tariff already does the job, in writing, addressed to the buyer

QueueGuard's promise is "a missed deadline never costs you the queue position." The tariffs make missing a deadline a *noticed, curable* event, not a silent one.

FERC's pro forma LGIP §3.7 (fetched today, 409,110 bytes, `Last-Modified: 2021-12-17`): "Transmission Provider shall deem the Interconnection Request to be withdrawn and **shall provide written notice to Interconnection Customer of the deemed withdrawal and an explanation of the reasons** for such deemed withdrawal. Upon receipt of such written notice, Interconnection Customer shall have **fifteen (15) Business Days** in which to either respond with information or actions that cures the deficiency or to notify Transmission Provider of its intent to pursue Dispute Resolution." Study-agreement deficiencies get their own notice: TP "shall notify Interconnection Customer of the deficiency within five (5) Business Days… and Interconnection Customer shall cure the deficiency within ten (10) Business Days of receipt of the notice."

CAISO's live tariff is the same shape and tighter. Appendix DD (GIDAP), §3.8, PDF fetched today, `Last-Modified: 2025-06-27`: "the CAISO shall deem the Interconnection Request to be withdrawn and shall provide written notice to the Interconnection Customer **within five (5) Business Days** of the deemed withdrawal… Upon receipt of such written notice, the Interconnection Customer shall have **five (5) Business Days** in which to respond with information or action that either cures the deficiency or supports its position that the deemed withdrawal was erroneous."

The developer *is* the interconnection customer. The counterparty is contractually obliged to write to them. The premise "nobody was watching" is not a premise about the ISO — it is a premise about the customer ignoring certified mail from the entity holding their queue position.

### 2. The ISO ships the feature itself, free, inside the portal you must use anyway

PJM's *Queue Point User Guide* (fetched today, `Last-Modified: 2026-06-25`): "Queue Point **is able to handle the deficiency process, including automated notifications, integration with PJM calendars** and role-based functionality." Access is via PJM Account Manager for members — i.e. free to anyone with a request in the queue. That is QueueGuard's headline job, first-party, in the system of record, on the largest queue in the country. Kill patterns #1 and #3, same finding.

### 3. The deadline data does not exist in the public files

This is the fatal technical fact. The card's A2 claim is that the product "computes deadlines from the file's own milestone-schedule columns." I opened both flagship files.

**CAISO** `publicqueuereport.xlsx` (HTTP 200, `application/vnd.openxmlformats…sheet`, 385,108 bytes, `Last-Modified: Wed, 19 Aug 2026 08:00:40 GMT`, internal "Report Run Date: 08/19/2026"). 33 columns across 3 sheets. Every column enumerated: Project Name, Queue Position, IR Receive Date, Queue Date, Application Status, Study Process, Type/Fuel/MW ×3, Net MWs, deliverability/TPD fields, County, State, Utility, PTO Study Region, Station, Proposed On-line Date, Current On-line Date, Suspension Status, four Study Availability columns (values: Complete / Waived / None), Interconnection Agreement Status. **There is not one forward-looking deadline field.** There is also no developer or company name.

**ERCOT** GIS Report July 2026 (fetched today; `Content-Disposition: …20260803.153950829.GIS_Report_July2026.xlsx`). The "Project Details – Large Gen" sheet is literally headed "GIM Project Milestone Dates" — and every one is an *attainment* date, not a due date: Screening Study Started/Complete, FIS Requested/Approved, IA Signed, Financial Security, Air/GHG Permit, Construction Start/End, Approved for Energization/Synchronization. These record what already happened.

So a countdown has to be *manufactured* by applying tariff rules to observed status dates. That output — "your financial security posting is due 3 October; miss it and you lose queue position" — is an unattended assertion of a legal fact with queue-position and ITC-safe-harbor liability behind it. It is the round-1 kill pattern verbatim ("never miss a deadline" as an outcome claim). The engine-safe form ("CAISO's file shows your IA Status changed to blank on 8/19; here is the row") is exactly what three free tools already publish.

### 4. Alerts arrive after the cure window has closed

ERCOT is monthly: July activity was published **2026-08-03** with report run **Aug 1** — up to a 33-day lag. CAISO's file regenerates daily (verified by today's `Last-Modified` and embedded run date), so a CAISO withdrawal surfaces ~1 day later — but CAISO's own cure window is **5 business days from the ISO's letter**, which the customer received first. The public file is a record of the withdrawal, not a warning before it.

### 5. Buyer count does not support self-serve SaaS

ERCOT is the only file that names the counterparty ("Interconnecting Entity"). Across 1,797 active large-gen rows: **1,342 distinct entity strings**, distributed 1,065 with one project, 255 with 2–4, 17 with 5–9, and **5 with ≥10** (max 14 — Tempus, CED, NextEra, RWE ×2). The card's ICP is "10–100 active requests across two or more ISOs." In the largest single-ISO queue, that population is five names, all enterprise accounts that Enverus/Pearl Street/Basepoint sell to with a rep. Note the SPV problem cuts both ways and I could not resolve parents — but it also kills the "map your portfolio automatically" onboarding story.

### 6. Incumbents at zero, and one doing the whole product

- **interconnection.fyi** (HTTP 200 today): "compiled daily from U.S. and Canadian ISO and utility interconnection queues — filterable, mapped, and **free**," 50+ ISOs/utilities, plus email alerts.
- **theloadflow.com/Interconnection** (HTTP 200, `Last-Modified: 2026-08-16`): "Live queue data across every major US ISO/RTO queue… Updated weekly," MISO/PJM/CAISO/ERCOT/NYISO/ISO-NE/SPP + BPA/PPW/DEC/SCS/TVA.
- **ZEG Queue Tracker**: free, email-gated, "the option to get window-opening alerts."
- **Basepoint** is QueueGuard, shipped: "Receive notifications when study results post, timelines shift, costs update, or competing projects withdraw," across all seven ISOs — demo-gated, no self-serve price.

### 7. A4 / corpus churn

Only **2 of 7** ISOs were machine-fetchable today. MISO's queue API returned **403**, PJM Data Miner **401** (registration required), the PJM public status page now says "The information on this page has moved here," and my SPP CSV path 404'd. Two verified sources, one of them monthly, is not "every ISO."

### Is there a reshape?

I looked for one. "Source-cited queue change-log" is free at interconnection.fyi and LoadFlow. "Queue intelligence dataset" is GridTracker/Enverus/Basepoint with enterprise sales. The only version with pricing power is the deadline countdown — and that is the version the engine may not sign. No reshape survives.

---

## References

| URL | Fetched | Note |
|---|---|---|
| https://www.ferc.gov/sites/default/files/2020-04/LGIP-procedures.pdf | 2026-08-19 | HTTP 200, application/pdf, 409,110 B, Last-Modified 2021-12-17. Pro forma LGIP §3.7 written notice + 15 business-day cure; 5/10 business-day deficiency-notice cure. |
| https://www.caiso.com/documents/appendix-dd-generator-interconnection-deliverability-allocation-procedures-as-of-jun-25-2025.pdf | 2026-08-19 | HTTP 200, 1,073,035 B, Last-Modified 2025-06-27. CAISO GIDAP §3.8: written notice within 5 BD, 5 BD to cure. |
| https://www.pjm.com/-/media/DotCom/etools/planning-center/queue-point-user-guide.pdf | 2026-08-19 | HTTP 200, 1,460,482 B, Last-Modified 2026-06-25. "handle the deficiency process, including automated notifications, integration with PJM calendars." |
| https://www.caiso.com/documents/publicqueuereport.xlsx | 2026-08-19 | HTTP 200, xlsx, 385,108 B, Last-Modified 2026-08-19 08:00:40 GMT. 33 cols, 266 ACTIVE rows (215 IA Executed), no deadline column, no developer name. |
| https://www.ercot.com/misapp/GetReports.do?reportTypeId=15933 | 2026-08-19 | HTTP 200. Listing shows GIS_Report_July2026.xlsx posted 2026-08-03 → monthly cadence / ~33-day lag. |
| https://www.ercot.com/misdownload/servlets/mirDownload?mimic_duns=000000000&doclookupId=1258020955 | 2026-08-19 | HTTP 200, xlsx. "Currently tracking 1906 generation interconnection requests"; run Aug 1 2026; milestone columns are attainment dates; 1,342 distinct Interconnecting Entities over 1,797 large-gen rows. |
| https://www.interconnection.fyi/ | 2026-08-19 | HTTP 200. Free, daily, 50+ ISOs/utilities, email alerts; developer names paywalled to GridTracker. |
| https://theloadflow.com/Interconnection | 2026-08-19 | HTTP 200, 30,901 B, Last-Modified 2026-08-16. Free, weekly, all 7 ISOs + 5 utilities. |
| https://queue-tracker.zeroemissiongrid.com/ | 2026-08-19 | Free email-gated queue-window tracker with opt-in alerts. |
| https://www.getbasepoint.com/platform/interconnection | 2026-08-19 | Direct incumbent: status/milestone/withdrawal alerts across all 7 ISOs; demo-gated, no public price. |
| https://www.pjm.com/planning/service-requests/services-request-status | 2026-08-19 | HTTP 200. "The information on this page has moved here." — corpus churn. |
| https://www.misoenergy.org/api/giqueue/getprojects | 2026-08-19 | HTTP 403 to automated fetch. |
| https://api.pjm.com/api/v1/ | 2026-08-19 | HTTP 401 — registration required. |
| https://www.gridstatus.io/pricing | 2026-08-19 | HTTP 403 to both curl and WebFetch — pricing unverified. |
| https://emp.lbl.gov/sites/default/files/2026-06/Queued%20Up%202026%20Edition.pdf | 2026-08-19 | HTTP 403 — LBNL figures could not be primary-verified; see unproven. |

### Proven (primary source, fetched 2026-08-19)

- FERC pro forma LGIP §3.7 requires the Transmission Provider to give the Interconnection Customer WRITTEN NOTICE of a deemed withdrawal with reasons, and gives the customer fifteen (15) Business Days to cure — verbatim from the PDF fetched 2026-08-19 (409,110 B, Last-Modified 2021-12-17). Separate provision: deficiency notice within 5 Business Days, cure within 10 Business Days.
- CAISO's live tariff (Appendix DD / GIDAP, §3.8, PDF fetched 2026-08-19, 1,073,035 B, Last-Modified 2025-06-27) obliges CAISO to send written notice within five (5) Business Days of a deemed withdrawal and gives the Interconnection Customer five (5) Business Days to cure. The ISO notifies the buyer directly and contractually.
- PJM ships the feature itself, free, in the portal customers must file through: the Queue Point User Guide (fetched 2026-08-19, Last-Modified 2026-06-25) states Queue Point 'is able to handle the deficiency process, including automated notifications, integration with PJM calendars and role-based functionality.'
- The CAISO public queue xlsx contains ZERO forward-looking deadline columns. Fetched 2026-08-19 (HTTP 200, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, 385,108 bytes, Last-Modified Wed 19 Aug 2026 08:00:40 GMT, internal 'Report Run Date: 08/19/2026'). All 33 columns enumerated; the only dates are IR Receive Date, Queue Date, Proposed On-line Date, Current On-line Date. Study columns hold Complete/Waived/None. The card's A2 claim of 'milestone-schedule columns' is false for the flagship source.
- The CAISO public file also carries no developer or company name field (withdrawn sheet header is literally 'Project Name - Confidential'), so portfolio mapping cannot be automated from it.
- CAISO's public active queue is small and mostly past the risk window: 266 ACTIVE rows, of which 215 show Interconnection Agreement Status = 'Executed' (fetched 2026-08-19).
- ERCOT's GIS Report milestone columns are attainment dates, not deadlines: 'Screening Study Started/Complete, FIS Requested/Approved, IA Signed, Financial Security, Construction Start/End, Approved for Energization/Synchronization' — verified by opening RPT.00015933...20260803.153950829.GIS_Report_July2026.xlsx on 2026-08-19.
- ERCOT publishes monthly with a real lag: the July 2026 GIS Report was posted 2026-08-03 with 'Time of Report Run: Aug 1, 2026' — up to ~33 days between an event and its appearance, versus CAISO's 5-business-day cure window.
- ERCOT tracks 1,906 total interconnection requests (Summary sheet, July 2026 report, fetched 2026-08-19).
- Buyer-count math from ERCOT's own 'Interconnecting Entity' field (1,797 active large-gen rows, fetched 2026-08-19): 1,342 distinct entity strings; 1,065 have exactly 1 project, 255 have 2-4, 17 have 5-9, and only 5 have 10 or more (max 14: Tempus, CED Development, NextEra, RWE x2). The card's ICP of '10-100 requests across two or more ISOs' maps to a handful of enterprise accounts in the largest single-ISO queue.
- Free substitutes are live today for the monitoring half: interconnection.fyi (HTTP 200 2026-08-19) is 'compiled daily... and free' across 50+ ISOs and utilities with email alerts; theloadflow.com/Interconnection (HTTP 200, 30,901 B, Last-Modified 2026-08-16) gives live weekly queue data across all 7 ISOs plus BPA/PPW/DEC/SCS/TVA; ZEG Queue Tracker offers free email-gated queue-window alerts.
- A direct incumbent ships the whole product: Basepoint (fetched 2026-08-19) offers 'notifications when study results post, timelines shift, costs update, or competing projects withdraw' with 'Queue Position Monitoring', 'Study Timeline Tracking' and 'Withdrawal & Risk Signals' across CAISO, PJM, MISO, ERCOT, SPP, NYISO and ISO-NE.
- A4 corpus reality check: only 2 of 7 ISOs were machine-fetchable on 2026-08-19. MISO's queue API returned HTTP 403, PJM's Data Miner API returned HTTP 401 (registration required), and PJM's own public status page now reads 'The information on this page has moved here.'

### Unproven

- LBNL 'Queued Up 2026' headline figures (~8,200 active projects / 2,061 GW at end-2025, down 10% from a 2,290 GW peak; 75% historic withdrawal rate; 61-month median duration). The primary PDF at emp.lbl.gov returned HTTP 403 to both curl and WebFetch on 2026-08-19, and emp.lbl.gov/queues also 403'd. These numbers come only from search-result summarisation of secondary sources and are NOT primary-verified. The buyer-count kill in this report therefore rests on the ERCOT file I actually opened, not on LBNL.
- Basepoint's price. The page is demo-gated with no public pricing, so I cannot state the price gap against the $99-$399/mo hypothesis — only that a funded competitor covers all seven ISOs with the identical alert feature set and sells via a rep.
- GridStatus.io pricing and whether its API includes interconnection queue datasets: gridstatus.io and docs.gridstatus.io both returned HTTP 403 to curl and WebFetch on 2026-08-19.
- Enverus PRISM and Pearl Street pricing — no public price pages found; the enterprise-price ceiling above QueueGuard is asserted, not measured.
- Whether MISO, SPP, NYISO and ISO-NE publish machine-fetchable public queue files at all: MISO 403'd, my SPP CSV path 404'd, and I did not reach NYISO or ISO-NE. The card's claim that these are 'documented in search results as publishing structurally similar public queue spreadsheets' remains unverified by direct fetch.
- Whether ISOs other than PJM (CAISO's RIMS, MISO's portal) also ship automated deficiency notifications in their customer portals. PJM is proven; I extrapolate the pattern but did not fetch the others' portal documentation.
- Parent-company rollup of ERCOT's 1,342 entity strings. Developers file per-project SPVs, so the true count of distinct parent developers is lower than 1,342 and the count with 10+ projects is somewhat higher than 5. The public file does not permit resolution.
- The exact scope of FERC Order 2023's public-posting mandate. ferc.gov HTML pages are Cloudflare-protected (HTTP 403 to curl and WebFetch on 2026-08-19), so I could not quote the final rule's public-interconnection-information requirement verbatim from the primary text.

### Fatal risks

- THE DEADLINE DATA DOES NOT EXIST IN THE SOURCE. I opened both flagship files today. CAISO's publicqueuereport.xlsx has 33 columns and not one forward-looking deadline; ERCOT's GIS Report milestone block is entirely attainment dates ('IA Signed', 'Screening Study Complete', 'Construction Start'). The product's entire promise — 'every tariff-defined milestone on a countdown' — has no upstream field to read. The card's A2 justification ('computes deadlines from the file's own milestone-schedule columns') is factually false against the primary artifacts.
- ENGINE-AS-ARBITER. Because no deadline field exists, the countdown must be synthesised by applying each ISO's tariff rulebook to observed status dates. 'Your financial security posting is due 3 October or you lose your queue position' is an unattended assertion of a legal fact carrying queue-position and ITC-safe-harbor liability — the exact round-1 kill pattern. The engine-safe restatement ('CAISO's 8/19 file shows this row changed; here it is') is precisely what interconnection.fyi and LoadFlow already publish for free.
- THE PREMISE IS CONTRADICTED BY THE TARIFF. Under the FERC pro forma LGIP §3.7 the transmission provider must give the interconnection customer written notice of a deemed withdrawal with reasons plus 15 business days to cure; under CAISO GIDAP §3.8 it is written notice within 5 business days plus 5 business days to cure. The buyer IS the noticed party. 'Missed the deadline because nobody was watching' describes a customer ignoring a letter from the entity holding their queue position, not an information gap a third-party scraper fills.
- THE ISO SHIPS IT FREE. PJM's Queue Point module 'is able to handle the deficiency process, including automated notifications, integration with PJM calendars and role-based functionality' (PJM's own user guide, Last-Modified 2026-06-25) — first-party, inside the mandatory filing portal, on the largest queue in the country. Kill patterns #1 and #3 land simultaneously.
- ALERTS ARRIVE AFTER THE CURE WINDOW. ERCOT publishes monthly (July data posted 2026-08-03, run Aug 1) — up to ~33 days of lag against CAISO's 5-business-day cure clock. Even CAISO's daily file only records a withdrawal after it has been deemed and the letter sent. The product structurally cannot beat the notice it is meant to backstop.
- NO SELF-SERVE BUYER POPULATION. ERCOT's own developer-name field yields only 5 entities with 10+ active requests out of 1,342 (1,065 have exactly one project). The stated ICP of '10-100 requests across two or more ISOs' is a handful of enterprise accounts already covered by Basepoint, Enverus and GridTracker with a sales rep — not a card-checkout market at $99-$399/mo.
- FREE INCUMBENTS AT ZERO PLUS A FUNDED ONE AT ENTERPRISE. interconnection.fyi (free, daily, 50+ ISOs, email alerts), LoadFlow (free, weekly, all 7 ISOs + 5 utilities), ZEG (free window alerts), and Basepoint doing the exact full feature set across all 7 ISOs. The price band the card targets is squeezed to nothing from both sides.
- A4 / COVERAGE COLLAPSE. Only 2 of 7 ISOs were machine-fetchable on 2026-08-19 (CAISO daily, ERCOT monthly). MISO 403, PJM Data Miner 401, PJM's public status page relocated ('The information on this page has moved here'), SPP path 404. The competitive product needs a credentialed, per-ISO scraper fleet across seven churning corpora — the completeness the promise requires is exactly what the autonomy gate forbids.

### References

- https://www.ferc.gov/sites/default/files/2020-04/LGIP-procedures.pdf (fetched 2026-08-19) — FERC pro forma Large Generator Interconnection Procedures. HTTP 200, application/pdf, 409,110 bytes, Last-Modified Fri 17 Dec 2021 17:49:34 GMT. Text extracted locally. §3.7: transmission provider must give written notice of deemed withdrawal with reasons; customer has fifteen (15) Business Days to cure. Separate provision: deficiency notice within 5 Business Days, cure within 10 Business Days.
- https://www.caiso.com/documents/appendix-dd-generator-interconnection-deliverability-allocation-procedures-as-of-jun-25-2025.pdf (fetched 2026-08-19) — CAISO Fifth Replacement Tariff Appendix DD (GIDAP), live. HTTP 200, application/pdf, 1,073,035 bytes, Last-Modified Fri 27 Jun 2025 17:21:33 GMT. §3.8: CAISO shall provide written notice to the Interconnection Customer within five (5) Business Days of deemed withdrawal; customer has five (5) Business Days to cure.
- https://www.pjm.com/-/media/DotCom/etools/planning-center/queue-point-user-guide.pdf (fetched 2026-08-19) — PJM Queue Point User Guide. HTTP 200, application/pdf, 1,460,482 bytes, Last-Modified Thu 25 Jun 2026 17:57:49 GMT. Verbatim: Queue Point 'is able to handle the deficiency process, including automated notifications, integration with PJM calendars and role-based functionality.' Access via PJM Account Manager.
- https://www.caiso.com/documents/publicqueuereport.xlsx (fetched 2026-08-19) — CAISO Public Queue Report. HTTP 200, content-type application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, 385,108 bytes, Last-Modified Wed 19 Aug 2026 08:00:40 GMT; internal cell 'Report Run Date: 08/19/2026'. Opened with openpyxl: 3 sheets, 33 columns, 266 ACTIVE rows of which 215 have IA Status 'Executed'. No forward-looking deadline column and no developer/company name field.
- https://www.ercot.com/misapp/GetReports.do?reportTypeId=15933 (fetched 2026-08-19) — ERCOT MIS report listing for the GIS Report. HTTP 200, text/html, 100,809 bytes. Filenames confirm monthly cadence and publication lag: GIS_Report_July2026.xlsx stamped 20260803, GIS_Report_Jun2026.xlsx stamped 20260701, GIS_Report_May2026.xlsx stamped 20260601.
- https://www.ercot.com/misdownload/servlets/mirDownload?mimic_duns=000000000&doclookupId=1258020955 (fetched 2026-08-19) — ERCOT GIS Report July 2026. HTTP 200, Content-Disposition filename RPT.00015933.0000000000000000.20260803.153950829.GIS_Report_July2026.xlsx. Opened with openpyxl: 'Currently tracking 1906 generation interconnection requests'; 'Time of Report Run: Aug 1, 2026'. 'GIM Project Milestone Dates' columns are all attainment dates. 1,797 active large-gen rows carry 1,342 distinct Interconnecting Entity strings; only 5 entities have 10+ projects.
- https://www.interconnection.fyi/ (fetched 2026-08-19) — GridTracker's free public queue site. HTTP 200, text/html. Verbatim: 'Every request to connect new generation to the grid, compiled daily from U.S. and Canadian ISO and utility interconnection queues — filterable, mapped, and free.' 50+ ISOs and utilities; email alerts offered; developer names and documents reserved to paid GridTracker.
- https://theloadflow.com/Interconnection (fetched 2026-08-19) — LoadFlow Interconnection Queue Tracker. HTTP 200, text/html, 30,901 bytes, Last-Modified Sun 16 Aug 2026 20:50:40 GMT. 'Live queue data across every major US ISO/RTO queue and state utility interconnection program... Updated weekly.' Covers MISO, PJM, CAISO, ERCOT, NYISO, ISO-NE, SPP plus BPA/PPW/DEC/SCS/TVA.
- https://queue-tracker.zeroemissiongrid.com/ (fetched 2026-08-19) — Zero-Emission Grid Queue Tracker. Free, email-gated. Verbatim: 'Enter your email to access live queue windows across every major ISO & RTO — plus the option to get window-opening alerts.' Weekly or monthly alert cadence.
- https://www.getbasepoint.com/platform/interconnection (fetched 2026-08-19) — Basepoint interconnection tracking — direct incumbent. Verbatim: 'Receive notifications when study results post, timelines shift, costs update, or competing projects withdraw from the queue ahead of you'; monitors 'status changes as they happen across CAISO, PJM, MISO, ERCOT, SPP, NYISO, and ISO-NE'. Demo-gated, no public pricing, no self-serve signup.
- https://www.pjm.com/planning/service-requests/services-request-status (fetched 2026-08-19) — PJM Services Request Status page. HTTP 200, text/html, 42,819 bytes. Body text reads 'The information on this page has moved here.' — evidence of public-corpus relocation/churn.
- https://www.misoenergy.org/api/giqueue/getprojects (fetched 2026-08-19) — MISO generator interconnection queue API endpoint. HTTP 403, text/html, 5,606 bytes — bot-blocked to automated fetch.
- https://api.pjm.com/api/v1/ (fetched 2026-08-19) — PJM Data Miner API root. HTTP 401 Unauthorized, content-length 0 — registered credentials required.
- https://www.gridstatus.io/pricing (fetched 2026-08-19) — Attempted GridStatus pricing verification. HTTP 403 to both curl (with browser UA) and WebFetch. Pricing NOT verified; recorded as unproven.
- https://emp.lbl.gov/sites/default/files/2026-06/Queued%20Up%202026%20Edition.pdf (fetched 2026-08-19) — Attempted primary fetch of LBNL 'Queued Up 2026 Edition'. HTTP 403, text/html, 4,547-byte challenge page — PDF not retrieved. LBNL queue statistics are therefore recorded as unproven, not relied upon.