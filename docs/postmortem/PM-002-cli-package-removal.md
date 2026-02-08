# CLI Package Removal - Postmortem

**Date**: 2026-02-07  
**Impact**: Configuration cleanup, no functional changes  
**Status**: ✅ Complete

## Issue

The `@coreto/cli` package was deprecated from the project but directory and references remained in the codebase, causing ESLint errors during health check.

## Root Cause

- CLI package directory still existed at `packages/cli/`
- Configuration files referenced the CLI package:
  - `jest.config.js` - Module name mappers
  - `jest.config.js` - Coverage exclusions
  - `packages/core/jest.config.js` - Test path ignore patterns
  - `scripts/validate-architecture.ts` - Layer boundaries
- Test files in `packages/core/tests/unit/cli/` imported from deleted package

## Resolution

### Files Modified

1. **scripts/validate-architecture.ts**
   - Removed `cli: 'packages/cli'` from LAYERS constant

2. **jest.config.js**
   - Removed `@coreto/cli` module name mappers (lines 44-45)
   - Removed coverage exclusion for CLI entry point (line 57)

3. **packages/core/jest.config.js**
   - Removed `/tests/unit/cli/` from testPathIgnorePatterns

### Directories Removed

1. **packages/cli/** - Entire CLI package directory
   - `src/cli/commands/export-context.ts`
   - `src/cli/commands/index.ts`
   - `src/cli/commands/run-ttk.ts`
   - `src/cli/ui/DiagnosticLogger.ts`
   - `tsconfig.json` (created during health check fix)

2. **packages/core/tests/unit/cli/** - CLI-specific tests
   - `commands/run-ttk.test.ts`
   - `ui/DiagnosticLogger.test.ts`

## Verification

After removal, all health checks pass:

| Check | Result |
|-------|--------|
| ESLint | ✅ 0 errors, 7 warnings |
| Type check | ✅ Pass |
| Build | ✅ Pass |
| Tests | ✅ 532 passed, 31 suites |

## Related ADRs

- **ADR-032**: Electron Dev Portal - Mentions CLI for automation but project moved to GUI-only
- **ADR-007**: Oclif CLI Framework - Superseded by Electron-based approach

## Lessons Learned

1. When deprecating a package, remove all references in configuration files
2. Clean up test directories that import from deprecated packages
3. Run ESLint with all package configurations to catch orphaned files

## Future Considerations

- Update ADR-032 to reflect CLI removal decision
- Consider creating formal ADR for package deprecation process
