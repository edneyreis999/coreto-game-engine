/**
 * @coreto/oracle/mcp-server
 *
 * MCP Server CLI entry point.
 * Initializes and starts the Oracle MCP server with stdio transport.
 *
 * This file is the executable entry point when spawned as a child process.
 * It keeps the Node.js process alive by listening for stdin/stdout.
 */

import { OracleMcpServer } from './server/OracleMcpServer.js';

/**
 * Main entry point for MCP server process.
 *
 * Initializes server, connects to stdio transport, and keeps process alive.
 */
async function main(): Promise<void> {
  console.error('[Oracle MCP CLI] Starting Oracle MCP server process...');

  const server = new OracleMcpServer();

  console.error('[Oracle MCP CLI] Calling server.start()...');
  await server.start();
  console.error('[Oracle MCP CLI] Server started, waiting for MCP requests...');

  // Keep process alive - server is now listening via stdio
  // DO NOT call process.exit() - let stdio transport manage lifecycle
}

// Start the server
main().catch((error) => {
  console.error(`[Oracle MCP CLI] FATAL: Failed to start server: ${error}`);
  process.exit(1);
});
