/**
 * Project Metadata Service
 *
 * Provides utilities for extracting metadata from project paths.
 * Domain layer - framework agnostic (no Node.js path module).
 */

/**
 * Extracts the project name from a project path.
 * Uses regex for cross-platform path handling (supports both / and \ separators).
 *
 * @param projectPath - Absolute or relative path to the project
 * @returns Project name, or 'Unknown Project' if path is empty/invalid
 *
 * @example
 * extractProjectName('/Users/johndoe/projects/my-game') // 'my-game'
 * extractProjectName('C:\\Projects\\my-game') // 'my-game'
 * extractProjectName('') // 'Unknown Project'
 */
export function extractProjectName(projectPath: string): string {
  if (!projectPath) {
    return 'Unknown Project';
  }

  // Split on both forward and backward slashes for cross-platform support
  const segments = projectPath.split(/[/\\]/).filter(Boolean);

  // Get the last segment (project name)
  return segments.pop() ?? 'Unknown Project';
}
