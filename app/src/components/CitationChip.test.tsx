/**
 * The citation chip's markup contract is A10, and A10 is binding: assistive
 * technology must convey *quotation plus attribution*, because the citation is
 * the product (ARCHITECTURE.md §3.1, DESIGN_SYSTEM.md §8.5).
 *
 * These assertions are on the SHAPE, not the styling, on purpose. A future
 * refactor that turns the figure into a styled `<div>` would look identical on
 * screen and would silently drop the one property the product's central claim
 * depends on — which is exactly the class of regression a test is for.
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CitationChip } from './CitationChip';
import type { CitedClause } from '@/lib/domain/types';

const clause: CitedClause = {
  citedText: 'Sellers must be able to provide invoices from the supplier on request.',
  clauseId: 'amz.psaa#supplier-invoices',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G201165970',
  documentTitle: 'Amazon — Product Authenticity and Quality policy',
  block: { startBlockIndex: 0, endBlockIndex: 0 },
};

describe('CitationChip', () => {
  it('renders quotation and attribution as a figure/blockquote/figcaption', () => {
    const { container } = render(<CitationChip clause={clause} id="c1" />);

    const figure = container.querySelector('figure.cw-cite');
    expect(figure).toBeInTheDocument();

    const quote = container.querySelector('blockquote.cw-cite__quote');
    expect(quote).toHaveTextContent(clause.citedText);
    // The `cite` attribute is what makes the quotation traceable in markup, not
    // only in the visible caption.
    expect(quote).toHaveAttribute('cite', clause.sourceUrl);

    const caption = container.querySelector('figcaption.cw-cite__source');
    expect(caption).toHaveTextContent(clause.documentTitle);
    expect(caption).toHaveTextContent(clause.clauseId);
  });

  it('renders the quoted text verbatim, never shortened', () => {
    render(<CitationChip clause={clause} />);
    // No ellipsis, no truncation: a shortened quote is a different claim from
    // the one the citation object supports.
    expect(screen.getByText(clause.citedText, { exact: false }).textContent).toContain(
      clause.citedText,
    );
  });

  it('opens the source in a new tab with a safe rel', () => {
    render(<CitationChip clause={clause} />);
    const link = screen.getByRole('link', { name: /view the policy page/i });
    expect(link).toHaveAttribute('href', clause.sourceUrl);
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });
});
