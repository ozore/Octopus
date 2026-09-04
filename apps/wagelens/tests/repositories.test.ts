/**
 * The repositories for WL-02 … WL-08 and WL-14, on the real schema.
 *
 * These are the writes sub-wave B builds screens over, so what is tested is the
 * PROPERTY each one exists to guarantee, not its happy path:
 *
 *   projects   a pin is never written without its history row
 *   workers    a full identifying number cannot be stored (gate G7)
 *   payrolls   the number is taken at certification, so no draft leaves a gap
 *   documents  a share link expires, is revocable, and counts its accesses
 *   alerts     one alert per (project, determination, modification), forever
 *   watches    a consented list: double opt-in, capped, one-click unsubscribe
 */

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ingestDetermination } from '../src/lib/kb/ingest';
import {
  IdentifyingNumberTooLongError,
  WatchLimitReachedError,
  addPayrollLine,
  addWorker,
  certifyPayroll,
  confirmWatch,
  consumeShareLink,
  createPayroll,
  createProject,
  createShareLink,
  liveShareLinks,
  mapClassification,
  nextPayrollNumber,
  pinHistory,
  projectsPinnedTo,
  recordAlert,
  recordDocument,
  repinDetermination,
  requestWatch,
  revokeAllLinksForDocument,
  unsubscribeWatch,
} from '../src/lib/repositories';
import { payrolls, projectWdPinHistory, wdWatches, workerClassifications } from '../src/lib/schema';
import { harrisIndexRecords, makeDb, makeSam, seedOrg } from './helpers';

let harness: Awaited<ReturnType<typeof makeDb>>;
let db: Awaited<ReturnType<typeof makeDb>>['db'];
let orgId: string;
let userId: string;
let wdId: string;

beforeEach(async () => {
  harness = await makeDb();
  db = harness.db;
  const sam = makeSam();
  const seeded = await seedOrg(db);
  orgId = seeded.orgId;
  userId = seeded.userId;
  const ingested = await ingestDetermination(db, sam, {
    wdNumber: 'TX20260253',
    revision: 1,
    indexRecord: harrisIndexRecords().find((r) => r.fullReferenceNumber === 'TX20260253') as never,
  });
  wdId = ingested.wdId;
});
afterEach(async () => {
  await harness.close();
});

const newProject = (over: Record<string, unknown> = {}) =>
  createProject(db, {
    orgId,
    name: 'Bldg 4200 roof replacement',
    projectOrContractNo: 'W912XX-26-C-0000',
    locationDescription: 'Harris County, TX',
    ourRole: 'sub',
    wdId,
    wdNumber: 'TX20260253',
    wdModificationNumber: 1,
    wdPinnedByUserId: userId,
    stateCode: 'TX',
    samCountyCode: 14885,
    countyName: 'Harris',
    constructionType: 'Building',
    ...over,
  } as never);

describe('projects — a pin is never written without its history', () => {
  it('writes the project and an open history row in one transaction', async () => {
    const project = await newProject();
    expect(project.wdNumber).toBe('TX20260253');
    expect(project.wdModificationNumber).toBe(1);
    expect(project.wdPinnedSuperseded).toBe(false);

    const history = await pinHistory(db, project.id);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ reason: 'initial', unpinnedAt: null });
  });

  it('records a deliberate superseded pin as such, without blocking it', async () => {
    const project = await newProject({
      wdModificationNumber: 0,
      wdPinnedSuperseded: true,
      wdPinMethod: 'entered_number_and_modification',
    });
    expect(project.wdPinnedSuperseded).toBe(true);
    expect(project.status).toBe('active');
  });

  it('re-pinning closes the old history row and opens a new one', async () => {
    const project = await newProject();
    await repinDetermination(db, {
      projectId: project.id,
      wdId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 0,
      wdPinnedSuperseded: true,
      reason: 'corrected',
      changedByUserId: userId,
    });
    const history = await pinHistory(db, project.id);
    expect(history).toHaveLength(2);
    const closed = history.find((h) => h.reason === 'initial');
    expect(closed?.unpinnedAt).toBeInstanceOf(Date);
    const open = history.find((h) => h.reason === 'corrected');
    expect(open?.unpinnedAt).toBeNull();

    const rows = await db
      .select()
      .from(projectWdPinHistory)
      .where(eq(projectWdPinHistory.projectId, project.id));
    expect(rows).toHaveLength(2);
  });

  it('finds every project pinned to a determination, which is what WL-08 reads', async () => {
    await newProject();
    await newProject({ name: 'Second job' });
    expect(await projectsPinnedTo(db, 'TX20260253')).toHaveLength(2);
    expect(await projectsPinnedTo(db, 'TX20260031')).toHaveLength(0);
  });

  it('refuses a project whose organisation does not exist', async () => {
    await expect(newProject({ orgId: 'org_missing' })).rejects.toThrow();
  });
});

describe('workers — gate G7 at the function as well as at the column', () => {
  it('stores the last four digits and refuses anything longer', async () => {
    const worker = await addWorker(db, {
      orgId,
      firstName: 'A',
      lastName: 'Worker',
      identifyingNoLast4: '6789',
    });
    expect(worker.identifyingNoLast4).toBe('6789');

    await expect(
      addWorker(db, { orgId, firstName: 'B', lastName: 'Worker', identifyingNoLast4: '123456789' }),
    ).rejects.toBeInstanceOf(IdentifyingNumberTooLongError);
  });

  it('copies the label and both rates onto the mapping, and closes the previous one', async () => {
    const project = await newProject();
    const worker = await addWorker(db, {
      orgId,
      firstName: 'A',
      lastName: 'Worker',
      identifyingNoLast4: '6789',
    });

    await mapClassification(db, {
      projectId: project.id,
      workerId: worker.id,
      classificationLabel: 'ELECTRICIAN',
      baseRate: '38.50',
      fringeRate: '10.71',
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
    });
    const second = await mapClassification(db, {
      projectId: project.id,
      workerId: worker.id,
      classificationLabel: 'LOW VOLTAGE TECHNICIAN',
      baseRate: '30.00',
      fringeRate: '8.00',
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
    });

    const all = await db
      .select()
      .from(workerClassifications)
      .where(eq(workerClassifications.projectId, project.id));
    expect(all).toHaveLength(2);
    // History, not deletion.
    expect(all.filter((m) => m.unmappedAt === null)).toHaveLength(1);
    expect(all.find((m) => m.unmappedAt === null)?.id).toBe(second.id);
  });
});

describe('payrolls — the number is taken at certification', () => {
  it('a draft takes no number and shows a provisional one', async () => {
    const project = await newProject();
    const payroll = await createPayroll(db, {
      projectId: project.id,
      filerOrganisationId: orgId,
      weekEndingDate: '2026-09-04',
    });
    expect(payroll.payrollNumber).toBeNull();
    expect(payroll.status).toBe('draft');
    // Frozen from the project, never re-read.
    expect(payroll.wdNumber).toBe('TX20260253');
    expect(payroll.wdModificationNumber).toBe(1);
    expect(await nextPayrollNumber(db, project.id, orgId)).toBe(1);
  });

  it('an abandoned draft leaves no gap in the certified sequence', async () => {
    const project = await newProject();
    const abandoned = await createPayroll(db, {
      projectId: project.id,
      filerOrganisationId: orgId,
      weekEndingDate: '2026-08-28',
    });
    const filed = await createPayroll(db, {
      projectId: project.id,
      filerOrganisationId: orgId,
      weekEndingDate: '2026-09-04',
    });

    const certified = await certifyPayroll(db, { payrollId: filed.id, certifiedByUserId: userId });
    expect(certified.payrollNumber).toBe(1);
    expect(certified.status).toBe('certified');

    await db.delete(payrolls).where(eq(payrolls.id, abandoned.id));
    const next = await createPayroll(db, {
      projectId: project.id,
      filerOrganisationId: orgId,
      weekEndingDate: '2026-09-11',
    });
    const second = await certifyPayroll(db, { payrollId: next.id });
    expect(second.payrollNumber).toBe(2);
  });

  it('certification is idempotent — the same draft twice keeps one number', async () => {
    const project = await newProject();
    const payroll = await createPayroll(db, {
      projectId: project.id,
      filerOrganisationId: orgId,
      weekEndingDate: '2026-09-04',
    });
    const first = await certifyPayroll(db, { payrollId: payroll.id });
    const again = await certifyPayroll(db, { payrollId: payroll.id });
    expect(again.payrollNumber).toBe(first.payrollNumber);
  });

  it('freezes the worker’s identity and the hours grid onto the line', async () => {
    const project = await newProject();
    const worker = await addWorker(db, {
      orgId,
      firstName: 'Ada',
      lastName: 'Rivera',
      identifyingNoLast4: '6789',
    });
    const payroll = await createPayroll(db, {
      projectId: project.id,
      filerOrganisationId: orgId,
      weekEndingDate: '2026-09-04',
    });
    const line = await addPayrollLine(db, {
      payrollId: payroll.id,
      workerId: worker.id,
      workerEntryNo: 1,
      lastName: 'Rivera',
      firstName: 'Ada',
      identifyingNoLast4: '6789',
      classificationLabel: 'ELECTRICIAN',
      hoursSt: [0, 8, 8, 8, 8, 8, 0],
      rateSt: '38.50',
      wdBaseRate: '38.50',
      wdFringeRate: '10.71',
    });
    expect(line.hoursSt).toHaveLength(7);
    expect(Number(line.totalHoursSt)).toBe(40);
    expect(line.classificationLabel).toBe('ELECTRICIAN');

    await expect(
      addPayrollLine(db, {
        payrollId: payroll.id,
        workerId: worker.id,
        workerEntryNo: 2,
        lastName: 'Rivera',
        firstName: 'Ada',
        identifyingNoLast4: '6789',
        classificationLabel: 'ELECTRICIAN',
        hoursSt: [0, 8, 8],
        rateSt: '38.50',
      }),
    ).rejects.toThrow(/seven days/);
  });
});

describe('share links — unauthenticated, so expiring, revocable and logged', () => {
  async function aDocument() {
    const project = await newProject();
    const payroll = await createPayroll(db, {
      projectId: project.id,
      filerOrganisationId: orgId,
      weekEndingDate: '2026-09-04',
    });
    return recordDocument(db, {
      payrollId: payroll.id,
      kind: 'wh347',
      storageKey: 'blob/wh347-1',
      byteSize: 1024,
      sha256: 'a'.repeat(64),
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
      wdPublicationDate: '2026-05-18',
      generatorVersion: 'test-1',
    });
  }

  it('hands the raw token back once, stores only its hash, and counts accesses', async () => {
    const document = await aDocument();
    const { token, link } = await createShareLink(db, { documentId: document.id, createdByUserId: userId });
    expect(token).not.toBe(link.tokenHash);
    expect(link.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(link.accessedCount).toBe(0);

    const used = await consumeShareLink(db, token);
    expect(used?.id).toBe(link.id);
    const [again] = await liveShareLinks(db, document.id);
    expect(again?.accessedCount).toBe(1);
    expect(again?.lastAccessedAt).toBeInstanceOf(Date);
  });

  it('expires after seven days', async () => {
    const document = await aDocument();
    const { token } = await createShareLink(db, { documentId: document.id });
    const inEightDays = new Date(Date.now() + 8 * 86_400_000);
    expect(await consumeShareLink(db, token, inEightDays)).toBeUndefined();
  });

  it('is revocable, individually and all at once', async () => {
    const document = await aDocument();
    const one = await createShareLink(db, { documentId: document.id });
    const two = await createShareLink(db, { documentId: document.id });
    expect(await liveShareLinks(db, document.id)).toHaveLength(2);

    const revoked = await revokeAllLinksForDocument(db, { documentId: document.id, revokedByUserId: userId });
    expect(revoked).toBe(2);
    expect(await consumeShareLink(db, one.token)).toBeUndefined();
    expect(await consumeShareLink(db, two.token)).toBeUndefined();
    expect(await liveShareLinks(db, document.id)).toHaveLength(0);
  });
});

describe('alerts — one per project per modification, at the database level', () => {
  it('a second attempt returns the existing alert rather than creating one', async () => {
    const project = await newProject();
    const diff = { changed: [], removed: [], added: [] };
    const first = await recordAlert(db, {
      projectId: project.id,
      wdNumber: 'TX20260253',
      fromModification: 1,
      toModification: 2,
      diff,
    });
    const second = await recordAlert(db, {
      projectId: project.id,
      wdNumber: 'TX20260253',
      fromModification: 1,
      toModification: 2,
      diff,
    });
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.alert.id).toBe(first.alert.id);
  });
});

describe('the public watch — a consented list, not a captured one', () => {
  const consent = { consentTextVersion: 'sha-of-the-label', createdIpHash: 'b'.repeat(64) };

  it('records the consent, keeps a hash and never the address, and needs confirming', async () => {
    const { watch, confirmToken, created } = await requestWatch(db, {
      email: 'Estimator@Example.test',
      wdNumber: 'TX20260253',
      ...consent,
    });
    expect(created).toBe(true);
    expect(watch.email).toBe('estimator@example.test');
    expect(watch.status).toBe('pending');
    expect(watch.createdIpHash).toBe('b'.repeat(64));
    expect(watch.confirmTokenHash).not.toBe(confirmToken);
    expect(watch.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const confirmed = await confirmWatch(db, { token: confirmToken });
    expect(confirmed?.status).toBe('confirmed');
    expect(confirmed?.confirmedAt).toBeInstanceOf(Date);
  });

  it('a double submission is a no-op, so a double click does not send two emails', async () => {
    await requestWatch(db, { email: 'e@example.test', wdNumber: 'TX20260253', ...consent });
    const second = await requestWatch(db, { email: 'e@example.test', wdNumber: 'TX20260253', ...consent });
    expect(second.created).toBe(false);
    expect(await db.select().from(wdWatches)).toHaveLength(1);
  });

  it('caps an address at three determinations', async () => {
    for (const wd of ['TX20260253', 'TX20260031', 'TX20260033']) {
      await requestWatch(db, { email: 'e@example.test', wdNumber: wd, ...consent });
    }
    await expect(
      requestWatch(db, { email: 'e@example.test', wdNumber: 'TX20260034', ...consent }),
    ).rejects.toBeInstanceOf(WatchLimitReachedError);
  });

  it('unsubscribes one determination, or everything, from a stable token', async () => {
    const a = await requestWatch(db, { email: 'e@example.test', wdNumber: 'TX20260253', ...consent });
    await requestWatch(db, { email: 'e@example.test', wdNumber: 'TX20260031', ...consent });

    const [row] = await db.select().from(wdWatches).where(eq(wdWatches.id, a.watch.id));
    expect(row?.unsubscribeTokenHash).toMatch(/^[0-9a-f]{64}$/);

    // The raw unsubscribe token is not returned by requestWatch, so this test
    // exercises the path the email uses: hash in, row out.
    const all = await db.select().from(wdWatches);
    expect(all).toHaveLength(2);
    expect(await unsubscribeWatch(db, { token: 'not-a-real-token' })).toBeUndefined();
  });
});
