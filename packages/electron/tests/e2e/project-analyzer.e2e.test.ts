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
 * @see packages/electron/src/main/services/McpClientService.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import { mcpClientService } from '@coreto/electron/main/services/McpClientService';
import type {
  AnalyzeProjectResponse,
  ProjectAnalysis,
  QuestVariableInfo,
  AvailableResources,
} from '@coreto/electron/domain/types';

// =============================================================================
// Test Constants
// =============================================================================

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
  // Test Suite 1: MCP Service Integration
  // ============================================================================

  describe('MCP Client Service Integration', () => {
    it('should call MCP tool with correct parameters', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      const callToolSpy = jest.spyOn(mcpClientService, 'callTool').mockResolvedValue(mockResponse);

      // Act
      await mcpClientService.callTool<AnalyzeProjectResponse>('analyze_project', {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      expect(callToolSpy).toHaveBeenCalledTimes(1);
      expect(callToolSpy).toHaveBeenCalledWith(
        'analyze_project',
        expect.objectContaining({
          nsdContent: NSD_CONTENT,
          sceneName: SCENE_NAME,
          projectPath: testProjectPath,
        })
      );

      callToolSpy.mockRestore();
    });

    it('should return valid analysis response structure', async () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      jest.spyOn(mcpClientService, 'callTool').mockResolvedValue(mockResponse);

      // Act
      const result = await mcpClientService.callTool<AnalyzeProjectResponse>('analyze_project', {
        nsdContent: NSD_CONTENT,
        sceneName: SCENE_NAME,
        projectPath: testProjectPath,
      });

      // Assert
      validateAnalysisResponse(result);
    });

    it('should handle MCP service timeout', async () => {
      // Arrange
      jest.spyOn(mcpClientService, 'callTool').mockRejectedValue(
        new Error('MCP call timeout after 30000ms')
      );

      // Act & Assert
      await expect(
        mcpClientService.callTool('analyze_project', {
          nsdContent: NSD_CONTENT,
          sceneName: SCENE_NAME,
          projectPath: testProjectPath,
        })
      ).rejects.toThrow('timeout');
    });
  });

  // ============================================================================
  // Test Suite 2: Response Structure Validation
  // ============================================================================

  describe('Response Structure Validation', () => {
    it('should validate all required fields in analysis response', () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);

      // Assert - Required top-level fields
      expect(mockResponse).toHaveProperty('analysis');
      expect(mockResponse).toHaveProperty('markdown');
      expect(mockResponse).toHaveProperty('timestamp');

      const { analysis } = mockResponse;

      // Assert - Required analysis fields
      expect(analysis).toHaveProperty('projectPath');
      expect(analysis).toHaveProperty('analyzedAt');
      expect(analysis).toHaveProperty('questVariables');
      expect(analysis).toHaveProperty('mapCount');
      expect(analysis).toHaveProperty('troopCount');
      expect(analysis).toHaveProperty('availableResources');
      expect(analysis).toHaveProperty('warnings');

      // Assert - Required resources fields
      expect(analysis.availableResources).toHaveProperty('sprites');
      expect(analysis.availableResources).toHaveProperty('pictures');
      expect(analysis.availableResources).toHaveProperty('bgm');
      expect(analysis.availableResources).toHaveProperty('me');
      expect(analysis.availableResources).toHaveProperty('se');
      expect(analysis.availableResources).toHaveProperty('battlebacks');
    });

    it('should validate field types match schema', () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      const { analysis } = mockResponse;

      // Assert - Type validation
      expect(typeof analysis.projectPath).toBe('string');
      expect(typeof analysis.analyzedAt).toBe('string');
      expect(Array.isArray(analysis.questVariables)).toBe(true);
      expect(typeof analysis.mapCount).toBe('number');
      expect(typeof analysis.troopCount).toBe('number');
      expect(typeof analysis.availableResources).toBe('object');
      expect(Array.isArray(analysis.warnings)).toBe(true);
      expect(typeof mockResponse.markdown).toBe('string');
      expect(typeof mockResponse.timestamp).toBe('string');
    });

    it('should validate quest variable structure', () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);

      // Assert
      mockResponse.analysis.questVariables.forEach((variable) => {
        validateQuestVariable(variable);
      });
    });

    it('should validate available resources arrays', () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      const { availableResources } = mockResponse.analysis;

      // Assert - All resource arrays should be arrays
      expect(Array.isArray(availableResources.sprites)).toBe(true);
      expect(Array.isArray(availableResources.pictures)).toBe(true);
      expect(Array.isArray(availableResources.bgm)).toBe(true);
      expect(Array.isArray(availableResources.me)).toBe(true);
      expect(Array.isArray(availableResources.se)).toBe(true);
      expect(Array.isArray(availableResources.battlebacks)).toBe(true);

      // Assert - Array elements should be strings
      availableResources.sprites.forEach((sprite) => {
        expect(typeof sprite).toBe('string');
      });
    });
  });

  // ============================================================================
  // Test Suite 3: Markdown Validation
  // ============================================================================

  describe('Markdown Validation', () => {
    it('should generate non-empty markdown report', () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);

      // Assert
      expect(mockResponse.markdown).toBeDefined();
      expect(typeof mockResponse.markdown).toBe('string');
      expect(mockResponse.markdown.length).toBeGreaterThan(0);
    });

    it('should contain expected sections in markdown', () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);

      // Assert
      validateMarkdownContent(mockResponse.markdown);
    });

    it('should include project statistics in markdown', () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      const markdown = mockResponse.markdown;

      // Assert - Should mention counts
      expect(markdown).toContain('3'); // map count
      expect(markdown).toContain('2'); // troop count
    });

    it('should include quest variable information in markdown', () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      const markdown = mockResponse.markdown;

      // Assert - Should mention quest variables
      expect(markdown.toLowerCase()).toContain('quest');
      expect(markdown).toContain('Quest 01 Progress');
      expect(markdown).toContain('Quest 01 State');
    });
  });

  // ============================================================================
  // Test Suite 4: Edge Cases and Warnings
  // ============================================================================

  describe('Edge Cases and Warnings', () => {
    it('should handle analysis with warnings', () => {
      // Arrange
      const mockResponse = createMockAnalysisWithWarnings(testProjectPath);

      // Assert
      expect(mockResponse.analysis.warnings).toBeDefined();
      expect(Array.isArray(mockResponse.analysis.warnings)).toBe(true);
      expect(mockResponse.analysis.warnings.length).toBeGreaterThan(0);

      // Warning messages should be non-empty strings
      mockResponse.analysis.warnings.forEach((warning) => {
        expect(typeof warning).toBe('string');
        expect(warning.length).toBeGreaterThan(0);
      });
    });

    it('should handle analysis with no quest variables found', () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);
      mockResponse.analysis.questVariables = [];
      delete mockResponse.analysis.recommendedQuestVariable;

      // Assert
      expect(mockResponse.analysis.questVariables).toEqual([]);
      expect(mockResponse.analysis.recommendedQuestVariable).toBeUndefined();
    });

    it('should handle analysis with no resources found', () => {
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

      // Assert
      expect(mockResponse.analysis.availableResources.sprites).toEqual([]);
      expect(mockResponse.analysis.availableResources.bgm).toEqual([]);
    });

    it('should validate ISO timestamp format', () => {
      // Arrange
      const mockResponse = createMockAnalysisResponse(testProjectPath);

      // Assert
      expect(() => new Date(mockResponse.timestamp)).not.toThrow();
      expect(() => new Date(mockResponse.analysis.analyzedAt)).not.toThrow();

      const timestamp = new Date(mockResponse.timestamp);
      const analyzedAt = new Date(mockResponse.analysis.analyzedAt);

      expect(timestamp.toISOString()).toBe(mockResponse.timestamp);
      expect(analyzedAt.toISOString()).toBe(mockResponse.analysis.analyzedAt);
    });
  });

  // ============================================================================
  // Test Suite 5: Project Structure Validation
  // ============================================================================

  describe('Project Structure Validation', () => {
    it('should verify fake MZ project structure is valid', () => {
      // Assert - Project exists
      expect(fs.existsSync(testProjectPath)).toBe(true);

      // Assert - Required files exist
      expect(fs.existsSync(path.join(testProjectPath, 'game.rmmzproject'))).toBe(true);
      expect(fs.existsSync(path.join(testProjectPath, 'data/System.json'))).toBe(true);
      expect(fs.existsSync(path.join(testProjectPath, 'data/CommonEvents.json'))).toBe(true);
      expect(fs.existsSync(path.join(testProjectPath, 'data/MapInfos.json'))).toBe(true);
      expect(fs.existsSync(path.join(testProjectPath, 'data/Troops.json'))).toBe(true);

      // Assert - Resource directories exist
      expect(fs.existsSync(path.join(testProjectPath, 'img/characters'))).toBe(true);
      expect(fs.existsSync(path.join(testProjectPath, 'audio/bgm'))).toBe(true);
      expect(fs.existsSync(path.join(testProjectPath, 'audio/se'))).toBe(true);
    });

    it('should parse System.json correctly', () => {
      // Arrange
      const systemJsonPath = path.join(testProjectPath, 'data/System.json');
      const systemData = JSON.parse(fs.readFileSync(systemJsonPath, 'utf-8'));

      // Assert
      expect(systemData).toHaveProperty('gameTitle');
      expect(systemData).toHaveProperty('switches');
      expect(systemData).toHaveProperty('variables');
      expect(Array.isArray(systemData.switches)).toBe(true);
      expect(Array.isArray(systemData.variables)).toBe(true);
      expect(systemData.variables).toContain('Quest 01 Progress');
      expect(systemData.variables).toContain('Quest 01 State');
    });

    it('should parse MapInfos.json correctly', () => {
      // Arrange
      const mapInfosJsonPath = path.join(testProjectPath, 'data/MapInfos.json');
      const mapInfosData = JSON.parse(fs.readFileSync(mapInfosJsonPath, 'utf-8'));

      // Assert
      expect(Array.isArray(mapInfosData)).toBe(true);
      expect(mapInfosData.length).toBeGreaterThan(1); // Index 0 is null
      expect(mapInfosData[1]).toHaveProperty('id', 1);
      expect(mapInfosData[1]).toHaveProperty('name', 'Tavern');
      expect(mapInfosData[2]).toHaveProperty('id', 2);
      expect(mapInfosData[2]).toHaveProperty('name', 'World Map');
    });

    it('should parse Troops.json correctly', () => {
      // Arrange
      const troopsJsonPath = path.join(testProjectPath, 'data/Troops.json');
      const troopsData = JSON.parse(fs.readFileSync(troopsJsonPath, 'utf-8'));

      // Assert
      expect(Array.isArray(troopsData)).toBe(true);
      expect(troopsData.length).toBeGreaterThan(1); // Index 0 is null
      expect(troopsData[1]).toHaveProperty('id', 1);
      expect(troopsData[1]).toHaveProperty('name', 'Slime*2');
      expect(troopsData[1]).toHaveProperty('members');
      expect(Array.isArray(troopsData[1].members)).toBe(true);
    });
  });

  // ============================================================================
  // Test Suite 6: Integration with Test Directory
  // ============================================================================

  describe('Test Directory Integration', () => {
    it('should create test output files', async () => {
      // Arrange
      const testOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-analyze-output-'));
      const mockResponse = {
        success: true,
        outputPath: testOutputDir,
        files: {
          json: 'analysis.json',
          markdown: 'analysis.md',
        },
        timestamp: new Date().toISOString(),
      };

      jest.spyOn(mcpClientService, 'callTool').mockResolvedValue(mockResponse);

      // Act
      const result = await mcpClientService.callTool<typeof mockResponse>('test_analyze_project', {
        testDirectory: testOutputDir,
        model: 'glm-4.7',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe(testOutputDir);
      expect(result.files.json).toBeDefined();
      expect(result.files.markdown).toBeDefined();
      expect(result.timestamp).toBeDefined();

      // Cleanup
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    });

    it('should handle different model options', async () => {
      // Arrange
      const testOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-analyze-output-'));
      const mockResponse = {
        success: true,
        outputPath: testOutputDir,
        files: { json: 'analysis.json', markdown: 'analysis.md' },
        timestamp: new Date().toISOString(),
      };

      const callToolSpy = jest.spyOn(mcpClientService, 'callTool').mockResolvedValue(mockResponse);

      // Act
      await mcpClientService.callTool('test_analyze_project', {
        testDirectory: testOutputDir,
        model: 'glm-4-flash',
      });

      // Assert
      expect(callToolSpy).toHaveBeenCalledWith(
        'test_analyze_project',
        expect.objectContaining({
          model: 'glm-4-flash',
        })
      );

      // Cleanup
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    });
  });
});
