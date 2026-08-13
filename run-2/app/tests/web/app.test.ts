/**
 * THE AUTHENTICATED PRODUCT — J4 to J12, offline and deterministic.
 *
 * Spec: `USER_JOURNEY.md` §4 (the six-field setup and the contract-value band), §5
 * (the CSV import and the remembered map), §6 (the classification ladder and the
 * memory), §7 (the three statuses and the one rule that separates them), §8 (the
 * WD change, the three equal-weight actions and the contract lock), §9 (the Friday
 * board and the pre-run cost disclosure), §10 (two artifacts, two statuses), §11
 * (billing), §12 (export and deletion); `ARCHITECTURE.md` §6.3, §9.5; PLAN §A3.
 *
 * OFFLINE AND DETERMINISTIC. The mirror is a real Postgres (PGlite) loaded by the
 * real ingest from RECORDED SAM responses; the clock is injected everywhere; there
 * is no network, no model and no Stripe. `vitest.setup.ts` makes `fetch` throw, so a
 * regression that put a live call on the filing path fails here rather than in
 * production.
 *
 * The tests exercise the `_lib` layer directly rather than rendering React, because
 * that layer is where every rule in the specification actually lives: the status
 * gate, the ladder, the permission table, the metering exclusion and the refusals.
 * The screens are thin over it, and the two lint suites at the bottom assert the one
 * property a screen can break on its own — that there is no way to reach a human.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { runIngest, SamClient, type CanaryRunner } from '@/corpus';
import type { Db, Tx } from '@/db';
import { withTenant } from '@/db/tenant';
import { rendersSignatureBlock } from '@/engine';
import { CLASSIFICATION_LADDER, wdNumber } from '@/lib/types';
import { newId } from '@/platform/ids';

import { type TestDb } from '../helpers/pglite';
import { createPlatformDb } from '../platform/helpers';
import { fixtureFetcher, healthyRoutes, INDEX_BASE, WDOL_BASE } from '../corpus/fixtures';

import { classificationsOf, corpusState } from '../../src/app/(app)/_lib/mirror';
import {
  createProject,
  currentPin,
  listProjects,
  pinDetermination,
  readProject,
  setBand,
  setContractLock,
  standingOf,
} from '../../src/app/(app)/_lib/projects';
import {
  ingestPayroll,
  rememberedMap,
  unmappedDeductions,
  categoriseDeduction,
  listColumnMaps,
  type PostedWorker,
} from '../../src/app/(app)/_lib/imports';
import { confirmClassification, listMemory, resolveWeek } from '../../src/app/(app)/_lib/resolve';
import {
  ecprChip,
  generateFiling,
  listArtifacts,
  readFiling,
  rebuildFiling,
  releaseFiling,
} from '../../src/app/(app)/_lib/filings';
import { buildBoard } from '../../src/app/(app)/_lib/week';
import { billingView } from '../../src/app/(app)/_lib/billing';
import {
  BAND_OPTIONS,
  BAND_UNKNOWN_HEADLINE,
  REPIN_ACTIONS,
  supersededSentence,
} from '../../src/app/(app)/_lib/copy';

const INGEST_AT = new Date('2026-08-13T06:00:00Z');
const greenCanary: CanaryRunner = () => Promise.resolve({ pass: true, lines: 512, detail: 'green' });

const ACCOUNT = '77777777-7777-4777-8777-777777777777';
const USER = '88888888-8888-4888-8888-888888888888';

let tdb: TestDb;
let db: Db;
/** One hour after promotion: FRESH, so the freshness axis is out of the way except
 *  where a test deliberately moves it. */
let NOW: Date;

beforeAll(async () => {
  tdb = await createPlatformDb();
  db = tdb.db;

  const client = new SamClient({
    indexBase: INDEX_BASE,
    wdolBase: WDOL_BASE,
    fetcher: fixtureFetcher(healthyRoutes()),
    now: () => INGEST_AT,
  });
  await runIngest({ db, client, canary: greenCanary, now: () => INGEST_AT });

  const corpus = await corpusState(db, INGEST_AT);
  if (corpus.verifiedAt === null) throw new Error('fixture: nothing was promoted');
  NOW = new Date(corpus.verifiedAt.getTime() + 3_600_000);

  await tdb.client.query(`INSERT INTO accounts (id, name) VALUES ($1, $2)`, [
    ACCOUNT,
    'Rio Vista Concrete',
  ]);
  await tdb.client.query(`INSERT INTO users (id, email) VALUES ($1, $2)`, [
    USER,
    'dee@riovista.test',
  ]);
  await tdb.client.query(
    `INSERT INTO memberships (account_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [ACCOUNT, USER],
  );
  await tdb.client.query(
    `INSERT INTO billing_account_index (account_id, entitlement_state, state_since, updated_at)
     VALUES ($1, 'none', now(), now()) ON CONFLICT (account_id) DO NOTHING`,
    [ACCOUNT],
  );
});

afterAll(async () => {
  await tdb.close();
});

async function asTenant<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return withTenant(db, { accountId: ACCOUNT as never, userId: USER }, fn);
}

async function makeProject(input: {
  readonly name: string;
  readonly band: 'over_100k' | 'at_or_under_100k' | 'unknown';
  readonly wdNumber?: string | null;
}): Promise<string> {
  const result = await asTenant(async (tx) =>
    createProject(db, tx, {
      accountId: ACCOUNT,
      userId: USER,
      now: NOW,
      name: input.name,
      stateCode: 'VA',
      countyName: 'Gloucester',
      constructionType: 'Highway',
      fundingSource: 'dba_direct',
      contractValueBand: input.band,
      wdNumber: input.wdNumber ?? 'VA20260195',
    }),
  );
  if (!result.ok) throw new Error(`fixture: project refused — ${result.refusal.headline}`);
  return result.value.projectId;
}

function hours(...values: number[]): number[] {
  const seven = [0, 0, 0, 0, 0, 0, 0];
  values.forEach((value, index) => {
    seven[index] = value;
  });
  return seven;
}

/** A crew whose arithmetic reconciles: 40 hours at $35.00 is $1,400.00 on column 7A,
 *  and 7B − deductions = the net that was actually paid. */
function crew(rawTitle: string, deductionCategory: 'STATUTORY' | 'UNMAPPED' = 'STATUTORY'): PostedWorker[] {
  return [
    {
      externalRef: null,
      lastName: 'Alvarado',
      firstName: 'Dee',
      middleInitial: 'R',
      idLast4: '4417',
      status: 'J',
      allWorkGrossCents: 140_000,
      netPaidCents: 119_000,
      lines: [
        {
          rawTitle,
          st: hours(0, 800, 800, 800, 800, 800, 0),
          ot: hours(),
          dt: hours(),
          cashRateMilli: 350_000,
          cashInLieuMilli: 0,
          otRateMilli: null,
          dtRateMilli: null,
          fringeCreditMilli: 0,
        },
      ],
      deductions: [
        { rawLabel: 'Federal withholding', category: deductionCategory, amountCents: 21_000 },
      ],
    },
  ];
}

/**
 * Resolve a week and then CLICK, because every level except L-A blocks until she
 * does — including L-C1, where the determination's own label matched exactly. The
 * exact match may fill the radio; it may not resolve the line.
 */
async function resolveAndClick(input: {
  readonly weekId: string;
  readonly project: Awaited<ReturnType<typeof readProject>>;
  readonly pin: Awaited<ReturnType<typeof currentPin>>;
}): Promise<void> {
  const project = input.project;
  const pin = input.pin;
  if (!project || !pin) throw new Error('fixture');
  const resolution = await asTenant(async (tx) =>
    resolveWeek(db, tx, { accountId: ACCOUNT, weekId: input.weekId, project, pin }),
  );
  for (const entry of resolution.blocked) {
    const first = entry.outcome.picker[0] ?? entry.outcome.candidates[0];
    if (first === undefined) continue;
    await asTenant(async (tx) =>
      confirmClassification(db, tx, {
        accountId: ACCOUNT,
        userId: USER,
        project,
        pin,
        weekId: input.weekId,
        rawTitle: entry.rawTitle,
        chosenOrdinal: first.classification.ordinal,
      }),
    );
  }
}

async function firstClassName(): Promise<string> {
  const rows = await classificationsOf(db, wdNumber('VA20260195'), 2);
  const survey = rows.find((row) => row.identifierKind === 'survey') ?? rows[0];
  if (!survey) throw new Error('fixture: no classifications parsed');
  return survey.className;
}

// ===========================================================================
// J4 — the six-field setup
// ===========================================================================

describe('J4 — the six-field project setup, and the sixth field', () => {
  it('refuses a state-funded project at setup, with a declined conclusion and no project row', async () => {
    const before = await asTenant(async (tx) => (await listProjects(tx)).length);
    const result = await asTenant(async (tx) =>
      createProject(db, tx, {
        accountId: ACCOUNT,
        userId: USER,
        now: NOW,
        name: 'City sidewalk repair',
        stateCode: 'VA',
        countyName: 'Gloucester',
        constructionType: 'Highway',
        fundingSource: 'state_only',
        contractValueBand: 'over_100k',
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.refusal.primitive).toBe('P-D');
    // Refusing an unqualified buyer at setup is A6 in practice, and it happens
    // before anything is written.
    const after = await asTenant(async (tx) => (await listProjects(tx)).length);
    expect(after).toBe(before);
  });

  it('offers exactly three answers to the contract-value question and pre-selects none', () => {
    expect(BAND_OPTIONS.map((option) => option.value)).toEqual([
      'over_100k',
      'at_or_under_100k',
      'unknown',
    ]);
    // `unknown` is a real answer rather than a skip, and the block copy names the
    // rule and the consequence rather than reproaching anyone.
    expect(BAND_UNKNOWN_HEADLINE).toContain('DRAFT — NOT CERTIFIABLE');
    expect(BAND_UNKNOWN_HEADLINE).toContain('40-hour overtime rule');
  });

  it('pins the determination, keeps the pin immutable, and names the CBA groups at setup', async () => {
    const projectId = await makeProject({ name: 'Route 17 markings', band: 'over_100k' });

    const pin = await asTenant(async (tx) => currentPin(tx, projectId));
    expect(pin?.wdNumber).toBe('VA20260195');
    expect(pin?.revision).toBe(2);
    expect(String(pin?.wdPublishedDate)).toBe('2026-08-06');

    // §4.3 — the union-group warning is raised at PIN time, not at generation.
    const again = await asTenant(async (tx) =>
      pinDetermination(db, tx, {
        accountId: ACCOUNT,
        userId: USER,
        projectId,
        wdNumber: 'VA20260195',
        now: NOW,
      }),
    );
    expect(again.unionGroups.some((group) => group.startsWith('ELEC'))).toBe(true);

    // A re-pin is a NEW ROW: the old one is retained forever, which is what makes
    // "what did this project say in August" answerable next year.
    const rows = await asTenant(async (tx) =>
      tx.execute(
        (await import('drizzle-orm')).sql`SELECT count(*)::int AS n FROM wd_pins WHERE project_id = ${projectId}::uuid`,
      ),
    );
    const { rowsOf } = await import('@/db');
    expect(Number(rowsOf<{ n: number }>(rows)[0]?.n ?? 0)).toBe(2);
  });

  it('records the band as a dated assertion and keeps the event trail', async () => {
    const projectId = await makeProject({ name: 'Band trail', band: 'unknown' });
    await asTenant(async (tx) =>
      setBand(tx, {
        accountId: ACCOUNT,
        userId: USER,
        projectId,
        band: 'at_or_under_100k',
        now: NOW,
      }),
    );
    const project = await asTenant(async (tx) => readProject(tx, projectId));
    expect(project?.contractValueBand).toBe('at_or_under_100k');

    const { rowsOf } = await import('@/db');
    const { sql } = await import('drizzle-orm');
    const events = rowsOf<{ from_band: string | null; to_band: string }>(
      await asTenant(async (tx) =>
        tx.execute(sql`SELECT from_band, to_band FROM project_band_events WHERE project_id = ${projectId}::uuid ORDER BY asserted_at`),
      ),
    );
    expect(events.map((event) => event.to_band)).toEqual(['unknown', 'at_or_under_100k']);
  });
});

// ===========================================================================
// J5 / J6 — the import, the ladder, and the memory
// ===========================================================================

describe('J5 — the payroll import', () => {
  it('is idempotent on the file digest and offers the amendment path rather than an error', async () => {
    const projectId = await makeProject({ name: 'Duplicate week', band: 'over_100k' });
    // Read the mirror BEFORE opening the tenant transaction. A mirror read on the
    // pool handle inside an open transaction is a query waiting for a transaction
    // that is waiting for it — the same rule the `_lib` modules keep with `ex`.
    const title = await firstClassName();
    const posted = {
      projectId,
      weekEnding: '2026-08-14',
      workweekStartDay: 0,
      contractValueBand: 'over_100k' as const,
      map: { targets: { lastName: 0 }, deductions: [], header: ['Last', 'First'] },
      sourceSha256: 'a'.repeat(64),
      byteSize: 512,
      workers: crew(title),
    };

    const first = await asTenant(async (tx) =>
      ingestPayroll(tx, { ...posted, accountId: ACCOUNT, userId: USER, now: NOW }),
    );
    expect(first.duplicate).toBe(false);

    const second = await asTenant(async (tx) =>
      ingestPayroll(tx, { ...posted, accountId: ACCOUNT, userId: USER, now: NOW }),
    );
    expect(second.duplicate).toBe(true);
    if (!second.duplicate) throw new Error('unreachable');
    expect(second.importId).toBe(first.duplicate ? '' : first.importId);
  });

  it('remembers the column map and applies it only to a file of the same shape', async () => {
    const remembered = await asTenant(async (tx) =>
      rememberedMap(tx, { projectId: null, header: ['Last', 'First'] }),
    );
    expect(remembered).not.toBeNull();
    expect(remembered?.sameShape).toBe(true);

    const different = await asTenant(async (tx) =>
      rememberedMap(tx, { projectId: null, header: ['Employee', 'Craft', 'Hours'] }),
    );
    // A map from a different export is OFFERED, never applied: silently applying the
    // wrong map is a wrong rate on a signed form.
    expect(different?.sameShape).toBe(false);

    const maps = await asTenant(async (tx) => listColumnMaps(tx));
    expect(maps.length).toBeGreaterThan(0);
  });

  it('blocks the rows carrying a deduction with no 29 CFR 3.5 paragraph, and never sweeps it into Other', async () => {
    const projectId = await makeProject({ name: 'Unmapped deduction', band: 'over_100k' });
    const title = await firstClassName();
    const ingested = await asTenant(async (tx) =>
      ingestPayroll(tx, {
        accountId: ACCOUNT,
        userId: USER,
        now: NOW,
        projectId,
        weekEnding: '2026-08-14',
        workweekStartDay: 0,
        contractValueBand: 'over_100k',
        map: { targets: {}, deductions: [{ columnIndex: 3, rawLabel: 'GARN-2', category: 'UNMAPPED' }], header: ['a'] },
        sourceSha256: 'b'.repeat(64),
        byteSize: 128,
        workers: crew(title, 'UNMAPPED'),
      }),
    );
    if (ingested.duplicate) throw new Error('unreachable');
    expect(ingested.blockedDeductionCount).toBe(1);

    const pending = await asTenant(async (tx) => unmappedDeductions(tx, ingested.weekId));
    expect(pending.map((row) => row.rawLabel)).toEqual(['Federal withholding']);

    await asTenant(async (tx) =>
      categoriseDeduction(tx, {
        weekId: ingested.weekId,
        importId: ingested.importId,
        rawLabel: 'Federal withholding',
        category: 'STATUTORY',
      }),
    );
    const cleared = await asTenant(async (tx) => unmappedDeductions(tx, ingested.weekId));
    expect(cleared).toHaveLength(0);
  });
});

describe('J6 — the ladder, and what may fill a radio', () => {
  it('blocks an unmapped title, offers the determination’s own rows, and pre-selects only at L-C1', async () => {
    const projectId = await makeProject({ name: 'Picker project', band: 'over_100k' });
    const exact = await firstClassName();

    const ingested = await asTenant(async (tx) =>
      ingestPayroll(tx, {
        accountId: ACCOUNT,
        userId: USER,
        now: NOW,
        projectId,
        weekEnding: '2026-08-14',
        workweekStartDay: 0,
        contractValueBand: 'over_100k',
        map: { targets: {}, deductions: [], header: ['a'] },
        sourceSha256: 'c'.repeat(64),
        byteSize: 128,
        workers: [...crew(exact), ...crew('CEM MASON - FINISH').map((worker) => ({ ...worker, lastName: 'Bell' }))],
      }),
    );
    if (ingested.duplicate) throw new Error('unreachable');

    const project = await asTenant(async (tx) => readProject(tx, projectId));
    const pin = await asTenant(async (tx) => currentPin(tx, projectId));
    if (!project || !pin) throw new Error('fixture');

    const resolution = await asTenant(async (tx) =>
      resolveWeek(db, tx, { accountId: ACCOUNT, weekId: ingested.weekId, project, pin }),
    );

    expect(resolution.blocked.length).toBeGreaterThan(0);
    for (const entry of resolution.blocked) {
      // The line is blocked at every level except L-A, and the refusal is P-A.
      expect(CLASSIFICATION_LADDER[entry.outcome.level].lineBlockedUntilChosen).toBe(true);
      expect(entry.outcome.refusal?.primitive).toBe('P-A');
      // Pre-selection is permitted at exactly one level, and the type system agrees.
      if (entry.outcome.preSelected !== null) expect(entry.outcome.level).toBe('L_C1');
      // Nothing on a candidate is a count of other companies' confirmations: the
      // choice type has no field for one.
      for (const choice of entry.outcome.refusal?.primitive === 'P-A' ? entry.outcome.refusal.choices : []) {
        expect(Object.keys(choice)).not.toContain('confirmations');
        expect(choice.verbatimSource.length).toBeGreaterThan(0);
        expect(choice.sourceCitation).toContain('lines');
      }
    }

    // The model is not configured under ADAPTER_MODE=mock, so the ladder lands on
    // the deterministic rungs — the free generator's own path, and the most
    // exercised code in the product.
    for (const entry of resolution.blocked) {
      expect(entry.outcome.modelCalled).toBe(false);
      expect(['L_C1', 'L_C2', 'L_E', 'L_F', 'L_B']).toContain(entry.outcome.level);
    }
  });

  it('remembers the confirmed answer, applies it silently next week, and never asks again', async () => {
    const projectId = await makeProject({ name: 'Memory project', band: 'over_100k' });
    const rows = await classificationsOf(db, wdNumber('VA20260195'), 2);
    const chosen = rows.find((row) => row.identifierKind === 'survey') ?? rows[0];
    if (!chosen) throw new Error('fixture');

    const week1 = await asTenant(async (tx) =>
      ingestPayroll(tx, {
        accountId: ACCOUNT,
        userId: USER,
        now: NOW,
        projectId,
        weekEnding: '2026-08-14',
        workweekStartDay: 0,
        contractValueBand: 'over_100k',
        map: { targets: {}, deductions: [], header: ['a'] },
        sourceSha256: 'd'.repeat(64),
        byteSize: 128,
        workers: crew('CEM MASON - FINISH'),
      }),
    );
    if (week1.duplicate) throw new Error('unreachable');

    const project = await asTenant(async (tx) => readProject(tx, projectId));
    const pin = await asTenant(async (tx) => currentPin(tx, projectId));
    if (!project || !pin) throw new Error('fixture');

    const before = await asTenant(async (tx) =>
      resolveWeek(db, tx, { accountId: ACCOUNT, weekId: week1.weekId, project, pin }),
    );
    expect(before.blocked.map((entry) => entry.rawTitle)).toContain('CEM MASON - FINISH');

    await asTenant(async (tx) =>
      confirmClassification(db, tx, {
        accountId: ACCOUNT,
        userId: USER,
        project,
        pin,
        weekId: week1.weekId,
        rawTitle: 'CEM MASON - FINISH',
        chosenOrdinal: chosen.ordinal,
      }),
    );

    const week2 = await asTenant(async (tx) =>
      ingestPayroll(tx, {
        accountId: ACCOUNT,
        userId: USER,
        now: NOW,
        projectId,
        weekEnding: '2026-08-21',
        workweekStartDay: 0,
        contractValueBand: 'over_100k',
        map: { targets: {}, deductions: [], header: ['a'] },
        sourceSha256: 'e'.repeat(64),
        byteSize: 128,
        workers: crew('CEM MASON - FINISH'),
      }),
    );
    if (week2.duplicate) throw new Error('unreachable');

    const after = await asTenant(async (tx) =>
      resolveWeek(db, tx, { accountId: ACCOUNT, weekId: week2.weekId, project, pin }),
    );
    // L-A, silently, with no picker — which is the product.
    expect(after.blocked).toHaveLength(0);
    expect(after.resolved.map((entry) => entry.outcome.level)).toEqual(['L_A']);

    const memory = await asTenant(async (tx) => listMemory(tx));
    expect(memory.some((entry) => entry.provenance === 'user_confirmed')).toBe(true);
  });
});

// ===========================================================================
// J7 / J10 — the status gate and the two artifacts
// ===========================================================================

describe('J7 — the three statuses, and the one rule that separates them', () => {
  async function generate(band: 'over_100k' | 'unknown', title: string, sha: string) {
    const projectId = await makeProject({ name: `Filing ${sha.slice(0, 4)}`, band });
    const ingested = await asTenant(async (tx) =>
      ingestPayroll(tx, {
        accountId: ACCOUNT,
        userId: USER,
        now: NOW,
        projectId,
        weekEnding: '2026-08-14',
        workweekStartDay: 0,
        contractValueBand: band,
        map: { targets: {}, deductions: [], header: ['a'] },
        sourceSha256: sha,
        byteSize: 128,
        workers: crew(title),
      }),
    );
    if (ingested.duplicate) throw new Error('unreachable');

    const project = await asTenant(async (tx) => readProject(tx, projectId));
    const pin = await asTenant(async (tx) => currentPin(tx, projectId));
    if (!project || !pin) throw new Error('fixture');
    await resolveAndClick({ weekId: ingested.weekId, project, pin });
    const generated = await asTenant(async (tx) =>
      generateFiling(db, tx, { accountId: ACCOUNT, userId: USER, weekId: ingested.weekId, now: NOW }),
    );
    return { projectId, weekId: ingested.weekId, generated };
  }

  it('withholds the signature block when the contract-value band is unknown, and never bills it', async () => {
    const exact = await firstClassName();
    const { generated } = await generate('unknown', exact, '1'.repeat(64));
    if (generated === null) throw new Error('fixture: nothing generated');

    expect(generated.verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
    expect(rendersSignatureBlock(generated.verdict)).toBe(false);
    expect(generated.artifact.signatureBlockWithheld).toBe(true);
    expect(generated.billable).toBe(false);
    if (generated.verdict.status !== 'DRAFT_NOT_CERTIFIABLE') throw new Error('unreachable');
    expect(generated.verdict.blocks).toContain('CWHSSA_COVERAGE_UNDETERMINED');

    // §9.5: a draft never posts a meter event, and the row says so before Stripe is
    // ever consulted.
    const filing = await asTenant(async (tx) => readFiling(tx, generated.filingId));
    expect(filing?.billable).toBe(false);
  });

  it('renders the signature block when every line resolves and the band is answered', async () => {
    const exact = await firstClassName();
    const { generated } = await generate('over_100k', exact, '2'.repeat(64));
    if (generated === null) throw new Error('fixture: nothing generated');

    expect(generated.verdict.status).not.toBe('DRAFT_NOT_CERTIFIABLE');
    expect(rendersSignatureBlock(generated.verdict)).toBe(true);
    expect(generated.billable).toBe(true);
    expect(generated.pdf.byteLength).toBeGreaterThan(1000);
    expect(generated.pdfSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('never lets freshness produce a draft — a stale check moves a sentence, not a status', async () => {
    const exact = await firstClassName();
    const projectId = await makeProject({ name: 'Stale week', band: 'over_100k' });
    const ingested = await asTenant(async (tx) =>
      ingestPayroll(tx, {
        accountId: ACCOUNT,
        userId: USER,
        now: NOW,
        projectId,
        weekEnding: '2026-08-14',
        workweekStartDay: 0,
        contractValueBand: 'over_100k',
        map: { targets: {}, deductions: [], header: ['a'] },
        sourceSha256: '3'.repeat(64),
        byteSize: 128,
        workers: crew(exact),
      }),
    );
    if (ingested.duplicate) throw new Error('unreachable');

    const project = await asTenant(async (tx) => readProject(tx, projectId));
    const pin = await asTenant(async (tx) => currentPin(tx, projectId));
    if (!project || !pin) throw new Error('fixture');
    await asTenant(async (tx) =>
      resolveWeek(db, tx, { accountId: ACCOUNT, weekId: ingested.weekId, project, pin }),
    );

    // Ten days after the last promotion: well past the 72-hour SLA.
    const late = new Date(NOW.getTime() + 10 * 86_400_000);
    const generated = await asTenant(async (tx) =>
      generateFiling(db, tx, { accountId: ACCOUNT, userId: USER, weekId: ingested.weekId, now: late }),
    );
    if (generated === null) throw new Error('fixture');

    expect(generated.freshness.state).toBe('STALE');
    expect(generated.verdict.status).toBe('CERTIFIABLE_DATED');
    expect(rendersSignatureBlock(generated.verdict)).toBe(true);
    expect(generated.billable).toBe(true);
  });

  it('rebuilds a filing byte-identically from its own pin, and records the digest as the identity', async () => {
    const exact = await firstClassName();
    const { generated } = await generate('over_100k', exact, '4'.repeat(64));
    if (generated === null) throw new Error('fixture');

    const rebuilt = await asTenant(async (tx) => rebuildFiling(db, tx, generated.filingId));
    expect(rebuilt?.pdfSha256).toBe(generated.pdfSha256);

    const artifacts = await asTenant(async (tx) => listArtifacts(tx, generated.filingId));
    const pdf = artifacts.find((artifact) => artifact.kind === 'wh347_pdf');
    expect(pdf?.sha256).toBe(generated.pdfSha256);
  });

  it('marks a filing released on download, which is what makes an amendment the only correction', async () => {
    const exact = await firstClassName();
    const { generated } = await generate('over_100k', exact, '5'.repeat(64));
    if (generated === null) throw new Error('fixture');

    await asTenant(async (tx) =>
      releaseFiling(tx, { accountId: ACCOUNT, filingId: generated.filingId, now: NOW }),
    );
    const filing = await asTenant(async (tx) => readFiling(tx, generated.filingId));
    expect(filing?.state).toBe('RELEASED');
    expect(filing?.releasedAt).not.toBeNull();
  });
});

describe('J10 — one filing, two artifacts, two independent statuses', () => {
  it('blocks the California XML while leaving the WH-347 untouched', async () => {
    const projectId = await makeProject({ name: 'California chip', band: 'over_100k' });
    const project = await asTenant(async (tx) => readProject(tx, projectId));
    if (!project) throw new Error('fixture');

    // Not California: the XML is not applicable, and the reason is stated rather
    // than the button being hidden.
    const outside = ecprChip({
      project,
      workersMissingSsn: [],
      workerCount: 3,
      xsdObservedSha256: null,
      xsdObservedAt: null,
    });
    expect(outside.kind).toBe('blocked');
    if (outside.kind !== 'blocked') throw new Error('unreachable');
    expect(outside.detail).toContain('California');

    // In California, missing identifiers block the XML and name both of them.
    const californian = { ...project, stateCode: 'CA', dirProjectId: null, contractorPwcr: null };
    const missing = ecprChip({
      project: californian,
      workersMissingSsn: [],
      workerCount: 3,
      xsdObservedSha256: null,
      xsdObservedAt: null,
    });
    if (missing.kind !== 'blocked') throw new Error('unreachable');
    expect(missing.detail).toContain('PWCR');
    expect(missing.detail).toContain('PWC-100');
    expect(missing.detail).toContain('WH-347 PDF is unaffected');

    // With the identifiers present, workers with no nine-digit number block the XML
    // — the federal form is unaffected, because the two artifacts disagree about
    // the same field and carry separate statuses.
    const noSsn = ecprChip({
      project: { ...californian, dirProjectId: '123456', contractorPwcr: '1000001234' },
      workersMissingSsn: [{ workerRef: 'w1', name: 'Dee Alvarado' }],
      workerCount: 3,
      xsdObservedSha256: null,
      xsdObservedAt: null,
    });
    if (noSsn.kind !== 'blocked') throw new Error('unreachable');
    expect(noSsn.headline).toContain('1 of 3 workers');
    expect(noSsn.detail).toContain('29 CFR 5.5(a)(3)(ii)(B)');
  });

  it('blocks the XML entirely when the pinned DIR schema hash no longer matches', () => {
    const chip = ecprChip({
      project: {
        id: 'x',
        name: 'CA job',
        stateCode: 'CA',
        countyName: 'Fresno',
        constructionType: 'Building',
        fundingSource: 'dba_direct',
        contractValueBand: 'over_100k',
        bandAssertedAt: NOW,
        awardDate: null,
        contractNumber: null,
        primeName: null,
        dirProjectId: '123456',
        contractorPwcr: '1000001234',
        wh347Layout: 'wh347_rev_2025_01',
        workweekStartDay: 0,
        lockedAtAward: null,
        lockAssertedAt: null,
        createdAt: NOW,
      },
      workersMissingSsn: [],
      workerCount: 2,
      xsdObservedSha256: 'f'.repeat(64),
      xsdObservedAt: NOW,
    });
    expect(chip.kind).toBe('blocked');
    if (chip.kind !== 'blocked') throw new Error('unreachable');
    expect(chip.refusal?.primitive).toBe('P-B');
    expect(chip.detail).toContain('WH-347 PDF is unaffected');
  });
});

// ===========================================================================
// J8 — the WD change
// ===========================================================================

describe('J8 — three actions of equal weight, and an assertion she can record', () => {
  it('offers exactly three re-pin actions, in a fixed order, none of them a default', () => {
    expect(REPIN_ACTIONS.map((entry) => entry.action)).toEqual([
      'keep',
      'repin',
      'repin_regenerate',
    ]);
    // There is no `default`, `recommended` or `primary` field on any of them, and
    // there must never be one: a default here would be a legal conclusion rendered
    // in CSS.
    for (const entry of REPIN_ACTIONS) {
      expect(Object.keys(entry).sort()).toEqual(['action', 'consequence', 'label']);
    }
  });

  it('narrows the claim on a superseded pin, and narrows it differently once she records a lock', async () => {
    const open = supersededSentence({
      wdNumber: 'VA20260195',
      pinnedRevision: 2,
      pinnedPublished: '2026-08-06',
      newerRevision: 3,
      newerPublished: '2026-09-01',
      lockRecordedOn: null,
    });
    expect(open).toContain('is not used on this payroll');
    expect(open).toContain('you have kept revision 2 pinned');

    const locked = supersededSentence({
      wdNumber: 'VA20260195',
      pinnedRevision: 2,
      pinnedPublished: '2026-08-06',
      newerRevision: 3,
      newerPublished: '2026-09-01',
      lockRecordedOn: '2026-08-02',
    });
    expect(locked).toContain('You recorded on 2026-08-02');
    // The RATE is identical in both. Only the sentence about currency moves.
    expect(open.startsWith('Rates from VA20260195 revision 2')).toBe(true);
    expect(locked.startsWith('Rates from VA20260195 revision 2')).toBe(true);
  });

  it('records and clears the contract lock, both dated, and concludes nothing either way', async () => {
    const projectId = await makeProject({ name: 'Locked project', band: 'over_100k' });
    await asTenant(async (tx) => setContractLock(tx, { projectId, locked: true, now: NOW }));
    const set = await asTenant(async (tx) => readProject(tx, projectId));
    expect(set?.lockedAtAward).toBe(true);
    expect(set?.lockAssertedAt).not.toBeNull();

    await asTenant(async (tx) => setContractLock(tx, { projectId, locked: null, now: NOW }));
    const cleared = await asTenant(async (tx) => readProject(tx, projectId));
    // `null` is neither yes nor no — the default state, restored in one click.
    expect(cleared?.lockedAtAward).toBeNull();

    const standing = await asTenant(async (tx) => standingOf(db, tx, projectId));
    expect(standing?.standing).toBe('current');
  });
});

// ===========================================================================
// J9 — the Friday board
// ===========================================================================

describe('J9 — the board, and the cost disclosed before the button', () => {
  it('groups every project by what it needs, and never hides one because the corpus is unhappy', async () => {
    const board = await asTenant(async (tx) =>
      buildBoard(db, tx, { accountId: ACCOUNT, weekEnding: '2026-08-14', now: NOW }),
    );
    expect(board.rows.length).toBeGreaterThan(0);
    for (const row of board.rows) {
      expect(['ready', 'decision', 'waiting', 'narrowed']).toContain(row.group);
      expect(row.note.length).toBeGreaterThan(0);
    }
    // A project with no payroll is WAITING, not missing.
    expect(board.rows.some((row) => row.group === 'waiting')).toBe(true);
  });

  it('states what the run will use before the button, from the catalogue rather than from prose', async () => {
    const board = await asTenant(async (tx) =>
      buildBoard(db, tx, { accountId: ACCOUNT, weekEnding: '2026-08-14', now: NOW }),
    );
    expect(board.cost.sentence).toContain(String(board.cost.runnableFilings));
    // No subscription on this account, so nothing can be billed and the sentence
    // says exactly that rather than quoting a price nobody owes.
    expect(board.cost.sentence).toContain('nothing is billed');
  });
});

// ===========================================================================
// J11 / J12 — money, export and deletion
// ===========================================================================

describe('J11 — billing reads the ledger and never invents a figure', () => {
  it('reports drafts separately from billable filings, and keeps export open with no plan', async () => {
    const view = await asTenant(async (tx) => billingView(db, tx, { accountId: ACCOUNT, now: NOW }));
    expect(view.plan).toBeNull();
    expect(view.draftsThisPeriod).toBeGreaterThan(0);
    // Export and archive are capabilities of every money state, including none.
    expect(view.entitlement.canExport).toBe(true);
    expect(view.entitlement.canReadArchive).toBe(true);
    expect(view.refundQuote).toBeNull();
  });
});

describe('J12 — deletion states what survives it', () => {
  it('enumerates retained items as well as destroyed ones', async () => {
    const { deletionPreview } = await import('@/platform/account/deletion');
    const report = deletionPreview();
    expect(report.lines.some((line) => line.disposition === 'retained')).toBe(true);
    expect(report.lines.some((line) => line.disposition === 'erased')).toBe(true);
    expect(report.boundaryStatement).toContain('We will not tell you that deletion is total');
  });
});

// ===========================================================================
// A3 and the corrections register — the lints a screen can break on its own
// ===========================================================================

describe('A3 — there is no escalation path anywhere under (app)', () => {
  const root = join(process.cwd(), 'src', 'app', '(app)');

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
     * `ARCHITECTURE.md` §13 makes it a lint rather than a habit: the build fails if
     * a `mailto:` or a contact-support component appears under the filing route
     * tree. This is that rule for the authenticated product — which is the surface
     * where the temptation is strongest, because these are the screens where
     * something can actually go wrong on a Friday.
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
      /we'?ll get back to you/i,
    ];
    const offences: string[] = [];
    for (const file of sources(root)) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        if (pattern.test(text)) offences.push(`${file} :: ${String(pattern)}`);
      }
    }
    expect(offences).toEqual([]);
  });

  it('reprints no claim the corrections register struck', () => {
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
        if (pattern.test(text)) offences.push(`${file} :: ${String(pattern)}`);
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
      /\bguaranteed\b/i,
    ];
    const offences: string[] = [];
    for (const file of sources(root)) {
      const text = readFileSync(file, 'utf8');
      for (const pattern of gateLocked) {
        if (pattern.test(text)) offences.push(`${file} :: ${String(pattern)}`);
      }
    }
    expect(offences).toEqual([]);
  });

  it('never pre-selects a picker candidate outside L-C1, as a property of the ladder table', () => {
    for (const [level, rule] of Object.entries(CLASSIFICATION_LADDER)) {
      if (rule.preSelected) expect(level).toBe('L_C1');
    }
  });
});

// ===========================================================================
// A sanity check on the fixture itself, so a failure above is never the fixture
// ===========================================================================

it('holds a promoted snapshot and a parsed determination to work against', async () => {
  const corpus = await corpusState(db, NOW);
  expect(corpus.verifiedAt).not.toBeNull();
  expect(corpus.snapshotRef).not.toBeNull();
  const rows = await classificationsOf(db, wdNumber('VA20260195'), 2);
  expect(rows.length).toBeGreaterThan(0);
  expect(newId()).toMatch(/^[0-9a-f-]{36}$/);
});
