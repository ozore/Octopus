/**
 * The gates that run in CI and fail the BUILD, not the run (KNOWLEDGE_BASE §7).
 *
 * **G7 — no column anywhere can hold a full identifying number or a home
 * address.** Asserted by walking the generated migration SQL, which is what
 * production actually applies, rather than the TypeScript schema, which is what
 * we meant to write.
 *
 * **G8 — the component that renders a rate renders its provenance.** Asserted
 * by rendering the real components and reading the DOM: every currency-shaped
 * string must have an ancestor carrying `data-wd-number` and
 * `data-modification`. A rate that escapes the component fails the build.
 *
 * Each gate is its OWN named test. A green aggregate is not evidence that a
 * specific gate ran.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ClassificationTable } from '../src/components/determination';
import { ProvenanceCard, ProvenanceLine, Rate } from '../src/components/provenance';
import { appMigrationsDir } from '../src/lib/db';
import type { ClassificationRow } from '../src/lib/kb';

const migrationSql = readFileSync(join(appMigrationsDir(), '0000_wagelens_init.sql'), 'utf8');

const provenance = {
  wdNumber: 'TX20260253',
  modificationNumber: 1,
  publicationDate: '2026-05-18',
  lastVerified: new Date('2026-09-03T00:00:00Z'),
  publicUrl: 'https://sam.gov/wage-determination/TX20260253/1',
};

const row = (over: Partial<ClassificationRow> = {}): ClassificationRow => ({
  id: 'cls_1',
  lineNo: 26,
  classificationLabel: 'ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING)',
  qualifier: null,
  footnoteText: null,
  tradeFamily: 'electrician',
  baseRate: '38.50',
  fringeRate: '10.71',
  rateGroupIdentifier: 'ELEC0716-005',
  rateGroupKind: 'union',
  rateGroupEffectiveDate: '2025-09-01',
  wdNumber: 'TX20260253',
  modificationNumber: 1,
  publicationDate: '2026-05-18',
  sourceUrl: 'https://sam.gov/api/prod/wdol/v1/wd/TX20260253/1',
  lastVerified: new Date('2026-09-03T00:00:00Z'),
  ...over,
});

describe('gate G7 — the schema cannot hold what the regulation forbids', () => {
  it('has no ssn, no home address and no date of birth column anywhere', () => {
    const forbidden = [
      /\bssn\b/i,
      /social_security/i,
      /"address_line/i,
      /"home_address"/i,
      /"street"/i,
      /date_of_birth/i,
      /\bdob\b/i,
    ];
    for (const pattern of forbidden) {
      expect(migrationSql, `${pattern} must not appear in the schema`).not.toMatch(pattern);
    }
  });

  it('stores a worker’s identifying number as char(4) — the length IS the guarantee', () => {
    expect(migrationSql).toMatch(/"identifying_no_last4" char\(4\) NOT NULL/);
    // The payroll line freezes the same four digits and no more.
    const occurrences = migrationSql.match(/"identifying_no_last4" char\(4\)/g) ?? [];
    expect(occurrences.length).toBeGreaterThanOrEqual(2);
  });

  it('has no column in any kb_* table that could reference a natural person', () => {
    const kbBlocks = migrationSql
      .split('CREATE TABLE ')
      .filter((block) => block.startsWith('"kb_'));
    expect(kbBlocks.length).toBe(7);
    for (const block of kbBlocks) {
      expect(block).not.toMatch(/email|first_name|last_name|worker|user_id/i);
    }
  });

  it('carries gate G4 as a CHECK constraint, not only as an assertion', () => {
    expect(migrationSql).toMatch(/kb_classifications_base_rate_positive.*base_rate.*> 0/s);
    expect(migrationSql).toMatch(/kb_classifications_fringe_non_negative.*fringe_rate.*>= 0/s);
  });

  it('makes (wd_number, modification_number) unique — gate G2’s half of append-only', () => {
    expect(migrationSql).toMatch(
      /CREATE UNIQUE INDEX "kb_wd_number_mod_idx" ON "kb_wage_determinations" .*"wd_number".*"modification_number"/,
    );
  });

  it('makes one alert per project per modification impossible to duplicate', () => {
    expect(migrationSql).toMatch(
      /CREATE UNIQUE INDEX "wd_change_alerts_identity_idx" ON "wd_change_alerts" .*"project_id".*"wd_number".*"to_modification"/,
    );
  });
});

describe('gate G8 — no rate renders without its source', () => {
  const CURRENCY = /\$\d[\d,]*\.\d{2}/g;

  /** Every currency-shaped string must sit inside an element carrying the
   *  provenance attributes. Checked by walking the markup rather than by
   *  trusting the component, because the component is what is under test. */
  function everyRateCarriesProvenance(html: string): boolean {
    const segments = html.split(/(?=<)/);
    let depthWithProvenance = 0;
    let open = 0;
    for (const segment of segments) {
      const isClosing = segment.startsWith('</');
      const isSelfClosing = /\/>$/.test(segment);
      const hasProvenance =
        /data-wd-number="/.test(segment) && /data-modification="/.test(segment);
      if (!isClosing && segment.startsWith('<') && !isSelfClosing) {
        open += 1;
        if (hasProvenance) depthWithProvenance = depthWithProvenance || open;
      }
      const text = segment.replace(/^<[^>]*>/, '');
      if (CURRENCY.test(text)) {
        CURRENCY.lastIndex = 0;
        if (depthWithProvenance === 0) return false;
      }
      if (isClosing) {
        if (depthWithProvenance === open) depthWithProvenance = 0;
        open -= 1;
      }
    }
    return true;
  }

  it('<Rate> stamps the determination, the modification and the date onto the figure', () => {
    const html = renderToStaticMarkup(<Rate base="38.50" fringe="10.71" provenance={provenance} />);
    expect(html).toContain('data-wd-number="TX20260253"');
    expect(html).toContain('data-modification="1"');
    expect(html).toContain('data-published="2026-05-18"');
    expect(html).toContain('$38.50');
    expect(everyRateCarriesProvenance(html)).toBe(true);
  });

  it('<Rate> FAILS CLOSED: with no provenance it renders no number at all', () => {
    const html = renderToStaticMarkup(<Rate base="38.50" provenance={null} />);
    expect(html).not.toMatch(/\$\d/);
    expect(html).toContain('source unavailable');
  });

  it('<ProvenanceLine> reads as KNOWLEDGE_BASE §9.1 and links to SAM.gov', () => {
    const html = renderToStaticMarkup(<ProvenanceLine provenance={provenance} />);
    expect(html).toContain('Rate from wage determination');
    expect(html).toContain('TX20260253');
    expect(html).toContain('modification');
    expect(html).toContain('View the official determination on SAM.gov');
    expect(html).toContain('https://sam.gov/wage-determination/TX20260253/1');
    expect(html).toContain('verified');
  });

  it('<ProvenanceCard> carries the permanent superseded line and never calls it current', () => {
    const html = renderToStaticMarkup(
      <ProvenanceCard
        provenance={{
          ...provenance,
          modificationNumber: 0,
          newerModification: { modificationNumber: 1, publicationDate: '2026-05-18' },
        }}
        scope="Harris County, TX · Building construction"
        base="38.50"
        fringe="10.71"
      />,
    );
    expect(html).toContain('a newer modification (1) was published on 18 May 2026');
    expect(html).toContain('Your contract governs');
    expect(html).toContain('data-modification="0"');
    expect(everyRateCarriesProvenance(html)).toBe(true);
  });

  it('<ProvenanceCard> shows the corpus age in amber past gate G6', () => {
    const html = renderToStaticMarkup(
      <ProvenanceCard provenance={{ ...provenance, stale: true }} base="38.50" />,
    );
    expect(html).toContain('more than 35 days ago');
  });

  it('every figure in the classification table has provenance on it', () => {
    const html = renderToStaticMarkup(
      <ClassificationTable
        rows={[row(), row({ id: 'cls_2', baseRate: '30.20', fringeRate: '12.38' })]}
        total={2}
        provenance={provenance}
      />,
    );
    const figures = html.match(CURRENCY) ?? [];
    // rate + fringe + total, twice.
    expect(figures.length).toBe(6);
    expect(everyRateCarriesProvenance(html)).toBe(true);
  });

  it('catches a rate rendered OUTSIDE the component — the failure the gate exists for', () => {
    const escaped = '<td><span>$38.50</span></td>';
    expect(everyRateCarriesProvenance(escaped)).toBe(false);
  });
});
