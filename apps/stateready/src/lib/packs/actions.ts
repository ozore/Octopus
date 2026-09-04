'use server';

/**
 * M8's server actions.
 *
 * They live beside the module rather than in `src/lib/actions.ts` for one
 * reason worth stating: four agents are building in this app at once, and a
 * single mutation file is a merge conflict with a compliance product's money
 * path inside it. `'use server'` is a per-file contract, so a module can own
 * its own actions without owning anyone else's.
 *
 * Every one of them checks entitlement server-side. `requireOrg()` is the real
 * guard — the middleware only knows that a cookie exists.
 */

import { redirect } from 'next/navigation';

import { track } from '@octopus/platform/events';
import { requireOrg } from '@octopus/platform/next';

import { getDb } from '@/lib/db';

import { beginEntryPackCheckout } from './checkout-seam';
import { createEntryPackPurchase, getPlaybook, revokeShareToken } from './service';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The gate, then the row, then — and only then — the payment.
 *
 * A state that is not covered, or that is publishable but fails `CORE_SET`,
 * comes back here as a named refusal and the buyer is sent to the waitlist.
 * Nothing is charged and nothing is promised (`specs/08` AC5).
 */
export async function startEntryPackPurchaseAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();

  const state = String(formData.get('state') ?? '').toUpperCase();
  const trades = formData.getAll('trade').map(String);

  const result = await createEntryPackPurchase(db, {
    orgId: org.id,
    state,
    trades,
    today: today(),
    userId: user.id,
  });

  if (result.status !== 'ok') {
    redirect(`/expansion?refused=${result.status}&state=${state}`);
  }
  redirect(`/expansion/${result.playbookId}`);
}

/** Hands the already-disclosed playbook to M9's Checkout session (see `checkout-seam.ts`). */
export async function beginEntryPackCheckoutAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const playbookId = String(formData.get('playbookId') ?? '');

  const playbook = await getPlaybook(db, org.id, playbookId);
  if (!playbook) redirect('/expansion?refused=not_found');

  const result = await beginEntryPackCheckout({
    orgId: org.id,
    userId: user.id,
    playbookId: playbook.id,
    priceCents: playbook.priceCents,
    state: playbook.targetState,
    trades: playbook.trades as string[],
  });

  if (result.status === 'ok') redirect(result.url);
  redirect(`/expansion/${playbookId}?checkout=${result.status}`);
}

export async function joinExpansionWaitlistAction(formData: FormData): Promise<void> {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const state = String(formData.get('state') ?? '').toUpperCase();
  const trade = String(formData.get('trade') ?? '');

  await track(db, {
    name: 'uncovered_state_waitlisted',
    orgId: org.id,
    userId: user.id,
    props: { state, trade, source: 'expansion_picker' },
  });
  redirect(`/expansion?waitlisted=${state}`);
}

export async function revokeShareLinkAction(formData: FormData): Promise<void> {
  const { org } = await requireOrg();
  const db = await getDb();
  const playbookId = String(formData.get('playbookId') ?? '');
  await revokeShareToken(db, org.id, playbookId);
  redirect(`/expansion/${playbookId}?share=revoked`);
}
