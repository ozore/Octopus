/**
 * OBLIGATION VALUES, READ FROM THE CORPUS RATHER THAN WRITTEN INTO CODE.
 *
 * AUTHORITY: `ENGINE.md` §7.0 ("The $100,000 is a corpus value, not a constant"),
 * §9.2.1 (the 29 CFR 3.5 paragraph letters are generated against the
 * `obligation_changelog` row and a CI test asserts they match, so a future paragraph
 * (k) fails the build instead of silently blocking lines), `src/engine/arithmetic/
 * rates.ts` (why the threshold and the penalty are arguments).
 *
 * ===========================================================================
 * WHY THE LETTERS COME FROM THE DATABASE AND THE TEXT DOES NOT
 *
 * `regulatory_constant` holds the two dollar figures with their effective dates and
 * source URLs, and holds the 29 CFR 3.5 paragraph LETTERS as a comma-separated
 * value with the same provenance. It does not hold the paragraph TEXT: the Monday
 * eCFR ingest records section version dates, not section bodies.
 *
 * So the letters are authoritative and the text is a transcription — and the two are
 * reconciled here rather than trusted. `assertParagraphsMatch` compares the letters
 * the corpus row carries against the letters this module transcribed, and throws
 * when they differ. That is ENGINE §9.2.1's check placed at the read: a paragraph
 * (k) appearing in the corpus stops the free generator with an internal error a
 * deploy fixes, rather than quietly blocking every line that would have fallen
 * under it. An `Error`, not a `Refusal`, because a customer can neither see it nor
 * act on it (`src/lib/result.ts`).
 *
 * Only (i) and (j) carry substantive text here, and that is deliberate: those are
 * the two condition-bearing paragraphs the exception report quotes as a P-D. The
 * other eight are named, not quoted, because the report never quotes what it does
 * not need to.
 */

import { sql } from 'drizzle-orm';

import { rowsOf, type Db } from '@/db';
import type { DeductionParagraph, ObligationValues } from '@/engine';
import { Cents } from '@/lib/money';
import { isoDate, type IsoDate } from '@/lib/types';

/**
 * The paragraph bodies, transcribed from 29 CFR 3.5 [88 FR 57730, Aug. 23, 2023].
 * (i) and (j) are verbatim; the rest are named by subject, because the exception
 * report quotes only the paragraphs whose conditions it declines to evaluate.
 */
const PARAGRAPH_TEXT: Readonly<Record<string, string>> = {
  a: 'Federal, State or local tax required by law to be withheld.',
  b: 'Repayment of a bona fide prepayment of wages, made without discount or interest.',
  c: 'Amounts required by court process to be paid to another, not in favour of the contractor.',
  d: 'Contributions to a fund for medical or hospital care, pensions, or life insurance, meeting the conditions of paragraph (d).',
  e: 'Repayment of a loan from, or purchase of shares in, a credit union.',
  f: 'Voluntary contributions to governmental or quasi-governmental agencies.',
  g: 'Voluntary contributions to organisations described in 26 U.S.C. 501(c)(3).',
  h: 'Regular initiation fees and membership dues, under a collective bargaining agreement.',
  i:
    'Any deduction not more than for the "reasonable cost" of board, lodging, or other facilities ' +
    'meeting the requirements of section 3(m) of the Fair Labor Standards Act of 1938, as amended, ' +
    'and 29 CFR part 531. When such a deduction is made the additional records required under ' +
    '29 CFR 516.25(a) must be kept.',
  j:
    'Any deduction for the cost of safety equipment of nominal value purchased by the laborer or ' +
    'mechanic as their own property for their personal protection in their work, such as safety ' +
    'shoes, safety glasses, safety gloves, and hard hats, if such equipment is not required by law ' +
    'to be furnished by the contractor, if such deduction does not violate the Fair Labor Standards ' +
    'Act or any other law, and if the cost on which the deduction is based does not exceed the ' +
    'actual cost to the contractor.',
};

interface ConstantRow {
  key: string;
  effective_from: string | Date;
  value_cents: number | string | null;
  value_text: string | null;
  source_url: string;
}

export async function loadObligations(db: Db): Promise<ObligationValues> {
  const rows = rowsOf<ConstantRow>(
    await db.execute(sql`
      SELECT DISTINCT ON (key) key, effective_from, value_cents, value_text, source_url
      FROM regulatory_constant
      ORDER BY key, effective_from DESC
    `),
  );
  const byKey = new Map(rows.map((row) => [row.key, row]));

  const threshold = require_(byKey, 'cwhssa_threshold_cents');
  const damages = require_(byKey, 'liquidated_damages_cents');
  const paragraphs = require_(byKey, 'cfr_3_5_paragraphs');

  const letters = String(paragraphs.value_text ?? '')
    .split(',')
    .map((letter) => letter.trim())
    .filter((letter) => letter !== '');
  assertParagraphsMatch(letters);

  return {
    cwhssaContractThreshold: {
      value: Cents.of(Number(threshold.value_cents ?? 0)),
      effectiveDate: toIso(threshold.effective_from),
      citation: '29 CFR 5.5(b)',
      sourceUrl: threshold.source_url,
    },
    liquidatedDamagesPerDay: {
      value: Cents.of(Number(damages.value_cents ?? 0)),
      effectiveDate: toIso(damages.effective_from),
      citation: '29 CFR 5.5(b)(2)',
      sourceUrl: damages.source_url,
    },
    deductionParagraphs: {
      value: letters.map(
        (letter): DeductionParagraph => ({ letter, text: PARAGRAPH_TEXT[letter] ?? '' }),
      ),
      effectiveDate: toIso(paragraphs.effective_from),
      citation: '29 CFR 3.5',
      sourceUrl: paragraphs.source_url,
    },
  };
}

/** ENGINE §9.2.1, at the read. A paragraph the corpus knows and this module does not
 *  is a deploy, not a blocked line. */
export function assertParagraphsMatch(letters: readonly string[]): void {
  const transcribed = Object.keys(PARAGRAPH_TEXT).sort();
  const corpus = [...letters].sort();
  if (transcribed.join(',') !== corpus.join(',')) {
    throw new Error(
      `29 CFR 3.5 paragraph mismatch: the corpus records [${corpus.join(',')}] and this build ` +
        `transcribes [${transcribed.join(',')}]. An enum short of the regulation sends lawful ` +
        'deductions to UNMAPPED and tells a compliant contractor a lawful deduction is unlawful.',
    );
  }
}

function require_(rows: Map<string, ConstantRow>, key: string): ConstantRow {
  const row = rows.get(key);
  if (!row) {
    throw new Error(
      `regulatory_constant is missing "${key}". The engine holds no dollar threshold of its own ` +
        '(ENGINE §7.0), so a filing cannot name the threshold it is citing.',
    );
  }
  return row;
}

function toIso(value: string | Date): IsoDate {
  return isoDate(
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10),
  );
}
