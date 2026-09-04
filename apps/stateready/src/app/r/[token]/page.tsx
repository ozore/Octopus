import { notFound } from 'next/navigation';

import { ReadinessSheet, RevokedLink } from '@/components/share';
import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { buildReadinessView, recordSharedLinkView, resolveSharedLink } from '@/lib/repos/shared-links';
import { organisations } from '@octopus/platform/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * M17 — `/r/:token`. `UX.md` S19, `PERSONA.md` J5.
 *
 * > *"Answer in five seconds with something I can forward."*
 *
 * **No login, read-only, revocable, and rendered on paper** — it is outside the
 * `(app)` route group deliberately, so it never touches `requireOrg()` and never
 * inherits the board shell. The token is the whole credential; the row it names
 * decides the scope; a revoked link answers rather than 404ing, because the
 * person holding it is usually a general contractor who needs to know whether
 * to ask for a new one.
 *
 * The 51-tile grid is drawn for a desktop and **hidden below 40rem in favour of
 * the grouped status list**, which carries the same rows in the same order —
 * LAPSED first. 51 tiles at 28px is a poor phone experience and this page is
 * opened on a phone more often than not.
 */
export default async function SharedReadinessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const env = getEnv();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const resolved = await resolveSharedLink(db, token);
  if (resolved.state === 'missing') notFound();
  if (resolved.state === 'revoked') return <RevokedLink appName={env.APP_NAME} />;
  if (resolved.link.kind !== 'readiness') notFound();

  const orgRows = await db
    .select({ id: organisations.id, name: organisations.name })
    .from(organisations)
    .where(eq(organisations.id, resolved.link.orgId))
    .limit(1);
  const org = orgRows[0];
  if (!org) notFound();

  const view = await buildReadinessView(db, { orgId: org.id, organisationName: org.name }, today);
  await recordSharedLinkView(db, resolved.link);

  return <ReadinessSheet appName={env.APP_NAME} view={view} />;
}
