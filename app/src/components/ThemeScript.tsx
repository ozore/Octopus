/**
 * Pre-paint theme resolution.
 *
 * Spec: DESIGN_SYSTEM.md §10 — three states: system (no attribute), light, dark.
 *
 * This runs BEFORE first paint, in `<head>`, because the alternative is a flash
 * of the wrong palette for a reader who chose dark deliberately at 2am. It is
 * the one inline script in the app; the design system loads no web fonts and
 * makes no external request, so this is also the only thing between the HTML and
 * a painted page.
 */

const SCRIPT = `(function(){try{var m=localStorage.getItem("cw-theme");if(m==="light"||m==="dark"){document.documentElement.setAttribute("data-theme",m);}}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}

export const THEME_STORAGE_KEY = 'cw-theme';
