'use client';

/**
 * Theme control — system → light → dark → system.
 *
 * Spec: DESIGN_SYSTEM.md §10 (three theme states, an explicit choice wins in
 * both directions), A12 (light and dark are independently authored palettes, not
 * an inverted filter — which is why this only sets an attribute and never
 * touches a colour).
 *
 * Behaviour is ported from `identity/landing/index.html` so the control means
 * the same thing on the landing page and inside the app (Nielsen #4).
 */

import { useEffect, useState } from 'react';

import { THEME_STORAGE_KEY } from './ThemeScript';

const MODES = ['system', 'light', 'dark'] as const;
type Mode = (typeof MODES)[number];

const NAMES: Record<Mode, string> = { system: 'System', light: 'Light', dark: 'Dark' };

function read(): Mode {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeToggle() {
  // Starts at 'system' on the server and on first client render so the markup
  // matches; the effect below reconciles it with the stored choice that
  // ThemeScript already applied to <html> before paint.
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    setMode(read());
  }, []);

  function cycle() {
    const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length] ?? 'system';
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the attribute still applies for this session */
    }
    if (next === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
    setMode(next);
  }

  return (
    <button
      type="button"
      className="cw-btn cw-btn--quiet cw-btn--sm"
      onClick={cycle}
      aria-label={`Colour theme: ${NAMES[mode]}. Activate to change it.`}
    >
      Theme:&nbsp;<span className="cw-theme__value">{NAMES[mode]}</span>
    </button>
  );
}
