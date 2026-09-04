/**
 * M15 — conversion instrumentation (`LANDING_SPEC.md` §10).
 *
 * **Our own events table, and no third-party script is required for any metric
 * on the page** (PLAN.md A14). If PostHog is never added, the funnel still
 * works; the page makes no third-party request of its own at any point.
 *
 * The split between server and client is deliberate:
 *
 *  - `lp_view` and `lp_demo_query` are emitted **server-side**, from the route
 *    that rendered the thing they measure. The demo is a GET form and a deep
 *    link, so a lookup is a navigation — counting it in the browser would drop
 *    every lookup made with JavaScript off, and `was_covered=false` is the most
 *    commercially valuable signal the page produces.
 *  - Everything a visitor does *inside* one rendered page is emitted by the
 *    tiny inline script below, which is ~1 KB, has no dependencies, and is
 *    entirely optional: with JavaScript off the page is fully functional and
 *    the two events that decide whether the page works are still recorded.
 *
 * `lp_trial_start`, `lp_checkout_start`, `lp_checkout_complete` and the
 * server side of `lp_enterprise_enquiry` are emitted by the flows that own them
 * — the login route and billing (M9) — and are named here so the funnel has one
 * vocabulary. See `REQUESTS.md`.
 */

export const LANDING_EVENTS = {
  view: 'lp_view',
  scrollDepth: 'lp_scroll_depth',
  demoOpen: 'lp_demo_open',
  demoQuery: 'lp_demo_query',
  demoSourceClick: 'lp_demo_source_click',
  samplePackOpen: 'lp_sample_pack_open',
  pricingView: 'lp_pricing_view',
  planToggle: 'lp_plan_toggle',
  ctaClick: 'lp_cta_click',
  trialStart: 'lp_trial_start',
  checkoutStart: 'lp_checkout_start',
  checkoutComplete: 'lp_checkout_complete',
  enterpriseEnquiry: 'lp_enterprise_enquiry',
  faqOpen: 'lp_faq_open',
} as const;

export type LandingEventName = (typeof LANDING_EVENTS)[keyof typeof LANDING_EVENTS];

export const LANDING_EVENT_NAMES: readonly string[] = Object.values(LANDING_EVENTS);

/** The events the browser is allowed to post. The server emits the rest. */
export const CLIENT_EVENT_NAMES: readonly string[] = [
  LANDING_EVENTS.scrollDepth,
  LANDING_EVENTS.demoOpen,
  LANDING_EVENTS.demoSourceClick,
  LANDING_EVENTS.samplePackOpen,
  LANDING_EVENTS.pricingView,
  LANDING_EVENTS.planToggle,
  LANDING_EVENTS.ctaClick,
  LANDING_EVENTS.enterpriseEnquiry,
  LANDING_EVENTS.faqOpen,
];

export const LANDING_EVENT_ENDPOINT = '/lp-events';

export function isClientLandingEvent(name: unknown): name is LandingEventName {
  return typeof name === 'string' && CLIENT_EVENT_NAMES.includes(name);
}

/**
 * The inline script. No framework, no bundle, no third-party request — a
 * `sendBeacon` to our own endpoint, wrapped so that a failure can never take
 * down the path it measures.
 */
export const LANDING_EVENT_SCRIPT = `
(function () {
  var seen = {};
  var start = Date.now();
  function send(name, props) {
    var key = name + ':' + JSON.stringify(props || {});
    if (seen[key]) return;
    seen[key] = 1;
    var body = JSON.stringify({ name: name, props: props || {} });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('${LANDING_EVENT_ENDPOINT}', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('${LANDING_EVENT_ENDPOINT}', {
          method: 'POST', body: body, keepalive: true,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (e) {}
  }

  var depths = [25, 50, 75, 100];
  var ticking = false;
  function depth() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.round(((window.scrollY || 0) / max) * 100) : 100;
    for (var i = 0; i < depths.length; i++) {
      if (pct >= depths[i]) send('lp_scroll_depth', { depth: depths[i], ms: Date.now() - start });
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(depth); }
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var id = entries[i].target.id;
        if (id === 'demo') send('lp_demo_open', { source: 'scroll' });
        if (id === 'pricing') send('lp_pricing_view', { ms_since_view: Date.now() - start });
      }
    }, { threshold: 0.25 });
    var demo = document.getElementById('demo');
    var pricing = document.getElementById('pricing');
    if (demo) io.observe(demo);
    if (pricing) io.observe(pricing);
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var cta = target.closest('[data-cta]');
    if (cta) send('lp_cta_click', { placement: cta.getAttribute('data-cta') });
    var chip = target.closest('[data-testid="source-chip"]');
    if (chip) send('lp_demo_source_click', { host: chip.textContent.trim().slice(0, 80) });
    var toggle = target.closest('[data-lp="plan-toggle"]');
    if (toggle) send('lp_plan_toggle', { to: toggle.getAttribute('data-to') });
    var enterprise = target.closest('[data-lp="enterprise"]');
    if (enterprise) send('lp_enterprise_enquiry', {});
    var demoLink = target.closest('[data-lp="demo-link"]');
    if (demoLink) send('lp_demo_open', { source: 'hero_link' });
  }, true);

  document.addEventListener('toggle', function (event) {
    var node = event.target;
    if (!node || !node.open) return;
    if (node.getAttribute('data-lp') === 'faq') send('lp_faq_open', { which: node.getAttribute('data-faq') });
    if (node.getAttribute('data-lp') === 'sample-pack') send('lp_sample_pack_open', { format: 'inline' });
  }, true);
})();
`.trim();
