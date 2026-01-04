# ADR-029: TSyringe DI Container

**Status:** Accepted
**Date:** 2026-01-04
**Related ADRs:** ADR-028 (TypeScript), ADR-001 (Foundation)

## Context and Problem Statement

The coreto game engine follows Clean Architecture principles with strict separation between domain, application, and infrastructure layers. This architecture requires dependency inversion through ports and adapters pattern, where high-level modules depend on abstractions (interfaces) rather than concrete implementations.

Without a Dependency Injection (DI) container, manual wiring of dependencies becomes verbose and error-prone, especially when constructing complex object graphs with multiple layers of dependencies. The project needs a type-safe DI solution that integrates seamlessly with TypeScript decorators and supports constructor injection patterns.

## Decision Drivers

- TypeScript-first design with full type inference for injected dependencies
- Decorator-based configuration to minimize boilerplate code
- Support for interface-based tokens (InjectionToken<T>) for port/adapter binding
- Lightweight runtime overhead suitable for CLI application context
- Compatibility with strict TypeScript mode and experimentalDecorators
- Clear separation between container configuration and business logic
- No framework lock-in (dependency injection as infrastructure concern only)

## Considered Options

1. TSyringe (Microsoft) - Decorator-based DI container with typed tokens
2. InversifyJS - Feature-rich IoC container with middleware support
3. Awilix - Lightweight DI container with auto-registration
4. Manual DI - Constructor injection without container automation

## Decision Outcome

Chosen option: TSyringe (Microsoft), because it provides the optimal balance between type safety, developer ergonomics, and runtime simplicity. The decorator-based approach (@injectable, @inject) reduces boilerplate while maintaining explicit dependency declarations. Typed injection tokens enable compile-time verification of port/adapter bindings without string-based identifiers.

The solution aligns with the TypeScript-first decision (ADR-028) and supports the clean architecture requirement of decoupling layers through interface abstractions.

## Pros and Cons of the Options

### TSyringe

**Pros:**

- Decorator-based API (@injectable, @inject) minimizes configuration code
- InjectionToken<T> provides type-safe binding between interfaces and implementations
- Lightweight runtime (~5KB minified) suitable for CLI context
- Maintained by Microsoft with active TypeScript compatibility
- Supports constructor injection, property injection, and factory providers
- Clear error messages for missing or circular dependencies

**Cons:**

- Requires experimentalDecorators and emitDecoratorMetadata in tsconfig.json
- Reflection-based approach adds minor runtime overhead for metadata access
- Less feature-rich than InversifyJS (no middleware, no container hierarchies)
- Container must be explicitly configured (no auto-scanning like Awilix)

### InversifyJS

**Pros:**

- Enterprise-grade feature set including middleware and container modules
- Extensive documentation and large community
- Support for contextual bindings and conditional injection

**Cons:**

- Heavier runtime footprint (~50KB) excessive for CLI tool
- More complex API with string-based TYPES identifiers reduces type safety
- Requires manual Symbol declarations for each injectable type
- Overkill for project scope (middleware and advanced features unused)

### Awilix

**Pros:**

- Auto-registration via file system scanning reduces manual configuration
- Supports both constructor injection and function currying patterns
- No decorator dependency (works without experimentalDecorators)

**Cons:**

- Weaker TypeScript integration (no compile-time token validation)
- Auto-registration magic can obscure dependency graph in complex projects
- Function-based API less idiomatic for class-based Clean Architecture
- Harder to enforce interface-based dependency contracts

### Manual DI

**Pros:**

- Zero runtime dependencies and maximum transparency
- Full control over object construction and lifecycle
- No decorator metadata overhead

**Cons:**

- High boilerplate for dependency wiring in composition root
- Error-prone manual graph construction for deep dependency trees
- Difficult to swap implementations without modifying multiple files
- No compile-time validation of dependency completeness

## Consequences

The introduction of TSyringe establishes a clear composition root pattern where container configuration happens once at application startup (CLI bootstrap). All domain and application layer code remains container-agnostic, depending only on TypeScript interfaces.

Developers must enable experimentalDecorators in tsconfig.json, which is a widely adopted pattern in TypeScript ecosystem (used by NestJS, TypeORM, etc.). The @injectable decorator becomes mandatory for all application services and infrastructure adapters.

The typed token pattern (InjectionToken<IRepository>) enforces compile-time validation of port/adapter bindings, catching configuration errors before runtime. However, the container configuration itself becomes a critical dependency graph that must be tested independently.

The lightweight footprint ensures minimal impact on CLI startup time, maintaining the performance characteristics required for rapid validation cycles. The clear separation between DI infrastructure and business logic preserves portability if migration to a different container becomes necessary in future versions.

## References

- TSyringe GitHub: https://github.com/microsoft/tsyringe
- ADR-028: TypeScript as Primary Implementation Language
- HLD Section 5.2: Dependency Injection Pattern
- Clean Architecture principles: Robert C. Martin, "Clean Architecture" (2017)
