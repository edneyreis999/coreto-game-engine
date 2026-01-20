/**
 * useIpc Hook
 *
 * Custom React hook for type-safe IPC invocation.
 * Provides error handling and loading states for IPC calls.
 *
 * @see packages/electron/src/renderer/src/types/preload.d.ts
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { IPCResult } from '@/types/preload';

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
 *   (path) => window.coreto.openProject(path),
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
   * Note: ipcFn is excluded from deps to prevent infinite loop.
   * The function should be stable (defined outside component or wrapped in useCallback).
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
      const result = await ipcFn();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
 *   (path: string) => window.coreto.openProject(path)
 * );
 *
 * await invoke('/path/to/project');
 */
export function useIpcWithArg<T, A>(
  ipcFn: (arg: A) => Promise<IPCResult<T>>,
  _options: UseIpcOptions = {}
): IpcReturn<T> & { invoke: (arg: A) => Promise<void> } {
  const [state, setState] = useState<IpcState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
    });
  }, []);

  const invoke = useCallback(
    async (arg: A) => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const result = await ipcFn(arg);

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
    },
    [ipcFn]
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
