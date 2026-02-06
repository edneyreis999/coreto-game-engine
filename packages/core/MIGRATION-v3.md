# Migration Guide: v2 → v3

## Breaking Changes

### Public API Reduction

Infrastructure internals are no longer exported from the main entry point. This is a **BREAKING CHANGE** that requires updating imports in consuming code.

**Before (v2):**
```typescript
import { HeadlessRuntimeBootstrapper, BattleSimulator } from '@coreto/core';
```

**After (v3):**
```typescript
// Production: Use public APIs only
import { ExecuteBattleUseCase, registerDependencies } from '@coreto/core';

// Testing: Import from /testing subpath
import { HeadlessRuntimeBootstrapper, BattleSimulator } from '@coreto/core/testing';
```

## What's Still Exported

### Domain Layer (Stable)

- **Value Objects:** `AnchorLevelRange`, `TtkTarget`, `TtkMetrics`, `Warning`
- **Entities:** `Trecho`, `PartyConfig`, `BattleResult`, `Report`
- **Use Cases:** `ExecuteBattleUseCase`, `ValidateTrechoUseCase`, `GenerateReportUseCase`
- **Domain Errors:** `DomainError`, `ValidationError`, `ConfigError`, `DataLoadError`, `BattleTimeoutError`, `SkillFormulaError`, `FileSystemError`

### Port Interfaces (Stable - Type-only)

- `ILogger`, `IFileSystem`, `IConfigLoader`, `IDataLoader`, `IBattleSimulator`, `IReporter`, `IHeadlessRuntime`
- Associated types: `ProjectConfig`, `RmmzDatabase`, `DatabaseObjects`, `BattleSetup`, `WarningType`, `WarningSeverity`

### DI Container (Stable)

- `registerDependencies()`, `clearContainer()`, `resolve()`, `container`
- DI tokens: `ILoggerToken`, `IFileSystemToken`, `IConfigLoaderToken`, `IDataLoaderToken`, `IBattleSimulatorToken`, `IReporterToken`, `IHeadlessRuntimeToken`

### Schemas (Stable)

- Zod schemas for configuration and reports
- DTO types: `WarningDTO`, `ActorDTO`, `ActionDTO`, `TurnDTO`, `BattleResultDTO`, `TrechoAggregatesDTO`, `TrechoReportDTO`, `ReportMetadataDTO`, `ReportSummaryDTO`, `ReportDTO`, `AnchorLevelRangeDTO`, `TtkTargetDTO`, `PartyMemberDTO`, `PartyConfigDTO`, `TrechoDTO`, `ProjectConfigDTO`

### Configuration Loader (Stable)

- `ZodConfigLoader`

## What's No Longer Exported (Use /testing)

**Infrastructure Internals (Unstable) - use `/testing` subpath:**

- Runtime bootstrapper: `HeadlessRuntimeBootstrapper`
- Runtime shims and overrides: `HeadlessOverrides`, PIXI shims, audio shims, graphics shims
- Battle simulator implementation: `BattleSimulator` (use `IBattleSimulator` interface in production)
- Adapters: `NodeFileSystem`, `ConsoleLogger`, `JsonReporter`, `RmmzDataLoader`, `IntegrityValidator`, `RmmzProjectValidator`
- Security guards: `ReadOnlyGuard`, `PathSanitizer`
- Simulation internals: `TtkMeasurer`, `DeterministicRNG`, `SkillSelector`

## Migration Steps

### 1. Audit Imports

Search your codebase for imports from `@coreto/core`:

```bash
grep -rn "from '@coreto/core'" --include="*.ts" --include="*.tsx"
```

### 2. Categorize Imports

For each import, determine if it's:
- **Public API** (Domain, Use Cases, Ports, DI, Schemas) → Keep as-is
- **Infrastructure** (Adapters, Runtime, Simulation) → Move to `/testing`

### 3. Update Test Files

Move infrastructure-only imports to the `/testing` subpath:

```typescript
// Before
import { HeadlessRuntimeBootstrapper, BattleSimulator } from '@coreto/core';
import { IntegrityValidator } from '@coreto/core';

// After
import { HeadlessRuntimeBootstrapper, BattleSimulator, IntegrityValidator } from '@coreto/core/testing';
```

### 4. Update Package Dependencies

Update `package.json` in consuming packages:

```json
{
  "dependencies": {
    "@coreto/core": "^3.0.0"
  }
}
```

### 5. Run Tests

Ensure all tests pass after migration:

```bash
pnpm install
pnpm type-check
pnpm test
```

## Examples

### Production Code (No Changes Needed)

```typescript
// Use case-based API (recommended)
import { ExecuteBattleUseCase, registerDependencies } from '@coreto/core';

// Register dependencies
registerDependencies();

// Resolve use case
const useCase = resolve(ExecuteBattleUseCase);

// Execute
const result = await useCase.execute({ troopId: 1, party, seed: 12345 });
```

### Test Code (Use /testing Subpath)

```typescript
import { HeadlessRuntimeBootstrapper, BattleSimulator } from '@coreto/core/testing';
import { IntegrityValidator } from '@coreto/core/testing';

describe('Battle Simulation', () => {
  it('should simulate battles', async () => {
    const bootstrapper = new HeadlessRuntimeBootstrapper();
    await bootstrapper.bootstrap(projectPath);

    const simulator = new BattleSimulator();
    await simulator.initialize(database, projectPath);

    const result = await simulator.executeBattle({ troopId: 1, party, seed: 12345 });
    expect(result.outcome).toBe('victory');
  });
});
```

## Benefits

This change provides:

1. **Clearer API Surface** - Public exports reflect the stable domain layer
2. **Better Semantics** - Infrastructure internals are marked as testing-only
3. **Future Flexibility** - Implementation details can change without breaking public API
4. **Documentation** - `/testing` subpath clearly indicates unstable APIs

## Support

For migration questions or issues, please refer to:
- Architecture documentation: `docs/adrs/`
- Code examples: `packages/core/tests/`
