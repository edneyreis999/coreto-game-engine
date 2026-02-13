#!/usr/bin/env node

/**
 * Oracle MCP Server - Executable Entry Point
 *
 * This is the main executable that starts the Oracle MCP server.
 * It can be invoked directly or via node.
 *
 * Usage:
 *   node packages/oracle/dist/bin/oracle-server.js
 *   OR (if installed globally)
 *   oracle-server
 *
 * The server communicates via stdio using the Model Context Protocol.
 */

import { OracleMcpServer } from '../server/index.js';

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const server = new OracleMcpServer();

  // Handle graceful shutdown on SIGINT
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

  // Start the server
  await server.start();
}

// Start the server
main().catch((error) => {
  console.error('Failed to start Oracle MCP server:', error);
  process.exit(1);
});
