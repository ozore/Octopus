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
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getDb } from '@/db';
import { isEmail, normalizeEmail, requestMagicLink } from '@/platform/auth/magic-link';
import { SESSION_COOKIE, revokeSession } from '@/platform/auth/session';
import { queueEmail } from '@/platform/ops/outbox';

import { appClock, appConfig } from '../_lib/deps';
import { currentSession } from '../_lib/auth';

export async function sendMagicLink(formData: FormData): Promise<void> {
  const raw = String(formData.get('email') ?? '');
  const next = String(formData.get('next') ?? '');
  const email = normalizeEmail(raw);

  if (!isEmail(email)) {
    redirect(`/signin?state=invalid${next === '' ? '' : `&next=${encodeURIComponent(next)}`}`);
  }

  const db = await getDb();
  const config = appConfig();
  const issued = await requestMagicLink(
    db,
    { email },
    { baseUrl: config.APP_BASE_URL, clock: appClock() },
  );

  await queueEmail(
    db,
    {
      accountId: null,
      to: email,
      template: 'magic_link',
      payload: {
        url: next === '' ? issued.url : `${issued.url}&next=${encodeURIComponent(next)}`,
        expiresAt: issued.expiresAt.toISOString(),
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
