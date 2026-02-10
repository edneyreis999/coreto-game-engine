
## Troubleshooting

### Monorepo Import Rules

**Never** use subpath imports (`@coreto/core/infrastructure/X`) — they fail in `tsc` even if Jest resolves them. Always import from `@coreto/core` directly. New modules must be barrel-exported in `packages/core/src/index.ts`.

**Naming:** Domain = no suffix (`Warning`), Zod types = `*DTO` (`WarningDTO`), Schemas = `*Schema`.

### Core Package Requires Rebuild After Changes

**Symptom:** `SyntaxError: The requested module '@coreto/core' does not provide an export named 'X'`

**Cause:** electron-vite bundles `@coreto/core` into `out/main/`. Source changes to core aren't reflected until rebuild.

**Fix:** Rebuild core after modifying its public API:

```bash
pnpm --filter @coreto/core build
```

### Module Aliases Require Multi-Config Setup

**Symptom:** TypeScript compiles but `electron-vite dev` fails with "failed to resolve import @coreto/electron/domain/*"

**Cause:** Vite/Rollup has its own module resolution. Each build environment needs explicit alias config.

**Fix:** When adding new module aliases, update ALL configs:

1. `tsconfig.json` → `compilerOptions.paths`
2. `jest.config.js` → `moduleNameMapper` (for ALL projects: main, renderer, integration)
3. `electron.vite.config.ts` → `resolve.alias` (for BOTH main AND renderer sections)

**Note:** electron-vite builds 3 separate processes. Each needs its own alias configuration.

### React Hook Infinite Loop Prevention

**CRITICAL:** Never add unstable functions (inline arrows, mock functions) to `useCallback`/`useEffect` deps. This causes infinite re-render loops.

**Anti-pattern:**

```typescript
// ❌ CAUSES INFINITE LOOP
const invoke = useCallback(async () => {
  await someFunction();
}, [someFunction]); // someFunction changes every render
```

**Correct pattern:**

```typescript
// ✅ STABLE REFERENCE
const fnRef = useRef(someFunction);
useEffect(() => { fnRef.current = someFunction; }, [someFunction]);

const invoke = useCallback(async () => {
  await fnRef.current(); // No re-creation
}, []); // Empty deps
```

**Also:** Never use `jest.useFakeTimers()` with `waitFor()` — conflicts cause hangs. Remove fake timers if tests use async assertions.

### useState Initial Value Bug

**Symptom:** Hook receives prop updates but state stays stale.

**Cause:** `useState(initialValue)` only uses `initialValue` on first render. Subsequent prop changes are ignored.

**Fix:** Sync state with `useEffect`:

```typescript
const [state, setState] = useState(initialValue);

useEffect(() => {
  setState(initialValue);
}, [initialValue]);
```
