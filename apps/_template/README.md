# `apps/_template` — the app scaffold

A runnable Next.js 15 app on `@octopus/platform`: magic-link accounts,
organisations, Stripe subscriptions, transactional email, usage metrics, a cron
queue, legal pages and an admin table. It has no product in it — that is the
point.

```bash
npm ci                                            # from the repo root
npm run dev --workspace apps/_template            # http://localhost:3000, mock adapters, PGlite
npm test --workspace apps/_template               # unit
npm run test:e2e --workspace apps/_template       # the whole purchase journey, offline
```

Everything runs with **no credentials at all**: `ADAPTER_MODE=mock` binds the
in-repo Stripe and Resend fakes, `DATABASE_DRIVER=pglite` boots a real Postgres
in-process. There is no inbox in mock mode, so the sign-in link is shown on the
login page (and `src/env.ts` refuses that mode in production).

---

## Scaffolding a real app

```bash
cp -r apps/_template apps/wagelens
cd apps/wagelens && rm -rf .next node_modules test-results
```

Then, in order:

1. **`package.json`** — rename to `@octopus/wagelens`.
2. **`src/lib/plans.ts`** — the offer: plan keys, prices, trial days, `limits`
   in the app's own vocabulary, and `ACTIVATION_EVENT` (the moment a signup got
   what the product promises). `npm run stripe:setup > STRIPE_SETUP.md`
   regenerates the founder's Stripe checklist from it.
3. **`src/styles/design-system.css`** — replace wholesale with the identity
   fleet's file from `phase-4-revenue/<app>/identity/`. **Keep the variable
   names**; every component styles itself from them and from `app.css`.
4. **`src/app/(marketing)/page.tsx`** — replace with the landing page from the
   offer fleet's spec. Keep the CTA to `/login` and the legal footer.
5. **`src/lib/schema.ts`** — the product tables (delete `projects`), then
   `npm run db:generate` and commit `drizzle/`.
6. **`src/app/(app)/`** — the product. `dashboard/page.tsx` shows the shape to
   keep: `requireOrg()` → count real rows → `withinLimit()` before the write.
7. **`src/lib/platform.ts`** — register the app's own job kinds (knowledge-base
   refresh, scheduled reports) next to the platform's.
8. **`.env.example`** and `vercel.json` — app name, cron path/schedule.
9. **`e2e/journey.spec.ts`** — keep the journey, change the product steps.

Nothing else should need editing: auth, billing, email, events, jobs, legal and
admin come from the platform.

---

## Where each piece lives

| Path | What |
|---|---|
| `src/app/(marketing)/` | landing placeholder, `/pricing`, `/legal/[doc]`, `/help` — public, `force-dynamic` because they read env at request time |
| `src/app/(auth)/login/` | the request form (`page.tsx`) and the callback (`callback/route.ts` — a route handler because an RSC cannot set cookies) |
| `src/app/(app)/` | `dashboard`, `settings` (org + members), `settings/billing` (Checkout + Portal) — guarded by `requireOrg()` in the layout |
| `src/app/api/` | `stripe/webhook`, `cron/drain`, `auth/request`, `auth/signout` |
| `src/app/admin/` | metrics table, `OPS_SHARED_SECRET` |
| `src/app/mock/checkout/` | the local stand-in for Stripe's hosted page — mock mode only, used by the e2e journey |
| `src/middleware.ts` | cookie-presence redirect + `x-pathname`; **not** authentication (Edge cannot reach Postgres) |
| `src/lib/actions.ts` | every server action, thin wrappers over platform functions |
| `src/scripts/migrate.ts` | the Twelve-Factor XII admin process — run by hand or from CI, never at build time |
| `drizzle/` | this app's migrations only; the platform's are applied first |

---

## The end-to-end journey

`e2e/journey.spec.ts` walks: anonymous visitor bounced from `/dashboard` →
sign-up by magic link → dashboard → create the first project (activation) → hit
the free plan's limit → Checkout → **the mock hosted page signs a real
`checkout.session.completed` and posts it through the real webhook handler** →
entitlement visible on billing and dashboard → sign out revokes the session.
Two more tests prove `/admin` and `/api/cron/drain` refuse callers without their
secret.

It runs against `next dev`, not `next start`: `next start` forces
`NODE_ENV=production`, where the env guard (correctly) refuses mock adapters.
The production build is gated separately by CI's `next build` step.

Browsers are preinstalled here — never run `playwright install`:

```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npm run test:e2e --workspace apps/_template
```

---

## Deploying

See `phase-4-revenue/DEPLOY_VERCEL.md` for the per-project settings (Root
Directory, "Include source files outside of the Root Directory", the ignored
build step, env variable names, cron, Neon). Two things that are easy to miss:

- **migrations are not run by the build** — `npm run db:migrate` is a separate
  admin step, because a build that half-migrates a database while the previous
  deployment is serving it is the worst kind of outage;
- **the cron schedule in `vercel.json` is daily**, because Vercel Hobby rejects
  anything more frequent. On Pro (required before charging), change it to
  `*/5 * * * *` so scheduled email actually goes out on time.
