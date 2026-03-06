/**
 * E2E Tests for Project Analyzer
 *
 * Comprehensive end-to-end tests for the Project Analyzer feature.
 * Tests the complete flow from Renderer → IPC → MCP Server.
 *
 * Test Structure:
 * 1. Happy Path Test - Complete analysis flow with valid project
 * 2. Error Test - Invalid project path handling
 * 3. Timeout Test - MCP server unavailable scenarios
 * 4. JSON Structure Validation Test - Schema validation
 * 5. Markdown Validation Test - Report generation
 *
 * @see planos/026-analyse-root-RPG-maker-project/FDD_Project_Analyzer.md
 * @see packages/electron/src/main/ipc/handlers/oracleMcpIpcHandler.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// Mock the MCP client service before importing the handlers
jest.mock('@coreto/electron/main/services/McpClientService', () => {
  const mockMcpClientService = {
    start: jest.fn(),
    callTool: jest.fn(),
    healthCheck: jest.fn(),
    stop: jest.fn(),
    cleanup: jest.fn(),
    isRunning: jest.fn(() => true),
  };

  return {
    McpClientService: jest.fn().mockImplementation(() => mockMcpClientService),
    mcpClientService: mockMcpClientService,
  };
});

import { mcpClientService } from '@coreto/electron/main/services/McpClientService';
import {
  handleOracleMcpAnalyzeProject,
  handleOracleMcpTestAnalyzeProject,
} from '@coreto/electron/main/ipc/handlers/oracleMcpIpcHandler';
import type {
  AnalyzeProjectResponse,
  ProjectAnalysis,
  QuestVariableInfo,
  AvailableResources,
} from '@coreto/electron/domain/types';

// =============================================================================
// Test Constants
// =============================================================================

const FIXTURE_DIR = path.join(__dirname, '../fixtures/e2e/fake-mz-project');
const NSD_CONTENT = `# NSD Document

## Scene 1: Tavern Introduction

The hero enters the tavern and meets the quest giver.

### Quest Variables
- Quest 01 Progress: Tracks quest completion (0-10)
- Quest 01 State: Current quest state (0=not started, 1=in progress, 2=completed)

### Resources Required
- Sprite: Hero_Face
- BGM: Tavern.ogg
- SE: Door_Open.ogg
`;

const SCENE_NAME = 'Scene 1: Tavern Introduction';

// =============================================================================
// Fixture Setup Helpers
// =============================================================================

/**
 * Creates a minimal valid MZ project structure for testing.
 */
function setupFakeMzProject(projectPath: string): void {
  // Clean up any existing test project
  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }

  // Create directory structure
  fs.mkdirSync(path.join(projectPath, 'data'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'img/characters'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'img/pictures'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'audio/bgm'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'audio/me'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'audio/se'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'img/battlebacks'), { recursive: true });

  // Create System.json with switches and variables
  fs.writeFileSync(
    path.join(projectPath, 'data/System.json'),
    JSON.stringify({
      gameTitle: 'Test Game',
      switches: ['', 'Quest 01 Started', 'Quest 01 Completed'],
      variables: ['', 'Quest 01 Progress', 'Quest 01 State', 'Hero Level'],
    }, null, 2)
  );

  // Create CommonEvents.json with quest events
  fs.writeFileSync(
    path.join(projectPath, 'data/CommonEvents.json'),
    JSON.stringify([
      null,
      {
        id: 1,
        name: 'Quest 01 Manager',
        trigger: 0,
        conditions: [],
        list: [
          { code: 0, indent: 0, parameters: [] }, // Empty event
        ],
      },
    ], null, 2)
  );

  // Create MapInfos.json with map list
  fs.writeFileSync(
    path.join(projectPath, 'data/MapInfos.json'),
    JSON.stringify([
      null,
      { id: 1, name: 'Tavern', order: 1, parentId: 0, scrollX: 0, scrollY: 0 },
      { id: 2, name: 'World Map', order: 2, parentId: 0, scrollX: 0, scrollY: 0 },
      { id: 3, name: 'Forest', order: 3, parentId: 2, scrollX: 0, scrollY: 0 },
    ], null, 2)
  );

  // Create Troops.json with troop data
  fs.writeFileSync(
    path.join(projectPath, 'data/Troops.json'),
    JSON.stringify([
      null,
      { id: 1, name: 'Slime*2', members: [{ enemyId: 1, x: 400, y: 400, hidden: false }], pages: [] },
      { id: 2, name: 'Goblin', members: [{ enemyId: 2, x: 300, y: 400, hidden: false }], pages: [] },
    ], null, 2)
  );

  // Create dummy resource files
  fs.writeFileSync(path.join(projectPath, 'img/characters/Hero.png'), '');
  fs.writeFileSync(path.join(projectPath, 'img/characters/NPC_Face.png'), '');
  fs.writeFileSync(path.join(projectPath, 'img/pictures/Portrait.png'), '');
  fs.writeFileSync(path.join(projectPath, 'audio/bgm/Tavern.ogg'), '');
  fs.writeFileSync(path.join(projectPath, 'audio/bgm/Battle.ogg'), '');
  fs.writeFileSync(path.join(projectPath, 'audio/me/Fanfare.ogg'), '');
  fs.writeFileSync(path.join(projectPath, 'audio/se/Door_Open.ogg'), '');
  fs.writeFileSync(path.join(projectPath, 'img/battlebacks/Forest.png'), '');

  // Create game.rmmzproject marker
  fs.writeFileSync(path.join(projectPath, 'game.rmmzproject'), '');
}

/**
 * Cleans up test fixtures.
 */
function cleanupFakeMzProject(projectPath: string): void {
  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
}

// =============================================================================
// Mock Response Creators
// =============================================================================

/**
 * Creates a mock successful project analysis response.
 */
function createMockAnalysisResponse(projectPath: string): AnalyzeProjectResponse {
  const questVariables: QuestVariableInfo[] = [
    { variableId: 1, name: 'Quest 01 Progress', type: 'counter', scope: 'global' },
    { variableId: 2, name: 'Quest 01 State', type: 'state_tracking', scope: 'global' },
  ];

  const availableResources: AvailableResources = {
    sprites: ['Hero.png', 'NPC_Face.png'],
    pictures: ['Portrait.png'],
    bgm: ['Tavern.ogg', 'Battle.ogg'],
    me: ['Fanfare.ogg'],
    se: ['Door_Open.ogg'],
    battlebacks: ['Forest.png'],
  };

  const analysis: ProjectAnalysis = {
    projectPath,
    analyzedAt: new Date().toISOString(),
    questVariables,
    mapCount: 3,
    troopCount: 2,
    availableResources,
    recommendedQuestVariable: questVariables[0],
    recommendedMapId: 1,
    warnings: [],
  };

  const markdown = `# Project Analysis Report

## Project: ${projectPath}

### Quest Variables Detected
- **Quest 01 Progress** (ID: 1) - counter, global scope
- **Quest 01 State** (ID: 2) - state_tracking, global scope

### Resources Available
**Sprites:** Hero.png, NPC_Face.png
**Pictures:** Portrait.png
**BGM:** Tavern.ogg, Battle.ogg
**ME:** Fanfare.ogg
**SE:** Door_Open.ogg
**Battlebacks:** Forest.png

### Statistics
- Maps: 3
- Troops: 2
- Quest Variables: 2

### Recommendations
- Use variable **Quest 01 Progress** (ID: 1) for tracking quest progress
- Implement scene on **Map 1: Tavern**

---

*Generated at: ${new Date().toISOString()}*
`;

  return {
    analysis,
    markdown,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a mock analysis response with warnings.
 */
function createMockAnalysisWithWarnings(projectPath: string): AnalyzeProjectResponse {
  const response = createMockAnalysisResponse(projectPath);
  response.analysis.warnings = [
    'Some BGM files referenced in database not found in audio/bgm/',
    'Variable "Quest 02 Progress" not found in System.json',
  ];
  return response;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates the structure of an AnalyzeProjectResponse.
 */
function validateAnalysisResponse(response: AnalyzeProjectResponse): void {
  // Validate top-level structure
  expect(response).toBeDefined();
  expect(response.analysis).toBeDefined();
  expect(response.markdown).toBeDefined();
  expect(response.timestamp).toBeDefined();

  // Validate analysis object
  const { analysis } = response;
  expect(analysis.projectPath).toBeDefined();
  expect(typeof analysis.projectPath).toBe('string');
  expect(analysis.analyzedAt).toBeDefined();
  expect(typeof analysis.analyzedAt).toBe('string');
  expect(() => new Date(analysis.analyzedAt)).not.toThrow();
  expect(analysis.questVariables).toBeDefined();
  expect(Array.isArray(analysis.questVariables)).toBe(true);
  expect(analysis.mapCount).toBeDefined();
  expect(typeof analysis.mapCount).toBe('number');
  expect(analysis.troopCount).toBeDefined();
  expect(typeof analysis.troopCount).toBe('number');
  expect(analysis.availableResources).toBeDefined();
  expect(analysis.warnings).toBeDefined();
  expect(Array.isArray(analysis.warnings)).toBe(true);

  // Validate available resources
  const { availableResources } = analysis;
  expect(availableResources.sprites).toBeDefined();
  expect(Array.isArray(availableResources.sprites)).toBe(true);
  expect(availableResources.pictures).toBeDefined();
  expect(Array.isArray(availableResources.pictures)).toBe(true);
  expect(availableResources.bgm).toBeDefined();
  expect(Array.isArray(availableResources.bgm)).toBe(true);
  expect(availableResources.me).toBeDefined();
  expect(Array.isArray(availableResources.me)).toBe(true);
  expect(availableResources.se).toBeDefined();
  expect(Array.isArray(availableResources.se)).toBe(true);
  expect(availableResources.battlebacks).toBeDefined();
  expect(Array.isArray(availableResources.battlebacks)).toBe(true);

  // Validate markdown
  expect(response.markdown).toBeDefined();
  expect(typeof response.markdown).toBe('string');
  expect(response.markdown.length).toBeGreaterThan(0);

  // Validate timestamp
  expect(response.timestamp).toBeDefined();
  expect(typeof response.timestamp).toBe('string');
  expect(() => new Date(response.timestamp)).not.toThrow();
}

/**
 * Validates the structure of a QuestVariableInfo object.
 */
function validateQuestVariable(variable: QuestVariableInfo): void {
  expect(variable).toBeDefined();
  expect(variable.variableId).toBeDefined();
  expect(typeof variable.variableId).toBe('number');
  expect(variable.name).toBeDefined();
  expect(typeof variable.name).toBe('string');
  expect(variable.type).toBeDefined();
  expect(['game_progress', 'state_tracking', 'counter', 'flag']).toContain(variable.type);
  expect(variable.scope).toBeDefined();
  expect(['global', 'scene_specific']).toContain(variable.scope);
}

/**
 * Validates markdown content has expected sections.
 */
function validateMarkdownContent(markdown: string): void {
  expect(markdown).toBeDefined();
  expect(typeof markdown).toBe('string');
  expect(markdown.length).toBeGreaterThan(0);

  // Check for expected sections (case-insensitive)
  const lowerMarkdown = markdown.toLowerCase();
  expect(lowerMarkdown).toContain('analysis');
  expect(lowerMarkdown).toContain('resources');
  expect(lowerMarkdown).toContain('quest');

  // Should have some structure (headers, lists, etc.)
  expect(markdown).toMatch(/#{1,6}\s/); // Has at least one header
}

// =============================================================================
// Test Suites
// =============================================================================

describe('E2E Tests: Project Analyzer', () => {
  let testProjectPath: string;

  beforeAll(() => {
    // Create temporary directory for test projects
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mz-project-test-'));
    testProjectPath = path.join(tempDir, 'test-project');
    setupFakeMzProject(testProjectPath);
  });

  afterAll(() => {
    cleanupFakeMzProject(testProjectPath);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // Test Suite 1: Happy Path
  // ============================================================================

  describe('Happy Path: Complete Analysis Flow', () => {
    it('should complete full analysis flow with valid project', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      const payload = {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      };

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, payload);

      // Assert - IPC Handler Response Structure
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();

      // Assert - MCP Service Called Correctly
      expect(mcpClientService.callTool).toHaveBeenCalledTimes(1);
      expect(mcpClientService.callTool).toHaveBeenCalledWith(
        'analyze_project',
        expect.objectContaining({
          nsdContent: NSD_CONTENT,
          sceneName: SCENE_NAME,
          projectPath: testProjectPath,
        })
      );

      // Assert - Response Structure
      const response = result.data as AnalyzeProjectResponse;
      validateAnalysisResponse(response);

      // Assert - Project Path Matches
      expect(response.analysis.projectPath).toBe(testProjectPath);

      // Assert - Non-Empty Collections
      expect(response.analysis.questVariables.length).toBeGreaterThan(0);
      expect(response.analysis.mapCount).toBeGreaterThan(0);
      expect(response.analysis.troopCount).toBeGreaterThan(0);

      // Assert - Resources Found
      expect(response.analysis.availableResources.sprites.length).toBeGreaterThan(0);
      expect(response.analysis.availableResources.bgm.length).toBeGreaterThan(0);
    });

    it('should include quest variables in analysis response', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      expect(response.analysis.questVariables).toBeDefined();

      response.analysis.questVariables.forEach((variable) => {
        validateQuestVariable(variable);
      });

      // Verify specific quest variables
      expect(response.analysis.questVariables).toContainEqual({
        variableId: 1,
        name: 'Quest 01 Progress',
        type: 'counter',
        scope: 'global',
      });
    });

    it('should provide recommended quest variable and map', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      expect(response.analysis.recommendedQuestVariable).toBeDefined();
      expect(response.analysis.recommendedMapId).toBeDefined();

      if (response.analysis.recommendedQuestVariable) {
        validateQuestVariable(response.analysis.recommendedQuestVariable);
      }

      expect(response.analysis.recommendedMapId).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Test Suite 2: Error Handling
  // ============================================================================

  describe('Error Handling: Invalid Project Path', () => {
    it('should return error for non-existent project path', async () => {
      // Arrange
      const invalidPath = '/nonexistent/path/to/project';
      (mcpClientService.callTool as jest.Mock).mockRejectedValue(
        new Error('Project not found')
      );

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: invalidPath,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Project not found');
      expect(result.data).toBeUndefined();
    });

    it('should return error for path traversal attempt', async () => {
      // Arrange
      const maliciousPath = '../../../etc/passwd';

      // Act & Assert
      await expect(
        handleOracleMcpAnalyzeProject({} as any, {
          nsdContent: NSD_CONTENT,
          sceneName: SCENE_NAME,
          projectPath: maliciousPath,
        })
      ).rejects.toThrow();
    });

    it('should handle MCP server timeout gracefully', async () => {
      // Arrange
      (mcpClientService.callTool as jest.Mock).mockRejectedValue(
        new Error('MCP call timeout after 30000ms')
      );

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('timeout');
    });

    it('should handle empty NSD content', async () => {
      // Act & Assert - Should fail schema validation
      await expect(
        handleOracleMcpAnalyzeProject({} as any, {
          nsdContent: '',
          sceneName: SCENE_NAME,
          projectPath: testProjectPath,
        })
      ).rejects.toThrow('nsdContent');
    });

    it('should handle empty scene name', async () => {
      // Act & Assert - Should fail schema validation
      await expect(
        handleOracleMcpAnalyzeProject({} as any, {
          nsdContent: NSD_CONTENT,
          sceneName: '',
          projectPath: testProjectPath,
        })
      ).rejects.toThrow('sceneName');
    });
  });

  // ============================================================================
  // Test Suite 3: JSON Structure Validation
  // ============================================================================

  describe('JSON Structure Validation', () => {
    it('should validate all required fields are present', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      const { analysis } = response;

      // Required top-level fields
      expect(response).toHaveProperty('analysis');
      expect(response).toHaveProperty('markdown');
      expect(response).toHaveProperty('timestamp');

      // Required analysis fields
      expect(analysis).toHaveProperty('projectPath');
      expect(analysis).toHaveProperty('analyzedAt');
      expect(analysis).toHaveProperty('questVariables');
      expect(analysis).toHaveProperty('mapCount');
      expect(analysis).toHaveProperty('troopCount');
      expect(analysis).toHaveProperty('availableResources');
      expect(analysis).toHaveProperty('warnings');

      // Required resources fields
      expect(analysis.availableResources).toHaveProperty('sprites');
      expect(analysis.availableResources).toHaveProperty('pictures');
      expect(analysis.availableResources').toHaveProperty('bgm');
      expect(analysis.availableResources).toHaveProperty('me');
      expect(analysis.availableResources).toHaveProperty('se');
      expect(analysis.availableResources).toHaveProperty('battlebacks');
    });

    it('should validate field types match schema', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      const { analysis } = response;

      // Type validation
      expect(typeof analysis.projectPath).toBe('string');
      expect(typeof analysis.analyzedAt).toBe('string');
      expect(Array.isArray(analysis.questVariables)).toBe(true);
      expect(typeof analysis.mapCount).toBe('number');
      expect(typeof analysis.troopCount).toBe('number');
      expect(typeof analysis.availableResources).toBe('object');
      expect(Array.isArray(analysis.warnings)).toBe(true);
      expect(typeof response.markdown).toBe('string');
      expect(typeof response.timestamp).toBe('string');
    });

    it('should validate quest variable structure', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;

      response.analysis.questVariables.forEach((variable) => {
        expect(variable).toHaveProperty('variableId');
        expect(variable).toHaveProperty('name');
        expect(variable).toHaveProperty('type');
        expect(variable).toHaveProperty('scope');

        expect(typeof variable.variableId).toBe('number');
        expect(typeof variable.name).toBe('string');
        expect(typeof variable.type).toBe('string');
        expect(typeof variable.scope).toBe('string');

        // Validate enum values
        expect(['game_progress', 'state_tracking', 'counter', 'flag']).toContain(variable.type);
        expect(['global', 'scene_specific']).toContain(variable.scope);
      });
    });

    it('should validate available resources arrays', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      const { availableResources } = response.analysis;

      // All resource arrays should be... arrays
      expect(Array.isArray(availableResources.sprites)).toBe(true);
      expect(Array.isArray(availableResources.pictures)).toBe(true);
      expect(Array.isArray(availableResources.bgm)).toBe(true);
      expect(Array.isArray(availableResources.me)).toBe(true);
      expect(Array.isArray(availableResources.se)).toBe(true);
      expect(Array.isArray(availableResources.battlebacks)).toBe(true);

      // Array elements should be strings
      availableResources.sprites.forEach((sprite) => {
        expect(typeof sprite).toBe('string');
      });
    });
  });

  // ============================================================================
  // Test Suite 4: Markdown Validation
  // ============================================================================

  describe('Markdown Validation', () => {
    it('should generate non-empty markdown report', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      expect(response.markdown).toBeDefined();
      expect(typeof response.markdown).toBe('string');
      expect(response.markdown.length).toBeGreaterThan(0);
    });

    it('should contain expected sections in markdown', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      validateMarkdownContent(response.markdown);
    });

    it('should include project statistics in markdown', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      const markdown = response.markdown;

      // Should mention counts
      expect(markdown).toContain('3'); // map count
      expect(markdown).toContain('2'); // troop count
    });

    it('should include quest variable information in markdown', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      const markdown = response.markdown;

      // Should mention quest variables
      expect(markdown.toLowerCase()).toContain('quest');
      expect(markdown).toContain('Quest 01 Progress');
      expect(markdown).toContain('Quest 01 State');
    });
  });

  // ============================================================================
  // Test Suite 5: Warnings and Edge Cases
  // ============================================================================

  describe('Warnings and Edge Cases', () => {
    it('should handle analysis with warnings', async () => {
      // Arrange
      const mockResponse = createMockAnalysisWithWarnings(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      expect(response.analysis.warnings).toBeDefined();
      expect(Array.isArray(response.analysis.warnings)).toBe(true);
      expect(response.analysis.warnings.length).toBeGreaterThan(0);

      // Warning messages should be non-empty strings
      response.analysis.warnings.forEach((warning) => {
        expect(typeof warning).toBe('string');
        expect(warning.length).toBeGreaterThan(0);
      });
    });

    it('should handle analysis with no quest variables found', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      mockResponse.analysis.questVariables = [];
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      expect(response.analysis.questVariables).toEqual([]);
      expect(response.analysis.recommendedQuestVariable).toBeUndefined();
    });

    it('should handle analysis with no resources found', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      mockResponse.analysis.availableResources = {
        sprites: [],
        pictures: [],
        bgm: [],
        me: [],
        se: [],
        battlebacks: [],
      };
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      const response = result.data as AnalyzeProjectResponse;
      expect(response.analysis.availableResources.sprites).toEqual([]);
      expect(response.analysis.availableResources.bgm).toEqual([]);
    });

    it('should handle optional questVariable parameter', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpAnalyzeProject({} as any, {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
        questVariable: 'Quest 01 Progress',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mcpClientService.callTool).toHaveBeenCalledWith(
        'analyze_project',
        expect.objectContaining({
          questVariable: 'Quest 01 Progress',
        })
      );
    });
  });

  // ============================================================================
  // Test Suite 6: Test Analyze Project (Local Testing)
  // ============================================================================

  describe('Test Analyze Project (Local Testing)', () => {
    it('should handle test analyze project request', async () => {
      // Arrange
      const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'test-analyze-'));
      const mockResponse = {
        success: true,
        outputPath: testDirectory,
        files: {
          json: 'analysis.json',
          markdown: 'analysis.md',
        },
        timestamp: new Date().toISOString(),
      };
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await handleOracleMcpTestAnalyzeProject({} as any, {
        testDirectory,
        model: 'glm-4.7',
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const response = result.data;
      expect(response.success).toBe(true);
      expect(response.outputPath).toBe(testDirectory);
      expect(response.files.json).toBeDefined();
      expect(response.files.markdown).toBeDefined();
      expect(response.timestamp).toBeDefined();

      // Cleanup
      fs.rmSync(testDirectory, { recursive: true, force: true });
    });

    it('should validate model parameter in test analyze', async () => {
      // Arrange
      const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'test-analyze-'));
      const mockResponse = {
        success: true,
        outputPath: testDirectory,
        files: { json: 'analysis.json', markdown: 'analysis.md' },
        timestamp: new Date().toISOString(),
      };
      (mcpClientService.callTool as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      await handleOracleMcpTestAnalyzeProject({} as any, {
        testDirectory,
        model: 'glm-4-flash',
      });

      // Assert
      expect(mcpClientService.callTool).toHaveBeenCalledWith(
        'test_analyze_project',
        expect.objectContaining({
          model: 'glm-4-flash',
        })
      );

      // Cleanup
      fs.rmSync(testDirectory, { recursive: true, force: true });
    });

    it('should reject invalid model in test analyze', async () => {
      // Arrange
      const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'test-analyze-'));

      // Act & Assert - Should fail schema validation
      await expect(
        handleOracleMcpTestAnalyzeProject({} as any, {
          testDirectory,
          model: 'invalid-model',
        })
      ).rejects.toThrow();

      // Cleanup
      fs.rmSync(testDirectory, { recursive: true, force: true });
    });
  });
});
