/**
 * IPC Event Streaming Integration Tests
 *
 * Tests the complete flow from SimulationController to renderer events.
 * Validates:
 * - SimulationController forwards worker messages to renderer
 * - IPC handler registration works
 * - Event-based communication (no polling)
 *
 * @see planos/005-run-ttk-electron/tasks/02_task.md
 * @see planos/005-run-ttk-electron/tasks/05_task.md
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
// This test file uses 'any' for mock objects which is acceptable for testing

import { ipcMain, BrowserWindow, utilityProcess } from 'electron';
import { simulationController } from '../../services/simulation-controller.js';
import { registerSimulationHandlers } from '../simulation-handlers.js';
import type { WorkerToMainMessage } from '../../workers/types.js';

// Mock Electron modules
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
  },
  BrowserWindow: {
    getAllWindows: jest.fn(),
  },
  utilityProcess: {
    fork: jest.fn(),
  },
}));

// Mock uuid
jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-1234'),
}));


// ============================================================================
// Test Constants
// ============================================================================

const MOCK_DURATION = 5000;
const MOCK_SEED = 12345;
const MOCK_CURRENT_PROGRESS = 50;
const MOCK_TOTAL_PROGRESS = 100;
const MOCK_PERCENTAGE = 50;

describe('IPC Event Streaming Integration', () => {
  let mockWindow: jest.Mocked<BrowserWindow>;
  let mockWorker: any;
  let messageHandler: ((message: WorkerToMainMessage) => void) | undefined;
  // Capture handlers by channel name for order-independent testing
  let handlers: Map<string, (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up handler map to capture registered handlers
    handlers = new Map();

    // Mock ipcMain.handle to capture handlers
    (ipcMain.handle as jest.Mock).mockImplementation((
      channel: string,
      handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
    ) => {
      handlers.set(channel, handler);
    });

    // Create mock window
    mockWindow = {
      isDestroyed: jest.fn(() => false),
      webContents: {
        send: jest.fn(),
      },
    } as any;

    // Create mock worker
    mockWorker = {
       
      on: jest.fn((event: string, handler: any) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      }),
      postMessage: jest.fn(),
      kill: jest.fn(),
      killed: false,
      stdout: {
        on: jest.fn(),
      },
      stderr: {
        on: jest.fn(),
      },
    };

    (utilityProcess.fork as jest.Mock).mockReturnValue(mockWorker);

    // Mock BrowserWindow.getAllWindows to return mockWindow by default
    (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([mockWindow]);

    // Clear any existing simulation state
    if (simulationController.isRunning()) {
      simulationController.cancel();
    }
  });

  afterEach(() => {
    // Cleanup controller state
    simulationController.cleanup();
    handlers.clear();
  });

  describe('Event Forwarding via SimulationController', () => {
    it('should forward progress events to renderer', async () => {
      registerSimulationHandlers();

      // Start a simulation to spawn the worker
      await simulationController.start({
        projectPath: '/path/to/project',
        configPath: '/path/to/project/temp/test-config.json',
      });

      expect(messageHandler).toBeDefined();

      // Simulate worker sending progress message
      const progressMessage: WorkerToMainMessage = {
        type: 'progress',
        payload: {
          stage: 'battle',
          current: MOCK_CURRENT_PROGRESS,
          total: MOCK_TOTAL_PROGRESS,
          percentage: MOCK_PERCENTAGE,
          message: `Battle ${MOCK_CURRENT_PROGRESS}/${MOCK_TOTAL_PROGRESS}`,
          timestamp: Date.now(),
        },
      };

      messageHandler!(progressMessage);

      // Verify renderer received the event
      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        'simulation:progress',
        progressMessage.payload
      );
    });

    it('should forward complete events to renderer', async () => {
      registerSimulationHandlers();

      await simulationController.start({
        projectPath: '/path/to/project',
        configPath: '/path/to/project/temp/test-config.json',
      });

      const completeMessage: WorkerToMainMessage = {
        type: 'complete',
        payload: {
          simulationId: 'sim-123',
          projectPath: '/path/to/project',
           
          report: {} as any,
          duration: MOCK_DURATION,
          seed: MOCK_SEED,
        },
      };

      messageHandler!(completeMessage);

      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        'simulation:complete',
        completeMessage.payload
      );
    });

    it('should forward error events to renderer', async () => {
      registerSimulationHandlers();

      await simulationController.start({
        projectPath: '/path/to/project',
        configPath: '/path/to/project/temp/test-config.json',
      });

      const errorMessage: WorkerToMainMessage = {
        type: 'error',
        payload: {
          title: 'Simulation Failed',
          description: 'Invalid project path',
          code: 'ERR_INVALID_PATH',
        },
      };

      messageHandler!(errorMessage);

      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        'simulation:error',
        errorMessage.payload
      );
    });

    it('should handle unknown message types with exhaustiveness check', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn');

      registerSimulationHandlers();

      await simulationController.start({
        projectPath: '/path/to/project',
        configPath: '/path/to/project/temp/test-config.json',
      });

      // Cast to unknown type to test error handling
      const unknownMessage = { type: 'unknown', payload: {} } as unknown as WorkerToMainMessage;

      messageHandler!(unknownMessage);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SimulationController] Unknown message type:',
        unknownMessage
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Window State Handling', () => {
    it('should not send when no window is available', async () => {
      registerSimulationHandlers();

      // Return empty array (no windows)
      (BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);

      await simulationController.start({
        projectPath: '/path/to/project',
        configPath: '/path/to/project/temp/test-config.json',
      });

      const progressMessage: WorkerToMainMessage = {
        type: 'progress',
        payload: {
          stage: 'battle',
          current: MOCK_CURRENT_PROGRESS,
          total: MOCK_TOTAL_PROGRESS,
          percentage: MOCK_PERCENTAGE,
          message: `Battle ${MOCK_CURRENT_PROGRESS}/${MOCK_TOTAL_PROGRESS}`,
          timestamp: Date.now(),
        },
      };

      // Should not throw error
      expect(() => messageHandler!(progressMessage)).not.toThrow();
      expect(mockWindow.webContents.send).not.toHaveBeenCalled();
    });

    it('should not send to destroyed windows', async () => {
      registerSimulationHandlers();

      mockWindow.isDestroyed = jest.fn(() => true);

      await simulationController.start({
        projectPath: '/path/to/project',
        configPath: '/path/to/project/temp/test-config.json',
      });

      const progressMessage: WorkerToMainMessage = {
        type: 'progress',
        payload: {
          stage: 'battle',
          current: MOCK_CURRENT_PROGRESS,
          total: MOCK_TOTAL_PROGRESS,
          percentage: MOCK_PERCENTAGE,
          message: `Battle ${MOCK_CURRENT_PROGRESS}/${MOCK_TOTAL_PROGRESS}`,
          timestamp: Date.now(),
        },
      };

      messageHandler!(progressMessage);

      expect(mockWindow.webContents.send).not.toHaveBeenCalled();
    });
  });

  describe('IPC Handler Registration', () => {
    it('should register simulation:start handler', () => {
      registerSimulationHandlers();

      expect(handlers.has('simulation:start')).toBe(true);
      expect(handlers.get('simulation:start')).toBeInstanceOf(Function);
    });

    it('should register simulation:cancel handler', () => {
      registerSimulationHandlers();

      expect(handlers.has('simulation:cancel')).toBe(true);
      expect(handlers.get('simulation:cancel')).toBeInstanceOf(Function);
    });
  });

  describe('Polling Elimination', () => {
    it('should not use getSimulationProgress calls', () => {
      registerSimulationHandlers();

      // Assert no polling handler exists
      expect(handlers.has('simulation:getProgress')).toBe(false);
    });

    it('should use events instead of polling for progress updates', async () => {
      registerSimulationHandlers();

      // Get the start handler directly from the map
      const startHandler = handlers.get('simulation:start');
      expect(startHandler).toBeDefined();

      // Invoke the handler with proper mock event
      const mockEvent = {} as Electron.IpcMainInvokeEvent;
      await startHandler!(mockEvent, {
        projectPath: '/path/to/project',
        configPath: '/path/to/project/temp/test-config.json',
      });

      // Worker sends progress (event-based)
      const progressMessage: WorkerToMainMessage = {
        type: 'progress',
        payload: {
          stage: 'battle',
          current: MOCK_CURRENT_PROGRESS,
          total: MOCK_TOTAL_PROGRESS,
          percentage: MOCK_PERCENTAGE,
          message: `Battle ${MOCK_CURRENT_PROGRESS}/${MOCK_TOTAL_PROGRESS}`,
          timestamp: Date.now(),
        },
      };

      messageHandler!(progressMessage);

      // Progress is sent via webContents.send (event), not invoke
      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        'simulation:progress',
        expect.any(Object)
      );
    });
  });

  describe('Cleanup', () => {
    it('should cleanup worker on controller cleanup', async () => {
      registerSimulationHandlers();

      await simulationController.start({
        projectPath: '/path/to/project',
        configPath: '/path/to/project/temp/test-config.json',
      });

      expect(mockWorker.killed).toBe(false);

      simulationController.cleanup();

      expect(mockWorker.kill).toHaveBeenCalled();
    });

    it('should handle cleanup when no worker is running', () => {
      registerSimulationHandlers();

      expect(() => simulationController.cleanup()).not.toThrow();
    });
  });

  describe('Warm Pool Behavior', () => {
    it('should reuse worker for consecutive simulations', async () => {
      registerSimulationHandlers();

      // First simulation
      await simulationController.start({
        projectPath: '/path/to/project',
        configPath: '/path/to/project/temp/test-config.json',
      });

      const firstWorker = simulationController.getWorker();
      expect(firstWorker).toBeDefined();

      // Second simulation (should reuse worker)
      await simulationController.start({
        projectPath: '/path/to/project',
        configPath: '/path/to/project/temp/test-config.json',
      });

      const secondWorker = simulationController.getWorker();
      expect(secondWorker).toBe(firstWorker);

      // utilityProcess.fork should only be called once
      expect(utilityProcess.fork).toHaveBeenCalledTimes(1);
    });
  });
});
