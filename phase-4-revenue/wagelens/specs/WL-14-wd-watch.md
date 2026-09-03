# WL-14 · Public determination watch ("watch this determination")

**Effort: S · Must (MVP) · Depends on: WL-13, WL-00**
**Added 2026-09-03 in the wave-1b iteration, resolving review finding B5.** The free watch was
promised on three surfaces — [`../OFFER.md`](../OFFER.md) §6.1 and B3,
[`../LANDING_SPEC.md`](../LANDING_SPEC.md) §5.1, `../UX.md` P2 — and specified nowhere.
`KNOWLEDGE_BASE.md` §3.2 listed a `wd_watches` table that no spec owned. Either it got a spec with
consent, unsubscribe and a CAN-SPAM footer, or the promise came off all three surfaces. **It got
the spec**, because it is the only email list this product builds organically, and a list built
without consent is a liability rather than an asset.

## Story

As an estimator who has just looked up a rate on the public page, I give my email address, tick a
box saying I want to be told when **this determination** changes, confirm the address from a link
in my inbox, and get one plain email — with the classification that moved and both modification
numbers — the next time DOL publishes a modification. I can stop it from one click in any of them.

## What this is, and firmly what it is not

- It **is** a consented, double-opted-in notification list keyed to a public federal document.
- It is **not** an account, a free tier, a trial, or a route into the product's data. A watcher
  has no login, no project, no payroll, no entitlement.
- It is **not** [`WL-08`](WL-08-determination-change-alerts.md). WL-08 alerts are keyed to a
  **project** (`wd_change_alerts.project_id`), scoped to the classifications that project actually
  uses, and are transactional email to a paying customer. WL-14 is keyed to a **determination**,
  unscoped, and is marketing email to a stranger. Different table, different consent basis,
  different unsubscribe. **The two must never share a send path or a suppression list entry
  type.**

## Flow

```
/lookup/:state/:county/:type  or  /wd/:wdNumber        (WL-00, unauthenticated)
   ┌──────────────────────────────────────────────────────────────────────┐
   │  Email me when this determination changes                            │
   │  [ you@company.com                                    ]              │
   │  [ ] Email me when DOL publishes a modification to TX20260253.       │
   │      I can unsubscribe from any of these emails.        ← REQUIRED,  │
   │                                                           UNTICKED   │
   │  [ Watch this determination ]                                        │
   │  We use this address only for this alert. Privacy →                  │
   └──────────────────────────────────────────────────────────────────────┘
        │  writes wd_watches(status='pending')  ·  emits alert_email_captured
        ▼
   E-W1 confirmation email  "Confirm you want alerts for TX20260253"
        │  one link, 7-day expiry, single use
        ▼
   /watch/confirm?token=…     status='confirmed', confirmed_at, confirmed_ip_hash
        │  emits watch_confirmed
        ▼
   WL-13 ingests (TX20260253, mod 2)      ← the SAME detection WL-08 uses
        └─ for each CONFIRMED watch on TX20260253:
              enqueue email.send  E-W2  (one per watch, per modification)
                   │
                   ▼
   E-W2 "Modification 2 changes 3 classifications on TX20260253"
        the changed rows old → new, both modification numbers,
        a link to the determination on our public page and on SAM.gov,
        one-click unsubscribe, the postal address, the disclaimer
        │
        └─ [ Unsubscribe ] ─▶ /watch/unsubscribe?token=…  (GET renders, POST acts — no
                              scanner can unsubscribe someone by pre-fetching)
```

**Nothing about this flow is behind a login, and nothing about it creates one.** A watcher who
later signs up is a new organisation; the two are joined by nothing but a coincidence of address.

## Screens

| screen | contents | states |
|---|---|---|
| watch form (inline on every public result page) | email field, **unticked** consent checkbox naming the determination, button, one-line privacy note with a link | idle · submitting · pending · already-watching · limit-reached · error |
| `/watch/confirm` | "You're watching TX20260253." + what happens next + the other determinations on this address + unsubscribe link | confirmed · expired · already-confirmed · invalid |
| `/watch/unsubscribe` | GET renders "Stop alerts for TX20260253?" with two buttons: **this determination** / **all determination alerts**; POST acts | idle · done · invalid |
| `/watch/manage?token=…` | the ≤3 determinations on this address, each with its own stop control | — |
| pending state on the form | "Check your inbox — we've sent a confirmation link to you@company.com. It expires in 7 days." | — |

## Data model

```ts
wd_watches                                   // the table KNOWLEDGE_BASE §3.2 named and nobody owned
  id                     uuid         primaryKey defaultRandom
  email                  citext       notNull
  wd_number              text         notNull            // NOT a modification — the document, not a version
  status                 text         notNull default 'pending'   // pending | confirmed | unsubscribed | bounced | expired
  // consent record — this is the point of the table
  consent_text_version   text         notNull            // content hash of the checkbox label shown
  consented_at           timestamptz  notNull            // when the box was ticked and submitted
  created_ip_hash        char(64)     notNull            // sha256(ip + server salt). NEVER the address itself
  created_user_agent_hash char(64)
  confirm_token_hash     char(64)     notNull unique     // sha256; the token itself is never stored
  confirm_expires_at     timestamptz  notNull            // 7 days
  confirmed_at           timestamptz
  confirmed_ip_hash      char(64)
  unsubscribe_token_hash char(64)     notNull unique     // stable for the life of the row
  unsubscribed_at        timestamptz
  unsubscribe_scope      text                            // 'determination' | 'all'
  last_alert_sent_at     timestamptz
  alerts_sent_count      integer      notNull default 0
  bounced_at             timestamptz
  expires_at             timestamptz  notNull            // consented_at + 18 months, see Retention
  created_at             timestamptz  notNull default now()
  unique (email, wd_number)
  index (wd_number) where status = 'confirmed'
  index (expires_at) where status <> 'unsubscribed'

email_suppressions                           // shared with the outbound engine (PLAN D4)
  email                  citext       primaryKey
  reason                 text         notNull            // 'unsubscribed_watch' | 'unsubscribed_outbound' | 'hard_bounce' | 'complaint'
  scope                  text         notNull            // 'watch' | 'outbound' | 'all'  — NEVER 'transactional'
  created_at             timestamptz  notNull default now()
```

**Three deliberate choices.**

1. **`created_ip_hash`, never an IP address.** The consent record must be able to answer "who
   asked, from where, when, and to what wording" without holding a personal identifier we do not
   need. A salted hash answers it.
2. **`consent_text_version` is a content hash of the checkbox label.** If the wording changes,
   the record still says what *this* person agreed to. Same mechanism as
   `disclaimer_acknowledgements.disclaimer_version` in [`WL-11`](WL-11-help-and-legal.md) V3.
3. **`unique (email, wd_number)`** makes a double submission idempotent at the database level and
   makes the ≤3 cap countable in one query.

## Server actions / API

| route / action | auth | effect |
|---|---|---|
| `requestWatch({ email, wdNumber, consent })` | none | validates, counts existing rows for the address, inserts `pending`, enqueues E-W1. **Always returns the same success shape** whether or not the address is already watching — no enumeration. |
| `GET /watch/confirm?token=…` | none | renders a confirm page with a POST button (two-step, same anti-prefetch reasoning as WL-01's `/auth/verify`) |
| `POST /watch/confirm` | none | hash → look up → check expiry → `status='confirmed'`, stamp `confirmed_at` and `confirmed_ip_hash` |
| `GET /watch/unsubscribe?token=…` | none | renders the two-button choice; **never acts on GET** |
| `POST /watch/unsubscribe` | none | `status='unsubscribed'`, `unsubscribed_at`, `unsubscribe_scope`; on scope `all`, writes `email_suppressions(scope='watch')` |
| `GET /watch/manage?token=…` | none | the ≤3 rows on this address, each with a stop control |
| job `wd.watch_notify` | internal | enqueued by [`WL-13`](WL-13-kb-ingestion-and-refresh.md) when a new modification lands; fans out one `email.send` per **confirmed** watch |
| job `wd.watch_sweep` | internal (daily) | expires rows past `expires_at`, deletes rows `pending` for >30 days, records `watch_expired` |

## The emails

| id | trigger | subject | contents that are not negotiable |
|---|---|---|---|
| **E-W1** | `requestWatch` | `Confirm alerts for {{wd_number}}` | one link, 7-day expiry; the determination named; "if you didn't ask for this, ignore it and nothing happens"; the postal address; **no marketing** |
| **E-W2** | a modification lands | `Modification {{n}} changes {{k}} classifications on {{wd_number}}` | the changed rows old → new with both modification numbers; a link to our public determination page and to SAM.gov; **one-click unsubscribe in the body and in `List-Unsubscribe`**; the postal address; `{{PRODUCT}}, a TheVillage company`; the WL-11 standing-disclaimer short form; **at most one product line, below the fold of the message** |

**Both carry the CAN-SPAM footer** (PLAN D4, P10): the sending entity, a **physical postal
address**, a working unsubscribe honoured within 10 days, an accurate subject and no deceptive
header. `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` are set on
E-W2 so a mail client's own unsubscribe works.

## Validation rules

| # | rule | on failure |
|---|---|---|
| V1 | **The consent checkbox is unticked by default, is required, and names the determination in its own label.** A submission without it is refused. No pre-ticked box, no "by continuing you agree", no bundled consent. | blocked with the reason |
| V2 | **Double opt-in.** No E-W2 is ever sent to a `pending` row. Only `status='confirmed'` receives an alert. | — |
| V3 | **Three confirmed or pending watches per email address**, counted across all determinations. The fourth is refused with a link to `/watch/manage`. | `watch_limit_reached` |
| V4 | Rate limit: **5 watch requests per IP hash per hour, 20 per day**; **3 per email address per hour**. Over the limit returns the same generic copy, never an error that reveals state. | 429 |
| V5 | Email syntax + MX-shaped check only. No live verification, no third-party validation service (it would ship the address to a vendor). | field error |
| V6 | An address in `email_suppressions` with scope `watch` or `all` is **never** written and **never** emailed. `requestWatch` returns the ordinary success shape and does nothing. | silent no-op |
| V7 | Unsubscribe turns off **non-transactional** email only. It can never suppress a magic link, a billing email or a WL-08 project alert for a paying customer at the same address. `scope` may never be `transactional`. | — |
| V8 | Unsubscribe is honoured **immediately** in the send path (checked at send time, not at enqueue time) and requires **no login and no reply**. | — |
| V9 | Every watch email carries the postal address and the `{{PRODUCT}}` token — never a hard-coded product name (M12). | CI content test |
| V10 | At most **one E-W2 per (watch, modification)**, enforced by a unique index on the outbound job's `dedupe_key` (`watch:{watch_id}:{wd_number}:{to_mod}`), not by application logic. | no-op |
| V11 | A hard bounce sets `bounced_at`, `status='bounced'` and writes `email_suppressions`. Two soft bounces in a row do the same. | — |
| V12 | The public form is **never** presented as a gate. WL-00 V2 still holds: the full classification table renders with no email, and this form sits **below** it. | CI test on the public page order |
| V13 | `wd_watches` rows are **not** customer data of any organisation and are excluded from every export, admin screen and CSV in WL-07 and WL-12. The only aggregate exposed is a count. | — |

## Retention

| what | how long | why |
|---|---|---|
| `pending` never confirmed | **30 days**, then deleted | An unconfirmed address is not a consent record; keeping it is holding an address nobody agreed to give us. |
| `confirmed`, no alert ever sent | **18 months** from `consented_at`, then expired and swept | A determination that has not moved in 18 months is not going to surprise anyone, and consent goes stale. Re-opting in is one click on the public page. |
| `confirmed`, alerts flowing | rolling **18 months** from `last_alert_sent_at` | Same reasoning; activity refreshes it. |
| `unsubscribed` | the row is reduced to `email` + `unsubscribed_at` + `reason` and kept **indefinitely** in `email_suppressions` | You cannot honour an unsubscribe you have deleted. This is the one thing we keep forever, and it is kept *in order to not email them*. |
| `bounced` | same as unsubscribed | |

The privacy page (WL-11 `/legal/privacy`) states all five lines above, plus: what we collect (an
address, a hashed IP, a timestamp and the wording consented to), why, that we never sell or share
it, and how to remove it without an account.

## Acceptance criteria

- **Given** the public result page for TX20260253, **when** the full classification table has
  rendered, **then** the watch form appears **below** it, the consent box is **unticked**, and the
  box's label names TX20260253. *(V1, V12)*
- **Given** a submission with the box unticked, **when** it posts, **then** nothing is written and
  the reason is shown. *(V1)*
- **Given** a valid submission, **then** one `wd_watches` row exists with `status='pending'`,
  `consent_text_version`, `consented_at` and `created_ip_hash` set, **no raw IP address is stored
  anywhere**, and E-W1 is enqueued. `alert_email_captured {wd_number}` fires.
- **Given** a `pending` row, **when** a modification lands, **then** **no** E-W2 is sent. *(V2)*
- **Given** the confirmation link, **when** it is *pre-fetched* by a scanner (GET only), **then**
  the row is still `pending`; **when** the button is pressed (POST), **then** it becomes
  `confirmed` and `watch_confirmed` fires.
- **Given** a confirmation link 8 days old, **when** it is opened, **then** it is expired and a
  one-click re-send is offered.
- **Given** an address with 3 confirmed watches, **when** a 4th is requested, **then** it is
  refused with a link to `/watch/manage` and `watch_limit_reached` fires. *(V3)*
- **Given** a confirmed watch and modification 2 of that determination, **when** WL-13 ingests it,
  **then** exactly one E-W2 is sent, it names both modification numbers and the changed
  classifications, it carries a working one-click unsubscribe, a `List-Unsubscribe` header and the
  postal address, and re-running the ingest sends nothing further. *(V10)*
- **Given** the unsubscribe link, **when** it is opened (GET), **then** nothing changes; **when**
  confirmed (POST) with scope `all`, **then** every watch on that address stops, an
  `email_suppressions` row exists with scope `watch`, and a magic-link email to the same address
  still sends. *(V7, V8)*
- **Given** a suppressed address, **when** a new watch is requested, **then** the response is
  identical to the success case and no row is written and no email is sent. *(V6)*
- **Given** a `pending` row 31 days old, **when** the sweep runs, **then** it is deleted.
- **Given** any WL-07 export or WL-12 screen, **when** it is inspected, **then** no watcher email
  address appears. *(V13)*
- **Given** the generated E-W1 and E-W2 fixtures, **when** the CI content test runs, **then**
  each contains `{{PRODUCT}}`, a postal-address placeholder and an unsubscribe link, and contains
  no hard-coded product name. *(V9, M12)*

## Edge cases

| case | behaviour |
|---|---|
| Someone enters a competitor's address, or a colleague's | Double opt-in is the answer: nothing is ever sent to an unconfirmed address except the single confirmation, which says "if you didn't ask for this, ignore it". |
| A watched determination is **withdrawn** (absent from the index) | One final E-W2 saying the determination is no longer published, with a link to the archived revision. Then the row expires. We do not go silent on a document someone is relying on. |
| A watcher becomes a paying customer and pins the same determination | Both fire. They are different promises to different addresses of the same person, with different unsubscribes. Deduplicating them would mean joining a marketing list to an account, which V13 forbids. Reviewed again if a support conversation says it is annoying. |
| 3,377 of 4,235 determinations sit at modification 1 | Then most watches never fire, which is honest and cheap. `watch_alert_email_sent` per confirmed watch per year sits on the WL-12 dashboard beside WL-08's number, and the copy on the public page never implies a change is likely. |
| A determination with 800 confirmed watchers moves | The fan-out is queue jobs at the same ≤4 req/s courtesy budget as everything else; one modification is one drain cycle, not one request. |
| The same email address on two determinations that both move the same night | Two emails, one per determination — because each carries a different unsubscribe scope and a different document. Digesting is a Should, not an MVP behaviour. |
| Someone forwards E-W2 and the recipient clicks unsubscribe | It unsubscribes the address in the token, which is the original watcher. That is correct and it is what the token means; the page names the address it is about to stop. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Email send fails | The form still says "check your inbox", the job retries ×3, and the row stays `pending` until it confirms or the 30-day sweep takes it | `watch_confirm_email_failed` |
| Token invalid or already used | One page for both — "that link has expired or has already been used" + re-send. No oracle. | `watch_token_rejected` |
| Rate limited | The generic success copy, and nothing is written | `watch_rate_limited` |

## Analytics events

Defined in [`WL-EVENTS.md`](WL-EVENTS.md) §2 and nowhere else:
`alert_email_captured {wd_number}` · `watch_confirmed {wd_number, minutes_to_confirm}` ·
`watch_limit_reached` · `watch_alert_email_sent {wd_number, from_mod, to_mod}` ·
`watch_unsubscribed {scope}` · `watch_expired {wd_number}`

**The number that decides this feature's future** is `watch_confirmed ÷ alert_email_captured`.
Below **50%** the confirmation email is not arriving or not landing, and a list that does not
confirm is a list that does not exist.

## Test plan

**Unit** — consent required; the ≤3 cap; token hashing and constant-time compare; the two-step
GET/POST for both confirm and unsubscribe; suppression check at send time, not enqueue time.
**Integration (PGlite)** — request → pending → confirm → modification lands → exactly one email;
re-ingest sends nothing; unsubscribe scope `all` suppresses future watch mail and leaves a
magic-link send unaffected; a suppressed address re-requesting is a silent no-op; the 30-day and
18-month sweeps.
**Privacy test (CI)** — walk `wd_watches` and every `events.props` fixture and assert **no raw IP
address and no email address** appears in `events`; assert no export or admin query selects
`wd_watches.email`.
**Content test (CI)** — E-W1 and E-W2 fixtures contain `{{PRODUCT}}`, the postal-address
placeholder, an unsubscribe link and a `List-Unsubscribe` header; contain no hard-coded product
name and no penalty figure.
**E2E** — run a public lookup, submit the form without the box (refused), with the box, extract
the confirmation link from the mock mail adapter, POST it, ingest modification 2 from a fixture,
assert one alert email, click unsubscribe, assert the second modification sends nothing.
