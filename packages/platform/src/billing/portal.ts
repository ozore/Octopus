/**
 * Customer Portal: Stripe's hosted page for card changes, invoices, plan
 * switches and cancellation.
 *
 * Everything money-shaped that is not "start a subscription" happens there
 * rather than in our UI. That is not laziness — it is the reason this codebase
 * has no cancellation flow, no proration arithmetic and no invoice rendering to
 * get wrong, and the reason PCI scope stays SAQ-A.
 */

import { eq } from 'drizzle-orm';

import type { Adapters } from '../adapters';
import type { Db } from '../db';
import { customers } from '../db/schema';

export type PortalResult =
  | { status: 'ok'; url: string }
  | { status: 'no_customer' };

export async function openBillingPortal(
  ctx: { db: Db; adapters: Adapters },
  input: { orgId: string; returnUrl: string; configurationId?: string },
): Promise<PortalResult> {
  const [customer] = await ctx.db
    .select()
    .from(customers)
    .where(eq(customers.orgId, input.orgId))
    .limit(1);

  // An org that never checked out has no Stripe customer; the caller shows the
  // pricing page instead of a portal button.
  if (!customer) return { status: 'no_customer' };

  const session = await ctx.adapters.billing.createPortalSession({
    customerId: customer.stripeCustomerId,
    returnUrl: input.returnUrl,
    ...(input.configurationId ? { configurationId: input.configurationId } : {}),
  });
  return { status: 'ok', url: session.url };
}
