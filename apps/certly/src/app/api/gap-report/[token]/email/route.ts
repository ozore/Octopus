/**
 * POST /api/gap-report/<token>/email — `specs/15` §7, §2 step 3.
 *
 * The email is **the only thing asked for**: no password, no card. It is added
 * to no marketing list — §8 requires a separate explicit tick for that and
 * there is none here, deliberately, because the offer's own promise is "no
 * demo, no call".
 *
 * Capturing it starts the queue work. Steps 4-5 run there, so a visitor who
 * closes the tab still gets the report (A5).
 */
import '@/lib/platform';

import { enqueue } from '@octopus/platform/jobs';
import { isValidEmail } from '@octopus/platform/auth';
import { track } from '@octopus/platform/events';

import { getDb } from '@/lib/db';
import { captureEmail, findSessionByToken, listSessionDocuments } from '@/lib/gap-report';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const db = await getDb();
  const session = await findSessionByToken(db, token);
  if (!session) return new Response('unknown report', { status: 404 });

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = String(body?.email ?? '').trim();
  if (!isValidEmail(email)) return Response.json({ error: 'That does not look like an email address.' }, { status: 400 });

  const documents = await listSessionDocuments(db, session.id);
  if (documents.length === 0) {
    return Response.json({ error: 'Add at least one certificate first.' }, { status: 400 });
  }

  await captureEmail(db, { sessionId: session.id, email });
  await enqueue(db, {
    kind: 'certly.render_gap_report',
    payload: { sessionId: session.id },
    dedupeKey: `certly.render_gap_report:${session.id}`,
  });
  await track(db, { name: 'gap_report_processing', props: { documents: documents.length } });

  return Response.json({ status: 'processing', documents: documents.length }, { status: 200 });
}
