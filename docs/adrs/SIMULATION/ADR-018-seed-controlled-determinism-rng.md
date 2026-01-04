# ADR-018: Seed-Controlled Determinism for Battle Simulation RNG

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-014 (RUNTIME/JSDOM)

## Context and Problem Statement

The game balance validation system must execute RPG Maker MZ battle simulations in a deterministic manner to enable reliable Time-To-Kill (TTK) measurements and regression testing. RPG battles are inherently stochastic, involving random elements such as critical hit chances, damage variance, and miss probabilities. Without controlled randomness, identical party compositions fighting identical enemy troops could produce different TTK results on each execution, making validation unreliable and preventing detection of balance regressions in CI/CD pipelines.

The SIMULATION module requires a mechanism to override JavaScript's `Math.random()` with a seeded pseudorandom number generator (PRNG), ensuring that identical seed values produce identical battle outcomes across all executions. This must work with RPG Maker MZ's core engine and all third-party plugins including obfuscated VisuStella code.

## Decision Drivers

- Reproducible battle outcomes are fundamental to regression testing and CI/CD integration
- Random battle mechanics (critical hits, variance, miss chances) cannot be eliminated from simulation
- Validation results must serve as "source of truth" for game balance specifications
- Designers need flexibility to investigate edge cases using specific seed values via CLI override
- Future Monte Carlo statistical analysis will build on single-seed determinism foundation
- Jest test infrastructure requires both mocked RNG (unit tests) and seeded PRNG (integration tests)

## Considered Options

1. **Seed-controlled PRNG replacing Math.random** (chosen)
2. **Pure random execution without seed control**
3. **Expected value calculation without simulation**

## Decision Outcome

Chosen option: **Seed-controlled PRNG replacing Math.random**, because it provides reproducible battle outcomes while preserving realistic stochastic behavior, enables both regression testing with fixed seeds and future statistical analysis with seed ranges, and represents industry-standard practice for game testing and procedural generation validation.

The implementation replaces global `Math.random()` with a seeded PRNG before loading RPG Maker MZ core scripts. The seed value comes from configuration with CLI override capability. All simulation reports include the seed value to ensure results can be reproduced.

## Pros and Cons of the Options

### Seed-controlled PRNG replacing Math.random

**Pros**

- Identical seeds guarantee identical battle outcomes across all executions
- Enables regression detection in CI/CD by comparing results with baseline seed
- Supports both fixed-seed validation and future Monte Carlo statistical analysis
- Industry-standard approach proven in game testing and procedural generation
- Preserves realistic stochastic behavior while providing determinism
- CLI seed override enables investigation of specific edge cases and bug reproduction

**Cons**

- Fixed seed may miss edge cases that random seeds would expose during development
- Requires choosing and integrating third-party PRNG library
- Must ensure seed applies to ALL RNG sources including potentially obfuscated plugins
- Changing PRNG algorithm in future breaks reproducibility of historical seeds
- Reports become dependent on seed logging for reproducibility

### Pure random execution without seed control

**Pros**

- Simplest implementation with no PRNG library dependency
- Natural coverage of edge cases through random variation
- No risk of bias from fixed seed selection

**Cons**

- Different TTK measurements on each run makes validation unreliable
- Cannot detect balance regressions in CI/CD without reproducible baselines
- Unable to reproduce specific failures reported by designers or CI systems
- Statistical analysis requires large sample sizes without determinism
- Fundamentally incompatible with "source of truth" validation approach

### Expected value calculation without simulation

**Pros**

- Mathematically deterministic with no RNG needed
- Fastest execution for simple damage calculations
- Clear theoretical foundation for balance validation

**Cons**

- Cannot capture complex battle interactions (buffs, debuffs, state effects, turn order)
- VisuStella plugins contain opaque battle logic that cannot be fully modeled mathematically
- High-variance mechanics like critical hits poorly represented by expected values
- Requires reimplementing battle formulas instead of using actual game engine
- Complements but cannot replace realistic battle simulation

## Consequences

All battle simulation executions become dependent on seed initialization occurring before RPG Maker MZ engine loads. The RUNTIME module must guarantee seeded PRNG replacement happens first in the initialization sequence.

Every simulation report must include the seed value to enable result reproduction. Queries and analysis of historical reports will filter by seed. Report archival strategies must preserve seed metadata.

Changing the PRNG algorithm or library version in future updates will break reproducibility of all historical seeds. If such changes become necessary, seed versioning must be implemented to distinguish different PRNG generations.

The dual testing strategy emerges: unit tests mock Math.random with fixed values for speed and isolation, while integration tests use seeded PRNG for realistic battle flow validation. Jest setup files must configure both approaches appropriately.

VisuStella plugin compatibility depends on plugins using global Math.random rather than independent RNG implementations. If plugins contain internal RNG that bypasses Math.random, seed control will be incomplete. This risk requires mitigation through behavioral testing: running identical battles multiple times with the same seed to verify identical outcomes.

Future Monte Carlo statistical analysis (running hundreds of battles with different seeds to measure TTK distributions) builds directly on this foundation. The architecture must support efficient seed range iteration and aggregation of results across seeds.

## References

- docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:84-103
- docs/hld-coreto-game-engine.md:155-166
- docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md:64-72
