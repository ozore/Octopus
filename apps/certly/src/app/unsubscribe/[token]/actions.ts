'use server';

/**
 * THE STATUTORY OPT-OUT — `specs/07` §6.1 element 3, A5, A13.
 *
 * NO LOGIN, NO FEE, NO INFORMATION BEYOND THE ADDRESS, and honoured
 * immediately rather than within the ten business days the statute allows.
 * That is why this action lives outside the `(app)` group and takes no session:
 * an opt-out that needs an account is not an opt-out.
 *
 * `scope='org'` stops this one customer's requests; `scope='global'` stops
 * every customer's, which is the one that satisfies the statute. Both are
 * offered on the same page and neither is hidden behind the other.
 */

import { redirect } from 'next/navigation';

import { isValidEmail, normaliseEmail } from '@octopus/platform/auth';
import { suppressEmail } from '@octopus/platform/email';
import { track } from '@octopus/platform/events';

import { getDb } from '@/lib/db';
import { resolveUnsubscribeToken, suppress } from '@/lib/reminders';

export async function unsubscribeAction(formData: FormData): Promise<void> {
  const db = await getDb();
  const token = String(formData.get('token') ?? '');
  const scope = String(formData.get('scope') ?? 'global') === 'org' ? 'org' : 'global';
  const typed = String(formData.get('email') ?? '').trim();

  const subject = await resolveUnsubscribeToken(db, token);
  const email = normaliseEmail(subject?.email ?? typed);
  if (!isValidEmail(email)) redirect(`/unsubscribe/${encodeURIComponent(token)}?state=invalid_email`);

  if (scope === 'org') {
    // An org-scoped stop needs to know WHICH org, and only the token carries
    // that. Without one, the honest answer is the global stop — which is more
    // than the recipient asked for but never less.
    if (!subject) redirect(`/unsubscribe/${encodeURIComponent(token)}?state=need_token`);
    await suppress(db, { email, scope: 'org', orgId: subject.orgId, reason: 'unsubscribe' });
    await track(db, { name: 'unsubscribed', orgId: subject.orgId, props: { scope: 'org' } });
    redirect(`/unsubscribe/${encodeURIComponent(token)}?state=stopped_org`);
  }

  await suppress(db, { email, scope: 'global', orgId: null, reason: 'unsubscribe' });
  // The platform's own list too, so no other product in the company can mail
  // this address either. "Stop all requests" has to mean all of them.
  await suppressEmail(db, { email, reason: 'unsubscribe', note: 'vendor opt-out, global scope' });
  await track(db, { name: 'unsubscribed', props: { scope: 'global' } });
  redirect(`/unsubscribe/${encodeURIComponent(token)}?state=stopped_all`);
}
