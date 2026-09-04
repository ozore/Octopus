import Link from 'next/link';

import { Panel } from '@/components/primitives';
import { addMemberAction, removeMemberAction, renameOrganisationAction } from '@/lib/actions';
import { getDb } from '@/lib/db';
import { listMembers } from '@octopus/platform/auth';
import { limitOf } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const MEMBER_MESSAGES: Record<string, string> = {
  added: 'Invitation sent — they can sign in with the link we emailed.',
  already_member: 'That person is already in this organisation.',
  invalid_email: 'That does not look like an email address.',
  removed: 'Member removed.',
  last_owner: 'An organisation must keep at least one owner.',
  not_found: 'That member is no longer here.',
};

/** WL-10 owns the rest of this screen (fringe plans, certifying official,
 *  notification preferences, export, delete). See BUILD.md. */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, user, membership, entitlement } = await requireOrg();
  const db = await getDb();
  const members = await listMembers(db, org.id);
  const seatLimit = limitOf(entitlement, 'seats', 1);
  const message = typeof params['member'] === 'string' ? MEMBER_MESSAGES[params['member']] : undefined;

  return (
    <>
      <h1>Settings</h1>
      {params['saved'] ? (
        <div className="wl-alert wl-alert--success" role="status">
          <div>
            <p className="wl-alert__title">Saved.</p>
          </div>
        </div>
      ) : null}
      {message ? (
        <div className="wl-alert wl-alert--info" role="status">
          <div>
            <p className="wl-alert__title">{message}</p>
          </div>
        </div>
      ) : null}

      <Panel title="Company">
        <form className="wl-stack" action={renameOrganisationAction}>
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="name">
              Legal business name
            </label>
            <input className="wl-input" id="name" name="name" type="text" defaultValue={org.name} required />
            <p className="wl-field__help">This prints on every page of every certified payroll.</p>
          </div>
          <div>
            <button className="wl-btn wl-btn--primary" type="submit" disabled={membership.role !== 'owner'}>
              Save
            </button>
          </div>
        </form>
        <p className="wl-xs wl-muted">
          Reference <span className="wl-mono">{org.slug}</span> · your role: {membership.role}
        </p>
      </Panel>

      <Panel title="People">
        <div className="wl-table-wrap wl-scroll-x">
          <table className="wl-table">
            <thead>
              <tr>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.membership.id}>
                  <td>{member.user.email}</td>
                  <td>{member.membership.role}</td>
                  <td>
                    {membership.role === 'owner' && member.user.id !== user.id ? (
                      <form action={removeMemberAction}>
                        <input type="hidden" name="userId" value={member.user.id} />
                        <button className="wl-btn wl-btn--ghost wl-btn--sm" type="submit">
                          Remove
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="wl-xs wl-muted">
          {members.length} of{' '}
          {typeof seatLimit === 'number' && seatLimit < 0 ? 'unlimited' : String(seatLimit)} seats used
          on the {entitlement.planName} plan.
        </p>
        {membership.role === 'owner' ? (
          <form className="wl-stack" action={addMemberAction}>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="email">
                Invite by email
              </label>
              <input
                className="wl-input"
                id="email"
                name="email"
                type="email"
                required
                placeholder="colleague@company.com"
              />
            </div>
            <div>
              <button className="wl-btn wl-btn--secondary" type="submit">
                Invite
              </button>
            </div>
          </form>
        ) : null}
      </Panel>

      <Panel title="Billing">
        <p className="wl-sm">
          Plan, invoices, card and cancellation live in{' '}
          <Link href="/settings/billing">billing</Link>.
        </p>
      </Panel>
    </>
  );
}
