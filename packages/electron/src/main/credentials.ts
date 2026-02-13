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
import { readFile } from 'node:fs/promises';
import { app } from 'electron';

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
 * Uses development mode (process.cwd) for dev builds,
 * or userData directory for production builds.
 *
 * @returns Promise that resolves when credentials are loaded
 * @throws Error when credentials file cannot be found or is invalid
 */
export async function loadCredentials(): Promise<void> {
  // In development: use current working directory (project root)
  const isDev = process.env.NODE_ENV === 'development';

  const settingsPath = isDev
    ? path.join(process.cwd(), '.claude/settings.local.json')
    : path.join(app.getPath('userData'), '.claude/settings.local.json');

  try {
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

    console.error('[Credentials] Loaded from:', settingsPath);
    return;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to load credentials from ${settingsPath}: ${message}. See DEPLOYMENT.md for setup instructions.`
    );
  }
}
