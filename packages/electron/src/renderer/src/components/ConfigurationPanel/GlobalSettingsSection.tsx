/**
 * GlobalSettingsSection Component
 *
 * Form section for global configuration settings.
 * Provides inputs for seed and maxBattleTurns.
 *
 * @see Task 67885303-12bf-4091-b9a1-b55662b4735e
 */

import { type FC, type ChangeEvent } from 'react';
import { Settings } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { GlobalSettingsFormData } from './types';

// ============================================================================
// Input Field Component (reused from TrechoForm)
// ============================================================================

interface InputFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
  min?: number;
  description?: string;
}

const InputField: FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  error,
  min,
  description,
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const parsed = e.target.value === '' ? NaN : Number(e.target.value);
    onChange(parsed);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <input
        type="number"
        value={value ?? ''}
        onChange={handleChange}
        min={min}
        className={cn(
          'px-3 py-2 rounded-md border bg-background',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'text-sm',
          error && 'border-destructive',
          !error && 'border-input'
        )}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for GlobalSettingsSection component.
 */
export interface GlobalSettingsSectionProps {
  /**
   * Current global settings values.
   */
  globalSettings: GlobalSettingsFormData;

  /**
   * Callback when settings are updated.
   * @param settings - Partial settings to update
   */
  onUpdate: (settings: Partial<GlobalSettingsFormData>) => void;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * GlobalSettingsSection Component
 *
 * Displays global configuration settings with:
 * - Seed input for deterministic simulation
 * - MaxBattleTurns input for timeout control
 *
 * @example
 * <GlobalSettingsSection
 *   globalSettings={{ seed: 12345, maxBattleTurns: 100 }}
 *   onUpdate={(settings) => console.log('Updated:', settings)}
 * />
 */
export const GlobalSettingsSection: FC<GlobalSettingsSectionProps> = ({
  globalSettings,
  onUpdate,
  className,
}) => {
  // ========================================================================
  // Handlers
  // ========================================================================

  const handleSeedChange = (seed: number): void => {
    onUpdate({ seed });
  };

  const handleMaxTurnsChange = (maxBattleTurns: number): void => {
    onUpdate({ maxBattleTurns });
  };

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Global Settings</h3>
      </div>

      {/* Settings Grid */}
      <div className="p-4 rounded-md border border-border bg-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="RNG Seed"
            value={globalSettings.seed}
            onChange={handleSeedChange}
            min={1}
            description="Random seed for deterministic simulation results"
          />
          <InputField
            label="Max Battle Turns"
            value={globalSettings.maxBattleTurns}
            onChange={handleMaxTurnsChange}
            min={1}
            description="Maximum turns before battle timeout (optional)"
          />
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 rounded-md bg-secondary/50 text-sm text-secondary-foreground">
          <p className="font-medium mb-1">About Global Settings</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>
              <strong>Seed:</strong> Ensures reproducible simulation results across
              runs
            </li>
            <li>
              <strong>Max Turns:</strong> Prevents infinite battles by forcing
              timeout
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsSection;
