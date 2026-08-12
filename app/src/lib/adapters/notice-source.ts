/**
 * NoticeSource — the seam that makes SP-API a later adapter instead of a
 * re-architecture.
 *
 * Spec: ARCHITECTURE.md ADR-006, §3.8, I4, N1, N14.
 *
 * SP-API's `ACCOUNT_STATUS_CHANGED` (NORMAL / AT_RISK / DEACTIVATED) is the
 * right primitive for Shield. Reaching it requires a *public* application —
 * Appstore listing, Solution Provider Agreement, Acceptable Use and Data
 * Protection Policy review, security questionnaire, per-role approval — which is
 * weeks of compliance producing zero learning about A4, the assumption v1 exists
 * to test. So we build the seam now and walk through it when the learning
 * justifies the compliance. That deferral, not the avoidance, is the point of N1.
 *
 * I4 is structural here: no implementation of this interface may accept a
 * marketplace credential, cookie or session. There is no code path in this
 * system that does, and that removes an entire risk class for free.
 *
 * Ship order (ADR-006): EmailForward → ManualReview → StorefrontLiveness
 * (feature-flagged off, unshipped until counsel review). SpApiNotificationSource
 * is a fourth implementation.
 */

export type ShieldAccount = {
  id: string;
  ingestToken: string;
  marketplace: 'amazon' | 'walmart' | 'unknown';
};

export type RawNotice = {
  shieldAccountId: string;
  receivedAt: Date;
  /** Subject/body as received. Passed through the SAME classifier as a pasted
   *  notice — the classifier is language-based, not format-based, which is why a
   *  marketplace template change degrades gracefully instead of breaking a
   *  regex parser (ADR-006 "negative"). */
  subject: string;
  text: string;
  fromAddress?: string;
};

export interface NoticeSource {
  readonly kind: 'email_forward' | 'manual_review' | 'storefront_liveness' | 'sp_api';
  subscribe(account: ShieldAccount): AsyncIterable<RawNotice>;
}
