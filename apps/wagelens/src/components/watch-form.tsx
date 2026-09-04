/**
 * WL-14 · The watch form, inline on every public result page.
 *
 * Four things about it are specification, not styling:
 *
 *  1. **It renders BELOW the last classification row.** WL-00 V2 and V11 and
 *     WL-14 V12: the full table is there with no email, and this is an offer
 *     rather than a gate. Moving it above the table would falsify the trust
 *     argument the whole funnel rests on.
 *  2. **The consent box is UNTICKED, required, and names the determination in
 *     its own label** (V1). No pre-ticked box, no "by continuing you agree", no
 *     bundling with anything else. `defaultChecked` is absent, and the test
 *     asserts the rendered `checked` attribute is absent too.
 *  3. **The privacy note says what happens to the address** in one line, with a
 *     link — a page nobody has to read to know the answer.
 *  4. **Every state answers in the same place**, beside the form, and the
 *     declining states that could reveal whether an address is on the list
 *     ("suppressed", "rate limited") are rendered as the ordinary pending copy.
 *
 * It is a plain form posting to a server action: no client JavaScript, which is
 * also how WL-00 V6's "no third-party script on a public page" stays true.
 */

import Link from 'next/link';

import { requestWatchAction } from '@/lib/watch-actions';
import { WATCH_CONSENT_TEXT } from '@/lib/email/watch-templates';
import { WATCHES_PER_EMAIL } from '@/lib/watch/service';

export type WatchFormState =
  | 'idle'
  | 'pending'
  | 'already_watching'
  | 'limit_reached'
  | 'consent_required'
  | 'invalid_email';

export function parseWatchState(value: string | string[] | undefined): WatchFormState {
  const states: WatchFormState[] = [
    'pending',
    'already_watching',
    'limit_reached',
    'consent_required',
    'invalid_email',
  ];
  return typeof value === 'string' && (states as string[]).includes(value)
    ? (value as WatchFormState)
    : 'idle';
}

function Message({ state, wdNumber }: { state: WatchFormState; wdNumber: string }) {
  if (state === 'idle') return null;

  if (state === 'pending') {
    return (
      <div className="wl-alert wl-alert--success" role="status" data-testid="watch-pending">
        <div>
          <p className="wl-alert__title">Check your inbox.</p>
          <p className="wl-alert__body">
            We have sent a confirmation link. It expires in 7 days, and nothing is sent to an
            address that has not confirmed.
          </p>
        </div>
      </div>
    );
  }
  if (state === 'already_watching') {
    return (
      <div className="wl-alert wl-alert--info" role="status" data-testid="watch-already">
        <div>
          <p className="wl-alert__title">That address is already watching {wdNumber}.</p>
          <p className="wl-alert__body">Every alert we send carries a one-click unsubscribe.</p>
        </div>
      </div>
    );
  }
  if (state === 'limit_reached') {
    return (
      <div className="wl-alert wl-alert--warn" role="alert" data-testid="watch-limit">
        <div>
          <p className="wl-alert__title">
            An address can watch {WATCHES_PER_EMAIL} determinations at a time.
          </p>
          <p className="wl-alert__body">
            Use the link at the bottom of any alert to manage the ones you have, then add this one.
          </p>
        </div>
      </div>
    );
  }
  if (state === 'consent_required') {
    return (
      <div className="wl-alert wl-alert--error" role="alert" data-testid="watch-consent-required">
        <div>
          <p className="wl-alert__title">Nothing was saved.</p>
          <p className="wl-alert__body">
            We only take an address when the box is ticked, so we can show what was agreed to and
            when.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="wl-alert wl-alert--error" role="alert" data-testid="watch-invalid-email">
      <div>
        <p className="wl-alert__title">That does not look like an email address.</p>
      </div>
    </div>
  );
}

export function WatchForm({
  wdNumber,
  returnPath,
  state = 'idle',
}: {
  wdNumber: string;
  /** Where the answer is rendered — this page, with `?watch=…`. */
  returnPath: string;
  state?: WatchFormState;
}) {
  return (
    <section className="wl-panel" id="watch" data-testid="watch-form">
      <div className="wl-panel__body wl-stack">
        <h2>Email me when this determination changes</h2>
        <p className="wl-sm wl-muted">
          One plain email when the U.S. Department of Labor publishes a modification to{' '}
          <span className="wl-mono">{wdNumber}</span> — the classifications that moved and both
          modification numbers. No account, no card.
        </p>

        <Message state={state} wdNumber={wdNumber} />

        <form className="wl-stack" action={requestWatchAction}>
          <input type="hidden" name="wdNumber" value={wdNumber} />
          <input type="hidden" name="returnPath" value={returnPath} />
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="watch-email">
              Your email
            </label>
            <input
              className="wl-input"
              id="watch-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
            />
          </div>
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="watch-consent">
              {/* UNTICKED, required, and it names the determination (V1). */}
              <input id="watch-consent" name="consent" type="checkbox" required /> {WATCH_CONSENT_TEXT(wdNumber)}
            </label>
          </div>
          <div>
            <button className="wl-btn wl-btn--secondary" type="submit" data-testid="watch-submit">
              Watch this determination
            </button>
          </div>
        </form>

        <p className="wl-xs wl-muted">
          We use this address only for this alert. We never sell or share it, and you can remove it
          without an account. <Link href="/legal/privacy">Privacy</Link>.
        </p>
      </div>
    </section>
  );
}
