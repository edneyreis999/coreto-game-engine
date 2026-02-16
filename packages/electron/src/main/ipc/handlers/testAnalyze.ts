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
    const params = payload as PrepareTestDirectoryParams;
    const logger = getLogger();

    logger.info('[TestAnalyze] Preparing test directory', {
      nsdPath: params.nsdPath,
      sceneFile: params.sceneFile,
    });

    // Step 1: Determine export directory
    let exportDir: string;
    if (params.exportDir) {
      exportDir = params.exportDir;
    } else {
      // Use the same directory as "Export Logs" + /analyze_project
      const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
      const reportsDir = isTest
        ? path.resolve(process.cwd(), 'reports', 'application-logs')
        : path.resolve(process.cwd(), 'reports', 'application-logs');
      exportDir = path.join(reportsDir, 'analyze_project');
    }

    // Step 2: Create export directory
    await fs.promises.mkdir(exportDir, { recursive: true });
    logger.info(`[TestAnalyze] Created export directory: ${exportDir}`);

    // Step 3: Copy NSD file to export directory
    const nsdFileName = path.basename(params.nsdPath);
    const nsdDestPath = path.join(exportDir, nsdFileName);
    await fs.promises.copyFile(params.nsdPath, nsdDestPath);
    logger.info(`[TestAnalyze] Copied NSD file to: ${nsdDestPath}`);

    // Step 4: Create scene markdown file
    const sceneDestPath = path.join(exportDir, params.sceneFile);
    await fs.promises.writeFile(sceneDestPath, params.sceneText, 'utf-8');
    logger.info(`[TestAnalyze] Created scene file: ${sceneDestPath}`);

    return {
      testDirectory: exportDir,
      nsdFile: nsdDestPath,
      sceneFile: sceneDestPath,
    };
  });
}
