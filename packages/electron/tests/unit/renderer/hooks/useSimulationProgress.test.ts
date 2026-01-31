/**
 * useSimulationProgress Hook Tests (Event Streaming Pattern)
 *
 * Tests for the useSimulationProgress custom hook with event-based IPC.
 *
 * @see packages/electron/src/renderer/src/hooks/useSimulationProgress.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useSimulationProgress } from '@/hooks/useSimulationProgress';

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
};

describe('useSimulationProgress', () => {
  let mockCoreto: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Create fresh mock for each test
    mockCoreto = createMockCoreto();

    // Set up window.coreto mock for jsdom environment
    (window as any).coreto = mockCoreto;
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

  describe('event listeners setup', () => {
    it('should register event listeners on mount', () => {
      renderHook(() => useSimulationProgress());

      expect(mockCoreto.onProgress).toHaveBeenCalled();
      expect(mockCoreto.onComplete).toHaveBeenCalled();
      expect(mockCoreto.onError).toHaveBeenCalled();
    });

    it('should cleanup event listeners on unmount', () => {
      const progressCleanup = jest.fn();
      const completeCleanup = jest.fn();
      const errorCleanup = jest.fn();

      mockCoreto.onProgress.mockReturnValue(progressCleanup);
      mockCoreto.onComplete.mockReturnValue(completeCleanup);
      mockCoreto.onError.mockReturnValue(errorCleanup);

      const { unmount } = renderHook(() => useSimulationProgress());
      unmount();

      expect(progressCleanup).toHaveBeenCalled();
      expect(completeCleanup).toHaveBeenCalled();
      expect(errorCleanup).toHaveBeenCalled();
    });
  });

  describe('startSimulation (event-based)', () => {
    it('should call startSimulation and update status to running', async () => {
      mockCoreto.startSimulation.mockResolvedValue({
        success: true,
        data: { simulationId: 'test-sim-id' },
      });

      const { result } = renderHook(() => useSimulationProgress());

      await act(async () => {
        await result.current.startSimulation({
          projectPath: '/path/to/project',
          configPath: '/path/to/config.json',
        });
      });

      expect(mockCoreto.startSimulation).toHaveBeenCalledWith({
        projectPath: '/path/to/project',
        configPath: '/path/to/config.json',
      });
      expect(result.current.progress.isRunning).toBe(true);
    });

    it('should handle startSimulation errors', async () => {
      mockCoreto.startSimulation.mockResolvedValue({
        success: false,
        error: {
          name: 'StartError',
          message: 'Failed to start',
          severity: 'critical' as const,
          context: {},
          timestamp: new Date().toISOString(),
        },
      });

      const { result } = renderHook(() => useSimulationProgress());

      await act(async () => {
        await result.current.startSimulation({
          projectPath: '/invalid/path',
          configPath: '/config.json',
        });
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error?.title).toBe('Failed to Start Simulation');
    });

    it('should handle network errors on startSimulation', async () => {
      mockCoreto.startSimulation.mockRejectedValue(new Error('Network error'));

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

  describe('progress events', () => {
    it('should update progress state on progress event', () => {
      const { result } = renderHook(() => useSimulationProgress());

      const progressPayload = {
        stage: 'battle' as const,
        current: 50,
        total: 100,
        percentage: 50,
        message: 'Battle 50/100',
        timestamp: Date.now(),
        trechoName: 'Trecho 1',
      };

      act(() => {
        const progressCallback = (mockCoreto as any)._progressCallback;
        if (progressCallback) {
          progressCallback(progressPayload);
        }
      });

      expect(result.current.progress.percentage).toBe(50);
      expect(result.current.progress.currentItem).toBe('Trecho 1');
      expect(result.current.progress.isRunning).toBe(true);
      expect(result.current.status).toBe('running');
      expect(result.current.progressDetail).toEqual(progressPayload);
    });
  });

  describe('completion events', () => {
    it('should update state on completion event', () => {
      mockCoreto.startSimulation.mockResolvedValue({
        success: true,
        data: { simulationId: 'test-sim-id' },
      });

      const { result } = renderHook(() => useSimulationProgress());

      act(() => {
        const completeCallback = (mockCoreto as any)._completeCallback;
        if (completeCallback) {
          completeCallback(mockSimulationResult);
        }
      });

      expect(result.current.status).toBe('completed');
      expect(result.current.result).toEqual(mockSimulationResult);
      expect(result.current.progress.percentage).toBe(100);
      expect(result.current.progress.isRunning).toBe(false);
    });
  });

  describe('error events', () => {
    it('should update state on error event', () => {
      const errorPayload = {
        title: 'Simulation Failed',
        description: 'Invalid project path',
        code: 'ERR_INVALID_PATH',
      };

      const { result } = renderHook(() => useSimulationProgress());

      act(() => {
        const errorCallback = (mockCoreto as any)._errorCallback;
        if (errorCallback) {
          errorCallback(errorPayload);
        }
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toEqual(errorPayload);
      expect(result.current.progress.isRunning).toBe(false);
    });
  });

  describe('runSimulation (legacy)', () => {
    it('should call runSimulation and return result', async () => {
      mockCoreto.runSimulation.mockResolvedValue({
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

      expect(mockCoreto.runSimulation).toHaveBeenCalledWith({
        projectPath: '/path/to/project',
        configPath: '/path/to/config.json',
      });
      expect(result.current.status).toBe('completed');
      // runSimulation returns the result directly, but also sets state
      expect(simulationResult).toEqual(mockSimulationResult);
    });

    it('should handle runSimulation errors', async () => {
      mockCoreto.runSimulation.mockResolvedValue({
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

  describe('cancelSimulation', () => {
    it('should cancel running simulation', async () => {
      mockCoreto.cancelSimulation.mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useSimulationProgress());

      await act(async () => {
        await result.current.cancelSimulation();
      });

      expect(mockCoreto.cancelSimulation).toHaveBeenCalled();
      expect(result.current.status).toBe('cancelled');
      expect(result.current.progress.isRunning).toBe(false);
    });

    it('should handle cancel errors', async () => {
      mockCoreto.cancelSimulation.mockRejectedValue(new Error('Failed to cancel'));

      const { result } = renderHook(() => useSimulationProgress());

      await act(async () => {
        await result.current.cancelSimulation();
      });

      expect(result.current.error?.title).toBe('Cancellation Failed');
      expect(result.current.error?.code).toBe('ERR_CANCEL_FAILED');
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', () => {
      const { result } = renderHook(() => useSimulationProgress());

      // First set some state
      act(() => {
        const completeCallback = (mockCoreto as any)._completeCallback;
        if (completeCallback) {
          completeCallback(mockSimulationResult);
        }
      });

      expect(result.current.status).toBe('completed');

      // Now reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.progress.percentage).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('should handle full simulation lifecycle', async () => {
      mockCoreto.startSimulation.mockResolvedValue({
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
        const progressCallback = (mockCoreto as any)._progressCallback;
        if (progressCallback) {
          progressCallback({
            stage: 'battle' as const,
            current: 25,
            total: 100,
            percentage: 25,
            message: 'Battle 25/100',
            timestamp: Date.now(),
            trechoName: 'Trecho 1',
          });
        }
      });

      expect(result.current.progress.percentage).toBe(25);

      // More progress
      act(() => {
        const progressCallback = (mockCoreto as any)._progressCallback;
        if (progressCallback) {
          progressCallback({
            stage: 'battle' as const,
            current: 75,
            total: 100,
            percentage: 75,
            message: 'Battle 75/100',
            timestamp: Date.now(),
            trechoName: 'Trecho 1',
          });
        }
      });

      expect(result.current.progress.percentage).toBe(75);

      // Complete
      act(() => {
        const completeCallback = (mockCoreto as any)._completeCallback;
        if (completeCallback) {
          completeCallback(mockSimulationResult);
        }
      });

      expect(result.current.status).toBe('completed');
      expect(result.current.progress.percentage).toBe(100);
    });
  });
});
