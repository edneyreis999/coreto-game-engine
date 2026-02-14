import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OracleMcpServer } from '../src/server/OracleMcpServer.js';

const originalConsoleError = console.error;
let mockConsoleError: ReturnType<typeof vi.fn>;

describe('mcp-server.ts', () => {
  beforeEach(() => {
    mockConsoleError = vi.fn();
    console.error = mockConsoleError;
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Server Initialization', () => {
    it('should have start method', () => {
      const server = new OracleMcpServer();
      expect(typeof server.start).toBe('function');
    });

    it('should call start when executed', async () => {
      const server = new OracleMcpServer();
      await server.start();
      expect(typeof server.start).toBe('function');
    });
  });

  describe('Startup Logs', () => {
    it('should log startup sequence', async () => {
      const server = new OracleMcpServer();
      await server.start();

      const callCount = mockConsoleError.mock.calls.length;
      expect(callCount).toBeGreaterThan(0);
    });
  });
});
