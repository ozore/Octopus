/**
 * Limit boxes are not always numbers, and pretending otherwise produces a
 * confident, wrong gap.
 *
 * `specs/03` §4: "`raw` is what the document says; `amount` is what we could
 * safely make of it." Corpus C5 prints `X $100,000 SIR` and the word `Excluded`
 * in limit boxes; E1 prints `STATUTORY`. `specs/05` A7 requires `undetermined`
 * — never `gap`, never `met` — when `amount` is null.
 *
 * This module is the one place that decision is made, so M4's normalisation and
 * M5's SIR check cannot disagree about what `$100,000 SIR` means.
 */

export type MoneyKind =
  | 'amount'
  | 'excluded'
  | 'statutory'
  | 'included'
  | 'sir'
  | 'empty'
  | 'unparseable';

export type ParsedMoney = {
  /** The comparable number, or null when the box is not a plain amount. */
  amount: number | null;
  /** The self-insured-retention figure, when the box printed one. */
  sir: number | null;
  kind: MoneyKind;
};

const NONE: ParsedMoney = { amount: null, sir: null, kind: 'empty' };

function digits(text: string): number | null {
  const cleaned = text.replace(/[$\s,]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseMoney(raw: string | null | undefined): ParsedMoney {
  if (raw == null) return NONE;
  const text = raw.trim();
  if (text === '') return NONE;
  const upper = text.toUpperCase();

  // An SIR or deductible printed inside a limit box. The NUMBER is recoverable
  // for the maxSir condition; the LIMIT is not a number, so `amount` stays null.
  if (/\bSIR\b|SELF[- ]INSURED|\bDEDUCTIBLE\b|\bRETENTION\b/.test(upper)) {
    return { amount: null, sir: digits(upper.replace(/[^0-9$,. ]/g, ' ')) ?? null, kind: 'sir' };
  }
  if (/\bEXCLUDED?\b|\bN\/?A\b|\bNONE\b/.test(upper)) return { amount: null, sir: null, kind: 'excluded' };
  if (/\bSTATUTORY\b|\bSTATUTE\b/.test(upper)) return { amount: null, sir: null, kind: 'statutory' };
  if (/\bINCLUDED?\b/.test(upper)) return { amount: null, sir: null, kind: 'included' };

  const n = digits(text);
  if (n !== null) return { amount: n, sir: null, kind: 'amount' };
  return { amount: null, sir: null, kind: 'unparseable' };
}

/** `$1,000,000` — the only money format the product prints. */
export function formatMoney(amount: number): string {
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}
