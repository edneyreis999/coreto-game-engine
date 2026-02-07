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

### 2. Forgetting .js Extension

```typescript
// ❌ WRONG - Missing extension for relative imports
import { wrapHandler } from './ipc-response';

// ✅ CORRECT - Include .js extension (ESM requirement)
import { wrapHandler } from './ipc-response.js';
```

**Note:** TypeScript compiles `.ts` to `.js`, so imports must reference the output file extension.

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
