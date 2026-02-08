/**
 * Unit Tests for SimulationController
 *
 * Tests the warm pool lifecycle, worker management, and event forwarding
 * using Fake implementations instead of mocks.
 *
 * Refactored to follow DDD testing best practices:
 * - Uses FakeUtilityProcess instead of manual mock
 * - Uses FakeReportStorageService instead of mock
 * - Tests observable behavior (events, state) instead of internals
 *
 * @see packages/electron/src/main/services/simulation-controller.ts
 * @see planos/005-run-ttk-electron/tasks/05_task.md
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { SimulationController } from '../simulation-controller.js';
import type { SimulationParams } from '../../workers/types.js';
import {
  FakeUtilityProcess,
  FakeReportStorageService,
  SimulationParamsBuilder,
  ProgressPayloadBuilder,
  ErrorPayloadBuilder,
} from './fakes/index.js';

// =============================================================================
// Electron Mocks (minimal, focused on IPC behavior)
// =============================================================================

interface MockBrowserWindow {
  isDestroyed: jest.Mock;
  webContents: MockWebContents;
}

interface MockWebContents {
  send: jest.Mock;
}

const mockWebContentsSend = jest.fn();
const mockIsDestroyed = jest.fn(() => false);

const mockWindow: MockBrowserWindow = {
  isDestroyed: mockIsDestroyed,
  webContents: {
    send: mockWebContentsSend,
  },
};

// Mock electron modules
jest.mock('electron', () => ({
  utilityProcess: {
    fork: jest.fn(),
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
// Test Factory
// =============================================================================

/**
 * Factory for creating test instances with proper setup.
 */
class SimulationControllerTestFactory {
  private fakeWorker?: FakeUtilityProcess;
  private fakeStorage?: FakeReportStorageService;
  private controller?: SimulationController;

  /**
   * Creates a fresh SimulationController with all dependencies.
   */
  create(): {
    controller: SimulationController;
    fakeWorker: FakeUtilityProcess;
    fakeStorage: FakeReportStorageService;
  } {
    this.fakeWorker = new FakeUtilityProcess();
    this.fakeStorage = new FakeReportStorageService();
    this.controller = new SimulationController();

    // Inject fake storage
    this.controller.setStorageService(this.fakeStorage as unknown as ReportStorageService);

    // Mock utilityProcess.fork to return our fake worker
    const { utilityProcess } = require('electron');
    utilityProcess.fork.mockReturnValue(this.fakeWorker);

    return {
      controller: this.controller!,
      fakeWorker: this.fakeWorker,
      fakeStorage: this.fakeStorage,
    };
  }

  /**
   * Gets the current worker instance from controller (for testing).
   */
  getCurrentWorker(controller: SimulationController): FakeUtilityProcess | null {
    return controller.getWorker() as FakeUtilityProcess | null;
  }
}

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Creates mock simulation parameters.
 */
function createMockParams(): Omit<SimulationParams, 'simulationId'> {
  return new SimulationParamsBuilder().buildWithoutId();
}

// =============================================================================
// Test Suite
// =============================================================================

describe('SimulationController', () => {
  let factory: SimulationControllerTestFactory;
  let controller: SimulationController;
  let fakeWorker: FakeUtilityProcess;
  let fakeStorage: FakeReportStorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDestroyed.mockReturnValue(false);

    factory = new SimulationControllerTestFactory();
    const setup = factory.create();
    controller = setup.controller;
    fakeWorker = setup.fakeWorker;
    fakeStorage = setup.fakeStorage;
  });

  afterEach(() => {
    controller.cleanup();
    jest.useRealTimers();
  });

  describe('Warm Pool Lifecycle', () => {
    it('should spawn new worker on first start', async () => {
      const { utilityProcess } = require('electron');

      const simulationId = await controller.start(createMockParams());

      expect(simulationId).toBe('test-uuid-1234');
      expect(utilityProcess.fork).toHaveBeenCalledTimes(1);
      expect(controller.getCurrentSimulationId()).toBe(simulationId);
      expect(controller.isRunning()).toBe(true);
    });

    it('should reuse worker for consecutive simulations (warm pool)', async () => {
      // First simulation
      await controller.start(createMockParams());
      const worker1 = factory.getCurrentWorker(controller);

      // Second simulation within warm pool window
      await controller.start(createMockParams());
      const worker2 = factory.getCurrentWorker(controller);

      // Should reuse same worker instance
      expect(worker2).toBe(worker1);
      expect(controller.getCurrentSimulationId()).toBeDefined();
    });

    it('should terminate worker after 5 minutes idle', async () => {
      jest.useFakeTimers();

      await controller.start(createMockParams());

      // Simulate completion to start warm pool timer
      fakeWorker.emitComplete(controller.getCurrentSimulationId()!, '/test/project');

      // Fast-forward 4 minutes - worker should still be alive
      jest.advanceTimersByTime(4 * 60 * 1000);
      expect(factory.getCurrentWorker(controller)).not.toBeNull();

      // Fast-forward past 5 minutes - worker should be terminated
      jest.advanceTimersByTime(2 * 60 * 1000); // 6 minutes total
      expect(factory.getCurrentWorker(controller)).toBeNull();

      jest.useRealTimers();
    });

    it('should cancel termination timer on new simulation', async () => {
      jest.useFakeTimers();

      await controller.start(createMockParams());

      // Simulate completion to start warm pool timer
      fakeWorker.emitComplete(controller.getCurrentSimulationId()!, '/test/project');

      // Advance time but not enough to terminate
      jest.advanceTimersByTime(2 * 60 * 1000);

      // Start new simulation should cancel timer
      await controller.start(createMockParams());

      // Worker should still be alive after original 5 min would have passed
      jest.advanceTimersByTime(4 * 60 * 1000);
      expect(factory.getCurrentWorker(controller)).not.toBeNull();

      jest.useRealTimers();
    });
  });

  describe('Cancellation', () => {
    it('should send cancel message to worker', async () => {
      await controller.start(createMockParams());

      await controller.cancel();

      expect(fakeWorker.hasMessageType('cancel')).toBe(true);
      const cancelMessages = fakeWorker.getMessages().filter((m) => m.type === 'cancel');
      expect(cancelMessages).toHaveLength(1);
    });

    it('should handle cancel when no worker is running', async () => {
      await expect(controller.cancel()).resolves.not.toThrow();
    });

    it('should force kill unresponsive worker after 5 seconds', async () => {
      jest.useFakeTimers();

      await controller.start(createMockParams());
      expect(fakeWorker.killed).toBe(false);

      await controller.cancel();

      // Fast-forward past 5 second timeout
      jest.advanceTimersByTime(6 * 1000);

      // Worker should be force killed
      expect(fakeWorker.killed).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('Event Forwarding', () => {
    beforeEach(async () => {
      await controller.start(createMockParams());
    });

    it('should forward progress events to renderer', () => {
      const progressPayload = new ProgressPayloadBuilder().asBattle(50, 100).build();

      fakeWorker.receiveMessage({
        type: 'progress',
        payload: progressPayload,
      });

      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'simulation:progress',
        expect.objectContaining({
          stage: 'battle',
          current: 50,
          total: 100,
          percentage: 50,
        })
      );
    });

    it('should forward complete events to renderer and store result', async () => {
      const simulationId = controller.getCurrentSimulationId()!;

      fakeWorker.emitComplete(simulationId, '/test/project');

      // Should forward to renderer
      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'simulation:complete',
        expect.objectContaining({
          simulationId,
          projectPath: '/test/project',
        })
      );

      // Should store in database
      expect(fakeStorage.hasSimulation(simulationId)).toBe(true);
      expect(fakeStorage.getStoreCallCount()).toBe(1);
    });

    it('should forward error events to renderer', () => {
      const errorPayload = new ErrorPayloadBuilder()
        .asValidationError('Invalid configuration')
        .build();

      fakeWorker.receiveMessage({
        type: 'error',
        payload: errorPayload,
      });

      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'simulation:error',
        expect.objectContaining({
          title: 'Validation Error',
          code: 'ERR_VALIDATION',
        })
      );
    });

    it('should handle missing window gracefully', () => {
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows.mockReturnValue([]);

      // Should not throw when no window exists
      expect(() => {
        fakeWorker.emitProgress('initialization', 0, 100, 'Starting');
      }).not.toThrow();

      // Restore mock
      BrowserWindow.getAllWindows.mockReturnValue([mockWindow]);
    });

    it('should not send to destroyed windows', () => {
      mockIsDestroyed.mockReturnValue(true);

      fakeWorker.emitProgress('initialization', 0, 100, 'Starting');

      expect(mockWebContentsSend).not.toHaveBeenCalled();

      mockIsDestroyed.mockReturnValue(false);
    });
  });

  describe('Storage Integration', () => {
    it('should store simulation result on completion', async () => {
      const simulationId = await controller.start(createMockParams());

      fakeWorker.emitComplete(simulationId, '/test/project');

      const stored = fakeStorage.getSimulation(simulationId);
      expect(stored).toBeDefined();
      expect(stored!.simulationId).toBe(simulationId);
      expect(stored!.status).toBe('SUCCESS');
    });

    it('should store with correct project path', async () => {
      const params = new SimulationParamsBuilder()
        .withProjectPath('/custom/project')
        .buildWithoutId();

      const simulationId = await controller.start(params);

      fakeWorker.emitComplete(simulationId, '/custom/project');

      const stored = fakeStorage.getSimulation(simulationId);
      expect(stored!.projectPath).toBe('/custom/project');
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on cleanup()', async () => {
      await controller.start(createMockParams());

      expect(factory.getCurrentWorker(controller)).not.toBeNull();

      controller.cleanup();

      expect(factory.getCurrentWorker(controller)).toBeNull();
      expect(controller.getCurrentSimulationId()).toBeNull();
      expect(controller.isRunning()).toBe(false);
    });

    it('should cancel termination timer on cleanup', async () => {
      jest.useFakeTimers();

      await controller.start(createMockParams());

      // Simulate completion to start warm pool timer
      fakeWorker.emitComplete(controller.getCurrentSimulationId()!, '/test/project');

      // Cleanup before timer fires
      controller.cleanup();

      // Advance time past termination period
      jest.advanceTimersByTime(10 * 60 * 1000);

      // Should not cause errors (timer was cancelled)
      expect(factory.getCurrentWorker(controller)).toBeNull();

      jest.useRealTimers();
    });

    it('should handle cleanup when no worker exists', () => {
      expect(() => controller.cleanup()).not.toThrow();
    });
  });

  describe('State Queries', () => {
    it('should return current simulation ID when running', async () => {
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

      // Send unknown message type to test error handling
      fakeWorker.receiveMessage({ type: 'unknown' } as unknown);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Unknown message type:')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Worker Crash Handling', () => {
    it('should notify renderer on worker crash', async () => {
      await controller.start(createMockParams());

      // Simulate worker crash
      fakeWorker.crash(1);

      expect(factory.getCurrentWorker(controller)).toBeNull();

      // Should send error to renderer
      expect(mockWebContentsSend).toHaveBeenCalledWith(
        'simulation:error',
        expect.objectContaining({
          title: 'Simulation Process Crashed',
          code: 'ERR_WORKER_CRASH',
        })
      );
    });
  });
});
