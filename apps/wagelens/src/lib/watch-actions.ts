'use server';

/**
 * WL-14's server actions.
 *
 * Every one of them is reachable by a stranger with no account, so each begins
 * with the same three questions in the same order: is the consent there, is the
 * caller inside the rate limit, and is this address suppressed — and every
 * declining answer produces the SAME visible outcome as success. A public form
 * that says "that address is already watching" is an enumeration oracle, and
 * one that says "you have been rate limited" tells an abuser exactly how to
 * pace themselves.
 *
 * The two-step GET/POST for confirm and unsubscribe is not ceremony. Outlook
 * Safe Links and corporate scanners pre-fetch every URL in a message; a GET
 * that confirmed a subscription would be confirmed by a machine, and a GET that
 * unsubscribed would unsubscribe people who never clicked.
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { enqueue } from '@octopus/platform/jobs';

import { APP_JOB_KINDS } from '@/lib/jobs/kinds';
import { clientIp, ipHash } from '@/lib/public-request';
import { confirmWatch, requestWatch, unsubscribeWatch } from '@/lib/watch/service';
import { createHash } from 'node:crypto';

async function requestFacts() {
  const requestHeaders = await headers();
  const ip = clientIp(requestHeaders);
  return {
    ipHash: ipHash(ip),
    userAgentHash: createHash('sha256')
      .update(requestHeaders.get('user-agent') ?? 'unknown')
      .digest('hex'),
  };
}

/**
 * The public form's submit. `returnPath` is where the visitor came from — the
 * county result page or the determination page — because the form is inline on
 * both and the answer belongs beside it, not on a page of its own.
 */
export async function requestWatchAction(formData: FormData): Promise<void> {
  const db = await getDb();
  const email = String(formData.get('email') ?? '');
  const wdNumber = String(formData.get('wdNumber') ?? '');
  const consent = formData.get('consent') === 'on' || formData.get('consent') === 'true';
  const rawReturn = String(formData.get('returnPath') ?? '/lookup');
  // Only a path on this site: a redirect target from a form field is an open
  // redirect if it is not constrained.
  const returnPath = rawReturn.startsWith('/') && !rawReturn.startsWith('//') ? rawReturn : '/lookup';
  const facts = await requestFacts();

  const outcome = await requestWatch(db, {
    email,
    wdNumber,
    consent,
    ipHash: facts.ipHash,
    userAgentHash: facts.userAgentHash,
  });

  const back = (state: string) =>
    `${returnPath}${returnPath.includes('?') ? '&' : '?'}watch=${state}#watch`;

  switch (outcome.status) {
    case 'consent_required':
      redirect(back('consent_required'));
      break;
    case 'invalid_email':
      redirect(back('invalid_email'));
      break;
    case 'limit_reached':
      await emitEvent(db, 'watch_limit_reached', { props: { ip_hash: facts.ipHash } });
      redirect(back('limit_reached'));
      break;
    case 'already_confirmed':
      redirect(back('already_watching'));
      break;
    case 'silent':
      // Suppressed or rate limited. Identical copy to success, nothing written.
      redirect(back('pending'));
      break;
    case 'pending': {
      await emitEvent(db, 'alert_email_captured', { props: { wd_number: wdNumber } });
      await enqueue(db, {
        kind: APP_JOB_KINDS.watchConfirmEmail,
        payload: {
          email: outcome.watch.email,
          wdNumber,
          watchId: outcome.watch.id,
          confirmToken: outcome.confirmToken,
        },
        // One confirmation per request, not one per double-click.
        dedupeKey: `${APP_JOB_KINDS.watchConfirmEmail}:${outcome.watch.id}:${outcome.confirmToken.slice(0, 12)}`,
      });
      redirect(back('pending'));
      break;
    }
  }
}

/** The POST half of the double opt-in. A scanner's GET never reaches this. */
export async function confirmWatchAction(formData: FormData): Promise<void> {
  const db = await getDb();
  const token = String(formData.get('token') ?? '');
  const facts = await requestFacts();

  const outcome = await confirmWatch(db, { token, confirmedIpHash: facts.ipHash });
  if (outcome.status === 'confirmed') {
    await emitEvent(db, 'watch_confirmed', {
      props: {
        wd_number: outcome.watch.wdNumber,
        minutes_to_confirm: outcome.minutesToConfirm,
      },
    });
    redirect(`/watch/confirm?token=${encodeURIComponent(token)}&state=confirmed`);
  }
  redirect(`/watch/confirm?token=${encodeURIComponent(token)}&state=${outcome.status}`);
}

/** The POST half of the unsubscribe. Scope `all` also suppresses marketing
 *  mail to the address — and can never suppress a transactional send. */
export async function unsubscribeWatchAction(formData: FormData): Promise<void> {
  const db = await getDb();
  const token = String(formData.get('token') ?? '');
  const scope = String(formData.get('scope') ?? 'determination') === 'all' ? 'all' : 'determination';

  const outcome = await unsubscribeWatch(db, { token, scope });
  if (outcome.status === 'done') {
    await emitEvent(db, 'watch_unsubscribed', { props: { scope } });
    redirect(`/watch/unsubscribe?state=done&scope=${scope}`);
  }
  redirect('/watch/unsubscribe?state=invalid');
}
