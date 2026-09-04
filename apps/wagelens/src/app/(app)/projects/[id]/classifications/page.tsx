import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { ClassificationTable } from '@/components/determination';
import { Panel } from '@/components/primitives';
import { emitEvent } from '@/lib/analytics/events';
import { publicDeterminationUrl, searchClassifications, type ClassificationRow } from '@/lib/kb';

import { OfficialLink } from '../official-link';
import { loadProject } from '../project-context';
import { ProjectTabs } from '../tabs';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

/**
 * `/projects/:id/classifications` — WL-03's catalogue.
 *
 * **Scoped to the project's PINNED modification, never the active one** (V1,
 * gate G9): the query below takes `project.wdId`, so there is no code path here
 * that could read a classification from a determination this project is not
 * pinned to. There is also no global "search all rates" screen in the MVP, and
 * that is a decision rather than an omission — a rate with no contract behind
 * it is a rate somebody will put on a federal form.
 *
 * The determination for Harris County Building lists 57 classifications in 15
 * rate groups, alphabetised WITHIN each group and not across them, so
 * `ELECTRICIAN` appears twice at $38.50 and $18.00. Both rows are shown, the
 * rate group is the discriminator, and **neither is presented as the more
 * likely answer.**
 *
 * Search is server-side and the count is always in the header: a determination
 * with 300 classifications is a real case, and a browser that has been handed
 * all of them is a browser that will scroll instead of search.
 */
export default async function ClassificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const one = (key: string) => (typeof query[key] === 'string' ? (query[key] as string) : '');

  const { project, provenance, db, orgId, userId } = await loadProject(id);

  // V3 — a one-character query returns the unfiltered list rather than nothing.
  const rawQuery = one('q');
  const term = rawQuery.trim();
  const effectiveQuery = term.length >= 2 ? term : '';
  const sort = one('sort') === 'rate' ? 'rate' : one('sort') === 'rate_desc' ? 'rate_desc' : 'az';
  const kind = one('kind');
  const page = Math.max(1, Number(one('page') || '1') || 1);
  const expand = one('expand');

  // The plain path is paged in SQL. A sort by rate or a rate-type filter reads
  // the determination's own rows first — bounded by the determination, which is
  // 57 rows here and 300 at the top of the range — and pages after ordering,
  // because a page sorted after slicing would be a lie about the order.
  const needsFullSet = sort !== 'az' || kind !== '';
  const fetched = await searchClassifications(db, project.wdId, {
    ...(effectiveQuery ? { query: effectiveQuery } : {}),
    limit: needsFullSet ? 1000 : PAGE_SIZE,
    ...(needsFullSet ? {} : { offset: (page - 1) * PAGE_SIZE }),
  });

  let rows: ClassificationRow[] = fetched.rows;
  let total = fetched.total;
  if (needsFullSet) {
    if (kind) rows = rows.filter((row) => row.rateGroupKind === kind);
    if (sort === 'rate') rows = [...rows].sort((a, b) => Number(a.baseRate) - Number(b.baseRate));
    if (sort === 'rate_desc') rows = [...rows].sort((a, b) => Number(b.baseRate) - Number(a.baseRate));
    total = rows.length;
    rows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }

  const kinds = [...new Set(fetched.rows.map((row) => row.rateGroupKind))].sort();
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  await emitEvent(db, 'classification_catalogue_viewed', {
    orgId,
    userId,
    props: { wd_number: project.wdNumber, classification_count: total },
  });
  if (effectiveQuery) {
    await emitEvent(db, 'classification_searched', {
      orgId,
      userId,
      props: { query: effectiveQuery, result_count: total },
    });
    if (total === 0) {
      // The conformance demand signal, in the customer's own words: which
      // classifications people cannot find on the determinations they are
      // pinned to. It is the single most valuable event in the product.
      await emitEvent(db, 'classification_zero_results', {
        orgId,
        userId,
        props: { query: effectiveQuery, wd_number: project.wdNumber },
      });
    }
  }
  if (expand) {
    await emitEvent(db, 'classification_row_expanded', {
      orgId,
      userId,
      props: { classification_id: expand },
    });
  }

  const base = `/projects/${project.id}/classifications`;
  const linkWith = (over: Record<string, string>) => {
    const params = new URLSearchParams();
    if (effectiveQuery) params.set('q', effectiveQuery);
    if (sort !== 'az') params.set('sort', sort);
    if (kind) params.set('kind', kind);
    if (page > 1) params.set('page', String(page));
    for (const [key, value] of Object.entries(over)) {
      if (value === '') params.delete(key);
      else params.set(key, value);
    }
    const search = params.toString();
    return search ? `${base}?${search}` : base;
  };

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>Classifications</h1>
          <p className="wl-sm wl-muted">
            <Link href={`/projects/${project.id}`}>{project.name}</Link> ·{' '}
            <span className="wl-mono">{project.wdNumber}</span> modification{' '}
            {project.wdModificationNumber}
          </p>
        </div>
        <OfficialLink
          className="wl-btn wl-btn--secondary wl-btn--sm"
          href={publicDeterminationUrl(project.wdNumber, project.wdModificationNumber)}
          wdNumber={project.wdNumber}
          surface="classification_catalogue"
        >
          ⧉ View on SAM.gov
        </OfficialLink>
      </div>

      <ProjectTabs id={project.id} current={`/projects/${project.id}/classifications`} />

      {fetched.total === 0 && effectiveQuery === '' ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="catalogue-unavailable">
          <div>
            <p className="wl-alert__title">We can&rsquo;t load this project&rsquo;s determination.</p>
            <p className="wl-alert__body">
              We hold no classifications for {project.wdNumber} modification{' '}
              {project.wdModificationNumber}. An empty table presented as &ldquo;no
              classifications&rdquo; would be worse than saying so.{' '}
              <OfficialLink
                href={publicDeterminationUrl(project.wdNumber, project.wdModificationNumber)}
                wdNumber={project.wdNumber}
                surface="catalogue_unavailable"
              >
                Open it on SAM.gov →
              </OfficialLink>
            </p>
          </div>
        </div>
      ) : null}

      <Panel title="Find a classification">
        <form className="wl-row" method="get" action={base} role="search">
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="q">
              Search
            </label>
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              className="wl-input"
              id="q"
              name="q"
              defaultValue={rawQuery}
              autoFocus
              autoComplete="off"
              placeholder="electrician, backhoe, drywall"
            />
            <p className="wl-field__help">
              Search the work, not the job title. One character returns everything.
            </p>
          </div>
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="sort">
              Sort
            </label>
            <select className="wl-select" id="sort" name="sort" defaultValue={sort}>
              <option value="az">As the determination prints them</option>
              <option value="rate">Base rate, lowest first</option>
              <option value="rate_desc">Base rate, highest first</option>
            </select>
          </div>
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="kind">
              Rate type
            </label>
            <select className="wl-select" id="kind" name="kind" defaultValue={kind}>
              <option value="">Every rate type</option>
              {kinds.map((value) => (
                <option key={value} value={value}>
                  {value.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <button className="wl-btn wl-btn--secondary" type="submit">
            Search
          </button>
        </form>
        <p className="wl-2xs wl-muted" data-testid="welders-note">
          <strong>Welders</strong> take the rate of the craft they are welding for. That is a rule
          in the determination, not a classification you can pick, so it is not a row in this table.
        </p>
      </Panel>

      <ClassificationTable
        rows={rows}
        total={total}
        provenance={provenance}
        query={effectiveQuery || undefined}
        heading={`${total} classification${total === 1 ? '' : 's'} on ${project.wdNumber} mod ${project.wdModificationNumber}${effectiveQuery ? ` matching “${effectiveQuery}”` : ''}`}
        showQualifier
        expandedIds={expand ? [expand] : []}
        detailHref={(row) => linkWith({ expand: row.id === expand ? '' : row.id })}
        emptyMessage={
          effectiveQuery ? (
            <div className="wl-stack-2" data-testid="classification-zero-results">
              <p className="wl-strong">Not finding it?</p>
              <ol>
                <li>
                  Try a broader word — &ldquo;operator&rdquo; before &ldquo;trackhoe&rdquo;,
                  &ldquo;laborer&rdquo; before &ldquo;flagger&rdquo;.
                </li>
                <li>
                  <Link href={`/projects/${project.id}/determination/text`}>
                    Read the determination in full
                  </Link>{' '}
                  — its own wording often answers what the table cannot.
                </li>
                <li>
                  <Link href={`/projects/${project.id}/conformance`} data-testid="none-match">
                    What if nothing matches?
                  </Link>{' '}
                  Classification follows the work actually performed, so look again before you
                  conclude that nothing on the determination fits.
                </li>
              </ol>
            </div>
          ) : null
        }
        footer={
          pageCount > 1 ? (
            <p className="wl-row" data-testid="catalogue-pagination">
              <span className="wl-xs wl-muted">
                Page {page} of {pageCount} · {total} classifications in total
              </span>
              {page > 1 ? (
                <Link className="wl-btn wl-btn--ghost wl-btn--sm" href={linkWith({ page: String(page - 1) })}>
                  Previous
                </Link>
              ) : null}
              {page < pageCount ? (
                <Link
                  className="wl-btn wl-btn--ghost wl-btn--sm"
                  href={linkWith({ page: String(page + 1) })}
                  data-testid="catalogue-next-page"
                >
                  Next
                </Link>
              ) : null}
            </p>
          ) : null
        }
      />

      <p className="wl-2xs wl-muted">
        The total column is computed for display only and is never stored: the WH-347 asks for the
        base rate and the fringe separately, in 6(A) and 6(B), and conflating them is a classic
        error on the form.
      </p>

      <InlineDisclaimer />
    </>
  );
}
