/**
 * The freshness clock — pure, and the narrowest thing in this system.
 *
 * Spec: ARCHITECTURE.md §8.1's ladder and §7.1's `freshness.sweep` ("hourly; advance
 * every pin's ladder level from `freshness_checked_at`; fails closed by: pure
 * function of timestamps").
 *
 *   L0 normal    — verified within FRESHNESS_DATED_HOURS
 *   L1 DATED     — age > 24 h. Blocks NOTHING. Dated footer and banner.
 *   L2 STALE     — age > 72 h (D7's SLA). Blocks NEW PINS only, and accrues credit.
 *
 * THE ONE LINE THAT IS D7: **freshness never blocks a filing.** §6.3 and
 * `src/lib/types.ts` both say it — "FRESHNESS NEVER PRODUCES DRAFT_NOT_CERTIFIABLE"
 * — and this module is where the temptation lives, because it is the module that
 * knows how old the corpus is. So `blocksFiling` is a field on the result, it is
 * `false` in every branch, and the test enumerates the ladder and asserts it.
 *
 * The freshness value is deliberately separate from the rate (§3.3): "a filing needs
 * a rate and does not need freshness, so freshness can be unknown without the filing
 * being blocked."
 */

import type { CorpusLadderLevel, FreshnessState } from '../../lib/types';
import { hoursBetween } from '../clock';

export interface FreshnessThresholds {
  /** Default 24. */
  readonly datedHours: number;
  /** Default 72 — D7's published SLA, and where the credit starts. */
  readonly slaHours: number;
}

export interface FreshnessVerdict {
  readonly state: FreshnessState;
  readonly ladderLevel: CorpusLadderLevel;
  readonly ageHours: number;
  readonly verifiedAt: Date;
  /** Always false. See the header. */
  readonly blocksFiling: false;
  /** L2 blocks NEW pins — a rate we have never asserted before is a new claim, and a
   *  new claim is exactly what a stale corpus may not make. */
  readonly blocksNewPins: boolean;
  readonly accruesCredit: boolean;
  /** The sentence the footer and the banner share (§10.3: one source, three
   *  surfaces, no drift). It states the date; it never states a dollar figure —
   *  money comes from the posted ledger, in `stalenessBanner`. */
  readonly claim: string;
}

export function assessFreshness(input: {
  readonly verifiedAt: Date;
  readonly now: Date;
  readonly thresholds: FreshnessThresholds;
}): FreshnessVerdict {
  const ageHours = Math.max(0, hoursBetween(input.verifiedAt, input.now));
  const asOf = input.verifiedAt.toISOString().replace('T', ' ').slice(0, 16);

  if (ageHours > input.thresholds.slaHours) {
    return {
      state: 'STALE',
      ladderLevel: 'L2_STALE',
      ageHours,
      verifiedAt: input.verifiedAt,
      blocksFiling: false,
      blocksNewPins: true,
      accruesCredit: true,
      claim:
        `Verified against the revision published on record; newer-revision checks ` +
        `have not completed since ${asOf} UTC. Rates on your filings are unchanged.`,
    };
  }

  if (ageHours > input.thresholds.datedHours) {
    return {
      state: 'DATED',
      ladderLevel: 'L1_DATED',
      ageHours,
      verifiedAt: input.verifiedAt,
      blocksFiling: false,
      blocksNewPins: false,
      accruesCredit: false,
      claim: `Newer-revision check last completed ${asOf} UTC.`,
    };
  }

  return {
    state: 'FRESH',
    ladderLevel: 'L0_NORMAL',
    ageHours,
    verifiedAt: input.verifiedAt,
    blocksFiling: false,
    blocksNewPins: false,
    accruesCredit: false,
    claim: `Newer-revision check completed ${asOf} UTC.`,
  };
}

/**
 * The window a staleness credit accrues over: from the moment the SLA was breached,
 * not from the moment verification lapsed.
 *
 * The distinction is a day and a half of somebody's money, and it is the honest
 * reading of D7: the promise is "verified within 72 hours", so the guarantee is
 * broken at hour 72 and not at hour 1.
 */
export function stalenessWindow(input: {
  readonly verifiedAt: Date;
  readonly now: Date;
  readonly thresholds: FreshnessThresholds;
}): { readonly from: Date; readonly to: Date } | null {
  const breachAt = new Date(input.verifiedAt.getTime() + input.thresholds.slaHours * 3_600_000);
  if (input.now.getTime() <= breachAt.getTime()) return null;
  return { from: breachAt, to: input.now };
}
