/**
 * THE DETERMINATION PARSER, against bytes SAM actually sent.
 *
 * Three things are pinned here and each one is a measured failure the specification
 * either names or does not:
 *
 *  - **the wrapped name** (§4.1): 31.8% of classification rows wrap, and a
 *    line-by-line parser emits `SPREADER AND DISTRIBUTOR` at $18.62 while silently
 *    dropping `LABORER: ASPHALT…`;
 *  - **the comma county** (§6.1): the only red the county-name probe ever produced
 *    fleet-wide was our own splitter cutting `Washington, D.C.` in two;
 *  - **the fringe that is not a dollar amount** and **the 740-character name**,
 *    neither of which is in the specification and both of which are in the corpus.
 */

import { describe, expect, it } from 'vitest';

import {
  canonicalise,
  decodeDeterminationBytes,
  evaluateParseQuarantine,
  identifierKindOf,
  parseCountyScope,
  parseDetermination,
  residueLineCount,
  splitCountyList,
} from '@/corpus';
import { MilliRate } from '@/lib/money';

import { fixtureBytes, fixtureJson } from './fixtures';

function text(name: string): string {
  return canonicalise(fixtureJson<{ document: string }>(`document/${name}.json`).document).text;
}

describe('canonicalisation', () => {
  it('reduces VA20260195 r2 to exactly 12,645 characters, as §2.3 measured', () => {
    const canonical = canonicalise(fixtureJson<{ document: string }>('document/VA20260195-r2.json').document);
    expect(canonical.length).toBe(12_645);
    expect(canonical.sha256).toBe(
      'afd535b9762364ebe4941b870ee975bca9f59b90418e16c12fd7b5fe3aac7cd0',
    );
  });

  /**
   * G-CANON, AND THE ENCODING FINDING.
   *
   * §2.3 proves paths B and C converge under `canon`. What it does not say is that
   * path C's S3 object is **not UTF-8**: it carries raw 0x93/0x94 cp1252 curly
   * quotes in the WHD identifier legend, which path B's JSON transport has already
   * replaced with U+FFFD. Decoded "correctly" as cp1252 the two differ at 16
   * positions and G-canon — a QUARANTINE gate with a recorded red rate of 0/75 —
   * would be red on every determination carrying the legend, which is nearly all of
   * them. Decoded lossily as UTF-8, matching what path B already did, they are
   * byte-identical.
   */
  it('path B and path C converge only when C is decoded lossily as UTF-8', () => {
    const b = canonicalise(fixtureJson<{ document: string }>('document/VA20260195-r2.json').document);
    const archiveBytes = fixtureBytes('archive/va195.txt');

    const c = canonicalise(decodeDeterminationBytes(archiveBytes));
    expect(c.length).toBe(12_645);
    expect(c.sha256).toBe(b.sha256);

    // The same bytes decoded as cp1252 — the "correct" encoding — do NOT match.
    const cp1252 = canonicalise(new TextDecoder('windows-1252').decode(archiveBytes));
    expect(cp1252.length).toBe(12_645);
    expect(cp1252.sha256).not.toBe(b.sha256);

    // And the raw bytes really are cp1252: 0x93 is not valid UTF-8.
    expect([...archiveBytes].includes(0x93)).toBe(true);
  });

  it('canon is NOT idempotent, because the determination ends with a quote it owns', () => {
    // `…END OF GENERAL DECISION"` — the trailing quote is part of the document, and
    // a second application of `canon` would eat it. Anything that canonicalises
    // must do so exactly once, from the raw transport value.
    const once = canonicalise(fixtureJson<{ document: string }>('document/VA20260195-r2.json').document);
    const twice = canonicalise(once.text);
    expect(twice.length).toBe(once.length - 1);
  });
});

describe('classifications', () => {
  it('parses VA20260195 r2 with both wrapped names joined and no residue', () => {
    const parse = parseDetermination(text('VA20260195-r2'));
    expect(parse.ok).toBe(true);
    if (!parse.ok) return;
    const { classifications, residue } = parse.parsed;

    expect(classifications).toHaveLength(33);
    expect(residue).toHaveLength(0);

    const electrician = classifications.find((c) => c.className.startsWith('ELECTRICIAN'));
    expect(electrician).toBeDefined();
    expect(electrician?.rateIdentifier).toBe('ELEC0080-011');
    expect(electrician?.identifierKind).toBe('union');
    // D9 refuses the SCHEDULE, not the aggregate: $14.13 is a WD-sourced obligation.
    expect(electrician?.fringeTreatment).toBe('wd_aggregate_cba_schedule_unpublished');
    expect(electrician?.baseRateMilli).toBe(MilliRate.fromDecimalString('36.85'));
    expect(electrician?.fringeRateMilli).toBe(MilliRate.fromDecimalString('14.13'));

    // THE WRAPPED NAME. A line-by-line parser emits the second half at this rate
    // and drops the first half entirely (U4).
    const laborer = classifications.find((c) => c.className.startsWith('LABORER: ASPHALT'));
    expect(laborer?.className).toBe(
      'LABORER: ASPHALT, INCLUDES RAKER, SHOVELER, SPREADER AND DISTRIBUTOR',
    );
    expect(laborer?.wrapped).toBe(true);
    expect(laborer?.baseRateMilli).toBe(186_200);
    expect(laborer?.fringeRateMilli).toBe(26_200);
    expect(laborer?.sourceLineEnd).toBe(laborer!.sourceLineStart + 1);

    // And the orphan half is NOT present as a classification of its own.
    expect(classifications.some((c) => c.className === 'SPREADER AND DISTRIBUTOR')).toBe(false);
  });

  it('rates are integer MilliRate, never a float', () => {
    const parse = parseDetermination(text('LA20260005-r2'));
    if (!parse.ok) throw new Error('parse failed');
    for (const c of parse.parsed.classifications) {
      expect(Number.isInteger(c.baseRateMilli)).toBe(true);
      expect(Number.isInteger(c.fringeRateMilli)).toBe(true);
    }
  });

  it('joins a four-line wrapped name in LA20260005', () => {
    const parse = parseDetermination(text('LA20260005-r2'));
    if (!parse.ok) throw new Error('parse failed');
    const wrapped = parse.parsed.classifications.filter((c) => c.wrapped);
    expect(wrapped.length).toBeGreaterThanOrEqual(6);
    const electrician = parse.parsed.classifications.find((c) =>
      c.className.includes('LOW VOLTAGE WIRING (JEFFERSON'),
    );
    expect(electrician?.className).toContain('ST. JOHN THE BAPTIST PARISHES)');
  });

  /**
   * FINDING NOT IN THE SPECIFICATION. `VA20260195` r0 prints a fringe as
   * `17.18%+7.80` — a percentage of base plus a dollar figure.
   * `wd_classification.fringe_rate_milli` is an integer MilliRate and has no
   * representation for it, so the row is DETECTED and refused rather than stored
   * with an invented number.
   */
  it('refuses a percentage fringe instead of inventing a number for it', () => {
    const parse = parseDetermination(text('VA20260195-r0'));
    if (!parse.ok) throw new Error('parse failed');
    const { classifications, residue } = parse.parsed;

    const ambiguous = residue.filter((r) => r.reason === 'rate_pattern_ambiguous');
    expect(ambiguous).toHaveLength(1);
    expect(ambiguous[0]?.rawText).toContain('17.18%+7.80');

    // Nothing was stored for it — no fabricated fringe reaches a certified payroll.
    expect(classifications.some((c) => c.className.includes('Traffic'))).toBe(false);
  });

  /**
   * FINDING NOT IN THE SPECIFICATION. §4.1's 200-character bound and §4.4 rule 5
   * are red on the active determination for the entire District of Columbia.
   */
  it('parses DC20260001 r5, whose longest genuine class name is 740 characters', () => {
    const parse = parseDetermination(text('DC20260001-r5'));
    if (!parse.ok) throw new Error('parse failed');
    const { classifications, residue } = parse.parsed;

    expect(classifications).toHaveLength(73);
    expect(residue.filter((r) => r.reason !== 'ambiguous_duplicate_class')).toHaveLength(0);

    const longest = [...classifications].sort((a, b) => b.className.length - a.className.length)[0];
    expect(longest?.className.length).toBe(740);
    expect(longest?.className.startsWith('FIRE STOP TECHNICIAN')).toBe(true);
    // Under the specification's 200-character rule this determination quarantines.
    expect(classifications.filter((c) => c.className.length > 200).length).toBeGreaterThan(1);
  });

  /**
   * FINDING NOT IN THE SPECIFICATION. `wdc_class_unique` is a unique index on
   * `(wd_number, revision, parser_version, class_name_norm, rate_identifier)`, and
   * `DC20260001` r5 violates it with two rows WHD published itself.
   */
  it('withholds two rows that share a name and identifier at different rates', () => {
    const parse = parseDetermination(text('DC20260001-r5'));
    if (!parse.ok) throw new Error('parse failed');

    const laborers = parse.parsed.classifications.filter((c) => c.classNameNorm === 'LABORERS:');
    expect(laborers).toHaveLength(0);

    const withheld = parse.parsed.residue.filter((r) => r.reason === 'ambiguous_duplicate_class');
    expect(withheld).toHaveLength(2);
    expect(withheld.map((r) => r.rawText).join(' ')).toContain('51.82');
    expect(withheld.map((r) => r.rawText).join(' ')).toContain('44.04');

    // The ambiguity does not count toward §4.4's residue ratio: that rule measures
    // text the parser could not READ, and this text was read exactly.
    expect(residueLineCount(parse.parsed.residue)).toBe(0);
    expect(parse.parsed.classifications).toHaveLength(73);
  });

  it('classifies rate identifiers from the determination\'s own legend', () => {
    expect(identifierKindOf('ELEC0080-011')).toBe('union');
    expect(identifierKindOf('SUVA2016-080')).toBe('survey');
    expect(identifierKindOf('UAVG-OH-0010')).toBe('union_average');
    expect(identifierKindOf('SAME2023-007')).toBe('state_adopted');
    expect(identifierKindOf('SCXX0001-001')).toBe('supplemental');
    expect(identifierKindOf('WHAT-IS-THIS')).toBe('unrecognised');
  });
});

describe('§4.4 parser quarantine rules', () => {
  it('passes all three current revisions and quarantines the ambiguous-fringe one', () => {
    for (const name of ['VA20260195-r2', 'LA20260005-r2', 'DC20260001-r5'] as const) {
      const parse = parseDetermination(text(name));
      if (!parse.ok) throw new Error(`${name} parse failed`);
      const verdict = evaluateParseQuarantine({
        classifications: parse.parsed.classifications,
        residue: parse.parsed.residue,
        priorClassCount: null,
        canonicalLength: text(name).length,
        priorCanonicalLength: null,
      });
      expect(verdict.ok, `${name}: ${JSON.stringify(verdict)}`).toBe(true);
    }

    const r0 = parseDetermination(text('VA20260195-r0'));
    if (!r0.ok) throw new Error('parse failed');
    expect(residueLineCount(r0.parsed.residue)).toBe(2);
    const verdict = evaluateParseQuarantine({
      classifications: r0.parsed.classifications,
      residue: r0.parsed.residue,
      priorClassCount: null,
      canonicalLength: 12_229,
      priorCanonicalLength: null,
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.rule).toBe('residue_ratio');
  });

  it('quarantines a class-count swing with no comparable text change', () => {
    const parse = parseDetermination(text('VA20260195-r2'));
    if (!parse.ok) throw new Error('parse failed');
    const verdict = evaluateParseQuarantine({
      classifications: parse.parsed.classifications,
      residue: [],
      priorClassCount: 90,
      canonicalLength: 12_645,
      priorCanonicalLength: 12_640,
    });
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.rule).toBe('class_count_stability');
  });
});

describe('county scope — the prose is authoritative', () => {
  it('keeps the asterisk as a boolean: independent cities are not their counties', () => {
    const scope = parseCountyScope(text('VA20260195-r2'));
    expect(scope.kind).toBe('counties');
    if (scope.kind !== 'counties') return;
    expect(scope.counties).toHaveLength(13);

    const chesapeake = scope.counties.find((c) => c.countyName === 'Chesapeake');
    expect(chesapeake?.independentCity).toBe(true);
    const gloucester = scope.counties.find((c) => c.countyName === 'Gloucester');
    expect(gloucester?.independentCity).toBe(false);
  });

  /** THE REGRESSION FIXTURE. The one red the county-name probe produced across 200
   *  determinations was this string, and it was our own bug. */
  it('DC20260001: `Washington, D.C.` is ONE county, not two', () => {
    const scope = parseCountyScope(text('DC20260001-r5'));
    expect(scope.kind).toBe('counties');
    if (scope.kind !== 'counties') return;
    expect(scope.counties).toHaveLength(1);
    expect(scope.counties[0]?.countyName).toBe('Washington, D.C.');
  });

  it('splitCountyList heals a comma before an abbreviation and nothing else', () => {
    expect(splitCountyList('Washington, D.C.')).toEqual(['Washington, D.C.']);
    expect(splitCountyList('Jefferson, Orleans and St Tammany')).toEqual([
      'Jefferson',
      'Orleans',
      'St Tammany',
    ]);
  });

  it('joins county names that wrap mid-name across physical lines', () => {
    const scope = parseCountyScope(text('LA20260005-r2'));
    expect(scope.kind).toBe('counties');
    if (scope.kind !== 'counties') return;
    // `St \nBernard` and `St John \nthe Baptist` wrap; a per-line split emits `St`.
    expect(scope.counties.map((c) => c.countyName)).toEqual([
      'Jefferson',
      'Orleans',
      'Plaquemines',
      'St Bernard',
      'St Charles',
      'St James',
      'St John the Baptist',
      'St Tammany',
    ]);
  });

  it('reads the older trailing prose grammar on a superseded revision', () => {
    // `Chesapeake*, … and York Counties in Virginia.` — supporting only the current
    // grammar would leave every superseded revision's scope unresolved, and a
    // superseded revision's scope is exactly what an audit reads.
    const scope = parseCountyScope(text('VA20260195-r0'));
    expect(scope.kind).toBe('counties');
    if (scope.kind !== 'counties') return;
    expect(scope.counties).toHaveLength(12);
    expect(scope.counties.map((c) => c.countyName)).toContain('Virginia Beach');
  });

  it('returns `unresolved` rather than guessing when the prose does not parse', () => {
    const scope = parseCountyScope('General Decision Number: XX20260001 01/01/2026\n\nCounties: ???');
    expect(scope.kind).toBe('unresolved');
  });
});
