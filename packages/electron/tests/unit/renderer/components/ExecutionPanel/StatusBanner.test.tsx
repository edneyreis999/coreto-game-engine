/**
 * StatusBanner Component Tests
 *
 * Tests for the StatusBanner React component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBanner } from '@/components/ExecutionPanel';

describe('StatusBanner', () => {
  describe('rendering', () => {
    it('should render success variant', () => {
      render(<StatusBanner variant="success" message="Operation successful" />);

      expect(screen.getByText('Operation successful')).toBeInTheDocument();
    });

    it('should render error variant', () => {
      render(<StatusBanner variant="error" message="Operation failed" />);

      expect(screen.getByText('Operation failed')).toBeInTheDocument();
    });

    it('should render with subtitle', () => {
      render(
        <StatusBanner variant="success" message="Success" subtitle="Additional details" />
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Additional details')).toBeInTheDocument();
    });

    it('should render without subtitle', () => {
      render(<StatusBanner variant="error" message="Error occurred" />);

      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.queryByText(/Additional details/)).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      render(
        <StatusBanner variant="success" message="Test" className="custom-class" />
      );

      const banner = screen.getByText('Test').closest('.custom-class');
      expect(banner).toBeInTheDocument();
    });

    it('should have success variant classes', () => {
      render(<StatusBanner variant="success" message="Success" />);

      const banner = screen.getByText('Success').closest('.bg-green-50');
      expect(banner).toBeInTheDocument();
    });

    it('should have error variant classes', () => {
      render(<StatusBanner variant="error" message="Error" />);

      const banner = screen.getByText('Error').closest('.bg-red-50');
      expect(banner).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('should show icon for success variant', () => {
      render(<StatusBanner variant="success" message="Success" />);

      const banner = screen.getByText('Success').parentElement?.parentElement;
      const icon = banner?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should show icon for error variant', () => {
      render(<StatusBanner variant="error" message="Error" />);

      const banner = screen.getByText('Error').parentElement?.parentElement;
      const icon = banner?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });
});
