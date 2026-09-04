import Link from 'next/link';

import { certlyEntitlement } from '@/lib/billing/entitlement';
import { getDb } from '@/lib/db';
import { skipOnboardingAction } from '@/lib/onboarding/actions';
import { ensureOnboarding } from '@/lib/onboarding/repo';
import { STEP_SPECS } from '@/lib/onboarding/steps';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE CHECKLIST — `specs/11` §4.
 *
 * Six steps, a progress line, each one resumable and independently completable,
 * and a skip that is a real exit rather than a dark pattern. Activation is the
 * number that decides this business (`THRESHOLDS.md` §1), and leaving the core
 * loop to be discovered is how a good product dies at 12% activation — but a
 * checklist that traps somebody is worse than no checklist, so nothing here is
 * modal and back always works.
 */
export default async function OnboardingPage() {
  const { org } = await requireOrg();
  const db = await getDb();
  const view = await ensureOnboarding(db, org.id);
  const entitlement = await certlyEntitlement(db, org.id);

  return (
    <main className="c-prose">
      <div className="c-page__head">
        <h1 className="c-page__title">Your first audit</h1>
        <p className="c-page__lede">
          Six steps. Most of it is one click. The last one is the part you came for.
        </p>
      </div>

      <p className="c-small c-muted" data-testid="onboarding-progress">
        {view.completed} of {view.total} done
        {view.activatedAt ? ' · first certificate compared' : ''}
      </p>

      <ol className="c-list-reset c-stack" data-testid="onboarding-steps">
        {STEP_SPECS.map((spec) => {
          const done = Boolean(view.steps[spec.key]);
          return (
            <li key={spec.key} className="c-card" data-step={spec.key} data-done={done}>
              <div className="c-row c-row--between">
                <div>
                  <h2 className="c-card__title">
                    {spec.n}. {spec.title}
                  </h2>
                  <p className="c-small c-muted" style={{ margin: 0 }}>
                    {spec.lede}
                  </p>
                </div>
                <Link
                  className={`c-btn ${done ? 'c-btn--secondary' : 'c-btn--primary'} c-btn--sm`}
                  href={spec.key === 'finding' ? '/onboarding/finding' : `/onboarding/${spec.key}`}
                  data-testid={`onboarding-step-${spec.key}`}
                >
                  {done ? 'Review' : 'Start'}
                </Link>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="c-small c-muted">
        Onboarding is free up to and including your first compared certificate — {entitlement.vendorLimit}{' '}
        tracked vendors and {entitlement.documentLimit < 0 ? 'unlimited' : entitlement.documentLimit}{' '}
        documents on this plan. Nothing is sent to your vendors until you say so.
      </p>

      <form action={skipOnboardingAction}>
        <button className="c-btn c-btn--quiet" type="submit" data-testid="skip-onboarding">
          Skip this and go to the dashboard
        </button>
      </form>
    </main>
  );
}
