# Code Style and Conventions

## Language & Type System

### TypeScript Configuration (ADR-028)

- **Target**: ES2022
- **Module System**: ESNext or CommonJS (to be decided)
- **Strict Mode**: Enabled
  - strictNullChecks: true
  - strictFunctionTypes: true
  - noImplicitAny: true
  - noUnusedLocals: true
  - noUnusedParameters: true

### Naming Conventions

```typescript
// Classes: PascalCase
class BattleSimulator {}
class ConfigLoader {}

// Interfaces/Types: PascalCase with 'I' prefix (if needed) or without
interface TrechoConfig {}
type SkillId = number;

// Functions/Methods: camelCase
function loadConfiguration() {}
function calculateTTK() {}

// Variables: camelCase
const projectPath = "/path/to/project";
let currentTurn = 0;

// Constants: UPPER_SNAKE_CASE
const MAX_BATTLE_TURNS = 100;
const DEFAULT_SEED = 12345;

// Private members: prefix with underscore (optional)
class Example {
  private _internalState: number;
}
```

## Architecture Patterns

### Layered Architecture (HLD Section 2)

```
CLI Layer
  ↓
Config Layer
  ↓
Loader Layer
  ↓
Headless Runtime
  ↓
Simulation Layer
  ↓
Reporter Layer
  ↓
AI Exporter Layer
```

**Key Principles:**

- **Pipeline Sequencial**: Data flows top-to-bottom, no loops
- **Read-Only**: NEVER write to RPG Maker MZ project (ADR-001)
- **Isolation**: Each layer has clear responsibilities
- **Fail-Fast**: Validate inputs early, fail with clear errors

### Dependency Injection

- Prefer constructor injection for dependencies
- Use interfaces for loose coupling
- Mock-friendly design for testing

## Code Organization

### File Structure

```typescript
// One class per file
// src/simulation/BattleSimulator.ts
export class BattleSimulator {
  // implementation
}

// Barrel exports for modules
// src/simulation/index.ts
export { BattleSimulator } from './BattleSimulator';
export { TurnExecutor } from './TurnExecutor';
```

### Import Order

```typescript
// 1. Node.js built-in modules
import * as fs from 'fs';
import * as path from 'path';

// 2. External dependencies
import { z } from 'zod';
import { JSDOM } from 'jsdom';

// 3. Internal modules (absolute paths)
import { ConfigLoader } from '@/config/ConfigLoader';
import { BattleSimulator } from '@/simulation/BattleSimulator';

// 4. Types
import type { TrechoConfig, PartyConfig } from '@/types';
```

## Error Handling

### Validation Strategy

```typescript
// Use Zod for schema validation (ADR-008)
import { z } from 'zod';

const TrechoSchema = z.object({
  id: z.string(),
  anchorLevelRange: z.object({
    min: z.number().min(1).max(99),
    max: z.number().min(1).max(99)
  }),
  ttkTarget: z.object({
    turns: z.number().positive(),
    actions: z.number().positive()
  })
});

// Validate and throw on error
const trecho = TrechoSchema.parse(rawData);
```

### Warning System (ADR-013)

```typescript
// Typed warnings with severity levels
type WarningType = 
  | 'troop_not_found'
  | 'enemy_not_found'
  | 'ttk_out_of_tolerance'
  | 'skill_formula_error'
  | 'battle_timeout';

type WarningSeverity = 'critical' | 'warning' | 'info';

interface Warning {
  type: WarningType;
  severity: WarningSeverity;
  message: string;
  context: Record<string, unknown>;
}

// Collect warnings, don't throw
warnings.push({
  type: 'ttk_out_of_tolerance',
  severity: 'warning',
  message: 'TTK fora da tolerância',
  context: { troopId, ttkTurns, targetTurns }
});
```

## Documentation Standards (ADR-009, ADR-010)

### Code Comments

```typescript
/**
 * Executes a battle simulation for the given troop.
 * 
 * @param troopId - ID of the troop to battle (from Troops.json)
 * @param party - Party configuration with classes and levels
 * @param seed - RNG seed for deterministic execution
 * @returns Battle result with TTK metrics
 * @throws {ValidationError} If troopId doesn't exist
 */
async function executeBattle(
  troopId: number,
  party: PartyConfig,
  seed: number
): Promise<BattleResult> {
  // Implementation
}
```

### Inline Comments

```typescript
// Good: Explain WHY, not WHAT
// Use seed to control Math.random for deterministic results
Math.seedrandom(seed);

// Bad: Stating the obvious
// Set the seed variable
const seed = 12345;
```

## Testing Conventions

### Test File Structure

```typescript
// tests/unit/simulation/BattleSimulator.test.ts
import { BattleSimulator } from '@/simulation/BattleSimulator';

describe('BattleSimulator', () => {
  describe('executeBattle', () => {
    it('should measure TTK in turns and actions', () => {
      // Arrange
      const simulator = new BattleSimulator();
      const troopId = 1;
      const party = { /* ... */ };
      
      // Act
      const result = simulator.executeBattle(troopId, party, 12345);
      
      // Assert
      expect(result.ttkTurns).toBeGreaterThan(0);
      expect(result.ttkActions).toBeGreaterThan(0);
    });
  });
});
```

### Test Naming

- Use descriptive test names: `should <expected behavior> when <condition>`
- Group related tests with `describe` blocks
- Use `beforeEach` for setup, `afterEach` for cleanup

## Git Conventions

### Commit Messages (Conventional Commits)

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat: Add new feature
fix: Bug fix
docs: Documentation changes
refactor: Code refactoring
test: Adding/updating tests
chore: Build/tooling changes

# Examples:
git commit -m "feat(simulation): implement TTK measurement in turns and actions"
git commit -m "fix(loader): validate troopId existence before battle"
git commit -m "docs(adr): add ADR-028 for TypeScript decision"
```

### Branch Naming

```bash
feature/battle-simulation
fix/troop-validation-error
docs/update-hld
refactor/config-layer
```

## Performance Guidelines

### Optimization Priorities (HLD Section 7)

1. **Cache**: Load database once at startup, reuse across simulations
2. **Lazy Loading**: Load only necessary RPG Maker scripts
3. **Memoization**: Cache skill damage calculations

### Memory Management

- Avoid keeping entire database in memory if not needed
- Clear simulation state after each battle
- Use streaming for large file exports

## Security Guidelines (HLD Section 8)

### Read-Only Enforcement (ADR-001)

```typescript
// NEVER do this
fs.writeFileSync(`${projectPath}/data/Classes.json`, data);

// ALWAYS read-only
const data = fs.readFileSync(`${projectPath}/data/Classes.json`, 'utf-8');
```

### Path Validation

```typescript
// Sanitize and validate paths
function validateProjectPath(path: string): void {
  // Prevent path traversal
  if (path.includes('..')) {
    throw new Error('Invalid path: path traversal detected');
  }
  
  // Validate structure
  if (!fs.existsSync(path.join(path, 'game.rmmzproject'))) {
    throw new Error('Invalid RPG Maker MZ project');
  }
}
```

## References

- ADR-028: TypeScript as Implementation Language
- ADR-008: Schema Validation Library (Zod)
- ADR-013: Typed Warning System
- HLD Section 8: Security
- HLD Section 3: Components and Responsibilities
