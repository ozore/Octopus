/**
 * S24 — `/status`. Public, no login, nothing hidden.
 *
 * AUTHORITY: `USER_JOURNEY.md` §0.6 S24 and §11.8 (the autonomy block, published
 * raw), `ARCHITECTURE.md` §10.3 (`readStatus` is the single query set behind the
 * banner, the artifact footer and this page — three surfaces that must not drift),
 * §4.5 (the ladder), `CORRECTIONS.md` §4 (G1–G6 render mechanism sentences until a
 * counter says otherwise).
 *
 * ===========================================================================
 * WHAT THIS PAGE IS FOR
 *
 * It is the accountability surface, so it is written for the reader who assumes we
 * are shading it. Every number is one the system counted, printed with its as-of
 * date; every derived figure is rounded UP by `roundAgainstUs`; the G5 inbound
 * total is printed exactly as counted, before any filter, with the machine-derived
 * bulk figure beside it rather than instead of it.
 *
 * A COLD SYSTEM SAYS SO. Before the first promotion, the first canary run, the
 * first reconciliation, this page prints "not yet measured" rather than a zero. A
 * zero is a measurement; an absence is not, and the difference is the whole point
 * of publishing at all.
 *
 * AND THERE IS NO CONTACT AFFORDANCE HERE. Not a form, not an address, not a "let
 * us know if this looks wrong". A3: when the system is unsure it says so in the
 * product and narrows what it claims — this page IS that behaviour, at the level of
 * the whole company.
 */

import Link from 'next/link';

import { getDb } from '@/db';
// The public pages share one additive stylesheet. Imported here as well as by the
// marketing group so that a reader who lands on /status first gets the same page.
import '../(marketing)/marketing.css';
import { getConfig } from '@/lib/config';
import { Cents } from '@/lib/money';
import { readStatus } from '@/platform/ops/status';

import {
  autonomyView,
  canaryView,
  corpusCounts,
  corpusView,
  ingestJob,
  jobViews,
  ladderView,
  lastCanaryRun,
  stamp,
} from './_lib/present';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Status — Ratepin',
  description:
    'Corpus freshness, degradation ladder, last successful ingest, the golden canary’s last ' +
    'result, and the raw inbound-message count behind the autonomy gate.',
};

function Row({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default async function StatusPage(): Promise<React.ReactElement> {
  const db = await getDb();
  const config = getConfig();

  const status = await readStatus(db, {
    datedHours: config.FRESHNESS_DATED_HOURS,
    slaHours: config.FRESHNESS_SLA_HOURS,
    creditFloorCents: config.CREDIT_FLOOR_CENTS,
    creditCeilingPct: config.CREDIT_CEILING_PCT,
  });

  const [counts, canaryRun] = await Promise.all([corpusCounts(db), lastCanaryRun(db)]);

  const corpus = corpusView(status);
  const ladder = ladderView(status.ladderLevel);
  const canary = canaryView(canaryRun);
  const g5 = status.gates.find((gate) => gate.reading.key === 'G5');
  const autonomy = autonomyView(g5?.reading);
  const ingest = ingestJob(status);
  const jobs = jobViews(status);

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack">
        <h1>Status</h1>
        <p className="rp-lp-lead">
          Every figure on this page was counted by the system that produced it and is printed with
          the moment it was counted. Where something has not been measured, this page says so rather
          than printing a zero. Rendered {stamp(status.generatedAt)}.
        </p>
        <p className="rp-legal">
          Derived figures on this page are rounded up, never down: corpus age, the reconciliation
          delta and the human-minutes ratio are each the less flattering of the two roundings
          available. Counts are printed exactly as counted.
        </p>
      </section>

      {/* ---------------------------------------------------------- CORPUS -- */}
      <section className="rp-stack">
        <h2>Corpus freshness</h2>
        <div className="rp-lp-grid rp-lp-grid--2">
          <dl className="rp-lp-kv rp-lp-card">
            <Row label="Freshness state" value={corpus.freshnessState} />
            <Row
              label="Snapshot promoted at"
              value={corpus.promotedAt ?? 'no snapshot has been promoted'}
            />
            <Row label="Snapshot hash" value={corpus.snapshotRef ?? 'none'} />
            <Row
              label="Age of the newer-revision check"
              value={corpus.ageHours === null ? 'not yet measured' : `${String(corpus.ageHours)} h`}
            />
            <Row
              label="Thresholds"
              value={`dated at ${String(config.FRESHNESS_DATED_HOURS)} h · stale at ${String(config.FRESHNESS_SLA_HOURS)} h`}
            />
          </dl>
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">What the current state does and does not do</p>
            <p className="rp-lp-card__b">{corpus.claim}</p>
            <p className="rp-lp-card__b">
              <strong>Filing on an already-pinned project is never blocked by freshness</strong>, at
              any level of the ladder. Generation reads the pinned mirror, not a live call, so an
              upstream outage cannot stop a filing on a project whose determination is already
              pinned. What degrades is the freshness sentence on the artifact.
            </p>
            <p className="rp-lp-card__b">
              New pins are {corpus.blocksNewPins ? 'currently blocked' : 'currently allowed'}.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- LADDER -- */}
      <section className="rp-stack">
        <h2>Degradation ladder</h2>
        <p className="rp-lp-lead">
          The ladder is a state machine, not a judgement. Each level names its own trigger and its
          own consequences, and this is the level the system is at now.
        </p>
        <dl className="rp-lp-kv rp-lp-card">
          <Row label="Level" value={ladder.level} />
          <Row label="Trigger" value={ladder.trigger} />
          <Row label="Blocks a filing on a pinned project" value="no — at every level" />
          <Row label="Blocks new pins" value={ladder.blocksNewPins ? 'yes' : 'no'} />
          <Row
            label="Suppresses new rate assertions"
            value={ladder.suppressesNewRateAssertions ? 'yes' : 'no'}
          />
          <Row label="Blocks eCPR generation" value={ladder.blocksEcprGeneration ? 'yes' : 'no'} />
          <Row label="Accrues a service credit" value={ladder.accruesCredit ? 'yes' : 'no'} />
          <Row label="Refusal primitive" value={ladder.primitive ?? 'none'} />
        </dl>

        {status.incidents.length === 0 ? (
          <p className="rp-t-data rp-ink-2">No incident is open.</p>
        ) : (
          <div className="rp-tablewrap">
            <table className="rp-table">
              <caption className="rp-sr-only">Open incidents.</caption>
              <thead>
                <tr>
                  <th scope="col">Opened</th>
                  <th scope="col">Level</th>
                  <th scope="col">Scope</th>
                  <th scope="col">Cause</th>
                  <th scope="col">Automatic response</th>
                </tr>
              </thead>
              <tbody>
                {status.incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="rp-td--id">{stamp(incident.openedAt)}</td>
                    <td>{incident.level}</td>
                    <td>{incident.scope}</td>
                    <td>{incident.cause}</td>
                    <td>{incident.autoResponse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------- RECONCILE --- */}
      <section className="rp-stack">
        <h2>Reconciliation against the published index</h2>
        {counts === null ? (
          <p className="rp-t-data rp-ink-2">
            No reconciliation has run yet, so there is no count to publish. This is not zero
            determinations; it is no measurement.
          </p>
        ) : (
          <dl className="rp-lp-kv rp-lp-card">
            <Row label="Counted at" value={stamp(counts.at)} />
            <Row label="Active determinations in our mirror" value={counts.ourActive} />
            <Row label="Active determinations in the index" value={counts.indexTotalActive} />
            <Row label="Delta (rounded up)" value={`${String(counts.deltaPct)}%`} />
            <Row label="Verdict" value={counts.verdict} />
            <Row label="Explained" value={counts.explained ? 'yes' : 'no'} />
          </dl>
        )}
        <p className="rp-legal">
          These are counts with an as-of date, published instead of an adjective. G3 forbids any
          statement of completeness over the corpus until sixty days of reconciliation carry no
          unexplained delta, so this page will not tell you the mirror is complete.
        </p>
      </section>

      {/* -------------------------------------------------------- INGEST ---- */}
      <section className="rp-stack">
        <h2>Last successful ingest</h2>
        {ingest === null ? (
          <p className="rp-t-data rp-ink-2">The nightly corpus ingest has not recorded a run.</p>
        ) : (
          <dl className="rp-lp-kv rp-lp-card">
            <Row label="Job" value={ingest.kind} />
            <Row label="Last run" value={ingest.lastRunAt ?? 'no run recorded'} />
            <Row label="Outcome" value={ingest.lastOutcome} />
            <Row label="Consecutive failures" value={ingest.consecutiveFailures} />
          </dl>
        )}

        {jobs.length > 0 && (
          <details className="rp-disclose">
            <summary>Every scheduled job, with its last outcome</summary>
            <div className="rp-disclose__body">
              <div className="rp-tablewrap">
                <table className="rp-table">
                  <caption className="rp-sr-only">Scheduled jobs and their last outcome.</caption>
                  <thead>
                    <tr>
                      <th scope="col">Job</th>
                      <th scope="col">Last run</th>
                      <th scope="col">Outcome</th>
                      <th scope="col" className="rp-th--num">
                        Consecutive failures
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.kind}>
                        <td className="rp-td--id">{job.kind}</td>
                        <td className="rp-td--id">{job.lastRunAt ?? '—'}</td>
                        <td>{job.lastOutcome}</td>
                        <td className="rp-td--num">{job.consecutiveFailures}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        )}
      </section>

      {/* -------------------------------------------------------- CANARY ---- */}
      <section className="rp-stack">
        <h2>The golden canary&rsquo;s last result</h2>
        <p className="rp-lp-lead">
          A fixed payroll suite is re-scored against the staged corpus before any snapshot is
          promoted and before any release ships. A divergence holds the promotion and fails the
          build; it does not warn.
        </p>
        {canary === null ? (
          <p className="rp-t-data rp-ink-2">
            No canary run has been recorded yet, so there is no result to publish.
          </p>
        ) : (
          <>
            <dl className="rp-lp-kv rp-lp-card">
              <Row label="Ran at" value={canary.at} />
              <Row label="Result" value={canary.green ? 'green — every case matched' : 'RED'} />
              <Row label="Cases matched" value={`${String(canary.passed)} of ${String(canary.total)}`} />
              <Row label="Distinct wage determinations" value={canary.distinctWds} />
              <Row label="Distinct states" value={canary.distinctStates} />
              <Row label="Trigger" value={canary.trigger} />
              <Row label="Build" value={canary.buildSha} />
            </dl>
            {canary.divergence !== null && (
              <div className="rp-alert rp-alert--blocked">
                <span className="rp-alert__glyph" aria-hidden="true">
                  ✕
                </span>
                <p className="rp-alert__title">First divergence, published as recorded</p>
                <div className="rp-alert__body">
                  <pre className="rp-lp-pre">{canary.divergence}</pre>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ------------------------------------------------------- AUTONOMY --- */}
      <section className="rp-stack">
        <h2>Autonomy — the G5 instrument, published raw</h2>
        <p className="rp-lp-lead">
          Every inbound message at every address this company publishes is counted, with no triage
          and no category called &ldquo;didn&rsquo;t need an answer&rdquo;. Human minutes carry a
          one-minute floor, so never replying is the worst strategy rather than the best. The raw
          total is the denominator; anyone can divide it themselves.
        </p>
        {autonomy === null ? (
          <p className="rp-t-data rp-ink-2">
            Nothing has been counted yet. This is the state the counter starts in, and it is
            published as an absence rather than as a zero.
          </p>
        ) : (
          <>
            <dl className="rp-lp-kv rp-lp-card">
              <Row label="Window" value={`${autonomy.windowFrom} → ${autonomy.windowTo}`} />
              <Row label="Inbound messages, all published addresses" value={autonomy.inboundTotal} />
              <Row label="of which machine-classified bulk" value={autonomy.machineClassifiedBulk} />
              <Row label="Counted as human" value={autonomy.countedAsHuman} />
              <Row label="Human minutes, floor-adjusted" value={autonomy.humanMinutes} />
              <Row label="Paying accounts" value={autonomy.payingAccounts} />
              <Row
                label="Minutes per customer per month (rounded up)"
                value={
                  autonomy.minutesPerCustomerPerMonth === null
                    ? 'no paying accounts — a ratio with a zero denominator is not a number'
                    : autonomy.minutesPerCustomerPerMonth
                }
              />
              <Row
                label="Consecutive days under the ceiling"
                value={`${String(autonomy.daysUnderCeiling)} of ${String(autonomy.daysRequired ?? 0)} required`}
              />
            </dl>
            {autonomy.bulkByRule.length > 0 && (
              <p className="rp-t-data rp-ink-2">
                Each filter is a named machine-checkable rule and is published with its own count:{' '}
                {autonomy.bulkByRule
                  .map((entry) => `${entry.rule}: ${String(entry.count)}`)
                  .join(' · ')}
                . Anything not machine-classifiable counts as human.
              </p>
            )}
          </>
        )}
      </section>

      {/* ---------------------------------------------------------- GATES --- */}
      <section className="rp-stack">
        <h2>The six claim gates</h2>
        <p className="rp-lp-lead">
          Each gate is a counter. While it is locked the product may state the mechanism — what the
          software does — and may not state the outcome. Every gate outcome sentence on this site is
          produced by one function, <span className="rp-num">gateSentence</span>, which takes a
          reading that can only come from these counters and returns nothing while the reading says
          locked; it has no override parameter, and there is no configuration value that can unlock
          a gate. A measured claim that regresses narrows itself on the next refresh.
        </p>
        <div className="rp-lp-grid rp-lp-grid--2">
          {status.gates.map((gate) => (
            <div key={gate.reading.key} className="rp-lp-gate">
              <span className="rp-lp-gate__id">
                {gate.reading.key} · {gate.reading.state.toUpperCase()}
              </span>
              <p className="rp-lp-card__b">{gate.reading.description}</p>
              <p className="rp-lp-gate__now">{gate.mechanism}</p>
              {gate.outcome === null ? (
                <p className="rp-lp-gate__locked">
                  No outcome may be stated for this gate yet. The renderer has no override for
                  this — the sentence is absent because the counter is.
                </p>
              ) : (
                <p className="rp-lp-gate__now">{gate.outcome}</p>
              )}
              <table className="rp-price__meter">
                <caption className="rp-sr-only">Thresholds for {gate.reading.key}.</caption>
                <tbody>
                  {gate.reading.thresholds.map((threshold) => (
                    <tr key={threshold.name}>
                      <th scope="row">{threshold.name}</th>
                      <td>
                        {threshold.actual} / {threshold.required}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- CREDIT --- */}
      <section className="rp-stack">
        <h2>Our own liability cap, in public</h2>
        <dl className="rp-lp-kv rp-lp-card">
          <Row label="Credit ceiling state" value={status.creditCeiling.state} />
          {/* Formatted, not raw. "Ceiling: 100" beside two other integers reads as
              dollars or as a percentage, and both readings are wrong by two orders of
              magnitude IN OUR FAVOUR — on the one figure whose whole purpose is to
              publish a limit on what we will pay. The raw integers stay available at
              /api/status, where a machine reads them. */}
          <Row
            label="Credits posted this incident"
            value={Cents.toDollarString(Cents.of(status.creditCeiling.postedCents))}
          />
          <Row
            label="Credits withheld by the ceiling"
            value={Cents.toDollarString(Cents.of(status.creditCeiling.withheldCents))}
          />
          <Row
            label="Ceiling"
            value={Cents.toDollarString(Cents.of(status.creditCeiling.ceilingCents))}
          />
        </dl>
        <p className="rp-legal">
          The ledger stores those as integer cents and publishes them raw at{' '}
          <span className="rp-num">/api/status</span>. A company that hides its own liability cap is
          running the same play as a competitor&rsquo;s silent rate lookup, so the withheld figure
          is published beside the posted one.
        </p>
        {status.banner !== null && (
          <div className="rp-alert rp-alert--narrowed">
            <span className="rp-alert__glyph" aria-hidden="true">
              ◐
            </span>
            <p className="rp-alert__title">The narrowed claim currently in force</p>
            <div className="rp-alert__body">
              <p>{status.banner}</p>
            </div>
          </div>
        )}
      </section>

      <section className="rp-stack">
        <h2>Queue depth</h2>
        <dl className="rp-lp-kv rp-lp-card">
          <Row label="Pending outbound emails" value={status.queue.pendingEmails} />
          <Row label="Unprocessed Stripe events" value={status.queue.unprocessedStripeEvents} />
          <Row
            label="Oldest restorable backup"
            value={stamp(status.oldestRestorableAt) ?? 'not yet measured'}
          />
        </dl>
      </section>

      <p className="rp-t-data rp-ink-2">
        <Link href="/">Ratepin</Link> · <Link href="/pricing">Pricing</Link> ·{' '}
        <Link href="/legal">Legal and privacy</Link>
      </p>
    </div>
  );
}
