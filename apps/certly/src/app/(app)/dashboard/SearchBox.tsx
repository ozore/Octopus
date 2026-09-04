'use client';

/**
 * GLOBAL SEARCH — `UX.md` §3.1. `/` focuses it.
 *
 * The answer is in the RESULT ROW: the pill and the next expiry are rendered
 * beside the name, so opening the vendor is optional. That is the two-second
 * job the whole dashboard is built around, and it is why the results panel
 * carries the §F.1 disclaimer — a row that renders a status is one of the
 * eleven surfaces (KB §F.4, REVIEW.md MJ-06).
 *
 * This is the only client component on the screen, and it exists for one
 * reason: a keyboard shortcut cannot be expressed in HTML. The search itself is
 * a plain GET form, so it works with JavaScript off and the query lives in the
 * URL — shareable and reloadable, like every other filter here.
 */

import { useEffect, useRef } from 'react';

export function SearchBox({ defaultValue }: { defaultValue: string }) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) return;
      event.preventDefault();
      input.current?.focus();
      input.current?.select();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <form action="/dashboard" method="get" role="search" className="c-gap-2">
      <input
        ref={input}
        className="c-input"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search vendors — press /"
        aria-label="Search vendors"
        data-testid="global-search"
      />
      <button className="c-btn c-btn--secondary c-btn--sm" type="submit">
        Search
      </button>
    </form>
  );
}
