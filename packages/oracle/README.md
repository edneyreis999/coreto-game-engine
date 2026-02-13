# @coreto/oracle

MCP (Model Context Protocol) server for Coreto Oracle - AI-powered game development assistant for RPG Maker MZ.

## Overview

The Oracle package provides an MCP server that exposes Coreto's game engine capabilities as tools accessible through the Claude Agent SDK. It enables AI agents to:

- Validate TTK (Time-To-Kill) configurations for battle balance
- Generate NSD (Narrative Scene Design) documents
- Query and analyze RPG Maker MZ project data
- Execute simulations and provide actionable insights

## Structure

```
packages/oracle/
├── src/
│   ├── lib/          # Core library utilities and shared types
│   ├── server/       # MCP server implementation
│   ├── index.ts      # Main entry point
│   └── mcp-server.ts # MCP server initialization entry
├── package.json
└── tsconfig.json
```

## Development

```bash
# Type check
pnpm --filter @coreto/oracle type-check

# Build
pnpm --filter @coreto/oracle build

# Run tests
pnpm --filter @coreto/oracle test
```

## Dependencies

- `@anthropic-ai/claude-agent-sdk` - Claude Agent SDK for tool integration
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Runtime type validation

## Integration

This package is designed to be integrated with Claude Desktop or any MCP-compatible host application.
