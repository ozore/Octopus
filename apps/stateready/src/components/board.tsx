/**
 * M7 — the board's own components. `specs/07`, `IDENTITY.md` §8.2.
 *
 * The canonical composition: three stats, then the **tile grid** (7 cols)
 * beside the **runway** (5 cols), then the expiring list (12 cols).
 *
 * Two properties are the whole point and both are asserted by tests rather than
 * left to review:
 *
 *  1. **Status is never colour alone.** Fill + edge + glyph + the word, in the
 *     accessible name and again in the card. `TileGrid` and `StatusChip` in
 *     `components/status.tsx` own that; nothing here composes a status string.
 *  2. **The grid is never the only route to its data.** The expiring list below
 *     carries the same rows, in the same order, as real text.
 */

import { NotYetVerified, Provenance } from '@/components/provenance';
import { Runway, StatusChip, TileGrid, type RunwayLane } from '@/components/status';
import type { BoardCard, BoardModel, CalendarMonth, CoverageHonesty } from '@/lib/repos/board';
import { kindLabel } from '@/components/licences';

/** Band 1 — one sentence, first, unmissable. */
export function StatusLine({ model }: { model: BoardModel }) {
  const worst = model.dashboard.worstStatus;
  return (
    <section
      className="sr-card"
      data-status={worst === 'READY' ? 'ready' : worst === 'LAPSED' ? 'lapsed' : 'risk'}
      data-testid="status-band"
    >
      <p className="sr-eyebrow">Readiness</p>
      <h1 style={{ marginBlockEnd: 'var(--sr-space-2)' }} data-testid="status-line">
        {model.statusLine}
      </h1>
      <div className="sr-row">
        <StatusChip status={worst} />
        <span className="sr-stat">
          <span className="sr-stat__value">{model.dashboard.counts.licences}</span>
          <span className="sr-stat__label">licences tracked</span>
        </span>
        <span className="sr-stat" data-status="risk">
          <span className="sr-stat__value">{model.dashboard.counts.deadlines90}</span>
          <span className="sr-stat__label">due within {model.atRiskDays} days</span>
        </span>
        <span className="sr-stat" data-status="lapsed">
          <span className="sr-stat__value">{model.dashboard.counts.lapsed}</span>
          <span className="sr-stat__label">lapsed</span>
        </span>
        {model.dashboard.counts.needsHumanCheck > 0 ? (
          <span className="badge" data-testid="needs-check-count">
            {model.dashboard.counts.needsHumanCheck} rule
            {model.dashboard.counts.needsHumanCheck === 1 ? '' : 's'} we could not fully verify
          </span>
        ) : null}
      </div>
    </section>
  );
}

/** Band 2 — the board beside the runway. Clicking a tile filters and the URL is shareable. */
export function BoardBand({ model }: { model: BoardModel }) {
  const lanes: RunwayLane[] = model.cards.slice(0, 8).map((card) => ({
    label: `${card.state} ${kindLabel(card.kind)}`,
    days: card.days,
    status: card.status,
    detail: `${card.holder}, ${card.typeName}, ${card.dueOn}, ${
      card.days >= 0 ? `${card.days} days remaining` : `${Math.abs(card.days)} days ago`
    }`,
  }));

  return (
    <div className="sr-grid sr-mt-6">
      <section className="sr-col-7">
        <h2 className="sr-eyebrow">The board</h2>
        <TileGrid
          tiles={model.dashboard.tiles}
          selected={model.stateFilter}
          hrefFor={(state) => (model.stateFilter === state ? '/dashboard' : `/dashboard?state=${state}`)}
        />
      </section>
      <section className="sr-col-5">
        <h2 className="sr-eyebrow">The next {model.atRiskDays} days</h2>
        {lanes.length > 0 ? (
          <Runway lanes={lanes} horizonDays={model.atRiskDays + 30} />
        ) : (
          <p className="muted small">
            Nothing derived yet. Add a licence with its issue date and the runway fills itself.
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * Band 3 — a deadline card, with the one-click "mark renewed" that asks for the
 * new expiry and the proof document.
 *
 * A card whose deadline carries `confidence = "medium"` shows the knowledge-base
 * value's note under the date; one with `needsHumanCheck` shows the flag and is
 * excluded from the confident claim in the status line.
 */
export function BoardDeadlineCard({
  card,
  markRenewedAction,
  returnTo,
}: {
  card: BoardCard;
  markRenewedAction?: (formData: FormData) => void | Promise<void>;
  /** Where to send the coordinator back to — the filtered board they were on. */
  returnTo?: string;
}) {
  return (
    <article
      className="sr-card sr-card--licence"
      data-status={card.status === 'READY' ? 'ready' : card.status === 'LAPSED' ? 'lapsed' : 'risk'}
      data-testid="licence-card"
      data-state={card.state}
      data-kind={card.kind}
    >
      <div className="sr-card__head">
        <div>
          <h3 className="sr-card__title">
            <a href={`/licences/${card.licenceId}`}>
              {card.state} · {kindLabel(card.kind)}
            </a>
          </h3>
          <p className="sr-meta sr-mb-0">
            {card.holder} · {card.typeName}
            {card.licenceNumber ? <span className="sr-number"> · {card.licenceNumber}</span> : null}
          </p>
        </div>
        <StatusChip status={card.status} />
      </div>

      <dl className="sr-dl">
        <dt>Due</dt>
        <dd>
          <span className="sr-number">{card.dueOn}</span> ·{' '}
          {card.days >= 0 ? `in ${card.days} days` : `${Math.abs(card.days)} days ago`} ·{' '}
          {card.source === 'derived' ? 'we worked this out' : 'you entered this'}
        </dd>
        <dt>Rule</dt>
        <dd>
          {card.deadline.rule ?? (
            <span className="muted">the date you gave us — we hold no board rule behind it</span>
          )}
        </dd>
      </dl>

      {card.needsHumanCheck ? (
        <p className="notice warn small" data-testid="needs-check">
          We could not fully verify this rule — check it with the board before you rely on it.
        </p>
      ) : null}

      {card.source === 'derived' ? (
        <Provenance
          url={card.citationUrl}
          lastVerified={card.citationLastVerified}
          confidence={card.confidence}
          unverified={card.needsHumanCheck}
          notes={card.notes}
        />
      ) : null}

      {markRenewedAction ? (
        <form action={markRenewedAction} className="sr-row sr-mt-6" data-testid="mark-renewed-form">
          <input name="deadlineId" type="hidden" value={card.deadline.id} />
          <input name="returnTo" type="hidden" value={returnTo ?? '/dashboard'} />
          <label className="sr-field sr-mb-0" htmlFor={`renewed-${card.deadline.id}`}>
            <span className="sr-field__label">New expiry, from the renewed card</span>
            <input
              className="sr-input"
              id={`renewed-${card.deadline.id}`}
              name="newExpiry"
              required
              type="date"
            />
          </label>
          <button className="sr-btn sr-btn--primary" data-testid="mark-renewed" type="submit">
            Mark renewed
          </button>
        </form>
      ) : null}
    </article>
  );
}

/**
 * Band 4 — the coverage honesty panel. Permanent, not dismissable.
 *
 * This is not a disclaimer somebody made us add. It is what keeps the product
 * trustworthy when the customer eventually finds a gap: **they knew, because we
 * told them on the front page.**
 */
export function CoveragePanel({ coverage }: { coverage: CoverageHonesty }) {
  return (
    <section className="sr-card sr-mt-6" data-testid="coverage-panel">
      <h2 className="sr-card__title">What we do and do not derive for you</h2>
      <p>
        You operate in <strong data-testid="coverage-operating">{coverage.operatingStates}</strong>{' '}
        {coverage.operatingStates === 1 ? 'state' : 'states'}. We derive deadlines for{' '}
        <strong data-testid="coverage-derived">{coverage.coveredStates}</strong> of them.
      </p>

      {coverage.notDerived.length > 0 ? (
        <p className="small" data-testid="coverage-not-derived">
          Tracked but not derived:{' '}
          {coverage.notDerived.map((pair) => `${pair.state} ${pair.trade}`).join(', ')}. We will keep the
          dates you enter and alert on them; we will not invent the ones we cannot read on a board&apos;s
          own page.
        </p>
      ) : (
        <p className="small muted">
          Every state and trade in your profile is covered by a rule set we hold.
        </p>
      )}

      {coverage.outsideProfile.length > 0 ? (
        <p className="small" data-testid="coverage-outside-profile">
          You hold licences in {coverage.outsideProfile.join(', ')}, which your profile does not list. We
          show them on the board anyway — add them to <a href="/settings/company">where you work</a> and
          we will keep the coverage figures honest.
        </p>
      ) : null}

      <details data-testid="coverage-detail">
        <summary className="small">What the rule library holds, and what it does not</summary>
        <div className="small sr-stack">
          <p>
            We cover <strong>{coverage.tradesCovered.join(', ')}</strong> only, and only in the states on
            our <a href="/coverage">coverage page</a>. We do not cover county or city licensing, permits
            or registrations, which exist in most states in addition to the state licence.
          </p>
          {coverage.derived.length > 0 ? (
            <ul>
              {coverage.derived.map((row) => (
                <li key={`${row.state}-${row.trade}`}>
                  <strong>
                    {row.state} {row.trade}
                  </strong>{' '}
                  — <span className="sr-number">{row.recordId}</span>
                  {row.lastVerified ? (
                    <span className="sr-meta"> · oldest value checked {row.lastVerified}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <p data-testid="coverage-named-gaps">
            Some things we always <em>name</em> and frequently cannot fill, because the board does not
            publish them: {coverage.namedButOftenUnpublished.join('; ')}. Where that is so, the licence
            page says &ldquo;the board does not publish this&rdquo; rather than showing you a blank or a
            number we made up.
          </p>
        </div>
      </details>
    </section>
  );
}

/** AC1 — an empty state that is an instruction, never a chart of nothing. */
export function EmptyBoard() {
  return (
    <div className="sr-empty" data-testid="board-empty">
      <h3>Nothing on the board yet</h3>
      <p className="muted">
        Add one licence — the type, the state and the day it was issued — and we will work out when it
        expires from the state&apos;s own rule, and show you the sentence we read it in.
      </p>
      <p className="sr-row">
        <a className="sr-btn sr-btn--primary" data-testid="add-first-licence" href="/licences/new">
          Add your first licence
        </a>
        <a className="sr-btn sr-btn--secondary" href="/roster/import">
          Import your roster
        </a>
      </p>
    </div>
  );
}

/** The expiring list — the same rows as the grid, as text, always. */
export function ExpiringList({ cards }: { cards: readonly BoardCard[] }) {
  if (cards.length === 0) {
    return (
      <p className="muted small" data-testid="expiring-empty">
        Nothing in this window.
      </p>
    );
  }
  return (
    <div className="sr-table-wrap">
      <table className="sr-table" data-testid="expiring-list">
        <thead>
          <tr>
            <th scope="col">State</th>
            <th scope="col">Holder</th>
            <th scope="col">What is due</th>
            <th scope="col">Due</th>
            <th scope="col">In</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <tr data-testid="expiring-row" key={card.deadline.id}>
              <th scope="row">{card.state}</th>
              <td>{card.holder}</td>
              <td>
                <a href={`/licences/${card.licenceId}`}>
                  {kindLabel(card.kind)} — {card.typeName}
                </a>
              </td>
              <td className="sr-num">{card.dueOn}</td>
              <td className="sr-num">
                {card.days >= 0 ? `${card.days} d` : `${Math.abs(card.days)} d ago`}
              </td>
              <td>
                <StatusChip status={card.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The month grid. The 31 December wall and the August cliff, as a picture. */
export function CalendarGrid({ month }: { month: CalendarMonth }) {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div data-testid="calendar-grid">
      <h2 className="sr-card__title" data-testid="calendar-month">
        {month.label}
      </h2>
      <ul
        className="sr-map__grid"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gridAutoRows: 'auto' }}
      >
        {weekdays.map((day) => (
          <li className="sr-meta" key={day}>
            {day}
          </li>
        ))}
        {Array.from({ length: month.leading }, (_, i) => (
          <li aria-hidden="true" key={`pad-${i}`} />
        ))}
        {month.days.map((day) => (
          <li data-testid="calendar-day" data-date={day.date} key={day.date}>
            <div className="sr-card" style={{ padding: 'var(--sr-space-2)' }}>
              <span className="sr-number sr-meta">{day.day}</span>
              {day.cards.map((card) => (
                <p className="sr-mb-0 small" key={card.deadline.id}>
                  <a href={`/licences/${card.licenceId}`}>
                    {card.state} {kindLabel(card.kind)}
                  </a>
                </p>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <ul className="sr-visually-hidden">
        {month.days
          .filter((day) => day.cards.length > 0)
          .map((day) => (
            <li key={`sr-${day.date}`}>
              {day.date}: {day.cards.map((c) => `${c.state} ${kindLabel(c.kind)}, ${c.holder}`).join('; ')}
            </li>
          ))}
      </ul>
    </div>
  );
}

/**
 * The print view's deadline table. **Every citation and every `last_verified`**
 * (`specs/07` AC6) — this is what gets emailed to a general contractor or a
 * diligence team, which makes it a distribution channel rather than a feature.
 */
export function PrintableDeadlineTable({ cards }: { cards: readonly BoardCard[] }) {
  return (
    <table className="sr-table" data-testid="print-table">
      <thead>
        <tr>
          <th scope="col">State</th>
          <th scope="col">Holder</th>
          <th scope="col">Licence</th>
          <th scope="col">Due</th>
          <th scope="col">Status</th>
          <th scope="col">Rule, source and last check</th>
        </tr>
      </thead>
      <tbody>
        {cards.map((card) => (
          <tr data-testid="print-row" key={card.deadline.id}>
            <th scope="row">{card.state}</th>
            <td>{card.holder}</td>
            <td>
              {card.typeName}
              {card.licenceNumber ? <span className="sr-number"> · {card.licenceNumber}</span> : null}
            </td>
            <td className="sr-num">
              {card.dueOn} ({kindLabel(card.kind)})
            </td>
            <td>{card.status}</td>
            <td>
              {card.source === 'derived' ? (
                <>
                  <span className="sr-number">{card.deadline.rule}</span>
                  <Provenance
                    url={card.citationUrl}
                    lastVerified={card.citationLastVerified}
                    confidence={card.confidence}
                    unverified={card.needsHumanCheck}
                    notes={card.notes}
                  />
                </>
              ) : (
                <NotYetVerified
                  what="a board rule behind this date"
                  why="You entered this date; there is no board page behind it and we have not invented one."
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
