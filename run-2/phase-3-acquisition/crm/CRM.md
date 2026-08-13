# CRM — the acquisition register, maintained by jobs

**Owner:** phase-3 acquisition · **Written:** 2026-08-13 · **Scope A** (`CORRECTIONS.md` §3.1)
**Files owned:** `crm/CRM.md` (this file), `crm/channels.csv`, `crm/segments.csv`, `crm/dashboard.md`
**Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D1–D10, G1–G6 · `CORRECTIONS.md` · `BRAND.md`
**Status:** internal register, not copy. Every external figure carries its source and read date; none is printable on a customer surface.

---

## 0. What this is not

A CRM is normally a pipeline of people: names, stages, next actions, an owner who is a human and a
review meeting where that human explains the stage. Every one of those five nouns is forbidden here.
There is no salesperson (A1), no onboarding call, no support queue (A3), and no human minutes per
customer to spend (A6). A pipeline of people would be a lie about the company's own mechanism.

So this register keeps **channels and experiments**, and every owner in it is a **job**. The unit of
work is not "follow up with X on Tuesday"; it is "a cron read a counter and flipped a status."
Weinberg & Mares' Bullseye needs a scoreboard to be a method rather than a mood — the three
concurrent tests only mean something if their thresholds were written first and something impartial
reads them afterwards. Ries' pre-registration supplies the first half. This register is the second.

---

## 1. The register has no person records, by construction

The most important property of this CRM is the table it does not have.

- The free WH-347 generator and the modification-diff checker have **no email wall** — resolved in
  favour of proof over list growth, and recorded as a cost (`BRAND.md` C-B3). A free-tool user is a
  session, not a contact.
- There is **no lawful machine-readable list of D1** to import. SAM's public entity data exposes
  point-of-contact name and address only; email, phone and fax are marked FOUO/CUI. USASpending
  subaward rows carry no contact field at all.
- Every community venue that holds D1 is closed to machines by its own terms or by live
  countermeasures — Reddit 403 to every probed endpoint, ContractorTalk's proof-of-work challenge
  and its 402-metered agent endpoint, LinkedIn User Agreement §8.2, Meta's automated-collection ban.
  We do not scrape them, and we do not buy a list assembled from them.
- California's Public Works Contractor Registration search is closer to a true D1 frame than any
  federal feed, and it is used **only** as a sizing and validation instrument. We will not scrape it.

The consequence is clean rather than sad: **there is nobody to nurture, so there is nothing to
nurture them with.** What the register holds instead is a channel table, a segment table, and a set
of counters with thresholds attached.

---

## 2. The three files, and who may write each

Modelled on `ARCHITECTURE.md` §3.9's boundary table, for the same reason: a boundary that is not
written down is a boundary that erodes.

| File | Written by | Read by | Human write allowed? |
|---|---|---|---|
| `channels.csv` | a human **for the descriptive columns only** (asset, kill_or_revival, cadence, job) | `crm.review.close`, `crm.dashboard.render` | Yes, for description. **No** for `status` |
| `channels.csv` `status` column | `crm.review.close` and the per-test meters, exclusively | as above | **No.** A hand edit is reverted on the next close |
| `segments.csv` | a human for definitions; `crm.segments.refresh` for the observable-signal counts | the page build-order job, `crm.dashboard.render` | Yes for definitions, no for counts |
| `dashboard.md` | `crm.dashboard.render`, exclusively | anyone | **No.** The file is regenerated; a hand edit is overwritten |
| `claims.json` | the measurement jobs, exclusively (`CORRECTIONS.md` §5) | the renderer, `crm.dashboard.render` | **No, ever** |

The pattern is the one `CORRECTIONS.md` §5 already established for claims and this document simply
extends to channels: **a human with commit access to every file here still cannot promote a channel
or resurrect a killed one**, because the status is not stored where the prose is.

---

## 3. The jobs that maintain the register

Names follow the existing `noun.verb` convention and the jobs run in the same table-plus-claim-loop
scheduler as `ARCHITECTURE.md` §7.1, with the same unique `idempotency_key` discipline.

| Job | Cadence | Does | Writes | Fails closed by |
|---|---|---|---|---|
| `crm.tool.funnel` | daily 03:20 ET | Counts diff runs, plain-generator runs, and tool-session → account transitions | T1 counters | Missing day is recorded as missing, never interpolated |
| `crm.sc.pull` | daily 04:00 ET | Search Console `searchanalytics.query` — clicks, impressions, ctr, position by page and date | T2 counters | API error leaves the previous value with its own as-of date |
| `crm.index.sample` | daily 04:10 ET | URL Inspection API over a **random sample** of published pages. The API allows 2,000 queries per day and 600 per minute per property, so indexed share is an estimate from a sample with its n printed, never a census presented as one | T2 indexed share, with n | Sample smaller than 200 publishes no ratio |
| `crm.sem.meter` | daily 04:20 ET | Reads spend and $49 purchases; computes cost per purchase; **sets the daily cap to zero when a kill line is crossed** | T3 counters, `channels.csv` status | Unreadable spend is treated as at-cap, so the failure direction is to stop spending |
| `crm.verify.count` | daily 04:30 ET | Verification-URL loads per 100 artifacts, split first-party vs third-party by referrer and session | Loop counters | No denominator, no ratio published |
| `crm.awards.pull` | monthly | USASpending prime-award geography and NAICS, as **page build order only** | Build-order table | Never emits a message or an address |
| `crm.segments.refresh` | monthly | Recomputes each segment's observable-signal counts from first-party data and the corpus | `segments.csv` count columns | A segment with fewer than 5 accounts publishes no count |
| `crm.competitor.diff` | weekly, with `ingest.ecfr` | Re-fetches every competitor price page cited in `BRAND.md` §1 Step 2 and §5.4 and hash-diffs it | Diff log | A moved price flags the row rather than editing it |
| `crm.optout.honor` | hourly | Writes a suppression hash and deletes the raw address | Suppression table | Deletion before suppression, so a failure cannot leave a live address |
| `crm.review.close` | **weekly, Mondays 04:40 ET** | Evaluates every kill criterion whose window has elapsed; flips status; halts the spend or the page template concerned | `channels.csv` status, review log | A criterion whose inputs are missing stays open and says so |
| `crm.dashboard.render` | nightly 05:00 ET | Regenerates `dashboard.md` from the counters and `claims.json` | `dashboard.md` | Unsigned or stale `claims.json` renders every gated metric as GATED |

Nothing in this table pages anyone, opens a ticket, or waits for a reply. `ops.digest` reports the
week's status flips and, as §10.5 of the architecture puts it, nothing waits on it.

---

## 4. Status is computed, never typed

Five rules, each of which exists because the opposite is the normal failure of a growth scoreboard.

1. **Thresholds precede data.** Every row of `channels.csv` carries its kill or revival condition
   already written. A kill criterion authored after the numbers arrive is not one (Ries).
2. **A kill is a job's write.** `crm.review.close` flips `status` to `killed` and, in the same
   transaction, removes the thing being killed: the SEM daily cap goes to zero, or the page template
   stops being emitted by `pages.rebuild`.
3. **Delete, do not iterate.** At 90 days, any T2 template whose indexed share trails the
   free-generator control arm is deleted. "Iterating" a losing template is how a dead channel keeps
   consuming engineering.
4. **A dead channel has no revival path unless the row names one.** The nine channels dead on the
   autonomy axis carry `Permanent`. The parked ones carry a specific, checkable condition — Zapier's
   50 active users, Gusto's audit artefacts, email behind T2.
5. **The register records the cost of its own constraint.** Trade shows stay visible in the table
   as the highest D1-reachability row on the board, and BD stays visible as the only door to ABC's
   67 chapters and 24,000 merit-shop members. Deleting those rows would make the constraint look
   free, and it is not.

---

## 5. What is collected, and what makes it consented

| Datum | Source | Consent mechanism | Retention |
|---|---|---|---|
| Page, referrer, device class, country | Site analytics | Cookieless by design — no cookies, no persistent identifier, no stored IP or User-Agent, daily-rotated salt for unique counting, so no consent banner is required for analytics | Aggregate only |
| `first_entry_path` on an account | First-party, our own domain | Disclosed in the signup flow as part of the account record the customer creates | With the account; removed on deletion |
| Free-generator and diff-tool inputs | The user's own upload | Given by the act of using the tool, with the purge stated on the page | **24 hours**, enforced by `retention.sweep` |
| Payroll CSV, worker rows, SSN ciphertext | The customer's own payroll system | The subscription itself; per-tenant key, per-row `key_version` | Per `ARCHITECTURE.md` §5.4; deletion destroys the tenant key |
| WD-change alert address | Single opt-in on our own form | CAN-SPAM's requirements, met as mechanisms rather than as a policy page: a clear opt-out in every message, honoured automatically and immediately against the 10-business-day ceiling, a valid postal address, accurate headers, no deceptive subject | Until opt-out; then the address is deleted and only a suppression hash remains |
| Classification confirmations | The customer's own choice, in-product | The product's stated behaviour: chosen once, remembered per (account, WD, title) | Per-account. Cross-tenant aggregate may only **order** a candidate list, never pre-select or auto-apply (R-HIGH2) |
| Search Console, Google Ads, Stripe events | Our own properties and the customer's own transaction | n/a — our data about our own surfaces | Per provider |

**California.** The launch demand market is CA, so CCPA is the relevant regime. The statute applies
to a for-profit business meeting any one of: gross annual revenue over $25 million; buying, selling
or sharing the personal information of 100,000 or more California residents or households; or
deriving 50% or more of annual revenue from selling California residents' personal information
(oag.ca.gov, read 2026-08-13). Ratepin meets none of the three, and sells no personal information
at any volume. The rights are implemented anyway — know, delete, correct — because the self-serve
export and the account-deletion path already exist for A1 reasons, and "not covered yet" is not a
design.

**Refused, permanently:** scraped or purchased email lists; SAM point-of-contact data beyond what is
public; automated collection from LinkedIn, Facebook, Reddit or ContractorTalk; the CA DIR
registration search as a prospect source; and any enrichment vendor that would resolve a session to
a named person. Each refusal removes a channel we have already scored dead, so none of them costs
us an option we otherwise had.

---

## 6. The review cadence is a cron, not a meeting

| Rhythm | Job | What closes |
|---|---|---|
| Nightly | `crm.dashboard.render` | The dashboard is never older than one day |
| Weekly, Monday 04:40 ET | `crm.review.close` | Every elapsed kill window; status flips; spend halts |
| Weekly | `crm.competitor.diff` | Competitive facts that would otherwise rot into lies (`BRAND.md` §8.3) |
| Week 8 | `crm.review.close` | T1: diff runs must exceed plain-generator runs |
| Week 12 | `crm.review.close` | T1 hard kill on zero tool-originated conversions; T2 indexation floor at 20%; the Gartner listing's zero-session check |
| Week 16 | `crm.review.close` | County × craft sub-surface, killed independently; prime→sub pages against T2's bar |
| Day 90 | `crm.review.close` | The T2 cohort against its control arm: delete, do not iterate |
| Week 26 | `crm.review.close` | The Intuit listing; the revision feed's referring-domain check |

There is no standing meeting because there is nobody to hold one with, and no escalation path
because A3 forbids inventing one. An escalation here is a status flip.

---

## 7. Five ways this register could lie, and the guard for each

1. **Attribution without a denominator.** Cookieless analytics cannot follow a person across
   sessions, so channel attribution is session-level and `first_entry_path` is one weak signal.
   Guard: every attributed number is printed with its denominator or not at all.
2. **Survivorship.** Killed rows stay in `channels.csv` with `status=killed`. A register that
   deletes its failures reads as a strategy that never failed.
3. **The flattering loop.** The artifact loop is the most attractive idea in the plan and has no
   coefficient. Guard: it has no kill line yet *and* no yield may be assumed from it, which is the
   only honest pair of statements available.
4. **Self-referral contamination.** Our own re-checks would inflate verification loads. Guard:
   first-party and third-party loads are separated by referrer and session before any ratio.
5. **The zombie channel.** A parked row quietly restarting without its revival condition being met.
   Guard: `crm.review.close` asserts that each parked row's condition is still unmet, and a row that
   moved without one is reverted.

---

## 8. Hypotheses, flagged per the literature-grounding standard

- That first-party, cookieless, session-level attribution is sufficient to read these tests at all.
  Unmeasured, and load-bearing for every number in `dashboard.md`.
- That `first_entry_path` survives the gap between a free-tool session and a later paid signup.
- That the URL Inspection sample estimates indexed share within a useful band at n≈200/day.
- That a killed channel stays killed without anyone defending the decision — the whole design
  assumes nobody will argue with a cron, which is exactly what has never been tested.

---

## References

**Fetched in-session, 2026-08-13**

- https://developers.google.com/webmaster-tools/v1/searchanalytics/query — metrics `clicks`,
  `impressions`, `ctr`, `position`; dimensions country, device, page, query, searchAppearance, date,
  hour; 1,000 rows default, 1–25,000 range
- https://developers.google.com/webmaster-tools/limits — URL Inspection: **2,000 queries per day and
  600 per minute per site**; Search Analytics 1,200 QPM per site
- https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect — index status of a
  URL, for the version in the Google index
- https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business — clear and
  conspicuous opt-out; honour within **10 business days**; valid physical postal address; accurate
  From/To/Reply-To and routing; no deceptive subject lines
- https://oag.ca.gov/privacy/ccpa — the three applicability thresholds and the five consumer rights;
  45 calendar days to respond, extendable to 90
- https://plausible.io/data-policy — "We don't use cookies, we don't generate persistent identifiers
  and we don't collect or store personal data that can be used to identify individuals"; salt
  rotated and deleted every 24 hours; "you do not need cookie banners for analytics"

**Internal, binding**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D1, D3, D4, D8, D9, G1–G6
- `run-2/phase-1-ideation/research/03-gtm-pricing.md` — §5 unit economics and the $46.98 rate-card
  contribution; §6 affordable CAC
- `run-2/phase-2-build/CORRECTIONS.md` — §3.1 Scope A, §4 F-1…F-4, §5 the claims.json write path
  this register copies, R-HIGH2
- `run-2/phase-2-build/identity/BRAND.md` — §5.5, §5.6, §6.6, §8.3, C-B2, C-B3, C-B5
- `run-2/phase-2-build/architecture/ARCHITECTURE.md` — §3.9 boundary table, §5.4 retention, §7.1 the
  scheduler, §10.5 the one human-facing channel, §14 gate instrumentation
- `run-2/phase-3-acquisition/research/01-channels.md` · `02-demand-seo.md` ·
  `03-communities-and-lists.md` · `04-integrations-and-portals.md`

**Literature**

- Gabriel Weinberg & Justin Mares, *Traction* — https://tractionbook.com/ — Bullseye; three
  concurrent tests; a viral claim requires a measurable coefficient with a cycle time
- Eric Ries, *The Lean Startup* — http://theleanstartup.com/ — innovation accounting; thresholds
  written before the data
- Alex Hormozi, *$100M Leads* — the Core Four, two quadrants of which A1 deletes outright
- April Dunford, *Obviously Awesome* — https://www.aprildunford.com/obviously-awesome — the frame a
  channel sorts the reader into
- Geoffrey Moore, *Crossing the Chasm* — https://www.geoffreyamoore.com/ — beachhead before breadth,
  applied to segments and to page templates alike
- Kyle Poyar, *Growth Unhinged* — https://www.growthunhinged.com/p/your-guide-to-saas-metrics-20 —
  self-serve metering; why CAC payback misleads for PLG, hence cost per purchase
- Rob Fitzpatrick, *The Mom Test* — why an unreachable forum is evidence in neither direction
- The Twelve-Factor App — https://12factor.net/ — guarantees implemented in the codebase rather than
  in a review checklist
