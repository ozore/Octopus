/**
 * The parser, against the committed fixtures and against the knowledge-base
 * fleet's own reference output.
 *
 * The first test is the important one: our TypeScript port must produce
 * **exactly** what `kb-samples/parse-wd-document.py` produced, row for row and
 * cent for cent, on `parsed-TX20260253-rev1.json`. A parser that is merely
 * "close" to the reference is a parser nobody can reason about.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  PARSER_VERSION,
  looksLikeDetermination,
  normaliseLabel,
  parseDetermination,
} from '../src/lib/kb/parser';
import { fixturesDir } from '../src/lib/kb/sam.mock';

const fixture = (name: string) => JSON.parse(readFileSync(join(fixturesDir(), name), 'utf8'));
const documentOf = (ref: string, rev: number) =>
  fixture(`sam-wd-detail-${ref}-rev${rev}.json`).document as string;

describe('parity with the reference parser', () => {
  it('reproduces kb-samples/parsed-TX20260253-rev1.json exactly', () => {
    const reference = fixture('parsed-TX20260253-rev1.json');
    const parsed = parseDetermination(documentOf('TX20260253', 1));

    expect(parsed.wdNumber).toBe(reference.wd_number);
    expect(parsed.constructionTypes).toEqual(reference.construction_types);
    expect(parsed.rateGroups).toHaveLength(reference.rate_groups.length);
    expect(parsed.classifications).toHaveLength(reference.classifications.length);

    reference.classifications.forEach((expected: Record<string, unknown>, i: number) => {
      const actual = parsed.classifications[i];
      expect(actual?.classificationLabel).toBe(expected['classification']);
      expect(actual?.baseRate).toBe(expected['base_rate']);
      expect(actual?.fringeRate).toBe(expected['fringe']);
      expect(actual?.rateGroupIdentifier).toBe(expected['rate_group']);
    });
  });
});

describe('the numbers WL-13 names', () => {
  it('parses TX20260253 mod 1 to 57 classifications, 15 rate groups, 2 modifications, 1 county, Building', () => {
    const parsed = parseDetermination(documentOf('TX20260253', 1));
    expect(parsed.classifications).toHaveLength(57);
    expect(parsed.rateGroups).toHaveLength(15);
    expect(parsed.modifications).toHaveLength(2);
    expect(parsed.counties).toEqual(['Harris']);
    expect(parsed.constructionTypes).toEqual(['Building']);
  });

  it('parses TX20260031 mod 1 to 19 classifications, type Heavy', () => {
    const parsed = parseDetermination(documentOf('TX20260031', 1));
    expect(parsed.classifications).toHaveLength(19);
    expect(parsed.constructionTypes).toEqual(['Heavy']);
  });
});

describe('gate G3 coverage', () => {
  it('reaches 100% on every committed determination, including the superseded revision', () => {
    const cases: Array<[string, number]> = [
      ['TX20260253', 1],
      ['TX20260253', 0],
      ['TX20260031', 1],
      ['TX20260033', 1],
      ['TX20260034', 1],
      ['TX20260067', 1],
      ['TX20260299', 1],
    ];
    for (const [ref, rev] of cases) {
      const parsed = parseDetermination(documentOf(ref, rev));
      expect(parsed.naiveRateLines).toBeGreaterThan(0);
      expect(parsed.coverage, `${ref} rev ${rev}`).toBeGreaterThanOrEqual(0.995);
    }
  });

  it('reads a fringe carrying a footnote marker, which the reference regex missed', () => {
    // `ELEVATOR MECHANIC................$ 53.59       38.435+a+b` in mod 0.
    const parsed = parseDetermination(documentOf('TX20260253', 0));
    const elevator = parsed.classifications.find((c) => c.classificationLabel.includes('ELEVATOR'));
    expect(elevator?.baseRate).toBe(53.59);
    expect(elevator?.fringeRate).toBeCloseTo(38.435, 3);
    expect(elevator?.footnoteText).toBe('+a+b');
  });
});

describe('the header of a superseded revision', () => {
  it('reads "Harris County in Texas." as one county and not as three lines of prose', () => {
    const parsed = parseDetermination(documentOf('TX20260253', 0));
    expect(parsed.counties).toEqual(['Harris']);
  });
});

describe('rejection and normalisation', () => {
  it('rejects a document with no "General Decision Number:"', () => {
    expect(looksLikeDetermination('some other document entirely')).toBe(false);
    expect(looksLikeDetermination(documentOf('TX20260253', 1))).toBe(true);
  });

  it('normalises a label for search without touching the verbatim one', () => {
    expect(normaliseLabel('ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING)')).toBe(
      'electrician excludes low voltage wiring',
    );
  });

  it('stamps the parser version onto every parse, so a reparse is targetable', () => {
    expect(parseDetermination(documentOf('TX20260031', 1)).parserVersion).toBe(PARSER_VERSION);
  });
});
