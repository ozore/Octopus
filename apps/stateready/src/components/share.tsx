/**
 * M17 — the shared readiness link and the technician licence card, on paper.
 *
 * **Paper is what leaves the building.** Both of these surfaces render inside
 * `PaperSurface`, which stamps `data-theme="paper"` on the artefact's own root
 * and therefore beats the viewer's own preference — because the artefact's
 * audience is not the person who chose the theme. A forwarded dark screenshot
 * is not something a general manager who has never logged in can read, and
 * `PERSONA.md` §9 requires every artefact to be exactly that.
 *
 * **The grid degrades to a grouped status list on a phone** (`UX.md` §8):
 * 51 tiles at 28px is a poor phone experience, and the list carries the same
 * information in the same order — LAPSED → AT RISK → READY → NOT TRACKED. The
 * list is always rendered, on every width, because it is also the accessible
 * equivalent of the grid.
 */

import { PaperSurface } from '@/components/paper';
import { Disclaimer, NotYetVerified, Provenance } from '@/components/provenance';
import { StatusChip, TileGrid } from '@/components/status';
import type { ReadinessView, TechnicianCardView } from '@/lib/repos/shared-links';

/** A link that has been turned off. It ANSWERS — it does not 404. */
export function RevokedLink({ appName }: { appName: string }) {
  return (
    <PaperSurface className="sr-main" testId="revoked-link">
      <div className="sr-container sr-stack">
        <p className="sr-eyebrow">{appName}</p>
        <h1>This link has been turned off</h1>
        <p className="sr-lead">
          The company that shared it revoked it. Ask them for a new one — it takes them one click.
        </p>
        <Disclaimer />
      </div>
    </PaperSurface>
  );
}

export function ReadinessSheet({ view, appName }: { view: ReadinessView; appName: string }) {
  const groups = ['LAPSED', 'AT RISK', 'READY', 'NOT TRACKED'] as const;

  return (
    <PaperSurface className="sr-main" testId="readiness-sheet">
      <div className="sr-container sr-stack">
        <header>
          <p className="sr-eyebrow">{appName} · readiness, shared read-only</p>
          <h1 data-testid="readiness-org">{view.organisationName}</h1>
          <div className="sr-row">
            <StatusChip status={view.model.worstStatus} />
            <span className="sr-meta" data-testid="readiness-generated">
              As at {view.generatedOn}
            </span>
          </div>
        </header>

        <section className="sr-row">
          <span className="sr-stat">
            <span className="sr-stat__value">{view.model.counts.licences}</span>
            <span className="sr-stat__label">licences</span>
          </span>
          <span className="sr-stat" data-status="risk">
            <span className="sr-stat__value">{view.model.counts.deadlines90}</span>
            <span className="sr-stat__label">due within 90 days</span>
          </span>
          <span className="sr-stat" data-status="lapsed">
            <span className="sr-stat__value">{view.model.counts.lapsed}</span>
            <span className="sr-stat__label">lapsed</span>
          </span>
        </section>

        {/* The grid, for the desktop. Hidden below 40rem by `.sr-share-map`. */}
        <section className="sr-share-map" data-testid="readiness-map">
          <h2 className="sr-eyebrow">The board</h2>
          <TileGrid tiles={view.model.tiles} />
        </section>

        {/* The grouped status list — the phone's view, and the grid's equivalent. */}
        <section data-testid="readiness-list">
          <h2 className="sr-eyebrow">Every credential, worst first</h2>
          {view.rows.length === 0 ? (
            <p className="muted">Nothing is tracked on this link yet.</p>
          ) : (
            groups.map((group) => {
              const rows = view.rows.filter((row) => row.status === group);
              if (rows.length === 0) return null;
              return (
                <div className="sr-mt-6" data-testid="readiness-group" data-group={group} key={group}>
                  <h3 className="sr-eyebrow">
                    {group} · {rows.length}
                  </h3>
                  <ul className="sr-feed">
                    {rows.map((row, index) => (
                      <li className="sr-feed__item" data-testid="readiness-row" key={`${group}-${index}`}>
                        <span className="sr-feed__date">{row.dueOn ?? 'no date'}</span>
                        <span className="sr-feed__state">{row.state}</span>
                        <span className="sr-feed__what">
                          <strong>{row.holder}</strong> — {row.what}
                          {row.days !== null ? (
                            <span className="sr-meta">
                              {' '}
                              · {row.days >= 0 ? `${row.days} days` : `${Math.abs(row.days)} days ago`}
                            </span>
                          ) : null}
                          {row.needsHumanCheck ? (
                            <span className="sr-note">
                              A rule we could not fully verify — check it with the board.
                            </span>
                          ) : null}
                          {row.source === 'derived' ? (
                            <Provenance url={row.citationUrl} lastVerified={row.citationLastVerified} />
                          ) : (
                            <span className="sr-meta">
                              {' '}
                              · entered by the licence holder, not derived from a board page
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </section>

        <Disclaimer />
      </div>
    </PaperSurface>
  );
}

/**
 * S18 — the technician licence card. Mobile-first, printable, works at 320px,
 * readable in a van at arm's length, and it carries a **"verify at the board"**
 * link, because the whole product rests on the reader being able to check us.
 */
export function TechnicianCard({ view, appName }: { view: TechnicianCardView; appName: string }) {
  return (
    <PaperSurface className="sr-main" testId="technician-card">
      <div className="sr-container sr-stack" style={{ maxInlineSize: '30rem' }}>
        <header>
          <p className="sr-eyebrow">{appName} · licence card</p>
          <h1 data-testid="card-name">{view.technicianName}</h1>
          <div className="sr-row">
            <StatusChip status={view.worstStatus} />
            <span className="sr-meta">{view.organisationName}</span>
          </div>
        </header>

        {view.credentials.length === 0 ? (
          <p className="muted" data-testid="card-empty">
            No credentials are recorded for this technician.
          </p>
        ) : (
          view.credentials.map((credential, index) => (
            <article className="sr-card" data-testid="card-credential" key={index}>
              <div className="sr-card__head">
                <div>
                  <h2 className="sr-card__title">{credential.typeName}</h2>
                  <p className="sr-meta sr-mb-0">
                    {credential.stateName} · {credential.trade}
                  </p>
                </div>
                <StatusChip status={credential.status} />
              </div>
              <dl className="sr-dl">
                <dt>Number</dt>
                <dd className="sr-number">{credential.licenceNumber ?? 'not recorded'}</dd>
                <dt>Expires</dt>
                <dd>
                  {credential.expiresOn ? (
                    <>
                      <span className="sr-number">{credential.expiresOn}</span>
                      <span className="sr-meta">
                        {' '}
                        ·{' '}
                        {credential.expirySource === 'derived'
                          ? "worked out from the state's own rule"
                          : 'entered by the licence holder'}
                      </span>
                    </>
                  ) : (
                    <NotYetVerified
                      what="an expiry date for this credential"
                      boardName={credential.boardName}
                      boardUrl={credential.boardUrl}
                    />
                  )}
                </dd>
                <dt>Board</dt>
                <dd>
                  {credential.verifyUrl ? (
                    <a data-testid="verify-link" href={credential.verifyUrl} rel="noreferrer noopener">
                      Verify at {credential.boardName ?? 'the board'}
                    </a>
                  ) : (
                    <span className="muted">not recorded</span>
                  )}
                </dd>
              </dl>
            </article>
          ))
        )}

        <p className="sr-meta">As at {view.generatedOn}.</p>
        <Disclaimer />
      </div>
    </PaperSurface>
  );
}
