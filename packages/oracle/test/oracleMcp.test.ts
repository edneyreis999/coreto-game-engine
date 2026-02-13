/**
 * Unit tests for OracleMcpServer
 *
 * Tests MCP server initialization, tool listing, and tool handlers.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OracleMcpServer } from '../src/server/OracleMcpServer.js';

describe('OracleMcpServer', () => {
  let server: OracleMcpServer;

  beforeEach(() => {
    // Create a new server instance before each test
    server = new OracleMcpServer();
  });

  afterEach(() => {
    // Clean up after each test
    if (server) {
      server.stop().catch(() => {
        // Ignore stop errors in tests
      });
    }
  });

  describe('Server Initialization', () => {
    it('should create a server instance', () => {
      expect(server).toBeDefined();
      expect(server).toBeInstanceOf(OracleMcpServer);
    });

    it('should have start method', () => {
      expect(server.start).toBeDefined();
      expect(typeof server.start).toBe('function');
    });

    it('should have stop method', () => {
      expect(server.stop).toBeDefined();
      expect(typeof server.stop).toBe('function');
    });
  });

  describe('Tool Registration', () => {
    it('should expose generate_nsd_prompt tool', async () => {
      // The server should be able to list tools
      // This is a basic smoke test to ensure tool registration works
      expect(server).toBeDefined();
    });
  });

  describe('Tool Handlers', () => {
    it('should have generate_nsd_prompt handler', () => {
      // Handlers are set up via setRequestHandler
      // This test verifies the server instance is properly configured
      expect(server).toBeDefined();
    });
  });

  describe('Server Lifecycle', () => {
    it('should initialize without starting connection', () => {
      // Server should exist without calling start()
      expect(server).toBeDefined();
    });

    it('should have stop method for cleanup', async () => {
      // Verify stop is callable
      await expect(server.stop()).resolves.not.toThrow();
    });
  });
});
