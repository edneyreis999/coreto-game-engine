/**
 * RmmzProjectValidator unit tests.
 *
 * Tests RPG Maker MZ project structure validation logic.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DataLoadError, NodeFileSystem, RmmzProjectValidator } from '@coreto/core';

/** Test-specific constant for temporary directory prefix */
const TEST_TEMP_DIR_PREFIX = 'rmmz-validator-test-';

describe('RmmzProjectValidator', () => {
  let validator: RmmzProjectValidator;
  let fileSystem: NodeFileSystem;
  let tempDir: string;
  let validProjectPath: string;

  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TEST_TEMP_DIR_PREFIX));
    validProjectPath = path.join(tempDir, 'valid-project');

    // Create minimal valid RPG Maker MZ project structure
    fs.mkdirSync(validProjectPath);
    fs.mkdirSync(path.join(validProjectPath, 'data'));
    fs.mkdirSync(path.join(validProjectPath, 'js'));
    fs.writeFileSync(path.join(validProjectPath, 'game.rmmzproject'), '');

    // Initialize validator with real filesystem
    fileSystem = new NodeFileSystem();
    validator = new RmmzProjectValidator(fileSystem);
  });

  afterEach(() => {
    // Cleanup temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('validateProjectStructure', () => {
    describe('valid project structures', () => {
      it('should return true for valid RPG Maker MZ project', async () => {
        const result = await validator.validateProjectStructure(validProjectPath);
        expect(result).toBe(true);
      });

      it('should accept project with additional directories', async () => {
        // Add optional directories
        fs.mkdirSync(path.join(validProjectPath, 'audio'));
        fs.mkdirSync(path.join(validProjectPath, 'img'));
        fs.mkdirSync(path.join(validProjectPath, 'movies'));

        const result = await validator.validateProjectStructure(validProjectPath);
        expect(result).toBe(true);
      });

      it('should accept project with files in data/ directory', async () => {
        // Add some data files
        fs.writeFileSync(path.join(validProjectPath, 'data', 'Troops.json'), '[]');
        fs.writeFileSync(path.join(validProjectPath, 'data', 'Enemies.json'), '[]');

        const result = await validator.validateProjectStructure(validProjectPath);
        expect(result).toBe(true);
      });
    });

    describe('invalid project structures', () => {
      it('should throw DataLoadError if path does not exist', async () => {
        const nonExistentPath = path.join(tempDir, 'non-existent-project');

        await expect(
          validator.validateProjectStructure(nonExistentPath)
        ).rejects.toThrow(DataLoadError);

        await expect(
          validator.validateProjectStructure(nonExistentPath)
        ).rejects.toThrow('Invalid RPG Maker MZ project structure');
      });

      it('should throw DataLoadError if path is not a directory', async () => {
        const filePath = path.join(tempDir, 'not-a-directory.txt');
        fs.writeFileSync(filePath, 'test');

        await expect(
          validator.validateProjectStructure(filePath)
        ).rejects.toThrow(DataLoadError);

        await expect(
          validator.validateProjectStructure(filePath)
        ).rejects.toThrow('Invalid RPG Maker MZ project structure');
      });

      it('should throw DataLoadError if game.rmmzproject is missing', async () => {
        const invalidProject = path.join(tempDir, 'no-marker-project');
        fs.mkdirSync(invalidProject);
        fs.mkdirSync(path.join(invalidProject, 'data'));
        fs.mkdirSync(path.join(invalidProject, 'js'));
        // Missing game.rmmzproject

        await expect(
          validator.validateProjectStructure(invalidProject)
        ).rejects.toThrow(DataLoadError);

        await expect(
          validator.validateProjectStructure(invalidProject)
        ).rejects.toThrow('game.rmmzproject not found');
      });

      it('should throw DataLoadError if data/ directory is missing', async () => {
        const invalidProject = path.join(tempDir, 'no-data-project');
        fs.mkdirSync(invalidProject);
        fs.mkdirSync(path.join(invalidProject, 'js'));
        fs.writeFileSync(path.join(invalidProject, 'game.rmmzproject'), '');
        // Missing data/ directory

        await expect(
          validator.validateProjectStructure(invalidProject)
        ).rejects.toThrow(DataLoadError);

        await expect(
          validator.validateProjectStructure(invalidProject)
        ).rejects.toThrow('data/ directory not found');
      });

      it('should throw DataLoadError if js/ directory is missing', async () => {
        const invalidProject = path.join(tempDir, 'no-js-project');
        fs.mkdirSync(invalidProject);
        fs.mkdirSync(path.join(invalidProject, 'data'));
        fs.writeFileSync(path.join(invalidProject, 'game.rmmzproject'), '');
        // Missing js/ directory

        await expect(
          validator.validateProjectStructure(invalidProject)
        ).rejects.toThrow(DataLoadError);

        await expect(
          validator.validateProjectStructure(invalidProject)
        ).rejects.toThrow('Invalid RPG Maker MZ project structure');
      });
    });

    describe('security validation', () => {
      it('should throw DataLoadError on path traversal attempt', async () => {
        const traversalPath = path.join(validProjectPath, '..');

        await expect(
          validator.validateProjectStructure(traversalPath)
        ).rejects.toThrow(DataLoadError);

        await expect(
          validator.validateProjectStructure(traversalPath)
        ).rejects.toThrow('Invalid RPG Maker MZ project structure');
      });

      it('should throw DataLoadError on path with ".." segment', async () => {
        const maliciousPath = '../../../etc/passwd';

        await expect(
          validator.validateProjectStructure(maliciousPath)
        ).rejects.toThrow(DataLoadError);
      });

      it('should handle symlinks safely', async () => {
        // Create symlink to valid project
        const symlinkPath = path.join(tempDir, 'symlink-project');

        // Skip test on Windows where symlinks require admin privileges
        if (os.platform() === 'win32') {
          return;
        }

        try {
          fs.symlinkSync(validProjectPath, symlinkPath);

          // Should follow symlink and validate the target
          const result = await validator.validateProjectStructure(symlinkPath);
          expect(result).toBe(true);
        } catch (error) {
          // If symlink creation fails (permissions), skip this test
          if ((error as NodeJS.ErrnoException).code === 'EPERM') {
            return;
          }
          throw error;
        }
      });
    });

    describe('error context', () => {
      it('should include projectPath in error context', async () => {
        const nonExistentPath = path.join(tempDir, 'non-existent');

        try {
          await validator.validateProjectStructure(nonExistentPath);
          fail('Should have thrown DataLoadError');
        } catch (error) {
          expect(error).toBeInstanceOf(DataLoadError);
          const dataLoadError = error as DataLoadError;
          expect(dataLoadError.context).toHaveProperty('projectPath');
          expect(dataLoadError.context?.projectPath).toBe(nonExistentPath);
        }
      });

      it('should include reason in error context for missing marker file', async () => {
        const invalidProject = path.join(tempDir, 'no-marker');
        fs.mkdirSync(invalidProject);
        fs.mkdirSync(path.join(invalidProject, 'data'));
        fs.mkdirSync(path.join(invalidProject, 'js'));

        try {
          await validator.validateProjectStructure(invalidProject);
          fail('Should have thrown DataLoadError');
        } catch (error) {
          expect(error).toBeInstanceOf(DataLoadError);
          const dataLoadError = error as DataLoadError;
          expect(dataLoadError.context).toHaveProperty('reason');
          expect(dataLoadError.context?.reason).toBe('missing_marker_file');
        }
      });

      it('should include reason in error context for missing data directory', async () => {
        const invalidProject = path.join(tempDir, 'no-data');
        fs.mkdirSync(invalidProject);
        fs.mkdirSync(path.join(invalidProject, 'js'));
        fs.writeFileSync(path.join(invalidProject, 'game.rmmzproject'), '');

        try {
          await validator.validateProjectStructure(invalidProject);
          fail('Should have thrown DataLoadError');
        } catch (error) {
          expect(error).toBeInstanceOf(DataLoadError);
          const dataLoadError = error as DataLoadError;
          expect(dataLoadError.context).toHaveProperty('reason');
          expect(dataLoadError.context?.reason).toBe('missing_data_directory');
        }
      });

      it('should set severity to critical for all validation errors', async () => {
        const nonExistentPath = path.join(tempDir, 'non-existent');

        try {
          await validator.validateProjectStructure(nonExistentPath);
          fail('Should have thrown DataLoadError');
        } catch (error) {
          expect(error).toBeInstanceOf(DataLoadError);
          const dataLoadError = error as DataLoadError;
          expect(dataLoadError.severity).toBe('critical');
        }
      });
    });

    describe('edge cases', () => {
      it('should handle empty project path gracefully', async () => {
        await expect(
          validator.validateProjectStructure('')
        ).rejects.toThrow(DataLoadError);
      });

      it('should handle whitespace-only project path', async () => {
        await expect(
          validator.validateProjectStructure('   ')
        ).rejects.toThrow(DataLoadError);
      });

      it('should handle very long but valid project paths', async () => {
        // Create nested directory structure
        let deepPath = validProjectPath;
        for (let i = 0; i < 10; i++) {
          deepPath = path.join(deepPath, `level-${i}`);
        }

        fs.mkdirSync(deepPath, { recursive: true });
        fs.mkdirSync(path.join(deepPath, 'data'));
        fs.mkdirSync(path.join(deepPath, 'js'));
        fs.writeFileSync(path.join(deepPath, 'game.rmmzproject'), '');

        const result = await validator.validateProjectStructure(deepPath);
        expect(result).toBe(true);
      });

      it('should handle paths with special characters in directory names', async () => {
        const specialPath = path.join(tempDir, 'project-with-special-chars!@#$%');
        fs.mkdirSync(specialPath);
        fs.mkdirSync(path.join(specialPath, 'data'));
        fs.mkdirSync(path.join(specialPath, 'js'));
        fs.writeFileSync(path.join(specialPath, 'game.rmmzproject'), '');

        const result = await validator.validateProjectStructure(specialPath);
        expect(result).toBe(true);
      });
    });
  });
});
