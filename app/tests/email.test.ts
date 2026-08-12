/**
 * Email: the day-3/10/21 outcome sequence + magic link, inbound Shield
 * ingest, and the calm-voice templates (BRAND.md §2, §2.4).
 *
 * Spec: ARCHITECTURE.md §3.7 (`send_scheduled_email`), ADR-006 (inbound
 * ingest), ARCHITECTURE.md §5.1 (email/templates.ts's own header — every
 * template function is pure so voice rules are checkable by inspecting a
 * string).
 */

import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import * as casesRepo from '../src/lib/db/repositories/cases';
import * as inboundNoticesRepo from '../src/lib/db/repositories/inbound-notices';
import * as scheduledEmailsRepo from '../src/lib/db/repositories/scheduled-emails';
import * as shieldAccountsRepo from '../src/lib/db/repositories/shield-accounts';
import { scheduleOutcomeSequence } from '../src/lib/email/outcome-sequence';
import {
  buildMagicLinkUrl,
  buildOutcomeUrl,
  handleSendScheduledEmail,
  makeProcessInboundNoticeHandler,
} from '../src/lib/email/handlers';
import { extractIngestToken, receiveInboundNotice, UnknownIngestTokenError } from '../src/lib/email/inbound';
import * as templates from '../src/lib/email/templates';
import { claimJobs } from '../src/lib/db/queue';
import { customers as customersTable } from '../src/lib/db/schema';
import type { Db } from '../src/lib/db';
import { baseCaseInput, createTestDb } from './helpers/pglite-db';
import { makeTestAdapters } from './helpers/test-adapters';

let client: PGlite;
let db: Db;
let adapters: ReturnType<typeof makeTestAdapters>;

beforeEach(async () => {
  const created = await createTestDb();
  client = created.client;
  db = created.db;
  adapters = makeTestAdapters();
});

afterEach(async () => {
  await client.close();
});

describe('scheduleOutcomeSequence (B9, ADR-005)', () => {
  it('schedules the magic link and all three self-report prompts at the right offsets', async () => {
    const caseRow = await casesRepo.createCase(db, baseCaseInput());
    // Real "now" (not a fixed past date) so the d3/d10/d21 rows land in the
    // future relative to the claim query's own `now()` and only the
    // immediate magic-link row is actually due.
    const now = new Date();

    const rows = await scheduleOutcomeSequence(db, caseRow.id, { now });

    expect(rows.map((r) => r.kind).sort()).toEqual(['d10', 'd21', 'd3', 'magic_link']);
    const byKind = Object.fromEntries(rows.map((r) => [r.kind, r]));
    expect(byKind['magic_link']?.sendAfter.getTime()).toBe(now.getTime());
    expect(byKind['d3']?.sendAfter.getTime()).toBe(now.getTime() + 3 * 86_400_000);
    expect(byKind['d10']?.sendAfter.getTime()).toBe(now.getTime() + 10 * 86_400_000);
    expect(byKind['d21']?.sendAfter.getTime()).toBe(now.getTime() + 21 * 86_400_000);

    // Each scheduled row has a matching claimable job (ADR-005: the jobs
    // table is what actually gets FOR UPDATE SKIP LOCKED).
    const dueNow = await claimJobs(db, { workerId: 'w1', limit: 10, kinds: ['send_scheduled_email'] });
    expect(dueNow).toHaveLength(1); // only the immediate magic-link job is due
  });

  it('re-scheduling the same case+kind updates the one row rather than double-booking (idempotent)', async () => {
    const caseRow = await casesRepo.createCase(db, baseCaseInput());
    await scheduleOutcomeSequence(db, caseRow.id, { now: new Date('2026-01-01T00:00:00Z') });
    const second = await scheduleOutcomeSequence(db, caseRow.id, { now: new Date('2026-01-05T00:00:00Z') });

    const magicLink = second.find((r) => r.kind === 'magic_link');
    expect(magicLink?.sendAfter.toISOString()).toBe('2026-01-05T00:00:00.000Z');
  });
});

describe('handleSendScheduledEmail', () => {
  it('sends the magic-link email and marks the row sent', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    // A customer must be attached for the handler to find a delivery address.
    const [customer] = await db.insert(customersTable).values({ email: 'seller@example.test' }).returning();
    await casesRepo.attachCustomer(db, created.id, customer!.id);

    const [row] = await scheduleOutcomeSequence(db, created.id, { now: new Date() });
    const job = { id: 'job_1', kind: 'send_scheduled_email', payload: { scheduledEmailId: row!.id } } as never;

    await handleSendScheduledEmail(db, adapters, job);

    expect(adapters.email.sent).toHaveLength(1);
    expect(adapters.email.sent[0]?.subject).toMatch(/case document is ready/i);

    const reloaded = await scheduledEmailsRepo.getScheduledEmail(db, row!.id);
    expect(reloaded?.sentAt).not.toBeNull();
  });

  it('is a no-op for a row already sent or cancelled (never double-sends)', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    const [customer] = await db.insert(customersTable).values({ email: 'seller2@example.test' }).returning();
    await casesRepo.attachCustomer(db, created.id, customer!.id);

    const [row] = await scheduleOutcomeSequence(db, created.id, { now: new Date() });
    const job = { id: 'job_2', kind: 'send_scheduled_email', payload: { scheduledEmailId: row!.id } } as never;
    await handleSendScheduledEmail(db, adapters, job);
    await handleSendScheduledEmail(db, adapters, job); // second call, same row

    expect(adapters.email.sent).toHaveLength(1);
  });

  it('builds a magic-link URL keyed by the opaque case id, and outcome URLs carrying the decision', () => {
    expect(buildMagicLinkUrl('https://app.test/', 'case_abc')).toBe('https://app.test/c/case_abc');
    expect(buildOutcomeUrl('https://app.test', 'case_abc', 'reinstated')).toBe(
      'https://app.test/api/outcome/case_abc?decision=reinstated',
    );
  });
});

describe('inbound Shield ingest (ADR-006)', () => {
  it('extracts the ingest token, tolerant of a display-name prefix', () => {
    expect(extractIngestToken('shield+abc123@in.clausewright.test')).toBe('abc123');
    expect(extractIngestToken('"Alerts" <shield+abc123@in.clausewright.test>')).toBe('abc123');
    expect(extractIngestToken('someone@else.test')).toBeUndefined();
  });

  it('verifies, matches the token, and persists an inbound notice', async () => {
    const account = await shieldAccountsRepo.createShieldAccount(db, {
      marketplace: 'amazon',
      sourceKind: 'email_forward',
    });
    const payload = JSON.stringify({
      to: `shield+${account.ingestToken}@in.clausewright.test`,
      from: 'no-reply@amazon.example',
      subject: 'Account health update',
      text: 'Your account has a new policy warning.',
      receivedAt: new Date().toISOString(),
    });
    const signature = adapters.email.sign(payload);

    const { notice, account: matched } = await receiveInboundNotice(db, adapters, payload, signature);
    expect(matched.id).toBe(account.id);
    expect(notice.shieldAccountId).toBe(account.id);
    expect(notice.processedAt).toBeNull();
  });

  it('rejects an inbound payload with no matching Shield account', async () => {
    const payload = JSON.stringify({
      to: 'shield+doesnotexist@in.clausewright.test',
      from: 'x@example.com',
      subject: 's',
      text: 't',
      receivedAt: new Date().toISOString(),
    });
    const signature = adapters.email.sign(payload);
    await expect(receiveInboundNotice(db, adapters, payload, signature)).rejects.toThrow(
      UnknownIngestTokenError,
    );
  });

  it('rejects a bad HMAC signature on inbound mail (untrusted stranger input)', async () => {
    const payload = JSON.stringify({
      to: 'shield+abc@in.clausewright.test',
      from: 'x@example.com',
      subject: 's',
      text: 't',
      receivedAt: new Date().toISOString(),
    });
    await expect(receiveInboundNotice(db, adapters, payload, 'forged-signature')).rejects.toThrow();
  });

  it('process_inbound_notice sends a candid monitoring alert when no classifier is wired', async () => {
    const [customer] = await db.insert(customersTable).values({ email: 'shield-customer@example.test' }).returning();
    const account = await shieldAccountsRepo.createShieldAccount(db, {
      customerId: customer!.id,
      marketplace: 'amazon',
      sourceKind: 'email_forward',
    });
    const notice = await inboundNoticesRepo.insertInboundNotice(db, {
      shieldAccountId: account.id,
      fromAddress: 'no-reply@amazon.example',
      subject: 'Account health update',
      rawTextEncrypted: 'body',
      sha256: 'deadbeef',
    });

    const handler = makeProcessInboundNoticeHandler(); // no classifier injected
    const job = { id: 'job_3', kind: 'process_inbound_notice', payload: { inboundNoticeId: notice.id } } as never;
    await handler(db, adapters, job);

    expect(adapters.email.sent).toHaveLength(1);
    expect(adapters.email.sent[0]?.html).toMatch(/not confident enough/i);

    const reloaded = await inboundNoticesRepo.getInboundNotice(db, notice.id);
    expect(reloaded?.processedAt).not.toBeNull();
  });
});

describe('calm-voice templates (BRAND.md §2 ER-doctor register)', () => {
  const allTemplateOutputs: templates.EmailContent[] = [
    templates.receiptEmail({ tierLabel: 'Rescue', amountCents: 14_900, currency: 'usd', caseId: 'case_1' }),
    templates.draftReadyEmail({ reasonCodeLabel: 'account authenticity', magicLinkUrl: 'https://app.test/c/1' }),
    templates.escalationEmail({ caseId: 'case_1', reasonDetail: 'x', humanTier: false }),
    templates.monitoringAlertEmail({ marketplace: 'amazon', summary: 'x' }),
    templates.shieldActivationEmail({ includedUntil: new Date('2026-02-01') }),
    templates.shieldRenewalDecisionEmail({
      daysRemaining: 3,
      whatMonitoringFlagged: 'nothing new',
      keepUrl: 'https://app.test/keep',
      lapseUrl: 'https://app.test/lapse',
    }),
    templates.outcomeRequestEmail({
      day: 3,
      reinstatedUrl: 'https://app.test/r',
      rejectedUrl: 'https://app.test/j',
      noResponseUrl: 'https://app.test/n',
    }),
  ];

  it('never uses an exclamation mark or an emoji in customer-facing copy', () => {
    for (const content of allTemplateOutputs) {
      expect(content.subject).not.toMatch(/!/);
      expect(content.text).not.toMatch(/!/);
      // A conservative emoji sweep over common ranges — enough to catch an
      // accidental 🎉 without over-fitting to one Unicode block.
      expect(content.text).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    }
  });

  it('never uses "POA" or "Plan of Action" in customer-facing copy (NAMING.md §5 invariant 2)', () => {
    for (const content of allTemplateOutputs) {
      expect(content.text).not.toMatch(/\bPOA\b/);
      expect(content.text).not.toMatch(/Plan of Action/i);
    }
  });

  it('never claims a reinstatement outcome (candid about limits, no guarantee)', () => {
    for (const content of allTemplateOutputs) {
      expect(content.text).not.toMatch(/guarantee(d)? (to be )?reinstated/i);
    }
  });

  it("treats one-click Rejected exactly as prominently as one-click Reinstated (CORPUS_DESIGN §4.6)", () => {
    const outcome = templates.outcomeRequestEmail({
      day: 10,
      reinstatedUrl: 'https://app.test/r',
      rejectedUrl: 'https://app.test/j',
      noResponseUrl: 'https://app.test/n',
    });
    // Both links present, and rejected is not visually or textually
    // demoted (e.g. hidden after a "but" or wrapped in apologetic copy).
    expect(outcome.html).toContain('https://app.test/r');
    expect(outcome.html).toContain('https://app.test/j');
    expect(outcome.text.indexOf('Reinstated:')).toBeGreaterThanOrEqual(0);
    expect(outcome.text.indexOf('Rejected:')).toBeGreaterThanOrEqual(0);
  });

  it('the receipt states the amount and tier with a currency-formatted string', () => {
    const receipt = templates.receiptEmail({
      tierLabel: 'Rescue + Human',
      amountCents: 39_900,
      currency: 'usd',
      caseId: 'case_42',
    });
    expect(receipt.text).toContain('$399.00');
    expect(receipt.text).toContain('Rescue + Human');
    expect(receipt.subject).toContain('$399.00');
    expect(receipt.text).toContain('case_42');
  });
});
