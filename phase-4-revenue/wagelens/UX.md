# WageLens — USER EXPERIENCE (v1)

**Product:** the county-and-craft wage lookup that files your certified payroll.
**Status:** binding for wave 1; consumed by `BACKLOG.md` and wave-2 build.
**Depends on:** `PERSONA.md` (cited as **P§n**), `IDENTITY.md` (cited as **I§n**),
`design-system.css`, `identity/samples.html`.
**Author:** Buyer & Identity agent. **Date:** 2026-09-03.
**Platform constraints inherited from `PLAN.md`:** magic-link auth, no OAuth (A7); Stripe Checkout
+ Portal (D2); Vercel + Neon (D3, D13); Vercel Cron for jobs (A12); every regulatory value carries
`source_url` / `last_verified` / `verified_by` / `confidence` and a disclaimer on every screen and
document (A10).

---

## 0. The one sentence this UX has to satisfy

> **A person who has never used us, on a Friday afternoon, with a payroll they already ran, must
> reach a filable WH-347 in under ten minutes — and must be stopped before they file something
> wrong.**

Ten minutes is not a slogan. It is derived: the category's own epitaph, quoted by one of its
better-liked products' reviewers, is *"Easy to use when you figure it out"* (P§4.3), and the stated
barriers to contractor software adoption include *"lack of time to implement and learn new
products"* (P§10). Everything below is budgeted against that number in §4.

---

## 1. The end-to-end journey

```
   PUBLIC                         ACTIVATION (≤10 min)                   THE RHYTHM (weekly)
┌────────────┐   ┌──────────────────────────────────────────┐   ┌──────────────────────────────┐
│  Landing   │   │ 1  Project: state → county → construction│   │  Mon–Thu   nothing from us   │
│     ↓      │   │    type → wage determination attached    │   │      ↓                        │
│ Free rate  │──▶│ 2  Roster: import or add 3–20 workers,   │──▶│  Thu 4pm   "your week is     │
│  lookup    │   │    each mapped to a classification        │   │            ready" email      │
│     ↓      │   │ 3  Week: import payroll CSV or type it    │   │      ↓                        │
│  Sign up   │   │ 4  Review flags                           │   │  Fri       grid → review →   │
│ (magic     │   │ 5  Generate WH-347                        │   │            sign → file       │
│  link)     │   │ 6  Sign the Statement of Compliance       │   │      ↓                        │
└────────────┘   │ 7  Download / export / send               │   │  Any time  determination     │
                 └──────────────────────────────────────────┘   │            changed → alert    │
                                    ↓                            └──────────────────────────────┘
                       Paywall lands HERE, after value          Billing · Settings · Help
```

**Where the paywall sits, and why.** The free rate lookup is anonymous and unlimited enough to be
useful (I§2 Step 6: the lookup is the first half of the category, so giving it away is positioning,
not discounting). Signup is required to create a *project*. Payment is required to **generate the
second week's WH-347**: the first week is free, complete and downloadable. That places the paywall
after the buyer has seen a real filable document with their own numbers in it — which is the only
proof this market accepts (P§9.3), and which respects the finding that free trials are a top-five
resource for SMB purchases and that **62% of buyers say the product trial is their top factor in
the final purchase decision** (P§13 S27).

---

## 2. Screen list

`(A)` = in the app, `(P)` = public/marketing, `(E)` = email. Every screen's states are in §6.

| # | screen | who | purpose |
|---|---|---|---|
| **P1** | Landing `/` | all | One problem, one promise, the lookup embedded above the fold |
| **P2** | Rate lookup `/rates` | P3 estimator, anonymous | The free tier. County + craft → rate + provenance |
| **P3** | Determination viewer `/rates/[wd]` | anonymous | A whole determination, readable, with modification history |
| **P4** | Pricing `/pricing` | P1 owner | Published price. No "contact us" under $299 |
| **P5** | Sign in / Sign up `/signin` | all | One email field. Magic link only |
| **P6** | Magic link sent `/signin/sent` | all | The most-abandoned screen in any magic-link product; §5.2 |
| **P7** | Legal `/terms`, `/privacy`, `/dpa` | P1, P5 | Required; also a trust signal (P§9.7) |
| **A1** | Onboarding: company | new | Legal name, address, contractor/subcontractor. 30 s |
| **A2** | Onboarding: first project | new | State → county → construction type → determination. 3 min |
| **A3** | Onboarding: roster | new | Import or add workers, map classifications. 3 min |
| **A4** | Onboarding: first week | new | Import payroll CSV or type the grid. 3 min |
| **A5** | Dashboard `/` | P2 office manager | Which weeks are filed, which are not, what is flagged |
| **A6** | Project list `/projects` | P2, P5 | All projects, status, determination staleness |
| **A7** | Project detail `/projects/[id]` | P2 | Tabs: This week · Workers · Submissions · Determination |
| **A8** | **The payroll grid** `/projects/[id]/weeks/[wk]` | P2, P4 | The centre of the product (I§11.3) |
| **A9** | Flag review `/projects/[id]/weeks/[wk]/flags` | P2 | Everything blocking the file, in one list |
| **A10** | WH-347 preview `/projects/[id]/weeks/[wk]/wh347` | P2, P1 | The document (I§11.6) |
| **A11** | Sign & file | P1 owner | Statement of Compliance (I§11.8) |
| **A12** | Submissions `/projects/[id]/submissions` | P2 | History, status, re-download, the 3-year archive |
| **A13** | Workers `/workers` | P2 | Roster across projects, classifications, apprentice ratios |
| **A14** | Conformance helper `/projects/[id]/conformance/[id]` | P2, P3 | Package for the contracting officer + 30-day tracker |
| **A15** | Determination watch `/projects/[id]/determination` | P2, P3 | Current mod, diff vs the mod you priced, alert settings |
| **A16** | Billing `/settings/billing` | P1 | Plan, invoices, card, cancel. Stripe Portal |
| **A17** | Settings `/settings` | P1, P2 | Company, users, notifications, export, theme, delete |
| **A18** | Help `/help` | all | Searchable; every article links the CFR paragraph |
| **A19** | Audit export `/settings/export` | P1 | One archive: every report, rate and source with dates |
| **A20** | GC roll-up `/subs` *(P5 tier only)* | P5 | Per-sub, per-week status; chase without email |
| **E1–E9** | Emails | — | §9 |

---

## 3. Screen-by-screen: the parts that carry the argument

### P2 — Rate lookup (the free tier, and the whole differentiator)

Three inputs, in the buyer's order: **state → county → construction type**, then a craft search.
Construction type is not a nicety — it is how DOL splits determinations (building, residential,
highway, heavy), and getting it wrong is a whole-project error.

- Results render as `.wl-prov` (I§11.7). **No rate ever renders as bare text.**
- Every result shows: WD number, modification, county, construction type, effective date, and
  *the date we read it*, with a link to the source on SAM.gov.
- One primary action: **"Watch this determination"** → email capture → E7 when it changes. This is
  the top-of-funnel for the estimator persona (P§1.3) and needs no account.
- Deep-linkable and indexable: `/rates/wa/pierce/building/electrician`. The buyer's search terms
  are in P§6 and they are the URL.
- **Disclaimer, dated, on every result** (PLAN.md A10).

### A2 — First project (the screen the ten minutes lives or dies on)

Four fields, in this order, each narrowing the next:

1. **Project name** — "however it appears on the contract; the prime will match on it."
2. **State → county** — a two-step select, not a map. A map is slower and worse on a phone.
3. **Construction type** — four options with one line of plain description each.
4. **Contract / solicitation number** *(optional)* — if given, we try to find the WD number in the
   solicitation; if not, the user pastes the WD number or picks from the county's active list.

Then: **"We found General Decision WA20250012, Modification 7, effective 15 Aug 2026."** with a
confirm and a *"this isn't the one in my contract"* escape that accepts a pasted WD number. The
escape matters: the determination in the contract is authoritative even when it is not the current
one, and we must never overwrite the contract.

A single `.wl-alert--info` sits under the confirm, once, on this screen only:

> The wage determination and these clauses are part of the contract by operation of law, whether
> or not anyone attached them to your subcontract. 29 CFR 5.5(e).

### A3 — Roster

Two paths, both visible:

- **Import** a CSV from payroll (QuickBooks, Foundation, Sage, ADP exports). Column mapping is a
  guided step with a preview of the first three rows, because *upload failure is the incumbents'
  most-quoted defect*: *"I often get errors uploading a file into their system"*, *"It is not
  bringing all wages over when uploading"* (P§4.3). **Our import must never fail silently:** every
  unmapped column is shown, every skipped row is listed with a reason, and nothing is written until
  the user confirms the preview.
- **Add manually** — name, identifying number (**last four digits only**, because 29 CFR
  5.5(a)(3)(ii)(B) forbids full SSNs on weekly transmittals), classification, apprentice status and
  period, default base/fringe from the determination.

Classification uses `.wl-field--classification` (I§11.2): it searches *only the classifications on
this project's determination*, shows the rate beside each, and offers **"not listed → check
conformance"** as the last option rather than accepting free text.

### A8 — The payroll grid

Rendered in `identity/samples.html` §5. Behaviour:

- Opens **pre-filled** from the last payroll import or, failing that, from last week's shape
  (same workers, same classifications, zero hours). A blank grid on week two is a design failure.
- Sticky header, sticky worker and classification columns, sticky totals footer.
- One row = one worker **in one classification**. A worker in two classifications gets two rows,
  and the "split this day" control on a cell creates the second row for them — because the wrong
  single row must be harder than the right two rows (P§7.4 error 2).
- Rates come from the determination and are read-only by default; overriding one requires a reason
  and stamps the override in the audit trail.
- Overtime is entered as a separate OT figure per day, never inferred, and the premium is applied
  to the **base rate only** — cash in lieu of fringe is not time-and-a-half (P§7.4 error 3).
- Autosave on cell blur, with a quiet "Saved 4:41 pm" in the toolbar. No modal, no toast.

### A9 — Flag review

Every blocker in one list, each with: the rule, the citation, the affected rows, and a fix action.
Flags are typed:

| flag | example | blocking? |
|---|---|---|
| `classification-not-on-wd` | "DRIVER — GROUP 1 is not on WA20250012 Mod 7" | **Yes** |
| `rate-below-determination` | "$51.00 base is below $54.12 for ELECTRICIAN" | **Yes** |
| `fringe-missing` | "No fringe recorded; 4(a)/4(b) cannot be answered" | **Yes** |
| `apprentice-ratio` | "3 apprentices to 1 journeyworker exceeds the program ratio" | Warn |
| `ot-premium-on-fringe` | "Overtime appears to include the fringe in the premium" | Warn |
| `hours-on-non-covered-day` | "8 hours on Sunday 23 Aug — confirm this is the covered project" | Warn |
| `determination-moved` | "Mod 8 published 1 Sep; 2 classifications changed" | Warn, escalates to blocking after 7 days |
| `week-gap` | "No payroll for week 9. File a no-work payroll or explain the gap." | Warn |

**Blocking flags disable the primary action and say why on the button itself** —
*"Generate WH-347 · 1 flag to clear"* — never a silent disabled button.

### A10 / A11 — Preview, then sign

The preview is the form (I§11.6). Signing is a separate, deliberate step:

- The three certifications are shown in full, in plain English, with the CFR citation.
- A typed full name, a checkbox confirming the signer pays or supervises payment, and the date.
- The 18 U.S.C. 1001 notice, verbatim in substance: *a fine, imprisonment of not more than five
  years, or both.*
- Only the owner or a user with the **Signer** role can complete it (§8.3). The office manager
  prepares; the owner signs. That is how the company actually works (P§1.1, P§1.2).
- **No confetti, no celebration.** A `.wl-alert--success` with the timestamp and the retention
  statement: "Retained until three years after the prime contract completes."

### A14 — Conformance helper

The screen that must not overreach. It does four things and refuses the fifth:

1. Asks whether the work is genuinely not performed by a listed classification, and shows the
   listed classifications side by side so the answer is checkable.
2. Warns, verbatim: *"The conformance process may not be used to split, subdivide, or otherwise
   avoid application of classifications listed in the wage determination."* (29 CFR 5.5(a)(1)(iii)(B))
3. Assembles the SF-1444 package — proposed classification, duties, proposed rate and fringe, the
   reasonable-relationship argument against listed rates — as a PDF **addressed to the contracting
   officer**.
4. Tracks the 30 days: WHD "will approve, modify, or disapprove every additional classification
   action within 30 days of receipt", or say it needs longer.
5. **It does not file.** A permanent line on the screen: *"The contracting officer submits this to
   DBAConformance@dol.gov. We can't file it for you and neither can any vendor."*

### A20 — GC roll-up (P5 tier)

A matrix: subs down, weeks across, `.wl-week-strip` cells. Click a cell for that sub's week.
Actions: request, remind, accept, reject-with-reason. The reason is a picklist mapped to our own
flag types so the sub receives an actionable message, not "rejected". The regulation on the header
of the page, once: *"The prime contractor is responsible for the submission of all certified
payrolls by all subcontractors."* (29 CFR 5.5(a)(3)(ii)(A)).

---

## 4. Onboarding in under ten minutes — the budget

| step | budget | how it is bought |
|---|---:|---|
| P5 → P6 → inbox → app (magic link) | **60 s** | One field. The link opens the app already at A1; it never lands on a generic dashboard. |
| A1 company | **30 s** | Three fields; address is a single line, parsed later. |
| A2 first project | **3 min** | State/county/type are three selects. The determination is *found*, not typed. |
| A3 roster | **3 min** | CSV import with mapping preview; or 3–20 manual rows at ~10 s each with classification autofill from the determination. |
| A4 first week | **2 min** | Payroll CSV import, or the grid pre-filled with the roster at zero hours and `Ctrl+D` fill-down. |
| A5 flags → A10 preview | **60 s** | Most first weeks have 0–2 flags; each has a one-click fix. |
| **total** | **≈9.5 min** | |

**Rules that protect the budget**

- **No feature tour, no product video, no checklist gamification.** The onboarding *is* the first
  WH-347.
- **Nothing is asked that is not needed for this week's report.** Fringe plan details, deduction
  types beyond a total, EIN, logo — all deferred to Settings and prompted only when a report
  actually needs them.
- **Every step is resumable.** State is saved server-side per step; the magic link returns the user
  to the step they left. The office manager will be interrupted; that is not an edge case.
- **A visible "skip to the grid"** for the buyer who already knows what they are doing. Skipping
  produces a warning banner, not a wall.
- **The ten-minute claim is instrumented.** `onboarding_started` → `wh347_generated` median is a
  tracked metric from day one (PLAN.md A14 events table). If it exceeds 10 minutes we have to
  change the product or change the promise.

---

## 5. Key interactions

### 5.1 The rate lookup, everywhere

`Ctrl/⌘ + K` opens a lookup palette from any screen. Type a county, a craft, or a WD number. The
result is a `.wl-prov` block with a **"use this rate"** action when a row is focused in the grid.
The estimator does this on a phone in a truck (P§10); the palette is full-screen on mobile.

### 5.2 Magic link (the highest-risk interaction in the product)

Magic links are the single biggest activation leak in a no-password product, and PLAN.md A7 fixes
the mechanism, so the UX has to carry the load:

- The **sent screen (P6) shows the exact sending address** (`no-reply@…`), the subject line to look
  for, and a "check spam" line. It also offers **"resend"** on a 30-second timer.
- The link opens a session in **the browser that requested it** where possible; when it does not
  (link opened on a phone, requested on a desktop), the app shows a **six-digit code** on P6 and
  accepts it in the original tab. Contractors read email on the phone and work on the desktop
  (P§10); this is that exact mismatch.
- Link lifetime **15 minutes**, single use. Expired links land on a screen that re-sends with one
  click and never blames the user.
- Sessions last **30 days** with "remember this computer" on by default, because a compliance tool
  that logs you out every Friday will be abandoned by Friday three.

### 5.3 Import (the interaction the incumbents fail at)

Four states, all designed: **choose file → map columns → preview → commit.**
Mapping remembers the last successful mapping per source, so week two is one click. A failed row is
never dropped silently: it appears in a "skipped rows" table with the reason and an edit affordance.
**Reference: P§4.3 — every concrete complaint about the incumbents is an import complaint.**

### 5.4 Determination change

When a modification is published for a watched determination:
in-app `.wl-alert--warn` on the project, an E7 email, and the affected classifications diffed —
old rate, new rate, effective date. The rate on already-filed weeks is **never** retroactively
changed; the archive is immutable. Future weeks pick up the new rate and say so.

---

## 6. States — every screen, every state

The generic contract, applied to all screens (I§5 P8):

| state | rule |
|---|---|
| **Empty** | Never a bare "no data". Always: what this object is, why it is empty, one primary action. `.wl-empty` (I§11.8). |
| **Loading** | Say what is loading and about what. "Reading wage determination WA20250012 Mod 7…" No skeleton shimmer — it fakes progress. Anything over 2 s shows an inline progress line and stays cancellable. |
| **Partial** | A screen that has some data and a failed piece shows both; it never blanks. "Rates loaded. Last week's hours couldn't be read — retry, or enter them." |
| **Error** | What happened → what it means for the deadline → what to do. Never "unexpected error". Errors that risk a missed filing say so explicitly. |
| **Stale** | Any rate read more than 7 days ago carries `.wl-source--stale` and the word "recheck". |
| **Success** | Quiet, timestamped, and states the consequence ("on file", "retained until…"). No celebration. |
| **Blocked** | The primary action is disabled *and labelled with the reason* on the button. |
| **Offline** | The grid keeps accepting input into local state and shows a persistent "not saved" bar; it never discards typed hours. |

Per-screen specifics that matter:

| screen | empty | loading | error | success |
|---|---|---|---|---|
| **P2 lookup** | "Pick a state and county to see rates." | "Reading determinations for Pierce County, WA…" | "SAM.gov didn't answer. Here's what we read on 2 Sep — recheck before you rely on it." *(shows the cached value with its date, never nothing)* | The `.wl-prov` block |
| **A5 dashboard** | "Nothing filed yet. Add a project — about two minutes." | Row skeleton is **not** used; the week strip renders with `—` cells | "Couldn't load your projects. Retry." | n/a |
| **A8 grid** | Pre-filled from roster at 0 hours; never truly empty | "Loading week 12…" then cells fill in one pass, not row by row | Cell-level: the cell keeps the typed value and shows a retry chip | "Saved 4:41 pm" in the toolbar |
| **A10 preview** | n/a — cannot be reached without a week | "Generating WH-347…" with the payroll number | "We couldn't render the form. Your data is safe — the week is saved." | The document, with a download and an export |
| **A11 sign** | n/a | "Filing…" | "Signature not recorded. Nothing was filed. Try again." | Timestamp + retention statement |
| **A16 billing** | "You're on the free week." | Stripe Portal redirect with an interstitial | "Stripe didn't answer. Your access is unchanged." | "Plan updated." |
| **A14 conformance** | "No conformance requests. Most classifications are already on the determination — check first." | "Building your package…" | — | "Package ready. Send it to your contracting officer." |

---

## 7. Keyboard-first data entry

The payroll grid is a **desktop, keyboard-first interface and we say so** (P§10). The person doing
this has done it a hundred times.

| key | action |
|---|---|
| `↑ ↓ ← →` | Move the focused cell |
| `Enter` | Edit the cell / commit and move down |
| `Tab` / `Shift+Tab` | Next / previous cell in the row |
| `Esc` | Revert the cell to its last saved value |
| `Ctrl/⌘ + D` | Fill down from the cell above, to the end of the column |
| `Ctrl/⌘ + →` | Fill the whole day row with the standard day (from the worker's default) |
| `0`–`9`, `.` | Start typing straight into a numeric cell, no `Enter` first |
| `Ctrl/⌘ + Enter` | Save the week |
| `Ctrl/⌘ + K` | Rate lookup palette |
| `Ctrl/⌘ + /` or `?` | Shortcut overlay |
| `S` on a focused day cell | **Split this day** into a second classification row |
| `G` then `W` / `P` / `F` | Go to week / project / flags |

Rules: paste from a spreadsheet into the grid is supported (TSV, rectangular, mapped by position
with a preview). Focus is never trapped. The focus ring is always visible and always meets 3:1
(I§6.4). Nothing that changes data is available *only* by mouse.

---

## 8. Mobile behaviour, roles, and permissions

### 8.1 By task, not by device (P§10)

| task | mobile behaviour |
|---|---|
| **Rate lookup (P2)** | Mobile-first. Full-screen palette, one-handed, large targets, results as stacked `.wl-prov` cards. |
| **Dashboard (A5)** | Full function. Week strip wraps; stats become a 2×2. |
| **Grid (A8)** | **Read-first on phones.** The week renders as one card per worker with a day list, tap to expand, and per-cell editing. The 15-column table is available by rotating or by "open full grid", which scrolls horizontally inside its own container — **the page body never scrolls horizontally** (I§8.2). We do not pretend a 9-column form is a phone-native experience; we make it legible and editable rather than "responsive". |
| **Flags (A9)** | Full function. It is a list. |
| **Preview (A10)** | Pinch-zoom on the document; the toolbar collapses to an overflow menu. |
| **Sign (A11)** | **Mobile-first.** The owner signs from a truck. Certifications, name field, checkbox, one button. |
| **Billing / settings** | Full function, single column. |

Below 780px the rail becomes a horizontal scroller (`design-system.css`). Every interactive element
keeps a ≥44×44px hit area regardless of visual size.

### 8.2 Roles

| role | can | cannot |
|---|---|---|
| **Signer** (owner) | everything, including A11 | — |
| **Preparer** (office manager, payroll clerk) | everything except sign | complete the Statement of Compliance |
| **Viewer** (CPA, GC contact) | read, export | edit, sign |

One company, unlimited users at every tier — because the alternative is password sharing, which is
worse for a product holding wage data.

### 8.3 Data minimisation, made visible

The identifying number field is **four digits wide and labelled "last four only"**, and the help
text says why: 29 CFR 5.5(a)(3)(ii)(B) requires that full SSNs and addresses are *not* on weekly
transmittals. Being structurally unable to hold the full number is the answer to objection O7
(P§8) and it is shown, not claimed.

---

## 9. Notifications and email touchpoints

Sent through Resend on the TheVillage domain (PLAN.md P6). Every email: plain, short, one action,
a real reply-to that a human reads (PLAN.md A6), an unsubscribe for anything non-transactional, and
a CAN-SPAM-compliant footer on outbound marketing (PLAN.md D4).

| id | trigger | subject (draft) | primary action | timing |
|---|---|---|---|---|
| **E1** | Sign-in requested | `Your CraftWage sign-in link` | Sign in | instant |
| **E2** | First WH-347 generated | `Your WH-347 for week ending 29 Aug` | Open the report | instant |
| **E3** | Week is ready to review | `Week ending 29 Aug is ready — 2 flags` | Review the week | **Thu 16:00 local** |
| **E4** | Week not filed | `Week ending 29 Aug isn't filed yet` | Open the week | Mon 09:00 local, once |
| **E5** | Prime rejected a submission | `Northgate rejected week 4 — here's what they flagged` | Fix and resubmit | on webhook / manual mark |
| **E6** | Blocking flag unresolved >48h | `1 flag is blocking week 12` | Review flags | 48 h after flag |
| **E7** | Watched determination modified | `Modification 8 changes 2 classifications on your project` | See what changed | within 24 h of ingestion |
| **E8** | Free week used | `Your first WH-347 is done — here's what a month costs` | See pricing | after E2, +2 h |
| **E9** | Card failed / subscription state | `We couldn't take payment — your reports are still here` | Update card | Stripe webhook |

**Timing rationale.** E3 lands **Thursday at 16:00**, not Friday, because the payroll run happens
Thursday and the report is due after it (P§3). E4 lands Monday morning, once, and never again —
this buyer resents nagging more than they resent forgetting.

**In-app notifications** are a single bell with a list; nothing auto-dismisses; nothing interrupts
the grid. Browser push is not used.

---

## 10. Accessibility

Inherited from `IDENTITY.md` §10 and enforced here as UX behaviour:

1. **The grid is a real `<table>`** with `<caption>`, `<th scope="col">` for days and
   `<th scope="row">` for workers. Screen-reader users get the row/column relationship the form
   itself depends on.
2. **Every field has a persistent visible `<label>`.** No placeholder-as-label anywhere.
3. **Errors** are `aria-live="polite"`, tied to their field with `aria-describedby`, and always
   carry text — never colour alone.
4. **Focus** is visible everywhere at ≥3:1 (two-tone ring, I§6.4), never removed, never trapped
   outside a modal, and returned to the trigger when a modal closes.
5. **Targets ≥44×44px**, including grid cell controls.
6. **200% text zoom** keeps every function; the grid scrolls inside its container.
7. **`prefers-reduced-motion`** removes all transitions and transforms.
8. **Both themes are certified** (I§6.4); the document preview stays white in dark mode by design.
9. **The rendered WH-347 is accessible HTML first, PDF second.**
10. **Keyboard shortcut overlay** (`?`) is itself keyboard-reachable and screen-reader readable.
11. Language is plain and the reading level is deliberately low; the regulation is quoted, then
    translated, never left as the only explanation.

---

## 11. Billing, settings, help

### Billing (A16)

- Stripe Checkout for the first payment, Stripe Portal for everything after (PLAN.md D2).
- The plan is stated in the buyer's units — **projects and weeks**, not "seats" or "credits".
- **Cancel is in the Portal and is also linked from Settings in plain text**, because "cancel any
  time, and take your data" is a trust signal for a market where ~60% of SMBs regret a software
  purchase within 18 months (P§5.2).
- Invoices carry a PO-number field, because the $299 GC tier is expensed (P§5.5).
- Downgrade and cancellation **never delete filed reports**: the archive stays readable and
  exportable, because the retention obligation is three years and it is the customer's obligation,
  not ours to end.

### Settings (A17)

Company · Users and roles · Notification timing (including the E3 send hour and time zone) ·
Payroll import mappings · Theme (system / light / dark) · Data export (A19) · Delete account, with
an explicit warning about the three-year retention duty and a forced export first.

### Help (A18)

- Searchable, short articles, each one anchored to a task the buyer actually has: *"My prime
  rejected the payroll"*, *"The classification isn't on the determination"*, *"I pay monthly — can
  I still do certified payroll?"* (a real, public buyer question — P§1.4), *"What is cash in lieu
  of fringe benefits?"*, *"The determination changed mid-project."*
- **Every article ends with the citation** and a link to the CFR paragraph or the DOL page.
- A first-level auto-responder plus escalation to a human mailbox (PLAN.md A6), with the response
  time stated on the page and not exceeded.
- A public changelog of determination ingestion — what was refreshed and when. It is help and it is
  proof (P§9.4).

---

## 12. What this UX deliberately does not do

| not built | why |
|---|---|
| A mobile time-tracking app | The field-time problem is real (P§7.4 error 4) but it is a different product with a different buyer, and Workyard, Busybusy and the PM tools own it. We *import* from them. |
| Running payroll | P§11: they keep QuickBooks/Foundation/Sage/ADP. A payroll engine invites a comparison we lose. |
| Filing on the customer's behalf | The agency relationship and the legally valid electronic signature are theirs (29 CFR 5.5(a)(3)(ii)(A), (E)). |
| Filing the SF-1444 | The contracting officer files it. §3 A14. |
| Fringe benefit trust accounting | Enormous liability; and it is the specific thing eBacon's reviewers complain about (P§4.3). |
| An onboarding call | It is the incumbents' model and this buyer's stated objection (P§5.3). |
| Notifications by SMS | Not at launch: consent, carrier rules and cost, for a weekly cadence email already covers. |

---

## 13. Open UX questions for the founder

1. **Does the free week produce a fully filable WH-347, or a watermarked one?** Recommendation:
   **fully filable.** A watermark converts our best proof into a demo, and the buyer's deadline is
   real. The risk is one free report per company per project; the mitigation is that week two
   arrives in seven days.
2. **Do we accept "mark as filed" (honour system) or require an upload of the acceptance?**
   Recommendation: honour system at launch, because requiring proof adds friction to the step that
   completes the habit.
3. **Does the GC tier (A20) ship in v1?** It is the strongest channel into the sub tier and the
   biggest surface. Same open question as `PERSONA.md` §12 Q1.
4. **State e-filing exports (CA eCPR XML, WA, IL, NY) in v1?** Objection O1 says export formats are
   how we survive the "my GC makes me use LCPtracker" objection; PLAN.md A11 scopes launch to
   federal WH-347. The founder should break the tie.
5. **Time zone for E3/E4.** Per-company setting defaulting to the project's state — or per-user?
   Recommendation: per-company, set during A1, one field.

---

## 14. Cross-references

| this document says | proved or specified in |
|---|---|
| Every persona claim, quote and price | `PERSONA.md` §13 source ledger |
| Every colour, type, component and state style | `IDENTITY.md`, implemented in `design-system.css` |
| The grid, the pills, the provenance block, the WH-347 preview, rendered | `identity/samples.html` |
| Contrast certification | `identity/contrast.py` — 72 pairs, all pass |
| Research log, blocked sources, assumptions | `identity/CLAUDE.md` |
