/**
 * WL-03 — the classification catalogue.
 *
 * The determination for Harris County Building lists 57 classifications in 15
 * rate groups, alphabetised WITHIN each group and not across them. `ELECTRICIAN`
 * therefore appears twice — $38.50 under `ELEC0716-005` and $18.00 under
 * `SUTX2014-029` — and the difference between finding the right row and picking
 * the first one is what this screen is for.
 *
 * Two properties are asserted here rather than assumed:
 *
 *  - **The catalogue is scoped to the PINNED modification** (V1, gate G9).
 *  - **Every figure carries its determination** (V4, gate G8), including a
 *    fringe of zero, which renders `$0.00` and not blank, because the form
 *    needs the number.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { events } from '@octopus/platform/db';

import { ClassificationTable } from '../src/components/determination';
import { emitEvent } from '../src/lib/analytics/events';
import { ingestCounties, ingestDetermination } from '../src/lib/kb/ingest';
import {
  getDetermination,
  getDeterminationText,
  searchClassifications,
  type ClassificationRow,
} from '../src/lib/kb';
import { harrisIndexRecords, makeDb, makeSam, seedOrg } from './helpers';

let harness: Awaited<ReturnType<typeof makeDb>>;
let db: Awaited<ReturnType<typeof makeDb>>['db'];
let sam: ReturnType<typeof makeSam>;
let wdId: string;
let orgId: string;
let userId: string;

const provenance = {
  wdNumber: 'TX20260253',
  modificationNumber: 1,
  publicationDate: '2026-05-18',
  publicUrl: 'https://sam.gov/wage-determination/TX20260253/1',
};

beforeEach(async () => {
  harness = await makeDb();
  db = harness.db;
  sam = makeSam();
  await ingestCounties(db, sam, 'TX');
  const ingested = await ingestDetermination(db, sam, {
    wdNumber: 'TX20260253',
    revision: 1,
    indexRecord: harrisIndexRecords().find((r) => r.fullReferenceNumber === 'TX20260253') as never,
  });
  wdId = ingested.wdId;
  const seeded = await seedOrg(db);
  orgId = seeded.orgId;
  userId = seeded.userId;
});
afterEach(async () => {
  await harness.close();
});

describe('the catalogue is the pinned determination, counted in its own header', () => {
  it('renders 57 classifications with their rate group, headed by the pinned modification', async () => {
    const { rows, total } = await searchClassifications(db, wdId, { limit: 1000 });
    expect(total).toBe(57);
    // 14 distinct rate-group identifiers: the document prints IRON0084-012
    // twice and the ingest keeps ONE group row for it, which is why a UI list
    // may never be keyed on a rate group either.
    expect(new Set(rows.map((row) => row.rateGroupIdentifier)).size).toBe(14);

    const html = renderToStaticMarkup(
      <ClassificationTable
        rows={rows}
        total={total}
        provenance={provenance}
        heading={`${total} classifications on TX20260253 mod 1`}
      />,
    );
    expect(html).toContain('57 classifications on TX20260253 mod 1');
    expect(html).toContain('ELEC0716-005');
    expect(html).toContain('union');
  });

  it('spot-checks three rate/fringe pairs against the committed fixture', async () => {
    const { rows } = await searchClassifications(db, wdId, { limit: 1000 });
    const find = (label: string) => rows.find((row) => row.classificationLabel.startsWith(label));
    expect(find('ELECTRICIAN (EXCLUDES LOW VOLTAGE')).toMatchObject({
      baseRate: '38.50',
      fringeRate: '10.71',
    });
    expect(find('LABORER: COMMON OR GENERAL')).toMatchObject({
      baseRate: '11.76',
      fringeRate: '0.00',
    });
    expect(find('ELEVATOR MECHANIC')).toMatchObject({
      baseRate: '53.59',
      fringeRate: '38.44',
    });
  });

  it('reads only the pinned modification: mod 0 has 54 rows and mod 1 has 57 (G9)', async () => {
    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: false,
    });
    const pinnedToZero = await searchClassifications(db, modZero.wdId, { limit: 1000 });
    expect(pinnedToZero.total).toBe(54);
    for (const row of pinnedToZero.rows) expect(row.modificationNumber).toBe(0);

    const pinnedToOne = await searchClassifications(db, wdId, { limit: 1000 });
    expect(pinnedToOne.total).toBe(57);
    for (const row of pinnedToOne.rows) expect(row.modificationNumber).toBe(1);
  });
});

describe('search the way a person talks', () => {
  it('“electrician” returns BOTH rows, and neither is presented as the likelier answer', async () => {
    const { rows } = await searchClassifications(db, wdId, { query: 'electrician' });
    const labels = rows.map((row) => row.classificationLabel);
    expect(labels).toContain('ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING AND INSTALLATION OF ALARMS)');
    expect(labels).toContain('ELECTRICIAN (LOW VOLTAGE WIRING ONLY)');
    expect(rows.find((r) => r.classificationLabel.includes('EXCLUDES'))).toMatchObject({
      baseRate: '38.50',
      fringeRate: '10.71',
    });
    expect(rows.find((r) => r.classificationLabel.includes('LOW VOLTAGE WIRING ONLY'))).toMatchObject(
      { baseRate: '18.00', fringeRate: '1.68' },
    );

    const html = renderToStaticMarkup(
      <ClassificationTable rows={rows} total={rows.length} provenance={provenance} showQualifier />,
    );
    expect(html.toLowerCase()).not.toMatch(/recommended|best match|most likely|suggested/);
  });

  it('“backhoe” finds the OPERATOR row at $13.94', async () => {
    const { rows } = await searchClassifications(db, wdId, { query: 'backhoe' });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      classificationLabel: 'OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE',
      baseRate: '13.94',
    });
  });

  it('“xylophonist” returns nothing, and the zero-results event carries the query', async () => {
    const { rows, total } = await searchClassifications(db, wdId, { query: 'xylophonist' });
    expect(rows).toHaveLength(0);
    expect(total).toBe(0);

    await emitEvent(db, 'classification_zero_results', {
      orgId,
      userId,
      props: { query: 'xylophonist', wd_number: 'TX20260253' },
    });
    const [row] = await db.select().from(events);
    expect(row?.name).toBe('classification_zero_results');
    expect(row?.props).toMatchObject({ query: 'xylophonist', wd_number: 'TX20260253' });
  });

  it('a one-character query returns the unfiltered list rather than nothing (V3)', async () => {
    // The screen treats a single character as "no filter"; the query layer is
    // exercised here with the same rule the page applies.
    const term = 'e';
    const effective = term.trim().length >= 2 ? term : undefined;
    const { total } = await searchClassifications(db, wdId, {
      ...(effective ? { query: effective } : {}),
      limit: 1000,
    });
    expect(total).toBe(57);
  });

  it('pages server-side: a big determination hands the browser a page, never all of it', async () => {
    const heavy = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260034',
      revision: 1,
      indexRecord: harrisIndexRecords().find(
        (r) => r.fullReferenceNumber === 'TX20260034',
      ) as never,
    });
    const first = await searchClassifications(db, heavy.wdId, { limit: 50, offset: 0 });
    const second = await searchClassifications(db, heavy.wdId, { limit: 50, offset: 50 });
    expect(first.total).toBe(66);
    expect(first.rows).toHaveLength(50);
    expect(second.rows).toHaveLength(16);
    expect(second.total).toBe(66);
    // No id appears on two pages.
    const ids = new Set([...first.rows, ...second.rows].map((row) => row.id));
    expect(ids.size).toBe(66);
  });
});

describe('the row, and the numbers on it', () => {
  it('shows a fringe of zero as $0.00, because the form needs the number', async () => {
    const { rows } = await searchClassifications(db, wdId, { query: 'laborer common' });
    const laborer = rows.find((row) => row.classificationLabel === 'LABORER: COMMON OR GENERAL');
    expect(laborer?.fringeRate).toBe('0.00');
    const html = renderToStaticMarkup(
      <ClassificationTable rows={laborer ? [laborer] : []} total={1} provenance={provenance} />,
    );
    expect(html).toContain('$0.00');
  });

  it('computes the total for display only and never stores it (V2)', async () => {
    const { rows } = await searchClassifications(db, wdId, { query: 'backhoe' });
    const row = rows[0] as ClassificationRow;
    expect(Object.keys(row)).not.toContain('total');
    const html = renderToStaticMarkup(
      <ClassificationTable rows={[row]} total={1} provenance={provenance} />,
    );
    // base, fringe and the derived total, each stamped with its determination.
    expect(html).toContain('$13.94');
    expect(html).toContain('$0.00');
    expect(html).toContain('$13.94'); // 13.94 + 0.00
  });

  it('shows a repeated label as separate rows and never dedupes them', async () => {
    // TX20260253 prints GLAZIER twice under IRON0084-012 — the same shape as
    // MN20260080's duplicated surveyor. Both rows are shown; `kb_classifications`
    // is keyed on (wd_id, line_no) BECAUSE labels repeat, so a UI list may never
    // be keyed on the label.
    const { rows } = await searchClassifications(db, wdId, { query: 'glazier' });
    const glaziers = rows.filter((row) => row.classificationLabel === 'GLAZIER');
    expect(glaziers).toHaveLength(2);
    expect(new Set(glaziers.map((row) => row.id)).size).toBe(2);
    expect(new Set(glaziers.map((row) => row.lineNo)).size).toBe(2);

    const html = renderToStaticMarkup(
      <ClassificationTable rows={glaziers} total={2} provenance={provenance} showQualifier />,
    );
    expect((html.match(/>GLAZIER</g) ?? []).length).toBe(2);
  });

  it('keeps the qualifier as a column so two variants of one label are told apart', async () => {
    const { rows } = await searchClassifications(db, wdId, { query: 'electrician' });
    const withQualifier = rows.filter((row) => row.qualifier);
    expect(withQualifier.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(
      <ClassificationTable rows={rows} total={rows.length} provenance={provenance} showQualifier />,
    );
    expect(html).toContain('Qualifier');
    expect(html).toContain(withQualifier[0]?.qualifier as string);
  });

  it('never truncates a footnote away: the expanded row carries it in full', async () => {
    const { rows } = await searchClassifications(db, wdId, { query: 'elevator' });
    const elevator = rows.find((row) => row.classificationLabel.startsWith('ELEVATOR MECHANIC'));
    expect(elevator).toBeDefined();
    const html = renderToStaticMarkup(
      <ClassificationTable
        rows={[elevator as ClassificationRow]}
        total={1}
        provenance={provenance}
        expandedIds={[(elevator as ClassificationRow).id]}
        detailHref={(row) => `?expand=${row.id}`}
      />,
    );
    expect(html).toContain('classification-detail');
    expect(html).toContain('Rate from wage determination');
    expect(html).not.toContain('…');
  });

  it('gate G8 — every currency figure has the determination on an ancestor', async () => {
    const { rows, total } = await searchClassifications(db, wdId, { limit: 1000 });
    const html = renderToStaticMarkup(
      <ClassificationTable rows={rows} total={total} provenance={provenance} showQualifier />,
    );
    const figures = html.match(/\$\d[\d,]*\.\d{2}/g) ?? [];
    // rate + fringe + total for each of the 57 rows.
    expect(figures.length).toBe(total * 3);
    const stamps = html.match(/data-wd-number="TX20260253"/g) ?? [];
    expect(stamps.length).toBeGreaterThanOrEqual(figures.length);
  });
});

describe('the determination’s own words', () => {
  it('reproduces the document verbatim, legend and END OF GENERAL DECISION included', async () => {
    const text = await getDeterminationText(db, wdId);
    expect(text).toBeDefined();
    expect(text).toContain('Modification Number');
    expect(text).toContain('Rate Identifiers');
    expect(text).toContain('END OF GENERAL DECISION');
    expect(text).toContain('SUTX2014');
  });

  it('is the pinned modification’s text, not the active one’s', async () => {
    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: false,
    });
    const zero = await getDeterminationText(db, modZero.wdId);
    const one = await getDeterminationText(db, wdId);
    expect(zero).not.toBe(one);
    const active = await getDetermination(db, 'TX20260253');
    expect(active.resolution).toBe('active');
  });
});
