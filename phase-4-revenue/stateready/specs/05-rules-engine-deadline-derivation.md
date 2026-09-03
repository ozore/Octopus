# M5 — Rules engine: deriving renewal and CE deadlines from the knowledge base

**Status:** spec, wave 1. **Effort:** L (~4–6 dev-days). **Depends on:** M14. **Blocks:** M4, M6, M7, M8.
**This is the product.** Everything else is a shell around it.

## Story

> As the office manager, I want the product to tell me a deadline I did not know I had. If it only
> reminds me of dates I typed in, it is a spreadsheet with a nicer font and I will stop paying for it
> in month two.

Three concrete deliveries of that promise, all from the nine records already in `kb-data/`:

1. "Your North Carolina electrical licence renews on its own anniversary, but your North Carolina
   plumbing licence expires on 31 December like every other one in the state — and there is no grace
   period." (Same state, two boards, two algorithms.)
2. "Your Florida certified licence renews 31 August 2026; the registered one you got with the
   acquisition renews 31 August 2027." (Even vs odd year, decided by a letter in the licence code.)
3. "Your Texas electrical **contractor** licence needs no CE — but the Master Electrician you have
   named on it needs 4 hours, and if he lapses so does the contractor licence."

## The derivation model

A licence's deadlines are a pure function of four inputs:

```
derive(licence, kbLicenceType, today) -> {
  renewal:  { dueOn, source: "derived"|"entered", rule, citation, confidence, needsHumanCheck },
  ce:       { dueOn, hoursRequired, hoursOutstanding, subjectShortfall[], citation, ... },
  events:   [ { kind, dueOn, citation } ]      // e.g. Texas 30-business-day qualifier replacement
}
```

Pure, synchronous, no I/O. The KB record is passed in. That makes the whole thing table-testable
against `kb-data/` and means a wrong deadline is reproducible from two JSON blobs in a bug report.

### Renewal rules implemented at launch

The `expiry_rule` token in the knowledge base (`ontology/schema.state_trade_record.json`) is a small
closed vocabulary, and gate **G8** in `kb-scripts/validate.py` fails the build if a record uses a
token the engine does not implement. Three exist today:

| token | meaning | example | derivation |
|---|---|---|---|
| `anniversary` | expires N months after issue | TX ACR, TX electrical, NC electrical | `issuedOn + cycle months`, clamped to month end |
| `fixed_date:MM-DD` | everyone in the state expires the same day | NC plumbing/heating (31 Dec, G.S. 87-22) | next occurrence of MM-DD strictly after `issuedOn` |
| `fixed_date_parity:MM-DD:even\|odd` | fixed date, but only in even or odd years | FL certified (31 Aug even), FL registered (31 Aug odd) | next MM-DD after `issuedOn` whose year has the right parity |

A fourth, `fixed_date_offset` (states that renew on the licensee's birth month), will be needed as we
widen; it is deliberately **not** implemented, because implementing an unused rule is how the
vocabulary silently diverges from the data.

#### Board-announced date rolls — `expiry_overrides` (wave-1b **M13**)

A token is a rule; a board sometimes announces an exception to its own rule for one cycle.
`www2.myfloridalicense.com/construction-industry/`, fetched 2026-09-03, reads:

> *"Registered Contractors — Licenses expire August 31st every odd year. However, because the 31st
> falls on a Sunday this year, and September 1st is a holiday, the deadline has been extended to
> September 2nd."*

`fixed_date_parity:08-31:odd` derives 31 August. For that cycle the derived date is two days early —
in the customer's favour this time, and eventually in the other direction. The engine therefore takes
an override list per licence type:

```jsonc
"expiry_overrides": [
  { "cycle_year": 2027, "date": "2027-09-02",
    "source_url": "https://www2.myfloridalicense.com/construction-industry/",
    "evidence": "the deadline has been extended to September 2nd",
    "last_verified": "2026-09-03", "verified_by": ["pass-a","pass-b"] }
]
```

**Rule: an override for the derived cycle year wins over the token**, and the derived deadline carries
the override's citation rather than the token's, with one sentence of explanation in the "why this
date?" trace: *"Florida's rule puts this on 31 August 2027; the board has published an extension to
2 September 2027."* An override never invents a date, never applies outside its `cycle_year`, and is a
`SourcedValue`-shaped object so it goes through the same two-pass verification as everything else.

**Schema and gate work this requires, and which this iteration did not do** (`ontology/` was outside
the iteration's edit scope — see `REVIEW_RESPONSE.md` M13): add `expiry_overrides` as an optional
array on `licence_types[]` in `ontology/schema.state_trade_record.json` (which is
`additionalProperties: false`, so a wave-2 record cannot carry the field until this lands), and extend
gate **G8** in `kb-scripts/validate.py` to assert that every override's `date` is a real date inside
its `cycle_year` and that the licence type's `expiry_rule` token is one the engine implements. Until
both land, an override is unrepresentable and this rule is dormant — the engine implements it, the
data cannot yet express it. **This is the first schema change wave 2 should make**; it is also the
best worked example the rule-change alert (J8) will ever get.

### CE rules implemented at launch

```
required        : boolean            e.g. TX electrical contractor = false, and that false is a
                                     verified fact from the board, not a gap
hours           : number             8 (TX ACR), 4 (TX electrician), 6 (TX plumbing),
                                     14 (FL CILB), 11 (FL electrical), 8 or 4 (NC electrical),
                                     0 (NC plumbing/heating — abolished 2012)
period          : months, and whether it is tied to the licence term or a calendar window
                  (NCBEEC's CE period is 1 July – 30 June, which is NOT the licence anniversary:
                   two different twelve-month windows on the same licence)
subject_breakdown: [{hours, subject}]  Florida's 14 hours are six mandates. Counting to 14 is wrong.
delivery_constraint: NC electrical requires at least half the hours in a live classroom.
carryover       : NC electrical allows surplus hours into the next one or two periods.
```

`hoursOutstanding` is therefore not `required - recorded`. It is computed per subject, then per
delivery mode, then totalled — and the UI shows the shortfall by subject, because "you need 3 more
hours" and "you need 1 hour of workers' compensation and 2 technical" are different instructions.

### Event deadlines

Not every deadline is a renewal. The KB carries `business_entity.change_notification_deadline`, and
Texas electrical's is **30 business days from the qualifier's departure**. The engine emits these as
`events` with a trigger other than a date on a licence, which is why alerts (M6) are modelled against
a generic `deadline` row rather than against `licences.expires_on`.

## Data model

```ts
export const deadlines = pgTable("deadlines", {
  id:              uuid("id").primaryKey().defaultRandom(),
  organisationId:  uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  licenceId:       uuid("licence_id").references(() => licences.id, { onDelete: "cascade" }),
  kind:            text("kind", { enum: ["renewal","ce","bond","insurance","qualifier_replacement","other"] }).notNull(),
  dueOn:           date("due_on").notNull(),
  source:          text("source", { enum: ["derived","entered"] }).notNull(),
  rule:            text("rule"),                       // the expiry_rule token used
  kbRecordId:      text("kb_record_id"),               // "tx.hvac"
  kbSnapshotId:    uuid("kb_snapshot_id").references(() => kbSnapshots.id),   // see M14
  citationUrl:     text("citation_url"),
  citationText:    text("citation_text"),              // the <=25-word evidence fragment
  confidence:      text("confidence", { enum: ["high","medium","low"] }),
  needsHumanCheck: boolean("needs_human_check").notNull().default(false),
  detail:          jsonb("detail"),                    // hours outstanding, subject shortfall, …
  supersededAt:    timestamp("superseded_at", { withTimezone: true }),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byOrgDue: index().on(t.organisationId, t.dueOn), byLicence: index().on(t.licenceId) }));
```

Deadlines are **immutable and superseded, never updated in place**, and each carries the KB snapshot
it was derived from. When a customer says "you told me 4 June", we can show them what we knew, when,
and from which version of which page. This is the same discipline as `CORPUS_DESIGN.md` §2.3.

## Server actions / API

| action | notes |
|---|---|
| `deriveForLicence(licenceId)` | Loads the licence and the pinned KB snapshot, runs the pure function, supersedes changed deadlines, inserts new ones, returns the diff. |
| `deriveForOrganisation(orgId)` | Batched version, used after a profile change or a KB publish. |
| `explainDeadline(deadlineId)` | Returns the full derivation trace for the UI's "why this date?" panel: rule token, inputs, arithmetic, citation, confidence. |

A nightly cron job (A12) re-derives every organisation's deadlines, because `fixed_date` rules roll
over and because a KB publish must reach existing licences.

## Validation and invariants

1. **No deadline without a citation.** A `deadlines` row with `source = derived` and a null
   `citationUrl` fails a DB check constraint. This is the structural version of "sources are opened,
   not remembered".
2. **What forces the flag, and what does not.** `needsHumanCheck = true` when the governing KB value
   has `confidence = "low"` **or** `status != "verified"`. A **medium-confidence verified** value is
   allowed through and produces a normal deadline — it is a reading the board's own page supports with
   one inference, not a guess — **but it is never allowed to appear bare**:

   | governing value | deadline emitted | `needsHumanCheck` | how it renders |
   |---|---|---|---|
   | `verified` + `high` | yes | `false` | date + citation |
   | `verified` + `medium`, with a note | yes | **`false`** | date + citation **+ the value's `note`, wherever the date appears** — dashboard card, "why this date?" panel, alert email, PDF export. In a **paid Entry Pack** the same value renders inside the needs-human-check block (`specs/08`, and `ontology/schema.sourced_value.json`: *"Anything below high forces needs_human_check on any expansion playbook that uses it"*). |
   | `verified` + `medium`, **no note** | yes | **`true`** | flagged — fail closed, see below |
   | `verified` + `low` | yes | `true` | flagged everywhere |
   | `unverified` (any confidence) | yes | `true` | flagged everywhere, UNVERIFIED badge |
   | `unknown` (null) | **no** — invariant 3 | – | "we could not derive this", with what we read |

   **Fail closed when the note is missing.** The medium-confidence path above depends entirely on the
   value carrying a `note` — and today it sometimes does not: `tx-plumbing` licence types **[1] and [2]**
   carry `renewal.cycle = 12, confidence: medium, note: null`, while only [0] explains the inference
   (wave-1b **m5**). Gate G3 requires a note only for *non-verified* numerics, so those two passed.
   **So the rule is: a value with `confidence != "high"` and no `note` sets `needsHumanCheck = true`.**
   A medium reading we cannot explain is not a medium reading, it is an unexplained one, and the
   customer gets the flag rather than a confident date with nothing behind it. Two consequences, both
   wanted: the two Texas plumbing licence types flag until someone writes their note, and the incentive
   points at fixing the data rather than at loosening the renderer. **Wave 2 should also extend G3 in
   `kb-scripts/validate.py` — "any numeric below `confidence: high` requires a note" — so the build
   catches it before the renderer has to.**

   **Two fields, one honesty rule: no component may key on `status` alone.** `deadlines.confidence`
   and `deadlines.needsHumanCheck` are both carried on the row (see the data model) and the render
   helper takes both. This is the data-side of the same problem `KNOWLEDGE_BASE.md` §10 assumption 1
   records: Texas plumbing's annual cycle is `verified` because two passes agreed at the source, and
   `medium` because the board never prints the word "annual". `verified` is a statement about our
   process; `confidence` is a statement about the page. A build that reads only the first will show an
   inference as a fact.

   *Reviewer's note, recorded because this reverses a recommendation:* the wave-1b review (**B6**)
   proposed `confidence != "high" OR status != "verified"`, which would flag every medium value. That
   was rejected in iteration because it puts **six of the nine launch records' Texas plumbing and NC
   fee values** behind a warning the customer cannot act on, and a flag that fires on a third of the
   product stops being read. The note-everywhere rule above is the narrower instrument for the same
   risk. See `REVIEW_RESPONSE.md` B6.
3. **Unknown means silent.** A KB value of `null` produces **no deadline at all**, never a guessed
   one. The licence shows "we cannot derive this — here is what we read and why we could not".
4. Derivation is deterministic: same inputs, same output, asserted by a golden-file test.

## Acceptance criteria

1. TX ACR Class A issued 2026-03-14 → renewal 2027-03-14, CE 8 hours due 2027-03-14, citation is the
   TDLR sentence and URL, confidence high.
2. NC electrical Unlimited issued 2026-03-14 → renewal 2027-03-14 (anniversary), CE 8 hours, of which
   at least 4 must be classroom, CE period 2026-07-01 → 2027-06-30 — a *different* window from the
   renewal year, and both are shown.
3. NC plumbing contractor issued 2026-03-14 → renewal 2026-12-31, grace period 0 days, CE **not
   required** with the board's 2012 abolition quoted.
4. FL certified plumbing issued 2026-03-14 → renewal 2026-08-31; the same licence issued 2026-09-01 →
   renewal 2028-08-31 (next even year), not 2027.
5. FL certified HVAC with 14 CE hours all in "general" → still shows a shortfall, itemised by the
   five mandated subjects.
6. TX electrical contractor → **no CE deadline**, with the board's sentence quoted so the customer can
   see it is a finding and not a gap; the linked Master Electrician licence → 4-hour CE deadline.
7. TX plumbing anything → deadline emitted with **`needsHumanCheck = false`** and
   `confidence = "medium"` (the cycle is `status: verified`, `confidence: medium` in
   `kb-data/tx-plumbing.json`), **and the rendered output carries the value's `note`** — "TSBPE never
   prints the word annual; inferred from the yearly CPE requirement and the late-renewal day bands" —
   in the deadline card, the "why this date?" panel and the alert email. The same value inside an
   Entry Pack renders in the needs-human-check block (`specs/08` AC2). A test asserts both halves: the
   flag is false **and** the note is present in all four renderings.
7b. **`tx-plumbing` licence types [1] and [2] — same medium cycle, `note: null` — emit
   `needsHumanCheck = true`.** Same record, same field, different outcome, decided by whether we can
   explain ourselves. The test reads the committed records rather than a fixture, so it starts passing
   on its own the day someone writes those two notes.
8. A licence in an uncovered state produces zero deadlines and one explanatory record.

## Edge cases

- **Leap day.** A licence issued 29 Feb 2028 on a 12-month anniversary rule expires 28 Feb 2029.
  Explicit test.
- **Month-end clamping.** 31 January + 1 month = 28/29 February, not 3 March.
- **Time zones.** All licence dates are civil dates (`date`, no time zone). Alerts are computed in the
  organisation's time zone, defaulting to `America/Chicago`. Deriving a deadline in UTC and alerting
  in local time is how a "7-day" alert becomes a 6-day alert.
- **Issue date missing.** Fixed-date rules still work (next 31 December); anniversary rules cannot.
  Say so, ask for the issue date, do not guess.
- **The KB changes between derivation and renewal.** Superseded rows plus the snapshot pin mean the
  old deadline is auditable and the new one is visibly new, with a "this changed on 3 October, here
  is what changed" note. This is the moment the customer either trusts us more or leaves.
- **A licence whose KB type was removed** (a board discontinues a class). The pinned snapshot keeps
  deriving; the record is flagged for the drift queue.
- **Florida's `+$50 per qualified business`.** Cost, not a deadline — surfaced in the renewal detail
  so the customer budgets correctly, and marked medium confidence.

## Errors

Derivation never throws to the user. A failure produces a deadline-less licence plus an internal
`derivation_failed` event with the record id, the rule token and the input; the UI says "we could not
work this out — we have flagged it" and the admin queue picks it up. A wrong date is worse than no
date, and both are worse than a date the customer knows is missing.

## Analytics events

`licence_deadline_derived` (kind, rule, confidence, needs_human_check) — **the activation event**
(`THRESHOLDS.md` T1, `specs/13`), and it is emitted **here, from the derivation service**, not from
the licence-create path in `specs/04`. Every route into derivation (create, CSV import, profile
change, KB publish, the nightly cron) therefore counts, which is the whole point: an import that
derives 40 deadlines is an activation, and under the old `deadline_derived` / `licence_deadline_derived`
split it was not counted at all.

Also: `deadline_superseded`, `derivation_failed`, `deadline_explained` (the "why this date?" panel
opened — a strong trust signal and one worth watching against retention; this is the single name for
that event, replacing `specs/11`'s `why_this_date_opened`), `ce_shortfall_shown`.

## Test plan

- **Golden-file tests** over the real `kb-data/` records: a fixture licence per (state, trade,
  licence type) × three issue dates (start, middle, end of year), with the expected deadline set
  committed. 9 records × ~2 licence types × 3 dates ≈ 60 cases. These fail when the KB changes, which
  is exactly what should happen.
- **Unit:** each rule token in isolation, including leap day, month-end and parity boundaries.
- **Unit:** the CE subject-shortfall calculator, including Florida's six mandates and NC's classroom
  floor and carry-over.
- **Property:** derivation is idempotent — running it twice supersedes nothing the second time.
- **Integration:** a KB publish re-derives and supersedes across an organisation with 200 licences.
- **Negative:** a record with a `null` cycle produces no deadline and one explanation, never a date.
