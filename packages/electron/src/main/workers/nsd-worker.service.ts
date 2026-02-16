/**
 * NSD Worker Service
 *
 * Service that handles NSD (Narrative Scene Document) parsing logic
 * within a worker thread. Coordinates between worker message handler
 * and NsdParserService using dependency injection for logger.
 *
 * This service provides:
 * - Progress callback support during parsing stages
 * - Delegation to NsdParserService for AI parsing
 * - Error handling with clear error codes
 * - Logging via ILogger (never console.log)
 *
 * @see docs/planos/006-mcp-client-integration/tasks/07_task.md
 *
 * Error Codes:
 * - NSD_PARSE_ERROR: General parsing failure
 * - NSD_AI_TIMEOUT: AI service timeout
 * - NSD_VALIDATION_ERROR: Invalid content
 *
 * Progress Stages:
 * - reading: 0-20%
 * - parsing: 20-60%
 * - extracting: 60-90%
 * - validating: 90-100%
 */

import type { ILogger } from '@coreto/core';
import { ConsoleLogger } from '@coreto/core';
import { NSDScene } from '@coreto/electron/domain/entities';

// Import NsdParserService for AI-powered scene extraction
import { NsdParserService } from '../services/nsd-parser.service.js';

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
// NSD Worker Service
// =============================================================================

/**
 * Service for handling NSD parsing operations within worker thread.
 *
 * This service:
 * - Coordinates NSD parsing between worker and parser service
 * - Provides progress callbacks during parsing stages
 * - Handles errors with structured error codes
 * - Logs all operations via ILogger
 *
 * Note: This service uses manual constructor injection instead of decorators
 * to work with esbuild's limited decorator support in worker processes.
 *
 * @example
 * ```typescript
 * const service = new NsdWorkerService(logger);
 * const scenes = await service.parseNSD(
 *   markdownContent,
 *   'quest-01.md',
 *   (stage, percent) => console.log(`${stage}: ${percent}%`),
 *   'correlation-123'
 * );
 * ```
 */
export class NsdWorkerService {
  /**
   * Logger instance.
   * Uses ConsoleLogger as fallback in worker context.
   */
  private readonly logger: ILogger;

  /**
   * Creates a new NsdWorkerService instance.
   *
   * @param logger - Optional logger instance (defaults to ConsoleLogger)
   */
  constructor(logger?: ILogger) {
    // Use provided logger or fallback to ConsoleLogger for worker context
    this.logger = logger || new ConsoleLogger();
  }

  /**
   * Parses NSD document content and extracts scene data.
   *
   * This method orchestrates the complete NSD parsing flow:
   * 1. Validates input content (reading stage: 0-20%)
   * 2. Delegates to NsdParserService for AI parsing (parsing stage: 20-60%)
   * 3. Extracts scene entities from parsed data (extracting stage: 60-90%)
   * 4. Validates extracted scenes (validating stage: 90-100%)
   *
   * @param content - NSD markdown content to parse
   * @param fileName - Original filename for logging/tracking
   * @param onProgress - Optional progress callback (stage, percent) => void
   * @param correlationId - Optional correlation ID for tracking
   * @returns Promise resolving to array of NSDScene entities
   * @throws {NSDParseError} With appropriate error code if parsing fails
   *
   * @example
   * ```typescript
   * const scenes = await service.parseNSD(
   *   '# Quest 01\n\n## Scene 1: Tavern...',
   *   'quest-01.md',
   *   (stage, percent) => {
   *     console.log(`Progress: ${stage} - ${percent}%`);
   *   },
   *   'correlation-123'
   * );
   * ```
   */
  async parseNSD(
    content: string,
    fileName: string,
    onProgress?: NSDProgressCallback,
    correlationId?: string
  ): Promise<NSDScene[]> {
    const logContext = {
      fileName,
      correlationId,
      contentLength: content.length,
    };

    this.logger.info('Starting NSD parsing', logContext);

    try {
      // Stage 1: Reading (0-20%) - Validate input content
      await this.executeStage(
        NSD_PROGRESS_STAGES.READING,
        0,
        20,
        onProgress,
        async () => {
          this.validateContent(content, fileName, correlationId);
          this.logger.debug('Content validation passed', { correlationId });
        }
      );

      // Stage 2: Parsing (20-60%) - Delegate to NsdParserService
      let parsedData: Awaited<ReturnType<NsdParserService['parseNSD']>>;
      await this.executeStage(
        NSD_PROGRESS_STAGES.PARSING,
        20,
        60,
        onProgress,
        async () => {
          // TODO: Task 11 - Implement NsdParserService
          // For now, this is a placeholder that will be implemented
          // when the NsdParserService is created
          parsedData = await this.delegateToParserService(content, fileName, correlationId);
          this.logger.debug('AI parsing completed', {
            correlationId,
            sceneCount: parsedData?.length || 0,
          });
        }
      );

      // Stage 3: Extracting (60-90%) - Extract scene entities
      let scenes: NSDScene[];
      await this.executeStage(
        NSD_PROGRESS_STAGES.EXTRACTING,
        60,
        90,
        onProgress,
        async () => {
          // TODO: Task 11 - Extract NSDScene entities from parsed data
          // For now, return empty array - will be implemented with NsdParserService
          scenes = this.extractScenes(parsedData, correlationId);
          this.logger.debug('Scene extraction completed', {
            correlationId,
            extractedCount: scenes.length,
          });
        }
      );

      // Stage 4: Validating (90-100%) - Validate extracted scenes
      await this.executeStage(
        NSD_PROGRESS_STAGES.VALIDATING,
        90,
        100,
        onProgress,
        async () => {
          this.validateScenes(scenes, correlationId);
          this.logger.debug('Scene validation completed', {
            correlationId,
            validatedCount: scenes.length,
          });
        }
      );

      this.logger.info('NSD parsing completed successfully', {
        ...logContext,
        sceneCount: scenes.length,
      });

      return scenes;
    } catch (error) {
      return this.handleParsingError(error, fileName, correlationId);
    }
  }

  /**
   * Validates NSD content before parsing.
   *
   * @param content - Content to validate
   * @param fileName - Filename for error context
   * @param correlationId - Optional correlation ID
   * @throws {NSDParseError} With VALIDATION_ERROR code if content is invalid
   */
  private validateContent(content: string, fileName: string, correlationId?: string): void {
    if (!content || typeof content !== 'string') {
      throw new NSDParseError(
        'NSD content must be a non-empty string',
        NSD_ERROR_CODES.VALIDATION_ERROR,
        correlationId
      );
    }

    if (content.trim().length === 0) {
      throw new NSDParseError(
        `NSD document is empty: ${fileName}`,
        NSD_ERROR_CODES.VALIDATION_ERROR,
        correlationId
      );
    }

    // Check for minimum markdown structure (at least one heading)
    if (!content.match(/^#+\s/m)) {
      throw new NSDParseError(
        `NSD document must contain at least one markdown heading: ${fileName}`,
        NSD_ERROR_CODES.VALIDATION_ERROR,
        correlationId
      );
    }
  }

  /**
   * Delegates parsing to NsdParserService.
   *
   * Creates an instance of NsdParserService and delegates scene extraction.
   * Uses AI-powered parsing with regex fallback.
   *
   * IMPORTANT: In UtilityProcess worker context, we skip AI parsing entirely
   * because Electron APIs (like app.getAppPath()) are not available.
   * We use regex-based parsing directly as a workaround.
   *
   * @param content - NSD markdown content
   * @param fileName - Original filename
   * @param correlationId - Optional correlation ID
   * @returns Promise resolving to array of NSDScene entities
   */
  private async delegateToParserService(
    content: string,
    fileName: string,
    correlationId?: string
  ): Promise<NSDScene[]> {
    this.logger.debug('Delegating to NsdParserService', {
      fileName,
      correlationId,
    });

    try {
      // Check if we're in a UtilityProcess worker context
      // UtilityProcess doesn't have access to Electron APIs like app.getAppPath()
      // which McpClientService requires, so we skip AI parsing in workers
      const isWorkerContext = typeof process !== 'undefined' &&
                              process.type === 'utility';

      if (isWorkerContext) {
        this.logger.info('Running in UtilityProcess context, using regex-only parsing (no AI)', {
          correlationId,
        });

        // Use regex-based parsing directly (no AI in worker context)
        const parsedScenes = this.extractScenesWithRegex(content, correlationId);

        // Convert to NSDScene entities
        const scenes = this.convertToSceneEntities(parsedScenes, correlationId);
        return scenes;
      }

      // Create parser service instance for main process context
      // Note: Using manual injection since decorators may not work in worker context
      const parserService = new NsdParserService(this.logger);

      // Delegate scene parsing to NsdParserService (with AI support)
      const scenes = await parserService.parseScenes(
        content,
        undefined, // Progress updates handled by worker service
        correlationId
      );

      return scenes;
    } catch (error) {
      this.logger.error('NsdParserService delegation failed', {
        fileName,
        correlationId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Extracts scenes from NSD content using regex parsing.
   *
   * Fallback method when AI parsing fails or is unavailable.
   * Splits content by markdown headers and extracts title and content.
   *
   * @param content - NSD markdown content
   * @param correlationId - Optional correlation ID
   * @returns Array of parsed scenes
   */
  private extractScenesWithRegex(
    content: string,
    correlationId?: string
  ): Array<{ title: string; content: string; summary?: string }> {
    this.logger.debug('Starting regex-based scene extraction', {
      correlationId,
    });

    const scenes: Array<{ title: string; content: string; summary?: string }> = [];

    // Split content by ## headers (scene-level headings)
    // Matches: ## Scene 1: Title or ## Title
    const lines = content.split('\n');
    let currentScene: { title: string; content: string; summary?: string } | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      const sceneMatch = line.match(/^##\s+(.+)$/);

      if (sceneMatch) {
        // Save previous scene if exists
        if (currentScene) {
          currentScene.content = currentContent.join('\n').trim();
          scenes.push(currentScene);
        }

        // Start new scene
        const title = sceneMatch[1].trim();
        currentScene = {
          title,
          content: '',
        };
        currentContent = [];
      } else if (currentScene) {
        // Add line to current scene content
        // Skip empty lines at start of content
        if (currentContent.length > 0 || line.trim() !== '') {
          currentContent.push(line);
        }
      }
    }

    // Save last scene
    if (currentScene) {
      currentScene.content = currentContent.join('\n').trim();
      scenes.push(currentScene);
    }

    // If no scenes found with ## headers, try alternative patterns
    if (scenes.length === 0) {
      this.logger.warn('No ## headers found, attempting alternative parsing', {
        correlationId,
      });

      // Try splitting by # headers (document-level)
      const docHeaders = content.split(/^#\s+.+$/m);
      if (docHeaders.length > 1) {
        // Use content after first # header as single scene
        scenes.push({
          title: 'Main Scene',
          content: docHeaders.slice(1).join('\n').trim(),
        });
      } else {
        // Last resort: treat entire content as single scene
        scenes.push({
          title: 'Untitled Scene',
          content: content.trim(),
        });
      }
    }

    this.logger.debug('Regex extraction completed', {
      correlationId,
      sceneCount: scenes.length,
    });

    return scenes;
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
    parsedScenes: Array<{ title: string; content: string; summary?: string }>,
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
   * Extracts NSDScene entities from parsed data.
   *
   * Since NsdParserService now returns NSDScene[] directly,
   * this method simply returns the parsed scenes.
   *
   * @param parsedData - Data returned from parser service (NSDScene[])
   * @param correlationId - Optional correlation ID
   * @returns Array of NSDScene entities
   */
  private extractScenes(parsedData: NSDScene[], correlationId?: string): NSDScene[] {
    this.logger.debug('Extracting scenes from parsed data', {
      correlationId,
      sceneCount: parsedData?.length || 0,
    });

    // NsdParserService now returns NSDScene[] directly
    return parsedData || [];
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
   * Handles parsing errors and converts to NSDParseError.
   *
   * @param error - Original error
   * @param fileName - Filename for error context
   * @param correlationId - Optional correlation ID
   * @throws {NSDParseError} With appropriate error code
   */
  private handleParsingError(error: unknown, fileName: string, correlationId?: string): never {
    let nsdError: NSDParseError;

    if (error instanceof NSDParseError) {
      // Re-throw existing NSDParseError
      nsdError = error;
    } else if (error instanceof Error) {
      // Convert generic Error to NSDParseError
      const errorCode = this.determineErrorCode(error);
      nsdError = new NSDParseError(
        `Failed to parse NSD document: ${fileName} - ${error.message}`,
        errorCode,
        correlationId,
        error
      );
    } else {
      // Convert unknown error to NSDParseError
      nsdError = new NSDParseError(
        `Unexpected error parsing NSD document: ${fileName}`,
        NSD_ERROR_CODES.PARSE_ERROR,
        correlationId,
        error
      );
    }

    this.logger.error('NSD parsing failed', {
      fileName,
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
  private determineErrorCode(error: Error): NSDErrorCode {
    const errorMessage = error.message.toLowerCase();

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
