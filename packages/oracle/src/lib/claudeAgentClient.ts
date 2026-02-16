/**
 * Claude Agent Client Wrapper
 *
 * Wrapper for Claude Agent SDK with NSD prompt generation capabilities.
 * Provides a simple interface for generating RPG Maker MZ scene prompts from NSD content.
 *
 * @see docs/releases/v2/PRD_NSD_Generator_v2.md
 * @see docs/releases/v2/HLD_NSD_Generator_v2.md
 */

import { loadClaudeSettings, type ClaudeAuthConfig } from './auth.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GeneratePromptOptions - Input parameters for NSD prompt generation.
 *
 * - nsdContent: The full NSD document content in markdown format
 * - sceneName: Name of scene to generate a prompt for
 * - projectPath: Path to RPG Maker MZ project
 * - questVariable: Optional quest variable identifier for scene
 * - model: Optional model override for testing (glm-4.7, glm-4.5-air, glm-4-flash)
 */
export interface GeneratePromptOptions {
  nsdContent: string;
  sceneName: string;
  projectPath: string;
  questVariable?: string;
  model?: string;
}

/**
 * GeneratePromptSchema - Zod schema for input validation.
 *
 * Validates parameters required for NSD prompt generation:
 * - nsdContent: The full NSD document content in markdown format
 * - sceneName: Name of scene to generate a prompt for
 * - projectPath: Path to RPG Maker MZ project
 * - questVariable: Optional quest variable identifier for scene
 */
export const GeneratePromptSchema = z.object({
  nsdContent: z
    .string({
      required_error: 'nsdContent is required',
      invalid_type_error: 'nsdContent must be a string',
    })
    .min(1, 'nsdContent cannot be empty')
    .max(1024 * 1024, 'nsdContent cannot exceed 1MB'), // 1MB limit from HLD
  sceneName: z
    .string({
      required_error: 'sceneName is required',
      invalid_type_error: 'sceneName must be a string',
    })
    .min(1, 'sceneName cannot be empty')
    .max(200, 'sceneName cannot exceed 200 characters'),
  projectPath: z
    .string({
      required_error: 'projectPath is required',
      invalid_type_error: 'projectPath must be a string',
    })
    .min(1, 'projectPath cannot be empty')
    .refine(
      (path) => !path.includes('..'),
      'projectPath must not contain path traversal sequences (..)'
    ),
  questVariable: z
    .string({
      invalid_type_error: 'questVariable must be a string',
    })
    .optional(),
});

/**
 * Type inference from GeneratePromptSchema.
 * Ensures TypeScript types stay in sync with Zod validation.
 */
export type GeneratePromptInput = z.infer<typeof GeneratePromptSchema>;

/**
 * SceneData represents a single extracted scene from NSD.
 *
 * - title: Scene heading/title
 * - content: Full scene content including beats and descriptions
 * - summary: Optional brief summary of the scene
 */
export interface SceneData {
  title: string;
  content: string;
  summary?: string;
}

/**
 * ExtractScenesResult represents the response from scene extraction.
 *
 * - scenes: Array of extracted scenes
 * - totalScenes: Total number of scenes found
 */
export interface ExtractScenesResult {
  scenes: SceneData[];
  totalScenes: number;
}

/**
 * ExtractScenesOptions - Input parameters for NSD scene extraction.
 *
 * - nsdContent: The full NSD document content in markdown format
 * - model: Optional model override for testing (glm-4.7, glm-4.5-air, glm-4-flash)
 */
export interface ExtractScenesOptions {
  nsdContent: string;
  model?: string;
}

/**
 * ExtractScenesSchema - Zod schema for scene extraction validation.
 *
 * Validates parameters required for NSD scene extraction:
 * - nsdContent: The full NSD document content in markdown format
 * - model: Optional model override for testing (glm-4.7, glm-4.5-air, glm-4-flash)
 */
export const ExtractScenesSchema = z.object({
  nsdContent: z
    .string({
      required_error: 'nsdContent is required',
      invalid_type_error: 'nsdContent must be a string',
    })
    .min(1, 'nsdContent cannot be empty')
    .max(2 * 1024 * 1024, 'nsdContent cannot exceed 2MB'), // 2MB limit for scene extraction
  model: z.string().optional(),
});

/**
 * Type inference from ExtractScenesSchema.
 */
export type ExtractScenesInput = z.infer<typeof ExtractScenesSchema>;

/**
 * AnalyzeProjectOptions - Input parameters for project analysis.
 *
 * - nsdContent: Optional NSD document content for context
 * - sceneName: Optional scene name for context
 * - projectPath: Path to RPG Maker MZ project
 * - questVariable: Optional quest variable for detection verification
 */
export interface AnalyzeProjectOptions {
  nsdContent?: string;
  sceneName?: string;
  projectPath: string;
  questVariable?: string;
}

/**
 * AnalyzeProjectSchema - Zod schema for project analysis validation.
 *
 * Validates parameters required for MZ project analysis:
 * - projectPath: Path to RPG Maker MZ project
 * - nsdContent: Optional NSD document content
 * - sceneName: Optional scene name
 * - questVariable: Optional quest variable identifier
 */
export const AnalyzeProjectSchema = z.object({
  nsdContent: z.string().optional(),
  sceneName: z.string().optional(),
  projectPath: z
    .string({
      required_error: 'projectPath is required',
      invalid_type_error: 'projectPath must be a string',
    })
    .min(1, 'projectPath cannot be empty')
    .refine(
      (path) => !path.includes('..'),
      'projectPath must not contain path traversal sequences (..)'
    ),
  questVariable: z.string().optional(),
});

/**
 * Type inference from AnalyzeProjectSchema.
 */
export type AnalyzeProjectInput = z.infer<typeof AnalyzeProjectSchema>;

/**
 * QuestVariable represents a detected quest variable from CommonEvents.
 *
 * - variableId: Variable ID in System.json
 * - name: Variable name
 * - type: Quest variable type (progress, state, status)
 * - scope: Scope of the quest variable (global, local)
 */
export interface QuestVariable {
  variableId: number;
  name: string;
  type: 'progress' | 'state' | 'status' | 'unknown';
  scope: 'global' | 'local';
}

/**
 * AvailableResources represents the project's resource inventory.
 *
 * - sprites: Character sprite files
 * - pictures: Picture files
 * - bgm: Background music files
 * - me: Music effects files
 * - se: Sound effects files
 * - battlebacks: Battle background files
 */
export interface AvailableResources {
  sprites: string[];
  pictures: string[];
  bgm: string[];
  me: string[];
  se: string[];
  battlebacks: string[];
}

/**
 * AnalyzeProjectResult represents the project analysis response.
 *
 * - projectPath: Path to the analyzed project
 * - analyzedAt: ISO timestamp of analysis
 * - questVariables: Detected quest variables from CommonEvents
 * - mapCount: Total number of maps in the project
 * - troopCount: Total number of troops in the project
 * - availableResources: Resource inventory
 * - recommendedQuestVariable: Recommended quest variable based on detection
 * - recommendedMapId: Recommended map ID for scene implementation
 * - warnings: List of warnings (low confidence detections, missing files, etc.)
 * - markdown: Human-readable markdown report
 */
export interface AnalyzeProjectResult {
  projectPath: string;
  analyzedAt: string;
  questVariables: QuestVariable[];
  mapCount: number;
  troopCount: number;
  availableResources: AvailableResources;
  recommendedQuestVariable?: QuestVariable;
  recommendedMapId?: number;
  warnings: string[];
  markdown: string;
}

/**
 * CommonEventData represents a single Common Event from CommonEvents.json.
 *
 * - id: Unique Common Event ID (1-based)
 * - name: Common Event name
 * - trigger: Trigger condition (0=none, 1=autorun, 2=parallel, 3=call)
 * - switchId: Switch ID for trigger condition
 * - list: Event command list
 */
export interface CommonEventData {
  id: number;
  name: string;
  trigger: number;
  switchId: number;
  list: unknown[];
}

/**
 * MapInfoData represents a single map info from MapInfos.json.
 *
 * - id: Unique Map ID (1-based)
 * - name: Map display name
 * - parentId: Parent map ID (0 for none)
 * - order: Display order in editor
 * - expanded: Expanded state in editor
 * - scrollX: Scroll X position
 * - scrollY: Scroll Y position
 */
export interface MapInfoData {
  id: number;
  name: string;
  parentId: number;
  order: number;
  expanded: boolean;
  scrollX: number;
  scrollY: number;
}

/**
 * HealthCheckResult represents the health check response.
 *
 * - healthy: true if the Claude Agent SDK connection is valid
 * - message: Status message or error details
 * - timestamp: ISO timestamp of the health check
 */
export interface HealthCheckResult {
  healthy: boolean;
  message: string;
  timestamp: string;
}

/**
 * ClaudeAgentClient provides NSD prompt generation using Claude Agent SDK.
 *
 * This class wraps the Claude Agent SDK to provide:
 * - NSD prompt generation for RPG Maker MZ scenes
 * - Input validation using Zod schemas
 * - Health check for connection validation
 * - Logging for debugging and observability
 *
 * @example
 * ```typescript
 * const client = new ClaudeAgentClient(logger);
 * const result = await client.generateNsdPrompt({
 *   nsdContent: '# NSD Content...',
 *   sceneName: 'Cena 1: Entrada na Taverna',
 *   projectPath: '/path/to/mz/project',
 *   questVariable: 'Quest 01 Progress'
 * });
 * ```
 */
export class ClaudeAgentClient {
  private authConfig: ClaudeAuthConfig | null = null;
  private initialized = false;

  /**
   * Initializes the Claude Agent Client with authentication settings.
   *
   * Loads authentication configuration from Claude settings files
   * and prepares the client for API calls.
   *
   * @throws {Error} When Claude settings cannot be loaded
   */
  async init(): Promise<void> {
    this.authConfig = await loadClaudeSettings();
    this.initialized = true;

    if (!this.authConfig) {
      throw new Error('Claude client not initialized');
    }
  }

  /**
   * Generates a technical prompt for implementing an NSD scene in RPG Maker MZ.
   *
   * This method validates input, constructs the prompt with NSD context,
   * and calls the Claude Agent SDK to generate the technical prompt.
   *
   * @param options - Input parameters for prompt generation
   * @returns Promise resolving to the generated prompt text
   * @throws {Error} When input validation fails or generation errors occur
   *
   * @example
   * ```typescript
   * const result = await client.generateNsdPrompt({
   *   nsdContent: nsdFileContent,
   *   sceneName: 'Cena 1',
   *   projectPath: '/project/path',
   *   questVariable: 'Quest 01 Progress'
   * });
   * console.log(result);
   * ```
   */
  async generateNsdPrompt(options: GeneratePromptOptions): Promise<string> {
    // Validate input using Zod schema (without model field for base validation)
    const { model: modelOverride, ...baseOptions } = options;
    const validatedInput = GeneratePromptSchema.parse(baseOptions);

    if (!this.initialized) {
      await this.init();
    }

    if (!this.authConfig) {
      throw new Error('Claude client not initialized');
    }

    // Use custom model if provided, otherwise use default from config
    const model = modelOverride || this.authConfig.model;

    const systemPrompt = this.buildSystemPrompt(validatedInput);
    const userPrompt = this.buildUserPrompt(validatedInput);

    console.error('[generateNsdPrompt] Calling Z.ai Anthropic-compatible API...', {
      model,
      baseUrl: this.authConfig.baseUrl,
      sceneName: validatedInput.sceneName,
      nsdContentLength: validatedInput.nsdContent.length,
      modelOverride: modelOverride || 'none',
    });

    // Z.ai Anthropic-compatible endpoint: /api/anthropic/v1/messages
    // Documentation: https://docs.z.ai/scenario-example/develop-tools/claude
    const apiUrl = new URL('/api/anthropic/v1/messages', this.authConfig.baseUrl);

    const requestBody = {
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    };

    console.error('[generateNsdPrompt] Request payload:', {
      endpoint: apiUrl.toString(),
      model,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
    });

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for scene extraction

    let response: Response;
    try {
      response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.authConfig.authToken,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[generateNsdPrompt] ✗ Request timeout after 90 seconds');
        throw new Error('Request timeout after 90 seconds - Z.ai API did not respond');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generateNsdPrompt] ✗ API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`Z.ai API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Anthropic format: { content: [{ type: 'text', text: '...' }] }
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('[generateNsdPrompt] ✗ Invalid response structure:', data);
      throw new Error('Invalid API response: missing content array');
    }

    // Extract text from the first content block
    const textBlock = data.content.find((block: unknown) => {
      return typeof block === 'object' && block !== null && 'type' in block && block.type === 'text';
    });

    if (!textBlock || typeof textBlock.text !== 'string') {
      console.error('[generateNsdPrompt] ✗ No text block found in response');
      throw new Error('Invalid API response: missing text content');
    }

    const prompt = textBlock.text;
    console.error('[generateNsdPrompt] ✓ Prompt generated successfully', {
      responseLength: prompt.length,
      preview: prompt.slice(0, 200) + '...',
    });

    return prompt;
  }

  /**
   * Extracts narrative scenes from NSD markdown content using Claude AI.
   *
   * This method validates input, constructs the extraction prompt,
   * and calls Claude to identify and extract scenes from the NSD.
   *
   * Implements retry logic (up to 3 attempts) if JSON response is invalid.
   *
   * @param options - Input parameters for scene extraction
   * @returns Promise resolving to extracted scenes result
   * @throws {Error} When input validation fails or extraction errors occur
   *
   * @example
   * ```typescript
   * const result = await client.extractScenes({
   *   nsdContent: nsdFileContent
   * });
   * console.log(`Found ${result.totalScenes} scenes`);
   * result.scenes.forEach(scene => console.log(scene.title));
   * ```
   */
  async extractScenes(options: ExtractScenesOptions): Promise<ExtractScenesResult> {
    // Validate input using Zod schema (without model field for base validation)
    const { model: modelOverride, ...baseOptions } = options;
    ExtractScenesSchema.parse(baseOptions);

    if (!this.initialized) {
      await this.init();
    }

    if (!this.authConfig) {
      throw new Error('Claude client not initialized');
    }

    // Use custom model if provided, otherwise use default from config
    const model = modelOverride || this.authConfig.model;

    console.error('[extractScenes] Starting extraction with model:', {
      model,
      modelOverride: modelOverride || 'none',
      contentLength: options.nsdContent.length,
      baseUrl: this.authConfig.baseUrl,
    });

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.error(`[extractScenes] Attempt ${attempt}/${maxRetries}`);

        const result = await this.callClaudeForExtraction(options.nsdContent, model);

        // Validate response structure
        if (!result || !result.scenes || !Array.isArray(result.scenes)) {
          throw new Error('Invalid response structure: missing or invalid scenes array');
        }

        if (result.scenes.length === 0) {
          throw new Error('No scenes found in response');
        }

        // Validate each scene has required fields
        for (const scene of result.scenes) {
          if (!scene.title || !scene.content) {
            throw new Error('Invalid scene: missing title or content');
          }
        }

        console.error(`[extractScenes] ✓ Success: ${result.scenes.length} scenes extracted`);
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[extractScenes] ✗ Attempt ${attempt} failed:`, lastError.message);

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff: 1s, 2s, 4s)
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          console.error(`[extractScenes] Retrying in ${delayMs}ms...`);
          await this.sleep(delayMs);
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to extract scenes after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Calls Claude API to extract scenes from NSD content.
   *
   * Uses Anthropic-compatible endpoint (/api/anthropic/v1/messages) like generateNsdPrompt.
   *
   * @param nsdContent - NSD markdown content
   * @param model - Model to use for extraction (e.g., glm-4.5-air, glm-4.7)
   * @returns Promise resolving to extracted scenes result
   * @throws {Error} When API call fails or returns invalid response
   */
  private async callClaudeForExtraction(nsdContent: string, model: string): Promise<ExtractScenesResult> {
    if (!this.authConfig) {
      throw new Error('Claude client not initialized');
    }

    const systemPrompt = this.buildSceneExtractionSystemPrompt();
    const userPrompt = this.buildSceneExtractionUserPrompt(nsdContent);

    // Use Anthropic-compatible endpoint (same as generateNsdPrompt)
    // Z.ai endpoint: /api/anthropic/v1/messages
    const apiUrl = new URL('/api/anthropic/v1/messages', this.authConfig.baseUrl);

    const requestBody = {
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    };

    console.error('[extractScenes] Calling Z.ai Anthropic-compatible API...', {
      endpoint: apiUrl.toString(),
      model,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      contentLength: nsdContent.length,
    });

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout for scene extraction

    let response: Response;
    try {
      response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.authConfig.authToken,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[extractScenes] ✗ Request timeout after 90 seconds');
        throw new Error('Request timeout after 90 seconds - Z.ai API did not respond');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[extractScenes] ✗ API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`Z.ai API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    // Anthropic format: { content: [{ type: 'text', text: '...' }] }
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('[extractScenes] ✗ Invalid response structure:', data);
      throw new Error('Invalid API response: missing content array');
    }

    // Extract text from the first content block
    const textBlock = data.content.find((block: unknown) => {
      return typeof block === 'object' && block !== null && 'type' in block && block.type === 'text';
    });

    if (!textBlock || typeof textBlock.text !== 'string') {
      console.error('[extractScenes] ✗ No text block found in response');
      throw new Error('Invalid API response: missing text content');
    }

    const textContent = textBlock.text;
    console.error('[extractScenes] ✓ Raw response received:', {
      length: textContent.length,
      preview: textContent.slice(0, 100) + '...',
    });

    // Parse JSON response
    let parsedResponse: ExtractScenesResult;
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedJson = textContent.trim();

      // Remove ```json and ``` markers if present
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.slice(7);
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.slice(3);
      }

      if (cleanedJson.endsWith('```')) {
        cleanedJson = cleanedJson.slice(0, -3);
      }

      cleanedJson = cleanedJson.trim();

      console.error('[extractScenes] Cleaned JSON preview:', cleanedJson.slice(0, 200));

      parsedResponse = JSON.parse(cleanedJson);

      // Validate parsed response structure
      if (!parsedResponse.scenes || !Array.isArray(parsedResponse.scenes)) {
        throw new Error('Invalid JSON structure: missing scenes array');
      }

      console.error('[extractScenes] ✓ JSON parsed successfully:', {
        totalScenes: parsedResponse.scenes.length,
        sceneTitles: parsedResponse.scenes.map((s: SceneData) => s.title),
      });

    } catch (parseError) {
      console.error('[extractScenes] ✗ JSON parse error:', parseError);
      throw new Error(
        `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
    }

    return parsedResponse;
  }

  /**
   * Builds system prompt for scene extraction.
   *
   * Forces JSON output format with strict schema validation.
   */
  private buildSceneExtractionSystemPrompt(): string {
    return `Você é um especialista em analisar documentos NSD (Narrative Scene Document) do Coreto e extrair cenas narrativas.

## Sua Tarefa

Analise o documento NSD fornecido e extraia TODAS as cenas narrativas presentes.

## Formato de Resposta OBRIGATÓRIO

Você deve responder APENAS com um JSON válido, sem nenhum texto adicional. O JSON deve seguir exatamente esta estrutura:

\`\`\`json
{
  "scenes": [
    {
      "title": "Cena 1 – Título da Cena",
      "content": "Conteúdo completo da cena incluindo todos os beats, diálogos e descrições",
      "summary": "Resumo breve e opcional da cena"
    }
  ],
  "totalScenes": 1
}
\`\`\`

## Regras de Extração

1. **Identificação de Cenas**: Procure por cabeçalhos de nível 4 (####) que seguem o padrão "#### Cena N – Título"
2. **Conteúdo da Cena**: Inclua todo o conteúdo desde o cabeçho da cena até o próximo cabeçalho de cena ou fim do documento
3. **Título**: Use exatamente o texto do cabeçalho (ex: "Cena 1 – Pesadelo Premonitório")
4. **Sumário**: Crie um resumo conciso (máximo 100 caracteres) capturando a essência da cena
5. **Numeração**: O campo "totalScenes" deve refletir o número total de cenas encontradas

## Formato NSD Coreto

Cenas são definidas com cabeçalhos nível 4:
- #### Cena 1 – Título da Cena
- #### Cena 2 – Outro Título
- etc.

## CRÍTICO

- Responda APENAS com JSON válido
- Não inclua texto fora do JSON
- Se o NSD não tiver cenas, retorne: {"scenes":[],"totalScenes":0}
- O JSON deve ser parseável por JSON.parse()`;
  }

  /**
   * Builds user prompt for scene extraction.
   *
   * @param nsdContent - NSD markdown content
   * @returns User prompt string
   */
  private buildSceneExtractionUserPrompt(nsdContent: string): string {
    return `## Documento NSD

${nsdContent}

Extraia todas as cenas narrativas deste documento NSD seguindo o formato JSON especificado no system prompt. Lembre-se: responda APENAS com o JSON, sem nenhum texto adicional.`;
  }

  /**
   * Sleep utility for retry delays.
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Analyzes an RPG Maker MZ project structure and resources.
   *
   * This method performs read-only analysis of the project:
   * - Validates projectPath exists
   * - Reads data/System.json for switches and variables
   * - Reads data/CommonEvents.json for quest variable detection
   * - Reads data/MapInfos.json for map count
   * - Reads data/Troops.json for troop count
   * - Lists resources: img/characters/, img/pictures/, audio/bgm/, audio/me/, audio/se/
   * - Generates structured JSON + Markdown report
   *
   * @param options - Input parameters for project analysis
   * @returns Promise resolving to analysis result with JSON and Markdown
   * @throws {Error} When project path is invalid or files cannot be read
   *
   * @example
   * ```typescript
   * const result = await client.analyzeProject({
   *   projectPath: '/path/to/mz/project'
   * });
   * console.log(`Found ${result.mapCount} maps`);
   * console.log(result.markdown);
   * ```
   */
  async analyzeProject(options: AnalyzeProjectOptions): Promise<AnalyzeProjectResult> {
    // Validate input using Zod schema
    const validatedInput = AnalyzeProjectSchema.parse(options);

    console.error('[analyzeProject] Starting analysis...', {
      projectPath: validatedInput.projectPath,
      hasNsdContent: !!validatedInput.nsdContent,
      hasSceneName: !!validatedInput.sceneName,
      hasQuestVariable: !!validatedInput.questVariable,
    });

    const warnings: string[] = [];
    const dataPath = (path: string) => `${validatedInput.projectPath}/data/${path}`;

    // Validate project path exists
    try {
      const fs = await import('fs');
      const path = await import('path');
      if (!fs.existsSync(validatedInput.projectPath)) {
        throw new Error(`Project path does not exist: ${validatedInput.projectPath}`);
      }

      const projectDataPath = path.join(validatedInput.projectPath, 'data');
      if (!fs.existsSync(projectDataPath)) {
        throw new Error(`Project data directory does not exist: ${projectDataPath}`);
      }

      console.error('[analyzeProject] Project path validated');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[analyzeProject] ✗ Project validation failed:', message);
      throw new Error(`Project validation failed: ${message}`);
    }

    // Read System.json for switches and variables
    let systemData: { switches?: string[]; variables?: string[]; gameTitle?: string; versionId?: number } = {};
    try {
      const fs = await import('fs');
      const systemJsonPath = dataPath('System.json');
      const systemContent = fs.readFileSync(systemJsonPath, 'utf-8');
      systemData = JSON.parse(systemContent);
      console.error('[analyzeProject] ✓ System.json loaded', {
        switchesCount: systemData.switches?.length || 0,
        variablesCount: systemData.variables?.length || 0,
        gameTitle: systemData.gameTitle || 'Unknown',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Failed to read System.json: ${message}`);
      console.error('[analyzeProject] ✗ System.json error:', message);
    }

    // Read CommonEvents.json for quest variable detection
    let commonEvents: CommonEventData[] = [];
    try {
      const fs = await import('fs');
      const commonEventsPath = dataPath('CommonEvents.json');
      const commonEventsContent = fs.readFileSync(commonEventsPath, 'utf-8');
      const parsed = JSON.parse(commonEventsContent);
      commonEvents = parsed.filter((item: unknown) => item !== null);
      console.error('[analyzeProject] ✓ CommonEvents.json loaded', {
        count: commonEvents.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Failed to read CommonEvents.json: ${message}`);
      console.error('[analyzeProject] ✗ CommonEvents.json error:', message);
    }

    // Read MapInfos.json for map count
    let mapCount = 0;
    let mapInfos: MapInfoData[] = [];
    try {
      const fs = await import('fs');
      const mapInfosPath = dataPath('MapInfos.json');
      const mapInfosContent = fs.readFileSync(mapInfosPath, 'utf-8');
      const parsed = JSON.parse(mapInfosContent);
      mapInfos = parsed.filter((item: unknown) => item !== null);
      mapCount = mapInfos.length;
      console.error('[analyzeProject] ✓ MapInfos.json loaded', {
        mapCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Failed to read MapInfos.json: ${message}`);
      console.error('[analyzeProject] ✗ MapInfos.json error:', message);
    }

    // Read Troops.json for troop count
    let troopCount = 0;
    try {
      const fs = await import('fs');
      const troopsPath = dataPath('Troops.json');
      const troopsContent = fs.readFileSync(troopsPath, 'utf-8');
      const parsed = JSON.parse(troopsContent);
      const troops = parsed.filter((item: unknown) => item !== null);
      troopCount = troops.length;
      console.error('[analyzeProject] ✓ Troops.json loaded', {
        troopCount,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Failed to read Troops.json: ${message}`);
      console.error('[analyzeProject] ✗ Troops.json error:', message);
    }

    // Detect quest variables from CommonEvents
    const questVariables = this.detectQuestVariables(
      commonEvents,
      systemData.variables || [],
      warnings
    );

    console.error('[analyzeProject] Quest variable detection', {
      detectedCount: questVariables.length,
      questVariables: questVariables.map(v => ({ id: v.variableId, name: v.name, type: v.type })),
    });

    // List available resources
    const availableResources = this.listAvailableResources(validatedInput.projectPath, warnings);

    console.error('[analyzeProject] Resource inventory', {
      sprites: availableResources.sprites.length,
      pictures: availableResources.pictures.length,
      bgm: availableResources.bgm.length,
      me: availableResources.me.length,
      se: availableResources.se.length,
      battlebacks: availableResources.battlebacks.length,
    });

    // Determine recommended quest variable
    let recommendedQuestVariable: QuestVariable | undefined;
    if (validatedInput.questVariable) {
      // User provided a specific quest variable
      const matchedVariable = questVariables.find(
        v => v.name.toLowerCase().includes(validatedInput.questVariable!.toLowerCase())
      );
      if (matchedVariable) {
        recommendedQuestVariable = matchedVariable;
      } else {
        warnings.push(`Specified quest variable "${validatedInput.questVariable}" not found in detected variables`);
      }
    } else if (questVariables.length > 0) {
      // Auto-select first progress variable
      recommendedQuestVariable = questVariables.find(v => v.type === 'progress') || questVariables[0];
    }

    // Determine recommended map ID (use first available map)
    let recommendedMapId: number | undefined;
    if (mapInfos.length > 0) {
      // Use the first map as default
      recommendedMapId = mapInfos[0]?.id;
    }

    // Generate markdown report
    const nsdContext: { hasNsdContent: boolean; sceneName?: string } = {
      hasNsdContent: !!validatedInput.nsdContent,
    };
    if (validatedInput.sceneName) {
      nsdContext.sceneName = validatedInput.sceneName;
    }

    // Build markdown generation parameters
    const markdownParams: {
      projectPath: string;
      gameTitle: string;
      analyzedAt: string;
      questVariables: QuestVariable[];
      mapCount: number;
      troopCount: number;
      availableResources: AvailableResources;
      warnings: string[];
      nsdContext: { hasNsdContent: boolean; sceneName?: string };
      recommendedQuestVariable?: QuestVariable;
      recommendedMapId?: number;
    } = {
      projectPath: validatedInput.projectPath,
      gameTitle: systemData.gameTitle || 'Unknown',
      analyzedAt: new Date().toISOString(),
      questVariables,
      mapCount,
      troopCount,
      availableResources,
      warnings,
      nsdContext,
    };

    // Add optional fields if present
    if (recommendedQuestVariable) {
      markdownParams.recommendedQuestVariable = recommendedQuestVariable;
    }
    if (recommendedMapId) {
      markdownParams.recommendedMapId = recommendedMapId;
    }

    const markdown = this.generateAnalysisMarkdown(markdownParams);

    const result: AnalyzeProjectResult = {
      projectPath: validatedInput.projectPath,
      analyzedAt: new Date().toISOString(),
      questVariables,
      mapCount,
      troopCount,
      availableResources,
      warnings,
      markdown,
    };

    // Only add optional fields if they have values
    if (recommendedQuestVariable) {
      result.recommendedQuestVariable = recommendedQuestVariable;
    }
    if (recommendedMapId) {
      result.recommendedMapId = recommendedMapId;
    }

    console.error('[analyzeProject] ✓ Analysis complete', {
      questVariablesCount: questVariables.length,
      warningsCount: warnings.length,
      markdownLength: markdown.length,
    });

    return result;
  }

  /**
   * Detects quest variables from CommonEvents by name pattern matching.
   *
   * Searches for patterns like "Quest XX Progress/State/Status" in CommonEvent names
   * and correlates with variable names from System.json.
   *
   * @param commonEvents - Array of CommonEvent data
   * @param variableNames - Array of variable names from System.json
   * @param warnings - Array to collect low confidence warnings
   * @returns Array of detected quest variables
   */
  private detectQuestVariables(
    commonEvents: CommonEventData[],
    variableNames: string[],
    warnings: string[]
  ): QuestVariable[] {
    const questVariables: QuestVariable[] = [];
    const questPatterns = [
      /quest\s*\d+/i,
      /quest\s*\w+/i,
      /misssão\s*\d+/i,
      /mission\s*\d+/i,
    ];

    // Find CommonEvents with "quest" in name
    const questCommonEvents = commonEvents.filter(ce =>
      questPatterns.some(pattern => pattern.test(ce.name))
    );

    console.error('[detectQuestVariables] CommonEvents with quest patterns:', {
      totalCommonEvents: commonEvents.length,
      questCommonEvents: questCommonEvents.length,
      names: questCommonEvents.map(ce => ce.name),
    });

    // Extract variable references from CommonEvent commands
    const variableIds = new Set<number>();
    for (const ce of questCommonEvents) {
      // Look for variable references in event commands
      // Command code 122 = Control Variables
      for (const cmd of ce.list) {
        if (typeof cmd === 'object' && cmd !== null && 'code' in cmd) {
          const cmdObj = cmd as Record<string, unknown>;
          if (cmdObj.code === 122 && Array.isArray(cmdObj.parameters)) {
            // parameters[0] = start variable ID
            const varId = cmdObj.parameters[0];
            if (typeof varId === 'number' && varId > 0) {
              variableIds.add(varId);
            }
          }
        }
      }
    }

    // Create QuestVariable entries
    for (const varId of variableIds) {
      const varName = variableNames[varId] || `Variable ${varId}`;

      // Determine type based on name patterns
      let type: QuestVariable['type'] = 'unknown';
      if (/progress|progresso/i.test(varName)) {
        type = 'progress';
      } else if (/state|estado|status/i.test(varName)) {
        type = 'state';
      } else if (/status/i.test(varName)) {
        type = 'status';
      }

      questVariables.push({
        variableId: varId,
        name: varName,
        type,
        scope: 'global', // RMMZ variables are global by default
      });
    }

    // Check confidence level
    if (questCommonEvents.length > 0 && questVariables.length === 0) {
      warnings.push(
        `Found ${questCommonEvents.length} CommonEvents with quest-related names, but no quest variables were detected. ` +
        'Quest variable detection confidence: LOW (<90%). ' +
        'Candidates: ' + questCommonEvents.map(ce => ce.name).join(', ')
      );
    }

    return questVariables;
  }

  /**
   * Lists available resources in the MZ project.
   *
   * Scans resource directories for available assets.
   *
   * @param projectPath - Path to MZ project
   * @param warnings - Array to collect warnings
   * @returns AvailableResources object with file lists
   */
  private listAvailableResources(projectPath: string, warnings: string[]): AvailableResources {

    const resources: AvailableResources = {
      sprites: [],
      pictures: [],
      bgm: [],
      me: [],
      se: [],
      battlebacks: [],
    };

    const listFiles = (dir: string, targetArray: string[], resourceType: string) => {
      const fullPath = path.join(projectPath, dir);
      try {
        if (fs.existsSync(fullPath)) {
          const files = fs.readdirSync(fullPath);
          for (const file of files) {
            if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.ogg') || file.endsWith('.m4a')) {
              targetArray.push(file);
            }
          }
          console.error(`[listAvailableResources] ✓ ${resourceType}:`, { count: targetArray.length });
        } else {
          warnings.push(`Resource directory not found: ${dir}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`Failed to read ${dir}: ${message}`);
      }
    };

    listFiles('img/characters', resources.sprites, 'Sprites');
    listFiles('img/pictures', resources.pictures, 'Pictures');
    listFiles('audio/bgm', resources.bgm, 'BGM');
    listFiles('audio/me', resources.me, 'ME');
    listFiles('audio/se', resources.se, 'SE');
    listFiles('img/battlebacks1', resources.battlebacks, 'Battlebacks');

    return resources;
  }

  /**
   * Generates human-readable markdown analysis report.
   *
   * @param analysisData - All analysis data
   * @returns Formatted markdown report
   */
  private generateAnalysisMarkdown(analysisData: {
    projectPath: string;
    gameTitle: string;
    analyzedAt: string;
    questVariables: QuestVariable[];
    mapCount: number;
    troopCount: number;
    availableResources: AvailableResources;
    recommendedQuestVariable?: QuestVariable;
    recommendedMapId?: number;
    warnings: string[];
    nsdContext: { hasNsdContent: boolean; sceneName?: string };
  }): string {
    const lines: string[] = [];

    lines.push('# RPG Maker MZ Project Analysis');
    lines.push('');
    lines.push(`**Project:** ${analysisData.gameTitle}`);
    lines.push(`**Path:** \`${analysisData.projectPath}\``);
    lines.push(`**Analyzed:** ${new Date(analysisData.analyzedAt).toLocaleString('pt-BR')}`);
    lines.push('');

    // NSD Context
    if (analysisData.nsdContext.hasNsdContent) {
      lines.push('## NSD Context');
      lines.push('');
      if (analysisData.nsdContext.sceneName) {
        lines.push(`**Scene:** ${analysisData.nsdContext.sceneName}`);
      }
      lines.push('NSD document provided for context.');
      lines.push('');
    }

    // Quest Variables
    lines.push('## Quest Variables');
    lines.push('');
    if (analysisData.questVariables.length > 0) {
      lines.push('| Variable ID | Name | Type | Scope |');
      lines.push('|-------------|------|------|-------|');
      for (const qv of analysisData.questVariables) {
        lines.push(`| ${qv.variableId} | ${qv.name} | ${qv.type} | ${qv.scope} |`);
      }
      lines.push('');

      if (analysisData.recommendedQuestVariable) {
        lines.push(`**Recommended:** Variable ${analysisData.recommendedQuestVariable.variableId} (${analysisData.recommendedQuestVariable.name})`);
        lines.push('');
      }
    } else {
      lines.push('*No quest variables detected*');
      lines.push('');
    }

    // Maps and Troops
    lines.push('## Project Structure');
    lines.push('');
    lines.push(`- **Maps:** ${analysisData.mapCount}`);
    lines.push(`- **Troops:** ${analysisData.troopCount}`);
    if (analysisData.recommendedMapId) {
      lines.push(`- **Recommended Map ID:** ${analysisData.recommendedMapId}`);
    }
    lines.push('');

    // Resources
    lines.push('## Available Resources');
    lines.push('');
    lines.push('### Sprites (img/characters/)');
    lines.push('');
    lines.push(`Total: ${analysisData.availableResources.sprites.length}`);
    if (analysisData.availableResources.sprites.length > 0) {
      lines.push(analysisData.availableResources.sprites.slice(0, 10).join(', '));
      if (analysisData.availableResources.sprites.length > 10) {
        lines.push(`... and ${analysisData.availableResources.sprites.length - 10} more`);
      }
    }
    lines.push('');

    lines.push('### Pictures (img/pictures/)');
    lines.push('');
    lines.push(`Total: ${analysisData.availableResources.pictures.length}`);
    if (analysisData.availableResources.pictures.length > 0) {
      lines.push(analysisData.availableResources.pictures.slice(0, 10).join(', '));
      if (analysisData.availableResources.pictures.length > 10) {
        lines.push(`... and ${analysisData.availableResources.pictures.length - 10} more`);
      }
    }
    lines.push('');

    lines.push('### Audio');
    lines.push('');
    lines.push(`- **BGM:** ${analysisData.availableResources.bgm.length} files`);
    lines.push(`- **ME:** ${analysisData.availableResources.me.length} files`);
    lines.push(`- **SE:** ${analysisData.availableResources.se.length} files`);
    lines.push('');

    // Warnings
    if (analysisData.warnings.length > 0) {
      lines.push('## Warnings');
      lines.push('');
      for (const warning of analysisData.warnings) {
        lines.push(`- ⚠️ ${warning}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Performs a health check on the Claude Agent SDK connection.
   *
   * This method validates that the SDK can be initialized and
   * is ready to process requests.
   *
   * @returns Promise resolving to health check result
   *
   * @example
   * ```typescript
   * const health = await client.healthCheck();
   * if (health.healthy) {
   *   console.log('Client is ready');
   * }
   * ```
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      // Initialize client if not already initialized
      if (!this.initialized) {
        await this.init();
      }

      if (!this.authConfig) {
        return {
          healthy: false,
          message: 'Claude client not initialized - auth config missing',
          timestamp: new Date().toISOString(),
        };
      }

      // Test API connectivity with a minimal request
      const apiUrl = new URL('/api/anthropic/v1/messages', this.authConfig.baseUrl);

      console.error('[healthCheck] Testing Z.ai API connectivity...', {
        baseUrl: this.authConfig.baseUrl,
        model: this.authConfig.model,
      });

      const response = await fetch(apiUrl.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.authConfig.authToken,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.authConfig.model,
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'OK',
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[healthCheck] ✗ API health check failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        return {
          healthy: false,
          message: `API health check failed: ${response.status} ${response.statusText}`,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();

      if (data.content && Array.isArray(data.content) && data.content.length > 0) {
        console.error('[healthCheck] ✓ API is healthy and responsive');
        return {
          healthy: true,
          message: `Claude Agent SDK connection OK (model: ${this.authConfig.model})`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        healthy: false,
        message: 'API returned unexpected response structure',
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[healthCheck] ✗ Health check error:', errorMessage);
      return {
        healthy: false,
        message: `Health check error: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Builds the system prompt for NSD scene generation (Portuguese).
   *
   * Designed for RPG Maker MZ scene generation from NSD documents.
   * Focuses on Event commands and Common Events implementation.
   */
  private buildSystemPrompt(options: GeneratePromptInput): string {
    const questVar = options.questVariable || 'a ser detectado automaticamente';
    return `Você é um especialista técnico em RPG Maker MZ, especializado em criar cenas jogáveis usando Event commands e Common Events.

Sua tarefa é analisar Narrative Structure Documents (NSD) e gerar prompts técnicos detalhados que permitam a implementação precisa de cenas no editor do RPG Maker MZ.

## Contexto
- RPG Maker MZ usa uma estrutura baseada em eventos (Event commands)
- Common Events são eventos globais que podem ser chamados de qualquer lugar
- Variáveis de Quest controlam o progresso e estado de quests (ex: "Quest 01 Progress")
- Cada mapa pode conter múltiplas cenas, controladas por variáveis diferentes

## Contexto do Projeto
- Projeto MZ localizado em: ${options.projectPath}
- Variável de controle da quest: ${questVar}

## Sua Responsabilidade
1. Analisar o NSD fornecido e extrair a estrutura da cena solicitada
2. Identificar beats, diálogos, eventos do sistema e requisitos de controle
3. Considerar o contexto do projeto MZ fornecido (mapas, database, recursos disponíveis)
4. Gerar um prompt técnico completo que instrua outra IA a criar os Event commands e Common Events necessários

## Formato da Resposta
Sua resposta deve ser um prompt técnico estruturado contendo:
- Resumo da cena e objetivo
- Lista de beats com detalhes de implementação
- Estrutura de Event commands necessários
- Common Events requeridas (se aplicável)
- Variáveis e switches utilizadas
- Recursos necessários (sprites, battlebacks, BGM, SE)
- Considerações especiais ou condicionais

## Importante
- O prompt gerado deve ser utilizável diretamente por outra IA para criar código funcional
- Mantenha precisão total com o NSD fornecido
- Considere as limitações técnicas do RPG Maker MZ
- Inclua verificações de erros e tratamentos de exceção quando necessário
- A resposta deve estar em português`;
  }

  /**
   * Constructs the user prompt for NSD scene generation.
   *
   * Combines the NSD content, scene name, and quest variable
   * into a structured prompt.
   *
   * @param input - Validated input parameters
   * @returns The constructed user prompt string
   */
  private buildUserPrompt(input: GeneratePromptInput): string {
    let prompt = `## Documento NSD\n\n${input.nsdContent}\n\n`;
    prompt += `## Cena Selecionada\n\n${input.sceneName}\n\n`;
    prompt += `Por favor, gere um prompt técnico detalhado para implementação da cena "${input.sceneName}" no RPG Maker MZ, `;
    prompt += 'considerando o NSD fornecido, o contexto do projeto e as instruções do system prompt.';

    return prompt;
  }
}
