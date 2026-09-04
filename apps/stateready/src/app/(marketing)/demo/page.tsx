import { redirect } from 'next/navigation';

/**
 * `/demo` — the deep-link spelling `LANDING_SPEC.md` §12.2 publishes, kept
 * working against the route `BUILD.md` assigns M15 (`/rulebook`).
 *
 * Two documents named the same page differently and both are in circulation:
 * the spec's outbound emails link `/demo?state=tx&trade=hvac`. Rather than
 * choose one and break the other, this route preserves the query and redirects,
 * so every published link keeps landing on a real answer.
 */
export const dynamic = 'force-dynamic';

export default async function DemoRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const key of ['state', 'trade']) {
    const value = params[key];
    if (typeof value === 'string') query.set(key, value);
  }
  const suffix = query.toString();
  redirect(suffix ? `/rulebook?${suffix}` : '/rulebook');
}
