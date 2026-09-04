/**
 * WL-08's diff, as arithmetic.
 *
 * The five cases the spec's test plan names — a rate change, a fringe change, a
 * removal, an addition, and a whitespace-only label edit that must NOT read as
 * a removal — plus the two committed determination fixtures, where mod 0 and
 * mod 1 of TX20260253 print the same classifications in different letter case.
 * That last one is the case that matters most: a cosmetic edit read as a
 * removal would tell a contractor that the classification their crew is mapped
 * to has disappeared, which is the most alarming thing this product can say.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  acceptanceIsBlocked,
  diffDetermination,
  diffWarrantsEmail,
  diffWholeDetermination,
  normaliseForMatch,
  type DiffClassification,
  type MappedWorker,
} from '../src/lib/domain/wd-diff';
import { parseDetermination } from '../src/lib/kb/parser';

const row = (
  label: string,
  base: string,
  fringe: string,
  searchLabel?: string,
): DiffClassification => ({
  classificationLabel: label,
  searchLabel: searchLabel ?? normaliseForMatch(label),
  baseRate: base,
  fringeRate: fringe,
});

const worker = (label: string, name: string, id: string): MappedWorker => ({
  classificationLabel: label,
  workerName: name,
  workerId: id,
});

describe('the diff is scoped to what the project actually uses (V2)', () => {
  it('reports a base-rate change with both rates, the delta and the workers', () => {
    const diff = diffDetermination({
      fromRows: [row('ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING)', '38.50', '10.71')],
      toRows: [row('ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING)', '39.75', '10.71')],
      mapped: [worker('ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING)', 'Ada Rivera', 'w1')],
    });

    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0]).toMatchObject({
      oldRate: '38.50',
      newRate: '39.75',
      oldFringe: '10.71',
      newFringe: '10.71',
      delta: '+1.25',
      workers: ['Ada Rivera'],
    });
    expect(diff.affectedWorkerCount).toBe(1);
    expect(diff.mappedWorkerCount).toBe(1);
    expect(diffWarrantsEmail(diff)).toBe(true);
  });

  it('reports a fringe-only change, and signs a decrease', () => {
    const diff = diffDetermination({
      fromRows: [row('GLAZIER', '23.27', '7.12')],
      toRows: [row('GLAZIER', '23.27', '6.62')],
      mapped: [worker('GLAZIER', 'Ben Ortiz', 'w2')],
    });
    expect(diff.changed[0]?.delta).toBe('−0.50');
  });

  it('reports a REMOVAL when the project uses a classification the new modification does not list', () => {
    const diff = diffDetermination({
      fromRows: [row('TILE FINISHER', '20.00', '5.00')],
      toRows: [row('BOILERMAKER', '33.17', '24.92')],
      mapped: [
        worker('TILE FINISHER', 'Cara Lin', 'w3'),
        worker('TILE FINISHER', 'Dan Poole', 'w4'),
      ],
    });
    expect(diff.removed).toEqual([{ label: 'TILE FINISHER', workers: ['Cara Lin', 'Dan Poole'] }]);
    expect(diff.affectedWorkerCount).toBe(2);
    // V5 — a removal blocks acceptance until those workers are re-mapped.
    expect(acceptanceIsBlocked(diff)).toBe(true);
  });

  it('lists an ADDITION as informational, and an addition alone sends no email (V2)', () => {
    const diff = diffDetermination({
      fromRows: [row('BOILERMAKER', '33.17', '24.92')],
      toRows: [
        row('BOILERMAKER', '33.17', '24.92'),
        row('SIGN ERECTOR', '25.00', '6.00'),
      ],
      mapped: [worker('BOILERMAKER', 'Eve Marsh', 'w5')],
    });
    expect(diff.added).toEqual([{ label: 'SIGN ERECTOR', rate: '25.00', fringe: '6.00' }]);
    expect(diff.changed).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diffWarrantsEmail(diff)).toBe(false);
  });

  it('a WHITESPACE-ONLY or punctuation-only label edit is not a removal', () => {
    const diff = diffDetermination({
      fromRows: [row('POWER EQUIPMENT OPERATOR Cranes', '30.20', '12.38')],
      toRows: [row('POWER EQUIPMENT OPERATOR  (CRANES)', '30.20', '12.38')],
      mapped: [worker('POWER EQUIPMENT OPERATOR Cranes', 'Fay Nunez', 'w6')],
    });
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
    expect(diffWarrantsEmail(diff)).toBe(false);
  });

  it('matches on the verbatim label when the normalised one has genuinely moved', () => {
    const diff = diffDetermination({
      fromRows: [row('IRONWORKER, STRUCTURAL', '28.00', '9.00', 'ironworker structural')],
      toRows: [row('IRONWORKER, STRUCTURAL', '29.00', '9.00', 'a different search label')],
      mapped: [worker('IRONWORKER, STRUCTURAL', 'Gus Hall', 'w7')],
    });
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed[0]?.newRate).toBe('29.00');
  });

  it('counts a worker once even when they are mapped twice to the same label', () => {
    const diff = diffDetermination({
      fromRows: [row('GLAZIER', '23.27', '7.12')],
      toRows: [row('GLAZIER', '24.00', '7.12')],
      mapped: [worker('GLAZIER', 'Ivy Rao', 'w8'), worker('GLAZIER', 'Ivy Rao', 'w8')],
    });
    expect(diff.affectedWorkerCount).toBe(1);
    expect(diff.changed[0]?.workers).toEqual(['Ivy Rao']);
  });
});

describe('against the two committed determination fixtures', () => {
  const parse = (rev: number): DiffClassification[] => {
    const path = join(
      import.meta.dirname ?? new URL('.', import.meta.url).pathname,
      'fixtures',
      `sam-wd-detail-TX20260253-rev${rev}.json`,
    );
    const payload = JSON.parse(readFileSync(path, 'utf8')) as {
      document?: string;
      data?: { document?: string };
    };
    const parsed = parseDetermination(payload.document ?? payload.data?.document ?? '');
    return parsed.classifications.map((entry) =>
      row(entry.classificationLabel, String(entry.baseRate), String(entry.fringeRate)),
    );
  };

  it('mod 0 → mod 1 of TX20260253 renames nothing, even though the CASE of every label changed', () => {
    const before = parse(0);
    const after = parse(1);
    // SAM prints mod 0 in mixed case and mod 1 in upper case. If matching were
    // on the verbatim label, EVERY classification in the document would read as
    // removed — 54 false alarms in one email.
    expect(before.length).toBeGreaterThan(50);
    const diff = diffWholeDetermination(before, after);

    // Exactly one label genuinely moved: mod 1 folds the elevator footnote
    // block into the classification's own label, so `ELEVATOR MECHANIC` and
    // `ELEVATOR MECHANIC: FOOTNOTES: A. 6% UNDER 5 YEARS…` do not normalise to
    // the same thing. That is real ambiguity and it resolves to `removed`,
    // which is the direction that asks a human rather than assuming.
    expect(diff.removed.map((entry) => entry.label)).toEqual(['ELEVATOR MECHANIC']);
    expect(diff.changed).toEqual([]);
  });

  it('scoped to a crew, only the classifications that crew uses can be reported', () => {
    const before = parse(0);
    const after = parse(1);
    const glazier = before.find((entry) => entry.classificationLabel === 'GLAZIER');
    expect(glazier).toBeDefined();

    const diff = diffDetermination({
      fromRows: before,
      toRows: after,
      mapped: [worker('GLAZIER', 'Ada Rivera', 'w1')],
    });
    // The elevator label moved, but nobody on this project is an elevator
    // mechanic — so this project hears nothing and gets no email (V2).
    expect(diff.removed).toEqual([]);
    expect(diff.changed).toEqual([]);
    expect(diffWarrantsEmail(diff)).toBe(false);
  });

  it('the UNSCOPED diff (WL-14) carries no worker names at all', () => {
    const diff = diffWholeDetermination(parse(0), parse(1));
    expect(diff.affectedWorkerCount).toBe(0);
    // Mod 1 lists more classifications than mod 0, so the additions are real.
    expect(diff.added.length).toBeGreaterThan(0);
    for (const entry of diff.changed) expect(entry.workers).toEqual([]);
    for (const entry of diff.removed) expect(entry.workers).toEqual([]);
  });
});
