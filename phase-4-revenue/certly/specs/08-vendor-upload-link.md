# Spec M8 — Branded vendor upload link (no account)

**Backlog item:** M8 (Must). **Effort:** M. **Depends on:** M2, M4.

## 1. Story

> As the insurance agent for one of my client's vendors, I click the link in the email, see on one page
> exactly what this customer requires, drop in the PDF, and I am done. I never create an account and I
> never call anyone.

A reminder that leads to a login wall does not get answered. This is what makes M7 convert, and it is
also the cheapest 80% of "forward by email" (`SH-1`).

## 2. Flow

```
reminder email (M7) → https://certly.app/u/<token>
   → validate token: exists · not expired · vendor not archived
   → page: {Customer org} needs a current certificate for {Vendor}
            • what expired / what is required (plain language)
            • drop zone (PDF, JPEG, PNG, HEIC)
   → upload → M4 extraction runs → "Thanks. We've received it."
   → if the new certificate still has gaps: show them, in plain language, with an "upload a corrected
     certificate" affordance — the agent is the one person who can fix it right now
```

## 3. Screens

| screen | route | states |
|---|---|---|
| Upload page | `/u/[token]` | valid · expired · used-and-still-valid · revoked · vendor-archived · uploading · extracting · received · received-with-gaps |
| Confirmation | same | receipt with what was received and when; no account offered, no upsell |

**Design constraints, and they are constraints:** works on a phone (agents forward these to whoever has
the PDF); no login; no cookie required; the customer's org name is the most prominent thing on the page
(the agent must recognise *whose* request this is); Certly's own brand is a footer line.

## 4. Data model (Drizzle-ready)

```ts
uploadLinks {
  id, orgId, vendorId,
  tokenHash: text notNull,      // SHA-256; the raw token exists only in the email
  expiresAt: timestamp,         // default: expiry + 45 days, min 30 days from creation
  createdBy: uuid,              // null when created by the reminder job
  createdFor: text,             // 'reminder:T-30' | 'manual'
  revokedAt: timestamp,
  firstOpenedAt, lastOpenedAt, useCount: integer default 0,
  createdAt
}
// index (vendorId, revokedAt)
```

**Multi-use by design.** A single-use link breaks the moment an agent forwards it to a colleague, which
is exactly how this actually gets done. Security comes from a 32-byte token, an expiry, revocability,
and the fact that the page exposes nothing but a vendor name, a requirement summary and an upload box.

## 5. Server actions / routes

| surface | signature | notes |
|---|---|---|
| `GET /u/[token]` | → page | no session; rate-limited by IP; token compared by hash |
| `POST /u/[token]/upload` | `(file) → { status }` | same validation as M4 §10; `documents.source = 'link'`, `uploadedBy = null` |
| `createUploadLink` | `(vendorId, purpose) → { url }` | server-side only; the raw token is returned once and never stored |
| `revokeUploadLink` | `(linkId) → void` | |

## 6. Validation

- token: 32 random bytes, base64url, stored hashed; constant-time compare
- rate limit: 30 GET/IP/hour, 10 uploads/token/day
- file rules identical to M4 (mime, ≤ 20 MB, ≤ 25 pages, not encrypted)
- the page renders **only**: customer org name, vendor name, the requirement summary, and what expired.
  **Never** other vendors, other documents, the customer's user names, prices, or any org data
- an expired or revoked token renders a page with the customer's org name and a "ask {Org} for a new
  link" instruction — never a bare 404, which reads as broken and generates a support email
- uploads through a link are **always** attributed to the vendor on the link; a link cannot be
  repointed

## 7. Acceptance criteria

**A1** Given a valid token, When the page loads, Then it shows the customer's org name, the vendor
name, the requirement summary in plain language, and an upload box, with no sign-in prompt.
**A2** Given a PDF is dropped, Then it uploads, extraction is enqueued (M4), and the page shows
"received" within 2 seconds — **the agent does not wait for extraction**.
**A3** Given the uploaded certificate still fails a blocking requirement, Then the page names the
failures in plain language ("General liability aggregate is $1,000,000; {Org} requires $2,000,000") and
offers another upload.
**A4** Given an expired token, Then the page explains and names the org; no upload box.
**A5** Given a revoked token, Then the same, with revocation wording.
**A6** Given the vendor was archived, Then the page says the request is no longer active.
**A7** Given the same token is opened by three different people, Then all three can upload, and
`useCount` is 3.
**A8** Given 40 GETs from one IP in an hour, Then further requests are rate-limited without revealing
whether the token is valid.
**A9** Given a link page in any state, Then the §F.1 disclaimer is present and no other org data is in
the DOM or in any API response the page makes.

## 8. Edge cases

| case | behaviour |
|---|---|
| Agent uploads the wrong vendor's certificate | extraction's name check fails → `needs_review` for the customer, and the confirmation says "we've received it and flagged it for {Org} to check" — never silently attach |
| Agent uploads a policy declarations page instead of a certificate | `document_kind: 'other'` → rejected with a specific message and another chance |
| Agent uploads five files | each is a separate document; all extract; the newest ACORD 25 becomes active |
| Link forwarded outside the agency | works; that is the design. Token expiry and revocation are the control |
| Vendor's requirements changed after the link was sent | the page always renders the **current** requirement set |
| Certificate uploaded via the link while the customer uploads the same file in-app | per-org sha dedupe (M4) returns the same document; no double billing |

## 9. Errors

Same catalogue as M4 §13, in agent-facing language: "That file is 34 MB — upload just the certificate
page." / "This PDF is password-protected." / "This looks like an evidence-of-property-insurance form.
{Org} needs a liability certificate (ACORD 25)."

## 10. Analytics

`upload_link_generated{purpose}`, `upload_link_opened{first_open,rung}`,
`upload_link_expired_view`, `upload_link_revoked_view`, `vendor_upload_started`,
`vendor_upload_completed{mime,bytes}`, `vendor_upload_rejected{reason}`,
`vendor_upload_gaps_shown{gaps}`, `vendor_upload_second_attempt`.

`upload_link_opened → vendor_upload_completed` is the **chase conversion rate**, the number that says
whether M7 works at all.

## 11. Test plan

Unit: token generation/hash/constant-time compare; expiry and revocation precedence; the page's
data projection contains no field outside the allowlist (an explicit test over the serialised props).
Integration (PGlite): upload through a link creates a document with `source='link'` and `uploadedBy`
null; name mismatch routes to `needs_review`.
Security: cross-org token cannot address another org's vendor; enumeration attempt is rate-limited and
returns identical responses for invalid and expired tokens at the HTTP level.
e2e: reminder email → click → upload → confirmation → the certificate appears on the customer's vendor
page with source "vendor link".
