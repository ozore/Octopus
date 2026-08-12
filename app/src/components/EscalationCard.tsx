/**
 * The honest-triage screen — what a seller sees when the machine declines.
 *
 * Spec: ARCHITECTURE.md I5 and §3.6, USER_JOURNEY.md §7.1–7.2 and S10,
 * IDEA_DOSSIER §6.1 levers 2 and 4.
 *
 * THIS IS NOT AN ERROR SCREEN, AND IT IS NOT STYLED AS ONE. Refusing to produce
 * output *is* the error-prevention mechanism, not a failure of the product: a
 * confidently wrong document can burn the seller's one credible attempt, which
 * the risk register names as the highest technical damage in the whole build
 * (R3). So the pill is `caution`, never `danger`; rose is reserved for a
 * destructive action or a genuine system failure (DESIGN_SYSTEM P4.2, X3).
 *
 * IT ALSO IS NOT A DEAD END. Lever 2: a refused category routes to a person or a
 * partner-attorney referral, not to "sorry, unsupported". Lever 4: the human
 * tier's mere existence raises the perceived likelihood of the cheaper one, so
 * it has to be visible and reachable right here rather than behind a support
 * ticket (D3 — copilot, not a generator that walks away).
 *
 * AND NOTHING HAS BEEN CHARGED. Triage happens before the paywall by design:
 * per Akerlof (1970) a strong refund guarantee needs a complementary screening
 * control, and telling an unwinnable case so for free is that control.
 */

import { StatusPill } from './StatusPill';

export function EscalationCard({
  caseId,
  detail,
  disposition,
  requestHumanReview,
}: {
  caseId: string;
  detail: string;
  disposition: 'human_tier' | 'refer_out';
  requestHumanReview?: (formData: FormData) => void | Promise<void>;
}) {
  const referral = disposition === 'refer_out';

  return (
    <section className="cw-card cw-mat-0 cw-card--accent" aria-labelledby="escalation-title">
      <div className="cw-card__header">
        <h2 className="cw-card__title" id="escalation-title">
          {referral
            ? 'This is a case a document cannot fix'
            : 'This one needs a person, not a document'}
        </h2>
        <StatusPill tone="caution">Needs a person</StatusPill>
      </div>

      <div className="cw-card__body">
        <p className="cw-ink-2">
          {referral
            ? 'Cases like this turn on facts and rights a written appeal cannot settle. Drafting one anyway would spend an appeal attempt you do not get back, so we are not going to do it.'
            : 'We are not confident enough in the reason code to draft. Guessing here would cost you an appeal attempt you do not get back, so the case goes to someone who reads these for a living.'}
        </p>

        <div className="cw-card--inset">
          <p className="cw-text-sm cw-ink-2">
            <span className="cw-critique__label">What we found: </span>
            {detail}
          </p>
        </div>

        <p className="cw-ink-2">
          You have not been charged, and nothing has been submitted anywhere.
        </p>

        {referral ? (
          <>
            <p className="cw-ink-2">
              We will point you at someone who has handled this exact category. That referral costs
              you nothing here, and we tell you plainly that we earn a referral fee if you use it.
            </p>
            <div className="cw-actions">
              <a className="cw-btn cw-btn--secondary" href="mailto:hello@clausewright.com">
                <span className="cw-btn__label">Ask for the referral</span>
              </a>
            </div>
          </>
        ) : (
          <>
            <ul className="cw-list">
              <li className="cw-list__item">
                <span>
                  An experienced appeal writer picks it up the same business day — not a countdown,
                  a realistic expectation.
                </span>
              </li>
              <li className="cw-list__item">
                <span>
                  They edit the same document in the same tool, under the same citation rule: a
                  reviewer cannot paste in an uncited policy reference either.
                </span>
              </li>
              <li className="cw-list__item">
                <span>$399, and if your first submission is rejected, your human review is free.</span>
              </li>
            </ul>
            {requestHumanReview ? (
              <form action={requestHumanReview} className="cw-actions">
                <input type="hidden" name="caseId" value={caseId} />
                <button className="cw-btn cw-btn--secondary" type="submit">
                  <span className="cw-btn__label">Have a person take this case</span>
                </button>
              </form>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
