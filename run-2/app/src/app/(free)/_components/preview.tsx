'use client';

/**
 * S03 — the free preview and download.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1.3 S03 ("*That's the actual form — and it tells me
 * what it isn't.*" — heuristics #2, #4, #1; "Rendered PDF, **DRAFT watermark and
 * withheld signature block, always**, provenance footer with the freshness sentence,
 * 24-hour expiry stated with the exact expiry timestamp"), §1.4 (the expired
 * preview), §1.5 (the one line under the footer), §7.3 (the provenance footer),
 * `DESIGN_SYSTEM.md` §8.7 (the status chip), §8.9 (the provenance footer).
 *
 * ===========================================================================
 * THE PREVIEW IS THE PDF
 *
 * Not an HTML mock-up of the PDF. Heuristics #2 and #4 together: what she is about
 * to hand a general contractor has to be what she is looking at, so the object below
 * is the actual bytes the download button hands over — one render, one artifact, no
 * chance of the screen and the paper disagreeing.
 *
 * ===========================================================================
 * THE EXPIRY IS REAL AND IT IS THE BROWSER'S
 *
 * There is no row anywhere holding this artifact. The bytes live in this browser's
 * `localStorage` under a token, with an explicit expiry stamped on them, and this
 * component sweeps every expired entry on mount. So "free previews are kept 24 hours
 * and then deleted" is a description of a mechanism rather than a promise about a
 * job, and an unknown token is genuinely unrecoverable — which is why the copy does
 * not offer to email it. That would be an email capture dressed as help.
 */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { PREVIEW_KEY_PREFIX, type StoredPreview, type WireArtifact } from '../_lib/wire';

type State =
  | { readonly kind: 'loading' }
  | { readonly kind: 'expired'; readonly expiredAt: string | null }
  | { readonly kind: 'ready'; readonly artifact: WireArtifact };

export function FreePreview({ token }: { readonly token: string }): React.ReactElement {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    let expiredAt: string | null = null;

    // Sweep first, and sweep everything: the deletion is the product's promise, so
    // it must not depend on the visitor happening to open the expired preview.
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key === null || !key.startsWith(PREVIEW_KEY_PREFIX)) continue;
      const raw = window.localStorage.getItem(key);
      if (raw === null) continue;
      let stored: StoredPreview | null = null;
      try {
        stored = JSON.parse(raw) as StoredPreview;
      } catch {
        window.localStorage.removeItem(key);
        continue;
      }
      if (new Date(stored.artifact.expiresAtIso).getTime() <= now) {
        if (key === `${PREVIEW_KEY_PREFIX}${token}`) expiredAt = stored.artifact.expiresAtIso;
        window.localStorage.removeItem(key);
      }
    }

    const raw = window.localStorage.getItem(`${PREVIEW_KEY_PREFIX}${token}`);
    if (raw === null) {
      setState({ kind: 'expired', expiredAt });
      return;
    }
    const stored = JSON.parse(raw) as StoredPreview;
    setState({ kind: 'ready', artifact: stored.artifact });
  }, [token]);

  const artifact = state.kind === 'ready' ? state.artifact : null;

  useEffect(() => {
    if (artifact === null) return;
    const bytes = Uint8Array.from(atob(artifact.pdfBase64), (char) => char.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    setHref(url);
    return () => URL.revokeObjectURL(url);
  }, [artifact]);

  const filename = useMemo(
    () =>
      artifact === null
        ? 'wh347.pdf'
        : `wh347-DRAFT-${artifact.wdNumber}-rev${artifact.revision}-${artifact.generatedAtIso.slice(0, 10)}.pdf`,
    [artifact],
  );

  if (state.kind === 'loading') {
    return <p aria-live="polite">Reading this preview from your browser.</p>;
  }

  if (state.kind === 'expired') {
    return (
      <div className="rp-stack rp-stack--section rp-measure">
        <div className="rp-alert rp-alert--declined">
          <span className="rp-alert__glyph" aria-hidden="true">
            §
          </span>
          <div className="rp-alert__body">
            <p className="rp-alert__title">
              {state.expiredAt === null
                ? 'This preview is not in this browser'
                : `This preview expired at ${stampOf(state.expiredAt)}`}
            </p>
            <p>
              Free previews are kept for 24 hours in the browser that made them, and then deleted.
              Nothing was billed and nothing was kept — there is no copy on our side to restore,
              because the payroll was never written down.
            </p>
            <p>
              Re-entry is a minute of typing, or the same CSV again. We are not going to offer to
              email it to you; that would be an email capture dressed as help.
            </p>
          </div>
        </div>
        <div className="rp-btn-row">
          <Link className="rp-btn rp-btn--primary" href="/wh347">
            Generate another WH-347
          </Link>
        </div>
      </div>
    );
  }

  const ready = state.artifact;

  return (
    <div className="rp-stack rp-stack--section">
      {/* §8.7 — word, glyph, border style, hue. Four channels, in that order, so it
          survives a monochrome laser, a fax and forced-colors. */}
      <p>
        <span className="rp-status rp-status--draft rp-status--lg">
          <span className="rp-status__glyph" aria-hidden="true">
            ✕
          </span>
          DRAFT — NOT CERTIFIABLE
        </span>
      </p>

      <div className="rp-alert rp-alert--blocked">
        <span className="rp-alert__glyph" aria-hidden="true">
          ✕
        </span>
        <div className="rp-alert__body">
          <p className="rp-alert__title">The signature block is withheld on this document</p>
          <p>
            Nothing on this path pinned a revision of record, so the statement of compliance cannot
            be rendered. The block is not greyed out — it is not on the page, because a greyed-out
            signature line photocopies into a signable one.
          </p>
          {ready.unresolvedLineCount > 0 ? (
            <p>
              {ready.unresolvedLineCount === 1
                ? 'One payroll line is also unresolved and is named on the exception report.'
                : `${ready.unresolvedLineCount} payroll lines are also unresolved and are named on the exception report.`}
            </p>
          ) : null}
        </div>
      </div>

      <section className="rp-stack">
        <h2>The form</h2>
        {href === null ? null : (
          <object className="rp-sheet" data={href} type="application/pdf" aria-label="Rendered WH-347">
            <p>
              Your browser will not display the PDF inline. Download it and open it in a reader —
              the bytes are identical either way.
            </p>
          </object>
        )}
        <div className="rp-btn-row">
          {href === null ? null : (
            <a className="rp-btn rp-btn--primary" href={href} download={filename}>
              Download the WH-347 ({ready.pageCount} pages)
            </a>
          )}
          <Link className="rp-btn rp-btn--quiet" href="/wh347">
            Change something and regenerate
          </Link>
        </div>
        <p className="rp-t-micro rp-num">
          This preview expires at {stampOf(ready.expiresAtIso)}. It is held in this browser and
          nowhere else.
        </p>
      </section>

      {/* §8.9 — the provenance footer, shown large. Same lines as the paper. */}
      <section className="rp-stack">
        <h2>Provenance</h2>
        <div className="rp-prov">
          {ready.footer.map((line) => (
            <p
              key={line.id}
              className={`rp-prov__${line.id === 'claim' ? 'claim' : line.id === 'freshness' ? 'freshness' : line.id === 'build' ? 'build' : 'boundary'} rp-num`}
              data-freshness={line.emphasis === 'dated' ? 'dated' : undefined}
            >
              {line.text}
            </p>
          ))}
        </div>
      </section>

      {ready.exceptions.length > 0 ? (
        <section className="rp-stack">
          <h2>Exception report</h2>
          <p className="rp-measure">
            Printed on the last page of the PDF as well as here, so the general contractor reading
            the paper sees exactly what you see.
          </p>
          <ul className="rp-stack rp-stack--tight rp-measure">
            {ready.exceptions.map((sentence) => (
              <li key={sentence}>{sentence}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** `2026-08-14 14:02 UTC`. The zone is named so a reader can convert it; a
 *  locale-converted stamp would depend on a timezone database that ships with the
 *  runtime and changes between releases. */
function stampOf(iso: string): string {
  return `${iso.slice(0, 16).replace('T', ' ')} UTC`;
}
