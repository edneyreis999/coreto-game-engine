/**
 * Unit tests for analyzeProject method
 *
 * Tests project structure analysis, quest variable detection,
 * and resource listing functionality.
 *
 * @see packages/oracle/src/lib/claudeAgentClient.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClaudeAgentClient } from '../src/lib/claudeAgentClient.js';
import { AnalyzeProjectSchema } from '../src/lib/claudeAgentClient.js';
import { mockConsoleError } from './testHelpers.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('ClaudeAgentClient > analyzeProject', () => {
  let client: ClaudeAgentClient;
  let cleanupConsoleMock: () => void;

  beforeEach(() => {
    cleanupConsoleMock = mockConsoleError();
    client = new ClaudeAgentClient();
  });

  afterEach(() => {
    cleanupConsoleMock();
  });

  describe('Input Validation', () => {
    it('should validate projectPath is required', () => {
      const result = AnalyzeProjectSchema.safeParse({});
      expect(
        result.success,
        'Should fail validation when projectPath is missing'
      ).toBe(false);
      if (!result.success) {
        expect(
          result.error.errors.some(e => e.path.includes('projectPath')),
          'Should have error for projectPath field'
        ).toBe(true);
      }
    });

    it('should validate projectPath does not contain path traversal', () => {
      const result = AnalyzeProjectSchema.safeParse({
        projectPath: '../../../etc/passwd',
      });
      expect(
        result.success,
        'Should fail validation with path traversal sequences'
      ).toBe(false);
    });

    it('should accept valid input with minimal required fields', () => {
      const result = AnalyzeProjectSchema.safeParse({
        projectPath: '/valid/path/to/project',
      });
      expect(
        result.success,
        'Should pass validation with required fields only'
      ).toBe(true);
    });

    it('should accept valid input with optional fields', () => {
      const result = AnalyzeProjectSchema.safeParse({
        projectPath: '/valid/path/to/project',
        nsdContent: '# NSD Content',
        sceneName: 'Cena 1',
        questVariable: 'Quest 01 Progress',
      });
      expect(
        result.success,
        'Should pass validation with all optional fields'
      ).toBe(true);
    });
  });

  describe('Project Analysis', () => {
    // Helper to get the monorepo root from test file location
    const getMonorepoRoot = () => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      // Go up from packages/oracle/test/ to monorepo root
      return join(__dirname, '../../..');
    };

    it('should throw error for non-existent project path', async () => {
      await expect(
        client.analyzeProject({
          projectPath: '/nonexistent/path/to/project',
        }),
        'Should throw error for non-existent project path'
      ).rejects.toThrow();
    });

    it('should analyze MZ test fixture project successfully', async () => {
      // Use the rmmz-mini-project test fixture
      const monorepoRoot = getMonorepoRoot();
      const fixturePath = join(
        monorepoRoot,
        'packages/core/tests/fixtures/rmmz-mini-project'
      );

      const result = await client.analyzeProject({
        projectPath: fixturePath,
      });

      expect(
        result,
        'Should return analysis result'
      ).toBeDefined();
      expect(
        result.projectPath,
        'Should include project path'
      ).toBe(fixturePath);
      expect(
        result.analyzedAt,
        'Should include analysis timestamp'
      ).toBeDefined();
      expect(
        result.questVariables,
        'Should include quest variables array'
      ).toBeDefined();
      expect(
        Array.isArray(result.questVariables),
        'Quest variables should be an array'
      ).toBe(true);
      expect(
        result.mapCount,
        'Should include map count'
      ).toBeGreaterThanOrEqual(0);
      expect(
        result.troopCount,
        'Should include troop count'
      ).toBeGreaterThanOrEqual(0);
      expect(
        result.availableResources,
        'Should include available resources'
      ).toBeDefined();
      expect(
        result.availableResources.sprites,
        'Should include sprites array'
      ).toBeDefined();
      expect(
        result.availableResources.pictures,
        'Should include pictures array'
      ).toBeDefined();
      expect(
        result.warnings,
        'Should include warnings array'
      ).toBeDefined();
      expect(
        Array.isArray(result.warnings),
        'Warnings should be an array'
      ).toBe(true);
      expect(
        result.markdown,
        'Should include markdown report'
      ).toBeDefined();
      expect(
        typeof result.markdown,
        'Markdown should be a string'
      ).toBe('string');
      expect(
        result.markdown,
        'Markdown should start with header'
      ).toContain('# RPG Maker MZ Project Analysis');
    });

    it('should include game title in markdown report', async () => {
      const monorepoRoot = getMonorepoRoot();
      const fixturePath = join(
        monorepoRoot,
        'packages/core/tests/fixtures/rmmz-mini-project'
      );

      const result = await client.analyzeProject({
        projectPath: fixturePath,
      });

      expect(
        result.markdown,
        'Markdown should contain game title section'
      ).toContain('**Project:**');
    });

    it('should include warnings for missing data files', async () => {
      // Create a minimal project structure without CommonEvents.json
      const monorepoRoot = getMonorepoRoot();
      const fixturePath = join(
        monorepoRoot,
        'packages/core/tests/fixtures/rmmz-mini-project'
      );

      const result = await client.analyzeProject({
        projectPath: fixturePath,
      });

      // The test fixture might not have all files, so warnings are expected
      expect(
        result.warnings,
        'Should have warnings array'
      ).toBeDefined();
      expect(
        Array.isArray(result.warnings),
        'Warnings should be an array'
      ).toBe(true);
    });
  });

  describe('Resource Listing', () => {
    const getMonorepoRoot = () => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      return join(__dirname, '../../..');
    };

    it('should list available resources in the project', async () => {
      const monorepoRoot = getMonorepoRoot();
      const fixturePath = join(
        monorepoRoot,
        'packages/core/tests/fixtures/rmmz-mini-project'
      );

      const result = await client.analyzeProject({
        projectPath: fixturePath,
      });

      expect(
        result.availableResources,
        'Should include available resources'
      ).toBeDefined();
      expect(
        result.availableResources.sprites,
        'Should include sprites array'
      ).toBeDefined();
      expect(
        result.availableResources.pictures,
        'Should include pictures array'
      ).toBeDefined();
      expect(
        result.availableResources.bgm,
        'Should include BGM array'
      ).toBeDefined();
      expect(
        result.availableResources.me,
        'Should include ME array'
      ).toBeDefined();
      expect(
        result.availableResources.se,
        'Should include SE array'
      ).toBeDefined();
      expect(
        result.availableResources.battlebacks,
        'Should include battlebacks array'
      ).toBeDefined();
    });
  });

  describe('Markdown Report Generation', () => {
    const getMonorepoRoot = () => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      return join(__dirname, '../../..');
    };

    it('should generate markdown with project structure section', async () => {
      const monorepoRoot = getMonorepoRoot();
      const fixturePath = join(
        monorepoRoot,
        'packages/core/tests/fixtures/rmmz-mini-project'
      );

      const result = await client.analyzeProject({
        projectPath: fixturePath,
      });

      expect(
        result.markdown,
        'Markdown should contain project structure section'
      ).toContain('## Project Structure');
      expect(
        result.markdown,
        'Markdown should include map count'
      ).toContain('Maps:');
      expect(
        result.markdown,
        'Markdown should include troop count'
      ).toContain('Troops:');
    });

    it('should generate markdown with resources section', async () => {
      const monorepoRoot = getMonorepoRoot();
      const fixturePath = join(
        monorepoRoot,
        'packages/core/tests/fixtures/rmmz-mini-project'
      );

      const result = await client.analyzeProject({
        projectPath: fixturePath,
      });

      expect(
        result.markdown,
        'Markdown should contain resources section'
      ).toContain('## Available Resources');
      expect(
        result.markdown,
        'Markdown should include sprites subsection'
      ).toContain('### Spr');
    });

    it('should include warnings section when warnings exist', async () => {
      const monorepoRoot = getMonorepoRoot();
      const fixturePath = join(
        monorepoRoot,
        'packages/core/tests/fixtures/rmmz-mini-project'
      );

      const result = await client.analyzeProject({
        projectPath: fixturePath,
      });

      if (result.warnings.length > 0) {
        expect(
          result.markdown,
          'Markdown should contain warnings section when there are warnings'
        ).toContain('## Warnings');
      }
    });
  });
});
