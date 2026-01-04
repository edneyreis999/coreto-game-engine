# ADR-019: Damage Per Action Maximization for Skill Selection

**Status:** Accepted
**Date:** Unknown
**Related ADRs:** ADR-004

## Context and Problem Statement

The SIMULATION module requires an AI strategy for automated party members to select which skill to use during battle. This decision runs every turn for every party member across all battle simulations and fundamentally shapes TTK validation results.

The system must choose among multiple available skills in a deterministic, reproducible manner that reflects optimal player behavior for balance validation purposes. The choice of selection strategy determines whether TTK measurements represent best-case scenarios or average player performance.

## Decision Drivers

- Validation requires consistent, reproducible skill selection across all battle simulations
- TTK measurements should reflect optimal play baseline for balance validation
- Algorithm must be deterministic to enable regression testing of balance changes
- Selection strategy must be mathematically well-defined and auditable
- Performance impact acceptable as calculation runs every turn per party member
- Results must be interpretable for understanding simulation logs and TTK outcomes

## Considered Options

1. Damage-per-action maximization with expected value calculation
2. Random skill selection from available pool
3. Utility-based AI considering damage, healing, buffs, and debuffs

## Decision Outcome

Chosen option: **Damage-per-action maximization**, because it represents optimal player behavior for balance validation, is deterministic and mathematically well-defined, and aligns with the goal of measuring TTK under ideal conditions.

The algorithm calculates expected damage considering critical hits, miss chances, and variance for each available skill (after HP/MP filtering per ADR-004), then selects the skill with highest expected damage divided by actions required. This accounts for multi-hit skills and action economy.

## Pros and Cons of the Options

### Damage-per-action maximization

**Pros:**

- Deterministic results enable consistent TTK measurements and regression testing
- Represents optimal play baseline for validating balance potential
- Mathematically well-defined using expected value formula
- Simple to audit and debug from simulation logs

**Cons:**

- Assumes players always make optimal choices, may not reflect realistic gameplay
- Ignores defensive, utility, or resource conservation strategies
- All historical TTK measurements invalidated if algorithm changes
- Requires performance overhead to evaluate all skills every turn

### Random skill selection

**Pros:**

- Extremely simple to implement
- Introduces variability that might catch edge cases

**Cons:**

- Non-deterministic breaks reproducibility requirement
- Cannot produce consistent TTK baseline for balance comparison
- Results not interpretable or auditable
- Does not reflect player behavior (neither optimal nor realistic)

### Utility-based AI

**Pros:**

- More realistic player simulation considering healing, buffs, debuffs
- Suitable for advanced team compositions with support roles
- Better coverage of edge cases in complex battles

**Cons:**

- Significantly higher implementation complexity
- Requires weighting factors for damage vs. utility trade-offs
- Not needed for MVP v1 focused on damage progression validation
- Deferred to post-MVP when advanced compositions are required

## Consequences

**Positive:**

- All TTK measurements represent best-case optimal play scenarios
- Deterministic algorithm enables precise regression testing of balance changes
- Clear mathematical foundation for expected damage calculation
- Simulation logs transparently show why each skill was chosen

**Negative:**

- Historical TTK measurements will be invalidated if algorithm changes in future versions
- Does not validate builds dependent on defensive or utility strategies
- May need versioning system for simulation algorithm to track long-term balance trends
- Expected damage calculation must reverse-engineer VisuStella plugin damage modifications

**Neutral:**

- Extension points needed for alternative strategies (defensive mode, resource conservation, build-specific rotations)
- Future versions may require multiple selection strategies for different validation scenarios
- Testing requires validation that expected damage matches actual game engine calculations

## References

- docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:177-198
- docs/hld-coreto-game-engine.md:153-169
- docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md:64-72
