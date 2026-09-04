# {{PRODUCT}} — USER EXPERIENCE (v1)

> **Name pending founder decision (PREREQUISITES P11).** Every user-visible string in this document
> is the token **`{{PRODUCT}}`**. `wagelens.com` is a live, unrelated pay-equity product
> (`IDENTITY.md` §1) and `PLAN.md` A3 says the founder decides the name; no document may pre-empt
> them by asserting one in copy. The repository slug stays `wagelens`.
> *(Applied 2026-09-03, wave-1b finding M12. `identity/samples.html` carries the same correction
> and is the Brand Director's to edit, not this document's.)*

**Product:** the county-and-craft wage lookup that files your certified payroll.
**Status:** binding for wave 1; consumed by `BACKLOG.md` and wave-2 build.
**Depends on:** `PERSONA.md` (cited as **P§n**), `IDENTITY.md` (cited as **I§n**),
`design-system.css`, `identity/samples.html`.
**Where this document and a spec disagree, the spec wins on mechanics** and this document is
amended — that is what the wave-1b iteration did in §1, §3, §4, §5.2, §6, §7, §8.2, §11 and §13.
**Author:** Buyer & Identity agent. **Date:** 2026-09-03.
**Revised:** 2026-09-03 (wave-1b iteration — findings B1, B5, B8, M1, M3, M5, M6, M7, M8, M12, M17,
m7; changelog in `REVIEW_RESPONSE.md`).
**Platform constraints inherited from `PLAN.md`:** magic-link auth, no OAuth (A7); Stripe Checkout
+ Portal (D2); Vercel + Neon (D3, D13); Vercel Cron for jobs (A12); every regulatory value carries
`source_url` / `last_verified` / `verified_by` / `confidence` and a disclaimer on every screen and
document (A10).

---

## 0. The one sentence this UX has to satisfy

> **A person who has never used us, on a Friday afternoon, with a payroll they already ran, must
> reach a filable WH-347 in about eleven minutes — and must be *warned*, loudly and every time,
> before they file something wrong.**

*(Changed 2026-09-03. **"Under ten" became "about eleven"** once Stripe Checkout was counted
honestly into §4's budget — finding M1; the step was missing from the table and the promise is
instrumented, so an unmeasurable minute is a broken promise on our own dashboard. And **"must be
stopped" became "must be warned"**: `specs/WL-05` W1 and decisions D5/D6 settle that we never block
a federal filing on our reading of the customer's legal position — finding M7, §3 A9.)*

Eleven minutes is not a slogan. It is derived: the category's own epitaph, quoted by one of its
better-liked products' reviewers, is *"Easy to use when you figure it out"* (P§4.3), and the stated
barriers to contractor software adoption include *"lack of time to implement and learn new
products"* (P§10). Everything below is budgeted against that number in §4, **and the number is
measured, not asserted** — `onboarding_started` → `wh347_generated` median is on the WL-12
dashboard from day one. If it exceeds eleven minutes we change the product or we change the
promise.

---

## 1. The end-to-end journey

```
   PUBLIC                      ACTIVATION (≤11 min)                      THE RHYTHM (weekly)
┌────────────┐   ┌──────────────────────────────────────────┐   ┌──────────────────────────────┐
│  Landing   │   │ 0  Checkout: card on file, 14-day trial   │   │  Mon–Thu   nothing from us   │
│     ↓      │   │    terms shown BEFORE the card, consent   │   │      ↓                        │
│ Free rate  │   │    recorded, $99 on day 15                │   │  Thu 4pm   "your week is     │
│  lookup    │──▶│ 1  Project: state → county → construction │──▶│            ready" email      │
│     ↓      │   │    type → wage determination pinned       │   │      ↓                        │
│  Sign up   │   │ 2  Roster: paste or add 3–20 workers,     │   │  Fri       grid → review →   │
│ (magic     │   │    each mapped to a classification        │   │            sign → file       │
│  link)     │   │ 3  Week: type the grid (or paste it)      │   │      ↓                        │
└────────────┘   │ 4  Review flags                           │   │  Day 10    "we'll charge $99 │
                 │ 5  Generate WH-347                        │   │            on {date}" email  │
                 │ 6  Sign the Statement of Compliance       │   │      ↓                        │
                 │ 7  Download / export / send               │   │  Any time  determination     │
                 └──────────────────────────────────────────┘   │            changed → alert    │
                                                                 └──────────────────────────────┘
                 The card comes FIRST and is disclosed          Billing · Settings · Help
```

**Where the paywall sits, and why. One trial design, and this is it: a 14-day trial with a card on
file, charged on day 15 — "your first two Fridays are free".**

The free rate lookup is anonymous and unlimited enough to be useful (I§2 Step 6: the lookup is the
first half of the category, so giving it away is positioning, not discounting) and it is **free
forever, with no card and no login**. Signup is required to create a *project*. **The card is
required before the first project**, at Stripe Checkout, with the trial's terms disclosed
immediately above the button and the consent recorded (`specs/WL-09` V14–V15). The trial gates the
**form**, never the **rate**. A 14-day window always contains two Fridays, so the buyer still sees a
real filable document with their own numbers in it before they are charged — which is the only proof
this market accepts (P§9.3).

> **⚠ Rewritten 2026-09-03 (wave-1b iteration, finding B1, decision D1).** This section used to
> describe a **different trial**: a cardless, unpaid **free first week**, with payment required to
> *"generate the second week's WH-347"*. Every other document described the 14-day card-on-file
> trial — `OFFER.md` §7 and §10, `BACKLOG.md` WL-09 and §4, `specs/WL-09`
> (`payment_method_collection=always`, "$99 on day 15"), `THRESHOLDS.md` §0.3 — and `BACKLOG.md`
> §4 lists **a free tier under "Never"**, arguing 4–6% against 25–35% conversion. Three documents
> to one, and the money path, the Stripe metadata and every threshold band were already built on
> the other design.
>
> **It also reduces liability, which is the tie-breaker that matters:** a cardless free week hands
> a **signed federal document** to an entirely unverified stranger, and it means the product's own
> paywall lands *after* the artefact it is trying to be paid for.
>
> The offer's framing — *"your first two Fridays are free"* — is kept, because it is true of this
> design and it is the wording that ships. The smaller contradiction inside the same finding is
> settled the same way: **two Fridays, not one week.**
>
> *(An unsourced statistic was also removed from this paragraph — "62% of buyers say the product
> trial is their top factor in the final purchase decision", attributed to P§13 S27, which contains
> no such figure. Finding m7. The claim is not needed: the trial design is argued from the
> card-on-file conversion benchmarks in `specs/WL-09`, which are sourced and were checked.)*

---

## 2. Screen list

`(A)` = in the app, `(P)` = public/marketing, `(E)` = email. Every screen's states are in §6.

| # | screen | who | purpose |
|---|---|---|---|
| **P1** | Landing `/` | all | One problem, one promise, the lookup embedded above the fold |
| **P2** | Rate lookup `/rates` | P3 estimator, anonymous | The free tier. County + craft → rate + provenance |
| **P3** | Determination viewer `/rates/[wd]` | anonymous | A whole determination, readable, with modification history |
| **P4** | Pricing `/pricing` | P1 owner | Published price. No "contact us" under $299 |
| **P5** | Sign in / Sign up **`/login` and `/signup`** | all | One email field. Magic link only. *(Routes settled to the spec's, M6)* |
| **P6** | Magic link sent **`/check-email`** | all | The most-abandoned screen in any magic-link product; §5.2 |
| **P8** | **Checkout `/billing/start`** | P1 owner | **The trial's terms, then the card.** The disclosure block, the required consent checkbox, `Start 14-day trial` → Stripe Checkout. *(Added, B9 + M1 — it was missing from this list and from §4's budget)* |
| **P9** | **Watch confirm / manage / unsubscribe `/watch/*`** | anonymous | The consented determination watch: confirm from the emailed link, manage the ≤3, one-click unsubscribe. *(Added, B5 — `specs/WL-14`)* |
| **P7** | Legal `/terms`, `/privacy`, `/dpa` | P1, P5 | Required; also a trust signal (P§9.7) |
| **A1** | Onboarding: company | new | Legal name, address, contractor/subcontractor. 30 s |
| **A2** | Onboarding: first project | new | State → county → construction type → determination. 3 min |
| **A3** | Onboarding: roster | new | **Paste** or add workers, map classifications. 3 min |
| **A4** | Onboarding: first week | new | Type the grid, or paste a rectangular block into it. 2 min |
| **A5** | Dashboard `/` | P2 office manager | Which weeks are filed, which are not, what is flagged |
| **A6** | Project list `/projects` | P2, P5 | All projects, status, determination staleness |
| **A7** | Project detail `/projects/[id]` | P2 | Tabs: This week · Workers · Submissions · Determination |
| **A8** | **The payroll grid** `/projects/[id]/weeks/[wk]` | P2, P4 | The centre of the product (I§11.3) |
| **A9** | Flag review `/projects/[id]/weeks/[wk]/flags` | P2 | Everything blocking the file, in one list |
| **A10** | WH-347 preview `/projects/[id]/weeks/[wk]/wh347` | P2, P1 | The document (I§11.6) |
| **A11** | Sign & file | P1 owner | Statement of Compliance (I§11.8) |
| **A12** | Submissions `/projects/[id]/submissions` | P2 | History, **submission status** (`not sent · sent · accepted · rejected` — **set by you, honour system, no portal integration**), re-download, the 3-year archive. *(Specified 2026-09-03, finding M8: `specs/WL-07` now owns `submission_status`, `submitted_at`, `submission_recipient` and `submission_status_note`, and marking one `rejected` fires E5. It changes no payroll line and no document hash.)* |
| **A13** | Workers `/workers` | P2 | Roster across projects, classifications, apprentice ratios |
| **A14** | Conformance helper `/projects/[id]/conformance/[id]` | P2, P3 | Package for the contracting officer + 30-day tracker |
| **A15** | Determination watch `/projects/[id]/determination` | P2, P3 | Current mod, diff vs the mod you priced, alert settings |
| **A16** | Billing `/settings/billing` | P1 | Plan, status, **the next charge as an amount and a date**, invoices, card, cancel. Stripe Portal |
| **A17** | Settings `/settings` | P1, P2 | Company, users, notifications, export, theme, delete |
| **A18** | Help `/help` | all | Searchable; every article links the CFR paragraph |
| **A19** | Audit export `/settings/export` | P1 | One archive: every report, rate and source with dates |
| **A20** | GC roll-up `/subs` | P5 | Per-sub, per-week status; chase without email. **Not in the MVP** — this is `WL-24`, a Should, and the tier is published as "Coming" with a waitlist and no purchase path until it ships *(finding B2)*. The screen is designed here so WL-24 is additive, not invented in a hurry. |
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
- **The modification control.** Beside the modification number: `My contract locked an earlier one ▾`.
  Choosing an earlier modification **re-renders the whole table at it**, with the permanent line
  *"a newer modification (n) was published on {date}"*. This is the public half of the product's
  only unheld ground, and it is buildable as of the wave-1b iteration: `specs/WL-13` ingests
  `/history` and superseded revisions on demand (finding B4) and `specs/WL-02` pins them (B3).
- One secondary action, **below the full classification table, never above it and never as a gate**:
  **"Watch this determination"** → an **unticked** consent checkbox naming the determination → email
  → a confirmation link. Up to **3 per address**, one-click unsubscribe in every message, CAN-SPAM
  footer with the postal address. This is the top-of-funnel for the estimator persona (P§1.3) and
  needs no account. **Mechanics: `specs/WL-14`.**
  > *(Specified 2026-09-03, wave-1b finding B5.* This promise appeared here, in `OFFER.md` §6.1/B3
  > and on the landing page, and **no spec owned it** — no consent record, no unsubscribe design, no
  > CAN-SPAM footer and no privacy copy, for an email address collected on a public page. It now has
  > a Must spec at effort S. The alternative was deleting the promise from all three documents; the
  > spec won because this is the only email list the product builds organically, and a consented
  > list is an asset where an unconsented one is a liability.)*
- Deep-linkable and indexable: `/rates/wa/pierce/building/electrician`. The buyer's search terms
  are in P§6 and they are the URL.
- **Disclaimer, dated, on every result** (PLAN.md A10).
- **When several determinations match** — one lookup in eight, KB F3 — the candidate list renders
  instead, with the county list as the discriminator and **nothing preselected**. The public surface
  is never more confident than the product (`specs/WL-00` V4).

### A2 — First project (the screen the eleven minutes lives or dies on)

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

- **Paste a list** — the 3-minute path for a 15-to-50-person crew. A textarea, one worker per line,
  `last name, first name, MI, last 4`, separated by tabs, commas or spaces; then a **preview** in
  which every parsed row is editable and **every skipped row is listed with its reason**; then one
  button that writes them in a single transaction. **It must never fail silently** — that is the
  incumbents' most-quoted defect: *"I often get errors uploading a file into their system"*, *"It is
  not bringing all wages over when uploading"* (P§4.3). Spec: `specs/WL-04`.
- **Add manually** — name, identifying number (**last four digits only**, because 29 CFR
  5.5(a)(3)(ii)(B) forbids full SSNs on weekly transmittals), classification, apprentice status and
  period, default base/fringe from the determination.

> **Changed 2026-09-03 (wave-1b iteration, finding M2).** This screen used to offer a **CSV import
> with column mapping** from QuickBooks, Foundation, Sage and ADP. That importer is **`WL-15`, a
> Should with a trigger** — `BACKLOG.md`'s argument is that Rosa's hours come off paper time cards,
> and the 12-person sub does not have the problem a CSV importer solves. The MVP therefore does not
> build it, `OFFER.md`'s bonus B6 ("Bring Your Own History") that sold it is deleted, and bonus B1
> is reworded to what actually ships. **Paste closes the gap in this screen's 3-minute budget**: no
> file, no encoding, no column-mapping memory, no format per payroll provider, and it cannot fail
> silently. A pasted row containing a full SSN is **skipped with the federal-rule explanation**,
> never truncated to its last four.

**Nothing here is auto-classified.** Paste and manual entry both leave classification as a per-worker
decision, because it is the customer's legal judgement and not ours (G4, `BACKLOG.md` "Never").
Unmapped workers land on the crew banner and block certification until a human maps them.

Classification uses `.wl-field--classification` (I§11.2): it searches *only the classifications on
this project's determination*, shows the rate beside each, and offers **"not listed → check
conformance"** as the last option rather than accepting free text.

### A8 — The payroll grid

Rendered in `identity/samples.html` §5. Behaviour:

- Opens **pre-filled** from last week's shape
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

**The rule that decides this table: we block what makes the *form* invalid. We never block what is
the contractor's legal judgement.**

| flag | example | blocking? |
|---|---|---|
| `classification-not-on-wd` | "DRIVER — GROUP 1 is not on WA20250012 Mod 7" | **Yes** — column (3) cannot be filled (WL-05 B1/B2) |
| `fringe-missing` | "No fringe recorded; 4(a)/4(b) cannot be answered" | **Yes** — page 2 cannot be completed (WL-05 B9) |
| `deductions-do-not-reconcile` | "8d ≠ 8a + 8b + 8c" | **Yes** — the form's own arithmetic (WL-05 B5/B6/B7) |
| `certifying-official-missing` | "Name, title, phone and email are required to sign" | **Yes** (WL-05 B12) |
| **`rate-below-determination`** | "$51.00 base is below $54.12 for ELECTRICIAN" | **Warn, loudly, every time — and the acknowledgement is recorded.** *(Changed: was blocking)* |
| `apprentice-ratio` | "3 apprentices to 1 journeyworker exceeds the program ratio" | Warn |
| `ot-premium-on-fringe` | "Overtime appears to include the fringe in the premium" | Warn |
| `hours-on-non-covered-day` | "8 hours on Sunday 23 Aug — confirm this is the covered project" | Warn |
| **`determination-moved`** | "Mod 8 published 1 Sep; 2 classifications changed" | **Warn. Never blocks, at any age.** *(Changed: used to escalate to blocking after 7 days)* |
| `week-gap` | "No payroll for week 9. File a no-work payroll or explain the gap." | Warn |

> **⚠ Changed 2026-09-03 (wave-1b iteration, finding M7, decisions D5 and D6).** This table used to
> make `rate-below-determination` **blocking** and to escalate `determination-moved` to blocking
> after seven days. `specs/WL-05` W1 argues the opposite, explicitly and at length, and **it wins on
> liability grounds**:
>
> - A rate can be **lawfully** below the determination's headline — an approved conformance, an
>   apprentice percentage, or a different modification governing the contract (which is now a
>   first-class, supported case; finding B3). Blocking it makes us **the adjudicator of a legal
>   judgement that is the contractor's**, which contradicts `OFFER.md` §5.2 G4 ("we will not tell
>   you which classification a worker belongs in"), the `KNOWLEDGE_BASE.md` §9.3 disclaimer and
>   `PLAN.md` A10's whole posture.
> - **Blocking a below-determination rate can stop a statutory weekly filing.** `specs/WL-09` V11
>   states the principle for billing — nothing we do may stop a federal filing deadline — and it
>   applies at least as strongly here. A missed certified payroll is a withheld progress payment.
> - `determination-moved` never blocks for the same reason, plus a second: `specs/WL-08` never
>   blocks, and a banner on every draft payroll is already specified and is the whole remedy. A
>   project deliberately sitting on the modification its contract locked is **correct**, not late.
>
> **What replaces blocking:** the warning is loud, it shows **both numbers side by side**, it
> persists, and the acknowledgement is recorded (`payroll_warning_acknowledged {rule_id}`,
> `payroll_below_determination_rate_warned {delta_cents}`). Showing it every time is the right
> amount of help; refusing to file is not help at all.

**Blocking flags disable the primary action and say why on the button itself** —
*"Generate WH-347 · 1 flag to clear"* — never a silent disabled button. **Warnings never disable
anything**; they are acknowledged, and the acknowledgement is part of the record.

### A10 / A11 — Preview, then sign

The preview is the form (I§11.6). Signing is a separate, deliberate step:

- The three certifications are shown in full, in plain English, with the CFR citation.
- A typed full name, a checkbox confirming the signer pays or supervises payment, and the date.
- The 18 U.S.C. 1001 notice, verbatim in substance: *a fine, imprisonment of not more than five
  years, or both.*
- **The certifying official's name, title, phone and email are typed at certification** and are
  required (`specs/WL-05` B12); `certified_by_user_id` records which login did it. **At launch there
  is one login per organisation**, so there is no role gate — the office manager prepares and the
  owner signs by putting his name in that field, which is what the form itself asks for.
  §8.2's three-role table is the **post-WL-37** design and is labelled as such.
  > *(Changed 2026-09-03, finding M3, decision D13. This screen used to say "only the owner or a
  > user with the **Signer** role can complete it", while `specs/WL-01`'s schema has one org-level
  > `role` with `member` "unused until WL-37" and `specs/WL-10` says "one login per organisation for
  > now". **A half-implemented permission model on a product holding wage data is worse than an
  > honest single login**, and the certifying-official fields already capture who signed. The seam
  > WL-05 already has is kept, so WL-37 is additive.)*
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

## 4. Onboarding in about eleven minutes — the budget

| step | budget | how it is bought |
|---|---:|---|
| P5 → P6 → inbox → app (magic link) | **60 s** | One field. The link opens the app already at A1; it never lands on a generic dashboard. Or the six-digit code, in the tab already open (§5.2). |
| A1 company | **30 s** | Three fields; address is a single line, parsed later. |
| **P8 Checkout — read the terms, tick the box, enter the card** | **90 s** | **The step this table used to omit.** Hosted Stripe Checkout; the disclosure block and the consent checkbox render before it. Card entry is the slowest thing on this list and pretending otherwise makes the promise a lie. |
| A2 first project | **3 min** | State/county/type are three selects. The determination is *found*, not typed — and if the contract names an older modification, that is typed once and pinned (B3). |
| A3 roster | **3 min** | **Paste the crew from a spreadsheet** with a preview; or 3–20 manual rows at ~10 s each with classification autofill from the determination. |
| A4 first week | **2 min** | The grid pre-filled with the roster at zero hours, `Ctrl+D` fill-down, `Ctrl+→` fill-week, and rectangular paste from a spreadsheet. |
| A5 flags → A10 preview | **60 s** | Most first weeks have 0–2 flags; each has a one-click fix. |
| **total** | **≈11 min** | |

> **⚠ Changed 2026-09-03 (wave-1b iteration, finding M1).** The old table budgeted **≈9.5 minutes
> and had no card step**, while `specs/WL-09` puts Stripe Checkout between signup and the product
> and leaves a cancelled Checkout with a **read-only** account — no project, no roster, no form. The
> eleven-minute promise is **instrumented** (`onboarding_started` → `wh347_generated` median, §4's own
> rule), so an unmeasurable minute is a broken promise **on our own dashboard**, which is the worst
> place to break one.
>
> **Two honest options: cut 90 seconds elsewhere, or restate the number. The number is restated.**
> Nothing else in the table is padded — the 3 minutes for the project is the F3 candidate screen
> doing real work, and the 3 minutes for the roster is a 15-person crew. **"About eleven minutes"
> is still, by a wide margin, the fastest path to a filed WH-347 in this category**, against a
> DOL burden estimate of 55 minutes for the form alone. **§0's sentence now says eleven**, and it
> goes back to ten only if the measured median gets there.
> *(The A4 line also drops "Payroll CSV import" — see A3 and finding M2; hours are typed or pasted,
> and the file importer is WL-15, Should.)*

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
- **The eleven-minute claim is instrumented.** `onboarding_started` → `wh347_generated` median is a
  tracked metric from day one (PLAN.md A14 events table). If it exceeds 11 minutes we have to
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

- The **sent screen (P6, `/check-email`) shows the exact sending address** (`no-reply@…`), the
  subject line to look for, and a "check spam" line. It also offers **"resend"** on a **60-second**
  timer.
- The link opens a session in **the browser that requested it** where possible; when it does not
  (link opened on a phone, requested on a desktop), the email also carries a **six-digit code**,
  and P6 accepts it in the original tab. Contractors read email on the phone and work on the desktop
  (P§10); this is that exact mismatch. **This is a named MVP requirement** — one column and one
  input (`specs/WL-01` V2a).
- Link lifetime **20 minutes**, single use — and **the link consumes on a POST, not a GET**: the
  landing screen renders a "Sign in" button. That costs one click and defeats Outlook Safe Links
  and corporate link scanners, which are the more common failure than a stale link. Expired links
  land on a screen that re-sends with one click and never blames the user.
- Routes are **`/signup`** and **`/login`**.
- Sessions last **30 days** with "remember this computer" on by default, because a compliance tool
  that logs you out every Friday will be abandoned by Friday three.

> **Settled 2026-09-03 (wave-1b iteration, finding M6).** This section and `specs/WL-01` disagreed
> on four values. The spec's three won — **20 minutes** (15 is tight for someone who will be
> interrupted, which §4's own rules assume), **60-second resend**, and **the two-step GET→POST
> verify** — and the routes settled to `/signup` and `/login` (`/signin` appeared nowhere else).
> **This document's fourth value won:** the six-digit cross-device code is adopted into the spec as
> an MVP requirement, because the argument for it is evidence-backed (P§10) and the cost is one
> column and one input. One design, in one place: `specs/WL-01`.

### 5.3 Paste (the interaction the incumbents fail at, done the cheap way)

Three states, all designed: **paste → preview → commit.** A failed row is never dropped silently: it
appears in a "skipped rows" table with the reason and an edit affordance, and **nothing is written
until the preview is confirmed.**
**Reference: P§4.3 — every concrete complaint about the incumbents is an import complaint.** The
conclusion we draw from that is not "build a better importer"; it is **"do not make them upload a
file at all"** until a measured trigger says otherwise.

*(Changed 2026-09-03, finding M2. The MVP ships **paste**, in the crew screen and in the hours grid;
the **file importer is `WL-15`, a Should with a trigger**, and `OFFER.md`'s bonus B6 that sold it is
deleted. The four-state file flow — choose file → map columns → preview → commit — and the
remembered per-source mapping are **WL-15's design and are kept here for it**, not the MVP's.)*

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
| **A16 billing** | *n/a — an account always has a subscription row.* Trialing reads **"Trial — $99 will be charged on 17 Sep. Cancel →"**, with the amount, the date and the cancel link always together *(B1, B9)* | Stripe Portal redirect with an interstitial | "Stripe didn't answer. Your access is unchanged." | "Plan updated." |
| **P8 checkout** | n/a | "Opening secure checkout…" | "We couldn't start checkout." + retry; **nothing was charged** | Returns to `/billing/return`, which polls and **never grants access on the redirect alone** |
| **P9 watch** | "You're watching nothing yet." | — | "That link has expired or has already been used." + one-click re-send | "You're watching TX20260253." + the other determinations on this address |
| **A14 conformance** | "No conformance requests. Most classifications are already on the determination — check first." | "Building your package…" | — | "Package ready. Send it to your contracting officer." |

---

## 7. Keyboard-first data entry

The payroll grid is a **desktop, keyboard-first interface and we say so** (P§10). The person doing
this has done it a hundred times.

> **⚠ The keyboard map lives in [`specs/WL-05`](specs/WL-05-weekly-hours-entry.md) § "Keyboard
> model", and this section does not restate it.** *(Changed 2026-09-03, wave-1b iteration, finding
> M5.)* There were **two different maps** for the same screen — the one this document carried and
> the one the spec carried — disagreeing on what `Ctrl/⌘+D` fills (one cell, or to the end of the
> column), what `Ctrl/⌘+→` fills (the rest of the workweek, or a whole day row), and how the week
> saves. The build reads the spec, so **the spec is the map**, and a second copy of it here is a
> second thing to drift.
>
> **What was settled, and in whose favour:** WL-05's semantics survive, because they are the ones
> with test cases attached — `Ctrl/⌘+D` copies **the cell above**, `Ctrl/⌘+→` fills **the rest of
> the workweek**, `Ctrl/⌘+S` saves. **Two of this document's shortcuts were better and cheap, and
> WL-05 adopted them:** `Esc` reverts a cell to its last saved value, and **`S` splits a day** into
> a second classification row — which matters because the wrong single row must be harder than the
> right two (P§7.4 error 2). `hours_keyboard_shortcut_used {shortcut}` now enumerates exactly the
> spec's final set, and a test asserts the enumeration matches the table.

**The UX requirements this section still owns, because they are experience rules rather than key
bindings, and they hold whatever the map says:**

- **Paste from a spreadsheet into the grid is supported** — TSV, rectangular, mapped by position,
  **with a preview before it commits.**
- **Focus is never trapped.** The focus ring is always visible and always meets 3:1 (I§6.4).
- **Nothing that changes data is available *only* by mouse.** Every action in the spec's table has a
  key, and the shortcut overlay (`?`) is itself keyboard-reachable and screen-reader readable.
- **A dropped connection never loses typed hours** (§6 "Offline").

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

### 8.2 Roles — **the WL-37 design. Not the MVP.**

> **⚠ Relabelled 2026-09-03 (wave-1b iteration, finding M3, decision D13).** **At launch there is
> one login per organisation.** `specs/WL-01`'s schema has a single org-level `role` whose `member`
> value is explicitly *"unused until WL-37"*; `specs/WL-10`'s Account panel says *"one login per
> organisation for now"* rather than showing a disabled invite button; and `WL-37` (Later) is where
> multiple users, roles and permissions arrive — the moment `WL-24` ships, and not before.
>
> **A half-implemented permission model on a product holding wage data is worse than an honest
> single login.** The table below is what ships **with WL-37**, and it is kept here so WL-37 is a
> design that already exists rather than one invented in a hurry. **Nothing in the MVP reads it.**

| role *(WL-37)* | can | cannot |
|---|---|---|
| **Signer** (owner) | everything, including A11 | — |
| **Preparer** (office manager, payroll clerk) | everything except sign | complete the Statement of Compliance |
| **Viewer** (CPA, GC contact) | read, export | edit, sign |

One company, unlimited users at every tier — because the alternative is password sharing, which is
worse for a product holding wage data. **Until WL-37, the MVP's answer to "who signed?" is the
certifying official's typed name, title, phone and email** (`specs/WL-05` B12) plus
`payrolls.certified_by_user_id` — which is the seam WL-37 grows from, and which is what the form
itself asks for. §3 A11 states the MVP behaviour.

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

| id | trigger | subject (draft) | primary action | timing | kind |
|---|---|---|---|---|---|
| **E1** | Sign-in requested | `Your {{PRODUCT}} sign-in link` **— and the six-digit code in the body** (§5.2) | Sign in | instant | transactional |
| **E2** | First WH-347 generated | `Your WH-347 for week ending 29 Aug` | Open the report | instant | transactional |
| **E3** | Week is ready to review | `Week ending 29 Aug is ready — 2 flags` | Review the week | **Thu 16:00 local** | transactional |
| **E4** | Week not filed | `Week ending 29 Aug isn't filed yet` | Open the week | Mon 09:00 local, once | transactional |
| **E5** | **The user marks a payroll `rejected`** | `Northgate rejected week 4 — here's what they flagged` | Fix and resubmit | on the manual mark *(no webhook — see §2 A12 and `specs/WL-07`)* | transactional |
| **E6** | Blocking flag unresolved >48h | `1 flag is blocking week 12` | Review flags | 48 h after flag | transactional |
| **E7** | Watched determination modified — **a project's pin** | `Modification 8 changes 2 classifications on your project` | See what changed | within 24 h of ingestion | transactional (`specs/WL-08`; unsubscribe turns off change alerts only) |
| **E8** | **Day 10 of the trial — four days before the first charge** | `Two WH-347s done. $99 on 17 Sep, or cancel in two clicks` | See what's been produced / cancel | **day 10, always** | **transactional and non-suppressible** *(B9, `specs/WL-09` V16)* |
| **E9** | Card failed / subscription state | `We couldn't take payment — your reports are still here` | Update card | Stripe webhook | transactional |
| **E10** | **Annual renewal approaching** | `Your annual plan renews on 3 Sep — $990` | Manage the plan | **≥ 7 days before every renewal** | **transactional and non-suppressible** *(B9)* |
| **E-W1** | **A public watch is requested** | `Confirm alerts for TX20260253` | Confirm | instant | **marketing — double opt-in, `specs/WL-14`** |
| **E-W2** | A **watched** determination is modified | `Modification 2 changes 3 classifications on TX20260253` | See what changed | within 24 h of ingestion | **marketing — one-click unsubscribe + `List-Unsubscribe` + postal address** |

> **Changed 2026-09-03 (wave-1b iteration).** **E1's subject asserted a product name** ("CraftWage")
> while the naming decision is still the founder's — now `{{PRODUCT}}` (finding M12). **E8 was "free
> week used"**, a leftover from the trial design B1 replaced; it is now the day-10 pre-charge notice
> the negative-option disclosure requires, and **E10 is new** for annual renewals (finding B9).
> **E5's trigger loses its phantom webhook**: nothing integrates with a GC portal, so the four-state
> submission status is set by the user and E5 fires from that (finding M8). **E-W1 and E-W2 are
> new** and are the only *marketing* email in this table — they carry the consent, the unsubscribe
> and the postal address that finding B5's spec requires.
>
> **The line that matters: an unsubscribe never turns off a transactional email.** Someone who
> unsubscribes from E-W2 still gets E1, E8, E9 and E10. `specs/WL-14` V7 makes `transactional` an
> impossible value for a suppression scope.

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
- **Before the card, the trial's terms.** `/billing/start` renders, adjacent to and above the
  button, in the surrounding type size: the trial length, **the exact amount and the exact date of
  the first charge**, that it renews monthly until cancelled, how to cancel in one sentence with
  the link, and that a reminder arrives four days beforehand. An **unticked** checkbox — "I've read
  the trial terms above" — gates Checkout, and the acceptance is recorded with the content hash of
  the block as shown. **The button reads `Start 14-day trial`, never "Start free".**
  *(Added 2026-09-03, finding B9; `specs/WL-09` V14–V16b own the mechanics. A free trial that
  converts to a recurring charge is a negative-option offer, and nothing in the wave-1 documents
  required the disclosure, the consent record or the renewal notice.)*
- The plan is stated in the buyer's units — **projects and weeks**, not "seats" or "credits". While
  trialing, `/settings/billing` states the **next charge as an amount and a date**, never "renews
  monthly".
- **Cancel is in the Portal and is also linked from Settings in plain text** — and from the trial
  banner, the disclosure block and every trial and renewal email — because "cancel any time, and
  take your data" is a trust signal for a market where ~60% of SMBs regret a software purchase
  within 18 months (P§5.2), and because **cancelling must be at least as easy as subscribing.**
- Invoices carry a PO-number field, because the GC tier will be expensed when it ships (P§5.5).
- **The GC tier is shown on the pricing page as "Coming", with a waitlist and no purchase control**
  — there is no Checkout path to it until `WL-24` ships *(finding B2)*.
- Downgrade and cancellation **never delete filed reports** — and **the archive stays readable and
  exportable for 30 days after you leave**, which is what G3 promises in writing, what
  `specs/WL-09` V6 implements (`read_only_until`) and what the cancel flow says out loud. **The
  cancel flow offers a forced export first** (the same pattern WL-10 uses for account deletion) and
  states the customer's own duty: *"Your certified payrolls must be kept for three years after the
  prime contract completes. That obligation is yours — take your archive with you."*
  > *(Changed 2026-09-03, finding M17, decision D9. This bullet used to promise the archive stayed
  > readable and exportable with **no limit**, while `specs/WL-09` V6, `specs/WL-07` and
  > `OFFER.md` G3 all say **30 days**. Three documents to one, and the 30 days is what the customer
  > is promised **in writing** and what the schema implements. Letting the app imply indefinite
  > free storage of federal records is an unpriced obligation with a three-year tail.)*

**The guarantees, worded exactly as `OFFER.md` §5.2 words them.** They appear in the product on the
cancel flow and the billing screen, and they must read identically here, on the landing page and in
the offer — **including the cap**:

- **G1, the Friday Guarantee:** *"Enter your hours by Friday and your WH-347 and Statement of
  Compliance are ready the same day. If they are not, that month is free."*
- **G3, the Exit Guarantee:** *"Cancel inside the product in two clicks. No call, no email, no
  retention offer. Your archive stays downloadable for 30 days after you leave."*
- **G2, the Provenance Guarantee — does not ship until the founder and a lawyer have signed it**
  (`OFFER.md` §11.3 Q1–Q2). When it does, it reads, **word for word as `OFFER.md` §5.2 words it**,
  with the cap in the same sentence: *"Every rate we show carries the determination number,
  modification, effective date and a link to the source. If a rate we show you does not match the
  determination we cite, tell us: we refund every month you have paid since that rate appeared in
  your account, **up to three**, and we re-issue every corrected WH-347 free."* The **short form**,
  for a surface that cannot carry the long one, is also `OFFER.md`'s and also carries the cap:
  *"If a rate does not match the determination we cite, we refund the months you paid since that
  rate appeared, **up to three**, and re-issue the corrected forms free."*
  > *(Added 2026-09-03, finding B8. The landing page carried a short form that dropped the cap
  > entirely — "we refund what you have paid" — turning a bounded refund into an unbounded promise.
  > **The cap is three months, service-shaped**: ≈$59,400 rather than ≈$237,600 in the correlated
  > worst case at 200 accounts, and it keeps the customer instead of buying an exit. **No refund
  > sentence appears on any surface without its cap in the same sentence.** If the founder
  > overrides to twelve months, the number changes here, in `OFFER.md` §5.2 and in
  > `LANDING_SPEC.md` §5 in one edit — editing one of the three is how this happened.)*

### Settings (A17)

Company · Users and roles · Notification timing (including the E3 send hour and time zone) ·
Theme (system / light / dark) · Data export (A19) · Delete account, with
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
| A mobile time-tracking app | The field-time problem is real (P§7.4 error 4) but it is a different product with a different buyer, and Workyard, Busybusy and the PM tools own it. You paste their output in; a file importer is `WL-15`, a Should with a trigger. |
| Running payroll | P§11: they keep QuickBooks/Foundation/Sage/ADP. A payroll engine invites a comparison we lose. |
| Filing on the customer's behalf | The agency relationship and the legally valid electronic signature are theirs (29 CFR 5.5(a)(3)(ii)(A), (E)). |
| Filing the SF-1444 | The contracting officer files it. §3 A14. |
| Fringe benefit trust accounting | Enormous liability; and it is the specific thing eBacon's reviewers complain about (P§4.3). |
| An onboarding call | It is the incumbents' model and this buyer's stated objection (P§5.3). |
| Notifications by SMS | Not at launch: consent, carrier rules and cost, for a weekly cadence email already covers. |

---

## 13. Open UX questions for the founder

**Three of these were closed in the wave-1b iteration (2026-09-03) rather than left open, because
the build could not start around them. Each is recorded with what was decided and why.**

1. ~~**Does the free week produce a fully filable WH-347, or a watermarked one?**~~
   **CLOSED — the question no longer exists.** There is no free week: the trial is **14 days with a
   card on file, charged on day 15** (§1, finding B1, decision D1). The question that survives is
   *"is the **trial's** WH-347 fully filable?"*, and the answer is **yes, fully filable**. A
   watermark converts our best proof into a demo and the buyer's deadline is real; drafts are
   watermarked `DRAFT — NOT FOR SUBMISSION` (`specs/WL-06` V1) and a **certified payroll never is**.
   The risk this used to carry — an unverified stranger walking away with a signed federal document
   — is gone with the card requirement.
2. **Do we accept "mark as filed" (honour system) or require an upload of the acceptance?**
   **CLOSED — honour system**, with the four states `not_sent · sent · accepted · rejected`, a
   recipient and a note, all set by the user (`specs/WL-07`, finding M8). Requiring proof adds
   friction to the step that completes the habit, and we integrate with no portal, so there is
   nothing to verify against. The UI says so in one line: *"This is your record, not a receipt."*
3. **Does the GC tier (A20) ship in v1?** **CLOSED — no** (finding B2). `WL-24` stays a **Should**
   with its demand trigger, the $299 price stays published so the ladder is legible, and the card
   is a **waitlist with no purchase control** — there is no Checkout path to it. The founder can
   reverse this by shipping WL-24; reversing it by exposing the price first is what the review
   stopped. Same question as `PERSONA.md` §12 Q1.
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
