/**
 * BattleDetails Component
 *
 * Displays expandable per-battle breakdowns for a trecho.
 * Shows troop name, outcome, TTK metrics, and EXP gained for each battle.
 *
 * Features:
 * * Lists all battles from trecho summary
 * * Shows troop name, outcome, and TTK metrics for each battle
 * * Displays "Victory" / "Defeat" / "Timeout" labels correctly
 * * Shows EXP gained when outcome is victory
 * * Expandable/collapsible for space efficiency
 *
 * @see Task c963d4a0-5798-48b4-81ff-4ae21a22c57a
 */

import {
  type FC,
} from 'react';
import {
  ChevronDown,
  ChevronUp,
  Trophy,
  XCircle,
  Clock,
  Sword,
  Zap,
  Star,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ReportBattleResult } from '@/types/preload';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for BattleDetails component.
 */
export interface BattleDetailsProps {
  /**
   * Array of battle results to display.
   */
  battles: ReportBattleResult[];

  /**
   * Whether the details are expanded.
   */
  isExpanded: boolean;

  /**
   * Callback when toggle is clicked.
   */
  onToggle: () => void;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Outcome Utilities
// ============================================================================

/**
 * Checks if outcome is victory.
 */
function isVictory(outcome: string): boolean {
  return outcome === 'victory';
}

/**
 * Checks if outcome is defeat.
 */
function isDefeat(outcome: string): boolean {
  return outcome === 'defeat';
}

/**
 * Checks if outcome is timeout.
 */
function isTimeout(outcome: string): boolean {
  return outcome === 'timeout';
}

/**
 * Gets the display label for an outcome.
 */
function getOutcomeLabel(outcome: string): string {
  switch (outcome) {
    case 'victory':
      return 'Victory';
    case 'defeat':
      return 'Defeat';
    case 'timeout':
      return 'Timeout';
    default:
      return 'Unknown';
  }
}

/**
 * Gets the color class for an outcome badge.
 */
function getOutcomeColor(outcome: string): string {
  if (isVictory(outcome)) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
  if (isDefeat(outcome)) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
  if (isTimeout(outcome)) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
}

/**
 * Gets the icon for an outcome.
 */
function getOutcomeIcon(outcome: string): React.ReactNode {
  if (isVictory(outcome)) {
    return <Trophy className="h-3.5 w-3.5" />;
  }
  if (isDefeat(outcome)) {
    return <XCircle className="h-3.5 w-3.5" />;
  }
  if (isTimeout(outcome)) {
    return <Clock className="h-3.5 w-3.5" />;
  }
  return null;
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Props for OutcomeBadge component.
 */
interface OutcomeBadgeProps {
  /**
   * The battle outcome.
   */
  outcome: string;
}

/**
 * Badge component showing battle outcome with icon and color.
 */
const OutcomeBadge: FC<OutcomeBadgeProps> = ({ outcome }) => {
  const icon = getOutcomeIcon(outcome);
  const label = getOutcomeLabel(outcome);
  const colorClass = getOutcomeColor(outcome);

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        colorClass
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
};

/**
 * Props for MetricRow component.
 */
interface MetricRowProps {
  /**
   * The icon to display.
   */
  icon: React.ReactNode;

  /**
   * The label for the metric.
   */
  label: string;

  /**
   * The value to display.
   */
  value: string | number;
}

/**
 * Row component displaying a metric with icon, label, and value.
 */
const MetricRow: FC<MetricRowProps> = ({ icon, label, value }) => {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="text-muted-foreground">
        {icon}
      </div>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
};

/**
 * Props for BattleRow component.
 */
interface BattleRowProps {
  /**
   * The battle result to display.
   */
  battle: ReportBattleResult;
}

/**
 * Row component displaying a single battle's details.
 */
const BattleRow: FC<BattleRowProps> = ({ battle }) => {
  return (
    <div className="flex flex-col gap-3 p-3 rounded-md bg-muted/50">
      {/* Header: Troop Name + Outcome Badge */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{battle.troopName}</span>
        <OutcomeBadge outcome={battle.outcome} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {/* TTK Turns */}
        <MetricRow
          icon={<Sword className="h-4 w-4" />}
          label="Turns"
          value={battle.ttkTurns}
        />

        {/* TTK Actions */}
        <MetricRow
          icon={<Zap className="h-4 w-4" />}
          label="Actions"
          value={battle.ttkActions}
        />

        {/* Duration */}
        <MetricRow
          icon={<Clock className="h-4 w-4" />}
          label="Duration"
          value={`${(battle.durationMs / 1000).toFixed(2)}s`}
        />

        {/* Seed */}
        <MetricRow
          icon={<Star className="h-4 w-4" />}
          label="Seed"
          value={battle.seed}
        />
      </div>

      {/* EXP Gained (only show for victories) */}
      {isVictory(battle.outcome) && battle.expGained > 0 && (
        <div className="pt-2 border-t border-border">
          <MetricRow
            icon={<Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />}
            label="EXP Gained"
            value={battle.expGained}
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

/**
 * BattleDetails Component
 *
 * Renders expandable list of battle results with metrics.
 * Shows troop name, outcome, TTK metrics, and EXP for each battle.
 *
 * @example
 * <BattleDetails
 *   battles={battles}
 *   isExpanded={true}
 *   onToggle={() => setIsExpanded(!isExpanded)}
 * />
 */
export const BattleDetails: FC<BattleDetailsProps> = ({
  battles,
  isExpanded,
  onToggle,
  className,
}) => {
  // Early return if no battles
  if (battles.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground text-center py-4', className)}>
        No battles recorded
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header with Toggle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isExpanded ? "Collapse battle details" : "Expand battle details"}
        className={cn(
          'flex items-center justify-between gap-2',
          'w-full text-left',
          'text-sm font-medium',
          'hover:text-primary transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded'
        )}
      >
        <span>Battle Details ({battles.length})</span>
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="flex flex-col gap-2 animate-in slide-down-from-top-2 duration-200">
          {battles.map((battle, index) => (
            <BattleRow key={`${battle.troopId}-${index}`} battle={battle} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BattleDetails;
