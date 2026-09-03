import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  brandFromEnv,
  isSuppressed,
  listSuppressed,
  magicLinkEmail,
  notificationEmail,
  paymentFailedEmail,
  paymentReceiptNoticeEmail,
  sendEmail,
  signature,
  suppressEmail,
  trialEndingEmail,
  unsuppressEmail,
  welcomeEmail,
} from '../src/email';
import { createTestHarness, type TestHarness } from '../src/testing';

let h: TestHarness;
beforeEach(async () => {
  h = await createTestHarness();
});
afterEach(async () => {
  await h.close();
});

const brand = () => brandFromEnv(h.env);

describe('templates', () => {
  it('signs every message "<App>, a TheVillage company"', () => {
    expect(signature(brand())).toBe('Testbed, a TheVillage company');
    const contents = [
      magicLinkEmail(brand(), { url: 'https://x.test/login/callback?token=t', ttlMinutes: 15, isNewUser: true }),
      welcomeEmail(brand(), { firstStepUrl: 'https://x.test/dashboard', firstStepLabel: 'Start' }),
      paymentReceiptNoticeEmail(brand(), { planName: 'Starter', portalUrl: 'https://x.test/b' }),
      trialEndingEmail(brand(), { planName: 'Starter', daysLeft: 3, manageUrl: 'https://x.test/b' }),
      paymentFailedEmail(brand(), { manageUrl: 'https://x.test/b' }),
      notificationEmail(brand(), { subject: 'Rule changed', paragraphs: ['Body.'] }),
    ];
    for (const content of contents) {
      expect(content.subject.length).toBeGreaterThan(0);
      expect(content.html).toContain('Testbed, a TheVillage company');
      expect(content.text).toContain('Testbed, a TheVillage company');
      expect(content.text).toContain('support@testbed.test');
    }
  });

  it('puts the magic link in the text part, where a stripped client can find it', () => {
    const content = magicLinkEmail(brand(), {
      url: 'https://x.test/login/callback?token=abc',
      ttlMinutes: 15,
      isNewUser: false,
    });
    expect(content.text).toContain('https://x.test/login/callback?token=abc');
    expect(content.text).toContain('expires in 15 minutes');
    expect(content.subject).toBe('Your Testbed sign-in link');
  });

  it('points receipts at Stripe rather than inventing a second one', () => {
    const content = paymentReceiptNoticeEmail(brand(), {
      planName: 'Starter',
      portalUrl: 'https://x.test/settings/billing',
    });
    expect(content.text).toContain('Stripe emails the receipt');
  });

  it('escapes untrusted values instead of rendering them as markup', () => {
    const content = notificationEmail(brand(), {
      subject: 'x',
      paragraphs: ['<script>alert(1)</script>'],
    });
    expect(content.html).not.toContain('<script>');
    expect(content.html).toContain('&lt;script&gt;');
  });
});

describe('suppression', () => {
  it('blocks a send to a suppressed address, and releases it again', async () => {
    await suppressEmail(h.db, { email: 'Bounced@Contractor.test', reason: 'bounce' });
    expect(await isSuppressed(h.db, 'bounced@contractor.test')).toBe(true);

    const blocked = await sendEmail(h.db, h.adapters, {
      to: 'bounced@contractor.test',
      content: notificationEmail(brand(), { subject: 'hi', paragraphs: ['x'] }),
    });
    expect(blocked).toEqual({ status: 'suppressed', email: 'bounced@contractor.test' });
    expect(h.adapters.email.sent).toHaveLength(0);

    await unsuppressEmail(h.db, 'bounced@contractor.test');
    const sent = await sendEmail(h.db, h.adapters, {
      to: 'bounced@contractor.test',
      content: notificationEmail(brand(), { subject: 'hi', paragraphs: ['x'] }),
    });
    expect(sent.status).toBe('sent');
    expect(h.adapters.email.sent).toHaveLength(1);
  });

  it('is idempotent and answers in bulk', async () => {
    await suppressEmail(h.db, { email: 'a@x.test', reason: 'complaint' });
    await suppressEmail(h.db, { email: 'a@x.test', reason: 'bounce' });
    const set = await listSuppressed(h.db, ['a@x.test', 'b@x.test']);
    expect([...set]).toEqual(['a@x.test']);
  });

  it('passes tags through to the adapter for correlation', async () => {
    await sendEmail(h.db, h.adapters, {
      to: 'ok@contractor.test',
      content: notificationEmail(brand(), { subject: 'hi', paragraphs: ['x'] }),
      tags: { kind: 'notification', org_id: 'org_1' },
    });
    expect(h.adapters.email.last()?.tags).toEqual({ kind: 'notification', org_id: 'org_1' });
  });
});
