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
import type { AnalyzeProjectResponse } from '@coreto/electron/domain/types';

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

  /**
   * Optional model override for testing.
   * Uses 'glm-4.5-air' (faster/cheaper) for test button.
   * Default: uses configured model from settings.
   */
  model?: 'glm-4.7' | 'glm-4.5-air' | 'glm-4-flash';
}

/**
 * AnalyzeProjectParams
 *
 * Parameters for analyzing an RPG Maker MZ project.
 * Used by the oracle-mcp:analyze-project IPC handler.
 */
export interface AnalyzeProjectParams {
  /** The full NSD document content in markdown format */
  nsdContent: string;

  /** Name of scene to analyze */
  sceneName: string;

  /** Path to RPG Maker MZ project */
  projectPath: string;

  /** Optional quest variable identifier for targeted analysis */
  questVariable?: string;
}

/**
 * TestAnalyzeProjectParams
 *
 * Parameters for testing the project analyzer with a specific directory.
 * Used by the oracle-mcp:test-analyze-project IPC handler.
 */
export interface TestAnalyzeProjectParams {
  /** Directory path where test outputs will be saved */
  testDirectory: string;

  /** AI model to use for test analysis */
  model: 'glm-4.7' | 'glm-4.5-air' | 'glm-4-flash';
}

/**
 * _GeneratePromptResponse
 *
 * Response from the oracle-mcp:generate-prompt IPC handler.
 * Documented for reference only; prefixed with _ to indicate unused.
 *
 * @see packages/electron/src/main/ipc/handlers/oracleMcpIpcHandler.ts
 */
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
 * Provides state and callbacks for NSD prompt generation and project analysis.
 */
export interface UseOracleMcpClientResult {
  /**
   * Generates an NSD prompt using the Oracle MCP service.
   * @param params - Parameters for prompt generation
   * @returns Promise resolving to the generated prompt text
   */
  generatePrompt: (params: GenerateNsdPromptParams) => Promise<string>;

  /**
   * Analyzes an RPG Maker MZ project using the Oracle MCP service.
   * @param params - Parameters for project analysis
   * @returns Promise resolving to the project analysis response
   */
  analyzeProject: (params: AnalyzeProjectParams) => Promise<AnalyzeProjectResponse>;

  /**
   * Tests the project analyzer with a specific directory and model.
   * @param params - Parameters for test analysis
   * @returns Promise resolving to the test analysis response
   */
  testAnalyzeProject: (params: TestAnalyzeProjectParams) => Promise<{
    success: boolean;
    outputPath: string;
    files: {
      json: string;
      markdown: string;
    };
    timestamp: string;
  }>;

  /** Loading state for prompt generation */
  isGenerating: boolean;

  /** Loading state for project analysis */
  isAnalyzing: boolean;

  /** Loading state for test analysis */
  isTestAnalyzing: boolean;

  /** Error state if any operation failed */
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
 * and project analysis using the Oracle MCP service. Handles loading and error states automatically.
 *
 * @returns Hook result with generatePrompt, analyzeProject, loading states, and error
 *
 * @example
 * ```tsx
 * function NsdGenerator() {
 *   const { generatePrompt, analyzeProject, isGenerating, isAnalyzing, error } = useOracleMcpClient();
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
 *   const handleAnalyze = async () => {
 *     const analysis = await analyzeProject({
 *       nsdContent: '# NSD Content...',
 *       sceneName: 'Cena 1',
 *       projectPath: '/path/to/project',
 *     });
 *     console.log('Analysis:', analysis);
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleGenerate} disabled={isGenerating}>
 *         {isGenerating ? 'Generating...' : 'Generate Prompt'}
 *       </button>
 *       <button onClick={handleAnalyze} disabled={isAnalyzing}>
 *         {isAnalyzing ? 'Analyzing...' : 'Analyze Project'}
 *       </button>
 *     </>
 *   );
 * }
 * ```
 */
export function useOracleMcpClient(): UseOracleMcpClientResult {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTestAnalyzing, setIsTestAnalyzing] = useState(false);
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

    try {
      const result = await window.coreto.oracleMcp.generatePrompt(params);

      if (result.success) {
        return result.data.prompt;
      } else {
        setError(createIpcError(result.error));
        throw new Error(result.error.message);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Analyzes an RPG Maker MZ project using the Oracle MCP service.
   *
   * Invokes the oracle-mcp:analyze-project IPC handler with the provided
   * parameters and updates state accordingly.
   */
  const analyzeProject = useCallback(async (params: AnalyzeProjectParams): Promise<AnalyzeProjectResponse> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await window.coreto.oracleMcp.analyzeProject(params);

      if (result.success) {
        return result.data;
      } else {
        setError(createIpcError(result.error));
        throw new Error(result.error.message);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Tests the project analyzer with a specific directory and model.
   *
   * Invokes the oracle-mcp:test-analyze-project IPC handler with the provided
   * parameters and updates state accordingly.
   */
  const testAnalyzeProject = useCallback(async (params: TestAnalyzeProjectParams): Promise<{
    success: boolean;
    outputPath: string;
    files: {
      json: string;
      markdown: string;
    };
    timestamp: string;
  }> => {
    setIsTestAnalyzing(true);
    setError(null);

    try {
      const result = await window.coreto.oracleMcp.testAnalyzeProject(params);

      if (result.success) {
        return result.data;
      } else {
        setError(createIpcError(result.error));
        throw new Error(result.error.message);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsTestAnalyzing(false);
    }
  }, []);

  return {
    generatePrompt,
    analyzeProject,
    testAnalyzeProject,
    isGenerating,
    isAnalyzing,
    isTestAnalyzing,
    error,
  };
}
