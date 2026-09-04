/**
 * The GC Roll-up waitlist's consent wording, and its content hash.
 *
 * An address collected on a pricing page is a marketing list like any other, so
 * it takes WL-14's consent shape rather than a bare input: an **unticked** box
 * that says what the address will be used for, the hash of that wording stored
 * on the row, and a hashed IP. If the wording changes, the record still says
 * what THIS person agreed to.
 *
 * There is deliberately no double opt-in here and no send path at all: nothing
 * is ever sent to this list by the product. When WL-24 ships, the founder
 * exports it and writes one message by hand — which is the honest way to use a
 * list of fifty people who asked about a tier that did not exist yet.
 */

import { createHash } from 'node:crypto';

export const GC_WAITLIST_CONSENT =
  'Email me once when the GC Roll-up tier is available. I can unsubscribe from that email.';

export function gcConsentVersion(): string {
  return createHash('sha256').update(GC_WAITLIST_CONSENT).digest('hex').slice(0, 32);
}
