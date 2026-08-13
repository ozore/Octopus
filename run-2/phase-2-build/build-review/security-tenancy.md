# Build review — security and multi-tenancy

**Reviewer lens:** security, multi-tenancy, session and token lifecycle, PII projection.
**Method:** everything below was reproduced against a real PostgreSQL 16 cluster with
`drizzle/0000_init.sql` + `ensurePlatformSchema` applied by `npm run db:migrate`, the recorded
corpus loaded by `npm run seed`, and two `next dev` servers — one on the database owner
(port 3100, the configuration `playwright.config.ts` and `JOURNEY_VERIFIED` actually ran), one
on `ratepin_app` (port 3101, the role ADR-011 mandates). Commands and outputs are quoted.
No finding here rests on reading a comment.

**Headline.** `JOURNEY_VERIFIED` §4.1 reports that sign-*up* fails on `ratepin_app`. That
understates it in one direction and the consequence in the other. On `ratepin_app`, **sign-in
also fails for accounts that already exist**, because `resolveSession` joins `users`, and the
`users` policy needs the tenant context that the session lookup is supposed to establish — so
no request ever reaches an authenticated screen and **not one of the 27 tenant policies is
reachable from the web tier at all**. On the owner role — the only configuration in which the
product functions, and the one behind all sixteen screenshots — RLS is inert and there is no
application-layer replacement: **65 of the 66 tenant queries in `src/app/(app)/_lib/**` carry no
`account_id` predicate**. The result is not a latent risk. A brand-new account's dashboard
renders another company's project, pins, filings, worker names and SSN last-fours, verified
over HTTP below.

---

## CRITICAL

### C-1 · Total cross-tenant read of certified payroll on the deployable configuration
`src/app/(app)/_lib/filings.ts:941` (`readFiling`), `:951` (`listFilings`), `:974`
(`listArtifacts`), `src/app/(app)/_lib/imports.ts:96` (`rememberedMap`),
`src/app/(app)/_lib/resolve.ts:389`, `:426`, `src/app/(app)/_lib/projects.ts`, `week.ts`.

**Defect.** ARCHITECTURE §11.2 / ADR-011 require *two* independent isolation mechanisms:
tenant-scoped repositories **and** RLS. Only one was built. Every read repository in the
authenticated route group selects with no account predicate and relies wholly on RLS:

```
$ grep -c "tx.execute" src/app/(app)/_lib/*.ts   →  65 statements
$ grep -n "account_id" src/app/(app)/_lib/*.ts | grep -i "WHERE"
  src/app/(app)/_lib/week.ts:263   ← the only SELECT in the group that filters by account
```

`readFiling` is representative:

```sql
SELECT … FROM filings f JOIN projects p ON p.id = f.project_id
 WHERE f.id = ${filingId}::uuid          -- no account_id, no membership join
```

RLS is the sole mechanism, and RLS is off in every environment that has ever been exercised:
`playwright.config.ts:80` and `:83` both default to `postgres://postgres:…` (the owner), and
`assertRlsEnforced` is called from exactly one place — `src/worker/index.ts:382`. The web
process never asserts it. It *cannot* run on `ratepin_app` (see C-2), so the owner role is not
a test shortcut; it is the only configuration in which the product works.

**Failing scenario — executed, not hypothesised.** Seeded account `14ea2eea…` ("Rio Vista
Concrete") owns filing `3c2fcb13-8348-484d-8331-a8cc8e39878b`. A brand-new account was created
through the product's own `/auth/callback`:

```
$ curl -i "http://127.0.0.1:3100/auth/callback?token=$TOK"
set-cookie: rp_session=mywpyZgkdmHt49YA6fYlipg2eolUl6-fgsQe0RQdHQc; HttpOnly; SameSite=lax
$ psql -Atc "select id,name from accounts"
14ea2eea-8e57-4ee9-b147-4c5ae2ad63e9|Rio Vista Concrete
2695de29-1eef-4a8b-b635-9acc56f1c685|mallory          ← no membership in the first account
```

`mallory@evil.test`'s **own dashboard**, with no id guessing at all:

```
$ curl -b cookies.txt http://127.0.0.1:3100/app | sed 's/<[^>]*>/ /g'
… Projects  Project | Determination | Standing | Contract value
  Route 17 shoulder widening  Gloucester , VA · HIGHWAY   VA20260195 rev 2 · published 2026-08-06
  Pinned revision is the current one.  over $100,000
  Recent filings  2026-08-14  Route 17 shoulder widening  ✓ Certifiable  yes …
```

The filing screen, by id:

```
$ curl -b cookies.txt http://127.0.0.1:3100/app/filings/3c2fcb13-…
Alvarado  Brennan  Cardoza  Dunlap  Ferreira        ← worker surnames
4471  9013  2288  7756  3390  5124                  ← SSN last four, six workers
$ curl -b cookies.txt "…/api/artifacts/3c2fcb13-…?kind=exception_report"
HTTP 200 — the full exception report body
```

The WH-347 bytes themselves returned 409 — **not** because of any authorization check, but
because of the unrelated defect in H-1. The route had already loaded, re-rendered and composed
the other tenant's filing before comparing digests.

**Why it matters.** This is the entire product: names and identifying numbers of construction
workers, hours, rates and deductions on a document signed under 18 U.S.C. 1001, readable by any
visitor who can supply an email address (A1 makes signup free and instant). It is OWASP
API1:2023 with the compensating control disabled. `404 'no such filing on this account'` at
`api/artifacts/[id]/route.ts:44` states a property the code does not have.

**Fix.** Two changes, both required.
1. Give every repository the predicate it currently borrows. `readAs`/`writeAs` already hold
   the `Session`; thread `accountId` into the repository signatures and add
   `AND f.account_id = ${accountId}::uuid` (and the equivalent on projects, weeks, imports,
   artifacts, crosswalk_observation, filing_events). The changed-line count is large but
   mechanical, and it is the mechanism ADR-011 says exists.
2. Make its absence detectable: call `assertRlsEnforced` at web-process boot as the worker
   does, and add an e2e assertion that a second account's session gets 404 on the first
   account's filing id. `e2e/tenancy.spec.ts` currently pins only the provisioning failure.

---

### C-2 · No authenticated request can execute on `ratepin_app` — every tenant policy is unreachable
`src/platform/auth/session.ts:352` (`resolveSession`), `drizzle/0000_init.sql:1748`
(`users_tenant_isolation`), `src/platform/auth/magic-link.ts:112` (`redeemMagicLink`).

**Defect.** `JOURNEY_VERIFIED` §4.1 names three provisioning statements that fail. The failure
is one layer deeper and strictly circular: `resolveSession` — the function that *discovers* the
tenant — runs on the pool handle with no context and joins `users`, whose policy requires
`ratepin_current_account()`.

```
$ psql -U ratepin_app -Atc "SELECT count(*) FROM auth_sessions s"                       → 4
$ psql -U ratepin_app -Atc "SELECT count(*) FROM auth_sessions s JOIN users u ON u.id = s.user_id"  → 0
$ psql -U ratepin_app -Atc "SELECT ratepin_set_account('14ea2eea…'); SELECT count(*) FROM …same join…" → 2
```

Driven end to end — a valid, live, unexpired session row for an existing account:

```
$ curl -o /dev/null -w "%{http_code}" -H "Cookie: rp_session=$TOK" http://127.0.0.1:3101/app
307        (→ /signin: resolveSession returned reason='unknown')
$ same cookie against the owner server on :3100 → renders "Route 17 shoulder widening"
```

So the reachability answer is total. Nothing downstream of `requireSession` ever runs. The 25
`ratepin_enable_tenant_rls` policies in `0000_init.sql:1720-1742`, plus `plan_changes` and
`account_deletions` in `schema.ts:273-274`, plus the `users` and `staleness_windows` policies,
are **all unreachable from the web tier** — not "untested", unreachable. `sessionStillAuthorized`
(`session.ts:423`), documented as "the second half of the boundary", would also return false
for every session, and is never called (see M-2).

Provisioning fails additionally on `accounts`, which §4.1 does not name:

```
$ psql -U ratepin_app -c "INSERT INTO accounts (id,name,status,created_at) VALUES (…)"
ERROR:  new row violates row-level security policy for table "accounts"
```

**Compounding failure — the link is burned before the failure.** `redeemMagicLink` consumes the
link with a conditional UPDATE at `magic-link.ts:120` (no RLS on `auth_magic_links`, so it
succeeds) and *then* fails on the `users` insert. `route.ts:34` calls it on `db`, not inside a
transaction, so nothing rolls back:

```
$ curl -o /dev/null -w "%{http_code}" "http://127.0.0.1:3101/auth/callback?token=$TOK"  → 500
$ psql -Atc "select consumed from auth_magic_links where token_hash='…'"                → t
$ curl -i "http://127.0.0.1:3101/auth/callback?token=$TOK"
location: /signin?state=consumed
```

**Why it matters.** The customer sees a 500, retries, and is told "this link was already used —
usually a second tab". Requesting another link repeats it forever. Under A3 there is no support
address, no contact form and no escalation path, by design — so this is an unrecoverable,
silent, self-inflicted denial of signup with no exit, and the screen actively misdescribes the
cause. It is the exact failure mode the autonomy gate has no answer for.

**Fix.** Provisioning must cross the boundary in one named place. Add a `SECURITY DEFINER`
function `ratepin_provision_account(p_email text, p_account_name text)` owned by the migration
role, `EXECUTE`-granted to `ratepin_app`, which performs the user/account/membership/billing-index
inserts and returns the ids — one auditable escape hatch instead of four policy holes. Separately,
`resolveSession` must not join `users`: select the session row alone, then read the email inside
`withTenant` once the account is known (or denormalise `email` onto `auth_sessions`, which is
already outside RLS by design and documented as such at `schema.ts:17-22`). Wrap the redemption
in `db.transaction` so a failure does not consume the link. Until both land, ADR-011 is
unimplemented and `JOURNEY_VERIFIED`'s "partially exercised" should read "not exercised".

---

### C-3 · Live magic-link bearer tokens are stored in plaintext in `email_outbox`
`src/app/(app)/_actions/auth.ts:46-57`, `src/platform/auth/magic-link.ts:41-49`,
`src/platform/schema.ts:132` (`email_outbox`), `:266` (its grant).

**Defect.** `IssuedMagicLink.url` is documented at `magic-link.ts:43-45` as: *"The token appears
here and nowhere else — not in the database, not in a log line, **not in the outbox payload**."*
`sendMagicLink` puts exactly that URL into `payload.url`. Verified by executing the two
production functions against the real database:

```
$ npx tsx …  requestMagicLink(...) ; queueEmail(..., payload: { url: issued.url, … })
[{ "to_address": "probe@corp.test",
   "payload": { "url": "https://app.ratepin.test/auth/callback?token=izlT0c9okwKCK1kioGSx3zk_LJUZAs7A_H-8rT58vzs" } }]
LIVE TOKEN WAS: izlT0c9okwKCK1kioGSx3zk_LJUZAs7A_H-8rT58vzs
```

`hashToken` exists precisely so that "a database leak is not a takeover" (`ids.ts:12-15`). The
outbox undoes it. `email_outbox` is deliberately **outside RLS** (`schema.ts:24-33`, the fleet
surface argument) and granted `SELECT` to `ratepin_app` at `schema.ts:266`, so the plaintext
credential sits in the one customer-adjacent table with no tenant policy on it. Nothing purges
sent rows — `purgeDeadSessions` (`session.ts:434`) deletes `auth_magic_links` but never touches
the outbox, so the row outlives the link that the digest table forgot.

**Failing scenario.** Any read of `email_outbox` — a read-only SQL injection anywhere in the app,
a support-tier query, a logical-replication sink, an unencrypted backup — yields immediate
account takeover for every sign-in requested in the previous 15 minutes, plus a permanent
historical record of every address that ever signed in. The e2e suite's own method
(`JOURNEY_VERIFIED` step 07: "the magic link read out of `email_outbox`") is the proof of
concept, written down as a feature.

**Fix.** Store the token nowhere. Queue `payload: { linkId, expiresAt }` and have
`src/worker/mailer.ts` reconstruct the URL from a token held only in memory for the duration of
the send — or, simpler and stateless, make the mailer the *only* caller of `requestMagicLink`
so the URL never leaves the send. Add a test asserting no `email_outbox.payload` in any template
matches `/token=/`. Add a retention sweep that nulls `payload` on `sent_at IS NOT NULL` rows.

---

## HIGH

### H-1 · Open redirect on the sign-in callback, plus login CSRF / session fixation
`src/app/(app)/auth/callback/route.ts:42`.

```ts
const destination = next && next.startsWith('/') ? next : '/app';
return NextResponse.redirect(new URL(destination, config.APP_BASE_URL));
```

**Defect.** `startsWith('/')` admits protocol-relative URLs. `new URL('//attacker.example.com/x',
base)` resolves to `https://attacker.example.com/x`. Verified:

```
$ curl -i "http://127.0.0.1:3100/auth/callback?token=$TOK&next=//attacker.example.com/harvest"
location: http://attacker.example.com/harvest
set-cookie: rp_session=j-m8QtG4A8747-LEEJubnKZihgkEaCD9aAkTGLw9UJI; HttpOnly; SameSite=lax
```

**The compounding half is worse than the redirect.** Redemption is an unauthenticated `GET` with
no confirmation step and no binding to the browser that requested the link, so *any* valid token
logs the visiting browser in — including a token the attacker minted for their **own** address.
An attacker requests a link for `attacker@evil.test`, sends the victim
`/auth/callback?token=<attacker's token>&next=/app/projects/new`, and the victim's browser is
now authenticated as the attacker's tenant. The victim uploads a payroll CSV — worker names,
SSN last-fours, rates — into an account the attacker controls and can read at leisure. Classic
login CSRF, made silent by the fact that the app has no account-switcher and no "you are signed
in as" confirmation on the destination screen.

**Why it matters.** The redirect alone is a phishing primitive on the one domain the product asks
customers to trust with a login link. Together with the fixation it is a full PII-exfiltration
chain requiring only that a customer click a link in an email — the exact action the product's
sign-in design trains them to perform.

**Fix.** (a) Reject any `next` that is not a single-slash path: `/^\/(?!\/)[^\\]*/`, or better,
resolve against `APP_BASE_URL` and compare `origin` before redirecting. (b) Bind redemption to
the requesting browser: set a short-lived, `HttpOnly`, `SameSite=Strict` nonce cookie in
`sendMagicLink` and require it to match `auth_magic_links.id` at redemption; when it does not
match, land on an interstitial that names the address being signed in and requires a POST.
That interstitial is a P-A closed choice, not a support surface — it stays inside A3.

### H-2 · Cross-tenant destructive and billing-bearing writes through guessable ids
`src/app/(app)/_lib/resolve.ts:415` (`forgetMemory`), `src/app/(app)/_lib/filings.ts:1005`
(`releaseFiling`), `:621` (`generateFiling`), `src/app/(app)/_actions/settings.ts:26`,
`src/app/(app)/_actions/filings.ts:27`, `:88`.

**Defect.** The write path has the same missing predicate as C-1, and the ids are worse. Three
concrete ones:

```ts
// resolve.ts:415 — observationId is a bigserial, i.e. 1, 2, 3, …
DELETE FROM crosswalk_observation WHERE observation_id = ${observationId}
// filings.ts:1005
UPDATE filings SET state='RELEASED', released_at=coalesce(…) WHERE id = ${input.filingId}::uuid
```

`forgetMemoryAction` (`settings.ts:26-31`) reads `observationId` straight off the form as a
`Number` and passes it in. With RLS inert, a signed-in attacker iterating integers deletes every
other tenant's classification memory — the asset §6.3 exists to accumulate — and each deletion
looks like a normal customer action in the audit trail.

`generateFiling` is the exfiltration variant: `generateFilingAction` (`filings.ts:27`) takes
`weekId` from the form and calls `generateFiling(db, tx, { accountId: session.accountId, weekId })`.
`readWeek(tx, input.weekId)` at `filings.ts:626` has no account predicate, so a foreign week is
loaded, composed, and a **new filing row is inserted under the attacker's `account_id`**
(`filings.ts:665`) containing the victim's workers, hours and rates — then downloadable through
the attacker's own, legitimately-owned filing id. `releaseFilingAction` then flips the victim's
filing to `RELEASED` (the transition the module documents as what "makes an artifact immutable
in practice") and meters the *attacker's* account for it.

**Failing scenario.** Attacker signs up, POSTs `forgetMemoryAction` with `observationId=1..N`:
every tenant's remembered classifications are gone, and the next upload re-asks questions the
customers already answered — silently producing wrong-rate risk at scale with no error anywhere.

**Fix.** Same as C-1 for reads, applied to writes: `DELETE … WHERE observation_id = $1 AND
account_id = $2`, `UPDATE filings … WHERE id = $1 AND account_id = $2`, and an explicit
`readWeek(tx, weekId, accountId)`. Assert `rowCount === 1` on each and refuse otherwise, so a
mismatch is an error rather than a no-op. Replace `crosswalk_observation.observation_id`'s
bigserial with a uuid so enumeration is not free even if a predicate is later dropped.

### H-3 · The archive route can never serve a filing generated with a signatory
`src/app/(app)/_lib/filings.ts:715` (`rebuildFiling`) vs `:621` (`generateFiling`),
`src/app/(app)/api/artifacts/[id]/route.ts:73`.

**Defect.** `generateFiling` passes `obligations`, `signatory` and `remarks` into `composeFiling`
(`filings.ts:648-658`). None of the three is a column on `filings` (`grep -n "signatory\|remarks"
src/db/schema.ts drizzle/0000_init.sql` → no matches), and `rebuildFiling` (`:740-748`) does not
pass them. The rebuild therefore renders a different document, and the route's digest comparison
refuses to serve it. Deterministic, verified twice on the seeded filing:

```
$ curl "…/api/artifacts/3c2fcb13-…?kind=wh347_pdf"
HTTP 409 {"recorded":"2661ca98…","rebuilt":"edc8c19a…"}   ← identical on repeat
```

**Why it matters.** `/api/artifacts/[id]` is the product's only download route, and §7.6's
"the object store is a cache of a pure function" is the reason no bytes are kept. The function is
not pure over the persisted inputs, so the certified payroll a customer signed is **permanently
unretrievable** the moment the tab is closed. The 409 is honest and correct; the state it reports
is unreachable-by-design. (Noted here because it is the only reason C-1 did not also leak the
PDF bytes, and because a compliance archive that cannot return its own artifact is a security
property — availability of the record of certification.)

**Fix.** Persist `signatory`, `remarks` and the obligations selection on `filings` (jsonb is
fine; they are already inside the provenance the artifact prints), and have `rebuildFiling` read
them. Add a test that generates, re-reads through `rebuildFiling`, and asserts digest equality —
the one property the whole "rebuild rather than store" design rests on and which nothing
currently checks.

---

## MEDIUM

### M-1 · Nine-digit SSNs: the projection guard is real, but it is enforced only by tests
`src/artifacts/identity.ts:95` (`nineDigitRuns`), `src/artifacts/ecpr/validate.ts:125`, `:137`,
`src/artifacts/ecpr/render.ts:441` (`describeViolation`).

**What holds.** The federal path is genuinely safe by type: `identifyingNumber` accepts only
four digits and `FreeWorker.idLast4` is `/^\d{4}$/` (`(free)/_lib/session.ts:324`). `Ssn9` is
branded and constructed in exactly one module.

**What does not.** `nineDigitRuns` — the scanner that would prove no nine-digit run reaches a
rendered artifact — has **zero production callers**:

```
$ grep -rn "nineDigitRuns" src/ tests/
src/artifacts/index.ts:57   (re-export)
src/artifacts/identity.ts:95 (definition)
tests/artifacts/ssn-projection.test.ts:35,120,175-177
```

It is asserted over fixtures and never runs at render time. Meanwhile `validate.ts` pushes raw
field values into violation messages — `:125` pushes the `ssn` element's text, `:137` pushes
`name/@id`, which is `${ssn}::${NAME}` — and `describeViolation` (`render.ts:441`) formats them
into `exceptionReport`, which is rendered on S16 **and** downloadable as
`/api/artifacts/[id]?kind=exception_report`. Both pushes are currently unreachable via
`buildEmployee` (`render.ts:228-229` builds `nameId` from the same `ssn`, so the cross-field
check cannot fail), so this is a live hazard rather than a live leak — but `validateEcpr` is
exported as public API from `src/artifacts/index.ts:169` and takes arbitrary XML, and one future
caller that validates a document it did not build puts a full SSN and a worker's name into a
downloadable text file.

**Fix.** Redact in the violation constructor, not at the call sites: have `push` mask any
`(?<!\d)\d{9}(?!\d)` run in `found` to `·····NNNN` before it is stored. Then run `nineDigitRuns`
where it was meant to run — over the WH-347 content stream and over every `exceptionReport`
string in `composeFiling` — and throw if it returns anything. That converts the test-only claim
into the runtime property §11.3 asserts.

### M-2 · `ssn_ciphertext` has no writer, no cipher and no key — and the deletion screen promises one
`src/db/schema.ts:794`, `drizzle/0000_init.sql:977`, `src/platform/account/deletion.ts:92`,
`src/worker/jobs.ts:793`.

**Defect.** `workers.ssn_ciphertext` is read in three places and set in exactly one — to `NULL`,
by the purge job. Nothing ever writes a ciphertext:

```
$ grep -rn "ssn_ciphertext\|ssnCiphertext" src/ | grep -i "insert\|set "
src/worker/jobs.ts:793:  SET ssn_ciphertext = NULL, ssn_purged_at = …
$ grep -rln "createCipheriv\|aes-256\|tenantKey" src/     →  (no matches)
```

There is no encryption, no key derivation, no key store, and `key_version` is a constant 1.
`DELETION_SCOPE` (`deletion.ts:92-99`) nevertheless renders to the customer: *"The rows are
deleted and the per-account data key is destroyed. Destroying the key is what makes any residual
ciphertext — in a backup, in a write-ahead log — permanently undecryptable."*

**Why it matters.** Two separate problems. (a) It is an unmeasured claim in a rendered string
about a mechanism that does not exist — the house rule and `CORRECTIONS.md` both forbid it, and
it is a data-protection representation a customer may rely on. (b) The CA eCPR path is dead:
`ecprEligibility` (`render.ts:130`) returns `NO_SSN_ON_FILE` for every worker forever, which is
consistent with `JOURNEY_VERIFIED` §5 attributing the missing XML to the corpus — the corpus is
not the only reason.

**Fix.** Either build it — AES-256-GCM under a per-account data key wrapped by a KMS root,
written at import, `key_version` meaningful, destruction on deletion — or change
`DELETION_SCOPE[0]` to describe what actually happens (rows deleted; no SSN is stored at all)
and add the ingest path that makes eCPR reachable. Do not ship the sentence without the key.

### M-3 · Membership revocation does not end access; the boundary that would enforce it is dead code
`src/platform/auth/session.ts:423` (`sessionStillAuthorized`), `:395`
(`revokeAllSessionsForAccount`), `:387` (`touchSession`).

**Defect.** All three have zero callers outside their own module:

```
$ grep -rn "sessionStillAuthorized\|revokeAllSessionsForAccount\|touchSession" src/ \
    --include=*.ts --include=*.tsx | grep -v platform/auth/session.ts
(no output)
```

`sessionStillAuthorized`'s docstring calls it "the second half of the boundary… the one place a
session's account could ever have gone stale (a membership revoked after the session was
issued)". `requireSession` (`(app)/_lib/auth.ts:49`) never calls it. `auth_sessions.account_id`
is fixed at issue time and never re-checked against `memberships`.

**Failing scenario.** An office manager is removed from an account. Her `rp_session` cookie
keeps full read and write access to that account's certified payroll — including every worker's
name and SSN last-four — for the remainder of the 14-day TTL, on a product whose only
authentication factor is a cookie. There is no "sign out everywhere" control on any screen.

**Fix.** Call `sessionStillAuthorized` inside `currentSession` and treat `false` as
`{ ok:false, reason:'revoked' }`. Call `revokeAllSessionsForAccount` from whatever removes a
membership. Call `touchSession` so `last_seen_at` is real and a sliding-idle policy becomes
possible. A documented control with no caller is worse than an absent one: it is why nobody
looked again.

### M-4 · The rate-card delivery token is an unauthenticated bearer capability in a URL that discloses an email
`src/app/(app)/rate-card/r/[token]/page.tsx:38-52`, `src/platform/billing/checkout.ts:256`.

**Defect.** `SELECT … FROM rate_card_purchases WHERE delivery_token = ${token}` runs on the pool
handle with no session and no tenant context, and the page renders `purchase.email` verbatim
(`:183`). The token is a good one (256-bit, `newToken()`), but unlike every other token in the
product it is stored **in plaintext** — `rate_card_purchases.delivery_token` is a `text` column
compared directly, not a digest — and it lives in a URL with a **twelve-month** TTL. `robots`
is not set to `noindex` on this page (contrast `wh347/p/[token]/page.tsx:21`, which does).

**Failing scenario.** A twelve-month URL in a browser history, a `Referer` header to any
outbound link, a corporate proxy log, or a pasted link in a shared channel discloses the buyer's
email address and the purchase to anyone who has it, forever, with no revocation control. A read
of `rate_card_purchases` — which is granted `SELECT` to `ratepin_app` with **no RLS**
(`0000_init.sql:1787`) — hands over every live delivery capability at once.

**Fix.** Store `sha256(token)` and look up by digest, as `auth_sessions` and `auth_magic_links`
already do. Add `robots: { index:false, follow:false }` and `Referrer-Policy: no-referrer` to
the page. Show the purchase without the email address — the buyer knows their own address, and
`:183`'s "Sign in with `{email}`" can read "sign in with the address you bought this with".
Shorten the TTL, or make it renewable from the billing screen rather than perpetual.

---

## LOW

### L-1 · No rate limit on magic-link issuance
`src/app/(app)/_actions/auth.ts:29-61`. `sendMagicLink` writes an `auth_magic_links` row and an
`email_outbox` row per POST with no throttle, no captcha and no per-address ceiling. An attacker
mail-bombs any address at will (the product will send it, because the outbox drains
automatically) and grows two unbounded tables. `purgeDeadSessions` clears expired links but is
only reachable from `retention.sweep`. **Fix:** reject when an unconsumed, unexpired link
already exists for that address (return `state=sent` regardless, so it stays non-enumerating),
and add a per-address and per-IP counter. **Note:** `state=sent&email=…` at `:61` reflects the
submitted address into the URL — harmless as rendered today, but it means the address lands in
server access logs and browser history for every sign-in attempt, including typos.

### L-2 · Export object keys are deterministic and name the account
`src/platform/account/export.ts:334` builds `exports/${account}/${timestamp}.zip`, and
`settings.ts:56` puts that key in a redirect URL. No route currently serves it, so this is not
exploitable today — but the key is guessable from an account id plus a minute, so if R2 ever
gets a public prefix or a presigned-by-key helper, the export becomes enumerable. **Fix:** make
the key a random 256-bit opaque string with the account id stored beside it, not inside it.

### L-3 · `ratepin_app` holds `INSERT`/`UPDATE` on `stripe_events` and `jobs` with no RLS
`drizzle/0000_init.sql:1787`. Correct for the worker; over-broad for the web tier, which shares
the role. A compromised web process can write the money ledger the webhook handler trusts for
idempotency (`webhook.ts:92-105`) — pre-inserting an event id makes the real webhook a
`duplicate` no-op, silently dropping a subscription change. **Fix:** split the role, or move the
ledger write behind a `SECURITY DEFINER` function the web tier cannot call.

---

## What I checked and found sound

Stated so this reads as a review rather than a list of everything I happened to look at.

- **Webhook signature verification** (`gateway.ts:135-165`) is correct and hand-rolled for the
  right reason: HMAC-SHA256 over `${timestamp}.${payload}`, constant-time compare across all
  `v1` candidates, 300-second tolerance enforced *before* the compare, and `webhook.ts:66-72`
  verifies before `JSON.parse`. The route (`api/stripe/webhook/route.ts:48`) reads
  `request.text()` and never a parsed body. **Replay is genuinely closed** by the
  `stripe_events` ledger's `ON CONFLICT (id) DO NOTHING` (`webhook.ts:97-104`) *and* by the
  timestamp window, which are independent. The error body names only configuration faults.
- **The crosswalk aggregate** (`classify/aggregate.ts`) is the best-defended module in the
  codebase. `CandidateOrdering` carries one field guarded by a module-private `unique symbol`,
  so a pre-selection is unrepresentable rather than forbidden; the k-anonymity floor is
  explicitly documented as *not* the defence (sybils are free under A1) and the granted power —
  ordering only — is what bounds the blast radius. `crosswalk_eligible_account` is correctly
  not granted. The *read* is sound; the *observation write path* is covered by H-2.
- **The free tier** takes no server-side row at all (`(free)/_lib/session.ts`), and the
  classification is chosen by **ordinal into the mirror's own parsed rows**, never by id — a
  forged classification id is unrepresentable, not filtered. `/wh347/p/[token]` is a
  browser-local handle with `robots: noindex` and no server lookup.
- **Session cookie attributes** (`session.ts:283-300`) are right: `httpOnly`, `SameSite=Lax`,
  `secure` in production, absolute expiry matching the row.
- **The mirror** has no `UPDATE`/`DELETE` grant to `ratepin_app` (`0000_init.sql:1770-1776`),
  so the corpus cannot be rewritten from the web tier even with RLS off.
- **`FORCE ROW LEVEL SECURITY`** is applied on every policied table, not just `ENABLE` — the
  owner-bypass trap is closed *in the DDL*. That it is defeated in practice by the deployment
  connecting as the owner (C-1) is a configuration consequence, not a schema one.

---

## Reproduction

```bash
/usr/lib/postgresql/16/bin/initdb -D $PGDATA -U postgres --auth=trust
/usr/lib/postgresql/16/bin/pg_ctl -D $PGDATA -o '-p 55432 -k /tmp' start
psql -p 55432 -U postgres -c "CREATE ROLE ratepin_owner LOGIN SUPERUSER"
psql -p 55432 -U postgres -c "CREATE DATABASE ratepin OWNER ratepin_owner"
psql -p 55432 -U postgres -d ratepin -c "CREATE EXTENSION pgcrypto; CREATE EXTENSION pg_trgm"

cd run-2/app
DATABASE_DRIVER=postgres DATABASE_URL='postgres://ratepin_owner@127.0.0.1:55432/ratepin' npm run db:migrate
DATABASE_DRIVER=postgres DATABASE_URL='…' ADAPTER_MODE=mock npm run seed

# C-1: the owner role — the deployable configuration
DATABASE_URL='postgres://ratepin_owner@127.0.0.1:55432/ratepin' … npx next dev -p 3100

# C-2: the role ADR-011 mandates
psql -p 55432 -U postgres -d ratepin -c "ALTER ROLE ratepin_app LOGIN"
DATABASE_URL='postgres://ratepin_app@127.0.0.1:55432/ratepin'   … npx next dev -p 3101
```

Sign-in was driven by inserting an `auth_magic_links` row with a known `sha256(token)` — the
same substitution `e2e/support.ts` makes when it reads the link out of `email_outbox`, and the
only step that stands in for a mail delivery. Every other step is an unmodified HTTP request to
the running application.
