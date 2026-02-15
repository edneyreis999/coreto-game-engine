/**
 * Document Icon Component Tests
 *
 * @see Task 04 - NSD Document Icon Component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { DocumentIcon } from '../../../../../src/assets/icons';

describe('DocumentIcon Component', () => {
  it('should render SVG element with correct props', () => {
    render(<DocumentIcon data-testid="document-icon" />);

    const icon = screen.getByTestId('document-icon');
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
    expect(icon).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
    expect(icon).toHaveAttribute('fill', 'none');
    expect(icon).toHaveAttribute('stroke', 'currentColor');
    expect(icon).toHaveAttribute('stroke-width', '2');
  });

  it('should apply custom className', () => {
    render(<DocumentIcon className="custom-class" data-testid="document-icon" />);

    const icon = screen.getByTestId('document-icon');
    expect(icon).toHaveClass('custom-class');
  });

  it('should pass through additional SVG props', () => {
    render(<DocumentIcon aria-label="Document icon" data-testid="document-icon" />);

    const icon = screen.getByTestId('document-icon');
    expect(icon).toHaveAttribute('aria-label', 'Document icon');
  });

  it('should render document body path', () => {
    render(<DocumentIcon data-testid="document-icon" />);

    const icon = screen.getByTestId('document-icon');
    const paths = icon.querySelectorAll('path');
    expect(paths).toHaveLength(1);
    expect(paths[0]).toHaveAttribute('d', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z');
  });

  it('should render folded corner polyline', () => {
    render(<DocumentIcon data-testid="document-icon" />);

    const icon = screen.getByTestId('document-icon');
    const polylines = icon.querySelectorAll('polyline');
    expect(polylines).toHaveLength(1);
    expect(polylines[0]).toHaveAttribute('points', '14 2 14 8 20 8');
  });

  it('should render content lines', () => {
    render(<DocumentIcon data-testid="document-icon" />);

    const icon = screen.getByTestId('document-icon');
    const lines = icon.querySelectorAll('line');
    expect(lines).toHaveLength(3);
  });
});
