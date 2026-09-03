# WL-06 · WH-347 and Statement of Compliance generation

**Effort: L · Must (MVP) · Depends on: WL-05**
Form facts, the 50-field inventory and the verbatim Statement of Compliance:
[`../KNOWLEDGE_BASE.md`](../KNOWLEDGE_BASE.md) KB-6, KB-7, §5 ·
[`../kb-samples/wh347-field-list.json`](../kb-samples/wh347-field-list.json) ·
[`../kb-samples/wh347-page2-statement-of-compliance.txt`](../kb-samples/wh347-page2-statement-of-compliance.txt).

## Story

As Rosa I click **Generate**, check the preview, type my name and title, sign, and download two
PDFs that look like the DOL form and say exactly what the DOL form says. I email them to the
GC's compliance person and I get paid.

## The constraint that makes this an L

**The official WH-347 is a flat PDF with zero form fields.** Downloaded 2026-09-03 from
`dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf` (200, 304,738 bytes, sha256
`fa28f033a825…`, Rev. January 2025, OMB 1235-0008, expires 2028-01-31): `/AcroForm` exists,
`/Fields` is `[]`, and the only annotation on either page is a `/Link` to the instructions.
`pypdf.get_fields()` returns **0**.

There is nothing to fill. The form is **generated from scratch** — 50 named fields, an 8-row
grid, a 7×2 hours sub-grid per worker, continuation pages, and the Statement of Compliance
reproduced **verbatim**, because 29 CFR 5.5(a)(3)(ii) accepts page 2 of the WH-347 *"or another
document with identical wording"* and accepts nothing else.

## Flow

```
/payrolls/:id/certify
   ─▶ preview (server-rendered, the real generator, watermarked DRAFT)
   ─▶ certifying official: name · title · phone · email · additional remarks
   ─▶ the three certifications rendered in full, each acknowledged
   ─▶ [ certify and generate ]
          │  transaction: payrolls.status = 'certified', certified_at = now()
          │  enqueue job  document.generate  (dedupe_key = 'doc:<payroll_id>')
          ▼
   /payrolls/:id  (certified)
       ┌ WH-347 (2 pages + continuations)        [ download ]  sha256 …
       └ Statement of Compliance (1 page)        [ download ]  sha256 …
       "Generated from TX20260253 mod 1, published 2026-05-18"
       [ download both ]   [ copy a share link ]  (signed, 7-day expiry)
```

Generation is a **job**, not a request. A 40-worker payroll is 6 pages of layout; Vercel's
function budget is not the place to discover that. The certify action returns immediately and
the documents appear when the drain tick completes — typically 2–4 seconds, with a live status.

## Screens

| screen | contents | states |
|---|---|---|
| certify | preview iframe, official fields, the three certifications, remarks | idle · invalid · certifying |
| certified payroll | both documents with sha256 and generated-at, download buttons, share link | generating · ready · failed |
| preview | the real generator output, `DRAFT — NOT FOR SUBMISSION` watermark | — |
| document failure | "We couldn't generate this. Your payroll is certified and safe; we're retrying." | — |

## The two documents

### Page 1 — the payroll grid

Reproduces the official layout: the header block (11 fields), the column band labelled exactly
`(1A) (1B) (1C) (1D) (1E) (2) (3) (4) (5) (6A) (6B) (6C) (7A) (7B) (8) (9)`, eight worker rows
per page, each worker occupying a **ST row and an OT row** across seven dated day columns.

| field | source |
|---|---|
| `hdr.final_payroll_flag` | `payrolls.is_final` |
| `hdr.role_prime` / `hdr.role_sub` | `projects.our_role` |
| `hdr.project_name` | `projects.name` |
| `hdr.project_or_contract_no` | `projects.project_or_contract_no` |
| `hdr.certified_payroll_no` | `payrolls.payroll_number` |
| `hdr.business_name` | `organisations.legal_name` |
| `hdr.project_location` | `projects.location_description` |
| **`hdr.wage_determination_no`** | **`payrolls.wd_number`** — the field the whole product exists to fill correctly |
| `hdr.week_ending_date` | `payrolls.week_ending_date` |
| `hdr.business_address` | `organisations.address_line1/2, city, state_code, postal_code` |
| `(1A)`–`(9)` | `payroll_lines`, column-for-column per the field list |

### Page 2 — the Statement of Compliance

Seven header fields, the three certifications **verbatim**, the apprenticeship block (3 printed
rows), the fringe-credit block (8 worker rows × 6 plan columns), the no-rebates statement, the
remarks box, the signature block, and the falsification warning citing 18 U.S.C. § 1001 and
31 U.S.C. § 3729.

**The certification text is a frozen constant in the codebase.** Gate **G5** is a byte-equality
test against `kb-samples/wh347-page2-statement-of-compliance.txt`. It is not template copy, it
is not translatable, and no one gets to improve its grammar.

## Data model

```ts
documents
  id                       uuid         primaryKey defaultRandom
  payroll_id               uuid         notNull references payrolls(id) on delete cascade
  kind                     text         notNull        // 'wh347' | 'statement_of_compliance'
  storage_key              text         notNull        // blob key
  byte_size                integer      notNull
  sha256                   char(64)     notNull
  page_count               integer      notNull
  // provenance, stamped in the footer of the PDF itself
  wd_number                text         notNull
  wd_modification_number   integer      notNull
  wd_publication_date      date         notNull
  form_revision            text         notNull default 'WH-347 Rev. January 2025'
  omb_control_number       text         notNull default '1235-0008'
  generator_version        text         notNull
  generated_at             timestamptz  notNull default now()
  unique (payroll_id, kind, generator_version)
  index (payroll_id)

document_share_links
  id                       uuid         primaryKey defaultRandom
  document_id              uuid         notNull references documents(id) on delete cascade
  token_hash               char(64)     notNull unique
  expires_at               timestamptz  notNull        // 7 days, re-issuable
  created_by_user_id       uuid         references users(id)
  accessed_count           integer      notNull default 0
  last_accessed_at         timestamptz                 // added 2026-09-03 (M10)
  revoked_at               timestamptz                 // added 2026-09-03 (M10) — a leaked link must be killable
  revoked_by_user_id       uuid         references users(id)
  created_at               timestamptz  notNull default now()
  index (document_id) where revoked_at is null
```

`document_share_links` is the second half of the WL-24 seam: a GC can be sent a link today, and
the roll-up tier later reads the same table.

### The share link is revocable, expiring and logged — and it is never permanent

**Changed 2026-09-03 (wave-1b iteration, finding M10).** `GET /api/share/:token` streams,
**unauthenticated**, a document containing worker names, last-four identifiers, hours and pay.
The design here — hashed token, 7-day expiry, access count — is sound; what was not sound was
`OFFER.md` bonus B5 promising *"a read-only link the GC can bookmark"*, i.e. permanence, with
nothing anywhere able to revoke a leaked one. The regulation forbids full SSNs on transmittals
precisely because this data travels; an unrevocable URL is the same risk in a new wrapper.

| rule | why |
|---|---|
| **7-day expiry stays**, and a link is **re-issuable** in one click from the payroll screen | The GC's real need is "send it again", not "keep it forever". `OFFER.md` B5 is reworded to a 7-day link you can re-issue. |
| **A visible "revoke" control** beside every live link, and a **"revoke all links on this payroll"** action | The answer to "I sent it to the wrong address" must exist before it is needed. |
| Every access **logged**: `accessed_count`, `last_accessed_at`, and `share_link_accessed {days_since_created}` | It is also the earliest signal of GC-tier demand (WL-24). |
| The share panel lists **live links with their expiry, access count and last access** | You cannot revoke what you cannot see. |
| The sharing mechanism is **stated on the privacy page** ([`WL-11`](WL-11-help-and-legal.md)) — what a link exposes, for how long, that it is unauthenticated, and how to revoke it | Sharing wage data by URL is a disclosure, and a privacy page that omits it is wrong. |

## Server actions / API

| name | effect |
|---|---|
| `previewPayroll(payrollId)` | renders the real generator to a watermarked PDF, streamed, **never stored** |
| `certifyAndGenerate(payrollId, official…)` | WL-05's `certifyPayroll` + enqueue `document.generate` |
| job `document.generate` | renders both PDFs, hashes, stores, writes `documents`. `dedupe_key` makes a re-run a no-op |
| `GET /api/documents/:id` | authenticated stream, `Content-Disposition: attachment` |
| `GET /api/share/:token` | unauthenticated stream against a live, **unexpired and unrevoked** `document_share_links` row; increments `accessed_count`, stamps `last_accessed_at` |
| `revokeShareLink({ id })` / `revokeAllShareLinks({ payrollId })` | stamps `revoked_at` and `revoked_by_user_id`. Takes effect on the **next request**, with no cache in front of the route *(M10)* |
| `reissueShareLink({ documentId })` | revokes the previous live link for that document and mints a new 7-day one, so "send it again" is one click and never means "leave the old one open" |
| `regenerateDocuments(payrollId)` | only when `generator_version` has moved; writes new `documents` rows and keeps the old ones |

**Renderer.** Deterministic PDF composition (a layout library producing PDF primitives, fonts
embedded as subsets, `CreationDate` pinned to `payrolls.certified_at`). **No headless browser** —
Vercel's serverless runtime has no Chromium, and a screenshot-based form is not reproducible.

## Validation rules

| # | rule |
|---|---|
| V1 | Generation requires `payrolls.status = 'certified'`. A draft can only be previewed, and the preview is always watermarked. |
| V2 | Column (1E) prints **exactly 4 characters**. There is no code path that can print more, because no column stores more (WL-04 gate G7). |
| V3 | The Statement of Compliance string is byte-identical to the committed sample. *(gate G5)* |
| V4 | Every generated PDF footer carries WD number, modification number, publication date, generation timestamp, form revision, OMB number, and the "reproduction, not an official DOL document" line. *(gate G8)* |
| V5 | Regenerating an unchanged certified payroll with the same `generator_version` produces the **same sha256**. |
| V6 | Page-2 fringe credits printed per worker sum to that worker's column (6B). *(WL-05 B9 is the input-side twin)* |
| V7 | Money renders to exactly 2 decimal places; hours to at most 2; no locale formatting, no thousands separators in currency cells — the form is a fixed-width grid. |
| V8 | A worker whose name overflows its cell is **wrapped**, never truncated. A truncated name on a certified payroll is a defective filing. |
| V9 | `no_work_performed` payrolls print the header, zero worker rows, and "NO WORK PERFORMED THIS PERIOD" across the grid, plus a full Statement of Compliance. |
| V10 | The generated PDF is text-based and selectable — an auditor must be able to search it. No rasterised pages. |
| V11 | **A share link is served only when `expires_at > now()` **and** `revoked_at is null`.** Both conditions are checked on every request; neither the route nor the CDN caches the response. A revoked or expired token 404s with no distinction between the two. *(M10)* |
| V12 | **No code path creates a share link without an `expires_at` ≤ 7 days**, and there is no "never expires" option, no configuration for one, and no admin override. Permanence is not a feature that can be switched on later by accident. *(M10)* |
| V13 | The payroll screen lists every live link for that payroll with its expiry, access count and last access, and a revoke control on each. *(M10)* |
| V14 | The **generated document footer names the pinned modification and, when the project is pinned to a superseded one, the existence of the newer modification** — so a shared PDF carries the same provenance the screen does. *(WL-02 V3b, gate G8, finding B3)* |

## Acceptance criteria

- **Given** a certified payroll with 3 workers, **when** generation completes, **then** two
  `documents` rows exist, the WH-347 is 2 pages, the Statement of Compliance is 1, and both
  carry sha256 and page count.
- **Given** the generated WH-347, **when** its text is extracted, **then** it contains
  `hdr.wage_determination_no` = the payroll's `wd_number`, the correct `payroll_number`, the
  week ending date, the organisation's legal name and address, and every worker's last-4.
- **Given** the generated Statement of Compliance, **when** its text is extracted, **then** all
  three certifications appear byte-identical to the committed sample, along with the no-rebates
  statement and the 18 U.S.C. § 1001 / 31 U.S.C. § 3729 warning.
- **Given** a 20-worker payroll, **when** it generates, **then** page 1 continues onto further
  pages of 8 rows each, each repeating the header block and numbered `Page n of m`, and
  `worker_entry_no` runs 1…20 unbroken.
- **Given** the same certified payroll, **when** generation runs twice, **then** the second run
  is a no-op and the sha256 is unchanged. *(V5, idempotence)*
- **Given** a worker with `identifying_no_last4 = '4821'`, **when** the PDF is extracted, **then**
  `4821` appears and no 9-digit sequence appears anywhere in the document. *(V2)*
- **Given** a `no_work_performed` payroll, **when** it generates, **then** both documents exist,
  the grid says so, and the payroll number is consumed. *(V9)*
- **Given** a worker with a $10.71 fringe credit split across two plans at $7.21 and $3.50,
  **when** page 2 renders, **then** both plans print with name, type, plan number, funded flag
  and hourly credit, and the row total reads $10.71. *(V6)*
- **Given** a draft payroll, **when** preview is requested, **then** the PDF carries
  `DRAFT — NOT FOR SUBMISSION` and nothing is written to `documents`. *(V1)*
- **Given** a share link, **when** it is opened after 7 days, **then** it 404s and no document
  is streamed.
- **Given** a live share link, **when** it is revoked and then opened, **then** it 404s
  identically to an expired one, no document is streamed, and no cached copy is served. *(V11)*
- **Given** a payroll with two live links, **when** "revoke all" is used, **then** both stop and
  `share_link_revoked` fires twice. *(V13)*
- **Given** `reissueShareLink`, **when** it runs, **then** the previous link is revoked in the
  same transaction and exactly one live link remains for that document.
- **Given** the codebase, **when** it is inspected, **then** no call site constructs a share link
  with an expiry beyond 7 days and no "never expires" branch exists. *(V12 — a test, because B5's
  copy used to promise the opposite)*
- **Given** a payroll on a project pinned to a **superseded** modification, **when** the WH-347's
  text is extracted, **then** the footer names that modification **and** the newer one's number
  and publication date. *(V14, B3)*

## Edge cases

| case | behaviour |
|---|---|
| **More than 8 workers** | Continuation pages of 8. The official form has no continuation convention; ours states one (repeated header, `Page n of m`, continuous entry numbers) and the help page documents it. |
| **More than 6 fringe plans for one worker** | Page 2 prints 6 plan columns. A 7th spills to a continuation of page 2 with the same header. Rare; must not silently drop a plan. |
| **More than 3 apprenticeship programs** | Same: the block continues rather than truncating. |
| **A very long classification label** (TX20260253's `ELEVATOR MECHANIC` with a 60-word footnote) | Column (3) prints the classification, wrapped; the footnote is not a form field and does not print. |
| **`ded_other` with a long note** | Printed in the (8c) cell, wrapped; if it will not fit, it moves to `ADDITIONAL REMARKS` with a `(8c): …` prefix and the cell shows "see remarks". Never silently dropped — the form says MUST SPECIFY. |
| **DOL publishes a new WH-347 revision** | Gate G5's sha256 check fails in CI, quarterly. The generator is versioned (`generator_version`); old documents keep the revision they were made under, which is correct — they were filed under it. |
| **OMB expiry 2028-01-31 passes** | A calendar item, surfaced on the WL-12 admin page from 90 days out. |
| **Zero-byte or corrupt render** | `documents` row is not written; the job retries; the payroll stays certified. A certified payroll with no PDF is recoverable; a wrong PDF is not. |
| **The organisation renames itself after certifying** | The PDF was rendered from the values at `certified_at` and is not regenerated. The stored PDF is the record. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Generation job fails | "Certified. Documents are still generating — we're retrying." Certification is never rolled back | `wh347_generation_failed {reason, attempt}` |
| Storage write fails | same, retried | `document_storage_failed` |
| Download of a missing blob | "That file is unavailable — regenerating now" + auto-enqueue | `document_blob_missing` |
| Share token invalid, expired **or revoked** | 404, no distinction between the three | `share_link_rejected {reason}` (server-side only — the response says nothing) |

## Analytics events

`payroll_certify_started` ·
**`wh347_generated {payroll_id, worker_count, page_count, wd_number, modification_number, generator_version}`
← THE ACTIVATION EVENT. Everything in [`../THRESHOLDS.md`](../THRESHOLDS.md) is measured against
the first occurrence of this event per organisation.** ·
`soc_generated` · `wh347_downloaded` · `soc_downloaded` · `both_downloaded` ·
`wh347_preview_viewed` · `wh347_regenerated {reason}` ·
`wh347_generation_failed {reason}` ·
`share_link_created` · `share_link_accessed {days_since_created}` ← the earliest possible signal
of GC-tier demand (WL-24) · `share_link_revoked`

**Names are canonical and defined once**, in [`WL-EVENTS.md`](WL-EVENTS.md) §5.

## Test plan

**Golden-file tests** — render a fixed 3-worker payroll and a fixed 20-worker payroll from
committed fixtures; assert the sha256 is stable across runs (V5) and diff the extracted text
against a committed expectation. A layout change that alters the output must be a deliberate,
reviewed diff.
**Gate G5** — byte-compare the certification constants against
`kb-samples/wh347-page2-statement-of-compliance.txt`, and the downloaded WH-347's sha256 against
`fa28f033a8250dc3c209fe9c8e7f5cfcde70f8f0cb11a6ab2486eaebdd5db557` (network step, nightly lane).
**Gate G8** — assert every generated PDF's extracted text contains the WD number, the
modification number and the publication date.
**Privacy test** — extract the text of every generated fixture and assert **no 9-digit sequence
and no `\d{3}-\d{2}-\d{4}` pattern appears**. This is 29 CFR 5.5(a)(3)(ii)(B) as a test.
**Integration (PGlite + mock storage)** — certify → job → two `documents` rows; re-run is a
no-op; a failed render leaves the payroll certified and the job retryable.
**E2E** — full journey to download, then open both PDFs with `pypdf` in the assertion step and
check the header fields, the worker rows and the three certifications.
