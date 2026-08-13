/**
 * The response algebra — I7, and the reason this system has no pager.
 *
 * Spec: ARCHITECTURE.md §10.1. "An alert is a request that a human do something.
 * There is no human. So the alert is not the deliverable; the automatic response is.
 * Every signal is declared with its response at the type level… Adding a signal
 * without a response is a compile error."
 *
 * That last sentence is implemented literally: `respond` is a `switch` over a closed
 * union closed by `assertNever`, so a new `Signal` member does not compile until it
 * has been given one of exactly four responses. There is no `NOTIFY`, no `PAGE` and
 * no `ESCALATE` member in `Response`, and the absence is the enforcement — an
 * omission cannot be added by accident, only by editing this union, which is exactly
 * the review this decision deserves.
 */

import { assertNever } from '../../lib/types';
import type { CorpusLadderLevel } from '../../lib/types';

export type Response =
  | { readonly kind: 'DEGRADE'; readonly ladderTo: CorpusLadderLevel }
  | { readonly kind: 'FREEZE'; readonly scope: 'index' | 'build' | 'credits' | 'route' }
  | { readonly kind: 'CREDIT'; readonly policy: 'staleness_pro_rata' }
  | { readonly kind: 'ROLLBACK'; readonly to: 'previous-release' };

/**
 * The signals, each named for the probe or condition that raises it (§8.2, §10.2).
 * A counter with no automatic response — `advisory_variance_total`, for instance —
 * is deliberately NOT in this union: P4a "has no green condition and no blocking
 * power", so making it a Signal would force us to invent a response it must not
 * have.
 */
export type Signal =
  | { readonly kind: 'freshness_dated' }
  | { readonly kind: 'freshness_stale' }
  | { readonly kind: 'wd_quarantine'; readonly wdNumber: string }
  | { readonly kind: 'xsd_hash_mismatch' }
  | { readonly kind: 'canary_red' }
  | { readonly kind: 'index_count_delta' }
  | { readonly kind: 'index_zero_total' }
  | { readonly kind: 'credit_ceiling_reached' }
  | { readonly kind: 'model_budget_exhausted' }
  | { readonly kind: 'ecpr_download_anomaly'; readonly accountId: string };

export function respond(signal: Signal): Response {
  switch (signal.kind) {
    case 'freshness_dated':
      return { kind: 'DEGRADE', ladderTo: 'L1_DATED' };
    case 'freshness_stale':
      // L2 both degrades the claim and starts the credit. The credit is the
      // response returned here; the ladder move is the freshness clock's own
      // output, and the two are kept separate so a credit bug cannot suppress a
      // banner (§10.3).
      return { kind: 'CREDIT', policy: 'staleness_pro_rata' };
    case 'wd_quarantine':
      return { kind: 'FREEZE', scope: 'index' };
    case 'xsd_hash_mismatch':
      // L4 — CA XML blocked, everything federal untouched (§8.1).
      return { kind: 'FREEZE', scope: 'index' };
    case 'canary_red':
      // L5 — the only signal that rolls a release back, because it is the only one
      // that says the arithmetic moved (G1).
      return { kind: 'ROLLBACK', to: 'previous-release' };
    case 'index_count_delta':
    case 'index_zero_total':
      return { kind: 'FREEZE', scope: 'index' };
    case 'credit_ceiling_reached':
      // Fail-closed applied to our own money (§9.4). It stops further POSTING; it
      // never stops the banner, which switches to the withheld sentence.
      return { kind: 'FREEZE', scope: 'credits' };
    case 'model_budget_exhausted':
      // P12 — degrade `resolve` to the deterministic path the free generator runs on
      // every day. Not a freeze: no filing is blocked by it (§10.4).
      return { kind: 'DEGRADE', ladderTo: 'L1_DATED' };
    case 'ecpr_download_anomaly':
      return { kind: 'FREEZE', scope: 'route' };
    default:
      return assertNever(signal, 'signal with no declared automatic response');
  }
}

/** The stored form. `incidents.auto_response` has a CHECK over exactly these four,
 *  and none of them means "notify someone". */
export function autoResponseColumn(response: Response): string {
  switch (response.kind) {
    case 'DEGRADE':
      return 'degrade_claim';
    case 'FREEZE':
      return 'freeze_promotion';
    case 'CREDIT':
      return 'credit_customer';
    case 'ROLLBACK':
      return 'rollback_release';
    default:
      return assertNever(response, 'unhandled response kind');
  }
}
