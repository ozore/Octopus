import Link from 'next/link';

import { NotYetVerified } from '@/components/provenance';
import { createLicenceAction } from '@/lib/actions';
import { getDb } from '@/lib/db';
import { JURISDICTION_NAMES, TRADES, US_JURISDICTIONS } from '@/lib/kb/accessors';
import { listEntities, listOperatingStates } from '@/lib/repos/company';
import { licenceTypeOptions } from '@/lib/repos/licence-view';
import { listTechnicians } from '@/lib/repos/technicians';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * M4 — `/licences/new`. `specs/04` §Flow, one page.
 *
 *   1 who holds it   2 where   3 what   4 the numbers   5 proof
 *
 * **Step 4's expiry is optional because the engine can derive it**, and showing
 * the customer a date they did not type, correctly, in the first minute is this
 * product's first proof that it is not a spreadsheet.
 *
 * The state and trade are chosen with a GET form that reloads this page with
 * them in the URL. That is deliberate: the licence-type picker is fed by the
 * knowledge base for covered states and is free text for the rest, and doing
 * that server-side means the picker can never offer a type we hold no
 * publishable rule set for, whatever a client sends. It also makes
 * `/licences/new?state=TX&trade=hvac` a link somebody can be sent.
 */
export default async function NewLicencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();

  const one = (key: string): string | null => {
    const value = params[key];
    return typeof value === 'string' && value !== '' ? value : null;
  };
  const state = one('state')?.toUpperCase() ?? null;
  const trade = one('trade');
  const error = one('error');

  const [technicians, entities, operating] = await Promise.all([
    listTechnicians(db, org.id),
    listEntities(db, org.id),
    listOperatingStates(db, org.id),
  ]);

  const chosen = state && trade ? licenceTypeOptions(state, trade) : null;
  const profileStates = [...new Set(operating.map((row) => row.state))].sort();
  const stateOptions = [
    ...profileStates,
    ...US_JURISDICTIONS.filter((code) => !profileStates.includes(code)),
  ];

  return (
    <>
      <p className="sr-eyebrow">Licences</p>
      <h1>Add a licence</h1>
      <p className="sr-lead">
        Give us the type, the state and the day it was issued. Where we hold the state&apos;s rule we work
        out the expiry and show you the sentence we read it in — you do not have to know it.
      </p>

      {error ? (
        <p className="notice error" data-testid="licence-error">
          {error}
        </p>
      ) : null}

      {/* Steps 2 and 3 — where, and in which trade. */}
      <form className="sr-form-grid" data-testid="scope-form" method="get">
        <label className="sr-field" htmlFor="state">
          <span className="sr-field__label">Which state?</span>
          <select className="sr-select" defaultValue={state ?? ''} id="state" name="state" required>
            <option disabled value="">
              Choose a state
            </option>
            {stateOptions.map((code) => (
              <option key={code} value={code}>
                {JURISDICTION_NAMES[code] ?? code}
                {profileStates.includes(code) ? ' — where you work' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="sr-field" htmlFor="trade">
          <span className="sr-field__label">Which trade?</span>
          <select className="sr-select" defaultValue={trade ?? ''} id="trade" name="trade" required>
            <option disabled value="">
              Choose a trade
            </option>
            {TRADES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <p className="sr-row">
          <button className="sr-btn sr-btn--secondary" data-testid="choose-scope" type="submit">
            Continue
          </button>
        </p>
      </form>

      {chosen ? (
        <>
          {chosen.covered ? (
            <p className="notice" data-testid="covered-banner">
              We hold {chosen.stateName}&apos;s {trade} rules. Pick the licence type and we will derive the
              dates from the board&apos;s own page.
            </p>
          ) : (
            <div className="notice warn" data-testid="uncovered-banner">
              <NotYetVerified
                what={`${trade} rules for ${JURISDICTION_NAMES[state ?? ''] ?? state}`}
                why={`We cannot derive deadlines for ${JURISDICTION_NAMES[state ?? ''] ?? state} ${trade} yet, so you will need to enter the expiry date. We will track it and alert on it exactly as we do a derived one.`}
              />
              <p className="small sr-mb-0">
                <Link href="/coverage">See exactly which states and trades we hold.</Link>
              </p>
            </div>
          )}

          <form action={createLicenceAction} className="sr-stack sr-mt-6" data-testid="licence-form">
            <input name="state" type="hidden" value={state ?? ''} />
            <input name="trade" type="hidden" value={trade ?? ''} />

            {/* Step 1 — who holds it. */}
            <fieldset>
              <legend className="sr-eyebrow">Who holds it?</legend>
              <div className="sr-form-grid">
                <label className="sr-field" htmlFor="holderKind">
                  <span className="sr-field__label">Held by</span>
                  <select className="sr-select" defaultValue="technician" id="holderKind" name="holderKind">
                    <option value="technician">A technician</option>
                    <option value="entity">The company or one of its entities</option>
                  </select>
                </label>
                <label className="sr-field" htmlFor="technicianId">
                  <span className="sr-field__label">Technician</span>
                  <select className="sr-select" id="technicianId" name="technicianId">
                    <option value="">—</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.firstName} {technician.lastName}
                      </option>
                    ))}
                  </select>
                  <span className="sr-field__hint">
                    Nobody on the roster yet? <Link href="/roster/import">Import it first.</Link>
                  </span>
                </label>
                <label className="sr-field" htmlFor="entityId">
                  <span className="sr-field__label">Entity</span>
                  <select className="sr-select" id="entityId" name="entityId">
                    <option value="">—</option>
                    {entities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </fieldset>

            {/* Step 3 — what. */}
            <fieldset>
              <legend className="sr-eyebrow">What kind of licence?</legend>
              {chosen.covered ? (
                <label className="sr-field" htmlFor="kbLicenceTypeId">
                  <span className="sr-field__label">Licence type</span>
                  <select className="sr-select" id="kbLicenceTypeId" name="kbLicenceTypeId" required>
                    <option value="">Choose the type on the card</option>
                    {chosen.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <span className="sr-field__hint">
                    Not on the list? Leave it blank and type the name below — we will track the dates you
                    enter and say plainly that we did not derive them.
                  </span>
                </label>
              ) : null}
              <label className="sr-field" htmlFor="customTypeName">
                <span className="sr-field__label">
                  {chosen.covered ? 'Or type it in your own words' : 'What is it called?'}
                </span>
                <input
                  className="sr-input"
                  id="customTypeName"
                  name="customTypeName"
                  placeholder="Master Plumber"
                  type="text"
                />
              </label>
            </fieldset>

            {/* Step 4 — the numbers. */}
            <fieldset>
              <legend className="sr-eyebrow">The numbers</legend>
              <div className="sr-form-grid">
                <label className="sr-field" htmlFor="licenceNumber">
                  <span className="sr-field__label">Licence number</span>
                  <input
                    className="sr-input"
                    id="licenceNumber"
                    maxLength={64}
                    name="licenceNumber"
                    placeholder="TACLA00123C"
                    type="text"
                  />
                  <span className="sr-field__hint">
                    Stored exactly as you type it. We never reformat a licence number — it would corrupt it.
                  </span>
                </label>
                <label className="sr-field" htmlFor="issuedOn">
                  <span className="sr-field__label">Issued on</span>
                  <input className="sr-input" id="issuedOn" name="issuedOn" type="date" />
                  <span className="sr-field__hint">
                    {chosen.covered
                      ? 'This is all we need where the state publishes a rule.'
                      : 'Useful for your own records.'}
                  </span>
                </label>
                <label className="sr-field" htmlFor="expiresOn">
                  <span className="sr-field__label">
                    Expires on {chosen.covered ? <em>(optional)</em> : null}
                  </span>
                  <input className="sr-input" id="expiresOn" name="expiresOn" type="date" />
                  <span className="sr-field__hint">
                    {chosen.covered
                      ? 'Leave it blank and we will work it out. If you fill it in and the rule disagrees, we keep yours and show you both.'
                      : 'We need this one — we hold no rule for this state and we will not invent a date.'}
                  </span>
                </label>
              </div>
              <label className="sr-field" htmlFor="notes">
                <span className="sr-field__label">Notes</span>
                <textarea className="sr-textarea" id="notes" name="notes" rows={2} />
              </label>
            </fieldset>

            {/* Step 5 — proof. Uploaded on the licence page once it exists, so a
                failed upload never loses the licence (`specs/04` §Errors). */}
            <p className="sr-meta">
              You can attach a photo of the card on the next screen. Saving the licence never depends on the
              upload working.
            </p>

            <p className="sr-row">
              <button className="sr-btn sr-btn--primary" data-testid="save-licence" type="submit">
                Save licence
              </button>
              <Link className="sr-btn sr-btn--ghost" href="/licences">
                Cancel
              </Link>
            </p>
          </form>
        </>
      ) : null}
    </>
  );
}
