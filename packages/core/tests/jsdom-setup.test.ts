/**
 * JSDOM Setup Tests with Fake Builders
 *
 * This test file provides JSDOM setup utilities using fake builders
 * for better test isolation and performance.
 */

import { JSDOM } from 'jsdom';
import { vi } from 'vitest';

// Mock window and document objects using fake builders
class FakeWindow {
  constructor() {
    this.document = this.createFakeDocument();
    this.location = {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/'
    };
    this.alert = vi.fn();
    this.confirm = vi.fn(() => true);
    this.prompt = vi.fn(() => 'test');
    this.console = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };
    this.fetch = vi.fn();
    this.localStorage = this.createFakeLocalStorage();
    this.sessionStorage = this.createFakeStorage();
    this.performance = {
      now: vi.fn(() => Date.now())
    };
  }

  createFakeDocument() {
    return {
      createElement: (tagName: string) => ({
        tagName,
        style: {},
        className: '',
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(() => false)
        },
        getAttribute: vi.fn(() => null),
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        hasAttribute: vi.fn(() => false),
        appendChild: vi.fn(),
        removeChild: vi.fn(),
        querySelector: vi.fn(() => null),
        querySelectorAll: vi.fn(() => []),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }),
      createTextNode: (text: string) => ({ textContent: text }),
      createComment: (text: string) => ({ textContent: text }),
      head: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      },
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      },
      getElementById: vi.fn(() => null),
      getElementsByClassName: vi.fn(() => []),
      getElementsByTagName: vi.fn(() => []),
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      createElementNS: vi.fn(() => ({})),
      createEvent: vi.fn(() => ({})),
      dispatchEvent: vi.fn(),
      defaultView: null
    };
  }

  createFakeLocalStorage() {
    const storage = new Map<string, string>();
    return {
      getItem: vi.fn((key: string) => storage.get(key) || null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
      length: 0,
      key: vi.fn(() => null)
    };
  }

  createFakeStorage() {
    return this.createFakeLocalStorage();
  }
}

class FakeDOMParser {
  parseFromString(html: string, contentType = 'text/html') {
    return {
      documentElement: {
        tagName: 'html',
        children: []
      },
      head: {
        children: []
      },
      body: {
        children: []
      },
      getElementById: vi.fn(() => null),
      querySelector: vi.fn(() => null),
      querySelectorAll: vi.fn(() => []),
      getElementsByTagName: vi.fn(() => [])
    };
  }
}

// Mock global objects
const mockGlobalObjects = () => {
  const fakeWindow = new FakeWindow();

  // Configure global scope
  global.window = fakeWindow as any;
  global.document = fakeWindow.document;
  global.navigator = {
    userAgent: 'Mozilla/5.0 (Node.js)',
    language: 'en-US',
    languages: ['en-US'],
    onLine: true,
    maxTouchPoints: 0,
    hardwareConcurrency: 4,
    deviceMemory: 4,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 100,
      saveData: false
    }
  };
  global.location = fakeWindow.location;
  global.alert = fakeWindow.alert;
  global.confirm = fakeWindow.confirm;
  global.prompt = fakeWindow.prompt;
  global.console = fakeWindow.console;
  global.fetch = fakeWindow.fetch;
  global.localStorage = fakeWindow.localStorage;
  global.sessionStorage = fakeWindow.sessionStorage;
  global.performance = fakeWindow.performance;

  // Mock DOM APIs
  global.DOMParser = FakeDOMParser;
  global.Image = class Image {
    src = '';
    alt = '';
    width = 0;
    height = 0;
    onload = vi.fn();
    onerror = vi.fn();
  };

  global.WebGLRenderingContext = class {
    constructor() {}
  };

  global.HTMLCanvasElement = class {
    width = 0;
    height = 0;
    getContext = vi.fn(() => ({}));
    toDataURL = vi.fn(() => 'data:image/png;base64,');
  };

  global.HTMLImageElement = global.Image;

  // Mock event objects
  global.MouseEvent = class MouseEvent {
    constructor(
      public type: string,
      public bubbles: boolean = false,
      public cancelable: boolean = false,
      public view: Window = fakeWindow as any,
      public detail: number = 0,
      public screenX: number = 0,
      public screenY: number = 0,
      public clientX: number = 0,
      public clientY: number = 0,
      public ctrlKey: boolean = false,
      public shiftKey: boolean = false,
      public altKey: boolean = false,
      public metaKey: boolean = false,
      public button: number = 0,
      public buttons: number = 0,
      public relatedTarget: EventTarget | null = null
    ) {}
    preventDefault = vi.fn();
    stopPropagation = vi.fn();
    stopImmediatePropagation = vi.fn();
  };

  global.KeyboardEvent = class KeyboardEvent {
    constructor(
      public type: string,
      public bubbles: boolean = false,
      public cancelable: boolean = false,
      public view: Window = fakeWindow as any,
      public ctrlKey: boolean = false,
      public shiftKey: boolean = false,
      public altKey: boolean = false,
      public metaKey: boolean = false,
      public key: string = '',
      public code: string = '',
      public location: number = 0,
      public repeat: boolean = false
    ) {}
    preventDefault = vi.fn();
    stopPropagation = vi.fn();
    stopImmediatePropagation = vi.fn();
  };
};

// Setup JSDOM with fake builders
export const setupJSDOM = () => {
  // Clear any existing mocks
  vi.clearAllMocks();

  // Apply fake builders
  mockGlobalObjects();

  // Create JSDOM instance
  const jsdom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable',
    runScripts: 'dangerously'
  });

  // Expose document and window to test scope
  global.document = jsdom.window.document;
  global.window = jsdom.window;

  return jsdom;
};

// Cleanup JSDOM
export const cleanupJSDOM = () => {
  vi.clearAllMocks();

  // Clean up JSDOM if it exists
  if (global.window && typeof (global.window as any).close === 'function') {
    (global.window as any).close();
  }

  // Restore globals
  global.window = undefined as any;
  global.document = undefined as any;
};

// Helper to create fake DOM elements
export const createFakeElement = (tagName: string, attributes: Record<string, string> = {}) => {
  const element = {
    tagName,
    style: {},
    className: '',
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false)
    },
    attributes: new Map<string, string>(),
    children: [] as any[],
    parentElement: null,

    // DOM methods
    getAttribute: vi.fn((name: string) => attributes[name] || null),
    setAttribute: vi.fn((name: string, value: string) => {
      attributes[name] = value;
      element.attributes.set(name, value);
    }),
    removeAttribute: vi.fn((name: string) => {
      delete attributes[name];
      element.attributes.delete(name);
    }),
    hasAttribute: vi.fn((name: string) => attributes.hasOwnProperty(name)),

    appendChild: vi.fn((child: any) => {
      element.children.push(child);
      child.parentElement = element;
    }),
    removeChild: vi.fn((child: any) => {
      const index = element.children.indexOf(child);
      if (index > -1) {
        element.children.splice(index, 1);
        child.parentElement = null;
      }
    }),
    querySelector: vi.fn((selector: string) => {
      // Simple selector matching for testing
      if (selector === tagName) return element;
      return null;
    }),
    querySelectorAll: vi.fn((selector: string) => {
      // Simple selector matching for testing
      if (selector === tagName) return [element];
      return [];
    }),

    // Event methods
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),

    // Common properties
    textContent: '',
    innerHTML: '',
    outerHTML: `<${tagName}></${tagName}>`
  };

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });

  return element;
};

// Helper to create fake events
export const createFakeEvent = (type: string, detail?: any) => ({
  type,
  target: null,
  currentTarget: null,
  bubbles: false,
  cancelable: false,
  defaultPrevented: false,
  detail: detail || null,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  stopImmediatePropagation: vi.fn(),
  composed: false
});

// Test utilities
export const JSDOMTestSuite = {
  setup: () => {
    const jsdom = setupJSDOM();
    return { jsdom, cleanup: () => cleanupJSDOM() };
  },

  mockConsole: (methods: Array<keyof Console> = ['log', 'error', 'warn', 'info']) => {
    const spies = methods.map(method => vi.spyOn(console, method));
    return () => spies.forEach(spy => spy.mockRestore());
  },

  mockFetch: (responses: Record<string, any>) => {
    const mockFetch = vi.fn()
      .mockImplementation((url: string, options?: RequestInit) => {
        const response = responses[url] || responses['default'];
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['Content-Type', 'application/json']]),
          json: () => Promise.resolve(response),
          text: () => Promise.resolve(JSON.stringify(response))
        });
      });

    global.fetch = mockFetch;
    return () => global.fetch = vi.fn();
  }
};

// Export for test configuration
export default {
  setupJSDOM,
  cleanupJSDOM,
  createFakeElement,
  createFakeEvent,
  JSDOMTestSuite
};