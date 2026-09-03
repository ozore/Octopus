# CERTLY — UX (v1)

**Author:** Buyer & Identity agent, wave 1. **Date:** 2026-09-03.
**Implements:** `PERSONA.md` (who and why) and `IDENTITY.md` (how it looks and sounds). Both are binding.
**Visual layer (arbitrated, `../IDENTITY_ARBITRATION.md`, final 2026-09-03):** **Source Sans 3**
(`--c-font-ui`) and **Source Code Pro** (`--c-font-num`) on a **cool office white ground `#E8EEF6`**
(`--c-paper`), with the interaction blue `--c-action` as the primary action, a **left nav plus split
view**, and the **seven status states** of `IDENTITY.md` §6.4 — `meets` (pill `MEETS`, "Meets
requirements") · `expiring` · `asserted_only` ("Claimed, not evidenced", half-filled disc, vertical
hatch) · `gap` · `needs_review` · `not_checked` · `no_certificate`. This document names **tokens**
(`--c-ok-*`, `--c-warn-*`, `--c-ast-*`, `--c-gap-*`, `--c-rev-*`, `--c-nc-*`, `--c-none-*`,
`--c-paper`, `--c-ink`, `--c-line`), never literal colours or family names; `design-system.css` is the
only place a value is written (`IDENTITY.md` §16.1).
**Consumed by:** `BACKLOG.md` and `specs/` (wave 1, Product Owner) and the wave-2 build.
**Scope of v1:** ACORD 25 only (`PLAN.md` A11). Auth is email magic link, no OAuth (A7). Billing is
Stripe self-serve (D2). Jobs run on a Vercel cron draining a jobs table (A12). Nothing in this document
assumes a human operator inside the product; the only humans are the customer and the vendor's agent.

**Revised 2026-09-03 after the wave-1b review.** Four things in this file were wrong and are corrected
in place, each marked where it changed: the status word (**B-02** — "Covered" is retired; the green
state is **"Meets requirements"**), the extraction review screen (**B-04** — no bounding boxes, because
the extractor does not return coordinates), the activation event (**B-05** — `activated`, not
`first_status_rendered`), and what happens at the tier limit and on a failed payment (**§2.7** —
`specs/10` is canonical and this file promised something the product will not do). Every domain is an
env value, never a literal (**B-11**), and every event name comes from
[`specs/00-event-vocabulary.md`](specs/00-event-vocabulary.md) (**B-14**).

---

## 0. The three sentences this design has to earn

1. **"Does this vendor meet my requirements?" is answered in under two seconds, from any screen,
   without opening a file** — in the buyer's own words: *"is their certificate current, and does it
   have what I asked for?"*
2. **"Set it up" is a five-minute job, not a six-to-eight-week implementation** — the incumbent's own
   published number for full-service onboarding is *"6-8 weeks"* (`sources.md` A1), and the category's
   documented complaint is *"Getting myCOI up and running with all the little nuances of our company was
   definitely difficult"* (A1/B1 in `sources.md`).
3. **Nothing we show is ever more certain than what we actually read.** Confidence is visible, "needs
   review" is normal, and a low-confidence field can never make a record green (`IDENTITY.md §9.4`).

---

## 1. The end-to-end journey

```
  landing ──▶ magic link ──▶ onboarding ──▶ vendors added ──▶ document in
                                │                                  │
                                │                          extraction + confidence
                                │                                  │
                                ▼                                  ▼
                       requirement template  ─────check────▶  status assigned
                       (from a clause, <5 min)                     │
                                                        ┌──────────┴──────────┐
                                                        ▼                     ▼
                                             meets requirements /          gap
                                             expiring / claimed
                                                        │                     │
                                                        │              gap report
                                                        ▼                     │
                                              reminder scheduled ◀────────────┘
                                                        │
                                            email to the vendor's agent
                                                        │
                                                 renewal received
                                                        │
                                            extraction → status green
                                                        │
                                              reminder series stops
```

### 1.1 Landing → signup

The landing page (specified separately in `LANDING_SPEC.md`) ends in one field: an email address. Not a
form, not a demo request, not a phone number. The entire positioning rests on *no demo, price on the page*
(`IDENTITY.md §3`), so the signup must physically prove it.

**Magic link, done properly.**

- Enter email → "Check your inbox. The link works for 15 minutes and can be used once."
- The waiting screen shows the exact sending address so it can be found in spam, plus **Resend** (disabled
  for 30 seconds, with the countdown stated in words, not a spinner).
- The link opens the app in a **new session in the same browser** and, if opened in a different browser,
  shows a 6-digit code path instead of failing — because this buyer forwards mail to a phone constantly.
- Failure states are designed: link expired (offer a new one, one tap), link already used (say so plainly,
  offer a new one), wrong browser (code path), email bounced (tell them, offer a correction).

### 1.2 Onboarding — the five-minute path

Four steps, each skippable, each individually resumable, with a persistent progress row. Target from first
screen to first status: **under five minutes** (*assumption A2 in `identity/CLAUDE.md`: this is a design
target, not a measured benchmark; wave 2 must instrument it*).

**Step 1 — Which dialect (10 seconds).**
"What do you manage?" → *Rental properties · Community associations · Construction projects · Something
else*. This one answer sets the vocabulary for the whole account: **vendor** vs **sub**, **lease /
management agreement** vs **subcontract**, **work order** vs **pay application** (`PERSONA.md §7.3`).
It is changeable later in settings and changes nothing but nouns.

**Step 2 — The requirement template (target: 3 minutes). The most important screen in the product.**

This is where the incumbents visibly fail — *"The customization of insurance requirements is a bit
lacking"* (`sources.md` B2) — so it gets the most design.

Two doors, both on one screen:

- **Door A — paste the clause.** A single large paste area: *"Paste the insurance section of your lease,
  management agreement or subcontract."* On paste we parse it into requirement rows, and **each row shows
  which words produced it**, highlighted in the pasted text (`.c-req__mark`). The customer's job is to
  confirm, not to author. Every parsed row carries a confidence and a low-confidence row is empty and
  focused rather than pre-filled with a guess.
- **Door B — start from a standard.** Three pre-built templates (`Standard vendor 1M/2M`,
  `Higher-risk trade 2M/4M`, `Tenant certificate`) shown with their contents visible, not hidden behind a
  name. Chosen in one tap, then edited.

A requirement row is: **coverage line** (general liability, auto, workers' comp, umbrella/excess,
professional) · **limit** · **basis** (each occurrence / general aggregate / combined single limit / per
project) · **endorsements required** (additional insured · waiver of subrogation · primary and
non-contributory) · **applies to** (all, or specific trades/properties/projects).

Two things the screen must say out loud, because they are true and saying them is our credibility
(`IDENTITY.md §3 Step 9`):

- *"We check what the certificate says. An endorsement is a separate document — if you need proof of one,
  we will ask the agent for it."* (`sources.md` E1)
- *"Requirements come from your lease or subcontract. We do not know what your coverage should be."*

**Step 3 — Add parties (target: 60 seconds).** Three doors: paste a list (name + email, one per line,
which is what a spreadsheet column produces), upload a CSV with a column mapper, or add one by hand.
Importing 40 rows must not require 40 interactions. Each party is assigned a requirement template on
import, defaulting to the one just created.

**Step 4 — Get the first document in (target: 60 seconds).** Three doors again, in this order of prominence:

1. **Forward what you already have.** Every account gets an inbox address (`in@{INBOUND_DOMAIN}`) and
   every party gets a per-party address. `{INBOUND_DOMAIN}` is an **env value**; no literal domain
   appears in this document or in a template (REVIEW.md B-11), and forward-by-email itself is `SH-1`,
   not MVP — at launch this door reads "coming soon" or is hidden. *"Forward the certificates sitting in your email. We will match them to vendors."*
   This is the fastest path to a real first status and it is the one this buyer will actually take, because
   the documents are already in their inbox (`PERSONA.md §2.2`).
2. **Upload** — drag, pick, or paste an image.
3. **Ask the agents** — send the first chase to everyone with no document, in one action.

**Onboarding ends the moment the first status renders.** Not on a "You're all set!" screen — on the
vendor table, with one real row in it. **The activation event is `activated`** — emitted once per org
by the comparison job, defined in `specs/11` §2, and defined nowhere else (REVIEW.md B-05).
`first_status_rendered` was a fourth name for it in an earlier draft of this file and is retired: it
was emitted by the UI, and activation is a fact about the data, not about which screens someone
visited.

Onboarding is **not** gated on a card. A new org runs on the free allowance (25 vendors, 3 documents,
`specs/10` §8.1) up to and including the first comparison; Checkout is offered at the finding screen,
where the customer has just seen a real gap. Every CTA that starts the trial reads **"Start 14-day
trial"** with *"Card required. No charge until {date}. Cancel in one click."* rendered next to it in
body text (`specs/10` §3.1, REVIEW.md B-06).

### 1.3 Steady state — the loop

Document arrives (forward, upload, or the agent's no-login link) → queued → extracted field-by-field with
confidence → checked against the party's requirement → status assigned → if not green, the gap is named in
words and a reminder is scheduled → the reminder goes to **the agent on the certificate**, cc the vendor →
renewal arrives → re-extracted → status green → **the reminder series stops immediately**.

The last clause is a designed feature, not an implementation detail. It is the direct answer to Procore,
which *"sends daily reminders starting two weeks before the expiration date and continues for up to 60
days after"* to the customer (`sources.md` D1) — up to 74 emails to the person who cannot fix it.

---

## 2. Screen list, with states

Every screen lists: **empty · loading · partial · error · dense/at-scale**, because those are the four
states that get skipped and the four that this buyer will hit in week one.

### 2.1 Marketing and account

| # | screen | states |
|---|---|---|
| S1 | Landing | (see `LANDING_SPEC.md`) |
| S2 | Pricing | default · annual/monthly toggle · currency note · a plain "what happens when I go over" row |
| S3 | Sign in / sign up (one screen, one field) | idle · sending · sent (with the sending address and a 30s resend) · bounced · rate-limited |
| S4 | Magic-link landing | valid · expired · already used · different-browser (6-digit code) · account disabled |
| S5 | Onboarding 1-4 | as §1.2; each step: empty · working · parsed-with-confidence · saved · skipped |
| S6 | Billing | trial, with the **first-charge date** stated (not a countdown), the card-required disclosure, and one-click cancel · active · **past due: fully writable for a 7-day grace period, then read-only** · **cancelled: access to the period end, then read-only with exports working forever** · invoice history. **Corrected (REVIEW.md §2.7):** this row previously said *"nothing stops; we keep reading and stop sending"*. That is wrong and `specs/10` §5 is canonical — **reading is the expensive part and it stops**. What never stops is *reading the data you already have*: the dashboard, every certificate, every report and every export stay visible and downloadable forever. What stops is **writing** (new uploads, new vendors) and **outbound reminders** |
| S7 | Settings — account, dialect, sending address, team, notification schedule defaults | |
| S8 | Help | searchable articles + one contact route; no chat widget |
| S9 | Legal — terms, privacy, the insurance disclaimer in full | |

### 2.2 The product

| # | screen | what it is | states |
|---|---|---|---|
| **S10** | **Coverage dashboard** | the home screen: portfolio strip, filters, party table sorted *soonest problem first* | **empty** (no parties → the three import doors) · **first-run** (parties, no documents → "Ask all 12 agents" as the primary action) · loading (static blocks, no shimmer) · **normal** · **at scale** (500 rows: sticky header, virtualised body, server-side sort) · filtered-to-nothing (says which filter to remove) · error (the table stays, a banner explains what is stale and as of when) |
| **S11** | **Party detail** | one vendor/sub: status band, coverage bar (12px), requirement applied, document history, contacts (vendor + agent), activity log | never-had-a-document · has-documents · gap-with-reasons · muted/inactive party |
| **S12** | **Document review** (the split view) | document pane + extraction review panel. The panel is the evidence surface: per field, the **value**, the **`raw` as printed**, the **page number**, the **`source_text` span shown as a quotation**, the **quote-gate result in words**, and a confidence meter. Clicking a field **scrolls the document pane to that page**; nothing is highlighted on the page (§3.2) | queued · reading (page N of M, determinate) · read-high-confidence (one action: Accept) · read-with-questions (fields flagged) · unreadable (says why, in words) · superseded (a newer certificate arrived while reviewing) · accepted (read-only, with who accepted and when) |
| **S13** | **Requirement templates** | list + editor (§1.2 step 2) | empty · draft · parsed · saved · **in use by N parties** (editing states the blast radius before saving) · archived |
| **S14** | **Expiry timeline** | portfolio-wide `c-timeline`: one row per party, shared date axis, today rule | empty · normal · at scale (sticky first column, horizontal scroll) · filtered |
| **S15** | **Gap report** | the printable artefact: portfolio header, as-of stamp, portfolio strip, one block per party, disclaimer in the footer | building · ready (view/print/PDF/share-link) · shared-link-view (read-only, expires, no login) |
| **S16** | **Reminder composer / schedule** | recipient, offsets, message with merge chips, live preview, stop condition, total-emails count | new · editing · scheduled · paused · stopped-because-received |
| **S17** | **Inbox / documents** | everything received, matched and unmatched | matched · **unmatched** (the important one: "we could not tell which vendor this is" → match in one tap) · duplicate · rejected |
| **S18** | **Activity** | account-wide log: documents in, statuses changed, emails sent, who accepted what | |
| **S19** | **Admin metrics** (internal) | signups, activation (`activated`), **activation→paid measured on `trial_converted`, not on the card** (`specs/14` §3.1, REVIEW.md B-14), MRR, churn (`PLAN.md` §4) | |

### 2.3 Vendor-side and agent-side (no account, ever)

| # | screen | notes |
|---|---|---|
| **S20** | **Upload link** | reached from an email, at `{APP_ORIGIN}/u/<token>` — an env value, because we do not own `certly.app` (`IDENTITY.md` §2.1; REVIEW.md B-11). Shows *who is asking*, *for which property/project*, and *exactly what is required*, then one upload control that PUTs straight to storage from the browser (`specs/08` §5). **No account, no fee, no password.** A rival reports that at one incumbent the no-login upload is a paid-tier feature (`sources.md` A9); ours is the only path. |
| **S21** | **Upload result** | "Received. Here is what we read and what is still missing." Showing the agent the deficiency immediately is what stops the second round-trip — the category calls this a *deficiency notice* (`sources.md` A1) and doing it in-browser is faster than doing it by mail. |

---

## 3. Key interactions

### 3.1 The status answer (the two-second job)

- Global search (`/` focuses it) matches party names and returns, in the result row itself, the **pill and
  the next expiry date**. The answer is in the search result; opening the party is optional. The
  results panel carries the §F.1 disclaimer — a search row renders a status, so it is one of the
  eleven disclaimer surfaces (KB §F.4, REVIEW.md MJ-06).
- **The pill words are the five requirement states and six vendor states in `specs/05` §2 and
  `specs/06` §3, and no others.** The green one is **"Meets requirements"**. "Covered" is not a status
  word in this product (REVIEW.md B-02, §2.1). The buyer's own word **"current"** is still used, and
  only about a document: *"this certificate is current as of 3 Sep 2026"* is a fact about a date on a
  piece of paper.
- The pill is never rendered without a nearby date (`IDENTITY.md` P3).
- Every status has a plain-language reason string, generated from the check, not a code:
  *"Gap — general liability aggregate is $1,000,000. Your requirement is $2,000,000."*

### 3.1b What is actually extracted (v1)

From the blank **ACORD 25 (2025/12)** as published by New York's Department of Financial Services
(`sources.md` E7; full text in `identity/research/acord25-form-text.txt`):

- **Header:** certificate date, producer (the agency), producer contact name / phone / e-mail, insured
  (named insured and address), insurer A-F with NAIC numbers, certificate number, revision number.
- **Coverage grid, per line:** `INSR LTR` · `TYPE OF INSURANCE` · **`ADDL INSD`** · **`SUBR WVD`** ·
  `POLICY NUMBER` · `POLICY EFF` · `POLICY EXP` · `LIMITS`.
- **Limits by line:** each occurrence, damage to rented premises, med exp, personal & adv injury, general
  aggregate, products–comp/op agg, the "GEN'L AGGREGATE LIMIT APPLIES PER: POLICY / PROJECT / LOC"
  selector; auto combined single limit or split limits; umbrella/excess occurrence and aggregate;
  workers' comp E.L. each accident / disease-ea employee / disease-policy limit.
- **Description of operations / locations / vehicles** — the free-text box where additional-insured and
  waiver wording is usually written out, and therefore the hardest and most valuable field on the form.
- **Certificate holder** — the name that must match the customer's legal name exactly.
- **Cancellation block and authorized representative signature.**

**Two design consequences that follow directly from the form.**

1. `ADDL INSD` and `SUBR WVD` are **checkboxes**. A tick is not a string, and a misread tick is the most
   consequential error this product can make. They render as first-class tri-state values
   (ticked / not ticked / cannot tell) with their own confidence, and "cannot tell" never resolves to
   a green state.
2. The form itself footnotes *"LIMITS SHOWN MAY HAVE BEEN REDUCED BY PAID CLAIMS"* and says notice of
   cancellation *"WILL BE DELIVERED IN ACCORDANCE WITH THE POLICY PROVISIONS"* (E7) — i.e. there is no
   promised notice period. The UI therefore states, wherever a limit or an expiry is shown as met:
   *"as of this certificate"*, and never *"verified"*.

### 3.2 Extraction review — **no bounding boxes** (REVIEW.md B-04, §2.4)

An earlier draft of this section, and `IDENTITY.md` §12.2 and §11, specified *"highlight boxes keyed to
extracted fields… hovering a field raises its box"* and called the box-by-box reveal *"the one place
motion earns its keep"*. **The extractor does not return coordinates.** `specs/03` §3 says so in as
many words — *"clicking a field scrolls the document to its `page` and highlights nothing — we do not
claim bounding boxes we did not extract"* — and the schema confirms it: `StringField` carries
`value`, `raw`, `page`, `source_text`, `confidence`, and no geometry.

**We do not add coordinates to the schema to make the animation possible.** A model-reported box is
exactly the kind of unverifiable claim `IDENTITY.md` §3 Step 9 forbids, and we would be inventing
provenance to decorate a screen whose entire purpose is provenance. The quote gate already gives
something *better*: a check that **code performs** (`specs/03` §7) rather than a rectangle the model
asserted.

What the screen actually is:

- Default **side-by-side** at ≥1024px; stacked tabs below (`IDENTITY.md §8.2`).
- **Per field, in the panel:** the value · the `raw` as printed · the page number · **the `source_text`
  span rendered as a quotation beside the field**, in the tabular face (`--c-font-num`, Source Code
  Pro), so the reader sees the words we
  read it from · **the quote-gate result in words** — *"found on page 1"*, *"we could not find this
  text on the page we read it from"*, or *"this page has no text layer, so we could not check"* · a
  confidence meter.
- **Clicking or focusing a field scrolls the document pane to that field's `page`.** Nothing is drawn
  on the document.
- **The reveal animation shows fields resolving in the panel**, in reading order, with a 120ms fade —
  the quotation appearing next to each value **is** the explanation. Disabled under
  `prefers-reduced-motion` (`IDENTITY.md §11`).
- `IDENTITY.md` P6's review test — *"can a user check our reading of general aggregate against the
  form without leaving the screen?"* — still passes: the quotation and the page are both on screen,
  and the document is one scroll away in the other pane.
- Per field: **confirm · edit · not on this document**. Editing a field records who changed it and from
  what, and that provenance appears in the gap report.
- **Accept reading** is one primary button. It is disabled while any field is in the low-confidence band —
  with the reason stated next to it, never as a silent disabled control.
- Keyboard: `j`/`k` or arrows move between fields, `Enter` confirms, `e` edits, `Esc` leaves.

### 3.3 Chasing

- **Chase** exists on the row, on the party page, and as a bulk action on the table.
- The recipient defaults to the **agent on the certificate**, cc the vendor. If no agent is known, the
  vendor is asked for their agent's address as part of the same email.
- Before sending, the composer states, in words: **who it goes to, how many emails this schedule will
  send in total, and when it stops.**
- Two global rules the product enforces regardless of settings, **and which `specs/07` §9 now
  implements** (they were promised here and in `LANDING_SPEC.md` §5 and enforced nowhere —
  REVIEW.md §2.8): **a recipient never receives more than one Certly email in 72 hours**, across every
  org, requirement, vendor and property; and **one lapse never produces more than 6 messages per
  recipient or 10 in total**, after which the vendor is flagged "we have stopped asking".

### 3.4 Bulk actions

Exactly two: **Chase selected** and **Export gap report for selected**. No bulk delete, no bulk status
change — a status is a conclusion from a document and must not be settable by hand. (A party can be
**muted**, which is different and is logged.)

### 3.5 The forwarding path

- Account address `in@…` plus a per-party address.
- Matching: per-party address → sender domain → named insured on the extracted certificate → fuzzy name.
  Anything unmatched lands in S17 with a one-tap match; it is **never** silently discarded and never
  auto-assigned below a confidence threshold.
- Forwarded threads keep their attachment order and we tell the sender what we did with each one.

---

## 4. Email touchpoints

Email is not a notification channel here; for the agent it is the entire product surface. Nine emails
exist and no others. All are plain, single-column, on the light ground (`--c-paper`), legible with
images off and in greyscale — the status word and glyph survive a photocopier, which is what an audit
file actually is (`IDENTITY.md` §6.4).
Every one carries the CAN-SPAM footer and physical address from `PREREQUISITES.md` P10.

### 4.1 To the customer

| # | email | trigger | rule |
|---|---|---|---|
| C1 | **Magic link** | signin | one link, 15 minutes, single use; the 6-digit code included as a fallback |
| C2 | **First status ready** | activation | one email, once. Contains the first real status. No onboarding drip beyond this. |
| C3 | **Weekly digest** | Monday 07:00 local, opt-out | *only* what changed and what needs them: new gaps, statuses expiring within 30 days, unmatched documents. **If nothing changed, no email is sent.** |
| C4 | **Expiry warning and new gap** | a tracked certificate approaches or passes expiry; a status becomes Gap | immediate, one per party per 24h, names the gap in words. **Not opt-out (REVIEW.md MJ-19).** The Lapse Watch guarantee (`OFFER.md` §6.1) is conditioned on our having warned, and its carve-out for a customer who "turned reminders off" refers to *vendor* reminders. A customer who switches off the digest must not be able to switch off the warning the guarantee depends on. `specs/13` §2 says so where the toggles would be |
| C5 | **Needs your review** | a document lands in the low-confidence band | batched hourly, never per document |
| C6 | **Billing** | trial ending (T−3 and T−1, **not opt-out**, with the first-charge date and amount), payment failed, receipt | **Corrected (REVIEW.md §2.7).** This row previously said "reading and status continue on a failed payment; only sending stops" — an email to a paying customer making a promise the product does not keep. `specs/10` §5 is canonical: **7 days of grace, fully writable**, then **read-only** — new uploads and new vendors stop, reminders stop, and everything already in the account stays readable, reportable and exportable forever. The email says exactly that, with the date grace ends |

**The rule that governs all of them:** an email is sent when the customer must *decide* something. A
status that has not changed is not news. (`IDENTITY.md` P7; contrast with the 74-email behaviour in
`sources.md` D1.)

### 4.2 To the vendor and the vendor's agent

These are the most important emails in the product, because they are the ones that make the status change.

| # | email | to | content |
|---|---|---|---|
| V1 | **First request** | agent (cc vendor) | who is asking, for which property or project, the requirement in plain terms (limits, additional insured wording, waiver, certificate holder name **spelled exactly as it must appear**), the no-login upload link, and *"reply with the PDF attached if that is easier."* |
| V2 | **Renewal request** | agent (cc vendor) | on the canonical ladder — **T−60, T−30, T−14, T−7, T−1, T+1, then weekly to T+28** (`KNOWLEDGE_BASE.md` §B.5, `specs/07` §2). The earlier "−30/−14/−3" here was stale and is corrected (REVIEW.md §2.8). Names the policy and the expiry date, states **how many messages this schedule will send in total and that they stop as soon as a current certificate arrives**. Attaches nothing; links to the upload at `{APP_ORIGIN}/u/<token>`. |
| V3 | **Deficiency notice** | agent (cc vendor) | sent when a certificate arrives but does not meet the requirement. **Says exactly what is missing and what would fix it** — this single email is what removes the round-trips the category is full of |
| V4 | **Received and cleared** | agent (cc vendor) | short, and it exists for one reason: it is the only way the agent learns that Certly emails stop when the job is done, which is what makes the next request get answered |

**Four commitments to the vendor side, stated in every V-email footer:**

1. You will never be charged. (Documented practice in this category is **$99-$125 per vendor per year**
   billed to the vendor — `sources.md` C1, C2 — and up to $85-$150 in a vendor-pay model, A7.)
   This commitment is also a **term of the deal** and appears in `/legal/terms` in the same words
   (`specs/13` §4, REVIEW.md §2.9) — a promise made in the hero, in an FAQ and in every vendor email
   that is absent from the terms is a marketing line pretending to be a commitment.
2. You do not need an account or a password.
3. You can reply with the PDF attached instead of using any link.
4. These emails stop as soon as we have a current certificate.

**Plus the full CAN-SPAM footer, written out in `specs/07` §6.1** — sender identification
("{Customer Org} via {PRODUCT_NAME}"), TheVillage's physical postal address, a conspicuous opt-out
offering **both** *"stop requests from {Customer Org}"* and *"stop all {PRODUCT_NAME} requests"*,
non-deceptive headers, and **no marketing, CTA or link of any kind other than the upload, unsubscribe
and legal links** (`BACKLOG.md` N13, REVIEW.md MJ-16).

### 4.3 Sending discipline

- One sending domain (`PREREQUISITES.md` P6), SPF/DKIM/DMARC verified before any V-email goes out.
- The customer's name is in the `From` display name (*"Ridgeline Property Management via
  {PRODUCT_NAME}"*), because an agent will not open mail from a brand they do not know. The sending
  domain is `{SENDING_DOMAIN}`, an env value (`PREREQUISITES.md` P6).
- Reply-to is the customer's own address, so the agent's reply reaches a human who can decide.
- Every V-email thread is logged on the party's activity so the customer can see exactly what was said.

---

## 5. Mobile behaviour

The split is derived from the artefact, not from a survey (*assumption A4*).

| screen | mobile behaviour |
|---|---|
| **S10 dashboard** | The table becomes a list of cards: pill, party name, next expiry, one **Chase** button. The portfolio strip stays, full width. Filters become a single sheet. |
| **S11 party detail** | Full support. Status band, coverage bar, contacts, history. This is the "standing in the hallway" screen. |
| **S12 document review** | **Degraded on purpose.** Below 1024px the panes become tabs, and the screen opens with a plain statement: *"Reviewing a certificate is easier on a larger screen — here is what we read; you can accept it here, or open it later on a desktop."* We do not pretend an ACORD 25 is readable on a 390px screen. |
| **S13 requirement editor** | Read-only on mobile with a clear "edit on a desktop" path. Editing a requirement is a considered act with a stated blast radius; it should not be done one-handed. |
| **S14 timeline** | Horizontal scroll inside its own container, sticky party column. Never allowed to scroll the page body sideways. |
| **S15 gap report** | Viewable and shareable; the print path is desktop. |
| **S20/S21 vendor upload** | **Mobile-first.** The agent or the vendor is very likely on a phone. One control, camera capture allowed, upload progress stated in words, and a result screen that names what is still missing. |

Touch targets are ≥44px throughout (`--c-row-h` is 44px for exactly this reason). Anything that opens a
sheet on mobile is dismissible by swipe **and** by a visible close control.

---

## 6. Accessibility

The commitments, and how each is verified.

1. **WCAG 2.1 AA on colour.** Every declared pair is computed by `identity/contrast.py`, which fails the
   build on a regression. Tables are in `IDENTITY.md §6.5`.
2. **Colour is never the only carrier (1.4.1).** Every status has a word, a glyph and a fill pattern as
   well as a hue; `contrast.py` hard-fails if any of the three is duplicated across statuses. The
   greyscale panel in `identity/samples.html` is the visible proof.
3. **Keyboard complete.** Every action reachable and operable by keyboard, in a logical order. The document
   highlights are a roving-tabindex list. No keyboard trap in the split view or in any sheet.
4. **Focus always visible.** `outline: 2px solid var(--c-focus); outline-offset: 2px` on every interactive
   element. `outline: none` appears nowhere in the codebase and its presence is a review failure.
5. **Semantics.** Real `<table>` for tabular data with `<caption>` and `scope`; `<button>` for actions;
   `<a>` for navigation; one `<h1>` per screen and a heading order with no skipped levels.
6. **Graphics that carry meaning are labelled.** Every coverage bar and the portfolio strip carry
   `role="img"` and an `aria-label` that states the same fact as a sentence: *"General liability: a
   policy is shown from 1 January to 12 September 2026, then **no certificate on record**."* — a
   statement about the record, not about coverage (REVIEW.md MN-02; `IDENTITY.md` §9.2 carries the
   same correction, which belongs to the Brand Director).
7. **Status changes are announced.** An `aria-live="polite"` region reports extraction completion and
   status changes. It is polite, never assertive: nothing in this product justifies interrupting a screen
   reader mid-sentence.
8. **Motion is optional.** `prefers-reduced-motion: reduce` disables the extraction reveal and every
   transition. Nothing in the product depends on motion to be understood.
9. **Zoom and reflow.** Usable at 200% zoom and at a 320px equivalent width with no loss of function; text
   sizes are in `rem` so the browser's font setting is respected.
10. **Forms.** Every input has a real `<label>`; errors are announced, described by `aria-describedby`,
    and carry an icon and words as well as colour.
11. **Documents.** The PDF viewer offers a text alternative — the extracted fields as a list — so a screen
    reader user is never asked to read an image. The gap report exports as tagged, structured text.
12. **Language and plainness.** Terms of art are used (that is what the buyer speaks) but each one is
    defined on first use in a screen, with a persistent glossary in Help.

**What is explicitly out of scope for v1, and said so rather than quietly skipped:** a formal VPAT, a
third-party audit, and full AAA. `PLAN.md` puts no accessibility gate on wave 2; this document sets AA as
the internal bar and `contrast.py` as the only automated part of it.

---

## 7. Instrumentation this design assumes

**Rewritten 2026-09-03 (REVIEW.md B-14).** This section previously listed a complete instrumentation
vocabulary of which **not one name appeared in any spec** — a fourth set of names for the same funnel,
alongside `specs/`, `BACKLOG.md`'s per-item columns and `LANDING_SPEC.md` §11. There is now **one
registry**: [`specs/00-event-vocabulary.md`](specs/00-event-vocabulary.md). This file names events
from it and invents none; `events:check` in CI fails the build on a name that does not resolve there.

The events this design depends on, by the moment they answer:

| the design question | event, from the registry |
|---|---|
| did the magic-link flow work? | `signup_started` · `magic_link_requested` · `magic_link_sent` · `magic_link_consumed{age_seconds}` · `magic_link_failed{reason}` · `org_created` |
| **is onboarding really five minutes?** (assumption A2 — a *design target*, never a claim) | `onboarding_started{audience}` · `onboarding_step_completed{step, seconds}` · `onboarding_step_abandoned{step}` · `vendors_pasted{lines, created}` |
| **did they reach the thing they came for?** | **`activated{minutes_from_signup, vendors_at_activation, gaps_found}`** — the one activation event (`specs/11` §2) |
| did the reading hold up? | `extraction_succeeded{doc_confidence, fields_below_tau, gate_failures}` · `review_opened` · `review_field_corrected{field, from_confidence, gate}` · `review_completed{ms, corrections}` |
| does the two-second answer get used? | `dashboard_viewed{…}` · `dashboard_filtered` · `vendor_opened_from_dashboard{status}` · `explanation_opened{state}` |
| does the chase work, and does it stop? | `reminder_scheduled{rung, days_out}` · `reminder_sent{rung, recipient_kind}` · `reminder_skipped{reason}` · `upload_link_opened` · `vendor_upload_completed` · **`renewal_received_after_reminder{rung, hours}`** |
| does the artefact travel? | `report_generated{…}` · `report_share_created{days}` · `report_share_opened` |
| did they pay, and did they stay? | `checkout_started` · `checkout_completed` *(a card, not money)* · **`trial_converted`** *(money — the number `THRESHOLDS.md` §3 measures)* · `trial_cancelled` · `subscription_cancelled` |

**Retired here, with their replacements** (the full table is `specs/00` §4): `first_status_rendered` →
`activated` · `dialect_chosen` → `onboarding_started{audience}` · `requirement_template_created` →
`requirement_set_created{origin}` · `parties_imported` → `vendors_pasted` / `csv_import_completed` ·
`document_received` → `coi_uploaded{source}` · `extraction_completed` → `extraction_succeeded` ·
`review_accepted` → `review_completed` · `renewal_received` → `renewal_received_after_reminder` ·
`status_changed` → `vendor_status_changed{from,to}` · `gap_report_exported` → `report_generated` ·
`magic_link_opened` → `magic_link_consumed` · `trial_ended` → `trial_converted` **or**
`trial_cancelled` (an ending is one of two facts and they are not the same) · `subscription_active` →
`trial_converted`.

---

## 8. Open questions — **all five are now closed** (REVIEW.md §5)

Kept with their answers rather than deleted, so nobody re-opens a settled question.

1. ~~**Does a document ever get a status without a human accepting the reading?**~~ **Closed: yes,
   above τ, from the very first document** (REVIEW.md OQ-14). `specs/03` §8 already decided it and it
   is the right call: requiring a human on document #1 makes the fastest activation path slower, and
   the review queue is already the safety net. This file's earlier "no for the first document" is
   superseded. The guard is **τ = 0.85 plus the quote gate plus the confident-wrong ceiling**
   (`THRESHOLDS.md` §4.2, ≤ 2%) — three mechanical controls instead of one manual one.
2. ~~**What happens at the tier limit?**~~ **Closed: `specs/10` is canonical** (REVIEW.md §2.7). The
   meter is **tracked vendors**, one per non-archived vendor. At the limit: **new writes blocked,
   nothing deleted, everything readable and exportable**, and the paywall names the count and offers
   both the next tier and a Vendor Pack. On a failed payment: **7 days of grace, fully writable, then
   read-only** — S6 and C6 above are corrected to say so.
3. ~~**Do we accept endorsement documents in v1?**~~ **Closed: they are read when attached to the
   certificate upload, and they are what turns `asserted_only` into `met`** (`specs/05` §4); a
   *separate* endorsement-document type is `SH-2`. The UI says so, which was the real ask here.
4. ~~**Shared gap-report links: expiry and access.**~~ **Closed: 30 days by default, revocable,
   logged, 90 days maximum** — `specs/12` §8 already implements exactly that (REVIEW.md OQ-15).
5. ~~**Multi-user from day one?**~~ **Closed: yes, and it is Must, not Should** (REVIEW.md MJ-03).
   `specs/01` §4 ships `memberships` with owner/editor/viewer and `specs/13` §2/§7 ships invitations
   and the role matrix; the pricing cards sell 3/10/25 seats, so a seat limit nothing enforces is a
   sold feature that does not exist. `SH-7` is re-scoped to seat-management UI and role granularity.
