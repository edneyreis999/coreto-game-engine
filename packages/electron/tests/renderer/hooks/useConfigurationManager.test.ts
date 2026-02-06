/**
 * useConfigurationManager Hook Tests
 *
 * Tests for the custom hook that manages trecho CRUD operations.
 *
 * @see Task #7 - Extract business logic from ConfigurationPanel
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useConfigurationManager } from '@/hooks/useConfigurationManager';
import type { TrechoFormData } from '@coreto/electron/domain/types';

// Mock trecho data
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
      { classId: 1, level: 10 },
      { classId: 2, level: 10 },
    ],
  },
  enemyTeam: { troopId: 2 },
  expectedTTK: { turns: 10, actions: 20 },
  tolerance: 15,
};

describe('useConfigurationManager', () => {
  describe('initialization', () => {
    it('should initialize with empty trechos by default', () => {
      const { result } = renderHook(() => useConfigurationManager());

      expect(result.current.trechos).toEqual([]);
      expect(result.current.editingIndex).toBeNull();
    });

    it('should initialize with provided trechos', () => {
      const initialTrechos = [mockTrecho1, mockTrecho2];
      const { result } = renderHook(() =>
        useConfigurationManager(initialTrechos)
      );

      expect(result.current.trechos).toEqual(initialTrechos);
      expect(result.current.editingIndex).toBeNull();
    });
  });

  describe('saveTrecho - create mode', () => {
    it('should add a new trecho when editingIndex is null', () => {
      const { result } = renderHook(() => useConfigurationManager());

      act(() => {
        result.current.saveTrecho(mockTrecho1);
      });

      expect(result.current.trechos).toHaveLength(1);
      expect(result.current.trechos[0]).toEqual(mockTrecho1);
      expect(result.current.editingIndex).toBeNull();
    });

    it('should add multiple trechos', () => {
      const { result } = renderHook(() => useConfigurationManager());

      act(() => {
        result.current.saveTrecho(mockTrecho1);
      });

      act(() => {
        result.current.saveTrecho(mockTrecho2);
      });

      expect(result.current.trechos).toHaveLength(2);
      expect(result.current.trechos[0]).toEqual(mockTrecho1);
      expect(result.current.trechos[1]).toEqual(mockTrecho2);
    });
  });

  describe('saveTrecho - edit mode', () => {
    it('should update an existing trecho when editingIndex is set', () => {
      const { result } = renderHook(() =>
        useConfigurationManager([mockTrecho1, mockTrecho2])
      );

      // Start editing index 0
      act(() => {
        result.current.startEdit(0);
      });

      expect(result.current.editingIndex).toBe(0);

      // Update the trecho
      const updatedTrecho: TrechoFormData = {
        ...mockTrecho1,
        name: 'Updated Name',
      };

      act(() => {
        result.current.saveTrecho(updatedTrecho);
      });

      expect(result.current.trechos).toHaveLength(2);
      expect(result.current.trechos[0].name).toBe('Updated Name');
      expect(result.current.trechos[1]).toEqual(mockTrecho2);
      expect(result.current.editingIndex).toBeNull();
    });

    it('should not affect other trechos when updating', () => {
      const { result } = renderHook(() =>
        useConfigurationManager([mockTrecho1, mockTrecho2])
      );

      act(() => {
        result.current.startEdit(1);
      });

      const updatedTrecho: TrechoFormData = {
        ...mockTrecho2,
        description: 'Updated Description',
      };

      act(() => {
        result.current.saveTrecho(updatedTrecho);
      });

      expect(result.current.trechos[0]).toEqual(mockTrecho1);
      expect(result.current.trechos[1].description).toBe('Updated Description');
    });
  });

  describe('deleteTrecho', () => {
    it('should delete a trecho by index', () => {
      const { result } = renderHook(() =>
        useConfigurationManager([mockTrecho1, mockTrecho2])
      );

      act(() => {
        result.current.deleteTrecho(0);
      });

      expect(result.current.trechos).toHaveLength(1);
      expect(result.current.trechos[0]).toEqual(mockTrecho2);
    });

    it('should handle deleting the last trecho', () => {
      const { result } = renderHook(() =>
        useConfigurationManager([mockTrecho1])
      );

      act(() => {
        result.current.deleteTrecho(0);
      });

      expect(result.current.trechos).toHaveLength(0);
    });

    it('should handle deleting from middle of array', () => {
      const mockTrecho3: TrechoFormData = {
        ...mockTrecho1,
        id: 'trecho-3',
        name: 'Middle Battle',
      };

      const { result } = renderHook(() =>
        useConfigurationManager([mockTrecho1, mockTrecho3, mockTrecho2])
      );

      act(() => {
        result.current.deleteTrecho(1);
      });

      expect(result.current.trechos).toHaveLength(2);
      expect(result.current.trechos[0]).toEqual(mockTrecho1);
      expect(result.current.trechos[1]).toEqual(mockTrecho2);
    });
  });

  describe('startEdit and cancelEdit', () => {
    it('should set editingIndex when starting edit', () => {
      const { result } = renderHook(() =>
        useConfigurationManager([mockTrecho1, mockTrecho2])
      );

      act(() => {
        result.current.startEdit(1);
      });

      expect(result.current.editingIndex).toBe(1);
    });

    it('should clear editingIndex when canceling edit', () => {
      const { result } = renderHook(() =>
        useConfigurationManager([mockTrecho1, mockTrecho2])
      );

      act(() => {
        result.current.startEdit(0);
      });

      expect(result.current.editingIndex).toBe(0);

      act(() => {
        result.current.cancelEdit();
      });

      expect(result.current.editingIndex).toBeNull();
    });
  });

  describe('getEditingTrecho', () => {
    it('should return null when no trecho is being edited', () => {
      const { result } = renderHook(() =>
        useConfigurationManager([mockTrecho1])
      );

      expect(result.current.getEditingTrecho()).toBeNull();
    });

    it('should return the trecho being edited', () => {
      const { result } = renderHook(() =>
        useConfigurationManager([mockTrecho1, mockTrecho2])
      );

      act(() => {
        result.current.startEdit(1);
      });

      expect(result.current.getEditingTrecho()).toEqual(mockTrecho2);
    });

    it('should return null if editingIndex is out of bounds', () => {
      const { result } = renderHook(() =>
        useConfigurationManager([mockTrecho1])
      );

      act(() => {
        result.current.startEdit(5); // Invalid index
      });

      expect(result.current.getEditingTrecho()).toBeNull();
    });
  });

  describe('hook stability', () => {
    it('should maintain referential stability for functions', () => {
      const { result, rerender } = renderHook(() =>
        useConfigurationManager([mockTrecho1])
      );

      const firstRenderFunctions = {
        saveTrecho: result.current.saveTrecho,
        deleteTrecho: result.current.deleteTrecho,
        startEdit: result.current.startEdit,
        cancelEdit: result.current.cancelEdit,
      };

      rerender();

      expect(result.current.saveTrecho).toBe(firstRenderFunctions.saveTrecho);
      expect(result.current.deleteTrecho).toBe(
        firstRenderFunctions.deleteTrecho
      );
      expect(result.current.startEdit).toBe(firstRenderFunctions.startEdit);
      expect(result.current.cancelEdit).toBe(firstRenderFunctions.cancelEdit);
    });
  });
});
