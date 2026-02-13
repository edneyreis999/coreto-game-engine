/**
 * Credentials Loader
 *
 * Loads API credentials for MCP server communication.
 * Reads from local settings file and injects into process.env.
 *
 * This ensures MCP server child process has access to required credentials
 * without storing them in version control.
 */

import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { app } from 'electron';

/**
 * Check if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Settings structure with credential information.
 */
interface CredentialSettings {
  env?: {
    ANTHROPIC_AUTH_TOKEN: string;
    ANTHROPIC_BASE_URL?: string;
    ANTHROPIC_DEFAULT_SONNET_MODEL?: string;
  };
  // Support flat structure as well
  ANTHROPIC_AUTH_TOKEN?: string;
  ANTHROPIC_BASE_URL?: string;
  ANTHROPIC_DEFAULT_SONNET_MODEL?: string;
}

/**
 * Loads credentials from settings file and injects into process.env.
 *
 * Searches multiple locations for settings file:
 * 1. Project root (dev): .claude/settings.local.json
 * 2. User data (prod): userData/.claude/settings.local.json
 *
 * @returns Promise that resolves when credentials are loaded
 * @throws Error when credentials file cannot be found or is invalid
 */
export async function loadCredentials(): Promise<void> {
  // In development: use current working directory (project root)
  const isDev = process.env.NODE_ENV === 'development';

  // Resolve paths relative to file location to ensure correctness
  // Source: packages/electron/src/main/credentials.ts to project root = ../../../ (3 levels up)
  // Compiled: packages/electron/out/main/credentials.js to project root = ../../../../ (4 levels up)
  const isCompiled = __dirname.includes('/out/main');
  const levelsToProjectRoot = isCompiled ? 4 : 3;
  const relativePath = '../'.repeat(levelsToProjectRoot) + '.claude/settings.local.json';

  const projectRootPath = path.join(__dirname, relativePath);
  const cwdPath = path.join(process.cwd(), '.claude/settings.local.json');

  // In production: use userData directory
  const prodPath = path.join(app.getPath('userData'), '.claude/settings.local.json');

  console.error('[Credentials] DEBUG: __dirname =', __dirname);
  console.error('[Credentials] DEBUG: process.cwd() =', process.cwd());
  console.error('[Credentials] DEBUG: projectRootPath (relative) =', projectRootPath);
  console.error('[Credentials] DEBUG: cwdPath (process.cwd) =', cwdPath);

  // Try project root first (most reliable in dev), then cwd, then userData
  const settingsPaths = isDev
    ? [projectRootPath, cwdPath, prodPath]
    : [prodPath, projectRootPath, cwdPath];

  console.error('[Credentials] Searching for settings in:', settingsPaths);
  console.error('[Credentials] DEBUG: isDev =', isDev);

  for (const settingsPath of settingsPaths) {
    try {
      console.error(`[Credentials] Attempting to read: ${settingsPath}`);
      console.error(`[Credentials] DEBUG: File exists?`, await fileExists(settingsPath));

      const content = await readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content) as CredentialSettings;

      // Extract env section or use root
      const env = settings.env || settings;

      // Validate required fields
      if (!env.ANTHROPIC_AUTH_TOKEN) {
        throw new Error('ANTHROPIC_AUTH_TOKEN not found in settings');
      }

      // Inject into process.env for child processes
      process.env.ANTHROPIC_AUTH_TOKEN = env.ANTHROPIC_AUTH_TOKEN;
      process.env.ANTHROPIC_BASE_URL = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
      process.env.ANTHROPIC_DEFAULT_SONNET_MODEL = env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'glm-4.7';

      console.error('[Credentials] ✓ Loaded and injected into process.env:', {
        hasToken: !!process.env.ANTHROPIC_AUTH_TOKEN,
        baseUrl: process.env.ANTHROPIC_BASE_URL,
        model: process.env.ANTHROPIC_DEFAULT_SONNET_MODEL,
        source: settingsPath,
      });
      return;
    } catch (err) {
      console.error(`[Credentials] ✗ Failed to read ${settingsPath}:`, err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(
    'Credentials not found. Please ensure .claude/settings.local.json exists with ANTHROPIC_AUTH_TOKEN. See DEPLOYMENT.md for setup instructions.'
  );
}
