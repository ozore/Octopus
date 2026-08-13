# BUILD REVIEW — adversarial pass over `/app`

**Reviewer:** staff engineer, adversarial brief
**Date:** 2026-08-13
**Scope:** the whole of `/home/user/Octopus/app` against the binding specs — `IDEA_DOSSIER.md` §0 (D1–D10), `ARCHITECTURE.md` (I1–I5, ADR-001…008), `LLM_ENGINE.md` (ADR-101/102), `CORPUS_DESIGN.md`, `USER_JOURNEY.md`, `identity/BRAND.md`, `identity/DESIGN_SYSTEM.md`.
**Baseline at review start:** 342 tests / 26 files green, `typecheck` clean, `next build` clean, `corpus:check` clean.
**State at review end:** 347 tests / 27 files green, `typecheck` clean, `next build` clean, `corpus:check` clean, **six criticals fixed and covered by new regression tests**.

---

## 0. The verdict in one paragraph

The engine is the strongest part of this build and the part the product is named after: the citation invariant is genuinely structural, D9 is honoured without exception, and the state machine is exhaustively tested. The weakness is not in the parts that were designed carefully — it is at the **edges where a designed module meets the outside world**. Three modules were written against collaborators that did not exist (`billing/webhook.ts` against a route, `email/inbound.ts` against a route *and* an enqueue call, the citation invariant against a CI lane), and in each case the module was tested in isolation, passed, and was never exercised through the boundary that would have shown the gap. **The free-preview paywall was likewise enforced only by which components a page chose to render**, which is not enforcement at all. Every one of those is now fixed. The pattern worth carrying into Phase 3: *a green unit test on a module proves the module; it does not prove the module is reachable, or that anything unreachable is refused.*

---

## 1. Findings by severity

| # | Severity | Finding | Status |
|---|---|---|---|
| C-1 | **Critical** | Paywall bypass: `/case/{id}/plan` served the full paid document to any unpaid case | **Fixed** |
| C-2 | **Critical** | Paywall bypass: `/appeal/{id}` redirected to the document on a *pending* payment row | **Fixed** |
| C-3 | **Critical** | Paywall leak: the full drafted document was serialised into the pre-payment SSE stream | **Fixed** |
| C-4 | **Critical** | No Stripe webhook HTTP route existed — the live revenue path could never complete | **Fixed** |
| C-5 | **Critical** | Webhook idempotency was claimed outside the fulfilment transaction; a failed fulfilment was permanently swallowed on every Stripe retry | **Fixed** |
| C-6 | **Critical** | No CI configuration existed at all — the citation invariant was enforced by a test nothing ran | **Fixed** |
| H-1 | High | No inbound-email route existed, and nothing ever enqueued `process_inbound_notice` — Shield could receive nothing and process nothing | **Fixed** |
| H-2 | High | `instanceof` across Next's split module graphs is unreliable; a forged inbound signature 500'd instead of 400'ing, telling the sender to retry a payload we had refused | **Fixed** |
| H-3 | High | "No network in tests" rested entirely on adapter routing; nothing prevented a stray `fetch` | **Fixed** |
| M-1 | Medium | `/ops` authenticates by `?key=` query parameter — a secret in URLs, referrers and access logs | Open, recommended |
| M-2 | Medium | PGlite fixture cost exceeded the 10s hook timeout under load; failures read as product bugs | **Fixed** |
| M-3 | Medium | `PlanDocument`'s header claims the invariant is expressed in its prop types; it is not | Open, documented |
| L-1 | Low | `test-results/.last-run.json` and `tsconfig.tsbuildinfo` are on disk despite `.gitignore` | Open, cosmetic |
| L-2 | Low | Three job kinds are deliberately unregistered; the loud failure is by design but undocumented in `/ops` | Open, by design |

**Clean on every axis explicitly asked about:** D9 compliance, pricing consistency, state-machine enforcement, secrets handling, queue correctness, accessibility, and the README's instructions (§3).

---

## 2. The criticals, in detail

### C-1 / C-2 / C-3 — the paywall was a rendering decision, not an authorisation rule

`ARCHITECTURE.md` §1 is unambiguous: *"The paywall therefore sits between the critique and the full document."* That sentence describes a server-side authorisation boundary. What was built enforced it three different ways, none of which held.

**C-1.** `/case/{id}/plan` fetched the case and rendered `<PlanDocument>` whenever `record.sections` existed. Payment changed a `StatusPill` from "Preview" to "Payment recorded" — and nothing else. Anyone reaching the URL got the three drafted sections.

**C-2.** `/appeal/{id}` redirected to that page on `if (record.payment)` — the mere *existence* of a `payments` row. `startCheckout` writes that row as `pending` before the seller ever reaches Stripe. So the complete exploit needed no tampering and no guessed URL:

> press *Get my Plan of Action — $149* → a pending row is written → press Back → `/appeal/{id}` redirects to `/case/{id}/plan` → the full $149 document renders.

This is the product's own navigation handing over the artifact for free. It also inverts the exact distinction ADR-007 exists to draw — *"a row that exists with `status='pending'` is a Checkout that was started, never a purchase that completed"* — which `case-store.ts` states correctly in a comment while the two call sites ignored it.

**C-3.** Independently, `PreviewPayload` carried `sections: DraftSections` over the SSE stream. No component rendered it; every browser received it. A field nothing renders is still a field the network tab shows.

**Fixes.** The gate is now server-side and keyed on `payment?.status === 'paid'` — the value only the webhook writes. `sections` is removed from the wire type entirely (both the live and the rejoin emit paths), with the reason stated on the type so a future contributor re-adding it has to argue with a comment first. The unpaid case gets an honest screen that restates what *is* free rather than a dead end.

**Coverage added.** `src/app/(app)/case/[caseId]/plan/paywall.test.tsx` — three tests: an unpaid case must not render the sections; a *pending* payment counts as unpaid (driven through the real `createCheckoutForCase`); and the document does appear once fulfilment has run through `handleStripeWebhook`, so the test proves a gate that opens rather than one that is merely shut. `appeal-run.test.ts` now asserts the absence on the wire — `expect(JSON.stringify(preview.preview)).not.toContain(sections.rootCause)` — because the DOM is the wrong place to check what the browser received.

### C-4 — the Stripe webhook had no endpoint

`lib/billing/webhook.ts`, `fulfillment.ts`, `refunds.ts` and `shield.ts` were all written, tested and correct. Nothing routed HTTP to them. `src/app/api/` contained exactly `health` and the SSE stream.

The consequence is specific to how careful the rest of the design is. `recordCheckoutReturn` deliberately grants nothing in live mode — *"Only the webhook may unlock a case"* — which is right. With no webhook endpoint, live mode had **no path at all** by which a payment became `paid`: Stripe would charge the card, the case would sit in `preview_ready`, no Shield, no outcome sequence, no receipt. The mock path masked this completely, because `recordCheckoutReturn` synthesises the event and drives the real handler — so every test and every local run exercised fulfilment while the production wiring was absent.

**Fixed:** `src/app/api/stripe/webhook/route.ts`. Raw body read before any parsing (the signature is over exact bytes); 400 on an unverified payload without touching the database; **500, not 200, on a fulfilment failure**, because Stripe's three-day retry schedule *is* the recovery mechanism and swallowing an error into a 200 abandons a customer who has paid; and the response body is a status word so an unauthenticated caller learns nothing. Verified live: a forged signature returns `400 {"status":"invalid_signature"}`.

### C-5 — a failed fulfilment was permanently swallowed by its own idempotency guard

`fulfillCheckoutSession` opened with:

```ts
const { isNew } = await stripeEventsRepo.recordStripeEventIfNew(db, {...});
if (!isNew) return { status: 'duplicate' };
```

committed in its own implicit transaction, *before* the work it guards. The comment asserted the invariant it needed — "every side effect below has already happened (or is in flight)" — but nothing enforced it. Anything that threw afterwards rolled the fulfilment back and left the claim standing: the `payments` row not yet visible because our own Checkout write was still committing, a Stripe timeout on `retrieveSession`, a transient database error. Stripe then retried, as designed, and **every retry read the row and returned `duplicate`**.

The end state is the worst available: card charged, case still `preview_ready`, no outcome sequence, no receipt — and the system reporting success on every retry. A swallowed retry is strictly worse than a double-send, because the double-send is loud.

**Fixed:** the claim is taken with `recordStripeEventIfNew` *inside* the same transaction as every write it guards, so the two commit or roll back together. A cheap `getStripeEvent` pre-check keeps an obvious replay to one SELECT. The primary key on `stripe_events.id` still makes a genuine replay a no-op, including under concurrent delivery.

**Coverage added:** `tests/billing.test.ts` — "releases its idempotency claim when fulfilment fails, so the Stripe retry still fulfils". It deletes the `payments` row to reproduce the real out-of-order shape, asserts the first delivery throws *and leaves no `stripe_events` row*, then re-creates the row and asserts the retry genuinely fulfils and moves the case to `paid`.

### C-6 — there was no CI

`.github/` did not exist anywhere in the repository.

This is the finding with the widest blast radius because of what the documents claim. `ARCHITECTURE.md` §2.1 specifies the lane. **I2** defines the citation invariant as *"a render gate **plus a CI test**"*. `NAMING.md` §3.3 promises *"the invariant fails the build before it fails a customer."* B10 warns that without evals in CI *"every prompt change is a coin flip."* `app/README.md` documents a "blocking CI order" in a fenced block.

All of it described a mechanism that did not exist. `citations.invariant.test.ts` is a good test that nothing ran unless a human remembered to. The product's central brand claim was enforced by convention.

**Fixed:** `.github/workflows/ci.yml` — `npm ci` → typecheck → unit → **citation invariant** → **golden-set eval** → **corpus:check** → `next build`. Node 22, matching `node:22-slim` in the Dockerfile (factor X). No secret appears in the file, and the env block pins `ADAPTER_MODE=mock` / `DATABASE_DRIVER=pglite`, so the offline guarantee is a property of the lane rather than of the runner's luck.

The two invariant files run as **separately named steps** even though `npm test` already includes them. A green aggregate is not evidence a specific gate ran: a rename or an `include`-glob edit can silently drop a file from the suite and leave every light green. Naming them means "did the citation invariant run" is answerable from the job summary rather than from a log search.

---

## 3. The high-severity findings

### H-1 — Shield could neither receive mail nor process it

Two independent breaks in the same path, both in code whose own comments described the behaviour correctly.

1. **No route.** `lib/email/inbound.ts`'s header states *"the web process's inbound webhook route calls `receiveInboundNotice`."* No such route existed. Mail forwarded to `shield+{token}@{SHIELD_INGEST_DOMAIN}` had nowhere to arrive.
2. **No enqueue.** `receiveInboundNotice`'s docstring promises *"verify, match, persist, enqueue"* and the repository header repeats it. The function verified, matched and persisted. **Nothing in the entire production codebase ever enqueued `process_inbound_notice`** — the only reference outside comments was one line in `tests/queue.test.ts` enqueuing it by hand.

Together: a forwarded deactivation notice would land in a table, never be classified, and never alert the seller — D6's monitoring product observing nothing while reporting success. This is also the mechanism the whole no-credentials position depends on: I4 forbids credentials and N1 defers SP-API, so the forwarded address is the *only* way the system can see a marketplace notice at all.

**Fixed.** `receiveInboundNotice` now inserts the row and enqueues the job **in one transaction** — ADR-005's stated reason for using the database as the queue ("enqueueing is transactional with the business write"). A row without its job is mail we hold and will never read; a job without its row is a worker failing forever on a missing id; neither is now reachable. Added `src/app/api/inbound/email/route.ts`, thin by design: verify, match, persist, enqueue, 200, with an unknown ingest token answering **404 rather than 400** so the endpoint is not a token oracle.

**Coverage added:** `tests/email.test.ts` — "enqueues process_inbound_notice for the row it just persisted", which claims the job off the real queue and checks the payload id.

### H-2 — `instanceof` is not reliable across Next's compiled graphs

Found by smoke-testing the new routes rather than by reading them. A forged inbound signature returned **500** while the structurally identical Stripe route returned 400. The adapter threw the right error with the right message; `error instanceof InboundVerificationError` was `false`.

The cause is the one this codebase already documents elsewhere: Next compiles the RSC graph and the route-handler graph separately, so a module can be instantiated twice in one process and a class declared in it has **two distinct identities**. It is why `getDb()` and `getAdapters()` are pinned to `globalThis`. The same hazard applies to error classes, and nothing had generalised the lesson.

The impact is not cosmetic: a 500 tells the mail provider to **retry a payload we have already refused**, so a forged or corrupted delivery gets replayed on a backoff schedule instead of being dropped.

**Fixed:** both routes discriminate on `instanceof` **or** `error.name`, which every error class in this codebase sets explicitly in its constructor and which survives module duplication. Verified live afterwards: both routes return `400 {"status":"invalid_signature"}`.

### H-3 — the offline guarantee was routing, not a boundary

`README.md` states: *"Every test runs with no network access and no real API keys. This is a hard rule, not a convenience."* The mechanism was `ADAPTER_MODE=mock` selecting the fakes — a routing decision that says nothing about a direct `fetch` added to a module later, a vendor SDK imported outside `lib/adapters/`, or a test constructing a live adapter by hand. Any of those passes on a developer's machine with connectivity and a stray key in the shell, then fails in CI for a reason no error message explains. It is also the most likely way a real API key first gets spent by a test run.

**Fixed:** `vitest.setup.ts` replaces `globalThis.fetch` with a function that rejects, naming the attempted URL and stating the two legitimate fixes — record the response into the golden set, or move the test to the nightly live lane. The suite is unaffected (347/347), which is itself the evidence: nothing in it was reaching the network.

---

## 4. What is genuinely solid

These were attacked and held. Recording them matters as much as the failures, because they are where the next contributor should not spend effort.

**D9 / I1 / I3 — clean, with no exceptions.** No vector-database, embedding, chunking or fine-tuning dependency anywhere in `package.json` or the source. No SP-API client, no marketplace credential path, no adapter method that accepts one. `AnthropicAdapter` has **no `tools` field on either request type**, so an agent loop is not merely absent but unrepresentable. `runPipeline` is a fixed classify → retrieve → draft → critique composition with a bounded revision loop (`maxDraftIterations`); every branch is a code branch. Retrieval is a keyed lookup on the reason code, exactly as ADR-003 specifies.

**I2 — the citation invariant is real.** `resolveCitedClause` is the only construction path for a `CitedClause` and takes a citation object, not a string. The allowlist is positional and per-case, with the seller's notice deliberately outside it — which is ADR-102's genuinely subtle point, since citations are all-or-none per request and the untrusted notice is therefore *necessarily citable*. `assertRenderableDraft` refuses a draft with zero allowlisted clauses and refuses any paragraph that reads as a policy claim without backing, and returns a branded `RenderableDraft` unforgeable outside the module. Fifteen tests, including adversarial injection fixtures. **The one gap (M-3) is that `PlanDocument` accepts plain `DraftSections`, not the brand** — its header claims otherwise. The path from model to screen is nonetheless safe, because `case-store.ts` reconstructs clauses from the `citations` rows, which exist only because an allowlisted citation object existed. The claim in the comment is stronger than the type; the type should be tightened before a second renderer (the PDF) is written against it.

**I5 — escalation is statically enforced.** `ClassificationOutcome` is a discriminated union and `generateDraft` accepts only the `classified` variant, so the draft stage is *unreachable* on every escalation path. Not a runtime check, not a prompt instruction.

**The state machine.** Twelve tests, including an exhaustive `(from, to)` sweep asserting every non-declared pair throws, reachability of every declared edge from `intake`, no self-transitions, no partial write on a rejected transition, and a concurrent double-transition test. Both the web tier and the worker write status only through `transitionCase`. This is the best-tested component in the build.

**Queue correctness.** `SELECT … FOR UPDATE SKIP LOCKED` in a single atomic CTE + UPDATE + RETURNING, with a hand-written snake→camel remap (correct, and correctly explained — it is the one path bypassing Drizzle's mapping). Retry with backoff to `dead`, stale-lock reclamation, and `enqueueJob` accepting a transaction handle so enqueue is transactional with the business write.

**Twelve-Factor III.** Zero secrets in the repository (`git ls-files` shows only `.env.example`); Zod validation with fail-fast; production refuses `pglite` and refuses `mock` adapters. That last guard was **observed working** during this review: a production-mode server with mock adapters correctly refused to serve.

**Pricing.** $149 / $399 / $49-mo consistent across `pricing.ts`, the mock adapter's parallel table, both paywall surfaces, the landing page, the FAQ and the monitoring screen. A dedicated regression test asserts the exact set of money strings on each surface with a word-boundary regex, so `$1490` cannot satisfy `$149`, and asserts Shield Pro's `$149/mo` stays distinct from Rescue's `$149`. Held.

**Accessibility.** Better than most production codebases. `lang="en"`; a skip link on the landing page; every `<section>` carries `aria-labelledby`; the SSE timeline is a `role="status" aria-live="polite"` region with visually-hidden state words so the tense is not the only cue; the loss counter's inputs have real labels and a polite live region; the notice textarea has a real `<label>`, `aria-describedby` wiring help *and* error, `aria-invalid`, and moves focus to the field on error so the description is announced; external links carry a visually-hidden "(opens in a new tab)". The citation chip — *the* component, since the citation is the product — is structured as quotation plus attribution, exactly as `ARCHITECTURE.md` §3.1 requires.

---

## 5. Open findings, not fixed

**M-1 — `/ops` authenticates by query parameter.** `?key=<OPS_SHARED_SECRET>`, compared with `===`. The boundary behaviour is right — in production, no configured secret means the route 404s rather than existing unprotected — but query strings land in access logs, browser history, and `Referer` headers on any outbound link from the page. `===` is also not constant-time. Recommend a signed cookie set by a POST, or Basic auth at the edge, before a reviewer who is not the founder is given access. Not fixed here because it is an auth design decision with a `human_edits.reviewer_id` dependency (`ARCHITECTURE.md` §5.1) rather than a bug.

**M-3 — `PlanDocument`'s prop types do not carry the brand.** Discussed in §4. Tighten to `RenderableDraft` before the PDF renderer is written, since divergence between the two renderers is identified in the architecture as a citation-invariant leak vector.

**L-1 — stray artifacts.** `test-results/.last-run.json` and `tsconfig.tsbuildinfo` exist on disk though `.gitignore` covers both patterns. Neither is tracked. Cosmetic.

**L-2 — three unregistered job kinds.** `render_pdf`, `escalation_review` and `cache_rewarm` have no handler; the worker's "no handler registered" hard failure is the deliberate loud signal. Correct as designed, but a job enqueued for one of them today will retry to `dead` with no operator-facing surface. Worth a row on `/ops` when the PDF renderer lands.

---

## 6. README verification

Every documented command was run.

| Command | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm test` | 347 passed / 27 files, ~65s |
| `npm run corpus:check` | passes; 12 sources, 85 clauses, 33 reason codes, 33 appeal patterns, 0 violations; correctly reports `codes_not_draftable: ["AMZ.OPS.DROPSHIP"]` |
| `npm run build` | clean; all 13 routes emitted, including the two added here |
| `ADAPTER_MODE=mock DATABASE_DRIVER=pglite npm run dev` | works with no keys and no container; `/api/health` returns its attribution stamps; `/ops` reachable in dev without a secret, as documented |
| `npm run test:e2e` | **not run — no Chromium in this environment.** The README documents `PLAYWRIGHT_CHROMIUM_PATH` and `E2E_DEV=1` for exactly this case, so the instruction is honest; it is simply unverifiable here |

**README corrections applied:** the test count (342/26 → 347/27); the `api/` tree now lists all four routes rather than two; the CI section now links the committed workflow instead of describing an order that existed only in prose.

One behaviour worth knowing, confirmed rather than assumed: a **production build cannot be run in mock mode**, because Next inlines `NODE_ENV=production` at build time and `env.ts` refuses that combination. That is the guard working, not a defect — but it means the offline demo path is `npm run dev`, and only `npm run dev`.

---

## 7. Files changed

**Fixes**

| File | Change |
|---|---|
| `src/app/(app)/case/[caseId]/plan/page.tsx` | server-side paywall on `payment.status === 'paid'` (C-1) |
| `src/app/(app)/appeal/[caseId]/page.tsx` | redirect only on a *paid* payment, not any row (C-2) |
| `src/app/_lib/progress.ts` | `sections` removed from `PreviewPayload`, with the reason on the type (C-3) |
| `src/app/_lib/appeal-run.ts` | stop emitting `sections` on both the live and rejoin paths (C-3) |
| `src/app/api/stripe/webhook/route.ts` | **new** — ADR-007's endpoint (C-4, H-2) |
| `src/lib/billing/fulfillment.ts` | idempotency claim moved inside the fulfilment transaction (C-5) |
| `src/lib/db/repositories/stripe-events.ts` | `getStripeEvent` pre-check (C-5) |
| `.github/workflows/ci.yml` | **new** — the blocking lane (C-6) |
| `src/lib/email/inbound.ts` | persist + enqueue in one transaction (H-1) |
| `src/app/api/inbound/email/route.ts` | **new** — ADR-006's ingest endpoint (H-1, H-2) |
| `vitest.setup.ts` | network kill switch (H-3) |
| `vitest.config.ts` | hook/test timeout headroom for PGlite fixtures (M-2) |
| `app/README.md` | counts, route tree, CI link (§6) |

**Tests**

| File | Covers |
|---|---|
| `src/app/(app)/case/[caseId]/plan/paywall.test.tsx` | **new**, 3 tests — C-1, C-2 |
| `src/app/_lib/appeal-run.test.ts` | the drafted body must not appear on the wire — C-3 |
| `tests/billing.test.ts` | a failed fulfilment releases its claim and the retry succeeds — C-5 |
| `tests/email.test.ts` | the inbound row's job is actually enqueued — H-1 |

---

## 8. The recommendation

Ship. The six criticals were all of the same species — *a designed module trusted to be wired to something that was never built* — and each is now closed at the boundary with a test that fails if the boundary is removed again. Nothing in the engine, the corpus, the state machine or the pricing needed correcting, which is where the product's value actually sits.

Before the first live transaction, do three things this review could not do from here: point a real Stripe test-mode webhook at `/api/stripe/webhook` and watch a `checkout.session.completed` land; send one real forwarded email to `shield+{token}@…` and watch the job get claimed; and run the Playwright lane on a runner that has Chromium. Each verifies a boundary rather than a module, which is precisely the class of defect this pass found.
