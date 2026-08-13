/**
 * The worker roster.
 *
 * AUTHORITY: `USER_JOURNEY.md` §5.2 (the SSN moment — the highest-trust moment in
 * the product, and it costs one sentence), §10.2 (a worker with no nine-digit number
 * blocks the California XML and leaves the WH-347 untouched),
 * `ARCHITECTURE.md` §11.3 (the WH-347 renderer cannot read anything but
 * `ssn_last4`; it has no access to the decrypt function and the import boundary
 * enforces it).
 *
 * ===========================================================================
 * THIS SCREEN CANNOT SHOW A FULL SOCIAL SECURITY NUMBER
 *
 * Not "does not": cannot. `workerRoster` selects `ssn_last4` and a boolean for
 * whether ciphertext exists, and there is no field on the row for anything else. The
 * UI is describing a code-level guarantee, which is the only kind of trust copy
 * worth writing.
 */

import Link from 'next/link';

import { readAs, requireSession } from '../../_lib/auth';
import { SSN_SENTENCE } from '../../_lib/copy';
import { workerRoster } from '../../_lib/imports';
import { RefusalView } from '@/app/_components/refusal';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Workers — Ratepin' };

export default async function WorkersPage(): Promise<React.ReactElement> {
  const session = await requireSession('/app/workers');
  const roster = await readAs(session, async (tx) => workerRoster(tx));

  const withoutNine = roster.filter((worker) => !worker.hasEncryptedSsn).length;

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Workers</h1>
        <p className="rp-t-lead">
          Everyone this account has paid on a covered project, and the identifying number the
          federal form is allowed to print.
        </p>
        <p>{SSN_SENTENCE}</p>
      </section>

      {roster.length === 0 ? (
        <div className="rp-empty">
          <p className="rp-empty__title">No workers yet</p>
          <p className="rp-empty__body">
            The roster is built from your payroll uploads. Nobody is typed in by hand.
          </p>
        </div>
      ) : (
        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">Workers and their identifying numbers</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">1E — identifying number</th>
                <th scope="col">Nine digits on file</th>
                <th scope="col" className="rp-th--num">
                  Weeks
                </th>
              </tr>
            </thead>
            <tbody>
              {roster.map((worker) => (
                <tr key={worker.id} data-row={worker.ssnLast4 === null ? 'blocked' : undefined}>
                  <th scope="row">
                    {worker.lastName}, {worker.firstName}
                    {worker.middleInitial === null ? '' : ` ${worker.middleInitial}`}
                  </th>
                  <td className="rp-td--id">
                    {worker.ssnLast4 === null ? 'none — this line blocks' : worker.ssnLast4}
                  </td>
                  <td>{worker.hasEncryptedSsn ? 'yes' : 'no'}</td>
                  <td className="rp-td--num">{worker.weeks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {withoutNine > 0 ? (
        <RefusalView
          refusal={{
            primitive: 'P-S',
            headline: `${String(withoutNine)} worker${withoutNine === 1 ? ' has' : 's have'} no nine-digit number on file`,
            blocked:
              'That affects the California eCPR XML only. Your WH-347 is unaffected — federal law ' +
              'forbids nine digits on it, 29 CFR 5.5(a)(3)(ii)(B), and California’s schema ' +
              'requires them, so the two artifacts disagree about the same field and carry ' +
              'separate statuses.',
            because:
              'Ratepin holds no nine-digit number for those workers. It cannot obtain one: it is ' +
              'the worker’s, and it reaches us only through your payroll export.',
            clearedBy: {
              kind: 'onThisScreen',
              label: 'Map the Social Security column on your next payroll upload',
            },
            clearsItself: null,
            severity: 'narrowed',
          }}
        />
      ) : null}

      <p>
        <Link href="/app">Back to projects</Link>
      </p>
    </div>
  );
}
