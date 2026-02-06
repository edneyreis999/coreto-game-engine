/**
 * SelectField Component
 *
 * Reusable select dropdown with label and validation error display.
 */

import { type FC } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SelectOption } from '../../types';

export interface SelectFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
}

export const SelectField: FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  required = false,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            'w-full px-3 py-2 rounded-md border bg-background appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'text-sm pr-9',
            error && 'border-destructive',
            !error && 'border-input'
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
};
