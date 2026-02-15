/**
 * useNsdUpload Hook
 *
 * Custom React hook for NSD (Narrative Scene Document) upload operations.
 * Encapsulates NSD upload IPC communication with progress tracking and error management.
 *
 * Features:
 * - Event streaming for real-time progress updates
 * - Automatic cleanup on unmount (prevents memory leaks)
 * - Correlation ID tracking for request/response matching (handled by preload)
 * - Type-safe event payloads
 *
 * @see packages/electron/src/preload/index.ts (nsdAPI)
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { useLogger } from './useLogger/index';
import type {
  NSDUploadProgress,
  NSDUploadError,
  NSDSceneDTO,
} from '@coreto/electron/domain/types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Source parameter for NSD upload.
 * Supports both file path and direct text content.
 */
export type NsdUploadSource = {
  /** Absolute file path to the NSD markdown file (optional) */
  path?: string;
  /** Direct markdown text content (optional) */
  text?: string;
};

/**
 * Upload progress state returned by the hook.
 */
export interface NsdUploadProgress {
  /** Current stage of the upload process */
  stage: string;
  /** Completion percentage for the current stage (0-100) */
  percent: number;
}

/**
 * Return value for useNsdUpload hook.
 */
export interface UseNsdUploadReturn {
  /**
   * Uploads an NSD document for parsing and scene extraction.
   * @param source - NSD document source (file path or text content)
   * @returns Promise that resolves when upload completes
   */
  upload: (source: NsdUploadSource) => Promise<void>;

  /**
   * Whether an NSD upload is currently in progress.
   */
  isUploading: boolean;

  /**
   * Current upload progress state (stage and percentage).
   */
  progress: NsdUploadProgress | null;

  /**
   * Extracted scenes from the uploaded NSD document.
   */
  scenes: NSDSceneDTO[];

  /**
   * Error message if upload failed.
   */
  error: string | null;
}

// ============================================================================
// Initial State
// ============================================================================

/**
 * Initial progress state.
 */
const initialProgress: NsdUploadProgress | null = null;

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Custom hook for NSD document upload operations.
 *
 * Uses IPC event listeners (onProgress, onError) for real-time updates.
 * Automatically cleans up listeners on unmount to prevent memory leaks.
 * Generates correlation IDs for tracking each upload operation.
 *
 * @returns NSD upload state and control function
 *
 * @example
 * const { upload, isUploading, progress, scenes, error } = useNsdUpload();
 *
 * await upload({ path: '/path/to/quest.md' });
 * // or
 * await upload({ text: '# Quest Title\n\nScene content...' });
 */
export function useNsdUpload(): UseNsdUploadReturn {
  const logger = useLogger();

  // State for upload tracking
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<NsdUploadProgress | null>(initialProgress);
  const [scenes, setScenes] = useState<NSDSceneDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track upload state without re-creating listeners
  const isUploadingRef = useRef<boolean>(false);

  // Update ref when state changes
  useEffect(() => {
    isUploadingRef.current = isUploading;
  }, [isUploading]);

  /**
   * Setup event listeners on mount.
   * CRITICAL: Cleanup listeners on unmount to prevent memory leaks.
   * NOTE: Uses ref to check upload state without re-creating listeners.
   */
  useEffect(() => {
    // Progress events
    const cleanupProgress = window.coreto.nsd.onProgress((payload: NSDUploadProgress) => {
      // Only process events when an upload is in progress
      if (!isUploadingRef.current) {
        return;
      }

      try {
        setProgress({
          stage: payload.stage,
          percent: payload.percent,
        });
        logger.debug(`NSD upload progress: ${payload.stage} - ${payload.percent}%`);
      } catch (err) {
        logger.error(`Error in progress event handler: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    // Error events
    const cleanupError = window.coreto.nsd.onError((errorPayload: NSDUploadError) => {
      // Only process events when an upload is in progress
      if (!isUploadingRef.current) {
        return;
      }

      try {
        setError(errorPayload.message);
        setIsUploading(false);
        setProgress(null);
        logger.error(`NSD upload error: ${errorPayload.code} - ${errorPayload.message}`);
      } catch (err) {
        // Log the error but avoid recursive error handling
        logger.error(`Error in error event handler: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    // Cleanup on unmount
    return () => {
      try {
        cleanupProgress();
        cleanupError();
      } catch (err) {
        logger.error(`Error during event listener cleanup: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
  }, [logger]);

  /**
   * Uploads an NSD document for parsing and scene extraction.
   * Returns immediately with correlation ID - result comes via progress events.
   * NOTE: Correlation ID is generated by the preload layer.
   */
  const upload = useCallback(
    async (source: NsdUploadSource): Promise<void> => {
      // Validate source
      if (!source.path && !source.text) {
        const errorMessage = 'NSD upload source must provide either path or text';
        setError(errorMessage);
        logger.error(errorMessage);
        return;
      }

      // Reset state
      setIsUploading(true);
      setProgress(null);
      setScenes([]);
      setError(null);

      try {
        const coretoAPI = window.coreto;

        logger.debug('Starting NSD upload');

        const response = await coretoAPI.nsd.upload(source);

        if (!response.success) {
          const errorMessage = response.error.message ?? 'Unknown upload error';
          setError(errorMessage);
          setIsUploading(false);
          logger.error(`NSD upload failed: ${errorMessage}`);
          return;
        }

        // Upload successful, extract scenes from response
        const uploadResponse = response.data;
        setScenes(uploadResponse.sceneList);
        setProgress({ stage: 'complete', percent: 100 });
        setIsUploading(false);
        logger.info(`NSD upload complete: ${uploadResponse.sceneList.length} scenes extracted`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setIsUploading(false);
        setProgress(null);
        logger.error(`NSD upload exception: ${errorMessage}`);
      }
    },
    [logger]
  );

  return {
    upload,
    isUploading,
    progress,
    scenes,
    error,
  };
}

export default useNsdUpload;
