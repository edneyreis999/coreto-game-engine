/**
 * MCP Client Service
 *
 * Manages communication with the MCP (Model Context Protocol) server.
 * Spawns the MCP server as a child process and handles JSON-RPC 2.0 communication.
 *
 * Key Features:
 * - Child Process Management: Spawns and manages MCP server lifecycle
 * - JSON-RPC 2.0 Protocol: Implements standard JSON-RPC communication
 * - Request Correlation: Uses UUID for request/response matching
 * - Timeout Handling: 30-second timeout for MCP calls
 * - Health Checking: Validates MCP server availability
 * - Graceful Shutdown: Properly terminates MCP server on cleanup
 *
 * @see docs/planos/006-mcp-client-integration/
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { app } from 'electron';
import { randomUUID } from 'node:crypto';
import { getLogger } from '../di/container.js';

// =============================================================================
// MCP Types
// =============================================================================

/**
 * JSON-RPC 2.0 Request
 *
 * @see https://www.jsonrpc.org/specification
 */
interface JsonRpcRequest {
  /** JSON-RPC version, must be "2.0" */
  jsonrpc: '2.0';
  /** Request identifier for correlation */
  id: string;
  /** Method name to invoke */
  method: string;
  /** Method parameters (positional or named) */
  params?: unknown;
}

/**
 * JSON-RPC 2.0 Response
 *
 * @see https://www.jsonrpc.org/specification
 */
interface JsonRpcResponse {
  /** JSON-RPC version, must be "2.0" */
  jsonrpc: '2.0';
  /** Request identifier (must match request) */
  id: string;
  /** Result if successful */
  result?: unknown;
  /** Error if failed */
  error?: {
    /** Error code */
    code: number;
    /** Error message */
    message: string;
    /** Additional error data */
    data?: unknown;
  };
}

/**
 * MCP Tool call parameters
 */
interface McpToolParams {
  /** Tool name to invoke */
  name: string;
  /** Tool arguments */
  arguments?: Record<string, unknown>;
}

/**
 * Pending request for correlation
 */
interface PendingRequest {
  /** Resolve function for promise */
  resolve: (value: unknown) => void;
  /** Reject function for promise */
  reject: (error: Error) => void;
  /** Timeout timer */
  timer: NodeJS.Timeout;
}

// =============================================================================
// MCP Client Service
// =============================================================================

/**
 * Service for managing MCP server communication.
 *
 * Implements singleton pattern to ensure only one MCP server instance exists.
 * Handles child process spawning, JSON-RPC communication, and graceful shutdown.
 */
export class McpClientService {
  private mcpProcess: ChildProcess | null = null;
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private readonly TIMEOUT_MS = 30_000; // 30 seconds

  // Buffer for accumulating stdout data
  private stdoutBuffer = '';

  /**
   * Gets the path to the MCP server executable.
   *
   * Path: app.getAppPath()/../oracle/dist/mcp-server.js
   * This resolves to the oracle package's MCP server entry point.
   *
   * @returns Absolute path to MCP server
   */
  private getMcpServerPath(): string {
    const appPath = app.getAppPath();
    // Navigate from app directory to oracle package
    const oraclePath = `${appPath}/../oracle/dist/mcp-server.js`;
    return oraclePath;
  }

  /**
   * Starts the MCP server process.
   *
   * Spawns the MCP server as a child process and sets up communication handlers.
   * If the server is already running, this method does nothing.
   *
   * @throws Error if server cannot be started
   */
  async start(): Promise<void> {
    if (this.mcpProcess) {
      getLogger().debug('MCP server already running');
      return;
    }

    const serverPath = this.getMcpServerPath();
    getLogger().info(`Starting MCP server: ${serverPath}`);

    try {
      // Explicitly pass required environment variables to child process
      // Node.js child processes don't inherit process.env automatically
      const mcpEnv = {
        ...process.env,
        ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
        ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
        ANTHROPIC_DEFAULT_SONNET_MODEL: process.env.ANTHROPIC_DEFAULT_SONNET_MODEL,
      };

      // Spawn MCP server process
      this.mcpProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: mcpEnv,
      });

      // Setup stdout handling for JSON-RPC responses
      this.mcpProcess.stdout?.on('data', (data: Buffer) => {
        this.handleStdout(data);
      });

      // Setup stderr handling for debug logging (use debug level, not error)
      this.mcpProcess.stderr?.on('data', (data: Buffer) => {
        getLogger().debug(`[MCP] ${data.toString()}`);
      });

      // Setup error handling
      this.mcpProcess.on('error', (error) => {
        getLogger().error(`MCP process error: ${error.message}`);
        this.rejectAllPendingRequests(error);
        this.mcpProcess = null;
      });

      // Setup exit handling
      this.mcpProcess.on('exit', (code, signal) => {
        const exitMsg = signal ? `via signal ${signal}` : `with code ${code}`;
        getLogger().info(`MCP server exited ${exitMsg}`);
        this.rejectAllPendingRequests(new Error(`MCP server exited ${exitMsg}`));
        this.mcpProcess = null;
      });

      // Wait a bit for server to initialize
      await new Promise((resolve) => setTimeout(resolve, 500));
      getLogger().info('MCP server started successfully');
    } catch (error) {
      this.mcpProcess = null;
      throw new Error(`Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handles stdout data from MCP server.
   *
   * Accumulates data in buffer and parses complete JSON-RPC responses.
   * Handles newline-delimited JSON responses.
   *
   * @param data - Raw data from stdout
   */
  private handleStdout(data: Buffer): void {
    const rawData = data.toString();

    // Append new data to buffer
    this.stdoutBuffer += rawData;

    // Process complete lines (newline-delimited JSON)
    const lines = this.stdoutBuffer.split('\n');
    // Keep the last incomplete line in buffer
    this.stdoutBuffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line) as JsonRpcResponse;
          this.handleResponse(response);
        } catch {
          getLogger().warn(`[MCP stdout] Failed to parse MCP response: ${line}`);
        }
      }
    }
  }

  /**
   * Handles a JSON-RPC response from the MCP server.
   *
   * Matches response ID to pending request and resolves/rejects accordingly.
   *
   * @param response - JSON-RPC response to handle
   */
  private handleResponse(response: JsonRpcResponse): void {
    const pending = this.pendingRequests.get(response.id);

    if (!pending) {
      getLogger().warn(`Received response for unknown request: ${response.id}`);
      return;
    }

    // Clear timeout
    clearTimeout(pending.timer);
    this.pendingRequests.delete(response.id);

    // Handle error response
    if (response.error) {
      const error = new Error(response.error.message);
      pending.reject(error);
      return;
    }

    // Resolve with result
    pending.resolve(response.result);
  }

  /**
   * Calls a tool on the MCP server.
   *
   * Implements JSON-RPC 2.0 protocol with:
   * - UUID-based request correlation
   * - 30-second timeout
   * - Promise-based response handling
   *
   * @param toolName - Name of the tool to call
   * @param args - Arguments to pass to the tool
   * @returns Promise resolving to tool result
   * @throws Error if MCP server is not running or call times out
   */
  async callTool<T = unknown>(toolName: string, args?: Record<string, unknown>): Promise<T> {
    // Ensure server is running
    if (!this.mcpProcess) {
      await this.start();
    }

    const requestId = randomUUID();
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      } as McpToolParams,
    };

    getLogger().debug(`MCP call: ${toolName} (id: ${requestId})`);

    return new Promise<T>((resolve, reject) => {
      // Setup timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`MCP call timeout after ${this.TIMEOUT_MS}ms`));
      }, this.TIMEOUT_MS);

      // Store pending request
      this.pendingRequests.set(requestId, { resolve, reject, timer });

      // Send request
      try {
        const requestJson = JSON.stringify(request) + '\n';
        this.mcpProcess?.stdin?.write(requestJson);
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);
        reject(new Error(`Failed to send MCP request: ${error instanceof Error ? error.message : String(error)}`));
      }
    });
  }

  /**
   * Performs a health check on the MCP server.
   *
   * Checks if the MCP server process is running.
   *
   * @returns Promise resolving to true if server is healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    const isRunning = this.mcpProcess !== null && !this.mcpProcess.killed;
    getLogger().debug(`MCP health check: ${isRunning}`);
    return isRunning;
  }

  /**
   * Rejects all pending requests with an error.
   *
   * Called when the MCP server crashes or exits unexpectedly.
   *
   * @param error - Error to reject pending requests with
   */
  private rejectAllPendingRequests(error: Error): void {
    for (const [, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }

  /**
   * Stops the MCP server.
   *
   * Clears all pending requests and kills the process.
   */
  async stop(): Promise<void> {
    if (!this.mcpProcess) {
      return;
    }

    getLogger().info('Stopping MCP server');
    this.rejectAllPendingRequests(new Error('MCP server shutting down'));
    this.mcpProcess.kill();
    this.mcpProcess = null;
    getLogger().info('MCP server stopped');
  }

  /**
   * Checks if the MCP server is currently running.
   *
   * @returns true if server process exists and is not killed
   */
  isRunning(): boolean {
    return this.mcpProcess !== null && !this.mcpProcess.killed;
  }

  /**
   * Gets the current MCP server process (for testing).
   *
   * @returns The current child process or null
   */
  getProcess(): ChildProcess | null {
    return this.mcpProcess;
  }

  /**
   * Cleans up service resources.
   *
   * Called during app shutdown to ensure graceful cleanup.
   * Stops the MCP server and clears all pending requests.
   */
  cleanup(): void {
    getLogger().info('McpClientService cleanup called');
    this.stop().catch((error) => {
      getLogger().error(`Error during MCP cleanup: ${error.message}`);
    });
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/**
 * Singleton instance of McpClientService.
 * Used throughout the application for MCP server communication.
 */
export const mcpClientService = new McpClientService();
