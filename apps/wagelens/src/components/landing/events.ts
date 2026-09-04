/**
 * THE LANDING PAGE COINS NO EVENT NAMES (LANDING_SPEC finding B6).
 *
 * Every name below is typed `WlEventName`, so the union in
 * `src/lib/analytics/events.ts` — which is `specs/WL-EVENTS.md` as a type — is
 * the only thing that can widen this list. A name this page invented would not
 * compile, which is a stronger guarantee than the CI grep because it fires
 * before the code is written rather than after.
 *
 * `THRESHOLDS.md` §1 pre-commits to the band `lookup_cta_clicked ÷
 * lookup_performed`. Both are emitted here, under those names, which is what
 * makes the ratio computable at all.
 */

import type { WlEventName } from '@/lib/analytics/events';

/** The events the BROWSER may ask the server to record. Anything not in this
 *  set is refused by the action, so a tampered call cannot write a row. */
export const LANDING_CLIENT_EVENTS = [
  'hero_cta_clicked',
  'lookup_started',
  'lookup_official_link_clicked',
  'lookup_cta_clicked',
  'modification_pin_used',
  'timeline_viewed',
  'ledger_used',
  'how_step_viewed',
  'wh347_artefact_expanded',
  'comparison_table_viewed',
  'faq_opened',
  'pricing_viewed',
  'pricing_cta_clicked',
  'gc_tier_interest',
] as const satisfies readonly WlEventName[];

export type LandingClientEvent = (typeof LANDING_CLIENT_EVENTS)[number];

const ALLOWED = new Set<string>(LANDING_CLIENT_EVENTS);

export function isLandingClientEvent(name: string): name is LandingClientEvent {
  return ALLOWED.has(name);
}

/**
 * The props a browser-recorded event may carry. Deliberately a tiny, scalar,
 * allow-listed shape: `emitEvent` already drops anything person-shaped, and
 * this narrows it again before the value ever reaches the server. The ledger's
 * numbers are not in it, and must never be — `ledger_used` carries **no values**
 * (LANDING_SPEC §6 V4).
 */
export const LANDING_PROP_KEYS = [
  'variant',
  'field_first_touched',
  'wd_number',
  'wd_ref',
  'from_mod',
  'to_mod',
  'surface',
  'step',
  'page',
  'question_id',
  'tier',
  'interval',
  'plan',
  'source',
] as const;
