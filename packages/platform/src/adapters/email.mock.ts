/**
 * Mock email adapter: keeps every send in memory so a test can assert on the
 * subject, the body and — for the magic link — the URL, without a network call
 * or an API key.
 */

import type { EmailAdapter, OutboundEmail, SentEmail } from './email';

export class MockEmailAdapter implements EmailAdapter {
  readonly sent: OutboundEmail[] = [];

  async send(email: OutboundEmail): Promise<SentEmail> {
    this.sent.push(email);
    return { id: `email_test_${this.sent.length}` };
  }

  last(): OutboundEmail | undefined {
    return this.sent.at(-1);
  }

  /** The first URL in the most recent message — how a test follows a magic link. */
  lastUrl(): string | undefined {
    const body = `${this.last()?.text ?? ''}\n${this.last()?.html ?? ''}`;
    return body.match(/https?:\/\/[^\s"'<>]+/)?.[0];
  }

  reset(): void {
    this.sent.length = 0;
  }
}
