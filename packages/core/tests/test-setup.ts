/**
 * Vitest Global Setup
 *
 * This file runs before all tests and sets up the test environment.
 */

import { vi } from 'vitest';
import { setupJSDOM } from './jsdom-setup';

// Setup JSDOM for all tests
setupJSDOM();

// Mock global APIs that might not be available in test environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock WebGL
global.WebGLRenderingContext = vi.fn();
global.WebGL2RenderingContext = vi.fn();