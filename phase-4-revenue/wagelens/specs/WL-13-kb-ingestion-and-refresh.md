# WL-13 · Wage-determination corpus: ingestion and daily refresh

**Effort: L · Must (MVP) · Depends on: nothing**
Source design and every verified endpoint: [`../KNOWLEDGE_BASE.md`](../KNOWLEDGE_BASE.md) §2–§7.
Samples: [`../kb-samples/`](../kb-samples/). Reference parser:
[`../kb-samples/parse-wd-document.py`](../kb-samples/parse-wd-document.py).

## Story

As the product, I hold every active federal Davis-Bacon general wage determination — **4,235**
of them across **54** states and territories, roughly **135,000 classification rows** — each
carrying its WD number, modification number, publication date and source URL, refreshed daily,
with every superseded modification retained forever.

## Why this is the first thing built

Everything else in the MVP is a form over this table. There is **no API key** and **no bulk
download** (KNOWLEDGE_BASE KB-5): the corpus exists only because we build it.

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
              │  fetch  /wdol/v1/wd/{ref}/{rev}             │
              │  parse  → rate groups + classifications     │
              │  gates  G1–G4                               │
              │  INSERT (never UPDATE) in one transaction   │
              │  if this wd_number had an older active row: │
              │     old.superseded_by = new.id              │
              │     old.is_active     = false               │
              │     enqueue wd.modification_detected  ─▶ WL-08
              └─────────────────────────────────────────────┘
```

## Data model

Defined in full in [`../KNOWLEDGE_BASE.md`](../KNOWLEDGE_BASE.md) §3.1:
`kb_counties`, `kb_wage_determinations`, `kb_wd_counties`, `kb_wd_modifications`,
`kb_rate_groups`, `kb_classifications`, `kb_ingest_runs`. Plus the shared queue:

```ts
jobs
  id             uuid         primaryKey defaultRandom
  kind           text         notNull      // kb.fetch_determination | kb.reparse | wd.modification_detected | email.send
  payload        jsonb        notNull
  run_after      timestamptz  notNull default now()
  attempts       integer      notNull default 0
  max_attempts   integer      notNull default 5
  locked_at      timestamptz
  completed_at   timestamptz
  failed_at      timestamptz
  last_error     text
  dedupe_key     text         unique       // 'kb.fetch:TX20260253:1' — makes enqueue idempotent
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
| `GET /api/cron/kb-full` | same | weekly; enqueues a re-fetch of **every** active pair, ignoring the diff. Catches in-place edits. |
| `GET /api/health/corpus` | public | `{active_determinations, oldest_last_verified, last_run_status, parser_version}` — the ops surface and the source of gate G6's alert |
| `lib/kb/lookup.ts` | internal | `findDeterminations({state, countyCode, constructionType?})`, `getDetermination(wdNumber, mod)`, `searchClassifications(wdId, query)` — the only module WL-02/03/04 touch |
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

Server-side, on the same `events` table (props in braces):
`kb_ingest_started {kind}` · `kb_preflight_aborted {reason, seen, expected}` ·
`kb_index_fetched {records}` · `kb_determination_added {wd_number, modification_number, classifications}` ·
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
twice.
**Gate tests** — one per G1, G2, G3, G4, G6, G9, G10, each asserted by a deliberately broken
fixture. *A green aggregate is not evidence that a specific gate ran* — each is a named test.
**Contract test (nightly lane, network)** — hit the real SAM.gov index and one determination,
assert the response still has `_embedded.results[].fullReferenceNumber` and
`document`. **This is the canary for KNOWLEDGE_BASE §6.4.** It runs nightly, never per-commit.
