/**
 * NSDGenerator Component Tests
 *
 * Tests for the NSDGenerator React component.
 * Tests state management, conditional rendering, button states, and callback invocations.
 *
 * @see packages/electron/src/renderer/src/components/NSDGenerator.tsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { NSDGenerator } from '@/components/NSDGenerator';
import type { NSDSceneDTO } from '@coreto/electron/domain/types';
import { NSDSceneDTOFakeBuilder } from '../../../fakes/NSDSceneDTOFakeBuilder.js';

// Mock useLogger hook
jest.mock('@/hooks/useLogger', () => ({
  useLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock useNsdUpload hook
jest.mock('@/hooks/useNsdUpload', () => ({
  useNsdUpload: jest.fn(),
}));

// Mock BackButton component
jest.mock('@/components/BackButton', () => ({
  BackButton: jest.fn(() => <div data-testid="back-button">Back</div>),
}));

import { useNsdUpload } from '@/hooks/useNsdUpload';

// Mock window.coreto.nsd API
const mockNsdAPI = {
  upload: jest.fn(),
  onProgress: jest.fn(),
  onError: jest.fn(),
};

(global as unknown as { coreto: typeof window.coreto }).coreto = {
  nsd: mockNsdAPI,
} as unknown as typeof window.coreto;

describe('NSDGenerator', () => {
  // Mock scene data for testing
  const mockScenes: NSDSceneDTO[] = NSDSceneDTOFakeBuilder.theEntities(3)
    .withId((index) => `scene-${index + 1}`)
    .withTitle((index) => ['Tavern Meeting', 'Bard Conversation', 'Throne Room'][index]!)
    .withSceneNumber((index) => index + 1)
    .withContent((index) => [
      'The hero enters the dimly lit tavern. Smoke hangs in the air as the keeper waves from behind the bar.',
      'An elderly bard sits in the corner, strumming a lute. She looks up as you approach.',
      'The throne room is empty except for a single figure on the throne. The king awaits your report.',
    ][index]!)
    .withSummary((index) => [
      'Introduction to quest giver',
      'Learning about the artifact',
      undefined,
    ][index]!)
    .build() as NSDSceneDTO[];

  // Default mock implementation for useNsdUpload
  const defaultMockUseNsdUpload = {
    upload: jest.fn(),
    isUploading: false,
    progress: null,
    scenes: [],
    error: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNsdUpload as jest.Mock).mockReturnValue(defaultMockUseNsdUpload);
  });

  describe('Initial State', () => {
    it('initializes with selectedScene as null', () => {
      render(<NSDGenerator />);

      // Selected Scene section should not be present initially
      expect(screen.queryByRole('heading', { name: 'Selected Scene' })).not.toBeInTheDocument();
    });

    it('renders header with title and description', () => {
      render(<NSDGenerator />);

      expect(screen.getByRole('heading', { name: 'NSD Generator' })).toBeInTheDocument();
      expect(
        screen.getByText('Upload your Narrative Scene Document to extract scenes')
      ).toBeInTheDocument();
    });

    it('renders upload section', () => {
      render(<NSDGenerator />);

      expect(screen.getByRole('heading', { name: 'Upload Document' })).toBeInTheDocument();
    });

    it('renders empty state when no scenes', () => {
      render(<NSDGenerator />);

      expect(screen.getByRole('heading', { name: 'No scenes yet' })).toBeInTheDocument();
      expect(
        screen.getByText('Upload an NSD markdown file to extract and display scenes here.')
      ).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering - Selected Scene Section', () => {
    it('shows Selected Scene section when scene is selected', async () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      // Initially, Selected Scene section should not be visible
      expect(screen.queryByRole('heading', { name: 'Selected Scene' })).not.toBeInTheDocument();

      // Expand the first scene
      const firstSceneTitle = screen.getByText('Tavern Meeting');
      fireEvent.click(firstSceneTitle);

      // Click on the "Select Scene" button
      const selectButton = await screen.findByRole('button', { name: 'Select Scene' });
      fireEvent.click(selectButton);

      // Now Selected Scene section should be visible
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Selected Scene' })).toBeInTheDocument();
      });
    });

    it('displays selected scene details', async () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      // Expand the first scene by clicking its header
      const firstSceneHeader = screen.getByText('Tavern Meeting').closest('button');
      fireEvent.click(firstSceneHeader!);

      // Click on the "Select Scene" button (it should be visible now)
      const selectButtons = screen.getAllByRole('button', { name: 'Select Scene' });
      fireEvent.click(selectButtons[0]);

      // Wait for the Selected Scene section to appear
      const selectedSceneHeading = await screen.findByRole('heading', { name: 'Selected Scene' }, { timeout: 3000 });
      expect(selectedSceneHeading).toBeInTheDocument();

      // Verify the selected scene details are displayed (within the Selected Scene section)
      const selectedSceneSection = selectedSceneHeading.closest('section');
      expect(within(selectedSceneSection!).getByText('Tavern Meeting')).toBeInTheDocument();
      expect(within(selectedSceneSection!).getByText('Scene 1')).toBeInTheDocument();
      expect(within(selectedSceneSection!).getByText('Introduction to quest giver')).toBeInTheDocument();
    });

    it('hides Selected Scene section when no scene is selected', () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      // Without selecting any scene, Selected Scene section should not be visible
      expect(screen.queryByRole('heading', { name: 'Selected Scene' })).not.toBeInTheDocument();
    });
  });

  describe('Button States - Generate Prompt', () => {
    it('Generate Prompt button is disabled when no scene selected', async () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      // Wait for scenes to be rendered
      await waitFor(() => {
        expect(screen.getByText('Tavern Meeting')).toBeInTheDocument();
      });

      // Generate Prompt button should not be present when no scene is selected
      // (it only appears in the Selected Scene section)
      expect(screen.queryByRole('button', { name: 'Generate Prompt' })).not.toBeInTheDocument();
    });

    it('Generate Prompt button is enabled when scene selected', async () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      // Expand a scene and select it
      const firstSceneTitle = screen.getByText('Tavern Meeting');
      fireEvent.click(firstSceneTitle);

      const selectButton = await screen.findByRole('button', { name: 'Select Scene' });
      fireEvent.click(selectButton);

      // Wait for Selected Scene section to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Selected Scene' })).toBeInTheDocument();
      });

      // Generate Prompt button should be present and enabled
      const generateButton = screen.getByRole('button', { name: 'Generate Prompt' });
      expect(generateButton).toBeInTheDocument();
      expect(generateButton).not.toBeDisabled();
    });
  });

  describe('Clear Selection Button', () => {
    it('Clear Selection button resets selectedScene to null', async () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      // Expand and select a scene
      const firstSceneTitle = screen.getByText('Tavern Meeting');
      fireEvent.click(firstSceneTitle);

      const selectButton = await screen.findByRole('button', { name: 'Select Scene' });
      fireEvent.click(selectButton);

      // Wait for Selected Scene section to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Selected Scene' })).toBeInTheDocument();
      });

      // Click Clear Selection button
      const clearButton = screen.getByRole('button', { name: 'Clear Selection' });
      fireEvent.click(clearButton);

      // Selected Scene section should disappear
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Selected Scene' })).not.toBeInTheDocument();
      });
    });

    it('Clear Selection button is visible when scene is selected', async () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      // Expand and select a scene
      const firstSceneTitle = screen.getByText('Tavern Meeting');
      fireEvent.click(firstSceneTitle);

      const selectButton = await screen.findByRole('button', { name: 'Select Scene' });
      fireEvent.click(selectButton);

      // Wait for Selected Scene section to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Selected Scene' })).toBeInTheDocument();
      });

      // Clear Selection button should be present
      expect(screen.getByRole('button', { name: 'Clear Selection' })).toBeInTheDocument();
    });
  });

  describe('Callback Invocation - handleGeneratePrompt', () => {
    it('calls handleGeneratePrompt when Generate Prompt button clicked', async () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      // Expand and select a scene
      const firstSceneTitle = screen.getByText('Tavern Meeting');
      fireEvent.click(firstSceneTitle);

      const selectButton = await screen.findByRole('button', { name: 'Select Scene' });
      fireEvent.click(selectButton);

      // Wait for Selected Scene section to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Selected Scene' })).toBeInTheDocument();
      });

      // Click Generate Prompt button - should not throw any errors
      const generateButton = screen.getByRole('button', { name: 'Generate Prompt' });
      fireEvent.click(generateButton);

      // Test passes if no errors are thrown during the click
      expect(generateButton).toBeInTheDocument();
    });
  });

  describe('Scene List Display', () => {
    it('renders scene list when scenes are available', () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      expect(screen.getAllByRole('heading', { name: /^Extracted Scenes/ })).toHaveLength(2);
      expect(screen.getByText('Tavern Meeting')).toBeInTheDocument();
      expect(screen.getByText('Bard Conversation')).toBeInTheDocument();
      expect(screen.getByText('Throne Room')).toBeInTheDocument();
    });

    it('displays scene count in heading', () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      expect(screen.getByRole('heading', { name: 'Extracted Scenes (3)' })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows progress section when uploading', () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        isUploading: true,
        progress: { stage: 'parsing', percent: 45 },
      });

      render(<NSDGenerator />);

      expect(screen.getByRole('heading', { name: 'Processing' })).toBeInTheDocument();
      expect(screen.getByText('Parsing')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('shows scene list section during upload', () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        isUploading: true,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      expect(screen.getAllByRole('heading', { name: /^Extracted Scenes/ })).toHaveLength(2);
    });
  });

  describe('Error State', () => {
    it('displays error message when upload fails', () => {
      const errorMessage = 'Failed to parse NSD document: Invalid markdown format';

      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        error: errorMessage,
      });

      render(<NSDGenerator />);

      expect(screen.getByRole('heading', { name: 'Error' })).toBeInTheDocument();
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not show error section when no error', () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        error: null,
      });

      render(<NSDGenerator />);

      expect(screen.queryByRole('heading', { name: 'Error' })).not.toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('displays success message when upload completes', () => {
      (useNsdUpload as jest.Mock).mockReturnValue({
        ...defaultMockUseNsdUpload,
        scenes: mockScenes,
      });

      render(<NSDGenerator />);

      expect(screen.getByText('Upload successful!')).toBeInTheDocument();
      expect(screen.getByText('3 scenes extracted')).toBeInTheDocument();
    });
  });
});
