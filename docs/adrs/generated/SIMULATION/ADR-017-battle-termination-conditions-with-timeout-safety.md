# ADR-017: Battle Termination Conditions with Timeout Safety

**Status:** Accepted
**Date:** 2026-01-04

---

## Context and Problem Statement

The battle simulation loop must terminate reliably to support unattended validation runs and meet performance targets. Without explicit termination conditions, edge cases could cause infinite loops that hang the entire validation pipeline, wasting hours of designer time.

The system must handle three distinct termination scenarios: victory (all enemies defeated), defeat (all party members defeated), and timeout (maximum turn limit exceeded). The timeout mechanism serves as a safety net against logic bugs, extreme state effects, and rounding errors that could prevent battle resolution.

Performance requirements mandate less than 3 seconds per battle to achieve the 10-minute target for complete validation runs. This requires bounded execution time through timeout protection.

## Decision Drivers

- Reliability of unattended validation pipeline depends on preventing hanging battles
- Performance target requires bounded execution time per battle
- Battle simulation must distinguish between legitimate defeat and infinite loop scenarios
- VisuStella plugin system enables complex state effects that can create edge cases
- Partial validation results are more valuable than aborting entire runs on timeout
- Debugging requires clear distinction between balance issues and logic bugs

## Considered Options

1. Three-condition termination with timeout as recoverable warning
2. Two-condition termination without timeout protection
3. Three-condition termination with timeout as fatal error

## Decision Outcome

Chosen option: "Three-condition termination with timeout as recoverable warning", because it balances robustness against hanging loops while allowing validation runs to complete with partial results. Timeout generates a warning and continues to the next battle rather than aborting the entire run.

This approach enables unattended CI execution, provides diagnostic information about balance edge cases, and ensures the 10-minute performance target remains achievable through bounded worst-case execution time.

## Pros and Cons of the Options

### Three-condition termination with timeout as recoverable warning

- Good: Prevents infinite loops from hanging entire validation pipeline
- Good: Enables bounded worst-case execution time for performance guarantees
- Good: Provides diagnostic signal for balance bugs and extreme edge cases
- Good: Allows partial validation results when timeouts occur
- Bad: May terminate legitimate long battles prematurely if timeout too aggressive
- Bad: Requires careful timeout value selection to avoid false positives
- Bad: Adds complexity to battle loop termination logic

### Two-condition termination without timeout protection

- Good: Simpler implementation with fewer edge cases
- Good: No risk of prematurely terminating legitimate battles
- Bad: Single hanging battle blocks entire validation run
- Bad: Unsuitable for unattended CI execution
- Bad: Debugging nightmare to identify which battle caused hang
- Bad: Cannot provide bounded execution time guarantees

### Three-condition termination with timeout as fatal error

- Good: Strictly enforces performance expectations
- Good: Forces immediate attention to timeout issues
- Bad: Single timeout prevents all subsequent battles from validation
- Bad: Loses partial validation results on first timeout
- Bad: Makes iterative balance debugging more difficult
- Bad: Unsuitable for exploratory validation of incomplete designs

## Consequences

The timeout mechanism becomes a critical diagnostic tool for balance validation. Timeout warnings reveal valuable patterns: early timeouts indicate party configuration issues, mid-range timeouts suggest balance problems, and late timeouts expose edge cases in state effect interactions.

The timeout value must be configurable to accommodate different battle types. Regular encounters may use conservative limits while boss battles require higher thresholds. The system will need per-trecho timeout configuration when boss content is introduced post-MVP.

Statistical analysis must account for timeout as a distinct outcome separate from defeat. Timeout rate trends in CI provide early warning signals for balance regressions or logic bugs introduced by changes to combat formulas or state effects.

Turn-based timeout provides deterministic, reproducible behavior when combined with seed-controlled RNG. The same battle configuration either consistently times out or consistently resolves, enabling reliable regression detection.

## References

- docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:226-245
- docs/hld-coreto-game-engine.md:248-260
- docs/hld-coreto-game-engine.md:564-569
- docs/hld-coreto-game-engine.md:176-183
