#!/usr/bin/env node

/**
 * Coreto Game Engine - CLI Entry Point
 *
 * Deterministic Time-to-Kill (TTK) validation system for RPG Maker MZ combat balancing.
 *
 * This file bootstraps the Oclif CLI framework and initializes dependency injection.
 *
 * @packageDocumentation
 */

import 'reflect-metadata';
import { run } from '@oclif/core';

/**
 * Main entry point - delegates to Oclif framework.
 *
 * Oclif will:
 * 1. Parse command-line arguments
 * 2. Load the appropriate command from src/cli/commands/
 * 3. Execute the command with parsed flags and arguments
 * 4. Handle errors and help output
 */
await run();
