/**
 * The two list primitives from `identity/samples.html`, as components.
 *
 * `<StatusPill>` — `.wl-pill`. **Never colour alone** (identity principle P3):
 * every pill carries its word, so a status is legible to someone who cannot
 * distinguish the greens from the ambers, and to someone printing in
 * greyscale — which, for a document a general contractor forwards to a
 * contracting officer, is the normal case rather than the accessible one.
 *
 * `<LedgerRow>` — the ruled row the product's lists are made of: a title, a
 * line of meta, and whatever belongs on the right. A document product's list is
 * a ledger, not a set of cards.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';

export type PillTone = 'filed' | 'flag' | 'reject' | 'draft' | 'none';

const PILL_CLASS: Record<PillTone, string> = {
  filed: 'wl-pill wl-pill--filed',
  flag: 'wl-pill wl-pill--flag',
  reject: 'wl-pill wl-pill--reject',
  draft: 'wl-pill wl-pill--draft',
  none: 'wl-pill wl-pill--none',
};

export function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span className={PILL_CLASS[tone]} data-testid="status-pill" data-tone={tone}>
      {children}
    </span>
  );
}

export function LedgerRow({
  title,
  meta,
  side,
  href,
}: {
  title: ReactNode;
  meta?: ReactNode;
  side?: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <span className="wl-ledger__main">
        <span className="wl-ledger__title">{title}</span>
        {meta ? <span className="wl-ledger__meta">{meta}</span> : null}
      </span>
      {side ? <span className="wl-ledger__side">{side}</span> : null}
    </>
  );
  if (href) {
    return (
      <Link className="wl-ledger__row" href={href} data-testid="ledger-row">
        {body}
      </Link>
    );
  }
  return (
    <div className="wl-ledger__row" data-testid="ledger-row">
      {body}
    </div>
  );
}

export function Ledger({ children }: { children: ReactNode }) {
  return <div className="wl-ledger wl-panel">{children}</div>;
}

export function Panel({
  title,
  actions,
  children,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="wl-panel">
      {title ? (
        <header className="wl-panel__head">
          <h2>{title}</h2>
          {actions ? <span className="wl-spacer">{actions}</span> : null}
        </header>
      ) : null}
      <div className="wl-panel__body wl-stack">{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="wl-empty" data-testid="empty-state">
      <p className="wl-strong">{title}</p>
      {children}
      {action}
    </div>
  );
}
