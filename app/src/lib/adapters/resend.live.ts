/**
 * Live email adapter — the only place that imports the Resend SDK.
 *
 * Spec: ARCHITECTURE.md §2.1, §3.7, ADR-006. One vendor for both directions:
 * outbound (magic link, day-3/10/21 outcome sequence) and inbound (the ingest
 * address that makes Shield possible without SP-API).
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';

import type {
  InboundEmailPayload,
  OutboundEmail,
  ResendAdapter,
  SentEmail,
} from './resend';
import { InboundVerificationError } from './resend';

export type LiveResendOptions = {
  apiKey: string;
  from: string;
  inboundSigningSecret?: string | undefined;
  ingestDomain: string;
};

export class LiveResendAdapter implements ResendAdapter {
  private readonly client: Resend;

  constructor(private readonly opts: LiveResendOptions) {
    this.client = new Resend(opts.apiKey);
  }

  async send(email: OutboundEmail): Promise<SentEmail> {
    const result = await this.client.emails.send({
      from: this.opts.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      ...(email.text ? { text: email.text } : {}),
      ...(email.replyTo ? { replyTo: email.replyTo } : {}),
      ...(email.tags
        ? { tags: Object.entries(email.tags).map(([name, value]) => ({ name, value })) }
        : {}),
    } as Parameters<Resend['emails']['send']>[0]);

    if (result.error) throw new Error(`Resend send failed: ${result.error.message}`);
    return { id: result.data?.id ?? '' };
  }

  verifyInboundWebhook(payload: string, signature: string): InboundEmailPayload {
    const secret = this.opts.inboundSigningSecret;
    if (!secret) throw new InboundVerificationError('RESEND_INBOUND_SIGNING_SECRET is not set');
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new InboundVerificationError('signature mismatch');
    }
    return JSON.parse(payload) as InboundEmailPayload;
  }

  buildIngestAddress(token: string): string {
    return `shield+${token}@${this.opts.ingestDomain}`;
  }
}
