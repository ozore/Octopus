import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel } from '@/components/primitives';
import { ProvenanceCard, formatDay } from '@/components/provenance';
import {
  CandidateChoice,
  GeographySearch,
  WdNumberEntry,
  type CandidateView,
} from '@/components/wd-picker';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import {
  CONSTRUCTION_TYPES,
  CONSTRUCTION_TYPE_DESCRIPTIONS,
  SAM_PUBLIC_SEARCH_URL,
  corpusHealth,
  findDeterminations,
  getDetermination,
  getModificationHistory,
  listCounties,
  listStates,
} from '@/lib/kb';
import { requireOrg } from '@octopus/platform/next';

import { createProjectAction } from '../actions';

export const dynamic = 'force-dynamic';

const FORM_ID = 'new-project';

/**
 * `/projects/new` — the screen the eleven minutes lives or dies on, and the one
 * WL-02 exists for.
 *
 * **Geography narrows; it does not decide.** 12.17% of (state, county,
 * construction type) combinations map to more than one active determination
 * (1,483 of 12,185 over the whole active index), so this screen may not promise
 * one answer — and promising one would be wrong in a way the user cannot
 * detect. The typed-number path is therefore offered FIRST (29 CFR 5.5(a)(1)(i):
 * the determination that governs is the one the contracting officer
 * incorporated into the contract), the county search NARROWS to candidates, and
 * when there is more than one nothing is preselected and the form will not
 * submit (V6).
 *
 * The three steps are sections of one route, exactly as WL-02's screen table
 * has them: the job, the determination, the confirm card.
 */
export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { org, user } = await requireOrg();
  const params = await searchParams;
  const db = await getDb();

  const one = (key: string) => (typeof params[key] === 'string' ? (params[key] as string) : '');
  const draft = {
    name: one('name'),
    projectOrContractNo: one('projectOrContractNo'),
    locationDescription: one('locationDescription'),
    ourRole: one('ourRole'),
    primeContractorName: one('primeContractorName'),
    awardingAgency: one('awardingAgency'),
  };
  const wd = one('wd');
  const mod = one('mod');
  const stateCode = one('state') || one('stateCode');
  const samCountyCode = one('county') || one('samCountyCode');
  const constructionType = one('type') || one('constructionType');
  const searched = one('search') === '1' && stateCode !== '' && samCountyCode !== '';
  const error = one('error');
  const missing = one('missing').split(',').filter(Boolean);

  // The first arrival at the screen is the funnel's step; a re-render after a
  // search is not, or the denominator counts the same intent five times.
  if (!wd && !searched && !error) {
    await emitEvent(db, 'project_create_started', { orgId: org.id, userId: user.id });
  }

  const [states, health] = await Promise.all([listStates(db), corpusHealth(db)]);
  const counties = stateCode ? await listCounties(db, stateCode) : [];
  const countyName = counties.find((c) => String(c.samCountyCode) === samCountyCode)?.countyName;

  // --- entry path (B): geography ------------------------------------------
  let candidates: CandidateView[] = [];
  if (searched) {
    const found = await findDeterminations(db, {
      stateCode,
      samCountyCode: Number(samCountyCode),
      ...(constructionType ? { constructionType } : {}),
    });
    candidates = found.candidates.map((candidate) => ({
      wdNumber: candidate.wdNumber,
      modificationNumber: candidate.modificationNumber,
      publicationDate: candidate.publicationDate,
      constructionTypes: candidate.constructionTypes,
      countyNames: candidate.countyNames,
      countyCount: candidate.countyCount,
      classificationCount: candidate.classificationCount,
      publicUrl: candidate.publicUrl,
    }));

    await emitEvent(db, 'wd_search_performed', {
      orgId: org.id,
      userId: user.id,
      props: {
        state_code: stateCode,
        county_name: countyName ?? '',
        construction_type: constructionType,
        result_count: candidates.length,
      },
    });
    if (found.ambiguous) {
      await emitEvent(db, 'wd_search_ambiguous', {
        orgId: org.id,
        userId: user.id,
        props: { candidate_count: candidates.length },
      });
    }
    if (candidates.length === 0) {
      await emitEvent(db, 'wd_search_zero_results', {
        orgId: org.id,
        userId: user.id,
        props: {
          state_code: stateCode,
          county_name: countyName ?? '',
          construction_type: constructionType,
        },
      });
    }
  }

  // --- entry path (A): the number from the contract ------------------------
  const resolved = wd
    ? await getDetermination(db, wd, mod === '' ? undefined : Number(mod), {
        enqueueMissing: false,
      })
    : null;
  const history =
    resolved && resolved.resolution !== 'not_found'
      ? await getModificationHistory(
          db,
          resolved.resolution === 'fetching' ? resolved.wdNumber : resolved.determination.wdNumber,
        )
      : [];

  const confirmCard =
    resolved && (resolved.resolution === 'active' || resolved.resolution === 'superseded') ? (
      <section className="wl-stack-2" data-testid="confirm-card">
        <p className="wl-strong">3 · What you are about to pin</p>
        <ProvenanceCard
          provenance={{
            wdNumber: resolved.determination.wdNumber,
            modificationNumber: resolved.determination.modificationNumber,
            publicationDate: resolved.determination.publicationDate,
            lastVerified: resolved.determination.lastVerified,
            publicUrl: resolved.determination.publicUrl,
            stale: health.stale,
            newerModification:
              resolved.resolution === 'superseded'
                ? {
                    modificationNumber: resolved.activeModification,
                    publicationDate: resolved.activePublicationDate,
                  }
                : null,
          }}
          scope={`${
            resolved.determination.countyCount === 1
              ? `${resolved.determination.countyNames[0]} County`
              : `${resolved.determination.countyCount} counties`
          } · ${resolved.determination.constructionTypes.join(', ')} construction`}
          classification={`${resolved.determination.classificationCount} classifications`}
        />
        <p className="wl-sm">
          Your contract should name this number. If it names a different one, go back and change
          it.
        </p>
        <p className="wl-xs wl-muted">
          Work in more than one county? Create one project per county — the determination differs,
          and county boundaries are how these rates are defined.
        </p>
        {history.length > 1 ? (
          <p className="wl-xs wl-muted" data-testid="modification-history">
            Modifications on record:{' '}
            {history
              .map(
                (entry) =>
                  `${entry.modificationNumber} (${formatDay(entry.publicationDate)})${entry.active ? ' · current' : ''}`,
              )
              .join(' · ')}
          </p>
        ) : null}
      </section>
    ) : null;

  return (
    <>
      <div className="wl-row wl-row--between">
        <h1>New project</h1>
        <Link className="wl-btn wl-btn--ghost wl-btn--sm" href="/projects">
          Cancel
        </Link>
      </div>

      {error === 'fields' ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="field-errors">
          <div>
            <p className="wl-alert__title">Some of the form&rsquo;s own fields are missing.</p>
            <p className="wl-alert__body">
              The WH-347&rsquo;s header cannot be printed without them:{' '}
              {missing
                .map((field) =>
                  field === 'name'
                    ? 'project name'
                    : field === 'projectOrContractNo'
                      ? 'project or contract number'
                      : field === 'locationDescription'
                        ? 'project location'
                        : field === 'ourRole'
                          ? 'your role on the job'
                          : 'the prime contractor’s name',
                )
                .join(', ')}
              . Nothing was created.
            </p>
          </div>
        </div>
      ) : null}
      {error === 'wd_not_found' ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="wd-not-found">
          <div>
            <p className="wl-alert__title">We do not hold that determination.</p>
            <p className="wl-alert__body">
              Check the number and the modification against your contract. A determination number
              looks like <span className="wl-mono">TX20260253</span>; a modification is the small
              integer beside it. Nothing was created.
            </p>
          </div>
        </div>
      ) : null}
      {error === 'wd_missing' ? (
        <div className="wl-alert wl-alert--warn" role="alert">
          <div>
            <p className="wl-alert__title">No determination was chosen.</p>
            <p className="wl-alert__body">
              Enter the number your contract names, or search by county and pick one.
            </p>
          </div>
        </div>
      ) : null}
      {error === 'wd_fetching' || resolved?.resolution === 'fetching' ? (
        <div className="wl-alert wl-alert--info" role="status" data-testid="wd-fetching">
          <div>
            <p className="wl-alert__title">
              Reading modification {resolved?.resolution === 'fetching' ? resolved.modificationNumber : mod}{' '}
              from SAM.gov&hellip;
            </p>
            <p className="wl-alert__body">
              That revision is real but we have not held its text before. We are fetching it now —
              reload in a moment and pin it. We will not substitute a newer modification&rsquo;s
              rates under an older heading.
            </p>
          </div>
        </div>
      ) : null}
      {health.stale ? (
        <div className="wl-alert wl-alert--warn" role="note" data-testid="corpus-stale">
          <div>
            <p className="wl-alert__title">
              Determinations last verified {formatDay(health.oldestLastVerified)}.
            </p>
            <p className="wl-alert__body">Check SAM.gov before you file.</p>
          </div>
        </div>
      ) : null}
      {health.activeDeterminations === 0 ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="corpus-empty">
          <div>
            <p className="wl-alert__title">Wage determinations are still loading.</p>
            <p className="wl-alert__body">
              Try again in a few minutes. An empty result set is not an answer, so we are not
              showing you one.
            </p>
          </div>
        </div>
      ) : null}

      <form className="wl-stack" id={FORM_ID} action={createProjectAction}>
        <Panel title="1 · The job">
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="name">
              Project name <span className="wl-req">*</span>
            </label>
            <input
              className="wl-input"
              id="name"
              name="name"
              required
              defaultValue={draft.name}
              placeholder="Bldg 4200 roof replacement"
            />
            <p className="wl-field__help">
              However it appears on the contract — the prime will match on it.
            </p>
          </div>

          <div className="wl-field">
            <label className="wl-field__label" htmlFor="projectOrContractNo">
              Project or contract number <span className="wl-req">*</span>
            </label>
            <input
              className="wl-input"
              id="projectOrContractNo"
              name="projectOrContractNo"
              required
              defaultValue={draft.projectOrContractNo}
              placeholder="W912XX-26-C-0000"
            />
            <p className="wl-field__help">Prints on every page of every WH-347.</p>
          </div>

          <div className="wl-field">
            <label className="wl-field__label" htmlFor="locationDescription">
              Project location <span className="wl-req">*</span>
            </label>
            <input
              className="wl-input"
              id="locationDescription"
              name="locationDescription"
              required
              defaultValue={draft.locationDescription}
              placeholder="Fort Cavazos, Bell County, TX"
            />
          </div>

          <fieldset className="wl-field">
            <legend className="wl-field__label">
              Our role <span className="wl-req">*</span>
            </legend>
            <label>
              <input
                type="radio"
                name="ourRole"
                value="prime"
                required
                defaultChecked={draft.ourRole === 'prime'}
              />{' '}
              Prime contractor
            </label>{' '}
            <label>
              <input
                type="radio"
                name="ourRole"
                value="sub"
                required
                defaultChecked={draft.ourRole === 'sub'}
              />{' '}
              Subcontractor
            </label>
            <p className="wl-field__help">
              The WH-347 header asks which, and a subcontractor&rsquo;s form also names the prime.
            </p>
          </fieldset>

          <div className="wl-field">
            <label className="wl-field__label" htmlFor="primeContractorName">
              Prime contractor (required when you are the subcontractor)
            </label>
            <input
              className="wl-input"
              id="primeContractorName"
              name="primeContractorName"
              defaultValue={draft.primeContractorName}
            />
          </div>

          <div className="wl-field">
            <label className="wl-field__label" htmlFor="awardingAgency">
              Awarding agency
            </label>
            <input
              className="wl-input"
              id="awardingAgency"
              name="awardingAgency"
              defaultValue={draft.awardingAgency}
            />
          </div>
        </Panel>

        <Panel title="2 · The wage determination">
          <WdNumberEntry formId={FORM_ID} wdNumber={wd} modificationNumber={mod} />

          <hr />

          <GeographySearch
            formId={FORM_ID}
            states={states}
            counties={counties.map((county) => ({
              samCountyCode: county.samCountyCode,
              countyName: county.countyName,
            }))}
            constructionTypes={CONSTRUCTION_TYPES.map((value) => ({
              value,
              description: CONSTRUCTION_TYPE_DESCRIPTIONS[value],
            }))}
            selected={{ stateCode, samCountyCode, constructionType }}
          />

          {searched && candidates.length === 0 ? (
            <div className="wl-alert wl-alert--warn" role="note" data-testid="zero-results">
              <div>
                <p className="wl-alert__title">
                  No determination lists {countyName ?? 'that county'}
                  {constructionType ? ` for ${constructionType}` : ''}.
                </p>
                <div className="wl-alert__body">
                  <ol>
                    <li>
                      <strong>Check the construction type.</strong> Building versus Heavy is the
                      most common mistake, and it produces a plausible-looking, entirely wrong
                      payroll.
                    </li>
                    <li>
                      <strong>Ask your contracting officer for the wage determination number.</strong>{' '}
                      They chose it; it is incorporated into your contract by operation of law.
                    </li>
                    <li>
                      <strong>Enter it directly</strong> in the box above.
                    </li>
                  </ol>
                  <p>
                    If your contract incorporates a project wage determination issued by the agency
                    itself, it is not on SAM.gov and we cannot hold it. Do not pin an unrelated
                    general determination to get going.{' '}
                    <a href={SAM_PUBLIC_SEARCH_URL} target="_blank" rel="noreferrer noopener">
                      Search SAM.gov directly →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <CandidateChoice
            formId={FORM_ID}
            candidates={candidates}
            confirmCard={confirmCard}
            resolvedByNumber={
              resolved?.resolution === 'active' || resolved?.resolution === 'superseded'
            }
          />
        </Panel>
      </form>

      <InlineDisclaimer />
    </>
  );
}
