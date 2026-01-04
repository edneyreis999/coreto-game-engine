# Potential ADR: TTK Measurement with Dual Metrics (Turns and Actions)

**Module**: SIMULATION
**Category**: Architecture
**Priority**: Must Document (Score: 135)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- **ADR-004**: Considerar Apenas HP e MP na Escolha de Skills (MVP v1) (SIMULATION, 2026-01-04)

**Timeline Context**:
- ADR-004 focuses on skill selection (which skills are chosen)
- This ADR focuses on measuring the outcome (how we count TTK)
- Both decisions shape how simulation results are interpreted

**When creating formal ADR**: Reference ADR-004 as complementary - skill selection determines actions taken, TTK measurement quantifies the result

---

## What Was Identified

The SIMULATION module must measure **Time-to-Kill (TTK) using TWO distinct metrics**: turns and actions. This dual measurement approach is documented throughout the requirements and architecture:

- **TTK in Turns**: Number of full turn cycles from battle start to enemy defeat
- **TTK in Actions**: Number of individual character actions (attacks/skills) used to defeat enemy

Both metrics are tracked, logged, and compared against configured targets. The documentation specifies that trechos define targets for BOTH metrics (e.g., `"ttkTarget": { "turns": 3, "actions": 4 }`), and the system validates BOTH independently.

This is a fundamental architectural decision because it defines what "balance" means in the context of this system. The choice to track both metrics (rather than just one) reflects a sophisticated understanding of RPG combat pacing.

## Why This Might Deserve an ADR

- **Impact**:
  - Affects ALL TTK measurements - every battle produces two numbers, not one
  - Determines how balance targets are defined (designers must specify both)
  - Shapes report structure (aggregates calculated for both metrics)
  - Affects validation logic (warnings triggered if EITHER metric exceeds tolerance)
- **Trade-offs**:
  - **Richness vs. Complexity**: Dual metrics provide nuanced insights but complicate analysis
  - **Turn vs. Action Economy**: Turn-based TTK measures pacing; action-based TTK measures efficiency
  - **Synchronization Challenge**: In ATB/TPB systems, turns != actions (fast characters act more)
  - **Reporting Clarity**: Two numbers require careful presentation to avoid confusion
- **Complexity**:
  - Must track both counters independently during battle loop
  - Must compare BOTH against targets (turn tolerance, action tolerance)
  - Report aggregates need both dimensions (avg TTK turns, avg TTK actions)
  - Future ATB/TPB support complicates "turn" definition (see Additional Notes)
- **Team Knowledge**: Designers must understand when to optimize for turns vs. actions
- **Future Implications**:
  - Action economy becomes critical in ATB/TPB systems (fast characters = more actions per turn)
  - Skill design must consider action cost (multi-hit skills affect action count)
  - Buffs that grant extra actions (Quick, Haste) affect action count but not turn count
  - Statistical analysis may reveal turns/actions correlation patterns

## Evidence Found in Codebase

### Key Files
**Note**: This is a planning-phase project - no implementation exists yet. Evidence is from documentation.

- [`/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 226-245
  - FR-007: "medir e registrar TTK por troop **em turnos e em ações**"
  - "Comparar `ttkTurns` e `ttkActions` com o alvo do trecho e tolerância configurada"

- [`/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 106-127
  - FR-002: Trechos define `"ttkTarget": { "turns": 3, "actions": 4 }`
  - Separate targets and tolerances for both metrics

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 155-166
  - SIMULATION Layer: "Medir TTK **em turnos e em ações**"
  - Listed as distinct responsibility

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 248-260
  - Battle flow: "Registra turno, ação, dano" - both counters tracked
  - "Calcula TTK **em turnos e ações**"

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 437-451
  - Report structure includes both: `"avgTtkTurns"`, `"p95TtkTurns"`, and implied action equivalents

### Code Evidence

**Documented Config Schema** (from HLD Section 5.1):
```json
{
  "id": "ato1-nivel1-10",
  "name": "Prólogo e Mundo Comum",
  "anchorLevelRange": { "min": 1, "max": 10 },
  "ttkTarget": {
    "turns": 3,     // Target for turn-based TTK
    "actions": 4    // Target for action-based TTK
  },
  "tolerance": {
    "turns": 1,     // ±1 turn acceptable
    "actions": 1    // ±1 action acceptable
  },
  "troopIds": [1, 2, 3]
}
```

**Documented Battle Loop** (from HLD Section 6.1):
```javascript
// Pseudocode from documentation
- Loop de turnos até vitória/derrota/timeout:
    - Escolhe skill (melhor dano esperado, filtra por HP/MP)
    - Executa ação (Game_Action.apply)
    - Registra turno, ação, dano  // ← Tracking both counters
- Calcula TTK em turnos e ações
- Compara com alvo e tolerância do trecho
```

**Expected Measurement Logic**:
```javascript
// Pseudocode - no actual implementation yet
function simulateBattle(troop, party) {
  let turnCount = 0;
  let actionCount = 0;

  while (!battleEnded()) {
    // Full turn cycle: all active characters act
    for (let actor of party.members) {
      if (actor.isAlive()) {
        executeAction(actor);
        actionCount++;  // Increment per action
      }
    }

    // Enemy turn
    for (let enemy of troop.members) {
      if (enemy.isAlive()) {
        executeAction(enemy);
        actionCount++;  // Enemy actions also count
      }
    }

    turnCount++;  // Increment per full turn cycle
  }

  return {
    ttkTurns: turnCount,
    ttkActions: actionCount
  };
}
```

**Note**: Documentation doesn't clarify if enemy actions count toward "actions" metric. This is an implementation detail to be resolved.

**Documented Report Structure** (from HLD Section 3.6):
```json
{
  "trechos": [
    {
      "trechoId": "ato1-nivel1-10",
      "results": [
        {
          "troopId": 1,
          "ttkTurns": 3,        // First metric
          "ttkActions": 4       // Second metric
        }
      ],
      "aggregates": {
        "avgTtkTurns": 3.2,
        "p95TtkTurns": 4,
        "avgTtkActions": 4.5,  // IMPLIED - parallel structure
        "p95TtkActions": 6     // IMPLIED
      }
    }
  ]
}
```

### Impact Analysis
- **Status**: Planning phase - no implementation yet
- **Scope**:
  - Core SIMULATION module (tracking logic)
  - CONFIG module (dual targets validation)
  - REPORTER module (dual aggregates calculation)
- **Cross-module dependencies**:
  - CONFIG: Must validate `ttkTarget.turns` AND `ttkTarget.actions` both present
  - REPORTER: Must calculate aggregates (avg, p50, p95) for BOTH metrics
  - CLI: Output must display both metrics clearly ("TTK: 3 turns / 4 actions")
- **Data volume**: Doubles TTK data in reports (not significant - still small JSON)
- **Performance**: Negligible - incrementing two counters vs. one

### Alternatives (if observable)

**From Documentation Analysis**:

1. **Turns Only (No Action Tracking)**
   - Simpler: Single metric, single target, single validation
   - Rejected because:
     - Loses action economy information (critical for ATB/TPB systems)
     - Can't distinguish 3-turn battle with 3 actions vs. 3 turns with 12 actions
     - Multi-hit skills and extra-action buffs become invisible
   - Traditional turn-based RPG approach, but insufficient for modern mechanics

2. **Actions Only (No Turn Tracking)**
   - Could work if battles are purely action-based
   - Rejected because:
     - Loses pacing information (3 actions in 1 turn feels different than 3 actions in 3 turns)
     - Turn-based design thinking requires turn counts
     - ATB "turn" concept still matters for cooldowns, buffs, DoT ticks
   - Doesn't match design vocabulary (designers think in "3-turn battles")

3. **Single Unified Metric (Weighted Composite)**
   - Example: `TTK_Score = (turns * 0.6) + (actions * 0.4)`
   - Could simplify to one number
   - Rejected (implicitly - not mentioned in docs) because:
     - Obscures underlying data
     - Arbitrary weighting hard to justify
     - Loses ability to optimize for specific dimension
   - May be useful for DISPLAY (leaderboard, summary) but not PRIMARY measurement

4. **Time-Based TTK (Seconds/Frames)**
   - Measures wall-clock time or frame count
   - Mentioned in research doc for ATB context
   - Not used in MVP because:
     - Frame rate varies (headless vs. actual game)
     - Animation durations are cosmetic in MVP (no visual simulation)
     - Turn/action metrics more stable and reproducible
   - Future consideration for ATB/TPB systems

**Why Dual Metrics Make Sense**:

From game design perspective:
- **Turns** measure **pacing**: "This feels like a 3-turn battle"
- **Actions** measure **efficiency**: "We used 4 actions to win"

Example where they diverge:
- **4-person party, 3-turn battle**: If all 4 characters attack each turn, that's 12 actions
- **2-person party, 3-turn battle**: Only 6 actions for same turn count
- Party size affects action count but not turn count

**Documented Design Table** (from Research Doc, Anchor-Based Design):
```
| Âncora (Level) | HP Jogador | TTK Alvo (Turnos) | Ações p/ Matar Inimigo |
| :------------- | :--------- | :---------------- | :--------------------- |
| Early (L=1)    | 100        | 3                 | 3                      |
| Mid (L=25)     | 2500       | 4                 | 5                      |
| End (L=50)     | 9999       | 6                 | 8                      |
```

This table shows BOTH metrics used in anchor definitions. The research explicitly calculates both dimensions.

## Questions to Address in ADR (if created)

- What problem was being solved?
  - Need to measure both pacing (turns) and efficiency (actions)
  - Single metric insufficient for nuanced balance validation
  - Turn count matters for player experience pacing
  - Action count matters for resource expenditure and damage output

- Why were both turns AND actions chosen (not just one)?
  - Turns: Reflects player experience pacing ("this battle took 3 turns")
  - Actions: Reflects mechanical efficiency ("we needed 4 attacks to win")
  - Both dimensions provide complementary insights
  - Designers think in both vocabularies (design discussion uses both)

- What alternatives were considered?
  - Turns only (rejected - loses action economy data)
  - Actions only (rejected - loses pacing information)
  - Unified composite metric (rejected - obscures underlying data)
  - Time-based (deferred - not suitable for headless MVP)

- What are long-term consequences?
  - All balance targets must specify BOTH metrics (design overhead)
  - Reports double in size (trivial - still small JSON)
  - ATB/TPB systems require careful "turn" definition (see Additional Notes)
  - Statistical analysis can find patterns (turn/action ratio by level, by party size)
  - Visualization needs dual-axis charts (turns on X, actions on Y)

- How are turns and actions counted?
  - **Turn**: Full cycle where all active combatants (party + enemies) have acted
  - **Action**: Single skill/attack execution by one character
  - **Question**: Do enemy actions count toward action total? (Not specified in docs)
  - **Question**: Do failed/missed actions count? (Likely yes - intent to act counts)
  - **Question**: Do multi-hit skills count as 1 action or N? (Likely 1 - single action execution)

- What is tolerance validation logic?
  - **Conjunctive (AND)**: Battle passes ONLY IF both metrics within tolerance?
  - **Disjunctive (OR)**: Battle passes IF either metric within tolerance?
  - **Documentation implies AND**: "Comparar `ttkTurns` e `ttkActions`" suggests both checked
  - This needs explicit decision in formal ADR

- How do aggregates work with dual metrics?
  - Calculate SEPARATELY: avg turns, p95 turns, avg actions, p95 actions
  - OR calculate joint distribution: p95 of (turns + actions)?
  - Documentation structure implies separate aggregates

## Related Potential ADRs
- Battle Termination Conditions - turn counter drives timeout
- Skill Selection Strategy - affects action efficiency
- ATB/TPB Mode Support (future) - redefines "turn" concept

## Additional Notes

**Critical Design Insight - Why Dual Metrics**:

The research document (Section 1.3, Anchor Table) uses BOTH metrics in balance design:
- "TTK Alvo (Turnos)": Target in turns
- "Ações p/ Matar Inimigo": Actions to kill

This reveals the design process ALREADY uses both dimensions. The system is capturing how designers think, not imposing a new framework.

**ATB/TPB Complexity** (Future Consideration):

RPG Maker MZ supports Active Time Battle (ATB) and Time Progress Battle (TPB) modes via VisuStella plugins. In these systems, "turn" becomes ambiguous:
- **Traditional Turn-Based**: Turn = full cycle (all characters act once)
- **ATB**: Fast characters may act 2-3 times before slow characters act once
- **TPB**: Characters act independently; "turn" concept breaks down

For MVP (traditional turn-based only), this is simple. Future ATB support will require:
- Redefining "turn" as "elapsed time units" or "ATB bar cycles"
- Action count becomes PRIMARY metric
- Research doc mentions this (Section 2.4): "duração da animação afeta o DPS... em sistemas ATB"

**Enemy Actions Ambiguity**:

Documentation doesn't explicitly state if enemy actions count toward "actions" metric.

**Hypothesis 1: Party Actions Only**
- TTK actions = number of party member actions to defeat enemies
- Makes sense from player perspective ("we needed 4 attacks")
- Simpler to interpret

**Hypothesis 2: Total Actions (Party + Enemy)**
- TTK actions = all actions in battle (party + enemy)
- More comprehensive, captures battle length
- Harder to interpret (enemy action count varies)

**Recommendation**: Hypothesis 1 (party actions only) makes more sense for "Time to Kill" semantics. Formal ADR should clarify this.

**Multi-Hit Skills**:

If a skill hits 3 times (e.g., "Triple Slash"), does it count as:
- 1 action (single skill execution)
- 3 actions (3 hits delivered)

**Recommendation**: 1 action. Actions should count EXECUTIONS, not HITS. Otherwise, multi-hit skill balance becomes confusing.

**Validation Logic Example**:

```javascript
// Pseudocode - tolerance validation
function validateTTK(measured, target, tolerance) {
  const turnsOK = Math.abs(measured.turns - target.turns) <= tolerance.turns;
  const actionsOK = Math.abs(measured.actions - target.actions) <= tolerance.actions;

  // Conjunctive (AND) - both must pass
  if (!turnsOK || !actionsOK) {
    generateWarning('ttk_out_of_tolerance', {
      measured: measured,
      target: target,
      turnsDelta: measured.turns - target.turns,
      actionsDelta: measured.actions - target.actions
    });
  }
}
```

**Reporting Example**:

```
Trecho: ato1-nivel1-10
Target: 3 turns ±1, 4 actions ±1

Troop 1: ✓ 3 turns / 4 actions (within tolerance)
Troop 2: ⚠ 5 turns / 6 actions (turns exceeded, actions exceeded)
Troop 3: ⚠ 3 turns / 6 actions (turns OK, actions exceeded)

Aggregates:
  Avg: 3.7 turns / 5.3 actions
  P95: 5 turns / 6 actions
```

Clear presentation of dual metrics is critical for usability.

**Future Statistical Analysis**:

Dual metrics enable interesting questions:
- Does turn/action ratio correlate with party size? (Yes - more members = more actions per turn)
- Does ratio change by level? (May indicate skill unlock patterns)
- Which metric is more stable across seeds? (Less variance = better predictor)
- Is there a "sweet spot" ratio? (e.g., 1.5 actions per turn)

**VisuStella Plugins Impact**:

VisuStella Battle Core supports:
- **Extra actions**: Skills that grant immediate extra turn (increases action count, not turn count)
- **Multi-hit skills**: Single action with multiple damage instances
- **Counter/retaliation**: Free actions outside normal turn order

These mechanics make action counting complex. ADR should acknowledge this and note that "action" definition may need refinement based on plugin behavior.

**Implicit Decision - Why Not Damage?**:

Could measure "Damage to Kill" instead of actions/turns. Not chosen because:
- Damage is INTERMEDIATE metric (means to an end)
- Turns/actions are OUTCOME metrics (what player experiences)
- Damage varies wildly with variance/crits (less stable)
- TTK semantics naturally express as time units (turns/actions), not damage units

This is implicitly rejected by design vocabulary (documentation always uses TTK, never DTK).
