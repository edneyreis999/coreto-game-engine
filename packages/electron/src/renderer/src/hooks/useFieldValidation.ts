/**
 * useFieldValidation Hook
 *
 * Custom React hook for managing field validation state.
 * Provides real-time validation feedback with debouncing.
 *
 * Features:
 * - Real-time validation with debouncing
 * - Error/warning message management
 * - Validation status tracking (valid, invalid, pending)
 * - Customizable validation rules
 *
 * @see Task 08 - Real-time Validation
 */

import { useCallback, useEffect, useState, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Validation result.
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity?: 'error' | 'warning' | 'info';
}

/**
 * Validation function type.
 */
export type ValidationFunction = (value: string) => ValidationResult | Promise<ValidationResult>;

/**
 * Return type for useFieldValidation hook.
 */
export interface UseFieldValidationReturn {
  /**
   * Current validation status.
   */
  status: 'idle' | 'validating' | 'valid' | 'invalid';

  /**
   * Validation error/warning message.
   */
  message: string | null;

  /**
   * Message severity.
   */
  severity: 'error' | 'warning' | 'info' | null;

  /**
   * Whether the field has been touched (user interacted with it).
   */
  isTouched: boolean;

  /**
   * Whether the field is currently valid (no errors).
   */
  isValid: boolean;

  /**
   * Validate the field value.
   * @param value - Value to validate
   */
  validate: (value: string) => Promise<void>;

  /**
   * Mark the field as touched.
   */
  touch: () => void;

  /**
   * Reset validation state.
   */
  reset: () => void;
}

/**
 * Hook options.
 */
export interface UseFieldValidationOptions {
  /**
   * Validation function to use.
   */
  validateFn: ValidationFunction;

  /**
   * Debounce delay in milliseconds.
   * @default 300
   */
  debounceMs?: number;

  /**
   * Whether to validate on blur only.
   * @default false
   */
  validateOnBlurOnly?: boolean;

  /**
   * Initial touched state.
   * @default false
   */
  initiallyTouched?: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useFieldValidation Hook
 *
 * Manages field validation state with debouncing.
 *
 * @example
 * const { status, message, validate, touch, reset } = useFieldValidation({
 *   validateFn: (value) => {
 *     if (!value) return { isValid: false, message: 'Required' };
 *     if (value.length < 3) return { isValid: false, message: 'Too short' };
 *     return { isValid: true };
 *   }
 * });
 */
export function useFieldValidation(options: UseFieldValidationOptions): UseFieldValidationReturn {
  const {
    validateFn,
    debounceMs = 300,
    validateOnBlurOnly = false,
    initiallyTouched = false,
  } = options;

  // State
  const [status, setStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [severity, setSeverity] = useState<'error' | 'warning' | 'info' | null>(null);
  const [isTouched, setIsTouched] = useState(initiallyTouched);

  // Refs for debouncing and cleanup
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Perform validation.
   */
  const validate = useCallback(
    async (value: string) => {
      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      // If validate on blur only and not touched, skip validation
      if (validateOnBlurOnly && !isTouched) {
        return;
      }

      // If not validating on blur only, debounce the validation
      if (!validateOnBlurOnly && debounceMs > 0) {
        setStatus('validating');

        debounceRef.current = setTimeout(async () => {
          if (!isMountedRef.current) {
            return;
          }

          try {
            const result = await validateFn(value);

            if (!isMountedRef.current) {
              return;
            }

            if (result.isValid) {
              setStatus('valid');
              setMessage(null);
              setSeverity(null);
            } else {
              setStatus('invalid');
              setMessage(result.message ?? 'Validation failed');
              setSeverity(result.severity ?? 'error');
            }
          } catch {
            if (!isMountedRef.current) {
              return;
            }

            setStatus('invalid');
            setMessage('Validation error occurred');
            setSeverity('error');
          }
        }, debounceMs);

        return;
      }

      // Immediate validation (no debounce or blur-only)
      setStatus('validating');

      try {
        const result = await validateFn(value);

        if (!isMountedRef.current) {
          return;
        }

        if (result.isValid) {
          setStatus('valid');
          setMessage(null);
          setSeverity(null);
        } else {
          setStatus('invalid');
          setMessage(result.message ?? 'Validation failed');
          setSeverity(result.severity ?? 'error');
        }
      } catch {
        if (!isMountedRef.current) {
          return;
        }

        setStatus('invalid');
        setMessage('Validation error occurred');
        setSeverity('error');
      }
    },
    [validateFn, debounceMs, validateOnBlurOnly, isTouched]
  );

  /**
   * Mark field as touched.
   */
  const touch = useCallback(() => {
    setIsTouched(true);
  }, []);

  /**
   * Reset validation state.
   */
  const reset = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    setStatus('idle');
    setMessage(null);
    setSeverity(null);
    setIsTouched(initiallyTouched);
  }, [initiallyTouched]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Derived state
  const isValid = status === 'valid' || (status === 'idle' && !message);

  return {
    status,
    message,
    severity,
    isTouched,
    isValid,
    validate,
    touch,
    reset,
  };
}

export default useFieldValidation;
