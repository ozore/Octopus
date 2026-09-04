/**
 * The committed payroll the golden-file tests render (WL-06 test plan).
 *
 * It is a LITERAL, not a query: the generator takes a value, so the layout
 * tests need no database, no clock and no corpus, and a layout change that
 * alters the output shows up as a deliberate, reviewable diff rather than as a
 * flaky byte count.
 *
 * The numbers are the ones the fleet's documents use throughout — TX20260253
 * modification 1, `ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING)` at $38.50 base
 * and $10.71 fringe — so a figure in a test can be checked against
 * `tests/fixtures/parsed-TX20260253-rev1.json` rather than against itself.
 */

import type { Wh347Model, Wh347Row } from '../../src/lib/documents/model';

export function fixtureRow(entryNo: number, over: Partial<Wh347Row> = {}): Wh347Row {
  return {
    entryNo,
    lastName: 'Reyes',
    firstName: 'Joaquin',
    middleInitial: 'A',
    identifyingNoLast4: '4821',
    workerStatus: 'J',
    classificationLabel: 'ELECTRICIAN (EXCLUDES LOW VOLTAGE WIRING)',
    hoursSt: ['0', '8', '8', '8', '8', '8', '0'],
    hoursOt: ['0', '0', '0', '2', '0', '0', '0'],
    totalHoursSt: '40.00',
    totalHoursOt: '2.00',
    rateSt: '38.50',
    rateOt: '57.75',
    fringeCreditHourly: '10.71',
    paymentInLieuHourly: '0.40',
    grossProject: '1655.50',
    grossAllWork: '1655.50',
    dedTaxWithholdings: '210.00',
    dedFica: '126.65',
    dedOther: '45.00',
    dedOtherNote: 'Union dues',
    dedTotal: '381.65',
    netPay: '1273.85',
    fringeCredits: [
      {
        planName: 'IBEW Health and Welfare',
        planType: 'health',
        planNo: 'H-716',
        isFunded: true,
        hourlyCredit: '7.21',
      },
      {
        planName: 'IBEW Pension',
        planType: 'pension',
        planNo: 'P-716',
        isFunded: true,
        hourlyCredit: '3.50',
      },
    ],
    ...over,
  };
}

export function fixtureModel(over: Partial<Wh347Model> = {}): Wh347Model {
  return {
    header: {
      isFinal: false,
      ourRole: 'sub',
      projectName: 'Bldg 4200 roof replacement',
      projectOrContractNo: 'W912-26-C-0041',
      payrollNumber: 8,
      businessName: 'Ridgeline Mechanical LLC',
      projectLocation: 'Houston, Harris County, TX',
      wageDeterminationNo: 'TX20260253',
      weekEndingDate: '2026-12-05',
      businessAddress: '1200 Kirby Drive, Suite 300, Houston, TX 77019',
      ...(over.header ?? {}),
    },
    provenance: {
      wdNumber: 'TX20260253',
      modificationNumber: 1,
      publicationDate: '2026-05-18',
      newerModification: null,
      ...(over.provenance ?? {}),
    },
    certifyingOfficial: {
      name: 'Rosa Delgado',
      title: 'Office Manager',
      phone: '(713) 555-0142',
      email: 'rosa@ridgeline.test',
      ...(over.certifyingOfficial ?? {}),
    },
    additionalRemarks: over.additionalRemarks ?? '',
    apprenticeshipPrograms: over.apprenticeshipPrograms ?? [
      {
        programName: 'IBEW Local 716 JATC',
        registrar: 'OA',
        registeredClassification: 'ELECTRICIAN APPRENTICE',
      },
    ],
    rows:
      over.rows ??
      [
        fixtureRow(1),
        fixtureRow(2, { lastName: 'Okafor', firstName: 'Adaeze', middleInitial: null }),
        fixtureRow(3, {
          lastName: 'Vandenberg-Alvarado',
          firstName: 'Christopher',
          workerStatus: 'RA',
        }),
      ],
    noWorkPerformed: over.noWorkPerformed ?? false,
    // Pinned, so `CreationDate` is a function of the payroll and not of the run.
    certifiedAt: over.certifiedAt ?? new Date('2026-12-06T17:42:00Z'),
    draft: over.draft ?? false,
    productName: over.productName ?? 'WageLens',
    productUrl: over.productUrl ?? 'http://localhost:3000',
  };
}

/** Twenty workers, entry numbers unbroken — the continuation-page fixture. */
export function twentyWorkerModel(): Wh347Model {
  const rows = Array.from({ length: 20 }, (_, i) =>
    fixtureRow(i + 1, { lastName: `Worker${String(i + 1).padStart(2, '0')}`, firstName: 'Sam' }),
  );
  return fixtureModel({ rows });
}
