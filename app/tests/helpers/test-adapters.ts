/**
 * A full `Adapters` bundle built from the in-repo mocks, for tests that need
 * every vendor seam (billing/email/outcome-capture all take `Adapters`, not
 * individual clients) without touching the network or a real credential.
 */

import { MockAnthropicAdapter } from '../../src/lib/adapters/anthropic.mock';
import { InMemoryNoticeSource } from '../../src/lib/adapters/notice-source.mock';
import { MockResendAdapter } from '../../src/lib/adapters/resend.mock';
import { MockStripeAdapter } from '../../src/lib/adapters/stripe.mock';
import type { Adapters } from '../../src/lib/adapters';

export function makeTestAdapters(): Adapters & { billing: MockStripeAdapter; email: MockResendAdapter } {
  return {
    model: new MockAnthropicAdapter(),
    billing: new MockStripeAdapter('whsec_test'),
    email: new MockResendAdapter('inbound_test', 'in.clausewright.test'),
    noticeSource: new InMemoryNoticeSource(),
  };
}
