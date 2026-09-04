import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { StandingDisclaimer } from '@/components/disclaimer';
import {
  ClassificationTable,
  ConversionLine,
  DeterminationHeader,
  ModificationControl,
} from '@/components/determination';
import { formatDay } from '@/components/provenance';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import {
  corpusHealth,
  ensureHistoryQueued,
  getDetermination,
  getModificationHistory,
  normaliseWdNumber,
  publicDeterminationUrl,
  searchClassifications,
} from '@/lib/kb';
import { clientIp, consumeLookupBudget, ipHash } from '@/lib/public-request';

export const dynamic = 'force-dynamic';

/**
 * `/wd/:wdNumber` and `/wd/:wdNumber/:mod` — one catch-all route, because they
 * are the same page at two addresses and splitting them would be two copies of
 * the rule that matters:
 *
 * **A superseded modification renders in full, under its own heading, with its
 * own rates, and with a permanent line naming the newer one.** It is never
 * redirected to the active modification and never presented as current. 29 CFR
 * 1.6 fixes the applicable determination at solicitation or award, so the
 * modification a contract incorporated is the one that governs — and refusing
 * to show it would force a contractor to file at a rate their contract does not
 * carry, which is the exact harm this product is sold against.
 *
 * `not_found` (a typo — refuse) and `superseded` (a contract — render) are
 * different answers, and this file keeps them different.
 */
export default async function DeterminationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ref } = await params;
  const query = await searchParams;
  const search = typeof query['q'] === 'string' ? query['q'] : undefined;

  const raw = ref[0];
  if (!raw) notFound();
  const requestedModification = ref[1] !== undefined ? Number(ref[1]) : undefined;
  if (ref.length > 2 || (ref[1] !== undefined && !Number.isInteger(requestedModification))) notFound();

  const db = await getDb();
  const hash = ipHash(clientIp(await headers()));
  const budget = await consumeLookupBudget(db, hash);
  if (!budget.allowed) {
    await emitEvent(db, 'public_lookup_rate_limited', { props: { ip_hash: hash } });
    return (
      <section className="wl-panel" data-testid="rate-limited">
        <div className="wl-panel__body">
          <h1>Too many lookups from this connection</h1>
          <p>
            Try again shortly, or read it at the source:{' '}
            <a href="https://sam.gov/search/?index=dbra" target="_blank" rel="noreferrer noopener">
              SAM.gov →
            </a>
          </p>
        </div>
      </section>
    );
  }

  const resolved = await getDetermination(db, raw, requestedModification);

  if (resolved.resolution === 'not_found') {
    await emitEvent(db, 'public_lookup_not_found', {
      props: { wd_number: resolved.wdNumber, modification_number: requestedModification ?? null },
    });
    return (
      <section className="wl-panel" data-testid="wd-not-found">
        <div className="wl-panel__body wl-stack">
          <h1>We do not hold {resolved.wdNumber}</h1>
          {resolved.knownModifications.length > 0 ? (
            <p>
              That determination exists, but modification {requestedModification} does not. The
              modifications on record are{' '}
              {resolved.knownModifications.map((m) => `mod ${m}`).join(', ')}.
            </p>
          ) : (
            <p>
              No determination with that number is in our corpus. Check the number against your
              contract — a determination number looks like{' '}
              <span className="wl-mono">TX20260253</span> — or search the source directly.
            </p>
          )}
          <p>
            <a
              className="wl-source"
              href="https://sam.gov/search/?index=dbra"
              target="_blank"
              rel="noreferrer noopener"
            >
              ⧉ Search SAM.gov
            </a>
          </p>
        </div>
      </section>
    );
  }

  if (resolved.resolution === 'fetching') {
    // The revision is real — `/history` knows it — and its text is what we
    // lack. The fetch is enqueued; the page says so and resolves. It never
    // shows the active modification's rates under an older modification's
    // heading (WL-00, Errors).
    await emitEvent(db, 'public_revision_fetch_enqueued', {
      props: { wd_number: resolved.wdNumber, modification_number: resolved.modificationNumber },
    });
    const modifications = await getModificationHistory(db, resolved.wdNumber);
    return (
      <section className="wl-panel" data-testid="wd-fetching">
        <div className="wl-panel__body wl-stack">
          <h1 className="wl-mono">{resolved.wdNumber}</h1>
          <p className="wl-strong">
            Reading modification {resolved.modificationNumber} from SAM.gov…
          </p>
          <p>
            We hold the modification history for this determination but not the text of that
            revision yet. Refresh in a moment. We will not show you another modification&rsquo;s
            rates under this heading.
          </p>
          <p>
            <a
              className="wl-source"
              href={publicDeterminationUrl(resolved.wdNumber, resolved.modificationNumber)}
              target="_blank"
              rel="noreferrer noopener"
            >
              ⧉ Read modification {resolved.modificationNumber} on SAM.gov
            </a>
          </p>
          <ModificationControl
            wdNumber={resolved.wdNumber}
            current={resolved.modificationNumber}
            modifications={modifications}
          />
        </div>
      </section>
    );
  }

  const determination = resolved.determination;

  // Canonicalise the alias forms: a contract may print TX260253 or TX0253, and
  // the page it lands on should say the number the corpus uses (V8).
  const canonicalPath =
    requestedModification === undefined
      ? `/wd/${determination.wdNumber}`
      : `/wd/${determination.wdNumber}/${determination.modificationNumber}`;
  const requestedPath =
    requestedModification === undefined
      ? `/wd/${normaliseWdNumber(raw)}`
      : `/wd/${normaliseWdNumber(raw)}/${requestedModification}`;
  if (requestedPath !== canonicalPath) redirect(canonicalPath);

  await ensureHistoryQueued(db, determination.wdNumber);
  const [{ rows, total }, modifications, health] = await Promise.all([
    searchClassifications(db, determination.wdId, { ...(search ? { query: search } : {}) }),
    getModificationHistory(db, determination.wdNumber),
    corpusHealth(db),
  ]);

  const provenance = {
    wdNumber: determination.wdNumber,
    modificationNumber: determination.modificationNumber,
    publicationDate: determination.publicationDate,
    lastVerified: determination.lastVerified,
    publicUrl: determination.publicUrl,
    stale: health.stale,
    newerModification:
      resolved.resolution === 'superseded'
        ? {
            modificationNumber: resolved.activeModification,
            publicationDate: resolved.activePublicationDate,
          }
        : null,
  };

  if (requestedModification !== undefined) {
    await emitEvent(db, 'modification_pin_used', {
      props: {
        wd_ref: determination.wdNumber,
        from_mod: resolved.resolution === 'superseded' ? resolved.activeModification : determination.modificationNumber,
        to_mod: determination.modificationNumber,
      },
    });
  }
  await emitEvent(db, 'determination_card_viewed', {
    props: { wd_number: determination.wdNumber, modification_number: determination.modificationNumber },
  });

  return (
    <>
      {resolved.resolution === 'superseded' ? (
        <div className="wl-alert wl-alert--warn" role="note" data-testid="superseded-banner">
          <div>
            <p className="wl-alert__title">
              You are reading modification {determination.modificationNumber}, which has been
              superseded.
            </p>
            <p className="wl-alert__body">
              A newer modification ({resolved.activeModification}) was published on{' '}
              {formatDay(resolved.activePublicationDate)}.{' '}
              <Link href={`/wd/${determination.wdNumber}/${resolved.activeModification}`}>
                Read modification {resolved.activeModification}
              </Link>
              . If your contract names modification {determination.modificationNumber}, this page is
              the one that governs your job — we will not move it for you.
            </p>
          </div>
        </div>
      ) : null}

      <DeterminationHeader determination={determination} provenance={provenance} />
      <ModificationControl
        wdNumber={determination.wdNumber}
        current={determination.modificationNumber}
        modifications={modifications}
      />
      <ClassificationTable
        rows={rows}
        total={total}
        provenance={provenance}
        {...(search ? { query: search } : {})}
      />
      <ConversionLine wdNumber={determination.wdNumber} />
      <StandingDisclaimer />
    </>
  );
}
