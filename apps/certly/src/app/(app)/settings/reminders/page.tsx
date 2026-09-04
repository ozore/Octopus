import Link from 'next/link';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import {
  RUNGS,
  RUNG_OFFSET_DAYS,
  composeVendorEmail,
  ensureReminderSettings,
  ladderFor,
  listCannotChase,
  replyToFor,
  scheduleSentence,
  totalForExpiry,
} from '@/lib/reminders';
import { appOrigin } from '@/env';
import { requireOrg } from '@octopus/platform/next';

import { saveReminderSettingsAction } from './actions';

export const dynamic = 'force-dynamic';

/**
 * REMINDER SETTINGS — `specs/07` §5.
 *
 * The screen states, in words, the two promises the queue enforces and the
 * copy on the landing page makes: a recipient never gets more than one message
 * in 72 hours, and one lapse never produces more than six messages to a person
 * or ten in total. They are printed here because a customer who cannot see the
 * limits has to trust them, and `LANDING_SPEC.md` §5 sells them.
 *
 * The preview is the REAL composer, not a mock-up. If the email changes, this
 * page changes with it, which is the only way a preview stays honest.
 */
export default async function ReminderSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const env = getEnv();

  const settings = await ensureReminderSettings(db, org.id);
  const ladder = await ladderFor(db, org.id);
  const replyTo = await replyToFor(db, org.id, env.SUPPORT_EMAIL);
  const cannotChase = await listCannotChase(db, org.id);

  const preview = composeVendorEmail({
    brand: { appName: env.APP_NAME, companyAddress: env.COMPANY_ADDRESS, origin: appOrigin() },
    orgName: settings.sendingName ?? org.name,
    vendorName: 'Harbour Roofing',
    rung: 'T-30',
    expiryDate: '2026-12-01',
    policyDescription: 'General liability',
    otherExpiries: [],
    requirements: [
      { key: 'preview:1', text: 'General liability, at least $1,000,000 each occurrence / $2,000,000 general aggregate' },
      { key: 'preview:2', text: `${org.name} named as additional insured — ongoing operations (CG 20 10 or equivalent)` },
    ],
    uploadToken: 'example-token',
    unsubscribeToken: 'example-token',
    messageNumber: 2,
    messageTotal: totalForExpiry({ rungCount: ladder.length, recipientCount: 2 }),
    replyTo,
    deliveryRole: 'to',
    recipientKind: 'vendor',
  });

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Reminders</h1>
          <p className="c-page__lede">
            When a certificate is close to expiring, {env.APP_NAME} asks the vendor and the agent whose
            address is printed on the certificate. It stops the moment a current certificate arrives.
          </p>
        </div>
      </header>

      {params['saved'] ? <p className="notice">Saved.</p> : null}

      <form action={saveReminderSettingsAction}>
        <section className="c-card">
          <div className="c-card__head">
            <h2 className="c-card__title">The schedule</h2>
          </div>
          <p className="c-small c-muted">
            A rung can be removed. None can be added — a fixed schedule is what lets every message say
            how many more there will be.
          </p>
          <div className="c-remind__schedule" data-testid="ladder">
            {RUNGS.map((rung) => (
              <label className="c-remind__offset" key={rung} aria-pressed={ladder.includes(rung)}>
                <input
                  type="checkbox"
                  name={`rung:${rung}`}
                  defaultChecked={ladder.includes(rung)}
                  className="c-visually-hidden"
                />
                {rung}
                <span className="c-visually-hidden">
                  {RUNG_OFFSET_DAYS[rung] < 0
                    ? ` ${Math.abs(RUNG_OFFSET_DAYS[rung])} days before expiry`
                    : ` ${RUNG_OFFSET_DAYS[rung]} days after expiry`}
                </span>
              </label>
            ))}
          </div>
          <p className="c-remind__stop c-small" data-testid="ladder-limits">
            Two limits {env.APP_NAME} enforces whatever this schedule says: nobody receives more than one
            message from us in 72 hours, across every customer we work for; and one expiry never produces
            more than 6 messages to a person or 10 in total. After that the vendor is flagged and we stop
            asking.
          </p>
        </section>

        <section className="c-card">
          <div className="c-card__head">
            <h2 className="c-card__title">Who it comes from</h2>
          </div>
          <label className="c-field">
            <span className="c-field__label">Name shown to the vendor</span>
            <span className="c-field__hint">
              The message says “{settings.sendingName ?? org.name} via {env.APP_NAME}”. Leave it blank to
              use your organisation name.
            </span>
            <input className="c-input" name="sendingName" type="text" defaultValue={settings.sendingName ?? ''} />
          </label>
          <label className="c-field">
            <span className="c-field__label">Reply-to</span>
            <span className="c-field__hint">
              An agent who replies should reach a person who can decide. Blank uses the account owner’s
              address, currently {replyTo}.
            </span>
            <input className="c-input" name="replyToEmail" type="email" defaultValue={settings.replyToEmail ?? ''} />
          </label>
          <label className="c-field">
            <span className="c-field__label">Weekly digest day</span>
            <span className="c-field__hint">1 is Monday. The digest goes to you, never to a vendor.</span>
            <input
              className="c-input c-input--num"
              name="weeklyDigestDay"
              type="number"
              min={1}
              max={7}
              defaultValue={settings.weeklyDigestDay}
            />
          </label>
          <label className="c-field">
            <span className="c-field__label">
              <input type="checkbox" name="paused" defaultChecked={settings.paused} /> Pause every reminder
              for this account
            </span>
            <span className="c-field__hint">
              Nothing is cancelled. The schedule stays and resumes where it left off.
            </span>
          </label>
          <button className="c-btn c-btn--primary" type="submit">
            Save
          </button>
        </section>
      </form>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">What the vendor receives</h2>
          <Link className="c-btn c-btn--quiet c-btn--sm" href="/settings/reminders/log">
            Email log
          </Link>
        </div>
        <div className="c-remind__preview" data-testid="reminder-preview">
          <p>
            <strong>Subject:</strong> {preview.subject}
          </p>
          <pre className="c-mono c-small" style={{ whiteSpace: 'pre-wrap' }}>
            {preview.text}
          </pre>
        </div>
        <p className="c-small c-muted">
          {scheduleSentence(2, totalForExpiry({ rungCount: ladder.length, recipientCount: 2 }))}
        </p>
      </section>

      {cannotChase.length > 0 ? (
        <section className="c-card">
          <div className="c-card__head">
            <h2 className="c-card__title">Cannot chase — no contact</h2>
          </div>
          <p className="c-small c-muted">
            {env.APP_NAME} never guesses, buys or infers an address. These vendors have no mailbox on file
            and no agent address on a certificate, so no schedule runs for them.
          </p>
          <ul data-testid="cannot-chase">
            {cannotChase.map((vendor) => (
              <li key={vendor.id}>{vendor.name}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
