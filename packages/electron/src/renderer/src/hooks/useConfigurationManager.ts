/**
 * useConfigurationManager Hook
 *
 * Custom hook for managing trecho CRUD operations in ConfigurationPanel.
 * Extracts business logic from the presentational component.
 *
 * Features:
 * - Add/update/delete trechos
 * - Edit mode management
 * - State stability with useCallback
 *
 * @see Task #7 - Extract business logic from ConfigurationPanel
 */

import { useState, useCallback, useEffect } from 'react';
import type { TrechoFormData } from '@coreto/electron/domain/types';

/**
 * Return type for useConfigurationManager hook.
 */
export interface UseConfigurationManagerReturn {
  /**
   * Currently configured trechos.
   */
  trechos: TrechoFormData[];

  /**
   * Index of trecho being edited (null when in create mode).
   */
  editingIndex: number | null;

  /**
   * Save a trecho (create new or update existing based on editingIndex).
   */
  saveTrecho: (data: TrechoFormData) => void;

  /**
   * Delete a trecho by index.
   */
  deleteTrecho: (index: number) => void;

  /**
   * Start editing a trecho.
   */
  startEdit: (index: number) => void;

  /**
   * Cancel edit mode.
   */
  cancelEdit: () => void;

  /**
   * Get trecho data for editing by index.
   */
  getEditingTrecho: () => TrechoFormData | null;
}

/**
 * Custom hook for managing trecho configuration state.
 *
 * Handles CRUD operations for trechos and edit mode state.
 * All operations are wrapped in useCallback for referential stability.
 *
 * @param initialTrechos - Initial trechos (default: empty array)
 * @returns Manager object with trechos state and CRUD operations
 *
 * @example
 * ```tsx
 * const {
 *   trechos,
 *   editingIndex,
 *   saveTrecho,
 *   deleteTrecho,
 *   startEdit,
 *   cancelEdit,
 *   getEditingTrecho
 * } = useConfigurationManager(initialTrechos);
 *
 * // Add new trecho
 * saveTrecho(newTrechoData);
 *
 * // Edit existing trecho
 * startEdit(0);
 * const editData = getEditingTrecho();
 * saveTrecho(updatedData);
 * ```
 */
export function useConfigurationManager(
  initialTrechos: TrechoFormData[] = []
): UseConfigurationManagerReturn {
  const [trechos, setTrechos] = useState<TrechoFormData[]>(initialTrechos);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  /**
   * Sincroniza o estado interno quando initialTrechos muda.
   *
   * useState só usa o valor inicial na primeira renderização.
   * Quando o pai passa novos initialTrechos (ex: carregar config do banco),
   * precisamos atualizar o estado explicitamente via useEffect.
   */
  useEffect(() => {
    setTrechos(initialTrechos);
  }, [initialTrechos]);

  /**
   * Save a trecho (create or update based on editingIndex).
   */
  const saveTrecho = useCallback(
    (data: TrechoFormData) => {
      if (editingIndex !== null) {
        // Update existing trecho
        setTrechos((prev) => prev.map((t, i) => (i === editingIndex ? data : t)));
      } else {
        // Add new trecho
        setTrechos((prev) => [...prev, data]);
      }
      setEditingIndex(null);
    },
    [editingIndex]
  );

  /**
   * Delete a trecho by index.
   */
  const deleteTrecho = useCallback((index: number) => {
    setTrechos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Start editing a trecho.
   */
  const startEdit = useCallback((index: number) => {
    setEditingIndex(index);
  }, []);

  /**
   * Cancel edit mode.
   */
  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
  }, []);

  /**
   * Get the trecho being edited.
   */
  const getEditingTrecho = useCallback((): TrechoFormData | null => {
    if (editingIndex === null || editingIndex >= trechos.length) {
      return null;
    }
    return trechos[editingIndex];
  }, [editingIndex, trechos]);

  return {
    trechos,
    editingIndex,
    saveTrecho,
    deleteTrecho,
    startEdit,
    cancelEdit,
    getEditingTrecho,
  };
}
