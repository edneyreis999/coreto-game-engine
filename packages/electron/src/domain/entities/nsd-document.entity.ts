/**
 * NSD Document Entity
 *
 * Domain entity representing a Narrative Scene Design (NSD) document.
 * NSD documents are markdown files that describe game scenes, quests, and narrative elements.
 *
 * This entity follows DDD principles:
 * - Immutable (all fields are readonly)
 * - Validation in factory method
 * - Domain errors via ValidationError
 * - Logging via ILogger (in factory/use-case layer)
 *
 * @example
 * ```typescript
 * const nsd = NSDDocument.create(markdownContent, 'quest-01.md', 'correlation-123');
 * const scene = NSDScene.create('Tavern Scene', 'The hero enters...', 1);
 * const updated = nsd.addScene(scene);
 * ```
 *
 * @trace NSD-GEN-002
 */

import { ValidationError } from '@coreto/core';
import { NSDScene } from './nsd-scene.entity.js';

/**
 * NSD Metadata structure.
 * Contains extracted metadata from the NSD document.
 *
 * This is a simplified domain representation. The full DTO structure
 * is in ../types/nsd-types.ts as NSDMetadata
 */
export interface NSDMetadata {
  /**
   * Full title of the quest or narrative.
   */
  title: string;

  /**
   * Current status of the quest/narrative.
   */
  status: 'draft' | 'review' | 'approved' | 'implemented' | 'testing' | 'complete';

  /**
   * Importance of this quest to the main campaign.
   */
  campaignImportance: 'main' | 'side' | 'hidden';

  /**
   * Position of this quest in the narrative arc.
   */
  narrativeArc: 'introduction' | 'rising' | 'climax' | 'falling' | 'resolution' | 'standalone';

  /**
   * Estimated duration to complete this quest.
   */
  estimatedDuration?: 'short' | 'medium' | 'long' | 'epic';

  /**
   * Recommended character level for this quest.
   */
  recommendedLevel?: number;

  /**
   * Name or identifier of the quest giver NPC.
   */
  questGiver?: string;

  /**
   * List of rewards for completing this quest.
   */
  rewards?: string[];
}

/**
 * DTO for NSDDocument entity.
 * Used for serialization and IPC communication.
 */
export interface NSDDocumentDTO {
  /**
   * Unique document identifier.
   */
  id: string;

  /**
   * Original filename of the NSD document.
   */
  fileName: string;

  /**
   * Quest name (extracted or derived).
   */
  questName: string;

  /**
   * Full markdown content of the NSD document.
   */
  content: string;

  /**
   * Extracted metadata.
   */
  metadata: NSDMetadata;

  /**
   * Array of scenes detected in the document.
   */
  scenes: readonly NSDScene[];

  /**
   * Timestamp when document was created/loaded.
   */
  createdAt: number;
}

/**
 * Error code for NSD document validation errors.
 */
export const NSD_DOCUMENT_VALIDATION_ERROR = 'NSD_DOCUMENT_VALIDATION_ERROR';

/**
 * NSDDomain Entity.
 *
 * Represents an NSD (Narrative Scene Design) document loaded from a markdown file.
 * This entity is immutable - all mutations return new instances.
 *
 * Validation Rules:
 * - Content must not be empty or whitespace only
 * - FileName must not be empty
 * - Quest name is derived from content if not provided
 *
 * @example
 * ```typescript
 * // Create via factory
 * const document = NSDDocument.create(
 *   '# My Quest\\n\\nScene 1: Tavern...',
 *   'quest-01.md',
 *   'correlation-123'
 * );
 *
 * // Add a scene (returns new instance)
 * const scene = NSDScene.create('Tavern Scene', 'The hero enters...', 1);
 * const updated = document.addScene(scene);
 *
 * // Convert to DTO
 * const dto = updated.toDTO();
 * ```
 */
export class NSDDocument {
  /**
   * Unique document identifier (UUID).
   */
  readonly id: string;

  /**
   * Original filename of the NSD document.
   */
  readonly fileName: string;

  /**
   * Quest name (extracted from content or provided).
   */
  readonly questName: string;

  /**
   * Full markdown content of the NSD document.
   */
  readonly content: string;

  /**
   * Extracted metadata from the document.
   */
  readonly metadata: NSDMetadata;

  /**
   * Array of scenes detected in the document.
   */
  readonly scenes: readonly NSDScene[];

  /**
   * Timestamp when document was created (milliseconds since epoch).
   */
  readonly createdAt: number;

  /**
   * Private constructor.
   * Use NSDDocument.create() factory method to create instances.
   *
   * @param data - Document data
   */
  private constructor(data: {
    id: string;
    fileName: string;
    questName: string;
    content: string;
    metadata: NSDMetadata;
    scenes: readonly NSDScene[];
    createdAt: number;
  }) {
    this.id = data.id;
    this.fileName = data.fileName;
    this.questName = data.questName;
    this.content = data.content;
    this.metadata = Object.freeze({ ...data.metadata });
    this.scenes = Object.freeze([...data.scenes]);
    this.createdAt = data.createdAt;

    // Freeze to ensure immutability
    Object.freeze(this);
  }

  /**
   * Static factory method to create a new NSDDocument.
   *
   * Validates input and generates default values.
   *
   * @param content - Full markdown content of the NSD document
   * @param fileName - Original filename (e.g., 'quest-01.md')
   * @param correlationId - Optional correlation ID for logging/tracing
   * @returns New NSDDocument instance
   * @throws {ValidationError} If validation fails
   *
   * @example
   * ```typescript
   * const document = NSDDocument.create(
   *   '# My Quest\\n\\nScene content...',
   *   'quest-01.md',
   *   'job-123'
   * );
   * ```
   */
  static create(content: string, fileName: string, correlationId?: string): NSDDocument {
    // Validate content
    if (!content || content.trim().length === 0) {
      throw new ValidationError(
        'NSD document content cannot be empty',
        {
          code: NSD_DOCUMENT_VALIDATION_ERROR,
          fileName,
          correlationId,
        }
      );
    }

    // Validate fileName
    if (!fileName || fileName.trim().length === 0) {
      throw new ValidationError(
        'NSD document filename cannot be empty',
        {
          code: NSD_DOCUMENT_VALIDATION_ERROR,
          correlationId,
        }
      );
    }

    // Extract quest name from content (look for first # header)
    let questName = 'Untitled Quest';
    const headerMatch = content.match(/^#\s+(.+)$/m);
    if (headerMatch && headerMatch[1]) {
      questName = headerMatch[1].trim();
    }

    // Initialize with default metadata (will be enriched by parser service)
    const metadata: NSDMetadata = {
      title: questName,
      status: 'draft',
      campaignImportance: 'side',
      narrativeArc: 'standalone',
    };

    // Try to extract more metadata from content
    // Look for status metadata block
    const statusMatch = content.match(/^>\s*Status:\s*(.+)$/m);
    if (statusMatch && statusMatch[1]) {
      const statusValue = statusMatch[1].trim().toLowerCase();
      if (['draft', 'review', 'approved', 'implemented', 'testing', 'complete'].includes(statusValue)) {
        metadata.status = statusValue as NSDMetadata['status'];
      }
    }

    // Look for importance metadata block
    const importanceMatch = content.match(/^>\s*Importance:\s*(.+)$/m);
    if (importanceMatch && importanceMatch[1]) {
      const importanceValue = importanceMatch[1].trim().toLowerCase();
      if (['main', 'side', 'hidden'].includes(importanceValue)) {
        metadata.campaignImportance = importanceValue as NSDMetadata['campaignImportance'];
      }
    }

    // Look for narrative arc metadata block
    const arcMatch = content.match(/^>\s*Arc:\s*(.+)$/m);
    if (arcMatch && arcMatch[1]) {
      const arcValue = arcMatch[1].trim().toLowerCase();
      if (['introduction', 'rising', 'climax', 'falling', 'resolution', 'standalone'].includes(arcValue)) {
        metadata.narrativeArc = arcValue as NSDMetadata['narrativeArc'];
      }
    }

    // Generate unique ID
    const id = `nsd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create document
    const document = new NSDDocument({
      id,
      fileName: fileName.trim(),
      questName,
      content,
      metadata,
      scenes: [], // Scenes will be extracted by parser service
      createdAt: Date.now(),
    });

    return document;
  }

  /**
   * Add a scene to the document.
   * Returns a NEW instance with the scene added (immutability).
   *
   * @param scene - NSDScene entity to add
   * @returns New NSDDocument instance with the scene added
   *
   * @example
   * ```typescript
   * const scene = NSDScene.create('Tavern Scene', 'The hero enters...', 1);
   * const updated = document.addScene(scene);
   * ```
   */
  addScene(scene: NSDScene): NSDDocument {
    const newScenes = [...this.scenes, scene];

    return new NSDDocument({
      id: this.id,
      fileName: this.fileName,
      questName: this.questName,
      content: this.content,
      metadata: this.metadata,
      scenes: newScenes,
      createdAt: this.createdAt,
    });
  }

  /**
   * Add multiple scenes to the document.
   * Returns a NEW instance with all scenes added (immutability).
   *
   * @param scenes - Array of NSDScene entities to add
   * @returns New NSDDocument instance with scenes added
   *
   * @example
   * ```typescript
   * const scene1 = NSDScene.create('Tavern', '...', 1);
   * const scene2 = NSDScene.create('Forest', '...', 2);
   * const updated = document.addScenes([scene1, scene2]);
   * ```
   */
  addScenes(scenes: readonly NSDScene[]): NSDDocument {
    const newScenes = [...this.scenes, ...scenes];

    return new NSDDocument({
      id: this.id,
      fileName: this.fileName,
      questName: this.questName,
      content: this.content,
      metadata: this.metadata,
      scenes: newScenes,
      createdAt: this.createdAt,
    });
  }

  /**
   * Convert entity to DTO for serialization.
   *
   * @returns NSDDocumentDTO representation (from ../types/nsd-types.ts)
   *
   * @example
   * ```typescript
   * const dto = document.toDTO();
   * // Send via IPC or store in database
   * ```
   */
  toDTO(): {
    id: string;
    fileName: string;
    questName: string;
    content: string;
    metadata: NSDMetadata;
    scenes: readonly NSDScene[];
  } {
    return {
      id: this.id,
      fileName: this.fileName,
      questName: this.questName,
      content: this.content,
      metadata: this.metadata,
      scenes: this.scenes,
    };
  }

  /**
   * Get scene count.
   *
   * @returns Number of scenes in the document
   */
  get sceneCount(): number {
    return this.scenes.length;
  }

  /**
   * Get scene by ID.
   *
   * @param sceneId - Scene ID to find
   * @returns Scene if found, undefined otherwise
   */
  getSceneById(sceneId: string): NSDScene | undefined {
    return this.scenes.find((scene) => scene.id === sceneId);
  }

  /**
   * Get scene by name.
   *
   * @param name - Scene title to find (case-insensitive)
   * @returns Scene if found, undefined otherwise
   */
  getSceneByName(name: string): NSDScene | undefined {
    const lowerName = name.toLowerCase();
    return this.scenes.find((scene) => scene.title.toLowerCase() === lowerName);
  }

  /**
   * Check if document has any scenes.
   *
   * @returns True if document has at least one scene
   */
  hasScenes(): boolean {
    return this.scenes.length > 0;
  }

  /**
   * Value equality check.
   * Two documents are equal if they have the same ID.
   *
   * @param other - The other NSDDocument to compare
   * @returns True if both documents have the same ID
   */
  equals(other: NSDDocument): boolean {
    return this.id === other.id;
  }

  /**
   * String representation of the document.
   *
   * @returns String in format "NSDDocument: {fileName} ({sceneCount} scenes)"
   */
  toString(): string {
    return `NSDDocument: ${this.fileName} (${this.scenes.length} scenes)`;
  }
}
