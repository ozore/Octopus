# Spec M1 — Magic-link auth and organisation

**Backlog item:** M1 (Must). **Effort:** S. **Depends on:** `packages/platform` auth (PLAN §A7).

## 1. Story

> As a property manager who has never spoken to a salesperson, I enter my work email, click a link in
> my inbox, and I am inside my own workspace. There is no password to invent and no demo to book.

## 2. Flow

```
/  →  "Start free" → email field → POST createMagicLink
                                     ├─ known email  → email: "Sign in to Certly"
                                     └─ new email    → email: "Finish setting up Certly"
   ← inbox → GET /auth/callback?token=… → consume (single use, 15 min)
        ├─ new user  → create user + organisation + membership(owner) → /onboarding
        └─ existing  → resume last org → /dashboard
```

Organisation is created **implicitly at first sign-in**, named from the email domain
(`acme-property.com` → "Acme Property"), editable in settings. Nobody is asked to name a workspace
before they have seen the product.

## 3. Screens

| screen | route | states |
|---|---|---|
| Sign in / start | `/signin` | idle · sending · sent ("check your inbox — the link works once and lasts 15 minutes") · rate-limited |
| Callback | `/auth/callback` | consuming · expired · already-used · invalid · success (redirect) |
| Org switcher | header | single org (hidden) · multiple orgs (menu) |

## 4. Data model (Drizzle-ready)

```ts
users          { id, email (citext unique), createdAt, lastSeenAt }
organisations  { id, name, slug (unique), entityBlock (text),         // the certificate-holder block, used by M5
                 timezone, createdAt, trialEndsAt, plan, stripeCustomerId }
memberships    { id, orgId, userId, role: 'owner'|'editor'|'viewer', createdAt }   // unique(orgId,userId)
magicLinks     { id, email (citext), tokenHash, orgId?, expiresAt, consumedAt, requestedIp, createdAt }
sessions       { id, userId, orgId, tokenHash, expiresAt, createdAt, lastUsedAt, userAgent }
```

`organisations.entityBlock` is not cosmetic: M5's certificate-holder match reads it. It is captured in
onboarding (M11), not here, but the column belongs to the org.

## 5. Server actions

| action | signature | notes |
|---|---|---|
| `requestMagicLink` | `(email) → { sent: true }` | **always returns `sent: true`** — never reveals whether an account exists |
| `consumeMagicLink` | `(token) → Session \| AuthError` | single use; `consumedAt` set in the same transaction as the session insert |
| `signOut` | `() → void` | deletes the session row, not just the cookie |
| `switchOrg` | `(orgId) → void` | membership-checked |

## 6. Validation

- email: RFC-shaped, ≤ 254 chars, lowercased, trimmed; disposable-domain blocklist **off** at launch
  (blocking a legitimate small operator is worse than one throwaway trial)
- rate limits: 5 links per email per hour, 20 per IP per hour; over the limit returns `sent: true`
  and sends nothing
- token: 32 random bytes, base64url, stored **hashed** (SHA-256), 15-minute TTL, single use
- session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, 30-day rolling, absolute max 90 days
- every server action re-checks membership on `orgId`; **`orgId` is never read from a client-supplied
  parameter without that check**

## 7. Acceptance criteria

**A1** Given a brand-new email, When I request a link and click it, Then a user, an organisation and an
owner membership exist, and I land on `/onboarding`.
**A2** Given a link already used once, When I click it again, Then I see "this link has already been
used" and a button to send a new one, and no session is created.
**A3** Given a link older than 15 minutes, When I click it, Then I see "this link has expired" and can
request another.
**A4** Given an email that has no account, When I request a link, Then the response is identical to the
known-email case (no enumeration).
**A5** Given I am a member of two organisations, When I sign in, Then I resume the one I last used and
can switch.
**A6** Given a session cookie for org A, When I request a resource belonging to org B, Then I get 404
(**not** 403 — a 403 confirms the resource exists).

## 8. Edge cases

| case | behaviour |
|---|---|
| Email client pre-fetches the link (Outlook Safe Links, scanners) | token consumed before the human clicks. **Mitigation:** the callback is a `GET` that renders a "Continue" button; the token is consumed by the `POST` behind it. Without this, corporate mail scanners break sign-in for exactly our buyer. |
| Two links requested, older one clicked | valid until it expires — links are independent, not chained |
| Sign-in on a second device | allowed; sessions are per-device, listed in settings |
| User deleted while a session is live | session invalidated on next request |
| Personal Gmail domain (`gmail.com`, `outlook.com`, …) | org name defaults to the local part; never guess a company name from a consumer domain |

## 9. Errors

| condition | copy |
|---|---|
| invalid token | "That sign-in link isn't valid. Request a new one." |
| expired | "That link has expired. We'll send you a fresh one." |
| consumed | "That link has already been used." |
| rate-limited | "Check your inbox — we've already sent a link." *(never "you are rate limited")* |
| email send failure | "We couldn't send that email. Try again in a moment." + admin alert |

## 10. Analytics

`signup_started`, `magic_link_requested{is_new}`, `magic_link_sent`, `magic_link_consumed{age_seconds}`,
`magic_link_failed{reason}`, `org_created{from_domain}`, `login_succeeded`, `signout`.

## 11. Test plan

Unit: token hashing and single-use under concurrency (two simultaneous consumes → exactly one session);
expiry boundary; enumeration-resistance (identical response shape and timing bucket).
Integration (PGlite): membership enforcement on every action; cross-org read returns 404.
e2e: request → click → land on onboarding; click the same link twice.
