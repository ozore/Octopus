# StateReady — UX

**Product:** StateReady — licence, CE, bond and insurance readiness for multi-state trade contractors
**Author:** Buyer & Identity agent, wave 1. **Date:** 2026-09-03.
**Depends on:** `PERSONA.md` (binding — who, and the mobile decision in §11), `IDENTITY.md` (binding — components §9, tone §4), `design-system.css`, `../PLAN.md` (A7 magic link, A12 cron jobs, A13 Neon/PGlite, D2 Stripe).
**Status:** input to `BACKLOG.md` and `specs/`. The Product Owner may cut scope from this; they may not add a screen that is not here without saying which job (`PERSONA.md §8`) it serves.

---

## 0. Build constraints that bind every screen

| # | Constraint | Source |
|---:|---|---|
| C1 | **Onboarding to first value in under 10 minutes**, measured from magic-link click to a populated readiness map. This is the single number that decides whether a trial converts. | `PERSONA.md §10` O7 |
| C2 | **No human loop in the product.** No sales call, no onboarding call, no "our representative will reach out". The nearest adjacent product does exactly that and we are not copying it. | `PLAN.md` §Goal; `PERSONA.md §9` |
| C3 | **Auth is an email magic link.** No password, no OAuth. | `PLAN.md` A7 |
| C4 | **Every rendered rule carries a `.sr-source` provenance line.** No provenance, no value: render "Not verified" and link the board instead. | `PLAN.md` A10; `IDENTITY.md §9.10` |
| C5 | **Every artefact must be forwardable** — readable and useful to a GM who has never logged in. | `PERSONA.md §9` |
| C6 | **US English in the product** (`license`, `color` in code). This repository's prose uses British spelling; the two are never mixed inside one artefact. | `PERSONA.md §7` |
| C7 | **The disclaimer component appears in the footer of every app screen and every generated document.** | `PLAN.md` §6 |
| C8 | **Desktop-first for the dashboard; mobile-first for email and the technician card.** No technician app in v1. | `PERSONA.md §11` |
| C9 | **One `.sr-btn--primary` per screen**, or none. | `IDENTITY.md §9.13` |
| C10 | **Coverage boundary is stated on screen**, not buried: HVAC / plumbing / electrical × 15 states at launch. | `PLAN.md` A11; `PERSONA.md §12` |

---

## 1. The end-to-end workflow

```
  PUBLIC                    ACTIVATION                        THE LOOP                     EXPANSION
┌──────────┐   ┌───────────────────────────────┐   ┌───────────────────────┐   ┌──────────────────────┐
│ Landing  │   │ Magic link → Company → Trades │   │ Dashboard             │   │ Pick a state you are │
│          │──▶│ → States → Import roster      │──▶│  ├ Alerts 90/60/30/7  │──▶│ not in → preview →   │
│ Rulebook │   │ → The board lights up         │   │  ├ CE tracking        │   │ pay → pack in the    │
│ demo ────┼──▶│      (target: under 10 min)   │   │  ├ Qualifier clock    │   │ app + PDF by email   │
└──────────┘   └───────────────────────────────┘   │  └ Bid-ready PDF      │   └──────────────────────┘
   no login                   │                    └───────────┬───────────┘
   no email                   ▼                                ▼
                14-day free trial, no card                Subscribe (Stripe Checkout)
                    (first 100 signups)
```

**The free thing is the demo, and there is only one of it.** Wave 1 specified three different free
things across three documents — a free State Rulebook lookup (`OFFER.md` §7), this free lapse-risk
roster audit (S02), and a free trial (`specs/09`) — and nobody had said which one a stranger meets
(wave-1b **M3**). **D2: the no-login State Rulebook demo is the single free entry point**, because it
gives the *diagnosis* (what this state requires of this trade) and never the *remedy* (your licences,
your dates, your alerts), and because it needs no private-individual data to exist. The 14-day trial
is not a second free entry point; it is what the account does for its first fortnight.

The **free lapse-risk audit** (S02) keeps its design below and stays a SHOULD. When it ships, the
argument for it is still good: it is the same import pipeline as onboarding stopped one screen early,
so a prospect who completes it has already done the hardest part of activation.

> **The activation step, decided (D1, wave-1b review).** The stranger meets **three surfaces in this
> order and no others**: the **no-login State Rulebook demo** — pick a state and a trade, see the cited
> requirements and what the board does not publish, no email, no account (D2: this is the *single free
> entry point*); then a **magic link**; then a **14-day free trial, no credit card**, for the first 100
> signups. Stripe Checkout comes at day 14 or whenever they choose it, not before.
>
> `OFFER.md` §8's $149 First State Audit and the done-for-you roster build are **deferred to iteration
> 2**, gated on the register-ingestion spike (`BACKLOG.md` S10) — the audit's deliverable is a roster
> build only a human can currently perform, which is C2. **The screen list does not change**: the flow
> is S01 → (S02 demo) → S03 magic link → S04–S07 onboarding → S09 dashboard, and Checkout is inserted
> after day 14 rather than after S08. E16 (trial ending) **is** sent, at **day 7 and day 12**, with the
> account going read-only at day 14 (`specs/09`).
>
> The **free lapse-risk audit at S02 stays a SHOULD** (`BACKLOG.md` S8) rather than becoming the free
> entry point, because it takes a pasted roster of technician names and licence numbers **before an
> account exists** — private-individual data on a marketing surface (`PIPELINE.md` standing rule 1).
> When it is built: **parse in the browser, never persist**, privacy notice **above** the paste box,
> and the flow named in `/legal/privacy`.

---

## 2. Landing and the free audit

### S01 · Landing `/`

One problem, one promise, one action. Full spec belongs to the Offer & Landing agent; the UX
requirements it must satisfy are:

- **The hero object is the tile grid on the board**, not a headline over a photograph — a sample
  footprint with three states **AT RISK** and one **LAPSED**, so the product's core idea is understood
  before a word is read (`IDENTITY.md §3`). Status words are the four the whole product uses:
  **READY / AT RISK / LAPSED / NOT TRACKED**, never colour alone.
- **Price is published on this page**, because the two most-complained-about incumbents hide theirs
  (`PERSONA.md §12`).
- **Coverage boundary stated** in the same viewport as the price (C10).
- **One primary CTA: "Start your 14-day free trial"** (D1), repeated unvaried, never a second goal on
  the page. The secondary is not a CTA and must not look like one: a quiet in-flow link to the demo.
- No stock photography, no gradients, no scroll-triggered animation (`IDENTITY.md §8.4`, `§8.5`).

### S02 · Free lapse-risk audit `/audit` — **SHOULD, not built at launch (D2)**

Deferred to `BACKLOG.md` S8. The design below stands for whenever it is built, with **four
requirements added by the wave-1b review (M14)** that are not optional:

1. **Parse in the browser.** The pasted block never reaches the server. Names and licence numbers of
   private individuals arriving on a marketing surface, before an account and before consent, is the
   thing `PIPELINE.md` standing rule 1 exists to stop — and "nothing stored until the last one" does
   not cover a server-side parse.
2. **The privacy notice sits *above* the paste box**, not under it and not behind a link: what happens
   to this text, that it does not leave the browser, and what we keep if they ask for the result.
3. **`/legal/privacy` names this flow explicitly**, as its own paragraph.
4. **The exception list is computed client-side too**, from a rules bundle the page fetches. If that
   proves impossible, the feature does not ship — it does not quietly become a server upload.

Three steps, no account, nothing stored until the last one.

| Step | Screen | States |
|---|---|---|
| 1 | **Trades and states** — pick HVAC / plumbing / electrical, pick the states you work in from the tile map | idle · invalid (none selected) |
| 2 | **Paste or upload** — a textarea that accepts a pasted spreadsheet block, or a CSV drop zone. Sample and template both one click away | idle · parsing · parsed-with-warnings · error (unparseable) · empty |
| 3 | **Result** — the readiness map, the exception list, and per exception the rule and its `.sr-source` line | ready · partial (some states outside coverage) |

**Design decisions worth defending.**

- **Paste beats upload.** The incumbent format is a Google Sheet already open in another tab
  (`PERSONA.md §2.2`); asking for a file export is a step we can delete. The textarea accepts
  tab-separated text and infers columns.
- **The audit shows the *rule*, not just the risk.** "Texas ACR renews annually, 8 CE hours, one hour
  must be state law" with the TDLR link is the thing the prospect cannot get from their spreadsheet,
  and it is checkable in thirty seconds — which is the trust strategy in `PERSONA.md §12`.
- **Email is asked for at the end, to send the result**, not at the start to unlock it. The result is
  already on screen. The email is for keeping it.
- **Refusal is a first-class outcome.** If a row is outside coverage, the row says "Not covered — here
  is the board", and the count of not-covered rows is shown next to the count of findings. Overstating
  coverage in the audit is the fastest way to lose a compliance buyer.

---

## 3. Signup and onboarding — the ten-minute path

### S03 · Magic link `/signin`

One email field, one button. On submit: "Check your email. The link works once and lasts 15 minutes."
States: idle · sending · sent · expired-link · already-signed-in. No password field exists anywhere in
the product, so there is no reset flow, no password strength meter and no leaked-credential surface.

### S04–S07 · Onboarding, four steps, a progress rail, every step skippable except the first

| Step | Screen | What it asks | Why it is this short |
|---|---|---|---|
| S04 | **Company** | Legal name, trading name, and whether this is one company or a platform with several operating entities | The entity question decides the whole information architecture and is cheap to ask once and expensive to retrofit (`PERSONA.md §4.3`) |
| S05 | **Trades** | HVAC · plumbing · electrical, multi-select | Scopes the rule library |
| S06 | **States** | The tile map, tap to select. Coverage is drawn: covered states are selectable, others are dashed with "not covered yet" | Turns the coverage boundary into an interaction instead of a disclaimer |
| S07 | **Roster** | CSV import **or** manual entry | See below |

### S07 in detail — the ten-minute constraint made concrete

**Two paths, chosen by size, both landing in the same place.**

**Path A — CSV import** (default for ≥ 15 technicians)

1. **Download the template** or **drop your own file**. The template is the shape they already have:
   `technician_name, trade, state, credential_type, license_number, issued_date, expiry_date`.
2. **Column mapping** — we guess, they confirm. Header synonyms are matched case- and
   punctuation-insensitively (`exp`, `expires`, `expiration`, `exp date`, `renewal date` → `expiry_date`).
3. **Preview and repair** — every row shown with its parsed status. Bad rows are **not rejected**; they
   are imported with `status = NOT TRACKED` and listed in a fix-later queue. *Rejecting a file because
   4 of 48 rows lack a date is how a ten-minute onboarding becomes an abandoned one.*
4. **Date format is asked, not guessed.** One radio: `MM/DD/YYYY` or `DD/MM/YYYY`, defaulted from a
   sample of the file, shown with a real example row from their data. Silent misparsing of `03/09/2026`
   is the highest-consequence bug this product can ship.
5. **Import** → the map lights up.

**Path B — manual entry** (default for < 15 technicians)

A single inline-add table: technician, trade, state, credential, number, expiry. Enter adds a row and
keeps focus in the first cell. Twelve technicians is roughly four minutes of typing. No modal, no
wizard, no page reload per row.

**States for S07:** empty · mapping · previewing · importing (progress with a row counter, never a bare
spinner) · imported-with-warnings · imported-clean · failed (with the file returned and the reason
named). Import runs through the jobs queue (`PLAN.md` A12) for files over 500 rows, and the screen
survives being closed.

### S08 · Onboarding complete

Not a celebration screen. The readiness map, the single worst finding stated as a sentence, and one
primary action pointing at it. Example: *"Your Texas ACR contractor licence expired 12 days ago. Late
renewal under 90 days costs 1.5× the fee."* → **"See what to do"**.

---

## 4. The product

### S09 · Dashboard `/app`

**The shell is a top bar over a full-width board** (`IDENTITY_ARBITRATION.md` §5, `design-system.css`
`.sr-bar`) — **not a left rail**. Wave-1 UX assumed the rail; the arbitration replaced it, both to make
StateReady's layout the third distinct structure in a fleet whose other two apps both run rails, and
because the board's hero object is a wide grid that wants the width. `.sr-rail` still resolves for
compatibility; **`.sr-bar` is the correct name and the one to build against.**

The canonical composition from `IDENTITY.md §8.2`: three stats, then the **tile grid** (7 cols) beside
the runway (5 cols), then the expiring list (12 cols), then the alert feed. Rendered in full in
`identity/samples.html`. Status vocabulary throughout is **READY / AT RISK / LAPSED / NOT TRACKED**,
with **AT RISK at 90 days** so the grid and the first alert gate can never disagree (`specs/07`, D7).

**Key interactions**

| Interaction | Behaviour |
|---|---|
| Click a state tile | Opens the state sheet (S10). Selection is a 2px ink outline, never a colour change |
| Keyboard on the map | Arrow keys move between tiles in grid order; `Enter` opens; `Esc` closes the sheet and returns focus to the tile |
| Hover a runway marker | Text tooltip: technician, credential, exact date, days remaining. The same content exists as a visually-hidden list, so the runway is never the only route to the data |
| Sort the expiring list | Header click; sort state announced via `aria-sort`; default is soonest-first, and lapsed always floats above at-risk regardless of sort |
| "Export compliance PDF" | Generates for the current filter, not for everything. Named `<company>-compliance-<YYYY-MM-DD>.pdf` |
| Filter | State · trade · technician · status. Filters are in the URL, so a filtered view is a link a coordinator can send to their GM |

**States:** loading (skeletons, never a full-page spinner) · empty (no technicians — routes back to
S07) · populated · all-ready (the map is entirely green: say so in a sentence, and show the next
expiry date, because "nothing is wrong" still needs a next action) · stale (rule library refresh
failed — a banner naming the affected states rather than silently serving old data).

### S10 · State sheet `/app/states/:code`

A right drawer. Who is licensed here, what the state requires, what is due. Every requirement carries
its `.sr-source` line. If the state is one we do not cover, the sheet shows the refusal state and a
link to the board — and, if it is a state they do not operate in, the expansion-report offer (S16).

### S11 · Technicians `/app/technicians`

The roster table (`IDENTITY.md §9.4`). Columns: technician, trade, states, credentials held, worst
status, next date. Row click opens the technician sheet. Bulk actions: assign a state, request
documents, export.

**Compact mode** (36px rows) is offered once a roster passes 60 technicians, as a one-time inline
prompt, and is remembered. It is never the default.

### S12 · Technician sheet

Header: name, trade, home state, worst status. Body: one **licence card** (`IDENTITY.md §9.5`) per
credential, each with its CE meter and provenance line. Footer: documents, and a **"Send this
technician their card"** action that emails the read-only mobile card (S18).

### S13 · CE tracking `/app/ce`

One row per technician × credential × cycle. The **rule is displayed next to the meter, always** —
hours required, which hours are constrained, delivery-mode constraints, cycle end date. The New
Jersey case is the worked example the screen must handle: *34 hours per three-year cycle by 31 March,
of which the 10-hour update must be taken in a live class.* A product that shows `24/34 h` and calls
it 71% done, when the missing 10 are the ones that cannot be taken online, has actively misled its
user. **The meter therefore renders constrained hours as a separate, labelled segment** and the rule
text beneath it names the constraint.

States: on-track · short-with-time · short-and-late · cycle-closed · rule-not-verified.

### S14 · Renewal calendar `/app/calendar`

Month and list views over the same data as the runway. Two exports, both requested by the persona's
actual behaviour (`PERSONA.md §2.2`, method 2 — they already live in Outlook and Google Calendar):

- **`.ics` subscription URL** (read-only, per company, revocable). This is deliberate: rather than
  fight the calendar habit, we feed it.
- **CSV** for the ones who will always keep a spreadsheet.

### S15 · Qualifier watch `/app/qualifiers`

The screen no competitor has. One row per company × state × qualifier. When a qualifier is marked
**disassociated**, the row starts a **90-day clock** rendered as a runway lane, with the statutory
consequence and its source stated on the row:

> *"The licensee must replace the qualifier within 90 days of the disassociation date. Failure to
> replace the qualifier within 90 days results in the automatic suspension of the license or removal
> of the classification."* — CSLB Disassociation Request (B&P §§ 7076, 7068.2, 7083)

Alerts on this clock run at **75 / 45 / 15 / 5 days remaining**, not the standard 90/60/30/7, because
the whole window is 90 days. **Flagged as a design judgment**, not a sourced cadence.

### S16 · Expansion report — preview, purchase, delivery

1. **S16a Preview** `/app/expand/:state` — the table of contents, the first requirement in full with
   its source line, and everything else blurred with the section titles legible. The buyer sees the
   *shape* and one real piece of the content before paying.
2. **S16b Checkout** — Stripe Checkout, one-time payment (`PLAN.md` D2). Price published.
3. **S16c Generating** — a real checkpoint list, not a spinner: *classification → exam and reciprocity
   → bond → insurance → qualifier → fees → timeline → sources*. Runs on the jobs queue; the page can be
   closed. Target under two minutes; the buyer is told the target and told when it is exceeded.
4. **S16d Delivered** — the report opens in the app on the `.sr-doc` surface, and a PDF is emailed.
   Every requirement carries its provenance line; the PDF prints them as full URLs (`design-system.css`
   `@media print`).
5. **Re-delivery is free and forever.** The report page stays available; the buyer can re-download and
   is emailed if a rule inside it changes for 12 months. That last clause is the strongest honest
   argument for the tracker subscription, and it is made by the product rather than by a salesperson.

**Refusal path:** if coverage for that state × trade is incomplete, **the buy button is not shown.**
The screen says what is missing and offers an email when it lands. Selling a report we cannot fully
source is the one failure this product does not recover from.

### S17 · Settings, billing, help, admin

- `/app/settings` — company, entities, users, alert recipients, alert cadence (defaults 90/60/30/7,
  editable), **time zone and the local hour the digest is aimed at** (with the honest note that we
  currently release one digest a day — `specs/06`), date format, `.ics` URL, and **theme
  (board / paper / system)**.

  **The theme names are `board` and `paper`, not light and dark** (`IDENTITY_ARBITRATION.md` §3.2,
  `design-system.css` `data-theme="board" | "paper"`). The board is the deep graphite-green default —
  the operator's instrument surface. **Paper is what leaves the building**: print, the bid-package PDF,
  the shareable readiness link (S19), the technician card (S18) and every alert email are rendered on
  paper whatever the operator's setting, because `PERSONA.md §9` requires every artefact to be
  forwardable to someone who has never logged in and a forwarded dark screenshot is not that.
  `system` follows `prefers-color-scheme`, which resolves a light preference to **paper**.
- `/app/billing` — Stripe Customer Portal. **Cancel is a two-click path from this page and is never
  hidden**, in direct response to the incumbent complaint *"Cancellation is Intentionally Impossible"*
  (`PERSONA.md §5`). Cancelling shows the export button on the same screen.
- `/app/help` — searchable, plus the **methodology page**: how the rule library is built, how often
  each source is re-checked, what `confidence` means, and the full list of covered states × trades
  with each one's last-verified date. This page is a trust asset (`PERSONA.md §12`), not documentation.
- `/admin` — signups, activation, conversion, MRR, churn (`PLAN.md` §4). Internal.

### S18 · Technician licence card (public, tokenised) `/c/:token`

No login. One card per credential: holder, credential, number, state, board, status, expiry, and a
"verify at the board" link. Mobile-first, printable, works at 320px, readable in a van at arm's length.
Token is revocable per technician and carries no other data. **This is the whole of the technician
experience in v1** (`PERSONA.md §11`).

### S19 · Shared readiness link (public, tokenised) `/r/:token`

The map, the counts and the expiring list, read-only, no login, revocable. This is J5 —
*"answer in five seconds with something I can forward"* — and it is the product's cheapest distribution
mechanism, because the person it gets forwarded to is the economic buyer.

---

## 5. Screen list with states

| ID | Screen | Route | States |
|---|---|---|---|
| S01 | Landing | `/` | static |
| S02 | Free audit | `/audit` | idle · parsing · parsed-with-warnings · error · result · result-partial-coverage |
| S03 | Magic link | `/signin` | idle · sending · sent · expired · already-signed-in |
| S04 | Onboarding — company | `/onboarding/company` | idle · invalid · saving |
| S05 | Onboarding — trades | `/onboarding/trades` | idle · invalid (none) |
| S06 | Onboarding — states | `/onboarding/states` | idle · invalid (none) · some-not-covered |
| S07 | Onboarding — roster | `/onboarding/roster` | empty · mapping · previewing · importing · imported-clean · imported-with-warnings · failed |
| S08 | Onboarding complete | `/onboarding/done` | all-ready · has-findings |
| S09 | Dashboard | `/app` | loading · empty · populated · all-ready · stale-rules |
| S10 | State sheet | `/app/states/:code` | covered · not-covered · not-operating |
| S11 | Technicians | `/app/technicians` | empty · populated · filtered-empty · compact |
| S12 | Technician sheet | `/app/technicians/:id` | complete · missing-documents · has-lapsed |
| S13 | CE tracking | `/app/ce` | on-track · short-with-time · short-and-late · cycle-closed · rule-not-verified |
| S14 | Calendar | `/app/calendar` | month · list · empty |
| S15 | Qualifier watch | `/app/qualifiers` | none-flagged · clock-running · overdue |
| S16 | Expansion report | `/app/expand/:state` | preview · checkout · generating · delivered · refused-incomplete-coverage |
| S17 | Settings / billing / help / admin | `/app/settings` etc. | — |
| S18 | Technician card (public) | `/c/:token` | valid · revoked · expired-credential |
| S19 | Shared readiness (public) | `/r/:token` | valid · revoked |
| S20 | Legal | `/terms`, `/privacy`, `/refunds` | static |

---

## 6. Email touchpoints

Every email is plain, single-column, ≥16px, **subject-line-first** (it will be read in a notification
preview), and carries one link and the disclaimer. Sent through Resend (`PLAN.md` P6).

| # | Email | Trigger | Subject pattern |
|---:|---|---|---|
| E1 | Magic link | Sign-in request | `Your StateReady sign-in link` |
| E2 | Audit result | Free audit completed | `Your roster: N findings across M states` |
| E3 | Welcome + next step | First sign-in | `You're in. One thing to do next.` |
| E4 | Import summary | Import completes | `Imported 34 technicians. 4 rows need a date.` |
| E5 | **Renewal alert — 90 days** | Cron, daily | `TX — 3 licenses expire within 90 days` |
| E6 | **Renewal alert — 60 days** | Cron | `OH — 2 licenses expire within 60 days` |
| E7 | **Renewal alert — 30 days** | Cron | `OH — 2 licenses expire in 30 days` |
| E8 | **Renewal alert — 7 days** | Cron | `OH — 2 licenses expire in 7 days. Renewal window is open.` |
| E9 | Lapsed | The day after expiry | `TX — ACR contractor license expired yesterday` |
| E10 | CE cycle warning | 90 / 30 days before cycle end | `NJ — 10 live-class hours outstanding, cycle closes 31 March` |
| E11 | Qualifier clock | 75 / 45 / 15 / 5 days remaining | `CA — 45 days to replace the qualifier on license #…` |
| E12 | Rule change | Library change touching a tracked state | `CA rule change: unlicensed-contracting penalty floor` |
| E13 | Technician card | Coordinator sends it | `Your license card — keep this link` |
| E14 | **Renewal-week brief** (the weekly digest) | Monday, **on by default on every paid plan; off during the trial**, editable in S17 | `3 things expiring this month` |
| E15 | Report delivered | Expansion report generated | `Your Ohio expansion report` |
| E16a | Trial ending — day 7 | 7 days after signup | `Your trial ends in a week. Here's what we found.` |
| E16b | Trial ending — day 12 | 12 days after signup | `Your trial ends Friday — and the plan your usage points at` |
| E16c | Trial ended — read-only | Day 14 | `Your trial has ended. Your data is intact; alerts are paused.` |
| E17 | Receipt / dunning | Stripe webhook | standard |
| E18 | Enterprise enquiry received | 16th state blocked, enquiry submitted (`specs/09`) | `We have your details — a quote within two business days` |

**Rules that make these emails rather than noise.**

- **One email per state per day, maximum.** Six licences expiring in Ohio is one email with six rows,
  never six emails. Alert fatigue is how this product gets filtered to a folder and forgotten.
- **The subject line carries the state and the number**, because that is what is visible on a phone
  lock screen (`PERSONA.md §11`).
- **Every alert names the action and the consequence, with the source.** "Renew now — late renewal
  under 90 days is charged at 1.5× the fee (TDLR)". Not "action required".
- **No email is sent that says nothing.** If the week is clear, the digest is not sent; the subscriber
  is told at signup that silence means clear.
- **Cadence is editable per company** in S17. Defaults are 90/60/30/7 because that is what the market
  has standardised on (`PERSONA.md §9`).
- **E14 is on by default on paid plans** (wave-1b **m8**). `OFFER.md` §4 sells the renewal-week brief
  as a bonus on all paid plans while wave-1 UX had it opt-in and off — a bonus nobody receives is not
  a bonus. It stays **off during the trial**, so the trial's only email cadence is the alert digest
  plus E16a/b/c.
- **E16's cadence is day 7 and day 12, with read-only at day 14** (`specs/09`), not day 11 and 14
  (wave-1b **m7**). Twelve rather than eleven, because it lands two days before the wall rather than
  three, and because the day-12 email is the one that names the plan the usage implies.
- **Every email renders in the paper theme**, never the board — see S17.

---

## 7. Mobile behaviour

Implementing the decision in `PERSONA.md §11`.

| Surface | Mobile behaviour |
|---|---|
| **All emails** | Mobile-first, **paper theme always** — an alert forwarded to a GM must not arrive as a dark screenshot. Single column, 16px minimum, one link, tappable target ≥ 44px |
| **S18 technician card** | Mobile-first, **paper theme** (it is shown to a GC in a truck and printed). Works at 320px. No login. Add-to-home-screen friendly |
| **S19 shared readiness** | Mobile-first, read-only, **rendered in the paper theme** because it is forwarded. The grid degrades to a **grouped status list** (LAPSED → AT RISK → READY → NOT TRACKED), because 51 tiles at 28px is a poor phone experience and the list carries the same information |
| **S09 dashboard** | **Read-only on phones.** Stats, the expiring list and the alert feed. Map degrades to the status list. Import, editing and report purchase show "Open on a computer to do this" with a "send me the link" button |
| **S11 technicians** | Read-only list on phones; row tap opens a read-only card |
| **S02 free audit** | Works on mobile because paste works on mobile, but the CSV drop zone becomes an upload button |
| **Everything else** | Not built for phones and says so, rather than shipping a broken small-screen layout |

The minimum bar is the one the brief sets: **read-only alerts work on a phone, always.**
`design-system.css` collapses the top bar's navigation at 1024px and reduces map tiles to 28px at 640px.

---

## 8. Accessibility

Against `IDENTITY.md §9` commitments A1–A11, expressed as screen-level obligations.

- **The map is a list.** `<ul>` of `<button>`s in reading order, each with an accessible name of the
  form `"Ohio — At risk. 2 journeyman licences expire within 30 days."` Arrow-key roving tabindex.
  The map is never the only route to its data: the expiring list below carries the same rows.
- **The runway is decorative to assistive technology** (`aria-hidden`) and is mirrored by a
  visually-hidden list of the same markers in the same order. A time axis positioned by percentage is
  not readable by a screen reader; pretending otherwise is worse than exposing an equivalent.
- **Status is never colour alone.** Chip = colour + glyph + word. Table cell = dot + word. Map tile =
  fill + glyph + accessible name. Print and `forced-colors` add hatch patterns.
- **Every form field** has a `<label>`, errors are text and are referenced by `aria-describedby`, and
  the error names the fix ("Use MM/DD/YYYY. We read 14 as a month."), not the failure.
- **Import progress** is `aria-live="polite"` with a row counter, updated at checkpoints rather than
  per row, so a screen reader is not flooded.
- **The alert feed** is `aria-live="polite"`.
- **Sheets** trap focus, close on `Esc`, and return focus to the element that opened them.
- **Targets ≥ 44×44px** everywhere, including map tiles (40px visual + `.sr-hitslop`).
- **Zoom to 200%** without loss of content or function; every dimension is in `rem` or `ch`.
- **`prefers-reduced-motion`** removes all transitions; status changes remain visible as discrete
  states.
- **Colour-vision safety:** the red/green pair is never the only difference between two statuses; the
  glyph set (✓ ◑ ✕ —) is distinguishable at 10px in monochrome.
- **Tested at:** 320px, 768px, 1280px, 1920px; 200% zoom; forced-colors; reduced-motion; keyboard-only;
  and with the stylesheet disabled (the document must still be readable in DOM order).

---

## 9. What this UX deliberately does not include

Stated so the wave-1b reviewer can challenge the omissions rather than discover them.

| Not building | Why |
|---|---|
| A technician mobile app | `PERSONA.md §11`. Revisit if > 25% of dashboard sessions are mobile in 90 days |
| Automated renewal filing | We are an information product, not a filing agent (C7). Filing is the expediters' liability and their business |
| A ServiceTitan / Housecall Pro / ADP integration | CSV first. An integration is a partnership conversation and a maintenance burden; `PERSONA.md §10` O2 says import, do not displace |
| SSO / SAML / API | Behind a tier nobody has bought yet (`PERSONA.md §4.3`) |
| In-app chat or a support widget | `PLAN.md` A6: auto-responder plus a help page, escalating to the founder's mailbox |
| A compliance "score" out of 100 | It invents a number we cannot source, and it hides which licence is the problem. Counts and dates only |
| Document OCR / expiry extraction from uploaded certificates | That is Certly's problem shape. Duplicating it here blurs two apps that must stay distinct (`IDENTITY.md §5.1`) |
| Bond or insurance *purchase* | Tracking only. Selling either makes us a broker |
| **The free lapse-risk audit (S02) at launch** | **SHOULD** (`BACKLOG.md` S8). D2 makes the no-login demo the single free entry point; S02 needs private-individual data before an account exists and does not ship until the four conditions in S02 above are met |
| **The CE tracking screen (S13) as its own route at launch** | **SHOULD.** The CE *obligation* ships inside M5 and is rendered on the licence and the dashboard; the dedicated `/app/ce` screen with the constrained-hours meter waits for a customer whose CE is the reason they bought |
| **The renewal calendar and `.ics` (S14)** | **SHOULD** (`BACKLOG.md` S3), triggered by the first customer who asks how to get this into Outlook |
| **The technician licence card (S18)** | **SHOULD.** It is the whole technician experience in v1 and it is real, but nothing in the Must chain depends on it and no threshold measures it |
| **The done-for-you roster build and the $149 First State Audit** | **Iteration 2**, gated on the register-ingestion spike (`BACKLOG.md` S10). Until that verdict exists, no screen and no email says "we build the roster" |

**And the two that were stranded and are now Musts** (wave-1b M1): **S15 qualifier watch → M16** and
**S19 shared readiness link → M17**. Both were load-bearing in `PERSONA.md` (J6, J5) and in
`IDENTITY.md` (§2 UA3, §11) and had no Must and no spec — the differentiator was modelled in
`specs/05` as a `qualifier_replacement` deadline kind and nothing rendered it.

---

## 10. Self-review against `PERSONA.md` and `IDENTITY.md`

| Requirement | Where it is served | Verdict |
|---|---|---|
| J1 see what I inherited | S08 complete, after import; **not** S02, which is now a SHOULD (D2) | ✅ |
| J2 be told without logging in | E5–E9 | ✅ |
| J3 CE: how many, what kind, what format, by when | The obligation, its subject breakdown and its separate cycle window ship inside M5 and render on the licence and the dashboard; the dedicated S13 screen is a SHOULD | ⚠️ partial at launch, by decision |
| J4 bid file in one click | S09 export | ✅ |
| J5 answer in five seconds, forwardable | S09 grid + S19 shared link, now **M17** and rendered in the paper theme | ✅ |
| J6 qualifier clock | S15, now **M16** | ✅ |
| J7 what it takes in the next state | S16 | ✅ |
| J8 rule change alerts | E12, fed by the drift queue (`specs/14`) once a drift is accepted or corrected | ✅ |
| J9 per-entity roll-up | S04 entity question + S11 filters | ⚠️ partial — full multi-entity roll-up is deliberately thin in v1 |
| J10 credential on a phone | S18 | ✅ |
| O7 ten-minute onboarding | S07 both paths, warnings-not-rejections | ✅ |
| O4 how do I know it's right | `.sr-source` everywhere + help methodology page | ✅ |
| §12 trust: published price, stated boundary, refusal | S01, S10, S13, S16 refusal path | ✅ |
| §11 mobile decision | §7 above | ✅ |
| `IDENTITY.md §4` T4 no manufactured urgency | No countdown component exists in the design system | ✅ |

**Known gaps, stated rather than hidden.**

0. **Four screens are deliberately not built at launch** — S02, S13, S14, S18 — each with a named
   trigger in `BACKLOG.md` §2 and a row in §9 above. They were stranded between this document and the
   backlog at wave 1, treated as load-bearing here and as SHOULDs there; the decision is now explicit
   in both files rather than in neither.
1. **Multi-entity roll-up (J9) is thin in v1** — one company can hold several entities, but there is no
   cross-entity consolidated licence view. Persona 2's full need is deferred with the tier that pays
   for it.
2. **The qualifier alert cadence (75/45/15/5) is a design judgment**, not a sourced convention.
3. **`.ics` subscription is a UX bet**, not a validated one: it assumes coordinators would rather feed
   their existing calendar than replace it. Cheap to build, cheap to remove; instrument it.
4. **The audit's paste parser is the highest-risk component in the whole product.** Silent date
   misparsing produces confidently wrong compliance status. The date-format radio (S07 step 4) is the
   mitigation, and it must be built even though it costs a click. The prior art is a warning, not a
   reassurance: ADP's own Talent Profile — Certifications API guide records, under Known Issues, that
   the *"Add and Change API's — Certifications are not throwing any errors when an invalid date format
   is sent through the request payload"*
   ([ADP developer docs](https://marketplace-cdn.adp.com/dev-portal/pdf/protected/Talent_Profile_Certifications_API_Guide_for_ADP_Workforce_Now)).
   A register that silently accepts a wrong date is worse than no register, because it is believed.
