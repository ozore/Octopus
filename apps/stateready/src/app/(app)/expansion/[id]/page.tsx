import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { ENTRY_PACK_GUARANTEE } from '@/lib/legal/guarantees';
import { beginEntryPackCheckoutAction, revokeShareLinkAction } from '@/lib/packs/actions';
import { entryPackCheckoutRegistered } from '@/lib/packs/checkout-seam';
import { PackDocument } from '@/lib/packs/document';
import { getPlaybook } from '@/lib/packs/service';
import type { EntryPack } from '@/lib/packs/types';
import { track } from '@octopus/platform/events';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * `/expansion/:id` — the pack, and every state it can be in before it is one.
 *
 * `awaiting_payment` is not an error page. The gap count on this row was
 * written before any Checkout session existed (`specs/08` AC5b), so this screen
 * re-states it, states the guarantee, and only then offers the payment button —
 * and if M9 has not registered a Checkout provider yet (`checkout-seam.ts`) it
 * says so plainly rather than taking a card into a path that cannot deliver.
 *
 * `generating` shows the real checkpoint list rather than a spinner
 * (`UX.md` S16c): the buyer can close the page.
 */
export default async function EntryPackPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const env = getEnv();

  const playbook = await getPlaybook(db, org.id, id);
  if (!playbook) notFound();

  const gaps = (playbook.disclosedGaps as string[]) ?? [];
  const checkoutState = typeof query['checkout'] === 'string' ? query['checkout'] : null;

  if (playbook.status === 'ready' && playbook.contentJson) {
    const pack = playbook.contentJson as unknown as EntryPack;
    await track(db, { name: 'playbook_viewed', orgId: org.id, props: { playbookId: playbook.id } });

    return (
      <main className="narrow">
        <p className="sr-eyebrow">
          <Link href="/expansion">Expansion</Link>
        </p>
        <p className="small">
          <a data-testid="pack-pdf" href={`/expansion/${playbook.id}/pdf`}>
            Download the PDF
          </a>
          {playbook.shareToken ? (
            <>
              {' · '}
              <a data-testid="pack-share" href={`/share/${playbook.shareToken}`}>
                Read-only link for someone who has never logged in
              </a>
              {playbook.shareExpiresAt ? (
                <span className="muted"> (expires {playbook.shareExpiresAt.toISOString().slice(0, 10)})</span>
              ) : null}
            </>
          ) : (
            <span className="muted"> · the share link has been revoked</span>
          )}
        </p>
        {playbook.shareToken ? (
          <form action={revokeShareLinkAction}>
            <input name="playbookId" type="hidden" value={playbook.id} />
            <button className="button secondary" type="submit">
              Revoke the share link
            </button>
          </form>
        ) : null}
        <p className="small muted">Re-download is free and forever. This page does not expire.</p>
        <PackDocument pack={pack} />
      </main>
    );
  }

  return (
    <main className="narrow">
      <p className="sr-eyebrow">
        <Link href="/expansion">Expansion</Link>
      </p>
      <h1>
        {playbook.targetState} — {(playbook.trades as string[]).join(', ')}
      </h1>

      {playbook.status === 'awaiting_payment' ? (
        <>
          <section className="notice warn" data-testid="recorded-disclosure">
            <h2>
              {playbook.needsCheckCount} thing{playbook.needsCheckCount === 1 ? '' : 's'} this board does not
              publish
            </h2>
            <p className="small">
              Recorded against this purchase before any payment page existed, so the pack we deliver carries
              the same number:
            </p>
            <ul>
              {gaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          </section>
          <p data-testid="guarantee-entry-pack">{ENTRY_PACK_GUARANTEE}</p>
          <p className="small">
            <Link href="/legal/refunds">The full refund policy.</Link>
          </p>
          {entryPackCheckoutRegistered() ? (
            <form action={beginEntryPackCheckoutAction}>
              <input name="playbookId" type="hidden" value={playbook.id} />
              <button className="button" type="submit">
                Pay {MONEY.format(playbook.priceCents / 100)}
              </button>
            </form>
          ) : (
            <p className="notice" data-testid="checkout-unavailable">
              Entry Pack payment is not switched on in this deployment yet, so we have not asked for a card
              and we have not charged you. Write to{' '}
              <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a> and we will tell you the day it
              is.
            </p>
          )}
          {checkoutState && checkoutState !== 'ok' ? (
            <p className="notice error">
              We could not start that payment ({checkoutState}). Nothing has been charged.
            </p>
          ) : null}
        </>
      ) : null}

      {playbook.status === 'queued' || playbook.status === 'generating' ? (
        <section data-testid="pack-generating">
          <h2>Assembling your pack</h2>
          <p className="small">
            You can close this page. We aim to have it with you inside two minutes and we will email you when
            it is ready.
          </p>
          <ol className="small">
            <li>Classification — which licence the work requires</li>
            <li>Examination, experience and reciprocity</li>
            <li>Bond</li>
            <li>Insurance</li>
            <li>The qualifying individual</li>
            <li>Fees, renewal and continuing education</li>
            <li>The filing sequence</li>
            <li>Sources</li>
          </ol>
        </section>
      ) : null}

      {playbook.status === 'failed' || playbook.status === 'refunded' ? (
        <section className="notice error" data-testid="pack-failed">
          <h2>We did not deliver this one</h2>
          <p>
            Our own check found a value in this pack that we could not trace back to a board&apos;s published
            page, so we stopped rather than sending it. Your payment has been refunded and we are fixing the
            record. Nothing you do is required.
          </p>
        </section>
      ) : null}
    </main>
  );
}
