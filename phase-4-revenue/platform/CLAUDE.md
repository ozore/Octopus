# Platform engineer — working memory

**Scope:** `packages/platform` + `apps/_template` + root monorepo wiring + CI + Vercel deploy docs.
Owner: platform engineer agent (wave 1). Started 2026-09-03.

## Rules confirmed (from PLAN.md / PIPELINE.md / brief)
- `app/` (Clausewright) and `phase-3-acquisition/` are READ-ONLY. `app/` keeps its own lockfile and its own CI job.
- Root workspaces are `["apps/*", "packages/*"]` only — never `app`.
- A7 magic-link auth, no OAuth. A8 monorepo. A12 Vercel Cron → drain route (no worker process).
- A13 Neon Postgres + PGlite for tests. A14 own `events` table.
- No secrets in the repo; env NAMES only. No network in tests. No new vendors beyond Stripe, Resend, Neon, Anthropic.
- Do not commit, do not push. Never ask a human; pick the simplest working alternative and write it down.

## Status — DELIVERED 2026-09-03
- [x] root wiring: `package.json` (workspaces `apps/*`, `packages/*`), `package-lock.json`,
      `tsconfig.base.json`, `vitest.base.ts` (shared test config), `scripts/vercel-ignore-build.sh`
- [x] `packages/platform`: env, db, auth, billing, email, events, jobs, legal, http, next, testing
      — 89 tests on PGlite, no network
- [x] `apps/_template`: runnable Next 15 app, 8 tests + 3 Playwright specs (journey passes)
- [x] CI: second job `workspaces` in `.github/workflows/ci.yml`; the `app` job untouched
- [x] Docs: `packages/platform/README.md`, `apps/_template/README.md`,
      `phase-4-revenue/DEPLOY_VERCEL.md`

## Decisions taken (with reasons) — 2026-09-03

| # | Decision | Why / what it rules out |
|---|---|---|
| P1 | Own magic-link auth in `packages/platform/auth` | Auth.js/Clerk/WorkOS all add a vendor outside PLAN.md's list; A7 removes OAuth, which is the only hard part. ~300 lines, tested on PGlite. |
| P2 | Middleware guards `(app)` by COOKIE PRESENCE only; the real check is `requireSession()` in RSC/route handlers (Node runtime) | Edge middleware cannot reach Postgres. Belt: the session row is still verified server-side on every protected render. |
| P3 | Magic-link callback is a ROUTE HANDLER (`/login/callback/route.ts`), not a page | An RSC cannot set cookies (Next.js constraint). The handler answers 303 + `Set-Cookie`. |
| P4 | Session rotation happens only where cookies can be written (`getSessionAndRotate()` in actions/route handlers); reads slide the DB expiry | Same constraint as P3, made explicit rather than crashing at render. |
| P5 | Price ids live in env vars named by the plan map; `createEnv` merges every `STRIPE_PRICE_*` back after validation | Zod STRIPS unknown keys — a price id only in `process.env` is invisible to `getEnv()`, and a working Stripe setup looks broken. |
| P6 | `normaliseSubscription` reads the period from `items.data[0].current_period_end` AND the legacy top-level field | Stripe's 2025 API moved the period onto items; reading only the old field mirrors `null` for every customer. |
| P7 | Jobs: one `jobs` table, `FOR UPDATE SKIP LOCKED`, drained by a Vercel Cron route with a bounded batch | A12. No worker process exists on Vercel; QStash/Inngest would be a new vendor. |
| P8 | Template `vercel.json` ships a DAILY cron | Vercel Hobby rejects a deployment whose cron runs more often than daily; switch to `*/5 * * * *` on Pro (documented in DEPLOY_VERCEL.md). |
| P9 | Mock checkout is a local page (`/mock/checkout/...`) under ADAPTER_MODE=mock | Lets the Playwright journey complete a purchase with no network; `env.ts` refuses mock in production. |


## What tripped me up (read this before touching the template)

1. **Zod strips unknown keys.** `STRIPE_PRICE_*` variables vanished from the parsed env and every
   Checkout answered `price_not_configured` with nothing in the logs. Fixed in `createEnv`: price
   variables are merged back after validation, by name pattern. An earlier attempt (`priceEnvShape`
   extending the schema) was WORSE — extending a Zod object with a `Record<string, …>` replaces the
   known keys with an index signature and destroys the env type.
2. **`instanceof` is unreliable across Next.js module graphs.** The mock Checkout page 404'd on a
   session the server action had just created, because the RSC graph and the action graph each hold
   their own copy of `MockBillingAdapter`. Use `isMockBilling()` (a `mode` discriminator).
3. **A barrel that does not re-export is invisible.** `isMockBilling` existed but was not exported
   from `adapters/index.ts`; the error surfaced as "is not a function" in the browser overlay, not
   at typecheck, because the template imported it from the subpath barrel.
4. **`127.0.0.1` and `localhost` are different sites to a browser.** The Playwright baseURL must
   equal `APP_BASE_URL`, or Chrome drops the `SameSite=Lax` session cookie on the callback's
   redirect chain and the journey fails at the dashboard with no error anywhere.
5. **`next build` prerenders pages that read env.** Any page calling `getEnv()` needs
   `export const dynamic = 'force-dynamic'` (set once on the `(marketing)` layout), or the build
   fails in CI where no environment is set — and would bake one deploy's support address into the
   bundle even where it succeeds.
6. **`next start` sets `NODE_ENV=production`**, where the env guard refuses mock adapters. The e2e
   journey therefore runs against `next dev`; the production build is gated by CI's `next build`.
   Do not add an override flag — a real deploy could set it too.
7. **An empty `drizzle/meta/` breaks `drizzle-kit generate`** (`ENOENT _journal.json`). Delete the
   folder and let it create it.

## Advice to the next agent

- Scaffold with `cp -r apps/_template apps/<app>`; the README lists the nine files to edit, in order.
- Never call a platform function without `import '@/lib/platform'` somewhere up the graph — the plan
  map, job registry and app migrations are configured there.
- Keep `app/` and `phase-3-acquisition/` untouched; `app/` has its own lockfile and its own CI job.
- Run `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npm run test:e2e --workspace apps/_template`;
  never `playwright install`. The template pins `@playwright/test@1.56.1` because that is the
  version whose chromium build (1194) is preinstalled in this image.
- The commands that must stay green: `npm ci && npm run typecheck && npm test` at the root,
  `npm run build --workspace apps/_template`, and `cd app && npm ci && npm test`.
