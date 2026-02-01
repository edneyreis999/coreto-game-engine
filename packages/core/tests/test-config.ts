/**
 * Test Configuration for Fake Builders
 *
 * This file provides configuration and utilities for setting up
 * JSDOM tests with fake builders across the test suite.
 */

import { setupJSDOM, cleanupJSDOM } from './jsdom-setup';
import { vi } from 'vitest';

// Global test configuration
export const testConfig = {
  // Default test timeout
  timeout: 10000,

  // Mock configuration
  mocks: {
    console: ['log', 'error', 'warn', 'info', 'debug'],
    fetch: true,
    localStorage: true,
    sessionStorage: true,
    alert: true,
    confirm: true,
    prompt: true
  },

  // DOM configuration
  dom: {
    pretendToBeVisual: true,
    resources: 'usable',
    runScripts: 'dangerously'
  }
};

// Test setup function
export const setupTestEnvironment = () => {
  // Setup JSDOM with fake builders
  const jsdom = setupJSDOM();

  // Mock global APIs
  if (testConfig.mocks.console) {
    const mockConsole = testConfig.mocks.console as string[];
    mockConsole.forEach(method => {
      vi.spyOn(console, method);
    });
  }

  if (testConfig.mocks.fetch) {
    vi.spyOn(global, 'fetch');
  }

  if (testConfig.mocks.localStorage) {
    vi.spyOn(Storage.prototype, 'getItem');
    vi.spyOn(Storage.prototype, 'setItem');
    vi.spyOn(Storage.prototype, 'removeItem');
    vi.spyOn(Storage.prototype, 'clear');
  }

  if (testConfig.mocks.alert) {
    vi.spyOn(window, 'alert');
  }

  if (testConfig.mocks.confirm) {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  }

  if (testConfig.mocks.prompt) {
    vi.spyOn(window, 'prompt').mockReturnValue('test');
  }

  return {
    jsdom,
    cleanup: () => {
      cleanupJSDOM();

      // Restore mocks
      if (testConfig.mocks.console) {
        const mockConsole = testConfig.mocks.console as string[];
        mockConsole.forEach(method => {
          vi.restoreAllMocks();
        });
      }

      vi.clearAllMocks();
    }
  };
};

// Test teardown function
export const teardownTestEnvironment = (cleanup: () => void) => {
  cleanup();
};

// Custom test matchers for DOM elements
export const matchers = {
  toHaveTextContent: (received: HTMLElement, expected: string) => {
    return {
      pass: received.textContent?.includes(expected) || false,
      message: () => `Expected element to have text content: ${expected}, but got: ${received.textContent}`
    };
  },

  toHaveAttribute: (received: HTMLElement, name: string, value?: string) => {
    const actualValue = received.getAttribute(name);
    const hasValue = value !== undefined;

    if (hasValue) {
      return {
        pass: actualValue === value,
        message: () => `Expected element to have attribute ${name} with value ${value}, but got: ${actualValue}`
      };
    } else {
      return {
        pass: actualValue !== null,
        message: () => `Expected element to have attribute ${name}, but it doesn't`
      };
    }
  },

  toHaveClass: (received: HTMLElement, className: string) => {
    const hasClass = received.classList.contains(className);
    return {
      pass: hasClass,
      message: () => `Expected element to have class ${className}, but it doesn't`
    };
  }
};

// Export for global test setup
export default {
  setupTestEnvironment,
  teardownTestEnvironment,
  testConfig,
  matchers
};