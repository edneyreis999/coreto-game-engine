# Potential ADR: Diagnostic Mode for Headless Initialization Troubleshooting

**Module**: RUNTIME
**Category**: Observability/Developer Experience
**Priority**: Consider (Score: 90)
**Date Identified**: 2026-01-04

---

## Existing ADR Context

ℹ️ **RELATED DECISIONS**

This decision relates to:
- **ADR-003**: Fidelidade via Batalha Real na Engine em Headless (RUNTIME, 2026-01-04)
- **Potential ADR**: Mocking Strategy for Graphics Dependencies (RUNTIME)

**Timeline Context**:
- Mitigation strategy mentioned in ADR-003
- Supports debugging of complex mock infrastructure

**When creating formal ADR**: Reference as operational/observability complement to core architectural decisions. Enables maintainability of mock strategy.

---

## What Was Identified

The RUNTIME module involves complex initialization with multiple mocks, engine loading, and plugin integration. The documentation reveals a planned **diagnostic mode** (activated via `--diagnostic` CLI flag) designed to help developers debug headless initialization failures.

This is an operational/observability decision that sits alongside the core architectural choices. While the exact implementation isn't specified, it's mentioned in ADR-003 mitigations and HLD CLI specifications as a critical developer tool.

Expected capabilities (inferred from context):
- Verbose logging of initialization steps
- Mock load status reporting
- Engine script loading sequence tracking
- Plugin initialization status
- Global object inspection
- Failure point identification

The decision appears in:
- ADR-003 Line 54: "Modo diagnóstico (`--diagnostic`) para debug de inicialização"
- HLD Section 3.1: CLI arguments include `--diagnostic`
- Positioned as mitigation for high-risk mock fragility

---

## Why This Might Deserve an ADR

- **Impact**: MEDIUM - Doesn't affect production runtime, but critical for development velocity. Impacts developer debugging time (potentially hours saved per initialization issue). Affects all developers working on RUNTIME module.

- **Trade-offs**:
  - **Performance overhead**: Diagnostic logging slows initialization, but acceptable for debugging
  - **Code complexity**: Requires instrumentation throughout RUNTIME layer
  - **Maintenance**: Diagnostic code must be updated as mocks/initialization evolve
  - **Verbosity**: Too much logging overwhelms, too little fails to help

- **Complexity**: MEDIUM - Requires:
  - Instrumentation at key initialization points
  - Structured logging framework
  - CLI flag parsing and propagation
  - Careful selection of what to log (signal vs. noise)
  - Pretty-printing of complex objects (globals, mocks)

- **Team Knowledge**: ANY developer touching RUNTIME must understand:
  - When to use `--diagnostic` vs. normal execution
  - How to interpret diagnostic output
  - Where to add diagnostic logging for new initialization steps
  - Performance implications (don't run in CI with diagnostic mode)

- **Future Implications**:
  - Sets precedent for observability in CLI tools
  - May expand to other modules (SIMULATION, LOADER diagnostic modes)
  - Could evolve into full debug mode with interactive stepping
  - Diagnostic output format becomes informal contract (scripts may parse it)

**Temporal Context**: Planning phase. Mentioned as mitigation in ADR-003 (dated 2026-01-04). No implementation details yet.

---

## Evidence Found in Codebase

### Key Files
**Note**: No implementation yet (planning phase). Evidence from documentation.

- [`/Users/edney/projects/coreto/game-engine/docs/adrs/documented/ADR-003-fidelidade-batalha-real-engine-headless.md`](../../../docs/adrs/documented/ADR-003-fidelidade-batalha-real-engine-headless.md) - Line 54 (Mitigação de Riscos)
  - Listed as risk mitigation: "Modo diagnóstico (`--diagnostic`) para debug de inicialização"
  - Context: Mitigating "Maior fragilidade e custo de manutenção do harness headless"

- [`/Users/edney/projects/coreto/game-engine/docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Line 94 (Section 3.1)
  - CLI arguments: "`--diagnostic`"
  - Described as: CLI argument for developer debugging

### Code Evidence
```javascript
// Conceptual implementation (not documented, inferred from context):
// cli.js
const diagnosticMode = args.diagnostic || false;

// runtime/initializer.js
function initializeHeadlessRuntime(config, diagnosticMode = false) {
    const logger = diagnosticMode ? new DiagnosticLogger() : new SilentLogger();

    logger.section('JSDOM Initialization');
    logger.log('Creating JSDOM instance...');
    const dom = new JSDOM(/* ... */);
    logger.success('JSDOM created');

    logger.section('Mock Installation');
    logger.log('Installing PIXI mocks...');
    installPIXIMocks(global, logger);
    logger.log('Installing Graphics mocks...');
    installGraphicsMocks(global, logger);
    logger.log('Installing Effekseer mocks...');
    installEffekseerMocks(global, logger);

    logger.section('Engine Loading');
    logger.log('Loading rmmz_core.js...');
    loadEngineScript('rmmz_core.js', logger);
    logger.log('Loading rmmz_managers.js...');
    loadEngineScript('rmmz_managers.js', logger);

    logger.section('Plugin Loading');
    logger.log('Loading VisuStella Core Engine...');
    loadPlugin('VisuMZ_0_CoreEngine', logger);

    logger.section('Validation');
    logger.log('Checking global objects...');
    logger.object('window.Graphics', window.Graphics);
    logger.object('window.BattleManager', window.BattleManager);

    logger.complete('Headless runtime initialized successfully');
}
```

### Impact Analysis
- Introduced: Planning phase (2026-01-04)
- Modified: Not yet implemented
- Affects:
  - Developer debugging workflows
  - RUNTIME initialization visibility
  - Time to diagnose mock failures
  - Onboarding new developers to complex mock architecture
- Dependencies:
  - **Requires**: CLI argument parsing
  - **Requires**: Structured logging approach
  - **Optional**: Could integrate with existing logging libraries (winston, pino)

### Alternatives (if observable)

**Alternative 1: No diagnostic mode, rely on error messages only**
- Default error messages from engine/mocks may be cryptic
- Research identifies initialization as high-risk, fragility concern
- Rejected implicitly by including `--diagnostic` in planning

**Alternative 2: Always-on verbose logging**
- Would clutter normal execution, slow performance
- Not suitable for CI or production-like runs
- Rejected: need opt-in diagnostic mode

**Alternative 3: Separate diagnostic test suite**
- Could create tests specifically for initialization validation
- Doesn't help with ad-hoc debugging during development
- Complementary rather than alternative

**Chosen Approach: CLI flag-activated diagnostic mode**
- Opt-in: doesn't affect normal execution performance
- Contextual: can be toggled per-run
- Developer-friendly: clear signal when debugging needed

---

## Questions to Address in ADR (if created)

- What level of detail should diagnostic mode log (every function call vs. major steps)?
- Should diagnostic mode write to a file or just stdout?
- How does diagnostic mode interact with `--verbose` flag (if different)?
- Should there be structured output (JSON) for automated parsing?
- What performance overhead is acceptable in diagnostic mode?
- Should diagnostic mode include interactive features (pause, inspect)?
- How will diagnostic logging be instrumented without cluttering production code?

---

## Related Potential ADRs
- [Mocking Strategy for Graphics Dependencies](../must-document/RUNTIME/mocking-strategy-graphics-dependencies.md) - Primary use case for diagnostic mode
- [Modular Mock Architecture](./modular-mock-architecture.md) - Diagnostic mode can report per-mock status
- CLI Layer observability patterns (if separate ADR created)

---

## Additional Notes

**Context from ADR-003**:
Listed as third mitigation strategy (out of four) for managing "Maior fragilidade e custo de manutenção do harness headless":
1. Implementação prioritária de test handlers
2. Isolamento de mocks em módulos separados
3. **Modo diagnóstico (`--diagnostic`) para debug de inicialização**
4. Suite de testes validando inicialização headless

This positioning indicates diagnostic mode is considered essential, not optional.

**Potential Features** (extrapolated from needs):
- Color-coded output (green = success, red = failure)
- Timing information (ms per initialization step)
- Memory usage tracking
- Global object introspection (`--diagnostic --inspect-globals`)
- Mock status report (which mocks are active, which APIs are stubbed)
- Engine script loading order visualization

**CLI Integration**:
```bash
# Example usage (inferred):
node cli.js run-ttk --config project.config.json --diagnostic
node cli.js run-ttk --config project.config.json --diagnostic --verbose
```

**Score Justification** (90 points):
- Scope+Impact: 15 (affects developer experience, not runtime architecture)
- Cost to Change: 15 (instrumentation code spreads across RUNTIME module)
- Team Knowledge: 10 (all RUNTIME developers need to know about it)
- **Total: 90 (Consider category, near Must Document boundary)**

**Consideration for Consolidation**:
Could be documented as:
1. Stand-alone ADR (emphasizes importance of observability)
2. Subsection of "RUNTIME Initialization Strategy" ADR
3. Subsection of "Mocking Strategy" ADR (since primary use case is mock debugging)

Stand-alone justified if team values observability/developer experience as first-class architectural concern.

**Risk Mitigation Value**:
Given that HLD Section 10.1 identifies headless runtime incompatibility as **HIGH probability, BLOCKING impact** risk, diagnostic mode is a critical risk mitigation tool. May justify higher priority or separate documentation.
