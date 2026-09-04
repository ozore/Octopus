import Link from 'next/link';

import {
  BoardBand,
  BoardDeadlineCard,
  CoveragePanel,
  EmptyBoard,
  ExpiringList,
  StatusLine,
} from '@/components/board';
import { getEnv } from '@/env';
import { createReadinessLinkAction, markRenewedAction, revokeSharedLinkAction } from '@/lib/actions';
import { getDb } from '@/lib/db';
import { buildBoard } from '@/lib/repos/board';
import { listSharedLinks } from '@/lib/repos/shared-links';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * M7 — the board. `specs/07`, `UX.md` S09.
 *
 * Four bands, top to bottom, in decreasing urgency:
 *   1. the status line — one sentence, unmissable, naming the state and the
 *      holder when something has lapsed;
 *   2. the tile grid (51 tiles) beside the runway (90/60/30/7 gates);
 *   3. this week / this month, as licence cards with **mark renewed**;
 *   4. the coverage honesty panel — permanent, not dismissable.
 *
 * Band 4 is not a disclaimer somebody made us add. It is what keeps the product
 * trustworthy when the customer eventually finds a gap: they knew, because we
 * told them on the front page.
 *
 * **Every filter is in the URL** (`/dashboard?state=TX`), so a filtered board is
 * a link a coordinator can send to their GM.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const env = getEnv();
  const today = new Date().toISOString().slice(0, 10);

  const one = (key: string): string | null => {
    const value = params[key];
    return typeof value === 'string' && value !== '' ? value : null;
  };

  const [model, links] = await Promise.all([
    buildBoard(db, org.id, today, { state: one('state') }),
    listSharedLinks(db, org.id, 'readiness'),
  ]);
  const liveLink = links.find((link) => link.revokedAt === null) ?? null;
  const filterHref = model.stateFilter ? `?state=${model.stateFilter}` : '';
  const returnTo = `/dashboard${filterHref}`;

  return (
    <>
      {one('warn') ? (
        <p className="notice warn" data-testid="renew-warning">
          {one('warn')}
        </p>
      ) : null}
      {one('error') ? (
        <p className="notice error" data-testid="board-error">
          {one('error')}
        </p>
      ) : null}
      {params['renewed'] ? (
        <p className="notice" data-testid="renewed-notice">
          Renewed. The old deadline is superseded, the new one is derived, and the alerts that were queued
          against the old date are cancelled.
        </p>
      ) : null}

      {/* Band 1 */}
      <StatusLine model={model} />

      {model.empty ? (
        <EmptyBoard />
      ) : (
        <>
          {/* Band 2 */}
          <BoardBand model={model} />

          {model.stateFilter ? (
            <p className="sr-row sr-mt-6" data-testid="state-filter">
              Showing <strong>{model.stateFilter}</strong> only.{' '}
              <Link className="sr-btn sr-btn--ghost" href="/dashboard">
                Show every state
              </Link>
            </p>
          ) : null}

          {/* Band 3 */}
          <section className="sr-mt-6">
            <div className="sr-row sr-row--between">
              <h2 className="sr-eyebrow">What is due</h2>
              <span className="sr-row">
                <Link className="sr-btn sr-btn--ghost" href={`/dashboard/calendar${filterHref}`}>
                  Calendar
                </Link>
                <Link className="sr-btn sr-btn--ghost" href={`/dashboard/print${filterHref}`}>
                  Print / PDF
                </Link>
                <a className="sr-btn sr-btn--ghost" href={`/dashboard/export${filterHref}`}>
                  CSV
                </a>
              </span>
            </div>

            <div className="sr-two-up">
              <div>
                <h3 className="sr-eyebrow">
                  Lapsed · {model.lapsed.length}
                </h3>
                {model.lapsed.length === 0 ? (
                  <p className="muted small">Nothing has lapsed.</p>
                ) : (
                  <div className="sr-stack" data-testid="lapsed-cards">
                    {model.lapsed.map((card) => (
                      <BoardDeadlineCard
                        card={card}
                        key={card.deadline.id}
                        markRenewedAction={markRenewedAction}
                        returnTo={returnTo}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="sr-eyebrow">This week · {model.thisWeek.length}</h3>
                {model.thisWeek.length === 0 ? (
                  <p className="muted small">Nothing in the next seven days.</p>
                ) : (
                  <div className="sr-stack" data-testid="this-week">
                    {model.thisWeek.map((card) => (
                      <BoardDeadlineCard
                        card={card}
                        key={card.deadline.id}
                        markRenewedAction={markRenewedAction}
                        returnTo={returnTo}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="sr-eyebrow">This month · {model.thisMonth.length}</h3>
                {model.thisMonth.length === 0 ? (
                  <p className="muted small">Nothing else in the next thirty days.</p>
                ) : (
                  <div className="sr-stack" data-testid="this-month">
                    {model.thisMonth.map((card) => (
                      <BoardDeadlineCard
                        card={card}
                        key={card.deadline.id}
                        markRenewedAction={markRenewedAction}
                        returnTo={returnTo}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* The expiring list: the same rows as the grid, as text, always. */}
          <section className="sr-mt-6">
            <h2 className="sr-eyebrow">Everything we hold a date for</h2>
            <ExpiringList cards={model.cards} />
          </section>
        </>
      )}

      {/* M17 — the shared readiness link. The cheapest distribution mechanism
          in the product, because the person it gets forwarded to is the buyer. */}
      <section className="sr-card sr-mt-6" data-testid="share-panel">
        <h2 className="sr-card__title">Send this board to someone</h2>
        <p className="sr-meta">
          A read-only page, no login, revocable in one click, rendered on paper so it reads the same
          forwarded as it does here.
        </p>
        {liveLink ? (
          <div className="sr-row">
            <a data-testid="readiness-url" href={`/r/${liveLink.token}`}>
              {env.APP_BASE_URL}/r/{liveLink.token}
            </a>
            <form action={revokeSharedLinkAction}>
              <input name="linkId" type="hidden" value={liveLink.id} />
              <input name="returnTo" type="hidden" value="/dashboard" />
              <button className="sr-btn sr-btn--ghost" data-testid="revoke-readiness" type="submit">
                Revoke
              </button>
            </form>
          </div>
        ) : (
          <form action={createReadinessLinkAction}>
            <button className="sr-btn sr-btn--secondary" data-testid="create-readiness" type="submit">
              Create a shareable link
            </button>
          </form>
        )}
      </section>

      {/* Band 4 */}
      <CoveragePanel coverage={model.coverage} />
    </>
  );
}
