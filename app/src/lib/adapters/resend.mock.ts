/**
 * Mock email adapter. Captures sends in memory so the day-3/10/21 sequence and
 * the magic-link path are assertable without a network call or a sandbox domain.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

import type {
  InboundEmailPayload,
  OutboundEmail,
  ResendAdapter,
  SentEmail,
} from './resend';
import { InboundVerificationError } from './resend';

export class MockResendAdapter implements ResendAdapter {
  readonly sent: OutboundEmail[] = [];

  constructor(
    private readonly inboundSecret = 'inbound_test',
    private readonly ingestDomain = 'in.clausewright.test',
  ) {}

  async send(email: OutboundEmail): Promise<SentEmail> {
    this.sent.push(email);
    return { id: `msg_test_${this.sent.length}` };
  }

  verifyInboundWebhook(payload: string, signature: string): InboundEmailPayload {
    const expected = this.sign(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new InboundVerificationError('signature mismatch');
    }
    return JSON.parse(payload) as InboundEmailPayload;
  }

  buildIngestAddress(token: string): string {
    return `shield+${token}@${this.ingestDomain}`;
  }

  sign(payload: string): string {
    return createHmac('sha256', this.inboundSecret).update(payload).digest('hex');
  }

  reset(): void {
    this.sent.length = 0;
  }
}
