import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __authDirname = path.dirname(fileURLToPath(import.meta.url));

export interface ClaudeAuthConfig {
  authToken: string;
  baseUrl: string;
  model: string;
}

export async function loadClaudeSettings(): Promise<ClaudeAuthConfig> {
  // Priority 1: Environment variables (recommended for production)
  if (process.env.ANTHROPIC_AUTH_TOKEN) {
    console.error('[auth] Loading credentials from environment variables');
    console.error('[auth] Environment variables found:', {
      ANTHROPIC_AUTH_TOKEN: '***' + process.env.ANTHROPIC_AUTH_TOKEN.slice(-4) + '***',
      ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
      ANTHROPIC_DEFAULT_SONNET_MODEL: process.env.ANTHROPIC_DEFAULT_SONNET_MODEL,
    });
    return {
      authToken: process.env.ANTHROPIC_AUTH_TOKEN,
      baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      model: process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'glm-4.7',
    };
  }

  // Priority 2: File-based settings (development fallback)
  // Both dist/lib/ and src/lib/ are 4 levels up to project root
  const levelsToProjectRoot = 4;
  const relativePath = '../'.repeat(levelsToProjectRoot) + '.claude/settings.local.json';

  const settingsPaths = [
    // Try project root first (dynamically calculated)
    path.join(__authDirname, relativePath),
    // Then try packages level
    path.join(__authDirname, '../../../.claude/settings.local.json'),
    // Then home directory
    path.join(process.env.HOME || '', '.claude/settings.local.json'),
    path.join(process.env.USERPROFILE || '', '.claude/settings.local.json'),
  ];

  for (const settingsPath of settingsPaths) {
    try {
      console.error(`[auth] Loading credentials from file: ${settingsPath}`);
      const content = await readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);

      console.error(`[auth] Attempting path: ${settingsPath}`);
      console.error(`[auth] File exists: ${settingsPath}`);
      console.error(`[auth] File content: ${JSON.stringify(settings).slice(0, 200)}...`);

      // Support both nested (env.*) and flat structure
      const env = settings.env || settings;

      console.error(`[auth] Extracted env:`, {
        hasNestedEnv: !!settings.env,
        hasFlatEnv: !!env.ANTHROPIC_AUTH_TOKEN,
        keys: env ? Object.keys(env) : 'none',
      });

      // Validate required fields
      if (!env.ANTHROPIC_AUTH_TOKEN) {
        console.error(`[auth] ANTHROPIC_AUTH_TOKEN not found in ${settingsPath}`);
        // Continue to next path
        continue;
      }

      // Inject into process.env for child processes
      process.env.ANTHROPIC_AUTH_TOKEN = env.ANTHROPIC_AUTH_TOKEN;
      process.env.ANTHROPIC_BASE_URL = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';
      process.env.ANTHROPIC_DEFAULT_SONNET_MODEL = env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'glm-4.7';

      console.error('[auth] ✓ Loaded and injected into process.env:', {
        hasToken: !!process.env.ANTHROPIC_AUTH_TOKEN,
        baseUrl: process.env.ANTHROPIC_BASE_URL,
        model: process.env.ANTHROPIC_DEFAULT_SONNET_MODEL,
        source: settingsPath,
      });

      return {
        authToken: env.ANTHROPIC_AUTH_TOKEN,
        baseUrl: env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
        model: env.ANTHROPIC_DEFAULT_SONNET_MODEL || 'glm-4.7',
      };
    } catch (err) {
      // Continue to next path
      console.error(`[auth] ✗ Failed to read ${settingsPath}:`, err instanceof Error ? err.message : String(err));
      continue;
    }
  }

  throw new Error(
    'Claude settings not found. Please run: claude auth login'
  );
}

export function createAuthHeaders(authConfig: ClaudeAuthConfig): Record<string, string> {
  return {
    'x-api-key': authConfig.authToken,
    'anthropic-version': '2023-06-01',
  };
}
