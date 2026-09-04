'use client';

import { logOfficialLinkClick } from '../actions';

/**
 * The way out to SAM.gov, instrumented.
 *
 * `official_determination_link_clicked` is **the trust event**: somebody left
 * to check us against the official document. A high number is good news, and
 * WL-11 owns the name — this surface emits it with its own `surface`, exactly
 * as WL-EVENTS.md §7 requires.
 *
 * The anchor keeps its `href` and its `target`, so the click works whether or
 * not the beacon does. Instrumentation never stands between a person and the
 * source.
 */
export function OfficialLink({
  href,
  wdNumber,
  surface,
  children,
  className = 'wl-source',
}: {
  href: string;
  wdNumber: string;
  surface: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      data-testid="official-determination-link"
      onClick={() => {
        void logOfficialLinkClick(wdNumber, surface).catch(() => undefined);
      }}
    >
      {children}
    </a>
  );
}
