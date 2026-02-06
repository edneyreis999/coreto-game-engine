/**
 * useLogger Hook
 *
 * Provides structured logging interface for React components.
 * In development mode, logs go to browser console.
 * In production, only errors are logged to avoid console pollution.
 *
 * Usage:
 * ```tsx
 * const logger = useLogger();
 * logger.info('Component mounted');
 * logger.error('Failed to load data');
 * ```
 */

import { useMemo } from 'react';

export interface Logger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * Checks if running in development mode.
 * Uses process.env.NODE_ENV which works in both Vite and Jest.
 * Vite automatically defines process.env in the browser bundle.
 */
const isDev = (): boolean => {
  return process.env.NODE_ENV !== 'production';
};

/**
 * Custom hook for structured logging in React components.
 *
 * @returns Logger instance with info, warn, error, debug methods
 */
export function useLogger(): Logger {
  return useMemo(
    () => ({
      info: (message: string, meta?: Record<string, unknown>) => {
        if (isDev()) {
          if (meta && Object.keys(meta).length > 0) {
            console.log(`[INFO] ${message}`, meta);
          } else {
            console.log(`[INFO] ${message}`);
          }
        }
      },

      warn: (message: string, meta?: Record<string, unknown>) => {
        if (isDev()) {
          if (meta && Object.keys(meta).length > 0) {
            console.warn(`[WARN] ${message}`, meta);
          } else {
            console.warn(`[WARN] ${message}`);
          }
        }
      },

      error: (message: string, meta?: Record<string, unknown>) => {
        // Always log errors, even in production
        if (meta && Object.keys(meta).length > 0) {
          console.error(`[ERROR] ${message}`, meta);
        } else {
          console.error(`[ERROR] ${message}`);
        }
      },

      debug: (message: string, meta?: Record<string, unknown>) => {
        if (isDev()) {
          if (meta && Object.keys(meta).length > 0) {
            console.log(`[DEBUG] ${message}`, meta);
          } else {
            console.log(`[DEBUG] ${message}`);
          }
        }
      },
    }),
    []
  );
}
