/**
 * Unit tests for ExportContext command
 *
 * Focus: AI context export from TTK validation reports
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import { ValidationError } from '@coreto/core';
import { ConfigError } from '@coreto/core';
import { FileSystemError } from '@coreto/core';
import { Report } from '@coreto/core';
import type { IConfigLoader } from '@coreto/core';
import type { IReporter } from '@coreto/core';

describe('ExportContext Command', () => {
  let ExportContextCommand: any;
  let registerDependencies: jest.Mock;
  let resolve: jest.Mock;
  let readFileSyncSpy: jest.SpyInstance;

  beforeAll(async () => {
    const containerModule = await import('@coreto/core/infrastructure/di/container');
    registerDependencies = jest.spyOn(containerModule, 'registerDependencies') as any;
    resolve = jest.spyOn(containerModule, 'resolve') as any;

    ExportContextCommand = (await import('@coreto/cli/cli/commands/export-context')).default;
  });

  beforeEach(() => {
    registerDependencies.mockReset();
    registerDependencies.mockImplementation(() => {});
    resolve.mockReset();
  });

  describe('Command Metadata', () => {
    it('should have correct description', () => {
      expect(ExportContextCommand.description).toBe(
        'Export AI context from TTK validation report (splits large JSONs for LLM context limits)'
      );
    });

    it('should define required config flag', () => {
      expect(ExportContextCommand.flags.config).toBeDefined();
      expect(ExportContextCommand.flags.config.required).toBe(true);
      expect(ExportContextCommand.flags.config.char).toBe('c');
    });

    it('should define required report flag', () => {
      expect(ExportContextCommand.flags.report).toBeDefined();
      expect(ExportContextCommand.flags.report.required).toBe(true);
      expect(ExportContextCommand.flags.report.char).toBe('r');
    });

    it('should define optional output flag with default', () => {
      expect(ExportContextCommand.flags.output).toBeDefined();
      expect(ExportContextCommand.flags.output.required).toBe(false);
      expect(ExportContextCommand.flags.output.char).toBe('o');
      expect(ExportContextCommand.flags.output.default).toBe('./ai-context');
    });

    it('should define optional verbose flag', () => {
      expect(ExportContextCommand.flags.verbose).toBeDefined();
      // Boolean flags don't have required property (inherently optional)
      expect(ExportContextCommand.flags.verbose.char).toBe('v');
      expect(ExportContextCommand.flags.verbose.default).toBe(false);
    });
  });

  describe('Execution Flow', () => {
    let mockConfigLoader: IConfigLoader;
    let mockReporter: IReporter;
    let mockReport: Report;

    beforeEach(() => {
      mockReport = new Report({
        metadata: {
          version: '1.0.0',
          generatedAt: new Date('2025-01-01T00:00:00.000Z'),
          seed: 12345,
          projectPath: '/tmp/rmmz-project',
        },
        summary: {
          executionTimeMs: 5000,
          totalTrechos: 5,
          totalBattles: 50,
          totalWarnings: 5,
          warningsByType: { ttk_out_of_tolerance: 3, battle_timeout: 2 },
          successRate: 0.96,
          peakMemoryMB: 128,
        },
        trechos: [],
        warnings: [],
      });

      mockConfigLoader = {
        loadConfig: jest.fn(async () => ({
          projectPath: '/tmp/rmmz-project',
          reportOutputPath: '/tmp/reports',
          seed: 12345,
        })),
        loadTrechos: jest.fn(async () => []),
        validate: jest.fn((x: unknown) => x as any),
      };

      mockReporter = {
        addWarning: jest.fn(),
        addBattleResult: jest.fn(),
        generateReport: jest.fn(() => mockReport),
        writeReport: jest.fn(async () => {}),
        exportContext: jest.fn(async () => {}),
      };

      resolve.mockImplementation((token: unknown) => {
        const t = String(token);
        if (t.includes('IConfigLoader')) return mockConfigLoader;
        if (t.includes('IReporter')) return mockReporter;
        throw new Error(`Unknown token: ${String(token)}`);
      });
    });

    it('should load config, report, and export context successfully', async () => {
      // Mock fs.readFileSync to return valid report JSON
      readFileSyncSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify(mockReport)
      );

      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();

      await cmd.executePipeline({
        config: '/abs/project.config.json',
        report: '/abs/report-12345.json',
        output: './ai-context',
        verbose: false,
      });

      expect(resolve).toHaveBeenCalled();
      expect((mockConfigLoader.loadConfig as any)).toHaveBeenCalledWith('/abs/project.config.json');
      expect((mockReporter.exportContext as any)).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.any(Object),
          summary: expect.any(Object),
          trechos: expect.any(Array),
          warnings: expect.any(Array),
        }),
        './ai-context'
      );
      expect(cmd.error).not.toHaveBeenCalled();

      readFileSyncSpy.mockRestore();
    });

    it('should use default output directory when not specified', async () => {
      readFileSyncSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify(mockReport)
      );

      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();

      await cmd.executePipeline({
        config: '/abs/project.config.json',
        report: '/abs/report-12345.json',
        output: './ai-context', // default value
        verbose: false,
      });

      expect((mockReporter.exportContext as any)).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.any(Object),
          summary: expect.any(Object),
          trechos: expect.any(Array),
          warnings: expect.any(Array),
        }),
        './ai-context'
      );

      readFileSyncSpy.mockRestore();
    });

    it('should validate report structure and throw ValidationError for missing metadata', async () => {
      const invalidReport = { summary: {}, trechos: [], warnings: [] } as any;
      readFileSyncSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify(invalidReport)
      );

      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await expect(
        cmd.executePipeline({
          config: '/abs/project.config.json',
          report: '/abs/report-12345.json',
          output: './ai-context',
          verbose: false,
        })
      ).rejects.toThrow(ValidationError);

      readFileSyncSpy.mockRestore();
    });

    it('should validate report structure and throw ValidationError for missing summary', async () => {
      const invalidReport = { metadata: {}, trechos: [], warnings: [] } as any;
      readFileSyncSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify(invalidReport)
      );

      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await expect(
        cmd.executePipeline({
          config: '/abs/project.config.json',
          report: '/abs/report-12345.json',
          output: './ai-context',
          verbose: false,
        })
      ).rejects.toThrow(ValidationError);

      readFileSyncSpy.mockRestore();
    });

    it('should validate report structure and throw ValidationError for invalid trechos type', async () => {
      const invalidReport = {
        metadata: {},
        summary: {},
        trechos: 'not-an-array',
        warnings: [],
      } as any;
      readFileSyncSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify(invalidReport)
      );

      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await expect(
        cmd.executePipeline({
          config: '/abs/project.config.json',
          report: '/abs/report-12345.json',
          output: './ai-context',
          verbose: false,
        })
      ).rejects.toThrow(ValidationError);

      readFileSyncSpy.mockRestore();
    });

    it('should validate report structure and throw ValidationError for invalid warnings type', async () => {
      const invalidReport = {
        metadata: {},
        summary: {},
        trechos: [],
        warnings: 'not-an-array',
      } as any;
      readFileSyncSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify(invalidReport)
      );

      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await expect(
        cmd.executePipeline({
          config: '/abs/project.config.json',
          report: '/abs/report-12345.json',
          output: './ai-context',
          verbose: false,
        })
      ).rejects.toThrow(ValidationError);

      readFileSyncSpy.mockRestore();
    });

    it('should throw ValidationError for invalid JSON in report file', async () => {
      readFileSyncSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        'invalid json content'
      );

      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await expect(
        cmd.executePipeline({
          config: '/abs/project.config.json',
          report: '/abs/report-12345.json',
          output: './ai-context',
          verbose: false,
        })
      ).rejects.toThrow(ValidationError);

      readFileSyncSpy.mockRestore();
    });

    it('should throw FileSystemError when fs.readFileSync fails', async () => {
      readFileSyncSpy = jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
        throw new Error('ENOENT: file not found');
      });

      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await expect(
        cmd.executePipeline({
          config: '/abs/project.config.json',
          report: '/abs/report-12345.json',
          output: './ai-context',
          verbose: false,
        })
      ).rejects.toThrow(FileSystemError);

      readFileSyncSpy.mockRestore();
    });

    it('should output verbose logs when verbose flag is true', async () => {
      readFileSyncSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify(mockReport)
      );

      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.log = jest.fn();
      cmd.error = jest.fn();

      await cmd.executePipeline({
        config: '/abs/project.config.json',
        report: '/abs/report-12345.json',
        output: './ai-context',
        verbose: true,
      });

      expect(cmd.log).toHaveBeenCalledWith(expect.stringContaining('Loading configuration'));
      expect(cmd.log).toHaveBeenCalledWith(expect.stringContaining('Project path: /tmp/rmmz-project'));
      expect(cmd.log).toHaveBeenCalledWith(expect.stringContaining('Report output path: /tmp/reports'));
      expect(cmd.log).toHaveBeenCalledWith(expect.stringContaining('Report version: 1.0.0'));
      expect(cmd.log).toHaveBeenCalledWith(expect.stringContaining('Total trechos: 5'));
      expect(cmd.log).toHaveBeenCalledWith(expect.stringContaining('Total battles: 50'));

      readFileSyncSpy.mockRestore();
    });
  });

  describe('Error Handling and Exit Codes', () => {
    it('should map ValidationError to exit=1', async () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await cmd.handleError(new ValidationError('invalid report'));

      expect(cmd.error).toHaveBeenCalledWith(
        expect.stringContaining('invalid report'),
        expect.objectContaining({ exit: 1 })
      );
    });

    it('should map ConfigError to exit=1', async () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await cmd.handleError(new ConfigError('bad config'));

      expect(cmd.error).toHaveBeenCalledWith(
        expect.stringContaining('bad config'),
        expect.objectContaining({ exit: 1 })
      );
    });

    it('should map FileSystemError to exit=2', async () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      await cmd.handleError(new FileSystemError('file not found'));

      expect(cmd.error).toHaveBeenCalledWith(
        expect.stringContaining('file not found'),
        expect.objectContaining({ exit: 2 })
      );
    });

    it('should map ENOENT error name to exit=2', async () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      const error = new Error('file not found');
      error.name = 'ENOENT';

      await cmd.handleError(error);

      expect(cmd.error).toHaveBeenCalledWith(
        expect.stringContaining('file not found'),
        expect.objectContaining({ exit: 2 })
      );
    });

    it('should map EACCES error name to exit=2', async () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      const error = new Error('permission denied');
      error.name = 'EACCES';

      await cmd.handleError(error);

      expect(cmd.error).toHaveBeenCalledWith(
        expect.stringContaining('permission denied'),
        expect.objectContaining({ exit: 2 })
      );
    });

    it('should map EPERM error name to exit=2', async () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      const error = new Error('operation not permitted');
      error.name = 'EPERM';

      await cmd.handleError(error);

      expect(cmd.error).toHaveBeenCalledWith(
        expect.stringContaining('operation not permitted'),
        expect.objectContaining({ exit: 2 })
      );
    });

    it('should map unknown errors to exit=3', async () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.error = jest.fn();
      cmd.shutdownInitiated = false;

      const error = new Error('something went wrong');
      error.name = 'SomeOtherError';

      await cmd.handleError(error);

      expect(cmd.error).toHaveBeenCalledWith(
        expect.stringContaining('something went wrong'),
        expect.objectContaining({ exit: 3 })
      );
    });

    it('should return correct exit code for each error type in getExitCode', () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);

      expect(cmd.getExitCode(new ValidationError('x'))).toBe(1);
      expect(cmd.getExitCode(new ConfigError('x'))).toBe(1);
      expect(cmd.getExitCode(new FileSystemError('x'))).toBe(2);

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
      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.error = jest.fn();
      cmd.shutdownInitiated = true;

      await cmd.handleError(new Error('should be ignored'));
      expect(cmd.error).not.toHaveBeenCalled();
    });

    it('should ignore EEXIT: 0 thrown by exit(0)', async () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.parse = async () => ({
        flags: {
          config: '/abs/project.config.json',
          report: '/abs/report-12345.json',
          output: './ai-context',
          verbose: false,
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
  });

  describe('Graceful Shutdown Handlers', () => {
    it('should install graceful shutdown handlers (SIGINT/SIGTERM)', () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
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

      // Reset shutdownInitiated for SIGTERM test
      cmd.shutdownInitiated = false;
      handlers.SIGTERM!();
      expect(cmd.exit).toHaveBeenCalledWith(143);

      onSpy.mockRestore();
    });

    it('should ignore second signal when shutdown already initiated', () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      cmd.log = jest.fn();
      cmd.exit = jest.fn();
      cmd.shutdownInitiated = false;

      const handlers: Record<string, Function> = {};
      const onSpy = jest.spyOn(process, 'on').mockImplementation(((event: any, listener: any) => {
        handlers[String(event)] = listener;
        return process as any;
      }) as any);

      cmd.setupGracefulShutdown();

      // First signal
      handlers.SIGINT!();
      expect(cmd.exit).toHaveBeenCalledTimes(1);

      // Second signal should be ignored (shutdownInitiated already true)
      handlers.SIGTERM!();
      expect(cmd.exit).toHaveBeenCalledTimes(1); // Still 1, not 2

      onSpy.mockRestore();
    });
  });

  describe('Report Loading', () => {
    let mockReport: Report;

    beforeEach(() => {
      mockReport = new Report({
        metadata: { version: '1.0.0', generatedAt: new Date(), seed: 12345, projectPath: '/tmp' },
        summary: {
          executionTimeMs: 1000,
          totalTrechos: 1,
          totalBattles: 1,
          totalWarnings: 0,
          warningsByType: {},
          successRate: 1,
          peakMemoryMB: 64,
        },
        trechos: [],
        warnings: [],
      });
    });

    it('should parse valid JSON report successfully', async () => {
      const readSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(
        JSON.stringify(mockReport)
      );

      const cmd: any = Object.create(ExportContextCommand.prototype);
      const result = await cmd.loadReportFile('/abs/report.json');

      // Use toMatchObject because JSON.parse returns plain object
      // while mockReport is a Report instance with different serialization
      expect(result).toMatchObject({
        metadata: expect.any(Object),
        summary: expect.any(Object),
        trechos: expect.any(Array),
        warnings: expect.any(Array),
      });
      expect(result.metadata.version).toBe(mockReport.metadata.version);
      expect(result.summary.totalTrechos).toBe(mockReport.summary.totalTrechos);
      readSpy.mockRestore();
    });

    it('should throw ValidationError for malformed JSON', async () => {
      const readSpy = jest.spyOn(require('fs'), 'readFileSync').mockReturnValue('{invalid json}');

      const cmd: any = Object.create(ExportContextCommand.prototype);

      await expect(cmd.loadReportFile('/abs/report.json')).rejects.toThrow(ValidationError);
      readSpy.mockRestore();
    });

    it('should throw FileSystemError for read errors', async () => {
      const readSpy = jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const cmd: any = Object.create(ExportContextCommand.prototype);

      await expect(cmd.loadReportFile('/abs/report.json')).rejects.toThrow(FileSystemError);
      readSpy.mockRestore();
    });
  });

  describe('Report Validation', () => {
    const validReport = new Report({
      metadata: { version: '1.0.0', generatedAt: new Date(), seed: 12345, projectPath: '/tmp' },
      summary: {
        executionTimeMs: 1000,
        totalTrechos: 1,
        totalBattles: 1,
        totalWarnings: 0,
        warningsByType: {},
        successRate: 1,
        peakMemoryMB: 64,
      },
      trechos: [],
      warnings: [],
    });

    it('should validate a correct report without throwing', () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      expect(() => cmd.validateReport(validReport)).not.toThrow();
    });

    it('should throw ValidationError when metadata is missing', () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      const invalidReport = { ...validReport, metadata: undefined as any };

      expect(() => cmd.validateReport(invalidReport)).toThrow(ValidationError);
    });

    it('should throw ValidationError when summary is missing', () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      const invalidReport = { ...validReport, summary: undefined as any };

      expect(() => cmd.validateReport(invalidReport)).toThrow(ValidationError);
    });

    it('should throw ValidationError when trechos is not an array', () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      const invalidReport = { ...validReport, trechos: 'not-an-array' as any };

      expect(() => cmd.validateReport(invalidReport)).toThrow(ValidationError);
    });

    it('should throw ValidationError when warnings is not an array', () => {
      const cmd: any = Object.create(ExportContextCommand.prototype);
      const invalidReport = { ...validReport, warnings: 'not-an-array' as any };

      expect(() => cmd.validateReport(invalidReport)).toThrow(ValidationError);
    });
  });
});
