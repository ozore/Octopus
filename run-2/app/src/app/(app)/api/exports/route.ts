/**
 * S23b — `GET /api/exports`, the ZIP the export button promises.
 *
 * AUTHORITY: `USER_JOURNEY.md` §12.1 ("One button, one ZIP, no request form and no
 * waiting period — at every tier, in every billing state, including while a payment
 * is failing"), `ARCHITECTURE.md` §9.1 (export is a capability of every money state,
 * which is the reason a non-payer can be restricted without earning a chargeback),
 * §11.3 (an email carries a LINK to this authenticated route, never the file).
 *
 * ===========================================================================
 * WHY THIS ROUTE EXISTS AT ALL
 *
 * The button used to build the bundle into an in-memory sink that was discarded when
 * the request returned, and redirect to `?exported=<key>` — a key naming an object
 * nothing had written, on a screen with no link to it. The customer was told "Export
 * built" and given a string. Under A3 there is nobody to ask for the file, so a
 * promise with no artifact behind it is not a rough edge; it is a dead end on the
 * one screen §12.1 says must never have one.
 *
 * ===========================================================================
 * NO ENTITLEMENT PARAMETER, HERE OR ANYWHERE BELOW
 *
 * There is nothing on this path that could refuse for a reason involving money, and
 * that is deliberate rather than an omission — `deriveEntitlement` returns
 * `canExport: true` in every branch and a second place that could say otherwise would
 * eventually say otherwise. The only refusal available here is "not signed in".
 *
 * THE BYTES ARE REBUILT AND CHECKED, exactly as `/api/artifacts/[id]` does it: the
 * archive may contain a document only when regenerating it reproduces the digest
 * recorded when it was signed. A mismatch leaves the file named in `manifest.json`
 * with its recorded digest and the reason, rather than putting different bytes in the
 * customer's evidence bundle under the same name.
 */

import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { buildExport, createZipSink } from '@/platform/account/export';

import { readAs, requireSession } from '../../_lib/auth';
import { appClock } from '../../_lib/deps';
import { listFilings, rebuildFiling } from '../../_lib/filings';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession('/app/settings/data');
  const db = await getDb();
  const clock = appClock();

  // Rebuilt FIRST, in one transaction of its own, so the bundle walk below is not
  // holding a tenant transaction open while a second one renders PDFs.
  const rebuilt = await readAs(session, async (tx) => {
    const produced = new Map<string, { readonly bytes: Uint8Array; readonly sha256: string }>();
    for (const filing of await listFilings(tx)) {
      const document = await rebuildFiling(db, tx, filing.id);
      if (document === null) continue;
      produced.set(`${filing.id}:wh347_pdf`, {
        bytes: new Uint8Array(document.pdf),
        sha256: document.pdfSha256,
      });
    }
    return produced;
  });

  const sink = createZipSink();
  const bundle = await buildExport(db, session.accountId, {
    sink,
    clock,
    artifactBytes: async ({ filingId, kind }) => rebuilt.get(`${filingId}:${kind}`) ?? null,
  });
  const bytes = sink.finish(bundle.generatedAt);

  const filename = `ratepin-export-${bundle.generatedAt.toISOString().slice(0, 10)}.zip`;
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'private, no-store',
      'x-ratepin-export-filings': String(bundle.filingCount),
    },
  });
}
