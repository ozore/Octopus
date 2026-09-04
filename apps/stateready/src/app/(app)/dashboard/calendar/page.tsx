import Link from 'next/link';

import { CalendarGrid, ExpiringList } from '@/components/board';
import { getDb } from '@/lib/db';
import { buildBoard, buildCalendar, shiftMonth } from '@/lib/repos/board';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * `/dashboard/calendar` — `specs/07` §Other views.
 *
 * A month grid over the same data as the runway. It exists because it reveals
 * **the North Carolina 31 December wall and the Florida August cliff visually**,
 * and those two pictures sell the expansion report better than any copy: a
 * coordinator who sees fourteen renewals stacked on one square understands the
 * problem without being told about it.
 */
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const one = (key: string): string | null => {
    const value = params[key];
    return typeof value === 'string' && value !== '' ? value : null;
  };
  const month = one('month') ?? today.slice(0, 7);
  const state = one('state');

  const model = await buildBoard(db, org.id, today, { state });
  const calendar = buildCalendar(model.cards, month);
  const suffix = state ? `&state=${state}` : '';

  return (
    <>
      <p className="sr-eyebrow">
        <Link href={`/dashboard${state ? `?state=${state}` : ''}`}>The board</Link> · Calendar
      </p>
      <div className="sr-row sr-row--between">
        <h1 className="sr-mb-0">{calendar.label}</h1>
        <span className="sr-row">
          <Link className="sr-btn sr-btn--ghost" href={`/dashboard/calendar?month=${shiftMonth(month, -1)}${suffix}`}>
            Previous
          </Link>
          <Link className="sr-btn sr-btn--ghost" href={`/dashboard/calendar?month=${shiftMonth(month, 1)}${suffix}`}>
            Next
          </Link>
        </span>
      </div>
      <p className="sr-meta" data-testid="calendar-total">
        {calendar.total} deadline{calendar.total === 1 ? '' : 's'} this month
        {state ? ` in ${state}` : ''}.
      </p>

      <CalendarGrid month={calendar} />

      <section className="sr-mt-6">
        <h2 className="sr-eyebrow">The same month, as a list</h2>
        <ExpiringList cards={model.cards.filter((card) => card.dueOn.startsWith(month))} />
      </section>
    </>
  );
}
