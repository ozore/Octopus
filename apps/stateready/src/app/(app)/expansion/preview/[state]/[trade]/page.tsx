import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDb } from '@/lib/db';
import { entryPackReadiness } from '@/lib/kb/accessors';
import { ENTRY_PACK_GUARANTEE } from '@/lib/legal/guarantees';
import { joinExpansionWaitlistAction, startEntryPackPurchaseAction } from '@/lib/packs/actions';
import { PackDocument } from '@/lib/packs/document';
import { entryPackPriceCents, holdingsFor, previewEntryPack } from '@/lib/packs/service';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * **The purchase screen — and the gap disclosure `specs/08` AC5b puts before
 * the card.**
 *
 * The order on this page is the acceptance criterion, not a layout choice:
 *
 *  1. what this board does **not** publish, counted and named, each with what
 *     we read and what to ask;
 *  2. the guarantee, verbatim;
 *  3. the price;
 *  4. only then, the button.
 *
 * *"A buyer who proceeds has priced that in. A buyer who does not proceed was
 * never going to be a happy customer, and losing that sale is the cheapest
 * refund we will ever take."*
 *
 * The count shown here is `gapDisclosure().needsCheckCount`, which is written
 * to `playbooks.needs_check_count` the moment the button is pressed and is
 * recomputed by the same function when the pack is generated. The three numbers
 * cannot disagree because they are one computation.
 *
 * Below the fold, the preview itself: the first section complete with its
 * source lines, every later section's headings legible and its values withheld
 * (`UX.md` S16a). Gaps are **never** withheld — they are what the buyer is
 * being asked to price in.
 */
export default async function EntryPackPreviewPage({
  params,
}: {
  params: Promise<{ state: string; trade: string }>;
}) {
  const { state, trade } = await params;
  const { org } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const holdings = await holdingsFor(db, org.id);
  const { records, pack, disclosure } = previewEntryPack({
    state,
    trades: [trade],
    today,
    holdings,
    organisationName: org.name,
  });
  if (!pack || !disclosure || records.length === 0) notFound();

  const readiness = records.map((record) => ({ record, ...entryPackReadiness(record, today) }));
  const blocked = readiness.filter((r) => !r.ready);
  const price = await entryPackPriceCents(db, org.id);

  return (
    <main className="narrow">
      <p className="sr-eyebrow">
        <Link href="/expansion">Expansion</Link>
      </p>
      <h1 data-testid="preview-title">
        {pack.targetStateName} — {trade}
      </h1>
      <p className="sr-lead">
        {disclosure.verifiedCount} verified requirements, each with the page it came from and the day we
        checked it.
      </p>

      <section className="notice warn" data-testid="gap-disclosure">
        <h2>
          {disclosure.needsCheckCount} thing{disclosure.needsCheckCount === 1 ? '' : 's'} this board does not
          publish, and we could not establish
        </h2>
        <p className="small">
          You are seeing this <strong>before</strong> the price and before the card, because a buyer who finds
          a gap on page nine has been sold something and a buyer who reads it on page one has been told
          something. We never estimate a fee, an hour count or a processing time.
        </p>
        <ul data-testid="gap-list">
          {disclosure.gaps.map((gap) => (
            <li key={gap.label}>
              <strong>{gap.label}</strong>
              {gap.whatWeRead ? <span className="small"> — what we read: {gap.whatWeRead}</span> : null}
              {gap.askThis ? (
                <p className="small">
                  Ask {gap.boardName ?? 'the board'}: <em>{gap.askThis}</em>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        {disclosure.gaps.length === 0 ? (
          <p>
            Nothing. Every requirement in the disclosed set is published by this board and verified in this
            pack.
          </p>
        ) : null}
      </section>

      <section>
        <h2>The Entry Pack Guarantee</h2>
        <p data-testid="guarantee-entry-pack">{ENTRY_PACK_GUARANTEE}</p>
        <p className="small">
          <Link href="/legal/refunds">The full refund policy.</Link> A disclosed gap is not a contradiction:
          the list above is what we are telling you we do not have.
        </p>
      </section>

      {blocked.length > 0 ? (
        <section className="notice error" data-testid="preview-blocked">
          <h2>Not for sale yet</h2>
          <p>
            This record is verified and is used in the product, but it does not yet carry every requirement a
            paid pack needs, so we are not selling it. Missing:{' '}
            <span className="mono">{blocked.flatMap((b) => b.missingCore).join(', ')}</span>.
          </p>
          <form action={joinExpansionWaitlistAction}>
            <input name="state" type="hidden" value={pack.targetState} />
            <input name="trade" type="hidden" value={trade} />
            <button className="button" type="submit">
              Tell me when it lands
            </button>
          </form>
        </section>
      ) : (
        <section data-testid="preview-buy">
          <h2>{MONEY.format(price / 100)}</h2>
          <p className="small">
            One state, one trade. Delivered as this page, a PDF on paper, and a read-only link you can send to
            someone who has never logged in. Re-download is free and forever.
          </p>
          <p className="small">
            You are among our first buyers. We read every pack after we send it, and if we find a mistake we
            refund you before you find it.
          </p>
          <form action={startEntryPackPurchaseAction}>
            <input name="state" type="hidden" value={pack.targetState} />
            <input name="trade" type="hidden" value={trade} />
            <button className="button" data-testid="preview-continue" type="submit">
              Continue — {MONEY.format(price / 100)}
            </button>
          </form>
        </section>
      )}

      <p className="small">
        <a data-testid="preview-pdf" href={`/expansion/preview/${pack.targetState}/${trade}/pdf`}>
          Download this preview as a PDF
        </a>{' '}
        — it renders on paper, so it is readable by whoever you forward it to.
      </p>

      <h2>The preview</h2>
      <PackDocument pack={pack} />
    </main>
  );
}
