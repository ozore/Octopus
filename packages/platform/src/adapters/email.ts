/**
 * Email port. One vendor (Resend), outbound only — the platform has no inbound
 * mail surface; support mail goes to the founder's mailbox (PLAN.md A6).
 */

export type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Correlates a send with an organisation/user for the events table. */
  tags?: Record<string, string>;
};

export type SentEmail = { id: string };

export interface EmailAdapter {
  send(email: OutboundEmail): Promise<SentEmail>;
}
