/**
 * POST /enterprise-enquiry — `specs/09` §Above the cap.
 *
 * The route that makes the Enterprise row real rather than a silence. It is a
 * route and not only a server action because the 16th-state refusal comes from
 * several places (the company form, the billing page, an outbound link), and
 * because the outbound fleet needs something it can point at.
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { createEnterpriseEnquiry } from '@/lib/billing/enterprise';
import { getAdapters } from '@octopus/platform/adapters';
import { getDb } from '@octopus/platform/db';
import { getSession } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return new Response('unauthorized', { status: 401 });

  const contentType = request.headers.get('content-type') ?? '';
  let message: string | null = null;
  if (contentType.includes('application/json')) {
    const body = (await request.json()) as Record<string, unknown>;
    message = typeof body['message'] === 'string' ? body['message'] : null;
  } else {
    const form = await request.formData();
    message = String(form.get('message') ?? '') || null;
  }

  const result = await createEnterpriseEnquiry(
    { db: await getDb(), adapters: getAdapters(), env: getEnv() },
    {
      orgId: session.org.id,
      userId: session.user.id,
      email: session.user.email,
      organisationName: session.org.name,
      message,
    },
  );

  const accepts = request.headers.get('accept') ?? '';
  if (accepts.includes('application/json')) return Response.json({ status: 'created', ...result }, { status: 201 });
  return Response.redirect(new URL('/settings/billing?enquiry=sent', request.url), 303);
}
