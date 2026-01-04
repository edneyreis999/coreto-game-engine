#!/usr/bin/env node

/**
 * Coreto Game Engine - Development CLI Entry Point
 *
 * This script runs the TypeScript CLI source directly using tsx.
 * Use this for development with hot-reload capabilities.
 */

import { execute } from '@oclif/core';

await execute({ development: true, dir: import.meta.url });
