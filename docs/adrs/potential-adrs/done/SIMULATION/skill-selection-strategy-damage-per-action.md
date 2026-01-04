# Potential ADR: Skill Selection Strategy - Damage Per Action Maximization

**Module**: SIMULATION
**Category**: Architecture
**Priority**: Must Document (Score: 145)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- **ADR-004**: Considerar Apenas HP e MP na Escolha de Skills (MVP v1) (SIMULATION, 2026-01-04)

**Timeline Context**:
- This decision builds on ADR-004's filtering approach
- ADR-004 defines WHAT constraints are checked; this ADR defines HOW skills are chosen among valid options

**When creating formal ADR**: Reference ADR-004 in Related ADRs section as complementary decision

---

## What Was Identified

The SIMULATION module must implement an AI strategy for party members to choose which skill to use during battle. The documented approach uses a **damage-per-action maximization** algorithm: among all skills that pass HP/MP cost filters, the system selects the skill with the highest expected damage per action.

This is a foundational architectural decision that determines how the simulation will behave across all battles. The choice of this specific heuristic (damage maximization) vs. alternatives (random, round-robin, utility-based) fundamentally shapes the validation results and whether TTK measurements reflect optimal or realistic player behavior.

The pattern is documented in:
- PRD FR-005: "Escolha de skill por melhor dano esperado por ação"
- HLD Section 3.5: "Implementar escolha de skill por melhor dano esperado por ação"
- Research document describing the mathematical foundation for expected damage calculation

## Why This Might Deserve an ADR

- **Impact**: Affects ALL battle simulations - this algorithm runs every turn for every party member across all trechos
- **Trade-offs**:
  - Optimality vs. Realism: Damage maximization assumes players always make optimal choices, which may not reflect actual gameplay
  - Determinism vs. Variability: Algorithm is deterministic given same state, producing consistent results but potentially missing edge cases
  - Performance vs. Accuracy: Expected damage calculation requires evaluating all available skills every turn
- **Complexity**: Requires implementing expected damage formulas considering critical hits, miss chances, and variance (documented in research: `E[Damage] = (Base × (1 - P_crit - P_miss)) + (Crit × P_crit) + (0 × P_miss)`)
- **Team Knowledge**: Critical for understanding why certain skills are chosen in simulation logs and interpreting TTK validation results
- **Future Implications**:
  - Changing this algorithm would invalidate all historical TTK measurements
  - Future versions may need alternative strategies (defensive, resource conservation, utility priority)
  - Extension points needed for build-specific skill rotations (when skills can be purchased vs. learned by level)

## Evidence Found in Codebase

### Key Files
**Note**: This is a planning-phase project - no implementation exists yet. Evidence is from documentation.

- [`/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 177-198
  - Defines functional requirement FR-005 for skill choice algorithm
  - Specifies filtering by HP/MP and selection by "maior dano esperado"

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 153-169
  - SIMULATION Layer responsibilities include skill selection
  - Specifies "melhor dano esperado por ação" as selection criteria

- [`/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`](/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md) - Lines 64-72
  - Mathematical foundation for expected damage calculation
  - Formula: `E = (Base_Damage × (1 - P_crit - P_miss)) + (Crit_Damage × P_crit) + (0 × P_miss)`

### Code Evidence

**Documented Algorithm** (from HLD Section 3.5):
```
For each party member's turn:
  1. List unlocked skills (from Classes.learnings where level ≤ member.level)
  2. Filter skills: Remove if HP < skill.hpCost OR MP < skill.mpCost
  3. For remaining skills, calculate expected damage per action
  4. Select skill with highest expected damage
  5. Execute via Game_Action.apply()
```

**Documented Expected Damage Formula** (from Research):
```javascript
// Expected damage considering probabilities
expectedDamage = (baseDamage * (1 - critRate - missRate)) +
                 (critDamage * critRate) +
                 (0 * missRate)

// Then divide by actions required (for multi-hit skills)
damagePerAction = expectedDamage / actionsRequired
```

### Impact Analysis
- **Status**: Planning phase - no implementation yet
- **Scope**: Affects entire SIMULATION module
- **Dependencies**:
  - RUNTIME module must provide initialized Game_Actor and Game_Action objects
  - LOADER module must provide Skills.json and Classes.json data
  - Expected damage calculation requires access to skill formulas, variance, critical rates
- **Cross-module impact**:
  - REPORTER module will log which skills were chosen (transparency requirement)
  - CONFIG module defines party composition which determines available skill pools
  - Future UI module may need to replay/visualize skill choices

### Alternatives (if observable)

**From Documentation Analysis**:

1. **Random Skill Selection**
   - Mentioned implicitly as rejected approach
   - Would not provide consistent TTK measurements
   - Unsuitable for deterministic validation (core requirement)

2. **Round-Robin Skill Rotation**
   - Not explicitly mentioned in docs
   - Would be simpler but unrealistic
   - Doesn't account for situational effectiveness

3. **Utility-Based AI** (mentioned as future consideration)
   - Would consider healing, buffing, debuffing utilities
   - Rejected for MVP due to complexity
   - May be needed for advanced team compositions post-MVP

4. **Player Behavior Simulation** (mentioned as limitation)
   - Would try to mimic non-optimal player decisions
   - Rejected because goal is to validate POTENTIAL of balance, not average player performance
   - TTK measurements aim for "optimal play" baseline

**Explicit Trade-off Statement** (from HLD):
> "Algoritmo de escolha de skill por melhor dano esperado por ação (filtro HP/MP apenas no MVP v1)"

This shows conscious decision to prioritize damage over other considerations (utility, resource conservation, defensive actions).

## Questions to Address in ADR (if created)

- What problem was being solved?
  - Need for deterministic, reproducible skill selection across all battle simulations
  - Validation requires consistent baseline for comparing TTK across balance changes

- Why was damage-per-action maximization chosen?
  - Represents optimal player behavior (best-case scenario for balance validation)
  - Deterministic and mathematically well-defined
  - Aligns with goal of measuring TTK under ideal conditions
  - Simpler than full AI implementation while still being meaningful

- What alternatives were considered?
  - Random selection (rejected - non-deterministic)
  - Round-robin (rejected - unrealistic)
  - Utility-based AI (deferred to post-MVP - too complex)
  - Player behavior simulation (rejected - not goal of validation)

- What are long-term consequences?
  - All TTK measurements assume optimal skill usage
  - Changing algorithm invalidates historical baseline
  - May need versioning of simulation algorithm for long-term tracking
  - Extension points needed for alternative strategies (defensive, resource-conserving, build-specific)

- How does this integrate with VisuStella plugins?
  - Expected damage calculation must account for VisuStella formula modifications
  - Critical rate caps, damage scaling, elemental rates from plugins affect calculation
  - Requires reverse-engineering VisuStella Battle Core parameters (see Research doc Section 2.2)

- What are the testing implications?
  - Unit tests must validate expected damage calculation accuracy
  - Integration tests must verify skill choices match documented algorithm
  - Regression tests needed when VisuStella plugins update

## Related Potential ADRs
- Seed-Controlled Determinism for RNG (if identified separately)
- Integration with RPG Maker MZ Game_Action API (if identified)

## Additional Notes

**Observation**: The documented algorithm is remarkably well-defined for a planning-phase project. The research document includes 35KB of technical analysis with academic-level rigor, including mathematical proofs and citations.

**Critical Design Insight**: The choice of "damage per action" (not "damage per turn") is significant. This accounts for multi-hit skills and action economy, which is more sophisticated than simple damage comparison.

**VisuStella Complexity**: The research document explicitly warns about VisuStella plugins as "black box" (Section 2, page 76-101). The expected damage calculation will need to reverse-engineer VisuStella's damage modification pipeline, which is documented in detail but requires behavioral testing rather than code inspection due to obfuscation.

**Risk Noted**: HLD Section 10.1 identifies "Simulação divergente do jogo real" as medium-probability risk. The skill selection algorithm is a key factor - if the algorithm doesn't accurately reflect how damage is calculated in the actual game engine, TTK measurements will be unreliable.

**Future Consideration**: Documentation mentions future support for explicit skill lists (when skills are purchased in shops rather than learned by level). This will require extending the algorithm to work with arbitrary skill sets, not just level-based unlocks.
