/**
 * GET /settings/data/export — the ZIP.
 *
 * A route handler rather than a server action because the answer is a FILE:
 * an action can only redirect. `specs/10` §5 keeps exports working in the
 * read-only state, so this route checks membership and the export capability
 * and deliberately does NOT check `writesAllowed` — reading your own data is
 * never the thing that stops.
 */
import '@/lib/platform';

import { getDb } from '@/lib/db';
import { trackEvent } from '@/lib/events';
import { roleFor } from '@/lib/repos/settings';
import { buildOrgExport } from '@/lib/settings/export';
import { can } from '@/lib/settings/roles';
import { writeAuditEvent } from '@/lib/audit';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  const { org, user, membership } = await requireOrg();
  const db = await getDb();
  const role = await roleFor(db, { orgId: org.id, userId: user.id, platformRole: membership.role });
  if (!can(role, 'export')) return new Response('not found', { status: 404 });

  const archive = await buildOrgExport(db, { orgId: org.id, orgName: org.name });

  await writeAuditEvent(db, {
    orgId: org.id,
    actor: { kind: 'user', userId: user.id, email: user.email },
    kind: 'data.exported',
    subjectType: 'org',
    subjectId: org.id,
    payload: { what: 'the whole organisation', rows: archive.counts['vendors'] ?? 0 },
  });
  await trackEvent(db, {
    name: 'data_exported',
    orgId: org.id,
    userId: user.id,
    props: { bytes: archive.bytes.byteLength },
  });

  return new Response(archive.bytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${archive.filename}"`,
      'cache-control': 'no-store',
    },
  });
}
