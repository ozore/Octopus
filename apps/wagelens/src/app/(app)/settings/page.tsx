import Link from 'next/link';

import { Panel, StatusPill } from '@/components/primitives';
import { formatDay } from '@/components/provenance';
import { emitEvent } from '@/lib/analytics/events';
import { addMemberAction, removeMemberAction } from '@/lib/actions';
import { getDb } from '@/lib/db';
import {
  cancelDeletionAction,
  requestDeletionAction,
  saveCertifyingOfficialAction,
  saveCompanyAction,
  saveNotificationsAction,
} from '@/lib/settings-actions';
import {
  DELETION_WINDOW_DAYS,
  getSettings,
  missingFormFields,
  WORKWEEK_DAYS,
} from '@/lib/repositories/settings';
import { listMembers } from '@octopus/platform/auth';
import { limitOf } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const SAVED: Record<string, string> = {
  company: 'Saved. Payrolls you have already certified keep the name and address they were filed with.',
  certifying: 'Saved. These are prefilled at certification and can be changed each week.',
  notifications: 'Saved.',
  deletion_requested: 'Deletion requested.',
  deletion_cancelled: 'Deletion cancelled — nothing was removed.',
};

const ERRORS: Record<string, string> = {
  legal_name_required:
    'The legal business name prints on every page of every form, so it cannot be blank once set.',
  businessPostalCode: 'A postal code looks like 77002 or 77002-1234.',
  businessPhone: 'A phone number needs ten digits — the form prints ( _ _ _ ) _ _ _ - _ _ _ _.',
  defaultCertifyingPhone: 'A phone number needs ten digits.',
  defaultCertifyingEmail: 'That does not look like an email address.',
  workweek_blocked:
    'A draft payroll is open. Changing the first day of the week reorders its seven-day grid, so certify or delete the draft first.',
  confirm_name: 'The typed name did not match, so nothing was changed.',
};

const MEMBER_MESSAGES: Record<string, string> = {
  added: 'Invitation sent — they can sign in with the link we emailed.',
  already_member: 'That person is already in this organisation.',
  invalid_email: 'That does not look like an email address.',
  removed: 'Member removed.',
  last_owner: 'An organisation must keep at least one owner.',
  not_found: 'That member is no longer here.',
};

/**
 * `/settings` — WL-10.
 *
 * These are **stable facts about the company**, and that is why they live here
 * rather than inside the weekly payroll flow. Page 2 of the WH-347 demands the
 * certifying official and the fringe-plan block per worker; re-entering them
 * every Friday would be the fastest possible way to make week 2 slower than
 * week 1, which is the one thing the MVP cannot afford.
 *
 * **V7 is stated on the screen, not only in the code**: changing the company
 * name or address affects payrolls created from now on. Payrolls already
 * certified keep the name and address they were filed with, and their documents
 * are never regenerated.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, user, membership, entitlement } = await requireOrg();
  const db = await getDb();
  const [settings, members] = await Promise.all([getSettings(db, org.id), listMembers(db, org.id)]);
  const isOwner = membership.role === 'owner';
  const seatLimit = limitOf(entitlement, 'seats', 1);
  const missing = missingFormFields(org.name, settings);

  const panel = typeof params['panel'] === 'string' ? params['panel'] : 'company';
  await emitEvent(db, 'settings_viewed', { orgId: org.id, userId: user.id, props: { panel } });

  const saved = typeof params['saved'] === 'string' ? SAVED[params['saved']] : undefined;
  const error = typeof params['error'] === 'string' ? ERRORS[params['error']] : undefined;
  const memberMessage =
    typeof params['member'] === 'string' ? MEMBER_MESSAGES[params['member']] : undefined;

  const deletionDue = settings.deletionRequestedAt
    ? new Date(settings.deletionRequestedAt.getTime() + DELETION_WINDOW_DAYS * 24 * 3600 * 1000)
    : undefined;

  return (
    <>
      <h1>Settings</h1>

      {saved ? (
        <div className="wl-alert wl-alert--success" role="status" data-testid="settings-saved">
          <div>
            <p className="wl-alert__title">{saved}</p>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="settings-error">
          <div>
            <p className="wl-alert__title">{error}</p>
          </div>
        </div>
      ) : null}
      {memberMessage ? (
        <div className="wl-alert wl-alert--info" role="status">
          <div>
            <p className="wl-alert__title">{memberMessage}</p>
          </div>
        </div>
      ) : null}

      {deletionDue ? (
        <div className="wl-alert wl-alert--warn" role="alert" data-testid="deletion-banner">
          <div>
            <p className="wl-alert__title">
              This organisation is scheduled for deletion on {formatDay(deletionDue)}.
            </p>
            <p className="wl-alert__body">
              Everything still works until then. Export what you need first — a certified payroll is
              subject to a three-year federal retention obligation that is yours, not ours.
            </p>
            <form action={cancelDeletionAction}>
              <button className="wl-btn wl-btn--secondary wl-btn--sm" type="submit">
                Cancel deletion
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {missing.length > 0 ? (
        <div className="wl-alert wl-alert--warn" role="note" data-testid="settings-incomplete">
          <div>
            <p className="wl-alert__title">A WH-347 cannot print without: {missing.join(', ')}.</p>
            <p className="wl-alert__body">
              These print on the face of every form. Filling them in now is cheaper than discovering
              it on a Friday.
            </p>
          </div>
        </div>
      ) : null}

      <Panel title="Company">
        <form className="wl-stack" action={saveCompanyAction}>
          <input
            type="hidden"
            name="currentWorkweekStartDay"
            value={String(settings.workweekStartDay)}
          />
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="legalName">
              Legal business name (as it appears on your contract)
            </label>
            <input
              className="wl-input"
              id="legalName"
              name="legalName"
              type="text"
              defaultValue={org.name}
              required
            />
            <p className="wl-field__help">
              This prints on every page of every certified payroll. The form wants the name on the
              contract, not the trading name.
            </p>
          </div>
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="addressLine1">
              Business address
            </label>
            <input
              className="wl-input"
              id="addressLine1"
              name="addressLine1"
              type="text"
              defaultValue={settings.businessAddressLine1 ?? ''}
              placeholder="1200 Industrial Blvd"
            />
            <input
              className="wl-input"
              id="addressLine2"
              name="addressLine2"
              type="text"
              defaultValue={settings.businessAddressLine2 ?? ''}
              placeholder="Suite 4 (optional)"
              aria-label="Address line 2"
            />
          </div>
          <div className="wl-cols-4">
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="city">
                City
              </label>
              <input
                className="wl-input"
                id="city"
                name="city"
                type="text"
                defaultValue={settings.businessCity ?? ''}
              />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="stateCode">
                State
              </label>
              <input
                className="wl-input"
                id="stateCode"
                name="stateCode"
                type="text"
                maxLength={2}
                defaultValue={settings.businessStateCode ?? ''}
              />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="postalCode">
                Postal code
              </label>
              <input
                className="wl-input"
                id="postalCode"
                name="postalCode"
                type="text"
                defaultValue={settings.businessPostalCode ?? ''}
                placeholder="77002"
              />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="phone">
                Phone
              </label>
              <input
                className="wl-input"
                id="phone"
                name="phone"
                type="tel"
                defaultValue={settings.businessPhone ?? ''}
              />
            </div>
          </div>

          <div className="wl-cols-2">
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="workweekStartDay">
                The working week starts on
              </label>
              <select
                className="wl-select"
                id="workweekStartDay"
                name="workweekStartDay"
                defaultValue={String(settings.workweekStartDay)}
              >
                {WORKWEEK_DAYS.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
              <p className="wl-field__help">
                It orders the seven columns of the hours grid. It cannot be changed while a draft
                payroll is open.
              </p>
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="defaultDailyHours">
                A normal day is
              </label>
              <input
                className="wl-input wl-input--num"
                id="defaultDailyHours"
                name="defaultDailyHours"
                type="text"
                inputMode="decimal"
                defaultValue={settings.defaultDailyHours}
              />
              <p className="wl-field__help">The value the hours grid fills a cell with.</p>
            </div>
          </div>

          <p className="wl-xs wl-muted">
            <strong>Changing this affects payrolls you create from now on.</strong> Payrolls you have
            already certified keep the name and address they were filed with, and their documents are
            never regenerated.
          </p>
          <div>
            <button className="wl-btn wl-btn--primary" type="submit" disabled={!isOwner}>
              Save company
            </button>
          </div>
        </form>

        <div className="wl-panel" data-testid="wh347-header-preview">
          <div className="wl-panel__body wl-stack-2">
            <p className="wl-xs wl-muted">This is the header block that will print:</p>
            <p className="wl-mono wl-sm">
              {org.name || '—'}
              <br />
              {settings.businessAddressLine1 || '—'}
              {settings.businessAddressLine2 ? (
                <>
                  <br />
                  {settings.businessAddressLine2}
                </>
              ) : null}
              <br />
              {[settings.businessCity, settings.businessStateCode, settings.businessPostalCode]
                .filter(Boolean)
                .join(', ') || '—'}
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Certifying official">
        <p className="wl-sm wl-muted">
          Prefilled when you certify, and editable each week. It signs page 2 — the Statement of
          Compliance.
        </p>
        <form className="wl-stack" action={saveCertifyingOfficialAction}>
          <div className="wl-cols-2">
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="certifyingName">
                Name
              </label>
              <input
                className="wl-input"
                id="certifyingName"
                name="certifyingName"
                type="text"
                defaultValue={settings.defaultCertifyingName ?? ''}
              />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="certifyingTitle">
                Title
              </label>
              <input
                className="wl-input"
                id="certifyingTitle"
                name="certifyingTitle"
                type="text"
                defaultValue={settings.defaultCertifyingTitle ?? ''}
              />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="certifyingPhone">
                Phone
              </label>
              <input
                className="wl-input"
                id="certifyingPhone"
                name="certifyingPhone"
                type="tel"
                defaultValue={settings.defaultCertifyingPhone ?? ''}
              />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="certifyingEmail">
                Email
              </label>
              <input
                className="wl-input"
                id="certifyingEmail"
                name="certifyingEmail"
                type="email"
                defaultValue={settings.defaultCertifyingEmail ?? ''}
              />
            </div>
          </div>
          <div>
            <button className="wl-btn wl-btn--primary" type="submit">
              Save certifying official
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Fringe benefit plans and apprenticeship programs">
        <p className="wl-sm">
          Page 2 of the WH-347 prints your fringe plans (name, type, plan number, funded or
          unfunded) and any registered apprenticeship program. They are recorded once, with the
          weekly payroll flow that uses them.
        </p>
        <p className="wl-xs wl-muted">
          Their screens belong to the payroll and crew modules, which own those tables — see
          <span className="wl-mono"> BUILD.md</span> §2. This panel is the signpost, not a second
          place to edit them.
        </p>
      </Panel>

      <Panel title="Notifications">
        <form className="wl-stack" action={saveNotificationsAction}>
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="alertEmails">
              <input
                id="alertEmails"
                name="alertEmails"
                type="checkbox"
                defaultChecked={settings.alertEmailsEnabled}
              />{' '}
              Email me when a determination one of my projects is pinned to changes
            </label>
            <p className="wl-field__help">
              This is the only marketing-shaped switch in the product, and it stops determination
              alerts only. Sign-in links, the reminder before a first charge and renewal notices are
              never affected by it. The in-app alert is created either way.
            </p>
          </div>
          <div>
            <button className="wl-btn wl-btn--primary" type="submit">
              Save notifications
            </button>
          </div>
        </form>
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
                    {isOwner && member.user.id !== user.id ? (
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
          {typeof seatLimit === 'number' && seatLimit < 0 ? 'unlimited' : String(seatLimit)} seats
          used on the {entitlement.planName} plan. Your sign-in address cannot be changed here — it
          is the login identity, and changing it is an account-takeover surface. Support handles it.
        </p>
        {isOwner ? (
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
        <p className="wl-row">
          <StatusPill tone={entitlement.active ? 'filed' : 'none'}>{entitlement.status}</StatusPill>
          <span className="wl-sm">{entitlement.planName}</span>
        </p>
        <p className="wl-sm">
          Plan, next charge, invoices, card and cancellation live in{' '}
          <Link href="/settings/billing">billing</Link>.
        </p>
      </Panel>

      <Panel title="Your data">
        <p className="wl-sm">
          Every payroll you have certified can be exported with its rates, their sources and the
          dates they were read — see <Link href="/payroll">payroll history</Link>. Export before you
          delete: a certified payroll carries a <strong>three-year federal retention obligation
          that is the contractor&rsquo;s, not ours</strong>, and we are not a substitute for your own
          copy.
        </p>

        {isOwner && !settings.deletionRequestedAt ? (
          <form className="wl-stack" action={requestDeletionAction}>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="confirmName">
                To delete this organisation, type its legal name
              </label>
              <input
                className="wl-input"
                id="confirmName"
                name="confirmName"
                type="text"
                placeholder={org.name}
                autoComplete="off"
              />
              <p className="wl-field__help">
                Deletion is scheduled {DELETION_WINDOW_DAYS} days out, not immediate. Everything
                keeps working until then and you can cancel it from this page.
              </p>
            </div>
            <div>
              <button className="wl-btn wl-btn--danger" type="submit">
                Request deletion
              </button>
            </div>
          </form>
        ) : null}
      </Panel>
    </>
  );
}
