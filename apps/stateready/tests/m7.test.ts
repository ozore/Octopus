/**
 * M7 — the board. `specs/07`, every acceptance criterion by number.
 *
 * **AC3b is the load-bearing one and it is deliberately one fixture with two
 * assertions in this file**: a licence 89 days from expiry renders its state
 * AT RISK *and* produces the 90-day alert offset. The map and the first alert
 * gate cannot drift apart without this test failing, which is the whole of D7
 * made structural rather than remembered.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId } from '@octopus/platform';
import { organisations, users } from '@octopus/platform/db';
import { createTestDb } from '@octopus/platform/testing';

import {
  BoardBand,
  CoveragePanel,
  EmptyBoard,
  ExpiringList,
  PrintableDeadlineTable,
  StatusLine,
} from '../src/components/board';
import { TileGrid } from '../src/components/status';
import { ALERT_OFFSETS, AT_RISK_DAYS } from '../src/lib/cron';
import { appMigrationsDir } from '../src/lib/db';
import { getCoverage } from '../src/lib/kb/accessors';
import { boardCsv, buildBoard, buildCalendar, buildStatusLine, shiftMonth } from '../src/lib/repos/board';
import { refreshDashboardSummary, statusForDeadline } from '../src/lib/repos/dashboard';
import { ensureRecipient, selectDueOffsets } from '../src/lib/repos/alerts';
import { createLicence } from '../src/lib/repos/licences';
import { liveDeadlineIds, markRenewed, renewalConsistencyWarning } from '../src/lib/repos/renewals';
import { setOperatingStates } from '../src/lib/repos/company';
import { addDays } from '../src/lib/rules/dates';
import { alerts, deadlines, licences, technicians } from '../src/lib/schema';

const TODAY = '2026-09-03';

let db: Awaited<ReturnType<typeof createTestDb>>;
let orgId: string;

beforeEach(async () => {
  db = await createTestDb([appMigrationsDir()]);
  orgId = newId('org');
  await db.db.insert(organisations).values({ id: orgId, name: 'Sila Mechanical LLC', slug: `sila-${orgId}` });
});
afterEach(async () => {
  await db.close();
});

async function technician(first: string, last: string): Promise<string> {
  const id = newId('tec');
  await db.db.insert(technicians).values({ id, orgId, firstName: first, lastName: last });
  return id;
}

async function seed(input: {
  state: string;
  trade: string;
  kbLicenceTypeId?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  holder?: [string, string];
  customTypeName?: string | null;
}) {
  const [first, last] = input.holder ?? ['Dave', 'Alvarez'];
  return createLicence(
    db.db,
    {
      orgId,
      holderKind: 'technician',
      technicianId: await technician(first, last),
      state: input.state,
      trade: input.trade,
      kbLicenceTypeId: input.kbLicenceTypeId ?? null,
      customTypeName: input.customTypeName ?? null,
      issuedOn: input.issuedOn ?? null,
      expiresOn: input.expiresOn ?? null,
    },
    { today: TODAY },
  );
}

// ---------------------------------------------------------------------------
// AC1 — an empty board is an instruction, never a chart of nothing
// ---------------------------------------------------------------------------

describe('specs/07 AC1 — an organisation with zero licences', () => {
  it('reports empty, and the empty state is an instruction with two routes out', async () => {
    const model = await buildBoard(db.db, orgId, TODAY);
    expect(model.empty).toBe(true);
    expect(model.statusLine).toBe('Nothing tracked yet — add your first licence and the board lights up.');

    const html = renderToStaticMarkup(createElement(EmptyBoard));
    expect(html).toContain('Add your first licence');
    expect(html).toContain('/licences/new');
    expect(html).toContain('Import your roster');
    // No chart of nothing: the grid is not in the empty state at all.
    expect(html).not.toContain('tile-grid');
  });
});

// ---------------------------------------------------------------------------
// AC2 — one lapsed Texas plumbing licence
// ---------------------------------------------------------------------------

describe('specs/07 AC2 — one lapsed Texas plumbing licence', () => {
  it('names the state and the holder in the status line, and the TX tile carries the word LAPSED', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'plumbing' }] });
    // Issued two years ago on a twelve-month anniversary rule.
    await seed({
      state: 'TX',
      trade: 'plumbing',
      kbLicenceTypeId: 'tx.plumbing.master_plumber',
      issuedOn: '2024-03-14',
      holder: ['Rosa', 'Delgado'],
    });

    const model = await buildBoard(db.db, orgId, TODAY);
    expect(model.dashboard.worstStatus).toBe('LAPSED');
    expect(model.statusLine).toMatch(/lapsed/);
    expect(model.statusLine).toContain('Texas');
    expect(model.statusLine).toContain('plumbing');
    expect(model.statusLine).toContain('Rosa Delgado');

    const status = renderToStaticMarkup(createElement(StatusLine, { model }));
    expect(status).toContain('Rosa Delgado');
    expect(status).toContain('LAPSED');

    // The tile: fill + edge + GLYPH + the word in the accessible name.
    const grid = renderToStaticMarkup(createElement(TileGrid, { tiles: model.dashboard.tiles }));
    expect(grid).toContain('data-testid="tile-TX"');
    expect(grid).toMatch(/data-status="lapsed"[^>]*data-testid="tile-TX"/);
    expect(grid).toContain('✕');
    expect(grid).toContain('Texas — LAPSED, 1 licence');
  });
});

// ---------------------------------------------------------------------------
// AC3 / AC3b / AC3c — the grid
// ---------------------------------------------------------------------------

describe('specs/07 AC3 — clicking a tile filters, and the URL is shareable', () => {
  it('scopes the cards to one state and links every tile to a shareable URL', async () => {
    await setOperatingStates(db.db, {
      orgId,
      rows: [
        { state: 'TX', trade: 'hvac' },
        { state: 'NC', trade: 'plumbing' },
      ],
    });
    await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
    });
    await seed({
      state: 'NC',
      trade: 'plumbing',
      kbLicenceTypeId: 'nc.plumbing.plumbing_contractor',
      issuedOn: '2026-03-14',
      holder: ['Ann', 'Ruiz'],
    });

    const all = await buildBoard(db.db, orgId, TODAY);
    const texas = await buildBoard(db.db, orgId, TODAY, { state: 'tx' });
    expect(all.cards.length).toBeGreaterThan(texas.cards.length);
    expect(texas.cards.every((card) => card.state === 'TX')).toBe(true);
    expect(texas.stateFilter).toBe('TX');

    const html = renderToStaticMarkup(createElement(BoardBand, { model: all }));
    expect(html).toContain('href="/dashboard?state=TX"');
    // A selected tile links BACK to the unfiltered board, so the filter toggles.
    const selected = renderToStaticMarkup(createElement(BoardBand, { model: texas }));
    expect(selected).toMatch(/href="\/dashboard"[^>]*data-testid="tile-TX"/);
    expect(selected).toContain('data-selected="true"');
  });
});

describe('specs/07 AC3b — 89 days is AT RISK on the map AND a 90-day alert', () => {
  /**
   * ONE FIXTURE, TWO ASSERTIONS, IN THE SAME FILE. `AT_RISK_DAYS` is
   * `ALERT_OFFSETS[0]`, not a copy of it, so the map and the first alert gate
   * cannot disagree — and if either moves without the other, this fails.
   */
  it('the same licence turns the tile AT RISK and selects the 90-day offset', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'OH', trade: 'hvac' }] });
    const dueOn = addDays(TODAY, 89);
    const { licence } = await seed({
      state: 'OH',
      trade: 'hvac',
      customTypeName: 'Ohio HVAC contractor',
      expiresOn: dueOn,
    });

    // 1. the map
    const model = await buildBoard(db.db, orgId, TODAY);
    const ohio = model.dashboard.tiles.find((tile) => tile.state === 'OH')!;
    expect(ohio.status).toBe('AT RISK');
    expect(ohio.accessibleName).toContain('AT RISK');
    expect(statusForDeadline(dueOn, TODAY)).toBe('AT RISK');

    // 2. the alert schedule, from the SAME row
    const live = await db.db.select().from(deadlines).where(eq(deadlines.licenceId, licence.id));
    expect(live).toHaveLength(1);
    const due = selectDueOffsets([{ id: live[0]!.id, dueOn }], new Set(), TODAY);
    expect(due).toEqual([{ deadlineId: live[0]!.id, offsetDays: 90 }]);

    // 3. and the identity that makes the two the same number
    expect(AT_RISK_DAYS).toBe(ALERT_OFFSETS[0]);
    expect(AT_RISK_DAYS).toBe(90);
  });

  it('91 days is READY on both sides', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'OH', trade: 'hvac' }] });
    const dueOn = addDays(TODAY, 91);
    await seed({ state: 'OH', trade: 'hvac', customTypeName: 'Ohio HVAC contractor', expiresOn: dueOn });
    const model = await buildBoard(db.db, orgId, TODAY);
    expect(model.dashboard.tiles.find((t) => t.state === 'OH')!.status).toBe('READY');
    expect(selectDueOffsets([{ id: 'x', dueOn }], new Set(), TODAY)).toEqual([]);
  });
});

describe('specs/07 AC3c — 51 tiles, whatever the footprint', () => {
  it('draws 51 tiles and gives a jurisdiction outside the footprint no status word', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    const model = await buildBoard(db.db, orgId, TODAY);
    expect(model.dashboard.tiles).toHaveLength(51);

    const html = renderToStaticMarkup(createElement(TileGrid, { tiles: model.dashboard.tiles }));
    expect((html.match(/data-testid="tile-[A-Z]{2}"/g) ?? [])).toHaveLength(51);
    expect(html).toContain('Ohio — not in your footprint');
    expect(html).toMatch(/data-hollow="true"[^>]*data-testid="tile-OH"/);

    const ohio = model.dashboard.tiles.find((tile) => tile.state === 'OH')!;
    expect(ohio.status).toBeNull();
    for (const word of ['READY', 'AT RISK', 'LAPSED', 'NOT TRACKED']) {
      expect(ohio.accessibleName).not.toContain(word);
    }
  });
});

// ---------------------------------------------------------------------------
// AC4 — the coverage honesty panel counts from getCoverage()
// ---------------------------------------------------------------------------

describe('specs/07 AC4 — the coverage honesty panel', () => {
  it('selecting Ohio never increases the number of states we say we derive', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    const before = await buildBoard(db.db, orgId, TODAY);
    expect(before.coverage.operatingStates).toBe(1);
    expect(before.coverage.coveredStates).toBe(1);

    await setOperatingStates(db.db, {
      orgId,
      rows: [
        { state: 'TX', trade: 'hvac' },
        { state: 'OH', trade: 'hvac' },
      ],
    });
    const after = await buildBoard(db.db, orgId, TODAY);
    expect(after.coverage.operatingStates).toBe(2);
    // The number that matters: it did NOT move.
    expect(after.coverage.coveredStates).toBe(1);
    expect(after.coverage.notDerived).toEqual([{ state: 'OH', trade: 'hvac' }]);
    expect(getCoverage('OH', 'hvac', TODAY).covered).toBe(false);

    const html = renderToStaticMarkup(createElement(CoveragePanel, { coverage: after.coverage }));
    expect(html).toContain('You operate in');
    expect(html).toContain('OH hvac');
    // The panel states what the rule library does NOT hold, not only what it does.
    expect(html).toContain('county or city licensing');
    expect(html).toContain('the board does not publish this');
    expect(html).toContain('bond amount');
  });

  it('names a state we hold a licence in but the profile does not claim', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    await seed({
      state: 'NC',
      trade: 'plumbing',
      kbLicenceTypeId: 'nc.plumbing.plumbing_contractor',
      issuedOn: '2026-03-14',
    });
    const model = await buildBoard(db.db, orgId, TODAY);
    expect(model.coverage.outsideProfile).toEqual(['NC']);
    const html = renderToStaticMarkup(createElement(CoveragePanel, { coverage: model.coverage }));
    expect(html).toContain('coverage-outside-profile');
  });
});

// ---------------------------------------------------------------------------
// AC5 — markRenewed
// ---------------------------------------------------------------------------

describe('specs/07 AC5 — markRenewed', () => {
  it('updates the licence, writes a new deadline, cancels the pending alerts and refreshes the summary', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    const { licence } = await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2025-10-01',
    });

    const userId = newId('usr');
    await db.db.insert(users).values({ id: userId, email: `owner+${userId}@sila.test` });
    await ensureRecipient(db.db, { userId, orgId, now: new Date('2026-09-03T12:00:00Z') });

    const before = await liveDeadlineIds(db.db, licence.id);
    const renewalId = (
      await db.db.select().from(deadlines).where(eq(deadlines.licenceId, licence.id))
    ).find((row) => row.kind === 'renewal')!.id;
    for (const deadlineId of before) {
      await db.db.insert(alerts).values({
        id: newId('alr'),
        orgId,
        deadlineId,
        recipientUserId: userId,
        offsetDays: 90,
        status: 'queued',
      });
    }

    const result = await markRenewed(
      db.db,
      { orgId, deadlineId: renewalId, newExpiry: '2027-10-01', actorUserId: userId },
      { today: TODAY },
    );

    expect(result.superseded).toBeGreaterThan(0);
    expect(result.inserted).toBeGreaterThan(0);
    expect(result.alertsCancelled).toBeGreaterThan(0);

    const updated = await db.db.select().from(licences).where(eq(licences.id, licence.id));
    expect(updated[0]!.expiresOn).toBe('2027-10-01');
    expect(updated[0]!.expirySource).toBe('entered');

    // Precisely: an alert whose deadline was superseded is cancelled, and one
    // whose deadline did NOT move is left alone. Cancelling the second would
    // lose an alert the customer is still owed.
    const stillLive = new Set(await liveDeadlineIds(db.db, licence.id));
    const alertRows = await db.db.select().from(alerts);
    for (const row of alertRows) {
      const superseded = !stillLive.has(row.deadlineId);
      expect(row.status, row.deadlineId).toBe(superseded ? 'cancelled' : 'queued');
    }
    expect(alertRows.some((row) => row.status === 'cancelled')).toBe(true);

    // The summary is recomputed synchronously, so it is never stale in a way the
    // user can notice.
    const model = await buildBoard(db.db, orgId, TODAY);
    expect(model.cards.some((card) => card.dueOn === '2027-10-01')).toBe(true);
  });

  it('warns when the new expiry does not match the state’s cycle — and saves it anyway', () => {
    const warning = renewalConsistencyWarning({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      previousExpiry: '2026-04-01',
      newExpiry: '2028-04-01',
    });
    expect(warning).toContain('Texas');
    expect(warning).toContain('12 months');
    expect(warning).toContain('Sure?');
    expect(warning).toContain('We have saved what you entered');
  });

  it('does not warn on a renewal that matches the cycle, or where we hold no cycle', () => {
    expect(
      renewalConsistencyWarning({
        state: 'TX',
        trade: 'hvac',
        kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
        previousExpiry: '2026-04-01',
        newExpiry: '2027-04-01',
      }),
    ).toBeNull();
    expect(
      renewalConsistencyWarning({
        state: 'OH',
        trade: 'hvac',
        kbLicenceTypeId: null,
        previousExpiry: '2026-04-01',
        newExpiry: '2030-04-01',
      }),
    ).toBeNull();
  });

  it('refuses a renewal date in the past — that is a typo, not a renewal', async () => {
    const { licence } = await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
    });
    const renewalId = (
      await db.db.select().from(deadlines).where(eq(deadlines.licenceId, licence.id))
    ).find((row) => row.kind === 'renewal')!.id;
    await expect(
      markRenewed(db.db, { orgId, deadlineId: renewalId, newExpiry: '2026-01-01' }, { today: TODAY }),
    ).rejects.toThrow(/has to be in the future/);
  });
});

// ---------------------------------------------------------------------------
// AC6 — the export carries every citation and every last_verified
// ---------------------------------------------------------------------------

describe('specs/07 AC6 — the print / PDF export', () => {
  it('carries every deadline shown, plus the citation URL and last_verified for each derived rule', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
    });
    await seed({
      state: 'OH',
      trade: 'hvac',
      customTypeName: 'Ohio HVAC contractor',
      expiresOn: '2027-02-01',
      holder: ['Ann', 'Ruiz'],
    });

    const model = await buildBoard(db.db, orgId, TODAY);
    const html = renderToStaticMarkup(createElement(PrintableDeadlineTable, { cards: model.cards }));

    expect((html.match(/data-testid="print-row"/g) ?? [])).toHaveLength(model.cards.length);
    for (const card of model.cards) {
      expect(html).toContain(card.dueOn);
      if (card.source === 'derived') {
        expect(html).toContain(card.citationUrl!);
        expect(html).toContain(`checked ${card.citationLastVerified}`);
      }
    }
    // The entered row says plainly that there is no board page behind it, rather
    // than borrowing one.
    expect(html).toContain('You entered this date; there is no board page behind it');
  });

  it('the CSV fallback carries the same columns, including the provenance', async () => {
    await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
    });
    const model = await buildBoard(db.db, orgId, TODAY);
    const csv = boardCsv(model);
    const [header, ...rows] = csv.split('\n');
    expect(header).toContain('citation_url');
    expect(header).toContain('last_verified');
    expect(rows).toHaveLength(model.cards.length);
    expect(csv).toContain('https://www.tdlr.texas.gov');
    expect(csv).toContain('2026-09-03');
  });
});

// ---------------------------------------------------------------------------
// AC7 — 300 licences, first paint under 800 ms of server time
// ---------------------------------------------------------------------------

describe('specs/07 AC7 — 300 licences in 20 states', () => {
  it('builds the whole board model well inside the 800 ms budget', async () => {
    await setOperatingStates(db.db, {
      orgId,
      rows: [
        { state: 'TX', trade: 'hvac' },
        { state: 'NC', trade: 'plumbing' },
        { state: 'FL', trade: 'electrical' },
      ],
    });

    // 300 licences, written directly: the point of the test is the READ path.
    const technicianId = await technician('Load', 'Test');
    const rows = [];
    for (let i = 0; i < 300; i += 1) {
      const state = ['TX', 'NC', 'FL'][i % 3]!;
      rows.push({
        id: newId('lic'),
        orgId,
        holderKind: 'technician' as const,
        technicianId,
        state,
        trade: ['hvac', 'plumbing', 'electrical'][i % 3]!,
        customTypeName: 'Loaded',
        expiresOn: addDays(TODAY, (i % 400) - 30),
        expirySource: 'entered',
      });
    }
    await db.db.insert(licences).values(rows);
    await db.db.insert(deadlines).values(
      rows.map((row) => ({
        id: newId('dln'),
        orgId,
        licenceId: row.id,
        kind: 'renewal',
        dueOn: row.expiresOn,
        source: 'entered',
      })),
    );

    const started = performance.now();
    const model = await buildBoard(db.db, orgId, TODAY);
    const elapsed = performance.now() - started;

    expect(model.cards).toHaveLength(300);
    expect(model.dashboard.tiles).toHaveLength(51);
    expect(elapsed).toBeLessThan(800);
  });
});

// ---------------------------------------------------------------------------
// The status line's other shapes, and the calendar
// ---------------------------------------------------------------------------

describe('the status line', () => {
  const card = (over: Record<string, unknown> = {}) =>
    ({
      deadline: { id: 'd', rule: 'anniversary' },
      licenceId: 'l',
      state: 'FL',
      stateName: 'Florida',
      trade: 'plumbing',
      typeName: 'Certified Plumbing Contractor (CF)',
      holder: 'Rosa Delgado',
      licenceNumber: null,
      kind: 'ce',
      dueOn: '2026-08-31',
      days: 120,
      status: 'READY',
      source: 'derived',
      citationUrl: null,
      citationLastVerified: null,
      confidence: 'high',
      needsHumanCheck: false,
      notes: [],
      ...over,
    }) as never;

  it('still says something useful when everything is READY', () => {
    const line = buildStatusLine({ licenceCount: 3, lapsed: [], cards: [card()], needsHumanCheck: 0 });
    expect(line).toContain('Nothing due in the next 30 days');
    expect(line).toContain('Florida continuing education');
    expect(line).toContain('2026-08-31');
  });

  it('counts a rule we could not fully verify, and excludes it from the confident claim', () => {
    const line = buildStatusLine({
      licenceCount: 3,
      lapsed: [],
      cards: [card({ needsHumanCheck: true })],
      needsHumanCheck: 1,
    });
    expect(line).toContain('1 rule we could not fully verify');
  });

  it('names the state and the holder when something has lapsed', () => {
    const line = buildStatusLine({
      licenceCount: 1,
      lapsed: [card({ days: -2, status: 'LAPSED', stateName: 'Texas', trade: 'plumbing' })],
      cards: [],
      needsHumanCheck: 0,
    });
    expect(line).toBe('1 licence lapsed 2 days ago — Texas plumbing, Rosa Delgado.');
  });
});

describe('the calendar', () => {
  it('stacks the North Carolina 31 December wall on one square', async () => {
    for (const holder of [
      ['Ann', 'Ruiz'],
      ['Bo', 'Ruiz'],
      ['Cal', 'Ruiz'],
    ] as [string, string][]) {
      await seed({
        state: 'NC',
        trade: 'plumbing',
        kbLicenceTypeId: 'nc.plumbing.plumbing_contractor',
        issuedOn: '2026-03-14',
        holder,
      });
    }
    const model = await buildBoard(db.db, orgId, TODAY);
    const december = buildCalendar(model.cards, '2026-12');
    const wall = december.days.find((day) => day.date === '2026-12-31')!;
    expect(wall.cards.length).toBeGreaterThanOrEqual(3);
    expect(december.days).toHaveLength(31);
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});

describe('the expiring list', () => {
  it('carries the same rows as the grid, as text', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
    });
    const model = await buildBoard(db.db, orgId, TODAY);
    const html = renderToStaticMarkup(createElement(ExpiringList, { cards: model.cards }));
    expect((html.match(/data-testid="expiring-row"/g) ?? [])).toHaveLength(model.cards.length);
    expect(html).toContain('Dave Alvarez');
    for (const card of model.cards) expect(html).toContain(card.dueOn);
  });
});

describe('the materialised summary', () => {
  it('matches a live build after a write', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    await seed({
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      issuedOn: '2026-03-14',
    });
    const refreshed = await refreshDashboardSummary(db.db, orgId, TODAY);
    const live = await buildBoard(db.db, orgId, TODAY);
    expect(refreshed.worstStatus).toBe(live.dashboard.worstStatus);
    expect(refreshed.counts).toEqual(live.dashboard.counts);
  });
});
