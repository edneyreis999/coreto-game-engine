/**
 * NSD Scene Entity
 *
 * Domain entity representing a single narrative scene extracted from an
 * NSD (Narrative Scene Document). Follows DDD principles with immutability,
 * factory methods, and validation.
 *
 * @example
 * ```typescript
 * const scene = NSDScene.create(
 *   'Tavern Meeting',
 *   'The hero enters the dimly lit tavern...',
 *   1,
 *   'correlation-123'
 * );
 * ```
 */

import { randomUUID } from 'node:crypto';
import { DomainError } from '@coreto/core';
import type { ILogger } from '@coreto/core';
import type { NSDSceneDTO } from '../types/nsd-types.js';

// LOG 8: NSDScene entity file loaded
console.log('[NSD-WORKER-LOG-008] NSDScene entity file - starting imports...');

// Lazy logger initialization to avoid DI issues
let logger: ILogger | null = null;
function ensureLogger(): ILogger {
  // LOG 9: ensureLogger called
  console.log('[NSD-WORKER-LOG-009] ensureLogger called - about to require main/di/container.js...');

  if (!logger) {
    // Import dynamically to avoid circular dependencies
    const { getLogger } = require('../../main/di/container.js');
    logger = getLogger();
  }
  return logger;
}

/**
 * NSD Scene Entity
 *
 * Represents a single narrative scene with immutable properties and
 * validation. Scenes are extracted from NSD markdown documents and
 * used for prompt generation.
 */
export class NSDScene {
  /**
   * Unique identifier for this scene.
   * Generated using UUID v4.
   */
  readonly id: string;

  /**
   * Human-readable title for the scene.
   * Extracted from the scene heading in the NSD markdown.
   */
  readonly title: string;

  /**
   * Full narrative content of the scene.
   * Contains the complete scene description, dialogue, and action.
   */
  readonly content: string;

  /**
   * Sequential number indicating scene order in the document.
   * 1-based index matching the scene's position in the narrative flow.
   */
  readonly sceneNumber: number;

  /**
   * Optional brief summary of the scene.
   * Provides a high-level overview of the scene's purpose and key events.
   */
  readonly summary?: string;

  /**
   * Private constructor to enforce factory method usage.
   *
   * @param data - Scene data including all properties
   */
  private constructor(data: {
    id: string;
    title: string;
    content: string;
    sceneNumber: number;
    summary?: string;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.content = data.content;
    this.sceneNumber = data.sceneNumber;
    this.summary = data.summary;

    // Freeze entity to ensure immutability
    Object.freeze(this);
  }

  /**
   * Factory method to create a new NSDScene entity.
   *
   * Validates input and generates a UUID for the scene.
   * Throws DomainError if validation fails.
   *
   * @param title - Human-readable title for the scene (must not be empty)
   * @param content - Full narrative content of the scene
   * @param sceneNumber - Sequential number (must be positive)
   * @param correlationId - Optional correlation ID for logging/tracking
   * @param summary - Optional brief summary of the scene
   * @returns New NSDScene instance
   * @throws DomainError with code NSD_SCENE_VALIDATION_ERROR if validation fails
   *
   * @example
   * ```typescript
   * const scene = NSDScene.create(
   *   'Tavern Meeting',
   *   'The hero enters...',
   *   1,
   *   'correlation-123',
   *   'Introduction to quest giver'
   * );
   * ```
   */
  static create(
    title: string,
    content: string,
    sceneNumber: number,
    correlationId?: string,
    summary?: string
  ): NSDScene {
    // Validation: Title must not be empty
    if (!title || title.trim().length === 0) {
      const error = new DomainError(
        'NSD scene title cannot be empty',
        'critical',
        { title, correlationId }
      );
      error.name = 'NSD_SCENE_VALIDATION_ERROR';
      throw error;
    }

    // Validation: SceneNumber must be positive
    if (sceneNumber < 1) {
      const error = new DomainError(
        `NSD scene number must be positive, received: ${sceneNumber}`,
        'critical',
        { sceneNumber, correlationId }
      );
      error.name = 'NSD_SCENE_VALIDATION_ERROR';
      throw error;
    }

    // Generate UUID for the scene
    const id = randomUUID();

    // Create the entity
    const scene = new NSDScene({
      id,
      title: title.trim(),
      content,
      sceneNumber,
      summary,
    });

    // Log entity creation
    try {
      const log = ensureLogger();
      log.info('NSDScene entity created', {
        sceneId: scene.id,
        title: scene.title,
        sceneNumber: scene.sceneNumber,
        correlationId,
      });
    } catch {
      // Silently fail if logger not available (e.g., in tests)
    }

    return scene;
  }

  /**
   * Factory method to create a new NSDScene entity from a DTO.
   *
   * This is the preferred method for creating entities from external data sources
   * (e.g., API responses, database records, or test fakes). Uses the existing
   * validation logic from the create() method.
   *
   * @param dto - Data Transfer Object containing scene data
   * @param correlationId - Optional correlation ID for logging/tracking
   * @returns New NSDScene instance
   * @throws DomainError with code NSD_SCENE_VALIDATION_ERROR if validation fails
   *
   * @example
   * ```typescript
   * const dto = NSDSceneDTOFakeBuilder.anEntity().build();
   * const scene = NSDScene.fromDTO(dto);
   * ```
   */
  static fromDTO(dto: NSDSceneDTO, correlationId?: string): NSDScene {
    return NSDScene.create(
      dto.title,
      dto.content,
      dto.sceneNumber,
      correlationId,
      dto.summary
    );
  }

  /**
   * Returns a new NSDScene instance with the updated title.
   *
   * Creates a clone of this scene with a different title while
   * preserving all other properties. The original scene remains unchanged.
   *
   * @param title - New title for the scene (must not be empty)
   * @returns New NSDScene instance with updated title
   * @throws DomainError if validation fails
   *
   * @example
   * ```typescript
   * const updatedScene = scene.withTitle('Updated Tavern Meeting');
   * console.log(scene.title); // 'Tavern Meeting' (unchanged)
   * console.log(updatedScene.title); // 'Updated Tavern Meeting'
   * ```
   */
  withTitle(title: string): NSDScene {
    // Validation: Title must not be empty
    if (!title || title.trim().length === 0) {
      const error = new DomainError(
        'NSD scene title cannot be empty',
        'critical',
        { originalSceneId: this.id, originalTitle: this.title }
      );
      error.name = 'NSD_SCENE_VALIDATION_ERROR';
      throw error;
    }

    // Create new instance with updated title
    return new NSDScene({
      id: this.id, // Preserve same ID
      title: title.trim(),
      content: this.content,
      sceneNumber: this.sceneNumber,
      summary: this.summary,
    });
  }

  /**
   * Converts this entity to a Data Transfer Object (DTO).
   *
   * Returns a plain object representation suitable for serialization
   * across IPC boundaries or storage in databases.
   *
   * @returns NSDSceneDTO with all entity properties
   *
   * @example
   * ```typescript
   * const dto = scene.toDTO();
   * // Send via IPC or store in database
   * ```
   */
  toDTO(): NSDSceneDTO {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      sceneNumber: this.sceneNumber,
      summary: this.summary,
    };
  }

  /**
   * Checks value equality with another NSDScene.
   *
   * Two scenes are equal if they have the same title, content,
   * scene number, and summary. ID is not compared to allow
   * comparison of cloned entities.
   *
   * @param other - The other NSDScene to compare
   * @returns True if scenes are equal in value
   *
   * @example
   * ```typescript
   * const scene2 = scene.withTitle('New Title');
   * console.log(scene.equals(scene2)); // false
   * ```
   */
  equals(other: NSDScene): boolean {
    return (
      this.title === other.title &&
      this.content === other.content &&
      this.sceneNumber === other.sceneNumber &&
      this.summary === other.summary
    );
  }

  /**
   * String representation of the scene.
   *
   * Returns a formatted string with scene number and title.
   *
   * @returns String in format "Scene {sceneNumber}: {title}"
   *
   * @example
   * ```typescript
   * console.log(scene.toString()); // "Scene 1: Tavern Meeting"
   * ```
   */
  toString(): string {
    return `Scene ${this.sceneNumber}: ${this.title}`;
  }
}
