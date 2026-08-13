# Build review — autonomy and degradation

**Lens.** A1–A6 in behaviour. Every state a paying customer can reach from which there is no
in-product way forward. The four refusal primitives as primitives rather than as per-screen
markup. Scheduled jobs failing closed and idempotent under redelivery and restart. Staleness
credit, dunning, refund and deletion completing with zero human minutes.

**Method.** Every finding below was produced by running code or by driving the application in a
real browser against the shipping configuration (`.env.local`: Postgres, `ADAPTER_MODE=mock`,
`next dev` on :3000, the seeded corpus from `npm run seed`). Two defects were pinned with
throwaway vitest probes against PGlite, run and then deleted; their output is quoted verbatim.
Nothing here is inferred from a comment. `npm test` is 809/809 across 42 files and `npm run
typecheck` is clean — every defect below is invisible to both, which is the point.

Nine journeys end with no way forward. Five of them have taken the customer's money first.

---

## CRITICAL

### C1 · The corpus never refreshes itself. A4 has no implementation in the deployed worker.

**Where.** `run-2/app/src/worker/index.ts:313` (`ingest: null`), and `:314–316`
(`probes: null`, `backups: null`, `retention: null`). Consumed at
`run-2/app/src/worker/jobs.ts:214` (`if (!deps.ingest) return { performed: false, detail: {
reason: 'no_upstream_configured' } }`).

**The defect.** `buildWorkerDeps` is the only function in the repository that constructs a
`WorkerDeps`, and it hardcodes four upstream ports to `null`. The comment above them says they
"are wired in the deploy image". There is no deploy image: no Dockerfile, no Procfile, no
`fly.toml`, no compose file anywhere under `run-2/app`. Verified:

```
$ grep -rn "buildWorkerDeps\|ingest:" src/ --include=*.ts
src/worker/index.ts:286:export function buildWorkerDeps(...)
src/worker/index.ts:313:    ingest: null,
src/worker/jobs.ts:152:  readonly ingest: (() => Promise<IngestOutcome>) | null;
```

`ingest` is never assigned a non-null value in `src/`, in `tests/`, or in `e2e/`. The only real
ingest is `npm run corpus:ingest` — a CLI a person types (`src/scripts/corpus-ingest.ts`,
`README.md:107`). So `ingest.corpus.nightly` at 02:00 ET records `performed: false` every night
forever, and with it: `ingest.ecfr`, `ingest.dir.xsd`, `ingest.whd.form`, `backup.verify` and the
object-store half of `retention.sweep`.

**Failing scenario.** Deploy on day 0. `corpus_snapshot.promoted_at` is the seed's timestamp and
never moves. `freshness.sweep` (`jobs.ts:508`) reads it hourly. At hour 24 every pin is L1_DATED;
at hour 72 (`FRESHNESS_SLA_HOURS`) `assessFreshness` returns `state: 'STALE'`, `blocksNewPins:
true`, `accruesCredit: true` (`src/platform/ops/freshness.ts:57–70`) and `freshnessSweep` opens a
fleet-wide `L2_STALE` incident. From hour 72 onward, permanently and with no human able to
intervene from inside the product:

- Every rate-card sale is refused. `src/app/(app)/rate-card/page.tsx:191` replaces the Buy button
  with *"We're not selling a rate card for VA20260195 right now… the sale is off until that check
  clears. **It clears itself.**"* It does not clear itself. That sentence is false in the
  shipping build, and it is the only thing the visitor is told.
- `billing.credit` (`jobs.ts:588`) accrues a staleness credit against every subscription, every
  hour, forever, until the per-incident ceiling binds — the company refunds 100% of every
  period's price, indefinitely, for an outage that cannot end.
- Every artifact footer and every county rate page narrows to the dated P-C sentence forever.
- `/status` and the landing page print "New pins are currently blocked" forever (see M2).

**Why it matters.** A4 is "the knowledge base refreshes itself on a schedule from public,
machine-readable sources… no manual curation to stay correct." The scheduler, the slot algebra,
the staged promotion machine and the fail-closed ladder are all built and all correct — and the
one wire that connects them to SAM.gov is a literal `null`. The product degrades exactly as
designed, honestly and legibly, into a state from which nothing but a human at a shell prompt can
recover it. That is the precise failure A4 and A5 exist to forbid.

**Fix.** Construct the ports in `buildWorkerDeps` from config rather than pinning them to `null`:
`ingest` = a closure over `runIngest({ db, client: new SamClient({...config}), canary })` — the
body of `src/scripts/corpus-ingest.ts:75–93`, which already exists and already fails closed to
HELD when the canary is absent; `probes` = an `UpstreamProbes` over `config.SAM_*`,
`config.WHD_FORM_URL` and the eCFR API; `retention` = the R2 client; `backups` = the restore
verifier. Keep `null` only under `ADAPTER_MODE=mock`, and make `ADAPTER_MODE=live` with a null
`ingest` a boot failure in `main()` the way `stripeGateway` already refuses a live mode with no
key (`src/app/(app)/_lib/deps.ts:46`). Then delete `npm run corpus:ingest` as an operational path
or reduce it to a manual re-run of the same closure.

---

### C2 · The $49 rate card is never delivered, and its refund does not exist.

**Where.** `run-2/app/src/platform/billing/checkout.ts:243–276` (`recordRateCardPurchase` — no
`queueEmail`), `src/platform/billing/webhook.ts:175–186` (`onCheckoutCompleted`, `mode ===
'payment'`), `src/app/(app)/rate-card/ready/page.tsx:25`, `src/app/(app)/rate-card/r/[token]/
page.tsx:127–133`, `src/app/(app)/app/settings/billing/page.tsx:290–291`.

**The defect, driven.** I posted a genuine signed `checkout.session.completed` at the product's
own webhook route:

```
$ node hook.mjs '{"id":"evt_rc_review_1","type":"checkout.session.completed",...,"mode":"payment",
  "customer_email":"marcus.review@journey.ratepin.test","amount_total":4900}'
200 {"received":true,"eventId":"evt_rc_review_1","duplicate":false,"handled":true}

$ psql -c "select email, delivery_token, cents from rate_card_purchases"
marcus.review@journey.ratepin.test | wfv4yz8sBUd48vLhBZPoBYD0M3WqWIaI-Po5WfayMIo | 4900

$ psql -c "select template, to_address from email_outbox order by queued_at desc limit 5"
magic_link | journey.msrrwtoo@journey.ratepin.test        <-- nothing else
```

Three separate holes, all on the same $49:

1. **No delivery.** `recordRateCardPurchase` mints a `delivery_token` and writes it to the
   database. Nothing ever sends it. There is no `rate_card_ready` key in the mailer's `SUBJECT`
   map (`src/worker/mailer.ts:29–41`) and no `queueEmail` call on this path. `successUrl` is
   `/rate-card/ready` with no token (`checkout.ts:66`), and that page says *"The link is in your
   inbox either way — closing this tab loses nothing."* Closing the tab loses everything: the
   token exists only in a table the buyer cannot query.
2. **No document.** `curl`ing `/rate-card/r/<token>` returns a page whose only links are
   `/rate-card`, `/signin` and the wordmark. There is no rate-card renderer anywhere in
   `src/artifacts/` — `grep -rn "rate_card" src/artifacts/` returns nothing. The $49 buys a page
   listing what the document *would* contain.
3. **No refund.** The delivery page prints the 14-day policy and says *"Sign in with
   marcus.review@… and the refund button is on your billing screen."* I signed in with that
   address in a browser; `claimRateCardPurchases` attached the purchase; the billing screen
   renders the policy table row *"$49 bid rate card — Full refund within 14 days, no reason
   required"* and immediately below it:

   > There is no subscription on this account to refund.

   `billingView` derives `refundQuote` from the subscription only, so it is `null`.
   `quoteRateCardRefund` is called from exactly one place in the product — line 60 of the
   delivery page — and only to print a sentence. `refundAction`
   (`src/app/(app)/_actions/billing.ts:135`) bails to `?error=no_subscription`, which no screen
   renders (see H3).

**Why it matters.** J3 is A1's sharpest test — money with no account, no call, no quote. Today
that transaction takes $49, delivers nothing, states a refund policy it cannot execute, and
offers no person to ask. Every one of A1, A2, A3 and A6 fails on one flow.

**Fix.** (a) In `onCheckoutCompleted`'s `mode === 'payment'` branch, `queueEmail` a
`rate_card_ready` template with `link_path: /rate-card/r/${deliveryToken}` and add the subject to
`SUBJECT`; the `ALLOWED_FIELDS` list already permits `link_path`. (b) Build the rate card as a
real artifact — the pieces (`wd_class_diff`, the modification timeline, the FAR panel, the
snapshot hash) all exist — and serve it from the token page. (c) Make `refunds.account_id`
nullable (or attach the claimed purchase), render a rate-card refund quote in `billingView` when
`rate_card_purchases.claimed_by_account_id` matches, and let `refundAction` execute
`quoteRateCardRefund` against the purchase's payment intent. Until (b) ships, refuse the sale
rather than take the money.

---

### C3 · Account deletion is unreachable: the screen tells the customer to type a name the server rejects.

**Where.** `run-2/app/src/app/(app)/app/settings/data/page.tsx:184` —
`SELECT name FROM accounts LIMIT 1`, with no `WHERE`, versus
`src/platform/account/deletion.ts:310–319`, which compares the typed string against the row for
`input.accountId`.

**The defect, driven.** A brand-new account signed in and opened `/app/settings/data`:

```
SCREEN SAYS TYPE: "journey msrrwtoo"    ACTUAL ACCOUNT NAME: "deleter review"
AFTER DELETE URL: .../app/settings/data?deletion=name_mismatch
ERROR SHOWN: true      SCHEDULED SHOWN: false
```

The heading reads *"Deleting journey msrrwtoo"*, the field label reads *"Type **journey
msrrwtoo** to confirm"*, and typing exactly that returns `name_mismatch`, whose copy is:

> That is not the account name. The only accepted value is the name above, compared after
> trimming and case-folding and in no other way.

The name above is the value that just failed. There is no other value the screen offers, no
support address, and nothing else on the page. This is a closed loop with no exit — a refusal
whose copy tells her what is wrong and whose instruction is itself the wrong answer.

**Why it matters.** J12 is the journey where a customer leaves. It is also, per §12.2, the screen
whose consequence is deliberately the headline. Today the button cannot be reached at all, which
means the "no request form, no waiting period" promise resolves to "no deletion". `accountNameOf`
is also the string the customer is asked to type into a destructive confirmation, so an unscoped
read here is worse than an unscoped read anywhere else in the app.

**Note.** The unscoped `SELECT` is a defect in its own right, independent of RLS being inert
(JOURNEY_VERIFIED §4.1). Even with a correct `ratepin_app` role it is a second implementation of
"which account is this", and the deletion module already has the first one.

**Fix.** Delete `accountNameOf` and have `requestAccountDeletion`'s own account read be the single
source: expose `deletionPreview(accountId)` (or a `readAccountName(tx, accountId)` in
`deletion.ts`) and render that. One query, one answer, in the module that owns the comparison.

---

### C4 · The export button produces nothing the customer can obtain.

**Where.** `run-2/app/src/app/(app)/_actions/settings.ts:53` and `:74` — both call
`createRecordingSink()`, which is `src/platform/account/export.ts:57`: an in-memory `Map`
discarded when the request returns.

**The defect, driven.** Clicking *Export 10 filings*:

```
AFTER EXPORT URL: /app/settings/data?exported=exports%2Ff970e395…%2F2026-08-13T17-39-25-105Z.zip
LINKS ON PAGE: ["#main","/","/app","/app/week","/app/workers","/app/settings/memory",
                "/app/settings/billing","/app/settings/data","/app/settings/billing",
                "/app/settings/memory"]
```

The page prints *"Export built: exports/…/….zip"* and there is no link to it, because no bytes
were written anywhere. The screen's own lead sentence is *"One button, one ZIP, no request form
and no waiting period — at every tier, in every billing state, including while a payment is
failing."* The one button produces a string.

**Compounding.** The same is true of every automated export path. `account.export`
(`src/worker/jobs.ts:900`, `schedule: onDemand`) is dead code — `grep -rn "account.export"
src/` finds the definition and nothing that enqueues it, despite the header claiming it "is
enqueued by the dunning transition and by the deletion request". `reconcileDunning` queues the
`archive_export_link` email (`src/platform/billing/dunning.ts:188–200`) whose subject is *"Your
Ratepin archive, and how to download it"*, and `renderMessage` fills `link_path` with the default
`/app` because the payload carries none. A customer who stops paying is emailed a promise of an
archive download and given a link to the dashboard.

**Why it matters.** §12.1 and §9.1 make export the thing that stays open in every money state —
it is the reason the product can restrict a non-payer without earning a chargeback. That
guarantee is currently a redirect parameter.

**Fix.** Give `ExportSink` a real implementation (R2/object-store put, or stream a ZIP from the
route), add an authenticated `GET /api/exports/[key]` bounded to the owning account, redirect to
it, and put its path in the `archive_export_link` payload's `link_path`. Enqueue `account.export`
from `reconcileDunning`'s `archived` branch and from `requestAccountDeletion` so the promise in
`jobs.ts:895–899` becomes true.

---

## HIGH

### H1 · A job that kills the worker process re-runs forever and starves every other job.

**Where.** `run-2/app/src/worker/queue.ts:186–207` (`reclaimExpiredLeases`) — the `attempts >=
MAX_ATTEMPTS → dead` check exists only in `failJob` (`:163`), which runs only when the handler
*throws*.

**Probe (run, then deleted).**

```
MAX_ATTEMPTS = 5   reclaimed = 1
AFTER RECLAIM: {"state":"ready","attempts":"99","run_after":"2026-08-10 02:00:00+00"}
```

A job at 99 attempts — twenty times the cap — is returned to `ready`, with its **original**
`run_after` intact.

**Failing scenario.** `ingest.corpus.nightly` OOMs the container parsing a large determination
(or any handler calls `process.exit`, or the platform SIGKILLs mid-job). `failJob` never runs, so
the job never becomes `dead`. The lease expires; the next tick reclaims it; because `run_after`
is the original slot instant, it is the *oldest* row and `claimJobs`' `ORDER BY run_after`
(`:136`) picks it first; the worker dies again. Repeat every 15 seconds forever. `billing.credit`,
`billing.dunning`, `billing.overage`, `outbox.drain`, `account.deletion.execute`,
`retention.sweep` and `gates.refresh` are all behind it in the queue and none of them ever runs
again. No incident is opened, because `openIncident` lives in `runOneJob`'s `catch`, which is
never entered. `job_runs` fills with `lease_expired` rows nobody reads.

**Why it matters.** This is the one shape of failure A5's "an outage… fails closed rather than
requiring a person to notice" cannot survive: the whole of unattended operations stops, silently,
and the customer-visible consequences (unposted credits, undelivered dunning notices, unexecuted
deletions past their seven-day promise) all look like the product working.

**Fix.** In `reclaimExpiredLeases`, split the `UPDATE` by attempt count: rows with `attempts >=
MAX_ATTEMPTS` go to `state = 'dead'` with `last_error = 'the lease expired without the attempt
reporting an outcome'`; the rest go to `ready` **with `run_after = now() + backoff(attempts)`**
so a crash-looping job cannot monopolise the head of the queue. Emit the `signalOnFailure`
incident on the transition to `dead`, so a permanently crashing job reaches the ladder rather
than nothing.

### H2 · `billing.overage` is not idempotent, and it silently undoes the one-click revert.

**Where.** `run-2/app/src/platform/billing/meter.ts:195–225` (`enforceOverageCap`) — no
idempotency key, no read of `plan_changes`. Scheduled hourly at `jobs.ts:681`.

**Probe (run, then deleted).** One Solo account, 90 certifiable filings, three consecutive
hourly runs with the subscription webhook not yet landed:

```
UPGRADED: true true true
updateSubscriptionPrice calls: 3
auto_upgrade rows: 3
revert ok: {"ok":true,"toPlanId":"solo"}
RE-UPGRADED AFTER REVERT: true
```

**Failing scenario.** Priya crosses the cap at 14:00. The job calls
`updateSubscriptionPrice({ prorate: true })` and writes an `auto_upgrade` row. `account.planId`
only moves when `customer.subscription.updated` arrives, so at 15:00 the job re-reads Solo,
re-computes `atCap`, and calls Stripe again — a second proration on the same subscription — and
again at 16:00. Then she uses the *"Put me back on solo"* button the screen advertises as the
thing that makes an automatic upgrade "a service rather than a fait accompli". `revertAutoUpgrade`
(`src/platform/billing/checkout.ts:167–197`) marks one `plan_changes` row `reverted_at` and puts
her back on Solo. `enforceOverageCap` reads no such row. Within the hour she is on Crew again,
with a fourth proration. She clicks revert; it is undone. There are three un-reverted
`auto_upgrade` rows, so she must click three times, and it still re-fires. **There is no state
she can reach from the billing screen in which she stays on the plan she chose, and there is
nobody to ask.**

**Why it matters.** This is a self-serve exit that does not exist, on the one control §11.4 names
as the difference between an automatic upgrade and a fait accompli — plus repeated real charges.

**Fix.** Two guards. (1) Idempotency: claim the upgrade under a unique key
`overage:{account}:{period_start}:{from_plan}` before calling Stripe, exactly as `credits.ts:170`
and `refunds.ts:139` already do — claim first, only the winner calls Stripe, and pass the same key
to Stripe. (2) Consent: `enforceOverageCap` must skip an account that has a `plan_changes` row
with `kind = 'revert'` in the current period, and the revert must record that the customer chose
her plan for the rest of the period. Print that on the screen beside the revert button, so the
consequence is stated before the click.

### H3 · Six billing outcomes redirect to a query parameter no screen renders.

**Where.** `run-2/app/src/app/(app)/app/settings/billing/page.tsx:67` reads exactly one
parameter — `refund`. The actions redirect with `?error=unknown_plan` (`_actions/billing.ts:45`),
`?changed=` / `?error=` (`:57`), `?reverted=1` / `?error=` (`:66`), `?error=no_customer` (`:81`),
`?rechecked=` (`:118`) and `?refund=declined` (`:153`). None of the six is rendered.

**Driven, twice.**

```
AFTER RECHECK URL: /app/settings/billing?rechecked=no_subscription   PAGE CHANGED? false
AFTER PORTAL URL:  /app/settings/billing?error=no_customer           PAGE CHANGED? false
```

Byte-identical pages, both times.

**Failing scenario A — the stuck-restricted button.** §11.7 calls *"Re-check my payment status"*
"the whole of the escalation path" — she has paid, Stripe agrees, a webhook was dropped, it is
Friday. She clicks. The page reloads unchanged. She has no way to tell whether the check ran and
found nothing, ran and found something, or did not run. The one control that exists *instead of*
a support ticket returns no information at all.

**Failing scenario B — cancellation.** The screen says *"Cancelling is one click into Stripe's
portal."* If `stripe_customer_id` is null — the `checkout.session.completed` that calls
`linkStripeCustomer` was dropped, which is exactly the case `billing.replay` exists for — the
click returns `no_customer` and nothing happens. Cancel lives only in the portal, so **there is
no way to cancel from inside the product and nothing tells her why.**

**Why it matters.** A3 requires that when the system is unsure it "say so, show sources, narrow
the claim" *inside the product*. A silent no-op is the opposite of every one of those, and it is
the state a customer would otherwise resolve by emailing somebody.

**Fix.** Read all six parameters at `:67` and render a P-C or P-D block for each with a real next
step: `rechecked=active|past_due|none|no_subscription` → what Stripe said and what it means;
`no_customer` → "we have no Stripe customer for this account yet; here is Checkout" with the
checkout form inline; `refund=declined` → the quote's own `policy` sentence. Cover them with a
test that enumerates every redirect target in `_actions/billing.ts` and asserts each renders a
distinguishable string — the enumeration is what keeps this from regressing.

### H4 · The four primitives are a closed union in the types and hand-rolled JSX on fifteen of sixteen screens.

**Where.** `RefusalView` (`src/app/(free)/_components/refusal.tsx`) is the only renderer closed by
`assertNever`. It is imported by four files, exactly one of which is in the authenticated group
(`src/app/(app)/app/filings/[id]/page.tsx:41`). Meanwhile:

```
$ grep -c "rp-alert rp-alert--" $(grep -rl "rp-alert rp-alert--" src/app/\(app\) --include=*.tsx)
16 files, 23 hand-rolled refusal blocks
```

— including `_components/picker.tsx:110` (the L-F conformance P-D), `settings/billing/page.tsx:79`
(the entitlement P-C) and `:159` (the cap warning), `settings/data/page.tsx:72` and `:101`,
`rate-card/page.tsx` ×3, `projects/[id]/wd-change/page.tsx` ×2, `import-wizard.tsx` ×2.

**Why it matters.** The whole A3 argument in `src/lib/types.ts:20–22` is *structural*: "`Refusal`
has exactly four members and none of them has a field in which a support address, a ticket id or
an escalation target could be carried — A3 is enforced by the absence of a field, not by a code
review." That enforcement binds only where the rendered thing **is** a `Refusal`. On twenty-two
of twenty-three blocks the data source is a string literal in JSX, so nothing structural prevents
a fifth shape, an escalation affordance, or a P-C without a date — and adding a fifth primitive to
the union would break one file in the app group and none of the other fifteen. The mechanism the
design leans on is real and covers about 4% of the surface it claims.

**Failing scenario.** The `?error=no_customer` state in H3 is precisely where the next engineer
reaches for `<p>Something went wrong — get in touch</p>`, and neither the type system nor
`assertNever` would notice, because that screen has never rendered a `Refusal`.

**Fix.** Move `RefusalView` to a shared location and make it the only component permitted to emit
`rp-alert--blocked|--narrowed|--declined`. Convert the twenty-two literal blocks to `Refusal`
values built with `blockedLine` / `draftNotCertifiable` / `narrowedClaim` / `declinedConclusion`.
Add a lint test that fails on the class names appearing in any file other than `refusal.tsx`,
which is what makes "there is no fifth shape" survive the next deadline.

---

## MEDIUM

### M1 · A DRAFT filing tells the customer to resolve the lines and gives her no control that does.

**Where.** `run-2/app/src/artifacts/wh347/formtext.ts:178` — *"Resolve the lines listed below and
generate again"* — rendered on S16 at `src/app/(app)/app/filings/[id]/page.tsx:172`. The only
hrefs on that page are the artifact downloads and, in the no-pin branch, the project. There is no
link to `/app/imports/[id]/resolve`. `RefusalView`'s P-A case renders the headline and the detail
only; its own comment says "the choice itself is the picker component", and there is no picker on
this screen.

**Failing scenario.** Dee generates for week ending 2026-08-08 with one line blocked, downloads
the draft, and comes back the following month to finish it. The project page (`:189`) links the
filing, not the import. `/app/week` defaults to the current week's board; the Resolve link is
correct but only appears for the week whose `weekEnding` is in the query string, so she must know
and type the earlier date. From the filing screen — the screen the instruction is printed on —
the only route is the URL bar.

**Why it matters.** The refusal states the remedy and withholds the control. That gap is where a
customer would otherwise ask a person.

**Fix.** Carry `importId` on the filing view and render *"Resolve the N blocked lines"* as a
primary control in the Exceptions section, beside the refusals it refers to.

### M2 · `blocksNewPins` is announced to customers and enforced nowhere.

**Where.** Computed in `src/platform/ops/freshness.ts:66` and `src/corpus/ladder.ts:131`; rendered
at `src/app/status/page.tsx:136` (*"New pins are currently blocked"*), `:153`, and
`src/app/(marketing)/page.tsx:802`. `grep -rn "blocksNewPins" src/` shows **no consumer in any
write path**: neither `createProjectAction` (`_actions/projects.ts:44`), `createProject`, nor
`pinDetermination` reads it. `pin_pending`, which §4.5 specifies as the state a project saves in
at L2, does not exist in `src/db/schema.ts`.

**Failing scenario.** After C1 puts the corpus permanently at L2, `/status` tells every visitor
"New pins are currently blocked" while the app cheerfully pins a new determination on every
project created. A customer who reads the status page and waits is waiting for nothing; a
customer who does not read it gets a new revision-of-record asserted from a corpus the product
has just told the world it cannot vouch for.

**Why it matters.** The failure runs in both directions at once: an honest public claim that is
behaviourally false, and a claim the product is making (a revision-of-record) that its own ladder
says it may not make. Either half alone is a defect; together they make the status page unusable
as the thing it exists to be.

**Fix.** Either implement §4.5 — `pin_pending`, the dated banner, the accruing credit, and the
project usable meanwhile — or remove the two rendered sentences. Implementing it is the smaller
change and it is already fully specified; whichever is chosen, add a test that asserts the status
page's sentence and the pin write path read the same predicate.

### M3 · PII retention is never enforced, and the privacy page is honest about only half of it.

**Where.** `src/worker/index.ts:316` (`retention: null`) gates
`src/worker/jobs.ts:804–817`: `ecpr_objects`, `raw_csv` and `free_generator` purges are all inside
`if (deps.retention)`. The job still returns `performed: true` with `object_store: false`, so the
ledger records a clean sweep. The same `null` at `:315` means `backup.verify` never runs, which
the legal page renders correctly and permanently as *"We have not yet measured how far back our
database backups reach"* (verified by fetching `/legal`).

**Failing scenario.** eCPR XML containing full Social Security numbers is written to
`pii/ecpr/`, the deletion screen's table promises "Hard delete of the stored objects", and the
30-day sweep never touches it. Raw payroll CSVs live past 90 days forever. `retention.sweep`'s
declared `failsClosedBy` — "a class that cannot be swept is reported by name, never skipped
silently" — is not what the code does: three classes are skipped by an `if` and the outcome is
`performed: true`.

**Why it matters.** A6's "support load is bounded by design" rests on the product's promises
being self-executing. A retention promise nothing executes is the kind of gap that eventually
requires a person, a lawyer, or both.

**Fix.** Wire the R2 client in `buildWorkerDeps` (part of C1's fix). Independently, make the
absence loud: when `deps.retention === null`, return `performed: false` with `reason:
'no_object_store_configured'` and name the three unswept classes, so "it ran and found nothing"
and "it could not run" are different rows, which is what `JobResult.performed` is documented to
mean.

---

## LOW

### L1 · The scheduler silently skips missed slots rather than backfilling them.

`src/worker/index.ts:100–110` computes only the slot containing `now`. `schedule.ts:20–22` claims
"a scheduler that was down for two hours enqueues the slot it missed exactly once, late" — true
for an hourly job, false for a daily one. A worker down from Monday 01:00 to Thursday 04:00
enqueues one `ingest.corpus.nightly` slot and never records that Tuesday's and Wednesday's
existed. "Did Tuesday's ingest run?" returns no row, which is indistinguishable from a row that
was never written for a different reason.

**Fix.** Walk back up to N slots per registry entry (N = the job's own tolerance, 2 for daily),
enqueue each under its own slot key — the unique constraint makes this free — or write an
explicit `skipped_slot` row so the gap is a fact in the ledger rather than an absence.

### L2 · `backup.verify` writes an unkeyed row on every attempt.

`src/worker/jobs.ts:837–842` inserts into `backup_verifications` with no idempotency key, so a
crash between the insert and `completeJob` produces two rows for one verification. Only a count
is affected — `oldestRestorableAt` reads `ORDER BY at DESC LIMIT 1` — but it is the one job in
the registry that writes an effect without a key, in a file whose header argues that the key is
the only load-bearing mechanism.

**Fix.** Key it on the slot: `ON CONFLICT (at::date) DO NOTHING`, or add an
`idempotency_key` column carrying the job's own.

### L3 · The worker downgrades to a fake Stripe in live mode; the web process refuses to boot.

`src/worker/index.ts:289–292` falls back to `createFakeStripe()` whenever `STRIPE_SECRET_KEY` is
absent, including under `ADAPTER_MODE=live`. `src/app/(app)/_lib/deps.ts:46` throws in the same
situation, with a comment explaining why: "a billing screen that quietly stopped talking to
Stripe would look like a working product." The worker is where credits are posted, refunds
executed and plans upgraded; a fake gateway there is strictly worse.

**Fix.** Throw in `buildWorkerDeps` under the same condition, or call `stripeGateway()` from
`_lib/deps.ts` so there is one decision.

---

## What was checked and found sound

Stated because a review that only lists defects misrepresents the build.

- **The refusal union itself.** Four members, four constructors, no fifth, and no field on any of
  them in which an escalation target could travel. `blockedLine` throws when a candidate arrives
  pre-selected at any level but L-C1; `draftNotCertifiable` throws on an unexplained watermark;
  `narrowedClaim` has no overload without a date. The type-level argument is real — see H4 for
  where it stops binding.
- **Idempotency where money moves.** `credits.ts:170` and `refunds.ts:139` both claim the ledger
  row under a unique key *before* calling Stripe and pass the same key onward, so a crash between
  the two writes cannot produce two transactions. `queueEmail`, `enqueue` and the `stripe_events`
  ledger are keyed the same way. `enforceOverageCap` (H2) is the only money path that is not.
- **Dunning never destroys.** `reconcileDunning` contains no DELETE, no purge and no revocation
  of export, and `persistEntitlement`'s `WHERE status <> 'deleted'` is written so a dunning job
  cannot mark an account deleted. The notification is deliberately not gated on the capability
  changing, which is what keeps the grace-period notice from vanishing.
- **Freshness never blocks a filing.** `blocksFiling` is typed `false`, not `boolean`, in every
  branch.
- **No contact affordance anywhere.** Driving fifteen authenticated and public screens produced
  no `mailto:`, no `tel:`, no third-party embed, and no control offering a person. The absences
  A3 asks for are genuinely absent. Every dead end in this document is a missing *forward* path,
  never a hidden escalation — which is the failure mode this constraint was always going to
  produce, and the reason "no support address" is a weaker test than "she can finish".
