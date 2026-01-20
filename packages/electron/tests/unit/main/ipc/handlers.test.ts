/**
 * Unit Tests: IPC Handlers
 *
 * Tests all IPC handler functions with mocked Electron IPC and DI container.
 * Verifies payload validation, error handling, and response serialization.
 */

import { ipcMain } from 'electron';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { clearContainer } from '@coreto/core';
import type {
  ILogger,
  IFileSystem,
  IConfigLoader,
  IDataLoader,
  IBattleSimulator,
} from '@coreto/core';
import type { PartyConfig, BattleResult, Trecho } from '@coreto/core';
import { ValidationError, DomainError } from '@coreto/core';
import { IPC_HANDLERS } from '../../../../src/main/ipc/handlers.js';

// ============================================================================
// Mocks
// ============================================================================

const mockEvent = {} as Electron.IpcMainInvokeEvent;

// Mock logger
const mockLogger: ILogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Mock filesystem - using correct IFileSystem API
const mockFileSystem: IFileSystem = {
  exists: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  validateProjectPath: jest.fn(),
};

// Mock config loader - using correct IConfigLoader API
const mockConfigLoader: IConfigLoader = {
  loadConfig: jest.fn(),
  loadTrechos: jest.fn(),
  validate: jest.fn(),
};

// Mock data loader - using correct IDataLoader API
const mockDataLoader: IDataLoader = {
  validateProjectStructure: jest.fn(),
  loadDatabase: jest.fn(),
  validateReferences: jest.fn(),
  loadDataFile: jest.fn(),
};

// Mock battle simulator - using correct IBattleSimulator API
const mockBattleSimulator: IBattleSimulator = {
  initialize: jest.fn(),
  executeBattle: jest.fn(),
  getLastMetrics: jest.fn(),
  cleanup: jest.fn(),
};

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Creates a mock BattleResult for testing.
 */
function createMockBattleResult(overrides: Partial<BattleResult> = {}): BattleResult {
  return {
    troopId: 1,
    troopName: 'Test Troop',
    outcome: 'victory',
    ttkTurns: 3,
    ttkActions: 8,
    durationMs: 1250,
    seed: 12345,
    expGained: 100,
    ...overrides,
  };
}

/**
 * Creates a mock PartyConfig for testing.
 */
function createMockPartyConfig(): PartyConfig {
  // Import PartyConfig as value since we need to instantiate it
  const { PartyConfig: PartyConfigClass } = require('@coreto/core');
  return new PartyConfigClass([{ classId: 1, level: 5 }]);
}

/**
 * Creates a mock Trecho for testing.
 */
function createMockTrecho(overrides: Partial<Trecho> = {}): Trecho {
  const party = createMockPartyConfig();
  return {
    id: 'test-trecho',
    name: 'Test Trecho',
    anchorLevelMin: 1,
    anchorLevelMax: 10,
    targetTtkTurns: 3,
    targetTtkActions: 8,
    tolerancePercent: 15,
    troopIds: [1, 2, 3],
    party,
    isWithinTolerance: jest.fn().mockReturnValue(true),
    ...overrides,
  } as Trecho;
}

/**
 * Sets up common mock responses for a valid project.
 */
function setupValidProjectMocks(): void {
  (mockFileSystem.exists as jest.Mock).mockReturnValue(true);
  (mockFileSystem.readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));
  (mockFileSystem.validateProjectPath as jest.Mock).mockReturnValue(undefined);
}

// ============================================================================
// Setup and Teardown
// ============================================================================

beforeEach(() => {
  // Clear container and re-register dependencies with mocks
  clearContainer();

  // Register mocks using jest.mock
  jest.mock('@coreto/core', () => ({
    __esModule: true,
    ...jest.requireActual('@coreto/core'),
    resolve: jest.fn((token) => {
      if (token.toString().includes('Logger')) return mockLogger;
      if (token.toString().includes('FileSystem')) return mockFileSystem;
      if (token.toString().includes('ConfigLoader')) return mockConfigLoader;
      if (token.toString().includes('DataLoader')) return mockDataLoader;
      if (token.toString().includes('BattleSimulator')) return mockBattleSimulator;
      return null;
    }),
  }));

  setupValidProjectMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// Project Handler Tests
// ============================================================================

describe('IPC Handlers: project:open', () => {
  it('should return project info for valid project path', async () => {
    const result = await IPC_HANDLERS['project:open'](mockEvent, {
      path: '/valid/project/path',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.path).toBe('/valid/project/path');
      expect(result.data.isValid).toBe(true);
      expect(result.data.name).toBe('path');
    }
  });

  it('should reject project with path traversal', async () => {
    const result = await IPC_HANDLERS['project:open'](mockEvent, {
      path: '/valid/../project/path',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Invalid payload');
    }
  });

  it('should reject non-existent project directory', async () => {
    (mockFileSystem.exists as jest.Mock).mockReturnValue(false);

    const result = await IPC_HANDLERS['project:open'](mockEvent, {
      path: '/nonexistent/path',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('does not exist');
    }
  });

  it('should reject project without game.rmmzproject marker', async () => {
    (mockFileSystem.exists as jest.Mock).mockImplementation((path) => {
      if (typeof path !== 'string') return false;
      if (path && path.includes('game.rmmzproject')) return false;
      return true;
    });

    const result = await IPC_HANDLERS['project:open'](mockEvent, {
      path: '/invalid/project',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('game.rmmzproject');
    }
  });

  it('should reject empty project path', async () => {
    const result = await IPC_HANDLERS['project:open'](mockEvent, {
      path: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Invalid payload');
    }
  });
});

describe('IPC Handlers: project:validate', () => {
  it('should return valid result for correct project structure', async () => {
    const result = await IPC_HANDLERS['project:validate'](mockEvent, {
      path: '/valid/project/path',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isValid).toBe(true);
      expect(result.data.errors).toHaveLength(0);
    }
  });

  it('should return validation errors for missing files', async () => {
    mockFileSystem.fileExists.mockResolvedValue(false);

    const result = await IPC_HANDLERS['project:validate'](mockEvent, {
      path: '/invalid/project',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isValid).toBe(false);
      expect(result.data.errors.length).toBeGreaterThan(0);
    }
  });

  it('should validate all required data files', async () => {
    let callCount = 0;
    mockFileSystem.fileExists.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount < 12); // First 11 calls return true
    });

    const result = await IPC_HANDLERS['project:validate'](mockEvent, {
      path: '/partial/project',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isValid).toBe(false);
      expect(result.data.errors.some((e) => e.includes('missing'))).toBe(true);
    }
  });
});

// ============================================================================
// Simulation Handler Tests
// ============================================================================

describe('IPC Handlers: simulation:run', () => {
  it('should execute battle for specific troop', async () => {
    const mockResult = createMockBattleResult();
    mockBattleSimulator.executeBattle.mockResolvedValue(mockResult);

    const result = await IPC_HANDLERS['simulation:run'](mockEvent, {
      projectPath: '/valid/project',
      troopId: 1,
      seed: 12345,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.troopId).toBe(1);
      expect(result.data.battleResult.outcome).toBe('victory');
      expect(result.data.passed).toBe(true);
    }
  });

  it('should call simulator with correct parameters', async () => {
    const mockResult = createMockBattleResult();
    mockBattleSimulator.executeBattle.mockResolvedValue(mockResult);

    await IPC_HANDLERS['simulation:run'](mockEvent, {
      projectPath: '/valid/project',
      troopId: 5,
      seed: 42,
      maxTurns: 50,
    });

    expect(mockBattleSimulator.executeBattle).toHaveBeenCalledWith(
      expect.objectContaining({
        troopId: 5,
        seed: 42,
        maxTurns: 50,
      })
    );
  });

  it('should reject if simulation is already running', async () => {
    // First call starts simulation
    const mockResult = createMockBattleResult();
    mockBattleSimulator.executeBattle.mockImplementation(
      () =>
        new Promise((resolve) => {
          // Simulate long-running operation
          setTimeout(() => resolve(mockResult), 1000);
        })
    );

    const firstCall = IPC_HANDLERS['simulation:run'](mockEvent, {
      projectPath: '/valid/project',
      troopId: 1,
    });

    // Second immediate call should fail
    const secondResult = await IPC_HANDLERS['simulation:run'](mockEvent, {
      projectPath: '/valid/project',
      troopId: 2,
    });

    expect(secondResult.success).toBe(false);
    if (!secondResult.success) {
      expect(secondResult.error.message).toContain('already running');
    }

    // Clean up
    await firstCall;
  });

  it('should serialize BattleResult to IPC-safe format', async () => {
    const mockResult = createMockBattleResult({
      expGained: 250,
      outcome: 'victory',
    });
    mockBattleSimulator.executeBattle.mockResolvedValue(mockResult);

    const result = await IPC_HANDLERS['simulation:run'](mockEvent, {
      projectPath: '/valid/project',
      troopId: 1,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.battleResult).toEqual({
        troopId: 1,
        troopName: 'Test Troop',
        outcome: 'victory',
        ttkTurns: 3,
        ttkActions: 8,
        durationMs: 1250,
        seed: 12345,
        expGained: 250,
      });
    }
  });

  it('should reject invalid payload (path traversal)', async () => {
    const result = await IPC_HANDLERS['simulation:run'](mockEvent, {
      projectPath: '/valid/../project',
      troopId: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Path traversal');
    }
  });
});

describe('IPC Handlers: simulation:getProgress', () => {
  it('should return 0 when no simulation is running', async () => {
    const result = await IPC_HANDLERS['simulation:getProgress'](mockEvent, undefined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(0);
    }
  });
});

describe('IPC Handlers: simulation:cancel', () => {
  it('should cancel running simulation without error', async () => {
    const result = await IPC_HANDLERS['simulation:cancel'](mockEvent, undefined);

    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Configuration Handler Tests
// ============================================================================

describe('IPC Handlers: config:load', () => {
  it('should load and return project config', async () => {
    const mockConfig = {
      projectPath: '/test/project',
      reportOutputPath: '/test/reports',
      seed: 54321,
      maxBattleTurns: 50,
      trechos: [createMockTrecho()],
    };
    mockConfigLoader.load.mockResolvedValue(mockConfig);

    const result = await IPC_HANDLERS['config:load'](mockEvent, {
      configPath: '/test/config.json',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectPath).toBe('/test/project');
      expect(result.data.seed).toBe(54321);
      expect(result.data.trechos).toHaveLength(1);
    }
  });

  it('should reject empty config path', async () => {
    const result = await IPC_HANDLERS['config:load'](mockEvent, {
      configPath: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Invalid payload');
    }
  });

  it('should reject path traversal in config path', async () => {
    const result = await IPC_HANDLERS['config:load'](mockEvent, {
      configPath: '/safe/../unsafe/config.json',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Path traversal');
    }
  });
});

describe('IPC Handlers: config:getTrechos', () => {
  it('should return empty array for MVP', async () => {
    const result = await IPC_HANDLERS['config:getTrechos'](mockEvent, undefined);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });
});

// ============================================================================
// Data Handler Tests
// ============================================================================

describe('IPC Handlers: data:getTroops', () => {
  it('should return troops data from project', async () => {
    const mockTroopsData = [
      { id: 1, name: 'Goblin', members: [{ enemyId: 1, x: 100, y: 200, hidden: false }] },
      { id: 2, name: 'Slime', members: [{ enemyId: 2, x: 150, y: 250, hidden: true }] },
    ];
    mockFileSystem.readFile.mockResolvedValue(JSON.stringify(mockTroopsData));

    const result = await IPC_HANDLERS['data:getTroops'](mockEvent, {
      projectPath: '/valid/project',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Goblin');
    }
  });

  it('should reject path traversal', async () => {
    const result = await IPC_HANDLERS['data:getTroops'](mockEvent, {
      projectPath: '/valid/../project',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toContain('Path traversal');
    }
  });
});

describe('IPC Handlers: data:getClasses', () => {
  it('should return classes data from project', async () => {
    const mockClassesData = [
      { id: 1, name: 'Warrior', expTable: [0, 10, 25, 50] },
      { id: 2, name: 'Mage', expTable: [0, 12, 30, 60] },
    ];
    mockFileSystem.readFile.mockResolvedValue(JSON.stringify(mockClassesData));

    const result = await IPC_HANDLERS['data:getClasses'](mockEvent, {
      projectPath: '/valid/project',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Warrior');
    }
  });
});

describe('IPC Handlers: data:getEnemies', () => {
  it('should return enemies data from project', async () => {
    const mockEnemiesData = [
      {
        id: 1,
        name: 'Goblin',
        params: [100, 50, 10, 8, 5, 5],
        dropItems: [{ kind: 1, dataId: 1, denominator: 10 }],
      },
    ];
    mockFileSystem.readFile.mockResolvedValue(JSON.stringify(mockEnemiesData));

    const result = await IPC_HANDLERS['data:getEnemies'](mockEvent, {
      projectPath: '/valid/project',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Goblin');
    }
  });
});

// ============================================================================
// Error Serialization Tests
// ============================================================================

describe('Error Serialization', () => {
  it('should serialize DomainError to IPC-safe format', async () => {
    const domainError = new ValidationError('Test validation error', {
      field: 'test',
      value: 'invalid',
    });
    mockFileSystem.directoryExists.mockRejectedValue(domainError);

    const result = await IPC_HANDLERS['project:open'](mockEvent, {
      path: '/error/project',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.name).toBe('ValidationError');
      expect(result.error.message).toBe('Test validation error');
      expect(result.error.severity).toBe('critical');
      expect(result.error.context).toEqual({ field: 'test', value: 'invalid' });
      expect(result.error.timestamp).toBeDefined();
      // Stack trace should NOT be included
      expect(result.error).not.toHaveProperty('stack');
    }
  });

  it('should serialize generic Error to IPC-safe format', async () => {
    const genericError = new Error('Something went wrong');
    mockFileSystem.directoryExists.mockRejectedValue(genericError);

    const result = await IPC_HANDLERS['project:open'](mockEvent, {
      path: '/error/project',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.name).toBe('Error');
      expect(result.error.message).toBe('Something went wrong');
      expect(result.error.severity).toBe('critical');
    }
  });

  it('should serialize unknown error type to string', async () => {
    mockFileSystem.directoryExists.mockRejectedValue('String error');

    const result = await IPC_HANDLERS['project:open'](mockEvent, {
      path: '/error/project',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.name).toBe('UnknownError');
      expect(result.error.message).toBe('String error');
    }
  });
});

// ============================================================================
// Payload Validation Tests
// ============================================================================

describe('Payload Validation', () => {
  it('should validate Zod schemas for all handlers with payloads', async () => {
    // project:open - missing required field
    let result = await IPC_HANDLERS['project:open'](mockEvent, {});
    expect(result.success).toBe(false);

    // project:validate - missing required field
    result = await IPC_HANDLERS['project:validate'](mockEvent, {});
    expect(result.success).toBe(false);

    // simulation:run - missing required projectPath
    result = await IPC_HANDLERS['simulation:run'](mockEvent, { troopId: 1 });
    expect(result.success).toBe(false);

    // config:load - missing required field
    result = await IPC_HANDLERS['config:load'](mockEvent, {});
    expect(result.success).toBe(false);

    // data:getTroops - missing required field
    result = await IPC_HANDLERS['data:getTroops'](mockEvent, {});
    expect(result.success).toBe(false);
  });

  it('should accept valid payloads for all handlers', async () => {
    mockFileSystem.readFile.mockResolvedValue('[]');

    // Valid payloads should not throw validation errors
    const promises = [
      IPC_HANDLERS['project:open'](mockEvent, { path: '/valid' }),
      IPC_HANDLERS['project:validate'](mockEvent, { path: '/valid' }),
      IPC_HANDLERS['simulation:run'](mockEvent, {
        projectPath: '/valid',
        troopId: 1,
        seed: 123,
      }),
      IPC_HANDLERS['config:load'](mockEvent, { configPath: '/valid/config.json' }),
      IPC_HANDLERS['data:getTroops'](mockEvent, { projectPath: '/valid' }),
      IPC_HANDLERS['data:getClasses'](mockEvent, { projectPath: '/valid' }),
      IPC_HANDLERS['data:getEnemies'](mockEvent, { projectPath: '/valid' }),
    ];

    const results = await Promise.all(promises);

    // All should pass validation (may fail for other reasons)
    results.forEach((result) => {
      if (!result.success) {
        expect(result.error.message).not.toContain('Invalid payload');
      }
    });
  });
});
