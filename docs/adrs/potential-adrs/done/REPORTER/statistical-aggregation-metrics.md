# Potential ADR: Statistical Aggregation Metrics (Average, P50, P95, Max)

**Module**: REPORTER
**Category**: Architecture
**Priority**: Must Document (Score: 115/150)
**Date Identified**: 2026-01-04

---

## What Was Identified

The REPORTER module is designed to calculate **statistical aggregates per trecho** (game section) using specific metrics: **average TTK, median (p50), 95th percentile (p95), and maximum TTK** - measured in both turns and actions. This decision establishes which statistical measures are meaningful for game balancing validation and which are excluded.

The decision encompasses:
- **Metrics included**: Average, p50 (median), p95, max TTK
- **Dual measurement**: Both turns and actions tracked separately
- **Per-trecho aggregation**: Statistics calculated per game section, not globally
- **Percentile choice**: P95 specifically (not p90, p99, or other percentiles)

This pattern was documented in HLD Section 3.6, 5.1 (TrechoReport model), and PRD FR-007/FR-008, appearing consistently across planning documents as a deliberate statistical framework choice.

## Why This Might Deserve an ADR

**Impact**: Affects balancing validation accuracy and game design feedback
- Determines what statistical insights designers receive from validation runs
- Influences how outliers and variance are communicated (p95 captures edge cases)
- Affects tolerance evaluation strategy (compare against avg, max, or percentiles?)
- Shapes future analytics and visualization requirements

**Trade-offs**: Statistical methodology with clear implications
- **P95 vs. P99**: P95 chosen to balance outlier detection without over-sensitivity to rare extremes
- **Average vs. Median**: Both included - average shows overall trend, median resists outlier skew
- **Included metrics vs. Complexity**: Limited to 4 core metrics (avg, p50, p95, max) rather than full distribution
- **Per-trecho vs. Global**: Aggregation scoped to trechos (game sections) rather than entire campaign

**Complexity**: Statistical calculation requirements
- Requires collecting all battle results per trecho before aggregation
- Percentile calculation needs sorted datasets
- Dual tracking (turns AND actions) doubles metric calculation
- Memory implications: must hold all results in-memory for percentile calculation

**Team Knowledge**: Game designers need statistical literacy
- Designers must understand what p95 means to interpret warnings
- Average vs. median distinction affects balancing decisions
- Percentile interpretation not universally familiar to non-technical designers
- Documentation/training needed for metric consumption

**Future Implications**: Long-term measurement framework
- **Histogram visualization** (planned post-MVP, HLD Section 8.5.4): Will use these metrics for charts
- **Tolerance evaluation**: Currently compares individual TTK vs. target; could evolve to compare aggregates
- **Benchmark tracking**: These metrics become the historical baseline for regression detection
- **Metric extension**: Adding new statistics (std dev, variance, p90) requires schema evolution

## Evidence Found in Codebase

### Key Files
This is a **documentation-only decision** (greenfield project). Evidence comes from:

- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 574-586 (TrechoReport data model)
- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 172-186 (Reporter Layer responsibilities)
- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 766-771 (Example aggregates in report output)
- [`docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](../../../docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 239, 261 (FR-007, FR-008)

### Code Evidence (from documentation)

**TrechoReport Data Model (HLD Section 5.1):**
```typescript
{
  trechoId: string,
  results: BattleResult[],
  aggregates: {
    avgTtkTurns: number,
    p95TtkTurns: number,
    avgTtkActions: number,
    p95TtkActions: number
  },
  warnings: Warning[]
}
```

**Reporter Layer Responsibilities (HLD Section 3.6):**
- "Calcular agregados por trecho (média, p50, p95, max de TTK)"
- "Aggregate calculator per trecho: Average TTK (turns and actions), Median (p50), 95th percentile (p95), Max TTK"

**Example Output (HLD Section 6.4):**
```json
{
  "aggregates": {
    "avgTtkTurns": 3.2,
    "p95TtkTurns": 4,
    "avgTtkActions": 5.1,
    "p95TtkActions": 7
  }
}
```

**PRD Requirements (FR-007):**
- "Permitir calcular também estatísticas agregadas por trecho (média e p95) (hipótese)"

**Observability Requirements (HLD Section 8.4):**
- Lists "TTK Agregado" as key metric: "Média, p50, p95, max por trecho"

### Impact Analysis
- **Project Phase**: Planning/Documentation (TRL 3)
- **Decision Date**: Documented 2026-01-04 (HLD creation)
- **Files Affected**: Future implementation of `src/reporter/aggregates.js` or similar
- **Modules Affected**:
  - REPORTER (calculation logic)
  - Future UI (visualization of these specific metrics)
  - Documentation/training (explaining statistical concepts to game designers)

### Alternatives (explicitly mentioned or implicit)

**Metric choices documented:**
- **Included**: avg, p50, p95, max
- **Not mentioned** (likely excluded): Standard deviation, variance, p90, p99, min, quartiles, range

**Rationale for P95 (inferred from game design context):**
- **Game balancing focus**: P95 captures "worst reasonable case" without overweighting extreme outliers
- **Tolerance evaluation**: HLD shows tolerance ranges (e.g., ±1 turn) - p95 fits this thinking
- **Designer-friendly**: Simpler than full distribution analysis while still showing variance

**Dual metric tracking (turns AND actions):**
- HLD Section 5.1 explicitly tracks both: `ttkTurns` and `ttkActions`
- Rationale: Turn-based games measure time differently (turns = rounds, actions = individual character moves)
- Different balance insights: High actions/turn ratio indicates complex multi-enemy battles

**Per-trecho aggregation (vs. global):**
- HLD Section 5.1 shows `TrechoReport` with aggregates
- Aligns with game structure: trechos = story sections with different difficulty curves
- Enables section-specific balancing validation

**Alternatives NOT chosen:**
- **Full histogram/distribution**: Too complex for MVP v1, planned for future UI (HLD 8.5.4)
- **Real-time streaming stats**: Incompatible with batch processing design
- **Global campaign-wide aggregates**: Not aligned with per-trecho balancing methodology

## Questions to Address in ADR (if created)

**Context and Problem:**
- Why are these specific metrics (avg, p50, p95, max) the right ones for game balancing?
- How will game designers interpret and act on p95 values?
- What does "acceptable variance" look like in TTK for this RPG?

**Decision:**
- Why p95 instead of p90 or p99?
- Why include both average AND median (are outliers expected)?
- Why max TTK matters (vs. focusing only on central tendency)?
- Why per-trecho aggregation instead of global statistics?
- Why dual tracking (turns + actions) - which metric is primary?

**Alternatives Considered:**
- **Simpler metrics**: Only average and max (no percentiles)
- **Richer metrics**: Full distribution (histogram bins, quartiles, std dev)
- **Different percentiles**: P90 (less conservative) or P99 (more conservative)
- **Global aggregates**: Campaign-wide statistics instead of per-trecho

**Consequences:**
- **Positive**: Balanced complexity (not too simple, not overwhelming), captures variance via p95, dual metrics provide complementary insights
- **Negative**: Requires statistical understanding from designers, percentile calculation adds computational cost, limited to 4 metrics (may miss nuances)
- **Risks**: Designers may misinterpret p95 (education needed), metric choice may not capture all balancing issues
- **Future needs**: May need to add std dev, quartiles, or histogram bins for deeper analysis

## Related Potential ADRs
- **json-report-output-format.md** (this module): Aggregates are embedded in JSON schema
- **Future consideration**: Tolerance evaluation strategy (should tolerance checks use avg, p95, or individual results?)
- **Future consideration**: Historical baseline tracking (how to compare aggregates across versions?)

## Additional Notes

**Greenfield Status**: This decision exists only in documentation. No implementation code has been written yet. The statistical framework was defined during planning phase (HLD v1.0).

**Statistical Context**:
- **P50 (median)**: Resistant to outliers - shows "typical" TTK experience
- **P95**: Captures edge cases - "95% of battles finish within X turns" interpretation
- **Average**: Shows mathematical mean - sensitive to outliers, useful for overall trend
- **Max**: Worst-case scenario - important for detecting balance-breaking edge cases

**Game Design Alignment**:
- PRD Section "Objetivos e métricas" emphasizes "fidelidade ao jogo final"
- Statistical rigor supports deterministic, reproducible balancing validation
- Metrics align with RPG balancing principles: variance is acceptable, but outliers need investigation

**Documentation Gap**:
- PRD FR-007 says "média e p95 (hipótese)" - marked as hypothesis, not finalized
- HLD Section 3.6 adds p50 and max - indicates evolution during HLD phase
- **Recommendation**: Formalize this in ADR to document the "why" behind metric choices

**Scoring Rationale**:
- **Scope + Impact**: 25/25 (affects all balancing validation outcomes, future analytics)
- **Cost to Change**: 20/25 (changing metrics requires report schema change, but calculation logic is isolated)
- **Team Knowledge**: 20/25 (designers need statistical literacy, but core development team can implement easily)
- **Base Score**: 50 (architectural decision about measurement framework)
- **Total**: 115/150 → Must Document
