# `apps/wagelens` — working memory

**Owner:** Lead Builder, wave 2 sub-wave A. **Started and delivered:** 2026-09-03.
**Scope:** `apps/wagelens/**` plus one edit to `.github/workflows/ci.yml` and the root lockfile.
Next agent: read [`BUILD.md`](BUILD.md) first — it is the module map. This file is what went wrong.

---

## Rules confirmed (from the brief, PLAN.md, PIPELINE.md, REVIEW.md)

- Write only under `apps/wagelens/`, plus the CI `workspaces` job and `package-lock.json`.
  **Do not** touch `packages/platform`, `app/`, other apps, or `phase-4-revenue/` documents.
- Build every component against the **semantic `--wl-*` tokens only**. WageLens is *pinned* by
  `IDENTITY_ARBITRATION.md`, so token discipline keeps a future change cheap for the whole fleet
  (REVIEW.md build-order condition 2). `tests/naming.test.ts` fails on a hex.
- **No live network in tests.** The SAM adapter is mock-by-default and the e2e blocks every
  third-party host.
- Never run `playwright install`; the browsers are preinstalled at `/opt/pw-browsers`.
- No secret in the repo. Env NAMES only.
- No banned figure or claim in any copy; the disclaimer appears on every surface that shows a rate.
- Do not commit, do not push. Never ask a human; pick the simplest working alternative and write it
  down.

## Status — DELIVERED 2026-09-03

- [x] scaffold from `apps/_template`, `@octopus/wagelens`, `APP_SLUG=wagelens`
- [x] identity: the fleet's `design-system.css` copied byte-for-byte with a build-time drift check;
      Google Fonts per IDENTITY.md §7; the 216px rail; provenance card, disclaimers, status pill,
      ledger row
- [x] **WL-13**: SAM client (index / detail / history / county dictionary), parser, gates, ingest,
      lookup, jobs, `kb:pull` CLI, three cron routes, `/api/health/corpus`, mock/live seam
- [x] **WL-00**: the public lookup end to end, including the modification control and the
      superseded-revision page
- [x] **WL-01**: the platform's magic link, themed (deviations in BUILD.md §6)
- [x] data model for WL-02 … WL-08 and WL-14, with repositories and unit tests
- [x] `BUILD.md`, CI, 132 unit tests, 10 Playwright specs

---

## What tripped me up — read this before touching the corpus

1. **The reference parser cannot parse the fixture the reviewer required.** `rev-0` of TX20260253
   contains `ELEVATOR MECHANIC................$ 53.59       38.435+a+b` — a fringe with a footnote
   marker. The reference regex ends the fringe at end-of-line, so mod 0 parses at **0.9815** and
   gate G3 (≥0.995) rolls back the exact determination findings B3 and B4 are proved on. One
   regex group fixed it, and `tests/kb-parser.test.ts` now asserts BOTH byte-parity with the
   reference output on mod 1 and full coverage on mod 0. **If you change the parser, run that test
   first** — the parity assertion is the only thing keeping the port honest.
2. **SAM prints two different county headers.** `"Counties: Texas Counties of\nHarris"` (common) and
   `"County: Harris County in Texas.\n\nBUILDING CONSTRUCTION PROJECTS (does not include…)"` (mod 0
   of the same determination). The reference parser returned all three lines of the second as
   "counties". Fixed by taking the first paragraph only — and, more importantly, by writing
   `kb_wd_counties` from the **index record**, which carries SAM's numeric codes. A county NAME
   queries SAM for nothing (KB-1), so the codes were always the thing that mattered.
3. **`FOR UPDATE` is not allowed with an aggregate.** WL-05's payroll-number allocation reads
   `max(payroll_number)`; `SELECT max(...) FOR UPDATE` does not run at all. Worse, a row lock could
   never have worked: the FIRST certification on a project has no row to lock. It is a
   `pg_advisory_xact_lock` on `(project, filer)` now, with the unique index as the backstop.
4. **`emitEvent`'s privacy filter ate `county_name`.** A suffix rule on `_name` catches
   `worker_name` and `county_name` alike, and THRESHOLDS.md's funnel is computed per county. It is
   an explicit denylist of person-shaped keys now. A county is not a person.
5. **vitest needed two things the template did not.** `resolve.alias` for `@/*` (otherwise a test
   that imports anything reaching `@/env` fails at resolution and the error names the wrong file),
   and `esbuild.jsx: 'automatic'` plus a `.tsx` include glob, because `tsconfig.json` sets
   `jsx: "preserve"` for Next and esbuild would hand vitest raw JSX.
6. **The e2e spent 30 seconds a page load on Google Fonts.** The design system's own header says the
   font import is optional and every family has a metric-compatible fallback, so `e2e/offline.ts`
   aborts every third-party request — which also turns WL-00 V6 ("no third-party script on a public
   page") into a test rather than a note.
7. **The CI greps caught my own comments.** `tests/naming.test.ts` bans `13,508`, "success rate" and
   a call to action that calls the trial free — and my file headers *quoting the prohibition* tripped
   it. The right fix is to reword the comment, not to weaken the grep: the grep is the property.
   The test builds the product-name literals at runtime (`'Wage' + 'Lens'`) so it does not fail
   itself.
8. **A transient workspace collision.** `drizzle-kit` refused to run for a minute with
   *"must not have multiple workspaces with the same name"* — a sibling fleet had just `cp -r`'d
   `apps/_template` and not yet renamed its `package.json`. Nothing to fix; retry.
9. **`npm install` at the root is required after adding a workspace**, or `apps/wagelens` is absent
   from `package-lock.json` and `npm ci` in CI will not install it.

## Decisions taken (the reasoning is in BUILD.md §6)

| # | decision | one-line reason |
|---|---|---|
| W1 | text ULID ids, not uuid | one id convention with the platform; a foreign key never crosses a type |
| W2 | `text` + normalisation, not `citext` | PGlite has no citext; dev/test parity beats a collation |
| W3 | the parser's fringe regex accepts a footnote marker | otherwise the rev-0 fixture cannot be ingested and B3/B4 cannot be tested |
| W4 | counties from the index record | SAM's numeric code is what a county query needs |
| W5 | a superseded revision inherits its county set, or has none | inventing one would be inventing data |
| W6 | help articles as a typed array, not MDX | no compiler plugin, and `lastReviewed` becomes a compile-time guarantee |
| W7 | `/lookup` and `/wd/:n`, not UX.md's `/rates` | WL-00 carries the acceptance criteria and the canonical URL rules |
| W8 | a scaffold `projects/` UI, marked and owned by WL-02 | the journey needs an activation step, and a real pin is the honest one |
| W9 | no `gc` plan key at all | "published, not for sale" as a property of the code, not a rule |
| W10 | `freeLimits` is the pre-card allowance, with `exports: false` | nothing can be FILED without a card, which is what "no free tier" means |
| W11 | `kb.reparse` registered and throwing | nothing has changed the parser yet; the stored text and version are there for whoever does |

## Assumptions (flag them if wrong)

- The founder's final product name is still open (PLAN A3), so **every** user-visible string reads
  `APP_NAME`. If the name is settled, nothing changes — set the variable.
- `SESSION_COOKIE_NAME=wl_session` per WL-01. The middleware falls back to the platform's default,
  so setting it in one place only would still work; it is set in `.env.example`, the vitest env and
  the Playwright env so all three agree.
- The corpus is seeded from fixtures in dev and e2e (`KB_SEED_FIXTURES`), never in production —
  `env.ts` refuses mock adapters there, and the seed is a no-op unless the adapter is the mock.
- Vercel Hobby allows one cron a day, so `vercel.json` ships `/api/cron/drain` at 07:00 and
  `/api/cron/kb-refresh` at 02:00. On Pro, the drain should be `*/5 * * * *` — the corpus reaches
  steady state in ~14 hours of daily ticks otherwise.

## Advice to the next agent

- **Read `BUILD.md` §2 for your row and §3 for what is frozen.** The frozen list is short and every
  entry has a test behind it.
- Run `npm run kb:pull --workspace apps/wagelens -- --mock` to see the pipeline end to end in two
  seconds without touching the network.
- If a rate is not rendering, it is `<Rate>` failing closed because provenance is missing. That is
  the design (WL-11 Errors); find the missing `wd_number`, do not bypass the component.
- The three commands that must stay green: `npm run typecheck` and `npm test` at the root,
  `npm run build --workspace apps/wagelens`, and the Playwright suite from `apps/wagelens`.
- `cd app && npm test` (Clausewright) is a separate lockfile and a separate CI job. Leave it alone.

---

# B4 — the landing page and WL-11 (sub-wave B, 2026-09-04)

**Scope:** `src/app/(marketing)/page.tsx`, `src/components/landing/**`, `src/styles/landing.css`,
WL-11's remainder (`src/components/certify-disclaimer.tsx`, `src/lib/disclaimer-acknowledgement.ts`,
`src/content/help/search.ts`, `src/content/legal/product-docs.ts`, `/help` search, the four new
`/legal` documents), `tests/landing*.tsx`, `tests/wl11.test.tsx`, `e2e/landing.spec.ts`.
One additive edit outside that: an optional `action` prop on `<LookupForm>` (REQUESTS B4-1).

## What is true now

- **`/` is the landing page `LANDING_SPEC.md` describes.** Hero → live lookup (V1, or V1b on the
  1-in-8 ambiguous case) → the modification picker and V2 → the 55-minute ledger (V4) → how it
  works and the Friday wall (V3) → proof and the rendered WH-347 (V5) → what we will not do →
  pricing → FAQ → footer. **430 words above the pricing block against a ceiling of 450**, counted
  in CI by `LANDING_SPEC` §2's own convention.
- **The demo is the product.** The widget is a GET form that lands back on `/`; the page reads the
  ingested corpus through `@/lib/kb` (`findDeterminations`, `searchClassifications`,
  `getModificationHistory`) exactly as the public result page does. **No sam.gov call at request
  time and no snapshot fallback** — when the corpus is empty the page shows the honest error, the
  SAM.gov link and no rate at all (finding M16).
- **The modification control works in place.** `/?state=TX&county=harris&type=Building&mod=0`
  re-renders the whole card at modification 0 with the newer modification named permanently beside
  it, and draws V2 with a **real** divergence count computed from the rows we hold for both
  modifications. It emits `modification_pin_used`.
- **WL-11 is finished** except for two screens other agents own: `<CertifyDisclaimer>` needs
  mounting on WL-06's certify screen and the acknowledgement needs mounting in onboarding
  (REQUESTS B4-8, B4-9). Both modules are built and tested.

## What tripped me up

1. **The HTML walker in the word-count test silently stopped excluding.** React closes SVG shapes
   with real end tags (`<path …></path>`), so treating `path`/`rect`/`line` as void elements
   unbalanced the tag stack: the first `</path>` popped the enclosing `<svg data-wordcount="exclude">`
   and **everything after the first drawing was counted**. It read 632 against a ceiling of 450 and
   the cause was in the counter, not the copy. `VOID_TAGS` is now HTML-only and the walker unwinds
   to the matching open tag instead of popping blind. If a word count ever jumps, suspect the
   walker before the writing.
2. **A "rate surface" detector that follows imports is wrong.** The first version of the
   disclaimer gate walked every `@/…` import and asked "does this module render a rate?" — so
   `/settings`, which imports `formatDay` from `provenance.tsx`, looked like a screen that shows
   money. It now follows only the components a file actually **renders**, and reads the body of the
   named export, so `<SourceChip>` (a citation) is distinguished from `<ProvenanceCard>` (a rate).
   Over-detecting is not the safe direction: it puts required notices on screens that show no
   number, which is how a disclaimer becomes wallpaper.
3. **Substring search made every article match everything.** "sales tax in ohio" contains "in",
   "in" is inside "including", and all six articles came back. `help_searched.result_count` is then
   a number nobody can read. `/help` search matches whole words with a prefix allowance for
   plurals, and drops stop words.
4. **The CI greps caught my own comments — again.** A file header quoting the banned penalty figure
   failed `tests/naming.test.ts`, exactly as this file's §7 warned. Reword the comment, never the
   grep. (WL-09's `/billing/start` has the same defect with `Start free` today: REQUESTS B4-7.)
5. **`LANDING_SPEC` §5.4 and §2 disagree about counting field labels.** §2's rule excludes them,
   §5.4's arithmetic includes twelve of them. The script implements the rule and the deviation is
   recorded (BUILD.md 6.B4-8); the difference is 12 words and the page is 20 under either way.
6. **Two visuals need two drawings.** A horizontally scrolling axis on a phone is forbidden
   (§11), so V2 ships as a horizontal SVG and a vertical one, and V3 as 52×1 and 13×4, swapped by
   CSS. The captions live **outside** both SVGs so they are written — and counted — once.
7. **The corpus fixtures hold two modifications, never three.** §6 V2 anticipates this: the diagram
   ships with two and the caption is honest about it. The example determination is *chosen by a
   query* (the one with the most modifications on record), not hard-coded, so it improves by itself
   when the corpus grows.

## Decisions taken (reasoning in BUILD.md §6.B4)

| # | decision | one-line reason |
|---|---|---|
| B4-a | no email capture anywhere on `/` — no watch box, and `Join the list` is a mailto | the consent record, double opt-in and unsubscribe are WL-14's; a second copy is how two records disagree |
| B4-b | V1/V4/V5 are DOM, V2/V3 are inline SVG | each brief asks for it, and the rendered WH-347 must be accessible HTML first |
| B4-c | V5 shows the DOL notation carrying a **real** rate | keeps the notation, keeps the caption honest, and lets the artefact carry provenance so G8 is satisfied |
| B4-d | V2 renders once, beneath the modification picker | §5.1's interaction is the point of the page, and one diagram is one caption |
| B4-e | the landing's own V1b and modification picker | the shared components carry 65 words of copy written for a page with no budget |
| B4-f | a separate `src/styles/landing.css` | four agents were editing this app at once and `app.css` is the file all four would have touched |
| B4-g | analytics through a server action, not a public JSON route | the browser cannot name an event: the action allow-lists, and `emitEvent` allow-lists again |
| B4-h | the sticky CTA is `position: sticky` in a bounded zone | the required behaviour, with no scroll listener and no JavaScript |
| B4-i | four new `/legal` documents rather than more help articles | the footer's links must resolve, and the six articles are asserted at six in two suites |

## Advice to the next agent

- **Run `npx vitest run tests/landing.test.tsx --reporter=verbose` to see the word count.** The test
  name carries the number (`counts 430 words against a ceiling of 450`), so a copy edit that costs
  words shows its price in the test output.
- **Do not add copy to a component under `src/components/landing/` without putting it in
  `copy.ts`.** The budget test asserts that every counted string lives there; that is what keeps the
  page's argument readable in one screen.
- **Mark data as data.** Anything the corpus produced — a classification, a date, a modification
  number, a county list — belongs in a subtree carrying `data-wordcount="exclude"`, or it will be
  counted as prose and the budget will look spent when it is not.
- **`/` and `/lookup` must keep answering the same question the same way.** They share
  `<LookupForm>` and the same `@/lib/kb` queries on purpose; if you change how one resolves a
  county, change both or neither.
- The Playwright suite for this page is `e2e/landing.spec.ts`. It runs the demo lookup to a real
  fixture determination, picks the earlier modification, and follows the paid CTA to the trial
  start — with JavaScript both on and off.
