/**
 * `AppealStream` driven entirely by a fake `EventSource` — the client half of
 * the narrated wait USER_JOURNEY.md §6 calls "the single highest-risk UX
 * surface in the product".
 *
 * Spec: USER_JOURNEY.md §6 (Nielsen #1 under a long wait) and §6.4 (the `slow`
 * state is not optional), DESIGN_SYSTEM.md §8.3, ARCHITECTURE.md I2 (every
 * policy reference on screen is a cited clause).
 *
 * The server side of this same contract (`route.test.ts`) already proves the
 * SSE transport narrates every stage and ends. What is untested until now is
 * the OTHER half of that contract: that the component wired to a real
 * `EventSource` actually turns each wire event into the right screen state —
 * per-stage timeline nodes, the slow-state fallback after `SLOW_AFTER_MS`, the
 * cited preview (via `CitationChip`), the escalation card, and the failure
 * panel. A regression here is invisible in the server test and would ship a
 * seller a silent spinner or an uncited clause reaching the DOM.
 */

import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppealStream } from './AppealStream';
import {
  SLOW_AFTER_MS,
  SLOW_LABEL,
  type PreviewPayload,
  type ProgressEvent,
} from '@/app/_lib/progress';
import type { CitedClause, Critique, DraftSections } from '@/lib/domain/types';

// ---------------------------------------------------------------------------
// A minimal, fully-controllable EventSource. jsdom ships none, and the real
// browser class cannot be driven from a test in the first place — the point
// here is to inject wire events synchronously and assert on the render.
// ---------------------------------------------------------------------------
class FakeEventSource {
  static CLOSED = 2;
  static instances: FakeEventSource[] = [];

  url: string;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  readyState = 1;
  closeCalls = 0;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  emit(event: ProgressEvent) {
    this.onmessage?.({ data: JSON.stringify(event) });
  }

  close() {
    this.closeCalls += 1;
    this.readyState = FakeEventSource.CLOSED;
  }
}

function latest(): FakeEventSource {
  const source = FakeEventSource.instances.at(-1);
  if (!source) throw new Error('no EventSource was constructed');
  return source;
}

const clause: CitedClause = {
  citedText: 'Sellers must be able to provide invoices from the supplier on request.',
  clauseId: 'amz.psaa#supplier-invoices',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G201165970',
  documentTitle: 'Amazon — Product Authenticity and Quality policy',
  block: { startBlockIndex: 0, endBlockIndex: 0 },
};

const sections: DraftSections = {
  rootCause: 'Root cause text.',
  correctiveActions: 'Corrective actions text.',
  preventiveMeasures: 'Preventive measures text.',
};

const critique: Critique = {
  readinessScore: 64,
  criteria: [{ id: 'supplier_invoices', met: false, weight: 30, deficiency: 'No invoices cited.' }],
  blockingDeficiencies: ['No invoices cited.'],
  evidenceKitGaps: ['Supplier invoices from the last 365 days'],
};

function makePreview(overrides: Partial<PreviewPayload> = {}): PreviewPayload {
  return {
    caseId: 'case_1',
    reasonCode: 'AMZ.PSAA.INAUTHENTIC',
    plainEnglish: 'You were charged under the Product Authenticity policy.',
    marketplace: 'amazon',
    clauses: [clause],
    sections,
    critique,
    rubricLabels: { supplier_invoices: 'Supplier invoices on file' },
    syntheticCorpus: false,
    recordedModel: true,
    ...overrides,
  };
}

function renderStream() {
  return render(
    <AppealStream
      caseId="case_1"
      startCheckout={vi.fn()}
      requestHumanReview={vi.fn()}
      timeGuaranteeAdvertised={false}
    />,
  );
}

beforeEach(() => {
  FakeEventSource.instances = [];
  vi.stubGlobal('EventSource', FakeEventSource);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('AppealStream — per-stage SSE rendering', () => {
  it('opens a stream scoped to the case id', () => {
    renderStream();
    expect(latest().url).toBe('/api/appeal/case_1/stream');
  });

  it('starts every stage pending, narrated in the seller’s words', () => {
    renderStream();
    const region = screen.getByRole('status', { name: 'Progress on your appeal draft' });
    expect(region).toHaveTextContent('Read your notice');
    expect(region).toHaveTextContent('Identify the policy you were charged under');
  });

  it('moves a stage from pending to active to done as its own events arrive, leaving the rest untouched', () => {
    renderStream();
    const source = latest();

    act(() => source.emit({ type: 'stage', key: 'read', state: 'active' }));
    let region = screen.getByRole('status');
    expect(region).toHaveTextContent('Reading your notice…');
    // The next stage has not moved yet.
    expect(region).toHaveTextContent('Identify the policy you were charged under');

    act(() => source.emit({ type: 'stage', key: 'read', state: 'done' }));
    region = screen.getByRole('status');
    expect(region).toHaveTextContent('Read your notice.');

    act(() => source.emit({ type: 'stage', key: 'identify', state: 'active', detail: 'Reading…' }));
    region = screen.getByRole('status');
    expect(region).toHaveTextContent('Identifying the policy you were charged under…');
  });

  it('carries a spoken state word per node, never colour alone (A6)', () => {
    renderStream();
    const source = latest();
    act(() => source.emit({ type: 'stage', key: 'read', state: 'done' }));
    expect(screen.getByText(/^Done\.$/)).toBeInTheDocument();
  });

  it('flips an active node to the slow state after SLOW_AFTER_MS of silence (§6.4)', () => {
    vi.useFakeTimers();
    renderStream();
    const source = latest();

    act(() => source.emit({ type: 'stage', key: 'draft', state: 'active' }));
    expect(screen.queryByText(SLOW_LABEL)).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(SLOW_AFTER_MS));
    expect(screen.getByText(SLOW_LABEL)).toBeInTheDocument();
  });

  it('does not flip to slow once the stage has already finished before the timer fires', () => {
    vi.useFakeTimers();
    renderStream();
    const source = latest();

    act(() => source.emit({ type: 'stage', key: 'draft', state: 'active' }));
    act(() => source.emit({ type: 'stage', key: 'draft', state: 'done' }));
    act(() => vi.advanceTimersByTime(SLOW_AFTER_MS));

    expect(screen.queryByText(SLOW_LABEL)).not.toBeInTheDocument();
  });

  it('renders the preview’s clauses as CitationChips carrying cited_text and its source (I2)', () => {
    renderStream();
    const source = latest();

    act(() => source.emit({ type: 'preview', preview: makePreview() }));

    const figure = document.querySelector('figure.cw-cite');
    expect(figure).toBeInTheDocument();
    expect(document.querySelector('blockquote.cw-cite__quote')).toHaveTextContent(
      clause.citedText,
    );
    const caption = document.querySelector('figcaption.cw-cite__source');
    expect(caption).toHaveTextContent(clause.documentTitle);
    expect(caption).toHaveTextContent(clause.clauseId);
    const link = screen.getByRole('link', { name: /view the policy page/i });
    expect(link).toHaveAttribute('href', clause.sourceUrl);
  });

  it('shows the reason code and plain-English finding once the preview lands', () => {
    renderStream();
    const source = latest();
    act(() => source.emit({ type: 'preview', preview: makePreview() }));

    expect(screen.getByText('AMZ.PSAA.INAUTHENTIC')).toBeInTheDocument();
    expect(
      screen.getByText('You were charged under the Product Authenticity policy.'),
    ).toBeInTheDocument();
  });

  it('surfaces the critique and the paywall alongside the preview, before any payment', () => {
    renderStream();
    const source = latest();
    act(() => source.emit({ type: 'preview', preview: makePreview() }));

    expect(screen.getByText('What this draft still lacks')).toBeInTheDocument();
    expect(screen.getByText(/what it costs, next to what this usually costs/i)).toBeInTheDocument();
  });

  it('labels a synthetic-corpus run so a fixture clause is never mistaken for the real corpus (LLM_ENGINE §8.1)', () => {
    renderStream();
    const source = latest();
    act(() => source.emit({ type: 'preview', preview: makePreview({ syntheticCorpus: true }) }));

    expect(screen.getByText(/synthetic fixture corpus/i)).toBeInTheDocument();
  });

  it('renders the escalation card, never the cited preview, for a refused category (I5)', () => {
    renderStream();
    const source = latest();
    act(() =>
      source.emit({
        type: 'escalated',
        reason: 'refused_category',
        detail: 'Trademark complaint — outside what a document can fix.',
        disposition: 'refer_out',
      }),
    );

    expect(screen.getByText(/this is a case a document cannot fix/i)).toBeInTheDocument();
    expect(document.querySelector('figure.cw-cite')).not.toBeInTheDocument();
    expect(screen.queryByText(/what it costs, next to what this usually costs/i)).not.toBeInTheDocument();
  });

  it('shows the system-failure panel and states plainly that nothing was charged', () => {
    renderStream();
    const source = latest();
    act(() => source.emit({ type: 'failed', message: 'The model call timed out.' }));

    expect(screen.getByText(/something on our side stopped/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing has been charged/i)).toBeInTheDocument();
    expect(screen.getByText(/the model call timed out\./i)).toBeInTheDocument();
  });

  it('closes the stream on the terminal done event and clears the slow timer', () => {
    vi.useFakeTimers();
    renderStream();
    const source = latest();

    act(() => source.emit({ type: 'stage', key: 'check', state: 'active' }));
    act(() => source.emit({ type: 'done' }));
    expect(source.closeCalls).toBe(1);

    // The slow timer armed for 'check' must not fire after the stream closed.
    act(() => vi.advanceTimersByTime(SLOW_AFTER_MS));
    expect(screen.queryByText(SLOW_LABEL)).not.toBeInTheDocument();
  });

  it('closes the EventSource on unmount so a navigated-away tab stops listening', () => {
    const { unmount } = renderStream();
    const source = latest();
    unmount();
    expect(source.closeCalls).toBe(1);
  });

  it('reconnects rather than restarts when the case id is unchanged across a re-render', () => {
    const { rerender } = renderStream();
    expect(FakeEventSource.instances).toHaveLength(1);

    rerender(
      <AppealStream
        caseId="case_1"
        startCheckout={vi.fn()}
        requestHumanReview={vi.fn()}
        timeGuaranteeAdvertised={false}
      />,
    );
    // React may or may not re-run the effect on an unchanged key, but it must
    // never leave two live connections open to the same case.
    const open = FakeEventSource.instances.filter((s) => s.closeCalls === 0);
    expect(open).toHaveLength(1);
  });
});

describe('AppealStream — no unhandled rejection on a mid-stream drop', () => {
  it('closes gracefully on transport error without throwing', async () => {
    renderStream();
    const source = latest();
    source.readyState = FakeEventSource.CLOSED;
    expect(() => act(() => source.onerror?.())).not.toThrow();
    await waitFor(() => expect(source.closeCalls).toBeGreaterThanOrEqual(1));
  });
});
