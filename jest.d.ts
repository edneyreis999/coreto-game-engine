/**
 * Global type declarations for Jest
 *
 * Provides Jest globals (describe, it, expect, jest, etc.) for all test files.
 * This file is automatically included by TypeScript via tsconfig.json settings.
 */

import {} from 'jest';

// Make Jest globals available globally
declare const describe: typeof import('jest').describe;
declare const it: typeof import('jest').it;
declare const test: typeof import('jest').test;
declare const expect: typeof import('jest').expect;
declare const beforeAll: typeof import('jest').beforeAll;
declare const afterAll: typeof import('jest').afterAll;
declare const beforeEach: typeof import('jest').beforeEach;
declare const afterEach: typeof import('jest').afterEach;
declare const jest: typeof import('jest');
