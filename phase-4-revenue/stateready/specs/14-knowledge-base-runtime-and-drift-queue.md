# M14 — Knowledge-base runtime and the drift review queue

**Status:** spec, wave 1. **Effort:** M (~2–3 dev-days). **Depends on:** `KNOWLEDGE_BASE.md`,
`kb-data/`, `kb-scripts/`. **Blocks:** M4, M5, M8. **This is the critical path of wave 2.**

## Story

> As the founder, when TDLR raises the ACR renewal fee from $65 to $80 on a Tuesday, I want to know on
> Wednesday, decide what it means, and publish the correction — and I never want that change to reach
> a customer without a person looking at it first.

The refresh pipeline already exists as scripts (`kb-scripts/refresh_sources.py`,
`verify_pass_b.py`, `validate.py`). This spec is how it becomes part of the running product.

## The two halves

**A. Load-time.** `kb-data/*.json` is committed to the repo and loaded into the database at deploy as
an immutable **snapshot**. The app never reads the files at request time and never mutates a
published record.

**B. Run-time.** A daily cron re-fetches every source, compares content hashes, and opens a review
item on any change. **Nothing auto-publishes.** A human (the founder, at launch) reads the diff,
re-runs verification, and publishes a new snapshot. That gate is the reason this product can charge
for correctness, and it is copied deliberately from `CORPUS_DESIGN.md` §3.7 property 2.

## Data model

```ts
export const kbSnapshots = pgTable("kb_snapshots", {
  id:            uuid("id").primaryKey().defaultRandom(),
  version:       text("version").notNull().unique(),        // git sha of kb-data/ at build
  publishedAt:   timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  recordCount:   integer("record_count").notNull(),
  publishableCount: integer("publishable_count").notNull(),
  isCurrent:     boolean("is_current").notNull().default(false),
  notes:         text("notes"),
});

export const kbRecords = pgTable("kb_records", {
  id:            uuid("id").primaryKey().defaultRandom(),
  snapshotId:    uuid("snapshot_id").notNull().references(() => kbSnapshots.id, { onDelete: "cascade" }),
  recordId:      text("record_id").notNull(),               // "tx.hvac"
  state:         char("state", { length: 2 }).notNull(),
  trade:         text("trade", { enum: ["hvac","plumbing","electrical"] }).notNull(),
  publishable:   boolean("publishable").notNull(),
  document:      jsonb("document").notNull(),               // the whole validated record
  contentSha256: text("content_sha256").notNull(),
}, (t) => ({ once: unique().on(t.snapshotId, t.recordId),
             lookup: index().on(t.snapshotId, t.state, t.trade) }));

export const kbSources = pgTable("kb_sources", {
  id:            uuid("id").primaryKey().defaultRandom(),
  sourceId:      text("source_id").notNull().unique(),      // "tx.tdlr.acr_apply"
  url:           text("url").notNull(),
  kind:          text("kind").notNull(),
  baselineSha256: text("baseline_sha256"),
  baselineHead:  text("baseline_head"),                     // first 4000 chars of normalised text
  baselineTail:  text("baseline_tail"),                     // last 4000 chars
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  lastStatus:    integer("last_status"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),   // the app owns this
                                                            // counter; refresh_sources.py has no
                                                            // notion of "three consecutive days"
});

export const kbDriftItems = pgTable("kb_drift_items", {
  id:            uuid("id").primaryKey().defaultRandom(),
  sourceId:      text("source_id").notNull().references(() => kbSources.sourceId),
  detectedAt:    timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  previousSha256: text("previous_sha256"),
  currentSha256: text("current_sha256"),
  diffSummary:   text("diff_summary"),                      // added/removed lines, truncated
  affectedRecordIds: text("affected_record_ids").array().notNull(),
  affectedOrganisations: integer("affected_organisations"),  // how many customers rely on it
  status:        text("status", { enum: ["open","reviewing","no_change","corrected","dismissed"] }).notNull().default("open"),
  resolutionNote: text("resolution_note"),
  resolvedAt:    timestamp("resolved_at", { withTimezone: true }),
});
```

`affectedOrganisations` is computed at detection so the queue is ordered by blast radius, not by
arrival. A fee change on a Texas page that 40 customers depend on outranks a typo fix on a page
nobody has a licence under.

**`baselineHead` / `baselineTail` exist because the diff screen cannot be built without them**
(wave-1b **M16**). `kb-data/_sources.json` stored only `content_sha256`, `bytes` and
`normalised_chars` — a hash tells you *that* something changed and nothing about *what*, and
`research/raw/` holds one-off captures from 2026-09-03, not a rolling store. Two bounded 4,000-char
excerpts per source (≈ 280 KB across all 35, trivial) are written at `--write-baseline` time and by
`accept_drift.py`, and they are enough for the word-level diff on the screens below in the
overwhelming majority of board-page changes, which happen in the body rather than in the middle of a
long document. Where the change falls outside both windows the screen says so and links the live page
rather than showing a diff it cannot compute — a diff that silently omits the change is worse than no
diff.

## Flow

```
BUILD  kb-data/*.json → validate.py must pass → snapshot rows → isCurrent flipped in one transaction

DAILY  /api/cron/kb-drift
  1  for each kbSource: fetch (2 attempts, 4 s backoff), normalise, hash    [lib_kb.py rules]
  2  hash equal            → update lastCheckedAt, done
     hash differs          → create kbDriftItem with a text diff and the affected record list
     unreachable 3 days    → create a drift item of kind "source unreachable"  (a board moving a
                             page is as important as a board changing one)
  3  notify the founder: one digest, ordered by affectedOrganisations

MONTHLY  full re-verification: verify_pass_b.py over every record; any disagreement demotes the
         value to unverified in the NEXT snapshot and opens a review item

REVIEW   /admin/kb  →  open item  →  side-by-side old/new normalised text, word-level diff
                                  →  "no change that matters" | "correct the record"

         "no change that matters"  →  ACCEPT THE DRIFT (see below). It is NOT a close-and-forget:
                                      it rewrites the baseline hash AND every citing record's
                                      provenance hash, in one reviewed commit, or the same item
                                      reopens tomorrow and every day after.
         "correct the record"      →  a repo edit (build_records → validate → verify → commit →
                                      deploy), because the knowledge base is code and must move
                                      through review like code
```

### Resolving as `no_change` must change something (wave-1b **B11**)

`refresh_sources.py` compares today's hash against the baseline in `kb-data/_sources.json`. If
resolving an item as `no_change` "closes it without touching any record", **the baseline still holds
yesterday's hash, the cron re-detects the identical drift tomorrow, and the queue cries wolf forever**
— on the item class the spec itself says will be the most common (a typo fix, a re-order, a
re-theme). `/admin/kb` would be abandoned in week one, which is the failure this spec predicts about a
*different* mechanism.

The opposite hazard is real too: rewriting the baseline alone breaks gate **G10**, which asserts that
every hash a record's `provenance.sources[]` claims is a hash the baseline actually measured. So the
two writes must happen together, atomically, as one action:

```
kb-scripts/accept_drift.py --source-id tx.tdlr.acr_renew [--note "…"] [--dry-run]

  1  re-fetch the source, normalise, hash                       [lib_kb, the same code as everywhere]
  2  write the new hash + a bounded head/tail of the normalised text into kb-data/_sources.json
  3  for every record whose provenance cites that source:
        - update that entry's content_sha256
        - bump nothing else: no value, no last_verified, no confidence is touched
        - append one line to kb-data/_history/{record_id}.jsonl recording old hash, new hash,
          the date, the resolver and the note                    [this is what ontology/id-grammar.md
                                                                  promises and nothing implemented]
  4  re-run validate.py; if it does not exit 0, revert every write and fail loudly
```

**One command, one commit, one review.** Not a hand-edit across nine files — a hand-edit across nine
files is how a hash gets missed and G10 fails a deploy three days later with no obvious cause.

`resolveDriftItem({ id, status: "no_change" })` therefore does not write the files itself (the runtime
never mutates the repo, invariant 4). It records the decision, and the queue item stays visibly
**`no_change — awaiting acceptance`** until a deploy lands whose baseline matches the detected hash,
at which point it closes automatically. **The screen shows that state explicitly**, with the exact
command to run, because an operator who thinks they have resolved something that is still open is
worse off than one who knows it is pending.

### Scoping G10 to what actually cites the source

Gate G10 currently walks `provenance.sources[]` and requires **every** listed source's hash to match
the baseline. It is tightened to the coupling that matters: a mismatch fails the build **only when the
record has at least one `SourcedValue` whose `source_url` belongs to that source**. A record that
lists a page in its provenance but hangs no value on it (a background page read during authoring, a
board index) no longer blocks a deploy when that page changes — because nothing we show the customer
came from it. Where a value *does* cite it, the gate is unchanged and unforgiving: that is the
coupling that keeps a citation printed on a $750 document honest.

The gate reports the difference rather than hiding it: a hash mismatch with no citing values is a
**warning** naming the source and the record, so it is still visible in the queue, just not
build-breaking.

## Screens

| route | contents |
|---|---|
| `/admin/kb` | Queue, ordered by affected organisations. Each row: source, when, how many records, how many customers, status. |
| `/admin/kb/:id` | Old vs new normalised text, word-level diff, the list of `SourcedValue`s whose `evidence` lives on that page, and whether each fragment is still present (a per-value re-run of pass B, live). |
| `/admin/kb/records` | All records: publishable, `last_verified` age, verified/unknown value counts, drift items open. |
| `/coverage` (public) | Generated from the current snapshot (M12). |

## Server actions / API

| action | notes |
|---|---|
| `GET /api/cron/kb-drift` | Secret-header authenticated. Idempotent per day per source. |
| `GET /api/cron/kb-reverify` | Monthly. Runs the pass-B logic in-process against the current snapshot. |
| `loadSnapshot({ version })` | Build-time. Refuses to flip `isCurrent` unless `validate.py` exited 0 and every record's `publishable` flag is present. |
| `getKbRecord({ state, trade })` | The only read path the product uses. Returns the current snapshot's record or `null`. |
| `resolveDriftItem({ id, status, note })` | Founder only. |

## Validation and invariants

1. **A snapshot cannot be published if `validate.py` fails.** The deploy fails, the old snapshot
   stays current. A knowledge base that violates its own schema must not be reachable.
2. **A value not re-checked in 180 days stops rendering as verified** (wave-1b **m15**, Q7). At read
   time `getKbRecord` computes `staleness = today - last_verified` per value; past **180 days** the
   value renders exactly as an `unverified` one does — UNVERIFIED badge, `needsHumanCheck` on any
   deadline derived from it, excluded from unqualified statements in a paid pack — with the board link
   beside it. The value is not deleted and the record does not become unpublishable; it stops being
   *asserted*. Gate **G13**'s 400-day build-breaking backstop in `kb-scripts/validate.py` stays as it
   is: 180 days is a runtime rendering rule, 400 days is "this should never have been committed".
   Monthly re-verification should keep everything under 35 days, so a value reaching 180 is itself the
   signal that re-verification has stopped running.
3. **A non-publishable record is invisible to the product.** `getKbRecord` filters on `publishable`;
   the picker, the derivation engine and the playbook generator all get `null` and all have a defined
   behaviour for `null` (specs 04, 05, 08).
4. **Deadlines pin their snapshot** (M5's `kbSnapshotId`), so publishing a new snapshot never silently
   rewrites history; re-derivation is explicit and produces a superseding row.
5. **Drift never edits data.** The cron's only write is a `kbDriftItem`, and the runtime never writes
   to the repo — `accept_drift.py` is run by a person and lands as a commit.
6. **`entryPackReady` is computed at load, alongside `publishable`, and stored** (`specs/08`). They
   are different questions — agreement versus completeness — and conflating them is what let a
   document with four unknown sections be advertised as complete.

## Acceptance criteria

1. A deploy with the committed `kb-data/` creates a snapshot with 9 records, 9 publishable, and flips
   `isCurrent` atomically.
2. A deliberately corrupted record fails the build; the previous snapshot remains current and serving.
3. Changing one byte of a mocked source page creates exactly one drift item naming the right records
   and the right customer count.
4. A source returning 403 for three consecutive days creates a drift item, not silence.
5. The drift item page shows which specific evidence fragments are no longer found.
6. **Resolving an item as `no_change` does not close it until the baseline moves.** The item shows
   `no_change — awaiting acceptance` with the command; after `accept_drift.py` has run and the deploy
   has landed, the next cron run finds the hashes equal and the item closes automatically. The
   regression test is the one this replaces: mock a source, change one byte, resolve `no_change`, run
   the cron again — **the wave-1 behaviour re-opens an identical item, and this test asserts it does
   not**.
6b. `accept_drift.py --dry-run` on a mocked source prints the baseline write and every citing record's
   provenance write, touches nothing, and `validate.py` still exits 0 afterwards. Run for real, the
   two writes land together and `validate.py` exits 0; with the record write suppressed, G10 fails —
   which is the proof the two halves are actually coupled.
6c. A source whose baseline hash changes and which **no value cites** produces a G10 **warning**, not
   a failure, and the record still deploys.
6d. `kb-data/_history/{record_id}.jsonl` gains exactly one line per record per acceptance, carrying
   the old hash, the new hash, the date, the resolver and the note.
7. `getKbRecord("OH","hvac")` returns null and every consumer degrades as its spec says.
8. The monthly re-verification of the committed records reports a 100% agreement rate against live
   sources (this is a live test and is *expected* to fail one day — that is the point).
9. A value whose `last_verified` is 181 days old renders with the UNVERIFIED badge and flips
   `needsHumanCheck` on every deadline derived from it, without any change to `kb-data/`.

## Edge cases

- **A board re-themes its whole site.** Every hash changes at once. The queue must group by host and
  offer "review this host's 8 pages together", or the founder abandons the queue on day one.
- **A page moves.** Old URL 404s, new URL unknown. Drift item of kind "source unreachable" with a note
  to find the new location; the record keeps serving from the snapshot and its `last_verified` ages
  visibly on `/admin/kb/records`.
- **A value changes but our reading does not** (typo fix, re-ordering). `no_change`, one click, note
  recorded. Most items will be this and the UI must make it a two-second action.
- **The change makes a value uncertain rather than wrong.** Demote to `unverified` in the next
  snapshot, which automatically flips `needsHumanCheck` on every derived deadline — the pipeline is
  already wired for it.
- **A customer reports the error before the cron does** (M11's data-quality report). Same queue,
  flagged as customer-reported, top of the list. **Every one of these is also a refund candidate on a
  playbook** (M8's guarantee), so the two systems are linked.
- **Rate limiting.** tdlr.texas.gov resets the connection under sequential load; the fetcher already
  does 1.5 s spacing and two attempts. Never parallelise the drift crawl.

## Errors

| condition | behaviour |
|---|---|
| Cron fails entirely | `/admin/health` goes red on "KB drift last run"; a KB that has stopped being checked must be loudly visible |
| Snapshot load fails mid-way | Transaction rolls back; previous snapshot stays current |
| A record's document fails JSON parse at runtime | That record is marked non-publishable in memory and an admin alert fires; the rest keep serving |

## Analytics events

`kb_snapshot_published` (version, record_count), `kb_drift_detected` (source, affected_records,
affected_orgs), `kb_drift_resolved` (status, hours_open), `kb_reverification_run` (agreement_rate),
`kb_record_unpublished`, `kb_source_unreachable`.

**`kb_drift_resolved.hours_open` is the operational metric that matters most in this product.** If it
grows, the knowledge base is rotting and the subscription's whole justification is going with it.
It belongs on `/admin/health`, not buried in an analytics page.

## Test plan

- **Integration:** snapshot load from the real `kb-data/`; corrupted-record build failure; atomic
  `isCurrent` flip under a concurrent read.
- **Integration:** mocked source server — unchanged, changed, 403, moved — asserting exactly one drift
  item each with the right affected sets.
- **Unit:** the normalisation function's stability against whitespace, entity and smart-quote changes
  (the exact classes that produced false disagreements in the first pass-B run — see
  `product/CLAUDE.md`).
- **Live test (nightly, allowed to fail loudly):** `refresh_sources.py` against the real boards.
  A failure here is information, not a broken build, and it is routed to the queue rather than to CI.
