import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * `/dashboard` is the platform template's name for the signed-in home; this
 * product's is `/projects` (UX.md §2, A6), because the first question on a
 * Monday is "which jobs am I filing for". The redirect exists so links minted
 * by the platform — the welcome email's first step, an old bookmark — do not
 * dead-end.
 */
export default function DashboardRedirect() {
  redirect('/projects');
}
