/**
 * EmptyState Component Tests
 *
 * Tests for the EmptyState React component.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '@/components/ResultsPanel'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  FileBarChart: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'file-bar-chart-icon'} className={className} />
  ),
}))

describe('EmptyState', () => {
  describe('rendering', () => {
    it('should render with default title and message', () => {
      render(<EmptyState />)

      expect(screen.getByText('No Results')).toBeInTheDocument()
      expect(
        screen.getByText('Run a simulation to see validation results here.')
      ).toBeInTheDocument()
    })

    it('should render with custom title and message', () => {
      render(
        <EmptyState
          title="Custom Title"
          message="Custom message for users"
        />
      )

      expect(screen.getByText('Custom Title')).toBeInTheDocument()
      expect(screen.getByText('Custom message for users')).toBeInTheDocument()
    })

    it('should render the default icon', () => {
      render(<EmptyState />)

      expect(screen.getByTestId('file-bar-chart-icon')).toBeInTheDocument()
    })

    it('should render custom icon when provided', () => {
      const customIcon = <svg data-testid="custom-icon" />
      render(<EmptyState icon={customIcon} />)

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('file-bar-chart-icon')).not.toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<EmptyState className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('layout', () => {
    it('should center content vertically and horizontally', () => {
      const { container } = render(<EmptyState />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('items-center', 'justify-center')
    })

    it('should stack content vertically', () => {
      const { container } = render(<EmptyState />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex-col')
    })
  })
})
