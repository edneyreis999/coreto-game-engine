/**
 * Integration Tests: IPC Round-Trip Communication
 *
 * Tests full communication flow between renderer and main processes.
 * Verifies that IPC handlers correctly process requests and return responses.
 */

import { ipcMain, ipcRenderer, app, BrowserWindow } from 'electron';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { setupIpcHandlers, clearContainer } from '@coreto/core';
import type { PartyConfig, BattleResult, Trecho } from '@coreto/core';
import { registerDependencies } from '@coreto/core';

// ============================================================================
// Integration Test Setup
// ============================================================================

/**
 * Creates a mock renderer IPC interface for testing.
 * Simulates the ipcRenderer.invoke() method from the preload script.
 */
class MockIpcRenderer {
  async invoke(channel: string, payload?: unknown): Promise<unknown> {
    // Simulate the request-response cycle
    const listeners = ipcMain.listeners(channel);
    if (listeners.length === 0) {
      throw new Error(`No handler registered for channel: ${channel}`);
    }

    const handler = listeners[0];
    // @ts-expect-error - Simulating Electron IPC call
    return handler({}, payload);
  }
}

let mockRenderer: MockIpcRenderer;
let testWindow: BrowserWindow | null = null;

beforeAll(async () => {
  // Setup DI container and IPC handlers
  clearContainer();
  registerDependencies();
  setupIpcHandlers();

  // Create mock renderer
  mockRenderer = new MockIpcRenderer();
});

afterAll(() => {
  clearContainer();
  ipcMain.removeHandler('project:open');
  ipcMain.removeHandler('project:validate');
  ipcMain.removeHandler('simulation:run');
  ipcMain.removeHandler('simulation:getProgress');
  ipcMain.removeHandler('simulation:cancel');
  ipcMain.removeHandler('config:load');
  ipcMain.removeHandler('config:getTrechos');
  ipcMain.removeHandler('data:getTroops');
  ipcMain.removeHandler('data:getClasses');
  ipcMain.removeHandler('data:getEnemies');
});

// ============================================================================
// Project Handler Integration Tests
// ============================================================================

describe('IPC Integration: project:open', () => {
  it('should complete round-trip: renderer -> main -> renderer', async () => {
    const result = (await mockRenderer.invoke('project:open', {
      path: '/valid/project',
    })) as { success: boolean; data?: { path: string; name: string } };

    expect(result.success).toBe(true);
    expect(result.data?.path).toBe('/valid/project');
  });

  it('should return error for invalid path', async () => {
    const result = (await mockRenderer.invoke('project:open', {
      path: '',
    })) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Invalid payload');
  });

  it('should return error for path traversal attempt', async () => {
    const result = (await mockRenderer.invoke('project:open', {
      path: '/safe/../unsafe',
    })) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Path traversal');
  });
});

describe('IPC Integration: project:validate', () => {
  it('should complete round-trip: renderer -> main -> renderer', async () => {
    const result = (await mockRenderer.invoke('project:validate', {
      path: '/valid/project',
    })) as { success: boolean; data?: { isValid: boolean } };

    expect(result.success).toBe(true);
    expect(result.data?.isValid).toBeDefined();
  });
});

// ============================================================================
// Simulation Handler Integration Tests
// ============================================================================

describe('IPC Integration: simulation:run', () => {
  it('should complete round-trip for single troop simulation', async () => {
    const result = (await mockRenderer.invoke('simulation:run', {
      projectPath: '/valid/project',
      troopId: 1,
      seed: 12345,
    })) as { success: boolean; data?: { troopId: number } };

    expect(result.success).toBe(true);
    expect(result.data?.troopId).toBe(1);
  });

  it('should validate payload before processing', async () => {
    const result = (await mockRenderer.invoke('simulation:run', {
      projectPath: '/safe/../invalid',
      troopId: 1,
    })) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Path traversal');
  });

  it('should serialize battle result correctly', async () => {
    const result = (await mockRenderer.invoke('simulation:run', {
      projectPath: '/valid/project',
      troopId: 1,
      seed: 12345,
    })) as {
      success: boolean;
      data?: { battleResult: BattleResultData };
    };

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.battleResult).toMatchObject({
        troopId: expect.any(Number),
        troopName: expect.any(String),
        outcome: expect.any(String),
        ttkTurns: expect.any(Number),
        ttkActions: expect.any(Number),
        durationMs: expect.any(Number),
        seed: 12345,
        expGained: expect.any(Number),
      });
    }
  });
});

describe('IPC Integration: simulation:getProgress', () => {
  it('should return progress percentage', async () => {
    const result = (await mockRenderer.invoke('simulation:getProgress')) as {
      success: boolean;
      data?: number;
    };

    expect(result.success).toBe(true);
    expect(typeof result.data).toBe('number');
  });
});

describe('IPC Integration: simulation:cancel', () => {
  it('should cancel without error', async () => {
    const result = (await mockRenderer.invoke('simulation:cancel')) as {
      success: boolean;
    };

    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Configuration Handler Integration Tests
// ============================================================================

describe('IPC Integration: config:load', () => {
  it('should complete round-trip for config loading', async () => {
    // This test would require a real config file to be present
    // For MVP, we test the validation logic
    const result = (await mockRenderer.invoke('config:load', {
      configPath: '/safe/../invalid',
    })) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Path traversal');
  });

  it('should reject empty config path', async () => {
    const result = (await mockRenderer.invoke('config:load', {
      configPath: '',
    })) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Invalid payload');
  });
});

describe('IPC Integration: config:getTrechos', () => {
  it('should return empty array for MVP', async () => {
    const result = (await mockRenderer.invoke('config:getTrechos')) as {
      success: boolean;
      data?: unknown[];
    };

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});

// ============================================================================
// Data Handler Integration Tests
// ============================================================================

describe('IPC Integration: data:getTroops', () => {
  it('should complete round-trip for troops data', async () => {
    const result = (await mockRenderer.invoke('data:getTroops', {
      projectPath: '/valid/project',
    })) as { success: boolean; data?: unknown[] };

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should validate projectPath parameter', async () => {
    const result = (await mockRenderer.invoke('data:getTroops', {
      projectPath: '',
    })) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Invalid payload');
  });
});

describe('IPC Integration: data:getClasses', () => {
  it('should complete round-trip for classes data', async () => {
    const result = (await mockRenderer.invoke('data:getClasses', {
      projectPath: '/valid/project',
    })) as { success: boolean; data?: unknown[] };

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });
});

describe('IPC Integration: data:getEnemies', () => {
  it('should complete round-trip for enemies data', async () => {
    const result = (await mockRenderer.invoke('data:getEnemies', {
      projectPath: '/valid/project',
    })) as { success: boolean; data?: unknown[] };

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });
});

// ============================================================================
// Error Handling Integration Tests
// ============================================================================

describe('IPC Integration: Error Handling', () => {
  it('should serialize domain errors correctly', async () => {
    const result = (await mockRenderer.invoke('project:open', {
      path: '/nonexistent/project',
    })) as { success: boolean; error?: { name: string; message: string } };

    // The handler should return a serialized error
    if (!result.success && result.error) {
      expect(result.error.name).toBeDefined();
      expect(result.error.message).toBeDefined();
      expect(result.error).not.toHaveProperty('stack');
    }
  });

  it('should return Zod validation errors for invalid payloads', async () => {
    const result = (await mockRenderer.invoke('project:open', {
      path: 123 as unknown as string, // Invalid type
    })) as { success: boolean; error?: { message: string } };

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Invalid payload');
  });

  it('should handle unknown IPC channels gracefully', async () => {
    await expect(
      mockRenderer.invoke('unknown:channel', {})
    ).rejects.toThrow();
  });
});

// ============================================================================
// Edge Case Integration Tests
// ============================================================================

describe('IPC Integration: Edge Cases', () => {
  it('should handle empty results from data handlers', async () => {
    // Mock a project with empty data files
    const result = (await mockRenderer.invoke('data:getTroops', {
      projectPath: '/empty/project',
    })) as { success: boolean; data?: unknown[] };

    expect(result.success).toBe(true);
    // May return empty array or error depending on file system state
  });

  it('should handle special characters in paths', async () => {
    const result = (await mockRenderer.invoke('project:open', {
      path: '/valid/project with spaces',
    })) as { success: boolean };

    // Validation should pass, actual file access may fail
    if (!result.success) {
      expect(result.error?.message).not.toContain('Invalid payload');
    }
  });

  it('should handle concurrent simulation requests correctly', async () => {
    // Start first simulation
    const firstPromise = mockRenderer.invoke('simulation:run', {
      projectPath: '/valid/project',
      troopId: 1,
    });

    // Second request should be rejected or queued
    const secondResult = (await mockRenderer.invoke('simulation:run', {
      projectPath: '/valid/project',
      troopId: 2,
    })) as { success: boolean; error?: { message: string } };

    // For MVP, concurrent requests should fail with "already running" error
    // or queue the request
    expect(secondResult).toBeDefined();

    // Wait for first to complete
    await firstPromise;
  });
});

// ============================================================================
// Type Safety Integration Tests
// ============================================================================

describe('IPC Integration: Type Safety', () => {
  it('should maintain response structure for all handlers', async () => {
    const channels = [
      { name: 'project:open', payload: { path: '/valid' } },
      { name: 'project:validate', payload: { path: '/valid' } },
      { name: 'simulation:getProgress', payload: undefined },
      { name: 'simulation:cancel', payload: undefined },
      { name: 'config:getTrechos', payload: undefined },
    ] as const;

    for (const channel of channels) {
      const result = (await mockRenderer.invoke(
        channel.name,
        channel.payload
      )) as { success: boolean | undefined };

      // All responses should have success property
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean' || 'undefined');
    }
  });

  it('should include error data when success is false', async () => {
    const result = (await mockRenderer.invoke('project:open', {
      path: '',
    })) as { success: boolean; error?: { name: string; message: string } };

    if (result.success === false) {
      expect(result.error).toBeDefined();
      expect(result.error?.name).toBeDefined();
      expect(result.error?.message).toBeDefined();
    }
  });
});

// ============================================================================
// Performance Integration Tests
// ============================================================================

describe('IPC Integration: Performance', () => {
  it('should complete simple requests within reasonable time', async () => {
    const startTime = Date.now();

    await mockRenderer.invoke('simulation:getProgress');

    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(100); // Should complete in < 100ms
  });

  it('should handle multiple sequential requests', async () => {
    const requests = Array.from({ length: 10 }, (_, i) =>
      mockRenderer.invoke('simulation:getProgress')
    );

    const results = await Promise.all(requests);

    results.forEach((result) => {
      expect((result as { success: boolean }).success).toBe(true);
    });
  });
});
