/**
 * M7 — the ladder, the caps, the footer and the queue. `specs/07` §10, §14.
 *
 * Every acceptance criterion in `specs/07` that can be proved offline is proved
 * here, against PGlite with the REAL committed migrations, so the idempotency
 * index, the suppression constraints and the recipient-interval table are the
 * ones production has.
 *
 * The two tests worth reading first:
 *
 *  - *"the caps hold and `{total}` is what actually goes out"* — the property
 *    `specs/07` §14 asks for, and the one that makes the sentence printed in
 *    every message ("this is message 3 of 6") a promise the queue keeps rather
 *    than a number in a template.
 *  - *"nothing leaves the system outside production"* — A10, which is the
 *    difference between a preview deploy and a preview deploy that emails a
 *    real insurance agency.
 */
import { and, eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId as platformNewId } from '@octopus/platform';
import { memberships, organisations, users } from '@octopus/platform/db';
import { MockEmailAdapter } from '@octopus/platform/adapters';
import { createTestDb, makeTestAdapters } from '@octopus/platform/testing';

import { getEnv, resetEnv } from '../src/env';
import { appMigrationsDir } from '../src/lib/db';
import { newId } from '../src/lib/ids';
import { disclaimers } from '../src/lib/kb/disclaimers';
import {
  MAX_MESSAGES_PER_EXPIRY,
  MAX_MESSAGES_PER_RECIPIENT_PER_EXPIRY,
  RUNGS,
  addDays,
  applyResendEvent,
  chaseState,
  claimDueReminders,
  composeVendorEmail,
  computeLadder,
  countSentForExpiry,
  deliveryRole,
  drainReminders,
  extractUrls,
  instantAtLocalTime,
  listEmailLog,
  parseLadder,
  pauseReminders,
  resolveRecipients,
  scheduleLadder,
  signResendWebhook,
  suppress,
  suppressionFor,
  totalForExpiry,
  verifyResendWebhook,
} from '../src/lib/reminders';
import { applyTemplate } from '../src/lib/repos';
import {
  certificates,
  documents,
  extractions,
  recipientSends,
  reminders,
  vendors,
} from '../src/lib/schema';
import { extraction as buildExtraction, coverage, limit } from './engine/fixtures';

let db: Awaited<ReturnType<typeof createTestDb>>;
let orgId: string;
let userId: string;
let adapters: ReturnType<typeof makeTestAdapters>;

const ORG_NAME = 'Rivergate Property Management';
const VENDOR_MAILBOX = 'office@harbour.test';
const PRODUCER_MAILBOX = 'certs@springfield-insurance.test';
const EXPIRY = '2026-12-01';
/** Well before T−60 (2026-10-02), so the whole ladder is in the future. */
const NOW = new Date('2026-06-01T12:00:00Z');

beforeEach(async () => {
  db = await createTestDb([appMigrationsDir()]);
  adapters = makeTestAdapters();
  orgId = platformNewId('org');
  userId = platformNewId('usr');
  await db.db.insert(organisations).values({ id: orgId, name: ORG_NAME, slug: `rivergate-${orgId.slice(-6)}` });
  await db.db.insert(users).values({ id: userId, email: `ana+${orgId.slice(-6)}@rivergate.test` });
  await db.db.insert(memberships).values({ id: platformNewId('mem'), orgId, userId, role: 'owner' });
  resetEnv();
});

afterEach(async () => {
  await db.close();
  delete process.env['SEND_ENABLED'];
  resetEnv();
});

/** A vendor with an active certificate whose earliest required expiry is set. */
async function seedVendor(
  options: { contactEmail?: string | null; producerEmail?: string | null; expiry?: string } = {},
): Promise<string> {
  const expiry = options.expiry ?? EXPIRY;
  const setId = await applyTemplate(db.db, {
    orgId,
    templateId: 'pm.baseline',
    actor: { kind: 'user', userId },
    makeDefault: true,
  });
  void setId;

  const vendorId = newId('vendor');
  await db.db.insert(vendors).values({
    id: vendorId,
    orgId,
    name: 'Harbour Roofing',
    contactEmail: options.contactEmail === undefined ? VENDOR_MAILBOX : options.contactEmail,
    earliestRequiredExpiry: expiry,
    status: 'expiring',
  });

  const payload = buildExtraction({
    coverages: [
      coverage('general_liability', {
        exp: expiry,
        limits: [limit('each_occurrence', 1_000_000), limit('general_aggregate', 2_000_000)],
      }),
    ],
  });
  const producerEmail = options.producerEmail === undefined ? PRODUCER_MAILBOX : options.producerEmail;
  payload.producer.email = { value: producerEmail, raw: producerEmail, page: 1, source_text: producerEmail, confidence: 0.95 };

  const documentId = newId('document');
  await db.db.insert(documents).values({
    id: documentId,
    orgId,
    vendorId,
    storageKey: `org/${orgId}/${documentId}.pdf`,
    mime: 'application/pdf',
    bytes: 1000,
    sha256: documentId,
    source: 'app',
  });
  const extractionId = newId('extraction');
  await db.db.insert(extractions).values({
    id: extractionId,
    documentId,
    orgId,
    status: 'ready',
    model: 'test',
    promptHash: 'test',
    payload,
  });
  await db.db.insert(certificates).values({
    id: newId('certificate'),
    orgId,
    vendorId,
    documentId,
    extractionId,
    earliestExpiry: expiry,
    status: 'active',
  });
  return vendorId;
}

// ---------------------------------------------------------------------------
// The ladder (A1, §2, §9)
// ---------------------------------------------------------------------------

describe('specs/07 §2 — the canonical ladder', () => {
  it('A1: an expiry of 2026-12-01 produces exactly the ten dates the spec names', () => {
    const ladder = computeLadder({ expiryDate: EXPIRY, timezone: 'America/New_York', now: NOW });
    expect(ladder.map((entry) => entry.date)).toEqual([
      '2026-10-02', // T−60
      '2026-11-01', // T−30
      '2026-11-17', // T−14
      '2026-11-24', // T−7
      '2026-11-30', // T−1
      '2026-12-02', // T+1
      '2026-12-08', // weekly to T+28
      '2026-12-15',
      '2026-12-22',
      '2026-12-29',
    ]);
    expect(ladder.map((entry) => entry.rung)).toEqual([...RUNGS]);
  });

  it('fires at 09:00 in the ORG’s zone, on both sides of a daylight-saving change', () => {
    // 2026-11-01 is the US change; a naive UTC schedule lands an hour out on
    // one side of it and the whole ladder drifts.
    const winter = instantAtLocalTime('2026-11-17', 'America/New_York');
    const summer = instantAtLocalTime('2026-10-02', 'America/New_York');
    expect(winter.toISOString()).toBe('2026-11-17T14:00:00.000Z'); // EST, UTC−5
    expect(summer.toISOString()).toBe('2026-10-02T13:00:00.000Z'); // EDT, UTC−4
  });

  it('§11: a certificate already expired skips T−n and starts at T+1 immediately', () => {
    const now = new Date('2026-12-02T15:00:00Z');
    const ladder = computeLadder({ expiryDate: EXPIRY, timezone: 'America/New_York', now });
    expect(ladder[0]?.rung).toBe('T+1');
    expect(ladder[0]?.immediate).toBe(true);
    expect(ladder.map((entry) => entry.rung)).not.toContain('T-60');
  });

  it('§11: an expiry more than 28 days past exhausts the ladder', () => {
    const ladder = computeLadder({
      expiryDate: EXPIRY,
      timezone: 'America/New_York',
      now: new Date('2027-01-15T12:00:00Z'),
    });
    expect(ladder).toEqual([]);
  });

  it('§2: a rung can be removed and none can be invented', () => {
    expect(parseLadder(['T-30', 'T-7'])).toEqual(['T-30', 'T-7']);
    expect(parseLadder(['T-30', 'T-3', 'nonsense'])).toEqual(['T-30']);
    expect(parseLadder(undefined)).toEqual([...RUNGS]);
  });

  it('§9: `{total}` is the CAPPED number, never the arithmetic one', () => {
    expect(totalForExpiry({ rungCount: 10, recipientCount: 1 })).toBe(MAX_MESSAGES_PER_RECIPIENT_PER_EXPIRY);
    expect(totalForExpiry({ rungCount: 10, recipientCount: 2 })).toBe(MAX_MESSAGES_PER_EXPIRY);
    expect(totalForExpiry({ rungCount: 3, recipientCount: 1 })).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Recipients (A3, A7, §3, §11)
// ---------------------------------------------------------------------------

describe('specs/07 §3 — who is asked', () => {
  it('A3: the producer is COPIED on T−60/T−30 and ADDRESSED from T−14', () => {
    expect(deliveryRole('T-60', 'vendor')).toBe('to');
    expect(deliveryRole('T-60', 'producer')).toBe('cc');
    expect(deliveryRole('T-30', 'producer')).toBe('cc');
    expect(deliveryRole('T-14', 'producer')).toBe('to');
    expect(deliveryRole('T+1', 'producer')).toBe('to');
  });

  it('§11: a vendor and a producer sharing one address are de-duplicated', () => {
    const recipients = resolveRecipients({ contactEmail: 'Same@X.test', producerEmail: 'same@x.test' });
    expect(recipients).toEqual([{ kind: 'vendor', email: 'same@x.test' }]);
  });

  it('A7: no mailbox and no producer address means NO ladder at all', async () => {
    const vendorId = await seedVendor({ contactEmail: null, producerEmail: null });
    const outcome = await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    expect(outcome.reason).toBe('no_contact');
    expect(outcome.scheduled).toBe(0);
    const rows = await db.db.select().from(reminders).where(eq(reminders.vendorId, vendorId));
    expect(rows).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Scheduling (A1, A2)
// ---------------------------------------------------------------------------

describe('specs/07 §4 — scheduling and rescheduling', () => {
  it('schedules one row per rung per recipient, idempotently', async () => {
    const vendorId = await seedVendor();
    const first = await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    expect(first.recipients).toHaveLength(2);
    expect(first.scheduled).toBe(20);

    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    const rows = await db.db.select().from(reminders).where(eq(reminders.vendorId, vendorId));
    // The unique index on (vendorId, rung, expiryDate, recipientEmail) is what
    // makes a second run a no-op rather than a double send.
    expect(rows).toHaveLength(20);
    expect(rows.every((row) => row.totalForExpiry === MAX_MESSAGES_PER_EXPIRY)).toBe(true);
  });

  it('A2: a renewal cancels the open rungs for the OLD expiry and schedules a new ladder', async () => {
    const vendorId = await seedVendor();
    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });

    const newExpiry = '2027-12-01';
    await db.db.update(vendors).set({ earliestRequiredExpiry: newExpiry }).where(eq(vendors.id, vendorId));
    const second = await scheduleLadder(db.db, { orgId, vendorId, now: NOW });

    expect(second.cancelled).toBe(20);
    const cancelled = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.status, 'cancelled')));
    expect(cancelled).toHaveLength(20);
    expect(cancelled.every((row) => row.expiryDate === EXPIRY)).toBe(true);

    const open = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.status, 'scheduled')));
    expect(open.every((row) => row.expiryDate === newExpiry)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The email (A9, A14, §6, §6.1, §6.2)
// ---------------------------------------------------------------------------

describe('specs/07 §6 — what a vendor-facing email may say', () => {
  const message = () =>
    composeVendorEmail({
      brand: { appName: 'Certly', companyAddress: '1 Example Way, Springfield', origin: 'https://example.test' },
      orgName: ORG_NAME,
      vendorName: 'Harbour Roofing',
      rung: 'T-30',
      expiryDate: EXPIRY,
      policyDescription: 'General liability',
      otherExpiries: [],
      requirements: [{ key: 'r1', text: 'General liability, at least $1,000,000 each occurrence' }],
      uploadToken: 'tok-upload',
      unsubscribeToken: 'tok-unsub',
      messageNumber: 3,
      messageTotal: 6,
      replyTo: 'ana@rivergate.test',
      deliveryRole: 'to',
      recipientKind: 'vendor',
    });

  it('A9: carries the org name, the requirement, one upload button and the schedule sentence', () => {
    const composed = message();
    expect(composed.subject).toBe(`Insurance certificate for Harbour Roofing expires ${EXPIRY}`);
    expect(composed.text).toContain(`Sent by Certly on behalf of ${ORG_NAME}.`);
    expect(composed.text).toContain('General liability, at least $1,000,000 each occurrence');
    expect(composed.text).toContain('https://example.test/u/tok-upload');
    expect(composed.text).toContain(
      'This is message 3 of 6 about this certificate. They stop as soon as a current certificate arrives.',
    );
    expect(composed.replyTo).toBe('ana@rivergate.test');
    expect(composed.fromDisplayName).toBe(`${ORG_NAME} via Certly`);
  });

  it('A9 / §6.1: the footer carries a postal address and BOTH opt-out scopes', () => {
    const composed = message();
    expect(composed.text).toContain('1 Example Way, Springfield');
    expect(composed.text).toContain(`Stop requests from ${ORG_NAME}: https://example.test/unsubscribe/tok-unsub?scope=org`);
    expect(composed.text).toContain(
      'Stop all Certly requests, from every customer: https://example.test/unsubscribe/tok-unsub?scope=global',
    );
    expect(composed.html).toContain('scope=org');
    expect(composed.html).toContain('scope=global');
  });

  it('carries the §F.1 disclaimer verbatim — surface 10 of the eleven', () => {
    const composed = message();
    expect(composed.text).toContain(disclaimers.primary.body);
  });

  it('A9 / §6.2: the ONLY links are the upload, both unsubscribes and the legal pages', () => {
    const composed = message();
    const allowed = new Set([
      'https://example.test/u/tok-upload',
      'https://example.test/unsubscribe/tok-unsub?scope=org',
      'https://example.test/unsubscribe/tok-unsub?scope=global',
      'https://example.test/legal/terms',
      'https://example.test/legal/privacy',
      'https://example.test/legal/disclaimer',
    ]);
    const found = extractUrls(composed);
    expect(found.length).toBeGreaterThan(0);
    for (const url of found) expect(allowed, `unexpected link in a vendor email: ${url}`).toContain(url);
    expect(new Set(composed.links)).toEqual(allowed);
  });

  it('§6.2: no marketing, no pricing, no signup, no product call to action', () => {
    const body = `${message().text}\n${message().html}`.toLowerCase();
    for (const banned of ['/pricing', '/login', '/signup', 'free trial', 'start a trial', 'upgrade']) {
      expect(body, `a vendor email must not contain "${banned}"`).not.toContain(banned);
    }
  });

  it('A14: every URL is built from the configured origin, never a literal domain', () => {
    const composed = composeVendorEmail({
      brand: { appName: 'Certly', companyAddress: 'x', origin: 'https://certly-abc123.vercel.app' },
      orgName: ORG_NAME,
      vendorName: 'Harbour Roofing',
      rung: 'T+1',
      expiryDate: EXPIRY,
      policyDescription: 'General liability',
      otherExpiries: [],
      requirements: [],
      uploadToken: 't',
      unsubscribeToken: 'u',
      messageNumber: 1,
      messageTotal: 1,
      replyTo: 'ana@rivergate.test',
      deliveryRole: 'to',
      recipientKind: 'vendor',
    });
    for (const url of extractUrls(composed)) {
      expect(url.startsWith('https://certly-abc123.vercel.app/')).toBe(true);
    }
    expect(composed.subject).toBe('Insurance certificate for Harbour Roofing has expired');
  });
});

// ---------------------------------------------------------------------------
// Sending: the interval, the caps, the pauses (A6, A8, A10, A11, A12)
// ---------------------------------------------------------------------------

describe('specs/07 §9 — the rules the queue enforces', () => {
  it('A10: outside production nothing leaves the system and everything is in the log', async () => {
    const vendorId = await seedVendor();
    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    const due = new Date('2026-10-02T14:00:00Z');
    const summary = await drainReminders(db.db, adapters, { now: due });

    expect(summary.sent).toBeGreaterThan(0);
    expect((adapters.email as MockEmailAdapter).sent).toHaveLength(0);
    const log = await listEmailLog(db.db, orgId);
    expect(log.filter((row) => row.status === 'sent').length).toBe(summary.sent);
    expect(getEnv().SEND_ENABLED).toBe(false);
  });

  it('hands the composed message to the adapter when sending IS enabled', async () => {
    process.env['SEND_ENABLED'] = 'true';
    resetEnv();
    const vendorId = await seedVendor();
    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    await drainReminders(db.db, adapters, { now: new Date('2026-10-02T14:00:00Z') });

    const mock = adapters.email as MockEmailAdapter;
    expect(mock.sent.length).toBeGreaterThan(0);
    expect(mock.sent[0]?.replyTo).toBe(`ana+${orgId.slice(-6)}@rivergate.test`);
    expect(mock.sent[0]?.text).toContain(ORG_NAME);
  });

  it('A11: a recipient emailed 12 hours ago is DEFERRED, not dropped', async () => {
    const vendorId = await seedVendor({ producerEmail: null });
    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    const due = new Date('2026-10-02T14:00:00Z');
    await db.db
      .insert(recipientSends)
      .values({ email: VENDOR_MAILBOX, lastSentAt: new Date(due.getTime() - 12 * 3600_000) });

    const claimed = await claimDueReminders(db.db, { now: due });
    expect(claimed).toHaveLength(0);

    // Still scheduled — the next drain after the interval takes it.
    const rows = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.status, 'scheduled')));
    expect(rows.length).toBeGreaterThan(0);

    const later = new Date(due.getTime() + 61 * 3600_000);
    const after = await claimDueReminders(db.db, { now: later });
    expect(after.length).toBeGreaterThan(0);
  });

  it('A6: two concurrent drains send each rung exactly once', async () => {
    const vendorId = await seedVendor({ producerEmail: null });
    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    const due = new Date('2026-10-02T14:00:00Z');

    const [a, b] = await Promise.all([
      drainReminders(db.db, adapters, { now: due }),
      drainReminders(db.db, adapters, { now: due }),
    ]);
    expect((a?.sent ?? 0) + (b?.sent ?? 0)).toBe(1);
    const sent = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.status, 'sent')));
    expect(sent).toHaveLength(1);
  });

  it('A8: a paused vendor SKIPS rather than cancels, and resuming restores the rest', async () => {
    const vendorId = await seedVendor({ producerEmail: null });
    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    await pauseReminders(db.db, { orgId, vendorId, paused: true, actor: { kind: 'user', userId } });

    const due = new Date('2026-10-02T14:00:00Z');
    const summary = await drainReminders(db.db, adapters, { now: due });
    expect(summary.skipped).toBe(1);
    expect(summary.reasons['paused']).toBe(1);

    const skipped = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.status, 'skipped')));
    expect(skipped).toHaveLength(1);

    await pauseReminders(db.db, { orgId, vendorId, paused: false, actor: { kind: 'user', userId }, now: due });
    const stillSkipped = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.status, 'skipped')));
    // The rung whose moment has gone stays skipped; the remaining ladder is
    // scheduled again, which is what "resuming restores the ladder" means.
    expect(stillSkipped).toHaveLength(1);
    const open = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.status, 'scheduled')));
    expect(open).toHaveLength(9);
  });

  it('A12 + §14: the caps hold, and `{total}` is exactly what goes out', async () => {
    const vendorId = await seedVendor();
    const outcome = await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    expect(outcome.totalForExpiry).toBe(MAX_MESSAGES_PER_EXPIRY);

    // Run the whole ladder to exhaustion. The clock jumps a week at a time so
    // the 72-hour per-recipient interval never defers a rung, which is a
    // separate property with its own test.
    let cursor = new Date('2026-10-02T14:00:00Z');
    for (let tick = 0; tick < 30; tick += 1) {
      await drainReminders(db.db, adapters, { now: cursor });
      cursor = new Date(cursor.getTime() + 7 * 86_400_000);
    }

    const sent = await countSentForExpiry(db.db, vendorId, EXPIRY);
    expect(sent.total).toBe(outcome.totalForExpiry);
    expect(sent.total).toBe(MAX_MESSAGES_PER_EXPIRY);
    for (const count of Object.values(sent.byRecipient)) {
      expect(count).toBeLessThanOrEqual(MAX_MESSAGES_PER_RECIPIENT_PER_EXPIRY);
    }

    const capped = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.skippedReason, 'expiry_cap')));
    expect(capped.length).toBeGreaterThan(0);

    // "we have stopped asking — chase this one yourself".
    const state = await chaseState(db.db, orgId, vendorId);
    expect(state.stoppedAsking).toBe(true);
    expect(state.sentForExpiry).toBe(MAX_MESSAGES_PER_EXPIRY);
  });

  it('§14: with ONE recipient the per-recipient cap is what `{total}` prints', async () => {
    const vendorId = await seedVendor({ producerEmail: null });
    const outcome = await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    expect(outcome.totalForExpiry).toBe(MAX_MESSAGES_PER_RECIPIENT_PER_EXPIRY);

    let cursor = new Date('2026-10-02T14:00:00Z');
    for (let tick = 0; tick < 30; tick += 1) {
      await drainReminders(db.db, adapters, { now: cursor });
      cursor = new Date(cursor.getTime() + 7 * 86_400_000);
    }
    const sent = await countSentForExpiry(db.db, vendorId, EXPIRY);
    expect(sent.total).toBe(MAX_MESSAGES_PER_RECIPIENT_PER_EXPIRY);
  });

  it('cancels rather than sends when the certificate was replaced since scheduling', async () => {
    const vendorId = await seedVendor({ producerEmail: null });
    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    await db.db.update(vendors).set({ earliestRequiredExpiry: addDays(EXPIRY, 365) }).where(eq(vendors.id, vendorId));

    const summary = await drainReminders(db.db, adapters, { now: new Date('2026-10-02T14:00:00Z') });
    expect(summary.cancelled).toBe(1);
    expect(summary.sent).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Suppression, bounces and the opt-out (A4, A5, A13)
// ---------------------------------------------------------------------------

describe('specs/07 §6.1 and §8 — suppression, bounces and the two opt-out scopes', () => {
  it('A5: an org-scoped stop affects that org only', async () => {
    const other = platformNewId('org');
    await db.db.insert(organisations).values({ id: other, name: 'Another Manager', slug: `other-${other.slice(-6)}` });

    await suppress(db.db, { email: PRODUCER_MAILBOX, scope: 'org', orgId, reason: 'unsubscribe' });
    expect((await suppressionFor(db.db, { email: PRODUCER_MAILBOX, orgId })).suppressed).toBe(true);
    expect((await suppressionFor(db.db, { email: PRODUCER_MAILBOX, orgId: other })).suppressed).toBe(false);
  });

  it('A13: a global stop means NO org can email that address again', async () => {
    const other = platformNewId('org');
    await db.db.insert(organisations).values({ id: other, name: 'Another Manager', slug: `other2-${other.slice(-6)}` });

    await suppress(db.db, { email: PRODUCER_MAILBOX, scope: 'global', orgId: null, reason: 'unsubscribe' });
    const here = await suppressionFor(db.db, { email: PRODUCER_MAILBOX, orgId });
    const there = await suppressionFor(db.db, { email: PRODUCER_MAILBOX, orgId: other });
    expect(here.scope).toBe('global');
    expect(there.scope).toBe('global');
  });

  it('global beats org: the precedence in §14, as a fact about the query', async () => {
    await suppress(db.db, { email: PRODUCER_MAILBOX, scope: 'org', orgId, reason: 'bounce' });
    await suppress(db.db, { email: PRODUCER_MAILBOX, scope: 'global', orgId: null, reason: 'unsubscribe' });
    expect((await suppressionFor(db.db, { email: PRODUCER_MAILBOX, orgId })).scope).toBe('global');
  });

  it('a suppressed address is SKIPPED with a reason, not silently dropped', async () => {
    const vendorId = await seedVendor({ producerEmail: null });
    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    await suppress(db.db, { email: VENDOR_MAILBOX, scope: 'org', orgId, reason: 'unsubscribe' });

    const summary = await drainReminders(db.db, adapters, { now: new Date('2026-10-02T14:00:00Z') });
    expect(summary.reasons['suppressed']).toBe(1);
    expect(summary.sent).toBe(0);
  });

  it('§14 contract: the mock reproduces the webhook shape AND its signature', () => {
    const secret = `whsec_${Buffer.from('a-test-signing-key').toString('base64')}`;
    const body = JSON.stringify({ type: 'email.delivered', data: { email_id: 'msg_1' } });
    const headers = { id: 'msg_evt_1', timestamp: String(Math.floor(Date.now() / 1000)) };
    const signature = signResendWebhook(secret, headers, body);

    expect(verifyResendWebhook(secret, { ...headers, signature }, body)).toBe(true);
    // A changed body, a changed id and a stale timestamp all fail.
    expect(verifyResendWebhook(secret, { ...headers, signature }, `${body} `)).toBe(false);
    expect(verifyResendWebhook(secret, { ...headers, id: 'other', signature }, body)).toBe(false);
    expect(
      verifyResendWebhook(secret, { ...headers, timestamp: String(Math.floor(Date.now() / 1000) - 3600), signature }, body),
    ).toBe(false);
  });

  it('A4: a hard bounce on the producer suppresses it for the org and skips the rest', async () => {
    process.env['SEND_ENABLED'] = 'true';
    resetEnv();
    const vendorId = await seedVendor();
    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    await drainReminders(db.db, adapters, { now: new Date('2026-10-02T14:00:00Z') });

    const [producerRow] = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.recipientEmail, PRODUCER_MAILBOX), eq(reminders.status, 'sent')));
    expect(producerRow?.messageId).toBeTruthy();

    const outcome = await applyResendEvent(db.db, {
      type: 'email.bounced',
      data: { email_id: producerRow?.messageId as string, bounce: { type: 'Permanent' } },
    });
    expect(outcome.suppressed).toBe(true);

    const suppression = await suppressionFor(db.db, { email: PRODUCER_MAILBOX, orgId });
    expect(suppression.scope).toBe('org');
    expect(suppression.reason).toBe('bounce');

    // A soft bounce, by contrast, suppresses nothing.
    const [vendorRow] = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.recipientEmail, VENDOR_MAILBOX), eq(reminders.status, 'sent')));
    const soft = await applyResendEvent(db.db, {
      type: 'email.bounced',
      data: { email_id: vendorRow?.messageId as string, bounce: { type: 'Transient' } },
    });
    expect(soft.suppressed).toBe(false);
    expect((await suppressionFor(db.db, { email: VENDOR_MAILBOX, orgId })).suppressed).toBe(false);
  });

  it('a delivery webhook moves the row to delivered', async () => {
    process.env['SEND_ENABLED'] = 'true';
    resetEnv();
    const vendorId = await seedVendor({ producerEmail: null });
    await scheduleLadder(db.db, { orgId, vendorId, now: NOW });
    await drainReminders(db.db, adapters, { now: new Date('2026-10-02T14:00:00Z') });
    const [row] = await db.db
      .select()
      .from(reminders)
      .where(and(eq(reminders.vendorId, vendorId), eq(reminders.status, 'sent')));

    await applyResendEvent(db.db, { type: 'email.delivered', data: { email_id: row?.messageId as string } });
    const [updated] = await db.db.select().from(reminders).where(eq(reminders.id, row?.id as string));
    expect(updated?.status).toBe('delivered');
    expect(updated?.deliveredAt).toBeTruthy();
  });
});
