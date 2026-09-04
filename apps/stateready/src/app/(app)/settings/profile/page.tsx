import { requestEmailChangeAction } from '@/lib/actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const MESSAGES: Record<string, string> = {
  invalid: 'That does not look like an email address.',
  taken: 'Somebody already signs in with that address.',
  sent: 'Check the new address — the change lands when you click the link there, and not before.',
  changed: 'Your address has been changed. Sign in with it next time.',
  expired: 'That link has expired. Ask for another.',
  used: 'That link has already been used.',
};

/**
 * `/settings/profile` — `specs/10` AC4.
 *
 * **The address does not move here.** Changing it sends a link to the NEW
 * address and the change lands when that address consumes the link, because
 * consuming it is the only proof the person asking owns it. An email change
 * that lands on request is an account-takeover primitive on a magic-link
 * product: the address IS the credential.
 */
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { user, org, membership } = await requireOrg();
  const key = (params['email'] ?? params['error']) as string | undefined;
  const message = key ? MESSAGES[key] : undefined;

  return (
    <main>
      <h1>Your profile</h1>
      {message ? (
        <p className={`notice${params['error'] ? ' error' : ''}`} data-testid="profile-message">
          {message}
        </p>
      ) : null}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Sign-in address</h2>
        <p>
          You sign in as <strong data-testid="current-email">{user.email}</strong> at {org.name} ({membership.role}).
        </p>
        <form action={requestEmailChangeAction} className="row">
          <div>
            <label htmlFor="newEmail">New address</label>
            <input id="newEmail" name="newEmail" type="email" required placeholder="you@company.com" />
          </div>
          <button className="button" type="submit" data-testid="change-email">
            Send a confirmation link
          </button>
        </form>
        <p className="small muted">
          We send the link to the new address, and nothing changes until it is clicked there. There is no
          password to change: the address is how you sign in.
        </p>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>What we hold about you</h2>
        <p className="small muted">
          Your email address, the organisation you belong to, your role, and your notification preferences.
          No phone number, no home address, no date of birth — the roster does not have columns for them.
        </p>
      </section>
    </main>
  );
}
