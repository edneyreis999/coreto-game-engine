# ADR-024: Synchronous File Write Strategy for Report Output

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-011

---

## Context and Problem Statement

The REPORTER module must write validation results to `report/report.json` at pipeline completion. This decision addresses the I/O pattern for the final file write operation that serializes all battle simulation results to disk.

The choice between synchronous and asynchronous file I/O affects pipeline completion semantics, error handling patterns, and future concurrency capabilities. The system operates as a single-user batch CLI processing ~200 battles with expected report sizes under 10MB.

## Decision Drivers

- **MVP simplicity priority**: Minimize async complexity for v1 implementation
- **Batch CLI semantics**: Single-user execution model with linear pipeline flow
- **Single write operation**: One file write at pipeline completion, no concurrent I/O
- **Error handling clarity**: Deterministic completion guarantees before CLI exit
- **Performance acceptable**: Expected write time <100ms for typical report sizes
- **Future extensibility**: Potential migration to async for concurrent processing or UI integration

## Considered Options

1. **Synchronous I/O with fs.writeFileSync** (chosen)
2. **Asynchronous I/O with fs.promises**
3. **Streaming I/O with fs.createWriteStream**

## Decision Outcome

Chosen option: **Synchronous I/O with fs.writeFileSync**, because it provides simplest implementation for single-file write at pipeline completion, guarantees write completion before CLI exit, and aligns with batch processing semantics where event loop blocking is acceptable.

The synchronous approach uses try/catch error handling and ensures the file write completes before the CLI returns control to the user, eliminating race conditions between write completion and process exit.

## Pros and Cons of the Options

### Synchronous I/O with fs.writeFileSync

**Pros:**

- Linear control flow eliminates promise chain complexity
- Try/catch error handling is straightforward and deterministic
- Guaranteed write completion before CLI exit code
- No race conditions or async timing bugs
- Conceptually simpler for batch processing model

**Cons:**

- Blocks Node.js event loop during write operation
- Not idiomatic for Node.js async-first ecosystem
- Future async refactoring requires pattern change
- Potential bottleneck if report sizes exceed 100MB

### Asynchronous I/O with fs.promises

**Pros:**

- Non-blocking event loop follows Node.js best practices
- Enables concurrent operations during write
- Better suited for future UI integration
- Scales better for very large files

**Cons:**

- Adds async/await complexity for single write operation
- Requires promise rejection handling
- No concurrency benefit for single-file batch CLI
- Increases cognitive load for minimal functional gain

### Streaming I/O with fs.createWriteStream

**Pros:**

- Optimal for very large files exceeding memory limits
- Memory-efficient for chunked writes
- Supports backpressure handling

**Cons:**

- Significant complexity increase for stream management
- Overkill for expected report sizes under 10MB
- Requires event listener pattern for completion
- No benefits for in-memory JSON serialization approach

## Consequences

**Positive:**

- Simplified codebase with linear control flow and no async overhead
- Deterministic pipeline completion semantics ensure file write before CLI exit
- Standard try/catch error handling requires no special promise rejection logic

**Negative:**

- Event loop blocking prevents concurrent operations during write, though irrelevant for single-user batch CLI
- Future migration to async I/O for concurrent processing or Electron UI requires refactoring
- Large reports exceeding 50MB may cause perceptible delays above 100ms threshold

**Mitigation:**

Performance monitoring should track write times and log warnings if operations exceed 1 second. If future requirements introduce concurrent processing or UI responsiveness needs, async refactoring path is well-defined with minimal risk.

## References

- `docs/hld-coreto-game-engine.md:172-186` - Reporter Layer definition
- `docs/hld-coreto-game-engine.md:186` - Synchronous writeFileSync specification
