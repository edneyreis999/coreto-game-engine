# Test Constants

This directory contains centralized test constants that document business rules and eliminate magic numbers from test files.

## Overview

All magic numbers used in tests have been extracted to named constants that document their purpose and business rules. This improves:

- **Maintainability**: Changes to business rules only require updating one place
- **Readability**: Test intent is clear from constant names
- **Documentation**: Business rules are documented alongside constants

## Organization

Constants are organized by domain/feature:

### LEVEL_CONSTANTS
RPG Maker MZ level system (1-99)

```ts
import { LEVEL_CONSTANTS } from '../constants';

LEVEL_CONSTANTS.MIN_LEVEL          // 1 - Minimum valid level
LEVEL_CONSTANTS.MAX_LEVEL          // 99 - Maximum valid level
LEVEL_CONSTANTS.SAMPLE_LOW_LEVEL   // 5 - Sample low level
LEVEL_CONSTANTS.SAMPLE_MID_LEVEL   // 50 - Sample mid level
```

### TTK_CONSTANTS
Time-to-kill battle metrics

```ts
import { TTK_CONSTANTS } from '../constants';

TTK_CONSTANTS.DEFAULT_TARGET_TURNS      // 3 - Default target turns
TTK_CONSTANTS.DEFAULT_TARGET_ACTIONS    // 8 - Default target actions
TTK_CONSTANTS.DEFAULT_TOLERANCE_PERCENT // 15 - Default tolerance percentage
TTK_CONSTANTS.SAMPLE_TARGET_TURNS       // 10 - Sample target turns
TTK_CONSTANTS.SAMPLE_TARGET_ACTIONS     // 40 - Sample target actions
```

### BATTLE_CONSTANTS
Battle mechanics and limits

```ts
import { BATTLE_CONSTANTS } from '../constants';

BATTLE_CONSTANTS.MAX_FRAMES         // 10000 - Maximum frames before timeout
BATTLE_CONSTANTS.MAX_TURNS          // 50 - Maximum turns for battle
BATTLE_CONSTANTS.INVALID_TROOP_ID   // 999 - Invalid troop ID for error testing
BATTLE_CONSTANTS.SAMPLE_TROOP_ID    // 1 - Default troop ID
```

### PARTY_CONSTANTS
Party composition rules

```ts
import { PARTY_CONSTANTS } from '../constants';

PARTY_CONSTANTS.MIN_MEMBERS        // 1 - Minimum party size
PARTY_CONSTANTS.STANDARD_PARTY_SIZE // 4 - Typical party size
PARTY_CONSTANTS.DEFAULT_CLASS_ID   // 1 - Default class ID
```

### CHARACTER_CONSTANTS
Enemy and actor statistics

```ts
import { CHARACTER_CONSTANTS } from '../constants';

CHARACTER_CONSTANTS.INVALID_ENEMY_ID   // 999 - Invalid enemy ID
CHARACTER_CONSTANTS.BASIC_GOBLIN_STATS // [50,0,10,5,3,3,4,4] - Goblin stats
CHARACTER_CONSTANTS.GOBLIN_EXP         // 10000 - XP for defeating Goblin
```

### RNG_CONSTANTS
Deterministic random number generation

```ts
import { RNG_CONSTANTS } from '../constants';

RNG_CONSTANTS.DEFAULT_SEED    // 12345 - Default seed for tests
RNG_CONSTANTS.CUSTOM_SEED     // 99999 - Custom seed for variations
```

### REPORT_CONSTANTS
Report generation and metadata

```ts
import { REPORT_CONSTANTS } from '../constants';

REPORT_CONSTANTS.DEFAULT_VERSION    // '1.0.0' - Report version
REPORT_CONSTANTS.LARGE_RESULT_COUNT // 1000 - For stress testing
```

### Other Constant Groups
- `FILESYSTEM_CONSTANTS` - File system operations
- `AUDIO_CONSTANTS` - Audio system parameters
- `SKILL_CONSTANTS` - Skill system values
- `VALIDATION_CONSTANTS` - Validation thresholds
- `RANGE_CONSTANTS` - Level range calculations

## Usage Patterns

### Basic Usage
```ts
import { TTK_CONSTANTS, LEVEL_CONSTANTS } from '../constants';

describe('Trecho', () => {
  it('should validate level range', () => {
    const min = LEVEL_CONSTANTS.MIN_LEVEL;
    const max = LEVEL_CONSTANTS.MAX_LEVEL;
    expect(validateLevel(min, max)).toBe(true);
  });
});
```

### Organized by Domain
```ts
import { DOMAINS } from '../constants';

describe('Battle Tests', () => {
  it('should respect max turns', () => {
    const maxTurns = DOMAINS.BATTLE.MAX_TURNS;
    expect(simulate(maxTurns)).toBeDefined();
  });
});
```

### Legacy Support
```ts
import { TEST_CONSTANTS } from '../fixtures/test-constants';

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
export const BATTLE_CONSTANTS = {
  // ... existing constants

  /**
   * Critical HP threshold for emergency AI behavior
   * Business Rule: AI changes tactics when HP drops below 30%
   */
  CRITICAL_HP_THRESHOLD: 30,
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
 * Maximum frames before battle timeout
 * Business Rule: Prevents infinite loops, ~10 seconds at 60fps
 */
MAX_FRAMES: 10000,
```

## Migration from Magic Numbers

When replacing magic numbers in existing tests:

**Before:**
```ts
expect(trecho.level).toBe(5);
expect(battle.frames).toBeLessThan(10000);
```

**After:**
```ts
import { LEVEL_CONSTANTS, BATTLE_CONSTANTS } from '../constants';

expect(trecho.level).toBe(LEVEL_CONSTANTS.SAMPLE_LOW_LEVEL);
expect(battle.frames).toBeLessThan(BATTLE_CONSTANTS.MAX_FRAMES);
```

## Conventions

### Naming
- Use UPPER_CASE for all constants
- Group by domain with suffix (e.g., `_CONSTANTS`)
- Be descriptive but concise
- Include purpose in name (e.g., `INVALID_*` for error testing)

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

- `../fixtures/test-constants.ts` - Legacy constants (backward compatibility)
- Test files throughout the suite import from this directory

## Best Practices

1. **Import specific groups** - Don't import everything, only what you need
2. **Use DOMAINS** - For organized access to multiple groups
3. **Document changes** - Update this README when adding groups
4. **Maintain consistency** - Follow existing patterns for new constants
5. **Test before committing** - Ensure all tests still pass after changes

## Examples

See test files throughout the codebase for usage examples:

- `unit/core/domain/Trecho.test.ts` - TTK and level constants
- `unit/core/use-cases/ExecuteBattleUseCase.test.ts` - Battle constants
- `unit/infrastructure/simulation/TtkMeasurer.test.ts` - TTK measurement constants
