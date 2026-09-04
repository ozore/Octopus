import Link from 'next/link';

import { EmptyState, Panel } from '@/components/primitives';

export const dynamic = 'force-dynamic';

/** WL-08 owns this screen. See apps/wagelens/BUILD.md. */
export default function AlertsPage() {
  return (
    <>
      <h1>Alerts</h1>
      <Panel title="Determination changes">
        <EmptyState
          title="Determination-change alerts are not built yet."
          action={
            <p className="wl-sm">
              The corpus already detects a new modification and records it; the alert screen and its email are next. Until then
              you can pin a project&rsquo;s determination and read its classifications from{' '}
              <Link href="/projects">Projects</Link>.
            </p>
          }
        />
      </Panel>
    </>
  );
}
