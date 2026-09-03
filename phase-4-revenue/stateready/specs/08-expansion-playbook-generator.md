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
   published, the document says so rather than inventing "6–8 weeks".
5. **Every value with its citation, its `last_verified` date and its confidence**, inline, not in an
   appendix.
6. **A "needs human check" block** listing every value we could not verify twice or could not find at
   all, in the customer's words, at the front — not buried.
7. **The disclaimer** (§ `12-legal.md`).

## Flow

```
/expansion  →  choose target state + trades
  ├─ covered state?  yes → price + "generate"                (Stripe Checkout, one-off)
  │                  no  → "we do not cover Georgia yet" + waitlist, no charge, no promise
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

**Aligned with `OFFER.md` §7.1 on 2026-09-03**, which names it the **State Entry Pack** and prices it
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

## Guarantee

**"If a licensing board tells you something in this document is wrong, we refund it in full and fix
the record within five business days."** Bounded, honest, and it costs us nothing if the knowledge
base is good — which is the point. It is not, and must never become, an indemnity against fines
(see the NEVER list in `BACKLOG.md`).

## Acceptance criteria

1. Buying a Texas HVAC playbook produces a document whose every fee, hour count and insurance figure
   matches `kb-data/tx-hvac.json`, each with its source URL and `last_verified` date.
2. A Texas plumbing playbook shows the **renewal-cycle medium-confidence** value inside the
   needs-human-check block, with the exact wording of why.
3. A customer holding a Texas Master Electrician buying a North Carolina electrical playbook gets the
   reciprocity paragraph naming Texas, sourced from `nc-electrical.json`, and the caveat that the
   per-state detail page was not read.
4. A customer holding a Georgia HVAC licence buying a Texas HVAC playbook gets the inbound Georgia
   reciprocity paragraph — Class II Conditioned Air unrestricted, one year held.
5. Requesting an uncovered state offers a waitlist and charges nothing.
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
- **Manual review gate:** the first ten playbooks generated in production are read by the founder
  before delivery. Not a permanent human loop — a launch-only tripwire, removed after ten clean ones.
