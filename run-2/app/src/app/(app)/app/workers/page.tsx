/**
 * The worker roster — and the one place a Social Security number can be typed in.
 *
 * AUTHORITY: `USER_JOURNEY.md` §5.2 (the SSN moment — the highest-trust moment in
 * the product, and it costs one sentence), §10.2 (a worker with no nine-digit number
 * blocks the California XML and leaves the WH-347 untouched), §10.5 (add the numbers,
 * or exclude those workers with an explicit acknowledgement),
 * `ARCHITECTURE.md` §11.3 (one column, one per-account key, decrypt in-process for
 * the XML only), 29 CFR 5.5(a)(3)(ii)(B) against the CA eCPR XSD's `ssn` = `[0-9]{9}`.
 *
 * ===========================================================================
 * THIS SCREEN CANNOT SHOW A FULL SOCIAL SECURITY NUMBER
 *
 * Not "does not": cannot. `workerRoster` selects `ssn_last4` and a BOOLEAN for
 * whether ciphertext exists, and there is no field on the row for anything else. The
 * decrypt function is not exported from `_lib/ssn.ts` at all, so no component on this
 * page could obtain nine digits even by asking — which is why the input below is
 * always empty and is never pre-filled with what is already stored. The UI is
 * describing a code-level guarantee, which is the only kind of trust copy worth
 * writing.
 *
 * ===========================================================================
 * AND IT ONLY ASKS WHEN THERE IS SOMETHING TO ASK FOR
 *
 * The capture form renders only when this account has a live Californian project.
 * The nine digits exist in this product for exactly one artifact — the DIR eCPR —
 * and federal law forbids them on the one every other customer files. An account
 * with no California work is therefore never shown the field, and is told why in a
 * sentence rather than left to wonder where it went. Not collecting data you have no
 * use for is the cheapest privacy control there is.
 */

import Link from 'next/link';

import { readAs, requireSession } from '../../_lib/auth';
import { SSN_SENTENCE } from '../../_lib/copy';
import { workerRoster } from '../../_lib/imports';
import { hasCaliforniaProject } from '../../_lib/projects';
import { RefusalView } from '@/app/_components/refusal';

import {
  clearWorkerExemptionsAction,
  forgetWorkerSsnAction,
  saveWorkerIdentityAction,
} from './actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Workers — Ratepin' };

export default async function WorkersPage({
  searchParams,
}: {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const session = await requireSession('/app/workers');
  const query = searchParams === undefined ? {} : await searchParams;

  const view = await readAs(session, async (tx) => ({
    roster: await workerRoster(tx),
    california: await hasCaliforniaProject(tx),
  }));
  const { roster, california } = view;

  const refused = typeof query['refused'] === 'string' ? query['refused'] : null;
  const forgotten = typeof query['forgotten'] === 'string';
  const saved = typeof query['saved'] === 'string';

  const withoutNine = roster.filter((worker) => !worker.hasEncryptedSsn).length;
  const withoutExemptions = roster.filter((worker) => worker.withholdingExemptions === null).length;

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

      {refused === null ? null : (
        <RefusalView
          refusal={{
            primitive: 'P-S',
            headline:
              refused === 'ssn'
                ? 'That is not a nine-digit number, so nothing was stored'
                : 'That is not a whole number of exemptions, so nothing was stored',
            blocked:
              refused === 'ssn'
                ? 'No Social Security number was written for that worker. Anything already on file ' +
                  'for them is unchanged, and the WH-347 is unaffected.'
                : 'No exemption count was written for that worker. Anything already on file for ' +
                  'them is unchanged, and the WH-347 is unaffected.',
            because:
              refused === 'ssn'
                ? 'California’s eCPR schema declares ssn as exactly nine digits, and Ratepin does ' +
                  'not pad, truncate or invent one — a filing is signed under penalty of perjury ' +
                  'and a corrected digit is not ours to guess.'
                : 'California’s numWithholdingExemp is a non-negative whole number. Ratepin does ' +
                  'not default it to zero, because zero is an assertion about someone’s tax ' +
                  'situation.',
            clearedBy: {
              kind: 'onThisScreen',
              label: 'Re-enter the value on that worker’s row below and save again.',
            },
            clearsItself: null,
            severity: 'blocked',
          }}
        />
      )}

      {refused === null && (saved || forgotten) ? (
        <div className="rp-alert rp-alert--notice" role="status">
          <span className="rp-alert__glyph" aria-hidden="true">
            ·
          </span>
          <div className="rp-alert__body">
            <p>
              {forgotten
                ? 'That worker’s nine digits are gone. The last four the WH-347 prints are untouched.'
                : 'Saved. The number is encrypted before it reaches the database and this screen cannot read it back.'}
            </p>
          </div>
        </div>
      ) : null}

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
                {california ? <th scope="col">Withholding exemptions</th> : null}
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
                  {california ? (
                    <td className="rp-td--num">
                      {worker.withholdingExemptions === null
                        ? 'not on file'
                        : worker.withholdingExemptions}
                    </td>
                  ) : null}
                  <td className="rp-td--num">{worker.weeks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------------------------------------------------------------
          §10.2 — California only, and the reason is on the page either way.
          --------------------------------------------------------------- */}
      {roster.length === 0 ? null : california ? (
        <section className="rp-stack rp-measure">
          <h2>California eCPR details</h2>
          <p>
            Two values per worker, and they exist for one file only: the DIR eCPR XML. They are
            never printed on a WH-347 — 29 CFR 5.5(a)(3)(ii)(B) forbids the nine digits there, and
            California’s schema requires them, so the same worker in the same week is described
            two different ways by two different governments and Ratepin keeps both answers
            separate.
          </p>
          <dl className="rp-stack rp-stack--tight">
            <div className="rp-row rp-row--between">
              <dt>Social Security number</dt>
              <dd>
                Nine digits. Goes into <code>ssn</code>, and into the <code>id</code> attribute the
                schema requires on the worker’s name element. Encrypted with a key belonging to
                this account before it reaches the database, decrypted in memory while one XML file
                is being written, and never written to a log or held between requests. Destroying
                that key is what makes deletion final, and deleting your account destroys it.
              </dd>
            </div>
            <div className="rp-row rp-row--between">
              <dt>Withholding exemptions</dt>
              <dd>
                A whole number, zero or more. Goes into <code>numWithholdingExemp</code>. It is
                required by California and was removed from the January 2025 WH-347, so it cannot
                be derived from anything on the federal side — and it is never defaulted to zero,
                because zero is an assertion about someone’s tax situation.
              </dd>
            </div>
          </dl>
          <p className="rp-t-micro">
            Ratepin cannot obtain either value. They reach us only from you, and we never file,
            submit or e-sign on your behalf.
          </p>

          <div className="rp-tablewrap">
            <table className="rp-table">
              <caption className="rp-sr-only">
                Enter the California identity values for each worker
              </caption>
              <thead>
                <tr>
                  <th scope="col">Worker</th>
                  <th scope="col">Social Security number</th>
                  <th scope="col">Exemptions</th>
                  <th scope="col">Save</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((worker) => (
                  <tr key={`ca-${worker.id}`}>
                    <th scope="row">
                      {worker.lastName}, {worker.firstName}
                    </th>
                    <td>
                      <form
                        action={saveWorkerIdentityAction}
                        id={`ca-form-${worker.id}`}
                        className="rp-stack rp-stack--tight"
                      >
                        <input type="hidden" name="workerId" value={worker.id} />
                        <label className="rp-sr-only" htmlFor={`ssn-${worker.id}`}>
                          Social Security number for {worker.firstName} {worker.lastName}
                        </label>
                        <input
                          id={`ssn-${worker.id}`}
                          name="ssn"
                          className="rp-input rp-input--num"
                          inputMode="numeric"
                          maxLength={11}
                          autoComplete="off"
                          placeholder={worker.hasEncryptedSsn ? 'on file — type to replace' : '000000000'}
                        />
                      </form>
                    </td>
                    <td>
                      <label className="rp-sr-only" htmlFor={`exempt-${worker.id}`}>
                        Withholding exemptions for {worker.firstName} {worker.lastName}
                      </label>
                      <input
                        id={`exempt-${worker.id}`}
                        form={`ca-form-${worker.id}`}
                        name="withholdingExemptions"
                        className="rp-input rp-input--num"
                        inputMode="numeric"
                        maxLength={2}
                        autoComplete="off"
                        defaultValue={
                          worker.withholdingExemptions === null
                            ? ''
                            : String(worker.withholdingExemptions)
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="submit"
                        form={`ca-form-${worker.id}`}
                        className="rp-btn rp-btn--quiet rp-btn--sm"
                      >
                        Save
                      </button>
                      {worker.hasEncryptedSsn ? (
                        <form action={forgetWorkerSsnAction}>
                          <input type="hidden" name="workerId" value={worker.id} />
                          <button type="submit" className="rp-btn rp-btn--quiet rp-btn--sm">
                            Forget the nine digits
                          </button>
                        </form>
                      ) : null}
                      {worker.withholdingExemptions === null ? null : (
                        <form action={clearWorkerExemptionsAction}>
                          <input type="hidden" name="workerId" value={worker.id} />
                          <button type="submit" className="rp-btn rp-btn--quiet rp-btn--sm">
                            Clear the exemption count
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="rp-stack rp-measure">
          <h2>We are not asking for Social Security numbers</h2>
          <p>
            No project on this account is in California, and the full nine digits exist in Ratepin
            for exactly one artifact — the DIR eCPR XML. On the WH-347 you do file, 29 CFR
            5.5(a)(3)(ii)(B) requires the identifying number above and forbids the full number, so
            there is nothing for us to do with one. Add a Californian project and the fields
            appear here, with the same explanation attached.
          </p>
        </section>
      )}

      {/* ---------------------------------------------------------------
          The two California-only gaps, each naming the action that clears it.
          The WH-347 is unaffected by both, and says so.
          --------------------------------------------------------------- */}
      {california && withoutNine > 0 ? (
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
              'the worker’s, and it reaches us only from you.',
            clearedBy: {
              kind: 'onThisScreen',
              label:
                'Type the number on that worker’s row in the table above and save — or map the ' +
                'Social Security column on your next payroll upload.',
            },
            clearsItself: null,
            severity: 'narrowed',
          }}
        />
      ) : null}

      {california && withoutExemptions > 0 ? (
        <RefusalView
          refusal={{
            primitive: 'P-S',
            headline: `${String(withoutExemptions)} worker${withoutExemptions === 1 ? ' has' : 's have'} no withholding-exemption count on file`,
            blocked:
              'That affects the California eCPR XML only. Your WH-347 is unaffected: the field was ' +
              'removed from the Rev. January 2025 form altogether.',
            because:
              'California’s schema requires numWithholdingExemp for every worker on the file, and ' +
              'because the federal form no longer carries it there is nothing on the WH-347 path ' +
              'it could be derived from. Ratepin will not default it to zero — zero is an ' +
              'assertion about someone’s tax situation, made by you, under penalty of perjury.',
            clearedBy: {
              kind: 'onThisScreen',
              label: 'Enter the count on that worker’s row in the table above and save.',
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
