/**
 * S1 — the paste screen.
 *
 * Spec: USER_JOURNEY.md §1.3 S1, ARCHITECTURE.md §3.1, B1.
 *
 * The emotional job of this screen is *relief that this is simple, not another
 * form*. So the screen is one label, one textarea, one button, and a sentence
 * saying what does not happen. There is no account, no email, no card, no
 * marketplace picker and no "tell us about your business" — every field between
 * a panicking buyer and their answer is a conversion tax (N4, Nielsen #8), and
 * the marketplace is read out of the notice by stage 1 rather than asked for.
 *
 * The loss counter sits beside it because the arithmetic IS the offer
 * (ARCHITECTURE.md §3.1): the seller performs it unprompted, and our only job is
 * to not get in the way. Both numbers are theirs and stay in the browser.
 */

import { LossCounter } from '@/components/LossCounter';
import { NoticeForm } from '@/components/NoticeForm';

import { startAppeal } from '../../_lib/actions';

export const metadata = {
  title: 'Paste your notice — Clausewright',
};

export default async function AppealPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tooShort = params.tooShort === '1';

  return (
    <div className="cw-screen">
      <div className="cw-screen__head">
        <span className="cw-screen__eyebrow">Free · no card, no login</span>
        <h1 className="cw-screen__title">Let&rsquo;s find the clause you were charged under.</h1>
        <p className="cw-screen__lede">
          Paste the notice exactly as it arrived. You&rsquo;ll see the reason code it maps to, the
          policy clause it was issued under, and an honest readiness check — before you pay
          anything.
        </p>
      </div>

      {tooShort ? (
        <p className="cw-field__error" role="alert">
          That is too short to read a reason code from. Paste the full notice, including the header.
        </p>
      ) : null}

      <div className="cw-split">
        <NoticeForm action={startAppeal} autoFocus />
        <LossCounter />
      </div>

      <p className="cw-note">
        If your notice turns out to be one we should not be drafting for, you will be told so in
        plain words, before you are charged — and pointed at someone who can actually help.
      </p>
    </div>
  );
}
