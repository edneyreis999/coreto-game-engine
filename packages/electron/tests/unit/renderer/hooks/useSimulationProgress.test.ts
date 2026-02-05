/**
 * useSimulationProgress Hook Tests (Event Streaming Pattern)
 *
 * Tests the refactored hook that uses event streaming instead of polling.
 * Validates:
 * - Event listeners are registered on mount
 * - Event listeners are cleaned up on unmount (memory leak prevention)
 * - Progress updates trigger state changes
 * - Complete/error events update state correctly
 * - No polling (setInterval) is used
 * - Full simulation lifecycle
 *
 * @see planos/005-run-ttk-electron/tasks/02_task.md
 * @see packages/electron/src/renderer/src/hooks/useSimulationProgress.ts
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSimulationProgress } from '@/hooks/useSimulationProgress';
import type {
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload
} from '@preload/index';

// Mock window.coreto API with event-based methods
type CleanupFn = () => void;

// Create the mock object
const createMockCoreto = () => {
  const mockCoreto: any = {
    // Event listener methods
    onProgress: jest.fn((callback: (payload: any) => void): CleanupFn => {
      // Store callback for test to trigger
      mockCoreto._progressCallback = callback;
      return jest.fn();
    }),
    onComplete: jest.fn((callback: (payload: any) => void): CleanupFn => {
      mockCoreto._completeCallback = callback;
      return jest.fn();
    }),
    onError: jest.fn((callback: (payload: any) => void): CleanupFn => {
      mockCoreto._errorCallback = callback;
      return jest.fn();
    }),

    // IPC invoke methods
    startSimulation: jest.fn(),
    runSimulation: jest.fn(),
    cancelSimulation: jest.fn(),
  };

  return mockCoreto;
};

// Mock simulation result for runSimulation (legacy method)
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
};

// Mock simulation result for event-based completion
const mockEventResult: SimulationResultPayload = {
  simulationId: 'sim-123',
  projectPath: '/path/to/project',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  report: {} as any,
  duration: 5000,
  seed: 12345,
};

describe('useSimulationProgress (Event Streaming)', () => {
  let mockCoretoAPI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create fresh mock for each test
    mockCoretoAPI = createMockCoreto();

    // Set up window.coreto mock for jsdom environment
    (window as any).coreto = mockCoretoAPI;
  });

  afterEach(() => {
    jest.useRealTimers();
    // Clean up window mock
    delete (window as any).coreto;
  });

  describe('initial state', () => {
    it('should return initial idle state', () => {
      const { result } = renderHook(() => useSimulationProgress());

      expect(result.current.status).toBe('idle');
      expect(result.current.progress.percentage).toBe(0);
      expect(result.current.progress.isRunning).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });

    it('should have correct initial progress values', () => {
      const { result } = renderHook(() => useSimulationProgress());

      expect(result.current.progress.totalItems).toBe(0);
      expect(result.current.progress.currentIndex).toBe(0);
      expect(result.current.progress.isRunning).toBe(false);
    });
  });

  describe('Event Listener Registration', () => {
    it('should setup event listeners on mount', () => {
      renderHook(() => useSimulationProgress());

      expect(mockCoretoAPI.onProgress).toHaveBeenCalledTimes(1);
      expect(mockCoretoAPI.onComplete).toHaveBeenCalledTimes(1);
      expect(mockCoretoAPI.onError).toHaveBeenCalledTimes(1);
    });

    it('should cleanup listeners on unmount', () => {
      const cleanupProgress = jest.fn();
      const cleanupComplete = jest.fn();
      const cleanupError = jest.fn();

      mockCoretoAPI.onProgress.mockReturnValue(cleanupProgress);
      mockCoretoAPI.onComplete.mockReturnValue(cleanupComplete);
      mockCoretoAPI.onError.mockReturnValue(cleanupError);

      const { unmount } = renderHook(() => useSimulationProgress());
      unmount();

      expect(cleanupProgress).toHaveBeenCalledTimes(1);
      expect(cleanupComplete).toHaveBeenCalledTimes(1);
      expect(cleanupError).toHaveBeenCalledTimes(1);
    });

    it('should NOT use setInterval (polling eliminated)', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      renderHook(() => useSimulationProgress());

      expect(setIntervalSpy).not.toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });
  });

  describe('Progress Event Handling', () => {
    it('should update progress state on progress event', async () => {
      let progressCallback: (payload: ProgressPayload) => void;

      mockCoretoAPI.onProgress.mockImplementation((callback: (payload: ProgressPayload) => void) => {
        progressCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useSimulationProgress());

      const testPayload: ProgressPayload = {
        stage: 'battle',
        trechoId: 'trecho-1',
        trechoName: 'Test Trecho',
        current: 50,
        total: 100,
        percentage: 50,
        message: 'Battle 50/100 in Test Trecho',
        timestamp: Date.now(),
      };

      act(() => {
        progressCallback!(testPayload);
      });

      await waitFor(() => {
        expect(result.current.progress.percentage).toBe(50);
        expect(result.current.progress.stage).toBe('battle');
        expect(result.current.progress.message).toBe('Battle 50/100 in Test Trecho');
        expect(result.current.progress.currentItem).toBe('Test Trecho');
        expect(result.current.status).toBe('running');
      });
    });

    it('should store detailed progress payload', async () => {
      let progressCallback: (payload: ProgressPayload) => void;

      mockCoretoAPI.onProgress.mockImplementation((callback: (payload: ProgressPayload) => void) => {
        progressCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useSimulationProgress());

      const testPayload: ProgressPayload = {
        stage: 'trecho',
        trechoId: 'trecho-1',
        trechoName: 'Test Trecho',
        current: 1,
        total: 10,
        percentage: 10,
        message: 'Starting Test Trecho',
        timestamp: Date.now(),
      };

      act(() => {
        progressCallback!(testPayload);
      });

      await waitFor(() => {
        expect(result.current.progressDetail).toEqual(testPayload);
      });
    });
  });

  describe('Completion Event Handling', () => {
    it('should update state on complete event', async () => {
      let completeCallback: (result: SimulationResultPayload) => void;

      mockCoretoAPI.onComplete.mockImplementation((callback: (payload: SimulationResultPayload) => void) => {
        completeCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useSimulationProgress());

      const testResult: SimulationResultPayload = {
        simulationId: 'sim-123',
        projectPath: '/path/to/project',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        report: {} as any,
        duration: 5000,
        seed: 12345,
      };

      act(() => {
        completeCallback!(testResult);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('completed');
        expect(result.current.result).toEqual(testResult);
        expect(result.current.progress.percentage).toBe(100);
        expect(result.current.progress.isRunning).toBe(false);
      });
    });

    it('should clear progressDetail on complete', async () => {
      let progressCallback: (payload: ProgressPayload) => void;
      let completeCallback: (result: SimulationResultPayload) => void;

      mockCoretoAPI.onProgress.mockImplementation((callback: (payload: ProgressPayload) => void) => {
        progressCallback = callback;
        return jest.fn();
      });

      mockCoretoAPI.onComplete.mockImplementation((callback: (payload: SimulationResultPayload) => void) => {
        completeCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useSimulationProgress());

      // First set some progress
      act(() => {
        progressCallback!({
          stage: 'battle',
          trechoId: 'trecho-1',
          trechoName: 'Test Trecho',
          current: 50,
          total: 100,
          percentage: 50,
          message: 'Running...',
          timestamp: Date.now(),
        });
      });

      // Then complete
      const testResult: SimulationResultPayload = {
        simulationId: 'sim-123',
        projectPath: '/path/to/project',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        report: {} as any,
        duration: 5000,
        seed: 12345,
      };

      act(() => {
        completeCallback!(testResult);
      });

      await waitFor(() => {
        expect(result.current.progressDetail).toBeNull();
      });
    });
  });

  describe('Error Event Handling', () => {
    it('should update state on error event', async () => {
      let errorCallback: (error: ErrorPayload) => void;

      mockCoretoAPI.onError.mockImplementation((callback: (payload: ErrorPayload) => void) => {
        errorCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useSimulationProgress());

      const testError: ErrorPayload = {
        title: 'Simulation Failed',
        description: 'Invalid project path',
        code: 'ERR_INVALID_PATH',
      };

      act(() => {
        errorCallback!(testError);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toEqual(testError);
        expect(result.current.progress.isRunning).toBe(false);
      });
    });
  });

  describe('startSimulation Method', () => {
    it('should call startSimulation and reset state', async () => {
      mockCoretoAPI.startSimulation.mockResolvedValue({
        success: true,
        data: { simulationId: 'sim-123' },
      });

      const { result } = renderHook(() => useSimulationProgress());

      await act(async () => {
        await result.current.startSimulation({
          projectPath: '/path/to/project',
          configPath: '/path/to/config.json',
        });
      });

      expect(mockCoretoAPI.startSimulation).toHaveBeenCalledWith({
        projectPath: '/path/to/project',
        configPath: '/path/to/config.json',
      });
      expect(result.current.status).toBe('running');
    });

    it('should handle startSimulation failure', async () => {
      mockCoretoAPI.startSimulation.mockResolvedValue({
        success: false,
        error: {
          name: 'SimulationStartError',
          message: 'Failed to start',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      });

      const { result } = renderHook(() => useSimulationProgress());

      await act(async () => {
        await result.current.startSimulation({
          projectPath: '/path/to/project',
          configPath: '/path/to/config.json',
        });
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.title).toBe('Failed to Start Simulation');
    });

    it('should handle network errors on startSimulation', async () => {
      mockCoretoAPI.startSimulation.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSimulationProgress());

      await act(async () => {
        await result.current.startSimulation({
          projectPath: '/path/to/project',
          configPath: '/config.json',
        });
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.description).toBe('Network error');
    });
  });

  describe('runSimulation Method (Legacy)', () => {
    it('should call runSimulation and return result', async () => {
      mockCoretoAPI.runSimulation.mockResolvedValue({
        success: true,
        data: mockSimulationResult,
      });

      const { result } = renderHook(() => useSimulationProgress());

      let simulationResult;

      await act(async () => {
        simulationResult = await result.current.runSimulation({
          projectPath: '/path/to/project',
          configPath: '/path/to/config.json',
        });
      });

      expect(mockCoretoAPI.runSimulation).toHaveBeenCalledWith({
        projectPath: '/path/to/project',
        configPath: '/path/to/config.json',
      });
      expect(result.current.status).toBe('completed');
      // runSimulation returns the result directly, but also sets state
      expect(simulationResult).toEqual(mockSimulationResult);
    });

    it('should handle runSimulation errors', async () => {
      mockCoretoAPI.runSimulation.mockResolvedValue({
        success: false,
        error: {
          name: 'SimulationError',
          message: 'Invalid project',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      });

      const { result } = renderHook(() => useSimulationProgress());

      await act(async () => {
        await expect(
          result.current.runSimulation({
            projectPath: '/invalid/path',
          })
        ).rejects.toThrow('Invalid project');
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.title).toBe('Simulation Failed');
    });
  });

  describe('cancelSimulation Method', () => {
    it('should call cancelSimulation and update state', async () => {
      mockCoretoAPI.cancelSimulation.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useSimulationProgress());

      await act(async () => {
        await result.current.cancelSimulation();
      });

      expect(mockCoretoAPI.cancelSimulation).toHaveBeenCalled();
      expect(result.current.status).toBe('cancelled');
    });

    it('should handle cancelSimulation errors', async () => {
      mockCoretoAPI.cancelSimulation.mockRejectedValue(
        new Error('Cancel failed')
      );

      const { result } = renderHook(() => useSimulationProgress());

      await act(async () => {
        await result.current.cancelSimulation();
      });

      expect(result.current.error?.title).toBe('Cancellation Failed');
    });
  });

  describe('reset Method', () => {
    it('should reset all state to initial values', async () => {
      let progressCallback: (payload: ProgressPayload) => void;

      mockCoretoAPI.onProgress.mockImplementation((callback: (payload: ProgressPayload) => void) => {
        progressCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useSimulationProgress());

      // Set some state
      act(() => {
        progressCallback!({
          stage: 'battle',
          trechoId: 'trecho-1',
          trechoName: 'Test Trecho',
          current: 50,
          total: 100,
          percentage: 50,
          message: 'Running...',
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.status).toBe('running');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('idle');
        expect(result.current.progress.percentage).toBe(0);
        expect(result.current.progressDetail).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.result).toBeNull();
      });
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should remove all event listeners after unmount', () => {
      const cleanupProgress = jest.fn();
      const cleanupComplete = jest.fn();
      const cleanupError = jest.fn();

      mockCoretoAPI.onProgress.mockReturnValue(cleanupProgress);
      mockCoretoAPI.onComplete.mockReturnValue(cleanupComplete);
      mockCoretoAPI.onError.mockReturnValue(cleanupError);

      const { unmount } = renderHook(() => useSimulationProgress());

      // Verify listeners are registered
      expect(mockCoretoAPI.onProgress).toHaveBeenCalled();
      expect(mockCoretoAPI.onComplete).toHaveBeenCalled();
      expect(mockCoretoAPI.onError).toHaveBeenCalled();

      // Unmount
      unmount();

      // Verify cleanup functions were called
      expect(cleanupProgress).toHaveBeenCalled();
      expect(cleanupComplete).toHaveBeenCalled();
      expect(cleanupError).toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full simulation lifecycle', async () => {
      let progressCallback: (payload: ProgressPayload) => void;
      let completeCallback: (result: SimulationResultPayload) => void;

      mockCoretoAPI.onProgress.mockImplementation((callback: (payload: ProgressPayload) => void) => {
        progressCallback = callback;
        return jest.fn();
      });

      mockCoretoAPI.onComplete.mockImplementation((callback: (payload: SimulationResultPayload) => void) => {
        completeCallback = callback;
        return jest.fn();
      });

      mockCoretoAPI.startSimulation.mockResolvedValue({
        success: true,
        data: { simulationId: 'test-sim-id' },
      });

      const { result } = renderHook(() => useSimulationProgress());

      // Start simulation
      await act(async () => {
        await result.current.startSimulation({
          projectPath: '/path/to/project',
          configPath: '/config.json',
        });
      });

      expect(result.current.status).toBe('running');

      // Progress events
      act(() => {
        progressCallback!({
          stage: 'battle',
          trechoId: 'trecho-1',
          trechoName: 'Test Trecho',
          current: 25,
          total: 100,
          percentage: 25,
          message: 'Battle 25/100',
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.progress.percentage).toBe(25);
      });

      // More progress
      act(() => {
        progressCallback!({
          stage: 'battle',
          trechoId: 'trecho-1',
          trechoName: 'Test Trecho',
          current: 75,
          total: 100,
          percentage: 75,
          message: 'Battle 75/100',
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.progress.percentage).toBe(75);
      });

      // Complete
      act(() => {
        completeCallback!(mockEventResult);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('completed');
        expect(result.current.progress.percentage).toBe(100);
      });
    });
  });
});
