/**
 * Config Builder Tests
 *
 * Tests for pure functions that build configuration objects.
 *
 * @see Task #7 - Extract business logic from ConfigurationPanel
 */

import { describe, it, expect } from 'vitest';
import { buildProjectConfig } from '@/lib/config-builder';
import type { TrechoFormData, GlobalSettingsFormData } from '@coreto/electron/domain/types';

// Mock data
const mockTrecho1: TrechoFormData = {
  id: 'trecho-1',
  name: 'Initial Battle',
  description: 'First encounter',
  heroTeam: {
    members: [
      { classId: 1, level: 5 },
      { classId: 2, level: 5 },
    ],
  },
  enemyTeam: { troopId: 1 },
  expectedTTK: { turns: 3, actions: 5 },
  tolerance: 10,
};

const mockTrecho2: TrechoFormData = {
  id: 'trecho-2',
  name: 'Boss Battle',
  description: 'Final boss',
  heroTeam: {
    members: [
      { classId: 3, level: 10 },
      { classId: 4, level: 10 },
    ],
  },
  enemyTeam: { troopId: 2 },
  expectedTTK: { turns: 10, actions: 20 },
  tolerance: 15,
};

const mockGlobalSettings: GlobalSettingsFormData = {
  seed: 12345,
  maxBattleTurns: 100,
};

describe('buildProjectConfig', () => {
  it('should build a valid project configuration', () => {
    const projectPath = '/path/to/project';
    const trechos = [mockTrecho1, mockTrecho2];

    const result = buildProjectConfig(projectPath, trechos, mockGlobalSettings);

    expect(result).toEqual({
      projectPath,
      trechos: [
        {
          id: 'trecho-1',
          name: 'Initial Battle',
          description: 'First encounter',
          heroTeam: {
            members: [
              { classId: 1, level: 5 },
              { classId: 2, level: 5 },
            ],
          },
          enemyTeam: { troopId: 1 },
          expectedTTK: { turns: 3, actions: 5 },
          tolerance: 10,
        },
        {
          id: 'trecho-2',
          name: 'Boss Battle',
          description: 'Final boss',
          heroTeam: {
            members: [
              { classId: 3, level: 10 },
              { classId: 4, level: 10 },
            ],
          },
          enemyTeam: { troopId: 2 },
          expectedTTK: { turns: 10, actions: 20 },
          tolerance: 15,
        },
      ],
      globalSettings: {
        seed: 12345,
        maxBattleTurns: 100,
      },
    });
  });

  it('should handle empty trechos array', () => {
    const projectPath = '/path/to/project';
    const trechos: TrechoFormData[] = [];

    const result = buildProjectConfig(projectPath, trechos, mockGlobalSettings);

    expect(result).toEqual({
      projectPath,
      trechos: [],
      globalSettings: {
        seed: 12345,
        maxBattleTurns: 100,
      },
    });
  });

  it('should handle single trecho', () => {
    const projectPath = '/path/to/project';
    const trechos = [mockTrecho1];

    const result = buildProjectConfig(projectPath, trechos, mockGlobalSettings);

    expect(result.trechos).toHaveLength(1);
    expect(result.trechos[0]).toEqual(mockTrecho1);
  });

  it('should preserve all trecho properties', () => {
    const projectPath = '/path/to/project';
    const trechos = [mockTrecho1];

    const result = buildProjectConfig(projectPath, trechos, mockGlobalSettings);

    const outputTrecho = result.trechos[0];

    expect(outputTrecho.id).toBe(mockTrecho1.id);
    expect(outputTrecho.name).toBe(mockTrecho1.name);
    expect(outputTrecho.description).toBe(mockTrecho1.description);
    expect(outputTrecho.heroTeam).toEqual(mockTrecho1.heroTeam);
    expect(outputTrecho.enemyTeam).toEqual(mockTrecho1.enemyTeam);
    expect(outputTrecho.expectedTTK).toEqual(mockTrecho1.expectedTTK);
    expect(outputTrecho.tolerance).toBe(mockTrecho1.tolerance);
  });

  it('should preserve global settings', () => {
    const projectPath = '/path/to/project';
    const trechos = [mockTrecho1];

    const result = buildProjectConfig(projectPath, trechos, mockGlobalSettings);

    expect(result.globalSettings.seed).toBe(mockGlobalSettings.seed);
    expect(result.globalSettings.maxBattleTurns).toBe(
      mockGlobalSettings.maxBattleTurns
    );
  });

  it('should handle different project paths', () => {
    const projectPaths = [
      '/path/to/project',
      'C:\\Users\\Project',
      '/home/user/my-project',
    ];

    projectPaths.forEach((projectPath) => {
      const result = buildProjectConfig(projectPath, [mockTrecho1], mockGlobalSettings);

      expect(result.projectPath).toBe(projectPath);
    });
  });

  it('should be a pure function (no side effects)', () => {
    const projectPath = '/path/to/project';
    const trechos = [mockTrecho1, mockTrecho2];
    const settings = { ...mockGlobalSettings };

    const originalTrechos = JSON.parse(JSON.stringify(trechos));
    const originalSettings = JSON.parse(JSON.stringify(settings));

    buildProjectConfig(projectPath, trechos, settings);

    // Verify inputs were not mutated
    expect(trechos).toEqual(originalTrechos);
    expect(settings).toEqual(originalSettings);
  });

  it('should handle complex hero teams', () => {
    const complexTrecho: TrechoFormData = {
      id: 'complex',
      name: 'Complex Battle',
      description: 'Multi-member team',
      heroTeam: {
        members: [
          { classId: 1, level: 5 },
          { classId: 2, level: 10 },
          { classId: 3, level: 15 },
          { classId: 4, level: 20 },
        ],
      },
      enemyTeam: { troopId: 5 },
      expectedTTK: { turns: 15, actions: 30 },
      tolerance: 20,
    };

    const result = buildProjectConfig(
      '/path/to/project',
      [complexTrecho],
      mockGlobalSettings
    );

    expect(result.trechos[0].heroTeam.members).toHaveLength(4);
    expect(result.trechos[0].heroTeam.members).toEqual(complexTrecho.heroTeam.members);
  });

  it('should handle various global settings values', () => {
    const projectPath = '/path/to/project';
    const trechos = [mockTrecho1];

    const testSettings = [
      { seed: 0, maxBattleTurns: 1 },
      { seed: 999999, maxBattleTurns: 1000 },
      { seed: 54321, maxBattleTurns: 50 },
    ];

    testSettings.forEach((settings) => {
      const result = buildProjectConfig(projectPath, trechos, settings);

      expect(result.globalSettings).toEqual(settings);
    });
  });
});
