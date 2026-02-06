/**
 * ConsoleLogger Implementation
 *
 * Simple console-based logger implementation for ILogger port.
 * Example of @injectable decorator usage with TSyringe.
 */

import { injectable } from 'tsyringe';
import type { ILogger } from '../../../core/ports/index.js';

/**
 * Console-based logger implementation.
 * Uses standard console methods for output.
 */
@injectable()
export class ConsoleLogger implements ILogger {
  /**
   * Log informational messages.
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  info(message: string, meta?: Record<string, unknown>): void {
    if (meta && Object.keys(meta).length > 0) {
      console.log(`[INFO] ${message}`, meta);
    } else {
      console.log(`[INFO] ${message}`);
    }
  }

  /**
   * Log warning messages.
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    if (meta && Object.keys(meta).length > 0) {
      console.warn(`[WARN] ${message}`, meta);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Log error messages.
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  error(message: string, meta?: Record<string, unknown>): void {
    if (meta && Object.keys(meta).length > 0) {
      console.error(`[ERROR] ${message}`, meta);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Log debug messages.
   * @param message - The message to log
   * @param meta - Optional metadata to include
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    if (meta && Object.keys(meta).length > 0) {
      console.debug(`[DEBUG] ${message}`, meta);
    } else {
      console.debug(`[DEBUG] ${message}`);
    }
  }
}
