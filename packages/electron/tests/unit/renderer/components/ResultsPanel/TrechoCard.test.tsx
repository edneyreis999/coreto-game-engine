/**
 * TrechoCard Component Tests
 *
 * Tests for the TrechoCard React component.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { TrechoCard } from '@/components/ResultsPanel'
import type { TrechoSummaryData } from '@/types/preload'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  CheckCircle2: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  XCircle: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  AlertTriangle: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  ChevronDown: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  ChevronUp: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
}))


const createMockTrecho = (overrides?: Partial<TrechoSummaryData>): TrechoSummaryData => ({
  id: 'trecho-1',
  name: 'Forest Battles',
  passed: true,
  battleCount: 5,
  avgTtkTurns: 12.5,
  avgTtkActions: 24.3,
  p95TtkTurns: 15.0,
  p95TtkActions: 30.0,
  successRate: 100.0,
  battles: [
    {
      troopId: 1,
      troopName: 'Slime',
      outcome: 'victory',
      ttkTurns: 10,
      ttkActions: 20,
      durationMs: 1500,
      seed: 12345,
      expGained: 10,
    },
  ],
  warnings: [],
  ...overrides,
})

describe('TrechoCard', () => {
  describe('rendering', () => {
    it('should render trecho name', () => {
      const trecho = createMockTrecho({ name: 'My Custom Trecho' })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText('My Custom Trecho')).toBeInTheDocument()
    })

    it('should display battle count', () => {
      const trecho = createMockTrecho({ battleCount: 10 })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText(/Battle Count: 10/)).toBeInTheDocument()
    })

    it('should display avg TTK Turns', () => {
      const trecho = createMockTrecho({ avgTtkTurns: 15.7 })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText(/15\.7/)).toBeInTheDocument()
    })

    it('should display avg TTK Actions', () => {
      const trecho = createMockTrecho({ avgTtkActions: 28.5 })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText(/28\.5/)).toBeInTheDocument()
    })

    it('should display P95 TTK Turns', () => {
      const trecho = createMockTrecho({ p95TtkTurns: 18.0 })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText(/18\.0/)).toBeInTheDocument()
    })

    it('should display success rate', () => {
      const trecho = createMockTrecho({ successRate: 85.5 })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText(/85\.5%/)).toBeInTheDocument()
    })

    it('should display P95 Actions in secondary info', () => {
      const trecho = createMockTrecho({ p95TtkActions: 35.0 })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText(/P95 Actions: 35\.0/)).toBeInTheDocument()
    })
  })

  describe('status coloring', () => {
    it('should display green badge when passed with no critical warnings', () => {
      const trecho = createMockTrecho({ passed: true, warnings: [] })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText('Passed')).toBeInTheDocument()
    })

    it('should display red badge when failed', () => {
      const trecho = createMockTrecho({ passed: false, warnings: [] })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('should display red badge when has critical warnings', () => {
      const trecho = createMockTrecho({
        passed: true,
        warnings: [
          { type: 'critical', severity: 'critical', message: 'Critical error', context: {} },
        ],
      })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('should display yellow badge when passed with warnings', () => {
      const trecho = createMockTrecho({
        passed: true,
        warnings: [
          { type: 'warning', severity: 'warning', message: 'Warning message', context: {} },
        ],
      })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText('Warning')).toBeInTheDocument()
    })
  })

  describe('warnings display', () => {
    it('should show warnings count when warnings exist', () => {
      const trecho = createMockTrecho({
        warnings: [
          { type: 'warning', severity: 'warning', message: 'Warning', context: {} },
        ],
      })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByText(/1 warning/)).toBeInTheDocument()
    })

    it('should not show warnings when no warnings', () => {
      const trecho = createMockTrecho({ warnings: [] })
      render(<TrechoCard trecho={trecho} />)

      expect(screen.queryByText(/warning/)).not.toBeInTheDocument()
    })
  })

  describe('battle details', () => {
    it('should render expandable battle details', () => {
      const trecho = createMockTrecho()
      render(<TrechoCard trecho={trecho} />)

      expect(screen.getByRole('button', { name: /toggle details/i })).toBeInTheDocument()
    })

    it('should toggle details when button clicked', () => {
      const trecho = createMockTrecho()
      render(<TrechoCard trecho={trecho} />)

      const toggleButton = screen.getByRole('button', { name: /toggle details/i })
      fireEvent.click(toggleButton)

      expect(screen.getByText('Battle Details')).toBeInTheDocument()
    })
  })

  })
