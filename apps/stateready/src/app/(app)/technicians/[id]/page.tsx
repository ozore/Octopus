import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StatusChip } from '@/components/status';
import { createTechnicianCardAction, revokeSharedLinkAction } from '@/lib/actions';
import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { buildLicenceList } from '@/lib/repos/licence-view';
import { buildTechnicianCard, listSharedLinks } from '@/lib/repos/shared-links';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * The technician sheet (`UX.md` S12): one licence card per credential, and the
 * **"send this technician their card"** action that mints the tokenised,
 * revocable, paper-theme card at `/c/:token` (S18).
 *
 * The card is the whole of the technician experience in v1 (`PERSONA.md` §11):
 * no login, works at 320px, printable, readable in a van at arm's length, and
 * carrying the board's own "verify" link so the general contractor who is
 * handed it can check us in ten seconds.
 */
export default async function TechnicianPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const env = getEnv();
  const today = new Date().toISOString().slice(0, 10);

  const card = await buildTechnicianCard(
    db,
    { orgId: org.id, technicianId: id, organisationName: org.name },
    today,
  );
  if (!card) notFound();

  const [list, links] = await Promise.all([
    buildLicenceList(db, org.id, today),
    listSharedLinks(db, org.id, 'technician_card'),
  ]);
  const rows = list.rows.filter((row) => row.licence.technicianId === id);
  const live = links.filter((link) => link.subjectId === id && link.revokedAt === null);

  return (
    <>
      <p className="sr-eyebrow">
        <Link href="/roster">Roster</Link>
      </p>
      <div className="sr-row sr-row--between">
        <div>
          <h1 className="sr-mb-0">{card.technicianName}</h1>
          <p className="sr-meta">
            {card.credentials.length} credential{card.credentials.length === 1 ? '' : 's'}
          </p>
        </div>
        <StatusChip status={card.worstStatus} />
      </div>

      {query['card'] ? <p className="notice">Card link created. Copy it below and send it on.</p> : null}
      {query['revoked'] ? <p className="notice">Revoked. That link now says it has been turned off.</p> : null}

      <section className="sr-mt-6">
        <h2 className="sr-eyebrow">Credentials</h2>
        {rows.length === 0 ? (
          <div className="sr-empty">
            <h3>No licences recorded for this technician</h3>
            <Link className="sr-btn sr-btn--primary" href="/licences/new">
              Add one
            </Link>
          </div>
        ) : (
          <div className="sr-two-up">
            {rows.map((row) => (
              <article className="sr-card sr-card--licence" data-testid="technician-licence" key={row.licence.id}>
                <div className="sr-card__head">
                  <div>
                    <h3 className="sr-card__title">
                      <Link href={`/licences/${row.licence.id}`}>{row.typeName}</Link>
                    </h3>
                    <p className="sr-meta sr-mb-0">
                      {row.stateName}
                      {row.licence.licenceNumber ? (
                        <span className="sr-number"> · {row.licence.licenceNumber}</span>
                      ) : null}
                    </p>
                  </div>
                  <StatusChip status={row.status} />
                </div>
                <dl className="sr-dl">
                  <dt>Expires</dt>
                  <dd>
                    {row.licence.expiresOn ?? 'not derived'}
                    <span className="sr-meta"> · {row.expiryWording}</span>
                  </dd>
                  <dt>CE</dt>
                  <dd>{row.ceRequired === null ? 'no requirement we could establish' : `${row.ceRecorded} / ${row.ceRequired} h`}</dd>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="sr-card sr-mt-6" data-testid="card-links">
        <h2 className="sr-card__title">Send this technician their card</h2>
        <p className="sr-meta">
          A read-only page with their credentials, their numbers and the board&apos;s own verify link.
          No login. Rendered on paper, because it is shown to a general contractor in a truck and printed.
        </p>
        <form action={createTechnicianCardAction}>
          <input name="technicianId" type="hidden" value={id} />
          <button className="sr-btn sr-btn--primary" data-testid="create-card" type="submit">
            Create a card link
          </button>
        </form>

        {live.length > 0 ? (
          <ul className="sr-feed sr-mt-6">
            {live.map((link) => (
              <li className="sr-feed__item" key={link.id}>
                <span className="sr-feed__date">{link.viewCount} views</span>
                <span className="sr-feed__state">CARD</span>
                <span className="sr-feed__what">
                  <a data-testid="card-url" href={`/c/${link.token}`}>
                    {env.APP_BASE_URL}/c/{link.token}
                  </a>
                  <form action={revokeSharedLinkAction}>
                    <input name="linkId" type="hidden" value={link.id} />
                    <input name="returnTo" type="hidden" value={`/technicians/${id}`} />
                    <button className="sr-btn sr-btn--ghost" type="submit">
                      Revoke
                    </button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </>
  );
}
