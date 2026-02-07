/**
 * WarningsList Component Tests
 *
 * Tests for the WarningsList React component.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { WarningsList } from '@/components/ResultsPanel'
import type { WarningData } from '@/types/preload'

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

      // Use semantic queries to find badges by their text labels
      expect(screen.getByText('Critical')).toBeInTheDocument()
      expect(screen.getByText('Warning')).toBeInTheDocument()
      expect(screen.getByText('Info')).toBeInTheDocument()
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
    it('should show all severities when present', () => {
      const warnings: WarningData[] = [
        { type: 'c1', severity: 'critical', message: 'Critical 1', context: {} },
        { type: 'w1', severity: 'warning', message: 'Warning 1', context: {} },
        { type: 'i1', severity: 'info', message: 'Info 1', context: {} },
      ]

      render(<WarningsList warnings={warnings} />)

      // Use semantic queries to find badges by their text labels
      expect(screen.getByText('Critical')).toBeInTheDocument()
      expect(screen.getByText('Warning')).toBeInTheDocument()
      expect(screen.getByText('Info')).toBeInTheDocument()
    })

    it('should only show badge for present severities', () => {
      const warnings: WarningData[] = [
        { type: 'w1', severity: 'warning', message: 'Warning', context: {} },
      ]

      render(<WarningsList warnings={warnings} />)

      // Use semantic queries to check badge presence by text labels
      // Using getAllByText for 'Warning' since badge and message both contain it
      expect(screen.queryByText('Critical')).not.toBeInTheDocument()
      expect(screen.getAllByText('Warning').length).toBeGreaterThan(0)
      expect(screen.queryByText('Info')).not.toBeInTheDocument()
    })
  })
})
