# Lifecycle Emails — every message a self-serve product with no inbox may send

**Subject:** the transactional and lifecycle sequences for Ratepin, drafted in full. Magic link, first artifact, WD-change alert, allowance warning, auto-upgrade, dunning, staleness credit, cancellation and export.
**Status:** **DRAFTS ON DISK. Nothing has been sent to any address, and no sending domain is configured.** Template ids match `app/src/platform/ops/outbox.ts` and its callers where those already exist; the rest are specified here for the build.
**Binding:** `PLAN.md` A1–A6 · `IDEA_DOSSIER.md` D4, D7, D9, G1–G6 · `CORRECTIONS.md` Scope A, CL-1, CL-2, F-1…F-4 · `BRAND.md` §2.4, §3, §5 · `USER_JOURNEY.md` §8, §11, §12, §16 · `research/01-channels.md` §4.
**Date:** 2026-08-13.

---

## 1. The rule that generates every message

> **Every email is a notification of a fact that has already happened, and its resolution is a link into the product.**

Three consequences, and they delete most of the SaaS lifecycle playbook:

1. **No message asks for a reply.** Not "let us know", not "hit reply and I'll help", not "how's it going?". `outbox.ts` already enforces the plumbing: *"There is no inbound adapter and no reply-to that routes into the product."*
2. **No message asks the reader to do something we have not already done for them.** A WD-change alert arrives with the diff computed and scoped to their crew, not with an invitation to go and look.
3. **No message exists to create a feeling.** No welcome note from a founder who does not exist, no check-in, no milestone confetti. `BRAND.md` §3.3 and trait 3 forbid the register; A3 forbids the implied person behind it.

**And one rule that keeps us honest about the mailbox.** The From address is a **deliverable, declared address whose inbound volume is counted**, not a silently discarding `no-reply@`. `USER_JOURNEY.md` §11.8 makes the published-address set exactly the set of addresses that can receive mail anywhere the company can be written to, and CI fails the build on an undeclared mailbox. A no-reply that swallows mail would be a way of making G5's counter look good by making the messages invisible, which is the evasion §11.8 was rewritten to close.

---

## 2. Five structural constraints

| # | Constraint | Source |
|---|---|---|
| C1 | **Outbound only.** No inbound adapter, no reply routing. Replies land at a published address and increment G5's counter | `outbox.ts`; `USER_JOURNEY.md` §11.8 |
| C2 | **A link, never a file.** WD-change and export messages carry a link to an authenticated route. The recipient authenticates to get the bytes | `outbox.ts` rule 2; §11.3 |
| C3 | **Idempotent.** `idempotency_key` is unique. A dunning notice that arrives twice because a container restarted teaches a customer to ignore the next one | `outbox.ts` rule 3 |
| C4 | **The in-product notice is normative; email is a convenience**, and the UI says so. A bounced alert breaks nothing | `USER_JOURNEY.md` §8.3 |
| C5 | **Classified correctly under CAN-SPAM before it is written.** Transactional-or-relationship messages are largely exempt where they consist solely of content that completes an agreed transaction or notifies of changes to an account. The moment a message carries a promotion it is commercial, needs the advertisement disclosure, a valid physical postal address, and an opt-out honoured within 10 business days | FTC CAN-SPAM compliance guide, read 2026-08-13 |

**The consequence of C5, stated as a design decision rather than discovered later:** we keep every account message purely transactional by *never putting an offer in one*. That is not a compliance dodge; it is the same rule as §1. The one genuinely commercial stream is the free WD-change watch list (D8 channel 3), and it is treated as commercial in full: double opt-in, `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` per RFC 8058, a visible unsubscribe link in the body, and the postal address in the footer. Google's bulk-sender requirements demand the same one-click header set, SPF, DKIM and DMARC, and a Postmaster Tools spam rate **below 0.30%** — all machine-checkable, all unattended.

---

## 3. The catalogue

| Template | Trigger | Class | In-product resolution | Unsub |
|---|---|---|---|---|
| `magic_link` | Sign-in requested | Transactional | The link. 15-minute TTL; expiry is an ordinary state with an in-product fix | — |
| `first_artifact_ready` | First filing reaches a released status | Relationship | The artifact route | — |
| `wd_change_alert` | Nightly promotion finds a new revision on a pinned determination | Relationship | S19: keep / re-pin / re-pin and regenerate, all equal weight | — |
| `wd_watch_confirm` | Anonymous watch requested | Commercial (opt-in) | Confirm link. Nothing is sent until it is clicked | n/a |
| `wd_watch_alert` | New revision on a watched determination | **Commercial** | The public diff page | **One-click** |
| `allowance_warning` | Overage reaches 80% of the cap | Transactional | S21: plan page, upgrade now or do nothing | — |
| `auto_upgrade_fired` | Overage reaches the cap | Transactional | S21: one-click revert | — |
| `dunning_payment_failed` | `invoice.payment_failed`, retryable | Transactional | Stripe Portal deep link | — |
| `dunning_hard_decline` | `invoice.payment_failed`, hard decline code | Transactional | Portal deep link, new card | — |
| `dunning_grace_started` | Entitlement → `past_due_grace` | Transactional | Portal deep link; full function for 72 h | — |
| `dunning_restricted` | 72 h elapsed → `restricted` | Transactional | Portal deep link; archive and export stay open | — |
| `staleness_credit_posted` | L2+ incident credit posted to the Stripe balance | Transactional | S21: the incident, the days, the arithmetic | — |
| `archive_export_link` | Archived at 30 days unpaid · chargeback · cancellation | Transactional | Export route | — |
| `deletion_scheduled` | Deletion requested | Transactional | One-click undo, 7-day window | — |

Fourteen messages. There is no fifteenth, and §5 lists what the fifteenth would have been.

---

## 4. The drafts

Slots in `{braces}` are injected from the record that triggered the send. No gate-locked sentence appears in any template; CL-1 fails the build if one is hand-written outside the `claims.json` renderer.

### 4.1 `magic_link`

> **Subject:** Sign in to Ratepin
> **Preheader:** This link works once and expires in 15 minutes.
>
> Sign in: `{url}`
>
> It works once and stops working at `{expires_at}`. If it has expired, ask for another one at `{signin_url}` — that is the whole fix, and it takes a second.
>
> If you did not ask for this, nothing has happened. No account was created and no one was notified.

*Does not say:* welcome, we're excited, get started, book a call, or anything about what to do next. A sign-in message that upsells is a sign-in message people stop trusting.

### 4.2 `first_artifact_ready`

> **Subject:** `{project_name}` — week ending `{week_ending}` is ready
> **Preheader:** WH-347 with the determination printed on it.
>
> `{n}` workers · `{k}` classifications · WD `{wd_number}` revision `{r}`, published `{published_date}` · snapshot `{hash}`.
>
> `{status_sentence}` — one of:
> *Every line resolved. The signature block is on the document; you certify it.*
> *`{n}` unresolved line(s). The document is marked DRAFT — NOT CERTIFIABLE and the signature block is withheld. The reason for each line is on the exception report.*
>
> Download: `{artifact_url}`
>
> Ratepin computes and formats. You certify and file. This is not legal advice.

*Does not say:* congratulations, you're all set, you're compliant. `USER_JOURNEY.md` §16.3 bans the third of those by name.

### 4.3 `wd_change_alert` — for an account with a pin

> **Subject:** `{wd_number}` moved to revision `{r_new}` on `{published_date}`
> **Preheader:** `{k}` of your classifications changed. Nothing has been re-pinned.
>
> Your project `{project_name}` is pinned to revision `{r_old}`, published `{r_old_date}`. Revision `{r_new}` published `{published_date}`.
>
> `{k}` of the `{m}` classifications on this determination changed. `{k_yours}` of them are classifications your workers are on:
> `{table: classification · group · base old → new · fringe old → new · your workers · hours last week}`
>
> **We have not moved your pin.** FAR 22.404-6 governs which revision applies to your contract, and that can turn on a finding by the contracting officer, which Ratepin cannot observe. We do not conclude which revision applies.
>
> Three things you can do, and they are equally available: keep revision `{r_old}`, pin `{r_new}` going forward, or pin `{r_new}` and regenerate the weeks you have not filed. `{s19_url}`
>
> You can also record that your contract incorporates revision `{r_old}` at award, in which case later revisions arrive as information rather than as a question.
>
> This page is the record. We also emailed it; if email is unreliable for you, the page is what counts.

*Does not say:* action required, urgent, your rates are out of date, update now. A default in an email is the same legal conclusion a pre-selected button would be, rendered in a subject line.

### 4.4 `wd_watch_confirm` and `wd_watch_alert` — the anonymous list

> **Subject:** Confirm the alert for `{wd_number}`
>
> Click to confirm and we will email you when `{wd_number}` publishes a new revision: `{confirm_url}`
> If you do not click, nothing is sent and this address is dropped. We asked for nothing else and we hold nothing else.

> **Subject:** `{wd_number}` — revision `{r_new}`, published `{published_date}`
>
> `{k}` of `{m}` classifications changed: `{list}`
> The full per-classification diff, with the dates: `{public_diff_url}`
> The determination itself is at sam.gov: `{sam_url}`
>
> You are getting this because you asked us to watch `{wd_number}`. Unsubscribe in one click: `{unsub_url}` · `{postal_address}`
> Ratepin is a paid product; these alerts are free and complete, and we will not degrade them to sell you something.

The last sentence is a commitment `research/01` §4 requires us to keep: the free alert exists on the exact anxiety we monetise, and the moment it is throttled to create an upgrade it becomes bait.

### 4.5 `allowance_warning`

> **Subject:** You are at `{overage_used}` of `{overage_cap}` in overage this period
> **Preheader:** At the cap we move you up a plan, because the plan is cheaper.
>
> `{billable_filings}` certifiable filings this period. `{included}` are included in `{plan_name}`; `{overage_filings}` beyond that are metered at $2.50, which is `{overage_amount}` so far.
>
> The overage stops at `{cap_amount}`. That is exactly the gap to `{next_plan}` at `{next_price}`, so at the cap we move you to `{next_plan}` and stop charging overage — because past that point `{next_plan}` costs you less than staying here. You can also move now: `{plan_url}`
>
> Filings we marked DRAFT — NOT CERTIFIABLE are not billable and never counted toward this.

### 4.6 `auto_upgrade_fired`

> **Subject:** Moved to `{next_plan}` at `{next_price}` — overage stopped
>
> You passed `{filings}` filings this period. On `{old_plan}` that would have been `{would_have_paid}`. You are now on `{next_plan}` at `{next_price}` with `{new_allowance}`, effective `{effective_at}`, prorated.
>
> One click puts you back on `{old_plan}`: `{revert_url}`

*The test this message has to pass* (`USER_JOURNEY.md` §11.4): the upgrade must be defensible as cheaper for her, or it is a trap. That is why the counterfactual number is in the body and not omitted.

### 4.7 The dunning set

> **`dunning_payment_failed`** — Subject: *The card was declined on `{failed_at}`*
> Invoice `{invoice_id}` for `{amount}`. Stripe will retry automatically — up to 8 attempts over 2 weeks. Nothing changes today: filings, the archive and export all work.
> Update the card if you would rather not wait: `{portal_url}`

> **`dunning_hard_decline`** — Subject: *The card was declined and cannot be retried*
> `{decline_code}` is a decline the bank will not let us retry, so waiting will not help — the payment needs a different card. `{portal_url}`
> Filings continue until `{grace_end}`. The archive and export stay open regardless of what happens to the subscription.

> **`dunning_grace_started`** — Subject: *Payment failed — full function until `{next_transition_at}`*
> Everything works for 72 hours. After that, generation pauses. The archive and export do not pause, then or ever. `{portal_url}`

> **`dunning_restricted`** — Subject: *Generation paused. Your archive is open.*
> New filings are blocked from `{state_since}`. **Everything you have already generated is still there and still downloadable, and the export button works right now:** `{export_url}`
> A successful payment restores generation immediately: `{portal_url}`
> If you have paid and this is wrong, there is a button on the billing page that re-checks your payment status with Stripe and applies it on the spot. `{billing_url}`

That last line matters more than the rest of the sequence combined. A stuck restricted state at 16:40 on a Friday is the worst failure a product with no support channel can have, and it is closed by a button rather than by a ticket.

*The dunning set does not say:* we're sorry, please get in touch, contact us to resolve, or anything that reads as pressure. `BRAND.md` §2.4: factual, no pressure, exit visible.

### 4.8 `staleness_credit_posted`

> **Subject:** `{credit_amount}` credited — `{wd_number}` was unverified for `{open_days}` days
>
> Incident `{incident_id}` opened `{opened_at}` and affected determinations you have pinned. Your rates did not change; what we could not do was check whether a newer revision had published.
>
> `{price}` × `{open_days}` ÷ `{days_in_period}` = `{credit_amount}`, posted to your account balance and applied to the next invoice. You did not have to ask and there was nothing to file.
> The incident, the days and this arithmetic: `{billing_url}`

**G6 constraint, binding:** this message is a notification to an existing customer about money that has already moved. **The credit may not be advertised anywhere** — not on the landing page, not in the launch note, not in a directory listing — until it has fired correctly in a chaos test with the upstream source killed in staging. Sending the notification is permitted; promising it is not.

### 4.9 `archive_export_link`

Sent on three triggers — archived after 30 days unpaid, a chargeback, and cancellation — with `{reason}` selecting one sentence.

> **Subject:** Your Ratepin archive, ready to download
>
> `{reason_sentence}`:
> *Your subscription was cancelled on `{date}`.* / *A dispute was opened on `{date}`, so we stopped the payment retries.* / *The subscription has been unpaid for 30 days.*
>
> **Everything you generated is here, and none of it has been deleted:** `{export_url}` — every WH-347 PDF and eCPR XML, the rate-of-record for each, the pin history, the classification memory, and a CSV index. It stays available for 30 days from today, and it downloads in one click with no request form.
>
> Invoices keep drafting rather than closing, so if you come back the account is where you left it. Nothing needs re-subscribing and nothing needs rebuilding.

*Does not contain:* a retention offer, a discount, a "before you go", a survey, or a reason-for-leaving field. Stripe's cancellation-deflection coupon exists and is deliberately switched off. The exit is disproportionately what gets remembered and repeated, and D8's channel is a small, connected population.

### 4.10 `deletion_scheduled`

> **Subject:** Deletion scheduled for `{effective_at}` — `{undo_window_days}` days to undo
>
> On `{effective_at}` we delete the account and everything in it: filings, artifacts, pins, classification memory and the rate-of-record archive. **This cannot be undone after that date, by us or by you** — there is no backup we can restore from and no one to ask.
>
> Export first if you have not: `{export_url}`
> Undo in one click, any time before `{effective_at}`: `{undo_url}`

---

## 5. The messages we structurally cannot send

Named so that a later agent does not reinvent them as growth ideas.

| The standard play | Why it is unavailable here |
|---|---|
| Founder welcome note ("I'm X, hit reply anytime") | There is no X, and the reply goes nowhere. It is the single most common lifecycle email in SaaS and it is a lie in this company |
| Onboarding drip ending in "book a 15-minute call" | A1. `research/01` §3 refuses this by name as disguise 1 |
| "How's it going?" check-in | Manufactures the expectation A3 must refuse |
| NPS or satisfaction survey | Inbound with no one to read it, and a response rate we would be tempted to quote before a gate cleared |
| Review solicitation to a customer with an incentive | 16 CFR 465.4 forbids incentives conditioned on sentiment; see `community-playbook.md` §4 row 6 |
| Trial-ending sequence | There is no trial. The free tier is permanent and unlimited (D3) |
| Win-back discount | Prices are the prices (`BRAND.md` §3.2). A discount to a churned customer is a statement that the price was never real |
| Feature-announcement blast | The changelog is public and dated; pushing it into an inbox converts a transactional relationship into a commercial one for no gain |
| Usage-milestone congratulation | Confetti on a federal form |
| Abandoned-cart email | Requires knowing an anonymous visitor's address, which the free tier deliberately never collects (C-B3) |
| Referral-request email | Affiliate recruiting is BD, dead by A1 (`research/01` §4) |

---

## 6. Sending discipline

- **One fact, one message, once.** The idempotency key is the fact, not the schedule. A payment that succeeds deletes every unsent `dunning_%` row for that account before it can be sent — the sequence stops at the moment the problem stops, not at the next cron tick.
- **Never two messages for one event.** The WD-change alert fires once per pin per revision. It never re-sends, never escalates in tone, and never nags. The in-product notice persists instead, and it is not a toast that clears on view.
- **Silence is explained.** If ingest is stuck at L1/L2 no alerts are generated, and the banner says so with the timestamp — otherwise a working alert system and a broken one look identical.
- **Bounces fail closed.** A hard bounce marks the address undeliverable and surfaces it in-product at next sign-in; it never opens a ticket and never pages anyone.
- **Deliverability is an autonomy requirement, not a marketing one.** SPF, DKIM, DMARC, one-click unsubscribe headers on the commercial stream, and the spam rate held under Google's published 0.30% threshold. All of it is machine-checked; none of it needs a person.

---

## 7. Measurement, and what we refuse to optimise

- **Counted:** delivery, bounce, and — for the commercial stream only — open-independent link clicks and unsubscribes.
- **Not counted, deliberately:** nothing in the transactional set is A/B tested for engagement. A dunning email optimised for click-through is a dunning email drifting toward pressure, and `BRAND.md` §2.4 fixes the register at factual with the exit visible.
- **G5 exposure is the one number that matters here.** Every reply to any of these lands at a published address and increments the raw inbound counter with no triage, minutes floored at one. **If a template is written badly enough to make people reply, the gate is what says so** — which is the correct feedback loop and the only one available.
- **Pre-registered:** if `wd_watch_alert` unsubscribes exceed 5% of sends in any month, the message is shortened, never re-targeted or re-timed to hide the signal.

---

## 8. Hypotheses, flagged

- That a transactional-only lifecycle retains as well as a nurtured one. **Unmeasured**, and it is A1 either way, so the honest framing is that we will find out rather than that we chose well.
- That the WD-change alert is the message that carries the subscription. Plausible — it is the only one that arrives with work already done — and untested.
- That "no retention offer at cancellation" costs less than the goodwill it buys in a small connected population. Reasoned from peak-end; untested.
- That a deliverable, counted From address rather than a discarding `no-reply@` is survivable. It is the honest choice and it is also the expensive one, and G5 is where the cost shows up.

---

## References

**Fetched in-session, 2026-08-13**

- `https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business` — accurate header and subject requirements; the advertisement disclosure; *"your valid physical postal address"*; *"a clear and conspicuous explanation of how the recipient can opt out"*; *"You must honor a recipient's opt-out request within 10 business days"*; and the transactional-or-relationship exemption for messages that complete an agreed transaction or notify of account changes
- `https://www.rfc-editor.org/rfc/rfc8058.html` — one-click unsubscribe signalling; `List-Unsubscribe-Post: List-Unsubscribe=One-Click`; the unsubscribe *"has to work without manual intervention"*
- `https://support.google.com/a/answer/81126` — bulk-sender requirements: one-click unsubscribe plus a visible unsubscribe link in the body, SPF and DKIM, DMARC, and *"spam rates reported in Postmaster Tools below 0.30%"*
- `https://docs.stripe.com/billing/revenue-recovery/smart-retries` — *"The recommended default setting is 8 tries within 2 weeks"*; the post-recovery options table (*"Mark the subscription as unpaid… Invoices continue to be generated and stay in a draft state"*); and the hard-decline list (`lost_card`, `stolen_card`, `authentication_required`, …) that Stripe *"can't automatically retry"* — the branch behind `dunning_hard_decline`
- `https://www.ecfr.gov/api/versioner/v1/full/2026-08-11/title-16.xml?part=465` — 16 CFR 465.4, the incentive prohibition behind §5's review-solicitation row
- `https://docs.stripe.com/customer-management` and `https://docs.stripe.com/billing/customer/balance` — cited from `USER_JOURNEY.md` §11.1 and §11.6 for the portal split and the balance credit mechanism; not independently re-fetched in this session

**Literature**

- Kyle Poyar, *Growth Unhinged* — https://www.growthunhinged.com/p/your-guide-to-saas-metrics-20 — self-serve expansion happens in the product, which is why §4.5 and §4.6 are notifications rather than upgrade pitches
- Alex Hormozi, *$100M Offers* — https://www.acquisition.com/ — risk reversal is a mechanism that must fire before it is described, hence the G6 constraint on §4.8
- Eric Ries, *The Lean Startup* — §7's threshold written before the data
- Fredrickson & Kahneman (1993), peak-end — https://pubmed.ncbi.nlm.nih.gov/8355141/ — the cancellation message carries no deflection because the exit is what gets repeated
- Jakob Nielsen / NN/g — https://www.nngroup.com/articles/error-message-guidelines/ — no blame, no "invalid", constructive next step; applied to the dunning set
- Rob Fitzpatrick, *The Mom Test* — why no message asks how things are going

**Internal, binding**

- `run-2/PLAN.md` — A1–A6
- `run-2/phase-1-ideation/IDEA_DOSSIER.md` — D4 the ladder, D7 unhappy paths, D9, G1–G6
- `run-2/phase-1-ideation/research/03-gtm-pricing.md` §7 — included-filing allowances, $2.50 overage, cap at the gap to the next tier, automatic upgrade
- `run-2/phase-2-build/CORRECTIONS.md` — Scope A; CL-1 and CL-2; F-4 and the G6 advertising ban
- `run-2/phase-2-build/identity/BRAND.md` — §2.4 register by moment; §3.2 urgency; §3.5 autonomy controls; §5.2 the gate table
- `run-2/phase-2-build/architecture/USER_JOURNEY.md` — §8 the WD-change journey and the equal-weight rule; §11.1–§11.8 billing, dunning, refund, staleness credit and the G5 counter; §12 export and deletion; §16.1–§16.3 the copy lint
- `run-2/app/src/platform/ops/outbox.ts` — the three rules; `billing/dunning.ts`, `billing/webhook.ts`, `account/deletion.ts` — the template ids and payloads these drafts fill; `billing/pricing.ts` — the cap arithmetic quoted in §4.5; `platform/auth/magic-link.ts` — the 15-minute TTL
- `run-2/phase-3-acquisition/research/01-channels.md` §4 — the free WD-change alert as a conversion layer rather than acquisition
- `run-2/phase-3-acquisition/outreach/community-playbook.md` — §7, the one address, and why it is never put in a message like these
