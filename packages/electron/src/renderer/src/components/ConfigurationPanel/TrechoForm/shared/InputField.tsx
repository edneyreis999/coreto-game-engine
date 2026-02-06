/**
 * InputField Component
 *
 * Reusable input field with label, validation error display, and support for text/number types.
 */

import { type FC, useCallback, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

export interface InputFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  type?: 'text' | 'number';
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
}

export const InputField: FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  required = false,
  min,
  max,
}) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (type === 'number') {
        const parsed = newValue === '' ? NaN : Number(newValue);
        onChange(parsed);
      } else {
        onChange(newValue);
      }
    },
    [onChange, type]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        className={cn(
          'px-3 py-2 rounded-md border bg-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'text-sm',
          error && 'border-destructive',
          !error && 'border-input'
        )}
      />
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
};
