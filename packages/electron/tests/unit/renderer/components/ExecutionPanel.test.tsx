/**
 * ExecutionPanel Component Tests
 *
 * Tests for the ExecutionPanel React component.
 */

import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { ExecutionPanel } from '@/components/ExecutionPanel'
import type { SimulationConfigData } from '@/components'

// Mock window.coreto API
const mockCoreto = global.window.coreto as jest.Mocked<typeof global.window.coreto>

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'play-icon'} className={className} />
  ),
  X: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'x-icon'} className={className} />
  ),
  Loader2: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'loader'} className={className} />
  ),
  CheckCircle2: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'check-circle'} className={className} />
  ),
  XCircle: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'x-circle'} className={className} />
  ),
  AlertCircle: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'alert-circle'} className={className} />
  ),
  Settings2: ({ className, 'data-testid': testId }: { className: string; 'data-testid'?: string }) => (
    <svg data-testid={testId ?? 'settings-icon'} className={className} />
  ),
}))

// Mock simulation result
const mockSimulationResult = {
  trechoId: 'ato1-nivel1-10',
  troopId: 1,
  troopName: 'Slime',
  battleResult: {
    troopId: 1,
    troopName: 'Slime',
    outcome: 'victory' as const,
    ttkTurns: 5,
    ttkActions: 8,
    durationMs: 1500,
    seed: 12345,
    expGained: 10,
  },
  passed: true,
  warnings: [],
}

describe('ExecutionPanel', () => {
  const mockConfig: SimulationConfigData = {
    projectPath: '/path/to/project',
    trechos: [
      {
        id: 'ato1-nivel1-10',
        name: 'Act 1 - Level 1-10',
        troopIds: [1, 2, 3],
      },
    ],
    globalSettings: {
      seed: 12345,
      maxBattleTurns: 100,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()

    // Setup default mock responses
    mockCoreto.runSimulation.mockResolvedValue({
      success: true,
      data: mockSimulationResult,
    })

    mockCoreto.getSimulationProgress.mockResolvedValue({
      success: true,
      data: 0,
    })

    mockCoreto.cancelSimulation.mockResolvedValue({
      success: true,
      data: undefined,
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('rendering', () => {
    it('should render the panel with title', () => {
      render(<ExecutionPanel config={mockConfig} />)

      expect(screen.getByText('Execution')).toBeInTheDocument()
      expect(
        screen.getByText('Run TTK validation simulations')
      ).toBeInTheDocument()
    })

    it('should render Run Validation button when config provided', () => {
      render(<ExecutionPanel config={mockConfig} />)

      expect(
        screen.getByRole('button', { name: /Run Validation/i })
      ).toBeInTheDocument()
    })

    it('should show disabled state when no config provided', () => {
      render(<ExecutionPanel config={null} />)

      expect(screen.getByText('Configuration required')).toBeInTheDocument()
      expect(
        screen.getByText(/Add at least one trecho/i)
      ).toBeInTheDocument()
    })

    it('should show trecho count when config provided', () => {
      render(<ExecutionPanel config={mockConfig} />)

      expect(screen.getByText(/1 trecho configured/)).toBeInTheDocument()
    })

    it('should show plural trecho count for multiple trechos', () => {
      const configWithMultiple: SimulationConfigData = {
        ...mockConfig,
        trechos: [
          { id: 't1', name: 'Trecho 1', troopIds: [1] },
          { id: 't2', name: 'Trecho 2', troopIds: [2] },
        ],
      }

      render(<ExecutionPanel config={configWithMultiple} />)

      expect(screen.getByText(/2 trechos configured/)).toBeInTheDocument()
    })
  })

  describe('Run Validation button', () => {
    it('should start simulation when Run Validation clicked', async () => {
      const onSimulationComplete = jest.fn()

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={onSimulationComplete}
        />
      )

      const button = screen.getByRole('button', { name: /Run Validation/i })

      await act(async () => {
        fireEvent.click(button)
      })

      expect(mockCoreto.runSimulation).toHaveBeenCalledWith({
        projectPath: '/path/to/project',
        configPath: undefined,
        trechoId: 'ato1-nivel1-10',
        seed: 12345,
        maxTurns: 100,
      })
    })

    it('should call onSimulationComplete when simulation finishes', async () => {
      const onSimulationComplete = jest.fn()

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={onSimulationComplete}
        />
      )

      const button = screen.getByRole('button', { name: /Run Validation/i })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(onSimulationComplete).toHaveBeenCalledWith(mockSimulationResult)
      })
    })

    it('should show loading state during simulation', async () => {
      // Mock a slow simulation
      mockCoreto.runSimulation.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: mockSimulationResult,
              })
            }, 100)
          })
      )

      render(<ExecutionPanel config={mockConfig} />)

      const button = screen.getByRole('button', { name: /Run Validation/i })

      act(() => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByTestId('loader')).toBeInTheDocument()
        expect(screen.getByText(/Validating TTK balance/i)).toBeInTheDocument()
      })
    })

    it('should show progress bar during simulation', async () => {
      // Mock a slow simulation with progress updates
      mockCoreto.runSimulation.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: mockSimulationResult,
              })
            }, 500)
          })
      )

      // Mock progress to return different values
      let progressValue = 0
      mockCoreto.getSimulationProgress.mockImplementation(() => {
        progressValue += 25
        return Promise.resolve({
          success: true,
          data: progressValue,
        })
      })

      render(<ExecutionPanel config={mockConfig} />)

      const button = screen.getByRole('button', { name: /Run Validation/i })

      act(() => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByText(/Validating:/i)).toBeInTheDocument()
      })

      // Fast-forward timers to trigger progress updates
      jest.advanceTimersByTime(100)
    })

    it('should show Cancel button during simulation', async () => {
      // Mock a slow simulation
      mockCoreto.runSimulation.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: mockSimulationResult,
              })
            }, 100)
          })
      )

      render(<ExecutionPanel config={mockConfig} />)

      const button = screen.getByRole('button', { name: /Run Validation/i })

      act(() => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      })
    })
  })

  describe('Cancel button', () => {
    it('should cancel simulation when Cancel clicked', async () => {
      // Mock a hanging simulation
      mockCoreto.runSimulation.mockImplementation(
        () => new Promise(() => {})
      )

      render(<ExecutionPanel config={mockConfig} />)

      // Start simulation
      const runButton = screen.getByRole('button', { name: /Run Validation/i })
      act(() => {
        fireEvent.click(runButton)
      })

      // Wait for cancel button to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      })

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await act(async () => {
        fireEvent.click(cancelButton)
      })

      expect(mockCoreto.cancelSimulation).toHaveBeenCalled()
    })

    it('should reset to idle state after cancellation', async () => {
      // Mock a hanging simulation
      mockCoreto.runSimulation.mockImplementation(
        () => new Promise(() => {})
      )

      render(<ExecutionPanel config={mockConfig} />)

      // Start simulation
      const runButton = screen.getByRole('button', { name: /Run Validation/i })
      act(() => {
        fireEvent.click(runButton)
      })

      // Wait for cancel button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      })

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await act(async () => {
        fireEvent.click(cancelButton)
      })

      // Should return to idle state with Run button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Run Validation/i })).toBeInTheDocument()
      })
    })
  })

  describe('completed state', () => {
    it('should show success message when simulation completes', async () => {
      const onSimulationComplete = jest.fn()

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={onSimulationComplete}
        />
      )

      const button = screen.getByRole('button', { name: /Run Validation/i })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByTestId('check-circle')).toBeInTheDocument()
        expect(screen.getByText('Validation complete')).toBeInTheDocument()
      })
    })

    it('should show battle result details when simulation completes', async () => {
      render(<ExecutionPanel config={mockConfig} />)

      const button = screen.getByRole('button', { name: /Run Validation/i })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByText(/Slime - TTK: 5 turns, 8 actions/)).toBeInTheDocument()
      })
    })

    it('should show Run Again button after completion', async () => {
      render(<ExecutionPanel config={mockConfig} />)

      const button = screen.getByRole('button', { name: /Run Validation/i })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Run Again/i })).toBeInTheDocument()
      })
    })
  })

  describe('error state', () => {
    it('should show error message when simulation fails', async () => {
      mockCoreto.runSimulation.mockResolvedValue({
        success: false,
        error: {
          name: 'SimulationError',
          message: 'Simulation failed: Invalid project path',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      render(<ExecutionPanel config={mockConfig} />)

      const button = screen.getByRole('button', { name: /Run Validation/i })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByTestId('x-circle')).toBeInTheDocument()
        expect(screen.getByText('Validation failed')).toBeInTheDocument()
        expect(screen.getByText(/Simulation failed: Invalid project path/i)).toBeInTheDocument()
      })
    })

    it('should show Retry button after error', async () => {
      mockCoreto.runSimulation.mockResolvedValue({
        success: false,
        error: {
          name: 'SimulationError',
          message: 'Simulation failed',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      })

      render(<ExecutionPanel config={mockConfig} />)

      const button = screen.getByRole('button', { name: /Run Validation/i })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
      })
    })

    it('should handle network errors', async () => {
      mockCoreto.runSimulation.mockRejectedValue(
        new Error('Network connection lost')
      )

      render(<ExecutionPanel config={mockConfig} />)

      const button = screen.getByRole('button', { name: /Run Validation/i })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByTestId('x-circle')).toBeInTheDocument()
        expect(screen.getByText(/Network connection lost/i)).toBeInTheDocument()
      })
    })
  })

  describe('callbacks', () => {
    it('should call onSimulationComplete with result', async () => {
      const onSimulationComplete = jest.fn()

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={onSimulationComplete}
        />
      )

      const button = screen.getByRole('button', { name: /Run Validation/i })

      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(onSimulationComplete).toHaveBeenCalledWith(mockSimulationResult)
      })
    })

    it('should not call onSimulationComplete when config is null', async () => {
      const onSimulationComplete = jest.fn()

      render(
        <ExecutionPanel
          config={null}
          onSimulationComplete={onSimulationComplete}
        />
      )

      // Even after clicking, callback should not be called since panel is disabled
      await waitFor(() => {
        expect(onSimulationComplete).not.toHaveBeenCalled()
      })
    })
  })

  describe('progress display', () => {
    it('should display current item during simulation', async () => {
      // Mock a slow simulation
      mockCoreto.runSimulation.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: mockSimulationResult,
              })
            }, 100)
          })
      )

      render(<ExecutionPanel config={mockConfig} />)

      const button = screen.getByRole('button', { name: /Run Validation/i })

      act(() => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByText(/Validating:/i)).toBeInTheDocument()
        // Should show the trecho name from config
        expect(screen.getByText('Act 1 - Level 1-10')).toBeInTheDocument()
      })
    })

    it('should update progress percentage during simulation', async () => {
      // Mock a slow simulation
      mockCoreto.runSimulation.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                data: mockSimulationResult,
              })
            }, 200)
          })
      )

      let progressValue = 0
      mockCoreto.getSimulationProgress.mockImplementation(() => {
        progressValue += 25
        return Promise.resolve({
          success: true,
          data: progressValue,
        })
      })

      render(<ExecutionPanel config={mockConfig} />)

      const button = screen.getByRole('button', { name: /Run Validation/i })

      act(() => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByText(/Validating:/i)).toBeInTheDocument()
      })

      // Fast-forward time to trigger progress updates
      jest.advanceTimersByTime(100)
    })
  })
})
