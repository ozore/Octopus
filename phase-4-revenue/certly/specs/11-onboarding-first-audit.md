# Spec M11 — Onboarding: the first-certificate audit

**Backlog item:** M11 (Must). **Effort:** M. **Depends on:** M2, M3, M4, M5.

## 1. Story

> As someone who just clicked a magic link, I go from an empty workspace to *"three of your vendors have
> a problem, and one policy expired in April"* in one sitting, without reading documentation.

**Activation is the number that decides this business** (`THRESHOLDS.md` §1). Leaving the core loop to
be discovered is how a good product dies at 12% activation.

## 2. Definition of activated

> **`activated` = the org has completed one comparison against a real certificate.**

Precisely: an org where at least one `comparisons` row exists whose `certificateId` refers to a
document the org uploaded (not a sample), with `status != 'needs_review'`. Emitted **once per org**,
with `minutes_from_signup`.

This definition is chosen because it is the first moment the customer has seen the thing they came for:
a verdict on a real document of theirs. Signing up is not activation. Adding vendors is not activation.

## 3. Flow

```
first sign-in → /onboarding  (resumable, skippable, never modal-trapping)

 1. Who are you?     property manager · HOA manager · general contractor · commercial landlord
                     → sets audience, seeds the template library view
 2. Your entity      the exact name (and address) that should appear as certificate holder
                     → organisations.entityBlock — a FUNCTIONAL input to M5's holder check, not a profile field
 3. Requirements     apply a sourced template (M2) — one click, editable later
 4. Vendors          "paste your list" (textarea, one per line) OR CSV import (M3) OR add one
 5. First certificate upload one PDF for one vendor (M4) → extraction → review if needed
 6. The finding      the comparison result, in plain language, plus:
                     "want us to check the rest? add the others and send them all a request"
```

Step 4's **paste box comes before the CSV importer** in the UI. The fastest path from a spreadsheet is
copy-a-column-and-paste; making people find, export and map a CSV first loses people who would have
pasted in ten seconds.

**Step 6 is the product's whole promise.** It must render the finding as a sentence a human would say —
*"Northside Roofing's general liability expired on 12 April 2026"* — not as a table of requirement rows.
The table is one click below.

## 4. Screens

| screen | route | notes |
|---|---|---|
| Checklist | `/onboarding` | 6 steps, progress, each step resumable and independently completable |
| Step panes | `/onboarding/[step]` | one job per screen; back always works |
| Finding | `/onboarding/finding` | the plain-language result + "add the rest" CTA |
| Dashboard nudge | `/dashboard` | until activated, the checklist persists at the top with remaining steps |

**No sample data, ever.** A demo vendor with a demo certificate teaches the customer that the numbers on
screen are fake, which is the exact opposite of what a compliance product needs to establish in its
first minute.

## 5. Data model

```ts
onboardingState {
  orgId unique, audience,
  stepsCompleted: jsonb,        // { who:true, entity:true, requirements:true, vendors:false, ... }
  skippedAt: timestamp,
  activatedAt: timestamp,       // set once, by the comparison job, never by the UI
  firstCertificateId: uuid,
  createdAt, updatedAt
}
```

`activatedAt` is written by the **comparison job**, not by the onboarding UI. Activation is a fact about
the data, not a fact about which screens someone visited; measuring it from the UI is how activation
metrics come to overstate reality.

## 6. Server actions

| action | signature |
|---|---|
| `setAudience` | `(audience) → void` |
| `setEntityBlock` | `(text) → void` |
| `pasteVendors` | `(text) → { created, skipped }` — one vendor per line; `Name, email` also accepted |
| `completeStep` / `skipOnboarding` | `(step) → OnboardingView` |
| `getOnboarding` | `() → OnboardingView` |

## 7. Validation

- `entityBlock`: 1–500 chars; the placeholder is a **real-shaped example**
  ("Acme Property Management LLC, 100 Main St, Suite 4, Austin TX 78701"), because a vague prompt here
  produces a vague holder match later
- paste box: ≤ 500 lines; blank and duplicate lines skipped with a count; splits on `,` or `<…>` for an
  email
- every step is skippable except: a certificate cannot be uploaded before a vendor exists, and a
  comparison cannot run before a requirement set exists. Those two are enforced by the data, and the UI
  explains rather than blocks silently

## 8. Acceptance criteria

**A1** Given a brand-new org, When I sign in, Then I land on `/onboarding` with 6 steps and step 1 open.
**A2** Given I pick "general contractor", Then step 3 shows the GC templates first (`gc.baseline`,
`gc.trade.high_hazard`, …).
**A3** Given I paste 40 lines of vendor names, Then 40 vendors are created, duplicates and blanks are
reported, and I am on step 5 in under 20 seconds.
**A4** Given I upload a certificate and it extracts cleanly, Then step 6 shows the finding as a
sentence, and `activated` is emitted with `minutes_from_signup`.
**A5** Given the extraction needs review, Then step 6 shows the review screen inline, and `activated` is
emitted **after** review completes — never before.
**A6** Given I skip onboarding, Then the dashboard shows the remaining steps as a dismissible strip and
`onboarding_skipped` is emitted with the last completed step.
**A7** Given I close the browser at step 4 and return next day, Then I resume at step 4 with steps 1–3
intact.
**A8** Given an org that never uploads a certificate, Then `activated` is never emitted **and the org is
not counted as activated in admin metrics** — no partial credit.
**A9** Given step 6, Then the §F.1 disclaimer is present, adjacent to the finding.

## 9. Edge cases

| case | behaviour |
|---|---|
| Customer has no certificate to hand | offer "email yourself a link to upload later" (an M8 link addressed to themselves) and mark the step pending — this is a real and common case at 11pm |
| First certificate is for a vendor not in the list | create the vendor inline from the extracted `insured.name`, confirmed by the user |
| First certificate is unreadable/rejected | step 6 shows the rejection plainly and offers another; **do not** dead-end the funnel |
| Second user joins an already-activated org | no onboarding; straight to the dashboard |
| Customer pastes 500+ vendors | import the first 500, offer the CSV importer for the rest |
| Trial cap (25 vendors) hit during step 4 | import up to the cap, show the paywall in context (M10 §A9) |

## 10. Errors

Every step failure is recoverable in place; no step ever loses the input already typed. A failed
extraction at step 5 keeps the vendor and offers re-upload.

## 11. Analytics

`onboarding_started{audience}`, `onboarding_step_completed{step,seconds}`,
`onboarding_step_abandoned{step}`, `vendors_pasted{lines,created}`,
`activated{minutes_from_signup,vendors_at_activation,gaps_found}`,
`onboarding_skipped{last_step}`, `onboarding_resumed{step,hours_since}`,
`first_finding_shown{status,gaps}`.

**The step-by-step funnel is the diagnostic that makes the activation threshold actionable.** If
`THRESHOLDS.md` §1 fails, `onboarding_step_abandoned{step}` says *which* step to fix, and one iteration
changes one step (PIPELINE stage 6: one variable at a time).

`activated.gaps_found` tests the dossier's core go-to-market claim — *"a free COI audit reliably surfaces
an already-expired policy"*. If the median new org finds **zero** gaps in its first certificate, the
entire acquisition story needs rewriting, and we will know it from day one rather than from month three.

## 12. Test plan

Unit: step-state machine (resume, skip, out-of-order completion); paste parser (`Name`,
`Name, email`, `Name <email>`, quotes, tabs, blank lines, duplicates).
Integration (PGlite): `activatedAt` is written by the comparison job and is idempotent; a
`needs_review` extraction does not activate.
e2e: full six-step run from magic link to the finding, with a real corpus PDF, asserting `activated`
fires exactly once and the finding sentence names the vendor and the problem.
