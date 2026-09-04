# `apps/stateready` — working memory

**Scope:** `apps/stateready/` only, plus the two StateReady steps in
`.github/workflows/ci.yml` and the root lockfile. Owner: Lead Builder, phase-4
wave 2, sub-wave A. Started and delivered 2026-09-03.

**Read `BUILD.md` first if you are picking up a module.** This file is the
memory: what is true, what tripped me up, and what I would tell the next agent
before they open an editor.

---

## Rules confirmed (from `PLAN.md`, `PIPELINE.md`, the specs and the brief)

- **Never estimate a fee, an hour count or a processing time.** Unknown renders
  as "not yet verified" with what we read and the board's link — `NotYetVerified`
  in `src/components/provenance.tsx`. This is the product, not a nicety.
- **Every rendered rule carries its provenance line** (`UX.md` C4) and **the
  disclaimer appears on every screen** (C7 — it is in the `(app)` layout and on
  every marketing page, so it is structural rather than remembered).
- **No blue anywhere, at any weight.** Two colour families only: the graphite
  board and the readiness ramp. `tests/app.test.ts` checks every hex in the app's
  own source.
- **One status vocabulary: READY / AT RISK / LAPSED / NOT TRACKED**, in caps,
  everywhere, never colour alone. Hollow-dashed "not in your footprint" is a
  rendering, not a fifth status, and carries no status word.
- **AT RISK = 90 days = `ALERT_OFFSETS[0]`**, asserted by a test. The map and the
  first alert gate can never disagree (D7).
- **Board is the default theme; paper is what leaves the building** — print, the
  PDF, the shared link, the technician card, every email
  (`IDENTITY_ARBITRATION.md` §3.2).
- Do not touch `packages/platform`, `app/`, `apps/wagelens`, `apps/certly`,
  `apps/_template` or `phase-4-revenue/`. Platform requests go in `BUILD.md`.
- No secret in the repo; no live network in tests; never run `playwright install`
  (browsers are preinstalled at `/opt/pw-browsers`).
- No commits, no pushes.

---

## The three decisions worth arguing with

### 1. The knowledge base is COPIED into the app, not read from `phase-4-revenue/`

`apps/stateready/kb/` holds `kb-data/` and `ontology/`; `src/styles/design-system.css`
holds the identity file. `src/lib/kb/records.ts` imports them as JSON modules.

Two reasons, in the order that decided it:

1. **Deployability.** Vercel builds with Root Directory `apps/stateready`. Files
   outside it exist in the build container but are **not traced into a serverless
   bundle** — Next traces the module graph, and a runtime
   `readFile('../../phase-4-revenue/…')` reaches nothing. A static import is
   traced, bundled and typed.
2. **Reproducibility.** A snapshot is a statement about the world on a date
   (`specs/14`). What the app serves must move only when the app deploys.

**The copy is kept honest by a check that runs in CI**: `tests/kb-copy.test.ts`
byte-compares every file in both directions and names any divergence;
`npm run kb:check` is the same comparison from the command line. It fired for
real during this build — the knowledge-base fleet landed `expiry_overrides` in
the ontology and back-filled the `_sources.json` excerpts while I was working,
and the test caught it within the hour.

### 2. Fail-closed is evaluated over the GOVERNING SET, not per value

`specs/05` invariant 2 says *"a value with `confidence != high` and no `note`
sets `needsHumanCheck = true`"*, per value. Applied per value it is
**unsatisfiable against the committed data**: a renewal under the `anniversary`
token is governed by two values (the token and the cycle), `tx-plumbing` has
both at `verified`/`medium`, and only the cycle carries the note — so AC7's
`needsHumanCheck = false` for licence type [0] could never hold.

`judgeGoverning` in `src/lib/rules/assess.ts` therefore asks the question at the
level of the derived date: *is the date explained by any of the non-high values
that produced it?* AC7 and AC7b both hold, and the meaning is the one the spec
argues for. **One line reverses it** — see `BUILD.md` §Spec deviations.

### 3. The CE window and the classroom fraction are read from TOKENS, never prose

`specs/05` AC2 wants North Carolina electrical's CE window as 1 July – 30 June.
The record carries that **only in a prose `note`**. Turning prose into a date is
the exact inference this product refuses, so the engine implements
`calendar_window:MM-DD` and the knowledge base has to carry it. Same for
"at least half the hours in a classroom": the sentence renders verbatim beside
the meter and a classroom shortfall is computed only from a
`min_classroom_fraction:` token. Both are knowledge-base requests in `BUILD.md`,
and both have tests that start passing on their own the day the token lands.

---

## What tripped me up — read this before touching the KB runtime

1. **Cross-language hash parity is a real hazard and it had a real bug.** The
   drift baseline was computed by Python; the app computes it in TypeScript. A
   naive port of `lib_kb._VOLATILE`'s `Next Board Meeting.{0,80}` used
   `[\s\S]{0,80}`, but the Python pattern is **not dot-all**, so `.` stops at a
   newline. That one character put **every one of the ten TSBPE pages 80 bytes
   short**, which would have shown as ten drifted sources on day one and taught
   the founder to ignore the queue. Found by running both implementations over
   the 59 captured board pages in `phase-4-revenue/stateready/research/raw/`:
   **59 of 59 byte-identical after the fix.** `tests/kb-normalise.test.ts` keeps
   thirteen construct-level fixtures generated by the Python.
   **If you touch `normalise.ts`, re-run that comparison.** The scratch script is
   twenty lines: gunzip each capture, normalise in both, compare hashes.
2. **A drift item that "cries wolf" is the failure mode, not a false alarm.**
   `drift.ts` distinguishes a genuine content change from a normalisation-parity
   difference by comparing the stored head and tail excerpts. Identical excerpts
   with a different hash is a parity signal and the item says so.
3. **Gates must not run on a schema-invalid record.** They assume the shape the
   schema guarantees, so a record missing `boards` turned a legible schema error
   into a `TypeError` from inside G6. `validateRecord` now runs gates only when
   the schema passed, with a try/catch behind that.
4. **`loadSnapshot` validated the wrong thing.** It called
   `assertKnowledgeBaseValid(today)` — which validates the *committed* records —
   while inserting `options.records`. A caller passing a corrupted record got a
   published snapshot and a green assertion. Validate what you are loading.
5. **Drizzle wraps Postgres errors**, so a constraint name lives on `error.cause`,
   not on `error.message`. `expect(...).rejects.toThrow(/constraint_name/)` passes
   for the wrong reason; walk the cause chain (`tests/schema.test.ts`).
6. **A prefilled sample in a textarea is a roster waiting to be imported as if it
   were theirs.** The import template is a `placeholder` now. It also made the
   Playwright spec non-deterministic, which is how I noticed.
7. **A grep-based content test must strip comments**, or the codebase cannot
   explain why a thing is forbidden without failing the test that forbids it.
8. **Playwright's `expect` timeout is 30s, not the template's 15s, and the
   reason is real.** `next dev` compiles each route on first navigation and the
   journey visits nine of them; run immediately after a production
   `npm run build` — which invalidates the dev cache — the first `toHaveURL`
   after a redirect outlasted a 15s expect while the route was still compiling.
   It failed once on exactly that sequence and has passed on every warm and cold
   run since. If you see a `toHaveURL` timeout, check whether the route was
   simply still compiling before you go looking for a product bug.
9. **`@vercel/blob` is not a dependency of this workspace.** `BlobDocumentStore`
   builds the specifier at runtime with `/* webpackIgnore: true */`, so `tsc`,
   `next build` and CI never try to resolve it, and live mode fails loudly at
   first use if it is genuinely absent.

---

## Commands

```bash
npm run typecheck --workspace apps/stateready
npm test --workspace apps/stateready            # 290 tests, PGlite, no network
npm run build --workspace apps/stateready
npm run kb:check --workspace apps/stateready    # the copy equality check, standalone

cd apps/stateready && PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test

# The authoritative knowledge-base scripts stay in Python and are OPS COMMANDS.
# They are never on a request path (there is no Python on Vercel).
python3 phase-4-revenue/stateready/kb-scripts/validate.py
python3 phase-4-revenue/stateready/kb-scripts/refresh_sources.py      # live network
python3 phase-4-revenue/stateready/kb-scripts/accept_drift.py --source-id <id>
```

---

## Advice to the next agent

- **Start from `BUILD.md`'s module map.** It says which directories you own,
  which shared pieces you must not edit, and what "done" means for your module.
- **The rules engine is pure and it must stay pure.** No clock, no I/O, no
  `Date.now()` inside `src/lib/rules/`. Everything that touches a database lives
  in `src/lib/repos/`. That seam is what lets the 69-case golden set run with no
  schema at all, and it is the reason a wrong deadline is reproducible from two
  JSON blobs in a bug report.
- **Write the golden expectation from the spec, not from a run.** The golden test
  checks the engine against the committed fixture AND the fixture against an
  independent twenty-line reading of `specs/05`'s rule table. One implementation
  agreeing with a recording of itself proves nothing.
- **Regenerate the golden fixture only when you meant to.** If a knowledge-base
  change moves a date, the golden test failing is the news.
- **Do not add a third place where a status word is written.** `STATUSES`,
  `STATUS_TOKEN` and `STATUS_GLYPH` in `src/lib/repos/dashboard.ts` are the only
  ones, and a test greps for colour names used as statuses.
- **`apps/stateready/kb/` is a copy. Never hand-edit it.** Change
  `phase-4-revenue/stateready/`, re-copy, re-run `validate.py` and let the golden
  tests tell you what moved.
