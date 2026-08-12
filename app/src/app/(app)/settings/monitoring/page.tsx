/**
 * `/settings/monitoring` — Shield.
 *
 * Spec: IDEA_DOSSIER **D6** (30 days of monitoring included free with every
 * appeal, card on file), ARCHITECTURE.md §3.8 / ADR-006, USER_JOURNEY.md §3
 * (S14–S17), DESIGN_REVIEW.md **C-1**.
 *
 * READ C-1 BEFORE EDITING ANY SENTENCE ON THIS PAGE. The landing page once said
 * "daily account-health monitoring" and "Shield watches your account health
 * daily". Both describe an automated watcher, and v1 Shield is not one: it is an
 * inbound-email adapter that sees only what the seller forwards, with detection
 * latency equal to email latency, and for the first twenty buyers a human
 * checking by hand. That was the single most expensive defect the design review
 * found, and it was found on the highest-traffic surface. This page is the
 * *product* surface for the same claim, so it states the mechanism and its
 * limits plainly — and turns the limit into the positioning: we never log into
 * your account, so Shield sees what you forward and nothing else (I4).
 *
 * D6 AND THE PEAK-END RULE. The 30 days are included with Rescue, the card is
 * already on file, and NOTHING is decided here at the moment of panic. The
 * keep-or-lapse decision belongs at day 25, at relief, and both options are one
 * click at equal visual weight — Nielsen #3, and the anti-coercion posture the
 * whole guarantee stack is built on. There is no retention interstitial, no
 * "are you sure you want to lose protection", and no phone call, because a
 * punitive ending is disproportionately what gets remembered and repeated in
 * the forum that is the entire distribution channel (D8).
 *
 * EVERY STATE SAYS WHAT HAPPENS IF THE SELLER DOES NOTHING (USER_JOURNEY §8.6).
 */

import { confirmForwarding, setShieldState, shieldAddressFor } from '@/app/_lib/actions';
import { getCase, listCases, type CaseRecord } from '@/app/_lib/case-store';
import { StatusPill } from '@/components/StatusPill';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Monitoring — Clausewright' };

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 864e5));
}

async function pickCase(explicit: string | undefined): Promise<CaseRecord | undefined> {
  if (explicit) return getCase(explicit);
  return (await listCases()).find((c) => c.shield);
}

export default async function MonitoringPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const record = await pickCase(typeof query.case === 'string' ? query.case : undefined);
  const shield = record?.shield;
  const address = shield ? await shieldAddressFor(shield.ingestToken) : null;
  const cancelled = Boolean(shield?.cancelledAt);
  const remaining = shield ? daysLeft(shield.includedUntil) : 0;

  return (
    <div className="cw-screen">
      <div className="cw-screen__head">
        <span className="cw-screen__eyebrow">Shield</span>
        <h1 className="cw-screen__title">
          {shield
            ? cancelled
              ? 'Cancelled'
              : '30 days of monitoring are included with your Rescue'
            : 'Monitoring starts with your first Rescue'}
        </h1>
        {shield ? (
          <div className="cw-screen__meta">
            {cancelled ? (
              <StatusPill>Lapsed</StatusPill>
            ) : (
              <StatusPill tone="accent">{`Active — ${remaining} days included left`}</StatusPill>
            )}
            <span className="cw-chip">Card on file · nothing charged</span>
          </div>
        ) : null}
        <p className="cw-screen__lede">
          {cancelled
            ? 'Cancelled. If your account ever needs us again, we’ll be here — no charge until you say so.'
            : 'Included free for 30 days with every Rescue, with your card on file. Nothing is charged before day 30, and nothing renews quietly.'}
        </p>
      </div>

      {/* ---- What Shield actually is (C-1). --------------------------------- */}
      <section className="cw-card cw-mat-0" aria-labelledby="how-title">
        <div className="cw-card__header">
          <h2 className="cw-card__title" id="how-title">
            How it works, exactly
          </h2>
        </div>
        <div className="cw-card__body">
          <p className="cw-ink-2">
            You forward the account-health emails Amazon and Walmart send you — one rule, set once.
            Each one that arrives is read the same way your deactivation notice was, by the same
            classifier. When something moves, you get an alert naming the specific policy at risk,
            with pre-drafted Plans of Action for your top three risk vectors.
          </p>
          <div className="cw-card--inset">
            <h3 className="cw-critique__label">What Shield can and cannot see</h3>
            <ul className="cw-list">
              <li className="cw-list__item">
                <span>
                  We never log into your seller account. Shield sees what you forward and nothing
                  else — no API, no credentials, no session, ever.
                </span>
              </li>
              <li className="cw-list__item">
                <span>
                  It is as fast as your email is. If a notification is delayed or your rule misses
                  it, Shield does not see it, and we would rather say so than imply a watcher we do
                  not run.
                </span>
              </li>
              <li className="cw-list__item">
                <span>
                  If you stop forwarding, Shield goes quiet. It will tell you when it has had
                  nothing to read for a while rather than letting silence look like an all-clear.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {shield ? (
        <>
          {/* ---- Setup ---------------------------------------------------- */}
          <section className="cw-card cw-mat-0" aria-labelledby="setup-title">
            <div className="cw-card__header">
              <h2 className="cw-card__title" id="setup-title">
                Set the forwarding rule
              </h2>
              {shield.forwardingConfirmedAt ? (
                <StatusPill tone="accent">Confirmed</StatusPill>
              ) : (
                <StatusPill tone="caution">Not set up yet</StatusPill>
              )}
            </div>
            <div className="cw-card__body">
              <p className="cw-ink-2">Your ingest address, unique to this account:</p>
              <p className="cw-shield__address">{address}</p>

              <ol className="cw-shield__steps">
                <li className="cw-shield__step">
                  <span>
                    In the mailbox that receives Seller Central mail, create a filter for messages
                    from <code>seller-performance@amazon.com</code> and{' '}
                    <code>no-reply@walmart.com</code>.
                  </span>
                </li>
                <li className="cw-shield__step">
                  <span>Forward matching messages to the address above. Keep a copy.</span>
                </li>
                <li className="cw-shield__step">
                  <span>
                    Forward one existing account-health email now, so you can see the rule work
                    rather than trust it.
                  </span>
                </li>
              </ol>

              {!shield.forwardingConfirmedAt ? (
                <form action={confirmForwarding} className="cw-actions">
                  <input type="hidden" name="caseId" value={record!.id} />
                  <button className="cw-btn cw-btn--secondary" type="submit">
                    <span className="cw-btn__label">I&rsquo;ve set the rule</span>
                  </button>
                  <span className="cw-btn__reason">
                    If you never set it up, nothing breaks and nothing is charged — Shield simply
                    has nothing to read.
                  </span>
                </form>
              ) : (
                <p className="cw-note">
                  Confirmed {new Date(shield.forwardingConfirmedAt).toLocaleDateString()}. You can
                  stop forwarding at any time; there is nothing to switch off on our side.
                </p>
              )}
            </div>
          </section>

          {/* ---- S15: the day-25 decision, both options one click --------- */}
          <section className="cw-card cw-mat-0" aria-labelledby="decision-title">
            <div className="cw-card__header">
              <h2 className="cw-card__title" id="decision-title">
                {cancelled ? 'Shield is off' : 'When the 30 days end'}
              </h2>
            </div>
            <div className="cw-card__body">
              <p className="cw-ink-2">
                {cancelled
                  ? 'Nothing is charged, now or later. Turning it back on is one click and takes effect immediately.'
                  : 'On day 25 you get an email that opens with what these 30 days actually flagged — the facts first, not a pitch. Then you decide. Keeping it is $49 a month and includes one Rescue appeal each year; letting it lapse costs nothing and charges nothing. Do nothing and we will ask you once, by email, before anything is charged.'}
              </p>

              <div className="cw-decision">
                <form action={setShieldState}>
                  <input type="hidden" name="caseId" value={record!.id} />
                  <input type="hidden" name="keep" value="yes" />
                  <button className="cw-btn cw-btn--secondary cw-btn--block" type="submit">
                    <span className="cw-btn__label">Keep Shield — $49/mo</span>
                  </button>
                  <span className="cw-btn__reason">
                    Includes one Rescue appeal a year. Cancel any time, in one click, from this
                    page.
                  </span>
                </form>

                <form action={setShieldState}>
                  <input type="hidden" name="caseId" value={record!.id} />
                  <input type="hidden" name="keep" value="no" />
                  <button className="cw-btn cw-btn--secondary cw-btn--block" type="submit">
                    <span className="cw-btn__label">Let it lapse</span>
                  </button>
                  <span className="cw-btn__reason">
                    One click, no phone call, no questions. Your card comes off file.
                  </span>
                </form>
              </div>

              <p className="cw-note">
                Both options are the same size on purpose. Handling accounts for other sellers?
                Shield Pro is $149/mo for up to ten of them.
              </p>
            </div>
          </section>
        </>
      ) : (
        <section className="cw-card cw-mat-0" aria-labelledby="none-title">
          <div className="cw-card__header">
            <h2 className="cw-card__title" id="none-title">
              No Shield account yet
            </h2>
          </div>
          <div className="cw-card__body">
            <p className="cw-ink-2">
              Thirty days come with every Rescue, at no extra charge. There is nothing to buy here
              and nothing to decide now.
            </p>
            <div className="cw-actions">
              <a className="cw-btn cw-btn--secondary" href="/appeal">
                <span className="cw-btn__label">Start with your notice</span>
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
