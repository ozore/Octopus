/**
 * S02 — `/wh347/map`, component **M** on the free tier.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1.3 S02 ("Identical component to S14. A free user
 * who later pays meets no new UI"), §5.5, §0.7 heuristic 4.
 *
 * The route is a server component with no data of its own, because there IS no
 * server-side data on this path: the CSV was read in the browser and never
 * uploaded. Everything below the heading is the shared component with a free-tier
 * adapter around it.
 */

import { MapScreen } from '../../_components/map-screen';

export const metadata = {
  title: 'Match your payroll columns — Ratepin',
};

export default function MapPage(): React.ReactElement {
  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Your columns, and the form&rsquo;s fields</h1>
        <p className="rp-t-lead">
          This is the same mapping screen the paid product uses. Nothing about it changes if you
          later open an account — the columns you match here are the columns you would match there.
        </p>
      </section>
      <MapScreen />
    </div>
  );
}
