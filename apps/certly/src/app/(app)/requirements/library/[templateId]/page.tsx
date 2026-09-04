import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Disclaimer } from '@/components/Disclaimer';
import { getDb } from '@/lib/db';
import { orgToday, formatMoney, COVERAGE_PROSE, ENDORSEMENT_PROSE, LIMIT_PROSE } from '@/lib/engine';
import { ensureOrgSettings } from '@/lib/repos';
import { classifyForm, isRecognisedForm, UNRECOGNISED_FORM_MARKER, UNRECOGNISED_FORM_TOOLTIP } from '@/lib/repos/requirements';
import { getTemplate, summarise, toRequirementSet } from '@/lib/templates';
import { rowLabel, sourceStamps } from '@/lib/templates/diff';
import { applyTemplateAction } from '../../actions';
import { track } from '@octopus/platform/events';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE TEMPLATE PREVIEW — `specs/02` §3, and the screen acceptance criterion A2
 * is written about.
 *
 * EVERY ROW SHOWS ITS LIMIT, ITS SOURCE LINK AND ITS "LAST CHECKED" DATE. The
 * source is a real anchor to the real document, routed through
 * `./source` so that `template_source_opened` is recorded honestly rather than
 * guessed at — `specs/02` §10 calls that click the honest test of D3.
 *
 * A7: `pm.snow` is marked `UNVERIFIED` in KB §B.1 and says so here, in its own
 * words, above the rows rather than in a footnote.
 */

const PROSE = { coverage: COVERAGE_PROSE as Record<string, string>, limit: LIMIT_PROSE as Record<string, string>, endorsement: ENDORSEMENT_PROSE as Record<string, string> };

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) notFound();

  const { org, user } = await requireOrg();
  const db = await getDb();
  const settings = await ensureOrgSettings(db, org.id);
  const today = orgToday(settings.timezone, new Date());

  await track(db, {
    name: 'template_previewed',
    orgId: org.id,
    userId: user.id,
    props: { template_id: template.id },
  });

  const summary = summarise(template);
  const rows = toRequirementSet(template).requirements;
  const stamps = sourceStamps(template, today);

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">{template.label}</h1>
          <p className="c-page__lede">{template.summary}</p>
        </div>
        <span className="c-asof">
          as of <time dateTime={today}>{today}</time>
        </span>
      </header>

      <p className="c-gap-3">
        <Link className="c-btn c-btn--quiet" href="/requirements/library">
          ← All templates
        </Link>
      </p>

      {/* Surface 9 of the eleven (KB §F.4). */}
      <Disclaimer of="templates" />

      {template.unverified ? (
        <p className="notice warn" data-testid="unverified-note">
          {template.unverified_note}
        </p>
      ) : null}

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">What this template checks</h2>
          <span className="c-xs c-muted">
            {summary.rowCount} rows · sourced from {summary.sourceCount}{' '}
            {summary.sourceCount === 1 ? 'document' : 'documents'}
          </span>
        </div>

        <div className="c-table-wrap">
          <table className="c-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Minimum / accepted forms</th>
                <th>Severity</th>
                <th>Source</th>
                <th>Last checked</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const stamp = stamps[0];
                return (
                  <tr key={row.id} data-testid={`template-row-${row.sortOrder}`}>
                    <td className="c-table__party">
                      {rowLabel(row, PROSE)}
                      {row.note ? <span className="c-table__meta"> — {row.note}</span> : null}
                    </td>
                    <td className="c-num" data-testid={`row-min-${row.sortOrder}`}>
                      {row.kind === 'limit' && row.minAmount ? formatMoney(row.minAmount) : null}
                      {row.kind === 'endorsement'
                        ? row.acceptsForms.map((form) => (
                            <span key={form} className="c-gap-2" style={{ display: 'block' }}>
                              <span className="c-mono">{form}</span>
                              {classifyForm(form) === 'carrier' || !isRecognisedForm(form) ? (
                                <span className="c-req__mark" title={UNRECOGNISED_FORM_TOOLTIP}>
                                  {UNRECOGNISED_FORM_MARKER}
                                </span>
                              ) : null}
                            </span>
                          ))
                        : null}
                      {row.kind === 'carrier' ? <span className="c-muted">not checked by Certly</span> : null}
                      {row.kind === 'policy_condition' ? (
                        <span className="c-mono">{JSON.stringify(row.condition ?? {})}</span>
                      ) : null}
                    </td>
                    <td className="c-table__meta">{row.severity}</td>
                    <td className="c-table__meta">
                      {stamp ? (
                        <a
                          data-testid={`template-source-${row.sortOrder}`}
                          href={`/requirements/library/${template.id}/source?url=${encodeURIComponent(stamp.source.url)}`}
                          rel="noreferrer noopener"
                          target="_blank"
                        >
                          {stamp.source.title}
                        </a>
                      ) : (
                        <span className="c-muted">our suggestion — no published source</span>
                      )}
                    </td>
                    {/* A4: a DATE beside the row, never a warning banner (KB §E). */}
                    <td className="c-date" data-stale={stamp?.stale ? 'true' : 'false'}>
                      {stamp?.source.last_verified ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Where these numbers came from</h2>
        </div>
        <ul className="c-list-reset c-stack">
          {stamps.map((stamp) => (
            <li key={stamp.source.url} className="c-small">
              <a
                href={`/requirements/library/${template.id}/source?url=${encodeURIComponent(stamp.source.url)}`}
                rel="noreferrer noopener"
                target="_blank"
              >
                {stamp.source.title}
              </a>{' '}
              <span className="c-date">checked {stamp.source.last_verified}</span>{' '}
              <span className="c-muted">
                ({stamp.ageDays} days ago{stamp.stale ? ', over 180' : ''}; confidence {stamp.source.confidence})
              </span>
            </li>
          ))}
          {stamps.length === 0 ? (
            <li className="c-small c-muted">
              our suggestion — not from a published source. Check your contract.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Use this template</h2>
        </div>
        <p className="c-small c-muted">
          Applying it makes a copy you own. Later library updates never change your copy; the changes
          view will offer them and you decide.
        </p>
        <form action={applyTemplateAction}>
          <input type="hidden" name="templateId" value={template.id} />
          <label className="c-field">
            <span className="c-field__label">Name this set</span>
            <input className="c-input" name="name" type="text" defaultValue={template.label} />
          </label>
          <label className="c-field c-gap-2">
            <input name="makeDefault" type="checkbox" defaultChecked />
            <span className="c-field__label">Make this the organisation default</span>
          </label>
          <button className="c-btn c-btn--primary" type="submit" data-testid="apply-template">
            Apply template
          </button>
        </form>
      </section>
    </main>
  );
}
