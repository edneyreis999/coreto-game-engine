# ADR-026: jest-canvas-mock Library for Canvas API Stubbing

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-014, ADR-015

## Context and Problem Statement

The RUNTIME module's JSDOM environment lacks native Canvas API support, while RPG Maker MZ and PIXI.js heavily depend on Canvas for rendering contexts (`getContext('2d')`, `getContext('webgl')`). Without Canvas API stubs, the engine initialization crashes when attempting Canvas context creation, blocking headless battle simulation.

JSDOM's minimal Canvas support is insufficient for the graphics initialization sequences in RPG Maker MZ. The team must decide between implementing custom Canvas API mocks (covering dozens of methods) or leveraging an existing community-proven library.

This decision addresses a specific gap in the broader graphics mocking strategy: providing Canvas API compatibility with minimal development and maintenance effort.

## Decision Drivers

- Engine crashes during Canvas context creation without proper API stubs
- Canvas 2D API contains 50+ methods requiring implementation or mocking
- Manual stub implementation is tedious, error-prone, and incomplete
- Community libraries offer proven, tested Canvas mocking solutions
- Lightweight solution needed without native dependencies or compilation overhead
- WebGL context support may be required for advanced graphics features

## Considered Options

1. **jest-canvas-mock library** (Chosen)
2. Manual Canvas API stub implementation
3. node-canvas (actual Canvas implementation in Node.js)

## Decision Outcome

Chosen option: **jest-canvas-mock**, because it provides comprehensive Canvas 2D API coverage through a lightweight, dependency-free library that is proven in the Jest testing community. The library eliminates the need for manual stub implementation while avoiding the heavy native dependencies of full Canvas implementations.

The library is imported in Jest setup files and automatically mocks HTMLCanvasElement and CanvasRenderingContext2D methods, enabling Canvas API calls to succeed without crashes.

## Pros and Cons of the Options

### jest-canvas-mock Library

**Pros**

- Comprehensive Canvas 2D API coverage without manual implementation
- Lightweight with no native dependencies or compilation requirements
- Proven in community with active GitHub repository and Stack Overflow validation
- Simple integration via single import in Jest setup files

**Cons**

- External dependency adds maintenance risk if library is abandoned
- Limited or no WebGL context support may require supplemental mocks
- Black-box implementation makes debugging Canvas-related issues harder
- Locked into library's update cycle for compatibility with Jest versions

### Manual Canvas API Stub Implementation

**Pros**

- Complete control over stub behavior and debugging
- No external dependencies or version compatibility concerns
- Tailored implementation matching exact project needs

**Cons**

- Requires implementing 50+ Canvas API methods manually
- High initial development effort and ongoing maintenance burden
- Error-prone with high risk of incomplete coverage
- Must track Canvas API evolution across browser versions

### node-canvas (Actual Canvas Implementation)

**Pros**

- Provides real Canvas implementation with full API compatibility
- Supports both Canvas 2D and WebGL contexts
- Produces actual rendering output for debugging

**Cons**

- Heavy dependency requiring C++ compilation and native bindings
- Significant installation complexity and deployment overhead
- Overkill for tests that don't require actual rendering
- Performance overhead incompatible with high-speed simulation needs

## Consequences

The project adopts jest-canvas-mock as the standard Canvas API mocking solution for the RUNTIME module, introducing an external dependency that must be maintained across Jest and Node.js version updates.

WebGL context support remains a potential gap. If RPG Maker MZ or VisuStella plugins require WebGL beyond what jest-canvas-mock provides, supplemental mocks must be implemented. The team should validate WebGL compatibility during initial engine integration testing.

The library's black-box nature means Canvas-related debugging requires understanding both application code and library internals. Developers must recognize that Canvas APIs are mocked and results do not reflect actual rendering behavior.

If the library is abandoned or becomes incompatible with future Jest versions, the team faces migration to alternative solutions or forking the library for internal maintenance.

## References

- docs/pesquisas/Balanceamento Determinístico RPG Maker MZ.md:184-198
- docs/hld-coreto-game-engine.md:149
