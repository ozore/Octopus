# `apps/certly` — working memory

**Agent:** sub-wave A Lead Builder (wave 2, Certly fleet). **Date:** 2026-09-03.
**Scope:** the foundation every other Certly agent builds on. Read `BUILD.md`
for the module map; this file is what I learned making it.

---

## Rules confirmed — do not re-litigate

- Write only under `apps/certly/`, the `workspaces` job in
  `.github/workflows/ci.yml`, and the root lockfile when a dependency is added.
- `packages/platform`, `app/`, `apps/wagelens`, `apps/_template` and
  `phase-4-revenue/` are **read-only**. Platform changes go in BUILD.md §4 as
  requests.
- Build against the `--c-*` tokens only. No literal colour in app CSS; a test
  enforces it.
- No live network in tests. The Anthropic adapter is not part of sub-wave A.
- Banned in copy: **verified**, **compliant**, **covered** (as a status). The
  green word is **"Meets requirements"**; the engine value is `meets`.
- No secret in the repo. Env NAMES only.
- Two attempts per blocking problem, then the simplest working alternative,
  recorded here and in BUILD.md. Never ask a human.

## What is authoritative, when documents disagree

This mattered several times, so it is worth writing down as an order:

1. **`design-system.css` is the build reference for anything visual**, not
   `IDENTITY.md` §6. The reviewer said so explicitly (REVIEW.md §4.1) and
   `identity/contrast.py` certifies the CSS, not the prose.
2. **`IDENTITY.md`'s Arbitration section and §4.2 beat its body.** The body lags
   its own rulings — eleven open findings at sign-off, including §7.1 still
   naming a Google Fonts CDN link that `LANDING_SPEC.md` §10 forbids.
3. **`specs/*` beat `UX.md` and `IDENTITY.md` on behaviour**; `KNOWLEDGE_BASE.md`
   §F beats everything on disclaimer text.
4. Where a spec and `REVIEW.md` disagree, the review's ruling won — it is the
   later document and the specs were signed with it.

## What worked

- **Building M5 first was right, and for a reason I did not expect.** The
  product-owner's argument was that the engine defines what extraction must get
  right. The bigger payoff was that writing the golden tests FROM `specs/05` §8
  before the code turned four acceptance criteria into questions the spec had
  not quite answered (see A5 below), and each one was cheaper to settle in an
  afternoon than after the extractor existed.
- **Writing the tests from the spec's exact sentences.** A1 and A3 publish
  verbatim explanation strings, so the tests assert them verbatim. A sentence a
  customer forwards to their owner is part of the contract.
- **Making every rule a test rather than a convention.** The disclaimer grep,
  the "covered" grep, the domain grep, the engine's purity scan, the
  design-system equality check. Each is a source scan, because the failure mode
  is a string typed into a new file that nobody thought to test.
- **PGlite with the real committed migrations.** Every CHECK constraint the
  specs asked for is exercised against real Postgres — including the
  `extractions` one-owner constraint, which the review spent a whole finding on
  and which no unit test could have proved.
- **A fixture builder for the engine tests.** A hand-written `coi.v1` payload is
  200 lines of five-key value objects. `tests/engine/fixtures.ts` made the rule
  tables readable, which is why there are 94 of them.

## What failed, and what to do instead

1. **`ERR_TOO_MANY_REDIRECTS`, and an hour to find it.** My middleware defaulted
   `SESSION_COOKIE_NAME` to `certly_session`; the platform defaults to
   `octopus_session`. With the variable unset, the middleware saw no cookie and
   redirected to `/login`, `/login` saw a live session and redirected to
   `/dashboard`. **Nothing appeared in any log.** The middleware now defaults to
   the platform's value with the reason written above the line, and Playwright
   sets a distinct name so the agreeing path is the one exercised. Recorded as
   platform request PR-5.
2. **The Next.js dev overlay ate the Sign out button.** The dev indicator is a
   fixed portal in the bottom-left, which is exactly where a 240px left nav puts
   its account block. Playwright retried the click 182 times, logging "element
   is visible, enabled and stable" each time. `devIndicators: false` under
   `E2E=1` only — a developer keeps the indicator, the test stops fighting it.
3. **A lazy regex against a JSON Schema.** `kb:check`'s form-edition gate matched
   `"form_edition"` in the top-level `required` ARRAY and then took the next
   `"enum"` it found, which belonged to `document_kind` — so a gate that exists
   to catch a real drift reported all four editions missing on its first run.
   Parse the JSON; do not grep it.
4. **Drizzle hides the constraint name.** A rejected write throws
   `Failed query: …` and puts the real message on `error.cause`. Asserting on
   the wrapper passes for ANY failure, which is the opposite of what a
   constraint test is for. `tests/repos.test.ts` has `expectRefusedBy`, which
   walks the cause chain.
5. **`vitest --root` matters.** Running from the repo root without it picks up
   the root config and finds nothing. Always `--root apps/certly`, or `npm test
   --workspace apps/certly`.

## Decisions I took where the documents left a choice

| # | Decision | Why |
|---|---|---|
| 1 | **Self-hosted font FILES, not `next/font/google`** | `LANDING_SPEC.md` §10 says "self-hosted via `next/font`", and `next/font/google` self-hosts — but it DOWNLOADS FROM GOOGLE AT BUILD TIME, so an offline or network-restricted build fails. The two woff2 files are committed (50.5 KB, inside the 60 KB budget) with their OFL notice. `npm run build` needs no network at all |
| 2 | **The unknown-form branch before the column branch** in `specs/05` §4 | Both produce `asserted_only`, so no state changes; A5 requires the additional-insured row on corpus C2 to name `RSCG0303`, and a form number is strictly more information than a tick. See BUILD.md D-3 |
| 3 | **"Unknown" means unclaimed by the whole requirement SET** | Otherwise C2's additional-insured row would name `CG 20 01`, which belongs to the primary-and-non-contributory row. D-3b |
| 4 | **Cross-checks are rows, and they are counted** | The report has to print the name match and the holder match, and a check with no row is a check the customer cannot see. `origin: 'cross_check'` distinguishes them. D-8 |
| 5 | **`undetermined` does not move the vendor state** | `specs/05` §4's precedence chain does not contain it and `specs/06` §3's six states have no bucket for it. It surfaces as a counter and in the review queue, which is where a human clears it. D-7 |
| 6 | **`CG 20 39` removed from the accepts lists** | A real ISO form, but `KNOWLEDGE_BASE.md` §C.1 does not source it and no fetched URL exists. PLAN.md §A10: no URL, no ship |
| 7 | **`text` ids, not `uuid`** | A foreign key must match its target's type and the platform's `organisations.id` is `text`. D-2 |
| 8 | **An explicit `kind` on template rows** | §B.0's implicit shape mis-parses a misspelled key silently. Field names are §B.0's. D-1 |
| 9 | **`@vercel/blob` added as a dependency, imported dynamically** | The client-upload token needs `generateClientTokenFromReadWriteToken`; hand-rolling the HMAC is the kind of guesswork that breaks in production. The dynamic import keeps the unit suite from ever loading a module that reaches for a credential |
| 10 | **`kb:check` reports the unlabelled golden set rather than failing** | Failing a build for work nobody has started teaches people to ignore the build. The moment the FIRST label lands, an unlabelled fixture is a failure — that switch is what keeps the set complete |

## Assumptions made (no human asked)

- The Stripe price env names follow `OFFER.md` §12.2
  (`STRIPE_PRICE_CERTLY_STARTER_MONTHLY`, …). The founder has created nothing
  yet, so the names are still free to change — but they carry `{PRODUCT_NAME}`,
  which is pending.
- The free-onboarding allowance is expressed as `{vendors: 25, documents: 3,
  seats: 1, exports: false}` in the plan map, matching `specs/10` §8.1's
  `no_subscription` row.
- Monthly prices only in the plan map. The annual prices and the Vendor Pack are
  M10's, and adding them now would put six unconfigured price ids on the
  billing page.
- The engine's `EXPIRING_WINDOW_DAYS` is 30, inclusive, from `specs/06` §3.
- `org_settings.timezone` defaults to `America/New_York`. Any default is wrong
  for somebody; onboarding should ask.

## Advice to the next agent

1. **Read `BUILD.md` §1 before you edit anything.** The engine, the status
   vocabulary, the disclaimers module and `design-system.css` are shared or
   frozen, and each has a test that will tell you so loudly.
2. **The golden set is the schedule.** It is two days, it is serial, and every
   accuracy claim in the folder waits on it. Start it the morning you start.
3. **Run `npm run kb:check`.** It is the fastest read on whether the knowledge
   base and the schema still agree, and it prints the backlog rather than hiding
   it.
4. **When a status is on screen, the disclaimer is on screen.** Eleven surfaces,
   listed in `DISCLAIMER_SURFACES`, each with the spec that owns it. The grep
   guard will catch a second text; it cannot catch a missing one, so the render
   assertion is yours to add as your surface lands.
5. **`raw` survives.** Wherever you store a number, store the printed characters
   beside it. It is the single rule that stops `Excluded` becoming `$0`, and
   `parseMoney` already implements the decision.
6. **Do not average accuracy.** Per field, with denominators, everywhere —
   in CI, in `/admin`, and above all in marketing.

## Findings log

### 2026-09-03 — the review's own regression R-1 is still open upstream
`specs/03` §15's header says *"21 fixtures: 16 real + 5 synthetic"*; its table is
17 real (G1–G17) + 4 synthetic (G18–G21), which is what `KNOWLEDGE_BASE.md` §D.5
and `THRESHOLDS.md` §4.1 both say. `phase-4-revenue/` is not ours to edit, so
`tests/fixtures/coi/MANIFEST.md` records the correct count and where it came
from. **The table is right; the header is wrong.**

### 2026-09-03 — `VercelBlobStore.signedUrl` cannot honour its TTL
Vercel Blob 2.x serves objects from an unguessable public URL; per-request
signed URLs with an expiry are not in the public API. Keys are content-addressed
under an org prefix so a URL is unguessable, but entropy is weaker than an
expiry. The interface keeps `ttlSeconds` so that closing this — a route handler
that checks `requireOrg()` and streams the bytes, or an `S3Store` with a
presigned GET — changes no call site. **M4 owns it.** BUILD.md D-5, PR-3.

### 2026-09-03 — the platform hardcodes the magic-link callback path
`packages/platform/src/auth/service.ts` builds
`${APP_BASE_URL}/login/callback`, so `specs/01` §3's `/signin` cannot be the
real route without forking the platform. `/signin` redirects to `/login` and the
page lives beside its own callback. BUILD.md D-6, PR-4.
