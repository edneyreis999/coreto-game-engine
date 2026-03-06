/**
 * Oracle MCP Server
 *
 * Main MCP server implementation for Coreto Oracle.
 * Provides the generate_nsd_prompt tool for AI-powered NSD prompt generation.
 *
 * @see planos/022-plano-de-fazer-plano-v2/tasks/04_task.xml
 * @see docs/releases/v2/PRD_NSD_Generator_v2.md
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  ClaudeAgentClient,
  GeneratePromptSchema,
  ExtractScenesSchema,
  AnalyzeProjectSchema,
} from '../lib/claudeAgentClient.js';

/**
 * OracleMcpServer implements the Model Context Protocol server for Oracle.
 *
 * Provides the `generate_nsd_prompt` tool that generates technical
 * implementation prompts for RPG Maker MZ scenes based on NSD documents.
 *
 * @example
 * ```typescript
 * const server = new OracleMcpServer();
 * await server.start();
 * // Server communicates via stdio using MCP protocol
 * ```
 */
export class OracleMcpServer {
  private server: Server;
  private client: ClaudeAgentClient;

  constructor() {
    this.server = new Server(
      {
        name: 'oracle-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new ClaudeAgentClient();
    this.setupTools();
  }

  /**
   * Set up MCP tool request handlers.
   *
   * Registers handlers for:
   * - tools/list: Returns available tools and their schemas
   * - tools/call: Executes tool functions
   */
  private setupTools(): void {
    // Handler for tools/list - returns available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_nsd_prompt',
            description: 'Gera prompt técnico para implementação de cena NSD no RPG Maker MZ',
            inputSchema: GeneratePromptSchema.extend({
              sceneName: GeneratePromptSchema.shape.sceneName.describe('Nome da cena a ser gerada'),
              nsdContent: GeneratePromptSchema.shape.nsdContent.describe('Conteúdo completo do NSD em markdown'),
              projectPath: GeneratePromptSchema.shape.projectPath.describe('Caminho do projeto RPG Maker MZ'),
              questVariable: GeneratePromptSchema.shape.questVariable.optional().describe('Variável de controle da quest (opcional)'),
            }).shape,
          },
          {
            name: 'extract_scenes',
            description: 'Extrai cenas narrativas de um documento NSD em formato Coreto',
            inputSchema: ExtractScenesSchema.extend({
              nsdContent: ExtractScenesSchema.shape.nsdContent.describe('Conteúdo completo do NSD em formato markdown Coreto'),
              model: ExtractScenesSchema.shape.model.optional().describe('Modelo Z.ai para extração (opcional: glm-4.7, glm-4.5-air, glm-4-flash)'),
            }).shape,
          },
          {
            name: 'analyze_project',
            description: 'Analisa a estrutura de um projeto RPG Maker MZ, detectando variáveis de quest, mapas e recursos disponíveis',
            inputSchema: AnalyzeProjectSchema.extend({
              projectPath: AnalyzeProjectSchema.shape.projectPath.describe('Caminho do projeto RPG Maker MZ'),
              nsdContent: AnalyzeProjectSchema.shape.nsdContent.optional().describe('Conteúdo do NSD para contexto (opcional)'),
              sceneName: AnalyzeProjectSchema.shape.sceneName.optional().describe('Nome da cena para contexto (opcional)'),
              questVariable: AnalyzeProjectSchema.shape.questVariable.optional().describe('Variável de quest específica para verificar (opcional)'),
            }).shape,
          },
        ],
      };
    });

    // Handler for tools/call - executes tool functions
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'generate_nsd_prompt') {
        await this.client.init();

        // Type assertion for args since they come from MCP as Record<string, unknown>
        const nsdContent = String(args?.nsdContent || '');
        const sceneName = String(args?.sceneName || '');
        const projectPath = String(args?.projectPath || '');
        const model = args?.model !== undefined ? String(args.model) : undefined;

        const promptOptions: {
          nsdContent: string;
          sceneName: string;
          projectPath: string;
          questVariable?: string;
          model?: string;
        } = {
          nsdContent,
          sceneName,
          projectPath,
        };

        if (args?.questVariable !== undefined) {
          promptOptions.questVariable = String(args.questVariable);
        }

        if (model !== undefined) {
          promptOptions.model = model;
        }

        const generatedPrompt = await this.client.generateNsdPrompt(promptOptions);

        const response = {
          content: [
            {
              type: 'text',
              text: generatedPrompt,
            },
          ],
        };

        return response;
      }

      if (name === 'extract_scenes') {
        await this.client.init();

        // Type assertion for args since they come from MCP as Record<string, unknown>
        const nsdContent = String(args?.nsdContent || '');
        const model = args?.model !== undefined ? String(args.model) : undefined;

        console.error('[OracleMcpServer] extract_scenes called with:', {
          contentLength: nsdContent.length,
          model: model || 'default (glm-4.7)',
        });

        const extractOptions: {
          nsdContent: string;
          model?: string;
        } = { nsdContent };

        if (model !== undefined) {
          extractOptions.model = model;
        }

        const result = await this.client.extractScenes(extractOptions);

        console.error('[OracleMcpServer] extract_scenes result:', {
          totalScenes: result.totalScenes,
          sceneTitles: result.scenes.map(s => s.title),
        });

        const response = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };

        return response;
      }

      if (name === 'analyze_project') {
        // No need to init for analyze_project - it's read-only filesystem operations

        // Type assertion for args since they come from MCP as Record<string, unknown>
        const projectPath = String(args?.projectPath || '');
        const nsdContent = args?.nsdContent !== undefined ? String(args.nsdContent) : undefined;
        const sceneName = args?.sceneName !== undefined ? String(args.sceneName) : undefined;
        const questVariable = args?.questVariable !== undefined ? String(args.questVariable) : undefined;

        console.error('[OracleMcpServer] analyze_project called with:', {
          projectPath,
          hasNsdContent: !!nsdContent,
          hasSceneName: !!sceneName,
          hasQuestVariable: !!questVariable,
        });

        const analyzeOptions: {
          projectPath: string;
          nsdContent?: string;
          sceneName?: string;
          questVariable?: string;
        } = { projectPath };

        if (nsdContent !== undefined) {
          analyzeOptions.nsdContent = nsdContent;
        }

        if (sceneName !== undefined) {
          analyzeOptions.sceneName = sceneName;
        }

        if (questVariable !== undefined) {
          analyzeOptions.questVariable = questVariable;
        }

        const result = await this.client.analyzeProject(analyzeOptions);

        console.error('[OracleMcpServer] analyze_project result:', {
          mapCount: result.mapCount,
          troopCount: result.troopCount,
          questVariablesDetected: result.questVariables.length,
          warningsCount: result.warnings.length,
        });

        const response = {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };

        return response;
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  /**
   * Start the MCP server with stdio transport.
   *
   * Connects the server to stdin/stdout for MCP communication.
   * Logs to stderr as per MCP specification.
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Oracle MCP Server started'); // MCP logs to stderr
  }

  /**
   * Stop the MCP server.
   *
   * Closes server connection and cleans up resources.
   */
  async stop(): Promise<void> {
    await this.server.close();
  }
}
