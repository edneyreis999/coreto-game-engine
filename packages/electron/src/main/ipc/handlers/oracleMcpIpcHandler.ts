/**
 * Oracle MCP IPC Handlers
 *
 * Handlers for Oracle MCP server functionality.
 * Provides IPC interface for MCP server management and NSD prompt generation.
 *
 * @see docs/releases/v2/PRD_NSD_Generator_v2.md
 * @see docs/releases/v2/HLD_NSD_Generator_v2.md
 */

import type { IpcMainInvokeEvent } from 'electron';
import { z } from 'zod';

import type { IPCResult } from '../protocol-types.js';
import { wrapHandler } from '../ipc-response.js';
import { getLogger } from '../../di/container.js';

// Import McpClientService for MCP server communication
import { mcpClientService } from '../../services/McpClientService.js';

// Import Zod schemas from @coreto/oracle for validation
// Note: Using relative import to avoid bundling issues with workspace packages
import { GeneratePromptSchema } from '../../../../../oracle/src/lib/claudeAgentClient.js';
import type { GeneratePromptInput } from '../../../../../oracle/src/lib/claudeAgentClient.js';

// Re-export GeneratePromptSchema from local types
export { GeneratePromptSchema } from '../../../../../oracle/src/lib/claudeAgentClient.js';

/**
 * Zod schema for validating oracle-mcp:start payload.
 */
export const OracleMcpStartSchema = z.object({
  /**
   * Optional port configuration (defaults to stdio transport)
   */
  port: z.number().int().positive().optional(),
});

/**
 * Zod schema for validating oracle-mcp:generate-prompt payload.
 * Note: GeneratePromptSchema is imported from @coreto/oracle
 */

/**
 * Zod schema for validating oracle-mcp:health payload.
 */
export const OracleMcpHealthSchema = z.object({
  /**
   * Optional timeout in milliseconds
   */
  timeout: z.number().int().positive().optional(),
});

/**
 * Type for oracle-mcp:start response
 */
export interface OracleMcpStartResponse {
  success: boolean;
  message: string;
  serverType: 'stdio' | 'socket';
  timestamp: string;
}

/**
 * Type for oracle-mcp:generate-prompt response
 */
export interface GeneratePromptResponse {
  prompt: string;
  timestamp: string;
}

/**
 * Type for oracle-mcp:health response
 */
export interface OracleMcpHealthResponse {
  healthy: boolean;
  message: string;
  timestamp: string;
}

/**
 * Validates an IPC payload against its Zod schema.
 */
function validatePayload<T extends unknown>(
  channel: string,
  payload: unknown,
  schema: z.ZodType<T>
): asserts payload is T {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Invalid payload for ${channel}: ${errorMessages}`);
  }
}

/**
 * Handler: oracle-mcp:start
 *
 * Starts the Oracle MCP server for external connections.
 * Uses McpClientService to manage the MCP server lifecycle.
 *
 * @param _event - IPC event (unused)
 * @param payload - Start configuration (optional port for socket mode)
 * @returns Promise resolving to start result with server info
 */
export async function handleOracleMcpStart(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<OracleMcpStartResponse>> {
  return wrapHandler(async () => {
    validatePayload('oracle-mcp:start', payload, OracleMcpStartSchema);

    const { port } = payload;
    const serverType: 'stdio' | 'socket' = port ? 'socket' : 'stdio';

    getLogger().info(`[OracleMcpIpcHandler] MCP server start requested, type: ${serverType}`);
    await mcpClientService.start();

    return {
      success: true,
      message: 'Oracle MCP server started successfully',
      serverType,
      timestamp: new Date().toISOString(),
    };
  });
}

/**
 * Handler: oracle-mcp:generate-prompt
 *
 * Generates a technical prompt for implementing an NSD scene in RPG Maker MZ.
 * Validates input using Zod schema and delegates to MCP server via McpClientService.
 *
 * @param _event - IPC event (unused)
 * @param payload - NSD prompt generation parameters
 * @returns Promise resolving to generated prompt
 *
 * @example
 * ```typescript
 * const result = await handleOracleMcpGeneratePrompt(event, {
 *   nsdContent: '# NSD Content...',
 *   sceneName: 'Cena 1: Entrada na Taverna',
 *   projectPath: '/path/to/mz/project',
 *   questVariable: 'Quest 01 Progress'
 * });
 * ```
 */
export async function handleOracleMcpGeneratePrompt(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<GeneratePromptResponse>> {
  return wrapHandler(async () => {
    validatePayload(
      'oracle-mcp:generate-prompt',
      payload,
      GeneratePromptSchema
    );
    const validatedInput = payload as GeneratePromptInput;

    getLogger().info(`[OracleMcpIpcHandler] Generating prompt for scene: ${validatedInput.sceneName}`);

    const result = await mcpClientService.callTool<{ content: Array<{ type: string; text: string }> }>(
      'generate_nsd_prompt',
      validatedInput
    );

    // Extract prompt from MCP response: { content: [{ type: "text", text: "..." }] }
    const prompt = result.content?.[0]?.text || '';

    getLogger().info(`[OracleMcpIpcHandler] Prompt generated successfully, length: ${prompt.length}`);

    // Log model response for debugging
    getLogger().info('[Oracle MCP] Model response:', {
      promptLength: prompt.length,
      sceneName: validatedInput.sceneName,
      preview: prompt.slice(0, 200) + '...'
    });

    return {
      prompt,
      timestamp: new Date().toISOString(),
    };
  });
}

/**
 * Handler: oracle-mcp:health
 *
 * Performs a health check on the Oracle MCP service.
 * Validates that the MCP server is operational via McpClientService.
 *
 * @param _event - IPC event (unused)
 * @param payload - Optional health check parameters
 * @returns Promise resolving to health check result
 *
 * @example
 * ```typescript
 * const result = await handleOracleMcpHealth(event, {});
 * if (result.success && result.data.healthy) {
 *   console.log('Oracle MCP service is healthy');
 * }
 * ```
 */
export async function handleOracleMcpHealth(
  _event: IpcMainInvokeEvent,
  payload: unknown
): Promise<IPCResult<OracleMcpHealthResponse>> {
  return wrapHandler(async () => {
    validatePayload('oracle-mcp:health', payload, OracleMcpHealthSchema);

    const isHealthy = await mcpClientService.healthCheck();

    getLogger().info(`[OracleMcpIpcHandler] Health check result: ${isHealthy}`);

    return {
      healthy: isHealthy,
      message: isHealthy
        ? 'Oracle MCP service is healthy'
        : 'Oracle MCP service is not available',
      timestamp: new Date().toISOString(),
    };
  });
}

/**
 * Cleanup the Oracle MCP handler.
 * Should be called during application shutdown.
 *
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupOracleMcpHandler(): Promise<void> {
  getLogger().info('[OracleMcpIpcHandler] Cleanup requested');
  mcpClientService.cleanup();
}
