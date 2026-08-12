/**
 * Email adapter — outbound AND inbound.
 *
 * Spec: ARCHITECTURE.md §2.1 (one vendor for both directions), §3.7 (the day
 * 3/10/21 outcome sequence), ADR-006 (inbound ingest is what makes monitoring
 * possible without SP-API).
 *
 * The inbound direction is the load-bearing one and the reason this is a single
 * interface rather than a send-only client: each Shield account gets a unique
 * ingest address, the seller forwards account-health notifications to it, and
 * the HMAC-verified webhook feeds the SAME classifier. Shield adds one adapter
 * and zero new engines.
 *
 * N4: there are no user accounts. The magic link sent through `send()` is the
 * entire retrieval mechanism for a paid case.
 */

export type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** Correlates a send with a case for the outcome sequence's bookkeeping. */
  tags?: Record<string, string>;
};

export type SentEmail = {
  id: string;
};

/** An inbound message as the webhook delivers it, before HMAC verification. */
export type InboundEmailPayload = {
  to: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
  receivedAt: string;
};

export interface ResendAdapter {
  send(email: OutboundEmail): Promise<SentEmail>;
  /** Throws on a bad signature. Inbound mail is untrusted stranger input twice
   *  over — verify before parsing. */
  verifyInboundWebhook(payload: string, signature: string): InboundEmailPayload;
  /** `shield+{opaque_token}@{domain}` — opaque, never derived from an email
   *  address or a merchant token. */
  buildIngestAddress(token: string): string;
}

export class InboundVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InboundVerificationError';
  }
}
