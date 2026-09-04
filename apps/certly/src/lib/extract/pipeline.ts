/**
 * The extraction pipeline — `specs/03` §2, steps 1 to 5, with no database in it.
 *
 * Keeping the pipeline free of I/O is what lets the golden-set eval run the REAL
 * pipeline over the REAL fixtures on every commit, offline, in milliseconds. The
 * job wrapper in `job.ts` is the only part that touches Postgres or the blob
 * store, and it is thin enough to read in one sitting.
 *
 *   bytes → page text + page count (pdf.ts)
 *         → one structured model call, PDF or image straight to the API
 *         → Zod parse, one retry on a schema violation
 *         → quote gate per field (quote-gate.ts)
 *         → per-field confidence, doc_confidence, needs_review (confidence.ts)
 *         → an extraction, ready to persist
 *
 * `specs/03` §5: ONE call. No tools, no citations, no agent loop.
 */

import type { CoiExtraction, RequirementSet } from '../engine';

import {
  ModelRefusalError,
  ModelTransportError,
  ModelTruncationError,
  type ExtractionAdapter,
  type ModelDocument,
  type ModelUsage,
  type StructuredRequest,
} from './adapters/anthropic';
import { assess, type Assessment } from './confidence';
import { costCents } from './cost';
import { certificateDateOutOfRange } from './dates';
import {
  EncryptedPdfError,
  imageFacts,
  looksLikePdf,
  readPdf,
  UnreadablePdfError,
  type PdfFacts,
} from './pdf';
import { DOCUMENT_CONTEXT, DOCUMENT_TITLE, EXTRACT_INSTRUCTION, EXTRACTION_PREFIX, promptHash } from './prompt';
import { COI_SCHEMA, COI_SCHEMA_NAME, SCHEMA_VERSION, safeParseCoi } from './schema';
import { MAX_PAGES } from '../storage/document-store';

export const MAX_TOKENS = 8_000;
/** `specs/03` §12: on `max_tokens`, retry once at a higher ceiling, then fail. */
export const MAX_TOKENS_RETRY = 16_000;
export const EFFORT = 'medium' as const;

export type FailureReason =
  | 'encrypted'
  | 'unreadable'
  | 'too_many_pages'
  | 'schema'
  | 'refusal'
  | 'transport'
  | 'truncated';

export type ExtractionOutcome =
  | {
      status: 'needs_review' | 'ready';
      payload: CoiExtraction;
      assessment: Assessment;
      pageTexts: string[];
      pdf: PdfFacts;
      model: string;
      usage: ModelUsage;
      costCents: number;
      durationMs: number;
      promptHash: string;
      schemaVersion: string;
      attempts: number;
    }
  | {
      status: 'rejected';
      /** What we think it is, for the sentence the screen shows (`specs/03` A5). */
      documentKind: string;
      payload: CoiExtraction;
      pdf: PdfFacts;
      model: string;
      usage: ModelUsage;
      costCents: number;
      durationMs: number;
      promptHash: string;
      schemaVersion: string;
      attempts: number;
    }
  | {
      status: 'failed';
      reason: FailureReason;
      detail: string;
      /** Present when the failure happened after a billable call. */
      usage?: ModelUsage;
      costCents?: number;
      durationMs: number;
      model: string;
      promptHash: string;
      schemaVersion: string;
      attempts: number;
    };

export type ExtractInput = {
  bytes: Uint8Array;
  mime: string;
  adapter: ExtractionAdapter;
  model: string;
  /** Resolved from the vendor. `null` on the anonymous gap-report path. */
  requirementSet?: RequirementSet | null;
  vendorName?: string | null;
  /** Mock-mode key for the recorded response. Never sent to the API. */
  recordingId?: string;
  /** The org's local today, `YYYY-MM-DD` — for the certificate-date range check. */
  today?: string;
  now?: () => number;
};

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function toModelDocument(bytes: Uint8Array, mime: string): ModelDocument {
  return {
    kind: mime === 'application/pdf' ? 'pdf' : 'image',
    mediaType: mime,
    data: toBase64(bytes),
    title: DOCUMENT_TITLE,
    context: DOCUMENT_CONTEXT,
  };
}

export async function extract(input: ExtractInput): Promise<ExtractionOutcome> {
  const clock = input.now ?? (() => Date.now());
  const started = clock();
  const hash = promptHash();
  const base = {
    model: input.model,
    promptHash: hash,
    schemaVersion: SCHEMA_VERSION,
  };

  // --- 0. Read the document ------------------------------------------------
  let pdf: PdfFacts;
  if (input.mime === 'application/pdf') {
    if (!looksLikePdf(input.bytes)) {
      return {
        ...base,
        status: 'failed',
        reason: 'unreadable',
        detail: 'the file does not begin with %PDF',
        durationMs: clock() - started,
        attempts: 0,
      };
    }
    try {
      pdf = await readPdf(input.bytes);
    } catch (error) {
      const reason: FailureReason = error instanceof EncryptedPdfError ? 'encrypted' : 'unreadable';
      return {
        ...base,
        status: 'failed',
        reason,
        detail: error instanceof UnreadablePdfError ? String(error.cause_) : (error as Error).message,
        durationMs: clock() - started,
        attempts: 0,
      };
    }
    if (pdf.pageCount > MAX_PAGES) {
      // Refused BEFORE the model call: `specs/03` §10 wants the user told this
      // looks like a package, and no model call billed for a package.
      return {
        ...base,
        status: 'failed',
        reason: 'too_many_pages',
        detail: `${pdf.pageCount} pages`,
        durationMs: clock() - started,
        attempts: 0,
      };
    }
  } else {
    pdf = imageFacts();
  }

  // --- 1-3. One call, structured, with one retry per failure mode ----------
  const request: StructuredRequest = {
    kind: 'structured',
    model: input.model,
    systemPrefix: EXTRACTION_PREFIX,
    maxTokens: MAX_TOKENS,
    effort: EFFORT,
    schemaName: COI_SCHEMA_NAME,
    jsonSchema: COI_SCHEMA,
    documents: [toModelDocument(input.bytes, input.mime)],
    userText: EXTRACT_INSTRUCTION,
    ...(input.recordingId ? { recordingId: input.recordingId } : {}),
  };

  let attempts = 0;
  let usage: ModelUsage | undefined;
  let payload: CoiExtraction | null = null;
  let lastIssues: string[] = [];
  let schemaRetried = false;
  let tokenRetried = false;

  while (payload === null) {
    attempts += 1;
    try {
      const response = await input.adapter.runStructured(request);
      usage = response.usage;
      const parsed = safeParseCoi(response.json);
      if (parsed.ok) {
        payload = parsed.payload;
        break;
      }
      lastIssues = parsed.issues;
      // `specs/03` §2 step 3: ONE retry with the same prompt, then fail.
      if (schemaRetried) {
        return {
          ...base,
          status: 'failed',
          reason: 'schema',
          detail: lastIssues.slice(0, 5).join('; '),
          ...(usage ? { usage, costCents: safeCost(input.model, usage) } : {}),
          durationMs: clock() - started,
          attempts,
        };
      }
      schemaRetried = true;
    } catch (error) {
      if (error instanceof ModelRefusalError) {
        // Never retried in a loop (`specs/03` §12).
        return {
          ...base,
          status: 'failed',
          reason: 'refusal',
          detail: error.category ?? 'unspecified',
          durationMs: clock() - started,
          attempts,
        };
      }
      if (error instanceof ModelTruncationError && !tokenRetried) {
        tokenRetried = true;
        request.maxTokens = MAX_TOKENS_RETRY;
        continue;
      }
      return {
        ...base,
        status: 'failed',
        reason: error instanceof ModelTruncationError ? 'truncated' : 'transport',
        detail: error instanceof ModelTransportError ? `${error.status ?? '-'} ${error.message}` : (error as Error).message,
        durationMs: clock() - started,
        attempts,
      };
    }
  }

  const spend = usage ? safeCost(input.model, usage) : 0;
  const common = {
    ...base,
    payload,
    pdf,
    usage: usage ?? emptyUsage(),
    costCents: spend,
    durationMs: clock() - started,
    attempts,
  };

  // --- 1b. Classification. Anything that is not an ACORD 25 is REJECTED, not
  // parsed — `specs/03` A5, and no certificate row is created.
  if (payload.document_kind !== 'acord_25') {
    return { ...common, status: 'rejected', documentKind: payload.document_kind };
  }

  // --- 4-5. Gate, confidence, review decision -----------------------------
  const assessment = assess({
    payload,
    pageTexts: pdf.pageTexts,
    requirementSet: input.requirementSet ?? null,
    vendorName: input.vendorName ?? null,
  });

  const reasons = [...assessment.reviewReasons];

  // `specs/03` §10's two remaining validations, both of which mean REVIEW.
  const badPeriod = payload.coverages.some(
    (row) =>
      row.policy_eff.value !== null &&
      row.policy_exp.value !== null &&
      row.policy_eff.value > row.policy_exp.value,
  );
  if (badPeriod) reasons.push('A policy period on this certificate ends before it starts.');

  if (
    input.today &&
    certificateDateOutOfRange(
      payload.certificate_date.value,
      payload.coverages.map((c) => c.policy_eff.value),
      input.today,
    )
  ) {
    reasons.push('The certificate date is a long way outside the policy periods on it.');
  }

  const letters = new Set(payload.insurers.map((i) => i.letter));
  const danglingLetter = payload.coverages.some(
    (row) => row.insr_letter.value !== null && !letters.has(row.insr_letter.value as never),
  );
  if (danglingLetter) {
    reasons.push('A coverage row names an insurer letter that is not in the insurer list.');
  }

  const needsReview = reasons.length > 0;
  return {
    ...common,
    status: needsReview ? 'needs_review' : 'ready',
    pageTexts: pdf.pageTexts,
    assessment: { ...assessment, needsReview, reviewReasons: reasons },
  };
}

function emptyUsage(): ModelUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
  };
}

/** An unknown model must not take down an extraction that already succeeded. */
function safeCost(model: string, usage: ModelUsage): number {
  try {
    return costCents(model, usage);
  } catch {
    return 0;
  }
}

/** The sentence `specs/03` §13 shows for each failure. Never a stack trace,
 *  never raw model output, never a model name. */
export function failureSentence(reason: FailureReason, documentKind?: string): string {
  switch (reason) {
    case 'encrypted':
      return 'This PDF is password-protected. Save an unprotected copy and upload that.';
    case 'too_many_pages':
      return `This looks like a package — upload just the certificate pages (up to ${MAX_PAGES}).`;
    case 'unreadable':
      return 'We could not open this file. Try saving it again as a PDF, or upload a photo of the page.';
    case 'schema':
      return "We couldn't read this one — we've flagged it for our team.";
    case 'refusal':
      return "We couldn't read this one — we've flagged it for our team.";
    case 'truncated':
      return "We couldn't read this one — we've flagged it for our team.";
    case 'transport':
      return "We couldn't read this one. We'll try again automatically.";
    default:
      return documentKind ?? "We couldn't read this one.";
  }
}

/** `specs/03` A5's explanatory copy for a document that is not an ACORD 25. */
export function rejectionSentence(documentKind: string): string {
  const what: Record<string, string> = {
    acord_27_or_28: 'an ACORD 27 or 28, evidence of property insurance',
    endorsement: 'a policy endorsement rather than a certificate',
    other: 'something other than a certificate of liability insurance',
    unreadable: 'a page we could not read',
  };
  return `This looks like ${what[documentKind] ?? 'another kind of document'}. Certly reads ACORD 25 certificates of liability insurance.`;
}
