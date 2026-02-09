# Electron Package - Import Conventions

This document defines the standardized import conventions for the `@coreto/electron` package to ensure consistency and maintainability.

## Import Conventions

### Cross-Layer Imports (Domain)

Use module aliases when importing from the domain layer:

```typescript
// ✅ CORRECT
import { validateTrecho } from '@coreto/electron/domain/use-cases';
import type { TrechoConfig } from '@coreto/electron/domain/types';
import type { IProjectValidator } from '@coreto/electron/domain/ports';
import { ProjectConfigSchema } from '@coreto/electron/domain/schemas';

// ❌ WRONG
import { validateTrecho } from '../../../domain/use-cases';
import type { TrechoConfig } from '../../domain/types';
```

**Rationale:** Domain layer is shared across main and renderer processes. Module aliases provide process-agnostic imports and prevent brittle relative path chains.

### Intra-Layer Imports (Infrastructure)

Use relative imports within the same layer (main process infrastructure):

```typescript
// ✅ CORRECT (within main/)
import type { ReportData } from '../ipc/types.js';
import { wrapHandler } from './ipc-response.js';
import { getDatabase } from '../database/index.js';
import { createProjectValidator } from '../adapters/index.js';

// ❌ WRONG
import type { ReportData } from '@coreto/electron/main/ipc/types';
import { wrapHandler } from '@coreto/electron/main/ipc/ipc-response';
```

**Rationale:** Infrastructure code within the same layer (main process) is tightly coupled. Relative imports make local refactoring easier and avoid unnecessary alias configuration.

### Renderer Internal Imports

Use `@/*` alias for renderer-internal imports:

```typescript
// ✅ CORRECT
import { Button } from '@/components/ui/button';
import { useLogger } from '@/hooks/useLogger';
import { cn } from '@/lib/utils';

// ❌ WRONG
import { Button } from '../../../components/ui/button';
import { useLogger } from '../../hooks/useLogger';
```

**Rationale:** Renderer code is browser-based React application. The `@/*` alias is the conventional pattern in React/Vite projects and matches the electron-vite defaults.

### Bundler-First Strategy (ESM Extensions)

**Configuration:** `"moduleResolution": "bundler"` in tsconfig.json (TypeScript 5.0+)

This project uses a **bundler-first** approach: code is bundled by electron-vite (Vite + esbuild) before execution. This allows cleaner imports without `.js` extensions in bundled contexts.

#### Bundled Code (No .js Extension Needed)

The following directories are **always bundled** by electron-vite:

```typescript
// ✅ CORRECT - Extensionless imports OK in bundled contexts
// src/main/** (main process - bundled by electron-vite)
import { getDatabase } from '../database';
import { wrapHandler } from './ipc-response';

// src/renderer/** (renderer process - bundled by Vite)
import { Button } from '@/components/ui/button';
import { useConfig } from '@/hooks/useConfig';
```

**Why:** Vite/esbuild resolve extensionless imports automatically during bundling. Runtime receives bundled output, not raw TypeScript.

#### Unbundled Code (.js Extension REQUIRED)

The following contexts **may run without bundler** and require explicit `.js` extensions per ESM spec:

```typescript
// ⚠️ REQUIRED - .js extension mandatory in unbundled contexts
// src/preload/** (may execute before bundler)
import { contextBridge } from 'electron';
import { exposeAPI } from './api.js';  // ← .js required

// scripts/** (Node.js scripts)
import { config } from './config.js';  // ← .js required

// tools/** (build tools)
import { helper } from '../helpers/util.js';  // ← .js required
```

**Why:** These files may be executed directly by Node.js/Electron without going through the bundler. ESM requires explicit extensions for relative imports.

#### Quick Reference

| Directory | Bundled? | .js Extension? | Validation |
|-----------|----------|----------------|------------|
| `src/main/**` | ✅ Yes | Optional | Architecture test allows both |
| `src/renderer/**` | ✅ Yes | Optional | Architecture test allows both |
| `src/preload/**` | ⚠️ Maybe | **Required** | Architecture test enforces |
| `scripts/**` | ❌ No | **Required** | Architecture test enforces |
| `tools/**` | ❌ No | **Required** | Architecture test enforces |

**Enforcement:** Architecture Rule 6 validates that unbundled contexts use `.js` extensions.

## Module Alias Configuration

Module aliases are configured in three locations (multi-config requirement):

### 1. TypeScript Configuration

**Base tsconfig.json** - Shared aliases for all processes:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/renderer/src/*"],
      "@coreto/electron/domain/*": ["./src/domain/*"]
    }
  }
}
```

**Note:** The base tsconfig uses project references. Actual compilation uses `tsconfig.web.json` (renderer) and `tsconfig.node.json` (main/preload).

### 2. Vite Configuration

**electron.vite.config.ts** - Runtime module resolution:

```typescript
const sharedDomainAliases = {
  '@coreto/electron/domain': resolve(__dirname, 'src/domain'),
  '@coreto/electron/domain/use-cases': resolve(__dirname, 'src/domain/use-cases/index.ts'),
  '@coreto/electron/domain/ports': resolve(__dirname, 'src/domain/ports/index.ts'),
  '@coreto/electron/domain/types': resolve(__dirname, 'src/domain/types/index.ts'),
  '@coreto/electron/domain/schemas': resolve(__dirname, 'src/domain/schemas/index.ts'),
  // ... other domain subpaths
};

export default defineConfig({
  main: {
    resolve: {
      alias: sharedDomainAliases
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src'),
        ...sharedDomainAliases
      }
    }
  }
});
```

### 3. Jest Configuration

**jest.config.js** - Test module resolution:

```javascript
module.exports = {
  projects: [
    {
      displayName: 'main',
      testMatch: ['<rootDir>/tests/main/**/*.test.ts'],
      moduleNameMapper: {
        '@coreto/electron/domain/(.*)': '<rootDir>/src/domain/$1',
      }
    },
    {
      displayName: 'renderer',
      testMatch: ['<rootDir>/tests/renderer/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/renderer/src/$1',
        '@coreto/electron/domain/(.*)': '<rootDir>/src/domain/$1',
      }
    }
  ]
};
```

## Migration Status

The following files have been refactored to follow these conventions:

**Completed:**
- ✅ `src/main/ipc/handlers.ts` - Domain imports use aliases
- ✅ `src/main/services/config-service.ts` - Internal imports use relative paths
- ✅ `src/main/adapters/project-validator-adapter.ts` - Domain imports use aliases

**Pending (TODO):**
- Remaining ~27 files in `src/main/` - See CLAUDE-ARCH-CONVENTION comments
- Files will be refactored incrementally during future changes

## Common Mistakes to Avoid

### 1. Mixing Relative and Alias Imports

```typescript
// ❌ WRONG - Inconsistent mixing
import { validateTrecho } from '@coreto/electron/domain/use-cases';
import type { ReportData } from '../../ipc/types.js';  // Same layer, should use relative

// ✅ CORRECT - Consistent pattern
import { validateTrecho } from '@coreto/electron/domain/use-cases';  // Cross-layer
import type { ReportData } from '../ipc/types.js';  // Same layer
```

### 2. Forgetting .js Extension in Unbundled Contexts

```typescript
// ⚠️ CONTEXT MATTERS - Bundled vs Unbundled

// ✅ BUNDLED CODE (src/main/**, src/renderer/**) - .js optional
import { wrapHandler } from './ipc-response';  // OK - bundler resolves
import { getDatabase } from '../database';      // OK - bundler resolves

// ❌ UNBUNDLED CODE (src/preload/**, scripts/**) - .js REQUIRED
// src/preload/index.ts
import { exposeAPI } from './api';  // ❌ WRONG - missing .js

// ✅ CORRECT - Include .js extension
import { exposeAPI } from './api.js';  // ✅ OK - ESM compliant
```

**Note:** Bundled code (main/renderer) is processed by Vite before execution. Unbundled code (preload/scripts) may run directly via Node.js, requiring explicit `.js` per ESM spec.

### 3. Using Aliases for Infrastructure Imports

```typescript
// ❌ WRONG - Unnecessary alias for same-layer import
import { getDatabase } from '@coreto/electron/main/database';

// ✅ CORRECT - Use relative path within infrastructure layer
import { getDatabase } from '../database/index.js';
```

## When to Update Alias Configuration

Add new module aliases when:

1. **Creating new domain subpath** (e.g., `domain/repositories/`)
   - Update: electron.vite.config.ts (main + renderer), tsconfig.json, jest.config.js

2. **Adding new renderer directory** (e.g., `renderer/src/services/`)
   - Usually covered by `@/*` wildcard (no config change needed)

3. **Cross-process shared utilities** (rare)
   - Consider if domain layer is more appropriate
   - If truly shared, add explicit alias in all three configs

## Enforcement

**Architecture Tests (Automated):**
- `tests/architecture/architecture.test.ts` - Validates all import conventions and layer boundaries
- Run with: `pnpm --filter @coreto/electron test architecture.test.ts`
- **When test fails:** Read error messages - they provide step-by-step fix instructions with examples

**ESLint Rules (Future):**
- `import/no-relative-parent-imports` - Enforce aliases for domain imports
- `import/extensions` - Enforce .js extensions for relative imports

**Manual Review:**
- Check PR diffs for import patterns
- Flag violations during code review
- Reference this document in review comments

## Log Export

All `console.log/warn/error/debug` calls are automatically captured via console override and exportable via the LogExportButton component.

- **Buffer:** 1000 entries per process (FIFO eviction)
- **Export location:** `reports/application-logs/coreto-logs-{timestamp}.json`
- **Format:** JSON with LogBundle structure (id, timestamp, appVersion, logs array)
- **Missing logs?** Check if buffer exceeded 1000 entries or capture initialized in `src/main/index.ts`
