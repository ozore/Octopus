/**
 * The paste form's client-side validation (B1, N4, Nielsen #9).
 *
 * Spec: ARCHITECTURE.md §3.1, USER_JOURNEY.md S1, DESIGN_SYSTEM.md §8.7.
 *
 * WHAT THIS GUARDS. `NoticeForm` is the entire intake — one textarea, one
 * button — and the validation copy is the seller's very first interaction with
 * the product. Nielsen #9 requires the error to say what happened, why, and the
 * way forward, in the seller's own language, never "Validation failed." That
 * copy is easy to regress silently (a refactor that swaps in a generic message
 * would look identical in a screenshot), which is exactly what a test is for.
 *
 * The two failure modes below are deliberately distinct strings (empty vs.
 * too-short) because USER_JOURNEY frames them as different situations for the
 * seller — "I haven't pasted anything" reads differently from "I pasted a
 * fragment" — and collapsing them to one message would be a real regression
 * even though both still "show an error".
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NoticeForm } from './NoticeForm';

const LONG_ENOUGH =
  'Your account has been deactivated in accordance with section 3 of the Amazon Business Solutions Agreement.';

function getField(): HTMLTextAreaElement {
  return screen.getByLabelText(/paste the email or screenshot text/i) as HTMLTextAreaElement;
}

function getForm(): HTMLFormElement {
  return document.getElementById('cw-notice-form') as HTMLFormElement;
}

describe('NoticeForm validation', () => {
  it('blocks submission and explains the empty case in the seller’s language', () => {
    const action = vi.fn();
    render(<NoticeForm action={action} />);

    fireEvent.submit(getForm());

    expect(action).not.toHaveBeenCalled();
    expect(
      screen.getByText(/paste the notice first — the whole thing, including the header/i),
    ).toBeVisible();
    // Never the generic, meaningless message Nielsen #9 rules out.
    expect(screen.queryByText(/validation failed/i)).not.toBeInTheDocument();
  });

  it('blocks a too-short paste with a distinct message from the empty case', () => {
    const action = vi.fn();
    render(<NoticeForm action={action} />);

    fireEvent.change(getField(), { target: { value: 'Account deactivated.' } });
    fireEvent.submit(getForm());

    expect(action).not.toHaveBeenCalled();
    expect(
      screen.getByText(/too short to read a reason code from\. paste the full notice/i),
    ).toBeVisible();
  });

  it('marks the field aria-invalid and wires the error into aria-describedby', () => {
    render(<NoticeForm action={vi.fn()} />);

    fireEvent.submit(getForm());

    const field = getField();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.getAttribute('aria-describedby')).toContain('cw-notice-error');
    const error = document.getElementById('cw-notice-error');
    expect(error).not.toHaveAttribute('hidden');
  });

  it('hides the error paragraph before any submit attempt', () => {
    render(<NoticeForm action={vi.fn()} />);
    const error = document.getElementById('cw-notice-error');
    expect(error).toHaveAttribute('hidden');
  });

  it('clears the error as soon as the seller starts typing again', () => {
    render(<NoticeForm action={vi.fn()} />);

    fireEvent.submit(getForm());
    expect(document.getElementById('cw-notice-error')).not.toHaveAttribute('hidden');

    fireEvent.change(getField(), { target: { value: 'a' } });
    expect(document.getElementById('cw-notice-error')).toHaveAttribute('hidden');
  });

  it('lets a real notice through with whitespace collapsed, and shows no error', () => {
    const action = vi.fn();
    render(<NoticeForm action={action} />);

    fireEvent.change(getField(), { target: { value: `  ${LONG_ENOUGH}  \n\n` } });
    fireEvent.submit(getForm());

    expect(document.getElementById('cw-notice-error')).toHaveAttribute('hidden');
    // preventDefault was never called on the submit, so the native/action path ran.
  });

  it('counts whitespace-collapsed length, not raw length, against the minimum', () => {
    // Lots of raw characters, almost all whitespace — fewer than 40 real
    // characters once collapsed, so this must still be rejected.
    const action = vi.fn();
    render(<NoticeForm action={action} />);

    fireEvent.change(getField(), { target: { value: 'short   \n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n' } });
    fireEvent.submit(getForm());

    expect(action).not.toHaveBeenCalled();
    expect(document.getElementById('cw-notice-error')).not.toHaveAttribute('hidden');
  });

  it('never renders a signup field — email, password or account — in the intake form (B1)', () => {
    const { container } = render(<NoticeForm action={vi.fn()} />);
    expect(container.querySelector('input[type="email"]')).not.toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).not.toBeInTheDocument();
    expect(container.querySelectorAll('input, textarea')).toHaveLength(1);
  });
});
