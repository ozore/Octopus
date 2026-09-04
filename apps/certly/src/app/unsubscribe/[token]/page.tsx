import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { resolveUnsubscribeToken } from '@/lib/reminders';
import { organisations } from '@octopus/platform/db';
import { eq } from 'drizzle-orm';

import { unsubscribeAction } from './actions';

export const dynamic = 'force-dynamic';

/**
 * `{APP_ORIGIN}/unsubscribe/<token>` — `specs/07` §6.1 element 3, §8.
 *
 * Outside the `(app)` group, so there is no shell, no navigation and no
 * session. Both scopes are on the page at once:
 *
 *   - **Stop requests from {Customer Org}** — org-scoped, A5.
 *   - **Stop all {APP_NAME} requests, from every customer** — global, A13, and
 *     the one the statute requires.
 *
 * The page also works with no valid token: a recipient who types their address
 * is honoured, because CAN-SPAM asks for an opt-out that needs no information
 * beyond the address, and the harm of honouring one too many is that we send
 * fewer emails.
 */

const MESSAGES: Record<string, string> = {
  stopped_org: 'Done. We will not email you about this customer’s vendors again.',
  stopped_all: 'Done. We will not email this address again, for any customer.',
  need_token: 'Use the link from the email to stop one customer’s requests, or stop all of them below.',
  invalid_email: 'That does not look like an email address.',
};

export default async function UnsubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const env = getEnv();
  const db = await getDb();

  const subject = await resolveUnsubscribeToken(db, token);
  let orgName: string | null = null;
  if (subject) {
    const [org] = await db
      .select({ name: organisations.name })
      .from(organisations)
      .where(eq(organisations.id, subject.orgId));
    orgName = org?.name ?? null;
  }

  const state = typeof query['state'] === 'string' ? query['state'] : undefined;
  const preselect = query['scope'] === 'org' ? 'org' : 'global';
  const done = state === 'stopped_org' || state === 'stopped_all';

  return (
    <main className="c-main">
      <section className="c-card" style={{ maxWidth: '34rem', margin: '3rem auto' }}>
        <h1 className="c-page__title">Stop these emails</h1>

        {state ? (
          <p className={`notice${state.startsWith('stopped') ? '' : ' warn'}`} data-testid="unsubscribe-state">
            {MESSAGES[state]}
          </p>
        ) : null}

        {done ? null : (
          <>
            <p className="c-small">
              {subject ? (
                <>
                  This address is <span className="c-mono">{subject.email}</span>.
                </>
              ) : (
                'Type the address you want us to stop emailing.'
              )}{' '}
              No account and no password is needed, and there is no charge. We act immediately.
            </p>

            <form action={unsubscribeAction}>
              <input type="hidden" name="token" value={token} />
              {subject ? null : (
                <label className="c-field">
                  <span className="c-field__label">Your email address</span>
                  <input className="c-input" name="email" type="email" required />
                </label>
              )}

              {orgName ? (
                <p>
                  <button
                    className="c-btn c-btn--secondary"
                    type="submit"
                    name="scope"
                    value="org"
                    data-testid="stop-org"
                    autoFocus={preselect === 'org'}
                  >
                    Stop requests from {orgName}
                  </button>
                </p>
              ) : null}

              <p>
                <button
                  className="c-btn c-btn--primary"
                  type="submit"
                  name="scope"
                  value="global"
                  data-testid="stop-global"
                >
                  Stop all {env.APP_NAME} requests, from every customer
                </button>
              </p>
            </form>
          </>
        )}

        <p className="c-xs c-muted">
          {env.APP_NAME}
          <br />
          {env.COMPANY_ADDRESS}
        </p>
      </section>
    </main>
  );
}
