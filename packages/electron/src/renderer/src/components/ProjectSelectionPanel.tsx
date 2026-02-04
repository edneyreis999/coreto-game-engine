/**
 * ProjectSelectionPanel Component
 *
 * Panel for selecting RPG Maker MZ projects.
 * Provides file picker dialog, recent projects list, and visual validation indicators.
 *
 * @see Task 704b97be-e205-4252-bbec-7577ebd0d2f8
 */

import { type FC, useCallback, useEffect } from 'react';
import {
  FolderOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatDateRelative, truncate } from '@/lib/utils';
import { useRecentProjects } from '@/hooks/useRecentProjects';
import {
  useProject,
  getValidationMessage,
  isValidStatus,
  isValidatingStatus,
  isInvalidStatus,
} from '@/hooks/useProject';

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for ProjectSelectionPanel component.
 */
export interface ProjectSelectionPanelProps {
  /**
   * Callback when a valid project is selected.
   * @param projectPath - Absolute path to the selected project
   */
  onProjectSelected?: (projectPath: string) => void;

  /**
   * Additional CSS class names for styling.
   */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ProjectSelectionPanel Component
 *
 * Renders a panel for selecting RPG Maker MZ projects.
 * Includes:
 * - File picker button for selecting projects
 * - Recent projects list with quick access
 * - Visual validation indicator (valid/invalid/validating)
 * - Error messages for invalid projects
 *
 * @example
 * <ProjectSelectionPanel onProjectSelected={(path) => console.log('Selected:', path)} />
 */
export const ProjectSelectionPanel: FC<ProjectSelectionPanelProps> = ({
  onProjectSelected,
  className,
}) => {
  const {
    projectInfo,
    validation,
    isLoading,
    openProject,
    reset: _resetProject,
  } = useProject();

  const {
    recentProjects,
    isLoading: isLoadingRecent,
    refresh,
    addRecent,
  } = useRecentProjects(5, true);

  /**
   * Handles file picker button click.
   * Opens native macOS folder selection dialog.
   */
  const handleFilePickerClick = useCallback(async () => {
    try {
      console.log('[ProjectSelectionPanel] Opening file picker...');
      // Open file picker dialog via Electron
      const response = await window.electron.ipcRenderer.invoke('dialog:openDirectory');
      console.log('[ProjectSelectionPanel] Dialog response:', response);

      // Handler returns {success: true, data: {canceled, filePaths}}
      if (!response.success || !response.data) {
        console.log('[ProjectSelectionPanel] Dialog failed or no data');
        return;
      }

      const { canceled, filePaths } = response.data;
      if (canceled || !filePaths?.[0]) {
        // User cancelled the dialog
        console.log('[ProjectSelectionPanel] User canceled dialog');
        return;
      }

      const projectPath = filePaths[0];
      console.log('[ProjectSelectionPanel] Selected project path:', projectPath);
      console.log('[ProjectSelectionPanel] Calling openProject...');
      await openProject(projectPath);
      console.log('[ProjectSelectionPanel] openProject completed');
    } catch (error) {
      console.error('[ProjectSelectionPanel] Failed to open file picker:', error);
    }
  }, [openProject]);

  /**
   * Handles clicking on a recent project item.
   */
  const handleRecentProjectClick = useCallback(
    async (project: { path: string; name: string }) => {
      try {
        await openProject(project.path);
        // Update the last opened timestamp
        await addRecent(project.path, project.name);
      } catch (error) {
        console.error('Failed to open recent project:', error);
      }
    },
    [openProject, addRecent]
  );

  /**
   * Notifies parent component when a valid project is selected.
   */
  useEffect(() => {
    if (isValidStatus(validation.status) && projectInfo && onProjectSelected) {
      onProjectSelected(projectInfo.path);
    }
  }, [validation.status, projectInfo, onProjectSelected]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      className={cn(
        'flex flex-col gap-6 p-6 bg-background rounded-lg border border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Select RPG Maker MZ Project
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose a project to validate TTK balance
        </p>
      </div>

      {/* File Picker Button */}
      <button
        type="button"
        onClick={handleFilePickerClick}
        disabled={isLoading}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-3',
          'bg-primary text-primary-foreground rounded-md',
          'hover:bg-primary/90 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'font-medium text-sm'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Opening Project...</span>
          </>
        ) : (
          <>
            <FolderOpen className="h-4 w-4" />
            <span>Browse for Project Folder</span>
          </>
        )}
      </button>

      {/* Validation Indicator */}
      {(validation.status !== 'idle' || projectInfo) && (
        <div
          className={cn(
            'flex items-start gap-3 p-4 rounded-md border',
            isValidStatus(validation.status) &&
              'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
            isInvalidStatus(validation.status) &&
              'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
            isValidatingStatus(validation.status) &&
              'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
          )}
        >
          {isValidatingStatus(validation.status) && (
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
          )}
          {isValidStatus(validation.status) && (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
          )}
          {isInvalidStatus(validation.status) && (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <p
              className={cn(
                'text-sm font-medium',
                isValidStatus(validation.status) &&
                  'text-green-800 dark:text-green-200',
                isInvalidStatus(validation.status) &&
                  'text-red-800 dark:text-red-200',
                isValidatingStatus(validation.status) &&
                  'text-yellow-800 dark:text-yellow-200'
              )}
            >
              {getValidationMessage(validation, projectInfo?.name)}
            </p>
            {projectInfo && isValidStatus(validation.status) && (
              <p className="text-xs text-muted-foreground truncate">
                {projectInfo.path}
              </p>
            )}
            {isInvalidStatus(validation.status) && validation.errors.length > 0 && (
              <ul className="text-xs text-red-700 dark:text-red-300 list-disc list-inside mt-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Recent Projects Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent Projects</h3>
          {!isLoadingRecent && recentProjects.length > 0 && (
            <button
              type="button"
              onClick={refresh}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Refresh
            </button>
          )}
        </div>

        {isLoadingRecent ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent projects</p>
            <p className="text-xs text-muted-foreground mt-1">
              Projects you open will appear here
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentProjects.map((project) => (
              <li
                key={project.path}
                className="group flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                onClick={() => handleRecentProjectClick(project)}
              >
                <FolderOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium truncate">{project.name}</span>
                  <span
                    className="text-xs text-muted-foreground truncate"
                    title={project.path}
                  >
                    {truncate(project.path, 50)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDateRelative(project.lastOpened)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProjectSelectionPanel;
