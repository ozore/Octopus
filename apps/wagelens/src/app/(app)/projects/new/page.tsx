import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel } from '@/components/primitives';
import { ProvenanceCard, formatDay } from '@/components/provenance';
import { createProjectAction } from '@/lib/actions';
import { getDb } from '@/lib/db';
import { getDetermination, getModificationHistory } from '@/lib/kb';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * `/projects/new` — SCAFFOLD SEAM. **WL-02 owns this file and replaces it.**
 *
 * What is here is entry path (A) from WL-02's flow — "my contract names a wage
 * determination number" — and nothing else. Path (B), the geography search with
 * its candidate list, the two-step wizard, the construction-type picker with
 * definitions and the confirm card all belong to WL-02.
 *
 * Path (A) is here because it is the path that exercises the pin, which is the
 * pair of columns the whole product hangs off, and because it lets the
 * end-to-end journey pass on a real determination from the corpus rather than
 * on a placeholder row.
 *
 * The three pin cases are already correct here and must stay correct in the
 * rewrite (WL-02, "Modification pinning, end to end"):
 *   no modification given          → the active modification
 *   modification given, active     → that one
 *   modification given, superseded → THAT ONE, pinned, permanently annotated
 *   modification given, absent     → refused. A typo, not a contract.
 */
export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOrg();
  const params = await searchParams;
  const wd = typeof params['wd'] === 'string' ? params['wd'] : '';
  const mod = typeof params['mod'] === 'string' ? params['mod'] : '';
  const error = typeof params['error'] === 'string' ? params['error'] : undefined;

  const db = await getDb();
  const preview =
    wd.trim().length > 0
      ? await getDetermination(db, wd, mod ? Number(mod) : undefined, { enqueueMissing: false })
      : null;
  const history =
    preview && preview.resolution !== 'not_found'
      ? await getModificationHistory(db, preview.resolution === 'fetching' ? preview.wdNumber : preview.determination.wdNumber)
      : [];

  return (
    <>
      <h1>New project</h1>

      {error === 'wd_not_found' ? (
        <div className="wl-alert wl-alert--error" role="alert">
          <div>
            <p className="wl-alert__title">We do not hold that determination.</p>
            <p className="wl-alert__body">
              Check the number against your contract. A determination number looks like{' '}
              <span className="wl-mono">TX20260253</span>; a modification is the small integer beside
              it. Nothing was created.
            </p>
          </div>
        </div>
      ) : null}

      <Panel title="The job">
        <form className="wl-stack" action={createProjectAction}>
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="name">
              Project name <span className="wl-req">*</span>
            </label>
            <input className="wl-input" id="name" name="name" required placeholder="Bldg 4200 roof replacement" />
            <p className="wl-field__help">However it appears on the contract — the prime will match on it.</p>
          </div>

          <div className="wl-field">
            <label className="wl-field__label" htmlFor="projectOrContractNo">
              Project or contract number
            </label>
            <input className="wl-input" id="projectOrContractNo" name="projectOrContractNo" placeholder="W912XX-26-C-0000" />
            <p className="wl-field__help">Prints on every page of every WH-347.</p>
          </div>

          <div className="wl-field">
            <label className="wl-field__label" htmlFor="locationDescription">
              Project location
            </label>
            <input className="wl-input" id="locationDescription" name="locationDescription" placeholder="Fort Cavazos, Bell County, TX" />
          </div>

          <fieldset className="wl-field">
            <legend className="wl-field__label">Our role</legend>
            <label>
              <input type="radio" name="ourRole" value="prime" /> Prime contractor
            </label>
            <label>
              <input type="radio" name="ourRole" value="sub" defaultChecked /> Subcontractor
            </label>
          </fieldset>

          <div className="wl-field">
            <label className="wl-field__label" htmlFor="wdNumber">
              Wage determination number <span className="wl-req">*</span>
            </label>
            <input
              className="wl-input wl-mono"
              id="wdNumber"
              name="wdNumber"
              required
              defaultValue={wd}
              placeholder="TX20260253"
            />
            <p className="wl-field__help">
              The one your contract names. Short forms work too — TX260253, TX0253.
            </p>
          </div>

          <div className="wl-field">
            <label className="wl-field__label" htmlFor="wdModificationNumber">
              Modification (optional)
            </label>
            <input
              className="wl-input wl-input--num"
              id="wdModificationNumber"
              name="wdModificationNumber"
              defaultValue={mod}
              inputMode="numeric"
              placeholder="leave blank for the current one"
            />
            <p className="wl-field__help">
              If your contract locked an earlier modification, name it here. We will pin that one and
              say so, permanently, on every payroll — 29 CFR 1.6.
            </p>
          </div>

          <div className="wl-row">
            <button className="wl-btn wl-btn--primary" type="submit">
              Create project
            </button>
            <Link className="wl-btn wl-btn--ghost" href="/projects">
              Cancel
            </Link>
          </div>
        </form>
      </Panel>

      {preview && preview.resolution !== 'not_found' && preview.resolution !== 'fetching' ? (
        <Panel title="What you are about to pin">
          <ProvenanceCard
            provenance={{
              wdNumber: preview.determination.wdNumber,
              modificationNumber: preview.determination.modificationNumber,
              publicationDate: preview.determination.publicationDate,
              lastVerified: preview.determination.lastVerified,
              publicUrl: preview.determination.publicUrl,
              newerModification:
                preview.resolution === 'superseded'
                  ? {
                      modificationNumber: preview.activeModification,
                      publicationDate: preview.activePublicationDate,
                    }
                  : null,
            }}
            scope={`${preview.determination.countyCount} ${preview.determination.countyCount === 1 ? 'county' : 'counties'} · ${preview.determination.constructionTypes.join(', ')}`}
            classification={`${preview.determination.classificationCount} classifications`}
          />
          <p className="wl-sm">
            Your contract should name this number. If it names a different one, change it above.
          </p>
          {history.length > 1 ? (
            <p className="wl-xs wl-muted">
              Modifications on record:{' '}
              {history
                .map((h) => `${h.modificationNumber} (${formatDay(h.publicationDate)})`)
                .join(' · ')}
            </p>
          ) : null}
        </Panel>
      ) : null}

      <InlineDisclaimer />
    </>
  );
}
