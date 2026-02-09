/**
 * useIpc Hook
 *
 * Custom React hook for type-safe IPC invocation.
 * Provides error handling and loading states for IPC calls.
 *
 * @see packages/electron/src/renderer/src/types/preload.d.ts
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { IPCResult } from '@coreto/electron/domain/types';
import { useLogger } from './useLogger/index';

// ============================================================================
// Hook State
// ============================================================================

/**
 * State for IPC operations.
 */
interface IpcState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

// ============================================================================
// Hook Options
// ============================================================================

/**
 * Options for useIpc hook.
 */
interface UseIpcOptions {
  /**
   * Whether to invoke the IPC call immediately on mount.
   * @default false
   */
  invokeOnMount?: boolean;

  /**
   * Dependencies that trigger re-invocation when changed.
   * Used with invokeOnMount or manual invoke.
   */
  deps?: unknown[];
}

// ============================================================================
// Hook Return Value
// ============================================================================

/**
 * Return value for useIpc hook.
 */
interface IpcReturn<T> extends IpcState<T> {
  /**
   * Invokes the IPC call with the provided payload.
   */
  invoke: () => Promise<void>;

  /**
   * Resets the state to initial values.
   */
  reset: () => void;
}

/**
 * Return value for useIpcWithArg hook.
 */
interface IpcReturnWithArg<T, A> extends IpcState<T> {
  /**
   * Invokes the IPC call with the provided argument.
   */
  invoke: (arg: A) => Promise<void>;

  /**
   * Resets the state to initial values.
   */
  reset: () => void;
}

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Creates an error object from an IPC error response.
 */
function createIpcError(ipcError: {
  name: string;
  message: string;
  severity: string;
  context: Record<string, unknown>;
  timestamp: string;
}): Error {
  const error = new Error(ipcError.message);
  error.name = ipcError.name;
  return error;
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for type-safe IPC invocation.
 *
 * Provides state management for IPC calls including loading state,
 * error handling, and data storage.
 *
 * @param ipcFn - IPC function to invoke (from window.coreto)
 * @param options - Hook options
 * @returns IPC state and control functions
 *
 * @example
 * const { data, error, isLoading, invoke } = useIpc(
 *   (path) => window.coreto.project.open(path),
 *   { invokeOnMount: false }
 * );
 *
 * // Manual invocation
 * await invoke('/path/to/project');
 */
export function useIpc<T>(
  ipcFn: () => Promise<IPCResult<T>>,
  options: UseIpcOptions = {}
): IpcReturn<T> {
  const { invokeOnMount = false, deps = [] } = options;

  const [state, setState] = useState<IpcState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ipcFnRef = useRef(ipcFn);

  // Keep ipcFnRef up to date
  useEffect(() => {
    ipcFnRef.current = ipcFn;
  }, [ipcFn]);

  /**
   * Resets the state to initial values.
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
    });
  }, []);

  /**
   * Invokes the IPC call and updates state.
   * Uses ref to avoid ipcFn in dependencies, preventing infinite loops.
   * Note: isMountedRef is intentionally omitted from deps as refs are stable.
   */
  const invoke = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await ipcFnRef.current();

      // Check if component is still mounted and request wasn't aborted
      if (!isMountedRef.current || abortController.signal.aborted) {
        return;
      }

      if (result.success) {
        setState({ data: result.data, error: null, isLoading: false });
      } else {
        setState({
          data: null,
          error: createIpcError(result.error),
          isLoading: false,
        });
      }
    } catch (error) {
      // Check if component is still mounted and request wasn't aborted
      if (!isMountedRef.current || abortController.signal.aborted) {
        return;
      }

      setState({
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        isLoading: false,
      });
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  // Invoke on mount if requested
  useEffect(() => {
    if (invokeOnMount) {
      invoke();
    }

    return () => {
      isMountedRef.current = false;
      // Cancel any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [invokeOnMount, invoke, ...deps]);

  return {
    ...state,
    invoke,
    reset,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for IPC calls that take a single argument.
 * Returns a function that accepts the argument and invokes the IPC call.
 *
 * @param ipcFn - IPC function that accepts an argument
 * @returns State and invoke function that accepts the argument
 *
 * @example
 * const { data, error, isLoading, invoke } = useIpcWithArg(
 *   (path: string) => window.coreto.project.open(path)
 * );
 *
 * await invoke('/path/to/project');
 */
export function useIpcWithArg<T, A>(
  ipcFn: (arg: A) => Promise<IPCResult<T>>,
  _options: UseIpcOptions = {}
): IpcReturnWithArg<T, A> {
  const logger = useLogger();
  const [state, setState] = useState<IpcState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ipcFnRef = useRef(ipcFn);

  // Keep ipcFnRef up to date
  useEffect(() => {
    ipcFnRef.current = ipcFn;
  }, [ipcFn]);

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
    });
  }, []);

  const invoke = useCallback(
    async (arg: A) => {
      logger.debug(`[useIpcWithArg] invoke called with arg: ${JSON.stringify(arg)}`);
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setState((prev) => {
        logger.debug('[useIpcWithArg] Setting isLoading: true');
        return { ...prev, isLoading: true, error: null };
      });

      try {
        logger.debug('[useIpcWithArg] Calling ipcFn...');
        const result = await ipcFnRef.current(arg);
        logger.debug(`[useIpcWithArg] ipcFn returned: ${JSON.stringify(result)}`);

        // Only skip setState if the request was actively aborted (not unmounted)
        // This allows data to be set even after unmount for debugging
        if (abortController.signal.aborted) {
          logger.debug('[useIpcWithArg] Request was aborted');
          return;
        }

        if (result.success) {
          logger.debug(`[useIpcWithArg] Result successful, setting data: ${JSON.stringify(result.data)}`);
          setState({ data: result.data, error: null, isLoading: false });
        } else {
          logger.warn(`[useIpcWithArg] Result failed: ${JSON.stringify(result.error)}`);
          setState({
            data: null,
            error: createIpcError(result.error),
            isLoading: false,
          });
        }
      } catch (error) {
        logger.error(`[useIpcWithArg] Exception caught: ${String(error)}`);
        setState({
          data: null,
          error: error instanceof Error ? error : new Error(String(error)),
          isLoading: false,
        });
      } finally {
        abortControllerRef.current = null;
      }
    },
    [logger]
  );

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Cancel any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    invoke,
    reset,
  };
}
