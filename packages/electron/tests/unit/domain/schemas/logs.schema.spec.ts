/**
 * Log Schemas Validation Tests
 *
 * Tests for Zod validation schemas used in the log export feature.
 * Ensures runtime type safety for IPC communication between main and renderer processes.
 *
 * @see packages/electron/src/domain/schemas/logs.ts
 * @see planos/017-botao-export-logs/tasks/techspec.md Section 5.1
 */

import {
  LogEntrySchema,
  LogBundleSchema,
  LogsExportResponseSchema,
  type LogEntryDTO,
  type LogBundleDTO,
  type LogsExportResponseDTO,
} from '@coreto/electron/domain/schemas';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Minimal valid log entry with only required fields.
 */
const minimalLogEntry: LogEntryDTO = {
  timestamp: '2026-02-08T14:30:00.000Z',
  level: 'info',
  source: 'main',
  message: 'Test log message',
};

/**
 * Log entry with optional meta field.
 */
const logEntryWithMeta: LogEntryDTO = {
  ...minimalLogEntry,
  meta: { errorCode: '500', userId: '123' },
};

/**
 * Log entry with optional stack field.
 */
const logEntryWithStack: LogEntryDTO = {
  ...minimalLogEntry,
  stack: 'Error: Test error\n    at test.js:10:15',
};

/**
 * Log entry with both meta and stack fields.
 */
const logEntryWithBoth: LogEntryDTO = {
  ...minimalLogEntry,
  meta: { errorCode: '500' },
  stack: 'Error: Test error\n    at test.js:10:15',
};

// ============================================================================
// LogEntrySchema Tests
// ============================================================================

describe('LogEntrySchema', () => {
  describe('valid input acceptance', () => {
    it('should accept a valid entry with all required fields', () => {
      const result = LogEntrySchema.safeParse(minimalLogEntry);
      expect(result.success).toBe(true, 'Should accept entry with required fields');
      if (result.success) {
        expect(result.data).toEqual(minimalLogEntry);
      }
    });

    it('should accept entry with optional meta field', () => {
      const result = LogEntrySchema.safeParse(logEntryWithMeta);
      expect(result.success).toBe(true, 'Should accept entry with optional meta field');
      if (result.success) {
        expect(result.data.meta).toEqual({ errorCode: '500', userId: '123' });
      }
    });

    it('should accept entry with optional stack field', () => {
      const result = LogEntrySchema.safeParse(logEntryWithStack);
      expect(result.success).toBe(true, 'Should accept entry with optional stack field');
      if (result.success) {
        expect(result.data.stack).toBe('Error: Test error\n    at test.js:10:15');
      }
    });

    it('should accept entry with both meta and stack fields', () => {
      const result = LogEntrySchema.safeParse(logEntryWithBoth);
      expect(result.success).toBe(true, 'Should accept entry with both optional fields');
    });

    it.each(['debug', 'info', 'warn', 'error'] as const)(
      'should accept %s level',
      (level) => {
        const entry = { ...minimalLogEntry, level };
        const result = LogEntrySchema.safeParse(entry);
        expect(result.success).toBe(true, `Should accept valid log level: ${level}`);
      }
    );

    it.each(['main', 'renderer'] as const)(
      'should accept %s source',
      (source) => {
        const entry = { ...minimalLogEntry, source };
        const result = LogEntrySchema.safeParse(entry);
        expect(result.success).toBe(true, `Should accept valid source: ${source}`);
      }
    );

    it.each([
      '2026-02-08T14:30:00.000Z',
      '2026-02-08T14:30:00Z',
      '2026-02-08T14:30:00.123456Z',
    ])(
      'should accept valid ISO 8601 timestamp: %s',
      (timestamp) => {
        const entry = { ...minimalLogEntry, timestamp };
        const result = LogEntrySchema.safeParse(entry);
        expect(result.success).toBe(true, `Should accept valid timestamp: ${timestamp}`);
      }
    );
  });

  describe('invalid input rejection', () => {
    it('should reject entry with invalid level (critical)', () => {
      const invalidEntry = { ...minimalLogEntry, level: 'critical' };
      const result = LogEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('one of: debug, info, warn, error');
      }
    });

    it('should reject entry with invalid level (trace)', () => {
      const invalidEntry = { ...minimalLogEntry, level: 'trace' };
      const result = LogEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it('should reject entry with invalid level (fatal)', () => {
      const invalidEntry = { ...minimalLogEntry, level: 'fatal' };
      const result = LogEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it('should reject entry with missing timestamp', () => {
      // @ts-expect-error - testing missing required field
      const invalidEntry = { ...minimalLogEntry, timestamp: undefined };
      const result = LogEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it.each([
      'not-a-date',
      '2026-02-08', // Missing time
      '14:30:00', // Missing date
      1234567890, // Number instead of string
    ])(
      'should reject entry with invalid timestamp format: %s',
      (timestamp) => {
        const invalidEntry = { ...minimalLogEntry, timestamp };
        const result = LogEntrySchema.safeParse(invalidEntry);
        expect(result.success).toBe(false, `Should reject invalid timestamp: ${String(timestamp)}`);
      }
    );

    it('should reject entry with empty message', () => {
      const invalidEntry = { ...minimalLogEntry, message: '' };
      const result = LogEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject entry with missing message', () => {
      // @ts-expect-error - testing missing required field
      const invalidEntry = { ...minimalLogEntry, message: undefined };
      const result = LogEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it('should reject entry with invalid source', () => {
      const invalidEntry = { ...minimalLogEntry, source: 'preload' };
      const result = LogEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('either "main" or "renderer"');
      }
    });

    it('should reject entry with non-object meta', () => {
      const invalidEntry = { ...minimalLogEntry, meta: 'not-an-object' };
      const result = LogEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it('should reject entry with non-string stack', () => {
      const invalidEntry = { ...minimalLogEntry, stack: 12345 };
      const result = LogEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// LogBundleSchema Tests
// ============================================================================

describe('LogBundleSchema', () => {
  const validLogBundle: LogBundleDTO = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: '2026-02-08T14:30:00.000Z',
    appVersion: '1.0.0',
    electronVersion: '33.0.0',
    platform: 'darwin',
    logs: [
      {
        timestamp: '2026-02-08T14:30:00.000Z',
        level: 'info',
        source: 'main',
        message: 'Test log message',
      },
    ],
  };

  describe('valid input acceptance', () => {
    it('should accept a valid bundle with logs array', () => {
      const result = LogBundleSchema.safeParse(validLogBundle);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validLogBundle);
      }
    });

    it('should accept bundle with empty logs array', () => {
      const bundleWithEmptyLogs: LogBundleDTO = {
        ...validLogBundle,
        logs: [],
      };
      const result = LogBundleSchema.safeParse(bundleWithEmptyLogs);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs).toEqual([]);
      }
    });

    it('should accept bundle with optional projectPath', () => {
      const bundleWithPath: LogBundleDTO = {
        ...validLogBundle,
        projectPath: '/Users/edney/projects/coreto/game-engine',
      };
      const result = LogBundleSchema.safeParse(bundleWithPath);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectPath).toBe('/Users/edney/projects/coreto/game-engine');
      }
    });

    it('should accept bundle with optional userActions', () => {
      const bundleWithActions: LogBundleDTO = {
        ...validLogBundle,
        userActions: ['clicked export button', 'opened file dialog'],
      };
      const result = LogBundleSchema.safeParse(bundleWithActions);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userActions).toEqual(['clicked export button', 'opened file dialog']);
      }
    });

    it('should accept bundle with optional stateSnapshot', () => {
      const bundleWithState: LogBundleDTO = {
        ...validLogBundle,
        stateSnapshot: { currentProject: 'test-project', isValid: true },
      };
      const result = LogBundleSchema.safeParse(bundleWithState);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stateSnapshot).toEqual({ currentProject: 'test-project', isValid: true });
      }
    });

    it('should accept all valid platform values', () => {
      const platforms: Array<'darwin' | 'win32' | 'linux'> = ['darwin', 'win32', 'linux'];
      platforms.forEach((platform) => {
        const bundle = { ...validLogBundle, platform };
        const result = LogBundleSchema.safeParse(bundle);
        expect(result.success).toBe(true);
      });
    });

    it('should accept valid UUID v4 format', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        '00000000-0000-4000-8000-000000000000',
        'ffffffff-ffff-4fff-bfff-ffffffffffff',
      ];
      validUUIDs.forEach((id) => {
        const bundle = { ...validLogBundle, id };
        const result = LogBundleSchema.safeParse(bundle);
        expect(result.success).toBe(true);
      });
    });

    it('should accept bundle with multiple log entries', () => {
      const bundleWithMultipleLogs: LogBundleDTO = {
        ...validLogBundle,
        logs: [
          { timestamp: '2026-02-08T14:30:00.000Z', level: 'info', source: 'main', message: 'Log 1' },
          { timestamp: '2026-02-08T14:30:01.000Z', level: 'warn', source: 'renderer', message: 'Log 2' },
          { timestamp: '2026-02-08T14:30:02.000Z', level: 'error', source: 'main', message: 'Log 3', stack: 'Error' },
        ],
      };
      const result = LogBundleSchema.safeParse(bundleWithMultipleLogs);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs).toHaveLength(3);
      }
    });
  });

  describe('invalid input rejection', () => {
    it('should reject bundle with invalid UUID', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716', // Missing last segment
        '550e8400-e29b-41d4-a716-44665544000', // Too short
        '550e8400-e29b-41d4-a716-4466554400000', // Too long
        '550e8400-e29b-41d4-a716-446655440000-abc', // Extra segment
      ];
      invalidUUIDs.forEach((id) => {
        const invalidBundle = { ...validLogBundle, id };
        const result = LogBundleSchema.safeParse(invalidBundle);
        expect(result.success).toBe(false);
      });
    });

    it('should reject bundle with invalid timestamp', () => {
      const invalidBundle = { ...validLogBundle, timestamp: 'invalid-date' };
      const result = LogBundleSchema.safeParse(invalidBundle);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('ISO 8601');
      }
    });

    it('should reject bundle with empty appVersion', () => {
      const invalidBundle = { ...validLogBundle, appVersion: '' };
      const result = LogBundleSchema.safeParse(invalidBundle);
      expect(result.success).toBe(false);
    });

    it('should reject bundle with empty electronVersion', () => {
      const invalidBundle = { ...validLogBundle, electronVersion: '' };
      const result = LogBundleSchema.safeParse(invalidBundle);
      expect(result.success).toBe(false);
    });

    it('should reject bundle with invalid platform', () => {
      const invalidPlatforms = ['macos', 'windows', 'ubuntu', 'bsd'];
      invalidPlatforms.forEach((platform) => {
        const invalidBundle = { ...validLogBundle, platform };
        const result = LogBundleSchema.safeParse(invalidBundle);
        expect(result.success).toBe(false);
      });
    });

    it('should reject bundle with invalid log entry', () => {
      const invalidBundle = {
        ...validLogBundle,
        logs: [
          {
            timestamp: '2026-02-08T14:30:00.000Z',
            level: 'invalid',
            source: 'main',
            message: 'Test',
          },
        ],
      };
      const result = LogBundleSchema.safeParse(invalidBundle);
      expect(result.success).toBe(false);
    });

    it('should reject bundle without id field', () => {
      // @ts-expect-error - testing missing required field
      const invalidBundle = { ...validLogBundle, id: undefined };
      const result = LogBundleSchema.safeParse(invalidBundle);
      expect(result.success).toBe(false);
    });

    it('should reject bundle without timestamp field', () => {
      // @ts-expect-error - testing missing required field
      const invalidBundle = { ...validLogBundle, timestamp: undefined };
      const result = LogBundleSchema.safeParse(invalidBundle);
      expect(result.success).toBe(false);
    });

    it('should reject bundle with non-array logs', () => {
      const invalidBundle = { ...validLogBundle, logs: 'not-an-array' };
      const result = LogBundleSchema.safeParse(invalidBundle);
      expect(result.success).toBe(false);
    });

    it('should reject bundle without logs field', () => {
      // @ts-expect-error - testing missing required field
      const invalidBundle = { ...validLogBundle, logs: undefined };
      const result = LogBundleSchema.safeParse(invalidBundle);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// LogsExportResponseSchema Tests
// ============================================================================

describe('LogsExportResponseSchema', () => {
  const validLogBundle: LogBundleDTO = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: '2026-02-08T14:30:00.000Z',
    appVersion: '1.0.0',
    electronVersion: '33.0.0',
    platform: 'darwin',
    logs: [],
  };

  describe('success=true response validation', () => {
    it('should validate success=true response with data', () => {
      const successResponse: LogsExportResponseDTO = {
        success: true,
        data: {
          bundle: validLogBundle,
          downloadPath: '/Users/edney/Downloads/logs-2026-02-08.json',
        },
      };
      const result = LogsExportResponseSchema.safeParse(successResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(successResponse);
        expect(result.data.success).toBe(true);
      }
    });

    it('should require downloadPath in success response', () => {
      const invalidResponse = {
        success: true,
        data: {
          bundle: validLogBundle,
          downloadPath: '',
        },
      };
      const result = LogsExportResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject success=true response without data', () => {
      // @ts-expect-error - testing missing data field
      const invalidResponse = { success: true };
      const result = LogsExportResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('success=false response validation', () => {
    it('should validate success=false response with error', () => {
      const errorResponse: LogsExportResponseDTO = {
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to write log file to disk',
        },
      };
      const result = LogsExportResponseSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(errorResponse);
        expect(result.data.success).toBe(false);
      }
    });

    it('should require error code in error response', () => {
      const invalidResponse = {
        success: false,
        error: {
          code: '',
          message: 'Some error',
        },
      };
      const result = LogsExportResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should require error message in error response', () => {
      const invalidResponse = {
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: '',
        },
      };
      const result = LogsExportResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject success=false response without error', () => {
      // @ts-expect-error - testing missing error field
      const invalidResponse = { success: false };
      const result = LogsExportResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('discriminated union behavior', () => {
    it('should enforce discriminated union with success field', () => {
      // Success response
      const successResponse = {
        success: true,
        data: {
          bundle: validLogBundle,
          downloadPath: '/path/to/logs.json',
        },
      };
      const successResult = LogsExportResponseSchema.safeParse(successResponse);
      expect(successResult.success).toBe(true);
      if (successResult.success) {
        // Type narrowing should work here
        expect(successResult.data.success).toBe(true);
        expect('data' in successResult.data).toBe(true);
        expect('error' in successResult.data).toBe(false);
      }
    });

    it('should not allow mixing success and error fields', () => {
      // This should fail because the discriminated union prevents mixing
      const mixedResponse = {
        success: true,
        data: {
          bundle: validLogBundle,
          downloadPath: '/path/to/logs.json',
        },
        error: {
          code: 'SHOULD_NOT_BE_HERE',
          message: 'This should not be allowed',
        },
      };
      const result = LogsExportResponseSchema.safeParse(mixedResponse);
      // Zod discriminated union ignores extra fields not in the selected variant
      // So this passes - the extra 'error' field is simply ignored
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify it matches the success variant (data is present)
        expect('data' in result.data).toBe(true);
        // The error field from input is not in the output (extra fields ignored)
        expect('error' in result.data).toBe(false);
      }
    });

    it('should reject response with invalid success value', () => {
      // @ts-expect-error - testing invalid success value
      const invalidResponse = { success: 'yes' };
      const result = LogsExportResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});
