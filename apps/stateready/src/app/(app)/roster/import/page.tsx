import { runImportAction } from '@/lib/actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const TEMPLATE = `technician_name,trade,state,credential_type,license_number,issued_date,expiry_date
Dave Alvarez,electrical,TX,Master Electrician,MEL-118234,03/14/2026,
"Ruiz, Jr.",hvac,TX,Air Conditioning and Refrigeration Contractor — Class A,TACLA00123C,03/14/2026,
Mary O'Connell,plumbing,NC,Plumbing Contractor,P-1-24011,03/14/2026,`;

/**
 * M3 — the import wizard. `specs/03`, `UX.md` S07.
 *
 * **The date format is asked, not guessed**, and the radio is here even though
 * it costs a click. `UX.md` §10 gap 4 is right that silent date misparsing is
 * the highest-consequence bug this product can ship: `03/09/2026` is 3
 * September or 9 March depending on who typed it, and getting it wrong moves a
 * deadline by six months in a product whose entire job is that date.
 *
 * Sub-wave A ships the paste path and the confirmed-format radio. The five-step
 * wizard with column mapping, the preview table and the queued job for files
 * over 200 rows are the M3 agent's, and `previewImport()` — which computes
 * exactly what they need — is already written and tested
 * (`src/lib/repos/technicians.ts`).
 */
export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  await requireOrg();

  return (
    <>
      <p className="sr-eyebrow">Roster</p>
      <h1>Import from a spreadsheet</h1>
      <p className="sr-lead">
        Paste the block straight out of the sheet you already keep. We read a real CSV — commas inside
        names, quotes, accents and &ldquo;Jr.&rdquo; all survive.
      </p>

      {params['error'] === 'empty' ? <p className="notice error">There was nothing to import.</p> : null}

      <form className="stack" action={runImportAction}>
        <label htmlFor="filename">What is this file?</label>
        <input id="filename" name="filename" defaultValue="roster.csv" />

        <label htmlFor="csv">Paste your rows</label>
        <textarea
          id="csv"
          name="csv"
          rows={12}
          placeholder={TEMPLATE}
          style={{ maxInlineSize: 'none', fontFamily: 'var(--sr-font-mono)', fontSize: 'var(--sr-text-sm)' }}
        />
        <p className="small muted">
          The shape we expect is above, greyed out — it is the shape you already have. Headers are matched
          case- and punctuation-insensitively, so <code>Exp</code>, <code>Expires</code> and{' '}
          <code>Expiration Date</code> all land in the same column.
        </p>

        <fieldset style={{ border: '1px solid var(--sr-line)', borderRadius: 'var(--sr-radius-sm)', padding: 'var(--sr-space-4)' }}>
          <legend className="sr-eyebrow">Which way round are your dates?</legend>
          <p className="small muted">
            We will not guess this. <span className="sr-number">03/09/2026</span> is 3 September in one
            convention and 9 March in the other, and a deadline six months out is worse than no deadline.
          </p>
          <label htmlFor="mdy" className="small" style={{ display: 'flex', gap: 8 }}>
            <input id="mdy" type="radio" name="dateFormat" value="mdy" defaultChecked style={{ inlineSize: 'auto', minBlockSize: 0 }} />
            <span>
              <strong>MM/DD/YYYY</strong> — US convention. <span className="sr-number">03/09/2026</span> is 9
              March 2026.
            </span>
          </label>
          <label htmlFor="dmy" className="small" style={{ display: 'flex', gap: 8 }}>
            <input id="dmy" type="radio" name="dateFormat" value="dmy" style={{ inlineSize: 'auto', minBlockSize: 0 }} />
            <span>
              <strong>DD/MM/YYYY</strong> — <span className="sr-number">03/09/2026</span> is 3 September 2026.
            </span>
          </label>
        </fieldset>

        <button className="button" type="submit" data-testid="run-import">
          Import these rows
        </button>
      </form>

      <p className="small muted" style={{ marginTop: 'var(--sr-space-5)' }}>
        Rows we cannot read are not silently dropped: they come back in a downloadable list with the reason,
        and the rows we could read are imported anyway.
      </p>
    </>
  );
}
