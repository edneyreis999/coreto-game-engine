/**
 * Unit Tests for Sample Configuration
 *
 * Validates that the sample config (examples/sample-config.json):
 * - Loads successfully with ZodConfigLoader
 * - Validates against ProjectConfigSchema
 * - Contains valid troop IDs from test fixtures
 * - Has valid party configurations
 * - Demonstrates the three test scenarios correctly
 *
 * IMPORTANT: Tests validate domain entity structure (flat properties),
 * NOT the JSON config structure (nested objects). ZodConfigLoader transforms:
 * - anchorLevelRange.{min,max} → anchorLevelMin, anchorLevelMax
 * - ttkTarget.{turns,actions,tolerance} → targetTtkTurns, targetTtkActions, tolerancePercent
 * - tolerance 0-1 range → 0-100 range (0.2 → 20)
 *
 * @see examples/sample-config.json
 * @see packages/core/src/infrastructure/config/schemas.ts
 * @see packages/core/src/core/domain/Trecho.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect, beforeAll, afterEach } from '@jest/globals';
import {
  registerDependencies,
  clearContainer,
  resolve,
  IConfigLoaderToken,
  type IConfigLoader,
  ProjectConfigSchema,
} from '@coreto/core';

// Path to sample config
const SAMPLE_CONFIG_PATH = path.join(
  __dirname,
  'sample-config.json'
);

// Path to test fixtures directory
const FIXTURES_PATH = path.join(
  process.cwd(),
  'tests/fixtures/sample-data'
);

// Path to Troops.json fixture (in data/ subdirectory for RPG Maker MZ structure)
const TROOPS_FIXTURE_PATH = path.join(FIXTURES_PATH, 'data', 'Troops.json');

// Path to Classes.json fixture (in data/ subdirectory for RPG Maker MZ structure)
const CLASSES_FIXTURE_PATH = path.join(FIXTURES_PATH, 'data', 'Classes.json');

describe('Sample Configuration Validation', () => {
  let configLoader: IConfigLoader;

  beforeAll(() => {
    registerDependencies();
    configLoader = resolve<IConfigLoader>(IConfigLoaderToken);
  });

  afterEach(() => {
    clearContainer();
  });

  describe('1.1: Load sample config with ZodConfigLoader successfully', () => {
    it('should load sample config without errors', async () => {
      // Act
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);

      // Assert
      expect(config).toBeDefined();
      expect(config.projectPath).toBeDefined();
      expect(config.reportOutputPath).toBeDefined();
    });

    it('should parse and validate against ProjectConfigSchema', () => {
      // Arrange
      const sampleConfigContent = fs.readFileSync(SAMPLE_CONFIG_PATH, 'utf-8');
      const rawConfig = JSON.parse(sampleConfigContent);

      // Act
      const validated = ProjectConfigSchema.parse(rawConfig);

      // Assert
      expect(validated).toBeDefined();
      expect(validated.trechos).toHaveLength(3);
    });
  });

  describe('1.2: Validate all trechos pass ProjectConfigSchema', () => {
    it('should validate happy-path trecho structure', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Act & Assert
      const happyPathTrecho = trechos.find(t => t.id === 'happy-path-trecho');
      expect(happyPathTrecho).toBeDefined();
      expect(happyPathTrecho?.id).toBe('happy-path-trecho');
      expect(happyPathTrecho?.name).toBe('Happy Path: TTK within tolerance');

      // Domain entity uses flat properties (anchorLevelMin/Max, not anchorLevelRange)
      expect(happyPathTrecho?.anchorLevelMin).toBe(5);
      expect(happyPathTrecho?.anchorLevelMax).toBe(10);

      // Domain entity uses flat properties (targetTtk*, tolerancePercent)
      expect(happyPathTrecho?.targetTtkTurns).toBe(5);
      expect(happyPathTrecho?.targetTtkActions).toBe(20);
      // Tolerance converted from 0-1 to 0-100 (0.2 → 20)
      expect(happyPathTrecho?.tolerancePercent).toBe(20);

      expect(happyPathTrecho?.troopIds).toEqual([1]);
      expect(happyPathTrecho?.party.members).toHaveLength(2);
    });

    it('should validate out-of-tolerance trecho structure', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Act & Assert
      const outToleranceTrecho = trechos.find(
        t => t.id === 'out-of-tolerance-trecho'
      );
      expect(outToleranceTrecho).toBeDefined();
      expect(outToleranceTrecho?.name).toContain('Out of Tolerance');

      // Domain entity uses flat properties
      expect(outToleranceTrecho?.targetTtkTurns).toBe(1);
      expect(outToleranceTrecho?.targetTtkActions).toBe(2);
      // Tolerance converted from 0-1 to 0-100 (0.1 → 10)
      expect(outToleranceTrecho?.tolerancePercent).toBe(10);
    });

    it('should validate edge-case trecho structure', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Act & Assert
      const edgeCaseTrecho = trechos.find(
        t => t.id === 'edge-case-max-party'
      );
      expect(edgeCaseTrecho).toBeDefined();
      expect(edgeCaseTrecho?.name).toContain('Edge Case');

      // Domain entity uses flat properties (anchorLevelMin/Max)
      expect(edgeCaseTrecho?.anchorLevelMin).toBe(99);
      expect(edgeCaseTrecho?.anchorLevelMax).toBe(99);

      expect(edgeCaseTrecho?.party.members).toHaveLength(4); // Max party size
    });
  });

  describe('1.3: Verify troop IDs exist in test fixture data', () => {
    it('should have all troop IDs from Troops.json fixture', async () => {
      // Arrange - Read Troops.json to get valid IDs
      const troopsData = JSON.parse(fs.readFileSync(TROOPS_FIXTURE_PATH, 'utf-8'));
      const validTroopIds = troopsData.map((t: any) => t.id);

      // Act - Load config and collect troop IDs
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);
      const configTroopIds = new Set<number>();
      for (const trecho of trechos) {
        for (const troopId of trecho.troopIds) {
          configTroopIds.add(troopId);
        }
      }

      // Assert - All troop IDs in config exist in Troops.json
      for (const troopId of configTroopIds) {
        expect(validTroopIds).toContain(troopId);
      }
    });

    it('should only use troop IDs 1 and 2 from test fixtures', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Act - Collect all troop IDs
      const allTroopIds: number[] = [];
      for (const trecho of trechos) {
        allTroopIds.push(...trecho.troopIds);
      }

      // Assert - Only use troops 1 (Goblin*2) and 2 (Gnomo*2)
      const uniqueTroopIds = [...new Set(allTroopIds)];
      expect(uniqueTroopIds.sort()).toEqual([1, 2]);
    });
  });

  describe('1.4: Check party configuration (1-4 members, valid classIds, levels 1-99)', () => {
    it('should have valid party sizes (1-4 members)', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Act & Assert - Check each trecho's party
      for (const trecho of trechos) {
        const memberCount = trecho.party.members.length;
        expect(memberCount).toBeGreaterThanOrEqual(1);
        expect(memberCount).toBeLessThanOrEqual(4);
      }
    });

    it('should have valid classIds from Classes.json fixture', async () => {
      // Arrange - Read Classes.json to get valid IDs
      const classesData = JSON.parse(
        fs.readFileSync(CLASSES_FIXTURE_PATH, 'utf-8')
      );
      const validClassIds = classesData.map((c: any) => c.id);

      // Act - Load config and collect class IDs
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Assert - All class IDs in config exist in Classes.json
      for (const trecho of trechos) {
        for (const member of trecho.party.members) {
          expect(validClassIds).toContain(member.classId);
        }
      }
    });

    it('should have valid levels (1-99)', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Act & Assert - Check each member's level
      for (const trecho of trechos) {
        for (const member of trecho.party.members) {
          expect(member.level).toBeGreaterThanOrEqual(1);
          expect(member.level).toBeLessThanOrEqual(99);
        }
      }
    });

    it('should demonstrate max party size (4 members) in edge case trecho', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Act
      const edgeCaseTrecho = trechos.find(
        t => t.id === 'edge-case-max-party'
      );

      // Assert
      expect(edgeCaseTrecho?.party.members).toHaveLength(4);
    });
  });

  describe('1.5: Validate TTK targets (positive turns/actions, tolerance 0-100)', () => {
    it('should have positive turns for all trechos', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Act & Assert - Domain entity uses targetTtkTurns
      for (const trecho of trechos) {
        expect(trecho.targetTtkTurns).toBeGreaterThan(0);
      }
    });

    it('should have positive actions for all trechos', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Act & Assert - Domain entity uses targetTtkActions
      for (const trecho of trechos) {
        expect(trecho.targetTtkActions).toBeGreaterThan(0);
      }
    });

    it('should have tolerance values between 0 and 100', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Act & Assert - Domain entity uses tolerancePercent (0-100 range)
      for (const trecho of trechos) {
        expect(trecho.tolerancePercent).toBeGreaterThanOrEqual(0);
        expect(trecho.tolerancePercent).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('1.6: Test path traversal protection (no .. in paths)', () => {
    it('should not allow path traversal in projectPath', () => {
      // Arrange
      const sampleConfigContent = fs.readFileSync(SAMPLE_CONFIG_PATH, 'utf-8');
      const rawConfig = JSON.parse(sampleConfigContent);

      // Act & Assert - Verify no path traversal sequences
      expect(rawConfig.projectPath).not.toContain('..');
    });

    it('should use absolute path for projectPath', () => {
      // Arrange
      const sampleConfigContent = fs.readFileSync(SAMPLE_CONFIG_PATH, 'utf-8');
      const rawConfig = JSON.parse(sampleConfigContent);

      // Act & Assert - Verify absolute path
      expect(path.isAbsolute(rawConfig.projectPath)).toBe(true);
    });
  });

  describe('1.7: Verify required fields present', () => {
    it('should have projectPath field', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);

      // Assert
      expect(config.projectPath).toBeDefined();
      expect(config.projectPath).toBeTruthy();
    });

    it('should have reportOutputPath field', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);

      // Assert
      expect(config.reportOutputPath).toBeDefined();
      expect(config.reportOutputPath).toBeTruthy();
    });

    it('should have trechos array with at least 1 trecho', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);

      // Assert
      expect(trechos).toBeDefined();
      expect(trechos.length).toBeGreaterThanOrEqual(1);
    });

    it('should have seed field with default value', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);

      // Assert
      expect(config.seed).toBeDefined();
      expect(config.seed).toBe(42);
    });

    it('should have maxBattleTurns field', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);

      // Assert
      expect(config.maxBattleTurns).toBeDefined();
      expect(config.maxBattleTurns).toBe(100);
    });
  });

  describe('Sample config scenarios', () => {
    it('should demonstrate happy path scenario with reasonable TTK', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);
      const happyTrecho = trechos.find(t => t.id === 'happy-path-trecho');

      // Assert
      expect(happyTrecho).toBeDefined();
      expect(happyTrecho?.name).toContain('Happy Path');
      // Has 20% tolerance allowing for reasonable variance (20, not 0.2)
      expect(happyTrecho?.tolerancePercent).toBe(20);
    });

    it('should demonstrate out-of-tolerance scenario for warnings', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);
      const outToleranceTrecho = trechos.find(
        t => t.id === 'out-of-tolerance-trecho'
      );

      // Assert
      expect(outToleranceTrecho).toBeDefined();
      expect(outToleranceTrecho?.name).toContain('Out of Tolerance');
      // Very strict tolerance (10%, not 0.1)
      expect(outToleranceTrecho?.tolerancePercent).toBe(10);
    });

    it('should demonstrate edge case with max party and level boundaries', async () => {
      // Arrange
      const config = await configLoader.loadConfig(SAMPLE_CONFIG_PATH);
      const trechos = await configLoader.loadTrechos(config);
      const edgeCaseTrecho = trechos.find(
        t => t.id === 'edge-case-max-party'
      );

      // Assert
      expect(edgeCaseTrecho).toBeDefined();
      expect(edgeCaseTrecho?.name).toContain('Edge Case');
      expect(edgeCaseTrecho?.party.members).toHaveLength(4);
      // Domain entity uses flat properties
      expect(edgeCaseTrecho?.anchorLevelMin).toBe(99);
      expect(edgeCaseTrecho?.anchorLevelMax).toBe(99);
    });
  });

  describe('Integration with test fixtures', () => {
    it('should point to valid test fixtures directory', () => {
      // Arrange
      const sampleConfigContent = fs.readFileSync(SAMPLE_CONFIG_PATH, 'utf-8');
      const rawConfig = JSON.parse(sampleConfigContent);

      // Act & Assert - Only check that path contains the expected directory name
      expect(rawConfig.projectPath).toContain('tests/fixtures/sample-data');
    });

    it('should use fixtures directory that actually exists', () => {
      // Assert - FIXTURES_PATH is computed from process.cwd(), which is portable
      expect(fs.existsSync(FIXTURES_PATH)).toBe(true);
    });

    it('should have Troops.json in fixtures directory', () => {
      // Assert
      expect(fs.existsSync(TROOPS_FIXTURE_PATH)).toBe(true);
    });

    it('should have Classes.json in fixtures directory', () => {
      // Assert
      expect(fs.existsSync(CLASSES_FIXTURE_PATH)).toBe(true);
    });
  });
});
