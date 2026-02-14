/**
 * FakeBuilder for GeneratePromptOptions to support testing scenarios.
 * Provides fluent interface for creating test data with sensible defaults.
 *
 * @example
 * ```typescript
 * const validOptions = new GeneratePromptOptionsFakeBuilder()
 *   .withNsdContent('# NSD Content...')
 *   .withSceneName('Test Scene')
 *   .withProjectPath('/path/to/project')
 *   .build();
 *
 * const withQuestVariable = new GeneratePromptOptionsFakeBuilder()
 *   .withNsdContent('# NSD Content...')
 *   .withSceneName('Test Scene')
 *   .withProjectPath('/path/to/project')
 *   .withQuestVariable('Quest 01 Progress')
 *   .build();
 * ```
 */

import { FakeBuilder } from './FakeBuilder.js';
import type { GeneratePromptOptions } from '../../src/lib/claudeAgentClient.js';

export class GeneratePromptOptionsFakeBuilder extends FakeBuilder<GeneratePromptOptions> {
  private nsdContent = '# NSD Test Content\n\nThis is a test NSD document with some content.';
  private sceneName = 'Test Scene';
  private projectPath = '/path/to/rmmz/project';
  private questVariable?: string;

  /**
   * Set the NSD content for the prompt generation.
   */
  withNsdContent(content: string): this {
    this.nsdContent = content;
    return this;
  }

  /**
   * Set the scene name for the prompt generation.
   */
  withSceneName(name: string): this {
    this.sceneName = name;
    return this;
  }

  /**
   * Set the project path for the RPG Maker MZ project.
   */
  withProjectPath(path: string): this {
    this.projectPath = path;
    return this;
  }

  /**
   * Set the optional quest variable for the scene.
   */
  withQuestVariable(variable: string): this {
    this.questVariable = variable;
    return this;
  }

  /**
   * Build the GeneratePromptOptions with current builder state.
   */
  build(): GeneratePromptOptions {
    const options: GeneratePromptOptions = {
      nsdContent: this.nsdContent,
      sceneName: this.sceneName,
      projectPath: this.projectPath,
    };

    if (this.questVariable) {
      options.questVariable = this.questVariable;
    }

    return options;
  }

  /**
   * Create a builder with invalid data for testing.
   * Returns invalid combinations that would fail Zod validation.
   */
  withInvalidData(): this {
    // Reset to valid state first
    this.nsdContent = '';
    this.sceneName = '';
    this.projectPath = '';
    this.questVariable = undefined;
    return this;
  }

  /**
   * Create a builder with path traversal attempts for security testing.
   */
  withPathTraversal(): this {
    this.nsdContent = '# NSD Content';
    this.sceneName = 'Test Scene';
    this.projectPath = '../../../etc/passwd';
    this.questVariable = undefined;
    return this;
  }

  /**
   * Create a builder with excessive NSD content to test size limits.
   */
  withExcessiveNsdContent(): this {
    // Generate a string larger than 1MB
    this.nsdContent = 'x'.repeat(1024 * 1024 + 1);
    this.sceneName = 'Test Scene';
    this.projectPath = '/path/to/project';
    this.questVariable = undefined;
    return this;
  }

  /**
   * Create a builder with an excessively long scene name to test length limits.
   */
  withExcessiveSceneName(): this {
    this.nsdContent = '# NSD Content';
    this.sceneName = 'x'.repeat(201); // Exceeds 200 character limit
    this.projectPath = '/path/to/project';
    this.questVariable = undefined;
    return this;
  }

  /**
   * Helper to create a valid instance with minimal required data.
   */
  static createValid(): GeneratePromptOptions {
    return new GeneratePromptOptionsFakeBuilder().build();
  }

  /**
   * Helper to create a valid instance with optional quest variable.
   */
  static createWithQuestVariable(): GeneratePromptOptions {
    return new GeneratePromptOptionsFakeBuilder()
      .withQuestVariable('Quest 01 Progress')
      .build();
  }
}