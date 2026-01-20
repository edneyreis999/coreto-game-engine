/**
 * Unit tests for DiagnosticLogger
 *
 * Tests diagnostic logging, timing, and performance metrics
 */

import { DiagnosticLogger } from '../../../../packages/cli/src/cli/ui/DiagnosticLogger';

describe('DiagnosticLogger', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create logger with enabled=true', () => {
      const logger = new DiagnosticLogger(true);
      expect(logger.isEnabled()).toBe(true);
    });

    it('should create logger with enabled=false', () => {
      const logger = new DiagnosticLogger(false);
      expect(logger.isEnabled()).toBe(false);
    });
  });

  describe('startExecution', () => {
    it('should log execution start when enabled', () => {
      const logger = new DiagnosticLogger(true);
      logger.startExecution();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DIAGNOSTIC]'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Pipeline execution started'),
      );
    });

    it('should not log when disabled', () => {
      const logger = new DiagnosticLogger(false);
      logger.startExecution();

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('stage timing', () => {
    it('should track stage start and end when enabled', () => {
      const logger = new DiagnosticLogger(true);

      logger.startStage('test_stage');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stage started: test_stage'),
      );

      consoleLogSpy.mockClear();

      logger.endStage('test_stage');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stage completed: test_stage'),
      );
    });

    it('should warn if stage ended without start', () => {
      const logger = new DiagnosticLogger(true);

      logger.endStage('nonexistent_stage');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning'),
      );
    });

    it('should not track timing when disabled', () => {
      const logger = new DiagnosticLogger(false);

      logger.startStage('test_stage');
      logger.endStage('test_stage');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('log', () => {
    it('should log message with data when enabled', () => {
      const logger = new DiagnosticLogger(true);

      logger.log('test_stage', 'Test message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DIAGNOSTIC]'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test message'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"key":"value"}'),
      );
    });

    it('should log message without data', () => {
      const logger = new DiagnosticLogger(true);

      logger.log('test_stage', 'Simple message');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Simple message'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.not.stringContaining('|'),
      );
    });

    it('should not log when disabled', () => {
      const logger = new DiagnosticLogger(false);

      logger.log('test_stage', 'Should not log', { key: 'value' });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should calculate metrics correctly', () => {
      const logger = new DiagnosticLogger(true);
      logger.startExecution();

      // Simulate some time passing
      const metrics = logger.getMetrics(10);

      expect(metrics.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(metrics.averageBattleDurationMs).toBeGreaterThanOrEqual(0);
      expect(metrics.peakMemoryMb).toBeGreaterThan(0);
      expect(metrics.currentMemoryMb).toBeGreaterThan(0);
      expect(metrics.totalBattles).toBe(10);
    });

    it('should calculate average correctly with zero battles', () => {
      const logger = new DiagnosticLogger(true);
      logger.startExecution();

      const metrics = logger.getMetrics(0);

      expect(metrics.averageBattleDurationMs).toBe(0);
      expect(metrics.totalBattles).toBe(0);
    });

    it('should work when disabled', () => {
      const logger = new DiagnosticLogger(false);

      const metrics = logger.getMetrics(5);

      expect(metrics.totalBattles).toBe(5);
      expect(metrics.peakMemoryMb).toBeGreaterThan(0);
    });
  });

  describe('printSummary', () => {
    it('should print summary when enabled', () => {
      const logger = new DiagnosticLogger(true);
      logger.startExecution();

      logger.printSummary(10);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('DIAGNOSTIC SUMMARY'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Total Duration:'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Total Battles: 10'),
      );
    });

    it('should not print when disabled', () => {
      const logger = new DiagnosticLogger(false);

      logger.printSummary(10);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('getEntries', () => {
    it('should return all logged entries', () => {
      const logger = new DiagnosticLogger(true);

      logger.log('stage1', 'Message 1');
      logger.log('stage2', 'Message 2', { key: 'value' });

      const entries = logger.getEntries();

      expect(entries).toHaveLength(2);
      expect(entries[0]?.stage).toBe('stage1');
      expect(entries[0]?.message).toBe('Message 1');
      expect(entries[1]?.stage).toBe('stage2');
      expect(entries[1]?.message).toBe('Message 2');
      expect(entries[1]?.data).toEqual({ key: 'value' });
    });

    it('should return empty array when nothing logged', () => {
      const logger = new DiagnosticLogger(true);

      expect(logger.getEntries()).toEqual([]);
    });

    it('should return copy of entries (not reference)', () => {
      const logger = new DiagnosticLogger(true);
      logger.log('stage', 'Message');

      const entries1 = logger.getEntries();
      const entries2 = logger.getEntries();

      expect(entries1).not.toBe(entries2);
      expect(entries1).toEqual(entries2);
    });
  });
});
