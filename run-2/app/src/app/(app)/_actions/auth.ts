'use server';

/**
 * S09 — sign-in, which is an email address and nothing else.
 *
 * AUTHORITY: `USER_JOURNEY.md` §4.1 ("Signup is an email address. Magic link,
 * single-use, short-expiry, hashed at rest; no password, therefore no password reset
 * flow, therefore one fewer support surface that does not exist"), §4.5 (an expired
 * link gets the least ceremony: one sentence, one button, same screen),
 * `ARCHITECTURE.md` §11.5.
 *
 * The link is QUEUED, never sent inline: the outbox is the delivery record, the
 * worker drains it, and a mail provider being slow is not a failed sign-in. Under
 * `ADAPTER_MODE=mock` nothing leaves the process at all, which is what makes the
 * offline suite able to exercise this path.
 *
 * WHAT IS QUEUED IS A REFERENCE, NOT A LINK (security C-3). This action used to
 * write the live sign-in URL into `email_outbox.payload`, a table with no tenant
 * policy that the whole web tier can read and that nothing was purging — so one
 * `SELECT` was account takeover for every sign-in in the last fifteen minutes. The
 * row now carries the magic link's id; `drainOutbox` mints the token as it hands the
 * message to the mailer. There is no moment at which a redeemable token is at rest,
 * and `queueEmail` refuses a payload that looks like one.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getDb } from '@/db';
import {
  MAGIC_LINK_TEMPLATE,
  isEmail,
  normalizeEmail,
  requestMagicLink,
} from '@/platform/auth/magic-link';
import { SESSION_COOKIE, revokeSession } from '@/platform/auth/session';
import { queueEmail } from '@/platform/ops/outbox';

import { appClock } from '../_lib/deps';
import { currentSession } from '../_lib/auth';

export async function sendMagicLink(formData: FormData): Promise<void> {
  const raw = String(formData.get('email') ?? '');
  const next = String(formData.get('next') ?? '');
  const email = normalizeEmail(raw);

  if (!isEmail(email)) {
    redirect(`/signin?state=invalid${next === '' ? '' : `&next=${encodeURIComponent(next)}`}`);
  }

  const db = await getDb();
  const issued = await requestMagicLink(db, { email }, { clock: appClock() });

  await queueEmail(
    db,
    {
      accountId: null,
      to: email,
      template: MAGIC_LINK_TEMPLATE,
      payload: {
        // The reference. `drainOutbox` resolves it to a `link_path` at send time.
        link_id: issued.id,
        next: next === '' ? null : next,
        expires_at: issued.expiresAt.toISOString(),
      },
      idempotencyKey: `magic:${issued.id}`,
    },
    appClock(),
  );

  redirect(`/signin?state=sent&email=${encodeURIComponent(email)}`);
}

export async function signOut(): Promise<void> {
  const session = await currentSession();
  const jar = await cookies();
  if (session) {
    const db = await getDb();
    await revokeSession(db, session.id, appClock());
  }
  jar.delete(SESSION_COOKIE);
  redirect('/signin?state=signed-out');
}
