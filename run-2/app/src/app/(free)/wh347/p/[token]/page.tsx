/**
 * S03 — `/wh347/p/[token]`, the free preview and download.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1.3 S03, §1.4 (the expired preview), §1.5 (the one
 * line under the footer, and why it is true about the document above it).
 *
 * The token addresses a record in the visitor's own browser. There is no server-side
 * lookup here and no route handler behind it — which is why the page is a static
 * shell around a client component, and why a token from someone else's link resolves
 * to the honest-expiry state rather than to another person's payroll.
 */

import Link from 'next/link';

import { FreePreview } from '../../../_components/preview';

export const metadata = {
  title: 'Your WH-347 draft — Ratepin',
  // Nothing here should ever be indexed: the address is a handle to a document that
  // exists only in one browser.
  robots: { index: false, follow: false },
};

export default async function PreviewPage({
  params,
}: {
  readonly params: Promise<{ readonly token: string }>;
}): Promise<React.ReactElement> {
  const { token } = await params;

  return (
    <div className="rp-stack rp-stack--section">
      <FreePreview token={token} />

      <section className="rp-stack rp-measure">
        <h2>Why this one is a draft</h2>
        <p>
          This is a draft. Ratepin kept nothing from this session and pinned no revision, so the
          signature block is withheld. Pin this determination to a project and the same form comes
          back with the revision kept, a notice when a newer one publishes, and every classification
          you just picked remembered.
        </p>
        <p className="rp-legal">
          The certification on the reverse of the WH-347 is the contractor&rsquo;s under 29 CFR
          5.5(a)(3)(ii)(C). Ratepin computed and formatted this document and certifies nothing about
          it.
        </p>
        <p>
          <Link href="/rates">Look up another county and craft</Link>
        </p>
      </section>
    </div>
  );
}
