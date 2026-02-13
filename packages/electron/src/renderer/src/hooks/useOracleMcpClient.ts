/**
 * useOracleMcpClient Hook
 *
 * Custom React hook for Oracle MCP Client operations.
 * Provides type-safe IPC communication for NSD prompt generation.
 *
 * @see packages/electron/src/main/ipc/handlers/oracleMcpIpcHandler.ts
 * @see @coreto/oracle for GeneratePromptInput type
 */

import { useCallback, useState } from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * GenerateNsdPromptParams
 *
 * Parameters for generating an NSD prompt.
 * Matches GeneratePromptInput from @coreto/oracle.
 *
 * @see @coreto/oracle/src/lib/claudeAgentClient.ts
 */
export interface GenerateNsdPromptParams {
  /** The full NSD document content in markdown format */
  nsdContent: string;

  /** Name of scene to generate a prompt for */
  sceneName: string;

  /** Path to RPG Maker MZ project */
  projectPath: string;

  /** Optional quest variable identifier for scene */
  questVariable?: string;
}

/**
 * GeneratePromptResponse
 *
 * Response from the oracle-mcp:generate-prompt IPC handler.
 * Documented for reference; actual type comes from IPC handler.
 *
 * @see packages/electron/src/main/ipc/handlers/oracleMcpIpcHandler.ts
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _GeneratePromptResponse {
  /** The generated technical prompt for NSD implementation */
  prompt: string;

  /** ISO timestamp of generation */
  timestamp: string;
}

/**
 * UseOracleMcpClientResult
 *
 * Return value for useOracleMcpClient hook.
 * Provides state and callback for NSD prompt generation.
 */
export interface UseOracleMcpClientResult {
  /**
   * Generates an NSD prompt using the Oracle MCP service.
   * @param params - Parameters for prompt generation
   * @returns Promise resolving to the generated prompt text
   */
  generatePrompt: (params: GenerateNsdPromptParams) => Promise<string>;

  /** Loading state for prompt generation */
  isGenerating: boolean;

  /** Error state if generation failed */
  error: Error | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates an error object from an IPC error response.
 */
function createIpcError(ipcError: {
  name: string;
  message: string;
  severity: string;
  context: Record<string, unknown>;
  timestamp: string;
}): Error {
  const error = new Error(ipcError.message);
  error.name = ipcError.name;
  return error;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for Oracle MCP Client operations.
 *
 * Provides state management and IPC communication for NSD prompt generation
 * using the Oracle MCP service. Handles loading and error states automatically.
 *
 * @returns Hook result with generatePrompt, isGenerating, and error
 *
 * @example
 * ```tsx
 * function NsdGenerator() {
 *   const { generatePrompt, isGenerating, error } = useOracleMcpClient();
 *
 *   const handleGenerate = async () => {
 *     await generatePrompt({
 *       nsdContent: '# NSD Content...',
 *       sceneName: 'Cena 1',
 *       projectPath: '/path/to/project',
 *       questVariable: 'Quest 01 Progress'
 *     });
 *   };
 *
 *   return (
 *     <button onClick={handleGenerate} disabled={isGenerating}>
 *       {isGenerating ? 'Generating...' : 'Generate Prompt'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useOracleMcpClient(): UseOracleMcpClientResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Generates an NSD prompt using the Oracle MCP service.
   *
   * Invokes the oracle-mcp:generate-prompt IPC handler with the provided
   * parameters and updates state accordingly.
   */
  const generatePrompt = useCallback(async (params: GenerateNsdPromptParams): Promise<string> => {
    setIsGenerating(true);
    setError(null);

    console.log('[useOracleMcpClient] generatePrompt called with:', {
      sceneName: params.sceneName,
      projectPath: params.projectPath,
      nsdContentLength: params.nsdContent.length,
      hasQuestVariable: !!params.questVariable,
    });

    try {
      // Invoke Oracle MCP API for prompt generation
      console.log('[useOracleMcpClient] Calling window.coreto.oracleMcp.generatePrompt...');
      const result = await window.coreto.oracleMcp.generatePrompt(params);

      console.log('[useOracleMcpClient] IPC result received:', {
        success: result.success,
        hasData: !!result.data,
        dataType: result.data ? typeof result.data : 'undefined',
        dataKeys: result.data ? Object.keys(result.data) : 'none',
        error: result.error,
      });

      if (result.success) {
        // Prompt generated successfully
        console.log('[useOracleMcpClient] === RESULT DATA ===');
        console.log('[useOracleMcpClient] Prompt length:', result.data?.prompt?.length || 0);
        console.log('[useOracleMcpClient] Prompt preview (first 100 chars):', result.data?.prompt?.slice(0, 100) + '...');

        // Return the prompt text from result.data
        return result.data.prompt;
      } else {
        // IPC handler returned an error
        console.error('[useOracleMcpClient] IPC returned error:', result.error);
        setError(createIpcError(result.error));
        throw new Error(result.error.message);
      }
    } catch (err) {
      // Network or unexpected error
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[useOracleMcpClient] Exception caught:', error);
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
      console.log('[useOracleMcpClient] generatePrompt completed, isGenerating:', false);
    }
  }, []);

  return {
    generatePrompt,
    isGenerating,
    error,
  };
}
