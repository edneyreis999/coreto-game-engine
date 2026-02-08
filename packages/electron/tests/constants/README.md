# Test Constants - Electron Package

This directory contains centralized test constants for Electron-specific tests, documenting business rules and eliminating magic numbers.

## Overview

All magic numbers used in Electron tests have been extracted to named constants that document their purpose and business rules. This improves:

- **Maintainability**: Changes to UI/UX requirements only require updating one place
- **Readability**: Test intent is clear from constant names
- **Documentation**: Business rules are documented alongside constants

## Organization

Constants are organized by domain/feature:

### UI_CONSTANTS
User interface components and behavior

```ts
import { UI_CONSTANTS } from '../constants';

UI_CONSTANTS.INITIAL_PROGRESS       // 0 - Starting progress
UI_CONSTANTS.COMPLETED_PROGRESS     // 100 - Completion progress
UI_CONSTANTS.EMPTY_PROJECT_COUNT    // 0 - No projects
UI_CONSTANTS.SINGLE_PROJECT         // 1 - One project
UI_CONSTANTS.THREE_PROJECTS         // 3 - Three projects
```

### DATABASE_CONSTANTS
Database operations and storage limits

```ts
import { DATABASE_CONSTANTS } from '../constants';

DATABASE_CONSTANTS.MAX_RECENT_PROJECTS      // 10 - Max recent projects
DATABASE_CONSTANTS.MAX_HISTORY_PER_PROJECT  // 100 - Max history records
DATABASE_CONSTANTS.QUERY_TIMEOUT_MS         // 1000 - Query timeout
```

### IPC_CONSTANTS
Inter-process communication between main and renderer

```ts
import { IPC_CONSTANTS } from '../constants';

IPC_CONSTANTS.DEFAULT_TIMEOUT   // 5000 - Default IPC timeout
IPC_CONSTANTS.SHORT_TIMEOUT     // 1000 - Quick operations
IPC_CONSTANTS.LONG_TIMEOUT      // 10000 - Complex operations
```

### SIMULATION_CONSTANTS
Battle simulation in Electron context

```ts
import { SIMULATION_CONSTANTS } from '../constants';

SIMULATION_CONSTANTS.DEFAULT_TURNS      // 10 - Default TTK turns
SIMULATION_CONSTANTS.DEFAULT_ACTIONS    // 40 - Default TTK actions
SIMULATION_CONSTANTS.DEFAULT_TOLERANCE  // 15 - Default tolerance
SIMULATION_CONSTANTS.EXPECTED_DURATION_MS // 1000 - Expected time
```

### VALIDATION_CONSTANTS
Form and data validation rules

```ts
import { VALIDATION_CONSTANTS } from '../constants';

VALIDATION_CONSTANTS.MAX_STRING_LENGTH     // 255 - Max string length
VALIDATION_CONSTANTS.MAX_DESCRIPTION_LENGTH // 1000 - Max description
VALIDATION_CONSTANTS.VALIDATION_DELAY_MS   // 300 - Validation delay
```

### PROJECT_CONSTANTS
Project management values

```ts
import { PROJECT_CONSTANTS } from '../constants';

PROJECT_CONSTANTS.SAMPLE_NAME   // 'Test Project' - Sample name
PROJECT_CONSTANTS.SAMPLE_PATH   // '/path/to/project' - Sample path
PROJECT_CONSTANTS.MAX_NAME_LENGTH // 100 - Max name length
```

### TRECHO_CONSTANTS
Trecho (game section) configuration

```ts
import { TRECHO_CONSTANTS } from '../constants';

TRECHO_CONSTANTS.SAMPLE_ID          // 'ato1-nivel1-10' - Sample ID
TRECHO_CONSTANTS.SAMPLE_NAME        // 'Ato 1 - Níveis 1-10'
TRECHO_CONSTANTS.DEFAULT_TURNS      // 3 - Default TTK turns
TRECHO_CONSTANTS.DEFAULT_ACTIONS    // 8 - Default TTK actions
```

### Other Constant Groups
- `WINDOW_CONSTANTS` - Electron window management
- `NOTIFICATION_CONSTANTS` - User notifications and toasts
- `THEME_CONSTANTS` - UI theming values
- `COLLECTION_CONSTANTS` - Array/collection operations
- `INDEX_CONSTANTS` - Array indices and positions
- `PERCENTAGE_CONSTANTS` - Common percentage values

## Usage Patterns

### Basic Usage
```ts
import { UI_CONSTANTS, DATABASE_CONSTANTS } from '../constants';

describe('Recent Projects', () => {
  it('should limit recent projects', () => {
    const max = DATABASE_CONSTANTS.MAX_RECENT_PROJECTS;
    expect(getRecentProjects().length).toBeLessThanOrEqual(max);
  });
});
```

### Organized by Domain
```ts
import { DOMAINS } from '../constants';

describe('Simulation Progress', () => {
  it('should start at zero progress', () => {
    const initial = DOMAINS.UI.INITIAL_PROGRESS;
    expect(simulation.progress).toBe(initial);
  });
});
```

### Legacy Support
```ts
import { TEST_CONSTANTS } from '../constants';

// Still works for backward compatibility
expect(seed).toBe(TEST_CONSTANTS.DEFAULT_SEED);
```

## Adding New Constants

When adding new magic numbers to tests:

1. **Identify the domain** - Which feature area does this constant belong to?
2. **Choose a descriptive name** - Should clearly indicate purpose
3. **Document business rules** - Add JSDoc comments explaining the value
4. **Add to appropriate group** - Place in existing constant group or create new
5. **Export from index** - Ensure it's available for import

Example:
```ts
export const UI_CONSTANTS = {
  // ... existing constants

  /**
   * Maximum number of recent projects to display
   * Business Rule: Prevents UI clutter, keeps list manageable
   */
  MAX_VISIBLE_RECENT: 10,
} as const;
```

## Business Rule Documentation

Each constant includes documentation of:

- **Purpose**: What the constant represents
- **Business Rule**: Why this specific value was chosen
- **Context**: When/where it's used
- **Constraints**: Valid ranges or limits

Example:
```ts
/**
 * Maximum number of recent projects to store
 * Business Rule: Limits list to prevent UI clutter
 */
MAX_RECENT_PROJECTS: 10,
```

## Migration from Magic Numbers

When replacing magic numbers in existing tests:

**Before:**
```ts
expect(progress).toBe(0);
expect(projects.length).toBeLessThan(10);
expect(result).toBeDefined();
```

**After:**
```ts
import { UI_CONSTANTS, DATABASE_CONSTANTS } from '../constants';

expect(progress).toBe(UI_CONSTANTS.INITIAL_PROGRESS);
expect(projects.length).toBeLessThan(DATABASE_CONSTANTS.MAX_RECENT_PROJECTS);
```

## Conventions

### Naming
- Use UPPER_CASE for all constants
- Group by domain with suffix (e.g., `_CONSTANTS`)
- Be descriptive but concise
- Include purpose in name (e.g., `MAX_*`, `MIN_*`)

### Values
- All constants are `as const` for type inference
- Use primitive types (number, string, boolean)
- Arrays use `as const` for immutability

### Organization
- Group related constants together
- Order by importance (most used first)
- Separate groups with clear section headers
- Export organized groups via `DOMAINS`

## File Structure

```
constants/
├── index.ts              # Main export point
├── test-constants.ts     # All constant definitions
└── README.md            # This file
```

## Related Files

- Test files throughout `packages/electron/tests/` import from this directory
- Shared constants from `@coreto/core` can also be used

## Best Practices

1. **Import specific groups** - Don't import everything, only what you need
2. **Use DOMAINS** - For organized access to multiple groups
3. **Document changes** - Update this README when adding groups
4. **Maintain consistency** - Follow existing patterns for new constants
5. **Test before committing** - Ensure all tests still pass after changes

## Examples

See test files throughout the Electron package:

- `tests/unit/renderer/hooks/useSimulationProgress.test.ts` - UI constants
- `tests/unit/main/database/recent-projects.test.ts` - Database constants
- `tests/integration/simulation-flow.test.ts` - Simulation constants
