'use client';

/**
 * B1 — one textarea, one button, no signup.
 *
 * Spec: ARCHITECTURE.md §3.1, USER_JOURNEY.md S1, DESIGN_SYSTEM.md §8.7.
 *
 * THE SAME COMPONENT SERVES THE LANDING PAGE AND `/appeal`, deliberately: a
 * seller who arrives from a forum link and one who arrives from a bookmark must
 * meet the identical box, with the identical label (Nielsen #4, consistency).
 * The copy is `identity/landing/index.html` verbatim.
 *
 * WHAT IS NOT HERE IS THE DESIGN: no email field, no account, no card, no
 * marketplace picker, no "how did you hear about us". Every field between a
 * panicking buyer and their answer is a conversion tax (N4, Nielsen #8), and the
 * marketplace is read out of the notice by stage 1 rather than asked for.
 *
 * Error copy follows Nielsen #9 — what happened, why, and the way forward, in
 * the seller's language. Never "Validation failed."
 */

import { useRef, useState, type FormEvent } from 'react';

/** Below this the notice is too short to read a reason code out of. */
const MIN_CHARS = 40;

export function NoticeForm({
  action,
  autoFocus = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  autoFocus?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const text = (field.current?.value ?? '').replace(/\s+/g, ' ').trim();
    if (text.length >= MIN_CHARS) {
      setError(null);
      return;
    }
    event.preventDefault();
    setError(
      text.length === 0
        ? 'Paste the notice first — the whole thing, including the header. Your reason code is in its wording.'
        : 'That is too short to read a reason code from. Paste the full notice, including the header.',
    );
    field.current?.focus();
  }

  return (
    <div className="cw-card cw-lp-paste-card" id="paste">
      <form className="cw-field" id="cw-notice-form" action={action} onSubmit={onSubmit} noValidate>
        <label className="cw-field__label" htmlFor="cw-notice">
          Paste the email or screenshot text Amazon or Walmart sent you
        </label>
        <textarea
          className="cw-paste"
          id="cw-notice"
          name="notice"
          rows={7}
          ref={field}
          autoFocus={autoFocus}
          aria-describedby="cw-notice-help cw-notice-error"
          aria-invalid={error ? true : undefined}
          onChange={() => error && setError(null)}
          placeholder="Your account has been deactivated in accordance with…"
        />
        <p className="cw-field__help" id="cw-notice-help">
          The whole notice, including the header. Nothing is submitted to Amazon or Walmart on your
          behalf.
        </p>
        <p className="cw-field__error" id="cw-notice-error" hidden={!error}>
          {error}
        </p>

        <div className="cw-lp-paste-card__actions">
          <button type="submit" className="cw-btn cw-btn--primary cw-btn--lg">
            <span className="cw-btn__label">Show me what I&rsquo;m charged under</span>
          </button>
          <p className="cw-lp-assure">
            Free. No card, no login, and no access to your Seller Central account — not now, not
            ever.
          </p>
        </div>
      </form>
    </div>
  );
}
