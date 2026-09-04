import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { StandingDisclaimer } from '@/components/disclaimer';
import {
  CandidateList,
  ClassificationTable,
  ConversionLine,
  CorpusUnavailable,
  DeterminationHeader,
  ModificationControl,
} from '@/components/determination';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import {
  CONSTRUCTION_TYPES,
  ensureHistoryQueued,
  findCountyBySlug,
  findDeterminations,
  getModificationHistory,
  searchClassifications,
  corpusHealth,
} from '@/lib/kb';
import { clientIp, consumeLookupBudget, ipHash } from '@/lib/public-request';

export const dynamic = 'force-dynamic';

/**
 * `/lookup/:state/:county/:type` — the server-rendered, indexable result page.
 *
 * Three outcomes and no fourth (WL-00):
 *   1 determination  → the whole classification table, rendered here
 *   n determinations → the candidate list, NOTHING preselected (F3 in public)
 *   0                → what that actually means, which is a useful fact
 *
 * **The public surface is never more confident than the product** (V4). There
 * is no "most likely" heuristic in this file, and there must never be one.
 */
export default async function LookupResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string; county: string; type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { state, county, type } = await params;
  const query = await searchParams;
  const search = typeof query['q'] === 'string' ? query['q'] : undefined;

  const db = await getDb();
  const started = Date.now();

  // --- Abuse control. Over the limit is a plain 429 page with the SAM.gov
  // link and NO signup prompt (V5): the page's argument is that the rate is
  // free, and a wall at the moment of friction would falsify it.
  const hash = ipHash(clientIp(await headers()));
  const budget = await consumeLookupBudget(db, hash);
  if (!budget.allowed) {
    await emitEvent(db, 'public_lookup_rate_limited', { props: { ip_hash: hash } });
    return (
      <section className="wl-panel" data-testid="rate-limited">
        <div className="wl-panel__body wl-stack">
          <h1>Too many lookups from this connection</h1>
          <p>
            Try again in about {Math.ceil(budget.retryAfterSeconds / 60)} minutes. In the meantime the
            determinations are public and searchable at the source:{' '}
            <a href="https://sam.gov/search/?index=dbra" target="_blank" rel="noreferrer noopener">
              SAM.gov →
            </a>
          </p>
        </div>
      </section>
    );
  }

  const health = await corpusHealth(db);
  if (health.activeDeterminations === 0) {
    await emitEvent(db, 'public_lookup_corpus_unavailable');
    return <CorpusUnavailable reason="Our copy of the corpus is empty or still loading." />;
  }

  const countyRow = await findCountyBySlug(db, state, county);
  if (!countyRow) {
    await emitEvent(db, 'public_lookup_not_found', {
      props: { state_code: state.toUpperCase(), county_slug: county },
    });
    notFound();
  }

  const constructionType =
    type === 'all'
      ? undefined
      : CONSTRUCTION_TYPES.find((t) => t.toLowerCase() === type.toLowerCase());

  const { candidates, ambiguous } = await findDeterminations(db, {
    stateCode: state,
    samCountyCode: countyRow.samCountyCode,
    ...(constructionType ? { constructionType } : {}),
  });

  await emitEvent(db, 'lookup_performed', {
    props: {
      state_code: state.toUpperCase(),
      county_name: countyRow.countyName,
      construction_type: constructionType ?? 'all',
      result_count: candidates.length,
      latency_ms: Date.now() - started,
      source: 'result_page',
      ip_hash: hash,
    },
  });

  const heading = `${countyRow.countyName} County, ${state.toUpperCase()}${
    constructionType ? ` · ${constructionType}` : ''
  }`;

  if (candidates.length === 0) {
    await emitEvent(db, 'lookup_zero_results', {
      props: {
        state_code: state.toUpperCase(),
        county_name: countyRow.countyName,
        construction_type: constructionType ?? 'all',
      },
    });
    return (
      <>
        <h1>{heading}</h1>
        <section className="wl-panel" data-testid="zero-results">
          <div className="wl-panel__body wl-stack">
            <p className="wl-strong">
              No active determination in our corpus lists {countyRow.countyName} County for{' '}
              {constructionType ?? 'any construction type'}.
            </p>
            <p>That is a real and useful fact, and there are three things it usually means:</p>
            <ol className="wl-prose">
              <li>
                <strong>The construction type is wrong.</strong> Building versus Heavy is the most
                common mistake, and it produces a plausible-looking, entirely wrong payroll.{' '}
                <Link href={`/lookup/${state}/${county}/all`}>See all four types for this county</Link>.
              </li>
              <li>
                <strong>Ask the contracting officer or the prime for the determination number.</strong>{' '}
                It is in your contract, incorporated by the agency — it is not something we choose.
              </li>
              <li>
                <strong>Look it up by number instead.</strong> If you have the number, open{' '}
                <Link href="/lookup">the lookup</Link> and search SAM.gov directly.
              </li>
            </ol>
          </div>
        </section>
        <StandingDisclaimer />
      </>
    );
  }

  if (ambiguous) {
    await emitEvent(db, 'lookup_ambiguous', { props: { candidate_count: candidates.length } });
    return (
      <>
        <h1>{heading}</h1>
        <CandidateList
          candidates={candidates}
          countyName={`${countyRow.countyName} County`}
          {...(constructionType ? { constructionType } : {})}
        />
        <StandingDisclaimer />
      </>
    );
  }

  const determination = candidates[0];
  if (!determination) notFound();

  // History is cheap and is fetched EAGERLY for any WD number anyone touches,
  // so the modification control can always be drawn (WL-13, way 2).
  await ensureHistoryQueued(db, determination.wdNumber);
  const [{ rows, total }, modifications] = await Promise.all([
    searchClassifications(db, determination.wdId, { ...(search ? { query: search } : {}) }),
    getModificationHistory(db, determination.wdNumber),
  ]);

  const provenance = {
    wdNumber: determination.wdNumber,
    modificationNumber: determination.modificationNumber,
    publicationDate: determination.publicationDate,
    lastVerified: determination.lastVerified,
    publicUrl: determination.publicUrl,
    stale: health.stale,
  };

  return (
    <>
      <p className="wl-xs wl-muted">
        <Link href="/lookup">Rate lookup</Link> / {heading}
      </p>
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
      {/* Below the table, never above it and never over it (V3). */}
      <ConversionLine wdNumber={determination.wdNumber} />
      <StandingDisclaimer />
    </>
  );
}
