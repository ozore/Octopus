import { isClientLandingEvent } from '@/components/marketing/events';
import { allowEventBeacon, recordLandingEvent } from '@/components/marketing/track';

/**
 * `POST /lp-events` — the landing page's own analytics endpoint.
 *
 * It exists so that **no third-party script is required for any metric on the
 * page** (PLAN.md A14, `LANDING_SPEC.md` §10). It accepts only the nine event
 * names the inline script is allowed to send — `lp_view` and `lp_demo_query`
 * are emitted server-side and a browser may not forge them — sanitises the
 * properties to a handful of short primitives, and answers 204 whatever
 * happens, because a beacon that reports an error to a marketing page is worse
 * than one that silently drops.
 *
 * No cookie is set, no identifier is minted and no IP address is stored: the
 * rate-limit bucket is a truncated hash (`track.ts`).
 */
export const dynamic = 'force-dynamic';

const MAX_PROPS = 10;
const MAX_STRING = 120;

function sanitise(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(output).length >= MAX_PROPS) break;
    if (!/^[a-z0-9_]{1,32}$/i.test(key)) continue;
    if (typeof value === 'string') output[key] = value.slice(0, MAX_STRING);
    else if (typeof value === 'number' && Number.isFinite(value)) output[key] = value;
    else if (typeof value === 'boolean') output[key] = value;
  }
  return output;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const beacon = await allowEventBeacon();
    if (!beacon.allowed) return new Response(null, { status: 204 });

    const body: unknown = await request.json();
    const payload = body && typeof body === 'object' ? (body as { name?: unknown; props?: unknown }) : {};
    if (!isClientLandingEvent(payload.name)) return new Response(null, { status: 204 });

    await recordLandingEvent(payload.name, sanitise(payload.props));
  } catch {
    // A dropped metric is a rounding error; a 500 on a marketing page is not.
  }
  return new Response(null, { status: 204 });
}
