# M7 — Dashboard: state map and status

**Status:** spec, wave 1. **Effort:** M (~2–3 dev-days). **Depends on:** M4, M5.

## Story

> As the owner walking past the office manager's desk, I want to see in five seconds whether we are
> clean. As the office manager, I want that screen to be the thing I open every Monday, and I want it
> to be the screen I turn round when the owner asks.

The dashboard's job is not analytics. It is **a defensible answer to "are we clean?"** and a list of
what to do this week.

## Screens

### `/dashboard`

Four bands, top to bottom, in decreasing urgency:

1. **Status line.** One sentence: "3 licences need attention in the next 30 days. Nothing has
   lapsed." Or, when something has: "**1 licence lapsed 2 days ago — Texas plumbing, Sila Mechanical
   LLC.**" Red, first, unmissable.
2. **The board.** The **tile grid** — 51 equal tiles, 50 states + DC, laid out in the approximate
   shape of the country (`IDENTITY.md` §7.1, `design-system.css` `.sr-map`, rendered in
   `identity/samples.html`). **Not a geographic choropleth**: equal visual weight per jurisdiction,
   because Rhode Island's licence lapses exactly as hard as Texas's. Each tile is filled by the worst
   status inside it. Clicking a tile filters everything below; selection is a 2px `--sr-ink` outline
   with 2px offset, **never a colour change**.

   **One status vocabulary, in these four words, in caps, everywhere in the product, the emails, the
   PDF and the marketing page:**

   | status | when | threshold | tile |
   |---|---|---|---|
   | **READY** | nothing due inside the first alert gate | `days > 90` | `--sr-ready-fill` / `--sr-ready-edge`, glyph **✓** |
   | **AT RISK** | something due inside the first alert gate | `0 < days ≤ 90` | `--sr-risk-fill` / `--sr-risk-edge`, glyph **◑**, 45° hatch |
   | **LAPSED** | past expiry | `days ≤ 0` | `--sr-lapsed-fill` / `--sr-lapsed-edge`, glyph **✕**, cross-hatch |
   | **NOT TRACKED** | the organisation operates here and we hold no derivable rule (uncovered state, or a licence with no derived deadline) | – | `--sr-unknown-fill` / `--sr-unknown-edge`, glyph **—**, dotted |

   Plus one rendering that is **not a fifth status**: a jurisdiction the organisation does **not
   operate in** is drawn **hollow with a 1px dashed `--sr-line-strong` edge** and an ink-3 label, with
   the accessible name *"Ohio — not in your footprint"*. It carries no status word because it has no
   status; it exists so that expansion is visible as an absence. `identity/samples.html` currently
   renders these with an accessible name of *"Not operating"*, duplicated — that is **m6**, an
   identity-side fix (`REVIEW_RESPONSE.md` B8).

   **AT RISK is 90 days, not 60.** The map and the first alert gate must never disagree. A screen that
   is still green on the morning we email *"expires in 90 days"* destroys the only thing this product
   is sold on. `specs/06`'s first offset is 90; this threshold is that offset, read from the same
   constant, not copied.

   **Status is never colour alone** (`IDENTITY.md` §7.2): fill + edge + glyph + hatch + the word in the
   accessible name, and the word again in the hover panel. Under `@media print` and `forced-colors`
   the hatches expand so a black-and-white bid packet still separates the four.
3. **This week / this month.** Two columns of deadline cards: holder, licence, what is due, in how
   many days, and a one-click "mark renewed" (which asks for the new expiry and the proof document).
   A card whose deadline carries `confidence = "medium"` shows the KB value's note under the date
   (`specs/05` invariant 2); one with `needsHumanCheck` shows the flag.
4. **Coverage honesty panel.** "You operate in 5 states. We derive deadlines for 3 of them. Ohio and
   Indiana are tracked but not derived — [what that means]." Permanent, not dismissable.

Band 4 is not a disclaimer someone made us add. It is the thing that keeps the product trustworthy
when the customer eventually finds a gap: they knew, because we told them on the front page.

### Other views

| screen | contents |
|---|---|
| `/dashboard?state=TX` | Same bands scoped to one state; the tile grid keeps the selection. |
| `/dashboard/calendar` | Month grid. Reveals the North Carolina 31 December wall and the Florida August cliff visually — those pictures sell the expansion report better than any copy. |
| Print/PDF export | The status band plus the full deadline table, with `last_verified` dates on every rule. This is what gets emailed to a GC or a private-equity diligence team, which makes it a distribution channel, not a feature. |

## Data model

No new tables. One materialised read model, refreshed on write and by the nightly cron:

```ts
export const dashboardSummaries = pgTable("dashboard_summaries", {
  organisationId: uuid("organisation_id").primaryKey().references(() => organisations.id, { onDelete: "cascade" }),
  computedAt:     timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  byState:        jsonb("by_state").notNull(),   // { TX: {ready, at_risk, lapsed, not_tracked, operating}, … }
  counts:         jsonb("counts").notNull(),     // { licences, technicians, deadlines90, deadlines30, deadlines7, lapsed }
  worstStatus:    text("worst_status", { enum: ["ready","at_risk","lapsed","not_tracked"] }).notNull(),
});
```

Materialised because the map query touches every licence and deadline and the dashboard is the most
requested page in the product. Recomputed synchronously on any licence or deadline write, so it is
never stale in a way the user can notice.

## Server actions / API

| action | notes |
|---|---|
| `getDashboard({ state? })` | Reads the summary plus the deadline cards for the selected scope. One query each. |
| `markRenewed({ deadlineId, newExpiry, documentId? })` | Updates the licence, re-derives (M5), supersedes the deadline, cancels pending alerts. The single most important button on the page. |
| `exportDashboardPdf()` | Server-rendered PDF; includes citations and `last_verified` dates. |

## Validation

- `newExpiry` must be after today and consistent with the state's rule; if it is not, we say so
  ("Texas ACR licences run 12 months — 2028-04-01 is 24 months out. Sure?") and let them proceed.
  The board is the authority, not us, but a silent 24-month renewal is usually a typo.
- **Status thresholds are one constant, shared with the alert schedule, not copied.**
  `AT_RISK_DAYS = ALERT_OFFSETS[0] = 90`; `LAPSED` is `days ≤ 0`; `NOT TRACKED` is the absence of a
  derivable rule. A unit test asserts `AT_RISK_DAYS === ALERT_OFFSETS[0]` and fails if either moves
  without the other — that assertion is the whole of **D7** made structural.
- The four status words are an exported enum (`READY | AT RISK | LAPSED | NOT TRACKED`); no component
  may render a status string it composed itself. A lint rule forbids the literals "amber", "red",
  "green" and "ok" as status names anywhere in the codebase.

## Acceptance criteria

1. An organisation with zero licences sees an empty state that is an instruction ("add your first
   licence" / "import your roster"), never a chart of nothing.
2. An organisation with one lapsed Texas plumbing licence shows the LAPSED status line naming the
   state and the holder, above the fold, on a 1366×768 screen; the TX tile renders LAPSED with its
   glyph, its hatch and the word in its accessible name.
3. Clicking the Texas tile filters the deadline cards and the URL is shareable.
3b. **A licence 89 days from expiry renders its state AT RISK, and the same fixture produces a 90-day
   alert in `specs/06`.** One fixture, two assertions, in the same test file — the map and the first
   alert gate cannot drift apart without this test failing.
3c. The grid renders **51 tiles** for every organisation, whatever their footprint; jurisdictions
   outside the footprint render hollow-dashed with no status word.
4. The coverage panel counts covered states from `getCoverage()` (M2), so selecting Ohio never
   increases the "we derive" number.
5. `markRenewed` on a deadline updates the licence, produces a new deadline, cancels the pending
   alerts, and the summary reflects it without a page reload.
6. The PDF export contains every deadline shown plus the citation URL and `last_verified` date for
   each derived rule.
7. Dashboard first paint under 800 ms server time for an organisation with 300 licences (measured in
   CI against a seeded fixture).

## Edge cases

- **A state the organisation does not operate in but holds a licence in.** Shown on the grid with a status (not hollow-dashed), because we hold a licence there,
  with a nudge to add it to the profile. Real: acquisitions bring licences the buyer did not know
  about, and finding one is a great first-week win.
- **Everything READY.** The status line must still say something useful: "Nothing due in the next 60
  days. Next: Florida CE, 14 hours, due 31 August." Silence reads as "the product does nothing".
- **A deadline with `needsHumanCheck`.** Rendered with a distinct marker and excluded from the
  confident "nothing has lapsed" claim; the status line says "1 rule we could not fully verify".
- **300 licences in 20 states.** The grid is fine at 51 tiles whatever the count; the cards must paginate and default to 30 days.
- **Two entities with the same licence type in the same state.** Cards show the entity name; the tile
  aggregates to the worst status inside it.
- **Colour-blind users.** Status is never colour alone: every tile and chip carries a glyph, a hatch
  and the word. Verified by a test that renders the grid with all colour tokens set to the same value
  and asserts the four statuses are still distinguishable from the DOM alone.

## Errors

| condition | user sees |
|---|---|
| Summary computation fails | Fall back to a live query with a "showing live figures" note, and flag internally. Never a blank grid. |
| KB unavailable | Coverage panel says "checking coverage…" and no state is claimed as covered. Fail closed. |
| PDF generation fails | "We could not build the PDF. Try again, or export CSV." with a working CSV fallback. |

## Analytics events

`dashboard_viewed` (with `worst_status`, `licence_count`), `state_filtered`, `deadline_card_opened`,
`marked_renewed` (**the strongest retention signal in the product** — a customer who marks a renewal
has used us to do the job), `dashboard_exported` (format), `coverage_panel_expanded`,
`calendar_viewed`.

## Test plan

- **Unit:** the status roll-up (worst-of) across states and the threshold constants.
- **Integration:** summary recomputation on licence create/update/archive and on deadline supersede.
- **Integration:** `markRenewed` end to end, asserting alert cancellation.
- **Performance:** 300 licences / 20 states / 900 deadlines fixture under the 800 ms budget.
- **Accessibility:** axe pass on the dashboard; the grid is a `<ul>` of `<button>`s in DOM reading
  order (AL, AK, AZ, …) with accessible names of the form *"Ohio — AT RISK, 2 licences"*; arrow-key
  roving tabindex; the expiring list below carries the same rows, so the grid is never the only route
  to its data; no colour-only status.
- **E2E:** the recorded journey ends here, on a dashboard showing a derived deadline.
