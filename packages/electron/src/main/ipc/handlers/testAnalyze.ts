/**
 * Test Analyze IPC Handler
 *
 * Handles test directory preparation for project analysis.
 * Creates test directory with NSD and scene files.
 */

import type { IpcMainInvokeEvent } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

import type { IPCResult } from '../protocol-types.js';
import { getLogger } from '../../di/container.js';
import { wrapHandler } from '../ipc-response.js';

// ============================================================================
// Schema Definitions
// ============================================================================

/**
 * Schema for test-analyze:prepare-directory endpoint.
 */
interface PrepareTestDirectoryParams {
  /** Source NSD file path */
  nsdPath: string;
  /** Scene text content */
  sceneText: string;
  /** Scene file name */
  sceneFile: string;
  /** Optional export directory (defaults to reports/analyze_project) */
  exportDir?: string;
}

/**
 * Response format for test-analyze:prepare-directory handler.
 */
interface PrepareTestDirectoryResponse {
  /** Directory where test files were created */
  testDirectory: string;
  /** Path to copied NSD file */
  nsdFile: string;
  /** Path to created scene file */
  sceneFile: string;
}

// ============================================================================
// Handler: test-analyze:prepare-directory
// ============================================================================

/**
 * Handler: test-analyze:prepare-directory
 *
 * Prepares test directory with NSD and scene files.
 * Creates export directory, copies NSD file, and creates scene file.
 *
 * @param _event - IPC event (unused)
 * @param payload - Test directory preparation parameters
 * @returns Promise resolving to test directory paths
 *
 * @example
 * ```typescript
 * const result = await handlePrepareTestDirectory(event, {
 *   nsdPath: '/path/to/nsd.md',
 *   sceneText: 'Scene content here',
 *   sceneFile: 'scene.md'
 * });
 * ```
 */
export async function handlePrepareTestDirectory(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<PrepareTestDirectoryResponse>> {
  return wrapHandler(async () => {
    const logger = getLogger();

    // Log 1: Handler entry
    logger.info('[TestAnalyze] ========== PREPARE DIRECTORY START ==========');
    logger.info('[TestAnalyze] Step 1: Parsing payload');

    const params = payload as PrepareTestDirectoryParams;
    logger.info('[TestAnalyze] Payload parsed successfully', {
      nsdPath: params.nsdPath,
      sceneFile: params.sceneFile,
      sceneTextLength: params.sceneText?.length || 0,
      exportDir: params.exportDir || '(default)',
    });

    // Step 1: Determine export directory
    logger.info('[TestAnalyze] Step 2: Determining export directory');
    let exportDir: string;
    if (params.exportDir) {
      exportDir = params.exportDir;
      logger.info('[TestAnalyze] Using provided export directory', { exportDir });
    } else {
      // Use the same directory as "Export Logs" + /analyze_project
      const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
      const reportsDir = isTest
        ? path.resolve(process.cwd(), 'reports', 'application-logs')
        : path.resolve(process.cwd(), 'reports', 'application-logs');
      exportDir = path.join(reportsDir, 'analyze_project');
      logger.info('[TestAnalyze] Using default export directory', {
        isTest,
        reportsDir,
        exportDir
      });
    }

    // Step 2: Create export directory
    logger.info('[TestAnalyze] Step 3: Creating export directory', { exportDir });
    try {
      await fs.promises.mkdir(exportDir, { recursive: true });
      logger.info('[TestAnalyze] ✓ Directory created successfully');
    } catch (error) {
      logger.error('[TestAnalyze] ✗ Failed to create directory', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Step 3: Copy NSD file to export directory
    logger.info('[TestAnalyze] Step 4: Copying NSD file', {
      source: params.nsdPath
    });
    const nsdFileName = path.basename(params.nsdPath);
    const nsdDestPath = path.join(exportDir, nsdFileName);
    logger.info('[TestAnalyze] NSD destination path', { nsdDestPath });

    try {
      // Check if source file exists
      await fs.promises.access(params.nsdPath, fs.constants.R_OK);
      logger.info('[TestAnalyze] ✓ Source NSD file exists and is readable');

      await fs.promises.copyFile(params.nsdPath, nsdDestPath);
      logger.info('[TestAnalyze] ✓ NSD file copied successfully');
    } catch (error) {
      logger.error('[TestAnalyze] ✗ Failed to copy NSD file', {
        error: error instanceof Error ? error.message : String(error),
        code: (error as NodeJS.ErrnoException).code
      });
      throw error;
    }

    // Step 4: Create scene markdown file
    logger.info('[TestAnalyze] Step 5: Creating scene file', {
      sceneFile: params.sceneFile
    });
    const sceneDestPath = path.join(exportDir, params.sceneFile);
    logger.info('[TestAnalyze] Scene destination path', { sceneDestPath });

    try {
      await fs.promises.writeFile(sceneDestPath, params.sceneText, 'utf-8');
      logger.info('[TestAnalyze] ✓ Scene file created successfully');
    } catch (error) {
      logger.error('[TestAnalyze] ✗ Failed to create scene file', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Success summary
    logger.info('[TestAnalyze] ========== PREPARE DIRECTORY SUCCESS ==========');
    logger.info('[TestAnalyze] Returning test directory info', {
      testDirectory: exportDir,
      nsdFile: nsdDestPath,
      sceneFile: sceneDestPath,
    });

    return {
      testDirectory: exportDir,
      nsdFile: nsdDestPath,
      sceneFile: sceneDestPath,
    };
  });
}
