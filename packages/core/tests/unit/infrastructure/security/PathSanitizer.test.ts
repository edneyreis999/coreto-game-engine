/**
 * PathSanitizer unit tests.
 *
 * Tests path sanitization, validation, and security features.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PathSanitizer } from '../../src/infrastructure/security/PathSanitizer.js';
import { ValidationError } from '../../src/core/errors/index.js';

describe('PathSanitizer', () => {
  let tempDir: string;
  let testProjectDir: string;

  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'path-sanitizer-test-'));
    testProjectDir = path.join(tempDir, 'test-project');
  });

  afterEach(() => {
    // Cleanup temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('sanitize', () => {
    describe('path traversal protection', () => {
      it('should reject paths with ".." (single level)', () => {
        expect(() => {
          PathSanitizer.sanitize('../etc/passwd');
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.sanitize('../etc/passwd');
        }).toThrow('Path traversal detected');
      });

      it('should reject paths with ".." (multiple levels)', () => {
        expect(() => {
          PathSanitizer.sanitize('foo/../bar/../../../secret');
        }).toThrow(ValidationError);
      });

      it('should reject paths with ".." in middle', () => {
        expect(() => {
          PathSanitizer.sanitize('foo/../bar/baz');
        }).toThrow(ValidationError);
      });

      it('should reject absolute paths with ".."', () => {
        expect(() => {
          PathSanitizer.sanitize('/tmp/foo/../../../etc/passwd');
        }).toThrow(ValidationError);
      });
    });

    describe('absolute path resolution', () => {
      it('should resolve relative paths to absolute', () => {
        const result = PathSanitizer.sanitize('foo/bar.txt');
        expect(path.isAbsolute(result)).toBe(true);
        expect(result).toContain('foo/bar.txt');
      });

      it('should preserve absolute paths', () => {
        const absolutePath = '/tmp/test.txt';
        const result = PathSanitizer.sanitize(absolutePath);
        expect(path.isAbsolute(result)).toBe(true);
      });

      it('should resolve relative paths with basePath', () => {
        const basePath = '/base/path';
        const result = PathSanitizer.sanitize('foo/bar.txt', basePath);
        expect(result).toBe(path.normalize('/base/path/foo/bar.txt'));
      });
    });

    describe('basePath constraint', () => {
      it('should allow paths within basePath', () => {
        const basePath = tempDir;
        const result = PathSanitizer.sanitize('subdir/file.txt', basePath);
        expect(result.startsWith(basePath)).toBe(true);
      });

      it('should reject absolute paths outside basePath', () => {
        const basePath = '/base/path';
        expect(() => {
          PathSanitizer.sanitize('/etc/passwd', basePath);
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.sanitize('/etc/passwd', basePath);
        }).toThrow('outside base directory');
      });

      it('should handle trailing slashes in basePath', () => {
        const basePath = tempDir + '/';
        const result = PathSanitizer.sanitize('file.txt', basePath);
        expect(result.startsWith(path.normalize(tempDir))).toBe(true);
      });
    });

    describe('symlink protection', () => {
      it('should resolve symlinks pointing within basePath', () => {
        // Create target file
        const targetFile = path.join(tempDir, 'target.txt');
        fs.writeFileSync(targetFile, 'content');

        // Create symlink
        const symlinkPath = path.join(tempDir, 'link.txt');
        fs.symlinkSync(targetFile, symlinkPath);

        // Resolve both tempDir and target to handle system symlinks (like /tmp -> /private/tmp on macOS)
        const resolvedTempDir = fs.realpathSync(tempDir);
        const resolvedTarget = fs.realpathSync(targetFile);

        // Should resolve to real path
        const result = PathSanitizer.sanitize(symlinkPath, resolvedTempDir);
        expect(result).toBe(resolvedTarget);
      });

      it('should reject symlinks pointing outside basePath', () => {
        // Create target outside tempDir
        const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'outside-'));
        const targetFile = path.join(outsideDir, 'target.txt');
        fs.writeFileSync(targetFile, 'content');

        // Create symlink inside tempDir pointing outside
        const symlinkPath = path.join(tempDir, 'malicious-link.txt');
        fs.symlinkSync(targetFile, symlinkPath);

        expect(() => {
          PathSanitizer.sanitize(symlinkPath, tempDir);
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.sanitize(symlinkPath, tempDir);
        }).toThrow('Symlink points outside base directory');

        // Cleanup
        fs.rmSync(outsideDir, { recursive: true, force: true });
      });
    });

    describe('edge cases', () => {
      it('should handle paths with spaces', () => {
        const result = PathSanitizer.sanitize('path with spaces/file.txt');
        expect(result).toContain('path with spaces/file.txt');
      });

      it('should handle current directory reference without basePath', () => {
        const result = PathSanitizer.sanitize('./file.txt');
        expect(path.isAbsolute(result)).toBe(true);
      });

      it('should handle empty path segments', () => {
        const result = PathSanitizer.sanitize('foo//bar///baz.txt');
        expect(result).toContain('foo');
        expect(result).toContain('bar');
        expect(result).toContain('baz.txt');
      });
    });
  });

  describe('validateRPGMakerMZProject', () => {
    describe('valid project structure', () => {
      beforeEach(() => {
        // Create valid RPG Maker MZ project structure
        fs.mkdirSync(testProjectDir);
        fs.writeFileSync(path.join(testProjectDir, 'game.rmmzproject'), '');
        fs.mkdirSync(path.join(testProjectDir, 'data'));
        fs.mkdirSync(path.join(testProjectDir, 'js'));
      });

      it('should validate correct project structure', () => {
        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).not.toThrow();
      });

      it('should validate project with relative path', () => {
        const relativePath = path.relative(process.cwd(), testProjectDir);

        // Skip test if relative path contains '..' (happens when cwd is not parent of testProjectDir)
        if (relativePath.includes('..')) {
          // This is expected behavior - PathSanitizer rejects '..' in paths
          expect(() => {
            PathSanitizer.validateRPGMakerMZProject(relativePath);
          }).toThrow(ValidationError);
        } else {
          expect(() => {
            PathSanitizer.validateRPGMakerMZProject(relativePath);
          }).not.toThrow();
        }
      });
    });

    describe('missing project path', () => {
      it('should throw if project path does not exist', () => {
        const nonExistentPath = path.join(tempDir, 'does-not-exist');

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(nonExistentPath);
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(nonExistentPath);
        }).toThrow('does not exist');
      });
    });

    describe('invalid project structure', () => {
      it('should throw if path is not a directory', () => {
        const filePath = path.join(tempDir, 'file.txt');
        fs.writeFileSync(filePath, 'content');

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(filePath);
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(filePath);
        }).toThrow('not a directory');
      });

      it('should throw if game.rmmzproject is missing', () => {
        fs.mkdirSync(testProjectDir);
        fs.mkdirSync(path.join(testProjectDir, 'data'));
        fs.mkdirSync(path.join(testProjectDir, 'js'));

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).toThrow('game.rmmzproject not found');
      });

      it('should throw if data/ directory is missing', () => {
        fs.mkdirSync(testProjectDir);
        fs.writeFileSync(path.join(testProjectDir, 'game.rmmzproject'), '');
        fs.mkdirSync(path.join(testProjectDir, 'js'));

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).toThrow('data/ directory not found');
      });

      it('should throw if js/ directory is missing', () => {
        fs.mkdirSync(testProjectDir);
        fs.writeFileSync(path.join(testProjectDir, 'game.rmmzproject'), '');
        fs.mkdirSync(path.join(testProjectDir, 'data'));

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).toThrow('js/ directory not found');
      });

      it('should throw if data/ is a file instead of directory', () => {
        fs.mkdirSync(testProjectDir);
        fs.writeFileSync(path.join(testProjectDir, 'game.rmmzproject'), '');
        fs.writeFileSync(path.join(testProjectDir, 'data'), 'not a directory');
        fs.mkdirSync(path.join(testProjectDir, 'js'));

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).toThrow('data/ is not a directory');
      });

      it('should throw if js/ is a file instead of directory', () => {
        fs.mkdirSync(testProjectDir);
        fs.writeFileSync(path.join(testProjectDir, 'game.rmmzproject'), '');
        fs.mkdirSync(path.join(testProjectDir, 'data'));
        fs.writeFileSync(path.join(testProjectDir, 'js'), 'not a directory');

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject(testProjectDir);
        }).toThrow('js/ is not a directory');
      });
    });

    describe('path traversal protection in validation', () => {
      it('should reject project path with ".."', () => {
        expect(() => {
          PathSanitizer.validateRPGMakerMZProject('../../../etc');
        }).toThrow(ValidationError);

        expect(() => {
          PathSanitizer.validateRPGMakerMZProject('../../../etc');
        }).toThrow('Path traversal detected');
      });
    });
  });
});
