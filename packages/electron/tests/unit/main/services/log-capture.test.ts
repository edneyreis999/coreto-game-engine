/**
 * Unit Tests: Log Capture Service
 *
 * Tests for CircularBuffer, LogCapture (via singleton), and LogAggregator (via singleton).
 * Verifies buffer operations, console override behavior, and log aggregation.
 *
 * @see packages/electron/src/main/services/log-capture.ts
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  logCapture,
  logAggregator,
  initializeLogCapture,
  type LogEntry,
  type LogBundle,
} from '../../../../src/main/services/log-capture.js';

// Test CircularBuffer by implementing it (it's not exported directly)
class TestCircularBuffer<T> {
  private buffer: T[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  push(entry: T): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getAll(): T[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }

  size(): number {
    return this.buffer.length;
  }
}

describe('CircularBuffer (via TestCircularBuffer)', () => {
  describe('basic operations', () => {
    it('should create buffer with default max size', () => {
      const buffer = new TestCircularBuffer<string>();
      expect(buffer.size()).toBe(0);
    });

    it('should create buffer with custom max size', () => {
      const buffer = new TestCircularBuffer<string>(5);
      expect(buffer.size()).toBe(0);
    });

    it('should add entries to buffer', () => {
      const buffer = new TestCircularBuffer<string>();
      buffer.push('first');
      buffer.push('second');
      expect(buffer.size()).toBe(2);
    });

    it('should return copy of buffer entries', () => {
      const buffer = new TestCircularBuffer<number>();
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      const entries = buffer.getAll();
      expect(entries).toEqual([1, 2, 3]);
      // Verify it's a copy, not the same reference
      entries.push(4);
      expect(buffer.getAll()).toEqual([1, 2, 3]);
    });

    it('should return empty array when buffer is empty', () => {
      const buffer = new TestCircularBuffer<string>();
      expect(buffer.getAll()).toEqual([]);
    });

    it('should clear all entries', () => {
      const buffer = new TestCircularBuffer<string>();
      buffer.push('first');
      buffer.push('second');
      buffer.clear();
      expect(buffer.size()).toBe(0);
      expect(buffer.getAll()).toEqual([]);
    });

    it('should report correct size', () => {
      const buffer = new TestCircularBuffer<number>(10);
      expect(buffer.size()).toBe(0);

      for (let i = 0; i < 5; i++) {
        buffer.push(i);
      }
      expect(buffer.size()).toBe(5);
    });
  });

  describe('FIFO eviction behavior', () => {
    it('should evict oldest entry when buffer is full', () => {
      const buffer = new TestCircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4); // Should evict 1

      const entries = buffer.getAll();
      expect(entries).toEqual([2, 3, 4]);
      expect(buffer.size()).toBe(3);
    });

    it('should maintain FIFO order during eviction', () => {
      const buffer = new TestCircularBuffer<string>(3);
      buffer.push('a');
      buffer.push('b');
      buffer.push('c');
      buffer.push('d'); // Evicts 'a'
      buffer.push('e'); // Evicts 'b'
      buffer.push('f'); // Evicts 'c'

      const entries = buffer.getAll();
      expect(entries).toEqual(['d', 'e', 'f']);
    });

    it('should handle rapid push operations without errors', () => {
      const buffer = new TestCircularBuffer<number>(5);
      for (let i = 0; i < 100; i++) {
        buffer.push(i);
      }

      expect(buffer.size()).toBe(5);
      const entries = buffer.getAll();
      expect(entries).toEqual([95, 96, 97, 98, 99]);
    });

    it('should handle single element buffer', () => {
      const buffer = new TestCircularBuffer<number>(1);
      buffer.push(1);
      expect(buffer.getAll()).toEqual([1]);

      buffer.push(2);
      expect(buffer.getAll()).toEqual([2]);

      buffer.push(3);
      expect(buffer.getAll()).toEqual([3]);
    });

    it('should not evict when buffer is not at capacity', () => {
      const buffer = new TestCircularBuffer<number>(5);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);

      const entries = buffer.getAll();
      expect(entries).toEqual([1, 2, 3]);
      expect(buffer.size()).toBe(3);
    });

    it('should handle clearing and refilling after eviction', () => {
      const buffer = new TestCircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4); // Evicts 1

      buffer.clear();
      expect(buffer.size()).toBe(0);

      buffer.push(10);
      buffer.push(20);
      expect(buffer.getAll()).toEqual([10, 20]);
    });
  });

  describe('edge cases', () => {
    it('should handle zero max size gracefully', () => {
      const buffer = new TestCircularBuffer<string>(0);
      buffer.push('test');
      expect(buffer.size()).toBe(0);
      expect(buffer.getAll()).toEqual([]);
    });

    it('should handle negative max size as zero', () => {
      const buffer = new TestCircularBuffer<string>(-5);
      buffer.push('test');
      expect(buffer.size()).toBe(0);
    });

    it('should handle multiple clear operations', () => {
      const buffer = new TestCircularBuffer<number>();
      buffer.push(1);
      buffer.clear();
      buffer.clear();
      buffer.clear();
      expect(buffer.size()).toBe(0);
    });

    it('should handle getting entries after multiple operations', () => {
      const buffer = new TestCircularBuffer<number>(3);
      buffer.push(1);
      buffer.push(2);
      buffer.getAll(); // First get
      buffer.push(3);
      buffer.push(4); // Evicts 1
      expect(buffer.getAll()).toEqual([2, 3, 4]);
    });
  });
});

describe('LogCapture (via singleton)', () => {
  // Store initial console methods before any tests run
  let initialConsole: Partial<typeof console>;

  beforeAll(() => {
    initialConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
  });

  beforeEach(() => {
    // Clear logCapture for isolated testing
    logCapture.clear();
    // Ensure log capture is initialized
    initializeLogCapture();
  });

  // Note: We don't restore console in afterAll since logCapture is a singleton
  // and the console override is meant to persist for the application lifetime

  describe('initialization', () => {
    it('should be initialized after calling initializeLogCapture', () => {
      expect(logCapture.isInitialized()).toBe(true);
    });

    it('should be idempotent', () => {
      const wasInitialized = logCapture.isInitialized();
      initializeLogCapture();
      expect(logCapture.isInitialized()).toBe(wasInitialized);
    });
  });

  describe('console override - log level', () => {
    it('should capture console.log calls', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.log('Test message');
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog).toMatchObject({
        level: 'info',
        source: 'main',
        message: 'Test message',
      });
      expect(lastLog.timestamp).toBeDefined();
    });

    it('should capture console.log with multiple arguments', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.log('Hello', 'world', 123);
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.message).toBe('Hello world 123');
    });

    it('should capture console.log with objects', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      const obj = { key: 'value', nested: { prop: 42 } };
      console.log('Object:', obj);
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.message).toContain('Object:');
      expect(lastLog.message).toContain('key');
    });

    it('should capture console.log with Error objects', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      const error = new Error('Test error');
      console.log('Got error:', error);
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.message).toContain('Got error:');
      expect(lastLog.message).toContain('Test error');
    });

  });

  describe('console override - warn level', () => {
    it('should capture console.warn calls', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.warn('Warning message');
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog).toMatchObject({
        level: 'warn',
        source: 'main',
        message: 'Warning message',
      });
    });
  });

  describe('console override - error level', () => {
    it('should capture console.error calls', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.error('Error message');
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog).toMatchObject({
        level: 'error',
        source: 'main',
        message: 'Error message',
      });
    });

    it('should extract stack trace from Error objects', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      const error = new Error('Test error');
      console.error(error);
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.stack).toBeDefined();
      expect(lastLog.stack).toContain('Test error');
    });

    it('should handle console.error with multiple arguments', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.error('Error:', 'details');
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.message).toBe('Error: details');
    });

  });

  describe('console override - debug level', () => {
    it('should capture console.debug calls', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.debug('Debug message');
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog).toMatchObject({
        level: 'debug',
        source: 'main',
        message: 'Debug message',
      });
    });
  });

  describe('addEntry', () => {
    it('should add log entries directly', () => {
      logCapture.clear();
      const entry: LogEntry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: 'info',
        source: 'main',
        message: 'Direct entry',
      };

      logCapture.addEntry(entry);
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(0);
      const lastLog = logs[logs.length - 1];
      expect(lastLog).toEqual(entry);
    });

    it('should handle entries with metadata', () => {
      logCapture.clear();
      const entry: LogEntry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: 'info',
        source: 'main',
        message: 'Entry with meta',
        meta: { userId: 123, action: 'test' },
      };

      logCapture.addEntry(entry);
      const logs = logCapture.getAll();

      expect(logs[0].meta).toEqual({ userId: 123, action: 'test' });
    });

    it('should handle entries with stack traces', () => {
      logCapture.clear();
      const entry: LogEntry = {
        timestamp: '2024-01-01T00:00:00.000Z',
        level: 'error',
        source: 'main',
        message: 'Error with stack',
        stack: 'Error: Test\n    at test.js:10:15',
      };

      logCapture.addEntry(entry);
      const logs = logCapture.getAll();

      expect(logs[0].stack).toBe('Error: Test\n    at test.js:10:15');
    });

    it('should evict old entries when buffer is full', () => {
      logCapture.clear();

      // Add many entries via addEntry to test eviction
      for (let i = 0; i < 1005; i++) {
        logCapture.addEntry({
          timestamp: `2024-01-01T00:00:${String(i).padStart(2, '0')}.000Z`,
          level: 'info',
          source: 'main',
          message: `Entry ${i}`,
        });
      }

      const logs = logCapture.getAll();
      // Default buffer size is 1000
      expect(logs.length).toBe(1000);
      // First entries should be evicted
      expect(logs[0].message).toBe('Entry 5');
      expect(logs[999].message).toBe('Entry 1004');
    });
  });

  describe('timestamp generation', () => {
    it('should generate ISO 8601 timestamps', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.log('Timestamp test');
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('formatMessage edge cases', () => {
    it('should handle null arguments', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.log(null);
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.message).toContain('null');
    });

    it('should handle undefined arguments', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.log(undefined);
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.message).toContain('undefined');
    });

    it('should handle mixed argument types', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.log('String:', 123, true, null, undefined, { key: 'value' });
      const logs = logCapture.getAll();

      expect(logs.length).toBeGreaterThan(initialSize);
      const lastLog = logs[logs.length - 1];
      expect(lastLog.message).toContain('String:');
      expect(lastLog.message).toContain('123');
      expect(lastLog.message).toContain('true');
    });
  });

  describe('integration scenarios', () => {
    it('should capture mixed log levels', () => {
      logCapture.clear();
      const initialSize = logCapture.size();

      console.debug('Debug 1');
      console.log('Info 1');
      console.warn('Warning 1');
      console.error('Error 1');
      console.log('Info 2');

      const logs = logCapture.getAll();
      expect(logs.length).toBe(initialSize + 5);

      // Check last 5 entries
      const newLogs = logs.slice(initialSize);
      expect(newLogs[0].level).toBe('debug');
      expect(newLogs[1].level).toBe('info');
      expect(newLogs[2].level).toBe('warn');
      expect(newLogs[3].level).toBe('error');
      expect(newLogs[4].level).toBe('info');
    });

    it('should work with clear operations', () => {
      logCapture.clear();
      console.log('First');
      expect(logCapture.size()).toBeGreaterThan(0);

      logCapture.clear();
      expect(logCapture.size()).toBe(0);

      console.log('After clear');
      expect(logCapture.size()).toBeGreaterThan(0);
    });
  });
});

describe('LogAggregator (via singleton)', () => {
  beforeEach(() => {
    logAggregator.clearRendererLogs();
    logCapture.clear();
    initializeLogCapture();
  });

  describe('addRendererLogs', () => {
    it('should store renderer logs', () => {
      const rendererLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          level: 'info',
          source: 'renderer',
          message: 'Renderer log 1',
        },
        {
          timestamp: '2024-01-01T00:00:01.000Z',
          level: 'warn',
          source: 'renderer',
          message: 'Renderer log 2',
        },
      ];

      logAggregator.addRendererLogs(rendererLogs);

      // Verify via createBundle
      const bundle = logAggregator.createBundle();
      expect(bundle.logs).toContainEqual(rendererLogs[0]);
      expect(bundle.logs).toContainEqual(rendererLogs[1]);
    });

    it('should replace existing renderer logs', () => {
      const firstLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          level: 'info',
          source: 'renderer',
          message: 'First batch',
        },
      ];

      const secondLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:01.000Z',
          level: 'info',
          source: 'renderer',
          message: 'Second batch',
        },
      ];

      logAggregator.addRendererLogs(firstLogs);
      logAggregator.addRendererLogs(secondLogs);

      const bundle = logAggregator.createBundle();
      expect(bundle.logs).toContainEqual(secondLogs[0]);
      // First batch should be replaced
      expect(bundle.logs).not.toContainEqual(firstLogs[0]);
    });
  });

  describe('clearRendererLogs', () => {
    it('should clear renderer logs', () => {
      const rendererLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          level: 'info',
          source: 'renderer',
          message: 'Renderer log',
        },
      ];

      logAggregator.addRendererLogs(rendererLogs);
      logAggregator.clearRendererLogs();

      // Create a bundle - should only have main logs now
      logCapture.clear(); // Clear main logs to isolate renderer
      const bundle = logAggregator.createBundle();

      expect(bundle.logs).toHaveLength(0);
    });
  });

  describe('createBundle', () => {
    it('should create a valid LogBundle', () => {
      const bundle = logAggregator.createBundle();

      expect(bundle).toMatchObject({
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        appVersion: expect.any(String),
        electronVersion: expect.any(String),
        platform: expect.any(String),
        logs: expect.any(Array),
      });
    });

    it('should include main process logs', () => {
      logCapture.clear();
      console.log('Main process log');

      const bundle = logAggregator.createBundle();

      expect(bundle.logs.length).toBeGreaterThan(0);
      const mainLog = bundle.logs.find((l) => l.message === 'Main process log');
      expect(mainLog).toMatchObject({
        level: 'info',
        source: 'main',
        message: 'Main process log',
      });
    });

    it('should include renderer logs', () => {
      logCapture.clear();
      const rendererLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          level: 'info',
          source: 'renderer',
          message: 'Renderer log',
        },
      ];

      logAggregator.addRendererLogs(rendererLogs);
      const bundle = logAggregator.createBundle();

      expect(bundle.logs).toContainEqual(rendererLogs[0]);
    });

    it('should merge and sort logs by timestamp', () => {
      logCapture.clear();

      // Add logs with specific timestamps
      logCapture.addEntry({
        timestamp: '2024-01-01T00:00:02.000Z',
        level: 'info',
        source: 'main',
        message: 'Main log 2',
      });

      logCapture.addEntry({
        timestamp: '2024-01-01T00:00:01.000Z',
        level: 'info',
        source: 'main',
        message: 'Main log 1',
      });

      const rendererLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:03.000Z',
          level: 'info',
          source: 'renderer',
          message: 'Renderer log 3',
        },
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          level: 'info',
          source: 'renderer',
          message: 'Renderer log 0',
        },
      ];

      logAggregator.addRendererLogs(rendererLogs);
      const bundle = logAggregator.createBundle();

      expect(bundle.logs).toHaveLength(4);
      expect(bundle.logs[0].message).toBe('Renderer log 0');
      expect(bundle.logs[1].message).toBe('Main log 1');
      expect(bundle.logs[2].message).toBe('Main log 2');
      expect(bundle.logs[3].message).toBe('Renderer log 3');
    });

    it('should include project path when provided', () => {
      const bundle = logAggregator.createBundle('/path/to/project');

      expect(bundle.projectPath).toBe('/path/to/project');
    });

    it('should omit project path when not provided', () => {
      const bundle = logAggregator.createBundle();

      expect(bundle.projectPath).toBeUndefined();
    });

    it('should generate unique bundle IDs', () => {
      const bundle1 = logAggregator.createBundle();
      const bundle2 = logAggregator.createBundle();

      expect(bundle1.id).not.toBe(bundle2.id);
    });

    it('should include platform information', () => {
      const bundle = logAggregator.createBundle();

      expect(bundle.platform).toBeDefined();
      expect(bundle.platform).toMatch(/^(darwin|linux|win32|freebsd|openbsd|sunos)$/);
    });

    it('should handle empty logs', () => {
      logCapture.clear();
      logAggregator.clearRendererLogs();
      const bundle = logAggregator.createBundle();

      expect(bundle.logs).toEqual([]);
    });
  });

  describe('UUID generation', () => {
    it('should generate valid UUID v4 format', () => {
      const bundle = logAggregator.createBundle();

      expect(bundle.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate different UUIDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(logAggregator.createBundle().id);
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('bundle timestamp', () => {
    it('should include bundle creation timestamp', () => {
      const before = new Date().toISOString();
      const bundle = logAggregator.createBundle();
      const after = new Date().toISOString();

      expect(bundle.timestamp).toBeDefined();
      expect(bundle.timestamp >= before).toBe(true);
      expect(bundle.timestamp <= after).toBe(true);
    });

    it('should generate ISO 8601 format timestamps', () => {
      const bundle = logAggregator.createBundle();

      expect(bundle.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('integration with LogCapture', () => {
    it('should aggregate logs from both processes', () => {
      logCapture.clear();
      logAggregator.clearRendererLogs();

      // Add main logs
      console.log('Main 1');
      console.warn('Main 2');

      // Add renderer logs
      const rendererLogs: LogEntry[] = [
        {
          timestamp: '2024-01-01T00:00:01.500Z',
          level: 'info',
          source: 'renderer',
          message: 'Renderer 1',
        },
        {
          timestamp: '2024-01-01T00:00:02.500Z',
          level: 'error',
          source: 'renderer',
          message: 'Renderer 2',
        },
      ];
      logAggregator.addRendererLogs(rendererLogs);

      const bundle = logAggregator.createBundle();
      expect(bundle.logs.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle mixed log levels in bundle', () => {
      logCapture.clear();

      console.debug('Debug');
      console.log('Info');
      console.warn('Warning');
      console.error('Error');

      const bundle = logAggregator.createBundle();
      const levels = new Set(bundle.logs.map((l) => l.level));

      expect(levels).toContain('debug');
      expect(levels).toContain('info');
      expect(levels).toContain('warn');
      expect(levels).toContain('error');
    });
  });
});

describe('initializeLogCapture', () => {
  beforeEach(() => {
    logCapture.clear();
  });

  it('should initialize the singleton logCapture instance', () => {
    expect(() => initializeLogCapture()).not.toThrow();
    expect(logCapture.isInitialized()).toBe(true);
  });

  it('should be idempotent', () => {
    initializeLogCapture();
    const wasInitialized = logCapture.isInitialized();

    initializeLogCapture();

    expect(logCapture.isInitialized()).toBe(wasInitialized);
  });

  it('should capture logs after initialization', () => {
    logCapture.clear();
    const initialSize = logCapture.size();
    initializeLogCapture();

    console.log('Test after init');
    const logs = logCapture.getAll();

    // Should have at least our new log
    expect(logs.length).toBeGreaterThan(initialSize);
    const lastLog = logs[logs.length - 1];
    expect(lastLog.message).toBe('Test after init');
  });
});

describe('TypeScript type safety', () => {
  it('should enforce LogEntry structure', () => {
    const entry: LogEntry = {
      timestamp: '2024-01-01T00:00:00.000Z',
      level: 'info',
      source: 'main',
      message: 'Test',
    };

    expect(entry.timestamp).toBeDefined();
    expect(entry.level).toBeDefined();
    expect(entry.source).toBeDefined();
    expect(entry.message).toBeDefined();
  });

  it('should allow optional meta in LogEntry', () => {
    const entryWithMeta: LogEntry = {
      timestamp: '2024-01-01T00:00:00.000Z',
      level: 'info',
      source: 'main',
      message: 'Test',
      meta: { key: 'value' },
    };

    expect(entryWithMeta.meta).toEqual({ key: 'value' });

    const entryWithoutMeta: LogEntry = {
      timestamp: '2024-01-01T00:00:00.000Z',
      level: 'info',
      source: 'main',
      message: 'Test',
    };

    expect(entryWithoutMeta.meta).toBeUndefined();
  });

  it('should allow optional stack in LogEntry', () => {
    const entryWithStack: LogEntry = {
      timestamp: '2024-01-01T00:00:00.000Z',
      level: 'error',
      source: 'main',
      message: 'Test',
      stack: 'Error: Test\n    at test.js:1:1',
    };

    expect(entryWithStack.stack).toBe('Error: Test\n    at test.js:1:1');
  });

  it('should enforce LogBundle structure', () => {
    const bundle: LogBundle = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      timestamp: '2024-01-01T00:00:00.000Z',
      appVersion: '1.0.0',
      electronVersion: '33.0.0',
      platform: 'darwin',
      logs: [],
    };

    expect(bundle.id).toBeDefined();
    expect(bundle.timestamp).toBeDefined();
    expect(bundle.appVersion).toBeDefined();
    expect(bundle.electronVersion).toBeDefined();
    expect(bundle.platform).toBeDefined();
    expect(bundle.logs).toBeDefined();
  });
});
