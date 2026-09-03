# Spec M15 — The Free Gap Report

**Backlog item:** M15 (Must). **Effort:** M. **Depends on:** M2 (templates), M4 (extraction),
M5 (comparison), M12 (report rendering). **Owned commercially by** `OFFER.md` §3 and §12.3, and by
`LANDING_SPEC.md` (it is the landing page's primary CTA).

> **Why this is a Must and not a marketing page.** `OFFER.md` makes the Free Gap Report the offer's
> front end — the high-value content offer that produces the finding that closes the sale — and
> `LANDING_SPEC.md` makes it the hero CTA. If it does not exist, the landing page has no primary
> action and the offer has no front end. It is also *cheap*: it is M4 + M5 + M12 with no account,
> which is why it clears the "would a stranger pay without it" bar in the other direction — a stranger
> gets here **before** they pay, and this is the path they arrive on.

## 1. Story

> As a property manager who has never heard of Certly, I drop up to 25 of my vendors' certificates onto
> a page, and a few minutes later I get a dated PDF telling me which ones have expired, which are short
> of a normal requirement, and which only *claim* the endorsements they need. I keep the report whether
> or not I ever sign up.

Suby's rule, quoted in `OFFER.md` §3: the front end must *solve a burning problem without asking for a
sale*. So the report is returned as a **finding, not a signup form**, and it is delivered whether or
not the visitor creates anything.

## 2. Flow

```
/gap-report
  1. pick who you are:  property manager · HOA manager · general contractor · commercial landlord
        → selects the default requirement template (M2). Editable in one control: "our suggested
          limits" vs "$1M/$2M baseline" vs "let me set the GL limits"
  2. drop up to 25 certificates (PDF or image)
  3. your email, so we can send the report        ← the ONLY thing asked for. No password, no card.
  4. processing screen with live progress (n of 25 read)
  5. the report: on screen immediately, and emailed as a PDF
  6. one CTA underneath: "Keep these vendors and start tracking them" → M1 signup, which
     carries the vendors, the certificates and the requirement set into a real org
```

Steps 4–5 run in the queue; a visitor who closes the tab still gets the email.

## 3. Screens

| screen | route | states |
|---|---|---|
| Landing form | `/gap-report` | idle · files added · over-25 · uploading · email needed |
| Processing | `/gap-report/[token]` | queued · reading (n/25) · done · partial (some rejected) |
| Report | same | the on-screen report + "email me a PDF" + the single conversion CTA |
| Emailed PDF | — | the M12 renderer, with a Free-Gap-Report cover |

**Design constraint:** no account UI anywhere on these screens. No "create a password", no nav bar, no
plan comparison. One CTA, below the finding, after the value has been delivered.

## 4. What the report says — and does not say

Same three states as M5 (`met` / `gap` / `asserted_only`), plus `not_checked`. It **never** says a
vendor "is not insured" or "is non-compliant". Rendering rules, all of them liability controls from
`OFFER.md` §7 L5:

- the §F.1 disclaimer **verbatim on page 1**, not a footer
- an explicit scope line: *"Read from the {n} documents you supplied on {date}. Compared against
  {template name}, a suggested starting point — not your contract."*
- the §F.2 template disclaimer next to the requirement summary
- the "Not checked by Certly" section, always (M12 §3.5)
- the headline is a count and a date, not a verdict: *"3 of 18 certificates have already expired.
  6 more claim endorsements the certificate does not evidence."*

## 5. Data model (Drizzle-ready)

```ts
gapReportSessions {
  id, token (hashed),                  // the URL is /gap-report/<token>
  email: citext,                       // captured at step 3
  audience,                            // 'pm'|'hoa'|'gc'|'tenant'
  templateId,                          // the library template used
  requirementsSnapshot: jsonb,         // the exact rows compared against — the report must be reproducible
  documentCount, extractedCount, rejectedCount,
  status,                              // 'collecting'|'processing'|'ready'|'expired'
  reportKey,                           // the rendered PDF
  convertedOrgId: uuid,                // set if they sign up
  createdAt, readyAt,
  purgeAt: timestamp                   // createdAt + 30 days
}
gapReportDocuments {
  id, sessionId, storageKey, mime, bytes, sha256,
  extractionId,                        // reuses extractions, with orgId null
  insuredNameRead: text, status
}
```

**No `organisations` row exists for a gap-report session.** Certly's tables are org-scoped by
invariant, so this surface uses its own two tables and sets `extractions.orgId` nullable **only** for
this path. That nullable column is the one concession, and it is worth naming in review.

## 6. Retention and deletion — the part that must be got right

`OFFER.md` promises "no storage of their file beyond the report". Implemented literally:

- **Uploaded documents are deleted from storage as soon as the report is rendered.** The extraction
  payload is kept (it is what the report is made of); the source PDFs are not.
- The session, the payload and the rendered PDF are **hard-deleted at `purgeAt` (30 days)** by a daily
  job, unless the visitor converted, in which case they are migrated into the new org at signup.
- The report link expires at 30 days with a page saying so.
- **A gap-report document is never added to the eval corpus**, never used as a fixture, and never
  looked at by a human. It is somebody's supplier's insurance document, given for one purpose.

## 7. Server actions / routes

| surface | signature | notes |
|---|---|---|
| `POST /api/gap-report/session` | `(audience) → { token }` | no auth; rate-limited by IP |
| `POST /api/gap-report/[token]/documents` | `(file) → { documentId }` | ≤ 25 per session; M4's file validation verbatim |
| `POST /api/gap-report/[token]/email` | `(email) → void` | starts processing |
| `GET /gap-report/[token]` | → status or report | |
| `convertSession` | `(token, orgId) → void` | called immediately after M1 signup from the report CTA; moves vendors, extractions and the requirement set into the new org |

## 8. Validation

- ≤ 25 documents per session, ≤ 20 MB each, ≤ 25 pages each (M4 §10)
- **rate limits:** 3 sessions per IP per day, 25 documents per session, 100 documents per IP per day.
  This surface spends real inference money on anonymous traffic — see §11
- email: valid shape; **added to no marketing list without a separate, explicit tick** (CAN-SPAM, and
  the offer's own "no demo, no call" promise)
- the requirement snapshot is written **before** comparison, so the report cannot be silently
  re-compared against different rules later
- a session with 0 successfully extracted documents produces an honest "we couldn't read any of these"
  page and an email offering another try — **never** an empty report

## 9. Acceptance criteria

**A1** Given 18 certificates and "property manager", When I submit my email, Then within 5 minutes the
report is on screen and in my inbox, and I was never asked for a password or a card.
**A2** Given 3 of them have expired, Then the headline names the count and the date, and the three
vendors are listed first.
**A3** Given a certificate with `ADDL INSD = Y` and no endorsement page, Then the report says
"claimed, not evidenced" — and the words *compliant*, *covered* and *verified* appear nowhere.
**A4** Given the report, Then page 1 carries the §F.1 disclaimer verbatim, the scope line with the
document count and date, and the §F.2 template disclaimer next to the requirements.
**A5** Given I close the tab during processing, Then the emailed PDF still arrives.
**A6** Given the report is rendered, Then the uploaded source documents are deleted from storage within
the same job, and a subsequent read of their storage keys 404s.
**A7** Given 30 days pass without conversion, Then the session, extraction payloads and PDF are
hard-deleted and the link shows an expiry page.
**A8** Given I click "keep these vendors" and sign up, Then the new org contains those vendors, their
certificates' extraction records, and the requirement set the report used — and I land on the dashboard
already populated, **not** on an empty onboarding checklist.
**A9** Given I upload 26 files, Then the 26th is refused with "the free report covers 25 — start a
trial to track more", and the first 25 still process.
**A10** Given none of my files are readable, Then I get an honest page and email, and no report PDF.
**A11** Given a fourth session from the same IP in one day, Then it is refused with a message pointing
at the trial, and no inference is spent.

## 10. Edge cases

| case | behaviour |
|---|---|
| Visitor uploads a subcontract instead of a certificate | rejected per M4 with a specific message; counted in `rejectedCount`; the report says how many were not certificates |
| All 25 are the same file | per-session sha dedupe; the report says so |
| Visitor's email bounces | the on-screen report still works for 30 days; no retry loop |
| Visitor signs up with a *different* email from the report | conversion still works from the token in the CTA link; the report email is not the identity |
| Visitor converts after 30 days | the session is gone; the signup is a normal empty one, and the page says the report expired |
| Two sessions converted into one org | both migrate; vendors dedupe by normalised name |

## 11. The cost control, stated openly

This surface spends inference on anonymous visitors. `OFFER.md` §4 B5 budgets **~$0.50 per report**
(25 certificates × ~$0.02); spec 03's own modelled figure is $0.10–0.20 per *document*, which would
make a full 25-document report **$2.50–5.00**, not $0.50.

**Those two numbers disagree, and the disagreement is real.** The controls, in order:
1. the rate limits in §8 bound the worst case to **300 documents per IP per day**;
2. gap-report extractions run through the **Message Batches API (50% cost)** — this surface is not
   latency-critical, a five-minute delivery is expected and even reassuring;
3. `gap_report_cost_cents` is on the admin dashboard from day one (M14 §3.3), with a **daily spend cap
   that disables new sessions** and shows "the free report is at capacity today — start a trial"
   rather than silently overspending;
4. the true per-report cost retires `H-EC-1` in `THRESHOLDS.md` §5 within the first week of traffic,
   and the founder decides then whether 25 is the right cap.

Shipping this without the cap would be the single easiest way to lose money on Certly.

## 12. Analytics

`gap_report_started{audience}`, `gap_report_files_added{n}`, `gap_report_email_captured`,
`gap_report_processing{documents}`, `gap_report_ready{documents,extracted,rejected,expired_found,
gaps_found,asserted_only_found,cost_cents,ms}`, `gap_report_viewed`, `gap_report_emailed`,
`gap_report_cta_clicked`, `gap_report_converted{minutes_from_ready}`, `gap_report_rate_limited`,
`gap_report_capacity_disabled`.

**`gap_report_ready.expired_found` is the direct test of `H-GTM-1`** — the dossier's claim that a free
audit "reliably surfaces an already-expired policy". This surface measures it on strangers' real
documents, in week one, which is far better evidence than anything we could get from our own corpus.
**`gap_report_cta_clicked → gap_report_converted`** is the offer's front-end-to-core conversion and
belongs on the same admin panel as `THRESHOLDS.md` §1.

## 13. Test plan

Unit: session token; the 25/20 MB/25-page caps; rate limiters; the requirement snapshot is written
before comparison; the purge job selects exactly the sessions past `purgeAt` and not converted ones.
Integration (PGlite): a full session end to end on 3 corpus fixtures; source documents deleted after
render; conversion migrates vendors, extractions and requirements into a new org with correct `orgId`
on every row.
Security: a session token grants access to that session only; `extractions.orgId IS NULL` rows are
unreachable from any org-scoped query (an explicit test, because that nullable column is the one hole
in the org-scoping invariant).
Content: page 1 of the PDF contains the §F.1 text verbatim; the strings "compliant", "covered" and
"verified" appear nowhere in the rendered report.
e2e: drop 3 fixtures → email → processing → report → CTA → signup → dashboard already populated.
