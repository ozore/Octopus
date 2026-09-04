import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Disclaimer } from '@/components/Disclaimer';
import { getDb } from '@/lib/db';
import {
  COVERAGE_PROSE,
  COVERAGE_TYPES,
  ENDORSEMENT_KEYS,
  ENDORSEMENT_PROSE,
  LIMIT_LABELS,
  LIMIT_PROSE,
  formatMoney,
  orgToday,
  type Requirement,
} from '@/lib/engine';
import { ensureOrgSettings } from '@/lib/repos';
import {
  COMBINABLE_COVERAGES,
  UNRECOGNISED_FORM_MARKER,
  UNRECOGNISED_FORM_TOOLTIP,
  classifyForm,
  getRequirementSetView,
  isRecognisedForm,
  previewSentence,
} from '@/lib/repos/requirements';
import { getTemplate } from '@/lib/templates';
import { oldestStamp, rowLabel } from '@/lib/templates/diff';
import {
  deleteRequirementAction,
  renameRequirementSetAction,
  upsertRequirementAction,
} from '../actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE REQUIREMENT SET EDITOR — `specs/02` §3, screen 3 of five, and `UX.md` S13.
 *
 * Rows are grouped Coverages → Limits → Endorsements → Policy conditions →
 * Carrier, which is the order a subcontract exhibit is written in and therefore
 * the order a customer reads their own contract in.
 *
 * THREE THINGS ON THIS SCREEN ARE ACCEPTANCE CRITERIA, not decoration:
 *
 *  - **A4** — a row derived from a template carries the source's `last_verified`
 *    DATE beside it. Not a warning banner: KB §E is explicit that an old source
 *    is old, not wrong, and the customer decides how much that matters.
 *  - **A5** — the "what this will check" panel states, for a combinable limit,
 *    "may be met by general liability and umbrella/excess combined". That field
 *    is the most misunderstood control on the screen and the sentence is the
 *    only place its meaning is written in English.
 *  - **A10** — `RSCG0303` is accepted, stored as typed, and shown with the
 *    "unrecognised form" marker. It is a real carrier additional-insured form
 *    (KB §C.5); rejecting free text rejects a form the engine already handles.
 *
 * The editor NEVER writes a status. `specs/06` and `UX.md` §3.4 are agreed: a
 * status is a conclusion drawn from a document and must not be settable by hand.
 */

const PROSE = {
  coverage: COVERAGE_PROSE as Record<string, string>,
  limit: LIMIT_PROSE as Record<string, string>,
  endorsement: ENDORSEMENT_PROSE as Record<string, string>,
  money: formatMoney,
};

const GROUPS: { kind: Requirement['kind']; title: string; blurb: string }[] = [
  { kind: 'coverage_present', title: 'Coverages', blurb: 'Which policies have to be on the certificate at all.' },
  { kind: 'limit', title: 'Limits', blurb: 'The minimum each limit box has to print.' },
  {
    kind: 'endorsement',
    title: 'Endorsements',
    blurb:
      'What has to be evidenced by an attached endorsement page. A tick in the ADDL INSD or SUBR WVD column alone reads as claimed, not evidenced.',
  },
  { kind: 'policy_condition', title: 'Policy conditions', blurb: 'Occurrence basis, per-project aggregate, retention ceilings, stop-gap states.' },
  { kind: 'carrier', title: 'Carrier', blurb: 'Certly does not read carrier ratings. Every report names this under “Not checked by Certly”.' },
];

function toRequirement(row: {
  id: string;
  kind: string;
  coverage: string | null;
  limitLabel: string | null;
  minAmount: number | null;
  combinable: boolean;
  endorsementKey: string | null;
  acceptsForms: string[] | null;
  condition: Record<string, unknown> | null;
  otherLabel: string | null;
  label: string | null;
  severity: string;
  note: string | null;
  sortOrder: number;
}): Requirement {
  return {
    id: row.id,
    kind: row.kind as Requirement['kind'],
    coverage: row.coverage as Requirement['coverage'],
    limitLabel: row.limitLabel as Requirement['limitLabel'],
    minAmount: row.minAmount,
    combinable: row.combinable,
    endorsementKey: row.endorsementKey as Requirement['endorsementKey'],
    acceptsForms: row.acceptsForms ?? [],
    condition: (row.condition ?? null) as Requirement['condition'],
    otherLabel: row.otherLabel,
    label: row.label,
    severity: row.severity as Requirement['severity'],
    note: row.note,
    sortOrder: row.sortOrder,
  };
}

export default async function RequirementSetEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { setId } = await params;
  const query = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();

  const view = await getRequirementSetView(db, org.id, setId);
  // A cross-org read returns nothing, and nothing is a 404 — never a 403,
  // which would confirm the set exists (`specs/01` A6).
  if (!view) notFound();

  const settings = await ensureOrgSettings(db, org.id);
  const today = orgToday(settings.timezone, new Date());
  const template = view.set.sourceTemplateId ? getTemplate(view.set.sourceTemplateId) : null;
  const stamp = oldestStamp(template, today);
  const rows = view.rows.map(toRequirement);
  const error = typeof query['error'] === 'string' ? query['error'] : null;
  const errorField = typeof query['field'] === 'string' ? query['field'] : null;
  const added = typeof query['added'] === 'string' ? query['added'] : null;

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">{view.set.name}</h1>
          <p className="c-page__lede">
            Version {view.set.version} · {rows.length} rows · applies to {view.vendorCount}{' '}
            {view.vendorCount === 1 ? 'vendor' : 'vendors'} right now.
            {view.set.isOrgDefault ? ' This is the organisation default.' : ''}
          </p>
        </div>
        <span className="c-asof">
          as of <time dateTime={today}>{today}</time>
        </span>
      </header>

      <p className="c-gap-3">
        <Link className="c-btn c-btn--quiet" href="/requirements">
          ← Requirement sets
        </Link>
        {view.set.sourceTemplateId ? (
          <Link className="c-btn c-btn--secondary" href={`/requirements/${setId}/changes`} data-testid="changes-link">
            What changed in the library
          </Link>
        ) : null}
      </p>

      {/* Surface 9 of the eleven (KB §F.4): §F.2, adjacent to the limits. */}
      <Disclaimer of="templates" />

      {error ? (
        <p className="notice error" data-testid="requirement-error" data-field={errorField ?? ''}>
          {error}
        </p>
      ) : null}
      {query['saved'] ? (
        <p className="notice" data-testid="requirement-saved">
          Saved. This set is now version {String(query['saved'])}, and it applies to {view.vendorCount}{' '}
          {view.vendorCount === 1 ? 'vendor' : 'vendors'}. Comparisons already run keep the version they
          were run against.
          {added ? ` Certly also added: ${added}.` : ''}
        </p>
      ) : null}
      {query['deleted'] ? (
        <p className="notice" data-testid="requirement-deleted">
          Row removed. This set is now version {view.set.version}.
        </p>
      ) : null}

      {GROUPS.map((group) => {
        const groupRows = rows.filter((row) => row.kind === group.kind);
        return (
          <section className="c-card" key={group.kind} data-testid={`group-${group.kind}`}>
            <div className="c-card__head">
              <h2 className="c-card__title">{group.title}</h2>
              <span className="c-xs c-muted">{groupRows.length}</span>
            </div>
            <p className="c-small c-muted">{group.blurb}</p>

            {groupRows.length === 0 ? (
              <p className="c-small c-muted">Nothing here yet.</p>
            ) : (
              <ul className="c-req__rows c-list-reset">
                {groupRows.map((row) => (
                  <li className="c-req__row" key={row.id} data-testid={`row-${row.id}`}>
                    <div>
                      <strong>{rowLabel(row, PROSE)}</strong>{' '}
                      {row.kind === 'limit' && row.minAmount ? (
                        <span className="c-num">{formatMoney(row.minAmount)}</span>
                      ) : null}
                      {row.severity === 'advisory' ? <span className="badge"> advisory</span> : null}
                      {row.kind === 'endorsement'
                        ? row.acceptsForms.map((form) => (
                            <span key={form} className="c-gap-2">
                              <span className="c-mono">{form}</span>
                              {classifyForm(form) === 'carrier' || !isRecognisedForm(form) ? (
                                <span
                                  className="c-req__mark"
                                  title={UNRECOGNISED_FORM_TOOLTIP}
                                  data-testid={`unrecognised-${form.replace(/\s/g, '')}`}
                                >
                                  {UNRECOGNISED_FORM_MARKER}
                                </span>
                              ) : null}
                            </span>
                          ))
                        : null}
                      {/* A4 — the source date beside the row. A date, not a
                          warning (KB §E). */}
                      {stamp ? (
                        <span className="c-date" data-testid={`row-stamp-${row.id}`} data-stale={stamp.stale ? 'true' : 'false'}>
                          {' '}
                          from {template?.label}, checked {stamp.source.last_verified}
                        </span>
                      ) : null}
                      {/* A5 — the "what this will check" sentence, per row. */}
                      <p className="c-small c-muted" data-testid={`preview-${row.id}`}>
                        {previewSentence(row, PROSE)}
                      </p>
                      {row.note ? <p className="c-xs c-muted">{row.note}</p> : null}
                    </div>

                    <div className="c-gap-2">
                      <details>
                        <summary className="c-btn c-btn--quiet c-btn--sm">Edit</summary>
                        <form action={upsertRequirementAction} className="c-stack">
                          <input type="hidden" name="setId" value={setId} />
                          <input type="hidden" name="requirementId" value={row.id} />
                          <input type="hidden" name="kind" value={row.kind} />
                          <input type="hidden" name="coverage" value={row.coverage ?? ''} />
                          <input type="hidden" name="limitLabel" value={row.limitLabel ?? ''} />
                          <input type="hidden" name="endorsementKey" value={row.endorsementKey ?? ''} />
                          <input type="hidden" name="otherLabel" value={row.otherLabel ?? ''} />
                          <input type="hidden" name="label" value={row.label ?? ''} />
                          <input type="hidden" name="sortOrder" value={String(row.sortOrder)} />
                          {row.kind === 'limit' ? (
                            <>
                              <label className="c-field">
                                <span className="c-field__label">Minimum</span>
                                <span className="c-field__hint">
                                  Digits. A minimum of 0 is refused — that is what deleting the row is for.
                                </span>
                                <input
                                  className="c-input c-input--num"
                                  name="minAmount"
                                  defaultValue={row.minAmount ?? ''}
                                  data-testid={`edit-min-${row.id}`}
                                />
                              </label>
                              {row.coverage && COMBINABLE_COVERAGES.includes(row.coverage) ? (
                                <label className="c-field c-gap-2">
                                  <input type="checkbox" name="combinable" defaultChecked={row.combinable} />
                                  <span className="c-field__label">
                                    May be met by general liability and umbrella/excess combined
                                  </span>
                                </label>
                              ) : null}
                            </>
                          ) : null}
                          {row.kind === 'endorsement' ? (
                            <label className="c-field">
                              <span className="c-field__label">Accepted forms</span>
                              <span className="c-field__hint">
                                One per line. ISO numbers such as CG 20 10, or a carrier form such as
                                RSCG0303 — both are accepted and a carrier form is matched exactly.
                              </span>
                              <textarea
                                className="c-textarea"
                                name="acceptsForms"
                                defaultValue={row.acceptsForms.join('\n')}
                                data-testid={`edit-forms-${row.id}`}
                              />
                            </label>
                          ) : null}
                          <label className="c-field">
                            <span className="c-field__label">Severity</span>
                            <select className="c-select" name="severity" defaultValue={row.severity}>
                              <option value="blocking">blocking</option>
                              <option value="advisory">advisory — tracked, never marks a vendor red</option>
                            </select>
                          </label>
                          <label className="c-field">
                            <span className="c-field__label">Note</span>
                            <input className="c-input" name="note" defaultValue={row.note ?? ''} />
                          </label>
                          <button className="c-btn c-btn--primary c-btn--sm" type="submit">
                            Save row
                          </button>
                        </form>
                      </details>

                      <form action={deleteRequirementAction}>
                        <input type="hidden" name="setId" value={setId} />
                        <input type="hidden" name="requirementId" value={row.id} />
                        <button className="c-btn c-btn--secondary c-btn--sm" type="submit">
                          Remove
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <section className="c-card" data-testid="add-rows">
        <div className="c-card__head">
          <h2 className="c-card__title">Add a requirement</h2>
        </div>

        <details data-testid="add-limit">
          <summary className="c-btn c-btn--secondary c-btn--sm">Add a limit</summary>
          <form action={upsertRequirementAction} className="c-stack">
            <input type="hidden" name="setId" value={setId} />
            <input type="hidden" name="kind" value="limit" />
            <label className="c-field">
              <span className="c-field__label">Coverage</span>
              <select className="c-select" name="coverage" defaultValue="general_liability">
                {COVERAGE_TYPES.map((coverage) => (
                  <option key={coverage} value={coverage}>
                    {COVERAGE_PROSE[coverage]}
                  </option>
                ))}
              </select>
            </label>
            <label className="c-field">
              <span className="c-field__label">Limit</span>
              <select className="c-select" name="limitLabel" defaultValue="each_occurrence">
                {LIMIT_LABELS.map((label) => (
                  <option key={label} value={label}>
                    {LIMIT_PROSE[label]}
                  </option>
                ))}
              </select>
            </label>
            <label className="c-field">
              <span className="c-field__label">Minimum</span>
              <span className="c-field__hint">Enter an amount, e.g. 1,000,000</span>
              <input className="c-input c-input--num" name="minAmount" data-testid="new-limit-min" />
            </label>
            <label className="c-field">
              <span className="c-field__label">Label, if the coverage is “other”</span>
              <input className="c-input" name="otherLabel" placeholder="Professional liability" />
            </label>
            <label className="c-field c-gap-2">
              <input type="checkbox" name="combinable" data-testid="new-limit-combinable" />
              <span className="c-field__label">
                May be met by general liability and umbrella/excess combined
              </span>
            </label>
            <label className="c-field">
              <span className="c-field__label">Severity</span>
              <select className="c-select" name="severity" defaultValue="blocking">
                <option value="blocking">blocking</option>
                <option value="advisory">advisory</option>
              </select>
            </label>
            <button className="c-btn c-btn--primary c-btn--sm" type="submit" data-testid="save-limit">
              Add limit
            </button>
          </form>
        </details>

        <details data-testid="add-coverage">
          <summary className="c-btn c-btn--secondary c-btn--sm">Add a coverage</summary>
          <form action={upsertRequirementAction} className="c-stack">
            <input type="hidden" name="setId" value={setId} />
            <input type="hidden" name="kind" value="coverage_present" />
            <label className="c-field">
              <span className="c-field__label">Coverage</span>
              <select className="c-select" name="coverage" defaultValue="workers_compensation">
                {COVERAGE_TYPES.map((coverage) => (
                  <option key={coverage} value={coverage}>
                    {COVERAGE_PROSE[coverage]}
                  </option>
                ))}
              </select>
            </label>
            <label className="c-field">
              <span className="c-field__label">Label, if the coverage is “other”</span>
              <input className="c-input" name="otherLabel" placeholder="Cyber liability" />
            </label>
            <button className="c-btn c-btn--primary c-btn--sm" type="submit">
              Add coverage
            </button>
          </form>
        </details>

        <details data-testid="add-endorsement">
          <summary className="c-btn c-btn--secondary c-btn--sm">Add an endorsement</summary>
          <form action={upsertRequirementAction} className="c-stack">
            <input type="hidden" name="setId" value={setId} />
            <input type="hidden" name="kind" value="endorsement" />
            <label className="c-field">
              <span className="c-field__label">Endorsement</span>
              <select className="c-select" name="endorsementKey" defaultValue="additional_insured_ongoing" data-testid="new-endorsement-key">
                {ENDORSEMENT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {ENDORSEMENT_PROSE[key]}
                  </option>
                ))}
              </select>
            </label>
            <label className="c-field">
              <span className="c-field__label">Accepted forms</span>
              <span className="c-field__hint">
                One per line. ISO numbers such as CG 20 10, or a carrier proprietary form such as
                RSCG0303 — both are accepted. A carrier form is matched exactly and shown with an
                “{UNRECOGNISED_FORM_MARKER}” marker, because we cannot tell you what it covers.
              </span>
              <textarea className="c-textarea" name="acceptsForms" data-testid="new-endorsement-forms" />
            </label>
            <button className="c-btn c-btn--primary c-btn--sm" type="submit" data-testid="save-endorsement">
              Add endorsement
            </button>
          </form>
        </details>

        <details data-testid="add-condition">
          <summary className="c-btn c-btn--secondary c-btn--sm">Add a policy condition</summary>
          <form action={upsertRequirementAction} className="c-stack">
            <input type="hidden" name="setId" value={setId} />
            <input type="hidden" name="kind" value="policy_condition" />
            <label className="c-field">
              <span className="c-field__label">Coverage</span>
              <select className="c-select" name="coverage" defaultValue="general_liability">
                {COVERAGE_TYPES.map((coverage) => (
                  <option key={coverage} value={coverage}>
                    {COVERAGE_PROSE[coverage]}
                  </option>
                ))}
              </select>
            </label>
            <label className="c-field">
              <span className="c-field__label">Form basis</span>
              <select className="c-select" name="formBasis" defaultValue="">
                <option value="">—</option>
                <option value="occurrence">occurrence</option>
                <option value="claims_made">claims made</option>
              </select>
            </label>
            <label className="c-field">
              <span className="c-field__label">Aggregate applies per</span>
              <select className="c-select" name="aggregateAppliesPer" defaultValue="">
                <option value="">—</option>
                <option value="policy">policy</option>
                <option value="project">project</option>
                <option value="loc">location</option>
              </select>
            </label>
            <label className="c-field">
              <span className="c-field__label">Largest retention you will accept</span>
              <input className="c-input c-input--num" name="maxSir" placeholder="25,000" />
            </label>
            <button className="c-btn c-btn--primary c-btn--sm" type="submit">
              Add condition
            </button>
          </form>
        </details>
      </section>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Rename this set</h2>
        </div>
        <form action={renameRequirementSetAction} className="c-gap-2">
          <input type="hidden" name="setId" value={setId} />
          <input className="c-input" name="name" defaultValue={view.set.name} aria-label="Requirement set name" />
          <button className="c-btn c-btn--secondary c-btn--sm" type="submit">
            Rename
          </button>
        </form>
      </section>
    </main>
  );
}
