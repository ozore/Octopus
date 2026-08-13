/**
 * S01 — `/wh347`, the free WH-347 generator's entry screen.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1.1, §1.3 ("*This is a form, not a funnel.*" —
 * heuristics #8 and #2; "The word 'trial' does not appear"), §1.5, `ARCHITECTURE.md`
 * §3.1, §3.8.
 *
 * There is no signup wall on this route, no email capture before the value, and no
 * card. There is also no support affordance, no chat and no contact form, and that
 * absence is not an omission — A3 forbids an escalation path anywhere in the
 * compliance flow, and this is the surface an unlimited number of strangers reach.
 *
 * The corpus notice renders above the generator so the L1/L2 narrowing is visible
 * before anybody types twenty-six workers, rather than after they press Generate.
 */

import Link from 'next/link';

import { getDb } from '@/db';

import { CorpusNotice, SnapshotLine } from '../_components/corpus-notice';
import { FreeGenerator } from '../_components/generator';
import { corpusState } from '../_data/mirror';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Free WH-347 generator — Ratepin',
  description:
    'Turn a payroll week into a WH-347, with every rate traced to a named wage determination, its ' +
    'revision and its publication date. No account, no email, unlimited.',
};

export default async function Wh347Page({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const wd = typeof params['wd'] === 'string' ? params['wd'] : null;

  const db = await getDb();
  const corpus = await corpusState(db, new Date());

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>WH-347 generator</h1>
        <p className="rp-t-lead">
          Type a crew or drop a payroll CSV, name the wage determination, and get the federal form
          with the arithmetic done and the geometry right. No account, no email address, no card, no
          limit on how many you generate.
        </p>
        <p>
          Every form this page produces comes out marked <strong>DRAFT — NOT CERTIFIABLE</strong>{' '}
          with the signature block structurally withheld, and it is worth saying plainly why. A
          certified payroll asserts a <em>revision of record</em> — a specific revision of a specific
          determination, held and watched from the day of the award. This page pins nothing, keeps
          nothing and watches nothing after you close the tab, so it cannot make that assertion, and
          a form that carried a signature block would be making it on your behalf.
        </p>
        <p>
          What you do get is complete: the same renderer, the same column geometry, the same
          arithmetic and the same provenance footer as every other tier. The certification on the
          reverse of the WH-347 was always yours to sign under 29 CFR 5.5(a)(3)(ii)(C); ours was
          never on the document.
        </p>
      </section>

      <CorpusNotice corpus={corpus} />

      <FreeGenerator initialWdNumber={wd} />

      <section className="rp-stack rp-measure">
        <h2>What this page does not do</h2>
        <ul className="rp-stack rp-stack--tight">
          <li>
            It does not keep your payroll. The crew you type is sent to the server once, computed,
            rendered and dropped; there is no table it could have been written to.
          </li>
          <li>
            It does not decide which determination revision applies to your contract. FAR 22.404-6
            governs that and the answer can turn on a contracting-officer finding we cannot observe.
          </li>
          <li>
            It does not evaluate whether a fringe credit is bona fide or annualized, whether a
            deduction is permissible, or whether a classification is correct.
          </li>
          <li>
            It does not build a form from rates typed by hand. Every figure it prints is a row of a
            determination it can name, with the revision and publication date on the paper.
          </li>
        </ul>
        <p>
          <Link href="/rates">Look up a county and craft first</Link>
        </p>
      </section>

      <SnapshotLine corpus={corpus} />
    </div>
  );
}
