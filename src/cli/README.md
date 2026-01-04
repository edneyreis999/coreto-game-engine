# CLI Layer

This layer provides the **command-line interface** for users to interact with the Coreto Game Engine. Built with **Oclif** (ADR-007).

## Structure

```
cli/
├── commands/     # Oclif command implementations
├── hooks/        # Oclif lifecycle hooks
├── ui/           # UI formatters and progress indicators
└── index.ts      # Entry point
```

## Rules

### Commands (`commands/`)

**Purpose**: Define CLI commands (e.g., `run-ttk`, `export-context`).

**Rules**:
- Extend Oclif `Command` base class
- Define flags and arguments using Oclif decorators
- Resolve dependencies from DI container
- Delegate business logic to **use cases** (never implement logic here)
- Handle presentation (formatting, colors, tables)
- Exit with appropriate exit codes (0 = success, 1 = error)

**Example**:
```typescript
import { Command, Flags } from '@oclif/core';
import { Container } from '@/infrastructure/di';
import { ExecuteBattleSimulation } from '@/core/use-cases';

export default class RunTTK extends Command {
  static description = 'Execute TTK validation for RPG Maker MZ project';

  static flags = {
    config: Flags.string({ required: true, description: 'Path to config JSON' }),
    seed: Flags.integer({ description: 'RNG seed for deterministic execution' }),
    verbose: Flags.boolean({ description: 'Enable verbose logging' }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(RunTTK);

    // Resolve dependencies from DI container
    const container = new Container();
    const useCase = container.resolve<ExecuteBattleSimulation>('ExecuteBattleSimulation');

    // Execute use case
    const result = await useCase.execute(flags.config, flags.seed);

    // Present results
    this.log(`TTK: ${result.ttkTurns} turns, ${result.ttkActions} actions`);
  }
}
```

### Hooks (`hooks/`)

**Purpose**: Oclif lifecycle hooks (init, postrun).

**Rules**:
- Use for cross-cutting concerns (logging setup, cleanup)
- Keep lightweight (no heavy computation)
- Handle errors gracefully

**Example**:
```typescript
// hooks/init.ts
import { Hook } from '@oclif/core';

const hook: Hook<'init'> = async function (opts) {
  // Initialize logger, set up environment
  process.on('unhandledRejection', (err) => {
    this.error(err as Error);
  });
};

export default hook;
```

### UI Components (`ui/`)

**Purpose**: Reusable UI formatters, progress bars, tables.

**Rules**:
- Use libraries like `cli-table3`, `chalk`, `ora`
- Keep presentation logic separate from commands
- Support `--no-color` flag for CI environments

**Example**:
```typescript
import Table from 'cli-table3';
import chalk from 'chalk';

export function formatTTKTable(results: BattleResult[]): string {
  const table = new Table({
    head: ['Troop ID', 'TTK Turns', 'TTK Actions', 'Status'],
  });

  results.forEach((result) => {
    table.push([
      result.troopId,
      result.ttkTurns,
      result.ttkActions,
      result.withinTolerance ? chalk.green('OK') : chalk.red('OUT'),
    ]);
  });

  return table.toString();
}
```

## Command Design Patterns

### Single Responsibility

Each command does **one thing**:

- `run-ttk`: Execute TTK validation
- `export-context`: Export AI-friendly context

### Flag Conventions

| Flag Type | Example | Purpose |
|-----------|---------|---------|
| Required | `--config` | Essential inputs |
| Optional | `--seed` | Override defaults |
| Boolean | `--verbose` | Toggle features |
| Multiple | `--trecho` | Repeatable values |

### Exit Codes

- `0`: Success
- `1`: User error (invalid config, missing file)
- `2`: Execution error (battle timeout, validation failure)

### Error Handling

```typescript
try {
  const result = await useCase.execute(config);
  this.log(formatResult(result));
} catch (error) {
  if (error instanceof ConfigLoadError) {
    this.error('Invalid configuration', { exit: 1 });
  } else if (error instanceof BattleExecutionError) {
    this.error('Battle execution failed', { exit: 2 });
  } else {
    throw error; // Unexpected error, let Oclif handle it
  }
}
```

## Testing

- **Unit tests**: Mock use cases, test command logic and flag parsing
- **E2E tests**: Test full CLI execution with real commands

Use Oclif's test helpers:

```typescript
import { runCommand } from '@oclif/test';

describe('run-ttk command', () => {
  it('executes TTK validation', async () => {
    const { stdout } = await runCommand(['run-ttk', '--config', 'test.json']);
    expect(stdout).toContain('TTK:');
  });
});
```

## Dependency Direction

```
CLI Layer → Infrastructure Layer → Core Layer
     ↓
  (uses DI container to resolve use cases)
```

**Critical Rule**: CLI commands orchestrate use cases. They do NOT implement business logic.

## CLI Workflow

```
User → CLI Command → DI Container → Use Case → Ports → Adapters → External Systems
                                        ↓
                                   Domain Entities
```

## Available Commands (Planned)

| Command | Description | Flags |
|---------|-------------|-------|
| `run-ttk` | Execute TTK validation | `--config`, `--seed`, `--trecho`, `--verbose`, `--diagnostic` |
| `export-context` | Export AI-friendly context | `--config`, `--output` |

## References

- [ADR-007: Oclif CLI Framework](../../docs/adrs/ADR-007-oclif-cli-framework.md)
- [ADR-025: Verbose and Diagnostic Modes](../../docs/adrs/ADR-025-verbose-diagnostic-modes.md)
- [HLD Section 3.3: CLI](../../docs/hld-coreto-game-engine.md)
