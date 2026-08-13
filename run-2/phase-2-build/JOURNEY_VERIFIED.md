# JOURNEY_VERIFIED

**What this document is.** The product was driven — not called — through J1…J12 in a real
browser, and a screenshot was taken at every step. This is the record of what was asserted at
each one, what the screenshot shows, what had to be fixed to get there, and what could not be
verified and why.

Everything below was produced by `npx playwright test` against `next dev` on a local Postgres
seeded from the recorded SAM.gov bytes. The whole run takes about two minutes and is
reproducible from the commands in §1.

- Suite: `run-2/app/e2e/` — `journey.spec.ts`, `shell.spec.ts`, `tenancy.spec.ts`, `support.ts`,
  `global-setup.ts`
- Config: `run-2/app/playwright.config.ts`
- Screenshots: `run-2/phase-2-build/screenshots/01…16-*.png`

**Result: 6 tests, 6 passed.** The sixth is `tenancy.spec.ts`'s provisioning test, marked
`test.fail()` because it documents a defect that is real today — see §4.1. It is reported by
Playwright as passing *because it failed as declared*, and it will fail the suite the day
somebody fixes the defect, which is the point.

`npm run typecheck` is clean, `npm test` is 807/807 across 41 files, and `npm run build`
succeeds with 34 routes (33 before this wave; the new one is `/api/stripe/webhook`).

---

## 1 · How to reproduce it

```bash
# A Postgres with the two extensions the schema needs.
createdb ratepin
psql -d ratepin -c 'CREATE EXTENSION pgcrypto; CREATE EXTENSION pg_trgm'

# Schema, ledger, platform DDL and the plan catalogue.
DATABASE_DRIVER=postgres DATABASE_URL=postgres://…/ratepin npm run db:migrate

# The mirror: three determinations out of the bytes SAM.gov sent on 2026-08-13.
DATABASE_DRIVER=postgres DATABASE_URL=postgres://…/ratepin ADAPTER_MODE=mock npm run seed

# The journey. Starts its own dev server, truncates customer data, keeps the mirror.
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test
```

Two deliberate choices in `playwright.config.ts`, both stated there at length:

- **`next dev`, not a production build.** `src/lib/config.ts` refuses `ADAPTER_MODE=mock` under
  `NODE_ENV=production`, and Next inlines `NODE_ENV` into the server bundle at build time — so a
  production build of this application can only boot against live Stripe, live SAM.gov, live R2
  and live Resend. A journey against a production build would be a journey against the internet.
  `next build` is still gated separately and passes.
- **Postgres, not PGlite.** Signing in means reading the magic link out of `email_outbox`, which
  the running server wrote; PGlite's data directory admits one process at a time. Postgres is
  also the driver that ships.

Nothing in the suite reaches the network. `ADAPTER_MODE=mock` binds the recorded fixtures for
SAM.gov, Anthropic, Stripe, R2 and Resend.

---

## 2 · The journey, step by step

Every step also asserts **A3** — no `mailto:`, no `tel:`, no `sms:`, no link or button whose
accessible name offers contact, and no third-party script or iframe. That check looks for
*affordances*, not words, because this product says "there is no telephone number on this site
and no contact form" out loud and a substring scan would flag the sentence denying the thing.

| # | Screen | Screenshot | What was asserted |
|---|---|---|---|
| 01 | S00 landing, light | `01-landing-light.png` | Wordmark is `Ratepin`, one word. The boundary statement is present and carries **no control that could dismiss it**. A3. |
| 02 | S00 landing, dark | `02-landing-dark.png` | Same page under `prefers-color-scheme: dark` — an independently authored palette, not a filter. |
| 03 | S03 pricing | `03-pricing.png` | Renders; A3 (this is the page most likely to grow a "talk to sales"). |
| 04 | S01 free WH-347 generator | `04-free-wh347-generator.png` | `VA20260195` resolved **out of the mirror, with no live SAM call** — the chip prints revision 2 published 2026-08-06 and the parsed classification count. One worker, 40 straight-time hours at \$14.85, one statutory deduction, gross \$594.00, net \$548.56. §4.4.1's contract-value question with **nothing pre-selected** (asserted, not assumed). |
| 05 | S02 free DRAFT | `05-free-wh347-draft-preview.png` | Typing the payroll title `Laborer` blocks the line and offers **the determination's own classification list** — P-A — and the screen *stays* so it can be answered (see §3.4). After answering: `DRAFT — NOT CERTIFIABLE`, the signature block **withheld with its reason**, a two-page PDF whose page count comes from the renderer, and the provenance block naming the determination, revision, publication date, corpus snapshot, form revision, engine and build. |
| 06 | S04 county × craft | `06-rates-county-craft.png` | `/rates/va/gloucester` lists crafts; following one lands on a rate page that names `VA20260195`. Every rate on the page carries the determination it came from. |
| 07 | S09 sign in | `07-signin.png` | One field. **No password input exists** on the page. A3 — a sign-in screen is exactly where a product with no support channel is tempted to put an address. Then signed in for real: the form was submitted, the magic link read out of `email_outbox` (the app's own delivery record), and the link followed once. |
| 08 | S10 project setup | `08-project-setup-contract-value-band.png` | Six fields. **No contract-value option pre-selected**, and *Create the project* is genuinely `disabled` until one is, with the reason rendered beside it — §8.2's rule that a disabled button without an adjacent reason is a review failure. After submit, the pin is written and the project page names it. |
| 09 | S13 payroll upload | `09-payroll-upload.png` | The dropzone and the SSN sentence, before a file exists. |
| 10 | S14 column map | `10-column-mapping.png` | Component **M** after reading the CSV **in the browser**: the receipt naming the file, its size, its rows, its columns and a digest prefix, with the suggested mapping and what each column matched on. |
| 11 | S15 classification picker | `11-classification-picker-nothing-selected.png` | Five blocked lines. **Nothing is pre-selected** (`input[type=radio]:checked` = 0). *Use this classification* is `disabled` with "Nothing is chosen…" beside it. Each candidate carries the determination's **verbatim scope text**, its rate identifier, base and fringe, and the source line span. **No count of other companies' confirmations appears anywhere** — §6.3.1's permission table asserted as a regex over the rendered card. Below the list: nothing. |
| 12 | S16 filing, DRAFT | `12-filing-draft-not-certifiable.png` | Generated with one line still blocked. Status chip `Draft — not certifiable`. The signature block is **structurally absent**: `.rp-signature--withheld` is present and `.rp-signature__caption` and `.rp-signature__line` are both count 0 — not greyed out, not a banner over it. Exceptions render as the four primitives; the eCPR chip is separately BLOCKED with its non-California reason. |
| 13 | S16 filing, CERTIFIABLE | `13-filing-certifiable-provenance.png` | Last line answered, regenerated. Chip `Certifiable`, and the draft chip is count 0 — asserted both ways, because "CERTIFIABLE" is a substring of "DRAFT — NOT CERTIFIABLE" and a naive `contains` would pass on exactly the artifact this step distinguishes itself from. The signature block **is** rendered. The provenance panel contains `VA20260195`, `revision 2` and `2026-08-06`. |
| 14 | S19 WD-change | `14-wd-change-repin.png` | Driven, and it renders its **true** state for this corpus: *"No newer revision of this determination is published. There is nothing to decide, and this page will say so until there is."* The contract-lock question below it is live. **The three equal-weight actions were not reached** — see §5.1. |
| 15 | S21 billing | `15-billing-allowance-overage.png` | Nine certifiable filings released and one draft generated. The screen reads: released **9**, drafts never billed **1**, included in plan **8**, overage filings **1**, overage this period **\$2.50**, cap **\$150.00**. Each was checked against D4's pricing function rather than against itself — \$150.00 is Crew (\$249) minus Solo (\$99), the point at which staying put stops being cheaper than moving up. |
| 16 | S24 status | `16-status-public.png` | The public page renders unauthenticated. A3. |

### How the nine filings were produced

The subscription was created by **POSTing a signed Stripe event at the product's own
`/api/stripe/webhook`** — ADR-007 makes a webhook the only input that moves entitlement, and
nothing in this suite writes a billing row directly. The eight additional payroll weeks were each
uploaded through the same screen a customer uses, with different hours (a re-upload of identical
bytes is the duplicate §5.4 refuses) and with gross and net moved to match, so no week carried a
reconciliation exception. From the second week on, **the column map applied silently and every
classification was answered from memory** — §5.1 and §6.3, asserted rather than assumed: the run
fails if a picker is still on the screen.

---

## 3 · What had to be fixed to drive it

Each of these blocked a step. None was visible to `npm test`, and none is a test-only change.

### 3.1 The `postgres` driver could not store a single blob — `src/db/index.ts`

`npm run seed` died on the first write of the first ingest stage with
`TypeError: The "string" argument must be of type string … Received an instance of Date`,
before the statement reached the server.

`drizzle-orm/postgres-js`'s constructor reaches into `client.options` and replaces the serializer
for the eight date OIDs with `(val) => val`. That is right for the query builder — drizzle's own
timestamp mappers already hand the driver a formatted string. It is wrong for a raw `sql`
template, which this codebase uses wherever the schema outgrows the builder: postgres-js infers
OID 1184 for a JS `Date`, the identity serializer passes the `Date` through untouched, and the
wire writer calls `Buffer.byteLength` on it.

**It was invisible to everything.** `drizzle-orm/pglite` performs no such override, and the whole
suite, the seed and `npm run dev` run on PGlite. On the driver that ships, `runIngest` — the first
write of the nightly job — could never complete.

Fixed at the driver boundary: after `drizzlePg(...)` installs the override, the date serializers
are restored to a function that passes strings through unchanged and serializes a `Date` the way
postgres-js would. Drizzle's reason is kept; its overreach is dropped.

### 3.2 There was no route for Stripe to POST to — `src/app/(app)/api/stripe/webhook/route.ts`

`src/platform/billing/webhook.ts` is complete — verify before parse, ledger before dispatch,
`processed_at` after — and `handleStripeWebhook` is documented in that module as "the route
handler's whole body". **Nothing called it.** There was no HTTP route anywhere under `src/app`
that Stripe could reach, and every screen that reads entitlement reads state that only a webhook
writes. Checkout could open, the payment could succeed, and the account would stay on `none`
forever: no plan, no allowance, no overage, no dunning, no chargeback handling, no rate-card
fulfilment. `tests/platform/` calls `handleStripeWebhook` directly, which is the one caller that
does not need the route to exist.

Added as a thin binding: raw body, signature header, no session, and an error body that names a
configuration fault and never an account or an amount.

### 3.3 Every plan was "unlimited, no overage" — `src/scripts/migrate.ts`, `src/db/index.ts`

`0000_init.sql` seeds the three plans with `included_filings` and `overage_price_cents` NULL, and
`ensurePlanCatalog` fills them in from `PLAN_ALLOWANCES` (8 / 40 / unlimited, at \$2.50 over). It
was called from exactly two places: `src/worker/index.ts` and the platform test helper — neither
the web process nor `db:migrate`, which is the only command a deploy runs.

`pricing.ts` reads NULL as **unlimited** and fails toward the customer, so this had no error and
no symptom: the billing screen simply said every plan was unlimited with no overage, offered Solo
with "no cap — this is the top plan", and could never meter one filing of overage or trigger the
auto-upgrade. The whole of D4's pricing function was unreachable, and the screen said so out loud.

This is the same defect the previous wave found in `ensurePlatformSchema`, one table over. Fixed
the same way: applied by `db:migrate` (the admin process, factor XII) and by the dev fallback.
Idempotent; it never overwrites a value an operator set.

### 3.4 The free tier's classification picker was unreachable — `src/app/(free)/_components/generator.tsx`

§1.4 gives a blocked line on the free path two outcomes, and they are two different clicks: *"he
picks one"* from the determination's own list, or *"he picks nothing and generates anyway"*.
`onGenerate` navigated to the preview on **any** `ok` response. The picker block renders on
`result.pickers.length > 0` and could therefore never be seen by anyone — the screen was already
gone. The first of §1.4's two outcomes did not exist and the free tier's only classification
affordance was dead markup.

Fixed: the first generate that comes back with blocked rows stays on the page and shows them; a
second, separately labelled button — *"Generate it anyway, with these rows on the exception
report"* — is §1.4's other row, said out loud.

### 3.5 The remembered column map could never apply — `import-wizard.tsx`, `imports/new/page.tsx`

§5.1: *"the first upload maps; every upload after that applies the map silently"*, which is what
makes S13 "disappear after the first use". S13 calls `rememberedMap(tx, { projectId, header: [] })`
— and it has no choice, because the file is parsed in the browser and never uploaded, so the
server has no header to compare. `rememberedMap` hashed the empty array and returned
`sameShape: false` **for every file in the world**. Every week walked the full column mapper
again: heuristic #6 and WCAG 2.2 SC 3.3.7 unimplemented in practice.

Fixed by deciding shape in the wizard, where the header exists, and removing the `sameShape` prop
that could only ever be `false`. The comparison stays strict — trim and case only — because a map
from a different export applied silently is a wrong rate on a document somebody signs.

### 3.6 The overage cap named the wrong quantity — `app/settings/billing/page.tsx`

`capCents` is `price(next) − price(current)`; `pricing.ts` explains at length why any other
reading is the trap §11.4 names. The line rendered it as *"— the price of the next plan"*, so
Solo showed "\$150.00 — the price of the next plan" beside a Crew card reading \$249.00. Relabelled
to what the number is.

---

## 4 · What is broken and was not fixed

### 4.1 Nobody can sign in on the role ADR-011 mandates — **the headline finding**

Pinned by `e2e/tenancy.spec.ts` as an expected failure.

The server is supposed to connect as `ratepin_app`, the `NOBYPASSRLS` role every policy in
`0000_init.sql` is written `TO`. Booted that way, sign-in fails immediately:

```
INSERT INTO users (id, email, created_at) VALUES (…) ON CONFLICT (email) DO NOTHING
ERROR 42501: new row violates row-level security policy for table "users"
```

`redeemMagicLink` is the whole of account provisioning, and it runs on the pool handle with **no
tenant context** — correctly, because at that moment there is no tenant: the account it is about
to create does not exist. Every policy it must satisfy is written against
`ratepin_current_account()`, which is NULL there. Three separate consequences:

- The `users` policy's `WITH CHECK` is `true`, but `ON CONFLICT` additionally applies the
  policy's `USING` expression to the proposed row, and that one requires a membership the row
  cannot have yet. (The same INSERT **without** `ON CONFLICT` succeeds — confirmed at the psql
  prompt.)
- `INSERT INTO memberships …` would fail on `WITH CHECK (account_id = ratepin_current_account())`.
- The returning-user lookup `SELECT … FROM users WHERE email = …` returns nothing, so a customer
  who already has an account is treated as new and collides on the unique email.

It is invisible to `npm test` because PGlite connects as a superuser and the harness switches to
`ratepin_app` only for the assertions that are *about* RLS; invisible to `npm run seed` because
the seed connects as the owner; and invisible to `npm run dev` for the same reason. Only the
worker calls `assertRlsEnforced`; the web process never does.

**It was not fixed here, deliberately.** Provisioning has to cross the tenant boundary somewhere,
and choosing where — a `SECURITY DEFINER` function owned by a dedicated role with its own
policies, versus policies that admit an unscoped self-provisioning insert — is an ADR, not a
patch. Guessing at it inside two other modules at the end of a wave would be worse than reporting
it precisely.

**What that costs these screenshots, stated plainly:** the journey runs as the database owner, so
**row-level security was inert for the whole run**. The second of ADR-011's two mechanisms was not
in force behind any of the sixteen images. The first — tenant-scoped repositories — was partially
exercised and is *not* sufficient on its own: `rememberedMap` reads `payroll_imports` with no
account filter and relies entirely on RLS, and against an owner connection a brand-new account's
first upload silently arrived with an earlier account's column map already applied. That is how
this was found. Other reads are written the same way and were not audited one by one.

`e2e/global-setup.ts` truncates customer data before each run so the journey starts from a
genuinely empty account. That makes the run reproducible; it does not make the leak go away.

### 4.2 The WD-change screen's three actions could not be reached

§8.1's three equal-weight actions render only when a **newer revision of the pinned determination
exists in the mirror**. The recorded corpus holds one revision each of `VA20260195` (r2),
`LA20260005` (r2) and `DC20260001` (r5), so there is nothing to decide and the screen says so —
which is what `14-wd-change-repin.png` shows, and which is itself a specimen worth keeping.

The nearest honest route was `document/VA20260195-r0.json`, a genuinely recorded superseded
revision, ingested with `runIngest`'s `backfillHistory: true`. It does not work: `walkRevisions`
goes 0 → 1 → 2 and stops at the first not-found, and **revision 1 was never recorded**, so the
mock fetcher throws by design. Getting to the three actions would mean inventing either an HTTP
404 for r1 that nobody observed or a second revision's rates outright — putting unfetched bytes in
the mirror, which is the one thing this corpus refuses.

The spec assertion in the journey handles both worlds: if the three actions are present it checks
there are exactly three, that none carries `rp-btn--primary`, and that none has focus; otherwise
it asserts the honest empty state. Recording a real second revision of one determination is the
smallest change that would close this.

### 4.3 The PDF's document title renders as mojibake

`/Title` on the generated WH-347 reads `WH-347 payroll \227 … \227 week ending …`. Octal 227 is
0x97 — an em dash in **WinAnsi**, which is right for a content stream (the font's `/Encoding` is
`WinAnsiEncoding`) and wrong for a document-info string, which the PDF spec reads as
**PDFDocEncoding** unless it carries a UTF-16BE BOM. The two encodings differ exactly in
0x80–0x9F, which is where the em dash lives. Chromium's viewer renders it `Š`, visible in the tab
title in `05-free-wh347-draft-preview.png`. `/Subject`'s `·` (0xB7) is unaffected, because the two
encodings agree above 0xA0.

`pdfLiteral` is shared between content streams and the info dictionary. Not fixed: the correct
change is to emit info strings as UTF-16BE with a BOM, which alters the PDF's bytes and therefore
every stored artifact digest — a migration question, on the one file in this product whose bytes
are load-bearing. **The page content is unaffected.** This is document properties only.

### 4.4 The inline PDF preview needs a moment in headless Chromium

The free preview embeds the artifact as `<object type="application/pdf">`. Headless Chromium
paints the viewer chrome before the document, so an immediate capture is a dark rectangle. The
run now waits three seconds and the screenshot shows the real two-page WH-347 with its DRAFT
watermark. The page count on the download control comes from the renderer, and is asserted.

---

## 5 · What was not verified at all

Stated as a list, because a verification report that reads as a coverage claim is the first place
a document starts lying.

- **The three re-pin actions (S19)** — §4.2 above. The screen was driven; that state of it was not.
- **The California eCPR XML end to end.** No California determination is in the recorded corpus,
  so the chip blocks with its correct non-CA reason (visible in screenshots 12 and 13) and no XML
  is emitted. The renderer, its hash-pinned XSD and its parity tests are exercised by
  `tests/artifacts/`.
- **Row-level security behind any screen** — §4.1.
- **Live Stripe Checkout and the hosted portal.** `startCheckoutAction` redirects to a URL the
  fake gateway mints; the journey does not follow it. The entitlement change was driven through
  the webhook, which is the only input ADR-007 lets move it.
- **The worker's sixteen jobs.** None ran during the journey. The nightly ingest, the WD-change
  alert, dunning, the credit job and the canary are covered by `tests/` and by
  `npm run corpus:ingest`, which still HELDs on `COVERAGE_SHORTFALL` by design.
- **Email delivery.** The outbox row is the delivery record and the journey reads it; no mail was
  sent, and `ADAPTER_MODE=mock` cannot send one.
- **`/rates/watch` (S05), the rate-card purchase flow (J3), account deletion and export (J12), the
  Friday board's "Run the week" button, and the memory and data settings screens.** Not driven.
  Several are covered by `tests/web/app.test.ts` at the server-function level.
- **Any browser other than Chromium**, and any viewport other than 1280×900. The captures are at
  `deviceScaleFactor: 2` so the rate figures on the artifacts are legible.
- **Whether the arithmetic is correct.** The journey proves the numbers on the screen are the
  numbers the engine computed and that they are consistent across the artifact, the totals panel
  and the billing meter. It proves nothing about whether they are *right*: G1's golden payroll
  suite is 18 lines of a required 500 and `npm run canary` still exits non-zero. All five claim
  gates remain locked, and no screen in these screenshots claims otherwise.

---

## 6 · Autonomy, as observed

Sixteen screens, driven end to end, and the run asserts on every one of them that there is no
`mailto:`, no telephone link, no control offering contact, and no third-party embed. Nothing was
found.

Every refusal encountered on the way was one of the four primitives and none of them offered a
person: the free path's blocked line offered the determination's own classification list (P-A);
the draft withheld its signature block and said why (P-B); the pin's freshness sentence narrows
rather than blocks (P-C); the eCPR chip and the FAR panel decline the conclusion and state the
rule instead (P-D). The one place the product could not answer a question — no newer revision to
compare — it said so in a sentence and stopped.
