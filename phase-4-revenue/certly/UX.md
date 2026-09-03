# CERTLY — UX (v1)

**Author:** Buyer & Identity agent, wave 1. **Date:** 2026-09-03.
**Implements:** `PERSONA.md` (who and why) and `IDENTITY.md` (how it looks and sounds). Both are binding.
**Consumed by:** `BACKLOG.md` and `specs/` (wave 1, Product Owner) and the wave-2 build.
**Scope of v1:** ACORD 25 only (`PLAN.md` A11). Auth is email magic link, no OAuth (A7). Billing is
Stripe self-serve (D2). Jobs run on a Vercel cron draining a jobs table (A12). Nothing in this document
assumes a human operator inside the product; the only humans are the customer and the vendor's agent.

---

## 0. The three sentences this design has to earn

1. **"Is this vendor covered?" is answered in under two seconds, from any screen, without opening a file.**
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
                                                  covered / expiring        gap
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

1. **Forward what you already have.** Every account gets an inbox address (`in@…`) and every party gets a
   per-party address. *"Forward the certificates sitting in your email. We will match them to vendors."*
   This is the fastest path to a real first status and it is the one this buyer will actually take, because
   the documents are already in their inbox (`PERSONA.md §2.2`).
2. **Upload** — drag, pick, or paste an image.
3. **Ask the agents** — send the first chase to everyone with no document, in one action.

**Onboarding ends the moment the first status renders.** Not on a "You're all set!" screen — on the vendor
table, with one real row in it. The activation event for `events` (PLAN A14) is
`first_status_rendered`, not `signup_completed`.

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
| S6 | Billing | trial with days remaining stated as a date, not a countdown · active · past due (with what stops working: **nothing stops; we keep reading and stop sending**) · cancelled · invoice history |
| S7 | Settings — account, dialect, sending address, team, notification schedule defaults | |
| S8 | Help | searchable articles + one contact route; no chat widget |
| S9 | Legal — terms, privacy, the insurance disclaimer in full | |

### 2.2 The product

| # | screen | what it is | states |
|---|---|---|---|
| **S10** | **Coverage dashboard** | the home screen: portfolio strip, filters, party table sorted *soonest problem first* | **empty** (no parties → the three import doors) · **first-run** (parties, no documents → "Ask all 12 agents" as the primary action) · loading (static blocks, no shimmer) · **normal** · **at scale** (500 rows: sticky header, virtualised body, server-side sort) · filtered-to-nothing (says which filter to remove) · error (the table stays, a banner explains what is stale and as of when) |
| **S11** | **Party detail** | one vendor/sub: status band, coverage bar (12px), requirement applied, document history, contacts (vendor + agent), activity log | never-had-a-document · has-documents · gap-with-reasons · muted/inactive party |
| **S12** | **Document review** (the split view) | document pane + extraction review panel | queued · reading (page N of M, determinate) · read-high-confidence (one action: Accept) · read-with-questions (fields flagged) · unreadable (says why, in words) · superseded (a newer certificate arrived while reviewing) · accepted (read-only, with who accepted and when) |
| **S13** | **Requirement templates** | list + editor (§1.2 step 2) | empty · draft · parsed · saved · **in use by N parties** (editing states the blast radius before saving) · archived |
| **S14** | **Expiry timeline** | portfolio-wide `c-timeline`: one row per party, shared date axis, today rule | empty · normal · at scale (sticky first column, horizontal scroll) · filtered |
| **S15** | **Gap report** | the printable artefact: portfolio header, as-of stamp, portfolio strip, one block per party, disclaimer in the footer | building · ready (view/print/PDF/share-link) · shared-link-view (read-only, expires, no login) |
| **S16** | **Reminder composer / schedule** | recipient, offsets, message with merge chips, live preview, stop condition, total-emails count | new · editing · scheduled · paused · stopped-because-received |
| **S17** | **Inbox / documents** | everything received, matched and unmatched | matched · **unmatched** (the important one: "we could not tell which vendor this is" → match in one tap) · duplicate · rejected |
| **S18** | **Activity** | account-wide log: documents in, statuses changed, emails sent, who accepted what | |
| **S19** | **Admin metrics** (internal) | signups, activation (`first_status_rendered`), conversion, MRR, churn (`PLAN.md` §4) | |

### 2.3 Vendor-side and agent-side (no account, ever)

| # | screen | notes |
|---|---|---|
| **S20** | **Upload link** | reached from an email. Shows *who is asking*, *for which property/project*, and *exactly what is required*, then one upload control. **No account, no fee, no password.** A rival reports that at one incumbent the no-login upload is a paid-tier feature (`sources.md` A9); ours is the only path. |
| **S21** | **Upload result** | "Received. Here is what we read and what is still missing." Showing the agent the deficiency immediately is what stops the second round-trip — the category calls this a *deficiency notice* (`sources.md` A1) and doing it in-browser is faster than doing it by mail. |

---

## 3. Key interactions

### 3.1 The status answer (the two-second job)

- Global search (`/` focuses it) matches party names and returns, in the result row itself, the **pill and
  the next expiry date**. The answer is in the search result; opening the party is optional.
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
   "covered".
2. The form itself footnotes *"LIMITS SHOWN MAY HAVE BEEN REDUCED BY PAID CLAIMS"* and says notice of
   cancellation *"WILL BE DELIVERED IN ACCORDANCE WITH THE POLICY PROVISIONS"* (E7) — i.e. there is no
   promised notice period. The UI therefore states, wherever a limit or an expiry is shown as met:
   *"as of this certificate"*, and never *"verified"*.

### 3.2 Extraction review

- Default **side-by-side** at ≥1024px; stacked tabs below (`IDENTITY.md §8.2`).
- Hovering or focusing a field raises its highlight on the document; clicking scrolls the page to it.
  As fields resolve during reading, highlights appear in reading order with a 120ms fade — **that motion
  is the explanation**, and it is disabled under `prefers-reduced-motion` (`IDENTITY.md §11`).
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
- One global rule the product enforces regardless of settings: **a party never receives more than one
  Certly email in 72 hours**, across every requirement and every property.

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
exist and no others. All are plain, single-column, in the light palette, legible with images off.
Every one carries the CAN-SPAM footer and physical address from `PREREQUISITES.md` P10.

### 4.1 To the customer

| # | email | trigger | rule |
|---|---|---|---|
| C1 | **Magic link** | signin | one link, 15 minutes, single use; the 6-digit code included as a fallback |
| C2 | **First status ready** | activation | one email, once. Contains the first real status. No onboarding drip beyond this. |
| C3 | **Weekly digest** | Monday 07:00 local, opt-out | *only* what changed and what needs them: new gaps, statuses expiring within 30 days, unmatched documents. **If nothing changed, no email is sent.** |
| C4 | **New gap** | a status becomes Gap | immediate, one per party per 24h, names the gap in words |
| C5 | **Needs your review** | a document lands in the low-confidence band | batched hourly, never per document |
| C6 | **Billing** | trial ending (as a date), payment failed, receipt | states plainly that reading and status continue on a failed payment; only sending stops |

**The rule that governs all of them:** an email is sent when the customer must *decide* something. A
status that has not changed is not news. (`IDENTITY.md` P7; contrast with the 74-email behaviour in
`sources.md` D1.)

### 4.2 To the vendor and the vendor's agent

These are the most important emails in the product, because they are the ones that make the status change.

| # | email | to | content |
|---|---|---|---|
| V1 | **First request** | agent (cc vendor) | who is asking, for which property or project, the requirement in plain terms (limits, additional insured wording, waiver, certificate holder name **spelled exactly as it must appear**), the no-login upload link, and *"reply with the PDF attached if that is easier."* |
| V2 | **Renewal request** | agent (cc vendor) | at the customer's chosen offsets (−30/−14/−3 by default). Names the policy and the expiry date. Attaches nothing; links to the upload. |
| V3 | **Deficiency notice** | agent (cc vendor) | sent when a certificate arrives but does not meet the requirement. **Says exactly what is missing and what would fix it** — this single email is what removes the round-trips the category is full of |
| V4 | **Received and cleared** | agent (cc vendor) | short, and it exists for one reason: it is the only way the agent learns that Certly emails stop when the job is done, which is what makes the next request get answered |

**Four commitments to the vendor side, stated in every V-email footer:**

1. You will never be charged. (Documented practice in this category is **$99-$125 per vendor per year**
   billed to the vendor — `sources.md` C1, C2 — and up to $85-$150 in a vendor-pay model, A7.)
2. You do not need an account or a password.
3. You can reply with the PDF attached instead of using any link.
4. These emails stop as soon as we have a current certificate.

### 4.3 Sending discipline

- One sending domain (`PREREQUISITES.md` P6), SPF/DKIM/DMARC verified before any V-email goes out.
- The customer's name is in the `From` display name (*"Ridgeline Property Management via Certly"*), because
  an agent will not open mail from a brand they do not know.
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
   `role="img"` and an `aria-label` that states the same fact as a sentence: *"General liability: covered
   1 January to 12 September 2026, then no coverage on record."*
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

For `events` (PLAN A14) and `THRESHOLDS.md`:

`signup_started` · `magic_link_sent` · `magic_link_opened` · `dialect_chosen` ·
`requirement_template_created` (with `source: clause | standard` and **`seconds_elapsed`** — this is how
assumption A2 gets tested) · `parties_imported` (count, method) · `document_received` (source: forward |
upload | link) · `extraction_completed` (per-field confidence distribution) · `review_accepted` (with
`fields_edited`) · **`first_status_rendered`** (the activation event) · `gap_report_exported` ·
`reminder_scheduled` · `reminder_sent` · `renewal_received` · `status_changed` (from, to) ·
`trial_ended` · `checkout_started` · `subscription_active` · `subscription_cancelled`.

---

## 8. Open questions for the Product Owner and the founder

1. **Does a document ever get a status without a human accepting the reading?** This design says **no for
   the first document from a party, yes afterwards when confidence is high** — but that is a judgment,
   and it trades activation speed against the one failure that could end the company (`PERSONA.md` O-A6).
   It needs an explicit decision before wave 2 builds it.
2. **What happens at the tier limit?** The pricing hypothesis is tiered by certificates tracked
   (`shortlist.json`). Reading stops? Chasing stops? Nothing stops and we email? S2 and S6 cannot be
   finished without an answer, and the honest options differ a lot in feel.
3. **Do we accept endorsement documents in v1?** Launch scope is ACORD 25 only (`PLAN.md` A11), but the
   most valuable check in the product — additional insured — is the one the certificate cannot prove
   (`sources.md` E1). V3 asks for the endorsement; v1 may not be able to read it. Say so in the UI.
4. **Shared gap-report links: expiry and access.** An owner, a board or an auditor receiving a link is a
   real workflow (`PERSONA.md` JTBD-A4/B2). Default proposed: 30 days, no login, revocable, logged.
5. **Multi-user from day one?** HOA firms have several managers touching the same vendor list. The design
   assumes an account with several users and no roles in v1; roles are a wave-3 question.
