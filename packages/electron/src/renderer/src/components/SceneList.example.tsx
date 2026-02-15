/**
 * SceneList Component Usage Example
 *
 * This file demonstrates how to use the SceneList component in your application.
 */

import { SceneList } from '@/components/SceneList';
import type { NSDSceneDTO } from '@coreto/electron/domain/types';

// Example 1: Basic usage with scene data
function Example1() {
  const scenes: NSDSceneDTO[] = [
    {
      id: 'scene-1',
      title: 'Tavern Meeting',
      sceneNumber: 1,
      content: 'The hero enters the dimly lit tavern...',
      summary: 'Introduction to quest giver',
    },
    {
      id: 'scene-2',
      title: 'Bard Conversation',
      sceneNumber: 2,
      content: 'An elderly bard sits in the corner...',
      summary: 'Learning about the artifact',
    },
  ];

  return <SceneList scenes={scenes} loading={false} />;
}

// Example 2: With loading state
function Example2() {
  return <SceneList scenes={[]} loading={true} />;
}

// Example 3: With scene click handler
function Example3() {
  const handleSceneClick = (scene: NSDSceneDTO) => {
    console.log('Selected scene:', scene.title);
    // Navigate to scene detail view or perform other action
  };

  return (
    <SceneList
      scenes={[
        {
          id: 'scene-1',
          title: 'Scene Title',
          sceneNumber: 1,
          content: 'Scene content...',
        },
      ]}
      loading={false}
      onSceneClick={handleSceneClick}
    />
  );
}

// Example 4: With custom styling
function Example4() {
  return (
    <SceneList
      scenes={[]}
      loading={false}
      className="max-w-2xl mx-auto"
    />
  );
}

// Example 5: Empty state
function Example5() {
  return <SceneList scenes={[]} loading={false} />;
}

export {
  Example1,
  Example2,
  Example3,
  Example4,
  Example5,
};
