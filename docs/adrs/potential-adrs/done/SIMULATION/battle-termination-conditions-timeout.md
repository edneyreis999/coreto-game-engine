# Potential ADR: Battle Termination Conditions with Timeout Safety

**Module**: SIMULATION
**Category**: Architecture/Performance
**Priority**: Must Document (Score: 130)
**Date Identified**: 2026-01-04

---

## What Was Identified

The SIMULATION module must define **explicit termination conditions** for battle loops to prevent infinite loops and ensure performance targets are met. The documented approach includes three termination conditions: victory (all enemies defeated), defeat (all party members defeated), and **timeout** (maximum turn/time limit exceeded).

This is documented in:
- PRD FR-007: "Batalha que não termina em um limite máximo, registrar como erro e seguir para próxima"
- HLD Section 3.5: "Executar loop de turnos até vitória/derrota/timeout"
- Performance requirement: "< 3 segundos por batalha" (assuming ~200 battles total for 10-minute target)

The timeout mechanism is critical for robustness - without it, edge cases (immortal enemy due to bug, infinite state loop, rounding errors preventing death) could hang the entire validation run, wasting hours of designer time.

## Why This Might Deserve an ADR

- **Impact**:
  - Affects reliability of ENTIRE validation pipeline (one hanging battle blocks all subsequent trechos)
  - Determines what gets reported as "warning" vs "error" vs "crash"
  - Performance target (10 minutes for all trechos) depends on timeout preventing runaway battles
- **Trade-offs**:
  - **Safety vs. Accuracy**: Timeout prevents hangs, but may abort legitimate long battles (e.g., high-defense enemy)
  - **Fixed vs. Adaptive**: Fixed turn limit is simple; adaptive timeout (based on TTK target) is smarter but more complex
  - **Silent vs. Loud**: Should timeout be warning (continue) or error (abort entire run)?
- **Complexity**:
  - Must handle three different termination conditions in battle loop
  - Timeout value must be configurable (different for regular battles vs. bosses)
  - Must distinguish timeout (logic issue) from defeat (balance issue)
  - Edge case: What if party has infinite healing loop?
- **Team Knowledge**: Designers must understand why some battles show "timeout" instead of TTK
- **Future Implications**:
  - Boss battles excluded from MVP may need higher timeout
  - Adaptive timeout (e.g., 3× TTK target) requires TTK target to be known at simulation time
  - Timeout logging reveals balance bugs (endless battles indicate design issues)

## Evidence Found in Codebase

### Key Files
**Note**: This is a planning-phase project - no implementation exists yet. Evidence is from documentation.

- [`/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 226-245
  - FR-007: "Batalha que não termina em um limite máximo, registrar como erro e seguir para próxima (hipótese)"
  - Specifies timeout as recoverable error (log and continue, don't crash)

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 248-260
  - Section 4.1 flow: "Loop de turnos até vitória/derrota/timeout"
  - Lists timeout as third termination condition alongside victory/defeat

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 564-569
  - Performance targets: "< 3 segundos por batalha (assumindo ~200 batalhas total)"
  - Implies timeout must be generous enough to allow valid battles but strict enough to prevent runaway

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 176-183
  - Reporter Layer: Warning types include "battle_timeout"
  - Timeout generates warning, not error (doesn't abort run)

### Code Evidence

**Documented Battle Loop** (from HLD Section 6.1):
```
6. Simulation Layer (loop por trecho)
   Para cada trecho:
     Para cada troopId no trecho:
       - Configura party
       - Configura troop
       - Inicializa batalha (BattleManager.setup)
       - Loop de turnos até vitória/derrota/timeout:  ← THREE CONDITIONS
           - Escolhe skill
           - Executa ação
           - Registra turno, ação, dano
       - Calcula TTK em turnos e ações
       - Compara com alvo e tolerância do trecho
```

**Documented Warning Types** (from HLD Section 3.6):
```javascript
"warningsByType": {
  "ttk_out_of_tolerance": 2,
  "troop_not_found": 1,
  "battle_timeout": X  // IMPLIED - timeout is a warning type
}
```

**Expected Implementation Pattern**:
```javascript
// Pseudocode - no actual implementation yet
function simulateBattle(troop, party, maxTurns = 100) {
  let turn = 0;

  while (true) {
    // Termination condition 1: Victory
    if (allEnemiesDead()) {
      return { outcome: 'victory', ttk: turn };
    }

    // Termination condition 2: Defeat
    if (allPartyMembersDead()) {
      return { outcome: 'defeat', ttk: null };
    }

    // Termination condition 3: Timeout
    if (turn >= maxTurns) {
      return {
        outcome: 'timeout',
        ttk: null,
        warning: 'battle_timeout'
      };
    }

    // Execute turn
    executeTurn();
    turn++;
  }
}
```

### Impact Analysis
- **Status**: Planning phase - no implementation yet
- **Scope**:
  - Core to SIMULATION module (affects every battle)
  - REPORTER module must handle timeout warnings
  - CONFIG module may define timeout limits per trecho
- **Performance implications**:
  - Without timeout: One hanging battle blocks entire run (hours wasted)
  - With timeout: Total runtime bounded (worst case = num_battles × timeout)
  - 10-minute target: ~200 battles × 3 seconds = 600 seconds ≈ 10 minutes
  - Timeout should be ~3× expected TTK to catch hangs without false positives
- **Cross-module dependencies**:
  - CONFIG: May define `battleTimeout` per trecho or globally
  - REPORTER: Must log timeout warnings with context (which troop, which turn)
  - CLI: May support `--timeout` override for debugging

### Alternatives (if observable)

**From Documentation Analysis**:

1. **No Timeout (Victory/Defeat Only)**
   - Implicitly rejected in PRD FR-007
   - Risk: Infinite loops hang entire validation run
   - Unsuitable for unattended CI execution
   - Debugging nightmare (which battle hung?)

2. **Fixed Global Timeout (e.g., 100 turns for all battles)**
   - Simple to implement
   - May be too short for legitimate high-defense battles
   - May be too long for detecting obvious bugs (1 turn should win)
   - Documentation doesn't specify exact value, suggesting it's configurable

3. **Adaptive Timeout (3× TTK Target)**
   - Smarter: Boss with TTK target 10 gets timeout 30, regular battle with TTK 3 gets timeout 9
   - More complex: Requires passing TTK target to simulation layer
   - Not explicitly documented, but implied by trecho-specific TTK targets
   - Future consideration

4. **Time-Based Timeout (wall-clock seconds)**
   - Alternative to turn-based timeout
   - Mentioned in performance target ("< 3 segundos por batalha")
   - Problem: Turn execution time varies (simple attack vs. complex skill formula)
   - Turn-based is more deterministic and reproducible

5. **Abort Entire Run on First Timeout**
   - Stricter approach: timeout = fatal error
   - Rejected in PRD FR-007: "registrar como erro e seguir para próxima"
   - MVP approach: Log warning, continue to next battle
   - Reason: Partial validation better than no validation

**Trade-off Decision** (from PRD FR-007):
> "Batalha que não termina em um limite máximo, registrar como erro e seguir para próxima (hipótese)"

Decision: Timeout is recoverable error (warning), not fatal crash.

## Questions to Address in ADR (if created)

- What problem was being solved?
  - Prevent infinite loops from hanging entire validation pipeline
  - Ensure performance target (10 minutes) is achievable
  - Detect balance bugs that cause endless battles (immortal enemies, heal loops)

- Why were three termination conditions chosen (victory/defeat/timeout)?
  - Victory: Expected outcome for balanced encounters
  - Defeat: Indicates party too weak or enemy too strong (balance issue)
  - Timeout: Indicates logic bug or extreme edge case (design or implementation issue)

- What alternatives were considered?
  - No timeout (rejected - risk of hangs)
  - Abort on timeout (rejected - partial validation better than none)
  - Time-based timeout (deferred - turn-based more reproducible)
  - Adaptive timeout (future - requires passing TTK target to simulation)

- What are long-term consequences?
  - Timeout value must be documented in reports (affects reproducibility)
  - Changing timeout value can change which battles pass/fail
  - Boss battles (post-MVP) will need higher timeout limits
  - Statistical analysis requires distinguishing timeout from legitimate defeat
  - CI alerts should trigger on increasing timeout rate (regression in balance)

- What is the recommended timeout value?
  - Documentation suggests ~100 turns as reasonable upper bound
  - Should be 3-5× expected TTK to avoid false positives
  - Should be configurable per trecho (bosses need higher limit)
  - Should be overridable via CLI for debugging (`--timeout 1000`)

- How should timeout be logged?
  - As warning in report.json: `{ type: 'battle_timeout', troopId: X, turn: Y }`
  - Should include party/troop state at timeout for debugging
  - Should log which character was acting when timeout occurred
  - Should suggest increasing timeout OR investigating infinite loop

## Related Potential ADRs
- TTK Measurement Units (turns vs actions) - timeout is turn-based
- Battle Simulation Performance Optimization - timeout enables performance guarantees
- Warning vs Error Classification - timeout is warning, not error

## Additional Notes

**Performance Math**:
- Target: 10 minutes for all trechos (excluding bosses)
- Estimated battles: ~200 (assumption in HLD performance section)
- Allowed time per battle: 600 seconds / 200 battles = 3 seconds
- If timeout = 100 turns, each turn must execute in < 30ms
- This is achievable in headless mode (no rendering overhead)

**Timeout as Bug Detector**:
Timeout warnings reveal valuable information:
- **Early timeout (turn 2-3)**: Party likely invalid (no skills, zero damage)
- **Mid timeout (turn 20-30)**: Balance issue (damage too low vs. enemy HP)
- **Late timeout (turn 90-100)**: Edge case (heal loop, rounding error preventing death)

Logging turn count at timeout helps diagnose root cause.

**Boss Battle Consideration** (from HLD - bosses excluded from MVP):
When bosses are added, they may legitimately take 15-20 turns. Timeout must be configurable:
```json
{
  "trechoId": "ato1-boss-final",
  "battleTimeout": 200,  // Boss-specific override
  "ttkTarget": { "turns": 15 }
}
```

**VisuStella State Effects**:
VisuStella plugins support complex state effects (regeneration, retaliation, automatic resurrection). These can create edge cases where battle never ends:
- Regeneration >= damage taken
- Automatic resurrection on death
- Invulnerability states with infinite duration

Timeout is the safety net for these scenarios. ADR should mention VisuStella as motivation.

**Determinism Note**:
Timeout interacts with seed-controlled RNG:
- With fixed seed, same battle either always times out or never times out (deterministic)
- Monte Carlo runs may show timeout probability (e.g., "5% of seeds timeout")
- This helps distinguish "always hangs" (logic bug) from "rarely hangs" (extreme RNG edge case)

**CI Failure Threshold**:
Documentation doesn't specify, but future consideration:
- Should CI fail if >5% of battles timeout?
- Should timeout be treated as "fail" for TTK validation purposes?
- MVP approach: Log as warning, human reviews report

**Future Enhancement - Early Exit**:
If party damage is zero for 10 consecutive turns, exit early (don't wait for full timeout). This detects "party has no damage source" bugs faster. Not in MVP scope, but worth noting as future optimization.
