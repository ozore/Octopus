/**
 * The pricing ladder.
 *
 * Spec: IDEA_DOSSIER.md D4 — "$149 / $399 / $49-mo — deliberately ABOVE the
 * $97 incumbent... undercutting an undifferentiated incumbent is the classic
 * 'minivation'." ARCHITECTURE.md §3.5 / ADR-007.
 *
 * This is the single source of amount-in-cents truth for the app layer.
 * `adapters/stripe.mock.ts` keeps its own `TIER_AMOUNT_CENTS` copy because the
 * mock adapter must be able to answer `createCheckoutSession` with no
 * knowledge of this module (adapters/ never imports from lib/billing/ — the
 * dependency direction is billing → adapters, never the reverse). The two
 * tables are asserted equal in tests so they cannot silently drift.
 */

import type { PaymentTier } from '../adapters/stripe';

export type { PaymentTier };

export const TIER_AMOUNT_CENTS: Record<PaymentTier, number> = {
  rescue: 14900,
  rescue_human: 39900,
  shield_monthly: 4900,
};

export const TIER_LABELS: Record<PaymentTier, string> = {
  rescue: 'Rescue',
  rescue_human: 'Rescue + Human',
  shield_monthly: 'Shield',
};

/** D6: 30 days of Shield included with every paid appeal tier, card on file,
 *  card-on-file → the retention decision lands at day 30, not at intake. */
export const SHIELD_INCLUDED_DAYS = 30;

export function isAppealTier(tier: PaymentTier): tier is 'rescue' | 'rescue_human' {
  return tier === 'rescue' || tier === 'rescue_human';
}
