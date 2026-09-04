import Link from 'next/link';

import { QualifierCadence, QualifierReference, QualifierRow } from '@/components/qualifiers';
import { getDb } from '@/lib/db';
import { buildQualifierWatch, qualifierRuleFor } from '@/lib/qualifiers';
import { buildLicenceList } from '@/lib/repos/licence-view';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * M16 — the qualifier watch. `UX.md` S15, `PERSONA.md` J6, `IDENTITY.md` UA3.
 *
 * > *"When our qualifier resigns, I want a clock and a checklist to start
 * > immediately, so a resignation does not become a suspension."*
 *
 * The screen no competitor has, and the only one in the product whose clock
 * starts from an **HR event** rather than from a date printed on a card. One
 * row per licence with a qualifier flag raised; the statutory consequence and
 * its source are on the row, because the consequence is why the clock matters.
 *
 * Three honesty properties, all visible on the page:
 *
 *  - the **75/45/15/5 cadence is labelled as our design judgment**, not a
 *    sourced convention — it is the only cadence in the product that is ours;
 *  - a state whose board publishes no replacement deadline gets **the refusal
 *    and the board's own link**, never a defaulted 30 or 90 days;
 *  - **California, the case that made this screen exist, is quoted and
 *    explicitly excluded** — we hold no Californian rule set, so we do not
 *    start a Californian clock.
 */
export default async function QualifiersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const [clocks, list] = await Promise.all([
    buildQualifierWatch(db, org.id, today),
    buildLicenceList(db, org.id, today),
  ]);

  // What every state in the customer's footprint publishes about replacing a
  // qualifier — whether or not a clock is running. The absence is the finding.
  const seen = new Set<string>();
  const rules = list.rows
    .map((row) => ({ state: row.licence.state, trade: row.licence.trade, stateName: row.stateName }))
    .filter((pair) => {
      const key = `${pair.state}:${pair.trade}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((pair) => ({ ...pair, rule: qualifierRuleFor(pair.state, pair.trade, today) }));

  return (
    <>
      <p className="sr-eyebrow">Qualifier watch</p>
      <h1>When the qualifier leaves, the clock starts here</h1>
      <p className="sr-lead">
        A resignation is an HR event to everyone except the board. Mark the day the qualifying individual
        left and we will hold the replacement deadline the board publishes — and say so plainly where it
        publishes none.
      </p>

      {typeof query['error'] === 'string' ? (
        <p className="notice error">{query['error']}</p>
      ) : null}
      {query['started'] ? <p className="notice">Clock started.</p> : null}
      {query['cleared'] ? <p className="notice">Cleared. The replacement clock has stopped.</p> : null}

      <QualifierCadence />

      <section className="sr-mt-6">
        <h2 className="sr-eyebrow">Clocks running</h2>
        {clocks.length === 0 ? (
          <div className="sr-empty" data-testid="qualifiers-empty">
            <h3>Nobody is flagged</h3>
            <p className="muted">
              Nothing is running. When a qualifying individual leaves, open their licence and record the
              day they went — the clock starts on that screen and lands here.
            </p>
            <Link className="sr-btn sr-btn--secondary" href="/licences">
              Open the licence list
            </Link>
          </div>
        ) : (
          <div className="sr-stack" data-testid="qualifier-rows">
            {clocks.map((clock) => (
              <QualifierRow clock={clock} key={clock.licence.id} />
            ))}
          </div>
        )}
      </section>

      {rules.length > 0 ? (
        <section className="sr-card sr-mt-6" data-testid="qualifier-rules">
          <h2 className="sr-card__title">What each of your states publishes</h2>
          <p className="sr-meta">
            Whether or not anybody has left. A state with no published deadline is a fact worth knowing
            before you need it.
          </p>
          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                  <th scope="col">State</th>
                  <th scope="col">Trade</th>
                  <th scope="col">Replacement deadline</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((row) => (
                  <tr data-testid="qualifier-rule-row" data-state={row.state} key={`${row.state}-${row.trade}`}>
                    <th scope="row">{row.stateName}</th>
                    <td>{row.trade}</td>
                    <td>
                      {row.rule.published && row.rule.window ? (
                        <>
                          <span className="sr-number">
                            {row.rule.window.value} {row.rule.window.unit.replace(/_/g, ' ')}
                          </span>
                          {row.rule.assessment?.citation.url ? (
                            <>
                              {' '}
                              <a
                                href={row.rule.assessment.citation.url}
                                rel="noreferrer noopener"
                                target="_blank"
                              >
                                the board&apos;s page
                              </a>
                            </>
                          ) : null}
                        </>
                      ) : (
                        <span className="muted">not published on any page we have read</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <div className="sr-mt-6">
        <QualifierReference />
      </div>
    </>
  );
}
