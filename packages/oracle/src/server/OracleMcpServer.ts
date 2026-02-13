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
import { ClaudeAgentClient, GeneratePromptSchema } from '../lib/claudeAgentClient.js';

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

        const promptOptions: { nsdContent: string; sceneName: string; projectPath: string; questVariable?: string } = {
          nsdContent,
          sceneName,
          projectPath,
        };

        if (args?.questVariable !== undefined) {
          promptOptions.questVariable = String(args.questVariable);
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
