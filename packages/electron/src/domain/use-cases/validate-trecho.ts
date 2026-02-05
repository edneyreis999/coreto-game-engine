/**
 * Validate Trecho Use Case
 *
 * Validates trecho configuration using domain entities from @coreto/core.
 * This use case encapsulates the validation logic for trecho updates.
 */

import { Trecho, PartyConfig } from '@coreto/core';

export interface ValidateTrechoInput {
  id: string;
  name?: string | undefined;
  anchorLevelMin: number;
  anchorLevelMax: number;
  targetTtkTurns: number;
  targetTtkActions: number;
  tolerancePercent: number;
  troopIds: number[];
  party: { members: Array<{ classId: number; level: number }> };
}

export interface ValidateTrechoOutput {
  trecho: {
    id: string;
    name: string;
    anchorLevelMin: number;
    anchorLevelMax: number;
    targetTtkTurns: number;
    targetTtkActions: number;
    tolerancePercent: number;
    troopIds: number[];
    party: { members: Array<{ classId: number; level: number }> };
  };
}

/**
 * Validates a trecho configuration using domain entities.
 *
 * @param input - Trecho data to validate
 * @returns Validated trecho data
 * @throws Error if validation fails
 *
 * @example
 * const result = validateTrecho({
 *   id: 'trecho-1',
 *   anchorLevelMin: 1,
 *   anchorLevelMax: 10,
 *   // ... other fields
 * });
 */
export function validateTrecho(input: ValidateTrechoInput): ValidateTrechoOutput {
  // Convert form data to domain entities
  const party = new PartyConfig(input.party.members);

  // Validate trecho (will throw if invalid)
  new Trecho({
    id: input.id,
    name: input.name ?? input.id,
    anchorLevelMin: input.anchorLevelMin,
    anchorLevelMax: input.anchorLevelMax,
    targetTtkTurns: input.targetTtkTurns,
    targetTtkActions: input.targetTtkActions,
    tolerancePercent: input.tolerancePercent,
    troopIds: input.troopIds,
    party,
  });

  // Return validated data (domain entities validate by construction)
  return {
    trecho: {
      id: input.id,
      name: input.name ?? input.id,
      anchorLevelMin: input.anchorLevelMin,
      anchorLevelMax: input.anchorLevelMax,
      targetTtkTurns: input.targetTtkTurns,
      targetTtkActions: input.targetTtkActions,
      tolerancePercent: input.tolerancePercent,
      troopIds: input.troopIds,
      party: input.party,
    },
  };
}
