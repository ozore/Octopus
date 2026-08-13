/**
 * §11 — THE FRESHNESS CLOCK AND THE DEGRADATION LADDER L0..L5.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §11.1 (the clock), §11.2 (the four tiers), §6.4
 * (the free tier, which the tier table understates), and `ARCHITECTURE.md` §4.5 /
 * §8.1 for the ladder's customer-visible behaviour — which `CORPUS_DESIGN` §0.5
 * explicitly defers to. `CORPUS_LADDER` in `src/lib/types.ts` is the shared table;
 * this module computes WHICH LEVELS HOLD and what that means for a request.
 *
 * ---------------------------------------------------------------------------
 * THE ONE SENTENCE THE WHOLE PRODUCT RESTS ON
 *
 * **A filing on an already-pinned project always generates.** Every rule below is a
 * rule about what we may newly ASSERT, never about whether the customer can file on
 * Friday. `blocksFilingOnPinnedProject` is `false` at every level of
 * `CORPUS_LADDER`, and `blocksFiling()` here returns `false` unconditionally and is
 * tested that way — the autonomy objection closed on exactly this boundary (D7, P5).
 *
 * The precise line: an assertion about the PRESENT ("no newer revision exists",
 * "this is the correct WD for your county today", "here is a corpus rate on a new
 * form") fails closed. An assertion about the PAST ("revision 2, published
 * 2026-08-06, contained $36.85") is served from the mirror and cannot fail.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE CLOCK IS NOT
 *
 * `corpusVerifiedAt` is not the last time the cron ran and not the last time a
 * request succeeded. It is the last time a snapshot PASSED EVERY GATE AND WAS
 * PROMOTED. A job that runs every night and is HELD every night advances nothing,
 * which is the correct semantics: the guarantee is about verified freshness, not
 * about our cron's feelings. A job that fails four nights running must produce the
 * same customer-visible outcome as a job that did not run at all, or the staleness
 * guarantee is a lie.
 */

import { narrowedClaim } from '@/lib/result';
import {
  CORPUS_LADDER,
  type CorpusLadderLevel,
  type Freshness,
  type FreshnessState,
  type Refusal,
} from '@/lib/types';

export const DATED_HOURS = 24;
export const STALE_HOURS = 72;
export const EXPORT_OFFER_DAYS = 14;

const HOUR_MS = 3_600_000;

export interface FreshnessInput {
  /** `max(promoted_at)` over snapshots in state promoted|superseded. `null` means
   *  nothing has ever been promoted, which is treated as STALE — an unverified
   *  corpus is not a fresh one. */
  readonly corpusVerifiedAt: Date | null;
  readonly now: Date;
}

export function ageHours(input: FreshnessInput): number | null {
  if (!input.corpusVerifiedAt) return null;
  return (input.now.getTime() - input.corpusVerifiedAt.getTime()) / HOUR_MS;
}

export function freshnessStateOf(input: FreshnessInput): FreshnessState {
  const age = ageHours(input);
  if (age === null) return 'STALE';
  if (age < DATED_HOURS) return 'FRESH';
  if (age < STALE_HOURS) return 'DATED';
  return 'STALE';
}

export function freshnessOf(input: FreshnessInput): Freshness {
  return {
    state: freshnessStateOf(input),
    corpusVerifiedAt: input.corpusVerifiedAt,
    checkedAt: input.now,
  };
}

// ===========================================================================
// The ladder — states COMPOSE
// ===========================================================================

export interface LadderInput extends FreshnessInput {
  /** An open `corpus_freeze` row: probe 2 or 3 red. Product-scoped. */
  readonly frozenByProbe: boolean;
  /** A blocking-set variance or a parse-rate drop held the last snapshot.
   *  Snapshot-scoped: filings on unaffected WDs are untouched. */
  readonly quarantineOpen: boolean;
  /** The DIR XSD content hash differs from the pinned hash. */
  readonly xsdMismatch: boolean;
  /** The golden canary is red (G1) or the post-deploy canary regressed. */
  readonly canaryRed: boolean;
}

/**
 * L1 and L3 can hold simultaneously and the banner is their union, so this returns
 * a SET rather than a level. A ladder in prose is a ladder that drifts; this is the
 * table in `CORPUS_LADDER` made computable.
 */
export function ladderLevels(input: LadderInput): readonly CorpusLadderLevel[] {
  const levels: CorpusLadderLevel[] = [];
  const state = freshnessStateOf(input);

  if (state === 'DATED') levels.push('L1_DATED');
  if (state === 'STALE') levels.push('L2_STALE');
  if (input.quarantineOpen || input.frozenByProbe) levels.push('L3_QUARANTINE');
  if (input.xsdMismatch) levels.push('L4_XML_BLOCKED');
  if (input.canaryRed) levels.push('L5_RELEASE_FROZEN');

  return levels.length === 0 ? ['L0_NORMAL'] : levels;
}

function anyLevel(
  levels: readonly CorpusLadderLevel[],
  predicate: (rule: (typeof CORPUS_LADDER)[CorpusLadderLevel]) => boolean,
): boolean {
  return levels.some((level) => predicate(CORPUS_LADDER[level]));
}

/**
 * THE COLUMN THAT IS FALSE EVERYWHERE. Not a lookup with a default — a constant,
 * so that no future edit to the ladder table can turn a corpus problem into a
 * customer who cannot file on a Friday afternoon.
 */
export function blocksFilingOnPinnedProject(): false {
  return false;
}

/** L2 blocks a NEW pin. An existing pin is untouched at every level. */
export function blocksNewPins(levels: readonly CorpusLadderLevel[]): boolean {
  return anyLevel(levels, (rule) => rule.blocksNewPins);
}

/**
 * "New rate assertions" means putting a corpus rate onto a NEW form or resolving a
 * WD for the first time. It covers the FREE GENERATOR too, and §11.2's tier table
 * understates that: the visitor with no account is the one who never sees a banner,
 * and every free-tier rate assertion is a first-time resolution with no pin behind
 * it. §6.4 rule 2 is the full rule — at L2 the free generator stops sourcing rates
 * from the corpus exactly as the paid path stops establishing pins, while the
 * county x craft lookup pages KEEP RENDERING under a dated narrowing rather than
 * going blank. A blank page teaches the visitor nothing and hides the staleness we
 * are trying to disclose.
 */
export function suppressesNewRateAssertions(levels: readonly CorpusLadderLevel[]): boolean {
  return anyLevel(levels, (rule) => rule.suppressesNewRateAssertions);
}

export function blocksEcprGeneration(levels: readonly CorpusLadderLevel[]): boolean {
  return anyLevel(levels, (rule) => rule.blocksEcprGeneration);
}

export function blocksPromotion(levels: readonly CorpusLadderLevel[]): boolean {
  return anyLevel(levels, (rule) => rule.blocksPromotion);
}

export function blocksBuild(levels: readonly CorpusLadderLevel[]): boolean {
  return anyLevel(levels, (rule) => rule.blocksBuild);
}

export function accruesCredit(levels: readonly CorpusLadderLevel[]): boolean {
  return anyLevel(levels, (rule) => rule.accruesCredit);
}

/** The lookup page always renders — under a dated narrowing when stale, never
 *  blank, never with currency framing (§6.4 rule 2, row 2). */
export function lookupPageRenders(): true {
  return true;
}

// ===========================================================================
// The banner — the only `Refusal` this subsystem constructs
// ===========================================================================

export interface BannerInput extends LadderInput {
  /** Free-tier visitors get the same sentence with the same timestamp; only the
   *  credit differs, because only one of them paid. That symmetry is the point:
   *  the honesty is a property of the corpus state, not of the price. */
  readonly paying: boolean;
}

function timestamp(date: Date | null): string {
  if (!date) return 'never';
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

/**
 * P-C — a narrowed claim with a dated banner, and an accruing credit when the
 * narrowing is OUR failure.
 *
 * The date is not optional and there is no overload without it: a narrowing without
 * a timestamp is vagueness wearing a refusal's clothes, and the whole value of the
 * narrowed sentence is that it says exactly how old our knowledge is.
 *
 * NOTE ON THE CREDIT FIELD. `cents` is `null` here on purpose. This module states
 * that a credit is ACCRUING and since when; the amount is computed and posted by
 * billing against `staleness_window`, with the Stripe idempotency key derived from
 * `(account_id, staleness_window_id)`. The corpus does not price anything.
 */
export function corpusBanner(input: BannerInput): Refusal | null {
  const levels = ladderLevels(input);
  if (levels.length === 1 && levels[0] === 'L0_NORMAL') return null;

  const verified = timestamp(input.corpusVerifiedAt);
  const state = freshnessStateOf(input);

  if (input.canaryRed) {
    return narrowedClaim({
      headline: 'Rate checks are re-running',
      narrowedClaim:
        `The corpus is serving the last snapshot that passed every gate, verified ${verified}. ` +
        'No new snapshot is being promoted until the golden payroll suite is green again. ' +
        'Filings on your pinned revisions are unaffected.',
      asOf: input.now,
      ladderLevel: 'L5_RELEASE_FROZEN',
    });
  }

  if (input.xsdMismatch) {
    return narrowedClaim({
      headline: 'California eCPR XML is unavailable',
      narrowedClaim:
        'The DIR schema no longer matches the hash this build pins, so eCPR XML generation is ' +
        'stopped rather than emitting a file the portal would reject. The federal WH-347 path is ' +
        `unaffected. Last verified ${verified}.`,
      asOf: input.now,
      ladderLevel: 'L4_XML_BLOCKED',
    });
  }

  if (input.frozenByProbe || input.quarantineOpen) {
    return narrowedClaim({
      headline: 'New rate assertions are paused',
      narrowedClaim:
        `We are holding new rate assertions while the source is re-checked. Rates already pinned ` +
        `to your projects are unchanged and still generate. Last verified ${verified}.`,
      asOf: input.now,
      ladderLevel: 'L3_QUARANTINE',
      credit: input.paying
        ? {
            reason: 'corpus_quarantine',
            accruingSince: input.corpusVerifiedAt ?? input.now,
            cents: null,
          }
        : null,
    });
  }

  if (state === 'STALE') {
    const days = (ageHours(input) ?? 0) / 24;
    const exportOffer =
      days > EXPORT_OFFER_DAYS
        ? ' Your full rate-of-record archive remains one click away, as does cancelling.'
        : '';
    return narrowedClaim({
      headline: 'We have not verified against the source since ' + verified,
      narrowedClaim:
        `New rate assertions are suppressed: no first-time wage-determination resolution and no ` +
        `claim that a newer revision does not exist. Rates shown are from your pinned revision ` +
        `and are unaffected — a filing on an already-pinned project generates normally.${exportOffer}`,
      asOf: input.now,
      ladderLevel: 'L2_STALE',
      credit: input.paying
        ? {
            reason: 'corpus_staleness',
            accruingSince: input.corpusVerifiedAt ?? input.now,
            cents: null,
          }
        : null,
    });
  }

  return narrowedClaim({
    headline: 'Newer-revision check last completed ' + verified,
    narrowedClaim:
      'Rates shown are from your pinned revision and are unaffected. A first-time wage-determination ' +
      'resolution carries this date as a caveat.',
    asOf: input.now,
    ladderLevel: 'L1_DATED',
  });
}
