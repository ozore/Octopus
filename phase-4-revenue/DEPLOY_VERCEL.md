# Deploying the phase-4 apps on Vercel

**Audience:** the founder, doing this once per app. Everything an agent could do
is already in the repo; what is left here needs an account, a card or a
credential, so it is written as a checklist rather than a script.

Three projects, one repository (`ozore/Octopus`, already linked, PLAN.md D3),
one Stripe account (D2), one Neon database per app (A13).

| App | Vercel project | Root Directory | Neon database |
|---|---|---|---|
| WageLens | `octopus-wagelens` | `apps/wagelens` | `wagelens` |
| Certly | `octopus-certly` | `apps/certly` | `certly` |
| StateReady | `octopus-stateready` | `apps/stateready` | `stateready` |

> **Before any of them takes money: upgrade to Vercel Pro.** The Hobby plan
> forbids commercial use — "Hobby accounts are for personal, non-commercial use"
> — and a paid subscription on a Hobby project is a terms breach that can take
> all three apps down at once. Hobby is fine for the test-mode phase. This is
> the risk PLAN.md §6 flags; it is also why the cron below is daily until you
> are on Pro.

---

## 1. Create the project

Vercel dashboard → **Add New… → Project** → import `ozore/Octopus` (already
authorised) → then, before the first deploy, open **Settings** and set:

| Setting | Value | Why |
|---|---|---|
| **Framework Preset** | Next.js | detected automatically |
| **Root Directory** | `apps/wagelens` | the app, not the repo root |
| **Include source files outside of the Root Directory in the Build Step** | **ON** | mandatory. The app imports `@octopus/platform` from `packages/`, and the npm workspace lockfile is at the repo root. With this off the build fails at `npm ci` with a missing workspace. |
| **Node.js Version** | 22.x | matches `engines` and CI |
| **Install Command** | *(leave default)* | Vercel runs `npm ci` at the repo root and links the workspaces |
| **Build Command** | *(leave default: `next build`)* | run inside the Root Directory |
| **Output Directory** | *(leave default)* | |
| **Production Branch** | `claude/mature-ideas-list-rqx2gf` | the only authorised branch (PLAN.md A9) until it merges |

### Ignored Build Step

**Settings → Git → Ignored Build Step → Command:**

```bash
bash scripts/vercel-ignore-build.sh apps/wagelens
```

Exit 0 means *skip*, exit 1 means *build* (Vercel's contract, inverted on
purpose). The script builds when the app's own directory, `packages/`, or a root
manifest changed, and skips otherwise — so a push touching only `app/`
(Clausewright), `outbound/` or another app costs nothing on this project. If it
cannot compute a diff (first deploy, shallow clone) it builds.

---

## 2. Provision the database (Neon, through the Vercel Marketplace)

**Storage → Create Database → Neon → Serverless Postgres.**

1. Region: the same as the project's function region (`iad1` unless you changed it).
2. Connect it to this project only; repeat per app so one app's load or one
   bad migration cannot touch another's data.
3. Vercel injects `DATABASE_URL` and friends automatically. **Use the POOLED
   connection string** (`…-pooler.…neon.tech`) — serverless functions open many
   short-lived connections and the direct endpoint runs out of them. If the
   injected `DATABASE_URL` is the direct one, override it with the pooled value.
4. Set `DATABASE_DRIVER=postgres` (the default is only `pglite` in dev/test).

**Migrations are not run by the build.** From your machine, once per release
that changes the schema:

```bash
npm ci
DATABASE_DRIVER=postgres DATABASE_URL='postgres://…-pooler…/neondb?sslmode=require' \
  npm run db:migrate --workspace apps/wagelens
```

It applies `packages/platform/drizzle` first, then `apps/wagelens/drizzle`, in
journal order. A build that half-migrates a database while the previous
deployment is still serving it is the worst kind of outage, which is why it is a
separate step.

---

## 3. Environment variables

**Settings → Environment Variables.** Names only below — every value is yours to
paste, and none of them belongs in the repo. Set them for **Production** and
**Preview** (Preview should point at Stripe TEST keys and a Neon branch).

### Every app needs

| Variable | Notes |
|---|---|
| `APP_NAME` | `WageLens` — appears in email, legal pages and the "a TheVillage company" signature |
| `APP_SLUG` | `wagelens` |
| `APP_BASE_URL` | `https://octopus-wagelens.vercel.app` (update when a custom domain is added — the magic link is built from it) |
| `COMPANY_NAME` | `TheVillage` |
| `COMPANY_ADDRESS` | the postal address CAN-SPAM requires in commercial mail |
| `SUPPORT_EMAIL` | the founder's monitored mailbox |
| `NODE_ENV` | set by Vercel; do not override |
| `ADAPTER_MODE` | `live` |
| `DATABASE_DRIVER` | `postgres` |
| `DATABASE_URL` | Neon **pooled** connection string |
| `DATABASE_POOL_MAX` | `5` is a sane start for serverless |
| `STRIPE_SECRET_KEY` | test key first, live after QA |
| `STRIPE_WEBHOOK_SECRET` | signing secret of the endpoint created in step 4 |
| `STRIPE_PORTAL_CONFIGURATION_ID` | optional |
| `STRIPE_PRICE_*` | one per plan; the names are listed in the app's generated `STRIPE_SETUP.md` |
| `RESEND_API_KEY` | |
| `EMAIL_FROM` | `WageLens <hello@…>` on the verified sending domain |
| `EMAIL_REPLY_TO` | optional; the founder's mailbox |
| `OPS_SHARED_SECRET` | guards `/admin`; ≥ 32 random characters |
| `CRON_SECRET` | Vercel sends it as `Authorization: Bearer …` to the drain route; ≥ 16 random characters |
| `SESSION_COOKIE_NAME` | optional; default `octopus_session`. **Set a distinct value per app** if they ever share a domain |
| `JOBS_BATCH_SIZE` | optional; default 20 |
| `BILLING_ENABLED` / `SIGNUPS_ENABLED` | optional kill switches, default true |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional; our own `events` table stays authoritative (A14) |

The app refuses to boot in production without `DATABASE_URL`,
`OPS_SHARED_SECRET`, `CRON_SECRET` and — with `ADAPTER_MODE=live` — the Stripe
and Resend credentials. It also refuses `ADAPTER_MODE=mock` and
`DATABASE_DRIVER=pglite` in production outright, so a mis-set variable fails at
boot instead of serving fake billing.

---

## 4. Stripe

Generate the checklist from the app's own plan map — it cannot drift from the
code, because it is generated from it:

```bash
npm run stripe:setup --workspace apps/wagelens > apps/wagelens/STRIPE_SETUP.md
```

It lists the products and prices to create, the Customer Portal settings, and
the webhook endpoint:

- **URL:** `https://octopus-wagelens.vercel.app/api/stripe/webhook`
- **Events:** `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`,
  `invoice.payment_failed`, `invoice.paid`
- Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Do the whole thing in **test mode** first, buy once end to end, then repeat in
live mode. The webhook — not the redirect — is what grants entitlement, so if
the endpoint or its secret is wrong, a customer pays and gets nothing; that is
the one thing to verify by hand before going live.

---

## 5. Cron

`apps/<app>/vercel.json` declares it; Vercel picks it up on deploy:

```json
{ "crons": [{ "path": "/api/cron/drain", "schedule": "0 7 * * *" }] }
```

- **Hobby: once per day maximum.** A more frequent expression **fails the
  deployment**, and Hobby crons fire at any minute within the stated hour.
- **On Pro, change it to `*/5 * * * *`.** Scheduled email (welcome, trial
  ending, payment failed) and the knowledge-base refresh are only as timely as
  this tick, and a once-a-day drain means a trial warning can be a day late.
- Vercel sends `Authorization: Bearer $CRON_SECRET`; the route refuses anything
  else. Verify by hand:
  `curl -i -H "Authorization: Bearer $CRON_SECRET" https://…/api/cron/drain`
- Delivery is best effort and may repeat. The queue claims rows with
  `FOR UPDATE SKIP LOCKED` and every handler is idempotent, so a double fire is
  safe.

---

## 6. Deploy order, and the smoke test

1. Push to the authorised branch. Only the projects whose app or `packages/`
   changed will build.
2. Run the migration step (§2) if the schema changed.
3. Smoke test on the deployment URL, in this order:
   - `/` and `/pricing` render, `/legal/terms` shows the right company details;
   - `/login` → the link arrives by email → it lands on `/dashboard`;
   - `/dashboard` → do the app's activating action;
   - `/settings/billing` → Checkout (test card `4242 4242 4242 4242`) → back on
     billing with the plan visible. **Then check the Stripe dashboard's webhook
     log for a 200** — that is the proof entitlement came from the webhook;
   - `/admin?secret=$OPS_SHARED_SECRET` → the metrics table, with your signup in it;
   - `curl -H "Authorization: Bearer $CRON_SECRET" …/api/cron/drain` → JSON, and
     the welcome email arrives.
4. Only then flip Stripe to live keys, and only on Pro.

---

## 7. Custom domains (later)

No domains yet (D3). When the TheVillage domain is ready: add
`wagelens.<domain>` in **Settings → Domains**, then update `APP_BASE_URL` (the
magic link and every Stripe redirect are built from it) and Stripe's webhook
endpoint URL. Keep `SESSION_COOKIE_NAME` distinct per app if they share a parent
domain, or one app's cookie will be sent to the others.
