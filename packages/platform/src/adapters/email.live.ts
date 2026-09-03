/** Live email adapter — the only module that imports the Resend SDK. */

import { Resend } from 'resend';

import type { EmailAdapter, OutboundEmail, SentEmail } from './email';

export type LiveEmailOptions = {
  apiKey: string;
  from: string;
  replyTo?: string | undefined;
};

export class LiveEmailAdapter implements EmailAdapter {
  private readonly client: Resend;

  constructor(private readonly opts: LiveEmailOptions) {
    this.client = new Resend(opts.apiKey);
  }

  async send(email: OutboundEmail): Promise<SentEmail> {
    const replyTo = email.replyTo ?? this.opts.replyTo;
    const result = await this.client.emails.send({
      from: this.opts.from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      ...(email.text ? { text: email.text } : {}),
      ...(replyTo ? { replyTo } : {}),
      ...(email.tags
        ? {
            tags: Object.entries(email.tags).map(([name, value]) => ({
              name,
              // Resend rejects tag values outside [A-Za-z0-9_-]; ids and event
              // names pass, an email address would not.
              value: value.replace(/[^A-Za-z0-9_-]/g, '_'),
            })),
          }
        : {}),
    } as Parameters<Resend['emails']['send']>[0]);

    if (result.error) throw new Error(`Resend send failed: ${result.error.message}`);
    return { id: result.data?.id ?? '' };
  }
}
