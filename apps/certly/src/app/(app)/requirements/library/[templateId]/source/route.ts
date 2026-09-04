/**
 * `template_source_opened` — `specs/02` §10, the honest test of differentiator
 * D3.
 *
 * A source link is the product's central claim: the number beside your
 * requirement came from a document, on a date, at a URL you can open. Whether
 * anyone OPENS one is the measurable version of that claim, and `specs/02` §10
 * says so in as many words — "if nobody ever clicks a source, sourcing is
 * marketing rather than product, and the Should list gets re-ranked".
 *
 * So the anchor points here, this handler records the event, and then it
 * redirects to the real document. The alternative — client-side JavaScript on
 * an anchor — measures the click only when the script has loaded and only when
 * the link was clicked rather than opened in a new tab, which is exactly the
 * case a customer uses for a PDF.
 *
 * THE REDIRECT IS ALLOWLISTED TO THE TEMPLATE'S OWN SOURCES. An open redirect
 * behind a session cookie is a phishing primitive; a URL that is not one of
 * this template's `sources[].url` gets a 404, not a redirect.
 */

import { NextResponse } from 'next/server';

import { getDb } from '@/lib/db';
import { getTemplate } from '@/lib/templates';
import { track } from '@octopus/platform/events';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> },
): Promise<Response> {
  const { org, user } = await requireOrg();
  const { templateId } = await params;
  const template = getTemplate(templateId);
  if (!template) return new NextResponse('Not found', { status: 404 });

  const wanted = new URL(request.url).searchParams.get('url') ?? '';
  const source = template.sources.find((entry) => entry.url === wanted);
  if (!source) return new NextResponse('Not found', { status: 404 });

  const db = await getDb();
  await track(db, {
    name: 'template_source_opened',
    orgId: org.id,
    userId: user.id,
    props: { url: source.url, template_id: template.id, last_verified: source.last_verified },
  });

  return NextResponse.redirect(source.url, 307);
}
