/**
 * THE RENDER JOB AND THE PURGE JOB — `specs/15` §2 steps 4-5, §6, A5, A6, A7.
 *
 * `OFFER.md` promises "no storage of their file beyond the report". Implemented
 * literally, and tighter than the first draft:
 *
 *   - **the source documents are deleted from storage INSIDE this job**, as
 *     soon as the report is rendered, and `storageDeletedAt` records it. A
 *     subsequent read of those keys 404s (A6). `offer/RESEARCH.md` §7 asked
 *     for "processed in memory"; the property it actually wanted — *the file
 *     does not outlive the job* — is preserved here and is TESTABLE rather
 *     than assumed;
 *   - **the producer's contact name, phone, fax and e-mail are never persisted
 *     at all** — `stripProducerContact` runs between the model response and the
 *     insert, and `writeGapExtraction` refuses a payload that skipped it;
 *   - the extraction payload is kept, because it is what the report is made of
 *     and the visitor has to be able to re-open their own report; it and the
 *     rendered report go at **7 days**, not 30.
 *
 * Steps 4-5 run in the queue, so **a visitor who closes the tab still gets the
 * email** (A5). That is the whole reason this is a job and not a request.
 */

import { eq, inArray } from 'drizzle-orm';

import type { Adapters } from '@octopus/platform/adapters';
import { track } from '@octopus/platform/events';

import { getEnv } from '../../env';
import type { Db } from '../db';
import { orgToday, type CoiExtraction, type RequirementSet } from '../engine';
import { newId } from '../ids';
import { disclaimers } from '../kb/disclaimers';
import { extractions, gapReportDocuments, gapReportSessions } from '../schema';
import { getDocumentStore } from '../storage/document-store';

import { getCoiExtractor, REVIEW_REASONS, type GapExtractionOutcome } from './extraction';
import { buildGapReport, renderReportText, type GapReport, type ReportDocumentInput } from './report';
import { listSessionDocuments, type GapSessionRow } from './sessions';
import { carriesProducerContact, stripProducerContact } from './strip';

/**
 * Persist one gap-report extraction.
 *
 * `orgId` and `documentId` are BOTH null and `gapReportDocumentId` is set —
 * the other half of the schema's one-owner CHECK (`specs/15` §5, A7d). The
 * refusal below is a belt: `stripProducerContact` is the braces, and the day
 * somebody adds a second write path this is the line that stops it.
 */
export async function writeGapExtraction(
  db: Db,
  input: { gapReportDocumentId: string; outcome: GapExtractionOutcome; payload: CoiExtraction | null },
): Promise<string> {
  if (carriesProducerContact(input.payload)) {
    throw new Error(
      'refusing to store a gap-report extraction that still carries producer contact data (specs/15 §5.1)',
    );
  }
  const id = newId('extraction');
  await db.insert(extractions).values({
    id,
    documentId: null,
    gapReportDocumentId: input.gapReportDocumentId,
    orgId: null,
    status: input.outcome.status === 'rejected' ? 'rejected' : input.outcome.status,
    model: input.outcome.model,
    schemaVersion: input.outcome.schemaVersion,
    promptHash: input.outcome.promptHash,
    payload: input.payload,
    // `numeric` takes strings through drizzle; a raw number is how 0.85
    // silently becomes "0.85000000000000004" on some drivers.
    docConfidence: input.outcome.docConfidence === null ? null : input.outcome.docConfidence.toFixed(3),
    gateFailures: input.outcome.gateFailures,
    costCents: input.outcome.costCents.toFixed(4),
    durationMs: input.outcome.durationMs,
    failureReason: input.outcome.reason,
  });
  return id;
}

export type RenderResult = {
  sessionId: string;
  status: 'ready' | 'nothing_readable' | 'not_found' | 'already_ready';
  report: GapReport | null;
  reportKey: string | null;
  deletedKeys: string[];
  costCents: number;
};

/**
 * Read every document in the session, compare the readable ones, build the
 * report, delete the source files, and email it.
 */
export async function renderGapReport(
  db: Db,
  adapters: Adapters,
  input: { sessionId: string; now?: Date },
): Promise<RenderResult> {
  const now = input.now ?? new Date();
  const env = getEnv();
  const started = Date.now();

  const [session] = await db.select().from(gapReportSessions).where(eq(gapReportSessions.id, input.sessionId));
  if (!session) return { sessionId: input.sessionId, status: 'not_found', report: null, reportKey: null, deletedKeys: [], costCents: 0 };
  if (session.status === 'ready' || session.status === 'purged') {
    return { sessionId: session.id, status: 'already_ready', report: null, reportKey: session.reportKey, deletedKeys: [], costCents: 0 };
  }

  const documents = await listSessionDocuments(db, session.id);
  const extractor = getCoiExtractor();
  const store = getDocumentStore();
  const inputs: ReportDocumentInput[] = [];
  let costCents = 0;

  for (const document of documents) {
    await db.update(gapReportDocuments).set({ status: 'extracting' }).where(eq(gapReportDocuments.id, document.id));

    let outcome: GapExtractionOutcome;
    try {
      outcome = await extractor.extract({
        storageKey: document.storageKey,
        mime: document.mime,
        bytes: document.bytes,
        sha256: document.sha256,
        originalFilename: document.originalFilename,
      });
    } catch (error) {
      outcome = {
        status: 'needs_review',
        payload: null,
        reason: REVIEW_REASONS.unreadable,
        model: 'unavailable',
        promptHash: 'unavailable',
        schemaVersion: 'coi.v1',
        docConfidence: null,
        gateFailures: 0,
        costCents: 0,
        durationMs: 0,
      };
      console.warn(`[gap-report] extraction failed for ${document.id}:`, error);
    }

    // THE STRIP STEP — between the model response and the database, on this
    // path and only on this path (§5.1).
    const payload = outcome.payload ? stripProducerContact(outcome.payload) : null;
    costCents += outcome.costCents;

    const insuredNameRead = payload?.insured?.name?.value ?? null;
    await writeGapExtraction(db, { gapReportDocumentId: document.id, outcome, payload });
    await db
      .update(gapReportDocuments)
      .set({ status: outcome.status === 'failed' ? 'needs_review' : outcome.status, insuredNameRead })
      .where(eq(gapReportDocuments.id, document.id));

    inputs.push({
      documentId: document.id,
      originalFilename: document.originalFilename,
      insuredNameRead,
      status: outcome.status === 'failed' ? 'needs_review' : outcome.status,
      reason: outcome.reason,
      payload,
    });
  }

  const requirementSet = (session.requirementsSnapshot ?? null) as RequirementSet | null;
  const report = buildGapReport({
    documents: inputs,
    // The snapshot written at session creation, never the live library: a
    // report re-opened next week must say what it said (§8).
    requirementSet: requirementSet ?? { id: 'none', name: 'no template', audience: 'pm', version: 0, requirements: [] },
    templateName: requirementSet?.name ?? 'a baseline requirement set',
    evaluationDate: orgToday('UTC', now),
  });

  // The artefact. It is stored under the session's own prefix, which is outside
  // every org, and it is deleted with the session at seven days.
  const text = renderReportText(report, env.APP_NAME, disclaimers.primary);
  const reportKey = `gap/${session.id}/report.txt`;
  await store.put(reportKey, new TextEncoder().encode(text), 'text/plain');

  // A6 — THE SOURCE FILES ARE DELETED INSIDE THIS JOB, before it returns, and
  // `storageDeletedAt` records that it happened.
  const deletedKeys: string[] = [];
  for (const document of documents) {
    try {
      await store.delete(document.storageKey);
    } catch {
      // A key that is already gone is the state we want; keep going.
    }
    deletedKeys.push(document.storageKey);
  }
  if (documents.length > 0) {
    await db
      .update(gapReportDocuments)
      .set({ storageDeletedAt: now })
      .where(
        inArray(
          gapReportDocuments.id,
          documents.map((document) => document.id),
        ),
      );
  }

  await db
    .update(gapReportSessions)
    .set({
      status: 'ready',
      readyAt: now,
      reportKey,
      documentCount: documents.length,
      extractedCount: report.comparedCount + report.needsReviewCount,
      comparedCount: report.comparedCount,
      needsReviewCount: report.needsReviewCount,
      rejectedCount: report.rejectedCount,
    })
    .where(eq(gapReportSessions.id, session.id));

  await track(db, {
    name: 'gap_report_ready',
    props: {
      documents: documents.length,
      extracted: report.comparedCount + report.needsReviewCount,
      compared: report.comparedCount,
      needs_review: report.needsReviewCount,
      rejected: report.rejectedCount,
      expired_found: report.expiredCount,
      gaps_found: report.gapCount,
      asserted_only_found: report.assertedOnlyCount,
      cost_cents: costCents,
      ms: Date.now() - started,
    },
  });

  if (session.email) {
    await emailReport(adapters, {
      to: session.email,
      appName: env.APP_NAME,
      companyAddress: env.COMPANY_ADDRESS,
      report,
      text,
    });
    await track(db, { name: 'gap_report_emailed' });
  }

  return {
    sessionId: session.id,
    status: report.comparedCount === 0 ? 'nothing_readable' : 'ready',
    report,
    reportKey,
    deletedKeys,
    costCents,
  };
}

/**
 * The email. It carries the finding itself rather than only a link, because
 * §1's promise is that the visitor **keeps the report whether or not they ever
 * sign up** — and a link that expires in seven days is not something you keep.
 *
 * The single conversion CTA lives on the PAGE, under the finding (§3). It is
 * not in this message.
 *
 * IT CARRIES NO LINK BACK TO THE REPORT, and that is a decision. The raw
 * session token exists only in the visitor's own URL — the row holds its hash —
 * so putting a link in this email would mean passing the token through the job
 * payload and storing a live capability at rest in `jobs`. The report itself is
 * in the message, which is what the visitor was promised they get to keep.
 */
async function emailReport(
  adapters: Adapters,
  input: {
    to: string;
    appName: string;
    companyAddress: string;
    report: GapReport;
    text: string;
  },
): Promise<void> {
  const subject =
    input.report.comparedCount === 0
      ? `We could not read the certificates you sent`
      : `Your ${input.appName} gap report: ${input.report.comparedCount} certificates read`;
  await adapters.email.send({
    to: input.to,
    subject,
    text: `${input.text}\n\n—\n${input.appName}\n${input.companyAddress}\n`,
    html: `<pre style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.5;white-space:pre-wrap">${input.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</pre>`,
  });
}

export type PurgeResult = { purged: number; keysDeleted: number };

/**
 * THE 7-DAY PURGE — §6, A7.
 *
 * The session, the extraction payloads and the rendered report are HARD
 * deleted. Not archived, not soft-deleted: the point of the promise printed
 * next to the drop zone is that the row is gone.
 *
 * A converted session is skipped — its data was migrated into the new org at
 * signup and is that org's now.
 */
export async function purgeGapReports(db: Db, input: { now?: Date; limit?: number } = {}): Promise<PurgeResult> {
  const now = input.now ?? new Date();
  const store = getDocumentStore();
  const { sessionsToPurge } = await import('./sessions');
  const sessions = await sessionsToPurge(db, now, input.limit ?? 200);

  let keysDeleted = 0;
  for (const session of sessions) {
    // Everything under the session's own storage prefix goes, which catches the
    // rendered report and any source file a failed render left behind.
    for (const object of await store.list(`gap/${session.id}/`)) {
      try {
        await store.delete(object.key);
        keysDeleted += 1;
      } catch {
        // Already gone is the desired state.
      }
    }
    // `gap_report_documents` cascades to `extractions` through the
    // `gap_report_document_id` foreign key, and the session cascades to the
    // documents — so one delete is the whole subtree.
    await db.delete(gapReportSessions).where(eq(gapReportSessions.id, session.id));
  }
  return { purged: sessions.length, keysDeleted };
}
