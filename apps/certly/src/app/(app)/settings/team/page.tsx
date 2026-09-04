import Link from 'next/link';

import { certlyEntitlement } from '@/lib/billing/entitlement';
import { getDb } from '@/lib/db';
import { listInvitations, listMembers, roleFor } from '@/lib/repos/settings';
import { changeRoleAction, inviteMemberAction } from '@/lib/settings/actions';
import { CERTLY_ROLES, ROLE_DESCRIPTION } from '@/lib/settings/roles';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * TEAM — `specs/13` §2 and A12.
 *
 * Seats used against seats included, and the eleventh invitation on Standard is
 * REFUSED SERVER-SIDE with the plan named. The cards sell 3/10/25 seats, so a
 * seat limit that nothing enforces is a sold feature that does not exist
 * (REVIEW.md MJ-03).
 */
export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, user, membership } = await requireOrg();
  const db = await getDb();
  const [members, invitations, entitlement, myRole] = await Promise.all([
    listMembers(db, org.id),
    listInvitations(db, org.id),
    certlyEntitlement(db, org.id),
    roleFor(db, { orgId: org.id, userId: user.id, platformRole: membership.role }),
  ]);
  const canManage = myRole === 'owner';
  const token = typeof params['token'] === 'string' ? params['token'] : undefined;

  return (
    <main className="c-prose">
      <p className="c-xs c-muted">
        <Link href="/settings">Settings</Link> · Team
      </p>
      <h1>Team</h1>

      <p className="c-small" data-testid="seat-usage">
        <strong>
          {members.length + invitations.length} of {entitlement.seatLimit}
        </strong>{' '}
        seats used on {entitlement.planName}.
      </p>

      {params['error'] === 'seat_limit' ? (
        <p className="notice error" data-testid="seat-limit-error">
          {params['plan']} includes {params['limit']} seats and {params['used']} are used. Change the
          plan in <Link href="/settings/billing">billing</Link> to add another.
        </p>
      ) : null}
      {params['error'] === 'last_owner' ? (
        <p className="notice error" data-testid="last-owner-error">
          An organisation must keep at least one owner, so this change was refused.
        </p>
      ) : null}
      {params['error'] === 'already_member' ? (
        <p className="notice">That person is already in this organisation.</p>
      ) : null}
      {params['invited'] ? (
        <p className="notice" data-testid="invited">
          Invitation created. It works once and expires in seven days.
          {token ? (
            <>
              {' '}
              <a href={`/invitations/${token}`} data-testid="invitation-link">
                Open the invitation link
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="c-table-wrap">
        <table className="c-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Since</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.userId}>
                <td>{member.email}</td>
                <td>
                  {canManage ? (
                    <form action={changeRoleAction} className="c-row">
                      <input type="hidden" name="userId" value={member.userId} />
                      <select className="c-select" name="role" defaultValue={member.role} aria-label={`Role`}>
                        {CERTLY_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button className="c-btn c-btn--secondary c-btn--sm" type="submit">
                        Save
                      </button>
                    </form>
                  ) : (
                    member.role
                  )}
                </td>
                <td className="c-table__meta">{member.joinedAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>What each role can do</h2>
      <ul className="c-small">
        {CERTLY_ROLES.map((role) => (
          <li key={role}>
            <strong>{role}</strong> — {ROLE_DESCRIPTION[role]}
          </li>
        ))}
      </ul>

      {canManage ? (
        <form action={inviteMemberAction} className="c-row">
          <label className="c-field" htmlFor="invite-email" style={{ flex: 1 }}>
            <span className="c-field__label">Invite by email</span>
            <input className="c-input" id="invite-email" name="email" type="email" required />
          </label>
          <label className="c-field" htmlFor="invite-role">
            <span className="c-field__label">Role</span>
            <select className="c-select" id="invite-role" name="role" defaultValue="editor">
              {CERTLY_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <button className="c-btn c-btn--primary" type="submit" data-testid="invite-member">
            Invite
          </button>
        </form>
      ) : (
        <p className="c-small c-muted">Only an owner can invite or change roles.</p>
      )}
    </main>
  );
}
