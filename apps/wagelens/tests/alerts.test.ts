/**
 * WL-08 · determination-change alerts, end to end on PGlite.
 *
 * The test that matters most in this file is the last one. **Accepting a
 * modification must not change one byte of a certified payroll or a generated
 * document**, so it hashes every `documents.sha256` and every `payroll_lines`
 * row before accepting, accepts, and asserts they are identical afterwards.
 * Silently re-rating a signed WH-347 would be a false certification under
 * 18 U.S.C. § 1001; this assertion is what stands between the product and that.
 *
 * Everything else here is the anti-spam guarantee and V2: one alert per
 * (project, wd, to_modification) — enforced by a unique index and not by
 * application logic — and **no email at all** when nothing the project actually
 * uses has moved.
 */

import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId } from '@octopus/platform';
import { events, jobs, memberships } from '@octopus/platform/db';
import { createJobRegistry, drainJobs, enqueue } from '@octopus/platform/jobs';

import { registerAppJobs } from '../src/lib/jobs/handlers';
import { APP_JOB_KINDS } from '../src/lib/jobs/kinds';
import { registerKbJobs } from '../src/lib/kb/jobs';
import { ingestDetermination } from '../src/lib/kb/ingest';
import { acceptModification, getAlert, listPendingAlerts } from '../src/lib/alerts/service';
import { createProject } from '../src/lib/repositories/projects';
import { setAlertEmails } from '../src/lib/repositories/settings';
import {
  documents,
  kbClassifications,
  kbRateGroups,
  kbWageDeterminations,
  kbWdModifications,
  payrollLines,
  payrolls,
  projects,
  wdChangeAlerts,
  workerClassifications,
  workers,
} from '../src/lib/schema';
import { makeDb, makeEnv, makeSam, makeTestAdapters, seedOrg } from './helpers';
import { plans } from '../src/lib/plans';

let harness: Awaited<ReturnType<typeof makeDb>>;
let db: Awaited<ReturnType<typeof makeDb>>['db'];
let adapters: ReturnType<typeof makeTestAdapters>;
let registry: ReturnType<typeof createJobRegistry>;
let orgId: string;
let userId: string;
let projectId: string;
let wdIdMod0: string;

const WD = 'TX20260253';

/** A synthetic later modification, written straight into the corpus. Two
 *  committed fixtures exist for mod 0 and mod 1 and their rates are identical,
 *  which is the right fixture for V2 and the wrong one for "a rate moved". */
async function seedModification(input: {
  modificationNumber: number;
  rows: Array<{ label: string; base: string; fringe: string }>;
  publicationDate?: string;
}): Promise<string> {
  const wdId = newId('wd');
  await db.insert(kbWageDeterminations).values({
    id: wdId,
    wdNumber: WD,
    modificationNumber: input.modificationNumber,
    stateCode: 'TX',
    constructionTypes: ['Building'],
    publicationDate: input.publicationDate ?? '2026-06-12',
    isActive: true,
    documentText: `synthetic modification ${input.modificationNumber}`,
    documentSha256: createHash('sha256')
      .update(`synthetic-${input.modificationNumber}`)
      .digest('hex'),
    parserVersion: 'test',
    sourceUrl: `https://sam.gov/api/prod/wdol/v1/wd/${WD}/${input.modificationNumber}`,
    publicUrl: `https://sam.gov/wage-determination/${WD}/${input.modificationNumber}`,
    fetchedAt: new Date(),
    lastVerified: new Date(),
  });
  await db.insert(kbWdModifications).values({
    wdNumber: WD,
    modificationNumber: input.modificationNumber,
    publicationDate: input.publicationDate ?? '2026-06-12',
    active: true,
    textHeld: true,
    historySourceUrl: `https://sam.gov/api/prod/wdol/v1/wd/${WD}/history`,
    historyFetchedAt: new Date(),
  });

  const groupId = newId('rg');
  await db.insert(kbRateGroups).values({
    id: groupId,
    wdId,
    identifier: `SUTX2014-${input.modificationNumber}`,
    kind: 'survey',
    effectiveDate: '2025-09-01',
  });

  let lineNo = 1;
  for (const row of input.rows) {
    await db.insert(kbClassifications).values({
      id: newId('cls'),
      wdId,
      rateGroupId: groupId,
      lineNo: lineNo++,
      classificationLabel: row.label,
      searchLabel: row.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim(),
      baseRate: row.base,
      fringeRate: row.fringe,
      wdNumber: WD,
      modificationNumber: input.modificationNumber,
      publicationDate: input.publicationDate ?? '2026-06-12',
      sourceUrl: `https://sam.gov/api/prod/wdol/v1/wd/${WD}/${input.modificationNumber}`,
      lastVerified: new Date(),
    });
  }
  return wdId;
}

async function mapWorker(input: {
  first: string;
  last: string;
  label: string;
  base: string;
  fringe: string;
}): Promise<string> {
  const workerId = newId('wkr');
  await db.insert(workers).values({
    id: workerId,
    orgId,
    firstName: input.first,
    lastName: input.last,
    identifyingNoLast4: '4821',
  });
  await db.insert(workerClassifications).values({
    id: newId('wcl'),
    projectId,
    workerId,
    classificationLabel: input.label,
    baseRate: input.base,
    fringeRate: input.fringe,
    wdNumber: WD,
    wdModificationNumber: 0,
  });
  return workerId;
}

/** A certified payroll with one line and a generated document — the rows the
 *  invariant test hashes. */
async function certifyPayroll(workerId: string): Promise<void> {
  const payrollId = newId('pay');
  await db.insert(payrolls).values({
    id: payrollId,
    projectId,
    filerOrganisationId: orgId,
    payrollNumber: 1,
    weekEndingDate: '2026-06-05',
    status: 'certified',
    wdNumber: WD,
    wdModificationNumber: 0,
    certifiedAt: new Date(),
  });
  await db.insert(payrollLines).values({
    id: newId('pln'),
    payrollId,
    workerId,
    workerEntryNo: 1,
    lastName: 'Rivera',
    firstName: 'Ada',
    identifyingNoLast4: '4821',
    classificationLabel: 'GLAZIER',
    hoursSt: ['0', '8', '8', '8', '8', '8', '0'],
    hoursOt: ['0', '0', '0', '0', '0', '0', '0'],
    totalHoursSt: '40',
    totalHoursOt: '0',
    rateSt: '23.27',
    wdBaseRate: '23.27',
    wdFringeRate: '7.12',
  });
  await db.insert(documents).values({
    id: newId('doc'),
    payrollId,
    kind: 'wh347',
    storageKey: `wh347/${payrollId}.pdf`,
    byteSize: 4096,
    sha256: createHash('sha256').update(payrollId).digest('hex'),
    pageCount: 2,
    wdNumber: WD,
    wdModificationNumber: 0,
    wdPublicationDate: '2026-05-18',
    generatorVersion: 'test-1',
  });
}

async function frozenState(): Promise<string> {
  const [docs, lines] = await Promise.all([
    db.select().from(documents),
    db.select().from(payrollLines),
  ]);
  return createHash('sha256')
    .update(JSON.stringify({ docs, lines }))
    .digest('hex');
}

const drain = () => drainJobs({ db, registry }, { batchSize: 50 });

beforeEach(async () => {
  harness = await makeDb();
  db = harness.db;
  adapters = makeTestAdapters({ baseUrl: 'http://localhost:3000' });
  const sam = makeSam();

  registry = createJobRegistry();
  registerKbJobs(registry, async () => ({ db, sam }));
  // AFTER the corpus's registration: this is what overrides the two seams.
  registerAppJobs(registry, async () => ({
    db,
    adapters,
    env: makeEnv() as never,
    plans,
  }));

  const seeded = await seedOrg(db);
  orgId = seeded.orgId;
  userId = seeded.userId;
  await db.insert(memberships).values({
    id: newId('mem'),
    orgId,
    userId,
    role: 'owner',
  });

  const modZero = await ingestDetermination(db, sam, { wdNumber: WD, revision: 0, isActive: true });
  wdIdMod0 = modZero.wdId;
  const project = await createProject(db, {
    orgId,
    name: 'Fort Cavazos bldg 4200',
    wdId: wdIdMod0,
    wdNumber: WD,
    wdModificationNumber: 0,
    wdPinnedByUserId: userId,
    stateCode: 'TX',
  });
  projectId = project.id;
});

afterEach(async () => {
  await harness.close();
});

describe('one alert per project per modification (V1)', () => {
  it('creates the alert, counts the affected workers and sends exactly one email', async () => {
    await mapWorker({ first: 'Ada', last: 'Rivera', label: 'GLAZIER', base: '23.27', fringe: '7.12' });
    await seedModification({
      modificationNumber: 2,
      rows: [
        { label: 'GLAZIER', base: '24.50', fringe: '7.12' },
        { label: 'BOILERMAKER', base: '33.17', fringe: '24.92' },
      ],
    });

    await enqueue(db, {
      kind: APP_JOB_KINDS.modificationDetected,
      payload: { projectId, wdNumber: WD, fromModification: 0, toModification: 2 },
      dedupeKey: `wd.modification_detected:${projectId}:${WD}:2`,
    });
    await drain(); // builds the alert and enqueues the send
    await drain(); // sends

    const alerts = await db.select().from(wdChangeAlerts);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.affectedWorkerCount).toBe(1);
    expect(alerts[0]?.emailSentAt).toBeInstanceOf(Date);

    expect(adapters.email.sent).toHaveLength(1);
    const message = adapters.email.sent[0] as (typeof adapters.email.sent)[number] & {
      headers?: Record<string, string>;
    };
    expect(message.subject).toContain(WD);
    expect(message.subject).toContain('Fort Cavazos bldg 4200');
    // Both modification numbers, both rates, and the delta.
    expect(message.text).toContain('modification 0 to modification 2');
    expect(message.text).toContain('23.27');
    expect(message.text).toContain('24.50');
    expect(message.text).toContain('+1.23');
    expect(message.text).toContain('Ada Rivera');
    // V6 — an unsubscribe that stops change alerts and nothing else.
    expect(message.text).toContain('/email/unsubscribe?token=');
    expect(message.headers?.['List-Unsubscribe']).toMatch(/^<http/);

    const sent = await db
      .select()
      .from(events)
      .where(eq(events.name, 'wd_alert_email_sent'));
    expect(sent).toHaveLength(1);
  });

  it('a re-run of the ingest job creates no second alert and sends no second email', async () => {
    await mapWorker({ first: 'Ada', last: 'Rivera', label: 'GLAZIER', base: '23.27', fringe: '7.12' });
    await seedModification({ modificationNumber: 2, rows: [{ label: 'GLAZIER', base: '24.50', fringe: '7.12' }] });

    for (const suffix of ['a', 'b']) {
      await enqueue(db, {
        kind: APP_JOB_KINDS.modificationDetected,
        payload: { projectId, wdNumber: WD, fromModification: 0, toModification: 2 },
        dedupeKey: `run-${suffix}`,
      });
      await drain();
      await drain();
    }

    expect(await db.select().from(wdChangeAlerts)).toHaveLength(1);
    expect(adapters.email.sent).toHaveLength(1);
  });

  it('no email when nothing this project uses changed — an in-app notice only (V2)', async () => {
    await mapWorker({ first: 'Ada', last: 'Rivera', label: 'GLAZIER', base: '23.27', fringe: '7.12' });
    await seedModification({
      modificationNumber: 2,
      rows: [
        { label: 'GLAZIER', base: '23.27', fringe: '7.12' },
        { label: 'SIGN ERECTOR', base: '25.00', fringe: '6.00' },
      ],
    });

    await enqueue(db, {
      kind: APP_JOB_KINDS.modificationDetected,
      payload: { projectId, wdNumber: WD, fromModification: 0, toModification: 2 },
    });
    await drain();
    await drain();

    // The alert row exists — the badge is the durable channel — and nothing was
    // emailed about work this contractor does not do.
    const alerts = await db.select().from(wdChangeAlerts);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.emailSentAt).toBeNull();
    expect(adapters.email.sent).toHaveLength(0);
    expect(
      (await db.select().from(jobs)).filter((job) => job.kind === APP_JOB_KINDS.alertEmail),
    ).toHaveLength(0);
  });

  it('honours the change-alert unsubscribe, and only that (V6)', async () => {
    await mapWorker({ first: 'Ada', last: 'Rivera', label: 'GLAZIER', base: '23.27', fringe: '7.12' });
    await seedModification({ modificationNumber: 2, rows: [{ label: 'GLAZIER', base: '24.50', fringe: '7.12' }] });
    await setAlertEmails(db, orgId, false);

    await enqueue(db, {
      kind: APP_JOB_KINDS.modificationDetected,
      payload: { projectId, wdNumber: WD, fromModification: 0, toModification: 2 },
    });
    await drain();
    await drain();

    expect(await db.select().from(wdChangeAlerts)).toHaveLength(1);
    expect(adapters.email.sent).toHaveLength(0);
  });

  it('generates nothing for a project that is not active (V7)', async () => {
    await db.update(projects).set({ status: 'archived' }).where(eq(projects.id, projectId));
    await seedModification({ modificationNumber: 2, rows: [{ label: 'GLAZIER', base: '24.50', fringe: '7.12' }] });
    await enqueue(db, {
      kind: APP_JOB_KINDS.modificationDetected,
      payload: { projectId, wdNumber: WD, fromModification: 0, toModification: 2 },
    });
    await drain();
    expect(await db.select().from(wdChangeAlerts)).toHaveLength(0);
  });
});

describe('modification 3 while the alert for 2 is pending (V8)', () => {
  it('supersedes the pending alert and creates ONE new alert for 0 → 3', async () => {
    await mapWorker({ first: 'Ada', last: 'Rivera', label: 'GLAZIER', base: '23.27', fringe: '7.12' });
    await seedModification({ modificationNumber: 2, rows: [{ label: 'GLAZIER', base: '24.50', fringe: '7.12' }] });
    await enqueue(db, {
      kind: APP_JOB_KINDS.modificationDetected,
      payload: { projectId, wdNumber: WD, fromModification: 0, toModification: 2 },
      dedupeKey: 'to-2',
    });
    await drain();
    await drain();

    await seedModification({ modificationNumber: 3, rows: [{ label: 'GLAZIER', base: '25.00', fringe: '7.12' }] });
    await enqueue(db, {
      kind: APP_JOB_KINDS.modificationDetected,
      payload: { projectId, wdNumber: WD, fromModification: 2, toModification: 3 },
      dedupeKey: 'to-3',
    });
    await drain();
    await drain();

    const alerts = await db.select().from(wdChangeAlerts);
    expect(alerts).toHaveLength(2);
    const superseded = alerts.find((row) => row.toModification === 2);
    const current = alerts.find((row) => row.toModification === 3);
    expect(superseded?.status).toBe('superseded');
    expect(current?.status).toBe('pending');
    // The `from` is the project's own pin, not whatever the ingest superseded.
    expect(current?.fromModification).toBe(0);

    const pending = await listPendingAlerts(db, orgId);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.alert.toModification).toBe(3);
  });
});

describe('accepting a modification (V3, V4 — gate G9)', () => {
  it('re-pins, updates OPEN mappings, and changes NOT ONE BYTE of a certified payroll', async () => {
    const workerId = await mapWorker({
      first: 'Ada',
      last: 'Rivera',
      label: 'GLAZIER',
      base: '23.27',
      fringe: '7.12',
    });
    await certifyPayroll(workerId);
    await seedModification({ modificationNumber: 2, rows: [{ label: 'GLAZIER', base: '24.50', fringe: '7.40' }] });

    await enqueue(db, {
      kind: APP_JOB_KINDS.modificationDetected,
      payload: { projectId, wdNumber: WD, fromModification: 0, toModification: 2 },
    });
    await drain();
    await drain();

    const before = await frozenState();
    const [alert] = await db.select().from(wdChangeAlerts);
    const result = await acceptModification(db, {
      orgId,
      alertId: alert?.id as string,
      userId,
    });
    expect(result.status).toBe('accepted');

    // THE INVARIANT.
    expect(await frozenState()).toBe(before);

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    expect(project?.wdModificationNumber).toBe(2);

    const [mapping] = await db
      .select()
      .from(workerClassifications)
      .where(eq(workerClassifications.projectId, projectId));
    expect(mapping?.baseRate).toBe('24.50');
    expect(mapping?.fringeRate).toBe('7.40');
    expect(mapping?.wdModificationNumber).toBe(2);

    const resolved = await getAlert(db, { orgId, alertId: alert?.id as string });
    expect(resolved?.alert.status).toBe('accepted');
  });

  it('is BLOCKED while a removed classification still has workers mapped to it (V5)', async () => {
    await mapWorker({
      first: 'Cara',
      last: 'Lin',
      label: 'TILE FINISHER',
      base: '20.00',
      fringe: '5.00',
    });
    await seedModification({ modificationNumber: 2, rows: [{ label: 'BOILERMAKER', base: '33.17', fringe: '24.92' }] });

    await enqueue(db, {
      kind: APP_JOB_KINDS.modificationDetected,
      payload: { projectId, wdNumber: WD, fromModification: 0, toModification: 2 },
    });
    await drain();
    await drain();

    const [alert] = await db.select().from(wdChangeAlerts);
    const result = await acceptModification(db, { orgId, alertId: alert?.id as string, userId });
    expect(result.status).toBe('blocked_by_removal');
    if (result.status === 'blocked_by_removal') expect(result.labels).toEqual(['TILE FINISHER']);

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    expect(project?.wdModificationNumber).toBe(0);

    // The email said it too, as a re-mapping decision rather than a rate change.
    expect(adapters.email.sent[0]?.text).toContain('not listed in the new modification');
  });
});

describe('the corpus fans out to the handler that now exists', () => {
  it('ingesting mod 1 over a pinned project produces exactly one alert per project', async () => {
    await mapWorker({ first: 'Ada', last: 'Rivera', label: 'GLAZIER', base: '23.27', fringe: '7.12' });

    // The real path: the corpus detects the newer modification and fans out.
    const { KB_JOB_KINDS } = await import('../src/lib/kb/job-kinds');
    await enqueue(db, {
      kind: KB_JOB_KINDS.fetchDetermination,
      payload: { wdNumber: WD, modificationNumber: 1, trigger: 'index' },
      dedupeKey: `kb.fetch:${WD}:1`,
    });
    await drain(); // ingest + fan-out
    await drain(); // the alert handler
    await drain(); // any send

    const alerts = await db
      .select()
      .from(wdChangeAlerts)
      .where(and(eq(wdChangeAlerts.projectId, projectId), eq(wdChangeAlerts.toModification, 1)));
    expect(alerts).toHaveLength(1);
    // Mod 0 and mod 1 of the committed fixture carry the same rates, so nothing
    // this project uses moved and no email went out (V2) — which is the honest
    // outcome and exactly what the corpus contains.
    expect(adapters.email.sent).toHaveLength(0);
  });
});
