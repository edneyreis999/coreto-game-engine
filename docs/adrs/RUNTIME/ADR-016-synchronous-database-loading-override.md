# ADR-016: Synchronous Database Loading Override for Deterministic Testing

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-003

## Context and Problem Statement

The RPG Maker MZ engine loads database files (Classes.json, Enemies.json, Troops.json, Skills.json) asynchronously via XMLHttpRequest in production environments. In headless testing with JSDOM, this asynchronous loading introduces race conditions and unnecessary complexity. Each of the planned 200+ battle simulations would require Promise-based synchronization, increasing test fragility and execution time.

The challenge: How can database loading be handled in headless tests to ensure deterministic initialization without race conditions while maintaining compatibility with the engine's data structure expectations?

## Decision Drivers

- Eliminate race conditions in test setup across 200+ planned battle simulations
- Simplify test code by removing async/await complexity from initialization sequences
- Enable faster test execution by removing network simulation overhead (~50-100ms per test)
- Support direct injection of wrapper-generated data files from LOADER layer
- Maintain compatibility with engine's data structure expectations ($dataClasses, $dataEnemies, etc.)
- Support deterministic test execution required by ADR-003's battle simulation strategy

## Considered Options

1. Override DataManager.loadDataFile with synchronous fs.readFileSync operations
2. Keep async loading and use async/await in all test setup code
3. Use Jest's mock system to intercept and stub XMLHttpRequest synchronously

## Decision Outcome

Chosen option: **Override DataManager.loadDataFile with synchronous fs.readFileSync operations**, because it provides explicit control over loading behavior, eliminates async complexity in test code, and maintains clean separation between data loading and engine logic. The override is implemented in RUNTIME layer setup files and applies only to headless test environment.

The override converts async XMLHttpRequest-based loading to synchronous Node.js file operations, guaranteeing data availability before battle initialization. This approach is faster, simpler to debug, and directly compatible with LOADER layer's file path injection strategy.

## Pros and Cons of the Options

### Option 1: Override DataManager.loadDataFile with synchronous fs.readFileSync

**Pros:**

- Eliminates all race conditions by guaranteeing synchronous data availability
- Simplifies test code—no async/await contamination in initialization
- Faster execution—removes ~50-100ms per test (10-20 seconds cumulative savings)
- Easy to locate and debug in codebase (explicit override in setup files)

**Cons:**

- Diverges from production behavior (async vs. sync loading semantics)
- Requires overriding engine internals, risking breakage with engine updates
- May not catch async-dependent bugs if they exist in game logic
- Requires maintenance if VisuStella plugins add custom data loading

### Option 2: Keep async loading with async/await in tests

**Pros:**

- Maintains fidelity to production loading behavior
- No engine overrides required

**Cons:**

- Generates race conditions and complexity across all 200+ test cases
- Slower test execution due to async overhead per test
- Harder to debug timing-dependent failures in test setup
- Contaminating test code with Promise/async handling for non-functional concern

### Option 3: Mock XMLHttpRequest to return data synchronously

**Pros:**

- No direct engine overrides
- Could reuse Jest's existing mock infrastructure

**Cons:**

- Less explicit—harder to locate where synchronous behavior is enforced
- Adds indirection through Jest mock system
- May conflict with other XMLHttpRequest usage in plugins
- Harder to debug when mock configuration fails

## Consequences

**Positive:**

- Test setup becomes deterministic and race-condition-free across entire simulation suite
- Simplified test code enables faster development of new battle scenarios
- Performance improvement supports rapid iteration during balancing validation
- Clean integration with LOADER layer's file path injection strategy
- Supports broader determinism goals (ADR-003) by guaranteeing consistent initialization order

**Negative:**

- Creates divergence from production game behavior in loading semantics
- Requires monitoring RPG Maker MZ DataManager API for breaking changes
- Must be updated if VisuStella plugins introduce custom data loading mechanisms
- Tests cannot validate async-dependent loading behaviors (though none expected for TTK validation)

**Neutral:**

- Override is isolated to test environment, does not affect production game
- Sets precedent for other async-to-sync conversions in headless environment

## References

- docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md:204-206
- docs/hld-coreto-game-engine.md:143-144
