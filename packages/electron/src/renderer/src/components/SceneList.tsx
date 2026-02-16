/**
 * SceneList Component
 *
 * Displays a list of extracted NSD scenes in an expandable accordion format.
 * Provides empty state, loading state, and scene detail expansion.
 *
 * Features:
 * - Expandable/collapsible scene items with accordion behavior
 * - Empty state when no scenes are available
 * - Loading state with skeleton during extraction
 * - Content preview and full content on expansion
 * - Keyboard navigation and accessibility
 * - Consistent styling with app theme
 *
 * @see Task 14 - Create SceneList Component
 */

import { type FC, useState, useCallback, useMemo } from 'react';
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
  Inbox,
  Check,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { NSDSceneDTO } from '@coreto/electron/domain/types';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for SceneList component.
 */
export interface SceneListProps {
  /**
   * Array of NSD scenes to display.
   */
  scenes: NSDSceneDTO[];

  /**
   * Whether the component is in a loading state.
   */
  loading?: boolean;

  /**
   * Optional callback when a scene is clicked.
   */
  onSceneClick?: (scene: NSDSceneDTO) => void;

  /**
   * Optional ID of the currently selected scene.
   */
  selectedSceneId?: string;

  /**
   * Optional callback when a scene is selected.
   */
  onSceneSelect?: (scene: NSDSceneDTO) => void;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Props for SceneItem component.
 */
interface SceneItemProps {
  scene: NSDSceneDTO;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
  selectedSceneId?: string;
  onSceneSelect?: (scene: NSDSceneDTO) => void;
}

/**
 * SceneItem Component
 *
 * Renders a single scene item in the list.
 * Shows title, scene number, and expandable content.
 */
const SceneItem: FC<SceneItemProps> = ({
  scene,
  isExpanded,
  onToggle,
  onClick,
  selectedSceneId,
  onSceneSelect,
}) => {
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle();
      }
    },
    [onToggle]
  );

  // Generate content preview (first 150 characters)
  const contentPreview = useMemo(() => {
    const preview = scene.content.slice(0, 150);
    return scene.content.length > 150 ? preview + '...' : preview;
  }, [scene.content]);

  // Check if this scene is selected
  const isSelected = selectedSceneId === scene.id;

  return (
    <div
      className={cn(
        'border border-border rounded-md overflow-hidden',
        'transition-all duration-200',
        'hover:border-border/80',
        isExpanded && 'border-primary/50',
        isSelected && 'border-primary bg-primary/5'
      )}
    >
      {/* Scene Header */}
      <button
        type="button"
        onClick={() => {
          onToggle();
          onClick?.();
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full flex items-start gap-3 p-4',
          'bg-background hover:bg-accent/50',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
          'text-left'
        )}
        aria-expanded={isExpanded}
        aria-controls={`scene-content-${scene.id}`}
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Scene Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Scene Number Badge */}
            <span
              className={cn(
                'flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium',
                'bg-primary/10 text-primary',
                'dark:bg-primary/20'
              )}
            >
              Scene {scene.sceneNumber}
            </span>

            {/* Check icon when selected */}
            {isSelected && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
            )}

            {/* Scene Title */}
            <h3 className="text-sm font-semibold text-foreground truncate">
              {scene.title}
            </h3>
          </div>

          {/* Content Preview */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {contentPreview}
          </p>

          {/* Summary if available */}
          {scene.summary && (
            <p className="text-xs text-muted-foreground/70 mt-1 italic">
              {scene.summary}
            </p>
          )}
        </div>

        {/* File Icon */}
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          id={`scene-content-${scene.id}`}
          className={cn(
            'px-4 pb-4 pt-2',
            'bg-muted/30',
            'border-t border-border',
            'animate-in slide-in-from-top-2 duration-150'
          )}
          role="region"
          aria-label={`${scene.title} full content`}
        >
          {/* Full Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {scene.content}
            </p>
          </div>

          {/* Content Metadata */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
            {/* Character Count */}
            <span className="text-xs text-muted-foreground">
              {scene.content.length} characters
            </span>

            {/* Scene ID (for debugging) */}
            <span className="text-xs text-muted-foreground/50 font-mono">
              ID: {scene.id}
            </span>
          </div>

          {/* Select Scene Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => onSceneSelect?.(scene)}
              className={cn(
                'w-full px-4 py-2 rounded-md text-sm font-medium',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
                isSelected
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-background border border-border hover:bg-accent'
              )}
            >
              {isSelected ? 'Selected' : 'Select Scene'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Loading State Component
// ============================================================================

/**
 * SceneListSkeleton Component
 *
 * Renders skeleton loading state for scene list.
 */
const SceneListSkeleton: FC = () => {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-border rounded-md p-4 bg-background"
        >
          <div className="flex items-start gap-3">
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
              <div className="h-3 bg-muted animate-pulse rounded w-full" />
              <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Empty State Component
// ============================================================================

/**
 * SceneListEmpty Component
 *
 * Renders empty state when no scenes are available.
 */
const SceneListEmpty: FC = () => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        'py-12 px-6',
        'text-center',
        'border border-dashed border-border rounded-md',
        'bg-muted/20'
      )}
    >
      <Inbox className="h-8 w-8 text-muted-foreground/50" />
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">
          No scenes extracted yet
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          Upload an NSD document to extract and display scene list
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * SceneList Component
 *
 * Renders a list of NSD scenes with expandable details.
 * Supports empty state, loading state, and scene selection.
 *
 * @example
 * <SceneList
 *   scenes={scenes}
 *   loading={false}
 *   onSceneClick={(scene) => console.log('Selected:', scene.title)}
 * />
 */
export const SceneList: FC<SceneListProps> = ({
  scenes,
  loading = false,
  onSceneClick,
  selectedSceneId,
  onSceneSelect,
  className,
}) => {
  // Track which scene is currently expanded (only one at a time - accordion behavior)
  const [expandedSceneId, setExpandedSceneId] = useState<string | null>(null);

  /**
   * Handle scene expansion toggle.
   * Implements accordion behavior (only one scene expanded at a time).
   */
  const handleToggleScene = useCallback(
    (sceneId: string) => {
      setExpandedSceneId((current) =>
        current === sceneId ? null : sceneId
      );
    },
    []
  );

  /**
   * Handle scene click callback.
   */
  const handleSceneClick = useCallback(
    (scene: NSDSceneDTO) => {
      onSceneClick?.(scene);
    },
    [onSceneClick]
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Extracted Scenes
        </h2>
        {scenes.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {scenes.length} {scenes.length === 1 ? 'scene' : 'scenes'}
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[200px]">
        {loading ? (
          // Loading State
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-3',
              'py-12'
            )}
          >
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Extracting scenes from document...
            </p>
          </div>
        ) : scenes.length === 0 ? (
          // Empty State
          <SceneListEmpty />
        ) : (
          // Scene List
          <div className="flex flex-col gap-2">
            {scenes.map((scene) => (
              <SceneItem
                key={scene.id}
                scene={scene}
                isExpanded={expandedSceneId === scene.id}
                onToggle={() => handleToggleScene(scene.id)}
                onClick={() => handleSceneClick(scene)}
                selectedSceneId={selectedSceneId}
                onSceneSelect={onSceneSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SceneList;
