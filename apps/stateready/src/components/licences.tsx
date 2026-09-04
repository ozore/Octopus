/**
 * M4 — the licence surfaces: the Dates panel, the conflict panel, the CE meter,
 * the documents list and the licence row. `specs/04` §Screens.
 *
 * Everything here is presentational and synchronous, taking a model built in
 * `lib/repos/licence-view.ts`. That is what lets `tests/m4.test.ts` render each
 * of them with `react-dom/server` and assert on the markup, which is where most
 * of `specs/04`'s acceptance criteria actually live: "shows the TDLR sentence
 * and URL it came from", "shows both dates and overwrites neither", "renders a
 * bond row reading the board does not publish this".
 */

import { NotYetVerified, Provenance } from '@/components/provenance';
import { StatusChip } from '@/components/status';
import type { Explanation } from '@/lib/rules';
import type { CeComputation } from '@/lib/rules/ce';
import type { DeadlineView, LicenceRow, LicenceView } from '@/lib/repos/licence-view';

const KIND_LABEL: Record<string, string> = {
  renewal: 'Renewal',
  ce: 'Continuing education',
  qualifier_replacement: 'Replacement qualifier',
  bond: 'Bond',
  insurance: 'Insurance',
  other: 'Other',
};

export function kindLabel(kind: string): string {
  return KIND_LABEL[kind] ?? 'Deadline';
}

/**
 * The Dates panel.
 *
 * Every date carries **where it came from** — the state's own rule or the
 * customer's keyboard — and every derived one carries the board page and the
 * day we last read it. A date with neither is not shown as a date: it is shown
 * as the refusal, with what we read and a link to ask the board.
 */
export function DatesPanel({ view }: { view: LicenceView }) {
  return (
    <section className="sr-card" data-testid="dates-panel">
      <div className="sr-card__head">
        <h2 className="sr-card__title">Dates</h2>
        <StatusChip status={view.status} />
      </div>

      <dl className="sr-dl">
        <dt>Issued</dt>
        <dd>
          {view.licence.issuedOn ? (
            <span className="sr-number">{view.licence.issuedOn}</span>
          ) : (
            <span className="muted">not recorded</span>
          )}
        </dd>
        <dt>Expires</dt>
        <dd data-testid="expiry-value">
          {view.licence.expiresOn ? (
            <>
              <span className="sr-number">{view.licence.expiresOn}</span>{' '}
              <span className="sr-meta" data-testid="expiry-source" data-source={view.licence.expirySource}>
                — {expiryWordingFor(view.licence.expirySource)}
              </span>
            </>
          ) : (
            <NotYetVerified
              what="an expiry date for this licence"
              why="We have no expiry date for this licence — either add the one on the card, or add the issue date and we will work it out where the state publishes a rule."
              boardName={view.board?.name ?? null}
              boardUrl={view.board?.url ?? null}
            />
          )}
        </dd>
      </dl>

      {view.deadlines.length > 0 ? (
        <div className="sr-stack sr-mt-6" data-testid="deadline-rows">
          {view.deadlines.map((row) => (
            <DeadlineRow key={row.deadline.id} row={row} />
          ))}
        </div>
      ) : null}

      {view.derivation.explanations.length > 0 ? (
        <div className="sr-stack sr-mt-6" data-testid="derivation-explanations">
          {view.derivation.explanations.map((explanation) => (
            <ExplanationRow
              key={`${explanation.kind}-${explanation.reason}`}
              explanation={explanation}
              boardName={view.board?.name ?? null}
              boardUrl={view.board?.url ?? null}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function expiryWordingFor(source: string): string {
  if (source === 'derived') return "we worked this out from the state's own rule";
  if (source === 'board_verified') return 'we read this on the board’s own register';
  return 'you entered this';
}

/**
 * One deadline, with its provenance and — where the derivation flagged it — the
 * note that says what we could not fully verify.
 *
 * A row for a deadline the customer TYPED carries no citation and says so
 * (deviation **D4**): there is no board page behind a date they read off their
 * own card, and inventing one would be the exact failure this product is sold
 * against.
 */
export function DeadlineRow({ row, showWhy = true }: { row: DeadlineView; showWhy?: boolean }) {
  const { deadline } = row;
  return (
    <article
      className="sr-card sr-card--licence"
      data-status={row.status === 'READY' ? 'ready' : row.status === 'LAPSED' ? 'lapsed' : 'risk'}
      data-testid="deadline-row"
      data-kind={deadline.kind}
      data-source={deadline.source}
    >
      <div className="sr-card__head">
        <h3 className="sr-card__title">{kindLabel(deadline.kind)}</h3>
        <StatusChip status={row.status} />
      </div>
      <dl className="sr-dl">
        <dt>Due</dt>
        <dd>
          <span className="sr-number">{deadline.dueOn}</span> ·{' '}
          {row.days >= 0 ? `${row.days} days` : `${Math.abs(row.days)} days ago`} ·{' '}
          {deadline.source === 'derived' ? 'we worked this out' : 'you entered this'}
        </dd>
        <dt>Rule</dt>
        <dd data-testid="deadline-rule">
          {deadline.rule ?? (
            <span className="muted">
              no board rule behind this date — it is the one you gave us, and we are tracking it
            </span>
          )}
        </dd>
      </dl>

      {deadline.needsHumanCheck ? (
        <p className="notice warn small" data-testid="needs-check">
          We could not fully verify this rule — check it with the board before you rely on it.
        </p>
      ) : null}

      {deadline.source === 'derived' && deadline.citationText ? (
        <p className="sr-note" data-testid="deadline-evidence">
          “{deadline.citationText}”
        </p>
      ) : null}

      {deadline.source === 'derived' ? (
        <Provenance
          url={deadline.citationUrl}
          lastVerified={deadline.citationLastVerified}
          confidence={deadline.confidence as 'high' | 'medium' | 'low'}
          unverified={deadline.needsHumanCheck}
          notes={row.notes}
        />
      ) : null}

      {showWhy && row.trace.length > 0 ? (
        <details data-testid="why-this-date">
          <summary className="small">Why this date?</summary>
          <ol className="sr-stack small">
            {row.trace.map((step) => (
              <li key={`${step.label}-${step.detail}`}>
                <strong>{step.label}:</strong> {step.detail}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </article>
  );
}

/**
 * Why a deadline could not be derived — never a blank field with no reason
 * (`specs/04` §Errors). The message names what we read; the link goes to the
 * board.
 */
export function ExplanationRow({
  explanation,
  boardName,
  boardUrl,
}: {
  explanation: Explanation;
  boardName: string | null;
  boardUrl: string | null;
}) {
  return (
    <div className="notice small" data-testid="explanation" data-reason={explanation.reason}>
      <NotYetVerified
        what={explanation.kind === 'ce' ? 'a continuing-education deadline' : 'a date for this'}
        why={explanation.message}
        boardName={boardName}
        boardUrl={explanation.citation?.url ?? boardUrl}
      />
      {explanation.note ? <span className="sr-note">{explanation.note}</span> : null}
    </div>
  );
}

/**
 * The conflict panel. **We keep the customer's value and overwrite neither.**
 *
 * This disagreement is a feature: it is usually a typo, and finding it is worth
 * the subscription.
 */
export function ConflictPanel({
  conflict,
  stateName,
}: {
  conflict: { entered: string; derived: string };
  stateName: string;
}) {
  return (
    <div className="sr-banner" data-status="risk" data-testid="expiry-conflict">
      <span className="sr-banner__glyph" aria-hidden="true">
        ◑
      </span>
      <p className="sr-mb-0">
        You entered <strong className="sr-number">{conflict.entered}</strong>. {stateName}&apos;s rule
        would put this at <strong className="sr-number">{conflict.derived}</strong> — check your card.
        We have kept your date and changed nothing.
      </p>
    </div>
  );
}

/**
 * The CE meter, with **the rule beside it, always** (`UX.md` S13).
 *
 * A product that shows `24/34 h` and calls it 71% done, when the missing 10 are
 * the ones that cannot be taken online, has actively misled its user. So the
 * delivery constraint and the subject breakdown render as their own lines, in
 * the board's own words, and a shortfall is only ever computed from a
 * machine-readable token.
 */
export function CeMeter({ ce, hoursLabel }: { ce: CeComputation; hoursLabel?: string }) {
  if (!ce.required) return null;
  const pct = ce.hoursRequired > 0 ? Math.min(100, Math.round((ce.hoursRecorded / ce.hoursRequired) * 100)) : 0;
  const status = ce.hoursOutstanding > 0 ? 'risk' : 'ready';
  return (
    <div className="sr-meter" data-status={status} data-testid="ce-meter">
      <div className="sr-meter__head">
        <span className="sr-eyebrow">{hoursLabel ?? 'Continuing education'}</span>
        <span className="sr-meter__value">
          {ce.hoursRecorded} / {ce.hoursRequired} h
        </span>
      </div>
      <div className="sr-meter__track">
        <div className="sr-meter__fill" style={{ inlineSize: `${pct}%` }} />
      </div>
      {ce.subjectShortfall.length > 0 ? (
        <ul className="sr-meter__rule" data-testid="ce-subjects">
          {ce.subjectShortfall.map((shortfall) => (
            <li key={shortfall.subject}>
              {shortfall.subject}: {shortfall.recorded} of {shortfall.required} h
              {shortfall.outstanding > 0 ? ` — ${shortfall.outstanding} h still to do` : ' — done'}
            </li>
          ))}
        </ul>
      ) : null}
      {ce.deliveryConstraintText ? (
        <span className="sr-meter__rule" data-testid="ce-delivery">
          {ce.deliveryConstraintText}
        </span>
      ) : null}
      {ce.approvedProviderText ? <span className="sr-meter__rule">{ce.approvedProviderText}</span> : null}
      {ce.carryoverText ? <span className="sr-meter__rule">{ce.carryoverText}</span> : null}
    </div>
  );
}

/** One row of `/licences`, grouped by state then holder. */
export function LicenceListRow({ row }: { row: LicenceRow }) {
  return (
    <tr data-testid="licence-row" data-state={row.licence.state} data-status={row.status}>
      <th scope="row">
        <a href={`/licences/${row.licence.id}`}>{row.typeName}</a>
        {row.covered ? null : (
          <span className="badge" data-testid="uncovered-badge">
            not derived
          </span>
        )}
      </th>
      <td className="sr-num">{row.licence.licenceNumber ?? '—'}</td>
      <td>
        {row.holderHref ? <a href={row.holderHref}>{row.holderName}</a> : row.holderName}
      </td>
      <td className="sr-num">
        {row.licence.expiresOn ?? 'not derived'}
        <span className="sr-meta"> · {row.expiryWording}</span>
      </td>
      <td className="sr-num">
        {row.ceRequired === null ? '—' : `${row.ceRecorded} / ${row.ceRequired} h`}
      </td>
      <td>
        <StatusChip status={row.status} />
      </td>
    </tr>
  );
}

/** The documents list, with the org-scoped viewer link. */
export function DocumentsPanel({
  licenceId,
  documents,
}: {
  licenceId: string;
  documents: readonly {
    id: string;
    filename: string;
    contentType: string;
    byteSize: number;
    sha256: string;
  }[];
}) {
  return (
    <section className="sr-card" data-testid="documents-panel">
      <h2 className="sr-card__title">Documents</h2>
      {documents.length === 0 ? (
        <p className="muted small">
          Nothing attached yet. A photo of the card is enough — it is what a general contractor asks for.
        </p>
      ) : (
        <ul className="sr-feed" data-testid="document-list">
          {documents.map((document) => (
            <li className="sr-feed__item" key={document.id}>
              <span className="sr-feed__date">{Math.max(1, Math.round(document.byteSize / 1024))} KB</span>
              <span className="sr-feed__state">{document.contentType.split('/')[1]?.toUpperCase()}</span>
              <span className="sr-feed__what">
                <a
                  href={`/licences/${licenceId}/documents/${document.id}`}
                  data-testid="document-link"
                  rel="noreferrer"
                >
                  {document.filename}
                </a>
                {document.contentType.startsWith('image/') ? (
                  <img
                    alt={`Thumbnail of ${document.filename}`}
                    data-testid="document-thumbnail"
                    src={`/licences/${licenceId}/documents/${document.id}`}
                    style={{ display: 'block', maxInlineSize: '10rem', marginBlockStart: '0.5rem' }}
                  />
                ) : null}
                <span className="sr-meta" data-testid="document-sha"> sha256 {document.sha256.slice(0, 12)}…</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
