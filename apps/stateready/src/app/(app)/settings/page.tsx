import Link from 'next/link';

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
    <main>
      <h1>Settings</h1>
      {params['saved'] ? <p className="notice">Saved.</p> : null}
      {message ? <p className="notice">{message}</p> : null}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Organisation</h2>
        <form className="row" action={renameOrganisationAction}>
          <div>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" defaultValue={org.name} required />
          </div>
          <button className="button" type="submit" disabled={membership.role !== 'owner'}>
            Save
          </button>
        </form>
        <p className="small muted">
          Slug <code>{org.slug}</code> · your role: {membership.role}
        </p>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Members</h2>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th />
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
                      <button className="button secondary small" type="submit">
                        Remove
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="small muted">
          {members.length} of {typeof seatLimit === 'number' && seatLimit < 0 ? 'unlimited' : String(seatLimit)} seats
          used on the {entitlement.planName} plan.
        </p>

        {membership.role === 'owner' ? (
          <form className="row" action={addMemberAction}>
            <div>
              <label htmlFor="email">Invite by email</label>
              <input id="email" name="email" type="email" required placeholder="colleague@company.com" />
            </div>
            <button className="button" type="submit">
              Invite
            </button>
          </form>
        ) : null}
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Billing</h2>
        <p>
          Plan, invoices, card and cancellation live in <Link href="/settings/billing">billing</Link>.
        </p>
      </section>
    </main>
  );
}
