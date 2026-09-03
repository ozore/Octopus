# Spec 00 — The event vocabulary

**Status:** the **single source of every event name in Certly**. Created in the wave-1b iteration to
close REVIEW.md **B-14**, which found four competing vocabularies (`specs/`, `UX.md` §7,
`BACKLOG.md`'s per-item columns and `LANDING_SPEC.md` §11) for the same funnel.

**The rule.** An event name exists if and only if it has a row in §2 or §3 below. `THRESHOLDS.md`,
`BACKLOG.md`, `LANDING_SPEC.md`, `UX.md`, every spec, every dashboard panel and every line of product
code use these names **verbatim**. A metric with no instrument does not exist (`THRESHOLDS.md` §8.6);
an instrument with a name nobody else uses is the same failure wearing a different hat.

---

## 1. `events:check` — the CI rule that enforces it

```
pnpm events:check
```

1. Parse this file into the set `REGISTRY` of event names.
2. Extract every `` `name` `` or `` `name{...}` `` token matching `^[a-z][a-z0-9_]*$` from the
   **Analytics** section of every `specs/*.md`, from `THRESHOLDS.md`, from `BACKLOG.md`'s
   *analytics events* column, from `LANDING_SPEC.md` §11 and from `UX.md` §7.
3. Extract every event name emitted in `apps/certly/src/**` (the single `track()` call site takes a
   literal from a generated union type, so this is a type check, not a grep).
4. **Fail** on any name in (2) or (3) that is not in `REGISTRY`, and on any `REGISTRY` row that no
   spec claims as its owner.
5. **Fail** on any registry row whose `owner` spec does not exist.

The generated union type `EventName` is emitted from this file to
`packages/platform/src/events/event-names.generated.ts`, so a typo is a compile error rather than a
silent hole in a funnel.

**Every rate is reported with its denominator, always** (`specs/14` §6). An event carries no PII:
no email address, no vendor name, no insured name, no certificate value, no IP beyond rate limiting
(`LANDING_SPEC.md` §11).

---

## 2. Product events

`owner` is the spec that defines the emission point. Properties are listed in braces.

### 2.1 Auth and organisation — owner `specs/01`

| event | properties |
|---|---|
| `signup_started` | `{source}` |
| `magic_link_requested` | `{is_new}` |
| `magic_link_sent` | — |
| `magic_link_consumed` | `{age_seconds}` |
| `magic_link_failed` | `{reason}` |
| `org_created` | `{from_domain}` |
| `login_succeeded` | — |
| `signout` | — |

### 2.2 Requirement templates — owner `specs/02`

| event | properties |
|---|---|
| `template_library_opened` | `{audience}` |
| `template_previewed` | `{template_id}` |
| `template_source_opened` | `{url}` — the honest test of differentiator D3 |
| `template_applied` | `{template_id, rows}` |
| `requirement_set_created` | `{origin: 'template'\|'blank'}` |
| `requirement_added` | `{kind, coverage}` |
| `requirement_edited` | `{field}` |
| `requirement_deleted` | — |
| `requirement_set_assigned` | `{scope}` |
| `template_update_previewed` | — |
| `vendor_type_created` | `{source}` |

### 2.3 Vendors and import — owner `specs/04`

| event | properties |
|---|---|
| `vendor_created` | `{source: 'manual'\|'csv'\|'extraction'}` |
| `vendor_updated` | `{field}` |
| `vendor_archived` | — |
| `csv_import_started` | `{bytes, rows}` |
| `csv_columns_mapped` | `{auto_accepted}` |
| `csv_import_completed` | `{rows, created, updated, skipped, ms}` |
| `csv_import_failed` | `{reason}` |
| `vendor_missing_contact_prompt_shown` | — |

### 2.4 Extraction — owner `specs/03`

| event | properties |
|---|---|
| `coi_upload_started` | — |
| `coi_uploaded` | `{mime, pages, bytes, source}` |
| `coi_upload_rejected` | `{reason}` |
| `coi_duplicate_detected` | — |
| `extraction_started` | — |
| `extraction_succeeded` | `{ms, doc_confidence, fields_below_tau, gate_failures, model, cost_cents, input_tokens, output_tokens, cache_read_tokens}` |
| `extraction_failed` | `{reason}` |
| `extraction_retried` | — |
| `document_rejected` | `{kind}` |
| `review_opened` | — |
| `review_field_corrected` | `{field, from_confidence, gate}` |
| `review_completed` | `{ms, corrections}` |
| `certificate_promoted` | `{form_edition, coverages}` |

### 2.5 Comparison — owner `specs/05`

| event | properties |
|---|---|
| `comparison_run` | `{requirements, met, gaps, asserted_only, not_checked, undetermined, ms, engine_version}` |
| `gap_detected` | `{requirement_kind, coverage}` |
| `asserted_only_detected` | `{endorsement_key}` |
| `explanation_opened` | `{state}` |
| `reevaluation_triggered` | `{cause}` |
| `vendor_status_changed` | `{from, to}` — one of the six canonical vendor states (`specs/06` §3) |

### 2.6 Dashboard — owner `specs/06`

| event | properties |
|---|---|
| `dashboard_viewed` | `{meets, gaps, expiring, expired, asserted_only, no_certificate}` |
| `dashboard_filtered` | `{filter}` |
| `dashboard_sorted` | `{key}` |
| `vendor_opened_from_dashboard` | `{status}` |
| `bulk_remind_clicked` | `{selected, queued, skipped}` |
| `review_queue_opened` | `{depth}` |

### 2.7 Reminders — owner `specs/07`

| event | properties |
|---|---|
| `reminder_scheduled` | `{rung, days_out}` |
| `reminder_sent` | `{rung, recipient_kind}` |
| `reminder_delivered` | `{rung}` |
| `reminder_bounced` | `{kind}` |
| `reminder_complained` | — |
| `reminder_suppressed` | `{reason}` |
| `reminder_skipped` | `{reason}` — includes `'expiry_cap'` and `'interval_72h'` (`specs/07` §9) |
| `reminder_cancelled` | `{cause}` |
| `reminder_clicked` | `{rung}` |
| `reminder_paused` | — |
| `unsubscribed` | `{scope: 'org'\|'global'}` |
| `renewal_received_after_reminder` | `{rung, hours}` — the ROI metric |

### 2.8 Vendor upload link — owner `specs/08`

| event | properties |
|---|---|
| `upload_link_generated` | `{purpose}` |
| `upload_link_opened` | `{first_open, rung}` |
| `upload_link_expired_view` | — |
| `upload_link_revoked_view` | — |
| `vendor_upload_started` | — |
| `vendor_upload_completed` | `{mime, bytes}` |
| `vendor_upload_rejected` | `{reason}` |
| `vendor_upload_gaps_shown` | `{gaps}` |
| `vendor_upload_second_attempt` | — |

### 2.9 Audit — owner `specs/09`

| event | properties |
|---|---|
| `activity_viewed` | `{scope}` |
| `activity_filtered` | `{kind}` |
| `audit_exported` | `{events, range_days}` |

### 2.10 Billing — owner `specs/10`

| event | properties |
|---|---|
| `pricing_viewed` | `{source}` |
| `checkout_started` | `{plan, interval, pack_qty}` |
| `checkout_completed` | `{plan, interval, mrr_cents}` — **a card on file, not money**; the trial starts here |
| `checkout_abandoned` | — |
| `trial_will_end_email_sent` | `{days_left}` |
| `trial_converted` | `{plan, mrr_cents}` — the **first `invoice.paid`**. This is the event `THRESHOLDS.md` §3 and `specs/14` §3.1 measure |
| `trial_cancelled` | `{day, reason}` |
| `paywall_viewed` | `{trigger, vendors_used, vendor_limit}` |
| `pack_added` | `{qty}` |
| `plan_changed` | `{from, to}` |
| `subscription_past_due` | — |
| `subscription_cancelled` | `{reason, tenure_days}` |
| `refund_issued` | `{days_in}` |
| `read_only_view` | — |

### 2.11 Onboarding — owner `specs/11`

| event | properties |
|---|---|
| `onboarding_started` | `{audience}` |
| `onboarding_step_completed` | `{step, seconds}` |
| `onboarding_step_abandoned` | `{step}` |
| `vendors_pasted` | `{lines, created}` |
| **`activated`** | `{minutes_from_signup, vendors_at_activation, gaps_found}` — **the only activation event**, emitted once per org by the comparison job (`specs/11` §2) |
| `onboarding_skipped` | `{last_step}` |
| `onboarding_resumed` | `{step, hours_since}` |
| `first_finding_shown` | `{status, gaps}` |

### 2.12 Reports — owner `specs/12`

| event | properties |
|---|---|
| `export_dialog_opened` | `{source}` |
| `report_generated` | `{format, scope, vendors, gaps, asserted_only, not_checked, ms}` |
| `report_downloaded` | `{format}` |
| `report_share_created` | `{days}` |
| `report_share_opened` | `{unique_viewers}` |
| `report_share_revoked` | — |
| `report_failed` | `{reason}` |

### 2.13 Settings, help, legal — owner `specs/13`

| event | properties |
|---|---|
| `settings_viewed` | `{section}` |
| `entity_block_changed` | `{reevaluated_vendors}` |
| `alternate_holder_added` | — |
| `member_invited` | `{role}` |
| `member_joined` | — |
| `role_changed` | — |
| `member_removed` | — |
| `help_search` | `{query_length, results}` |
| `help_article_viewed` | `{slug}` |
| `support_email_sent` | — |
| `data_exported` | `{bytes}` |
| `deletion_requested` | — |
| `deletion_cancelled` | — |
| `legal_page_viewed` | `{page}` |

### 2.14 Free Gap Report — owner `specs/15`

| event | properties |
|---|---|
| `gap_report_started` | `{audience}` |
| `gap_report_files_added` | `{n}` |
| `gap_report_email_captured` | — |
| `gap_report_processing` | `{documents}` |
| `gap_report_ready` | `{documents, extracted, compared, needs_review, rejected, expired_found, gaps_found, asserted_only_found, cost_cents, ms}` |
| `gap_report_viewed` | — |
| `gap_report_emailed` | — |
| `gap_report_cta_clicked` | — |
| `gap_report_converted` | `{minutes_from_ready}` |
| `gap_report_rate_limited` | — |
| `gap_report_capacity_disabled` | — |

`specs/14` (admin) emits **no** events; `admin_viewed` is an audit event, not an analytics one.

---

## 3. Landing-page events — owner `LANDING_SPEC.md` §11

Namespaced `lp_` because they are anonymous and pre-account, and because mixing them into the product
funnel is how a bounce becomes a signup in a dashboard.

`lp_view` · `lp_scroll_depth{pct}` · `lp_hero_cta_click{which}` · `lp_demo_run{sample}` ·
`lp_demo_complete` · `lp_demo_to_cta` · `lp_visual_view{id}` · `lp_sample_report_open` ·
`lp_pricing_view` · `lp_plan_select{tier, interval}` · `lp_faq_open{id}` ·
`lp_gap_report_start` · `lp_gap_report_submit` · `lp_gap_report_delivered` ·
`lp_gap_report_waitlist` *(only in the pre-legal-read state, `specs/15` launch gate)*

**The landing page's own funnel joins the product funnel at `signup_started`** and then uses product
names — `signup_started` → `checkout_completed` → `activated` → `trial_converted` — not a fourth set.

---

## 4. Retired names, and what replaced them

Kept so that a reader of an older draft, or of `IDENTITY.md`, knows what happened. `events:check`
fails on any of the left-hand column.

| retired name | where it was | replacement |
|---|---|---|
| `first_status_rendered` | `UX.md` §1.2, §2.2 S19, §7 | **`activated`** (`specs/11` §2) — activation is a fact about the data, not a screen |
| `dialect_chosen` | `UX.md` §7 | `onboarding_started{audience}` |
| `requirement_template_created` | `UX.md` §7 | `requirement_set_created{origin}` |
| `parties_imported` | `UX.md` §7 | `vendors_pasted` or `csv_import_completed` |
| `document_received` | `UX.md` §7 | `coi_uploaded{source}` |
| `extraction_completed` | `UX.md` §7 | `extraction_succeeded` |
| `review_accepted` | `UX.md` §7 | `review_completed` |
| `renewal_received` | `UX.md` §7 | `renewal_received_after_reminder` |
| `status_changed` | `UX.md` §7 | `vendor_status_changed{from,to}` |
| `gap_report_exported` | `UX.md` §7 | `report_generated{format}` |
| `magic_link_opened` | `UX.md` §7 | `magic_link_consumed` |
| `trial_ended` | `UX.md` §7 | `trial_converted` or `trial_cancelled` — an ending is one of two facts, and they are not the same |
| `subscription_active` | `UX.md` §7, `BACKLOG.md` M1/M10 | `trial_converted` (first payment) or `plan_changed` |
| `onboarding_abandoned` | `BACKLOG.md` M11 | `onboarding_step_abandoned{step}` |
| `requirement_source_opened` | `BACKLOG.md` M2 | `template_source_opened{url}` |
| `report_shared_link_created` | `BACKLOG.md` M12 | `report_share_created{days}` |
| `trial_started` | `BACKLOG.md` M10 | `checkout_completed` — with a card-required trial these are the same moment, and naming it twice invites measuring it twice |
| `tier_limit_reached` | `BACKLOG.md` M10 | `paywall_viewed{trigger}` |
| `signup_start`, `trial_start`, `paid` | `LANDING_SPEC.md` §11 | `signup_started`, `checkout_completed`, `trial_converted` |
| `gap_report_cost_cents` | `specs/15` §11 | `gap_report_ready.cost_cents` (REVIEW.md MN-01) |
| `audit_event_written` | `BACKLOG.md` M9 | not an analytics event — audit writes go to `audit_events` (`specs/09`), never to the product funnel |
| `endorsement_uploaded`, `inbound_*`, `webhook_*`, `property_*`, `clause_pasted`, … | `BACKLOG.md` §2 (Should) | registered **when the Should item is specced**, not before. `events:check` ignores the Should and Later tables |
