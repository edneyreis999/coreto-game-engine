import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { logBuffer, createLogEntry } from './hooks/useLogger/index'
import './styles.css'

/**
 * React Entry Point
 *
 * Mounts the React application to the DOM root element.
 * ErrorBoundary catches and displays errors from child components.
 *
 * Console Override:
 * - Captures all console.log/warn/error calls before React renders
 * - Preserves original console methods for DevTools
 * - Stores logs in circular buffer for debugging
 */

// ============================================================================
// Console Override - Must happen before React renders
// ============================================================================

/**
 * Preserve original console methods.
 * These references are captured before any overrides are applied.
 */
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  info: console.info.bind(console),
  debug: console.debug.bind(console),
};

/**
 * Converts console arguments to a formatted string message.
 * Handles strings, Error objects, and serializable objects.
 *
 * @param args - Console arguments to convert
 * @returns Formatted message string
 */
function argsToMessage(args: unknown[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(' ');
}

/**
 * Creates a console override function for a specific log level.
 * Captures logs to the circular buffer and forwards to original console method.
 *
 * @param level - Log level (info, warn, error, debug)
 * @param originalMethod - Original console method to forward calls to
 * @returns Override function
 */
function createConsoleOverride(
  level: 'info' | 'warn' | 'error' | 'debug',
  originalMethod: (...args: unknown[]) => void
): (...args: unknown[]) => void {
  return function (...args: unknown[]): void {
    const message = argsToMessage(args);
    const entry = createLogEntry(level, message);
    logBuffer.push(entry);
    originalMethod(...args);
  };
}

/**
 * Override console methods to capture all output.
 * Logs are stored in the buffer and displayed in DevTools.
 */
console.log = createConsoleOverride('info', originalConsole.log);
console.warn = createConsoleOverride('warn', originalConsole.warn);
console.error = createConsoleOverride('error', originalConsole.error);
console.info = createConsoleOverride('info', originalConsole.info);
console.debug = createConsoleOverride('debug', originalConsole.debug);

// ============================================================================
// React Application Mount
// ============================================================================

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element. React app cannot mount.');
}

// Log React app initialization
const appInitEntry = createLogEntry('info', 'React app initialized in main.tsx (HashRouter is in App.tsx)');
logBuffer.push(appInitEntry);

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
