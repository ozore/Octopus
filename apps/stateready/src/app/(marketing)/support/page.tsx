import Link from 'next/link';

import { getEnv } from '@/env';
import {
  BODY_MAX,
  BODY_MIN,
  HUMAN_RESPONSE,
  SUBJECT_MAX,
  SUBJECT_MIN,
} from '@/lib/support/autoresponder';
import { submitTicketAction } from '@/lib/support/actions';
import { getSession } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ask us — StateReady',
  description:
    'Send us a message and we reply within one business day. If a regulatory value looks wrong, tell us and it goes into our review queue rather than into an inbox.',
};

/**
 * `/support` — the form, and it works **logged out** (`specs/11` §Edge cases).
 * A person who cannot sign in is exactly the person who needs it to.
 *
 * The "this rule looks wrong" option is not a nicety and it is not a category:
 * it routes the message into the knowledge-base review queue with the board
 * link attached rather than into general support. Those are the most valuable
 * tickets we will get, and an inbox is where they go to die.
 */
export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const session = await getSession();

  const reference = typeof params['reference'] === 'string' ? params['reference'] : null;
  const error = typeof params['error'] === 'string' ? params['error'] : null;
  const subject = typeof params['subject'] === 'string' ? params['subject'] : '';
  const sourceUrl = typeof params['sourceUrl'] === 'string' ? params['sourceUrl'] : '';
  const recordId = typeof params['recordId'] === 'string' ? params['recordId'] : '';

  return (
    <main className="narrow">
      <p className="sr-eyebrow">Support</p>
      <h1>Ask us</h1>
      <p className="sr-lead">
        A person reads every message. We acknowledge it immediately with a reference and three articles that
        may already answer it, and a human replies within {HUMAN_RESPONSE}.
      </p>

      {reference ? (
        <p className="notice" data-testid="support-reference">
          We have it. Your reference is <strong>{reference}</strong>. Check your inbox — the acknowledgement
          carries the three articles closest to what you asked.
        </p>
      ) : null}
      {error ? (
        <p className="notice error" data-testid="support-error">
          {error === 'rate_limited'
            ? 'That is a lot of messages in one hour. Give us a moment to catch up — nothing you sent has been lost.'
            : error === 'subject'
              ? `A subject is between ${SUBJECT_MIN} and ${SUBJECT_MAX} characters.`
              : `Tell us a little more — between ${BODY_MIN} and ${BODY_MAX} characters.`}
        </p>
      ) : null}

      <form action={submitTicketAction} className="stack" data-testid="support-form">
        <div>
          <label htmlFor="kind">What kind of message is this?</label>
          <select defaultValue={sourceUrl ? 'data_quality' : 'support'} id="kind" name="kind">
            <option value="support">A question about the product</option>
            <option value="data_quality">This rule looks wrong</option>
          </select>
          <p className="small muted">
            &ldquo;This rule looks wrong&rdquo; goes into our knowledge-base review queue with the board link
            attached, not into an inbox.
          </p>
        </div>

        <div>
          <label htmlFor="email">Your email</label>
          <input
            defaultValue={session?.user.email ?? ''}
            id="email"
            name="email"
            required
            type="email"
          />
        </div>

        <div>
          <label htmlFor="subject">Subject</label>
          <input
            defaultValue={subject}
            id="subject"
            maxLength={SUBJECT_MAX}
            minLength={SUBJECT_MIN}
            name="subject"
            required
            type="text"
          />
        </div>

        <div>
          <label htmlFor="body">What happened</label>
          <textarea id="body" maxLength={BODY_MAX} minLength={BODY_MIN} name="body" required rows={8} />
          <p className="small muted">
            If it is about a value we showed you, paste the board link that was next to it. That is the
            fastest possible fix.
          </p>
        </div>

        <div>
          <label htmlFor="sourceUrl">The board link we showed you (optional)</label>
          <input defaultValue={sourceUrl} id="sourceUrl" name="sourceUrl" type="url" />
        </div>
        <input name="recordId" type="hidden" value={recordId} />

        <button className="button" data-testid="support-submit" type="submit">
          Send
        </button>
      </form>

      <p className="small">
        You do not need an account to send this. Or write to{' '}
        <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a>. Before you do,{' '}
        <Link href="/help">the fifteen answers</Link> may already have it.
      </p>
    </main>
  );
}
