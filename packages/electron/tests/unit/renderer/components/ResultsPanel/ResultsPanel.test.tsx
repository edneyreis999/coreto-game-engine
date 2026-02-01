/**
 * ResultsPanel Component Tests
 *
 * Tests for the ResultsPanel React component.
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ResultsPanel } from '@/components/ResultsPanel'
import type { ReportData } from '@/types/preload'

// Mock window.coreto API
const mockCoreto = global.window.coreto as jest.Mocked<typeof global.window.coreto>

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BarChart3: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  Loader2: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  XCircle: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
  RotateCw: ({ className }: { className: string }) => (
    <svg className={className} />
  ),
}))

// Mock useSimulationResults hook
jest.mock('@/hooks/useSimulationResults', () => ({
  useSimulationResults: jest.fn(),
}))

const { useSimulationResults } = require('@/hooks/useSimulationResults')


const mockReportData: ReportData = {
  trechos: [
    {
      id: 'trecho-1',
      name: 'Forest Battles',
      passed: true,
      battleCount: 5,
      avgTtkTurns: 12.5,
      avgTtkActions: 24.3,
      p95TtkTurns: 15.0,
      p95TtkActions: 30.0,
      successRate: 100.0,
      battles: [],
      warnings: [],
    },
    {
      id: 'trecho-2',
      name: 'Cave Battles',
      passed: false,
      battleCount: 3,
      avgTtkTurns: 20.0,
      avgTtkActions: 35.0,
      p95TtkTurns: 25.0,
      p95TtkActions: 40.0,
      successRate: 66.7,
      battles: [],
      warnings: [
        { type: 'ttk_warning', severity: 'warning', message: 'TTK exceeded', context: {} },
      ],
    },
  ],
  totalBattles: 8,
  timestamp: '2026-01-20T10:30:00.000Z',
}

describe('ResultsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render panel with title', () => {
      useSimulationResults.mockReturnValue({
        report: null,
        error: null,
        isLoading: false,
        hasResults: false,
        refresh: jest.fn(),
      })

      render(<ResultsPanel isVisible={true} />)

      expect(screen.getByText('Results')).toBeInTheDocument()
      expect(
        screen.getByText('TTK validation results with color-coded pass/fail indicators')
      ).toBeInTheDocument()
    })

    it('should hide when isVisible is false', () => {
      useSimulationResults.mockReturnValue({
        report: null,
        error: null,
        isLoading: false,
        hasResults: false,
        refresh: jest.fn(),
      })

      const { container } = render(<ResultsPanel isVisible={false} />)

      expect(container.firstChild).toBe(null)
    })

    it('should render loading state when isLoading is true', () => {
      useSimulationResults.mockReturnValue({
        report: null,
        error: null,
        isLoading: true,
        hasResults: false,
        refresh: jest.fn(),
      })

      render(<ResultsPanel isVisible={true} />)

      expect(screen.getByText('Loading results...')).toBeInTheDocument()
    })

    it('should render empty state when no results and not loading', () => {
      useSimulationResults.mockReturnValue({
        report: null,
        error: null,
        isLoading: false,
        hasResults: false,
        refresh: jest.fn(),
      })

      render(<ResultsPanel isVisible={true} />)

      expect(screen.getByText('No Simulation Results')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('should render error state when error exists', () => {
      const mockError = new Error('Failed to load results')
      useSimulationResults.mockReturnValue({
        report: null,
        error: mockError,
        isLoading: false,
        hasResults: false,
        refresh: jest.fn(),
      })

      render(<ResultsPanel isVisible={true} />)

      // Use getAllByText since error message appears multiple times
      expect(screen.getAllByText('Failed to load results').length).toBeGreaterThan(0)
    })

    it('should call refresh when retry button clicked', () => {
      const mockRefresh = jest.fn()
      const mockError = new Error('Network error')
      useSimulationResults.mockReturnValue({
        report: null,
        error: mockError,
        isLoading: false,
        hasResults: false,
        refresh: mockRefresh,
      })

      render(<ResultsPanel isVisible={true} />)

      // Clear the initial auto-refresh call from useEffect
      mockRefresh.mockClear()

      const retryButton = screen.getByRole('button', { name: /Retry/i })
      fireEvent.click(retryButton)

      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('results display', () => {
    it('should render results summary when report exists', () => {
      useSimulationResults.mockReturnValue({
        report: mockReportData,
        error: null,
        isLoading: false,
        hasResults: true,
        refresh: jest.fn(),
      })

      render(<ResultsPanel isVisible={true} />)

      expect(screen.getByText(/Total Trechos: 2/)).toBeInTheDocument()
      expect(screen.getByText(/Passed: 1/)).toBeInTheDocument()
      expect(screen.getByText(/Failed: 1/)).toBeInTheDocument()
    })

    it('should render trecho cards when report has trechos', () => {
      useSimulationResults.mockReturnValue({
        report: mockReportData,
        error: null,
        isLoading: false,
        hasResults: true,
        refresh: jest.fn(),
      })

      render(<ResultsPanel isVisible={true} />)

      expect(screen.getByText('Forest Battles')).toBeInTheDocument()
      expect(screen.getByText('Cave Battles')).toBeInTheDocument()
    })

    it('should show warnings in summary when critical warnings exist', () => {
      const reportWithCritical: ReportData = {
        ...mockReportData,
        trechos: [
          {
            ...mockReportData.trechos[0],
            warnings: [
              { type: 'critical', severity: 'critical', message: 'Critical', context: {} },
            ],
          },
        ],
      }

      useSimulationResults.mockReturnValue({
        report: reportWithCritical,
        error: null,
        isLoading: false,
        hasResults: true,
        refresh: jest.fn(),
      })

      render(<ResultsPanel isVisible={true} />)

      expect(screen.getByText('Critical Warnings')).toBeInTheDocument()
    })

    it('should show empty state when report has no trechos', () => {
      const emptyReport: ReportData = {
        trechos: [],
        totalBattles: 0,
        timestamp: '2026-01-20T10:30:00.000Z',
      }

      useSimulationResults.mockReturnValue({
        report: emptyReport,
        error: null,
        isLoading: false,
        hasResults: true,
        refresh: jest.fn(),
      })

      render(<ResultsPanel isVisible={true} />)

      expect(screen.getByText('No Trechos in Report')).toBeInTheDocument()
    })
  })

  describe('auto-refresh', () => {
    it('should call refresh when panel becomes visible and no results', async () => {
      const mockRefresh = jest.fn()
      useSimulationResults.mockReturnValue({
        report: null,
        error: null,
        isLoading: false,
        hasResults: false,
        refresh: mockRefresh,
      })

      const { rerender } = render(<ResultsPanel isVisible={false} />)

      rerender(<ResultsPanel isVisible={true} />)

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })
  })
})
