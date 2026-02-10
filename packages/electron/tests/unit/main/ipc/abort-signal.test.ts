/**
 * Unit Tests: Abort Signal Utilities
 *
 * Tests for abort signal helper utilities.
 * Verifies cancellation behavior and edge cases.
 *
 * @see packages/electron/src/main/ipc/abort-signal.ts
 * @see packages/electron/CLAUDE.md Task 05: Add Abort Signal Checks to IPC Handlers
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { checkAbortSignal, withAbortSignal, createTimeoutController, processWithAbortSignal } from '../../../../src/main/ipc/abort-signal.js';
import type { IpcMainInvokeEvent } from 'electron';

// Mock IpcMainInvokeEvent
const createMockEvent = (): IpcMainInvokeEvent => {
  return {
    sender: {
      once: jest.fn(),
      removeListener: jest.fn(),
    },
  } as unknown as IpcMainInvokeEvent;
};

describe('Abort Signal Utilities', () => {
  describe('checkAbortSignal', () => {
    it('should not throw when signal is not aborted', () => {
      const controller = new AbortController();
      expect(() => checkAbortSignal(controller.signal, 'test operation')).not.toThrow();
    });

    it('should throw when signal is aborted', () => {
      const controller = new AbortController();
      controller.abort();
      expect(() => checkAbortSignal(controller.signal, 'test operation')).toThrow('Operation cancelled: test operation');
    });

    it('should throw generic message when no operation specified', () => {
      const controller = new AbortController();
      controller.abort();
      expect(() => checkAbortSignal(controller.signal)).toThrow('Operation cancelled');
    });

    it('should handle rapid calls without performance degradation', () => {
      const controller = new AbortController();
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        checkAbortSignal(controller.signal);
      }
      const duration = Date.now() - start;
      // Should complete 10,000 checks in less than 20ms (tolerant for CI environments)
      expect(duration).toBeLessThan(20);
    });
  });

  describe('withAbortSignal', () => {
    it('should inject abort signal into handler', async () => {
      let receivedSignal: AbortSignal | null = null;
      const handler = async (signal: AbortSignal) => {
        receivedSignal = signal;
        return 'result';
      };

      const wrapped = withAbortSignal(handler);
      const mockEvent = createMockEvent();

      const result = await wrapped(mockEvent, null);

      expect(result).toBe('result');
      expect(receivedSignal).toBeInstanceOf(AbortSignal);
      expect(receivedSignal?.aborted).toBe(false);
    });

    it('should abort when renderer is destroyed', async () => {
      let receivedSignal: AbortSignal | null = null;
      const handler = async (signal: AbortSignal) => {
        receivedSignal = signal;
        // Wait for destroy event
        await new Promise(resolve => setTimeout(resolve, 10));
        checkAbortSignal(signal, 'after delay');
        return 'result';
      };

      const wrapped = withAbortSignal(handler);
      const mockEvent = createMockEvent();
      const mockSender = mockEvent.sender as { once: jest.Mock; removeListener: jest.Mock };

      // Simulate renderer destruction after a short delay
      setTimeout(() => {
        const destroyCallback = mockSender.once.mock.calls[0]?.[1];
        if (destroyCallback) {
          destroyCallback();
        }
      }, 5);

      await expect(wrapped(mockEvent, null)).rejects.toThrow('Operation cancelled: after delay');
      expect(receivedSignal?.aborted).toBe(true);
    });

    it('should clean up destroy listener after completion', async () => {
      const handler = async () => 'result';
      const wrapped = withAbortSignal(handler);
      const mockEvent = createMockEvent();
      const mockSender = mockEvent.sender as { once: jest.Mock; removeListener: jest.Mock };

      await wrapped(mockEvent, null);

      expect(mockSender.once).toHaveBeenCalledWith('destroyed', expect.any(Function));
      expect(mockSender.removeListener).toHaveBeenCalledWith('destroyed', expect.any(Function));
    });

    it('should clean up destroy listener after error', async () => {
      const handler = async () => {
        throw new Error('Handler error');
      };
      const wrapped = withAbortSignal(handler);
      const mockEvent = createMockEvent();
      const mockSender = mockEvent.sender as { once: jest.Mock; removeListener: jest.Mock };

      await expect(wrapped(mockEvent, null)).rejects.toThrow('Handler error');

      expect(mockSender.once).toHaveBeenCalledWith('destroyed', expect.any(Function));
      expect(mockSender.removeListener).toHaveBeenCalledWith('destroyed', expect.any(Function));
    });
  });

  describe('createTimeoutController', () => {
    it('should abort after timeout', async () => {
      const controller = createTimeoutController(50); // 50ms timeout
      expect(controller.signal.aborted).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 60));

      expect(controller.signal.aborted).toBe(true);
    });

    it('should not abort before timeout', async () => {
      const controller = createTimeoutController(100); // 100ms timeout
      expect(controller.signal.aborted).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(controller.signal.aborted).toBe(false);
    });

    it('should clear timeout when manually aborted', async () => {
      const controller = createTimeoutController(100);

      controller.abort();

      // Wait past original timeout
      await new Promise(resolve => setTimeout(resolve, 120));

      // Should not cause any errors (timeout was cleared)
      expect(controller.signal.aborted).toBe(true);
    });

    it('should allow immediate abort', () => {
      const controller = createTimeoutController(1000);

      expect(controller.signal.aborted).toBe(false);

      controller.abort();

      expect(controller.signal.aborted).toBe(true);
    });
  });

  describe('processWithAbortSignal', () => {
    it('should process all items without abort', async () => {
      const items = [1, 2, 3, 4, 5];
      const callback = jest.fn(async (item: number) => item * 2);
      const controller = new AbortController();

      const results = await processWithAbortSignal(items, controller.signal, callback);

      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(callback).toHaveBeenCalledTimes(5);
    });

    it('should check abort signal at default interval (every item)', async () => {
      const items = [1, 2, 3];
      const callback = jest.fn(async (item: number) => item);
      const controller = new AbortController();

      // Abort after processing second item
      callback.mockImplementationOnce(async (item: number) => item);
      callback.mockImplementationOnce(async (item: number) => {
        controller.abort();
        return item;
      });

      await expect(processWithAbortSignal(items, controller.signal, callback)).rejects.toThrow();
    });

    it('should check abort signal at custom interval', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const callback = jest.fn(async (item: number) => item);
      const controller = new AbortController();

      // Abort after 3 items (should check at items 1, 3, 5, 7, 9 with interval 2)
      let callCount = 0;
      callback.mockImplementation(async (item: number) => {
        callCount++;
        if (callCount === 3) {
          controller.abort();
        }
        return item;
      });

      await expect(
        processWithAbortSignal(items, controller.signal, callback, { checkInterval: 2 })
      ).rejects.toThrow();
    });

    it('should process items in order', async () => {
      const items = [3, 1, 4, 1, 5];
      const callback = async (item: number) => item * 10;
      const controller = new AbortController();

      const results = await processWithAbortSignal(items, controller.signal, callback);

      expect(results).toEqual([30, 10, 40, 10, 50]);
    });

    it('should preserve item index in callback', async () => {
      const items = ['a', 'b', 'c'];
      const indices: number[] = [];
      const callback = async (_item: string, index: number) => {
        indices.push(index);
        return index;
      };
      const controller = new AbortController();

      await processWithAbortSignal(items, controller.signal, callback);

      expect(indices).toEqual([0, 1, 2]);
    });
  });

  describe('integration scenarios', () => {
    it('should handle nested abort checks', async () => {
      const controller = new AbortController();
      const innerController = new AbortController();

      // Both signals must be aborted
      checkAbortSignal(controller.signal, 'outer');
      checkAbortSignal(innerController.signal, 'inner');

      // Abort inner signal
      innerController.abort();

      expect(() => checkAbortSignal(innerController.signal, 'inner check')).toThrow();
    });

    it('should work with async operations', async () => {
      const controller = new AbortController();
      const items = [100, 200, 300];
      const delays: number[] = [];

      const callback = async (item: number) => {
        const start = Date.now();
        await new Promise(resolve => setTimeout(resolve, 10));
        delays.push(Date.now() - start);
        checkAbortSignal(controller.signal, `after processing ${item}`);
        return item;
      };

      const results = await processWithAbortSignal(items, controller.signal, callback);

      expect(results).toEqual([100, 200, 300]);
      expect(delays.length).toBe(3);
      delays.forEach(delay => {
        expect(delay).toBeGreaterThanOrEqual(9);
      });
    });

    it('should handle rapid abort during processing', async () => {
      const controller = new AbortController();
      const items = Array.from({ length: 100 }, (_, i) => i);

      let processedCount = 0;
      const callback = async (item: number) => {
        processedCount++;
        // Abort after processing 10 items
        if (processedCount === 10) {
          controller.abort();
        }
        return item;
      };

      await expect(
        processWithAbortSignal(items, controller.signal, callback)
      ).rejects.toThrow();

      // Should have processed some items before abort
      expect(processedCount).toBeGreaterThan(0);
      expect(processedCount).toBeLessThan(100);
    });
  });
});
