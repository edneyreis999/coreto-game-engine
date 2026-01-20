/**
 * Unit tests for RunTtk command
 *
 * Focus: business orchestration of the MVP pipeline (FDD-001, Section 4.1):
 * Config → Loader → Runtime/Simulation → Reporter (+ exit codes)
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { ValidationError } from '../../src/core/errors/ValidationError.js';
import { DataLoadError } from '../../src/core/errors/DataLoadError.js';
import { ConfigError } from '../../src/core/errors/ConfigError.js';
import { FileSystemError } from '../../src/core/errors/FileSystemError.js';
import { BattleResult } from '../../src/core/domain/BattleResult.js';
import type { IConfigLoader } from '../../src/core/ports/IConfigLoader.js';
import type { IDataLoader, RmmzDatabase } from '../../src/core/ports/IDataLoader.js';
import type { IBattleSimulator } from '../../src/core/ports/IBattleSimulator.js';
import type { IReporter } from '../../src/core/ports/IReporter.js';

describe('RunTtk Command', () => {
  let RunTtkCommand: any;
  let registerDependencies: jest.Mock;
  let resolve: jest.Mock;

  beforeAll(async () => {
    const containerModule = await import('@/infrastructure/di/container.js');
    registerDependencies = jest.spyOn(containerModule, 'registerDependencies') as any;
    resolve = jest.spyOn(containerModule, 'resolve') as any;

    RunTtkCommand = (await import('@/cli/commands/run-ttk.js')).default;
  });

  beforeEach(() => {
    registerDependencies.mockReset();
    registerDependencies.mockImplementation(() => {});
    resolve.mockReset();
  });

  describe('Command Metadata', () => {
    it('should have correct description', () => {
      expect(RunTtkCommand.description).toBe('Execute TTK validation for configured trechos');
    });

    it('should define required config flag', () => {
      expect(RunTtkCommand.flags.config).toBeDefined();
      expect(RunTtkCommand.flags.config.required).toBe(true);
      expect(RunTtkCommand.flags.config.char).toBe('c');
    });
  });

	  describe('Execution Flow', () => {
	    function setupHappyPathDeps(overrides?: {
	      config?: { seed?: number; maxBattleTurns?: number };
	      trechos?: any[];
	    }) {
	      const baseConfig: any = {
	        projectPath: '/tmp/rmmz-project',
	        reportOutputPath: '/tmp/reports',
	      };
	      if (overrides?.config?.seed !== undefined) {
	        baseConfig.seed = overrides.config.seed;
	      }
	      if (overrides?.config?.maxBattleTurns !== undefined) {
	        baseConfig.maxBattleTurns = overrides.config.maxBattleTurns;
	      }

	      const configLoader: IConfigLoader = {
	        loadConfig: jest.fn(async () => baseConfig),
	        loadTrechos: jest.fn(async () =>
	          (overrides?.trechos ?? [
	            {
	              id: 'ato1-nivel1-10',
	              description: 'Trecho de teste',
	              anchorLevelRange: { min: 1, max: 10 },
	              ttkTarget: { turns: 8, actions: 32, tolerance: 0.15 },
	              party: { actorClassIds: [1, 2, 3, 4], equipBestGear: true },
	              troopIds: [1, 2],
	            } as any,
	          ]) as any
	        ),
	        validate: jest.fn((x: unknown) => x as any),
	      };

      const database: RmmzDatabase = {
        $dataActors: [null],
        $dataClasses: [null as any],
        $dataSkills: [null as any],
        $dataItems: [null as any],
        $dataWeapons: [null],
        $dataArmors: [null],
        $dataEnemies: [null as any],
        $dataTroops: [null as any],
        $dataStates: [null],
        $dataSystem: { gameTitle: 'Test Game' } as any,
      };

      const dataLoader: IDataLoader = {
        validateProjectStructure: jest.fn(async () => true),
        loadDatabase: jest.fn(async () => database),
        validateReferences: jest.fn(async () => []),
        loadDataFile: jest.fn(async () => ({} as any)),
      };

      const battleSimulator: IBattleSimulator = {
        initialize: jest.fn(async () => {}),
        executeBattle: jest.fn(async (setup: any) => {
          return new BattleResult({
            troopId: setup.troopId,
            troopName: `Troop ${setup.troopId}`,
            outcome: 'victory',
            ttkTurns: 7,
            ttkActions: 28,
            durationMs: 10,
            seed: setup.seed,
            expGained: 0,
          });
        }),
        getLastMetrics: jest.fn(() => ({ turns: 7, actions: 28 } as any)),
        cleanup: jest.fn(async () => {}),
      };

      const reporter: IReporter = {
        addWarning: jest.fn(),
        addBattleResult: jest.fn(),
        generateReport: jest.fn(() => ({
          metadata: { projectPath: '/tmp/rmmz-project' },
          summary: {
            totalTrechos: 1,
            totalBattles: 2,
            passedBattles: 2,
            failedBattles: 0,
            avgTtkTurns: 7,
            avgTtkActions: 28,
            successRate: 1,
            totalWarnings: 0,
          },
          trechos: [],
          warnings: [],
        } as any)),
        writeReport: jest.fn(async () => {}),
        exportContext: jest.fn(async () => {}),
      };

      resolve.mockImplementation((token: unknown) => {
        const t = String(token);
        if (t.includes('IConfigLoader')) return configLoader;
        if (t.includes('IDataLoader')) return dataLoader;
        if (t.includes('IBattleSimulator')) return battleSimulator;
        if (t.includes('IReporter')) return reporter;
        throw new Error(`Unknown token: ${String(token)}`);
      });

      return { configLoader, dataLoader, battleSimulator, reporter };
    }

	    it('should orchestrate full pipeline and write a report', async () => {
	      const { configLoader, dataLoader, battleSimulator, reporter } = setupHappyPathDeps({
	        config: { seed: 777, maxBattleTurns: 100 },
	      });

      const cmd: any = Object.create(RunTtkCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();

      await cmd.executePipeline({
        config: '/abs/project.config.json',
        seed: undefined,
        trecho: undefined,
        verbose: false,
        diagnostic: false,
      });

      expect(resolve).toHaveBeenCalled();
      expect((configLoader.loadConfig as any)).toHaveBeenCalledWith('/abs/project.config.json');
      expect((dataLoader.loadDatabase as any)).toHaveBeenCalledWith('/tmp/rmmz-project');
      expect((battleSimulator.initialize as any)).toHaveBeenCalled();
      expect((battleSimulator.executeBattle as any)).toHaveBeenCalledTimes(2);
      expect((reporter.addBattleResult as any)).toHaveBeenCalledTimes(2);
      expect((reporter.generateReport as any)).toHaveBeenCalled();
      expect((reporter.writeReport as any)).toHaveBeenCalled();
      expect((battleSimulator.cleanup as any)).toHaveBeenCalled();
      expect(cmd.error).not.toHaveBeenCalled();
	    });

	    it('should use seed override from flag when provided', async () => {
	      const { battleSimulator } = setupHappyPathDeps({
	        config: { seed: 777, maxBattleTurns: 100 },
	      });

	      const cmd: any = Object.create(RunTtkCommand.prototype);
	      cmd.log = jest.fn();
	      cmd.error = jest.fn();

	      await cmd.executePipeline({
	        config: '/abs/project.config.json',
	        seed: 42,
	        trecho: undefined,
	        verbose: false,
	        diagnostic: false,
	      });

	      const firstCall = (battleSimulator.executeBattle as any).mock.calls[0][0];
	      expect(firstCall.seed).toBe(42);
	    });

	    it('should fall back to config seed when flag seed is not provided', async () => {
	      const { battleSimulator } = setupHappyPathDeps({
	        config: { seed: 999, maxBattleTurns: 100 },
	      });

	      const cmd: any = Object.create(RunTtkCommand.prototype);
	      cmd.log = jest.fn();
	      cmd.error = jest.fn();

	      await cmd.executePipeline({
	        config: '/abs/project.config.json',
	        seed: undefined,
	        trecho: undefined,
	        verbose: false,
	        diagnostic: false,
	      });

	      const firstCall = (battleSimulator.executeBattle as any).mock.calls[0][0];
	      expect(firstCall.seed).toBe(999);
	    });

	    it('should use default seed when neither flag nor config provides one', async () => {
	      const { battleSimulator } = setupHappyPathDeps({
	        config: { maxBattleTurns: 100 },
	      });

	      const cmd: any = Object.create(RunTtkCommand.prototype);
	      cmd.log = jest.fn();
	      cmd.error = jest.fn();

	      await cmd.executePipeline({
	        config: '/abs/project.config.json',
	        seed: undefined,
	        trecho: undefined,
	        verbose: false,
	        diagnostic: false,
	      });

	      const firstCall = (battleSimulator.executeBattle as any).mock.calls[0][0];
	      expect(firstCall.seed).toBe(12345);
	    });

	    it('should omit maxTurns when config does not provide maxBattleTurns', async () => {
	      const { battleSimulator } = setupHappyPathDeps({
	        config: { seed: 1 },
	      });

	      const cmd: any = Object.create(RunTtkCommand.prototype);
	      cmd.log = jest.fn();
	      cmd.error = jest.fn();

	      await cmd.executePipeline({
	        config: '/abs/project.config.json',
	        seed: undefined,
	        trecho: undefined,
	        verbose: false,
	        diagnostic: false,
	      });

	      const firstCall = (battleSimulator.executeBattle as any).mock.calls[0][0];
	      expect(firstCall.maxTurns).toBeUndefined();
	    });

	    it('should filter trechos when --trecho is provided and run only selected trecho', async () => {
	      const { battleSimulator } = setupHappyPathDeps({
	        config: { seed: 1, maxBattleTurns: 100 },
	        trechos: [
	          { id: 't1', troopIds: [1], party: { actorClassIds: [1, 2, 3, 4], equipBestGear: true } },
	          { id: 't2', troopIds: [2, 3], party: { actorClassIds: [1, 2, 3, 4], equipBestGear: true } },
	        ],
	      });

	      const cmd: any = Object.create(RunTtkCommand.prototype);
	      cmd.log = jest.fn();
	      cmd.error = jest.fn();

	      await cmd.executePipeline({
	        config: '/abs/project.config.json',
	        seed: undefined,
	        trecho: 't2',
	        verbose: false,
	        diagnostic: false,
	      });

	      expect((battleSimulator.executeBattle as any)).toHaveBeenCalledTimes(2);
	      const troopIds = (battleSimulator.executeBattle as any).mock.calls.map((c: any[]) => c[0].troopId);
	      expect(troopIds).toEqual([2, 3]);
	    });

	    it('should exercise verbose progress bar path (verbose=true, diagnostic=false)', async () => {
	      setupHappyPathDeps({ config: { seed: 1, maxBattleTurns: 100 } });

	      const cmd: any = Object.create(RunTtkCommand.prototype);
	      cmd.log = jest.fn();
	      cmd.error = jest.fn();

	      await cmd.executePipeline({
	        config: '/abs/project.config.json',
	        seed: undefined,
	        trecho: undefined,
	        verbose: true,
	        diagnostic: false,
	      });
	    });

	    it('should error with exit=1 when --trecho not found', async () => {
	      setupHappyPathDeps();

      const cmd: any = Object.create(RunTtkCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await cmd.executePipeline({
        config: '/abs/project.config.json',
        seed: undefined,
        trecho: 'inexistente',
        verbose: false,
        diagnostic: false,
      }).catch(async (e: unknown) => {
        await cmd.handleError(e);
      });

      expect(cmd.error).toHaveBeenCalledWith(
        expect.stringContaining('Trecho "inexistente" not found'),
        expect.objectContaining({ exit: 1 })
      );
    });

    it('should map DataLoadError ENOENT to exit=2', async () => {
      setupHappyPathDeps();

      const cmd: any = Object.create(RunTtkCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await cmd.handleError(new DataLoadError('ENOENT: file not found', 'critical', { file: 'x' }));

      expect(cmd.error).toHaveBeenCalledWith(
        expect.stringContaining('ENOENT: file not found'),
        expect.objectContaining({ exit: 2 })
      );
    });

    it('should ignore EEXIT: 0 thrown by exit(0)', async () => {
      setupHappyPathDeps();

      const cmd: any = Object.create(RunTtkCommand.prototype);
      cmd.parse = async () => ({
        flags: {
          config: '/abs/project.config.json',
          seed: undefined,
          trecho: undefined,
          verbose: false,
          diagnostic: false,
        },
      });
      cmd.setupGracefulShutdown = jest.fn();
      cmd.executePipeline = jest.fn(async () => {});
      cmd.log = jest.fn();
      cmd.exit = () => {
        throw new Error('EEXIT: 0');
      };
      cmd.error = jest.fn();

      await cmd.run();

      expect(cmd.error).not.toHaveBeenCalled();
    });

    it('should map ValidationError to exit=1', async () => {
      setupHappyPathDeps();

      const cmd: any = Object.create(RunTtkCommand.prototype);
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await cmd.handleError(new ValidationError('bad config'));

      expect(cmd.error).toHaveBeenCalledWith(
        expect.stringContaining('bad config'),
        expect.objectContaining({ exit: 1 })
      );
    });

    it('should map error types and Node fs error names to correct exit codes', () => {
      const cmd: any = Object.create(RunTtkCommand.prototype);

      expect(cmd.getExitCode(new ValidationError('x'))).toBe(1);
      expect(cmd.getExitCode(new ConfigError('x'))).toBe(1);
      expect(cmd.getExitCode(new FileSystemError('x'))).toBe(2);

      expect(cmd.getExitCode(new DataLoadError('EACCES: permission denied', 'critical'))).toBe(2);
      expect(cmd.getExitCode(new DataLoadError('Some data issue', 'critical'))).toBe(1);

      const enoent = new Error('no');
      enoent.name = 'ENOENT';
      expect(cmd.getExitCode(enoent)).toBe(2);

      const eperm = new Error('no');
      eperm.name = 'EPERM';
      expect(cmd.getExitCode(eperm)).toBe(2);

      const other = new Error('boom');
      other.name = 'SomethingElse';
      expect(cmd.getExitCode(other)).toBe(3);

      expect(cmd.getExitCode('not-an-error' as any)).toBe(3);
    });

    it('should not handle errors during shutdown', async () => {
      const cmd: any = Object.create(RunTtkCommand.prototype);
      cmd.error = jest.fn();
      cmd.shutdownInitiated = true;

      await cmd.handleError(new Error('should be ignored'));
      expect(cmd.error).not.toHaveBeenCalled();
    });

    it('should install graceful shutdown handlers (SIGINT/SIGTERM)', () => {
      const cmd: any = Object.create(RunTtkCommand.prototype);
      cmd.log = jest.fn();
      cmd.exit = jest.fn();
      cmd.shutdownInitiated = false;

      const handlers: Record<string, Function> = {};
      const onSpy = jest.spyOn(process, 'on').mockImplementation(((event: any, listener: any) => {
        handlers[String(event)] = listener;
        return process as any;
      }) as any);

      cmd.setupGracefulShutdown();

      expect(typeof handlers.SIGINT).toBe('function');
      expect(typeof handlers.SIGTERM).toBe('function');

      handlers.SIGINT!();
      expect(cmd.exit).toHaveBeenCalledWith(130);

      // Second signal should be ignored (shutdownInitiated already true)
      handlers.SIGTERM!();
      expect(cmd.exit).toHaveBeenCalledTimes(1);

      onSpy.mockRestore();
    });
  });
});
