/**
 * M4 — licence records, documents and CE records. `specs/04`.
 *
 * The one behaviour worth reading before editing: **the customer's own expiry
 * date is never silently overwritten.** If they typed one and the state's rule
 * disagrees, we keep theirs, mark `expirySource = 'entered'`, and surface the
 * disagreement. It is usually a typo, and finding it is worth the subscription.
 */

import { newId } from '@octopus/platform';
import { track } from '@octopus/platform/events';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  sniffContentType,
  type DocumentStore,
} from '../documents';
import { getKbRecord, getLicenceType } from '../kb/accessors';
import { ceRecords, licenceDocuments, licences, type Licence } from '../schema';
import { recordAudit } from './audit';
import { deriveForLicence, deriveForLicenceInput } from './deadlines';

export type CreateLicenceInput = {
  orgId: string;
  holderKind: 'entity' | 'technician';
  entityId?: string | null;
  technicianId?: string | null;
  state: string;
  trade: string;
  kbLicenceTypeId?: string | null;
  customTypeName?: string | null;
  licenceNumber?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  notes?: string | null;
  actorUserId?: string | null;
};

function validate(input: CreateLicenceInput): void {
  if (input.holderKind === 'entity' && !input.entityId) throw new Error('An entity licence needs an entity.');
  if (input.holderKind === 'technician' && !input.technicianId) {
    throw new Error('A technician licence needs a technician.');
  }
  if (input.licenceNumber && input.licenceNumber.length > 64) {
    throw new Error('Licence numbers are at most 64 characters.');
  }
  const today = new Date().toISOString().slice(0, 10);
  if (input.issuedOn && input.issuedOn > today) throw new Error('The issue date cannot be in the future.');
  if (input.issuedOn && input.expiresOn && input.expiresOn <= input.issuedOn) {
    throw new Error('The expiry date must be after the issue date.');
  }
  if (input.kbLicenceTypeId && !getLicenceType(input.kbLicenceTypeId)) {
    throw new Error(`We do not hold a publishable rule set for ${input.kbLicenceTypeId}.`);
  }
}

export async function createLicence(
  db: Db,
  input: CreateLicenceInput,
  options: { today: string },
): Promise<{ licence: Licence; derivation: Awaited<ReturnType<typeof deriveForLicence>> }> {
  validate(input);
  const id = newId('lic');
  const state = input.state.toUpperCase();

  // Derive first, so the row we write already knows whether the expiry was
  // entered or derived. `expirySource` is visible in the UI, deliberately:
  // "you entered this" and "we worked this out from Texas's rule" are different
  // levels of trust and the customer is entitled to know which they are seeing.
  const preview = deriveForLicenceInput(
    {
      id,
      orgId: input.orgId,
      state,
      trade: input.trade,
      kbLicenceTypeId: input.kbLicenceTypeId ?? null,
      issuedOn: input.issuedOn ?? null,
      expiresOn: input.expiresOn ?? null,
      expirySource: input.expiresOn ? 'entered' : 'derived',
      ceCarriedInHours: '0',
      qualifierDisassociatedOn: null,
    } as unknown as Licence,
    options.today,
  );

  const derivedExpiry = preview.renewal?.source === 'derived' ? preview.renewal.dueOn : null;
  await db.insert(licences).values({
    id,
    orgId: input.orgId,
    holderKind: input.holderKind,
    entityId: input.holderKind === 'entity' ? (input.entityId ?? null) : null,
    technicianId: input.holderKind === 'technician' ? (input.technicianId ?? null) : null,
    state,
    trade: input.trade,
    kbLicenceTypeId: input.kbLicenceTypeId ?? null,
    customTypeName: input.customTypeName ?? null,
    licenceNumber: input.licenceNumber ?? null,
    issuedOn: input.issuedOn ?? null,
    expiresOn: input.expiresOn ?? derivedExpiry,
    expirySource: input.expiresOn ? 'entered' : derivedExpiry ? 'derived' : 'entered',
    notes: input.notes ?? null,
  });

  const derivation = await deriveForLicence(db, id, {
    today: options.today,
    userId: input.actorUserId ?? null,
  });

  await track(db, {
    name: 'licence_created',
    orgId: input.orgId,
    ...(input.actorUserId ? { userId: input.actorUserId } : {}),
    props: {
      state,
      trade: input.trade,
      expiry_source: input.expiresOn ? 'entered' : derivedExpiry ? 'derived' : 'entered',
      covered: getKbRecord(state, input.trade) !== null,
    },
  });
  if (!getKbRecord(state, input.trade)) {
    await track(db, { name: 'uncovered_state_licence_created', orgId: input.orgId, props: { state, trade: input.trade } });
  }
  if (derivation.result.expiryConflict) {
    await track(db, {
      name: 'licence_expiry_conflict_shown',
      orgId: input.orgId,
      props: derivation.result.expiryConflict,
    });
  }

  await recordAudit(db, {
    orgId: input.orgId,
    actorUserId: input.actorUserId ?? null,
    action: 'licence_created',
    entityTable: 'licences',
    entityId: id,
    after: { state, trade: input.trade, licenceNumber: input.licenceNumber ?? null },
  });

  const [licence] = await db.select().from(licences).where(eq(licences.id, id)).limit(1);
  return { licence: licence as Licence, derivation };
}

export async function updateLicence(
  db: Db,
  input: { orgId: string; licenceId: string; patch: Partial<CreateLicenceInput>; actorUserId?: string | null },
  options: { today: string },
) {
  const [before] = await db
    .select()
    .from(licences)
    .where(and(eq(licences.id, input.licenceId), eq(licences.orgId, input.orgId)))
    .limit(1);
  if (!before) throw new Error('no such licence');

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.patch.licenceNumber !== undefined) patch['licenceNumber'] = input.patch.licenceNumber;
  if (input.patch.issuedOn !== undefined) patch['issuedOn'] = input.patch.issuedOn;
  if (input.patch.expiresOn !== undefined) {
    patch['expiresOn'] = input.patch.expiresOn;
    patch['expirySource'] = input.patch.expiresOn ? 'entered' : 'derived';
  }
  if (input.patch.notes !== undefined) patch['notes'] = input.patch.notes;
  if (input.patch.kbLicenceTypeId !== undefined) patch['kbLicenceTypeId'] = input.patch.kbLicenceTypeId;

  await db.update(licences).set(patch).where(eq(licences.id, input.licenceId));
  const derivation = await deriveForLicence(db, input.licenceId, {
    today: options.today,
    userId: input.actorUserId ?? null,
  });

  await recordAudit(db, {
    orgId: input.orgId,
    actorUserId: input.actorUserId ?? null,
    action: 'licence_updated',
    entityTable: 'licences',
    entityId: input.licenceId,
    before,
    after: patch,
  });
  await track(db, { name: 'licence_updated', orgId: input.orgId, props: { fields: Object.keys(patch) } });
  return derivation;
}

/** Archive, never delete. The record and its documents stay. */
export async function archiveLicence(db: Db, input: { orgId: string; licenceId: string; actorUserId?: string | null }) {
  await db
    .update(licences)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(licences.id, input.licenceId), eq(licences.orgId, input.orgId)));
  await recordAudit(db, {
    orgId: input.orgId,
    actorUserId: input.actorUserId ?? null,
    action: 'licence_archived',
    entityTable: 'licences',
    entityId: input.licenceId,
  });
  await track(db, { name: 'licence_archived', orgId: input.orgId });
}

export async function listLicences(db: Db, orgId: string) {
  return db
    .select()
    .from(licences)
    .where(and(eq(licences.orgId, orgId), eq(licences.status, 'active')))
    .orderBy(desc(licences.createdAt));
}

export async function getLicence(db: Db, orgId: string, licenceId: string) {
  const rows = await db
    .select()
    .from(licences)
    .where(and(eq(licences.id, licenceId), eq(licences.orgId, orgId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Soft duplicate warning on `state + licenceNumber` — never a hard block: some
 *  boards reuse numbers across classes (`specs/04` §Edge cases). */
export async function possibleDuplicates(db: Db, orgId: string, state: string, licenceNumber: string) {
  if (!licenceNumber) return [];
  return db
    .select()
    .from(licences)
    .where(
      and(
        eq(licences.orgId, orgId),
        eq(licences.state, state.toUpperCase()),
        eq(licences.licenceNumber, licenceNumber),
        eq(licences.status, 'active'),
      ),
    );
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function uploadDocument(
  db: Db,
  store: DocumentStore,
  input: {
    orgId: string;
    licenceId: string;
    filename: string;
    body: Uint8Array;
    declaredContentType?: string;
    uploadedByUserId?: string | null;
  },
) {
  if (input.body.byteLength > MAX_DOCUMENT_BYTES) {
    const mb = Math.round(input.body.byteLength / (1024 * 1024));
    throw new Error(`That file is ${mb} MB. The limit is 20 MB — a phone photo is usually under 5.`);
  }
  // The extension is a claim; the magic number is evidence.
  const sniffed = sniffContentType(input.body);
  if (!sniffed || !(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(sniffed)) {
    throw new Error('We can take a photo or a PDF.');
  }

  const stored = await store.put({
    orgId: input.orgId,
    filename: input.filename,
    contentType: sniffed,
    body: input.body,
  });
  const id = newId('doc');
  await db.insert(licenceDocuments).values({
    id,
    orgId: input.orgId,
    licenceId: input.licenceId,
    filename: input.filename,
    contentType: stored.contentType,
    byteSize: stored.byteSize,
    storageKey: stored.key,
    sha256: stored.sha256,
    uploadedByUserId: input.uploadedByUserId ?? null,
  });
  await track(db, { name: 'document_uploaded', orgId: input.orgId, props: { contentType: sniffed } });
  return { id, ...stored };
}

export async function listDocuments(db: Db, orgId: string, licenceId: string) {
  return db
    .select()
    .from(licenceDocuments)
    .where(and(eq(licenceDocuments.orgId, orgId), eq(licenceDocuments.licenceId, licenceId)));
}

// ---------------------------------------------------------------------------
// CE records
// ---------------------------------------------------------------------------

export async function addCeRecord(
  db: Db,
  input: {
    orgId: string;
    licenceId: string;
    hours: number;
    subject?: string | null;
    deliveryMode?: 'classroom' | 'online' | 'unknown';
    provider?: string | null;
    completedOn: string;
    actorUserId?: string | null;
  },
) {
  if (!(input.hours > 0 && input.hours <= 100)) throw new Error('CE hours must be between 0 and 100 per record.');
  const id = newId('ceh');
  await db.insert(ceRecords).values({
    id,
    orgId: input.orgId,
    licenceId: input.licenceId,
    hours: String(input.hours),
    subject: input.subject ?? null,
    deliveryMode: input.deliveryMode ?? 'unknown',
    provider: input.provider ?? null,
    completedOn: input.completedOn,
  });
  await db
    .update(licences)
    .set({ ceHoursRecorded: sql`${licences.ceHoursRecorded} + ${String(input.hours)}`, updatedAt: new Date() })
    .where(eq(licences.id, input.licenceId));
  await track(db, { name: 'ce_record_added', orgId: input.orgId, props: { hours: input.hours } });
  await recordAudit(db, {
    orgId: input.orgId,
    actorUserId: input.actorUserId ?? null,
    action: 'ce_record_added',
    entityTable: 'ce_records',
    entityId: id,
    after: { hours: input.hours, subject: input.subject ?? null },
  });
  return id;
}

export async function listCeRecords(db: Db, orgId: string, licenceId: string) {
  return db
    .select()
    .from(ceRecords)
    .where(and(eq(ceRecords.orgId, orgId), eq(ceRecords.licenceId, licenceId)));
}
