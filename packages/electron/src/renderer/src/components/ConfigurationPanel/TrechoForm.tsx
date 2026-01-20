/**
 * TrechoForm Component
 *
 * Form for creating or editing a trecho configuration.
 * Provides real-time validation using Zod schemas.
 *
 * @see Task 67885303-12bf-4091-b9a1-b55662b4735e
 */

import { type FC, useState, useCallback, type ChangeEvent } from 'react';
import {
  X,
  Check,
  ChevronDown,
  Plus,
  Trash2,
  User,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type {
  TrechoFormData,
  PartyMemberFormData,
  SelectOption,
  TrechoFormProps,
} from './types';
import {
  getDefaultTrechoFormData,
  validateTrechoForm,
  validateTrechoField,
} from './validation';

// ============================================================================
// Input Field Component
// ============================================================================

interface InputFieldProps {
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

const InputField: FC<InputFieldProps> = ({
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

// ============================================================================
// Select Field Component
// ============================================================================

interface SelectFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  options: SelectOption[];
  error?: string;
  required?: boolean;
}

const SelectField: FC<SelectFieldProps> = ({
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

// ============================================================================
// Checkbox Field Component
// ============================================================================

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const CheckboxField: FC<CheckboxFieldProps> = ({ label, checked, onChange }) => {
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

// ============================================================================
// Party Member Row Component
// ============================================================================

interface PartyMemberRowProps {
  member: PartyMemberFormData;
  index: number;
  classes: SelectOption[];
  errors: Record<string, string>;
  onChange: (index: number, member: PartyMemberFormData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const PartyMemberRow: FC<PartyMemberRowProps> = ({
  member,
  index,
  classes,
  errors,
  onChange,
  onRemove,
  canRemove,
}) => {
  const handleClassChange = useCallback(
    (classId: number) => {
      onChange(index, { ...member, classId });
    },
    [index, member, onChange]
  );

  const handleLevelChange = useCallback(
    (level: number) => {
      onChange(index, { ...member, level });
    },
    [index, member, onChange]
  );

  return (
    <div className="flex items-start gap-3 p-3 rounded-md border border-border bg-card">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex-shrink-0 mt-5">
        <User className="h-4 w-4" />
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField
          label={`Member ${index + 1} Class`}
          value={member.classId}
          onChange={handleClassChange}
          options={classes}
          error={errors[`party.members.${index}.classId`]}
          required
        />
        <InputField
          label={`Member ${index + 1} Level`}
          value={member.level}
          onChange={handleLevelChange}
          type="number"
          min={1}
          max={99}
          error={errors[`party.members.${index}.level`]}
          required
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className={cn(
            'p-2 rounded-md mt-5',
            'hover:bg-destructive/10 hover:text-destructive',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'transition-colors flex-shrink-0'
          )}
          title="Remove party member"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Trecho Form Component
// ============================================================================

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
  // State
  // ========================================================================

  const [formData, setFormData] = useState<TrechoFormData>(
    initialData ?? getDefaultTrechoFormData()
  );

  const [selectedTroopIds, setSelectedTroopIds] = useState<Set<number>>(
    new Set(initialData?.troopIds ?? [])
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ========================================================================
  // Field Update Handlers
  // ========================================================================

  const updateField = useCallback(
    <K extends keyof TrechoFormData>(field: K, value: TrechoFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Real-time validation
      const error = validateTrechoField(field, value);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    },
    []
  );

  // ========================================================================
  // Party Handlers
  // ========================================================================

  const updatePartyMember = useCallback(
    (index: number, member: PartyMemberFormData) => {
      setFormData((prev) => ({
        ...prev,
        party: {
          ...prev.party,
          members: prev.party.members.map((m, i) =>
            i === index ? member : m
          ),
        },
      }));

      // Validate member
      const classError = validateTrechoField(
        `party.members.${index}.classId`,
        member.classId
      );
      const levelError = validateTrechoField(
        `party.members.${index}.level`,
        member.level
      );

      setErrors((prev) => {
        const newErrors = { ...prev };
        if (classError) {
          newErrors[`party.members.${index}.classId`] = classError;
        } else {
          delete newErrors[`party.members.${index}.classId`];
        }
        if (levelError) {
          newErrors[`party.members.${index}.level`] = levelError;
        } else {
          delete newErrors[`party.members.${index}.level`];
        }
        return newErrors;
      });
    },
    []
  );

  const addPartyMember = useCallback(() => {
    if (formData.party.members.length >= 4) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      party: {
        ...prev.party,
        members: [
          ...prev.party.members,
          { classId: classes[0]?.value ?? 1, level: 1 },
        ],
      },
    }));
  }, [formData.party.members.length, classes]);

  const removePartyMember = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      party: {
        ...prev.party,
        members: prev.party.members.filter((_, i) => i !== index),
      },
    }));
  }, []);

  // ========================================================================
  // Troop Selection Handlers
  // ========================================================================

  const toggleTroop = useCallback(
    (troopId: number) => {
      setSelectedTroopIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(troopId)) {
          newSet.delete(troopId);
        } else {
          newSet.add(troopId);
        }
        return newSet;
      });

      // Update form data
      setFormData((prev) => {
        const newTroopIds = selectedTroopIds.has(troopId)
          ? prev.troopIds.filter((id) => id !== troopId)
          : [...prev.troopIds, troopId];
        return { ...prev, troopIds: newTroopIds };
      });
    },
    [selectedTroopIds]
  );

  // ========================================================================
  // Submit Handler
  // ========================================================================

  const handleSubmit = useCallback(() => {
    // Validate entire form
    const validation = validateTrechoForm({
      ...formData,
      troopIds: Array.from(selectedTroopIds),
    });

    if (!validation.isValid) {
      setErrors(
        Object.fromEntries(
          Object.entries(validation.errors).map(([k, v]) => [k, v.message])
        )
      );
      return;
    }

    // Submit with current troop selection
    onSubmit({
      ...formData,
      troopIds: Array.from(selectedTroopIds),
    });
  }, [formData, selectedTroopIds, onSubmit]);

  // ========================================================================
  // Validation Status
  // ========================================================================

  const hasErrors = Object.keys(errors).length > 0;
  const isFormValid =
    formData.id.trim() !== '' &&
    selectedTroopIds.size > 0 &&
    formData.party.members.length >= 1 &&
    !hasErrors;

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
              label={troop.label}
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
