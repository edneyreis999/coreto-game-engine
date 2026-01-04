# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Coreto Game Engine** is a deterministic Time-to-Kill (TTK) validation system for RPG Maker MZ combat balancing. It executes real battles in headless mode to measure TTK and validate game balance, reducing validation cycles from 2-3 days to ≤10 minutes.

**Current Status**: PRE-IMPLEMENTATION PHASE. All architecture is documented (PRD, HLD, 28 ADRs), but no code has been implemented yet.

## Core Architectural Principles

### Critical Constraints (ADR-001)

**NEVER write to the RPG Maker MZ project directory.** The system is a read-only wrapper:

- ✅ ALLOWED: `fs.readFileSync()` on `projectPath/data/*`
- ❌ FORBIDDEN: `fs.writeFileSync()`, `fs.appendFileSync()`, `fs.unlinkSync()` on `projectPath/data/*`
- ✅ ALLOWED: Write reports to `report/` directory (outside projectPath)

The RPG Maker MZ editor is the single source of truth for all game data. This tool validates, it never modifies.

### Battle Fidelity (ADR-003)

Execute **real battles** using RPG Maker MZ's `BattleManager` in headless mode. Not mathematical simulation—actual game engine execution for maximum fidelity to the final game.

### Determinism (ADR-018)

All simulations use a fixed RNG seed to ensure reproducible results. Same config + same seed = identical TTK measurements.

## Layered Architecture

The system follows a strict pipeline architecture (top-to-bottom, no loops):

```
CLI Layer (Oclif)
  ↓
Config Layer (Zod validation)
  ↓
Loader Layer (Load RPG Maker MZ data/*.json)
  ↓
Headless Runtime (JSDOM + mocks for PIXI/Graphics/Effekseer)
  ↓
Simulation Layer (BattleManager execution, TTK measurement)
  ↓
Reporter Layer (Generate report.json)
  ↓
AI Exporter Layer (Split large JSONs for AI context)
```

Each layer has isolated responsibilities. Data flows downward only.

## Technology Stack

- **Language**: TypeScript 5.x with strict mode (ADR-028)
- **Runtime**: Node.js LTS
- **CLI Framework**: Oclif (ADR-007)
- **Validation**: Zod schemas (ADR-008)
- **Testing**: Jest + JSDOM (ADR-014)
- **Config Format**: JSON (ADR-021)
- **Canvas Mocking**: jest-canvas-mock (ADR-026)

### TypeScript Configuration

```typescript
// Target: ES2022
// Strict mode enabled:
// - strictNullChecks
// - strictFunctionTypes
// - noImplicitAny
// - noUnusedLocals
// - noUnusedParameters
```

## Development Commands (Planned)

When implementation begins, these commands will be available:

```bash
# Install dependencies
npm install

# Development with watch mode
npm run dev

# Run tests
npm test
npm run test:watch

# Type checking
npm run type-check

# Linting
npm run lint

# Build for distribution
npm run build

# Run CLI (post-implementation)
node cli.js run-ttk --config project.config.json
node cli.js run-ttk --config project.config.json --seed 42
node cli.js run-ttk --config project.config.json --trecho ato1-nivel1-10
node cli.js run-ttk --config project.config.json --verbose
node cli.js run-ttk --config project.config.json --diagnostic
node cli.js export-context --config project.config.json
```

## Code Organization Principles

### Naming Conventions

```typescript
// Classes: PascalCase
class BattleSimulator {}

// Interfaces/Types: PascalCase
interface TrechoConfig {}
type SkillId = number;

// Functions: camelCase
function calculateTTK() {}

// Variables: camelCase
const projectPath = "/path/to/project";

// Constants: UPPER_SNAKE_CASE
const MAX_BATTLE_TURNS = 100;
const DEFAULT_SEED = 12345;
```

### File Structure

- One class per file
- Use barrel exports for modules (`index.ts`)
- Organize by layer: `src/cli/`, `src/config/`, `src/loader/`, `src/simulation/`, etc.

### Import Order

```typescript
// 1. Node.js built-in
import * as fs from 'fs';
import * as path from 'path';

// 2. External dependencies
import { z } from 'zod';
import { JSDOM } from 'jsdom';

// 3. Internal modules
import { ConfigLoader } from '@/config/ConfigLoader';

// 4. Types
import type { TrechoConfig } from '@/types';
```

## Error Handling

### Validation with Zod (ADR-008)

```typescript
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

// Parse and validate (throws ZodError on failure)
const trecho = TrechoSchema.parse(rawData);
```

### Warning System (ADR-013)

Don't throw exceptions for validation failures—collect typed warnings:

```typescript
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

// Collect warnings instead of throwing
warnings.push({
  type: 'ttk_out_of_tolerance',
  severity: 'warning',
  message: 'TTK fora da tolerância',
  context: { troopId, ttkTurns, targetTurns }
});
```

## Documentation Standards

### Code Comments

```typescript
/**
 * Executes a battle simulation for the given troop.
 *
 * @param troopId - ID of troop from Troops.json
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

Explain **WHY**, not WHAT:

```typescript
// ✅ Good: Explains reasoning
// Use seed to control Math.random for deterministic results
Math.seedrandom(seed);

// ❌ Bad: States the obvious
// Set the seed variable
const seed = 12345;
```

## Testing Approach

### Test Structure (Jest)

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

Use descriptive names: `should <expected behavior> when <condition>`

## Git Commit Conventions

Follow Conventional Commits:

```bash
feat(simulation): implement TTK measurement in turns and actions
fix(loader): validate troopId existence before battle
docs(adr): add ADR-029 for parallel execution
refactor(config): simplify schema validation
test(simulation): add integration tests for battle timeout
```

## Key Domain Concepts

### TTK (Time-to-Kill) Measurement (ADR-020)

Dual metric system:

- **TTK Turns**: Number of full battle turns until all enemies defeated
- **TTK Actions**: Total actions executed by party members

### Trechos (Story Segments)

Configuration unit representing a story segment with:

- Level anchor range (min-max)
- TTK targets (turns + actions)
- Tolerance windows
- Associated troop IDs
- Party composition

### Skill Selection Strategy (ADR-019)

Maximize damage-per-action:

1. Filter skills by HP/MP cost (ADR-004)
2. Calculate damage per action for each skill
3. Select highest damage-per-action skill
4. Tie-breaking by action count (fewer actions preferred)

### Headless Runtime Mocking (ADR-015)

Required mocks for RPG Maker MZ in Node.js:

- **PIXI.js**: Container, Sprite (minimal implementations)
- **Graphics**: Video system (no-op methods)
- **Effekseer**: Particle effects (stubbed)
- **AudioManager**: Sound system (no-op)
- **Canvas API**: jest-canvas-mock (ADR-026)

### Database Loading Override (ADR-016)

Replace RPG Maker MZ's async XHR loading with synchronous `fs.readFileSync`:

```typescript
// Override DataManager._loadDataFile
DataManager._loadDataFile = function(name, src) {
  const data = fs.readFileSync(
    path.join(projectPath, 'data', src),
    'utf-8'
  );
  window[name] = JSON.parse(data);
};
```

## Essential Documentation

All architectural decisions are documented. Read these before implementation:

| Document | Path | Purpose |
|----------|------|---------|
| **README** | `README.md` | Project overview and status |
| **PRD** | `docs/PRD_Planilha_MestraSoftware_MVP_Balanceamento_v2.md` | Product requirements |
| **HLD** | `docs/hld-coreto-game-engine.md` | High-level design (1638 lines) |
| **ADR Index** | `docs/adrs/INDEX.md` | All 28 architectural decisions |
| **Serena Memories** | `.serena/memories/` | Project knowledge base |

### Key ADRs by Topic

**Foundation**: ADR-001 (Read-Only), ADR-005 (ID References), ADR-006 (No UI/CI in MVP)

**Simulation**: ADR-003 (Real Battle Engine), ADR-018 (Determinism), ADR-020 (TTK Metrics), ADR-019 (Skill Selection)

**Runtime**: ADR-014 (JSDOM), ADR-015 (Graphics Mocking), ADR-016 (Sync Loading), ADR-025 (Diagnostic Mode)

**Config**: ADR-008 (Zod), ADR-021 (JSON), ADR-028 (TypeScript)

**Reporting**: ADR-011 (JSON Output), ADR-012 (Aggregation), ADR-013 (Warnings)

## Security Guidelines

### Path Validation

Always validate and sanitize file paths:

```typescript
function validateProjectPath(projectPath: string): void {
  // Prevent path traversal
  if (projectPath.includes('..')) {
    throw new Error('Invalid path: path traversal detected');
  }

  // Validate RPG Maker MZ project structure
  const markerFile = path.join(projectPath, 'game.rmmzproject');
  if (!fs.existsSync(markerFile)) {
    throw new Error('Invalid RPG Maker MZ project: game.rmmzproject not found');
  }
}
```

### Read-Only Enforcement

Implement filesystem guards:

```typescript
// Add runtime check to prevent accidental writes
const originalWriteFileSync = fs.writeFileSync;
fs.writeFileSync = function(file: string, ...args: any[]) {
  if (file.startsWith(projectPath)) {
    throw new Error('CRITICAL: Attempted write to RPG Maker MZ project directory');
  }
  return originalWriteFileSync(file, ...args);
};
```

## Performance Optimization (Planned)

1. **Cache Database**: Load RPG Maker MZ data once at startup, reuse across simulations
2. **Lazy Script Loading**: Load only required MZ core scripts (not plugins unless needed)
3. **Memoization**: Cache skill damage calculations for identical inputs

## When Starting Implementation

1. **Read HLD Section 4** (Component Details) for implementation specs
2. **Check ADRs** for specific modules you're implementing
3. **Start with Config Layer**: Lowest dependency, enables testing of upper layers
4. **Use Zod schemas** as single source of truth for validation and types
5. **Write tests first** for simulation logic (determinism requires test coverage)
6. **Validate read-only constraint** in every file operation

## Working with Serena MCP

This project uses Serena MCP for semantic code navigation. Key memories available:

- `project_overview`: High-level project context
- `tech_stack`: Technology decisions and versions
- `code_style_and_conventions`: Coding standards
- `project_structure`: Directory organization
- `suggested_commands`: Development workflow commands

Use symbolic tools (find_symbol, get_symbols_overview) instead of reading entire files when exploring code.
