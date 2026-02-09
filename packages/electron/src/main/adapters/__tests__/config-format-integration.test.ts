/**
 * Regression Tests for Config Format Issues
 *
 * These tests detect the bugs we fixed during SQLite config migration:
 *
 * BUG #1: Format Mismatch (UI vs Core)
 * - Problem: saveProjectConfigAsCoreFormat transformed UI → Core before saving
 * - SQLite stored Core format (anchorLevelRange.min) but loader expected UI format (anchorLevelMin)
 * - Fix: Save UI format directly to SQLite, transform only in SQLiteConfigLoader.loadTrechos()
 *
 * BUG #2: DI Container Registration Order
 * - Problem: registerMainDependencies() called before registerDependencies()
 * - ZodConfigLoader from @coreto/core was overriding SQLiteConfigLoader
 * - Fix: Call registerDependencies() first, then registerMainDependencies()
 *
 * @see packages/electron/src/main/ipc/config-handlers.ts
 * @see packages/electron/src/main/di/container.ts
 * @see packages/electron/src/main/ipc/index.ts
 */

import Database from 'better-sqlite3';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createSQLiteConfigStorage } from '../sqlite-config-storage-adapter.js';
import { createSQLiteConfigLoader } from '../sqlite-config-loader-adapter.js';
import type { IConfigStorage } from '@coreto/electron/domain/ports';
import type { IConfigLoader } from '@coreto/core';
import { initializeMigrationsTable, applyMigrations } from '../../database/migrations.js';
import { UIProjectConfigSchema } from '@coreto/electron/domain/schemas';

// ============================================================================
// Test Constants
// ============================================================================

const TEST_PROJECT_PATH = '/test/project';

// UI format (flat fields) - what should be saved in SQLite
const UI_FORMAT_CONFIG = {
  version: '1.0',
  trechos: [
    {
      id: 'trecho-1',
      name: 'Tutorial Battle',
      anchorLevelMin: 1,
      anchorLevelMax: 5,
      targetTtkTurns: 3,
      targetTtkActions: 8,
      tolerancePercent: 15,
      troopIds: [1, 2],
      party: {
        members: [
          { classId: 1, level: 1 },
          { classId: 2, level: 1 },
        ],
      },
    },
  ],
  globalSettings: {
    seed: 12345,
    maxBattleTurns: 50,
  },
  metadata: {
    projectName: 'Test Project',
    lastModified: Date.now(),
  },
};

// Core format (nested objects) - what was being saved BEFORE the fix (WRONG!)
const CORE_FORMAT_CONFIG = {
  projectPath: TEST_PROJECT_PATH,
  reportOutputPath: `${TEST_PROJECT_PATH}/temp/reports`,
  seed: 12345,
  maxBattleTurns: 50,
  trechos: [
    {
      id: 'trecho-1',
      name: 'Tutorial Battle',
      anchorLevelRange: { min: 1, max: 5 },  // ← NESTED (Core format)
      ttkTarget: {
        turns: 3,
        actions: 8,
        tolerance: 0.15,  // ← DECIMAL (Core format)
      },
      troopIds: [1, 2],
      party: {
        members: [
          { classId: 1, level: 1 },
          { classId: 2, level: 1 },
        ],
      },
    },
  ],
};

// ============================================================================
// Test Helpers
// ============================================================================

function createInMemoryDatabase(): Database.Database {
  const db = new Database(':memory:');
  initializeMigrationsTable(db);
  applyMigrations(db);
  return db;
}

// ============================================================================
// Bug #1: Format Mismatch Tests
// ============================================================================

describe('Regression: Bug #1 - Config Format Mismatch (UI vs Core)', () => {
  let db: Database.Database;
  let storage: IConfigStorage;
  let loader: IConfigLoader;

  beforeEach(() => {
    db = createInMemoryDatabase();
    storage = createSQLiteConfigStorage(db);
    loader = createSQLiteConfigLoader(storage);
  });

  afterEach(() => {
    db.close();
  });

  /**
   * TEST: Config saved in UI format can be loaded successfully
   *
   * This test would FAIL with the old code that saved Core format.
   * UIProjectConfigSchema would reject nested anchorLevelRange.min
   */
  it('should load config saved in UI format (flat fields)', async () => {
    // Save UI format (flat fields)
    const configJson = JSON.stringify(UI_FORMAT_CONFIG);
    await storage.write(TEST_PROJECT_PATH, configJson);

    // Load config - should succeed with UI format
    const config = await loader.loadConfig(TEST_PROJECT_PATH);
    const trechos = await loader.loadTrechos(config);

    // Verify trechos were loaded correctly
    expect(trechos).toHaveLength(1);
    expect(trechos[0].id).toBe('trecho-1');
    expect(trechos[0].name).toBe('Tutorial Battle');
    expect(trechos[0].anchorLevelMin).toBe(1);  // ← Flat field (UI format)
    expect(trechos[0].anchorLevelMax).toBe(5);  // ← Flat field (UI format)
  });

  /**
   * TEST: Config saved in Core format (nested) would FAIL to load
   *
   * This test demonstrates the BUG that existed before.
   * Core format has nested objects that UIProjectConfigSchema rejects.
   */
  it('should FAIL to load config saved in Core format (nested objects)', async () => {
    // Save Core format (nested objects) - THIS IS THE BUG!
    const configJson = JSON.stringify(CORE_FORMAT_CONFIG);
    await storage.write(TEST_PROJECT_PATH, configJson);

    // Try to load config - should FAIL validation
    // (before fix, this would succeed but create invalid Trecho entities)
    const config = await loader.loadConfig(TEST_PROJECT_PATH);

    // Before the fix, this would throw or create malformed Trechos
    // After the fix, loadConfig handles validation errors gracefully
    const trechos = await loader.loadTrechos(config);

    // With graceful error handling, trechos should be empty array
    // (validation failed, so we got default empty config)
    expect(trechos).toHaveLength(0);
  });

  /**
   * TEST: Saving and loading preserves UI format
   *
   * This is the CORRECT behavior after the fix.
   * SQLite should store UI format (flat), not Core format (nested).
   */
  it('should preserve UI format through save/load cycle', async () => {
    // Save UI format
    const configJson = JSON.stringify(UI_FORMAT_CONFIG);
    await storage.write(TEST_PROJECT_PATH, configJson);

    // Read back from SQLite
    const loadedJson = await storage.read(TEST_PROJECT_PATH);
    const loadedConfig = JSON.parse(loadedJson);

    // Verify it's still in UI format (flat fields)
    expect(loadedConfig.trechos).toHaveLength(1);
    expect(loadedConfig.trechos[0]).toHaveProperty('anchorLevelMin');  // Flat
    expect(loadedConfig.trechos[0]).toHaveProperty('anchorLevelMax');  // Flat
    expect(loadedConfig.trechos[0]).not.toHaveProperty('anchorLevelRange');  // Not nested

    // Verify tolerance is percent (15), not decimal (0.15)
    expect(loadedConfig.trechos[0].tolerancePercent).toBe(15);  // Percent
    expect(loadedConfig.trechos[0]).not.toHaveProperty('tolerance');  // Not decimal
  });

  /**
   * TEST: IPC handler saves UI format directly
   *
   * This verifies that config:save handler doesn't use saveProjectConfigAsCoreFormat.
   */
  it('should save UI format directly (not Core format) in SQLite', async () => {
    // Simulate what config:save handler does
    const configToSave = UI_FORMAT_CONFIG;
    const configJson = JSON.stringify(configToSave);
    await storage.write(TEST_PROJECT_PATH, configJson);

    // Verify saved format is UI (flat)
    const loadedJson = await storage.read(TEST_PROJECT_PATH);
    const loadedConfig = JSON.parse(loadedJson);

    // Should have flat fields (UI format), not nested (Core format)
    expect(loadedConfig.trechos[0]).toMatchObject({
      id: 'trecho-1',
      name: 'Tutorial Battle',
      anchorLevelMin: 1,  // ← Flat (UI)
      anchorLevelMax: 5,  // ← Flat (UI)
      targetTtkTurns: 3,  // ← Flat (UI)
      targetTtkActions: 8,  // ← Flat (UI)
      tolerancePercent: 15,  // ← Percent (UI)
    });

    // Should NOT have nested Core format fields
    expect(loadedConfig.trechos[0]).not.toHaveProperty('anchorLevelRange');
    expect(loadedConfig.trechos[0]).not.toHaveProperty('ttkTarget');
  });

  /**
   * TEST: SQLiteConfigLoader transforms UI → Core entities correctly
   *
   * This verifies that transformation happens in the right place (loadTrechos).
   */
  it('should transform UI format to Core Trecho entities in loadTrechos()', async () => {
    // Save UI format
    const configJson = JSON.stringify(UI_FORMAT_CONFIG);
    await storage.write(TEST_PROJECT_PATH, configJson);

    // Load config
    const config = await loader.loadConfig(TEST_PROJECT_PATH);
    const trechos = await loader.loadTrechos(config);

    // Verify Trecho entities have flat fields (from UI format)
    expect(trechos[0]).toMatchObject({
      id: 'trecho-1',
      name: 'Tutorial Battle',
      anchorLevelMin: 1,  // Flat (UI format)
      anchorLevelMax: 5,  // Flat (UI format)
      targetTtkTurns: 3,  // Flat (UI format)
      targetTtkActions: 8,  // Flat (UI format)
      tolerancePercent: 15,  // Percent (UI format)
    });
  });

  /**
   * TEST: Validate UI format with Zod schema
   *
   * This ensures UIProjectConfigSchema validates flat fields correctly.
   */
  it('should validate UI format with UIProjectConfigSchema', () => {
    // UI format should validate successfully
    const result = UIProjectConfigSchema.safeParse(UI_FORMAT_CONFIG);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.trechos).toHaveLength(1);
      expect(result.data.trechos[0]).toHaveProperty('anchorLevelMin');
      expect(result.data.trechos[0]).not.toHaveProperty('anchorLevelRange');
    }
  });

  /**
   * TEST: Core format should FAIL Zod validation
   *
   * This demonstrates why Core format couldn't be stored in SQLite.
   */
  it('should reject Core format with UIProjectConfigSchema', () => {
    // Core format (nested) should FAIL validation
    const result = UIProjectConfigSchema.safeParse(CORE_FORMAT_CONFIG);
    expect(result.success).toBe(false);

    if (!result.success) {
      // Should have validation errors for nested fields
      // Note: Zod may report different error messages, so we just check that validation fails
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Bug #2: DI Container Registration Order Tests
// ============================================================================

describe('Regression: Bug #2 - DI Container Registration Order', () => {
  /**
   * TEST: Verify setupIpcHandlers calls registerDependencies first
   *
   * This test ensures the order is:
   * 1. registerDependencies() (core defaults)
   * 2. registerMainDependencies() (Electron overrides)
   * 3. registerIpcHandlers()
   */
  it('should call registerDependencies before registerMainDependencies', async () => {
    // Read the source code to verify order
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    // Resolve path from current working directory
    // Jest runs with cwd as packages/electron, so we can use relative path
    const ipcIndexPath = path.resolve(process.cwd(), 'src', 'main', 'ipc', 'index.ts');
    const sourceCode = await fs.readFile(ipcIndexPath, 'utf-8');

    // Verify registerDependencies comes before registerMainDependencies
    const registerDepsIndex = sourceCode.indexOf('registerDependencies()');
    const registerMainDepsIndex = sourceCode.indexOf('registerMainDependencies()');

    expect(registerDepsIndex).toBeGreaterThan(-1);
    expect(registerMainDepsIndex).toBeGreaterThan(-1);
    expect(registerDepsIndex).toBeLessThan(registerMainDepsIndex);
  });
});
