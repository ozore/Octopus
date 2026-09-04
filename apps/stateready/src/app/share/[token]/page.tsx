import { getDb } from '@/lib/db';
import { PackDocument } from '@/lib/packs/document';
import { packByShareToken } from '@/lib/packs/service';
import { track } from '@octopus/platform/events';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'State Entry Pack — StateReady',
  robots: { index: false, follow: false },
};

/**
 * `/share/:token` — read-only, no login, expiring, watermarked.
 *
 * **Their COO and their lawyer open this.** It is deliberately outside the
 * `(app)` group: no shell, no navigation, no sign-in wall, nothing that asks a
 * stranger for anything. It renders on paper whatever their machine prefers,
 * because a forwarded dark screenshot is not a forwardable artefact
 * (`PERSONA.md` §9, `BUILD.md` §1).
 *
 * `playbook_share_opened` is emitted here and it is the most interesting event
 * this product records: it is a second person inside the account reading the
 * document, which is a buying signal from someone who never signed up.
 */
export default async function SharedPackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDb();
  const result = await packByShareToken(db, token, new Date());

  if (result.status === 'expired') {
    return (
      <main className="narrow">
        <h1>This link has expired</h1>
        <p>
          Shared State Entry Pack links last ninety days. Ask the person who sent it to you for a fresh one —
          they can re-share it from their account at no cost.
        </p>
      </main>
    );
  }

  if (result.status === 'not_found') {
    return (
      <main className="narrow">
        <h1>We do not recognise this link</h1>
        <p>
          It may have been revoked. Ask the person who sent it to you for a new one. Nothing on this page
          requires an account.
        </p>
      </main>
    );
  }

  await track(db, {
    name: 'playbook_share_opened',
    props: { state: result.pack.targetState, trades: result.pack.trades },
  });

  return (
    <main className="narrow">
      <p className="small muted" data-testid="share-watermark">
        Shared read-only by {result.organisationName ?? 'a StateReady customer'}. Assembled{' '}
        {result.pack.today}. You do not need an account to read this.
      </p>
      <PackDocument pack={result.pack} />
    </main>
  );
}
