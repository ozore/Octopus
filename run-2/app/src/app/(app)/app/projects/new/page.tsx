/**
 * S10 — `/app/projects/new`, the six required fields.
 *
 * AUTHORITY: `USER_JOURNEY.md` §4.1, §4.4 (field 6 and the reason it exists), §4.5.
 *
 * The screen is a server component; the form is a client component because two of
 * its behaviours — the inert primary button and the in-place refusal on
 * state-only funding — are behaviours, not renderings.
 */

import Link from 'next/link';

import { getDb } from '@/db';
import { rowsOf } from '@/db';
import { sql } from 'drizzle-orm';

import { createProjectAction } from '../../../_actions/projects';
import { NewProjectForm } from '../../../_components/new-project-form';
import { requireSession } from '../../../_lib/auth';
import { STATE_ONLY_REFUSAL } from '../../../_lib/copy';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Set up a project — Ratepin' };

export default async function NewProjectPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  await requireSession('/app/projects/new');
  const params = await searchParams;
  const db = await getDb();

  const one = (key: string): string | null =>
    typeof params[key] === 'string' ? (params[key] as string) : null;

  // The state and county lists come from the mirror's own coverage, so a county with
  // no rates in the promoted snapshot is not offered as if it had some.
  const states = rowsOf<{ state_code: string }>(
    await db.execute(sql`SELECT DISTINCT state_code FROM county_class_rate ORDER BY state_code`),
  ).map((row) => row.state_code);

  const counties = rowsOf<{ county_name: string }>(
    await db.execute(sql`
      SELECT DISTINCT min(county_name) AS county_name
        FROM county_class_rate
       WHERE (${one('state') ?? null}::text IS NULL OR state_code = ${one('state') ?? null})
       GROUP BY county_name_norm
       ORDER BY 1
    `),
  ).map((row) => row.county_name);

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Set up a project</h1>
        <p className="rp-t-lead">
          Six fields. Five of them describe the job; the sixth decides whether a 40-hour overtime
          premium is computed at all, and it has no safe default in either direction.
        </p>
      </section>

      {one('refused') === 'funding' ? (
        <div className="rp-alert rp-alert--declined">
          <span className="rp-alert__glyph" aria-hidden="true">
            §
          </span>
          <div className="rp-alert__body">
            <p className="rp-alert__title">This is not a Davis-Bacon project</p>
            <p>{STATE_ONLY_REFUSAL}</p>
          </div>
        </div>
      ) : null}

      <NewProjectForm
        action={createProjectAction}
        states={states}
        counties={counties}
        initialWdNumber={one('wd')}
        initialState={one('state')}
        initialCounty={one('county')}
        initialConstructionType={one('type')}
      />

      <section className="rp-stack rp-measure">
        <h2>What happens to the determination you name</h2>
        <p>
          Ratepin writes a pin: the determination number, its revision and its publication date,
          against the corpus snapshot they were read from. The pin is immutable — a re-pin is a new
          row and the old one is kept — which is what makes “what did this project say in August”
          answerable next year.
        </p>
        <p>
          If our newer-revision check has not completed in over 72 hours, the project still saves
          and the pin does not. A pin is an assertion that a revision is the one of record, and we
          do not make that assertion from a check we have not run. The banner names the exact
          timestamp and the pin is written automatically when the check clears.
        </p>
        <p>
          <Link href="/rates">Look up a county and craft first</Link>
        </p>
      </section>
    </div>
  );
}
