import type { ReactNode } from 'react';

import { PublicShell } from '@/components/shell';
import { getSession } from '@octopus/platform/next';

/**
 * Runtime config, not build-time config (Twelve-Factor III): every page below
 * reads APP_NAME and the corpus at REQUEST time. Prerendering them would bake
 * one deploy's product name into the bundle — and would fail the build outright
 * in CI, where no environment is set.
 */
export const dynamic = 'force-dynamic';

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  return <PublicShell signedIn={Boolean(session)}>{children}</PublicShell>;
}
