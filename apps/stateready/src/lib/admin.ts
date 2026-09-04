/**
 * The admin console — `specs/13` §Screens, and its access rule.
 *
 * **404, not 403, for a session that is not on the allowlist.** A 403 confirms
 * the page exists; the pages behind this guard are the founder's whole read on
 * the business and there is nothing to gain by telling a stranger they are
 * there. And **no role in the database can grant access**: the allowlist is an
 * environment variable, so an escalation bug in the membership model cannot
 * reach these pages at all (`specs/13` §Screens, AC5).
 *
 * A request with NO session and no secret gets 401 rather than 404, because
 * that is the machine door — the ops secret is how an agent or a curl reads the
 * console, it is the platform's own convention for `/admin`, and answering 404
 * to a missing credential would make an incident harder to debug for no
 * security gain. `tests/admin.test.ts` pins both answers.
 *
 * The pages are RENDERED HTML rather than React, for the same reason the
 * platform's own admin table is: they sit outside the `(app)` layout, they are
 * read by one person and one agent, and a route handler can answer 401 and 404
 * without a redirect.
 */

import { getEnv } from '@/env';
import { secretsMatch } from '@octopus/platform/auth';
import { getSession } from '@octopus/platform/next';

export type AdminAccess =
  | { status: 'ok'; via: 'secret' | 'session'; email?: string }
  | { status: 'not_found' }
  | { status: 'unauthorized' };

export function adminEmails(raw: string): string[] {
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

export async function checkAdminAccess(request: Request): Promise<AdminAccess> {
  const env = getEnv();
  const url = new URL(request.url);
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : '';
  const provided = bearer || request.headers.get('x-ops-secret') || url.searchParams.get('secret');

  if (env.OPS_SHARED_SECRET && secretsMatch(provided, env.OPS_SHARED_SECRET)) {
    return { status: 'ok', via: 'secret' };
  }

  const session = await getSession().catch(() => null);
  if (session) {
    const allowed = adminEmails(env.ADMIN_EMAILS);
    if (allowed.includes(session.user.email.toLowerCase())) {
      return { status: 'ok', via: 'session', email: session.user.email };
    }
    // Do not confirm the page exists to somebody who is signed in and is not us.
    return { status: 'not_found' };
  }

  return { status: 'unauthorized' };
}

export function adminRefusal(access: AdminAccess): Response {
  return access.status === 'not_found'
    ? new Response('not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })
    : new Response('unauthorized', { status: 401, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

const escape = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const NAV: Array<{ href: string; label: string }> = [
  { href: '/admin', label: 'Thresholds' },
  { href: '/admin/funnel', label: 'Funnel' },
  { href: '/admin/cohorts', label: 'Cohorts' },
  { href: '/admin/revenue', label: 'Revenue' },
  { href: '/admin/health', label: 'Health' },
  { href: '/admin/organisations', label: 'Organisations' },
  { href: '/admin/kb', label: 'Knowledge base' },
];

/**
 * The console's own chrome. Greys only — the board's colour families belong to
 * the product, and this page is an instrument for one reader.
 */
export function adminPage(title: string, body: string, secret: string | null): string {
  const q = secret ? `?secret=${encodeURIComponent(secret)}` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)} — StateReady admin metrics</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; margin: 0; padding: 24px; max-width: 78rem; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 17px; margin: 28px 0 8px; }
  nav a { margin-right: 14px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; margin-block: 8px 20px; }
  th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #8884; vertical-align: top; }
  th { font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; opacity: .7; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 14px; }
  .card { border: 1px solid #8884; border-radius: 8px; padding: 14px; }
  .big { font-size: 30px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .muted { opacity: .68; font-size: 13px; }
  .verdict { display: inline-block; border: 1px solid currentColor; border-radius: 4px; padding: 1px 7px; font-size: 12px; text-transform: uppercase; letter-spacing: .05em; }
  .bar { height: 7px; background: #8883; border-radius: 4px; overflow: hidden; margin-top: 8px; }
  .bar span { display: block; height: 7px; background: currentColor; }
  code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 13px; }
</style></head><body>
<h1>StateReady admin metrics · ${escape(title)}</h1>
<nav class="muted">${NAV.map((item) => `<a href="${item.href}${q}">${escape(item.label)}</a>`).join('')}</nav>
${body}
<p class="muted">All cohorts are computed in UTC. Internal organisations are excluded from every number.
This page emits <code>admin_viewed</code> and nothing else: the admin pages must not pollute the
metrics they show.</p>
</body></html>`;
}

export function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export { escape as escapeHtml };
