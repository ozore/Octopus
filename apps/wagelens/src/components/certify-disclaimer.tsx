/**
 * `<CertifyDisclaimer>` — the last thing a person reads before signing a
 * federal statement (WL-11: "the certify screen, above the button").
 *
 * It says the consequence plainly, once, and it does not summarise the
 * certifications: the WH-347's page 2 carries them in capital letters, and a
 * product that paraphrases them at the moment of signature is a product that
 * has decided its own wording is good enough. It is not — 18 U.S.C. § 1001 and
 * 31 U.S.C. § 3729 are the statutes the form itself names.
 *
 * The three certifications are rendered IN FULL by the caller (WL-06 draws the
 * form); this component carries the consequence, the responsibility and the
 * stale-corpus warning. It shows no rate, so it has no provenance to render —
 * the screen around it does.
 *
 * WHAT IT MAY NEVER SAY (WL-11 V4, and `tests/naming.test.ts` fails the build
 * on any of it): a penalty amount, a claimed rate of success, or any promise
 * that a filing will be accepted.
 */

import Link from 'next/link';

import { productName } from '@/env';

export function CertifyDisclaimer({
  /** Gate G6: the corpus has not been read inside its window. */
  corpusStale = false,
  wdNumber,
  modificationNumber,
}: {
  corpusStale?: boolean;
  wdNumber?: string;
  modificationNumber?: number;
}) {
  const product = productName();
  return (
    <div className="wl-signature__notice" data-testid="certify-disclaimer" role="note">
      <p>
        <strong>
          You are certifying that this payroll is correct and complete, and that everyone was paid
          at least the rate for the classification of work actually performed.
        </strong>{' '}
        The willful falsification of any of these statements may subject the contractor or
        subcontractor to civil or criminal prosecution — <strong>18 U.S.C. § 1001</strong> and{' '}
        <strong>31 U.S.C. § 3729</strong> — as well as debarment from future federal and
        federally-assisted contracts.
      </p>
      <p>
        {product} produced this form from the hours you entered and from{' '}
        {wdNumber ? (
          <>
            wage determination <span className="wl-mono">{wdNumber}</span>
            {modificationNumber === undefined ? null : (
              <>
                {' '}
                modification <span className="wl-mono">{modificationNumber}</span>
              </>
            )}
          </>
        ) : (
          'the wage determination this project is pinned to'
        )}
        . It does not sign this statement and it cannot: the signature and the classifications are
        yours. <Link href="/help/choosing-a-classification">How classification works</Link> ·{' '}
        <Link href="/legal/disclaimer">the full disclaimer</Link>.
      </p>
      {corpusStale ? (
        <p data-testid="certify-stale">
          We last read this determination more than 35 days ago. Verify it against SAM.gov before you
          file.
        </p>
      ) : null}
    </div>
  );
}
