import Link from 'next/link';

import { StatusPill } from '@/components/primitives';
import { joinGcWaitlistAction } from '@/lib/billing-actions';
import { GC_WAITLIST_CONSENT } from '@/lib/billing/waitlist';

/**
 * The GC Roll-up tier: **published, and not for sale** (WL-09 V19, finding B2).
 *
 * Every bullet is in the FUTURE TENSE, because none of it exists. The price is
 * shown because the ladder is honest about where the product is going and
 * because a published price is what makes the waitlist a demand signal rather
 * than a guess — but there is no purchase control anywhere in this card, and
 * there is no code path from it to Checkout: the plan map has no `gc` key, so
 * there is nothing to pass.
 *
 * `waitlist` is off on the signed-in billing screen. A customer who is already
 * paying does not need an email capture inside their own account — they need
 * the fact, and a link. It is on where a stranger meets the ladder.
 */
export function GcComingCard({
  surface,
  waitlist = false,
  state,
}: {
  surface: 'pricing' | 'billing' | 'landing';
  waitlist?: boolean;
  state?: 'joined' | 'refused';
}) {
  return (
    <section className="wl-panel" id="gc" data-testid="gc-waitlist">
      <div className="wl-panel__body wl-stack-2">
        <h3>GC Roll-up</h3>
        <p className="wl-sm wl-muted">
          Small general contractors carrying prime liability for their subs
        </p>
        <p className="wl-num" style={{ fontSize: 'var(--wl-text-xl)', fontWeight: 700 }}>
          $299<span className="wl-xs wl-muted"> /month</span>
        </p>
        <StatusPill tone="draft">Coming — join the list</StatusPill>
        <ul className="wl-xs wl-prose">
          <li>It will add unlimited subcontractor seats</li>
          <li>It will collect and completeness-check every sub&rsquo;s weekly payroll</li>
          <li>It will show a per-sub status board and assemble the prime&rsquo;s package</li>
        </ul>
        <p className="wl-xs wl-muted">
          None of that exists yet, so none of it is for sale yet. If you need it today, the honest
          answer is Shop now and this list for the roll-up.
        </p>

        {state === 'joined' ? (
          <div className="wl-alert wl-alert--success" role="status" data-testid="gc-joined">
            <div>
              <p className="wl-alert__title">You are on the list.</p>
              <p className="wl-alert__body">
                One email when it ships, and nothing else. No card, no account, no follow-up
                sequence.
              </p>
            </div>
          </div>
        ) : null}
        {state === 'refused' ? (
          <div className="wl-alert wl-alert--error" role="alert" data-testid="gc-refused">
            <div>
              <p className="wl-alert__title">Nothing was saved.</p>
              <p className="wl-alert__body">
                We need a working address and the box ticked, so we can show what was agreed to.
              </p>
            </div>
          </div>
        ) : null}

        {waitlist ? (
          <form className="wl-stack" action={joinGcWaitlistAction}>
            <input type="hidden" name="surface" value={surface} />
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="gc-email">
                Tell me when it ships
              </label>
              <input
                className="wl-input"
                id="gc-email"
                name="email"
                type="email"
                required
                placeholder="you@company.com"
              />
            </div>
            <div className="wl-field">
              <label className="wl-field__label" htmlFor="gc-consent">
                {/* Unticked by default, like every other consent in this product. */}
                <input id="gc-consent" name="consent" type="checkbox" required /> {GC_WAITLIST_CONSENT}
              </label>
            </div>
            <div>
              <button className="wl-btn wl-btn--secondary" type="submit" data-testid="gc-join">
                Join the list
              </button>
            </div>
          </form>
        ) : (
          <p className="wl-xs">
            <Link href="/pricing#gc">Join the list on the pricing page</Link>
          </p>
        )}
      </div>
    </section>
  );
}
