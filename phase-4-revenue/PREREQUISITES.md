# Founder prerequisites tracker

Status legend: `todo` (founder), `given`, `n/a`, `later`.

| # | Item | Needed for | Status | Notes |
|---|---|---|---|---|
| P1 | Vercel plan upgraded to Pro | charging money (Hobby forbids commercial use) | todo | before Stripe live |
| P2 | Vercel: three projects on this repo with Root Directory `apps/wagelens`, `apps/certly`, `apps/stateready` (or a Vercel token so the orchestrator creates them) | deployment | todo | exact click-path in `DEPLOY_VERCEL.md` once the apps exist |
| P3 | Vercel: fix the current `octopus` project Root Directory to `app` (Clausewright currently serves a 404 from the repo root) | Clausewright | todo | independent of phase 4 |
| P4 | Neon Postgres (Vercel Marketplace) one database per app, `DATABASE_URL` set per project | apps | todo | free tier is enough to start |
| P5 | Stripe: test-mode secret key + webhook secret per project, then products and prices from the list we hand over | billing | later | list produced at the end of wave 2 |
| P6 | Resend account, TheVillage domain verified (SPF, DKIM, DMARC), `RESEND_API_KEY` | magic links, receipts, lifecycle emails | todo | DNS access on the TheVillage domain required |
| P7 | Anthropic API key with a spending cap, `ANTHROPIC_API_KEY` | Certly extraction, StateReady playbooks, WageLens classification assistant | todo | |
| P8 | ~~api.data.gov / SAM.gov API key~~ | WageLens wage-determination ingestion | n/a | Corrected 2026-09-03: the documented API page returns 404; SAM.gov's own front-end endpoints (`sam.gov/api/prod/sgs/v1/search/?index=dbra`, `sam.gov/api/prod/wdol/v1/wd/{ref}/{rev}`) work with no key. See `wagelens/KNOWLEDGE_BASE.md` §6. |
| P9 | A sending mailbox on the TheVillage domain for outbound (e.g. `wagelens@` or `hello@`), warmed up 2 to 3 weeks, connected to this session's Gmail connector if Gmail | outbound drafts and sends | todo | separate from the product's transactional domain if possible |
| P10 | Physical postal address and support email for TheVillage | legal pages, CAN-SPAM footer | todo | |
| P11 | Final names for the three apps after the naming pass | branding | later | recommendation in each `IDENTITY.md` |
| P12 | Validation of the three offers (prices, guarantees) | Stripe products | later | in each `OFFER.md` |
| P13 | Optional: PostHog project key | analytics mirror | later | own events table works without it |
| P14 | Optional: CSLB full licence file ($235) and other paid registers | widen Certly and StateReady lists | later | |

## Hand-over the founder will receive at the end of wave 2

- `STRIPE_SETUP.md`: the exact products, prices, intervals, trial settings and metadata to create, and the env variable each id goes into.
- `DEPLOY_VERCEL.md`: per-project settings and env variables.
- `GO_LIVE_CHECKLIST.md`: test purchase, webhook check, legal pages, DNS, first outbound batch approval.
