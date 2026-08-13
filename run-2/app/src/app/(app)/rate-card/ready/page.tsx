/**
 * The Checkout return page — §3.5's "webhook delayed; he lands on the success page
 * first".
 *
 * AUTHORITY: `USER_JOURNEY.md` §3.3 (fulfilment is driven by the webhook, never by
 * this page, because the customer may never load it), §3.5 ("Never a spinner with no
 * ending; the success page polls the session and states the fallback").
 *
 * There is no spinner and no skeleton on this page — `DESIGN_SYSTEM.md` R5 has an
 * allow-list and neither is on it. What there is instead is a sentence that says
 * what is happening, what will happen if this page is closed, and where the document
 * arrives either way.
 */

import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Payment received — Ratepin' };

export default function RateCardReadyPage(): React.ReactElement {
  return (
    <div className="rp-stack rp-stack--section rp-measure">
      <h1>Payment received</h1>
      <p className="rp-t-lead">
        Your rate card is being generated. The link is in your inbox either way — fulfilment is
        driven by Stripe’s webhook rather than by this page, so closing this tab loses nothing.
      </p>
      <p>
        The link is good for twelve months. If you later sign up with the same email address, the
        card attaches itself to that account automatically; you do not have to buy it again and
        nobody reconciles it by hand.
      </p>
      <p>
        <Link href="/wh347">Generate a WH-347 in the meantime</Link>
      </p>
    </div>
  );
}
