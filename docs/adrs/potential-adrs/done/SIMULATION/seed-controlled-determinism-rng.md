# Potential ADR: Seed-Controlled Determinism for Battle Simulation RNG

**Module**: SIMULATION
**Category**: Architecture
**Priority**: Must Document (Score: 150)
**Date Identified**: 2026-01-04

---

## What Was Identified

The SIMULATION module must implement **seed-controlled determinism** for all random number generation during battle simulations. This means the system must override `Math.random()` to use a seeded pseudorandom number generator (PRNG), ensuring that identical seed values produce identical battle outcomes across all executions.

This is documented as a core requirement in multiple places:
- PRD FR-001: "seed padrão para determinismo"
- HLD Section 3.2: "Aplicar seed para determinismo (controlar `Math.random`)"
- Research document Section 1.4: "Determinismo em Ambientes Estocásticos"

RPG battles are inherently stochastic (critical hits, variance, miss chances). Without seed control, the same party vs. same troop could produce different TTK measurements each run, making validation unreliable and preventing regression detection.

## Why This Might Deserve an ADR

- **Impact**: Affects the ENTIRE validation system - this is the foundation that makes TTK measurements reproducible
- **Trade-offs**:
  - **Determinism vs. Coverage**: Fixed seed provides repeatability but may miss edge cases that random seeds would expose
  - **Simplicity vs. Monte Carlo**: Single seed is simple, but statistical confidence requires multiple seeds (mentioned as future enhancement)
  - **Transparency vs. Obscurity**: Seeded RNG makes results reproducible, but requires seed to be logged in all reports
- **Complexity**:
  - Must intercept/replace global `Math.random()` before engine loads
  - Must ensure seed applies to ALL RNG sources (engine core, plugins, battle logic)
  - Requires implementing or integrating a PRNG library (seedrandom, alea, etc.)
- **Team Knowledge**: Critical for anyone interpreting simulation results or debugging discrepancies
- **Future Implications**:
  - Monte Carlo simulations (100s of battles with different seeds) will build on this foundation
  - CI/CD pipeline depends on determinism to detect balance regressions
  - Seed versioning may be needed if PRNG algorithm changes (breaks historical comparisons)

## Evidence Found in Codebase

### Key Files
**Note**: This is a planning-phase project - no implementation exists yet. Evidence is from documentation.

- [`/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 84-103
  - FR-001 specifies seed in config with CLI override capability
  - "seed padrão para determinismo, com possibilidade de override via CLI"

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md) - Lines 155-166
  - SIMULATION Layer: "Aplicar seed para determinismo (controlar `Math.random`)"
  - Specifies seed control as core responsibility

- [`/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md`](/Users/edney/projects/coreto/game-engine/docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md) - Lines 64-72
  - Section 1.4: "Determinismo em Ambientes Estocásticos"
  - Explains mathematical approach: use expected value for validation, but seed for simulation
  - "Ao validar se um 'Goblin' é derrotado em 3 turnos, o teste automatizado não deve 'rolar dados'. Ele deve usar a média ponderada"
  - Also mentions: "No ambiente de teste Jest, o gerador de números aleatórios (Math.random) deve ser 'mockado'"

### Code Evidence

**Documented Configuration Schema** (from HLD Section 5.1):
```json
{
  "projectPath": "/path/to/rpg-maker-mz/project",
  "seed": 12345,
  "trechos": [...]
}
```

**Documented Flow** (from HLD Section 4.1):
```
2. CLI Layer
   - Parse argumentos
   - Aplica seed override (se fornecido)

3. Config Layer
   - Lê project.config.json
   - Valida projectPath, seed, trechos
```

**Expected Implementation Pattern** (from Research Doc):
```javascript
// Pseudocode from research document
// Before loading engine:
const seedrandom = require('seedrandom');
Math.random = seedrandom(configSeed);

// Or in Jest setup:
global.Math.random = jest.fn(() => 0.5); // Fixed value for unit tests
// OR
global.Math.random = seedrandom(12345); // Seeded for integration tests
```

### Impact Analysis
- **Status**: Planning phase - critical foundation requirement
- **Scope**:
  - Affects SIMULATION module directly
  - Impacts RUNTIME module (must apply seed before engine initialization)
  - REPORTER module must log seed in all reports
  - CLI module must support `--seed` override
- **Cross-module dependencies**:
  - RUNTIME must initialize seed BEFORE loading RPG Maker MZ core scripts
  - CONFIG must validate seed (numeric, positive integer)
  - CLI must parse and pass seed override to config layer
  - REPORTER must include seed in report.json for reproducibility
- **Performance**: Negligible - PRNG overhead is minimal
- **Security**: Low risk - this is a local tool, seed is not security-sensitive

### Alternatives (if observable)

**From Documentation Analysis**:

1. **No Seed Control (Pure Random)**
   - Explicitly rejected in design
   - Would make validation unreliable (different TTK each run)
   - Cannot detect balance regressions in CI
   - Mentioned in research doc as unsuitable for "Fonte da Verdade" approach

2. **Fixed Seed Only (No CLI Override)**
   - Simpler but inflexible
   - Rejected because designers need to:
     - Test specific edge cases with different seeds
     - Run Monte Carlo batches with seed ranges
   - CLI override documented as explicit requirement

3. **Expected Value Calculation Only (No Simulation)**
   - Mentioned in research doc Section 1.4
   - Mathematical approach: calculate E[Damage] instead of rolling dice
   - Rejected for MVP because:
     - Cannot capture complex interactions (buffs, debuffs, state effects)
     - VisuStella plugins have opaque logic that can't be fully modeled
   - Noted as complement to simulation, not replacement

4. **Monte Carlo from Start (Multiple Seeds)**
   - Mentioned as future enhancement in research doc
   - Run 100s of battles with different seeds, report statistical distribution
   - Deferred to post-MVP due to complexity and performance cost
   - Current approach: single seed for speed, Monte Carlo later for confidence

**Trade-off Statement** (from Research Doc, Section 1.4):
> "Para que o wrapper sirva como 'Fonte da Verdade', ele deve ser capaz de converter processos estocásticos em valores determinísticos para fins de validação."

Decision made: Use seeded RNG for simulation (reproducibility) + expected value for unit tests (speed).

## Questions to Address in ADR (if created)

- What problem was being solved?
  - RPG battles have inherent randomness (critical hits, variance, miss chances)
  - Need reproducible TTK measurements for balance validation
  - CI/CD requires detecting when balance changes affect outcomes

- Why was seed-controlled RNG chosen?
  - Balances determinism (same seed = same result) with realism (simulates actual RNG outcomes)
  - Allows both regression testing (fixed seed) and statistical analysis (seed ranges)
  - Industry standard approach (used in game testing, procedural generation validation)

- What alternatives were considered?
  - Pure random (rejected - not reproducible)
  - Expected value only (rejected - can't capture complex interactions)
  - Monte Carlo from start (deferred - too slow for MVP)
  - Fixed seed with no override (rejected - not flexible enough)

- What are long-term consequences?
  - All historical reports depend on seed being logged
  - Changing PRNG algorithm breaks reproducibility of old seeds
  - Seed must be versioned if algorithm changes
  - Monte Carlo expansion requires seed range management
  - Report queries will filter by seed ("show me all runs with seed 12345")

- What are the implementation details?
  - Which PRNG library? (Options: seedrandom.js, alea, Mersenne Twister)
  - When to initialize seed? (Must be BEFORE loading RPG Maker MZ core)
  - How to ensure ALL RNG sources use seeded Math.random? (VisuStella plugins may have independent RNG)
  - How to handle Jest mocking? (Unit tests use fixed return, integration tests use seeded PRNG)

- What are the testing implications?
  - Unit tests: Mock Math.random to return fixed values (0.5) for speed and isolation
  - Integration tests: Use seeded PRNG to validate full battle flow
  - Regression tests: Use same seed as baseline run to detect behavior changes
  - Statistical tests: Run seed ranges to measure variance and confidence intervals

## Related Potential ADRs
- Battle Simulation Termination Conditions (timeout, victory, defeat)
- TTK Measurement Units (turns vs actions)
- Expected Damage Calculation Formula (complements seeded simulation)

## Additional Notes

**Critical Implementation Detail**: The research document (Section 1.4) provides specific guidance:
- Unit tests should use **mocked Math.random** returning fixed values for speed
- Integration/simulation tests should use **seeded PRNG** for realism
- This dual approach is optimal: fast unit tests + realistic integration tests

**VisuStella Concern**: The research document warns (Section 2) that VisuStella plugins are obfuscated. If plugins have internal RNG that doesn't use Math.random, seed control may be incomplete. This risk should be noted in the ADR and mitigated through behavioral testing (run same battle 100 times with same seed, verify identical outcome).

**PRNG Library Choice**: Not specified in documentation. Common options:
- **seedrandom.js**: Most popular, well-tested, used in many game projects
- **alea**: Lighter weight, good quality
- **Mersenne Twister**: Academic standard, overkill for this use case

Recommendation: seedrandom.js for proven reliability.

**CLI Override Use Cases** (from PRD):
- Designer suspects edge case with specific seed
- Running Monte Carlo batch (--seed range 1000-2000)
- Reproducing bug from CI report ("Report says seed 67890 failed")
- Testing seed sensitivity (does small seed change drastically affect outcome?)

**Future Monte Carlo Architecture** (implied in research):
```
For statistical confidence:
  for seed in range(1, 1000):
    run_battle(troop, seed)
  calculate p50, p95, min, max TTK
  report distribution
```

Current MVP: single seed, future expansion to seed ranges.

**Seed in Reports** (from HLD Section 3.6 report structure):
```json
{
  "timestamp": "ISO-8601",
  "seed": 12345,  // CRITICAL for reproducibility
  "projectPath": "/path/to/project",
  "trechos": [...]
}
```

Without seed in report, results cannot be reproduced. This is a hard requirement.
