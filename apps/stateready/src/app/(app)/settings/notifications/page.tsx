import Link from 'next/link';

import { getEnv } from '@/env';
import {
  sendTestAlertAction,
  setRecipientAction,
  updateNotificationPreferencesAction,
  updateOrganisationSettingsAction,
} from '@/lib/actions';
import { ALERT_OFFSETS, drainIntervalMs, DAY_MS } from '@/lib/cron';
import { getDb } from '@/lib/db';
import { US_JURISDICTIONS } from '@/lib/kb/accessors';
import { organisationCoverage } from '@/lib/repos/company';
import {
  candidateRecipients,
  DIGEST_HOUR_MAX,
  DIGEST_HOUR_MIN,
  getNotificationPreferences,
  getOrganisationSettings,
  listAlertRecipients,
  US_TIMEZONES,
} from '@/lib/repos/settings';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const OFFSET_LABEL: Record<number, string> = {
  90: '90 days — while a CE course can still be booked and a qualifier replaced',
  60: '60 days',
  30: '30 days',
  7: '7 days — when it becomes a phone call rather than a task',
  0: 'the day it expires',
  [-1]: 'the day after it lapses',
};

/**
 * `/settings/notifications` — `specs/06` §Screens and `specs/10`.
 *
 * The honest note beside the digest hour is not decoration and it is not
 * optional. On Vercel Hobby the cron fires once a day, so the hour a recipient
 * chooses is **the hour their digest is released after**, not the hour it
 * arrives — and it becomes exact on the day the schedule goes hourly, with no
 * migration and no code change. Saying so here, in the help article and in the
 * digest footer is what keeps `digestHourLocal` an honest field rather than a
 * decorative one.
 */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const { org, user, membership } = await requireOrg();
  const db = await getDb();

  const prefs = await getNotificationPreferences(db, user.id, org.id);
  const settings = await getOrganisationSettings(db, org.id);
  const recipients = await listAlertRecipients(db, org.id);
  const candidates = await candidateRecipients(db, org.id);
  const coverage = await organisationCoverage(db, org.id, new Date().toISOString().slice(0, 10));
  const footprint = [...new Set(coverage.map((c) => c.state))];
  const states = footprint.length > 0 ? footprint : [...US_JURISDICTIONS];

  const offsets = new Set((prefs.offsets as number[]) ?? []);
  const muted = new Set((prefs.mutedStates as string[]) ?? []);
  const daily = drainIntervalMs(env.CRON_EXPRESSION) >= DAY_MS;

  return (
    <main>
      <h1>Notifications</h1>
      {params['saved'] ? <p className="notice">Saved.</p> : null}
      {params['error'] === 'timezone' ? (
        <p className="notice error">That is not a time zone we can schedule against.</p>
      ) : null}
      {params['test'] === 'sent' ? (
        <p className="notice" data-testid="test-alert-sent">
          Sent. It is the digest you would receive today, to {user.email}.
        </p>
      ) : null}
      {params['test'] === 'empty' ? (
        <p className="notice">
          Nothing is due inside your alert window today, so there is nothing to show you. We never send
          &ldquo;nothing to report&rdquo;.
        </p>
      ) : null}

      <section className="card">
        <h2 style={{ marginTop: 0 }}>What you get</h2>
        <form action={updateNotificationPreferencesAction} className="stack">
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="small muted">Tell me at</legend>
            {ALERT_OFFSETS.map((offset) => (
              <label key={offset} style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400 }}>
                <input
                  type="checkbox"
                  name="offset"
                  id={`offset-${offset}`}
                  value={offset}
                  defaultChecked={offsets.has(offset)}
                  style={{ inlineSize: 'auto', minBlockSize: 'auto' }}
                />
                {OFFSET_LABEL[offset]}
              </label>
            ))}
          </fieldset>

          <div className="row">
            <div>
              <label htmlFor="timezone">Time zone</label>
              <select id="timezone" name="timezone" defaultValue={prefs.timezone}>
                {US_TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replace('America/', '').replace('Pacific/', '').replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="digestHourLocal">Aim the digest at</label>
              <select id="digestHourLocal" name="digestHourLocal" defaultValue={String(prefs.digestHourLocal)}>
                {Array.from({ length: DIGEST_HOUR_MAX - DIGEST_HOUR_MIN + 1 }, (_, i) => DIGEST_HOUR_MIN + i).map(
                  (hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, '0')}:00 local
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
          <p className="small muted" data-testid="digest-hour-note">
            {daily
              ? 'We currently send one digest a day; your digest is released in the first run on or after this hour. It becomes exact the day our schedule goes hourly — the hour you choose here is already the one that will be used.'
              : 'Your digest is released in the run that opens at this hour.'}
          </p>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="small muted">Mute a state (yours only — nobody else&rsquo;s digest changes)</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {states.map((state) => (
                <label
                  key={state}
                  htmlFor={`mute-${state}`}
                  style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400 }}
                >
                  <input
                    type="checkbox"
                    id={`mute-${state}`}
                    name="mutedState"
                    value={state}
                    defaultChecked={muted.has(state)}
                    style={{ inlineSize: 'auto', minBlockSize: 'auto' }}
                  />
                  {state}
                </label>
              ))}
            </div>
          </fieldset>

          <label htmlFor="paused" style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400 }}>
            <input
              type="checkbox"
              id="paused"
              name="paused"
              defaultChecked={prefs.paused}
              style={{ inlineSize: 'auto', minBlockSize: 'auto' }}
            />
            Pause my alerts entirely
          </label>
          <p className="small muted">
            Paused is recorded against every deadline that passes an alert point while it is on, so your
            history shows what we did not send and why.
          </p>

          <div className="row">
            <button className="button" type="submit">
              Save preferences
            </button>
          </div>
        </form>

        <form action={sendTestAlertAction} style={{ marginTop: 16 }}>
          <button className="button secondary" type="submit" data-testid="send-test-alert">
            Send me the digest I would get today
          </button>
        </form>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Who receives a digest</h2>
        <p className="small muted">
          Each recipient gets their own digest, their own mute list and their own delivery state. A bounce
          on one address never silences another.
        </p>
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Next digest</th>
              <th>Last sent</th>
              <th>State</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => {
              const row = recipients.find((r) => r.userId === candidate.userId);
              return (
                <tr key={candidate.userId} data-testid={`recipient-${candidate.userId}`}>
                  <td>
                    {candidate.email} <span className="badge">{candidate.role}</span>
                  </td>
                  <td className="small">{row?.nextSendAt ? row.nextSendAt.toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—'}</td>
                  <td className="small">{row?.lastSentAt ? row.lastSentAt.toISOString().slice(0, 10) : 'never'}</td>
                  <td className="small">
                    {row?.suppressedAt ? (
                      <span className="badge">suppressed · {row.suppressionReason}</span>
                    ) : row?.paused ? (
                      <span className="badge">paused</span>
                    ) : candidate.enabled ? (
                      'receiving'
                    ) : (
                      'not receiving'
                    )}
                  </td>
                  <td>
                    {membership.role === 'owner' ? (
                      <form action={setRecipientAction}>
                        <input type="hidden" name="userId" value={candidate.userId} />
                        <input type="hidden" name="enabled" value={candidate.enabled ? 'false' : 'true'} />
                        <button className="button secondary small" type="submit">
                          {candidate.enabled ? 'Stop' : 'Start'}
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {membership.role === 'owner' ? (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Organisation defaults</h2>
          <form action={updateOrganisationSettingsAction} className="row">
            <div>
              <label htmlFor="orgTimezone">Default time zone</label>
              <select id="orgTimezone" name="timezone" defaultValue={settings.timezone}>
                {US_TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replace('America/', '').replace('Pacific/', '').replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="orgDigestHour">Default digest hour</label>
              <select id="orgDigestHour" name="digestHourLocal" defaultValue={String(settings.digestHourLocal)}>
                {Array.from({ length: DIGEST_HOUR_MAX - DIGEST_HOUR_MIN + 1 }, (_, i) => DIGEST_HOUR_MIN + i).map(
                  (hour) => (
                    <option key={hour} value={hour}>
                      {String(hour).padStart(2, '0')}:00
                    </option>
                  ),
                )}
              </select>
            </div>
            <label htmlFor="ccTechnicians" style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 400 }}>
              <input
                type="checkbox"
                id="ccTechnicians"
                name="ccTechnicians"
                defaultChecked={settings.ccTechnicians}
                style={{ inlineSize: 'auto', minBlockSize: 'auto' }}
              />
              Copy a technician on their own licence only
            </label>
            <button className="button" type="submit">
              Save defaults
            </button>
          </form>
        </section>
      ) : null}

      <p className="small muted">
        Every alert we have ever sent, and every one we suppressed and why, is on{' '}
        <Link href="/alerts">your alert history</Link>.
      </p>
    </main>
  );
}
