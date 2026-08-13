# BUILD_REVIEW — consolidated verification audit, round 2

**Auditor lens:** independent verification of the three remediation agents who closed what round 1
left OPEN, plus a concurrent-edit hunt and a re-run of the `CORRECTIONS.md` probes.
**Date:** 2026-08-13. **Tree:** `run-2/app` at `9a5eb9e` + uncommitted remediation.
**Method:** every command in §0 was executed by the auditor. No verdict rests on an agent's report.
Where an agent's summary and the code disagree, the code is quoted. Four of the load-bearing
claims were re-proved by **probes the auditor wrote**, not by re-reading the agents' tests — the
whole point being that a test can assert the wrong layer and still be green (§3, NEW-6).

---

## 0. The three commands, run by the auditor

| Command | Result |
|---|---|
| `npm run typecheck` | **clean**, zero diagnostics |
| `npm test` | **937 passed / 937**, **49 files**, 86.20s |
| `npm run build` | **compiled** in 5.0s, **35 routes** |

Round 1 measured 897/47 and 35 routes. The remediation added **40 tests and 2 files** and no route.

Additionally, the auditor wrote a throwaway probe suite (`tests/zz-auditor-probe.test.ts`, deleted
after the run) against the PGlite harness with `SET ROLE ratepin_app` — the NOBYPASSRLS posture
production runs in — reusing **no assertion any agent wrote**:

| Probe | Result |
|---|---|
| Credential recovery from `email_outbox` + `auth_magic_links` | **4 attacks refused** |
| Deletion erases the email, provisioned through the real signup path | **passed** |
| `filing_durations` / `form_acceptance_confirmations` append-only | **UPDATE and DELETE refused** |
| Direct `INSERT` into `users` / `accounts` / `memberships` on `ratepin_app` | **all three denied** |

**What this round did NOT re-run**, stated so nothing is inherited silently: the real
PostgreSQL 16.13 cluster, `npx playwright test e2e/tenancy.spec.ts`, and the HTTP cross-tenant
reproduction. Those are round 1's evidence (§1), and nothing in this round's diff touches the
policies or the roles they exercised — but they were not re-executed, so they are cited as
**prior-round evidence**, not as this round's.

---

## 1. The tenancy fix — prior-round evidence, carried forward

Round 1 proved the boundary three independent ways: a SQL probe over all 25 policied relations on
the NOBYPASSRLS role (`LEAKS: none`, cross-tenant `UPDATE`/`DELETE` 0 rows, `INSERT` refused by
policy, no-context reads fail closed); a 5-passing `e2e/tenancy.spec.ts` with `test.fail()` deleted;
and the security review's own HTTP reproduction re-run against a server connected as `ratepin_app`,
which **did not reproduce**.

This round re-verified the half that the remediation could have broken — the provisioning door —
directly, and it holds:

```
INSERT INTO users       … on ratepin_app → denied
INSERT INTO accounts    … on ratepin_app → denied
INSERT INTO memberships … on ratepin_app → denied
```

`src/platform/schema.ts:234` is the **only** `INSERT INTO accounts` in `src/**` outside the seed
script. That matters more than it did last round, because a new invariant now rests on it (§3,
NEW-1).

---

## 2. Consolidated finding table — independent verdicts

Legend: **CLOSED** = defect gone, verified by the auditor. **PARTIAL** = the exploitable half is
closed, a named half is not. **OPEN** = present in the current tree.

**Round 2 tally: 26 of 29 CRITICAL/HIGH CLOSED, 3 PARTIAL, 0 OPEN.** Round 1's tally was 19
CLOSED, 6 PARTIAL, 4 OPEN. Every finding round 1 left OPEN is now closed. The residue is three
PARTIALs, all structural rather than exploitable, and five hunt findings — **two of them new**.

### 2.1 Security and multi-tenancy

| # | Sev | Finding | R1 | R2 | Auditor evidence |
|---|---|---|---|---|---|
| C-1 | CRIT | Total cross-tenant read on the deployable configuration | PARTIAL | **PARTIAL** | Leak closed (§1). ADR-011 requires **two** mechanisms and there is still one. Precisely measured this round by parsing every `` .execute(sql`…`) `` block under `src/app/(app)/_lib/`: **76 blocks, 2 carrying an explicit `account_id =` predicate** (`week.ts`, `billing.ts`). RLS is real and `getDb()` asserts it at boot; the repository predicates ADR-011 names as the *first* mechanism do not exist. |
| C-2 | CRIT | No authenticated request can execute on `ratepin_app` | CLOSED | **CLOSED** | Round 1 booted the production build on `ratepin_app`. Re-verified this round from the other side: the provisioning door is one `SECURITY DEFINER` function and the three direct inserts are denied. |
| C-3 | CRIT | Live magic-link bearer tokens in plaintext in `email_outbox` | OPEN | **CLOSED** | Proved by the auditor's own attack, not by reading the fix. `_actions/auth.ts:62` queues `link_id`. The probe stole **every string at every depth** from both rows on `ratepin_app`, then: (a) no string matches `/auth/callback` or `[?&]token=`; (b) **every** string tried as a token was refused by `redeemMagicLink`; (c) no string hashes to the digest at rest — the row is born from `hashToken(newToken())` with the token discarded (`magic-link.ts:149`), so it is *unredeemable*, not merely unsent; (d) after `drainOutbox` mints and mails a working token, the row still contains it nowhere. `assertNoRedeemableToken` (`outbox.ts:88`) throws at the write site so a future template cannot reintroduce it. |
| H-1 | HIGH | Open redirect + login CSRF / session fixation | PARTIAL | **PARTIAL** | Redirect **closed** — `safeDestination` resolves and compares origin. The **CSRF/fixation half is untouched**: `auth/callback/route.ts` is still an unauthenticated `GET` that sets the session cookie with no nonce bound to the requesting browser and no interstitial naming the address being signed in. The reviewer's chain still works. Round 1's aggravating factor is gone — the docblock no longer reads as though H-1 were fully addressed; it now claims only the redirect fix. |
| H-2 | HIGH | Cross-tenant destructive / billing-bearing writes through guessable ids | CLOSED | **CLOSED** | Predicate enforced by RLS (§1). Residual unchanged and worth restating: `grep -rn "rowCount === 1"` over `_lib` and `platform` returns **nothing**, so a cross-tenant write is still a silent no-op rather than an error. |
| H-3 | HIGH | The archive can never serve a filing generated with a signatory | OPEN (latent) | **CLOSED** | `filings.signatory_name / signatory_title / remarks` exist in `drizzle/0000_init.sql:1270-1272` and `src/db/schema.ts`, written by `generateFiling`, read back by `rebuildFiling`. The digest-equality test now **supplies both** (`app.test.ts:704`) and asserts they reach the bytes *and* the row — and a companion test (`:739`) proves a filing without the signatory renders **different** bytes, which is what stops the test going trivial again. That companion is the part round 1 asked for and did not get. |

### 2.2 Correctness and arithmetic

| # | Sev | Finding | R1 | R2 | Auditor evidence |
|---|---|---|---|---|---|
| C-1 | CRIT | `paidTotal` prices double-time hours at a rate never paid | CLOSED | **CLOSED** | Unchanged, and still the strongest single piece of work in the remediation: `N10 = cashRate × (st+ot) + min(cashRate, dtRate) × dt`, with an executed counterexample refusing the reviewer's own proposed fix, against 29 CFR 5.31(b). |
| C-2 | CRIT | No violation finding reaches a customer-visible surface | CLOSED | **CLOSED** | Unchanged. |
| C-3 | CRIT | The filing screen offers an eCPR download the route 409s | OPEN | **CLOSED** — with a new reachability gap, NEW-7 | `ecprArtifact` (`_lib/filings.ts:1579`) is now the single function the screen and `api/artifacts/[id]/route.ts:62` both call, so the two cannot hold different opinions. The screen renders `Download` **only** on the arm carrying an `EcprArtifact` (`filings/[id]/page.tsx:237-241`) — a link the route cannot serve is unconstructible. The route serves `application/xml` with rebuild-and-digest comparison, and returns the refusal **whole**, with its per-worker exception report, instead of the old blanket 409 whose text was false. The DRAFT gate is real and tested (`render.ts:393`; `app.test.ts` "refuses to emit an XML for a DRAFT filing"). A lint asserts every `kind` the screen links is a `kind` the route names. **The defect as written is gone. What the artifact still cannot do is NEW-7.** |
| H-1 | HIGH | Column 7A can exceed 7B with no block | CLOSED | **CLOSED** | Unchanged. |
| H-2 | HIGH | Worker-scoped blocks vanish when the worker has no payroll lines | CLOSED | **CLOSED** | Unchanged. |
| H-3 | HIGH | An unfunded fringe plan's credit is silently accepted | PARTIAL | **PARTIAL** | Unchanged and untouched by this round. `grep -rn unfunded src/` returns **one comment** (`_lib/filings.ts:324`) and no column, no CSV target, no mapping UI. The engine will block correctly the moment it is told; nothing on the ingest path can tell it. |
| H-4 | HIGH | `PREMIUM_BELOW_STATUTORY` accuses DOL's own compliant oracle | CLOSED | **CLOSED** | Unchanged. A correction, not a weakening: amounts identical, accusation replaced by a P-D. |
| M-1 | MED | 29 CFR 3.5(j) truncated and presented as verbatim | CLOSED | **CLOSED** | Unchanged. |
| M-2 | MED | `rateCell` is a second rounding function outside `money.ts` | PARTIAL | **PARTIAL** | Fixed in `artifacts/wh347/project.ts`; survives at `(free)/_lib/format.ts:26`. See NEW-3, whose severity this round **narrows** on evidence. |

### 2.3 Autonomy and degradation

| # | Sev | Finding | R1 | R2 | Auditor evidence |
|---|---|---|---|---|---|
| C1 | CRIT | The corpus never refreshes itself; A4 unimplemented | CLOSED | **CLOSED** | Unchanged. |
| C2 | CRIT | The $49 rate card is never delivered and its refund does not exist | CLOSED | **CLOSED** | Unchanged. |
| C3 | CRIT | Deletion unreachable — the screen names a name the server rejects | CLOSED | **CLOSED** | And what it performs is now complete — NEW-1 is closed below. |
| C4 | CRIT | The export button produces nothing obtainable | CLOSED | **CLOSED** | Unchanged. |
| H1 | HIGH | A job that kills the worker re-runs forever | CLOSED | **CLOSED** | Unchanged. |
| H2 | HIGH | `billing.overage` not idempotent | CLOSED | **CLOSED** | Unchanged. |
| H3 | HIGH | Six billing outcomes redirect to a parameter no screen renders | CLOSED | **CLOSED** | Unchanged. |
| H4 | HIGH | The four primitives are hand-rolled JSX on 15 of 16 screens | OPEN | **CLOSED** — with a rendering defect, NEW-6 | `grep -rn "rp-alert--blocked" src/app/(app)` → **0** (was 6). `RefusalView` → **16 files** (was 2). One implementation at `src/app/_components/refusal.tsx`; `(free)` re-exports it. The fifth member `P-S` has **no `rule` and no `citation` field** (`types.ts:681-696`), so a billing state cannot borrow a regulation's authority — enforcement by absence, the same mechanism that keeps a support address out of the union. `REFUSAL_PRIMITIVES` still lists exactly the four **claim** primitives; `ClaimRefusalPrimitive = Exclude<RefusalPrimitive, 'P-S'>` makes that a type, not a convention. `productStateHasAWayOut` requires exactly one of `clearedBy` / `clearsItself`. Two exhaustive switches broke on the new member and were extended — the mechanism working. **The structural finding is closed. The renderer drops the way out for one arm: NEW-6.** |

### 2.4 Claims and gates

| # | Sev | Finding | R1 | R2 | Auditor evidence |
|---|---|---|---|---|---|
| C-1 | CRIT | Four of six gates have no write path | CLOSED | **CLOSED** | Unchanged. |
| C-2 | CRIT | G5 is structurally unclearable | CLOSED | **CLOSED** | Unchanged. |
| C-3 | CRIT | `/legal` states a deletion promise the product does not perform | CLOSED (as copy) | **CLOSED (copy and substance)** | The copy was one enumeration already; the substance now performs, NEW-1 below. |
| H-1 | HIGH | A human with commit access can promote a claim by editing copy | PARTIAL | **CLOSED** | `gateSentence(reading: GateReading)` (`platform/ops/gates.ts:357`) returns `outcome: null` unless the counter says `unlocked`, and takes no override parameter. `CLAIM_G1…G5` and `claimUnlocked` are **gone from `src/lib/config.ts`, `.env.example` and `README.md`** — `grep -rn CLAIM_G src` returns only explanatory comments and two tests that set all five and assert they parse to nothing (Zod strips unknown keys). Both pages were narrowed *truthfully*: "Every performance claim on this site" → "The gate outcome sentences below", "demoted automatically" → "on the next reading", plus the newly-true "there is no configuration value that can unlock a gate". A dormant promotion surface is gone rather than documented. |
| H-2 | HIGH | G6 advertises the staleness credit D10 forbids pre-chaos-test | CLOSED | **CLOSED** | Unchanged. |
| H-3 | HIGH | "Consecutive green days" is neither consecutive nor anchored to today | CLOSED | **CLOSED** | Unchanged. |
| H-4 | HIGH | `filing_durations` and `form_acceptance_confirmations` are UPDATE/DELETE-able | OPEN | **CLOSED** | Proved from the catalog and then live, not from the migration text. `ratepin_enable_tenant_rls` takes `p_append_only` and **never issues the mutating grant at all** for those two (`0000_init.sql:1828-1833`), rather than granting and revoking. `information_schema.role_table_grants` for `ratepin_app` on both tables: `SELECT` ✓, `INSERT` ✓, `UPDATE` ✗, `DELETE` ✗. Both `*_append_only` triggers present in `pg_trigger`. Live attempt on `ratepin_app`: `UPDATE` **threw**, `DELETE` **threw**, the row's value unchanged. Checked for the classic concurrent-edit failure — a grant revoked in one place and re-granted in another — by reading every `GRANT`/`REVOKE` after the two call sites: **no re-grant**. |
| H-5 | HIGH | `project_cap` / `worker_cap` divergence | CLOSED | **CLOSED** | Unchanged. |

---

## 3. Concurrent-edit hunt — what three agents editing one app did to each other

Round 1's five hunt findings, re-verdicted, plus two the auditor found this round.

### NEW-1 · **CLOSED** — account deletion now erases the customer's email address

Round 1's blocker. The fix is ordering plus a definer function, and the reasoning is right: the
erasure runs **first**, while the memberships that answer "whose identity is this?" still exist,
through `ratepin_erase_identity` (`0000_init.sql:1990`) — `SECURITY DEFINER`, owned by
`ratepin_provisioner`, with one new `UPDATE` policy whose `WITH CHECK` admits **only** a tombstone
(`deleted_at IS NOT NULL AND email LIKE 'deleted-%@deleted.invalid'`). It re-counts survivors and
`RAISE`s if any live address remains, so a failed erasure leaves `executed_at` unset and the hourly
job retries — fail closed, rather than a report claiming an erasure that did not happen.

Proved by the auditor **through the real signup path**, because a fixture that seeds as the owner
would not have exercised it:

```
provisioned via redeemMagicLink on ratepin_app  → account + user + billing index row
requestAccountDeletion   (asApp, typed '  coastline INSULATION ')  → ok
dueDeletions(day 8)      (asApp)  → [the account]
executeAccountDeletion   (asApp)  → ok
read back AS OWNER: email = deleted-<digest>-<id8>@deleted.invalid, deleted_at set
SELECT count(*) FROM users WHERE email LIKE '%coastline%'  → 0
```

The read-back is as the **owner**, so no policy can satisfy the assertion by hiding the row.

Round 1 also found `dueDeletions` returning `[]` for every account, which meant the seven-day
promise ran on a schedule that could not fire. It now fans out from `billing_account_index`. **That
moves the deletion job's correctness onto a new invariant** — "every account has an index row" —
so the auditor checked it rather than accepting the docblock: `ratepin_provision_identity` writes
that row in the same transaction as the account (`schema.ts:252`), and `schema.ts:234` is the only
`INSERT INTO accounts` in `src/**`. The invariant holds by construction. It is now load-bearing for
data protection and should be treated that way.

### NEW-2 · **OPEN** — money rendered as a float on four screens

Unchanged and unclaimed by any agent. Four surfaces divide a `MilliRate` by 10 000 in floating
point and call `toFixed(2)`: `rate-card/page.tsx:142,143`, `rate-card/r/[token]/page.tsx:61`,
`projects/[id]/wd-change/page.tsx:307`, `_components/import-wizard.tsx:371`. Reproduced this round:

```
milli 200050   screen (milli/10000).toFixed(2)  = "20.00"
               money.ts R1/R3 half-up            =  20.01
```

`toFixed` is IEEE-754 on a binary approximation; `money.ts` is half-up. The rate card is the $49
product whose whole proposition is a rate pinned to a named determination, and it can print a rate
half a cent below the pinned figure.

### NEW-3 · **OPEN, severity narrowed** — a second rounding function survives on the free surface

`(free)/_lib/format.ts:26` still contains `Math.round(magnitude / 100)` — the expression M-2 removed
from `artifacts/wh347/project.ts` as "a second rounding function, outside `money.ts`". Round 1 called
it "same defect, same class". This round measured it: on the probe input above it returns **20.01**,
agreeing with `money.ts` and disagreeing with the screens of NEW-2. So it is **duplication and drift
risk, not a live wrong number** — a real M-2 violation, but a weaker one than round 1 recorded, and
that correction is owed.

### NEW-4 · **CLOSED** — the remediation with no caller now has one

`purgeDeadSessions` is invoked from `retention.sweep` (`worker/jobs.ts:807`), returning counts by
class into the sweep's report, and placed **before** the object-store branch precisely because that
branch can return early — a class whose sweep depends on an optional adapter must not be able to
skip a class that depends on nothing. Dead sessions, consumed links and sent payloads are now
bounded.

### NEW-5 · **PARTIAL** — the RLS harness spread, but most suites are still superuser-green

`asApp()` was used by one suite in round 1. It is now used by six: `platform/tenancy`,
`platform/deletion`, `platform/magic-link-outbox`, `classify/aggregate`, `classify/crosswalk`,
`smoke`. That is the right six — they are where NEW-1 hid. But **43 of 49 files still run as the
pglite superuser**, which bypasses every policy silently, so 937 green tests still do not
predominantly exercise the posture the product runs in. Two deliberate exceptions are correct and
recorded: the append-only and `retention.sweep` cases run as owner because they assert grants and a
trigger the owner cannot escape either.

### NEW-6 · **HIGH, NEW** — a P-S names a way out that the renderer throws away

This is the finding the audit method exists for: the invariant is enforced in the **data** and
asserted by a test on the data, while the **render** silently drops it.

`RefusalAction` has two members, and `ActionLine` returns `null` for one of them:

```tsx
// src/app/_components/refusal.tsx:46-47
function ActionLine({ action }: { readonly action: RefusalAction }): React.ReactElement | null {
  if (action.kind === 'onThisScreen') return null;
```

The type's own docblock says `onThisScreen` "is for the case where the control is a form submit
**rendered inside the block** — the label still lives in the refusal value so the sentence and the
button cannot drift apart" (`types.ts:566-568`), and the component's docblock claims "The way out is
rendered LAST and always … so this block cannot end on a statement of a problem with nothing after
it" (`refusal.tsx:165-169`). Both are false wherever the control is *not* passed as `children`.

Parsed across `src/app/**`: **13 `RefusalView` elements carry an `onThisScreen` way-out, and 8 are
self-closing** — no control inside the block, so the authored way-out sentence renders nowhere:

| Screen | The sentence that never renders |
|---|---|
| `rate-card/r/[token]/page.tsx:175` | "Try another number above, or **take the refund below** — the button is on this page and there is no reason field." |
| `signin/page.tsx:92` | "Ask for a new link below — same address, one click" |
| `app/workers/page.tsx:89` | "Map the Social Security column on your next payroll upload" |
| `app/settings/billing/page.tsx:222` | "Update your card, or re-check your payment status, on this page" |
| `app/settings/billing/page.tsx:248` | `outcome.clearedBy ?? ''` — empty even as data |
| `app/settings/billing/page.tsx:340` | "Move up a plan yourself on the cards below, if you would rather choose" |
| `app/projects/new/page.tsx:66` | "Choose a federal funding source in the form below, if one applies" |
| `_components/new-project-form.tsx:177` | "Choose a federal funding source above, if one applies" |

`tests/web/refusal-primitives.test.ts` asserts `productStateHasAWayOut` over **constructed values**
and never renders the component, so all 16 of its tests pass while 8 blocks end on a statement of a
problem with nothing after it. Under A3 that is the exact state the P-S variant was added to make
unrepresentable: on the `$49` rate-card screen the dropped sentence is how the customer learns the
refund exists, and there is nobody to email.

Not a dead end in the strict sense — the controls are elsewhere on each page — but the pointer to
them is authored, stored, tested, and discarded at render.

### NEW-7 · **HIGH, NEW** — the California eCPR is correct, tested, and unreachable in production

Correctness C-3 is genuinely closed: the screen and the route are one function and the DRAFT gate
is real. But the artifact requires a contractor block and a nine-digit number per worker, and
**no screen collects either**:

```
grep -rn "contractor_fein|ca_license_number|dir_project_id|contractorFein" src/app/(app) --include=*.tsx
  → (nothing)
```

The columns exist (`projects.contractor_fein`, `ca_license_type`, `ca_license_number`,
`contractor_address/city/state/zip`, `dir_project_id`, `workers.num_withholding_exemp`), the emitter
reads them, the test suite writes them with `UPDATE projects SET …` from a fixture — and no
customer-facing form writes them at all. `workers.ssn_ciphertext` is the same story, and security
M-2 records that the envelope cipher does not exist in this build.

The agent disclosed this honestly and the product behaves honestly: `ecprChip` blocks and **names
each missing field**, which is strictly better than round 1's ready-chip-over-a-409. But the honest
sentence a Californian customer gets is a refusal she cannot clear, on the artifact the product
names as a headline deliverable, with nobody to ask. That is the A3 failure mode with a truthful
message on it.

### What the hunt did *not* find

- **No weakened tests.** `git diff HEAD -- tests/ e2e/` is **+784 / −23**, and all 23 removed lines
  are mechanical: the e2e helper can no longer read a URL out of `email_outbox` **because the URL is
  no longer there** (it now stands in for the mailer, mints the token and clicks the link — the
  product still does everything after the click), plus one renamed `it(...)` for the expanded
  signatory test. Not one assertion was deleted or loosened.
- **No grant revoked in one place and re-granted in another.** Every `GRANT`/`REVOKE` after
  `ratepin_enable_tenant_rls`'s call sites was read; the append-only pair is never re-granted, and
  `REVOKE INSERT ON accounts, memberships FROM ratepin_app` is the intended narrowing, not a
  collision.
- **No schema column added twice.** A duplicate-column scan flagged `projects.ca_license_type` and
  `workers.num_withholding_exemp` — both the eCPR agent's new columns — and both are false
  positives: the second occurrence is the column's own `CHECK` constraint. There is one migration
  file and one `ADD COLUMN` in the tree (`schema.ts:101`, idempotent, unrelated). The migration
  applies cleanly under PGlite, which a genuine duplicate would prevent.
- **No refusal whose copy changed meaning in the move to `RefusalView`.** Spot-checked the
  substantive rewrites; the sentences are carried across verbatim. Two changes are *improvements* and
  were checked as such: the week page's P-C no longer invents an `asOf` when no snapshot exists (it
  becomes a P-S instead), and the CBA-fringe notice was correctly **not** given a `29 CFR 1.3(b)`
  citation the agent could not verify. One information loss worth recording: the week page's banner
  used to print `board.levels.join(' · ')` — every non-normal ladder level — and the P-C now carries
  a single `ladderLevel`, so a corpus at two levels at once names one.

---

## 4. CORRECTIONS.md probes, re-run over every rendered surface

Probes extracted mechanically from §3.3 by the documented one-liner. **6 entries, 35 regexes, all
compiled.** Applied with the negation guard to **195 files** across `src/**` and `public/**` — every
`.ts`, `.tsx`, `.css`, `.html`, `.json`, `.md` from which a string can reach a screen, an artifact or
an email. (Round 1 scanned 193; the two new files are `_lib/refusals.ts` and `_components/refusal.tsx`.)

```
FILES SCANNED 195    BLOCKING HITS 0    ADVISORY 10
```

**Zero blocking hits.** All ten advisories are legitimate copy and were read individually: four are
our own `$0 setup` stated as a fact about ourselves (X-4 hygiene, never a competitor claim); four are
the marketing page's own honesty section, which must state *"there is no Davis-Bacon civil money
penalty"* in order to correct X-5, and which the negation guard catches; one is a checkout docblock;
one is `classify/ladder.ts:21`, a code comment correctly attributing three-year debarment to
**29 CFR 5.12**, which is the debarment authority and not the X-5 misattribution.

F-1…F-4 re-checked by string search. Nothing asserts accuracy, acceptance, coverage or an outcome
figure. `gateSentence` remains the only producer of an outcome sentence and cannot produce one
without an unlocked counter reading. The eCPR's label is still the mandated *generated, not
acceptance-tested*, asserted in `app.test.ts`.

---

## 5. Verdict

### Is this shippable to a paying subcontractor on Davis-Bacon work?

**To a federal-only subcontractor outside California: yes, with the caveats in the list below.**
**To a California subcontractor: no.** That split is the honest answer and it is new — round 1's
answer was an unqualified no on three blockers, and all three are now closed.

What changed. The magic-link token is recoverable from nothing at rest, proved by attacking it
rather than by reading the fix. Account deletion erases the address, proved through the real signup
path on the role production runs as. The evidence tables behind two gates cannot be edited by the
tier that reports from them, proved from the catalog and then live. The eCPR screen and route are one
function, and no configuration value can promote a gated claim. Nothing was weakened to get there:
+784 test lines, −23, and not one assertion removed.

**What blocks a California sale — NEW-7.** The CA DIR eCPR XML is a named deliverable in the
product's own pitch. The emitter is correct, gated, tested end to end, and cannot be reached,
because no screen collects the FEIN, the CSLB licence, the contractor address, the DIR project id or
a worker's SSN. The customer gets a truthful refusal naming each missing field and no way to supply
one. Under A3 there is no one to ask. This is one form and one column-mapping target away from
closed, and until it lands the product should not be sold on the California artifact.

**What should be fixed before any sale, though neither is a blocker on its own:**

1. **NEW-6** — eight refusals discard the sentence that tells the customer how to clear them,
   including the one that names the refund path on the $49 product. Small fix: render
   `action.label` for `onThisScreen` instead of returning `null`, and add a test that renders the
   component rather than asserting the value.
2. **NEW-2** — four screens can print a rate half a cent from the artifact built off the same pin,
   on a product whose proposition is that the rate is pinned and reproducible.

**Known open, accepted for a first paying customer:** security C-1's missing second mechanism,
security H-1's login-CSRF half, security H-2's absent `rowCount === 1` assertion, correctness H-3's
missing `unfunded` ingest column, correctness M-2 / NEW-3's duplicated rounding function, NEW-5's
superuser-green majority.

### The honest list of what Ratepin does not do

Stated plainly, because the product's own standard is that an unmeasured claim is not written into a
rendered string. Round 1's list had ten entries; three are struck.

1. ~~It does not delete your email address when you delete your account.~~ **Closed.** It does,
   and the statement that does it now runs before the one that used to hide the row from it.
2. ~~It cannot produce the California eCPR XML.~~ **Half closed, and the remaining half is worse
   than it looks.** It produces a correct eCPR from stored inputs — but nothing in the product can
   store those inputs, so on a live account it cannot produce one at all.
3. ~~It cannot return a certified payroll generated with a named signatory.~~ **Closed.** The
   signatory and remarks are persisted and the rebuild is byte-identical, with a companion test
   proving the assertion is not trivial.
4. **It cannot represent an unfunded fringe plan.** The engine blocks correctly the moment it is
   told; nothing on the ingest path can tell it.
5. **It does not defend the tenant boundary twice.** RLS is real, enforced and asserted at boot. The
   repository predicates ADR-011 names as the *first* mechanism do not exist — 2 of 76 statements
   carry one. A single `SET ROLE`, a superuser connection string, or one `withTenant` forgotten in a
   future edit is the whole boundary. And a cross-tenant write is still a silent no-op, not an error.
6. **A magic link is not bound to the browser that asked for it.** The token is now safe at rest and
   safe in the database; it is still redeemable by whoever holds it, from any browser, with no
   interstitial naming the address being signed into. Anyone who can get a victim to click a link
   can put that victim inside an account the attacker controls.
7. **It tells eight refusals' worth of customers what is wrong and, at render, not what to do about
   it.** The sentence exists, is authored, is stored on the value and is tested — and is dropped by
   the component.
8. **Six of six gates are locked, and no outcome number is claimed anywhere.** That is correct and
   honest — and it means the product currently makes no measured claim about accuracy, acceptance,
   coverage, time saved, autonomy or the staleness credit. Everything it says about itself is a
   description of a mechanism. It can no longer be talked out of that by an environment variable.
9. **43 of 49 test files do not test the configuration it runs in.** Six suites use the NOBYPASSRLS
   harness — the right six, and one more than the count that would have caught NEW-1. The rest are
   superuser-green, which means green with the policies deleted.
10. **Rate figures on four screens can disagree, by a half-cent, with the artifact built from the
    same pin.**

### What is genuinely finished

Worth recording, because it is now much the larger share. The tenant boundary is real,
independently reproduced, and its one provisioning door was re-verified from the other side this
round. The magic-link design chose the harder correct option — a reference in the row and the token
minted inside the send — over encryption or derivation, and gave the reason from `ARCHITECTURE`
§11.3's own threat table rather than inventing one; it survived four separate attacks written to
break it. Deletion fails closed by raising rather than reporting a success it did not achieve. The
append-only grant was never issued rather than issued and revoked, which is the difference between a
rule and a habit. `P-S` was added with no `rule` and no `citation` field, so a login error can never
borrow a federal regulation's authority — enforcement by absence, the same move that keeps a support
address out of the type. Two agents refused to fabricate something to satisfy a type — a
`29 CFR 1.3(b)` citation and an `asOf` date — and said so. The `paidTotal` correction still stands as
the best single piece of work in either round. And the CORRECTIONS register is clean across every
rendered surface, at 195 files and zero blocking hits.

---

*Auditor's note on method: this document takes nobody's word. The four claims the task named were
re-proved by probes the auditor wrote and then deleted, not by re-reading the agents' tests — which
is how NEW-6 was found, since the agents' test asserts the same invariant one layer above where it
fails. Two of this round's seven hunt findings are new, one round-1 finding (NEW-3) is **downgraded**
on measurement, and one closed finding (correctness C-3) is recorded as closed **with a new
higher-severity gap behind it**, because "the dead end is gone" and "the artifact works" are not the
same sentence.*
