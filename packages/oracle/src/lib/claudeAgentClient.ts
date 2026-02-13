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

/**
 * GeneratePromptOptions - Input parameters for NSD prompt generation.
 *
 * - nsdContent: The full NSD document content in markdown format
 * - sceneName: Name of scene to generate a prompt for
 * - projectPath: Path to RPG Maker MZ project
 * - questVariable: Optional quest variable identifier for scene
 */
export interface GeneratePromptOptions {
  nsdContent: string;
  sceneName: string;
  projectPath: string;
  questVariable?: string;
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
    console.error('[ClaudeAgentClient] init called - authConfig before load:', this.authConfig);
    console.error('[ClaudeAgentClient] init called - this.initialized before load:', this.initialized);

    this.authConfig = await loadClaudeSettings();

    console.error('[ClaudeAgentClient] init called - authConfig after load:', this.authConfig);
    console.error('[ClaudeAgentClient] init called - this.initialized after load:', this.initialized);

    // Mark as initialized after successfully loading auth config
    this.initialized = true;

    console.error('[ClaudeAgentClient] init called - this.initialized after set:', this.initialized);

    if (!this.initialized) {
      console.error(`[ClaudeAgentClient] ERROR: authConfig is null/undefined`);
      throw new Error('Claude client not initialized');
    }

    console.error('[ClaudeAgentClient] Client initialized successfully');
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
    console.error(`[ClaudeAgentClient] generateNsdPrompt called with: ${JSON.stringify({
      hasNsdContent: !!options.nsdContent,
      nsdContentLength: options.nsdContent?.length || 0,
      sceneName: options.sceneName,
      projectPath: options.projectPath,
      hasQuestVariable: !!options.questVariable
    })}`);

    // Validate input using Zod schema
    const validatedInput = GeneratePromptSchema.parse(options);
    console.error(`[ClaudeAgentClient] Input validated successfully`);

    if (!this.initialized) {
      console.error(`[ClaudeAgentClient] Initializing client...`);
      await this.init();
      console.error(`[ClaudeAgentClient] Client initialized`);
    }

    if (!this.authConfig) {
      console.error(`[ClaudeAgentClient] ERROR: authConfig is null/undefined`);
      throw new Error('Claude client not initialized');
    }

    console.error(`[ClaudeAgentClient] Building prompts...`);
    // TODO: Implement actual Claude Agent SDK call
    // For now, return a stub response
    const systemPrompt = this.buildSystemPrompt(validatedInput);
    const userPrompt = this.buildUserPrompt(validatedInput);

    const stubResponse = `STUB: Prompt generation not yet implemented.\n\nSystem: ${systemPrompt.slice(0, 100)}...\n\nUser: ${userPrompt}`;

    console.error(`[ClaudeAgentClient] Returning stub response, length: ${stubResponse.length}`);
    return stubResponse;
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
    // TODO: Implement health check after resolving SDK type issues
    return {
      healthy: false,
      message: 'Health check not yet implemented - SDK type compatibility issues',
      timestamp: new Date().toISOString(),
    };
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
