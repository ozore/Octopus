/**
 * §11 — THE FRESHNESS CLOCK AND THE LADDER.
 *
 * The load-bearing assertion in this file is one line, and it is the line the whole
 * autonomy objection closed on:
 *
 *   **A filing on an already-pinned project generates at every level of the ladder.**
 *
 * D7 retargeted fail-closed from THE FILING to THE NOVEL RATE CLAIM. An assertion
 * about the present ("no newer revision exists", "here is a rate for a WD you have
 * never pinned") fails closed. An assertion about the past ("revision 2, published
 * 2026-08-06, contained $36.85") is served from the mirror and cannot fail.
 */

import { describe, expect, it } from 'vitest';

import {
  accruesCredit,
  blocksBuild,
  blocksEcprGeneration,
  blocksFilingOnPinnedProject,
  blocksNewPins,
  blocksPromotion,
  corpusBanner,
  DATED_HOURS,
  freshnessStateOf,
  ladderLevels,
  lookupPageRenders,
  STALE_HOURS,
  suppressesNewRateAssertions,
  type LadderInput,
} from '@/corpus';
import { CORPUS_LADDER, type CorpusLadderLevel } from '@/lib/types';

const NOW = new Date('2026-08-13T12:00:00Z');

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * 3_600_000);
}

function input(overrides: Partial<LadderInput> = {}): LadderInput {
  return {
    corpusVerifiedAt: hoursAgo(1),
    now: NOW,
    frozenByProbe: false,
    quarantineOpen: false,
    xsdMismatch: false,
    canaryRed: false,
    ...overrides,
  };
}

describe('the freshness clock', () => {
  it('FRESH under 24h, DATED 24-72h, STALE beyond 72h', () => {
    expect(freshnessStateOf(input({ corpusVerifiedAt: hoursAgo(1) }))).toBe('FRESH');
    expect(freshnessStateOf(input({ corpusVerifiedAt: hoursAgo(DATED_HOURS - 0.1) }))).toBe('FRESH');
    expect(freshnessStateOf(input({ corpusVerifiedAt: hoursAgo(DATED_HOURS) }))).toBe('DATED');
    expect(freshnessStateOf(input({ corpusVerifiedAt: hoursAgo(STALE_HOURS - 0.1) }))).toBe('DATED');
    expect(freshnessStateOf(input({ corpusVerifiedAt: hoursAgo(STALE_HOURS) }))).toBe('STALE');
  });

  /**
   * A job that runs every night and is HELD every night advances nothing. The clock
   * reads `max(promoted_at)`, never "the cron ran" — the guarantee is about verified
   * freshness, not about our cron's feelings (§11.1).
   */
  it('treats a corpus that has never been promoted as STALE, not as fresh', () => {
    expect(freshnessStateOf(input({ corpusVerifiedAt: null }))).toBe('STALE');
  });
});

describe('THE INVARIANT — a filing on a pinned project always generates', () => {
  it('is false at every level of the ladder table', () => {
    for (const level of Object.keys(CORPUS_LADDER) as CorpusLadderLevel[]) {
      expect(CORPUS_LADDER[level].blocksFilingOnPinnedProject, level).toBe(false);
    }
  });

  it('holds under every combination of ladder states', () => {
    for (const frozenByProbe of [false, true]) {
      for (const quarantineOpen of [false, true]) {
        for (const xsdMismatch of [false, true]) {
          for (const canaryRed of [false, true]) {
            for (const age of [1, 36, 100, 400]) {
              const levels = ladderLevels(
                input({
                  corpusVerifiedAt: hoursAgo(age),
                  frozenByProbe,
                  quarantineOpen,
                  xsdMismatch,
                  canaryRed,
                }),
              );
              expect(blocksFilingOnPinnedProject()).toBe(false);
              expect(levels.every((l) => CORPUS_LADDER[l].blocksFilingOnPinnedProject === false)).toBe(
                true,
              );
            }
          }
        }
      }
    }
  });
});

describe('L2 STALE — what it blocks and what it does not', () => {
  it('blocks NEW pins and suppresses new rate assertions', () => {
    const levels = ladderLevels(input({ corpusVerifiedAt: hoursAgo(80) }));
    expect(levels).toContain('L2_STALE');
    expect(blocksNewPins(levels)).toBe(true);
    expect(suppressesNewRateAssertions(levels)).toBe(true);
    expect(accruesCredit(levels)).toBe(true);
  });

  it('does NOT block the eCPR path, the build, or promotion', () => {
    const levels = ladderLevels(input({ corpusVerifiedAt: hoursAgo(80) }));
    expect(blocksEcprGeneration(levels)).toBe(false);
    expect(blocksBuild(levels)).toBe(false);
    expect(blocksPromotion(levels)).toBe(false);
  });

  /** §6.4 rule 2, row 2: the lookup page renders from the last promoted snapshot
   *  under a dated narrowing. Never blank, never silently stale. */
  it('leaves the county x craft lookup pages rendering', () => {
    expect(lookupPageRenders()).toBe(true);
  });

  it('L1 DATED blocks nothing at all', () => {
    const levels = ladderLevels(input({ corpusVerifiedAt: hoursAgo(36) }));
    expect(levels).toEqual(['L1_DATED']);
    expect(blocksNewPins(levels)).toBe(false);
    expect(suppressesNewRateAssertions(levels)).toBe(false);
    expect(accruesCredit(levels)).toBe(false);
  });
});

describe('the ladder composes', () => {
  it('L1 and L3 hold simultaneously', () => {
    const levels = ladderLevels(input({ corpusVerifiedAt: hoursAgo(36), quarantineOpen: true }));
    expect(levels).toContain('L1_DATED');
    expect(levels).toContain('L3_QUARANTINE');
    expect(suppressesNewRateAssertions(levels)).toBe(true);
    expect(blocksPromotion(levels)).toBe(true);
  });

  it('L4 blocks the eCPR ARTIFACT and nothing federal', () => {
    const levels = ladderLevels(input({ xsdMismatch: true }));
    expect(levels).toEqual(['L4_XML_BLOCKED']);
    expect(blocksEcprGeneration(levels)).toBe(true);
    expect(blocksNewPins(levels)).toBe(false);
    expect(suppressesNewRateAssertions(levels)).toBe(false);
  });

  it('L5 blocks the build and promotion', () => {
    const levels = ladderLevels(input({ canaryRed: true }));
    expect(blocksBuild(levels)).toBe(true);
    expect(blocksPromotion(levels)).toBe(true);
  });
});

describe('the banner is a P-C narrowing, and it is dated', () => {
  it('is null at L0', () => {
    expect(corpusBanner({ ...input(), paying: true })).toBeNull();
  });

  it('carries a timestamp and a credit at L2 for a paying account', () => {
    const banner = corpusBanner({ ...input({ corpusVerifiedAt: hoursAgo(80) }), paying: true });
    expect(banner?.primitive).toBe('P-C');
    if (banner?.primitive !== 'P-C') return;
    expect(banner.ladderLevel).toBe('L2_STALE');
    expect(banner.asOf).toEqual(NOW);
    expect(banner.headline).toContain('2026-08-10');
    expect(banner.credit?.reason).toBe('corpus_staleness');
    // The corpus never prices anything: the amount is billing's, from
    // `staleness_window`.
    expect(banner.credit?.cents).toBeNull();
  });

  /** Free visitors get the same sentence with the same timestamp; only the credit
   *  differs, because only one of them paid. The honesty is a property of the
   *  corpus state, not of the price (§6.4). */
  it('gives a free visitor the same sentence and no credit', () => {
    const paid = corpusBanner({ ...input({ corpusVerifiedAt: hoursAgo(80) }), paying: true });
    const free = corpusBanner({ ...input({ corpusVerifiedAt: hoursAgo(80) }), paying: false });
    expect(free?.primitive).toBe('P-C');
    if (free?.primitive !== 'P-C' || paid?.primitive !== 'P-C') return;
    expect(free.headline).toBe(paid.headline);
    expect(free.narrowedClaim).toBe(paid.narrowedClaim);
    expect(free.credit).toBeNull();
  });

  it('says plainly that a pinned filing still generates', () => {
    const banner = corpusBanner({ ...input({ corpusVerifiedAt: hoursAgo(80) }), paying: true });
    if (banner?.primitive !== 'P-C') throw new Error('expected P-C');
    expect(banner.narrowedClaim).toContain('already-pinned project generates normally');
  });

  it('offers the export past 14 days, and still does not block a filing', () => {
    const banner = corpusBanner({ ...input({ corpusVerifiedAt: hoursAgo(24 * 15) }), paying: true });
    if (banner?.primitive !== 'P-C') throw new Error('expected P-C');
    expect(banner.narrowedClaim).toContain('one click away');
    expect(blocksFilingOnPinnedProject()).toBe(false);
  });

  /**
   * A3 — no escalation path anywhere in the compliance flow. There is no field on
   * a `Refusal` in which a support address could travel, and there is no such
   * string in what this module renders either.
   */
  it('never routes to a person', () => {
    const banners = [
      corpusBanner({ ...input({ corpusVerifiedAt: hoursAgo(36) }), paying: true }),
      corpusBanner({ ...input({ corpusVerifiedAt: hoursAgo(80) }), paying: true }),
      corpusBanner({ ...input({ quarantineOpen: true }), paying: true }),
      corpusBanner({ ...input({ xsdMismatch: true }), paying: false }),
      corpusBanner({ ...input({ canaryRed: true }), paying: false }),
    ];
    const forbidden = [
      'contact',
      'support',
      'email us',
      'get in touch',
      'reach out',
      'ticket',
      '@',
      'we will get back',
      'escalate',
    ];
    for (const banner of banners) {
      if (!banner) continue;
      const text = JSON.stringify(banner).toLowerCase();
      for (const phrase of forbidden) {
        expect(text, `${banner.headline}: contains ${phrase}`).not.toContain(phrase);
      }
    }
  });
});
