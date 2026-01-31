/**
 * Unit Tests for SimulationController
 *
 * Tests the warm pool lifecycle, worker management, and event forwarding.
 *
 * @see packages/electron/src/main/services/simulation-controller.ts
 * @see planos/005-run-ttk-electron/tasks/05_task.md
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { SimulationController } from '../simulation-controller.js';
import { ReportStorageService } from '../report-storage.js';
import type { SimulationParams } from '../../workers/types.js';

// =============================================================================
// Mocks (must be before imports)
// =============================================================================

// Mock Electron modules at the top level
const mockWebContentsSend = jest.fn();
const mockIsDestroyed = jest.fn(() => false);

const mockWindow = {
  isDestroyed: mockIsDestroyed,
  webContents: {
    send: mockWebContentsSend,
  },
};

// Type definition for mock worker to avoid circular references
interface MockWorker {
  killed: boolean;
  listeners: Map<string, Array<(...args: unknown[]) => void>>;
  postMessage: jest.Mock;
  on: jest.Mock;
  once: jest.Mock;
  kill: jest.Mock;
  stdout: { on: jest.Mock };
  stderr: { on: jest.Mock };
}

const mockWorker: MockWorker = {
  killed: false,
  listeners: new Map<string, Array<(...args: unknown[]) => void>>(),
  postMessage: jest.fn(),
  on: jest.fn((event: string, callback: (...args: unknown[]) => void) => {
    if (!mockWorker.listeners.has(event)) {
      mockWorker.listeners.set(event, []);
    }
    mockWorker.listeners.get(event)?.push(callback);
  }),
  once: jest.fn((event: string, callback: (...args: unknown[]) => void) => {
    // For testing, treat same as 'on'
    if (!mockWorker.listeners.has(event)) {
      mockWorker.listeners.set(event, []);
    }
    mockWorker.listeners.get(event)?.push(callback);
  }),
  kill: jest.fn(function(this: MockWorker) {
    this.killed = true;
    // Trigger exit event
    const exitListeners = this.listeners.get('exit') || [];
    exitListeners.forEach((cb: (code: number) => void) => cb(0));
  }),
  stdout: { on: jest.fn() },
  stderr: { on: jest.fn() },
};

// Helper to emit events from the mock worker
function emitWorkerEvent(event: string, ...args: unknown[]): void {
  const listeners = mockWorker.listeners.get(event) || [];
  listeners.forEach((cb: (...args: unknown[]) => void) => cb(...args));
}

jest.mock('electron', () => ({
  utilityProcess: {
    fork: jest.fn(() => mockWorker),
  },
  BrowserWindow: {
    getAllWindows: jest.fn(() => [mockWindow]),
  },
}));

// Mock crypto
jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

// =============================================================================
// Test Mocks
// =============================================================================

/**
 * Mock ReportStorageService for testing.
 */
class MockReportStorageService {
  async storeSimulation(): Promise<void> {
    // Mock implementation
  }
}

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Creates mock simulation parameters.
 */
function createMockParams(): Omit<SimulationParams, 'simulationId'> {
  return {
    projectPath: '/test/project',
    configPath: '/test/project/temp/project.config.json',
    seed: 12345,
    diagnostic: false,
  };
}

// =============================================================================
// Test Suite
// =============================================================================

describe('SimulationController', () => {
  let controller: SimulationController;
  let mockStorageService: ReportStorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWorker.killed = false;
    mockWorker.listeners.clear();
    mockWebContentsSend.mockClear();
    mockIsDestroyed.mockReturnValue(false);

    controller = new SimulationController();
    mockStorageService = new MockReportStorageService() as unknown as ReportStorageService;

    controller.setStorageService(mockStorageService);
  });

  afterEach(() => {
    controller.cleanup();
    jest.useRealTimers();
  });

  describe('Warm Pool Lifecycle', () => {
    it('should spawn new worker on first start', async () => {
      const simulationId = await controller.start(createMockParams());

      expect(simulationId).toBeDefined();
      expect(controller.getCurrentSimulationId()).toBe(simulationId);
      expect(controller.isRunning()).toBe(true);
    });

    it('should reuse worker for consecutive simulations (warm pool)', async () => {
      // First simulation
      await controller.start(createMockParams());
      const worker1 = controller.getWorker();

      // Second simulation within warm pool window
      await controller.start(createMockParams());
      const worker2 = controller.getWorker();

      // Should reuse same worker
      expect(worker2).toBe(worker1);
    });

    it('should terminate worker after 5 minutes idle', async () => {
      jest.useFakeTimers();

      await controller.start(createMockParams());

      // Get worker reference before termination
      const worker = controller.getWorker();
      expect(worker).not.toBeNull();

      // Simulate completion to start warm pool timer
      emitWorkerEvent('message', {
        type: 'complete',
        payload: {
          simulationId: 'test-id',
          projectPath: '/test/project',
          report: {},
          duration: 1000,
          seed: 12345,
        },
      });

      // Fast-forward 4 minutes - worker should still be alive
      jest.advanceTimersByTime(4 * 60 * 1000);
      expect(controller.getWorker()).not.toBeNull();

      // Fast-forward past 5 minutes - worker should be terminated
      jest.advanceTimersByTime(2 * 60 * 1000); // 6 minutes total
      expect(controller.getWorker()).toBeNull();

      jest.useRealTimers();
    });

    it('should cancel termination timer on new simulation', async () => {
      jest.useFakeTimers();

      await controller.start(createMockParams());

      // Simulate completion to start warm pool timer
      emitWorkerEvent('message', {
        type: 'complete',
        payload: {
          simulationId: 'test-id',
          projectPath: '/test/project',
          report: {},
          duration: 1000,
          seed: 12345,
        },
      });

      // Advance time but not enough to terminate
      jest.advanceTimersByTime(2 * 60 * 1000);

      // Start new simulation should cancel timer
      await controller.start(createMockParams());

      // Worker should still be alive after original 5 min would have passed
      jest.advanceTimersByTime(4 * 60 * 1000);
      expect(controller.getWorker()).not.toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Cancellation', () => {
    it('should send cancel message to worker', async () => {
      await controller.start(createMockParams());

      await controller.cancel();

      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'cancel' });
    });

    it('should handle cancel when no worker is running', async () => {
      await expect(controller.cancel()).resolves.not.toThrow();
    });

    it('should force kill unresponsive worker after 5 seconds', async () => {
      jest.useFakeTimers();

      await controller.start(createMockParams());
      expect(mockWorker.killed).toBe(false);

      await controller.cancel();

      // Fast-forward past 5 second timeout
      jest.advanceTimersByTime(6 * 1000);

      // Worker should be force killed
      expect(mockWorker.killed).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('Event Forwarding', () => {
    beforeEach(() => {
      // Need to start simulation and set up message handler
      controller.start(createMockParams());
    });

    it('should forward progress events to renderer', () => {
      // Simulate progress event from worker
      const progressPayload = {
        stage: 'battle',
        current: 50,
        total: 100,
        percentage: 50,
        message: 'Battle 50/100',
        timestamp: Date.now(),
      };

      emitWorkerEvent('message', {
        type: 'progress',
        payload: progressPayload,
      });

      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'simulation:progress',
        progressPayload
      );
    });

    it('should forward complete events to renderer', () => {
      const storeSpy = jest.spyOn(mockStorageService, 'storeSimulation');

      const completePayload = {
        simulationId: controller.getCurrentSimulationId(),
        projectPath: '/test/project',
        report: {},
        duration: 60000,
        seed: 12345,
      };

      emitWorkerEvent('message', {
        type: 'complete',
        payload: completePayload,
      });

      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'simulation:complete',
        completePayload
      );

      // Should also store in database
      expect(storeSpy).toHaveBeenCalled();
    });

    it('should forward error events to renderer', () => {
      const errorPayload = {
        title: 'Test Error',
        description: 'Test error description',
        code: 'ERR_TEST',
      };

      emitWorkerEvent('message', {
        type: 'error',
        payload: errorPayload,
      });

      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'simulation:error',
        errorPayload
      );
    });

    it('should handle missing window gracefully', async () => {
      // Mock no windows available
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows.mockReturnValue([]);

      // Should not throw when no window exists
      expect(() => {
        emitWorkerEvent('message', {
          type: 'progress',
          payload: {
            stage: 'initialization',
            current: 0,
            total: 100,
            percentage: 0,
            message: 'Starting',
            timestamp: Date.now(),
          },
        });
      }).not.toThrow();

      // Restore mock
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
    });

    it('should not send to destroyed windows', () => {
      mockIsDestroyed.mockReturnValue(true);

      emitWorkerEvent('message', {
        type: 'progress',
        payload: {
          stage: 'initialization',
          current: 0,
          total: 100,
          percentage: 0,
          message: 'Starting',
          timestamp: Date.now(),
        },
      });

      expect(mockWebContentsSend).not.toHaveBeenCalled();

      mockIsDestroyed.mockReturnValue(false);
    });
  });

  describe('Storage Integration', () => {
    it('should store simulation result on completion', async () => {
      await controller.start(createMockParams());

      const storeSpy = jest.spyOn(mockStorageService, 'storeSimulation');

      const completePayload = {
        simulationId: controller.getCurrentSimulationId()!,
        projectPath: '/test/project',
        report: {},
        duration: 60000,
        seed: 12345,
      };

      emitWorkerEvent('message', {
        type: 'complete',
        payload: completePayload,
      });

      expect(storeSpy).toHaveBeenCalledWith(
        completePayload.simulationId,
        completePayload.projectPath,
        expect.any(Object), // ReportData
        'SUCCESS'
      );
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on cleanup()', async () => {
      await controller.start(createMockParams());

      expect(controller.getWorker()).not.toBeNull();

      controller.cleanup();

      expect(controller.getWorker()).toBeNull();
      expect(controller.getCurrentSimulationId()).toBeNull();
      expect(controller.isRunning()).toBe(false);
    });

    it('should cancel termination timer on cleanup', async () => {
      jest.useFakeTimers();

      await controller.start(createMockParams());

      // Simulate completion to start warm pool timer
      emitWorkerEvent('message', {
        type: 'complete',
        payload: {
          simulationId: 'test-id',
          projectPath: '/test/project',
          report: {},
          duration: 1000,
          seed: 12345,
        },
      });

      // Cleanup before timer fires
      controller.cleanup();

      // Advance time past termination period
      jest.advanceTimersByTime(10 * 60 * 1000);

      // Should not cause errors (timer was cancelled)
      expect(controller.getWorker()).toBeNull();

      jest.useRealTimers();
    });

    it('should handle cleanup when no worker exists', () => {
      expect(() => controller.cleanup()).not.toThrow();
    });
  });

  describe('State Queries', () => {
    it('should return current simulation ID', async () => {
      const simulationId = await controller.start(createMockParams());

      expect(controller.getCurrentSimulationId()).toBe(simulationId);
    });

    it('should return null for simulation ID when not running', () => {
      expect(controller.getCurrentSimulationId()).toBeNull();
    });

    it('should return true for isRunning when worker is active', async () => {
      await controller.start(createMockParams());

      expect(controller.isRunning()).toBe(true);
    });

    it('should return false for isRunning when no worker', () => {
      expect(controller.isRunning()).toBe(false);
    });
  });

  describe('Unknown Message Types', () => {
    it('should log warning for unknown message types', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');

      await controller.start(createMockParams());

      emitWorkerEvent('message', { type: 'unknown', payload: {} });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SimulationController] Unknown message type:',
        expect.any(Object)
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
