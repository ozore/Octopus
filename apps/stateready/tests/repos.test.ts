/**
 * The repositories, on PGlite with the real migrations.
 *
 * These are the tests that prove the modules compose: an import creates
 * technicians AND licences, a licence creation derives deadlines through the
 * pure engine, the derivation emits the ACTIVATION EVENT, and the dashboard
 * reads all of it back as the four-word status vocabulary.
 */

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId } from '@octopus/platform';
import { organisations, events } from '@octopus/platform/db';
import { createTestDb } from '@octopus/platform/testing';

import { MemoryDocumentStore, sniffContentType } from '../src/lib/documents';
import { appMigrationsDir } from '../src/lib/db';
import { ACTIVATION_EVENT, TRIAL_COHORT_CAP, TRIAL_DAYS } from '../src/lib/plans';
import { archiveEntity, addEntity, organisationCoverage, saveCompanyProfile, setOperatingStates } from '../src/lib/repos/company';
import { buildDashboard, refreshDashboardSummary, statusForDeadline } from '../src/lib/repos/dashboard';
import { deriveForLicence, deriveForOrganisation, explainDeadline, liveDeadlines } from '../src/lib/repos/deadlines';
import { addCeRecord, archiveLicence, createLicence, listLicences, possibleDuplicates, uploadDocument } from '../src/lib/repos/licences';
import { createTechnician, listTechnicians, previewImport, runImport } from '../src/lib/repos/technicians';
import { grantTrial, trialCohortSize, trialState } from '../src/lib/trial';
import { auditLog, deadlines, licences, technicians } from '../src/lib/schema';
import { listAudit } from '../src/lib/repos/audit';

const TODAY = '2026-09-03';

let db: Awaited<ReturnType<typeof createTestDb>>;
let orgId: string;

beforeEach(async () => {
  db = await createTestDb([appMigrationsDir()]);
  orgId = newId('org');
  await db.db.insert(organisations).values({ id: orgId, name: 'Sila Mechanical', slug: `sila-${orgId}` });
});
afterEach(async () => {
  await db.close();
});

describe('M2 — company profile', () => {
  it('saves the profile and writes an audit row', async () => {
    await saveCompanyProfile(db.db, { orgId, legalName: 'Sila Mechanical LLC', technicianCountBand: '21-50' });
    const audit = await listAudit(db.db, orgId);
    expect(audit[0]?.action).toBe('company_profile_created');
  });

  it('refuses a name outside 2–200 characters', async () => {
    await expect(saveCompanyProfile(db.db, { orgId, legalName: 'X' })).rejects.toThrow(/between 2 and 200/);
  });

  it('stores the CROSS PRODUCT of states and trades, not two lists', async () => {
    // Electrical in Texas and plumbing in Florida, and NEITHER of the other two.
    const result = await setOperatingStates(db.db, {
      orgId,
      rows: [
        { state: 'TX', trade: 'electrical' },
        { state: 'FL', trade: 'plumbing' },
      ],
    });
    expect(result.added).toBe(2);
    const coverage = await organisationCoverage(db.db, orgId, TODAY);
    expect(coverage.map((c) => `${c.state}:${c.trade}`)).toEqual(['TX:electrical', 'FL:plumbing']);
    expect(coverage.every((c) => c.covered)).toBe(true);
  });

  it('diffs: a second call adds and removes', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    const second = await setOperatingStates(db.db, { orgId, rows: [{ state: 'NC', trade: 'hvac' }] });
    expect(second).toMatchObject({ added: 1, removed: 1, refused: [] });
  });

  it('refuses to remove a state that still has active licences, and says how many', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    const entityId = await addEntity(db.db, { orgId, name: 'Sila Texas LLC' });
    await createLicence(
      db.db,
      { orgId, holderKind: 'entity', entityId, state: 'TX', trade: 'hvac', kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a', issuedOn: '2026-03-14' },
      { today: TODAY },
    );
    const result = await setOperatingStates(db.db, { orgId, rows: [] });
    expect(result.removed).toBe(0);
    expect(result.refused).toEqual([{ state: 'TX', trade: 'hvac', licences: 1 }]);
  });

  it('archives an entity rather than deleting it, and refuses while licences are live', async () => {
    const entityId = await addEntity(db.db, { orgId, name: 'Sila Texas LLC' });
    await createLicence(
      db.db,
      { orgId, holderKind: 'entity', entityId, state: 'TX', trade: 'hvac', kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a', issuedOn: '2026-03-14' },
      { today: TODAY },
    );
    expect(await archiveEntity(db.db, { orgId, entityId })).toMatchObject({ status: 'refused', activeLicences: 1 });
  });
});

describe('M3 — the roster and the import', () => {
  const CSV = [
    'Ridgeline Electric roster,,,,',
    ',,,,',
    'Tech Name,State,Trade,License #,Expires',
    'Dave Alvarez,TX,Electrical,MEL-118234,03/14/2027',
    '"Ruiz, Jr.",TX,HVAC,TACLA00123C,03/14/2027',
    "Mary O'Connell,NC,Plumbing,P-1-24011,12/31/2026",
    'Bad Row,ZZ,Plumbing,X-1,31/13/2026',
  ].join('\n');

  it('previews exactly what will be created, before anything is written', () => {
    const preview = previewImport(CSV);
    expect(preview.headers).toEqual(['Tech Name', 'State', 'Trade', 'License #', 'Expires']);
    expect(preview.rowCount).toBe(4);
    expect(preview.willCreateTechnicians).toBe(3);
    expect(preview.willCreateLicences).toBe(3);
    expect(preview.suggestedDateFormat).toBe('mdy');
  });

  it('imports technicians AND licences from one row each, and skips the unreadable one', async () => {
    const summary = await runImport(
      db.db,
      { orgId, filename: 'roster.csv', text: CSV, format: 'mdy' },
      { today: TODAY },
    );
    expect(summary).toMatchObject({ rowCount: 4, created: 3, updated: 0, skipped: 1, licencesCreated: 3 });
    expect(summary.errorsCsv).toMatch(/could not read expiry date/);
    expect(await listTechnicians(db.db, orgId)).toHaveLength(3);
    expect(await listLicences(db.db, orgId)).toHaveLength(3);
  });

  it('re-importing the same file updates rather than duplicates', async () => {
    await runImport(db.db, { orgId, filename: 'roster.csv', text: CSV, format: 'mdy' }, { today: TODAY });
    const second = await runImport(
      db.db,
      { orgId, filename: 'roster.csv', text: CSV, format: 'mdy' },
      { today: TODAY },
    );
    expect(second.created).toBe(0);
    expect(second.updated).toBe(3);
    expect(await listTechnicians(db.db, orgId)).toHaveLength(3);
  });

  it('a dry run writes nothing', async () => {
    const summary = await runImport(
      db.db,
      { orgId, filename: 'roster.csv', text: CSV, format: 'mdy', dryRun: true },
      { today: TODAY },
    );
    expect(summary.created).toBe(3);
    expect(await listTechnicians(db.db, orgId)).toHaveLength(0);
  });

  it('the confirmed date format decides the deadline, and getting it wrong moves it by months', async () => {
    const row = 'Tech Name,State,Trade,License #,Expires\nA B,TX,HVAC,1,03/09/2027';
    await runImport(db.db, { orgId, filename: 'a.csv', text: row, format: 'mdy' }, { today: TODAY });
    const mdy = (await listLicences(db.db, orgId))[0]?.expiresOn;
    expect(mdy).toBe('2027-03-09');

    const otherOrg = newId('org');
    await db.db.insert(organisations).values({ id: otherOrg, name: 'Other', slug: `other-${otherOrg}` });
    await runImport(db.db, { orgId: otherOrg, filename: 'a.csv', text: row, format: 'dmy' }, { today: TODAY });
    expect((await listLicences(db.db, otherOrg))[0]?.expiresOn).toBe('2027-09-03');
  });
});

describe('M4 + M5 — licences and the derivation service', () => {
  async function texasLicence(extra: Record<string, unknown> = {}) {
    const techId = newId('tec');
    await db.db.insert(technicians).values({ id: techId, orgId, firstName: 'Dave', lastName: 'Alvarez' });
    return createLicence(
      db.db,
      {
        orgId,
        holderKind: 'technician',
        technicianId: techId,
        state: 'TX',
        trade: 'hvac',
        kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
        issuedOn: '2026-03-14',
        ...extra,
      },
      { today: TODAY },
    );
  }

  it('fills in an expiry the customer did not type, marks it derived, and cites TDLR', async () => {
    const { licence, derivation } = await texasLicence();
    expect(licence.expiresOn).toBe('2027-03-14');
    expect(licence.expirySource).toBe('derived');
    const rows = await liveDeadlines(db.db, orgId);
    expect(rows).toHaveLength(2); // renewal + CE
    expect(rows.every((r) => r.citationUrl?.startsWith('https://www.tdlr.texas.gov/'))).toBe(true);
    expect(derivation.inserted).toBe(2);
  });

  it('emits the activation event FROM THE DERIVATION SERVICE, once per deadline', async () => {
    await texasLicence();
    const rows = await db.db.select().from(events).where(eq(events.name, ACTIVATION_EVENT));
    expect(rows).toHaveLength(2);
    expect(rows[0]?.props).toMatchObject({ state: 'TX', trade: 'hvac' });
  });

  it('an import counts as activation too — every route into derivation counts', async () => {
    await runImport(
      db.db,
      {
        orgId,
        filename: 'r.csv',
        text:
          'Tech Name,State,Trade,Credential,License #,Expires\n' +
          'A B,TX,HVAC,Air Conditioning and Refrigeration Contractor — Class A,1,\n' +
          'C D,NC,Plumbing,Plumbing Contractor,2,',
        format: 'mdy',
      },
      { today: TODAY },
    );
    const rows = await db.db.select().from(events).where(eq(events.name, ACTIVATION_EVENT));
    expect(rows.length).toBeGreaterThan(0);
  });

  it('re-deriving is idempotent: nothing inserted, nothing superseded', async () => {
    const { licence } = await texasLicence();
    const again = await deriveForLicence(db.db, licence.id, { today: TODAY });
    expect(again).toMatchObject({ inserted: 0, superseded: 0, unchanged: 2 });
  });

  it('changing the issue date supersedes the old deadline and writes a new one', async () => {
    const { licence } = await texasLicence();
    await db.db.update(licences).set({ issuedOn: '2026-06-01' }).where(eq(licences.id, licence.id));
    const diff = await deriveForLicence(db.db, licence.id, { today: TODAY });
    expect(diff.superseded).toBe(2);
    expect(diff.inserted).toBe(2);

    // The old rows are still there, stamped — the history IS the product.
    const all = await db.db.select().from(deadlines).where(eq(deadlines.licenceId, licence.id));
    expect(all).toHaveLength(4);
    expect(all.filter((r) => r.supersededAt !== null)).toHaveLength(2);
    expect((await liveDeadlines(db.db, orgId)).map((r) => r.dueOn)).toEqual(['2027-06-01', '2027-06-01']);
  });

  it('a licence in an uncovered state saves, derives nothing, and explains once', async () => {
    const techId = newId('tec');
    await db.db.insert(technicians).values({ id: techId, orgId, firstName: 'A', lastName: 'B' });
    const { licence, derivation } = await createLicence(
      db.db,
      { orgId, holderKind: 'technician', technicianId: techId, state: 'OH', trade: 'hvac', issuedOn: '2026-03-14' },
      { today: TODAY },
    );
    expect(licence.expiresOn).toBeNull();
    expect(derivation.inserted).toBe(0);
    expect(derivation.explanations).toHaveLength(1);
    expect(derivation.explanations[0]?.reason).toBe('no_kb_record');
  });

  it('refuses a licence type we do not hold a publishable rule set for', async () => {
    const techId = newId('tec');
    await db.db.insert(technicians).values({ id: techId, orgId, firstName: 'A', lastName: 'B' });
    await expect(
      createLicence(
        db.db,
        {
          orgId,
          holderKind: 'technician',
          technicianId: techId,
          state: 'TX',
          trade: 'hvac',
          kbLicenceTypeId: 'tx.hvac.invented',
          issuedOn: '2026-03-14',
        },
        { today: TODAY },
      ),
    ).rejects.toThrow(/do not hold a publishable rule set/);
  });

  it('warns softly about a duplicate rather than blocking it', async () => {
    await texasLicence({ licenceNumber: 'TACLA00123C' });
    const duplicates = await possibleDuplicates(db.db, orgId, 'TX', 'TACLA00123C');
    expect(duplicates).toHaveLength(1);
  });

  it('explainDeadline returns the trace and emits deadline_explained', async () => {
    await texasLicence();
    const [deadline] = await liveDeadlines(db.db, orgId);
    const explained = await explainDeadline(db.db, orgId, deadline!.id);
    expect((explained?.trace as { label: string }[]).map((t) => t.label)).toContain('Arithmetic');
    const tracked = await db.db.select().from(events).where(eq(events.name, 'deadline_explained'));
    expect(tracked).toHaveLength(1);
  });

  it('archiving a licence keeps it and its history', async () => {
    const { licence } = await texasLicence();
    await archiveLicence(db.db, { orgId, licenceId: licence.id });
    expect(await listLicences(db.db, orgId)).toHaveLength(0);
    expect(await db.db.select().from(licences).where(eq(licences.id, licence.id))).toHaveLength(1);
  });

  it('a batched re-derivation walks every active licence', async () => {
    await texasLicence();
    const totals = await deriveForOrganisation(db.db, orgId, { today: TODAY });
    expect(totals).toMatchObject({ licences: 1, inserted: 0, superseded: 0, unchanged: 2 });
  });

  it('records CE hours against the licence and the audit trail', async () => {
    const { licence } = await texasLicence();
    await addCeRecord(db.db, {
      orgId,
      licenceId: licence.id,
      hours: 8,
      subject: 'Texas state law and rules regulating licensee conduct',
      completedOn: '2026-08-01',
    });
    const [updated] = await db.db.select().from(licences).where(eq(licences.id, licence.id));
    expect(Number(updated?.ceHoursRecorded)).toBe(8);
    const audit = await db.db.select().from(auditLog).where(eq(auditLog.action, 'ce_record_added'));
    expect(audit).toHaveLength(1);
  });
});

describe('documents', () => {
  it('sniffs the content type rather than trusting the extension', () => {
    expect(sniffContentType(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe('application/pdf');
    expect(sniffContentType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffContentType(new TextEncoder().encode('MZ this is an exe'))).toBeNull();
  });

  it('refuses a .pdf that is actually an executable', async () => {
    const store = new MemoryDocumentStore();
    const techId = newId('tec');
    await db.db.insert(technicians).values({ id: techId, orgId, firstName: 'A', lastName: 'B' });
    const { licence } = await createLicence(
      db.db,
      { orgId, holderKind: 'technician', technicianId: techId, state: 'TX', trade: 'hvac', issuedOn: '2026-03-14' },
      { today: TODAY },
    );
    await expect(
      uploadDocument(db.db, store, {
        orgId,
        licenceId: licence.id,
        filename: 'card.pdf',
        body: new TextEncoder().encode('MZ '),
      }),
    ).rejects.toThrow(/photo or a PDF/);
  });

  it('stores a document under a key that carries the organisation, so another org cannot read it', async () => {
    const store = new MemoryDocumentStore();
    const techId = newId('tec');
    await db.db.insert(technicians).values({ id: techId, orgId, firstName: 'A', lastName: 'B' });
    const { licence } = await createLicence(
      db.db,
      { orgId, holderKind: 'technician', technicianId: techId, state: 'TX', trade: 'hvac', issuedOn: '2026-03-14' },
      { today: TODAY },
    );
    const body = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3]);
    const stored = await uploadDocument(db.db, store, { orgId, licenceId: licence.id, filename: 'card.jpg', body });
    expect(stored.key.startsWith(`org/${orgId}/`)).toBe(true);
    expect(await store.get(orgId, stored.key)).toEqual(body);
    expect(await store.get('org_someone_else', stored.key)).toBeNull();
  });
});

describe('M7 — the dashboard model', () => {
  it('draws 51 tiles whatever the footprint, and only the footprint carries a status', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    const model = await buildDashboard(db.db, orgId, TODAY);
    expect(model.tiles).toHaveLength(51);
    expect(model.tiles.find((t) => t.state === 'TX')?.status).toBe('NOT TRACKED');
    // Not in the footprint: no status, and NO STATUS WORD in the accessible name.
    const ohio = model.tiles.find((t) => t.state === 'OH');
    expect(ohio?.status).toBeNull();
    expect(ohio?.accessibleName).toBe('Ohio — not in your footprint');
    expect(ohio?.accessibleName).not.toMatch(/READY|AT RISK|LAPSED|NOT TRACKED/);
  });

  it('rolls up to the worst status in a state, and counts what the status line needs', async () => {
    const techId = newId('tec');
    await db.db.insert(technicians).values({ id: techId, orgId, firstName: 'A', lastName: 'B' });
    // Issued two years ago: the anniversary rule puts the renewal in the past.
    await createLicence(
      db.db,
      {
        orgId,
        holderKind: 'technician',
        technicianId: techId,
        state: 'TX',
        trade: 'hvac',
        kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
        issuedOn: '2024-03-14',
      },
      { today: TODAY },
    );
    const model = await buildDashboard(db.db, orgId, TODAY);
    expect(model.tiles.find((t) => t.state === 'TX')?.status).toBe('LAPSED');
    expect(model.worstStatus).toBe('LAPSED');
    expect(model.counts.lapsed).toBeGreaterThan(0);
  });

  it('AT RISK at 89 days, READY at 91 — the boundary the alert schedule shares', () => {
    expect(statusForDeadline('2026-12-01', TODAY)).toBe('AT RISK'); // 89 days
    expect(statusForDeadline('2026-12-03', TODAY)).toBe('READY'); // 91 days
    expect(statusForDeadline('2026-09-03', TODAY)).toBe('LAPSED'); // today
    expect(statusForDeadline(null, TODAY)).toBe('NOT TRACKED');
  });

  it('materialises a summary that matches a live build', async () => {
    await setOperatingStates(db.db, { orgId, rows: [{ state: 'TX', trade: 'hvac' }] });
    const model = await refreshDashboardSummary(db.db, orgId, TODAY);
    expect(model.operatingStates).toBe(1);
    expect(model.coveredStates).toBe(1);
  });
});

describe('M9 — the first-100 trial counter', () => {
  it('grants a 14-day trial and numbers the cohort', async () => {
    const grant = await grantTrial(db.db, { orgId, now: new Date('2026-09-03T00:00:00Z') });
    expect(grant.cohortNumber).toBe(1);
    expect(grant.trialEndsAt.toISOString().slice(0, 10)).toBe('2026-09-17');
    expect(TRIAL_DAYS).toBe(14);
  });

  it('is idempotent per organisation', async () => {
    const first = await grantTrial(db.db, { orgId });
    const second = await grantTrial(db.db, { orgId });
    expect(second.cohortNumber).toBe(first.cohortNumber);
    expect(await trialCohortSize(db.db)).toBe(1);
  });

  it('excludes internal organisations from the counter', async () => {
    await grantTrial(db.db, { orgId });
    const internal = newId('org');
    await db.db.insert(organisations).values({ id: internal, name: 'TheVillage internal', slug: `int-${internal}` });
    await grantTrial(db.db, { orgId: internal, isInternal: true });
    expect(await trialCohortSize(db.db)).toBe(1);
  });

  it('knows who is inside the first hundred and who is not', async () => {
    await grantTrial(db.db, { orgId, now: new Date('2026-09-03T00:00:00Z') });
    const state = await trialState(db.db, orgId, {
      now: new Date('2026-09-10T00:00:00Z'),
      hasPaidSubscription: false,
    });
    expect(state).toMatchObject({ onTrial: true, withinFirst100: true, daysLeft: 7, readOnly: false });
    expect(TRIAL_COHORT_CAP).toBe(100);
  });

  it('goes READ-ONLY at day 14 — data intact, writes refused', async () => {
    await grantTrial(db.db, { orgId, now: new Date('2026-09-03T00:00:00Z') });
    const after = await trialState(db.db, orgId, {
      now: new Date('2026-09-18T00:00:00Z'),
      hasPaidSubscription: false,
    });
    expect(after).toMatchObject({ onTrial: false, readOnly: true, daysLeft: 0 });

    // A paid subscription lifts it immediately.
    const paid = await trialState(db.db, orgId, {
      now: new Date('2026-09-18T00:00:00Z'),
      hasPaidSubscription: true,
    });
    expect(paid.readOnly).toBe(false);
  });
});

describe('manual roster entry', () => {
  it('requires at least a last name', async () => {
    await expect(createTechnician(db.db, { orgId, firstName: 'Dave', lastName: '  ' })).rejects.toThrow(
      /last name/,
    );
  });
});
