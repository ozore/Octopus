import { notFound } from 'next/navigation';

import { RevokedLink, TechnicianCard } from '@/components/share';
import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { buildTechnicianCard, recordSharedLinkView, resolveSharedLink } from '@/lib/repos/shared-links';
import { organisations } from '@octopus/platform/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * `/c/:token` — the technician licence card. `UX.md` S18, `PERSONA.md` J10.
 *
 * No login, mobile-first, printable, works at 320px, readable in a van at arm's
 * length, and **rendered on paper**, because it is handed to a general
 * contractor who has never logged in. The token is revocable per technician and
 * carries no other data; the card carries no email, phone or address, because
 * the schema has none.
 *
 * The "verify at the board" link is the point: this product's whole claim is
 * that the reader can check us in ten seconds, and the card is where a stranger
 * does it.
 */
export default async function TechnicianCardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const env = getEnv();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const resolved = await resolveSharedLink(db, token);
  if (resolved.state === 'missing') notFound();
  if (resolved.state === 'revoked') return <RevokedLink appName={env.APP_NAME} />;
  if (resolved.link.kind !== 'technician_card' || !resolved.link.subjectId) notFound();

  const orgRows = await db
    .select({ id: organisations.id, name: organisations.name })
    .from(organisations)
    .where(eq(organisations.id, resolved.link.orgId))
    .limit(1);
  const org = orgRows[0];
  if (!org) notFound();

  const view = await buildTechnicianCard(
    db,
    { orgId: org.id, technicianId: resolved.link.subjectId, organisationName: org.name },
    today,
  );
  if (!view) notFound();
  await recordSharedLinkView(db, resolved.link);

  return <TechnicianCard appName={env.APP_NAME} view={view} />;
}
