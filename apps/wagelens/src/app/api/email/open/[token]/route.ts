/**
 * GET /api/email/open/:token — the 1×1 pixel on a WL-08 alert email.
 *
 * It answers one question and stores one timestamp: did anybody open the
 * message. `wd_alert_email_opened {hours_to_open}` is the metric; the pixel
 * carries no identifier of its own, because the TOKEN is an HMAC over the alert
 * id and the alert id is already scoped to one organisation. No third party is
 * involved, no cookie is set, and nothing about the reader is recorded — not an
 * IP address, not a user agent, not a hash of either.
 *
 * The response is a GIF whatever happens. A tracking pixel that 404s is a
 * broken image in somebody's inbox, and a metric is never worth that.
 */
import '@/lib/platform';

import { markAlertOpened } from '@/lib/alerts/service';
import { emitEvent } from '@/lib/analytics/events';
import { getDb } from '@/lib/db';
import { TOKEN_PURPOSES, verifyOpaque } from '@/lib/tokens';
import { wdChangeAlerts } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** A transparent 1×1 GIF. */
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

function pixel(): Response {
  return new Response(new Uint8Array(PIXEL), {
    status: 200,
    headers: {
      'content-type': 'image/gif',
      'cache-control': 'no-store, no-cache, must-revalidate, private',
      'content-length': String(PIXEL.byteLength),
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await context.params;
  const alertId = verifyOpaque(TOKEN_PURPOSES.alertOpen, token);
  if (!alertId) return pixel();

  try {
    const db = await getDb();
    const first = await markAlertOpened(db, alertId);
    if (first) {
      const [row] = await db
        .select()
        .from(wdChangeAlerts)
        .where(eq(wdChangeAlerts.id, alertId))
        .limit(1);
      const sentAt = row?.emailSentAt ?? row?.createdAt;
      await emitEvent(db, 'wd_alert_email_opened', {
        props: {
          hours_to_open: sentAt
            ? Math.max(0, Math.round((Date.now() - sentAt.getTime()) / 3_600_000))
            : 0,
        },
      });
    }
  } catch (error) {
    // A metric must never break an image in somebody's inbox.
    console.error('wd_alert_open_pixel_failed', String(error));
  }
  return pixel();
}
