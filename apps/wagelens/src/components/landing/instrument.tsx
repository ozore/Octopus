'use client';

/**
 * ONE client component for the whole page's instrumentation, and no
 * third-party anything (LANDING_SPEC §12: zero third-party scripts).
 *
 * It reads the DOM rather than wrapping every element in a handler:
 *
 *   data-wl-click="event_name"      → fires once when the element is clicked
 *   data-wl-view="event_name"       → fires once when the element is 30% visible
 *   data-wl-prop-<key>="value"      → becomes props on that element's event
 *
 * Two consequences worth stating. The page renders and converts with
 * JavaScript off — nothing here is load-bearing for reading, looking a rate up,
 * or reaching the trial — and every event name is resolved against
 * `LANDING_CLIENT_EVENTS` on the server, so the attribute is a request and not
 * an instruction.
 */

import { useEffect } from 'react';

import { recordLandingEvent } from './actions';

function propsOf(el: HTMLElement): Record<string, string> {
  const props: Record<string, string> = {};
  for (const name of el.getAttributeNames()) {
    if (!name.startsWith('data-wl-prop-')) continue;
    const key = name.slice('data-wl-prop-'.length).replace(/-/g, '_');
    const value = el.getAttribute(name);
    if (value) props[key] = value;
  }
  return props;
}

export function LandingInstrumentation() {
  useEffect(() => {
    const fired = new WeakSet<Element>();

    const send = (el: HTMLElement, name: string) => {
      if (fired.has(el)) return;
      fired.add(el);
      void recordLandingEvent(name, propsOf(el)).catch(() => {
        /* An analytics row is never worth an error in the reader's face. */
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-wl-click]');
      if (target) send(target, target.dataset['wlClick'] as string);
    };
    document.addEventListener('click', onClick, { capture: true });

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            send(el, el.dataset['wlView'] as string);
            observer?.unobserve(el);
          }
        },
        { threshold: 0.3 },
      );
      for (const el of document.querySelectorAll<HTMLElement>('[data-wl-view]')) {
        observer.observe(el);
      }
    }

    return () => {
      document.removeEventListener('click', onClick, { capture: true });
      observer?.disconnect();
    };
  }, []);

  return null;
}
