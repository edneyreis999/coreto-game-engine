/**
 * Configuration Feature
 *
 * Feature for TTK configuration management.
 * Provides UI for configuring trechos, party, and global settings.
 *
 * Components:
 * - ConfigurationPanel - Main configuration panel
 * - TrechosListSection - List of trechos with add/edit/delete
 * - TrechoForm - Form for editing individual trechos
 * - GlobalSettingsSection - Global settings form
 *
 * @see Task 06 - Feature Folder Structure
 */

// Re-export from existing components
export { ConfigurationPanel } from '../../components/ConfigurationPanel';
export type { ConfigurationPanelProps } from '../../components/ConfigurationPanel';

export { TrechosListSection } from '../../components/ConfigurationPanel/TrechosListSection';
export type { TrechosListSectionProps } from '../../components/ConfigurationPanel/TrechosListSection';

export { TrechoForm } from '../../components/ConfigurationPanel/TrechoForm';
export type { TrechoFormProps } from '../../components/ConfigurationPanel/types';

export { GlobalSettingsSection } from '../../components/ConfigurationPanel/GlobalSettingsSection';
export type { GlobalSettingsSectionProps } from '../../components/ConfigurationPanel/GlobalSettingsSection';
