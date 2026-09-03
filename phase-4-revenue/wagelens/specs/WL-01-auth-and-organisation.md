# WL-01 · Magic-link auth and organisation

**Effort: M · Must (MVP) · Depends on: nothing**
Backlog: [`../BACKLOG.md`](../BACKLOG.md) · UX: `../UX.md` (Buyer & Identity agent; where it
does not yet exist the screens below are the description, and UX.md wins on conflict).

## Story

As Rosa, office manager at a 12-person electrical subcontractor, I enter my work email, click
the link in the message, and I am inside my company's WageLens. I never invent a password and
I never reset one at 4pm on a Friday.

## Flow

```
/                      landing (Offer & Landing agent owns this page)
  └─ "Start free trial" ─▶ /signup
                             email + company name
                             ─▶ POST createMagicLink  ─▶ email sent
                             ─▶ /check-email  (resend after 60s)
                                  │
   email link  /auth/verify?token=… ─┴─▶ token valid?
                                        no  ─▶ /auth/expired  (one-click resend)
                                        yes ─▶ session cookie set
                                             ─▶ first login?  ─▶ /onboarding/organisation
                                             ─▶ otherwise     ─▶ /projects
/login                 email only ─▶ same magic link, no company name, no account creation
/logout                clears session, revokes nothing else
```

**Onboarding is two questions and then the product.** `/onboarding/organisation` collects the
legal business name and business address — because both print on **every page of every WH-347**
(KNOWLEDGE_BASE KB-6, fields `hdr.business_name`, `hdr.business_address`) — and nothing else.
Certifying official, fringe plans and apprenticeship programs are collected later, at the
moment they are first needed, not up front.

## Screens

| screen | contents | states |
|---|---|---|
| `/signup` | email, company name, "we'll email you a link", trial terms in one line | idle · submitting · sent · rate-limited |
| `/check-email` | the address it went to, "open your inbox", resend (disabled 60s), "wrong address?" back-link | waiting · resent · resend-throttled |
| `/auth/verify` | full-page spinner, then redirect | verifying · expired · already-used · invalid |
| `/auth/expired` | "that link has expired — links last 20 minutes", email prefilled, one button | idle · sent |
| `/onboarding/organisation` | legal business name, street, city, state, ZIP, phone. "This prints on every certified payroll." | idle · saving · error |
| app shell | org name, project switcher, help, settings, sign out | authenticated |

## Data model (Drizzle-ready)

```ts
organisations
  id                uuid          primaryKey defaultRandom
  name              text          notNull            // display name
  legal_name        text          notNull            // prints on WH-347 hdr.business_name
  address_line1     text          notNull            // prints on WH-347 hdr.business_address
  address_line2     text
  city              text          notNull
  state_code        char(2)       notNull
  postal_code       text          notNull
  phone             text
  onboarded_at      timestamptz
  created_at        timestamptz   notNull default now()
  updated_at        timestamptz   notNull default now()

users
  id                uuid          primaryKey defaultRandom
  organisation_id   uuid          notNull references organisations(id)
  email             citext        notNull unique
  name              text
  role              text          notNull default 'owner'   // owner | member  (member unused until WL-37)
  last_login_at     timestamptz
  created_at        timestamptz   notNull default now()
  index (organisation_id)

magic_link_tokens
  id                uuid          primaryKey defaultRandom
  email             citext        notNull
  token_hash        char(64)      notNull unique     // sha256 of the token; the token itself is never stored
  purpose           text          notNull            // signup | login
  organisation_name text                             // carried through signup only
  expires_at        timestamptz   notNull
  consumed_at       timestamptz
  requested_ip_hash char(64)
  created_at        timestamptz   notNull default now()
  index (email, created_at)

sessions
  id                uuid          primaryKey defaultRandom
  user_id           uuid          notNull references users(id) on delete cascade
  token_hash        char(64)      notNull unique
  expires_at        timestamptz   notNull            // 30 days, rolling on use
  user_agent_hash   char(64)
  created_at        timestamptz   notNull default now()
  last_seen_at      timestamptz   notNull default now()
  index (user_id)
```

**No password column exists anywhere.** That is the point of A7 and it is enforced by absence.

## Server actions / API

| name | input | effect |
|---|---|---|
| `requestMagicLink` | `{ email, organisationName?, purpose }` | rate-limit check → create token → send email. **Always returns the same success shape**, whether or not the email is known (no account enumeration). |
| `verifyMagicLink` | `{ token }` | hash → look up → check `expires_at`, `consumed_at` → mark consumed → create or find user + organisation → set session cookie → return redirect target |
| `completeOnboarding` | organisation fields | writes `organisations`, sets `onboarded_at` |
| `signOut` | — | deletes the session row and clears the cookie |
| `GET /auth/verify` | `?token=` | route handler wrapping `verifyMagicLink` |

Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, 30-day rolling expiry, name `wl_session`.

## Validation rules

| # | rule | on failure |
|---|---|---|
| V1 | Email must parse and have a resolvable-looking domain (syntax + MX-shaped, not verified live) | field error |
| V2 | Token lives **20 minutes** and is **single-use** | `/auth/expired` with resend |
| V3 | Max **5** link requests per email per hour, **20** per IP-hash per hour | 429, generic copy |
| V4 | `legal_name`, `address_line1`, `city`, `state_code`, `postal_code` required at onboarding | field errors |
| V5 | `state_code` must be one of the 54 codes present in `kb_counties` | select, not free text |
| V6 | Signing up with an email whose domain already has an organisation still creates a **separate** organisation | no auto-join; WL-37 owns joining |
| V7 | Tokens are compared by `sha256` in constant time; the raw token is never persisted or logged | — |

## Acceptance criteria

- **Given** a visitor on `/signup`, **when** they submit a valid email and company name,
  **then** a `magic_link_tokens` row exists with `consumed_at = null` and `expires_at` 20
  minutes out, an email is sent, and they land on `/check-email`.
- **Given** a valid unconsumed token, **when** `/auth/verify` is opened, **then** a session
  cookie is set, `consumed_at` is stamped, and the user lands on `/onboarding/organisation`
  on first login or `/projects` thereafter.
- **Given** a token already consumed, **when** it is opened a second time, **then** no session
  is created and `/auth/expired` renders with a resend button.
- **Given** a token older than 20 minutes, **when** it is opened, **then** `/auth/expired`.
- **Given** an email that has no account, **when** a link is requested from `/login`, **then**
  the response is **indistinguishable** from the known-email case and no account is created.
- **Given** an authenticated user, **when** onboarding is completed, **then** `organisations`
  holds the legal name and address and `onboarded_at` is set.
- **Given** an unauthenticated request to any `(app)` route, **when** it is made, **then** it
  redirects to `/login?next=<path>` and returns there after verification.
- **Given** 6 link requests for one email inside an hour, **when** the 6th is made, **then**
  it is rejected with the same generic copy and no email is sent.

## Edge cases

| case | behaviour |
|---|---|
| Email client pre-fetches the link (Outlook Safe Links, corporate scanners) | The token is consumed by the scanner and Rosa sees "already used". **Mitigation:** `/auth/verify` is a `GET` that consumes only on a **second** step — it renders a "Sign in" button that POSTs. Costs one click, prevents the single most common magic-link support ticket. |
| Two links requested, older one clicked | Older token is still valid until it expires; both work. Do not invalidate previous tokens — that produces the same failure as the scanner case. |
| Link opened in a different browser from the request | Works. No device binding. |
| Signup abandoned after email, returns 3 days later | Token expired; `/login` issues a new one; the organisation was never created, so nothing is orphaned. |
| Same email signs up twice before consuming either link | One `users` row, one `organisations` row (the first consumed token wins); the second link logs into the same org. |
| Email undeliverable (hard bounce) | Resend adapter reports it; `/check-email` shows "we couldn't deliver to that address" after the webhook lands. |
| User deletes their session cookie mid-payroll | Redirect to `/login?next=/payrolls/<id>`; the payroll draft is server-side, so nothing is lost. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Email provider down | "We couldn't send the link. Try again in a moment." + retry | `magic_link_send_failed` with provider error |
| Token malformed | `/auth/expired` (never "invalid token" — no oracle) | `magic_link_invalid` |
| Rate limited | "Too many sign-in requests. Try again in an hour." | `magic_link_rate_limited` |
| Onboarding save fails | inline error, form state preserved | `organisation_create_failed` |

## Analytics events

`signup_started` · `magic_link_sent {purpose}` · `magic_link_send_failed` ·
`magic_link_consumed {purpose, seconds_to_consume}` · `magic_link_expired_view` ·
`magic_link_rate_limited` · `signup_completed` · `organisation_created {state_code}` ·
`login_completed` · `sign_out`

## Test plan

**Unit** — token hashing and constant-time compare; expiry arithmetic across a DST boundary;
rate-limit windows; the enumeration-safe response shape (identical bytes for known and unknown
email).
**Integration (PGlite)** — full signup → verify → onboarding → session, on real Postgres
constraints; double-consume returns expired; expired token; concurrent verify of the same token
(only one session created; `SELECT … FOR UPDATE` on the token row).
**E2E (Playwright)** — signup with a mock mail adapter, extract the link from the captured
message, verify, complete onboarding, land on `/projects`; then sign out and log back in.
**Security** — assert **no `password` column exists in the generated schema**; assert the raw
token appears in no log line and in no database column; assert the session cookie carries
`HttpOnly` and `Secure`.
