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
  BarChart3: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'bar-chart-icon'} className={className} />
  ),
  Loader2: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'loader-icon'} className={className} />
  ),
  XCircle: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'x-circle-icon'} className={className} />
  ),
  RotateCw: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'rotate-icon'} className={className} />
  ),
}))

// Mock useSimulationResults hook
jest.mock('@/hooks/useSimulationResults', () => ({
  useSimulationResults: jest.fn(),
}))

const { useSimulationResults } = require('@/hooks/useSimulationResults')

// Mock sub-components to avoid import issues
jest.mock('@/components/ResultsPanel/EmptyState', () => ({
  EmptyState: ({ title, message }: { title?: string; message?: string }) => (
    <div data-testid="empty-state">
      <div data-testid="empty-title">{title}</div>
      <div data-testid="empty-message">{message}</div>
    </div>
  ),
}))

jest.mock('@/components/ResultsPanel/TrechoCard', () => ({
  TrechoCard: ({ trecho }: { trecho: { name: string } }) => (
    <div data-testid={`trecho-card-${trecho.name}`}>{trecho.name}</div>
  ),
}))

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

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
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

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByTestId('empty-title')).toHaveTextContent('No Simulation Results')
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

      expect(screen.getByTestId('trecho-card-Forest Battles')).toBeInTheDocument()
      expect(screen.getByTestId('trecho-card-Cave Battles')).toBeInTheDocument()
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

      // The mocked EmptyState shows title in a div with data-testid="empty-title"
      expect(screen.getByTestId('empty-title')).toHaveTextContent('No Trechos in Report')
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

  describe('styling', () => {
    it('should apply custom className', () => {
      useSimulationResults.mockReturnValue({
        report: null,
        error: null,
        isLoading: false,
        hasResults: false,
        refresh: jest.fn(),
      })

      const { container } = render(<ResultsPanel isVisible={true} className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
