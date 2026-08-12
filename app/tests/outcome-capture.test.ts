/**
 * Outcome-capture: the consented outcome loop (D10, ADR-008) — consent
 * recorded and revocable, deterministic-first anonymization, staged-then-
 * promoted L4 records, and the day-3/10/21 self-report.
 *
 * Spec: ADR-008, CORPUS_DESIGN.md §4.3-§4.6.
 */

import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import * as casesRepo from '../src/lib/db/repositories/cases';
import * as classificationsRepo from '../src/lib/db/repositories/classifications';
import * as consentsRepo from '../src/lib/db/repositories/consents';
import * as draftsRepo from '../src/lib/db/repositories/drafts';
import * as l4Repo from '../src/lib/db/repositories/l4-records';
import * as noticeDocumentsRepo from '../src/lib/db/repositories/notice-documents';
import {
  CURRENT_CONSENT_TEXT_VERSION,
  recordConsentAtCheckout,
  revokeConsentAndCascade,
} from '../src/lib/outcome-capture/consent';
import { computeStructureHash, runRedactionAndStage } from '../src/lib/outcome-capture/pipeline';
import { looksFullyRedacted, redactText } from '../src/lib/outcome-capture/redaction';
import {
  attemptPromotion,
  DEFAULT_SPOT_CHECK_THRESHOLD,
  demoteFromPromoted,
  recordSpotCheckAndPromote,
} from '../src/lib/outcome-capture/promotion';
import { recordOutcomeReport } from '../src/lib/outcome-capture/reports';
import { claimJobs } from '../src/lib/db/queue';
import { scheduleOutcomeSequence } from '../src/lib/email/outcome-sequence';
import { scheduledEmails as scheduledEmailsTable } from '../src/lib/db/schema';
import type { Db } from '../src/lib/db';
import { baseCaseInput, createTestDb } from './helpers/pglite-db';

let client: PGlite;
let db: Db;

beforeEach(async () => {
  const created = await createTestDb();
  client = created.client;
  db = created.db;
});

afterEach(async () => {
  await client.close();
});

describe('deterministic redaction (CORPUS_DESIGN.md §4.4)', () => {
  it('redacts email, phone, ASIN, Amazon order id, address and merchant-token shapes', async () => {
    const text =
      'Contact us at seller@example.com or 415-555-0199. ASIN B0DZXK9YQ2, order 111-2223334-5556667, ' +
      'ship to 123 Main Street, Springfield IL 62704. Merchant token MERCHANTABCD1234EF.';
    const { redactedText, counts } = await redactText(text);

    expect(redactedText).toContain('[EMAIL]');
    expect(redactedText).toContain('[PHONE]');
    expect(redactedText).toContain('[ASIN]');
    expect(redactedText).toContain('[ORDER_ID]');
    expect(redactedText).toContain('[ADDRESS]');
    expect(redactedText).not.toMatch(/seller@example\.com/);
    expect(redactedText).not.toMatch(/111-2223334-5556667/);
    expect(counts['email']).toBe(1);
    expect(counts['asin']).toBe(1);
  });

  it('runs the model-assisted pass second, over already-deterministically-redacted text', async () => {
    let sawDeterministicOutput = false;
    const { redactedText } = await redactText('Reach Jane Smith at jane@example.com.', {
      modelAssist: async (text) => {
        sawDeterministicOutput = text.includes('[EMAIL]') && !text.includes('jane@example.com');
        return text.replace('Jane Smith', '[NAME]');
      },
    });
    expect(sawDeterministicOutput).toBe(true);
    expect(redactedText).toContain('[NAME]');
    expect(redactedText).toContain('[EMAIL]');
  });

  it('looksFullyRedacted flags a surviving email or order id as implausible', () => {
    expect(looksFullyRedacted('all clean, [EMAIL], [ORDER_ID]')).toBe(true);
    expect(looksFullyRedacted('leaked seller@example.com')).toBe(false);
    expect(looksFullyRedacted('leaked order 111-2223334-5556667')).toBe(false);
  });
});

describe('consent (ADR-008 ¶1: versioned, revocable, separable from the purchase)', () => {
  it('records a granted consent with the current versioned text', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const consent = await recordConsentAtCheckout(db, created.id, { granted: true });
    expect(consent.granted).toBe(true);
    expect(consent.textVersion).toBe(CURRENT_CONSENT_TEXT_VERSION);
    expect(consent.grantedAt).not.toBeNull();
  });

  it('records an explicit decline, distinct from "never asked"', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const consent = await recordConsentAtCheckout(db, created.id, { granted: false });
    expect(consent.granted).toBe(false);
    expect(consent.grantedAt).toBeNull();
  });

  it('refuses a second consent row for the same case (one consent per case)', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await recordConsentAtCheckout(db, created.id, { granted: true });
    await expect(recordConsentAtCheckout(db, created.id, { granted: true })).rejects.toThrow();
  });

  it('revocation cascades: cancels pending emails and soft-deletes promoted L4 records, in one transaction', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const consent = await recordConsentAtCheckout(db, created.id, { granted: true });
    await scheduleOutcomeSequence(db, created.id, { now: new Date(Date.now() + 3600_000) });

    const l4 = await l4Repo.insertL4Record(db, {
      consentId: consent.id,
      reasonCode: 'AMZ.AUTH.INAUTHENTIC',
      marketplace: 'amazon',
      redactedNotice: 'n',
      redactedDraft: 'd',
      corpusRelease: 1,
      promptBundleHash: 'h',
      modelId: 'm',
      redactionMethod: 'deterministic-v1',
    });

    const revoked = await revokeConsentAndCascade(db, created.id);
    expect(revoked?.revokedAt).not.toBeNull();

    const scheduledRows = await db.select().from(scheduledEmailsTable);
    expect(scheduledRows.length).toBeGreaterThan(0);
    for (const row of scheduledRows) {
      expect(row.cancelledAt).not.toBeNull();
    }

    const deletedRecord = await l4Repo.getL4Record(db, l4.id);
    expect(deletedRecord?.deletedAt).not.toBeNull();
    expect(deletedRecord?.redactedNotice).toBe('[deleted]');

    const jobs = await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['delete_subject_data'] });
    expect(jobs).toHaveLength(1);
  });

  it('revoking a case with no consent on file is a no-op, not a crash', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const result = await revokeConsentAndCascade(db, created.id);
    expect(result).toBeUndefined();
  });
});

describe('the redact -> stage pipeline (ADR-008 ¶2: promotion, not insertion)', () => {
  async function makeCompleteConsentedCase() {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const consent = await recordConsentAtCheckout(db, created.id, { granted: true });
    await noticeDocumentsRepo.insertNoticeDocument(db, {
      caseId: created.id,
      rawTextEncrypted: 'Notice text mentioning seller@example.com.',
      sha256: 'abc',
      charLength: 40,
      retentionExpiresAt: new Date(Date.now() + 86_400_000),
    });
    await classificationsRepo.insertClassification(db, {
      caseId: created.id,
      reasonCode: 'AMZ.AUTH.INAUTHENTIC',
      confidence: 0.9,
      margin: 0.3,
      modelId: 'test-model',
    });
    await draftsRepo.insertDraftWithCitations(
      db,
      {
        caseId: created.id,
        bodyMd: 'draft body mentioning jane@example.com',
        sections: { root_cause: 'x'.repeat(60), corrective: 'y'.repeat(60), preventive: 'z'.repeat(60) },
        corpusRelease: 1,
        promptBundleHash: 'h',
      },
      [],
    );
    return { created, consent };
  }

  it('does not stage a record when consent was declined', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await recordConsentAtCheckout(db, created.id, { granted: false });
    const result = await runRedactionAndStage(db, created.id);
    expect(result).toEqual({ staged: false, reason: 'no_consent' });
  });

  it('does not stage a record when no consent was ever recorded', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const result = await runRedactionAndStage(db, created.id);
    expect(result).toEqual({ staged: false, reason: 'no_consent' });
  });

  it('does not stage an incomplete case (missing draft/classification) even with consent', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await recordConsentAtCheckout(db, created.id, { granted: true });
    const result = await runRedactionAndStage(db, created.id);
    expect(result).toEqual({ staged: false, reason: 'incomplete_case' });
  });

  it('stages a redacted L4 record at curation_state=redacted for a complete consented case', async () => {
    const { created } = await makeCompleteConsentedCase();
    const result = await runRedactionAndStage(db, created.id);
    expect(result.staged).toBe(true);
    if (!result.staged) throw new Error('unreachable');
    expect(result.quarantined).toBe(false);

    const record = await l4Repo.getL4Record(db, result.l4RecordId);
    expect(record?.curationState).toBe('redacted');
    expect(record?.redactedNotice).not.toMatch(/seller@example\.com/);
    expect(record?.redactedDraft).not.toMatch(/jane@example\.com/);

    // A promote_l4 job was enqueued for the plausible-redaction path.
    const jobs = await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['promote_l4'] });
    expect(jobs).toHaveLength(1);
  });

  it('computeStructureHash is stable for the same section-length shape and differs for a different one', () => {
    const a = computeStructureHash({ root_cause: 'x'.repeat(60), corrective: 'y'.repeat(60) });
    const b = computeStructureHash({ root_cause: 'x'.repeat(60), corrective: 'y'.repeat(60) });
    const c = computeStructureHash({ root_cause: 'x'.repeat(500), corrective: 'y'.repeat(60) });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('promotion gate (ADR-008 ¶2, third conjunct: human spot-check on the first ~100)', () => {
  async function stageRedactedRecord(consentId: string) {
    return l4Repo.insertL4Record(db, {
      consentId,
      reasonCode: 'AMZ.AUTH.INAUTHENTIC',
      marketplace: 'amazon',
      redactedNotice: 'n',
      redactedDraft: 'd',
      corpusRelease: 1,
      promptBundleHash: 'h',
      modelId: 'm',
      redactionMethod: 'deterministic-v1',
    });
  }

  it('withholds promotion until a human spot-check, below the threshold', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const consent = await recordConsentAtCheckout(db, created.id, { granted: true });
    const record = await stageRedactedRecord(consent.id);

    const result = await attemptPromotion(db, record.id, { spotCheckThreshold: 100 });
    expect(result).toEqual({ promoted: false, reason: 'awaiting_human_spot_check' });
  });

  it('promotes once a human has spot-checked the record', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const consent = await recordConsentAtCheckout(db, created.id, { granted: true });
    const record = await stageRedactedRecord(consent.id);

    const result = await recordSpotCheckAndPromote(db, record.id, 'reviewer_1', { spotCheckThreshold: 100 });
    expect(result).toEqual({ promoted: true });

    const reloaded = await l4Repo.getL4Record(db, record.id);
    expect(reloaded?.curationState).toBe('promoted');
    expect(reloaded?.humanSpotChecked).toBe(true);
    expect(reloaded?.spotCheckedBy).toBe('reviewer_1');
  });

  it('promotes without a spot-check once the corpus has already passed the threshold', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const consent = await recordConsentAtCheckout(db, created.id, { granted: true });
    const record = await stageRedactedRecord(consent.id);

    // A threshold of 0 simulates "already past the first ~100" without
    // inserting a hundred fixture rows.
    const result = await attemptPromotion(db, record.id, { spotCheckThreshold: 0 });
    expect(result).toEqual({ promoted: true });
  });

  it('is a legitimate not-yet, not a thrown error, for a record not in the redacted state', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const consent = await recordConsentAtCheckout(db, created.id, { granted: true });
    const record = await stageRedactedRecord(consent.id);
    await recordSpotCheckAndPromote(db, record.id, 'reviewer_1', { spotCheckThreshold: 100 });

    const result = await attemptPromotion(db, record.id, { spotCheckThreshold: 100 });
    expect(result).toEqual({ promoted: false, reason: 'not_in_redacted_state' });
  });

  it('demotion is symmetric: promoted -> verified, a legal structural edge', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const consent = await recordConsentAtCheckout(db, created.id, { granted: true });
    const record = await stageRedactedRecord(consent.id);
    await recordSpotCheckAndPromote(db, record.id, 'reviewer_1', { spotCheckThreshold: 100 });

    await demoteFromPromoted(db, record.id);
    const reloaded = await l4Repo.getL4Record(db, record.id);
    expect(reloaded?.curationState).toBe('verified');
  });

  it('rejects an illegal curation edge (redacted -> promoted, skipping verified)', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const consent = await recordConsentAtCheckout(db, created.id, { granted: true });
    const record = await stageRedactedRecord(consent.id);
    await expect(l4Repo.transitionCuration(db, record.id, 'promoted')).rejects.toThrow(
      l4Repo.IllegalCurationTransitionError,
    );
  });

  it('the default threshold matches ADR-008 (~100)', () => {
    expect(DEFAULT_SPOT_CHECK_THRESHOLD).toBe(100);
  });
});

describe('outcome self-report (B9, CORPUS_DESIGN.md §4.6 point 1)', () => {
  it('enqueues redact_notice for a terminal decision (reinstated)', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await recordOutcomeReport(db, created.id, { decision: 'reinstated' });
    const jobs = await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['redact_notice'] });
    expect(jobs).toHaveLength(1);
  });

  it('enqueues redact_notice for a terminal decision (rejected) — failures are worth just as much', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await recordOutcomeReport(db, created.id, { decision: 'rejected' });
    const jobs = await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['redact_notice'] });
    expect(jobs).toHaveLength(1);
  });

  it('does NOT enqueue redaction for an unresolved outcome (no_response) — not yet evidence of anything', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await recordOutcomeReport(db, created.id, { decision: 'no_response' });
    const jobs = await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['redact_notice'] });
    expect(jobs).toHaveLength(0);
  });
});
