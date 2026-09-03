# WL-10 · Settings

**Effort: S · Must (MVP) · Depends on: WL-01**

## Story

As Rosa I can fix the company name and address that print on every form, set who signs the
payrolls, record our fringe benefit plans and apprenticeship programs once, and see my
subscription.

## Why an S is a Must

The legal business name and address print on **every page of every WH-347 and every Statement
of Compliance** (KNOWLEDGE_BASE KB-6, fields `hdr.business_name`, `hdr.business_address`).
Getting them wrong once means reissuing months of payrolls to the GC. And the fringe plans and
apprenticeship programs live here rather than inside the weekly payroll flow because they are
**stable facts about the company** that page 2 demands per worker — re-entering them every
Friday would be the fastest possible way to make week 2 slower than week 1, which is the one
thing the MVP cannot afford.

## Flow / screens

```
/settings
  ├ Company            legal name · address · phone · workweek start day
  ├ Certifying official default name · title · phone · email     (WH-347 p2, prefilled at certify)
  ├ Fringe benefit plans   name · type · plan no. · funded/unfunded   (WH-347 p2 block)
  ├ Apprenticeship programs  program name · OA or SAA               (WH-347 p2 block)
  ├ Billing            → WL-09
  └ Account            your email · sign out · delete organisation
```

| screen | contents | states |
|---|---|---|
| Company | the fields above, with a **live preview of the WH-347 header block** so she sees exactly what will print | idle · saving · saved · error |
| Certifying official | name, title, phone, email; "this is prefilled when you certify; you can change it each week" | — |
| Fringe plans | list + add/edit drawer; archived plans shown greyed | empty · list |
| Apprenticeship programs | list + add/edit drawer | empty · list |
| Account | email (immutable in MVP), sign out, delete organisation behind a typed confirmation | — |

## Data model

Extends `organisations` (WL-01) and reuses `fringe_plans` (WL-05) and
`apprenticeship_programs` (WL-04). Additions:

```ts
organisations  (added columns)
  workweek_start_day          smallint  notNull default 0   // 0 = Sunday … 6 = Saturday
  default_certifying_name     text
  default_certifying_title    text
  default_certifying_phone    text
  default_certifying_email    citext
  default_daily_hours         numeric(4,2) notNull default 8.00   // the "." shortcut in WL-05's grid
  deletion_requested_at       timestamptz
```

## Server actions

| name | effect |
|---|---|
| `updateOrganisation(fields)` | validates and writes; **does not** touch any generated document |
| `setDefaultCertifyingOfficial(fields)` | prefill only |
| `createFringePlan` / `updateFringePlan` / `archiveFringePlan` | archive is soft; a plan referenced by a certified payroll can never be hard-deleted |
| `createApprenticeshipProgram` / `updateApprenticeshipProgram` / `archiveApprenticeshipProgram` | same |
| `requestOrganisationDeletion()` | stamps `deletion_requested_at`; a 30-day window, then a purge job. Explained in the confirmation, not hidden. |

## Validation rules

| # | rule |
|---|---|
| V1 | `legal_name`, `address_line1`, `city`, `state_code`, `postal_code` are required and cannot be blanked once set — a form cannot print without them |
| V2 | `state_code` is a select over the 54 codes in `kb_counties` |
| V3 | `postal_code` matches `\d{5}(-\d{4})?` |
| V4 | `default_certifying_email` parses; `default_certifying_phone` normalises to the form's `( _ _ _ ) _ _ _ - _ _ _ _` mask |
| V5 | `fringe_plans.plan_type ∈ {health, pension, vacation, training, other}`; `is_funded` is required — page 2 prints a Funded/Unfunded checkbox and there is no third state |
| V6 | `apprenticeship_programs.registrar ∈ {OA, SAA}` — page 2 prints exactly these two |
| V7 | Changing the company name or address **does not regenerate any existing document**. The PDF that was filed is the record. |
| V8 | `workweek_start_day` cannot be changed while any project has a draft payroll — it reorders the 7-element hours arrays |
| V9 | Organisation deletion requires typing the legal name, and states plainly that certified payrolls are subject to a three-year federal retention obligation that is the contractor's, not ours |

**V7 is the one that surprises people, so the UI says it out loud:** "Changing this affects
payrolls you create from now on. Payrolls you've already certified keep the name and address
they were filed with."

## Acceptance criteria

- **Given** an organisation, **when** the legal name is changed, **then** the next generated
  WH-347 shows the new name and every previously generated document's sha256 is unchanged. *(V7)*
- **Given** a blank `legal_name` submission, **when** saved, **then** it is refused. *(V1)*
- **Given** a fringe plan referenced by a certified payroll, **when** deletion is attempted,
  **then** only archival is offered.
- **Given** `workweek_start_day` set to Monday, **when** a new payroll is created, **then** the
  hours grid's first column is Monday and the 7-element arrays are ordered from Monday.
- **Given** an open draft payroll, **when** `workweek_start_day` is changed, **then** it is
  blocked with the reason and a link to the draft. *(V8)*
- **Given** a default certifying official, **when** the certify screen opens, **then** all four
  fields are prefilled and remain editable.
- **Given** a fringe plan saved without `is_funded`, **when** submitted, **then** it is refused
  with the page-2 reason. *(V5)*
- **Given** organisation deletion is requested, **when** confirmed, **then**
  `deletion_requested_at` is stamped, access continues for 30 days, and a cancel-deletion
  banner appears.

## Edge cases

| case | behaviour |
|---|---|
| The legal name differs from the trading name | The form wants the name on the contract. Field label is "Legal business name (as it appears on your contract)". |
| Address longer than the form's cell | Wrapped to two lines in the generated PDF, never truncated (WL-06 V8). The live preview shows the wrap. |
| A fringe plan that changes mid-year | Archive the old, create the new. Certified payrolls keep the credits they were filed with; drafts do not auto-update. |
| An apprenticeship program deregistered | Archive. Workers mapped to it keep it on already-certified payrolls; new payrolls block on WL-05 B10 until re-set. |
| A second user is invited | Not in the MVP (WL-37). The Account panel says "one login per organisation for now" rather than showing a disabled invite button. |
| Email change | Not supported in the MVP — it is the login identity and a change is an account-takeover surface. Support handles it. Stated in the panel. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Save conflicts with a concurrent edit | "Someone else changed this" + reload | `settings_conflict` |
| Archive blocked by a reference | "This plan is used on payroll #6. Archiving keeps it on past payrolls." | `fringe_plan_in_use` |

## Analytics events

`settings_viewed {panel}` · `organisation_updated {fields_changed}` ·
`certifying_official_set` · `default_daily_hours_changed` · `workweek_start_changed` ·
`fringe_plan_created {plan_type, is_funded}` · `fringe_plan_archived` ·
`apprenticeship_program_created {registrar}` ·
`organisation_deletion_requested` · `organisation_deletion_cancelled`

## Test plan

**Unit** — required-field rules, postal code and phone normalisation, enum guards for
`plan_type` and `registrar`, workweek reordering of the 7-element arrays.
**Integration (PGlite)** — rename the organisation after certifying a payroll; assert the stored
document's sha256 is unchanged and the next generated document carries the new name; archive a
referenced fringe plan; block a workweek change with an open draft.
**E2E** — set the company, set the certifying official, add a funded health plan, certify a
payroll and assert page 2 prints the plan name, type, number and funded checkbox.
