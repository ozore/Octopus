/**
 * `/app/billing` — the address Stripe returns to.
 *
 * `USER_JOURNEY.md` §0.6 puts the billing screen at `/app/settings/billing`, and the
 * checkout and portal helpers in `src/platform/billing/checkout.ts` build their
 * return URLs against `/app/billing`. Rather than edit another module's return
 * addresses — or, worse, publish two billing screens — this route redirects. A
 * customer coming back from Stripe lands on the one billing surface, and there is
 * exactly one implementation of it.
 */

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BillingRedirect({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<never> {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') query.set(key, value);
  }
  const suffix = query.toString();
  redirect(`/app/settings/billing${suffix === '' ? '' : `?${suffix}`}`);
}
