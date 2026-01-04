#!/usr/bin/env node

/**
 * Coreto Game Engine - Production CLI Entry Point
 *
 * This script runs the compiled CLI from dist/ directory.
 * Use this for production execution after running `npm run build`.
 */

import { execute } from '@oclif/core';

await execute({ development: false, dir: import.meta.url });
