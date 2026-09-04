/**
 * The State Entry Pack, on screen — the same object the PDF prints.
 *
 * One renderer per medium, **one document object behind both**, which is how
 * `specs/08` AC6 ("the PDF and the web version contain identical values") stops
 * being a comparison and becomes a property: `extractPackValues(pack)` is the
 * value list, and neither renderer can add to it or subtract from it.
 *
 * Everything here wraps in `PaperSurface` (`BUILD.md` §1): **M8's pack and
 * `/share/:token` MUST render on paper whatever the viewer's theme**, because
 * the audience for this document is the COO and the lawyer it gets forwarded
 * to, not the coordinator who bought it.
 *
 * The order on the first page is fixed by `specs/08` and is not a layout
 * preference: the answer, then the gaps, then the guarantee, then the
 * disclaimer. *"A buyer who finds a gap on page nine has been sold something; a
 * buyer who reads it on page one has been told something."*
 */

import { Disclaimer, NotYetVerified, Provenance } from '@/components/provenance';
import { PaperSurface } from '@/components/paper';

import type { EntryPack, PackItem, PackStep } from './types';

function ItemRow({ item }: { item: PackItem }) {
  const refused = item.state === 'not_published' || item.state === 'not_yet_verified';

  return (
    <div className="sr-doc__req" data-testid={`pack-item-${item.id}`} data-item-state={item.state}>
      <p className="sr-kv-line">
        <strong>{item.label}</strong>
        {': '}
        {refused ? (
          <NotYetVerified
            what={item.label.toLowerCase()}
            why={item.whatWeRead ?? undefined}
            boardUrl={item.boardUrl}
            boardName={item.boardName}
          />
        ) : (
          <span data-testid="pack-value">{item.text}</span>
        )}
      </p>
      {item.provenance.evidence ? <p className="small muted">“{item.provenance.evidence}”</p> : null}
      <Provenance
        url={item.provenance.url}
        title={item.provenance.title}
        lastVerified={item.provenance.lastVerified}
        confidence={item.provenance.confidence}
        unverified={item.provenance.status !== 'verified'}
        notes={item.note ? [item.note] : []}
      />
      {item.flagReason ? (
        <p className="sr-note" data-testid="pack-flag">
          Needs checking — {item.flagReason}
        </p>
      ) : null}
      {item.askThis ? (
        <p className="small">
          Ask {item.boardName ?? 'the board'}: <em>{item.askThis}</em>
        </p>
      ) : null}
    </div>
  );
}

function StepBlock({ step, pack }: { step: PackStep; pack: EntryPack }) {
  return (
    <section data-testid={`pack-step-${step.key}`}>
      <h2 data-num={String(step.number)}>{step.title}</h2>
      <p className="small muted">{step.lede}</p>

      {step.key === 'sources' ? (
        <ul className="small">
          {pack.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} rel="noreferrer noopener" target="_blank">
                {source.title ?? source.url}
              </a>{' '}
              <span className="mono muted">
                {source.url} · read {source.fetchedAt.slice(0, 10)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {step.withheld ? (
        <p className="notice" data-testid="pack-withheld">
          The headings and every gap in this section are shown above. The values are in the pack.
        </p>
      ) : null}

      {step.groups.map((group) => (
        <div key={group.heading}>
          <h3>{group.heading}</h3>
          {group.items.map((item) => (
            <ItemRow item={item} key={item.id} />
          ))}
        </div>
      ))}

      {step.groups.length === 0 && step.key !== 'sources' ? (
        <p className="notice warn">
          This board publishes nothing under this heading that we could establish from a public page.
        </p>
      ) : null}
    </section>
  );
}

export function PackDocument({ pack }: { pack: EntryPack }) {
  return (
    <PaperSurface className="sr-doc" testId="entry-pack">
      <p className="sr-eyebrow">State Entry Pack</p>
      <h1>
        {pack.targetStateName} — {pack.trades.join(' and ')}
      </h1>
      <p className="small muted" data-testid="pack-stamp">
        {pack.mode === 'preview'
          ? 'Preview. The first section is complete; the values in every section after it are withheld until purchase. Every gap this board leaves is shown in full, below, before you pay.'
          : `Assembled for ${pack.organisationName ?? 'your organisation'} on ${pack.today}.`}
      </p>

      <section data-testid="pack-answer">
        <h2 data-num="—">The answer, first</h2>
        <p className="sr-lead">{pack.answer.map((segment) => segment.text).join('')}</p>
      </section>

      <section data-testid="pack-gaps">
        <h2 data-num="—">What {pack.targetStateName} does not publish</h2>
        <p className="small">
          {pack.gaps.length === 0
            ? 'Nothing. Every requirement in the disclosed set is published by this board and verified in this pack.'
            : `${pack.gaps.length} of the requirements a buyer expects are not published by this board, or we could not establish them from a public page. They are named here, before anything we do know. We never estimate a fee, an hour count or a processing time.`}
        </p>
        <ul>
          {pack.gaps.map((gap) => (
            <li data-testid={`pack-gap-${gap.id}`} key={gap.id}>
              <strong>
                {gap.scope ? `${gap.scope} — ` : ''}
                {gap.label}
              </strong>
              {': '}
              <NotYetVerified
                what={gap.label.toLowerCase()}
                why={gap.whatWeRead ?? undefined}
                boardUrl={gap.boardUrl}
                boardName={gap.boardName}
              />
              {gap.askThis ? (
                <p className="small">
                  Ask {gap.boardName ?? 'the board'}: <em>{gap.askThis}</em>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {pack.needsHumanCheck.length > 0 ? (
        <section className="notice warn" data-testid="pack-needs-check">
          <h2 data-num="—">{pack.needsHumanCheck.length} values we could not fully verify for you</h2>
          <p className="small">
            Each is printed with the value we read and the reason it is flagged. Confirm them with the board
            before you rely on them.
          </p>
          <ul className="small">
            {pack.needsHumanCheck.map((item) => (
              <li key={item.id}>
                <strong>
                  {item.scope ? `${item.scope} — ` : ''}
                  {item.label}
                </strong>
                : {item.text} — {item.flagReason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section data-testid="pack-guarantee">
        <h2 data-num="—">The Entry Pack Guarantee</h2>
        <p>{pack.guarantee}</p>
        <p className="small">
          <a href="/legal/refunds">The full refund policy.</a>
        </p>
      </section>

      <section data-testid="pack-boards">
        <h2 data-num="—">Who issues what</h2>
        <p className="small muted">
          Writing to the wrong agency is the most expensive mistake in this process, so the board that issues
          each licence is named before anything else.
        </p>
        <ul>
          {pack.boards.map((board) => (
            <li key={`${board.trade}-${board.url}`}>
              <strong>{board.name}</strong> ({board.trade}) — {board.scope}{' '}
              <a href={board.url} rel="noreferrer noopener" target="_blank">
                {board.url}
              </a>
              {board.phone ? <span className="mono muted"> · {board.phone}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      {pack.sections.map((section) => (
        <div data-testid={`pack-section-${section.trade}`} key={section.recordId}>
          <h2 data-num="§">
            {pack.targetStateName} — {section.trade}
          </h2>
          <p className="small muted">
            Two trades are two sections. Nothing below is merged with any other trade’s advice.
          </p>
          {section.steps.map((step) => (
            <StepBlock key={step.key} pack={pack} step={step} />
          ))}
          {section.coverageNotes.length > 0 ? (
            <section>
              <h3>What this record does not cover</h3>
              <ul className="small">
                {section.coverageNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ))}

      <Disclaimer>{pack.disclaimer}</Disclaimer>
    </PaperSurface>
  );
}
