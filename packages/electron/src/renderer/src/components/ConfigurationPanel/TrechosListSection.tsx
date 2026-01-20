/**
 * TrechosListSection Component
 *
 * Displays a list of configured trechos as cards/rows.
 * Provides add, edit, and delete operations for each trecho.
 *
 * @see Task 67885303-12bf-4091-b9a1-b55662b4735e
 */

import { type FC } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Sword,
  Target,
  Shield,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { TrechoFormData, SelectOption } from './types';

// ============================================================================
// Component Props
// ============================================================================**

/**
 * Props for TrechosListSection component.
 */
export interface TrechosListSectionProps {
  /**
   * Array of configured trechos.
   */
  trechos: TrechoFormData[];

  /**
   * Available classes for displaying class names.
   */
  classes: SelectOption[];

  /**
   * Available troops for displaying troop names.
   */
  troops: SelectOption[];

  /**
   * Callback when add button is clicked.
   */
  onAdd: () => void;

  /**
   * Callback when edit button is clicked for a trecho.
   * @param index - Index of the trecho in the array
   */
  onEdit: (index: number) => void;

  /**
   * Callback when delete button is clicked for a trecho.
   * @param index - Index of the trecho in the array
   */
  onDelete: (index: number) => void;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the name of a troop by ID.
 */
function getTroopName(troopId: number, troops: SelectOption[]): string {
  const troop = troops.find((t) => t.value === troopId);
  return troop?.label ?? `Troop ${troopId}`;
}

// ============================================================================
// Component
// ============================================================================

/**
 * TrechosListSection Component
 *
 * Displays all configured trechos with:
 * - Add button for creating new trechos
 * - Trecho cards showing summary info
 * - Edit and delete buttons for each trecho
 *
 * @example
 * <TrechosListSection
 *   trechos={[{ id: 'ato1-floresta', name: 'Ato 1', ... }]}
 *   classes={[{ value: 1, label: 'Warrior' }]}
 *   troops={[{ value: 1, label: 'Goblin' }]}
 *   onAdd={() => console.log('Add')}
 *   onEdit={(i) => console.log('Edit', i)}
 *   onDelete={(i) => console.log('Delete', i)}
 * />
 */
export const TrechosListSection: FC<TrechosListSectionProps> = ({
  trechos,
  classes: _classes,
  troops,
  onAdd,
  onEdit,
  onDelete,
  className,
}) => {
  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Trechos</h3>
          <p className="text-sm text-muted-foreground">
            Story segments with TTK targets and party configuration
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className={cn(
            'flex items-center gap-2 px-3 py-2',
            'bg-primary text-primary-foreground rounded-md',
            'hover:bg-primary/90 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'font-medium text-sm'
          )}
        >
          <Plus className="h-4 w-4" />
          <span>Add Trecho</span>
        </button>
      </div>

      {/* Empty State */}
      {trechos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-md">
          <Target className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm font-medium">No trechos configured</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add your first trecho to start configuring TTK validation
          </p>
        </div>
      )}

      {/* Trechos List */}
      {trechos.length > 0 && (
        <div className="flex flex-col gap-3">
          {trechos.map((trecho, index) => (
            <div
              key={trecho.id}
              className="flex flex-col gap-3 p-4 bg-card rounded-md border border-border hover:border-border/80 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-medium truncate">
                    {trecho.name || trecho.id}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    {trecho.id}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(index)}
                    className={cn(
                      'p-2 rounded-md',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      'transition-colors'
                    )}
                    title="Edit trecho"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(index)}
                    className={cn(
                      'p-2 rounded-md',
                      'hover:bg-destructive/10 hover:text-destructive',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      'transition-colors'
                    )}
                    title="Delete trecho"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {/* Level Range */}
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Level Range</p>
                    <p className="font-medium truncate">
                      {trecho.anchorLevelMin}-{trecho.anchorLevelMax}
                    </p>
                  </div>
                </div>

                {/* TTK Target */}
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">TTK Target</p>
                    <p className="font-medium truncate">
                      {trecho.targetTtkTurns}t / {trecho.targetTtkActions}a
                    </p>
                  </div>
                </div>

                {/* Troops */}
                <div className="flex items-center gap-2">
                  <Sword className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Troops</p>
                    <p className="font-medium truncate">
                      {trecho.troopIds.length} troop
                      {trecho.troopIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Party */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Party</p>
                    <p className="font-medium truncate">
                      {trecho.party.members.length} member
                      {trecho.party.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Troop Names (collapsed) */}
              {trecho.troopIds.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-border">
                  {trecho.troopIds.slice(0, 3).map((troopId) => (
                    <span
                      key={troopId}
                      className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                    >
                      {getTroopName(troopId, troops)}
                    </span>
                  ))}
                  {trecho.troopIds.length > 3 && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                      +{trecho.troopIds.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrechosListSection;
