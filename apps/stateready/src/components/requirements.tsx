/**
 * M4 — the Requirements panel. `specs/04` §Screens and **AC8** (wave-1b N4).
 *
 * > **A field with no board answer is a rendered row, not a missing one.**
 *
 * Every requirement the licence type's board publishes, and **the name of every
 * one it does not** — the same two sets `specs/08` promises for the paid Entry
 * Pack, because a spec that promises more in the app than the paid document
 * does is where the next refund comes from.
 *
 * Three rules the markup makes checkable rather than conventional:
 *
 *  1. a row whose knowledge-base value is unknown renders the field NAME and
 *     the words "the board does not publish this" — never a blank, never a
 *     hidden row, never an estimate;
 *  2. **no such row renders a source chip.** A chip is a claim that a page says
 *     this, and no page does. AC8's content test asserts exactly that, over all
 *     nine committed records;
 *  3. the note recording *what we read looking for it* renders on both kinds of
 *     row, because "we read four TDLR pages and none of them mentions a bond"
 *     is the finding.
 */

import { NotYetVerified, Provenance } from '@/components/provenance';
import { NOT_PUBLISHED, REQUIREMENT_GROUPS, type RequirementRow } from '@/lib/requirements';

export function RequirementsPanel({
  rows,
  boardName,
  boardUrl,
}: {
  rows: readonly RequirementRow[];
  boardName?: string | null;
  boardUrl?: string | null;
}) {
  if (rows.length === 0) return null;
  const published = rows.filter((r) => r.published).length;

  return (
    <section className="sr-card" data-testid="requirements-panel">
      <div className="sr-card__head">
        <h2 className="sr-card__title">Requirements</h2>
        <span className="badge" data-testid="requirements-count">
          {published} of {rows.length} published by the board
        </span>
      </div>
      <p className="sr-meta">
        Everything this board publishes for this licence, and the name of everything it does not. A row
        that says the board does not publish something is a finding, not a gap in our data.
      </p>

      {REQUIREMENT_GROUPS.map((group) => {
        const groupRows = rows.filter((row) => row.group === group);
        if (groupRows.length === 0) return null;
        return (
          <div className="sr-mt-6" key={group}>
            <h3 className="sr-eyebrow">{group}</h3>
            <dl className="sr-dl">
              {groupRows.map((row) => (
                <RequirementItem
                  key={row.field}
                  row={row}
                  boardName={boardName ?? null}
                  boardUrl={boardUrl ?? null}
                />
              ))}
            </dl>
          </div>
        );
      })}
    </section>
  );
}

function RequirementItem({
  row,
  boardName,
  boardUrl,
}: {
  row: RequirementRow;
  boardName: string | null;
  boardUrl: string | null;
}) {
  return (
    <>
      <dt data-testid="requirement-label" data-field={row.field}>
        {row.label}
        {row.disclosed ? (
          <span className="sr-visually-hidden"> — a field we always name, published or not</span>
        ) : null}
      </dt>
      <dd
        data-testid="requirement-row"
        data-field={row.field}
        data-published={row.published ? 'true' : 'false'}
      >
        {row.published ? (
          <>
            <span>{row.display}</span>
            {row.evidence ? <span className="sr-note">“{row.evidence}”</span> : null}
            <Provenance
              url={row.citation?.url ?? null}
              title={row.citation?.title ?? null}
              lastVerified={row.citation?.lastVerified ?? null}
              confidence={row.confidence}
              notes={row.note ? [row.note] : []}
            />
          </>
        ) : (
          <>
            <NotYetVerified
              what={row.label.toLowerCase()}
              why={`${NOT_PUBLISHED}.`}
              boardName={boardName}
              boardUrl={boardUrl}
            />
            {row.note ? <span className="sr-note">{row.note}</span> : null}
          </>
        )}
      </dd>
    </>
  );
}
