# M8 — Expansion playbook generator (the $750–1,500 one-off)

**Status:** spec, wave 1. **Effort:** L (~4–6 dev-days). **Depends on:** M5, M14. **Blocks:** nothing.
**Also the product's proof.** It is the only screen where the knowledge base is visible as a
knowledge base.

## Story

> As the compliance lead at a platform that has just signed an LOI on an HVAC company in Georgia, I
> want a document I can hand to my COO on Monday that says exactly what it takes to be legal in
> Georgia: which licence, who has to hold it, what exam, how long, what it costs, what insurance,
> what bond, and whether our Texas master can shortcut any of it. Today I pay a licensing agency
> $500 a licence and wait a week for a phone call.

That is the whole pitch. The shortlist priced it at **$750–1,500 one-off**; `OFFER.md` has since firmed that into a $750-first-state / $1,500-thereafter ladder, anchored against what
Harbor Compliance, API Processing and the other concierge firms charge for the same work by hand.

## What it produces

### What we promise it contains — narrowed, deliberately (wave-1b **B2**)

> **Every requirement the state's board publishes, each with the page it came from and the day we
> checked it — and, named on the first page, every requirement it does not publish.**

That sentence is the promise, and it is the **only** promise. It replaces the wave-1 contents list's
implicit claim that the pack carries bond amounts, fee tables and elapsed timelines for every state,
which the data does not support and will not support soon: across the nine committed records
`bond.amount` is `unknown` **23 times out of 23**, `bond.required` 21 of 23, `typical_timeline` 7 of 9,
`renewal.fee` 6 of 23 and `application_fee` 7 of 23 — every one of them honestly recorded as a gap
with a note listing the pages read (`KNOWLEDGE_BASE.md` §3.2, gate G2).

**The choice made, and why.** The review offered two ways out: narrow the promise, or block the
purchase until the named fields are verified. **Narrowing is the one applied**, because a blocking
completeness gate on bond and timeline would make **zero of the nine records purchasable on day one**
and would only be liftable by research a human has to do — reintroducing exactly the human loop
`PLAN.md`'s Goal forbids, and destroying the one revenue line that works from day one. Narrowing costs
us a sentence of marketing; blocking costs us the product. **What must not happen is the third option
— keeping the wide promise and delivering the narrow document — which is the Entry Pack Guarantee
firing on our own data.**

A gate still exists; it is a gate on **structure**, not on completeness, and it is specified below.

A document — web page, PDF, and a shareable read-only link — for **one target state × one to three
trades**, containing:

1. **The answer, first.** "To do HVAC contracting in Georgia you need X, held by a person who meets
   Y, and your existing Texas licence does/does not help." Nobody reads a 20-page report to find the
   answer; put it in the first 100 words.
2. **Per licence type:** who must hold it, scope, exam, experience, application fee, renewal cycle
   and fee, CE hours and the approved-provider rule, bond, insurance, business-entity requirement.
3. **Reciprocity, in both directions**, computed against the licences the customer already holds.
   "You hold a Texas Master Electrician. North Carolina has a formal agreement with Texas and issues
   without written examination. Georgia does not appear in North Carolina's list — expect a full
   application." That sentence is the product.
4. **A timeline**, assembled only from durations the boards actually publish. Where none is
   published — which today is **seven states × trades out of nine** — the document says so, names the
   pages we read looking for it, and tells the buyer which office to ring. It never invents "6–8 weeks".
5. **Every value with its citation, its `last_verified` date and its confidence**, inline, not in an
   appendix. A value at `confidence: medium` prints **its note, not just its number** — the reading and
   the inference, in the customer's words (wave-1b **m16**: `tx.hvac`'s $74 exam fee is drawn from the
   Class B → Class A upgrade paragraph, and the number without that sentence is a claim we cannot
   defend).
6. **The gaps block, on page one, before anything we do know.** Every field in the disclosed set below
   that we could not establish, each with what we read and what to ask the board. It is the first thing
   the buyer sees, not an appendix, because a buyer who finds a gap on page nine has been sold
   something; a buyer who reads it on page one has been told something.
7. **The disclaimer** (§ `12-legal.md`).

## Flow

```
/expansion  →  choose target state + trades
  ├─ entryPackReady?  yes → gap disclosure + price + "generate"   (Stripe Checkout, one-off)
  │                   no  → "we do not cover Georgia yet" + waitlist, no charge, no promise
  │                          (a record that is publishable but fails CORE_SET is "in preparation",
  │                           never "covered" — same treatment as an uncovered state)
  ├─ payment succeeded (webhook) → job queued
  ├─ generation (server, deterministic, no free-text model output for regulatory strings)
  ├─ email: "Your Georgia HVAC playbook is ready"
  └─ /expansion/:id  (web) · /expansion/:id.pdf · /share/:token (read-only, expiring)
```

**Payment before generation**, because generation is cheap and the buyer is qualified by the payment.
There is no free preview of the full document; there is a free, honest *sample* built from the Texas
HVAC record, published on the landing page.

## How it is generated — and how it cannot lie

Regulatory strings are **assembled from the knowledge base by template**, never written by a language
model. The model's only jobs are the summary paragraph and the ordering of steps, and both are
constrained to reference `{{value}}` placeholders that are substituted server-side after generation.
A generated document containing a number that is not traceable to a `SourcedValue` **fails the build
of that document** and the job errors rather than delivering it. This is the same invariant as
Clausewright's G12 (`CORPUS_DESIGN.md` §7): the promise is enforced by a code path, not by a prompt.

Concretely:

```
render(playbook) →
  for each rendered numeric or currency token:
      assert token.provenance.sourced_value_id exists
      assert that SourcedValue.status == "verified"  OR  token is inside a needs_human_check block
  else: throw PlaybookIntegrityError   // never delivered, refunded automatically
```

## The purchasability gate — `entryPackReady`, which is **not** `publishable`

`provenance.publishable` measures **pass-B agreement**: two verification passes found the quoted
fragment at the cited URL. It says nothing about whether the record is complete enough to sell, and
the two were being conflated (wave-1b **B2**). A second, independent predicate is therefore computed
at snapshot load (M14) and stored on `kb_records`:

```
entryPackReady(state, trade) =
      publishable                                                   // pass-B agreement, unchanged
  AND every field in CORE_SET has status = "verified"               // blocking
  AND coverage_notes is present                                     // gate G12
  AND the pre-purchase disclosure enumerates every DISCLOSED_SET field that is not verified
```

| set | fields | behaviour |
|---|---|---|
| **CORE_SET** — blocking, the pack is not purchasable without them | `licence_types[]` (at least one), `who_must_hold`, `renewal.cycle`, `renewal.expiry_rule`, CE (`hours` **or** a verified `required: false`), `reciprocity` **or** a verified `reciprocity_statement` | Without these the document has no spine: no answer to *which licence*, *who holds it*, *when it renews*, *what CE it carries*, *does my existing licence help*. All nine committed records pass. |
| **DISCLOSED_SET** — never blocking, always named before payment | `application_fee`, `renewal.fee`, `exam.fee`, `bond.required`, `bond.amount`, `insurance.*`, `typical_timeline` | Boards genuinely do not publish several of these (Florida's CILB application fee is on an image-only PDF; TDLR publishes no bond requirement at all). Blocking on them would block every state; hiding them would be the lie. So they are **counted and listed on the purchase screen, before the card is entered**. |

**The purchase screen therefore shows the gap count before payment**, not after: *"Georgia · HVAC —
we have 31 verified requirements. Four things this board does not publish and we could not establish:
application fee, bond amount, insurance minimum, typical processing time. Here is what we read looking
for each."* A buyer who proceeds has priced that in. A buyer who does not proceed was never going to
be a happy customer, and losing that sale is the cheapest refund we will ever take.

`needsCheckCount` (already on the `playbooks` table) is that number, and it is **written before the
Checkout session is created**, not after generation — otherwise the disclosure is retrospective and
worthless.

## Screens

| screen | contents |
|---|---|
| `/expansion` | State + trade picker, price, what you get, the free Texas sample. |
| `/expansion/:id` | The document. Sticky contents; every value shows its source on hover; a persistent "verified on 3 Sep 2026" line. |
| `/expansion/:id` (needs-check block) | Amber panel at the top: "4 things we could not fully verify for you", each with what we read and what to ask the board. |
| `/share/:token` | Read-only, no auth, expires in 90 days, watermarked with the buying organisation's name. Their COO and their lawyer will open this. |

## Data model

```ts
export const playbooks = pgTable("playbooks", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  targetState:    char("target_state", { length: 2 }).notNull(),
  trades:         text("trades").array().notNull(),
  status:         text("status", { enum: ["awaiting_payment","queued","generating","ready","failed","refunded"] }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  priceCents:     integer("price_cents").notNull(),
  creditedAgainstSubscription: boolean("credited_against_subscription").notNull().default(false),
  kbSnapshotId:   uuid("kb_snapshot_id").notNull().references(() => kbSnapshots.id),
  contentJson:    jsonb("content_json"),        // the assembled document, value-by-value with provenance
  pdfStorageKey:  text("pdf_storage_key"),
  shareToken:     text("share_token").unique(),
  shareExpiresAt: timestamp("share_expires_at", { withTimezone: true }),
  needsCheckCount: integer("needs_check_count").notNull().default(0),
  generatedAt:    timestamp("generated_at", { withTimezone: true }),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

`kbSnapshotId` is not optional. A playbook is a statement about the world on a date, and it must stay
reproducible after the knowledge base moves on.

## Pricing

**Aligned with `OFFER.md` §6.3 (Entry Pack pricing) and §7 (the ladder) on 2026-09-03**, which name it the **State Entry Pack** and price it
against what is actually transacted (expediters at $399+ per application, quote-gated above that)
rather than against a guess.

| product | price | why |
|---|---|---|
| **First state × trade** | **$750**, credited in full against an annual plan taken within 90 days | The entry point. The buyer's arithmetic becomes "pay $750 for a document worth more than that on its own, and the annual plan then costs $750 less". |
| Additional state × trade | **$1,500** | Above one expediter application, below a multi-state engagement. It is the price of a decision, not of paperwork. |
| Acquisition bundle, up to 3 states | **$3,750** (+$1,000 per further state) | The roll-up purchase: one acquisition, all its states, before the close. |
| Included on annual plans | 1 pack (Multi-State) · 2 packs (Platform) | The single largest lever on annual conversion — it turns an annual commitment into a purchase the buyer already budgets for. |

The credit is implemented as a Stripe coupon applied at Checkout (spec 09), not as a manual refund, so
the 90-day window is enforced by code.

Prices are hypotheses (H6 in `THRESHOLDS.md`) and are not live until the founder validates them
(PLAN.md A5). The attach-rate band that decides whether they hold is T4.

## Guarantee — one wording, adjudicated against a published page

**This exact text, and no paraphrase of it, in `OFFER.md` §5.1 (Entry Pack Guarantee row), `specs/12` `/legal/refunds`, the
purchase screen, the pack's own first page and `LANDING_SPEC.md` §8:**

> **The Entry Pack Guarantee.** If a page published by the state's own licensing board contradicts a
> value your State Entry Pack shows as verified, tell us within **90 days** of your purchase and we
> rewrite the pack and refund what you paid for it. We adjudicate against the board's published page,
> not against a conversation. Our liability is limited to the fee you paid for that pack.

Three things it fixes, all of them wave-1b findings (**B5**, **m13**):

1. **"A board *tells you*"** — the wave-1 wording in this spec and in `specs/12` — is an **oral,
   unverifiable** standard over the whole document, adjudicated by a phone call we were not on. "A page
   published by the board **contradicts a value we showed as verified**" is checkable in minutes by
   opening a URL, which is the only kind of promise a two-person company should make.
2. **It is bounded in time** (90 days from purchase) and **in money** (the fee for that pack). The
   wave-1 wording was bounded by neither.
3. **It attaches to values we asserted**, not to gaps we disclosed. A pack that says *"Georgia does not
   publish its bond amount"* has not been contradicted when the buyer discovers Georgia has a bond —
   it has been confirmed. That distinction is exactly why the promise was narrowed above, and it is
   what makes this guarantee affordable.

**Correction SLA: five business days**, everywhere. `OFFER.md` §5.1.1's "one business day" is a
single-founder SLA with no cover behind it and is reconciled to five (**m13**).

It is not, and must never become, an indemnity against fines (see the NEVER list in `BACKLOG.md`).

## Acceptance criteria

1. Buying a Texas HVAC playbook produces a document whose every fee, hour count and insurance figure
   matches `kb-data/tx-hvac.json`, each with its source URL and `last_verified` date.
2. A Texas plumbing playbook shows the **renewal-cycle medium-confidence** value inside the
   needs-human-check block, with the exact wording of why — even though `specs/05` lets that same
   value produce an unflagged deadline in the product. The rule is the ontology's:
   *"anything below high forces needs_human_check on any expansion playbook that uses it."* The
   product may act on a medium reading; a $750 document may not assert one.
3. A customer holding a Texas Master Electrician buying a North Carolina electrical playbook gets the
   reciprocity paragraph naming Texas, sourced from `nc-electrical.json`, and the caveat that the
   per-state detail page was not read.
4. A customer holding a Georgia HVAC licence buying a Texas HVAC playbook gets the inbound Georgia
   reciprocity paragraph — Class II Conditioned Air unrestricted, one year held.
5. Requesting an uncovered state — **or a state that is publishable but fails `CORE_SET`** — offers a
   waitlist and charges nothing.
5b. **The gap disclosure is rendered before the Checkout session is created**, names every unverified
   `DISCLOSED_SET` field for that state × trade, and the count it shows equals `needsCheckCount` on the
   delivered pack. Asserted against `kb-data/tx-hvac.json`, whose bond and timeline fields are unknown:
   the Texas HVAC purchase screen must say so **before** the card, and the test fails if it does not.
6. The PDF and the web version contain identical values (byte-comparable value extraction).
7. A tampered content record with an unsourced number fails generation and auto-refunds.
8. The share link works logged-out, expires, and is watermarked.

## Edge cases

- **Trades the state splits differently.** Texas plumbing is TSBPE, not TDLR; North Carolina HVAC is
  the plumbing board; a North Carolina HVAC company also needs an SP-PH from the *electrical* board.
  The document must lead with the board map, because a customer who writes to the wrong agency loses
  three weeks.
- **The customer already holds a licence in the target state.** Detect it and change the document's
  frame from "how to enter" to "what you are missing".
- **A KB record is unpublishable at purchase time.** Purchase is blocked with a specific message, not
  a generic error, and the state is removed from the picker.
- **Reciprocity we hold in one direction only.** Say which direction we verified and which we did
  not. Florida is the live example: North Carolina publishes an agreement with Florida, and we have
  not read Florida's side.
- **Two trades in one document with contradictory board advice.** Rendered as two clearly separated
  sections; never merged into a single "in Georgia you must…".
- **Refund requested.** One click in admin; the record is kept and marked, and the reason feeds the
  KB review queue.

## Errors

| condition | behaviour |
|---|---|
| Generation fails | Status `failed`, automatic refund, apology email, admin flag with the record and rule that broke |
| Integrity assertion trips | Same, plus a **blocking** admin alert: this means the KB and the renderer disagree |
| PDF renderer down | Web version delivered, PDF retried in the background, customer told |

## Analytics events

`playbook_state_selected`, `playbook_checkout_started`, `playbook_purchased` (state, trades, price),
`playbook_generated` (duration, `needs_check_count`), `playbook_viewed`, `playbook_pdf_downloaded`,
`playbook_shared`, `playbook_share_opened` (**a buying signal from a second person inside the
account**), `playbook_refunded` (reason), `uncovered_state_waitlisted`.
`playbook_purchased ÷ paying customers` is the attach rate in `THRESHOLDS.md`.

## Test plan

- **Golden document test:** generate the Texas HVAC playbook from the committed `kb-data/` and diff
  against a committed expected document. Any KB change that alters a customer-facing number breaks
  this test loudly.
- **Integrity test:** inject an unsourced number into the content record; assert generation throws
  and nothing is delivered.
- **Unit:** the reciprocity matcher, in both directions, against the 17 Texas and 10 North Carolina
  agreements in the data.
- **Integration:** Stripe test-mode purchase → webhook → job → ready → email, end to end.
- **Snapshot:** PDF and HTML value extraction produce identical sets.
- **Launch tripwire, *behind* delivery, not in front of it (wave-1b M15):** the first ten playbooks
  generated in production are delivered **immediately**, and read by the founder **within 24 hours**.
  A buyer who pays $750 at 22:00 on a Friday gets the document at 22:01, which is the promise
  (`UX.md` S16c: under two minutes) and the whole difference between us and a firm that will not
  publish a price. Reading them in front of delivery would put a human in the delivery path of a paid,
  same-day product, against `PLAN.md`'s Goal and `UX.md` C2.
  If the founder's read finds an error, **we trigger the guarantee proactively** — rewrite, refund,
  and email the buyer before they have opened it. The purchase screen says so in one line:
  *"You are among our first buyers. We read every pack after we send it, and if we find a mistake we
  refund you before you find it."* Removed after ten clean ones.
