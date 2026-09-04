/**
 * M4's repository — documents, extractions, corrections, promotion.
 *
 * A new file rather than more of `src/lib/repos.ts`: BUILD.md §1 asks for
 * `src/lib/repos/<module>.ts` rather than growing the shared one past
 * readability, and this module is the only place M4 writes SQL.
 *
 * Every read is org-scoped and a cross-org read returns nothing, which the
 * caller turns into a 404 rather than a 403 (`specs/01` A6).
 */

import { and, desc, eq, gte, sql } from 'drizzle-orm';

import { writeAuditEvent, type AuditActor } from '../audit';
import type { Db } from '../db';
import { parseMoney, type CoiExtraction } from '../engine';
import { newId } from '../ids';
import {
  certificateInsurers,
  certificates,
  coverageLimits,
  coverages,
  documents,
  extractions,
  fieldCorrections,
} from '../schema';

export type DocumentRow = typeof documents.$inferSelect;
export type ExtractionRow = typeof extractions.$inferSelect;

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function findDocumentBySha(
  db: Db,
  orgId: string,
  sha256: string,
): Promise<DocumentRow | null> {
  const [row] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.orgId, orgId), eq(documents.sha256, sha256)));
  return row ?? null;
}

export async function getDocument(
  db: Db,
  orgId: string,
  documentId: string,
): Promise<DocumentRow | null> {
  const [row] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.orgId, orgId), eq(documents.id, documentId)));
  return row ?? null;
}

export type CreateDocumentInput = {
  orgId: string;
  vendorId?: string | null;
  storageKey: string;
  mime: string;
  bytes: number;
  sha256: string;
  pageCount?: number | null;
  source?: 'app' | 'link' | 'inbound';
  pdfProducer?: string | null;
  pdfCreator?: string | null;
  uploadedBy?: string | null;
  filename?: string;
  actor: AuditActor;
  vendorName?: string | null;
};

/**
 * Returns `{ documentId, duplicate }`. A per-org sha collision RETURNS THE
 * EXISTING DOCUMENT and bills no model call (`specs/03` A9) — the unique index
 * `documents_org_sha` is what makes that a fact rather than a race.
 */
export async function createDocument(
  db: Db,
  input: CreateDocumentInput,
): Promise<{ documentId: string; duplicate: boolean }> {
  const existing = await findDocumentBySha(db, input.orgId, input.sha256);
  if (existing) {
    await writeAuditEvent(db, {
      orgId: input.orgId,
      actor: input.actor,
      kind: 'document.duplicate',
      subjectType: 'document',
      subjectId: existing.id,
      payload: { filename: input.filename ?? 'a document', vendorName: input.vendorName ?? null },
    });
    return { documentId: existing.id, duplicate: true };
  }

  const id = newId('document');
  await db.insert(documents).values({
    id,
    orgId: input.orgId,
    vendorId: input.vendorId ?? null,
    kind: 'coi',
    storageKey: input.storageKey,
    mime: input.mime,
    bytes: input.bytes,
    pageCount: input.pageCount ?? null,
    sha256: input.sha256,
    source: input.source ?? 'app',
    pdfProducer: input.pdfProducer ?? null,
    pdfCreator: input.pdfCreator ?? null,
    uploadedBy: input.uploadedBy ?? null,
  });

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'document.uploaded',
    subjectType: 'document',
    subjectId: id,
    payload: { filename: input.filename ?? 'a document', vendorName: input.vendorName ?? null },
  });
  return { documentId: id, duplicate: false };
}

// ---------------------------------------------------------------------------
// Extractions
// ---------------------------------------------------------------------------

export type SaveExtractionInput = {
  orgId: string;
  documentId: string;
  status: 'pending' | 'running' | 'needs_review' | 'ready' | 'rejected' | 'failed';
  model: string;
  promptHash: string;
  schemaVersion: string;
  payload?: CoiExtraction | null;
  docConfidence?: number | null;
  gateFailures?: number;
  usage?: { input: number; output: number; cacheRead: number } | null;
  costCents?: number | null;
  durationMs?: number | null;
  failureReason?: string | null;
};

export async function saveExtraction(db: Db, input: SaveExtractionInput): Promise<string> {
  const id = newId('extraction');
  await db.insert(extractions).values({
    id,
    documentId: input.documentId,
    orgId: input.orgId,
    status: input.status,
    model: input.model,
    schemaVersion: input.schemaVersion,
    promptHash: input.promptHash,
    payload: input.payload ?? null,
    // `numeric` columns take strings through drizzle-orm; passing a number here
    // is how a 0.85 silently becomes "0.85000000000000004" on some drivers.
    docConfidence: input.docConfidence === null || input.docConfidence === undefined
      ? null
      : input.docConfidence.toFixed(3),
    gateFailures: input.gateFailures ?? 0,
    usage: input.usage ?? null,
    costCents:
      input.costCents === null || input.costCents === undefined ? null : input.costCents.toFixed(4),
    durationMs: input.durationMs ?? null,
    failureReason: input.failureReason ?? null,
  });
  return id;
}

export async function getExtraction(
  db: Db,
  orgId: string,
  extractionId: string,
): Promise<ExtractionRow | null> {
  const [row] = await db
    .select()
    .from(extractions)
    .where(and(eq(extractions.orgId, orgId), eq(extractions.id, extractionId)));
  return row ?? null;
}

export async function latestExtraction(
  db: Db,
  orgId: string,
  documentId: string,
): Promise<ExtractionRow | null> {
  const [row] = await db
    .select()
    .from(extractions)
    .where(and(eq(extractions.orgId, orgId), eq(extractions.documentId, documentId)))
    .orderBy(desc(extractions.createdAt))
    .limit(1);
  return row ?? null;
}

/**
 * The spend guard `specs/15` §11 makes a LAUNCH REQUIREMENT: anonymous traffic
 * spending real inference money is the easiest way to lose money on this
 * product. Summed over BOTH owners of the table — the org path and the
 * gap-report path — because the bill does not care which one spent it.
 */
export async function spendCentsSince(db: Db, since: Date): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${extractions.costCents}), 0)` })
    .from(extractions)
    .where(gte(extractions.createdAt, since));
  return Number(row?.total ?? 0);
}

// ---------------------------------------------------------------------------
// Corrections (`specs/03` A8)
// ---------------------------------------------------------------------------

export type CorrectionInput = {
  orgId: string;
  extractionId: string;
  path: string;
  fieldLabel: string;
  wasValue: string | null;
  wasConfidence: number | null;
  wasGate: 'passed' | 'failed' | 'skipped' | null;
  nowValue: string | null;
  correctedBy: string;
  actor: AuditActor;
  /** The payload with the correction applied. Persisted as a NEW extraction. */
  payload: CoiExtraction;
  docConfidence: number;
  gateFailures: number;
  model: string;
  promptHash: string;
  schemaVersion: string;
  documentId: string;
};

/**
 * A human correction is a NEW EXTRACTION VERSION, not an edit.
 *
 * `specs/03` A8 requires the old value, old confidence and old gate state to
 * survive, the model NOT to be re-run, and an audit row to be written. Mutating
 * `extractions.payload` in place would satisfy the letter of the first
 * requirement (the `field_corrections` row holds the old value) and break its
 * point: a report generated before the correction quotes a payload that no
 * longer exists. So the previous row stays exactly as it was, superseded, and
 * the correction produces a new row that carries the human's value forward.
 */
export async function correctField(
  db: Db,
  input: CorrectionInput,
): Promise<{ extractionId: string; correctionId: string }> {
  const correctionId = newId('fieldCorrection');
  const nextExtractionId = await saveExtraction(db, {
    orgId: input.orgId,
    documentId: input.documentId,
    status: 'needs_review',
    model: input.model,
    promptHash: input.promptHash,
    schemaVersion: input.schemaVersion,
    payload: input.payload,
    docConfidence: input.docConfidence,
    gateFailures: input.gateFailures,
    // A correction bills nothing: the model is not re-run.
    costCents: 0,
    durationMs: 0,
  });

  await db.insert(fieldCorrections).values({
    id: correctionId,
    extractionId: nextExtractionId,
    orgId: input.orgId,
    path: input.path,
    wasValue: input.wasValue,
    wasConfidence: input.wasConfidence === null ? null : input.wasConfidence.toFixed(3),
    wasGate: input.wasGate,
    nowValue: input.nowValue,
    correctedBy: input.correctedBy,
  });

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'extraction.field_corrected',
    subjectType: 'extraction',
    subjectId: nextExtractionId,
    payload: {
      fieldLabel: input.fieldLabel,
      wasValue: input.wasValue ?? '(blank)',
      nowValue: input.nowValue ?? '(blank)',
      path: input.path,
      supersedes: input.extractionId,
    },
  });

  return { extractionId: nextExtractionId, correctionId };
}

export async function countCorrections(db: Db, extractionId: string): Promise<number> {
  const rows = await db
    .select({ id: fieldCorrections.id })
    .from(fieldCorrections)
    .where(eq(fieldCorrections.extractionId, extractionId));
  return rows.length;
}

// ---------------------------------------------------------------------------
// Promotion (`specs/03` §2 step 6)
// ---------------------------------------------------------------------------

/**
 * `min(policy_exp)` over the coverages the requirement set REQUIRES — the clock
 * the whole reminder ladder runs on. When no requirement set is known, every
 * dated row counts: a too-early clock asks a vendor sooner than needed, which is
 * survivable; a too-late one lets a lapse through, which is not.
 */
export function earliestRequiredExpiry(
  payload: CoiExtraction,
  requiredCoverages?: readonly string[],
): string | null {
  const dates = payload.coverages
    .filter((row) => !requiredCoverages || requiredCoverages.includes(row.type))
    .map((row) => row.policy_exp.value)
    .filter((d): d is string => Boolean(d))
    .sort();
  return dates[0] ?? null;
}

export type PromoteInput = {
  orgId: string;
  vendorId: string;
  documentId: string;
  extractionId: string;
  payload: CoiExtraction;
  actor: AuditActor;
  vendorName?: string | null;
  requiredCoverages?: readonly string[];
};

export async function promoteCertificate(db: Db, input: PromoteInput): Promise<string> {
  const { payload } = input;

  // The newest active certificate is the vendor's status; the previous one is
  // superseded rather than deleted (`specs/03` §12, A-superseded).
  const superseded = await db
    .update(certificates)
    .set({ status: 'superseded' })
    .where(
      and(
        eq(certificates.orgId, input.orgId),
        eq(certificates.vendorId, input.vendorId),
        eq(certificates.status, 'active'),
      ),
    )
    .returning();

  const certificateId = newId('certificate');
  await db.insert(certificates).values({
    id: certificateId,
    orgId: input.orgId,
    vendorId: input.vendorId,
    documentId: input.documentId,
    extractionId: input.extractionId,
    formEdition: payload.form_edition,
    certificateDate: payload.certificate_date.value,
    insuredName: payload.insured.name.value,
    certificateHolder: payload.certificate_holder.value,
    earliestExpiry: earliestRequiredExpiry(payload, input.requiredCoverages),
    status: 'active',
  });

  if (payload.insurers.length > 0) {
    await db.insert(certificateInsurers).values(
      payload.insurers.map((insurer) => ({
        id: newId('certificateInsurer'),
        certificateId,
        letter: insurer.letter,
        name: insurer.name.value,
        naic: insurer.naic.value,
      })),
    );
  }

  for (const row of payload.coverages) {
    const coverageId = newId('coverage');
    await db.insert(coverages).values({
      id: coverageId,
      certificateId,
      insrLetter: row.insr_letter.value,
      type: row.type,
      typeLabelRaw: row.type_label_raw.value,
      addlInsd: row.addl_insd.value,
      subrWvd: row.subr_wvd.value,
      policyNumber: row.policy_number.value,
      policyEff: row.policy_eff.value,
      policyExp: row.policy_exp.value,
      formBasis: row.form_basis.value,
      aggregateAppliesPer: row.aggregate_applies_per.value,
      wcOfficerExcluded: row.wc_officer_excluded.value,
    });
    if (row.limits.length === 0) continue;
    await db.insert(coverageLimits).values(
      row.limits.map((limit) => {
        // `raw` is notNull and it is what stops `Excluded` becoming `$0`.
        // `parseMoney` is the ONE place that decision is made, so M4's
        // normalisation and M5's SIR check cannot disagree.
        const raw = limit.amount.raw ?? limit.amount.value?.toString() ?? '';
        const parsed = parseMoney(raw);
        return {
          id: newId('coverageLimit'),
          coverageId,
          label: limit.label,
          labelRaw: limit.label_raw.value ?? limit.label_raw.raw ?? limit.label,
          amount: limit.amount.value ?? parsed.amount,
          raw,
        };
      }),
    );
  }

  for (const id of superseded) {
    await writeAuditEvent(db, {
      orgId: input.orgId,
      actor: input.actor,
      kind: 'certificate.superseded',
      subjectType: 'certificate',
      subjectId: id.id,
      payload: { vendorName: input.vendorName ?? null },
    });
  }
  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'certificate.promoted',
    subjectType: 'certificate',
    subjectId: certificateId,
    payload: {
      vendorName: input.vendorName ?? null,
      formEdition: payload.form_edition,
      coverages: payload.coverages.length,
    },
  });

  return certificateId;
}

export async function activeCertificate(db: Db, orgId: string, vendorId: string) {
  const [row] = await db
    .select()
    .from(certificates)
    .where(
      and(
        eq(certificates.orgId, orgId),
        eq(certificates.vendorId, vendorId),
        eq(certificates.status, 'active'),
      ),
    )
    .orderBy(desc(certificates.createdAt))
    .limit(1);
  return row ?? null;
}
