/**
 * THE ONLY CONTROL THAT STARTS A TRIAL — and the reason it is a component.
 *
 * `specs/10` A14 requires that on EVERY surface that begins this flow the CTA
 * reads "Start 14-day trial" and the sentence *"Card required. No charge until
 * {date}. Cancel in one click."* is in the DOM **adjacent to the button, in
 * body text, not behind a link**, with a real computed date. Four surfaces need
 * that (the pricing cards, `/login`, the paywall, the onboarding finding
 * screen), and four copies of a legal requirement is three chances to drift.
 *
 * So the button and its disclosure are ONE component and the disclosure is not
 * optional: there is no prop that removes it. A card-required negative-option
 * subscription presented as "Start free" is the pattern the FTC's
 * negative-option rule and ROSCA are aimed at (REVIEW.md B-06); the label is
 * fixed here so no page can invent a friendlier one.
 */

import Link from 'next/link';

import { startTrialCheckoutAction } from '@/lib/billing/checkout';
import { TRIAL_CTA, type Interval, type Tier } from '@/lib/plans';
import { firstChargeAt, trialDisclosure } from '@/lib/billing/trial';

export type TrialCtaProps = {
  tier: Tier;
  interval?: Interval;
  /** Where Checkout returns to. Ignored in `signup` mode. */
  returnTo?: string;
  /**
   * `checkout` posts to the server action (a signed-in owner);
   * `signup` sends a stranger to the magic link first, carrying the tier.
   */
  mode?: 'checkout' | 'signup';
  disabled?: boolean;
  /** Renders the secondary style, for the two tiers a customer did not pick. */
  quiet?: boolean;
  testId?: string;
};

export function TrialCta({
  tier,
  interval = 'month',
  returnTo = '/settings/billing',
  mode = 'checkout',
  disabled,
  quiet,
  testId,
}: TrialCtaProps) {
  const charge = firstChargeAt();
  const disclosure = trialDisclosure(charge);
  const className = `c-btn ${quiet ? 'c-btn--secondary' : 'c-btn--primary'}`;
  const id = testId ?? `trial-cta-${tier}${interval === 'year' ? '-annual' : ''}`;

  return (
    <div className="c-trial-cta">
      {mode === 'signup' ? (
        <Link
          className={className}
          data-testid={id}
          href={`/login?next=${encodeURIComponent(`/settings/billing?plan=${tier}&interval=${interval}`)}`}
        >
          {TRIAL_CTA}
        </Link>
      ) : (
        <form action={startTrialCheckoutAction}>
          <input type="hidden" name="tier" value={tier} />
          <input type="hidden" name="interval" value={interval} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button className={className} type="submit" data-testid={id} disabled={disabled}>
            {TRIAL_CTA}
          </button>
        </form>
      )}
      {/* ADJACENT, IN BODY TEXT, NEVER BEHIND A LINK, WITH A REAL DATE. */}
      <p className="c-small c-trial-cta__disclosure" data-testid={`trial-disclosure-${tier}`}>
        {disclosure}
      </p>
    </div>
  );
}
