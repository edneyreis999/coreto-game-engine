/**
 * CheckboxField Component
 *
 * Reusable checkbox input with label.
 */

import { type FC } from 'react';

export interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const CheckboxField: FC<CheckboxFieldProps> = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-input accent-primary"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
};
