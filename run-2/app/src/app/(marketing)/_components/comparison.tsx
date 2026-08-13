/**
 * WHERE YOU SHOULD BUY SOMETHING ELSE.
 *
 * AUTHORITY: `identity/landing/index.html` §"honest comparison" (ported verbatim,
 * including the prices and the date they were read), `CORRECTIONS.md` X-4 (the
 * struck claim about this category's pricing structure — the correction is that
 * competitors' published prices are quoted, not characterised).
 *
 * WHY THIS IS ON THE PAGE AT ALL. Two of these rows send a reader to a cheaper
 * competitor and one sends them to a portal we feed. That is the point: if the
 * situation in the left column is yours, one of them is the better buy, and saying
 * so here costs less than collecting a month and a refund request. It is also the
 * only form of comparison this company is allowed to make — a quoted published
 * price with the date it was read, never a characterisation of someone else's
 * pricing model.
 *
 * THE DATE IS PART OF THE CLAIM. Every price below was read from the vendor's own
 * public pricing page on the date in `READ_ON`, and is quoted rather than
 * paraphrased. A price that has moved since is a stale quotation, which is why the
 * date is rendered in the same sentence rather than in a footnote.
 */

export const READ_ON = '2026-08-13';

interface Row {
  readonly you: string;
  readonly instead: string;
  readonly price: string;
  readonly why: string;
}

const ROWS: readonly Row[] = [
  {
    you: 'One project, and it is your first DBA job',
    instead: 'LCPcertified',
    price: '$12 / report',
    why:
      'Twelve dollars beats any subscription for four filings. Their free tier also covers ' +
      'unlimited reports on a first project.',
  },
  {
    you: 'Ten to twenty-five active projects, and provenance is not why you are buying',
    instead: 'LCPcertified Plus',
    price: '$2,500 / yr, 25 projects',
    why:
      'Below where Ratepin lands at that volume. They also already export California, ' +
      'Washington and Maryland XML.',
  },
  {
    you: 'You want the cheapest per-project meter and can type the rate yourself',
    instead: 'CertifiedPayrollPro',
    price: '$49 / 5 proj · $99 / 25 proj',
    why:
      '$0 setup, 14-day trial, $5/$3/$1 per report. Their $99 buys 25 projects. Nothing about ' +
      'ours is cheaper at that shape.',
  },
  {
    you: 'Your general contractor mandates a portal',
    instead: 'Keep the portal',
    price: '—',
    why:
      'Ratepin produces the file you upload to it. We feed portals; we do not replace them and ' +
      'do not position against them.',
  },
];

export function Comparison(): React.ReactElement {
  return (
    <div className="rp-stack">
      <h3>Where you should buy something else</h3>
      <p className="rp-prose rp-ink-2">
        Prices below were read from each vendor&rsquo;s own public pricing page on{' '}
        <strong>{READ_ON}</strong> and are quoted, not paraphrased. If your situation is in the left
        column, one of them is the better buy and we would rather say so here than collect a month
        and a refund request.
      </p>

      <div className="rp-tablewrap">
        <table className="rp-table">
          <caption className="rp-sr-only">When a competitor is the better purchase.</caption>
          <thead>
            <tr>
              <th scope="col">If this is you</th>
              <th scope="col">Buy this instead</th>
              <th scope="col">Their published price</th>
              <th scope="col">Why</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.instead + row.you}>
                <td>{row.you}</td>
                <td className="rp-td--id">{row.instead}</td>
                <td className="rp-td--id">{row.price}</td>
                <td>{row.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rp-legal">
        Ratepin is priced above the cheap end of this category on purpose. The reason to buy it is
        the rate-of-record wedge — the pinned modification, the diff since award, the classification
        memory and the footer — not the price, and not a time saving we have not measured.
        Competitor names and prices are quoted from their own public pages on the date shown, for
        comparison, and are the property of their owners.
      </p>
    </div>
  );
}
