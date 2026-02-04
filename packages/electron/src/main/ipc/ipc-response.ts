import type { IPCResponse, IPCResult, IPCError, IPCSuccessResponse, IPCErrorResponse } from './types.js';

/**
 * Creates a successful IPC response with literal type 'success: true'
 * Solves type widening issue where 'success' becomes 'boolean' instead of literal 'true'
 *
 * @param data - The response data to return
 * @returns A success response with properly typed literal 'success: true'
 *
 * @example
 * ```ts
 * return success<ProjectInfo>({ path: '/path', name: 'Project', isValid: true });
 * ```
 */
export const success = <T extends IPCResponse>(data: T): IPCSuccessResponse<T> => ({
  success: true as const,
  data,
});

/**
 * Creates an error IPC response with literal type 'success: false'
 *
 * @param error - The serialized error object
 * @returns An error response with properly typed literal 'success: false'
 *
 * @example
 * ```ts
 * return failure({ name: 'Error', message: 'Something went wrong', severity: 'critical', context: {}, timestamp: '...' });
 * ```
 */
export const failure = (error: IPCError): IPCErrorResponse => ({
  success: false as const,
  error,
});

/**
 * Wraps a handler function with error handling and IPC response formatting
 * Replacement for the current 'withErrorHandling' function
 *
 * @param handler - The async handler function to wrap
 * @returns A promise that resolves to either success or error IPC result
 *
 * @example
 * ```ts
 * const result = await wrapHandler(async () => {
 *   // ... handler logic
 *   return { some: 'data' };
 * });
 * ```
 */
export function wrapHandler<T extends IPCResponse>(
  handler: () => Promise<T>
): Promise<IPCResult<T>> {
  return handler()
    .then((data) => {
      console.log('[wrapHandler] Success, data:', data);
      return success<T>(data);
    })
    .catch((error: unknown) => {
      console.error('[wrapHandler] Error caught:', error);
      return failure(serializeError(error));
    });
}

/**
 * Converts an error to IPC-safe error format
 * Used internally by wrapHandler
 */
function serializeError(error: unknown): IPCError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      severity: 'critical',
      context: {},
      timestamp: new Date().toISOString(),
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
    severity: 'critical',
    context: {},
    timestamp: new Date().toISOString(),
  };
}
