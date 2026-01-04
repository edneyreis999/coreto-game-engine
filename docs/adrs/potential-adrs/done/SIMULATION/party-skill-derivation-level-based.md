# Potential ADR: Party Skill Derivation from Level-Based Learnings (MVP v1)

**Module**: SIMULATION
**Category**: Architecture
**Priority**: Consider (Score: 90)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- **ADR-002**: Progressão de Skills - Automática vs. Manual (SIMULATION, 2026-01-04)

**Timeline Context**:
- ADR-002 establishes the high-level decision (automatic skill progression in MVP)
- This potential ADR focuses on the IMPLEMENTATION detail (how skills are derived)

**Recommended Actions**:
- Review ADR-002 before proceeding
- Determine if this is:
  - Implementation detail of ADR-002 (DO NOT CREATE separate ADR - consolidate)
  - Distinct aspect requiring separate documentation (proceed with caution)

**Likely Recommendation**: This appears to be an implementation detail of ADR-002 and should NOT become a separate ADR. The algorithm for deriving skills from `Classes.learnings` is a consequence of the decision to use automatic progression.

---

## What Was Identified

The SIMULATION module must derive which skills are available to each party member based on their class and level. The MVP v1 approach uses **automatic derivation from `Classes.learnings`**: for each party member, skills are unlocked if `learnings[].level <= member.level`.

This is documented in:
- PRD FR-004: "Sistema usa a lista de `learnings` da classe para coletar as `skillIds` cujo level requerido seja menor ou igual ao nível informado"
- HLD Section 3.5: "Montar party com base em PartyConfig (classId + level → derivar skills liberadas)"
- ADR-002: Establishes automatic vs. manual choice for MVP

The algorithm is straightforward: iterate `Classes.json → learnings` array, filter by level, collect skill IDs. However, this becomes an architectural decision when considering the future state (explicit skill lists for shop-purchased skills) and its impact on validation reproducibility.

## Why This Might Deserve an ADR

**CAUTION**: This may be too granular - likely an implementation detail of ADR-002.

- **Impact**:
  - Determines which skills are available in every battle simulation
  - Affects TTK measurements (different skills = different damage patterns)
  - Shapes config schema (MVP v1 party = classId + level, no explicit skills)
- **Trade-offs**:
  - **Simplicity vs. Flexibility**: Automatic derivation simple, but can't test alternate builds
  - **Fidelity vs. Coverage**: Represents "standard progression" but misses shop-purchased skills
  - **MVP Scope**: Defers explicit skill lists to post-MVP (reduces initial complexity)
- **Complexity**:
  - Algorithm is simple (filter array by level)
  - Edge case: Empty skill list if level < first learning (warning needed)
  - Future: Must support BOTH derivation modes (automatic + explicit)
- **Team Knowledge**: Designers must understand skill availability is level-dependent in MVP
- **Future Implications**:
  - Shop-purchased skills require explicit skill lists (schema change)
  - Hybrid approach needed: "derive base skills + add purchased skills"
  - Config versioning when schema changes

## Evidence Found in Codebase

### Key Files
**Note**: This is a planning-phase project - no implementation exists yet. Evidence is from documentation.

- [`/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 153-176
  - FR-004: Explicit algorithm description
  - "Sistema usa a lista de `learnings` da classe para coletar as `skillIds`"

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 344-376
  - PartyConfig schema: MVP v1 uses `{ classId, level }` only
  - Future version includes optional `skillIds` array

- [`/Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-002-progressao-skills-automatica-vs-manual.md`](/Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-002-progressao-skills-automatica-vs-manual.md)
  - High-level decision: Automatic for MVP, manual in future
  - Does not specify implementation algorithm

### Code Evidence

**Documented Config Schema - MVP v1** (from HLD Section 5.1):
```json
{
  "members": [
    { "classId": 1, "level": 5 },  // No skillIds - derived automatically
    { "classId": 2, "level": 5 }
  ]
}
```

**Documented Config Schema - Future** (from HLD Section 5.1):
```json
{
  "members": [
    {
      "classId": 1,
      "level": 5,
      "skillIds": [1, 99, 75, 103]  // Explicit list overrides derivation
    }
  ]
}
```

**Documented Derivation Logic** (from PRD FR-004):
```
1. Usuário informa a party no formato `classId level, classId level, ...`
2. Sistema valida se cada `classId` existe em `Classes.json`
3. Sistema usa a lista de `learnings` da classe para coletar as `skillIds`
   cujo level requerido seja menor ou igual ao nível informado
4. Sistema monta a party de simulação com classes, níveis e lista de skills liberadas
```

**Expected Implementation**:
```javascript
// Pseudocode - no actual implementation yet
function deriveSkills(classId, level, dataClasses) {
  const classData = dataClasses[classId];
  if (!classData) {
    throw new Error(`ClassId ${classId} not found`);
  }

  const learnedSkills = classData.learnings
    .filter(learning => learning.level <= level)
    .map(learning => learning.skillId);

  if (learnedSkills.length === 0) {
    console.warn(`No skills learned for class ${classId} at level ${level}`);
  }

  return learnedSkills;
}
```

**Classes.json Structure** (from HLD Section 5.2):
```json
{
  "id": 1,
  "name": "Espadachim",
  "learnings": [
    { "level": 1, "skillId": 99, "note": "" },  // Available at level 1+
    { "level": 3, "skillId": 75, "note": "" },  // Available at level 3+
    { "level": 10, "skillId": 103, "note": "" } // Available at level 10+
  ]
}
```

For `{ classId: 1, level: 5 }`:
- Derived skills: [99, 75] (learnings at level ≤ 5)
- Skill 103 not available (requires level 10)

### Impact Analysis
- **Status**: Planning phase - no implementation yet
- **Scope**:
  - Core SIMULATION module (party initialization)
  - CONFIG module (schema validation)
  - LOADER module (provides Classes.json data)
- **Cross-module dependencies**:
  - LOADER must load Classes.json before SIMULATION runs
  - CONFIG must validate classId existence
  - Future schema change affects CONFIG validation logic
- **Performance**: Trivial (one-time filtering per battle setup)

### Alternatives (if observable)

**From Documentation Analysis**:

1. **Explicit Skill Lists from Start**
   - Party config includes `skillIds` array in MVP
   - Rejected per ADR-002 for MVP simplicity
   - Deferred to post-MVP for shop-purchased skills support

2. **All Skills Always Available**
   - Ignore level restriction, give class all possible skills
   - Rejected: Unrealistic (level 1 character shouldn't have ultimate skills)
   - Doesn't represent actual game progression

3. **Fixed Skill Set per Class (No Progression)**
   - Each class has one static skill list, no level dependency
   - Rejected: Doesn't capture progression mechanics
   - RPG Maker MZ learnings system exists for a reason

4. **Hybrid: Derived Base + Explicit Additions**
   - Start with derived skills, allow config to add extras
   - Mentioned as future approach in HLD Section 5.1
   - Post-MVP: `skillIds` supplements derived skills

**Decision Context** (from ADR-002):
> "MVP v1: Derivar skills de Classes.learnings por nível. Futuro: Permitir skillIds explícitas para validar builds com skills compradas."

This is implementation of that decision.

## Questions to Address in ADR (if created)

**WARNING**: This section may be redundant with ADR-002. Consider consolidation.

- What problem was being solved?
  - Need to determine skill availability for battle simulation
  - Must represent realistic progression (skills unlock by level)
  - Must work with RPG Maker MZ's existing learnings system

- Why was automatic derivation chosen for MVP?
  - Simplicity: No manual skill list management
  - Fidelity: Matches how RPG Maker MZ progression works
  - Sufficient for standard progression validation

- What alternatives were considered?
  - Explicit skill lists (deferred to post-MVP)
  - All skills available (rejected - unrealistic)
  - Fixed per-class sets (rejected - no progression)

- What are long-term consequences?
  - Schema change when explicit skills added (config version bump)
  - Validation logic must support BOTH modes (derived + explicit)
  - Historical reports may become invalid if schema changes

- What edge cases exist?
  - Level 1 character may have 0 skills (if first learning at level 2)
  - Class with no learnings defined (warning needed)
  - Skill ID in learnings doesn't exist in Skills.json (validation needed)

## Related Potential ADRs
- ADR-002 (existing): High-level decision on automatic vs. manual progression
- Skill Selection Strategy: Uses derived skill list as input

## Additional Notes

**Strong Recommendation: DO NOT CREATE SEPARATE ADR**

This appears to be an **implementation detail** of ADR-002, not a separate architectural decision. ADR-002 already documents:
- The decision to use automatic progression in MVP
- The rationale (simplicity)
- The future state (explicit skills)

Adding this as a separate ADR would create redundancy and confusion. Instead:
- If more implementation detail is needed, **extend ADR-002** with an "Implementation" section
- This potential ADR document can serve as reference material for ADR-002 extension
- The algorithm (`filter learnings by level`) is straightforward and doesn't need architectural justification

**Consolidation Opportunity**:

If proceeding to Phase 3 (ADR generation), recommend:
- **Skip** creating formal ADR from this potential ADR
- **Update** ADR-002 to include implementation details from this document
- Mark this potential ADR as "Consolidated into ADR-002"

**When IS This an ADR-Worthy Decision?**

It becomes architecturally significant if:
- Multiple derivation strategies exist (weighted randomness, prerequisite chains)
- Performance becomes concern (learnings array is huge)
- Caching strategy needed (derive once vs. every battle)
- Conflict resolution needed (explicit skills vs. derived skills)

For simple "filter array by level", it's just implementation.

**Future Schema Evolution**:

When explicit skills are added, the logic becomes:

```javascript
function getAvailableSkills(member, dataClasses) {
  if (member.skillIds) {
    // Explicit mode - use provided list
    return member.skillIds;
  } else {
    // Derived mode - use learnings
    return deriveSkills(member.classId, member.level, dataClasses);
  }
}
```

This hybrid approach is straightforward and doesn't require separate ADR.

**Edge Case - Empty Skills**:

Documentation mentions (PRD FR-004):
> "Lista vazia de skills liberadas para um membro, gerar warning e ainda executar (hipótese)"

This is correct approach:
- Warning: Alert designer to potential config issue
- Continue: Allow simulation to proceed (may be intentional, e.g., testing base stats only)
- Log: Which character has no skills (for debugging)

**Testing Implication**:

Unit test should verify:
```javascript
describe('deriveSkills', () => {
  test('filters learnings by level', () => {
    const skills = deriveSkills(1, 5, mockClasses);
    expect(skills).toEqual([99, 75]); // Not 103 (level 10)
  });

  test('returns empty array if no learnings', () => {
    const skills = deriveSkills(99, 1, mockClasses);
    expect(skills).toEqual([]);
  });

  test('warns on empty skill list', () => {
    const warnSpy = jest.spyOn(console, 'warn');
    deriveSkills(1, 0, mockClasses);
    expect(warnSpy).toHaveBeenCalled();
  });
});
```

Simple logic, simple tests. Not architecturally complex.
