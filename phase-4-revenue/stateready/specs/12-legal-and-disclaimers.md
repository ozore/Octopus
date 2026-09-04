# M12 — Legal pages and the disclaimer

**Status:** spec, wave 1. **Effort:** S (~1 dev-day). **Depends on:** M1.
**Entity:** TheVillage (PLAN.md D1). Branding: "StateReady, a TheVillage company".
**Founder prerequisite:** P10 — postal address and support email.

## Story

> As the buyer, I need to know exactly what you are promising and what you are not, before I act on a
> date you gave me. As the founder, I need the disclaimer to be honest enough to be defensible and
> specific enough to still leave the product worth paying for.

A vague disclaimer ("for informational purposes only") destroys the product's value proposition
without protecting anyone. Ours names what we do, what we do not, and what the customer must still do.

## The disclaimer — full text

> **StateReady is a tracking and research tool. It is not legal advice and it is not a licensing
> service.**
>
> The licensing information in StateReady is compiled from state licensing boards' own published
> pages and from state statutes and administrative rules. **Every value we show you carries the web
> address it came from and the date we last checked it, and every value we could not establish from a
> public source is shown as unestablished rather than estimated.** Where a value has not been
> re-checked in 180 days we stop showing it as verified and show you the board's page instead. Our
> coverage, and the age of every value in it, is published live at /coverage.
>
> **What we do not do.** We do not file applications, renewals or continuing-education records on your
> behalf. We do not cover county or city licensing, permits or registrations, which exist in most
> states in addition to the state licence. We cover HVAC, plumbing and electrical only, in the states
> listed on our coverage page. Where we could not establish a fact from a public source, we say so and
> leave it blank — we never estimate a fee, a fee-free period, an hour count or a processing time.
>
> **What you must still do.** Confirm anything that carries a "needs checking" flag with the board
> before you rely on it. Rules change between our checks. The licensing board, not StateReady, is the
> authority on your licence.
>
> Last reviewed: {{date}}. Coverage: {{n}} states × {{m}} trades. Questions about a specific value:
> every value links to its source.

**What is deliberately *not* in the disclaimer (wave-1b M12).** The wave-1 text stated an operational
cadence as fact — *"We check every source for changes daily and re-verify every value in full every
month."* A cadence claim on a legal page is a promise about our own uptime, made to a consumer, on the
page a state UDAP action would be built from — and `specs/14` itself contemplates the cron failing.
The cadence is a **target**, and targets live on the methodology page (`/help/methodology`, `UX.md`
S17), stated as targets, beside the live figures that show whether we are meeting them:
*"Target: every source checked daily, every value re-verified monthly. Actual, right now: N sources
checked in the last 24 hours, oldest `last_verified` M days."* The legal page carries only what is
**structurally** true — the provenance line exists on every value, and the 180-day rule is enforced in
code (`specs/14`) — because those are guaranteed by a code path, not by a cron.

**Where it appears:** the footer of every page; in full on `/legal/disclaimer`; as a short form at the
top of every expansion playbook and in every alert email; and beside any value flagged
`needs_human_check`.

## Pages

| route | contents |
|---|---|
| `/legal/terms` | Terms of service. Includes the limitation of liability, the subscription and one-off purchase terms, and the acceptable-use clause. |
| `/legal/privacy` | What we collect (organisation and business-contact data; technician name, licence number and licence dates), why, where it is stored (US), how long, and the export and deletion rights implemented in M10. |
| `/legal/disclaimer` | The text above, in full, plus the coverage table generated from `kb-data/`. |
| `/legal/refunds` | The subscription and playbook refund policy (below). |
| `/legal/subprocessors` | Vercel, Neon, Stripe, Resend, Anthropic. Named, with what each sees. |
| `/coverage` | Live table: state × trade × publishable? × `last_verified`. Public. **This page is a sales asset:** no competitor publishes it, and publishing it is the most credible thing we can do. |

## The refund policy (both products)

- **Subscription:** cancel any time in the Stripe Portal; access to period end; no pro-rata refund on
  a month; a full refund of the current month if you cancel within 7 days of the first charge and
  have not generated a playbook.
- **State Entry Pack — the Entry Pack Guarantee, in the one wording used everywhere** (`OFFER.md`
  §5.1 item 2, `specs/08`, the purchase screen, the pack's first page, and — **verbatim, not
  compressed** — the marketing route, `LANDING_SPEC.md` §8):

  > If a page published by the state's own licensing board contradicts a value your State Entry Pack
  > shows as verified, tell us within **90 days** of your purchase and we rewrite the pack and refund
  > what you paid for it. We adjudicate against the board's published page, not against a conversation.
  > Our liability is limited to the fee you paid for that pack.

  **Refund within 3 business days of the claim being upheld; the record corrected and republished
  within 5 business days**, with the correction dated. Five, not one — the wave-1 wording of
  `OFFER.md` §5.1 item 1 promised one business day, which was a single-founder SLA with no cover
  behind it (wave-1b **m13**).

- **The Accuracy Guarantee** (subscriptions), same wording as `OFFER.md` §5.1 item 1 — verbatim here,
  on the purchase screen and in the app; **compressed on the marketing route only**, under the four
  conditions in AC8c:

  > Every date, hour and fee in your account shows the state board page it came from and the day we
  > last checked it. Find one that disagrees with that source on the day you check it, tell us, and we
  > correct it within **five business days** and credit you one month. One credit per customer per
  > month.

- **The Alert Guarantee is not in force and appears on no surface.** It is drafted in `OFFER.md` §5.3
  with its carve-outs and its cap, and it does not go on a page — here, on the landing page, or in the
  app — until counsel has read it (`REVIEW.md` Q15). Publishing a guarantee we have not had reviewed
  is the UDAP hook the whole of §5.2 exists to avoid.
- **We never guarantee a regulatory outcome**, never pay a reinstatement fee, and never indemnify a
  fine. That is on the NEVER list in `BACKLOG.md` and it is not a wording question.

The Entry Pack clause is deliberate risk reversal in the Hormozi sense, and it is affordable precisely
because the knowledge base carries citations and because the pack now promises **only what the board
publishes**, naming its gaps on page one (`specs/08`): a claim of error is checkable in minutes
against a URL, and a disclosed gap is not an error.

## Data model

```ts
export const legalAcceptances = pgTable("legal_acceptances", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  userId:         uuid("user_id").notNull().references(() => users.id),
  documentSlug:   text("document_slug").notNull(),
  documentVersion: text("document_version").notNull(),     // content hash of the MDX
  acceptedAt:     timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress:      text("ip_address"),
});
```

Legal documents are MDX in the repo; `documentVersion` is the content hash, so "which version did
they accept" is answerable years later without a separate CMS.

## Acceptance criteria

1. Every page renders the short disclaimer in the footer with a link to the full text.
2. `/coverage` is generated from `kb-data/` at build time; adding a record changes the page without a
   code edit, and a non-publishable record shows as "in preparation", never as covered.
3. Signup records a `legalAcceptance` for terms and privacy with the content hash of each.
4. A material change to terms shows an in-app notice and records a fresh acceptance.
5. Every alert email and every playbook contains the short disclaimer and the CAN-SPAM footer with
   the TheVillage postal address (P10).
6. The privacy page's data list matches the actual schema, asserted by a test that compares the
   documented field list against the Drizzle schema and fails on drift.
7. **The disclaimer contains no cadence claim.** A content test greps `/legal/disclaimer` for
   "daily", "every month", "monthly" and fails on a match; the same words are required on
   `/help/methodology`, where they are labelled as targets and sit beside the live figures.
8. **Every guarantee block on the site is asserted, not trusted — verbatim where it is verbatim, and
   by rule where it is compressed** (wave-1b **R1**, **N5**). One content test extracts every block
   rendered as a guarantee from the marketing route, the app and the legal pages, normalises
   whitespace, and asserts all four of:

   a. **Only the two in force are present.** Set equality against the two wordings above: a third
      guarantee block fails, and the Alert Guarantee's text (`OFFER.md` §5.3) appearing anywhere in
      the rendered site fails.
   b. **Verbatim, byte-identical to this spec:** both wordings on `/legal/refunds`, on the purchase
      screen, in the app and on the pack's first page — **and the Entry Pack Guarantee on the
      marketing route** (`LANDING_SPEC.md` §8), which carries it whole because it is the promise a
      stranger acts on before paying and the one that bounds our liability in time and money.
   c. **Compressed blocks** — at launch there is exactly one, the Accuracy Guarantee's line in
      `LANDING_SPEC.md` §8 — must satisfy four conditions, all mechanical:
      * **(i) the liability-bearing terms are present as substrings.** For the Accuracy Guarantee:
        the window `five business days` and the cap `one credit`. For any future compression of the
        **Entry Pack** Guarantee: `90 days` and `the fee you paid`. There is none at launch, because
        §8 carries that one verbatim.
      * **(ii) the block links to `/legal/refunds`.** The link is inside the same strip as the line
        it qualifies, not in the footer.
      * **(iii) the compression adds no quantity and no escalation.** Every **number, unit and time
        period** in the compression must appear in the canonical text, compared on the stem so that
        `month's` matches `month` (the launch line's quantities are `five`, `business days`, `one`,
        `month` — all four are in §5.1 item 1), and none of the escalation words — `all`, `any`, `always`, `never`, `full`,
        `unlimited`, `immediately`, `guaranteed`, `free` — may appear unless the canonical text uses
        it too. **A verb may be shortened** (canonical *"we correct it within five business days"* →
        page *"Fixed in five business days"*); a quantity may not be added, moved or dropped. This is
        the rule stated precisely, because the loose version — "no word the full text does not use" —
        fails against its own approved copy, and a test that fails against the copy it governs is how
        **R1** happened.
      * **(iv) the word "guarantee" never appears in a strip that has no link.** A guarantee named
        without its terms one click away is the UDAP hook.
   d. **The count is two.** The test asserts exactly two distinct canonical wordings site-wide; the
      wave-1 third (the Rollout Guarantee, `OFFER.md` §5.2) is withdrawn and fails on sight.

## Edge cases

- **Address not yet available (P10 outstanding).** The build fails rather than shipping a placeholder
  address in a CAN-SPAM footer. A missing legal address is a launch blocker, not a TODO.
- **A customer asks for a copy of what they accepted.** Available in `/settings/data` export.
- **Coverage shrinks** (a record becomes unpublishable after drift). `/coverage` updates on the next
  deploy and the nightly job flags any customer relying on it.
- **State-specific consumer-protection wording.** Out of scope for launch and recorded as a founder
  question (see `KNOWLEDGE_BASE.md` §11).

## Analytics events

`legal_page_viewed` (slug), `disclaimer_expanded`, `coverage_page_viewed` (**a real buying signal —
prospects check coverage before they sign up**), `terms_accepted` (version), `refund_policy_viewed`.

## Test plan

- **Content test:** the schema/privacy parity check above.
- **Content test (AC8):** every guarantee block on every rendered route, checked against the two
  canonical wordings — byte equality where AC8b requires it (including the marketing route's Entry Pack
  block), and window + cap + link + no-new-terms where AC8c allows a compression. It is one test over
  all routes, not a per-page assertion, because the failure mode it exists to catch is two surfaces
  drifting apart (wave-1b **R1**).
- **Build test:** missing postal address env fails the build.
- **Integration:** acceptance rows written at signup with correct hashes.
- **Snapshot:** the coverage table generated from the committed `kb-data/` — 9 covered, the rest
  "in preparation".
