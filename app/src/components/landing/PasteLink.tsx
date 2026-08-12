'use client';

/**
 * Every pricing CTA points at the same box, because every tier starts in the
 * same place: you read your clause first, then you decide.
 *
 * Ported from `identity/landing/index.html` script (3) — moving the caret into
 * the textarea is the whole point of the click, and a bare `#paste` jump lands
 * the viewport without landing the focus.
 */

export function PasteLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      className="cw-btn cw-btn--secondary cw-btn--block"
      href="#paste"
      onClick={() => {
        window.setTimeout(() => {
          document.getElementById('cw-notice')?.focus({ preventScroll: true });
        }, 0);
      }}
    >
      {children}
    </a>
  );
}
