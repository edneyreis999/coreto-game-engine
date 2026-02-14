/**
 * Test Helpers for Oracle MCP Server Tests
 *
 * Provides common test utilities to reduce duplication and improve test isolation.
 * Following project's FakeBuilder pattern with proper mocking strategies.
 *
 * @module testHelpers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OracleMcpServer } from '../src/server/OracleMcpServer.js';
import { ClaudeAgentClient } from '../src/lib/claudeAgentClient.js';
import { ClaudeAuthConfigFakeBuilder } from './fakes/ClaudeAuthConfigFakeBuilder.js';
import { type ClaudeAuthConfig } from '../src/lib/auth.js';

/**
 * Create OracleMcpServer with test configuration.
 *
 * @returns OracleMcpServer instance
 *
 * @example
 * ```typescript
 * const server = createTestServer();
 * await server.start();
 * ```
 */
export function createTestServer(): OracleMcpServer {
  return new OracleMcpServer();
}

/**
 * Helper to create a client that's NOT initialized.
 *
 * Useful for testing initialization failures and validation.
 *
 * @returns Non-initialized ClaudeAgentClient instance
 *
 * @example
 * ```typescript
 * const client = createUninitializedClient();
 * await expect(client.init()).resolves.not.toThrow();
 * ```
 */
export function createUninitializedClient(): ClaudeAgentClient {
  return new ClaudeAgentClient();
}

/**
 * Helper to mock console.error for capturing MCP server logs.
 *
 * Returns cleanup function that must be called in afterEach.
 *
 * @returns Cleanup function to restore console.error
 *
 * @example
 * ```typescript
 * let cleanupErrorMock: () => void;
 *
 * beforeEach(() => {
 *   cleanupErrorMock = mockConsoleError();
 * });
 *
 * afterEach(() => {
 *   cleanupErrorMock();
 * });
 * ```
 */
export function mockConsoleError(): () => void {
  const originalConsoleError = console.error;
  const mockFn = vi.fn();

  console.error = mockFn;

  return () => {
    console.error = originalConsoleError;
  };
}

/**
 * Test data validation scenarios.
 *
 * Provides common invalid input combinations for testing validation.
 */
export const validationScenarios = {
  /** Empty NSD content */
  emptyNsdContent: {
    nsdContent: '',
    sceneName: 'Test Scene',
    projectPath: '/test/path',
    expectedError: 'nsdContent',
  },

  /** Empty scene name */
  emptySceneName: {
    nsdContent: '# Test NSD',
    sceneName: '',
    projectPath: '/test/path',
    expectedError: 'sceneName',
  },

  /** Empty project path */
  emptyProjectPath: {
    nsdContent: '# Test NSD',
    sceneName: 'Test Scene',
    projectPath: '',
    expectedError: 'projectPath',
  },

  /** Path traversal attempt */
  pathTraversal: {
    nsdContent: '# Test NSD',
    sceneName: 'Test Scene',
    projectPath: '/test/../path',
    expectedError: 'path traversal',
  },

  /** Valid input with optional questVariable */
  validWithQuestVariable: {
    nsdContent: '# Test NSD Content',
    sceneName: 'Test Scene',
    projectPath: '/valid/test/path',
    questVariable: 'Quest 01 Progress',
  },

  /** Valid input without questVariable */
  validWithoutQuestVariable: {
    nsdContent: '# Test NSD Content',
    sceneName: 'Test Scene',
    projectPath: '/valid/test/path',
  },
} as const;
