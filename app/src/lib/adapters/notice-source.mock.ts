/**
 * NoticeSource implementations.
 *
 * Spec: ARCHITECTURE.md ADR-006 — three implementations in priority order, and a
 * fourth (`SpApiNotificationSource`) built only when the learning justifies the
 * compliance.
 *
 * `EmailForwardNoticeSource` is a *queue reader*, not a poller: inbound mail
 * arrives at the web process as an HMAC-verified webhook, is matched by ingest
 * token, and is handed to this source. The seam exists so the worker's
 * processing loop is written once, against the interface, and does not change
 * when the source changes.
 */

import type { NoticeSource, RawNotice, ShieldAccount } from './notice-source';

/** Test double: yields a scripted list and completes. */
export class InMemoryNoticeSource implements NoticeSource {
  readonly kind = 'email_forward' as const;

  constructor(private readonly notices: RawNotice[] = []) {}

  push(notice: RawNotice): void {
    this.notices.push(notice);
  }

  async *subscribe(account: ShieldAccount): AsyncIterable<RawNotice> {
    for (const notice of this.notices) {
      if (notice.shieldAccountId === account.id) yield notice;
    }
  }
}

/**
 * (1) The primary v1 mechanism. Each Shield account gets a unique ingest
 * address; the seller sets a forwarding rule for account-health notifications.
 *
 * The known weakness, recorded because it is the single biggest risk to Shield
 * delivery (Q3): coverage depends on the seller configuring that rule, and it
 * degrades silently if their filters change. Detection latency is email-delivery
 * latency.
 */
export class EmailForwardNoticeSource implements NoticeSource {
  readonly kind = 'email_forward' as const;

  constructor(private readonly drain: (account: ShieldAccount) => Promise<RawNotice[]>) {}

  async *subscribe(account: ShieldAccount): AsyncIterable<RawNotice> {
    const batch = await this.drain(account);
    for (const notice of batch) yield notice;
  }
}

/**
 * (2) N14 / Paul Graham's "Do Things That Don't Scale": a human checks in with
 * the first 20 buyers. If nobody buys monitoring when a human is doing the work,
 * the automated version was never worth N1's compliance cost. This
 * implementation is intentionally a no-op stream — the work happens offline and
 * lands as an operator-entered notice.
 */
export class ManualReviewNoticeSource implements NoticeSource {
  readonly kind = 'manual_review' as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async *subscribe(_account: ShieldAccount): AsyncIterable<RawNotice> {
    // Deliberately empty: fulfilment is concierge until monitoring is sold.
  }
}

/**
 * (3) "Suspension radar" — storefront liveness. FLAGGED AS A HYPOTHESIS and
 * feature-flagged off (`FEATURE_STOREFRONT_RADAR`): scraping feasibility,
 * platform ToS position, contact-data availability and CAN-SPAM/GDPR posture are
 * all unverified, and it does not ship until counsel has looked at it (Q4).
 *
 * Constructing it while the flag is off is an error rather than a silent no-op,
 * so the flag cannot be bypassed by accident.
 */
export class StorefrontLivenessNoticeSource implements NoticeSource {
  readonly kind = 'storefront_liveness' as const;

  constructor(enabled: boolean) {
    if (!enabled) {
      throw new Error(
        'StorefrontLivenessNoticeSource is gated behind FEATURE_STOREFRONT_RADAR and counsel review (ADR-006, Q4)',
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async *subscribe(_account: ShieldAccount): AsyncIterable<RawNotice> {
    throw new Error('StorefrontLivenessNoticeSource is not implemented in v1');
  }
}
