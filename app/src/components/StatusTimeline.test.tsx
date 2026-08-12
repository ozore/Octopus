/**
 * The timeline is the surface USER_JOURNEY.md §6 calls the highest-risk in the
 * product, and two of its properties are the kind that decay silently:
 *
 *  - A6, colour is never the sole carrier of meaning. Every node state must
 *    carry a glyph AND a word. A restyle that drops the visually-hidden state
 *    word leaves the timeline looking correct and reading as nothing.
 *  - A11, status changes are announced. The list must sit inside a polite live
 *    region, `aria-atomic="false"`, so only the changed node is spoken rather
 *    than the whole timeline on every transition.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusTimeline, type TimelineNode } from './StatusTimeline';

const nodes: TimelineNode[] = [
  { id: 'read', label: 'Read your notice.', state: 'done' },
  { id: 'identify', label: 'Identifying the policy…', state: 'active' },
  { id: 'clause', label: 'Still working — your draft is not lost.', state: 'slow' },
  { id: 'draft', label: 'This one needs a person.', state: 'blocked' },
  { id: 'check', label: 'Double-check our own draft', state: 'pending' },
];

describe('StatusTimeline', () => {
  it('announces status changes politely, one node at a time', () => {
    render(<StatusTimeline nodes={nodes} label="Progress" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'false');
  });

  it('carries a spoken state word for every node, not colour alone (A6)', () => {
    render(<StatusTimeline nodes={nodes} label="Progress" />);
    expect(screen.getByText(/^Done\.$/)).toBeInTheDocument();
    expect(screen.getByText(/^In progress\.$/)).toBeInTheDocument();
    expect(screen.getByText(/^Taking longer than usual\.$/)).toBeInTheDocument();
    expect(screen.getByText(/^Needs a person\.$/)).toBeInTheDocument();
    expect(screen.getByText(/^Not started yet\.$/)).toBeInTheDocument();
  });

  it('exposes each node state to CSS as data-state, on a list item', () => {
    const { container } = render(<StatusTimeline nodes={nodes} label="Progress" />);
    const items = [...container.querySelectorAll('li.cw-timeline__node')];
    expect(items).toHaveLength(5);
    expect(items.map((li) => li.getAttribute('data-state'))).toEqual([
      'done',
      'active',
      'slow',
      'blocked',
      'pending',
    ]);
  });

  it('is an ordered list, so position is conveyed structurally', () => {
    const { container } = render(<StatusTimeline nodes={nodes} label="Progress" />);
    expect(container.querySelector('ol.cw-timeline')).toBeInTheDocument();
  });
});
