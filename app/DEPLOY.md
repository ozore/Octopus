# Deploying Clausewright to Fly.io

One command once credentials exist — `ops/deploy-fly.sh` creates the app,
a managed Postgres 16 (`clausewright-db`), stages the secrets, deploys via
Fly's remote builders (the release command runs the committed SQL
migrations), and smoke-checks `/api/health`.

## Required credentials (Twelve-Factor III: env only, never committed)

| Var | Where to get it | Notes |
|---|---|---|
| `FLY_API_TOKEN` | fly.io dashboard → Tokens (`fly tokens create deploy`) | Scope to the app once it exists |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Powers classify/draft/critique |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → API keys | **Start with `sk_test_…`** — G-gates: no real charges until founder review |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → endpoint `https://<app>.fly.dev/api/stripe/webhook` | `whsec_…` |
| `RESEND_API_KEY` | resend.com | Also verify the sending domain before live email |

## Run

```bash
export FLY_API_TOKEN=... ANTHROPIC_API_KEY=... STRIPE_SECRET_KEY=sk_test_... \
       STRIPE_WEBHOOK_SECRET=whsec_... RESEND_API_KEY=...
./ops/deploy-fly.sh clausewright iad
```

## Post-deploy checklist

1. `/api/health` reports `corpus_release`, `prompt_bundle_hash` and the pinned model IDs — compare against the repo (a mismatch means the release serves an unintended corpus).
2. Create the Stripe webhook endpoint pointing at the deployed URL, then update `STRIPE_WEBHOOK_SECRET` and `fly deploy` again (staged secrets apply on deploy).
3. Run one synthetic notice end-to-end with Stripe test card `4242…`; confirm the POA renders only after payment (BUILD_REVIEW C-1..C-3 regression).
4. Keep `TIME_GUARANTEE_ADVERTISED=false` and Stripe in test mode until the launch gates in the root README are cleared.

## Local Docker note

`docker build` fails inside this development container because its TLS-intercepting
egress proxy is not trusted by build containers — an environment artifact, not a
Dockerfile defect (`npm ci`, `tsc`, `next build` and all 347 tests pass on the host).
Use `fly deploy --remote-only`, which builds on Fly's builders.
