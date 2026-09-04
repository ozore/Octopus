/**
 * STEP 5 — the first certificate, and the honest seam where M4 is not yet
 * wired.
 *
 * `specs/11` step 5 is "upload one PDF for one vendor (M4) → extraction →
 * review if needed", and M4's extractor belongs to another agent in this
 * sub-wave. Rather than block the whole onboarding path on it, this module owns
 * the parts that are NOT the model call — the document row, the certificate
 * row, the comparison and the activation — behind one function, and takes the
 * extraction from a `reader` it is given.
 *
 * IN MOCK MODE ONLY, the reader is a STUB (`stubReader`) that returns an
 * authored record shaped like the extractor's output, so `next dev`, the
 * Playwright journey and a founder demo can reach the finding screen. Two rules
 * keep that honest:
 *
 *  1. it is refused unless `ADAPTER_MODE=mock`, which `env.ts` refuses in
 *     production — the same guard that stops fake billing reaching a deploy;
 *  2. the screen SAYS so, in words, where the reading is shown.
 *
 * `specs/11` §4's "no sample data, ever" is about seeding a customer's account
 * with a demo vendor and a demo certificate. This is not that: the vendor is
 * theirs, the document is the one they uploaded, and only the READING is
 * stubbed while the reader is missing.
 */

import { createHash } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { writeAuditEvent, type AuditActor } from '@/lib/audit';
import type { Db } from '@/lib/db';
import type { CoiExtraction, ComparisonResult } from '@/lib/engine';
import { newId } from '@/lib/ids';
import { runComparison } from '@/lib/repos';
import { certificates, documents, extractions, vendors } from '@/lib/schema';
import { assertUploadable, documentKey, getDocumentStore } from '@/lib/storage/document-store';
import { markActivated } from './repo';

export type CertificateReader = (input: {
  vendorName: string;
  today: string;
  bytes: Uint8Array;
  mime: string;
}) => Promise<{ payload: CoiExtraction; status: 'ready' | 'needs_review'; model: string }>;

/**
 * The stub reader. It produces the record a real ACORD 25 for this vendor would
 * produce IF it carried the three findings the product exists to show —
 * a limit that clears, a tick with no endorsement page behind it, and a missing
 * waiver — so the finding screen exercises all three states.
 */
export function stubReader(): CertificateReader {
  return async ({ vendorName, today }) => {
    const { demoSample } = await import('@/lib/demo/fixtures');
    const sample = demoSample('cleaner', today);
    const payload: CoiExtraction = {
      ...sample.extraction,
      insured: { ...sample.extraction.insured, name: { ...sample.extraction.insured.name, value: vendorName, raw: vendorName, source_text: vendorName } },
      notes: 'Stub reading: the extractor is not configured in this environment.',
    };
    return { payload, status: 'ready', model: 'stub' };
  };
}

export type IngestResult =
  | { status: 'rejected'; reason: string }
  | {
      status: 'ok';
      documentId: string;
      certificateId: string;
      comparisonId: string;
      result: ComparisonResult;
      activation: Awaited<ReturnType<typeof markActivated>>;
      needsReview: boolean;
    };

export type IngestInput = {
  db: Db;
  orgId: string;
  vendorId: string;
  actor: AuditActor;
  file: { bytes: Uint8Array; mime: string; name: string };
  today: string;
  reader: CertificateReader;
  uploadedBy?: string | null;
};

/**
 * One certificate, end to end: store → record → read → compare → activate.
 *
 * The order matters. The document row is written BEFORE the reading, so a
 * failed read leaves an uploaded document the customer can retry against rather
 * than a silent nothing (§10: a failed extraction keeps the vendor and offers
 * re-upload).
 */
export async function ingestFirstCertificate(input: IngestInput): Promise<IngestResult> {
  const { db } = input;
  try {
    assertUploadable(input.file.mime, input.file.bytes.byteLength);
  } catch (error) {
    return { status: 'rejected', reason: (error as Error).message };
  }

  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, input.vendorId))
    .limit(1);
  if (!vendor || vendor.orgId !== input.orgId) {
    return { status: 'rejected', reason: 'That vendor is not in this account.' };
  }

  const sha256 = createHash('sha256').update(input.file.bytes).digest('hex');
  const key = documentKey({ orgId: input.orgId }, sha256, input.file.mime);
  await getDocumentStore().put(key, input.file.bytes, input.file.mime);

  const documentId = newId('document');
  await db
    .insert(documents)
    .values({
      id: documentId,
      orgId: input.orgId,
      vendorId: input.vendorId,
      storageKey: key,
      mime: input.file.mime,
      bytes: input.file.bytes.byteLength,
      sha256,
      source: 'app',
      uploadedBy: input.uploadedBy ?? null,
    })
    // The same certificate uploaded twice is ONE document and one model call.
    .onConflictDoNothing({ target: [documents.orgId, documents.sha256] });

  const [stored] = await db.select().from(documents).where(eq(documents.sha256, sha256)).limit(1);
  const realDocumentId = stored?.id ?? documentId;

  await writeAuditEvent(db, {
    orgId: input.orgId,
    actor: input.actor,
    kind: 'document.uploaded',
    subjectType: 'document',
    subjectId: realDocumentId,
    payload: { vendorName: vendor.name, filename: input.file.name, bytes: input.file.bytes.byteLength },
  });

  const read = await input.reader({
    vendorName: vendor.name,
    today: input.today,
    bytes: input.file.bytes,
    mime: input.file.mime,
  });

  const extractionId = newId('extraction');
  await db.insert(extractions).values({
    id: extractionId,
    documentId: realDocumentId,
    orgId: input.orgId,
    status: read.status,
    model: read.model,
    promptHash: 'stub',
    payload: read.payload,
  });

  const certificateId = newId('certificate');
  await db.insert(certificates).values({
    id: certificateId,
    orgId: input.orgId,
    vendorId: input.vendorId,
    documentId: realDocumentId,
    extractionId,
    formEdition: read.payload.form_edition,
    certificateDate: read.payload.certificate_date.value,
    insuredName: read.payload.insured.name.value,
    certificateHolder: read.payload.certificate_holder.value,
    status: 'active',
  });

  const comparison = await runComparison(db, {
    orgId: input.orgId,
    vendorId: input.vendorId,
    extraction: read.payload,
    evaluationDate: input.today,
    actor: input.actor,
    certificateId,
  });

  if (!comparison) {
    return { status: 'rejected', reason: 'No requirement set is assigned yet, so there is nothing to compare against.' };
  }

  // A5: activation waits for the extraction to be out of review. A8b: a clean
  // portfolio activates too — zero gaps is an activation, not a failure.
  const activation = await markActivated(db, {
    orgId: input.orgId,
    certificateId,
    gapsFound: comparison.result.gapCount,
    reviewCleared: read.status === 'ready',
  });

  return {
    status: 'ok',
    documentId: realDocumentId,
    certificateId,
    comparisonId: comparison.comparisonId,
    result: comparison.result,
    activation,
    needsReview: read.status === 'needs_review',
  };
}
