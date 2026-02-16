/**
 * NSD Parser Service
 *
 * Service for parsing NSD (Narrative Scene Document) markdown content
 * and extracting scene data using AI integration via MCP client.
 *
 * Features:
 * - AI-only scene extraction using Oracle MCP server
 * - 30-second timeout for AI calls
 * - Progress callbacks during parsing stages
 * - Structured error handling with clear error codes
 * - Logging via ILogger (never console.log)
 *
 * **Note:** This implementation uses AI-only extraction. If AI parsing fails,
 * an error is thrown explicitly - there is no regex fallback.
 *
 * @see docs/planos/006-mcp-client-integration/tasks/11_task.md
 *
 * Error Codes:
 * - NSD_AI_TIMEOUT: AI service timeout (>30s)
 * - NSD_PARSE_ERROR: General parsing failure
 * - NSD_VALIDATION_ERROR: Invalid content
 *
 * Progress Stages:
 * - reading: 0-20%
 * - parsing: 20-60%
 * - extracting: 60-90%
 * - validating: 90-100%
 */

import { injectable } from 'tsyringe';
import type { ILogger } from '@coreto/core';
import { NSDScene } from '@coreto/electron/domain/entities/index.js';
import { McpClientService } from './McpClientService.js';

// =============================================================================
// Error Codes
// =============================================================================

/**
 * Error codes for NSD parsing operations.
 * Used for error categorization and user feedback.
 */
export const NSD_ERROR_CODES = {
  /** General parsing failure */
  PARSE_ERROR: 'NSD_PARSE_ERROR',
  /** AI service timeout */
  AI_TIMEOUT: 'NSD_AI_TIMEOUT',
  /** Invalid content validation error */
  VALIDATION_ERROR: 'NSD_VALIDATION_ERROR',
} as const;

/**
 * NSD parsing error code type.
 */
export type NSDErrorCode = typeof NSD_ERROR_CODES[keyof typeof NSD_ERROR_CODES];

// =============================================================================
// Progress Stages
// =============================================================================

/**
 * Progress stages for NSD parsing operations.
 * Each stage has an associated percentage range.
 */
export const NSD_PROGRESS_STAGES = {
  /** Reading file content: 0-20% */
  READING: 'reading',
  /** Parsing markdown structure: 20-60% */
  PARSING: 'parsing',
  /** Extracting scene data: 60-90% */
  EXTRACTING: 'extracting',
  /** Validating parsed content: 90-100% */
  VALIDATING: 'validating',
} as const;

/**
 * NSD progress stage type.
 */
export type NSDProgressStage = typeof NSD_PROGRESS_STAGES[keyof typeof NSD_PROGRESS_STAGES];

/**
 * Progress callback type for NSD parsing operations.
 *
 * @param stage - Current processing stage
 * @param percent - Completion percentage (0-100)
 */
export type NSDProgressCallback = (stage: NSDProgressStage, percent: number) => void;

// =============================================================================
// Custom Error Classes
// =============================================================================

/**
 * Custom error class for NSD parsing operations.
 * Provides structured error information with error codes.
 */
export class NSDParseError extends Error {
  /**
   * Machine-readable error code.
   */
  readonly code: NSDErrorCode;

  /**
   * Optional correlation ID for tracking.
   */
  readonly correlationId?: string;

  /**
   * Original error that caused this failure.
   */
  readonly originalError?: unknown;

  /**
   * Creates a new NSDParseError.
   *
   * @param message - Human-readable error message
   * @param code - Machine-readable error code
   * @param correlationId - Optional correlation ID
   * @param originalError - Original error that caused failure
   */
  constructor(
    message: string,
    code: NSDErrorCode,
    correlationId?: string,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'NSDParseError';
    this.code = code;
    this.correlationId = correlationId;
    this.originalError = originalError;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NSDParseError);
    }
  }
}

// =============================================================================
// Regex Parser Types
// =============================================================================

/**
 * Parsed scene from regex extraction.
 */
interface ParsedScene {
  /**
   * Scene title.
   */
  title: string;
  /**
   * Scene content.
   */
  content: string;
  /**
   * Optional scene summary.
   */
  summary?: string;
}

// =============================================================================
// NSD Parser Service
// =============================================================================

/**
 * Service for parsing NSD markdown documents and extracting scene data.
 *
 * This service:
 * - Coordinates AI-powered scene extraction via MCP client
 * - Provides regex-based fallback when AI parsing fails
 * - Handles progress callbacks during parsing stages
 * - Logs all operations via ILogger
 * - Provides structured error handling
 *
 * @example
 * ```typescript
 * const service = container.resolve<NsdParserService>(NsdParserService);
 * const scenes = await service.parseScenes(
 *   markdownContent,
 *   (stage, percent) => console.log(`${stage}: ${percent}%`),
 *   'correlation-123'
 * );
 * ```
 */
@injectable()
export class NsdParserService {
  /**
   * Logger instance.
   * Injected via DI container or passed directly (for worker context).
   */
  private readonly logger: ILogger;

  /**
   * MCP client service for AI integration.
   * Singleton instance for GLM AI calls.
   */
  private readonly mcpClient: McpClientService;

  /**
   * Timeout for AI calls in milliseconds (30 seconds).
   */
  private readonly AI_TIMEOUT_MS = 30_000;

  /**
   * Creates a new NsdParserService instance.
   *
   * Supports both DI injection and manual instantiation for worker contexts.
   *
   * @param logger - Logger instance (injected via DI or passed directly)
   */
  constructor(logger?: ILogger) {
    // Use provided logger or get from DI container
    if (logger) {
      this.logger = logger;
    } else {
      // Try to resolve from DI container
      try {
        const { getLogger } = require('../di/container.js');
        this.logger = getLogger();
      } catch {
        // Fallback to simple console-based logger if DI not available
        this.logger = {
          info: (message: string, meta?: Record<string, unknown>) => {
            console.log(`[INFO] ${message}`, meta || '');
          },
          warn: (message: string, meta?: Record<string, unknown>) => {
            console.warn(`[WARN] ${message}`, meta || '');
          },
          error: (message: string, meta?: Record<string, unknown>) => {
            console.error(`[ERROR] ${message}`, meta || '');
          },
          debug: (message: string, meta?: Record<string, unknown>) => {
            console.debug(`[DEBUG] ${message}`, meta || '');
          },
        };
      }
    }

    this.mcpClient = new McpClientService();
  }

  /**
   * Parses NSD document content and extracts scene data using AI only.
   *
   * This method orchestrates the complete NSD parsing flow:
   * 1. Validates input content (reading stage: 0-20%)
   * 2. Extracts scenes using AI via Oracle MCP (parsing stage: 20-60%)
   * 3. Reports extraction progress (extracting stage: 60-90%)
   * 4. Validates extracted scenes (validating stage: 90-100%)
   *
   * **Note:** This implementation uses AI-only extraction. If AI parsing fails,
   * an error is thrown explicitly - there is no regex fallback.
   *
   * @param content - NSD markdown content to parse
   * @param onProgress - Optional progress callback (stage, percent) => void
   * @param correlationId - Optional correlation ID for tracking
   * @returns Promise resolving to array of NSDScene entities
   * @throws {NSDParseError} With appropriate error code if parsing fails
   *
   * @example
   * ```typescript
   * const scenes = await service.parseScenes(
   *   '# Quest 01\n\n## Scene 1: Tavern...',
   *   (stage, percent) => {
   *     console.log(`Progress: ${stage} - ${percent}%`);
   *   },
   *   'correlation-123'
   * );
   * ```
   */
  async parseScenes(
    content: string,
    onProgress?: NSDProgressCallback,
    correlationId?: string
  ): Promise<NSDScene[]> {
    const logContext = {
      correlationId,
      contentLength: content.length,
    };

    this.logger.info('Starting NSD scene parsing', logContext);

    try {
      // Stage 1: Reading (0-20%) - Validate input content
      await this.executeStage(
        NSD_PROGRESS_STAGES.READING,
        0,
        20,
        onProgress,
        async () => {
          this.validateContent(content, correlationId);
          this.logger.debug('Content validation passed', { correlationId });
        }
      );

      // Stage 2: Parsing (20-60%) - AI-powered scene extraction ONLY
      let parsedScenes: ParsedScene[];

      await this.executeStage(
        NSD_PROGRESS_STAGES.PARSING,
        20,
        60,
        onProgress,
        async () => {
          this.logger.debug('Attempting AI-powered scene extraction', {
            correlationId,
          });
          parsedScenes = await this.extractScenesWithAI(content, correlationId);
          this.logger.debug('AI scene extraction completed', {
            correlationId,
            sceneCount: parsedScenes.length,
          });
        }
      );

      // Stage 3: Extracting (60-90%) - Progress reporting
      await this.executeStage(
        NSD_PROGRESS_STAGES.EXTRACTING,
        60,
        90,
        onProgress,
        async () => {
          this.logger.debug('Scene data extraction completed', {
            correlationId,
            sceneCount: parsedScenes.length,
          });
        }
      );

      // Stage 4: Validating (90-100%) - Convert to NSDScene entities
      let scenes: NSDScene[];
      await this.executeStage(
        NSD_PROGRESS_STAGES.VALIDATING,
        90,
        100,
        onProgress,
        async () => {
          scenes = this.convertToSceneEntities(parsedScenes, correlationId);
          this.validateScenes(scenes, correlationId);
          this.logger.debug('Scene validation completed', {
            correlationId,
            validatedCount: scenes.length,
          });
        }
      );

      this.logger.info('NSD scene parsing completed successfully', {
        ...logContext,
        sceneCount: scenes.length,
        method: 'AI',
      });

      return scenes;
    } catch (error) {
      return this.handleParsingError(error, correlationId);
    }
  }

  /**
   * Validates NSD content before parsing.
   *
   * @param content - Content to validate
   * @param correlationId - Optional correlation ID
   * @throws {NSDParseError} With VALIDATION_ERROR code if content is invalid
   */
  private validateContent(content: string, correlationId?: string): void {
    if (!content || typeof content !== 'string') {
      throw new NSDParseError(
        'NSD content must be a non-empty string',
        NSD_ERROR_CODES.VALIDATION_ERROR,
        correlationId
      );
    }

    if (content.trim().length === 0) {
      throw new NSDParseError(
        'NSD document is empty',
        NSD_ERROR_CODES.VALIDATION_ERROR,
        correlationId
      );
    }

    // Check for minimum markdown structure (at least one heading)
    if (!content.match(/^#+\s/m)) {
      throw new NSDParseError(
        'NSD document must contain at least one markdown heading',
        NSD_ERROR_CODES.VALIDATION_ERROR,
        correlationId
      );
    }
  }

  /**
   * Extracts scenes from NSD content using AI via MCP client.
   *
   * Sends the NSD content to Oracle MCP server which uses Claude AI
   * to identify and extract scenes following Coreto project format.
   * Implements 30-second timeout for AI calls.
   *
   * @param content - NSD markdown content
   * @param correlationId - Optional correlation ID
   * @returns Promise resolving to array of parsed scenes
   * @throws {NSDParseError} With AI_TIMEOUT code if AI call times out
   * @throws {NSDParseError} With PARSE_ERROR code if AI response is invalid
   */
  private async extractScenesWithAI(
    content: string,
    correlationId?: string
  ): Promise<ParsedScene[]> {
    try {
      // Ensure MCP server is running
      const isRunning = await this.mcpClient.healthCheck();
      if (!isRunning) {
        await this.mcpClient.start();
      }

      this.logger.debug('Sending content to Oracle MCP for scene extraction', {
        correlationId,
        contentLength: content.length,
      });

      this.logger.debug('Calling extract_scenes via MCP server', {
        correlationId,
        contentLength: content.length,
      });

      // Call Oracle MCP server extract_scenes tool with timeout
      const mcpResponse = await Promise.race([
        this.mcpClient.callTool<{ content: Array<{ type: string; text: string }> }>('extract_scenes', {
          nsdContent: content,
        }),
        this.createTimeoutPromise(this.AI_TIMEOUT_MS),
      ]);

      // DEBUG: Log raw MCP response to confirm format
      this.logger.error('[DEBUG] Raw MCP response from extract_scenes:', {
        correlationId,
        mcpResponse,
        responseType: typeof mcpResponse,
        hasContent: !!mcpResponse?.content,
        contentLength: mcpResponse?.content?.length,
        firstContentType: mcpResponse?.content?.[0]?.type,
        firstContentTextLength: mcpResponse?.content?.[0]?.text?.length,
        firstContentTextPreview: mcpResponse?.content?.[0]?.text?.slice(0, 200),
      });

      // Extract JSON string from MCP response format: { content: [{ type: 'text', text: '{...}' }] }
      const jsonString = mcpResponse?.content?.[0]?.text || '{}';

      this.logger.error('[DEBUG] Extracted JSON string from MCP response:', {
        correlationId,
        jsonStringLength: jsonString.length,
        jsonStringPreview: jsonString.slice(0, 200),
      });

      let response: { scenes: Array<{ title: string; content: string; summary?: string }> };
      try {
        response = JSON.parse(jsonString) as { scenes: Array<{ title: string; content: string; summary?: string }> };
      } catch (parseError) {
        this.logger.error('[DEBUG] Failed to parse JSON from MCP response', {
          correlationId,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
          jsonString,
        });
        throw new NSDParseError(
          `Failed to parse JSON from MCP response: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          NSD_ERROR_CODES.PARSE_ERROR,
          correlationId,
          { mcpResponse, jsonString }
        );
      }

      this.logger.error('[DEBUG] Parsed response successfully:', {
        correlationId,
        sceneCount: response.scenes?.length,
        firstSceneTitle: response.scenes?.[0]?.title,
      });

      // Validate AI response structure
      if (!response || !response.scenes || !Array.isArray(response.scenes)) {
        throw new NSDParseError(
          'Invalid AI response structure: missing or invalid scenes array',
          NSD_ERROR_CODES.PARSE_ERROR,
          correlationId,
          { response }
        );
      }

      // Convert AI response to parsed scenes
      const parsedScenes: ParsedScene[] = response.scenes.map((scene, index) => ({
        title: scene.title || `Scene ${index + 1}`,
        content: scene.content || '',
        summary: scene.summary,
      }));

      this.logger.debug('AI scene extraction completed', {
        correlationId,
        sceneCount: parsedScenes.length,
      });

      return parsedScenes;
    } catch (error) {
      if (error instanceof NSDParseError) {
        throw error;
      }

      // Determine error type
      const errorCode = this.determineErrorCode(error);

      throw new NSDParseError(
        `AI scene extraction failed: ${error instanceof Error ? error.message : String(error)}`,
        errorCode,
        correlationId,
        error
      );
    }
  }


  /**
   * Converts parsed scenes to NSDScene entities.
   *
   * Creates NSDScene entities from parsed scene data with proper
   * validation and scene numbering.
   *
   * @param parsedScenes - Array of parsed scenes
   * @param correlationId - Optional correlation ID
   * @returns Array of NSDScene entities
   */
  private convertToSceneEntities(
    parsedScenes: ParsedScene[],
    correlationId?: string
  ): NSDScene[] {
    this.logger.debug('Converting parsed scenes to NSDScene entities', {
      correlationId,
      parsedCount: parsedScenes.length,
    });

    const scenes: NSDScene[] = [];

    for (let i = 0; i < parsedScenes.length; i++) {
      const parsed = parsedScenes[i];
      const sceneNumber = i + 1;

      try {
        const scene = NSDScene.create(
          parsed.title,
          parsed.content,
          sceneNumber,
          correlationId,
          parsed.summary
        );
        scenes.push(scene);
      } catch (error) {
        this.logger.warn('Failed to create NSDScene entity, skipping', {
          correlationId,
          sceneNumber,
          title: parsed.title,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue with next scene
      }
    }

    return scenes;
  }

  /**
   * Validates extracted scenes.
   *
   * @param scenes - Scenes to validate
   * @param correlationId - Optional correlation ID
   * @throws {NSDParseError} With VALIDATION_ERROR code if validation fails
   */
  private validateScenes(scenes: NSDScene[], correlationId?: string): void {
    if (!scenes || scenes.length === 0) {
      this.logger.warn('No scenes extracted from NSD document', { correlationId });
      // This is a warning, not an error - empty scene list is valid
      return;
    }

    // Validate each scene has required properties
    for (const scene of scenes) {
      if (!scene.id || !scene.title || !scene.content) {
        throw new NSDParseError(
          'Extracted scene is missing required properties',
          NSD_ERROR_CODES.VALIDATION_ERROR,
          correlationId,
          { sceneId: scene?.id }
        );
      }

      if (scene.sceneNumber < 1) {
        throw new NSDParseError(
          `Scene has invalid number: ${scene.sceneNumber}`,
          NSD_ERROR_CODES.VALIDATION_ERROR,
          correlationId,
          { sceneId: scene.id, sceneNumber: scene.sceneNumber }
        );
      }
    }
  }

  /**
   * Executes a parsing stage with progress reporting.
   *
   * Helper method that wraps stage execution with progress callbacks
   * and error handling.
   *
   * @param stage - Current stage identifier
   * @param startPercent - Starting percentage for this stage
   * @param endPercent - Ending percentage for this stage
   * @param onProgress - Optional progress callback
   * @param execute - Async function to execute for this stage
   */
  private async executeStage(
    stage: NSDProgressStage,
    startPercent: number,
    endPercent: number,
    onProgress: NSDProgressCallback | undefined,
    execute: () => Promise<void>
  ): Promise<void> {
    // Report start of stage
    if (onProgress) {
      onProgress(stage, startPercent);
    }

    this.logger.debug(`Executing NSD parsing stage: ${stage}`, {
      stage,
      percent: startPercent,
    });

    try {
      // Execute stage logic
      await execute();

      // Report completion of stage
      if (onProgress) {
        onProgress(stage, endPercent);
      }

      this.logger.debug(`Completed NSD parsing stage: ${stage}`, {
        stage,
        percent: endPercent,
      });
    } catch (error) {
      this.logger.error(`NSD parsing stage failed: ${stage}`, {
        stage,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Re-throw for outer error handler
    }
  }

  /**
   * Creates a timeout promise for AI calls.
   *
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise that rejects after timeout
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`AI call timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Handles parsing errors and converts to NSDParseError.
   *
   * @param error - Original error
   * @param correlationId - Optional correlation ID
   * @throws {NSDParseError} With appropriate error code
   */
  private handleParsingError(error: unknown, correlationId?: string): never {
    let nsdError: NSDParseError;

    if (error instanceof NSDParseError) {
      // Re-throw existing NSDParseError
      nsdError = error;
    } else if (error instanceof Error) {
      // Convert generic Error to NSDParseError
      const errorCode = this.determineErrorCode(error);
      nsdError = new NSDParseError(
        `Failed to parse NSD document: ${error.message}`,
        errorCode,
        correlationId,
        error
      );
    } else {
      // Convert unknown error to NSDParseError
      nsdError = new NSDParseError(
        'Unexpected error parsing NSD document',
        NSD_ERROR_CODES.PARSE_ERROR,
        correlationId,
        error
      );
    }

    this.logger.error('NSD parsing failed', {
      correlationId,
      errorCode: nsdError.code,
      errorMessage: nsdError.message,
    });

    throw nsdError;
  }

  /**
   * Determines appropriate error code from error.
   *
   * @param error - Error to analyze
   * @returns Appropriate NSD error code
   */
  private determineErrorCode(error: Error | unknown): NSDErrorCode {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

    // Check for timeout indicators
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('timed out') ||
      errorMessage.includes('etime')
    ) {
      return NSD_ERROR_CODES.AI_TIMEOUT;
    }

    // Check for validation indicators
    if (
      errorMessage.includes('invalid') ||
      errorMessage.includes('validation') ||
      errorMessage.includes('required') ||
      errorMessage.includes('missing')
    ) {
      return NSD_ERROR_CODES.VALIDATION_ERROR;
    }

    // Default to parse error
    return NSD_ERROR_CODES.PARSE_ERROR;
  }
}
