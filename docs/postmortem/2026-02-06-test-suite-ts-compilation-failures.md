# Postmortem: Test Suite TypeScript Compilation Failures

**Date:** 2026-02-06
**Severity:** High (52 test suites failing)
**Resolution Time:** ~2 hours
**Status:** Partially resolved (6 remaining)

## Summary

A batch of 52 test suites failed to compile due to missing exports in barrel files, incorrect Jest module aliases, and orphaned tests referencing deleted code. The root cause was a combination of incomplete refactoring (exports not updated after code changes) and Jest configuration drift between packages.

## Impact

- **52 test suites** failing to compile (TS2305, TS2307, TS2724 errors)
- **CI/CD pipeline blocked** - tests could not run
- **Developer productivity** impacted - local test runs failing

## Timeline

| Time | Event |
|------|-------|
| T+0 | `pnpm test` reports 52 failed suites, 907 total tests |
| T+15m | Root cause identified: missing exports in `@coreto/core` barrel |
| T+30m | First batch of fixes: errors, DTOs, Jest aliases |
| T+60m | Orphaned CLI tests identified and removed |
| T+90m | Jest config restructured (core gets own config) |
| T+120m | Down to 6 failing suites (code errors, not config) |

## Root Causes

### 1. Missing Barrel Exports (35 tests)

**Symptom:**
```
Module '"@coreto/core"' has no exported member 'ValidationError'
Module '"@coreto/core"' has no exported member 'DataLoadError'
Module '"@coreto/core"' has no exported member 'ConfigError'
```

**Cause:** The `packages/core/src/index.ts` barrel file was missing:
- Error classes (`ValidationError`, `DataLoadError`, `ConfigError`, `DomainError`)
- DTO types (`AnchorLevelRangeDTO`, `TtkTargetDTO`, `PartyConfigDTO`, etc.)

**Fix:** Added exports to barrel:
```typescript
// Errors
export * from './core/errors/index.js';

// DTOs with original names (backward compatibility)
export {
  type AnchorLevelRangeDTO,
  type TtkTargetDTO,
  // ...
} from './infrastructure/config/schemas.js';
```

### 2. Jest Module Alias Misconfiguration (10 tests)

**Symptom:**
```
Cannot find module '@/tests/helpers/factories'
Cannot find module '@preload/index'
Cannot find module '@/domain/validation/party-validation'
```

**Cause:** Jest `moduleNameMapper` in `packages/electron/jest.config.js` was missing aliases for:
- `@/tests/*` → `tests/*`
- `@preload/*` → `src/preload/*`
- `@tests/*` → `tests/*`

**Fix:** Updated renderer project config:
```javascript
moduleNameMapper: {
  '^@/tests/(.*)$': '<rootDir>/tests/$1',
  '^@preload/(.*)$': '<rootDir>/src/preload/$1',
  // ...
}
```

### 3. TypeScript Config Not Applied to Tests (5 tests)

**Symptom:**
```
Property 'coreto' does not exist on type 'Window & typeof globalThis'
```

**Cause:** The `ts-jest` transform was using an inline tsconfig that didn't include type declaration files (`window.coreto.d.ts`).

**Fix:** Created `tsconfig.spec.json` and referenced it in Jest config:
```javascript
transform: {
  '^.+\\.tsx?$': [
    'ts-jest',
    { useESM: true, tsconfig: '<rootDir>/tsconfig.spec.json' }
  ]
}
```

### 4. Orphaned Test Files (7 tests)

**Symptom:**
```
Cannot find module '@coreto/cli/cli/commands/hello'
Cannot find module '@coreto/cli/cli/ui/ProgressBarManager'
```

**Cause:** CLI package was refactored/simplified but tests were not removed:
- `hello.test.ts` - Command no longer exists
- `ProgressBarManager.test.ts` - File deleted
- `SummaryFormatter.test.ts` - File deleted

**Fix:** Removed orphaned test files.

### 5. Jest Root Config Conflicts (duplicate test discovery)

**Symptom:** Same test file appearing twice in output, conflicting configurations.

**Cause:** Root `jest.config.js` had `roots: ['<rootDir>/packages']` which overlapped with package-specific Jest configs.

**Fix:**
- Removed `packages` from root Jest roots
- Each package now has its own Jest config
- Root config only handles `tests/` and `examples/`

### 6. Non-Test Files in `__tests__` Directories

**Symptom:**
```
Your test suite must contain at least one test.
```

**Cause:** Builder and Fake files in `src/main/services/__tests__/builders/` were being discovered as tests.

**Fix:** Added `testPathIgnorePatterns`:
```javascript
testPathIgnorePatterns: [
  '/__tests__/builders/',
  '/__tests__/fakes/',
  '/__tests__/fixtures/',
]
```

## Files Modified

| File | Change |
|------|--------|
| `packages/core/src/index.ts` | Added error exports, DTO exports |
| `packages/core/jest.config.js` | Created (new file) |
| `packages/core/package.json` | Updated test script |
| `packages/electron/jest.config.js` | Fixed aliases, added testPathIgnorePatterns |
| `packages/electron/tsconfig.spec.json` | Added paths, includes |
| `jest.config.js` (root) | Updated roots, testPathIgnorePatterns |
| `tests/unit/infrastructure/di/container.test.ts` | Rewritten to use public imports |

## Files Deleted

| File | Reason |
|------|--------|
| `packages/core/tests/unit/cli/commands/hello.test.ts` | Orphaned (code deleted) |
| `packages/core/tests/unit/cli/ui/ProgressBarManager.test.ts` | Orphaned (code deleted) |
| `packages/core/tests/unit/cli/ui/SummaryFormatter.test.ts` | Orphaned (code deleted) |
| `tests/unit/cli/` (directory) | Duplicate of package tests |

## Remaining Issues

6 test suites have **code errors** (not configuration issues):

| Test File | Issue |
|-----------|-------|
| `ExecuteBattleUseCase.test.ts` | Missing `TEST_CONSTANTS`, `PartyConfigFakeBuilder` |
| `GenerateReportUseCase.test.ts` | Missing `TEST_CONSTANTS`, builders |
| `ValidateTrechoUseCase.test.ts` | Missing `TEST_CONSTANTS`, builders |
| `BattleSimulator.test.ts` | Incorrect imports, missing mocks |
| `JsdomHeadlessRuntime.test.ts` | Incorrect imports |
| `sample-execution.integration.test.ts` | Mock not intercepting correctly |

## Lessons Learned

### 1. Barrel Export Discipline
When removing or renaming exports, always:
- Search for usages across the monorepo
- Update the barrel file
- Run full test suite before committing

### 2. Jest Config Per Package
Monorepo Jest configurations should be:
- Self-contained per package (own jest.config.js)
- Not dependent on root config for module resolution
- Explicitly define all aliases needed

### 3. Test File Organization
- Keep builders/fakes outside `__tests__` directories
- Use `testPathIgnorePatterns` for non-test support files
- Remove tests when source code is deleted

### 4. TypeScript Paths Alignment
Ensure alignment between:
- `tsconfig.json` paths
- Jest `moduleNameMapper`
- ts-jest inline tsconfig

## Prevention

1. **Pre-commit hook**: Run `pnpm test` before commits touching exports
2. **CI check**: Fail on TypeScript compilation errors in tests
3. **Documentation**: Document module alias patterns in CLAUDE.md
4. **Orphan detection**: Script to find tests importing non-existent modules

## Metrics

| Metric | Before | After |
|--------|--------|-------|
| Failing test suites | 52 | 6 |
| Passing tests | 892 | 1577 |
| Total test suites | 96 | 89 |
| Compilation errors | ~80 | 0 |
