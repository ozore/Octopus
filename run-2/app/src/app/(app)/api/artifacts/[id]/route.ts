/**
 * S17 — `/api/artifacts/[id]`, the artifact bytes.
 *
 * AUTHORITY: `ARCHITECTURE.md` §3.1 (the route), I6 (the sha256 IS the identity),
 * `USER_JOURNEY.md` §7.6 ("Artifact generation is deterministic; the object store is
 * a cache of a pure function. Losing it is an availability problem, never a
 * correctness one").
 *
 * ===========================================================================
 * THE BYTES ARE REBUILT AND THEN CHECKED AGAINST THE RECORDED DIGEST
 *
 * The filing stores its inputs and the digest of what those inputs rendered to. This
 * route re-renders and compares. A mismatch is a 409 with both digests printed —
 * never a silent serve of different bytes under the same filing id — because the one
 * thing a certified-payroll archive may not do is hand back a document that is not
 * the document that was signed.
 *
 * ===========================================================================
 * THREE KINDS, AND EVERY ONE OF THEM IS SERVED
 *
 *   wh347_pdf         the federal form and the statement of compliance
 *   ecpr_xml          California's transmittal — its own status, its own gates,
 *                     and the only response in this product that carries full
 *                     nine-digit Social Security numbers
 *   exception_report  the sentences behind a DRAFT
 *
 * The list is exhaustive on purpose: a `kind` the filing screen offers and this
 * route does not name is R-BUILD correctness C-3, and `tests/web/app.test.ts` holds
 * that pair of files to it as a property.
 */

import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { sha256Hex as digestOf } from '@/platform/ids';

import { readAs, requireSession } from '../../../_lib/auth';
import { ecprArtifact, listArtifacts, rebuildFiling } from '../../../_lib/filings';
import { readProject } from '../../../_lib/projects';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { readonly params: Promise<{ readonly id: string }> },
): Promise<NextResponse> {
  const { id } = await context.params;
  const kind = new URL(request.url).searchParams.get('kind') ?? 'wh347_pdf';
  const session = await requireSession(`/app/filings/${id}`);
  const db = await getDb();

  const view = await readAs(session, async (tx) => {
    const rebuilt = await rebuildFiling(db, tx, id);
    if (rebuilt === null) return null;
    const project = await readProject(tx, rebuilt.filing.projectId);
    if (project === null) return null;
    return {
      rebuilt,
      artifacts: await listArtifacts(tx, id),
      // Built only when it is asked for. The eCPR decrypts nothing the PDF path
      // needs, and a PDF download should not pay for a California document.
      ecpr: kind === 'ecpr_xml' ? await ecprArtifact(db, tx, { rebuilt, project }) : null,
    };
  });

  if (view === null) {
    return NextResponse.json({ error: 'no such filing on this account' }, { status: 404 });
  }

  if (kind === 'exception_report') {
    return new NextResponse(view.rebuilt.exceptions.join('\n\n'), {
      status: 200,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'content-disposition': `attachment; filename="exceptions-${id.slice(0, 8)}.txt"`,
        'cache-control': 'private, no-store',
      },
    });
  }

  /**
   * THE CALIFORNIA eCPR XML — R-BUILD CORRECTNESS C-3.
   *
   * This branch used to be a blanket 409 for every kind but the PDF, with a body
   * claiming "the filing screen states which condition is unmet" while the screen
   * was rendering *Generated, not acceptance-tested* and a link straight here.
   * `renderEcprXml` had no caller anywhere in the product.
   *
   * It now serves the file. `ecprArtifact` is the same call the filing screen makes,
   * so the screen and this route cannot disagree: the link exists only when that
   * function returned bytes, and a 409 here means the answer changed between the two
   * requests — a schema hash that moved, an identifier that was cleared — rather
   * than the two halves of the product having different opinions.
   *
   * A refusal is returned WHOLE. The four primitives carry their own headline and
   * sentence and offer nobody to contact, so the honest thing to hand back is the
   * refusal rather than a paraphrase of it invented at the boundary (A3).
   */
  if (kind === 'ecpr_xml') {
    const outcome = view.ecpr;
    if (outcome === null || outcome.kind === 'blocked') {
      return NextResponse.json(
        {
          error: outcome?.headline ?? 'The California eCPR XML is not available for this filing.',
          detail: outcome?.detail ?? '',
          primitive: outcome?.refusal?.primitive ?? null,
          // The per-item report, when the refusal carries one. It is the half a
          // customer can act on — the missing field, named, worker by worker — and
          // dropping it would leave a 409 that says only "blocked".
          blocking:
            outcome?.refusal?.primitive === 'P-B' ? outcome.refusal.exceptionReport : [],
          note:
            'The California XML carries its own status, separate from the WH-347. Your WH-347 ' +
            'PDF is unaffected by everything above and is still available from this filing.',
        },
        { status: 409 },
      );
    }

    const bytes = Buffer.from(outcome.artifact.xml, 'utf8');
    const digest = digestOf(bytes);
    const recordedXml = view.artifacts.find((artifact) => artifact.kind === 'ecpr_xml');
    if (recordedXml && recordedXml.sha256 !== digest) {
      return NextResponse.json(
        {
          error: 'regenerated bytes do not match the recorded digest',
          recorded: recordedXml.sha256,
          rebuilt: digest,
          note:
            'Ratepin will not serve a document that is not the document it recorded. Both digests ' +
            'are printed above so the difference is checkable rather than asserted.',
        },
        { status: 409 },
      );
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'content-disposition': `attachment; filename="ecpr-${view.rebuilt.filing.weekEnding}-${id.slice(0, 8)}.xml"`,
        // This body carries nine-digit Social Security numbers for the whole crew.
        // No store, no cache, and no presigned redirect (§3.1): an authorization
        // decision per request rather than per URL.
        'cache-control': 'private, no-store',
        'x-ratepin-sha256': digest,
        'x-ratepin-xsd-sha256': String(outcome.artifact.xsdSha256),
      },
    });
  }

  if (kind !== 'wh347_pdf') {
    // The unknown kind is NOT echoed back. It is unvalidated input from the query
    // string, and a response body that reflects it is a gadget waiting for a
    // content-type mistake; the list of what does exist is the useful half anyway.
    return NextResponse.json(
      {
        error: 'Ratepin does not emit an artifact of that kind for this filing.',
        available: ['wh347_pdf', 'ecpr_xml', 'exception_report'],
      },
      { status: 404 },
    );
  }

  const recorded = view.artifacts.find((artifact) => artifact.kind === 'wh347_pdf');
  if (recorded && recorded.sha256 !== view.rebuilt.pdfSha256) {
    return NextResponse.json(
      {
        error: 'regenerated bytes do not match the recorded digest',
        recorded: recorded.sha256,
        rebuilt: view.rebuilt.pdfSha256,
        note:
          'Ratepin will not serve a document that is not the document it recorded. Both digests ' +
          'are printed above so the difference is checkable rather than asserted.',
      },
      { status: 409 },
    );
  }

  return new NextResponse(Buffer.from(view.rebuilt.pdf), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="wh347-${view.rebuilt.filing.weekEnding}-${id.slice(0, 8)}.pdf"`,
      'cache-control': 'private, no-store',
      'x-ratepin-sha256': view.rebuilt.pdfSha256,
    },
  });
}
