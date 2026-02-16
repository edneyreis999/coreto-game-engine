# Task 06: Manual Testing & Validation - NSD Generator Scene Selection

## Status: MANUAL TESTING REQUIRED

This is a manual testing task. Since this is an automated execution environment, manual testing MUST be performed by the user.

## Test Environment Setup

### Prerequisites
- Node.js >= 20.0.0
- pnpm installed
- Development dependencies installed: `pnpm install`
- Core package built: `pnpm --filter @coreto/core build`

### Starting the Application

```bash
# From the monorepo root
pnpm --filter @coreto/electron dev
```

The app will start in development mode. Navigate to the NSD Generator page.

## Manual Testing Checklist

### Part 1: Initial Setup and Upload
- [ ] App starts without errors in terminal
- [ ] NSD Generator page loads successfully
- [ ] Upload interface displays correctly (drag & drop zone visible)
- [ ] Upload an NSD markdown file (.md extension, under 1MB)
- [ ] **OR** use mock data if available for testing

### Part 2: Scene Selection Visual Feedback
- [ ] Expand any scene by clicking on it
- [ ] Locate and click the "Select Scene" button within expanded content
- [ ] **Verify**: Scene border changes to `border-primary` class (blue border)
- [ ] **Verify**: Check icon (✓) appears next to scene title
- [ ] **Verify**: Background color changes to `bg-primary/5` (light blue tint)
- [ ] **Verify**: "Select Scene" button text changes to "Selected"
- [ ] **Verify**: "Selected" button has `bg-primary` (filled blue background)

### Part 3: Selected Scene Section
- [ ] **Verify**: "Selected Scene" section appears below the scene list
- [ ] **Verify**: Section displays selected scene title
- [ ] **Verify**: Section displays scene number (e.g., "Scene 1")
- [ ] **Verify**: Summary displays if available (italic text)
- [ ] **Verify**: "Generate Prompt" button is ENABLED (not grayed out)
- [ ] **Verify**: "Clear Selection" button is visible

### Part 4: Single Selection Behavior
- [ ] Expand a DIFFERENT scene
- [ ] Click "Select Scene" on the new scene
- [ ] **Verify**: Previous scene loses highlight (border-primary removed)
- [ ] **Verify**: Previous scene loses Check icon
- [ ] **Verify**: New scene gains border-primary highlight
- [ ] **Verify**: New scene shows Check icon
- [ ] **Verify**: Only ONE scene can be selected at a time (single selection mode)

### Part 5: Clear Selection
- [ ] Click "Clear Selection" button
- [ ] **Verify**: All visual highlights removed from all scenes
- [ ] **Verify**: "Selected Scene" section disappears
- [ ] **Verify**: "Generate Prompt" button is DISABLED (grayed out)
- [ ] **Verify**: All "Select Scene" buttons revert to "Select Scene" text

### Part 6: Keyboard Navigation
- [ ] Press `Tab` - focus should move to first interactive element
- [ ] Press `Tab` repeatedly - focus should move through elements in order:
  - Scene headers
  - Select Scene buttons (when expanded)
  - Generate Prompt button (when enabled)
  - Clear Selection button (when visible)
- [ ] With focus on a scene header, press `Enter` - scene should expand/collapse
- [ ] With focus on a scene header, press `Space` - scene should expand/collapse
- [ ] With focus on "Select Scene" button, press `Enter` - scene should be selected
- [ ] With focus on "Generate Prompt" button (when enabled), press `Enter` - should trigger

### Part 7: Button States
- [ ] **Initial State**: "Generate Prompt" button is DISABLED (no scene selected)
- [ ] **After Selection**: "Generate Prompt" button is ENABLED
- [ ] **After Clear**: "Generate Prompt" button returns to DISABLED state
- [ ] **Visual cues**: Disabled button has `opacity-50` and `cursor-not-allowed`

### Part 8: DevTools Console Check
- [ ] Open DevTools (Ctrl+Shift+I or Cmd+Option+I)
- [ ] **Verify**: No red error messages in Console tab
- [ ] **Verify**: No React warnings (yellow warnings)
- [ ] **Verify**: ILogger messages appear with proper formatting:
  - `[INFO]` messages for user actions
  - `[DEBUG]` messages for progress updates
  - No `console.log` direct calls (all via ILogger)

### Part 9: Accessibility (ARIA)
- [ ] **Verify**: Scene headers have `aria-expanded` attribute (false/true)
- [ ] **Verify**: Scene headers have `aria-controls` pointing to content ID
- [ ] **Verify**: Expanded content has `role="region"`
- [ ] **Verify**: Buttons have proper `aria-label` where needed
- [ ] **Verify**: Progress bar has `role="progressbar"` with `aria-valuenow`

### Part 10: Edge Cases
- [ ] **Rapid Selection**: Quickly click multiple "Select Scene" buttons - only last one should be selected
- [ ] **Expand/Collapse During Selection**: Collapse selected scene, then re-expand - selection should persist
- [ ] **Select After Clear**: Clear selection, then re-select same scene - should work
- [ ] **Long Scene Titles**: Select scene with very long title - layout should not break
- [ ] **No Summary**: Select scene without summary - section should still appear correctly

## Expected Behavior Summary

### Visual States
| State | Border | Background | Check Icon | Button Text |
|-------|--------|------------|------------|-------------|
| Default | border-border | bg-background | ✗ | "Select Scene" |
| Selected | border-primary | bg-primary/5 | ✓ | "Selected" |

### Component States
| Condition | Selected Scene Section | Generate Prompt Button |
|-----------|------------------------|------------------------|
| No selection | Hidden | Disabled |
| Scene selected | Visible (with title, number, summary) | Enabled |

## Known Issues to Watch For

Based on code review, potential issues:

1. **Focus Management**: When "Select Scene" is clicked, focus may not move appropriately. Verify keyboard flow feels natural.

2. **Mobile Touch**: Touch targets for "Select Scene" button may be small on mobile. Minimum recommended size is 44x44px.

3. **Screen Reader**: Test with NVDA (Windows) or VoiceOver (Mac) to ensure:
   - Scene selection state is announced
   - "Selected" vs "Select Scene" button text is clear
   - Button enable/disable state is communicated

4. **Performance**: With many scenes (50+), verify selection updates remain instant.

## Test Data Recommendations

For testing, create a sample NSD file with:
- 3-5 scenes with different lengths
- Mix of scenes with and without summaries
- At least one scene with very long title (test truncation)
- At least one scene with special characters in title

Example NSD structure:
```markdown
# Quest: The Lost Artifact

## Scene 1: Tavern Meeting
The hero enters the dimly lit tavern...
Summary: Introduction to quest giver

## Scene 2: Bard Conversation
An elderly bard sits in the corner...

## Scene 3: Throne Room
The throne room is empty except for a single figure...
```

## Bug Reporting Format

If bugs are found, document them with:

```markdown
### Bug #[Number]: [Brief Title]

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Environment**:
- OS: [Windows/macOS/Linux]
- Node Version: [e.g., 20.11.0]
- Browser: [Electron version]

**Console Errors** (if any):
```
[paste error messages]
```

**Screenshots/GIFs** (if applicable):
[attach visual evidence]
```

## Code Review Findings

### Positive Findings
1. ✅ **Comprehensive Test Coverage**: Unit tests in `SceneList.test.tsx` cover all selection scenarios
2. ✅ **Accessibility**: Proper ARIA attributes (`aria-expanded`, `aria-controls`, `role="region"`)
3. ✅ **Keyboard Support**: Enter and Space keys handled in `handleKeyDown` callback
4. ✅ **Immutable State**: Selection state managed via props (`selectedSceneId`, `onSceneSelect`)
5. ✅ **Clean Architecture**: Clear separation between SceneList (presentation) and NSDGenerator (state)

### Potential Issues
1. ⚠️ **Focus Management**: No explicit `focus()` call after selection - users relying on screen readers may lose context
2. ⚠️ **Touch Targets**: "Select Scene" button size not explicitly defined for mobile (44x44px minimum recommended)
3. ⚠️ **Error Boundary**: No error boundary around NSDGenerator - if scene list crashes, entire page goes blank

### Integration Notes
1. `NSDGenerator.tsx` manages `selectedScene` state locally (lines 250-251)
2. `SceneList.tsx` is a controlled component - receives `selectedSceneId` and `onSceneSelect` as props
3. Selection flow: SceneList → onSceneSelect callback → NSDGenerator setSelectedScene → re-render with new `selectedSceneId`
4. "Generate Prompt" button disabled state is controlled by `!selectedScene` condition (line 486)

## Completion Criteria

Task 06 is complete when:
- [ ] All checklist items have been tested
- [ ] Any bugs found are documented with reproduction steps
- [ ] Expected behavior matches actual behavior for all scenarios
- [ ] DevTools console is clean (no errors or warnings)
- [ ] Keyboard navigation works smoothly
- [ ] Accessibility requirements are met

## Next Steps After Testing

If testing reveals issues:
1. Document bugs with the format above
2. Create new tasks for bug fixes (priority based on severity)
3. Re-test after fixes are applied

If testing passes:
1. Mark Task 06 as complete
2. Proceed to next task in execution plan
3. Consider adding E2E tests for critical paths

## Test Session Notes

Use this section to document any observations during testing:

- [Date of testing]:
- [Tester name]:
- [Environment details]:
- [Overall assessment]:
- [Any deviations from expected behavior]:
- [Suggestions for improvement]:

---

**Generated**: 2026-02-16
**Task**: Task 06 - Manual Testing & Validation
**Plan**: 025-select-scene (Scene Selection Feature)
**Location**: `/Users/edney/projects/coreto/game-engine/planos/025-select-scene/tasks/06_task.xml`
