# WL-EVENTS · The canonical analytics vocabulary

**Not a feature. A contract.** This file is the **single place** an event name is defined.
Added 2026-09-03 in the wave-1b iteration, resolving review finding **B6** (the landing page and
the specs were running two vocabularies, so `THRESHOLDS.md`'s pre-committed funnel could not be
computed).

## The three rules

1. **One event, one definition, one owner.** Every name below names its owning spec. A name that
   is not in this table does not get emitted. Adding one means editing this file *and* its owner
   spec in the same change.
2. **Spec names are canonical.** Where a marketing document and a spec disagreed, the spec won,
   because [`../THRESHOLDS.md`](../THRESHOLDS.md) is the pre-committed decision instrument and an
   event it cannot read is a decision that cannot be made.
3. **This list is reused verbatim.** [`../LANDING_SPEC.md`](../LANDING_SPEC.md) §13 and
   [`../THRESHOLDS.md`](../THRESHOLDS.md) quote these names; they never coin their own.

**Enforcement.** `lib/analytics/events.ts` exports a frozen union type generated from this table,
and `emitEvent` accepts nothing else. A CI test asserts (a) every literal passed to `emitEvent`
in the codebase is in the union, and (b) every name in the union appears in this file. That test
is the reason B6 cannot come back.

**Privacy (inherited, non-negotiable).** No `props` value ever carries an email address, a worker
name, an identifying number or an IP address — public events carry an **IP hash** only
(`WL-00` V6, `WL-12` V5, gate G7's neighbour).

---

## 0. The renames applied by this iteration

The landing page's names were replaced by the spec's. Anything still using the left-hand column
is a bug.

| was (LANDING_SPEC §13, superseded) | is now | owner |
|---|---|---|
| `lookup_completed` | **`lookup_performed`** | WL-00 |
| `lookup_empty` | **`lookup_zero_results`** | WL-00 |
| `source_chip_clicked` | **`lookup_official_link_clicked`** | WL-00 |
| `plan_cta_clicked` | **`pricing_cta_clicked`** | WL-09 |

Eight landing-page events had no owner. They are kept, because each one answers a question the
page needs answered, and each has been given an owner: `hero_viewed`, `hero_cta_clicked`,
`lookup_started`, `how_step_viewed`, `ledger_used`, `wh347_artefact_expanded`, `timeline_viewed`,
`comparison_table_viewed`, `modification_pin_used`, `faq_opened` → **WL-00**;
`alert_email_captured` → **WL-14**.

---

## 1. Public surface — landing page, lookup, county pages · owner [`WL-00`](WL-00-public-rate-lookup.md)

| event | props | what it is for |
|---|---|---|
| `hero_viewed` | `variant` | The denominator for everything else on the page. |
| `hero_cta_clicked` | `variant` | Whether the headline is doing its job. |
| `lookup_started` | `field_first_touched` | Which of the three fields is the friction. |
| **`lookup_performed`** | `state_code`, `county_name`, `construction_type`, `result_count`, `latency_ms`, `source` | **The leading indicator, and THRESHOLDS §1's denominator.** `state_code` also tells outbound where demand is. |
| `lookup_ambiguous` | `candidate_count` | F3 in public. THRESHOLDS P3. |
| `lookup_zero_results` | `state_code`, `county_name`, `construction_type` | A coverage gap, or a county-code bug. |
| `lookup_classification_searched` | `query`, `result_count` | |
| `lookup_official_link_clicked` | `wd_number`, `surface` | **The trust event.** Someone left to verify us. High is good news. |
| **`lookup_cta_clicked`** | `wd_number` | **The top of the funnel. THRESHOLDS §1's numerator.** |
| `modification_pin_used` | `wd_ref`, `from_mod`, `to_mod` | The direct measure of whether the differentiator is understood (LANDING §13 test 1). |
| `timeline_viewed` | — | V2 reached. |
| `ledger_used` | **no values** | Engagement only. The visitor's numbers are never transmitted. |
| `how_step_viewed` | `step` | Where scroll dies. |
| `wh347_artefact_expanded` | `page` | Is V5 worth its weight. |
| `comparison_table_viewed` | — | |
| `faq_opened` | `question_id` | **The objection map, measured.** |
| `public_lookup_rate_limited` | — | |

## 2. Determination watch (public, consented) · owner [`WL-14`](WL-14-wd-watch.md)

| event | props | what it is for |
|---|---|---|
| `alert_email_captured` | `wd_number` | A watch was requested. **Not** a confirmed subscriber. |
| `watch_confirmed` | `wd_number`, `minutes_to_confirm` | The double opt-in closed. This is the list. |
| `watch_limit_reached` | — | Someone hit the 3-per-address cap. |
| `watch_alert_email_sent` | `wd_number`, `from_mod`, `to_mod` | |
| `watch_unsubscribed` | `scope` | |
| `watch_expired` | `wd_number` | 18-month retention swept it. |

## 3. Auth and organisation · owner [`WL-01`](WL-01-auth-and-organisation.md)

`signup_started` · `magic_link_sent {purpose}` · `magic_link_send_failed` ·
`magic_link_consumed {purpose, seconds_to_consume, method}` (`method ∈ {link, code}`) ·
`magic_link_code_used` · `magic_link_expired_view` · `magic_link_rate_limited` ·
**`signup_completed`** (THRESHOLDS §0.1 evaluation point) · `organisation_created {state_code}` ·
`login_completed` · `sign_out`

## 4. Project and determination · owner [`WL-02`](WL-02-project-and-wd-lookup.md)

`project_create_started` · `wd_search_performed {state_code, county_name, construction_type, result_count}` ·
`wd_search_ambiguous {candidate_count}` · `wd_search_zero_results {state_code, county_name, construction_type}` ·
`wd_entered_by_number {matched_alias}` · `wd_resolve_failed {reason}` ·
**`wd_pinned {wd_number, modification_number, pin_method, chosen_from_n, is_superseded}`** ·
`project_created {our_role, construction_type}` · `determination_card_viewed` · `project_repinned {reason}`

## 5. Catalogue, crew, hours, documents, history

| owner | events |
|---|---|
| [`WL-03`](WL-03-classification-catalogue.md) | `classification_catalogue_viewed {wd_number, classification_count}` · `classification_searched {query, result_count}` · **`classification_zero_results {query, wd_number}`** · `classification_row_expanded` · `determination_text_opened {wd_number}` |
| [`WL-04`](WL-04-workers-and-classification-mapping.md) | `worker_added {status}` · `workers_pasted {rows_parsed, rows_skipped}` · `worker_archived` · `worker_duplicate_warned` · **`ssn_full_entry_blocked`** · **`classification_mapped {kb_classification_id, base_rate, fringe_rate}`** · `classification_unmapped` · `classification_none_match_clicked {searches_before}` · `conformance_guide_step_viewed {step}` · `conformance_worksheet_started` · `conformance_worksheet_completed {compared_count}` · `conformance_worksheet_downloaded` · `conformance_outcome_recorded {status, days_elapsed}` · `crew_unmapped_banner_shown {count}` |
| [`WL-05`](WL-05-weekly-hours-entry.md) | `payroll_created {payroll_number_provisional, seeded_lines}` · **`payroll_copied_from_last_week {lines_copied}`** · `hours_grid_opened {worker_count}` · `hours_cell_edited` (1:20) · `hours_keyboard_shortcut_used {shortcut}` · `hours_paste_used {cells}` · `no_work_performed_filed` · `payroll_validation_failed {rule_id}` · `payroll_warning_acknowledged {rule_id}` · `payroll_below_determination_rate_warned {delta_cents}` · **`payroll_certified {payroll_number, worker_count, minutes_in_grid}`** · `payroll_reopened {reason}` |
| [`WL-06`](WL-06-wh347-and-statement-of-compliance.md) | `payroll_certify_started` · **`wh347_generated {payroll_id, worker_count, page_count, wd_number, modification_number, generator_version}` ← THE ACTIVATION EVENT** · `soc_generated` · `wh347_downloaded` · `soc_downloaded` · `both_downloaded` · `wh347_preview_viewed` · `wh347_regenerated {reason}` · `wh347_generation_failed {reason}` · `share_link_created` · `share_link_accessed {days_since_created}` · `share_link_revoked` |
| [`WL-07`](WL-07-payroll-history-and-export.md) | `payroll_history_viewed {project_id, payroll_count}` · `payroll_gap_banner_shown {missing_weeks}` · `payroll_gap_filled` · `payroll_export_started {format, payroll_count, span_days}` · `payroll_export_downloaded {format}` · `payroll_export_failed {format}` · **`document_redownloaded {kind, days_since_generated}`** · `submission_status_set {status}` · `submission_rejected_email_sent` |
| [`WL-08`](WL-08-determination-change-alerts.md) | `wd_modification_detected {wd_number, from_mod, to_mod, pinned_projects}` · `wd_alert_created {affected_worker_count, changed, removed, added}` · **`wd_alert_email_sent`** (THRESHOLDS P2) · `wd_alert_email_opened {hours_to_open}` · `wd_alert_viewed` · `wd_modification_accepted {affected_worker_count, hours_to_decide}` · `wd_modification_dismissed` · `wd_alert_unsubscribed` · `wd_classification_removed_blocking {workers}` |

## 6. Money · owner [`WL-09`](WL-09-billing.md)

| event | props | notes |
|---|---|---|
| `pricing_viewed` | `source` | Scroll-depth denominator for price. |
| **`pricing_cta_clicked`** | `tier`, `interval` | Was `plan_cta_clicked` on the landing page. Tier mix **before** checkout — tells us whether Crew is a decoy or a leak. |
| `gc_tier_interest` | `plan`, `surface` | **The WL-24 trigger.** Emitted by the landing page's GC waitlist and by `/pricing`. |
| `checkout_started` | `plan` | |
| `trial_terms_viewed` | `plan`, `terms_version` | B9: the disclosure was rendered before the card field. |
| `trial_terms_accepted` | `plan`, `terms_version` | B9: the consent record was written. |
| `checkout_abandoned` | `tier`, `step` | |
| `checkout_completed` | `plan` | THRESHOLDS §2 diagnostic step 1. |
| **`trial_started`** | `plan`, `trial_ends_at` | The landing page's primary metric. |
| `trial_ending_banner_shown` | `days_left` | |
| `trial_reminder_email_sent` | `plan`, `days_before_charge` | B9: the pre-charge reminder actually went. |
| `renewal_notice_sent` | `plan`, `days_before_renewal` | B9: annual renewal notice, ≥7 days out. |
| **`subscription_activated`** | `plan`, `mrr_cents`, `days_from_signup` | |
| `subscription_payment_failed` | `attempt` | |
| `subscription_recovered` | — | |
| **`subscription_cancelled`** | `reason`, `days_active`, `payrolls_generated`, `projects` | The churn post-mortem in one event. |
| `tier_limit_reached` | `tier`, `limit` | |
| `tier_upgraded` | `from`, `to` | |
| `portal_opened` | — | |
| `paywall_shown` | `blocked_action` | |

## 7. Settings, help, admin, corpus

| owner | events |
|---|---|
| [`WL-10`](WL-10-settings.md) | `settings_viewed {panel}` · `organisation_updated {fields_changed}` · `certifying_official_set` · `default_daily_hours_changed` · `workweek_start_changed` · `fringe_plan_created {plan_type, is_funded}` · `fringe_plan_archived` · `apprenticeship_program_created {registrar}` · `organisation_deletion_requested` · `organisation_deletion_cancelled` |
| [`WL-11`](WL-11-help-and-legal.md) | `help_article_viewed {slug, from}` · `help_searched {query, result_count}` · `disclaimer_acknowledged {version}` · `disclaimer_expanded {surface}` · `provenance_line_expanded {wd_number}` · **`official_determination_link_clicked {wd_number, surface}`** ← one definition, one owner; WL-02, WL-03 and WL-00 all emit **this** name with their own `surface` · `support_email_started {from_page}` · `legal_page_viewed {page}` |
| [`WL-12`](WL-12-admin-metrics.md) | `admin_metrics_viewed {window}` · `admin_events_exported {window, rows}` |
| [`WL-13`](WL-13-kb-ingestion-and-refresh.md) | `kb_ingest_started {kind}` · `kb_preflight_aborted {reason, seen, expected}` · `kb_index_fetched {records}` · `kb_determination_added {wd_number, modification_number, classifications}` · `kb_history_fetched {wd_number, revisions}` · `kb_superseded_revision_added {wd_number, modification_number, trigger}` · `kb_modification_detected {wd_number, from_mod, to_mod, pinned_projects}` · `kb_determination_deactivated {wd_number}` · `kb_ingest_gate_failed {gate, wd_number}` · `kb_ingest_completed {kind, new, changed, duration_ms, parse_coverage}` |

---

## 8. The pre-committed funnel, expressed in these names only

Every ratio [`../THRESHOLDS.md`](../THRESHOLDS.md) commits to, written in the canonical names, so
the two documents cannot drift:

| THRESHOLDS | numerator ÷ denominator |
|---|---|
| §1 lookup → CTA | `lookup_cta_clicked` ÷ `lookup_performed` |
| §1 CTA → signup | `signup_completed` ÷ `lookup_cta_clicked` |
| §2 activation | first `wh347_generated` per org ÷ `signup_completed` |
| §2 diagnostic 1 | `checkout_completed` ÷ `signup_completed` |
| §2 diagnostic 2 | `wd_pinned` ÷ `checkout_completed` |
| §2 diagnostic 3 | first `classification_mapped` ÷ `wd_pinned` |
| §2 diagnostic 4 | `wh347_generated` ÷ first `classification_mapped` |
| §3 activation → paid | `subscription_activated` ÷ first `wh347_generated` |
| §4a logo retention | `subscriptions.status ∈ {active, trialing}` at day 60 ÷ paid in month 1 |
| §4b usage retention | `wh347_generated` in days 31–60 ÷ paid in month 1 |
| §5 P1 | median `payroll_certified.minutes_in_grid` at the 4th payroll |
| §5 P2 | `wd_alert_email_sent` ÷ active project-years |
| §5 P3 | `wd_search_ambiguous` ÷ `wd_search_performed` |
| §5 P4 | `official_determination_link_clicked` per activated org, first 30 days |
| §5 P5 | `ssn_full_entry_blocked` count |
| landing primary | `trial_started` per unique visitor |
| landing leading | `lookup_performed` per unique visitor |

## Test plan

**Union test (CI)** — the generated union in `lib/analytics/events.ts` equals the set of names in
this file, both directions. A name here with no emitter is a warning; an emitter with no name here
fails the build.
**Props test (CI)** — every prop named here is present on at least one emit site fixture, and no
emit site adds a prop this file does not list.
**Privacy test (CI)** — WL-12 V5's walk, extended to every name above.
**Funnel test** — §8's ratios computed against a synthetic event stream, asserting each is
computable from these names alone. *This is the test that proves B6 stays fixed.*
