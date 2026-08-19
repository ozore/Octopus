# Test coverage analysis — `app/`

Measured on branch `claude/test-coverage-analysis-k0urgq`, commit at time of
writing, with:

```bash
npm i -D @vitest/coverage-v8@3.2.4
npx vitest run --coverage.enabled --coverage.provider=v8 \
  --coverage.include='src/**' \
  --coverage.exclude='**/*.test.*' --coverage.exclude='src/lib/engine/evals/**'
```

The suite is green: **27 files, 347 tests, 0 failures, ~80s**, entirely offline
(mock adapters, PGlite, `fetch` hard-blocked in `vitest.setup.ts`).

## Headline numbers

| Metric | Covered / total | % |
|---|---|---|
| Statements | 6 776 / 9 249 | **73.3** |
| Branches | 1 208 / 1 515 | **79.7** |
| Functions | 425 / 530 | **80.2** |

The shape of that number matters more than the number. Coverage is not evenly
thin — it is **bimodal**. The engine and the pure domain layer are excellently
tested; everything at the *edges* of the process (HTTP handlers, server actions,
the worker entrypoint, live adapters, admin scripts) is close to zero.

| Layer | Stmts % | Read as |
|---|---|---|
| `src/lib/engine` | 95.3 | Exemplary |
| `src/lib/db` | 97.0 | Exemplary |
| `src/lib/billing` | 94.1 | Strong |
| `src/lib/corpus` | 90.9 | Strong, but see §2 |
| `src/components` | 93.3 | Strong |
| `src/lib/outcome-capture` | 84.5 | Good |
| `src/lib/email` | 81.5 | Good |
| `src/lib/db/repositories` | 73.2 | Patchy |
| `src/app/_lib` | 68.0 | **Weak — see §3** |
| `src/lib/adapters` | 32.2 | Mocks tested, live untested |
| `src/worker` | 21.7 | **Entrypoint untested** |
| `src/app/api/*` (3 of 4 routes) | 0 | **Untested — see §1** |
| `src/scripts` | 0 | Untested |

Biggest absolute holes, by uncovered statements:

| Uncovered stmts | % | File |
|---:|---:|---|
| 331 | 0 | `src/app/(app)/case/[caseId]/page.tsx` |
| 189 | 2 | `src/lib/adapters/anthropic.claude-cli.ts` |
| 181 | 1 | `src/lib/adapters/anthropic.live.ts` |
| 170 | 0 | `src/app/(app)/settings/monitoring/page.tsx` |
| 113 | 19 | `src/app/_lib/actions.ts` |
| 100 | 0 | `src/worker/index.ts` |
| 97 | 0 | `src/app/(app)/appeal/[caseId]/checkout/page.tsx` |
| 67 | 4 | `src/lib/adapters/stripe.live.ts` |
| 62 | 83 | `src/app/_lib/case-store.ts` |
| 54 | 0 | `src/app/(app)/appeal/[caseId]/page.tsx` |

---

## The proposals, in priority order

Priority is **risk × cheapness**, not coverage delta. Several of these buy very
little percentage and remove very real failure modes.

### 1. The three untested HTTP route handlers — start with the Stripe webhook

`src/app/api/stripe/webhook/route.ts` (0%), `src/app/api/inbound/email/route.ts`
(0%), `src/app/api/health/route.ts` (0%).

ADR-007 makes the webhook **the source of truth for payment**. The billing
*library* underneath it is 94% covered — but the boundary that decides whether
Stripe's retry machinery ever engages is not exercised at all. The route's own
docblock enumerates four behaviours that are invisible in its signature, and
**not one of them has a test**:

1. read the **raw body** before parsing (a `json()`+`stringify()` round-trip
   breaks every signature);
2. **400** on a bad signature, without touching the database;
3. **500, not 200**, on a fulfilment failure — because Stripe's 3-day retry
   schedule *is* the recovery mechanism for a customer who has already paid;
4. never echo the payload back to an unauthenticated caller.

That same file documents a bug already shipped in the sibling route: the
inbound-mail handler `500`'d where it meant to `400`, because Next compiles the
RSC and route-handler graphs separately and `instanceof` failed across the two
identities of one error class. The fix is an `error.name` fallback — **a
one-line guard with no test on either route**. This is a regression waiting to
recur, and it is worth noting that the failure mode of #3 is silently
abandoning a paying customer.

There is already a precedent to copy:
`src/app/api/appeal/[caseId]/stream/route.test.ts` calls a route handler
directly with a hand-built `Request`. Do the same here.

**Concretely:** ~12 tests. Valid signature → 200 + fulfilment; bad signature →
400 **and zero DB writes**; duplicate `event.id` → idempotent, single grant;
fulfilment throw → 500 with a status-word body; `WebhookVerificationError`
thrown as a *cross-graph* instance (name only, wrong prototype) → still 400;
unknown recipient on inbound mail → 404; `/health` returns the corpus release
and model ids it claims to.

### 2. Make the corpus gates non-vacuous

`src/lib/corpus/gates.ts` is 79% statements but **63% branches**, with 20
uncovered branches — and the uncovered branches are, almost without exception,
*the lines that emit a violation*.

`tests/corpus.test.ts` asserts each gate against the committed (clean) corpus:

```ts
it('G2 — every governed_by clause id resolves', () => {
  expect(gateG2(bundle)).toEqual([]);
});
```

A gate that returned `[]` unconditionally — because a rename broke a lookup, or
a `.filter()` inverted — passes that test. The suite already knows this: two
tests are explicitly written the other way (*"G6 catches a planted order id, so
the gate is not vacuous"*, *"the gate must fail on bad input, not merely pass on
good input"*). The technique is understood and was applied to **2 of 10 gates**.

**Concretely:** one planted-violation test each for **G2, G3, G4, G5, G7,
G8/G9, G11, G16 and `gateCoverage`** — 9 tests, each ~5 lines, following the
existing G6/G1 pattern. This is the highest confidence-per-line item on the
list. `corpus:check` is a blocking CI step; right now CI can only prove the
gates *ran*, not that they *work*.

The same reasoning applies at 55% branch coverage in `src/lib/corpus/ontology.ts`.

### 3. Server actions — `src/app/_lib/actions.ts` at 18.7%

This file is described in its own header as *"the only mutations the UI can
perform"*, and it states three product invariants that live in what it refuses
to do:

- **I4** — nothing here submits an appeal or accepts a marketplace credential.
- **I5** — no action promotes an escalated case into a drafted one (the slice is
  frozen for the life of the case).
- **ADR-007** — `recordCheckoutReturn` *reads* state, never grants it, so
  bookmarking the success URL cannot unlock a case.

Eleven exported actions; roughly two are exercised. The header also records a
past integration bug of exactly this class: the actions used to call the billing
adapter directly, skipping `billing/checkout.ts`, so no `payments` row was
created (the webhook had nothing to find) and `VALID_ORIGIN_STATUSES` was
bypassed, letting a case start Checkout **from any state at all**. Both were
architectural invariants with no test holding them down.

**Concretely:** call each action with a `FormData` against the PGlite fixture
already used by `tests/billing.test.ts`. Assert the *negative* invariants
directly — `recordCheckoutReturn` on an unpaid case leaves status unchanged;
`startCheckout` from an invalid origin status throws `InvalidCheckoutStateError`
and writes nothing; no action can move `escalated → document_ready` outside
`resolveCase`. ~15 tests. `src/app/_lib/runtime-env.ts` (22.7%) comes along for
the ride.

### 4. Golden-set coverage: the classifier is validated on 10 of 33 codes

`src/lib/engine/evals/golden-set.ts` is honest about this in its own header —
*"This slice covers 10 codes... `coverageComplete: false`... the blocking
full-coverage gate stays off until the remaining fixtures land. Reporting 10/33
as green would be worse than no gate."* That judgement is right, and the gap is
still the largest **product** risk in the suite:

- **8 of 27 Amazon codes** and **2 of 6 Walmart codes** have a golden fixture.
  Walmart is half the stated ICP and has 33% eval coverage.
- **23 reason codes have no end-to-end eval at all.** Classification is stage
  one; it selects the retrieved policy slice, so a misclassification is not a
  slightly-worse draft, it is a draft citing the wrong policy.
- **All 10 fixtures expect `kind: 'drafted'`**; exactly one expects an
  escalation (`refused_category`). The product's central safety promise — *low
  confidence escalates to a human, never guesses* — rests on one fixture.
- Of nine `EscalationReason` variants, **`zero_cited_clauses` appears in no
  test at all**, and it is the reason attached to the I2 failure path.

**Concretely:** this is the one item that is genuinely expensive (each fixture
needs an authored notice plus a recorded model response). Sequence it:
(a) the remaining **4 Walmart codes** first — worst ratio, smallest number;
(b) one fixture per **escalation reason** (cheap: they need no drafting leg);
(c) the remaining Amazon codes, tracked against the 33/33 gate the harness is
already built to enforce.

### 5. The worker entrypoint and job dispatch

`src/worker/index.ts` is **0%** (100 statements) — and it is one of the two
process types the product deploys. Untested: the claim loop, the `tick` batch,
the per-job `catch`, the SIGTERM/SIGINT disposability path (Twelve-Factor IX),
the backoff `sleep`. `src/lib/queue/registration.ts` is 0%,
`src/lib/outcome-capture/handlers.ts` is 0%, `src/lib/billing/handlers.ts` is
33% — so **job registration and dispatch are untested end to end**, even though
`src/lib/db/queue.ts` (the `FOR UPDATE SKIP LOCKED` machinery) is at 97%.

The gap is precisely: *does the thing that claims jobs actually route them to a
registered handler, and what happens when one throws?*

**Concretely:** export `tick` (already module-scoped) and drive it against
PGlite with a registered fake handler. Assert: a claimed job runs its handler; a
throwing handler marks the job failed/retryable without killing the loop; an
unregistered `JobKind` is a visible error, not a silent drop; SIGTERM stops
claiming and lets in-flight work finish. ~8 tests.

### 6. Live adapters: 1–10%, with no parity contract

`anthropic.live.ts` 1%, `stripe.live.ts` 4%, `resend.live.ts` 11%,
`anthropic.claude-cli.ts` 2% — against mocks at 87–98%.

Some of that is correct and by design: the offline rule is architectural and
`fetch` throws in the suite. But it means **the entire 347-test suite validates
behaviour against fakes that nothing checks for fidelity to the real thing.**
There is no shared contract suite run against both implementations, so the mock
and the live adapter can drift silently — and the mock is where every billing,
email and engine assertion actually lands.

Note also that **the "nightly live lane" does not exist.** It is referenced in
eleven places across `README.md`, `vitest.config.ts`, `vitest.setup.ts`,
`ARCHITECTURE.md` and four source files as the destination for anything needing
a key. `.github/workflows/` contains one file, `ci.yml`. This is the same class
of gap that `ci.yml`'s own header was written to document ("*the citation
invariant was enforced by a test that nothing ran*") — one level up.

**Concretely:** (a) extract a shared `describe`-block contract per adapter port
(`billing`, `mail`, `model`) asserting port semantics — idempotency,
error-type mapping, "no method accepts a PAN" — and run it against the mock in
CI and against the live adapter in the nightly lane; (b) test the *pure* parts
of the live adapters offline now — request shaping, error mapping,
`WebhookVerificationError` construction — which need no socket; (c) either
commit the nightly workflow or delete the eleven references to it.

### 7. Coverage is not measured or enforced anywhere

There is no coverage provider in `devDependencies`, no `test:coverage` script,
no thresholds, and no coverage step in `ci.yml`. Everything above had to be
measured by installing a provider ad hoc. A number nobody records cannot regress
visibly.

Related: **`npm run test:e2e` never runs in CI.** `e2e/journey.spec.ts` is the
only artifact that proves the product works end to end — S1→S8, real
`handleStripeWebhook` at the paywall — and nothing runs it automatically. It
needs no keys (`ADAPTER_MODE=mock DATABASE_DRIVER=pglite`), so the only cost is
minutes.

**Concretely:** add `@vitest/coverage-v8`, a `test:coverage` script, and a CI
step with thresholds set at **today's numbers** (73% stmts / 79% branch) as a
ratchet — not an aspiration — so the number can only go up. Add a Playwright job
to `ci.yml`, non-blocking at first.

### 8. Second tier — worth doing, lower urgency

- **`src/app/_lib/case-store.ts`** — 83% statements but **37 uncovered
  branches**, the most in the codebase. It is the read model that assembles a
  `CaseRecord`; the uncovered branches are the partial-data cases (a case with
  no draft, no classification, no payment). 670 lines, and the UI's entire view
  of a case flows through it.
- **Untested page components** — `case/[caseId]/page.tsx` (331 lines),
  `settings/monitoring/page.tsx` (254), `checkout/page.tsx` (97),
  `appeal/[caseId]/page.tsx` (54). Component-level testing is already
  well-established here (`AppealStream.test.tsx`, `ops.test.tsx`,
  `paywall.test.tsx`), so this is applying an existing pattern, not inventing
  one. `case/[caseId]/page.tsx` is the highest value: it renders the paid
  artifact.
- **Repositories at 0%** — `citation-uses.ts`, `corpus-slice-refs.ts`,
  `human-edits.ts`. `citation-uses` and `corpus-slice-refs` are the audit trail
  for which clause backed which claim, which is the evidence base for I2.
- **Branch-coverage pockets in otherwise-green files** —
  `engine/config.ts` (37.5% branch, 100% stmts — the config *variants* are never
  taken), `outcome-capture/reports.ts` (37.5%), `email/handlers.ts` (45.8%),
  `repositories/payments.ts` (50%), `billing/fulfillment.ts` (65%).
  100% statements with 37% branches is the most misleading state in the report.
- **`src/lib/engine/pipeline.ts` lines 148–158** — the *failed revision inside
  the critique loop* path: a failed revision must not discard a draft that
  already passed the render boundary, so the seller keeps the better artifact.
  Documented, deliberate, subtle, untested.
- **`src/lib/email/send.ts` at 50.6%** — the D3/D10/D21 outcome sequence
  scheduler.

---

## What is already good, and should be the template

Worth stating explicitly, because the gaps above are gaps *relative to a high
bar set inside this same repo*:

- **`tests/case-state-machine.test.ts`** is the model to copy. It does not test
  a handful of transitions; it asserts that *every declared edge is reachable
  from `intake`*, that *every non-declared `(from, to)` pair throws*, that
  self-transitions are illegal for every status, and that a concurrent
  double-transition cannot corrupt a row. That is property-style exhaustiveness
  over an enumerable domain, and it is exactly what §2 (gates) and §4
  (escalation reasons) need.
- **`citations.invariant.test.ts`** and **`golden-set.test.ts`** run as their
  own named CI steps rather than only inside `npm test`, so "did the invariant
  run" is answerable from the job summary. Good instinct; extend it.
- **The offline guarantee is a mechanism, not a rule** — `vitest.setup.ts`
  replaces `fetch` with a throw that names the file and the URL. Few codebases
  do this.

## Suggested order of work

| # | Item | Est. tests | Cost | Risk removed |
|---|---|---|---|---|
| 1 | Corpus gates non-vacuous (§2) | 9 | XS | High — a blocking gate that may not work |
| 2 | Stripe webhook + inbound routes (§1) | 12 | S | High — payment truth, known recurring bug |
| 3 | Coverage tooling + ratchet + e2e in CI (§7) | — | S | Medium — regression visibility |
| 4 | Server actions (§3) | 15 | M | High — I4/I5/ADR-007 unheld |
| 5 | Worker tick + job dispatch (§5) | 8 | M | High — one of two process types |
| 6 | Escalation-reason fixtures (§4b) | 8 | M | High — the safety promise |
| 7 | Adapter port contract suite (§6) | 10 | M | Medium — mock/live drift |
| 8 | Remaining golden-set fixtures (§4a, §4c) | 23 | L | High, but properly a roadmap item |

Items 1–3 are a day's work and remove two of the three highest risks.
