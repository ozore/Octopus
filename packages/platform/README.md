# `@octopus/platform`

The shared, headless foundation for the three phase-4 apps (WageLens, Certly,
StateReady). Everything that is the same in all three — accounts, money, mail,
metrics, background work, legal pages — lives here once. Everything that is
different lives in `apps/<app>`.

It is deliberately **not** a framework: no `PlatformApp` class, no plugin
lifecycle. It is a set of functions and a schema, plus a small number of
ready-to-mount Next.js route handlers.

```
packages/platform
├── drizzle/                 the committed SQL migrations (12 tables) + journal
└── src/
    ├── env.ts               Zod env contract, extended per app
    ├── runtime.ts           configurePlatform() — the app's composition root
    ├── db/                  Drizzle client (postgres-js | PGlite), migrations, withTx
    ├── adapters/            Stripe + Resend ports, live and mock
    ├── auth/                magic link, sessions, orgs, memberships, rate limits
    ├── billing/             plan map, Checkout, Portal, webhook, entitlement, STRIPE_SETUP
    ├── email/               templates, one send path, suppression list
    ├── events/              track(), metrics (signups → MRR → churn), admin table
    ├── jobs/                queue (FOR UPDATE SKIP LOCKED), registry, cron drain
    ├── legal/               Terms, Privacy, Disclaimer as data
    ├── http/                route handlers an app mounts
    ├── next/                the only module that imports next/*
    └── testing/             PGlite harness + mock adapters + a test plan map
```

---

## 1. The two decisions worth arguing about

Both were taken against PLAN.md's constraints: Vercel, no worker process
(A12), customer accounts, magic link only (A7), and a vendor list of exactly
Stripe, Resend, Neon and Anthropic.

### Auth: three options, one chosen

| Option | What it buys | Why not |
|---|---|---|
| **Hosted identity** (Clerk, WorkOS, Auth0) | Org/member UI, MFA, SSO on day one | A fifth vendor, a per-MAU price on a product with no revenue yet, and the org↔subscription join — the thing every screen needs — living outside our database. PLAN.md's vendor list is closed. |
| **Auth.js / NextAuth** | Familiar, adapter for Drizzle, providers ready | Its value is OAuth providers, which A7 removes at launch. What is left is a session table and a callback, wrapped in an adapter contract that we would then fight for the org model. It also owns the cookie and the callback URLs, which is exactly where our magic link needs to be. |
| **Our own magic link** ✅ | ~300 lines we can read, own tables, org/membership/entitlement in one join, tests on PGlite with no network | We own the security properties: single-use tokens, hashing at rest, rate limits, rotation. They are written down below and tested, not assumed. |

**Chosen: our own.** The deciding argument is that with OAuth out of scope, a
library saves us a token table and costs us control of the seam every screen
depends on.

The security properties, since owning them means stating them:

1. tokens are 32 random bytes, **hashed with SHA-256 at rest** — a database dump
   is not a set of credentials;
2. a login token is **single use and 15 minutes**; consuming it is one atomic
   `UPDATE … WHERE consumed_at IS NULL`, so two clicks cannot mint two sessions;
3. requests are **rate limited per email and per IP** (fixed windows in
   `rate_limits`);
4. the login response is **identical whether or not the address has an account**
   (no enumeration oracle);
5. session cookies are `httpOnly`, `SameSite=Lax`, `Secure` on https, 30 days
   sliding, and the token **rotates** after 24 hours;
6. switching organisation issues a **new session**, so a captured cookie cannot
   follow the switch.

### Jobs: three options, one chosen

| Option | Why not / why |
|---|---|
| **A worker process** (Clausewright's model) | There is no always-on process on Vercel. Rejected by the platform, not by taste. |
| **A hosted queue** (QStash, Inngest, Trigger.dev) | Retries and schedules for free — and a fifth vendor, a second place where state lives, and a webhook surface to secure. Out per the vendor list. |
| **A `jobs` table drained by Vercel Cron** ✅ | One table, `FOR UPDATE SKIP LOCKED`, `enqueue()` transactional with the business write that caused it, a `CRON_SECRET`-guarded route that drains a bounded batch. Same pattern Clausewright proved, minus the worker. |

**Chosen: the table.** Vercel's own docs say cron delivery is best-effort and
may fire the same schedule twice, so every platform handler is idempotent and
`enqueue` takes a `dedupeKey`. Concurrency is real even without workers — two
overlapping invocations — and `SKIP LOCKED` is what makes the second one step
over the first's claim instead of duplicating work.

---

## 2. Using it from an app

```ts
// src/lib/plans.ts — the offer, as data
export const plans = definePlans({
  appName: 'WageLens',
  freeLimits: { determinations: 1, seats: 1, exports: false },
  plans: [{
    key: 'starter', name: 'Starter', priceEnvVar: 'STRIPE_PRICE_STARTER',
    amountCents: 4900, currency: 'usd', interval: 'month', trialDays: 14,
    limits: { determinations: 25, seats: 3, exports: true },
  }],
});

// src/lib/platform.ts — imported by every entry point, for its side effect
configurePlatform({ plans, jobs: registry, migrationDirs: [appMigrationsDir()],
                    activationEvent: 'wage_determination_exported' });
registerPlatformJobs(registry, () => getContext());

// src/app/api/stripe/webhook/route.ts
export const POST = createStripeWebhookHandler();

// any page under (app)
const { org, user, entitlement } = await requireOrg();
```

`apps/_template` is a working example of all of it; copy it rather than
assembling from this list.

### The env contract

`basePlatformEnv` (see `src/env.ts`) is the shared shape; an app extends it:

```ts
export const { getEnv } = createEnv(basePlatformEnv.extend({ WAGELENS_SNAPSHOT: z.string() }));
```

`STRIPE_PRICE_*` variables need no declaration — `createEnv` merges them back
after validation, because Zod strips unknown keys and a stripped price id makes
a correctly configured Stripe account look unconfigured.

Production is refused (`NODE_ENV=production`) unless: the driver is postgres, the
adapters are live, and `OPS_SHARED_SECRET` and `CRON_SECRET` are set.

---

## 3. What each module guarantees

| Module | Guarantee |
|---|---|
| `db` | The same SQL runs in tests (PGlite), dev and Neon; migrations are read from drizzle's journal, never globbed; `withTx` gives one transaction on either driver. |
| `auth` | The six properties listed above, each with a test. |
| `billing` | Hosted Checkout only — no method takes card data. The **webhook is the only writer of entitlement**; the redirect grants nothing. Every event is idempotent on `stripe_events.id`, and the claim is taken **inside** the transaction it guards. Entitlement is read from our mirror, never from Stripe, so a Stripe outage cannot lock out paying customers. `past_due` keeps access while Stripe retries. |
| `email` | One send path, so the suppression check and the "<App>, a TheVillage company" signature cannot be skipped at a call site. Receipts are Stripe's job, not ours. |
| `events` | Signups, activation (per-app event name), paid conversion, MRR, ARPA and churn from two tables we own. `track()` never throws into the path it measures. |
| `jobs` | Durable, transactional enqueue; bounded batch per invocation; per-job failure, retry and dead-letter; an unregistered kind is parked, not retried forever. |
| `legal` | Terms, Privacy and Disclaimer as structured data with env placeholders, so three brands share one reviewed text. |
| `http` | Plain `(Request) => Response` handlers — testable with `new Request(...)`, no Next.js needed. |
| `next` | The only module importing `next/*`. `getSession()` (read-only, safe in RSC) vs `getSessionAndRotate()` (writes cookies, actions and route handlers only). |

---

## 4. Constraints the framework imposed, and what we did about them

These are the places where the design bent around Next.js or Vercel rather than
around preference. They are documented because the workaround looks arbitrary
otherwise.

| Constraint | Consequence here |
|---|---|
| A React Server Component **cannot write cookies** | The magic-link callback is a route handler (`/login/callback/route.ts`), not a page; session rotation happens in `getSessionAndRotate()`, called from actions and handlers only. |
| Edge middleware **cannot reach Postgres** | `middleware.ts` checks cookie PRESENCE and stamps `x-pathname`. The real check is `requireOrg()` in the `(app)` layout, which loads the session row on every protected render. |
| `next start` sets `NODE_ENV=production`, and our env guard refuses mock adapters there | The Playwright journey runs against `next dev`. The production build is gated separately by CI's `next build` step. Weakening the guard with an override flag was rejected: a deploy could set it too. |
| Next compiles the RSC graph and the route/action graph **separately** | Every process-wide handle (db, adapters, config) is pinned to `globalThis`, and `instanceof` across graphs is unreliable — hence `isMockBilling()` rather than `instanceof MockBillingAdapter`. |
| Vercel cron delivery is **best effort and may repeat** | Every platform job handler is idempotent; `enqueue` takes a `dedupeKey`; the drain claims with `FOR UPDATE SKIP LOCKED`. |
| Vercel **Hobby** allows a cron only once per day | The template ships a daily schedule; `phase-4-revenue/DEPLOY_VERCEL.md` says to switch to `*/5 * * * *` on Pro (which is required before charging anyway). |
| Stripe's 2025 API moved the period onto subscription **items** | `normaliseSubscription` reads `items.data[0].current_period_end` first and the legacy top-level field second. |

---

## 5. Tests

```bash
npm test --workspace packages/platform     # 89 tests, PGlite, no network, no keys
```

| File | Covers |
|---|---|
| `tests/env.test.ts` | defaults, production refusals, per-app extension |
| `tests/db.test.ts` | journal ordering, real constraints, transaction rollback |
| `tests/auth.test.ts` | the six auth properties, orgs, members, session lifecycle |
| `tests/billing.test.ts` | plan map, Checkout, webhook (mirror, idempotency, portal changes, dunning), entitlement, portal |
| `tests/email.test.ts` | templates, signature, escaping, suppression |
| `tests/events.test.ts` | track, all five metrics, admin rendering |
| `tests/jobs.test.ts` | claim/retry/dead-letter/batch, platform handlers, housekeeping |
| `tests/http.test.ts` | every mounted route handler, including its refusals |
| `tests/legal.test.ts` | placeholders, sub-processors, trial-to-paid clause |

`src/testing` exports the same harness for an app's suite:
`createTestDb([appMigrationsDir()])`, `makeTestAdapters()`, `createTestHarness()`.

---

## 6. Regenerating migrations

```bash
npm run db:generate --workspace packages/platform    # after editing src/db/schema.ts
```

Commit the generated `drizzle/*.sql` **and** `drizzle/meta/`. An app's own
migrations live in `apps/<app>/drizzle` and are applied after these; the two
journals are independent, so `drizzle-kit generate` in an app never tries to
re-create a platform table.
