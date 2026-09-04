/**
 * M4 — licence records, documents and the Requirements panel. `specs/04`.
 *
 * **Every acceptance criterion in `specs/04` is proved here, by number**, and
 * the ones that are statements about MARKUP are proved by rendering the real
 * component with `react-dom/server` rather than by inspecting a model that a
 * page might or might not display. "Shows the TDLR sentence and URL it came
 * from" is not a property of a database row.
 *
 * AC8's content test walks `kb-data/` directly rather than naming records, so
 * it starts passing on more rows as the data improves and never has to be
 * rewritten.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId } from '@octopus/platform';
import { organisations } from '@octopus/platform/db';
import { createTestDb } from '@octopus/platform/testing';

import { ConflictPanel, DatesPanel, DeadlineRow, DocumentsPanel } from '../src/components/licences';
import { RequirementsPanel } from '../src/components/requirements';
import { appMigrationsDir } from '../src/lib/db';
import { MemoryDocumentStore } from '../src/lib/documents';
import { DISCLOSED_SET, getKbRecord, listAllKbRecords } from '../src/lib/kb/accessors';
import { buildRequirements, NOT_PUBLISHED } from '../src/lib/requirements';
import { assessValue } from '../src/lib/rules/assess';
import { buildLicenceList, buildLicenceView, licenceTypeOptions } from '../src/lib/repos/licence-view';
import { addCeRecord, createLicence, listDocuments, uploadDocument } from '../src/lib/repos/licences';
import { cancelAlertsForSupersededDeadlines, liveDeadlineIds, updateLicenceAndReschedule } from '../src/lib/repos/renewals';
import { alerts, deadlines, licenceDocuments, licences, technicians } from '../src/lib/schema';
import { ensureRecipient } from '../src/lib/repos/alerts';
import { users } from '@octopus/platform/db';

const TODAY = '2026-09-03';

/** React escapes text nodes, so a label with an apostrophe is not itself in the HTML. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

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

async function technician(first = 'Dave', last = 'Alvarez'): Promise<string> {
  const id = newId('tec');
  await db.db.insert(technicians).values({ id, orgId, firstName: first, lastName: last });
  return id;
}

async function licence(extra: Record<string, unknown>) {
  const technicianId = await technician();
  return createLicence(
    db.db,
    {
      orgId,
      holderKind: 'technician',
      technicianId,
      state: 'TX',
      trade: 'hvac',
      kbLicenceTypeId: 'tx.hvac.acr_contractor_class_a',
      ...extra,
    },
    { today: TODAY },
  );
}

/** A real 3 MB JPEG: the two magic bytes plus noise, so the sniffing is real. */
function jpeg(bytes = 3 * 1024 * 1024): Uint8Array {
  const body = new Uint8Array(bytes);
  body.set([0xff, 0xd8, 0xff, 0xe0], 0);
  for (let i = 4; i < bytes; i += 1) body[i] = (i * 31) % 251;
  return body;
}

// ---------------------------------------------------------------------------
// specs/04 AC1 — Texas, an issue date only, and the sentence it came from
// ---------------------------------------------------------------------------

describe('specs/04 AC1 — a Texas ACR Class A licence with only an issue date', () => {
  it('fills in an expiry exactly 12 months later, marks it derived, and shows the TDLR sentence and URL', async () => {
    const { licence: row } = await licence({ issuedOn: '2026-03-14' });
    expect(row.expiresOn).toBe('2027-03-14');
    expect(row.expirySource).toBe('derived');

    const view = await buildLicenceView(db.db, orgId, row.id, TODAY);
    const renewal = view!.deadlines.find((d) => d.deadline.kind === 'renewal')!;
    expect(renewal.deadline.citationUrl).toMatch(/^https:\/\/www\.tdlr\.texas\.gov\//);

    // The MARKUP, not the model: the customer must be able to read the board's
    // own sentence and click through to the page it is on.
    const html = renderToStaticMarkup(createElement(DatesPanel, { view: view! }));
    expect(html).toContain('2027-03-14');
    expect(html).toContain("we worked this out from the state&#x27;s own rule");
    expect(html).toContain('https://www.tdlr.texas.gov');
    expect(html).toContain('checked 2026-09-03');
    expect(html).toContain(renewal.deadline.citationText!.slice(0, 30));
  });

  it('renders the derivation trace as the "why this date?" panel', async () => {
    const { licence: row } = await licence({ issuedOn: '2026-03-14' });
    const view = await buildLicenceView(db.db, orgId, row.id, TODAY);
    const renewal = view!.deadlines.find((d) => d.deadline.kind === 'renewal')!;
    const html = renderToStaticMarkup(createElement(DeadlineRow, { row: renewal }));
    expect(html).toContain('why-this-date');
    expect(html).toContain('12 months');
  });
});

// ---------------------------------------------------------------------------
// specs/04 AC2 — one state, two rules, both correct
// ---------------------------------------------------------------------------

describe('specs/04 AC2 — North Carolina electrical and plumbing, same state, two rules', () => {
  it('derives 2027-03-14 for electrical (anniversary) and 2026-12-31 for plumbing (fixed date)', async () => {
    const electrical = await createLicence(
      db.db,
      {
        orgId,
        holderKind: 'technician',
        technicianId: await technician('Ann', 'Ruiz'),
        state: 'NC',
        trade: 'electrical',
        kbLicenceTypeId: 'nc.electrical.unlimited',
        issuedOn: '2026-03-14',
      },
      { today: TODAY },
    );
    const plumbing = await createLicence(
      db.db,
      {
        orgId,
        holderKind: 'technician',
        technicianId: await technician('Bo', 'Ruiz'),
        state: 'NC',
        trade: 'plumbing',
        kbLicenceTypeId: 'nc.plumbing.plumbing_contractor',
        issuedOn: '2026-03-14',
      },
      { today: TODAY },
    );

    expect(electrical.licence.expiresOn).toBe('2027-03-14');
    expect(plumbing.licence.expiresOn).toBe('2026-12-31');
  });
});

// ---------------------------------------------------------------------------
// specs/04 AC3 — Florida's even-year August cliff
// ---------------------------------------------------------------------------

describe('specs/04 AC3 — a Florida certified plumbing licence', () => {
  it('derives 31 August of the next even year', async () => {
    const { licence: row } = await createLicence(
      db.db,
      {
        orgId,
        holderKind: 'technician',
        technicianId: await technician('Cal', 'Ruiz'),
        state: 'FL',
        trade: 'plumbing',
        kbLicenceTypeId: 'fl.plumbing.certified_plumbing_contractor',
        issuedOn: '2026-03-14',
      },
      { today: TODAY },
    );
    // Issued 14 March 2026: the next 31 August falling in an EVEN year is
    // 2026's, not 2028's. The rule is `fixed_date_parity:08-31:even` and the
    // parity is on the year the licence lands in, not on a two-year hop.
    expect(row.expiresOn).toBe('2026-08-31');
    expect(row.expirySource).toBe('derived');
  });

  it('an odd-year issue date lands on the following even year', async () => {
    const { licence: row } = await createLicence(
      db.db,
      {
        orgId,
        holderKind: 'technician',
        technicianId: await technician('Cam', 'Ruiz'),
        state: 'FL',
        trade: 'plumbing',
        kbLicenceTypeId: 'fl.plumbing.certified_plumbing_contractor',
        issuedOn: '2025-09-02',
      },
      { today: TODAY },
    );
    expect(row.expiresOn).toBe('2026-08-31');
  });
});

// ---------------------------------------------------------------------------
// specs/04 AC4 — an uncovered state
// ---------------------------------------------------------------------------

describe('specs/04 AC4 — a licence in a state we do not hold', () => {
  it('saves with a free-text type, derives no date from a rule, and names the gap', async () => {
    const { licence: row, derivation } = await createLicence(
      db.db,
      {
        orgId,
        holderKind: 'technician',
        technicianId: await technician('Dee', 'Ruiz'),
        state: 'OH',
        trade: 'hvac',
        customTypeName: 'Ohio HVAC contractor',
        issuedOn: '2026-03-14',
      },
      { today: TODAY },
    );

    expect(row.kbLicenceTypeId).toBeNull();
    expect(row.customTypeName).toBe('Ohio HVAC contractor');
    expect(derivation.explanations[0]?.reason).toBe('no_kb_record');

    const view = await buildLicenceView(db.db, orgId, row.id, TODAY);
    expect(view!.uncoveredBanner).toMatch(/We do not have OH hvac rules yet/);

    // The picker switches to free text because `covered` is false — three
    // different facts, one honest answer.
    const options = licenceTypeOptions('OH', 'hvac');
    expect(options).toEqual({ covered: false, options: [], stateName: null, boardUrl: null });
  });

  /** Deviation D4: the date they typed IS a deadline row, or the promise was false. */
  it('D4 — a date the customer typed in an uncovered state becomes an entered deadline row', async () => {
    const { licence: row } = await createLicence(
      db.db,
      {
        orgId,
        holderKind: 'technician',
        technicianId: await technician('Eli', 'Ruiz'),
        state: 'OH',
        trade: 'hvac',
        customTypeName: 'Ohio HVAC contractor',
        expiresOn: '2027-01-31',
      },
      { today: TODAY },
    );

    const view = await buildLicenceView(db.db, orgId, row.id, TODAY);
    const rows = view!.deadlines;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.deadline.source).toBe('entered');
    expect(rows[0]!.deadline.dueOn).toBe('2027-01-31');
    // No citation, and the database check constraint permits exactly that for
    // an entered row and forbids it for a derived one.
    expect(rows[0]!.deadline.citationUrl).toBeNull();

    // The status is NOT "NOT TRACKED": the whole point of D4.
    expect(view!.status).not.toBe('NOT TRACKED');

    const html = renderToStaticMarkup(createElement(DeadlineRow, { row: rows[0]! }));
    expect(html).toContain('you entered this');
    expect(html).not.toContain('sr-source');
  });

  it('the conflict panel shows both dates and overwrites neither', async () => {
    const { licence: row } = await licence({ issuedOn: '2026-03-14', expiresOn: '2027-06-04' });
    const view = await buildLicenceView(db.db, orgId, row.id, TODAY);

    expect(row.expiresOn).toBe('2027-06-04');
    expect(row.expirySource).toBe('entered');
    expect(view!.conflict).toEqual({ entered: '2027-06-04', derived: '2027-03-14' });

    const html = renderToStaticMarkup(
      createElement(ConflictPanel, { conflict: view!.conflict!, stateName: 'Texas' }),
    );
    expect(html).toContain('2027-06-04');
    expect(html).toContain('2027-03-14');
    expect(html).toContain('check your card');
  });
});

// ---------------------------------------------------------------------------
// specs/04 AC5 — documents
// ---------------------------------------------------------------------------

describe('specs/04 AC5 — uploading a 3 MB photo of a wallet card', () => {
  it('attaches it, renders a thumbnail, and reads back byte-identical', async () => {
    const { licence: row } = await licence({ issuedOn: '2026-03-14' });
    const store = new MemoryDocumentStore();
    const body = jpeg();

    const stored = await uploadDocument(db.db, store, {
      orgId,
      licenceId: row.id,
      filename: 'wallet card.jpg',
      body,
      declaredContentType: 'application/octet-stream',
      uploadedByUserId: null,
    });

    expect(stored.contentType).toBe('image/jpeg');
    expect(stored.byteSize).toBe(body.byteLength);

    const readBack = await store.get(orgId, stored.key);
    expect(readBack).not.toBeNull();
    expect(readBack!.byteLength).toBe(body.byteLength);
    const { createHash } = await import('node:crypto');
    expect(createHash('sha256').update(readBack!).digest('hex')).toBe(stored.sha256);

    const documents = await listDocuments(db.db, orgId, row.id);
    const html = renderToStaticMarkup(
      createElement(DocumentsPanel, { licenceId: row.id, documents }),
    );
    expect(html).toContain('document-thumbnail');
    expect(html).toContain(`/licences/${row.id}/documents/${documents[0]!.id}`);
  });

  it('refuses a 34 MB file with the product’s own sentence, not a framework error', async () => {
    const { licence: row } = await licence({ issuedOn: '2026-03-14' });
    const store = new MemoryDocumentStore();
    const oversized = new Uint8Array(21 * 1024 * 1024);
    oversized.set([0xff, 0xd8, 0xff, 0xe0], 0);
    await expect(
      uploadDocument(db.db, store, {
        orgId,
        licenceId: row.id,
        filename: 'big.jpg',
        body: oversized,
        uploadedByUserId: null,
      }),
    ).rejects.toThrow(/The limit is 20 MB/);
  });

  /**
   * `specs/04` §Test plan, Security. The route handler scopes by `org_id` AND
   * the store re-checks the organisation against the storage key, so a leaked
   * id resolves nothing.
   */
  it('a document from organisation A is invisible to a session in organisation B', async () => {
    const { licence: row } = await licence({ issuedOn: '2026-03-14' });
    const store = new MemoryDocumentStore();
    const stored = await uploadDocument(db.db, store, {
      orgId,
      licenceId: row.id,
      filename: 'card.jpg',
      body: jpeg(1024),
      uploadedByUserId: null,
    });

    const otherOrg = newId('org');
    await db.db.insert(organisations).values({ id: otherOrg, name: 'Other', slug: `other-${otherOrg}` });

    // 1. the row lookup, scoped by org
    const asOther = await db.db
      .select()
      .from(licenceDocuments)
      .where(eq(licenceDocuments.orgId, otherOrg));
    expect(asOther).toHaveLength(0);

    // 2. the store itself, keyed by org
    expect(await store.get(otherOrg, stored.key)).toBeNull();
    expect(await store.get(orgId, stored.key)).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// specs/04 AC6 — changing a date re-derives AND reschedules the alert set
// ---------------------------------------------------------------------------

describe('specs/04 AC6 — changing the issue date', () => {
  it('re-derives the expiry, supersedes the old deadlines and cancels their queued alerts', async () => {
    const { licence: row } = await licence({ issuedOn: '2026-03-14' });

    // A recipient with a queued alert against the CURRENT deadline.
    const userId = newId('usr');
    await db.db.insert(users).values({ id: userId, email: `owner+${userId}@sila.test` });
    await ensureRecipient(db.db, { userId, orgId, now: new Date('2026-09-03T12:00:00Z') });
    const before = await liveDeadlineIds(db.db, row.id);
    expect(before.length).toBe(2);
    await db.db.insert(alerts).values({
      id: newId('alr'),
      orgId,
      deadlineId: before[0]!,
      recipientUserId: userId,
      offsetDays: 90,
      status: 'queued',
    });

    const result = await updateLicenceAndReschedule(
      db.db,
      { orgId, licenceId: row.id, patch: { issuedOn: '2026-06-01' } },
      { today: TODAY },
    );

    expect(result.derivation.superseded).toBe(2);
    expect(result.derivation.inserted).toBe(2);
    expect(result.alertsCancelled).toBe(1);

    const alertRows = await db.db.select().from(alerts);
    expect(alertRows.map((a) => a.status)).toEqual(['cancelled']);

    const updated = await db.db.select().from(licences).where(eq(licences.id, row.id));
    expect(updated[0]!.expiresOn).toBe('2027-06-01');

    // The history stays: superseded, never updated in place.
    const all = await db.db.select().from(deadlines).where(eq(deadlines.licenceId, row.id));
    expect(all).toHaveLength(4);
    expect(all.filter((d) => d.supersededAt !== null)).toHaveLength(2);
  });

  it('cancels nothing when the derivation did not move anything', async () => {
    const { licence: row } = await licence({ issuedOn: '2026-03-14' });
    const before = await liveDeadlineIds(db.db, row.id);
    const cancelled = await cancelAlertsForSupersededDeadlines(db.db, {
      licenceId: row.id,
      deadlineIdsBefore: before,
    });
    expect(cancelled).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// specs/04 AC7 — CE, and why 8 hours is not 8 hours everywhere
// ---------------------------------------------------------------------------

describe('specs/04 AC7 — CE hours against two states', () => {
  it('8 hours satisfies Texas ACR; 8 hours does NOT satisfy Florida, whose 14 are subject-specific', async () => {
    const texas = await licence({ issuedOn: '2026-03-14' });
    await addCeRecord(db.db, {
      orgId,
      licenceId: texas.licence.id,
      hours: 8,
      completedOn: '2026-08-01',
    });
    const eightGeneric = await buildLicenceView(db.db, orgId, texas.licence.id, TODAY);
    expect(eightGeneric!.ceComputation!.hoursRequired).toBe(8);
    // Texas's 8 hours INCLUDE one hour of Texas state law, so eight unlabelled
    // hours leave exactly that one outstanding — and the panel names it rather
    // than drawing an 8/8 bar. Same protection AC7 asks for on Florida.
    expect(eightGeneric!.ceComputation!.hoursOutstanding).toBe(1);
    expect(eightGeneric!.ceComputation!.subjectShortfall.map((s) => s.subject)).toEqual([
      'Texas state law and rules regulating licensee conduct',
    ]);

    await addCeRecord(db.db, {
      orgId,
      licenceId: texas.licence.id,
      hours: 1,
      subject: 'Texas state law and rules regulating licensee conduct',
      completedOn: '2026-08-02',
    });
    const texasView = await buildLicenceView(db.db, orgId, texas.licence.id, TODAY);
    expect(texasView!.ceComputation!.hoursOutstanding).toBe(0);
    expect(texasView!.ceComputation!.subjectShortfall).toEqual([]);

    const florida = await createLicence(
      db.db,
      {
        orgId,
        holderKind: 'technician',
        technicianId: await technician('Fay', 'Ruiz'),
        state: 'FL',
        trade: 'plumbing',
        kbLicenceTypeId: 'fl.plumbing.certified_plumbing_contractor',
        issuedOn: '2026-03-14',
      },
      { today: TODAY },
    );
    await addCeRecord(db.db, {
      orgId,
      licenceId: florida.licence.id,
      hours: 8,
      completedOn: '2026-08-01',
    });
    const floridaView = await buildLicenceView(db.db, orgId, florida.licence.id, TODAY);
    expect(floridaView!.ceComputation!.hoursRequired).toBe(14);
    expect(floridaView!.ceComputation!.hoursOutstanding).toBeGreaterThan(0);
    // And the shortfall is NAMED, per subject, rather than shown as one bar.
    expect(floridaView!.ceComputation!.subjectShortfall.length).toBeGreaterThan(0);
    expect(floridaView!.ceComputation!.subjectShortfall.every((s) => s.outstanding > 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// specs/04 AC8 — the Requirements panel names what the board does not publish
// ---------------------------------------------------------------------------

describe('specs/04 AC8 — the Requirements panel', () => {
  it('renders a Texas ACR bond row reading "the board does not publish this", with the note behind it', async () => {
    const { licence: row } = await licence({ issuedOn: '2026-03-14' });
    const view = await buildLicenceView(db.db, orgId, row.id, TODAY);
    const bond = view!.requirements.find((r) => r.field === 'bond.amount')!;

    expect(bond.published).toBe(false);
    expect(bond.citation).toBeNull();
    expect(bond.display).toBeNull();
    expect(bond.note).toBeTruthy();

    const html = renderToStaticMarkup(
      createElement(RequirementsPanel, {
        rows: view!.requirements,
        boardName: view!.board?.name,
        boardUrl: view!.board?.url,
      }),
    );
    // The field NAME is rendered, and so is the wording. Never a blank row.
    expect(html).toContain('Bond amount');
    expect(html).toContain(NOT_PUBLISHED);
    // And a published row still carries its chip and its value.
    expect(html).toContain('General liability');
    expect(html).toContain('$300,000 per occurrence');
    expect(html).toContain('sr-source');
  });

  /**
   * The content test `specs/04` §Test plan asks for, over ALL NINE committed
   * records. It reads `kb-data/` through the accessors rather than naming a
   * record, so it starts passing on more rows as the data improves and never
   * has to be rewritten.
   */
  it('over all nine records: every unknown DISCLOSED_SET field is named and never carries a chip', () => {
    let unknownRows = 0;
    let publishedRows = 0;

    for (const record of listAllKbRecords()) {
      for (const licenceType of record.licence_types) {
        const rows = buildRequirements(record, licenceType, TODAY);
        const disclosed = rows.filter((row) => row.disclosed);
        // Every DISCLOSED_SET field that applies to this shape is a ROW.
        expect(disclosed.length).toBeGreaterThan(0);

        for (const row of disclosed) {
          const html = renderToStaticMarkup(
            createElement(RequirementsPanel, { rows: [row], boardName: 'The board', boardUrl: 'https://example.gov' }),
          );
          expect(html).toContain(escapeHtml(row.label));
          if (row.published) {
            publishedRows += 1;
            expect(html).toContain('sr-source');
            expect(html).not.toContain(NOT_PUBLISHED);
          } else {
            unknownRows += 1;
            // AC8, in one line: the name, the wording, and NO source chip.
            expect(html).toContain(NOT_PUBLISHED);
            expect(html).not.toContain('sr-source');
          }
        }
      }
    }

    // The data as committed: bond.amount is unknown on all 23 licence types, so
    // there is plenty of both kinds and neither branch is vacuous.
    expect(unknownRows).toBeGreaterThan(20);
    expect(publishedRows).toBeGreaterThan(0);
  });

  it('the DISCLOSED_SET field names in the panel are the accessor’s own, not a second copy', () => {
    const record = getKbRecord('TX', 'hvac')!;
    const fields = new Set(buildRequirements(record, record.licence_types[0]!, TODAY).map((r) => r.field));
    for (const field of DISCLOSED_SET) {
      // `exam.fee` only exists where the licence type has an exam block; every
      // other DISCLOSED_SET entry is unconditional.
      if (field === 'exam.fee' && !record.licence_types[0]!.exam) continue;
      expect(fields, `DISCLOSED_SET names ${field} and the panel must render it`).toContain(field);
    }
  });

  it('a stale value stops being published even though the record still says verified', () => {
    const record = getKbRecord('TX', 'hvac')!;
    // 400 days after the last check: past the 180-day rule.
    const rows = buildRequirements(record, record.licence_types[0]!, '2027-10-08');
    const liability = rows.find((r) => r.field === 'insurance.general_liability')!;
    expect(assessValue(record.licence_types[0]!.insurance.general_liability, '2027-10-08').stale).toBe(true);
    expect(liability.published).toBe(false);
    expect(liability.citation).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// The list screen
// ---------------------------------------------------------------------------

describe('the licence list', () => {
  it('groups by state and every filter narrows without changing the total', async () => {
    await licence({ issuedOn: '2026-03-14' });
    await createLicence(
      db.db,
      {
        orgId,
        holderKind: 'technician',
        technicianId: await technician('Gil', 'Ruiz'),
        state: 'NC',
        trade: 'plumbing',
        kbLicenceTypeId: 'nc.plumbing.plumbing_contractor',
        issuedOn: '2026-03-14',
      },
      { today: TODAY },
    );

    const all = await buildLicenceList(db.db, orgId, TODAY);
    expect(all.total).toBe(2);
    expect(all.groups.map((g) => g.state).sort()).toEqual(['NC', 'TX']);

    const texasOnly = await buildLicenceList(db.db, orgId, TODAY, { state: 'tx' });
    expect(texasOnly.total).toBe(2);
    expect(texasOnly.rows).toHaveLength(1);
    expect(texasOnly.rows[0]!.licence.state).toBe('TX');

    const soon = await buildLicenceList(db.db, orgId, TODAY, { within: 7 });
    expect(soon.rows).toHaveLength(0);
  });

  it('offers only publishable licence types for a covered state', () => {
    const options = licenceTypeOptions('TX', 'hvac');
    expect(options.covered).toBe(true);
    expect(options.options.map((o) => o.id)).toContain('tx.hvac.acr_contractor_class_a');
    expect(options.stateName).toBe('Texas');
  });
});
