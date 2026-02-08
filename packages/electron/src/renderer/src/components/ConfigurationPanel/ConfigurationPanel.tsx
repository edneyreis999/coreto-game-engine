/**
 * ConfigurationPanel Component
 *
 * Main panel for configuring trechos and party settings for TTK validation.
 * Provides visual forms for all configuration without requiring JSON editing.
 *
 * Features:
 * - Trechos list with add/edit/delete operations
 * - Individual trecho form with real-time validation
 * - Party configuration sub-form with dynamic member slots
 * - Global settings (seed, maxBattleTurns)
 * - Integration with RPG Maker MZ project data for dropdowns
 *
 * @see Task 67885303-12bf-4091-b9a1-b55662b4735e
 */

import { type FC, useCallback, useEffect, useState } from 'react';
import {
  Settings,
  Save,
  FolderOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useIpcWithArg, useConfigurationManager } from '@/hooks';
import { buildProjectConfig, transformToDropdownOptions } from '@/lib';
import type {
  TroopData,
  ClassData,
} from '@/types/preload';
import type {
  ConfigurationPanelProps,
  TrechoFormData,
  GlobalSettingsFormData,
  ProjectDropdownData,
} from './types';
import { getDefaultGlobalSettingsFormData } from './validation';

// Sub-components
import { TrechosListSection } from './TrechosListSection';
import { TrechoForm } from './TrechoForm/index';
import { GlobalSettingsSection } from './GlobalSettingsSection';

// ============================================================================
// Component
// ============================================================================

/**
 * ConfigurationPanel Component
 *
 * Main configuration panel that provides:
 * - Project info header
 * - Trechos list management
 * - Trecho form (create/edit mode)
 * - Global settings
 *
 * @example
 * <ConfigurationPanel
 *   projectPath="/path/to/project"
 *   onConfigSaved={(config) => console.log('Saved:', config)}
 * />
 */
export const ConfigurationPanel: FC<ConfigurationPanelProps> = ({
  projectPath,
  onConfigSaved,
  className,
}) => {
  // ========================================================================
  // State
  // ========================================================================

  /**
   * Currently loaded project data for dropdowns.
   */
  const [projectData, setProjectData] = useState<ProjectDropdownData>({
    classes: [],
    troops: [],
  });

  /**
   * Configuration manager for trecho CRUD operations.
   */
  const {
    trechos,
    editingIndex,
    saveTrecho,
    deleteTrecho,
    startEdit,
    cancelEdit,
    getEditingTrecho,
  } = useConfigurationManager();

  /**
   * Global settings (seed, maxBattleTurns).
   */
  const [globalSettings, setGlobalSettings] = useState<GlobalSettingsFormData>(
    getDefaultGlobalSettingsFormData()
  );

  /**
   * Whether a trecho form is currently open (create or edit mode).
   */
  const [isFormOpen, setIsFormOpen] = useState(false);

  // ========================================================================
  // IPC Hooks
  // ========================================================================

  /**
   * Fetch classes from the project.
   * ipcFn wrapped in useCallback for stability.
   */
  const getClassesIpcFn = useCallback((projectPath: string) =>
    window.coreto.data.getClasses(projectPath),
    []
  );

  const {
    data: classesData,
    error: classesError,
    isLoading: isLoadingClasses,
    invoke: fetchClasses,
  } = useIpcWithArg<ClassData[], string>(getClassesIpcFn);

  /**
   * Fetch troops from the project.
   * ipcFn wrapped in useCallback for stability.
   */
  const getTroopsIpcFn = useCallback((projectPath: string) =>
    window.coreto.data.getTroops(projectPath),
    []
  );

  const {
    data: troopsData,
    error: troopsError,
    isLoading: isLoadingTroops,
    invoke: fetchTroops,
  } = useIpcWithArg<TroopData[], string>(getTroopsIpcFn);

  // ========================================================================
  // Effects
  // ========================================================================

  /**
   * Load project data on mount.
   * fetchClasses and fetchTroops are now stable (wrapped in useCallback).
   */
  useEffect(() => {
    void fetchClasses(projectPath);
    void fetchTroops(projectPath);
  }, [projectPath, fetchClasses, fetchTroops]);

  /**
   * Update project data when classes/troops are loaded.
   */
  useEffect(() => {
    if (classesData && troopsData) {
      setProjectData({
        classes: transformToDropdownOptions(classesData),
        troops: transformToDropdownOptions(troopsData),
      });
    }
  }, [classesData, troopsData]);

  // ========================================================================
  // Handlers
  // ========================================================================

  /**
   * Opens the trecho form in create mode.
   */
  const handleAddTrecho = useCallback(() => {
    setIsFormOpen(true);
  }, []);

  /**
   * Opens the trecho form in edit mode.
   */
  const handleEditTrecho = useCallback((index: number) => {
    startEdit(index);
    setIsFormOpen(true);
  }, [startEdit]);

  /**
   * Deletes a trecho from the configuration.
   */
  const handleDeleteTrecho = useCallback((index: number) => {
    deleteTrecho(index);
  }, [deleteTrecho]);

  /**
   * Saves a trecho (create or update).
   */
  const handleSaveTrecho = useCallback((data: TrechoFormData) => {
    saveTrecho(data);
    setIsFormOpen(false);
  }, [saveTrecho]);

  /**
   * Cancels trecho form editing.
   */
  const handleCancelForm = useCallback(() => {
    cancelEdit();
    setIsFormOpen(false);
  }, [cancelEdit]);

  /**
   * Saves the complete configuration.
   */
  const handleSaveConfig = useCallback(() => {
    const config = buildProjectConfig(projectPath, trechos, globalSettings);
    onConfigSaved?.(config);
  }, [projectPath, trechos, globalSettings, onConfigSaved]);

  /**
   * Updates global settings.
   */
  const handleUpdateGlobalSettings = useCallback(
    (settings: Partial<GlobalSettingsFormData>) => {
      setGlobalSettings((prev) => ({ ...prev, ...settings }));
    },
    []
  );

  // ========================================================================
  // Render Helpers
  // ========================================================================

  /**
   * Whether the form is currently loading data.
   */
  const isLoading = isLoadingClasses || isLoadingTroops;

  /**
   * Whether there are any data loading errors.
   */
  const hasError = classesError || troopsError;

  /**
   * Project name from path.
   */
  const projectName = projectPath.split('/').filter(Boolean).pop() ?? projectPath;

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div
      className={cn(
        'flex flex-col gap-6 p-6 bg-background rounded-lg border border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold tracking-tight">
            Configuration
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          <span className="truncate">{projectName}</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading project data...
          </p>
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className="flex items-start gap-3 p-4 rounded-md border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Failed to load project data
            </p>
            {classesError && (
              <p className="text-xs text-red-700 dark:text-red-300">
                Classes: {classesError.message}
              </p>
            )}
            {troopsError && (
              <p className="text-xs text-red-700 dark:text-red-300">
                Troops: {troopsError.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !hasError && (
        <>
          {/* Trechos List or Form */}
          {isFormOpen ? (
            <TrechoForm
              mode={editingIndex !== null ? 'edit' : 'create'}
              initialData={getEditingTrecho() ?? undefined}
              classes={projectData.classes}
              troops={projectData.troops}
              onSubmit={handleSaveTrecho}
              onCancel={handleCancelForm}
            />
          ) : (
            <TrechosListSection
              trechos={trechos}
              classes={projectData.classes}
              troops={projectData.troops}
              onAdd={handleAddTrecho}
              onEdit={handleEditTrecho}
              onDelete={handleDeleteTrecho}
            />
          )}

          {/* Global Settings */}
          <GlobalSettingsSection
            globalSettings={globalSettings}
            onUpdate={handleUpdateGlobalSettings}
          />

          {/* Save Button */}
          <div className="flex items-center justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={trechos.length === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2',
                'bg-primary text-primary-foreground rounded-md',
                'hover:bg-primary/90 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'font-medium text-sm'
              )}
            >
              <Save className="h-4 w-4" />
              <span>Save Configuration</span>
            </button>
          </div>

          {/* Validation Status */}
          {trechos.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
              <span>
                {trechos.length} trecho{trechos.length !== 1 ? 's' : ''} configured
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConfigurationPanel;
