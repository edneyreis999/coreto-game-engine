/**
 * Global Jest setup file
 *
 * This file runs after the test framework has been installed in the environment.
 * It provides global mocks and configuration for all tests.
 */

import 'reflect-metadata';
import 'jest-canvas-mock';

/**
 * Suppress console noise in tests
 *
 * This prevents console.log and console.debug from polluting test output.
 * Warnings and errors are still shown for debugging purposes.
 */
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

/**
 * Configure fake timers for deterministic tests
 *
 * Fake timers ensure that setTimeout, setInterval, and other timing functions
 * are deterministic and can be controlled in tests.
 */
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});
