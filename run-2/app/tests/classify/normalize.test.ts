/**
 * STAGE 0's PURE FUNCTION.
 *
 * `normalizeTitle` is three things at once — the crosswalk KEY, the L-C1 exact-match
 * comparand and the substring universe for `rationale_span` — so its properties are
 * asserted rather than assumed. A change to it silently re-keys every account's
 * memory, which is the one part of this product that is supposed to be permanent.
 */

import { describe, expect, it } from 'vitest';

import { ABBREVIATIONS, normalizeTitle, spanQuotesTitle, tokensOf } from '@/classify';

describe('normalizeTitle — the fixed abbreviation table', () => {
  it('expands the five ENGINE §15.1 names by name', () => {
    expect(normalizeTitle('oper')).toBe('OPERATOR');
    expect(normalizeTitle('lab')).toBe('LABORER');
    expect(normalizeTitle('carp')).toBe('CARPENTER');
    expect(normalizeTitle('jrny')).toBe('JOURNEYMAN');
    expect(normalizeTitle('appr')).toBe('APPRENTICE');
  });

  it('expands per token, not per substring', () => {
    // `LAB` inside `LABORER` must not expand again; only whole tokens are keys.
    expect(normalizeTitle('LABORER')).toBe('LABORER');
    expect(normalizeTitle('LAB FOREMAN')).toBe('LABORER FOREMAN');
  });

  it('is short -> long for every entry, and never the reverse', () => {
    for (const [abbreviation, expansion] of Object.entries(ABBREVIATIONS)) {
      expect(expansion.length).toBeGreaterThanOrEqual(abbreviation.length);
      expect(ABBREVIATIONS[expansion]).toBeUndefined();
    }
  });
});

describe('normalizeTitle — folding', () => {
  it('uppercases, collapses whitespace and drops punctuation that is not a slash', () => {
    expect(normalizeTitle('  Cement   Mason - finisher.  ')).toBe('CEMENT MASON FINISHER');
  });

  it('turns a hyphen into a boundary rather than deleting it', () => {
    // The failure this prevents: `CEM MASON-FINISH` -> `CEM MASONFINISH`.
    expect(normalizeTitle('CEM MASON-FINISH')).toBe('CEMENT MASON FINISHER');
  });

  it('keeps the slash, because the determination uses it to join two trades', () => {
    expect(normalizeTitle('Cement Mason/Concrete Finisher')).toBe(
      'CEMENT MASON/CONCRETE FINISHER',
    );
    expect(normalizeTitle('operator: backhoe/excavator/trackhoe')).toBe(
      'OPERATOR BACKHOE/EXCAVATOR/TRACKHOE',
    );
  });

  it('treats the slash as a token boundary for scoring', () => {
    expect([...tokensOf(normalizeTitle('BACKHOE/EXCAVATOR'))]).toEqual(['BACKHOE', 'EXCAVATOR']);
  });

  it('folds accents and curly punctuation a payroll export emits', () => {
    expect(normalizeTitle('Peón — Común')).toBe('PEON COMUN');
  });

  it('is idempotent: normalizing a key again returns the key', () => {
    for (const raw of [
      'CEM MASON - FINISH',
      'oper backhoe',
      'Foreman - J. Alvarez Crew 12',
      'LABORER:  COMMON OR GENERAL',
    ]) {
      const once = normalizeTitle(raw);
      expect(normalizeTitle(once)).toBe(once);
    }
  });

  it('returns the empty key for input that normalizes away', () => {
    expect(normalizeTitle('   ')).toBe('');
    expect(normalizeTitle('12 34 #56')).toBe('');
  });
});

describe('normalizeTitle — the privacy rule (CORPUS_DESIGN §7.4)', () => {
  it('drops any token carrying a digit, because title_norm is the cross-tenant key', () => {
    expect(normalizeTitle('FOREMAN CREW 12')).toBe('FOREMAN CREW');
    expect(normalizeTitle('LABORER JOB 4160')).toBe('LABORER JOB');
  });

  it('drops a personal-name-shaped token pair', () => {
    expect(normalizeTitle('Foreman - J. Alvarez Crew')).toBe('FOREMAN CREW');
  });

  it('keeps an occupational token that follows an initial', () => {
    // An initial before a trade word is not a surname; dropping ELECTRICIAN here
    // would silently re-key a real trade.
    expect(normalizeTitle('E ELECTRICIAN')).toBe('ELECTRICIAN');
  });

  it('collapses the digit-only distinction, which is the named edge H-CW1', () => {
    // Recorded, not hidden: two operator groups differing only by number key the
    // same, so one remembered answer covers both.
    expect(normalizeTitle('OPERATOR GROUP 1')).toBe(normalizeTitle('OPERATOR GROUP 3'));
  });
});

describe('spanQuotesTitle — ENGINE §15.5 gate 4', () => {
  const title = normalizeTitle('conc pump op');

  it('accepts a span that quotes the normalized title', () => {
    expect(title).toBe('CONCRETE PUMP OPERATOR');
    expect(spanQuotesTitle('CONCRETE PUMP', title)).toBe(true);
    expect(spanQuotesTitle('pump operator', title)).toBe(true);
  });

  it('normalizes both sides, so punctuation drift still passes', () => {
    expect(spanQuotesTitle('conc. pump', title)).toBe(true);
  });

  it('rejects an invented phrase and an empty span', () => {
    expect(spanQuotesTitle('CEMENT MASON', title)).toBe(false);
    expect(spanQuotesTitle('', title)).toBe(false);
    expect(spanQuotesTitle('   ', title)).toBe(false);
  });
});
