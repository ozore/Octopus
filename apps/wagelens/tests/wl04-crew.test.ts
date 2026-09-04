/**
 * WL-04 — the worker roster, the mapping, and the conformance path.
 *
 * **Two rules here are law, not preference, and both are tested as properties
 * of the code rather than of the screen.**
 *
 * 1. *The last four digits, and nothing more.* 29 CFR 5.5(a)(3)(ii)(B). Gate G7
 *    walks the committed migrations and asserts that no column anywhere could
 *    hold a full identifying number, a home address or a date of birth; the
 *    repository refuses one; and the paste parser SKIPS a row containing one,
 *    with the explanation, rather than truncating it — because truncating would
 *    silently accept data we are forbidden to hold.
 * 2. *Nothing is auto-classified, and the conformance path proposes nothing.*
 *    29 CFR 5.5(a)(1)(iii)(B). There is no function in this codebase that picks
 *    a classification or derives a proposed rate.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { conformanceWorksheetLines, renderConformanceWorksheetPdf } from '../src/app/(app)/projects/[id]/conformance/pdf';
import { appMigrationsDir } from '../src/lib/db';
import { searchClassifications } from '../src/lib/kb';
import { ingestCounties, ingestDetermination } from '../src/lib/kb/ingest';
import { addPayrollLine, certifyPayroll, createPayroll } from '../src/lib/repositories/payrolls';
import { createProject, repinDetermination } from '../src/lib/repositories/projects';
import {
  ApprenticeshipDetailsRequiredError,
  ConformanceValidationError,
  DUTIES_MINIMUM_CHARACTERS,
  IdentifyingNumberTooLongError,
  PASTE_SKIP_REASONS,
  addWorker,
  archiveWorker,
  commitWorkerPaste,
  completeConformance,
  createApprenticeshipProgram,
  crewForProject,
  getConformance,
  listWorkers,
  looksLikeFullIdentifyingNumber,
  mapClassification,
  parseWorkerPaste,
  recordConformanceOutcome,
  startConformance,
  unmapClassification,
  validateConformance,
} from '../src/lib/repositories/workers';
import type { PasteCommitRow } from '../src/lib/repositories/workers';
import { payrollLines, workerClassifications, workers } from '../src/lib/schema';
import { harrisIndexRecords, makeDb, makeSam, seedOrg } from './helpers';

let harness: Awaited<ReturnType<typeof makeDb>>;
let db: Awaited<ReturnType<typeof makeDb>>['db'];
let orgId: string;
let userId: string;
let projectId: string;
let wdId: string;

beforeEach(async () => {
  harness = await makeDb();
  db = harness.db;
  const sam = makeSam();
  const seeded = await seedOrg(db);
  orgId = seeded.orgId;
  userId = seeded.userId;
  await ingestCounties(db, sam, 'TX');
  const ingested = await ingestDetermination(db, sam, {
    wdNumber: 'TX20260253',
    revision: 1,
    indexRecord: harrisIndexRecords().find((r) => r.fullReferenceNumber === 'TX20260253') as never,
  });
  wdId = ingested.wdId;
  const project = await createProject(db, {
    orgId,
    name: 'Bldg 4200 roof replacement',
    projectOrContractNo: 'W912XX-26-C-0000',
    locationDescription: 'Fort Cavazos, Bell County, TX',
    ourRole: 'sub',
    wdId,
    wdNumber: 'TX20260253',
    wdModificationNumber: 1,
    wdPinnedByUserId: userId,
    stateCode: 'TX',
  } as never);
  projectId = project.id;
});
afterEach(async () => {
  await harness.close();
});

async function classification(label: string) {
  const { rows } = await searchClassifications(db, wdId, { limit: 1000 });
  const row = rows.find((entry) => entry.classificationLabel.startsWith(label));
  if (!row) throw new Error(`no classification starting with ${label}`);
  return row;
}

describe('gate G7 — the schema cannot hold what the regulation forbids', () => {
  it('finds no ssn, home address or date-of-birth column in ANY committed migration', () => {
    const dir = appMigrationsDir();
    const migrations = readdirSync(dir).filter((file) => file.endsWith('.sql'));
    expect(migrations.length).toBeGreaterThanOrEqual(2);
    const sql = migrations.map((file) => readFileSync(join(dir, file), 'utf8')).join('\n');
    for (const pattern of [
      /\bssn\b/i,
      /social_security/i,
      /"home_address"/i,
      /"street"/i,
      /date_of_birth/i,
      /\bdob\b/i,
    ]) {
      expect(sql, `${pattern} must not appear in any migration`).not.toMatch(pattern);
    }
  });

  it('keeps the conformance worksheet free of any identifier but a foreign key', () => {
    const dir = appMigrationsDir();
    const sql = readdirSync(dir)
      .filter((file) => file.endsWith('.sql'))
      .map((file) => readFileSync(join(dir, file), 'utf8'))
      .join('\n');
    const block = sql.slice(sql.indexOf('CREATE TABLE "conformance_worksheets"'));
    const table = block.slice(0, block.indexOf(');'));
    expect(table).toContain('"worker_id" text');
    expect(table).not.toMatch(/first_name|last_name|identifying/i);
  });
});

describe('the last four digits, and nothing more (V1, V2)', () => {
  it('stores exactly four digits and refuses anything longer, at the repository', async () => {
    const worker = await addWorker(db, {
      orgId,
      firstName: 'Ada',
      lastName: 'Rivera',
      identifyingNoLast4: '6789',
    });
    expect(worker.identifyingNoLast4).toBe('6789');

    await expect(
      addWorker(db, {
        orgId,
        firstName: 'Sam',
        lastName: 'Okafor',
        identifyingNoLast4: '123-45-6789',
      }),
    ).rejects.toBeInstanceOf(IdentifyingNumberTooLongError);

    // Nothing was written for the refused one.
    const roster = await listWorkers(db, orgId);
    expect(roster).toHaveLength(1);
  });

  it('recognises every shape of a full identifying number', () => {
    for (const value of ['123-45-6789', '123456789', '123 45 6789'.replace(/ /g, '')]) {
      expect(looksLikeFullIdentifyingNumber(value), value).toBe(true);
    }
    expect(looksLikeFullIdentifyingNumber('6789')).toBe(false);
  });

  it('refuses a registered apprentice with no programme (V4)', async () => {
    await expect(
      addWorker(db, {
        orgId,
        firstName: 'Ada',
        lastName: 'Rivera',
        identifyingNoLast4: '6789',
        defaultStatus: 'RA',
      }),
    ).rejects.toBeInstanceOf(ApprenticeshipDetailsRequiredError);

    const program = await createApprenticeshipProgram(db, {
      orgId,
      programName: 'Gulf Coast Electrical JATC',
      registrar: 'OA',
    });
    const saved = await addWorker(db, {
      orgId,
      firstName: 'Ada',
      lastName: 'Rivera',
      identifyingNoLast4: '6789',
      defaultStatus: 'RA',
      apprenticeshipProgramId: program.id,
      registeredClassification: 'ELECTRICIAN APPRENTICE',
    });
    expect(saved.apprenticeshipProgramId).toBe(program.id);
    expect(saved.registeredClassification).toBe('ELECTRICIAN APPRENTICE');
  });
});

describe('paste a crew list (V10, V11, V12)', () => {
  const FOURTEEN = [
    'Last name\tFirst name\tMI\tLast 4',
    'Rivera\tAda\tM\t6789',
    'Okafor\tSamuel\t\t4412',
    'Nguyen, "Tran, Jr", , 1122',
    'Delgado   Marisol     C     3390',
    'Brooks\tJordan\t\t7781',
    'Salazar\tHector\tR\t2264',
    'Kim\tJi-woo\t\t9013',
    'Whitfield\tAaron\t\t5540',
    'Osei\tKwame\t\t6602',
    'Ramirez\tLucia\tP\t8834',
    'Petrov\tDmitri\t\t1907',
    'Hayes\tColin\t\t4055',
    'Ferreira\tPaulo\t\t7120',
    'Mistry\tNilesh\t\t', // no last-4
    'Chan\tWei\t\t123-45-6789', // a full identifying number
    '',
  ].join('\n');

  it('parses 12, skips 2, names both reasons, and writes NOTHING', async () => {
    const result = parseWorkerPaste({ text: FOURTEEN });
    expect(result.parsed).toHaveLength(12);
    expect(result.skipped).toHaveLength(2);
    expect(result.skipped.map((row) => row.reason)).toEqual([
      PASTE_SKIP_REASONS.noLast4,
      PASTE_SKIP_REASONS.fullNumber,
    ]);
    expect(result.skipped[1]?.reason).toContain('enter only the last four digits');
    // The skipped row is never truncated to its last four.
    expect(result.parsed.map((row) => row.last4)).not.toContain('6789');

    expect(await listWorkers(db, orgId)).toHaveLength(0);
  });

  it('handles tabs, commas, two-or-more spaces, a quoted comma and a header row', () => {
    const result = parseWorkerPaste({ text: FOURTEEN });
    expect(result.parsed[0]).toMatchObject({ lastName: 'Rivera', firstName: 'Ada', middleInitial: 'M', last4: '6789' });
    expect(result.parsed[1]).toMatchObject({ lastName: 'Okafor', firstName: 'Samuel', last4: '4412' });
    // The comma inside the quoted name stayed inside the name.
    expect(result.parsed[2]).toMatchObject({ lastName: 'Nguyen', firstName: 'Tran, Jr', last4: '1122' });
    expect(result.parsed[3]).toMatchObject({ lastName: 'Delgado', firstName: 'Marisol', middleInitial: 'C', last4: '3390' });
    // The header row became a column order, not a worker.
    expect(result.parsed.map((row) => row.lastName)).not.toContain('Last name');
    // A blank line is neither parsed nor reported.
    expect(result.parsed).toHaveLength(12);
  });

  it('commits 12 in one transaction, all unmapped, none carrying more than four digits', async () => {
    const result = parseWorkerPaste({ text: FOURTEEN });
    const committed = await commitWorkerPaste(db, {
      orgId,
      projectId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
      rows: result.parsed.map((row) => ({
        lastName: row.lastName,
        firstName: row.firstName,
        middleInitial: row.middleInitial,
        last4: row.last4,
      })),
    });
    expect(committed.workers).toHaveLength(12);
    expect(committed.mapped).toBe(0);

    const roster = await listWorkers(db, orgId);
    expect(roster).toHaveLength(12);
    for (const worker of roster) expect(worker.identifyingNoLast4).toHaveLength(4);

    // V12/V5 — they all land on the unmapped banner.
    const crew = await crewForProject(db, { orgId, projectId });
    expect(crew.filter((member) => member.mapping === null)).toHaveLength(12);
  });

  it('a commit that fails halfway leaves no workers behind (V10)', async () => {
    const rows: PasteCommitRow[] = parseWorkerPaste({ text: FOURTEEN }).parsed.map((row) => ({
      lastName: row.lastName,
      firstName: row.firstName,
      middleInitial: row.middleInitial,
      last4: row.last4,
    }));
    // The sixth row references a classification that is not on the pinned
    // determination, so the insert fails inside the transaction.
    rows[5] = {
      ...(rows[5] as PasteCommitRow),
      mapping: {
        kbClassificationId: 'cls_does_not_exist',
        classificationLabel: 'GHOST',
        baseRate: '1.00',
        fringeRate: '0.00',
      },
    };
    await expect(
      commitWorkerPaste(db, {
        orgId,
        projectId,
        wdNumber: 'TX20260253',
        wdModificationNumber: 1,
        rows,
      }),
    ).rejects.toThrow();
    expect(await listWorkers(db, orgId)).toHaveLength(0);
  });

  it('refuses a full identifying number that was edited into the preview', async () => {
    await expect(
      commitWorkerPaste(db, {
        orgId,
        projectId,
        rows: [{ lastName: 'Chan', firstName: 'Wei', last4: '123456789' }],
      }),
    ).rejects.toBeInstanceOf(IdentifyingNumberTooLongError);
    expect(await listWorkers(db, orgId)).toHaveLength(0);
  });
});

describe('mapping copies the label and BOTH rates', () => {
  it('writes 38.50 / 10.71 verbatim with the project’s determination and modification', async () => {
    const electrician = await classification('ELECTRICIAN (EXCLUDES LOW VOLTAGE');
    const worker = await addWorker(db, {
      orgId,
      firstName: 'Ada',
      lastName: 'Rivera',
      identifyingNoLast4: '6789',
    });
    const mapping = await mapClassification(db, {
      projectId,
      workerId: worker.id,
      kbClassificationId: electrician.id,
      classificationLabel: electrician.classificationLabel,
      baseRate: electrician.baseRate,
      fringeRate: electrician.fringeRate,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
      mappedByUserId: userId,
    });
    expect(mapping).toMatchObject({
      classificationLabel: 'ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING AND INSTALLATION OF ALARMS)',
      baseRate: '38.50',
      fringeRate: '10.71',
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
      source: 'wage_determination',
    });
  });

  it('unmapping stamps unmapped_at and never deletes, leaving one open mapping at most', async () => {
    const laborer = await classification('LABORER: COMMON OR GENERAL');
    const worker = await addWorker(db, {
      orgId,
      firstName: 'Sam',
      lastName: 'Okafor',
      identifyingNoLast4: '4412',
    });
    await mapClassification(db, {
      projectId,
      workerId: worker.id,
      kbClassificationId: laborer.id,
      classificationLabel: laborer.classificationLabel,
      baseRate: laborer.baseRate,
      fringeRate: laborer.fringeRate,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
    });
    const closed = await unmapClassification(db, { projectId, workerId: worker.id });
    expect(closed).toBe(1);

    const all = await db
      .select()
      .from(workerClassifications)
      .where(eq(workerClassifications.projectId, projectId));
    expect(all).toHaveLength(1);
    expect(all[0]?.unmappedAt).toBeInstanceOf(Date);

    const crew = await crewForProject(db, { orgId, projectId });
    expect(crew.find((member) => member.worker.id === worker.id)?.mapping).toBeNull();
  });

  it('a re-pin leaves the existing mapping’s rates untouched (the WL-08 handoff)', async () => {
    const sam = makeSam();
    const modZero = await ingestDetermination(db, sam, {
      wdNumber: 'TX20260253',
      revision: 0,
      isActive: false,
    });
    const electrician = await classification('ELECTRICIAN (EXCLUDES LOW VOLTAGE');
    const worker = await addWorker(db, {
      orgId,
      firstName: 'Ada',
      lastName: 'Rivera',
      identifyingNoLast4: '6789',
    });
    await mapClassification(db, {
      projectId,
      workerId: worker.id,
      kbClassificationId: electrician.id,
      classificationLabel: electrician.classificationLabel,
      baseRate: electrician.baseRate,
      fringeRate: electrician.fringeRate,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
    });

    await repinDetermination(db, {
      projectId,
      wdId: modZero.wdId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 0,
      wdPinnedSuperseded: true,
      reason: 'corrected',
    });

    const [mapping] = await db
      .select()
      .from(workerClassifications)
      .where(eq(workerClassifications.projectId, projectId));
    expect(mapping).toMatchObject({
      baseRate: '38.50',
      fringeRate: '10.71',
      wdModificationNumber: 1,
    });
  });

  it('archives a worker who is on a certified payroll, and the payroll still names them', async () => {
    const laborer = await classification('LABORER: COMMON OR GENERAL');
    const worker = await addWorker(db, {
      orgId,
      firstName: 'Sam',
      lastName: 'Okafor',
      identifyingNoLast4: '4412',
    });
    const payroll = await createPayroll(db, {
      projectId,
      filerOrganisationId: orgId,
      weekEndingDate: '2026-06-05',
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
    });
    await addPayrollLine(db, {
      payrollId: payroll.id,
      workerId: worker.id,
      workerEntryNo: 1,
      lastName: worker.lastName,
      firstName: worker.firstName,
      identifyingNoLast4: worker.identifyingNoLast4,
      classificationLabel: laborer.classificationLabel,
      rateSt: laborer.baseRate,
    });
    await certifyPayroll(db, { payrollId: payroll.id, certifiedByUserId: userId });

    await archiveWorker(db, orgId, worker.id);
    expect(await listWorkers(db, orgId)).toHaveLength(0);

    const [row] = await db.select().from(workers).where(eq(workers.id, worker.id));
    expect(row?.archivedAt).toBeInstanceOf(Date);
    const [line] = await db.select().from(payrollLines).where(eq(payrollLines.payrollId, payroll.id));
    expect(line).toMatchObject({ lastName: 'Okafor', firstName: 'Sam', identifyingNoLast4: '4412' });
  });
});

describe('the conformance path never proposes a classification or a rate', () => {
  it('is unreachable until a worksheet exists, and only screen 2 creates one', async () => {
    expect(await getConformance(db, { projectId, id: 'cfm_never_started' })).toBeUndefined();
    const worksheet = await startConformance(db, {
      projectId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
      searchesBefore: 3,
      createdByUserId: userId,
    });
    expect(worksheet.status).toBe('draft');
    expect(worksheet.searchesBefore).toBe(3);
    expect(await getConformance(db, { projectId, id: worksheet.id })).toBeDefined();
  });

  it('blocks a 60-character duties description with the 120-character reason (V6)', async () => {
    const worksheet = await startConformance(db, {
      projectId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
    });
    const electrician = await classification('ELECTRICIAN (EXCLUDES LOW VOLTAGE');
    const laborer = await classification('LABORER: COMMON OR GENERAL');
    const compared = [electrician, laborer].map((row) => ({
      kbClassificationId: row.id,
      label: row.classificationLabel,
      baseRate: row.baseRate,
      fringeRate: row.fringeRate,
    }));

    const short = 'Runs conduit and pulls low voltage cable on the north side.';
    expect(short.length).toBeLessThan(DUTIES_MINIMUM_CHARACTERS);
    await expect(
      completeConformance(db, {
        id: worksheet.id,
        projectId,
        dutiesDescription: short,
        proposedClassification: 'LOW VOLTAGE SYSTEMS TECHNICIAN',
        proposedBaseRate: '26.00',
        proposedFringeRate: '5.00',
        comparedClassifications: compared,
      }),
    ).rejects.toBeInstanceOf(ConformanceValidationError);

    const still = await getConformance(db, { projectId, id: worksheet.id });
    expect(still?.status).toBe('draft');
  });

  it('requires a positive base rate and at least two compared classifications (V7, V8)', async () => {
    const problems = validateConformance({
      dutiesDescription: 'x'.repeat(200),
      proposedClassification: 'LOW VOLTAGE SYSTEMS TECHNICIAN',
      proposedBaseRate: '0',
      proposedFringeRate: '-1',
      comparedClassifications: [{}],
    });
    expect(problems.join(' ')).toContain('greater than zero');
    expect(problems.join(' ')).toContain('cannot be negative');
    expect(problems.join(' ')).toContain('at least two listed classifications');
    expect(validateConformance({
      dutiesDescription: 'x'.repeat(200),
      proposedClassification: 'LOW VOLTAGE SYSTEMS TECHNICIAN',
      proposedBaseRate: '26.00',
      proposedFringeRate: '0',
      comparedClassifications: [{}, {}],
    })).toEqual([]);
  });

  it('completes when the request is substantive, and hands off rather than files', async () => {
    const worksheet = await startConformance(db, {
      projectId,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
    });
    const electrician = await classification('ELECTRICIAN (EXCLUDES LOW VOLTAGE');
    const lowVoltage = await classification('ELECTRICIAN (LOW VOLTAGE WIRING ONLY)');
    const compared = [electrician, lowVoltage].map((row) => ({
      kbClassificationId: row.id,
      label: row.classificationLabel,
      baseRate: row.baseRate,
      fringeRate: row.fringeRate,
    }));

    const completed = await completeConformance(db, {
      id: worksheet.id,
      projectId,
      dutiesDescription:
        'Installs, terminates and tests fibre and category-6 cabling for the building access-control and CCTV systems, including pathway rough-in, cable tray, patch panels and device programming. Does not perform line-voltage work.',
      proposedClassification: 'LOW VOLTAGE SYSTEMS TECHNICIAN',
      proposedBaseRate: '26.00',
      proposedFringeRate: '5.00',
      comparedClassifications: compared,
    });
    expect(completed.status).toBe('handed_off');
    expect(completed.handedOffAt).toBeInstanceOf(Date);
  });

  it('an approved outcome flips the mapping’s source and rewrites no filed payroll', async () => {
    const laborer = await classification('LABORER: COMMON OR GENERAL');
    const worker = await addWorker(db, {
      orgId,
      firstName: 'Ada',
      lastName: 'Rivera',
      identifyingNoLast4: '6789',
    });
    await mapClassification(db, {
      projectId,
      workerId: worker.id,
      kbClassificationId: laborer.id,
      classificationLabel: laborer.classificationLabel,
      baseRate: laborer.baseRate,
      fringeRate: laborer.fringeRate,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
    });
    const worksheet = await startConformance(db, {
      projectId,
      workerId: worker.id,
      wdNumber: 'TX20260253',
      wdModificationNumber: 1,
    });

    const { daysElapsed } = await recordConformanceOutcome(db, {
      id: worksheet.id,
      projectId,
      status: 'approved',
      note: 'Approved as proposed.',
    });
    expect(daysElapsed).toBeGreaterThanOrEqual(0);

    const [mapping] = await db
      .select()
      .from(workerClassifications)
      .where(eq(workerClassifications.projectId, projectId));
    expect(mapping?.source).toBe('conformance_approved');
    // The rates the mapping was made with are untouched.
    expect(mapping).toMatchObject({ baseRate: '11.76', fringeRate: '0.00' });
  });
});

describe('the worksheet PDF (V9)', () => {
  const input = {
    productName: 'Test Product',
    projectName: 'Bldg 4200 roof replacement',
    projectOrContractNo: 'W912XX-26-C-0000',
    locationDescription: 'Fort Cavazos, Bell County, TX',
    workerName: 'Ada Rivera',
    wdNumber: 'TX20260253',
    wdModificationNumber: 1,
    dutiesDescription:
      'Installs, terminates and tests fibre and category-6 cabling for the building access-control and CCTV systems.',
    proposedClassification: 'LOW VOLTAGE SYSTEMS TECHNICIAN',
    proposedBaseRate: '26.00',
    proposedFringeRate: '5.00',
    comparedClassifications: [
      { label: 'ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING…)', baseRate: '38.50', fringeRate: '10.71' },
      { label: 'ELECTRICIAN (LOW VOLTAGE WIRING ONLY)', baseRate: '18.00', fringeRate: '1.68' },
    ],
    generatedAt: new Date('2026-09-04T09:00:00Z'),
  };

  it('says on its face that it is NOT Standard Form SF-1444 and names who files it', () => {
    const text = conformanceWorksheetLines(input)
      .map((line) => line.text)
      .join('\n');
    expect(text).toContain('not Standard Form SF-1444');
    expect(text).toContain('DBAConformance@dol.gov');
    expect(text).toContain('30 days');
    expect(text).toContain('29 CFR 5.5(a)(1)(iii)(B)');
    expect(text).toContain('reasonable relationship');
  });

  it('carries the duties, the proposal, the comparison set and the pinned determination', () => {
    const bytes = renderConformanceWorksheetPdf(input);
    const pdf = Buffer.from(bytes).toString('latin1');
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('%%EOF');
    for (const needle of [
      'SF-1444',
      'DBAConformance@dol.gov',
      'TX20260253',
      'modification 1',
      'LOW VOLTAGE SYSTEMS TECHNICIAN',
      '$26.00',
      '$5.00',
      '$38.50',
      '$10.71',
      'category-6 cabling',
      'Ada Rivera',
    ]) {
      expect(pdf, needle).toContain(needle);
    }
  });

  it('is a structurally valid single document with an xref that points at its objects', () => {
    const pdf = Buffer.from(renderConformanceWorksheetPdf(input)).toString('latin1');
    const startxref = Number(/startxref\s+(\d+)/.exec(pdf)?.[1]);
    expect(Number.isFinite(startxref)).toBe(true);
    expect(pdf.slice(startxref, startxref + 4)).toBe('xref');
    const offsets = [...pdf.matchAll(/^(\d{10}) 00000 n $/gm)].map((match) => Number(match[1]));
    expect(offsets.length).toBeGreaterThanOrEqual(6);
    for (const offset of offsets) expect(pdf.slice(offset)).toMatch(/^\d+ 0 obj/);
  });
});
