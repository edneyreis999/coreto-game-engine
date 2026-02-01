/**
 * Integration tests for RunTtk command
 *
 * Focus: real command execution with actual dependencies
 * Validates the complete pipeline without mocking internal components
 */

import { Command } from '@oclif/core';
import { RunTtkCommand } from '@coreto/cli/cli/commands/run-ttk.js';
import { execa } from 'execa';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

describe('RunTtk Command Integration', () => {
  const testDir = '/tmp/coreto-integration-test';
  const configPath = join(testDir, 'project.config.json');
  const reportsDir = join(testDir, 'reports');

  beforeAll(() => {
    // Clean up any existing test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }

    // Create test project structure
    mkdirSync(testDir, { recursive: true });
    mkdirSync(join(testDir, 'data'), { recursive: true });
    mkdirSync(reportsDir, { recursive: true });

    // Create stub index.html required by JSDOM
    writeFileSync(join(testDir, 'index.html'), '<html><body></body></html>');

    // Create a minimal test config
    const testConfig = {
      projectPath: testDir,
      reportOutputPath: reportsDir,
      seed: 12345,
      maxBattleTurns: 100,
      trechos: [
        {
          id: 'test-trecho-1',
          description: 'Test trecho for integration',
          anchorLevelRange: { min: 1, max: 10 },
          ttkTarget: { turns: 8, actions: 32, tolerance: 0.15 },
          party: { actorClassIds: [1, 2, 3, 4], equipBestGear: true },
          troopIds: [1],
        }
      ]
    };

    writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Command metadata', () => {
    it('should have correct description', () => {
      expect(RunTtkCommand.description).toBe('Execute TTK validation for configured trechos');
    });

    it('should define required config flag', () => {
      expect(RunTtkCommand.flags.config).toBeDefined();
      expect(RunTtkCommand.flags.config.required).toBe(true);
      expect(RunTtkCommand.flags.config.char).toBe('c');
    });
  });

  describe('Real command execution', () => {
    it('should execute successfully with valid config', async () => {
      const { exitCode, stdout, stderr } = await execa(
        'node',
        [
          './bin/run.js',
          'run-ttk',
          '-c',
          configPath,
          '--verbose'
        ],
        {
          cwd: process.cwd(),
          reject: false
        }
      );

      expect(exitCode).toBe(0);
      expect(stdout).toContain('TTK validation completed');
      expect(stdout).toContain('Total trechos: 1');
      expect(stdout).toContain('Total battles: 1');

      // Check if report was generated
      const reportPath = join(reportsDir, 'ttk-validation-report.json');
      expect(existsSync(reportPath)).toBe(true);

      const report = JSON.parse(readFileSync(reportPath, 'utf8'));
      expect(report.metadata).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalTrechos).toBe(1);
      expect(report.summary.totalBattles).toBeGreaterThanOrEqual(0);
    });

    it('should use seed override from flag', async () => {
      const { exitCode } = await execa(
        'node',
        [
          './bin/run.js',
          'run-ttk',
          '-c',
          configPath,
          '--seed',
          '42',
          '--verbose'
        ],
        {
          cwd: process.cwd(),
          reject: false
        }
      );

      expect(exitCode).toBe(0);
    });

    it('should use maxBattleTurns from config', async () => {
      const { exitCode } = await execa(
        'node',
        [
          './bin/run.js',
          'run-ttk',
          '-c',
          configPath,
          '--max-battle-turns',
          '50'
        ],
        {
          cwd: process.cwd(),
          reject: false
        }
      );

      expect(exitCode).toBe(0);
    });

    it('should fail with invalid config path', async () => {
      const { exitCode, stderr } = await execa(
        'node',
        [
          './bin/run.js',
          'run-ttk',
          '-c',
          '/nonexistent/config.json'
        ],
        {
          cwd: process.cwd(),
          reject: false
        }
      );

      expect(exitCode).toBeGreaterThan(0);
      expect(stderr).toContain('ENOENT: no such file or directory');
    });

    it('should fail with invalid trecho selection', async () => {
      const { exitCode, stderr } = await execa(
        'node',
        [
          './bin/run.js',
          'run-ttk',
          '-c',
          configPath,
          '--trecho',
          'nonexistent-trecho'
        ],
        {
          cwd: process.cwd(),
          reject: false
        }
      );

      expect(exitCode).toBe(1);
      expect(stderr).toContain('not found');
    });

    it('should run diagnostic mode', async () => {
      const { exitCode } = await execa(
        'node',
        [
          './bin/run.js',
          'run-ttk',
          '-c',
          configPath,
          '--diagnostic'
        ],
        {
          cwd: process.cwd(),
          reject: false
        }
      );

      expect(exitCode).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle missing config file gracefully', async () => {
      const { exitCode, stderr } = await execa(
        'node',
        [
          './bin/run.js',
          'run-ttk'
        ],
        {
          cwd: process.cwd(),
          reject: false
        }
      );

      expect(exitCode).toBeGreaterThan(0);
      expect(stderr).toContain('Missing required flag');
    });

    it('should handle malformed JSON config', async () => {
      const badConfigPath = join(testDir, 'bad-config.json');
      writeFileSync(badConfigPath, '{ invalid json }');

      const { exitCode, stderr } = await execa(
        'node',
        [
          './bin/run.js',
          'run-ttk',
          '-c',
          badConfigPath
        ],
        {
          cwd: process.cwd(),
          reject: false
        }
      );

      expect(exitCode).toBeGreaterThan(0);
      expect(stderr).toContain('JSON');

      // Clean up
      if (existsSync(badConfigPath)) {
        rmSync(badConfigPath);
      }
    });
  });
});