# WL-00 · Public rate lookup (unauthenticated)

**Effort: S · Must (MVP) · Depends on: WL-13**
**Added during wave-1 reconciliation, 2026-09-03**, after
[`../OFFER.md`](../OFFER.md) §7 made it non-negotiable ("the Rate Lookup is free forever with no
card and no login; the trial gates the *form*, never the *rate*") and
[`../LANDING_SPEC.md`](../LANDING_SPEC.md) §5 made it the landing page's element #2 — the one
thing on the page the buyer can falsify on the spot.

## Story

As a stranger who has never heard of {{PRODUCT}}, I pick my state, my county and my construction
type on the home page and immediately see the real classifications and rates for my job — with
the wage determination number, the modification number and a link to SAM.gov — without a login,
a card, an email address or a cookie wall.

## Why this is a Must and not a marketing asset

Three reasons, and only the third is about marketing.

1. **It is the trust argument, executed rather than asserted.** The buyer's binding constraint
   (PERSONA/OFFER §2.2) is *perceived likelihood* — she does not believe a $99 tool has the
   right rates. Every claim we make about the corpus is checkable in ten seconds against
   SAM.gov, from the front page, before she gives us anything.
2. **It is nearly free.** It is a read-only view over `kb_*`, reusing WL-03's query layer and
   WL-02's lookup, with no auth, no writes and no new tables. The only genuinely new work is
   abuse control and caching.
3. It is the landing page's conversion engine and the outbound emails' link target.

**It is not a free tier.** Rates are public federal data we merely made queryable. The paid
product is the *form* — the roster, the hours, the WH-347, the Statement of Compliance, the
history and the alerts. Nothing behind the paywall is given away here.

## Flow

```
/  (landing)  and  /lookup  (the same widget, full page)
   state ▾   county ▾   construction type ▾        [ Show the rates ]
        │
        ├─ 1 determination  →  result card + classification table
        ├─ n determinations →  candidate list first (the F3 problem, in public)
        └─ 0               →  "No determination lists {county} for {type}" + what that means
        │
   result page  /lookup/:state/:county/:type   (and  /wd/:wdNumber  by number)
     ┌──────────────────────────────────────────────────────────────┐
     │ TX20260253 · modification 1 · published 18 May 2026           │
     │ Texas · Harris County · Building · 57 classifications         │
     │ [ View the official determination on SAM.gov ↗ ]              │
     ├──────────────────────────────────────────────────────────────┤
     │ search…                       RATE     FRINGE    TOTAL        │
     │ ELECTRICIAN (EXCLUDES LOW …)  $38.50   $10.71   $49.21        │
     │ …                                                             │
     └──────────────────────────────────────────────────────────────┘
     ↓ the honest conversion line, below the table, never above it:
     "These are the rates. The weekly WH-347 is the work.
      Your first two Fridays are free — card on file, $99 on day 15.
      [ Start 14-day trial → ]"          ← never "Start free" (WL-09 V16a)
     ↓ and, separately and smaller, the consented watch (WL-14), below that again:
     "Email me when this determination changes"  + an unticked consent box
```

## Screens

| screen | contents | states |
|---|---|---|
| widget (embedded on `/`) | three selects, one button, result inline | idle · loading · one · many · zero |
| `/lookup` | the same widget full-page, with the "how to read a determination" explainer | — |
| `/lookup/:state/:county/:type` | **server-rendered, indexable** result page | — |
| `/wd/:wdNumber` | lookup by determination number, with the alias forms (WL-02 V8), **the modification picker and the modification history** | found · superseded · fetching · not-found |
| `/wd/:wdNumber/:mod` | the same determination **rendered at an explicit modification**, including a superseded one. Canonical URL for a revision. | found · superseded · fetching · not-found |
| candidate list | the F3 case, in public: several determinations, what distinguishes them, no default | — |
| watch form (WL-14) | below the classification table, unticked consent box, one email field | idle · pending · limit-reached |

### The modification control — the public half of the differentiator

`/wd/:wdNumber` renders, beside the modification number, the control `LANDING_SPEC.md` §5.1 calls
**"My contract locked an earlier one ▾"**. Choosing an earlier modification **re-renders the whole
classification table at that modification** and draws the modification history beneath it.

This is the public twin of [`WL-02`](WL-02-project-and-wd-lookup.md)'s explicit-modification pin,
and it reads the same corpus rows that [`WL-13`](WL-13-kb-ingestion-and-refresh.md)'s
`kb.fetch_history` and on-demand `kb.fetch_determination` now provide (findings B3 and B4). Rules:

- The dropdown is populated from `kb_wd_modifications` — **never invented, never interpolated**.
  A determination with one revision shows one option and says so.
- A revision whose text we do not yet hold shows "reading modification {n} from SAM.gov…",
  enqueues the fetch, and resolves. It never shows the active modification's rates under an older
  modification's heading.
- Every rate on a superseded revision renders through the same provenance component with
  `modification = {n}` and the permanent line *"a newer modification ({m}) was published on
  {date}"*. **Never presented as current.** *(WL-11 edge case, gate G8)*
- `modification_pin_used {wd_ref, from_mod, to_mod}` fires on every change. It is the direct
  measure of whether the differentiator is understood, and it answers `OFFER.md` §11.3 Q7.

**These pages are server-rendered and crawlable on purpose.** 3,088 (state, county) pairs × 4
construction types is a large, genuinely useful, entirely factual public surface, and it is the
only organic acquisition channel this product has. `sitemap.xml` is generated from `kb_*`.

## Data model

**No new tables.** Reads `kb_counties`, `kb_wage_determinations`, `kb_wd_counties`,
`kb_classifications`. One addition for abuse control, in cache rather than the database:

```
rate_limit:lookup:<ip_hash>       fixed window, 60 requests / 10 minutes
rate_limit:lookup:<ip_hash>:day   1,000 requests / day
```

Results are cached at the edge keyed on `(state, county, type, corpus_version)` with a 24-hour
TTL and revalidation on every ingest run, because the corpus changes at most daily (WL-13 §6).

## Server actions / API

| route | auth | effect |
|---|---|---|
| `GET /lookup/:state/:county/:type` | none | server-rendered result, cached |
| `GET /wd/:wdNumber` | none | resolve by number or alias to the **active** modification; enqueues `kb.fetch_history` so the modification control can render |
| `GET /wd/:wdNumber/:mod` | none | the determination **at that modification**, superseded included; enqueues `kb.fetch_determination` when the text is not held (WL-13) |
| `GET /api/public/counties?state=XX` | none | the county select, cached indefinitely |
| `GET /sitemap.xml` | none | generated from `kb_*`. **Active modifications only** — superseded revisions are reachable and canonical but not submitted for indexing, because an old rate is not what a searcher wants first |

**There is no public JSON API.** The HTML pages are public; a documented machine endpoint is
not, because the corpus is the moat and giving it away in bulk is the one way to lose it. This
is a deliberate decision and it is recorded here so nobody adds one for convenience.

## Validation rules

| # | rule |
|---|---|
| V1 | Every rate renders through `<Rate>` / `<ProvenanceLine>` (WL-11) — WD number, modification, publication date, SAM.gov link. **Gate G8 applies to public pages exactly as it does to the app.** A public page is where a wrong rate does the most reputational damage. |
| V2 | No email, no cookie wall, no interstitial, no "unlock the rest". The full classification table renders. |
| V3 | The conversion call-to-action appears **below** the table, never above it and never over it. |
| V4 | Ambiguous results (F3) show candidates in public exactly as they do in the app — the public surface must not be more confident than the product. |
| V5 | Rate limited per IP hash; over the limit returns a plain 429 page with the SAM.gov link, never a signup wall. |
| V6 | No PII, no cookies beyond a strictly-necessary CSRF token, no third-party analytics on these pages — our own `events` table only (PLAN A14). |
| V7 | The standing disclaimer (KNOWLEDGE_BASE §9.3) is on every public result page in full, not collapsed. |
| V8 | If the corpus is stale past gate G6 (35 days) the pages still render, with the age shown in amber. Never a blank page. |
| V9 | **When the corpus is unreachable the page fails closed** — the honest error plus a link to SAM.gov's own search — and **never** serves a shipped snapshot, a cached rate from a previous deploy, or any rate whose current source we cannot confirm. The corpus is our own database, so "unreachable" means **our** outage, and a stale rate shown during our own outage is the exact fact pattern `OFFER.md` §5.2 G2 refunds on. *(Added 2026-09-03, finding M16. `LANDING_SPEC.md` §5.2's snapshot fallback is deleted; this rule is the one that ships.)* |
| V10 | **Every CTA on a public page that leads to a card reads `Start 14-day trial`**, and the line beside it names the trial length and the charge. The lookup's own microcopy may say "free, no card, no login" because that is true of the lookup. *(WL-09 V16a, finding B9)* |
| V11 | The watch form ([`WL-14`](WL-14-wd-watch.md)) renders **below** the full classification table, never above it and never as a gate. V2 still governs: the table renders in full with no email. |

## Acceptance criteria

- **Given** Texas / Harris / Building on the widget, **when** it is submitted, **then**
  TX20260253 mod 1 renders with **57** classifications, each with rate, fringe and provenance,
  with no login and no cookie set beyond CSRF.
- **Given** Texas / Harris / Heavy, **when** it is submitted, **then** **three** candidates
  render with no default selected. *(V4)*
- **Given** `/wd/TX260253` (an alias form), **when** it is opened, **then** it resolves to
  TX20260253 and canonicalises the URL.
- **Given** a superseded WD number, **when** it is opened, **then** it renders with a clear
  "superseded — modification n is current" notice and a link to the current one.
- **Given** `/wd/TX20260253`, **when** the modification control is opened, **then** it lists
  **exactly** the revisions in `kb_wd_modifications` — mod 0 (17 May 2026) and mod 1 (18 May
  2026) — with none invented, and choosing mod 0 re-renders the whole classification table at
  mod 0, every rate carrying `data-modification="0"` and the permanent "a newer modification (1)
  was published on 18 May 2026" line. `modification_pin_used {from_mod: 1, to_mod: 0}` fires.
- **Given** a determination with a single revision, **when** the control renders, **then** it
  shows one option and the caption says so. No revision is fabricated.
- **Given** the corpus is unreachable, **when** the widget is used, **then** the honest error and
  the SAM.gov link render and **no rate of any kind appears on the page**. *(V9)*
- **Given** any public page, **when** its CTAs are inspected, **then** none reads "Start free".
  *(V10)*
- **Given** a public result page, **when** the DOM order is inspected, **then** the watch form
  follows the last classification row. *(V11)*
- **Given** any public result page, **when** the HTML is inspected, **then** every rate carries
  `data-wd-number` and `data-modification`. *(V1, G8)*
- **Given** 61 requests from one IP hash in 10 minutes, **when** the 61st arrives, **then** a
  429 renders with the SAM.gov link and no signup prompt. *(V5)*
- **Given** `/sitemap.xml`, **when** it is fetched, **then** it lists one URL per
  (state, county, construction type) combination present in the corpus.
- **Given** an empty corpus, **when** the widget is used, **then** it says the data is loading
  and does **not** render an empty table as an answer.

## Edge cases

| case | behaviour |
|---|---|
| A competitor scrapes every page | Expected, and acceptable: this is public federal data. What is not public is the corpus's **modification history**, the parsed structure behind it, and everything the paid product does with it. Rate limits make bulk scraping slow; they do not pretend to prevent it. |
| Someone uses the lookup weekly and never signs up | Also expected. They are the top of a funnel with a long fuse and they are one award away from needing the form. `lookup_performed` with a stable IP hash over time is a retargeting signal for the outbound engine, not a reason to gate. |
| A county with determinations for only two of the four types | Show the two, and say plainly that no Highway or Residential determination lists that county — that is a real, useful fact. |
| The determination has 300 classifications | Paginated and searchable server-side; the count is in the heading. |
| A rate is disputed by a visitor | Every page links to the official determination. The answer is the link. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Corpus unavailable | "We can't reach our determination data right now. Search SAM.gov directly →" **and no rate.** Never a shipped snapshot, never a stale cached rate. *(V9)* | `public_lookup_corpus_unavailable` |
| A named revision's text is not held yet | "Reading modification {n} from SAM.gov…", the fetch enqueued, the page resolves. Never the active modification's rates under an older heading. | `public_revision_fetch_enqueued` |
| Unknown county slug | 404 with the state's county list | `public_lookup_not_found` |
| Rate limited | plain 429 + SAM.gov link | `public_lookup_rate_limited` |

## Analytics events

**This spec owns the whole public surface's vocabulary — the landing page included.** Names are
canonical and defined once, in [`WL-EVENTS.md`](WL-EVENTS.md) §1;
[`../LANDING_SPEC.md`](../LANDING_SPEC.md) §13 reuses them verbatim and coins none of its own.

*Added 2026-09-03, finding B6: ten events the landing page emitted with no owner are now owned
here, and four the landing page had renamed are back to their spec names —
`lookup_completed` → `lookup_performed`, `lookup_empty` → `lookup_zero_results`,
`source_chip_clicked` → `lookup_official_link_clicked`, `plan_cta_clicked` →
`pricing_cta_clicked` (WL-09).*

**The lookup itself**
`lookup_started {field_first_touched}` ·
`lookup_performed {state_code, county_name, construction_type, result_count, latency_ms, source}`
← **the leading indicator, and [`../THRESHOLDS.md`](../THRESHOLDS.md) §1's denominator** ·
`lookup_ambiguous {candidate_count}` ·
`lookup_zero_results {state_code, county_name, construction_type}` ·
`lookup_classification_searched {query, result_count}` ·
`lookup_official_link_clicked {wd_number, surface}` ← **the trust event** ·
`lookup_cta_clicked {wd_number}` ← **the top of the funnel; THRESHOLDS §1's numerator** ·
`modification_pin_used {wd_ref, from_mod, to_mod}` ← **the differentiator, measured** ·
`public_lookup_rate_limited`

**The rest of the public page** (the landing page's own surface, owned here so one document owns
each name): `hero_viewed {variant}` · `hero_cta_clicked {variant}` · `how_step_viewed {step}` ·
`ledger_used` (**no values, ever — the visitor's inputs are never transmitted**) ·
`wh347_artefact_expanded {page}` · `timeline_viewed` · `comparison_table_viewed` ·
`faq_opened {question_id}`

`alert_email_captured` belongs to [`WL-14`](WL-14-wd-watch.md); `pricing_viewed`,
`pricing_cta_clicked`, `gc_tier_interest`, `checkout_*` and `trial_started` belong to
[`WL-09`](WL-09-billing.md).

Public events carry **no** user id and an IP **hash**, never an address. *(V6)*

## Test plan

**Unit** — county slugging and its inverse; alias resolution for all four SAM forms; the
ambiguity branch.
**Integration (PGlite seeded from `../kb-samples/`)** — Harris/Building → 57 rows with correct
rates; Harris/Heavy → 3 candidates; a fabricated county → the zero-result page; a superseded
number → the notice.
**Gate G8 test** — render three public pages and assert provenance on every rate. The same test
that guards the app, pointed at the public routes.
**Privacy test** — assert no cookie beyond CSRF is set, no third-party script is loaded, and no
`events.props` on a public route carries an IP address or an email.
**E2E** — from `/`, run a lookup, follow the SAM.gov link (assert `href` only), click the CTA
and land on signup with the determination carried through as a prefill.
