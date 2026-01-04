# Potential ADR: Typed Warning System with Severity Levels

**Module**: REPORTER
**Category**: Architecture/Observability
**Priority**: Must Document (Score: 120/150)
**Date Identified**: 2026-01-04

---

## What Was Identified

The REPORTER module is designed to implement a **typed warning system** with predefined warning types (`troop_not_found`, `enemy_not_found`, `ttk_out_of_tolerance`, `skill_formula_error`, `battle_timeout`) and severity levels (`critical`, `warning`, `info`). This decision establishes a structured error/warning taxonomy rather than free-form error messages.

The decision encompasses:
- **Type enumeration**: Fixed set of warning types (not dynamic or free-text)
- **Severity classification**: Three-level system (critical/warning/info)
- **Non-blocking failures**: Warnings don't stop execution (fail-soft, not fail-fast)
- **Aggregated reporting**: `warningsByType` summary in report metadata
- **Contextual warnings**: Each warning includes `type`, `severity`, `message`, and `context` object

This pattern was documented in HLD Section 5.1 (Warning data model), Section 3.6 (Reporter responsibilities), and throughout the error handling strategy, appearing consistently as a deliberate observability architecture choice.

## Why This Might Deserve an ADR

**Impact**: Affects error handling strategy, user experience, and automation
- Determines how failures are communicated to game designers (actionable vs. noisy)
- Enables automated decision-making (e.g., CI can fail builds on "critical" warnings)
- Influences debugging efficiency (typed warnings easier to filter/search than free-text)
- Affects future warning extension (adding new types requires schema evolution)
- Shapes reporting UX (typed warnings enable structured UI displays)

**Trade-offs**: Error handling philosophy with significant implications
- **Typed vs. Free-text**: Typed warnings are structured/parseable but require upfront taxonomy design
- **Non-blocking vs. Fail-fast**: System continues despite errors (resilience) vs. stopping on first failure (safety)
- **Three severity levels vs. More granular**: Balances simplicity (critical/warning/info) vs. nuance (5+ levels)
- **Aggregation vs. Detail**: Summary counts (`warningsByType`) plus detailed warnings array

**Complexity**: Non-trivial implementation and maintenance
- Requires defining and documenting each warning type's meaning
- Severity assignment logic must be consistent and well-reasoned
- Warning context schema varies by type (flexible `context: object`)
- Enumeration evolution strategy (adding new types without breaking parsers)

**Team Knowledge**: Critical for both implementers and consumers
- **Developers**: Must understand when to emit each warning type and severity
- **Game Designers**: Must know what each warning means and how to fix it
- **CI/Automation**: Must parse types/severities for automated decisions
- **Future UI**: Will display warnings in structured views

**Future Implications**: Long-term observability and automation
- **CI Integration** (planned post-MVP): Will use severity to determine build pass/fail
- **Warning evolution**: New game mechanics may require new warning types
- **Analytics**: Typed warnings enable tracking warning trends over time
- **Automated fixes**: Typed warnings could trigger automated remediation in future

## Evidence Found in Codebase

### Key Files
This is a **documentation-only decision** (greenfield project). Evidence comes from:

- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 589-597 (Warning data model)
- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 172-186 (Reporter Layer responsibilities)
- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 740-743 (warningsByType summary)
- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 1145-1167 (Warning structure example)
- [`docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md`](../../../docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md) - Lines 260 (FR-008)

### Code Evidence (from documentation)

**Warning Data Model (HLD Section 5.1):**
```typescript
{
  type: 'troop_not_found' | 'enemy_not_found' | 'ttk_out_of_tolerance' | 'skill_formula_error' | 'battle_timeout',
  severity: 'critical' | 'warning' | 'info',
  message: string,
  context: object
}
```

**Warning Types Documented:**

1. **`troop_not_found`**
   - Triggered: TroopId in config doesn't exist in Troops.json
   - Severity: Likely `critical` (blocks battle execution)
   - Context: `{ trechoId, troopId }`

2. **`enemy_not_found`**
   - Triggered: Enemy referenced in Troop doesn't exist in Enemies.json
   - Severity: Likely `critical` (invalid troop composition)
   - Context: `{ troopId, enemyId }`

3. **`ttk_out_of_tolerance`**
   - Triggered: Measured TTK outside target ± tolerance
   - Severity: Likely `warning` (balance issue, not fatal)
   - Context: `{ troopId, ttkTurns, ttkActions, target, tolerance }`

4. **`skill_formula_error`**
   - Triggered: Skill damage formula runtime error
   - Severity: Likely `warning` or `critical` (depends on impact)
   - Context: `{ skillId, formula, error }`

5. **`battle_timeout`**
   - Triggered: Battle exceeds max turn/time limit
   - Severity: Likely `warning` (balance issue or infinite loop)
   - Context: `{ troopId, maxTurns, actualTurns }`

**Aggregation in Summary (HLD Section 6.4):**
```json
{
  "summary": {
    "totalWarnings": 3,
    "warningsByType": {
      "ttk_out_of_tolerance": 2,
      "troop_not_found": 1
    }
  }
}
```

**Reporter Layer Responsibilities (HLD Section 3.6):**
- "Gerar warnings (TTK fora da tolerância, troops inexistentes, enemies inválidos)"
- "Warning generator: `ttk_out_of_tolerance`, `troop_not_found`, `enemy_not_found`, `skill_formula_error`, `battle_timeout`"

**Non-blocking Philosophy (HLD Section 9.2):**
- "Resiliência: Falha em uma troop não interrompe execução das demais"
- "Warnings/erros registrados no relatório sem parar o pipeline"
- "Modo degradado: gerar relatório parcial mesmo com falhas"

**CLI Exit Code Strategy (HLD Section 6.1):**
- "Exit code: 0 (sucesso) ou 1 (warnings críticos)"
- Implies severity-based exit code decision

### Impact Analysis
- **Project Phase**: Planning/Documentation (TRL 3)
- **Decision Date**: Documented 2026-01-04 (HLD creation)
- **Files Affected**: Future implementation across multiple modules
  - `src/reporter/warnings.js` (warning generation)
  - `src/loader/*.js` (emits troop_not_found, enemy_not_found)
  - `src/simulation/*.js` (emits skill_formula_error, battle_timeout, ttk_out_of_tolerance)
  - `src/cli/*.js` (consumes severities for exit codes)
- **Modules Affected**:
  - LOADER (emits validation warnings)
  - SIMULATION (emits runtime warnings)
  - REPORTER (aggregates and formats warnings)
  - CLI (displays and reacts to warnings)

### Alternatives (explicitly mentioned or implicit)

**Warning Type Strategy:**
- **Chosen**: Fixed enumeration of 5 types (extensible in future)
- **Alternative 1**: Free-text error messages (rejected - not parseable)
- **Alternative 2**: Error codes (e.g., E001, E002) (rejected - less semantic)
- **Alternative 3**: Hierarchical types (e.g., `validation.troop.not_found`) (not adopted in MVP)

**Severity Levels:**
- **Chosen**: Three levels (critical/warning/info)
- **Alternative 1**: Two levels (error/warning) - too coarse
- **Alternative 2**: Five levels (critical/high/medium/low/info) - too complex for MVP
- **Alternative 3**: Numeric severity (1-10) - less semantic

**Error Handling Philosophy:**
- **Chosen**: Non-blocking (fail-soft) - continue execution, accumulate warnings
- **Alternative**: Fail-fast - stop on first error
- **Rationale** (from HLD 9.2): "Falhas de execução de uma troop não devem interromper as demais, apenas registrar no relatório" (RNF: Confiabilidade)

**Aggregation Strategy:**
- **Chosen**: Both summary counts (`warningsByType`) and detailed array (`warnings[]`)
- **Alternative**: Only detailed warnings (no aggregation) - harder to get overview
- **Rationale**: Summary enables quick assessment ("3 warnings: 2 TTK, 1 missing troop")

**Contextual Information:**
- **Chosen**: Flexible `context: object` (type-specific schemas)
- **Alternative**: Fixed context schema for all warnings - too rigid
- **Rationale**: Different warning types need different debugging info

## Questions to Address in ADR (if created)

**Context and Problem:**
- What are the consequences of each warning type (can designer ignore safely)?
- How should CI/automation react to each severity level?
- Why these 5 specific warning types for MVP v1?

**Decision:**
- Why typed enumerations instead of free-text error messages?
- Why three severity levels (critical/warning/info) specifically?
- Why non-blocking (fail-soft) error handling instead of fail-fast?
- Why both aggregated summary and detailed warnings array?
- How to assign severity to each warning type?

**Alternatives Considered:**
- **Error codes** (E001-E999) vs. semantic type names
- **Fail-fast** (stop on first error) vs. fail-soft (accumulate warnings)
- **Two severity levels** (error/warning) vs. three (critical/warning/info)
- **Free-text messages** vs. structured types + context

**Consequences:**
- **Positive**:
  - Parseable warnings enable automation (CI, analytics, UI)
  - Non-blocking execution provides comprehensive reports (find all issues in one run)
  - Severity levels enable graduated responses (fail CI on critical, alert on warnings)
  - Type safety prevents typos, enables IDE autocomplete (in TypeScript)

- **Negative**:
  - Type enumeration requires upfront design (can't handle unexpected errors gracefully)
  - Adding new types requires schema evolution (backwards compatibility concerns)
  - Severity assignment requires judgment (ambiguous cases)
  - Non-blocking approach may hide critical issues until report review

- **Risks**:
  - Warning fatigue if too many low-severity warnings
  - Incorrect severity assignment could cause CI to miss issues or be too noisy
  - New game mechanics may not fit into existing warning types

- **Future evolution**:
  - How to add new warning types without breaking existing parsers?
  - Should warning types be extensible via plugins/config?
  - Need for warning deduplication or grouping?

## Related Potential ADRs
- **json-report-output-format.md** (this module): Warnings are embedded in JSON schema
- **statistical-aggregation-metrics.md** (this module): Warnings complement metrics for comprehensive feedback
- **Future consideration**: CI integration strategy (how to map severities to build pass/fail)
- **Future consideration**: Warning localization/i18n for international teams

## Additional Notes

**Greenfield Status**: This decision exists only in documentation. No implementation code has been written yet. The warning taxonomy was defined during planning phase (HLD v1.0).

**Error Handling Philosophy**:
- Aligns with PRD RNF: "Falhas de execução de uma troop não devem interromper as demais"
- Supports observability goal: "registrar seed, party, skills escolhidas e warnings" (PRD line 315)
- Enables batch processing: validate all troops in one run rather than stopping at first failure

**Severity Assignment Guidelines** (inferred from documentation):
- **Critical**: Prevents battle execution (missing data, invalid config)
- **Warning**: Battle ran but results suspect (TTK out of tolerance, formula errors)
- **Info**: Non-actionable observations (future use, currently no examples)

**Warning Type Coverage**:
- **Validation phase** (LOADER): `troop_not_found`, `enemy_not_found`
- **Execution phase** (SIMULATION): `skill_formula_error`, `battle_timeout`
- **Analysis phase** (REPORTER): `ttk_out_of_tolerance`

**Comparison to Industry Patterns**:
- **TypeScript compiler**: Uses error codes (TS2304, etc.) - more concise but less semantic
- **Linters (ESLint)**: Uses rule names (no-unused-vars) - similar to this approach
- **Logging frameworks**: Often use severity levels (ERROR/WARN/INFO) - aligns with this design

**Scoring Rationale**:
- **Scope + Impact**: 25/25 (affects error handling across all modules, CI integration, UX)
- **Cost to Change**: 25/25 (changing taxonomy breaks parsers, CI scripts, documentation)
- **Team Knowledge**: 20/25 (developers + designers + automation must understand taxonomy)
- **Base Score**: 50 (architectural decision about observability and error handling)
- **Total**: 120/150 → Must Document
