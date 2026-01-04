# ADR-027: Level-Based Skill Derivation from Class Learnings

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-002 (Progressão de Skills - Automática vs Manual), ADR-019

## Context and Problem Statement

The SIMULATION module must determine which skills are available to each party member during battle simulation. Skills in RPG Maker MZ are learned progressively based on character level through a `learnings` system defined in Classes data. For MVP validation purposes, the engine needs a mechanism to derive available skills from class configuration and current level without requiring manual skill list specification.

The core question: Should skill availability be derived automatically from level-based progression data, or require explicit configuration?

## Decision Drivers

- Simplicity of configuration for MVP scope (designers specify only classId + level)
- Alignment with RPG Maker MZ's existing learnings progression system
- Validation reproducibility (same class + level = same skills)
- Future extensibility for shop-purchased skills (post-MVP)
- Realistic representation of character progression mechanics

## Considered Options

1. Automatic derivation from `Classes.learnings` filtered by level
2. Explicit skill lists in party configuration from MVP start
3. All skills available regardless of level (no progression)

## Decision Outcome

Chosen option: **Automatic derivation from `Classes.learnings` filtered by level**, because it provides the simplest MVP implementation while accurately representing standard character progression. Skills are unlocked when `learnings[].level <= member.level`, matching RPG Maker MZ behavior.

This implements the high-level decision from ADR-002 (automatic progression for MVP). The derivation algorithm iterates the `learnings` array from Classes data and collects skill IDs where the required level does not exceed the character's current level.

### Pros and Cons of the Options

#### Automatic Derivation (Chosen)

**Pros:**
- Simple configuration: designers specify only `{ classId, level }` per party member
- Matches RPG Maker MZ progression semantics directly
- Reduces configuration errors (no manual skill ID entry)
- Sufficient for validating standard progression paths in MVP

**Cons:**
- Cannot test alternate builds (shop-purchased skills, custom loadouts)
- Schema must evolve post-MVP to support explicit skills
- Edge case: characters below first learning level have zero skills

#### Explicit Skill Lists

**Pros:**
- Maximum flexibility for testing any skill combination
- Supports shop-purchased skills immediately
- No schema evolution needed later

**Cons:**
- Complex configuration: designers must manually list all skill IDs
- High error potential (invalid IDs, level-inappropriate skills)
- Unnecessary overhead for MVP scope (shop system not implemented)

#### All Skills Available

**Pros:**
- Simplest possible implementation
- No level tracking needed

**Cons:**
- Unrealistic (level 1 character with ultimate abilities)
- Doesn't validate actual game progression mechanics
- Ignores existing learnings system design

## Consequences

**Positive:**
- MVP configuration remains lightweight and designer-friendly
- Battle simulations reflect realistic skill availability for level ranges
- Derivation logic is deterministic (same inputs = same skills)
- Foundation aligns with RPG Maker MZ conventions

**Negative:**
- Schema versioning required when explicit skills added post-MVP
- Future hybrid mode needed (derive base + add purchased)
- Empty skill lists possible if level < first learning (requires warning system)

**Neutral:**
- Derivation is one-time per battle setup (negligible performance cost)
- Future validation logic must support both automatic and explicit modes

## References

- /Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:153-176
- /Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:344-376
- /Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-002-progressao-skills-automatica-vs-manual.md
