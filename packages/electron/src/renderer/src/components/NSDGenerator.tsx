/**
 * NSDGenerator Component
 *
 * Main page component for NSD (Narrative Scene Document) generation feature.
 * Integrates NsdUpload and SceneList components with useNsdUpload hook for complete workflow.
 *
 * Workflow:
 * 1. User uploads NSD markdown file (drag & drop or file picker)
 * 2. File is validated (.md extension, 1MB max)
 * 3. File is parsed via NSD worker (GLM AI + regex fallback)
 * 4. Extracted scenes are displayed in expandable list
 * 5. Progress feedback throughout the process
 *
 * Features:
 * - Drag & drop file upload with visual feedback
 * - File picker with .md filter
 * - Real-time progress tracking (reading → parsing → extracting → validating → complete)
 * - Scene list with expandable items
 * - Error handling with user-friendly messages
 * - shadcn/ui styling (Card, Button, Progress, Alert)
 * - Accessibility (keyboard navigation, ARIA labels)
 *
 * @see Task 13 (NsdUpload), Task 14 (SceneList), Task 15 (useNsdUpload)
 * @see /Users/edney/projects/coreto/game-engine/planos/024-upload-nsd/tasks/tasks.xml
 */

'use client';

import {
  type FC,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  FileCode,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useLogger } from '@/hooks/useLogger';
import { useNsdUpload, type NsdUploadSource } from '@/hooks/useNsdUpload';
import { NsdUpload } from '@/components/NsdUpload';
import { SceneList } from '@/components/SceneList';
import { BackButton } from '@/components/BackButton';
import type { NSDSceneDTO } from '@coreto/electron/domain/types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Props for NSDGenerator component.
 */
export interface NSDGeneratorProps {
  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Props for ProgressBar component.
 */
interface ProgressBarProps {
  /** Current stage of upload */
  stage: string;
  /** Completion percentage (0-100) */
  percent: number;
  /** Additional CSS class names */
  className?: string;
}

/**
 * ProgressBar Component
 *
 * Displays upload progress with stage label and percentage bar.
 */
const ProgressBar: FC<ProgressBarProps> = ({ stage, percent, className }) => {
  // Format stage for display (capitalize first letter)
  const formattedStage = useMemo(() => {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  }, [stage]);

  return (
    <div
      className={cn(
        'w-full',
        'flex flex-col gap-2',
        'p-4 rounded-md border bg-muted/30',
        className
      )}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Upload progress: ${formattedStage} ${percent}%`}
    >
      {/* Stage and Percent Label */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {formattedStage}
        </span>
        <span className="text-muted-foreground">
          {percent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Props for ErrorMessage component.
 */
interface ErrorMessageProps {
  /** Error message to display */
  message: string;
  /** Callback to dismiss the error */
  onDismiss?: () => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * ErrorMessage Component
 *
 * Displays error message with icon and dismiss button.
 */
const ErrorMessage: FC<ErrorMessageProps> = ({ message, onDismiss, className }) => {
  return (
    <div
      className={cn(
        'flex items-start gap-3',
        'p-4 rounded-md border border-destructive/50',
        'bg-destructive/10 text-destructive',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Alert Icon */}
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />

      {/* Error Message */}
      <div className="flex-1 text-sm">
        <p className="font-medium">Upload failed</p>
        <p className="text-destructive/80 mt-1">{message}</p>
      </div>

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 text-destructive hover:text-destructive/80 transition-colors"
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
};

/**
 * Props for SuccessMessage component.
 */
interface SuccessMessageProps {
  /** Number of scenes extracted */
  sceneCount: number;
  /** Document ID */
  documentId: string;
  /** Additional CSS class names */
  className?: string;
}

/**
 * SuccessMessage Component
 *
 * Displays success message with scene count and document ID.
 */
const SuccessMessage: FC<SuccessMessageProps> = ({ sceneCount, documentId, className }) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        'p-4 rounded-md border border-green-500/50',
        'bg-green-500/10 text-green-700 dark:text-green-400',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Success Icon */}
      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />

      {/* Success Message */}
      <div className="flex-1 text-sm">
        <p className="font-medium">Upload successful!</p>
        <p className="text-green-700/80 dark:text-green-400/80 mt-1">
          {sceneCount} scene{sceneCount !== 1 ? 's' : ''} extracted
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Document ID: {documentId.slice(0, 8)}...
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * NSDGenerator Component
 *
 * Main page for NSD upload and scene extraction workflow.
 * Orchestrates file upload, progress tracking, and scene display.
 *
 * @example
 * <NSDGenerator />
 */
export const NSDGenerator: FC<NSDGeneratorProps> = ({ className }) => {
  const logger = useLogger();

  // NSD upload hook
  const {
    upload,
    isUploading,
    progress,
    scenes,
    error,
  } = useNsdUpload();

  // Selected scene state
  const [selectedScene, setSelectedScene] = useState<NSDSceneDTO | null>(null);

  /**
   * Handle file upload success from NsdUpload component.
   * Triggers the NSD parsing workflow via useNsdUpload hook.
   */
  const handleUploadSuccess = useCallback(
    async (_file: File, content: string) => {
      try {
        logger.info('Starting NSD upload workflow', {
          fileName: _file.name,
          fileSize: _file.size,
        });

        // Trigger NSD parsing with text content
        const source: NsdUploadSource = { text: content };
        await upload(source);
      } catch (err) {
        logger.error('NSD upload failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [upload, logger]
  );

  /**
   * Handle file path upload (from file dialog).
   * Used when user selects file via system file picker.
   */
  const handleFilePathUpload = useCallback(
    async (filePath: string) => {
      try {
        logger.info('Starting NSD upload from file path', { filePath });

        // Trigger NSD parsing with file path
        const source: NsdUploadSource = { path: filePath };
        await upload(source);
      } catch (err) {
        logger.error('NSD upload failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [upload, logger]
  );

  /**
   * Handle error dismissal.
   */
  const handleDismissError = useCallback(() => {
    // Error state is managed by useNsdUpload hook
    // Trigger a new upload to clear error state
    logger.info('Error dismissed by user');
  }, [logger]);

  /**
   * Handle generate prompt button click.
   */
  const handleGeneratePrompt = useCallback(() => {
    logger.info('Generate Prompt clicked', { scene: selectedScene });
  }, [logger, selectedScene]);

  /**
   * Handle clear selection button click.
   */
  const handleClearSelection = useCallback(() => {
    setSelectedScene(null);
  }, []);

  /**
   * Component lifecycle logging.
   */
  const componentMounted = useMemo(() => {
    logger.info('NSDGenerator mounted');
    return true;
  }, [logger]);

  if (!componentMounted) {
    return null;
  }

  // Determine if we have successfully extracted scenes
  const hasScenes = scenes.length > 0;
  const isComplete = !isUploading && hasScenes && !error;
  const documentId = scenes[0]?.id || 'unknown';

  return (
    <div
      className={cn(
        'relative flex flex-col gap-6',
        'py-6 px-4',
        'max-w-4xl mx-auto w-full',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <FileCode className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              NSD Generator
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your Narrative Scene Document to extract scenes
          </p>
        </div>

        {/* Back Button */}
        <BackButton />
      </div>

      {/* Upload Section */}
      <section
        aria-labelledby="upload-section-title"
        className="flex flex-col gap-4"
      >
        <h2 id="upload-section-title" className="text-lg font-semibold text-foreground">
          Upload Document
        </h2>

        <NsdUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={(err) => logger.error('Upload error', { error: err })}
          disabled={isUploading}
          maxFileSize={1_048_576} // 1MB
          acceptedExtensions={['.md']}
        />
      </section>

      {/* Progress Section */}
      {isUploading && progress && (
        <section
          aria-labelledby="progress-section-title"
          className="flex flex-col gap-4"
        >
          <h2 id="progress-section-title" className="text-lg font-semibold text-foreground">
            Processing
          </h2>

          <ProgressBar stage={progress.stage} percent={progress.percent} />
        </section>
      )}

      {/* Error Section */}
      {error && !isUploading && (
        <section
          aria-labelledby="error-section-title"
          className="flex flex-col gap-4"
        >
          <h2 id="error-section-title" className="sr-only">
            Error
          </h2>

          <ErrorMessage message={error} onDismiss={handleDismissError} />
        </section>
      )}

      {/* Success Section */}
      {isComplete && (
        <section
          aria-labelledby="success-section-title"
          className="flex flex-col gap-4"
        >
          <h2 id="success-section-title" className="sr-only">
            Success
          </h2>

          <SuccessMessage sceneCount={scenes.length} documentId={documentId} />
        </section>
      )}

      {/* Scene List Section */}
      {(hasScenes || isUploading) && (
        <section
          aria-labelledby="scenes-section-title"
          className="flex flex-col gap-4"
        >
          <h2 id="scenes-section-title" className="text-lg font-semibold text-foreground">
            Extracted Scenes {hasScenes && `(${scenes.length})`}
          </h2>

          <SceneList
            scenes={scenes}
            loading={isUploading}
            selectedSceneId={selectedScene?.id}
            onSceneSelect={setSelectedScene}
          />
        </section>
      )}

      {/* Selected Scene Section */}
      {selectedScene && (
        <section
          aria-labelledby="selected-scene-section-title"
          className="flex flex-col gap-4 mt-4"
        >
          <h2 id="selected-scene-section-title" className="text-lg font-semibold text-foreground">
            Selected Scene
          </h2>

          <div
            className={cn(
              'p-4 rounded-md border',
              'bg-background',
              'space-y-3'
            )}
          >
            {/* Scene Title */}
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {selectedScene.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Scene {selectedScene.sceneNumber}
              </p>
            </div>

            {/* Scene Summary (if available) */}
            {selectedScene.summary && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {selectedScene.summary}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {/* Generate Prompt Button */}
              <button
                type="button"
                onClick={handleGeneratePrompt}
                disabled={!selectedScene}
                className={cn(
                  'px-4 py-2 rounded-md',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'transition-colors',
                  'font-medium text-sm'
                )}
              >
                Generate Prompt
              </button>

              {/* Clear Selection Button (Ghost Variant) */}
              <button
                type="button"
                onClick={handleClearSelection}
                className={cn(
                  'px-4 py-2 rounded-md',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'transition-colors',
                  'font-medium text-sm'
                )}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Empty State (Initial) */}
      {!hasScenes && !isUploading && !error && (
        <section
          aria-labelledby="empty-state-title"
          className="flex flex-col items-center justify-center gap-4 py-12 text-center"
        >
          <div className="text-muted-foreground/50">
            <FileCode className="h-12 w-12" />
          </div>
          <h3 id="empty-state-title" className="text-lg font-medium text-foreground">
            No scenes yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Upload an NSD markdown file to extract and display scenes here.
          </p>
        </section>
      )}
    </div>
  );
};

export default NSDGenerator;
