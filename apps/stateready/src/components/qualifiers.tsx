/**
 * M16 — the qualifier watch, rendered. `UX.md` S15, `IDENTITY.md` §2 UA3.
 *
 * The row carries the **statutory consequence and its source**, because the
 * consequence is the reason the clock matters: a missed replacement is not a
 * late fee, it is the automatic suspension of the licence the company bids
 * with.
 *
 * And the cadence carries its own label. **75/45/15/5 is our design judgment,
 * not a sourced convention**, and this product does not let an invented number
 * sit next to a sourced one without saying which is which.
 */

import { NotYetVerified, Provenance } from '@/components/provenance';
import { Runway, StatusChip, type RunwayLane } from '@/components/status';
import { QUALIFIER_ALERT_OFFSETS, QUALIFIER_CADENCE_NOTE, QUALIFIER_REFERENCE, type QualifierClock } from '@/lib/qualifiers';

export function QualifierCadence() {
  return (
    <p className="notice small" data-testid="qualifier-cadence">
      <strong>We will email you at {QUALIFIER_ALERT_OFFSETS.join(' / ')} days remaining.</strong>{' '}
      {QUALIFIER_CADENCE_NOTE}
    </p>
  );
}

export function QualifierRow({ clock }: { clock: QualifierClock }) {
  const lanes: RunwayLane[] =
    clock.dueOn && clock.status
      ? [
          {
            label: `${clock.licence.state} qualifier`,
            days: clock.daysRemaining ?? 0,
            status: clock.status,
            detail: `${clock.holderName}, ${clock.typeName}, replacement due ${clock.dueOn}`,
          },
        ]
      : [];

  return (
    <article
      className="sr-card sr-card--licence"
      data-status={
        clock.status === 'READY' ? 'ready' : clock.status === 'LAPSED' ? 'lapsed' : clock.status ? 'risk' : undefined
      }
      data-testid="qualifier-row"
      data-state={clock.licence.state}
      data-published={clock.published ? 'true' : 'false'}
    >
      <div className="sr-card__head">
        <div>
          <h3 className="sr-card__title">
            <a href={`/licences/${clock.licence.id}`}>
              {clock.licence.state} · {clock.typeName}
            </a>
          </h3>
          <p className="sr-meta sr-mb-0">
            {clock.holderName}
            {clock.licence.licenceNumber ? (
              <span className="sr-number"> · {clock.licence.licenceNumber}</span>
            ) : null}
          </p>
        </div>
        {clock.status ? <StatusChip status={clock.status} /> : null}
      </div>

      <dl className="sr-dl">
        <dt>Qualifier left</dt>
        <dd>
          <span className="sr-number">{clock.disassociatedOn}</span>
        </dd>
        <dt>Replacement due</dt>
        <dd data-testid="qualifier-due">
          {clock.published && clock.dueOn ? (
            <>
              <span className="sr-number">{clock.dueOn}</span> ·{' '}
              {(clock.daysRemaining ?? 0) >= 0
                ? `${clock.daysRemaining} days left`
                : `${Math.abs(clock.daysRemaining ?? 0)} days over`}
              {clock.window ? (
                <span className="sr-meta">
                  {' '}
                  · {clock.window.value} {clock.window.unit.replace(/_/g, ' ')} from the day they left
                </span>
              ) : null}
            </>
          ) : (
            <NotYetVerified
              what="a deadline for naming a replacement qualifier"
              why={clock.refusal ?? undefined}
              boardName={clock.boardName}
              boardUrl={clock.boardUrl}
            />
          )}
        </dd>
      </dl>

      {clock.evidence ? (
        <p className="sr-note" data-testid="qualifier-consequence">
          “{clock.evidence}”
        </p>
      ) : null}

      {clock.needsHumanCheck ? (
        <p className="notice warn small">
          We could not fully verify this rule — check it with the board before you rely on it.
        </p>
      ) : null}

      {clock.published ? (
        <Provenance
          url={clock.citationUrl}
          lastVerified={clock.citationLastVerified}
          confidence={clock.confidence}
          unverified={clock.needsHumanCheck}
          notes={clock.notes}
        />
      ) : null}

      {lanes.length > 0 ? <Runway lanes={lanes} horizonDays={Math.max(90, clock.window?.value ?? 90)} /> : null}
    </article>
  );
}

/**
 * The rule that made this screen exist — **read, cited, and explicitly not part
 * of our coverage.**
 *
 * California is not in the knowledge base, so no Californian licence gets a
 * clock from this product today. Saying that beside CSLB's own sentence is the
 * honest shape: the customer learns the rule, learns that we do not yet track
 * it for them, and can act on both.
 */
export function QualifierReference() {
  return (
    <section className="sr-card" data-testid="qualifier-reference">
      <h2 className="sr-card__title">Why this screen exists</h2>
      <blockquote className="sr-doc__req">
        <p className="sr-mb-0">“{QUALIFIER_REFERENCE.quote}”</p>
      </blockquote>
      <p className="sr-meta">
        {QUALIFIER_REFERENCE.board}, {QUALIFIER_REFERENCE.statute}
      </p>
      <Provenance
        url={QUALIFIER_REFERENCE.sourceUrl}
        title={`${QUALIFIER_REFERENCE.board} — Disassociation Request`}
        lastVerified={QUALIFIER_REFERENCE.lastVerified}
        confidence="high"
      />
      <p className="notice small" data-testid="qualifier-reference-coverage">
        <strong>{QUALIFIER_REFERENCE.stateName} is not in our rule library yet.</strong> We have read this
        form and we are quoting it; we do not start this clock for a {QUALIFIER_REFERENCE.stateName}{' '}
        licence, because we derive a customer&apos;s date only from a rule set we hold and re-check. When{' '}
        {QUALIFIER_REFERENCE.stateName} lands, the clock below starts working for it with no change to
        this screen. <a href="/coverage">What we hold today.</a>
      </p>
    </section>
  );
}
