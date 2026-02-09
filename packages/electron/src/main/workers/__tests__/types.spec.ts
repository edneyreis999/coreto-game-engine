/**
 * Worker Types Unit Tests
 *
 * Tests type contracts for worker-main communication.
 * Verifies type safety and message structure.
 *
 * @see src/main/workers/types.ts
 */

import type {
  MainToWorkerMessage,
  WorkerToMainMessage,
  SimulationParams,
  ProgressPayload,
  ErrorPayload,
  SimulationResultPayload,
  ProgressStage,
} from '../types.js';

describe('Worker Types', () => {
  describe('MainToWorkerMessage', () => {
    it('should accept valid start message', () => {
      const message: MainToWorkerMessage = {
        type: 'start',
        payload: {
          simulationId: 'sim-123',
          projectPath: '/path/to/project',
          configPath: '/path/to/config.json',
          seed: 42,
          diagnostic: false,
        },
      };

      expect(message.type).toBe('start');
      expect(message.payload.simulationId).toBe('sim-123');
    });

    it('should accept start message with optional fields', () => {
      const message: MainToWorkerMessage = {
        type: 'start',
        payload: {
          simulationId: 'sim-123',
          projectPath: '/path/to/project',
          configPath: '/path/to/config.json',
        },
      };

      expect(message.payload.seed).toBeUndefined();
      expect(message.payload.diagnostic).toBeUndefined();
    });

    it('should accept cancel message', () => {
      const message: MainToWorkerMessage = {
        type: 'cancel',
      };

      expect(message.type).toBe('cancel');
    });

    it('should enforce type discrimination', () => {
      const messages: MainToWorkerMessage[] = [
        { type: 'start', payload: { simulationId: '', projectPath: '' } },
        { type: 'cancel' },
      ];

      expect(messages).toHaveLength(2);
    });
  });

  describe('WorkerToMainMessage', () => {
    it('should accept progress message', () => {
      const message: WorkerToMainMessage = {
        type: 'progress',
        payload: {
          stage: 'initialization',
          current: 0,
          total: 100,
          percentage: 0,
          message: 'Initializing...',
          timestamp: Date.now(),
        },
      };

      expect(message.type).toBe('progress');
      expect(message.payload.stage).toBe('initialization');
    });

    it('should accept progress message with trecho context', () => {
      const message: WorkerToMainMessage = {
        type: 'progress',
        payload: {
          stage: 'battle',
          trechoId: 'trecho-1',
          trechoName: 'Ato 1 - Nivel 1',
          current: 5,
          total: 100,
          percentage: 5,
          message: 'Battle 5/100',
          timestamp: Date.now(),
        },
      };

      expect(message.payload.trechoId).toBe('trecho-1');
      expect(message.payload.trechoName).toBe('Ato 1 - Nivel 1');
    });

    it('should accept error message', () => {
      const message: WorkerToMainMessage = {
        type: 'error',
        payload: {
          title: 'Test Error',
          description: 'Test error description',
          code: 'ERR_TEST',
        },
      };

      expect(message.type).toBe('error');
      expect(message.payload.title).toBe('Test Error');
      expect(message.payload.code).toBe('ERR_TEST');
    });

    it('should accept error message with optional fields', () => {
      const message: WorkerToMainMessage = {
        type: 'error',
        payload: {
          title: 'Test Error',
          description: 'Test error description',
          details: 'Stack trace here',
          code: 'ERR_TEST',
        },
      };

      expect(message.payload.details).toBe('Stack trace here');
    });

    it('should enforce type discrimination', () => {
      const messages: WorkerToMainMessage[] = [
        {
          type: 'progress',
          payload: {
            stage: 'initialization',
            current: 0,
            total: 100,
            percentage: 0,
            message: '',
            timestamp: 0,
          },
        },
        { type: 'error', payload: { title: '', description: '', code: '' } },
      ];

      expect(messages).toHaveLength(2);
    });
  });

  describe('ProgressStage', () => {
    it('should accept all valid progress stages', () => {
      const stages: ProgressStage[] = [
        'initialization',
        'trecho',
        'battle',
        'trecho-complete',
        'finalization',
      ];

      expect(stages).toHaveLength(5);
    });
  });

  describe('SimulationParams', () => {
    it('should require all mandatory fields', () => {
      const params: SimulationParams = {
        simulationId: 'sim-123',
        projectPath: '/path/to/project',
        configPath: '/path/to/config.json',
      };

      expect(params.simulationId).toBe('sim-123');
      expect(params.projectPath).toBe('/path/to/project');
      expect(params.configPath).toBe('/path/to/config.json');
    });

    it('should accept optional fields', () => {
      const params: SimulationParams = {
        simulationId: 'sim-123',
        projectPath: '/path/to/project',
        configPath: '/path/to/config.json',
        seed: 42,
        diagnostic: true,
      };

      expect(params.seed).toBe(42);
      expect(params.diagnostic).toBe(true);
    });
  });

  describe('ProgressPayload', () => {
    const createProgressPayload = (stage: ProgressStage): ProgressPayload => ({
      stage,
      current: 50,
      total: 100,
      percentage: 50,
      message: 'Test progress',
      timestamp: Date.now(),
    });

    it('should accept initialization stage', () => {
      const payload = createProgressPayload('initialization');
      expect(payload.stage).toBe('initialization');
    });

    it('should accept trecho stage', () => {
      const payload: ProgressPayload = {
        ...createProgressPayload('trecho'),
        trechoId: 'trecho-1',
        trechoName: 'Test Trecho',
      };
      expect(payload.trechoId).toBe('trecho-1');
    });

    it('should accept battle stage', () => {
      const payload: ProgressPayload = {
        ...createProgressPayload('battle'),
        trechoId: 'trecho-1',
        trechoName: 'Test Trecho',
      };
      expect(payload.stage).toBe('battle');
    });

    it('should accept trecho-complete stage', () => {
      const payload = createProgressPayload('trecho-complete');
      expect(payload.stage).toBe('trecho-complete');
    });

    it('should accept finalization stage', () => {
      const payload = createProgressPayload('finalization');
      expect(payload.stage).toBe('finalization');
    });

    it('should require timestamp', () => {
      const payload = createProgressPayload('initialization');
      expect(payload.timestamp).toBeGreaterThan(0);
    });
  });

  describe('ErrorPayload', () => {
    it('should accept required fields', () => {
      const payload: ErrorPayload = {
        title: 'Error Title',
        description: 'Error description',
        code: 'ERR_CODE',
      };

      expect(payload.title).toBe('Error Title');
      expect(payload.description).toBe('Error description');
      expect(payload.code).toBe('ERR_CODE');
    });

    it('should accept optional details', () => {
      const payload: ErrorPayload = {
        title: 'Error Title',
        description: 'Error description',
        details: 'Error details',
        code: 'ERR_CODE',
      };

      expect(payload.details).toBe('Error details');
    });
  });

  describe('SimulationResultPayload', () => {
    it('should require all fields', () => {
      // Mock Report object structure
      const mockReport = {
        metadata: {
          version: '1.0.0',
          generatedAt: new Date(),
          seed: 42,
          projectPath: '/path/to/project',
        },
        summary: {
          executionTimeMs: 1000,
          totalTrechos: 1,
          totalBattles: 10,
          totalWarnings: 0,
          warningsByType: {},
          successRate: 1.0,
          peakMemoryMB: 50,
        },
        trechos: [],
        warnings: [],
        overallPassed: true,
      };

      const payload: SimulationResultPayload = {
        simulationId: 'sim-123',
        projectPath: '/path/to/project',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        report: mockReport as any,
        duration: 1000,
        seed: 42,
      };

      expect(payload.simulationId).toBe('sim-123');
      expect(payload.duration).toBe(1000);
      expect(payload.seed).toBe(42);
    });
  });

  describe('Type exhaustiveness', () => {
    it('should handle all message types in switch', () => {
      const handleMessage = (message: WorkerToMainMessage): string => {
        switch (message.type) {
          case 'progress':
            return 'progress';
          case 'complete':
            return 'complete';
          case 'error':
            return 'error';
          default: {
            // TypeScript should enforce exhaustiveness
            const _exhaustive: never = message;
            // This line should never be reached, but we need to return something for type safety
            return _exhaustive as never;
          }
        }
      };

      expect(
        handleMessage({
          type: 'progress',
          payload: {
            stage: 'initialization',
            current: 0,
            total: 100,
            percentage: 0,
            message: '',
            timestamp: 0,
          },
        })
      ).toBe('progress');
    });
  });
});
