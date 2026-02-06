/**
 * useTrechoForm Hook
 *
 * Manages state and handlers for the TrechoForm component.
 * Provides real-time validation using Zod schemas.
 */

import { useState, useCallback } from 'react';
import type {
  TrechoFormData,
  PartyMemberFormData,
  SelectOption,
} from '../../types';
import {
  getDefaultTrechoFormData,
  validateTrechoForm,
  validateTrechoField,
} from '../../validation';

export interface UseTrechoFormOptions {
  initialData?: TrechoFormData;
  classes: SelectOption[];
}

export interface UseTrechoFormReturn {
  formData: TrechoFormData;
  selectedTroopIds: Set<number>;
  errors: Record<string, string>;
  hasErrors: boolean;
  isFormValid: boolean;
  updateField: <K extends keyof TrechoFormData>(
    field: K,
    value: TrechoFormData[K]
  ) => void;
  updatePartyMember: (index: number, member: PartyMemberFormData) => void;
  addPartyMember: () => void;
  removePartyMember: (index: number) => void;
  toggleTroop: (troopId: number) => void;
  validate: () => boolean;
  getSubmitData: () => TrechoFormData;
}

export function useTrechoForm({
  initialData,
  classes,
}: UseTrechoFormOptions): UseTrechoFormReturn {
  // ========================================================================
  // State
  // ========================================================================

  const [formData, setFormData] = useState<TrechoFormData>(
    initialData ?? getDefaultTrechoFormData()
  );

  const [selectedTroopIds, setSelectedTroopIds] = useState<Set<number>>(
    new Set(initialData?.troopIds ?? [])
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ========================================================================
  // Field Update Handlers
  // ========================================================================

  const updateField = useCallback(
    <K extends keyof TrechoFormData>(field: K, value: TrechoFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Real-time validation
      const error = validateTrechoField(field, value);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
    },
    []
  );

  // ========================================================================
  // Party Handlers
  // ========================================================================

  const updatePartyMember = useCallback(
    (index: number, member: PartyMemberFormData) => {
      setFormData((prev) => ({
        ...prev,
        party: {
          ...prev.party,
          members: prev.party.members.map((m, i) =>
            i === index ? member : m
          ),
        },
      }));

      // Validate member
      const classError = validateTrechoField(
        `party.members.${index}.classId`,
        member.classId
      );
      const levelError = validateTrechoField(
        `party.members.${index}.level`,
        member.level
      );

      setErrors((prev) => {
        const newErrors = { ...prev };
        if (classError) {
          newErrors[`party.members.${index}.classId`] = classError;
        } else {
          delete newErrors[`party.members.${index}.classId`];
        }
        if (levelError) {
          newErrors[`party.members.${index}.level`] = levelError;
        } else {
          delete newErrors[`party.members.${index}.level`];
        }
        return newErrors;
      });
    },
    []
  );

  const addPartyMember = useCallback(() => {
    setFormData((prev) => {
      if (prev.party.members.length >= 4) {
        return prev;
      }
      return {
        ...prev,
        party: {
          ...prev.party,
          members: [
            ...prev.party.members,
            { classId: classes[0]?.value ?? 1, level: 1 },
          ],
        },
      };
    });
  }, [classes]);

  const removePartyMember = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      party: {
        ...prev.party,
        members: prev.party.members.filter((_, i) => i !== index),
      },
    }));
  }, []);

  // ========================================================================
  // Troop Selection Handlers
  // ========================================================================

  const toggleTroop = useCallback(
    (troopId: number) => {
      setSelectedTroopIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(troopId)) {
          newSet.delete(troopId);
        } else {
          newSet.add(troopId);
        }
        return newSet;
      });

      // Update form data
      setFormData((prev) => {
        const newTroopIds = selectedTroopIds.has(troopId)
          ? prev.troopIds.filter((id) => id !== troopId)
          : [...prev.troopIds, troopId];
        return { ...prev, troopIds: newTroopIds };
      });
    },
    [selectedTroopIds]
  );

  // ========================================================================
  // Validation
  // ========================================================================

  const validate = useCallback((): boolean => {
    const validation = validateTrechoForm({
      ...formData,
      troopIds: Array.from(selectedTroopIds),
    });

    if (!validation.isValid) {
      setErrors(
        Object.fromEntries(
          Object.entries(validation.errors).map(([k, v]) => [k, v.message])
        )
      );
      return false;
    }

    return true;
  }, [formData, selectedTroopIds]);

  const getSubmitData = useCallback((): TrechoFormData => {
    return {
      ...formData,
      troopIds: Array.from(selectedTroopIds),
    };
  }, [formData, selectedTroopIds]);

  // ========================================================================
  // Validation Status
  // ========================================================================

  const hasErrors = Object.keys(errors).length > 0;
  const isFormValid =
    formData.id.trim() !== '' &&
    selectedTroopIds.size > 0 &&
    formData.party.members.length >= 1 &&
    !hasErrors;

  // ========================================================================
  // Return
  // ========================================================================

  return {
    formData,
    selectedTroopIds,
    errors,
    hasErrors,
    isFormValid,
    updateField,
    updatePartyMember,
    addPartyMember,
    removePartyMember,
    toggleTroop,
    validate,
    getSubmitData,
  };
}
