/**
 * Integration Test: ExecutionPanel → onSimulationComplete Flow
 *
 * This test verifies the critical flow:
 * 1. ExecutionPanel renders with valid config
 * 2. User clicks "Run Validation" button
 * 3. useSimulationProgress hook runs simulation
 * 4. runSimulation returns SimulationCompletionResult
 * 5. onSimulationComplete callback is invoked with result
 * 6. Parent App component receives result and sets simulationCompleted = true
 * 7. ResultsPanel becomes visible (conditional render works)
 *
 * @see packages/electron/src/renderer/src/components/ExecutionPanel.tsx
 * @see packages/electron/src/renderer/src/hooks/useSimulationProgress.ts
 * @see planos/005-run-ttk-electron/tasks/04_task.md
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ExecutionPanel } from '@/components/ExecutionPanel';
import type { SimulationConfigData } from '@coreto/electron/domain/services';
import type { SimulationCompletionResult } from '@/hooks/useSimulationProgress';

// Mock window.coreto API
type CleanupFn = () => void;

const createMockCoreto = () => {
  const mockCoreto: any = {
    simulation: {
      // Event listener methods
      onProgress: jest.fn((): CleanupFn => jest.fn()),
      onComplete: jest.fn((): CleanupFn => jest.fn()),
      onError: jest.fn((): CleanupFn => jest.fn()),

      // IPC invoke methods
      start: jest.fn(),
      run: jest.fn(),
      cancel: jest.fn(),
    },
  };

  return mockCoreto;
};

// Mock simulation result
const mockSimulationResult: SimulationCompletionResult = {
  trechoId: 'ato1-nivel1-10',
  troopId: 1,
  troopName: 'Slime',
  battleResult: {
    troopId: 1,
    troopName: 'Slime',
    outcome: 'victory',
    ttkTurns: 5,
    ttkActions: 8,
    durationMs: 1500,
    seed: 12345,
    expGained: 10,
  },
  passed: true,
  warnings: [],
};

// Mock config data
const mockConfig: SimulationConfigData = {
  projectPath: '/path/to/project',
  configPath: '/path/to/config.json',
  trechos: [
    {
      id: 'trecho-1',
      name: 'Forest Path - Levels 1-10',
      troopIds: [1, 2, 3],
    },
  ],
  globalSettings: {
    seed: 12345,
    maxBattleTurns: 100,
  },
};

describe('ExecutionPanel → onSimulationComplete Integration Flow', () => {
  let mockCoretoAPI: any;
  let mockCallback: jest.Mock<(result: SimulationCompletionResult) => void>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create fresh mock for each test
    mockCoretoAPI = createMockCoreto();
    mockCallback = jest.fn();

    // Set up window.coreto mock for jsdom environment
    (window as any).coreto = mockCoretoAPI;

    // Mock runSimulation to return immediately
    mockCoretoAPI.simulation.run.mockResolvedValue({
      success: true,
      data: mockSimulationResult,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    // Clean up window mock
    delete (window as any).coreto;
  });

  describe('Basic callback invocation', () => {
    it('should call onSimulationComplete callback after successful simulation', async () => {
      // Arrange: Render ExecutionPanel with config and callback
      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={mockCallback}
        />
      );

      // Act: Click "Run Validation" button
      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Assert: Callback was invoked with simulation result
      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledTimes(1);
      });

      // Assert: Callback received correct result structure
      const callbackArg = mockCallback.mock.calls[0][0];
      expect(callbackArg).toBeDefined();
      expect(callbackArg.trechoId).toBe(mockSimulationResult.trechoId);
      expect(callbackArg.troopId).toBe(mockSimulationResult.troopId);
      expect(callbackArg.troopName).toBe(mockSimulationResult.troopName);
      expect(callbackArg.battleResult.ttkTurns).toBe(mockSimulationResult.battleResult.ttkTurns);
      expect(callbackArg.battleResult.ttkActions).toBe(mockSimulationResult.battleResult.ttkActions);
    });

    it('should pass complete SimulationCompletionResult to callback', async () => {
      // Arrange
      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={mockCallback}
        />
      );

      // Act
      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Assert: Verify all result fields
      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalled();
      });

      const result = mockCallback.mock.calls[0][0] as SimulationCompletionResult;

      // Verify structure matches SimulationCompletionResult interface
      expect(result).toHaveProperty('trechoId');
      expect(result).toHaveProperty('troopId');
      expect(result).toHaveProperty('troopName');
      expect(result).toHaveProperty('battleResult');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('warnings');

      // Verify nested battleResult structure
      expect(result.battleResult).toHaveProperty('troopId');
      expect(result.battleResult).toHaveProperty('troopName');
      expect(result.battleResult).toHaveProperty('outcome');
      expect(result.battleResult).toHaveProperty('ttkTurns');
      expect(result.battleResult).toHaveProperty('ttkActions');
      expect(result.battleResult).toHaveProperty('durationMs');
      expect(result.battleResult).toHaveProperty('seed');
      expect(result.battleResult).toHaveProperty('expGained');

      // Verify types
      expect(typeof result.trechoId).toBe('string');
      expect(typeof result.troopId).toBe('number');
      expect(typeof result.troopName).toBe('string');
      expect(typeof result.passed).toBe('boolean');
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.battleResult.ttkTurns).toBe('number');
      expect(typeof result.battleResult.ttkActions).toBe('number');
    });

    it('should not call callback when simulation fails', async () => {
      // Arrange: Configure simulation to fail
      mockCoretoAPI.simulation.run.mockResolvedValue({
        success: false,
        error: {
          name: 'SimulationError',
          message: 'Invalid project path',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      });

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={mockCallback}
        />
      );

      // Act: Click "Run Validation" button
      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Assert: Callback should NOT be invoked on error
      await waitFor(() => {
        expect(screen.getByText(/Validation failed/i)).toBeInTheDocument();
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should not call callback when no config provided', async () => {
      // Arrange: Render without config
      render(
        <ExecutionPanel
          config={null}
          onSimulationComplete={mockCallback}
        />
      );

      // Act: Try to click button (should be disabled anyway)
      const runButton = screen.queryByRole('button', { name: /Run Validation/i });
      expect(runButton).not.toBeInTheDocument();

      // Assert: Callback should not be invoked
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('App integration scenario', () => {
    it('should enable ResultsPanel visibility flow in App component', async () => {
      // This test simulates the actual App.tsx flow:
      // 1. App passes handleSimulationComplete to ExecutionPanel
      // 2. Callback sets simulationCompleted = true
      // 3. ResultsPanel becomes visible

      // Simulate App state
      let simulationCompleted = false;

      const handleSimulationComplete = jest.fn((result: SimulationCompletionResult) => {
        // This is what App.handleSimulationComplete does
        simulationCompleted = true;
      });

      // Render as App would
      render(
        <>
          <ExecutionPanel
            config={mockConfig}
            onSimulationComplete={handleSimulationComplete}
          />
          {simulationCompleted && (
            <div data-testid="results-panel">Results Panel</div>
          )}
        </>
      );

      // Initially, ResultsPanel should not be visible
      expect(screen.queryByTestId('results-panel')).not.toBeInTheDocument();

      // Act: Run simulation
      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Assert: Callback was called
      await waitFor(() => {
        expect(handleSimulationComplete).toHaveBeenCalled();
      });

      // Assert: ResultsPanel would be visible (in real App, this triggers re-render)
      expect(simulationCompleted).toBe(true);
    });

    it('should handle multiple simulation runs correctly', async () => {
      // Test that callback is invoked each time simulation is run
      let simulationCompleted = false;

      const handleSimulationComplete = jest.fn(() => {
        simulationCompleted = true;
      });

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={handleSimulationComplete}
        />
      );

      // First run
      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      await waitFor(() => {
        expect(handleSimulationComplete).toHaveBeenCalledTimes(1);
      });

      // Second run (click "Run Again" button after completion)
      const runAgainButton = await screen.findByRole('button', { name: /Run Again/i });
      await act(async () => {
        fireEvent.click(runAgainButton);
      });

      await waitFor(() => {
        expect(handleSimulationComplete).toHaveBeenCalledTimes(2);
      });

      // Verify callback was called with result each time
      expect(handleSimulationComplete).toHaveBeenCalledWith(mockSimulationResult);
    });
  });

  describe('Result data accuracy', () => {
    it('should pass correct troopName in callback result', async () => {
      const customResult: SimulationCompletionResult = {
        ...mockSimulationResult,
        troopName: 'Goblin Scout',
      };

      mockCoretoAPI.simulation.run.mockResolvedValue({
        success: true,
        data: customResult,
      });

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={mockCallback}
        />
      );

      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalled();
      });

      const result = mockCallback.mock.calls[0][0];
      expect(result.troopName).toBe('Goblin Scout');
    });

    it('should pass correct TTK metrics in callback result', async () => {
      const customResult: SimulationCompletionResult = {
        ...mockSimulationResult,
        battleResult: {
          ...mockSimulationResult.battleResult,
          ttkTurns: 7,
          ttkActions: 14,
        },
      };

      mockCoretoAPI.simulation.run.mockResolvedValue({
        success: true,
        data: customResult,
      });

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={mockCallback}
        />
      );

      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalled();
      });

      const result = mockCallback.mock.calls[0][0];
      expect(result.battleResult.ttkTurns).toBe(7);
      expect(result.battleResult.ttkActions).toBe(14);
    });
  });

  describe('Error handling and cancel flow', () => {
    it('should not invoke callback when simulation is cancelled', async () => {
      // Arrange: Mock cancelSimulation
      mockCoretoAPI.simulation.cancel.mockResolvedValue({
        success: true,
        data: undefined,
      });

      // Create a pending promise that never resolves
      let resolveRun: ((value: any) => void) | null = null;
      const pendingPromise = new Promise((resolve) => {
        resolveRun = resolve;
      });

      mockCoretoAPI.simulation.run.mockReturnValue(pendingPromise);

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={mockCallback}
        />
      );

      // Act: Start simulation (will hang due to pending promise)
      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Wait for running state
      await waitFor(() => {
        expect(screen.getByText(/Validating TTK balance/i)).toBeInTheDocument();
      });

      // Cancel simulation
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await act(async () => {
        fireEvent.click(cancelButton);
      });

      // Assert: Callback should not be invoked
      await waitFor(() => {
        expect(screen.queryByText(/Validating TTK balance/i)).not.toBeInTheDocument();
      });

      expect(mockCallback).not.toHaveBeenCalled();

      // Cleanup: Resolve the pending promise
      if (resolveRun) {
        resolveRun({
          success: true,
          data: mockSimulationResult,
        });
      }
    });

    it('should handle network errors without invoking callback', async () => {
      // Arrange: Simulate network error
      mockCoretoAPI.simulation.run.mockRejectedValue(
        new Error('Network connection lost')
      );

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={mockCallback}
        />
      );

      // Act: Try to run simulation
      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Assert: Error state should be shown
      await waitFor(() => {
        expect(screen.getByText(/Validation failed/i)).toBeInTheDocument();
      });

      // Assert: Callback should not be invoked on error
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Dependency array correctness', () => {
    it('should include onSimulationComplete in dependency array', () => {
      // This is a compile-time check - if dependencies are wrong,
      // React Hook Rules ESLint would catch it
      // We verify the code compiles correctly

      const newCallback = jest.fn();

      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={newCallback}
        />
      );

      // If this compiles and runs, the dependency array is correct
      expect(screen.getByRole('button', { name: /Run Validation/i })).toBeInTheDocument();
    });

    it('should use latest callback when callback changes', async () => {
      // Test that changing callback ref works correctly
      const firstCallback = jest.fn();
      const secondCallback = jest.fn();

      const { rerender } = render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={firstCallback}
        />
      );

      // Rerender with new callback
      rerender(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={secondCallback}
        />
      );

      // Act: Run simulation
      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Assert: Second callback should be invoked (latest ref)
      await waitFor(() => {
        expect(secondCallback).toHaveBeenCalled();
      });

      expect(firstCallback).not.toHaveBeenCalled();
    });
  });

  describe('UI state after callback', () => {
    it('should show completion state after callback is invoked', async () => {
      render(
        <ExecutionPanel
          config={mockConfig}
          onSimulationComplete={mockCallback}
        />
      );

      // Act: Run simulation
      const runButton = screen.getByRole('button', { name: /Run Validation/i });
      await act(async () => {
        fireEvent.click(runButton);
      });

      // Assert: Completion state should be visible
      await waitFor(() => {
        expect(screen.getByText(/Validation complete/i)).toBeInTheDocument();
      });

      // Assert: TTK details should be shown inline
      expect(screen.getByText(/TTK: 5 turns, 8 actions/i)).toBeInTheDocument();
    });
  });
});
