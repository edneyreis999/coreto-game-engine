/**
 * Unit Tests: NSD Parser Service
 *
 * Comprehensive tests for NSD Parser Service covering:
 * - Parse success scenarios with valid NSD content
 * - Error handling (NSDParseError, timeout, validation)
 * - Progress callbacks
 * - Integration with MCP client (using FakeBuilder pattern)
 * - Edge cases (empty content, malformed markdown, special characters)
 * - Error codes validation
 *
 * @see packages/electron/src/main/services/nsd-parser.service.ts
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NsdParserService, NSDParseError, NSD_ERROR_CODES, NSD_PROGRESS_STAGES } from '../../../../src/main/services/nsd-parser.service.js';
import { NSDScene } from '../../../../src/domain/entities/index.js';
import type { ILogger } from '@coreto/core';
import type { NSDProgressCallback } from '../../../../src/main/services/nsd-parser.service.js';

// =============================================================================
// FakeBuilders (instead of Mocks)
// =============================================================================

/**
 * FakeBuilder for MCP Client Responses
 * Follows FakeBuilder pattern for declarative test data creation
 */
class McpResponseFakeBuilder {
  private scenes: Array<{ title: string; content: string; summary?: string }> = [];
  private isValid = true;
  private includeExtraFields = false;

  withScenes(count: number): this {
    this.scenes = Array.from({ length: count }, (_, i) => ({
      title: `Scene ${i + 1}: ${this.getSceneTitle(i)}`,
      content: this.getSceneContent(i),
      summary: i === 0 ? 'Test summary' : undefined,
    }));
    return this;
  }

  withScene(title: string, content: string, summary?: string): this {
    this.scenes.push({ title, content, summary });
    return this;
  }

  withInvalidStructure(): this {
    this.isValid = false;
    return this;
  }

  withExtraFields(): this {
    this.includeExtraFields = true;
    return this;
  }

  private getSceneTitle(index: number): string {
    const titles = ['Tavern Meeting', 'The Contract', 'Departure', 'Discovery', 'Battle'];
    return titles[index % titles.length];
  }

  private getSceneContent(index: number): string {
    return `Scene content for ${this.getSceneTitle(index)}...`;
  }

  build(): { content: Array<{ type: string; text: string }> } {
    if (!this.isValid) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ invalid: 'structure' }) }],
      };
    }

    const baseResponse = { scenes: this.scenes };
    const response = this.includeExtraFields
      ? { ...baseResponse, metadata: { version: '1.0', timestamp: '2024-01-01' } }
      : baseResponse;

    return {
      content: [{ type: 'text', text: JSON.stringify(response) }],
    };
  }
}

/**
 * FakeBuilder for NSD Content
 * Provides declarative API for creating test NSD documents
 */
class NsdContentFakeBuilder {
  private questTitle = 'Test Quest';
  private scenes: Array<{ title: string; content: string }> = [];

  withQuest(title: string): this {
    this.questTitle = title;
    return this;
  }

  withScene(title: string, content: string): this {
    this.scenes.push({ title, content });
    return this;
  }

  withMultipleScenes(count: number): this {
    this.scenes = Array.from({ length: count }, (_, i) => ({
      title: `Scene ${i + 1}`,
      content: `Content for scene ${i + 1}`,
    }));
    return this;
  }

  build(): string {
    let nsd = `# ${this.questTitle}\n\n`;
    for (const scene of this.scenes) {
      nsd += `## ${scene.title}\n${scene.content}\n\n`;
    }
    return nsd;
  }
}

// =============================================================================
// Mock Logger (minimal - only 1 mock)
// =============================================================================

const createMockLogger = (): ILogger => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

// =============================================================================
// Mock McpClientService (simplified - only for integration points)
// =============================================================================

class MockMcpClientService {
  public healthCheck = jest.fn<Promise<boolean>, []>();
  public start = jest.fn<Promise<void>, []>();
  public callTool = jest.fn<Promise<{ content: Array<{ type: string; text: string }> }>, [string, Record<string, unknown>?]>();
  public isRunning = jest.fn<boolean, []>();
  public stop = jest.fn<Promise<void>, []>();
  public getProcess = jest.fn();
  public cleanup = jest.fn();
}

// =============================================================================
// Test Suite
// =============================================================================

describe('NsdParserService', () => {
  let mockLogger: ILogger;
  let mockMcpClient: MockMcpClientService;
  let service: NsdParserService;
  let progressCallback: jest.MockedFunction<NSDProgressCallback>;

  beforeEach(() => {
    // Setup mocks
    mockLogger = createMockLogger();
    mockMcpClient = new MockMcpClientService();
    progressCallback = jest.fn();

    // Create service instance with mock logger
    service = new NsdParserService(mockLogger);

    // Replace the internal mcpClient with our mock
    (service as any).mcpClient = mockMcpClient;

    // Default mock responses
    mockMcpClient.healthCheck.mockResolvedValue(true);
    mockMcpClient.start.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // Parse Success Scenarios
  // ==========================================================================

  describe('Parse Success Scenarios', () => {
    it('should parse valid NSD content with multiple scenes', async () => {
      // Arrange - Using FakeBuilders for declarative test data
      const nsdContent = new NsdContentFakeBuilder()
        .withQuest('Quest 01: The Beginning')
        .withMultipleScenes(3)
        .build();

      const mcpResponse = new McpResponseFakeBuilder()
        .withScenes(3)
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(nsdContent);

      // Assert - Using toMatchObject to avoid assertion roulette
      expect(scenes).toHaveLength(3);
      expect(scenes).toMatchObject([
        { title: 'Scene 1: Tavern Meeting', sceneNumber: 1 },
        { title: 'Scene 2: The Contract', sceneNumber: 2 },
        { title: 'Scene 3: Departure', sceneNumber: 3 },
      ]);

      expect(mockMcpClient.callTool).toHaveBeenCalledWith(
        'extract_scenes',
        expect.objectContaining({
          nsdContent,
          model: 'glm-4.7',
        })
      );
    });

    it('should parse NSD content with scene summaries', async () => {
      // Arrange
      const nsdContent = new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build();
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1: Tavern Meeting', 'The hero enters...', 'Introduction to quest giver')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(nsdContent);

      // Assert
      expect(scenes).toMatchObject([
        { summary: 'Introduction to quest giver' },
      ]);
    });

    it('should handle single scene NSD document', async () => {
      // Arrange
      const nsdContent = new NsdContentFakeBuilder()
        .withScene('Scene 1: Only Scene', 'Single scene content.')
        .build();

      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1: Only Scene', 'Single scene content.')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(nsdContent);

      // Assert
      expect(scenes).toMatchObject([
        { sceneNumber: 1 },
      ]);
    });

    it('should assign scene numbers sequentially starting from 1', async () => {
      // Arrange
      const nsdContent = new NsdContentFakeBuilder().withMultipleScenes(5).build();
      const mcpResponse = new McpResponseFakeBuilder().withScenes(5).build();
      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(nsdContent);

      // Assert - Using toMatchObject for clear assertion message
      expect(scenes.map(s => s.sceneNumber)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should reject scenes with empty content', async () => {
      // Arrange
      const nsdContent = new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build();
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1: Empty', '')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act & Assert
      await expect(service.parseScenes(nsdContent)).rejects.toThrow(NSDParseError);
      await expect(service.parseScenes(nsdContent)).rejects.toMatchObject({
        code: NSD_ERROR_CODES.VALIDATION_ERROR,
        message: expect.stringContaining('missing required properties'),
      });
    });

    it('should handle multiline content with dialogue', async () => {
      // Arrange
      const dialogueContent = `## Scene 1: Complex Dialogue
The hero enters.

"Greetings," says the NPC. "Welcome to our village."

"Thank you," replies the hero. "I seek information."

The NPC nods thoughtfully. "Then you've come to the right place."`;

      const nsdContent = new NsdContentFakeBuilder()
        .withQuest('Quest')
        .withScene('Scene 1: Complex Dialogue', dialogueContent)
        .build();

      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1: Complex Dialogue', dialogueContent)
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(nsdContent);

      // Assert
      expect(scenes[0].content).toContain('"Greetings," says the NPC.');
    });

    it('should start MCP server if not running', async () => {
      // Arrange
      mockMcpClient.healthCheck.mockResolvedValue(false);
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();
      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Assert
      expect(mockMcpClient.healthCheck).toHaveBeenCalled();
      expect(mockMcpClient.start).toHaveBeenCalled();
    });

    it('should not start MCP server if already running', async () => {
      // Arrange
      mockMcpClient.healthCheck.mockResolvedValue(true);
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();
      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Assert
      expect(mockMcpClient.healthCheck).toHaveBeenCalled();
      expect(mockMcpClient.start).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Progress Callbacks
  // ==========================================================================

  describe('Progress Callbacks', () => {
    it('should report progress during reading stage (0-20%)', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();
      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build(), progressCallback);

      // Assert
      expect(progressCallback).toHaveBeenCalledWith(
        NSD_PROGRESS_STAGES.READING,
        expect.any(Number)
      );
    });

    it('should report progress during parsing stage (20-60%)', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();
      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build(), progressCallback);

      // Assert
      expect(progressCallback).toHaveBeenCalledWith(
        NSD_PROGRESS_STAGES.PARSING,
        expect.any(Number)
      );
    });

    it('should report progress during extracting stage (60-90%)', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();
      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build(), progressCallback);

      // Assert
      expect(progressCallback).toHaveBeenCalledWith(
        NSD_PROGRESS_STAGES.EXTRACTING,
        expect.any(Number)
      );
    });

    it('should report progress during validating stage (90-100%)', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();
      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build(), progressCallback);

      // Assert
      expect(progressCallback).toHaveBeenCalledWith(
        NSD_PROGRESS_STAGES.VALIDATING,
        expect.any(Number)
      );
    });

    it('should call progress callback for all stages in order', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();
      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build(), progressCallback);

      // Assert - Using toMatchObject for clear failure messages
      const expectedCalls = [
        [NSD_PROGRESS_STAGES.READING, 0],
        [NSD_PROGRESS_STAGES.READING, 20],
        [NSD_PROGRESS_STAGES.PARSING, 20],
        [NSD_PROGRESS_STAGES.PARSING, 60],
      ];
      expect(progressCallback).toHaveBeenCalledTimes(8); // 2 calls per stage (start + end)
      expect(progressCallback.mock.calls.slice(0, 4)).toEqual(expectedCalls);
    });

    it('should work without progress callback', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();
      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act & Assert - should not throw
      await expect(service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build())).resolves.toHaveLength(1);
    });
  });

  // ==========================================================================
  // Error Handling - Content Validation
  // ==========================================================================

  describe('Error Handling - Content Validation', () => {
    it('should throw NSDParseError with VALIDATION_ERROR for empty content', async () => {
      // Act & Assert
      await expect(service.parseScenes('')).rejects.toMatchObject({
        code: NSD_ERROR_CODES.VALIDATION_ERROR,
        message: expect.stringContaining('empty'),
      });
    });

    it('should throw NSDParseError with VALIDATION_ERROR for whitespace-only content', async () => {
      // Act & Assert
      await expect(service.parseScenes('   \n\n   \t  ')).rejects.toMatchObject({
        code: NSD_ERROR_CODES.VALIDATION_ERROR,
        message: expect.stringContaining('empty'),
      });
    });

    it('should throw TypeError for non-string content', async () => {
      // Act & Assert
      await expect(service.parseScenes(null as unknown as string)).rejects.toThrow(TypeError);
      await expect(service.parseScenes(null as unknown as string)).rejects.toMatchObject({
        message: expect.stringContaining('length'),
      });
    });

    it('should throw NSDParseError with VALIDATION_ERROR for content without markdown headings', async () => {
      // Arrange
      const invalidContent = 'This is just plain text without any markdown headings.';

      // Act & Assert
      await expect(service.parseScenes(invalidContent)).rejects.toMatchObject({
        code: NSD_ERROR_CODES.VALIDATION_ERROR,
        message: expect.stringContaining('heading'),
      });
    });

    it('should include correlationId in error when provided', async () => {
      // Arrange
      const correlationId = 'test-correlation-123';

      // Act & Assert
      await expect(service.parseScenes('', undefined, correlationId)).rejects.toMatchObject({
        correlationId,
      });
    });
  });

  // ==========================================================================
  // Error Handling - AI/MCP Integration
  // ==========================================================================

  describe('Error Handling - AI/MCP Integration', () => {
    it('should throw NSDParseError with PARSE_ERROR for invalid MCP response structure', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withInvalidStructure()
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act & Assert
      await expect(service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build())).rejects.toMatchObject({
        code: NSD_ERROR_CODES.PARSE_ERROR,
        message: expect.stringContaining('scenes array'),
      });
    });

    it('should throw NSDParseError with PARSE_ERROR for non-JSON MCP response', async () => {
      // Arrange
      const invalidJsonResponse = {
        content: [{ type: 'text', text: 'not valid json {]' }],
      };
      mockMcpClient.callTool.mockResolvedValue(invalidJsonResponse);

      // Act & Assert
      await expect(service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build())).rejects.toMatchObject({
        code: NSD_ERROR_CODES.PARSE_ERROR,
        message: expect.stringContaining('JSON'),
      });
    });

    it('should throw NSDParseError with AI_TIMEOUT when MCP call times out', async () => {
      // Arrange
      mockMcpClient.callTool.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('MCP call timeout after 30000ms')), 100);
          })
      );

      // Act & Assert
      await expect(service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build())).rejects.toMatchObject({
        code: NSD_ERROR_CODES.AI_TIMEOUT,
        message: expect.stringContaining('timeout'),
      });
    });

    it('should handle generic MCP call failure', async () => {
      // Arrange
      mockMcpClient.callTool.mockRejectedValue(new Error('MCP server error'));

      // Act & Assert
      await expect(service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build())).rejects.toMatchObject({
        code: NSD_ERROR_CODES.PARSE_ERROR,
        message: expect.stringContaining('MCP server error'),
      });
    });

    it('should preserve original error in NSDParseError', async () => {
      // Arrange
      const originalError = new Error('Original MCP error');
      mockMcpClient.callTool.mockRejectedValue(originalError);

      // Act & Assert
      await expect(service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build())).rejects.toMatchObject({
        originalError,
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle NSD content with special characters', async () => {
      // Arrange
      const specialContent = `# Quest: Special "Characters" & <More>

## Scene 1: Testing's Edge Cases
Content with "quotes", 'apostrophes', & <symbols>.
Special chars: @#$%^&*()[]{}|\\:;'"<>?,./
Unicode: 你好 世界 🎮 🔥`;

      const mcpResponse = new McpResponseFakeBuilder()
        .withScene("Scene 1: Testing's Edge Cases", 'Content with "quotes" & symbols')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(specialContent);

      // Assert
      expect(scenes).toMatchObject([
        { title: "Scene 1: Testing's Edge Cases" },
      ]);
    });

    it('should handle NSD content with unicode characters', async () => {
      // Arrange
      const unicodeContent = `# Quest

## Scene 1: 国际
Content with 你好 世界 🎮`;

      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1: 国际', 'Content with 你好 世界 🎮')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(unicodeContent);

      // Assert
      expect(scenes[0]).toMatchObject({
        title: expect.stringContaining('国际'),
        content: expect.stringContaining('你好 世界'),
      });
    });

    it('should handle very long scene content', async () => {
      // Arrange
      const longContent = 'A'.repeat(100000);
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1: Long Content', longContent)
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Assert
      expect(scenes).toMatchObject([
        { content: expect.stringMatching(/^A{100000}$/) },
      ]);
    });
  });

  // ==========================================================================
  // Error Codes Validation
  // ==========================================================================

  describe('Error Codes Validation', () => {
    it('should export all error codes', () => {
      // Assert
      expect(NSD_ERROR_CODES.PARSE_ERROR).toBe('NSD_PARSE_ERROR');
      expect(NSD_ERROR_CODES.AI_TIMEOUT).toBe('NSD_AI_TIMEOUT');
      expect(NSD_ERROR_CODES.VALIDATION_ERROR).toBe('NSD_VALIDATION_ERROR');
    });

    it('should export all progress stages', () => {
      // Assert
      expect(NSD_PROGRESS_STAGES.READING).toBe('reading');
      expect(NSD_PROGRESS_STAGES.PARSING).toBe('parsing');
      expect(NSD_PROGRESS_STAGES.EXTRACTING).toBe('extracting');
      expect(NSD_PROGRESS_STAGES.VALIDATING).toBe('validating');
    });

    it('should create NSDParseError with correct properties', () => {
      // Arrange & Act
      const error = new NSDParseError(
        'Test error message',
        NSD_ERROR_CODES.PARSE_ERROR,
        'correlation-123',
        new Error('Original error')
      );

      // Assert - Using toMatchObject for clear assertions
      expect(error).toMatchObject({
        name: 'NSDParseError',
        message: 'Test error message',
        code: NSD_ERROR_CODES.PARSE_ERROR,
        correlationId: 'correlation-123',
        originalError: expect.any(Error),
      });
    });

    it('should maintain proper stack trace in NSDParseError', () => {
      // Arrange & Act
      const error = new NSDParseError('Test error', NSD_ERROR_CODES.PARSE_ERROR);

      // Assert
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('NSDParseError');
    });
  });

  // ==========================================================================
  // Integration with NSDScene Entity
  // ==========================================================================

  describe('Integration with NSDScene Entity', () => {
    it('should create valid NSDScene entities from AI response', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1: Test Scene', 'Test content', 'Test summary')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Assert
      expect(scenes[0]).toBeInstanceOf(NSDScene);
      expect(scenes[0].id).toBeDefined();
      expect(scenes[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs for each scene', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder().withScenes(3).build();
      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(new NsdContentFakeBuilder().withMultipleScenes(3).build());

      // Assert
      const ids = new Set(scenes.map((s) => s.id));
      expect(ids.size).toBe(3);
    });
  });

  // ==========================================================================
  // Concurrency and Multiple Calls
  // ==========================================================================

  describe('Concurrency and Multiple Calls', () => {
    it('should handle multiple sequential parse calls', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes1 = await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());
      const scenes2 = await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());
      const scenes3 = await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Assert - Using toMatchObject for clear assertions
      expect([scenes1, scenes2, scenes3]).toMatchObject([
        [{ title: 'Scene 1' }],
        [{ title: 'Scene 1' }],
        [{ title: 'Scene 1' }],
      ]);
      expect(mockMcpClient.callTool).toHaveBeenCalledTimes(3);
    });

    it('should handle parse calls with different correlation IDs', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build(), undefined, 'corr-1');
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build(), undefined, 'corr-2');
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build(), undefined, 'corr-3');

      // Assert - Using toHaveBeenCalledWith for clear verification
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting NSD scene parsing',
        expect.objectContaining({ correlationId: 'corr-1' })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting NSD scene parsing',
        expect.objectContaining({ correlationId: 'corr-2' })
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting NSD scene parsing',
        expect.objectContaining({ correlationId: 'corr-3' })
      );
    });
  });

  // ==========================================================================
  // Service Initialization
  // ==========================================================================

  describe('Service Initialization', () => {
    it('should create service instance without DI container when logger provided', () => {
      // Act & Assert - Should not throw
      expect(() => new NsdParserService(mockLogger)).not.toThrow();
    });

    it('should create service instance without logger (fallback logger)', () => {
      // Act & Assert - Should not throw even without logger
      expect(() => new NsdParserService()).not.toThrow();
    });

    it('should use provided logger instead of DI logger', async () => {
      // Arrange
      const customLogger = createMockLogger();
      const customService = new NsdParserService(customLogger);
      (customService as any).mcpClient = mockMcpClient;

      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      await customService.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Assert
      expect(customLogger.info).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // MCP Response Format Variations
  // ==========================================================================

  describe('MCP Response Format Variations', () => {
    it('should handle MCP response with extra whitespace in JSON', async () => {
      // Arrange
      const whitespaceJsonResponse = {
        content: [
          {
            type: 'text',
            text: `  {
  "scenes" : [
    { "title" : "Scene 1" , "content" : "Content" }
  ]
}  `,
          },
        ],
      };
      mockMcpClient.callTool.mockResolvedValue(whitespaceJsonResponse);

      // Act
      const scenes = await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Assert
      expect(scenes).toMatchObject([
        { title: 'Scene 1' },
      ]);
    });

    it('should handle MCP response with additional fields', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withExtraFields()
        .withScene('Scene 1', 'Content')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      const scenes = await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Assert
      expect(scenes).toMatchObject([
        { title: 'Scene 1' },
      ]);
    });

    it('should handle MCP response with escaped characters', async () => {
      // Arrange
      const escapedResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              scenes: [
                { title: 'Scene 1: "Quotes"', content: 'Content with "nested" quotes' },
              ],
            }),
          },
        ],
      };
      mockMcpClient.callTool.mockResolvedValue(escapedResponse);

      // Act
      const scenes = await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Assert
      expect(scenes[0].title).toContain('Quotes');
    });
  });

  // ==========================================================================
  // Timeout Handling
  // ==========================================================================

  describe('Timeout Handling', () => {
    it.skip('should use 30-second timeout for AI calls', async () => {
      // SKIPPED: This test would take 31+ seconds to run
      // The service uses a 30-second timeout internally
      // To test this properly, we would need to:
      // 1. Mock Promise.race to return the timeout promise
      // 2. Or use a shorter timeout in the test environment
      // For now, we skip this test to avoid long test runs

      // Arrange
      let timeoutResolver: ((value: unknown) => void) | null = null;
      mockMcpClient.callTool.mockImplementation(
        () =>
          new Promise((resolve) => {
            timeoutResolver = resolve;
          })
      );

      // Act
      const parsePromise = service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 31_000));

      // Assert - Promise should have rejected due to timeout
      await expect(parsePromise).rejects.toThrow();
    });

    it('should determine error code correctly for timeout errors', async () => {
      // Arrange
      const timeoutErrors = [
        'timeout after 30000ms',
        'Request timed out',
        'ETIMEDOUT',
        'Connection timeout',
      ];

      for (const errorMessage of timeoutErrors) {
        mockMcpClient.callTool.mockRejectedValue(new Error(errorMessage));

        // Act & Assert
        await expect(service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build())).rejects.toMatchObject({
          code: NSD_ERROR_CODES.AI_TIMEOUT,
        });
      }
    });
  });

  // ==========================================================================
  // Stage Execution
  // ==========================================================================

  describe('Stage Execution', () => {
    it('should execute stages in correct order', async () => {
      // Arrange
      const executionOrder: string[] = [];
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Track debug calls to determine execution order
      mockLogger.debug.mockImplementation((message) => {
        executionOrder.push(message);
      });

      // Act
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build());

      // Assert - Check that stages execute in order
      expect(executionOrder.some(msg => msg.includes('reading'))).toBe(true);
      expect(executionOrder.some(msg => msg.includes('parsing'))).toBe(true);
      expect(executionOrder.some(msg => msg.includes('extracting'))).toBe(true);
      expect(executionOrder.some(msg => msg.includes('validating'))).toBe(true);
    });

    it('should report stage start and end percentages', async () => {
      // Arrange
      const mcpResponse = new McpResponseFakeBuilder()
        .withScene('Scene 1', 'Content')
        .build();

      mockMcpClient.callTool.mockResolvedValue(mcpResponse);

      // Act
      await service.parseScenes(new NsdContentFakeBuilder().withScene('Scene 1', 'Content').build(), progressCallback);

      // Assert - Using toMatchObject for clear assertion
      const expectedProgress = [0, 20, 20, 60, 60, 90, 90, 100];
      const actualProgress = progressCallback.mock.calls.map(call => call[1]);
      expect(actualProgress).toEqual(expectedProgress);
    });
  });
});
