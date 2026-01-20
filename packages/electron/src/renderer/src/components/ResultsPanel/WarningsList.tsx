/**
 * WarningsList Component
 *
 * Displays warnings grouped by severity with contextual information.
 * Shows warning count badges and color-coded severity indicators.
 *
 * Features:
 * * Groups warnings by severity (critical, warning, info)
 * * Shows warning count badges by severity
 * * Displays warning messages with context
 * * Handles empty warnings array gracefully
 *
 * @see Task c963d4a0-5798-48b4-81ff-4ae21a22c57a
 */

import {
  type FC,
  type ReactNode,
} from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { WarningData } from '@/types/preload';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for WarningsList component.
 */
export interface WarningsListProps {
  /**
   * Array of warnings to display.
   */
  warnings: WarningData[];

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Severity Utilities
// ============================================================================

/**
 * Checks if a warning has critical severity.
 */
function isCriticalWarning(warning: WarningData): boolean {
  return warning.severity === 'critical';
}

/**
 * Checks if a warning has warning severity.
 */
function isWarningSeverity(warning: WarningData): boolean {
  return warning.severity === 'warning';
}

/**
 * Checks if a warning has info severity.
 */
function isInfoWarning(warning: WarningData): boolean {
  return warning.severity === 'info';
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Props for WarningBadge component.
 */
interface WarningBadgeProps {
  /**
   * The warning severity level.
   */
  severity: 'critical' | 'warning' | 'info';

  /**
   * The count of warnings with this severity.
   */
  count: number;
}

/**
 * Badge component showing warning count with severity color.
 */
const WarningBadge: FC<WarningBadgeProps> = ({ severity, count }) => {
  const severityConfig = {
    critical: {
      label: 'Critical',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      icon: <X className="h-3 w-3" />,
    },
    warning: {
      label: 'Warning',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    info: {
      label: 'Info',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      icon: <Info className="h-3 w-3" />,
    },
  } as const;

  const config = severityConfig[severity];

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
        config.className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
      <span className="opacity-75">({count})</span>
    </div>
  );
};

/**
 * Props for WarningItem component.
 */
interface WarningItemProps {
  /**
   * The warning data to display.
   */
  warning: WarningData;
}

/**
 * Individual warning item component.
 */
const WarningItem: FC<WarningItemProps> = ({ warning }) => {
  const severityConfig = {
    critical: {
      icon: <X className="h-4 w-4 text-red-600 dark:text-red-500" />,
      bgClassName: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />,
      bgClassName: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    },
    info: {
      icon: <Info className="h-4 w-4 text-blue-600 dark:text-blue-500" />,
      bgClassName: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    },
  } as const;

  const config = severityConfig[warning.severity];

  /**
   * Formats context object as readable key-value pairs.
   */
  const formatContext = (): string | null => {
    if (Object.keys(warning.context).length === 0) {
      return null;
    }

    const entries = Object.entries(warning.context).map(
      ([key, value]) => `${key}: ${JSON.stringify(value)}`
    );

    return entries.join(', ');
  };

  const contextString = formatContext();

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-md border',
        config.bgClassName
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        {/* Message */}
        <p className="text-sm font-medium text-foreground">
          {warning.message}
        </p>

        {/* Type Badge */}
        {warning.type && (
          <span className="text-xs text-muted-foreground uppercase font-semibold">
            {warning.type}
          </span>
        )}

        {/* Context */}
        {contextString && (
          <p className="text-xs text-muted-foreground truncate" title={contextString}>
            {contextString}
          </p>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Component
// ============================================================================

/**
 * WarningsList Component
 *
 * Renders warnings grouped by severity with count badges.
 * Shows individual warning items with icons, messages, and context.
 *
 * @example
 * <WarningsList warnings={[
 *   { type: 'ttk_out_of_tolerance', severity: 'warning', message: 'TTK exceeded target', context: {} }
 * ]} />
 */
export const WarningsList: FC<WarningsListProps> = ({
  warnings,
  className,
}) => {
  // Group warnings by severity
  const criticalWarnings = warnings.filter(isCriticalWarning);
  const warningWarnings = warnings.filter(isWarningSeverity);
  const infoWarnings = warnings.filter(isInfoWarning);

  // Early return if no warnings
  if (warnings.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground text-center py-4', className)}>
        No warnings
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Severity Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {criticalWarnings.length > 0 && (
          <WarningBadge severity="critical" count={criticalWarnings.length} />
        )}
        {warningWarnings.length > 0 && (
          <WarningBadge severity="warning" count={warningWarnings.length} />
        )}
        {infoWarnings.length > 0 && (
          <WarningBadge severity="info" count={infoWarnings.length} />
        )}
      </div>

      {/* Warning Items */}
      <div className="flex flex-col gap-2">
        {warnings.map((warning, index) => (
          <WarningItem key={`${warning.type}-${index}`} warning={warning} />
        ))}
      </div>
    </div>
  );
};

export default WarningsList;
