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
 *
 * @see planos/005-run-ttk-electron/tasks/02_task.md
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSimulationProgress } from '../useSimulationProgress';
import type {
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload
} from '@preload/index';

// Mock window.coreto API
const mockCoretoAPI = {
  onProgress: jest.fn(),
  onComplete: jest.fn(),
  onError: jest.fn(),
  startSimulation: jest.fn(),
  runSimulation: jest.fn(),
  cancelSimulation: jest.fn(),
};

// Setup global window mock
Object.defineProperty(window, 'coreto', {
  value: mockCoretoAPI,
  writable: true,
});

describe('useSimulationProgress (Event Streaming)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      mockCoretoAPI.onComplete.mockImplementation((callback: (payload: ProgressPayload) => void) => {
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

      mockCoretoAPI.onComplete.mockImplementation((callback: (payload: ProgressPayload) => void) => {
        completeCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useSimulationProgress());

      // First set some progress
      act(() => {
        progressCallback!({
          stage: 'battle',
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

      mockCoretoAPI.onError.mockImplementation((callback: (payload: ProgressPayload) => void) => {
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
});
