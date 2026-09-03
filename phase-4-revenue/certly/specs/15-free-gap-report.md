# Spec M15 — The Free Gap Report

**Backlog item:** M15 (Must). **Effort:** M. **Depends on:** M2 (templates), M4 (extraction),
M5 (comparison), M12 (report rendering). **Owned commercially by** `OFFER.md` §3 and §12.3, and by
`LANDING_SPEC.md` (it is the landing page's primary CTA).

> ### LAUNCH GATE — read before building anything on this page
>
> This surface is the **one place {PRODUCT_NAME} holds a third party's documents with no contract and
> no relationship**. `offer/RESEARCH.md` §7 and `LANDING_SPEC.md` §8.2 both say it needs a **legal
> read, not an engineering decision**, and `OFFER.md` §13.3 Q2 still lists it as an open founder
> question while `BACKLOG.md` lists it as a Must (REVIEW.md B-07).
>
> **Ruling (REVIEW.md §2.6, applied here):** M15 stays a Must and ships **under** the
> `offer/RESEARCH.md` §7 conditions rather than around them — see §6.1 for the condition-by-condition
> reconciliation. The founder's legal read is a **launch gate, not a preference**:
>
> - **Until the legal read lands**, the landing page ships with the **samples-only demo as its single
>   hero CTA** and the Free Gap Report behind a **waitlist line**, not an upload box
>   (`LANDING_SPEC.md` §3/§8). Nothing is accepted from a stranger.
> - **After it lands**, the hero CTA becomes "Get a free Gap Report" and this spec is live as written.
>
> Both states have exactly one hero CTA (REVIEW.md MJ-04). Nothing else in the page changes, and the
> word budget is identical either way.

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
  2. drop up to 25 certificates (PDF or image) — uploaded **browser-direct** to Blob with a
     short-lived token (specs/03 §9), never through a route handler
     ↳ the retention terms render **in body text next to the drop zone**, not behind a link:
       "We read these to make your report and then delete them. The files themselves are deleted the
        moment the report is built. The reading and the report are deleted after 7 days. We never
        record the agent's name, phone or email from your certificates. We never train on them."
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

The **same five requirement states as M5** (`met` / `gap` / `asserted_only` / `not_checked` /
`undetermined`), with the same words: the green one is **"Meets requirements"**, never "Covered"
(REVIEW.md B-02, §2.2). It **never** says a vendor "is not insured" or "is non-compliant".
Rendering rules, all of them liability controls from `OFFER.md` §7 L5:

- the §F.1 disclaimer **verbatim on page 1**, not a footer
- an explicit scope line: *"Read from the {n} documents you supplied on {date}. Compared against
  {template name}, a suggested starting point — not your contract."*
- the §F.2 template disclaimer next to the requirement summary
- the "Not checked by Certly" section, always (M12 §3.5)
- **"Read, but not confident enough to compare ({k})"** — a required section, see §4.1
- the headline is a count and a date, not a verdict, and it states **both** counts: *"We compared 12
  of the 18 certificates you sent. 3 of those have already expired, and 6 more claim endorsements the
  certificate does not evidence. The other 6 we read but could not compare — they are listed on
  page 4."*

### 4.1 The documents we could not compare — a required section (REVIEW.md B-09)

`specs/05` §7: *a comparison requires a `ready` extraction; `needs_review` extractions are not
compared.* `specs/03` §8 sends a document to `needs_review` on six triggers, and `THRESHOLDS.md`
§4.2 budgets a review rate of **up to 30% as PERSEVERE**. In the product a human clears that queue.
**On this page there is no human and no account, so those documents can never be compared** — and
without this section a stranger who uploads 18 certificates silently gets a report about 12.

That is exactly the dishonesty `specs/12` §3.5 exists to prevent, so the report must say it:

- a section listing **every** `needs_review` document by the file name the visitor gave it and, where
  we read one, the insured name we read;
- **the reason in words**, per document, taken from the trigger: "the expiry date was hard to read",
  "we could not find the text we read this from on the page", "this does not look like an ACORD 25
  certificate of liability insurance", "two coverage rows disagree about the expiry date";
- the count in the headline, both numbers, as above;
- and the honest line that makes it a selling point rather than an embarrassment: *"We would rather
  tell you we are unsure than guess. In the product these go to a review queue where you correct them
  in one click."*

## 5. Data model (Drizzle-ready) — buildable, and here is why the first draft was not

The first draft said this path *"sets `extractions.orgId` nullable **only** for this path"* and stored
files in `gapReportDocuments`. **No row could ever have been inserted** (REVIEW.md B-08):
`specs/03` §4 declared `extractions.documentId` as `notNull().references(documents.id)`, and
`documents.orgId` is itself `notNull` referencing `organisations` — and a gap-report session has no
`organisations` row and no `documents` row.

**Chosen fix: option (a) — one extraction table with two possible owners**, because it keeps one
extraction table and therefore **one eval pipeline** (`specs/03` §15). Option (b), giving each session
a real `organisations` row flagged `is_ephemeral`, was rejected: it preserves the org-scoping
invariant at the cost of polluting `organisations` and every funnel query in M14, which is a worse
trade than one CHECK constraint.

```ts
gapReportSessions {
  id, tokenHash,                       // the URL is /gap-report/<token>; the raw token is never stored
  email: citext,                       // captured at step 3
  audience,                            // 'pm'|'hoa'|'gc'|'tenant'
  templateId,                          // the library template used
  requirementsSnapshot: jsonb,         // the exact rows compared against — the report must be reproducible
  documentCount, extractedCount, comparedCount, needsReviewCount, rejectedCount,
  status,                              // 'collecting'|'processing'|'ready'|'purged'
  reportKey,                           // DocumentStore key for the rendered PDF
  convertedOrgId: uuid,                // set if they sign up
  createdAt, readyAt,
  purgeAt: timestamp                   // createdAt + 7 DAYS  (§6)
}

gapReportDocuments {
  id, sessionId, storageKey, mime, bytes, sha256,
  originalFilename: text,              // what the visitor called it — needed by §4.1 to name it back
  insuredNameRead: text,               // the vendor name, so the report is readable
  status,                              // 'uploaded'|'extracting'|'ready'|'needs_review'|'rejected'
  storageDeletedAt: timestamp          // set inside the render job (§6)
}
```

**Changes in `specs/03` §4, made there:** `extractions.documentId` and `extractions.orgId` become
nullable, `extractions.gapReportDocumentId` is added, and a CHECK constraint enforces **exactly one
owner**:

```
(document_id IS NOT NULL AND org_id IS NOT NULL AND gap_report_document_id IS NULL)
OR (document_id IS NULL AND org_id IS NULL AND gap_report_document_id IS NOT NULL)
```

`field_corrections` is unreachable on this path by construction: nobody reviews a gap-report
extraction, so no correction row can exist for one.

### 5.1 Producer personal data is never stored on this path (REVIEW.md B-07, §2.6)

`KNOWLEDGE_BASE.md` §A.3 annotates `producer.contact_name` *"often a real individual"*, and the
schema also carries `producer.phone`, `producer.fax` and `producer.email`. **The free report never
chases anyone, so it never needs them.**

The extraction call is unchanged — the schema is one file and does not fork — but a **strip step runs
between the model response and the database on this path, and only on this path**:

```ts
// src/lib/gap-report/strip.ts — runs before any persistence, in the same job
payload.producer.contact_name = nullField;   // {value:null, raw:null, page:null, source_text:null, confidence:0}
payload.producer.phone        = nullField;
payload.producer.fax          = nullField;
payload.producer.email        = nullField;
```

The producer's **agency name** survives (it is an organisation, and the report needs to say which
agency issued the certificate). A test asserts that no `gapReportSessions`-owned extraction payload
contains a non-null value at those four paths, and the redacted-names test in `specs/03` §15.3 covers
the corpus side of the same rule.

## 6. Retention and deletion — the part that must be got right

`OFFER.md` promises "no storage of their file beyond the report". Implemented literally, and tighter
than the first draft:

- **Uploaded documents are deleted from storage inside the render job**, as soon as the report is
  rendered. `storageDeletedAt` records it. The extraction payload is kept because it is what the
  report is made of; the source PDFs are not.
- **The producer's contact name, phone, fax and email are never persisted at all** (§5.1).
- The session, the payload and the rendered PDF are **hard-deleted at `purgeAt` = createdAt + 7 days**
  by a daily job, unless the visitor converted, in which case they are migrated into the new org at
  signup. **7 days, not 30** (REVIEW.md B-07): 30 days was 30× the retention `offer/RESEARCH.md` §7
  authorised, on data belonging to people who never agreed to anything.
- **The 7-day number is printed next to the drop zone in body text**, before a file is chosen — not
  behind a link (`offer/RESEARCH.md` §7's own condition), and again on the report page and in the
  email.
- The report link expires at 7 days with a page saying so and offering a fresh run.
- **A gap-report document is never added to the eval corpus**, never used as a fixture, never used for
  training, and never looked at by a human. It is somebody's supplier's insurance document, given for
  one purpose.

### 6.1 Reconciliation with `offer/RESEARCH.md` §7's eight conditions

§7 wrote its eight conditions for the **hero demo's** upload variant — a one-file "watch it read this"
interaction. M15 is a different surface with a different promise (a portfolio report), so three of the
eight are met by a **reduced variant**, and the reduction is justified here rather than assumed
(REVIEW.md B-07). The other five are met as written.

| # | `offer/RESEARCH.md` §7 condition | M15 | why the difference is defensible |
|---|---|---|---|
| 1 | **PDF only** | **PDF, JPEG, PNG, HEIC** | the buyer's certificates arrive as phone photos; refusing images makes the report unusable for the half of the market that photographs paper. The file type changes nothing about the data-protection question — it is the *content* that is third-party data, and every other control below applies identically |
| 2 | **One file** | **up to 25 files, ≤ 20 MB and ≤ 25 pages each, ≤ 50 MB per session** | the promise is a *portfolio* finding ("3 of your 18 have expired"); one file cannot produce it, and the whole offer front end collapses to the demo, which we already have. The exposure is bounded instead by the caps, by the rate limits in §8 and by the spend cap in §11 |
| 3 | **≤ 5 MB** | ≤ 20 MB per file, matching M4 | the same validator as the product, so there is one rule to reason about; the session total is capped at 50 MB |
| 4 | **Processed in memory** | **written to Blob, deleted inside the render job** | a browser-direct upload of a 20 MB scan cannot go through a Vercel Function's request body at all (MJ-17), and holding 25 files in a function's memory is not achievable on this platform. The property §7 actually wanted — *the file does not outlive the job* — is preserved and is now **testable** (A6) rather than assumed |
| 5 | **Deleted within 24 hours** | **source files: minutes** (inside the render job). **Extraction payload and report: 7 days** | strictly better than 24 hours for the documents themselves. The payload has to outlive the job or the visitor cannot re-open their own report, which is the deliverable; 7 days is the shortest window that makes "you keep the report" true |
| 6 | **Never used for training** | as written | §6 |
| 7 | **No account created** | as written | §3 |
| 8 | **Rate-limited by IP** | as written, plus a daily spend cap | §8, §11 |
| — | *added here* | **no producer personal data stored at all** | §5.1 — a condition §7 did not think of, and the one that most reduces what we are holding |

**If the founder's legal read rejects the reduced variant**, the fallback that needs no new code is the
strict §7 shape: one file, ≤ 5 MB, PDF only, 24-hour purge — which is the samples-only demo plus a
single upload, and the landing page's waitlist state already covers the gap.

## 7. Server actions / routes

| surface | signature | notes |
|---|---|---|
| `POST /api/gap-report/session` | `(audience) → { token }` | no auth; rate-limited by IP |
| `POST /api/gap-report/[token]/upload-token` | `({filename, mime, bytes}) → { uploadUrl, key }` | short-lived, single-use, key-scoped Vercel Blob client-upload token; the browser PUTs straight to Blob (`specs/03` §9, REVIEW.md MJ-17) |
| `POST /api/gap-report/[token]/documents` | `(key, sha256, originalFilename) → { documentId }` | ≤ 25 per session; the server re-reads size and content type from the object; M4's file validation verbatim |
| `POST /api/gap-report/[token]/email` | `(email) → void` | starts processing |
| `GET /gap-report/[token]` | → status or report | |
| `convertSession` | `(token, orgId) → void` | called immediately after M1 signup from the report CTA; moves vendors, extractions and the requirement set into the new org |

## 8. Validation

- ≤ 25 documents per session, ≤ 20 MB each, ≤ 25 pages each (M4 §10), **≤ 50 MB per session**
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
"claimed, not evidenced" — and the words *compliant*, *covered* and *verified* appear nowhere. The
green state reads **"Meets requirements"** (REVIEW.md B-02).
**A4** Given the report, Then page 1 carries the §F.1 disclaimer verbatim, the scope line with the
document count and date, and the §F.2 template disclaimer next to the requirements.
**A5** Given I close the tab during processing, Then the emailed PDF still arrives.
**A6** Given the report is rendered, Then the uploaded source documents are deleted from storage within
the same job, `storageDeletedAt` is set, and a subsequent read of their storage keys 404s.
**A7** Given **7 days** pass without conversion, Then the session, extraction payloads and PDF are
hard-deleted and the link shows an expiry page offering a fresh run.
**A7b** Given any gap-report extraction, Then `producer.contact_name`, `producer.phone`,
`producer.fax` and `producer.email` are null in the stored payload, and the producer's **agency name**
is present (§5.1, REVIEW.md B-07).
**A7c** Given the upload screen before any file is chosen, Then the retention terms — including the
words "deleted after 7 days" — are in the DOM **as body text adjacent to the drop zone**, not inside a
link or a collapsed element (`offer/RESEARCH.md` §7).
**A7d** Given a gap-report session, Then exactly one of `documentId` / `gapReportDocumentId` is set on
every `extractions` row it owns, `orgId` is null, and the insert succeeds (§5, REVIEW.md B-08).
**A8** Given I click "keep these vendors" and sign up, Then the new org contains those vendors, their
certificates' extraction records, and the requirement set the report used — and I land on the dashboard
already populated, **not** on an empty onboarding checklist.
**A9** Given I upload 26 files, Then the 26th is refused with "the free report covers 25 — start a
trial to track more", and the first 25 still process.
**A10** Given none of my files are readable, Then I get an honest page and email, and no report PDF.
**A12** Given 18 documents of which **6 land in `needs_review`**, Then the report compares 12, names
the 6 in the "Read, but not confident enough to compare" section with a reason in words for each, and
the **headline states both counts** (§4.1, REVIEW.md B-09).
**A13** Given the founder's legal read has not landed, Then `/gap-report` is not reachable from the
landing page: the hero CTA is the samples-only demo and the Gap Report appears as a waitlist line
(launch gate at the head of this spec).
**A11** Given a fourth session from the same IP in one day, Then it is refused with a message pointing
at the trial, and no inference is spent.

## 10. Edge cases

| case | behaviour |
|---|---|
| Visitor uploads a subcontract instead of a certificate | rejected per M4 with a specific message; counted in `rejectedCount`; the report says how many were not certificates, distinctly from the §4.1 "could not compare" count |
| All 25 are the same file | per-session sha dedupe; the report says so |
| Visitor's email bounces | the on-screen report still works for 7 days; no retry loop |
| Visitor signs up with a *different* email from the report | conversion still works from the token in the CTA link; the report email is not the identity |
| Visitor converts after 7 days | the session is gone; the signup is a normal empty one, and the page says the report expired |
| Two sessions converted into one org | both migrate; vendors dedupe by normalised name |

## 11. The cost control, stated openly

This surface spends inference on anonymous visitors. `OFFER.md` §4 B5 budgets **~$0.50 per report**
(25 certificates × ~$0.02); spec 03's own modelled figure is $0.10–0.20 per *document*, which would
make a full 25-document report **$2.50–5.00**, not $0.50.

**Those two numbers disagree, and the disagreement is real.** The controls, in order:
1. the rate limits in §8 bound the worst case to **300 documents per IP per day**;
2. gap-report extractions run through the **Message Batches API (50% cost)** — this surface is not
   latency-critical, a five-minute delivery is expected and even reassuring;
3. **`gap_report_ready.cost_cents`** is on the admin dashboard from day one (M14 §3.3), with a
   **daily spend cap that disables new sessions** and shows "the free report is at capacity today —
   start a 14-day trial" rather than silently overspending. *(One name, everywhere: `THRESHOLDS.md`
   §5 and §12 below use the same one — REVIEW.md MN-01.)*
4. the true per-report cost retires `H-EC-1` in `THRESHOLDS.md` §5 within the first week of traffic,
   and the founder decides then whether 25 is the right cap.

Shipping this without the cap would be the single easiest way to lose money on Certly.

## 12. Analytics

`gap_report_started{audience}`, `gap_report_files_added{n}`, `gap_report_email_captured`,
`gap_report_processing{documents}`, `gap_report_ready{documents,extracted,compared,needs_review,
rejected,expired_found,gaps_found,asserted_only_found,cost_cents,ms}`, `gap_report_viewed`,
`gap_report_emailed`,
`gap_report_cta_clicked`, `gap_report_converted{minutes_from_ready}`, `gap_report_rate_limited`,
`gap_report_capacity_disabled`.

**`gap_report_ready.expired_found` is the direct test of `H-GTM-1`** — the dossier's claim that a free
audit "reliably surfaces an already-expired policy". This surface measures it on strangers' real
documents, in week one, which is far better evidence than anything we could get from our own corpus.
**`gap_report_cta_clicked → gap_report_converted`** is the offer's front-end-to-core conversion and
belongs on the same admin panel as `THRESHOLDS.md` §1.

## 13. Test plan

Unit: session token; the 25 / 20 MB / 25-page / 50 MB-per-session caps; rate limiters; the requirement
snapshot is written before comparison; the strip step in §5.1 nulls all four producer contact fields;
the purge job selects exactly the sessions past `purgeAt` (7 days) and not converted ones.
Integration (PGlite): a full session end to end on 3 corpus fixtures; source documents deleted after
render; conversion migrates vendors, extractions and requirements into a new org with correct `orgId`
on every row.
Security: a session token grants access to that session only; the CHECK constraint in §5 rejects a row
with two owners or none; **`extractions` rows with `gap_report_document_id IS NOT NULL` are
unreachable from every org-scoped query** (an explicit test over each repository method, because that
nullable pair is the one hole in the org-scoping invariant — REVIEW.md B-08); no stored gap-report
payload contains a producer contact name, phone, fax or email.
Content: page 1 of the PDF contains the §F.1 text verbatim (this page and the on-screen report are two
of the eleven disclaimer surfaces in KB §F); the strings "compliant", "covered" and "verified" appear
nowhere in the rendered report; the §4.1 section appears whenever `needsReviewCount > 0` and the
headline carries both counts.
e2e: drop 3 fixtures → email → processing → report → CTA → signup → dashboard already populated.
