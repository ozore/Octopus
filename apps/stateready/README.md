# StateReady

Licence, continuing-education and readiness tracking for multi-state HVAC,
plumbing and electrical contractors. Every date it shows you is derived from the
state board's own published rule, and carries the page it came from and the day
we last checked it. Where a board publishes nothing, it says so instead of
estimating.

```bash
npm ci                                          # from the repo root
npm run dev --workspace apps/stateready         # http://localhost:3000, mock adapters, PGlite
npm test --workspace apps/stateready            # 290 tests, no network, no keys
npm run build --workspace apps/stateready

cd apps/stateready && PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test
```

Everything runs with **no credentials at all**: `ADAPTER_MODE=mock` binds the
in-repo Stripe and Resend fakes, `DATABASE_DRIVER=pglite` boots a real Postgres
in-process. There is no inbox in mock mode, so the sign-in link is shown on the
login page (`src/env.ts` refuses that mode in production).

- **`BUILD.md`** — the module map for the next agents: who owns what, what not to
  edit, what "done" means, the spec deviations and the platform requests.
- **`CLAUDE.md`** — the memory: the decisions worth arguing with and the four
  bugs that cost the most to find.

---

## The three things that make this app what it is

### 1. The rules engine is a pure function, and it was built first

`src/lib/rules/` takes a licence, a knowledge-base record and today's civil date
and returns deadlines. No clock, no I/O, no database. That is what lets the
69-case golden set — every one of the 23 licence types in the knowledge base,
three issue dates each — run before any schema exists, and it means a wrong
deadline is reproducible from two JSON blobs in a bug report.

The behaviours it exists for:

- North Carolina's **electrical** licence renews on its anniversary and its
  **plumbing** licence on 31 December. Same state, two boards, two algorithms.
- A Florida **certified** licence renews 31 August in an even year, a
  **registered** one in an odd year — decided by a letter in the licence code.
- A Texas electrical **contractor** licence needs no continuing education, and
  the board says so in terms; the Master Electrician named on it needs four
  hours.
- Florida's fourteen CE hours are **six mandates**, not a total. Fourteen hours
  of general construction CE is still a failure to renew, and the shortfall is
  itemised by subject.

### 2. It refuses to estimate

A value the board does not publish renders as **"not yet verified"**, with what
we read and a link to the board — never a number, never a blank, never a zero.
A value we have not re-checked in 180 days stops being shown as verified. A
reading that took one inference carries the note that explains it, wherever the
date appears. Twenty-three of twenty-three bond amounts in the launch data are
unknown, and `/coverage` says so on a public page.

### 3. The board is the product's surface, and paper is what leaves the building

The shell is a full-width top bar over a full-width board — no left rail, unlike
both sibling apps. Status is never colour alone: fill, edge, glyph, hatch and the
word, in one four-word vocabulary (READY / AT RISK / LAPSED / NOT TRACKED). Print,
the PDF, the shared readiness link, the technician card and every email render in
the **paper** theme, because an alert forwarded to a general manager must not
arrive as a dark screenshot.

---

## Where each piece lives

| Path | What |
|---|---|
| `kb/kb-data`, `kb/ontology` | the versioned knowledge base — **a byte-identical copy** of `phase-4-revenue/stateready/`, checked in CI (`npm run kb:check`) |
| `src/lib/kb/` | M14: loader, the ontology schema and the thirteen gates ported from `validate.py`, typed accessors, the 180-day staleness rule, snapshots, the drift queue |
| `src/lib/rules/` | M5: the pure engine — dates, tokens, the honesty rule, CE, derivation |
| `src/lib/repos/` | the database side: company, roster, licences, deadlines, dashboard, alerts, audit |
| `src/components/` | the tile grid, the runway, the status chip, the provenance line, the refusal state, the disclaimer |
| `src/app/(marketing)/` | landing placeholder, `/coverage`, `/pricing`, `/help`, `/legal/[doc]` |
| `src/app/(app)/` | dashboard, roster, roster import, settings, company profile, billing |
| `drizzle/` | this app's migrations only; the platform's are applied first |
| `tests/`, `e2e/` | 290 unit and integration tests on PGlite; 7 Playwright specs |

## Deploying

See `phase-4-revenue/DEPLOY_VERCEL.md`. Three StateReady-specific things:

- **`CRON_EXPRESSION` must match `vercel.json`.** `DRAIN_INTERVAL` is derived
  from it at boot, and a sub-daily expression with `VERCEL_PLAN=hobby` **fails
  the build**: Vercel Hobby allows one invocation a day and silently coerces
  anything more frequent, and an alerting product whose schedule is silently
  degraded is worse than no alerting product. On Pro, change both to
  `0 * * * *` and set `VERCEL_PLAN=pro`. No code changes.
- **`COMPANY_ADDRESS` is a launch blocker, not a TODO.** CAN-SPAM needs it and
  `specs/12` fails the build without it.
- **Migrations are not run by the build.** `npm run db:migrate` is a separate
  admin step.
