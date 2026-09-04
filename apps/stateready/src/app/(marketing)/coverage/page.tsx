import Link from 'next/link';

import { Disclaimer, NotYetVerified } from '@/components/provenance';
import { coverageTable, LAUNCH_STATES, TRADES } from '@/lib/kb/accessors';
import { KB_LAUNCH_STATES } from '@/lib/kb/records';
import { validateKnowledgeBase } from '@/lib/kb/validate';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Coverage — StateReady',
  description:
    'Exactly what StateReady holds, state by state and trade by trade: how many values are verified, ' +
    'how many we could not establish, and the day each was last checked.',
};

/**
 * `/coverage` — public, generated from the current snapshot's records.
 *
 * **This page is the most credible thing we can put on the internet, and it is
 * a sales asset** (`specs/12`, `KNOWLEDGE_BASE.md` §14 Q4). No competitor
 * publishes one; the same information is derivable from the free demo in thirty
 * seconds; and a compliance buyer checks coverage before they sign up.
 *
 * A record that is publishable but not `entryPackReady` shows as **in
 * preparation**, never as covered — the two are different questions and
 * conflating them is what let a document with four unknown sections be
 * advertised as complete (`specs/08`, `specs/14` invariant 6).
 */
export default function CoveragePage() {
  const today = new Date().toISOString().slice(0, 10);
  const rows = coverageTable(today).filter((row) => row.covered);
  const validation = validateKnowledgeBase(today);
  const states = [...new Set(rows.map((r) => r.state))].sort();

  const oldest = rows
    .map((r) => r.oldestLastVerified)
    .filter((d): d is string => Boolean(d))
    .sort()[0];

  return (
    <main className="narrow">
      <p className="sr-eyebrow">Coverage</p>
      <h1>What we hold, and what we do not</h1>
      <p className="sr-lead">
        StateReady derives renewal and continuing-education deadlines for{' '}
        <strong>{rows.length}</strong> state × trade combinations across <strong>{states.length}</strong>{' '}
        states. Every other combination is listed below as not yet covered, because a coverage claim we
        cannot back is the one lie a compliance product does not survive.
      </p>

      <table data-testid="coverage-table">
        <thead>
          <tr>
            <th>State</th>
            <th>Trade</th>
            <th>Licence types</th>
            <th>Verified values</th>
            <th>Not established</th>
            <th>Last checked</th>
            <th>Entry Pack</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.state}-${row.trade}`} data-testid={`coverage-row-${row.state}-${row.trade}`}>
              <th scope="row">
                {row.state} <span className="muted small">{row.stateName}</span>
              </th>
              <td>{row.trade}</td>
              <td className="sr-num">{row.licenceTypeCount}</td>
              <td className="sr-num">{row.verifiedValues}</td>
              <td className="sr-num">{row.unknownValues}</td>
              <td className="sr-num">{row.oldestLastVerified ?? '—'}</td>
              <td>{row.entryPackReady ? 'ready' : 'in preparation'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>What the numbers mean</h2>
      <ul>
        <li>
          <strong>Verified</strong> — two independent passes found the value on the board&apos;s own page,
          and the quoted fragment was still there on the date shown.
        </li>
        <li>
          <strong>Not established</strong> — the board does not publish it on any page we have read. We show{' '}
          <NotYetVerified what="that value" why="We read the board's pages and it is not on them." /> rather
          than a number. We never estimate a fee, an hour count or a processing time.
        </li>
        <li>
          <strong>In preparation</strong> — the record is verified but does not yet carry every requirement a
          paid State Entry Pack needs, so it is not for sale.
        </li>
        <li>
          A value we have not re-checked in 180 days stops being shown as verified and we link the
          board&apos;s page instead.
        </li>
      </ul>

      <h2>Not yet covered</h2>
      <p className="small">
        The launch scope is HVAC, plumbing and electrical across the fifteen states with the most building
        equipment contractors ({KB_LAUNCH_STATES.launch_share_pct}% of{' '}
        {KB_LAUNCH_STATES.us_total_establishments.toLocaleString('en-US')} US establishments, from{' '}
        <a href={KB_LAUNCH_STATES.source_url} rel="noreferrer noopener" target="_blank">
          BLS QCEW {KB_LAUNCH_STATES.source_year}
        </a>
        ). Of those, the states below are on the roadmap and are not covered today:
      </p>
      <p className="small mono" data-testid="not-covered">
        {LAUNCH_STATES.filter((state) => !states.includes(state)).join(' · ')}
      </p>

      <h2>How current this page is</h2>
      <p className="small">
        Generated from the committed knowledge base at build time. Oldest verification date on this page:{' '}
        <span className="sr-number">{oldest ?? '—'}</span>. The knowledge base passes its own schema and{' '}
        {validation.records.length * 13} gate checks with {validation.failures} failures
        {validation.warnings > 0 ? ` and ${validation.warnings} recorded warnings` : ''}.{' '}
        <Link href="/help">How we build and check it.</Link>
      </p>

      <Disclaimer />
    </main>
  );
}
