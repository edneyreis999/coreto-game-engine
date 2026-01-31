/**
 * TrechoCard Component
 *
 * Displays a trecho result card with color-coded pass/fail indicators.
 * Shows key metrics prominently and provides expandable details.
 *
 * Features:
 * * Color-coded status indicators (green=pass, red=fail, yellow=warning)
 * * Shows key metrics: TTK turns (avg/p95), TTK actions (avg/p95), success rate, battle count
 * * Support for expandable cards with detailed per-battle breakdowns
 * * Displays warnings grouped by severity
 *
 * Color Coding Logic:
 * * Green (success): passed === true AND no critical warnings
 * * Red (fail): passed === false OR has critical warnings
 * * Yellow (warning): passed === true AND has warnings
 *
 * @see Task c963d4a0-5798-48b4-81ff-4ae21a22c57a
 */

import {
  type FC,
  useState,
} from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { TrechoSummaryData } from '@/types/preload';
import { BattleDetails } from './BattleDetails';
import { WarningsList } from './WarningsList';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for TrechoCard component.
 */
export interface TrechoCardProps {
  /**
   * The trecho summary data to display.
   */
  trecho: TrechoSummaryData;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Status Utilities
// ============================================================================

/**
 * Status type for a trecho result.
 */
type TrechoStatus = 'success' | 'error' | 'warning';

/**
 * Determines the status of a trecho based on passed state and warnings.
 *
 * Green (success): passed === true AND no critical warnings
 * Red (error): passed === false OR has critical warnings
 * Yellow (warning): passed === true AND has warnings (non-critical)
 */
function getTrechoStatus(trecho: TrechoSummaryData): TrechoStatus {
  const hasCriticalWarnings = trecho.warnings.some((w) => w.severity === 'critical');
  const hasWarnings = trecho.warnings.length > 0;

  if (hasCriticalWarnings || !trecho.passed) {
    return 'error';
  }

  if (hasWarnings) {
    return 'warning';
  }

  return 'success';
}

/**
 * Gets the color configuration for a status.
 */
function getStatusConfig(status: TrechoStatus): {
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  label: string;
} {
  switch (status) {
    case 'success':
      return {
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />,
        label: 'Passed',
      };
    case 'error':
      return {
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />,
        label: 'Failed',
      };
    case 'warning':
      return {
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />,
        label: 'Warning',
      };
  }
}

/**
 * Formats a percentage for display.
 */
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Props for MetricItem component.
 */
interface MetricItemProps {
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
 * Individual metric item component.
 */
const MetricItem: FC<MetricItemProps> = ({ label, value }) => {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

/**
 * TrechoCard Component
 *
 * Renders a card displaying trecho validation results with color-coded status.
 * Shows metrics, warnings, and expandable battle details.
 *
 * @example
 * <TrechoCard
 *   trecho={{
 *     id: 'trecho1',
 *     name: 'Forest Battles',
 *     passed: true,
 *     battleCount: 5,
 *     avgTtkTurns: 12,
 *     avgTtkActions: 24,
 *     p95TtkTurns: 15,
 *     p95TtkActions: 30,
 *     successRate: 100,
 *     battles: [...],
 *     warnings: []
 *   }}
 * />
 */
export const TrechoCard: FC<TrechoCardProps> = ({
  trecho,
  className,
}) => {
  // State for expandable sections
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);

  // Determine status and get config
  const status = getTrechoStatus(trecho);
  const statusConfig = getStatusConfig(status);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 rounded-lg border',
        statusConfig.bgColor,
        statusConfig.borderColor,
        className
      )}
    >
      {/* Header: Name + Status Badge */}
      <div className="flex items-start justify-between gap-4">
        {/* Name */}
        <h3 className="text-lg font-semibold text-foreground">
          {trecho.name}
        </h3>

        {/* Status Badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            'bg-white/50 dark:bg-black/20',
            'border border-current/20'
          )}
        >
          {statusConfig.icon}
          <span className="text-sm font-medium">{statusConfig.label}</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Avg TTK Turns */}
        <MetricItem
          label="Avg TTK Turns"
          value={trecho.avgTtkTurns.toFixed(1)}
        />

        {/* P95 TTK Turns */}
        <MetricItem
          label="P95 TTK Turns"
          value={trecho.p95TtkTurns.toFixed(1)}
        />

        {/* Avg TTK Actions */}
        <MetricItem
          label="Avg TTK Actions"
          value={trecho.avgTtkActions.toFixed(1)}
        />

        {/* Success Rate */}
        <MetricItem
          label="Success Rate"
          value={formatPercentage(trecho.successRate)}
        />
      </div>

      {/* Secondary Info Row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Battle Count: {trecho.battleCount}</span>
        <span>•</span>
        <span>P95 Actions: {trecho.p95TtkActions.toFixed(1)}</span>
      </div>

      {/* Warnings Section (if any) */}
      {trecho.warnings.length > 0 && (
        <div className="pt-2 border-t border-current/20">
          <WarningsList warnings={trecho.warnings} />
        </div>
      )}

      {/* Battle Details (Collapsible) */}
      <div className="pt-2 border-t border-current/20">
        <BattleDetails
          battles={trecho.battles}
          isExpanded={isDetailsExpanded}
          onToggle={() => setIsDetailsExpanded(!isDetailsExpanded)}
        />
      </div>
    </div>
  );
};

export default TrechoCard;
