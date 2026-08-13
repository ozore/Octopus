/**
 * THE ANONYMOUS SURFACE — J1, J2, and the L2 STALE behaviour.
 *
 * Spec: `USER_JOURNEY.md` §1 (the free WH-347 generator), §1.5 (no pin, no
 * signature block, unconditionally), §2 (the county x craft lookup and the dated
 * diff), §4.4 (the contract-value band), `CORPUS_DESIGN.md` §6.4 (the staleness
 * asymmetry: generation fails closed, the lookup keeps rendering),
 * `ARCHITECTURE.md` §3.8 (this path is the tested fallback the paid product
 * degrades to), PLAN §A3 (no escalation path anywhere).
 *
 * OFFLINE AND DETERMINISTIC. The mirror is a real Postgres (PGlite) loaded by the
 * real ingest from RECORDED SAM responses; the clock is injected; there is no
 * network, no model and no Stripe. `vitest.setup.ts` makes `fetch` throw, so a
 * regression that added a live call to this path fails here rather than in
 * production — which matters more on this surface than anywhere else, because
 * "zero model calls on the free path" is both a margin promise and the reason the
 * degraded mode works.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { lookupCountyRates, runIngest, SamClient, type CanaryRunner } from '@/corpus';
import { wdNumber } from '@/lib/types';

import {
  classificationHistory,
  classificationsOf,
  corpusState,
  countiesInState,
  determinationsForCounty,
  revisionDiff,
  revisionsHeld,
  statesWithRates,
} from '../../src/app/(free)/_data/mirror';
import {
  hoursHundredths,
  moneyCents,
  parseCsv,
  rateMilli,
  suggestMapping,
} from '../../src/app/(free)/_lib/csv';
import { generateFreeWh347 } from '../../src/app/(free)/_lib/generate';
import { assertParagraphsMatch, loadObligations } from '../../src/app/(free)/_lib/obligations';
import { slug } from '../../src/app/(free)/_lib/format';
import type { FreeSession } from '../../src/app/(free)/_lib/session';

import { createTestDb, type TestDb } from '../helpers/pglite';
import { fixtureFetcher, healthyRoutes, INDEX_BASE, WDOL_BASE } from '../corpus/fixtures';

const INGEST_AT = new Date('2026-08-13T06:00:00Z');
const greenCanary: CanaryRunner = () => Promise.resolve({ pass: true, lines: 512, detail: 'green' });

let tdb: TestDb;

beforeAll(async () => {
  tdb = await createTestDb();
  const client = new SamClient({
    indexBase: INDEX_BASE,
    wdolBase: WDOL_BASE,
    fetcher: fixtureFetcher(healthyRoutes()),
    now: () => INGEST_AT,
  });
  await runIngest({ db: tdb.db, client, canary: greenCanary, now: () => INGEST_AT });
});

afterAll(async () => {
  await tdb.close();
});

/** The promoted snapshot's own timestamp, so "fresh" and "stale" are expressed
 *  relative to the corpus rather than to the machine running the suite. */
async function promotedAt(): Promise<Date> {
  const corpus = await corpusState(tdb.db, INGEST_AT);
  if (corpus.verifiedAt === null) throw new Error('fixture: nothing was promoted');
  return corpus.verifiedAt;
}

function hours(...values: number[]): number[] {
  const seven = [0, 0, 0, 0, 0, 0, 0];
  values.forEach((value, index) => {
    seven[index] = value;
  });
  return seven;
}

async function sessionFor(input: {
  readonly rawTitle: string;
  readonly chosenOrdinal: number | null;
  readonly band: FreeSession['contractValueBand'];
  readonly stDays?: number[];
}): Promise<FreeSession> {
  return {
    weekEnding: '2026-08-14',
    contractValueBand: input.band,
    wd: { mode: 'number', wdNumber: 'VA20260195' },
    layout: 'wh347_rev_2025_01',
    contractorName: 'Bell Striping',
    contractorAddress: '11 Depot Road, Gloucester VA',
    isSubcontractor: true,
    payrollNumber: '1',
    projectAndLocation: 'Route 17 markings — Gloucester County, VA',
    projectOrContractNumber: 'FA-2026-118',
    isFinalPayroll: false,
    workers: [
      {
        lastName: 'Bell',
        firstName: 'Marcus',
        middleInitial: 'T',
        idLast4: '4417',
        status: 'J',
        lines: [
          {
            rawTitle: input.rawTitle,
            chosenOrdinal: input.chosenOrdinal,
            st: input.stDays ?? hours(0, 800, 800, 800, 800, 800, 0),
            ot: hours(0, 0, 0, 0, 0, 0, 0),
            dt: hours(0, 0, 0, 0, 0, 0, 0),
            cashRateMilli: 350_000,
            cashInLieuMilli: 0,
            otRateMilli: null,
            dtRateMilli: null,
            fringeCreditMilli: 0,
          },
        ],
        allWorkGrossCents: 140_000,
        deductions: [{ rawLabel: 'Federal withholding', category: 'STATUTORY', amountCents: 21_000 }],
        netPaidCents: 119_000,
      },
    ],
  };
}

async function firstClassification(): Promise<{ ordinal: number; className: string }> {
  const rows = await classificationsOf(tdb.db, wdNumber('VA20260195'), 2);
  const row = rows[0];
  if (!row) throw new Error('fixture: VA20260195 rev 2 parsed no classifications');
  return { ordinal: row.ordinal, className: row.className };
}

// ===========================================================================
// J2 — the lookup and the programmatic page set
// ===========================================================================

describe('J2 — the county x craft lookup reads the mirror and nothing else', () => {
  it('enumerates states, counties and the determinations covering them, with provenance', async () => {
    const states = await statesWithRates(tdb.db);
    expect(states.map((state) => state.stateCode)).toContain('VA');

    const counties = await countiesInState(tdb.db, 'VA');
    const gloucester = counties.find((county) => county.countyName === 'Gloucester');
    expect(gloucester?.constructionTypes).toEqual(['Highway']);
    expect(gloucester?.independentCity).toBe(false);

    // An independent city is NOT inside the county it adjoins, and the page has to
    // be able to say so or the wrong rate follows.
    const chesapeake = counties.find((county) => county.countyName === 'Chesapeake');
    expect(chesapeake?.independentCity).toBe(true);

    const determinations = await determinationsForCounty(tdb.db, {
      stateCode: 'VA',
      countyName: 'Gloucester',
    });
    expect(determinations).toHaveLength(1);
    expect(determinations[0]?.wdNumber).toBe('VA20260195');
    expect(determinations[0]?.revision).toBe(2);
    expect(determinations[0]?.publishDate).toBe('2026-08-06');
    expect(determinations[0]?.canonicalSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('projects classifications with the determination’s own text and its line span', async () => {
    const rows = await classificationsOf(tdb.db, wdNumber('VA20260195'), 2);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      // The branded id can only have come from a mirror row: `ClassificationId`'s
      // sole constructor is `classificationIdFromMirrorRow` (I2).
      expect(String(row.id)).toBe(`VA20260195:2:${row.parserVersion}:${row.ordinal}`);
      expect(row.classNameVerbatim.length).toBeGreaterThan(0);
      expect(row.sourceLineEnd).toBeGreaterThanOrEqual(row.sourceLineStart);
      expect(Number.isInteger(Number(row.baseRate))).toBe(true);
    }
  });

  it('slugs a classification into a page address without colliding inside a county', async () => {
    const rows = await lookupCountyRates(tdb.db, {
      stateCode: 'VA',
      countyName: 'Gloucester',
      constructionType: 'Highway',
    });
    const slugs = rows.map((row) => slug(row.className));
    expect(slugs.every((value) => /^[a-z0-9-]+$/.test(value))).toBe(true);
    expect(new Set(slugs).size).toBe(new Set(rows.map((row) => row.classNameNorm)).size);
  });
});

describe('J2 §2.4 — the dated diff, which is the only thing the page claims', () => {
  /**
   * A prior revision, written the way promotion writes one. The recorded fixture
   * set ingests a single revision per determination, and the diff is the page's
   * whole reason to exist, so the test supplies the second point on the series
   * rather than asserting the empty case and calling it covered.
   */
  beforeAll(async () => {
    await tdb.client.query(`
      INSERT INTO wd_revision (wd_number, revision, state_code, wd_year, publish_date, header_date,
                               superseded_on, is_active_upstream, canonical_sha256, canonical_length,
                               blob_b_sha256, mod_table, mod_table_rows, mod_table_first, mod_table_last,
                               agreement, parse_status, parse_version, class_count, construction_types)
      SELECT wd_number, 1, state_code, wd_year, DATE '2026-02-06', DATE '2026-02-06',
             DATE '2026-08-06', false, canonical_sha256, canonical_length, blob_b_sha256,
             '[{"modification":1,"publicationDate":"2026-02-06"}]'::jsonb, 1, 1, 1,
             'agreed', 'parsed', parse_version, class_count, construction_types
      FROM wd_revision WHERE wd_number = 'VA20260195' AND revision = 2
    `);
    // Same classifications, older money: base down 2.00, fringe unchanged.
    await tdb.client.query(`
      INSERT INTO wd_classification (wd_number, revision, ordinal, rate_identifier, identifier_kind,
                                     identifier_date, class_name, class_name_raw, class_name_norm,
                                     base_rate_milli, fringe_rate_milli, fringe_treatment,
                                     source_line_start, source_line_end, source_sha256,
                                     parser_version, wrapped)
      SELECT wd_number, 1, ordinal, rate_identifier, identifier_kind, identifier_date,
             class_name, class_name_raw, class_name_norm,
             base_rate_milli - 20000, fringe_rate_milli, fringe_treatment,
             source_line_start, source_line_end, source_sha256, parser_version, wrapped
      FROM wd_classification WHERE wd_number = 'VA20260195' AND revision = 2
    `);
  });

  it('holds every revision it has seen, newest first', async () => {
    const revisions = await revisionsHeld(tdb.db, wdNumber('VA20260195'));
    expect(revisions.map((revision) => revision.revision)).toEqual([2, 1]);
    expect(revisions[1]?.supersededOn).toBe('2026-08-06');
  });

  it('computes the per-classification diff from the two parsed revisions', async () => {
    const diff = await revisionDiff(tdb.db, wdNumber('VA20260195'), 1, 2);
    expect(diff.length).toBeGreaterThan(0);
    for (const row of diff) {
      expect(row.kind).toBe('rate_changed');
      expect((row.baseToMilli ?? 0) - (row.baseFromMilli ?? 0)).toBe(20_000);
      expect(row.fringeToMilli).toBe(row.fringeFromMilli);
    }
  });

  it('follows one classification across every revision, with the date it moved', async () => {
    const rows = await classificationsOf(tdb.db, wdNumber('VA20260195'), 2);
    const subject = rows[0];
    if (!subject) throw new Error('fixture: no classifications');
    const history = await classificationHistory(tdb.db, wdNumber('VA20260195'), subject.classNameNorm);
    expect(history.map((entry) => entry.revision)).toEqual([1, 2]);
    expect(history[0]?.publishDate).toBe('2026-02-06');
    expect(history[1]?.publishDate).toBe('2026-08-06');
    expect((history[1]?.baseRateMilli ?? 0) - (history[0]?.baseRateMilli ?? 0)).toBe(20_000);
  });
});

// ===========================================================================
// J1 — the free generator
// ===========================================================================

describe('J1 — every free artifact is DRAFT — NOT CERTIFIABLE, unconditionally', () => {
  it('withholds the signature block even when every line resolves and the corpus is FRESH', async () => {
    const { ordinal, className } = await firstClassification();
    const at = await promotedAt();
    const result = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      await sessionFor({ rawTitle: className, chosenOrdinal: ordinal, band: 'over_100k' }),
    );
    if (!result.ok) throw new Error(`expected a generation, got ${result.refusal.primitive}`);

    // FRESH, every line resolved, band answered — and still a draft. §1.5: "No pin,
    // no signature block." The free path creates no pin by construction, so it can
    // never satisfy the CERTIFIABLE condition.
    expect(result.value.corpus.freshness.state).toBe('FRESH');
    expect(result.value.verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
    if (result.value.verdict.status !== 'DRAFT_NOT_CERTIFIABLE') throw new Error('unreachable');
    expect(result.value.verdict.signatureBlockWithheld).toBe(true);
    expect(result.value.verdict.blocks).toContain('NO_PINNED_REVISION');
    expect(result.value.artifact.signatureBlockWithheld).toBe(true);

    // The bytes are a real WH-347: two grid pages at most for one worker, plus the
    // statement page.
    expect(result.value.pageCount).toBeGreaterThanOrEqual(2);
    expect(Buffer.from(result.value.pdf.slice(0, 5)).toString()).toBe('%PDF-');
  });

  it('prints the determination, the revision, the publication date and the missing pin on the paper', async () => {
    const { ordinal, className } = await firstClassification();
    const at = await promotedAt();
    const result = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      await sessionFor({ rawTitle: className, chosenOrdinal: ordinal, band: 'over_100k' }),
    );
    if (!result.ok) throw new Error('expected a generation');

    const footer = result.value.artifact.footer;
    const claim = footer.find((line) => line.id === 'claim')?.text ?? '';
    expect(claim).toContain('VA20260195');
    expect(claim).toContain('revision 2');
    expect(claim).toContain('2026-08-06');

    // MED-10: the honesty is ON THE PAPER, because an anonymous visitor has no
    // in-product banner to read.
    const draft = footer.find((line) => line.id === 'draft')?.text ?? '';
    expect(draft).toContain('DRAFT — NOT CERTIFIABLE');
    expect(draft).toContain('No revision of record was pinned');
    expect(footer.find((line) => line.id === 'draft')?.emphasis).toBe('draft');

    // §7.3: the free footer runs the SAME three-state freshness algebra as the paid
    // artifact, and carries no verification URL because nothing was persisted.
    expect(footer.find((line) => line.id === 'freshness')?.text).toMatch(/No newer revision existed as of /);
    expect(footer.some((line) => line.id === 'url')).toBe(false);

    // The band sentence is the customer's assertion printed back, never a conclusion.
    const band = footer.find((line) => line.id === 'band')?.text ?? '';
    expect(band).toContain('You recorded on');
    expect(band).not.toMatch(/applies to this contract/i);
  });

  it('makes zero model calls: the ladder never reaches L-D', async () => {
    const at = await promotedAt();
    const result = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      await sessionFor({ rawTitle: 'STRIPER OPERATOR III', chosenOrdinal: null, band: 'over_100k' }),
    );
    if (!result.ok) throw new Error('expected a generation');
    for (const resolution of result.value.resolutions) {
      expect(resolution.outcome.modelCalled).toBe(false);
      expect(resolution.outcome.level).not.toBe('L_D');
      expect(resolution.outcome.attribution.modelId).toBeNull();
    }
  });
});

describe('J1 §1.4 — the unmapped title, and what the picker may and may not do', () => {
  it('blocks the row and offers the determination’s own classifications', async () => {
    const at = await promotedAt();
    const result = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      await sessionFor({ rawTitle: 'SHOP HELPER — NIGHTS', chosenOrdinal: null, band: 'over_100k' }),
    );
    if (!result.ok) throw new Error('expected a generation');

    const [resolution] = result.value.resolutions;
    if (!resolution) throw new Error('expected one line');
    expect(resolution.chosen).toBeNull();
    expect(resolution.outcome.refusal?.primitive).toBe('P-A');
    expect(resolution.outcome.candidates.length).toBeGreaterThan(0);

    // Every candidate is a row of THIS revision. The candidate set is a closed
    // enumeration of the determination's own text and of nothing else.
    const ids = new Set(
      (await classificationsOf(tdb.db, wdNumber('VA20260195'), 2)).map((row) => String(row.id)),
    );
    for (const candidate of resolution.outcome.candidates) {
      expect(ids.has(String(candidate.classificationId))).toBe(true);
    }

    // The rest of the filing continues — P-A marks a row, it does not stop the form.
    expect(result.value.pdf.byteLength).toBeGreaterThan(1_000);
  });

  it('pre-selects only on an exact match against the determination’s own label', async () => {
    const { className, ordinal } = await firstClassification();
    const at = await promotedAt();

    const exact = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      await sessionFor({ rawTitle: className, chosenOrdinal: null, band: 'over_100k' }),
    );
    if (!exact.ok) throw new Error('expected a generation');
    const exactOutcome = exact.value.resolutions[0]?.outcome;
    expect(exactOutcome?.level).toBe('L_C1');
    expect(exactOutcome?.preSelected).not.toBeNull();
    // Even pre-selected, the line stays blocked until the visitor clicks: a
    // pre-selection is an offer, never a decision.
    expect(exact.value.resolutions[0]?.chosen).toBeNull();
    expect(ordinal).toBeGreaterThanOrEqual(0);

    const inexact = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      await sessionFor({ rawTitle: 'SHOP HELPER — NIGHTS', chosenOrdinal: null, band: 'over_100k' }),
    );
    if (!inexact.ok) throw new Error('expected a generation');
    expect(inexact.value.resolutions[0]?.outcome.preSelected).toBeNull();
  });

  it('cannot be handed a classification that is not on this revision', async () => {
    const at = await promotedAt();
    const result = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      // A crafted POST naming an ordinal the determination does not have.
      await sessionFor({ rawTitle: 'ANYTHING', chosenOrdinal: 99_999, band: 'over_100k' }),
    );
    if (!result.ok) throw new Error('expected a generation');
    expect(result.value.resolutions[0]?.chosen).toBeNull();
    if (result.value.verdict.status !== 'DRAFT_NOT_CERTIFIABLE') throw new Error('unreachable');
    expect(result.value.verdict.blocks).toContain('UNMAPPED_TRADE');
  });
});

describe('§4.4 — the contract-value band, asked and never guessed', () => {
  it('raises CWHSSA_COVERAGE_UNDETERMINED on "I don’t know" and prints the reason', async () => {
    const { ordinal, className } = await firstClassification();
    const at = await promotedAt();
    const result = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      await sessionFor({ rawTitle: className, chosenOrdinal: ordinal, band: 'unknown' }),
    );
    if (!result.ok) throw new Error('expected a generation');
    if (result.value.verdict.status !== 'DRAFT_NOT_CERTIFIABLE') throw new Error('unreachable');
    expect(result.value.verdict.blocks).toContain('CWHSSA_COVERAGE_UNDETERMINED');
    expect(result.value.exceptions.join(' ')).toContain('in excess of $100,000');
  });

  it('computes no premium at or under the threshold, and says which computation did not run', async () => {
    const { ordinal, className } = await firstClassification();
    const at = await promotedAt();
    const result = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      await sessionFor({
        rawTitle: className,
        chosenOrdinal: ordinal,
        band: 'at_or_under_100k',
        // Forty-eight hours: over the CWHSSA line, so a premium would show if one
        // were computed.
        stDays: hours(0, 800, 800, 800, 800, 800, 800),
      }),
    );
    if (!result.ok) throw new Error('expected a generation');
    expect(result.value.computation.totalCwhssaPremium).toBe(0);
    const band = result.value.artifact.footer.find((line) => line.id === 'band')?.text ?? '';
    expect(band).toContain('$100,000 or less');
    expect(band).toContain('no Contract Work Hours and Safety Standards Act premium is computed');
  });
});

describe('the determination the visitor named — resolved before any payroll is typed', () => {
  it('declines a number the mirror does not hold, without concluding it does not exist', async () => {
    const at = await promotedAt();
    const session = await sessionFor({ rawTitle: 'X', chosenOrdinal: null, band: 'over_100k' });
    const result = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      { ...session, wd: { mode: 'number', wdNumber: 'ZZ20269999' } },
    );
    if (result.ok) throw new Error('expected a refusal');
    expect(result.refusal.primitive).toBe('P-D');
    if (result.refusal.primitive !== 'P-D') throw new Error('unreachable');
    expect(result.refusal.declined).toContain('does not conclude that this determination does not exist');
  });

  it('declines a county x construction type the snapshot does not cover, and names what it does', async () => {
    const at = await promotedAt();
    const session = await sessionFor({ rawTitle: 'X', chosenOrdinal: null, band: 'over_100k' });
    const result = await generateFreeWh347(
      { db: tdb.db, now: new Date(at.getTime() + 60_000), buildSha: 'test-build', engineVersion: 1 },
      {
        ...session,
        wd: { mode: 'county', stateCode: 'VA', countyName: 'Gloucester', constructionType: 'Building' },
      },
    );
    if (result.ok) throw new Error('expected a refusal');
    if (result.refusal.primitive !== 'P-D') throw new Error('expected P-D');
    expect(result.refusal.observableFacts.map((fact) => fact.value).join(' ')).toContain('Highway');
    expect(result.refusal.declined).toContain('does not interpolate a rate from a neighbouring county');
  });
});

// ===========================================================================
// L2 STALE — the asymmetry, stated so it cannot be got backwards
// ===========================================================================

describe('L2 STALE — generation fails closed; the lookup narrows rather than blanks', () => {
  it('suppresses a new free-tier rate assertion with a dated P-C and no credit', async () => {
    const at = await promotedAt();
    const stale = new Date(at.getTime() + 100 * 60 * 60 * 1000); // > 72 h
    const { ordinal, className } = await firstClassification();
    const result = await generateFreeWh347(
      { db: tdb.db, now: stale, buildSha: 'test-build', engineVersion: 1 },
      await sessionFor({ rawTitle: className, chosenOrdinal: ordinal, band: 'over_100k' }),
    );
    if (result.ok) throw new Error('expected a refusal at L2');
    expect(result.refusal.primitive).toBe('P-C');
    if (result.refusal.primitive !== 'P-C') throw new Error('unreachable');
    expect(result.refusal.ladderLevel).toBe('L2_STALE');
    // The narrowing carries a date, always. A narrowing without a timestamp is
    // vagueness wearing a refusal's clothes.
    expect(result.refusal.asOf.getTime()).toBe(stale.getTime());
    // A free visitor paid nothing, so nothing is owed — and the sentence is the
    // same one a paying customer sees.
    expect(result.refusal.credit).toBeNull();
    expect(result.refusal.narrowedClaim).toContain('county rate pages still answer');
  });

  it('keeps answering the lookup from the last promoted snapshot at L2', async () => {
    const at = await promotedAt();
    const stale = new Date(at.getTime() + 100 * 60 * 60 * 1000);
    const corpus = await corpusState(tdb.db, stale);
    expect(corpus.levels).toContain('L2_STALE');

    // Never a blank page and never a silent stale page: the rows are still there,
    // and the banner beside them carries the date.
    const rows = await lookupCountyRates(tdb.db, {
      stateCode: 'VA',
      countyName: 'Gloucester',
      constructionType: 'Highway',
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(corpus.snapshotRef).not.toBeNull();
  });
});

// ===========================================================================
// Component M — the shared column map
// ===========================================================================

describe('component M — CSV parsing and the column map', () => {
  it('parses RFC 4180 quoting, CRLF and a BOM without inventing a row', () => {
    const table = parseCsv('﻿Last,First,"Job Title"\r\nBell,Marcus,"STRIPER, LEAD"\r\n\r\n');
    expect(table.header).toEqual(['Last', 'First', 'Job Title']);
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0]).toEqual(['Bell', 'Marcus', 'STRIPER, LEAD']);
  });

  it('suggests only what it is sure of, and says what it matched on', () => {
    const suggestions = suggestMapping(['Employee Last Name', 'First Name', 'Job Title', 'Widget']);
    const byTarget = new Map(suggestions.map((suggestion) => [suggestion.target, suggestion]));
    expect(byTarget.get('lastName')?.columnIndex).toBe(0);
    expect(byTarget.get('firstName')?.columnIndex).toBe(1);
    expect(byTarget.get('classification')?.columnIndex).toBe(2);
    expect(byTarget.get('classification')?.matchedOn).toBe('job title');
    // A column it cannot place stays unplaced. A near-miss looks answered; a blank
    // is visibly unanswered, and on this screen that is the safer failure.
    expect(suggestions.every((suggestion) => suggestion.columnIndex !== 3)).toBe(true);
  });

  it('never coerces an unreadable cell into a number', () => {
    expect(hoursHundredths('8')).toBe(800);
    expect(hoursHundredths('8.25')).toBe(825);
    expect(hoursHundredths('')).toBe(0);
    expect(hoursHundredths('eight')).toBeNull();
    expect(rateMilli('$35.00')).toBe(350_000);
    expect(rateMilli('n/a')).toBeNull();
    expect(moneyCents('1,400.00')).toBe(140_000);
    expect(moneyCents('—')).toBeNull();
  });
});

// ===========================================================================
// The obligations the exception report cites
// ===========================================================================

describe('obligation values come from the corpus, not from a constant in the code', () => {
  it('reads the threshold, the liquidated-damages figure and the paragraph letters', async () => {
    const obligations = await loadObligations(tdb.db);
    expect(obligations.cwhssaContractThreshold.value).toBe(100_000_00);
    expect(obligations.cwhssaContractThreshold.citation).toBe('29 CFR 5.5(b)');
    expect(obligations.liquidatedDamagesPerDay.value).toBe(33_00);
    expect(obligations.deductionParagraphs.value.map((paragraph) => paragraph.letter)).toEqual([
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    ]);
  });

  it('fails the build rather than the line when the regulation gains a paragraph', () => {
    expect(() => assertParagraphsMatch(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'])).toThrow(
      /paragraph mismatch/,
    );
  });
});

// ===========================================================================
// A3 and the struck-claims register, enforced over the source of this surface
// ===========================================================================

describe('A3 — there is no escalation path anywhere under (free)', () => {
  const root = join(process.cwd(), 'src', 'app', '(free)');

  function sources(directory: string): string[] {
    return readdirSync(directory).flatMap((entry) => {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) return sources(path);
      return /\.(ts|tsx)$/.test(entry) ? [path] : [];
    });
  }

  it('contains no contact affordance of any kind', () => {
    /**
     * A3 forbids an escalation path to a human anywhere in the compliance flow, and
     * §19 makes it a lint rather than a habit: "A lint rule fails the build if one
     * appears under the filing route tree." This is that rule for the anonymous
     * surface, which is the one an unlimited number of strangers can reach.
     */
    const forbidden = [
      /mailto:/i,
      /contact (us|support|our)/i,
      /support@/i,
      /\blive chat\b/i,
      /\bchat (with|to) (us|an? )/i,
      /help ?(centre|center|desk)/i,
      /\bopen a ticket\b/i,
      /\bget in touch\b/i,
      /\breach out\b/i,
      /talk to (sales|someone|a human)/i,
      /request a demo/i,
    ];
    const offences: string[] = [];
    for (const file of sources(root)) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        if (pattern.test(text)) offences.push(`${file} :: ${pattern}`);
      }
    }
    expect(offences).toEqual([]);
  });

  it('reprints no claim the corrections register struck', () => {
    /**
     * `CORRECTIONS.md` §3.1 scope A: shipping surfaces get no marker escape. These
     * are the blocking probes that could plausibly reach a rate page or a generator
     * screen — the cornered-resource moat, the misread DOL burden, the invented
     * data-point count, and the False Claims Act penalty misattributed to DBRA.
     */
    const struck = [
      /retroactively (buy|acquire|purchase)/i,
      /(cannot|can not|can't|impossible|unable|no way).{0,40}reconstruct/i,
      /cornered resource/i,
      /\$?19,?500/,
      /15\+? ?hours a week/i,
      /168 (discrete )?data ?points/i,
      /\$?28,619/,
      /(rising|increasing|heightened) (enforcement|scrutiny|audits?)/i,
      /\$4,?995/,
    ];
    const offences: string[] = [];
    for (const file of sources(root)) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of struck) {
        if (pattern.test(text)) offences.push(`${file} :: ${pattern}`);
      }
    }
    expect(offences).toEqual([]);
  });

  it('makes no unmeasured accuracy, acceptance, coverage or time-saved claim', () => {
    const gateLocked = [
      /\b\d{2,3}(\.\d+)? ?% (accurate|accuracy|coverage)/i,
      /\bevery wage determination\b/i,
      /\b(saves?|saving) (you )?\d+/i,
      /\bzero human minutes\b/i,
      /\btrusted by\b/i,
      /\bfilings? (is|are) compliant\b/i,
      /\brates verified\b/i,
    ];
    const offences: string[] = [];
    for (const file of sources(root)) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of gateLocked) {
        if (pattern.test(text)) offences.push(`${file} :: ${pattern}`);
      }
    }
    expect(offences).toEqual([]);
  });
});
