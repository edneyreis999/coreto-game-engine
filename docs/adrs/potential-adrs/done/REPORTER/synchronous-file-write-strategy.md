# Potential ADR: Synchronous File Write Strategy for Report Output

**Module**: REPORTER
**Category**: Performance/Architecture
**Priority**: Consider (Score: 85/150)
**Date Identified**: 2026-01-04

---

## What Was Identified

The REPORTER module is designed to use **synchronous file I/O** (`fs.writeFileSync`) for writing the final `report/report.json`, rather than asynchronous operations (`fs.promises.writeFile` or callbacks). This decision affects the final step of the validation pipeline where all results are serialized to disk.

The decision encompasses:
- **Synchronous API**: `fs.writeFileSync` (blocks Node.js event loop)
- **Single file write**: One write operation at pipeline completion
- **Blocking semantics**: Pipeline doesn't complete until file is written
- **Error handling**: Synchronous try/catch pattern vs. async error handling

This pattern was documented in HLD Section 3.6 ("Node.js `fs` (writeFileSync), JSON serialization") and appears to be a deliberate simplicity choice for MVP v1.

## Why This Might Deserve an ADR

**Impact**: Affects pipeline completion semantics and error handling
- Determines when CLI can return control to user (after file write completes)
- Influences error handling strategy (synchronous vs. asynchronous)
- Affects concurrency patterns (blocking vs. non-blocking)
- Shapes future async refactoring (if needed for performance)

**Trade-offs**: Simplicity vs. asynchronicity
- **Blocking vs. Non-blocking**: Simpler code (no callbacks/promises) but blocks event loop during write
- **Error handling**: Try/catch (sync) vs. promise rejection (async)
- **Performance**: Negligible for MVP (single file, ~KB-MB size) but could matter if reports grow large
- **Concurrency**: Prevents concurrent operations during write (not an issue for CLI batch processing)

**Complexity**: Low for current design, but implications for evolution
- Synchronous I/O is simpler to reason about (linear control flow)
- No need for async/await or callback management
- Future async refactoring would require pattern change across module

**Team Knowledge**: Low cognitive load
- Synchronous I/O is conceptually simpler (most developers understand)
- Error handling follows standard try/catch pattern
- No promise chain or async/await complexity

**Future Implications**: Limited but worth considering
- **Large reports**: If reports grow to hundreds of MB, sync I/O could cause perceptible delays
- **Streaming writes**: Future optimization (e.g., write-per-trecho) would require async refactor
- **Parallel processing**: If future Worker Threads emit reports concurrently, sync I/O becomes bottleneck
- **UI responsiveness**: Future Electron UI might need async to avoid UI freezing

## Evidence Found in Codebase

### Key Files
This is a **documentation-only decision** (greenfield project). Evidence comes from:

- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Lines 172-186 (Reporter Layer definition)
- [`docs/hld-coreto-game-engine.md`](../../../docs/hld-coreto-game-engine.md) - Line 186 ("Node.js `fs` (writeFileSync), JSON serialization")

### Code Evidence (from documentation)

**Reporter Layer Technologies (HLD Section 3.6):**
```
Tecnologias: Node.js `fs` (writeFileSync), JSON serialization
```

**Reporter Layer Responsibilities (HLD Section 3.6):**
- "Serializar `report/report.json` com estrutura completa"
- "Directory manager (create `report/` if needed)"

**Implied workflow** (HLD Section 4.1, Step 7):
```
7. Reporter Layer
   - Coleta resultados de todas as simulações
   - Calcula agregados por trecho (média, p95 de TTK)
   - Gera warnings (TTK fora da tolerância, troops inexistentes)
   - Serializa report/report.json  [← synchronous step]

8. CLI Layer
   - Exibe resumo no terminal
   - Finaliza com exit code 0 ou 1  [← happens AFTER write completes]
```

**Performance context** (HLD Section 7.3):
- Target: ≤10 minutes total execution
- ~200 battles estimated
- Report size: Not specified, but typical JSON likely <10MB

### Impact Analysis
- **Project Phase**: Planning/Documentation (TRL 3)
- **Decision Date**: Documented 2026-01-04 (HLD creation)
- **Files Affected**: Future implementation (`src/reporter/writer.js` or similar)
- **Modules Affected**:
  - REPORTER (file write logic)
  - CLI (waits for write completion before exit)

### Alternatives (implicit from Node.js ecosystem)

**Synchronous I/O (chosen):**
```javascript
// Documented approach
const fs = require('fs');
try {
  fs.writeFileSync('report/report.json', JSON.stringify(report));
  console.log('Report written successfully');
  process.exit(0);
} catch (err) {
  console.error('Failed to write report:', err);
  process.exit(1);
}
```

**Asynchronous I/O (not chosen):**
```javascript
// Alternative 1: Promises
const fs = require('fs').promises;
try {
  await fs.writeFile('report/report.json', JSON.stringify(report));
  console.log('Report written successfully');
  process.exit(0);
} catch (err) {
  console.error('Failed to write report:', err);
  process.exit(1);
}

// Alternative 2: Callbacks
const fs = require('fs');
fs.writeFile('report/report.json', JSON.stringify(report), (err) => {
  if (err) {
    console.error('Failed to write report:', err);
    process.exit(1);
  }
  console.log('Report written successfully');
  process.exit(0);
});
```

**Streaming I/O (not chosen):**
```javascript
// Alternative 3: Streams (for very large files)
const fs = require('fs');
const stream = fs.createWriteStream('report/report.json');
stream.write(JSON.stringify(report));
stream.end();
stream.on('finish', () => process.exit(0));
stream.on('error', (err) => process.exit(1));
```

**Rationale for synchronous choice** (inferred):
- **Simplicity**: MVP v1 prioritizes simplicity over async complexity
- **Linear flow**: Batch CLI processing doesn't benefit from async I/O
- **Single write**: Only one file write at end of pipeline (no concurrency benefits)
- **Error handling**: Try/catch is simpler than promise rejection handling
- **Performance acceptable**: For expected report sizes (<10MB), write time negligible (<100ms)

**When async would be preferred:**
- Multiple concurrent file writes (not applicable to single report.json)
- Very large files (>100MB) where blocking matters
- Server environments serving concurrent requests (CLI is single-user)
- UI contexts requiring responsiveness (MVP v1 has no UI)

## Questions to Address in ADR (if created)

**Context and Problem:**
- What is expected report file size range (KB? MB? GB)?
- How long does writeFileSync take for typical reports?
- Does blocking event loop matter for single-user CLI?

**Decision:**
- Why synchronous over asynchronous file I/O?
- What are acceptable performance characteristics?
- Is simplicity prioritized over async best practices?

**Alternatives Considered:**
- **Async/await with fs.promises**: Modern async pattern
- **Callback-based fs.writeFile**: Traditional async approach
- **Streaming writes**: For very large files
- **Batched writes**: Write per-trecho instead of single file

**Consequences:**
- **Positive**:
  - Simpler code (linear control flow, no promises)
  - Easier error handling (try/catch)
  - Guaranteed completion before CLI exits
  - No race conditions or async bugs

- **Negative**:
  - Blocks Node.js event loop during write (not idiomatic)
  - Can't perform other operations during write (not relevant for CLI)
  - Future async refactoring requires pattern change
  - May become bottleneck if reports grow very large

- **Risks**:
  - Large reports (>100MB) could cause perceptible delays
  - Concurrent processing (future Worker Threads) blocked by sync write
  - Future Electron UI might freeze during write

- **Mitigation**:
  - Monitor report file sizes in production
  - Add performance threshold (if write >1s, log warning)
  - Document refactoring path to async if needed

## Related Potential ADRs
- **json-report-output-format.md** (this module): Single-file JSON format complements synchronous write strategy
- **Future consideration**: Report streaming or chunked writes (if file size becomes issue)
- **Future consideration**: Parallel execution with concurrent report writes

## Additional Notes

**Greenfield Status**: This decision exists only in documentation. No implementation code has been written yet. The I/O strategy was implicitly chosen in HLD by specifying `writeFileSync`.

**Node.js Best Practices Context**:
- **Node.js docs recommend async I/O** for most scenarios to avoid blocking event loop
- **Exception for CLIs**: Single-user, batch-processing CLIs often use sync I/O for simplicity
- **Examples**:
  - NPM CLI uses `writeFileSync` for package.json writes
  - Many Node.js build tools (Webpack, Rollup) use sync I/O for final output

**Performance estimates** (rough calculation):
- Expected report size: ~1MB (200 battles × ~5KB/battle JSON)
- SSD write speed: ~500 MB/s
- Estimated write time: ~2ms (negligible)
- JSON serialization time likely dominates I/O time

**When this becomes a problem:**
- Report size >50MB: Write time >100ms (perceptible)
- Concurrent writes (future): Synchronous becomes bottleneck
- Electron UI (future): UI freezes during write

**Comparison to similar tools**:
- **Jest**: Uses async file I/O for test reports (supports parallel test execution)
- **ESLint**: Uses sync file I/O for simplicity (single-threaded linting)
- **Webpack**: Uses async for incremental builds, sync for final bundle write

**Scoring Rationale**:
- **Scope + Impact**: 15/25 (affects REPORTER only, limited blast radius)
- **Cost to Change**: 15/25 (refactoring sync→async is straightforward, low risk)
- **Team Knowledge**: 10/25 (most developers understand both patterns, low cognitive load)
- **Base Score**: 45 (implementation detail, not foundational architecture)
- **Total**: 85/150 → Consider (worth documenting rationale, but lower priority than foundational decisions)

**Recommendation**: Document this decision IF:
1. Performance monitoring shows write times >100ms, OR
2. Future async refactoring is planned (to explain original rationale), OR
3. Team has questions about why sync I/O was chosen
