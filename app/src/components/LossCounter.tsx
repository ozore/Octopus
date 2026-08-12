'use client';

/**
 * The loss counter — the ONLY urgency device in the product.
 *
 * Spec: DESIGN_SYSTEM.md §8.9 / P5, USER_JOURNEY.md §8.3, IDEA_DOSSIER §1.3,
 * Hormozi *$100M Offers* (2021) — genuine urgency is displayed, invented urgency
 * is a manipulation.
 *
 * THE CONSTRAINTS ARE THE COMPONENT. Both numbers are the seller's own and both
 * are editable in place; the arithmetic runs in the browser and is never posted
 * anywhere. There is no countdown, no colour change, no animation on change, and
 * no scarcity claim — and the design system ships no component capable of
 * expressing one, which is the enforcement (P5's falsifiable test).
 *
 * A11: the visible figure updates on every keystroke, but the screen-reader
 * announcement waits for the field to settle, so it is not a per-character
 * flood. Ported from `identity/landing/index.html` so the behaviour and the copy
 * are the same object in both places.
 */

import { useId, useState } from 'react';

const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function toNumber(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function LossCounter({
  defaultDays = '3',
  defaultDailyRevenue = '800',
}: {
  defaultDays?: string;
  defaultDailyRevenue?: string;
}) {
  const [days, setDays] = useState(defaultDays);
  const [revenue, setRevenue] = useState(defaultDailyRevenue);
  const [announcement, setAnnouncement] = useState('');
  const daysId = useId();
  const revId = useId();

  const d = toNumber(days);
  const r = toNumber(revenue);
  const total = d === null || r === null ? '—' : MONEY.format(d * r);

  function announce() {
    setAnnouncement(total === '—' ? 'Fill in both numbers to see the total.' : `Roughly ${total} so far.`);
  }

  return (
    <aside className="cw-loss" aria-labelledby={`${daysId}-title`}>
      <h2 className="cw-lp-loss__title" id={`${daysId}-title`}>
        What the wait is costing
      </h2>
      <p className="cw-lp-loss__sentence">
        You&rsquo;ve been dark for{' '}
        <label className="cw-visually-hidden" htmlFor={daysId}>
          Days your account has been deactivated
        </label>
        <input
          className="cw-loss__input cw-lp-loss__input--days"
          id={daysId}
          type="text"
          inputMode="decimal"
          size={3}
          autoComplete="off"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          onBlur={announce}
        />{' '}
        days. At the $
        <label className="cw-visually-hidden" htmlFor={revId}>
          Your daily revenue in dollars
        </label>
        <input
          className="cw-loss__input"
          id={revId}
          type="text"
          inputMode="decimal"
          size={5}
          autoComplete="off"
          value={revenue}
          onChange={(e) => setRevenue(e.target.value)}
          onBlur={announce}
        />{' '}
        a day you sell, that&rsquo;s <span className="cw-loss__figure">{total}</span> so far.
        <span className="cw-visually-hidden" aria-live="polite">
          {announcement}
        </span>
      </p>
      <p className="cw-lp-loss__note">
        $800 a day is one seller&rsquo;s own reported figure, not ours. Put your two numbers in
        &mdash; the arithmetic runs in your browser, and nothing you type here is sent anywhere.
      </p>
    </aside>
  );
}
