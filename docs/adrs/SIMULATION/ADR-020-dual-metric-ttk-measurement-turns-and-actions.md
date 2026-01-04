# ADR-020: Dual-Metric TTK Measurement (Turns and Actions)

**Status:** Accepted
**Date:** 2026-01-04

---

## Context and Problem Statement

The SIMULATION module must measure Time-to-Kill effectiveness to validate combat balance across game progression. The system needs to quantify how long battles take, but combat duration can be measured in different ways. A single metric would be insufficient to capture the nuanced relationship between battle pacing and action efficiency in turn-based RPG combat.

Traditional turn-based RPG balance requires understanding both temporal pacing (how many full turn cycles occur) and action economy (how many individual actions are needed). Party composition affects these differently: a four-character party executes more actions per turn than a two-character party, even if both complete the same number of turn cycles.

## Decision Drivers

- Balance targets must reflect how designers conceptualize combat pacing using both turn counts and action counts
- Turn-based combat pacing differs fundamentally from action efficiency
- Party size affects action count per turn without affecting turn count
- Future ATB/TPB system support requires action economy tracking where turn boundaries become fluid
- Statistical analysis requires both dimensions to identify balance patterns and correlations
- Validation logic must detect imbalance in either pacing or efficiency independently

## Considered Options

1. Dual metrics: Track both turn count and action count independently
2. Turn count only: Measure TTK as number of full turn cycles
3. Action count only: Measure TTK as number of individual skill executions

## Decision Outcome

Chosen option: Dual metrics (turns and actions), because it provides complementary insights into combat balance. Turn count measures player-perceived pacing, while action count measures mechanical efficiency and resource expenditure. Both dimensions are necessary to validate that battles feel appropriately paced while requiring reasonable action investment.

The system tracks both counters during battle simulation, compares both against configured targets with independent tolerances, and reports both in aggregated results.

## Pros and Cons of the Options

### Dual Metrics: Turns and Actions

**Pros:**

- Captures both pacing dimension (turn cycles) and efficiency dimension (action investment)
- Enables detection of imbalance in either dimension independently
- Matches design vocabulary where both metrics appear in balance documentation
- Supports future ATB/TPB systems where action economy becomes primary metric

**Cons:**

- Requires designers to specify targets for both metrics
- Doubles validation logic complexity with two tolerance checks
- Reports become more complex with parallel aggregates for both dimensions

### Turn Count Only

**Pros:**

- Simpler measurement with single metric and single validation
- Aligns with traditional turn-based RPG design thinking
- Easier for designers to conceptualize single target

**Cons:**

- Loses action economy information critical for resource balance
- Cannot distinguish efficient battles from inefficient ones with same turn count
- Insufficient for ATB/TPB systems where turn boundaries blur
- Multi-hit skills and extra-action mechanics become invisible

### Action Count Only

**Pros:**

- Directly measures action investment and resource expenditure
- Works for both turn-based and action-based combat systems
- Simpler than dual metrics with single validation path

**Cons:**

- Loses pacing information that affects player experience
- Doesn't match design vocabulary where turn-based thinking dominates
- Same action count across different turn counts feels different to players

## Consequences

**Positive:**

- Balance validation becomes more nuanced with two independent quality signals
- Statistical analysis can identify patterns like turn-to-action ratios by level and party composition
- System supports both traditional turn-based and future ATB/TPB combat modes
- Designers receive richer feedback for balance iterations

**Negative:**

- All trecho definitions must specify dual targets and tolerances
- Report structure and CLI output must present both metrics clearly
- Future ATB/TPB implementation must carefully redefine turn semantics

**Implementation Details:**

- Turn counting: Full cycle where all active combatants have acted once
- Action counting: Each individual skill execution by **all combatants** (party members AND enemies)
- Validation uses conjunctive logic where both metrics must fall within tolerance
- Aggregates calculated separately for each metric
- Action count reflects total battle activity, providing complete picture of combat complexity

## References

- `/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:226-245`
- `/Users/edney/projects/coreto/game-engine/docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:106-127`
- `/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:155-166`
- `/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md:248-260`
