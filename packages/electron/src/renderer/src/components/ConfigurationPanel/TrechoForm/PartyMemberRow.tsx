/**
 * PartyMemberRow Component
 *
 * Renders a single party member configuration with class and level selection.
 */

import { type FC, useCallback } from 'react';
import { Trash2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartyMemberFormData, SelectOption } from '../types';
import { InputField, SelectField } from './shared';

export interface PartyMemberRowProps {
  member: PartyMemberFormData;
  index: number;
  classes: SelectOption[];
  errors: Record<string, string>;
  onChange: (index: number, member: PartyMemberFormData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export const PartyMemberRow: FC<PartyMemberRowProps> = ({
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
