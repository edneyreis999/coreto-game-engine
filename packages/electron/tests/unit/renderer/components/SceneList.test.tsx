/**
 * SceneList Component Tests
 *
 * Tests for the SceneList React component.
 * Tests rendering, interaction, and accessibility features.
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SceneList } from '@/components/SceneList';
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

describe('SceneList', () => {
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

  describe('Empty State', () => {
    it('should render empty state when no scenes are provided', () => {
      render(<SceneList scenes={[]} loading={false} />);

      expect(screen.getByText('No scenes extracted yet')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Upload an NSD document to extract and display scene list'
        )
      ).toBeInTheDocument();
    });

    it('should show empty state icon', () => {
      render(<SceneList scenes={[]} loading={false} />);

      const emptyContainer = screen.getByText('No scenes extracted yet').parentElement;
      expect(emptyContainer).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render loading state when loading is true', () => {
      render(<SceneList scenes={[]} loading={true} />);

      expect(screen.getByText('Extracting scenes from document...')).toBeInTheDocument();
    });

    it('should show loading spinner', () => {
      render(<SceneList scenes={[]} loading={true} />);

      // Check for loader icon (Lucide Loader2)
      const loadingContainer = screen.getByText('Extracting scenes from document...').parentElement;
      expect(loadingContainer).toBeInTheDocument();
    });

    it('should not show empty state when loading', () => {
      render(<SceneList scenes={[]} loading={true} />);

      expect(screen.queryByText('No scenes extracted yet')).not.toBeInTheDocument();
    });
  });

  describe('Scene List Rendering', () => {
    it('should render all scenes', () => {
      render(<SceneList scenes={mockScenes} loading={false} />);

      expect(screen.getByText('Tavern Meeting')).toBeInTheDocument();
      expect(screen.getByText('Bard Conversation')).toBeInTheDocument();
      expect(screen.getByText('Throne Room')).toBeInTheDocument();
    });

    it('should display scene numbers', () => {
      render(<SceneList scenes={mockScenes} loading={false} />);

      expect(screen.getByText('Scene 1')).toBeInTheDocument();
      expect(screen.getByText('Scene 2')).toBeInTheDocument();
      expect(screen.getByText('Scene 3')).toBeInTheDocument();
    });

    it('should show scene count in header', () => {
      render(<SceneList scenes={mockScenes} loading={false} />);

      expect(screen.getByText('3 scenes')).toBeInTheDocument();
    });

    it('should show singular "scene" for single item', () => {
      const singleScene = [mockScenes[0]];
      render(<SceneList scenes={singleScene} loading={false} />);

      expect(screen.getByText('1 scene')).toBeInTheDocument();
    });

    it('should display content preview', () => {
      render(<SceneList scenes={mockScenes} loading={false} />);

      expect(
        screen.getByText(/The hero enters the dimly lit tavern/)
      ).toBeInTheDocument();
    });

    it('should display summary when available', () => {
      render(<SceneList scenes={mockScenes} loading={false} />);

      expect(screen.getByText('Introduction to quest giver')).toBeInTheDocument();
      expect(screen.getByText('Learning about the artifact')).toBeInTheDocument();
    });
  });

  describe('Accordion Behavior', () => {
    it('should expand scene on click', () => {
      const { container } = render(<SceneList scenes={mockScenes} loading={false} />);

      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      expect(firstSceneButton).toBeInTheDocument();

      if (!firstSceneButton) throw new Error('Scene button not found');

      // Initially no expanded regions
      expect(container.querySelectorAll('[role="region"]').length).toBe(0);

      // Click to expand
      fireEvent.click(firstSceneButton);

      // Should have expanded region
      expect(container.querySelectorAll('[role="region"]').length).toBe(1);
    });

    it('should collapse scene on second click', () => {
      const { container } = render(<SceneList scenes={mockScenes} loading={false} />);

      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      if (!firstSceneButton) throw new Error('Scene button not found');

      // Expand
      fireEvent.click(firstSceneButton);
      expect(container.querySelectorAll('[role="region"]').length).toBe(1);

      // Collapse
      fireEvent.click(firstSceneButton);
      expect(container.querySelectorAll('[role="region"]').length).toBe(0);
    });

    it('should only allow one scene expanded at a time', () => {
      const { container } = render(<SceneList scenes={mockScenes} loading={false} />);

      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      const secondSceneButton = screen.getByText('Bard Conversation').closest('button');

      if (!firstSceneButton || !secondSceneButton) {
        throw new Error('Scene buttons not found');
      }

      // Expand first scene
      fireEvent.click(firstSceneButton);
      expect(container.querySelectorAll('[role="region"]').length).toBe(1);

      // Expand second scene - first should collapse
      fireEvent.click(secondSceneButton);
      expect(container.querySelectorAll('[role="region"]').length).toBe(1); // Still only one

      // Check that the expanded content is for scene 2
      expect(screen.getByText('Learning about the artifact')).toBeInTheDocument();
    });

    it('should display full content when expanded', () => {
      const { container } = render(<SceneList scenes={mockScenes} loading={false} />);

      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      if (!firstSceneButton) throw new Error('Scene button not found');

      fireEvent.click(firstSceneButton);

      // Check that expanded content region exists
      const expandedRegion = container.querySelector('[role="region"]');
      expect(expandedRegion).toBeInTheDocument();

      // Check that it contains the full content
      expect(expandedRegion?.textContent).toContain('The hero enters the dimly lit tavern');
    });

    it('should show character count when expanded', () => {
      const { container } = render(<SceneList scenes={mockScenes} loading={false} />);

      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      if (!firstSceneButton) throw new Error('Scene button not found');

      fireEvent.click(firstSceneButton);

      // Check that expanded content contains character count
      const expandedRegion = container.querySelector('[role="region"]');
      expect(expandedRegion?.textContent).toMatch(/\d+ characters/);
    });
  });

  describe('Scene Selection Callback', () => {
    it('should call onSceneClick when scene is clicked', () => {
      const handleClick = jest.fn();
      render(<SceneList scenes={mockScenes} loading={false} onSceneClick={handleClick} />);

      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      if (!firstSceneButton) throw new Error('Scene button not found');

      fireEvent.click(firstSceneButton);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledWith(mockScenes[0]);
    });

    it('should call onSceneClick for each scene', () => {
      const handleClick = jest.fn();
      render(<SceneList scenes={mockScenes} loading={false} onSceneClick={handleClick} />);

      // Click each scene
      mockScenes.forEach((scene) => {
        const button = screen.getByText(scene.title).closest('button');
        if (!button) throw new Error(`Button for ${scene.title} not found`);
        fireEvent.click(button);
      });

      expect(handleClick).toHaveBeenCalledTimes(3);
      expect(handleClick).toHaveBeenNthCalledWith(1, mockScenes[0]);
      expect(handleClick).toHaveBeenNthCalledWith(2, mockScenes[1]);
      expect(handleClick).toHaveBeenNthCalledWith(3, mockScenes[2]);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<SceneList scenes={mockScenes} loading={false} />);

      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      if (!firstSceneButton) throw new Error('Scene button not found');

      // Initially collapsed
      expect(firstSceneButton).toHaveAttribute('aria-expanded', 'false');

      // After click
      fireEvent.click(firstSceneButton);
      expect(firstSceneButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-controls pointing to content', () => {
      render(<SceneList scenes={mockScenes} loading={false} />);

      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      if (!firstSceneButton) throw new Error('Scene button not found');

      expect(firstSceneButton).toHaveAttribute('aria-controls', 'scene-content-scene-1');
    });

    it('should support keyboard navigation with Enter key', () => {
      const { container } = render(<SceneList scenes={mockScenes} loading={false} />);

      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      if (!firstSceneButton) throw new Error('Scene button not found');

      // Initially collapsed
      expect(container.querySelectorAll('[role="region"]').length).toBe(0);

      // Press Enter
      fireEvent.keyDown(firstSceneButton, { key: 'Enter', code: 'Enter' });

      // Should expand
      expect(container.querySelectorAll('[role="region"]').length).toBe(1);
    });

    it('should support keyboard navigation with Space key', () => {
      const { container } = render(<SceneList scenes={mockScenes} loading={false} />);

      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      if (!firstSceneButton) throw new Error('Scene button not found');

      // Press Space
      fireEvent.keyDown(firstSceneButton, { key: ' ', code: 'Space' });

      // Should expand
      expect(container.querySelectorAll('[role="region"]').length).toBe(1);
    });

    it('should have proper heading hierarchy', () => {
      render(<SceneList scenes={mockScenes} loading={false} />);

      // Main heading
      const mainHeading = screen.getByText('Extracted Scenes');
      expect(mainHeading.tagName).toBe('H2');
    });
  });

  describe('Styling and Classes', () => {
    it('should apply custom className when provided', () => {
      const { container } = render(
        <SceneList scenes={mockScenes} loading={false} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render with proper structure', () => {
      const { container } = render(<SceneList scenes={mockScenes} loading={false} />);

      const sceneItems = container.querySelectorAll('[role="region"]');
      expect(sceneItems.length).toBe(0); // No expanded scenes initially
    });
  });

  describe('Long Content Handling', () => {
    it('should truncate content preview for long scenes', () => {
      const longScene: NSDSceneDTO = NSDSceneDTOFakeBuilder.anEntity()
        .withId('scene-long')
        .withTitle('Long Scene')
        .withSceneNumber(1)
        .withLongContent(300)
        .withoutSummary()
        .build() as NSDSceneDTO;

      render(<SceneList scenes={[longScene]} loading={false} />);

      const button = screen.getByText('Long Scene').closest('button');
      if (!button) throw new Error('Button not found');

      // Preview should show ellipsis
      const preview = within(button).getByText(/A+.../);
      expect(preview).toBeInTheDocument();
    });
  });

  describe('Scene Without Summary', () => {
    it('should render scenes without summary', () => {
      const sceneWithoutSummary: NSDSceneDTO = NSDSceneDTOFakeBuilder.anEntity()
        .withId('scene-no-summary')
        .withTitle('Scene Without Summary')
        .withSceneNumber(1)
        .withContent('This scene has no summary.')
        .withoutSummary()
        .build() as NSDSceneDTO;

      render(<SceneList scenes={[sceneWithoutSummary]} loading={false} />);

      expect(screen.getByText('Scene Without Summary')).toBeInTheDocument();
    });
  });

  describe('Scene Selection', () => {
    it('renders without selection props', () => {
      const { container } = render(<SceneList scenes={mockScenes} loading={false} />);

      // Should render all scenes without errors
      expect(screen.getByText('Tavern Meeting')).toBeInTheDocument();
      expect(screen.getByText('Bard Conversation')).toBeInTheDocument();
      expect(screen.getByText('Throne Room')).toBeInTheDocument();

      // Should not show any selected state
      const checkIcons = container.querySelectorAll('[data-lucide="check"]');
      expect(checkIcons.length).toBe(0);
    });

    it('passes selectedSceneId to SceneItem', () => {
      const { container } = render(
        <SceneList scenes={mockScenes} loading={false} selectedSceneId={mockScenes[1].id} />
      );

      // Expand second scene to see selection state
      const secondSceneButton = screen.getByText('Bard Conversation').closest('button');
      if (!secondSceneButton) throw new Error('Scene button not found');

      fireEvent.click(secondSceneButton);

      // Should show the expanded region
      const expandedRegion = container.querySelector('[role="region"]');
      expect(expandedRegion).toBeInTheDocument();

      // Should show "Selected" button text
      expect(screen.getByText('Selected')).toBeInTheDocument();
    });

    it('calls onSceneSelect when Select button is clicked', () => {
      const handleSelect = jest.fn();
      const { container } = render(
        <SceneList scenes={mockScenes} loading={false} onSceneSelect={handleSelect} />
      );

      // Expand first scene
      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      if (!firstSceneButton) throw new Error('Scene button not found');
      fireEvent.click(firstSceneButton);

      // Find and click the Select button
      const selectButton = screen.getByText('Select Scene');
      fireEvent.click(selectButton);

      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(handleSelect).toHaveBeenCalledWith(mockScenes[0]);
    });

    it('shows Check icon when scene is selected', () => {
      const { container } = render(
        <SceneList scenes={mockScenes} loading={false} selectedSceneId={mockScenes[1].id} />
      );

      // The check icon should be visible for the selected scene
      // Check icon appears as an SVG with lucide-check class
      const checkIcon = container.querySelector('.lucide-check');
      expect(checkIcon).toBeInTheDocument();
    });

    it('applies border-primary class when selected', () => {
      const { container } = render(
        <SceneList scenes={mockScenes} loading={false} selectedSceneId={mockScenes[1].id} />
      );

      // Find all scene items (divs with border classes)
      const sceneItems = container.querySelectorAll('.border-primary');
      expect(sceneItems.length).toBeGreaterThan(0);
    });

    it('Select button click calls onSceneSelect with correct scene', () => {
      const handleSelect = jest.fn();
      const { container } = render(
        <SceneList scenes={mockScenes} loading={false} onSceneSelect={handleSelect} />
      );

      // Expand third scene
      const thirdSceneButton = screen.getByText('Throne Room').closest('button');
      if (!thirdSceneButton) throw new Error('Scene button not found');
      fireEvent.click(thirdSceneButton);

      // Click the Select button in expanded content
      const selectButton = screen.getByText('Select Scene');
      fireEvent.click(selectButton);

      expect(handleSelect).toHaveBeenCalledTimes(1);
      expect(handleSelect).toHaveBeenCalledWith(mockScenes[2]);
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Throne Room',
          sceneNumber: 3,
        })
      );
    });

    it('shows "Selected" button text when scene is selected', () => {
      const { container } = render(
        <SceneList
          scenes={mockScenes}
          loading={false}
          selectedSceneId={mockScenes[0].id}
          onSceneSelect={jest.fn()}
        />
      );

      // Expand first scene
      const firstSceneButton = screen.getByText('Tavern Meeting').closest('button');
      if (!firstSceneButton) throw new Error('Scene button not found');
      fireEvent.click(firstSceneButton);

      // Should show "Selected" instead of "Select Scene"
      expect(screen.getByText('Selected')).toBeInTheDocument();
      expect(screen.queryByText('Select Scene')).not.toBeInTheDocument();
    });

    it('applies bg-primary/5 class when selected', () => {
      const { container } = render(
        <SceneList scenes={mockScenes} loading={false} selectedSceneId={mockScenes[0].id} />
      );

      // Find the selected scene container
      const selectedScene = container.querySelector('.bg-primary\\/5');
      expect(selectedScene).toBeInTheDocument();
    });
  });
});
