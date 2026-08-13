# BUILD_REVIEW — consolidated verification audit

**Auditor lens:** independent verification of the three remediation agents' work across all four
build-review documents, plus a concurrent-edit hunt and a re-run of the `CORRECTIONS.md` probes.
**Date:** 2026-08-13. **Tree:** `run-2/app` at `b7b6078` + uncommitted remediation.
**Method:** every command below was executed by the auditor. No verdict rests on an agent's report,
and where an agent's summary and the code disagree, the code is quoted.

---

## 0. The three commands, run by the auditor

| Command | Result |
|---|---|
| `npm run typecheck` | **clean**, zero diagnostics |
| `npm test` | **897 passed / 897**, 47 files, 79.01s |
| `npm run build` | **compiled**, **35 routes** (`/api/exports` is the new one) |

All three are green. That is the floor, not the headline.

Additionally executed against a **real PostgreSQL 16.13 cluster** (`ratepin_audit`, migrated fresh
by `npm run db:migrate` with `DATABASE_APP_PASSWORD`, seeded by `npm run seed` as the owner):

| Command | Result |
|---|---|
| `npx playwright test e2e/tenancy.spec.ts` | **5 passed** — real assertions, `test.fail()` gone |
| Production build booted on `postgres://ratepin_app@…` | `/signin` **200**, `/app` **307** anonymous |
| Cross-tenant HTTP reproduction (below) | **no leak** |

---

## 1. The tenancy fix, proved rather than accepted

The task named this specifically. Three independent proofs were run.

### 1.1 SQL layer — every policied relation, on the NOBYPASSRLS role

A probe written by the auditor (not the agents' test) seeded two tenants as the owner, then
enumerated `pg_policies` and read across the boundary as `ratepin_app`:

```
ROLE {"rolsuper":false,"rolbypassrls":false,"rolcanlogin":false}
POLICIED RELATIONS: 25  accounts, artifact_provenance, artifacts, credits,
  crosswalk_observation, filing_durations, filing_events, filings,
  form_acceptance_confirmations, memberships, meter_events, payroll_imports,
  payroll_line_fringe_credits, payroll_lines, payroll_weeks,
  payroll_worker_deductions, payroll_worker_weeks, project_band_events, projects,
  refunds, staleness_windows, subscriptions, users, wd_pins, workers
OWNER sees projects: 2      current_user = ratepin_app
LEAKS: none
cross-tenant UPDATE projects rows: 0
cross-tenant DELETE workers rows:  0
cross-tenant INSERT projects: error: new row violates row-level security policy
no-context projects: 0      ← fails CLOSED
```

The role posture is the one the policies are written `TO`, and `SET ROLE` genuinely engages RLS —
the owner sees 2 projects, the app role sees 1.

### 1.2 e2e — real Postgres, real assertions

```
✓ the tenant role › exists and cannot bypass row-level security
✓ … › crosses the tenant boundary through one function owned by a role nothing can connect as
✓ … › can provision a brand-new identity, the way sign-in does
✓ … › cannot provision one any other way
✓ … › shows one tenant nothing of another, on every policied relation
  5 passed (8.9s)
```

`e2e/tenancy.spec.ts` is **a real passing assertion, not a renamed expected failure**. The
`test.fail()` marker is deleted (confirmed in `git diff`), and the file now asserts the *shape* of
the fix: `prosecdef` true, owner `ratepin_provisioner`, `rolcanlogin` false, `rolbypassrls` false,
and that a direct `INSERT INTO users` / `INSERT INTO accounts` is refused with `permission denied`.

### 1.3 HTTP — the reviewer's own reproduction, re-run

A brand-new account (`mallory@evil.test`) provisioned and signed in through the product's own
`/auth/callback` against a server connected as `ratepin_app`:

```
callback=307   cookie rp_session set
mallory /app   app=200   grep "Route 17|Rio Vista|Gloucester|VA20260195|Alvarado" → (nothing)
victim filing by id      → 404
/api/artifacts/<victim>?kind=exception_report
                         → 404 {"error":"no such filing on this account"}
?next=//attacker.example.com/harvest → http://127.0.0.1:3199/signin?state=unknown
```

The security review's headline reproduction — another company's project, workers and SSN
last-fours on a stranger's dashboard — **does not reproduce**. The sentence
`no such filing on this account` is now true. The open redirect is closed.

---

## 2. Consolidated finding table — independent verdicts

Legend: **CLOSED** = defect gone, verified by the auditor. **PARTIAL** = the exploitable half is
closed, a named half is not. **OPEN** = present in the current tree.

### 2.1 Security and multi-tenancy

| # | Sev | Finding | Verdict | Auditor evidence |
|---|---|---|---|---|
| C-1 | CRIT | Total cross-tenant read on the deployable configuration | **PARTIAL** | Leak closed — §1.1–1.3. But ADR-011 requires **two** mechanisms and there is still one: 76 `execute` statements in `src/app/(app)/_lib/**`, and only **three lines** carry an account predicate (`billing.ts:301`, `:304`, `week.ts:263`). RLS is now genuinely enforced and `getDb()` asserts it (`src/db/index.ts:273`), so the risk is real-but-single-layer. |
| C-2 | CRIT | No authenticated request can execute on `ratepin_app` | **CLOSED** | The production build boots on `ratepin_app` and serves `/signin` 200, `/app` 200 signed-in. `auth_sessions` carries `email`, `resolveSession` joins nothing tenant-scoped, and provisioning crosses the boundary in one `SECURITY DEFINER` function owned by a NOLOGIN, NOBYPASSRLS role. |
| C-3 | CRIT | Live magic-link bearer tokens in plaintext in `email_outbox` | **OPEN** | `src/app/(app)/_actions/auth.ts:53` still writes `url: … issued.url` into `payload`. The purge exists (`session.ts:255`, `UPDATE email_outbox SET payload='{}'`) but `purgeDeadSessions` has **zero production callers** — `grep -rn purgeDeadSessions` returns only its definition and `tests/platform/tenancy.test.ts:391`. `retention.sweep` does not call it. |
| H-1 | HIGH | Open redirect + login CSRF / session fixation | **PARTIAL** | Redirect **closed** and verified over HTTP; `safeDestination` resolves and compares `origin`. The **CSRF/fixation half is untouched**: redemption is still an unauthenticated GET with no nonce cookie bound to the requesting browser and no interstitial naming the address being signed in. The reviewer's chain — attacker mails the victim a link minted for the *attacker's* address, victim uploads payroll into the attacker's tenant — still works. The route docblock now reads as though H-1 were fully addressed, which is the more dangerous form. |
| H-2 | HIGH | Cross-tenant destructive / billing-bearing writes through guessable ids | **CLOSED** | Proven at §1.1: cross-tenant `UPDATE` and `DELETE` affect **0 rows**, `INSERT` is refused by policy. Residual noted as NEW-1: the fix's `rowCount === 1` half was not added, so a cross-tenant write is a silent no-op rather than an error. |
| H-3 | HIGH | The archive can never serve a filing generated with a signatory | **OPEN (latent)** | `grep -n "signatory\|remarks" src/db/schema.ts drizzle/0000_init.sql` → **no matches**. `rebuildFiling` (`filings.ts:769-792`) does not pass them. The digest-equality test the reviewer asked for exists (`tests/web/app.test.ts:661`) but **never supplies a signatory**, so it passes trivially. No UI supplies one today, so it is a trap rather than a live 409. |

### 2.2 Correctness and arithmetic

| # | Sev | Finding | Verdict | Auditor evidence |
|---|---|---|---|---|
| C-1 | CRIT | `paidTotal` prices double-time hours at a rate never paid | **CLOSED — and the reviewer's proposed fix was correctly refused** | `compliance.ts` now computes `N10 = cashRate × (st+ot) + min(cashRate, dtRate) × dt`, with a counterexample recorded showing the reviewer's `straightTimeCash + doubleTimeCash` carries the identical defect mirrored (WD $30+$10, 40 ST + 8 DT, cash $35, dt $70 → $1,960 vs $1,920 required, straight-time rate $35 against $40). Verified against 29 CFR 5.31(b) fetched 2026-08-13. **Both** bounds asserted as properties. This is the strongest single piece of work in the remediation. |
| C-2 | CRIT | No violation finding reaches a customer-visible surface | **CLOSED** | `exceptions.ts:296-330` carries `WD_UNDERPAYMENT`, `FRINGE_BELOW_WD` and `PREMIUM_BELOW_STATUTORY` with a `rule` and `citation` each. A class-closing test asserts *every* flag in `findings` appears in the report. |
| C-3 | CRIT | The filing screen offers an eCPR download the route 409s | **OPEN** | `src/app/(app)/app/filings/[id]/page.tsx:246` still renders `<Link href={/api/artifacts/${id}?kind=ecpr_xml}>Download</Link>` whenever the chip is `ready`, and `api/artifacts/[id]/route.ts:59-68` returns **409 for every kind but `wh347_pdf` and `exception_report`**. The 409's text — "the filing screen states which condition is unmet" — is false: the screen said *Generated, not acceptance-tested* and offered the link. A live A3 dead end on the California artifact, which is a named product deliverable. |
| H-1 | HIGH | Column 7A can exceed 7B with no block | **CLOSED** | Four targeted regressions, incl. the two non-firing cases (blank 7B, 7B properly containing 7A). |
| H-2 | HIGH | Worker-scoped blocks vanish when the worker has no payroll lines | **CLOSED** | Four regressions; `deriveStatus` treats the worker channel as the filing channel. |
| H-3 | HIGH | An unfunded fringe plan's credit is silently accepted | **PARTIAL** | Engine half closed and tested (blocks, DRAFT, signature withheld, names 5.28(b)(5) and the 5.28(c) path). **No `unfunded` column exists on the ingest path**, so no real payroll can carry the fact the block needs. The gap is recorded at both call sites but the block is unreachable in production. |
| H-4 | HIGH | `PREMIUM_BELOW_STATUTORY` accuses DOL's own compliant oracle, pinned as expected | **CLOSED** | The fixture change was inspected line by line: it is a **correction, not a weakening**. `requiredTotal` / `paidTotal` are unchanged; only the accusation moved, replaced by `premiumRateNotReported`, a P-D that declines the conclusion. The rationale cites the self-contradiction (col7A on case-2 is $464.00 = $440.00 + the same $24.00 the flag called unpaid). |
| M-1 | MED | 29 CFR 3.5(j) truncated and presented as verbatim | **CLOSED** | Character-for-character test against the eCFR text; ten lettered paragraphs; both consent alternatives. |
| M-2 | MED | `rateCell` is a second rounding function outside `money.ts` | **PARTIAL** | Fixed in `artifacts/wh347/project.ts`. See **NEW-3**: the identical defect survives in the free surface. |

### 2.3 Autonomy and degradation

| # | Sev | Finding | Verdict | Auditor evidence |
|---|---|---|---|---|
| C1 | CRIT | The corpus never refreshes itself; A4 unimplemented in the worker | **CLOSED** | `buildIngestPort` at `src/worker/index.ts:323`, wired at `:408`; `ADAPTER_MODE=live` with a null ingest is a **boot failure** (`:497-501`), not a degraded mode. |
| C2 | CRIT | The $49 rate card is never delivered and its refund does not exist | **CLOSED** | `rate_card_ready` queued from `billing/webhook.ts:203` with an idempotency key; the token page is the document; `refundRateCardAction` executes from `settings/billing/page.tsx:457`. |
| C3 | CRIT | Deletion unreachable — the screen names a name the server rejects | **CLOSED** … **but see NEW-1** | The confirmation reads *this* account's name; all 8 outcomes render; trimmed and case-folded comparison. The screen is reachable. What it then performs is incomplete. |
| C4 | CRIT | The export button produces nothing obtainable | **CLOSED** | `GET /api/exports` is in the build's 35 routes; `src/platform/account/zip.ts` is a deterministic store-only ZIP; artifact bytes are rebuilt and digest-checked; unincludable entries are named in `manifest.json` rather than dropped. |
| H1 | HIGH | A job that kills the worker re-runs forever and starves the queue | **CLOSED** | `MAX_ATTEMPTS` now enforced in `reclaimExpiredLeases` (`queue.ts:239`) as well as `failJob` (`:163`) — the cap used to live only in the path a killed process never reaches. |
| H2 | HIGH | `billing.overage` not idempotent, silently undoes the revert | **CLOSED** | Period-idempotent; "calls Stripe once across three hourly runs before the webhook lands"; honours the revert for the rest of the period. |
| H3 | HIGH | Six billing outcomes redirect to a parameter no screen renders | **CLOSED** | `billingOutcomes()` (`settings/billing/page.tsx:77`) enumerates all six with a distinguishable sentence each and an explicit fallback for a status neither side enumerated. |
| H4 | HIGH | The four primitives are a closed union in types and hand-rolled JSX on 15 of 16 screens | **OPEN** | `grep -rn "rp-alert--blocked" src/app/(app)` → **6**; `grep -rn "RefusalView" src/app/(app)` → **2**. The `(free)` surface uses `RefusalView` consistently; the authenticated surface does not. Agent 3 disclosed this and gave an honest reason (the `Refusal` union has no shape for billing states without fabricating a regulatory `rule`/`citation`). Refusing to fabricate a citation is correct; the divergence remains. |

### 2.4 Claims and gates

| # | Sev | Finding | Verdict | Auditor evidence |
|---|---|---|---|---|
| C-1 | CRIT | Four of six gates have no write path, while both public pages describe them as live | **CLOSED** | Production call sites now exist: `recordFilingDuration` ← `_lib/filings.ts:748`; `recordAcceptanceConfirmation` ← `_actions/filings.ts:156`; `recordChaosCreditRun` ← `worker/jobs.ts:984`. |
| C-2 | CRIT | G5 is structurally unclearable — perfect autonomy yields a zero-day streak | **CLOSED** | Calendar-based streak; "unlocks on ninety days of zero inbound at fifty paying accounts" and "breaks the streak on a day that is actually over the ceiling". |
| C-3 | CRIT | `/legal` states a deletion promise the product does not perform | **CLOSED (as copy)** | `legal/page.tsx:45-50` imports `DELETION_ERASED` / `DELETION_RETAINED` / `ARTIFACT_RETENTION_YEARS` from `deletion.ts` — screen, executor, report and legal page are one enumeration. **NEW-1 reopens the underlying substance for one scope row.** |
| H-1 | HIGH | A human with commit access can promote a claim by editing copy | **PARTIAL** | `gateSentence` (`gates.ts:357`) takes only a `GateReading` and returns `null` unless the counter says `unlocked` — there is no override parameter. Both pages' sentences narrowed to what it enforces. **But `CLAIM_G1_RATE_CORRECTNESS … CLAIM_G5_AUTONOMY` still exist as env booleans** (`src/lib/config.ts:152-156`). They are currently **inert** — `claimUnlocked` has no rendered-surface consumer, only `src/scripts/canary.ts` JSON output — so nothing ships from them today. A dormant promotion surface is not the same as no promotion surface. |
| H-2 | HIGH | G6 advertises the staleness credit D10 forbids pre-chaos-test | **CLOSED** | The mechanism sentence is now a description of what the code does; the promise lives in the locked outcome branch of `gateSentence`, with a test pinning it. |
| H-3 | HIGH | "Consecutive green days" is neither consecutive nor anchored to today | **CLOSED** | Gap-break implemented; `STREAK_STALE_HOURS = 48` (`gates.ts:511`); tests refuse to unlock G1 on "thirty green runs one a month, last seen a year ago" and do unlock on thirty contiguous days ending today. |
| H-4 | HIGH | `filing_durations` and `form_acceptance_confirmations` are UPDATE/DELETE-able by the app role | **OPEN** | `drizzle/0000_init.sql:1774` — the shared helper issues `GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO ratepin_app` — and it is applied to `filing_durations` (`:1798`) and `form_acceptance_confirmations` (`:1799`). No append-only trigger on either. The two tables that are the evidence for G2 and G4 remain mutable by the web tier, one file from the rule saying they must not be. |
| H-5 | HIGH | `project_cap` / `worker_cap` divergence; a marketing claim rests on the gap | **CLOSED** | `grep -rn "project_cap\|worker_cap\|projectCap\|workerCap" src tests e2e drizzle fixtures` returns only **explanatory comments** and two negative assertions in `tests/web/marketing.test.ts:292-293`. Columns dropped from schema, migration, seed, catalog, pricing and the plans view. "No project caps" is now true by construction. |

---

## 3. Concurrent-edit hunt — what three agents editing one app broke

This section is the auditor's own, not a re-verdict on anyone's finding.

### NEW-1 · **CRITICAL** — account deletion no longer erases the customer's email address

`src/platform/account/deletion.ts:656-663`, against `drizzle/0000_init.sql:1811`.

The `auth` erasure step deletes the account's memberships and then de-identifies any user left
without one:

```sql
DELETE FROM memberships WHERE account_id = $account;      -- run()
-- then, in after():
UPDATE users
   SET email = 'deleted-…@deleted.invalid', deleted_at = now()
 WHERE deleted_at IS NULL
   AND NOT EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = users.id)
```

`users` is scoped **by membership**, because it has no `account_id`:

```sql
CREATE POLICY users_tenant_isolation ON users FOR ALL TO ratepin_app
  USING (EXISTS (SELECT 1 FROM memberships m
                 WHERE m.user_id = users.id AND m.account_id = ratepin_current_account()));
```

Deleting the memberships makes the user row invisible to the very statement that must rewrite it.
Executed by the auditor on `ratepin_app`:

```
users visible before membership delete: 1
memberships deleted: 1
users visible AFTER membership delete: 0
AUTH-STEP UPDATE users affected rows: 0
RESULT email still on row: {"email":"alpha.co@example.test","deleted_at":null}
```

The customer's email address survives a completed deletion, indefinitely. The step returns
`sessions + links` — a non-zero count — so the deletion report reads as success. This defect did
not exist before the tenancy remediation: it is created by RLS becoming real, and it is invisible
because `tests/platform/deletion.test.ts` does not use `asApp()` (see NEW-5). Under A3 there is no
support address, so a customer who notices has nowhere to go.

Cross-lens: this is the concrete cost of closing security H-2 without its second half. The fix
proposal was "`DELETE … AND account_id = $2`, **assert `rowCount === 1` and refuse otherwise**".
The predicate landed via RLS; the assertion did not, so a boundary violation is a silent no-op.

### NEW-2 · **HIGH** — money rendered as a float on three screens, disagreeing with the artifact

House rule: money is integer cents/micro-dollars, never a float. Four rendered surfaces divide a
`MilliRate` by 10 000 in floating point and call `toFixed(2)`:

- `src/app/(app)/rate-card/page.tsx:149,150`
- `src/app/(app)/rate-card/r/[token]/page.tsx:59`
- `src/app/(app)/app/projects/[id]/wd-change/page.tsx:323`
- `src/app/(app)/_components/import-wizard.tsx:362,365`

`toFixed` is IEEE-754 round-half-to-even on a binary approximation; `money.ts` is R1/R3 half-up.
They differ on real inputs:

```
milli 200050  ($20.0050)   screen (milli/10000).toFixed(2) = "20.00"
                           house-rule half-up               =  20.01
                           artifact (after M-2's fix)       =  "20.0050"
```

The rate card is the $49 product whose entire proposition is a rate pinned to a named
determination. It can print a rate half a cent below the pinned figure, and a different figure
from the WH-347 built from the same pin. M-2 was closed on the artifact and re-opened on the
screens.

### NEW-3 · **MEDIUM** — the M-2 rounding fix landed in one half of the removal

`src/artifacts/wh347/project.ts:104` records that `Math.round(magnitude / 100)` was "a second
rounding function, outside `money.ts`" and replaces it. The identical expression survives at
`src/app/(free)/_lib/format.ts:26` in `rate()`, which renders the public `/rates/[state]/[county]/[craft]`
pages and the free WH-347 preview — the acquisition surface. Same defect, same class, one file
fixed and one not.

### NEW-4 · **MEDIUM** — a remediation with no caller

`purgeDeadSessions` (`session.ts:243`) is the sole purge for expired sessions, consumed magic
links and outbox payloads. `grep -rn purgeDeadSessions` across the whole tree returns its
definition and one test. It is not a job kind, it is not called by `retention.sweep`, and it is
not called at boot. Dead sessions, consumed links **and the plaintext tokens of security C-3**
accumulate forever.

### NEW-5 · **MEDIUM** — one suite uses the RLS harness; the rest still test as superuser

`tests/helpers/pglite.ts` documents the point precisely: "a superuser BYPASSES EVERY RLS POLICY
SILENTLY. A suite that seeded and queried as the owner would pass with the policies deleted."
`asApp()` exists. Only `tests/platform/tenancy.test.ts` uses it. `deletion.test.ts`,
`metering.test.ts`, `credits.test.ts`, `dunning.test.ts`, `worker.test.ts` and every
`tests/web/**` suite run as the pglite superuser — i.e. **897 green tests do not exercise the
posture the product now runs in**. NEW-1 is what that gap costs; it is unlikely to be the only one.

### What the hunt did *not* find

- **No weakened tests.** `git diff HEAD -- tests/ e2e/` removes exactly three assertion families:
  `test.fail()` (correctly deleted), `expect(multi?.projectCap).toBeNull()` (deleted with the
  columns), and one `toContain('ok')` inside the rewritten `e2e/tenancy.spec.ts`. The canary
  fixture change (correctness H-4) was read line by line and is a substantiated correction with
  the underlying amounts unchanged.
- **No status derived two ways.** `deriveStatus` is the single producer; both the paid path
  (`_lib/filings.ts:520`) and the free path (`(free)/_lib/generate.ts:445`) call it, and the free
  path's comment names keeping them from drifting as the reason.
- **`project_cap`/`worker_cap` removal is complete** across schema, migration, seed, catalog,
  pricing, plans view and tests.

---

## 4. CORRECTIONS.md probes, re-run over every rendered surface

Probes extracted mechanically from `CORRECTIONS.md` §3.3 by the documented one-liner (6 entries,
35 regexes, all compiled), applied with the negation guard to **193 files** across `src/**` and
`public/**` — every `.ts`, `.tsx`, `.css`, `.html`, `.json`, `.md` from which a string can reach a
screen, an artifact or an email.

```
FILES SCANNED 193    BLOCKING HITS 0
hyg  X-5  src/classify/ladder.ts:21  /debarment/
          "…back wages, interest, withholding and three-year debarment under 29 CFR 5.12"
```

**Zero blocking hits.** The single advisory is a code comment, correctly attributed to 29 CFR 5.12
— the debarment authority — and is not the X-5 misattribution (which pairs a *civil money penalty*
figure with Davis-Bacon). It is `hygiene`, which §3.2 defines as recorded and never blocking.

The F-1…F-4 families were checked separately by string search. Nothing asserts accuracy,
acceptance, coverage or an outcome figure. `gateSentence` is the only producer of an outcome
sentence and it cannot produce one without a counter reading. `/pricing` explicitly states the
$49 "does not buy an acceptance guarantee", and the eCPR chip's label is the mandated
*generated, not acceptance-tested*.

---

## 5. Verdict

### Is this shippable?

**No — not to a paying customer on Davis-Bacon work, on three specific blockers.** It is much
closer than it was, and the tenancy work in particular is genuinely finished rather than
asserted.

**Blocking:**

1. **NEW-1 — deletion does not delete.** A stated erasure silently performs nothing, the report
   says it succeeded, and under A3 the customer has no one to tell. This is a data-protection
   failure with an autonomy failure stacked on top. It is a small fix (run the `users` update
   through the provisioner function, or before the membership delete) and it must be accompanied
   by running `deletion.test.ts` under `asApp()`.
2. **Security C-3 — plaintext magic-link tokens in `email_outbox`, forever.** Any read of one
   table is account takeover for every sign-in in the last 15 minutes plus a permanent record of
   every address that ever signed in. `ratepin_app` holds `SELECT` on it and it carries no tenant
   policy. The purge that would bound it has no caller.
3. **Correctness C-3 — the eCPR download is a live dead end.** The filing screen offers a
   California artifact and the route refuses it every time, with a message asserting the screen
   explained why. The CA eCPR is a headline deliverable and California is the largest
   prevailing-wage market in the country.

**Should ship with the blockers fixed, and these known open:** security H-1's login-CSRF half,
security H-3's unpersisted signatory, correctness H-3's missing `unfunded` ingest column, claims
H-4's mutable evidence tables, autonomy H4's hand-rolled refusals, NEW-2 through NEW-5.

### The honest list of what Ratepin does not do

Stated plainly, because the product's own standard is that an unmeasured claim is not written
into a rendered string.

1. **It does not delete your email address when you delete your account.** It says it deletes
   sign-in identity; the statement that would do it matches zero rows.
2. **It cannot produce the California eCPR XML.** The screen offers it; the download refuses it.
3. **It cannot return a certified payroll that was generated with a named signatory.** The
   signatory is not persisted, so the rebuild renders a different document and the digest check
   refuses to serve it. No screen supplies a signatory today, so this is a trap rather than a
   loss — but the archive guarantee is narrower than "we can always rebuild it".
4. **It cannot represent an unfunded fringe plan.** The engine will block the line correctly the
   moment it is told; nothing on the ingest path can tell it.
5. **It does not defend the tenant boundary twice.** RLS is real, enforced, and asserted at boot.
   The repository predicates ADR-011 names as the *first* mechanism do not exist — 3 of 76
   statements carry one. A single `SET ROLE`, a superuser connection string, or one
   `withTenant` forgotten in a future edit is the whole boundary.
6. **A magic link is not bound to the browser that asked for it.** Anyone who can get a victim to
   click a link can put that victim inside an account the attacker controls.
7. **Its evidence tables are editable by the tier that reports from them.** G2 and G4 rest on two
   tables the web role may `UPDATE` and `DELETE`.
8. **Six of six gates are locked, and no outcome number is claimed anywhere.** That is correct
   and honest — but it means the product currently makes no measured claim about accuracy,
   acceptance, coverage, time saved, autonomy or the staleness credit. Everything it says about
   itself is a description of a mechanism.
9. **897 tests do not test the configuration it runs in.** One suite uses the NOBYPASSRLS
   harness. The rest are superuser-green.
10. **Rate figures on three screens can disagree, by a half-cent, with the artifact built from
    the same pin.** On a product whose proposition is that a rate is pinned and reproducible.

### What is genuinely finished

Worth recording, because it is the larger share. The tenancy boundary is real and independently
reproduced three ways. The `paidTotal` correction is better than the fix that was proposed to it,
refuses the obvious repair with an executed counterexample, and cites primary law fetched the same
day. The H-4 fixture correction removed an accusation against DOL's own compliant worked example
without moving a single amount. `project_cap`/`worker_cap` is cleanly gone. The gates cannot be
promoted by editing copy. And the CORRECTIONS register is clean across every rendered surface.

---

*Auditor's note on method: this document takes nobody's word. Where an agent's report and the tree
disagreed — security C-3 reported closed by one lens and open by another, correctness C-3 claimed
by neither — the tree decided. Three of the twenty-nine CRITICAL/HIGH findings were verdicted
differently from the reporting agent's own summary, and five defects in this document were found
by the auditor rather than reported by anyone.*
