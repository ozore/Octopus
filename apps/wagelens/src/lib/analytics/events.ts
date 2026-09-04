/**
 * THE CANONICAL ANALYTICS VOCABULARY — `specs/WL-EVENTS.md`, as a type.
 *
 * Not a feature, a contract. One event, one definition, one owner: a name that
 * is not in this union does not get emitted, and `emitEvent` accepts nothing
 * else. `tests/events.test.ts` asserts that every literal passed to `emitEvent`
 * in `src/` is in the union — which is the reason finding B6 (the landing page
 * and the specs running two vocabularies, so `THRESHOLDS.md`'s pre-committed
 * funnel could not be computed) cannot come back.
 *
 * **Privacy, inherited and non-negotiable.** No `props` value ever carries an
 * email address, a worker name, an identifying number or an IP address. Public
 * events carry an IP **hash** only, and `emitEvent` drops anything else that
 * looks like a person before the row is written.
 */

import { track } from '@octopus/platform/events';
import type { Db } from '@octopus/platform/db';

export const WL_EVENTS = [
  // §1 Public surface — owner WL-00
  'hero_viewed',
  'hero_cta_clicked',
  'lookup_started',
  'lookup_performed',
  'lookup_ambiguous',
  'lookup_zero_results',
  'lookup_classification_searched',
  'lookup_official_link_clicked',
  'lookup_cta_clicked',
  'modification_pin_used',
  'timeline_viewed',
  'ledger_used',
  'how_step_viewed',
  'wh347_artefact_expanded',
  'comparison_table_viewed',
  'faq_opened',
  'public_lookup_rate_limited',
  'public_lookup_corpus_unavailable',
  'public_lookup_not_found',
  'public_revision_fetch_enqueued',
  // §2 Determination watch — owner WL-14
  'alert_email_captured',
  'watch_confirmed',
  'watch_limit_reached',
  'watch_alert_email_sent',
  'watch_unsubscribed',
  'watch_expired',
  // §3 Auth and organisation — owner WL-01
  'signup_started',
  'magic_link_sent',
  'magic_link_send_failed',
  'magic_link_consumed',
  'magic_link_code_used',
  'magic_link_expired_view',
  'magic_link_rate_limited',
  'signup_completed',
  'organisation_created',
  'login_completed',
  'sign_out',
  // §4 Project and determination — owner WL-02
  'project_create_started',
  'wd_search_performed',
  'wd_search_ambiguous',
  'wd_search_zero_results',
  'wd_entered_by_number',
  'wd_resolve_failed',
  'wd_pinned',
  'project_created',
  'determination_card_viewed',
  'project_repinned',
  // §5 Catalogue, crew, hours, documents, history — owners WL-03…WL-08
  'classification_catalogue_viewed',
  'classification_searched',
  'classification_zero_results',
  'classification_row_expanded',
  'determination_text_opened',
  'worker_added',
  'workers_pasted',
  'worker_archived',
  'worker_duplicate_warned',
  'ssn_full_entry_blocked',
  'classification_mapped',
  'classification_unmapped',
  'classification_none_match_clicked',
  'conformance_guide_step_viewed',
  'conformance_worksheet_started',
  'conformance_worksheet_completed',
  'conformance_worksheet_downloaded',
  'conformance_outcome_recorded',
  'crew_unmapped_banner_shown',
  'payroll_created',
  'payroll_copied_from_last_week',
  'hours_grid_opened',
  'hours_cell_edited',
  'hours_keyboard_shortcut_used',
  'hours_paste_used',
  'no_work_performed_filed',
  'payroll_validation_failed',
  'payroll_warning_acknowledged',
  'payroll_below_determination_rate_warned',
  'payroll_certified',
  'payroll_reopened',
  'payroll_certify_started',
  'wh347_generated',
  'soc_generated',
  'wh347_downloaded',
  'soc_downloaded',
  'both_downloaded',
  'wh347_preview_viewed',
  'wh347_regenerated',
  'wh347_generation_failed',
  'share_link_created',
  'share_link_accessed',
  'share_link_revoked',
  'payroll_history_viewed',
  'payroll_gap_banner_shown',
  'payroll_gap_filled',
  'payroll_export_started',
  'payroll_export_downloaded',
  'payroll_export_failed',
  'document_redownloaded',
  'submission_status_set',
  'submission_rejected_email_sent',
  'wd_modification_detected',
  'wd_alert_created',
  'wd_alert_email_sent',
  'wd_alert_email_opened',
  'wd_alert_viewed',
  'wd_modification_accepted',
  'wd_modification_dismissed',
  'wd_alert_unsubscribed',
  'wd_classification_removed_blocking',
  // §6 Money — owner WL-09
  'pricing_viewed',
  'pricing_cta_clicked',
  'gc_tier_interest',
  'checkout_started',
  'trial_terms_viewed',
  'trial_terms_accepted',
  'checkout_abandoned',
  'checkout_completed',
  'trial_started',
  'trial_ending_banner_shown',
  'trial_reminder_email_sent',
  'renewal_notice_sent',
  'subscription_activated',
  'subscription_payment_failed',
  'subscription_recovered',
  'subscription_cancelled',
  'tier_limit_reached',
  'tier_upgraded',
  'portal_opened',
  'paywall_shown',
  // §7 Settings — owner WL-10
  'settings_viewed',
  'organisation_updated',
  'certifying_official_set',
  'default_daily_hours_changed',
  'workweek_start_changed',
  'fringe_plan_created',
  'fringe_plan_archived',
  'apprenticeship_program_created',
  'organisation_deletion_requested',
  'organisation_deletion_cancelled',
  // §7 Admin — owner WL-12
  'admin_metrics_viewed',
  'admin_events_exported',
  // WL-11 help, legal and provenance
  'help_article_viewed',
  'help_searched',
  'disclaimer_acknowledged',
  'disclaimer_expanded',
  'provenance_line_expanded',
  'official_determination_link_clicked',
  'support_email_started',
  'legal_page_viewed',
  // WL-13 ingestion
  'kb_ingest_started',
  'kb_preflight_aborted',
  'kb_index_fetched',
  'kb_determination_added',
  'kb_history_fetched',
  'kb_superseded_revision_added',
  'kb_modification_detected',
  'kb_determination_deactivated',
  'kb_ingest_gate_failed',
  'kb_ingest_completed',
] as const;

export type WlEventName = (typeof WL_EVENTS)[number];

const ALLOWED = new Set<string>(WL_EVENTS);

/**
 * Anything that identifies a PERSON. A prop matching one of these is dropped
 * before the row is written, so a careless call site cannot leak.
 *
 * It is a denylist of names and not a suffix rule on `_name`, and the reason is
 * `county_name`: THRESHOLDS.md's funnel is computed per county and per state,
 * and a filter that swallowed a place name to catch a person's name would break
 * the instrument it is protecting. A county is not a person.
 */
const FORBIDDEN_PROP_KEYS =
  /^(email|ip|ip_address|ip_addr|remote_addr|ssn|social_security|address|home_address|street|phone|worker_name|first_name|last_name|full_name|user_name|contact_name|certifying_official_name)$|_(email|ssn|address|phone)$/i;

export async function emitEvent(
  db: Db,
  name: WlEventName,
  options: { orgId?: string | null; userId?: string | null; props?: Record<string, unknown> } = {},
): Promise<void> {
  if (!ALLOWED.has(name)) {
    // A name outside the vocabulary is a bug in the caller, not a metric.
    throw new Error(`emitEvent: "${name}" is not in WL-EVENTS.md`);
  }
  const props: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options.props ?? {})) {
    // `ip_hash` is explicitly allowed; `ip` is not.
    if (FORBIDDEN_PROP_KEYS.test(key) && key !== 'ip_hash') continue;
    props[key] = value;
  }
  await track(db, {
    name,
    orgId: options.orgId ?? null,
    userId: options.userId ?? null,
    props,
  });
}
