/**
 * ProgressBar Component Tests
 *
 * Tests for the ProgressBar React component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '@/components/ExecutionPanel';

describe('ProgressBar', () => {
  describe('rendering', () => {
    it('should render with 0% progress', () => {
      const { container } = render(<ProgressBar percentage={0} />);

      const progressBar = container.querySelector('.h-2.w-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render with 50% progress', () => {
      const { container } = render(<ProgressBar percentage={50} />);

      const progressBar = container.querySelector('.h-2.w-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('should render with 100% progress', () => {
      const { container } = render(<ProgressBar percentage={100} />);

      const progressBar = container.querySelector('.h-2.w-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('should clamp values above 100 to 100%', () => {
      const { container } = render(<ProgressBar percentage={150} />);

      const fill = container.querySelector('.bg-primary');
      expect(fill?.getAttribute('style')).toContain('width: 100%');
    });

    it('should clamp values below 0 to 0%', () => {
      const { container } = render(<ProgressBar percentage={-10} />);

      const fill = container.querySelector('.bg-primary');
      expect(fill?.getAttribute('style')).toContain('width: 0%');
    });

    it('should render fill element with correct width', () => {
      const { container } = render(<ProgressBar percentage={75} />);

      const fill = container.querySelector('.bg-primary');
      expect(fill?.getAttribute('style')).toContain('width: 75%');
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<ProgressBar percentage={50} className="custom-class" />);

      const progressBar = container.querySelector('.custom-class');
      expect(progressBar).toBeInTheDocument();
    });

    it('should have default progress bar classes', () => {
      const { container } = render(<ProgressBar percentage={50} />);

      const progressBar = container.querySelector('.relative.h-2.w-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('should have transition classes on fill element', () => {
      const { container } = render(<ProgressBar percentage={50} />);

      const fill = container.querySelector('.transition-all.duration-300.ease-out');
      expect(fill).toBeInTheDocument();
    });
  });
});
