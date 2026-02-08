/**
 * AlertDialog Component
 *
 * A styled alert dialog component for confirming destructive actions.
 * Provides consistent UI that matches the app theme using Tailwind CSS.
 *
 * Features:
 * - Modal overlay with backdrop
 * - Customizable title, description, and action buttons
 * - Keyboard accessibility (Escape to cancel)
 * - Consistent styling with shadcn/ui design system
 *
 * @example
 * <AlertDialog
 *   open={isOpen}
 *   title="Delete Entry?"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   cancelLabel="Cancel"
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 */

import {
  type FC,
  useEffect,
  useCallback,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for AlertDialog component.
 */
export interface AlertDialogProps {
  /**
   * Whether the dialog is currently open.
   */
  open: boolean;

  /**
   * Dialog title.
   */
  title: string;

  /**
   * Dialog description text.
   */
  description: string;

  /**
   * Label for the confirm button.
   * @default "Confirm"
   */
  confirmLabel?: string;

  /**
   * Label for the cancel button.
   * @default "Cancel"
   */
  cancelLabel?: string;

  /**
   * Whether the confirm button should use destructive styling.
   * @default true
   */
  destructive?: boolean;

  /**
   * Callback when confirm button is clicked.
   */
  onConfirm: () => void;

  /**
   * Callback when cancel button is clicked or dialog is dismissed.
   */
  onCancel: () => void;

  /**
   * Additional CSS class names.
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * AlertDialog Component
 *
 * Renders a modal dialog for confirming actions.
 *
 * @example
 * <AlertDialog
 *   open={showDialog}
 *   title="Delete this entry?"
 *   description="This action cannot be undone."
 *   onConfirm={() => deleteEntry(id)}
 *   onCancel={() => setShowDialog(false)}
 * />
 */
export const AlertDialog: FC<AlertDialogProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
  className,
}) => {
  /**
   * Handle Escape key to close dialog.
   */
  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && open) {
      onCancel();
    }
  }, [open, onCancel]);

  /**
   * Register and unregister Escape key handler.
   */
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  /**
   * Handle confirm button click.
   */
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  /**
   * Handle backdrop click to close.
   */
  const handleBackdropClick = useCallback(() => {
    onCancel();
  }, [onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        'animate-in fade-in duration-200',
        className
      )}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className={cn(
          'relative bg-background rounded-lg shadow-lg border border-border',
          'max-w-md w-full mx-4 p-6',
          'animate-in zoom-in-95 duration-200'
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'absolute top-4 right-4 p-1 rounded-md',
            'hover:bg-accent transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
          )}
          aria-label="Close dialog"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Title */}
        <h2
          id="alert-dialog-title"
          className="text-lg font-semibold text-foreground pr-8"
        >
          {title}
        </h2>

        {/* Description */}
        <p
          id="alert-dialog-description"
          className="text-sm text-muted-foreground mt-2"
        >
          {description}
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium',
              'bg-secondary text-secondary-foreground',
              'hover:bg-secondary/80 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
            )}
          >
            {cancelLabel}
          </button>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'transition-colors',
              destructive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
