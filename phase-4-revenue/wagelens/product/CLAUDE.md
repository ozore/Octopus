# product/ — memory file (WageLens Product Owner agent, wave 1)

**Started:** 2026-09-03. **Agent:** Product Owner (WageLens). **Status:** in progress.

## Scope
Writes ONLY under `phase-4-revenue/wagelens/`: `BACKLOG.md`, `specs/`, `KNOWLEDGE_BASE.md`,
`THRESHOLDS.md`, `kb-samples/`, and this file. No code in `apps/`. No commits, no pushes.

## Rules confirmed (PLAN.md / PIPELINE.md)
- Six stages: ideation → research → verification → writing → review → iteration. Wave 1b
  reviewer runs stage 5; this agent runs 1–4 and self-reviews.
- Sources opened, not remembered. Every regulatory value carries `source_url`,
  `last_verified`, `verified_by`, `confidence` (A10, standing rules).
- Auth = magic link, no OAuth (A7). US/English (A2). Neon Postgres + PGlite for tests (A13).
- Jobs = Vercel Cron → queue-drain route, `FOR UPDATE SKIP LOCKED` (A12).
- Analytics = own `events` table + optional PostHog (A14).
- Launch coverage = federal Davis-Bacon, 50 states + WH-347 (A11). State prevailing wage
  is explicitly OUT of MVP scope; documented as an extension plan in KNOWLEDGE_BASE.md.
- Reuse Clausewright's patterns (adapters mock/live, corpus-as-content, gates as CI tests)
  without copying the product.

## LIVE VERIFICATION LOG (stage 2–3) — all fetched 2026-09-03 from this environment

### WORKS — SAM.gov wage determinations, NO API KEY
The brief's URL `https://open.gsa.gov/api/wage-determination-api/` **returns HTTP 404** and
the open.gsa.gov API index (32 APIs listed, fetched 2026-09-03) contains **no wage
determination API at all**. `api.sam.gov` also 404s on every wage-determination path tried.
The working route is the **sam.gov front-end API**, unauthenticated. `Accept: application/hal+json`
is required in practice — verified precisely 2026-09-03: `Accept: application/json` → **406**,
`Accept: text/html` → **406**, `Accept: */*` or no header → **200**, `hal+json` → **200**.
(My first pass wrote "a plain request gets 406", which the re-verification disproved: curl's
default `*/*` works. The trap is that most client wrappers send `application/json`.)

| purpose | endpoint | verified |
|---|---|---|
| search/index | `GET https://sam.gov/api/prod/sgs/v1/search/?index=dbra&page=N&size=2000&mode=search&is_active=true` | 4,235 active DBA determinations in 3 requests, 3 seconds |
| filter by state | `&state=TX` | 290 |
| filter by county | `&county=<numeric code>` (NOT the name — `county=Harris` returns 0) | TX+14885 → 6 |
| sort for change detection | `&sort=-modifiedDate` | works |
| **determination text** | `GET https://sam.gov/api/prod/wdol/v1/wd/{ref}/{rev}` | 17 KB `document` string with every classification, rate and fringe |
| modification history | `GET https://sam.gov/api/prod/wdol/v1/wd/{ref}/history` | TX20260253 → rev 0 and rev 1 |
| county dictionary | `GET https://sam.gov/api/prod/wdol/v1/dictionaries/wdCounties?state=TX` | 254 TX counties with codes |

Endpoints were found by downloading the SAM.gov SPA bundle
(`https://sam.gov/sfe/main.3e809f42b972cd39.js`, 5.6 MB) and grepping for
`getWageDeterminationByReferenceNumberAndRevisionNumber` etc. **Record this technique** —
it is how to recover the paths if SAM.gov renames them.

### DOES NOT WORK
- `open.gsa.gov/api/wage-determination-api/` → 404. Not in the API index.
- `api.sam.gov/prod/wdol/...` and `api.sam.gov/prod/sgs/...` → 404. The documented,
  key-requiring SAM API does **not** cover wage determinations.
- Bulk extract: `fileextractservices/v1/api/listfiles?domain=Wage Determination` → **empty
  list**. `Contract Opportunities` returns files, `Wage Determination` returns none.
  **There is no bulk download.** The index endpoint at size=2000 is the substitute.
- `wdol.gov` → dead (proxy 502). The legacy WDOL archive is gone.
- `web.archive.org/cdx/...` → blocked by this environment's egress policy.
- `dol.gov/agencies/whd/forms/wh347` (the HTML page) → **403** to curl. The PDF itself is 200.
- `gsa.gov/system/files/.../SF1444-23a.pdf` → **403** to curl with two different UAs.
  Two attempts, logged, moved on. SF-1444 field list is UNVERIFIED (see KNOWLEDGE_BASE.md).

### THE BIG WH-347 FINDING
`https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf` downloads fine (200,
304,738 bytes, sha256 `fa28f033a825…`, Rev. January 2025, OMB 1235-0008, expires 2028-01-31).
**It is a FLAT PDF.** `/AcroForm` exists but `/Fields` is `[]`; the only annotation on either
page is a `/Link` to the instructions. `pypdf.get_fields()` returns **0**. There is nothing to
fill. → WH-347 output must be a **generated** PDF reproducing the official layout and the
Statement of Compliance wording verbatim (29 CFR 5.5(a)(3)(ii)(B) permits "another document
with identical wording"). Printed-field inventory: **50 distinct named fields**
(`kb-samples/wh347-field-list.json`).

### THE BIG PRODUCT FINDING
**12.17% of (state, county, construction type) combinations map to MORE THAN ONE active
determination** (1,483 of 12,185, computed over the whole active index, 2026-09-03). The
pitch "state + county + type → the exact determination" is wrong one time in eight. Harris
County TX "Heavy" alone has three (TX20260031, TX20260033, TX20260034). The MVP must show
candidates and ask which WD number the contract names. This drives spec WL-03.

## Inherited verified facts reused (from `identity/CLAUDE.md`, author: Buyer & Identity agent)
- **Do not use "$13,508 per violation" anywhere.** Not supportable at DOL's penalty table.
- 29 CFR 5.5(a)(3)(ii)(A): weekly certified payroll; **"The prime contractor is responsible
  for the submission of all certified payrolls by all subcontractors."** ← the GC-tier wedge.
- 29 CFR 5.5(a)(3)(ii)(B): full SSN and home address **must not** appear on the weekly
  transmittal; last four digits only. ← a hard data-model rule, not a preference.
- 29 CFR 5.5(a)(1)(iii): conformance, 3 criteria, 30-day WHD decision window,
  DBAconformance@dol.gov; conformance may not be used to split or subdivide a listed class.
- eCFR must be read via `https://www.ecfr.gov/api/renderer/v1/content/enhanced/{date}/title-29?part=5&section=5.5`
  — the ordinary page URL 302s to a blocked host.
- Incumbent pricing: LCPcertified $12/report, 5 projects $145/mo; Points North $175/mo +
  $7.50/report + $995–4,995 setup; CertifiedPayrollPro $49/$99/$249 tiers.

## Assumptions (best defensible guess, flagged UNVERIFIED in the documents)
- A-1: SAM.gov's front-end API has no published rate limit. Assume a courteous 4 req/s and
  a nightly full pass; no evidence either way was obtainable.
- A-2: SF-1444's field list is taken from the DOL Prevailing Wage Resource Book description,
  not from the PDF (gsa.gov 403s). Marked UNVERIFIED in KNOWLEDGE_BASE.md.
- A-3: Activation/conversion threshold numbers are hypotheses where no published SMB-SaaS
  benchmark exists; every such number says so in THRESHOLDS.md.

## Advice to the next agent
1. Do not build a fillable-PDF pipeline. The official form has no fields. Generate the PDF.
2. Never key a determination by (state, county, type) alone. The key is the **WD number +
   modification number**. That is also what the contract names and what column "WAGE
   DETERMINATION NO." wants.
3. The `document` string is the corpus. Store it verbatim, parse it into rows, and keep both
   — the verbatim text is the evidence when a customer disputes a rate.
4. `kb-samples/parse-wd-document.py` parses 99.9% of rate lines on a 40-determination
   national sample. Its two known misses are both real edge cases worth a test:
   Minnesota splits some classifications by project value (`+$760,000` / `-$760,000`), so
   **classification titles are not unique within a determination**.

## Wave-1 reconciliation with the sibling agents (2026-09-03, after first draft)

The Buyer & Identity and Offer & Landing agents finished after my first pass. Two of their
decisions changed my backlog, and I took theirs because those decisions are theirs to make:

1. **`OFFER.md` §7 makes the rate lookup free forever, with no card and no login**, and
   `LANDING_SPEC.md` §5 makes it the landing page's element #2. That is a **new MVP item** —
   added as **WL-00 · Public rate lookup**, effort S, depends only on WL-13. It is a read-only
   view over `kb_*` with no auth, no writes and no new tables. It is *not* a free tier: the
   rates are public federal data; the paid product is the form.
   → MVP is now **14 Must items: 5 L, 4 M, 5 S**.
2. **`OFFER.md` §6/§10 sets a three-tier ladder**, not the single $99 plan I had drafted:
   Crew $79/$790 (≤3 projects, ≤15 workers), **Shop $99/$990 (the ICP, recommended)**, GC
   Roll-up $299/$2,990. Six Stripe prices, lookup keys `wagelens_{crew|shop|gc}_{monthly|annual}`,
   env vars `WAGELENS_PRICE_*`, 14-day card-required trial on every price. WL-09 now implements
   that ladder; tier limits come from Stripe price **metadata**, mirrored onto `subscriptions`,
   never hard-coded. Both agents independently landed on 14-day + card, so the trial design and
   the THRESHOLDS anchoring survived unchanged.
3. The GC roll-up item was renumbered **WL-14 → WL-24** to free WL-00…WL-13 for the Must block.
   All cross-references updated; `grep -rn "WL-14"` in my files returns nothing.
4. THRESHOLDS gained **§1 Lookup → signup** (the funnel now starts before signup) and a **tier
   mix** threshold, and every section was renumbered accordingly.

## Verification pass (stage 3) — what re-checking changed

Re-ran every live call at the end. One claim did not survive and was corrected in three files:

- **WRONG (first draft):** "a plain request to the SAM.gov API gets HTTP 406".
- **RIGHT (re-verified 2026-09-03):** `Accept: application/json` → **406**; `Accept: text/html`
  → **406**; `Accept: */*` or **no** `Accept` header → **200**; `Accept: application/hal+json`
  → **200**. curl's default `*/*` works, which is why the first test misled me — I had passed
  `-H 'Accept: application/json'` in the probe that produced the 406.
- Why it still matters: most HTTP client wrappers send `Accept: application/json` by default, so
  the practical advice ("always set `application/hal+json` explicitly") is unchanged; only the
  reason was wrong. WL-13 now treats a 406 as a **configuration** failure, not a data failure.

Everything else re-verified identically: 4,235 active DBA determinations; Harris County TX = 6
(TX20260253 Building, TX20260299 Highway, TX20260031/33/34 Heavy, TX20260067 Residential);
TX20260253 rev 1 document = 17,225 characters; WH-347 sha256 `fa28f033a825…`, 2 pages,
**0 AcroForm fields**.

---

## Iteration after review (2026-09-03)

**Agent:** wave-1b Iteration author (WageLens). **Stage:** PIPELINE stage 6.
**Input:** `REVIEW.md` — 9 blocking · 19 major · 10 minor.
**Output:** `REVIEW_RESPONSE.md` (the changelog, one row per finding),
two new specs, and edits across `UX.md`, `PERSONA.md`, `BACKLOG.md`, `KNOWLEDGE_BASE.md`,
`THRESHOLDS.md`, `OFFER.md`, `LANDING_SPEC.md` and `specs/WL-00`–`WL-13`.
**Result: 32 fixed · 3 fixed differently · 3 declined. No blocking finding left open by this fleet.**

### What I changed

**Two new files.**
- `specs/WL-14-wd-watch.md` — the public determination watch (B5). It was promised on three
  surfaces and specified nowhere; `KNOWLEDGE_BASE.md` §3.2 listed a `wd_watches` table no spec
  owned. Now: unticked consent box naming the determination, double opt-in, ≤3 per address,
  one-click unsubscribe + `List-Unsubscribe`, CAN-SPAM postal footer, IP-hash rate limits, a
  retention table, and `email_suppressions`. Must, effort S.
- `specs/WL-EVENTS.md` — the canonical analytics vocabulary (B6). One event, one definition, one
  owner, with a CI union test in both directions and §8 restating every THRESHOLDS ratio in
  canonical names.

**The three fixes that unblock the build.**
- **B3 + B4 together made modification pinning real.** `WL-02` V3 dropped its `is_active` clause and
  gained V3a/V3b plus `projects.wd_pinned_superseded`; `WL-13` gained `kb.fetch_history`, on-demand
  `kb.fetch_determination` for a named superseded revision **through the same gates**, and a launch
  backfill. `WL-00` got the public modification control, `LANDING_SPEC` V2 now reads our corpus.
- **B9 auto-renewal** — `WL-09` V14–V16b: disclosure above the button, unticked consent checkbox
  recorded with the block's content hash, day-10 pre-charge email, ≥7-day annual renewal notice,
  and `Start 14-day trial` everywhere.
- **B1 trial** — `UX.md` rewritten to the 14-day card-on-file design the other four documents
  already had.

**Nine cross-document contradictions closed to a single reading:** trial design, guarantee wording
(including the cap), event names, archive retention (30 days), keyboard map, magic-link parameters,
payroll-number allocation, roles, and the Audit Binder's name and shape.

### The five decisions, and why

1. **Trial: 14-day card-on-file, charged day 15**, keeping "first two Fridays free". Three
   documents to one, the money path was already built on it, and a cardless free week hands a signed
   federal document to an unverified stranger.
2. **GC tier: "Coming", waitlist, no purchasable CTA, no live Stripe price.** Moving WL-24 to Must
   costs the MVP's largest L, cold-starts empty, and delays the day a stranger can pay us. Made
   structural in `WL-09` V17–V19, not editorial — a sellable-set constant, a boot assertion, a
   render test.
3. **Modification pinning: made real end to end.** History eager (one small request, so a timeline
   can always be drawn), text lazy (17 KB per revision, only when asked for).
4. **Watch alerts: specced, not removed.** At S the spec is cheaper than the retreat, and it is the
   only email list the product builds organically.
5. **Events: one list in `WL-EVENTS.md`.** Spec names are canonical because THRESHOLDS is the
   pre-committed decision instrument.

**Decided rather than left open (all three under the failure rule — the option that reduces founder
liability), and all three listed under "founder can override" in `REVIEW_RESPONSE.md` §4:**
G2's cap is **three months, service-shaped** (≈$59,400 vs ≈$237,600 at 200 accounts) **and the
sentence is cut from the page unconditionally until counsel signs it**; the GC tier is not
purchasable; the onboarding promise is **eleven minutes**, not ten, because Checkout is 90 seconds
and the promise is instrumented.

### What I declined, and to whom it goes

- **B7 (identity collision)** and **m5 (three hard `9px` sizes)** → the **Brand Director**.
  `IDENTITY.md`, `design-system.css` and `identity/samples.html` were not touched. What I did
  instead is hold the semantic-token line: `LANDING_SPEC.md` §14 now has an explicit item that every
  colour is a `--wl-*` token, so the arbitration is a token-file swap. m5's fix is pre-specified in
  `REVIEW_RESPONSE.md` §3.2 and should land in the same pass, when `contrast.py` is re-run anyway.
- **M19 (PREREQUISITES P7 asks for an Anthropic key)** → the **orchestrator**. `PREREQUISITES.md` is
  not this fleet's file; the correction is recorded as a new `OFFER.md` §11.3 Q9 where the founder
  will meet it. **P7 and P8 both need amending.**

### Advice for the build fleet

1. **Read `specs/WL-EVENTS.md` before you emit anything.** Generate the union type from it and wire
   the CI test on day one. B6 happened because two documents each invented a name; the test is what
   stops it happening again inside the code.
2. **Design WL-13's history and superseded-revision path in from the first commit.** Retrofitting
   append-only ingestion is expensive, and three shipped promises depend on it. **Capture
   `kb-samples/sam-wd-detail-TX20260253-rev0.json` first** — every offline test for B3 and B4 runs
   on the mock, so without that fixture the tests that prove the differentiator cannot be written.
3. **`is_active` is derived from the index and `/history`, never from "is this the newest row we
   hold".** Fetching mod 0 after mod 1 must not flip mod 1 to inactive. It is the easiest bug to
   write in this whole spec set and gate G9 will not catch it on its own.
4. **The payroll number is allocated at certification.** Drafts hold `null` and display
   "#8 (provisional)". Do not let a helpful `createPayroll` reserve one.
5. **Nothing blocks a federal filing on our reading of the customer's legal position.** Block only
   what makes the *form* invalid (WL-05 B1–B12). A below-determination rate warns loudly and records
   the acknowledgement; `determination-moved` never blocks, at any age.
6. **The consent records are gates, not UI.** `createCheckoutSession` refuses without a matching
   `subscription_terms_acceptances` row; WL-14 sends no alert to an unconfirmed watch. Both are
   enforced server-side, and both have acceptance criteria that assert the refusal.
7. **Two CI greps carry more weight than they look:** `Start free` in any user-facing CTA, and a
   refund sentence without "up to three" in the same sentence. They are the enforcement for B9 and
   B8, and both findings were copy drifting away from a spec.
8. **The landing word budget is 445/450 and the counting convention is now written down**
   (`LANDING_SPEC.md` §2 — step numerals are chrome, hyphenated terms count once). Implement the CI
   script against that convention or it will read 451 and fail a green build.
9. **`{{PRODUCT}}` everywhere, slug `wagelens` unchanged, help slugs name-free.** The rename is a
   founder decision (P11) and the expensive artefacts to fix later are emails, PDF footers and
   bookmarked URLs.
10. **Three unknowns are still unknowns** and nothing was hardened around them: SF-1444's field list
    (`UNVERIFIED`), whether GC portals accept an uploaded PDF (the highest-value unknown in the
    product), and SAM.gov's real rate limit. Do not let an implementation quietly assume any of them.

### Mistake worth recording

My first landing-page word count read **451/450** because my script counted the `Step 01` numerals
that the spec's own budget table excludes as layout chrome. The spec was right and the script was
wrong — but nothing in the document said which. **I wrote the convention into `LANDING_SPEC.md` §2
rather than adjusting a number to match a script.** A budget with an unstated counting rule is a CI
failure waiting to happen, and it would have failed on a page that was actually under budget.
