# Spec M12 — Gap report export (PDF + CSV)

**Backlog item:** M12 (Must). **Effort:** M. **Depends on:** M5, M6; `KNOWLEDGE_BASE.md` §F.

## 1. Story

> As a manager whose owner asked for evidence, I generate a dated report showing every vendor, every
> requirement, what is met, what is only claimed, what is a gap and what Certly did not check — and I
> forward it.

This is differentiator **D2** (`BACKLOG.md` §0). Competitors sell a dashboard; a dashboard cannot be
forwarded to a board, an owner, a lender or an insurer. **The artefact that gets forwarded is the
artefact that sells the next seat.**

## 2. Flow

```
/dashboard or /vendors → "Export"
   → scope:  all vendors · current filter · selected vendors · one vendor
   → format: PDF (the forwardable one) · CSV (the spreadsheet one)
   → generate (job if > 100 vendors) → download
   → optional: a shareable read-only link, expiring, revocable
```

## 3. The PDF, in order — the order is the spec

1. **Cover** — customer org name and entity block, report date and time with timezone, scope, and the
   **six** counts, using the canonical vendor-state labels from `specs/06` §3 and `specs/05` §2:
   **Expired / Gaps / Expiring 30d / Claimed, not evidenced / Meets requirements / No certificate**.
   The six are mutually exclusive and sum to the scope's vendor count. The word **"Covered" does not
   appear in a Certly report** (REVIEW.md B-02).
2. **The §F.1 disclaimer, on the cover.** Not in a footnote. A report that travels away from the app
   must carry its own limits.
3. **Summary table** — one row per vendor: name, type, status, earliest required expiry, gap count.
4. **Detail, one block per non-compliant vendor** — requirement, required value, found value **as
   printed** (`raw`), state, and the explanation sentence from M5.
5. **"Not checked by Certly"** — its own section, listing every `not_checked` requirement (carrier
   rating today). **Never omitted, never folded into a green count.** A report that hides what it did
   not check is the failure mode this whole product exists to correct.
6. **"Read, but not confident enough to compare (n)"** — its own section whenever any of the scope's
   documents is in `needs_review`: the vendor, the document, and the reason in words. Same rule as
   item 5 and the same reason: a report that silently drops part of its input is not evidence
   (REVIEW.md B-09).
7. **Provenance appendix** — for every vendor: the certificate's issue date, the document filename and
   upload date, `extractionId`, `requirementSetVersion`, `engineVersion`, and, for each template-derived
   requirement, its `source_url` and `last_verified` date.

Section 7 is what makes the report defensible under questioning, and it is the part no competitor
ships. It costs almost nothing to produce and it is the difference between "the software says so" and
"here is exactly what was compared, against what, on what date".

## 4. The CSV

One row per (vendor × requirement). Columns:
`vendor_name, vendor_type, external_ref, vendor_status, requirement_kind, coverage, requirement_label,
required_value, found_value_raw, found_amount, found_label_raw, state, conditional, explanation,
policy_number, policy_exp, certificate_date, insurer, document_filename, extraction_id,
requirement_set_version, engine_version, evaluated_at`

`vendor_status` takes one of the six canonical values (`expired`, `gap`, `expiring`,
`asserted_only`, `meets`, `no_certificate`) and `state` one of the five requirement values (`met`,
`gap`, `asserted_only`, `not_checked`, `undetermined`). **This CSV is forwarded to owners, lenders
and auditors, so the vocabulary in it is the vocabulary everywhere else** (REVIEW.md B-02, §2.2).
`found_label_raw` carries the printed limit label for `OTHER:` rows (MJ-18).

Long format, not wide, because the customer's next move is a pivot table and their spreadsheet has to
be able to make one.

## 5. Screens

| screen | route | states |
|---|---|---|
| Export dialog | modal from dashboard/vendor list | scope · format · generating · ready · failed |
| Report history | `/reports` | last 50, with scope, format, who generated it, size; regenerate; revoke a share link |
| Shared report | `/r/[token]` | read-only HTML rendering of the same content; expiring; no app chrome, no login |

## 6. Data model (Drizzle-ready)

```ts
reports {
  id, orgId, createdBy,
  scope: jsonb,            // {kind:'all'|'filter'|'selection'|'vendor', filter?, vendorIds?}
  format,                  // 'pdf' | 'csv'
  status,                  // 'queued'|'generating'|'ready'|'failed'
  storageKey, bytes,                    // DocumentStore key (Vercel Blob behind the interface,
                                        // specs/03 §9); downloads are signed URLs, never bytes
                                        // through a route handler
  vendorCount, gapCount, assertedOnlyCount, notCheckedCount, needsReviewCount,
  engineVersion,
  shareTokenHash, shareExpiresAt, shareRevokedAt,
  generatedAt, createdAt
}
```

**Reports are immutable snapshots.** Regenerating creates a new row. A report someone forwarded in March
must still say in June what it said in March — otherwise it is not evidence.

## 7. Server actions

| action | signature |
|---|---|
| `createReport` | `(scope, format) → reportId` — synchronous under 100 vendors, job above |
| `getReport` | `(reportId) → ReportView` |
| `downloadReport` | `(reportId) → signed URL, 5-minute TTL` |
| `createShareLink` | `(reportId, days) → { url }` — max 90 days |
| `revokeShareLink` | `(reportId) → void` |

## 8. Validation

- org-scoped; a report can only include vendors of that org
- scope `selection` ≤ 1,000 vendors
- PDF rendering runs in the job runner, never in the request path
- share token: 32 random bytes, hashed at rest, rate-limited, revocable, default 30 days
- the shared HTML view exposes **only** the report content — no navigation, no other org data, no
  user names beyond the generator's, no cost or plan information
- **read-only orgs (M10 §4) can still generate and download reports.** Their compliance record is
  theirs

## 9. Acceptance criteria

**A1** Given 80 vendors with 7 gaps, When I export a PDF for all vendors, Then the cover counts match
the dashboard counters exactly, and 7 vendors have detail blocks.
**A2** Given a requirement in `asserted_only`, Then the detail block says "claimed on the certificate,
not evidenced by an endorsement" — and the words "compliant", "covered" and "verified" appear nowhere
in the rendered report, in either format (an explicit string test — REVIEW.md B-02).
**A3** Given a carrier-rating requirement, Then it appears under "Not checked by Certly" with the
reason, in every report, in both formats.
**A4** Given any PDF, Then the §F.1 disclaimer is on the cover page and the provenance appendix lists
`extractionId`, `requirementSetVersion` and `engineVersion` for every vendor.
**A5** Given a CSV export, Then there is one row per (vendor × requirement) and `found_value_raw`
carries the printed text (e.g. `Excluded`, `X $100,000 SIR`), not a coerced number.
**A6** Given I create a share link and open it in a private window, Then the report renders without a
login and no other org data is present in the DOM or in any request the page makes.
**A7** Given I revoke a share link, Then the URL returns an expired page immediately.
**A8** Given a requirement set changed after a report was generated, Then the report still shows the
version it was generated against and the date.
**A9** Given a read-only org, Then export still works.
**A11** Given a scope containing 6 vendors whose only certificate is in `needs_review`, Then the
report lists them in §3 item 6 with the reason, the cover counts them under
"No certificate", and no such vendor appears in a green count.
**A12** Given a shared report at `/r/[token]`, Then the §F.1 disclaimer is present verbatim — the
shared link is one of the eleven disclaimer surfaces in KB §F (REVIEW.md MJ-06).
**A10** Given 1,000 vendors, Then the PDF generates in under 60 seconds as a job with visible progress.

## 10. Edge cases

| case | behaviour |
|---|---|
| A vendor with no certificate at all | included, status "no certificate received", in its own summary section |
| A vendor whose extraction is `needs_review` | included as "certificate received, not yet reviewed", listed in §3 item 6, counted under `no_certificate` — never counted as meeting requirements |
| Very long Description of Operations | truncated in the PDF with "…" and printed in full in the CSV |
| Non-Latin characters in a vendor name | embedded font covers Latin-1 + common punctuation; fall back to a system font and never to `?` |
| Report generated during a re-evaluation | snapshots the comparison rows at generation time; a note records that a re-evaluation was in flight |
| 0 vendors | a valid report saying so — a customer proving they have nothing outstanding is a real use |

## 11. Errors

Generation failure → status `failed` with a reason and a retry; the download button never yields a
corrupt file. Storage failure → retry ×3, then fail with an admin alert.

## 12. Analytics

`export_dialog_opened{source}`, `report_generated{format,scope,vendors,gaps,asserted_only,not_checked,ms}`,
`report_downloaded{format}`, `report_share_created{days}`, `report_share_opened{unique_viewers}`,
`report_share_revoked`, `report_failed{reason}`.

**`report_share_opened` is the closest thing to a viral coefficient this product has.** A report opened
by someone who is not a user is a named person at a company who has now seen Certly's output in a
context where it mattered. It is the leading indicator worth watching in `THRESHOLDS.md` §6.

## 13. Test plan

Unit: the report data assembler shares **one predicate module** with the dashboard counters (M6) — a
test asserts both call it, so cover counts can never disagree with the screen.
Snapshot: PDF rendered from a fixed fixture; assert section order, the disclaimer's presence on page 1,
and the "Not checked" section's presence when a `not_checked` result exists.
CSV: shape and escaping (commas, quotes, newlines inside `explanation`); `found_value_raw` fidelity.
Security: shared report contains no field outside the allowlist (explicit test over the serialised
props); revoked and expired tokens return identical responses.
e2e: dashboard → export PDF → download → open share link in a clean context → revoke → link dead.
