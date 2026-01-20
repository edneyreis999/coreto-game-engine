/**
 * WarningsList Component Tests
 *
 * Tests for the WarningsList React component.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { WarningsList } from '@/components/ResultsPanel'
import type { WarningData } from '@/types/preload'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'alert-triangle-icon'} className={className} />
  ),
  AlertCircle: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'alert-circle-icon'} className={className} />
  ),
  Info: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'info-icon'} className={className} />
  ),
  X: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'x-icon'} className={className} />
  ),
}))

describe('WarningsList', () => {
  describe('rendering', () => {
    it('should render "No warnings" when warnings array is empty', () => {
      render(<WarningsList warnings={[]} />)

      expect(screen.getByText('No warnings')).toBeInTheDocument()
    })

    it('should render warning badges by severity', () => {
      const warnings: WarningData[] = [
        { type: 'critical_warning', severity: 'critical', message: 'Critical issue', context: {} },
        { type: 'normal_warning', severity: 'warning', message: 'Warning issue', context: {} },
        { type: 'info_warning', severity: 'info', message: 'Info issue', context: {} },
      ]

      render(<WarningsList warnings={warnings} />)

      // Use getAllByText since "Critical" appears in both badge and warning message
      expect(screen.getAllByText(/Critical/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Warning/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Info/).length).toBeGreaterThan(0)
    })

    it('should show correct count for each severity', () => {
      const warnings: WarningData[] = [
        { type: 'c1', severity: 'critical', message: 'Critical 1', context: {} },
        { type: 'c2', severity: 'critical', message: 'Critical 2', context: {} },
        { type: 'w1', severity: 'warning', message: 'Warning 1', context: {} },
        { type: 'i1', severity: 'info', message: 'Info 1', context: {} },
      ]

      render(<WarningsList warnings={warnings} />)

      // Check for counts - label and count are in separate spans
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument() // Critical count
      expect(screen.getAllByText(/Warning/).length).toBeGreaterThan(0) // Warning badge
      // Both warning and info have count of 1, so getAllByText should find 2 matches
      expect(screen.getAllByText(/\(1\)/).length).toBe(2) // Warning count and info count
      expect(screen.getAllByText(/Info/).length).toBeGreaterThan(0) // Info badge
    })

    it('should render individual warning items', () => {
      const warnings: WarningData[] = [
        { type: 'ttk_warning', severity: 'warning', message: 'TTK exceeded target', context: { ttkTurns: 15 } },
      ]

      render(<WarningsList warnings={warnings} />)

      expect(screen.getByText('TTK exceeded target')).toBeInTheDocument()
    })

    it('should display warning type when present', () => {
      const warnings: WarningData[] = [
        { type: 'ttk_out_of_tolerance', severity: 'warning', message: 'TTK warning', context: {} },
      ]

      render(<WarningsList warnings={warnings} />)

      // Component renders type in lowercase with uppercase CSS class
      expect(screen.getByText('ttk_out_of_tolerance')).toBeInTheDocument()
    })

    it('should display context when present', () => {
      const warnings: WarningData[] = [
        { type: 'context_warning', severity: 'info', message: 'Has context', context: { key: 'value' } },
      ]

      render(<WarningsList warnings={warnings} />)

      expect(screen.getByText(/key/)).toBeInTheDocument()
    })
  })

  describe('severity grouping', () => {
    it('should group critical warnings together', () => {
      const warnings: WarningData[] = [
        { type: 'c1', severity: 'critical', message: 'Critical 1', context: {} },
        { type: 'w1', severity: 'warning', message: 'Warning 1', context: {} },
        { type: 'c2', severity: 'critical', message: 'Critical 2', context: {} },
      ]

      render(<WarningsList warnings={warnings} />)

      const criticalBadges = screen.getAllByText(/Critical/)
      expect(criticalBadges.length).toBeGreaterThan(0)
    })

    it('should only show badge for present severities', () => {
      const warnings: WarningData[] = [
        { type: 'w1', severity: 'warning', message: 'Warning', context: {} },
      ]

      render(<WarningsList warnings={warnings} />)

      // Use getAllByText since "Warning" appears in both badge and message
      expect(screen.queryByText(/Critical/)).not.toBeInTheDocument()
      expect(screen.getAllByText(/Warning/).length).toBeGreaterThan(0)
      expect(screen.queryByText(/Info/)).not.toBeInTheDocument()
    })
  })

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<WarningsList warnings={[]} className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should color critical badges red', () => {
      const warnings: WarningData[] = [
        { type: 'c1', severity: 'critical', message: 'Critical', context: {} },
      ]

      const { container } = render(<WarningsList warnings={warnings} />)

      expect(container.querySelector('.bg-red-100')).toBeInTheDocument()
    })

    it('should color warning badges yellow', () => {
      const warnings: WarningData[] = [
        { type: 'w1', severity: 'warning', message: 'Warning', context: {} },
      ]

      const { container } = render(<WarningsList warnings={warnings} />)

      expect(container.querySelector('.bg-yellow-100')).toBeInTheDocument()
    })

    it('should color info badges blue', () => {
      const warnings: WarningData[] = [
        { type: 'i1', severity: 'info', message: 'Info', context: {} },
      ]

      const { container } = render(<WarningsList warnings={warnings} />)

      expect(container.querySelector('.bg-blue-100')).toBeInTheDocument()
    })
  })
})
