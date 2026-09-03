# M1 — Magic-link auth and organisation

**Status:** spec, wave 1. **Effort:** S (~1 dev-day). **Blocks:** everything.
**Platform:** `packages/platform/auth` (magic link, sessions) per PLAN.md A8; this spec covers only
what StateReady adds on top.

## Story

> As the office manager who has just clicked "start free trial" from an email, I want to be inside
> the product in under a minute without inventing a password, and I want my colleague in the second
> office to join the same company account rather than starting a second one.

The second half matters more than it looks. This buyer's company frequently has two people who
touch licences — the office manager and whoever runs the branch. If the colleague signs up fresh,
we get two half-populated organisations, neither activates, and both churn.

## Flow

```
/  (landing)  →  "Start free trial"  →  /signup
   ├─ enter work email
   ├─ POST requestMagicLink
   │    ├─ email domain matches an existing org's verified domain?  → "join request" path
   │    └─ otherwise                                                → "new organisation" path
   ├─ email arrives (Resend): one link, 15-minute expiry, single use
   └─ click → /auth/callback?token=… → session cookie → /onboarding  (first login)
                                                     → /dashboard    (subsequent)
```

Returning users use the same `/login` form; there is one code path, not two.

**Join-request path.** If the email's domain already belongs to an organisation with
`domain_verified = true`, we do NOT auto-join (that is an account-takeover vector on shared domains
like `gmail.com`, which we never mark verified). We email the organisation's owners: "Jamie at
your company is trying to join StateReady — approve or decline." Pending state shows the user a
holding screen. This is 20 lines of code and prevents the duplicate-organisation failure above.

## Screens

| screen | contents |
|---|---|
| `/signup` | Email field, one button, one line of trust copy ("no password, no card"), link to `/login`. |
| `/login` | Same, different heading. |
| `/auth/check-email` | "We sent a link to jamie@…" + resend button (rate-limited, 60 s). |
| `/auth/callback` | No UI; spinner then redirect. Invalid/expired token renders an inline error with a "send me a new link" button, never a stack trace. |
| `/auth/pending-approval` | Holding screen for the join-request path, with the owners' names redacted to first name + initial. |
| `/settings/team` | Members list, role, invite by email, revoke. Owner cannot remove the last owner. |

## Data model (Drizzle-ready)

```ts
export const organisations = pgTable("organisations", {
  id:              uuid("id").primaryKey().defaultRandom(),
  name:            text("name").notNull(),
  slug:            text("slug").notNull().unique(),
  emailDomain:     text("email_domain"),                 // null for consumer-domain signups
  domainVerified:  boolean("domain_verified").notNull().default(false),
  createdAt:       timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // billing lives in 09-billing.md; the column is here because the FK direction is org → subscription
  stripeCustomerId: text("stripe_customer_id").unique(),
});

export const users = pgTable("users", {
  id:        uuid("id").primaryKey().defaultRandom(),
  email:     text("email").notNull().unique(),           // stored lower-cased
  name:      text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

export const memberships = pgTable("memberships", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  userId:         uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role:           text("role", { enum: ["owner", "admin", "member"] }).notNull().default("member"),
  status:         text("status", { enum: ["active", "pending", "revoked"] }).notNull().default("active"),
  invitedByUserId: uuid("invited_by_user_id").references(() => users.id),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqueMember: unique().on(t.organisationId, t.userId) }));

export const magicLinks = pgTable("magic_links", {
  id:        uuid("id").primaryKey().defaultRandom(),
  email:     text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),       // sha256 of the token; never the token
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  requestIp: text("request_ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ byEmail: index().on(t.email, t.createdAt) }));

export const sessions = pgTable("sessions", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Every other table in this product carries `organisationId` and every query filters on the session's
organisation.** That is the tenancy rule; it is asserted by a test that walks the schema and fails
on any table lacking the column (see Test plan).

## Server actions / API

| action | input | behaviour |
|---|---|---|
| `requestMagicLink({ email })` | email | Normalise (trim, lowercase). Always returns the same success shape whether or not the account exists — no user enumeration. Rate limit: 5 per email per hour, 20 per IP per hour. Sends via Resend. |
| `consumeMagicLink({ token })` | token | Hash, look up unconsumed and unexpired, mark consumed in the same transaction that creates the session. Creates the user and, on the new-organisation path, the organisation and owner membership. |
| `signOut()` | – | Deletes the session row, clears the cookie. |
| `inviteMember({ email, role })` | – | Owner/admin only. Creates a `pending` membership plus a magic link scoped to that organisation. |
| `respondToJoinRequest({ membershipId, decision })` | – | Owner/admin only. |
| `updateMemberRole` / `removeMember` | – | Owner only. Refuses to remove or demote the last owner. |

`GET /api/auth/callback` is a route handler, not a server action, because it is reached by a link
click and must set a cookie on a GET.

## Validation

- Email: RFC-ish shape, ≤ 254 chars, lower-cased, trimmed. Disposable-domain blocklist is **not**
  used — several of our best prospects use odd domains and false positives cost more than the spam.
- Token: 32 bytes from `crypto.randomBytes`, base64url. Stored only as sha256.
- Session cookie: `httpOnly`, `secure`, `sameSite=lax`, 30-day rolling expiry.
- Organisation name: 2–120 chars. Slug generated, collision-suffixed.

## Acceptance criteria

1. A new email address that requests a link, clicks it within 15 minutes, lands on `/onboarding`
   with a session and exactly one organisation where they are `owner`.
2. The same link clicked a second time renders "this link has already been used" and offers a new one.
3. A link older than 15 minutes renders "this link has expired" and offers a new one.
4. Requesting a link for a non-existent address returns the identical response and timing (±50 ms)
   as an existing one.
5. A second user on a `domain_verified` organisation's domain gets `pending-approval`, not a new
   organisation; owners receive an approval email.
6. The last owner of an organisation cannot be removed or demoted, by any route, including direct
   action invocation.
7. Signing out invalidates the session server-side; replaying the cookie returns 401.

## Edge cases

- **Shared consumer domains.** `gmail.com`, `outlook.com`, `yahoo.com` and friends are never
  `domain_verified`. Hard-coded list; a signup from one always creates a new organisation.
- **Email client link pre-fetch.** Outlook Safe Links and similar GET the URL before the human does,
  which consumes a single-use token. Mitigation: the callback is a GET that renders a page with a
  one-click confirm POST when the request has no user gesture headers, and consumption happens on the
  POST. This is a known, real failure mode for magic links in enterprise mailboxes and it will
  otherwise look like "the product is broken" on day one.
- **Two people request a link at once.** Both links are valid; consuming either works. Tokens are
  independent rows.
- **User belongs to two organisations** (a consultant, or an acquired company's manager). The session
  carries `organisationId`; an org switcher appears in the header only when `memberships > 1`.
- **Invite to an email that already has an account.** Creates the membership, sends a link; no
  duplicate user row.

## Errors

| condition | user sees | logged |
|---|---|---|
| Resend API failure | "We could not send the email. Try again in a moment." + retry button | `auth.email_send_failed` with provider error id |
| Rate limit hit | "Too many requests — try again in a few minutes." (never "this email does not exist") | `auth.rate_limited` |
| Expired / consumed / unknown token | One shared message: "That link is no longer valid." + resend | `auth.token_rejected` with reason |
| Session for a deleted organisation | Forced sign-out with an explanation | `auth.orphan_session` |

## Analytics events

`signup_started`, `magic_link_requested`, `magic_link_sent`, `magic_link_consumed`,
`organisation_created`, `join_request_created`, `join_request_approved`, `member_invited`,
`member_joined`, `signed_in`, `signed_out`. All carry `organisation_id` where one exists.
`signup_started` → `magic_link_consumed` is the top of the activation funnel in `THRESHOLDS.md`.

## Test plan

- **Unit:** token hashing and comparison; expiry maths across a DST boundary; email normalisation;
  last-owner guard.
- **Integration (PGlite):** the full request → consume → session flow; replay of a consumed token;
  concurrent consumption of the same token resolves to exactly one session (transaction test);
  join-request approval creates an `active` membership.
- **Tenancy test:** enumerate every table in the Drizzle schema; fail the build if any table other
  than `users`, `organisations`, `magic_links` and the knowledge-base tables lacks
  `organisation_id`. This is the guard that stops a cross-tenant leak being a code-review problem.
- **Security:** timing comparison of existing vs non-existing email on `requestMagicLink`; cookie
  flags asserted; token never appears in any log line (assert against captured log output).
- **E2E (Playwright):** signup → magic link (captured from the mock mail adapter) → onboarding, as
  the first three steps of the recorded journey.
