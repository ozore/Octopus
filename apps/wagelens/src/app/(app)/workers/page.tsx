import Link from 'next/link';

import { EmptyState, Panel } from '@/components/primitives';

export const dynamic = 'force-dynamic';

/** WL-04 owns this screen. See apps/wagelens/BUILD.md. */
export default function WorkersPage() {
  return (
    <>
      <h1>Workers</h1>
      <Panel title="Roster">
        <EmptyState
          title="The roster is not built yet."
          action={
            <p className="wl-sm">
              It arrives with classification mapping and the conformance helper. Until then
              you can pin a project&rsquo;s determination and read its classifications from{' '}
              <Link href="/projects">Projects</Link>.
            </p>
          }
        />
      </Panel>
    </>
  );
}
