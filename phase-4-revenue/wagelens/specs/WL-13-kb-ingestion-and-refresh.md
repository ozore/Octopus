# WL-13 · Wage-determination corpus: ingestion and daily refresh

**Effort: L · Must (MVP) · Depends on: nothing**
Source design and every verified endpoint: [`../KNOWLEDGE_BASE.md`](../KNOWLEDGE_BASE.md) §2–§7.
Samples: [`../kb-samples/`](../kb-samples/). Reference parser:
[`../kb-samples/parse-wd-document.py`](../kb-samples/parse-wd-document.py).

## Story

As the product, I hold every active federal Davis-Bacon general wage determination — **4,235**
of them across **54** states and territories, roughly **135,000 classification rows** — each
carrying its WD number, modification number, publication date and source URL, refreshed daily,
with every superseded modification retained forever **and every superseded modification anyone
actually asks for fetched, parsed and stored under the same gates as an active one.**

## Why this is the first thing built

Everything else in the MVP is a form over this table. There is **no API key** and **no bulk
download** (KNOWLEDGE_BASE KB-5): the corpus exists only because we build it.

> **Changed 2026-09-03 (wave-1b iteration, finding B4).** The first version of this spec ingested
> the index at `is_active=true` and fetched only new **active** pairs. `/history` was never
> called. KB-3's "superseded revisions stay retrievable forever" was therefore a property of
> **SAM.gov**, not of our database — while every user-facing promise reads from our database
> (`WL-02 searchDeterminations`: "**never the network**"). That made three shipped promises
> undeliverable: pinning the contract's modification ([`WL-02`](WL-02-project-and-wd-lookup.md),
> finding B3), the landing page's Determination Timeline (`LANDING_SPEC.md` V2) and the
> "still provable in year three" clause the Provenance Guarantee refunds on (`OFFER.md` §5.2 G2).
> **This spec now ingests history and superseded revisions on demand**, with a launch backfill
> for the determinations the landing page ships with. The reviewer verified both endpoints live
> on 2026-09-03: `/wdol/v1/wd/TX20260253/history` returns rev 1 (`active:true`) and rev 0
> (`active:false`); `/wdol/v1/wd/TX20260253/0` returns HTTP 200 and a 16,319-byte `document`.
> **Design this in from the first commit.** Retrofitting append-only ingestion is expensive.

## The three ways a determination enters the corpus

| # | trigger | job | what it fetches |
|---|---|---|---|
| 1 | **Daily index diff** — a `(wd_number, modification_number)` pair appears that we do not hold | `kb.fetch_determination` | the active revision, as before |
| 2 | **Someone touches a WD number** — a project pins it, a visitor opens `/wd/:wdNumber`, a watch is created (`WL-14`), or `WL-08` diffs it | `kb.fetch_history` | `/wdol/v1/wd/{ref}/history` → one `kb_wd_modifications` row per revision, plus a `kb.fetch_determination` for any revision whose **text** we do not hold and that someone has asked for |
| 3 | **Someone names a specific older revision** — `WL-02`'s explicit-modification pin, `WL-00`'s "pick an earlier modification", the V2 timeline re-render | `kb.fetch_determination` with `{ wd_number, modification_number }` | `/wdol/v1/wd/{ref}/{rev}` for that exact revision |

**History is cheap and text is not.** `/history` is one small request and is fetched eagerly for
any WD number anyone touches, so a timeline can always be drawn. The 17 KB `document` of a
superseded revision is fetched **lazily**, only when someone asks to see or pin that revision.
4,235 determinations × every revision back to 2003 is not a corpus we need or want.

**Backfill at launch.** A one-off `kb.backfill_history` run over (a) every determination the
landing page's worked examples and the V2 timeline ship with, and (b) every determination above
modification 1 in the current index (the index shows **858** of them: 748 at mod 2, 67 at 3,
21 at 4, 13 at 5, 9 at 6). That is ~858 history calls and, at one prior revision each,
comfortably under an hour of drain ticks at the ≤4 req/s courtesy budget. **The landing page
must not be the first thing to discover an empty history table.**

## Flow

```
Vercel Cron  02:00 UTC daily  ──▶  GET /api/cron/kb-refresh   (CRON_SECRET header)
                                     │
              ┌──────────────────────┴──────────────────────┐
              │ PRE-FLIGHT  (gate G10, aborts the run)      │
              │  index size=1 → 200? hal+json? totalElements│
              │  within ±20% of kb_ingest_runs.last.ok?     │
              └──────────────────────┬──────────────────────┘
                                     ▼
              ┌─────────────────────────────────────────────┐
              │ INDEX  3 × size=2000 is_active=true         │
              │  → set of (wd_number, modification_number)  │
              └──────────────────────┬──────────────────────┘
                                     ▼
              ┌─────────────────────────────────────────────┐
              │ DIFF vs kb_wage_determinations              │
              │  new  → enqueue job kb.fetch_determination  │
              │  seen → batch UPDATE last_verified = now()  │
              │  gone → UPDATE is_active = false            │
              └──────────────────────┬──────────────────────┘
                                     ▼
   every cron tick (*/5 min)  ──▶  GET /api/cron/jobs-drain
              ┌─────────────────────────────────────────────┐
              │ claim N jobs  FOR UPDATE SKIP LOCKED        │
              │                                             │
              │ kb.fetch_determination {ref, rev}           │
              │  fetch  /wdol/v1/wd/{ref}/{rev}             │
              │  parse  → rate groups + classifications     │
              │  gates  G1–G4  ← SAME GATES, active or not  │
              │  INSERT (never UPDATE) in one transaction   │
              │  is_active = (rev == the index's active rev)│
              │  if this wd_number had an older active row: │
              │     old.superseded_by = new.id              │
              │     old.is_active     = false               │
              │     enqueue wd.modification_detected  ─▶ WL-08
              │     enqueue wd.watch_notify           ─▶ WL-14
              │                                             │
              │ kb.fetch_history {ref}                      │
              │  fetch  /wdol/v1/wd/{ref}/history           │
              │  UPSERT kb_wd_modifications, one row per    │
              │    revision (number, publish date, active)  │
              │  enqueue kb.fetch_determination for any     │
              │    revision in `wanted_revisions` we lack   │
              └─────────────────────────────────────────────┘

   on demand (WL-02 pin · WL-00 /wd/:n · WL-14 watch · WL-08 diff)
              ──▶ enqueue kb.fetch_history {ref}
              ──▶ enqueue kb.fetch_determination {ref, rev} when a specific
                  older revision is named
```

## Data model

Defined in full in [`../KNOWLEDGE_BASE.md`](../KNOWLEDGE_BASE.md) §3.1:
`kb_counties`, `kb_wage_determinations`, `kb_wd_counties`, `kb_wd_modifications`,
`kb_rate_groups`, `kb_classifications`, `kb_ingest_runs`. Plus the shared queue:

`kb_wd_modifications` (defined in KNOWLEDGE_BASE §3.1) is written by `kb.fetch_history` and gains
two columns in this iteration, so a timeline can be drawn without a second network call and so we
know whether we hold a revision's text:

```ts
kb_wd_modifications                       // one row per revision of a WD number, from /history
  wd_number             text         notNull
  modification_number   integer      notNull
  publication_date      date         notNull
  active                boolean      notNull     // as /history reports it
  text_held             boolean      notNull default false   // do we hold the document for this revision?
  history_source_url    text         notNull     // .../wdol/v1/wd/TX20260253/history
  history_fetched_at    timestamptz  notNull
  PRIMARY KEY (wd_number, modification_number)
  INDEX (wd_number)
```

```ts
jobs
  id             uuid         primaryKey defaultRandom
  kind           text         notNull      // kb.fetch_determination | kb.fetch_history | kb.backfill_history
                                           // | kb.reparse | wd.modification_detected | wd.watch_notify | email.send
  payload        jsonb        notNull
  run_after      timestamptz  notNull default now()
  attempts       integer      notNull default 0
  max_attempts   integer      notNull default 5
  locked_at      timestamptz
  completed_at   timestamptz
  failed_at      timestamptz
  last_error     text
  dedupe_key     text         unique       // 'kb.fetch:TX20260253:1'  · 'kb.history:TX20260253'
                                           // — makes enqueue idempotent
  created_at     timestamptz  notNull default now()
  index (kind, run_after) where completed_at is null
```

`dedupe_key` is what makes the whole pipeline idempotent: enqueuing the same
`(wd_number, modification_number)` twice is a no-op at the database level, not in application
code.

## API / server actions

| route | auth | effect |
|---|---|---|
| `GET /api/cron/kb-refresh` | `Authorization: Bearer ${CRON_SECRET}` | pre-flight → index → diff → enqueue. Returns `{run_id, seen, new, superseded, deactivated}`. **Never fetches determination text itself** — Vercel's function timeout makes that impossible for 4,235 records. |
| `GET /api/cron/jobs-drain` | same | claims and runs a bounded batch (default 25) with `FOR UPDATE SKIP LOCKED`, then returns. Called every 5 minutes. |
| `GET /api/cron/kb-full` | same | weekly; enqueues a re-fetch of **every** active pair, ignoring the diff. Catches in-place edits. **Never re-fetches a superseded revision** — those are immutable by definition and re-fetching 20,000 of them weekly would be rude and pointless. |
| `GET /api/cron/kb-backfill-history` | same | **one-off at launch, re-runnable.** Enqueues `kb.fetch_history` for (a) the demo determinations named in `LANDING_SPEC.md` §5.3 and §6 V2, and (b) every indexed determination at modification > 1. Returns `{enqueued}`. |
| `GET /api/health/corpus` | public | `{active_determinations, superseded_revisions_held, determinations_with_history, oldest_last_verified, last_run_status, parser_version}` — the ops surface and the source of gate G6's alert |
| `lib/kb/lookup.ts` | internal | `findDeterminations({state, countyCode, constructionType?})`, `getDetermination(wdNumber, mod)` — **resolves a superseded modification as readily as an active one, and enqueues the fetch when the text is not held** — `getModificationHistory(wdNumber)`, `searchClassifications(wdId, query)`. The only module WL-00/02/03/04 touch |
| `lib/kb/sam-endpoints.ts` | internal | **every SAM.gov URL in the codebase lives here**, so KNOWLEDGE_BASE §6.4's recovery procedure edits one file |

The SAM.gov client is an **adapter** in the Clausewright sense: `sam.live.ts` hits the network,
`sam.mock.ts` replays the committed `kb-samples/*.json`. Every test runs on the mock, offline,
with no key — because there is no key.

## Validation rules

| # | rule |
|---|---|
| V1 | Every request carries `Accept: application/hal+json` **explicitly**. Verified 2026-09-03: `Accept: application/json` returns **406**, which is what most HTTP client wrappers send by default. `*/*` happens to work today; do not rely on it. |
| V2 | Every request carries an identifying `User-Agent` naming the product and a contact URL. |
| V3 | Outbound rate ≤ **4 req/s** across the whole process, with jitter. `UNVERIFIED` whether SAM publishes a limit; this is a courtesy budget (KNOWLEDGE_BASE open question 1). |
| V4 | Retry 5xx and timeouts 3× with exponential backoff; **never** retry a 404 (the revision genuinely does not exist). |
| V5 | `document` must be non-empty and contain `General Decision Number:` — otherwise the record is rejected, not stored. |
| V6 | The parsed `wd_number` in the document must equal the `wd_number` requested. A mismatch fails the run (it means SAM served a different record). |
| V7 | A determination row is written **once**. There is no repository method that updates `document_text`, `base_rate` or `fringe_rate`. |
| V8 | `parse_coverage ≥ 0.995` per determination, computed as parsed classification rows ÷ naive `\.{2,}\$\s*[0-9]` matches (gate G3). Measured 0.9991 on a 40-determination national sample. |
| V9 | **A superseded revision is stored through exactly the same path as an active one** — same parser, same transaction, same gates G1–G4, same `document_text` retention, same provenance columns. There is no "lite" ingest. A rate we may have to defend in year three is not a second-class row. |
| V10 | `is_active` is derived from the index (and from `/history`'s `active` flag), **never** from "is this the newest row we hold". Fetching mod 0 after mod 1 must not flip mod 1 to inactive. |
| V11 | `kb.fetch_history` **upserts** `kb_wd_modifications` and touches nothing in `kb_wage_determinations`. History is metadata; determinations stay append-only (gate G2). |
| V12 | A superseded revision's text is fetched **only** when something asked for it — a pin, a public `/wd/:wdNumber` view at that revision, a watch, a diff, or the launch backfill. There is no crawl of every historical revision. |

## Acceptance criteria

- **Given** an empty database, **when** `kb-refresh` then `jobs-drain` run to completion,
  **then** `kb_wage_determinations` holds ~4,235 active rows, `kb_classifications` holds
  ~135,000 rows, and every classification row has a non-null `source_url`, `wd_number`,
  `modification_number`, `publication_date` and `last_verified`.
- **Given** a fully populated corpus, **when** `kb-refresh` runs again the same day, **then**
  zero jobs are enqueued, zero rows are inserted, and every seen row's `last_verified` moves
  forward. *(idempotence)*
- **Given** a determination at modification 1 and SAM now publishing modification 2,
  **when** the refresh runs, **then** a **new** row is inserted for modification 2, the
  modification-1 row keeps its `document_text` unchanged and gains `superseded_by` and
  `is_active = false`, and one `wd.modification_detected` job is enqueued per pinned project.
- **Given** a project pinned to modification 1, **when** modification 2 is ingested, **then**
  every rate that project reads is still modification 1's. *(gate G9)*
- **Given** the index endpoint returns HTTP 500, **when** pre-flight runs, **then** the run
  aborts with `status = 'aborted_on_gate'`, **no rows are modified**, and an alert fires.
- **Given** the index returns 400 records where the last successful run saw 4,235, **when**
  pre-flight runs, **then** the run aborts on the ±20% band. *(gate G10 — a renamed path must
  look like an outage, not like 3,835 withdrawn determinations)*
- **Given** a determination whose text parses to 96% coverage, **when** it is ingested,
  **then** that determination's transaction rolls back, the run is marked failed, and no
  partial classification set is visible to the app. *(gate G3)*
- **Given** a stored `document_text` and an improved parser, **when** `kb.reparse` runs,
  **then** classifications are re-derived **with zero network requests**.

**The superseded-revision criteria added by finding B4:**

- **Given** `TX20260253`, which nothing has touched yet, **when** `kb.fetch_history` runs,
  **then** `kb_wd_modifications` holds **two** rows — `(TX20260253, 0, 2026-05-17, active=false)`
  and `(TX20260253, 1, 2026-05-18, active=true)` — each carrying `history_source_url` and
  `history_fetched_at`, and `kb_wage_determinations` is unchanged. *(V11)*
- **Given** those history rows and a request to pin modification **0**, **when**
  `kb.fetch_determination {TX20260253, 0}` runs, **then** a **new** `kb_wage_determinations` row
  exists for `(TX20260253, 0)` with `is_active = false`, its full `document_text`, its `sha256`,
  its parsed `kb_rate_groups` and `kb_classifications` with `source_url`, `wd_number`,
  `modification_number`, `publication_date` and `last_verified` on every row — **and the
  modification-1 row is untouched, still `is_active = true`**. *(V9, V10 — this is the acceptance
  criterion the review asked for)*
- **Given** the stored modification 0, **when** `/wd/TX20260253` is opened at that revision and
  when a project pinned to it renders a rate, **then** both read modification 0's rows from the
  database with **no network request**, and modification 0's `document_text` is readable in the
  determination text view.
- **Given** a superseded revision whose text parses to 96% coverage, **when** it is ingested,
  **then** it rolls back exactly as an active one would. *(V9 — same gates)*
- **Given** `/wdol/v1/wd/{ref}/0` returning **404**, **when** the job runs, **then** it fails after
  one attempt with `last_error`, `kb_wd_modifications.text_held` stays false, and the pin screen
  says the revision's text is not available from SAM.gov and links to the determination there.
  **The project is not silently moved to the active modification.** *(V4)*
- **Given** the launch backfill, **when** `kb-backfill-history` and the drain complete, **then**
  every determination named in `LANDING_SPEC.md` §5.3/§6 V2 has ≥1 `kb_wd_modifications` row, and
  every determination above modification 1 in the index has its history. *(The V2 timeline cannot
  ship without this.)*
- **Given** the same `kb.fetch_history` enqueued twice, **when** the drain runs, **then**
  `dedupe_key = 'kb.history:TX20260253'` makes the second a no-op.
- **Given** any active determination whose `last_verified` is older than 35 days, **when**
  `/api/health/corpus` is read, **then** it reports degraded. *(gate G6)*

## Edge cases

| case | behaviour |
|---|---|
| A determination lists the **same rate-group identifier twice** with different effective dates (TX20260253 has `IRON0084-012` at 06/01/2017 and 06/01/2024) | `kb_rate_groups` is unique on `(wd_id, identifier, effective_date)`, not `(wd_id, identifier)`. Both are kept. |
| **Classification labels repeat within one determination**, distinguished only by a project-value qualifier — MN20260080 lists a surveyor at `+$760,000` $20.02 and `-$760,000` $17.02 | `kb_classifications` is keyed on `(wd_id, line_no)`. The qualifier is parsed into `qualifier` and rendered in the picker. **A schema keyed on the label would silently drop the second rate.** |
| A classification prints a rate but **no fringe** | `fringe_rate = 0.00`, not null. The form's column 6B needs a number. |
| SAM's county codes are **not unique** — Alaska reuses `17987` for "Aleutians East" and "Aleutians West" | `kb_counties` is keyed on `(state_code, sam_county_code, county_name)`. |
| A determination covers **every county in a state** | It still enumerates them; no statewide flag was observed in the active set. Handle an empty county list by storing zero `kb_wd_counties` rows and treating the determination as statewide in `lookup`. |
| Determination text contains **mojibake** (SAM returns `�` where the source had typographic quotes, e.g. `"SU"`) | Stored verbatim. Normalised only in `search_label`. Never "fixed" in `document_text` — it is evidence. |
| A revision returns **404** (present in the index, absent from WDOL) | Job fails after 1 attempt, is recorded with `last_error`, and the index row is left un-ingested. Alerted if >5 in a run. |
| A **superseded** revision returns 404 or an empty `document` | Same handling, but the user-facing consequence is different and must be said: the pin screen and the public revision view state that SAM.gov no longer serves that revision's text, link to the determination there, and offer the active modification **as a choice, never as a substitution**. |
| `/history` reports a revision the index never showed (a revision published and withdrawn the same day) | Stored in `kb_wd_modifications` with `active = false`. It is a fact about the document; we do not fetch its text unless someone asks. |
| A WD number has **one** revision only (3,377 of 4,235 do) | `kb_wd_modifications` holds one row, `LANDING_SPEC.md` V2's caption says so honestly, and no revision is ever invented. |
| Two revisions share a publication date | Both kept; `(wd_number, modification_number)` is the key, dates are descriptive. |
| The job queue is drained by two concurrent cron invocations | `FOR UPDATE SKIP LOCKED` plus `dedupe_key` makes double-processing impossible and double-enqueue a no-op. |
| Cold start exceeds the cron window | It is designed to: the index pass enqueues, the drain pass consumes 25 per tick. Full corpus reaches steady state in ~14 hours of ticks, or immediately via a one-off admin drain with a higher batch size. |
| DOL publishes a new **WH-347 revision** | Out of scope here; gate G5 in WL-06 owns it. |

## Errors

| condition | behaviour | alert |
|---|---|---|
| Pre-flight fails | abort, nothing written, `kb_ingest_runs.status = aborted_on_gate` | yes, immediately |
| HTTP 406 from any SAM.gov call | treated as a **configuration** failure, not a data failure: the `Accept` header is wrong. Aborts with that message rather than retrying | yes |
| Determination fetch 5xx | retry ×3, then fail that job only | at >5 failures per run |
| Parse coverage below gate | roll back that determination, fail the run | yes |
| Corpus older than 35 days | health endpoint degraded | daily, escalating |
| `document_text` empty | reject, do not store | yes |

## Analytics events

Server-side, on the same `events` table. **Names are canonical and defined once**, in
[`WL-EVENTS.md`](WL-EVENTS.md) §7 (props in braces):
`kb_ingest_started {kind}` · `kb_preflight_aborted {reason, seen, expected}` ·
`kb_index_fetched {records}` · `kb_determination_added {wd_number, modification_number, classifications}` ·
`kb_history_fetched {wd_number, revisions}` ·
`kb_superseded_revision_added {wd_number, modification_number, trigger}` ← `trigger ∈ {pin, public_view, watch, backfill, diff}`; it tells us whether anyone actually uses the differentiator ·
`kb_modification_detected {wd_number, from_mod, to_mod, pinned_projects}` ·
`kb_determination_deactivated {wd_number}` · `kb_ingest_gate_failed {gate, wd_number}` ·
`kb_ingest_completed {kind, new, changed, duration_ms, parse_coverage}`

## Test plan

**Unit (offline, on the committed samples)** — parse `sam-wd-detail-TX20260253-rev1.json`
→ exactly 57 classifications, 15 rate groups, 2 modifications, 1 county, type `Building`;
parse `sam-wd-detail-TX20260031-rev1.json` → 19 classifications, 2 counties, type `Heavy`;
the MN project-value duplicate produces **two** rows; a document missing
`General Decision Number:` is rejected; `parse_coverage` computes correctly.
**Integration (PGlite)** — full run against `sam.mock.ts`; re-run writes nothing new;
modification 2 supersedes without mutating modification 1; a pinned project still reads
modification 1; `dedupe_key` collision is a no-op; two concurrent drains never process one job
twice. **Plus, for B4:** `kb.fetch_history` on `TX20260253` writes two `kb_wd_modifications` rows
from `kb-samples/sam-wd-history-TX20260253.json` and mutates no determination row;
`kb.fetch_determination {TX20260253, 0}` stores the superseded revision with full text, parsed
classifications and provenance on every row while leaving mod 1 `is_active = true`; a project
pinned to mod 0 reads mod 0 with zero network calls; a 404 on a superseded revision leaves the
project un-repinned and the failure visible.
**Gate tests** — one per G1, G2, G3, G4, G6, G9, G10, each asserted by a deliberately broken
fixture. *A green aggregate is not evidence that a specific gate ran* — each is a named test.
**Contract test (nightly lane, network)** — hit the real SAM.gov index, one active determination
**and one superseded revision** (`/wdol/v1/wd/TX20260253/0`, verified 200 / 16,319 bytes on
2026-09-03), assert the responses still have `_embedded.results[].fullReferenceNumber`,
`document`, and `/history`'s `revisionNumber` / `publishDate` / `active`. **This is the canary for
KNOWLEDGE_BASE §6.4**, and the superseded call is now part of it because a promise we refund on
depends on it. It runs nightly, never per-commit.

**Fixture to capture before the first commit** (the only new artefact this change needs):
`kb-samples/sam-wd-detail-TX20260253-rev0.json`, the superseded revision, alongside the existing
`sam-wd-history-TX20260253.json`. Every offline test above runs on the mock, so without that file
the B4 tests cannot be written.
