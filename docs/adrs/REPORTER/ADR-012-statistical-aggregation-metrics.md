# ADR-012: Statistical Aggregation Metrics for Game Balancing

**Status:** Accepted
**Date:** 2026-01-04

## Context and Problem Statement

The REPORTER module must calculate statistical aggregates per trecho (game section) to provide game designers with meaningful insights for balancing validation. The system needs to determine which statistical metrics are most valuable for evaluating time-to-kill (TTK) variance, detecting outliers, and supporting design decisions - while avoiding overwhelming complexity.

The challenge is selecting a metric framework that balances statistical rigor with designer usability. Game balancing requires understanding both central tendency (typical experience) and variance (edge cases), measured across both turn-based and action-based dimensions, scoped to individual game sections rather than global campaigns.

## Decision Drivers

- Game designers need actionable insights without statistical expertise required
- Must capture variance and outliers (p95) without over-sensitivity to rare extremes
- Turn-based games require dual measurement (turns vs. actions provide different balance insights)
- Per-trecho aggregation aligns with game structure (sections have different difficulty curves)
- Future analytics and visualization requirements (histogram support, historical baselines)
- Computational feasibility within batch processing constraints

## Considered Options

1. **Limited Core Metrics** (avg, p50, p95, max) - CHOSEN
2. Simpler Metrics (only average and max, no percentiles)
3. Richer Distribution (full histogram bins, quartiles, standard deviation, p90/p99)

## Decision Outcome

Chosen option: **Limited Core Metrics (avg, p50, p95, max)**, because it provides balanced complexity that captures both central tendency and variance while remaining designer-friendly.

The framework calculates four statistical measures per trecho:

- Average TTK (mathematical mean, shows overall trend)
- P50/Median TTK (typical experience, resistant to outliers)
- P95 TTK (edge case detection: "95% of battles finish within X")
- Max TTK (worst-case scenario for balance-breaking detection)

Each metric tracks both turns and actions separately, enabling complementary analysis of round-based progression versus individual character move sequences.

## Pros and Cons of the Options

### Limited Core Metrics (avg, p50, p95, max)

**Pros:**

- Captures variance through p95 without overwhelming designers with distribution complexity
- Dual metrics (average vs. median) provide complementary insights for outlier detection
- P95 balances outlier sensitivity (catches edge cases) without extreme p99 conservatism
- Designer-friendly interpretation ("95% of battles finish within X turns")
- Supports future histogram visualization (planned post-MVP)

**Cons:**

- Requires statistical literacy from designers (p95 interpretation not universal)
- Limited to four metrics (may miss nuances visible in full distribution)
- Percentile calculation requires in-memory sorted datasets (memory overhead)
- Dual tracking (turns + actions) doubles computation per trecho

### Simpler Metrics (average and max only)

**Pros:**

- Minimal computational overhead
- Universally understood by non-technical designers
- Sufficient for basic "is this balanced?" validation
- Easier to implement and test

**Cons:**

- No variance detection (cannot distinguish consistent vs. inconsistent TTK)
- Cannot identify percentile-based edge cases (p95)
- Misses outlier-resistant median insights
- Insufficient for rigorous balancing analysis

### Richer Distribution (full histogram, quartiles, std dev)

**Pros:**

- Complete statistical picture of TTK distribution
- Enables advanced analytics (variance, skewness, modal analysis)
- Supports sophisticated balancing decisions
- Future-proof for evolving requirements

**Cons:**

- Overwhelms designers with complexity
- Significant computational overhead (histogram binning, quartile calculation)
- Requires advanced statistical training for interpretation
- Over-engineered for MVP balancing validation needs

## Consequences

**Positive Consequences:**

- Game designers receive actionable variance insights without statistical expertise
- P95 metric enables tolerance evaluation strategy evolution (compare aggregates vs. individual results)
- Dual tracking (turns + actions) reveals high actions/turn ratio indicating complex multi-enemy battles
- Per-trecho aggregation enables section-specific balancing validation aligned with story structure
- Framework serves as historical baseline for regression detection across versions

**Negative Consequences:**

- Designers require training to interpret p95 and understand median vs. average distinction
- Metric limitation may miss nuances requiring future schema evolution (adding std dev, variance, p90)
- Percentile calculation adds computational cost and memory requirements for sorted datasets
- Dual metric tracking increases report schema complexity

**Risks:**

- Designer misinterpretation of p95 could lead to incorrect balancing decisions
- Fixed metric set may not capture all balancing issues, requiring future metric additions
- Statistical framework may evolve post-MVP, requiring backward compatibility for historical comparisons

## References

- `docs/hld-coreto-game-engine.md:574-586` (TrechoReport data model)
- `docs/hld-coreto-game-engine.md:172-186` (Reporter Layer responsibilities)
- `docs/hld-coreto-game-engine.md:766-771` (Example aggregates in report output)
- `docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md:239,261` (FR-007, FR-008)
