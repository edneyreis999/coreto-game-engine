/**
 * E2E Test Project Setup Utilities
 *
 * Creates a temporary RPG Maker MZ project structure for E2E testing.
 * Copies sample data files and creates marker file (game.rmmzproject).
 *
 * @module tests/fixtures/e2e/setup-e2e-project
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * E2E test project structure
 */
export interface E2EProjectSetup {
  projectPath: string;
  reportOutputPath: string;
  configPath: string;
  cleanup: () => void;
}

/**
 * Create a temporary RPG Maker MZ project for E2E testing.
 *
 * Structure created:
 * - temp-project/
 *   - game.rmmzproject (marker file)
 *   - data/
 *     - Classes.json
 *     - Enemies.json
 *     - Items.json
 *     - Skills.json
 *     - System.json
 *     - Troops.json
 *   - js/ (optional for now)
 *
 * @param configFileName - Name of config file in fixtures/e2e/
 * @returns Project setup with paths and cleanup function
 */
export function setupE2EProject(configFileName: string): E2EProjectSetup {
  // Create temporary directories
  const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), 'coreto-e2e-'));
  const projectPath = path.join(tempBase, 'mock-project');
  const reportOutputPath = path.join(tempBase, 'reports');

  // Create directory structure
  fs.mkdirSync(projectPath, { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'data'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'js'), { recursive: true });
  fs.mkdirSync(reportOutputPath, { recursive: true });

  // Create game.rmmzproject marker file
  fs.writeFileSync(path.join(projectPath, 'game.rmmzproject'), 'RPGMZ 1.8.1');

  // Copy sample data files
  const sampleDataPath = path.join(__dirname, '..', 'sample-data');
  const dataFiles = [
    'Classes.json',
    'Enemies.json',
    'Items.json',
    'Skills.json',
    'System.json',
    'Troops.json',
  ];

  for (const file of dataFiles) {
    const sourcePath = path.join(sampleDataPath, file);
    const destPath = path.join(projectPath, 'data', file);
    fs.copyFileSync(sourcePath, destPath);
  }

  // Create minimal stub files for other required data files
  const stubFiles = {
    'Actors.json': '[null,{"id":1,"name":"Actor1","classId":1,"initialLevel":1}]',
    'Weapons.json': '[null]',
    'Armors.json': '[null]',
    'States.json': '[null]',
  };

  for (const [filename, content] of Object.entries(stubFiles)) {
    const destPath = path.join(projectPath, 'data', filename);
    fs.writeFileSync(destPath, content, 'utf-8');
  }

  // Load config template and replace placeholders
  const configTemplatePath = path.join(__dirname, configFileName);
  const configContent = fs
    .readFileSync(configTemplatePath, 'utf-8')
    .replace(/\{\{MOCK_PROJECT_PATH\}\}/g, projectPath)
    .replace(/\{\{REPORT_OUTPUT_PATH\}\}/g, reportOutputPath);

  // Write processed config
  const configPath = path.join(tempBase, 'project.config.json');
  fs.writeFileSync(configPath, configContent, 'utf-8');

  // Cleanup function
  const cleanup = () => {
    if (fs.existsSync(tempBase)) {
      fs.rmSync(tempBase, { recursive: true, force: true });
    }
  };

  return {
    projectPath,
    reportOutputPath,
    configPath,
    cleanup,
  };
}

/**
 * Verify that no writes occurred to the project path (read-only constraint).
 *
 * @param projectPath - Project path to check
 * @param initialSnapshot - Snapshot of file mtimes before test
 * @returns True if no writes detected, false otherwise
 */
export function verifyReadOnlyConstraint(
  projectPath: string,
  initialSnapshot: Map<string, number>
): boolean {
  const dataPath = path.join(projectPath, 'data');

  if (!fs.existsSync(dataPath)) {
    return true; // Directory doesn't exist, can't have been written to
  }

  const files = fs.readdirSync(dataPath);

  for (const file of files) {
    const filePath = path.join(dataPath, file);
    const stats = fs.statSync(filePath);
    const initialMtime = initialSnapshot.get(filePath);

    if (initialMtime && stats.mtimeMs !== initialMtime) {
      return false; // File was modified
    }

    if (!initialMtime && initialSnapshot.size > 0) {
      return false; // New file created
    }
  }

  return true;
}

/**
 * Create a snapshot of file modification times.
 *
 * @param projectPath - Project path to snapshot
 * @returns Map of file paths to mtime values
 */
export function snapshotProjectFiles(projectPath: string): Map<string, number> {
  const snapshot = new Map<string, number>();
  const dataPath = path.join(projectPath, 'data');

  if (!fs.existsSync(dataPath)) {
    return snapshot;
  }

  const files = fs.readdirSync(dataPath);

  for (const file of files) {
    const filePath = path.join(dataPath, file);
    const stats = fs.statSync(filePath);
    snapshot.set(filePath, stats.mtimeMs);
  }

  return snapshot;
}
