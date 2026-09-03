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
> pages and from state statutes and administrative rules. Every value we show you carries the web
> address it came from and the date we last checked it. We check every source for changes daily and
> re-verify every value in full every month.
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
- **Expansion playbook:** **full refund if a licensing board tells you something in the document is
  wrong.** Send us what they said; we refund within 3 business days and correct the record within 5.
  We publish the correction with a date.

That second clause is deliberate risk reversal in the Hormozi sense, and it is affordable precisely
because the knowledge base carries citations: a claim of error is checkable in minutes, and if we are
wrong we wanted to know.

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
- **Build test:** missing postal address env fails the build.
- **Integration:** acceptance rows written at signup with correct hashes.
- **Snapshot:** the coverage table generated from the committed `kb-data/` — 9 covered, the rest
  "in preparation".
