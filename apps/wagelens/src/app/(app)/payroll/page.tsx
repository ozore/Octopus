import Link from 'next/link';

import { EmptyState, Panel } from '@/components/primitives';

export const dynamic = 'force-dynamic';

/** WL-05, WL-06 and WL-07 own this screen. See apps/wagelens/BUILD.md. */
export default function PayrollPage() {
  return (
    <>
      <h1>Payroll</h1>
      <Panel title="This week">
        <EmptyState
          title="The weekly grid is not built yet."
          action={
            <p className="wl-sm">
              It arrives with the hours entry, the WH-347 and the Statement of Compliance. Until then
              you can pin a project&rsquo;s determination and read its classifications from{' '}
              <Link href="/projects">Projects</Link>.
            </p>
          }
        />
      </Panel>
    </>
  );
}
