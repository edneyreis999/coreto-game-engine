/**
 * TrechoForm Component
 *
 * Form for creating or editing a trecho configuration.
 * Provides real-time validation using Zod schemas.
 *
 * @see Task 67885303-12bf-4091-b9a1-b55662b4735e
 */

import { type FC, useCallback } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrechoFormProps } from '../types';
import { InputField, CheckboxField } from './shared';
import { PartyMemberRow } from './PartyMemberRow';
import { useTrechoForm } from './hooks';

/**
 * TrechoForm Component
 *
 * Form for creating or editing trecho configuration with:
 * - ID and name fields
 * - Level range inputs
 * - TTK target inputs
 * - Tolerance percentage
 * - Troop multi-select
 * - Party member configuration
 * - Real-time validation
 *
 * @example
 * <TrechoForm
 *   mode="create"
 *   classes={[{ value: 1, label: 'Warrior' }]}
 *   troops={[{ value: 1, label: 'Goblin' }]}
 *   onSubmit={(data) => console.log('Saved:', data)}
 *   onCancel={() => console.log('Cancelled')}
 * />
 */
export const TrechoForm: FC<TrechoFormProps> = ({
  mode,
  initialData,
  classes,
  troops,
  onSubmit,
  onCancel,
  className,
}) => {
  // ========================================================================
  // Form State Management
  // ========================================================================

  const {
    formData,
    selectedTroopIds,
    errors,
    isFormValid,
    updateField,
    updatePartyMember,
    addPartyMember,
    removePartyMember,
    toggleTroop,
    validate,
    getSubmitData,
  } = useTrechoForm({ initialData, classes });

  // ========================================================================
  // Submit Handler
  // ========================================================================

  const handleSubmit = useCallback(() => {
    if (!validate()) {
      return;
    }
    onSubmit(getSubmitData());
  }, [validate, getSubmitData, onSubmit]);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {mode === 'create' ? 'Add Trecho' : 'Edit Trecho'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure story segment with TTK targets and party
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'p-2 rounded-md',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'transition-colors'
          )}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Trecho ID"
          value={formData.id}
          onChange={(v) => updateField('id', String(v))}
          error={errors.id}
          placeholder="ato1-floresta"
          required
        />
        <InputField
          label="Name"
          value={formData.name}
          onChange={(v) => updateField('name', String(v))}
          error={errors.name}
          placeholder="Ato 1 - Floresta"
        />
      </div>

      {/* Level Range */}
      <div className="p-4 rounded-md border border-border bg-card">
        <h4 className="text-sm font-semibold mb-3">Anchor Level Range</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Minimum Level"
            value={formData.anchorLevelMin}
            onChange={(v) => updateField('anchorLevelMin', Number(v))}
            error={errors.anchorLevelMin}
            type="number"
            min={1}
            max={99}
            required
          />
          <InputField
            label="Maximum Level"
            value={formData.anchorLevelMax}
            onChange={(v) => updateField('anchorLevelMax', Number(v))}
            error={errors.anchorLevelMax}
            type="number"
            min={1}
            max={99}
            required
          />
        </div>
      </div>

      {/* TTK Target */}
      <div className="p-4 rounded-md border border-border bg-card">
        <h4 className="text-sm font-semibold mb-3">TTK Target</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            label="Target Turns"
            value={formData.targetTtkTurns}
            onChange={(v) => updateField('targetTtkTurns', Number(v))}
            error={errors.targetTtkTurns}
            type="number"
            min={1}
            required
          />
          <InputField
            label="Target Actions"
            value={formData.targetTtkActions}
            onChange={(v) => updateField('targetTtkActions', Number(v))}
            error={errors.targetTtkActions}
            type="number"
            min={1}
            required
          />
          <InputField
            label="Tolerance %"
            value={formData.tolerancePercent}
            onChange={(v) => updateField('tolerancePercent', Number(v))}
            error={errors.tolerancePercent}
            type="number"
            min={0}
            max={100}
            required
          />
        </div>
      </div>

      {/* Troops Selection */}
      <div className="p-4 rounded-md border border-border bg-card">
        <h4 className="text-sm font-semibold mb-3">
          Associated Troops ({selectedTroopIds.size} selected)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {troops.map((troop) => (
            <CheckboxField
              key={troop.value}
              label={`(${troop.value}) ${troop.label}`}
              checked={selectedTroopIds.has(troop.value)}
              onChange={() => toggleTroop(troop.value)}
            />
          ))}
        </div>
        {selectedTroopIds.size === 0 && (
          <span className="text-xs text-destructive mt-2">
            At least 1 troop must be selected
          </span>
        )}
      </div>

      {/* Party Configuration */}
      <div className="p-4 rounded-md border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">
            Party Configuration ({formData.party.members.length}/4)
          </h4>
          {formData.party.members.length < 4 && (
            <button
              type="button"
              onClick={addPartyMember}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-xs',
                'bg-secondary text-secondary-foreground rounded-md',
                'hover:bg-secondary/80 transition-colors'
              )}
            >
              <Plus className="h-3 w-3" />
              <span>Add Member</span>
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {formData.party.members.map((member, index) => (
            <PartyMemberRow
              key={index}
              member={member}
              index={index}
              classes={classes}
              errors={errors}
              onChange={updatePartyMember}
              onRemove={removePartyMember}
              canRemove={formData.party.members.length > 1}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'px-4 py-2 rounded-md border border-border',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'transition-colors text-sm font-medium'
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'text-sm font-medium'
          )}
        >
          <Check className="h-4 w-4" />
          <span>{mode === 'create' ? 'Add Trecho' : 'Save Changes'}</span>
        </button>
      </div>
    </div>
  );
};

export default TrechoForm;
