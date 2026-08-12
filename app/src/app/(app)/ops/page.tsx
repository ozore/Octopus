/**
 * `/ops` — the human escalation queue.
 *
 * Spec: ARCHITECTURE.md §3.6, I5, USER_JOURNEY.md §2.
 *
 * PLAIN AND FUNCTIONAL ON PURPOSE. This is the one internal surface in the
 * product, and every minute spent decorating it is a minute not spent on the
 * screen a panicking seller reads. It is a table, a claim button and a resolve
 * button. It still uses the same tokens and the same components as everything
 * else — Nielsen #4 applies to reviewers too, and a bespoke admin theme is how
 * a second, uncertified palette gets into a codebase.
 *
 * THIS QUEUE IS THE DIFFERENTIATOR, not an overflow bin. AppealDesk triages hard
 * cases *away*; the whole D3 category bet is that we take them. Both entry
 * points land here — a classifier that declined to guess (I5) and a seller whose
 * first submission was rejected (the outcome guarantee) — and the experience is
 * identical, because a seller escalated after a rejection must not be able to
 * tell they are on a "recovery" path (USER_JOURNEY §4).
 *
 * AUTH BOUNDARY. ARCHITECTURE.md §3.1 puts /ops behind a separate boundary. The
 * shared-secret check below is the minimum honest version of that: in
 * production, no `OPS_SHARED_SECRET` means the route does not exist at all,
 * rather than existing unprotected. It is a boundary, not an identity system,
 * and a real reviewer login is a prerequisite for reviewer attribution on
 * `human_edits.reviewer_id` (ARCHITECTURE.md §5.1).
 */

import { notFound } from 'next/navigation';

import { claimCase, resolveCase } from '@/app/_lib/actions';
import { listCases, listEscalations, listResolvedEscalations } from '@/app/_lib/case-store';
import { StatusPill } from '@/components/StatusPill';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Escalation queue — Clausewright ops' };

function authorised(key: string): boolean {
  const secret = process.env.OPS_SHARED_SECRET;
  if (secret) return key === secret;
  // No secret configured: available in development, absent in production.
  return process.env.NODE_ENV !== 'production';
}

export default async function OpsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const key = typeof query.key === 'string' ? query.key : '';
  if (!authorised(key)) notFound();

  const [open, resolved, all] = await Promise.all([
    listEscalations(),
    listResolvedEscalations(),
    listCases(),
  ]);

  return (
    <div className="cw-ops">
      <div className="cw-screen__head">
        <span className="cw-screen__eyebrow">Ops</span>
        <h1 className="cw-screen__title">Escalation queue</h1>
        <p className="cw-screen__lede">
          Cases the machine declined, and cases whose first submission was rejected. Same queue,
          same quality bar, on purpose.
        </p>
      </div>

      <div className="cw-ops__stats">
        <div className="cw-ops__stat">
          <span className="cw-ops__stat-k">Open</span>
          <span className="cw-ops__stat-v">{open.length}</span>
        </div>
        <div className="cw-ops__stat">
          <span className="cw-ops__stat-k">Claimed</span>
          <span className="cw-ops__stat-v">
            {open.filter((c) => c.escalation?.claimedBy).length}
          </span>
        </div>
        <div className="cw-ops__stat">
          <span className="cw-ops__stat-k">Resolved</span>
          <span className="cw-ops__stat-v">{resolved.length}</span>
        </div>
        <div className="cw-ops__stat">
          <span className="cw-ops__stat-k">Cases total</span>
          <span className="cw-ops__stat-v">{all.length}</span>
        </div>
      </div>

      <section aria-labelledby="open-title">
        <h2 className="cw-card__title" id="open-title">
          Open
        </h2>
        {open.length === 0 ? (
          <p className="cw-empty">
            Nothing waiting. An empty queue is a good day, not a broken page.
          </p>
        ) : (
          <div className="cw-scroll-x">
            <table className="cw-table">
              <caption>
                Priority order is arrival order. A refused category is a referral, not a draft.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Case</th>
                  <th scope="col">Why it is here</th>
                  <th scope="col">Route</th>
                  <th scope="col">Claimed by</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {open.map((record) => (
                  <tr key={record.id}>
                    <th scope="row" className="cw-table__id">
                      <a href={`/case/${record.id}`}>{record.id}</a>
                    </th>
                    <td>
                      <StatusPill tone="caution">{record.escalation!.reason}</StatusPill>
                      <div className="cw-text-sm cw-ink-2">{record.escalation!.detail}</div>
                    </td>
                    <td>
                      {record.escalation!.disposition === 'refer_out'
                        ? 'Partner referral'
                        : 'Human tier'}
                    </td>
                    <td>{record.escalation!.claimedBy ?? '—'}</td>
                    <td>
                      <div className="cw-table__actions">
                        {record.escalation!.claimedBy ? (
                          <form action={resolveCase}>
                            <input type="hidden" name="caseId" value={record.id} />
                            <input
                              className="cw-field__control cw-btn--sm"
                              type="text"
                              name="resolution"
                              aria-label={`What you changed on ${record.id}`}
                              placeholder="What you changed, and why"
                            />
                            <button className="cw-btn cw-btn--secondary cw-btn--sm" type="submit">
                              <span className="cw-btn__label">Resolve</span>
                            </button>
                          </form>
                        ) : (
                          <form action={claimCase}>
                            <input type="hidden" name="caseId" value={record.id} />
                            <input
                              className="cw-field__control cw-btn--sm"
                              type="text"
                              name="reviewer"
                              aria-label={`Your reviewer name for ${record.id}`}
                              placeholder="Your name"
                            />
                            <button className="cw-btn cw-btn--secondary cw-btn--sm" type="submit">
                              <span className="cw-btn__label">Claim</span>
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="resolved-title">
        <h2 className="cw-card__title" id="resolved-title">
          Resolved
        </h2>
        {resolved.length === 0 ? (
          <p className="cw-empty">Nothing resolved yet.</p>
        ) : (
          <div className="cw-scroll-x">
            <table className="cw-table">
              <caption>
                Every resolution note is a structured record of what a person changed and why — the
                highest-signal input to the next corpus release, and it costs nothing to keep.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Case</th>
                  <th scope="col">Reviewer</th>
                  <th scope="col">Resolved</th>
                  <th scope="col">What changed</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((record) => (
                  <tr key={record.id}>
                    <th scope="row" className="cw-table__id">
                      <a href={`/case/${record.id}`}>{record.id}</a>
                    </th>
                    <td>{record.escalation?.claimedBy ?? '—'}</td>
                    <td>
                      {record.escalation?.resolvedAt
                        ? new Date(record.escalation.resolvedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td>{record.escalation?.resolution ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
