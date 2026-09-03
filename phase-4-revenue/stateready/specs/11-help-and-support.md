# M11 — Help centre and support auto-responder

**Status:** spec, wave 1. **Effort:** S (~1 dev-day). **Depends on:** M1.
**Policy:** PLAN.md A6 — first-level auto-responder plus a help page, escalation to the founder's
mailbox. No human in the product; one human at the edge.

## Story

> As the office manager at 6 p.m. on a Thursday, when the product shows me a Florida deadline I do
> not understand, I want an answer in the product. If I have to wait until tomorrow for a reply I
> will go back to the spreadsheet, because the spreadsheet never confused me.

## What we ship

1. **A help centre of ~15 articles**, written from the actual confusions this data creates, not from
   a feature list. The list below is derived from the nine records and is the *content* deliverable:

   - Why does my North Carolina electrical licence renew on its anniversary and my North Carolina
     plumbing licence on 31 December?
   - Florida: certified or registered — and why they renew in different years
   - Florida's 14 CE hours are six requirements, not one number
   - Texas: why your plumbing licence is not with TDLR
   - Texas: your electrical contractor licence needs no CE, but your Master Electrician does
   - North Carolina abolished plumbing/heating CE in 2012 — what that means for your records
   - What "we could not verify this" means, and what to do about it
   - What StateReady does not cover: counties, cities, and the other 35 states
   - How we keep the rules current (and how to tell when a rule changed)
   - Importing your roster from a spreadsheet
   - Reciprocity: why it usually runs one way
   - What happens when a licence lapses
   - Adding a company you have just acquired
   - Alerts: changing what you get and when
   - Trials, plans and what happens to your data

   Every article that states a rule links to the same board URL the knowledge base cites. Help
   content is not allowed to invent regulatory statements either.

2. **Contextual help.** Every derived deadline has a "why this date?" link (M5's `explainDeadline`)
   and every needs-human-check flag links to the article that explains it. Most support tickets in a
   data product are "I do not believe this number"; answering that in place is the cheapest support
   we will ever do.

3. **Contact + auto-responder.** In-app form and `support@`. The auto-responder replies within a
   minute with: acknowledgement, the ticket reference, the three most relevant help articles (matched
   on keywords plus the user's states), and the expected human response time. Escalates to the
   founder's mailbox with the organisation, plan, licence count and the last ten events attached, so
   the reply is one message rather than three.

## Screens

| route | contents |
|---|---|
| `/help` | Search + categories. Public, indexable — these articles are also SEO for exactly our buyer's questions. |
| `/help/:slug` | Article. "Was this helpful?" and a contact link. |
| `/support` | Form: subject, message, optional licence/deadline reference (prefilled from context). |
| In-app widget | A "?" in the header that searches help without leaving the page. |

## Data model

```ts
export const supportTickets = pgTable("support_tickets", {
  id:             uuid("id").primaryKey().defaultRandom(),
  reference:      text("reference").notNull().unique(),      // SR-2026-0413
  organisationId: uuid("organisation_id").references(() => organisations.id, { onDelete: "set null" }),
  userId:         uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  subject:        text("subject").notNull(),
  body:           text("body").notNull(),
  context:        jsonb("context"),        // route, licenceId, deadlineId, states
  status:         text("status", { enum: ["open","auto_answered","escalated","closed"] }).notNull(),
  suggestedArticles: text("suggested_articles").array(),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const helpArticleFeedback = pgTable("help_article_feedback", {
  id:        uuid("id").primaryKey().defaultRandom(),
  slug:      text("slug").notNull(),
  helpful:   boolean("helpful").notNull(),
  comment:   text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Articles are MDX files in the repo, not database rows: they are versioned, reviewed and deployed with
the code, which is what we want for anything that states a rule.

## Server actions

| action | notes |
|---|---|
| `submitTicket(input)` | Creates the ticket, matches articles, sends the auto-response, forwards to the founder's mailbox. |
| `searchHelp(q)` | Local index over the MDX front-matter and headings. No third-party search at launch. |
| `rateArticle({ slug, helpful, comment })` | Feeds the content backlog. |

## Validation

- Subject 3–140 chars; body 10–5,000.
- Rate limit 5 tickets per user per hour.
- Anonymous tickets (from a logged-out `/support`) are allowed and are tagged as such.

## Acceptance criteria

1. Submitting a ticket produces a reference and an auto-response email within 60 s containing three
   article links.
2. A ticket mentioning "Florida CE" surfaces the Florida CE article in the top three.
3. Every help article that states a regulatory fact contains a link to a board URL that also appears
   in `kb-data/`, asserted by a test that walks the MDX for claims and cross-checks the URL set.
4. `/help` is server-rendered and indexable; articles have unique titles and descriptions.
5. The "why this date?" link from a deadline opens the explanation without leaving the page.

## Edge cases

- **A ticket that is really a data-quality report** ("Texas raised the fee to $70"). The form has a
  "this rule looks wrong" option that routes into the knowledge-base review queue (M14) with the
  record id attached, not into general support. These are the most valuable tickets we will get and
  they must not be lost in an inbox.
- **A ticket from a logged-out visitor.** Accepted, no organisation context.
- **A hostile or abusive message.** Stored, escalated, no auto-response beyond acknowledgement.
- **The founder's mailbox is down.** The ticket is still stored and visible in admin; the escalation
  retries. Support that depends on an email hop must not lose the message.

## Errors

| condition | user sees |
|---|---|
| Auto-response fails to send | Ticket still created; screen shows the reference and "we have it" |
| Escalation forward fails | Ticket flagged in admin as `escalation_failed` |
| Help search returns nothing | "No article matches. Ask us — we answer within one business day." with the form inline |

## Analytics events

`help_searched` (query — **read these weekly; they are the roadmap**), `help_article_viewed`,
`help_article_rated`, `ticket_submitted` (category), `ticket_auto_answered`, `ticket_escalated`,
`data_quality_report_submitted`, `why_this_date_opened`.

## Test plan

- **Unit:** article matcher against 20 realistic ticket subjects.
- **Content test:** every regulatory claim in MDX links to a URL present in `kb-data/`; fails the
  build otherwise.
- **Integration:** ticket → auto-response → escalation, with the mail adapter mocked.
- **Accessibility:** help pages pass axe; the widget is keyboard-navigable.
