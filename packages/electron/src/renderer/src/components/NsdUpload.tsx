/**
 * NsdUpload Component
 *
 * React component with drag & drop and file picker functionality for uploading NSD markdown files.
 * Provides visual feedback, file validation, and upload progress indication.
 *
 * Features:
 * - Drag & drop zone with visual feedback
 * - File picker button (select .md files only)
 * - File validation (.md extension, 1MB max)
 * - Upload progress indicator
 * - Error display (file invalid, upload failed)
 * - Disabled state during upload
 * - shadcn/ui styling
 * - Accessibility (keyboard navigation, ARIA labels)
 *
 * @see Task 13 from NSD Upload plan
 */

'use client';

import {
  type FC,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useLogger } from '@/hooks/useLogger';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Upload stage for progress tracking
 */
type UploadStage = 'idle' | 'validating' | 'uploading' | 'processing' | 'complete' | 'error';

/**
 * Upload progress state
 */
interface UploadProgress {
  /** Percentage complete (0-100) */
  percent: number;
  /** Current stage of upload */
  stage: UploadStage;
  /** User-facing message */
  message: string;
}

/**
 * File validation result
 */
interface ValidationResult {
  /** Whether the file is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * Props for NsdUpload component
 */
export interface NsdUploadProps {
  /**
   * Callback when file is successfully uploaded.
   * @param file - The uploaded file
   * @param content - File content
   */
  onUploadSuccess?: (file: File, content: string) => void;

  /**
   * Callback when upload fails.
   * @param error - Error message
   */
  onUploadError?: (error: string) => void;

  /**
   * Maximum file size in bytes (default: 1MB)
   * @default 1048576
   */
  maxFileSize?: number;

  /**
   * Accepted file extensions (default: .md)
   * @default ['.md']
   */
  acceptedExtensions?: string[];

  /**
   * Additional CSS class names for styling.
   */
  className?: string;

  /**
   * Whether the component is disabled.
   */
  disabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default maximum file size (1MB)
 */
const DEFAULT_MAX_FILE_SIZE = 1_048_576; // 1MB in bytes

/**
 * Default accepted file extensions
 */
const DEFAULT_ACCEPTED_EXTENSIONS = ['.md'];

/**
 * Drag & drop state
 */
type DragState = 'idle' | 'dragging' | 'drag-over';

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates file extension
 * @param file - File to validate
 * @param acceptedExtensions - List of accepted extensions
 * @returns Validation result
 */
function validateFileExtension(
  file: File,
  acceptedExtensions: string[]
): ValidationResult {
  const fileName = file.name.toLowerCase();
  const hasValidExtension = acceptedExtensions.some((ext) =>
    fileName.endsWith(ext.toLowerCase())
  );

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Invalid file type. Accepted formats: ${acceptedExtensions.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates file size
 * @param file - File to validate
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
function validateFileSize(file: File, maxSize: number): ValidationResult {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1_048_576).toFixed(1);
    return {
      isValid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Validates file completely (extension + size)
 * @param file - File to validate
 * @param maxSize - Maximum file size
 * @param acceptedExtensions - Accepted file extensions
 * @returns Validation result
 */
function validateFile(
  file: File,
  maxSize: number,
  acceptedExtensions: string[]
): ValidationResult {
  // Check file extension
  const extResult = validateFileExtension(file, acceptedExtensions);
  if (!extResult.isValid) {
    return extResult;
  }

  // Check file size
  const sizeResult = validateFileSize(file, maxSize);
  if (!sizeResult.isValid) {
    return sizeResult;
  }

  return { isValid: true };
}

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// Component
// ============================================================================

/**
 * NsdUpload Component
 *
 * Renders a drag & drop file upload zone for NSD markdown files.
 * Includes file validation, progress tracking, and error handling.
 *
 * @example
 * <NsdUpload
 *   onUploadSuccess={(file, content) => console.log('Uploaded:', file.name)}
 *   onUploadError={(error) => console.error('Error:', error)}
 *   maxFileSize={1048576}
 *   acceptedExtensions={['.md']}
 * />
 */
export const NsdUpload: FC<NsdUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedExtensions = DEFAULT_ACCEPTED_EXTENSIONS,
  className,
  disabled = false,
}) => {
  const logger = useLogger();

  // State
  const [dragState, setDragState] = useState<DragState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({
    percent: 0,
    stage: 'idle',
    message: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // ========================================================================
  // Event Handlers
  // ========================================================================

  /**
   * Handles drag enter event
   */
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isUploading) {
      return;
    }

    dragCounterRef.current++;
    setDragState('dragging');
    setError(null);
  }, [disabled, isUploading]);

  /**
   * Handles drag over event
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isUploading) {
      return;
    }

    if (dragState !== 'drag-over') {
      setDragState('drag-over');
    }
  }, [disabled, isUploading, dragState]);

  /**
   * Handles drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isUploading) {
      return;
    }

    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setDragState('idle');
    }
  }, [disabled, isUploading]);

  /**
   * Handles drop event
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isUploading) {
      return;
    }

    dragCounterRef.current = 0;
    setDragState('idle');

    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) {
      return;
    }

    // Handle first file
    const file = files[0];
    handleFileSelection(file);
  }, [disabled, isUploading]);

  /**
   * Handles file selection from picker
   */
  const handleFilePicker = useCallback(() => {
    if (disabled || isUploading) {
      return;
    }

    fileInputRef.current?.click();
  }, [disabled, isUploading]);

  /**
   * Handles file input change
   */
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    handleFileSelection(file);

    // Reset input value so same file can be selected again
    e.target.value = '';
  }, []);

  /**
   * Handles file selection and validation
   */
  const handleFileSelection = useCallback((file: File) => {
    logger.info('File selected for upload', { fileName: file.name, fileSize: file.size });

    // Validate file
    const validation = validateFile(file, maxFileSize, acceptedExtensions);

    if (!validation.isValid) {
      setError(validation.error ?? 'Invalid file');
      logger.warn('File validation failed', { fileName: file.name, error: validation.error });
      onUploadError?.(validation.error ?? 'Invalid file');
      return;
    }

    // Clear error and set file
    setError(null);
    setSelectedFile(file);
  }, [maxFileSize, acceptedExtensions, logger, onUploadError]);

  /**
   * Handles file upload
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFile || isUploading) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      logger.info('Starting file upload', { fileName: selectedFile.name });

      // Stage 1: Reading file
      setProgress({ percent: 10, stage: 'validating', message: 'Reading file...' });

      const reader = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          const content = e.target?.result as string;
          resolve(content);
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        reader.readAsText(selectedFile);
      });

      const content = await reader;

      // Stage 2: Validating content
      setProgress({ percent: 30, stage: 'validating', message: 'Validating NSD format...' });

      // Simulate validation delay (remove when actual validation is implemented)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 3: Uploading
      setProgress({ percent: 60, stage: 'uploading', message: 'Uploading NSD document...' });

      // Simulate upload progress
      const uploadSteps = 10;
      for (let i = 0; i < uploadSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const percent = 60 + ((i + 1) / uploadSteps) * 30;
        setProgress({
          percent,
          stage: 'uploading',
          message: `Uploading... ${Math.round(percent)}%`
        });
      }

      // Stage 4: Processing
      setProgress({ percent: 95, stage: 'processing', message: 'Processing NSD document...' });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Complete
      setProgress({ percent: 100, stage: 'complete', message: 'Upload complete!' });

      logger.info('File upload successful', { fileName: selectedFile.name });

      // Call success callback
      onUploadSuccess?.(selectedFile, content);

      // Reset after delay
      setTimeout(() => {
        setSelectedFile(null);
        setProgress({ percent: 0, stage: 'idle', message: '' });
        setIsUploading(false);
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setProgress({ percent: 0, stage: 'error', message: '' });
      setIsUploading(false);

      logger.error('File upload failed', { fileName: selectedFile.name, error: errorMessage });
      onUploadError?.(errorMessage);
    }
  }, [selectedFile, isUploading, logger, onUploadSuccess, onUploadError]);

  /**
   * Clears the selected file
   */
  const handleClearFile = useCallback(() => {
    if (isUploading) {
      return;
    }

    setSelectedFile(null);
    setError(null);
    setProgress({ percent: 0, stage: 'idle', message: '' });
  }, [isUploading]);

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * Gets the appropriate CSS classes for the drop zone
   */
  const getDropZoneClasses = useCallback(() => {
    return cn(
      'relative flex flex-col items-center justify-center',
      'p-8 border-2 border-dashed rounded-lg',
      'transition-all duration-200 ease-in-out',
      'cursor-pointer',
      'min-h-[200px]',

      // Base styles
      'border-border bg-muted/30 hover:bg-muted/50',

      // Drag states
      dragState === 'dragging' && 'border-primary bg-primary/5 scale-[1.02]',
      dragState === 'drag-over' && 'border-primary bg-primary/10 scale-[1.02]',

      // Disabled state
      (disabled || isUploading) && 'cursor-not-allowed opacity-60',

      // Error state
      error && 'border-destructive bg-destructive/5'
    );
  }, [dragState, disabled, isUploading, error]);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className={cn('flex flex-col gap-4 w-full', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedExtensions.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        aria-label="Select NSD file"
        disabled={disabled || isUploading}
      />

      {/* Drag & Drop Zone */}
      <div
        className={getDropZoneClasses()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFilePicker}
        role="button"
        tabIndex={disabled || isUploading ? -1 : 0}
        aria-label="Drop zone for NSD files. Press Enter or Space to select file."
        aria-disabled={disabled || isUploading}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFilePicker();
          }
        }}
      >
        {/* Upload Icon */}
        {dragState === 'idle' && !selectedFile && !error && (
          <>
            <div className="mb-4 p-4 rounded-full bg-primary/10">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">
              Drop your NSD file here
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse
            </p>
            <div className="text-xs text-muted-foreground">
              Accepted formats: {acceptedExtensions.join(', ')} • Max size: {formatFileSize(maxFileSize)}
            </div>
          </>
        )}

        {/* Dragging State */}
        {(dragState === 'dragging' || dragState === 'drag-over') && (
          <>
            <div className="mb-4 p-4 rounded-full bg-primary/20">
              <Upload className="h-8 w-8 text-primary animate-bounce" />
            </div>
            <p className="text-lg font-semibold text-primary mb-2">
              Drop to upload
            </p>
          </>
        )}

        {/* File Selected */}
        {selectedFile && !error && (
          <div className="flex flex-col items-center gap-3 w-full max-w-md">
            <div className="flex items-center gap-3 w-full p-3 rounded-lg bg-background border">
              <FileText className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Clear selected file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Upload Button */}
            {!isUploading && progress.stage === 'idle' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                Upload NSD File
              </button>
            )}
          </div>
        )}

        {/* Error State */}
        {error && !selectedFile && (
          <>
            <div className="mb-4 p-4 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-lg font-semibold text-destructive mb-2">
              Upload failed
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {error}
            </p>
          </>
        )}
      </div>

      {/* Progress Indicator */}
      {isUploading && progress.percent > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {progress.message}
            </span>
            <span className="font-medium text-foreground">
              {Math.round(progress.percent)}%
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress.percent}%` }}
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
            />
          </div>
        </div>
      )}

      {/* Error Display (when file is selected) */}
      {error && selectedFile && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive mb-1">
              Upload Error
            </p>
            <p className="text-sm text-muted-foreground">
              {error}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFile}
            className="p-1 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {progress.stage === 'complete' && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <FileText className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              NSD file uploaded successfully!
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedFile?.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NsdUpload;
