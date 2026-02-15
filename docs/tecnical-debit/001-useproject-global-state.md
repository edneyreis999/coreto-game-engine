# Technical Debt 001: Global State Management for useProject Hook

**Status:** Open
**Priority:** Medium
**Created:** 2026-02-15
**Estimated Effort:** 2-3 hours

---

## Problem Description

The `useProject()` hook currently uses `useState()` to manage project state, which creates **component-local state** rather than global shared state. This causes user experience issues where project selection is not preserved across route navigation.

### Current Implementation

```typescript
// src/renderer/src/hooks/useProject.ts (line 143)
export function useProject(): ProjectReturn {
  const logger = useLogger();
  const [state, setState] = useState<ProjectState>(initialState); // ← LOCAL STATE!
  // ...
}
```

### Impact

**User Experience Bug:**
1. User selects a project in the landing page (`/`)
2. User navigates to Home (`/home`)
3. User clicks "TTK Validation" button
4. App navigates to `/ttk`
5. **BUG:** TTKValidationFlow shows project selection panel again ❌

**Root Cause:**
- Each component that calls `useProject()` gets its own independent state instance
- App.tsx's `ProjectSelectionPanel` has State A
- `TTKValidationFlow` has State B (null initially)
- States are NOT shared across components

### Current Workaround

Router state passing has been implemented as a temporary fix:
- `Home.tsx` passes `projectPath` via `navigate('/ttk', { state: { projectPath } })`
- `TTKValidationFlow` reads from `useLocation().state.projectPath`
- This works but requires manual state plumbing across every navigation

---

## Proposed Solution: React Context

Convert `useProject()` to use React Context for true global state management.

### Architecture

```typescript
// 1. Create ProjectContext
interface ProjectContextValue {
  projectInfo: ProjectInfo | null;
  validation: ValidationState;
  isLoading: boolean;
  error: Error | null;
  openProject: (path: string) => Promise<void>;
  reset: () => void;
}

const ProjectContext = React.createContext<ProjectContextValue | null>(null);

// 2. Create ProjectProvider component
export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProjectState>(initialState);

  const openProject = useCallback(async (projectPath: string) => {
    // ... implementation
  }, []);

  const value: ProjectContextValue = {
    ...state,
    openProject,
    reset: useCallback(() => setState(initialState), []),
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

// 3. Refactor useProject() to use context
export function useProject(): ProjectReturn {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}
```

### Implementation Steps

1. **Create Context Module**
   - File: `src/renderer/src/contexts/ProjectContext.tsx`
   - Export `ProjectProvider` and `useProject` hook
   - Move all state logic from current `useProject()` to the provider

2. **Update App.tsx**
   - Wrap `<HashRouter>` with `<ProjectProvider>`
   - All child components automatically share project state

3. **Update Consumers**
   - Remove router state passing workarounds
   - Components automatically access current project via `useProject()`
   - No need to pass `projectPath` through navigation state

4. **Remove Workarounds**
   - Remove `state` prop from `PortalButton`
   - Remove router state reading from `TTKValidationFlow`
   - Remove `navigationState` from `Home.tsx`

5. **Testing**
   - Verify project selection persists across routes
   - Test all components using `useProject()`
   - Ensure no breaking changes to existing functionality

---

## Benefits

### Immediate Benefits
- ✅ **Automatic state sharing** across all components
- ✅ **No manual state plumbing** through router navigation
- ✅ **Cleaner component code** - no need to pass project props
- ✅ **Better DX** - just call `useProject()` anywhere

### Long-term Benefits
- ✅ **Scalable** - easy to add more global state (user preferences, etc.)
- ✅ **Maintainable** - single source of truth for project state
- ✅ **Testable** - can mock context in tests
- ✅ **Standard Pattern** - React Context is well-documented and understood

---

## Risks & Mitigation

### Risk 1: Breaking Changes to Consumers
**Impact:** Medium
**Mitigation:**
- Keep `useProject()` API identical - same return types, same function signatures
- Only change internal implementation from local state to context
- Existing components continue working without modification

### Risk 2: Context Provider Missing
**Impact:** High (app crash)
**Mitigation:**
- Add runtime check in `useProject()` hook
- Throw descriptive error if used outside provider
- Document provider requirement in hook JSDoc

### Risk 3: Performance Issues
**Impact:** Low
**Mitigation:**
- Context re-renders only when state changes
- Most reads are from stable context value
- Can memoize context value if needed

---

## Acceptance Criteria

- [ ] `ProjectProvider` created and exported
- [ ] `App.tsx` wraps router with `ProjectProvider`
- [ ] `useProject()` refactored to use context
- [ ] All existing tests pass
- [ ] Project selection persists across route navigation
- [ ] Router state workarounds removed from:
  - [ ] `PortalButton.tsx`
  - [ ] `Home.tsx`
  - [ ] `TTKValidationFlow.tsx`
- [ ] Documentation updated

---

## Related Issues

- **Temp Fix:** Router state passing implementation (2026-02-15)
- **Root Cause:** `useProject()` using `useState()` instead of Context
- **Affected Components:**
  - `App.tsx` - ProjectSelectionPanel
  - `TTKValidationFlow.tsx` - Duplicate project selection
  - `Home.tsx` - Navigation state workaround
  - `PortalButton.tsx` - State passing workaround

---

## References

- React Context Documentation: https://react.dev/learn/scaling-up-with-reducer-and-context
- Current Implementation: `src/renderer/src/hooks/useProject.ts`
- Temporary Workaround: Router state passing in `Home.tsx` and `PortalButton.tsx`

---

## Notes

This refactor should be done as a focused task separate from feature work. The current router state workaround is functional but not ideal long-term. Implementing React Context provides a proper foundation for global state management and makes the codebase more maintainable.

**Recommendation:** Implement in next sprint after current feature delivery.
